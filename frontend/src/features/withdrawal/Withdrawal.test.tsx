import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  clearExpertHubSession,
  expectNoA11yViolations,
  renderExpertHubAt,
  screen,
  seedExpertHubSession,
} from '../../test/renderExpertHub';
import { expertHubPaths } from '../../app/router/paths';
import { engagementStatusLabel, isActive } from '../../contracts/engagementStatus';
import { getExecutionContent } from '../execution/execution.content';
import { createMockExecutionProvider } from '../execution/mockExecutionProvider';
import { setExecutionServiceForTesting } from '../execution/executionService';
import { setWithdrawalServiceForTesting } from './withdrawalService';
import { createMockWithdrawalProvider, MOCK_NOW } from './mockWithdrawalProvider';
import type { MockWithdrawalProviderOptions } from './mockWithdrawalProvider';
import { getWithdrawalContent } from './withdrawal.content';
import {
  STAFF_DELINK_REASONS,
  TRAINER_WITHDRAWAL_REASONS,
  validateTermination,
} from './withdrawal.types';

const content = getWithdrawalContent('ar');
const executionContent = getExecutionContent('ar');

/** The seeded engagements J-21 serves. */
const UPCOMING = 'eng-1';
const IN_PROGRESS = 'eng-2';
const COMPLETED = 'eng-3';
/** J-22/F3 — cancelled by FAST, seeded already terminated. */
const CANCELLED = 'eng-4';
/** J-22/F2 — de-linked by staff: the served terminated record. */
const DELINKED = 'eng-5';

const label = (status: Parameters<typeof engagementStatusLabel>[0]) =>
  engagementStatusLabel(status, 'ar');

function injectProviders(options: MockWithdrawalProviderOptions = {}) {
  setExecutionServiceForTesting(createMockExecutionProvider({ latencyMs: 0 }));
  setWithdrawalServiceForTesting(createMockWithdrawalProvider({ latencyMs: 0, ...options }));
}

async function renderDetail(engagementId: string) {
  seedExpertHubSession(['trainer']);
  const result = renderExpertHubAt(expertHubPaths.engagementDetail(engagementId));
  await screen.findByRole('heading', { level: 1, name: executionContent.heading });
  return result;
}

