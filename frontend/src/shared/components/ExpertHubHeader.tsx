import { useLocale } from '@i18n/LocaleProvider';
import { getHeaderContent } from '../content/header.content';
import { GovernmentUtilityBar } from './GovernmentUtilityBar';
import { ServiceInformationBar } from './ServiceInformationBar';
import { ExpertHubMainHeader } from './ExpertHubMainHeader';
import styles from './ExpertHubHeader.module.css';

/**
 * Expert Hub application header — an application-level composition of approved
 * Design System components (no Design System component is created or modified). It
 * is Expert-Hub-owned and Expert-Hub-neutral; it never reuses the Hackathon
 * header or Hackathon content.
 *
 * It reproduces the approved Academy/Government three-level header structure
 * (`DECISIONS.md` P-15), matching the reference screenshot:
 *
 *   Level 1 — {@link GovernmentUtilityBar}  (registered-gov-site indicator + verify)
 *   Level 2 — {@link ServiceInformationBar} (the live date and time)
 *   Level 3 — {@link ExpertHubMainHeader}   (brand + nav + search + language + Login)
 *
 * Landmarks: Level 3 (the Design System `Header`) is the single `banner`. Levels
 * 1 + 2 are wrapped in one labelled `region` so their content is inside a
 * landmark (they are utility chrome, not part of the banner or a `nav`), keeping
 * exactly one banner and distinctly-named navigation landmarks.
 *
 * The utility bars are part of the **public** marketing shell only; the
 * authenticated `portal` / `internal` shells render just the main header with
 * role-scoped navigation.
 */
export type ExpertHubHeaderVariant = 'public' | 'portal' | 'internal';

export function ExpertHubHeader({ variant }: { readonly variant: ExpertHubHeaderVariant }) {
  const { locale } = useLocale();
  const content = getHeaderContent(locale);

  if (variant !== 'public') {
    return <ExpertHubMainHeader variant={variant} />;
  }

  return (
    <div className={styles.root}>
      <section className={styles.utilityRegion} aria-label={content.utilityRegionLabel}>
        <GovernmentUtilityBar gov={content.gov} />
        <ServiceInformationBar service={content.service} locale={locale} />
      </section>
      <ExpertHubMainHeader variant={variant} />
    </div>
  );
}
