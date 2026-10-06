import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { DirectionProvider, ThemeProvider } from '@ds/providers';
import { LocaleProvider } from '@i18n/LocaleProvider';
import { AuthProvider } from '../../app/auth/AuthProvider';
import type { ExpertHubAuthAdapter } from '../../app/auth/types';
import { expertHubPaths } from '../../app/router/paths';
import { getShellContent } from '../../shared/content/shell.content';
import LoginPage from './LoginPage';

const c = getShellContent('ar').login;

/**
 * P-177/P-178 — the login surface under the REAL (non-placeholder) adapter:
 * one sign-in action, and the silent portal-first handshake auto-starts.
 * Rendered with a stub adapter through the `AuthProvider` seam, because the
 * app-level tests run on the placeholder, which must never auto-start.
 */
function stubAdapter(overrides: Partial<ExpertHubAuthAdapter> = {}): ExpertHubAuthAdapter {
  return {
    kind: 'stub-academy',
    isPlaceholder: false,
    getSession: () => Promise.resolve(null),
    startLogin: vi.fn(() =>
      Promise.resolve({ redirectTo: 'https://api.example.test/api/auth/login?returnUrl=%2F' })
    ),
    completeLogin: () => Promise.reject(new Error('not used')),
    logout: () => Promise.resolve(),
    ...overrides,
  };
}

function renderLogin(adapter: ExpertHubAuthAdapter, path = expertHubPaths.login) {
  return render(
    <ThemeProvider>
      <DirectionProvider>
        <LocaleProvider defaultLocale="ar">
          <MemoryRouter initialEntries={[path]}>
            <AuthProvider adapter={adapter} initialSession={null}>
              <Routes>
                <Route path={expertHubPaths.login} element={<LoginPage />} />
              </Routes>
            </AuthProvider>
          </MemoryRouter>
        </LocaleProvider>
      </DirectionProvider>
    </ThemeProvider>
  );
}

describe('LoginPage — Academy SSO only (P-177/P-178)', () => {
  const assign = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('location', { ...window.location, assign });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    assign.mockReset();
  });

  it('auto-starts the silent SSO handshake under the real adapter (portal-first, P-178)', async () => {
    const startLogin = vi.fn(() =>
      Promise.resolve({ redirectTo: 'https://api.example.test/api/auth/login' })
    );
    renderLogin(stubAdapter({ startLogin }));

    // The handshake begins without any click — the STS decides whether it is
    // silent (portal session exists) or shows FAST's own login.
    await waitFor(() => expect(startLogin).toHaveBeenCalledTimes(1));
    expect(startLogin).toHaveBeenCalledWith(expertHubPaths.home);
    await waitFor(() => expect(assign).toHaveBeenCalled());
    // The page says what is happening, and keeps the one visible fallback.
    expect(screen.getByText(c.redirectingNotice)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: c.ssoButtonLabel })).toBeInTheDocument();
  });

  it('carries the guard’s returnUrl into the auto-started handshake', async () => {
    const startLogin = vi.fn(() =>
      Promise.resolve({ redirectTo: 'https://api.example.test/api/auth/login' })
    );
    renderLogin(
      stubAdapter({ startLogin }),
      `${expertHubPaths.login}?returnUrl=${encodeURIComponent('/expert-hub/profile')}`
    );

    await waitFor(() => expect(startLogin).toHaveBeenCalledWith('/expert-hub/profile'));
  });

  it('attempts the auto-start once, not in a loop', async () => {
    const startLogin = vi.fn(() =>
      Promise.resolve({ redirectTo: 'https://api.example.test/api/auth/login' })
    );
    const adapter = stubAdapter({ startLogin });
    const { rerender } = renderLogin(adapter);
    await waitFor(() => expect(startLogin).toHaveBeenCalledTimes(1));
    rerender(
      <ThemeProvider>
        <DirectionProvider>
          <LocaleProvider defaultLocale="ar">
            <MemoryRouter initialEntries={[expertHubPaths.login]}>
              <AuthProvider adapter={adapter} initialSession={null}>
                <Routes>
                  <Route path={expertHubPaths.login} element={<LoginPage />} />
                </Routes>
              </AuthProvider>
            </MemoryRouter>
          </LocaleProvider>
        </DirectionProvider>
      </ThemeProvider>
    );
    // Still exactly one attempt — a failed handshake must not ping-pong.
    expect(startLogin).toHaveBeenCalledTimes(1);
  });
});
