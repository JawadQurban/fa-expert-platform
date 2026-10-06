import { readRuntimeConfig } from './runtimeConfig';

/**
 * **OpenID Connect configuration for the Academy / FAST identity provider
 * (INT-01).**
 *
 * The whole point of this module: when the FAST team issues the client
 * registration, **only configuration changes** — no code, no rebuild. Every
 * value below arrives at container start through `config.js`
 * (`deploy/config.js.template`), so one image serves Development,
 * UAT and Production with different clients.
 *
 * ---
 *
 * ## What cannot be here, and why it is absent rather than guarded
 *
 * **There is no client-secret field, and no field that could hold one.** This
 * file is served to the browser: anything in it is readable by anyone who opens
 * developer tools, so a secret placed here is a *published* secret. `CLAUDE.md`
 * states it as a rule — «never put secrets, credentials, or FAST/MTM/ERP/SQL
 * values in the frontend» — and it is enforced structurally: `OidcConfig` has no
 * such property, `readOidcConfig` never reads one, and a test asserts no key of
 * the resolved object matches /secret|password|credential|token/.
 *
 * ⚠️ **If FAST issues a client secret, that is a confidential client**, and a
 * confidential client cannot run in a browser. The flow then belongs in the
 * Expert Hub API (which holds the secret and hands the browser an HttpOnly
 * session cookie), and this module is not what configures it. Say so rather than
 * finding somewhere clever to put the secret.
 *
 * **There is no `responseType` and no `usePkce`.** Authorization Code with PKCE
 * is the only flow a public browser client may use — the implicit flow is
 * deprecated (OAuth 2.0 Security BCP) and returns tokens in the URL fragment,
 * where they land in browser history and server logs. Making those configurable
 * would make "turn off PKCE" a supported option. It is not.
 *
 * ## What the identity provider must be told
 *
 * See `docs/specification/16_SSO_OIDC_CONFIGURATION.md` — it carries the exact
 * redirect URIs to register per environment, the scopes requested, and the claim
 * questions that are still open (`G16`/`G28`).
 */

/** Requested scopes, if the provider is not told otherwise. `openid` is required
 *  by the specification; the rest are the minimum an identity needs. */
const DEFAULT_SCOPES = 'openid profile email';

export interface OidcConfig {
  /**
   * The provider's issuer URL — the `iss` value, from which
   * `/.well-known/openid-configuration` is discovered. Supplied by FAST.
   */
  readonly issuer: string;
  /**
   * Discovery document URL, when the provider does not serve it at the
   * conventional path under `issuer`. Empty ⇒ derive it from `issuer`.
   */
  readonly discoveryUrl: string;
  /**
   * The **public** client identifier FAST issues. Not a secret: it is sent in
   * the authorize URL, which is visible in the address bar by design.
   */
  readonly clientId: string;
  /** Space-separated scopes to request. */
  readonly scopes: string;
  /**
   * Where the provider sends the browser back with `?code=…&state=…`. **Must be
   * registered with FAST exactly**, character for character.
   *
   * Configurable rather than derived, because the identity provider decides what
   * it will accept — if a URL is registered that this app did not choose, this
   * is the setting that makes it work without a code change.
   */
  readonly redirectUri: string;
  /** Where the provider returns after logout (`end_session_endpoint`). */
  readonly postLogoutRedirectUri: string;

  /* ── Claim mapping (`G16`/`G28`) ─────────────────────────────────────── */

  /**
   * The claim carrying the user's role(s). ⚠️ Its name and its values are
   * `G16`/`G28` — still open — so both are configuration: when FAST says which
   * claim it is, that is a config change and not a release.
   */
  readonly roleClaim: string;
  /** Claim values that map to Expert Hub's `internal` role, comma-separated. */
  readonly internalRoleValues: string;
  /** Claim values that map to Expert Hub's `trainer` role, comma-separated. */
  readonly trainerRoleValues: string;
  /** The claim carrying a display name. */
  readonly nameClaim: string;
}

