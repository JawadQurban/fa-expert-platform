import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, renderWithProviders, screen, expectNoA11yViolations } from '@/test/test-utils';
import { Modal } from './Modal';

function ControlledModal({ dismissOnScrimClick = true }: { dismissOnScrimClick?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        فتح
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="تأكيد الإرسال"
        dismissOnScrimClick={dismissOnScrimClick}
        dismissLabel="إغلاق"
        footer={
          <button type="button" onClick={() => setOpen(false)}>
            تأكيد
          </button>
        }
      >
        هل أنت متأكد من إرسال ابتكارك؟
      </Modal>
    </>
  );
}

describe('Modal', () => {
  it('renders nothing when closed', () => {
    renderWithProviders(<Modal open={false} onClose={vi.fn()} title="عنوان" />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders a labelled dialog when open, with focus moved inside', () => {
    renderWithProviders(
      <Modal open onClose={vi.fn()} title="تأكيد الإرسال" dismissLabel="إغلاق" />
    );
    const dialog = screen.getByRole('dialog', { name: 'تأكيد الإرسال' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByRole('button', { name: 'إغلاق' })).toHaveFocus();
  });

  it('closes on Escape', async () => {
    const onClose = vi.fn();
    const { user } = renderWithProviders(<Modal open onClose={onClose} title="عنوان" />);
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('closes when the close button is activated', async () => {
    const onClose = vi.fn();
    const { user } = renderWithProviders(
      <Modal open onClose={onClose} title="عنوان" dismissLabel="إغلاق" />
    );
    await user.click(screen.getByRole('button', { name: 'إغلاق' }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('restores focus to the trigger after closing', async () => {
    const { user } = renderWithProviders(<ControlledModal />);
    const trigger = screen.getByRole('button', { name: 'فتح' });
    await user.click(trigger);
    await user.click(screen.getByRole('button', { name: 'تأكيد' }));
    expect(trigger).toHaveFocus();
  });

  it('closes on scrim click when dismissOnScrimClick is true', () => {
    const onClose = vi.fn();
    renderWithProviders(<Modal open onClose={onClose} title="عنوان" />);
    const scrim = screen.getByRole('dialog').parentElement;
    expect(scrim).not.toBeNull();
    fireEvent.click(scrim!);
    expect(onClose).toHaveBeenCalled();
  });

  it('does not close on scrim click when dismissOnScrimClick is false', () => {
    const onClose = vi.fn();
    renderWithProviders(<Modal open onClose={onClose} title="عنوان" dismissOnScrimClick={false} />);
    const scrim = screen.getByRole('dialog').parentElement;
    fireEvent.click(scrim!);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('marks other document.body content inert while open, and restores it on close', () => {
    const { container, rerender } = renderWithProviders(
      <Modal open onClose={vi.fn()} title="عنوان" />
    );
    expect(container.inert).toBe(true);

    rerender(<Modal open={false} onClose={vi.fn()} title="عنوان" />);
    expect(container.inert).toBe(false);
  });

  it('does not mark other FADS document.body portals (data-fads-portal) inert', () => {
    const otherPortal = document.createElement('div');
    otherPortal.setAttribute('data-fads-portal', 'true');
    document.body.appendChild(otherPortal);

    renderWithProviders(<Modal open onClose={vi.fn()} title="عنوان" />);
    expect(otherPortal).not.toHaveAttribute('inert');

    document.body.removeChild(otherPortal);
  });

  it('has no accessibility violations', async () => {
    const { baseElement } = renderWithProviders(
      <Modal
        open
        onClose={vi.fn()}
        title="تأكيد الإرسال"
        dismissLabel="إغلاق"
        footer={<button type="button">تأكيد</button>}
      >
        هل أنت متأكد؟
      </Modal>
    );
    await expectNoA11yViolations(baseElement);
  });

  it('renders an optional featured icon when provided', () => {
    renderWithProviders(
      <Modal
        open
        onClose={vi.fn()}
        title="عنوان"
        icon={<svg data-testid="modal-icon" aria-hidden="true" />}
      />
    );
    expect(screen.getByTestId('modal-icon')).toBeInTheDocument();
  });

  it('renders no featured icon when omitted', () => {
    renderWithProviders(<Modal open onClose={vi.fn()} title="عنوان" />);
    expect(screen.queryByTestId('modal-icon')).not.toBeInTheDocument();
  });

  it('has no accessibility violations with a featured icon', async () => {
    const { baseElement } = renderWithProviders(
      <Modal
        open
        onClose={vi.fn()}
        title="تأكيد الإرسال"
        dismissLabel="إغلاق"
        icon={<svg aria-hidden="true" />}
        footer={<button type="button">تأكيد</button>}
      >
        هل أنت متأكد؟
      </Modal>
    );
    await expectNoA11yViolations(baseElement);
  });
});
