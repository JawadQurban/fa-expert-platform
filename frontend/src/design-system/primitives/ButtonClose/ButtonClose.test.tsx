import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, expectNoA11yViolations } from '@/test/test-utils';
import { ButtonClose } from './ButtonClose';

describe('ButtonClose', () => {
  it('renders an icon-only button with the given accessible label', () => {
    renderWithProviders(<ButtonClose label="إغلاق" />);
    expect(screen.getByRole('button', { name: 'إغلاق' })).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const onClick = vi.fn();
    const { user } = renderWithProviders(<ButtonClose label="إغلاق" onClick={onClick} />);
    await user.click(screen.getByRole('button', { name: 'إغلاق' }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it.each(['xs', 'sm', 'md', 'lg'] as const)('accepts size="%s"', (size) => {
    renderWithProviders(<ButtonClose label="إغلاق" size={size} />);
    expect(screen.getByRole('button')).toHaveAttribute('data-size', size);
  });

  it('defaults to size="xs" (the official Figma default variant)', () => {
    renderWithProviders(<ButtonClose label="إغلاق" />);
    expect(screen.getByRole('button')).toHaveAttribute('data-size', 'xs');
  });

  it('exposes onColor via data-oncolor', () => {
    renderWithProviders(<ButtonClose label="إغلاق" onColor />);
    expect(screen.getByRole('button')).toHaveAttribute('data-oncolor', 'true');
  });

  it('omits data-oncolor when onColor is false (default)', () => {
    renderWithProviders(<ButtonClose label="إغلاق" />);
    expect(screen.getByRole('button')).not.toHaveAttribute('data-oncolor');
  });

  it('is disabled and non-clickable when disabled', async () => {
    const onClick = vi.fn();
    const { user } = renderWithProviders(<ButtonClose label="إغلاق" disabled onClick={onClick} />);
    const button = screen.getByRole('button', { name: 'إغلاق' });
    expect(button).toBeDisabled();
    await user.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('has no accessibility violations', async () => {
    const { container } = renderWithProviders(<ButtonClose label="إغلاق" />);
    await expectNoA11yViolations(container);
  });

  it('has no accessibility violations on a colored surface', async () => {
    const { container } = renderWithProviders(<ButtonClose label="إغلاق" onColor />);
    await expectNoA11yViolations(container);
  });

  it('has no accessibility violations when disabled', async () => {
    const { container } = renderWithProviders(<ButtonClose label="إغلاق" disabled />);
    await expectNoA11yViolations(container);
  });
});
