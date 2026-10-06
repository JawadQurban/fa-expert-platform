import type { Meta, StoryObj } from '@storybook/react';
import { Icon, Tag, Switch } from '@ds/primitives';
import { MenuListItem } from '../MenuListItem/MenuListItem';
import { Menu, MenuSection } from './Menu';

const meta = {
  title: 'Composite/Menu',
  component: Menu,
  parameters: {
    docs: {
      description: {
        component:
          'Verified live against the official Platforms Code Figma Menu component set (`docs/FIGMA_MENU_SPECIFICATION.md`). Renders only the floating panel content (grouped `MenuSection`s of `MenuListItem`s) — no trigger/positioning behavior, the same scope boundary this project already drew between `DropdownListItem` and `Select`.',
      },
    },
  },
  args: {
    children: (
      <MenuSection label="Group label">
        <MenuListItem>Item Label</MenuListItem>
      </MenuSection>
    ),
  },
} satisfies Meta<typeof Menu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Menu>
      <MenuSection label="Group label">
        <MenuListItem icon={<Icon name="add-01" decorative />}>Item Label</MenuListItem>
        <MenuListItem icon={<Icon name="add-01" decorative />}>Item Label</MenuListItem>
        <MenuListItem icon={<Icon name="add-01" decorative />}>Item Label</MenuListItem>
      </MenuSection>
    </Menu>
  ),
};

export const MultipleSections: Story = {
  render: () => (
    <Menu>
      <MenuSection label="Group label">
        <MenuListItem icon={<Icon name="add-01" decorative />} selected>
          Item Label
        </MenuListItem>
        <MenuListItem icon={<Icon name="add-01" decorative />}>Item Label</MenuListItem>
        <MenuListItem icon={<Icon name="add-01" decorative />}>Item Label</MenuListItem>
      </MenuSection>
      <MenuSection label="Group label">
        <MenuListItem
          icon={<Icon name="add-01" decorative />}
          trailing={<Switch label={<span className="fads-visually-hidden">تفعيل</span>} />}
        >
          Item Label
        </MenuListItem>
        <MenuListItem
          icon={<Icon name="add-01" decorative />}
          trailing={<Switch label={<span className="fads-visually-hidden">تفعيل</span>} />}
        >
          Item Label
        </MenuListItem>
      </MenuSection>
      <MenuSection label="Group label">
        <MenuListItem icon={<Icon name="add-01" decorative />} trailing={<Tag>Label</Tag>}>
          Item Label
        </MenuListItem>
        <MenuListItem
          icon={<Icon name="add-01" decorative />}
          trailing={<Tag variant="success">Label</Tag>}
        >
          Item Label
        </MenuListItem>
      </MenuSection>
    </Menu>
  ),
};

export const WithoutGroupLabels: Story = {
  render: () => (
    <Menu>
      <MenuSection>
        <MenuListItem icon={<Icon name="add-01" decorative />}>Item Label</MenuListItem>
        <MenuListItem icon={<Icon name="add-01" decorative />}>Item Label</MenuListItem>
      </MenuSection>
    </Menu>
  ),
};

export const RTL: Story = {
  render: () => (
    <div dir="rtl">
      <Menu>
        <MenuSection label="عنوان مجموعة">
          <MenuListItem icon={<Icon name="add-01" decorative />}>نص العنصر</MenuListItem>
          <MenuListItem icon={<Icon name="add-01" decorative />}>نص العنصر</MenuListItem>
        </MenuSection>
      </Menu>
    </div>
  ),
};

export const OfficialFigmaReference: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Reproduces the official DGA Menu example (node `30195:22214`): 3 grouped sections showing plain, Switch-trailing, and Tag-trailing items.',
      },
    },
  },
  render: () => (
    <Menu>
      <MenuSection label="Group label">
        <MenuListItem icon={<Icon name="add-01" decorative />}>Item Label</MenuListItem>
        <MenuListItem icon={<Icon name="add-01" decorative />}>Item Label</MenuListItem>
        <MenuListItem icon={<Icon name="add-01" decorative />}>Item Label</MenuListItem>
      </MenuSection>
      <MenuSection label="Group label">
        <MenuListItem
          icon={<Icon name="add-01" decorative />}
          trailing={<Switch label={<span className="fads-visually-hidden">Enable</span>} />}
        >
          Item Label
        </MenuListItem>
        <MenuListItem
          icon={<Icon name="add-01" decorative />}
          trailing={<Switch label={<span className="fads-visually-hidden">Enable</span>} />}
        >
          Item Label
        </MenuListItem>
        <MenuListItem
          icon={<Icon name="add-01" decorative />}
          trailing={<Switch label={<span className="fads-visually-hidden">Enable</span>} />}
        >
          Item Label
        </MenuListItem>
      </MenuSection>
      <MenuSection label="Group label">
        <MenuListItem icon={<Icon name="add-01" decorative />} trailing={<Tag>Label</Tag>}>
          Item Label
        </MenuListItem>
        <MenuListItem
          icon={<Icon name="add-01" decorative />}
          trailing={<Tag variant="success">Label</Tag>}
        >
          Item Label
        </MenuListItem>
        <MenuListItem
          icon={<Icon name="add-01" decorative />}
          trailing={<Tag variant="information">Label</Tag>}
        >
          Item Label
        </MenuListItem>
        <MenuListItem
          icon={<Icon name="add-01" decorative />}
          trailing={<Tag variant="warning">Label</Tag>}
        >
          Item Label
        </MenuListItem>
        <MenuListItem
          icon={<Icon name="add-01" decorative />}
          trailing={<Tag variant="error">Label</Tag>}
        >
          Item Label
        </MenuListItem>
      </MenuSection>
    </Menu>
  ),
};
