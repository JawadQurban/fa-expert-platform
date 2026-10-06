import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, expectNoA11yViolations } from '@/test/test-utils';
import { HeaderSubMenuItem } from './HeaderSubMenuItem';

describe('HeaderSubMenuItem', () => {
  it('renders a button with the given label', () => {
    renderWithProviders(<HeaderSubMenuItem label="Menu Item Label" />);
    expect(screen.getByRole('button', { name: 'Menu Item Label' })).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const onClick = vi.fn();
    const { user } = renderWithProviders(
      <HeaderSubMenuItem label="Menu Item Label" onClick={onClick} />
    );
    await user.click(screen.getByRole('button', { name: 'Menu Item Label' }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('renders helper text when given', () => {
    renderWithProviders(<HeaderSubMenuItem label="Label" helperText="Helper text" />);
    expect(screen.getByText('Helper text')).toBeInTheDocument();
  });

  it('renders without helper text when none is given', () => {
    renderWithProviders(<HeaderSubMenuItem label="Label" />);
    expect(screen.queryByText('Helper text')).not.toBeInTheDocument();
  });

  it('renders the tag slot when given', () => {
    renderWithProviders(<HeaderSubMenuItem label="Label" tag={<span>New</span>} />);
    expect(screen.getByText('New')).toBeInTheDocument();
  });

  it('applies data-oncolor when onColor is true', () => {
    renderWithProviders(<HeaderSubMenuItem label="Label" onColor />);
    expect(screen.getByRole('button')).toHaveAttribute('data-oncolor', 'true');
  });

  it('has no accessibility violations', async () => {
    const { container } = renderWithProviders(
      <HeaderSubMenuItem
        label="Label"
        helperText="Helper text"
        icon={<svg aria-hidden="true" />}
        tag={<span>New</span>}
      />
    );
    await expectNoA11yViolations(container);
  });
});
