import type { Meta, StoryObj } from '@storybook/react';
import { Icon, Tag, Switch, Button } from '@ds/primitives';
import { MenuListItem } from './MenuListItem';

const meta = {
  title: 'Composite/MenuListItem',
  component: MenuListItem,
  parameters: {
    docs: {
      description: {
        component:
          "Verified live against the official Platforms Code Figma Menu list item component set (`docs/FIGMA_MENU_LIST_ITEM_SPECIFICATION.md`). The live `Trail element` axis (Text/Icon/Button/Tag/Switch) is just different content in one generic `trailing` slot — Button/Tag/Switch are literal instances of the already-Approved primitives. The live node's own `tick-02`/`arrow-right-02` icons are not in the FADS icon registry yet (a disclosed gap, not a substitution — see the Figma spec); already-imported icons stand in for these stories.",
      },
    },
  },
  args: {
    icon: <Icon name="add-01" decorative />,
    children: 'Item Label',
  },
} satisfies Meta<typeof MenuListItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Selected: Story = { args: { selected: true } };
export const Disabled: Story = { args: { disabled: true } };
export const WithoutIcon: Story = { args: { icon: undefined } };

export const TrailingText: Story = {
  args: { trailing: <span style={{ color: '#6c737f' }}>+99</span> },
};
export const TrailingIcon: Story = {
  args: {
    trailing: (
      <span aria-hidden="true" style={{ color: '#161616' }}>
        ✓
      </span>
    ),
  },
};
export const TrailingButton: Story = {
  args: {
    trailing: (
      <Button
        variant="tertiary"
        size="sm"
        aria-label="Open"
        iconStart={<Icon name="add-01" decorative />}
      />
    ),
  },
};
export const TrailingTag: Story = {
  args: { trailing: <Tag>Label</Tag> },
};
export const TrailingSwitch: Story = {
  args: { trailing: <Switch label={<span className="fads-visually-hidden">Enable</span>} /> },
};

export const OfficialFigmaReference: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Reproduces the official DGA Menu list item example (node `30195:21865`): every trailing-element type, plus Selected and Disabled.',
      },
    },
  },
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', width: '225px' }}>
      <MenuListItem icon={<Icon name="add-01" decorative />}>Item Label</MenuListItem>
      <MenuListItem
        icon={<Icon name="add-01" decorative />}
        trailing={<span style={{ color: '#6c737f' }}>+99</span>}
      >
        Item Label
      </MenuListItem>
      <MenuListItem
        icon={<Icon name="add-01" decorative />}
        trailing={
          <span aria-hidden="true" style={{ color: '#161616' }}>
            ✓
          </span>
        }
      >
        Item Label
      </MenuListItem>
      <MenuListItem
        icon={<Icon name="add-01" decorative />}
        trailing={
          <Button
            variant="tertiary"
            size="sm"
            aria-label="Open"
            iconStart={<Icon name="add-01" decorative />}
          />
        }
      >
        Item Label
      </MenuListItem>
      <MenuListItem icon={<Icon name="add-01" decorative />} trailing={<Tag>Label</Tag>}>
        Item Label
      </MenuListItem>
      <MenuListItem
        icon={<Icon name="add-01" decorative />}
        trailing={<Switch label={<span className="fads-visually-hidden">Enable</span>} />}
      >
        Item Label
      </MenuListItem>
      <MenuListItem icon={<Icon name="add-01" decorative />} selected>
        Item Label
      </MenuListItem>
      <MenuListItem icon={<Icon name="add-01" decorative />} disabled>
        Item Label
      </MenuListItem>
    </div>
  ),
};
