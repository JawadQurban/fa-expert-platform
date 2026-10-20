using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using ExpertHub.Api.Assignments;
using ExpertHub.Core.Domain;
using ExpertHub.Infrastructure.Fast;
using ExpertHub.Infrastructure.Notifications;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace ExpertHub.Api.Tests;

/// <summary>
/// CAP-05 against the FAST Training API (a fake HTTP handler — never the live
/// server): RUN-030's plan selection on the request form.
/// </summary>
public sealed partial class Cap05Tests
{
    private const string FastPlanId = "5b0e8f1e-0000-4000-8000-0000000000a1";
    private const string FastProgramId = "7c1f9a2b-0000-4000-8000-0000000000b2";

    /* ── RUN-030 / BUG-004 — a request linked to a FAST plan ────────────── */

    [Fact]
    public async Task A_request_for_an_open_FAST_plan_takes_the_plans_data_from_FAST()
    {
        var fast = UseFakeFast();
        using var centre = await SignInAsync("cap05-fast-centre", "منسق المركز", RoleCode.CentreCoordinator);

        // BUG-004 — the programme dropdown is FAST's approved catalogue.
        var programmes = await GetAsync(centre, "/api/v1/internal/assignment-requests/lookups/fast-programmes?q=قيادة");
        Assert.True(programmes.GetProperty("available").GetBoolean());
        Assert.Equal(FastProgramId, programmes.GetProperty("items")[0].GetProperty("programId").GetString());
        var search = fast.Seen.Single(r => r.Url.Contains("Program/Search", StringComparison.Ordinal));
        var searchBody = JsonSerializer.Deserialize<JsonElement>(search.Body);
        Assert.Equal("قيادة", searchBody.GetProperty("searchText").GetString());
        Assert.True(searchBody.GetProperty("hasUpcomingPlans").GetBoolean());
        Assert.Equal("active", searchBody.GetProperty("status").GetString());

        // Only plans that can still be assigned are offered.
        var plans = await GetAsync(centre,
            $"/api/v1/internal/assignment-requests/lookups/fast-programmes/{FastProgramId}/plans");
        Assert.Equal(new string?[] { FastPlanId }, plans.EnumerateArray().Select(p => p.GetProperty("planId").GetString()));

        var prefill = await GetAsync(centre, $"/api/v1/internal/assignment-requests/lookups/fast-plans/{FastPlanId}");
        Assert.True(prefill.GetProperty("assignable").GetBoolean());
        var fields = prefill.GetProperty("fields");
        Assert.Equal("برنامج القيادة المالية", fields.GetProperty("programName").GetString());
        Assert.Equal("2026-12-06", fields.GetProperty("dateFrom").GetString());
        Assert.Equal("2026-12-08", fields.GetProperty("dateTo").GetString());

        // What the page sends for those fields is overwritten by FAST's values.
        var body = GeneralProgramRequest();
        body["fastPlanId"] = FastPlanId;
        body["programName"] = "اسم مكتوب يدويًا";
        body["city"] = "جدة";
        var created = await PostAsync(centre, "/api/v1/internal/assignment-requests/", body);

        await using var db = _database.CreateContext();
        var stored = JsonSerializer.Deserialize<JsonElement>(
            (await db.AssignmentRequests.SingleAsync(r => r.RequestId == Guid.Parse(created.GetProperty("requestId").GetString()!))).FormValues);
        Assert.Equal(FastPlanId, stored.GetProperty("fastPlanId").GetString());
        Assert.Equal(FastProgramId, stored.GetProperty("fastProgramId").GetString());
        Assert.Equal("برنامج القيادة المالية", stored.GetProperty("programName").GetString());
        Assert.Equal("الرياض", stored.GetProperty("city").GetString());
        Assert.Equal(3, stored.GetProperty("daysCount").GetInt32());
        Assert.Equal("evening", stored.GetProperty("period").GetString());
        Assert.Equal("online", stored.GetProperty("deliveryMechanism").GetString());
        Assert.Equal("en", stored.GetProperty("language").GetString());
        Assert.Equal("advanced", stored.GetProperty("traineeLevel").GetString());
        Assert.Equal("2026-12-06", stored.GetProperty("dateFrom").GetString());
    }

