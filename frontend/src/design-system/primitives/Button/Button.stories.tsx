import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta = {
  title: 'Primitives/Button',
  component: Button,
  parameters: {
    docs: {
      description: {
        component:
          'Every variant, size, and state is sourced from the official Figma Button component — see `docs/FIGMA_BUTTON_SPECIFICATION.md` and `reports/VISUAL_COMPLIANCE_BUTTON.md`. `secondary` maps to the official Secondary-Outline style and `tertiary` to Transparent; `neutral`/`secondarySolid` are new variants matching the official Neutral/Secondary-Solid styles. `destructive`/`onColor` are verified only in combination with the Primary style.',
      },
    },
  },
  args: { children: 'قدم ابتكارك' },
  argTypes: {
    variant: {
      control: 'inline-radio',
      options: ['primary', 'secondary', 'tertiary', 'neutral', 'secondarySolid', 'subtle'],
    },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = { args: { variant: 'primary' } };
export const Secondary: Story = { args: { variant: 'secondary' } };
export const Tertiary: Story = { args: { variant: 'tertiary' } };
export const Neutral: Story = { args: { variant: 'neutral' } };
export const SecondarySolid: Story = { args: { variant: 'secondarySolid' } };
/** Live-verified via `Button-menu`'s own component set (`docs/FIGMA_BUTTON_MENU_SPECIFICATION.md`) —
 * transparent by default, `neutral-100`/`-200` fill on Hover/Pressed, transparent even when Disabled. */
export const Subtle: Story = { args: { variant: 'subtle' } };
export const Destructive: Story = { args: { destructive: true, children: 'حذف' } };
export const OnColor: Story = {
  args: { onColor: true },
  parameters: {
    backgrounds: { default: 'dark' },
    docs: {
      description: {
        story: 'Verified only for the Primary style — for placement on a colored/dark surface.',
      },
    },
  },
};
export const Loading: Story = { args: { loading: true } };
export const Disabled: Story = { args: { disabled: true } };
export const Selected: Story = { args: { selected: true, children: 'محدد' } };
export const FullWidth: Story = { args: { fullWidth: true } };

/** Renders a real `<a href>` instead of a `<button>` — for link-style CTAs that
 * must be true, crawlable, right-clickable links (see
 * `reports/LANDING_PAGE_REBUILD_REPORT.md`). Identical styling either way. */
export const Link: Story = { args: { href: '/submit' } };

export const IconOnly: Story = {
  args: {
    children: undefined,
    'aria-label': 'إغلاق',
    iconStart: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
  },
};

/** Default vs. Selected — Selected reuses the exact Pressed color (verified live), not
 * a separate fabricated shade. Hover/Pressed require live interaction to see. */
export const PrimaryStates: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
      <Button variant="primary">افتراضي</Button>
      <Button variant="primary" selected>
        محدد
      </Button>
    </div>
  ),
};

export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
      <Button {...args} size="sm">
        صغير
      </Button>
      <Button {...args} size="md">
        متوسط
      </Button>
      <Button {...args} size="lg">
        كبير
      </Button>
    </div>
  ),
};

export const AllVariants: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
      <Button {...args} variant="primary">
        أساسي
      </Button>
      <Button {...args} variant="secondary">
        ثانوي
      </Button>
      <Button {...args} variant="tertiary">
        ثالثي
      </Button>
      <Button {...args} variant="neutral">
        محايد
      </Button>
      <Button {...args} variant="secondarySolid">
        ثانوي مصمت
      </Button>
    </div>
  ),
};
