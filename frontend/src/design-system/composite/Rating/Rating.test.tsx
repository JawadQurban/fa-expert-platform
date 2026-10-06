import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, within, expectNoA11yViolations } from '@/test/test-utils';
import { Rating } from './Rating';

describe('Rating', () => {
  it('renders a read-only role="img" display with an aggregate label when onChange is omitted', () => {
    renderWithProviders(<Rating value={3.5} />);
    const rating = screen.getByRole('img', { name: 'Rating: 3.5 out of 5' });
    expect(rating).toBeInTheDocument();
    expect(within(rating).queryAllByRole('button')).toHaveLength(0);
  });

  it('uses a custom label for the read-only display when provided', () => {
    renderWithProviders(<Rating value={4} label="Average customer rating" />);
    expect(screen.getByRole('img', { name: 'Average customer rating' })).toBeInTheDocument();
  });

  it('renders real independently-focusable buttons per star when onChange is given', () => {
    renderWithProviders(<Rating value={3} onChange={() => {}} max={5} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(5);
    expect(buttons[0]).toHaveAttribute('aria-label', '1 of 5');
    expect(buttons[4]).toHaveAttribute('aria-label', '5 of 5');
  });

  it('marks stars up to the current value as aria-pressed', () => {
    renderWithProviders(<Rating value={3} onChange={() => {}} max={5} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons[0]).toHaveAttribute('aria-pressed', 'true');
    expect(buttons[2]).toHaveAttribute('aria-pressed', 'true');
    expect(buttons[3]).toHaveAttribute('aria-pressed', 'false');
  });

  it('calls onChange with the clicked star value', async () => {
    const onChange = vi.fn();
    const { user } = renderWithProviders(<Rating value={2} onChange={onChange} max={5} />);
    await user.click(screen.getByRole('button', { name: '4 of 5' }));
    expect(onChange).toHaveBeenCalledWith(4);
  });

  it('prefixes each star label with a custom label when interactive', () => {
    renderWithProviders(<Rating value={2} onChange={() => {}} label="Rate this product" />);
    expect(screen.getByRole('button', { name: 'Rate this product: 3 of 5' })).toBeInTheDocument();
  });

  it('applies the size and brand data attributes', () => {
    const { container } = renderWithProviders(<Rating value={3} size="sm" brand />);
    const root = container.firstElementChild;
    expect(root).toHaveAttribute('data-size', 'sm');
    expect(root).toHaveAttribute('data-brand', 'true');
  });

  it('has no accessibility violations in read-only mode', async () => {
    const { container } = renderWithProviders(<Rating value={3.5} />);
    await expectNoA11yViolations(container);
  });

  it('has no accessibility violations in interactive mode', async () => {
    const { container } = renderWithProviders(
      <Rating value={3} onChange={() => {}} label="Rate this" />
    );
    await expectNoA11yViolations(container);
  });
});
