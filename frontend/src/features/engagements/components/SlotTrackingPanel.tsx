import { useEffect, useState } from 'react';
import { Alert, Card } from '@ds/composite';
import { Button, Tag, Typography } from '@ds/primitives';
import { useLocale } from '@i18n/LocaleProvider';
import { expertHubPaths } from '../../../app/router/paths';
import { SlaBadge } from '../../../shared/components/SlaBadge';
import { getWithdrawalService } from '../../withdrawal/withdrawalService';
import { getWithdrawalContent, terminationErrorText } from '../../withdrawal/withdrawal.content';
import { TerminationPanel } from '../../withdrawal/components/TerminationPanel';
import { STAFF_DELINK_REASONS, type DelinkTrainerInput } from '../../withdrawal/withdrawal.types';
import { getEngagementService } from '../engagementService';
import { getEngagementsContent } from '../engagements.content';
import type { AssignmentSlotDto, SlotSyncState } from '../offer.types';
import styles from './SlotTrackingPanel.module.css';
import { dateFormatter } from '../../../shared/formatting';

/**
 * The **Internal Dashboard** half of J-18 — "tracking responses", per slot.
 *
 * It is read-only on purpose. Every write in this journey belongs to either the
 * system (sending, expiring, syncing FAST) or the trainer (accept/reject), so
 * there is no staff action to offer here and none is invented:
 *
 * - **F1/AC-1** — the panel states that offers went out automatically. Staff who
 *   expect a "send" button are told why there is none.
 * - **F1/AC-2** — one live offer per slot, with the backups listed *in rank
 *   order but untouched*, so it is visible that they have received nothing yet.
 * - **F2/AC-2 + AC-4** — the history distinguishes an explicit rejection from a
 *   silent expiry, which is the distinction the two notifications rest on.
 * - **F2/AC-5** — an exhausted slot is called out, because that is J-19's
 *   trigger and the point at which someone has to act.
 * - **F4/AC-1** — the FAST state is shown per slot, since a confirmed slot syncs
 *   without waiting for the rest of the request.
 *
 * The one action it does carry is **J-22/F2 de-linking**, and it belongs here
 * because this is the only screen that lists confirmed slots. It is offered on a
 * confirmed slot and nowhere else: an unfilled slot has nothing to unlink. The
 * panel states, before staff act, that de-linking **does not cancel the plan in
 * FAST** (F2/AC-3) — precisely the thing they would otherwise assume.
 *
 * ⚠️ The slot record carries no engagement status or start date, so the action
 * cannot be hidden for an engagement that has already started or is inside its
 * 24-hour notice period. The server refuses both, and the refusal is shown in
 * its own words.
 */

const SYNC_VARIANT: Readonly<Record<SlotSyncState, 'neutral' | 'warning' | 'success'>> = {
  none: 'neutral',
  processing: 'warning',
  synchronized: 'success',
};

