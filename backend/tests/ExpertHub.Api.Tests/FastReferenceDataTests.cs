using System.Net;
using System.Text;
using System.Text.Json;
using ExpertHub.Core.Domain;
using ExpertHub.Infrastructure.Fast;
using ExpertHub.Infrastructure.Persistence;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;

namespace ExpertHub.Api.Tests;

/// <summary>
/// FAST reference data: a synchronized copy in `REFERENCE_VALUE`, filled
/// through a SERVICE credential only, idempotent, never destructive, and read
/// by Expert Hub without FAST being online. FAST is mocked at the HTTP layer —
/// no live FAST call is made or claimed.
/// </summary>
public sealed class FastReferenceDataTests
    : IClassFixture<WebApplicationFactory<Program>>, IAsyncLifetime, IDisposable
{
    private const string ServiceToken = "svc-token-7f3a-DO-NOT-LEAK";

    private readonly WebApplicationFactory<Program> _factory;
    private readonly LocalDbFixture _database = new();
    private readonly TestOidc.FakeTokenEndpoint _tokenEndpoint = new();
    private WebApplicationFactory<Program>? _configured;

    public FastReferenceDataTests(WebApplicationFactory<Program> factory) => _factory = factory;

    public async Task InitializeAsync()
    {
        await _database.InitializeAsync();
        _configured = TestOidc.Configure(
            _factory, _tokenEndpoint, ("ConnectionStrings:ExpertHub", _database.ConnectionString));
    }

    public async Task DisposeAsync()
    {
        _configured?.Dispose();
        await _database.DisposeAsync();
    }

    public void Dispose() => _tokenEndpoint.Dispose();

    /* ── synchronization ───────────────────────────────────────────────────── */

    [Fact]
    public async Task A_first_sync_copies_the_countries_with_both_languages_and_their_attributes()
    {
        var fast = new FakeFast(Countries(("1", "السعودية", "Saudi Arabia"), ("2", "الكويت", "Kuwait")));
        await using var db = _database.CreateContext();

        var result = await Sync(fast, ServiceToken).SyncCountriesAsync(db, Now(0), CancellationToken.None);

        Assert.True(result.Succeeded);
        Assert.Equal(2, result.Added);
        var saudi = await db.ReferenceValues.AsNoTracking()
            .SingleAsync(v => v.ListCode == FastReferenceLists.Countries && v.Code == "1");
        Assert.Equal("السعودية", saudi.LabelAr);
        Assert.Equal("Saudi Arabia", saudi.LabelEn);
        Assert.Equal(IntegrationSystems.Fast, saudi.Source);
        Assert.True(saudi.IsActive);
        using var attributes = JsonDocument.Parse(saudi.Attributes!);
        Assert.Equal("سعودي", attributes.RootElement.GetProperty("nationalityAr").GetString());
        // An INTEGER in the register's DTO — this used to fail the whole read.
        Assert.Equal(101, attributes.RootElement.GetProperty("nafathMappingCode").GetInt32());
        // Carried as received; nothing filters on it.
        Assert.False(attributes.RootElement.GetProperty("isRestricted").GetBoolean());

        // The call went out with the SERVICE credential and asked in Arabic.
        var request = Assert.Single(fast.Requests);
        Assert.Equal($"Bearer {ServiceToken}", request.Authorization);
        Assert.EndsWith("/api/v1/Lookup/GetCountries", request.Url, StringComparison.Ordinal);

        var log = await db.IntegrationLog.SingleAsync();
        Assert.Equal(IntegrationOutcomes.Success, log.Outcome);
        Assert.Equal("REFERENCE_LIST:fast-country", log.EntityType);
        var list = await db.ReferenceLists.AsNoTracking().SingleAsync(l => l.ListCode == FastReferenceLists.Countries);
        Assert.False(list.IsEditable);
    }

    [Fact]
    public async Task Rerunning_the_same_sync_changes_nothing_and_duplicates_nothing()
    {
        var fast = new FakeFast(Countries(("1", "السعودية", "Saudi Arabia"), ("2", "الكويت", "Kuwait")));
        await using var db = _database.CreateContext();
        var sync = Sync(fast, ServiceToken);

        await sync.SyncCountriesAsync(db, Now(0), CancellationToken.None);
        var again = await sync.SyncCountriesAsync(db, Now(1), CancellationToken.None);

        Assert.True(again.Succeeded);
        Assert.Equal((0, 0, 0), (again.Added, again.Updated, again.Deactivated));
        Assert.Equal(2, await db.ReferenceValues.CountAsync(v => v.ListCode == FastReferenceLists.Countries));
    }

    [Fact]
    public async Task A_renamed_value_is_updated_and_a_missing_one_is_deactivated_never_deleted()
    {
        await using var db = _database.CreateContext();
        await Sync(new FakeFast(Countries(("1", "السعودية", "Saudi Arabia"), ("2", "الكويت", "Kuwait"))), ServiceToken)
            .SyncCountriesAsync(db, Now(0), CancellationToken.None);

        var result = await Sync(new FakeFast(Countries(("1", "المملكة العربية السعودية", "Saudi Arabia"))), ServiceToken)
            .SyncCountriesAsync(db, Now(1), CancellationToken.None);

        Assert.Equal((0, 1, 1), (result.Added, result.Updated, result.Deactivated));
        var values = await db.ReferenceValues.AsNoTracking()
            .Where(v => v.ListCode == FastReferenceLists.Countries)
            .ToDictionaryAsync(v => v.Code);
        Assert.Equal("المملكة العربية السعودية", values["1"].LabelAr);
        // Still there, still resolvable for an old answer — only inactive.
        Assert.False(values["2"].IsActive);
        Assert.Equal("الكويت", values["2"].LabelAr);

        // And it comes back when FAST sends it again.
        var back = await Sync(new FakeFast(Countries(("1", "المملكة العربية السعودية", "Saudi Arabia"), ("2", "الكويت", "Kuwait"))), ServiceToken)
            .SyncCountriesAsync(db, Now(2), CancellationToken.None);
        Assert.Equal(1, back.Updated);
        Assert.True((await db.ReferenceValues.AsNoTracking().SingleAsync(v => v.ListCode == FastReferenceLists.Countries && v.Code == "2")).IsActive);
    }

    [Fact]
    public async Task FAST_being_down_or_empty_keeps_the_last_successful_copy_and_logs_why()
    {
        await using var db = _database.CreateContext();
        await Sync(new FakeFast(Countries(("1", "السعودية", "Saudi Arabia"))), ServiceToken)
            .SyncCountriesAsync(db, Now(0), CancellationToken.None);

        var down = await Sync(FakeFast.Failing(HttpStatusCode.InternalServerError), ServiceToken)
            .SyncCountriesAsync(db, Now(1), CancellationToken.None);
        var unreachable = await Sync(FakeFast.Throwing(), ServiceToken)
            .SyncCountriesAsync(db, Now(2), CancellationToken.None);
        var empty = await Sync(new FakeFast("""{"isValid":true,"value":[]}"""), ServiceToken)
            .SyncCountriesAsync(db, Now(3), CancellationToken.None);

        Assert.False(down.Succeeded);
        Assert.False(unreachable.Succeeded);
        Assert.False(empty.Succeeded);
        Assert.Contains("empty", empty.Error, StringComparison.OrdinalIgnoreCase);
        var saudi = await db.ReferenceValues.AsNoTracking()
            .SingleAsync(v => v.ListCode == FastReferenceLists.Countries && v.Code == "1");
        Assert.True(saudi.IsActive);
        var outcomes = await db.IntegrationLog.OrderBy(l => l.OccurredAt).Select(l => l.Outcome).ToListAsync();
        Assert.Equal(
            [IntegrationOutcomes.Success, IntegrationOutcomes.Failure, IntegrationOutcomes.Failure, IntegrationOutcomes.Failure],
            outcomes);
    }

    [Fact]
    public async Task Without_a_service_credential_nothing_is_called_and_the_wait_is_recorded()
    {
        var fast = new FakeFast(Countries(("1", "السعودية", "Saudi Arabia")));
        await using var db = _database.CreateContext();

        var result = await Sync(fast, token: null).SyncCountriesAsync(db, Now(0), CancellationToken.None);

        Assert.False(result.Succeeded);
        Assert.StartsWith("WAITING_FOR_FAST_SERVICE_CREDENTIAL", result.Error, StringComparison.Ordinal);
        Assert.Empty(fast.Requests);
        Assert.False(await db.ReferenceValues.AnyAsync(v => v.ListCode == FastReferenceLists.Countries));
        Assert.StartsWith("WAITING_FOR_FAST_SERVICE_CREDENTIAL",
            (await db.IntegrationLog.SingleAsync()).ErrorDetail, StringComparison.Ordinal);
    }

    [Fact]
    public async Task With_FAST_switched_off_the_sync_is_a_silent_no_op()
    {
        var fast = new FakeFast(Countries(("1", "السعودية", "Saudi Arabia")));
        await using var db = _database.CreateContext();
        var client = new FastApiClient(new HttpClient(fast), new StaticToken(ServiceToken), Config(baseUrl: ""));
        var sync = new FastReferenceDataSync(client, new StaticToken(ServiceToken), NullLogger<FastReferenceDataSync>.Instance);

        var result = await sync.SyncCountriesAsync(db, Now(0), CancellationToken.None);

        Assert.False(result.Succeeded);
        Assert.Empty(fast.Requests);
        Assert.False(await db.IntegrationLog.AnyAsync());
    }

    /* ── the lookup provider and the status read ───────────────────────────── */

    [Fact]
    public async Task The_lookup_serves_Expert_Hubs_copy_and_old_values_on_request_never_a_credential()
    {
        await using (var db = _database.CreateContext())
        {
            await Sync(new FakeFast(Countries(("1", "السعودية", "Saudi Arabia"), ("2", "الكويت", "Kuwait"))), ServiceToken)
                .SyncCountriesAsync(db, Now(0), CancellationToken.None);
            // A failure afterwards, so the status has an error to show.
            await Sync(new FakeFast(Countries(("1", "السعودية", "Saudi Arabia"))), ServiceToken)
                .SyncCountriesAsync(db, Now(1), CancellationToken.None);
        }

        var anonymous = TestOidc.CreateClient(_configured!);
        var refused = await anonymous.GetAsync("/api/v1/reference-data/fast-country");
        Assert.Equal(HttpStatusCode.Unauthorized, refused.StatusCode);

        using var staff = TestOidc.CreateClient(_configured!);
        await TestOidc.SignInAsync(staff, _tokenEndpoint, "fa-staff", subject: "ref-staff", displayName: "موظف");

        var activeRaw = await staff.GetStringAsync("/api/v1/reference-data/fast-country");
        using var active = JsonDocument.Parse(activeRaw);
        var codes = active.RootElement.GetProperty("values").EnumerateArray()
            .Select(v => v.GetProperty("code").GetString()).ToList();
        Assert.Equal(["1"], codes);
        Assert.NotEqual(JsonValueKind.Null, active.RootElement.GetProperty("lastSuccessfulSyncAt").ValueKind);

        using var withHistory = JsonDocument.Parse(
            await staff.GetStringAsync("/api/v1/reference-data/fast-country?includeInactive=true"));
        var kuwait = withHistory.RootElement.GetProperty("values").EnumerateArray()
            .Single(v => v.GetProperty("code").GetString() == "2");
        Assert.False(kuwait.GetProperty("isActive").GetBoolean());
        Assert.Equal("الكويت", kuwait.GetProperty("labelAr").GetString());

        var unknown = await staff.GetAsync("/api/v1/reference-data/centre");
        Assert.Equal(HttpStatusCode.NotFound, unknown.StatusCode);

        var statusRaw = await staff.GetStringAsync("/api/v1/internal/integration/reference-data");
        using var status = JsonDocument.Parse(statusRaw);
        var countries = status.RootElement.GetProperty("lists").EnumerateArray().Single();
        Assert.Equal(1, countries.GetProperty("activeCount").GetInt32());
        Assert.Equal(1, countries.GetProperty("inactiveCount").GetInt32());

        // The credential crossed to FAST and nowhere else.
        foreach (var payload in new[] { activeRaw, statusRaw })
        {
            Assert.DoesNotContain(ServiceToken, payload, StringComparison.Ordinal);
            Assert.DoesNotContain("Bearer", payload, StringComparison.Ordinal);
        }
        await using var check = _database.CreateContext();
        Assert.DoesNotContain(await check.IntegrationLog.Select(l => l.ErrorDetail ?? string.Empty).ToListAsync(),
            detail => detail.Contains(ServiceToken, StringComparison.Ordinal));
    }

    /* ── helpers ───────────────────────────────────────────────────────────── */

    private static DateTime Now(int minutes) =>
        new DateTime(2026, 9, 16, 8, 0, 0, DateTimeKind.Utc).AddMinutes(minutes);

    private static IConfiguration Config(string baseUrl = "https://fast.test/fa-api") =>
        new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?> { ["Fast:BaseUrl"] = baseUrl })
            .Build();

    private static FastReferenceDataSync Sync(FakeFast fast, string? token)
    {
        var tokens = new StaticToken(token);
        var client = new FastApiClient(new HttpClient(fast), tokens, Config());
        return new FastReferenceDataSync(client, tokens, NullLogger<FastReferenceDataSync>.Instance);
    }

    /// <summary>The register's `CountryRegistrationLookupDto`, in the `ReturnResult` envelope.</summary>
    private static string Countries(params (string Id, string NameAr, string NameEn)[] countries) =>
        JsonSerializer.Serialize(new
        {
            isValid = true,
            message = "",
            value = countries.Select(c => new
            {
                id = int.Parse(c.Id, System.Globalization.CultureInfo.InvariantCulture),
                nameAr = c.NameAr,
                nameEn = c.NameEn,
                nationalityAr = c.Id == "1" ? "سعودي" : "كويتي",
                nationalityEn = c.Id == "1" ? "Saudi" : "Kuwaiti",
                countryCode = c.Id == "1" ? "SA" : "KW",
                nafathMappingCode = 100 + int.Parse(c.Id, System.Globalization.CultureInfo.InvariantCulture),
                isRestricted = false,
            }),
        });

    private sealed class StaticToken(string? token) : IFastTokenProvider
    {
        public Task<string?> GetTokenAsync(CancellationToken cancellationToken) => Task.FromResult(token);
    }

    private sealed record SeenRequest(string Url, string? Authorization);

    private sealed class FakeFast : HttpMessageHandler
    {
        private readonly Func<HttpResponseMessage> _respond;

        public FakeFast(string body) =>
            _respond = () => new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(body, Encoding.UTF8, "application/json"),
            };

        private FakeFast(Func<HttpResponseMessage> respond) => _respond = respond;

        public List<SeenRequest> Requests { get; } = [];

        public static FakeFast Failing(HttpStatusCode status) =>
            new(() => new HttpResponseMessage(status) { Content = new StringContent("oops") });

        public static FakeFast Throwing() =>
            new(() => throw new HttpRequestException("connection refused"));

        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request, CancellationToken cancellationToken)
        {
            Requests.Add(new SeenRequest(request.RequestUri!.ToString(), request.Headers.Authorization?.ToString()));
            return Task.FromResult(_respond());
        }
    }
}
