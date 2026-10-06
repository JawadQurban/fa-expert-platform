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
import { setSubmissionServiceForTesting } from './submissionService';
import { createMockSubmissionProvider } from './mockSubmissionProvider';
import type { MockSubmissionProviderOptions } from './mockSubmissionProvider';
import { getSubmissionsContent } from './submissions.content';
import {
  canUpload,
  SUBMISSION_DECISION,
  SUBMISSION_STATUS,
  syncsToFast,
  validateSubmissionDecision,
  type SubmissionDto,
} from './submission.types';

const content = getSubmissionsContent('ar');

/** The two seeded paths. */
const MATERIAL = 'sub-001';
const CONTENT_DEV = 'sub-002';

function injectProvider(options: MockSubmissionProviderOptions = {}) {
  setSubmissionServiceForTesting(createMockSubmissionProvider({ latencyMs: 0, ...options }));
}

async function renderPortal(options: MockSubmissionProviderOptions = {}) {
  if (Object.keys(options).length > 0) {
    setSubmissionServiceForTesting(null);
    injectProvider(options);
  }
  seedExpertHubSession(['trainer']);
  const result = renderExpertHubAt(expertHubPaths.submissions);
  await screen.findByRole('heading', { level: 1, name: content.title });
  return result;
}

async function renderReview(submissionId: string) {
  seedExpertHubSession(['internal']);
  const result = renderExpertHubAt(expertHubPaths.internalSubmission(submissionId));
  await screen.findByRole('heading', { level: 1, name: content.review.detailTitle });
  return result;
}

