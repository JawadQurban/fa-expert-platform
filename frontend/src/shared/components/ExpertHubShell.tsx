import type { ReactNode } from 'react';
import { AcademyFooter } from '@/shared/footer';
import { useLocale } from '@i18n/LocaleProvider';
import { getShellContent } from '../content/shell.content';
import { getExpertHubFooterContent } from '../content/footer.content';
import { ExpertHubHeader, type ExpertHubHeaderVariant } from './ExpertHubHeader';
import styles from './ExpertHubShell.module.css';

/**
 * Expert Hub application shell — the chrome every Expert Hub screen renders
 * inside. Owned by the Expert Hub boundary; it does **not** use the Hackathon
 * `RootLayout`. It provides the full landmark structure itself — a skip link,
 * the `<header>` (banner), the `<main>` landmark, and the `<footer>`
 * (contentinfo) as siblings — which is a cleaner landmark structure than the
 * shared Hackathon `RootLayout` (that one nests header/footer inside `<main>`).
 *
 * The footer is the **product-neutral shared** `AcademyFooter` composition
 * (`@/shared/footer`) fed this product's own content — the same reusable Footer
 * the Hackathon product renders, never a duplicated Expert-Hub-specific Footer
 * component (`DECISIONS.md` P-15).
 *
 * The `variant` selects the header's public / portal / internal composition;
 * the layouts pass the variant appropriate to their route group.
 */
export function ExpertHubShell({
  variant,
  children,
}: {
  readonly variant: ExpertHubHeaderVariant;
  readonly children: ReactNode;
}) {
  const { locale } = useLocale();
  const { a11y } = getShellContent(locale);

  return (
    <div className={styles.shell}>
      <a className="fads-skip-link" href="#expert-hub-main">
        {a11y.skipToContent}
      </a>
      <ExpertHubHeader variant={variant} />
      <main id="expert-hub-main" className={styles.main} aria-label={a11y.mainLandmark}>
        {children}
      </main>
      <AcademyFooter content={getExpertHubFooterContent(locale)} />
    </div>
  );
}
