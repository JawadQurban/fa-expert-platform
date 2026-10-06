import { Tag, Typography } from '@ds/primitives';
import type { TagVariant } from '@ds/primitives';
import type { Locale } from '@/types';
import { localized } from '../../../shared/types/localizedText';
import type { CommitteeContent } from '../committee.content';
import type { MemberDecisionState, SequenceMemberDto } from '../committee.types';
import styles from './ApprovalSequenceTimeline.module.css';
import { formatDate, formatNumber } from '../../../shared/formatting';

/**
 * P-05 Approval Timeline for J-09/F4 — the sequence, its order, and where the
 * application currently sits.
 *
 * Obligation is displayed on every row, not just implied by ordering, because it
 * is the field that decides what a rejection *means* (`BR-0211` revised): a
 * mandatory rejection halts the application, an optional one is a note. A reader
 * who cannot see the classification cannot interpret the outcome.
 *
 * State is conveyed by text + Tag variant, never colour alone.
 */
const STATE_VARIANT: Readonly<Record<MemberDecisionState, TagVariant>> = {
  waiting: 'neutral',
  current: 'information',
  approved: 'success',
  rejected: 'error',
  'modification-requested': 'warning',
};

export function ApprovalSequenceTimeline({
  sequence,
  viewerApproverId,
  content,
  locale,
}: {
  readonly sequence: readonly SequenceMemberDto[];
  readonly viewerApproverId: string | null;
  readonly content: CommitteeContent;
  readonly locale: Locale;
}) {
  const copy = content.sequence;

  return (
    <div className={styles.wrapper}>
      <Typography as="p" variant="text-sm" color="muted">
        {copy.description}
      </Typography>

      <ol className={styles.list} aria-label={copy.heading}>
        {sequence.map((member) => (
          <li key={member.approverId} className={styles.item} data-state={member.state}>
            <span className={styles.position} aria-hidden="true">
              {formatNumber(member.position, locale)}
            </span>
            <span className={styles.body}>
              <span className={styles.identity}>
                <Typography as="span" variant="text-md" weight="medium">
                  {member.name}
                  {member.approverId === viewerApproverId && (
                    <Typography as="span" variant="text-sm" color="muted">
                      {' '}
                      ({copy.you})
                    </Typography>
                  )}
                </Typography>
                <Typography as="span" variant="text-sm" color="muted">
                  {localized(member.roleTitle, locale)}
                </Typography>
              </span>

              {member.note != null && member.note !== '' && (
                <Typography as="span" variant="text-sm" className={styles.note}>
                  {copy.noteLabel}: {member.note}
                </Typography>
              )}
            </span>

            <span className={styles.state}>
              {/* Obligation is part of the row: it defines what a rejection does. */}
              <Tag
                variant={member.obligation === 'mandatory' ? 'information' : 'neutral'}
                size="sm"
                outline
              >
                {content.formation.obligations[member.obligation]}
              </Tag>
              <Tag variant={STATE_VARIANT[member.state]} size="sm">
                {copy.states[member.state]}
              </Tag>
              {member.decidedAt != null && (
                <Typography as="span" variant="text-xs" color="muted">
                  {copy.decidedAt(
                    formatDate(new Date(member.decidedAt), locale, {
                      dateStyle: 'medium',
                    })
                  )}
                </Typography>
              )}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
