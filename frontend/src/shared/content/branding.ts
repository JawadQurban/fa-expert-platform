import fullLogoAr from '@/assets/branding/full_logo-ar.svg';
import { expertHubPaths } from '../../app/router/paths';

/**
 * Expert Hub brand wiring — the single place the Financial Academy logo/name are
 * bound into the Expert Hub application. Owned by the Expert Hub boundary (does
 * not import the Hackathon `content/branding.ts`); the logo image itself is a
 * shared, product-neutral brand asset under `@/assets` (like the Design System,
 * an allowed cross-boundary import).
 *
 * The Design System `Header`/`Footer` ship no default logo/name by design —
 * branding is always caller-supplied — so the same components stay reusable for
 * both products. `homeHref` points at the Expert Hub home, not the Hackathon
 * home, keeping navigation inside this product.
 */
export interface ExpertHubBranding {
  readonly logoSrc: string;
  readonly organizationName: string;
  readonly homeHref: string;
}

export const expertHubBranding: ExpertHubBranding = {
  logoSrc: fullLogoAr,
  organizationName: 'الأكاديمية المالية',
  homeHref: expertHubPaths.landing,
};
