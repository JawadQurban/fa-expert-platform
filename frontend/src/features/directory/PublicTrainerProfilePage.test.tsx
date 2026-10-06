import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  clearExpertHubSession,
  expectNoA11yViolations,
  renderExpertHubAt,
  screen,
  within,
} from '../../test/renderExpertHub';
import { expertHubPaths } from '../../app/router/paths';
import { setDirectoryServiceForTesting } from './directoryService';
import { createMockDirectoryProvider } from './mockDirectoryProvider';
import type { MockDirectoryProviderOptions } from './mockDirectoryProvider';
import { getPublicProfileContent, getTrainerClassificationLabels } from './directory.content';

const content = getPublicProfileContent('ar');

function injectDirectory(options: MockDirectoryProviderOptions = {}) {
  setDirectoryServiceForTesting(createMockDirectoryProvider({ latencyMs: 0, ...options }));
}

function renderProfile(id: string) {
  return renderExpertHubAt(expertHubPaths.directoryProfile(id));
}

describe('EH-PUB-03 — Public Trainer Profile', () => {
  beforeEach(() => {
    clearExpertHubSession(); // public: no session required
    injectDirectory();
  });

  afterEach(() => {
    setDirectoryServiceForTesting(null);
  });

  it('renders exactly the J-24 public fields — name H1, specializations, delivered programs', async () => {
    renderProfile('trn-001');
    // Profile name is the H1 (`05` EH-PUB-03 §18).
    expect(
      await screen.findByRole('heading', { level: 1, name: 'د. سارة العتيبي' })
    ).toBeInTheDocument();
    expect(screen.getAllByText(content.specialties.leadership).length).toBeGreaterThan(0);
    // J-24/F2/AC-1 — programs delivered with the Academy.
    const programs = screen.getByRole('region', { name: content.programs.heading });
    expect(within(programs).getAllByRole('listitem').length).toBeGreaterThan(0);
    // Breadcrumb links back to the directory.
    const nav = screen.getByRole('navigation', { name: content.breadcrumbLabel });
    expect(within(nav).getByRole('link', { name: content.breadcrumbDirectory })).toHaveAttribute(
      'href',
      expertHubPaths.directory
    );
  });

  // J-24/F2/AC-1 is an EXHAUSTIVE enumeration ("no financial or sensitive
  // personal data"). This is the regression guard for the fields removed on
  // 2026-08-19 — `DECISIONS.md` P-40/P-41.
  it('publishes nothing outside the J-24 enumeration (no rating, classification, or bio)', async () => {
    renderProfile('trn-001');
    await screen.findByRole('heading', { level: 1, name: 'د. سارة العتيبي' });
    // No star rating anywhere — the DS `Rating` renders role="img".
    expect(screen.queryByRole('img', { name: /من 5/ })).not.toBeInTheDocument();
    // The classification vocabulary is trainer-private; none of it is on the page.
    const classifications = getTrainerClassificationLabels('ar');
    for (const label of Object.values(classifications)) {
      expect(screen.queryByText(label)).not.toBeInTheDocument();
    }
    // The former free-text bio (`BR-1004` corrected: no such field exists).
    expect(screen.queryByText(/خبيرة معتمدة في القيادة التنفيذية/)).not.toBeInTheDocument();
  });

  it('P-331: shows the approved short bio when the trainer has one', async () => {
    const mock = createMockDirectoryProvider({ latencyMs: 0 });
    setDirectoryServiceForTesting({
      ...mock,
      getPublicTrainer: async (id) => {
        const result = await mock.getPublicTrainer(id);
        return result.ok
          ? { ok: true, value: { ...result.value, bio: 'مدربة معتمدة في القيادة.' } }
          : result;
      },
    });
    renderProfile('trn-001');
    const bio = await screen.findByRole('region', { name: content.bioHeading });
    expect(within(bio).getByText('مدربة معتمدة في القيادة.')).toBeInTheDocument();
  });

  it('resolves a NON-consented trainer to the neutral not-available state (privacy, BR-1007)', async () => {
    renderProfile('trn-101'); // a real id, but consent = false
    expect(await screen.findByText(content.notFound.title)).toBeInTheDocument();
    expect(screen.getByText(content.notFound.body)).toBeInTheDocument();
    // The withheld trainer's real name is never revealed.
    expect(screen.queryByText('خبير بدون موافقة على الظهور')).not.toBeInTheDocument();
    // No retry — a hidden/absent profile is definitive, not a transport error.
    expect(screen.queryByRole('button', { name: content.errors.retry })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: content.backToDirectory })).toHaveAttribute(
      'href',
      expertHubPaths.directory
    );
  });

  it('resolves an UNKNOWN id to the SAME neutral not-available state (indistinguishable)', async () => {
    renderProfile('does-not-exist');
    expect(await screen.findByText(content.notFound.title)).toBeInTheDocument();
    // Identical copy to the withheld-consent case — a caller cannot tell them apart.
    expect(screen.getByText(content.notFound.body)).toBeInTheDocument();
  });

  it('shows a retryable error state on a transport failure (not a 404)', async () => {
    injectDirectory({ failWith: { status: 500, message: 'boom' } });
    const { user } = renderProfile('trn-001');
    expect(await screen.findByText(content.errors.loadTitle)).toBeInTheDocument();
    injectDirectory();
    await user.click(screen.getByRole('button', { name: content.errors.retry }));
    expect(
      await screen.findByRole('heading', { level: 1, name: 'د. سارة العتيبي' })
    ).toBeInTheDocument();
  });

  it('switches language across the profile', async () => {
    const { user } = renderProfile('trn-001');
    await screen.findByRole('heading', { level: 1, name: 'د. سارة العتيبي' });
    await user.click(screen.getByRole('button', { name: 'English' }));
    // Name is authored content (unchanged); the chrome switches to English.
    expect(
      await screen.findByRole('heading', {
        name: getPublicProfileContent('en').programs.heading,
      })
    ).toBeInTheDocument();
  });

  it('renders RTL by default', async () => {
    renderProfile('trn-001');
    await screen.findByRole('heading', { level: 1, name: 'د. سارة العتيبي' });
    expect(document.documentElement).toHaveAttribute('dir', 'rtl');
  });

  it('has no automatically-detectable accessibility violations', async () => {
    const { container } = renderProfile('trn-001');
    await screen.findByRole('heading', { level: 1, name: 'د. سارة العتيبي' });
    await expectNoA11yViolations(container);
  });
});
