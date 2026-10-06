import type { ExpertHubApiError } from '../../shared/services/apiClient';
import {
  poolSizeFor,
  type CandidatePoolDto,
  type ExcludedCandidateDto,
  type MatchCandidateDto,
  type MatchExclusionReason,
  type MatchingModelDto,
  type PoolDecisionInput,
  type PoolMemberDto,
  type SendPoolInput,
  type WeightedCriterionScore,
} from '../assignments/matching.types';
import type { ReRoutingService } from './reRoutingService';
import {
  RE_MATCH_HEADCOUNT,
  SLOT_CYCLE_STATUS,
  type PreviousOfferDto,
  type SiblingSlotState,
  type SlotCycleDto,
  type SlotCycleEntryDto,
} from './reRouting.types';

/**
 * Versioned **mock** provider for J-19. It serves exactly the wire shapes of the
 * real API (`contracts/fixtures/internal.slot-cycle.json` and
 * `internal.candidate-pool.json` — `ReRouting.contract.test.tsx` holds it to
 * them) and seeds the situation the journey begins in: a two-slot request where
 * **slot 2 is already confirmed** and **slot 1 has exhausted every approved
 * candidate**.
 *
 * The server's semantics are mirrored, not simplified:
 *
 * - **The cycle opens on exhaustion**, and a send only moves it to
 *   `awaiting_approval`. The pool actions answer with the **pool**, not the
 *   cycle.
 * - **F2/AC-3** — the candidates already offered slot 1 come back in the new
 *   run, ranked normally. Nothing filters on history.
 * - **F3/AC-3** — rejecting the whole new pool decides it, exhausts the slot
 *   again and opens the next cycle. No counter is checked, and there is no
 *   escalation to reach.
 * - **F2/AC-2** — slot 2 is read-only here: it has no cycle (`status: null`),
 *   and nothing below writes to it.
 *
 * ⚠️ MOCK DATA (clearly labelled). ⚠️ Deterministic clock.
 */

/** ⚠️ MOCK — the fixed "today". */
const MOCK_NOW = '2026-08-20T09:00:00Z';

const REQUEST_ID = 'asg-001';
const REFERENCE = 'EH-ASG-2026-0018';
/** The slot J-18 exhausted. */
const EXHAUSTED_SLOT = 1;
/** Its sibling, confirmed before the journey starts. */
const CONFIRMED_SLOT = 2;

/**
 * ⚠️ MOCK — the same unapproved model J-17 serves (`DM-GAP-05`). F2/AC-3 says
 * the re-match uses "the same exclusion rules as the original cycle", and the
 * weights come with it for the same reason.
 */
const MOCK_MODEL: MatchingModelDto = {
  version: 'mock-dm-gap-05-draft.1',
  // The API's seeded model (`Cap05SeedData`), mirrored — one set of numbers, not two.
  weights: { language: 34, 'delivery-mode': 33, evaluation: 33 },
  tieBreakNote: {
    ar: '⚠️ قاعدة كسر التعادل غير معتمدة بعد؛ يُرتَّب المتساوون بحسب التقييم ثم الاسم.',
    en: '⚠️ The tie-breaking rule is not approved yet; ties fall back to evaluation, then name.',
  },
};

interface MockSeed {
  readonly trainerId: string;
  readonly name: string;
  readonly classification: 'expert' | 'senior' | 'certified';
  readonly evaluationOverall: number | null;
  /** Rows 1–4 — the exclusionary criteria this candidate fails *today*. */
  readonly exclusions: readonly MatchExclusionReason[];
  /** Rows 5–7 — the weighted contributions, pre-computed for the seeded plan. */
  readonly raw: Readonly<Record<'language' | 'delivery-mode' | 'evaluation', number>>;
  readonly priceInClass: number | null;
  readonly priceOnline: number | null;
  readonly agreementReference: string;
}

