import type { Meta, StoryObj } from '@storybook/react';
import { ListItem } from './ListItem';

/**
 * No `checkmark-circle` glyph exists in this codebase's Icon registry (the
 * same disclosed gap already accepted for `Alert`/`Toast`/`Notification`/
 * `ItemIcon`'s own missing checkmark) — hand-authored purely for visual
 * reference, matching the live Figma demo content.
 */
function CheckmarkCircleGlyph() {
  return (
    <svg viewBox="0 0 16 16" focusable="false" aria-hidden="true" width="16" height="16">
      <circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M4.5 8L7 10.5L11.5 5.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const meta = {
  title: 'Composite/ListItem',
  component: ListItem,
  parameters: {
    docs: {
      description: {
        component:
          'DGA registry "List item" — live-Figma-verified (see docs/FIGMA_LIST_ITEM_SPECIFICATION.md). A single `<li>`, meant to be composed inside a `<ul>`/`<ol>`.',
      },
    },
  },
  args: {
    children: 'List item',
  },
} satisfies Meta<typeof ListItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Unordered: Story = {
  render: (args) => (
    <ul
      style={{
        listStyle: 'none',
        margin: 0,
        padding: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      <ListItem {...args} type="unordered" marker="-" />
      <ListItem {...args} type="unordered" marker="-" />
    </ul>
  ),
};

export const Ordered: Story = {
  render: (args) => (
    <ol
      style={{
        listStyle: 'none',
        margin: 0,
        padding: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      <ListItem {...args} type="ordered" marker="1-" />
      <ListItem {...args} type="ordered" marker="2-" />
    </ol>
  ),
};

export const NestedLevel2: Story = {
  render: (args) => (
    <ul
      style={{
        listStyle: 'none',
        margin: 0,
        padding: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      <ListItem {...args} type="unordered" level={1} marker="-" />
      <ListItem {...args} type="unordered" level={2} marker="•">
        Nested list item
      </ListItem>
    </ul>
  ),
};

export const WithIcon: Story = {
  args: { type: 'icon', icon: <CheckmarkCircleGlyph /> },
};

export const Tones: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <ListItem type="unordered" marker="-" tone="primary">
        Primary tone
      </ListItem>
      <ListItem type="unordered" marker="-" tone="neutral">
        Neutral tone
      </ListItem>
      <div style={{ background: '#1b8354', padding: 8 }}>
        <ListItem type="unordered" marker="-" tone="onColor">
          On-color tone
        </ListItem>
      </div>
    </div>
  ),
};

export const OfficialFigmaReference: Story = {
  render: () => (
    <ul
      style={{
        listStyle: 'none',
        margin: 0,
        padding: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      <ListItem type="ordered" marker="1-">
        List item
      </ListItem>
      <ListItem type="ordered" level={2} marker="a-">
        List item
      </ListItem>
      <ListItem type="ordered" marker="2-">
        List item
      </ListItem>
    </ul>
  ),
};

export const RTL: Story = {
  render: () => (
    <div dir="rtl">
      <ul
        style={{
          listStyle: 'none',
          margin: 0,
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        <ListItem type="ordered" marker="-1">
          عنصر قائمة
        </ListItem>
      </ul>
    </div>
  ),
};
