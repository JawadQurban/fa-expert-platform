import { Typography } from '@ds/primitives';
import type { Locale } from '@/types';
import { SPECIALIZATION_DOMAIN_OPTIONS } from '../../../shared/content/specializationDomains';
import type { EngagementsContent } from '../engagements.content';
import type { RequestDetailsDto } from '../offer.types';
import styles from './PlanDetailsList.module.css';
import { dateFormatter, numberFormatter } from '../../../shared/formatting';

/**
 * **F1/AC-3** — the request detail the trainer is asked to accept. One
 * renderer, used by the offer, the confirmed engagement and J-21's detail page,
 * over the *same* `RequestDetailsDto` — so what was accepted and what is later
 * tracked cannot drift apart.
 *
 * A field the request does not carry is left out rather than shown blank: the
 * form behind it is per request type.
 */
export function PlanDetailsList({
  details,
  content,
  locale,
}: {
  readonly details: RequestDetailsDto | null;
  readonly content: EngagementsContent;
  readonly locale: Locale;
}) {
  if (details == null) {
    return null;
  }
  const numbers = numberFormatter(locale);
  const dates = dateFormatter(locale, {
    dateStyle: 'medium',
  });
  const domain = SPECIALIZATION_DOMAIN_OPTIONS.find(
    (option) => option.value === details.specializationDomain
  );

  const rows: ReadonlyArray<{ readonly term: string; readonly value: string | null }> = [
    { term: content.fields.programName, value: details.programName },
    { term: content.fields.reference, value: details.reference },
    {
      term: content.fields.specialization,
      value:
        domain == null
          ? details.specializationDomain
          : locale === 'en'
            ? domain.labelEn
            : domain.labelAr,
    },
    {
      term: content.fields.days,
      value: details.days == null ? null : numbers.format(details.days),
    },
    {
      term: content.fields.language,
      value:
        details.language == null ? null : (content.languages[details.language] ?? details.language),
    },
    {
      term: content.fields.deliveryMode,
      value:
        details.deliveryMechanism == null
          ? null
          : (content.deliveryModes[details.deliveryMechanism] ?? details.deliveryMechanism),
    },
    { term: content.fields.city, value: details.city },
    {
      term: content.fields.schedule,
      value:
        details.dateFrom == null || details.dateTo == null
          ? null
          : `${dates.format(new Date(details.dateFrom))} — ${dates.format(new Date(details.dateTo))}`,
    },
  ];

  return (
    <dl className={styles.list}>
      {rows
        .filter((row) => row.value != null && row.value !== '')
        .map((row) => (
          <div key={row.term} className={styles.item}>
            <dt className={styles.term}>{row.term}</dt>
            <dd className={styles.value}>
              <Typography as="span" variant="text-md">
                <bdi>{row.value}</bdi>
              </Typography>
            </dd>
          </div>
        ))}
    </dl>
  );
}
