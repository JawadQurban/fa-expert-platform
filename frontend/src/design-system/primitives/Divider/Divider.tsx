import type { ComponentPropsWithRef } from 'react';
import { cn } from '@utils/cn';
import styles from './Divider.module.css';

/**
 * Divider (FADS primitive).
 *
 * Sourced directly from the official Platforms Code Figma Divider component (file
 * `Sv0oWOS1SjWnwhQwdzRJIE`, node `18697:19412`), verified live via the Figma MCP —
 * see `docs/FIGMA_DIVIDER_SPECIFICATION.md` and
 * `reports/VISUAL_COMPLIANCE/Divider/VISUAL_COMPLIANCE_DIVIDER.md`. The official
 * component only defines `orientation` (Line Type) and `color` — `inset`/`fullWidth`
 * are FADS-authored conveniences built from generic spacing tokens, not official
 * Figma variants (documented in the report).
 *
 * A `<div role="separator">` is used for both orientations (rather than a native
 * `<hr>`, which has no standard vertical rendering) — the standard WCAG/ARIA pattern
 * for a non-`<hr>` separator. Set `decorative` to strip the separator semantics
 * entirely for purely visual hairlines that carry no section-boundary meaning.
 */
export type DividerOrientation = 'horizontal' | 'vertical';
export type DividerColor = 'neutral' | 'primary' | 'white' | 'alphaWhite';

interface DividerOwnProps {
  readonly orientation?: DividerOrientation;
  readonly color?: DividerColor;
  /** Indents the divider from its container's edges (FADS-authored — see JSDoc above). */
  readonly inset?: boolean;
  /** Fills the container along its own axis. Default `true`, matching native `<hr>`. */
  readonly fullWidth?: boolean;
  /** Purely visual hairline with no section-boundary meaning — hidden from AT. */
  readonly decorative?: boolean;
}

export type DividerProps = DividerOwnProps &
  Omit<ComponentPropsWithRef<'div'>, keyof DividerOwnProps | 'children'>;

export function Divider({
  orientation = 'horizontal',
  color = 'neutral',
  inset = false,
  fullWidth = true,
  decorative = false,
  className,
  ref,
  ...rest
}: DividerProps) {
  return (
    <div
      ref={ref}
      className={cn(styles.divider, className)}
      data-orientation={orientation}
      data-color={color}
      data-inset={inset || undefined}
      data-full-width={fullWidth || undefined}
      role={decorative ? undefined : 'separator'}
      aria-orientation={!decorative && orientation === 'vertical' ? 'vertical' : undefined}
      aria-hidden={decorative || undefined}
      {...rest}
    />
  );
}
