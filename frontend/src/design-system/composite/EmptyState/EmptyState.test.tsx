import { describe, expect, it } from 'vitest';
import { renderWithProviders, screen, expectNoA11yViolations } from '@/test/test-utils';
import { EmptyState } from './EmptyState';

describe('EmptyState', () => {
  it('renders the title and description', () => {
    renderWithProviders(
      <EmptyState title="لا توجد طلبات" description="ابدأ بتقديم ابتكارك الأول." />
    );
    expect(screen.getByText('لا توجد طلبات')).toBeInTheDocument();
    expect(screen.getByText('ابدأ بتقديم ابتكارك الأول.')).toBeInTheDocument();
  });

  it('renders a decorative icon hidden from assistive tech', () => {
    const { container } = renderWithProviders(<EmptyState title="لا توجد طلبات" icon={<svg />} />);
    expect(container.querySelector('[aria-hidden="true"] svg')).toBeInTheDocument();
  });

  it('renders the action slot', () => {
    renderWithProviders(
      <EmptyState title="لا توجد طلبات" action={<button type="button">قدم ابتكارك</button>} />
    );
    expect(screen.getByRole('button', { name: 'قدم ابتكارك' })).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = renderWithProviders(
      <EmptyState
        title="لا توجد طلبات"
        description="ابدأ بتقديم ابتكارك الأول."
        action={<button type="button">قدم ابتكارك</button>}
      />
    );
    await expectNoA11yViolations(container);
  });
});
