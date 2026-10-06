import { describe, expect, it } from 'vitest';
import { renderWithProviders, screen, expectNoA11yViolations } from '@/test/test-utils';
import { List } from './List';
import { ListItem } from '../ListItem/ListItem';

describe('List', () => {
  it('renders as a <ul> for unordered lists', () => {
    const { container } = renderWithProviders(
      <List type="unordered">
        <ListItem marker="-">Item</ListItem>
      </List>
    );
    expect(container.querySelector('ul')).toBeInTheDocument();
    expect(screen.getByRole('list')).toBeInTheDocument();
  });

  it('renders as an <ol> for ordered lists', () => {
    const { container } = renderWithProviders(
      <List type="ordered">
        <ListItem type="ordered" marker="1-">
          Item
        </ListItem>
      </List>
    );
    expect(container.querySelector('ol')).toBeInTheDocument();
    expect(screen.getByRole('list')).toBeInTheDocument();
  });

  it('renders every composed ListItem child', () => {
    renderWithProviders(
      <List type="ordered">
        <ListItem type="ordered" marker="1-">
          First
        </ListItem>
        <ListItem type="ordered" marker="2-">
          Second
        </ListItem>
      </List>
    );
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.getByText('Second')).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = renderWithProviders(
      <List type="ordered">
        <ListItem type="ordered" marker="1-">
          First
        </ListItem>
        <ListItem type="ordered" level={2} marker="a-">
          Second
        </ListItem>
      </List>
    );
    await expectNoA11yViolations(container);
  });
});
