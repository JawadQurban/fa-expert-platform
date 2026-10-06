import type { Meta, StoryObj } from '@storybook/react';
import { Typography } from './Typography';

const meta = {
  title: 'Primitives/Typography',
  component: Typography,
  parameters: {
    docs: {
      description: {
        component:
          '⚠ Visual fidelity **Pending final DGA token values (Q3/Q20)**. Choose `variant` for size and `as` for semantics independently.',
      },
    },
  },
  args: { children: 'الأكاديمية المالية' },
} satisfies Meta<typeof Typography>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Body: Story = {};
export const Heading: Story = { args: { as: 'h1', variant: 'display-lg' } };
export const Muted: Story = { args: { color: 'muted', variant: 'text-sm' } };

export const Scale: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: '0.5rem' }}>
      <Typography as="h1" variant="display-xl">
        عرض كبير جدًا
      </Typography>
      <Typography as="h2" variant="display-lg">
        عرض كبير
      </Typography>
      <Typography as="h3" variant="display-md">
        عرض متوسط
      </Typography>
      <Typography variant="text-lg">نص كبير</Typography>
      <Typography variant="text-md">نص أساسي</Typography>
      <Typography variant="text-sm" color="muted">
        نص صغير ثانوي
      </Typography>
    </div>
  ),
};
