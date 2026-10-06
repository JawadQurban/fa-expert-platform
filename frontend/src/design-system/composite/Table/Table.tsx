import type { ReactNode } from 'react';
import { cn } from '@utils/cn';
import { Checkbox } from '@ds/primitives';
import styles from './Table.module.css';

/**
 * Table (FADS composite — DGA CMP-27).
 *
 * Verified live against the official Platforms Code Figma **Table** component set
 * (file `J0xq7JG3JKshRDzrgAM7E0`, node `5698:40875` — 16 variants: `rtl` ×
 * `alternatingRows` × `compact` × `contained`) via the Figma MCP — see
 * `docs/FIGMA_TABLE_SPECIFICATION.md` and
 * `reports/VISUAL_COMPLIANCE/Table/VISUAL_COMPLIANCE_TABLE.md`.
 *
 * The official library treats Table Row / Table Header / Table Row Cell /
 * Table Header Cell as separate composable sub-parts; this component bundles
 * all of it inline (same architecture decision as the pre-existing
 * implementation — not a rebuild, an extension). The dedicated Sort/Filter
 * header-cell sub-variants remain unresolved in Figma (registry: `Table
 * Header Cell - Sort` / `- Filter` are both `status: "Missing"`) — sortable
 * columns keep their existing functional `aria-sort` + keyboard-operable
 * header button (a WCAG requirement independent of any visual icon), but no
 * sort/filter icon glyph is invented.
 *
 * Semantic `<table>` with a required `caption` and `scope="col"` headers
 * (COMPONENT_INVENTORY.md a11y contract). `render` is required per column —
 * the component never reads row properties by key, so it stays fully
 * type-safe with no unsafe indexing/casts. Selection (`selectable`) adds a
 * leading checkbox column composing the already-Approved `Checkbox`
 * primitive, matching the official row's own leading checkbox cell.
 * `loadingState`/`errorState`/`emptyState` are slots (not new visual
 * designs) — Figma's Table node defines no loading/error visual state of its
 * own, so these compose the already-approved `Loading`/`ErrorState`/
 * `EmptyState` composites rather than inventing new ones (precedence:
 * loading → error → empty → rows). `footer` is a FADS-authored extension
 * (no official footer variant exists) built only from already-verified
 * header/border tokens — flagged Needs Confirmation, not a new design.
 */
export type TableAlign = 'start' | 'center' | 'end';
export type TableSortDirection = 'ascending' | 'descending';
export type TableDensity = 'standard' | 'compact';

export interface TableColumn<T> {
  readonly key: string;
  readonly header: ReactNode;
  readonly render: (row: T) => ReactNode;
  readonly sortable?: boolean;
  readonly align?: TableAlign;
}

export interface TableProps<T> {
  readonly columns: Array<TableColumn<T>>;
  readonly rows: T[];
  readonly getRowId: (row: T) => string;
  readonly caption: ReactNode;
  /** Visually hides the caption while keeping it in the accessibility tree. */
  readonly captionHidden?: boolean;
  readonly sortColumn?: string;
  readonly sortDirection?: TableSortDirection;
  readonly onSortChange?: (columnKey: string, direction: TableSortDirection) => void;
  /** Maps to the official `Compact` property. */
  readonly density?: TableDensity;
  /** Maps to the official `Contained` property (1px border + rounded corners). */
  readonly contained?: boolean;
  /** Maps to the official `Alternating rows` property. */
  readonly alternatingRows?: boolean;
  /** Keeps the header visible while the row body scrolls (behavioral only — no new visual design). */
  readonly stickyHeader?: boolean;
  /** Adds the official leading checkbox column for row selection. */
  readonly selectable?: boolean;
  readonly selectedIds?: ReadonlySet<string>;
  readonly onSelectionChange?: (ids: Set<string>) => void;
  /** Accessible label for the header "select all" checkbox. Defaults to English; pass a localized string. */
  readonly selectAllLabel?: string;
  /** Accessible label for each row's checkbox. Defaults to English; pass a localized string. */
  readonly selectRowLabel?: (row: T) => string;
  readonly loading?: boolean;
  readonly loadingState?: ReactNode;
  readonly errorState?: ReactNode;
  readonly emptyState?: ReactNode;
  /** FADS-authored extension — no official Figma footer variant (Needs Confirmation, spec §5). */
  readonly footer?: ReactNode;
  readonly className?: string;
}

