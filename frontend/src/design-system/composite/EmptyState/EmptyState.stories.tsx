import type { Meta, StoryObj } from '@storybook/react';
import { EmptyState } from './EmptyState';

const meta = {
  title: 'Composite/EmptyState',
  component: EmptyState,
  parameters: {
    docs: {
      description: {
        component:
          '⚠ Visual fidelity **Pending final DGA token values (Q3/Q20)**. FADS-authored composition (not a numbered DGA CMP) — "no results" placeholder for lists/tables/details.',
      },
    },
  },
  args: {
    title: 'لا توجد طلبات',
    description: 'لم تقم بتقديم أي ابتكار بعد.',
  },
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const WithAction: Story = {
  args: { action: <button type="button">قدم ابتكارك</button> },
};
export const WithIcon: Story = {
  args: {
    icon: (
      <svg
        width="40"
        height="40"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" strokeWidth="1.5" />
      </svg>
    ),
    action: <button type="button">قدم ابتكارك</button>,
  },
};
