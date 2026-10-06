import { Alert } from '@ds/composite';
import { Button, Tag, Typography } from '@ds/primitives';
import type { TagVariant } from '@ds/primitives';
import type { Locale } from '@/types';
import { expertHubPaths } from '../../../app/router/paths';
import type { CommitteeContent } from '../committee.content';
import { readyForAgreement } from '../committee.types';
import type { BankDataState, BankDataStatusDto, CommitteeOutcomeDto } from '../committee.types';
import { Panel } from '../../../shared/workspace/Panel';
import { formatDate } from '../../../shared/formatting';

/**
 * J-09/F6 seen from the creator's side, plus the J-10 gate it forms with F5.
 *
 * The journey is explicit that final approval and bank-data collection run **in
 * parallel** (F4/AC-5), and that agreement preparation needs *both* (F5/AC-3).
 * This card therefore reports the two conditions separately and only then says
 * whether J-10 can start — rather than collapsing them into a single "ready"
 * badge that would hide which half is outstanding.
 *
 * ⚠️ Open item carried from J-09: whether this bank data becomes part of the
 * trainer's permanent profile (reused for renewals) or is collected fresh each
 * time is **not yet confirmed** — it affects J-14/J-15 and is flagged, not
 * assumed, here.
 */
const STATE_VARIANT: Readonly<Record<BankDataState, TagVariant>> = {
  'not-requested': 'neutral',
  requested: 'warning',
  complete: 'success',
};

export function BankDataGateCard({
  bankData,
  outcome,
  applicationId,
  content,
  locale,
}: {
  readonly bankData: BankDataStatusDto;
  readonly outcome: CommitteeOutcomeDto;
  /** Used to link on to EH-INT-06a once the gate opens. */
  readonly applicationId: string | null;
  readonly content: CommitteeContent;
  readonly locale: Locale;
}) {
  const copy = content.bankData;
  const ready = readyForAgreement({ outcome, bankData });

  const note =
    bankData.state === 'complete'
      ? copy.completeNote
      : bankData.state === 'requested'
        ? copy.requestedNote
        : copy.notRequestedNote;

  const stamp =
    bankData.state === 'complete'
      ? bankData.completedAt
      : bankData.state === 'requested'
        ? bankData.requestedAt
        : null;

  return (
    <Panel
      title={copy.heading}
      titleId="eh-committee-bank"
      icon="alert-02"
      tone={ready ? 'primary' : 'warning'}
      actions={
        <Tag variant={STATE_VARIANT[bankData.state]} size="sm">
          {copy.states[bankData.state]}
        </Tag>
      }
    >
      <Typography as="p" variant="text-sm" color="muted">
        {copy.description}
      </Typography>

      <Typography as="p" variant="text-sm">
        {note}
        {stamp != null &&
          ` · ${formatDate(new Date(stamp), locale, {
            dateStyle: 'medium',
          })}`}
      </Typography>

      {/* F5/AC-3 — the J-10 gate is the conjunction of two independent states. */}
      <Alert tone={ready ? 'success' : 'warning'} surface="tinted" role="status">
        {ready ? copy.gateReady : copy.gateBlocked}
      </Alert>

      {/* Once the gate opens, J-10 is the next stop — linked so the chain stays
          walkable rather than reachable only by typing a URL. */}
      {ready && applicationId != null && (
        <div>
          <Button
            variant="primary"
            size="md"
            href={expertHubPaths.internalApplicationAgreement(applicationId)}
          >
            {copy.goToAgreement}
          </Button>
        </div>
      )}
    </Panel>
  );
}
