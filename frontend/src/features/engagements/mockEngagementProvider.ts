import { buildSlaInstance, SLA_IDS } from '../../shared/sla/mockSlaMatrix';
import type { ExpertHubApiError } from '../../shared/services/apiClient';
import servedOffers from '../../contracts/fixtures/me.assignment-offers.json';
import servedEngagements from '../../contracts/fixtures/me.engagements.json';
import type { EngagementService } from './engagementService';
import {
  isSlotExhausted,
  type AssignmentOfferDto,
  type AssignmentSlotDto,
  type MyEngagementDto,
  type OfferOutcome,
  type RespondToOfferInput,
  type SlotBackupDto,
  type TrainingMaterialStatus,
} from './offer.types';

/**
 * Versioned **mock** provider for J-18. It simulates the server's
 * responsibilities, which is nearly all of this journey:
 *
 * - **Creating offers automatically** for the top-ranked candidate per slot
 *   (F1/AC-1) — nothing in the UI can do this.
 * - **Advancing to the next-ranked backup** on rejection *or* expiry, with the
 *   two kept distinct so their notifications can differ (F2/AC-2 vs AC-4).
 * - **Confirming the engagement and opening its material submission** in one
 *   step on acceptance (F3, F4, F5).
 * - **Marking a slot exhausted** when the ranked list runs out (F2/AC-5), which
 *   is J-19's trigger.
 *
 * Every record is the real API response (`contracts/fixtures/me.assignment-offers.json`,
 * `me.engagements.json`) with only its values changed — the request detail and
 * the unset price (`amount: null`) included — so the mock cannot drift into a
 * shape the server never serves. Its refusals are `EngagementEndpoints.cs`'s:
 * 409 "The response window has closed." / "Already answered.".
 *
 * ⚠️ MOCK DATA (clearly labelled). ⚠️ Deterministic clock — the 3-day response
 * window is measured from a fixed instant so the countdown is reproducible.
 */

/** ⚠️ MOCK — the fixed "today" the 3-day window is measured against. */
const MOCK_NOW = '2026-08-20T09:00:00Z';

/** F2/AC-1 — the response window from the Candidate Response SLA matrix. */
const RESPONSE_WINDOW_DAYS = 3;

/** The served shapes. JSON widens the string unions, so they are narrowed once here. */
const SERVED_OFFER = servedOffers[0] as AssignmentOfferDto;
const SERVED_ENGAGEMENT = servedEngagements[0] as MyEngagementDto;

/**
 * ⚠️ MOCK — the ranked, approved candidates J-17 handed over for the seeded
 * two-slot request. Slot 1 gets the top-ranked; slot 2 the next.
 */
const RANKED = [
  { trainerId: 'trn-101', trainerName: 'د. سارة العتيبي', preferenceRank: 1 },
  { trainerId: 'trn-104', trainerName: 'أ. ريم القحطاني', preferenceRank: 2 },
  { trainerId: 'trn-102', trainerName: 'أ. خالد المطيري', preferenceRank: 3 },
];

/** ⚠️ MOCK — the signed-in trainer in the portal-side tests. */
const ME = 'trn-101';

const REQUEST_ID = 'asg-001';

interface MockSlot {
  slotNumber: number;
  currentOffer: AssignmentOfferDto | null;
  backups: SlotBackupDto[];
  history: AssignmentOfferDto[];
  confirmedTrainerId: string | null;
  confirmedEngagementId: string | null;
  fastSync: AssignmentSlotDto['fastSync'];
}

export interface MockEngagementProviderOptions {
  readonly latencyMs?: number;
  readonly failWith?: ExpertHubApiError;
  readonly now?: string;
  /**
   * Which trainer identities this seeded portal answers for. Production is
   * always exactly one — the signed-in trainer. The mock accepts several so a
   * single test can walk one slot through every ranked candidate without
   * simulating a separate session per person.
   */
  readonly trainerIds?: readonly string[];
  /**
   * F5 — where the confirmed engagement's material submission stands. Defaults
   * to `awaiting_upload`, as a freshly confirmed engagement's does.
   */
  readonly materialStatus?: TrainingMaterialStatus;
  /** Start with the window already elapsed, to exercise F2/AC-3. */
  readonly expireFirstOffer?: boolean;
}