    [Theory]
    [InlineData("closed", null)]
    [InlineData("final-closed", "2026-10-01T00:00:00")]
    [InlineData("canceled", null)]
    public async Task A_closed_or_ended_FAST_plan_is_refused(string status, string? finalClosedOn)
    {
        var fast = UseFakeFast();
        fast.Plan = PlanJson(status, finalClosedOn, "2026-12-06");
        using var centre = await SignInAsync("cap05-fast-closed", "منسق المركز", RoleCode.CentreCoordinator);

        var prefill = await GetAsync(centre, $"/api/v1/internal/assignment-requests/lookups/fast-plans/{FastPlanId}");
        Assert.False(prefill.GetProperty("assignable").GetBoolean());

        var body = GeneralProgramRequest();
        body["fastPlanId"] = FastPlanId;
        var refused = await centre.PostAsJsonAsync("/api/v1/internal/assignment-requests/", body);
        Assert.Equal(HttpStatusCode.BadRequest, refused.StatusCode);
        Assert.Equal("fast-plan-closed",
            (await refused.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("detail").GetString());
        await using var db = _database.CreateContext();
        Assert.False(await db.AssignmentRequests.AnyAsync());
    }

    [Fact]
    public async Task An_open_plan_whose_last_day_has_passed_is_refused()
    {
        var fast = UseFakeFast();
        fast.Plan = PlanJson("open", null, "2020-01-05");
        using var centre = await SignInAsync("cap05-fast-ended", "منسق المركز", RoleCode.CentreCoordinator);

        var body = GeneralProgramRequest();
        body["fastPlanId"] = FastPlanId;
        var refused = await centre.PostAsJsonAsync("/api/v1/internal/assignment-requests/", body);

        Assert.Equal(HttpStatusCode.BadRequest, refused.StatusCode);
    }

    [Fact]
    public async Task A_FAST_plan_on_a_form_that_does_not_select_plans_or_FAST_down_is_refused_clearly()
    {
        var fast = UseFakeFast();
        using var centre = await SignInAsync("cap05-fast-form", "منسق المركز", RoleCode.CentreCoordinator);

        var body = GeneralProgramRequest();
        body["requestType"] = "seminar";
        body["fastPlanId"] = FastPlanId;
        var wrongForm = await centre.PostAsJsonAsync("/api/v1/internal/assignment-requests/", body);
        Assert.Equal(HttpStatusCode.BadRequest, wrongForm.StatusCode);

        fast.Down = true;
        body["requestType"] = "general-program";
        var down = await centre.PostAsJsonAsync("/api/v1/internal/assignment-requests/", body);
        Assert.Equal(HttpStatusCode.ServiceUnavailable, down.StatusCode);
        Assert.Equal("fast-unavailable",
            (await down.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("detail").GetString());

        // The programme list degrades to «not available»: the form falls back
        // to manual entry instead of failing.
        var programmes = await GetAsync(centre, "/api/v1/internal/assignment-requests/lookups/fast-programmes");
        Assert.False(programmes.GetProperty("available").GetBoolean());
    }

    [Fact]
    public async Task Without_the_Training_API_the_programme_list_says_so_and_manual_requests_still_work()
    {
        using var centre = await SignInAsync("cap05-fast-off", "منسق المركز", RoleCode.CentreCoordinator);

        var programmes = await GetAsync(centre, "/api/v1/internal/assignment-requests/lookups/fast-programmes");
        Assert.False(programmes.GetProperty("available").GetBoolean());
        await PostAsync(centre, "/api/v1/internal/assignment-requests/", GeneralProgramRequest());
    }

    [Fact]
    public void A_FAST_value_outside_Expert_Hubs_vocabulary_is_left_for_the_centre()
    {
        var plan = new FastPlanDetails(
            FastPlanId, "PL", FastProgramId, new FastNamedRef("1", "open", null, null), null, null,
            12, 60, 0, new FastNamedRef("9", null, "الفرنسية", "French"),
            new FastNamedRef("3", "self-learning", null, null), "online", null, null, null, null, [], null, [], null, []);

        var fields = FastPlanSelection.Prefill(plan, null, new DateTime(2026, 10, 20)).Fields;

        Assert.Null(fields.Language);
        Assert.Null(fields.DeliveryMechanism);
        Assert.Null(fields.DateFrom);
        Assert.Null(fields.TraineeLevel);
        // More than the listed 1–8 days is «أخرى», carrying FAST's real count.
        Assert.Equal(12, fields.DaysCount);
        Assert.True(fields.DaysCountOther);
    }

    /* ── B-07 / B-08 / B-09 — the outbox delivers to FAST ──────────────────── */

    [Fact]
    public async Task A_confirmed_engagement_puts_the_trainer_on_the_FAST_plan_with_its_material_and_ending_it_takes_them_off()
    {
        var fast = UseFakeFast();
        using var staff = await SignInAsync("cap05-b07-staff", "موظف", RoleCode.Manager);
        using var centre = await SignInAsync("cap05-b07-centre", "منسق المركز", RoleCode.CentreCoordinator);
        using var trainers = await SeedTrainersAsync(3);
        var body = GeneralProgramRequest();
        body["fastPlanId"] = FastPlanId;
        var requestId = (await PostAsync(centre, "/api/v1/internal/assignment-requests/", body))
            .GetProperty("requestId").GetString()!;
        var eligible = await ApprovePoolAsync(staff, centre, requestId, trainers);
        var trainerFastUserId = await LinkFastUserAsync(eligible[0]);
        var offerId = await CurrentOfferIdAsync(staff, requestId);
        var trainer = trainers.Clients[eligible[0]];
        var engagementId = (await PostAsync(trainer,
                $"/api/v1/me/assignment-offers/{offerId}/response", new { response = "accept" }))
            .EnumerateArray().Single().GetProperty("engagementId").GetString()!;

        // J-20 — the trainer's material, approved by staff.
        var submissionId = (await GetAsync(trainer, "/api/v1/me/submissions"))
            .EnumerateArray().Single().GetProperty("submissionId").GetString()!;
        Assert.Equal(HttpStatusCode.OK, (await UploadMaterialAsync(
            trainer, $"/api/v1/me/submissions/{submissionId}/upload", "deck.pdf", "%PDF-1.4 deck"u8.ToArray())).StatusCode);
        await PostAsync(staff, $"/api/v1/internal/submissions/{submissionId}/decision", new { decision = "approved" });

        Assert.Equal(2, await PublishFastAsync());

        // B-07 — as a freelance trainer, on the plan the request was linked to.
        var assign = JsonSerializer.Deserialize<JsonElement>(
            fast.Seen.Single(c => c.Url.EndsWith("/api/v1/Plan/AssignTrainer", StringComparison.Ordinal)).Body);
        Assert.Equal(FastPlanId, assign.GetProperty("planId").GetString());
        Assert.Equal(trainerFastUserId.ToString(), assign.GetProperty("trainerFastUserId").GetString());
        Assert.True(assign.GetProperty("isFreelance").GetBoolean());
        // B-09 — the approved file itself, as multipart.
        var material = fast.Seen.Single(c => c.Url.EndsWith("/api/v1/Plan/TrainingMaterial", StringComparison.Ordinal)).Body;
        Assert.Contains(FastPlanId, material, StringComparison.Ordinal);
        Assert.Contains("filename=deck.pdf", material, StringComparison.Ordinal);
        Assert.Contains("%PDF-1.4 deck", material, StringComparison.Ordinal);
        await using (var db = _database.CreateContext())
        {
            Assert.Equal("synchronized", (await db.AssignmentSlots.SingleAsync()).FastSyncState);
            Assert.Equal("synchronized", (await db.MaterialSubmissions.SingleAsync()).FastSyncState);
            Assert.All(await db.OutboxMessages.Where(m => m.SystemCode == IntegrationSystems.Fast).ToListAsync(),
                m => Assert.Equal(OutboxStatuses.Published, m.Status));
        }

        // B-08 — the Academy ends the engagement; FAST is told to take them off.
        await PostAsync(staff, $"/api/v1/internal/engagements/{engagementId}/delink",
            new { reason = "operational-need-change" });
        Assert.Equal(1, await PublishFastAsync());
        var unassign = JsonSerializer.Deserialize<JsonElement>(
            fast.Seen.Single(c => c.Url.EndsWith("/api/v1/Plan/UnassignTrainer", StringComparison.Ordinal)).Body);
        Assert.Equal(FastPlanId, unassign.GetProperty("planId").GetString());
        Assert.Equal(trainerFastUserId.ToString(), unassign.GetProperty("trainerFastUserId").GetString());
        Assert.Equal("operational-need-change", unassign.GetProperty("reasonText").GetString());
    }

    [Fact]
    public async Task An_engagement_on_a_request_without_a_FAST_plan_tells_FAST_nothing()
    {
        var fast = UseFakeFast();
        using var staff = await SignInAsync("cap05-b07-manual-staff", "موظف", RoleCode.Manager);
        using var centre = await SignInAsync("cap05-b07-manual-centre", "منسق المركز", RoleCode.CentreCoordinator);
        using var trainers = await SeedTrainersAsync(3);
        var requestId = await CreateRequestAsync(centre);
        var eligible = await ApprovePoolAsync(staff, centre, requestId, trainers);
        var offerId = await CurrentOfferIdAsync(staff, requestId);
        await PostAsync(trainers.Clients[eligible[0]],
            $"/api/v1/me/assignment-offers/{offerId}/response", new { response = "accept" });

        Assert.Equal(1, await PublishFastAsync());

        Assert.DoesNotContain(fast.Seen, c => c.Url.Contains("/Plan/", StringComparison.Ordinal));
        await using var db = _database.CreateContext();
        Assert.Equal("not-linked", (await db.AssignmentSlots.SingleAsync()).FastSyncState);
    }

    [Fact]
    public async Task FASTs_refusal_or_a_trainer_without_a_FAST_id_keeps_the_assignment_queued_with_the_reason()
    {
        var fast = UseFakeFast();
        using var staff = await SignInAsync("cap05-b07-refused-staff", "موظف", RoleCode.Manager);
        using var centre = await SignInAsync("cap05-b07-refused-centre", "منسق المركز", RoleCode.CentreCoordinator);
        using var trainers = await SeedTrainersAsync(3);
        var body = GeneralProgramRequest();
        body["fastPlanId"] = FastPlanId;
        var requestId = (await PostAsync(centre, "/api/v1/internal/assignment-requests/", body))
            .GetProperty("requestId").GetString()!;
        var eligible = await ApprovePoolAsync(staff, centre, requestId, trainers);
        var offerId = await CurrentOfferIdAsync(staff, requestId);
        await PostAsync(trainers.Clients[eligible[0]],
            $"/api/v1/me/assignment-offers/{offerId}/response", new { response = "accept" });

        // No FAST user id: nothing is sent, and the reason says why.
        Assert.Equal(0, await PublishFastAsync());
        Assert.DoesNotContain(fast.Seen, c => c.Url.Contains("AssignTrainer", StringComparison.Ordinal));
        await using (var db = _database.CreateContext())
        {
            var message = await db.OutboxMessages.SingleAsync(m => m.EntityType == "ENGAGEMENT");
            Assert.Equal(OutboxStatuses.Pending, message.Status);
            Assert.Contains("no FAST user id", message.LastError, StringComparison.Ordinal);
        }

        // FAST refuses (the plan closed meanwhile): still queued, FAST's reason kept.
        await LinkFastUserAsync(eligible[0]);
        fast.WriteStatus = HttpStatusCode.BadRequest;
        Assert.Equal(0, await PublishFastAsync(minutesAhead: 120));
        await using (var db = _database.CreateContext())
        {
            var message = await db.OutboxMessages.SingleAsync(m => m.EntityType == "ENGAGEMENT");
            Assert.Equal(OutboxStatuses.Pending, message.Status);
            Assert.Equal("The plan is closed.", message.LastError);
            Assert.Equal("processing", (await db.AssignmentSlots.SingleAsync()).FastSyncState);
        }
    }

    /* ── B-10 / B-11 / B-12 — the engagement as FAST sees it ───────────────── */

    [Fact]
    public async Task A_FAST_linked_engagement_shows_its_trainees_attendance_Teams_link_and_evaluations()
    {
        UseFakeFast();
        var (trainer, engagementId, _) = await ConfirmFastEngagementAsync("b10");

        var detail = await GetAsync(trainer, $"/api/v1/me/engagements/{engagementId}");

        ContractFixtures.Verify("me.engagement-detail.fast", detail);
        var enrolment = detail.GetProperty("enrolment");
        Assert.True(enrolment.GetProperty("available").GetBoolean());
        // Names only (J-21/F3/AC-2) — nothing else about a trainee.
        var taker = enrolment.GetProperty("takers")[0];
        Assert.Equal("سارة", taker.GetProperty("nameAr").GetString());
        Assert.Equal(["nameAr", "nameEn"], taker.EnumerateObject().Select(p => p.Name));
        var days = detail.GetProperty("attendance").GetProperty("days");
        Assert.Equal("2026-12-06", days[0].GetProperty("date").GetString());
        Assert.Equal(2, days[0].GetProperty("present").GetInt32());
        Assert.Equal(1, days[1].GetProperty("absent").GetInt32());
        Assert.Equal("https://teams.example/meet/1",
            detail.GetProperty("details").GetProperty("meetingUrl").GetString());
        var evaluations = detail.GetProperty("evaluations");
        Assert.Equal(4.5, evaluations.GetProperty("rating").GetProperty("overall").GetDouble());
        // An absent trainee's answer has no value: it is left out, not zeroed.
        var item = Assert.Single(evaluations.GetProperty("items").EnumerateArray());
        Assert.Equal(5, item.GetProperty("rawValue").GetInt32());
    }

    [Fact]
    public async Task FAST_moving_a_plans_dates_moves_the_engagement_and_says_so()
    {
        var fast = UseFakeFast();
        var (_, engagementId, requestId) = await ConfirmFastEngagementAsync("b11-move");
        fast.PlanStatus = StatusJson("open", "2026-12-13", null);

        Assert.Equal(1, await SyncPlanStatusAsync());
        // A second pass with nothing new changes nothing.
        Assert.Equal(0, await SyncPlanStatusAsync());

        await using var db = _database.CreateContext();
        var form = JsonSerializer.Deserialize<JsonElement>(
            (await db.AssignmentRequests.SingleAsync(r => r.RequestId == Guid.Parse(requestId))).FormValues);
        Assert.Equal("2026-12-13", form.GetProperty("dateFrom").GetString());
        Assert.Equal("2026-12-15", form.GetProperty("dateTo").GetString());
        Assert.NotNull((await db.Engagements.SingleAsync(e => e.EngagementId == Guid.Parse(engagementId))).ScheduleChangedAt);
    }

    [Fact]
    public async Task FAST_cancelling_a_plan_cancels_its_engagements_with_FASTs_reason()
    {
        var fast = UseFakeFast();
        var (trainer, engagementId, requestId) = await ConfirmFastEngagementAsync("b11-cancel");
        fast.PlanStatus = StatusJson("canceled", "2026-12-06", "PCR-014");

        Assert.Equal(1, await SyncPlanStatusAsync());

        await using (var db = _database.CreateContext())
        {
            var engagement = await db.Engagements.SingleAsync(e => e.EngagementId == Guid.Parse(engagementId));
            Assert.Equal(EngagementStatuses.Cancelled, engagement.Status);
            var termination = await db.EngagementTerminations.SingleAsync(t => t.EngagementId == engagement.EngagementId);
            Assert.Equal("fast", termination.Actor);
            Assert.Equal("عدم اكتمال النصاب", termination.Reason);
            Assert.Equal("PCR-014", termination.FastCancelReasonCode);
            Assert.Equal(AssignmentRequestStatuses.Closed,
                (await db.AssignmentRequests.SingleAsync(r => r.RequestId == Guid.Parse(requestId))).Status);
        }
        var detail = await GetAsync(trainer, $"/api/v1/me/engagements/{engagementId}");
        Assert.Equal("fast", detail.GetProperty("termination").GetProperty("actor").GetString());
        // Nothing left to read: a cancelled engagement is not read again.
        Assert.Equal(0, await SyncPlanStatusAsync());
    }

    /// <summary>A FAST-linked request, matched and confirmed: the trainer's
    /// client, the engagement and the request.</summary>
    private async Task<(HttpClient Trainer, string EngagementId, string RequestId)> ConfirmFastEngagementAsync(string tag)
    {
        var staff = await SignInAsync($"cap05-{tag}-staff", "موظف", RoleCode.Manager);
        var centre = await SignInAsync($"cap05-{tag}-centre", "منسق المركز", RoleCode.CentreCoordinator);
        var trainers = await SeedTrainersAsync(3);
        var body = GeneralProgramRequest();
        body["fastPlanId"] = FastPlanId;
        var requestId = (await PostAsync(centre, "/api/v1/internal/assignment-requests/", body))
            .GetProperty("requestId").GetString()!;
        var eligible = await ApprovePoolAsync(staff, centre, requestId, trainers);
        await LinkFastUserAsync(eligible[0]);
        var offerId = await CurrentOfferIdAsync(staff, requestId);
        var trainer = trainers.Clients[eligible[0]];
        var engagementId = (await PostAsync(trainer,
                $"/api/v1/me/assignment-offers/{offerId}/response", new { response = "accept" }))
            .EnumerateArray().Single().GetProperty("engagementId").GetString()!;
        return (trainer, engagementId, requestId);
    }

    private async Task<int> SyncPlanStatusAsync()
    {
        using var scope = _configured!.Services.CreateScope();
        return await FastPlanStatusSync.SyncAsync(
            scope.ServiceProvider.GetRequiredService<ExpertHub.Infrastructure.Persistence.ExpertHubDbContext>(),
            scope.ServiceProvider.GetRequiredService<FastTrainingApi>(),
            scope.ServiceProvider.GetRequiredService<NotificationDispatcher>(),
            DateTime.UtcNow,
            CancellationToken.None);
    }

    private static string StatusJson(string status, string firstDay, string? cancelCode) =>
        FastTrainingApiTests.Envelope(new
        {
            planId = FastPlanId,
            status = new { id = "2", code = status },
            teamsUrl = "https://teams.example/meet/1",
            scheduleDays = new[] { 0, 1, 2 }.Select(offset => new
            {
                date = DateTime.Parse(firstDay, System.Globalization.CultureInfo.InvariantCulture)
                    .AddDays(offset).ToString("yyyy-MM-ddT00:00:00", System.Globalization.CultureInfo.InvariantCulture),
                startTime = "17:00:00",
                endTime = "20:00:00",
                isLatestSchedule = true,
            }),
            cancellation = cancelCode is null
                ? null
                : new
                {
                    reason = new { id = "14", code = cancelCode, nameAr = "عدم اكتمال النصاب", nameEn = "Quorum not met" },
                    reasonOther = (string?)null,
                    canceledOn = "2026-11-20T08:00:00",
                },
        });

    /// <summary>The trainer's FAST user id, as their sign-in would have stored it.</summary>
    private async Task<Guid> LinkFastUserAsync(string trainerId)
    {
        await using var db = _database.CreateContext();
        var userId = await db.TrainerProfiles
            .Where(p => p.TrainerId == Guid.Parse(trainerId))
            .Select(p => p.UserId)
            .SingleAsync();
        var fastUserId = Guid.NewGuid();
        db.FastProfiles.Add(new FastProfileReplica
        {
            UserId = userId,
            FastUserId = fastUserId.ToString(),
            LastSyncedAt = DateTime.UtcNow,
        });
        await db.SaveChangesAsync();
        return fastUserId;
    }

    /// <summary>One outbox pass, driven by hand; returns how many were published.</summary>
    private async Task<int> PublishFastAsync(int minutesAhead = 1)
    {
        using var scope = _configured!.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ExpertHub.Infrastructure.Persistence.ExpertHubDbContext>();
        var channel = scope.ServiceProvider.GetRequiredService<ExpertHub.Infrastructure.Integration.IIntegrationChannel>();
        return await ExpertHub.Infrastructure.Integration.OutboxPublisher.PublishDueAsync(
            db, channel, DateTime.UtcNow.AddMinutes(minutesAhead), CancellationToken.None);
    }

    /* ── the fake Training API ─────────────────────────────────────────────── */

    /// <summary>Swaps the Training API for one over <see cref="FakeTrainingFast"/>.
    /// Call before signing anyone in: it replaces the test host.</summary>
    private FakeTrainingFast UseFakeFast()
    {
        var fast = new FakeTrainingFast();
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Fast:TrainingBaseUrl"] = "https://fast.test/training",
            })
            .Build();
        var tokens = new FakeTrainingFast.Token();
        var api = new FastTrainingApi(
            new FastApiClient(new HttpClient(fast), tokens, configuration, "Fast:TrainingBaseUrl"), tokens);
        _configured = _configured!.WithWebHostBuilder(builder =>
        {
            // The publisher is driven by hand in these tests, never by its timer.
            builder.UseSetting("Integration:PublishIntervalSeconds", "86400");
            builder.ConfigureTestServices(services => services.AddSingleton(api));
        });
        return fast;
    }

