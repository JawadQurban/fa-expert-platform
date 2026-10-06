import { useId, useState } from 'react';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { cn } from '@utils/cn';
import { useMediaQuery } from '@hooks/useMediaQuery';
import styles from './Header.module.css';

/**
 * Header (FADS shell — DGA CMP-01 "Nav Header").
 *
 * Visual-compliance-corrected against the official Platforms Code Nav Header
 * (Figma `Sv0oWOS1SjWnwhQwdzRJIE`, node `30150:148751`) — see
 * `docs/FIGMA_HEADER_SPECIFICATION.md` and
 * `reports/VISUAL_COMPLIANCE/Header/VISUAL_COMPLIANCE_HEADER.md`.
 *
 * Structure: a logo/brand slot + optional platform-name label on the leading
 * side, an inline primary-navigation list, and a trailing `actions` slot.
 * Below 960px the inline nav collapses behind a responsive toggle that reveals
 * a stacked panel.
 *
 * **Branding is fully caller-supplied.** The Header ships *no* default logo and
 * *no* default organization name — pass `logo` / `logoLabel` to brand it. This
 * keeps the component product-agnostic (the Financial Academy logo/name live in
 * product content, never in the design system).
 *
 * Nav items reuse semantics only (anchors): `selected` sets `aria-current="page"`
 * and the official green Selected treatment; `external` sets `target`/`rel`;
 * `disabled` makes the item non-navigable; `hasSubmenu` shows a trailing chevron.
 *
 * The responsive toggle uses placeholder glyphs (☰ / ✕) pending the official DGA
 * icon library (Q8), matching the `Link` primitive's placeholder-icon precedent.
 */
export interface HeaderNavItem {
  readonly id: string;
  readonly label: ReactNode;
  readonly href: string;
  readonly selected?: boolean;
  readonly external?: boolean;
  readonly disabled?: boolean;
  /** Renders a trailing chevron, marking the item as a sub-menu parent. */
  readonly hasSubmenu?: boolean;
}

export interface HeaderProps extends Omit<ComponentPropsWithoutRef<'header'>, 'title'> {
  /** Brand logo slot (image / svg / mark). Caller-supplied — no default. */
  readonly logo?: ReactNode;
  /** Platform / organization name shown beside the logo. Caller-supplied. */
  readonly logoLabel?: ReactNode;
  /** When set, the logo + label become a link (e.g. to the home page). */
  readonly logoHref?: string;
  /** Accessible name for the logo link (recommended when `logoHref` is set and the logo is an image). */
  readonly logoLinkLabel?: string;
  readonly nav?: HeaderNavItem[];
  /** Accessible label for the nav `<nav>` landmark. Defaults to English; pass a localized string. */
  readonly navLabel?: string;
  readonly actions?: ReactNode;
  /** Accessible label for the responsive menu toggle button. */
  readonly menuLabel?: string;
  /** Controlled open state of the responsive (collapsed) menu. */
  readonly menuOpen?: boolean;
  /** Initial open state when uncontrolled. */
  readonly defaultMenuOpen?: boolean;
  readonly onMenuOpenChange?: (open: boolean) => void;
}

export function Header({
  logo,
  logoLabel,
  logoHref,
  logoLinkLabel,
  nav = [],
  navLabel = 'Primary navigation',
  actions,
  menuLabel = 'Menu',
  menuOpen,
  defaultMenuOpen = false,
  onMenuOpenChange,
  className,
  ...rest
}: HeaderProps) {
  const panelId = useId();
  const isCompact = useMediaQuery('(max-width: 959.98px)');
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultMenuOpen);
  const open = menuOpen ?? uncontrolledOpen;

  const setOpen = (next: boolean) => {
    if (menuOpen === undefined) {
      setUncontrolledOpen(next);
    }
    onMenuOpenChange?.(next);
  };

  const hasNav = nav.length > 0;
  const hasBrand = logo != null || logoLabel != null;

  const renderItem = (item: HeaderNavItem) => {
    const inner = (
      <>
        <span className={styles.itemLabel}>{item.label}</span>
        {item.hasSubmenu && (
          <span className={styles.chevron} aria-hidden="true">
            ⌄
          </span>
        )}
      </>
    );

    // A disabled item is not a link — render an inert span (non-navigable,
    // non-focusable) rather than an anchor with no href.
    if (item.disabled) {
      return (
        <span
          key={item.id}
          className={styles.item}
          aria-disabled="true"
          data-selected={item.selected || undefined}
        >
          {inner}
        </span>
      );
    }

    return (
      <a
        key={item.id}
        className={styles.item}
        href={item.href}
        aria-current={item.selected ? 'page' : undefined}
        data-selected={item.selected || undefined}
        target={item.external ? '_blank' : undefined}
        rel={item.external ? 'noopener noreferrer' : undefined}
      >
        {inner}
      </a>
    );
  };

  const brandInner = (
    <>
      {logo != null && <span className={styles.logo}>{logo}</span>}
      {logoLabel != null && <span className={styles.logoLabel}>{logoLabel}</span>}
    </>
  );

  return (
    <header
      className={cn(styles.header, className)}
      data-compact={isCompact || undefined}
      {...rest}
    >
      <div className={styles.bar}>
        {isCompact && hasNav && (
          <button
            type="button"
            className={styles.toggle}
            aria-label={menuLabel}
            aria-expanded={open}
            aria-controls={panelId}
            onClick={() => setOpen(!open)}
          >
            <span className={styles.toggleIcon} aria-hidden="true" data-placeholder-icon="menu">
              {open ? '✕' : '☰'}
            </span>
          </button>
        )}

        <div className={styles.lead}>
          {hasBrand &&
            (logoHref != null ? (
              <a className={styles.brand} href={logoHref} aria-label={logoLinkLabel}>
                {brandInner}
              </a>
            ) : (
              <div className={styles.brand}>{brandInner}</div>
            ))}

          {!isCompact && hasNav && (
            <nav className={styles.navInline} aria-label={navLabel}>
              {nav.map(renderItem)}
            </nav>
          )}
        </div>

        {actions != null && <div className={styles.actions}>{actions}</div>}
      </div>

      {isCompact && hasNav && (
        <nav
          id={panelId}
          className={styles.navPanel}
          aria-label={navLabel}
          data-open={open || undefined}
          hidden={!open || undefined}
        >
          {nav.map(renderItem)}
        </nav>
      )}
    </header>
  );
}
