import type { ComponentPropsWithRef, ReactNode } from 'react';
import { cn } from '@utils/cn';
import { env } from '@utils/env';
import styles from './FloatingButton.module.css';

/**
 * FloatingButton (FADS primitive — DGA CMP registry "Floating Button").
 *
 * Verified live against the official Platforms Code Figma Floating Button
 * component set (file `J0xq7JG3JKshRDzrgAM7E0`, node `19488:124656` — a
 * large variant set governed by `rtl` × `state`[Default/Hovered/Pressed/
 * Selected/Focused/Disabled] × `style`[Primary-Neutral/Primary-Brand/
 * Secondary-Solid] × `Icon only` × `size`[Small/Large] × `On color`) via the
 * Figma MCP — see `docs/FIGMA_FLOATING_BUTTON_SPECIFICATION.md` and
 * `reports/VISUAL_COMPLIANCE/FloatingButton/VISUAL_COMPLIANCE_FLOATING_BUTTON.md`.
 *
 * The live node's own `style` axis (`Primary-Neutral`/`Primary-Brand`/
 * `Secondary-Solid`) turned out to be governed by the exact same Figma
 * variables as the already-Approved `Button` primitive's `neutral`/
 * `primary`/`secondarySolid` variants (confirmed by comparing
 * `get_variable_defs` output byte-for-byte against `Button.module.css`'s own
 * token sources) — so every color, the disabled treatment, and the label/
 * focus-ring tokens are reused directly from `Button`'s existing
 * `--fads-sys-button-*` tokens; this primitive adds **zero new color
 * tokens**.
 *
 * It is **not** a literal composition of `<Button>`, though — this
 * component's own geometry (a true circle via `radius-full`, sized purely
 * by padding, not by `Button`'s height/padding-inline model) is genuinely
 * different, and its own `Selected` state was independently live-verified
 * to use a **distinct** `-selected` background token (`#384250`) rather
 * than reusing the Pressed color the way `Button`'s own Selected state
 * deliberately does — composing `<Button>` here would have silently
 * applied the wrong Selected color. Building a small, self-contained
 * sibling primitive that reuses `Button`'s tokens directly (not its markup)
 * avoids that trap while still keeping zero token duplication — the same
 * category of decision as `DatePicker`'s trigger reusing `TextInput`'s
 * tokens without literally nesting a `<TextInput>`.
 */
export type FloatingButtonVariant = 'neutral' | 'primary' | 'secondarySolid';
export type FloatingButtonSize = 'sm' | 'lg';

export interface FloatingButtonProps extends ComponentPropsWithRef<'button'> {
  /** Decorative; the accessible name comes from `children` or `aria-label`. */
  readonly icon: ReactNode;
  /** Maps to the official `Style` property. */
  readonly variant?: FloatingButtonVariant;
  /** Maps to the official `Size` property (`Small`/`Large`). */
  readonly size?: FloatingButtonSize;
  /** Maps to the official `On color` property — use on a dark/colored surface. */
  readonly onColor?: boolean;
  /** Maps to the official `Selected` state. Sets `aria-pressed`. */
  readonly selected?: boolean;
  /** Optional visible label — omit for an icon-only circular button. */
  readonly children?: ReactNode;
}

export function FloatingButton({
  icon,
  variant = 'neutral',
  size = 'sm',
  onColor = false,
  selected,
  disabled,
  children,
  className,
  ref,
  ...rest
}: FloatingButtonProps) {
  const iconOnly = children == null;

  if (env.isDev && iconOnly && !rest['aria-label'] && !rest['aria-labelledby']) {
    console.warn(
      'FloatingButton: an icon-only button (no `children`) needs an accessible name — pass `aria-label` or `aria-labelledby`.'
    );
  }

  return (
    <button
      ref={ref}
      type="button"
      className={cn(styles.button, className)}
      data-variant={variant}
      data-size={size}
      data-on-color={onColor || undefined}
      data-selected={selected || undefined}
      disabled={disabled}
      aria-pressed={selected}
      {...rest}
    >
      <span className={styles.icon} aria-hidden="true">
        {icon}
      </span>
      {children != null && (
        <span className={styles.label} dir="auto">
          {children}
        </span>
      )}
    </button>
  );
}
