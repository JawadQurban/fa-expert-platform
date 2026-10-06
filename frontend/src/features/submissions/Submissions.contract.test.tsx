import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import meSubmissions from '../../contracts/fixtures/me.submissions.json';
import internalSubmissions from '../../contracts/fixtures/internal.submissions.json';
import submissionDetail from '../../contracts/fixtures/internal.submission-detail.json';
import {
  clearExpertHubSession,
  renderExpertHubAt,
  screen,
  seedExpertHubSession,
} from '../../test/renderExpertHub';
import { expertHubPaths } from '../../app/router/paths';
import type { ExpertHubApiClient } from '../../shared/services/apiClient';
import { createHttpSubmissionProvider, setSubmissionServiceForTesting } from './submissionService';
import { createMockSubmissionProvider } from './mockSubmissionProvider';
import { getSubmissionsContent } from './submissions.content';
import { SUBMISSION_STATUS, type SubmissionStatus } from './submission.types';

/**
 * J-20 **contract** tests. The pages run on the REAL HTTP provider, fed the
 * responses the backend's own tests recorded (`contracts/fixtures/`), through a
 * fake `ExpertHubApiClient`. A page that only works against the mock fails here.
 */

const content = getSubmissionsContent('ar');
const detail = submissionDetail;
const id = detail.submissionId;
const round = detail.rounds[0];

/** The same served record with only its status changed. */
const withStatus = (status: SubmissionStatus) => ({ ...detail, status });

interface Call {
  readonly path: string;
  readonly body?: unknown;
}

/** Serves `routes` by exact path, and records every POST. */
function serve(routes: Record<string, unknown>) {
  const posts: Call[] = [];
  const answer = <T,>(path: string) =>
    Promise.resolve(
      path in routes
        ? { ok: true as const, value: routes[path] as T }
        : { ok: false as const, error: { status: 404, message: `No fixture for ${path}` } }
    );
  const client: ExpertHubApiClient = {
    get: <T,>(path: string) => answer<T>(path),
    post: <T,>(path: string, body?: unknown) => {
      posts.push({ path, body });
      return answer<T>(path);
    },
  };
  setSubmissionServiceForTesting(createHttpSubmissionProvider(client));
  return posts;
}

async function renderPortal() {
  seedExpertHubSession(['trainer']);
  const result = renderExpertHubAt(expertHubPaths.submissions);
  await screen.findByRole('heading', { level: 1, name: content.title });
  return result;
}

async function renderReview() {
  seedExpertHubSession(['internal']);
  const result = renderExpertHubAt(expertHubPaths.internalSubmission(id));
  await screen.findByRole('heading', { level: 1, name: content.review.detailTitle });
  return result;
}

