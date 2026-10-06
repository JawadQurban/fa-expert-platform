import { Tag, Typography } from '@ds/primitives';
import type { TagVariant } from '@ds/primitives';
import type { Locale } from '@/types';
import { localized } from '../../../shared/types/localizedText';
import type { AgreementsContent } from '../agreements.content';
import type { SigningMemberDto, SigningMemberState } from '../agreement.types';
import styles from './SigningSequenceTimeline.module.css';
import { formatDate, formatNumber } from '../../../shared/formatting';

/**
 * J-10/F3 — the signing sequence and where the document currently sits.
 *
 * Each row shows whether the person is a **signer** or a **reviewer**, because
 * that determines what they can even do when their turn comes (F3/AC-3 vs AC-4).
 * Reading the timeline without it would leave the difference invisible.
 *
 * There is no rejected state here — J-10/F3/AC-6 removed rejection from this
 * stage entirely, and the contract has no value to render for it.
 */
const STATE_VARIANT: Readonly<Record<SigningMemberState, TagVariant>> = {
  waiting: 'neutral',
  current: 'information',
  approved: 'success',
  signed: 'success',
  'modification-requested': 'warning',
};

export function SigningSequenceTimeline({
  sequence,
  viewerApproverId,
  content,
  locale,
}: {
  readonly sequence: readonly SigningMemberDto[];
  readonly viewerApproverId: string | null;
  readonly content: AgreementsContent;
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
              {member.note != null && member.note !== '' && (
                <Typography as="span" variant="text-sm" className={styles.note}>
                  {copy.noteLabel}: {member.note}
                </Typography>
              )}
            </span>

            <span className={styles.state}>
              {/* Signer vs reviewer decides what this person can do on their turn. */}
              <Tag variant={member.isSigner ? 'information' : 'neutral'} size="sm" outline>
                {member.isSigner ? copy.signerTag : copy.reviewerTag}
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
