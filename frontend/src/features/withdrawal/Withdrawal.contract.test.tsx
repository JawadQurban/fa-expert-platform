import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import detail from '../../contracts/fixtures/me.engagement-detail.json';
import termination from '../../contracts/fixtures/me.engagement-termination.json';
import {
  clearExpertHubSession,
  renderExpertHubAt,
  screen,
  seedExpertHubSession,
} from '../../test/renderExpertHub';
import { expertHubPaths } from '../../app/router/paths';
import { fakeApiClient, keyPaths } from '../../contracts/fakeApiClient';
import type { ExpertHubApiError } from '../../shared/services/apiClient';
import { getExecutionContent } from '../execution/execution.content';
import {
  createHttpExecutionProvider,
  setExecutionServiceForTesting,
} from '../execution/executionService';
import { createMockWithdrawalProvider } from './mockWithdrawalProvider';
import { getWithdrawalContent } from './withdrawal.content';
import { createHttpWithdrawalProvider, setWithdrawalServiceForTesting } from './withdrawalService';

/**
 * J-22 **contract** tests for the trainer's withdrawal. The detail page and the
 * withdrawal run on the REAL HTTP providers over a fake `ExpertHubApiClient`:
 * success answers with `me.engagement-termination.json`, and each refusal
 * answers with the `detail` `TerminateAsync` sends — so every server-side rule
 * reaches the trainer in words, not as a generic failure.
 */

const content = getWithdrawalContent('ar');
const executionContent = getExecutionContent('ar');
const DETAIL = `v1/me/engagements/${detail.engagementId}`;
const WITHDRAW = `${DETAIL}/withdrawal`;

function serve(outcome: { readonly error?: ExpertHubApiError }) {
  const { client, posts } = fakeApiClient(
    { [DETAIL]: detail, [WITHDRAW]: termination },
    outcome.error == null ? {} : { [WITHDRAW]: outcome.error }
  );
  setExecutionServiceForTesting(createHttpExecutionProvider(client));
  setWithdrawalServiceForTesting(createHttpWithdrawalProvider(client));
  return posts;
}

/** Opens the served engagement and confirms a withdrawal for a closed-list reason. */
async function withdraw() {
  seedExpertHubSession(['trainer']);
  const { user } = renderExpertHubAt(expertHubPaths.engagementDetail(detail.engagementId));
  await screen.findByRole('heading', { level: 1, name: executionContent.heading });
  await user.click(screen.getByRole('button', { name: content.withdraw.action }));
  await user.click(
    screen.getByRole('radio', { name: content.withdraw.reasons['scheduling-conflict'] })
  );
  await user.click(screen.getByRole('button', { name: content.withdraw.confirm }));
}

describe('J-22 contract — withdrawal against the real API responses', () => {
  beforeEach(() => {
    clearExpertHubSession();
  });

  afterEach(() => {
    setExecutionServiceForTesting(null);
    setWithdrawalServiceForTesting(null);
  });

  it('the mock answers with exactly the served result keys', async () => {
    const result = await createMockWithdrawalProvider({ latencyMs: 0 }).withdrawFromEngagement(
      'eng-1',
      { reason: 'personal-emergency' }
    );
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(keyPaths(result.value)).toEqual(keyPaths(termination));
  });

  it('a withdrawal POSTs { reason } to the withdrawal path and is confirmed', async () => {
    const posts = serve({});
    await withdraw();

    expect(await screen.findByText(content.withdraw.doneTitle)).toBeInTheDocument();
    expect(posts).toEqual([{ path: WITHDRAW, body: { reason: 'scheduling-conflict' } }]);
  });

  const refusals: ReadonlyArray<readonly [ExpertHubApiError, string]> = [
    [{ status: 409, message: 'engagement-not-upcoming' }, content.withdraw.unavailable],
    [{ status: 409, message: 'termination-deadline-passed' }, content.withdraw.deadlinePassed],
    [{ status: 409, message: 'Already ended.' }, content.errors.alreadyEnded],
    [{ status: 400, message: 'reason-required' }, content.errors.reasonRequired],
    [{ status: 400, message: 'note-required' }, content.errors.noteRequired],
    [{ status: 500, message: 'Internal Server Error' }, content.errors.actionFailed],
  ];

  it.each(refusals)(
    'the server refusing with %o is shown in its own words',
    async (error, copy) => {
      serve({ error });
      await withdraw();

      expect(await screen.findByRole('alert')).toHaveTextContent(copy);
      expect(screen.queryByText(content.withdraw.doneTitle)).not.toBeInTheDocument();
    }
  );
});
