import { Alert } from '@ds/composite';
import { Tag, Typography } from '@ds/primitives';
import type { AgreementsContent } from '../agreements.content';
import type { AgreementGateDto } from '../agreement.types';
import { Panel } from '../../../shared/workspace/Panel';
import styles from './AgreementGateCard.module.css';

/**
 * J-10/F1/AC-1 — preparation begins only once **both** J-09 outcomes are in:
 * final committee approval and completed applicant bank data.
 *
 * The two conditions are listed separately rather than summarised as one
 * "not ready" message, because the creator's next action differs entirely
 * depending on which half is missing — chase the committee, or chase the
 * applicant.
 */
export function AgreementGateCard({
  gate,
  content,
}: {
  readonly gate: AgreementGateDto;
  readonly content: AgreementsContent;
}) {
  const copy = content.gate;

  return (
    <Panel title={copy.blockedTitle} titleId="eh-agreement-gate" icon="alert-02" tone="warning">
      <Alert tone="warning" surface="tinted" role="status">
        {copy.blockedBody}
      </Alert>

      <ul className={styles.list}>
        <ConditionRow label={copy.committeeLabel} met={gate.committeeApproved} copy={copy} />
        <ConditionRow label={copy.bankLabel} met={gate.bankDataComplete} copy={copy} />
      </ul>
    </Panel>
  );
}

function ConditionRow({
  label,
  met,
  copy,
}: {
  readonly label: string;
  readonly met: boolean;
  readonly copy: AgreementsContent['gate'];
}) {
  return (
    <li className={styles.row}>
      <Typography as="span" variant="text-sm">
        {label}
      </Typography>
      <Tag variant={met ? 'success' : 'warning'} size="sm">
        {met ? copy.met : copy.pending}
      </Tag>
    </li>
  );
}
