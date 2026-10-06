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
import { poolSizeFor } from '../assignments/matching.types';
import { setReRoutingServiceForTesting } from './reRoutingService';
import { createMockReRoutingProvider } from './mockReRoutingProvider';
import type { MockReRoutingProviderOptions } from './mockReRoutingProvider';
import { getReRoutingContent } from './reRouting.content';
import { RE_MATCH_HEADCOUNT, SLOT_CYCLE_STATUS } from './reRouting.types';

const content = getReRoutingContent('ar');

const REQUEST = 'asg-001';
/** The slot J-18 exhausted. Slot 2 is confirmed, and must stay that way. */
const SLOT = 1;

function injectProvider(options: MockReRoutingProviderOptions = {}) {
  setReRoutingServiceForTesting(createMockReRoutingProvider({ latencyMs: 0, ...options }));
}

async function renderReRouting(options: MockReRoutingProviderOptions = {}) {
  if (Object.keys(options).length > 0) {
    setReRoutingServiceForTesting(null);
    injectProvider(options);
  }
  seedExpertHubSession(['internal']);
  const result = renderExpertHubAt(expertHubPaths.internalSlotReRouting(REQUEST, SLOT));
  await screen.findByRole('heading', { level: 1, name: content.heading });
  return result;
}

/** Run the engine and tick the first `count` candidates. */
async function runAndSelect(
  user: Awaited<ReturnType<typeof renderReRouting>>['user'],
  count: number
) {
  await user.click(screen.getByRole('button', { name: content.runEngine }));
  await screen.findByText(/نسخة مبدئية/);
  const boxes = screen.getAllByRole('checkbox');
  for (let index = 0; index < count; index += 1) {
    await user.click(boxes[index]);
  }
}

