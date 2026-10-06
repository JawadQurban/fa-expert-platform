using ExpertHub.Api.Configuration;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.OpenIdConnect;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.Options;

namespace ExpertHub.Api.Auth;

/// <summary>
/// The three endpoints the frontend's <c>academySsoAdapter</c> calls —
/// <c>GET /api/auth/login</c>, <c>GET /api/auth/session</c>,
/// <c>POST /api/auth/logout</c> — plus the provider callback, which the OIDC
/// middleware owns at <c>Oidc:CallbackPath</c> and needs no endpoint here.
/// </summary>
public static class AuthEndpoints
{
    /// <summary>CA1848-conform logging for the one failure path worth a log line.</summary>
    private static readonly Action<ILogger, Exception?> LogChallengeFailed =
        LoggerMessage.Define(
            LogLevel.Error,
            new EventId(1, "SsoChallengeFailed"),
            "The SSO challenge could not reach or be accepted by the identity provider.");

    /// <summary>
    /// The wire shape of a session. ⚠️ This mirrors <c>ExpertHubSession</c> in
    /// <c>app/auth/types.ts</c> exactly — `userId`, `displayName`, `roles`,
    /// `expiresAt` (epoch <b>milliseconds</b>) — a consumer already depends on
    /// it; change the frontend type first or not at all.
    /// </summary>
    internal sealed record SessionResponse(
        string UserId,
        string DisplayName,
        IReadOnlyList<string> Roles,
        long ExpiresAt);

    public static RouteGroupBuilder MapExpertHubAuthEndpoints(this RouteGroupBuilder group)
    {
        ArgumentNullException.ThrowIfNull(group);

        var auth = group.MapGroup("/auth");

        /*
         * Begin login. The API — not the browser — runs the code+PKCE exchange
         * (`P-163`), so this endpoint's whole job is to validate the return
         * target and challenge the OIDC scheme, which redirects to the
         * provider with `state`, `nonce` and a PKCE challenge it manages
         * server-side.
         */
        auth.MapGet("/login", async (
            HttpContext http,
            string? returnUrl,
            IOptions<OidcOptions> options,
            ILoggerFactory loggerFactory) =>
        {
            var oidc = options.Value;
            if (!oidc.IsConfigured)
            {
                // The honest out-of-the-box state: no client is registered yet
                // (`Q38`). 503 with a reason, so the SPA's placeholder story
                // stays explainable rather than looking like a crash.
                return Results.Problem(
                    statusCode: StatusCodes.Status503ServiceUnavailable,
                    title: "SSO is not configured",
                    detail: "No OIDC client is configured (Oidc__Authority / Oidc__ClientId are empty). "
                        + "See docs/specification/16_SSO_OIDC_CONFIGURATION.md and Q38.");
            }

            // Open-redirect guard: the post-login target must be a relative
            // path on this site. Anything else falls back to the configured
            // frontend return path.
            var target = SafeRelativePath(returnUrl) ?? oidc.FrontendReturnPath;

            try
            {
                // The challenge is executed here (not returned as a result) so
                // a failure REACHING the provider — discovery down, or its PAR
                // endpoint refusing the request (e.g. an unregistered
                // redirect_uri, the exact `Q38` state) — lands the user back
                // in the app with a named error instead of a raw 500 page.
                await http.ChallengeAsync(
                    OpenIdConnectDefaults.AuthenticationScheme,
                    new AuthenticationProperties { RedirectUri = target });
                return Results.Empty;
            }
            catch (Exception exception) when (exception is not OperationCanceledException
                || !http.RequestAborted.IsCancellationRequested)
            {
                LogChallengeFailed(loggerFactory.CreateLogger("ExpertHub.Auth"), exception);
                return Results.Redirect($"{oidc.FrontendReturnPath}?error=sso_unavailable");
            }
        });

        /*
         * The current session, or 401. The SPA calls this on boot and after
         * the callback; the cookie is HttpOnly so this endpoint is the only
         * way the frontend can see the session at all.
         */
        auth.MapGet("/session", async (HttpContext http) =>
        {
            var result = await http.AuthenticateAsync(AuthenticationSetup.SessionCookieScheme);
            if (result is not { Succeeded: true, Principal: { } principal })
            {
                return Results.Unauthorized();
            }

            var expiresUtc = result.Properties?.ExpiresUtc ?? DateTimeOffset.UtcNow;

            var roles = principal.FindAll(ExpertHubClaims.Role)
                .Select(claim => claim.Value)
                .Where(value => value is ExpertHubClaims.TrainerRole
                    or ExpertHubClaims.InternalRole
                    or ExpertHubClaims.IndividualRole)
                .Distinct(StringComparer.Ordinal)
                .ToArray();

            // FAST's token carries only the identity — no name claim (P-181):
            // fall back to the email, then the subject, so the header always
            // shows something a person recognizes.
            var userId = principal.FindFirst(ExpertHubClaims.Subject)?.Value ?? string.Empty;
            var displayName = principal.Identity?.Name
                ?? principal.FindFirst("email")?.Value
                ?? userId;

            return Results.Ok(new SessionResponse(
                UserId: userId,
                DisplayName: displayName,
                Roles: roles,
                ExpiresAt: expiresUtc.ToUnixTimeMilliseconds()));
        });

        /*
         * Logout. Always ends the local session; additionally reports the
         * provider's end-session URL (with `id_token_hint`) when discovery
         * advertises one, for the SPA to navigate to — a fetch cannot follow a
         * cross-origin logout redirect itself. Front-/back-channel logout is
         * part of the still-open `Q37` arrangements.
         */
        auth.MapPost("/logout", async (
            HttpContext http,
            IOptions<OidcOptions> options,
            IOptionsMonitor<OpenIdConnectOptions> oidcOptions) =>
        {
            string? idToken = null;
            var result = await http.AuthenticateAsync(AuthenticationSetup.SessionCookieScheme);
            if (result.Succeeded)
            {
                idToken = result.Properties?.GetTokenValue("id_token");
            }

            await http.SignOutAsync(AuthenticationSetup.SessionCookieScheme);

            var providerLogoutUrl = options.Value.IsConfigured
                ? await ProviderLogoutUrlAsync(http, options.Value, oidcOptions, idToken)
                : null;

            return Results.Ok(new { providerLogoutUrl });
        });

        return group;
    }