describe('J-22 — Withdrawal / Cancellation Handling', () => {
  beforeEach(() => {
    clearExpertHubSession();
    injectProviders();
  });

  afterEach(() => {
    setWithdrawalServiceForTesting(null);
    setExecutionServiceForTesting(null);
  });

  /* ── F3/AC-2 — the platform cannot cancel a plan ───────────────────────── */

  it('J-22/F3/AC-2: nothing on the contract can cancel a plan, under any circumstance', () => {
    const service = createMockWithdrawalProvider({ latencyMs: 0 });
    // Two operations, both belonging to people. Cancellation is FAST's alone.
    expect(Object.keys(service)).toEqual(['withdrawFromEngagement', 'delinkTrainer']);
    expect(Object.keys(service)).not.toContain('cancelPlan');
    expect(Object.keys(service)).not.toContain('cancelEngagement');
  });

  /* ── the two reason lists stay apart ───────────────────────────────────── */

  it('J-22/F1/AC-2 vs F2/AC-2: the trainer and staff lists are different and closed', () => {
    expect(TRAINER_WITHDRAWAL_REASONS).toEqual([
      'personal-emergency',
      'scheduling-conflict',
      'other',
    ]);
    expect(STAFF_DELINK_REASONS).toEqual([
      'operational-need-change',
      'administrative-decision',
      'other',
    ]);
    // No overlap beyond "other" — a trainer cannot cite an administrative
    // decision, and staff cannot cite a personal emergency.
    const shared = TRAINER_WITHDRAWAL_REASONS.filter((reason) =>
      (STAFF_DELINK_REASONS as readonly string[]).includes(reason)
    );
    expect(shared).toEqual(['other']);
  });

  it('J-22: "Other" requires the free text that makes it a reason', () => {
    expect(validateTermination(null)).toContain('reason-required');
    expect(validateTermination({ reason: 'other', note: '' })).toContain('note-required');
    expect(validateTermination({ reason: 'other', note: '   ' })).toContain('note-required');
    expect(validateTermination({ reason: 'other', note: 'ظرف عائلي' })).toEqual([]);
    expect(validateTermination({ reason: 'personal-emergency' })).toEqual([]);
    expect(validateTermination({ reason: 'administrative-decision' })).toEqual([]);
  });

  it('J-22: the server refuses an "Other" with no text too', async () => {
    const service = createMockWithdrawalProvider({ latencyMs: 0 });
    const result = await service.withdrawFromEngagement(UPCOMING, {
      reason: 'other',
      note: '   ',
    });
    expect(result).toEqual({ ok: false, error: { status: 400, message: 'note-required' } });
  });

  /* ── F1 — the trainer's withdrawal ─────────────────────────────────────── */

  it('J-22/F1/AC-1: the withdraw action is offered on an active engagement', async () => {
    await renderDetail(UPCOMING);
    expect(
      await screen.findByRole('button', { name: content.withdraw.action })
    ).toBeInTheDocument();
  });

  it('J-22/F1: an engagement that already ended cannot be withdrawn from', async () => {
    await renderDetail(COMPLETED);
    await screen.findByText(label('completed'));
    expect(screen.queryByRole('button', { name: content.withdraw.action })).not.toBeInTheDocument();

    const service = createMockWithdrawalProvider({ latencyMs: 0 });
    const result = await service.withdrawFromEngagement(COMPLETED, {
      reason: 'personal-emergency',
    });
    expect(result).toEqual({
      ok: false,
      error: { status: 409, message: 'engagement-not-upcoming' },
    });
  });

  it('J-22/F1: an engagement in progress offers no withdraw action either', async () => {
    await renderDetail(IN_PROGRESS);
    await screen.findByText(label('in_progress'));
    expect(screen.queryByRole('button', { name: content.withdraw.action })).not.toBeInTheDocument();
  });

  it('J-22/F1/AC-5: withdrawal ends the engagement and re-opens its slot', async () => {
    const service = createMockWithdrawalProvider({ latencyMs: 0 });
    const result = await service.withdrawFromEngagement(UPCOMING, {
      reason: 'scheduling-conflict',
    });
    // `P-111` — a withdrawal is `withdrawn`, whoever ended it.
    expect(result).toEqual({
      ok: true,
      value: {
        engagementId: UPCOMING,
        kind: 'withdrawn',
        occurredAt: MOCK_NOW,
        slotReopened: true,
      },
    });
  });

  it('J-22/F1: the panel states that withdrawing is final and re-opens the slot', async () => {
    const { user } = await renderDetail(UPCOMING);
    await user.click(await screen.findByRole('button', { name: content.withdraw.action }));
    expect(await screen.findByText(content.withdraw.warning)).toBeInTheDocument();
  });

  it('J-22/F1: the trainer must pick a reason before confirming', async () => {
    const { user } = await renderDetail(UPCOMING);
    await user.click(await screen.findByRole('button', { name: content.withdraw.action }));
    await user.click(screen.getByRole('button', { name: content.withdraw.confirm }));
    expect(await screen.findByText(content.errors.reasonRequired)).toBeInTheDocument();
  });

  it('J-22/F1: choosing a reason and confirming records the withdrawal', async () => {
    const { user } = await renderDetail(UPCOMING);
    await user.click(await screen.findByRole('button', { name: content.withdraw.action }));
    await user.click(
      screen.getByRole('radio', { name: content.withdraw.reasons['scheduling-conflict'] })
    );
    await user.click(screen.getByRole('button', { name: content.withdraw.confirm }));
    expect(await screen.findByText(content.withdraw.doneTitle)).toBeInTheDocument();
  });

  it('J-22/F1: only "Other" reveals the free-text field', async () => {
    const { user } = await renderDetail(UPCOMING);
    await user.click(await screen.findByRole('button', { name: content.withdraw.action }));
    // The panel's only text field is the "Other" note, and it is not there yet.
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: content.withdraw.reasons.other }));
    expect(await screen.findByRole('textbox')).toBeInTheDocument();
  });

  /* ── F2 — staff de-linking ─────────────────────────────────────────────── */

  it('J-22/F2/AC-3 + AC-5: de-linking ends the engagement as withdrawn and returns the slot to matching', async () => {
    const service = createMockWithdrawalProvider({ latencyMs: 0 });
    const result = await service.delinkTrainer(UPCOMING, {
      reason: 'administrative-decision',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value.kind).toBe('withdrawn');
    expect(result.value.slotReopened).toBe(true);
    // AC-3 — nothing on this result touches FAST or the plan.
    expect(Object.keys(result.value)).not.toContain('planCancelled');
  });

  it('J-22/F2/AC-4: a de-linked engagement tells the trainer staff ended it, and why', async () => {
    await renderDetail(DELINKED);
    expect(await screen.findByText(label('withdrawn'))).toBeInTheDocument();
    expect(screen.getByText(content.outcomes.withdrawnByStaff)).toBeInTheDocument();
    expect(
      screen.getByText(
        `${content.outcomes.reasonLabel}: ${content.delink.reasons['operational-need-change']}`
      )
    ).toBeInTheDocument();
  });

  it('J-22: an engagement can only be terminated once', async () => {
    const service = createMockWithdrawalProvider({ latencyMs: 0 });
    const first = await service.withdrawFromEngagement(UPCOMING, {
      reason: 'personal-emergency',
    });
    expect(first.ok).toBe(true);
    const second = await service.delinkTrainer(UPCOMING, { reason: 'administrative-decision' });
    expect(second.ok).toBe(false);
    if (second.ok) {
      return;
    }
    expect(second.error).toEqual({ status: 409, message: 'Already ended.' });
  });

  /* ── F3 — cancellation, received from FAST ─────────────────────────────── */

  it('J-22/F3/AC-5: Cancelled is distinct from Completed and from Withdrawn', () => {
    const labels = [label('completed'), label('withdrawn'), label('cancelled')];
    expect(new Set(labels).size).toBe(3);
    // …and none of the three counts as active.
    expect(isActive('completed')).toBe(false);
    expect(isActive('withdrawn')).toBe(false);
    expect(isActive('cancelled')).toBe(false);
  });

  it('J-22/F3/AC-3 + AC-6: a cancelled engagement carries its reason where the trainer will look', async () => {
    await renderDetail(CANCELLED);
    expect(await screen.findByText(label('cancelled'))).toBeInTheDocument();
    // AC-4 — the reason is the Academy cancelling the plan, not anything the
    // trainer did.
    expect(screen.getByText(content.outcomes.cancelledByAcademy)).toBeInTheDocument();
    // FAST's own reason, rendered as given — this project holds no such list.
    expect(screen.getByText(content.outcomes.fastReason('PCR-014'))).toBeInTheDocument();
  });

  it('J-22/F3: a cancelled engagement offers no withdraw action — there is nothing to end', async () => {
    await renderDetail(CANCELLED);
    await screen.findByText(label('cancelled'));
    expect(screen.queryByRole('button', { name: content.withdraw.action })).not.toBeInTheDocument();
  });

  it('J-22/F3/AC-5: a terminated engagement does not become "completed" when its dates pass', async () => {
    // The cancelled plan's window is in September; move past it entirely.
    setExecutionServiceForTesting(
      createMockExecutionProvider({ latencyMs: 0, now: '2026-12-01T09:00:00Z' })
    );
    const service = createMockExecutionProvider({ latencyMs: 0, now: '2026-12-01T09:00:00Z' });
    const result = await service.getEngagement(CANCELLED);
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value.status).toBe('cancelled');
  });

  /* ── accessibility ─────────────────────────────────────────────────────── */

  it('the withdrawal panel has no automatically-detectable a11y violations', async () => {
    const { container, user } = await renderDetail(UPCOMING);
    await user.click(await screen.findByRole('button', { name: content.withdraw.action }));
    await screen.findByText(content.withdraw.warning);
    expect(document.documentElement).toHaveAttribute('dir', 'rtl');
    await expectNoA11yViolations(container);
  });
});
