import { Button, SearchBox } from '@ds/primitives';
import {
  DEFAULT_DIRECTORY_FILTERS,
  hasActiveDirectoryFilters,
  type DirectoryFilters,
} from '../directory.types';
import type { DirectoryContent } from '../directory.content';
import styles from './DirectoryFilterBar.module.css';

/**
 * P-11 Filter Bar (public variant, `05` EH-PUB-02 §7) — free-text `SearchBox`
 * (P-12), with an explicit "clear" whenever the search is active.
 *
 * ⚠️ The specialty chip rail is gone: no taxonomy maps a trainer onto a
 * specialty (`Q16`), so every chip answered «nobody» and the API now refuses the
 * filter with 400. A filter that predictably returns a wrong result is not
 * offered.
 *
 * Reusable by construction: renders from the shared filter-state shape and emits
 * the next state — no page logic inside.
 */
export function DirectoryFilterBar({
  content,
  filters,
  onFiltersChange,
}: {
  readonly content: DirectoryContent;
  readonly filters: DirectoryFilters;
  readonly onFiltersChange: (next: DirectoryFilters) => void;
}) {
  return (
    <div className={styles.bar} role="search" aria-label={content.filters.regionLabel}>
      <div className={styles.searchRow}>
        <div className={styles.search}>
          <SearchBox
            label={content.filters.searchLabel}
            placeholder={content.filters.searchPlaceholder}
            size="md"
            value={filters.search}
            onChange={(event) => onFiltersChange({ ...filters, search: event.target.value })}
          />
        </div>
        {hasActiveDirectoryFilters(filters) && (
          <div className={styles.clear}>
            <Button
              variant="tertiary"
              size="sm"
              onClick={() => onFiltersChange(DEFAULT_DIRECTORY_FILTERS)}
            >
              {content.filters.clear}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
