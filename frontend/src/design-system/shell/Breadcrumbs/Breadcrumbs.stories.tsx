import type { Meta, StoryObj } from '@storybook/react';
import { Breadcrumbs } from './Breadcrumbs';

const meta = {
  title: 'Shell/Breadcrumbs',
  component: Breadcrumbs,
  parameters: {
    docs: {
      description: {
        component:
          'Verified live against the official Platforms Code Figma Breadcrumb component set (`docs/FIGMA_BREADCRUMB_SPECIFICATION.md`). DGA CMP-04. Ancestor items compose the official `Link` primitive (`mood="neutral"`); the current page is non-interactive text with `aria-current="page"` — never a disabled link. More than 5 items collapse to a clickable "…" (see the `ManyLevels` story).',
      },
    },
  },
  args: {
    label: 'مسار التصفح',
    items: [
      { label: 'الرئيسية', href: '/' },
      { label: 'الطلبات', href: '/requests' },
      { label: 'تفاصيل الطلب' },
    ],
  },
} satisfies Meta<typeof Breadcrumbs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const TwoLevels: Story = {
  args: { items: [{ label: 'الرئيسية', href: '/' }, { label: 'الأسئلة الشائعة' }] },
};

export const FourLevels: Story = {
  args: {
    items: [
      { label: 'الرئيسية', href: '/' },
      { label: 'الابتكار', href: '/innovation' },
      { label: 'الطلبات', href: '/requests' },
      { label: 'تفاصيل الطلب' },
    ],
  },
};

// Official Figma "Levels=>5" — collapses to [first, "…", last two]. Click the "…" to
// expand in place (spec §5 — the exact interaction isn't shown in Figma; this is the
// disclosed, non-blocking judgment call documented in the compliance report).
export const ManyLevels: Story = {
  args: {
    items: [
      { label: 'الرئيسية', href: '/' },
      { label: 'المستوى 1', href: '/l1' },
      { label: 'المستوى 2', href: '/l2' },
      { label: 'المستوى 3', href: '/l3' },
      { label: 'المستوى 4', href: '/l4' },
      { label: 'تفاصيل الطلب' },
    ],
  },
};

export const RTL: Story = {
  render: (args) => (
    <div dir="rtl">
      <Breadcrumbs {...args} />
    </div>
  ),
};

export const RTLManyLevels: Story = {
  render: () => (
    <div dir="rtl">
      <Breadcrumbs
        label="مسار التصفح"
        items={[
          { label: 'الرئيسية', href: '/' },
          { label: 'المستوى 1', href: '/l1' },
          { label: 'المستوى 2', href: '/l2' },
          { label: 'المستوى 3', href: '/l3' },
          { label: 'المستوى 4', href: '/l4' },
          { label: 'تفاصيل الطلب' },
        ]}
      />
    </div>
  ),
};
