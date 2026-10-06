import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  clearExpertHubSession,
  expectNoA11yViolations,
  renderExpertHubAt,
  screen,
  seedExpertHubSession,
  userEvent,
  within,
} from '../../test/renderExpertHub';
import { expertHubPaths } from '../../app/router/paths';
import { setInternalServiceForTesting } from './internalService';
import { createMockInternalProvider } from './mockInternalProvider';
import type { MockInternalProviderOptions } from './mockInternalProvider';
import { getInternalContent } from './internal.content';

const content = getInternalContent('ar');
const inbox = content.inbox;

function injectProvider(options: MockInternalProviderOptions = {}) {
  setInternalServiceForTesting(createMockInternalProvider({ latencyMs: 0, ...options }));
}

async function renderInbox(path: string = expertHubPaths.internalApplications) {
  seedExpertHubSession(['internal']);
  const result = renderExpertHubAt(path);
  await screen.findByRole('heading', { level: 1, name: inbox.title });
  return result;
}

describe('EH-INT-02 — Application Inbox', () => {
  beforeEach(() => {
    clearExpertHubSession();
    injectProvider();
  });

  afterEach(() => {
    setInternalServiceForTesting(null);
  });

  it('states what the list is narrowed BY, and removes one filter at a time', async () => {
    /*
      A Select sitting on «قيد المراجعة» reads much like one sitting on «الكل».
      The chips say the narrowing in words — which is the difference between
      "the applications are missing" and "the applications are filtered" — and
      each one is removable on its own, not only all-at-once via "clear".
    */
    const { user } = await renderInbox(
      `${expertHubPaths.internalApplications}?status=under-review`
    );

    const chipLabel = content.statuses['under-review'];
    expect(await screen.findByText(inbox.filters.activeHeading)).toBeInTheDocument();

    const remove = screen.getByRole('button', {
      name: inbox.filters.removeFilter(inbox.filters.statusLabel, chipLabel),
    });
    await user.click(remove);

    // Removing the chip widens the list back out — the filter is really gone,
    // not just hidden: a status this filter excluded is present again.
    expect(await screen.findByText('د. سارة العتيبي')).toBeInTheDocument();
    expect(screen.queryByText(inbox.filters.activeHeading)).not.toBeInTheDocument();
  });

  it('renders the incoming applications with applicant identity + status', async () => {
    await renderInbox();
    const table = await screen.findByRole('table', { name: inbox.list.caption });
    expect(within(table).getByText('د. سارة العتيبي')).toBeInTheDocument();
    expect(within(table).getByText('EH-2026-00212')).toBeInTheDocument();
  });

  it('filters by status through the Filter Bar (P-11)', async () => {
    const { user } = await renderInbox();
    await user.click(screen.getByRole('combobox', { name: inbox.filters.statusLabel }));
    await user.click(await screen.findByRole('option', { name: content.statuses.approved }));
    const table = await screen.findByRole('table', { name: inbox.list.caption });
    // Only the approved applicant remains.
    expect(within(table).getByText('أ. طلال العنزي')).toBeInTheDocument();
    expect(within(table).queryByText('د. سارة العتيبي')).not.toBeInTheDocument();
  });

  it('seeds the status filter from the ?status= deep link (dashboard drill-in)', async () => {
    await renderInbox(`${expertHubPaths.internalApplications}?status=approved`);
    const table = await screen.findByRole('table', { name: inbox.list.caption });
    expect(within(table).getByText('أ. طلال العنزي')).toBeInTheDocument();
    expect(within(table).queryByText('د. سارة العتيبي')).not.toBeInTheDocument();
  });

  it('searches by applicant name and narrows the list', async () => {
    const { user } = await renderInbox();
    const search = await screen.findByRole('searchbox', { name: inbox.filters.searchLabel });
    await user.type(search, 'خالد');
    const table = await screen.findByRole('table', { name: inbox.list.caption });
    expect(within(table).getByText('أ. خالد المطيري')).toBeInTheDocument();
    expect(within(table).queryByText('د. سارة العتيبي')).not.toBeInTheDocument();
  });

  it('shows the no-results empty state with a working clear action', async () => {
    const { user } = await renderInbox();
    const search = await screen.findByRole('searchbox', { name: inbox.filters.searchLabel });
    await user.type(search, 'لا-يوجد-إطلاقًا');
    expect(await screen.findByText(inbox.noResults.title)).toBeInTheDocument();
    await user.click(screen.getAllByRole('button', { name: inbox.filters.clear })[0]);
    expect(await screen.findByText('د. سارة العتيبي')).toBeInTheDocument();
  });

  it('J-02: offers NO nominate action (it filed under the staff member’s own identity), and opens a row for screening', async () => {
    await renderInbox();
    await screen.findByRole('table', { name: inbox.list.caption });
    expect(screen.queryByRole('link', { name: /ترشيح/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /ترشيح/ })).not.toBeInTheDocument();
    expect(
      screen
        .queryAllByRole('link')
        .some((link) => link.getAttribute('href') === expertHubPaths.applicationsNew)
    ).toBe(false);
    const openLinks = screen.getAllByRole('link', { name: inbox.list.open });
    expect(openLinks[0].getAttribute('href')).toContain(`${expertHubPaths.internal}/applications/`);
  });

  it('paginates beyond the fixed page size', async () => {
    const { user } = await renderInbox();
    await screen.findByRole('table', { name: inbox.list.caption });
    // 14 applications / page size 10 → 2 pages; app-3014 sits on page 2.
    expect(screen.queryByText('أ. راكان الحارثي')).not.toBeInTheDocument();
    const pagination = screen.getByRole('navigation', { name: inbox.pagination.label });
    await user.click(within(pagination).getByRole('button', { name: inbox.pagination.next }));
    expect(await screen.findByText('أ. راكان الحارثي')).toBeInTheDocument();
  });

  it('shows an error state with retry on load failure, and recovers', async () => {
    injectProvider({ failWith: { status: 500, message: 'boom' } });
    seedExpertHubSession(['internal']);
    const { user } = { user: userEvent.setup() };
    renderExpertHubAt(expertHubPaths.internalApplications);
    expect(await screen.findByText(inbox.errors.loadTitle)).toBeInTheDocument();
    injectProvider();
    await user.click(screen.getByRole('button', { name: inbox.errors.retry }));
    expect(await screen.findByRole('heading', { level: 1, name: inbox.title })).toBeInTheDocument();
  });

  it('switches language across the inbox', async () => {
    const { user } = await renderInbox();
    await user.click(screen.getByRole('button', { name: 'English' }));
    expect(
      await screen.findByRole('heading', { level: 1, name: getInternalContent('en').inbox.title })
    ).toBeInTheDocument();
  });

  it('renders RTL by default', async () => {
    await renderInbox();
    expect(document.documentElement).toHaveAttribute('dir', 'rtl');
  });

  it('has no automatically-detectable accessibility violations', async () => {
    const { container } = await renderInbox();
    await screen.findByRole('table', { name: inbox.list.caption });
    await expectNoA11yViolations(container);
  });
});
