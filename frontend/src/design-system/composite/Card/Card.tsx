import type {
  ComponentPropsWithoutRef,
  ElementType,
  KeyboardEvent,
  MouseEvent,
  ReactNode,
} from 'react';
import { cn } from '@utils/cn';
import styles from './Card.module.css';

/**
 * Card (FADS composite — DGA CMP-07).
 *
 * **Visual Compliance Correction (`reports/VISUAL_COMPLIANCE/Card/VISUAL_COMPLIANCE_CARD.md`):**
 * colors, radius, gap, shadow, and typography are sourced directly from the official
 * Platforms Code Figma Card component (file `Sv0oWOS1SjWnwhQwdzRJIE`, node `30195:10358`),
 * verified live via the Figma MCP — see `docs/FIGMA_CARD_SPECIFICATION.md`. The official
 * component also defines `Selectable` (checkbox multi-select) and `Expandable`
 * (accordion) types with a persistent corner affordance and Image/Featured-icon/Tags/
 * Rating/dual-Action slots — none of that is implemented here; this pass only corrects
 * the existing static/`actionable` card's tokens and adds the official `effect` variant.
 *
 * Static content card by default; set `actionable` to make the whole card a
 * single focusable target (`role="button"`, Enter/Space activation) — DGA
 * requires exactly one action per actionable card, not nested interactive
 * elements. `disabled` blocks both pointer and keyboard activation.
 */
export type CardEffect = 'shadow' | 'none' | 'stroke';

interface CardOwnProps {
  readonly as?: ElementType;
  readonly title?: ReactNode;
  readonly description?: ReactNode;
  readonly footer?: ReactNode;
  /** Official Type=Default effect variant (With Shadow / No Shadow / Stroke). */
  readonly effect?: CardEffect;
  readonly actionable?: boolean;
  readonly disabled?: boolean;
}

export type CardProps = CardOwnProps &
  Omit<ComponentPropsWithoutRef<'article'>, keyof CardOwnProps>;

export function Card({
  as,
  title,
  description,
  footer,
  effect = 'shadow',
  actionable = false,
  disabled = false,
  className,
  children,
  onClick,
  onKeyDown,
  ...rest
}: CardProps) {
  // `role="button"` is not an allowed ARIA role override for `<article>`
  // (WCAG/ARIA-in-HTML — flagged by axe's aria-allowed-role rule), so an
  // actionable card without an explicit `as` renders as a plain `<div>`.
  const Component = as ?? (actionable ? 'div' : 'article');

  const handleClick = (event: MouseEvent<HTMLElement>) => {
    if (disabled) {
      return;
    }
    onClick?.(event);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (!actionable || disabled) {
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick?.(event as never);
    }

    onKeyDown?.(event);
  };

  return (
    <Component
      className={cn(styles.card, className)}
      data-effect={effect !== 'shadow' ? effect : undefined}
      data-actionable={actionable || undefined}
      data-disabled={disabled || undefined}
      tabIndex={actionable && !disabled ? 0 : undefined}
      role={actionable ? 'button' : undefined}
      aria-disabled={disabled || undefined}
      onClick={actionable ? handleClick : onClick}
      onKeyDown={actionable ? handleKeyDown : onKeyDown}
      {...rest}
    >
      {(title != null || description != null) && (
        <div className={styles.content}>
          {title != null && <h3 className={styles.title}>{title}</h3>}
          {description != null && <p className={styles.description}>{description}</p>}
        </div>
      )}
      {children != null && <div className={styles.body}>{children}</div>}
      {footer != null && <div className={styles.footer}>{footer}</div>}
    </Component>
  );
}
