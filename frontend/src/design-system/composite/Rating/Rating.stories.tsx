import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Rating } from './Rating';

function InteractiveRatingDemo(props: { size?: 'sm' | 'md' | 'lg'; brand?: boolean }) {
  const [value, setValue] = useState(3);
  return <Rating value={value} onChange={setValue} label="Rate this product" {...props} />;
}

const meta = {
  title: 'Composite/Rating',
  component: Rating,
  parameters: {
    docs: {
      description: {
        component:
          'Verified live against the official Platforms Code Figma Rating component set (`docs/FIGMA_RATING_SPECIFICATION.md`). Each star is a real, independently-focusable `<button>` when `onChange` is given (an interactive input); omitting `onChange` renders a non-interactive, `role="img"` display instead (e.g. for an average score).',
      },
    },
  },
  args: { value: 3.5 },
} satisfies Meta<typeof Rating>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ReadOnlyDisplay: Story = {};
export const ReadOnlyBrand: Story = { args: { brand: true } };
export const ReadOnlyZero: Story = { args: { value: 0 } };
export const ReadOnlyFull: Story = { args: { value: 5 } };

export const Interactive: Story = {
  render: () => <InteractiveRatingDemo />,
};
export const InteractiveBrand: Story = {
  render: () => <InteractiveRatingDemo brand />,
};

export const Sizes: Story = {
  render: () => (
    <div
      style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'flex-start' }}
    >
      <Rating value={3.5} size="lg" />
      <Rating value={3.5} size="md" />
      <Rating value={3.5} size="sm" />
    </div>
  ),
};

export const OfficialFigmaReference: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Reproduces the official DGA Rating example (node `30150:69520`): every size, Default and Brand style, at the live-sampled 3.5-star value.',
      },
    },
  },
  render: () => (
    <div
      style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'flex-start' }}
    >
      <Rating value={3.5} size="lg" />
      <Rating value={3.5} size="md" />
      <Rating value={3.5} size="sm" />
      <Rating value={3.5} size="lg" brand />
      <Rating value={3.5} size="md" brand />
      <Rating value={3.5} size="sm" brand />
    </div>
  ),
};
