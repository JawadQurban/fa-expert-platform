import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Pagination } from './Pagination';

const meta = {
  title: 'Composite/Pagination',
  component: Pagination,
  parameters: {
    docs: {
      description: {
        component:
          'Verified live against the official Platforms Code Figma Pagination component set (`docs/FIGMA_PAGINATION_SPECIFICATION.md`, node `7936:8133` — 6 variants: rtl × size). DGA CMP-28. `nav` landmark, `aria-current="page"` on the current page (indicated by an underline, not a filled background); Previous/Next are icon-only buttons; distant pages collapse behind a non-interactive bordered "…" item.',
      },
    },
  },
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
  },
  args: {
    label: 'ترقيم الصفحات',
    previousLabel: 'السابق',
    nextLabel: 'التالي',
    pageCount: 10,
    page: 1,
    onPageChange: () => {},
  },
  render: (args) => {
    function Demo() {
      const [page, setPage] = useState(args.page);
      return <Pagination {...args} page={page} onPageChange={setPage} />;
    }
    return <Demo />;
  },
} satisfies Meta<typeof Pagination>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { page: 1 } };
export const MiddlePage: Story = { args: { page: 5 } };
export const LastPage: Story = { args: { page: 10 } };
export const FewPages: Story = { args: { page: 1, pageCount: 3 } };
export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <Pagination {...args} size="lg" page={5} onPageChange={() => {}} />
      <Pagination {...args} size="md" page={5} onPageChange={() => {}} />
      <Pagination {...args} size="sm" page={5} onPageChange={() => {}} />
    </div>
  ),
};
export const RTL: Story = {
  render: (args) => (
    <div dir="rtl">
      <Pagination {...args} page={5} onPageChange={() => {}} />
    </div>
  ),
};
