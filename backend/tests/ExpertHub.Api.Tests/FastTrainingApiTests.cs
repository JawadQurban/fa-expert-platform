using System.Net;
using System.Text;
using System.Text.Json;
using ExpertHub.Core.Domain;
using ExpertHub.Infrastructure.Fast;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;

namespace ExpertHub.Api.Tests;

/// <summary>
/// The FAST Training API client (B-03…B-15): the `ApiResponse` envelope, the
/// typed shapes of its OpenAPI document, the multipart material upload, and
/// the B-15 lookups synchronized into `REFERENCE_VALUE`. FAST is a fake HTTP
/// handler — no live FAST call is made.
/// </summary>
public sealed class FastTrainingApiTests : IAsyncLifetime
{
    private const string ServiceToken = "training-svc-token-DO-NOT-LEAK";

    private readonly LocalDbFixture _database = new();

    public Task InitializeAsync() => _database.InitializeAsync();

    public Task DisposeAsync() => _database.DisposeAsync();

    [Fact]
    public async Task A_lookup_syncs_into_its_list_keeping_FASTs_inactive_flag_code_and_parent()
    {
        var fast = new FakeFast(_ => Envelope(new object[]
        {
            new { id = "10", code = (string?)null, nameAr = "البنوك", nameEn = "Banking", isActive = true, parentId = (string?)null },
            new { id = "11", code = (string?)null, nameAr = "التمويل", nameEn = "Finance", isActive = true, parentId = "10" },
            new { id = "12", code = (string?)null, nameAr = "قديم", nameEn = "Old", isActive = false, parentId = (string?)null },
        }));
        await using var db = _database.CreateContext();

        var result = await Sync(fast, ServiceToken)
            .SyncTrainingListAsync(db, FastReferenceLists.Sectors, Now(), CancellationToken.None);

        Assert.True(result.Succeeded);
        Assert.Equal(3, result.Added);
        var values = await db.ReferenceValues.AsNoTracking()
            .Where(v => v.ListCode == FastReferenceLists.Sectors)
            .ToDictionaryAsync(v => v.Code);
        Assert.Equal("التمويل", values["11"].LabelAr);
        Assert.Equal("Finance", values["11"].LabelEn);
        using (var attributes = JsonDocument.Parse(values["11"].Attributes!))
        {
            Assert.Equal("10", attributes.RootElement.GetProperty("parentId").GetString());
        }
        // A value FAST retired stays readable, inactive.
        Assert.False(values["12"].IsActive);

        var request = Assert.Single(fast.Requests);
        Assert.Equal($"Bearer {ServiceToken}", request.Authorization);
        Assert.Equal("https://fast.test/training/api/v1/Lookup/GetSectors", request.Url);
        var log = await db.IntegrationLog.SingleAsync();
        Assert.Equal(IntegrationOutcomes.Success, log.Outcome);
        Assert.Equal("REFERENCE_LIST:fast-sector", log.EntityType);
    }

    [Fact]
    public async Task Without_a_service_credential_the_lookup_sync_calls_nothing_and_records_the_wait()
    {
        var fast = new FakeFast(_ => Envelope(Array.Empty<object>()));
        await using var db = _database.CreateContext();

        var result = await Sync(fast, token: null)
            .SyncTrainingListAsync(db, FastReferenceLists.Languages, Now(), CancellationToken.None);

        Assert.False(result.Succeeded);
        Assert.StartsWith("WAITING_FOR_FAST_SERVICE_CREDENTIAL", result.Error, StringComparison.Ordinal);
        Assert.Empty(fast.Requests);
    }

    [Fact]
    public async Task Every_training_list_is_registered_and_served_by_the_reference_lookup()
    {
        await using var db = _database.CreateContext();
        var registered = await db.ReferenceLists.AsNoTracking().Select(l => l.ListCode).ToListAsync();
        foreach (var (code, _, _) in FastReferenceLists.TrainingLists)
        {
            Assert.Contains(code, registered);
            Assert.Contains(code, FastReferenceLists.All);
            Assert.True(FastTrainingApi.LookupPaths.ContainsKey(code));
        }
    }

    [Fact]
    public async Task Plan_details_are_read_through_the_ApiResponse_envelope_with_their_schedule()
    {
        var fast = new FakeFast(_ => Envelope(new
        {
            planId = "5b0e8f1e-0000-4000-8000-000000000001",
            planCode = "PL-1",
            status = new { id = "2", code = "open", nameAr = "مفتوحة", nameEn = "Open" },
            numberOfDays = 3,
            numberOfHours = 15.0,
            period = "morning",
            city = new { id = "1", nameAr = "الرياض", nameEn = "Riyadh" },
            scheduleDays = new[]
            {
                new { date = "2026-11-02T00:00:00", startTime = "09:00:00", endTime = "14:00:00", isLatestSchedule = true },
            },
            clientOrganizations = Array.Empty<object>(),
            trainers = Array.Empty<object>(),
        }));

        var result = await Api(fast).PlanDetailsAsync("5b0e8f1e-0000-4000-8000-000000000001", CancellationToken.None);

        Assert.True(result.Ok, result.Error);
        var plan = result.Value!;
        Assert.Equal("open", plan.Status!.Code);
        Assert.Equal(3, plan.NumberOfDays);
        Assert.Equal(new TimeSpan(9, 0, 0), Assert.Single(plan.ScheduleDays!).StartTime);
        Assert.Equal("Riyadh", plan.City!.NameEn);
        Assert.EndsWith("/api/v1/Program/GetPlanDetails?planId=5b0e8f1e-0000-4000-8000-000000000001",
            Assert.Single(fast.Requests).Url, StringComparison.Ordinal);
    }

