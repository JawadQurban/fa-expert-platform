using System.ComponentModel.DataAnnotations;

namespace ExpertHub.Api.Configuration;

/// <summary>
/// Database connectivity.
/// </summary>
/// <remarks>
/// ⚠️ The connection string is <b>never</b> in <c>appsettings.json</c>. It comes
/// from an environment variable or the platform's secret store at runtime
/// (<c>ConnectionStrings__ExpertHub</c>), for the same reason the frontend's
/// <c>config.js</c> holds no secret: anything committed is published to everyone
/// with repository access.
/// </remarks>
public sealed class DatabaseOptions
{
    public const string Section = "ConnectionStrings";

    /// <summary>SQL Server connection string. Empty until infrastructure supplies one.</summary>
    public string ExpertHub { get; init; } = string.Empty;
}

/// <summary>
/// The OpenID Connect client for INT-01 — the Academy / FAST identity provider.
/// </summary>
/// <remarks>
/// <para>
/// This is the <b>confidential</b> half of the flow that the frontend cannot
/// hold (<c>P-163</c>). The browser never sees a token: the API completes the
/// authorization-code exchange and issues an HttpOnly, Secure, SameSite session
/// cookie, so an XSS bug in the SPA cannot read the session.
/// </para>
/// <para>
/// ⚠️ <see cref="ClientSecret"/> may exist <b>only</b> here, and only from the
/// environment. It must never appear in <c>appsettings.json</c>, in the
/// frontend's <c>config.js</c>, or in any file under source control.
/// </para>
/// </remarks>
public sealed class OidcOptions
{
    public const string Section = "Oidc";

    /// <summary>Issuer URL; discovery is derived from it. Supplied by FAST.</summary>
    public string Authority { get; init; } = string.Empty;

    /// <summary>The client id FAST issues.</summary>
    public string ClientId { get; init; } = string.Empty;

    /// <summary>
    /// ⚠️ Environment or secret store only. Empty ⇒ a public client, in which
    /// case PKCE alone protects the exchange (which is still required either way).
    /// </summary>
    public string ClientSecret { get; init; } = string.Empty;

    /// <summary>Scopes to request. <c>openid</c> is required.</summary>
    public string Scopes { get; init; } = "openid profile email";

    /// <summary>
    /// The callback path this API listens on. ⚠️ Registered with FAST as part of
    /// the absolute redirect URI — see <c>16_SSO_OIDC_CONFIGURATION.md</c>.
    /// </summary>
    public string CallbackPath { get; init; } = "/api/auth/callback";

    /// <summary>Where the browser is sent after a completed sign-in.</summary>
    public string FrontendReturnPath { get; init; } = "/expert-hub";

    /* ── Claim mapping (`G16`/`G28` — Q37) ─────────────────────────────────
     *
     * Which claim carries the role, and which of its values mean what, are the
     * still-open halves of the claim contract. Both are configuration so the
     * answer is an env-file edit, not a release — the same rule the frontend's
     * `oidcConfig.ts` follows (P-158). Until they are set, every claim value
     * is unmapped and therefore grants NOTHING (fail closed).
     */

    /// <summary>The claim carrying the user's role/group. Empty ⇒ no role is ever mapped.</summary>
    public string RoleClaim { get; init; } = string.Empty;

    /// <summary>Comma-separated claim values that map to the <c>internal</c> role.</summary>
    public string InternalRoleValues { get; init; } = string.Empty;

    /// <summary>Comma-separated claim values that map to the <c>trainer</c> role.</summary>
    public string TrainerRoleValues { get; init; } = string.Empty;

    /// <summary>The claim carrying the display name.</summary>
    public string NameClaim { get; init; } = "name";

    /// <summary>
    /// Whether claims must be fetched from the userinfo endpoint rather than
    /// read from the ID token — question 5 of `16_` §5, still open (`Q37`).
    /// </summary>
    public bool UseUserInfo { get; init; }

    /// <summary>
    /// Session cookie lifetime, in minutes. ⚠️ The real lifetime is part of the
    /// `Q37` claim contract (Needs Confirmation) — this default is provisional
    /// and deliberately configuration, so FAST's answer is an edit.
    /// </summary>
    public int SessionMinutes { get; init; } = 480;

    /// <summary>
    /// Whether to push the authorization request server-to-server (PAR) when
    /// the provider advertises it. <c>false</c> sends the classic front-channel
    /// authorize redirect instead — the browser visibly reaches the STS, which
    /// then displays ITS response (login page, or its own error while `Q38`'s
    /// redirect-URI registration is pending). Temporarily <c>false</c> in the
    /// testing environment for exactly that visibility.
    /// </summary>
    public bool UsePushedAuthorization { get; init; } = true;

    /// <summary>True once enough is configured to attempt a real sign-in.</summary>
    public bool IsConfigured =>
        !string.IsNullOrWhiteSpace(Authority) && !string.IsNullOrWhiteSpace(ClientId);
}

/// <summary>
/// Platform authorization settings — CAP-08's, not the identity provider's.
/// </summary>
/// <remarks>
/// P-181: the owner ruled that FAST's identity carries NO role claim — roles
/// are user-management data and live in Expert Hub's own `USER_ROLE` table.
/// The one thing that cannot come from that table is the FIRST administrator
/// (an empty table can authorize nobody to fill it), so bootstrap identities
/// are configuration.
/// </remarks>
public sealed class AccessOptions
{
    public const string Section = "Access";

    /// <summary>
    /// Comma-separated external identity ids (the `sub` claim — visible as
    /// `userId` on <c>/api/auth/session</c>) that are granted the
    /// system-administrator role at sign-in: persisted to `USER_ROLE` (with an
    /// audit entry) when the database is available, session-only otherwise.
    /// Empty in every committed file; set per environment.
    /// </summary>
    public string BootstrapAdministrators { get; init; } = string.Empty;

    /// <summary>
    /// Comma-separated values that mean "trainer" in the Academy's own record.
    /// Somebody whose profile carries one of them is granted the trainer role
    /// at sign-in — see <see cref="Auth.FastTrainerGrant"/> for what that does
    /// and does not change.
    /// </summary>
    /// <remarks>
    /// ⚠️ Empty in every committed file, and empty grants nothing. Guessing
    /// which of the Academy's role labels implies platform access is not a
    /// default worth having, and the wrong guess hands out access nobody
    /// decided to give.
    /// </remarks>
    public string TrainerFastRoles { get; init; } = string.Empty;
}

/// <summary>
/// Which browser origins may call this API with credentials.
/// </summary>
/// <remarks>
/// A cookie session makes CORS a security control rather than a convenience:
/// with <c>AllowCredentials</c>, an origin on this list can act as the signed-in
/// user. It is therefore an explicit allow-list and never a wildcard.
/// </remarks>
public sealed class CorsOptions
{
    public const string Section = "Cors";

    [Required]
    public string[] AllowedOrigins { get; init; } = [];
}