describe('EH-TP-08 / EH-INT-10 — Material & Content Submission and Approval (J-20)', () => {
  beforeEach(() => {
    clearExpertHubSession();
    injectProvider();
  });

  afterEach(() => {
    setSubmissionServiceForTesting(null);
  });

  /* ── the two paths, and what tells them apart ──────────────────────────── */

  it('J-20/F5/AC-5: only the training-material path syncs to FAST', async () => {
    const service = createMockSubmissionProvider({ latencyMs: 0 });
    const material = await service.getSubmission(MATERIAL);
    expect(material.ok && syncsToFast(material.value)).toBe(true);
    // Approving content leaves its (served) sync state untouched.
    const approved = await service.decideSubmission(CONTENT_DEV, {
      decision: SUBMISSION_DECISION.approved,
    });
    expect(approved.ok).toBe(true);
    if (!approved.ok) {
      return;
    }
    expect(syncsToFast(approved.value)).toBe(false);
    expect(approved.value.syncState).toBe('none');
  });

  it('J-20/F1/AC-1 vs F4/AC-1: each path says why its upload slot is open', async () => {
    await renderPortal();
    expect(await screen.findByText(content.kindReason['training-material'])).toBeInTheDocument();
    expect(screen.getByText(content.kindReason['service-content'])).toBeInTheDocument();
  });

  /* ── F1/F4 — uploading ─────────────────────────────────────────────────── */

  it('J-20/F1/AC-2 + F4/AC-2: an upload needs a file name, as the server requires', async () => {
    const service = createMockSubmissionProvider({ latencyMs: 0 });
    const nameless = await service.uploadSubmission(MATERIAL, { fileName: '  ' });
    expect(nameless.ok || nameless.error).toEqual({ status: 400, message: 'file-required' });
    const good = await service.uploadSubmission(MATERIAL, { fileName: 'material.pdf' });
    expect(good.ok).toBe(true);
  });

  it('J-20/F1/AC-3: an upload is recorded as pending approval', async () => {
    const service = createMockSubmissionProvider({ latencyMs: 0 });
    const result = await service.uploadSubmission(MATERIAL, {
      fileName: 'material.pdf',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value.status).toBe(SUBMISSION_STATUS.pendingApproval);
    expect(result.value.rounds).toHaveLength(1);
    expect(result.value.rounds[0].decision).toBeNull();
  });

  it('an upload only lands in an open slot', () => {
    // The slot is open on the first pass and after a note reopens it (F2/AC-4),
    // and closed while a decision is pending or once it is approved.
    const at = (status: SubmissionDto['status']) =>
      canUpload({ status } as unknown as SubmissionDto);
    expect(at(SUBMISSION_STATUS.awaitingUpload)).toBe(true);
    expect(at(SUBMISSION_STATUS.changesRequested)).toBe(true);
    expect(at(SUBMISSION_STATUS.pendingApproval)).toBe(false);
    expect(at(SUBMISSION_STATUS.approved)).toBe(false);
  });

  it('the upload control disappears once the file is awaiting a decision', async () => {
    const { user, container } = await renderPortal();
    // Only the material slot is open; the content slot is already pending, and
    // an upload box beside a file already under review would invite a second one.
    const uploaders = container.querySelectorAll('input[type="file"]');
    expect(uploaders).toHaveLength(1);
    expect(
      await screen.findByText(content.statuses[SUBMISSION_STATUS.pendingApproval])
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: content.uploadAction })).toBeDisabled();
    await user.upload(
      uploaders[0] as HTMLInputElement,
      new File(['x'], 'material.pdf', { type: 'application/pdf' })
    );
    expect(screen.getByRole('button', { name: content.uploadAction })).toBeEnabled();
  });

  /* ── F2/F5 — the review, and the two decisions ─────────────────────────── */

  it('J-20/F2/AC-3 + F5/AC-3: the decision is approve or ask again — there is no reject', async () => {
    await renderReview(CONTENT_DEV);
    expect(screen.getByRole('button', { name: content.review.approve })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: content.review.requestNewUpload })
    ).toBeInTheDocument();
    // Nothing on the page can refuse the submission outright…
    expect(screen.queryByRole('button', { name: /^رفض/ })).not.toBeInTheDocument();
    // …and the page says so, so the absence is not read as a missing feature.
    expect(screen.getByText(content.review.decisionNote)).toBeInTheDocument();
  });

  it('J-20/F2/AC-3: asking for a new upload requires a note', () => {
    const ask = (note: string) =>
      validateSubmissionDecision({ decision: SUBMISSION_DECISION.changesRequested, note });
    expect(validateSubmissionDecision({ decision: SUBMISSION_DECISION.approved })).toEqual([]);
    expect(ask('')).toContain('note-required');
    expect(ask('   ')).toContain('note-required');
    expect(ask('أعد الصياغة')).toEqual([]);
  });

  it('J-20/F2/AC-3: the server refuses a note-less request too', async () => {
    const service = createMockSubmissionProvider({ latencyMs: 0 });
    const result = await service.decideSubmission(CONTENT_DEV, {
      decision: SUBMISSION_DECISION.changesRequested,
      note: '  ',
    });
    expect(result.ok || result.error).toEqual({ status: 400, message: 'note-required' });
  });

  it('J-20/F2/AC-4: a note reopens the upload, and the cycle repeats', async () => {
    const service = createMockSubmissionProvider({ latencyMs: 0 });
    await service.uploadSubmission(MATERIAL, { fileName: 'material.pdf' });
    const asked = await service.decideSubmission(MATERIAL, {
      decision: SUBMISSION_DECISION.changesRequested,
      note: 'أضف الحالات العملية',
    });
    expect(asked.ok).toBe(true);
    if (!asked.ok) {
      return;
    }
    // Not a refusal — the slot is open again, with the note attached to the round.
    expect(asked.value.status).toBe(SUBMISSION_STATUS.changesRequested);
    expect(canUpload(asked.value)).toBe(true);
    expect(asked.value.rounds[0].note).toBe('أضف الحالات العملية');

    const again = await service.uploadSubmission(MATERIAL, {
      fileName: 'material-v2.pdf',
    });
    expect(again.ok).toBe(true);
    if (!again.ok) {
      return;
    }
    expect(again.value.rounds).toHaveLength(2);
    expect(again.value.status).toBe(SUBMISSION_STATUS.pendingApproval);
  });

  it('J-20/F2/AC-4: the submitter sees the note beside the new upload control', async () => {
    const service = createMockSubmissionProvider({ latencyMs: 0 });
    await service.uploadSubmission(MATERIAL, { fileName: 'material.pdf' });
    await service.decideSubmission(MATERIAL, {
      decision: SUBMISSION_DECISION.changesRequested,
      note: 'أضف الحالات العملية',
    });
    setSubmissionServiceForTesting(service);
    seedExpertHubSession(['trainer']);
    const { container } = renderExpertHubAt(expertHubPaths.submissions);
    await screen.findByRole('heading', { level: 1, name: content.title });

    expect(await screen.findByText('أضف الحالات العملية')).toBeInTheDocument();
    expect(screen.getByText(content.changesRequestedBody)).toBeInTheDocument();
    // The upload control is back — a note is an opportunity, not an ending.
    expect(container.querySelectorAll('input[type="file"]').length).toBeGreaterThan(0);
  });

  /* ── F3 vs F5/AC-5 — the two destinations ──────────────────────────────── */

  it('J-20/F3/AC-1: approving training material starts the copy to FAST', async () => {
    const service = createMockSubmissionProvider({ latencyMs: 0 });
    await service.uploadSubmission(MATERIAL, { fileName: 'material.pdf' });
    const approved = await service.decideSubmission(MATERIAL, {
      decision: SUBMISSION_DECISION.approved,
    });
    expect(approved.ok).toBe(true);
    if (!approved.ok) {
      return;
    }
    expect(approved.value.status).toBe(SUBMISSION_STATUS.approved);
    expect(approved.value.syncState).toBe('processing');
  });

  it('J-20/F5/AC-5: approving content stores it in the platform and syncs nothing', async () => {
    const { user } = await renderReview(CONTENT_DEV);
    await user.click(screen.getByRole('button', { name: content.review.approve }));
    expect(await screen.findByText(content.review.approvedNoSync)).toBeInTheDocument();
    // There is no sync block on this path, because there is no sync.
    expect(
      screen.queryByRole('heading', { name: content.review.syncHeading })
    ).not.toBeInTheDocument();
  });

  it('J-20/F3/AC-2: the sync block states that the flow is one-way', async () => {
    const service = createMockSubmissionProvider({ latencyMs: 0 });
    await service.uploadSubmission(MATERIAL, { fileName: 'material.pdf' });
    setSubmissionServiceForTesting(service);
    await renderReview(MATERIAL);
    expect(await screen.findByText(content.review.syncDirectionNote)).toBeInTheDocument();
  });

  /* ── the coordinator's queue ───────────────────────────────────────────── */

  it('J-20/F2/AC-1 + F5/AC-1: both paths land in the same review queue, each named', async () => {
    seedExpertHubSession(['internal']);
    renderExpertHubAt(expertHubPaths.internalSubmissions);
    await screen.findByRole('heading', { level: 1, name: content.review.queueTitle });
    // Only the content submission is pending at the outset.
    const open = screen.getByRole('link', { name: content.review.openAction });
    expect(open).toHaveAttribute('href', expertHubPaths.internalSubmission(CONTENT_DEV));
    const row = open.closest('li');
    expect(
      within(row as HTMLElement).getByText(content.kinds['service-content'])
    ).toBeInTheDocument();
  });

  /* ── open item 1 — no SLA is invented ──────────────────────────────────── */

  it('open item 1: no approval deadline is shown, and the absence is stated', async () => {
    seedExpertHubSession(['internal']);
    renderExpertHubAt(expertHubPaths.internalSubmissions);
    await screen.findByRole('heading', { level: 1, name: content.review.queueTitle });
    expect(screen.getByText(content.review.noSlaNote)).toBeInTheDocument();
  });

  /* ── `G26` — no fabricated preview ─────────────────────────────────────── */

  it('`G26`: an uploaded file is named but not linked, and the page says why', async () => {
    await renderReview(CONTENT_DEV);
    expect(await screen.findByText(content.previewUnavailable)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /\.pdf$/ })).not.toBeInTheDocument();
  });

  /* ── accessibility ─────────────────────────────────────────────────────── */

  it('renders RTL by default and has no automatically-detectable a11y violations', async () => {
    const { container } = await renderPortal();
    expect(document.documentElement).toHaveAttribute('dir', 'rtl');
    await expectNoA11yViolations(container);
  });
});
