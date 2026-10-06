import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, expectNoA11yViolations } from '@/test/test-utils';
import { InputPrefixSuffix } from './InputPrefixSuffix';

describe('InputPrefixSuffix', () => {
  it('renders an icon-only button with the given accessible label', () => {
    renderWithProviders(<InputPrefixSuffix icon="plus" label="زيادة" />);
    expect(screen.getByRole('button', { name: 'زيادة' })).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const onClick = vi.fn();
    const { user } = renderWithProviders(
      <InputPrefixSuffix icon="minus" label="إنقاص" onClick={onClick} />
    );
    await user.click(screen.getByRole('button', { name: 'إنقاص' }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it.each(['lg', 'md'] as const)('accepts size="%s"', (size) => {
    renderWithProviders(<InputPrefixSuffix icon="plus" label="زيادة" size={size} />);
    expect(screen.getByRole('button')).toHaveAttribute('data-size', size);
  });

  it.each(['solid', 'subtle'] as const)('accepts variant="%s"', (variant) => {
    renderWithProviders(<InputPrefixSuffix icon="plus" label="زيادة" variant={variant} />);
    expect(screen.getByRole('button')).toHaveAttribute('data-variant', variant);
  });

  it('reflects a selected state via aria-pressed', () => {
    renderWithProviders(<InputPrefixSuffix icon="plus" label="زيادة" selected />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
  });

  it('is disabled and non-clickable when disabled', async () => {
    const onClick = vi.fn();
    const { user } = renderWithProviders(
      <InputPrefixSuffix icon="plus" label="زيادة" disabled onClick={onClick} />
    );
    const button = screen.getByRole('button', { name: 'زيادة' });
    expect(button).toBeDisabled();
    await user.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('has no accessibility violations', async () => {
    const { container } = renderWithProviders(<InputPrefixSuffix icon="plus" label="زيادة" />);
    await expectNoA11yViolations(container);
  });

  it('has no accessibility violations when disabled', async () => {
    const { container } = renderWithProviders(
      <InputPrefixSuffix icon="minus" label="إنقاص" disabled />
    );
    await expectNoA11yViolations(container);
  });
});
