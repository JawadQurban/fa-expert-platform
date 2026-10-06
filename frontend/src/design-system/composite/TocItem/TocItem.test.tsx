import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, expectNoA11yViolations } from '@/test/test-utils';
import { TocItem } from './TocItem';

describe('TocItem', () => {
  it('renders a button with the given label', () => {
    renderWithProviders(<TocItem>Page Section</TocItem>);
    expect(screen.getByRole('button', { name: 'Page Section' })).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const onClick = vi.fn();
    const { user } = renderWithProviders(<TocItem onClick={onClick}>Page Section</TocItem>);
    await user.click(screen.getByRole('button', { name: 'Page Section' }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('reflects selected via aria-current and data-selected', () => {
    renderWithProviders(<TocItem selected>Page Section</TocItem>);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-current', 'true');
    expect(button).toHaveAttribute('data-selected', 'true');
  });

  it('has no aria-current or data-selected when not selected', () => {
    renderWithProviders(<TocItem>Page Section</TocItem>);
    const button = screen.getByRole('button');
    expect(button).not.toHaveAttribute('aria-current');
    expect(button).not.toHaveAttribute('data-selected');
  });

  it('renders one nesting bar for level 2 and two for level 3', () => {
    const { container: level2 } = renderWithProviders(<TocItem level={2}>Sub section</TocItem>);
    expect(level2.querySelectorAll('[class*="nestingBar"]')).toHaveLength(1);

    const { container: level3 } = renderWithProviders(<TocItem level={3}>Sub sub section</TocItem>);
    expect(level3.querySelectorAll('[class*="nestingBar"]')).toHaveLength(2);
  });

  it('renders no nesting bars at level 1 (default)', () => {
    const { container } = renderWithProviders(<TocItem>Top level</TocItem>);
    expect(container.querySelectorAll('[class*="nestingBar"]')).toHaveLength(0);
  });

  it('has no accessibility violations', async () => {
    const { container } = renderWithProviders(<TocItem>Page Section</TocItem>);
    await expectNoA11yViolations(container);
  });

  it('has no accessibility violations when selected', async () => {
    const { container } = renderWithProviders(<TocItem selected>Page Section</TocItem>);
    await expectNoA11yViolations(container);
  });
});
