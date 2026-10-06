/**
 * Product-neutral Footer content contract.
 *
 * This is **shared infrastructure** — it lives under `src/shared/` (like the
 * Design System under `src/design-system/`), not under any single product. Both
 * the Hackathon product (`content/footer.ts`) and the standalone Expert Hub
 * product (`apps/expert-hub/shared/content/footer.content.ts`) supply a value of
 * this shape to the one shared `AcademyFooter` composition, so the Footer's
 * *structure* is written once and each product feeds it its own *content*.
 *
 * Nothing here is Hackathon- or Expert-Hub-specific: it is a pure data contract.
 */

export interface FooterLinkItem {
  readonly id: string;
  readonly label: string;
  readonly href: string;
  readonly external?: boolean;
}

export interface FooterContactItem {
  readonly label: string;
  readonly value: string;
  /** `tel:`/`mailto:` href — omitted for non-actionable items (e.g. a physical location). */
  readonly href?: string;
}

export interface FooterSocialLink {
  readonly id: string;
  /** Full accessible name, e.g. `aria-label`. */
  readonly label: string;
  /**
   * Raw SVG markup for the platform's brand mark (imported via `?raw`). These
   * bypass the generated `Icon` registry because they aren't Figma-sheet exports
   * — inlined the same trusted, build-time-bundled way `Icon.tsx` renders its own
   * generated markup.
   */
  readonly icon: string;
  readonly href: string;
}

export interface FooterLogo {
  readonly src: string;
  readonly alt: string;
}

/**
 * Everything the shared `AcademyFooter` needs to render. A product provides one
 * of these (per locale, if bilingual); no field is optional-by-omission because
 * every product's footer carries the same regions — only the values differ.
 */
export interface FooterContent {
  /** Accessible name for the primary footer-navigation landmark. */
  readonly groupsLabel: string;
  readonly summaryLabel: string;
  readonly summaryLinks: readonly FooterLinkItem[];
  readonly importantLinksLabel: string;
  readonly importantLinks: readonly FooterLinkItem[];
  readonly contactHeading: string;
  readonly contactItems: readonly FooterContactItem[];
  readonly socialHeading: string;
  readonly socialLinks: readonly FooterSocialLink[];
  /** Accessible name for the secondary (legal/policy) footer-navigation landmark. */
  readonly policyLinksLabel: string;
  readonly policyLinks: readonly FooterLinkItem[];
  readonly copyright: string;
  readonly logos: readonly FooterLogo[];
}
