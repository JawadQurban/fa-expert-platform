import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearExpertHubSession,
  renderExpertHubAt,
  screen,
  seedExpertHubSession,
} from '../../test/renderExpertHub';
import { getShellContent } from '../../shared/content/shell.content';
import { getMyApplicationsContent } from '../../features/applications/myApplications.content';
import { getDirectoryContent } from '../../features/directory/directory.content';
import { getInternalContent } from '../../features/internal/internal.content';
import { getHeaderContent } from '../../shared/content/header.content';
import { expertHubPaths, loginWithReturn } from './paths';

const c = getShellContent('ar');
const headerContent = getHeaderContent('ar');
const applicationsTitle = getMyApplicationsContent('ar').title;
const directoryTitle = getDirectoryContent('ar').title;

describe('Expert Hub router + auth guards', () => {
  beforeEach(() => {
    clearExpertHubSession();
  });

  it('renders the public landing at the base path without authentication', async () => {
    renderExpertHubAt(expertHubPaths.landing);
    expect(await screen.findByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('banner')).toBeInTheDocument();
  });

  it('redirects an unauthenticated user from a guarded route to login (with return URL)', async () => {
    const { router } = renderExpertHubAt(expertHubPaths.applications);
    expect(
      await screen.findByRole('heading', { level: 1, name: c.login.title })
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe(expertHubPaths.login);
    expect(router.state.location.search).toContain('returnUrl');
  });

  it('lets an authenticated trainer reach the My Applications page (EH-TP-02)', async () => {
    seedExpertHubSession(['trainer']);
    renderExpertHubAt(expertHubPaths.applications);
    expect(
      await screen.findByRole('heading', { level: 1, name: applicationsTitle })
    ).toBeInTheDocument();
  });

  it('blocks a trainer from an internal route (RequireRole → unauthorized)', async () => {
    seedExpertHubSession(['trainer']);
    const { router } = renderExpertHubAt(expertHubPaths.internal);
    expect(
      await screen.findByRole('heading', { level: 1, name: c.unauthorized.title })
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe(expertHubPaths.unauthorized);
  });

  it('lets an internal-role user reach the internal dashboard (EH-INT-01)', async () => {
    seedExpertHubSession(['internal']);
    renderExpertHubAt(expertHubPaths.internal);
    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: getInternalContent('ar').dashboard.greeting('Test User'),
      })
    ).toBeInTheDocument();
  });

  it('shows the Expert Hub not-found page for an unknown /expert-hub/* path', async () => {
    renderExpertHubAt('/expert-hub/does-not-exist');
    expect(
      await screen.findByRole('heading', { level: 1, name: c.notFound.title })
    ).toBeInTheDocument();
  });

  it('renders the public Trainer Directory (EH-PUB-02) without authentication', async () => {
    renderExpertHubAt(expertHubPaths.directory);
    expect(
      await screen.findByRole('heading', { level: 1, name: directoryTitle })
    ).toBeInTheDocument();
  });

  it('completes the login flow and returns the user to the attempted page', async () => {
    const { user } = renderExpertHubAt(loginWithReturn(expertHubPaths.applications));
    // The login page shows the SSO action and the dev-placeholder notice.
    const ssoButton = await screen.findByRole('button', { name: c.login.ssoButtonLabel });
    await user.click(ssoButton);
    // startSso → callback → completeSso → navigate(returnUrl) → guarded page renders.
    expect(
      await screen.findByRole('heading', { level: 1, name: applicationsTitle })
    ).toBeInTheDocument();
  });

  it('surfaces the temporary dev-SSO placeholder notice on the login page', async () => {
    renderExpertHubAt(expertHubPaths.login);
    expect(
      await screen.findByRole('heading', { level: 1, name: c.login.title })
    ).toBeInTheDocument();
    // The placeholder adapter drives a visible, non-production development notice.
    expect(screen.getByText(c.login.devNotice)).toBeInTheDocument();
  });

  /* ── The single SSO sign-in — P-177 ────────────────────────────────────────
   * Academy SSO is the only way in: the login page renders exactly one
   * sign-in action, and the development placeholder behind it (when no
   * API/OIDC client is configured) takes its role from
   * `VITE_EXPERT_HUB_DEV_ROLE`, never from a control on the page.
   * ------------------------------------------------------------------------ */

  it('P-177: the login page offers exactly one sign-in action — the SSO button', async () => {
    renderExpertHubAt(expertHubPaths.login);
    expect(await screen.findByRole('button', { name: c.login.ssoButtonLabel })).toBeInTheDocument();
    // The retired development persona picker is gone.
    expect(screen.queryByRole('button', { name: 'الدخول كمدرب' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'الدخول كموظف داخلي' })).not.toBeInTheDocument();
  });

  it('signing in through SSO lands on the role-resolved home (trainer → Portal Home)', async () => {
    const { user, router } = renderExpertHubAt(expertHubPaths.login);
    await user.click(await screen.findByRole('button', { name: c.login.ssoButtonLabel }));
    await screen.findByRole('heading', { level: 1 });
    expect(router.state.location.pathname).toBe(expertHubPaths.home);
  });

  it('role-resolves the home entry: a staff-only session lands on the internal dashboard', async () => {
    // The admin/staff complaint this closes: an internal session without the
    // trainer role must never land on a trainer surface.
    seedExpertHubSession(['internal']);
    const { router } = renderExpertHubAt(expertHubPaths.home);
    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: getInternalContent('ar').dashboard.greeting('Test User'),
      })
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe(expertHubPaths.internal);
  });

  it('role-resolves the home entry: a trainer renders Portal Home (EH-TP-01)', async () => {
    seedExpertHubSession(['trainer']);
    const { router } = renderExpertHubAt(expertHubPaths.home);
    await screen.findByRole('heading', { level: 1 });
    expect(router.state.location.pathname).toBe(expertHubPaths.home);
  });

  it('header login carries no returnUrl, so the flow decides the destination', async () => {
    // Regression: the header's login button hardcoded
    // `?returnUrl=/expert-hub/applications`, which outranked the flow's own
    // destination after sign-in.
    renderExpertHubAt(expertHubPaths.landing);
    const loginLink = await screen.findByRole('link', { name: headerContent.loginLabel });
    expect(loginLink).toHaveAttribute('href', expertHubPaths.login);
    expect(loginLink.getAttribute('href')).not.toContain('returnUrl');
  });

  it('honours an explicit returnUrl through the SSO flow', async () => {
    const { user, router } = renderExpertHubAt(loginWithReturn(expertHubPaths.profile));
    await user.click(await screen.findByRole('button', { name: c.login.ssoButtonLabel }));
    await screen.findByRole('heading', { level: 1 });
    expect(router.state.location.pathname).toBe(expertHubPaths.profile);
  });
});
