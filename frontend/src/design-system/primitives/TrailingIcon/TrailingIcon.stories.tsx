import type { Meta, StoryObj } from '@storybook/react';
import { Icon } from '../Icon/Icon';
import { TrailingIcon } from './TrailingIcon';

const meta = {
  title: 'Primitives/TrailingIcon',
  component: TrailingIcon,
  parameters: {
    docs: {
      description: {
        component:
          'Verified live against the official Platforms Code Figma Trailing Icon component set (`docs/FIGMA_TRAILING_ICON_SPECIFICATION.md`). A small icon-only trigger meant to sit at the end of a field (e.g. the upcoming `SearchBox`), with a helper-text panel on hover/focus. The live example icon (`mic-01`, "Search by voice") is not yet in the FADS icon registry (pending the large `Communications` category import — see the spec) — these stories use already-imported icons instead.',
      },
    },
  },
  args: {
    icon: <Icon name="cancel-01" decorative />,
    label: 'مسح',
  },
} satisfies Meta<typeof TrailingIcon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Clear: Story = {};

export const Search: Story = {
  args: { icon: <Icon name="search-01" decorative />, label: 'بحث' },
};

export const Disabled: Story = { args: { disabled: true } };

export const OfficialFigmaReference: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Reproduces the official DGA Trailing Icon example (node `30150:92875`): a helper-text panel appears below the icon on hover/focus, with a beak pointing up at the trigger. Hover/focus the icon to see it (a `Focused` story variant would require real interaction).',
      },
    },
  },
  render: () => (
    <div style={{ display: 'flex', gap: '2rem', paddingBlockStart: '2rem' }}>
      <TrailingIcon icon={<Icon name="cancel-01" decorative />} label="مسح" />
      <TrailingIcon icon={<Icon name="search-01" decorative />} label="بحث" />
    </div>
  ),
};
