import { Table } from '@ds/composite';
import type { TableColumn } from '@ds/composite';
import { Icon, Tag, Typography } from '@ds/primitives';
import type { Locale } from '@/types';
import type { ScreeningContent } from '../screening.content';
import type { ScreeningCriterionDto, ServiceScoreDto } from '../screening.types';
import styles from './ServiceScorePanel.module.css';
import { formatNumber as formatLocaleNumber } from '../../../shared/formatting';

/**
 * J-05/F3 — the **official objective score** for one service. Three journey
 * rules are visible in this component's shape:
 *
 * - One block **per service** (F2/AC-3) — this component is never given a
 *   combined total, because no such value exists in the contract.
 * - The criteria breakdown shows the fixed weighted formula (`BR-0201`) and the
 *   evaluation-model version it ran under (`BR-0203`, auditability).
 * - The below-threshold marker is **display-only** (F2/AC-5): it renders a
 *   labelled indicator plus an explicit note that it does not affect the
 *   decision, and it never disables or pre-selects anything in the decision panel.
 *
 * Rendered inside the review tab's card, so it is a plain block, not a card
 * of its own: the score line, then the criteria table (Option B prototype).
 *
 * The AI qualitative analysis is deliberately **not** rendered here — it lives
 * in its own panel so the two can never read as one number (`BR-0202`).
 */
function formatNumber(value: number, locale: Locale): string {
  return formatLocaleNumber(value, locale, {
    maximumFractionDigits: 1,
  });
}

export function ServiceScorePanel({
  score,
  content,
  locale,
}: {
  readonly score: ServiceScoreDto;
  readonly content: ScreeningContent;
  readonly locale: Locale;
}) {
  const serviceLabel = content.services[score.service];
  const belowThreshold = score.score < score.threshold;
  const headers = content.scores.criterionHeaders;

  const columns: Array<TableColumn<ScreeningCriterionDto>> = [
    {
      key: 'criterion',
      header: headers.criterion,
      render: (criterion) => criterion.label[locale] ?? criterion.label.ar,
    },
    {
      key: 'weight',
      header: headers.weight,
      render: (criterion) => `${formatNumber(criterion.weight, locale)}%`,
    },
    {
      key: 'rawScore',
      header: headers.rawScore,
      render: (criterion) => formatNumber(criterion.rawScore, locale),
    },
    {
      key: 'weighted',
      header: headers.weighted,
      // An unresolved criterion scores nothing, but «0» would read as a
      // decided result. The breakdown has to say which it is — that is what
      // makes a missing classification diagnosable from the screen.
      render: (criterion) =>
        criterion.unresolved ? (
          <Tag variant="warning" size="sm">
            {headers.unresolved}
          </Tag>
        ) : (
          formatNumber(criterion.weightedScore, locale)
        ),
    },
  ];

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <Typography as="h3" variant="text-sm" weight="bold">
          {content.scores.scoreOf(serviceLabel)}
        </Typography>
        <span className={styles.scoreValue}>{formatNumber(score.score, locale)}</span>
        <Typography as="span" variant="text-xs" color="muted">
          {content.scores.outOfScale} ·{' '}
          {content.scores.thresholdLabel(formatNumber(score.threshold, locale))}
        </Typography>
        {belowThreshold && (
          <Tag
            variant="warning"
            size="sm"
            iconStart={<Icon name="alert-01" size="sm" decorative />}
          >
            {content.scores.belowThreshold}
          </Tag>
        )}
      </div>

      {belowThreshold && (
        <Typography as="p" variant="text-xs" color="muted">
          {content.scores.belowThresholdNote}
        </Typography>
      )}

      <div className={styles.criteria}>
        <Typography as="h4" className="fads-visually-hidden">
          {content.scores.criteriaHeading}
        </Typography>
        <Table
          columns={columns}
          rows={[...score.criteria]}
          getRowId={(criterion) => criterion.id}
          caption={`${content.scores.criteriaHeading} — ${serviceLabel}`}
          captionHidden
          density="compact"
          alternatingRows
        />
      </div>

      <Typography as="p" variant="text-xs" color="muted">
        {content.scores.modelVersion(score.modelVersion)}
      </Typography>
    </div>
  );
}
