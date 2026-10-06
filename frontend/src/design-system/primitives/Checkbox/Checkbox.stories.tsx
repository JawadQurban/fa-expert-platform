import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Checkbox } from './Checkbox';

const meta = {
  title: 'Primitives/Checkbox',
  component: Checkbox,
  parameters: {
    docs: {
      description: {
        component:
          'Verified live against the official Platforms Code Figma Checkbox component set (`docs/FIGMA_CHECKBOX_SPECIFICATION.md`). States: Unchecked / Checked / Indeterminate × Default/Hovered/Pressed/Focused/Read-only/Disabled × size (md/sm/xs) × mood (primary/neutral). No official Invalid variant exists — `errorText` is still supported as a functional a11y requirement.',
      },
    },
  },
  argTypes: {
    size: { control: 'inline-radio', options: ['md', 'sm', 'xs'] },
    mood: { control: 'inline-radio', options: ['primary', 'neutral'] },
  },
  args: { label: 'أوافق على الشروط والأحكام' },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Unchecked: Story = {};
export const Checked: Story = { args: { defaultChecked: true } };
export const Indeterminate: Story = { args: { indeterminate: true, label: 'تحديد الكل' } };
export const WithDescription: Story = {
  args: { label: 'تلقّي الإشعارات', description: 'سنرسل تحديثات حول حالة طلبك.' },
};
export const WithError: Story = {
  args: { errorText: 'يجب الموافقة على الشروط والأحكام للمتابعة' },
};
export const ReadOnly: Story = { args: { readOnly: true, defaultChecked: true } };
export const Disabled: Story = { args: { disabled: true } };
export const DisabledChecked: Story = { args: { disabled: true, defaultChecked: true } };

export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <Checkbox {...args} size="md" label="Medium" defaultChecked />
      <Checkbox {...args} size="sm" label="Small" defaultChecked />
      <Checkbox {...args} size="xs" label="x Small" defaultChecked />
    </div>
  ),
};

export const Moods: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <Checkbox {...args} mood="primary" label="Primary" defaultChecked />
      <Checkbox {...args} mood="neutral" label="Neutral" defaultChecked />
    </div>
  ),
};

export const Controlled: Story = {
  render: (args) => {
    const [checked, setChecked] = useState(false);
    return (
      <Checkbox
        {...args}
        checked={checked}
        onChange={(event) => setChecked(event.target.checked)}
      />
    );
  },
};

export const RTL: Story = {
  render: (args) => (
    <div dir="rtl">
      <Checkbox {...args} description="سنرسل تحديثات حول حالة طلبك." />
    </div>
  ),
};
