import { describe, expect, it } from 'vitest';
import { EXPERT_HUB_BASE_PATH } from '../../app/config/expertHubConfig';
import { expertHubPaths, expertHubRouteSegments } from '../../app/router/paths';
import { getHeaderContent } from './header.content';
import { getExpertHubFooterContent } from './footer.content';

/**
 * **Every navigation target must resolve to a route that exists.**
 *
 * This test exists because it did not. Three of the public header's five tabs —
 * *About*, *Services*, *FAQ* — pointed at `/about`, `/services` and `/faq`, which
 * were registered nowhere and fell through to the catch-all NotFound. So did the
 * search affordance. They had been dead since the header was built, and nothing
 * in the suite noticed, because every test asserted that a link's `href` matched
 * its content entry — which it did. Both were wrong together.
 *
 * The fix is to check nav targets against the **router**, not against the copy
 * that produced them: a tab that goes nowhere now fails the build.
 */

/** Base-relative segments that name a concrete, linkable page. */
function staticRoutePaths(): ReadonlySet<string> {
  const base = EXPERT_HUB_BASE_PATH;
  const paths = new Set<string>([expertHubPaths.landing]);
  for (const segment of Object.values(expertHubRouteSegments)) {
    // `:param` routes need an id to link to, and `*` is the catch-all — neither
    // is something static navigation should point at.
    if (segment.includes(':') || segment.includes('*')) {
      continue;
    }
    paths.add(`${base}/${segment}`.replace(/\/{2,}/g, '/').replace(/\/$/, '') || '/');
  }
  return paths;
}

/** Every in-product link the two chrome components render. */
function inProductLinks(): ReadonlyArray<{ where: string; label: string; href: string }> {
  const links: { where: string; label: string; href: string }[] = [];
  for (const locale of ['ar', 'en'] as const) {
    const header = getHeaderContent(locale);
    const footer = getExpertHubFooterContent(locale);
    const groups = [
      ['header.publicNav', header.publicNav],
      ['header.portalNav', header.portalNav],
      ['header.internalNav', header.internalNav],
      // The footer's other groups (important links, social, policy) are all
      // fa.gov.sa URLs and are filtered out below with the rest of the externals.
      ['footer.summaryLinks', footer.summaryLinks],
      ['footer.importantLinks', footer.importantLinks],
      ['footer.policyLinks', footer.policyLinks],
    ] as const;
    for (const [where, group] of groups) {
      for (const link of group) {
        if (link.external === true || /^https?:|^mailto:|^tel:/.test(link.href)) {
          continue;
        }
        links.push({ where: `${where} (${locale})`, label: link.label, href: link.href });
      }
    }
  }
  return links;
}

describe('navigation targets', () => {
  it('every header and footer link resolves to a registered route', () => {
    const routes = staticRoutePaths();
    const dead = inProductLinks()
      // A hash is an anchor into the page the path names — check the path.
      .filter(({ href }) => !routes.has(href.split('#')[0]))
      .map(({ where, label, href }) => `${where} → "${label}" → ${href}`);
    expect(dead).toEqual([]);
  });

  it('every link stays inside the Expert Hub namespace', () => {
    const stray = inProductLinks()
      .filter(({ href }) => !href.startsWith(EXPERT_HUB_BASE_PATH))
      .map(({ where, href }) => `${where} → ${href}`);
    expect(stray).toEqual([]);
  });

  it('public navigation carries pages, not sections of one', () => {
    // About and Services are landing-page sections, and `home` reaches the
    // landing page from every screen — so a tab for each is a second, weaker
    // route to content that already has one (P-123).
    const ids = getHeaderContent('ar').publicNav.map((link) => link.id);
    expect(ids).toEqual(['home', 'directory']);
    expect(getExpertHubFooterContent('ar').summaryLinks.map((link) => link.id)).toEqual([
      'home',
      'directory',
    ]);
  });

  it('nothing that was never a page survives in the path registry', () => {
    // Keeping an entry around is what let the header point at it for months —
    // the four dead routes, and then the two landing anchors that replaced them.
    for (const removed of [
      'about',
      'services',
      'faq',
      'search',
      'landingAbout',
      'landingServices',
    ]) {
      expect(Object.keys(expertHubPaths)).not.toContain(removed);
    }
  });

  /* ── the internal nav reaches everything staff can actually do ─────────── */

  it('the internal navigation reaches every built internal area', () => {
    const hrefs = getHeaderContent('ar').internalNav.map((link) => link.href);
    // Four of these had no navigation at all: staff had to type the URL (P-121).
    for (const target of [
      expertHubPaths.internal,
      expertHubPaths.internalApplications,
      expertHubPaths.internalServiceRequests,
      expertHubPaths.internalAssignments,
      expertHubPaths.internalTrainers,
      expertHubPaths.internalAgreements,
      expertHubPaths.internalSubmissions,
      expertHubPaths.internalEntitlements,
      // CAP-08 is one administrative area behind one entry: the matrix and the
      // user–role screen cross-link, so only the area's entry point is here.
      expertHubPaths.internalAccessPermissions,
      // CAP-07's four screens likewise share one entry point (P-141's shape).
      expertHubPaths.internalNotificationMatrix,
    ]) {
      expect(hrefs).toContain(target);
    }
  });

  it('the two locales expose the same navigation, item for item', () => {
    // A tab that exists in Arabic and not in English is a tab someone forgot.
    for (const group of ['publicNav', 'portalNav', 'internalNav'] as const) {
      expect(getHeaderContent('en')[group].map((link) => link.id)).toEqual(
        getHeaderContent('ar')[group].map((link) => link.id)
      );
    }
    expect(getExpertHubFooterContent('en').summaryLinks.map((link) => link.id)).toEqual(
      getExpertHubFooterContent('ar').summaryLinks.map((link) => link.id)
    );
  });
});
