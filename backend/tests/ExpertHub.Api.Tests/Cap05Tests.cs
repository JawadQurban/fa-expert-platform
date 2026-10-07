using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using ExpertHub.Api.Assignments;
using ExpertHub.Core.Domain;
using ExpertHub.Infrastructure.Notifications;
using ExpertHub.Infrastructure.Persistence;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace ExpertHub.Api.Tests;

/// <summary>
/// BE-10 — CAP-05's chain, and the rules that make it safe: exactly three
/// candidates per person, one live offer per slot, a decision per candidate,
/// an offer nobody sends, re-routing that is slot-scoped, and three distinct
/// end states.
/// </summary>
public sealed class Cap05Tests
    : IClassFixture<WebApplicationFactory<Program>>, IAsyncLifetime, IDisposable
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly LocalDbFixture _database = new();
    private readonly TestOidc.FakeTokenEndpoint _tokenEndpoint = new();

    private WebApplicationFactory<Program>? _configured;

    /// <summary>A stored brochure every request in these tests references.</summary>
    private static string _brochureId = string.Empty;

    public Cap05Tests(WebApplicationFactory<Program> factory) => _factory = factory;

    public async Task InitializeAsync()
    {
        await _database.InitializeAsync();
        _configured = TestOidc.Configure(
            _factory,
            _tokenEndpoint,
            ("ConnectionStrings:ExpertHub", _database.ConnectionString));
        _brochureId = await TestDocuments.SeedAsync(_database);
    }

    public async Task DisposeAsync()
    {
        _configured?.Dispose();
        await _database.DisposeAsync();
    }

    public void Dispose() => _tokenEndpoint.Dispose();

    /* ── the chain: request → matching → pool → offer → engagement ─────────── */

    [Fact]
    public async Task A_request_becomes_a_pool_an_offer_and_an_engagement()
    {
        using var staff = await SignInAsync("cap05-staff", "موظف الإسناد", RoleCode.Manager);
        using var centre = await SignInAsync(
            "cap05-centre", "منسق المركز", RoleCode.CentreCoordinator);
        // Three matchable, plus one suspended the matrix must exclude.
        var trainers = await SeedTrainersAsync(3);
        var requestId = await CreateRequestAsync(centre);

        // The engine ranks and EXCLUDES separately — an exclusion is not a
        // low score, and the two lists never merge.
        var run = await PostAsync(staff,
            $"/api/v1/internal/assignment-requests/{requestId}/matching/run", null);
        Assert.Equal("mock-dm-gap-05-draft.1",
            run.GetProperty("model").GetProperty("version").GetString());
        // BR-0505 / F2/AC-2 — one person needed, so three candidates.
        Assert.Equal(3, run.GetProperty("requiredPoolSize").GetInt32());
        var ranked = run.GetProperty("ranked").EnumerateArray().ToArray();
        Assert.Equal(3, ranked.Length);
        // The fourth is excluded, with its REASON — a suspended file.
        var excluded = run.GetProperty("excluded").EnumerateArray().Single();
        Assert.Contains("file-status",
            excluded.GetProperty("reasons").EnumerateArray().Select(r => r.GetString()));
        // F1/AC-3 — the weighted breakdown is carried, so the UI never
        // recomputes a ranking it was given.
        Assert.Equal(3, ranked[0].GetProperty("scores").GetArrayLength());

        var eligible = ranked.Select(r => r.GetProperty("trainerId").GetString()!).ToArray();

        // «no fewer, no more» — a pool of two is refused, and so is one that
        // contains an excluded candidate (the exclusions apply on BOTH paths).
        var tooFew = await staff.PostAsJsonAsync(
            $"/api/v1/internal/assignment-requests/{requestId}/pool",
            new { trainerIds = eligible.Take(2) });
        Assert.Equal(HttpStatusCode.BadRequest, tooFew.StatusCode);

        var withExcluded = await staff.PostAsJsonAsync(
            $"/api/v1/internal/assignment-requests/{requestId}/pool",
            new { trainerIds = new[] { eligible[0], eligible[1], trainers.Suspended.ToString() } });
        Assert.Equal(HttpStatusCode.BadRequest, withExcluded.StatusCode);
        var problem = await withExcluded.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("excluded-candidate", problem.GetProperty("detail").GetString());

        var pool = await PostAsync(staff,
            $"/api/v1/internal/assignment-requests/{requestId}/pool",
            new { trainerIds = eligible });
        Assert.Equal("sent", pool.GetProperty("status").GetString());
        ContractFixtures.Verify("internal.candidate-pool", pool);
        Assert.All(pool.GetProperty("members").EnumerateArray(),
            m => Assert.Equal("pending", m.GetProperty("decision").GetString()));

        // F4/AC-1 — a decision PER candidate, and a preference among the
        // approved. There is no group verdict to give.
        var decided = await PostAsync(centre,
            $"/api/v1/internal/assignment-requests/{requestId}/pool/decision",
            new
            {
                decisions = new object[]
                {
                    new { trainerId = eligible[0], decision = "approved", preferenceRank = 1 },
                    new { trainerId = eligible[1], decision = "approved", preferenceRank = 2 },
                    new { trainerId = eligible[2], decision = "rejected", preferenceRank = (int?)null },
                },
            });
        Assert.Equal("decided", decided.GetProperty("status").GetString());

        // J-18/F1/AC-1 — the SYSTEM created the offer for the top preference.
        // Nobody sent it: there is no endpoint that could.
        var slots = await GetAsync(staff,
            $"/api/v1/internal/assignment-requests/{requestId}/slots");
        ContractFixtures.Verify("internal.request-slots", slots);
        var slot = slots.EnumerateArray().Single();
        var offer = slot.GetProperty("currentOffer");
        Assert.Equal(eligible[0], offer.GetProperty("trainerId").GetString());
        Assert.Equal("awaiting-response", offer.GetProperty("status").GetString());
        // The 3-day window comes from the CENTRAL matrix (SLA-0501).
        Assert.Equal("SLA-0501",
            offer.GetProperty("responseSla").GetProperty("slaId").GetString());
        // F1/AC-2 — the second preference is a BACKUP, untouched.
        Assert.Equal(eligible[1],
            slot.GetProperty("backups").EnumerateArray().Single()
                .GetProperty("trainerId").GetString());

        // The trainer accepts → engagement, and the slot syncs to FAST on its
        // own (per slot, «with no waiting for the remaining slots»).
        using var trainer = trainers.Clients[eligible[0]];
        var offerId = offer.GetProperty("offerId").GetString()!;
        ContractFixtures.Verify("me.assignment-offers", await GetAsync(trainer, "/api/v1/me/assignment-offers"));
        var engagements = await PostAsync(trainer,
            $"/api/v1/me/assignment-offers/{offerId}/response", new { response = "accept" });
        ContractFixtures.Verify("me.engagements", engagements);
        var engagement = engagements.EnumerateArray().Single();
        Assert.Equal("upcoming", engagement.GetProperty("lifecycle").GetString());

        await using var db = _database.CreateContext();
        var slotRow = await db.AssignmentSlots.SingleAsync();
        Assert.NotNull(slotRow.ConfirmedEngagementId);
        Assert.Equal("processing", slotRow.FastSyncState);
        // The engagement is queued to FAST as its own outbox message.
        Assert.True(await db.OutboxMessages.AnyAsync(
            m => m.EntityType == "ENGAGEMENT" && m.Status == "pending"));
    }

    /* ── J-18/F2 — one live offer, then the next, then exhaustion ──────────── */

    [Fact]
    public async Task A_refusal_passes_the_offer_on_and_running_out_exhausts_the_slot()
    {
        using var staff = await SignInAsync("cap05-staff2", "موظف", RoleCode.Manager);
        using var centre = await SignInAsync(
            "cap05-centre2", "منسق المركز", RoleCode.CentreCoordinator);
        var trainers = await SeedTrainersAsync(3);
        var requestId = await CreateRequestAsync(centre);
        var eligible = await ApprovePoolAsync(staff, centre, requestId, trainers);

        // The first refuses → the offer passes to the SECOND preference, and
        // only then: one live offer per slot at a time.
        var firstOfferId = await CurrentOfferIdAsync(staff, requestId);
        await PostAsync(trainers.Clients[eligible[0]],
            $"/api/v1/me/assignment-offers/{firstOfferId}/response", new { response = "reject" });

        var afterFirst = await GetAsync(staff,
            $"/api/v1/internal/assignment-requests/{requestId}/slots");
        var slot = afterFirst.EnumerateArray().Single();
        Assert.Equal(eligible[1],
            slot.GetProperty("currentOffer").GetProperty("trainerId").GetString());
        Assert.False(slot.GetProperty("exhausted").GetBoolean());

        // The second refuses too, and the third was rejected at the pool — so
        // the slot has nowhere left to go (F2/AC-5). That is J-19's trigger.
        var secondOfferId = await CurrentOfferIdAsync(staff, requestId);
        await PostAsync(trainers.Clients[eligible[1]],
            $"/api/v1/me/assignment-offers/{secondOfferId}/response", new { response = "reject" });

        var exhausted = (await GetAsync(staff,
            $"/api/v1/internal/assignment-requests/{requestId}/slots"))
            .EnumerateArray().Single();
        Assert.True(exhausted.GetProperty("exhausted").GetBoolean());
        Assert.Equal(JsonValueKind.Null, exhausted.GetProperty("currentOffer").ValueKind);
        Assert.Equal(2, exhausted.GetProperty("history").GetArrayLength());

        // An answer to an offer already answered is refused.
        var again = await trainers.Clients[eligible[1]].PostAsJsonAsync(
            $"/api/v1/me/assignment-offers/{secondOfferId}/response", new { response = "accept" });
        Assert.Equal(HttpStatusCode.Conflict, again.StatusCode);
    }

    /* ── J-17/F4/AC-2 — the requesting party's ranking decides the offer order ─ */

    [Fact]
    public async Task The_preference_order_the_page_sends_decides_who_is_offered_first()
    {
        using var staff = await SignInAsync("cap05-staff-order", "موظف", RoleCode.Manager);
        using var centre = await SignInAsync(
            "cap05-centre-order", "منسق المركز", RoleCode.CentreCoordinator);
        using var trainers = await SeedTrainersAsync(3);
        var requestId = await CreateRequestAsync(centre);
        var run = await PostAsync(staff,
            $"/api/v1/internal/assignment-requests/{requestId}/matching/run", null);
        var ranked = run.GetProperty("ranked").EnumerateArray()
            .Select(r => r.GetProperty("trainerId").GetString()!).ToArray();
        await PostAsync(staff, $"/api/v1/internal/assignment-requests/{requestId}/pool",
            new { trainerIds = ranked });
        var path = $"/api/v1/internal/assignment-requests/{requestId}/pool/decision";

        // The page's exact body: decisions WITHOUT ranks, plus `preferenceOrder`.
        // The requesting party prefers the engine's THIRD over its second.
        var decisions = new object[]
        {
            new { trainerId = ranked[0], decision = "rejected" },
            new { trainerId = ranked[1], decision = "approved" },
            new { trainerId = ranked[2], decision = "approved" },
        };

        // An order that does not name exactly the approved candidates is refused.
        var wrongOrder = await centre.PostAsJsonAsync(path,
            new { decisions, preferenceOrder = new[] { ranked[1] } });
        Assert.Equal(HttpStatusCode.BadRequest, wrongOrder.StatusCode);
        Assert.Contains("preference-order-invalid",
            await wrongOrder.Content.ReadAsStringAsync(), StringComparison.Ordinal);

        var decided = await PostAsync(centre, path,
            new { decisions, preferenceOrder = new[] { ranked[2], ranked[1] } });
        var members = decided.GetProperty("members").EnumerateArray()
            .ToDictionary(m => m.GetProperty("trainerId").GetString()!, m => m);
        Assert.Equal(1, members[ranked[2]].GetProperty("preferenceRank").GetInt32());
        Assert.Equal(2, members[ranked[1]].GetProperty("preferenceRank").GetInt32());

        // …and that ranking reaches the offer: the top preference gets the offer,
        // the second is the backup.
        var slot = (await GetAsync(staff,
            $"/api/v1/internal/assignment-requests/{requestId}/slots")).EnumerateArray().Single();
        Assert.Equal(ranked[2], slot.GetProperty("currentOffer").GetProperty("trainerId").GetString());
        Assert.Equal(ranked[1],
            slot.GetProperty("backups").EnumerateArray().Single().GetProperty("trainerId").GetString());
    }

    /* ── J-16/F5 — a named person skips matching, never governance ──────────── */

    [Fact]
    public async Task A_named_trainer_goes_straight_to_the_offer_as_the_sole_candidate()
    {
        using var staff = await SignInAsync("cap05-staff-named", "موظف", RoleCode.Manager);
        using var centre = await SignInAsync(
            "cap05-centre-named", "منسق المركز", RoleCode.CentreCoordinator);
        using var trainers = await SeedTrainersAsync(2);
        var named = trainers.Clients.Keys.First();

        // The dropdown lists the people approved for THIS service — never the
        // suspended file.
        var options = await GetAsync(centre,
            "/api/v1/internal/assignment-requests/lookups/nominees?service=trainer");
        var offered = options.EnumerateArray().Select(o => o.GetProperty("value").GetString()).ToList();
        Assert.Contains(named, offered);
        Assert.DoesNotContain(trainers.Suspended.ToString(), offered);
        var forConsultant = await GetAsync(centre,
            "/api/v1/internal/assignment-requests/lookups/nominees?service=consultant");
        Assert.Empty(forConsultant.EnumerateArray());

        var body = GeneralProgramRequest();
        body["specificNominee"] = named;
        var created = await PostAsync(centre, "/api/v1/internal/assignment-requests/", body);
        var requestId = created.GetProperty("requestId").GetString()!;
        Assert.Equal("nominated", created.GetProperty("status").GetString());

        // No matching run, no pool to assemble — the offer already went to them.
        await using (var db = _database.CreateContext())
        {
            var id = Guid.Parse(requestId);
            Assert.False(await db.MatchingRuns.AnyAsync(r => r.RequestId == id));
            var pool = await db.CandidatePools.SingleAsync(p => p.RequestId == id);
            Assert.Equal("named", pool.Path);
            Assert.Equal("decided", pool.Status);
        }
        var slot = (await GetAsync(staff,
            $"/api/v1/internal/assignment-requests/{requestId}/slots")).EnumerateArray().Single();
        Assert.Equal(named, slot.GetProperty("currentOffer").GetProperty("trainerId").GetString());

        // The offer / acceptance workflow is the normal one.
        var offerId = slot.GetProperty("currentOffer").GetProperty("offerId").GetString();
        var accepted = await PostAsync(trainers.Clients[named],
            $"/api/v1/me/assignment-offers/{offerId}/response", new { response = "accept" });
        Assert.Equal("upcoming", accepted.EnumerateArray().Single().GetProperty("lifecycle").GetString());
    }

    [Fact]
    public async Task A_named_trainer_who_fails_governance_creates_nothing()
    {
        using var centre = await SignInAsync(
            "cap05-centre-named2", "منسق المركز", RoleCode.CentreCoordinator);
        using var trainers = await SeedTrainersAsync(1);

        var suspended = GeneralProgramRequest();
        suspended["specificNominee"] = trainers.Suspended.ToString();
        var refused = await centre.PostAsJsonAsync("/api/v1/internal/assignment-requests/", suspended);
        Assert.Equal(HttpStatusCode.BadRequest, refused.StatusCode);
        var problem = await refused.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("nominee-not-eligible", problem.GetProperty("detail").GetString());
        Assert.Contains(problem.GetProperty("reasons").EnumerateArray(),
            r => r.GetString() == "file-status");

        // A trainer who is not accredited for the request's service is refused too.
        var consultation = ConsultationRequest("consultations");
        consultation["specificNominee"] = trainers.Clients.Keys.Single();
        var wrongService = await centre.PostAsJsonAsync("/api/v1/internal/assignment-requests/", consultation);
        Assert.Equal(HttpStatusCode.BadRequest, wrongService.StatusCode);

        var unknown = GeneralProgramRequest();
        unknown["specificNominee"] = Guid.NewGuid().ToString();
        var notATrainer = await centre.PostAsJsonAsync("/api/v1/internal/assignment-requests/", unknown);
        Assert.Equal(HttpStatusCode.BadRequest, notATrainer.StatusCode);

        await using var db = _database.CreateContext();
        Assert.False(await db.AssignmentRequests.AnyAsync());
    }

    [Fact]
    public async Task When_the_named_trainer_declines_the_slot_falls_back_to_matching()
    {
        using var staff = await SignInAsync("cap05-staff-named3", "موظف", RoleCode.Manager);
        using var centre = await SignInAsync(
            "cap05-centre-named3", "منسق المركز", RoleCode.CentreCoordinator);
        using var trainers = await SeedTrainersAsync(3);
        var named = trainers.Clients.Keys.First();
        var body = GeneralProgramRequest();
        body["specificNominee"] = named;
        var requestId = (await PostAsync(centre, "/api/v1/internal/assignment-requests/", body))
            .GetProperty("requestId").GetString()!;

        var offerId = await CurrentOfferIdAsync(staff, requestId);
        await PostAsync(trainers.Clients[named],
            $"/api/v1/me/assignment-offers/{offerId}/response", new { response = "reject" });

        // No backups exist (J-17 was bypassed), so the slot is exhausted —
        // and matching runs for it, as for any request (J-19/F3).
        var slot = (await GetAsync(staff,
            $"/api/v1/internal/assignment-requests/{requestId}/slots")).EnumerateArray().Single();
        Assert.True(slot.GetProperty("exhausted").GetBoolean());
        var rerun = await PostAsync(staff,
            $"/api/v1/internal/assignment-requests/{requestId}/slots/1/matching/run", null);
        Assert.Equal(3, rerun.GetProperty("ranked").GetArrayLength());
    }

    /* ── J-19 — re-routing is SLOT-scoped, and counted, never capped ───────── */

    [Fact]
    public async Task Re_routing_runs_on_the_slot_and_the_cycle_is_counted()
    {
        using var staff = await SignInAsync("cap05-staff3", "موظف", RoleCode.Manager);
        using var centre = await SignInAsync(
            "cap05-centre3", "منسق المركز", RoleCode.CentreCoordinator);
        var trainers = await SeedTrainersAsync(3);
        var requestId = await CreateRequestAsync(centre);
        var eligible = await ApprovePoolAsync(staff, centre, requestId, trainers);
        foreach (var index in new[] { 0, 1 })
        {
            var offerId = await CurrentOfferIdAsync(staff, requestId);
            await PostAsync(trainers.Clients[eligible[index]],
                $"/api/v1/me/assignment-offers/{offerId}/response", new { response = "reject" });
        }

        // The slot's own cycle view — and its SIBLINGS, so staff see the rest
        // of the request without the re-routing touching them (`P-95`).
        var cycle = await GetAsync(staff,
            $"/api/v1/internal/assignment-requests/{requestId}/slots/1/cycle");
        Assert.Equal(1, cycle.GetProperty("slotNumber").GetInt32());
        Assert.Equal(1, cycle.GetProperty("cycleNumber").GetInt32());
        Assert.Equal("exhausted", cycle.GetProperty("status").GetString());
        Assert.Equal(2, cycle.GetProperty("previouslyOffered").GetArrayLength());
        Assert.Empty(cycle.GetProperty("siblings").EnumerateArray());

        // A fresh pool for THIS slot only — three again, because a re-routed
        // slot still needs one person.
        var slotRun = await PostAsync(staff,
            $"/api/v1/internal/assignment-requests/{requestId}/slots/1/matching/run", null);
        Assert.Equal(3, slotRun.GetProperty("requiredPoolSize").GetInt32());

        var slotPool = await PostAsync(staff,
            $"/api/v1/internal/assignment-requests/{requestId}/slots/1/pool",
            new { trainerIds = eligible });
        Assert.Equal("sent", slotPool.GetProperty("status").GetString());
        Assert.Equal(1, slotPool.GetProperty("requiredHeadcount").GetInt32());
        var awaiting = await GetAsync(staff,
            $"/api/v1/internal/assignment-requests/{requestId}/slots/1/cycle");
        Assert.Equal("awaiting_approval", awaiting.GetProperty("status").GetString());
        ContractFixtures.Verify("internal.slot-cycle", awaiting);

        // Approving the third — the one the first pool rejected — reopens the
        // slot with an offer to them.
        await PostAsync(centre,
            $"/api/v1/internal/assignment-requests/{requestId}/slots/1/pool/decision",
            new
            {
                decisions = new object[]
                {
                    new { trainerId = eligible[2], decision = "approved", preferenceRank = 1 },
                },
            });
        var reopened = (await GetAsync(staff,
            $"/api/v1/internal/assignment-requests/{requestId}/slots"))
            .EnumerateArray().Single();
        Assert.False(reopened.GetProperty("exhausted").GetBoolean());
        Assert.Equal(eligible[2],
            reopened.GetProperty("currentOffer").GetProperty("trainerId").GetString());
    }

    /* ── J-22 — three distinct end states, two separate reason lists ───────── */

    [Fact]
    public async Task Withdrawal_and_de_linking_end_an_engagement_differently_and_reopen_the_slot()
    {
        using var staff = await SignInAsync("cap05-staff4", "موظف", RoleCode.Manager);
        using var centre = await SignInAsync(
            "cap05-centre4", "منسق المركز", RoleCode.CentreCoordinator);
        var trainers = await SeedTrainersAsync(3);
        var requestId = await CreateRequestAsync(centre);
        var eligible = await ApprovePoolAsync(staff, centre, requestId, trainers);
        var offerId = await CurrentOfferIdAsync(staff, requestId);
        var accepted = await PostAsync(trainers.Clients[eligible[0]],
            $"/api/v1/me/assignment-offers/{offerId}/response", new { response = "accept" });
        var engagementId = accepted.EnumerateArray().Single()
            .GetProperty("engagementId").GetString()!;

        // The lists are kept APART: «Administrative Decision» is not a reason
        // a trainer can give.
        var wrongList = await trainers.Clients[eligible[0]].PostAsJsonAsync(
            $"/api/v1/me/engagements/{engagementId}/withdrawal",
            new { reason = "administrative-decision" });
        Assert.Equal(HttpStatusCode.BadRequest, wrongList.StatusCode);

        // «other» without its text is not a reason at all.
        var noNote = await trainers.Clients[eligible[0]].PostAsJsonAsync(
            $"/api/v1/me/engagements/{engagementId}/withdrawal",
            new { reason = "other", note = "  " });
        Assert.Equal(HttpStatusCode.BadRequest, noNote.StatusCode);

        var withdrawn = await PostAsync(trainers.Clients[eligible[0]],
            $"/api/v1/me/engagements/{engagementId}/withdrawal",
            new { reason = "personal-emergency" });
        Assert.Equal("withdrawn", withdrawn.GetProperty("kind").GetString());
        ContractFixtures.Verify("me.engagement-termination", withdrawn);

        // The slot reopened and the next approved candidate's turn came.
        var reopened = (await GetAsync(staff,
            $"/api/v1/internal/assignment-requests/{requestId}/slots"))
            .EnumerateArray().Single();
        Assert.Equal(eligible[1],
            reopened.GetProperty("currentOffer").GetProperty("trainerId").GetString());

        // Staff de-link the replacement: the SAME mechanism, a different end
        // state and a different reason list (`P-113`).
        var secondOfferId = await CurrentOfferIdAsync(staff, requestId);
        var secondEngagements = await PostAsync(trainers.Clients[eligible[1]],
            $"/api/v1/me/assignment-offers/{secondOfferId}/response", new { response = "accept" });
        var secondId = secondEngagements.EnumerateArray().Single()
            .GetProperty("engagementId").GetString()!;

        var staffWrongList = await staff.PostAsJsonAsync(
            $"/api/v1/internal/engagements/{secondId}/delink",
            new { reason = "personal-emergency" });
        Assert.Equal(HttpStatusCode.BadRequest, staffWrongList.StatusCode);

        var delinked = await PostAsync(staff,
            $"/api/v1/internal/engagements/{secondId}/delink",
            new { reason = "operational-need-change" });
        // J-22/F3/AC-5 (`P-111`) — de-linking ends it as WITHDRAWN too; who
        // ended it is on the record. `cancelled` belongs to FAST alone.
        Assert.Equal("withdrawn", delinked.GetProperty("kind").GetString());

        await using var db = _database.CreateContext();
        var terminations = await db.EngagementTerminations.ToListAsync();
        Assert.Equal(2, terminations.Count);
        Assert.Contains(terminations, t => t.Kind == "withdrawn" && t.Actor == "trainer");
        Assert.Contains(terminations, t => t.Kind == "withdrawn" && t.Actor == "staff");
    }

    /* ── J-20 — approve or ask for changes; there is no rejection ──────────── */

    [Fact]
    public async Task Material_review_approves_or_asks_for_changes_and_never_rejects()
    {
        using var staff = await SignInAsync("cap05-staff5", "موظف", RoleCode.Manager);
        using var centre = await SignInAsync(
            "cap05-centre5", "منسق المركز", RoleCode.CentreCoordinator);
        var trainers = await SeedTrainersAsync(3);
        var requestId = await CreateRequestAsync(centre);
        var eligible = await ApprovePoolAsync(staff, centre, requestId, trainers);
        var offerId = await CurrentOfferIdAsync(staff, requestId);
        await PostAsync(trainers.Clients[eligible[0]],
            $"/api/v1/me/assignment-offers/{offerId}/response", new { response = "accept" });

        // F4 — the submission opened on confirmation, awaiting upload.
        var mine = await GetAsync(trainers.Clients[eligible[0]], "/api/v1/me/submissions");
        var submission = mine.EnumerateArray().Single();
        Assert.Equal("awaiting_upload", submission.GetProperty("status").GetString());
        var submissionId = submission.GetProperty("submissionId").GetString()!;

        await PostAsync(trainers.Clients[eligible[0]],
            $"/api/v1/me/submissions/{submissionId}/upload",
            new { fileName = "material-v1.pdf" });

        // There is NO rejection in J-20 — an unknown decision is unknown.
        var rejected = await staff.PostAsJsonAsync(
            $"/api/v1/internal/submissions/{submissionId}/decision",
            new { decision = "rejected", note = "لا" });
        Assert.Equal(HttpStatusCode.BadRequest, rejected.StatusCode);

        // …and asking for changes without saying what to change is refused.
        var noNote = await staff.PostAsJsonAsync(
            $"/api/v1/internal/submissions/{submissionId}/decision",
            new { decision = "changes-requested", note = "" });
        Assert.Equal(HttpStatusCode.BadRequest, noNote.StatusCode);

        var changes = await PostAsync(staff,
            $"/api/v1/internal/submissions/{submissionId}/decision",
            new { decision = "changes-requested", note = "أضف تمارين تطبيقية." });
        Assert.Equal("changes_requested", changes.GetProperty("status").GetString());
        ContractFixtures.Verify("internal.submission-detail", changes);
        ContractFixtures.Verify("internal.submissions", await GetAsync(staff, "/api/v1/internal/submissions"));
        ContractFixtures.Verify("me.submissions",
            await GetAsync(trainers.Clients[eligible[0]], "/api/v1/me/submissions"));

        // A second round, then approval — and the approved MATERIAL queues to
        // FAST (J-20/F3), which service content would not.
        await PostAsync(trainers.Clients[eligible[0]],
            $"/api/v1/me/submissions/{submissionId}/upload",
            new { fileName = "material-v2.pdf" });
        var approved = await PostAsync(staff,
            $"/api/v1/internal/submissions/{submissionId}/decision",
            new { decision = "approved" });
        Assert.Equal("approved", approved.GetProperty("status").GetString());
        Assert.Equal(2, approved.GetProperty("rounds").GetArrayLength());
        Assert.Equal("processing", approved.GetProperty("syncState").GetString());

        await using var db = _database.CreateContext();
        Assert.True(await db.OutboxMessages.AnyAsync(
            m => m.EntityType == "MATERIAL_SUBMISSION"));
    }

    /* ── J-21 — enrolment and attendance have no source, and say so ────────── */

    [Fact]
    public async Task The_execution_view_names_the_gap_instead_of_inventing_figures()
    {
        using var staff = await SignInAsync("cap05-staff6", "موظف", RoleCode.Manager);
        using var centre = await SignInAsync(
            "cap05-centre6", "منسق المركز", RoleCode.CentreCoordinator);
        var trainers = await SeedTrainersAsync(3);
        var requestId = await CreateRequestAsync(centre);
        var eligible = await ApprovePoolAsync(staff, centre, requestId, trainers);
        var offerId = await CurrentOfferIdAsync(staff, requestId);
        var engagements = await PostAsync(trainers.Clients[eligible[0]],
            $"/api/v1/me/assignment-offers/{offerId}/response", new { response = "accept" });
        var engagementId = engagements.EnumerateArray().Single()
            .GetProperty("engagementId").GetString()!;

        var detail = await GetAsync(trainers.Clients[eligible[0]],
            $"/api/v1/me/engagements/{engagementId}");
        ContractFixtures.Verify("me.engagement-detail", detail);
        // ⚠️ `Q20` — `plan.PlanTaker` is not supplied, so enrolment and
        // attendance are UNAVAILABLE with the gap named, never zeroes that
        // would read as "nobody enrolled".
        Assert.False(detail.GetProperty("enrolment").GetProperty("available").GetBoolean());
        Assert.Equal("Q20", detail.GetProperty("enrolment").GetProperty("reason").GetString());
        Assert.False(detail.GetProperty("attendance").GetProperty("available").GetBoolean());
        // J-21/F2 — the meeting link is FAST's; there is no feed, so null.
        Assert.Equal(JsonValueKind.Null,
            detail.GetProperty("details").GetProperty("meetingUrl").ValueKind);
    }

    /* ── RB-08 — an offer nobody answers expires on its own ────────────────── */

    [Fact]
    public async Task An_offer_nobody_answers_expires_on_its_own_and_can_never_be_accepted_afterwards()
    {
        using var staff = await SignInAsync("cap05-exp-staff", "موظف", RoleCode.Manager);
        using var centre = await SignInAsync("cap05-exp-centre", "منسق المركز", RoleCode.CentreCoordinator);
        using var trainers = await SeedTrainersAsync(3);
        var requestId = await CreateRequestAsync(centre);
        var eligible = await ApprovePoolAsync(staff, centre, requestId, trainers);
        var firstOfferId = Guid.Parse(await CurrentOfferIdAsync(staff, requestId));
        var now = DateTime.UtcNow;

        // A window that closes a minute from now is still open.
        await SetResponseDueAsync(firstOfferId, now.AddMinutes(1));
        Assert.Equal(0, await SweepAsync(now));

        // At the boundary it closes: due <= now.
        await SetResponseDueAsync(firstOfferId, now);
        Assert.Equal(1, await SweepAsync(now));
        // Idempotent — a second run finds nothing it already did.
        Assert.Equal(0, await SweepAsync(now));

        await using (var db = _database.CreateContext())
        {
            var expired = await db.AssignmentOffers.SingleAsync(o => o.OfferId == firstOfferId);
            Assert.Equal(OfferStatuses.Expired, expired.Status);
            Assert.Equal(now, expired.ExpiredAt!.Value, TimeSpan.FromSeconds(1));
            // «a distinct notification from explicit rejection»
            // Recorded even though routing is unapproved: generation ≠ delivery.
            var lapse = await db.NotificationOccurrences.SingleAsync(n => n.EventCode == "EV-0503");
            Assert.Equal(NotificationRoutingStatuses.Unrouted, lapse.RoutingStatus);
        }

        // Same effect as a refusal: the next-ranked candidate has the offer now.
        var slot = (await GetAsync(staff, $"/api/v1/internal/assignment-requests/{requestId}/slots"))
            .EnumerateArray().Single();
        Assert.Equal(eligible[1], slot.GetProperty("currentOffer").GetProperty("trainerId").GetString());

        // …and the expired offer can never be accepted afterwards.
        var late = await trainers.Clients[eligible[0]].PostAsJsonAsync(
            $"/api/v1/me/assignment-offers/{firstOfferId}/response", new { response = "accept" });
        Assert.Equal(HttpStatusCode.Conflict, late.StatusCode);
        await using var check = _database.CreateContext();
        Assert.False(await check.Engagements.AnyAsync());
    }

    [Fact]
    public async Task A_late_answer_expires_the_offer_instead_of_accepting_it()
    {
        using var staff = await SignInAsync("cap05-late-staff", "موظف", RoleCode.Manager);
        using var centre = await SignInAsync("cap05-late-centre", "منسق المركز", RoleCode.CentreCoordinator);
        using var trainers = await SeedTrainersAsync(3);
        var requestId = await CreateRequestAsync(centre);
        var eligible = await ApprovePoolAsync(staff, centre, requestId, trainers);
        var offerId = Guid.Parse(await CurrentOfferIdAsync(staff, requestId));
        await SetResponseDueAsync(offerId, DateTime.UtcNow.AddMinutes(-5));

        var late = await trainers.Clients[eligible[0]].PostAsJsonAsync(
            $"/api/v1/me/assignment-offers/{offerId}/response", new { response = "accept" });
        Assert.Equal(HttpStatusCode.Conflict, late.StatusCode);

        await using var db = _database.CreateContext();
        Assert.Equal(OfferStatuses.Expired, (await db.AssignmentOffers.SingleAsync(o => o.OfferId == offerId)).Status);
        Assert.False(await db.Engagements.AnyAsync());
        // The sweep that follows changes nothing: the late answer already claimed it.
        Assert.Equal(0, await SweepAsync(DateTime.UtcNow));
    }

    /* ── RB-09 — re-routing repeats, and a refuser may be offered again ────── */

    [Fact]
    public async Task Re_routing_repeats_cycle_after_cycle_and_may_re_include_an_earlier_refuser()
    {
        using var staff = await SignInAsync("cap05-cyc-staff", "موظف", RoleCode.Manager);
        using var centre = await SignInAsync("cap05-cyc-centre", "منسق المركز", RoleCode.CentreCoordinator);
        using var trainers = await SeedTrainersAsync(3);
        var requestId = await CreateRequestAsync(centre);
        var eligible = await ApprovePoolAsync(staff, centre, requestId, trainers);
        var slotsPath = $"/api/v1/internal/assignment-requests/{requestId}/slots";
        var cyclePath = $"{slotsPath}/1/cycle";

        // A declines → B is offered.
        await RespondAsync(trainers, eligible[0], await CurrentOfferIdAsync(staff, requestId), "reject");
        Assert.Equal(eligible[1], (await GetAsync(staff, slotsPath)).EnumerateArray().Single()
            .GetProperty("currentOffer").GetProperty("trainerId").GetString());

        // A and B decline → the slot is exhausted and cycle 1 opens.
        await RespondAsync(trainers, eligible[1], await CurrentOfferIdAsync(staff, requestId), "reject");
        var first = await GetAsync(staff, cyclePath);
        Assert.Equal(1, first.GetProperty("cycleNumber").GetInt32());
        Assert.Equal("exhausted", first.GetProperty("status").GetString());

        // Cycle 1: the requesting party approves A again — J-19/F1/AC-5 allows it.
        await PostAsync(staff, $"{slotsPath}/1/pool", new { trainerIds = eligible });
        await PostAsync(centre, $"{slotsPath}/1/pool/decision", new
        {
            decisions = new object[] { new { trainerId = eligible[0], decision = "approved" } },
            preferenceOrder = new[] { eligible[0] },
        });
        Assert.Equal(eligible[0], (await GetAsync(staff, slotsPath)).EnumerateArray().Single()
            .GetProperty("currentOffer").GetProperty("trainerId").GetString());
        Assert.Equal("decided", (await GetAsync(staff, cyclePath)).GetProperty("status").GetString());

        // A declines again → cycle 2. A decided pool no longer blocks a new one.
        await RespondAsync(trainers, eligible[0], await CurrentOfferIdAsync(staff, requestId), "reject");
        var second = await GetAsync(staff, cyclePath);
        Assert.Equal(2, second.GetProperty("cycleNumber").GetInt32());
        Assert.Equal("exhausted", second.GetProperty("status").GetString());
        await PostAsync(staff, $"{slotsPath}/1/pool", new { trainerIds = eligible });
        await PostAsync(centre, $"{slotsPath}/1/pool/decision", new
        {
            decisions = new object[] { new { trainerId = eligible[2], decision = "approved" } },
            preferenceOrder = new[] { eligible[2] },
        });
        await RespondAsync(trainers, eligible[2], await CurrentOfferIdAsync(staff, requestId), "accept");

        var done = (await GetAsync(staff, slotsPath)).EnumerateArray().Single();
        Assert.False(done.GetProperty("exhausted").GetBoolean());
        Assert.NotEqual(JsonValueKind.Null, done.GetProperty("confirmedEngagementId").ValueKind);

        await using var db = _database.CreateContext();
        var cycles = await db.SlotCycles.OrderBy(c => c.CycleNumber).ToListAsync();
        Assert.Equal([1, 2], cycles.Select(c => c.CycleNumber));
        Assert.All(cycles, c => Assert.Equal(SlotCycleStatuses.Decided, c.Status));
        Assert.All(cycles, c => Assert.NotNull(c.PoolId));
        // Every cycle's pool is kept — history, not overwritten.
        Assert.Equal(3, await db.CandidatePools.CountAsync());
    }

    /* ── J-17 — rejecting every candidate is an outcome, not a 400 ─────────── */

    [Fact]
    public async Task Rejecting_every_candidate_decides_the_pool_and_opens_re_routing()
    {
        using var staff = await SignInAsync("cap05-rej-staff", "موظف", RoleCode.Manager);
        using var centre = await SignInAsync("cap05-rej-centre", "منسق المركز", RoleCode.CentreCoordinator);
        using var trainers = await SeedTrainersAsync(3);
        var requestId = await CreateRequestAsync(centre);
        var run = await PostAsync(staff, $"/api/v1/internal/assignment-requests/{requestId}/matching/run", null);
        var eligible = run.GetProperty("ranked").EnumerateArray()
            .Select(r => r.GetProperty("trainerId").GetString()!).ToArray();
        await PostAsync(staff, $"/api/v1/internal/assignment-requests/{requestId}/pool", new { trainerIds = eligible });

        // Nothing approved and someone still undecided: an incomplete answer.
        var incomplete = await centre.PostAsJsonAsync(
            $"/api/v1/internal/assignment-requests/{requestId}/pool/decision",
            new { decisions = new object[] { new { trainerId = eligible[0], decision = "rejected" } } });
        Assert.Equal(HttpStatusCode.BadRequest, incomplete.StatusCode);

        var decided = await PostAsync(centre, $"/api/v1/internal/assignment-requests/{requestId}/pool/decision",
            new { decisions = eligible.Select(id => new { trainerId = id, decision = "rejected" }).ToArray() });
        Assert.Equal("decided", decided.GetProperty("status").GetString());

        var slot = (await GetAsync(staff, $"/api/v1/internal/assignment-requests/{requestId}/slots"))
            .EnumerateArray().Single();
        Assert.True(slot.GetProperty("exhausted").GetBoolean());
        Assert.Equal(JsonValueKind.Null, slot.GetProperty("currentOffer").ValueKind);
        var cycle = await GetAsync(staff, $"/api/v1/internal/assignment-requests/{requestId}/slots/1/cycle");
        Assert.Equal(1, cycle.GetProperty("cycleNumber").GetInt32());
        Assert.Equal("exhausted", cycle.GetProperty("status").GetString());
        await using var db = _database.CreateContext();
        Assert.Contains(await db.NotificationOccurrences.Select(n => n.EventCode).ToListAsync(), c => c == "EV-0504");
    }

    /* ── RB-12 — the server decides whether an engagement can still end ────── */

    [Fact]
    public async Task An_engagement_that_started_or_finished_cannot_be_withdrawn_or_de_linked()
    {
        using var staff = await SignInAsync("cap05-life-staff", "موظف", RoleCode.Manager);
        using var centre = await SignInAsync("cap05-life-centre", "منسق المركز", RoleCode.CentreCoordinator);
        using var trainers = await SeedTrainersAsync(3);

        foreach (var (from, to, lifecycle) in new[] { (-1, 1, "in_progress"), (-5, -3, "completed") })
        {
            var (engagementId, trainer) = await ConfirmedEngagementAsync(staff, centre, trainers, from, to);
            var withdraw = await trainer.PostAsJsonAsync(
                $"/api/v1/me/engagements/{engagementId}/withdrawal", new { reason = "personal-emergency" });
            await AssertProblemAsync(withdraw, HttpStatusCode.Conflict, "engagement-not-upcoming");
            var delink = await staff.PostAsJsonAsync(
                $"/api/v1/internal/engagements/{engagementId}/delink", new { reason = "operational-need-change" });
            await AssertProblemAsync(delink, HttpStatusCode.Conflict, "engagement-not-upcoming");
            var detail = await GetAsync(trainer, $"/api/v1/me/engagements/{engagementId}");
            Assert.Equal(lifecycle, detail.GetProperty("status").GetString());
        }

        await using var db = _database.CreateContext();
        Assert.False(await db.EngagementTerminations.AnyAsync());
        Assert.DoesNotContain(await db.Engagements.Select(e => e.Status).ToListAsync(),
            status => status is EngagementStatuses.Withdrawn or EngagementStatuses.Cancelled);
    }

    [Fact]
    public async Task The_notice_periods_are_four_days_for_the_trainer_and_a_day_for_staff()
    {
        using var staff = await SignInAsync("cap05-dl-staff", "موظف", RoleCode.Manager);
        using var centre = await SignInAsync("cap05-dl-centre", "منسق المركز", RoleCode.CentreCoordinator);
        using var trainers = await SeedTrainersAsync(3);
        // Starts in two days: inside the trainer's four, outside staff's one.
        var (engagementId, trainer) = await ConfirmedEngagementAsync(staff, centre, trainers, 2, 3);

        var withdraw = await trainer.PostAsJsonAsync(
            $"/api/v1/me/engagements/{engagementId}/withdrawal", new { reason = "personal-emergency" });
        await AssertProblemAsync(withdraw, HttpStatusCode.Conflict, "termination-deadline-passed");

        var delinked = await PostAsync(staff, $"/api/v1/internal/engagements/{engagementId}/delink",
            new { reason = "operational-need-change" });
        Assert.Equal("withdrawn", delinked.GetProperty("kind").GetString());
        var detail = await GetAsync(trainer, $"/api/v1/me/engagements/{engagementId}");
        Assert.Equal("withdrawn", detail.GetProperty("status").GetString());
        Assert.Equal("staff", detail.GetProperty("termination").GetProperty("actor").GetString());
        ContractFixtures.Verify("me.engagement-detail.terminated", detail);
    }

    [Fact]
    public async Task A_request_names_an_approved_centre_and_its_dates_never_run_backwards()
    {
        using var centre = await SignInAsync("cap05-ctr-centre", "منسق المركز", RoleCode.CentreCoordinator);

        // The five operational centres of the approved Assignment Matrix.
        var centres = await GetAsync(centre, "/api/v1/internal/assignment-requests/lookups/centres");
        Assert.Equal(
            ["البنوك والتمويل", "الأوراق المالية", "التامين", "البرامج الخاصة", "القيادات"],
            centres.EnumerateArray().Select(c => c.GetProperty("labelAr").GetString()));
        // …and none of them became access scope.
        await using (var db = _database.CreateContext())
        {
            Assert.False(await db.ReferenceValues.AnyAsync(v => v.ListCode == "centre"));
        }

        var unknownCentre = GeneralProgramRequest();
        unknownCentre["centreId"] = "centre-riyadh";
        var refused = await centre.PostAsJsonAsync("/api/v1/internal/assignment-requests/", unknownCentre);
        Assert.Equal(HttpStatusCode.BadRequest, refused.StatusCode);
        Assert.Contains("centreId", await refused.Content.ReadAsStringAsync(), StringComparison.Ordinal);

        var backwards = GeneralProgramRequest();
        backwards["dateFrom"] = "2026-11-03T00:00:00Z";
        backwards["dateTo"] = "2026-11-02T00:00:00Z";
        var backwardsResponse = await centre.PostAsJsonAsync("/api/v1/internal/assignment-requests/", backwards);
        Assert.Equal(HttpStatusCode.BadRequest, backwardsResponse.StatusCode);
        Assert.Contains("dateTo", await backwardsResponse.Content.ReadAsStringAsync(), StringComparison.Ordinal);

        // The brochure is the stored DOCUMENT, not a file name.
        var nameOnly = GeneralProgramRequest();
        nameOnly.Remove("attachmentId");
        var nameOnlyResponse = await centre.PostAsJsonAsync("/api/v1/internal/assignment-requests/", nameOnly);
        Assert.Equal(HttpStatusCode.BadRequest, nameOnlyResponse.StatusCode);
        Assert.Contains("attachmentId", await nameOnlyResponse.Content.ReadAsStringAsync(), StringComparison.Ordinal);
        var uploaded = await TestDocuments.UploadInternalAsync(centre, "assignment-brochure", "نشرة.pdf");
        Assert.Equal("not-scanned", uploaded.GetProperty("scanStatus").GetString());
        var withDocument = GeneralProgramRequest();
        withDocument["attachmentId"] = uploaded.GetProperty("attachmentId").GetString();
        await PostAsync(centre, "/api/v1/internal/assignment-requests/", withDocument);
        // A wrong format is refused by the same rule the application form uses.
        using (var text = new MultipartFormDataContent())
        {
            text.Add(new StringContent("assignment-brochure"), "purpose");
            text.Add(new ByteArrayContent("plain"u8.ToArray()), "file", "notes.txt");
            var refusedFormat = await centre.PostAsync("/api/v1/internal/attachments", text);
            Assert.Equal((HttpStatusCode)422, refusedFormat.StatusCode);
        }

        // The boundary: the same day is a one-day request, and allowed.
        var sameDay = GeneralProgramRequest();
        sameDay["dateFrom"] = "2026-11-03T00:00:00Z";
        sameDay["dateTo"] = "2026-11-03T00:00:00Z";
        await PostAsync(centre, "/api/v1/internal/assignment-requests/", sameDay);
    }

    /* ── helpers for the remediation tests ─────────────────────────────────── */

    private async Task SetResponseDueAsync(Guid offerId, DateTime dueAt)
    {
        await using var db = _database.CreateContext();
        await db.AssignmentOffers.Where(o => o.OfferId == offerId)
            .ExecuteUpdateAsync(set => set.SetProperty(o => o.ResponseDueAt, dueAt));
    }

    private async Task<int> SweepAsync(DateTime now)
    {
        using var scope = _configured!.Services.CreateScope();
        return await OfferService.ExpireDueOffersAsync(
            scope.ServiceProvider.GetRequiredService<ExpertHubDbContext>(),
            scope.ServiceProvider.GetRequiredService<NotificationDispatcher>(),
            now,
            CancellationToken.None);
    }

    private static async Task RespondAsync(
        SeededTrainers trainers, string trainerId, string offerId, string response) =>
        await PostAsync(trainers.Clients[trainerId],
            $"/api/v1/me/assignment-offers/{offerId}/response", new { response });

    private static async Task AssertProblemAsync(HttpResponseMessage response, HttpStatusCode status, string detail)
    {
        var body = await response.Content.ReadAsStringAsync();
        Assert.True(response.StatusCode == status, $"Expected {(int)status}, got {(int)response.StatusCode}: {body}");
        Assert.Equal(detail, JsonSerializer.Deserialize<JsonElement>(body).GetProperty("detail").GetString());
    }

    /// <summary>A request dated relative to today, matched, approved and accepted.</summary>
    private static async Task<(string EngagementId, HttpClient Trainer)> ConfirmedEngagementAsync(
        HttpClient staff, HttpClient centre, SeededTrainers trainers, int fromDays, int toDays)
    {
        var body = GeneralProgramRequest();
        body["dateFrom"] = DateTime.UtcNow.Date.AddDays(fromDays).ToString("yyyy-MM-dd'T'00:00:00'Z'", System.Globalization.CultureInfo.InvariantCulture);
        body["dateTo"] = DateTime.UtcNow.Date.AddDays(toDays).ToString("yyyy-MM-dd'T'00:00:00'Z'", System.Globalization.CultureInfo.InvariantCulture);
        var requestId = (await PostAsync(centre, "/api/v1/internal/assignment-requests/", body))
            .GetProperty("requestId").GetString()!;
        var run = await PostAsync(staff, $"/api/v1/internal/assignment-requests/{requestId}/matching/run", null);
        var eligible = run.GetProperty("ranked").EnumerateArray()
            .Select(r => r.GetProperty("trainerId").GetString()!).ToArray();
        await PostAsync(staff, $"/api/v1/internal/assignment-requests/{requestId}/pool", new { trainerIds = eligible });
        await PostAsync(centre, $"/api/v1/internal/assignment-requests/{requestId}/pool/decision", new
        {
            decisions = new object[] { new { trainerId = eligible[0], decision = "approved" } },
            preferenceOrder = new[] { eligible[0] },
        });
        var trainer = trainers.Clients[eligible[0]];
        var slots = await GetAsync(staff, $"/api/v1/internal/assignment-requests/{requestId}/slots");
        var offerId = slots.EnumerateArray().Single().GetProperty("currentOffer").GetProperty("offerId").GetString()!;
        var engagements = await PostAsync(trainer, $"/api/v1/me/assignment-offers/{offerId}/response",
            new { response = "accept" });
        var engagement = engagements.EnumerateArray()
            .First(e => e.GetProperty("requestId").GetString() == requestId);
        return (engagement.GetProperty("engagementId").GetString()!, trainer);
    }

    /* ── Notion «Assignment Matrix» — types, routing, required fields, values ── */

    [Fact]
    public async Task The_ten_approved_request_types_route_to_their_services()
    {
        using var centre = await SignInAsync("cap05-centre7", "منسق المركز", RoleCode.CentreCoordinator);
        foreach (var (requestType, service) in new[]
        {
            ("general-program", "trainer"),
            ("private-program", "trainer"),
            // ⚠️ Notion routes these three to Speaker (J-04, not built) — the
            // owner kept them on trainer until it exists (`P-341`).
            ("training-workshop", "trainer"),
            ("meeting", "trainer"),
            ("seminar", "trainer"),
            ("content-development-request", "content-developer"),
            ("question-writing", "question-writer"),
            ("consultations", "consultant"),
            ("other", "consultant"),
        })
        {
            var body = requestType is "consultations" or "other"
                ? ConsultationRequest(requestType)
                : GeneralProgramRequest();
            body["requestType"] = requestType;
            if (requestType == "private-program")
            {
                body["clientName"] = "جهة خاصة";
            }
            var created = await PostAsync(centre, "/api/v1/internal/assignment-requests/", body);
            Assert.Equal(service, created.GetProperty("serviceType").GetString());
        }
    }

    [Fact]
    public async Task Technical_presentations_are_matched_against_the_category_the_requester_picks()
    {
        // Notion «Assignment Matrix», 2026-09-29: «عروض فنية / محاور البرامج» →
        // «مطوّر محتوى أو مدرب» (`P-341`).
        using var centre = await SignInAsync("cap05-centre10", "منسق المركز", RoleCode.CentreCoordinator);
        const string path = "/api/v1/internal/assignment-requests/";

        foreach (var service in new[] { "content-developer", "trainer" })
        {
            var body = GeneralProgramRequest();
            body["requestType"] = "technical-presentations";
            body["serviceType"] = service;
            var created = await PostAsync(centre, path, body);
            Assert.Equal(service, created.GetProperty("serviceType").GetString());
        }

        async Task<(string Detail, string[] Fields)> RefusedAsync(Dictionary<string, object?> body)
        {
            var response = await centre.PostAsJsonAsync(path, body);
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
            var problem = await response.Content.ReadFromJsonAsync<JsonElement>();
            return (problem.GetProperty("detail").GetString()!,
                [.. problem.GetProperty("fields").EnumerateArray().Select(f => f.GetString()!)]);
        }

        // No choice made: the type allows two, so neither is assumed.
        var unchosen = GeneralProgramRequest();
        unchosen["requestType"] = "technical-presentations";
        var (detail, fields) = await RefusedAsync(unchosen);
        Assert.Equal("required-field-missing", detail);
        Assert.Equal(["serviceType"], fields);

        // A category the type does not route to.
        var consultant = GeneralProgramRequest();
        consultant["requestType"] = "technical-presentations";
        consultant["serviceType"] = "consultant";
        (detail, fields) = await RefusedAsync(consultant);
        Assert.Equal("invalid-field-value", detail);
        Assert.Equal(["serviceType"], fields);

        // A single-category type cannot be steered to another category.
        var steered = GeneralProgramRequest();
        steered["serviceType"] = "content-developer";
        (detail, fields) = await RefusedAsync(steered);
        Assert.Equal("invalid-field-value", detail);
        Assert.Equal(["serviceType"], fields);
    }

    [Fact]
    public async Task A_request_is_refused_when_its_form_misses_a_required_field_or_uses_an_unapproved_value()
    {
        using var centre = await SignInAsync("cap05-centre8", "منسق المركز", RoleCode.CentreCoordinator);
        const string path = "/api/v1/internal/assignment-requests/";

        async Task<(string Detail, string[] Fields)> RefusedAsync(Dictionary<string, object?> body)
        {
            var response = await centre.PostAsJsonAsync(path, body);
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
            var problem = await response.Content.ReadFromJsonAsync<JsonElement>();
            return (problem.GetProperty("detail").GetString()!,
                problem.TryGetProperty("fields", out var fields)
                    ? [.. fields.EnumerateArray().Select(f => f.GetString()!)]
                    : []);
        }

        // The merged types saved before the matrix are not selectable any more.
        var legacy = GeneralProgramRequest();
        legacy["requestType"] = "workshop";
        var (detail, fields) = await RefusedAsync(legacy);
        Assert.Equal("invalid-field-value", detail);
        Assert.Equal(["requestType"], fields);

        // Form 1 — the brochure is mandatory.
        var noBrochure = GeneralProgramRequest();
        noBrochure.Remove("attachmentName");
        (detail, fields) = await RefusedAsync(noBrochure);
        Assert.Equal("required-field-missing", detail);
        Assert.Equal(["attachmentName"], fields);

        // Form 2 — the client name is mandatory.
        var privateProgram = GeneralProgramRequest();
        privateProgram["requestType"] = "private-program";
        (detail, fields) = await RefusedAsync(privateProgram);
        Assert.Equal(["clientName"], fields);

        // Days are 1–8 or «أخرى»; «hybrid» is not an approved execution mode.
        var nineDays = GeneralProgramRequest();
        nineDays["daysCount"] = 9;
        nineDays["deliveryMechanism"] = "hybrid";
        (detail, fields) = await RefusedAsync(nineDays);
        Assert.Equal("invalid-field-value", detail);
        Assert.Equal(["daysCount", "deliveryMechanism"], fields);

        // «بث مباشر» belongs to form 3 only.
        var liveStream = GeneralProgramRequest();
        liveStream["deliveryMechanism"] = "live-stream";
        (_, fields) = await RefusedAsync(liveStream);
        Assert.Equal(["deliveryMechanism"], fields);

        // Form 6 — attachments and consultation type are mandatory, the
        // provisional consultation types are gone.
        var consultation = ConsultationRequest("consultations");
        consultation.Remove("attachmentName");
        (_, fields) = await RefusedAsync(consultation);
        Assert.Equal(["attachmentName"], fields);
        var oldType = ConsultationRequest("consultations");
        oldType["consultationType"] = "financial";
        (_, fields) = await RefusedAsync(oldType);
        Assert.Equal(["consultationType"], fields);

        // Accepted: form 3 with live stream and «أخرى» days, no client name;
        // form 6 with no expected hours and no beneficiary (both optional).
        var seminar = GeneralProgramRequest();
        seminar["requestType"] = "seminar";
        seminar["deliveryMechanism"] = "live-stream";
        seminar["daysCount"] = null;
        seminar["daysCountOther"] = true;
        await PostAsync(centre, path, seminar);
        await PostAsync(centre, path, ConsultationRequest("other"));
    }

    [Fact]
    public async Task A_request_saved_under_a_merged_type_before_the_matrix_still_lists()
    {
        using var centre = await SignInAsync("cap05-centre9", "منسق المركز", RoleCode.CentreCoordinator);
        await PostAsync(centre, "/api/v1/internal/assignment-requests/", GeneralProgramRequest());
        await using (var db = _database.CreateContext())
        {
            var saved = await db.AssignmentRequests.SingleAsync();
            // As a request from before the matrix looks: a merged type, its
            // form values as they were entered then.
            saved.RequestType = "workshop";
            saved.FormValues = JsonSerializer.Serialize(new
            {
                centreId = "ac000000-0000-0000-0000-000000000001",
                requestType = "workshop",
                programName = "ورشة سابقة",
                daysCount = 12,
                deliveryMechanism = "hybrid",
                city = "riyadh",
            });
            await db.SaveChangesAsync();
        }

        var list = await GetAsync(centre, "/api/v1/internal/assignment-requests/");
        var row = list.EnumerateArray().Single();
        Assert.Equal("ورشة سابقة", row.GetProperty("programName").GetProperty("ar").GetString());
        Assert.Equal("trainer", row.GetProperty("serviceType").GetString());
    }

    /* ── helpers ───────────────────────────────────────────────────────────── */

    /// <summary>A complete «استشارات» / «أخرى» request (form 6) — optional
    /// expected hours and beneficiary left out.</summary>
    private static Dictionary<string, object?> ConsultationRequest(string requestType) => new()
    {
        ["centreId"] = "ac000000-0000-0000-0000-000000000001",
        ["requestType"] = requestType,
        ["responsibleEmployee"] = "موظف الإسناد",
        ["consultationTopic"] = "حوكمة المخاطر",
        ["dateFrom"] = "2026-11-01T00:00:00Z",
        ["dateTo"] = "2026-11-03T00:00:00Z",
        ["deliveryMechanism"] = "online",
        ["city"] = "تيمز",
        ["language"] = "ar",
        ["consultationType"] = "institutional",
        ["attachmentName"] = "scope.pdf",
        ["attachmentId"] = _brochureId,
        ["specializationDomain"] = "dom-003",
    };

    private sealed record SeededTrainers(
        Dictionary<string, HttpClient> Clients, Guid Suspended) : IDisposable
    {
        public void Dispose()
        {
            foreach (var client in Clients.Values)
            {
                client.Dispose();
            }
        }
    }

    /// <summary>
    /// `count` matchable trainers plus one with a SUSPENDED file, so every
    /// run has something the matrix must exclude.
    /// </summary>
    private async Task<SeededTrainers> SeedTrainersAsync(int count)
    {
        var clients = new Dictionary<string, HttpClient>(StringComparer.Ordinal);
        Guid suspended = default;
        for (var index = 0; index <= count; index++)
        {
            var subject = $"cap05-trainer-{index}-{Guid.NewGuid():N}";
            var client = await SignInAsync(subject, $"مدرب {index}", null);
            var isSuspended = index == count;
            var trainerId = await SeedTrainerProfileAsync(subject, isSuspended);
            if (isSuspended)
            {
                suspended = trainerId;
                client.Dispose();
            }
            else
            {
                clients[trainerId.ToString()] = client;
            }
        }
        return new SeededTrainers(clients, suspended);
    }

    private async Task<Guid> SeedTrainerProfileAsync(string subject, bool suspended)
    {
        await using var db = _database.CreateContext();
        var user = await db.Users.SingleAsync(u => u.ExternalIdentityId == subject);
        var application = new Application
        {
            ApplicationId = Guid.NewGuid(),
            ApplicantUserId = user.UserId,
            SchemaVersion = FormSchemaVersions.Current,
            Reference = $"EH-2026-{Random.Shared.Next(10000, 99999)}",
            Status = ApplicationStatuses.Active,
            Origin = ApplicationOrigins.SelfService,
            CreatedAt = DateTime.UtcNow,
            SubmittedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };
        db.Applications.Add(application);
        var profile = new TrainerProfile
        {
            TrainerId = Guid.NewGuid(),
            UserId = user.UserId,
            ApplicationId = application.ApplicationId,
            FileStatus = suspended
                ? TrainerFileStatuses.Suspended
                : TrainerFileStatuses.Active,
            VisibilityConsent = false,
            CreatedAt = DateTime.UtcNow,
        };
        db.TrainerProfiles.Add(profile);
        db.TrainerServices.Add(new TrainerServiceRow
        {
            TrainerServiceId = Guid.NewGuid(),
            TrainerId = profile.TrainerId,
            Service = ApplicationServices.Trainer,
            AccreditedAt = DateTime.UtcNow,
            Status = "active",
        });
        // The matching inputs the workbook supplies: city, languages, modes.
        foreach (var (code, value) in new[]
        {
            ("inPersonCities", "الرياض"),
            ("trainingLanguages", "العربية"),
            ("preferredDeliveryMode", "حضوري"),
        })
        {
            db.TrainerFieldValues.Add(new TrainerFieldValue
            {
                ValueId = Guid.NewGuid(),
                TrainerId = profile.TrainerId,
                FieldCode = code,
                Value = JsonSerializer.Serialize(value),
            });
        }
        await db.SaveChangesAsync();
        return profile.TrainerId;
    }

    private static async Task<string> CreateRequestAsync(HttpClient staff)
    {
        var created = await PostAsync(staff, "/api/v1/internal/assignment-requests/", GeneralProgramRequest());
        Assert.Matches(@"^ASR-\d{4}-0001$", created.GetProperty("reference").GetString());
        return created.GetProperty("requestId").GetString()!;
    }

    /// <summary>
    /// `DEF-02` — within ONE request, a person may hold at most one live offer.
    ///
    /// <para>
    /// «Already tried» was counted per SLOT, and the only cross-slot rule
    /// excluded trainers already ENGAGED on the request. A live offer is not an
    /// engagement, so with headcount 2 both slots independently chose the same
    /// top-ranked candidate: one person received two simultaneous offers for
    /// the same need and the backups received none. Nothing stopped them
    /// accepting both.
    /// </para>
    /// <para>
    /// No test had ever set `requiredHeadcount` above 1, which is why a green
    /// suite said nothing about it.
    /// </para>
    /// </summary>
    [Fact]
    public async Task Two_slots_of_one_request_never_offer_the_same_person_at_once()
    {
        using var staff = await SignInAsync("cap05-staff-hc2", "موظف", RoleCode.Manager);
        using var centre = await SignInAsync(
            "cap05-centre-hc2", "منسق المركز", RoleCode.CentreCoordinator);
        using var trainers = await SeedTrainersAsync(6);

        var body = GeneralProgramRequest();
        body["requiredHeadcount"] = 2;
        var created = await PostAsync(centre, "/api/v1/internal/assignment-requests/", body);
        var requestId = created.GetProperty("requestId").GetString()!;

        // 3 candidates per slot (`J-17/F2`), so 6 for two slots.
        var run = await PostAsync(staff,
            $"/api/v1/internal/assignment-requests/{requestId}/matching/run", null);
        var ranked = run.GetProperty("ranked").EnumerateArray()
            .Select(c => c.GetProperty("trainerId").GetString()!)
            .Take(6).ToArray();
        Assert.Equal(6, ranked.Length);

        await PostAsync(staff,
            $"/api/v1/internal/assignment-requests/{requestId}/pool",
            new { trainerIds = ranked });
        await PostAsync(centre,
            $"/api/v1/internal/assignment-requests/{requestId}/pool/decision",
            new
            {
                decisions = ranked
                    .Select((id, index) => (object)new
                    {
                        trainerId = id,
                        decision = "approved",
                        preferenceRank = index + 1,
                    })
                    .ToArray(),
            });

        var slots = (await GetAsync(staff,
            $"/api/v1/internal/assignment-requests/{requestId}/slots")).EnumerateArray().ToArray();
        Assert.Equal(2, slots.Length);

        var offered = slots
            .Select(s => s.GetProperty("currentOffer"))
            .Where(o => o.ValueKind == JsonValueKind.Object)
            .Select(o => o.GetProperty("trainerId").GetString()!)
            .ToArray();

        // Both slots are working — the guard must not stall the second one.
        Assert.Equal(2, offered.Length);
        // …and they are two different people.
        Assert.Equal(2, offered.Distinct(StringComparer.Ordinal).Count());

        // The rule at its source: nobody holds two live offers on this request.
        await using var db = _database.CreateContext();
        var live = await (
            from offer in db.AssignmentOffers
            join slot in db.AssignmentSlots on offer.SlotId equals slot.SlotId
            where slot.RequestId == Guid.Parse(requestId)
                && offer.Status == OfferStatuses.AwaitingResponse
            select offer.TrainerId).ToListAsync();
        Assert.Equal(live.Count, live.Distinct().Count());
    }

    [Fact]
    public async Task A_refused_offer_frees_the_person_to_be_offered_another_slot()
    {
        // The guard must not break re-routing: it excludes a LIVE offer, not a
        // finished one. Once the first answer is in, the same person is an
        // ordinary candidate again (`J-19/F1/AC-5`).
        using var staff = await SignInAsync("cap05-staff-hc2b", "موظف", RoleCode.Manager);
        using var centre = await SignInAsync(
            "cap05-centre-hc2b", "منسق المركز", RoleCode.CentreCoordinator);
        using var trainers = await SeedTrainersAsync(6);

        var body = GeneralProgramRequest();
        body["requiredHeadcount"] = 2;
        var created = await PostAsync(centre, "/api/v1/internal/assignment-requests/", body);
        var requestId = created.GetProperty("requestId").GetString()!;

        var run = await PostAsync(staff,
            $"/api/v1/internal/assignment-requests/{requestId}/matching/run", null);
        var ranked = run.GetProperty("ranked").EnumerateArray()
            .Select(c => c.GetProperty("trainerId").GetString()!)
            .Take(6).ToArray();
        await PostAsync(staff,
            $"/api/v1/internal/assignment-requests/{requestId}/pool",
            new { trainerIds = ranked });
        await PostAsync(centre,
            $"/api/v1/internal/assignment-requests/{requestId}/pool/decision",
            new
            {
                decisions = ranked
                    .Select((id, index) => (object)new
                    {
                        trainerId = id,
                        decision = "approved",
                        preferenceRank = index + 1,
                    })
                    .ToArray(),
            });

        var before = (await GetAsync(staff,
            $"/api/v1/internal/assignment-requests/{requestId}/slots")).EnumerateArray().ToArray();
        var firstSlot = before.First(s => s.GetProperty("currentOffer").ValueKind == JsonValueKind.Object);
        var offerId = firstSlot.GetProperty("currentOffer").GetProperty("offerId").GetString()!;
        var refuser = firstSlot.GetProperty("currentOffer").GetProperty("trainerId").GetString()!;

        await PostAsync(trainers.Clients[refuser],
            $"/api/v1/me/assignment-offers/{offerId}/response", new { response = "reject" });

        // The slot moved on rather than stalling.
        var after = (await GetAsync(staff,
            $"/api/v1/internal/assignment-requests/{requestId}/slots")).EnumerateArray().ToArray();
        var live = after
            .Select(s => s.GetProperty("currentOffer"))
            .Where(o => o.ValueKind == JsonValueKind.Object)
            .Select(o => o.GetProperty("trainerId").GetString()!)
            .ToArray();
        Assert.Equal(2, live.Length);
        Assert.Equal(2, live.Distinct(StringComparer.Ordinal).Count());
    }

    /// <summary>
    /// `DEF-03` — naming fewer experts than the headcount must leave the rest
    /// to matching.
    ///
    /// <para>
    /// The code's own comment promised it («Name fewer experts than the
    /// headcount and the rest still go through J-17»), then opened offers
    /// against EVERY slot, so — through `DEF-02` — nominee #1 took them all and
    /// no slot was free. Worse, the partially-named pool is `open`, and sending
    /// a matching pool REMOVED any undecided pool, cascading the named
    /// approvals away.
    /// </para>
    /// </summary>
    [Fact]
    public async Task Naming_one_expert_of_three_leaves_two_slots_for_matching()
    {
        using var staff = await SignInAsync("cap05-staff-partial", "موظف", RoleCode.Manager);
        using var centre = await SignInAsync(
            "cap05-centre-partial", "منسق المركز", RoleCode.CentreCoordinator);
        using var trainers = await SeedTrainersAsync(8);
        var named = trainers.Clients.Keys.First();

        var body = GeneralProgramRequest();
        body["requiredHeadcount"] = 3;
        body["specificNominees"] = new[] { named };
        var created = await PostAsync(centre, "/api/v1/internal/assignment-requests/", body);
        var requestId = created.GetProperty("requestId").GetString()!;

        // Not «nominated» — two slots still need people.
        Assert.Equal("matching", created.GetProperty("status").GetString());

        var slots = (await GetAsync(staff,
            $"/api/v1/internal/assignment-requests/{requestId}/slots")).EnumerateArray().ToArray();
        Assert.Equal(3, slots.Length);

        var offered = slots
            .Select(s => s.GetProperty("currentOffer"))
            .Where(o => o.ValueKind == JsonValueKind.Object)
            .Select(o => o.GetProperty("trainerId").GetString()!)
            .ToArray();

        // EXACTLY one offer, and it went to the person who was named.
        Assert.Single(offered);
        Assert.Equal(named, offered[0]);

        // The named approval survives the matching run for the other slots.
        await using (var db = _database.CreateContext())
        {
            var id = Guid.Parse(requestId);
            Assert.True(await db.CandidatePools.AnyAsync(p => p.RequestId == id && p.Path == "named"));
        }
    }

    [Fact]
    public async Task Naming_every_expert_leaves_nothing_for_matching()
    {
        using var staff = await SignInAsync("cap05-staff-full", "موظف", RoleCode.Manager);
        using var centre = await SignInAsync(
            "cap05-centre-full", "منسق المركز", RoleCode.CentreCoordinator);
        using var trainers = await SeedTrainersAsync(5);
        var named = trainers.Clients.Keys.Take(3).ToArray();

        var body = GeneralProgramRequest();
        body["requiredHeadcount"] = 3;
        body["specificNominees"] = named;
        var created = await PostAsync(centre, "/api/v1/internal/assignment-requests/", body);
        var requestId = created.GetProperty("requestId").GetString()!;

        Assert.Equal("nominated", created.GetProperty("status").GetString());

        var slots = (await GetAsync(staff,
            $"/api/v1/internal/assignment-requests/{requestId}/slots")).EnumerateArray().ToArray();
        var offered = slots
            .Select(s => s.GetProperty("currentOffer"))
            .Where(o => o.ValueKind == JsonValueKind.Object)
            .Select(o => o.GetProperty("trainerId").GetString()!)
            .ToArray();

        // Three slots, three named people, three distinct offers.
        Assert.Equal(3, offered.Length);
        Assert.Equal(named.Order(StringComparer.Ordinal), offered.Order(StringComparer.Ordinal));
    }

    /// <summary>A complete «برنامج تدريبي عام» (Notion Assignment Matrix, form 1).</summary>
    private static Dictionary<string, object?> GeneralProgramRequest() => new()
    {
        ["centreId"] = "ac000000-0000-0000-0000-000000000001",
        ["requestType"] = "general-program",
        ["responsibleEmployee"] = "موظف الإسناد",
        ["programName"] = "برنامج القيادة",
        ["daysCount"] = 3,
        ["dateFrom"] = "2026-11-01T00:00:00Z",
        ["dateTo"] = "2026-11-03T00:00:00Z",
        ["period"] = "morning",
        ["deliveryMechanism"] = "onsite",
        ["city"] = "الرياض",
        ["language"] = "ar",
        ["traineeLevel"] = "intermediate",
        ["attachmentName"] = "brochure.pdf",
        ["attachmentId"] = _brochureId,
        ["specializationDomain"] = "dom-003",
    };

    /// <summary>Runs matching, sends the three-candidate pool, approves the
    /// first two in preference order and rejects the third.</summary>
    private static async Task<string[]> ApprovePoolAsync(
        HttpClient staff, HttpClient centre, string requestId, SeededTrainers trainers)
    {
        var run = await PostAsync(staff,
            $"/api/v1/internal/assignment-requests/{requestId}/matching/run", null);
        var eligible = run.GetProperty("ranked").EnumerateArray()
            .Select(r => r.GetProperty("trainerId").GetString()!)
            .ToArray();
        Assert.Equal(3, eligible.Length);
        Assert.All(eligible, id => Assert.True(trainers.Clients.ContainsKey(id)));

        await PostAsync(staff, $"/api/v1/internal/assignment-requests/{requestId}/pool",
            new { trainerIds = eligible });
        await PostAsync(centre, $"/api/v1/internal/assignment-requests/{requestId}/pool/decision",
            new
            {
                decisions = new object[]
                {
                    new { trainerId = eligible[0], decision = "approved", preferenceRank = 1 },
                    new { trainerId = eligible[1], decision = "approved", preferenceRank = 2 },
                    new { trainerId = eligible[2], decision = "rejected", preferenceRank = (int?)null },
                },
            });
        return eligible;
    }

    private static async Task<string> CurrentOfferIdAsync(HttpClient staff, string requestId)
    {
        var slots = await GetAsync(staff,
            $"/api/v1/internal/assignment-requests/{requestId}/slots");
        return slots.EnumerateArray().Single()
            .GetProperty("currentOffer").GetProperty("offerId").GetString()!;
    }

    private async Task<HttpClient> SignInAsync(string subject, string name, RoleCode? platformRole)
    {
        var client = TestOidc.CreateClient(_configured!);
        await TestOidc.SignInAsync(
            client, _tokenEndpoint,
            platformRole is null ? "unmapped" : "fa-staff",
            subject: subject, displayName: name);
        if (platformRole is { } granted)
        {
            await using var db = _database.CreateContext();
            var user = await db.Users.SingleAsync(u => u.ExternalIdentityId == subject);
            var roleRow = await db.Roles.SingleAsync(r => r.Code == granted);
            db.UserRoles.Add(new UserRole
            {
                UserRoleId = Guid.NewGuid(),
                UserId = user.UserId,
                RoleId = roleRow.RoleId,
                AssignedBy = user.UserId,
                AssignedAt = DateTime.UtcNow,
            });
            await db.SaveChangesAsync();
        }
        return client;
    }

    private static async Task<JsonElement> GetAsync(HttpClient client, string path)
    {
        var response = await client.GetAsync(path);
        var payload = await response.Content.ReadAsStringAsync();
        Assert.True(response.StatusCode == HttpStatusCode.OK,
            $"Expected 200 from {path}, got {(int)response.StatusCode}: {payload}");
        return JsonSerializer.Deserialize<JsonElement>(payload);
    }

    private static async Task<JsonElement> PostAsync(HttpClient client, string path, object? body)
    {
        var response = body is null
            ? await client.PostAsync(path, null)
            : await client.PostAsJsonAsync(path, body);
        var payload = await response.Content.ReadAsStringAsync();
        Assert.True(response.StatusCode == HttpStatusCode.OK,
            $"Expected 200 from {path}, got {(int)response.StatusCode}: {payload}");
        return JsonSerializer.Deserialize<JsonElement>(payload);
    }
}
