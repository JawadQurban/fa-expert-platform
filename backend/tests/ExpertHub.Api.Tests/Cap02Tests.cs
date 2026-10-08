using System.Globalization;
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using ExpertHub.Core.Domain;
using ExpertHub.Infrastructure.Meetings;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;

namespace ExpertHub.Api.Tests;

/// <summary>
/// BE-07 — CAP-02 held to its structural rules on the full stack, with real
/// distinct people: the applicant, the screening decision-maker, and the
/// committee members are separate OIDC identities on separate cookie jars.
/// </summary>
public sealed class Cap02Tests
    : IClassFixture<WebApplicationFactory<Program>>, IAsyncLifetime, IDisposable
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly LocalDbFixture _database = new();
    private readonly TestOidc.FakeTokenEndpoint _tokenEndpoint = new();

    private WebApplicationFactory<Program>? _configured;

    public Cap02Tests(WebApplicationFactory<Program> factory) => _factory = factory;

    public async Task InitializeAsync()
    {
        await _database.InitializeAsync();
        _configured = TestOidc.Configure(
            _factory,
            _tokenEndpoint,
            ("ConnectionStrings:ExpertHub", _database.ConnectionString));
    }

    public async Task DisposeAsync()
    {
        _configured?.Dispose();
        await _database.DisposeAsync();
    }

    public void Dispose() => _tokenEndpoint.Dispose();

    /* ── the whole journey, person by person ───────────────────────────────── */

    [Fact]
    public async Task The_full_journey_from_submission_to_accreditation()
    {
        using var applicant = await SignInAsync("applicant-1", "unmapped", "سارة العتيبي");
        var applicationId = await SubmitCompleteApplicationAsync(applicant);

        using var decider = await SignInAsync("decider-1", "fa-staff", "مدير الفرز", RoleCode.Manager);
        using var member1 = await SignInAsync("member-1", "fa-staff", "عضو اللجنة الأول", RoleCode.Manager);
        using var member2 = await SignInAsync("member-2", "fa-staff", "عضو اللجنة الثاني", RoleCode.Manager);
        var member1Id = await UserIdOfAsync("member-1");
        var member2Id = await UserIdOfAsync("member-2");

        /*
         * Screening: the objective score exists BEFORE the decision, from the
         * APPROVED matrix (`dm-gap-02.2026-09-29`) — each criterion is one
         * option→percentage-point look-up, summed.
         *
         * The fixture answers the FIRST option of every select and attaches
         * one file per rule, so the total is the cheapest answer to each
         * criterion rather than a full-marks form:
         *
         *   #1 diploma                      3.50
         *   #2 spec-001 (related)          10.00
         *   #3 dom-001 (RELATED)           10.00
         *   #4 1 to 5 years                 5.00
         *   #5 1 referral file              1.71
         *   #6 1 certificate entry          1.71
         *   #7 CERT-0001 (not relevant)     0.00
         *   #8 CERT-0001 (Saudi / local)    2.00
         *   #9 full-time                    2.00
         *  #10 Arabic                       1.00
         *   T1 less than 2 training years   5.00
         *   T2 online                       3.00
         *   T3 ready materials              5.00
         *                                  ─────
         *                                  49.92
         */
        var screening = await GetAsync(decider, $"/api/v1/internal/applications/{applicationId}/screening");
        Assert.True(screening.GetProperty("decisionPending").GetBoolean());
        var score = screening.GetProperty("scores").EnumerateArray().Single();
        Assert.Equal("trainer", score.GetProperty("service").GetString());
        Assert.Equal(49.92m, score.GetProperty("score").GetDecimal());
        // Display-only (J-05/F2/AC-5) — below it, and the journey continues.
        Assert.Equal(50, score.GetProperty("threshold").GetDecimal());
        Assert.Equal("dm-gap-02.2026-10-07", score.GetProperty("modelVersion").GetString());
        Assert.Equal(13, score.GetProperty("criteria").GetArrayLength());
        // The served total IS the served breakdown — no criterion is dropped
        // from the list the screening manager reads.
        Assert.Equal(
            score.GetProperty("score").GetDecimal(),
            score.GetProperty("criteria").EnumerateArray()
                .Sum(c => c.GetProperty("weightedScore").GetDecimal()));
        // BR-0202 — no analysis produced, no insight, and the decision does
        // not wait on it.
        Assert.Equal(JsonValueKind.Null, screening.GetProperty("insight").ValueKind);

        // Accept with the interview path: slots AND committee together (AC-4).
        var incomplete = await decider.PostAsJsonAsync(
            $"/api/v1/internal/applications/{applicationId}/screening/decision",
            new
            {
                kind = "accept",
                services = new[] { new { service = "trainer", path = "interview", slots = Array.Empty<string>(), committeeMemberIds = new[] { member1Id }, exemptionReason = (string?)null, exemptionReasonOther = "" } },
            });
        Assert.Equal(HttpStatusCode.BadRequest, incomplete.StatusCode);

        var decision = await PostAsync(decider,
            $"/api/v1/internal/applications/{applicationId}/screening/decision",
            new
            {
                kind = "accept",
                services = new[]
                {
                    new
                    {
                        service = "trainer",
                        path = "interview",
                        // D-04 — a slot must be in the future, so the fixture is relative
                        // rather than a fixed date that silently expires.
                        slots = new[]
                        {
                            DateTime.UtcNow.AddDays(7).ToString("yyyy-MM-dd'T'HH:mm:ss'Z'", CultureInfo.InvariantCulture),
                            DateTime.UtcNow.AddDays(8).ToString("yyyy-MM-dd'T'HH:mm:ss'Z'", CultureInfo.InvariantCulture),
                        },
                        committeeMemberIds = new[] { member1Id, member2Id },
                        exemptionReason = (string?)null,
                        exemptionReasonOther = "",
                    },
                },
            });
        Assert.Equal("under-review", decision.GetProperty("status").GetString());

        // The applicant sees the J-06 block: two slots, the 3-business-day
        // clock (SLA-0201 is seeded fixed), and the manage action.
        var detail = await GetAsync(applicant, $"/api/v1/me/applications/{applicationId}");
        Assert.Equal("manage-interview", detail.GetProperty("action").GetString());
        var interviewBlock = detail.GetProperty("interview");
        var slots = interviewBlock.GetProperty("proposedSlots").EnumerateArray().ToArray();
        Assert.Equal(2, slots.Length);
        Assert.Equal("SLA-0201",
            interviewBlock.GetProperty("selectionSla").GetProperty("slaId").GetString());
        Assert.Equal(JsonValueKind.Null, interviewBlock.GetProperty("ticketNumber").ValueKind);

        // Confirm a slot → scheduled, and the ticket is born (J-06/F2/AC-3).
        var confirmed = await PostAsync(applicant,
            $"/api/v1/me/applications/{applicationId}/interview-slot",
            new { slotId = slots[0].GetProperty("id").GetString() });
        Assert.Equal("interview-scheduled", confirmed.GetProperty("status").GetString());
        var ticket = confirmed.GetProperty("interview").GetProperty("ticketNumber").GetString();
        Assert.Matches(@"^INT-\d{4}-\d{4}$", ticket);

        // A new interview is scored on the APPROVED model (Notion «Interview
        // Evaluation Model», Finalized): ten criteria, weights summing to 100,
        // a named 1–5 scale.
        var opened = await GetAsync(member1, $"/api/v1/internal/applications/{applicationId}/interview");
        var model = opened.GetProperty("model");
        Assert.Equal("dm-gap-03.2026-09-02", model.GetProperty("version").GetString());
        var axes = model.GetProperty("axes").EnumerateArray().ToArray();
        Assert.Equal(
            ApprovedCriteria.Select(c => c.Code),
            axes.Select(a => a.GetProperty("id").GetString()));
        Assert.Equal(
            ApprovedCriteria.Select(c => c.Weight),
            axes.Select(a => a.GetProperty("weight").GetDecimal()));
        Assert.Equal(100.0m, axes.Sum(a => a.GetProperty("weight").GetDecimal()));
        Assert.Equal("مهارات التدريب", axes[0].GetProperty("label").GetProperty("ar").GetString());
        var scale = model.GetProperty("ratingScale").EnumerateArray().ToArray();
        Assert.Equal([1, 2, 3, 4, 5], scale.Select(l => l.GetProperty("score").GetInt32()));
        Assert.Equal("Very Poor", scale[0].GetProperty("label").GetProperty("en").GetString());
        Assert.Equal("Excellent", scale[4].GetProperty("label").GetProperty("en").GetString());

        // Member 1 scores every criterion; the result stays NULL — member 2 is
        // still pending (BR-0220): no half-formed average is representable.
        await PostAsync(member1,
            $"/api/v1/internal/applications/{applicationId}/interview/evaluations",
            TrainerEvaluation(ApprovedCriteria.Select((c, i) => (c.Code, i % 2 == 0 ? 4m : 5m))));
        var midway = await GetAsync(member2, $"/api/v1/internal/applications/{applicationId}/interview");
        Assert.Equal(JsonValueKind.Null, midway.GetProperty("result").ValueKind);
        Assert.Contains(midway.GetProperty("committee").EnumerateArray(),
            m => m.GetProperty("state").GetString() == "pending");

        // Member 2 did not attend — a RESPONSE, excluded, never a zero.
        var complete = await PostAsync(member2,
            $"/api/v1/internal/applications/{applicationId}/interview/evaluations",
            new { kind = "did-not-attend" });
        var result = complete.GetProperty("result").EnumerateArray().Single();
        // Σ (rating ÷ 5) × weight over ratings 4,5,4,5,… =
        // 26.64 + 16.7 + 13.36 + 6.7 + 5.36 + 6.7 + 2.64 + 3.3 + 2.64 + 3.3.
        Assert.Equal(87.34m, result.GetProperty("average").GetDecimal());
        Assert.Equal(100m, result.GetProperty("maxScore").GetDecimal());
        Assert.Equal(70m, result.GetProperty("passThreshold").GetDecimal());
        Assert.True(result.GetProperty("passed").GetBoolean());
        Assert.Equal(1, result.GetProperty("countedEvaluations").GetInt32());
        Assert.Equal(1, result.GetProperty("excludedNonAttendance").GetInt32());

        // BR-0208 — a committee member is not the screening decision-maker.
        var notDecider = await member1.PostAsJsonAsync(
            $"/api/v1/internal/applications/{applicationId}/interview/decision",
            new { kind = "forward" });
        Assert.Equal(HttpStatusCode.Forbidden, notDecider.StatusCode);

        var forwarded = await PostAsync(decider,
            $"/api/v1/internal/applications/{applicationId}/interview/decision",
            new { kind = "forward" });
        Assert.Equal("forward", forwarded.GetProperty("kind").GetString());

        // The committee: context shows screening + CONSOLIDATED result only.
        var committee = await GetAsync(decider, $"/api/v1/internal/applications/{applicationId}/committee");
        var context = committee.GetProperty("context").EnumerateArray().Single();
        // The committee reads the score RECORDED at the screening decision —
        // the same 49.92 computed above, persisted on `SCREENING_RESULT`.
        Assert.Equal(49.92m, context.GetProperty("screeningScore").GetDecimal());
        Assert.Equal(87.34m, context.GetProperty("interviewAverage").GetDecimal());
        Assert.Equal(100m, context.GetProperty("interviewMaxScore").GetDecimal());
        Assert.False(context.GetProperty("exempted").GetBoolean());
        Assert.Equal("not-formed", committee.GetProperty("outcome").GetProperty("state").GetString());

        // Formation: mandatory + optional, saved as a template too.
        var formed = await PostAsync(decider,
            $"/api/v1/internal/applications/{applicationId}/committee/formation",
            new
            {
                members = new[]
                {
                    new { approverId = member1Id, obligation = "mandatory" },
                    new { approverId = member2Id, obligation = "optional" },
                },
                saveAsTemplateName = "لجنة الاعتماد القياسية",
            });
        Assert.Equal("in-progress", formed.GetProperty("outcome").GetProperty("state").GetString());
        Assert.Single(formed.GetProperty("templates").EnumerateArray());

        // Sequential means sequential: member 2 cannot act on member 1's turn.
        var outOfTurn = await member2.PostAsJsonAsync(
            $"/api/v1/internal/applications/{applicationId}/committee/decisions",
            new { kind = "approve", note = "" });
        Assert.Equal(HttpStatusCode.Forbidden, outOfTurn.StatusCode);

        await PostAsync(member1,
            $"/api/v1/internal/applications/{applicationId}/committee/decisions",
            new { kind = "approve", note = "موافق" });

        // The OPTIONAL member rejects — logged dissent, NO effect on the walk
        // (J-09/F4/AC-4): the sequence concludes approved regardless.
        var concluded = await PostAsync(member2,
            $"/api/v1/internal/applications/{applicationId}/committee/decisions",
            new { kind = "reject", reason = "insufficient-experience", reasonOther = "", note = "تحفظ" });
        var outcome = concluded.GetProperty("outcome");
        Assert.Equal("approved", outcome.GetProperty("state").GetString());
        Assert.Single(outcome.GetProperty("optionalRejections").EnumerateArray());

        await using var db = _database.CreateContext();
        var serviceRow = await db.ApplicationServices.SingleAsync(
            s => s.ApplicationId == Guid.Parse(applicationId));
        Assert.Equal("accepted", serviceRow.Outcome);
        Assert.True(await db.AccreditationDecisions.AnyAsync(
            d => d.ApplicationServiceId == serviceRow.ApplicationServiceId
                && d.Outcome == "accredited"));
    }

    /* ── J-07 — the approved model's scale, and the draft kept for history ─── */

    [Fact]
    public async Task A_score_outside_the_approved_one_to_five_scale_is_refused()
    {
        using var applicant = await SignInAsync("applicant-5", "unmapped", "ريم الحربي");
        var applicationId = await SubmitCompleteApplicationAsync(applicant);
        using var decider = await SignInAsync("decider-1", "fa-staff", "مدير الفرز", RoleCode.Manager);
        using var member1 = await SignInAsync("member-1", "fa-staff", "عضو اللجنة الأول", RoleCode.Manager);
        await AcceptToInterviewAsync(decider, applicant, applicationId, await UserIdOfAsync("member-1"));

        var path = $"/api/v1/internal/applications/{applicationId}/interview/evaluations";
        foreach (var outOfScale in new[] { 0m, 6m, 4.5m })
        {
            var refused = await member1.PostAsJsonAsync(path,
                TrainerEvaluation(ApprovedCriteria.Select(c => (c.Code, outOfScale))));
            Assert.Equal(HttpStatusCode.BadRequest, refused.StatusCode);
        }

        // Every criterion at 3 ("Acceptable") is exactly 60% — below the 70%
        // pass mark: did not pass.
        var scored = await PostAsync(member1, path,
            TrainerEvaluation(ApprovedCriteria.Select(c => (c.Code, 3m))));
        var result = scored.GetProperty("result").EnumerateArray().Single();
        Assert.Equal(60m, result.GetProperty("average").GetDecimal());
        Assert.Equal(70m, result.GetProperty("passThreshold").GetDecimal());
        Assert.False(result.GetProperty("passed").GetBoolean());

        // Nothing passed, so nothing can proceed to the approval committee —
        // the decision-maker's remaining path is a direct rejection.
        var decisionPath = $"/api/v1/internal/applications/{applicationId}/interview/decision";
        var blocked = await decider.PostAsJsonAsync(decisionPath, new { kind = "forward" });
        Assert.Equal(HttpStatusCode.Conflict, blocked.StatusCode);
        Assert.Contains("no-service-passed", await blocked.Content.ReadAsStringAsync(), StringComparison.Ordinal);
        var rejected = await PostAsync(decider, decisionPath,
            new { kind = "reject", reason = "insufficient-experience", reasonOther = "" });
        Assert.Equal("reject", rejected.GetProperty("kind").GetString());
    }

    [Fact]
    public async Task Only_a_service_that_passed_proceeds_to_the_committee_which_still_decides()
    {
        using var applicant = await SignInAsync("applicant-7", "unmapped", "سلمان القحطاني");
        var applicationId = await SubmitCompleteApplicationAsync(applicant, ["trainer", "consultant"]);
        using var decider = await SignInAsync("decider-1", "fa-staff", "مدير الفرز", RoleCode.Manager);
        using var member1 = await SignInAsync("member-1", "fa-staff", "عضو اللجنة الأول", RoleCode.Manager);
        var member1Id = await UserIdOfAsync("member-1");
        await AcceptToInterviewAsync(decider, applicant, applicationId, member1Id, ["trainer", "consultant"]);

        // Trainer: every criterion 5 → 100%. Consultant: every criterion 3 → 60%.
        // The recommendation is optional — none is given for the consultant.
        var scored = await PostAsync(member1,
            $"/api/v1/internal/applications/{applicationId}/interview/evaluations",
            new
            {
                kind = "evaluation",
                services = new object[]
                {
                    new
                    {
                        service = "trainer",
                        axisScores = ApprovedCriteria.Select(c => new { axisId = c.Code, score = 5m }).ToArray(),
                        recommendation = "recommend",
                        notes = "",
                    },
                    new
                    {
                        service = "consultant",
                        axisScores = ApprovedCriteria.Select(c => new { axisId = c.Code, score = 3m }).ToArray(),
                        recommendation = (string?)null,
                        notes = "",
                    },
                },
            });
        var results = scored.GetProperty("result").EnumerateArray()
            .ToDictionary(r => r.GetProperty("service").GetString()!, r => r.GetProperty("passed").GetBoolean());
        Assert.True(results["trainer"]);
        Assert.False(results["consultant"]);

        // Forwarding carries the service that passed; the one that did not stops here.
        var forwarded = await PostAsync(decider,
            $"/api/v1/internal/applications/{applicationId}/interview/decision",
            new { kind = "forward" });
        Assert.Equal("forward", forwarded.GetProperty("kind").GetString());
        await using (var db = _database.CreateContext())
        {
            var outcomes = await db.ApplicationServices
                .Where(s => s.ApplicationId == Guid.Parse(applicationId))
                .ToDictionaryAsync(s => s.Service, s => s.Outcome);
            Assert.Equal("pending", outcomes["trainer"]);
            Assert.Equal("rejected", outcomes["consultant"]);
            var application = await db.Applications.SingleAsync(a => a.ApplicationId == Guid.Parse(applicationId));
            // Passing approved nothing: the approval committee is next.
            Assert.Equal("approval-in-progress", application.Status);
        }

        await PostAsync(decider,
            $"/api/v1/internal/applications/{applicationId}/committee/formation",
            new
            {
                members = new[] { new { approverId = member1Id, obligation = "mandatory" } },
                saveAsTemplateName = (string?)null,
            });
        await PostAsync(member1,
            $"/api/v1/internal/applications/{applicationId}/committee/decisions",
            new { kind = "approve", note = "" });
        await using (var db = _database.CreateContext())
        {
            var outcomes = await db.ApplicationServices
                .Where(s => s.ApplicationId == Guid.Parse(applicationId))
                .ToDictionaryAsync(s => s.Service, s => s.Outcome);
            Assert.Equal("accepted", outcomes["trainer"]);
            Assert.Equal("rejected", outcomes["consultant"]);
        }
    }

    [Fact]
    public async Task An_interview_created_under_the_draft_model_keeps_the_draft_model()
    {
        using var applicant = await SignInAsync("applicant-6", "unmapped", "فهد الدوسري");
        var applicationId = await SubmitCompleteApplicationAsync(applicant);
        using var decider = await SignInAsync("decider-1", "fa-staff", "مدير الفرز", RoleCode.Manager);
        using var member1 = await SignInAsync("member-1", "fa-staff", "عضو اللجنة الأول", RoleCode.Manager);
        await AcceptToInterviewAsync(decider, applicant, applicationId, await UserIdOfAsync("member-1"));

        // A new interview pins the active (approved) model. M24 pins every
        // interview that predates it to the draft — reproduce that state.
        await using (var db = _database.CreateContext())
        {
            var interview = await db.Interviews.SingleAsync(i => i.ApplicationId == Guid.Parse(applicationId));
            Assert.Equal("dm-gap-03.2026-09-02", interview.ModelVersion);
            interview.ModelVersion = "mock-dm-gap-03-draft.1";
            await db.SaveChangesAsync();
        }

        var opened = await GetAsync(member1, $"/api/v1/internal/applications/{applicationId}/interview");
        var model = opened.GetProperty("model");
        Assert.Equal("mock-dm-gap-03-draft.1", model.GetProperty("version").GetString());
        Assert.Equal(4, model.GetProperty("axes").GetArrayLength());
        Assert.Equal(JsonValueKind.Null, model.GetProperty("ratingScale").ValueKind);

        // The draft's own scoring, unchanged: Σ score × weight ÷ 100, out of 5.
        var scored = await PostAsync(member1,
            $"/api/v1/internal/applications/{applicationId}/interview/evaluations",
            TrainerEvaluation(new[]
            {
                ("subject-mastery", 4m), ("delivery-skills", 5m),
                ("practical-experience", 4m), ("professional-conduct", 5m),
            }));
        var result = scored.GetProperty("result").EnumerateArray().Single();
        Assert.Equal(4.45m, result.GetProperty("average").GetDecimal());
        Assert.Equal(5m, result.GetProperty("maxScore").GetDecimal());
        Assert.Equal(JsonValueKind.Null, result.GetProperty("passThreshold").ValueKind);

        await PostAsync(decider,
            $"/api/v1/internal/applications/{applicationId}/interview/decision",
            new { kind = "forward" });
        var committee = await GetAsync(decider, $"/api/v1/internal/applications/{applicationId}/committee");
        var context = committee.GetProperty("context").EnumerateArray().Single();
        Assert.Equal(4.45m, context.GetProperty("interviewAverage").GetDecimal());
        Assert.Equal(5m, context.GetProperty("interviewMaxScore").GetDecimal());
    }

    /* ── J-08 — the exemption, invisible by omission (P-45) ────────────────── */

    [Fact]
    public async Task An_exemption_reaches_committee_and_is_invisible_to_the_applicant()
    {
        using var applicant = await SignInAsync("applicant-2", "unmapped", "خالد الشمري");
        var applicationId = await SubmitCompleteApplicationAsync(applicant);
        using var decider = await SignInAsync("decider-1", "fa-staff", "مدير الفرز", RoleCode.Manager);

        var decision = await PostAsync(decider,
            $"/api/v1/internal/applications/{applicationId}/screening/decision",
            new
            {
                kind = "accept",
                services = new[]
                {
                    new
                    {
                        service = "trainer",
                        path = "exemption",
                        slots = Array.Empty<string>(),
                        committeeMemberIds = Array.Empty<string>(),
                        exemptionReason = (string?)"expert",
                        exemptionReasonOther = "",
                    },
                },
            });
        // Straight to the approval stage — no interview stage at all (J-08/F2).
        Assert.Equal("approval-in-progress", decision.GetProperty("status").GetString());
        Assert.Equal("trainer",
            decision.GetProperty("exemptedServices").EnumerateArray().Single().GetString());

        // P-45 / J-08/F2/AC-3 — the applicant's view: the interview stage
        // reads as PASSED on the timeline, the interview block is null, and
        // the whole payload carries no exemption field to leak through.
        var response = await applicant.GetAsync($"/api/v1/me/applications/{applicationId}");
        var raw = await response.Content.ReadAsStringAsync();
        Assert.DoesNotContain("exempt", raw, StringComparison.OrdinalIgnoreCase);
        var detail = JsonSerializer.Deserialize<JsonElement>(raw);
        Assert.Equal(JsonValueKind.Null, detail.GetProperty("interview").ValueKind);
        var stages = detail.GetProperty("timeline").EnumerateArray().ToArray();
        Assert.Equal("complete", stages[2].GetProperty("state").GetString()); // interview: passed
        Assert.Equal("current", stages[3].GetProperty("state").GetString());  // approval

        // The INTERNAL committee context does say so — with the reason.
        var committee = await GetAsync(decider, $"/api/v1/internal/applications/{applicationId}/committee");
        var context = committee.GetProperty("context").EnumerateArray().Single();
        Assert.True(context.GetProperty("exempted").GetBoolean());
        Assert.Equal(JsonValueKind.Null, context.GetProperty("interviewAverage").ValueKind);
        // J-08's approved wording.
        Assert.Equal("خبير",
            context.GetProperty("exemptionReason").GetProperty("ar").GetString());
        Assert.Equal("Expert",
            context.GetProperty("exemptionReason").GetProperty("en").GetString());
    }

    /* ── J-09/F7 — modification pauses; resume is FROM the requester ───────── */

    [Fact]
    public async Task A_modification_request_resumes_from_the_requesting_member()
    {
        using var applicant = await SignInAsync("applicant-3", "unmapped", "منى القحطاني");
        var applicationId = await SubmitCompleteApplicationAsync(applicant);
        using var decider = await SignInAsync("decider-1", "fa-staff", "مدير الفرز", RoleCode.Manager);
        using var member1 = await SignInAsync("member-1", "fa-staff", "العضو الأول", RoleCode.Manager);
        using var member2 = await SignInAsync("member-2", "fa-staff", "العضو الثاني", RoleCode.Manager);
        var member1Id = await UserIdOfAsync("member-1");
        var member2Id = await UserIdOfAsync("member-2");

        await ExemptToCommitteeAsync(decider, applicationId);
        await PostAsync(decider,
            $"/api/v1/internal/applications/{applicationId}/committee/formation",
            new
            {
                members = new[]
                {
                    new { approverId = member1Id, obligation = "mandatory" },
                    new { approverId = member2Id, obligation = "mandatory" },
                },
                saveAsTemplateName = "",
            });
        await PostAsync(member1,
            $"/api/v1/internal/applications/{applicationId}/committee/decisions",
            new { kind = "approve", note = "" });

        // BR-0217 — the note is mandatory; without it there is nothing to act on.
        var noteless = await member2.PostAsJsonAsync(
            $"/api/v1/internal/applications/{applicationId}/committee/decisions",
            new { kind = "request-modification", note = "" });
        Assert.Equal(HttpStatusCode.BadRequest, noteless.StatusCode);

        var paused = await PostAsync(member2,
            $"/api/v1/internal/applications/{applicationId}/committee/decisions",
            new { kind = "request-modification", note = "أرفقوا شهادة الخبرة." });
        Assert.Equal("modification-requested",
            paused.GetProperty("outcome").GetProperty("state").GetString());

        // Only the creator re-submits; the sequence resumes at member 2 —
        // member 1's approval is preserved, untouched (BR-0218).
        var wrongResubmitter = await member1.PostAsync(
            $"/api/v1/internal/applications/{applicationId}/committee/resubmit", null);
        Assert.Equal(HttpStatusCode.Forbidden, wrongResubmitter.StatusCode);

        var resumed = await PostAsync(decider,
            $"/api/v1/internal/applications/{applicationId}/committee/resubmit", null);
        var members = resumed.GetProperty("sequence").EnumerateArray().ToArray();
        Assert.Equal("approved", members[0].GetProperty("state").GetString());
        Assert.Equal("current", members[1].GetProperty("state").GetString());

        var concluded = await PostAsync(member2,
            $"/api/v1/internal/applications/{applicationId}/committee/decisions",
            new { kind = "approve", note = "" });
        Assert.Equal("approved",
            concluded.GetProperty("outcome").GetProperty("state").GetString());
    }

    /* ── J-09/F8 — a MANDATORY rejection halts the application ─────────────── */

    [Fact]
    public async Task A_mandatory_rejection_halts_the_application_with_its_reason()
    {
        using var applicant = await SignInAsync("applicant-4", "unmapped", "بدر العنزي");
        var applicationId = await SubmitCompleteApplicationAsync(applicant);
        using var decider = await SignInAsync("decider-1", "fa-staff", "مدير الفرز", RoleCode.Manager);
        using var member1 = await SignInAsync("member-1", "fa-staff", "العضو الأول", RoleCode.Manager);
        var member1Id = await UserIdOfAsync("member-1");

        await ExemptToCommitteeAsync(decider, applicationId);
        await PostAsync(decider,
            $"/api/v1/internal/applications/{applicationId}/committee/formation",
            new
            {
                members = new[] { new { approverId = member1Id, obligation = "mandatory" } },
                saveAsTemplateName = "",
            });
        var halted = await PostAsync(member1,
            $"/api/v1/internal/applications/{applicationId}/committee/decisions",
            new { kind = "reject", reason = "insufficient-qualifications", reasonOther = "", note = "" });
        var outcome = halted.GetProperty("outcome");
        Assert.Equal("rejected", outcome.GetProperty("state").GetString());
        Assert.Equal("العضو الأول", outcome.GetProperty("rejectedByName").GetString());

        // The trainer sees the rejection with its reason — and the timeline's
        // approval stage marked rejected.
        var detail = await GetAsync(applicant, $"/api/v1/me/applications/{applicationId}");
        Assert.Equal("rejected", detail.GetProperty("status").GetString());
        Assert.Equal("عدم استيفاء المؤهلات المطلوبة",
            detail.GetProperty("rejectionReason").GetString());
    }

    /* ── helpers ───────────────────────────────────────────────────────────── */

    /// <summary>The approved criteria and weights, as the Notion matrix lists them.</summary>
    private static readonly (string Code, decimal Weight)[] ApprovedCriteria =
    [
        ("training-skills", 33.3m), ("communication-skills", 16.7m),
        ("training-camps-willingness", 16.7m), ("energy-levels", 6.7m),
        ("emotional-intelligence", 6.7m), ("client-needs-flexibility", 6.7m),
        ("community-giving-back", 3.3m), ("organizational-values", 3.3m),
        ("cultural-sensitivity", 3.3m), ("thinking-comprehension", 3.3m),
    ];

    private static object TrainerEvaluation(IEnumerable<(string AxisId, decimal Score)> scores) => new
    {
        kind = "evaluation",
        services = new[]
        {
            new
            {
                service = "trainer",
                axisScores = scores.Select(s => new { axisId = s.AxisId, score = s.Score }).ToArray(),
                recommendation = "recommend",
                notes = "أداء متميز.",
            },
        },
    };

    /// <summary>Accept for the interview path with one member, then the
    /// applicant confirms the first slot — the interview is scheduled.</summary>
    /* ── J-07/J-08 — services are evaluated independently ──────────────────── */

    [Theory]
    // exempted,                     interviewed with score (5 = pass, 3 = fail), forward allowed
    [InlineData("consultant", "trainer:3", true)]                          // exempt + failed
    [InlineData("content-developer", "trainer:5,consultant:3", true)]     // passed + exempt + failed
    [InlineData("", "trainer:3,consultant:3", false)]                      // all failed
    [InlineData("", "trainer:5,consultant:3", true)]                       // passed + failed
    public async Task An_exempted_or_passed_service_keeps_the_application_moving_when_another_fails(
        string exempted, string interviewed, bool forwardAllowed)
    {
        var scores = interviewed.Split(',').Select(pair => pair.Split(':'))
            .ToDictionary(pair => pair[0], pair => decimal.Parse(pair[1], CultureInfo.InvariantCulture));
        var exemptedServices = exempted.Length == 0 ? Array.Empty<string>() : [exempted];
        var services = scores.Keys.Concat(exemptedServices).ToArray();
        var tag = Guid.NewGuid().ToString("N")[..8];
        using var applicant = await SignInAsync($"applicant-mix-{tag}", "unmapped", "متقدم");
        var applicationId = await SubmitCompleteApplicationAsync(applicant, services);
        using var decider = await SignInAsync($"decider-mix-{tag}", "fa-staff", "مدير الفرز", RoleCode.Manager);
        using var member = await SignInAsync($"member-mix-{tag}", "fa-staff", "عضو", RoleCode.Manager);
        var memberId = await UserIdOfAsync($"member-mix-{tag}");
        await MixedScreeningAsync(decider, applicationId, memberId, [.. scores.Keys], exemptedServices);
        await PickFirstSlotAsync(applicant, applicationId);
        await EvaluateAsync(member, applicationId, scores);

        var forward = await decider.PostAsJsonAsync(
            $"/api/v1/internal/applications/{applicationId}/interview/decision", new { kind = "forward" });
        await using var db = _database.CreateContext();
        var outcomes = await db.ApplicationServices
            .Where(s => s.ApplicationId == Guid.Parse(applicationId))
            .ToDictionaryAsync(s => s.Service, s => s.Outcome);
        if (!forwardAllowed)
        {
            Assert.Equal(HttpStatusCode.Conflict, forward.StatusCode);
            Assert.Equal("no-service-passed",
                (await forward.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("detail").GetString());
            Assert.All(outcomes.Values, outcome => Assert.Equal("pending", outcome));
            return;
        }
        Assert.Equal(HttpStatusCode.OK, forward.StatusCode);
        foreach (var (service, score) in scores)
        {
            Assert.Equal(score >= 5 ? "pending" : "rejected", outcomes[service]);
        }
        foreach (var service in exemptedServices)
        {
            // The exempted service is NOT lost with the failed one.
            Assert.Equal("pending", outcomes[service]);
        }
        var committee = await GetAsync(decider, $"/api/v1/internal/applications/{applicationId}/committee");
        var before = JsonSerializer.Serialize(committee);
        foreach (var (service, score) in scores.Where(s => s.Value < 5))
        {
            // A failed service is not put before the committee as accepted.
            Assert.DoesNotContain($"\"{service}\"", before.Replace("\"services\"", string.Empty), StringComparison.Ordinal);
        }
    }

    [Fact]
    public async Task Nobody_evaluates_an_interview_whose_time_is_not_confirmed()
    {
        using var applicant = await SignInAsync("applicant-sched", "unmapped", "متقدم");
        var applicationId = await SubmitCompleteApplicationAsync(applicant);
        using var decider = await SignInAsync("decider-sched", "fa-staff", "مدير الفرز", RoleCode.Manager);
        using var member = await SignInAsync("member-sched", "fa-staff", "عضو", RoleCode.Manager);
        await MixedScreeningAsync(decider, applicationId, await UserIdOfAsync("member-sched"), ["trainer"], []);

        var early = await member.PostAsJsonAsync(
            $"/api/v1/internal/applications/{applicationId}/interview/evaluations",
            new { kind = "did-not-attend" });
        Assert.Equal(HttpStatusCode.Conflict, early.StatusCode);
        Assert.Equal("interview-not-scheduled",
            (await early.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("detail").GetString());

        await PickFirstSlotAsync(applicant, applicationId);
        await EvaluateAsync(member, applicationId, new Dictionary<string, decimal> { ["trainer"] = 5m });
    }

    [Fact]
    public async Task Only_the_applications_creator_forms_its_approval_committee()
    {
        using var applicant = await SignInAsync("applicant-form", "unmapped", "متقدم");
        var applicationId = await SubmitCompleteApplicationAsync(applicant);
        using var decider = await SignInAsync("decider-form", "fa-staff", "مدير الفرز", RoleCode.Manager);
        using var other = await SignInAsync("other-form", "fa-staff", "مدير آخر", RoleCode.Manager);
        var otherId = await UserIdOfAsync("other-form");
        await ExemptToCommitteeAsync(decider, applicationId);
        var body = new
        {
            members = new[] { new { approverId = otherId, obligation = "mandatory" } },
            saveAsTemplateName = (string?)null,
        };

        // Holding the feature (a Manager) is not enough — J-09/F1/AC-2, BR-0215.
        var refused = await other.PostAsJsonAsync(
            $"/api/v1/internal/applications/{applicationId}/committee/formation", body);
        Assert.Equal(HttpStatusCode.Forbidden, refused.StatusCode);
        Assert.Equal("only-application-creator",
            (await refused.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("detail").GetString());

        await PostAsync(decider, $"/api/v1/internal/applications/{applicationId}/committee/formation", body);
    }

    [Fact]
    public async Task A_full_committee_no_show_can_be_rescheduled_again_and_again_and_rejected_at_any_point()
    {
        // Notion «Resolved Issues», J-07/F3 AC-3 + AC-4 (`P-344`).
        using var applicant = await SignInAsync("applicant-noshow", "unmapped", "متقدم");
        var applicationId = await SubmitCompleteApplicationAsync(applicant);
        using var decider = await SignInAsync("decider-noshow", "fa-staff", "مدير الفرز", RoleCode.Manager);
        using var member = await SignInAsync("member-noshow", "fa-staff", "عضو اللجنة", RoleCode.Manager);
        await AcceptToInterviewAsync(decider, applicant, applicationId, await UserIdOfAsync("member-noshow"));

        var interviewPath = $"/api/v1/internal/applications/{applicationId}/interview";
        var reschedulePath = $"{interviewPath}/reschedule";
        object NewSlots(int days) => new
        {
            slots = new[]
            {
                DateTime.UtcNow.AddDays(days).ToString("yyyy-MM-dd'T'HH:mm:ss'Z'", CultureInfo.InvariantCulture),
            },
            note = "",
        };

        // AC-3 — «no limit on the number of times this can repeat»: twice here.
        for (var round = 1; round <= 2; round++)
        {
            await PostAsync(member, $"{interviewPath}/evaluations", new { kind = "did-not-attend" });
            var viewed = (await GetAsync(decider, interviewPath)).GetProperty("viewer");
            Assert.True(viewed.GetProperty("fullNoShow").GetBoolean());
            Assert.True(viewed.GetProperty("canReschedule").GetBoolean());
            Assert.True(viewed.GetProperty("canReject").GetBoolean());

            // Only the decision-maker may take this path (`BR-0208`).
            var notTheirs = await member.PostAsJsonAsync(reschedulePath, NewSlots(5));
            Assert.Equal(HttpStatusCode.Forbidden, notTheirs.StatusCode);

            var rescheduled = await PostAsync(decider, reschedulePath, NewSlots(5 + round));
            // The member evaluates the new interview from scratch.
            Assert.Equal("pending",
                rescheduled.GetProperty("committee").EnumerateArray().Single().GetProperty("state").GetString());
            await PickFirstSlotAsync(applicant, applicationId);
        }

        // AC-4 — rejection stays available at any point, even before the new
        // interview has happened; forwarding does not.
        var decisionPath = $"{interviewPath}/decision";
        var forward = await decider.PostAsJsonAsync(decisionPath, new { kind = "forward" });
        Assert.Equal(HttpStatusCode.Conflict, forward.StatusCode);
        var rejected = await PostAsync(decider, decisionPath,
            new { kind = "reject", reason = "insufficient-experience", reasonOther = "" });
        Assert.Equal("reject", rejected.GetProperty("kind").GetString());

        // A decided interview takes no further responses.
        var late = await member.PostAsJsonAsync($"{interviewPath}/evaluations", new { kind = "did-not-attend" });
        Assert.Equal(HttpStatusCode.Conflict, late.StatusCode);

        await using var db = _database.CreateContext();
        var interview = await db.Interviews.SingleAsync(i => i.ApplicationId == Guid.Parse(applicationId));
        Assert.Equal(2, interview.NoShowRescheduleCount);
    }

    [Fact]
    public async Task An_interview_that_happened_is_not_rescheduled()
    {
        // AC-3 is for a FULL no-show only; an attended interview is behind them.
        using var applicant = await SignInAsync("applicant-attended", "unmapped", "متقدم");
        var applicationId = await SubmitCompleteApplicationAsync(applicant);
        using var decider = await SignInAsync("decider-attended", "fa-staff", "مدير الفرز", RoleCode.Manager);
        using var member = await SignInAsync("member-attended", "fa-staff", "عضو اللجنة", RoleCode.Manager);
        await AcceptToInterviewAsync(decider, applicant, applicationId, await UserIdOfAsync("member-attended"));
        await EvaluateAsync(member, applicationId, new Dictionary<string, decimal> { ["trainer"] = 4m });

        var viewed = (await GetAsync(decider, $"/api/v1/internal/applications/{applicationId}/interview"))
            .GetProperty("viewer");
        Assert.False(viewed.GetProperty("fullNoShow").GetBoolean());
        Assert.False(viewed.GetProperty("canReschedule").GetBoolean());
        var refused = await decider.PostAsJsonAsync(
            $"/api/v1/internal/applications/{applicationId}/interview/reschedule",
            new { slots = new[] { DateTime.UtcNow.AddDays(5).ToString("o", CultureInfo.InvariantCulture) }, note = "" });
        Assert.Equal(HttpStatusCode.Conflict, refused.StatusCode);
    }

    [Fact]
    public async Task Staff_see_a_reschedule_request_and_the_interview_panel_is_invited()
    {
        var meetings = new CapturingMeetings();
        var original = _configured!;
        _configured = original.WithWebHostBuilder(builder =>
            builder.ConfigureTestServices(services => services.AddSingleton<IMeetingProvider>(meetings)));
        try
        {
            using var applicant = await SignInAsync("applicant-resched", "unmapped", "متقدم");
            var applicationId = await SubmitCompleteApplicationAsync(applicant);
            using var decider = await SignInAsync("decider-resched", "fa-staff", "مدير الفرز", RoleCode.Manager);
            using var member = await SignInAsync("member-resched", "fa-staff", "عضو اللجنة", RoleCode.Manager);
            await MixedScreeningAsync(decider, applicationId, await UserIdOfAsync("member-resched"), ["trainer"], []);

            // J-06/F1/AC-3 — none of the times suit the applicant.
            await PostAsync(applicant, $"/api/v1/me/applications/{applicationId}/interview-reschedule",
                new { note = "أرجو موعدًا مسائيًا." });
            var seen = await GetAsync(member, $"/api/v1/internal/applications/{applicationId}/interview");
            // The request now reaches staff, with its note.
            Assert.Equal("أرجو موعدًا مسائيًا.",
                seen.GetProperty("rescheduleRequest").GetProperty("note").GetString());

            var path = $"/api/v1/internal/applications/{applicationId}/interview/reschedule";
            var malformed = await decider.PostAsJsonAsync(path, new { slots = new[] { "not-a-date" }, note = "" });
            Assert.Equal(HttpStatusCode.BadRequest, malformed.StatusCode);
            var past = await decider.PostAsJsonAsync(path, new
            {
                slots = new[] { DateTime.UtcNow.AddDays(-1).ToString("o", CultureInfo.InvariantCulture) },
                note = "",
            });
            Assert.Equal("slot-in-past",
                (await past.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("detail").GetString());
            var rescheduled = await PostAsync(decider, path, new
            {
                slots = new[] { DateTime.UtcNow.AddDays(9).ToString("yyyy-MM-dd'T'HH:mm:ss'Z'", CultureInfo.InvariantCulture) },
                note = "",
            });
            // Handled: the request is cleared once staff propose new times.
            Assert.Equal(JsonValueKind.Null, rescheduled.GetProperty("rescheduleRequest").ValueKind);

            await PickFirstSlotAsync(applicant, applicationId);
            // J-06/F2/AC-2 — the applicant AND the panel assigned at screening.
            var booked = Assert.Single(meetings.Requests);
            await using var db = _database.CreateContext();
            var memberEmail = (await db.Users.SingleAsync(u => u.ExternalIdentityId == "member-resched")).Email;
            var applicantEmail = (await db.Users.SingleAsync(u => u.ExternalIdentityId == "applicant-resched")).Email;
            Assert.Contains(applicantEmail, booked.AttendeeEmails);
            Assert.Contains(memberEmail, booked.AttendeeEmails);
        }
        finally
        {
            _configured.Dispose();
            _configured = original;
        }
    }

    private sealed class CapturingMeetings : IMeetingProvider
    {
        public List<MeetingRequest> Requests { get; } = [];

        public bool IsConfigured => true;

        public Task<MeetingBooking?> BookAsync(MeetingRequest request, CancellationToken cancellationToken)
        {
            Requests.Add(request);
            return Task.FromResult<MeetingBooking?>(new MeetingBooking("https://teams.example/meet", "evt-1"));
        }

        public Task<MeetingBooking?> RescheduleAsync(
            string externalId, MeetingRequest request, CancellationToken cancellationToken)
        {
            Requests.Add(request);
            return Task.FromResult<MeetingBooking?>(new MeetingBooking("https://teams.example/meet", externalId));
        }
    }

    private static async Task MixedScreeningAsync(
        HttpClient decider, string applicationId, string memberId,
        IReadOnlyList<string> interviewed, IReadOnlyList<string> exempted)
    {
        var slotAt = DateTime.UtcNow.AddDays(7).ToString("yyyy-MM-dd'T'HH:mm:ss'Z'", CultureInfo.InvariantCulture);
        await PostAsync(decider,
            $"/api/v1/internal/applications/{applicationId}/screening/decision",
            new
            {
                kind = "accept",
                services = interviewed.Select(service => (object)new
                {
                    service,
                    path = "interview",
                    slots = new[] { slotAt },
                    committeeMemberIds = new[] { memberId },
                    exemptionReason = (string?)null,
                    exemptionReasonOther = "",
                }).Concat(exempted.Select(service => (object)new
                {
                    service,
                    path = "exemption",
                    slots = Array.Empty<string>(),
                    committeeMemberIds = Array.Empty<string>(),
                    exemptionReason = (string?)"prior-collaboration",
                    exemptionReasonOther = "",
                })).ToArray(),
            });
    }

    private static async Task PickFirstSlotAsync(HttpClient applicant, string applicationId)
    {
        var detail = await GetAsync(applicant, $"/api/v1/me/applications/{applicationId}");
        var slot = detail.GetProperty("interview").GetProperty("proposedSlots").EnumerateArray().First();
        await PostAsync(applicant,
            $"/api/v1/me/applications/{applicationId}/interview-slot",
            new { slotId = slot.GetProperty("id").GetString() });
    }

    private static async Task EvaluateAsync(
        HttpClient member, string applicationId, IReadOnlyDictionary<string, decimal> scores) =>
        await PostAsync(member,
            $"/api/v1/internal/applications/{applicationId}/interview/evaluations",
            new
            {
                kind = "evaluation",
                services = scores.Select(pair => new
                {
                    service = pair.Key,
                    axisScores = ApprovedCriteria.Select(c => new { axisId = c.Code, score = pair.Value }).ToArray(),
                    recommendation = (string?)null,
                    notes = "",
                }).ToArray(),
            });

    private static async Task AcceptToInterviewAsync(
        HttpClient decider, HttpClient applicant, string applicationId, string memberId,
        string[]? services = null)
    {
        var slotAt = DateTime.UtcNow.AddDays(7).ToString("yyyy-MM-dd'T'HH:mm:ss'Z'", CultureInfo.InvariantCulture);
        await PostAsync(decider,
            $"/api/v1/internal/applications/{applicationId}/screening/decision",
            new
            {
                kind = "accept",
                services = (services ?? ["trainer"]).Select(service => new
                {
                    service,
                    path = "interview",
                    slots = new[] { slotAt },
                    committeeMemberIds = new[] { memberId },
                    exemptionReason = (string?)null,
                    exemptionReasonOther = "",
                }).ToArray(),
            });
        var detail = await GetAsync(applicant, $"/api/v1/me/applications/{applicationId}");
        var slot = detail.GetProperty("interview").GetProperty("proposedSlots").EnumerateArray().First();
        await PostAsync(applicant,
            $"/api/v1/me/applications/{applicationId}/interview-slot",
            new { slotId = slot.GetProperty("id").GetString() });
    }

    /// <summary>
    /// Signs a person in and gives them the platform role their part of the
    /// journey needs — feature permissions (P-190) are read from
    /// `USER_ROLE`, so internal-by-claim alone now opens nothing.
    /// </summary>
    private async Task<HttpClient> SignInAsync(
        string subject, string role, string name, RoleCode? platformRole = null)
    {
        var client = TestOidc.CreateClient(_configured!);
        await TestOidc.SignInAsync(client, _tokenEndpoint, role, subject: subject, displayName: name);
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

    private async Task<string> UserIdOfAsync(string externalId)
    {
        await using var db = _database.CreateContext();
        return (await db.Users.SingleAsync(u => u.ExternalIdentityId == externalId))
            .UserId.ToString();
    }

    /// <summary>
    /// The cross-defect scenario: the combination the old suite never made.
    ///
    /// <para>
    /// Each of these worked in isolation and failed together, which is exactly
    /// why a green suite said nothing. One applicant with TWO qualifications
    /// (`DEF-01`), read by a staff member who was granted their internal role
    /// AFTER their first sign-in (`DEF-04`) — the ordinary sequence, since
    /// roles are granted in Expert Hub's own matrix — who then forms a
    /// committee that must contain only people able to decide (`DEF-05`).
    /// </para>
    /// </summary>
    [Fact]
    public async Task Two_qualifications_a_reconciled_reader_and_an_eligible_committee()
    {
        using var applicant = await SignInAsync(
            "combo-applicant", "unmapped", "مقدمة بمؤهلين");
        var applicationId = await SubmitCompleteApplicationAsync(
            applicant, entries: TwoQualifications());

        // `DEF-04` — the reader signs in FIRST and is granted their role after,
        // so their stored employee flag starts false and must be reconciled.
        using var reader = await SignInAsync("combo-reader", "unmapped", "قارئة الفرز");
        await GrantRoleAsync("combo-reader", RoleCode.Manager);
        using var reconciled = await SignInAsync(
            "combo-reader", "fa-staff", "قارئة الفرز");

        // `DEF-01` — the screening page opens at all, with BOTH qualifications.
        var detail = await GetAsync(
            reconciled, $"/api/v1/internal/applications/{applicationId}/screening");
        var education = detail.GetProperty("sections").EnumerateArray()
            .Single(x => x.GetProperty("id").GetString() == "education");
        Assert.Equal(2, education.GetProperty("entries").GetArrayLength());

        // `DEF-04` — and they can reach the applicant's documents rather than
        // being refused as a stranger.
        var attachmentId = await CvAttachmentIdAsync("combo-applicant");
        var document = await reconciled.GetAsync($"/api/v1/attachments/{attachmentId}");
        Assert.NotEqual(HttpStatusCode.Forbidden, document.StatusCode);

        // `DEF-05` — the committee cannot seat somebody who could never decide,
        // and the refusal leaves the application formable.
        await PostAsync(reconciled,
            $"/api/v1/internal/applications/{applicationId}/screening/decision",
            new
            {
                kind = "accept",
                services = new[]
                {
                    new
                    {
                        service = "trainer",
                        path = "exemption",
                        slots = Array.Empty<string>(),
                        committeeMemberIds = Array.Empty<string>(),
                        exemptionReason = (string?)"prior-collaboration",
                        exemptionReasonOther = "",
                    },
                },
            });

        using var coordinator = await SignInAsync(
            "combo-coordinator", "fa-staff", "منسق المركز", RoleCode.CentreCoordinator);
        var refused = await reconciled.PostAsJsonAsync(
            $"/api/v1/internal/applications/{applicationId}/committee/formation",
            new
            {
                members = new[]
                {
                    new
                    {
                        approverId = await UserIdOfAsync("combo-coordinator"),
                        obligation = "mandatory",
                    },
                },
            });
        Assert.Equal(HttpStatusCode.BadRequest, refused.StatusCode);

        var formed = await reconciled.PostAsJsonAsync(
            $"/api/v1/internal/applications/{applicationId}/committee/formation",
            new
            {
                members = new[]
                {
                    new
                    {
                        approverId = await UserIdOfAsync("combo-reader"),
                        obligation = "mandatory",
                    },
                },
            });
        // NOT 409 — the refused attempt wrote nothing, so no deadlock.
        Assert.Equal(HttpStatusCode.OK, formed.StatusCode);
    }

    /// <summary>The CV document that applicant uploaded, by owner.</summary>
    private async Task<Guid> CvAttachmentIdAsync(string subject)
    {
        await using var db = _database.CreateContext();
        var user = await db.Users.SingleAsync(u => u.ExternalIdentityId == subject);
        var attachment = new Attachment
        {
            AttachmentId = Guid.NewGuid(),
            FileName = "cv.pdf",
            MimeType = "application/pdf",
            SizeBytes = 2048,
            StorageRef = "db:combo-cv",
            UploadedBy = user.UserId,
            UploadedAt = DateTime.UtcNow,
        };
        db.Attachments.Add(attachment);
        await db.SaveChangesAsync();
        return attachment.AttachmentId;
    }

    private async Task GrantRoleAsync(string subject, RoleCode role)
    {
        await using var db = _database.CreateContext();
        var user = await db.Users.SingleAsync(u => u.ExternalIdentityId == subject);
        var roleRow = await db.Roles.SingleAsync(r => r.Code == role);
        if (await db.UserRoles.AnyAsync(
                ur => ur.UserId == user.UserId && ur.RoleId == roleRow.RoleId))
        {
            return;
        }
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

    /// <summary>
    /// `DEF-01` — the screening reader must be ENTRY-AWARE.
    ///
    /// Sections 2, 3 and 4 became repeatable on 2026-09-21 (`P-296`), so the
    /// unique key of an answer is (application, field, ENTRY) — the same field
    /// code legitimately appears once per entry. The screening detail keyed a
    /// dictionary on the field code alone and threw on the second entry, which
    /// is a 500 on the primary internal screen for any applicant who listed two
    /// qualifications — exactly what the form now encourages.
    ///
    /// The sibling reader (`ApplicationEndpoints.LoadValuesAsync`) has grouped
    /// correctly since the same day; only this one was missed, and nothing
    /// tested it.
    /// </summary>
    [Fact]
    public async Task Screening_reads_an_application_that_carries_several_qualifications()
    {
        using var applicant = await SignInAsync(
            "applicant-entries", "unmapped", "مقدم بمؤهلين");
        var applicationId = await SubmitCompleteApplicationAsync(
            applicant, entries: TwoQualifications());

        // PRECONDITION: the application really does carry two education
        // entries. Without this the test could pass by testing nothing.
        var own = await GetAsync(applicant, $"/api/v1/me/applications/{applicationId}");
        Assert.Equal(2, own.GetProperty("entries").GetProperty("education").GetArrayLength());

        using var decider = await SignInAsync(
            "decider-entries", "fa-staff", "مدير الفرز", RoleCode.Manager);

        var response = await decider.GetAsync(
            $"/api/v1/internal/applications/{applicationId}/screening");

        // The defect: this was a 500 (duplicate key), not a 200.
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var detail = await response.Content.ReadFromJsonAsync<JsonElement>();

        // BOTH qualifications reach the screener, in entry order. A reader that
        // silently kept the first would pass an existence check and still hide
        // half the applicant's education from the person deciding on them.
        var education = detail.GetProperty("sections").EnumerateArray()
            .Single(s => s.GetProperty("id").GetString() == "education");
        var entries = education.GetProperty("entries").EnumerateArray().ToArray();
        Assert.Equal(2, entries.Length);
        Assert.Equal(
            ["bachelor", "doctorate"],
            entries.Select(e => e.GetProperty("fields").EnumerateArray()
                .Single(f => f.GetProperty("id").GetString() == "qualificationType")
                .GetProperty("value").GetString()));

        // …and the approved best-of rule still governs the score: a bachelor
        // (4.00) and a doctorate (5.00) pay the doctorate.
        var qualification = detail.GetProperty("scores").EnumerateArray().Single()
            .GetProperty("criteria").EnumerateArray()
            .Single(c => c.GetProperty("label").GetProperty("ar").GetString() == "المؤهل");
        Assert.Equal(5.00m, qualification.GetProperty("weightedScore").GetDecimal());
    }

    private static Dictionary<string, object?> TwoQualifications() =>
        new()
        {
            ["education"] = new[]
            {
                new
                {
                    entryId = "edu-1",
                    values = new Dictionary<string, object?>
                    {
                        ["qualificationType"] = "bachelor",
                        ["universityName"] = "uni-001",
                    },
                },
                new
                {
                    entryId = "edu-2",
                    values = new Dictionary<string, object?>
                    {
                        ["qualificationType"] = "doctorate",
                        ["universityName"] = "uni-002",
                    },
                },
            },
        };

    /// <summary>Draft → complete values from the served schema → seeded
    /// attachments (G26 keeps uploads closed) → submit. Trainer service.</summary>
    private async Task<string> SubmitCompleteApplicationAsync(
        HttpClient applicant,
        string[]? services = null,
        Dictionary<string, object?>? entries = null)
    {
        var started = await PostAsync(applicant, "/api/v1/me/applications/draft/start", null);
        var draftId = started.GetProperty("draft").GetProperty("id").GetString()!;

        var schema = await GetAsync(applicant, "/api/v1/applications/schema");
        var values = new Dictionary<string, object?>();
        foreach (var field in schema.GetProperty("fields").EnumerateArray())
        {
            var id = field.GetProperty("id").GetString()!;
            var type = field.GetProperty("type").GetString();
            var hasPattern = field.TryGetProperty("validation", out var validation)
                && validation.TryGetProperty("pattern", out _);
            values[id] = type switch
            {
                "checkbox" => true,
                "date" => "2020-01-15",
                "number" => "8",
                "select" => field.GetProperty("options")[0].GetProperty("value").GetString(),
                "multi-select" => new[]
                {
                    field.GetProperty("options")[0].GetProperty("value").GetString(),
                },
                // A patterned field needs a value that satisfies ITS pattern —
                // the identity field's rule (`D-01`) is not the social link's.
                _ when hasPattern => id == "idNumber"
                    ? "1012345678"
                    : "https://example.com/profile",
                _ => "قيمة تجريبية",
            };
        }
        await using (var db = _database.CreateContext())
        {
            foreach (var rule in await db.AttachmentRules.Where(r => r.SchemaVersion == FormSchemaVersions.Current).ToListAsync())
            {
                db.ApplicationAttachments.Add(new ApplicationAttachment
                {
                    ApplicationAttachmentId = Guid.NewGuid(),
                    ApplicationId = Guid.Parse(draftId),
                    RuleCode = rule.RuleCode,
                    FileName = $"{rule.RuleCode}.pdf",
                    SizeBytes = 100_000,
                });
            }
            await db.SaveChangesAsync();
        }
        if (entries is not null)
        {
            // Repeatable entries are written by the DRAFT save, which is what
            // the wizard does; submit then re-reads them.
            await PostAsync(applicant, "/api/v1/me/applications/draft", new
            {
                services = services ?? ["trainer"],
                values,
                entries,
            });
        }
        var submitted = await PostAsync(applicant, "/api/v1/me/applications/submit", new
        {
            services = services ?? ["trainer"],
            values,
            entries,
        });
        return submitted.GetProperty("applicationId").GetString()!;
    }

    private static async Task ExemptToCommitteeAsync(HttpClient decider, string applicationId) =>
        await PostAsync(decider,
            $"/api/v1/internal/applications/{applicationId}/screening/decision",
            new
            {
                kind = "accept",
                services = new[]
                {
                    new
                    {
                        service = "trainer",
                        path = "exemption",
                        slots = Array.Empty<string>(),
                        committeeMemberIds = Array.Empty<string>(),
                        exemptionReason = (string?)"prior-collaboration",
                        exemptionReasonOther = "",
                    },
                },
            });

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
