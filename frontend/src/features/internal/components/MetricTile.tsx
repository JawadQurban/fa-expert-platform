import { Icon } from '@ds/primitives';
import { ItemIcon } from '@ds/composite';
import type { IconName } from '@ds/primitives';
import styles from './MetricTile.module.css';

/**
 * P-22 Metric Tile — a derived operational count that doubles as a drill-in link
 * to the inbox filtered by the tile's status. Rendered as a single focusable
 * anchor whose accessible name is the value + label (composition-only; the
 * `Metric` DS component is Missing, `G15`). Not colour-only: the number and label
 * carry the meaning.
 */
export function MetricTile({
  icon,
  value,
  label,
  href,
  delta,
}: {
  readonly icon: IconName;
  readonly value: string;
  readonly label: string;
  readonly href: string;
  /**
   * The week-on-week change, already worded. ⚠️ Absent means «no comparison
   * exists», not «no change» — the two are different facts and the tile shows
   * nothing rather than «٠».
   */
  readonly delta?: string;
}) {
  return (
    <a className={styles.tile} href={href}>
      {/* Icon and label on one line — the tile says what it counts, then how
          many (Option B KPI tile, EH-INT-01). */}
      <span className={styles.head}>
        <ItemIcon contained icon={<Icon name={icon} size="md" tone="primary" decorative />} />
        <span className={styles.label}>{label}</span>
      </span>
      <span className={styles.value}>{value}</span>
      {delta != null && <span className={styles.delta}>{delta}</span>}
    </a>
  );
}
