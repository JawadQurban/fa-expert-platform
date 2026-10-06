import type { ReactNode } from 'react';
import { cn } from '@utils/cn';
import styles from './Menu.module.css';

/**
 * Menu (FADS composite — DGA CMP-11).
 *
 * Verified live against the official Platforms Code Figma Menu component
 * set (file `J0xq7JG3JKshRDzrgAM7E0`, node `30195:22214` — `rtl`, composed
 * of repeated `Section` groups) via the Figma MCP — see
 * `docs/FIGMA_MENU_SPECIFICATION.md` and
 * `reports/VISUAL_COMPLIANCE/Menu/VISUAL_COMPLIANCE_MENU.md`.
 *
 * The live data shows only the floating **panel content** — a bordered,
 * shadowed surface containing one or more `Section`s (an optional bold
 * uppercase group label + a stack of `MenuListItem`s), separated by a
 * divider between sections. No trigger button or open/close/positioning
 * behavior exists in this node at all; this component renders the panel
 * only, the same scope boundary this project already drew for `DropdownListItem`
 * (a row primitive) versus `Select` (the full trigger+portal+positioning
 * composite that consumes it) — a future "Menu button"/trigger composite
 * would consume `Menu` the same way `Select` consumes `DropdownListItem`.
 */
export interface MenuSectionProps {
  /** Optional bold, uppercase group label. */
  readonly label?: ReactNode;
  readonly children: ReactNode;
  readonly className?: string;
}

export function MenuSection({ label, children, className }: MenuSectionProps) {
  return (
    <div className={cn(styles.section, className)}>
      {label != null && (
        <div className={styles.groupLabel} role="presentation">
          {label}
        </div>
      )}
      <div className={styles.itemsGroup}>{children}</div>
    </div>
  );
}

export interface MenuProps {
  /** One or more `<MenuSection>` elements. */
  readonly children: ReactNode;
  readonly className?: string;
}

export function Menu({ children, className }: MenuProps) {
  return <div className={cn(styles.menu, className)}>{children}</div>;
}
