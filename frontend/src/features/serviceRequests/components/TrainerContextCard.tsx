import { Rating } from '@ds/composite';
import { Icon, Tag, Typography } from '@ds/primitives';
import type { Locale } from '@/types';
import type { TrainerContextDto } from '../serviceRequest.types';
import type { ServiceRequestsContent } from '../serviceRequests.content';
import { Panel } from '../../../shared/workspace/Panel';
import styles from './TrainerContextCard.module.css';
import { formatDate as formatLocaleDate, formatNumber } from '../../../shared/formatting';

/**
 * **J-03/F2/AC-1** — "the decision-maker can view it **together with the
 * trainer's full approved profile**: current services, specializations,
 * classification, evaluations, and active agreement".
 *
 * That enumeration is this component's entire contents, in that order. The
 * point of the AC is that the decision is never taken on the request in
 * isolation, so the profile is a peer of the request on the page, not a link
 * away from it.
 *
 * This is an **internal** surface: classification and the calculated evaluation
 * appear here legitimately, unlike on the public profile where J-24 removed them
 * (P-40/P-41). The active agreement is shown because it is the document the
 * addendum will attach to (F3/AC-4) — without it there is nothing to amend.
 */
export function TrainerContextCard({
  trainer,
  content,
  locale,
}: {
  readonly trainer: TrainerContextDto;
  readonly content: ServiceRequestsContent;
  readonly locale: Locale;
}) {
  const copy = content.detail.context;

  return (
    <Panel title={copy.heading} titleId="eh-context-heading" meta={trainer.name}>
      <Typography as="p" variant="text-sm" color="muted">
        {copy.description}
      </Typography>

      <dl className={styles.facts}>
        <div className={styles.fact}>
          <dt className={styles.term}>{copy.servicesLabel}</dt>
          <dd className={styles.value}>
            <ul className={styles.tags}>
              {trainer.currentServices.map((service) => (
                <li key={service}>
                  <Tag variant="success" size="sm">
                    {content.services[service]}
                  </Tag>
                </li>
              ))}
            </ul>
          </dd>
        </div>

        <div className={styles.fact}>
          <dt className={styles.term}>{copy.specialtiesLabel}</dt>
          <dd className={styles.value}>
            <ul className={styles.tags}>
              {trainer.specialties.map((specialty) => (
                <li key={specialty}>
                  <Tag variant="neutral" size="sm">
                    {content.specialties[specialty]}
                  </Tag>
                </li>
              ))}
            </ul>
          </dd>
        </div>

        <div className={styles.fact}>
          <dt className={styles.term}>{copy.classificationLabel}</dt>
          <dd className={styles.value}>
            <Tag variant="information" size="sm">
              {content.classifications[trainer.classification]}
            </Tag>
          </dd>
        </div>

        <div className={styles.fact}>
          <dt className={styles.term}>{copy.evaluationLabel}</dt>
          <dd className={styles.value}>
            {trainer.evaluationOverall == null ? (
              <Typography as="span" variant="text-sm" color="muted">
                {copy.evaluationPending}
              </Typography>
            ) : (
              <span className={styles.rating}>
                <Rating value={trainer.evaluationOverall} size="sm" brand />
                <bdi>{formatScore(trainer.evaluationOverall, locale)}</bdi>
              </span>
            )}
          </dd>
        </div>

        {/* F3/AC-4 — the agreement the addendum attaches to. */}
        <div className={styles.fact}>
          <dt className={styles.term}>{copy.agreementLabel}</dt>
          <dd className={styles.value}>
            {trainer.agreement == null ? (
              <Typography as="span" variant="text-sm" color="muted">
                {copy.agreementNone}
              </Typography>
            ) : (
              <>
                <span className={styles.agreement}>
                  <Icon name="note-01" size="sm" tone="primary" decorative />
                  <bdi>{trainer.agreement.reference}</bdi>
                </span>
                {trainer.agreement.endsAt != null && (
                  <Typography as="span" variant="text-xs" color="muted">
                    {copy.agreementEndsAt(formatDate(trainer.agreement.endsAt, locale))}
                  </Typography>
                )}
              </>
            )}
          </dd>
        </div>
      </dl>
    </Panel>
  );
}

function formatScore(value: number, locale: Locale): string {
  return formatNumber(value, locale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

function formatDate(iso: string, locale: Locale): string {
  return formatLocaleDate(new Date(iso), locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
