import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * The Academy SSO BFF client (`P-163`): three endpoints, an HttpOnly cookie
 * the adapter never reads, and — because this adapter fronts the login for
 * the whole product — a hard rule that nothing here ever throws at the UI.
 *
 * `expertHubConfig` is mocked with a configured `apiBaseUrl` (the module reads
 * it at import time), so these tests exercise exactly what a deployed
 * container would run.
 */

vi.mock('../config/expertHubConfig', () => ({
  expertHubConfig: {
    basePath: '/expert-hub',
    apiBaseUrl: 'https://experts.example.test/api',
    authApiBaseUrl: 'https://experts.example.test/api',
    authMode: 'academy-sso',
  },
  EXPERT_HUB_BASE_PATH: '/expert-hub',
}));

import { academySsoAdapter } from './academySsoAdapter';

const sessionWire = {
  userId: 'user-42',
  displayName: 'موظف الاختبار',
  roles: ['internal'],
  expiresAt: Date.now() + 60_000,
};

function okJson(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}

describe('academySsoAdapter', () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    fetchMock.mockReset();
  });

  it('is the real adapter — not a placeholder', () => {
    expect(academySsoAdapter.kind).toBe('academy-sso');
    expect(academySsoAdapter.isPlaceholder).toBe(false);
  });

  it('resolves the session from GET /auth/session, with credentials', async () => {
    fetchMock.mockResolvedValueOnce(okJson(sessionWire));

    const session = await academySsoAdapter.getSession();

    expect(fetchMock).toHaveBeenCalledWith(
      'https://experts.example.test/api/auth/session',
      expect.objectContaining({ credentials: 'include' })
    );
    expect(session).toEqual(sessionWire);
  });

  it('keeps the roles the API sends, including the baseline one, and drops the rest', () => {
    // The API is the authority on roles (`P-J9`). `individual` is held by
    // everybody who signs in (owner ruling, 2026-09-08); anything the union
    // does not name is dropped rather than guessed at.
    fetchMock.mockResolvedValueOnce(
      okJson({ ...sessionWire, roles: ['individual', 'trainer', 'superuser', ''] })
    );
    return expect(academySsoAdapter.getSession()).resolves.toMatchObject({
      roles: ['individual', 'trainer'],
    });
  });

  it('treats 401 as "no session", not an error', async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 401 }));

    await expect(academySsoAdapter.getSession()).resolves.toBeNull();
  });

  it('resolves null when the API is unreachable — never a crash', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));

    await expect(academySsoAdapter.getSession()).resolves.toBeNull();
  });

  it('drops role values that are not part of the ExpertHubRole union', async () => {
    // The API is the authority on roles; anything unrecognized must not
    // widen into an entitlement on the client.
    fetchMock.mockResolvedValueOnce(
      okJson({ ...sessionWire, roles: ['internal', 'superuser', ''] })
    );

    const session = await academySsoAdapter.getSession();

    expect(session?.roles).toEqual(['internal']);
  });

  it('starts login by sending the browser to the API login endpoint', async () => {
    const { redirectTo } = await academySsoAdapter.startLogin('/expert-hub/applications?tab=a');

    expect(redirectTo).toBe(
      'https://experts.example.test/api/auth/login?returnUrl=' +
        encodeURIComponent('/expert-hub/applications?tab=a')
    );
    // An external URL — the AuthProvider performs a full-page navigation, so
    // the identity provider sees the browser, never a fetch.
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('completes login by resolving the session the callback cookie established', async () => {
    fetchMock.mockResolvedValueOnce(okJson(sessionWire));

    const result = await academySsoAdapter.completeLogin(
      new URLSearchParams({ returnUrl: '/expert-hub/portal' })
    );

    expect(result.session.userId).toBe('user-42');
    expect(result.returnUrl).toBe('/expert-hub/portal');
  });

  it('fails completeLogin loudly when no session exists', async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 401 }));

    await expect(academySsoAdapter.completeLogin(new URLSearchParams())).rejects.toThrow(
      'Academy SSO sign-in did not complete.'
    );
  });

  it('logs out via POST and navigates to the provider end-session URL when given one', async () => {
    fetchMock.mockResolvedValueOnce(
      okJson({ providerLogoutUrl: 'https://idp.example.test/connect/endsession?id_token_hint=x' })
    );
    const assign = vi.fn();
    vi.stubGlobal('location', { ...window.location, assign });

    await academySsoAdapter.logout();

    expect(fetchMock).toHaveBeenCalledWith(
      'https://experts.example.test/api/auth/logout',
      expect.objectContaining({ method: 'POST', credentials: 'include' })
    );
    expect(assign).toHaveBeenCalledWith(
      'https://idp.example.test/connect/endsession?id_token_hint=x'
    );
  });

  it('stays local when the provider offers no end-session URL', async () => {
    fetchMock.mockResolvedValueOnce(okJson({ providerLogoutUrl: null }));
    const assign = vi.fn();
    vi.stubGlobal('location', { ...window.location, assign });

    await academySsoAdapter.logout();

    expect(assign).not.toHaveBeenCalled();
  });

  it('never throws from logout, even when the API is down', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));

    await expect(academySsoAdapter.logout()).resolves.toBeUndefined();
  });
});
