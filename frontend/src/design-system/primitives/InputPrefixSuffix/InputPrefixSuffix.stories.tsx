import type { Meta, StoryObj } from '@storybook/react';
import { InputPrefixSuffix } from './InputPrefixSuffix';

const meta = {
  title: 'Primitives/InputPrefixSuffix',
  component: InputPrefixSuffix,
  parameters: {
    docs: {
      description: {
        component:
          "Verified live against the official Platforms Code Figma Input Prefix-Suffix component set (`docs/FIGMA_INPUT_PREFIX_SUFFIX_SPECIFICATION.md`). The exact icon-badge sub-component `NumberInput`'s own increment/decrement buttons instantiate — usually seen composed inside `TextInput`'s `prefix`/`suffix` slots (see `NumberInput`), shown standalone here for visual reference.",
      },
    },
  },
  args: { icon: 'plus', label: 'Increment' },
  decorators: [
    (Story) => (
      <div style={{ display: 'inline-flex', blockSize: '40px', inlineSize: '48px' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof InputPrefixSuffix>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Plus: Story = {};
export const Minus: Story = { args: { icon: 'minus', label: 'Decrement' } };

export const Subtle: Story = { args: { variant: 'subtle' } };
export const Selected: Story = { args: { selected: true } };
export const Disabled: Story = { args: { disabled: true } };
export const DisabledSubtle: Story = { args: { disabled: true, variant: 'subtle' } };

export const Medium: Story = {
  decorators: [
    (Story) => (
      <div style={{ display: 'inline-flex', blockSize: '32px', inlineSize: '40px' }}>
        <Story />
      </div>
    ),
  ],
  args: { size: 'md' },
};

export const OfficialFigmaReference: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Reproduces the official DGA Input Prefix-Suffix example (node `30150:60916`): Plus/Minus × Solid/Subtle × every state, Large size.',
      },
    },
  },
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
      {(['plus', 'minus'] as const).map((icon) =>
        (['solid', 'subtle'] as const).map((variant) => (
          <div
            key={`${icon}-${variant}`}
            style={{ display: 'inline-flex', blockSize: '40px', inlineSize: '48px' }}
          >
            <InputPrefixSuffix icon={icon} variant={variant} label={`${icon} ${variant}`} />
          </div>
        ))
      )}
      <div style={{ display: 'inline-flex', blockSize: '40px', inlineSize: '48px' }}>
        <InputPrefixSuffix icon="plus" selected label="plus selected" />
      </div>
      <div style={{ display: 'inline-flex', blockSize: '40px', inlineSize: '48px' }}>
        <InputPrefixSuffix icon="plus" disabled label="plus disabled" />
      </div>
    </div>
  ),
};
