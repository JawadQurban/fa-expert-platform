import { afterEach, describe, expect, it } from 'vitest';
import { readRuntimeConfig, validateRuntimeConfig } from './runtimeConfig';

/**
 * The runtime-config reader is what lets one Docker image serve every
 * environment (values come from the container-injected `config.js`). These tests
 * pin the resolution order + placeholder guarding + validation.
 */
afterEach(() => {
  delete window.__EXPERT_HUB_RUNTIME_CONFIG__;
});

describe('Expert Hub runtime config', () => {
  it('reads values from window.__EXPERT_HUB_RUNTIME_CONFIG__ (the container config.js)', () => {
    window.__EXPERT_HUB_RUNTIME_CONFIG__ = {
      apiBaseUrl: 'https://api.example/expert-hub/api',
      environment: 'uat',
    };
    const config = readRuntimeConfig();
    expect(config.apiBaseUrl).toBe('https://api.example/expert-hub/api');
    expect(config.environment).toBe('uat');
  });

  it('falls back to a safe default (empty api ⇒ mock) when nothing is provided', () => {
    const config = readRuntimeConfig();
    expect(config.apiBaseUrl).toBe('');
    expect(config.environment).toMatch(/development|production/);
  });

  it('ignores un-substituted template placeholders (failed envsubst)', () => {
    window.__EXPERT_HUB_RUNTIME_CONFIG__ = {
      apiBaseUrl: '${EXPERT_HUB_API_BASE_URL}',
      ssoEntryUrl: '__EXPERT_HUB_SSO_ENTRY_URL__',
    };
    const config = readRuntimeConfig();
    expect(config.apiBaseUrl).toBe('');
    expect(config.ssoEntryUrl).toBe('');
  });

  it('validates that a provided apiBaseUrl is a URL or root-relative path', () => {
    expect(validateRuntimeConfig({ ...base(), apiBaseUrl: '' })).toEqual([]);
    expect(validateRuntimeConfig({ ...base(), apiBaseUrl: '/expert-hub/api' })).toEqual([]);
    expect(validateRuntimeConfig({ ...base(), apiBaseUrl: 'https://x/api' })).toEqual([]);
    expect(validateRuntimeConfig({ ...base(), apiBaseUrl: 'not a url' }).length).toBeGreaterThan(0);
  });
});

function base() {
  return {
    apiBaseUrl: '',
    dataMode: 'api',
    environment: 'test',
    ssoEntryUrl: '',
    telemetryUrl: '',
    oidcIssuer: '',
    oidcDiscoveryUrl: '',
    oidcClientId: '',
    oidcScopes: '',
    oidcRedirectUri: '',
    oidcPostLogoutRedirectUri: '',
    oidcRoleClaim: '',
    oidcInternalRoleValues: '',
    oidcTrainerRoleValues: '',
    oidcNameClaim: '',
  } as const;
}
