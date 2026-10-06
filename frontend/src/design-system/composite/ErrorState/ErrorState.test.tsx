import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, expectNoA11yViolations } from '@/test/test-utils';
import { ErrorState } from './ErrorState';

describe('ErrorState', () => {
  it('renders as an Inline Alert with role="alert"', () => {
    renderWithProviders(<ErrorState title="خطأ" description="تعذر تحميل البيانات." />);
    expect(screen.getByRole('alert')).toHaveTextContent('تعذر تحميل البيانات.');
  });

  it('does not render a retry button when onRetry is omitted', () => {
    renderWithProviders(<ErrorState description="تعذر تحميل البيانات." />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders a retry button and calls onRetry when activated', async () => {
    const onRetry = vi.fn();
    const { user } = renderWithProviders(
      <ErrorState
        description="تعذر تحميل البيانات."
        onRetry={onRetry}
        retryLabel="إعادة المحاولة"
      />
    );
    await user.click(screen.getByRole('button', { name: 'إعادة المحاولة' }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('has no accessibility violations', async () => {
    const { container } = renderWithProviders(
      <ErrorState
        title="خطأ"
        description="تعذر تحميل البيانات."
        onRetry={vi.fn()}
        retryLabel="إعادة المحاولة"
      />
    );
    await expectNoA11yViolations(container);
  });
});
