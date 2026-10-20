using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using ExpertHub.Api.Assignments;
using ExpertHub.Core.Domain;
using ExpertHub.Infrastructure.Fast;
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
