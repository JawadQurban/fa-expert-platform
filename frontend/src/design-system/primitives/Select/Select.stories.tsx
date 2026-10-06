import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Select } from './Select';

const options = [
  { value: 'ops', label: 'التشغيل' },
  { value: 'fin', label: 'المالية' },
  { value: 'hr', label: 'الموارد البشرية' },
];

const groups = [
  {
    label: 'الإدارات الرئيسية',
    options: [
      { value: 'ops', label: 'التشغيل' },
      { value: 'fin', label: 'المالية' },
    ],
  },
  {
    label: 'إدارات الدعم',
    options: [
      { value: 'hr', label: 'الموارد البشرية' },
      { value: 'it', label: 'تقنية المعلومات', disabled: true },
    ],
  },
];

const meta = {
  title: 'Primitives/Select',
  component: Select,
  parameters: {
    docs: {
      description: {
        component:
          'Verified live against the official Platforms Code Figma Dropdown Input component set (`docs/FIGMA_SELECT_SPECIFICATION.md`). Built as a WAI-ARIA "Select-Only Combobox" — the official `Focused` state is a real custom listbox panel, which native `<select>` cannot render.',
      },
    },
  },
  argTypes: {
    size: { control: 'inline-radio', options: ['md', 'lg'] },
    surface: { control: 'inline-radio', options: ['default', 'filledDarker', 'filledLighter'] },
  },
  args: { label: 'التصنيف', placeholder: 'اختر تصنيفًا', options },
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Required: Story = { args: { requiredField: true } };
export const WithHelper: Story = { args: { helperText: 'اختر الإدارة المعنية بالابتكار.' } };
export const WithError: Story = { args: { errorText: 'الرجاء اختيار التصنيف' } };
export const ReadOnly: Story = { args: { readOnly: true, defaultValue: 'ops' } };
export const Disabled: Story = { args: { disabled: true } };
export const Loading: Story = { args: { loading: true } };
export const NoOptions: Story = { args: { options: [] } };

export const Grouped: Story = {
  args: { groups, options: undefined },
};

export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <Select {...args} size="lg" label="Large" />
      <Select {...args} size="md" label="Medium" />
    </div>
  ),
};

export const Surfaces: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <Select {...args} surface="default" label="Default" />
      <Select {...args} surface="filledDarker" label="Filled darker" />
      <Select {...args} surface="filledLighter" label="Filled lighter" />
    </div>
  ),
};

export const Controlled: Story = {
  render: (args) => {
    const [value, setValue] = useState<string | undefined>(undefined);
    return <Select {...args} value={value} onValueChange={setValue} />;
  },
};

export const RTL: Story = {
  render: (args) => (
    <div dir="rtl" style={{ maxInlineSize: '24rem' }}>
      <Select {...args} />
    </div>
  ),
};
