import type { ComponentPropsWithRef } from 'react';
import { cn } from '@utils/cn';
import { Icon } from '../Icon/Icon';
import styles from './ButtonClose.module.css';

/**
 * ButtonClose (FADS primitive — DGA CMP registry "Button-Close").
 *
 * Verified live against the official Platforms Code Figma Button-Close
 * component set (file `J0xq7JG3JKshRDzrgAM7E0`, node `2763:420129` — 32
 * variants: `size`[x Small/Small/Medium/Large] × `state`[Default/Hovered/
 * Pressed/Focused] × `onColor`[false/true]) via the Figma MCP — see
 * `docs/FIGMA_BUTTON_CLOSE_SPECIFICATION.md` and
 * `reports/VISUAL_COMPLIANCE/ButtonClose/VISUAL_COMPLIANCE_BUTTON_CLOSE.md`.
 *
 * A small icon-only "×" button (the live node's own `multiplication-sign`
 * glyph, matched here to the registry's existing `cancel-01` icon — a plain
 * X with no circle/square decoration, confirmed visually equivalent) used to
 * dismiss modals, dialogs, toasts, and other transient surfaces. `state`
 * isn't a runtime prop — Hovered/Pressed/Focused are real `:hover`/
 * `:active`/`:focus-visible` pseudo-classes, matching every other FADS
 * interactive primitive's own convention (Radio/Switch/InputPrefixSuffix).
 * `onColor` switches the icon and interactive-fill tokens for use on a
 * dark/colored surface — live-verified as a genuinely distinct token set
 * (`button-background-transparent-*`, semi-transparent white), not a CSS
 * filter/invert of the default set.
 */
export type ButtonCloseSize = 'xs' | 'sm' | 'md' | 'lg';

export interface ButtonCloseProps extends Omit<ComponentPropsWithRef<'button'>, 'type'> {
  /** Maps to the official `Size` property (`x Small`/`Small`/`Medium`/`Large`). */
  readonly size?: ButtonCloseSize;
  /** Maps to the official `On color` property — use on a dark/colored surface. */
  readonly onColor?: boolean;
  /** Accessible name — required, since this is an icon-only control. */
  readonly label: string;
}

export function ButtonClose({
  size = 'xs',
  onColor = false,
  label,
  className,
  disabled,
  ref,
  ...rest
}: ButtonCloseProps) {
  return (
    <button
      ref={ref}
      type="button"
      className={cn(styles.button, className)}
      data-size={size}
      data-oncolor={onColor || undefined}
      disabled={disabled}
      aria-label={label}
      {...rest}
    >
      <Icon name="cancel-01" decorative className={styles.icon} />
    </button>
  );
}
