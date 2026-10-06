import { Typography } from '@ds/primitives';
import type { Locale } from '@/types';
import type { DashboardDistributionDto } from '../internal.types';
import type { InternalContent } from '../internal.content';
import styles from './StageDistribution.module.css';
import { numberFormatter } from '../../../shared/formatting';

/**
 * Where the open applications are sitting (FADS Expert Hub kit, EH-INT-01).
 *
 * Flat token-coloured bars, not a chart. The kit's own note says the same, and
 * it is the right call twice over: there is no charting approach agreed (`G9`),
 * and a bar whose length encodes a share needs no axis, no legend and no
 * library to be read correctly.
 *
 * ⚠️ **The number is the fact and the bar is the illustration**, so the count
 * is always shown as text beside it. A bar alone cannot be read by somebody
 * using a screen reader, and a percentage alone hides that «٥٠٪» can mean one
 * application out of two.
 */
function labelFor(content: InternalContent, status: string): string {
  const labels: Record<string, string> = content.statuses;
  return labels[status] ?? status;
}

export function StageDistribution({
  rows,
  content,
  locale,
}: {
  readonly rows: readonly DashboardDistributionDto[];
  readonly content: InternalContent;
  readonly locale: Locale;
}) {
  const copy = content.dashboard.distribution;
  const numbers = numberFormatter(locale);

  if (rows.length === 0) {
    return (
      <Typography as="p" variant="text-sm" color="muted">
        {copy.empty}
      </Typography>
    );
  }

  return (
    <ul className={styles.rows} aria-label={copy.label}>
      {rows.map((row) => (
        <li key={row.status} className={styles.row}>
          <span className={styles.label}>
            {/* The wire carries a raw status string; the label map is keyed
                by the presentation union. An unknown status shows its own code
                rather than nothing — a new stage should be visible, not
                silently dropped from the chart. */}
            <bdi>{labelFor(content, row.status)}</bdi>
          </span>
          {/* Decorative: everything it encodes is in the count beside it. */}
          <span className={styles.track} aria-hidden="true">
            <span className={styles.fill} style={{ inlineSize: `${row.percent}%` }} />
          </span>
          <span className={styles.value}>{numbers.format(row.count)}</span>
        </li>
      ))}
    </ul>
  );
}
