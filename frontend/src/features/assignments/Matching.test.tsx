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
import { setAssignmentServiceForTesting } from './assignmentService';
import { createMockAssignmentProvider } from './mockAssignmentProvider';
import type { MockAssignmentProviderOptions } from './mockAssignmentProvider';
import { getAssignmentsContent } from './assignments.content';
import {
  CANDIDATES_PER_SLOT,
  candidatesGoingForward,
  isFullRejection,
  poolSizeFor,
  validatePool,
  validatePoolDecision,
  type PoolMemberDto,
} from './matching.types';

const content = getAssignmentsContent('ar');
const copy = content.matching;

function injectProvider(options: MockAssignmentProviderOptions = {}) {
  setAssignmentServiceForTesting(createMockAssignmentProvider({ latencyMs: 0, ...options }));
}

/** The seeded request: 2 trainers needed → a pool of exactly 6. */
const REQUEST = 'asg-001';

async function renderMatching(options: MockAssignmentProviderOptions = {}) {
  if (Object.keys(options).length > 0) {
    setAssignmentServiceForTesting(null);
    injectProvider(options);
  }
  seedExpertHubSession(['internal']);
  const result = renderExpertHubAt(expertHubPaths.internalAssignmentMatching(REQUEST));
  await screen.findByRole('heading', { level: 1, name: copy.heading });
  return result;
}

/** Run the engine and select the first `count` ranked candidates. */
async function runAndSelect(
  user: Awaited<ReturnType<typeof renderMatching>>['user'],
  count: number
) {
  await user.click(screen.getByRole('button', { name: copy.runEngine }));
  await screen.findByText(/نسخة مبدئية/);
  const boxes = screen.getAllByRole('checkbox');
  for (let index = 0; index < count; index += 1) {
    await user.click(boxes[index]);
  }
}

