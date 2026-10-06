import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  clearExpertHubSession,
  renderExpertHubAt,
  screen,
  seedExpertHubSession,
  within,
} from '../../test/renderExpertHub';
import { expertHubPaths } from '../../app/router/paths';
import {
  buildSlaInstance,
  findSlaRow,
  listSlaMatrix,
  reminderOffsetsFor,
  resetSlaMatrixForTesting,
  SLA_IDS,
} from './mockSlaMatrix';
import { reminderMilestoneFor } from '../types/sla';
import { createMockNotificationProvider } from '../../features/notifications/mockNotificationProvider';
import { setScreeningServiceForTesting } from '../../features/screening/screeningService';
import { createMockScreeningProvider } from '../../features/screening/mockScreeningProvider';
import { getScreeningContent } from '../../features/screening/screening.content';
import { setAgreementLifecycleServiceForTesting } from '../../features/agreementLifecycle/agreementLifecycleService';
import { createMockAgreementLifecycleProvider } from '../../features/agreementLifecycle/mockAgreementLifecycleProvider';
import { getAgreementLifecycleContent } from '../../features/agreementLifecycle/agreementLifecycle.content';

/**
 * **The deadline console is the single source, and this is where that is proved.**
 *
 * `BR-0705`: «كل مهلة زمنية وتذكيرها، بغض النظر عن القدرة المصدر للحدث، تُدار
 * وتُعدَّل من شاشة إدارة المهل المركزية». Before this wiring the durations were
 * three constants in three feature mocks, invisible to the console that claims
 * to govern them — editing the console changed nothing, and one of the three
 * (screening's five days) was a number no document contains.
 *
 * These tests are cross-feature on purpose. A per-feature test would pass with
 * the constants still in place; only asking *"does changing the console change
 * the screening list"* can tell the difference.
 */

const screeningContent = getScreeningContent('ar');
const agreementContent = getAgreementLifecycleContent('ar');

