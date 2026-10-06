import { Alert, Card, ItemIcon } from '@ds/composite';
import { Button, Icon, Tag, Typography } from '@ds/primitives';
import type { Locale } from '@/types';
import { expertHubPaths } from '../../../app/router/paths';
import { ENGAGEMENT_STATUS_TAG, engagementStatusLabel } from '../../../contracts/engagementStatus';
import type { EngagementsContent } from '../engagements.content';
import type { MyEngagementDto } from '../offer.types';
import { PlanDetailsList } from './PlanDetailsList';
import styles from './OfferCard.module.css';
import { formatDate } from '../../../shared/formatting';

/**
 * One confirmed engagement in **"My Engagements"** (J-18/F3/AC-2).
 *
 * The training-material block is where **F5** lands. The status is named, not
 * reduced to yes/no, and whether the trainer may upload (J-20) is
 * `canUploadMaterial` — **server-decided**, so this card never re-derives the
 * rule from the status string.
 *
 * ⚠️ `G26` — document storage is unresolved, so no attachment is linked here.
 */
export function EngagementCard({
  engagement,
  content,
  locale,
}: {
  readonly engagement: MyEngagementDto;
  readonly content: EngagementsContent;
  readonly locale: Locale;
}) {
  const copy = content.engagements;
  const material = engagement.trainingMaterial;
  const confirmedOn = formatDate(new Date(engagement.confirmedAt), locale, {
    dateStyle: 'medium',
  });

  return (
    <Card effect="stroke" className={styles.card}>
      <div className={styles.head}>
        <ItemIcon
          contained
          icon={<Icon name="note-done" size="featured" tone="inherit" decorative />}
        />
        <div className={styles.headings}>
          <Typography as="h3" variant="text-lg" weight="bold">
            <bdi>
              {engagement.details?.programName ??
                engagement.details?.reference ??
                engagement.requestId}
            </bdi>
          </Typography>
          <Typography as="p" variant="text-sm" color="muted">
            <bdi>{`${engagement.details?.reference ?? engagement.requestId} — ${content.offers.slotLabel(engagement.slotNumber)}`}</bdi>
          </Typography>
        </div>
        <div className={styles.tags}>
          {/* J-21/F1/AC-2 + F5 — Upcoming / In progress / Completed, decided by
              the schedule alone and never by anyone here. */}
          <Tag variant={ENGAGEMENT_STATUS_TAG[engagement.lifecycle]} size="sm">
            {engagementStatusLabel(engagement.lifecycle, locale)}
          </Tag>
          <Tag variant="success" size="sm">
            {copy.confirmedAt(confirmedOn)}
          </Tag>
        </div>
      </div>

      <PlanDetailsList details={engagement.details} content={content} locale={locale} />

      {/* J-21 — the follow-up page: session link or venue, live enrolment,
          attendance, and the MTM evaluations. */}
      <div>
        <Button
          variant="secondary"
          size="sm"
          href={expertHubPaths.engagementDetail(engagement.engagementId)}
        >
          {copy.followUpAction}
        </Button>
      </div>

      <Typography as="h4" variant="text-md" weight="bold">
        {copy.materialHeading}
      </Typography>
      <Typography as="p" variant="text-sm">
        {`${copy.materialStatusLabel}: ${copy.statuses[material.status] ?? material.status}`}
      </Typography>

      {engagement.canUploadMaterial && (
        // F5/AC-3 — the upload path itself is J-20; this opens the door to it.
        <>
          <Alert tone="info" role="note" title={copy.uploadTitle}>
            {copy.uploadBody}
          </Alert>
          <div>
            <Button variant="secondary" size="sm" href={expertHubPaths.submissions}>
              {copy.uploadAction}
            </Button>
          </div>
        </>
      )}
    </Card>
  );
}
