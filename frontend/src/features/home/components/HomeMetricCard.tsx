import { Card, ItemIcon } from '@ds/composite';
import { Icon, Typography } from '@ds/primitives';
import type { IconName } from '@ds/primitives';
import styles from './HomeMetricCard.module.css';

/**
 * P-22 Metric Tile (personal) — a labelled figure composed from Card/Icon/
 * Typography (the DS `Metric` component is Missing, `G15`). Read as a
 * figure+label, never colour-only (`§18`).
 */
export function HomeMetricCard({
  icon,
  value,
  label,
}: {
  readonly icon: IconName;
  readonly value: string;
  readonly label: string;
}) {
  return (
    <Card className={styles.card}>
      {/*
        Icon and label on one line, the figure beneath — the same KPI tile the
        staff dashboard uses (EH-INT-01), so a metric reads identically on both
        sides of the product. The tile says what it counts, then how many.
      */}
      <div className={styles.head}>
        <ItemIcon contained icon={<Icon name={icon} size="md" tone="primary" decorative />} />
        <Typography as="p" variant="text-sm" color="muted" className={styles.label}>
          {label}
        </Typography>
      </div>
      <Typography as="p" variant="display-lg" weight="bold" className={styles.value}>
        {value}
      </Typography>
    </Card>
  );
}
