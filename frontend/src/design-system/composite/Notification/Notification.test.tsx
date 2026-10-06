import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, expectNoA11yViolations } from '@/test/test-utils';
import { Notification } from './Notification';

describe('Notification', () => {
  it('renders the title and message', () => {
    renderWithProviders(<Notification title="إشعار">هذا محتوى الإشعار.</Notification>);
    expect(screen.getByText('إشعار')).toBeInTheDocument();
    expect(screen.getByText('هذا محتوى الإشعار.')).toBeInTheDocument();
  });

  it('uses role="status" for non-error tones', () => {
    renderWithProviders(<Notification tone="success">تم التحديث.</Notification>);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('uses role="alert" for the error tone', () => {
    renderWithProviders(<Notification tone="error">حدث خطأ عام.</Notification>);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('calls onDismiss when the dismiss button is activated', async () => {
    const onDismiss = vi.fn();
    const { user } = renderWithProviders(
      <Notification dismissible onDismiss={onDismiss} dismissLabel="إغلاق">
        رسالة
      </Notification>
    );
    await user.click(screen.getByRole('button', { name: 'إغلاق' }));
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it('has no accessibility violations', async () => {
    const { container } = renderWithProviders(
      <Notification title="إشعار" tone="error" dismissible dismissLabel="إغلاق">
        رسالة إشعار
      </Notification>
    );
    await expectNoA11yViolations(container);
  });

  it('defaults to the info tone', () => {
    renderWithProviders(<Notification>رسالة</Notification>);
    expect(screen.getByRole('status')).toHaveAttribute('data-tone', 'info');
  });

  it('applies the neutral tone', () => {
    renderWithProviders(<Notification tone="neutral">رسالة</Notification>);
    expect(screen.getByRole('status')).toHaveAttribute('data-tone', 'neutral');
  });

  it('renders link and action slots inline', async () => {
    const onAction = vi.fn();
    const { user } = renderWithProviders(
      <Notification
        link={<a href="#more">اعرف المزيد</a>}
        action={
          <button type="button" onClick={onAction}>
            إجراء
          </button>
        }
      >
        رسالة
      </Notification>
    );
    expect(screen.getByRole('link', { name: 'اعرف المزيد' })).toBeInTheDocument();
    const actionButton = screen.getByRole('button', { name: 'إجراء' });
    expect(actionButton).toBeInTheDocument();
    await user.click(actionButton);
    expect(onAction).toHaveBeenCalledOnce();
  });

  it('renders a custom icon override', () => {
    renderWithProviders(
      <Notification icon={<svg data-testid="custom-notification-icon" aria-hidden="true" />}>
        رسالة
      </Notification>
    );
    expect(screen.getByTestId('custom-notification-icon')).toBeInTheDocument();
  });

  it('has no accessibility violations with links and actions across every tone', async () => {
    for (const tone of ['neutral', 'info', 'success', 'warning', 'error'] as const) {
      const { container, unmount } = renderWithProviders(
        <Notification
          title="إشعار"
          tone={tone}
          dismissible
          dismissLabel="إغلاق"
          link={<a href="#more">اعرف المزيد</a>}
          action={<button type="button">إجراء</button>}
        >
          رسالة إشعار
        </Notification>
      );
      await expectNoA11yViolations(container);
      unmount();
    }
  });
});
