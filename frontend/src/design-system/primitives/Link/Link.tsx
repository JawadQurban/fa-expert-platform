import type { ComponentPropsWithRef, MouseEvent, ReactNode } from 'react';
import { cn } from '@utils/cn';
import styles from './Link.module.css';

/**
 * Link (FADS primitive — DGA CMP-06).
 *
 * Verified live against the official Platforms Code Figma Link component set (file
 * `cII2UMRzWj0rwKuMzWFqTU`, node `2508:25804` — 144 variants: `rtl` × `state` × `style`
 * × `size` × `inline`) via the Figma MCP — see `docs/FIGMA_LINK_SPECIFICATION.md` and
 * `reports/VISUAL_COMPLIANCE/Link/VISUAL_COMPLIANCE_LINK.md`. `mood` maps to the
 * official `Style` property (`Primary` | `Neutral` | `On-color` — there is no official
 * `Danger` variant on this component; do not add one). `inline` maps to the official
 * `Inline` property and controls whether the link is always underlined (embedded in
 * body text) or only underlined on hover/press (a standalone/component-level link).
 *
 * DGA states — Default, Hovered, Pressed, Focused, Visited, Disabled — are expressed
 * via native `:hover`/`:active`/`:focus-visible`/`:visited` and `aria-disabled`, not a
 * `state` prop, matching this design system's established pattern (see `Button`).
 *
 * External links carry a trailing icon marker (a decorative "↗" placeholder — the
 * official DGA icon library isn't wired up yet, Q8) plus `target`/`rel`; pass `iconEnd`
 * to override with the real icon once available.
 *
 * This is a presentational `<a>` (routing-agnostic). For SPA navigation, compose it
 * with the router's link in a product-level wrapper.
 */
export type LinkMood = 'primary' | 'neutral' | 'onColor';
export type LinkSize = 'sm' | 'md';

export interface LinkProps extends ComponentPropsWithRef<'a'> {
  /** Maps to the official `Style` property. */
  readonly mood?: LinkMood;
  /** Maps to the official `Size` property. */
  readonly size?: LinkSize;
  /**
   * Maps to the official `Inline` property. `true` for a link embedded within a
   * sentence/paragraph of body text (always underlined, per WCAG 1.4.1); `false`
   * (default) for a standalone/component-level link (underlined only on hover/press).
   */
  readonly inline?: boolean;
  readonly external?: boolean;
  readonly disabled?: boolean;
  /** Optional icon slot at the logical end (e.g., the official external icon). */
  readonly iconEnd?: ReactNode;
}

export function Link({
  mood = 'primary',
  size = 'md',
  inline = false,
  external = false,
  disabled = false,
  iconEnd,
  className,
  children,
  href,
  target,
  rel,
  onClick,
  ref,
  ...rest
}: LinkProps) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (disabled) {
      event.preventDefault();
      return;
    }
    onClick?.(event);
  };

  const externalTarget = external ? (target ?? '_blank') : target;
  const externalRel = external ? (rel ?? 'noopener noreferrer') : rel;

  return (
    <a
      ref={ref}
      className={cn(styles.link, className)}
      data-mood={mood}
      data-size={size}
      data-inline={inline || undefined}
      // When disabled, an anchor should not be navigable (no href) but stays
      // discoverable; aria-disabled communicates state to assistive tech.
      href={disabled ? undefined : href}
      target={disabled ? undefined : externalTarget}
      rel={externalRel}
      data-external={external || undefined}
      aria-disabled={disabled || undefined}
      onClick={handleClick}
      {...rest}
    >
      <span className={styles.label} dir="auto">
        {children}
      </span>
      {iconEnd ? (
        <span className={styles.icon} aria-hidden="true">
          {iconEnd}
        </span>
      ) : (
        external && (
          <span className={styles.icon} aria-hidden="true" data-placeholder-icon="external">
            ↗
          </span>
        )
      )}
    </a>
  );
}
