import { describe, expect, it } from 'vitest';
import { renderWithProviders, screen, expectNoA11yViolations } from '@/test/test-utils';
import { Loading } from './Loading';

describe('Loading', () => {
  it('renders a status region with an accessible label', () => {
    renderWithProviders(<Loading label="جارٍ التحميل" />);
    const status = screen.getByRole('status', { name: 'جارٍ التحميل' });
    expect(status).toHaveAttribute('aria-busy', 'true');
  });

  it('renders a spinner by default', () => {
    const { container } = renderWithProviders(<Loading />);
    expect(container.querySelector('[data-variant="spinner"]')).toBeInTheDocument();
  });

  it('renders every live-verified size', () => {
    (['xxs', 'xs', 'sm', 'md', 'lg', 'xl', 'xxl'] as const).forEach((size) => {
      const { container, unmount } = renderWithProviders(<Loading size={size} />);
      expect(container.querySelector(`[data-size="${size}"]`)).toBeInTheDocument();
      unmount();
    });
  });

  it('renders every live-verified mood', () => {
    (['neutral', 'primary', 'onColor'] as const).forEach((mood) => {
      const { container, unmount } = renderWithProviders(<Loading mood={mood} />);
      expect(container.querySelector(`[data-mood="${mood}"]`)).toBeInTheDocument();
      unmount();
    });
  });

  it('renders the requested number of skeleton lines', () => {
    const { container } = renderWithProviders(
      <Loading variant="skeleton" lines={4} label="جارٍ التحميل" />
    );
    expect(container.querySelectorAll('[class*="skeletonLine"]')).toHaveLength(4);
  });

  it('renders correctly under RTL', () => {
    renderWithProviders(
      <div dir="rtl">
        <Loading label="جارٍ التحميل" />
      </div>
    );
    expect(screen.getByRole('status', { name: 'جارٍ التحميل' })).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = renderWithProviders(<Loading label="جارٍ التحميل" />);
    await expectNoA11yViolations(container);
  });

  it('has no accessibility violations as a skeleton', async () => {
    const { container } = renderWithProviders(<Loading variant="skeleton" label="جارٍ التحميل" />);
    await expectNoA11yViolations(container);
  });
});
