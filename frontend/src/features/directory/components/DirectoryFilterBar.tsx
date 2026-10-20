import { Button, SearchBox, Select } from '@ds/primitives';
import {
  DEFAULT_DIRECTORY_FILTERS,
  hasActiveDirectoryFilters,
  type DirectoryFilters,
} from '../directory.types';
import type { DirectoryContent } from '../directory.content';
import { SPECIALIZATION_DOMAIN_OPTIONS } from '../../../shared/content/specializationDomains';
import { activeDomains } from '../../../shared/content/domainCatalogueStatus';
import styles from './DirectoryFilterBar.module.css';

/**
 * P-11 Filter Bar (public variant, `05` EH-PUB-02 §7) — free-text `SearchBox`
 * (P-12) and the specialty `Select`, with an explicit "clear" whenever either
 * is active.
 *
 * RUN-031 — the specialty is the trainer's declared «المجال», so the options
 * are the owner's domain list the application offers.
 *
 * Reusable by construction: renders from the shared filter-state shape and emits
 * the next state — no page logic inside.
 */
const ALL = 'all';

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
        <div className={styles.search}>
          <Select
            label={content.filters.specialtyLabel}
            value={filters.specialty === '' ? ALL : filters.specialty}
            onValueChange={(value) =>
              onFiltersChange({ ...filters, specialty: value === ALL ? '' : value })
            }
            options={[
              { value: ALL, label: content.filters.allSpecialties },
              ...activeDomains(SPECIALIZATION_DOMAIN_OPTIONS).map((option) => ({
                value: option.value,
                label: content.specialties[option.value] ?? option.value,
              })),
            ]}
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
