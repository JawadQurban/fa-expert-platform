import { Tag, Typography } from '@ds/primitives';
import type { Locale } from '@/types';
import type { DashboardSlaDto } from '../internal.types';
import type { InternalContent } from '../internal.content';
import styles from './SlaHealthMeter.module.css';
import { numberFormatter } from '../../../shared/formatting';

/**
 * How each stage is performing against the deadline the BRD set for it, as a
 * health meter (FADS Expert Hub kit, EH-INT-01) — the B/"Operational" reading of
 * the same data `SlaPerformance` tabulated.
 *
 * ⚠️ **Three figures can be absent and none of the absences mean zero.** A
 * target is missing where the BRD states no duration (`DM-GAP-10`); an actual is
 * missing where the platform records only one end of the stage. Each is worded
 * ("لم تُحدَّد" / "غير مقاس"), never rendered as `0`. The bar is decorative — the
 * meaning is the text stats beside it, and the breach count is always shown so a
 * screen reader announces the fact, not a colour.
 */
function fillPercent(row: DashboardSlaDto): number {
  if (row.breaches > 0) {
    return 100;
  }
  if (row.actualDays != null && row.targetDays != null && row.targetDays > 0) {
    return Math.min(100, Math.round((row.actualDays / row.targetDays) * 100));
  }
  // Measured but no target to scale against — a modest "on-track" fill.
  return row.actualDays != null ? 60 : 0;
}

export function SlaHealthMeter({
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
    <ul className={styles.rows} aria-label={copy.caption}>
      {rows.map((row) => {
        const breached = row.breaches > 0;
        return (
          <li key={row.slaId} className={styles.row}>
            <div className={styles.top}>
              <span className={styles.name}>
                <bdi>{locale === 'ar' ? row.nameAr : row.nameEn}</bdi>
              </span>
              {/* The configuring row's id, so a disputed figure can be traced. */}
              <span className={styles.id}>
                <bdi>{row.slaId}</bdi>
              </span>
              {breached && (
                <span className={styles.state}>
                  <Tag variant="error" size="sm">
                    {numbers.format(row.breaches)}
                  </Tag>
                </span>
              )}
            </div>

            {/* Decorative: everything it encodes is in the stats below. */}
            <span className={styles.track} aria-hidden="true">
              <span
                className={styles.fill}
                data-state={breached ? 'breached' : 'ok'}
                style={{ inlineSize: `${fillPercent(row)}%` }}
              />
            </span>

            <dl className={styles.stats}>
              <div className={styles.stat}>
                <dt>{copy.target}</dt>
                <dd>
                  {row.targetDays == null ? (
                    <span className={styles.absent}>{copy.targetUndefined}</span>
                  ) : (
                    copy.days(numbers.format(row.targetDays))
                  )}
                </dd>
              </div>

              <div className={styles.stat}>
                <dt>{copy.actual}</dt>
                <dd>
                  {row.actualDays == null ? (
                    <span className={styles.absent}>{copy.notMeasured}</span>
                  ) : (
                    <>
                      {copy.days(numbers.format(row.actualDays))}{' '}
                      <span className={styles.measured}>
                        {copy.measured(numbers.format(row.measured))}
                      </span>
                    </>
                  )}
                </dd>
              </div>

              <div className={styles.stat}>
                <dt>{copy.breaches}</dt>
                <dd>
                  {row.breaches === 0 ? (
                    <span className={styles.absent}>—</span>
                  ) : (
                    <span className={styles.breach}>{numbers.format(row.breaches)}</span>
                  )}
                </dd>
              </div>
            </dl>
          </li>
        );
      })}
    </ul>
  );
}
