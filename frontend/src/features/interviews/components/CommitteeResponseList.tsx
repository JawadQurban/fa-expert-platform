import { Tag, Typography } from '@ds/primitives';
import type { TagVariant } from '@ds/primitives';
import type { Locale } from '@/types';
import { localized } from '../../../shared/types/localizedText';
import type { InterviewsContent } from '../interviews.content';
import { allMembersResponded, pendingMembers } from '../interview.types';
import type { CommitteeMemberResponseDto, MemberResponseState } from '../interview.types';
import styles from './CommitteeResponseList.module.css';
import { formatDate } from '../../../shared/formatting';

/**
 * J-07/F2/AC-1 made visible: the interview result is not calculated — and the
 * application is not forwarded — until **every** assigned member has responded
 * (`BR-0220`). Showing exactly who is still outstanding turns that rule from an
 * unexplained block into an actionable one.
 *
 * "Did not attend" is displayed as its own state, never as a zero score
 * (F1/AC-3): state is conveyed by text + Tag variant, never colour alone.
 */
const STATE_VARIANT: Readonly<Record<MemberResponseState, TagVariant>> = {
  pending: 'warning',
  submitted: 'success',
  'did-not-attend': 'neutral',
};

export function CommitteeResponseList({
  committee,
  viewerMemberId,
  content,
  locale,
}: {
  readonly committee: readonly CommitteeMemberResponseDto[];
  readonly viewerMemberId: string | null;
  readonly content: InterviewsContent;
  readonly locale: Locale;
}) {
  const copy = content.committee;
  const outstanding = pendingMembers(committee);
  const complete = allMembersResponded(committee);

  return (
    <div className={styles.wrapper}>
      <Typography as="p" variant="text-sm" color="muted">
        {copy.description}
      </Typography>

      <ul className={styles.list} aria-label={copy.heading}>
        {committee.map((member) => (
          <li key={member.memberId} className={styles.item}>
            <span className={styles.identity}>
              <Typography as="span" variant="text-md" weight="medium">
                {member.name}
                {member.memberId === viewerMemberId && (
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
            <span className={styles.state}>
              <Tag variant={STATE_VARIANT[member.state]} size="sm">
                {copy.states[member.state]}
              </Tag>
              {member.respondedAt != null && (
                <Typography as="span" variant="text-xs" color="muted">
                  {copy.respondedAt(
                    formatDate(new Date(member.respondedAt), locale, {
                      dateStyle: 'medium',
                    })
                  )}
                </Typography>
              )}
            </span>
          </li>
        ))}
      </ul>

      <Typography as="p" variant="text-sm" color="muted" role="status">
        {complete ? copy.complete : copy.awaiting(outstanding.length)}
      </Typography>
    </div>
  );
}