    private static string PlanJson(string status, string? finalClosedOn, string firstDay) =>
        FastTrainingApiTests.Envelope(new
        {
            planId = FastPlanId,
            planCode = "PL-2026-77",
            programId = FastProgramId,
            status = new { id = "2", code = status, nameAr = status, nameEn = status },
            finalClosedOn,
            numberOfDays = 3,
            numberOfHours = 15.0,
            programFee = 0.0,
            language = new { id = "2", code = (string?)null, nameAr = "الإنجليزية", nameEn = "English" },
            deliveryMode = new { id = "2", code = "online", nameAr = "عن بعد", nameEn = "Online" },
            venueScope = "online",
            city = new { id = "1", nameAr = "الرياض", nameEn = "Riyadh" },
            period = "evening",
            clientOrganizations = Array.Empty<object>(),
            teamsUrl = "https://teams.example/meet/1",
            scheduleDays = new[] { 0, 1, 2 }.Select(offset => new
            {
                date = DateTime.Parse(firstDay, System.Globalization.CultureInfo.InvariantCulture)
                    .AddDays(offset).ToString("yyyy-MM-ddT00:00:00", System.Globalization.CultureInfo.InvariantCulture),
                startTime = "17:00:00",
                endTime = "20:00:00",
                isLatestSchedule = true,
            }),
            trainers = Array.Empty<object>(),
        });

