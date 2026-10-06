import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import offers from '../../contracts/fixtures/me.assignment-offers.json';
import engagements from '../../contracts/fixtures/me.engagements.json';
import requestSlots from '../../contracts/fixtures/internal.request-slots.json';
import termination from '../../contracts/fixtures/me.engagement-termination.json';
import { renderWithProviders } from '@/test/test-utils';
import {
  clearExpertHubSession,
  renderExpertHubAt,
  screen,
  seedExpertHubSession,
  within,
} from '../../test/renderExpertHub';
import { expertHubPaths } from '../../app/router/paths';
import { ENGAGEMENT_STATUSES, engagementStatusLabel } from '../../contracts/engagementStatus';
import { fakeApiClient, keyPaths } from '../../contracts/fakeApiClient';
import type { ExpertHubApiError } from '../../shared/services/apiClient';
import {
  createHttpWithdrawalProvider,
  setWithdrawalServiceForTesting,
} from '../withdrawal/withdrawalService';
import { getWithdrawalContent } from '../withdrawal/withdrawal.content';
import { SlotTrackingPanel } from './components/SlotTrackingPanel';
import { createHttpEngagementProvider, setEngagementServiceForTesting } from './engagementService';
import { createMockEngagementProvider } from './mockEngagementProvider';
import { getEngagementsContent } from './engagements.content';
import { TRAINING_MATERIAL_STATUSES } from './offer.types';

/**
 * J-18 (+ J-22/F2) **contract** tests. "My Engagements" and the slot tracking
 * panel run on the REAL HTTP providers, fed the responses the backend's own
 * tests recorded (`contracts/fixtures/`) through a fake `ExpertHubApiClient`. A
 * field a page reads that the server does not send fails here, not in
 * production. Variants change values only, never the shape.
 */

const content = getEngagementsContent('ar');
const withdrawalContent = getWithdrawalContent('ar');
const [offer] = offers;
const [engagement] = engagements;
const [slot] = requestSlots;
const OFFERS = 'v1/me/assignment-offers';
const ENGAGEMENTS = 'v1/me/engagements';
const RESPOND = `v1/me/assignment-offers/${offer.offerId}/response`;
const SLOTS = `v1/internal/assignment-requests/${slot.currentOffer.requestId}/slots`;
const DELINK = `v1/internal/engagements/${engagement.engagementId}/delink`;

/** The served slot once its offer was accepted — the only state de-linking applies to. */
const confirmedSlot = {
  ...slot,
  currentOffer: null,
  backups: [],
  history: slot.history.map((entry) => ({
    ...entry,
    status: 'accepted',
    responseSla: null,
    respondedAt: entry.sentAt,
  })),
  confirmedTrainerId: slot.currentOffer.trainerId,
  confirmedEngagementId: engagement.engagementId,
  fastSync: 'processing',
};

function serve(
  routes: Readonly<Record<string, unknown>>,
  errors: Readonly<Record<string, ExpertHubApiError>> = {}
) {
  const { client, posts } = fakeApiClient(routes, errors);
  setEngagementServiceForTesting(createHttpEngagementProvider(client));
  setWithdrawalServiceForTesting(createHttpWithdrawalProvider(client));
  return posts;
}

async function renderPortal() {
  seedExpertHubSession(['trainer']);
  const result = renderExpertHubAt(expertHubPaths.engagements);
  await screen.findByRole('heading', { level: 1, name: content.title });
  return result;
}

async function renderPanel() {
  const result = renderWithProviders(<SlotTrackingPanel requestId={slot.currentOffer.requestId} />);
  await screen.findByRole('heading', { level: 2, name: content.tracking.heading });
  return result;
}

