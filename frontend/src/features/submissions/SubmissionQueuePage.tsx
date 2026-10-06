import { useEffect, useMemo, useRef, useState } from 'react';
import { EmptyState, Loading } from '@ds/composite';
import { Button, Icon, Tag, Typography } from '@ds/primitives';
import { useLocale } from '@i18n/LocaleProvider';
import { expertHubPaths } from '../../app/router/paths';
import { getSubmissionService } from './submissionService';
import { getSubmissionsContent } from './submissions.content';
import { SUBMISSION_STATUS, type SubmissionDto } from './submission.types';
import type { ExpertHubApiError } from '../../shared/services/apiClient';
import { describeLoadFailure } from '../../shared/errors/loadFailure';
import { PageLoadError } from '../../shared/components/PageLoadError';
import { WorkspacePage } from '../../shared/workspace/WorkspacePage';
import { PageHead } from '../../shared/workspace/PageHead';
import { Panel } from '../../shared/workspace/Panel';
import styles from './SubmissionReviewPage.module.css';

/**
 * EH-INT-10 — the coordinator's queue for **J-20**, at
 * `/expert-hub/internal/submissions`.
 *
 * F2/AC-1 and F5/AC-1 both say the coordinator "receives an alert that
 * [material|content] is awaiting their approval". The alert itself is J-25's
 * (`Q17`); this is the place it would point to, and the state it would describe.
 *
 * Both paths share the queue deliberately — the review act is identical, and
 * only the destination on approval differs (F3 vs F5/AC-5). The row names which
 * path each item is, so that difference is visible before it matters.
 *
 * `GET v1/internal/submissions` serves every status; the queue keeps the ones
 * awaiting a decision. The wire has no reference or programme name, so a row
 * names the submitter and the file under review.
 */

type Phase = 'loading' | 'error' | 'ready';

export default function SubmissionQueuePage() {
  const { locale } = useLocale();
  const content = useMemo(() => getSubmissionsContent(locale), [locale]);
  const copy = content.review;
  const service = getSubmissionService();

  const [phase, setPhase] = useState<Phase>('loading');
  const [loadError, setLoadError] = useState<ExpertHubApiError | null>(null);
  const [items, setItems] = useState<readonly SubmissionDto[]>([]);
  const [reloadKey, setReloadKey] = useState(0);
  const loadedOnce = useRef(false);

  useEffect(() => {
    document.title = copy.documentTitle;
  }, [copy.documentTitle]);

  useEffect(() => {
    let cancelled = false;
    setPhase('loading');
    void service.listSubmissions().then((result) => {
      if (cancelled) {
        return;
      }
      if (result.ok) {
        setItems(result.value.filter((item) => item.status === SUBMISSION_STATUS.pendingApproval));
        setPhase('ready');
      } else {
        setLoadError(result.error);
        setPhase('error');
      }
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadKey]);

  useEffect(() => {
    if (phase === 'ready' && !loadedOnce.current) {
      loadedOnce.current = true;
      document.getElementById('eh-submission-queue-title')?.focus();
    }
  }, [phase]);

  if (phase === 'loading') {
    return (
      <WorkspacePage label={copy.queueTitle}>
        <Loading variant="skeleton" lines={5} label={copy.queueTitle} />
      </WorkspacePage>
    );
  }

  // A denial is not a load failure: `P-190`'s gate answers 403 with the
  // feature it wanted, and telling someone their system broke sends them
  // to the wrong person for help.
  const failure = describeLoadFailure(loadError, locale, {
    title: content.errors.loadTitle,
    body: content.errors.loadBody,
  });

  if (phase === 'error') {
    return (
      <PageLoadError
        title={failure.title}
        body={failure.body}
        onRetry={failure.canRetry ? () => setReloadKey((key) => key + 1) : undefined}
        retryLabel={content.errors.retry}
        size="prose"
      />
    );
  }

  return (
    <WorkspacePage labelledBy="eh-submission-queue-title">
      <PageHead
        titleId="eh-submission-queue-title"
        title={copy.queueTitle}
        lead={copy.queueIntro}
      />

      <Panel
        flush={items.length > 0}
        toolbar={
          /* Open item 1 — no SLA exists for either path, and the absence is
             stated rather than left to look like an oversight. */
          <Typography as="p" variant="text-xs" color="muted">
            {copy.noSlaNote}
          </Typography>
        }
      >
        {items.length === 0 ? (
          <EmptyState
            icon={<Icon name="note-01" size="featured" tone="neutral" decorative />}
            title={copy.emptyTitle}
            description={copy.emptyBody}
          />
        ) : (
          <ul className={styles.queue}>
            {items.map((submission) => (
              <li key={submission.submissionId} className={styles.queueRow}>
                <div className={styles.queueMeta}>
                  <Typography as="span" variant="text-sm" weight="bold">
                    <bdi>{copy.submittedBy(submission.trainerName)}</bdi>
                  </Typography>
                  {submission.rounds.length > 0 && (
                    <Typography as="span" variant="text-xs" color="muted">
                      <bdi>{submission.rounds[submission.rounds.length - 1].fileName}</bdi>
                    </Typography>
                  )}
                </div>
                <div className={styles.actions}>
                  {/* Which of the two paths — visible before it matters. */}
                  <Tag variant="neutral" size="sm">
                    {content.kinds[submission.kind]}
                  </Tag>
                  <Button
                    variant="secondary"
                    size="sm"
                    href={expertHubPaths.internalSubmission(submission.submissionId)}
                  >
                    {copy.openAction}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </WorkspacePage>
  );
}
