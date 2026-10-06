import { Alert } from '@ds/composite';
import { Typography } from '@ds/primitives';
import type { Locale } from '@/types';
import type { ScreeningContent } from '../screening.content';
import type { QualitativeInsightDto, ScreeningSectionDto } from '../screening.types';
import styles from './QualitativeInsightPanel.module.css';
import { formatDate } from '../../../shared/formatting';

/**
 * J-05/F4 — the **assistive** analysis of the application's qualitative
 * questions (`BR-0202`). Its separation from the official score is enforced
 * three ways, because "advisory" is a business rule, not a styling choice:
 *
 * - It renders in its own block, never inside `ServiceScorePanel`.
 * - It opens with a permanent, non-dismissible advisory `Alert` (AC-2) stating
 *   the analysis is never merged into the score and never reads attachments (AC-3).
 * - It shows the exact fields it analyzed (AC-1) so its scope is auditable —
 *   the "qualitative questions" definition is still pending confirmation.
 *
 * `insight == null` is a normal state: the decision never waits on this panel.
 */
function fieldNames(
  ids: readonly string[],
  sections: readonly ScreeningSectionDto[],
  locale: Locale
): string {
  const labels = ids
    .map((id) => {
      for (const section of sections) {
        const field = section.fields.find((candidate) => candidate.id === id);
        if (field != null) {
          return field.label[locale] ?? field.label.ar;
        }
      }
      return null;
    })
    .filter((label): label is string => label != null);
  return labels.join(locale === 'ar' ? '، ' : ', ');
}

function formatDateTime(iso: string, locale: Locale): string {
  return formatDate(new Date(iso), locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export function QualitativeInsightPanel({
  insight,
  sections,
  content,
  locale,
}: {
  readonly insight: QualitativeInsightDto | null;
  readonly sections: readonly ScreeningSectionDto[];
  readonly content: ScreeningContent;
  readonly locale: Locale;
}) {
  const copy = content.insight;

  if (insight == null) {
    return (
      <div className={styles.panel}>
        <Typography as="h3" variant="text-sm" weight="bold">
          {copy.heading}
        </Typography>
        <Alert tone="info" surface="tinted" title={copy.unavailableTitle} role="status">
          {copy.unavailableBody}
        </Alert>
      </div>
    );
  }

  const scope = fieldNames(insight.analyzedFieldIds, sections, locale);

  return (
    <div className={styles.panel}>
      <Typography as="h3" variant="text-sm" weight="bold">
        {copy.heading}
      </Typography>

      {/* `BR-0202` — the advisory disclaimer is part of the panel, not a tooltip. */}
      <Alert tone="info" surface="tinted" title={copy.advisoryTitle} role="status">
        {copy.advisoryBody}
      </Alert>

      <Typography as="p" variant="text-sm">
        {insight.summary[locale] ?? insight.summary.ar}
      </Typography>

      {insight.strengths.length > 0 && (
        <section className={styles.group} aria-labelledby="eh-insight-strengths">
          <Typography as="h4" id="eh-insight-strengths" variant="text-sm" weight="bold">
            {copy.strengthsHeading}
          </Typography>
          <ul className={styles.list}>
            {insight.strengths.map((item) => (
              <li key={item.ar}>{item[locale] ?? item.ar}</li>
            ))}
          </ul>
        </section>
      )}

      {insight.considerations.length > 0 && (
        <section className={styles.group} aria-labelledby="eh-insight-considerations">
          <Typography as="h4" id="eh-insight-considerations" variant="text-sm" weight="bold">
            {copy.considerationsHeading}
          </Typography>
          <ul className={styles.list}>
            {insight.considerations.map((item) => (
              <li key={item.ar}>{item[locale] ?? item.ar}</li>
            ))}
          </ul>
        </section>
      )}

      <div className={styles.meta}>
        {scope !== '' && (
          <Typography as="p" variant="text-xs" color="muted">
            {copy.scopeNote(scope)}
          </Typography>
        )}
        <Typography as="p" variant="text-xs" color="muted">
          {copy.generatedAt(formatDateTime(insight.generatedAt, locale))}
        </Typography>
      </div>
    </div>
  );
}