    private sealed record SeenFastCall(string Method, string Url, string Body);

    /// <summary>The Training API, by path — every call recorded.</summary>
    private sealed class FakeTrainingFast : HttpMessageHandler
    {
        public string Plan { get; set; } = PlanJson("open", null, "2026-12-06");

        public bool Down { get; set; }

        /// <summary>`Plan/GetPlanStatus` — open, on the plan's own dates, by default.</summary>
        public string PlanStatus { get; set; } = StatusJson("open", "2026-12-06", null);

        /// <summary>The status code AssignTrainer / UnassignTrainer answer with.</summary>
        public HttpStatusCode WriteStatus { get; set; } = HttpStatusCode.OK;

        public List<SeenFastCall> Seen { get; } = [];

        protected override async Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request, CancellationToken cancellationToken)
        {
            var url = request.RequestUri!.ToString();
            var body = request.Content is null ? string.Empty : await request.Content.ReadAsStringAsync(cancellationToken);
            lock (Seen)
            {
                Seen.Add(new SeenFastCall(request.Method.Method, url, body));
            }
            if (Down)
            {
                throw new HttpRequestException("connection refused");
            }
            var (status, json) = Respond(url);
            return new HttpResponseMessage(status)
            {
                Content = new StringContent(json, Encoding.UTF8, "application/json"),
            };
        }

