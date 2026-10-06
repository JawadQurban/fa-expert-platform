import type { Meta, StoryObj } from '@storybook/react';
import { Icon, Tag } from '@ds/primitives';
import { NavHeaderSubMenu, NavHeaderSubMenuColumn } from './NavHeaderSubMenu';
import { HeaderSubMenuItem } from '../HeaderSubMenuItem/HeaderSubMenuItem';

const meta = {
  title: 'Composite/NavHeaderSubMenu',
  component: NavHeaderSubMenu,
  parameters: {
    docs: {
      description: {
        component:
          'DGA registry "Nav Header Sub-Menu" — live-Figma-verified (see docs/FIGMA_NAV_HEADER_SUB_MENU_SPECIFICATION.md). The mega-menu panel for the Header nav.',
      },
    },
  },
  args: {
    children: (
      <NavHeaderSubMenuColumn label="Group Label">
        <HeaderSubMenuItem label="Menu Item Label" />
      </NavHeaderSubMenuColumn>
    ),
  },
} satisfies Meta<typeof NavHeaderSubMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TextOnly: Story = {
  render: () => (
    <NavHeaderSubMenu>
      <NavHeaderSubMenuColumn label="Group Label">
        <HeaderSubMenuItem label="Menu Item Label" />
        <HeaderSubMenuItem label="Menu Item Label" />
        <HeaderSubMenuItem label="Menu Item Label" />
      </NavHeaderSubMenuColumn>
      <NavHeaderSubMenuColumn label="Group Label">
        <HeaderSubMenuItem label="Menu Item Label" />
        <HeaderSubMenuItem label="Menu Item Label" />
      </NavHeaderSubMenuColumn>
    </NavHeaderSubMenu>
  ),
};

export const SimpleIcon: Story = {
  render: () => (
    <NavHeaderSubMenu>
      <NavHeaderSubMenuColumn label="Group Label">
        <HeaderSubMenuItem
          icon={<Icon name="information-circle" size="md" decorative />}
          label="Menu Item Label"
          helperText="Menu item helper text"
        />
        <HeaderSubMenuItem
          icon={<Icon name="information-circle" size="md" decorative />}
          label="Menu Item Label"
          helperText="Menu item helper text"
          tag={<Tag variant="success">New</Tag>}
        />
      </NavHeaderSubMenuColumn>
    </NavHeaderSubMenu>
  ),
};

export const BoxedIcon: Story = {
  render: () => (
    <NavHeaderSubMenu>
      <NavHeaderSubMenuColumn label="Group Label">
        <HeaderSubMenuItem
          icon={<Icon name="information-circle" size="md" decorative />}
          boxedIcon
          label="Menu Item Label"
          helperText="Menu item helper text"
        />
        <HeaderSubMenuItem
          icon={<Icon name="information-circle" size="md" decorative />}
          boxedIcon
          label="Menu Item Label"
          helperText="Menu item helper text"
        />
      </NavHeaderSubMenuColumn>
    </NavHeaderSubMenu>
  ),
};

export const OnColor: Story = {
  render: () => (
    <NavHeaderSubMenu onColor>
      <NavHeaderSubMenuColumn label="Group Label">
        <HeaderSubMenuItem onColor label="Menu Item Label" />
        <HeaderSubMenuItem onColor label="Menu Item Label" />
        <HeaderSubMenuItem onColor label="Menu Item Label" />
      </NavHeaderSubMenuColumn>
      <NavHeaderSubMenuColumn label="Group Label">
        <HeaderSubMenuItem onColor label="Menu Item Label" />
        <HeaderSubMenuItem onColor label="Menu Item Label" />
      </NavHeaderSubMenuColumn>
    </NavHeaderSubMenu>
  ),
};

export const OfficialFigmaReference: Story = {
  render: () => (
    <NavHeaderSubMenu>
      <NavHeaderSubMenuColumn label="Group Label">
        <HeaderSubMenuItem label="Menu Item Label" />
        <HeaderSubMenuItem label="Menu Item Label" />
        <HeaderSubMenuItem label="Menu Item Label" />
        <HeaderSubMenuItem label="Menu Item Label" />
      </NavHeaderSubMenuColumn>
      <NavHeaderSubMenuColumn label="Group Label">
        <HeaderSubMenuItem label="Menu Item Label" />
        <HeaderSubMenuItem label="Menu Item Label" />
        <HeaderSubMenuItem label="Menu Item Label" />
        <HeaderSubMenuItem label="Menu Item Label" />
      </NavHeaderSubMenuColumn>
      <NavHeaderSubMenuColumn label="Group Label">
        <HeaderSubMenuItem label="Menu Item Label" />
        <HeaderSubMenuItem label="Menu Item Label" />
        <HeaderSubMenuItem label="Menu Item Label" />
        <HeaderSubMenuItem label="Menu Item Label" />
      </NavHeaderSubMenuColumn>
      <NavHeaderSubMenuColumn label="Group Label">
        <HeaderSubMenuItem label="Menu Item Label" />
        <HeaderSubMenuItem label="Menu Item Label" />
        <HeaderSubMenuItem label="Menu Item Label" />
        <HeaderSubMenuItem label="Menu Item Label" />
      </NavHeaderSubMenuColumn>
    </NavHeaderSubMenu>
  ),
};

export const RTL: Story = {
  render: () => (
    <div dir="rtl">
      <NavHeaderSubMenu>
        <NavHeaderSubMenuColumn label="عنوان المجموعة">
          <HeaderSubMenuItem label="عنوان عنصر القائمة" />
          <HeaderSubMenuItem label="عنوان عنصر القائمة" />
        </NavHeaderSubMenuColumn>
      </NavHeaderSubMenu>
    </div>
  ),
};
