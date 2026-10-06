import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '@ds/primitives';
import { Toast } from './Toast';
import { ToastProvider } from './ToastProvider';
import { useToast } from './useToast';
import type { ToastTone } from './Toast';

/**
 * `Toast` itself is an internal building block — most stories exercise the
 * public API (`ToastProvider` + `useToast`).
 */
function ToastDemo({ tone }: { tone: ToastTone }) {
  const { showToast } = useToast();
  return (
    <Button
      onClick={() =>
        showToast({
          tone,
          title: 'إشعار',
          description: 'تم إرسال ابتكارك بنجاح.',
          dismissLabel: 'إغلاق',
        })
      }
    >
      إظهار إشعار ({tone})
    </Button>
  );
}

const meta = {
  title: 'Composite/Toast',
  component: ToastDemo,
  parameters: {
    docs: {
      description: {
        component:
          'DGA CMP-22 (`PAT-06`), live-Figma-verified (see docs/FIGMA_NOTIFICATION_TOAST_SPECIFICATION.md). Transient, auto-dismissing (5s default), stacked via `ToastProvider`; pauses on hover/focus; `role="status"`/`aria-live="polite"`. Same structure as the already-Approved `Alert`: featured icon, up to two actions, `ButtonClose` dismiss, tone-colored accent stripe.',
      },
    },
  },
  decorators: [
    (Story) => (
      <ToastProvider label="الإشعارات">
        <Story />
      </ToastProvider>
    ),
  ],
  args: { tone: 'info' },
} satisfies Meta<typeof ToastDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Neutral: Story = { args: { tone: 'neutral' } };
export const Info: Story = {};
export const Success: Story = { args: { tone: 'success' } };
export const Warning: Story = { args: { tone: 'warning' } };
export const Error: Story = { args: { tone: 'error' } };

function ToastWithActionsDemo() {
  const { showToast } = useToast();
  return (
    <Button
      onClick={() =>
        showToast({
          tone: 'warning',
          title: 'سحب الطلب؟',
          description: 'سيتم سحب طلبك. يمكنك التراجع خلال بضع ثوانٍ.',
          dismissLabel: 'إغلاق',
          action: (
            <Button variant="tertiary" size="sm">
              تراجع
            </Button>
          ),
          secondaryAction: (
            <Button variant="tertiary" size="sm">
              تجاهل
            </Button>
          ),
        })
      }
    >
      إظهار إشعار مع إجراءات
    </Button>
  );
}

export const WithActions: StoryObj<typeof ToastWithActionsDemo> = {
  render: () => <ToastWithActionsDemo />,
};

/**
 * Direct render of `Toast` (bypassing `ToastProvider`) at a narrow viewport, demonstrating the
 * live-verified mobile layout: icon + close in one row, full-width text below, stacked full-width
 * actions, top-edge accent stripe. The mobile action-button style (`secondarySolid`/`lg`) is not
 * automatically applied to consumer-supplied actions — see the spec's Needs Confirmation §5.
 */
export const MobileLayout: StoryObj<typeof Toast> = {
  render: () => (
    <div style={{ maxInlineSize: '21.4375rem' }}>
      <Toast
        tone="success"
        title="تم الإرسال بنجاح"
        dismissLabel="إغلاق"
        onDismiss={() => {}}
        duration={null}
        action={
          <Button variant="secondarySolid" size="lg" style={{ inlineSize: '100%' }}>
            عرض التفاصيل
          </Button>
        }
      >
        تم إرسال طلبك وسيتم مراجعته قريبًا.
      </Toast>
    </div>
  ),
};

export const RTL: StoryObj<typeof Toast> = {
  render: () => (
    <div dir="rtl" style={{ maxInlineSize: '30.25rem' }}>
      <Toast tone="info" title="إشعار" dismissLabel="إغلاق" onDismiss={() => {}} duration={null}>
        تم إرسال ابتكارك بنجاح.
      </Toast>
    </div>
  ),
};

export const LTR: StoryObj<typeof Toast> = {
  render: () => (
    <div dir="ltr" style={{ maxInlineSize: '30.25rem' }}>
      <Toast
        tone="info"
        title="Notification"
        dismissLabel="Dismiss"
        onDismiss={() => {}}
        duration={null}
      >
        Your submission was received successfully.
      </Toast>
    </div>
  ),
};
