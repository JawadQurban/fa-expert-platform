import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearExpertHubSession,
  expectNoA11yViolations,
  fireEvent,
  renderExpertHubAt,
  screen,
  seedExpertHubSession,
  within,
} from '../../test/renderExpertHub';
import { expertHubPaths } from '../../app/router/paths';
import { getHeaderContent } from '../content/header.content';
import { formatDate } from '../formatting';

const h = getHeaderContent('ar');

/** Desktop matchMedia (the setup default): the compact query never matches. */
function desktopMatchMedia(query: string) {
  return {
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  };
}

/**
 * The Expert Hub three-level application header (`DECISIONS.md` P-15), exercised
 * through the real shell/router so the actual landmarks, navigation, and auth
 * wiring are tested — not a mock. It reproduces the approved Academy/Government
 * structure: government utility bar → service information bar → main header.
 */
describe('Expert Hub header (3-level Academy/Government structure)', () => {
  beforeEach(() => {
    clearExpertHubSession();
  });

  afterEach(() => {
    // Restore the desktop viewport after any test that simulated a compact one.
    vi.stubGlobal('matchMedia', desktopMatchMedia);
  });

  describe('public shell', () => {
    async function renderPublicHeader() {
      const result = renderExpertHubAt(expertHubPaths.landing);
      await screen.findByRole('banner');
      return result;
    }

    it('renders all three levels: gov utility bar, service info bar, main header banner', async () => {
      await renderPublicHeader();
      const region = screen.getByRole('region', { name: h.utilityRegionLabel });
      // Level 1 — government utility bar.
      expect(within(region).getByText(h.gov.indicator)).toBeInTheDocument();
      /*
        Level 2 — the service information bar, showing a LIVE date (`D-22`).
        ⚠️ Date and time are two <time> elements, not one string: joined with a
        separator, the Arabic-Indic digits either side of it reorder under bidi
        and run together into an unreadable number.
      */
      const stamps = within(region).getByText(formatDate(new Date(), 'ar', { dateStyle: 'long' }));
      expect(stamps.closest('time')).toBeTruthy();
      for (const item of h.service.items) {
        expect(within(region).getByText(item.label)).toBeInTheDocument();
      }
      // Level 3 — the single banner landmark.
      expect(screen.getByRole('banner')).toBeInTheDocument();
    });

    it('has exactly one banner and a distinctly-named utility region (one banner only)', async () => {
      await renderPublicHeader();
      expect(screen.getAllByRole('banner')).toHaveLength(1);
      expect(screen.getByRole('region', { name: h.utilityRegionLabel })).toBeInTheDocument();
    });

    it('renders the Financial Academy branding in the header', async () => {
      await renderPublicHeader();
      const banner = screen.getByRole('banner');
      expect(within(banner).getByRole('img', { name: 'الأكاديمية المالية' })).toBeInTheDocument();
    });

    it('renders the public navigation IA (Home / Directory), all in-namespace', async () => {
      await renderPublicHeader();
      const nav = screen.getByRole('navigation', { name: h.navLabel });
      for (const link of h.publicNav) {
        expect(within(nav).getByRole('link', { name: link.label })).toHaveAttribute(
          'href',
          link.href
        );
      }
    });

    it('exposes no Hackathon / pre-auth trainer navigation content', async () => {
      await renderPublicHeader();
      expect(screen.queryByText(/هاكاثون/)).not.toBeInTheDocument();
      const nav = screen.getByRole('navigation', { name: h.navLabel });
      // Every public nav link stays under /expert-hub/*.
      within(nav)
        .getAllByRole('link')
        .forEach((a) => expect(a.getAttribute('href')).toMatch(/^\/expert-hub(\/|$|\?)/));
    });

    it('shows a visible Login as the green primary action, routed through the Expert Hub auth abstraction', async () => {
      await renderPublicHeader();
      const banner = screen.getByRole('banner');
      const login = within(banner).getByRole('link', { name: h.loginLabel });
      expect(login).toHaveAttribute('data-variant', 'primary');
      expect(login.getAttribute('href')).toMatch(/^\/expert-hub\/login/);
    });

    it('renders the language switcher, and toggling it switches the locale', async () => {
      const { user } = await renderPublicHeader();
      const banner = screen.getByRole('banner');
      const toggle = within(banner).getByRole('button', { name: h.localeToggleLabel });
      await user.click(toggle);
      expect(
        await within(screen.getByRole('banner')).findByRole('button', {
          name: getHeaderContent('en').localeToggleLabel,
        })
      ).toBeInTheDocument();
    });

    it('renders the search affordance pointing at the directory — the one searchable public surface', async () => {
      await renderPublicHeader();
      const banner = screen.getByRole('banner');
      // It used to point at a `/search` route that was never built (P-120).
      expect(within(banner).getByRole('link', { name: h.searchLabel })).toHaveAttribute(
        'href',
        expertHubPaths.directory
      );
    });

    it('renders the "how to verify?" affordance as a non-navigable placeholder (URL pending)', async () => {
      await renderPublicHeader();
      const verify = screen.getByText(h.gov.verifyLabel);
      const anchor = verify.closest('a');
      expect(anchor).not.toBeNull();
      expect(anchor).toHaveAttribute('aria-disabled', 'true');
      expect(anchor).not.toHaveAttribute('href');
    });

    it('is RTL-first (Arabic default)', async () => {
      await renderPublicHeader();
      expect(document.documentElement).toHaveAttribute('dir', 'rtl');
    });

    it('never falls back to the missing-icon glyph', async () => {
      const { container } = await renderPublicHeader();
      expect(container.querySelectorAll('[data-missing="true"]')).toHaveLength(0);
    });

    it('has no automatically-detectable accessibility violations', async () => {
      const { container } = await renderPublicHeader();
      await expectNoA11yViolations(container);
    });

    it('collapses the navigation behind the approved responsive toggle below the breakpoint', async () => {
      vi.stubGlobal('matchMedia', (query: string) => ({
        ...desktopMatchMedia(query),
        matches: query.includes('959.98'),
      }));
      renderExpertHubAt(expertHubPaths.landing);
      expect(await screen.findByRole('button', { name: h.menuLabel })).toBeInTheDocument();
    });
  });

  it('a signed-in visitor on a public page is shown as signed in, not offered login', async () => {
    // Reported from the testing server: after signing in, the landing page
    // still offered «تسجيل الدخول». The public header was rendering its
    // actions from the variant alone and ignoring the session entirely.
    seedExpertHubSession(['trainer']);
    renderExpertHubAt(expertHubPaths.landing);

    expect(await screen.findByRole('button', { name: h.logoutLabel })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: h.loginLabel })).not.toBeInTheDocument();
    // The search stays — it is public and useful either way.
    expect(screen.getByRole('link', { name: h.searchLabel })).toBeInTheDocument();
  });

  it('shows the real date, not a hard-coded one from two years ago', async () => {
    /*
     * `D-22` — the bar read «3 September 2024 · 2:30 PM · Riyadh · Cloudy» on
     * a live government site in September 2026. A frozen date tells every
     * visitor the site is abandoned.
     */
    renderExpertHubAt(expertHubPaths.landing);
    await screen.findByRole('banner');
    const region = screen.getByRole('region', { name: h.utilityRegionLabel });

    const today = formatDate(new Date(), 'ar', { dateStyle: 'long' });
    expect(within(region).getByText((text) => text.includes(today))).toBeInTheDocument();
    // ⚠️ The date stands alone in its own element. Reported from the server:
    // «سبتمبر ٣١٢٠٢٦ م» — a date and a time joined by a separator, reordered
    // by bidi until the numbers collided.
    expect(within(region).queryByText((text) => text.includes('·'))).toBeNull();
    // And nothing invented beside it: there is no weather feed.
    expect(within(region).queryByText('غائم')).not.toBeInTheDocument();
    expect(within(region).queryByText('3 سبتمبر 2024')).not.toBeInTheDocument();
  });

  it('marks one tab as current, not every tab whose path is a prefix', async () => {
    /*
     * `D-23` — «لوحة العمل» stayed highlighted alongside the real tab on the
     * inbox, the assignment requests and the trainer base, because the
     * dashboard lives at `/internal` and prefix-matched them all.
     */
    seedExpertHubSession(['individual', 'internal']);
    renderExpertHubAt(expertHubPaths.internalApplications);
    await screen.findByRole('banner');

    const nav = screen.getByRole('navigation', { name: h.navLabel });
    const current = within(nav)
      .getAllByRole('link')
      .filter((link) => link.getAttribute('aria-current') === 'page');
    expect(current).toHaveLength(1);
    expect(current[0]).toHaveAccessibleName('صندوق الطلبات');
  });

  describe('the portal areas a person actually has', () => {
    /*
     * Owner ruling, 2026-09-08: «the individual can only see the two tabs,
     * which is the main page and my request, but the trainer is already [an]
     * approved trainer so it can see everything». Engagements, materials,
     * entitlements and the trainer file all belong to a trainer.
     */
    it('offers an individual their requests, and not the areas that belong to a trainer', async () => {
      seedExpertHubSession(['individual']);
      renderExpertHubAt(expertHubPaths.applications);
      await screen.findByRole('banner');

      const nav = screen.getByRole('navigation', { name: h.navLabel });
      expect(within(nav).getByRole('link', { name: 'طلباتي' })).toBeInTheDocument();
      for (const hidden of ['ارتباطاتي', 'المواد والمحتوى', 'مستحقاتي', 'ملفي']) {
        expect(within(nav).queryByRole('link', { name: hidden })).not.toBeInTheDocument();
      }
    });

    it('opens every area to a trainer', async () => {
      seedExpertHubSession(['trainer']);
      renderExpertHubAt(expertHubPaths.applications);
      await screen.findByRole('banner');

      const nav = screen.getByRole('navigation', { name: h.navLabel });
      for (const label of ['طلباتي', 'ارتباطاتي', 'المواد والمحتوى', 'مستحقاتي', 'ملفي']) {
        expect(within(nav).getByRole('link', { name: label })).toBeInTheDocument();
      }
    });

    it('does not narrow the staff areas — this is about the trainer side', async () => {
      // Staff hold `individual` too (everybody does). Narrowing on its
      // presence would lock the platform's own operators out of their work.
      seedExpertHubSession(['individual', 'internal']);
      renderExpertHubAt(expertHubPaths.internal);
      await screen.findByRole('banner');

      const nav = screen.getByRole('navigation', { name: h.navLabel });
      expect(within(nav).getByRole('link', { name: 'صندوق الطلبات' })).toBeInTheDocument();
    });
  });

  describe('authenticated shell (role-scoped, no public marketing chrome)', () => {
    it('drops the utility bars + public Login and shows the auth-driven logout for a portal session', async () => {
      seedExpertHubSession(['trainer']);
      renderExpertHubAt(expertHubPaths.applications);
      await screen.findByRole('banner');
      // No public government/service utility bars in the authenticated shell.
      expect(screen.queryByRole('region', { name: h.utilityRegionLabel })).not.toBeInTheDocument();
      expect(screen.queryByText(h.gov.indicator)).not.toBeInTheDocument();
      // No public Login. Sign-out lives in the account menu now, behind the
      // person's own avatar — so the header carries the menu, and the action
      // is one click inside it.
      expect(screen.queryByRole('link', { name: h.loginLabel })).not.toBeInTheDocument();
      const account = screen.getByRole('button', { name: h.accountLabel });
      expect(account).toBeInTheDocument();

      fireEvent.click(account);
      expect(await screen.findByRole('button', { name: h.logoutLabel })).toBeInTheDocument();
    });

    it('offers a signed-in trainer their own places, and only the reachable ones', async () => {
      /*
        The account menu is built from the same filtered navigation set as the
        tabs, so it can never offer a door the route guard will close — an
        `individual` must not be handed their trainer file from here while the
        tab for it is deliberately hidden.
      */
      seedExpertHubSession(['individual']);
      renderExpertHubAt(expertHubPaths.applications);
      await screen.findByRole('banner');

      fireEvent.click(screen.getByRole('button', { name: h.accountLabel }));

      expect(await screen.findByRole('button', { name: 'طلباتي' })).toBeInTheDocument();
      for (const hidden of ['ملفي الشخصي', 'ارتباطاتي', 'مستحقاتي']) {
        expect(screen.queryByRole('button', { name: hidden })).not.toBeInTheDocument();
      }
    });
  });
});
