import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { Result } from '@/types';
import { formatDate } from '../../shared/formatting';
import cycleFixture from '../../contracts/fixtures/internal.slot-cycle.json';
import poolFixture from '../../contracts/fixtures/internal.candidate-pool.json';
import {
  clearExpertHubSession,
  renderExpertHubAt,
  screen,
  seedExpertHubSession,
  waitFor,
  within,
} from '../../test/renderExpertHub';
import { expertHubPaths } from '../../app/router/paths';
import type { ExpertHubApiClient, ExpertHubApiError } from '../../shared/services/apiClient';
import type { MatchCandidateDto, MatchingRunDto } from '../assignments/matching.types';
import { createMockReRoutingProvider } from './mockReRoutingProvider';
import { getReRoutingContent } from './reRouting.content';
import { createHttpReRoutingProvider, setReRoutingServiceForTesting } from './reRoutingService';

/**
 * J-19 **contract** tests. The page is rendered from the API's real responses
 * (`contracts/fixtures/`), served through the real HTTP provider over a fake
 * `ExpertHubApiClient` — so a field the page reads that the server does not
 * send fails here, and not in production. Variants change values only, never
 * the shape.
 */

const content = getReRoutingContent('ar');
const REQUEST = 'b0d5f4dd-ed54-499f-b6a1-7f350dab9024';
const SLOT = cycleFixture.slotNumber;
const BASE = `v1/internal/assignment-requests/${REQUEST}/slots/${String(SLOT)}`;
const [first, second, third] = cycleFixture.pool.members;

/* ── the wire, as the server answers it ─────────────────────────────────── */

/** Slot ran out, no pool sent yet in this cycle. */
const exhaustedWire = {
  ...cycleFixture,
  status: 'exhausted',
  pool: { ...cycleFixture.pool, status: 'not-built', members: [], sentAt: null },
  cycles: [{ ...cycleFixture.cycles[0], status: 'exhausted', poolId: null }],
};

/** The requesting party approved; J-18 runs again, so the slot is no longer exhausted. */
const decidedWire = {
  ...cycleFixture,
  status: 'decided',
  exhausted: false,
  pool: {
    ...cycleFixture.pool,
    status: 'decided',
    members: cycleFixture.pool.members.map((member, index) =>
      index === 0
        ? { ...member, decision: 'approved', preferenceRank: 1 }
        : { ...member, decision: 'rejected' }
    ),
  },
  cycles: [{ ...cycleFixture.cycles[0], status: 'decided' }],
};

/** Every candidate rejected: the pool is decided, and cycle 2 opened exhausted. */
const reExhaustedWire = {
  ...cycleFixture,
  cycleNumber: 2,
  status: 'exhausted',
  pool: {
    ...cycleFixture.pool,
    status: 'decided',
    members: cycleFixture.pool.members.map((member) => ({ ...member, decision: 'rejected' })),
  },
  cycles: [
    { ...cycleFixture.cycles[0], status: 'decided' },
    { ...cycleFixture.cycles[0], cycleNumber: 2, status: 'exhausted' },
  ],
};

/** `MatchingRunWire` (J-17's, unchanged) ranking the fixture's own trainers. */
const RUN: MatchingRunDto = {
  model: {
    version: 'v1',
    weights: { language: 34, 'delivery-mode': 33, evaluation: 33 },
    tieBreakNote: null,
  },
  ranked: cycleFixture.pool.members.map((member) => candidate(member.trainerId, member.name)),
  excluded: [],
  requiredPoolSize: 3,
};

/* ── a fake API client behind the real HTTP provider ────────────────────── */

interface Call {
  readonly method: 'GET' | 'POST';
  readonly path: string;
  readonly body?: unknown;
}

type Answer = Result<unknown, ExpertHubApiError>;
const ok = (value: unknown): Answer => ({ ok: true, value });

function serveApi(respond: (call: Call, calls: readonly Call[]) => Answer): Call[] {
  const calls: Call[] = [];
  const answer = <T,>(call: Call) => {
    calls.push(call);
    return Promise.resolve(respond(call, calls) as Result<T, ExpertHubApiError>);
  };
  const client: ExpertHubApiClient = {
    get<T>(path: string) {
      return answer<T>({ method: 'GET', path });
    },
    post<T>(path: string, body?: unknown) {
      return answer<T>({ method: 'POST', path, body });
    },
  };
  setReRoutingServiceForTesting(createHttpReRoutingProvider(client));
  return calls;
}

