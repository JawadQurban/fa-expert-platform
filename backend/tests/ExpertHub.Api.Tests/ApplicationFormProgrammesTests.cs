using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using ExpertHub.Infrastructure.Fast;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace ExpertHub.Api.Tests;

/// <summary>
/// UAT BUG-004 (`P-386`) — the application form's programme list: the
/// Academy's PUBLISHED programmes from the FAST Training API (a fake HTTP
/// handler — never the live server), read whole, cached, and never in the way
/// when FAST is off or failing.
/// </summary>
public sealed class ApplicationFormProgrammesTests
    : IClassFixture<WebApplicationFactory<Program>>, IAsyncLifetime, IDisposable
{
    private const string Route = "/api/v1/applications/form-options/fast-programmes";

    private readonly WebApplicationFactory<Program> _factory;
    private readonly LocalDbFixture _database = new();
    private readonly TestOidc.FakeTokenEndpoint _tokenEndpoint = new();
    private WebApplicationFactory<Program>? _configured;

    public ApplicationFormProgrammesTests(WebApplicationFactory<Program> factory) => _factory = factory;

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

    [Fact]
    public async Task An_applicant_gets_every_published_programme_page_by_page_and_FAST_is_asked_once()
    {
        var fast = UseFakeFast();
        var client = TestOidc.CreateClient(_configured!);
        await TestOidc.SignInAsync(client, _tokenEndpoint, "unmapped");

        var options = await client.GetFromJsonAsync<JsonElement>(Route);

        Assert.True(options.GetProperty("available").GetBoolean());
        var items = options.GetProperty("items").EnumerateArray().ToList();
        // 200 on page one + 1 on page two — past the 200-result ceiling
        // `P-373` notes for the staff picker — less the unpublished row, the
        // row without an id and the duplicate are left out.
        Assert.Equal(201, items.Count);
        Assert.Equal("fast:prog-0001", items[0].GetProperty("value").GetString());
        Assert.Equal("برنامج 1", items[0].GetProperty("labelAr").GetString());
        Assert.Equal("Programme 1", items[0].GetProperty("labelEn").GetString());
        // The snapshot separator never survives inside a name.
        Assert.Contains(items, i => i.GetProperty("labelAr").GetString() == "برنامج / بفاصل");
        Assert.DoesNotContain(items, i => i.GetProperty("value").GetString() == "fast:prog-draft");

        // Published only — unlike the staff picker (P-373) — and no upcoming-plan filter.
        var searches = fast.Seen.Where(c => c.Url.Contains("Program/Search", StringComparison.Ordinal)).ToList();
        Assert.Equal(2, searches.Count);
        var body = JsonSerializer.Deserialize<JsonElement>(searches[0].Body);
        Assert.Equal("active", body.GetProperty("status").GetString());
        Assert.False(body.GetProperty("hasUpcomingPlans").GetBoolean());
        Assert.Equal(200, body.GetProperty("pageSize").GetInt32());
        Assert.Equal(2, JsonSerializer.Deserialize<JsonElement>(searches[1].Body).GetProperty("pageNumber").GetInt32());

        // Cached: a second applicant does not send FAST another search.
        var again = await client.GetFromJsonAsync<JsonElement>(Route);
        Assert.Equal(items.Count, again.GetProperty("items").GetArrayLength());
        Assert.Equal(2, fast.Seen.Count(c => c.Url.Contains("Program/Search", StringComparison.Ordinal)));
    }

    [Fact]
    public async Task With_FAST_down_or_not_configured_the_list_is_unavailable_never_an_error()
    {
        var fast = UseFakeFast();
        fast.Down = true;
        var client = TestOidc.CreateClient(_configured!);
        await TestOidc.SignInAsync(client, _tokenEndpoint, "unmapped");

        var down = await client.GetAsync(Route);
        Assert.Equal(HttpStatusCode.OK, down.StatusCode);
        var downBody = await down.Content.ReadFromJsonAsync<JsonElement>();
        Assert.False(downBody.GetProperty("available").GetBoolean());
        Assert.Equal(0, downBody.GetProperty("items").GetArrayLength());

        // Not configured at all (the default host): unavailable, FAST never called.
        using var plain = TestOidc.Configure(
            _factory, _tokenEndpoint, ("ConnectionStrings:ExpertHub", _database.ConnectionString));
        var plainClient = TestOidc.CreateClient(plain);
        await TestOidc.SignInAsync(plainClient, _tokenEndpoint, "unmapped");
        var off = await plainClient.GetFromJsonAsync<JsonElement>(Route);
        Assert.False(off.GetProperty("available").GetBoolean());
    }

    [Fact]
    public async Task A_guest_cannot_read_the_programme_list()
    {
        UseFakeFast();
        var anonymous = TestOidc.CreateClient(_configured!);
        var response = await anonymous.GetAsync(Route);
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    private FakeProgrammes UseFakeFast()
    {
        var fast = new FakeProgrammes();
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Fast:TrainingBaseUrl"] = "https://fast.test/training",
            })
            .Build();
        var tokens = new FakeProgrammes.Token();
        var api = new FastTrainingApi(
            new FastApiClient(new HttpClient(fast), tokens, configuration, "Fast:TrainingBaseUrl"), tokens);
        _configured = _configured!.WithWebHostBuilder(builder =>
            builder.ConfigureTestServices(services => services.AddSingleton(api)));
        return fast;
    }

    private sealed record SeenCall(string Url, string Body);

    /// <summary>`Program/Search`, two pages: 200 published, then three more rows.</summary>
    private sealed class FakeProgrammes : HttpMessageHandler
    {
        public bool Down { get; set; }

        public List<SeenCall> Seen { get; } = [];

        protected override async Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request, CancellationToken cancellationToken)
        {
            var url = request.RequestUri!.ToString();
            var body = request.Content is null ? string.Empty : await request.Content.ReadAsStringAsync(cancellationToken);
            lock (Seen)
            {
                Seen.Add(new SeenCall(url, body));
            }
            if (Down)
            {
                throw new HttpRequestException("connection refused");
            }
            if (!url.Contains("Program/Search", StringComparison.Ordinal))
            {
                return new HttpResponseMessage(HttpStatusCode.NotFound);
            }
            var page = JsonSerializer.Deserialize<JsonElement>(body).GetProperty("pageNumber").GetInt32();
            object[] items = page == 1
                ? [.. Enumerable.Range(1, 200).Select(n => (object)Row($"prog-{n:D4}", $"برنامج {n}", $"Programme {n}", "active"))]
                :
                [
                    Row("prog-0201", "برنامج | بفاصل", "With | bar", "active"),
                    // FAST answering a row it should not have — left out anyway.
                    Row("prog-draft", "برنامج غير منشور", "Unpublished", "inactive"),
                    Row("", "بلا معرف", "No id", "active"),
                ];
            if (page == 2)
            {
                // A duplicate of page one's first row.
                items = [.. items, Row("prog-0001", "برنامج 1", "Programme 1", "active")];
            }
            var json = FastTrainingApiTests.Envelope(new
            {
                totalItems = 204, pageNumber = page, pageSize = 200, items,
            });
            return new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(json, Encoding.UTF8, "application/json"),
            };
        }

        private static object Row(string id, string nameAr, string nameEn, string status) => new
        {
            programId = id, programCode = id.ToUpperInvariant(), nameAr, nameEn, status,
            isExecutive = false, isCustom = false,
        };

        public sealed class Token : IFastTokenProvider
        {
            public Task<string?> GetTokenAsync(CancellationToken cancellationToken) =>
                Task.FromResult<string?>("fake-training-token");
        }
    }
}
