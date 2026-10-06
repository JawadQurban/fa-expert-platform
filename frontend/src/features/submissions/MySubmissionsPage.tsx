import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Card, EmptyState, FileUploader, ItemIcon, Loading } from '@ds/composite';
import { Button, Icon, Typography } from '@ds/primitives';
import { Container, Section } from '@ds/layout';
import { useLocale } from '@i18n/LocaleProvider';
import { getSubmissionService } from './submissionService';
import { getSubmissionsContent } from './submissions.content';
import { canUpload, SUBMISSION_STATUS, type SubmissionDto } from './submission.types';
import { SubmissionRounds, SubmissionStatusTag } from './components/SubmissionRounds';
import styles from './MySubmissionsPage.module.css';
import { PageLoadError } from '../../shared/components/PageLoadError';
import { dateFormatter } from '../../shared/formatting';

/**
 * EH-TP-08 — the submitter's side of **J-20**, at `/expert-hub/submissions`.
 *
 * One page for both of the journey's paths, because they are the same act: the
 * training material a trainer owes when the plan has none (F1), and the
 * service-linked content a content developer owes from confirmation (F4).
 *
 * What the page is careful about:
 *
 * - **It says why the slot is open**, and the reason differs per path. An upload
 *   box that appears on one engagement and not another is otherwise arbitrary.
 * - **A rejected file is never a dead end.** The only decision that is not
 *   approval is a note asking for another upload (F2/AC-3), so a
 *   `changes-requested` submission shows the note *and* the upload control
 *   together — the note is what the next upload has to answer.
 * - **Only the file name is recorded** (`G26`/`G27`): the API serves no
 *   attachment rule and stores no bytes, so the page validates nothing it
 *   cannot know and says plainly what an upload records.
 * - **No reference or programme name** is on the wire, so the card names the
 *   date the slot opened instead of inventing either.
 * - **No deadline is shown**, because open item 1 defines none. Inventing one
 *   would invent a rule.
 */

type Phase = 'loading' | 'error' | 'ready';