describe('J-20 contract — pages against the real API responses', () => {
  beforeEach(() => {
    clearExpertHubSession();
  });

  afterEach(() => {
    setSubmissionServiceForTesting(null);
  });

  it('the fixtures use the status values the types define, and the mock serves the same keys', async () => {
    const statuses: readonly string[] = Object.values(SUBMISSION_STATUS);
    for (const item of [...meSubmissions, ...internalSubmissions, detail]) {
      expect(statuses).toContain(item.status);
    }
    const mock = await createMockSubmissionProvider({ latencyMs: 0 }).listMySubmissions();
    expect(mock.ok).toBe(true);
    if (!mock.ok) {
      return;
    }
    for (const item of mock.value) {
      expect(Object.keys(item).sort()).toEqual(Object.keys(detail).sort());
      for (const mockRound of item.rounds) {
        expect(Object.keys(mockRound).sort()).toEqual(Object.keys(round).sort());
      }
    }
  });

  it('trainer: a changes_requested submission shows the upload control and its round', async () => {
    serve({ 'v1/me/submissions': meSubmissions });
    const { container } = await renderPortal();

    expect(container.querySelectorAll('input[type="file"]')).toHaveLength(1);
    expect(screen.getByRole('button', { name: content.uploadAction })).toBeInTheDocument();
    expect(screen.getByText(round.fileName)).toBeInTheDocument();
    expect(
      screen.getByText(content.roundOutcomes[SUBMISSION_STATUS.changesRequested])
    ).toBeInTheDocument();
    expect(screen.getByText(round.note)).toBeInTheDocument();
  });

  it('trainer: an awaiting_upload submission uploads { fileName } to the upload path', async () => {
    const posts = serve({
      'v1/me/submissions': [withStatus(SUBMISSION_STATUS.awaitingUpload)],
      [`v1/me/submissions/${id}/upload`]: detail,
    });
    const { user, container } = await renderPortal();

    const input = container.querySelector('input[type="file"]');
    expect(input).not.toBeNull();
    await user.upload(
      input as HTMLInputElement,
      new File(['x'], 'material-v2.pdf', { type: 'application/pdf' })
    );
    await user.click(screen.getByRole('button', { name: content.uploadAction }));

    expect(await screen.findByText(content.uploadedBody)).toBeInTheDocument();
    expect(posts).toEqual([
      { path: `v1/me/submissions/${id}/upload`, body: { fileName: 'material-v2.pdf' } },
    ]);
  });

  it('trainer: nothing to upload once the file is pending approval', async () => {
    serve({ 'v1/me/submissions': [withStatus(SUBMISSION_STATUS.pendingApproval)] });
    const { container } = await renderPortal();
    expect(container.querySelectorAll('input[type="file"]')).toHaveLength(0);
  });

  it('coordinator queue: lists pending_approval submissions from the internal list', async () => {
    serve({
      'v1/internal/submissions': internalSubmissions.map((item) => ({
        ...item,
        status: SUBMISSION_STATUS.pendingApproval,
      })),
    });
    seedExpertHubSession(['internal']);
    renderExpertHubAt(expertHubPaths.internalSubmissions);
    await screen.findByRole('heading', { level: 1, name: content.review.queueTitle });

    expect(screen.getByRole('link', { name: content.review.openAction })).toHaveAttribute(
      'href',
      expertHubPaths.internalSubmission(id)
    );
    expect(screen.getByText(content.review.submittedBy(detail.trainerName))).toBeInTheDocument();
    expect(screen.getByText(round.fileName)).toBeInTheDocument();
  });

  it('coordinator queue: a changes_requested submission is not awaiting a decision', async () => {
    serve({ 'v1/internal/submissions': internalSubmissions });
    seedExpertHubSession(['internal']);
    renderExpertHubAt(expertHubPaths.internalSubmissions);
    expect(await screen.findByText(content.review.emptyTitle)).toBeInTheDocument();
  });

  it('review: pending_approval shows both decisions, and approve sends { decision: "approved" }', async () => {
    const decisionPath = `v1/internal/submissions/${id}/decision`;
    const posts = serve({
      [`v1/internal/submissions/${id}`]: withStatus(SUBMISSION_STATUS.pendingApproval),
      [decisionPath]: detail,
    });
    const { user } = await renderReview();

    expect(
      screen.getByRole('button', { name: content.review.requestNewUpload })
    ).toBeInTheDocument();
    // The rounds render off the flat wire round.
    expect(screen.getByText(round.fileName)).toBeInTheDocument();
    expect(screen.getByText(round.note)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: content.review.approve }));
    expect(await screen.findByText(content.review.approvedTitle)).toBeInTheDocument();
    expect(posts).toEqual([{ path: decisionPath, body: { decision: 'approved' } }]);
  });

  it('review: requesting changes sends { decision: "changes-requested", note }', async () => {
    const decisionPath = `v1/internal/submissions/${id}/decision`;
    const posts = serve({
      [`v1/internal/submissions/${id}`]: withStatus(SUBMISSION_STATUS.pendingApproval),
      [decisionPath]: detail,
    });
    const { user } = await renderReview();

    await user.click(screen.getByRole('button', { name: content.review.requestNewUpload }));
    await user.type(screen.getByRole('textbox'), 'أضف تمارين تطبيقية.');
    await user.click(screen.getByRole('button', { name: content.review.submitRequest }));

    expect(await screen.findByText(content.review.requestedTitle)).toBeInTheDocument();
    expect(posts).toEqual([
      {
        path: decisionPath,
        body: { decision: 'changes-requested', note: 'أضف تمارين تطبيقية.' },
      },
    ]);
  });

  it('review: the served (changes_requested) submission offers no decision', async () => {
    serve({ [`v1/internal/submissions/${id}`]: detail });
    await renderReview();
    expect(screen.queryByRole('button', { name: content.review.approve })).not.toBeInTheDocument();
  });
});
