import { describe, expect, it } from 'vitest';
import { renderWithProviders, screen, expectNoA11yViolations, waitFor } from '@/test/test-utils';
import { ButtonMenu } from './ButtonMenu';
import { Menu, MenuSection } from '../Menu/Menu';
import { MenuListItem } from '../MenuListItem/MenuListItem';

const demoMenu = (
  <Menu>
    <MenuSection label="Group">
      <MenuListItem>Item one</MenuListItem>
      <MenuListItem>Item two</MenuListItem>
    </MenuSection>
  </Menu>
);

describe('ButtonMenu', () => {
  it('renders a trigger button with the given label', () => {
    renderWithProviders(<ButtonMenu menu={demoMenu}>Button</ButtonMenu>);
    expect(screen.getByRole('button', { name: 'Button' })).toBeInTheDocument();
  });

  it('is collapsed by default (aria-expanded=false, panel not rendered)', () => {
    renderWithProviders(<ButtonMenu menu={demoMenu}>Button</ButtonMenu>);
    expect(screen.getByRole('button', { name: 'Button' })).toHaveAttribute(
      'aria-expanded',
      'false'
    );
    expect(screen.queryByText('Item one')).not.toBeInTheDocument();
  });

  it('opens the menu on click and moves focus into it', async () => {
    const { user } = renderWithProviders(<ButtonMenu menu={demoMenu}>Button</ButtonMenu>);
    await user.click(screen.getByRole('button', { name: 'Button' }));
    expect(screen.getByRole('button', { name: 'Button' })).toHaveAttribute('aria-expanded', 'true');
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Item one' })).toHaveFocus();
    });
  });

  it('closes on Escape and returns focus to the trigger', async () => {
    const { user } = renderWithProviders(<ButtonMenu menu={demoMenu}>Button</ButtonMenu>);
    const trigger = screen.getByRole('button', { name: 'Button' });
    await user.click(trigger);
    await waitFor(() => expect(screen.getByText('Item one')).toBeInTheDocument());
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByText('Item one')).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
  });

  it('closes when clicking outside', async () => {
    const { user } = renderWithProviders(
      <div>
        <ButtonMenu menu={demoMenu}>Button</ButtonMenu>
        <button type="button">Outside</button>
      </div>
    );
    await user.click(screen.getByRole('button', { name: 'Button' }));
    await waitFor(() => expect(screen.getByText('Item one')).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: 'Outside' }));
    await waitFor(() => expect(screen.queryByText('Item one')).not.toBeInTheDocument());
  });

  it('does not open when disabled', async () => {
    const { user } = renderWithProviders(
      <ButtonMenu menu={demoMenu} disabled>
        Button
      </ButtonMenu>
    );
    await user.click(screen.getByRole('button', { name: 'Button' }));
    expect(screen.queryByText('Item one')).not.toBeInTheDocument();
  });

  it('has no accessibility violations closed or open', async () => {
    const { container, user } = renderWithProviders(
      <ButtonMenu menu={demoMenu}>Button</ButtonMenu>
    );
    await expectNoA11yViolations(container);
    await user.click(screen.getByRole('button', { name: 'Button' }));
    const panel = await screen.findByTestId('button-menu-panel');
    await expectNoA11yViolations(panel);
  });
});
