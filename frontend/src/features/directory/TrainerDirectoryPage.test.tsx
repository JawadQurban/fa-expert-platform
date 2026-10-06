import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  clearExpertHubSession,
  expectNoA11yViolations,
  renderExpertHubAt,
  screen,
  within,
} from '../../test/renderExpertHub';
import { expertHubPaths } from '../../app/router/paths';
import type { ExpertHubApiClient } from '../../shared/services/apiClient';
import type { DirectoryListDto } from './directory.types';
import { createHttpDirectoryProvider, setDirectoryServiceForTesting } from './directoryService';
import { createMockDirectoryProvider } from './mockDirectoryProvider';
import type { MockDirectoryProviderOptions } from './mockDirectoryProvider';
import { getDirectoryContent } from './directory.content';

const content = getDirectoryContent('ar');

function injectDirectory(options: MockDirectoryProviderOptions = {}) {
  setDirectoryServiceForTesting(createMockDirectoryProvider({ latencyMs: 0, ...options }));
}

/** Render the public directory route and await its H1. */
async function renderDirectory() {
  const result = renderExpertHubAt(expertHubPaths.directory);
  await screen.findByRole('heading', { level: 1, name: content.title });
  return result;
}

describe('EH-PUB-02 — Trainer Directory', () => {
  beforeEach(() => {
    clearExpertHubSession(); // public: no session required
    injectDirectory();
  });

  afterEach(() => {
    setDirectoryServiceForTesting(null);
  });

  it('renders the title + description and lists consented trainers, hiding non-consented ones', async () => {
    await renderDirectory();
    expect(screen.getByText(content.description)).toBeInTheDocument();
    // A consented trainer appears…
    expect(await screen.findByText('د. سارة العتيبي')).toBeInTheDocument();
    // …and a non-consented one is never exposed (BR-1002 / privacy).
    expect(screen.queryByText('خبير بدون موافقة على الظهور')).not.toBeInTheDocument();
    expect(screen.queryByText('خبير سحب موافقة الظهور')).not.toBeInTheDocument();
  });

  // J-24/F2/AC-1 is exhaustive and its open item removes public evaluation
  // display entirely — the result cards carry identity + specialization only.
  it('publishes no evaluation on the result cards', async () => {
    await renderDirectory();
    await screen.findByText('د. سارة العتيبي');
    expect(screen.queryByRole('img', { name: /من 5/ })).not.toBeInTheDocument();
    expect(screen.queryByText(/تقييمًا/)).not.toBeInTheDocument();
  });

  it('exposes each result as a discernible link to its public profile', async () => {
    await renderDirectory();
    const link = await screen.findByRole('link', { name: 'د. سارة العتيبي' });
    expect(link).toHaveAttribute('href', expertHubPaths.directoryProfile('trn-001'));
  });

  it('shows a results count and the derived hero highlight stats', async () => {
    await renderDirectory();
    // 18 consented, page size 9 → "showing 9 of 18" (Arabic numerals).
    expect(await screen.findByText(content.resultsCount(9, 18))).toBeInTheDocument();
    // Hero stat labels render (derived counts, not invented metrics).
    expect(screen.getByText(content.stats.experts)).toBeInTheDocument();
    expect(screen.getByText(content.stats.specialties)).toBeInTheDocument();
    expect(screen.getByText(content.stats.programs)).toBeInTheDocument();
  });

  it('searches by name and narrows the grid', async () => {
    const { user } = await renderDirectory();
    const search = await screen.findByRole('searchbox', { name: content.filters.searchLabel });
    await user.type(search, 'سارة');
    expect(await screen.findByText('د. سارة العتيبي')).toBeInTheDocument();
    expect(screen.queryByText('أ. خالد المطيري')).not.toBeInTheDocument();
  });

  it('offers no specialty chip rail, and never sends a specialty to the API (Q16)', async () => {
    // Through the real HTTP provider, so what is asserted is the request itself.
    const paths: string[] = [];
    const emptyPage: DirectoryListDto = {
      items: [],
      totalCount: 0,
      page: 1,
      pageSize: 9,
      pageCount: 1,
      totalConsented: 0,
      specialtiesRepresented: 0,
      programsDelivered: 0,
    };
    const client: ExpertHubApiClient = {
      get: <T,>(path: string) => {
        paths.push(path);
        return Promise.resolve({ ok: true as const, value: emptyPage as T });
      },
      post: () => Promise.reject(new Error('No POST expected.')),
    };
    setDirectoryServiceForTesting(createHttpDirectoryProvider(client));
    const { user } = await renderDirectory();

    // No taxonomy maps a trainer onto a specialty: every chip answered «nobody»,
    // and the API now refuses the filter with 400 — so none is offered.
    expect(screen.queryByRole('group', { name: /التخصص/ })).not.toBeInTheDocument();
    for (const label of Object.values(content.specialties)) {
      expect(screen.queryByRole('button', { name: label })).not.toBeInTheDocument();
    }

    await user.type(screen.getByRole('searchbox', { name: content.filters.searchLabel }), 'سارة');
    expect(paths.length).toBeGreaterThan(1);
    for (const path of paths) {
      expect(new URLSearchParams(path.split('?')[1]).has('specialty')).toBe(false);
    }
    expect([...new URLSearchParams(paths[paths.length - 1].split('?')[1]).keys()].sort()).toEqual([
      'page',
      'pageSize',
      'search',
    ]);
  });

  it('shows the empty state with a working clear-filters action', async () => {
    const { user } = await renderDirectory();
    const search = await screen.findByRole('searchbox', { name: content.filters.searchLabel });
    await user.type(search, 'لا-يوجد-مطابق-إطلاقًا');
    expect(await screen.findByText(content.empty.title)).toBeInTheDocument();
    // "Clear" appears in both the Filter Bar and the empty state — either resets.
    await user.click(screen.getAllByRole('button', { name: content.filters.clear })[0]);
    expect(await screen.findByText('د. سارة العتيبي')).toBeInTheDocument();
  });

  it('paginates beyond the fixed page size', async () => {
    const { user } = await renderDirectory();
    // 18 consented / page size 9 → 2 pages; the 10th trainer (trn-010) sits on page 2.
    expect(screen.queryByText('أ. طلال العنزي')).not.toBeInTheDocument();
    const pagination = screen.getByRole('navigation', { name: content.pagination.label });
    await user.click(within(pagination).getByRole('button', { name: content.pagination.next }));
    expect(await screen.findByText('أ. طلال العنزي')).toBeInTheDocument();
  });

  it('shows an error state with retry on load failure, and recovers', async () => {
    injectDirectory({ failWith: { status: 500, message: 'boom' } });
    const { user } = renderExpertHubAt(expertHubPaths.directory);
    expect(await screen.findByText(content.errors.loadTitle)).toBeInTheDocument();
    injectDirectory();
    await user.click(screen.getByRole('button', { name: content.errors.retry }));
    expect(await screen.findByText('د. سارة العتيبي')).toBeInTheDocument();
  });

  it('switches language across the directory', async () => {
    const { user } = await renderDirectory();
    await user.click(screen.getByRole('button', { name: 'English' }));
    expect(
      await screen.findByRole('heading', { level: 1, name: getDirectoryContent('en').title })
    ).toBeInTheDocument();
  });

  it('renders RTL by default', async () => {
    await renderDirectory();
    expect(document.documentElement).toHaveAttribute('dir', 'rtl');
  });

  it('has no automatically-detectable accessibility violations', async () => {
    const { container } = await renderDirectory();
    await screen.findByText('د. سارة العتيبي');
    await expectNoA11yViolations(container);
  });
});