describe('J-18 contract — offers, "My Engagements" and slot tracking against the real API responses', () => {
  beforeEach(() => {
    clearExpertHubSession();
  });

  afterEach(() => {
    setEngagementServiceForTesting(null);
    setWithdrawalServiceForTesting(null);
  });

  it('the fixtures use the central vocabularies, and the mock serves exactly their keys', async () => {
    expect(ENGAGEMENT_STATUSES).toContain(engagement.lifecycle);
    expect(TRAINING_MATERIAL_STATUSES).toContain(engagement.trainingMaterial.status);

    const mock = createMockEngagementProvider({ latencyMs: 0 });
    const mockOffers = await mock.listMyOffers();
    const mockSlots = await mock.getRequestSlots('asg-001');
    expect(mockOffers.ok && mockSlots.ok).toBe(true);
    if (!mockOffers.ok || !mockSlots.ok) {
      return;
    }
    expect(keyPaths(mockOffers.value)).toEqual(keyPaths(offers));
    expect(keyPaths(mockSlots.value)).toEqual(keyPaths(requestSlots));

    const accepted = await mock.respondToOffer(mockOffers.value[0].offerId, { response: 'accept' });
    expect(accepted.ok).toBe(true);
    if (!accepted.ok) {
      return;
    }
    expect(keyPaths(accepted.value)).toEqual(keyPaths(engagements));
  });

  it('trainer: the served offer renders — programme, reference, SLA countdown, unset price, detail', async () => {
    serve({ [OFFERS]: offers, [ENGAGEMENTS]: [] });
    await renderPortal();

    // Single-language programme name, rendered as given.
    expect(
      screen.getByRole('heading', { level: 3, name: offer.details.programName })
    ).toBeInTheDocument();
    expect(
      screen.getByText(`${offer.details.reference} — ${content.offers.slotLabel(offer.slotNumber)}`)
    ).toBeInTheDocument();
    // P-J4 — the server's countdown, not one computed here.
    expect(
      screen.getByText(content.offers.slaRemaining(offer.responseSla.daysRemaining))
    ).toBeInTheDocument();
    // `DM-GAP-16` — `amount: null` is "not set", never 0.
    expect(
      screen.getByText(`${content.offers.priceLabel}: ${content.offers.priceUnavailable}`)
    ).toBeInTheDocument();
    // The flat request detail: domain code → its label, codes → copy.
    expect(screen.getByText('التحليل المالي والتمويل')).toBeInTheDocument();
    expect(screen.getByText(content.deliveryModes.onsite)).toBeInTheDocument();
    expect(screen.getByText(content.languages.ar)).toBeInTheDocument();
    expect(screen.getByText(offer.details.city)).toBeInTheDocument();
  });

  it('trainer: accepting POSTs { response: "accept" } to the response path', async () => {
    const posts = serve({ [OFFERS]: offers, [ENGAGEMENTS]: engagements, [RESPOND]: engagements });
    const { user } = await renderPortal();

    await user.click(screen.getByRole('button', { name: content.offers.accept }));

    expect(await screen.findByText(content.offers.acceptedTitle)).toBeInTheDocument();
    expect(posts).toEqual([{ path: RESPOND, body: { response: 'accept' } }]);
  });

  it('trainer: a 409 from the response path reads as an offer that is no longer open', async () => {
    serve(
      { [OFFERS]: offers, [ENGAGEMENTS]: [] },
      { [RESPOND]: { status: 409, message: 'The response window has closed.' } }
    );
    const { user } = await renderPortal();

    await user.click(screen.getByRole('button', { name: content.offers.reject }));

    expect(await screen.findByText(content.offers.goneTitle)).toBeInTheDocument();
  });

  it('trainer: the served upcoming engagement sits under "My Engagements" with its status and material', async () => {
    serve({ [OFFERS]: [], [ENGAGEMENTS]: engagements });
    await renderPortal();

    const active = screen.getByRole('region', { name: content.engagements.heading });
    expect(
      within(active).getByRole('heading', { level: 3, name: engagement.details.programName })
    ).toBeInTheDocument();
    expect(within(active).getByText(engagementStatusLabel('upcoming', 'ar'))).toBeInTheDocument();
    expect(
      within(active).getByText(
        `${content.engagements.materialStatusLabel}: ${content.engagements.statuses.awaiting_upload}`
      )
    ).toBeInTheDocument();
    // `canUploadMaterial: true` — server-decided.
    expect(within(active).getByText(content.engagements.uploadTitle)).toBeInTheDocument();
    expect(
      within(active).getByRole('link', { name: content.engagements.followUpAction })
    ).toHaveAttribute('href', expertHubPaths.engagementDetail(engagement.engagementId));
  });

  it('trainer: `in_progress` is still active, and `completed` moves to "Past engagements"', async () => {
    serve({
      [OFFERS]: [],
      [ENGAGEMENTS]: [
        { ...engagement, lifecycle: 'in_progress' },
        { ...engagement, engagementId: 'done', lifecycle: 'completed', canUploadMaterial: false },
      ],
    });
    await renderPortal();

    const active = screen.getByRole('region', { name: content.engagements.heading });
    const past = screen.getByRole('region', { name: content.engagements.pastHeading });
    expect(
      within(active).getByText(engagementStatusLabel('in_progress', 'ar'))
    ).toBeInTheDocument();
    expect(within(active).queryByText(engagementStatusLabel('completed', 'ar'))).toBeNull();
    expect(within(past).getByText(engagementStatusLabel('completed', 'ar'))).toBeInTheDocument();
  });

  it('internal: the tracking panel renders the served slots', async () => {
    serve({ [SLOTS]: requestSlots });
    await renderPanel();
    const tracking = content.tracking;
    const backup = slot.backups[0];

    expect(screen.getByText(tracking.slotHeading(slot.slotNumber))).toBeInTheDocument();
    expect(screen.getByText(tracking.awaiting(slot.currentOffer.trainerName))).toBeInTheDocument();
    expect(
      screen.getByText(content.offers.slaRemaining(slot.currentOffer.responseSla.daysRemaining))
    ).toBeInTheDocument();
    expect(
      screen.getByText(tracking.backupRow(backup.preferenceRank, backup.trainerName))
    ).toBeInTheDocument();
    expect(
      screen.getByText(`${tracking.fastHeading}: ${tracking.fastStates.none}`)
    ).toBeInTheDocument();
    // The server keeps the live offer in the history too.
    expect(screen.getByText(tracking.outcomes['awaiting-response'])).toBeInTheDocument();
    // Nothing is confirmed, so there is nothing to de-link.
    expect(
      screen.queryByRole('button', { name: withdrawalContent.delink.action })
    ).not.toBeInTheDocument();
  });

  it('internal: de-linking a confirmed slot POSTs the reason and reports the re-opened slot', async () => {
    const posts = serve({ [SLOTS]: [confirmedSlot], [DELINK]: termination });
    const { user } = await renderPanel();

    await user.click(screen.getByRole('button', { name: withdrawalContent.delink.action }));
    await user.click(
      screen.getByRole('radio', {
        name: withdrawalContent.delink.reasons['operational-need-change'],
      })
    );
    await user.click(screen.getByRole('button', { name: withdrawalContent.delink.confirm }));

    // `slotReopened: true` — and the slot is the one the action was on.
    expect(
      await screen.findByText(withdrawalContent.delink.doneBody(confirmedSlot.slotNumber))
    ).toBeInTheDocument();
    expect(posts).toEqual([{ path: DELINK, body: { reason: 'operational-need-change' } }]);
  });

  it('internal: a de-link past its 24-hour deadline shows why the server refused', async () => {
    serve(
      { [SLOTS]: [confirmedSlot] },
      { [DELINK]: { status: 409, message: 'termination-deadline-passed' } }
    );
    const { user } = await renderPanel();

    await user.click(screen.getByRole('button', { name: withdrawalContent.delink.action }));
    await user.click(
      screen.getByRole('radio', {
        name: withdrawalContent.delink.reasons['administrative-decision'],
      })
    );
    await user.click(screen.getByRole('button', { name: withdrawalContent.delink.confirm }));

    expect(await screen.findByText(withdrawalContent.delink.deadlinePassed)).toBeInTheDocument();
  });
});
