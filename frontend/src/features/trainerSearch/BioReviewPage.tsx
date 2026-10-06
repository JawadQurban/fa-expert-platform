import { useEffect, useMemo, useState } from 'react';
import { Alert, EmptyState, ErrorState, Loading } from '@ds/composite';
import { Button, Icon, Tag, Textarea, Typography } from '@ds/primitives';
import { useLocale } from '@i18n/LocaleProvider';
import type { ExpertHubApiError } from '../../shared/services/apiClient';
import { describeLoadFailure } from '../../shared/errors/loadFailure';
import { formatDate, formatNumber } from '../../shared/formatting';
import { WorkspacePage } from '../../shared/workspace/WorkspacePage';
import { PageHead } from '../../shared/workspace/PageHead';
import { Panel } from '../../shared/workspace/Panel';
import { getTrainerSearchService } from './trainerSearchService';
import { getBioReviewContent } from './bioReview.content';
import type { BioDecision, PendingBioDto } from './trainerSearch.types';
import styles from './BioReviewPage.module.css';

/**
 * `P-331` — staff review of trainers' short bios (`F-0401`).
 *
 * Approve publishes the text exactly as shown here; return sends it back with a
 * reason the trainer reads on their profile. Each decision carries the revision
 * this page loaded, so a bio the trainer edited since then is refused (409) and
 * the list reloads, rather than approving words nobody read.
 */
export default function BioReviewPage() {
  const { locale } = useLocale();
  const content = useMemo(() => getBioReviewContent(locale), [locale]);
  const service = getTrainerSearchService();

  const [items, setItems] = useState<readonly PendingBioDto[] | null>(null);
  const [error, setError] = useState<ExpertHubApiError | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ readonly ok: boolean; readonly text: string } | null>(
    null
  );
  const [returning, setReturning] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [noteError, setNoteError] = useState<string | null>(null);

  useEffect(() => {
    document.title = content.documentTitle;
  }, [content.documentTitle]);

  useEffect(() => {
    let cancelled = false;
    setItems(null);
    setError(null);
    void service.getPendingBios().then((result) => {
      if (cancelled) {
        return;
      }
      if (result.ok) {
        setItems(result.value);
      } else {
        setError(result.error);
      }
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadKey]);

  const decide = async (bio: PendingBioDto, decision: BioDecision) => {
    if (decision === 'return' && note.trim() === '') {
      setNoteError(content.noteRequired);
      return;
    }
    setBusy(true);
    setFeedback(null);
    const result = await service.decideBio(bio.trainerId, decision, note.trim(), bio.revision);
    setBusy(false);
    if (result.ok) {
      setItems(result.value);
      setReturning(null);
      setNote('');
      setNoteError(null);
      setFeedback({
        ok: true,
        text:
          decision === 'approve'
            ? content.approved(bio.trainerName)
            : content.returned(bio.trainerName),
      });
      return;
    }
    if (result.error.status === 409) {
      setFeedback({ ok: false, text: content.conflict });
      setReturning(null);
      setReloadKey((key) => key + 1);
      return;
    }
    setFeedback({ ok: false, text: content.failed });
  };

  const failure = error == null ? null : describeLoadFailure(error, locale, content.loadError);

  return (
    <WorkspacePage labelledBy="eh-bio-review-title">
      <PageHead
        titleId="eh-bio-review-title"
        title={content.title}
        lead={content.lead}
        summary={
          items != null && items.length > 0
            ? content.count(formatNumber(items.length, locale))
            : undefined
        }
      />

      {feedback != null && (
        <Alert tone={feedback.ok ? 'success' : 'error'} role={feedback.ok ? 'status' : 'alert'}>
          {feedback.text}
        </Alert>
      )}

      {failure != null ? (
        <ErrorState
          title={failure.title}
          description={failure.body}
          onRetry={failure.canRetry ? () => setReloadKey((key) => key + 1) : undefined}
          retryLabel={content.retry}
        />
      ) : items == null ? (
        <Loading variant="skeleton" lines={4} label={content.listLabel} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Icon name="task-done-01" size="featured" tone="primary" decorative />}
          title={content.empty.title}
          description={content.empty.body}
        />
      ) : (
        <ul className={styles.list} aria-label={content.listLabel}>
          {items.map((bio) => (
            <li key={bio.trainerId}>
              <Panel
                title={bio.trainerName}
                headingLevel={2}
                icon="note-edit"
                meta={
                  bio.submittedAt == null
                    ? undefined
                    : content.submittedAt(formatDate(bio.submittedAt, locale))
                }
              >
                <div className={styles.body}>
                  <div>
                    <Tag variant="neutral" size="sm">
                      {bio.draftSource === 'ai' ? content.sourceAi : content.sourceTrainer}
                    </Tag>
                  </div>
                  <Typography as="p" variant="text-md">
                    {bio.draft}
                  </Typography>

                  {bio.published != null && (
                    <div className={styles.published}>
                      <Typography as="h3" variant="text-sm" weight="bold">
                        {content.publishedNow}
                      </Typography>
                      <Typography as="p" variant="text-sm" color="muted">
                        {bio.published}
                      </Typography>
                    </div>
                  )}

                  {returning === bio.trainerId ? (
                    <div className={styles.body}>
                      <Textarea
                        label={content.noteLabel}
                        helperText={content.noteHelper}
                        errorText={noteError ?? undefined}
                        value={note}
                        onChange={(event) => setNote(event.target.value)}
                        rows={3}
                        requiredField
                        disabled={busy}
                      />
                      <div className={styles.actions}>
                        <Button
                          variant="primary"
                          size="md"
                          disabled={busy}
                          onClick={() => void decide(bio, 'return')}
                        >
                          {content.confirmReturn}
                        </Button>
                        <Button
                          variant="tertiary"
                          size="md"
                          disabled={busy}
                          onClick={() => {
                            setReturning(null);
                            setNoteError(null);
                          }}
                        >
                          {content.cancel}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className={styles.actions}>
                      <Button
                        variant="primary"
                        size="md"
                        disabled={busy}
                        onClick={() => void decide(bio, 'approve')}
                      >
                        {content.approve}
                      </Button>
                      <Button
                        variant="secondary"
                        size="md"
                        disabled={busy}
                        onClick={() => {
                          setReturning(bio.trainerId);
                          setNote('');
                          setNoteError(null);
                        }}
                      >
                        {content.returnAction}
                      </Button>
                    </div>
                  )}
                </div>
              </Panel>
            </li>
          ))}
        </ul>
      )}
    </WorkspacePage>
  );
}
