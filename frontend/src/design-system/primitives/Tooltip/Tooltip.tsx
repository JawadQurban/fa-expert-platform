import { cloneElement, isValidElement, useId, useState } from 'react';
import type { KeyboardEvent, ReactElement, ReactNode } from 'react';
import { cn } from '@utils/cn';
import { Icon } from '../Icon/Icon';
import styles from './Tooltip.module.css';

/**
 * Tooltip (FADS primitive — DGA CMP-30).
 *
 * Shows supplementary text on hover/focus of its trigger. `placement` is
 * logical (top/bottom/inline-start/inline-end, RTL-safe) and drives both the
 * bubble's position and its beak direction. Meets WCAG 1.4.13: dismissable
 * (Escape), persists on focus, and links to the trigger via
 * `aria-describedby`. Positioning is CSS-only (no external lib).
 *
 * The official component's `beakAlignment` axis isn't exposed as a separate
 * prop — this bubble is always centered on its trigger, so the beak is
 * always centered too (a disclosed scope simplification, not a missing
 * variant; see docs/FIGMA_TOOLTIP_SPECIFICATION.md §6).
 *
 * `children` must be a single focusable element (e.g. a Button).
 */
export type TooltipPlacement = 'top' | 'bottom' | 'inline-start' | 'inline-end';

export interface TooltipProps {
  readonly content: ReactNode;
  readonly children: ReactElement;
  /** Optional heading rendered above `content` (semibold). */
  readonly title?: ReactNode;
  /** Leading `help-circle` icon. Matches the official default of `true`. */
  readonly icon?: boolean;
  /** Dark bubble instead of the default light one. */
  readonly inverted?: boolean;
  readonly placement?: TooltipPlacement;
  readonly className?: string;
}

export function Tooltip({
  content,
  children,
  title,
  icon = true,
  inverted = false,
  placement = 'top',
  className,
}: TooltipProps) {
  const id = useId();
  const [open, setOpen] = useState(false);

  const show = () => setOpen(true);
  const hide = () => setOpen(false);
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') hide();
  };

  if (!isValidElement(children)) {
    throw new Error('Tooltip expects a single focusable element as children.');
  }

  const trigger = cloneElement(children as ReactElement<Record<string, unknown>>, {
    'aria-describedby': open ? id : undefined,
    onMouseEnter: show,
    onMouseLeave: hide,
    onFocus: show,
    onBlur: hide,
    onKeyDown,
  });

  return (
    <span className={cn(styles.wrapper, className)}>
      {trigger}
      <span
        role="tooltip"
        id={id}
        data-placement={placement}
        data-inverted={inverted || undefined}
        data-open={open || undefined}
        className={styles.bubble}
      >
        <span className={styles.panel}>
          {icon && <Icon name="help-circle" size="sm" decorative className={styles.icon} />}
          <span className={styles.textWrapper}>
            {title != null && <span className={styles.title}>{title}</span>}
            <span className={styles.content}>{content}</span>
          </span>
        </span>
        <span className={styles.beak} aria-hidden="true" />
      </span>
    </span>
  );
}