export function readOidcConfig(): OidcConfig {
  const runtime = readRuntimeConfig();
  return {
    issuer: runtime.oidcIssuer,
    discoveryUrl: runtime.oidcDiscoveryUrl,
    clientId: runtime.oidcClientId,
    scopes: runtime.oidcScopes === '' ? DEFAULT_SCOPES : runtime.oidcScopes,
    redirectUri: runtime.oidcRedirectUri,
    postLogoutRedirectUri: runtime.oidcPostLogoutRedirectUri,
    roleClaim: runtime.oidcRoleClaim,
    internalRoleValues: runtime.oidcInternalRoleValues,
    trainerRoleValues: runtime.oidcTrainerRoleValues,
    nameClaim: runtime.oidcNameClaim === '' ? 'name' : runtime.oidcNameClaim,
  };
}

/**
 * The values without which a login cannot even be *started*. Deliberately short:
 * a half-configured provider must fail at startup with a list, not at the moment
 * a user clicks "log in".
 */
const REQUIRED: readonly (keyof OidcConfig)[] = ['issuer', 'clientId', 'redirectUri'];

/**
 * `true` once every required value is present. Until then the app stays on the
 * development placeholder adapter — **it does not half-attempt a real login**,
 * because a partly-configured OIDC client fails in ways that look like an outage.
 */
export function isOidcConfigured(config: OidcConfig = readOidcConfig()): boolean {
  return REQUIRED.every((key) => config[key].trim() !== '');
}

/** The discovery URL actually used — derived from `issuer` unless overridden. */
export function discoveryUrlFor(config: OidcConfig): string {
  if (config.discoveryUrl.trim() !== '') {
    return config.discoveryUrl.trim();
  }
  const issuer = config.issuer.trim().replace(/\/+$/, '');
  return issuer === '' ? '' : `${issuer}/.well-known/openid-configuration`;
}

/** Parsed scope list, for display and for the authorize request. */
export function scopeList(config: OidcConfig): readonly string[] {
  return config.scopes.split(/[\s,]+/).filter((scope) => scope !== '');
}

/** Claim values mapped to a role, for the adapter's claim resolution. */
export function roleValues(csv: string): readonly string[] {
  return csv
    .split(',')
    .map((value) => value.trim())
    .filter((value) => value !== '');
}

/**
 * Problems that must be fixed before this configuration can be used.
 *
 * Returns an **empty array when nothing is configured at all** — that is the
 * expected state today and is not an error; `isOidcConfigured` reports it. What
 * is an error is a configuration that is *present and wrong*, because that is
 * the one a deployment will not notice.
 */
export function validateOidcConfig(config: OidcConfig = readOidcConfig()): readonly string[] {
  const problems: string[] = [];
  const anyPresent = REQUIRED.some((key) => config[key].trim() !== '');
  if (!anyPresent) {
    return problems;
  }

  for (const key of REQUIRED) {
    if (config[key].trim() === '') {
      problems.push(`oidc: "${key}" is required once any OIDC value is set.`);
    }
  }

  // `openid` is what makes it OpenID Connect rather than plain OAuth 2.0 — with
  // it absent there is no ID token, so there is no identity to resolve.
  if (config.clientId.trim() !== '' && !scopeList(config).includes('openid')) {
    problems.push('oidc: the "openid" scope is required.');
  }

  for (const [label, value] of [
    ['issuer', config.issuer],
    ['redirectUri', config.redirectUri],
    ['postLogoutRedirectUri', config.postLogoutRedirectUri],
    ['discoveryUrl', config.discoveryUrl],
  ] as const) {
    if (value.trim() === '') {
      continue;
    }
    let parsed: URL;
    try {
      parsed = new URL(value.trim());
    } catch {
      problems.push(`oidc: "${label}" must be an absolute URL, got "${value}".`);
      continue;
    }
    // An identity flow over plain HTTP exposes the authorization code in
    // transit. `localhost` is the exception every provider makes for dev.
    if (parsed.protocol !== 'https:' && parsed.hostname !== 'localhost') {
      problems.push(`oidc: "${label}" must use https (got ${parsed.protocol}//).`);
    }
    if (label === 'redirectUri' && parsed.hash !== '') {
      // A fragment never reaches the server and is where implicit-flow tokens
      // used to live; a registered redirect URI must not carry one.
      problems.push('oidc: "redirectUri" must not contain a fragment.');
    }
  }

  return problems;
}