describe('EH-INT-09d — Re-routing After Offer Rejection (J-19)', () => {
  beforeEach(() => {
    clearExpertHubSession();
    injectProvider();
  });

  afterEach(() => {
    setReRoutingServiceForTesting(null);
  });

  /* ── F1 — the exhausted slot ───────────────────────────────────────────── */

  it('J-19/F1/AC-1: the page opens on an exhausted slot and says so', async () => {
    await renderReRouting();
    expect(await screen.findByText(content.exhaustedTitle)).toBeInTheDocument();
    // In the record head, and again on the open cycle in the history.
    expect(screen.getAllByText(content.statuses.exhausted).length).toBeGreaterThan(0);
  });

  /* ── F2/AC-1 — slot-scoped, never request-scoped ───────────────────────── */

  it('J-19/F2/AC-1: every operation on the contract takes a slot number', () => {
    const service = createMockReRoutingProvider({ latencyMs: 0 });
    expect(Object.keys(service)).toEqual([
      'getSlotCycle',
      'runSlotMatching',
      'searchSlotCandidates',
      'sendSlotPool',
      'decideSlotPool',
    ]);
    // No escalate, no cancel-slot, no reopen-slot — F3/AC-3 and F2/AC-2.
    expect(Object.keys(service)).not.toContain('escalate');
    expect(Object.keys(service)).not.toContain('reopenSlot');
  });

  it('J-19/F2/AC-1: the page states that matching covers this slot alone', async () => {
    await renderReRouting();
    expect(await screen.findByText(content.matchNote)).toBeInTheDocument();
  });

  it('one slot needs exactly three candidates', async () => {
    expect(poolSizeFor(RE_MATCH_HEADCOUNT)).toBe(3);
    await renderReRouting();
    expect(await screen.findByText(content.poolSizeNote(3))).toBeInTheDocument();
  });

  /* ── F2/AC-2 — the confirmed sibling is untouchable ────────────────────── */

  it('J-19/F2/AC-2: a slot that is not exhausted has no cycle at all', async () => {
    const service = createMockReRoutingProvider({ latencyMs: 0 });
    // Slot 2 is confirmed. The server answers with no cycle (`status: null`) —
    // not an empty workspace someone could act in.
    const result = await service.getSlotCycle(REQUEST, 2);
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value).toMatchObject({
      status: null,
      cycleNumber: 0,
      exhausted: false,
      confirmed: true,
    });
    // …and it cannot be handed a pool either.
    const sent = await service.sendSlotPool(REQUEST, 2, {
      trainerIds: ['trn-101', 'trn-104', 'trn-111'],
    });
    expect(sent.ok).toBe(false);
  });

  it('J-19/F2/AC-2: opening the confirmed slot shows that there is nothing to re-route', async () => {
    seedExpertHubSession(['internal']);
    renderExpertHubAt(expertHubPaths.internalSlotReRouting(REQUEST, 2));
    expect(await screen.findByText(content.errors.noCycleTitle)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: content.runEngine })).not.toBeInTheDocument();
  });

  it('J-19/F2/AC-2: the confirmed sibling is shown, stated as unaffected, and has no controls', async () => {
    await renderReRouting();
    const heading = await screen.findByRole('heading', {
      level: 2,
      name: content.siblingsHeading,
    });
    const card = heading.closest('section, div');
    expect(screen.getByText(content.siblingsNote)).toBeInTheDocument();
    expect(screen.getByText(content.siblingStates.confirmed)).toBeInTheDocument();
    // Nothing in this block can act on another slot.
    expect(within(card as HTMLElement).queryByRole('button')).not.toBeInTheDocument();
  });

  it('J-19/F2/AC-2: re-matching leaves the confirmed sibling exactly as it was', async () => {
    const service = createMockReRoutingProvider({ latencyMs: 0 });
    const before = await service.getSlotCycle(REQUEST, SLOT);
    if (!before.ok) {
      return;
    }
    await service.runSlotMatching(REQUEST, SLOT);
    await service.sendSlotPool(REQUEST, SLOT, {
      trainerIds: ['trn-101', 'trn-104', 'trn-111'],
    });
    const after = await service.getSlotCycle(REQUEST, SLOT);
    expect(after.ok).toBe(true);
    if (!after.ok) {
      return;
    }
    expect(after.value.siblings).toEqual(before.value.siblings);
  });

  /* ── F2/AC-3 — a prior refusal is not a disqualification ───────────────── */

  it('J-19/F2/AC-3: candidates who already refused come back in the new run', async () => {
    const service = createMockReRoutingProvider({ latencyMs: 0 });
    const cycle = await service.getSlotCycle(REQUEST, SLOT);
    const run = await service.runSlotMatching(REQUEST, SLOT);
    expect(cycle.ok && run.ok).toBe(true);
    if (!cycle.ok || !run.ok) {
      return;
    }
    const refused = cycle.value.previouslyOffered.map((entry) => entry.trainerId);
    expect(refused.length).toBeGreaterThan(0);
    const ranked = run.value.ranked.map((candidate) => candidate.trainerId);
    // Every one of them is back — nothing filters on history.
    for (const trainerId of refused) {
      expect(ranked).toContain(trainerId);
    }
  });

  it('J-19/F2/AC-3: a returning candidate is flagged, and the page says they are not excluded', async () => {
    const { user } = await renderReRouting();
    expect(screen.getByText(content.historyNote)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: content.runEngine }));
    await screen.findByText(/نسخة مبدئية/);
    expect(screen.getAllByText(content.returningCandidate).length).toBeGreaterThan(0);
  });

  it('J-19/F2/AC-3: the same exclusion rules still apply', async () => {
    const service = createMockReRoutingProvider({ latencyMs: 0 });
    const run = await service.runSlotMatching(REQUEST, SLOT);
    expect(run.ok).toBe(true);
    if (!run.ok) {
      return;
    }
    const reasons = run.value.excluded.flatMap((candidate) => candidate.reasons);
    expect(reasons).toContain('specialization');
    expect(reasons).toContain('schedule-conflict');
    // An excluded candidate is refused on send too, not merely hidden.
    const rejected = await service.sendSlotPool(REQUEST, SLOT, {
      trainerIds: ['trn-107', 'trn-101', 'trn-104'],
    });
    expect(rejected).toEqual({
      ok: false,
      error: { status: 400, message: 'excluded-candidate' },
    });
  });

  it('the pool must be exactly three — no fewer, no more', async () => {
    const service = createMockReRoutingProvider({ latencyMs: 0 });
    const poolSize = { ok: false, error: { status: 400, message: 'pool-size' } };
    const tooFew = await service.sendSlotPool(REQUEST, SLOT, { trainerIds: ['trn-101'] });
    expect(tooFew).toEqual(poolSize);
    const tooMany = await service.sendSlotPool(REQUEST, SLOT, {
      trainerIds: ['trn-101', 'trn-104', 'trn-102', 'trn-106'],
    });
    expect(tooMany).toEqual(poolSize);
  });

  it('the send action stays unavailable until exactly three are selected', async () => {
    const { user } = await renderReRouting();
    await runAndSelect(user, 2);
    expect(screen.getByRole('button', { name: content.sendPool })).toBeDisabled();
    await user.click(screen.getAllByRole('checkbox')[2]);
    expect(screen.getByRole('button', { name: content.sendPool })).toBeEnabled();
  });

  /* ── F3 — the fresh approval cycle ─────────────────────────────────────── */

  it('J-19/F3/AC-1 + AC-2: the new set goes to the requesting party, and approving restarts J-18', async () => {
    const { user } = await renderReRouting();
    await runAndSelect(user, 3);
    await user.click(screen.getByRole('button', { name: content.sendPool }));
    await screen.findByText(content.decisionHeading);

    // F4-style, per candidate — there is no "approve all".
    const approve = screen.getAllByRole('button', { name: content.approve });
    const reject = screen.getAllByRole('button', { name: content.reject });
    expect(approve).toHaveLength(3);
    await user.click(approve[0]);
    await user.click(reject[1]);
    await user.click(reject[2]);

    const rank = screen.getAllByRole('combobox')[0];
    await user.click(rank);
    await user.click(await screen.findByRole('option', { name: '1' }));

    await user.click(screen.getByRole('button', { name: content.submitDecision }));
    expect(await screen.findByText(content.decidedTitle)).toBeInTheDocument();
  });

  it('J-19/F3/AC-3: rejecting the whole new set exhausts the slot again and opens the next cycle, without limit', async () => {
    const service = createMockReRoutingProvider({ latencyMs: 0 });
    const trainerIds = ['trn-101', 'trn-104', 'trn-111'];
    const rejectAll = {
      decisions: trainerIds.map((trainerId) => ({ trainerId, decision: 'rejected' as const })),
      preferenceOrder: [],
    };

    for (const expectedNext of [2, 3]) {
      const sent = await service.sendSlotPool(REQUEST, SLOT, { trainerIds });
      // The actions answer with the pool, not the cycle.
      expect(sent.ok && sent.value.status).toBe('sent');
      const decided = await service.decideSlotPool(REQUEST, SLOT, rejectAll);
      expect(decided.ok && decided.value.status).toBe('decided');

      const cycle = await service.getSlotCycle(REQUEST, SLOT);
      expect(cycle.ok).toBe(true);
      if (!cycle.ok) {
        return;
      }
      // Back to needing candidates — not escalated, not failed, not closed.
      expect(cycle.value).toMatchObject({
        status: SLOT_CYCLE_STATUS.exhausted,
        exhausted: true,
        cycleNumber: expectedNext,
      });
      expect(cycle.value.cycles.map((entry) => entry.status)).toEqual([
        ...Array<string>(expectedNext - 1).fill(SLOT_CYCLE_STATUS.decided),
        SLOT_CYCLE_STATUS.exhausted,
      ]);
      // Pool rejections are not offers: who was *offered* the slot is unchanged.
      expect(cycle.value.previouslyOffered).toHaveLength(3);
    }
  });

  it('J-19/F3/AC-3: the page says the new list was rejected in full once it was', async () => {
    const service = createMockReRoutingProvider({ latencyMs: 0 });
    const trainerIds = ['trn-101', 'trn-104', 'trn-111'];
    await service.sendSlotPool(REQUEST, SLOT, { trainerIds });
    await service.decideSlotPool(REQUEST, SLOT, {
      decisions: trainerIds.map((trainerId) => ({ trainerId, decision: 'rejected' as const })),
      preferenceOrder: [],
    });
    setReRoutingServiceForTesting(service);
    await renderReRouting();
    expect(await screen.findByText(content.fullRejectionTitle)).toBeInTheDocument();
    expect(screen.getByText(content.cycleLabel(2))).toBeInTheDocument();
  });

  it('J-19/F3/AC-3: the page states that the cycle repeats without limit', async () => {
    await renderReRouting();
    expect(await screen.findByText(content.noLimitNote)).toBeInTheDocument();
  });

  /* ── P-J9 — two actors ─────────────────────────────────────────────────── */

  it('P-J9: a viewer who may not re-match is told so rather than shown a broken workspace', async () => {
    await renderReRouting({ viewer: { canMatch: false, canApprove: false } });
    expect(await screen.findByText(content.notAuthorized)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: content.runEngine })).not.toBeInTheDocument();
  });

  /* ── navigation + a11y ─────────────────────────────────────────────────── */

  it('renders RTL by default and has no automatically-detectable a11y violations', async () => {
    const { container, user } = await renderReRouting();
    await user.click(screen.getByRole('button', { name: content.runEngine }));
    await screen.findByText(/نسخة مبدئية/);
    expect(document.documentElement).toHaveAttribute('dir', 'rtl');
    await expectNoA11yViolations(container);
  });
});
