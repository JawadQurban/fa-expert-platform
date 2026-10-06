import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { cn } from '@utils/cn';
import styles from './EmptyState.module.css';

/**
 * EmptyState (FADS composite — not a numbered DGA `CMP-*` element; a
 * FADS-authored composition of existing primitives).
 *
 * ⚠ Visual fidelity **Pending final DGA token values (Q3/Q20)**.
 *
 * "No results" placeholder for lists/tables/details
 * (`SCREEN_SPECIFICATIONS.md` "Empty state (icon + message + CTA)",
 * `TESTING_STRATEGY.md` Manage screen). `title` renders as a plain
 * (non-heading) paragraph — the component is dropped into arbitrary regions,
 * so it never assumes a heading level; wrap it in a heading yourself if the
 * surrounding context calls for one. `icon` is always decorative
 * (`aria-hidden`); pair `action` with a real call to action (e.g. `Button`).
 */
export interface EmptyStateProps extends Omit<ComponentPropsWithoutRef<'div'>, 'title'> {
  readonly icon?: ReactNode;
  readonly title: ReactNode;
  readonly description?: ReactNode;
  readonly action?: ReactNode;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  ...rest
}: EmptyStateProps) {
  return (
    <div className={cn(styles.emptyState, className)} {...rest}>
      {icon != null && (
        <div className={styles.icon} aria-hidden="true">
          {icon}
        </div>
      )}
      <p className={styles.title}>{title}</p>
      {description != null && <p className={styles.description}>{description}</p>}
      {action != null && <div className={styles.action}>{action}</div>}
    </div>
  );
}
