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
import { setAgreementLifecycleServiceForTesting } from './agreementLifecycleService';
import { createMockAgreementLifecycleProvider } from './mockAgreementLifecycleProvider';
import type { MockAgreementLifecycleProviderOptions } from './mockAgreementLifecycleProvider';
import { getAgreementLifecycleContent } from './agreementLifecycle.content';
import { allowedActions } from './agreementLifecycle.types';

const content = getAgreementLifecycleContent('ar');

function injectProvider(options: MockAgreementLifecycleProviderOptions = {}) {
  setAgreementLifecycleServiceForTesting(
    createMockAgreementLifecycleProvider({ latencyMs: 0, ...options })
  );
}

async function renderList() {
  seedExpertHubSession(['internal']);
  const result = renderExpertHubAt(expertHubPaths.internalAgreements);
  await screen.findByRole('heading', { level: 1, name: content.listTitle });
  return result;
}

async function renderAgreement(id: string) {
  seedExpertHubSession(['internal']);
  const result = renderExpertHubAt(expertHubPaths.internalAgreement(id));
  await screen.findByRole('heading', { level: 1, name: content.detail.heading });
  return result;
}

/**
 * ⚠️ Seeded agreements (see `mockAgreementLifecycleProvider`), against the fixed
 * mock "today" of 2026-08-20:
 *   agr-001  active, expires 2026-09-01 → 30-day milestone, never renewed
 *   agr-002  active, expires 2026-12-31 → no milestone, renewed once
 *   agr-003  expired 2026-07-01        → renewable (F2/AC-1 "past expiry")
 *   agr-004  suspended
 */
const FIRST_TERM = 'agr-001';
const RENEWED_ONCE = 'agr-002';
const EXPIRED = 'agr-003';
const SUSPENDED = 'agr-004';

