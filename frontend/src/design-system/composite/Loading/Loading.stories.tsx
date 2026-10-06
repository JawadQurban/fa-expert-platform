import type { Meta, StoryObj } from '@storybook/react';
import { Loading } from './Loading';

const meta = {
  title: 'Composite/Loading',
  component: Loading,
  parameters: {
    docs: {
      description: {
        component:
          'Verified live against the official Platforms Code Figma Loading component set (`docs/FIGMA_LOADING_SPECIFICATION.md`, node `5698:11136` — 84 variants: size[7] × style[Neutral/Primary/On-Color] × indicator[animation frames]). DGA CMP-31. `role="status"`/`aria-live="polite"` announces completion once swapped for real content; both animations respect `prefers-reduced-motion`. `variant="skeleton"` is kept from the pre-existing implementation but is not itself Figma-verified (spec §1).',
      },
    },
  },
  argTypes: {
    size: { control: 'inline-radio', options: ['xxs', 'xs', 'sm', 'md', 'lg', 'xl', 'xxl'] },
    mood: { control: 'inline-radio', options: ['neutral', 'primary', 'onColor'] },
  },
  args: {
    label: 'جارٍ التحميل',
  },
} satisfies Meta<typeof Loading>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Spinner: Story = {};
export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
      {(['xxs', 'xs', 'sm', 'md', 'lg', 'xl', 'xxl'] as const).map((size) => (
        <Loading key={size} {...args} size={size} />
      ))}
    </div>
  ),
};
export const Moods: Story = {
  render: (args) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
      <Loading {...args} mood="neutral" />
      <Loading {...args} mood="primary" />
      <div style={{ background: '#1b8354', padding: '12px' }}>
        <Loading {...args} mood="onColor" />
      </div>
    </div>
  ),
};
export const Skeleton: Story = { args: { variant: 'skeleton', lines: 3 } };
export const RTL: Story = {
  render: (args) => (
    <div dir="rtl">
      <Loading {...args} />
    </div>
  ),
};
