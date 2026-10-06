import { Tag, Typography } from '@ds/primitives';
import type { Locale } from '@/types';
import type { SubmissionsContent } from '../submissions.content';
import {
  SUBMISSION_STATUS,
  type SubmissionRoundDto,
  type SubmissionStatus,
} from '../submission.types';
import styles from './SubmissionRounds.module.css';
import { dateFormatter } from '../../../shared/formatting';

/**
 * A submission's status — or a round's decision, which uses the same values —
 * as a tag. One mapping for every page, so the tones cannot drift apart.
 */
export function SubmissionStatusTag({
  value,
  label,
}: {
  readonly value: SubmissionStatus | null;
  readonly label: string;
}) {
  return (
    <Tag
      variant={
        value === SUBMISSION_STATUS.approved
          ? 'success'
          : value === SUBMISSION_STATUS.changesRequested
            ? 'warning'
            : 'information'
      }
      size="sm"
    >
      {label}
    </Tag>
  );
}

/**
 * The review history for one submission (**F2/AC-4**, **F5/AC-4**) — shown to
 * both sides, because both need it:
 *
 * - The submitter has to see **what was asked for last time** before uploading
 *   again.
 * - The coordinator has to see **what they already asked for**, so a second
 *   review is not a first review repeated.
 *
 * ⚠️ `G26` — a round records a file **name** only (no size, no URL). F2/AC-2's
 * preview has no source, and a dead download link would be worse than saying so.
 */
export function SubmissionRounds({
  rounds,
  content,
  locale,
  showHeading = true,
}: {
  readonly rounds: readonly SubmissionRoundDto[];
  readonly content: SubmissionsContent;
  readonly locale: Locale;
  /** Off where the surrounding panel already carries the rounds heading. */
  readonly showHeading?: boolean;
}) {
  if (rounds.length === 0) {
    return null;
  }
  const dates = dateFormatter(locale, {
    dateStyle: 'medium',
  });

  return (
    <>
      {showHeading && (
        <Typography as="h3" variant="text-md" weight="bold">
          {content.roundsHeading}
        </Typography>
      )}
      <ol className={styles.rounds}>
        {rounds.map((round) => (
          <li key={round.roundNumber} className={styles.round}>
            <div className={styles.roundHead}>
              <Typography as="span" variant="text-sm" weight="bold">
                {content.roundLabel(round.roundNumber)}
              </Typography>
              <SubmissionStatusTag
                value={round.decision}
                label={
                  round.decision == null
                    ? content.roundPending
                    : content.roundOutcomes[round.decision]
                }
              />
            </div>
            <Typography as="p" variant="text-sm">
              <bdi>{round.fileName}</bdi>
            </Typography>
            <Typography as="p" variant="text-xs" color="muted">
              {dates.format(new Date(round.uploadedAt))}
            </Typography>
            {/* F2/AC-3 — the note travels with the round it belongs to. */}
            {round.note != null && (
              <div className={styles.note}>
                <Typography as="p" variant="text-sm" weight="bold">
                  {content.coordinatorNote}
                </Typography>
                <Typography as="p" variant="text-sm">
                  <bdi>{round.note}</bdi>
                </Typography>
              </div>
            )}
          </li>
        ))}
      </ol>
      <Typography as="p" variant="text-xs" color="muted">
        {content.previewUnavailable}
      </Typography>
    </>
  );
}
