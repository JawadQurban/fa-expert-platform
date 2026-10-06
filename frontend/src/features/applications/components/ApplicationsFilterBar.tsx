import { Button, SearchBox, Select } from '@ds/primitives';
import type { SelectOption } from '@ds/primitives';
import {
  APPLICATION_SERVICES,
  APPLICATION_STATUSES,
  DEFAULT_APPLICATIONS_FILTERS,
  hasActiveFilters,
  type ApplicationsFilters,
} from '../application.types';
import type { MyApplicationsContent } from '../myApplications.content';
import styles from './ApplicationsFilterBar.module.css';

/**
 * P-11 Filter Bar (`05` §0.13) — the approved filtering pattern: `SearchBox` +
 * `Select` controls above the list (never in-table header controls, which are a
 * Missing DS component, `G15`). Filtering updates the list region without
 * navigation; an explicit "clear filters" action appears whenever any filter is
 * active. Search is scoped to the page's data set (`05` §0.12) — the reference
 * number, per the documented list fields.
 *
 * Reusable by construction: it renders from the shared filter-state shape and
 * emits the next state — no page logic inside.
 */

export function ApplicationsFilterBar({
  content,
  filters,
  onFiltersChange,
}: {
  readonly content: MyApplicationsContent;
  readonly filters: ApplicationsFilters;
  readonly onFiltersChange: (next: ApplicationsFilters) => void;
}) {
  const statusOptions: SelectOption[] = [
    { value: 'all', label: content.filters.allOption },
    ...APPLICATION_STATUSES.map((status) => ({
      value: status,
      label: content.statuses[status],
    })),
  ];

  const serviceOptions: SelectOption[] = [
    { value: 'all', label: content.filters.allOption },
    ...APPLICATION_SERVICES.map((service) => ({
      value: service,
      label: content.services[service],
    })),
  ];

  return (
    <div className={styles.bar} role="search" aria-label={content.filters.regionLabel}>
      <div className={styles.search}>
        <SearchBox
          label={content.filters.searchLabel}
          placeholder={content.filters.searchPlaceholder}
          size="md"
          value={filters.search}
          onChange={(event) => onFiltersChange({ ...filters, search: event.target.value })}
        />
      </div>
      <div className={styles.select}>
        <Select
          label={content.filters.statusLabel}
          size="md"
          options={statusOptions}
          value={filters.status}
          onValueChange={(value) =>
            onFiltersChange({ ...filters, status: value as ApplicationsFilters['status'] })
          }
        />
      </div>
      <div className={styles.select}>
        <Select
          label={content.filters.serviceLabel}
          size="md"
          options={serviceOptions}
          value={filters.service}
          onValueChange={(value) =>
            onFiltersChange({ ...filters, service: value as ApplicationsFilters['service'] })
          }
        />
      </div>
      {hasActiveFilters(filters) && (
        <div className={styles.clear}>
          <Button
            variant="tertiary"
            size="sm"
            onClick={() => onFiltersChange(DEFAULT_APPLICATIONS_FILTERS)}
          >
            {content.actions.clearFilters}
          </Button>
        </div>
      )}
    </div>
  );
}
