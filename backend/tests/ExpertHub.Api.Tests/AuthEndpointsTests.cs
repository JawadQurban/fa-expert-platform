using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using ExpertHub.Api.Auth;
using Microsoft.AspNetCore.Mvc.Testing;

namespace ExpertHub.Api.Tests;

/// <summary>
/// The auth surface in its honest out-of-the-box state: no OIDC client is
/// registered yet (`Q38`), and the API must say so — not crash, and not
/// pretend.
/// </summary>
public sealed class AuthEndpointsTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public AuthEndpointsTests(WebApplicationFactory<Program> factory) => _factory = factory;

    [Fact]
    public async Task Session_returns_401_when_unauthenticated()
    {
        var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/auth/session");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Login_reports_503_while_no_client_is_registered()
    {
        // The out-of-the-box state (`Q38`): a clear ProblemDetails, so the
        // SPA's development placeholder story stays explainable rather than
        // this looking like an outage.
        var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/auth/login?returnUrl=/portal");

        Assert.Equal(HttpStatusCode.ServiceUnavailable, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("SSO is not configured", body.GetProperty("title").GetString());
    }

    [Fact]
    public async Task Logout_always_ends_the_local_session_even_unconfigured()
    {
        var client = _factory.CreateClient();

        var response = await client.PostAsync("/api/auth/logout", content: null);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(JsonValueKind.Null, body.GetProperty("providerLogoutUrl").ValueKind);
    }

    [Theory]
    [InlineData("/portal", "/portal")]
    [InlineData(" /portal ", "/portal")]
    [InlineData("/portal?tab=a", "/portal?tab=a")]
    [InlineData(null, null)]
    [InlineData("", null)]
    [InlineData("//evil.example", null)] // protocol-relative escape
    [InlineData("https://evil.example/", null)] // absolute escape
    [InlineData("/\\evil.example", null)] // backslash disguise
    [InlineData("relative-without-slash", null)]
    // A browser STRIPS these before resolving the URL, so each one below would
    // otherwise leave the address bar reading `//evil.example`.
    [InlineData("/\tevil.example", null)] // HTAB
    [InlineData("/\nevil.example", null)] // LF
    [InlineData("/\revil.example", null)] // CR
    [InlineData("/\t/evil.example", null)] // HTAB making a protocol-relative URL
    public void Return_urls_must_be_relative_paths_on_this_site(string? input, string? expected)
    {
        // The open-redirect guard on `/api/auth/login?returnUrl=…`.
        Assert.Equal(expected, AuthEndpoints.SafeRelativePath(input));
    }
}
