import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Button, Icon } from '@ds/primitives';
import { Modal } from './Modal';

const meta = {
  title: 'Composite/Modal',
  component: Modal,
  parameters: {
    docs: {
      description: {
        component:
          'DGA CMP-25, live-Figma-verified (see docs/FIGMA_MODAL_SPECIFICATION.md). Confirmation/feedback/alert only — never for large data entry (DC-13). Focus trap + restore, `Esc` closes, `aria-modal` + labelled. The close control composes the already-Approved `ButtonClose`.',
      },
    },
  },
  args: {
    open: true,
    onClose: () => {},
    title: 'تأكيد الإرسال',
    dismissLabel: 'إغلاق',
    children: 'هل أنت متأكد من إرسال ابتكارك؟ لا يمكن التراجع عن هذا الإجراء لاحقًا.',
  },
  render: (args) => {
    function Demo() {
      const [open, setOpen] = useState(true);
      return (
        <>
          <Button onClick={() => setOpen(true)}>فتح مربع الحوار</Button>
          <Modal
            {...args}
            open={open}
            onClose={() => setOpen(false)}
            footer={
              <>
                <Button variant="tertiary" onClick={() => setOpen(false)}>
                  إلغاء
                </Button>
                <Button variant="primary" onClick={() => setOpen(false)}>
                  تأكيد
                </Button>
              </>
            }
          />
        </>
      );
    }
    return <Demo />;
  },
} satisfies Meta<typeof Modal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const DestructiveConfirmation: Story = {
  args: {
    title: 'سحب الطلب',
    children: 'سيتم سحب طلبك نهائيًا. هذا الإجراء لا يمكن التراجع عنه.',
    dismissOnScrimClick: false,
  },
};

export const WithIcon: Story = {
  args: {
    icon: <Icon name="information-circle" size="sm" />,
  },
};

/**
 * Composes the live-verified official button-variant mapping for the Modal Actions row:
 * `Primary Action` → `Button` `variant="neutral"` (byte-identical `#0d121c` fill), `Secondary`/
 * `Tertiary Action` → `variant="secondary"` (bordered) — see the compliance report §"Composition
 * guidance for footer".
 */
export const OfficialFigmaReference: Story = {
  args: {
    title: 'Title goes here',
    dismissLabel: 'Close',
    children: 'When a Modal needs a further detailed explanation, it goes here.',
    icon: <Icon name="information-circle" size="sm" />,
  },
  render: (args) => {
    function Demo() {
      const [open, setOpen] = useState(true);
      return (
        <>
          <Button onClick={() => setOpen(true)}>Open dialog</Button>
          <Modal
            {...args}
            open={open}
            onClose={() => setOpen(false)}
            footer={
              <>
                <Button variant="secondary" onClick={() => setOpen(false)}>
                  Tertiary action
                </Button>
                <Button variant="secondary" onClick={() => setOpen(false)}>
                  Secondary action
                </Button>
                <Button variant="neutral" onClick={() => setOpen(false)}>
                  Primary action
                </Button>
              </>
            }
          />
        </>
      );
    }
    return <Demo />;
  },
};

/** Actions stack full-width below the 480px media-query breakpoint — shrink the Storybook viewport to see it. */
export const MobileStackedActions: Story = {
  render: (args) => {
    function Demo() {
      const [open, setOpen] = useState(true);
      return (
        <>
          <Button onClick={() => setOpen(true)}>فتح مربع الحوار</Button>
          <Modal
            {...args}
            open={open}
            onClose={() => setOpen(false)}
            footer={
              <>
                <Button variant="neutral" onClick={() => setOpen(false)}>
                  تأكيد
                </Button>
                <Button variant="secondary" onClick={() => setOpen(false)}>
                  إلغاء
                </Button>
              </>
            }
          />
        </>
      );
    }
    return <Demo />;
  },
  parameters: { viewport: { defaultViewport: 'mobile1' } },
};

export const RTL: Story = {
  render: (args) => (
    <div dir="rtl">
      <Modal {...args} icon={<Icon name="information-circle" size="sm" />} />
    </div>
  ),
};
