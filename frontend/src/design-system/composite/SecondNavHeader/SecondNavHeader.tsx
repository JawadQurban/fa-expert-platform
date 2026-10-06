import type { ComponentPropsWithRef, ReactNode } from 'react';
import { cn } from '@utils/cn';
import styles from './SecondNavHeader.module.css';

/**
 * SecondNavHeader / SecondNavHeaderItem (FADS composite — DGA registry
 * "Second Nav Header").
 *
 * Verified live against the official Platforms Code Figma Second Nav
 * Header component (file `J0xq7JG3JKshRDzrgAM7E0`, node `18800:8281` —
 * `rtl` × `style`[Gray/Primary] × `showContent`/`showItem2`/`showItem3`/
 * `showItem4`/`showActions`/`showAction2`/`showAction3`/`showAction4`/
 * `showDivider`) via the Figma MCP — see
 * `docs/FIGMA_SECOND_NAV_HEADER_SPECIFICATION.md` and
 * `reports/VISUAL_COMPLIANCE/SecondNavHeader/VISUAL_COMPLIANCE_SECOND_NAV_HEADER.md`.
 * Figma's own description: "The Second Nav Header component is a secondary
 * navigation bar that appears above the primary navigation and offers
 * additional controls or context-based information."
 *
 * A slim 40px bar: a row of contextual `SecondNavHeaderItem`s (icon+label —
 * Figma's own demo content is weather/date/time/location, generic
 * placeholder data, not a fixed content contract) on one side, and an
 * `actions` slot on the other for consumer-composed icon-only
 * already-Approved `Button` instances (the live action buttons are literal
 * `Button` component instances, confirmed by the shared `407:510376` node
 * reference — not rebuilt here). `variant` (renamed from Figma's own
 * `style` prop, which collides with the native HTML `style` attribute)
 * switches the live-verified Gray/Primary background, text, and divider
 * colors. RTL mirrors naturally via a single logical-property DOM
 * structure — no manual reordering, unlike the Figma-authored markup's own
 * conditional DOM reversal (same category of authoring artifact already
 * found for Button/DropdownListItem/TrailingIcon/TocItem).
 */
export type SecondNavHeaderVariant = 'gray' | 'primary';

export interface SecondNavHeaderItemProps {
  readonly icon: ReactNode;
  readonly children: ReactNode;
}

export function SecondNavHeaderItem({ icon, children }: SecondNavHeaderItemProps) {
  return (
    <span className={styles.item}>
      <span className={styles.itemIcon} aria-hidden="true">
        {icon}
      </span>
      <span className={styles.itemLabel}>{children}</span>
    </span>
  );
}

export interface SecondNavHeaderProps extends ComponentPropsWithRef<'div'> {
  readonly variant?: SecondNavHeaderVariant;
  readonly divider?: boolean;
  /** One or more composed `<SecondNavHeaderItem>`. */
  readonly children?: ReactNode;
  /** Composed icon-only `<Button>` instances (the live action buttons are literal `Button` instances). */
  readonly actions?: ReactNode;
}

export function SecondNavHeader({
  variant = 'gray',
  divider = true,
  children,
  actions,
  className,
  ref,
  ...rest
}: SecondNavHeaderProps) {
  return (
    <div
      ref={ref}
      className={cn(styles.bar, className)}
      data-variant={variant}
      data-divider={divider || undefined}
      {...rest}
    >
      <div className={styles.content}>
        {children != null && <div className={styles.items}>{children}</div>}
        {actions != null && <div className={styles.actions}>{actions}</div>}
      </div>
    </div>
  );
}
