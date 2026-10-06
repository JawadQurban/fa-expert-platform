import type { Meta, StoryObj } from '@storybook/react';
import { ButtonClose } from './ButtonClose';

const meta = {
  title: 'Primitives/ButtonClose',
  component: ButtonClose,
  parameters: {
    docs: {
      description: {
        component:
          'Verified live against the official Platforms Code Figma Button-Close component set (`docs/FIGMA_BUTTON_CLOSE_SPECIFICATION.md`). A small icon-only "×" button used to dismiss modals, dialogs, toasts, and other transient surfaces.',
      },
    },
  },
  args: { label: 'إغلاق' },
} satisfies Meta<typeof ButtonClose>;

export default meta;
type Story = StoryObj<typeof meta>;

export const XSmall: Story = {};
export const Small: Story = { args: { size: 'sm' } };
export const Medium: Story = { args: { size: 'md' } };
export const Large: Story = { args: { size: 'lg' } };

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

export const Disabled: Story = { args: { disabled: true } };

export const OfficialFigmaReference: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Reproduces the official DGA Button-Close example (node `2763:420129`): every size, on the default surface and on a dark/colored surface.',
      },
    },
  },
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {(['xs', 'sm', 'md', 'lg'] as const).map((size) => (
          <ButtonClose key={size} size={size} label={`إغلاق ${size}`} />
        ))}
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '0.75rem',
          backgroundColor: '#1b8354',
        }}
      >
        {(['xs', 'sm', 'md', 'lg'] as const).map((size) => (
          <ButtonClose key={size} size={size} onColor label={`إغلاق ${size}`} />
        ))}
      </div>
    </div>
  ),
};
