import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { cn } from '@utils/cn';
import styles from './Footer.module.css';

/**
 * Footer (FADS shell — DGA CMP-03).
 *
 * Visual-compliance-corrected against the official Platforms Code Footer
 * (Figma `Sv0oWOS1SjWnwhQwdzRJIE`, node `30150:165937`) — see
 * `docs/FIGMA_FOOTER_SPECIFICATION.md` and
 * `reports/VISUAL_COMPLIANCE/Footer/VISUAL_COMPLIANCE_FOOTER.md`.
 *
 * Two regions: an optional upper **grouped nav-links** region (`groups` — each a
 * bordered label + a link list, plus an optional `utilities` slot for
 * social/accessibility icon buttons), and a **legal** region (a bottom underlined
 * link list `links`, a semibold `copyright` caption, `secondaryLinks`, and a
 * caller-supplied `logos` slot).
 *
 * **Branding is fully caller-supplied.** The Footer ships *no* default logo and
 * *no* organization name — pass `logos` / `copyright` to brand it. This keeps the
 * component product-agnostic.
 *
 * `background="darkGreen"` renders the official dark-green (on-color) variant.
 */
export interface FooterLink {
  readonly label: ReactNode;
  readonly href?: string;
  readonly external?: boolean;
}

export interface FooterGroup {
  readonly id: string;
  readonly label: ReactNode;
  readonly links: readonly FooterLink[];
}

export interface FooterProps extends Omit<ComponentPropsWithoutRef<'footer'>, 'title'> {
  /** Upper region: columns of grouped links (official "Nav links"). */
  readonly groups?: readonly FooterGroup[];
  /** Accessible label for the grouped-links `<nav>` landmark. */
  readonly groupsLabel?: string;
  /** Optional slot in the upper region (e.g. social / accessibility icon buttons). */
  readonly utilities?: ReactNode;
  /** Bottom region: the legal/utility link list (rendered underlined). */
  readonly links?: readonly FooterLink[];
  /** Accessible label for the bottom links `<nav>` landmark. */
  readonly navLabel?: string;
  /** Legal caption / copyright line (official semibold "Legal caption"). */
  readonly copyright?: ReactNode;
  /** Secondary bottom links (official "Extra Link List", e.g. Terms / Privacy). */
  readonly secondaryLinks?: readonly FooterLink[];
  /** Brand/logo slot. Caller-supplied — no default; never hardcoded. */
  readonly logos?: ReactNode;
  /** Background treatment (official Background Color variant). */
  readonly background?: 'default' | 'darkGreen';
  /** Free-form fallback content, rendered in the legal region. */
  readonly children?: ReactNode;
}

function renderLink(link: FooterLink, className: string, key: string) {
  // A link without an href is not navigable — render it as inert text rather than
  // an anchor with no destination.
  if (link.href == null) {
    return (
      <span key={key} className={className}>
        {link.label}
      </span>
    );
  }
  return (
    <a
      key={key}
      className={className}
      href={link.href}
      target={link.external ? '_blank' : undefined}
      rel={link.external ? 'noopener noreferrer' : undefined}
    >
      {link.label}
    </a>
  );
}

export function Footer({
  groups = [],
  groupsLabel = 'Footer navigation',
  utilities,
  links = [],
  navLabel = 'Additional links',
  copyright,
  secondaryLinks = [],
  logos,
  background = 'default',
  className,
  children,
  ...rest
}: FooterProps) {
  const hasGroups = groups.length > 0 || utilities != null;
  const hasLegalInfo = copyright != null || children != null || secondaryLinks.length > 0;
  const hasLegal = links.length > 0 || hasLegalInfo || logos != null;

  return (
    <footer
      className={cn(styles.footer, className)}
      data-background={background === 'darkGreen' ? 'dark-green' : undefined}
      {...rest}
    >
      <div className={styles.content}>
        {hasGroups && (
          <nav className={styles.groups} aria-label={groupsLabel}>
            {groups.map((group) => (
              <div key={group.id} className={styles.group}>
                <div className={styles.groupLabel}>{group.label}</div>
                <ul className={styles.linkList}>
                  {group.links.map((link, index) => (
                    <li key={`${group.id}-${index}`}>
                      {renderLink(link, styles.link, `${group.id}-${index}`)}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            {utilities != null && <div className={styles.group}>{utilities}</div>}
          </nav>
        )}

        {hasLegal && (
          <div className={styles.legal}>
            <div className={styles.legalInfo}>
              {links.length > 0 && (
                <nav className={styles.legalLinks} aria-label={navLabel}>
                  {links.map((link, index) => renderLink(link, styles.legalLink, `legal-${index}`))}
                </nav>
              )}
              {hasLegalInfo && (
                <div className={styles.legalBlock}>
                  {copyright != null && <p className={styles.legalCaption}>{copyright}</p>}
                  {children}
                  {secondaryLinks.length > 0 && (
                    <div className={styles.extraLinks}>
                      {secondaryLinks.map((link, index) =>
                        renderLink(link, styles.link, `extra-${index}`)
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
            {logos != null && <div className={styles.logos}>{logos}</div>}
          </div>
        )}
      </div>
    </footer>
  );
}
