import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { NumberInput } from './NumberInput';

const meta = {
  title: 'Primitives/NumberInput',
  component: NumberInput,
  parameters: {
    docs: {
      description: {
        component:
          'Verified live against the official Platforms Code Figma Number Input component set (`docs/FIGMA_NUMBER_INPUT_SPECIFICATION.md`). Composes the approved `TextInput` — increment/decrement buttons live in its `prefix`/`suffix` slots.',
      },
    },
  },
  args: {
    label: 'الكمية',
    incrementLabel: 'زيادة',
    decrementLabel: 'إنقاص',
  },
} satisfies Meta<typeof NumberInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const WithDefaultValue: Story = { args: { defaultValue: 5 } };
export const WithMinMax: Story = { args: { defaultValue: 5, min: 0, max: 10 } };
export const WithStep: Story = { args: { defaultValue: 10, step: 5, min: 0, max: 100 } };

export const WithHelper: Story = {
  args: { helperText: 'أدخل قيمة بين 0 و 100', min: 0, max: 100 },
};
export const WithError: Story = {
  args: { errorText: 'القيمة خارج النطاق المسموح', defaultValue: 150, min: 0, max: 100 },
};

export const ReadOnly: Story = { args: { readOnly: true, defaultValue: 42 } };
export const Disabled: Story = { args: { disabled: true, defaultValue: 42 } };

export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxInlineSize: '20rem' }}>
      <NumberInput {...args} size="lg" label="Large" defaultValue={1} />
      <NumberInput {...args} size="md" label="Medium" defaultValue={1} />
    </div>
  ),
};

export const Controlled: Story = {
  render: function ControlledNumberInput(args) {
    const [value, setValue] = useState(3);
    return (
      <NumberInput
        {...args}
        value={value}
        onValueChange={(next) => setValue(next ?? 0)}
        min={0}
        max={10}
      />
    );
  },
};

export const RTL: Story = {
  render: (args) => (
    <div dir="rtl" style={{ maxInlineSize: '20rem' }}>
      <NumberInput {...args} defaultValue={7} min={0} max={20} />
    </div>
  ),
};
