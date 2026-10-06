import { afterEach, describe, expect, it } from 'vitest';
import {
  discoveryUrlFor,
  isOidcConfigured,
  readOidcConfig,
  roleValues,
  scopeList,
  validateOidcConfig,
  type OidcConfig,
} from './oidcConfig';

/**
 * **INT-01 — the OpenID Connect client configuration.**
 *
 * The promise this module makes is that when the FAST team issues the client
 * registration, **only configuration changes**. These tests hold that promise to
 * account, and hold the one rule that must never bend: nothing in this config
 * can be a secret, because every byte of it is served to the browser.
 */

const EMPTY: OidcConfig = {
  issuer: '',
  discoveryUrl: '',
  clientId: '',
  scopes: 'openid profile email',
  redirectUri: '',
  postLogoutRedirectUri: '',
  roleClaim: '',
  internalRoleValues: '',
  trainerRoleValues: '',
  nameClaim: 'name',
};

const REGISTERED: OidcConfig = {
  ...EMPTY,
  issuer: 'https://sso.example.gov.sa',
  clientId: 'expert-hub-web',
  redirectUri: 'https://hub.example.gov.sa/expert-hub/auth/callback',
  postLogoutRedirectUri: 'https://hub.example.gov.sa/expert-hub',
  roleClaim: 'roles',
  internalRoleValues: 'TrainerMgmtStaff, TrainerMgmtManager',
  trainerRoleValues: 'Trainer',
};

afterEach(() => {
  delete window.__EXPERT_HUB_RUNTIME_CONFIG__;
});

describe('INT-01 — OIDC client configuration', () => {
  /* ── The rule that cannot bend ─────────────────────────────────────────── */

  it('has no field that could hold a secret', () => {
    // `config.js` is served to every browser: a secret here is a published
    // secret. The rule is kept by there being nowhere to put one, so it cannot
    // be undone by someone adding a value to an existing field.
    const keys = Object.keys(readOidcConfig());
    for (const key of keys) {
      expect(key).not.toMatch(/secret|password|credential|privatekey/i);
    }
    expect(keys).not.toContain('clientSecret');
  });

  it('does not let the flow be downgraded away from Authorization Code + PKCE', () => {
    // No `responseType`, no `usePkce`: the implicit flow returns tokens in the
    // URL fragment, where they reach browser history and server logs. Making
    // that configurable would make "turn PKCE off" a supported option.
    const keys = Object.keys(readOidcConfig());
    expect(keys).not.toContain('responseType');
    expect(keys).not.toContain('usePkce');
    expect(keys).not.toContain('flow');
  });

  /* ── Not configured is a state, not an error ───────────────────────────── */

  it('reports "not configured" while FAST has not issued the client', () => {
    expect(isOidcConfigured(EMPTY)).toBe(false);
    // And says nothing is wrong — this is today's expected state.
    expect(validateOidcConfig(EMPTY)).toEqual([]);
  });

  it('a half-filled client is an error, because that is the one nobody notices', () => {
    const problems = validateOidcConfig({ ...EMPTY, clientId: 'expert-hub-web' });
    expect(problems.some((p) => p.includes('issuer'))).toBe(true);
    expect(problems.some((p) => p.includes('redirectUri'))).toBe(true);
    expect(isOidcConfigured({ ...EMPTY, clientId: 'expert-hub-web' })).toBe(false);
  });

  it('accepts a complete registration', () => {
    expect(validateOidcConfig(REGISTERED)).toEqual([]);
    expect(isOidcConfigured(REGISTERED)).toBe(true);
  });

  /* ── Values that are present must be right ─────────────────────────────── */

  it('refuses plain http outside localhost, where the code travels in the clear', () => {
    expect(
      validateOidcConfig({ ...REGISTERED, issuer: 'http://sso.example.gov.sa' })
    ).toContainEqual(expect.stringContaining('https'));
    // Every provider makes the localhost exception for development.
    expect(
      validateOidcConfig({
        ...REGISTERED,
        issuer: 'http://localhost:8080',
        redirectUri: 'http://localhost:5173/expert-hub/auth/callback',
        postLogoutRedirectUri: 'http://localhost:5173/expert-hub',
      })
    ).toEqual([]);
  });

  it('refuses a redirect URI carrying a fragment', () => {
    expect(
      validateOidcConfig({ ...REGISTERED, redirectUri: `${REGISTERED.redirectUri}#/x` })
    ).toContainEqual(expect.stringContaining('fragment'));
  });

  it('requires the openid scope — without it there is no ID token to resolve', () => {
    expect(validateOidcConfig({ ...REGISTERED, scopes: 'profile email' })).toContainEqual(
      expect.stringContaining('openid')
    );
  });

  it('refuses a malformed URL rather than sending the browser to it', () => {
    expect(validateOidcConfig({ ...REGISTERED, issuer: 'not a url' })).toContainEqual(
      expect.stringContaining('absolute URL')
    );
  });

  /* ── Derivations ───────────────────────────────────────────────────────── */

  it('derives the discovery URL from the issuer, and lets it be overridden', () => {
    expect(discoveryUrlFor(REGISTERED)).toBe(
      'https://sso.example.gov.sa/.well-known/openid-configuration'
    );
    expect(discoveryUrlFor({ ...REGISTERED, issuer: 'https://sso.example.gov.sa/' })).toBe(
      'https://sso.example.gov.sa/.well-known/openid-configuration'
    );
    expect(
      discoveryUrlFor({ ...REGISTERED, discoveryUrl: 'https://sso.example.gov.sa/oidc/config' })
    ).toBe('https://sso.example.gov.sa/oidc/config');
  });

  it('parses scopes and role values the way the provider writes them', () => {
    expect(scopeList(REGISTERED)).toEqual(['openid', 'profile', 'email']);
    expect(roleValues(REGISTERED.internalRoleValues)).toEqual([
      'TrainerMgmtStaff',
      'TrainerMgmtManager',
    ]);
    expect(roleValues('')).toEqual([]);
  });

  /* ── The config-only promise ───────────────────────────────────────────── */

  it('a registration injected at container start is picked up with no rebuild', () => {
    // This is the whole point: `config.js` sets these before bootstrap, so
    // handing over the client id is an edit to an env file.
    window.__EXPERT_HUB_RUNTIME_CONFIG__ = {
      oidcIssuer: 'https://sso.example.gov.sa',
      oidcClientId: 'expert-hub-web',
      oidcRedirectUri: 'https://hub.example.gov.sa/expert-hub/auth/callback',
    };
    const config = readOidcConfig();
    expect(config.clientId).toBe('expert-hub-web');
    expect(isOidcConfigured(config)).toBe(true);
    expect(validateOidcConfig(config)).toEqual([]);
  });

  it('an un-substituted template placeholder counts as not configured', () => {
    // A container whose entrypoint failed to substitute must fall back cleanly,
    // not send the browser to a provider called "${EXPERT_HUB_OIDC_ISSUER}".
    window.__EXPERT_HUB_RUNTIME_CONFIG__ = {
      oidcIssuer: '${EXPERT_HUB_OIDC_ISSUER}',
      oidcClientId: '__EXPERT_HUB_OIDC_CLIENT_ID__',
    };
    expect(isOidcConfigured(readOidcConfig())).toBe(false);
  });

  it('defaults the scopes and the name claim so a minimal registration works', () => {
    window.__EXPERT_HUB_RUNTIME_CONFIG__ = { oidcClientId: 'expert-hub-web' };
    const config = readOidcConfig();
    expect(scopeList(config)).toContain('openid');
    expect(config.nameClaim).toBe('name');
  });
});
