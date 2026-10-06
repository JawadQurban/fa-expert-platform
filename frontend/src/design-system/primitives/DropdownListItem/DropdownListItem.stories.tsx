import type { Meta, StoryObj } from '@storybook/react';
import { DropdownListItem } from './DropdownListItem';

const meta = {
  title: 'Primitives/DropdownListItem',
  component: DropdownListItem,
  parameters: {
    docs: {
      description: {
        component:
          'Verified live against the official Platforms Code Figma Dropdown List Item component set (`docs/FIGMA_DROPDOWN_LIST_ITEM_SPECIFICATION.md`). This is the exact sub-component `Select`\'s own option rows already compose — shown standalone here for visual reference. Rendered inside a `<ul role="listbox">` wrapper for valid markup.',
      },
    },
  },
  args: { children: 'Option' },
  decorators: [
    (Story) => (
      <ul role="listbox" style={{ listStyle: 'none', margin: 0, padding: 0, width: '320px' }}>
        <Story />
      </ul>
    ),
  ],
} satisfies Meta<typeof DropdownListItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Option: Story = {};
export const Selected: Story = { args: { selected: true } };
export const Active: Story = { args: { active: true } };
export const Disabled: Story = { args: { disabled: true } };
export const WithDivider: Story = { args: { divider: true } };

export const MultiSelectOption: Story = {
  args: { type: 'multiSelectOption', selected: true },
};

export const GroupLabel: Story = {
  args: { type: 'groupLabel', children: 'Group label' },
};

export const OfficialFigmaReference: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Reproduces the official DGA Dropdown List Item example (node `3262:27949`): a group label followed by single-select rows in every state, then multi-select rows.',
      },
    },
  },
  render: () => (
    <ul role="listbox" style={{ listStyle: 'none', margin: 0, padding: 0, width: '320px' }}>
      <DropdownListItem type="groupLabel">Group label</DropdownListItem>
      <DropdownListItem divider>Option</DropdownListItem>
      <DropdownListItem active divider>
        Active option
      </DropdownListItem>
      <DropdownListItem selected divider>
        Selected option
      </DropdownListItem>
      <DropdownListItem disabled>Disabled option</DropdownListItem>
      <DropdownListItem type="multiSelectOption">Multi-select option</DropdownListItem>
      <DropdownListItem type="multiSelectOption" selected>
        Selected multi-select option
      </DropdownListItem>
    </ul>
  ),
};