    /// <summary>
    /// Accepts only a relative path on this site — rejects absolute URLs,
    /// protocol-relative <c>//host</c>, and backslash disguises.
    /// </summary>
    internal static string? SafeRelativePath(string? url)
    {
        if (string.IsNullOrWhiteSpace(url))
        {
            return null;
        }
        var candidate = url.Trim();
        // ⚠️ Control characters are rejected, not just absolute and
        // protocol-relative forms. A browser strips TAB, CR and LF from a URL
        // before resolving it, so `/%09/evil.example` — which passes every
        // check below — becomes `//evil.example` in the address bar. This is
        // the same rule ASP.NET's own `IsLocalUrl` applies.
        if (candidate.Any(char.IsControl)
            || !candidate.StartsWith('/')
            || candidate.StartsWith("//", StringComparison.Ordinal)
            || candidate.StartsWith("/\\", StringComparison.Ordinal)
            || candidate.Contains('\\', StringComparison.Ordinal))
        {
            return null;
        }
        return candidate;
    }

    private static async Task<string?> ProviderLogoutUrlAsync(
        HttpContext http,
        OidcOptions oidc,
        IOptionsMonitor<OpenIdConnectOptions> oidcOptions,
        string? idToken)
    {
        try
        {
            var handlerOptions = oidcOptions.Get(OpenIdConnectDefaults.AuthenticationScheme);
            if (handlerOptions.ConfigurationManager is null)
            {
                return null;
            }

            var metadata = await handlerOptions.ConfigurationManager.GetConfigurationAsync(http.RequestAborted);
            if (string.IsNullOrEmpty(metadata.EndSessionEndpoint))
            {
                return null; // The provider does not support RP-initiated logout.
            }

            var postLogout = $"{http.Request.Scheme}://{http.Request.Host}{oidc.FrontendReturnPath}";
            var query = new List<KeyValuePair<string, string?>>
            {
                new("post_logout_redirect_uri", postLogout),
            };
            if (!string.IsNullOrEmpty(idToken))
            {
                query.Add(new("id_token_hint", idToken));
            }

            return QueryHelpers.AddQueryString(metadata.EndSessionEndpoint, query);
        }
        catch (Exception exception) when (exception is not OperationCanceledException
            || !http.RequestAborted.IsCancellationRequested)
        {
            // Discovery being unreachable — including a discovery TIMEOUT, which
            // arrives as TaskCanceledException — must not block a local sign-out.
            return null;
        }
    }
}
