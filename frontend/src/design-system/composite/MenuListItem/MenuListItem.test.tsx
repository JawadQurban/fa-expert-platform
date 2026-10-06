import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, expectNoA11yViolations } from '@/test/test-utils';
import { MenuListItem } from './MenuListItem';

const icon = <svg aria-hidden="true" />;

describe('MenuListItem', () => {
  it('renders a button with the given label', () => {
    renderWithProviders(<MenuListItem icon={icon}>Item Label</MenuListItem>);
    expect(screen.getByRole('button', { name: 'Item Label' })).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const onClick = vi.fn();
    const { user } = renderWithProviders(
      <MenuListItem icon={icon} onClick={onClick}>
        Item Label
      </MenuListItem>
    );
    await user.click(screen.getByRole('button', { name: 'Item Label' }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('reflects selected via aria-pressed and data-selected', () => {
    renderWithProviders(
      <MenuListItem icon={icon} selected>
        Item Label
      </MenuListItem>
    );
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-pressed', 'true');
    expect(button).toHaveAttribute('data-selected', 'true');
  });

  it('is disabled and non-clickable when disabled', async () => {
    const onClick = vi.fn();
    const { user } = renderWithProviders(
      <MenuListItem icon={icon} disabled onClick={onClick}>
        Item Label
      </MenuListItem>
    );
    const button = screen.getByRole('button', { name: 'Item Label' });
    expect(button).toBeDisabled();
    await user.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('renders trailing content passed via the trailing slot', () => {
    renderWithProviders(
      <MenuListItem icon={icon} trailing={<span>+99</span>}>
        Item Label
      </MenuListItem>
    );
    expect(screen.getByText('+99')).toBeInTheDocument();
  });

  it('renders without a leading icon when none is given', () => {
    renderWithProviders(<MenuListItem>Item Label</MenuListItem>);
    expect(screen.getByRole('button', { name: 'Item Label' })).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = renderWithProviders(<MenuListItem icon={icon}>Item Label</MenuListItem>);
    await expectNoA11yViolations(container);
  });

  it('has no accessibility violations when selected', async () => {
    const { container } = renderWithProviders(
      <MenuListItem icon={icon} selected>
        Item Label
      </MenuListItem>
    );
    await expectNoA11yViolations(container);
  });

  it('has no accessibility violations when disabled', async () => {
    const { container } = renderWithProviders(
      <MenuListItem icon={icon} disabled>
        Item Label
      </MenuListItem>
    );
    await expectNoA11yViolations(container);
  });
});
