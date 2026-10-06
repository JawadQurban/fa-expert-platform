import type { Meta, StoryObj } from '@storybook/react';
import { Toc } from './Toc';
import { TocItem } from '../TocItem/TocItem';

const meta = {
  title: 'Composite/Toc',
  component: Toc,
  parameters: {
    docs: {
      description: {
        component:
          'DGA registry "TOC" — live-Figma-verified (see docs/FIGMA_TOC_SPECIFICATION.md). A heading above a stack of composed `TocItem`s.',
      },
    },
  },
  args: {
    title: '[Page Name]',
    children: <TocItem>Page Section</TocItem>,
  },
} satisfies Meta<typeof Toc>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Toc eyebrow="On this page" title="[Page Name]" aria-label="Table of contents">
      <TocItem selected>Page Section</TocItem>
      <TocItem>Page Section</TocItem>
      <TocItem>Page Section</TocItem>
    </Toc>
  ),
};

export const WithoutEyebrow: Story = {
  render: () => (
    <Toc title="[Page Name]" aria-label="Table of contents">
      <TocItem selected>Page Section</TocItem>
      <TocItem>Page Section</TocItem>
    </Toc>
  ),
};

export const OfficialFigmaReference: Story = {
  render: () => (
    <Toc eyebrow="On this page" title="[Page Name]" aria-label="Table of contents">
      <TocItem selected>Page Section</TocItem>
      <TocItem level={2}>Nested Page Section</TocItem>
      <TocItem level={2}>Nested Page Section</TocItem>
      <TocItem level={3}>Nested Page Section</TocItem>
      <TocItem level={3}>Nested Page Section</TocItem>
      <TocItem level={2}>Nested Page Section</TocItem>
      <TocItem>Page Section</TocItem>
      <TocItem>Page Section</TocItem>
    </Toc>
  ),
};

export const RTL: Story = {
  render: () => (
    <div dir="rtl">
      <Toc eyebrow="في هذه الصفحة" title="[اسم الصفحة]" aria-label="جدول المحتويات">
        <TocItem selected>قسم صفحة</TocItem>
        <TocItem level={2}>قسم فرعي</TocItem>
        <TocItem>قسم صفحة</TocItem>
      </Toc>
    </div>
  ),
};