export function Table<T>({
  columns,
  rows,
  getRowId,
  caption,
  captionHidden = false,
  sortColumn,
  sortDirection,
  onSortChange,
  density = 'standard',
  contained = false,
  alternatingRows = false,
  stickyHeader = false,
  selectable = false,
  selectedIds,
  onSelectionChange,
  selectAllLabel = 'Select all rows',
  selectRowLabel = () => 'Select row',
  loading = false,
  loadingState,
  errorState,
  emptyState,
  footer,
  className,
}: TableProps<T>) {
  const selected = selectedIds ?? new Set<string>();
  const rowIds = rows.map((row) => getRowId(row));
  const selectedCount = rowIds.filter((id) => selected.has(id)).length;
  const allSelected = rows.length > 0 && selectedCount === rows.length;
  const someSelected = selectedCount > 0 && !allSelected;

  const toggleAll = () => {
    if (!onSelectionChange) return;
    onSelectionChange(allSelected ? new Set() : new Set(rowIds));
  };

  const toggleRow = (id: string) => {
    if (!onSelectionChange) return;
    const next = new Set(selected);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    onSelectionChange(next);
  };

  const showLoading = loading;
  const showError = !showLoading && errorState != null;
  const showEmpty = !showLoading && !showError && rows.length === 0 && emptyState != null;
  const showRows = !showLoading && !showError && !showEmpty;

  return (
    <div className={cn(styles.scrollContainer, contained && styles.contained)}>
      <table
        className={cn(styles.table, className)}
        data-density={density}
        data-alternating={alternatingRows || undefined}
      >
        <caption className={cn(styles.caption, captionHidden && 'fads-visually-hidden')}>
          {caption}
        </caption>
        <thead className={cn(stickyHeader && styles.stickyHeader)}>
          <tr>
            {selectable && (
              <th scope="col" className={styles.selectCell}>
                <Checkbox
                  label={<span className="fads-visually-hidden">{selectAllLabel}</span>}
                  size="sm"
                  checked={allSelected}
                  indeterminate={someSelected}
                  onChange={toggleAll}
                  disabled={rows.length === 0}
                />
              </th>
            )}
            {columns.map((column) => {
              const isSorted = column.sortable && sortColumn === column.key;
              const ariaSort = column.sortable ? (isSorted ? sortDirection : 'none') : undefined;

              return (
                <th key={column.key} scope="col" data-align={column.align} aria-sort={ariaSort}>
                  {column.sortable ? (
                    <button
                      type="button"
                      className={styles.sortButton}
                      onClick={() =>
                        onSortChange?.(
                          column.key,
                          isSorted && sortDirection === 'ascending' ? 'descending' : 'ascending'
                        )
                      }
                    >
                      {column.header}
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {showLoading && (
            <tr>
              <td colSpan={columns.length + (selectable ? 1 : 0)} className={styles.stateCell}>
                {loadingState}
              </td>
            </tr>
          )}
          {showError && (
            <tr>
              <td colSpan={columns.length + (selectable ? 1 : 0)} className={styles.stateCell}>
                {errorState}
              </td>
            </tr>
          )}
          {showEmpty && (
            <tr>
              <td colSpan={columns.length + (selectable ? 1 : 0)} className={styles.stateCell}>
                {emptyState}
              </td>
            </tr>
          )}
          {showRows &&
            rows.map((row) => {
              const id = getRowId(row);
              const isSelected = selected.has(id);
              return (
                <tr key={id} data-selected={isSelected || undefined} aria-selected={isSelected}>
                  {selectable && (
                    <td className={styles.selectCell}>
                      <Checkbox
                        label={<span className="fads-visually-hidden">{selectRowLabel(row)}</span>}
                        size="sm"
                        checked={isSelected}
                        onChange={() => toggleRow(id)}
                      />
                    </td>
                  )}
                  {columns.map((column) => (
                    <td key={column.key} data-align={column.align}>
                      {column.render(row)}
                    </td>
                  ))}
                </tr>
              );
            })}
        </tbody>
        {footer != null && (
          <tfoot>
            <tr>
              <td colSpan={columns.length + (selectable ? 1 : 0)} className={styles.footerCell}>
                {footer}
              </td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}