export default function MySubmissionsPage() {
  const { locale } = useLocale();
  const content = useMemo(() => getSubmissionsContent(locale), [locale]);
  const service = getSubmissionService();

  const [phase, setPhase] = useState<Phase>('loading');
  const [submissions, setSubmissions] = useState<readonly SubmissionDto[]>([]);
  const [reloadKey, setReloadKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [picked, setPicked] = useState<Record<string, string>>({});
  const [uploadedId, setUploadedId] = useState<string | null>(null);
  const [actionFailed, setActionFailed] = useState(false);
  const loadedOnce = useRef(false);

  useEffect(() => {
    document.title = content.documentTitle;
  }, [content.documentTitle]);

  useEffect(() => {
    let cancelled = false;
    /*
      A successful upload bumps `reloadKey`, so this effect runs on an action
      and not only on arrival. Showing the skeleton then blanked the whole list
      the moment the trainer uploaded, and the success Alert only appeared once
      the reload resolved. Only a first arrival has nothing to preserve.
    */
    if (!loadedOnce.current) {
      setPhase('loading');
    }
    void service.listMySubmissions().then((result) => {
      if (cancelled) {
        return;
      }
      if (result.ok) {
        setSubmissions(result.value);
        setPhase('ready');
      } else {
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
      document.getElementById('eh-submissions-title')?.focus();
    }
  }, [phase]);

  const dates = dateFormatter(locale, {
    dateStyle: 'medium',
  });

  const pick = (submission: SubmissionDto, files: File[]) => {
    const file = files[0];
    if (file != null) {
      setPicked((current) => ({ ...current, [submission.submissionId]: file.name }));
    }
  };

  const upload = (submission: SubmissionDto) => {
    const fileName = picked[submission.submissionId];
    if (fileName == null) {
      return;
    }
    setBusy(true);
    setActionFailed(false);
    void service.uploadSubmission(submission.submissionId, { fileName }).then((result) => {
      setBusy(false);
      if (result.ok) {
        setUploadedId(submission.submissionId);
        setPicked((current) => {
          const next = { ...current };
          delete next[submission.submissionId];
          return next;
        });
        setReloadKey((key) => key + 1);
      } else {
        setActionFailed(true);
      }
    });
  };

  if (phase === 'loading') {
    return (
      <Section aria-label={content.title}>
        <Container>
          <Loading variant="skeleton" lines={6} label={content.title} />
        </Container>
      </Section>
    );
  }

  if (phase === 'error') {
    return (
      <PageLoadError
        title={content.errors.loadTitle}
        body={content.errors.loadBody}
        onRetry={() => setReloadKey((key) => key + 1)}
        retryLabel={content.errors.retry}
        size="prose"
      />
    );
  }

  return (
    <Section aria-labelledby="eh-submissions-title">
      <Container>
        <div className={styles.header}>
          <Typography as="h1" id="eh-submissions-title" variant="display-md" tabIndex={-1}>
            {content.title}
          </Typography>
          <Typography as="p" variant="text-md" color="muted">
            {content.intro}
          </Typography>
        </div>

        {actionFailed && (
          <Alert tone="error" role="alert">
            {content.errors.actionFailed}
          </Alert>
        )}

        {submissions.length === 0 ? (
          <Card effect="stroke">
            <EmptyState
              icon={<Icon name="upload-01" size="featured" tone="neutral" decorative />}
              title={content.emptyTitle}
              description={content.emptyBody}
            />
          </Card>
        ) : (
          <ul className={styles.list}>
            {submissions.map((submission) => {
              const chosen = picked[submission.submissionId];
              return (
                <li key={submission.submissionId}>
                  <Card effect="shadow" className={styles.card}>
                    <div className={styles.head}>
                      <ItemIcon
                        contained
                        icon={<Icon name="note-01" size="featured" tone="inherit" decorative />}
                      />
                      <div className={styles.headings}>
                        <Typography as="h2" variant="text-lg" weight="bold">
                          {content.kinds[submission.kind]}
                        </Typography>
                        <Typography as="p" variant="text-sm" color="muted">
                          {content.openedOn(dates.format(new Date(submission.openedAt)))}
                        </Typography>
                      </div>
                      <SubmissionStatusTag
                        value={submission.status}
                        label={content.statuses[submission.status]}
                      />
                    </div>

                    {/* F1/AC-1 vs F4/AC-1 — why this slot is open at all. */}
                    <Typography as="p" variant="text-sm" color="muted">
                      {content.kindReason[submission.kind]}
                    </Typography>

                    {submission.status === SUBMISSION_STATUS.pendingApproval && (
                      <Alert tone="info" role="status" title={content.uploadedTitle}>
                        {content.uploadedBody}
                      </Alert>
                    )}
                    {submission.status === SUBMISSION_STATUS.changesRequested && (
                      <Alert tone="warning" role="status" title={content.changesRequestedTitle}>
                        {content.changesRequestedBody}
                      </Alert>
                    )}
                    {submission.status === SUBMISSION_STATUS.approved && (
                      <Alert tone="success" role="status" title={content.approvedTitle}>
                        {/* F3/AC-1 vs F5/AC-5 — the two destinations, named. */}
                        {content.approvedBody[submission.kind]}
                      </Alert>
                    )}
                    {uploadedId === submission.submissionId && (
                      <Alert tone="success" role="status">
                        {content.uploadedBody}
                      </Alert>
                    )}

                    <SubmissionRounds
                      rounds={submission.rounds}
                      content={content}
                      locale={locale}
                    />

                    {/* F1/AC-1 + F2/AC-4 — open on the first pass, and reopened
                        by a note. The same control serves both. */}
                    {canUpload(submission) && (
                      <>
                        <Typography as="h3" variant="text-md" weight="bold">
                          {content.uploadHeading}
                        </Typography>
                        <FileUploader
                          variant="single"
                          label={content.uploadLabel}
                          hint={content.uploadHint}
                          onFilesSelected={(files) => pick(submission, files)}
                        />
                        {chosen != null && (
                          <Typography as="p" variant="text-sm">
                            <bdi>{chosen}</bdi>
                          </Typography>
                        )}
                        <div className={styles.actions}>
                          <Button
                            variant="primary"
                            size="md"
                            disabled={busy || chosen == null}
                            onClick={() => upload(submission)}
                          >
                            {content.uploadAction}
                          </Button>
                        </div>
                      </>
                    )}
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </Container>
    </Section>
  );
}
