import type { Meta, StoryObj } from '@storybook/react';
import { Avatar } from './Avatar';

const meta = {
  title: 'Primitives/Avatar',
  component: Avatar,
  parameters: {
    docs: {
      description: {
        component:
          'Three contexts — image, initials, or icon — across 7 sizes, rounded or square shape, ' +
          'and an optional white framing border. Verified live against Figma node 5699:53529.',
      },
    },
  },
  args: { name: 'قربان جواد' },
  argTypes: {
    size: { control: 'inline-radio', options: ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl'] },
  },
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Initials: Story = {};
export const Image: Story = {
  args: { src: 'https://invalid.example/broken.png' },
  parameters: {
    docs: { description: { story: 'Broken src falls back to initials automatically.' } },
  },
};
export const Icon: Story = {
  args: {
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
      </svg>
    ),
  },
};
export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
      <Avatar name="ق ج" size="xs" />
      <Avatar name="ق ج" size="sm" />
      <Avatar name="ق ج" size="md" />
      <Avatar name="ق ج" size="lg" />
      <Avatar name="ق ج" size="xl" />
      <Avatar name="ق ج" size="2xl" />
      <Avatar name="ق ج" size="3xl" />
    </div>
  ),
};
export const Square: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
      <Avatar name="ق ج" size="sm" square />
      <Avatar name="ق ج" size="md" square />
      <Avatar name="ق ج" size="2xl" square />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Square shape uses a smaller corner radius for sizes up to 64px, and a larger one for 80/120px.',
      },
    },
  },
};
export const Border: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        gap: '0.5rem',
        alignItems: 'center',
        background: '#1b8354',
        padding: '1rem',
      }}
    >
      <Avatar name="ق ج" size="md" border />
      <Avatar name="ق ج" size="md" square border />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'The white framing border is meant for avatars placed over colored or image backgrounds.',
      },
    },
  },
};
export const RTL: Story = {
  render: () => (
    <div dir="rtl" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
      <Avatar name="قربان جواد" size="md" />
      <Avatar
        name="قربان جواد"
        size="md"
        icon={
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
          </svg>
        }
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Avatar has no directional layout (a centered square/circle), so RTL only affects surrounding context.',
      },
    },
  },
};
