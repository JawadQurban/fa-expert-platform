import type { ComponentPropsWithRef, ReactNode } from 'react';
import { cn } from '@utils/cn';
import styles from './ListItem.module.css';

/**
 * ListItem (FADS composite — DGA registry "List item").
 *
 * Verified live against the official Platforms Code Figma List item
 * component (file `J0xq7JG3JKshRDzrgAM7E0`, node `7850:3463` — `rtl` ×
 * `type`[Ordered/Unordered/With Icon] × `level`[One/Two] × `style`[Primary/
 * Neutral/On-Color] × `icon`) via the Figma MCP — see
 * `docs/FIGMA_LIST_ITEM_SPECIFICATION.md` and
 * `reports/VISUAL_COMPLIANCE/ListItem/VISUAL_COMPLIANCE_LIST_ITEM.md`.
 * Figma's own description: "**Ordered List**: Used when item sequence
 * matters... **Unordered List**: Used for items without a required order or
 * hierarchy... **List with Icons**: Like an unordered list but with icons
 * instead of bullets for visual emphasis."
 *
 * Renders a real `<li>` — meant to be composed inside a `<ul>`/`<ol>` (the
 * upcoming `List` composite, or any other list container). The live marker
 * text ("1-", "a-", "-", "•") is **not** auto-generated here — Figma's own
 * demo passes it as literal per-instance content
 * (`itemNumber`/`itemLetterEn`/`itemLetterAr`), so this component exposes a
 * generic `marker` slot rather than baking in numbering/lettering logic,
 * which belongs to the parent `List` (not yet built — a deliberate scope
 * boundary matching the registry's own dependency order, "List item" before
 * "List"). `icon` is a fully optional consumer-supplied slot for the "With
 * Icon" type — no matching glyph exists in this codebase's Icon registry
 * for the live demo's own `checkmark-circle-02`, the same disclosed gap
 * already accepted for `Alert`/`Toast`/`Notification`/`ItemIcon`'s own
 * missing checkmark.
 *
 * `level={2}` applies the live-verified 24px inline-start indent (no
 * separate marker-column width — indentation is purely the container's own
 * padding). `tone` (`primary`/`neutral`/`onColor`) applies the live-verified
 * uniform text color — unusually, in the live data the *entire* item
 * (marker/icon and text alike) shares one tone-driven color, not just the
 * marker, reproduced exactly via `color` inheritance rather than styling
 * marker and text independently.
 *
 * A live-sampled asymmetry, reproduced exactly rather than "corrected":
 * `Unordered`/Level One uses a `-` marker while Level Two uses a `•` —
 * the opposite of the usual bullet-then-dash nesting convention.
 */
export type ListItemType = 'ordered' | 'unordered' | 'icon';
export type ListItemLevel = 1 | 2;
export type ListItemTone = 'primary' | 'neutral' | 'onColor';

export interface ListItemProps extends ComponentPropsWithRef<'li'> {
  readonly type?: ListItemType;
  readonly level?: ListItemLevel;
  readonly tone?: ListItemTone;
  /** The ordered/unordered marker content (e.g. `"1-"`, `"a-"`, `"-"`, `"•"`) — supplied by the consumer or a parent `List`. */
  readonly marker?: ReactNode;
  /** Decorative icon for `type="icon"`. */
  readonly icon?: ReactNode;
}

export function ListItem({
  type = 'unordered',
  level = 1,
  tone = 'primary',
  marker,
  icon,
  children,
  className,
  ref,
  ...rest
}: ListItemProps) {
  return (
    <li
      ref={ref}
      className={cn(styles.item, className)}
      data-level={level}
      data-tone={tone}
      {...rest}
    >
      {type === 'icon' && icon != null && (
        <span className={styles.icon} aria-hidden="true">
          {icon}
        </span>
      )}
      {type !== 'icon' && marker != null && (
        <span className={styles.marker} aria-hidden="true">
          {marker}
        </span>
      )}
      <span className={styles.text}>{children}</span>
    </li>
  );
}
