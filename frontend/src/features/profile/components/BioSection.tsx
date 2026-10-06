import { useEffect, useState } from 'react';
import { Alert } from '@ds/composite';
import { Button, Tag, Textarea, Typography } from '@ds/primitives';
import type { TagVariant } from '@ds/primitives';
import type { ProfileContent } from '../profile.content';
import { BIO_MAX_LENGTH } from '../profile.types';
import type { TrainerBioDto, TrainerBioStatus } from '../profile.types';
import styles from './BioSection.module.css';

const STATUS_TAG: Readonly<Record<TrainerBioStatus, TagVariant>> = {
  none: 'neutral',
  drafting: 'information',
  ai_draft: 'information',
  ai_unavailable: 'warning',
  pending_review: 'warning',
  returned: 'error',
  approved: 'success',
};

/**
 * `P-331` — the trainer's short bio. The AI suggests a draft from the CV, the
 * trainer edits it and submits it, and staff approve it. Only the approved text
 * is shown anywhere else, so the approved version is shown here too while an
 * edit waits for review.
 *
 * The page owns the calls; each action answers the copy for its failure (or
 * `null`), shown under the field rather than as a page-level error.
 */
export function BioSection({
  bio,
  content,
  busy,
  onDraft,
  onSubmit,
  onRefresh,
}: {
  readonly bio: TrainerBioDto;
  readonly content: ProfileContent;
  readonly busy: boolean;
  readonly onDraft: () => Promise<string | null>;
  readonly onSubmit: (text: string) => Promise<string | null>;
  readonly onRefresh: () => void;
}) {
  const copy = content.bio;
  const [text, setText] = useState(bio.draft ?? bio.published ?? '');
  const [error, setError] = useState<string | null>(null);

  // A new revision (an AI draft landed, a submission was saved) replaces what
  // is in the field: it is the server's text now.
  useEffect(() => {
    setText(bio.draft ?? bio.published ?? '');
    setError(null);
  }, [bio.revision, bio.draft, bio.published]);

  const trimmed = text.trim();
  const drafting = bio.status === 'drafting';

  const submit = async () => {
    if (trimmed === '' || trimmed.length > BIO_MAX_LENGTH) {
      setError(copy.lengthError(BIO_MAX_LENGTH));
      return;
    }
    setError(await onSubmit(trimmed));
  };

  const draft = async () => setError(await onDraft());

  return (
    <div className={styles.stack}>
      <div>
        <Tag variant={STATUS_TAG[bio.status]} size="sm">
          {copy.status[bio.status]}
        </Tag>
      </div>

      {drafting && (
        <Alert tone="info" surface="tinted" role="status">
          {copy.draftingBody}
        </Alert>
      )}
      {bio.status === 'ai_draft' && (
        <Alert tone="info" surface="tinted" role="note">
          {copy.aiDraftBody}
        </Alert>
      )}
      {bio.status === 'ai_unavailable' && (
        <Alert tone="warning" surface="tinted" role="note">
          {copy.aiUnavailableBody}
        </Alert>
      )}
      {bio.status === 'pending_review' && (
        <Alert tone="neutral" surface="tinted" role="note">
          {copy.pendingBody}
        </Alert>
      )}
      {bio.status === 'returned' && bio.reviewNote != null && (
        <Alert tone="error" surface="tinted" role="note" title={copy.returnedTitle}>
          {bio.reviewNote}
        </Alert>
      )}

      {/* The approved text, while a different one waits — it is what the public sees. */}
      {bio.published != null && bio.status !== 'approved' && (
        <div className={styles.published}>
          <Typography as="h3" variant="text-sm" weight="bold">
            {copy.publishedLabel}
          </Typography>
          <Typography as="p" variant="text-md">
            {bio.published}
          </Typography>
          <Typography as="p" variant="text-sm" color="muted">
            {copy.publishedWhileReview}
          </Typography>
        </div>
      )}

      <Textarea
        label={copy.label}
        helperText={copy.helper}
        errorText={error ?? undefined}
        value={text}
        onChange={(event) => setText(event.target.value)}
        maxLength={BIO_MAX_LENGTH}
        rows={4}
        showCharacterCount
        disabled={busy}
      />

      <div className={styles.actions}>
        <Button
          variant="primary"
          size="md"
          disabled={busy || trimmed === ''}
          onClick={() => void submit()}
        >
          {copy.submit}
        </Button>
        {bio.hasCv && !drafting && bio.status !== 'pending_review' && (
          <Button variant="secondary" size="md" disabled={busy} onClick={() => void draft()}>
            {copy.draftFromCv}
          </Button>
        )}
        {drafting && (
          <Button variant="tertiary" size="md" disabled={busy} onClick={onRefresh}>
            {copy.refresh}
          </Button>
        )}
      </div>
    </div>
  );
}
