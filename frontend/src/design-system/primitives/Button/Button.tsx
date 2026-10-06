import type { ComponentPropsWithRef, ComponentPropsWithoutRef, ReactNode, Ref } from 'react';
import { cn } from '@utils/cn';
import { env } from '@utils/env';
import styles from './Button.module.css';

/**
 * Button (FADS primitive — DGA CMP-05).
 *
 * **Visual Compliance Correction (`reports/VISUAL_COMPLIANCE_BUTTON.md`):** every
 * variant, size, and state below is sourced directly from the official Platforms Code
 * Figma Button component (file `Sv0oWOS1SjWnwhQwdzRJIE`, node `407:510376`), verified
 * live via the Figma MCP — see `docs/FIGMA_BUTTON_SPECIFICATION.md`. `secondary` maps to
 * the official Secondary-Outline style and `tertiary` to Transparent (previously both
 * rendered an invented brand-primary-colored treatment with no official equivalent).
 * `neutral` and `secondarySolid` are new variants matching the official Neutral and
 * Secondary-Solid styles; `destructive`/`onColor` are new modifiers verified only in
 * combination with the Primary style (see the report for that scope note).
 * `subtle` (added 2026-07-21) maps to the official Subtle style — already
 * documented in `docs/FIGMA_BUTTON_SPECIFICATION.md` from this component's
 * own original pass (Default/Pressed colors), but never implemented here
 * until now, a real pre-existing gap only closed while building the
 * dependent `Button-menu` composite (node `411:4478` in
 * `J0xq7JG3JKshRDzrgAM7E0`, which shares this exact variant matrix — see
 * `docs/FIGMA_BUTTON_MENU_SPECIFICATION.md`). That pass's own live sampling
 * cross-confirmed the original Default/Pressed data and additionally
 * covered every other state: transparent by default, `neutral-100` on
 * Hover, `neutral-200` on Pressed/Selected — visually close to
 * `secondarySolid` but genuinely distinct (no fill until interaction) — and,
 * unlike every other variant, its Disabled state stays transparent rather
 * than taking the shared flat-gray disabled fill (live-verified, a real,
 * disclosed exception scoped only to this variant).
 *
 * Implements the DGA state set: Default, Hovered, Pressed, Focused, Disabled,
 * Selected (docs/DGA_MASTER_SPECIFICATION.md §4, COMPONENT_INVENTORY.md CMP-05).
 * States are expressed via native CSS (:hover/:active/:focus-visible), the
 * `disabled` attribute, and `data-*`/`aria-*` attributes — see Button.module.css.
 *
 * **Link mode (`reports/LANDING_PAGE_REBUILD_REPORT.md`):** pass `href` to render a
 * real anchor (`<a>`) instead of a `<button>` — for CTAs that must be true,
 * crawlable, right-clickable links (open-in-new-tab, copy-link-address, no-JS
 * navigation) rather than onClick-driven navigation. All variant/size/state
 * styling is identical either way; `type`/`disabled` are ignored when `href` is set
 * (native `<a>` has no disabled state — see `Link`'s precedent for that pattern).
 */
export type ButtonVariant =
  'primary' | 'secondary' | 'tertiary' | 'neutral' | 'secondarySolid' | 'subtle';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ComponentPropsWithRef<'button'> {
  /** Visual emphasis. One dominant `primary` per region (VISUAL_HIERARCHY §3). */
  readonly variant?: ButtonVariant;
  readonly size?: ButtonSize;
  /** Shows a busy spinner and blocks interaction (aria-busy). */
  readonly loading?: boolean;
  readonly fullWidth?: boolean;
  /**
   * Toggle "Selected" state. Sets `aria-pressed` on a `<button>`; on a link
   * (`href` set) sets `aria-current="page"` instead, since `aria-pressed` is
   * not valid on the link role.
   */
  readonly selected?: boolean;
  /**
   * Destructive (danger) treatment. Overrides `variant`'s color regardless of its
   * value — only verified live in combination with the Primary style.
   */
  readonly destructive?: boolean;
  /**
   * White/translucent treatment for placement on a colored surface. Overrides
   * `variant`'s color regardless of its value — only verified live in combination
   * with the Primary style.
   */
  readonly onColor?: boolean;
  /** Icon at the logical start (leading). Decorative; label carries meaning. */
  readonly iconStart?: ReactNode;
  /** Icon at the logical end (trailing). */
  readonly iconEnd?: ReactNode;
  /** Renders as a real `<a href>` — see "Link mode" above. */
  readonly href?: string;
  readonly target?: string;
  readonly rel?: string;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  selected,
  destructive = false,
  onColor = false,
  iconStart,
  iconEnd,
  type = 'button',
  disabled,
  href,
  target,
  rel,
  className,
  children,
  ref,
  ...rest
}: ButtonProps) {
  const iconOnly = children == null && (iconStart != null || iconEnd != null);

  if (env.isDev && iconOnly && !rest['aria-label'] && !rest['aria-labelledby']) {
    console.warn(
      'Button: an icon-only button (no `children`) needs an accessible name — pass `aria-label` or `aria-labelledby`.'
    );
  }

  const dataAttrs = {
    'data-variant': variant,
    'data-size': size,
    'data-full-width': fullWidth || undefined,
    'data-icon-only': iconOnly || undefined,
    'data-selected': selected || undefined,
    'data-destructive': destructive || undefined,
    'data-on-color': onColor || undefined,
  } as const;

  const content = (
    <>
      {loading && <span className={styles.spinner} aria-hidden="true" />}
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
    </>
  );

  if (href != null) {
    return (
      <a
        ref={ref as Ref<HTMLAnchorElement>}
        href={href}
        target={target}
        rel={rel}
        className={cn(styles.button, className)}
        aria-busy={loading || undefined}
        aria-current={selected ? 'page' : undefined}
        {...dataAttrs}
        {...(rest as ComponentPropsWithoutRef<'a'>)}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      ref={ref}
      type={type}
      className={cn(styles.button, className)}
      disabled={disabled ?? loading}
      aria-busy={loading || undefined}
      aria-pressed={selected}
      {...dataAttrs}
      {...rest}
    >
      {content}
    </button>
  );
}
