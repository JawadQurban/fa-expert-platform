import type { ComponentPropsWithoutRef } from 'react';
import { cn } from '@utils/cn';
import styles from './Loading.module.css';

/**
 * Loading (FADS composite — DGA CMP-31, Secondary).
 *
 * Verified live against the official Platforms Code Figma **Loading** component set
 * (file `J0xq7JG3JKshRDzrgAM7E0`, node `5698:11136` — 84 variants: `size`
 * [xxSmall..xxLarge, 7] × `style` [Neutral/Primary/On-Color] × `indicator` [1-4]) via
 * the Figma MCP — see `docs/FIGMA_LOADING_SPECIFICATION.md` and
 * `reports/VISUAL_COMPLIANCE/Loading/VISUAL_COMPLIANCE_LOADING.md`.
 *
 * The live component set defines **only a spinner** — every sampled variant is a
 * rotating-ring indicator exported as a static per-frame raster image (the
 * `indicator` axis is an animation-frame sample, not a distinct visual state, so
 * it isn't exposed in this API). No Overlay/Full-Page/Loading-Label visual chrome
 * exists on this node — per this task's "only implement verified variants" rule,
 * those aren't invented here: compose `Loading` yourself inside your own
 * `position: fixed` wrapper using the already-Approved `--fads-sys-color-overlay`
 * token (the same one `Modal`'s backdrop uses) for an overlay/full-page loading
 * treatment. `variant="skeleton"` is **kept from the pre-existing implementation
 * but not Figma-verified** — the dedicated `Skeleton Square`/`Skeleton Component`
 * registry rows remain unresolved (`status: "Missing"`) — flagged Needs
 * Confirmation rather than removed (spec §1).
 *
 * Region-level async-loading indicator (`INTERACTION_SPECIFICATION.md` §12).
 * Always exposes `role="status"`/`aria-live="polite"` with an accessible
 * `label` (visually hidden by default) so completion is announced once the
 * caller swaps this out for real content (WCAG 4.1.3). Both animations respect
 * `prefers-reduced-motion: reduce` (WCAG 2.3.3) — the spinner stops rotating and
 * the skeleton shimmer stops pulsing, while the `role="status"` announcement
 * still fires normally.
 */
export type LoadingVariant = 'spinner' | 'skeleton';
export type LoadingSize = 'xxs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
export type LoadingMood = 'neutral' | 'primary' | 'onColor';

export interface LoadingProps extends ComponentPropsWithoutRef<'div'> {
  readonly variant?: LoadingVariant;
  /** Maps to the official `Size` property (spinner only). */
  readonly size?: LoadingSize;
  /** Maps to the official `Style` property (spinner only). */
  readonly mood?: LoadingMood;
  /** Accessible status text. Defaults to English; pass a localized string. */
  readonly label?: string;
  /** Number of placeholder lines when `variant="skeleton"`. */
  readonly lines?: number;
}

export function Loading({
  variant = 'spinner',
  size = 'md',
  mood = 'primary',
  label = 'Loading',
  lines = 3,
  className,
  ...rest
}: LoadingProps) {
  return (
    <div
      className={cn(styles.loading, className)}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={label}
      data-variant={variant}
      {...rest}
    >
      {variant === 'spinner' ? (
        <span className={styles.spinner} data-size={size} data-mood={mood} aria-hidden="true" />
      ) : (
        <div className={styles.skeleton} aria-hidden="true">
          {Array.from({ length: lines }, (_, index) => (
            <span key={index} className={styles.skeletonLine} />
          ))}
        </div>
      )}
    </div>
  );
}
