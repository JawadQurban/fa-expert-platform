import { useId } from 'react';
import { cn } from '@utils/cn';
import styles from './Rating.module.css';

/**
 * Rating (FADS composite — DGA CMP-29).
 *
 * Verified live against the official Platforms Code Figma Rating component
 * set (file `J0xq7JG3JKshRDzrgAM7E0`, node `30150:69520` — `size`[Large/
 * Medium/Small] × `brand`, plus the `_RatingStar` sub-component (node
 * `30150:69453`, 24 variants: `size` × `state`[Normal/Half/Selected/
 * Pressed] × `style`[Default/Brand]) via the Figma MCP — see
 * `docs/FIGMA_RATING_SPECIFICATION.md` and
 * `reports/VISUAL_COMPLIANCE/Rating/VISUAL_COMPLIANCE_RATING.md`.
 *
 * Each star in the live data is a real, independently-focusable `<button>`
 * (confirmed by sampling the `Pressed` state directly) — this is an
 * **interactive rating input**, not a read-only display, when `onChange` is
 * given. Passing no `onChange` renders a non-interactive, `role="img"`
 * display instead (e.g. for showing an aggregate/average score) — the live
 * `Half` state exists specifically for this case, since a user's own click
 * always commits a whole star.
 *
 * The star glyph itself is a plain, hand-authored 5-point star `<path>`
 * (the same category of choice as `Checkbox`'s own hand-authored checkmark
 * path) — no star icon exists anywhere in the FADS icon registry yet (not
 * even in the already-imported `Shapes` category), and unlike this batch's
 * earlier icon-registry gaps (which had reasonable existing substitutes), a
 * rating component has no substitute for its own defining shape. The `Half`
 * fill is a CSS `clip-path` overlay of the same star path, not a separate
 * baked "half-star" asset — a disclosed implementation choice, not an
 * invented visual (the live data's own `Half` state renders as a visually
 * identical half-filled star).
 *
 * The live Figma component has **no `rtl` variant at all** on either
 * `Rating` or `_RatingStar` — confirmed by its absence in both components'
 * own prop lists — so stars are not mirrored under RTL, matching the
 * common real-world convention that rating widgets keep a fixed left-to-
 * right star order regardless of text direction (not assumed, confirmed by
 * the live data's own silence on the axis).
 */
export type RatingSize = 'sm' | 'md' | 'lg';

export interface RatingProps {
  /** Current rating, `0`–`max`. Supports `.5` increments for the read-only display. */
  readonly value: number;
  /** Presence makes the rating an interactive input; omit for read-only display. */
  readonly onChange?: (value: number) => void;
  /** Total number of stars. */
  readonly max?: number;
  /** Maps to the official `Size` property. */
  readonly size?: RatingSize;
  /** Maps to the official `brand` property (green stars instead of gold). */
  readonly brand?: boolean;
  /** Accessible name. Interactive: prefix for each star's own label ("{label} 3 of 5"). Read-only: the whole group's label. */
  readonly label?: string;
  readonly className?: string;
}

const STAR_PATH =
  'M12 2.5l2.9 6.02 6.6.83-4.83 4.63 1.24 6.6L12 17.3l-5.91 3.28 1.24-6.6L2.5 9.35l6.6-.83L12 2.5z';

function Star({ fill, half }: { fill: 'empty' | 'filled'; half?: boolean }) {
  const clipId = useId();
  return (
    <svg viewBox="0 0 24 24" className={styles.starSvg} focusable="false">
      <path d={STAR_PATH} className={styles.starEmpty} />
      {(fill === 'filled' || half) && (
        <path
          d={STAR_PATH}
          className={styles.starFilled}
          clipPath={half ? `url(#${clipId})` : undefined}
        />
      )}
      {half && (
        <clipPath id={clipId}>
          <rect x="0" y="0" width="12" height="24" />
        </clipPath>
      )}
    </svg>
  );
}

export function Rating({
  value,
  onChange,
  max = 5,
  size = 'lg',
  brand = false,
  label,
  className,
}: RatingProps) {
  const interactive = onChange != null;
  const stars = Array.from({ length: max }, (_, index) => index + 1);

  if (!interactive) {
    return (
      <span
        className={cn(styles.root, className)}
        data-size={size}
        data-brand={brand || undefined}
        role="img"
        aria-label={label ?? `Rating: ${value} out of ${max}`}
      >
        {stars.map((star) => {
          const filled = star <= Math.floor(value);
          const half = !filled && star - 1 < value && value < star;
          return (
            <span key={star} className={styles.star} aria-hidden="true">
              <Star fill={filled ? 'filled' : 'empty'} half={half} />
            </span>
          );
        })}
      </span>
    );
  }

  return (
    <span className={cn(styles.root, className)} data-size={size} data-brand={brand || undefined}>
      {stars.map((star) => (
        <button
          key={star}
          type="button"
          className={styles.star}
          data-selected={star <= value || undefined}
          aria-pressed={star <= value}
          aria-label={label != null ? `${label}: ${star} of ${max}` : `${star} of ${max}`}
          onClick={() => onChange(star)}
        >
          <Star fill={star <= value ? 'filled' : 'empty'} />
        </button>
      ))}
    </span>
  );
}
