import type { Meta, StoryObj } from '@storybook/react';
import { List } from './List';
import { ListItem } from '../ListItem/ListItem';

const meta = {
  title: 'Composite/List',
  component: List,
  parameters: {
    docs: {
      description: {
        component:
          'DGA registry "List" — live-Figma-verified (see docs/FIGMA_LIST_SPECIFICATION.md). A thin semantic `<ul>`/`<ol>` wrapper composing `ListItem`s.',
      },
    },
  },
  args: {
    children: <ListItem marker="-">List item</ListItem>,
  },
} satisfies Meta<typeof List>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Unordered: Story = {
  render: () => (
    <List type="unordered">
      <ListItem marker="-">First item</ListItem>
      <ListItem marker="-">Second item</ListItem>
      <ListItem marker="-">Third item</ListItem>
    </List>
  ),
};

export const Ordered: Story = {
  render: () => (
    <List type="ordered">
      <ListItem type="ordered" marker="1-">
        First item
      </ListItem>
      <ListItem type="ordered" marker="2-">
        Second item
      </ListItem>
      <ListItem type="ordered" marker="3-">
        Third item
      </ListItem>
    </List>
  ),
};

export const OfficialFigmaReference: Story = {
  render: () => (
    <List type="ordered">
      <ListItem type="ordered" marker="1-">
        List item
      </ListItem>
      <ListItem type="ordered" level={2} marker="a-">
        List item
      </ListItem>
      <ListItem type="ordered" level={2} marker="b-">
        List item
      </ListItem>
      <ListItem type="ordered" level={2} marker="c-">
        List item
      </ListItem>
    </List>
  ),
};

export const RTL: Story = {
  render: () => (
    <div dir="rtl">
      <List type="ordered">
        <ListItem type="ordered" marker="-1">
          عنصر قائمة
        </ListItem>
        <ListItem type="ordered" level={2} marker="-أ">
          عنصر قائمة
        </ListItem>
      </List>
    </div>
  ),
};
