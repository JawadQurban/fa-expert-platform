import { Alert } from '@ds/composite';
import { Tag, Typography } from '@ds/primitives';
import type { Locale } from '@/types';
import type { AgreementsContent } from '../agreements.content';
import { readyToSendToApplicant } from '../agreement.types';
import { Panel } from '../../../shared/workspace/Panel';
import styles from './SendStatusCard.module.css';
import { formatDate } from '../../../shared/formatting';

/**
 * J-10/F3/AC-5 (`BR-0213`) — the agreement reaches the applicant only when the
 * **whole sequence has completed** and a **signature is attached**.
 *
 * The two conditions are reported separately, and the card repeats the part
 * people get wrong: a signature on its own does not send. That clarification is
 * in the journey text itself ("the e-signature alone is not sufficient"), which
 * is a strong hint it had already been misread once.
 */
export function SendStatusCard({
  sequenceComplete,
  signaturesAttached,
  sentAt,
  content,
  locale,
}: {
  readonly sequenceComplete: boolean;
  readonly signaturesAttached: boolean;
  readonly sentAt: string | null;
  readonly content: AgreementsContent;
  readonly locale: Locale;
}) {
  const copy = content.send;
  const sent = sentAt != null;
  const ready = readyToSendToApplicant({ sequenceComplete, signaturesAttached });

  return (
    <Panel title={copy.heading} titleId="eh-agreement-send">
      {sent ? (
        <>
          <Alert tone="success" surface="tinted" title={copy.sentTitle} role="status">
            {copy.sentBody}
          </Alert>
          <Typography as="p" variant="text-xs" color="muted">
            {copy.sentAt(
              formatDate(new Date(sentAt), locale, {
                dateStyle: 'medium',
                timeStyle: 'short',
              })
            )}
          </Typography>
        </>
      ) : (
        <>
          <ul className={styles.conditions}>
            <li className={styles.condition}>
              <Typography as="span" variant="text-sm">
                {copy.pendingSequence}
              </Typography>
              <Tag variant={sequenceComplete ? 'success' : 'warning'} size="sm">
                {sequenceComplete ? content.gate.met : content.gate.pending}
              </Tag>
            </li>
            <li className={styles.condition}>
              <Typography as="span" variant="text-sm">
                {copy.pendingSignature}
              </Typography>
              <Tag variant={signaturesAttached ? 'success' : 'warning'} size="sm">
                {signaturesAttached ? content.gate.met : content.gate.pending}
              </Tag>
            </li>
          </ul>

          <Alert
            tone={ready ? 'success' : 'info'}
            surface="tinted"
            title={copy.pendingTitle}
            role="status"
          >
            {copy.bothRequired}
          </Alert>
        </>
      )}
    </Panel>
  );
}
