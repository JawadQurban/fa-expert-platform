import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  clearExpertHubSession,
  expectNoA11yViolations,
  renderExpertHubAt,
  screen,
  seedExpertHubSession,
  within,
} from '../../test/renderExpertHub';
import { expertHubPaths } from '../../app/router/paths';
import { getProfileContent } from '../profile/profile.content';
import type { ExpertHubApiClient } from '../../shared/services/apiClient';
import {
  createHttpTrainerSearchProvider,
  setTrainerSearchServiceForTesting,
} from './trainerSearchService';
import { createMockTrainerSearchProvider } from './mockTrainerSearchProvider';
import type { MockTrainerSearchProviderOptions } from './mockTrainerSearchProvider';
import { getTrainerSearchContent } from './trainerSearch.content';
import { arNumber } from '../../shared/formatting';

const content = getTrainerSearchContent('ar');

function injectProvider(options: MockTrainerSearchProviderOptions = {}) {
  setTrainerSearchServiceForTesting(createMockTrainerSearchProvider({ latencyMs: 0, ...options }));
}

async function renderSearch() {
  seedExpertHubSession(['internal']);
  const result = renderExpertHubAt(expertHubPaths.internalTrainers);
  await screen.findByRole('heading', { level: 1, name: content.title });
  return result;
}

function renderTrainer(id: string) {
  seedExpertHubSession(['internal']);
  return renderExpertHubAt(expertHubPaths.internalTrainer(id));
}

/**
 * ⚠️ Seeded trainers (see `mockTrainerSearchProvider`):
 *   trn-001  سارة   active   · 4.5 · 4 certs · 14y
 *   trn-002  خالد   idle     · 4.0 · 2 certs ·  9y
 *   trn-003  نورة   expired  · not evaluated · 1 cert · 6y
 *   trn-004  ريم    suspended· 3.5 · 3 certs · 11y
 */
const ACTIVE = 'trn-001';
const IDLE = 'trn-002';
const UNRATED = 'trn-003';

