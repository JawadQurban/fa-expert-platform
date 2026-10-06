import { Tag, Typography } from '@ds/primitives';
import type { Locale } from '@/types';
import type { LockedProfileFactsDto } from '../profile.types';
import type { ProfileContent } from '../profile.content';
import styles from './LockedFactsSection.module.css';
import { formatDate as formatLocaleDate, formatNumber } from '../../../shared/formatting';

/**
 * **J-14/F2** — "fields listed in the Locked Fields matrix remain **visible**
 * but non-editable to the trainer, updated only automatically by the system."
 *
 * *Visible* is the operative word, and the reason this section exists at all:
 * before it, classification and the evaluation were scattered into the page
 * header while the **agreement status was not shown anywhere**. The matrix names
 * three rows; this renders those three, together, with no edit affordance and a
 * stated source — so it reads as a rule rather than as something broken.
 *
 * ⚠️ **This is not the Trainer Profile Status.** J-13/AC-9's calculated
 * Active/Idle/Suspended/Expired is internal-only under `BR-0408` and is absent
 * from the whole trainer-facing contract (P-48). What is shown here is the
 * *agreement's* contractual state, which J-14/F2 explicitly puts in front of the
 * trainer.
 */
export function LockedFactsSection({
  facts,
  content,
  locale,
}: {
  readonly facts: LockedProfileFactsDto;
  readonly content: ProfileContent;
  readonly locale: Locale;
}) {
  const copy = content.lockedFacts;

  const evaluation =
    facts.evaluationOverall == null
      ? copy.evaluationPending
      : formatNumber(facts.evaluationOverall, locale, {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        });

  return (
    <div className={styles.section}>
      <Typography as="p" variant="text-sm" color="muted">
        {copy.description}
      </Typography>

      <dl className={styles.facts}>
        <div className={styles.fact}>
          <dt className={styles.term}>{copy.classificationLabel}</dt>
          <dd className={styles.value}>
            {/* ⚠️ Null is «no trainer file», not «entry tier» — showing the
                placeholder tier here would tell somebody the Academy had
                accredited them when it has not (`P-236`). */}
            <Tag variant={facts.classification == null ? 'neutral' : 'information'} size="sm">
              {facts.classification == null
                ? content.header.notAccredited
                : content.classifications[facts.classification]}
            </Tag>
          </dd>
        </div>

        <div className={styles.fact}>
          <dt className={styles.term}>{copy.evaluationLabel}</dt>
          <dd className={styles.value}>
            <bdi>{evaluation}</bdi>
          </dd>
        </div>

        <div className={styles.fact}>
          <dt className={styles.term}>{copy.agreementLabel}</dt>
          <dd className={styles.value}>
            {facts.agreementStatus == null ? (
              <Typography as="span" variant="text-md" color="muted">
                {copy.agreementNone}
              </Typography>
            ) : (
              <>
                <Tag variant={facts.agreementStatus === 'active' ? 'success' : 'neutral'} size="sm">
                  {copy.agreementStatuses[facts.agreementStatus]}
                </Tag>
                {facts.agreementEndsAt != null && (
                  <Typography as="span" variant="text-sm" color="muted">
                    {copy.agreementEndsAt(formatDate(facts.agreementEndsAt, locale))}
                  </Typography>
                )}
              </>
            )}
          </dd>
        </div>
      </dl>
    </div>
  );
}

function formatDate(iso: string, locale: Locale): string {
  return formatLocaleDate(new Date(iso), locale, {
    dateStyle: 'medium',
  });
}
