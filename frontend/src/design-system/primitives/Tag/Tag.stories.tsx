import type { Meta, StoryObj } from '@storybook/react';
import { Tag } from './Tag';

const meta = {
  title: 'Primitives/Tag',
  component: Tag,
  parameters: {
    docs: {
      description: {
        component:
          'Verified live against the official Platforms Code Figma Tag component set (`docs/FIGMA_TAG_SPECIFICATION.md`). Status variants (success/error/warning/information) are for status only (DC-05); use neutral for categories, onColor for placement on a dark surface. No official `Primary` style exists on the live component.',
      },
    },
  },
  args: { children: 'تشغيل' },
  argTypes: {
    variant: {
      control: 'inline-radio',
      options: ['neutral', 'success', 'error', 'warning', 'information', 'onColor'],
    },
    size: {
      control: 'inline-radio',
      options: ['xs', 'sm', 'md'],
    },
  },
} satisfies Meta<typeof Tag>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Neutral: Story = { args: { variant: 'neutral', children: 'تصنيف' } };

export const StatusSet: Story = {
  name: 'Status (status-only)',
  render: () => (
    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
      <Tag variant="success">مقبول</Tag>
      <Tag variant="error">غير مقبول</Tag>
      <Tag variant="warning">قيد المراجعة</Tag>
      <Tag variant="information">مُرسل</Tag>
    </div>
  ),
};

export const OnColor: Story = {
  render: () => (
    <div style={{ background: '#14573a', padding: '0.75rem', display: 'flex', gap: '0.5rem' }}>
      <Tag variant="onColor">تصنيف</Tag>
      <Tag variant="onColor" outline>
        تصنيف
      </Tag>
    </div>
  ),
};

export const Outline: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
      <Tag variant="neutral" outline>
        تصنيف
      </Tag>
      <Tag variant="success" outline>
        مقبول
      </Tag>
      <Tag variant="error" outline>
        غير مقبول
      </Tag>
      <Tag variant="warning" outline>
        قيد المراجعة
      </Tag>
      <Tag variant="information" outline>
        مُرسل
      </Tag>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <Tag size="md">Medium</Tag>
      <Tag size="sm">Small</Tag>
      <Tag size="xs">x Small</Tag>
    </div>
  ),
};

export const Rounded: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '0.5rem' }}>
      <Tag variant="success" rounded>
        مقبول
      </Tag>
      <Tag variant="success" rounded outline>
        مقبول
      </Tag>
    </div>
  ),
};

export const IconOnly: Story = {
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <Tag aria-label="تنبيه" iconStart={<span aria-hidden="true">!</span>} />
      <Tag aria-label="تنبيه" size="sm" iconStart={<span aria-hidden="true">!</span>} />
      <Tag aria-label="تنبيه" size="xs" iconStart={<span aria-hidden="true">!</span>} />
    </div>
  ),
};

export const RTL: Story = {
  render: () => (
    <div dir="rtl" style={{ display: 'flex', gap: '0.5rem' }}>
      <Tag
        variant="success"
        iconStart={<span aria-hidden="true">✓</span>}
        iconEnd={<span aria-hidden="true">›</span>}
      >
        مقبول
      </Tag>
      <Tag variant="neutral" outline>
        تصنيف
      </Tag>
    </div>
  ),
};