describe('EH-INT-09 — Matching & Nomination (J-17)', () => {
  beforeEach(() => {
    clearExpertHubSession();
    injectProvider();
  });

  afterEach(() => {
    setAssignmentServiceForTesting(null);
  });

  /* ── the pool-size rule, stated and enforced ───────────────────────────── */

  it('J-17/F2/AC-2: three candidates per required slot — the arithmetic is stated up front', async () => {
    await renderMatching();
    expect(screen.getByText(copy.poolSizeNote(2, 6))).toBeInTheDocument();
  });

  it('J-17/F2/AC-2: exactly that many — no fewer, no more, on either path', () => {
    expect(CANDIDATES_PER_SLOT).toBe(3);
    expect(poolSizeFor(2)).toBe(6);
    expect(validatePool(['a', 'b', 'c', 'd', 'e'], 2)).toContain('pool-size-wrong');
    expect(validatePool(['a', 'b', 'c', 'd', 'e', 'f', 'g'], 2)).toContain('pool-size-wrong');
    expect(validatePool(['a', 'b', 'c', 'd', 'e', 'f'], 2)).toEqual([]);
  });

  it('the send action stays unavailable until the pool is exactly the right size', async () => {
    const { user } = await renderMatching();
    await runAndSelect(user, 5);
    expect(screen.getByRole('button', { name: copy.sendPool })).toBeDisabled();
    const boxes = screen.getAllByRole('checkbox');
    await user.click(boxes[5]);
    expect(screen.getByRole('button', { name: copy.sendPool })).toBeEnabled();
  });

  /* ── F1 — the engine ───────────────────────────────────────────────────── */

  it('J-17/F1/AC-2: a candidate failing ANY exclusionary criterion is excluded entirely, with the reason shown', async () => {
    const { user } = await renderMatching();
    await user.click(screen.getByRole('button', { name: copy.runEngine }));
    await screen.findByText(copy.excludedHeading);

    // All four exclusionary rows are demonstrated by the seed.
    expect(screen.getByText(copy.exclusionReasons.specialization)).toBeInTheDocument();
    expect(screen.getByText(copy.exclusionReasons.location)).toBeInTheDocument();
    expect(screen.getByText(copy.exclusionReasons['schedule-conflict'])).toBeInTheDocument();
    expect(screen.getByText(copy.exclusionReasons['file-status'])).toBeInTheDocument();

    // An excluded candidate is NOT selectable — not merely ranked last.
    const excluded = screen.getByText(copy.excludedHeading).closest('div') as HTMLElement;
    expect(within(excluded).queryByRole('checkbox')).not.toBeInTheDocument();
  });

  it('J-17/F1/AC-3: the weighted breakdown behind each rank is visible, and no weight excludes anyone', async () => {
    const { user } = await renderMatching();
    await user.click(screen.getByRole('button', { name: copy.runEngine }));
    await screen.findByText(/نسخة مبدئية/);
    // Every weighted criterion is named beside the candidates it ranked.
    for (const criterion of ['language', 'delivery-mode', 'evaluation'] as const) {
      expect(screen.getAllByText(new RegExp(copy.criteria[criterion])).length).toBeGreaterThan(0);
    }
    // A trainer who delivers in neither the plan's language nor its mode still
    // appears — a weighted criterion cannot remove anyone on its own.
    expect(screen.getAllByRole('checkbox').length).toBe(6);
  });

  it('DM-GAP-05: the matching model is named as unapproved configuration', async () => {
    const { user } = await renderMatching();
    await user.click(screen.getByRole('button', { name: copy.runEngine }));
    expect(await screen.findByText(copy.modelVersion(''))).toBeInTheDocument();
  });

  it('J-17/F1/AC-4: one cycle produces one pool sized to the headcount, not one per slot', async () => {
    const { user } = await renderMatching();
    await user.click(screen.getByRole('button', { name: copy.runEngine }));
    await screen.findByText(/نسخة مبدئية/);
    // A single ranked list of six, not two lists of three.
    expect(screen.getAllByRole('checkbox')).toHaveLength(6);
    expect(screen.getByText(copy.selectedCount(0, 6))).toBeInTheDocument();
  });

  /* ── F3 — sending ──────────────────────────────────────────────────────── */

  it('J-17/F3/AC-1: the pool is sent as one batch — there is no per-candidate send', async () => {
    const { user } = await renderMatching();
    await runAndSelect(user, 6);
    expect(screen.getByText(copy.sendNote)).toBeInTheDocument();
    // Exactly one send control, for the whole pool.
    expect(screen.getAllByRole('button', { name: copy.sendPool })).toHaveLength(1);

    await user.click(screen.getByRole('button', { name: copy.sendPool }));
    expect(await screen.findByText(copy.poolSentTitle)).toBeInTheDocument();
  });

  it('J-17/F3/AC-2: each candidate carries their price and a link to their identity card', async () => {
    const { user } = await renderMatching();
    await user.click(screen.getByRole('button', { name: copy.runEngine }));
    await screen.findByText(/نسخة مبدئية/);
    expect(screen.getAllByText(new RegExp(copy.priceLabel)).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/AGR-2026-/).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: copy.identityCardLink }).length).toBeGreaterThan(0);
  });

  /* ── F4 — the requesting party ─────────────────────────────────────────── */

  it('J-17/F4/AC-1: each candidate is decided individually — there is no group verdict', async () => {
    const { user } = await renderMatching();
    await runAndSelect(user, 6);
    await user.click(screen.getByRole('button', { name: copy.sendPool }));
    await screen.findByText(copy.decisionHeading);

    // One approve and one reject per candidate; no "approve all".
    expect(screen.getAllByRole('button', { name: copy.approve })).toHaveLength(6);
    const buttons = screen.getAllByRole('button').map((b) => b.textContent ?? '');
    expect(buttons.some((label) => /قبول الكل|رفض الكل/.test(label))).toBe(false);
  });

  it('J-17/F4: an undecided candidate blocks the decision', () => {
    const members: PoolMemberDto[] = ['a', 'b'].map((id) => ({
      trainerId: id,
      name: id,
      price: { inClass: 1, online: 1, currency: 'SAR', agreementReference: 'AGR' },
      decision: 'pending',
      preferenceRank: null,
    }));
    const issues = validatePoolDecision(
      { decisions: [{ trainerId: 'a', decision: 'approved' }], preferenceOrder: ['a'] },
      members
    );
    expect(issues).toContain('decisions-incomplete');
  });

  it('J-17/F4/AC-2: the preference order must be exactly the approved candidates', () => {
    const members: PoolMemberDto[] = ['a', 'b'].map((id) => ({
      trainerId: id,
      name: id,
      price: { inClass: 1, online: 1, currency: 'SAR', agreementReference: 'AGR' },
      decision: 'pending',
      preferenceRank: null,
    }));
    const issues = validatePoolDecision(
      {
        decisions: [
          { trainerId: 'a', decision: 'approved' },
          { trainerId: 'b', decision: 'rejected' },
        ],
        // 'b' was rejected, so ranking it is a mismatch.
        preferenceOrder: ['a', 'b'],
      },
      members
    );
    expect(issues).toContain('ranking-mismatch');
  });

  it('J-17/F4/AC-3: rejecting every candidate restarts the cycle', () => {
    const members: PoolMemberDto[] = ['a', 'b'].map((id) => ({
      trainerId: id,
      name: id,
      price: { inClass: 1, online: 1, currency: 'SAR', agreementReference: 'AGR' },
      decision: 'rejected',
      preferenceRank: null,
    }));
    expect(isFullRejection(members)).toBe(true);
    // A mixed pool is not a full rejection.
    expect(isFullRejection([{ ...members[0], decision: 'approved' }, members[1]])).toBe(false);
  });

  it('J-17/F4/AC-4: the top-ranked go forward per slot; the rest are ranked backups', () => {
    const members: PoolMemberDto[] = [1, 2, 3].map((rank) => ({
      trainerId: `t${rank}`,
      name: `t${rank}`,
      price: { inClass: 1, online: 1, currency: 'SAR', agreementReference: 'AGR' },
      decision: 'approved',
      preferenceRank: rank,
    }));
    const forward = candidatesGoingForward(members, 2);
    expect(forward.map((member) => member.trainerId)).toEqual(['t1', 't2']);
  });

  it('J-17/F4: approving and ranking produces a decided pool with the outcome shown', async () => {
    const { user } = await renderMatching();
    await runAndSelect(user, 6);
    await user.click(screen.getByRole('button', { name: copy.sendPool }));
    await screen.findByText(copy.decisionHeading);

    const approveButtons = screen.getAllByRole('button', { name: copy.approve });
    const rejectButtons = screen.getAllByRole('button', { name: copy.reject });
    // Approve the first two, reject the rest.
    await user.click(approveButtons[0]);
    await user.click(approveButtons[1]);
    for (let index = 2; index < rejectButtons.length; index += 1) {
      await user.click(rejectButtons[index]);
    }
    // Rank the two approved.
    const rankSelects = screen.getAllByRole('combobox');
    await user.click(rankSelects[0]);
    await user.click(await screen.findByRole('option', { name: '1' }));
    await user.click(screen.getAllByRole('combobox')[1]);
    await user.click(await screen.findByRole('option', { name: '2' }));

    await user.click(screen.getByRole('button', { name: copy.submitDecision }));
    expect(await screen.findByText(copy.decidedHeading)).toBeInTheDocument();
    expect(screen.getAllByText(copy.goingForward).length).toBe(2);
  });

  it('sends focus to the outcome after deciding, not back up to the page title', async () => {
    const { user } = await renderMatching();
    await runAndSelect(user, 6);
    await user.click(screen.getByRole('button', { name: copy.sendPool }));
    await screen.findByText(copy.decisionHeading);

    const approveButtons = screen.getAllByRole('button', { name: copy.approve });
    const rejectButtons = screen.getAllByRole('button', { name: copy.reject });
    await user.click(approveButtons[0]);
    for (let index = 1; index < rejectButtons.length; index += 1) {
      await user.click(rejectButtons[index]);
    }
    const rankSelect = screen.getAllByRole('combobox')[0];
    await user.click(rankSelect);
    await user.click(await screen.findByRole('option', { name: '1' }));

    await user.click(screen.getByRole('button', { name: copy.submitDecision }));
    const outcome = await screen.findByRole('heading', { name: copy.decidedHeading });

    /*
      Deciding bumps `reloadKey`, so `phase` cycles ready → loading → ready.
      An unguarded focus effect sent the reader back to the page title from the
      bottom of a ~1340px page — a focus move they never asked for. Focus
      belongs on the thing their decision produced.
    */
    expect(outcome).toHaveFocus();
    expect(screen.getByRole('heading', { level: 1, name: copy.heading })).not.toHaveFocus();
  });

  /* ── P-J9 — two actors ─────────────────────────────────────────────────── */

  it('P-J9: a viewer who may not match is told so, rather than shown a broken workspace', async () => {
    await renderMatching({ viewer: { canMatch: false, canApprove: false } });
    expect(screen.getByText(copy.notAuthorized)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: copy.runEngine })).not.toBeInTheDocument();
  });

  /* ── navigation + a11y ─────────────────────────────────────────────────── */

  it('the list links each request into the matching workspace', async () => {
    seedExpertHubSession(['internal']);
    renderExpertHubAt(expertHubPaths.internalAssignments);
    const link = await screen.findByRole('link', { name: 'EH-ASG-2026-0018' });
    expect(link).toHaveAttribute('href', expertHubPaths.internalAssignmentMatching('asg-001'));
  });

  it('renders RTL by default and has no automatically-detectable a11y violations', async () => {
    const { container, user } = await renderMatching();
    await user.click(screen.getByRole('button', { name: copy.runEngine }));
    await screen.findByText(/نسخة مبدئية/);
    expect(document.documentElement).toHaveAttribute('dir', 'rtl');
    await expectNoA11yViolations(container);
  });
});
