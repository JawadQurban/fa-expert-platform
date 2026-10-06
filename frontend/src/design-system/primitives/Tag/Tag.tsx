import type { ComponentPropsWithRef, ReactNode } from 'react';
import { cn } from '@utils/cn';
import { env } from '@utils/env';
import styles from './Tag.module.css';

/**
 * Tag (FADS primitive — DGA CMP-26).
 *
 * Verified live against the official Platforms Code Figma Tag component set (file
 * `Sv0oWOS1SjWnwhQwdzRJIE`, node `421:110968` — 288 variants: `rtl` × `size` × `style`
 * × `outline` × `rounded` × `iconOnly`) via the Figma MCP — see
 * `docs/FIGMA_TAG_SPECIFICATION.md` and `reports/VISUAL_COMPLIANCE/Tag/VISUAL_COMPLIANCE_TAG.md`.
 *
 * DGA rule (DC-05 / `[S3: F11]`): status colors are reserved for status.
 * - `neutral` → general use & content classification (categories).
 * - `success` / `error` / `warning` / `information` → status only.
 * - `onColor` → placement on a dark/colored surface (any category or status meaning).
 *
 * Meaning is carried by the text label, never color alone (WCAG 1.4.1).
 *
 * **No official `Primary` style exists on the live component** (confirmed via the full
 * 288-node variant grid) — removed from this pass; see the spec §12.
 *
 * Tag has no interactive states (no `hover`/`pressed`/`focused` variant exists on the
 * live component) — it renders as a non-interactive `<span>`.
 */
export type TagVariant = 'neutral' | 'success' | 'error' | 'warning' | 'information' | 'onColor';
export type TagSize = 'xs' | 'sm' | 'md';

export interface TagProps extends ComponentPropsWithRef<'span'> {
  readonly variant?: TagVariant;
  /** Maps to the official `Size` property. */
  readonly size?: TagSize;
  /** Maps to the official `Outline` property: transparent background, colored border. */
  readonly outline?: boolean;
  /** Maps to the official `Rounded` property: pill shape instead of `radius-sm`. */
  readonly rounded?: boolean;
  /** Leading icon slot (maps to the official `leadIcon`/`swapLeadIcon`). */
  readonly iconStart?: ReactNode;
  /** Trailing icon slot (maps to the official `trailIcon`/`swapTrailIcon`). */
  readonly iconEnd?: ReactNode;
}

export function Tag({
  variant = 'neutral',
  size = 'md',
  outline = false,
  rounded = false,
  iconStart,
  iconEnd,
  className,
  children,
  ref,
  ...rest
}: TagProps) {
  const iconOnly = children == null && (iconStart != null || iconEnd != null);

  if (env.isDev && iconOnly && !rest['aria-label'] && !rest['aria-labelledby']) {
    console.warn(
      'Tag: an icon-only tag (no `children`) needs an accessible name — pass `aria-label` or `aria-labelledby`.'
    );
  }

  return (
    <span
      ref={ref}
      className={cn(styles.tag, className)}
      // A plain <span> has an ARIA "generic" role, which prohibits naming
      // attributes (aria-label/aria-labelledby) — icon-only tags need an
      // explicit role that permits naming to carry their accessible name.
      role={iconOnly ? 'img' : undefined}
      data-variant={variant}
      data-size={size}
      data-outline={outline || undefined}
      data-rounded={rounded || undefined}
      data-icon-only={iconOnly || undefined}
      {...rest}
    >
      {iconStart && (
        <span className={styles.icon} aria-hidden="true">
          {iconStart}
        </span>
      )}
      {children != null && (
        <span className={styles.label} dir="auto">
          {children}
        </span>
      )}
      {iconEnd && (
        <span className={styles.icon} aria-hidden="true">
          {iconEnd}
        </span>
      )}
    </span>
  );
}
