import type { ComponentPropsWithRef, ReactNode } from 'react';
import { cn } from '@utils/cn';
import styles from './NavHeaderSubMenu.module.css';

/**
 * NavHeaderSubMenu / NavHeaderSubMenuColumn (FADS composite — DGA registry
 * "Nav Header Sub-Menu").
 *
 * Verified live against the official Header Figma file (`Sv0oWOS1SjWnwhQwdzRJIE`,
 * node `30150:148877` — `rtl` × `fullWidth` × `background`[Default/Dark
 * green] × `linkStyle`[Text only/Simple icon/Boxed icon], 24 variants) via
 * the Figma MCP — see `docs/FIGMA_NAV_HEADER_SUB_MENU_SPECIFICATION.md` and
 * `reports/VISUAL_COMPLIANCE/NavHeaderSubMenu/VISUAL_COMPLIANCE_NAV_HEADER_SUB_MENU.md`.
 *
 * A shadowed panel (up to 4 flex columns, each a bold group label above a
 * stack of composed `HeaderSubMenuItem`s) — the mega-menu dropdown for the
 * already-Approved Header's nav items. Columns are consumer-composed via
 * `NavHeaderSubMenuColumn` children rather than a configured `columns`
 * array, matching the live node's own flat, unconfigurable per-column
 * structure. `onColor` renders the live-verified "Dark green" background
 * (`#074d31`, a distinct "SA flag green" value, not the shared brand-primary
 * `#1b8354`) — group labels and every composed `HeaderSubMenuItem` must
 * receive matching `onColor` in that mode (not automatic — a generic
 * `children` slot can't reach into composed elements to flip their props).
 * `fullWidth` is not modeled as a prop — the two sampled canvas widths
 * (1440px/1320px) are just demo-frame sizing, not a structural difference;
 * the panel is consumer-width by design (`inline-size: 100%`).
 */
export interface NavHeaderSubMenuColumnProps {
  readonly label: ReactNode;
  readonly children: ReactNode;
}

export function NavHeaderSubMenuColumn({ label, children }: NavHeaderSubMenuColumnProps) {
  return (
    <div className={styles.column}>
      <div className={styles.groupLabel}>{label}</div>
      <div className={styles.navigation}>{children}</div>
    </div>
  );
}

export interface NavHeaderSubMenuProps extends ComponentPropsWithRef<'div'> {
  /** The live-verified "Dark green" background — apply matching `onColor` to composed items. */
  readonly onColor?: boolean;
  /** One or more `<NavHeaderSubMenuColumn>` (the live node samples up to 4). */
  readonly children: ReactNode;
}

export function NavHeaderSubMenu({
  onColor = false,
  children,
  className,
  ref,
  ...rest
}: NavHeaderSubMenuProps) {
  return (
    <div
      ref={ref}
      className={cn(styles.panel, className)}
      data-oncolor={onColor || undefined}
      {...rest}
    >
      <div className={styles.content}>{children}</div>
    </div>
  );
}
