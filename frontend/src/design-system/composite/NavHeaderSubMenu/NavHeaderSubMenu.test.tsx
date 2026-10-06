import { describe, expect, it } from 'vitest';
import { renderWithProviders, screen, expectNoA11yViolations } from '@/test/test-utils';
import { NavHeaderSubMenu, NavHeaderSubMenuColumn } from './NavHeaderSubMenu';
import { HeaderSubMenuItem } from '../HeaderSubMenuItem/HeaderSubMenuItem';

describe('NavHeaderSubMenu', () => {
  it('renders composed columns with their group labels and items', () => {
    renderWithProviders(
      <NavHeaderSubMenu>
        <NavHeaderSubMenuColumn label="Group Label">
          <HeaderSubMenuItem label="Item One" />
          <HeaderSubMenuItem label="Item Two" />
        </NavHeaderSubMenuColumn>
      </NavHeaderSubMenu>
    );
    expect(screen.getByText('Group Label')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Item One' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Item Two' })).toBeInTheDocument();
  });

  it('renders multiple columns', () => {
    renderWithProviders(
      <NavHeaderSubMenu>
        <NavHeaderSubMenuColumn label="Column A">
          <HeaderSubMenuItem label="A Item" />
        </NavHeaderSubMenuColumn>
        <NavHeaderSubMenuColumn label="Column B">
          <HeaderSubMenuItem label="B Item" />
        </NavHeaderSubMenuColumn>
      </NavHeaderSubMenu>
    );
    expect(screen.getByText('Column A')).toBeInTheDocument();
    expect(screen.getByText('Column B')).toBeInTheDocument();
  });

  it('applies data-oncolor when onColor is true', () => {
    const { container } = renderWithProviders(
      <NavHeaderSubMenu onColor>
        <NavHeaderSubMenuColumn label="Group Label">
          <HeaderSubMenuItem onColor label="Item" />
        </NavHeaderSubMenuColumn>
      </NavHeaderSubMenu>
    );
    expect(container.querySelector('[data-oncolor]')).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = renderWithProviders(
      <NavHeaderSubMenu>
        <NavHeaderSubMenuColumn label="Group Label">
          <HeaderSubMenuItem label="Item One" helperText="Helper text" />
          <HeaderSubMenuItem label="Item Two" />
        </NavHeaderSubMenuColumn>
      </NavHeaderSubMenu>
    );
    await expectNoA11yViolations(container);
  });
});
