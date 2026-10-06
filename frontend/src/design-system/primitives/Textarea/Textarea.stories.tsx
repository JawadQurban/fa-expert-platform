import type { Meta, StoryObj } from '@storybook/react';
import { Textarea } from './Textarea';

const meta = {
  title: 'Primitives/Textarea',
  component: Textarea,
  parameters: {
    docs: {
      description: {
        component:
          'Verified live against the official Platforms Code Figma Textarea component set (`docs/FIGMA_TEXTAREA_SPECIFICATION.md`). Shares its `Form/field-*` token family with the already-Approved `TextInput`. The feedback icon in the helper/error row is not implemented pending the official DGA icon library (Q8).',
      },
    },
  },
  argTypes: {
    surface: { control: 'inline-radio', options: ['default', 'filledDarker', 'filledLighter'] },
  },
  args: { label: 'وصف المشكلة', placeholder: 'صف المشكلة التي يعالجها ابتكارك' },
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Required: Story = { args: { requiredField: true } };
export const WithHelper: Story = { args: { helperText: 'اذكر السياق والأثر المتوقع.' } };
export const WithError: Story = { args: { errorText: 'الرجاء وصف المشكلة' } };
export const ReadOnly: Story = { args: { readOnly: true, defaultValue: 'قيمة للقراءة فقط' } };
export const Disabled: Story = { args: { disabled: true, defaultValue: 'غير متاح' } };

export const Surfaces: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxInlineSize: '24rem' }}>
      <Textarea {...args} surface="default" label="Default" />
      <Textarea {...args} surface="filledDarker" label="Filled darker" />
      <Textarea {...args} surface="filledLighter" label="Filled lighter" />
    </div>
  ),
};

export const WithCharacterCount: Story = {
  args: { showCharacterCount: true, maxLength: 280, defaultValue: 'نص مبدئي' },
};

export const RTL: Story = {
  render: (args) => (
    <div dir="rtl" style={{ maxInlineSize: '24rem' }}>
      <Textarea {...args} />
    </div>
  ),
};