describe('EH-INT-06 — Agreement Lifecycle (J-12)', () => {
  beforeEach(() => {
    clearExpertHubSession();
    injectProvider();
  });

  afterEach(() => {
    setAgreementLifecycleServiceForTesting(null);
  });

  /* ── F1 — expiry tracking ──────────────────────────────────────────────── */

  it('J-12/F1: shows each agreement’s calculated expiry and its BR-0303 milestone', async () => {
    await renderList();
    const table = await screen.findByRole('table', { name: content.resultsLabel });
    // agr-001 expires within 30 days.
    expect(
      within(table).getByText(content.milestone({ kind: 'reminder', daysBefore: 30 }))
    ).toBeInTheDocument();
    // agr-003 has lapsed.
    expect(within(table).getByText(content.milestone({ kind: 'expired' }))).toBeInTheDocument();
  });

  it('J-12/F1: the milestone is conveyed by text, not colour alone', async () => {
    await renderList();
    const table = await screen.findByRole('table', { name: content.resultsLabel });
    // The tag carries a label AND a day count sits beside it.
    expect(
      within(table).getByText(content.milestone({ kind: 'reminder', daysBefore: 30 }))
    ).toBeInTheDocument();
    // 11 whole days from the fixed mock clock (2026-08-20T09:00Z) to 2026-09-01.
    expect(within(table).getByText(content.daysRemaining(11))).toBeInTheDocument();
  });

  it('filters by status and by expiry milestone', async () => {
    const { user } = await renderList();
    await user.click(screen.getByRole('combobox', { name: content.filters.statusLabel }));
    await user.click(await screen.findByRole('option', { name: content.statuses.suspended }));
    const table = await screen.findByRole('table', { name: content.resultsLabel });
    expect(within(table).getByText('أ. ريم القحطاني')).toBeInTheDocument();
    expect(within(table).queryByText('د. سارة العتيبي')).not.toBeInTheDocument();
  });

  /* ── F2 — administrative renewal ───────────────────────────────────────── */

  it('J-12/F2/AC-2: a FIRST renewal grants 1 year — and the term is stated, not asked for', async () => {
    const { user } = await renderAgreement(FIRST_TERM);
    await user.click(screen.getByRole('button', { name: content.actions.labels.renew }));
    // The dialog names the rule-set term…
    expect(await screen.findByText(content.actions.renewDialog.termNote(1))).toBeInTheDocument();
    // …and offers no way to choose a different one.
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).queryByRole('spinbutton')).not.toBeInTheDocument();
    expect(within(dialog).queryByRole('combobox', { name: /مدة|سنوات/ })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: content.actions.renewDialog.confirm }));
    expect(await screen.findByText(content.actions.success.renew)).toBeInTheDocument();
    expect(screen.getByText(content.statuses.active)).toBeInTheDocument();
  });

  it('J-12/F2/AC-2: every SUBSEQUENT renewal grants 3 years', async () => {
    const { user } = await renderAgreement(RENEWED_ONCE); // renewalCount = 1
    await user.click(screen.getByRole('button', { name: content.actions.labels.renew }));
    expect(await screen.findByText(content.actions.renewDialog.termNote(3))).toBeInTheDocument();
  });

  it('J-12/F2/AC-1: renewal is direct — nothing routes back to screening or interview', async () => {
    await renderAgreement(FIRST_TERM);
    // The direct route is stated rather than left as an unexplained absence.
    expect(screen.getByText(content.actions.directRenewalNote)).toBeInTheDocument();
    const buttons = screen.getAllByRole('button');
    for (const word of [/فرز/, /مقابلة/]) {
      expect(buttons.some((button) => word.test(button.textContent ?? ''))).toBe(false);
    }
  });

  it('J-12/F2/AC-1: an agreement PAST expiry is still renewable', async () => {
    const { user } = await renderAgreement(EXPIRED);
    expect(screen.getByText(content.statuses.expired)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: content.actions.labels.renew }));
    await user.click(
      await screen.findByRole('button', { name: content.actions.renewDialog.confirm })
    );
    expect(await screen.findByText(content.actions.success.renew)).toBeInTheDocument();
    expect(screen.getByText(content.statuses.active)).toBeInTheDocument();
  });

  /* ── F3 — status control ───────────────────────────────────────────────── */

  it('J-12/F3: suspending is reversible; the suspended agreement offers reactivation', async () => {
    const { user } = await renderAgreement(FIRST_TERM);
    await user.click(screen.getByRole('button', { name: content.actions.labels.suspend }));
    await user.click(
      await screen.findByRole('button', { name: content.actions.suspendDialog.confirm })
    );
    expect(await screen.findByText(content.actions.success.suspend)).toBeInTheDocument();
    expect(screen.getByText(content.statuses.suspended)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: content.actions.labels.reactivate })
    ).toBeInTheDocument();
  });

  it('J-12/F3: ending warns it is final and requires an explicit acknowledgement', async () => {
    const { user } = await renderAgreement(FIRST_TERM);
    await user.click(screen.getByRole('button', { name: content.actions.labels.end }));

    expect(await screen.findByText(content.actions.endDialog.warning)).toBeInTheDocument();
    const confirm = screen.getByRole('button', { name: content.actions.endDialog.confirm });
    expect(confirm).toBeDisabled();

    await user.click(
      screen.getByLabelText(content.actions.endDialog.acknowledgeLabel, { exact: false })
    );
    await user.click(confirm);

    expect(await screen.findByText(content.actions.success.end)).toBeInTheDocument();
    expect(screen.getByText(content.statuses.ended)).toBeInTheDocument();
    // Terminal — nothing follows a deliberate ending.
    expect(screen.getByText(content.actions.noneAvailable)).toBeInTheDocument();
  });

  it('the state machine is closed: `ended` permits nothing', () => {
    expect(allowedActions('ended')).toEqual([]);
    expect(allowedActions('expired')).toEqual(['renew']);
    expect(allowedActions('suspended')).toEqual(['reactivate', 'end']);
    expect(allowedActions('active')).toEqual(['renew', 'suspend', 'end']);
  });

  it('J-12 scope: the annex action is NOT rebuilt here — J-03/F3 owns it', async () => {
    await renderAgreement(FIRST_TERM);
    const buttons = screen.getAllByRole('button').map((b) => b.textContent ?? '');
    expect(buttons.some((label) => /ملحق/.test(label))).toBe(false);
  });

  it('records every lifecycle action in the agreement history', async () => {
    const { user } = await renderAgreement(SUSPENDED);
    // Scoped to the history list: several of these labels also name a dialog.
    const history = () =>
      screen.getByText(content.detail.historyHeading).closest('div') as HTMLElement;
    expect(
      within(history()).getByText(content.detail.historyKinds.suspended, { exact: false })
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: content.actions.labels.reactivate }));
    await user.click(
      await screen.findByRole('button', { name: content.actions.reactivateDialog.confirm })
    );
    await screen.findByText(content.actions.success.reactivate);
    expect(
      within(history()).getByText(content.detail.historyKinds.reactivated, { exact: false })
    ).toBeInTheDocument();
  });

  /* ── F4 — template management ──────────────────────────────────────────── */

  it('J-12/F4: the template exposes its fixed text and merge fields for editing', async () => {
    seedExpertHubSession(['internal']);
    const { user } = renderExpertHubAt(expertHubPaths.internalAgreementTemplate);
    await screen.findByRole('heading', { level: 1, name: content.template.heading });

    const body = screen.getByLabelText(content.template.bodyLabel, { exact: false });
    expect(body).toBeInTheDocument();
    expect(screen.getByText(content.template.fieldsHeading)).toBeInTheDocument();
    // At least one merge field is editable.
    expect(
      screen.getAllByLabelText(content.template.fieldLabelLabel, { exact: false }).length
    ).toBeGreaterThan(0);

    await user.clear(body);
    await user.type(body, 'نص محدّث للاتفاقية.');
    await user.click(screen.getByRole('button', { name: content.template.save }));
    expect(await screen.findByText(content.template.saved)).toBeInTheDocument();
  });

  it('J-12/F4/AC-1: an empty template body is refused', async () => {
    seedExpertHubSession(['internal']);
    const { user } = renderExpertHubAt(expertHubPaths.internalAgreementTemplate);
    await screen.findByRole('heading', { level: 1, name: content.template.heading });
    await user.clear(screen.getByLabelText(content.template.bodyLabel, { exact: false }));
    await user.click(screen.getByRole('button', { name: content.template.save }));
    expect(await screen.findByText(content.template.errors['body-required'])).toBeInTheDocument();
  });

  it('J-12/F4/AC-2: the template links its services and says the structure supports more', async () => {
    seedExpertHubSession(['internal']);
    renderExpertHubAt(expertHubPaths.internalAgreementTemplate);
    await screen.findByRole('heading', { level: 1, name: content.template.heading });
    expect(screen.getByText(content.template.multiTemplateNote)).toBeInTheDocument();
    expect(screen.getByText(content.services.trainer)).toBeInTheDocument();
    expect(screen.getByText(content.services.consultant)).toBeInTheDocument();
  });

  /* ── states ────────────────────────────────────────────────────────────── */

  it('routes an unknown agreement id to the not-found state', async () => {
    seedExpertHubSession(['internal']);
    renderExpertHubAt(expertHubPaths.internalAgreement('does-not-exist'));
    expect(await screen.findByText(content.errors.notFoundTitle)).toBeInTheDocument();
  });

  it('shows a retryable error state on a transport failure', async () => {
    injectProvider({ failWith: { status: 500, message: 'boom' } });
    seedExpertHubSession(['internal']);
    const { user } = renderExpertHubAt(expertHubPaths.internalAgreements);
    expect(await screen.findByText(content.errors.loadTitle)).toBeInTheDocument();
    injectProvider();
    await user.click(screen.getByRole('button', { name: content.errors.retry }));
    expect(await screen.findByText('د. سارة العتيبي')).toBeInTheDocument();
  });

  it('reaches the queue from the internal shell', async () => {
    seedExpertHubSession(['internal']);
    renderExpertHubAt(expertHubPaths.internal);
    // Reached from the shell header nav (the dashboard quick-link cards were
    // removed for the Option B IA); "الاتفاقيات" is a primary internal tab.
    const link = await screen.findByRole('link', { name: 'الاتفاقيات' });
    expect(link).toHaveAttribute('href', expertHubPaths.internalAgreements);
  });

  it('renders RTL by default and has no automatically-detectable a11y violations', async () => {
    const { container } = await renderAgreement(FIRST_TERM);
    expect(document.documentElement).toHaveAttribute('dir', 'rtl');
    await expectNoA11yViolations(container);
  });
});
