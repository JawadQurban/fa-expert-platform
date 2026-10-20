import { useState } from 'react';
import { Alert, Card, ItemIcon, Modal } from '@ds/composite';
import { Button, Icon, Tag, Typography } from '@ds/primitives';
import type { Locale } from '@/types';
import { SlaBadge } from '../../../shared/components/SlaBadge';
import type { SlaDto } from '../../../shared/types/sla';
import type { EngagementsContent } from '../engagements.content';
import type { AssignmentOfferDto, OfferResponse } from '../offer.types';
import { PlanDetailsList } from './PlanDetailsList';
import styles from './OfferCard.module.css';
import { formatNumber } from '../../../shared/formatting';

/**
 * One live assignment offer awaiting this trainer's answer (**J-18/F2/AC-1**).
 *
 * - The **3-day window is rendered, never computed** (P-J4): `responseSla` is
 *   server-decided, because F2/AC-3 makes expiry automatic and a browser that
 *   disagreed about whether three days had passed would answer for the trainer.
 * - Accept and reject are the **only two answers** (`OfferResponse`), and the
 *   card says the decision is final — on rejection the offer leaves for the next
 *   candidate and cannot be recalled.
 * - The request detail is the same `RequestDetailsDto` the engagement later
 *   carries (F1/AC-3), so nothing here is a summary of a summary. The programme
 *   name is single-language data and is rendered as given.
 * - A price the agreement does not carry (`DM-GAP-16`) reads "not set", never 0.
 */

/** The countdown, phrased from the server's `daysRemaining` alone. */
function slaLabel(sla: SlaDto, content: EngagementsContent): string {
  if (sla.daysRemaining < 0) {
    return content.offers.slaExpired;
  }
  return sla.daysRemaining <= 1
    ? content.offers.slaLastDay
    : content.offers.slaRemaining(sla.daysRemaining);
}

export function OfferCard({
  offer,
  content,
  locale,
  busy,
  onRespond,
}: {
  readonly offer: AssignmentOfferDto;
  readonly content: EngagementsContent;
  readonly locale: Locale;
  readonly busy: boolean;
  readonly onRespond: (offerId: string, response: OfferResponse) => void;
}) {
  const copy = content.offers;
  const [confirming, setConfirming] = useState<OfferResponse | null>(null);
  const price =
    offer.price.amount == null
      ? copy.priceUnavailable
      : `${formatNumber(offer.price.amount, locale)} ${offer.price.currency}`;

  return (
    <Card effect="shadow" className={styles.card}>
      <div className={styles.head}>
        <ItemIcon
          contained
          icon={<Icon name="note-01" size="featured" tone="inherit" decorative />}
        />
        <div className={styles.headings}>
          <Typography as="h3" variant="text-lg" weight="bold">
            <bdi>{offer.details?.programName ?? offer.details?.reference ?? offer.requestId}</bdi>
          </Typography>
          <Typography as="p" variant="text-sm" color="muted">
            <bdi>{`${offer.details?.reference ?? offer.requestId} — ${copy.slotLabel(offer.slotNumber)}`}</bdi>
          </Typography>
        </div>
        <div className={styles.tags}>
          {offer.responseSla != null && (
            <SlaBadge
              state={offer.responseSla.state}
              label={slaLabel(offer.responseSla, content)}
            />
          )}
          <Tag variant="information" size="sm">
            {`${copy.priceLabel}: ${price}`}
          </Tag>
        </div>
      </div>

      <Typography as="p" variant="text-sm" color="muted">
        {copy.windowNote}
      </Typography>

      <Typography as="h4" variant="text-md" weight="bold">
        {copy.detailsHeading}
      </Typography>
      <PlanDetailsList details={offer.details} content={content} locale={locale} />

      <Alert tone="warning" role="note">
        {copy.irreversibleNote}
      </Alert>

      <div className={styles.actions}>
        <Button variant="primary" size="md" disabled={busy} onClick={() => setConfirming('accept')}>
          {copy.accept}
        </Button>
        <Button
          variant="secondary"
          size="md"
          disabled={busy}
          onClick={() => setConfirming('reject')}
        >
          {copy.reject}
        </Button>
      </div>

      {/* UAT `BUG-044` — the answer is final, so it is confirmed before it is sent. */}
      <Modal
        open={confirming != null}
        onClose={() => setConfirming(null)}
        title={confirming == null ? '' : copy.confirmDialog[confirming].title}
        dismissLabel={copy.confirmCancel}
        footer={
          <>
            <Button
              variant="primary"
              size="md"
              disabled={busy}
              onClick={() => {
                if (confirming != null) {
                  onRespond(offer.offerId, confirming);
                }
                setConfirming(null);
              }}
            >
              {confirming == null ? '' : copy.confirmDialog[confirming].confirm}
            </Button>
            <Button variant="tertiary" size="md" onClick={() => setConfirming(null)}>
              {copy.confirmCancel}
            </Button>
          </>
        }
      >
        <Typography as="p" variant="text-md">
          {confirming == null ? '' : copy.confirmDialog[confirming].body}
        </Typography>
      </Modal>
    </Card>
  );
}
