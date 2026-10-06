import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, expectNoA11yViolations } from '@/test/test-utils';
import { Table } from './Table';
import type { TableColumn } from './Table';
import styles from './Table.module.css';

interface Request {
  readonly id: string;
  readonly title: string;
  readonly status: string;
}

const rows: Request[] = [
  { id: 'r1', title: 'فكرة الدفع الرقمي', status: 'مقبول' },
  { id: 'r2', title: 'فكرة التحقق الآلي', status: 'مرسل' },
];

const columns: Array<TableColumn<Request>> = [
  { key: 'title', header: 'العنوان', render: (row) => row.title },
  { key: 'status', header: 'الحالة', render: (row) => row.status, sortable: true },
];

describe('Table', () => {
  it('renders a caption and column headers with scope="col"', () => {
    renderWithProviders(
      <Table columns={columns} rows={rows} getRowId={(r) => r.id} caption="قائمة الطلبات" />
    );
    expect(screen.getByText('قائمة الطلبات').tagName).toBe('CAPTION');
    expect(screen.getByRole('columnheader', { name: 'العنوان' })).toHaveAttribute('scope', 'col');
  });

  it('renders every row via the column render function', () => {
    renderWithProviders(
      <Table columns={columns} rows={rows} getRowId={(r) => r.id} caption="قائمة الطلبات" />
    );
    expect(screen.getByText('فكرة الدفع الرقمي')).toBeInTheDocument();
    expect(screen.getByText('مقبول')).toBeInTheDocument();
  });

  it('exposes aria-sort only on sortable columns and calls onSortChange', async () => {
    const onSortChange = vi.fn();
    const { user } = renderWithProviders(
      <Table
        columns={columns}
        rows={rows}
        getRowId={(r) => r.id}
        caption="قائمة الطلبات"
        onSortChange={onSortChange}
      />
    );
    expect(screen.getByRole('columnheader', { name: 'العنوان' })).not.toHaveAttribute('aria-sort');
    expect(screen.getByRole('columnheader', { name: 'الحالة' })).toHaveAttribute(
      'aria-sort',
      'none'
    );

    await user.click(screen.getByRole('button', { name: 'الحالة' }));
    expect(onSortChange).toHaveBeenCalledWith('status', 'ascending');
  });

  it('reflects the active sort direction via aria-sort', () => {
    renderWithProviders(
      <Table
        columns={columns}
        rows={rows}
        getRowId={(r) => r.id}
        caption="قائمة الطلبات"
        sortColumn="status"
        sortDirection="descending"
      />
    );
    expect(screen.getByRole('columnheader', { name: 'الحالة' })).toHaveAttribute(
      'aria-sort',
      'descending'
    );
  });

  it('renders the emptyState in place of rows when rows is empty', () => {
    renderWithProviders(
      <Table
        columns={columns}
        rows={[]}
        getRowId={(r) => r.id}
        caption="قائمة الطلبات"
        emptyState={<p>لا توجد طلبات</p>}
      />
    );
    expect(screen.getByText('لا توجد طلبات')).toBeInTheDocument();
    expect(screen.getAllByRole('row')).toHaveLength(2);
  });

  it('renders loadingState in place of rows when loading, taking precedence over errorState/emptyState', () => {
    renderWithProviders(
      <Table
        columns={columns}
        rows={rows}
        getRowId={(r) => r.id}
        caption="قائمة الطلبات"
        loading
        loadingState={<p>جارٍ التحميل</p>}
        errorState={<p>خطأ</p>}
      />
    );
    expect(screen.getByText('جارٍ التحميل')).toBeInTheDocument();
    expect(screen.queryByText('خطأ')).not.toBeInTheDocument();
    expect(screen.queryByText('فكرة الدفع الرقمي')).not.toBeInTheDocument();
  });

  it('renders errorState in place of rows when provided (and loading is false)', () => {
    renderWithProviders(
      <Table
        columns={columns}
        rows={rows}
        getRowId={(r) => r.id}
        caption="قائمة الطلبات"
        errorState={<p>تعذر التحميل</p>}
      />
    );
    expect(screen.getByText('تعذر التحميل')).toBeInTheDocument();
    expect(screen.queryByText('فكرة الدفع الرقمي')).not.toBeInTheDocument();
  });

  it('renders a compact-density table without altering row content', () => {
    renderWithProviders(
      <Table
        columns={columns}
        rows={rows}
        getRowId={(r) => r.id}
        caption="قائمة الطلبات"
        density="compact"
      />
    );
    expect(screen.getByRole('table')).toHaveAttribute('data-density', 'compact');
  });

  it('renders a contained table with the wrapper border applied', () => {
    const { container } = renderWithProviders(
      <Table
        columns={columns}
        rows={rows}
        getRowId={(r) => r.id}
        caption="قائمة الطلبات"
        contained
      />
    );
    expect(container.querySelector('table')?.parentElement).toHaveClass(styles.contained);
  });

  it('renders the canonical Figma composition — arbitrary ReactNode headers/cells alongside a selection column (regression guard for the Storybook Official Figma Reference fixture)', () => {
    interface Row {
      readonly id: string;
      readonly link: string;
      readonly tag: string;
    }
    const canonicalRows: Row[] = [{ id: 'row-1', link: 'رابط', tag: 'تصنيف' }];
    const canonicalColumns: Array<TableColumn<Row>> = [
      {
        key: 'link',
        header: 'الرابط',
        render: (row) => <a href="https://example.com/idea">{row.link}</a>,
      },
      {
        key: 'tag',
        header: <span data-testid="custom-header">مخصص</span>,
        render: (row) => <span data-testid="custom-cell">{row.tag}</span>,
        align: 'end',
      },
    ];
    renderWithProviders(
      <Table
        columns={canonicalColumns}
        rows={canonicalRows}
        getRowId={(r) => r.id}
        caption="مرجع"
        selectable
        selectedIds={new Set()}
        onSelectionChange={vi.fn()}
      />
    );
    expect(screen.getByRole('checkbox', { name: 'Select all rows' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'رابط' })).toBeInTheDocument();
    expect(screen.getByTestId('custom-header')).toBeInTheDocument();
    expect(screen.getByTestId('custom-cell')).toHaveTextContent('تصنيف');
  });

  it('renders a footer row spanning all columns when footer is provided', () => {
    renderWithProviders(
      <Table
        columns={columns}
        rows={rows}
        getRowId={(r) => r.id}
        caption="قائمة الطلبات"
        footer="إجمالي طلبين"
      />
    );
    const footerCell = screen.getByText('إجمالي طلبين');
    expect(footerCell.closest('td')).toHaveAttribute('colspan', '2');
  });

  describe('selection', () => {
    it('renders a leading checkbox column and toggles a single row', async () => {
      const onSelectionChange = vi.fn();
      const { user } = renderWithProviders(
        <Table
          columns={columns}
          rows={rows}
          getRowId={(r) => r.id}
          caption="قائمة الطلبات"
          selectable
          selectedIds={new Set()}
          onSelectionChange={onSelectionChange}
          selectRowLabel={(row) => `Select ${row.title}`}
        />
      );
      await user.click(screen.getByRole('checkbox', { name: 'Select فكرة الدفع الرقمي' }));
      expect(onSelectionChange).toHaveBeenCalledWith(new Set(['r1']));
    });

    it('select-all checkbox selects/deselects every row and shows indeterminate for a partial selection', () => {
      const { rerender } = renderWithProviders(
        <Table
          columns={columns}
          rows={rows}
          getRowId={(r) => r.id}
          caption="قائمة الطلبات"
          selectable
          selectedIds={new Set(['r1'])}
          onSelectionChange={vi.fn()}
        />
      );
      const selectAll = screen.getByRole('checkbox', { name: 'Select all rows' });
      expect(selectAll).not.toBeChecked();
      expect((selectAll as HTMLInputElement).indeterminate).toBe(true);

      rerender(
        <Table
          columns={columns}
          rows={rows}
          getRowId={(r) => r.id}
          caption="قائمة الطلبات"
          selectable
          selectedIds={new Set(['r1', 'r2'])}
          onSelectionChange={vi.fn()}
        />
      );
      expect(screen.getByRole('checkbox', { name: 'Select all rows' })).toBeChecked();
    });

    it('marks a selected row with aria-selected', () => {
      renderWithProviders(
        <Table
          columns={columns}
          rows={rows}
          getRowId={(r) => r.id}
          caption="قائمة الطلبات"
          selectable
          selectedIds={new Set(['r1'])}
          onSelectionChange={vi.fn()}
        />
      );
      const row = screen.getByText('فكرة الدفع الرقمي').closest('tr');
      expect(row).toHaveAttribute('aria-selected', 'true');
    });

    it('clicking select-all toggles every row id via onSelectionChange', async () => {
      const onSelectionChange = vi.fn();
      const { user } = renderWithProviders(
        <Table
          columns={columns}
          rows={rows}
          getRowId={(r) => r.id}
          caption="قائمة الطلبات"
          selectable
          selectedIds={new Set()}
          onSelectionChange={onSelectionChange}
        />
      );
      await user.click(screen.getByRole('checkbox', { name: 'Select all rows' }));
      expect(onSelectionChange).toHaveBeenCalledWith(new Set(['r1', 'r2']));
    });
  });

  it('renders correctly under RTL', () => {
    renderWithProviders(
      <div dir="rtl">
        <Table columns={columns} rows={rows} getRowId={(r) => r.id} caption="قائمة الطلبات" />
      </div>
    );
    expect(screen.getByText('قائمة الطلبات').tagName).toBe('CAPTION');
  });

  it('has no accessibility violations', async () => {
    const { container } = renderWithProviders(
      <Table columns={columns} rows={rows} getRowId={(r) => r.id} caption="قائمة الطلبات" />
    );
    await expectNoA11yViolations(container);
  });

  it('has no accessibility violations when selectable', async () => {
    const { container } = renderWithProviders(
      <Table
        columns={columns}
        rows={rows}
        getRowId={(r) => r.id}
        caption="قائمة الطلبات"
        selectable
        selectedIds={new Set()}
        onSelectionChange={vi.fn()}
      />
    );
    await expectNoA11yViolations(container);
  });

  it('has no accessibility violations when empty', async () => {
    const { container } = renderWithProviders(
      <Table
        columns={columns}
        rows={[]}
        getRowId={(r) => r.id}
        caption="قائمة الطلبات"
        emptyState={<p>لا توجد طلبات</p>}
      />
    );
    await expectNoA11yViolations(container);
  });
});
