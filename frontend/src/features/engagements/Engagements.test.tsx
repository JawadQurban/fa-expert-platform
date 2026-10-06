import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  clearExpertHubSession,
  expectNoA11yViolations,
  renderExpertHubAt,
  screen,
  seedExpertHubSession,
} from '../../test/renderExpertHub';
import { expertHubPaths } from '../../app/router/paths';
import { setAssignmentServiceForTesting } from '../assignments/assignmentService';
import { createMockAssignmentProvider } from '../assignments/mockAssignmentProvider';
import { getAssignmentsContent } from '../assignments/assignments.content';
import { setEngagementServiceForTesting } from './engagementService';
import { createMockEngagementProvider } from './mockEngagementProvider';
import type { MockEngagementProviderOptions } from './mockEngagementProvider';
import { getEngagementsContent } from './engagements.content';
import {
  isSlotExhausted,
  TRAINING_MATERIAL_STATUSES,
  type AssignmentOfferDto,
} from './offer.types';

const content = getEngagementsContent('ar');

function injectProvider(options: MockEngagementProviderOptions = {}) {
  setEngagementServiceForTesting(createMockEngagementProvider({ latencyMs: 0, ...options }));
}

async function renderPortal(options: MockEngagementProviderOptions = {}) {
  if (Object.keys(options).length > 0) {
    setEngagementServiceForTesting(null);
    injectProvider(options);
  }
  seedExpertHubSession(['trainer']);
  const result = renderExpertHubAt(expertHubPaths.engagements);
  await screen.findByRole('heading', { level: 1, name: content.title });
  return result;
}

/**
 * Walk J-17's matching workspace to a decided pool — the state J-18 begins in.
 * Two approved and ranked, four rejected, on the seeded two-slot request.
 */
async function decideThePool(user: ReturnType<typeof renderExpertHubAt>['user']) {
  const matching = getAssignmentsContent('ar').matching;
  await screen.findByRole('heading', { level: 1, name: matching.heading });
  await user.click(screen.getByRole('button', { name: matching.runEngine }));
  await screen.findByText(/نسخة مبدئية/);
  const boxes = screen.getAllByRole('checkbox');
  for (let index = 0; index < 6; index += 1) {
    await user.click(boxes[index]);
  }
  await user.click(screen.getByRole('button', { name: matching.sendPool }));
  await screen.findByText(matching.decisionHeading);

  const approve = screen.getAllByRole('button', { name: matching.approve });
  const reject = screen.getAllByRole('button', { name: matching.reject });
  await user.click(approve[0]);
  await user.click(approve[1]);
  for (let index = 2; index < reject.length; index += 1) {
    await user.click(reject[index]);
  }
  const ranks = screen.getAllByRole('combobox');
  await user.click(ranks[0]);
  await user.click(await screen.findByRole('option', { name: '1' }));
  await user.click(screen.getAllByRole('combobox')[1]);
  await user.click(await screen.findByRole('option', { name: '2' }));
  await user.click(screen.getByRole('button', { name: matching.submitDecision }));
  await screen.findByText(matching.decidedHeading);
}