/**
 * ⚠️ MOCK trainer base. The first three are the candidates who **already
 * refused slot 1** — they are here, unfiltered, because F2/AC-3 says a prior
 * refusal is not a disqualification.
 */
const MOCK_SEEDS: readonly MockSeed[] = [
  {
    trainerId: 'trn-101',
    name: 'د. سارة العتيبي',
    classification: 'expert',
    evaluationOverall: 4.8,
    exclusions: [],
    raw: { language: 1, 'delivery-mode': 1, evaluation: 0.96 },
    priceInClass: 9000,
    priceOnline: 7000,
    agreementReference: 'AGR-2026-00042',
  },
  {
    trainerId: 'trn-104',
    name: 'أ. ريم القحطاني',
    classification: 'senior',
    evaluationOverall: 4.5,
    exclusions: [],
    raw: { language: 1, 'delivery-mode': 1, evaluation: 0.765 },
    priceInClass: 8000,
    priceOnline: 6500,
    agreementReference: 'AGR-2026-00201',
  },
  {
    trainerId: 'trn-102',
    name: 'أ. خالد المطيري',
    classification: 'senior',
    evaluationOverall: 4.2,
    exclusions: [],
    raw: { language: 1, 'delivery-mode': 1, evaluation: 0.714 },
    priceInClass: 7500,
    priceOnline: null,
    agreementReference: 'AGR-2025-00311',
  },
  {
    trainerId: 'trn-106',
    name: 'أ. هند العنزي',
    classification: 'certified',
    evaluationOverall: null,
    exclusions: [],
    raw: { language: 1, 'delivery-mode': 1, evaluation: 0.35 },
    priceInClass: 5500,
    priceOnline: null,
    agreementReference: 'AGR-2026-00240',
  },
  {
    trainerId: 'trn-111',
    name: 'د. بدر العمري',
    classification: 'expert',
    evaluationOverall: 4.3,
    exclusions: [],
    raw: { language: 1, 'delivery-mode': 1, evaluation: 0.86 },
    priceInClass: 8600,
    priceOnline: 7100,
    agreementReference: 'AGR-2026-00301',
  },
  {
    // F2/AC-3 — "the same exclusion rules apply". Still excluded, still shown.
    trainerId: 'trn-107',
    name: 'أ. ماجد الحربي',
    classification: 'senior',
    evaluationOverall: 4.9,
    exclusions: ['specialization'],
    raw: { language: 1, 'delivery-mode': 1, evaluation: 0.833 },
    priceInClass: 7000,
    priceOnline: null,
    agreementReference: 'AGR-2026-00250',
  },
  {
    // Row 3 — a confirmed engagement now overlaps the plan. Note this is the
    // *current* conflict test, not a memory of a past refusal.
    trainerId: 'trn-109',
    name: 'أ. طارق الزهراني',
    classification: 'senior',
    evaluationOverall: 4.4,
    exclusions: ['schedule-conflict'],
    raw: { language: 1, 'delivery-mode': 1, evaluation: 0.748 },
    priceInClass: 7200,
    priceOnline: null,
    agreementReference: 'AGR-2026-00270',
  },
];

/** ⚠️ MOCK — who was already offered slot 1, and how it ended. */
const SEEDED_OFFERS: readonly PreviousOfferDto[] = [
  {
    offerId: 'off-0101',
    trainerId: 'trn-101',
    trainerName: 'د. سارة العتيبي',
    outcome: 'rejected',
    sentAt: '2026-08-10T09:00:00Z',
    respondedAt: '2026-08-11T09:00:00Z',
  },
  {
    offerId: 'off-0102',
    trainerId: 'trn-104',
    trainerName: 'أ. ريم القحطاني',
    outcome: 'expired',
    sentAt: '2026-08-11T09:00:00Z',
    respondedAt: null,
  },
  {
    offerId: 'off-0103',
    trainerId: 'trn-102',
    trainerName: 'أ. خالد المطيري',
    outcome: 'rejected',
    sentAt: '2026-08-14T09:00:00Z',
    respondedAt: '2026-08-15T09:00:00Z',
  },
];

