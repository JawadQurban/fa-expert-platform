using System.Net;
using System.Text;
using ExpertHub.Infrastructure.Fast;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;

namespace ExpertHub.Api.Tests;

/// <summary>
/// INT-05 server-to-server — the client-credentials token provider.
/// </summary>
public sealed class FastServiceTokenTests
{
    private const string Authority = "https://ims.test/identitymanagement.sts";

    [Fact]
    public async Task It_discovers_the_token_endpoint_and_sends_a_client_credentials_grant()
    {
        var ims = new FakeIms();
        var provider = Provider(ims, new() { ["Fast:Scope"] = "fa-api" });

        Assert.Equal("service-token-1", await provider.GetTokenAsync(default));

        Assert.Equal($"{Authority}/.well-known/openid-configuration", ims.Requests[0].Uri);
        var grant = ims.Requests[1];
        Assert.Equal($"{Authority}/connect/token", grant.Uri);
        Assert.Contains("grant_type=client_credentials", grant.Body, StringComparison.Ordinal);
        Assert.Contains("client_id=expert-hub-api", grant.Body, StringComparison.Ordinal);
        Assert.Contains("scope=fa-api", grant.Body, StringComparison.Ordinal);
    }

    [Fact]
    public async Task The_token_is_reused_until_shortly_before_it_expires()
    {
        var ims = new FakeIms { ExpiresIn = 3600 };
        var clock = new ManualClock();
        var provider = Provider(ims, [], clock);

        await provider.GetTokenAsync(default);
        clock.Advance(TimeSpan.FromMinutes(58));
        Assert.Equal("service-token-1", await provider.GetTokenAsync(default));
        Assert.Equal(1, ims.TokenCalls);

        // Inside the 60-second renewal margin: a fresh token, and discovery is
        // not repeated.
        clock.Advance(TimeSpan.FromSeconds(90));
        Assert.Equal("service-token-2", await provider.GetTokenAsync(default));
        Assert.Equal(2, ims.TokenCalls);
        Assert.Equal(1, ims.Requests.Count(r => r.Uri.EndsWith("openid-configuration", StringComparison.Ordinal)));
    }

    [Fact]
    public async Task A_refused_grant_fails_closed_and_the_next_call_tries_again()
    {
        var ims = new FakeIms { RefuseToken = true };
        var provider = Provider(ims, []);

        Assert.Null(await provider.GetTokenAsync(default));

        ims.RefuseToken = false;
        Assert.Equal("service-token-2", await provider.GetTokenAsync(default));
    }

    [Fact]
    public async Task An_unreachable_identity_server_fails_closed_instead_of_throwing()
    {
        var provider = Provider(new FakeIms { Unreachable = true }, []);

        Assert.Null(await provider.GetTokenAsync(default));
    }

    [Fact]
    public async Task A_named_token_endpoint_skips_discovery_and_an_empty_scope_is_not_sent()
    {
        var ims = new FakeIms();
        var provider = Provider(ims, new() { ["Fast:TokenEndpoint"] = $"{Authority}/connect/token" });

        await provider.GetTokenAsync(default);

        var only = Assert.Single(ims.Requests);
        Assert.DoesNotContain("scope=", only.Body, StringComparison.Ordinal);
    }

    [Theory]
    [InlineData("expert-hub-api", "s3cret", true)]
    [InlineData("expert-hub-api", "", false)]
    [InlineData("", "s3cret", false)]
    public void Only_a_complete_credential_switches_server_to_server_on(
        string clientId, string secret, bool expected)
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Fast:ClientId"] = clientId,
                ["Fast:ClientSecret"] = secret,
            })
            .Build();

        Assert.Equal(expected, ClientCredentialsFastTokenProvider.IsConfigured(configuration));
    }

    private static ClientCredentialsFastTokenProvider Provider(
        FakeIms ims, Dictionary<string, string?> extra, TimeProvider? clock = null)
    {
        var settings = new Dictionary<string, string?>
        {
            ["Oidc:Authority"] = Authority,
            ["Fast:ClientId"] = "expert-hub-api",
            ["Fast:ClientSecret"] = "test-secret",
        };
        foreach (var (key, value) in extra)
        {
            settings[key] = value;
        }
        return new ClientCredentialsFastTokenProvider(
            new HttpClient(ims),
            new ConfigurationBuilder().AddInMemoryCollection(settings).Build(),
            NullLogger<ClientCredentialsFastTokenProvider>.Instance,
            clock);
    }

    private sealed record SeenRequest(string Uri, string Body);

    private sealed class FakeIms : HttpMessageHandler
    {
        public List<SeenRequest> Requests { get; } = [];

        public int TokenCalls { get; private set; }

        public int ExpiresIn { get; init; } = 3600;

        public bool RefuseToken { get; set; }

        public bool Unreachable { get; init; }

        protected override async Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request, CancellationToken cancellationToken)
        {
            if (Unreachable)
            {
                throw new HttpRequestException("No such host is known.");
            }
            var uri = request.RequestUri!.AbsoluteUri;
            var body = request.Content is null
                ? string.Empty
                : await request.Content.ReadAsStringAsync(cancellationToken);
            Requests.Add(new SeenRequest(uri, body));

            if (uri.EndsWith("/.well-known/openid-configuration", StringComparison.Ordinal))
            {
                return Json($$"""{"issuer":"{{Authority}}","token_endpoint":"{{Authority}}/connect/token"}""");
            }
            TokenCalls++;
            return RefuseToken
                ? new HttpResponseMessage(HttpStatusCode.BadRequest) { Content = new StringContent("""{"error":"invalid_client"}""") }
                : Json($$"""{"access_token":"service-token-{{TokenCalls}}","expires_in":{{ExpiresIn}},"token_type":"Bearer"}""");
        }

        private static HttpResponseMessage Json(string body) =>
            new(HttpStatusCode.OK) { Content = new StringContent(body, Encoding.UTF8, "application/json") };
    }

    private sealed class ManualClock : TimeProvider
    {
        private DateTimeOffset _now = new(2026, 10, 5, 9, 0, 0, TimeSpan.Zero);

        public override DateTimeOffset GetUtcNow() => _now;

        public void Advance(TimeSpan by) => _now += by;
    }
}
