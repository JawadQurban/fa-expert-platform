import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, expectNoA11yViolations } from '@/test/test-utils';
import { FloatingButton } from './FloatingButton';

const icon = <svg aria-hidden="true" />;

describe('FloatingButton', () => {
  it('renders an icon-only button with the given accessible label', () => {
    renderWithProviders(<FloatingButton icon={icon} aria-label="إجراء" />);
    expect(screen.getByRole('button', { name: 'إجراء' })).toBeInTheDocument();
  });

  it('renders a visible label when children are given', () => {
    renderWithProviders(<FloatingButton icon={icon}>Button</FloatingButton>);
    expect(screen.getByRole('button', { name: 'Button' })).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const onClick = vi.fn();
    const { user } = renderWithProviders(
      <FloatingButton icon={icon} aria-label="إجراء" onClick={onClick} />
    );
    await user.click(screen.getByRole('button', { name: 'إجراء' }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it.each(['neutral', 'primary', 'secondarySolid'] as const)('accepts variant="%s"', (variant) => {
    renderWithProviders(<FloatingButton icon={icon} aria-label="إجراء" variant={variant} />);
    expect(screen.getByRole('button')).toHaveAttribute('data-variant', variant);
  });

  it('defaults to variant="neutral" (the official Figma default style)', () => {
    renderWithProviders(<FloatingButton icon={icon} aria-label="إجراء" />);
    expect(screen.getByRole('button')).toHaveAttribute('data-variant', 'neutral');
  });

  it.each(['sm', 'lg'] as const)('accepts size="%s"', (size) => {
    renderWithProviders(<FloatingButton icon={icon} aria-label="إجراء" size={size} />);
    expect(screen.getByRole('button')).toHaveAttribute('data-size', size);
  });

  it('exposes onColor via data-on-color', () => {
    renderWithProviders(<FloatingButton icon={icon} aria-label="إجراء" onColor />);
    expect(screen.getByRole('button')).toHaveAttribute('data-on-color', 'true');
  });

  it('reflects a selected state via aria-pressed and data-selected', () => {
    renderWithProviders(<FloatingButton icon={icon} aria-label="إجراء" selected />);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-pressed', 'true');
    expect(button).toHaveAttribute('data-selected', 'true');
  });

  it('is disabled and non-clickable when disabled', async () => {
    const onClick = vi.fn();
    const { user } = renderWithProviders(
      <FloatingButton icon={icon} aria-label="إجراء" disabled onClick={onClick} />
    );
    const button = screen.getByRole('button', { name: 'إجراء' });
    expect(button).toBeDisabled();
    await user.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  describe('icon-only accessible name', () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('warns in dev when icon-only and missing an accessible name', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      renderWithProviders(<FloatingButton icon={icon} />);
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('accessible name'));
    });

    it('does not warn when icon-only has an aria-label', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      renderWithProviders(<FloatingButton icon={icon} aria-label="إجراء" />);
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('does not warn when a visible label is present', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      renderWithProviders(<FloatingButton icon={icon}>Button</FloatingButton>);
      expect(warnSpy).not.toHaveBeenCalled();
    });
  });

  it('has no accessibility violations', async () => {
    const { container } = renderWithProviders(<FloatingButton icon={icon} aria-label="إجراء" />);
    await expectNoA11yViolations(container);
  });

  it('has no accessibility violations with a visible label', async () => {
    const { container } = renderWithProviders(<FloatingButton icon={icon}>Button</FloatingButton>);
    await expectNoA11yViolations(container);
  });

  it('has no accessibility violations when disabled', async () => {
    const { container } = renderWithProviders(
      <FloatingButton icon={icon} aria-label="إجراء" disabled />
    );
    await expectNoA11yViolations(container);
  });
});
