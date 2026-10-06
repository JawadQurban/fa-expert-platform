import type { Meta, StoryObj } from '@storybook/react';
import { Link } from './Link';

const meta = {
  title: 'Primitives/Link',
  component: Link,
  parameters: {
    docs: {
      description: {
        component:
          'Verified live against the official Platforms Code Figma Link component set (`docs/FIGMA_LINK_SPECIFICATION.md`). The external-link marker is a placeholder pending the official DGA icon library (Q8).',
      },
    },
  },
  args: { children: 'اقرأ المزيد', href: '#' },
} satisfies Meta<typeof Link>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const External: Story = { args: { external: true, children: 'زيارة موقع الأكاديمية' } };
export const Disabled: Story = { args: { disabled: true } };

export const Moods: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: '1.5rem' }}>
      <Link {...args} mood="primary">
        Primary
      </Link>
      <Link {...args} mood="neutral">
        Neutral
      </Link>
      <div style={{ background: '#14573a', padding: '0.5rem 1rem' }}>
        <Link {...args} mood="onColor">
          On-color
        </Link>
      </div>
    </div>
  ),
};

export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
      <Link {...args} size="md">
        Medium
      </Link>
      <Link {...args} size="sm">
        Small
      </Link>
    </div>
  ),
};

export const Inline: Story = {
  render: (args) => (
    <p style={{ maxInlineSize: '32rem' }}>
      لمزيد من المعلومات يمكنك <Link {...args}>الاطلاع على الدليل</Link> (standalone, underlines
      only on hover) أو{' '}
      <Link {...args} inline>
        زيارة الموقع الرسمي
      </Link>{' '}
      (inline, always underlined).
    </p>
  ),
};

export const InPageContext: Story = {
  render: (args) => (
    <p style={{ maxInlineSize: '32rem' }}>
      لمزيد من المعلومات يمكنك <Link {...args}>الاطلاع على الدليل</Link> أو{' '}
      <Link {...args} external>
        زيارة الموقع الرسمي
      </Link>
      .
    </p>
  ),
};

export const RTL: Story = {
  render: (args) => (
    <div dir="rtl" style={{ display: 'flex', gap: '1.5rem' }}>
      <Link {...args} external>
        رابط خارجي
      </Link>
      <Link {...args} disabled>
        رابط معطّل
      </Link>
    </div>
  ),
};
