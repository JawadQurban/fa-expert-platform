import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearExpertHubSession,
  expectNoA11yViolations,
  renderExpertHubAt,
  screen,
  seedExpertHubSession,
  within,
} from '../../test/renderExpertHub';
import { expertHubPaths } from '../../app/router/paths';
import type { ApplicationSummaryDto } from './application.types';
import { setApplicationsServiceForTesting } from './applicationsService';
import { createMockApplicationsProvider, MOCK_APPLICATIONS } from './mockApplicationsProvider';
import { getMyApplicationsContent } from './myApplications.content';
import { arNumber } from '../../shared/formatting';

const content = getMyApplicationsContent('ar');

/** Zero-latency provider over a seed — the page's only data source in tests. */
function useSeed(seed: readonly ApplicationSummaryDto[] = MOCK_APPLICATIONS) {
  setApplicationsServiceForTesting(createMockApplicationsProvider({ seed, latencyMs: 0 }));
}

/** A fully decided history (no un-decided application → `BR-0101` allows new). */
const DECIDED_ONLY: readonly ApplicationSummaryDto[] = MOCK_APPLICATIONS.filter((item) =>
  ['approved', 'active', 'rejected', 'closed'].includes(item.status)
);

async function renderPage() {
  seedExpertHubSession(['trainer']);
  const result = renderExpertHubAt(expertHubPaths.applications);
  await screen.findByRole('heading', { level: 1, name: content.title });
  return result;
}

