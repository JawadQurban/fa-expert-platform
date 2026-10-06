import type { Meta, StoryObj } from '@storybook/react';
import { Container } from './Container';

const meta = {
  title: 'Layout/Container',
  component: Container,
  parameters: {
    docs: {
      description: {
        component: '⚠ Visual fidelity **Pending final DGA token values (Q3/Q20)**.',
      },
    },
  },
  args: {
    children: (
      <div style={{ background: 'var(--fads-sys-color-background-subtle)', padding: '1rem' }}>
        محتوى داخل الحاوية
      </div>
    ),
  },
  argTypes: { size: { control: 'inline-radio', options: ['page', 'prose', 'form', 'full'] } },
} satisfies Meta<typeof Container>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Page: Story = { args: { size: 'page' } };
export const Prose: Story = { args: { size: 'prose' } };
export const Form: Story = { args: { size: 'form' } };
