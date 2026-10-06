import type { ComponentPropsWithRef, ReactNode } from 'react';
import { cn } from '@utils/cn';
import styles from './MenuListItem.module.css';

/**
 * MenuListItem (FADS composite — DGA CMP registry "Menu list item").
 *
 * Verified live against the official Platforms Code Figma Menu list item
 * component set (file `J0xq7JG3JKshRDzrgAM7E0`, node `30195:21865` — `rtl` ×
 * `Trail element`[None/Text/Icon/Button/Tag/Switch] × `state`[Default/
 * Hovered/Pressed/Selected/Focused/Disabled], 72 variants) via the Figma
 * MCP — see `docs/FIGMA_MENU_LIST_ITEM_SPECIFICATION.md` and
 * `reports/VISUAL_COMPLIANCE/MenuListItem/VISUAL_COMPLIANCE_MENU_LIST_ITEM.md`.
 *
 * The live `Trail element` axis is **not** modeled as separate typed props —
 * every sampled variant (`Text`, `Icon`, `Button`, `Tag`, `Switch`) is just
 * different *content* in the same trailing slot, confirmed by sampling each:
 * `Button` renders a literal icon-only instance of the already-Approved
 * `Button`; `Tag` and `Switch` are literal instances of the already-Approved
 * `Tag`/`Switch`. This component exposes one generic `trailing` slot and
 * lets the consumer compose whichever of those already-Approved primitives
 * fits, rather than reinventing per-type rendering.
 *
 * **Deliberately not `role="menuitem"`.** The live data shows real nested
 * interactive controls (a `Switch`, an icon-only `Button`) inside an item —
 * the WAI-ARIA APG "Menu and Menubar" pattern does not expect a `menuitem`
 * to contain its own independently-focusable descendant (roving tabindex
 * across a `menu` assumes each item is a single simple action). Rather than
 * force an invalid/conflicting ARIA structure onto a real, live-verified
 * design, this renders as a plain focusable `<button>` (standard Tab order,
 * not a roving single-tab-stop menu) — a disclosed, deliberate deviation,
 * not an oversight. `Selected`/`Disabled`/`Focused` states, all live-
 * verified, are otherwise implemented exactly as sampled.
 */
export interface MenuListItemProps extends Omit<ComponentPropsWithRef<'button'>, 'type'> {
  /** Leading icon slot (decorative). */
  readonly icon?: ReactNode;
  readonly children: ReactNode;
  /** The live-verified `Selected` state — a pale-green fill + green text. */
  readonly selected?: boolean;
  /**
   * Trailing slot — pass a `<Tag>`, `<Switch>`, an icon-only `<Button>`, a
   * plain decorative icon, or muted text, matching whichever live-verified
   * `Trail element` variant applies.
   */
  readonly trailing?: ReactNode;
}

export function MenuListItem({
  icon,
  children,
  selected = false,
  trailing,
  disabled,
  className,
  ref,
  ...rest
}: MenuListItemProps) {
  return (
    <button
      ref={ref}
      type="button"
      className={cn(styles.item, className)}
      disabled={disabled}
      aria-pressed={selected || undefined}
      data-selected={selected || undefined}
      {...rest}
    >
      {icon != null && (
        <span className={styles.icon} aria-hidden="true">
          {icon}
        </span>
      )}
      <span className={styles.label}>{children}</span>
      {trailing != null && <span className={styles.trailing}>{trailing}</span>}
    </button>
  );
}
