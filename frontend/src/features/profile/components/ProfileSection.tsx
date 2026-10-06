import type { ReactNode } from 'react';
import { Icon, Typography } from '@ds/primitives';
import { ItemIcon } from '@ds/composite';
import type { IconName } from '@ds/primitives';
import styles from './ProfileSection.module.css';

/**
 * Shared section shell for the profile tabs — an icon-badge lead-in + `h2` title
 * (+ optional description and a trailing action slot). Keeps a consistent, polished
 * section rhythm across every tab (composition-only, DS parts only).
 */
export function ProfileSection({
  id,
  icon,
  title,
  description,
  action,
  children,
}: {
  readonly id: string;
  readonly icon: IconName;
  readonly title: string;
  readonly description?: string;
  readonly action?: ReactNode;
  readonly children: ReactNode;
}) {
  return (
    <section className={styles.section} aria-labelledby={`${id}-heading`}>
      <div className={styles.head}>
        <ItemIcon contained icon={<Icon name={icon} size="md" tone="primary" decorative />} />
        <div className={styles.headText}>
          <Typography as="h2" id={`${id}-heading`} variant="text-lg" weight="bold">
            {title}
          </Typography>
          {description != null && (
            <Typography as="p" variant="text-sm" color="muted">
              {description}
            </Typography>
          )}
        </div>
        {action != null && <div className={styles.action}>{action}</div>}
      </div>
      {children}
    </section>
  );
}
