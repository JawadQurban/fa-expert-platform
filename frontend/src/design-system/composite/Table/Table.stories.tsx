import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Link, Tag } from '@ds/primitives';
import { EmptyState } from '../EmptyState/EmptyState';
import { ErrorState } from '../ErrorState/ErrorState';
import { Loading } from '../Loading/Loading';
import { Table } from './Table';
import type { TableColumn, TableSortDirection } from './Table';

/**
 * Decorative status-dot glyph for the "status text + dot" cell (Figma's `StatusTag`
 * sub-part). No dot/circle indicator icon exists in the Icon registry yet (same
 * icon-pipeline gap already documented for other components) — approximated with a
 * minimal inline SVG, matching the established precedent (e.g. `Checkbox`'s own inline
 * checkmark path). Fixture-only: this lives in the story, not in `Table` itself.
 */
function StatusDot({ color }: { readonly color: string }) {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true" focusable="false">
      <circle cx="5" cy="5" r="5" fill={color} />
    </svg>
  );
}

/**
 * Decorative filter-funnel glyph for the Figma header's icon-only filter cell
 * (`Table Header Cell - Filter`, registry row still `status: "Missing"` — no resolved
 * node/icon asset yet). Approximated the same way, fixture-only.
 */
function FilterGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path
        d="M2 3h12l-4.5 5.5V13l-3 1.5V8.5L2 3Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Decorative trailing action-arrow glyph for the row's "Action buttons" cell
 * (no arrow icon exists in the Icon registry yet — same gap already documented for
 * `Pagination`'s Previous/Next chevrons). Fixture-only.
 */
function ActionArrowGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path
        d="M6 3.5L10.5 8L6 12.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface Request {
  readonly id: string;
  readonly title: string;
  readonly status: 'مقبول' | 'مرسل' | 'مرفوض';
}

const allRows: Request[] = [
  { id: 'r1', title: 'فكرة الدفع الرقمي', status: 'مقبول' },
  { id: 'r2', title: 'فكرة التحقق الآلي', status: 'مرسل' },
  { id: 'r3', title: 'فكرة تحليل المخاطر', status: 'مرفوض' },
];

const statusTone: Record<Request['status'], 'success' | 'information' | 'error'> = {
  مقبول: 'success',
  مرسل: 'information',
  مرفوض: 'error',
};

const columns: Array<TableColumn<Request>> = [
  { key: 'title', header: 'العنوان', render: (row) => row.title },
  {
    key: 'status',
    header: 'الحالة',
    sortable: true,
    render: (row) => <Tag variant={statusTone[row.status]}>{row.status}</Tag>,
  },
];

const meta = {
  title: 'Composite/Table',
  component: Table<Request>,
  parameters: {
    docs: {
      description: {
        component:
          'Verified live against the official Platforms Code Figma Table component set (`docs/FIGMA_TABLE_SPECIFICATION.md`, node `5698:40875` — 16 variants: rtl × alternatingRows × compact × contained). DGA CMP-27. Semantic `<table>` with required `caption` + `scope="col"` headers; sortable columns expose `aria-sort`; selection composes the Approved `Checkbox` primitive; loading/error/empty are slots composing the Approved `Loading`/`ErrorState`/`EmptyState` composites rather than new visual designs.',
      },
    },
  },
  args: {
    columns,
    rows: allRows,
    getRowId: (row: Request) => row.id,
    caption: 'قائمة الطلبات',
  },
} satisfies Meta<typeof Table<Request>>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/**
 * Reproduces the official Platforms Code Figma **Table** canonical sample
 * (node `5698:40875`, `RTL=True, Alternating=False, Compact=False, Contained=False`)
 * as closely as the current public `Table` API allows — see
 * `reports/TABLE_STORYBOOK_FIDELITY_REPORT.md` for the full column-by-column
 * comparison. All 9 of the live sample's columns are reproduced through existing
 * `Table` props/slots and composition of already-Approved primitives
 * (`Checkbox` via `selectable`, `Link`, `Tag`) — **no `Table` implementation change
 * was needed**; this is a Storybook-fixture-only correction. Column labels use
 * realistic Arabic content (this repo's established fixture convention for every
 * other story) rather than Figma's literal English placeholder text
 * ("Header"/"Link"/"Tag"/"Cell") — a fixture-content choice, not a visual-fidelity
 * gap, disclosed in the fidelity report §1.
 */
interface FigmaReferenceRow {
  readonly id: string;
  readonly link: string;
  readonly owner: string;
  readonly date: string;
  readonly amount: string;
  readonly category: string;
  readonly status: 'نشط' | 'متوقف';
  readonly note: string;
}

