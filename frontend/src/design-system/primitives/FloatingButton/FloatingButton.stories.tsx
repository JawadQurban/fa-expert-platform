import type { Meta, StoryObj } from '@storybook/react';
import { Icon } from '../Icon/Icon';
import { FloatingButton } from './FloatingButton';

const plusIcon = <Icon name="add-01" decorative />;

const meta = {
  title: 'Primitives/FloatingButton',
  component: FloatingButton,
  parameters: {
    docs: {
      description: {
        component:
          "Verified live against the official Platforms Code Figma Floating Button component set (`docs/FIGMA_FLOATING_BUTTON_SPECIFICATION.md`). Colors reuse the already-Approved `Button`'s own tokens directly — this primitive adds zero new color tokens, only 3 geometry ones.",
      },
    },
  },
  args: { icon: plusIcon, 'aria-label': 'إجراء' },
  argTypes: {
    variant: { control: 'inline-radio', options: ['neutral', 'primary', 'secondarySolid'] },
    size: { control: 'inline-radio', options: ['sm', 'lg'] },
  },
} satisfies Meta<typeof FloatingButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Neutral: Story = {};
export const Primary: Story = { args: { variant: 'primary' } };
export const SecondarySolid: Story = { args: { variant: 'secondarySolid' } };

export const WithLabel: Story = { args: { children: 'Button', 'aria-label': undefined } };
export const Large: Story = { args: { size: 'lg' } };
export const Selected: Story = { args: { selected: true } };
export const Disabled: Story = { args: { disabled: true } };

export const OnColor: Story = {
  args: { onColor: true },
  decorators: [
    (Story) => (
      <div style={{ display: 'inline-flex', padding: '0.75rem', backgroundColor: '#1b8354' }}>
        <Story />
      </div>
    ),
  ],
};

export const OfficialFigmaReference: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Reproduces the official DGA Floating Button example (node `19488:124656`): every style, both sizes, icon-only and with a label.',
      },
    },
  },
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {(['neutral', 'primary', 'secondarySolid'] as const).map((variant) => (
          <FloatingButton key={variant} icon={plusIcon} variant={variant} aria-label={variant} />
        ))}
        {(['neutral', 'primary', 'secondarySolid'] as const).map((variant) => (
          <FloatingButton
            key={`${variant}-lg`}
            icon={plusIcon}
            variant={variant}
            size="lg"
            aria-label={variant}
          />
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {(['neutral', 'primary', 'secondarySolid'] as const).map((variant) => (
          <FloatingButton key={`${variant}-label`} icon={plusIcon} variant={variant}>
            Button
          </FloatingButton>
        ))}
      </div>
    </div>
  ),
};
