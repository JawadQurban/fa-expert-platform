import { act } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, renderWithProviders, screen, expectNoA11yViolations } from '@/test/test-utils';
import { ToastProvider } from './ToastProvider';
import { useToast } from './useToast';
import type { ToastOptions } from './useToast';

function TestHarness({ toast }: { toast: ToastOptions }) {
  const { showToast } = useToast();
  return (
    <button type="button" onClick={() => showToast(toast)}>
      إظهار الإشعار
    </button>
  );
}

describe('Toast / ToastProvider', () => {
  it('throws when useToast is used outside a ToastProvider', () => {
    const ThrowingComponent = () => {
      useToast();
      return null;
    };
    expect(() => renderWithProviders(<ThrowingComponent />)).toThrow(/ToastProvider/);
  });

  it('shows a toast with role="status" when triggered', () => {
    renderWithProviders(
      <ToastProvider>
        <TestHarness toast={{ description: 'تم الحفظ بنجاح', duration: null }} />
      </ToastProvider>
    );
    fireEvent.click(screen.getByRole('button', { name: 'إظهار الإشعار' }));
    expect(screen.getByRole('status')).toHaveTextContent('تم الحفظ بنجاح');
  });

  it('dismisses manually via the close button', () => {
    renderWithProviders(
      <ToastProvider>
        <TestHarness
          toast={{ description: 'تم الحفظ بنجاح', duration: null, dismissLabel: 'إغلاق' }}
        />
      </ToastProvider>
    );
    fireEvent.click(screen.getByRole('button', { name: 'إظهار الإشعار' }));
    fireEvent.click(screen.getByRole('button', { name: 'إغلاق' }));
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  describe('with fake timers', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });
    afterEach(() => {
      vi.useRealTimers();
    });

    it('auto-dismisses after the given duration', () => {
      renderWithProviders(
        <ToastProvider>
          <TestHarness toast={{ description: 'تم الحفظ بنجاح', duration: 1000 }} />
        </ToastProvider>
      );
      fireEvent.click(screen.getByRole('button', { name: 'إظهار الإشعار' }));
      expect(screen.getByRole('status')).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    it('pauses the auto-dismiss timer on hover and resumes on leave', () => {
      renderWithProviders(
        <ToastProvider>
          <TestHarness toast={{ description: 'تم الحفظ بنجاح', duration: 1000 }} />
        </ToastProvider>
      );
      fireEvent.click(screen.getByRole('button', { name: 'إظهار الإشعار' }));
      const toast = screen.getByRole('status');

      act(() => {
        vi.advanceTimersByTime(500);
      });
      fireEvent.mouseEnter(toast);
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(screen.getByRole('status')).toBeInTheDocument();

      fireEvent.mouseLeave(toast);
      act(() => {
        vi.advanceTimersByTime(500);
      });
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
  });

  it('renders only one viewport landmark when nested inside another ToastProvider, and warns', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    renderWithProviders(
      <ToastProvider label="الإشعارات">
        <ToastProvider label="الإشعارات">
          <TestHarness toast={{ description: 'تم الحفظ بنجاح', duration: null }} />
        </ToastProvider>
      </ToastProvider>
    );
    fireEvent.click(screen.getByRole('button', { name: 'إظهار الإشعار' }));

    expect(screen.getAllByRole('region', { name: 'الإشعارات' })).toHaveLength(1);
    expect(screen.getByRole('status')).toHaveTextContent('تم الحفظ بنجاح');
    expect(consoleError).toHaveBeenCalledWith(
      expect.stringContaining('mounted inside another ToastProvider')
    );

    consoleError.mockRestore();
  });

  it('has no accessibility violations', async () => {
    const { container } = renderWithProviders(
      <ToastProvider label="الإشعارات">
        <TestHarness
          toast={{
            title: 'نجاح',
            description: 'تم الحفظ بنجاح',
            duration: null,
            dismissLabel: 'إغلاق',
          }}
        />
      </ToastProvider>
    );
    fireEvent.click(screen.getByRole('button', { name: 'إظهار الإشعار' }));
    await expectNoA11yViolations(container);
  });

  it('defaults to the info tone', () => {
    renderWithProviders(
      <ToastProvider>
        <TestHarness toast={{ description: 'تم الحفظ بنجاح', duration: null }} />
      </ToastProvider>
    );
    fireEvent.click(screen.getByRole('button', { name: 'إظهار الإشعار' }));
    expect(screen.getByRole('status')).toHaveAttribute('data-tone', 'info');
  });

  it('applies the requested tone', () => {
    renderWithProviders(
      <ToastProvider>
        <TestHarness toast={{ description: 'تم الحذف', duration: null, tone: 'error' }} />
      </ToastProvider>
    );
    fireEvent.click(screen.getByRole('button', { name: 'إظهار الإشعار' }));
    expect(screen.getByRole('status')).toHaveAttribute('data-tone', 'error');
  });

  it('renders the actions row when action/secondaryAction are provided', () => {
    const onConfirm = vi.fn();
    renderWithProviders(
      <ToastProvider>
        <TestHarness
          toast={{
            description: 'تراجع عن الإجراء؟',
            duration: null,
            action: (
              <button type="button" onClick={onConfirm}>
                تراجع
              </button>
            ),
            secondaryAction: <button type="button">تجاهل</button>,
          }}
        />
      </ToastProvider>
    );
    fireEvent.click(screen.getByRole('button', { name: 'إظهار الإشعار' }));
    expect(screen.getByRole('button', { name: 'تراجع' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'تجاهل' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'تراجع' }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it('renders a custom icon override', () => {
    renderWithProviders(
      <ToastProvider>
        <TestHarness
          toast={{
            description: 'تم الحفظ بنجاح',
            duration: null,
            icon: <svg data-testid="custom-toast-icon" aria-hidden="true" />,
          }}
        />
      </ToastProvider>
    );
    fireEvent.click(screen.getByRole('button', { name: 'إظهار الإشعار' }));
    expect(screen.getByTestId('custom-toast-icon')).toBeInTheDocument();
  });

  it('has no accessibility violations with actions and every tone', async () => {
    for (const tone of ['neutral', 'info', 'success', 'warning', 'error'] as const) {
      const { container, unmount } = renderWithProviders(
        <ToastProvider label="الإشعارات">
          <TestHarness
            toast={{
              title: 'عنوان',
              description: 'وصف الإشعار',
              duration: null,
              tone,
              dismissLabel: 'إغلاق',
              action: <button type="button">إجراء</button>,
            }}
          />
        </ToastProvider>
      );
      fireEvent.click(screen.getByRole('button', { name: 'إظهار الإشعار' }));
      await expectNoA11yViolations(container);
      unmount();
    }
  });
});
