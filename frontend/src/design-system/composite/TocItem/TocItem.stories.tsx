import type { Meta, StoryObj } from '@storybook/react';
import { TocItem } from './TocItem';

const meta = {
  title: 'Composite/TocItem',
  component: TocItem,
  parameters: {
    docs: {
      description: {
        component:
          'DGA registry "TOC Item" — live-Figma-verified (see docs/FIGMA_TOC_ITEM_SPECIFICATION.md). A single entry in a table-of-contents list; compose several inside a `<nav>` to build a `Toc`.',
      },
    },
  },
  args: {
    children: 'قسم صفحة',
  },
} satisfies Meta<typeof TocItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Selected: Story = { args: { selected: true } };
export const Level2: Story = { args: { level: 2, children: 'قسم فرعي' } };
export const Level3: Story = { args: { level: 3, children: 'قسم فرعي فرعي' } };

export const OfficialFigmaReference: Story = {
  render: () => (
    <nav
      aria-label="جدول المحتويات"
      style={{ display: 'flex', flexDirection: 'column', width: 240 }}
    >
      <TocItem selected>القسم الأول</TocItem>
      <TocItem level={2}>قسم فرعي 1.1</TocItem>
      <TocItem level={3}>قسم فرعي فرعي 1.1.1</TocItem>
      <TocItem>القسم الثاني</TocItem>
    </nav>
  ),
};

export const RTL: Story = {
  render: (args) => (
    <div dir="rtl">
      <TocItem {...args} />
    </div>
  ),
};

export const LTR: Story = {
  args: { children: 'Page Section' },
  render: (args) => (
    <div dir="ltr">
      <TocItem {...args} />
    </div>
  ),
};
