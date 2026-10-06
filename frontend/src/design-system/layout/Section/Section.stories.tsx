import type { Meta, StoryObj } from '@storybook/react';
import { Section } from './Section';
import { Container } from '../Container/Container';

const meta = {
  title: 'Layout/Section',
  component: Section,
  parameters: {
    docs: {
      description: {
        component:
          '⚠ Visual fidelity **Pending final DGA token values (Q3/Q20)**. Compose a Container inside to constrain width.',
      },
    },
  },
  args: {
    'aria-label': 'قسم تجريبي',
    children: <Container>محتوى القسم</Container>,
  },
  argTypes: { background: { control: 'inline-radio', options: ['default', 'subtle', 'inverse'] } },
} satisfies Meta<typeof Section>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Subtle: Story = { args: { background: 'subtle' } };
export const Inverse: Story = { args: { background: 'inverse' } };