const figmaReferenceRows: FigmaReferenceRow[] = [
  {
    id: 'row-1',
    link: 'فكرة الدفع الرقمي',
    owner: 'سارة العتيبي',
    date: '2026-07-01',
    amount: '12,000 ريال',
    category: 'تصنيف',
    status: 'نشط',
    note: 'خلية الابتكار',
  },
  {
    id: 'row-2',
    link: 'فكرة التحقق الآلي',
    owner: 'محمد القحطاني',
    date: '2026-07-05',
    amount: '8,500 ريال',
    category: 'تصنيف',
    status: 'متوقف',
    note: 'خلية الابتكار',
  },
  {
    id: 'row-3',
    link: 'فكرة تحليل المخاطر',
    owner: 'نورة الشمري',
    date: '2026-07-09',
    amount: '15,200 ريال',
    category: 'تصنيف',
    status: 'نشط',
    note: 'خلية الابتكار',
  },
];

const figmaReferenceColumns: Array<TableColumn<FigmaReferenceRow>> = [
  { key: 'link', header: 'الرابط', render: (row) => <Link mood="primary">{row.link}</Link> },
  { key: 'owner', header: 'المالك', render: (row) => row.owner },
  { key: 'date', header: 'التاريخ', render: (row) => row.date },
  { key: 'amount', header: 'المبلغ', render: (row) => row.amount },
  {
    key: 'category',
    header: 'التصنيف',
    render: (row) => (
      <Tag variant="neutral" size="sm">
        {row.category}
      </Tag>
    ),
  },
  {
    key: 'status',
    header: 'الحالة',
    render: (row) => (
      <Tag
        variant="neutral"
        size="sm"
        rounded
        iconStart={<StatusDot color={row.status === 'نشط' ? '#1b8354' : '#9da4ae'} />}
      >
        {row.status}
      </Tag>
    ),
  },
  { key: 'note', header: 'ملاحظة', render: (row) => row.note },
  {
    key: 'action',
    header: (
      <span
        aria-hidden="true"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          inlineSize: '20px',
          blockSize: '20px',
          borderRadius: '4px',
          background: '#f3f4f6',
        }}
      >
        <FilterGlyph />
      </span>
    ),
    align: 'end',
    render: () => (
      <button
        type="button"
        aria-label="فتح إجراءات الصف"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          inlineSize: '32px',
          blockSize: '32px',
          borderRadius: '4px',
          border: 0,
          background: 'transparent',
          cursor: 'pointer',
        }}
      >
        <ActionArrowGlyph />
      </button>
    ),
  },
];

function OfficialFigmaReferenceDemo() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  return (
    <div dir="rtl">
      <Table
        columns={figmaReferenceColumns}
        rows={figmaReferenceRows}
        getRowId={(row: FigmaReferenceRow) => row.id}
        caption="مرجع الجدول الرسمي (Figma)"
        selectable
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        selectAllLabel="تحديد الكل"
        selectRowLabel={(row: FigmaReferenceRow) => `تحديد ${row.link}`}
      />
    </div>
  );
}

export const OfficialFigmaReference: StoryObj = {
  render: () => <OfficialFigmaReferenceDemo />,
};

export const Compact: Story = { args: { density: 'compact' } };

export const Contained: Story = { args: { contained: true } };

export const AlternatingRows: Story = { args: { alternatingRows: true } };

export const StickyHeader: Story = {
  args: { stickyHeader: true },
  decorators: [
    (Story) => (
      <div style={{ maxBlockSize: '160px', overflowY: 'auto' }}>
        <Story />
      </div>
    ),
  ],
};

export const Sortable: Story = {
  render: (args) => {
    function Demo() {
      const [sortDirection, setSortDirection] = useState<TableSortDirection>('ascending');
      const sorted = [...allRows].sort((a, b) =>
        sortDirection === 'ascending'
          ? a.status.localeCompare(b.status)
          : b.status.localeCompare(a.status)
      );
      return (
        <Table
          {...args}
          rows={sorted}
          sortColumn="status"
          sortDirection={sortDirection}
          onSortChange={(_, direction) => setSortDirection(direction)}
        />
      );
    }
    return <Demo />;
  },
};

export const Selectable: Story = {
  render: (args) => {
    function Demo() {
      const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(['r2']));
      return (
        <Table
          {...args}
          selectable
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          selectAllLabel="تحديد الكل"
          selectRowLabel={(row) => `تحديد ${row.title}`}
        />
      );
    }
    return <Demo />;
  },
};

export const LoadingState: Story = {
  args: {
    loading: true,
    loadingState: <Loading label="جارٍ التحميل" />,
  },
};

export const Error: Story = {
  args: {
    errorState: <ErrorState description="تعذر تحميل الطلبات." />,
  },
};

export const Empty: Story = {
  args: {
    rows: [],
    emptyState: <EmptyState title="لا توجد طلبات" description="لم يتم تقديم أي ابتكار بعد." />,
  },
};

export const WithFooter: Story = {
  args: { footer: 'إجمالي 3 طلبات' },
};

export const RTL: Story = {
  render: (args) => (
    <div dir="rtl">
      <Table {...args} />
    </div>
  ),
};
