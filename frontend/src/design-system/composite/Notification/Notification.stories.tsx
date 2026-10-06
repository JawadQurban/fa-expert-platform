import type { Meta, StoryObj } from '@storybook/react';
import { Button, Link } from '@ds/primitives';
import { Notification } from './Notification';

const meta = {
  title: 'Composite/Notification',
  component: Notification,
  parameters: {
    docs: {
      description: {
        component:
          'DGA CMP-24 — page-level banner, live-Figma-verified (see docs/FIGMA_NOTIFICATION_SPECIFICATION.md). Distinct from the already-Approved `Alert` (in-context) and `Toast` (transient overlay) — a slim, full-width, single-row banner. The `error` tone uses `role="alert"`; other tones use `role="status"`.',
      },
    },
  },
  args: {
    title: 'إشعار على مستوى الصفحة',
    children: 'يرجى العلم أن الصيانة المجدولة ستبدأ الساعة العاشرة مساءً.',
  },
} satisfies Meta<typeof Notification>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Neutral: Story = { args: { tone: 'neutral' } };
export const Info: Story = {};
export const Success: Story = {
  args: { tone: 'success', title: 'تم بنجاح', children: 'تم إرسال طلبك.' },
};
export const Warning: Story = {
  args: { tone: 'warning', title: 'تنبيه هام', children: 'يرجى تحديث بياناتك.' },
};
export const Error: Story = {
  args: { tone: 'error', title: 'خطأ في النظام', children: 'الخدمة غير متاحة حاليًا.' },
};
export const Dismissible: Story = {
  args: { dismissible: true, dismissLabel: 'إغلاق' },
};

/**
 * Matches the live Figma reference composition (node `30150:56889`): icon + lead text + message +
 * inline link + inline solid action button + dismiss. `action` composes `Button
 * variant="neutral"` and `link` composes `Link mood="neutral"` — the live-verified official
 * mapping, see the spec's composition guidance §3.
 */
export const OfficialFigmaReference: Story = {
  args: {
    tone: 'error',
    title: 'Important:',
    children: 'This is a very important banner message that requires attention',
    dismissible: true,
    dismissLabel: 'Close',
    link: (
      <Link href="#" mood="neutral">
        Learn more
      </Link>
    ),
    action: <Button variant="neutral">Action Button</Button>,
  },
};

export const RTL: Story = {
  render: (args) => (
    <div dir="rtl">
      <Notification {...args} />
    </div>
  ),
};
