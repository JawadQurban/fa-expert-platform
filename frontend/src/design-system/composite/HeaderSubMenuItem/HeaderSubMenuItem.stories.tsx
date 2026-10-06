import type { Meta, StoryObj } from '@storybook/react';
import { Icon, Tag } from '@ds/primitives';
import { HeaderSubMenuItem } from './HeaderSubMenuItem';

const meta = {
  title: 'Composite/HeaderSubMenuItem',
  component: HeaderSubMenuItem,
  parameters: {
    docs: {
      description: {
        component:
          'DGA registry "Header Sub-menu Item" — live-Figma-verified (see docs/FIGMA_HEADER_SUB_MENU_ITEM_SPECIFICATION.md). One row inside a `NavHeaderSubMenu` panel.',
      },
    },
  },
  args: {
    label: 'Menu Item Label',
    helperText: 'Menu item helper text',
    icon: <Icon name="information-circle" size="md" decorative />,
  },
} satisfies Meta<typeof HeaderSubMenuItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const WithoutHelperText: Story = { args: { helperText: undefined } };
export const WithoutIcon: Story = { args: { icon: undefined } };
export const WithTag: Story = {
  args: { tag: <Tag variant="success">New</Tag> },
};

export const OnColor: Story = {
  args: { onColor: true, tag: <Tag variant="success">New</Tag> },
  render: (args) => (
    <div style={{ background: '#074d31', padding: 16, borderRadius: 8 }}>
      <HeaderSubMenuItem {...args} />
    </div>
  ),
};

export const RTL: Story = {
  args: { label: 'عنوان عنصر القائمة', helperText: 'محتوى مساند لعنصر الوصول' },
  render: (args) => (
    <div dir="rtl">
      <HeaderSubMenuItem {...args} />
    </div>
  ),
};
