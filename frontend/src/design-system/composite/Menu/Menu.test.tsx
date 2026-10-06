import { describe, expect, it } from 'vitest';
import { renderWithProviders, screen, expectNoA11yViolations } from '@/test/test-utils';
import { MenuListItem } from '../MenuListItem/MenuListItem';
import { Menu, MenuSection } from './Menu';

describe('Menu', () => {
  it('renders sections with a group label and their items', () => {
    renderWithProviders(
      <Menu>
        <MenuSection label="Group label">
          <MenuListItem>Item Label</MenuListItem>
          <MenuListItem>Item Label 2</MenuListItem>
        </MenuSection>
      </Menu>
    );
    expect(screen.getByText('Group label')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Item Label' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Item Label 2' })).toBeInTheDocument();
  });

  it('renders multiple sections', () => {
    renderWithProviders(
      <Menu>
        <MenuSection label="First group">
          <MenuListItem>First item</MenuListItem>
        </MenuSection>
        <MenuSection label="Second group">
          <MenuListItem>Second item</MenuListItem>
        </MenuSection>
      </Menu>
    );
    expect(screen.getByText('First group')).toBeInTheDocument();
    expect(screen.getByText('Second group')).toBeInTheDocument();
  });

  it('renders a section without a group label', () => {
    renderWithProviders(
      <Menu>
        <MenuSection>
          <MenuListItem>Item Label</MenuListItem>
        </MenuSection>
      </Menu>
    );
    expect(screen.getByRole('button', { name: 'Item Label' })).toBeInTheDocument();
  });

  it('group label is non-interactive presentation text', () => {
    renderWithProviders(
      <Menu>
        <MenuSection label="Group label">
          <MenuListItem>Item Label</MenuListItem>
        </MenuSection>
      </Menu>
    );
    expect(screen.getByText('Group label')).toHaveAttribute('role', 'presentation');
  });

  it('has no accessibility violations', async () => {
    const { container } = renderWithProviders(
      <Menu>
        <MenuSection label="Group label">
          <MenuListItem>Item Label</MenuListItem>
          <MenuListItem selected>Item Label 2</MenuListItem>
          <MenuListItem disabled>Item Label 3</MenuListItem>
        </MenuSection>
      </Menu>
    );
    await expectNoA11yViolations(container);
  });
});
