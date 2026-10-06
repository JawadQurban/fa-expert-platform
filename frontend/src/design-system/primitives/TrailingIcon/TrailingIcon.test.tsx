import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, expectNoA11yViolations } from '@/test/test-utils';
import { TrailingIcon } from './TrailingIcon';

const icon = <svg aria-hidden="true" />;

describe('TrailingIcon', () => {
  it('renders an icon-only button with the given accessible label', () => {
    renderWithProviders(<TrailingIcon icon={icon} label="مسح" />);
    expect(screen.getByRole('button', { name: 'مسح' })).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const onClick = vi.fn();
    const { user } = renderWithProviders(
      <TrailingIcon icon={icon} label="مسح" onClick={onClick} />
    );
    await user.click(screen.getByRole('button', { name: 'مسح' }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('is disabled and non-clickable when disabled', async () => {
    const onClick = vi.fn();
    const { user } = renderWithProviders(
      <TrailingIcon icon={icon} label="مسح" disabled onClick={onClick} />
    );
    const button = screen.getByRole('button', { name: 'مسح' });
    expect(button).toBeDisabled();
    await user.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('renders a hidden tooltip panel with the label text, not shown by default', () => {
    renderWithProviders(<TrailingIcon icon={icon} label="مسح" />);
    const panel = screen.getByRole('tooltip');
    expect(panel).toHaveTextContent('مسح');
    expect(panel).not.toHaveAttribute('data-open');
  });

  it('shows the panel on focus and links it via aria-describedby', async () => {
    const { user } = renderWithProviders(<TrailingIcon icon={icon} label="مسح" />);
    const button = screen.getByRole('button', { name: 'مسح' });
    await user.tab();
    expect(button).toHaveFocus();
    const panel = screen.getByRole('tooltip');
    expect(panel).toHaveAttribute('data-open', 'true');
    expect(button).toHaveAttribute('aria-describedby', panel.id);
  });

  it('hides the panel on blur', async () => {
    const { user } = renderWithProviders(
      <>
        <TrailingIcon icon={icon} label="مسح" />
        <button type="button">آخر</button>
      </>
    );
    await user.tab();
    expect(screen.getByRole('tooltip')).toHaveAttribute('data-open', 'true');
    await user.tab();
    expect(screen.getByRole('tooltip')).not.toHaveAttribute('data-open');
  });

  it('hides the panel on Escape', async () => {
    const { user } = renderWithProviders(<TrailingIcon icon={icon} label="مسح" />);
    await user.tab();
    expect(screen.getByRole('tooltip')).toHaveAttribute('data-open', 'true');
    await user.keyboard('{Escape}');
    expect(screen.getByRole('tooltip')).not.toHaveAttribute('data-open');
  });

  it('has no accessibility violations', async () => {
    const { container } = renderWithProviders(<TrailingIcon icon={icon} label="مسح" />);
    await expectNoA11yViolations(container);
  });

  it('has no accessibility violations when disabled', async () => {
    const { container } = renderWithProviders(<TrailingIcon icon={icon} label="مسح" disabled />);
    await expectNoA11yViolations(container);
  });
});
