import { Footer } from '@ds/shell';
import type { FooterProps } from '@ds/shell';
import type { FooterContent } from './footerContent.types';
import styles from './AcademyFooter.module.css';

/**
 * The one shared Financial Academy Footer composition — **product-neutral shared
 * infrastructure** (it lives under `src/shared/`, like the Design System, and is
 * importable by every product). It composes the approved `@ds/shell` `Footer`
 * shell component; no Design System component or token is created or modified.
 *
 * All content is supplied by the caller via `content` (a product-neutral
 * `FooterContent`), so the Footer's *structure* is authored once here and each
 * product feeds its own *content* — the Hackathon product through
 * `components/AppFooter` (→ `content/footer.ts`) and the standalone Expert Hub
 * product through `apps/expert-hub` (→ its own footer content). Neither product
 * duplicates or diverges from this structure.
 *
 * Layout: four columns — a Summary group, an Important-links group, a Contact
 * group (a phone/email/location item is exactly the `{label, href}` shape the
 * `Footer`'s own `FooterLink` handles; an href-less item renders as inert text),
 * plus the Social column in the free-form `utilities` slot (icon-shaped social
 * buttons are not a vertical text-link list) — over a logo row and a legal-link
 * row. Every value below reuses an existing `--fads-sys-footer-*`/`--fads-ref-*`
 * token.
 */
export interface AcademyFooterProps {
  readonly content: FooterContent;
  /** Design System Footer background variant. Defaults to the on-color dark-green. */
  readonly background?: FooterProps['background'];
}

export function AcademyFooter({ content, background = 'darkGreen' }: AcademyFooterProps) {
  return (
    <Footer
      background={background}
      groupsLabel={content.groupsLabel}
      groups={[
        {
          id: 'summary',
          label: content.summaryLabel,
          links: content.summaryLinks.map(({ label, href, external }) => ({
            label,
            href,
            external,
          })),
        },
        {
          id: 'important-links',
          label: content.importantLinksLabel,
          links: content.importantLinks.map(({ label, href, external }) => ({
            label,
            href,
            external,
          })),
        },
        {
          id: 'contact',
          label: content.contactHeading,
          links: content.contactItems.map((item) => ({
            // `<bdi>` isolates the value's own bidi direction from the
            // surrounding RTL context — without it, an LTR value with
            // multiple tokens (e.g. "+966 8001010015") gets its tokens
            // visually reordered by the outer RTL paragraph direction.
            label: <bdi>{item.value}</bdi>,
            href: item.href,
          })),
        },
      ]}
      utilities={
        <div>
          <p className={styles.socialHeading}>{content.socialHeading}</p>
          <ul className={styles.socialList}>
            {content.socialLinks.map((social) => (
              <li key={social.id}>
                <a
                  className={styles.socialLink}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                >
                  {/* Trusted, build-time-bundled brand icon markup — never user input (same technique Icon.tsx uses for the generated registry). */}
                  <span
                    className={styles.socialIcon}
                    aria-hidden="true"
                    dangerouslySetInnerHTML={{ __html: social.icon }}
                  />
                </a>
              </li>
            ))}
          </ul>
        </div>
      }
      navLabel={content.policyLinksLabel}
      links={content.policyLinks.map(({ label, href, external }) => ({
        label,
        href,
        external,
      }))}
      copyright={content.copyright}
      logos={
        <div className={styles.logos}>
          {content.logos.map((logo) => (
            <img key={logo.alt} className={styles.logo} src={logo.src} alt={logo.alt} />
          ))}
        </div>
      }
    />
  );
}