describe('EH-INT-07/08 — Trainer Search & Unified Profile (J-15)', () => {
  beforeEach(() => {
    clearExpertHubSession();
    injectProvider();
  });

  afterEach(() => {
    setTrainerSearchServiceForTesting(null);
  });

  /* ── F1/AC-2 — file status is internal, and internal is HERE ───────────── */

  it('J-15/F1/AC-2: shows the file status staff need — the same one J-13/AC-10 hides from the trainer', async () => {
    await renderSearch();
    const table = await screen.findByRole('table', { name: content.resultsLabel });
    expect(within(table).getByText(content.fileStatuses.active)).toBeInTheDocument();
    expect(within(table).getByText(content.fileStatuses.idle)).toBeInTheDocument();
    expect(within(table).getByText(content.fileStatuses.suspended)).toBeInTheDocument();
    expect(within(table).getByText(content.fileStatuses.expired)).toBeInTheDocument();
  });

  it('the trainer’s OWN profile still shows none of it (P-48 holds)', () => {
    // The internal vocabulary must not have leaked into EH-TP-04 while adding it here.
    const profileContent = getProfileContent('ar');
    expect(Object.keys(profileContent)).not.toContain('fileStatuses');
  });

  it('J-13: “no recent engagements” is presented as monitoring, not a restriction', async () => {
    await renderSearch();
    expect(await screen.findByText(content.idleNote)).toBeInTheDocument();
  });

  /* ── F1/AC-3 — the filters ─────────────────────────────────────────────── */

  it('J-15/F1/AC-3: filters by file status', async () => {
    const { user } = await renderSearch();
    await user.click(screen.getByRole('combobox', { name: content.filters.fileStatusLabel }));
    await user.click(await screen.findByRole('option', { name: content.fileStatuses.suspended }));
    const table = await screen.findByRole('table', { name: content.resultsLabel });
    expect(within(table).getByText('أ. ريم القحطاني')).toBeInTheDocument();
    expect(within(table).queryByText('د. سارة العتيبي')).not.toBeInTheDocument();
  });

  it('states what the database is narrowed BY, and drops one dimension without resetting the rest', async () => {
    const { user } = await renderSearch();

    // Two of the four dimensions at once — the case the chip row exists for.
    await user.click(screen.getByRole('combobox', { name: content.filters.fileStatusLabel }));
    await user.click(await screen.findByRole('option', { name: content.fileStatuses.suspended }));
    await user.type(
      screen.getByLabelText(content.filters.minCertificationsLabel, { exact: false }),
      '3'
    );

    const certsValue = content.filters.atLeast(arNumber(3));
    expect(
      await screen.findByRole('button', {
        name: content.filters.removeFilter(
          content.filters.fileStatusLabel,
          content.fileStatuses.suspended
        ),
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: content.filters.removeFilter(content.filters.minCertificationsLabel, certsValue),
      })
    ).toBeInTheDocument();

    // Dropping the status must leave the certification floor standing — the
    // whole point of per-chip removal over a single "clear all".
    await user.click(
      screen.getByRole('button', {
        name: content.filters.removeFilter(
          content.filters.fileStatusLabel,
          content.fileStatuses.suspended
        ),
      })
    );
    expect(
      screen.queryByRole('button', {
        name: content.filters.removeFilter(
          content.filters.fileStatusLabel,
          content.fileStatuses.suspended
        ),
      })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: content.filters.removeFilter(content.filters.minCertificationsLabel, certsValue),
      })
    ).toBeInTheDocument();

    // ريم (3 certs) stays; خالد (2 certs) is still held out by the floor.
    const table = await screen.findByRole('table', { name: content.resultsLabel });
    expect(within(table).getByText('أ. ريم القحطاني')).toBeInTheDocument();
    expect(within(table).queryByText('أ. خالد الدوسري')).not.toBeInTheDocument();
  });

  it('J-15/F1/AC-3: filters by a minimum number of certifications', async () => {
    const { user } = await renderSearch();
    await user.type(
      screen.getByLabelText(content.filters.minCertificationsLabel, { exact: false }),
      '4'
    );
    const table = await screen.findByRole('table', { name: content.resultsLabel });
    expect(within(table).getAllByRole('row')).toHaveLength(2); // header + سارة
  });

  it('offers no minimum-years filter and shows unknown years as «—», never as 0', async () => {
    await renderSearch();
    // No numeric years source exists (the form's experience answers are
    // ranges), so the filter that matched nobody is gone rather than broken.
    expect(screen.queryByLabelText(/الحد الأدنى لسنوات الخبرة/)).not.toBeInTheDocument();
    expect(
      screen.getByLabelText(content.filters.minCertificationsLabel, { exact: false })
    ).toBeInTheDocument();
    expect(content.yearsValue(null)).toBe('—');
    expect(screen.queryByText(content.yearsValue(0))).not.toBeInTheDocument();
  });

  it('offers no specialty, domain or minimum-evaluation filter, and still shows an un-rated trainer', async () => {
    await renderSearch();
    // No specialty/domain taxonomy (`Q16`) and no calculated rating
    // (`DM-GAP-14`): each filter could only answer wrongly, and the API refuses
    // it with 400 — so no control offers it.
    expect(
      screen.queryByRole('combobox', { name: /مجال التخصص|^المجال$/ })
    ).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/الحد الأدنى للتقييم/)).not.toBeInTheDocument();
    // What remains: service + file status, and the certification floor.
    expect(screen.getAllByRole('combobox')).toHaveLength(2);
    expect(screen.getAllByRole('spinbutton')).toHaveLength(1);
    // The evaluation is still displayed — only the filter went.
    const table = await screen.findByRole('table', { name: content.resultsLabel });
    expect(within(table).getByText(content.notEvaluated)).toBeInTheDocument();
  });

  it('sends only the filters the API answers — never specialty, domain or minEvaluation', async () => {
    const paths: string[] = [];
    const client: ExpertHubApiClient = {
      get: <T,>(path: string) => {
        paths.push(path);
        return Promise.resolve({ ok: true as const, value: { items: [], totalCount: 0 } as T });
      },
      post: () => Promise.reject(new Error('No POST expected.')),
    };
    await createHttpTrainerSearchProvider(client).searchTrainers({
      search: 'سارة',
      service: 'trainer',
      fileStatus: 'active',
      minCertifications: 2,
      // A stale state object still carrying the removed keys must not leak them.
      ...({ specialty: 'finance', domain: 'finance', minEvaluation: 4 } as object),
    });
    const params = new URLSearchParams(paths[0].split('?')[1]);
    expect([...params.keys()].sort()).toEqual([
      'fileStatus',
      'minCertifications',
      'search',
      'service',
    ]);
  });

  /* ── J-15 scope — oversight, not candidate selection ───────────────────── */

  it('J-15 scope: offers no shortlist/nominate action — sourcing is J-17', async () => {
    await renderSearch();
    expect(screen.getByText(content.scopeNote)).toBeInTheDocument();
    const buttons = screen.getAllByRole('button').map((b) => b.textContent ?? '');
    for (const word of [/ترشيح/, /إسناد/, /قائمة مختصرة/]) {
      expect(buttons.some((label) => word.test(label))).toBe(false);
    }
  });

  /* ── F1/AC-1 — the unified profile ─────────────────────────────────────── */

  it('J-15/F1/AC-1: shows everything the AC enumerates, in one screen', async () => {
    renderTrainer(ACTIVE);
    await screen.findByRole('heading', { level: 1, name: 'د. سارة العتيبي' });
    // Personal data · record with the Academy · evaluation · agreement · status.
    expect(screen.getByText(content.profile.personalHeading)).toBeInTheDocument();
    expect(screen.getByText(content.profile.recordHeading)).toBeInTheDocument();
    expect(screen.getByText(content.profile.evaluationHeading)).toBeInTheDocument();
    expect(screen.getByText(content.profile.agreementHeading)).toBeInTheDocument();
    expect(screen.getByText(content.fileStatuses.active)).toBeInTheDocument();
    // "One screen" — not tabbed away.
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
  });

  it('J-15/F1/AC-1: the evaluation carries its last sync date', async () => {
    renderTrainer(ACTIVE);
    await screen.findByRole('heading', { level: 1, name: 'د. سارة العتيبي' });
    expect(screen.getByText(/آخر مزامنة للتقييم/)).toBeInTheDocument();
  });

  it('an un-synced evaluation says so rather than showing a bare number', async () => {
    renderTrainer(UNRATED);
    await screen.findByRole('heading', { level: 1, name: 'م. نورة الشمري' });
    expect(screen.getByText(content.profile.evaluationNeverSynced)).toBeInTheDocument();
    expect(screen.getByText(content.notEvaluated)).toBeInTheDocument();
  });

  it('an idle trainer’s profile repeats that it is monitoring only', async () => {
    renderTrainer(IDLE);
    await screen.findByRole('heading', { level: 1, name: 'أ. خالد المطيري' });
    expect(screen.getByText(content.idleNote)).toBeInTheDocument();
  });

  /* ── F2 — the identity card ────────────────────────────────────────────── */

  it('J-15/F2/AC-1: the card carries the matrix rows and nothing else', async () => {
    renderTrainer(ACTIVE);
    await screen.findByRole('heading', { level: 1, name: 'د. سارة العتيبي' });
    const card = screen.getByText(content.identityCard.heading).closest('div') as HTMLElement;
    for (const label of [
      // Notion «Identity Card Template Fields», 2026-09-29: front cover + the
      // inner panel's four groups.
      content.identityCard.sections.overview,
      content.identityCard.sections.experience,
      content.identityCard.sections.academic,
      content.identityCard.sections.relatedFields,
      content.identityCard.fields.sector,
      content.identityCard.fields.participationTypes,
      content.identityCard.fields.experience,
      content.identityCard.fields.recentRoles,
      content.identityCard.fields.academicQualifications,
      content.identityCard.fields.relatedFields,
      content.identityCard.fields.certifications,
      content.identityCard.fields.socialAccounts,
    ]) {
      expect(within(card).getByText(label)).toBeInTheDocument();
    }
  });

  it('J-15 matrix: related fields and social accounts come from the profile, so no row is reported missing', async () => {
    renderTrainer(ACTIVE);
    await screen.findByRole('heading', { level: 1, name: 'د. سارة العتيبي' });
    expect(screen.getByText('القيادة وإدارة الأعمال العالمية')).toBeInTheDocument();
    expect(screen.getByText('https://www.linkedin.com/in/example')).toBeInTheDocument();
    expect(screen.queryByText(content.identityCard.missingSource)).not.toBeInTheDocument();
  });

  it('shows free-text experience as written, never as "NaN"', async () => {
    renderTrainer(ACTIVE);
    await screen.findByRole('heading', { level: 1, name: 'د. سارة العتيبي' });
    expect(screen.getByText('من 11 إلى 15 سنة')).toBeInTheDocument();
    expect(screen.queryByText(/NaN/)).not.toBeInTheDocument();
  });

  it('the card shows the overview, the two most recent roles, and degree / university / year', async () => {
    renderTrainer(ACTIVE);
    await screen.findByRole('heading', { level: 1, name: 'د. سارة العتيبي' });
    expect(screen.getByText('البنوك')).toBeInTheDocument();
    expect(screen.getByText('ورش عمل متخصصة')).toBeInTheDocument();
    // A role still held reads «حتى الآن»; years go through the formatter.
    expect(
      screen.getByText('مدير التطوير المهني — الأكاديمية المالية (2020–حتى الآن)')
    ).toBeInTheDocument();
    expect(screen.getByText('مستشار تدريب — بنك محلي (2014–2019)')).toBeInTheDocument();
    expect(screen.getByText(/جامعة الملك سعود، 2012$/)).toBeInTheDocument();
  });

  it('G26: PDF export is disabled and explains why, rather than being a dead button', async () => {
    renderTrainer(ACTIVE);
    await screen.findByRole('heading', { level: 1, name: 'د. سارة العتيبي' });
    expect(screen.getByRole('button', { name: content.identityCard.export })).toBeDisabled();
    expect(screen.getByText(content.identityCard.exportUnavailable)).toBeInTheDocument();
  });

  /* ── states ────────────────────────────────────────────────────────────── */

  it('routes an unknown trainer id to the not-found state, and that state is a page with a heading', async () => {
    renderTrainer('does-not-exist');
    expect(await screen.findByText(content.errors.notFoundTitle)).toBeInTheDocument();

    /*
      These branches used to be `<Section aria-label>` → `<ErrorState>` and
      nothing else. `ErrorState` composes `Alert`, which renders its title as
      text — so the page carried **no heading element at all**, and a reader
      navigating by heading found nothing here. `PageLoadError` promotes the
      title to a real `<h1>`; this is what stops that regressing.
    */
    expect(
      screen.getByRole('heading', { level: 1, name: content.errors.notFoundTitle })
    ).toBeInTheDocument();
  });

  it('shows a retryable error state on a transport failure', async () => {
    injectProvider({ failWith: { status: 500, message: 'boom' } });
    seedExpertHubSession(['internal']);
    const { user } = renderExpertHubAt(expertHubPaths.internalTrainers);
    expect(await screen.findByText(content.errors.loadTitle)).toBeInTheDocument();
    injectProvider();
    await user.click(screen.getByRole('button', { name: content.errors.retry }));
    expect(await screen.findByText('د. سارة العتيبي')).toBeInTheDocument();
  });

  it('reaches the database from the internal dashboard', async () => {
    seedExpertHubSession(['internal']);
    renderExpertHubAt(expertHubPaths.internal);
    const link = await screen.findByRole('link', { name: /قاعدة المدربين/ });
    expect(link).toHaveAttribute('href', expertHubPaths.internalTrainers);
  });

  it('renders RTL by default and has no automatically-detectable a11y violations', async () => {
    const { container } = renderTrainer(ACTIVE);
    await screen.findByRole('heading', { level: 1, name: 'د. سارة العتيبي' });
    expect(document.documentElement).toHaveAttribute('dir', 'rtl');
    await expectNoA11yViolations(container);
  });
});