describe('P-J4 — every countdown reads from the central deadline matrix', () => {
  beforeEach(() => {
    clearExpertHubSession();
    resetSlaMatrixForTesting();
  });

  afterEach(() => {
    resetSlaMatrixForTesting();
    setScreeningServiceForTesting(null);
    setAgreementLifecycleServiceForTesting(null);
  });

  /* ── No orphans ────────────────────────────────────────────────────────── */

  it('every countdown the product runs is configured by a row that exists', () => {
    // An `slaId` naming nothing is a deadline governed by no screen — exactly
    // what this wiring exists to prevent.
    for (const slaId of Object.values(SLA_IDS)) {
      expect(findSlaRow(slaId), `no matrix row for ${slaId}`).toBeDefined();
    }
  });

  it('the matrix is one store — CAP-07 reads the same rows the features do', async () => {
    const service = createMockNotificationProvider({ latencyMs: 0 });
    const result = await service.listSlaRows();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.map((row) => row.slaId)).toEqual(listSlaMatrix().map((row) => row.slaId));
    }
  });

  /* ── A deadline nobody configured produces no countdown ────────────────── */

  it('an undefined duration yields no instance, rather than an invented one', () => {
    // `SLA-0202` — J-05 shows "remaining SLA time" and never states a number.
    expect(findSlaRow(SLA_IDS.screeningDecision)?.status).toBe('undefined-duration');
    expect(
      buildSlaInstance(SLA_IDS.screeningDecision, '2026-08-01T09:00:00Z', '2026-08-05T09:00:00Z')
    ).toBeNull();
  });

  it('the screening page says the deadline is unconfigured instead of showing a figure', async () => {
    setScreeningServiceForTesting(createMockScreeningProvider({ latencyMs: 0 }));
    seedExpertHubSession(['internal']);
    renderExpertHubAt(expertHubPaths.internalApplicationDetail('app-3001'));
    await screen.findByRole('heading', { level: 1 });

    expect(await screen.findByText(screeningContent.sla.notConfigured)).toBeInTheDocument();
    for (const label of Object.values(screeningContent.sla.labels)) {
      expect(screen.queryByText(label)).not.toBeInTheDocument();
    }
  });

  /* ── Setting it on the console reaches the other capability's screen ───── */

  it('a duration set on the deadline console makes the screening countdown appear', async () => {
    const console_ = createMockNotificationProvider({ latencyMs: 0 });
    const saved = await console_.setSla(SLA_IDS.screeningDecision, {
      kind: 'fixed',
      duration: 5,
      unit: 'business-days',
      reminderOffsets: [],
    });
    expect(saved.ok).toBe(true);

    // A different capability, a different provider, a different screen.
    setScreeningServiceForTesting(createMockScreeningProvider({ latencyMs: 0 }));
    seedExpertHubSession(['internal']);
    renderExpertHubAt(expertHubPaths.internalApplicationDetail('app-3001'));
    await screen.findByRole('heading', { level: 1 });

    expect(screen.queryByText(screeningContent.sla.notConfigured)).not.toBeInTheDocument();
    const shown = Object.values(screeningContent.sla.labels).filter(
      (label) => screen.queryByText(label) != null
    );
    expect(shown).toHaveLength(1);
  });

  /* ── The countdown names its configuration ─────────────────────────────── */

  it('an instance carries the id of the row that produced it', () => {
    const instance = buildSlaInstance(
      SLA_IDS.assignmentOfferResponse,
      '2026-08-20T09:00:00Z',
      '2026-08-21T09:00:00Z'
    );
    expect(instance?.slaId).toBe(SLA_IDS.assignmentOfferResponse);
    // J-18/F2's three days, from the matrix rather than from the feature.
    expect(instance?.daysRemaining).toBe(2);
  });

  /* ── Reminder offsets are configuration, not a hard-coded union ────────── */

  it('reminderMilestoneFor picks the tightest offset the record has reached', () => {
    const offsets = [90, 30, 5];
    expect(reminderMilestoneFor(120, offsets)).toEqual({ kind: 'none' });
    expect(reminderMilestoneFor(60, offsets)).toEqual({ kind: 'reminder', daysBefore: 90 });
    expect(reminderMilestoneFor(11, offsets)).toEqual({ kind: 'reminder', daysBefore: 30 });
    expect(reminderMilestoneFor(4, offsets)).toEqual({ kind: 'reminder', daysBefore: 5 });
    expect(reminderMilestoneFor(-1, offsets)).toEqual({ kind: 'expired' });
  });

  it('J-12 keeps BR-0303’s 90/30/5 — and reads them from the console', async () => {
    expect(reminderOffsetsFor(SLA_IDS.agreementExpiry)).toEqual([90, 30, 5]);

    setAgreementLifecycleServiceForTesting(createMockAgreementLifecycleProvider({ latencyMs: 0 }));
    seedExpertHubSession(['internal']);
    renderExpertHubAt(expertHubPaths.internalAgreements);
    const table = await screen.findByRole('table', { name: agreementContent.resultsLabel });
    // `agr-001` sits 11 days out — the 30-day reminder.
    expect(
      within(table).getByText(agreementContent.milestone({ kind: 'reminder', daysBefore: 30 }))
    ).toBeInTheDocument();
  });

  it('changing the reminder schedule on the console changes what the table shows', async () => {
    const console_ = createMockNotificationProvider({ latencyMs: 0 });
    // 90/30/5 → 60/10. The agreement 11 days out now sits under the 60-day
    // reminder, not the 30-day one, and no code outside the console changed.
    const saved = await console_.setSla(SLA_IDS.agreementExpiry, {
      kind: 'reminders-only',
      reminderOffsets: [60, 10],
    });
    expect(saved.ok).toBe(true);

    setAgreementLifecycleServiceForTesting(createMockAgreementLifecycleProvider({ latencyMs: 0 }));
    seedExpertHubSession(['internal']);
    renderExpertHubAt(expertHubPaths.internalAgreements);
    const table = await screen.findByRole('table', { name: agreementContent.resultsLabel });

    expect(
      within(table).getByText(agreementContent.milestone({ kind: 'reminder', daysBefore: 60 }))
    ).toBeInTheDocument();
    expect(
      within(table).queryByText(agreementContent.milestone({ kind: 'reminder', daysBefore: 30 }))
    ).not.toBeInTheDocument();
  });

  it('P-51 holds: the badge renders server-decided state and computes nothing', () => {
    // Every field the UI needs arrives on the instance. If the UI had to derive
    // `state` it would need the Academy calendar, which it does not have.
    const instance = buildSlaInstance(
      SLA_IDS.interviewSlotSelection,
      '2026-08-20T09:00:00Z',
      '2026-08-22T09:00:00Z'
    );
    expect(Object.keys(instance ?? {}).sort()).toEqual([
      'daysRemaining',
      'dueAt',
      'slaId',
      'state',
    ]);
  });
});
