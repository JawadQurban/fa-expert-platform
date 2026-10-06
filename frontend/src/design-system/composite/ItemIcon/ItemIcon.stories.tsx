import type { Meta, StoryObj } from '@storybook/react';
import { ItemIcon } from './ItemIcon';

/**
 * No `checkmark-square` glyph exists in this codebase's Icon registry (the
 * same disclosed gap already accepted for `Alert`/`Toast`/`Notification`'s
 * own missing checkmark) — hand-authored here purely to match the live
 * Figma demo content (`checkmark-square-02`) for visual reference stories.
 */
function CheckmarkSquareGlyph() {
  return (
    <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true" width="24" height="24">
      <rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M7 12L10.5 15.5L17 8.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const meta = {
  title: 'Composite/ItemIcon',
  component: ItemIcon,
  parameters: {
    docs: {
      description: {
        component:
          'DGA registry "Item Icon" — live-Figma-verified (see docs/FIGMA_ITEM_ICON_SPECIFICATION.md). A swappable-icon wrapper composed by `HeaderSubMenuItem` and other list-style composites.',
      },
    },
  },
  args: {
    icon: <CheckmarkSquareGlyph />,
  },
} satisfies Meta<typeof ItemIcon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Plain: Story = {};
export const Contained: Story = { args: { contained: true } };

export const OnColorPlain: Story = {
  args: { onColor: true },
  render: (args) => (
    <div style={{ background: '#074d31', padding: 16, borderRadius: 8 }}>
      <ItemIcon {...args} />
    </div>
  ),
};

export const OnColorContained: Story = {
  args: { onColor: true, contained: true },
  render: (args) => (
    <div style={{ background: '#074d31', padding: 16, borderRadius: 8 }}>
      <ItemIcon {...args} />
    </div>
  ),
};

export const OfficialFigmaReference: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
      <ItemIcon icon={<CheckmarkSquareGlyph />} />
      <ItemIcon icon={<CheckmarkSquareGlyph />} contained />
      <div
        style={{ background: '#074d31', padding: 16, borderRadius: 8, display: 'flex', gap: 24 }}
      >
        <ItemIcon icon={<CheckmarkSquareGlyph />} onColor />
        <ItemIcon icon={<CheckmarkSquareGlyph />} onColor contained />
      </div>
    </div>
  ),
};
