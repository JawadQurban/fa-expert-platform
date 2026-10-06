import type { Meta, StoryObj } from '@storybook/react';
import { Tooltip } from './Tooltip';
import { Button } from '../Button/Button';

const meta = {
  title: 'Primitives/Tooltip',
  component: Tooltip,
  parameters: {
    docs: {
      description: {
        component:
          'Hover or focus the trigger; Escape dismisses (WCAG 1.4.13). Verified live against ' +
          'Figma node 30150:139266 — light bubble by default, `inverted` for dark.',
      },
    },
  },
  args: {
    content: 'يجب أن يكون العنوان موجزًا',
    children: <Button variant="secondary">تلميح</Button>,
  },
  argTypes: {
    placement: {
      control: 'inline-radio',
      options: ['top', 'bottom', 'inline-start', 'inline-end'],
    },
  },
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Top: Story = { args: { placement: 'top' } };
export const Bottom: Story = { args: { placement: 'bottom' } };
export const InlineStart: Story = { args: { placement: 'inline-start' } };
export const InlineEnd: Story = { args: { placement: 'inline-end' } };
export const WithTitle: Story = {
  args: { title: 'عنوان التلميح' },
};
export const WithoutIcon: Story = {
  args: { icon: false },
};
export const Inverted: Story = {
  args: { inverted: true, title: 'عنوان التلميح' },
};
export const RTL: Story = {
  render: (args) => (
    <div dir="rtl" style={{ padding: '3rem' }}>
      <Tooltip {...args} />
    </div>
  ),
  args: { placement: 'inline-end', title: 'عنوان التلميح' },
};
