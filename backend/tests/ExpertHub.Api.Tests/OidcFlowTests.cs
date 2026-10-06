using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.WebUtilities;

namespace ExpertHub.Api.Tests;

/// <summary>
/// The whole INT-01 handshake, end to end, against the fake identity provider
/// in <see cref="TestOidc"/> — so what is verified is the handler's real
/// validation (`iss`, `aud`, `exp`, signature, `nonce`, `state`), not a stub
/// of it.
/// </summary>
/// <remarks>
/// The testing-IdP path is the point of BE-02's design: the flow must be
/// provable before FAST's registration lands (`Q38`) and before the claim
/// contract is answered (`Q37`) — with every claim value unmapped granting
/// nothing.
/// </remarks>
public sealed class OidcFlowTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public OidcFlowTests(WebApplicationFactory<Program> factory) => _factory = factory;

    [Fact]
    public async Task Login_redirects_to_the_provider_with_code_pkce_state_and_nonce()
    {
        using var factory = TestOidc.Configure(_factory, new TestOidc.FakeTokenEndpoint());
        var client = TestOidc.CreateClient(factory);

        var response = await client.GetAsync("/api/auth/login?returnUrl=/portal");

        Assert.Equal(HttpStatusCode.Found, response.StatusCode);
        var location = response.Headers.Location!;
        Assert.StartsWith($"{TestOidc.Issuer}/connect/authorize", location.AbsoluteUri, StringComparison.Ordinal);

        var query = QueryHelpers.ParseQuery(location.Query);
        Assert.Equal(TestOidc.ClientId, (string?)query["client_id"]);
        Assert.Equal("code", (string?)query["response_type"]);
        Assert.Equal("S256", (string?)query["code_challenge_method"]); // PKCE — P-160
        Assert.False(string.IsNullOrEmpty((string?)query["code_challenge"]));
        Assert.False(string.IsNullOrEmpty((string?)query["state"])); // CSRF
        Assert.False(string.IsNullOrEmpty((string?)query["nonce"]));
        Assert.Equal("https://localhost/api/auth/callback", (string?)query["redirect_uri"]);
        Assert.Contains("openid", (string?)query["scope"], StringComparison.Ordinal);
    }

    [Fact]
    public async Task Behind_the_proxy_the_redirect_uri_is_built_from_forwarded_headers()
    {
        // The deployed topology: server Nginx (https, experts.fa.gov.sa) →
        // container (http, internal). The redirect_uri the provider sees must
        // be the public one, or the registered callback never matches.
        using var factory = TestOidc.Configure(_factory, new TestOidc.FakeTokenEndpoint());
        var client = TestOidc.CreateClient(factory);

        using var request = new HttpRequestMessage(
            HttpMethod.Get, "/api/auth/login?returnUrl=/portal");
        request.Headers.Add("X-Forwarded-Proto", "https");
        request.Headers.Add("X-Forwarded-Host", "experts.fa.gov.sa");
        var response = await client.SendAsync(request);

        Assert.Equal(HttpStatusCode.Found, response.StatusCode);
        var query = QueryHelpers.ParseQuery(response.Headers.Location!.Query);
        Assert.Equal("https://experts.fa.gov.sa/api/auth/callback", (string?)query["redirect_uri"]);
    }

    [Fact]
    public async Task A_valid_handshake_issues_a_session_with_mapped_roles()
    {
        var tokenEndpoint = new TestOidc.FakeTokenEndpoint();
        using var factory = TestOidc.Configure(_factory, tokenEndpoint);
        var client = TestOidc.CreateClient(factory);

        var session = await TestOidc.SignInAsync(client, tokenEndpoint, roleValue: "fa-staff");

        Assert.Equal(TestOidc.Subject, session.GetProperty("userId").GetString());
        Assert.Equal(TestOidc.DisplayName, session.GetProperty("displayName").GetString());
        var roles = session.GetProperty("roles").EnumerateArray().Select(r => r.GetString()!).ToArray();
        // `individual` is held by everybody who signs in (owner ruling,
        // 2026-09-08); `internal` is what this factory's config maps fa-staff to.
        Assert.Equal(["individual", "internal"], [.. roles.Order(StringComparer.Ordinal)]);
        Assert.True(session.GetProperty("expiresAt").GetInt64() > DateTimeOffset.UtcNow.ToUnixTimeMilliseconds());
    }

    [Fact]
    public async Task An_unmapped_role_value_grants_nothing_beyond_the_baseline()
    {
        /*
         * Fail closed, still: an unrecognized provider role grants no ELEVATED
         * role. What it does grant is `individual`, which everybody who signs
         * in holds (owner ruling, 2026-09-08) — and which is the point of
         * having it: a signed-in person is never role-less, so every screen has
         * a defined answer for them instead of an accidental one.
         */
        var tokenEndpoint = new TestOidc.FakeTokenEndpoint();
        using var factory = TestOidc.Configure(_factory, tokenEndpoint);
        var client = TestOidc.CreateClient(factory);

        var session = await TestOidc.SignInAsync(client, tokenEndpoint, roleValue: "some-unknown-group");

        var roles = session.GetProperty("roles").EnumerateArray().Select(r => r.GetString()!).ToArray();
        Assert.Equal(["individual"], roles);
    }

    [Fact]
    public async Task A_bootstrap_administrator_is_internal_even_with_no_database()
    {
        // P-181 — roles are the platform's own, and the FIRST administrator
        // cannot come from an empty USER_ROLE table. Matched here by EMAIL
        // (FAST's token carries only sub + email); no database is configured
        // in this factory — the testing server's exact state.
        var tokenEndpoint = new TestOidc.FakeTokenEndpoint();
        using var factory = TestOidc.Configure(
            _factory,
            tokenEndpoint,
            ("Access:BootstrapAdministrators", TestOidc.Email.ToUpperInvariant()));
        var client = TestOidc.CreateClient(factory);

        var session = await TestOidc.SignInAsync(client, tokenEndpoint, roleValue: "unmapped");

        var roles = session.GetProperty("roles").EnumerateArray().Select(r => r.GetString()!).ToArray();
        Assert.Contains("internal", roles);
    }

    [Fact]
    public async Task A_tampered_state_is_rejected_and_no_session_exists()
    {
        var tokenEndpoint = new TestOidc.FakeTokenEndpoint();
        using var factory = TestOidc.Configure(_factory, tokenEndpoint);
        var client = TestOidc.CreateClient(factory);

        // Begin a real login so the correlation cookie exists…
        var login = await client.GetAsync("/api/auth/login?returnUrl=/portal");
        Assert.Equal(HttpStatusCode.Found, login.StatusCode);

        // …then come back with a state the server never issued.
        var callback = await client.GetAsync("/api/auth/callback?code=any&state=forged-by-attacker");

        Assert.Equal(HttpStatusCode.Found, callback.StatusCode);
        Assert.Contains("error=sso_failed", callback.Headers.Location!.ToString(), StringComparison.Ordinal);

        var sessionProbe = await client.GetAsync("/api/auth/session");
        Assert.Equal(HttpStatusCode.Unauthorized, sessionProbe.StatusCode);
    }

    [Fact]
    public async Task Logout_clears_the_session_and_names_the_provider_end_session_url()
    {
        var tokenEndpoint = new TestOidc.FakeTokenEndpoint();
        using var factory = TestOidc.Configure(_factory, tokenEndpoint);
        var client = TestOidc.CreateClient(factory);
        await TestOidc.SignInAsync(client, tokenEndpoint, roleValue: "fa-staff");

        var logout = await client.PostAsync("/api/auth/logout", content: null);

        Assert.Equal(HttpStatusCode.OK, logout.StatusCode);
        var body = await logout.Content.ReadFromJsonAsync<JsonElement>();
        var providerLogoutUrl = body.GetProperty("providerLogoutUrl").GetString();
        Assert.NotNull(providerLogoutUrl);
        Assert.StartsWith($"{TestOidc.Issuer}/connect/endsession", providerLogoutUrl, StringComparison.Ordinal);
        Assert.Contains("id_token_hint=", providerLogoutUrl, StringComparison.Ordinal);

        var sessionProbe = await client.GetAsync("/api/auth/session");
        Assert.Equal(HttpStatusCode.Unauthorized, sessionProbe.StatusCode);
    }
}
