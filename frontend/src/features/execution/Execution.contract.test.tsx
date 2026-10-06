import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import detail from '../../contracts/fixtures/me.engagement-detail.json';
import terminated from '../../contracts/fixtures/me.engagement-detail.terminated.json';
import {
  clearExpertHubSession,
  renderExpertHubAt,
  screen,
  seedExpertHubSession,
} from '../../test/renderExpertHub';
import { expertHubPaths } from '../../app/router/paths';
import { ENGAGEMENT_STATUSES, engagementStatusLabel } from '../../contracts/engagementStatus';
import { fakeApiClient, keyPaths } from '../../contracts/fakeApiClient';
import {
  createHttpWithdrawalProvider,
  setWithdrawalServiceForTesting,
} from '../withdrawal/withdrawalService';
import { getWithdrawalContent } from '../withdrawal/withdrawal.content';
import { createHttpExecutionProvider, setExecutionServiceForTesting } from './executionService';
import { createMockExecutionProvider } from './mockExecutionProvider';
import { getExecutionContent } from './execution.content';

/**
 * J-21 (+ J-22 read side) **contract** tests. The engagement detail page runs on
 * the REAL HTTP provider, fed `me.engagement-detail.json` and
 * `me.engagement-detail.terminated.json` through a fake `ExpertHubApiClient`.
 * The API names its gaps (`Q20`, `Q29`, no venue, no meeting link), and these
 * tests hold the page to saying so rather than showing zeroes.
 */

const content = getExecutionContent('ar');
const withdrawalContent = getWithdrawalContent('ar');
const label = (status: (typeof ENGAGEMENT_STATUSES)[number]) => engagementStatusLabel(status, 'ar');

/** A served record, possibly with its values changed. */
type Served = { readonly engagementId: string } & Readonly<Record<string, unknown>>;

/** Serves one engagement record at its own path. */
function serve(record: Served) {
  const { client } = fakeApiClient({ [`v1/me/engagements/${record.engagementId}`]: record });
  setExecutionServiceForTesting(createHttpExecutionProvider(client));
  setWithdrawalServiceForTesting(createHttpWithdrawalProvider(client));
}

async function renderDetail(record: Served) {
  serve(record);
  seedExpertHubSession(['trainer']);
  const result = renderExpertHubAt(expertHubPaths.engagementDetail(record.engagementId));
  await screen.findByRole('heading', { level: 1, name: content.heading });
  return result;
}

describe('J-21 contract — the engagement detail page against the real API responses', () => {
  beforeEach(() => {
    clearExpertHubSession();
  });

  afterEach(() => {
    setExecutionServiceForTesting(null);
    setWithdrawalServiceForTesting(null);
  });

  it('the fixtures use the central status vocabulary, and the mock serves exactly their keys', async () => {
    expect(ENGAGEMENT_STATUSES).toContain(detail.status);
    expect(ENGAGEMENT_STATUSES).toContain(terminated.status);

    const mock = createMockExecutionProvider({ latencyMs: 0 });
    const upcoming = await mock.getEngagement('eng-1');
    const delinked = await mock.getEngagement('eng-5');
    expect(upcoming.ok && delinked.ok).toBe(true);
    if (!upcoming.ok || !delinked.ok) {
      return;
    }
    expect(keyPaths(upcoming.value)).toEqual(keyPaths(detail));
    expect(keyPaths(delinked.value)).toEqual(keyPaths(terminated));
  });

  it('upcoming: renders the request, its status, and names every missing source', async () => {
    await renderDetail(detail);

    expect(
      screen.getByText(`${detail.details.reference} — ${detail.details.programName}`)
    ).toBeInTheDocument();
    expect(screen.getByText(label('upcoming'))).toBeInTheDocument();
    expect(screen.getByText(content.statusExplanation.upcoming)).toBeInTheDocument();
    // `Q20` / `Q29` — `available: false` is a named gap, never "0 enrollees".
    expect(screen.getByText(content.enrolmentUnavailable)).toBeInTheDocument();
    expect(screen.getByText(content.attendanceUnavailable)).toBeInTheDocument();
    expect(screen.getByText(content.evaluationsUnavailable)).toBeInTheDocument();
    expect(screen.queryByText(content.enrolmentCount(0))).not.toBeInTheDocument();
    // Onsite, with no venue from FAST: the city, and the gap said out loud.
    expect(screen.getByText(content.venueUnavailable)).toBeInTheDocument();
    expect(screen.getAllByText(detail.details.city).length).toBeGreaterThan(0);
    // J-22/F1 — upcoming is the one state a trainer may withdraw from.
    expect(
      screen.getByRole('button', { name: withdrawalContent.withdraw.action })
    ).toBeInTheDocument();
  });

  it('in_progress: labelled as running, and no withdraw action is offered', async () => {
    await renderDetail({ ...detail, status: 'in_progress' });

    expect(screen.getByText(label('in_progress'))).toBeInTheDocument();
    expect(screen.getByText(content.statusExplanation.in_progress)).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: withdrawalContent.withdraw.action })
    ).not.toBeInTheDocument();
  });

  it('terminated by staff: withdrawn, with who ended it and the reason, and no withdraw action', async () => {
    await renderDetail(terminated);

    expect(screen.getByText(label('withdrawn'))).toBeInTheDocument();
    expect(screen.getByText(withdrawalContent.outcomes.withdrawnByStaff)).toBeInTheDocument();
    expect(
      screen.getByText(
        `${withdrawalContent.outcomes.reasonLabel}: ${withdrawalContent.delink.reasons['operational-need-change']}`
      )
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: withdrawalContent.withdraw.action })
    ).not.toBeInTheDocument();
  });

  it('cancelled by FAST: the Academy is named as the cause, with FAST’s own reason and code', async () => {
    await renderDetail({
      ...terminated,
      status: 'cancelled',
      termination: {
        ...terminated.termination,
        kind: 'cancelled',
        actor: 'fast',
        reason: 'أُلغيت الخطة لعدم اكتمال النصاب.',
        fastCancelReasonCode: 'PCR-014',
      },
    });

    expect(screen.getByText(label('cancelled'))).toBeInTheDocument();
    expect(screen.getByText(withdrawalContent.outcomes.cancelledByAcademy)).toBeInTheDocument();
    expect(
      screen.getByText(
        `${withdrawalContent.outcomes.reasonLabel}: أُلغيت الخطة لعدم اكتمال النصاب.`
      )
    ).toBeInTheDocument();
    expect(screen.getByText(withdrawalContent.outcomes.fastReason('PCR-014'))).toBeInTheDocument();
  });
});
