import type { Meta, StoryObj } from '@storybook/react';
import { ErrorState } from './ErrorState';

const meta = {
  title: 'Composite/ErrorState',
  component: ErrorState,
  parameters: {
    docs: {
      description: {
        component:
          '⚠ Visual fidelity **Pending final DGA token values (Q3/Q20)**. FADS-authored composition of Inline Alert (CMP-23) + retry `Button` — the standard "failed to load, data preserved" surface (`INTERACTION_SPECIFICATION.md` §9).',
      },
    },
  },
  args: {
    title: 'تعذر تحميل الطلبات',
    description: 'حدث خطأ أثناء تحميل البيانات. يرجى المحاولة مرة أخرى.',
  },
} satisfies Meta<typeof ErrorState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const WithRetry: Story = {
  args: { onRetry: () => console.log('retry'), retryLabel: 'إعادة المحاولة' },
};