describe('EH-TP-07 — Assignment Offer Handling & Response Management (J-18)', () => {
  beforeEach(() => {
    clearExpertHubSession();
    injectProvider();
  });

  afterEach(() => {
    setEngagementServiceForTesting(null);
  });

  /* ── F1 — the offer exists without anyone sending it ───────────────────── */

  it('J-18/F1/AC-1: the contract has no way to send an offer', () => {
    const service = createMockEngagementProvider({ latencyMs: 0 });
    // The rule is that sending is automatic and needs "no additional manual
    // staff action" — encoded as the absence of the operation, not a guard.
    expect(Object.keys(service)).not.toContain('sendOffer');
    expect(Object.keys(service)).toEqual([
      'listMyOffers',
      'listMyEngagements',
      'respondToOffer',
      'getRequestSlots',
    ]);
  });

  it('J-18/F1/AC-1: the top-ranked candidate already has an offer, unprompted', async () => {
    await renderPortal();
    expect(
      await screen.findByRole('heading', { level: 3, name: 'برنامج القيادة' })
    ).toBeInTheDocument();
  });

  it('J-18/F1/AC-2: only one live offer per slot — backups hold nothing', async () => {
    const service = createMockEngagementProvider({ latencyMs: 0 });
    const result = await service.getRequestSlots('asg-001');
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    for (const slot of result.value) {
      expect(slot.currentOffer).not.toBeNull();
      // Backups are ranked and waiting; none of them carries an offer.
      expect(slot.backups.every((backup) => backup.preferenceRank > 0)).toBe(true);
    }
    // The two slots hold two *different* live offers, one each.
    const trainers = result.value.map((slot) => slot.currentOffer?.trainerId);
    expect(new Set(trainers).size).toBe(result.value.length);
  });

  it('J-18/F1/AC-3: the offer carries the request detail', async () => {
    await renderPortal();
    expect(await screen.findByText(content.fields.reference)).toBeInTheDocument();
    expect(screen.getByText(content.fields.specialization)).toBeInTheDocument();
    expect(screen.getByText(content.fields.language)).toBeInTheDocument();
    expect(screen.getByText(content.fields.deliveryMode)).toBeInTheDocument();
    expect(screen.getByText(content.fields.schedule)).toBeInTheDocument();
  });

  /* ── F2 — the 3-day window, and the two ways it ends ───────────────────── */

  it('J-18/F2/AC-1: the response window is shown, and it is three days', async () => {
    await renderPortal();
    expect(await screen.findByText(content.offers.windowNote)).toBeInTheDocument();
    expect(screen.getByText(content.offers.slaRemaining(3))).toBeInTheDocument();
  });

  it('J-18/F2/AC-1: accept and reject are the only two answers offered', async () => {
    await renderPortal();
    expect(await screen.findByRole('button', { name: content.offers.accept })).toBeEnabled();
    expect(screen.getByRole('button', { name: content.offers.reject })).toBeEnabled();
  });

  it('J-18/F2/AC-2: rejecting moves the offer to the next-ranked candidate', async () => {
    const service = createMockEngagementProvider({ latencyMs: 0 });
    const before = await service.getRequestSlots('asg-001');
    expect(before.ok).toBe(true);
    if (!before.ok) {
      return;
    }
    const offerId = before.value[0].currentOffer?.offerId ?? '';
    const backup = before.value[0].backups[0]?.trainerId;

    await service.respondToOffer(offerId, { response: 'reject' });

    const after = await service.getRequestSlots('asg-001');
    expect(after.ok).toBe(true);
    if (!after.ok) {
      return;
    }
    expect(after.value[0].currentOffer?.trainerId).toBe(backup);
    expect(after.value[0].history[0].status).toBe('rejected');
  });

  it('J-18/F2/AC-3 + AC-4: expiry advances the slot too, and is recorded distinctly', async () => {
    // The window has already elapsed on slot 1 — no user action is involved.
    const service = createMockEngagementProvider({ latencyMs: 0, expireFirstOffer: true });
    const result = await service.getRequestSlots('asg-001');
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    const [slot] = result.value;
    expect(slot.history[0].status).toBe('expired');
    // Same effect as rejection — the next-ranked candidate now holds the offer.
    expect(slot.currentOffer).not.toBeNull();
    // …and a *different* outcome from rejection, which is what lets the two
    // notifications differ (AC-4).
    expect(content.tracking.outcomes.expired).not.toBe(content.tracking.outcomes.rejected);
  });

  it('a trainer cannot answer an offer that is not theirs', async () => {
    const service = createMockEngagementProvider({ latencyMs: 0 });
    const slots = await service.getRequestSlots('asg-001');
    if (!slots.ok) {
      return;
    }
    // Slot 2's live offer belongs to the next-ranked candidate, not this portal —
    // and the server answers as if it did not exist.
    const other = slots.value[1].currentOffer?.offerId ?? '';
    const result = await service.respondToOffer(other, { response: 'accept' });
    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    expect(result.error.status).toBe(404);
  });

  it('J-18/F2/AC-3: an offer that lapsed while the page was open cannot be answered', async () => {
    const service = createMockEngagementProvider({ latencyMs: 0, expireFirstOffer: true });
    const stale = await service.respondToOffer('ofr-001', { response: 'accept' });
    expect(stale.ok).toBe(false);
    if (stale.ok) {
      return;
    }
    expect(stale.error).toEqual({ status: 409, message: 'The response window has closed.' });
  });

  it('J-18/F2/AC-5: a slot with nothing left is exhausted — J-19s trigger', () => {
    const base = {
      currentOffer: null as AssignmentOfferDto | null,
      backups: [],
      confirmedTrainerId: null as string | null,
    };
    expect(isSlotExhausted(base)).toBe(true);
    expect(isSlotExhausted({ ...base, confirmedTrainerId: 'trn-101' })).toBe(false);
    expect(
      isSlotExhausted({
        ...base,
        backups: [{ trainerId: 'trn-102', trainerName: 'x', preferenceRank: 2 }],
      })
    ).toBe(false);
  });

  it('J-18/F2/AC-5: it takes every candidate refusing before the slot runs dry', async () => {
    // One seeded portal standing in for all three ranked candidates, so the slot
    // can be walked to the end without simulating three separate sessions.
    const service = createMockEngagementProvider({
      latencyMs: 0,
      trainerIds: ['trn-101', 'trn-104', 'trn-102'],
    });
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const slots = await service.getRequestSlots('asg-001');
      if (!slots.ok) {
        return;
      }
      const live = slots.value[0].currentOffer;
      if (live == null) {
        break;
      }
      await service.respondToOffer(live.offerId, { response: 'reject' });
    }
    const final = await service.getRequestSlots('asg-001');
    expect(final.ok).toBe(true);
    if (!final.ok) {
      return;
    }
    expect(final.value[0].exhausted).toBe(true);
  });

  /* ── F3 — confirmation and "My Engagements" ────────────────────────────── */

  it('J-18/F3: accepting confirms the engagement and it appears immediately', async () => {
    const { user } = await renderPortal();
    await user.click(await screen.findByRole('button', { name: content.offers.accept }));
    expect(await screen.findByText(content.offers.acceptedTitle)).toBeInTheDocument();
    // F3/AC-2 — in the section the journey names.
    expect(
      screen.getByRole('heading', { level: 2, name: content.engagements.heading })
    ).toBeInTheDocument();
    expect(await screen.findByText(content.engagements.materialHeading)).toBeInTheDocument();
  });

  it('J-18/F3: answering an offer moves focus to the section the result lands in', async () => {
    const { user } = await renderPortal();
    await user.click(await screen.findByRole('button', { name: content.offers.accept }));

    /*
      Answering reloads the list, so the trainer must be told where the result
      went rather than left at a button that no longer exists.

      ⚠️ This pins the focus contract only. It does NOT cover the skeleton
      guard in the load effect — the blank it prevents is a transient frame,
      and this test passes with or without it.
    */
    const heading = await screen.findByRole('heading', {
      level: 2,
      name: content.engagements.heading,
    });
    expect(heading).toHaveFocus();
    expect(screen.getByText(content.offers.acceptedTitle)).toBeInTheDocument();
  });

  it('J-18/F3/AC-2: the section is empty until an offer is accepted', async () => {
    await renderPortal();
    expect(await screen.findByText(content.engagements.emptyTitle)).toBeInTheDocument();
  });

  /* ── F4 — FAST sync, per slot ──────────────────────────────────────────── */

  it('J-18/F4/AC-1: FAST syncs for the confirmed slot alone, not the request', async () => {
    const service = createMockEngagementProvider({ latencyMs: 0 });
    const before = await service.getRequestSlots('asg-001');
    if (!before.ok) {
      return;
    }
    const offerId = before.value[0].currentOffer?.offerId ?? '';
    await service.respondToOffer(offerId, { response: 'accept' });

    const after = await service.getRequestSlots('asg-001');
    expect(after.ok).toBe(true);
    if (!after.ok) {
      return;
    }
    expect(after.value[0].fastSync).toBe('processing');
    // Slot 2 is still awaiting its own answer, and has not been dragged along.
    expect(after.value[1].fastSync).toBe('none');
  });

  /* ── F5 — the training material status ─────────────────────────────────── */

  it('J-18/F5/AC-1: the status is a defined list, never an empty/filled boolean', () => {
    expect(TRAINING_MATERIAL_STATUSES).toEqual([
      'awaiting_upload',
      'pending_approval',
      'changes_requested',
      'approved',
    ]);
  });

  it('J-18/F5/AC-3: a submission awaiting upload opens the upload path', async () => {
    const { user } = await renderPortal({ materialStatus: 'awaiting_upload' });
    await user.click(await screen.findByRole('button', { name: content.offers.accept }));
    expect(await screen.findByText(content.engagements.uploadTitle)).toBeInTheDocument();
    expect(
      screen.getByText(
        `${content.engagements.materialStatusLabel}: ${content.engagements.statuses.awaiting_upload}`
      )
    ).toBeInTheDocument();
  });

  it('J-18/F5: material pending approval is named, and offers no upload', async () => {
    const { user } = await renderPortal({ materialStatus: 'pending_approval' });
    await user.click(await screen.findByRole('button', { name: content.offers.accept }));
    expect(
      await screen.findByText(
        `${content.engagements.materialStatusLabel}: ${content.engagements.statuses.pending_approval}`
      )
    ).toBeInTheDocument();
    expect(screen.queryByText(content.engagements.uploadTitle)).not.toBeInTheDocument();
  });

  /* ── the internal half: tracking responses ─────────────────────────────── */

  it('J-18/F1/AC-1 + F1/AC-2: the tracking panel reports what the system did, and offers no send', async () => {
    setAssignmentServiceForTesting(createMockAssignmentProvider({ latencyMs: 0 }));
    seedExpertHubSession(['internal']);
    const { user } = renderExpertHubAt(expertHubPaths.internalAssignmentMatching('asg-001'));
    await decideThePool(user);

    const tracking = getEngagementsContent('ar').tracking;
    expect(await screen.findByText(tracking.automaticNote)).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: tracking.heading })).toBeInTheDocument();
    // Slot 1 is awaiting the top-ranked candidate's answer…
    expect(screen.getByText(tracking.awaiting('د. سارة العتيبي'))).toBeInTheDocument();
    // …and the backups are listed, ranked, having received nothing. The
    // third-ranked candidate backs up both slots, and holds an offer on neither.
    expect(screen.getAllByText(tracking.backupRow(3, 'أ. خالد المطيري')).length).toBe(2);
    // F4/AC-1 — sync state is per slot, and nothing is confirmed yet.
    expect(screen.getAllByText(`${tracking.fastHeading}: ${tracking.fastStates.none}`).length).toBe(
      2
    );
    // F1/AC-1 — no send action exists anywhere on the page.
    expect(screen.queryByRole('button', { name: /إرسال العرض/ })).not.toBeInTheDocument();

    setAssignmentServiceForTesting(null);
  });

  /* ── accessibility ─────────────────────────────────────────────────────── */

  it('has no detectable accessibility violations', async () => {
    const { container } = await renderPortal();
    await screen.findByRole('heading', { level: 2, name: content.offers.heading });
    await expectNoA11yViolations(container);
  });
});
