import { Tag, Typography } from '@ds/primitives';
import type { Locale } from '@/types';
import type { DashboardSlaDto } from '../internal.types';
import type { InternalContent } from '../internal.content';
import styles from './SlaPerformance.module.css';
import { numberFormatter } from '../../../shared/formatting';

/**
 * How each stage is performing against the deadline the BRD set for it
 * (FADS Expert Hub kit, EH-INT-01).
 *
 * ⚠️ **Three columns can be absent and none of the absences mean zero.** A
 * target is missing where the BRD states no duration (`DM-GAP-10`); an actual
 * is missing where the platform records only one end of the stage. Rendering
 * either as `0` would tell a reader the stage is instantaneous, and somebody
 * plans staffing from this table. Each says why it is empty instead.
 *
 * Built as a real `<table>` rather than a grid of divs: this is tabular data,
 * a person will compare down the columns, and a screen reader should be able
 * to announce «الفرز الأولي، المهلة ٣ أيام» rather than reading nine loose
 * numbers in a row.
 */
export function SlaPerformance({
  rows,
  content,
  locale,
}: {
  readonly rows: readonly DashboardSlaDto[];
  readonly content: InternalContent;
  readonly locale: Locale;
}) {
  const copy = content.dashboard.sla;
  const numbers = numberFormatter(locale);

  if (rows.length === 0) {
    return (
      <Typography as="p" variant="text-sm" color="muted">
        {copy.empty}
      </Typography>
    );
  }

  return (
    <div className={styles.scroll}>
      <table className={styles.table}>
        <caption className={styles.caption}>{copy.caption}</caption>
        <thead>
          <tr>
            <th scope="col">{copy.stage}</th>
            <th scope="col">{copy.target}</th>
            <th scope="col">{copy.actual}</th>
            <th scope="col">{copy.breaches}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.slaId}>
              <th scope="row" className={styles.stageCell}>
                <span className={styles.stageName}>
                  <bdi>{locale === 'ar' ? row.nameAr : row.nameEn}</bdi>
                </span>
                {/* The row that configures it, so a disputed figure can be
                    traced to a decision rather than argued about. */}
                <span className={styles.slaId}>{row.slaId}</span>
              </th>

              <td className={styles.number}>
                {row.targetDays == null ? (
                  <span className={styles.absent}>{copy.targetUndefined}</span>
                ) : (
                  copy.days(numbers.format(row.targetDays))
                )}
              </td>

              <td className={styles.number}>
                {row.actualDays == null ? (
                  <span className={styles.absent}>{copy.notMeasured}</span>
                ) : (
                  <>
                    {copy.days(numbers.format(row.actualDays))}
                    {/* How many finished items the mean rests on — an average
                        of two is not the same claim as an average of two
                        hundred. */}
                    <span className={styles.measured}>
                      {copy.measured(numbers.format(row.measured))}
                    </span>
                  </>
                )}
              </td>

              <td className={styles.number}>
                {row.breaches === 0 ? (
                  <span className={styles.absent}>—</span>
                ) : (
                  <Tag variant="error" size="sm">
                    {numbers.format(row.breaches)}
                  </Tag>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