/** Serves one cycle for every GET; POSTs must be answered by `post`. */
function serveCycle(cycle: unknown, post: (call: Call) => Answer = () => ok(poolFixture)) {
  return serveApi((call) => (call.method === 'GET' ? ok(cycle) : post(call)));
}

const cycleReads = (calls: readonly Call[]) =>
  calls.filter((call) => call.method === 'GET' && call.path === `${BASE}/cycle`);

async function renderPage() {
  seedExpertHubSession(['internal']);
  const result = renderExpertHubAt(expertHubPaths.internalSlotReRouting(REQUEST, SLOT));
  await screen.findByRole('heading', { level: 1, name: content.heading });
  return result;
}

/** The candidates offered for selection — scoped, so no other checkbox is ticked. */
async function matchingCheckboxes() {
  const panel = screen.getByRole('region', { name: content.matchHeading });
  return within(panel).findAllByRole('checkbox');
}

function candidate(trainerId: string, name: string): MatchCandidateDto {
  return {
    trainerId,
    name,
    classification: 'senior',
    evaluationOverall: null,
    scores: [],
    totalScore: 0,
    price: { inClass: null, online: null, currency: 'SAR', agreementReference: '' },
  };
}

/** Recursively compares object keys; leaves and empty arrays are values, not shape. */
function shapeMismatches(actual: unknown, expected: unknown, path = '$'): string[] {
  if (Array.isArray(actual) && Array.isArray(expected)) {
    return actual.length === 0 || expected.length === 0
      ? []
      : shapeMismatches(actual[0], expected[0], `${path}[0]`);
  }
  const isObject = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value != null && !Array.isArray(value);
  if (!isObject(actual) || !isObject(expected)) {
    return [];
  }
  const keys = Object.keys(expected).sort();
  if (Object.keys(actual).sort().join() !== keys.join()) {
    return [`${path}: [${Object.keys(actual).sort().join()}] ≠ [${keys.join()}]`];
  }
  return keys.flatMap((key) => shapeMismatches(actual[key], expected[key], `${path}.${key}`));
}

