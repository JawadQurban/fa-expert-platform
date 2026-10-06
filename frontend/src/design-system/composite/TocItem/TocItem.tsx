import type { ComponentPropsWithRef, ReactNode } from 'react';
import { cn } from '@utils/cn';
import styles from './TocItem.module.css';

/**
 * TocItem (FADS composite — DGA registry "TOC Item").
 *
 * Verified live against the official Platforms Code Figma TOC Item component
 * set (file `J0xq7JG3JKshRDzrgAM7E0`, node `2962:37761` — `rtl` × `level`
 * [Level 1 (H2)/Level 2 (H3)/Level 3 (H4)] × `selected` × `state`[Default/
 * Hovered/Pressed/Focused]) via the Figma MCP — see
 * `docs/FIGMA_TOC_ITEM_SPECIFICATION.md` and
 * `reports/VISUAL_COMPLIANCE/TocItem/VISUAL_COMPLIANCE_TOC_ITEM.md`.
 *
 * `state` is not a prop — Hovered/Pressed/Focused are real CSS
 * `:hover`/`:active`/`:focus-visible` pseudo-classes on a native `<button>`.
 * `level` renders 0/1/2 leading 16px nesting-indicator bars (Level 2/3),
 * matching the live structure exactly (padding stays constant across levels;
 * indentation comes only from the bar elements). No `Disabled` variant exists
 * in the live 48-variant set, so no disabled-specific styling is applied —
 * native `disabled` still works via the browser default only.
 */
export type TocItemLevel = 1 | 2 | 3;

export interface TocItemProps extends Omit<ComponentPropsWithRef<'button'>, 'type'> {
  readonly level?: TocItemLevel;
  /** The live-verified `Selected` state — bold text + a solid brand-green indicator bar. */
  readonly selected?: boolean;
  readonly children: ReactNode;
}

export function TocItem({
  level = 1,
  selected = false,
  children,
  className,
  ref,
  ...rest
}: TocItemProps) {
  return (
    <button
      ref={ref}
      type="button"
      className={cn(styles.item, className)}
      data-selected={selected || undefined}
      aria-current={selected ? 'true' : undefined}
      {...rest}
    >
      {level > 1 &&
        Array.from({ length: level - 1 }, (_, index) => (
          <span key={index} className={styles.nestingBar} aria-hidden="true" />
        ))}
      <span className={styles.label}>{children}</span>
      <span className={styles.indicator} aria-hidden="true" />
    </button>
  );
}
