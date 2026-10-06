import { describe, expect, it } from 'vitest';
import { renderWithProviders as render, screen } from '@/test/test-utils';
import { ItemIcon } from './ItemIcon';

describe('ItemIcon', () => {
  it('renders the given icon content', () => {
    render(<ItemIcon icon={<svg data-testid="glyph" />} />);
    expect(screen.getByTestId('glyph')).toBeInTheDocument();
  });

  it('is decorative (aria-hidden)', () => {
    const { container } = render(<ItemIcon icon={<svg />} />);
    expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
  });

  it('applies data-contained when contained is true', () => {
    const { container } = render(<ItemIcon icon={<svg />} contained />);
    expect(container.querySelector('[data-contained]')).toBeInTheDocument();
  });

  it('has no data-contained by default', () => {
    const { container } = render(<ItemIcon icon={<svg />} />);
    expect(container.querySelector('[data-contained]')).not.toBeInTheDocument();
  });

  it('applies data-oncolor when onColor is true', () => {
    const { container } = render(<ItemIcon icon={<svg />} onColor />);
    expect(container.querySelector('[data-oncolor]')).toBeInTheDocument();
  });
});