/** ⚠️ MOCK — slot 2's own accepted offer; every operation here must leave it so. */
const CONFIRMED_OFFER: PreviousOfferDto = {
  offerId: 'off-0201',
  trainerId: 'trn-120',
  trainerName: 'م. نورة الشمري',
  outcome: 'accepted',
  sentAt: '2026-08-10T09:00:00Z',
  respondedAt: '2026-08-12T09:00:00Z',
};

/** The server's `CandidatePoolWire` for a slot that never had a pool. */
const NOT_BUILT: CandidatePoolDto = {
  status: 'not-built',
  members: [],
  sentAt: null,
  requiredHeadcount: RE_MATCH_HEADCOUNT,
};

export interface MockReRoutingProviderOptions {
  readonly latencyMs?: number;
  readonly failWith?: ExpertHubApiError;
  readonly now?: string;
  /** P-J9 — the same two actors as J-17; both granted so one session can walk it. */
  readonly viewer?: { readonly canMatch?: boolean; readonly canApprove?: boolean };
}

function delay(ms: number): Promise<void> {
  return ms <= 0 ? Promise.resolve() : new Promise((resolve) => setTimeout(resolve, ms));
}

/** A ProblemDetails answer, as the API client surfaces it. */
function problem(status: number, message: string) {
  return { ok: false as const, error: { status, message } };
}

function scoresFor(seed: MockSeed): readonly WeightedCriterionScore[] {
  return (['language', 'delivery-mode', 'evaluation'] as const).map((criterion) => ({
    criterion,
    rawScore: seed.raw[criterion],
    weight: MOCK_MODEL.weights[criterion],
    weighted: seed.raw[criterion] * MOCK_MODEL.weights[criterion],
  }));
}

function toCandidate(seed: MockSeed): MatchCandidateDto {
  const scores = scoresFor(seed);
  return {
    trainerId: seed.trainerId,
    name: seed.name,
    classification: seed.classification,
    evaluationOverall: seed.evaluationOverall,
    scores,
    totalScore: scores.reduce((sum, score) => sum + score.weighted, 0),
    price: {
      inClass: seed.priceInClass,
      online: seed.priceOnline,
      currency: 'SAR',
      agreementReference: seed.agreementReference,
    },
  };
}