describe('J-19 contract — the page against the real slot-cycle API', () => {
  beforeEach(() => {
    clearExpertHubSession();
  });

  afterEach(() => {
    setReRoutingServiceForTesting(null);
  });

  it('renders the real awaiting_approval cycle: reference, cycle, who was offered, the decision panel', async () => {
    const calls = serveCycle(cycleFixture);
    await renderPage();

    expect(cycleReads(calls)).toHaveLength(1);
    expect(
      screen.getByText(`${cycleFixture.reference} — ${content.slotLabel(SLOT)}`)
    ).toBeInTheDocument();
    expect(screen.getByText(content.cycleLabel(1))).toBeInTheDocument();
    expect(screen.getAllByText(content.statuses.awaiting_approval).length).toBeGreaterThan(0);

    // Cycle history.
    const cycles = screen.getByRole('region', { name: content.cyclesHeading });
    expect(
      within(cycles).getByText(
        content.cycleRow(1, formatDate(cycleFixture.cycles[0].openedAt, 'ar'))
      )
    ).toBeInTheDocument();

    // Previously offered, with their outcomes.
    const history = screen.getByRole('region', { name: content.historyHeading });
    for (const offer of cycleFixture.previouslyOffered) {
      expect(
        within(history).getByText(
          content.historyRow(offer.trainerName, formatDate(offer.sentAt, 'ar'))
        )
      ).toBeInTheDocument();
    }
    expect(within(history).getAllByText(content.historyOutcomes.rejected)).toHaveLength(2);

    // canApprove → the per-candidate decision; not exhausted → no matching.
    expect(screen.getByText(content.decisionHeading)).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: content.approve })).toHaveLength(3);
    expect(screen.getByText(first.name)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: content.runEngine })).not.toBeInTheDocument();
    // `siblings: []` — a one-slot request has no other slots to reassure about.
    expect(screen.queryByRole('region', { name: content.siblingsHeading })).not.toBeInTheDocument();
  });

  it('shows every sibling state, with no controls', async () => {
    serveCycle({
      ...cycleFixture,
      siblings: [
        { slotNumber: 2, state: 'confirmed' },
        { slotNumber: 3, state: 'awaiting-response' },
        { slotNumber: 4, state: 'exhausted' },
        { slotNumber: 5, state: 'no-offer' },
      ],
    });
    await renderPage();
    const siblings = screen.getByRole('region', { name: content.siblingsHeading });
    for (const state of ['confirmed', 'awaiting-response', 'exhausted', 'no-offer'] as const) {
      expect(within(siblings).getByText(content.siblingStates[state])).toBeInTheDocument();
    }
    expect(within(siblings).getByText(content.siblingRow(5))).toBeInTheDocument();
    expect(within(siblings).queryByRole('button')).not.toBeInTheDocument();
  });

  it('an exhausted slot with a not-built pool opens the slot-scoped matching', async () => {
    serveCycle(exhaustedWire);
    await renderPage();
    expect(screen.getByText(content.exhaustedTitle)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: content.runEngine })).toBeInTheDocument();
    expect(screen.queryByText(content.decisionHeading)).not.toBeInTheDocument();
    expect(screen.queryByText(content.fullRejectionTitle)).not.toBeInTheDocument();
  });

  it('a decided cycle says J-18 restarted and offers no further action', async () => {
    serveCycle(decidedWire);
    await renderPage();
    expect(screen.getByText(content.decidedTitle)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: content.runEngine })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: content.approve })).not.toBeInTheDocument();
  });

  it('a slot that was never exhausted (status null) has nothing to re-route', async () => {
    serveCycle({ ...exhaustedWire, status: null, exhausted: false, cycleNumber: 0, cycles: [] });
    seedExpertHubSession(['internal']);
    renderExpertHubAt(expertHubPaths.internalSlotReRouting(REQUEST, SLOT));
    expect(await screen.findByText(content.errors.noCycleTitle)).toBeInTheDocument();
  });

  it.each([
    ['canApprove: false hides the decision', cycleFixture, content.approve],
    ['canMatch: false hides the matching', exhaustedWire, content.runEngine],
  ])('viewer rights gate the panels — %s', async (_, wire, action) => {
    serveCycle({ ...wire, viewer: { canMatch: false, canApprove: false } });
    await renderPage();
    expect(screen.getByText(content.notAuthorized)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: action })).not.toBeInTheDocument();
  });

  it('deciding posts { decisions, preferenceOrder } and then re-reads the cycle', async () => {
    const calls = serveApi((call, all) => {
      if (call.method === 'POST') {
        return ok(poolFixture);
      }
      return ok(all.some((earlier) => earlier.method === 'POST') ? decidedWire : cycleFixture);
    });
    const { user } = await renderPage();

    const approve = screen.getAllByRole('button', { name: content.approve });
    const reject = screen.getAllByRole('button', { name: content.reject });
    await user.click(approve[0]);
    await user.click(reject[1]);
    await user.click(reject[2]);
    await user.click(screen.getByRole('combobox', { name: content.rankLabel(first.name) }));
    await user.click(await screen.findByRole('option', { name: '1' }));
    await user.click(screen.getByRole('button', { name: content.submitDecision }));

    expect(await screen.findByText(content.decidedTitle)).toBeInTheDocument();
    const post = calls.find((call) => call.method === 'POST');
    expect(post).toEqual({
      method: 'POST',
      path: `${BASE}/pool/decision`,
      body: {
        decisions: [
          { trainerId: first.trainerId, decision: 'approved' },
          { trainerId: second.trainerId, decision: 'rejected' },
          { trainerId: third.trainerId, decision: 'rejected' },
        ],
        preferenceOrder: [first.trainerId],
      },
    });
    expect(calls.at(-1)).toEqual({ method: 'GET', path: `${BASE}/cycle` });
    expect(cycleReads(calls)).toHaveLength(2);
  });

  it('rejecting every candidate is a decision: the re-read cycle is exhausted again, in cycle 2', async () => {
    const calls = serveApi((call, all) => {
      if (call.method === 'POST') {
        return ok(poolFixture);
      }
      return ok(all.some((earlier) => earlier.method === 'POST') ? reExhaustedWire : cycleFixture);
    });
    const { user } = await renderPage();

    for (const button of screen.getAllByRole('button', { name: content.reject })) {
      await user.click(button);
    }
    await user.click(screen.getByRole('button', { name: content.submitDecision }));

    expect(await screen.findByText(content.fullRejectionTitle)).toBeInTheDocument();
    expect(screen.getByText(content.cycleLabel(2))).toBeInTheDocument();
    expect(screen.getByRole('button', { name: content.runEngine })).toBeInTheDocument();
    expect(calls.find((call) => call.method === 'POST')?.body).toEqual({
      decisions: cycleFixture.pool.members.map((member) => ({
        trainerId: member.trainerId,
        decision: 'rejected',
      })),
      preferenceOrder: [],
    });
  });

  it('sending a pool posts { trainerIds } and then re-reads the cycle', async () => {
    const calls = serveApi((call, all) => {
      if (call.path === `${BASE}/matching/run`) {
        return ok(RUN);
      }
      if (call.method === 'POST') {
        return ok(poolFixture);
      }
      return ok(
        all.some((earlier) => earlier.path === `${BASE}/pool`) ? cycleFixture : exhaustedWire
      );
    });
    const { user } = await renderPage();

    await user.click(screen.getByRole('button', { name: content.runEngine }));
    for (const box of await matchingCheckboxes()) {
      await user.click(box);
    }
    await user.click(screen.getByRole('button', { name: content.sendPool }));

    expect(await screen.findByText(content.decisionHeading)).toBeInTheDocument();
    expect(calls.find((call) => call.path === `${BASE}/pool`)).toEqual({
      method: 'POST',
      path: `${BASE}/pool`,
      body: { trainerIds: cycleFixture.pool.members.map((member) => member.trainerId) },
    });
    expect(calls.at(-1)).toEqual({ method: 'GET', path: `${BASE}/cycle` });
  });

  it.each([
    [400, 'pool-size', content.errors.server['pool-size'], 1],
    [400, 'excluded-candidate', content.errors.server['excluded-candidate'], 1],
    [409, 'Already decided.', content.errors.staleState, 2],
  ])(
    'a %i "%s" on send is explained, and a 409 re-reads the slot',
    async (status, message, copy, reads) => {
      const calls = serveCycle(exhaustedWire, (call) =>
        call.path === `${BASE}/matching/run` ? ok(RUN) : { ok: false, error: { status, message } }
      );
      const { user } = await renderPage();

      await user.click(screen.getByRole('button', { name: content.runEngine }));
      for (const box of await matchingCheckboxes()) {
        await user.click(box);
      }
      await user.click(screen.getByRole('button', { name: content.sendPool }));

      expect(await screen.findByRole('alert')).toHaveTextContent(copy);
      await waitFor(() => expect(cycleReads(calls)).toHaveLength(reads));
    }
  );

  it('the mock provider serves exactly the fixture shapes', async () => {
    const mock = createMockReRoutingProvider({ latencyMs: 0 });
    const trainerIds = ['trn-101', 'trn-104', 'trn-111'];

    const sent = await mock.sendSlotPool('asg-001', 1, { trainerIds });
    const awaiting = await mock.getSlotCycle('asg-001', 1);
    const decided = await mock.decideSlotPool('asg-001', 1, {
      decisions: trainerIds.map((trainerId) => ({ trainerId, decision: 'rejected' as const })),
      preferenceOrder: [],
    });
    const confirmedSibling = await mock.getSlotCycle('asg-001', 2);

    expect(sent.ok && awaiting.ok && decided.ok && confirmedSibling.ok).toBe(true);
    if (!sent.ok || !awaiting.ok || !decided.ok || !confirmedSibling.ok) {
      return;
    }
    expect(shapeMismatches(sent.value, poolFixture)).toEqual([]);
    expect(shapeMismatches(decided.value, poolFixture)).toEqual([]);
    expect(shapeMismatches(awaiting.value, cycleFixture)).toEqual([]);
    expect(shapeMismatches(confirmedSibling.value, cycleFixture)).toEqual([]);
    expect(awaiting.value.status).toBe(cycleFixture.status);
  });
});
