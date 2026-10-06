import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, expectNoA11yViolations } from '@/test/test-utils';
import { NavDrawer } from './NavDrawer';

function ControlledDrawer() {
  const [open, setOpen] = useState(false);
  return (
    <NavDrawer open={open} onOpenChange={setOpen} title="التنقل" toggleLabel="فتح القائمة">
      <a href="/one">رابط أول</a>
      <a href="/two">رابط ثاني</a>
    </NavDrawer>
  );
}

describe('NavDrawer', () => {
  it('renders a named toggle button reflecting the open state', () => {
    renderWithProviders(<NavDrawer open={false} toggleLabel="فتح القائمة" />);
    expect(screen.getByRole('button', { name: 'فتح القائمة' })).toHaveAttribute(
      'aria-expanded',
      'false'
    );
  });

  it('opens when the toggle button is activated', async () => {
    const { user } = renderWithProviders(<ControlledDrawer />);
    await user.click(screen.getByRole('button', { name: 'فتح القائمة' }));
    expect(screen.getByRole('button', { name: 'فتح القائمة' })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
  });

  it('moves focus into the drawer and traps Tab when open', async () => {
    const { user } = renderWithProviders(<ControlledDrawer />);
    await user.click(screen.getByRole('button', { name: 'فتح القائمة' }));
    const first = screen.getByRole('link', { name: 'رابط أول' });
    const second = screen.getByRole('link', { name: 'رابط ثاني' });
    expect(first).toHaveFocus();
    await user.tab();
    expect(second).toHaveFocus();
    await user.tab();
    expect(first).toHaveFocus();
  });

  it('closes on Escape', async () => {
    const onOpenChange = vi.fn();
    const { user } = renderWithProviders(
      <NavDrawer open toggleLabel="فتح القائمة" onOpenChange={onOpenChange}>
        <a href="/one">رابط أول</a>
      </NavDrawer>
    );
    await user.keyboard('{Escape}');
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('marks the drawer inert while closed', () => {
    const { container } = renderWithProviders(
      <NavDrawer open={false} toggleLabel="فتح القائمة">
        <a href="/one">رابط أول</a>
      </NavDrawer>
    );
    expect(container.querySelector('aside')).toHaveAttribute('inert');
  });

  it('has no accessibility violations', async () => {
    const { container } = renderWithProviders(<ControlledDrawer />);
    await expectNoA11yViolations(container);
  });
});