export function createMockReRoutingProvider(
  options: MockReRoutingProviderOptions = {}
): ReRoutingService {
  const { latencyMs = 300, failWith, now = MOCK_NOW, viewer } = options;

  /* Slot 1's state — the only slot anything here writes. */
  let exhausted = true;
  /** F3/AC-3 — counted, never capped. The first cycle opened when J-18 ran out. */
  let cycles: readonly SlotCycleEntryDto[] = [
    {
      cycleNumber: 1,
      status: SLOT_CYCLE_STATUS.exhausted,
      poolId: null,
      openedAt: '2026-08-18T09:00:00Z',
    },
  ];
  let pool: CandidatePoolDto = NOT_BUILT;
  let poolId: string | null = null;
  let offers: readonly PreviousOfferDto[] = SEEDED_OFFERS;
  let sequence = 0;

  const latest = () => cycles[cycles.length - 1];
  const withLatest = (patch: Partial<SlotCycleEntryDto>) => {
    cycles = [...cycles.slice(0, -1), { ...latest(), ...patch }];
  };

  const slotOneState = (): SiblingSlotState =>
    exhausted
      ? 'exhausted'
      : offers.some((offer) => offer.outcome === 'awaiting-response')
        ? 'awaiting-response'
        : 'no-offer';

  const viewerDto = () => ({
    canMatch: viewer?.canMatch ?? true,
    canApprove: viewer?.canApprove ?? true,
  });

  function cycleFor(slotNumber: number): SlotCycleDto {
    if (slotNumber === CONFIRMED_SLOT) {
      // Never exhausted, so there is no cycle — the server answers 200 with
      // `status: null`, and the page reads that as "nothing to re-route".
      return {
        reference: REFERENCE,
        slotNumber,
        cycleNumber: 0,
        status: null,
        exhausted: false,
        confirmed: true,
        pool: NOT_BUILT,
        cycles: [],
        previouslyOffered: [CONFIRMED_OFFER],
        viewer: viewerDto(),
        siblings: [{ slotNumber: EXHAUSTED_SLOT, state: slotOneState() }],
      };
    }
    return {
      reference: REFERENCE,
      slotNumber,
      cycleNumber: latest().cycleNumber,
      status: latest().status,
      exhausted,
      confirmed: false,
      pool,
      cycles,
      previouslyOffered: offers,
      viewer: viewerDto(),
      // F2/AC-2 — read-only, and unchanged by everything below.
      siblings: [{ slotNumber: CONFIRMED_SLOT, state: 'confirmed' }],
    };
  }

  /** The server's `404`s, and the injected failure every call honours. */
  async function guard(requestId: string, slotNumber: number): Promise<ExpertHubApiError | null> {
    await delay(latencyMs);
    if (failWith != null) {
      return failWith;
    }
    if (requestId !== REQUEST_ID) {
      return { status: 404, message: 'Assignment request not found.' };
    }
    if (slotNumber !== EXHAUSTED_SLOT && slotNumber !== CONFIRMED_SLOT) {
      return { status: 404, message: 'Slot not found.' };
    }
    return null;
  }

  return {
    async getSlotCycle(requestId, slotNumber) {
      const denied = await guard(requestId, slotNumber);
      return denied != null
        ? { ok: false, error: denied }
        : { ok: true, value: cycleFor(slotNumber) };
    },

    async runSlotMatching(requestId, slotNumber) {
      const denied = await guard(requestId, slotNumber);
      if (denied != null) {
        return { ok: false, error: denied };
      }

      const ranked: MatchCandidateDto[] = [];
      const excluded: ExcludedCandidateDto[] = [];
      for (const seed of MOCK_SEEDS) {
        // F2/AC-3 — the ONLY test is whether they fail an exclusionary criterion
        // today. `offers` is not consulted here, and there is nothing in
        // `MatchExclusionReason` that could express "refused before" if it were.
        if (seed.exclusions.length > 0) {
          excluded.push({ trainerId: seed.trainerId, name: seed.name, reasons: seed.exclusions });
        } else {
          ranked.push(toCandidate(seed));
        }
      }
      ranked.sort((a, b) => b.totalScore - a.totalScore);

      return {
        ok: true,
        value: {
          model: MOCK_MODEL,
          ranked,
          excluded,
          // One slot → three candidates.
          requiredPoolSize: poolSizeFor(RE_MATCH_HEADCOUNT),
        },
      };
    },

    async searchSlotCandidates(requestId, slotNumber, query) {
      const denied = await guard(requestId, slotNumber);
      if (denied != null) {
        return { ok: false, error: denied };
      }
      const term = query.trim();
      const items = MOCK_SEEDS.filter(
        (seed) => seed.exclusions.length === 0 && (term === '' || seed.name.includes(term))
      ).map(toCandidate);
      return { ok: true, value: items };
    },

    async sendSlotPool(requestId, slotNumber, input: SendPoolInput) {
      const denied = await guard(requestId, slotNumber);
      if (denied != null) {
        return { ok: false, error: denied };
      }
      // The same size rule as the original cycle, for one slot — «no fewer, no more».
      const trainerIds = [...new Set(input.trainerIds)];
      if (trainerIds.length !== poolSizeFor(RE_MATCH_HEADCOUNT)) {
        return problem(400, 'pool-size');
      }
      // F2/AC-3's other half — the exclusions still bind, on either path.
      const chosen = trainerIds.map((id) => MOCK_SEEDS.find((seed) => seed.trainerId === id));
      if (chosen.some((seed) => seed == null || seed.exclusions.length > 0)) {
        return problem(400, 'excluded-candidate');
      }
      // A decided pool is history only for a slot that ran out again.
      if (slotNumber !== EXHAUSTED_SLOT || (!exhausted && pool.status === 'decided')) {
        return problem(409, 'Already decided.');
      }

      // The cycle opened when the slot ran out; sending only moves it on. (An
      // undecided pool sent again is replaced, as on the server.)
      sequence += 1;
      poolId = `pool-${String(sequence)}`;
      withLatest({ status: SLOT_CYCLE_STATUS.awaitingApproval, poolId });
      const members: PoolMemberDto[] = chosen.map((seed) => ({
        trainerId: seed?.trainerId ?? '',
        name: seed?.name ?? '',
        price: {
          inClass: seed?.priceInClass ?? null,
          online: seed?.priceOnline ?? null,
          currency: 'SAR',
          agreementReference: '',
        },
        decision: 'pending',
        preferenceRank: null,
      }));
      pool = { status: 'sent', members, sentAt: now, requiredHeadcount: RE_MATCH_HEADCOUNT };
      return { ok: true, value: pool };
    },

    async decideSlotPool(requestId, slotNumber, input: PoolDecisionInput) {
      const denied = await guard(requestId, slotNumber);
      if (denied != null) {
        return { ok: false, error: denied };
      }
      if (slotNumber !== EXHAUSTED_SLOT || pool.status !== 'sent') {
        return problem(409, 'No pool awaits a decision.');
      }

      // F4/AC-1 — per candidate; anyone not named stays `pending`.
      const decided = pool.members.map((member) => ({
        ...member,
        decision:
          input.decisions.find((row) => row.trainerId === member.trainerId)?.decision ??
          member.decision,
      }));
      const approvedIds = decided
        .filter((member) => member.decision === 'approved')
        .map((member) => member.trainerId);
      const order = input.preferenceOrder;
      if (
        order.length !== approvedIds.length ||
        new Set(order).size !== order.length ||
        !order.every((id) => approvedIds.includes(id))
      ) {
        return problem(400, 'preference-order-invalid');
      }
      if (approvedIds.length === 0 && decided.some((member) => member.decision === 'pending')) {
        return problem(400, 'no-approved-candidate');
      }

      pool = {
        ...pool,
        status: 'decided',
        members: decided.map((member) => ({
          ...member,
          preferenceRank:
            member.decision === 'approved' ? order.indexOf(member.trainerId) + 1 : null,
        })),
      };
      withLatest({ status: SLOT_CYCLE_STATUS.decided, poolId });

      const next = pool.members.find((member) => member.preferenceRank === 1);
      if (next == null) {
        // F3/AC-3 — rejecting everyone exhausts the slot again, and the next
        // cycle simply opens. Pool rejections are not offers, so the history
        // of who was offered the slot does not grow.
        exhausted = true;
        cycles = [
          ...cycles,
          {
            cycleNumber: latest().cycleNumber + 1,
            status: SLOT_CYCLE_STATUS.exhausted,
            poolId: null,
            openedAt: now,
          },
        ];
      } else {
        // F3/AC-2 — J-18 restarts for this slot with the new top-ranked candidate.
        exhausted = false;
        sequence += 1;
        offers = [
          ...offers,
          {
            offerId: `off-${String(sequence)}`,
            trainerId: next.trainerId,
            trainerName: next.name,
            outcome: 'awaiting-response',
            sentAt: now,
            respondedAt: null,
          },
        ];
      }
      return { ok: true, value: pool };
    },
  };
}

export { MOCK_NOW, EXHAUSTED_SLOT, REQUEST_ID };
