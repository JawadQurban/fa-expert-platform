import { cn } from '@utils/cn';
import styles from './Pagination.module.css';

/**
 * Pagination (FADS composite — DGA CMP-28).
 *
 * Verified live against the official Platforms Code Figma **Pagination** component set
 * (file `J0xq7JG3JKshRDzrgAM7E0`, node `7936:8133` — 6 variants: `rtl` × `size`
 * [Large/Medium/Small]) via the Figma MCP — see `docs/FIGMA_PAGINATION_SPECIFICATION.md`
 * and `reports/VISUAL_COMPLIANCE/Pagination/VISUAL_COMPLIANCE_PAGINATION.md`.
 *
 * `nav` landmark, `aria-current="page"` on the current page (COMPONENT_INVENTORY.md
 * a11y contract). Renders a windowed page list (first, last, current ±1) with a
 * non-interactive bordered "…" item for gaps, matching the official `overflow`
 * item exactly. Previous/Next are **icon-only** buttons (live Figma has no visible
 * text label on them at all) — the caller-supplied `previousLabel`/`nextLabel`
 * become the buttons' `aria-label` instead of visible text. The arrow-left-01/
 * arrow-right-01 icons aren't in this project's Icon registry yet (same
 * icon-pipeline gap as every other approved component); approximated with a
 * CSS-drawn chevron, mirrored under RTL via `:dir(rtl)` (the same technique
 * `Icon`'s own `data-mirror-rtl` uses) rather than hand-authoring a second glyph.
 */
export type PaginationSize = 'sm' | 'md' | 'lg';

export interface PaginationProps {
  /** 1-based current page. */
  readonly page: number;
  readonly pageCount: number;
  readonly onPageChange: (page: number) => void;
  /** Accessible label for the `<nav>` landmark. Defaults to English; pass a localized string. */
  readonly label?: string;
  /** Accessible label for the Previous button (icon-only — no visible text). Defaults to English. */
  readonly previousLabel?: string;
  /** Accessible label for the Next button (icon-only — no visible text). Defaults to English. */
  readonly nextLabel?: string;
  /** Maps to the official `Size` property. */
  readonly size?: PaginationSize;
  readonly className?: string;
}

function buildPageList(page: number, pageCount: number): Array<number | 'ellipsis'> {
  const pages = new Set<number>([1, pageCount, page - 1, page, page + 1]);
  const sorted = [...pages]
    .filter((candidate) => candidate >= 1 && candidate <= pageCount)
    .sort((a, b) => a - b);

  const result: Array<number | 'ellipsis'> = [];
  sorted.forEach((current, index) => {
    const previous = sorted[index - 1];
    if (previous !== undefined && current - previous > 1) {
      result.push('ellipsis');
    }
    result.push(current);
  });
  return result;
}

export function Pagination({
  page,
  pageCount,
  onPageChange,
  label = 'Pagination',
  previousLabel = 'Previous',
  nextLabel = 'Next',
  size = 'md',
  className,
}: PaginationProps) {
  const safePageCount = Math.max(1, pageCount);
  const safePage = Math.min(Math.max(1, page), safePageCount);
  const pages = buildPageList(safePage, safePageCount);

  return (
    <nav aria-label={label} className={cn(styles.pagination, className)}>
      <ul className={styles.list} data-size={size}>
        <li>
          <button
            type="button"
            className={styles.control}
            aria-label={previousLabel}
            onClick={() => onPageChange(safePage - 1)}
            disabled={safePage <= 1}
          >
            <span className={cn(styles.chevron, styles.chevronStart)} aria-hidden="true" />
          </button>
        </li>
        {pages.map((entry, index) =>
          entry === 'ellipsis' ? (
            <li key={`ellipsis-${index}`} className={styles.ellipsis} aria-hidden="true">
              &hellip;
            </li>
          ) : (
            <li key={entry}>
              <button
                type="button"
                className={styles.page}
                aria-current={entry === safePage ? 'page' : undefined}
                onClick={() => onPageChange(entry)}
              >
                {entry}
                {entry === safePage && <span className={styles.selector} aria-hidden="true" />}
              </button>
            </li>
          )
        )}
        <li>
          <button
            type="button"
            className={styles.control}
            aria-label={nextLabel}
            onClick={() => onPageChange(safePage + 1)}
            disabled={safePage >= safePageCount}
          >
            <span className={cn(styles.chevron, styles.chevronEnd)} aria-hidden="true" />
          </button>
        </li>
      </ul>
    </nav>
  );
}
