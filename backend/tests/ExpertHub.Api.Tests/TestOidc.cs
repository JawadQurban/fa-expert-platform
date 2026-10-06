using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text.Json;
using Microsoft.AspNetCore.Authentication.OpenIdConnect;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Protocols;
using Microsoft.IdentityModel.Protocols.OpenIdConnect;
using Microsoft.IdentityModel.Tokens;

namespace ExpertHub.Api.Tests;

/// <summary>
/// The fake identity provider the OIDC and access tests share: static
/// discovery metadata, a fake token endpoint on the handler's backchannel,
/// and genuinely signed ID tokens — the handler's real validation runs
/// unmodified, which is the point.
/// </summary>
internal static class TestOidc
{
    public const string Issuer = "https://idp.example.test";
    public const string ClientId = "expert-hub-test-client";

    /// <summary>Display name every fake sign-in asserts on.</summary>
    public const string DisplayName = "موظف الاختبار";

    /// <summary>Subject every fake sign-in uses.</summary>
    public const string Subject = "user-42";

    /// <summary>Email claim every fake sign-in carries (the real FAST token
    /// holds only <c>sub</c> and <c>email</c> — P-181).</summary>
    public const string Email = "expert@test.fa.gov.sa";

    public static readonly RsaSecurityKey SigningKey = CreateKey();

    /// <summary>
    /// A factory wired to the fake provider. Role mapping: `fa-staff` and
    /// `fa-admin` → internal, `fa-trainer` → trainer — anything else is
    /// unmapped and grants nothing.
    /// </summary>
    public static WebApplicationFactory<Program> Configure(
        WebApplicationFactory<Program> factory,
        FakeTokenEndpoint tokenEndpoint,
        params (string Key, string Value)[] extraSettings)
    {
        return factory.WithWebHostBuilder(builder =>
        {
            builder.UseSetting("Oidc:Authority", Issuer);
            builder.UseSetting("Oidc:ClientId", ClientId);
            builder.UseSetting("Oidc:RoleClaim", "role");
            builder.UseSetting("Oidc:InternalRoleValues", "fa-staff, fa-admin");
            builder.UseSetting("Oidc:TrainerRoleValues", "fa-trainer");
            foreach (var (key, value) in extraSettings)
            {
                builder.UseSetting(key, value);
            }
            builder.ConfigureTestServices(services =>
                services.PostConfigure<OpenIdConnectOptions>(
                    OpenIdConnectDefaults.AuthenticationScheme,
                    options =>
                    {
                        // Static metadata instead of discovery — replacing the
                        // ConfigurationManager, because the built-in
                        // post-configure has already built a discovery-based
                        // one from Authority and the handler consults the
                        // manager, not the Configuration property.
                        options.ConfigurationManager =
                            new StaticConfigurationManager<OpenIdConnectConfiguration>(ProviderMetadata());
                        options.Backchannel = new HttpClient(tokenEndpoint);
                    }));
        });
    }

    /// <summary>
    /// https so the handshake's Secure cookies survive; no auto-redirect
    /// because the "provider" is external and the test plays its part.
    /// </summary>
    public static HttpClient CreateClient(WebApplicationFactory<Program> factory) =>
        factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            BaseAddress = new Uri("https://localhost"),
            AllowAutoRedirect = false,
        });

    /// <summary>
    /// Walks login → provider → callback and returns the resulting session.
    /// The fake provider "authenticates" whoever <paramref name="roleValue"/>
    /// describes; everything the handler validates is real.
    /// </summary>
    public static async Task<JsonElement> SignInAsync(
        HttpClient client,
        FakeTokenEndpoint tokenEndpoint,
        string roleValue,
        string returnUrl = "/portal",
        string? subject = null,
        string? displayName = null)
    {
        var login = await client.GetAsync(
            "/api/auth/login?returnUrl=" + Uri.EscapeDataString(returnUrl));
        Assert.Equal(HttpStatusCode.Found, login.StatusCode);
        var authorize = QueryHelpers.ParseQuery(login.Headers.Location!.Query);
        var state = (string?)authorize["state"];
        var nonce = (string?)authorize["nonce"];
        Assert.NotNull(state);
        Assert.NotNull(nonce);

        tokenEndpoint.NextIdToken = CreateIdToken(nonce!, roleValue, subject, displayName);

        var callback = await client.GetAsync(
            "/api/auth/callback?code=fake-authorization-code&state=" + Uri.EscapeDataString(state!));
        Assert.Equal(HttpStatusCode.Found, callback.StatusCode);
        Assert.Equal(returnUrl, callback.Headers.Location!.ToString());

        var session = await client.GetAsync("/api/auth/session");
        Assert.Equal(HttpStatusCode.OK, session.StatusCode);
        using var stream = await session.Content.ReadAsStreamAsync();
        using var document = await JsonDocument.ParseAsync(stream);
        return document.RootElement.Clone();
    }

    public static OpenIdConnectConfiguration ProviderMetadata()
    {
        var metadata = new OpenIdConnectConfiguration
        {
            Issuer = Issuer,
            AuthorizationEndpoint = $"{Issuer}/connect/authorize",
            TokenEndpoint = $"{Issuer}/connect/token",
            EndSessionEndpoint = $"{Issuer}/connect/endsession",
        };
        metadata.SigningKeys.Add(SigningKey);
        return metadata;
    }

    public static string CreateIdToken(
        string nonce, string roleValue, string? subject = null, string? displayName = null)
    {
        var handler = new JwtSecurityTokenHandler { SetDefaultTimesOnTokenCreation = false };
        var now = DateTime.UtcNow;
        var issuedAt = new DateTimeOffset(now).ToUnixTimeSeconds()
            .ToString(System.Globalization.CultureInfo.InvariantCulture);
        var token = new JwtSecurityToken(
            issuer: Issuer,
            audience: ClientId,
            claims:
            [
                new Claim("sub", subject ?? Subject),
                new Claim("name", displayName ?? DisplayName),
                new Claim("email", subject is null ? Email : $"{subject}@test.fa.gov.sa"),
                new Claim("role", roleValue),
                new Claim("nonce", nonce),
                // The protocol validator requires `iat` (IDX21314); the bare
                // JwtSecurityToken constructor does not add it.
                new Claim("iat", issuedAt, ClaimValueTypes.Integer64),
            ],
            notBefore: now.AddMinutes(-1),
            expires: now.AddHours(1),
            signingCredentials: new SigningCredentials(SigningKey, SecurityAlgorithms.RsaSha256));
        return handler.WriteToken(token);
    }

    private static RsaSecurityKey CreateKey()
    {
        using var rsa = RSA.Create(2048);
        return new RsaSecurityKey(rsa.ExportParameters(includePrivateParameters: true))
        {
            KeyId = "test-signing-key",
        };
    }

    /// <summary>
    /// The provider's token endpoint: hands back a signed ID token for the
    /// authorization code the handler redeems. Everything else 404s, so an
    /// unexpected backchannel call fails the test instead of passing silently.
    /// </summary>
    public sealed class FakeTokenEndpoint : HttpMessageHandler
    {
        public string? NextIdToken { get; set; }

        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request,
            CancellationToken cancellationToken)
        {
            if (request.RequestUri?.AbsoluteUri == $"{Issuer}/connect/token" && NextIdToken is not null)
            {
                var payload = JsonSerializer.Serialize(new
                {
                    access_token = "fake-access-token",
                    token_type = "Bearer",
                    expires_in = 3600,
                    id_token = NextIdToken,
                });
                return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent(payload, System.Text.Encoding.UTF8, "application/json"),
                });
            }

            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.NotFound));
        }
    }
}
