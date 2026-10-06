import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, expectNoA11yViolations } from '@/test/test-utils';
import { Pagination } from './Pagination';

describe('Pagination', () => {
  it('renders a labelled navigation landmark', () => {
    renderWithProviders(
      <Pagination page={1} pageCount={5} onPageChange={vi.fn()} label="ترقيم الصفحات" />
    );
    expect(screen.getByRole('navigation', { name: 'ترقيم الصفحات' })).toBeInTheDocument();
  });

  it('marks the current page with aria-current', () => {
    renderWithProviders(<Pagination page={3} pageCount={5} onPageChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: '3' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: '2' })).not.toHaveAttribute('aria-current');
  });

  it('disables Previous on the first page and Next on the last page', () => {
    renderWithProviders(
      <Pagination
        page={1}
        pageCount={5}
        onPageChange={vi.fn()}
        previousLabel="السابق"
        nextLabel="التالي"
      />
    );
    expect(screen.getByRole('button', { name: 'السابق' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'التالي' })).not.toBeDisabled();
  });

  it('renders Previous/Next as icon-only buttons (no visible text, accessible name via aria-label)', () => {
    renderWithProviders(
      <Pagination
        page={2}
        pageCount={5}
        onPageChange={vi.fn()}
        previousLabel="السابق"
        nextLabel="التالي"
      />
    );
    const prev = screen.getByRole('button', { name: 'السابق' });
    expect(prev).toHaveAttribute('aria-label', 'السابق');
    expect(prev.textContent).toBe('');
  });

  it('calls onPageChange with the target page', async () => {
    const onPageChange = vi.fn();
    const { user } = renderWithProviders(
      <Pagination page={2} pageCount={5} onPageChange={onPageChange} />
    );
    await user.click(screen.getByRole('button', { name: '3' }));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it('calls onPageChange via keyboard activation (native button Enter)', async () => {
    const onPageChange = vi.fn();
    const { user } = renderWithProviders(
      <Pagination page={2} pageCount={5} onPageChange={onPageChange} />
    );
    screen.getByRole('button', { name: '3' }).focus();
    await user.keyboard('{Enter}');
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it('collapses distant pages behind a non-interactive ellipsis', () => {
    renderWithProviders(<Pagination page={1} pageCount={20} onPageChange={vi.fn()} />);
    const ellipsis = screen.getByText('…');
    expect(ellipsis).toBeInTheDocument();
    expect(ellipsis).toHaveAttribute('aria-hidden', 'true');
    expect(ellipsis.tagName).not.toBe('BUTTON');
    expect(screen.getByRole('button', { name: '20' })).toBeInTheDocument();
  });

  it('renders every size without altering behavior', () => {
    (['sm', 'md', 'lg'] as const).forEach((size) => {
      const { unmount, container } = renderWithProviders(
        <Pagination page={2} pageCount={5} onPageChange={vi.fn()} size={size} />
      );
      expect(container.querySelector(`[data-size="${size}"]`)).toBeInTheDocument();
      unmount();
    });
  });

  it('renders correctly under RTL', () => {
    renderWithProviders(
      <div dir="rtl">
        <Pagination page={2} pageCount={5} onPageChange={vi.fn()} label="ترقيم الصفحات" />
      </div>
    );
    expect(screen.getByRole('navigation', { name: 'ترقيم الصفحات' })).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = renderWithProviders(
      <Pagination page={3} pageCount={10} onPageChange={vi.fn()} label="ترقيم الصفحات" />
    );
    await expectNoA11yViolations(container);
  });

  it('has no accessibility violations with an ellipsis present', async () => {
    const { container } = renderWithProviders(
      <Pagination page={1} pageCount={20} onPageChange={vi.fn()} label="ترقيم الصفحات" />
    );
    await expectNoA11yViolations(container);
  });
});