describe('EH-TP-02 — My Applications', () => {
  beforeEach(() => {
    clearExpertHubSession();
    useSeed();
  });

  afterEach(() => {
    setApplicationsServiceForTesting(null);
    vi.unstubAllGlobals();
  });

  it('renders the page title + description and moves focus to the heading on load', async () => {
    await renderPage();
    const heading = screen.getByRole('heading', { level: 1, name: content.title });
    expect(screen.getByText(content.description)).toBeInTheDocument();
    expect(document.activeElement).toBe(heading);
  });

  it('renders the summary cards with counts derived from the documented statuses', async () => {
    await renderPage();
    const summary = await screen.findByRole('list', { name: content.summary.sectionLabel });
    expect(within(summary).getAllByRole('listitem')).toHaveLength(5);
    for (const label of [
      content.summary.total,
      content.summary.draft,
      content.summary.underReview,
      content.summary.approved,
      content.summary.requiresAction,
    ]) {
      expect(within(summary).getByText(label)).toBeInTheDocument();
    }
    // Total = the full mock set, localized digits.
    const expectedTotal = arNumber(MOCK_APPLICATIONS.length);
    expect(within(summary).getByText(expectedTotal)).toBeInTheDocument();
  });

  it('renders the applications list with references, and drafts distinctly without one (BR-0107)', async () => {
    await renderPage();
    const table = await screen.findByRole('table', { name: content.list.caption });
    expect(within(table).getByText('EH-2026-00151')).toBeInTheDocument();
    expect(within(table).getByText(content.list.draftReferenceLabel)).toBeInTheDocument();
    expect(within(table).getByText(content.list.notSubmittedLabel)).toBeInTheDocument();
  });

  it('renders only the trainer presentation statuses (P-05), incl. the neutral updating state', async () => {
    await renderPage();
    const table = await screen.findByRole('table', { name: content.list.caption });
    for (const label of [
      content.statuses['agreement-pending'],
      content.statuses['under-review'],
      content.statuses.updating,
      content.statuses.draft,
    ]) {
      expect(within(table).getByText(label)).toBeInTheDocument();
    }
  });

  it('offers the documented row actions: resume a draft, view details for submitted rows', async () => {
    await renderPage();
    const table = await screen.findByRole('table', { name: content.list.caption });
    const resume = within(table).getByRole('link', { name: content.actions.resumeDraft });
    expect(resume).toHaveAttribute('href', expertHubPaths.applicationsNew);
    const details = within(table).getAllByRole('link', { name: content.actions.viewDetails });
    expect(details.length).toBeGreaterThan(0);
    details.forEach((link) =>
      expect(link.getAttribute('href')).toMatch(/^\/expert-hub\/applications\/app-/)
    );
  });

  it('blocks New Application with an accessible explanation while an application is un-decided (BR-0101)', async () => {
    await renderPage();
    // Default seed contains un-decided applications → blocked.
    const newApplication = await screen.findByRole('button', {
      name: content.actions.newApplication,
    });
    expect(newApplication).toBeDisabled();
    expect(newApplication).toHaveAttribute('aria-describedby', 'eh-new-application-blocked');
    expect(screen.getByText(content.actions.blockedExplanation)).toBeInTheDocument();
    // The inline explanation links to the blocking application.
    expect(
      screen.getByRole('link', { name: content.actions.blockedLinkLabel }).getAttribute('href')
    ).toMatch(/^\/expert-hub\/applications\/app-/);
  });

  it('enables New Application as a link when every application is decided (BR-0101)', async () => {
    useSeed(DECIDED_ONLY);
    await renderPage();
    const newApplication = await screen.findByRole('link', {
      name: content.actions.newApplication,
    });
    expect(newApplication).toHaveAttribute('href', expertHubPaths.applicationsNew);
    expect(screen.queryByText(content.actions.blockedExplanation)).not.toBeInTheDocument();
  });

  it('searches by reference and shows the no-results empty state with a working clear action', async () => {
    const { user } = await renderPage();
    const search = await screen.findByRole('searchbox', { name: content.filters.searchLabel });
    await user.type(search, 'EH-2025-00064');
    const table = await screen.findByRole('table', { name: content.list.caption });
    expect(await within(table).findByText('EH-2025-00064')).toBeInTheDocument();
    expect(within(table).queryByText('EH-2026-00151')).not.toBeInTheDocument();

    await user.clear(search);
    await user.type(search, 'ZZZ-NOMATCH');
    expect(await screen.findByText(content.empty.noResultsTitle)).toBeInTheDocument();
    // Clear appears both in the Filter Bar and in the no-results empty state —
    // either restores the unfiltered list.
    await user.click(screen.getAllByRole('button', { name: content.actions.clearFilters })[0]);
    expect(await screen.findByRole('table', { name: content.list.caption })).toBeInTheDocument();
  });

  it('filters by status through the Filter Bar (P-11)', async () => {
    const { user } = await renderPage();
    await screen.findByRole('table', { name: content.list.caption });
    await user.click(screen.getByRole('combobox', { name: content.filters.statusLabel }));
    await user.click(await screen.findByRole('option', { name: content.statuses.rejected }));
    const table = await screen.findByRole('table', { name: content.list.caption });
    expect(await within(table).findByText('EH-2025-00064')).toBeInTheDocument();
    expect(within(table).queryByText('EH-2026-00151')).not.toBeInTheDocument();
  });

  it('paginates beyond the fixed page size', async () => {
    const { user } = await renderPage();
    const table = await screen.findByRole('table', { name: content.list.caption });
    // 12 mock items / page size 8 → 2 pages; the oldest item sits on page 2.
    expect(within(table).queryByText('EH-2025-00048')).not.toBeInTheDocument();
    const pagination = screen.getByRole('navigation', { name: content.pagination.label });
    await user.click(within(pagination).getByRole('button', { name: content.pagination.next }));
    expect(
      await within(screen.getByRole('table', { name: content.list.caption })).findByText(
        'EH-2025-00048'
      )
    ).toBeInTheDocument();
  });

  it('shows the first-time empty state with exactly one «تقديم طلب جديد» link (P-339)', async () => {
    useSeed([]);
    await renderPage();
    expect(await screen.findByText(content.empty.noApplicationsTitle)).toBeInTheDocument();
    const links = screen.getAllByRole('link', { name: content.actions.newApplication });
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAttribute('href', expertHubPaths.applicationsNew);
  });

  it('shows the approved loading placeholder before data resolves', async () => {
    setApplicationsServiceForTesting(createMockApplicationsProvider({ latencyMs: 150 }));
    seedExpertHubSession(['trainer']);
    renderExpertHubAt(expertHubPaths.applications);
    await screen.findByRole('heading', { level: 1, name: content.title });
    // List region is still loading: the approved Loading placeholder, no table yet.
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.getByRole('status', { name: content.list.caption })).toBeInTheDocument();
    expect(await screen.findByRole('table', { name: content.list.caption })).toBeInTheDocument();
  });

  it('shows an error state with retry on API failure, and retry recovers', async () => {
    setApplicationsServiceForTesting(
      createMockApplicationsProvider({
        latencyMs: 0,
        failWith: { status: 500, message: 'boom' },
      })
    );
    const { user } = await renderPage();
    expect(await screen.findByText(content.errors.loadFailedTitle)).toBeInTheDocument();
    // Backend recovers → retry reloads the list.
    useSeed();
    await user.click(screen.getByRole('button', { name: content.actions.retry }));
    expect(await screen.findByRole('table', { name: content.list.caption })).toBeInTheDocument();
  });

  it('maps 401/403 to session-expired / unauthorized error copy', async () => {
    setApplicationsServiceForTesting(
      createMockApplicationsProvider({ latencyMs: 0, failWith: { status: 401, message: '' } })
    );
    const first = await renderPage();
    expect(await screen.findByText(content.errors.sessionExpiredTitle)).toBeInTheDocument();
    first.unmount();

    setApplicationsServiceForTesting(
      createMockApplicationsProvider({ latencyMs: 0, failWith: { status: 403, message: '' } })
    );
    await renderPage();
    expect(await screen.findByText(content.errors.unauthorizedTitle)).toBeInTheDocument();
  });

  it('stacks the list into cards on small viewports (no table)', async () => {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: query.includes('47.98'),
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }));
    await renderPage();
    expect(await screen.findByRole('list', { name: content.list.caption })).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    // Cards still show reference + status prominently.
    expect(screen.getByText('EH-2026-00151')).toBeInTheDocument();
  });

  it('renders RTL by default (Arabic-first)', async () => {
    await renderPage();
    expect(document.documentElement).toHaveAttribute('dir', 'rtl');
  });

  it('has no automatically-detectable accessibility violations', async () => {
    const { container } = await renderPage();
    await screen.findByRole('table', { name: content.list.caption });
    await expectNoA11yViolations(container);
  });
});
