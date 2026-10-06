import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Alert, Loading } from '@ds/composite';
import { Button, Icon, Tag, Textarea, Typography } from '@ds/primitives';
import { Breadcrumbs } from '@ds/shell';
import { useLocale } from '@i18n/LocaleProvider';
import { expertHubPaths } from '../../app/router/paths';
import { getSubmissionService } from './submissionService';
import { getSubmissionsContent } from './submissions.content';
import {
  SUBMISSION_DECISION,
  SUBMISSION_STATUS,
  syncsToFast,
  validateSubmissionDecision,
  type SubmissionDecisionInput,
  type SubmissionDto,
} from './submission.types';
import { SubmissionRounds, SubmissionStatusTag } from './components/SubmissionRounds';
import { PageLoadError } from '../../shared/components/PageLoadError';
import { WorkspacePage } from '../../shared/workspace/WorkspacePage';
import { RecordHead } from '../../shared/workspace/RecordHead';
import { Panel } from '../../shared/workspace/Panel';
import styles from './SubmissionReviewPage.module.css';
import { dateFormatter } from '../../shared/formatting';

/**
 * EH-INT-10 detail — one submission, reviewed and decided (**F2**, **F5**).
 *
 * The decision is the point, and it has exactly two outcomes:
 *
 * - **Approve.** On the training-material path the server then copies the file
 *   to the plan in FAST (F3/AC-1) and the page reports the sync; on the content
 *   path it does not (F5/AC-5), and `syncsToFast` keeps the sync panel off it.
 * - **Ask for another upload, with a note.** F2/AC-3's exact wording is "send a
 *   note opening a new upload opportunity", so the note is mandatory and the
 *   control says what it does. There is deliberately **no reject button** — the
 *   contract has no such decision, and the page explains why.
 *
 * Laid out as the approved Option B record screen: the file's head, the
 * decision directly under it, then the upload rounds it is decided against.
 *
 * ⚠️ `G26` — preview/download (F2/AC-2, F5/AC-2) has no source yet and is stated
 * as unavailable beside the file rather than offered as a dead link.
 *
 * ⚠️ The wire has no reference or programme name; the head names the submitter
 * and the date the slot opened, and invents neither.
 */

type Phase = 'loading' | 'error' | 'not-found' | 'ready';

