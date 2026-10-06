import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearExpertHubSession,
  expectNoA11yViolations,
  renderExpertHubAt,
  screen,
  within,
} from '../../test/renderExpertHub';
import { expertHubPaths } from '../../app/router/paths';
import { getLandingContent } from './landing.content';

const content = getLandingContent('ar');

/**
 * Renders the "منصة الخبراء" landing (`EH-PUB-01`) through the real Expert Hub
 * shell (root → public layout → page), so the header/footer/landmarks are
 * exercised. The page is lazy-loaded, so each test first awaits the hero h1.
 * Tests cover the reference content sections (hero + invitation, the About
 * segmented tabs, the vertical join-guidelines, the collaboration timeline, and
 * the closing CTA) plus the invariants any redesign must preserve.
 */
describe('Expert Hub LandingPage (EH-PUB-01) — منصة الخبراء', () => {
  beforeEach(() => {
    clearExpertHubSession();
  });

  async function renderLanding() {
    const result = renderExpertHubAt(expertHubPaths.landing);
    await screen.findByRole('heading', { level: 1, name: content.hero.title });
    return result;
  }

  it('renders exactly one h1 carrying the platform title', async () => {
    await renderLanding();
    const headings = screen.getAllByRole('heading', { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveTextContent(content.hero.title);
  });

  it('renders the Expert Hub header and footer landmarks (banner/contentinfo)', async () => {
    await renderLanding();
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });

  it('shows the header Login action pointing at the Expert Hub login route', async () => {
    await renderLanding();
    const login = screen.getByRole('link', { name: 'تسجيل الدخول' });
    expect(login.getAttribute('href')).toMatch(/^\/expert-hub\/login/);
  });

  it('renders the hero subtitle and invitation pitch', async () => {
    await renderLanding();
    expect(screen.getByText(content.hero.subtitle)).toBeInTheDocument();
    expect(screen.getByText(content.hero.invitation.body)).toBeInTheDocument();
  });

  it('routes every visible "انضم الآن" join CTA to the New Application flow', async () => {
    await renderLanding();
    const joinLinks = screen.getAllByRole('link', { name: content.hero.invitation.ctaLabel });
    // Hero invitation + eligibility CTA + final CTA (the Why-tab CTA is hidden by default).
    expect(joinLinks).toHaveLength(3);
    joinLinks.forEach((link) =>
      expect(link).toHaveAttribute('href', expertHubPaths.applicationsNew)
    );
  });

  it('never links into the Hackathon namespace — every in-app link stays under /expert-hub/*', async () => {
    await renderLanding();
    const internalLinks = screen
      .getAllByRole('link')
      .filter((a) => (a.getAttribute('href') ?? '').startsWith('/'));
    expect(internalLinks.length).toBeGreaterThan(0);
    internalLinks.forEach((a) => expect(a.getAttribute('href')).toMatch(/^\/expert-hub(\/|$|\?)/));
  });

  it('About: the segmented switcher shows the about copy by default and swaps to Why / Goals', async () => {
    const { user } = await renderLanding();
    // Default panel — the About paragraphs.
    expect(screen.getByText(content.about.aboutTab.paragraphs[0])).toBeInTheDocument();
    expect(screen.queryByText(content.about.whyTab.items[0].text)).not.toBeInTheDocument();

    // Why join → the 5 benefit cards.
    await user.click(screen.getByRole('tab', { name: content.about.whyTab.label }));
    for (const item of content.about.whyTab.items) {
      expect(screen.getByText(item.text)).toBeInTheDocument();
    }

    // Goals → the 4 goals.
    await user.click(screen.getByRole('tab', { name: content.about.goalsTab.label }));
    for (const item of content.about.goalsTab.items) {
      expect(screen.getByText(item.text)).toBeInTheDocument();
    }
  });

  it('Eligibility: the vertical guidelines tabs show the three "who can apply" items by default', async () => {
    await renderLanding();
    const whoTab = content.eligibility.tabs[0];
    const list = screen.getByRole('list', { name: whoTab.heading });
    expect(within(list).getAllByRole('listitem')).toHaveLength(whoTab.items.length);
    whoTab.items.forEach((item) => expect(within(list).getByText(item)).toBeInTheDocument());
    // The sibling guideline tabs are present.
    for (const tab of content.eligibility.tabs) {
      expect(screen.getByRole('tab', { name: tab.label })).toBeInTheDocument();
    }
  });

  it('renders the collaboration timeline as an ordered list of 4 numbered steps', async () => {
    await renderLanding();
    const list = screen.getByRole('list', { name: content.collaboration.sectionLabel });
    expect(within(list).getAllByRole('listitem')).toHaveLength(4);
    for (let i = 0; i < content.collaboration.steps.length; i++) {
      expect(within(list).getByText(String(i + 1).padStart(2, '0'))).toBeInTheDocument();
    }
    content.collaboration.steps.forEach((step) =>
      expect(within(list).getByRole('heading', { name: step.title })).toBeInTheDocument()
    );
  });

  it('renders the closing CTA with its title and both actions', async () => {
    await renderLanding();
    expect(
      screen.getByRole('heading', { level: 2, name: content.finalCta.title })
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: content.finalCta.secondaryCtaLabel })).toHaveAttribute(
      'href',
      expertHubPaths.directory
    );
  });

  it('renders at least one section separator', async () => {
    const { container } = await renderLanding();
    expect(container.querySelectorAll('[role="separator"]').length).toBeGreaterThanOrEqual(1);
  });

  it('toggles locale via the header action', async () => {
    const { user } = await renderLanding();
    await user.click(screen.getByRole('button', { name: 'English' }));
    expect(
      await screen.findByRole('heading', { level: 1, name: getLandingContent('en').hero.title })
    ).toBeInTheDocument();
  });

  it('renders RTL by default (Arabic-first)', async () => {
    await renderLanding();
    expect(document.documentElement).toHaveAttribute('dir', 'rtl');
  });

  it('has no automatically-detectable accessibility violations', async () => {
    const { container } = await renderLanding();
    await expectNoA11yViolations(container);
  });

  describe('icon usage', () => {
    it('every icon is decorative (paired with visible text)', async () => {
      const { container } = await renderLanding();
      const icons = container.querySelectorAll('[data-size][data-tone]');
      expect(icons.length).toBeGreaterThan(0);
      icons.forEach((icon) => {
        expect(icon).toHaveAttribute('aria-hidden', 'true');
        expect(icon).not.toHaveAttribute('role', 'img');
      });
    });

    it('never falls back to the missing-icon glyph', async () => {
      const { container } = await renderLanding();
      expect(container.querySelectorAll('[data-missing="true"]')).toHaveLength(0);
    });
  });
});
