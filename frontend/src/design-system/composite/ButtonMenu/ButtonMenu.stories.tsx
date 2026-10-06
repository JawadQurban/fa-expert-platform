import type { Meta, StoryObj } from '@storybook/react';
import { Icon } from '@ds/primitives';
import { ButtonMenu } from './ButtonMenu';
import { Menu, MenuSection } from '../Menu/Menu';
import { MenuListItem } from '../MenuListItem/MenuListItem';

const demoMenu = (
  <Menu>
    <MenuSection label="Group label">
      <MenuListItem>Item one</MenuListItem>
      <MenuListItem>Item two</MenuListItem>
      <MenuListItem>Item three</MenuListItem>
    </MenuSection>
  </Menu>
);

const meta = {
  title: 'Composite/ButtonMenu',
  component: ButtonMenu,
  parameters: {
    docs: {
      description: {
        component:
          'DGA registry "Button-menu" — live-Figma-verified (see docs/FIGMA_BUTTON_MENU_SPECIFICATION.md). A `Button` that toggles a composed `Menu` panel.',
      },
    },
  },
  args: {
    children: 'Button',
    menu: demoMenu,
  },
} satisfies Meta<typeof ButtonMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = { args: { variant: 'primary' } };
export const Neutral: Story = { args: { variant: 'neutral' } };
export const SecondarySolid: Story = { args: { variant: 'secondarySolid' } };
export const Secondary: Story = { args: { variant: 'secondary' } };
export const Subtle: Story = { args: { variant: 'subtle' } };
export const Transparent: Story = { args: { variant: 'tertiary' } };

export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
      <ButtonMenu {...args} size="sm" />
      <ButtonMenu {...args} size="md" />
      <ButtonMenu {...args} size="lg" />
    </div>
  ),
};

export const WithLeadingIcon: Story = {
  args: { icon: <Icon name="information-circle" size="sm" decorative /> },
};

export const IconOnly: Story = {
  args: {
    children: undefined,
    'aria-label': 'Open menu',
    icon: <Icon name="information-circle" size="sm" decorative />,
  },
};

export const Disabled: Story = { args: { disabled: true } };

export const OfficialFigmaReference: Story = {
  args: { variant: 'primary', size: 'md' },
};

export const RTL: Story = {
  render: (args) => (
    <div dir="rtl">
      <ButtonMenu {...args}>قائمة</ButtonMenu>
    </div>
  ),
};