export function SlotTrackingPanel({ requestId }: { readonly requestId: string }) {
  const { locale } = useLocale();
  const content = getEngagementsContent(locale);
  const copy = content.tracking;
  const service = getEngagementService();

  const [slots, setSlots] = useState<readonly AssignmentSlotDto[]>([]);
  const [failed, setFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [delinking, setDelinking] = useState<string | null>(null);
  const [delinkBusy, setDelinkBusy] = useState(false);
  const [delinked, setDelinked] = useState<{ slot: number; reopened: boolean } | null>(null);
  const [delinkError, setDelinkError] = useState<string | null>(null);
  const withdrawalService = getWithdrawalService();
  const withdrawalCopy = getWithdrawalContent(locale);

  useEffect(() => {
    let cancelled = false;
    void service.getRequestSlots(requestId).then((result) => {
      if (cancelled) {
        return;
      }
      if (result.ok) {
        setSlots(result.value);
      } else {
        setFailed(true);
      }
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestId, reloadKey]);

  /**
   * J-22/F2 — end one trainer's engagement on one slot. AC-3: the plan itself is
   * untouched in FAST, and nothing on this contract could touch it. AC-5: the
   * slot goes back to re-matching, which is why the confirmation offers J-19.
   */
  const delink = (engagementId: string, slot: number, reason: string, note: string) => {
    const input =
      reason === 'other'
        ? ({ reason: 'other', note } as DelinkTrainerInput)
        : ({ reason } as DelinkTrainerInput);
    setDelinkBusy(true);
    setDelinkError(null);
    setDelinked(null);
    void withdrawalService.delinkTrainer(engagementId, input).then((result) => {
      setDelinkBusy(false);
      if (result.ok) {
        setDelinking(null);
        // The result names no slot; the slot is the one this action was on.
        setDelinked({ slot, reopened: result.value.slotReopened });
        setReloadKey((key) => key + 1);
        return;
      }
      setDelinkError(terminationErrorText(withdrawalCopy, 'delink', result.error));
      if (result.error.status === 409) {
        // Already ended, started, or past its notice period: re-read the slots.
        setDelinking(null);
        setReloadKey((key) => key + 1);
      }
    });
  };

  if (failed) {
    return (
      <Alert tone="error" role="alert">
        {content.errors.loadBody}
      </Alert>
    );
  }

  if (slots.length === 0) {
    return null;
  }

  const dates = dateFormatter(locale, {
    dateStyle: 'medium',
  });

  return (
    <Card effect="stroke" className={styles.panel}>
      <Typography as="h2" variant="text-lg" weight="bold">
        {copy.heading}
      </Typography>
      <Typography as="p" variant="text-sm" color="muted">
        {copy.description}
      </Typography>
      {/* F1/AC-1 — why there is no send action anywhere on this page. */}
      <Alert tone="info" role="note">
        {copy.automaticNote}
      </Alert>

      {/* J-22/F2/AC-5 — the slot is back in matching, and here is the way in. */}
      {delinked != null && (
        <Alert tone="success" role="status" title={withdrawalCopy.delink.doneTitle}>
          {delinked.reopened
            ? withdrawalCopy.delink.doneBody(delinked.slot)
            : withdrawalCopy.delink.doneBodyExhausted(delinked.slot)}
        </Alert>
      )}
      {delinkError != null && (
        <Alert tone="error" role="alert">
          {delinkError}
        </Alert>
      )}

      <ul className={styles.slots}>
        {slots.map((slot) => (
          <li key={slot.slotNumber} className={styles.slot}>
            <div className={styles.slotHead}>
              <Typography as="h3" variant="text-md" weight="bold">
                {copy.slotHeading(slot.slotNumber)}
              </Typography>
              <Tag variant={SYNC_VARIANT[slot.fastSync]} size="sm">
                {`${copy.fastHeading}: ${copy.fastStates[slot.fastSync]}`}
              </Tag>
            </div>

            {slot.confirmedTrainerId != null ? (
              <>
                <Typography as="p" variant="text-md">
                  {copy.confirmed(
                    slot.history.find((offer) => offer.status === 'accepted')?.trainerName ??
                      slot.confirmedTrainerId
                  )}
                </Typography>
                {/* J-22/F2/AC-1 — offered on a confirmed slot, and only there. */}
                {slot.confirmedEngagementId != null &&
                  (delinking === slot.confirmedEngagementId ? (
                    <TerminationPanel
                      heading={withdrawalCopy.delink.heading}
                      intro={withdrawalCopy.delink.intro}
                      before={
                        <Alert tone="info" role="note">
                          {withdrawalCopy.delink.planUntouched}
                        </Alert>
                      }
                      reasonLegend={withdrawalCopy.delink.reasonLegend}
                      reasons={STAFF_DELINK_REASONS.map((reason) => ({
                        value: reason,
                        label: withdrawalCopy.delink.reasons[reason],
                      }))}
                      otherValue="other"
                      noteLabel={withdrawalCopy.delink.noteLabel}
                      noteHint={withdrawalCopy.delink.noteHint}
                      confirmLabel={withdrawalCopy.delink.confirm}
                      cancelLabel={withdrawalCopy.delink.cancel}
                      errors={{
                        'reason-required': withdrawalCopy.errors.reasonRequired,
                        'note-required': withdrawalCopy.errors.noteRequired,
                      }}
                      busy={delinkBusy}
                      onConfirm={(reason, note) => {
                        delink(slot.confirmedEngagementId ?? '', slot.slotNumber, reason, note);
                      }}
                      onCancel={() => setDelinking(null)}
                    />
                  ) : (
                    <div>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setDelinking(slot.confirmedEngagementId)}
                      >
                        {withdrawalCopy.delink.action}
                      </Button>
                    </div>
                  ))}
              </>
            ) : slot.currentOffer != null ? (
              <div className={styles.offerRow}>
                <Typography as="p" variant="text-md">
                  {copy.awaiting(slot.currentOffer.trainerName)}
                </Typography>
                <Typography as="p" variant="text-sm" color="muted">
                  {copy.sentAt(dates.format(new Date(slot.currentOffer.sentAt)))}
                </Typography>
                {slot.currentOffer.responseSla != null && (
                  <SlaBadge
                    state={slot.currentOffer.responseSla.state}
                    label={
                      slot.currentOffer.responseSla.daysRemaining < 0
                        ? content.offers.slaExpired
                        : content.offers.slaRemaining(slot.currentOffer.responseSla.daysRemaining)
                    }
                  />
                )}
              </div>
            ) : (
              <Typography as="p" variant="text-sm" color="muted">
                {copy.noOffer}
              </Typography>
            )}

            {/* F2/AC-5 — the trigger J-19 picks up, and the way into it. */}
            {slot.exhausted && (
              <>
                <Alert tone="warning" role="status" title={copy.exhaustedTitle}>
                  {copy.exhaustedBody}
                </Alert>
                <div>
                  <Button
                    variant="primary"
                    size="sm"
                    href={expertHubPaths.internalSlotReRouting(requestId, slot.slotNumber)}
                  >
                    {copy.reRouteAction}
                  </Button>
                </div>
              </>
            )}

            {/* F1/AC-2 — ranked, and waiting; they have received nothing. */}
            <Typography as="h4" variant="text-sm" weight="bold">
              {copy.backupsHeading}
            </Typography>
            {slot.backups.length === 0 ? (
              <Typography as="p" variant="text-sm" color="muted">
                {copy.backupsEmpty}
              </Typography>
            ) : (
              <ol className={styles.plainList}>
                {slot.backups.map((backup) => (
                  <li key={backup.trainerId}>
                    <Typography as="span" variant="text-sm">
                      <bdi>{copy.backupRow(backup.preferenceRank, backup.trainerName)}</bdi>
                    </Typography>
                  </li>
                ))}
              </ol>
            )}

            {/* F2/AC-2 vs AC-4 — rejection and expiry read differently. */}
            {slot.history.length > 0 && (
              <>
                <Typography as="h4" variant="text-sm" weight="bold">
                  {copy.historyHeading}
                </Typography>
                <ul className={styles.plainList}>
                  {slot.history.map((offer) => (
                    <li key={offer.offerId} className={styles.historyRow}>
                      <Typography as="span" variant="text-sm">
                        <bdi>{offer.trainerName}</bdi>
                      </Typography>
                      <Tag
                        variant={
                          offer.status === 'accepted'
                            ? 'success'
                            : offer.status === 'expired'
                              ? 'warning'
                              : 'neutral'
                        }
                        size="sm"
                      >
                        {copy.outcomes[offer.status]}
                      </Tag>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </li>
        ))}
      </ul>

      {/* ⚠️ J-25 — the notifications this state would drive are undocumented. */}
      <Typography as="p" variant="text-sm" color="muted">
        {copy.notificationNote}
      </Typography>
    </Card>
  );
}
