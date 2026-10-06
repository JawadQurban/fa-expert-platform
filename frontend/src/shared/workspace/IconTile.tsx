import { Icon } from '@ds/primitives';
import type { IconName } from '@ds/primitives';
import styles from './IconTile.module.css';

export type IconTileTone = 'primary' | 'warning' | 'error';

/**
 * The small tinted square that leads a panel header, a KPI label or a record
 * head (Option B prototype `.ic`). Decorative: the text beside it carries the
 * meaning, and the tone repeats a status the text already states.
 */
export function IconTile({
  icon,
  tone = 'primary',
  size = 'md',
}: {
  readonly icon: IconName;
  readonly tone?: IconTileTone;
  /** `lg` leads a record head that has no person behind it. */
  readonly size?: 'md' | 'lg';
}) {
  return (
    <span className={styles.tile} data-tone={tone} data-size={size} aria-hidden="true">
      <Icon name={icon} size={size === 'lg' ? 'md' : 'sm'} tone="inherit" decorative />
    </span>
  );
}