        private (HttpStatusCode, string) Respond(string url)
        {
            if (url.Contains("Program/Search", StringComparison.Ordinal))
            {
                return (HttpStatusCode.OK, FastTrainingApiTests.Envelope(new
                {
                    totalItems = 1, pageNumber = 1, pageSize = 50,
                    items = new[]
                    {
                        new
                        {
                            programId = FastProgramId, programCode = "PRG-1",
                            nameAr = "برنامج القيادة المالية", nameEn = "Financial Leadership",
                            status = "active", isExecutive = false, isCustom = false,
                        },
                    },
                }));
            }
            if (url.Contains("GetPlansByProgramId", StringComparison.Ordinal))
            {
                return (HttpStatusCode.OK, FastTrainingApiTests.Envelope(new object[]
                {
                    new { planId = FastPlanId, planCode = "PL-2026-77", status = new { code = "open" }, startDate = "2026-12-06T00:00:00", endDate = "2026-12-08T00:00:00", deliveryMode = "online", hasTrainer = false },
                    new { planId = Guid.NewGuid().ToString(), planCode = "PL-OLD", status = new { code = "closed" }, startDate = "2026-12-06T00:00:00", endDate = "2026-12-08T00:00:00", deliveryMode = "online", hasTrainer = true },
                }));
            }
            if (url.Contains("GetPlanDetails", StringComparison.Ordinal))
            {
                return (HttpStatusCode.OK, Plan);
            }
            if (url.Contains("GetProgramDetails", StringComparison.Ordinal))
            {
                return (HttpStatusCode.OK, FastTrainingApiTests.Envelope(new
                {
                    programId = FastProgramId, nameAr = "برنامج القيادة المالية", nameEn = "Financial Leadership",
                    traineeLevel = new { id = "3", nameAr = "متقدم", nameEn = "Advanced" },
                }));
            }
            if (url.Contains("Plan/AssignTrainer", StringComparison.Ordinal))
            {
                return WriteStatus == HttpStatusCode.OK
                    ? (HttpStatusCode.OK, FastTrainingApiTests.Envelope(new { planTrainerId = "pt-1", planId = FastPlanId, alreadyAssigned = false }))
                    : (WriteStatus, JsonSerializer.Serialize(new { success = false, message = "The plan is closed." }));
            }
            if (url.Contains("Plan/UnassignTrainer", StringComparison.Ordinal))
            {
                return (HttpStatusCode.OK, FastTrainingApiTests.Envelope(new { planId = FastPlanId, removed = true }));
            }
            if (url.Contains("Plan/GetPlanStatus", StringComparison.Ordinal))
            {
                return (HttpStatusCode.OK, PlanStatus);
            }
            if (url.Contains("Plan/GetPlanTakers", StringComparison.Ordinal))
            {
                return (HttpStatusCode.OK, FastTrainingApiTests.Envelope(new[]
                {
                    new
                    {
                        nameAr = "سارة", nameEn = "Sara",
                        attendance = new[]
                        {
                            new { date = "2026-12-06T00:00:00", sessionStartTime = "17:00:00", status = "present" },
                            new { date = "2026-12-07T00:00:00", sessionStartTime = "17:00:00", status = "absent" },
                        },
                    },
                    new
                    {
                        nameAr = "خالد", nameEn = "Khalid",
                        attendance = new[]
                        {
                            new { date = "2026-12-06T00:00:00", sessionStartTime = "17:00:00", status = "present" },
                        },
                    },
                }));
            }
            if (url.Contains("Survey/GetTrainerEvaluations", StringComparison.Ordinal))
            {
                return (HttpStatusCode.OK, FastTrainingApiTests.Envelope(new
                {
                    planId = FastPlanId,
                    rating = new { overallRating = 4.5, responseCount = 2 },
                    planSurveyResponses = new object[]
                    {
                        new { evaluationId = "e1", questionId = "q1", questionTextAr = "وضوح الشرح", value = 5, scaleLow = 1, scaleHigh = 5, receivedAt = "2026-12-08T10:00:00" },
                        new { evaluationId = "e2", questionId = "q1", questionTextAr = "وضوح الشرح", value = (int?)null, scaleLow = 1, scaleHigh = 5, receivedAt = "2026-12-08T10:00:00" },
                    },
                }));
            }
            if (url.Contains("Plan/TrainingMaterial", StringComparison.Ordinal))
            {
                return (HttpStatusCode.OK, FastTrainingApiTests.Envelope(new { planId = FastPlanId, status = new { code = "current" } }));
            }
            return (HttpStatusCode.NotFound, JsonSerializer.Serialize(new { success = false, message = "Not found." }));
        }

        public sealed class Token : IFastTokenProvider
        {
            public Task<string?> GetTokenAsync(CancellationToken cancellationToken) =>
                Task.FromResult<string?>("fake-training-token");
        }
    }
}