function delay(ms: number): Promise<void> {
  return ms <= 0 ? Promise.resolve() : new Promise((resolve) => setTimeout(resolve, ms));
}

const DAY_MS = 24 * 60 * 60 * 1000;

export function createMockEngagementProvider(
  options: MockEngagementProviderOptions = {}
): EngagementService {
  const {
    latencyMs = 300,
    failWith,
    now = MOCK_NOW,
    trainerIds: owners = [ME],
    materialStatus = 'awaiting_upload',
    expireFirstOffer = false,
  } = options;

  let offerCounter = 0;
  const engagements: MyEngagementDto[] = [];

  /**
   * F2/AC-1 — the 3-day clock, read from the **central** matrix (`SLA-0501`,
   * `BR-0705`) rather than from a constant in this file.
   */
  function slaFor(sentAt: string) {
    return buildSlaInstance(SLA_IDS.assignmentOfferResponse, sentAt, now);
  }

  /**
   * F1/AC-1 — the offer is *created by the system*, never sent by anyone. This
   * function is the whole of "sending": it is called when a slot needs its next
   * candidate, and there is no public operation that reaches it.
   */
  function makeOffer(slot: MockSlot, candidate: SlotBackupDto, sentAt: string): AssignmentOfferDto {
    offerCounter += 1;
    return {
      ...SERVED_OFFER,
      offerId: `ofr-${String(offerCounter).padStart(3, '0')}`,
      requestId: REQUEST_ID,
      slotNumber: slot.slotNumber,
      trainerId: candidate.trainerId,
      trainerName: candidate.trainerName,
      status: 'awaiting-response',
      sentAt,
      responseSla: slaFor(sentAt),
      respondedAt: null,
    };
  }

  /** ⚠️ MOCK slots for the seeded two-slot request. */
  const slots: MockSlot[] = [1, 2].map((slotNumber) => ({
    slotNumber,
    currentOffer: null,
    // F1/AC-2 — slot 1 takes rank 1, slot 2 takes rank 2; rank 3 backs both up.
    backups: RANKED.filter((candidate) => candidate.preferenceRank >= slotNumber).map(
      (candidate) => ({ ...candidate })
    ),
    history: [],
    confirmedTrainerId: null,
    confirmedEngagementId: null,
    fastSync: 'none',
  }));

  /** The server keeps the live offer in the history too, oldest first. */
  function open(slot: MockSlot, offer: AssignmentOfferDto) {
    slot.currentOffer = offer;
    slot.history = [...slot.history, offer];
  }

  // F1/AC-1 — offers exist from the outset because J-17's approval created them.
  // ⚠️ `expireFirstOffer` back-dates slot 1's offer past the window, so the
  // automatic expiry in F2/AC-3 is reachable without waiting three days.
  for (const slot of slots) {
    const next = slot.backups.shift();
    if (next != null) {
      const sentAt =
        expireFirstOffer && slot.slotNumber === 1
          ? new Date(new Date(now).getTime() - 5 * DAY_MS).toISOString()
          : now;
      open(slot, makeOffer(slot, next, sentAt));
    }
  }

  /**
   * F2/AC-2 + AC-3 — **one advance path, two outcomes**. Rejection and expiry
   * have identical effect here, and differ only in the outcome recorded, which
   * is what lets F2/AC-4's distinct notification exist at all.
   */
  function closeAndAdvance(slot: MockSlot, outcome: OfferOutcome) {
    const offer = slot.currentOffer;
    if (offer == null) {
      return;
    }
    slot.history = slot.history.map((entry) =>
      entry.offerId === offer.offerId
        ? { ...entry, status: outcome, respondedAt: now, responseSla: null }
        : entry
    );
    slot.currentOffer = null;

    if (outcome === 'accepted') {
      const engagementId = `eng-${String(slot.slotNumber)}`;
      slot.confirmedTrainerId = offer.trainerId;
      slot.confirmedEngagementId = engagementId;
      // F4/AC-1 — FAST is written for THIS slot immediately, with no waiting for
      // the request's other slots.
      slot.fastSync = 'processing';
      // F3 + F5 — the engagement is confirmed and its material submission opened
      // in the same step.
      engagements.push({
        ...SERVED_ENGAGEMENT,
        engagementId,
        requestId: REQUEST_ID,
        slotNumber: slot.slotNumber,
        confirmedAt: now,
        details: offer.details,
        trainingMaterial: { status: materialStatus, name: offer.details?.programName ?? null },
        // Server-decided in production; mirrored here from `MyEngagementsAsync`.
        canUploadMaterial:
          materialStatus === 'awaiting_upload' || materialStatus === 'changes_requested',
        // J-21/F5/AC-1 — the served plan starts in November, so a freshly
        // confirmed engagement is upcoming.
        lifecycle: 'upcoming',
      });
      // Backups for a filled slot are stood down.
      slot.backups = [];
      return;
    }

    // Rejected or expired — the offer moves to the next-ranked candidate.
    const next = slot.backups.shift();
    if (next != null) {
      open(slot, makeOffer(slot, next, now));
    }
  }

  /**
   * F2/AC-3 — expiry is **automatic**. The server applies it whenever it looks
   * at a slot; nothing in the UI triggers it, and no user action is required for
   * a lapsed offer to advance.
   */
  function applyExpiries() {
    for (const slot of slots) {
      const offer = slot.currentOffer;
      if (offer != null && (offer.responseSla?.daysRemaining ?? 0) < 0) {
        closeAndAdvance(slot, 'expired');
      }
    }
  }

  function toDto(slot: MockSlot): AssignmentSlotDto {
    return {
      slotNumber: slot.slotNumber,
      currentOffer: slot.currentOffer,
      backups: slot.backups,
      history: slot.history,
      confirmedTrainerId: slot.confirmedTrainerId,
      confirmedEngagementId: slot.confirmedEngagementId,
      fastSync: slot.fastSync,
      // F2/AC-5 — the trigger J-19 picks up.
      exhausted: isSlotExhausted(slot),
    };
  }

  return {
    async listMyOffers() {
      await delay(latencyMs);
      if (failWith != null) {
        return { ok: false, error: failWith };
      }
      applyExpiries();
      const mine = slots
        .map((slot) => slot.currentOffer)
        .filter(
          (offer): offer is AssignmentOfferDto => offer != null && owners.includes(offer.trainerId)
        );
      return { ok: true, value: mine };
    },

    async listMyEngagements() {
      await delay(latencyMs);
      if (failWith != null) {
        return { ok: false, error: failWith };
      }
      applyExpiries();
      return { ok: true, value: [...engagements] };
    },

    async respondToOffer(offerId: string, input: RespondToOfferInput) {
      await delay(latencyMs);
      if (failWith != null) {
        return { ok: false, error: failWith };
      }
      const wasOpen = slots.some((candidate) => candidate.currentOffer?.offerId === offerId);
      applyExpiries();
      const slot = slots.find((candidate) => candidate.currentOffer?.offerId === offerId);
      if (slot?.currentOffer == null) {
        // An offer that expired while the page was open is gone, not answerable.
        return {
          ok: false,
          error: {
            status: 409,
            message: wasOpen ? 'The response window has closed.' : 'Already answered.',
          },
        };
      }
      if (!owners.includes(slot.currentOffer.trainerId)) {
        return { ok: false, error: { status: 404, message: 'Offer not found.' } };
      }
      closeAndAdvance(slot, input.response === 'accept' ? 'accepted' : 'rejected');
      return { ok: true, value: [...engagements] };
    },

    async getRequestSlots(requestId: string) {
      await delay(latencyMs);
      if (failWith != null) {
        return { ok: false, error: failWith };
      }
      if (requestId !== REQUEST_ID) {
        return { ok: true, value: [] };
      }
      applyExpiries();
      return { ok: true, value: slots.map(toDto) };
    },
  };
}

export { MOCK_NOW, RESPONSE_WINDOW_DAYS };
