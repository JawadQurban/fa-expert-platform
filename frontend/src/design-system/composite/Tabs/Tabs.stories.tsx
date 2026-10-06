import type { Meta, StoryObj } from '@storybook/react';
import { Icon } from '@ds/primitives';
import { Tabs } from './Tabs';

const meta = {
  title: 'Composite/Tabs',
  component: Tabs,
  parameters: {
    docs: {
      description: {
        component:
          'DGA CMP-09 — Horizontal Tab / Horizontal Tab List, live-Figma-verified (see docs/FIGMA_HORIZONTAL_TAB_SPECIFICATION.md). `tablist`/`tab`/`tabpanel` with roving tabindex; Arrow keys are RTL-aware (they always move in the visual reading direction), Home/End jump to the first/last enabled tab. `orientation="vertical"` — CMP-09b, see docs/FIGMA_VERTICAL_TAB_SPECIFICATION.md — swaps to ArrowDown/ArrowUp navigation and `aria-orientation="vertical"`.',
      },
    },
  },
  args: {
    label: 'علامات تبويب المحتوى',
    items: [
      { id: 'overview', label: 'نظرة عامة', content: 'محتوى نظرة عامة على الطلب.' },
      { id: 'criteria', label: 'معايير التقييم', content: 'محتوى معايير التقييم.' },
      { id: 'status', label: 'الحالة', content: 'محتوى حالة الطلب الحالية.', disabled: true },
    ],
  },
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const SecondActive: Story = { args: { defaultActiveId: 'criteria' } };

export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <Tabs {...args} size="sm" label="صغير" />
      <Tabs {...args} size="md" label="متوسط" />
      <Tabs {...args} size="lg" label="كبير" />
    </div>
  ),
};

export const WithIcons: Story = {
  args: {
    items: [
      {
        id: 'overview',
        label: 'نظرة عامة',
        content: 'محتوى نظرة عامة على الطلب.',
        icon: <Icon name="home-05" size="sm" />,
      },
      {
        id: 'criteria',
        label: 'معايير التقييم',
        content: 'محتوى معايير التقييم.',
        icon: <Icon name="home-05" size="sm" />,
      },
      {
        id: 'status',
        label: 'الحالة',
        content: 'محتوى حالة الطلب الحالية.',
        icon: <Icon name="home-05" size="sm" />,
        disabled: true,
      },
    ],
  },
};

export const Flush: Story = { args: { flush: true } };
export const NoDivider: Story = { args: { divider: false } };

export const WithOverflowTrigger: Story = {
  args: {
    overflowTrigger: { label: 'المزيد من علامات التبويب' },
  },
};

export const ManyTabsScroll: Story = {
  render: (args) => (
    <div style={{ maxInlineSize: '320px' }}>
      <Tabs
        {...args}
        items={Array.from({ length: 10 }, (_, index) => ({
          id: `tab-${index}`,
          label: `علامة تبويب ${index + 1}`,
          content: `محتوى علامة التبويب ${index + 1}`,
        }))}
      />
    </div>
  ),
};

export const RTL: Story = {
  render: (args) => (
    <div dir="rtl">
      <Tabs {...args} />
    </div>
  ),
};

export const LTR: Story = {
  render: () => (
    <div dir="ltr">
      <Tabs
        label="Content tabs"
        items={[
          { id: 'overview', label: 'Overview', content: 'Overview content.' },
          { id: 'criteria', label: 'Criteria', content: 'Criteria content.' },
          { id: 'status', label: 'Status', content: 'Status content.', disabled: true },
        ]}
      />
    </div>
  ),
};

export const Vertical: Story = {
  args: { orientation: 'vertical' },
  render: (args) => (
    <div style={{ maxInlineSize: '12rem' }}>
      <Tabs {...args} />
    </div>
  ),
};

export const VerticalSizes: Story = {
  args: { orientation: 'vertical' },
  render: (args) => (
    <div style={{ display: 'flex', gap: '2rem' }}>
      <div style={{ maxInlineSize: '10rem' }}>
        <Tabs {...args} size="sm" label="صغير" />
      </div>
      <div style={{ maxInlineSize: '12rem' }}>
        <Tabs {...args} size="md" label="متوسط" />
      </div>
      <div style={{ maxInlineSize: '14rem' }}>
        <Tabs {...args} size="lg" label="كبير" />
      </div>
    </div>
  ),
};

export const VerticalWithIcons: Story = {
  args: {
    orientation: 'vertical',
    items: [
      {
        id: 'overview',
        label: 'نظرة عامة',
        content: 'محتوى نظرة عامة على الطلب.',
        icon: <Icon name="home-05" size="sm" />,
      },
      {
        id: 'criteria',
        label: 'معايير التقييم',
        content: 'محتوى معايير التقييم.',
        icon: <Icon name="home-05" size="sm" />,
      },
      {
        id: 'status',
        label: 'الحالة',
        content: 'محتوى حالة الطلب الحالية.',
        icon: <Icon name="home-05" size="sm" />,
        disabled: true,
      },
    ],
  },
  render: (args) => (
    <div style={{ maxInlineSize: '12rem' }}>
      <Tabs {...args} />
    </div>
  ),
};

export const VerticalRTL: Story = {
  args: { orientation: 'vertical' },
  render: (args) => (
    <div dir="rtl" style={{ maxInlineSize: '12rem' }}>
      <Tabs {...args} />
    </div>
  ),
};

/**
 * Matches the live Figma "Vertical Tab List" reference composition (node `418:100259`) exactly:
 * 5 tabs, first selected, no baseline divider, no inter-tab gap, full-width tabs — see
 * docs/FIGMA_VERTICAL_TAB_SPECIFICATION.md §6.
 */
export const VerticalOfficialFigmaReference: Story = {
  args: {
    orientation: 'vertical',
    label: 'قائمة تبويب عمودية',
    items: [
      {
        id: 'first',
        label: 'التبويب الأول',
        content: 'محتوى التبويب الأول.',
        icon: <Icon name="home-05" size="sm" />,
      },
      {
        id: 'second',
        label: 'التبويب الثاني',
        content: 'محتوى التبويب الثاني.',
        icon: <Icon name="home-05" size="sm" />,
      },
      {
        id: 'third',
        label: 'التبويب الثالث',
        content: 'محتوى التبويب الثالث.',
        icon: <Icon name="home-05" size="sm" />,
      },
      {
        id: 'fourth',
        label: 'التبويب الرابع',
        content: 'محتوى التبويب الرابع.',
        icon: <Icon name="home-05" size="sm" />,
      },
      {
        id: 'fifth',
        label: 'التبويب الخامس',
        content: 'محتوى التبويب الخامس.',
        icon: <Icon name="home-05" size="sm" />,
      },
    ],
  },
  render: (args) => (
    <div style={{ maxInlineSize: '10rem' }}>
      <Tabs {...args} />
    </div>
  ),
};

/** `tabIcons=False` equivalent — same list, no icons, still no divider/gap. */
export const VerticalNoIcons: Story = {
  args: {
    orientation: 'vertical',
    size: 'sm',
    label: 'قائمة تبويب عمودية بدون أيقونات',
    items: [
      { id: 'first', label: 'التبويب الأول', content: 'محتوى التبويب الأول.' },
      { id: 'second', label: 'التبويب الثاني', content: 'محتوى التبويب الثاني.' },
      { id: 'third', label: 'التبويب الثالث', content: 'محتوى التبويب الثالث.' },
    ],
  },
  render: (args) => (
    <div style={{ maxInlineSize: '10rem' }}>
      <Tabs {...args} />
    </div>
  ),
};
