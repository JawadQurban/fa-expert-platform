import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, expectNoA11yViolations } from '@/test/test-utils';
import { Alert } from './Alert';

describe('Alert', () => {
  it('renders the title and description', () => {
    renderWithProviders(<Alert title="تنبيه">يرجى مراجعة البيانات.</Alert>);
    expect(screen.getByText('تنبيه')).toBeInTheDocument();
    expect(screen.getByText('يرجى مراجعة البيانات.')).toBeInTheDocument();
  });

  it('renders every official tone (Neutral/Info/Destructive/Warning/Success)', () => {
    (['neutral', 'info', 'success', 'warning', 'error'] as const).forEach((tone) => {
      const { container, unmount } = renderWithProviders(<Alert tone={tone}>رسالة</Alert>);
      expect(container.querySelector(`[data-tone="${tone}"]`)).toBeInTheDocument();
      unmount();
    });
  });

  it('uses role="status" for info/success/neutral tones by default', () => {
    (['info', 'success', 'neutral'] as const).forEach((tone) => {
      const { unmount } = renderWithProviders(<Alert tone={tone}>رسالة</Alert>);
      expect(screen.getByRole('status')).toBeInTheDocument();
      unmount();
    });
  });

  it('uses role="alert" for warning/error tones by default', () => {
    (['warning', 'error'] as const).forEach((tone) => {
      const { unmount } = renderWithProviders(<Alert tone={tone}>رسالة</Alert>);
      expect(screen.getByRole('alert')).toBeInTheDocument();
      unmount();
    });
  });

  it('does not blindly hardcode role="alert" — an explicit role prop overrides the tone default', () => {
    renderWithProviders(
      <Alert tone="error" role="status">
        رسالة
      </Alert>
    );
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('renders a tone-appropriate default icon when none is provided', () => {
    const { container } = renderWithProviders(<Alert tone="success">تم الحفظ بنجاح.</Alert>);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders a caller-supplied icon override, always decorative', () => {
    renderWithProviders(
      <Alert tone="success" icon={<svg data-testid="alert-icon" />}>
        رسالة
      </Alert>
    );
    const icon = screen.getByTestId('alert-icon');
    expect(icon.closest('[aria-hidden="true"]')).toBeInTheDocument();
  });

  it('renders a primary and secondary action together', () => {
    renderWithProviders(
      <Alert
        tone="error"
        action={<button type="button">إعادة المحاولة</button>}
        secondaryAction={<button type="button">تجاهل</button>}
      >
        رسالة
      </Alert>
    );
    expect(screen.getByRole('button', { name: 'إعادة المحاولة' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'تجاهل' })).toBeInTheDocument();
  });

  it('applies the tinted surface (backgroundColor=Color)', () => {
    const { container } = renderWithProviders(
      <Alert surface="tinted" tone="info">
        رسالة
      </Alert>
    );
    expect(container.querySelector('[data-surface="tinted"]')).toBeInTheDocument();
  });

  it('applies the official Mobile stacked layout', () => {
    const { container } = renderWithProviders(
      <Alert mobile tone="warning">
        رسالة
      </Alert>
    );
    expect(container.querySelector('[data-mobile]')).toBeInTheDocument();
  });

  it('calls onDismiss when the dismiss button is activated by click', async () => {
    const onDismiss = vi.fn();
    const { user } = renderWithProviders(
      <Alert dismissible onDismiss={onDismiss} dismissLabel="إغلاق">
        رسالة
      </Alert>
    );
    await user.click(screen.getByRole('button', { name: 'إغلاق' }));
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it('calls onDismiss via the keyboard (Enter)', async () => {
    const onDismiss = vi.fn();
    const { user } = renderWithProviders(
      <Alert dismissible onDismiss={onDismiss} dismissLabel="إغلاق">
        رسالة
      </Alert>
    );
    screen.getByRole('button', { name: 'إغلاق' }).focus();
    await user.keyboard('{Enter}');
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it('does not render a dismiss button by default', () => {
    renderWithProviders(<Alert>رسالة</Alert>);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders long content without breaking layout (wraps, does not throw)', () => {
    const longText =
      'نص طويل جدًا '.repeat(30) + 'نهاية النص التوضيحي الطويل الذي يجب أن يلتف داخل التنبيه.';
    renderWithProviders(
      <Alert title="عنوان" tone="info">
        {longText}
      </Alert>
    );
    expect(screen.getByText(longText)).toBeInTheDocument();
  });

  it('renders correctly under RTL', () => {
    renderWithProviders(
      <div dir="rtl">
        <Alert title="تنبيه">رسالة تنبيه</Alert>
      </div>
    );
    expect(screen.getByText('تنبيه')).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = renderWithProviders(
      <Alert title="تنبيه" tone="warning" dismissible dismissLabel="إغلاق">
        رسالة تنبيه
      </Alert>
    );
    await expectNoA11yViolations(container);
  });

  it('has no accessibility violations with dual actions', async () => {
    const { container } = renderWithProviders(
      <Alert
        title="خطأ"
        tone="error"
        action={<button type="button">إعادة المحاولة</button>}
        secondaryAction={<button type="button">تجاهل</button>}
      >
        رسالة
      </Alert>
    );
    await expectNoA11yViolations(container);
  });

  it('has no accessibility violations in the Mobile layout', async () => {
    const { container } = renderWithProviders(
      <Alert title="تنبيه" tone="warning" mobile dismissible dismissLabel="إغلاق">
        رسالة
      </Alert>
    );
    await expectNoA11yViolations(container);
  });

  it('has no accessibility violations for every tone × surface combination', async () => {
    for (const tone of ['info', 'success', 'warning', 'error', 'neutral'] as const) {
      for (const surface of ['white', 'tinted'] as const) {
        const { container, unmount } = renderWithProviders(
          <Alert tone={tone} surface={surface} title="عنوان">
            رسالة
          </Alert>
        );
        await expectNoA11yViolations(container);
        unmount();
      }
    }
  });
});
