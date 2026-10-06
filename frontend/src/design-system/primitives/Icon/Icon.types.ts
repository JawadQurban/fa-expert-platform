import type { ComponentPropsWithoutRef } from 'react';
import type { IconName } from './icons';

export type { IconName } from './icons';
export type { IconCategoryId, IconCategory } from './icon-categories';

export type IconSize = 'sm' | 'md' | 'featured';

/**
 * Token-bound color (DC-04 — no hardcoded/free-form colors). This is the
 * `color` control called for in the Phase 6 spec, named `tone` to match
 * the DGA status-tone vocabulary already used across FADS primitives.
 */
export type IconTone =
  'inherit' | 'neutral' | 'primary' | 'success' | 'error' | 'warning' | 'information';

export interface IconProps extends Omit<ComponentPropsWithoutRef<'span'>, 'children' | 'title'> {
  /** Registry key, e.g. `"search"`. Unknown names render the fallback glyph. */
  readonly name: IconName;
  readonly size?: IconSize;
  readonly tone?: IconTone;
  /**
   * Accessible name. When present (and `decorative` isn't `true`) the icon
   * is functional: `role="img"` + `aria-label={title}`. Omit for icons
   * whose meaning is already conveyed by adjacent text or an `aria-label`
   * on a parent control.
   */
  readonly title?: string;
  /**
   * Force decorative (`aria-hidden`) regardless of `title` — for icons
   * paired with a control that already carries the accessible name (e.g.
   * an icon inside an `aria-label`led icon-only button). Defaults to
   * `true` when no `title` is given, `false` when one is.
   */
  readonly decorative?: boolean;
  /**
   * Opt-in mirroring for directional icons (arrows, chevrons, "next/back")
   * under RTL. Per-icon directionality isn't derivable from the Figma
   * source (see docs/ICON_LIBRARY.md — Known Limitations), so callers
   * decide per usage.
   */
  readonly mirrorInRTL?: boolean;
}