export default function SubmissionReviewPage() {
  const { locale } = useLocale();
  const content = useMemo(() => getSubmissionsContent(locale), [locale]);
  const copy = content.review;
  const { submissionId } = useParams();
  const service = getSubmissionService();

  const [phase, setPhase] = useState<Phase>('loading');
  const [submission, setSubmission] = useState<SubmissionDto | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [composing, setComposing] = useState(false);
  const [note, setNote] = useState('');
  const [noteError, setNoteError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [outcome, setOutcome] = useState<SubmissionDecisionInput['decision'] | null>(null);
  const [actionFailed, setActionFailed] = useState(false);
  const loadedOnce = useRef(false);

  useEffect(() => {
    let cancelled = false;
    setPhase('loading');
    if (submissionId == null) {
      setPhase('not-found');
      return;
    }
    void service.getSubmission(submissionId).then((result) => {
      if (cancelled) {
        return;
      }
      if (result.ok) {
        setSubmission(result.value);
        setPhase('ready');
      } else if (result.error.status === 404) {
        setPhase('not-found');
      } else {
        setPhase('error');
      }
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submissionId, reloadKey]);

  useEffect(() => {
    document.title = copy.documentTitle;
  }, [copy.documentTitle]);

  useEffect(() => {
    if (phase === 'ready' && !loadedOnce.current) {
      loadedOnce.current = true;
      document.getElementById('eh-submission-title')?.focus();
    }
  }, [phase]);

  const decide = (input: SubmissionDecisionInput) => {
    if (submissionId == null) {
      return;
    }
    const issues = validateSubmissionDecision(input);
    setNoteError(issues.length > 0);
    if (issues.length > 0) {
      return;
    }
    setBusy(true);
    setActionFailed(false);
    void service.decideSubmission(submissionId, input).then((result) => {
      setBusy(false);
      if (result.ok) {
        setSubmission(result.value);
        setOutcome(input.decision);
        setComposing(false);
        setNote('');
      } else {
        setActionFailed(true);
      }
    });
  };

  if (phase === 'loading') {
    return (
      <WorkspacePage label={copy.detailTitle}>
        <Loading variant="skeleton" lines={6} label={copy.detailTitle} />
      </WorkspacePage>
    );
  }

  if (phase !== 'ready' || submission == null) {
    const messages =
      phase === 'not-found'
        ? { title: content.errors.notFoundTitle, body: content.errors.notFoundBody }
        : { title: content.errors.loadTitle, body: content.errors.loadBody };
    return (
      <PageLoadError
        title={messages.title}
        body={messages.body}
        onRetry={phase === 'error' ? () => setReloadKey((key) => key + 1) : undefined}
        retryLabel={content.errors.retry}
        size="prose"
        action={
          <Button variant="secondary" size="md" href={expertHubPaths.internalSubmissions}>
            {content.errors.back}
          </Button>
        }
      />
    );
  }

  const awaiting = submission.status === SUBMISSION_STATUS.pendingApproval;
  const dates = dateFormatter(locale, {
    dateStyle: 'medium',
  });

  return (
    <WorkspacePage labelledBy="eh-submission-title">
      <Breadcrumbs
        items={[
          { label: copy.breadcrumbQueue, href: expertHubPaths.internalSubmissions },
          { label: copy.detailTitle },
        ]}
        label={copy.breadcrumbLabel}
      />

      <RecordHead
        titleId="eh-submission-title"
        title={copy.detailTitle}
        icon="note-01"
        meta={[
          <bdi>{copy.submittedBy(submission.trainerName)}</bdi>,
          content.openedOn(dates.format(new Date(submission.openedAt))),
        ]}
        tags={
          <>
            <SubmissionStatusTag
              value={submission.status}
              label={content.statuses[submission.status]}
            />
            <Tag variant="neutral" size="sm">
              {content.kinds[submission.kind]}
            </Tag>
          </>
        }
      />

      {actionFailed && (
        <Alert tone="error" surface="tinted" role="alert">
          {content.errors.actionFailed}
        </Alert>
      )}
      {outcome === SUBMISSION_DECISION.approved && (
        <Alert tone="success" surface="tinted" role="status" title={copy.approvedTitle}>
          {/* F3/AC-1 vs F5/AC-5 — read off the union, not off a flag. */}
          {syncsToFast(submission) ? copy.approvedSync : copy.approvedNoSync}
        </Alert>
      )}
      {outcome === SUBMISSION_DECISION.changesRequested && (
        <Alert tone="info" surface="tinted" role="status" title={copy.requestedTitle}>
          {copy.requestedBody}
        </Alert>
      )}

      {/* ── F2/AC-3 + F5/AC-3 — the two decisions there are, first ──────── */}
      {awaiting && (
        <Panel
          shape="inline"
          title={copy.decisionHeading}
          titleId="eh-submission-decision"
          description={copy.decisionNote}
        >
          <Typography as="p" variant="text-xs" color="muted">
            {copy.noSlaNote}
          </Typography>

          {composing ? (
            <>
              <Textarea
                label={copy.noteLabel}
                helperText={copy.noteHint}
                value={note}
                onChange={(event) => setNote(event.target.value)}
                errorText={noteError ? content.errors.noteRequired : undefined}
                requiredField
                rows={4}
              />
              <div className={styles.actions}>
                <Button
                  variant="primary"
                  size="md"
                  disabled={busy}
                  onClick={() => decide({ decision: SUBMISSION_DECISION.changesRequested, note })}
                >
                  {copy.submitRequest}
                </Button>
                <Button
                  variant="tertiary"
                  size="md"
                  onClick={() => {
                    setComposing(false);
                    setNoteError(false);
                  }}
                >
                  {copy.cancel}
                </Button>
              </div>
            </>
          ) : (
            <div className={styles.actions}>
              <Button
                variant="primary"
                size="md"
                disabled={busy}
                onClick={() => decide({ decision: SUBMISSION_DECISION.approved })}
              >
                {copy.approve}
              </Button>
              <Button variant="secondary" size="md" onClick={() => setComposing(true)}>
                {copy.requestNewUpload}
              </Button>
            </div>
          )}
        </Panel>
      )}

      {submission.rounds.length > 0 && (
        <Panel title={content.roundsHeading} titleId="eh-submission-rounds">
          <SubmissionRounds
            rounds={submission.rounds}
            content={content}
            locale={locale}
            showHeading={false}
          />
        </Panel>
      )}

      {/* ── F3 — the sync, on the one path that has one ───────────────── */}
      {syncsToFast(submission) && (
        <Panel
          title={copy.syncHeading}
          titleId="eh-submission-sync"
          actions={
            <Tag
              variant={
                submission.syncState === 'synchronized'
                  ? 'success'
                  : submission.syncState === 'processing'
                    ? 'warning'
                    : 'neutral'
              }
              size="sm"
            >
              {copy.syncStates[submission.syncState]}
            </Tag>
          }
        >
          {/* F3/AC-2 — one direction, and only one. */}
          <Typography as="p" variant="text-sm" color="muted">
            {copy.syncDirectionNote}
          </Typography>
        </Panel>
      )}

      <div className={styles.actions}>
        <Button
          variant="secondary"
          size="md"
          href={expertHubPaths.internalSubmissions}
          iconStart={<Icon name="sidebar-right" size="sm" decorative />}
        >
          {content.errors.back}
        </Button>
      </div>
    </WorkspacePage>
  );
}
