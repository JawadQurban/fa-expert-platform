import type { ReactNode } from 'react';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { DirectionProvider, ThemeProvider } from '@ds/providers';
import { LocaleProvider } from '@i18n/LocaleProvider';
import type { Locale } from '@/types';
import { expertHubRoutes } from '../app/router/routes';
import type { ExpertHubRole, ExpertHubSession } from '../app/auth/types';

/**
 * Expert Hub test utilities. Renders the real Expert Hub route subtree
 * (`expertHubRoutes`) inside the shared, product-neutral providers (theme,
 * direction, locale) so tests exercise the actual shell, layouts, guards, and
 * auth boundary. Session state is controlled by seeding the dev adapter's
 * `sessionStorage` key, so `getSession()` resolves an authenticated/expired/
 * absent session without stubbing.
 */

const DEV_SESSION_KEY = 'expert-hub:dev-session';

/**
 * Seeds a session. The default is a trainer, so a test about something else
 * gets the whole portal; a test about what an `individual` sees passes
 * `['individual']` and says so.
 */
export function seedExpertHubSession(
  roles: readonly ExpertHubRole[] = ['trainer']
): ExpertHubSession {
  const session: ExpertHubSession = {
    userId: 'test-user',
    displayName: 'Test User',
    roles: [...roles],
    expiresAt: Date.now() + 3_600_000,
  };
  window.sessionStorage.setItem(DEV_SESSION_KEY, JSON.stringify(session));
  return session;
}

export function clearExpertHubSession(): void {
  window.sessionStorage.clear();
}

function AllProviders({ children, locale }: { children: ReactNode; locale: Locale }) {
  return (
    <ThemeProvider>
      <DirectionProvider>
        <LocaleProvider defaultLocale={locale}>{children}</LocaleProvider>
      </DirectionProvider>
    </ThemeProvider>
  );
}

export function renderExpertHubAt(
  initialPath: string,
  { locale = 'ar' }: { locale?: Locale } = {}
) {
  const router = createMemoryRouter(expertHubRoutes, { initialEntries: [initialPath] });
  return {
    user: userEvent.setup(),
    router,
    ...render(
      <AllProviders locale={locale}>
        <RouterProvider router={router} />
      </AllProviders>
    ),
  };
}

export { expectNoA11yViolations } from '@/test/test-utils';
export * from '@testing-library/react';
export { userEvent };
