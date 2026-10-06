import { cn } from '@utils/cn';
import { env } from '@utils/env';
import { iconRegistry } from './icons';
import styles from './Icon.module.css';
import type { IconProps } from './Icon.types';

export type {
  IconProps,
  IconSize,
  IconTone,
  IconName,
  IconCategoryId,
  IconCategory,
} from './Icon.types';

/** Generic placeholder glyph for a `name` missing from the registry. */
const FALLBACK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
<g>
<circle cx="12" cy="12" r="9.25" stroke="currentColor" stroke-width="1.5" stroke-dasharray="3 2"/>
<path d="M12 16v.01M12 13c0-1.5 1.75-1.75 1.75-3.25a1.75 1.75 0 1 0-3.5 0" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</g>
</svg>`;

/**
 * Icon (FADS primitive — DGA CMP, Phase 6 icon library import).
 *
 * Renders a named icon from the official Platforms Code icon library
 * (see docs/ICON_LIBRARY.md for source, coverage, and how to sync new
 * icons). Enforces the DGA icon rules on top of the glyph:
 *
 * - Sizes are token-capped: `sm`/`md` ≤ 24px; **>24px must use `featured`**.
 * - Color comes from the `tone` token (no free-form colors — DC-04).
 * - **Decorative vs functional**: pass `title` for a functional icon
 *   (`role="img"` + accessible name); a control-labelled icon should pass
 *   `decorative` explicitly instead of relying on `title`'s absence.
 */
export function Icon({
  name,
  size = 'md',
  tone = 'inherit',
  title,
  decorative,
  mirrorInRTL = false,
  className,
  ...rest
}: IconProps) {
  const isFunctional = decorative !== true && title != null && title !== '';
  const svgMarkup = iconRegistry[name];

  if (svgMarkup == null && env.isDev) {
    console.warn(
      `Icon: unknown name "${name}" — rendering fallback glyph. Check icon-categories.ts.`
    );
  }

  return (
    <span
      className={cn(styles.icon, className)}
      data-size={size}
      data-tone={tone}
      data-mirror-rtl={mirrorInRTL || undefined}
      data-missing={svgMarkup == null || undefined}
      role={isFunctional ? 'img' : undefined}
      aria-label={isFunctional ? title : undefined}
      aria-hidden={isFunctional ? undefined : true}
      {...rest}
      // Trusted, build-time-generated icon markup (scripts/import-icons.mjs) — never user input.
      dangerouslySetInnerHTML={{ __html: svgMarkup ?? FALLBACK_SVG }}
    />
  );
}