    [Fact]
    public async Task A_refusal_in_the_envelope_is_a_failure_with_FASTs_message()
    {
        var fast = new FakeFast(_ => JsonSerializer.Serialize(new { success = false, message = "The plan is closed.", value = (object?)null }),
            HttpStatusCode.BadRequest);

        var result = await Api(fast).AssignTrainerAsync(Guid.NewGuid(), Guid.NewGuid(), true, CancellationToken.None);

        Assert.False(result.Ok);
        Assert.Equal(400, result.StatusCode);
        Assert.Equal("The plan is closed.", result.Error);
    }

    [Fact]
    public async Task The_material_upload_is_multipart_with_the_plan_the_status_and_the_file()
    {
        var fast = new FakeFast(_ => Envelope(new { planId = "p", status = new { code = "current" } }));
        var planId = Guid.NewGuid();

        var result = await Api(fast).SetTrainingMaterialAsync(
            planId, "current", "deck.pdf", [1, 2, 3], "application/pdf", CancellationToken.None);

        Assert.True(result.Ok, result.Error);
        var body = Assert.Single(fast.Requests).Body!;
        Assert.Contains("name=PlanId", body, StringComparison.Ordinal);
        Assert.Contains(planId.ToString(), body, StringComparison.Ordinal);
        Assert.Contains("name=StatusCode", body, StringComparison.Ordinal);
        Assert.Contains("filename=deck.pdf", body, StringComparison.Ordinal);
    }

    [Theory]
    [InlineData("open", false, 5, true)]
    [InlineData("new", false, 5, true)]
    [InlineData("closed", false, 5, false)]
    [InlineData("final-closed", false, 5, false)]
    [InlineData("canceled", false, 5, false)]
    [InlineData("open", true, 5, false)]
    [InlineData("open", false, -1, false)]
    public void Only_a_new_or_open_plan_that_has_not_ended_is_assignable(
        string code, bool finalClosed, int endInDays, bool expected)
    {
        var today = new DateTime(2026, 10, 20);
        Assert.Equal(expected, FastPlanStatuses.IsAssignable(
            new FastNamedRef("1", code, null, null),
            finalClosed ? today : null,
            today.AddDays(endInDays),
            today));
    }

    /* ── helpers ───────────────────────────────────────────────────────────── */

    private static DateTime Now() => new(2026, 10, 20, 8, 0, 0, DateTimeKind.Utc);

    private static IConfiguration Config() =>
        new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Fast:TrainingBaseUrl"] = "https://fast.test/training",
            })
            .Build();

    private static FastTrainingApi Api(FakeFast fast, string? token = ServiceToken)
    {
        var tokens = new StaticToken(token);
        return new FastTrainingApi(
            new FastApiClient(new HttpClient(fast), tokens, Config(), "Fast:TrainingBaseUrl"), tokens);
    }

    private static FastReferenceDataSync Sync(FakeFast fast, string? token)
    {
        var portalOff = new FastApiClient(new HttpClient(fast), new StaticToken(token), Config());
        return new FastReferenceDataSync(
            portalOff, new StaticToken(token), NullLogger<FastReferenceDataSync>.Instance, Api(fast, token));
    }

    internal static string Envelope(object value) =>
        JsonSerializer.Serialize(new { success = true, message = (string?)null, value });

    private sealed class StaticToken(string? token) : IFastTokenProvider
    {
        public Task<string?> GetTokenAsync(CancellationToken cancellationToken) => Task.FromResult(token);
    }

    private sealed record SeenRequest(string Url, string? Authorization, string? Body);

    private sealed class FakeFast(Func<HttpRequestMessage, string> respond, HttpStatusCode status = HttpStatusCode.OK)
        : HttpMessageHandler
    {
        public List<SeenRequest> Requests { get; } = [];

        protected override async Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request, CancellationToken cancellationToken)
        {
            var body = request.Content is null ? null : await request.Content.ReadAsStringAsync(cancellationToken);
            Requests.Add(new SeenRequest(request.RequestUri!.ToString(), request.Headers.Authorization?.ToString(), body));
            return new HttpResponseMessage(status)
            {
                Content = new StringContent(respond(request), Encoding.UTF8, "application/json"),
            };
        }
    }
}
