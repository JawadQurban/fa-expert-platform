import { describe, expect, it } from 'vitest';
import { renderWithProviders, screen, expectNoA11yViolations } from '@/test/test-utils';
import { ListItem } from './ListItem';

function renderInList(children: React.ReactNode) {
  return renderWithProviders(<ul>{children}</ul>);
}

describe('ListItem', () => {
  it('renders as a listitem with its text content', () => {
    renderInList(<ListItem marker="-">List item</ListItem>);
    expect(screen.getByRole('listitem')).toHaveTextContent('List item');
  });

  it('renders the marker for ordered/unordered types', () => {
    renderInList(
      <ListItem type="ordered" marker="1-">
        List item
      </ListItem>
    );
    expect(screen.getByText('1-')).toBeInTheDocument();
  });

  it('renders the icon slot for type="icon" instead of a marker', () => {
    renderInList(
      <ListItem type="icon" icon={<svg data-testid="glyph" />} marker="-">
        List item
      </ListItem>
    );
    expect(screen.getByTestId('glyph')).toBeInTheDocument();
    expect(screen.queryByText('-')).not.toBeInTheDocument();
  });

  it('applies data-level for indentation', () => {
    renderInList(
      <ListItem level={2} marker="•">
        Nested
      </ListItem>
    );
    expect(screen.getByRole('listitem')).toHaveAttribute('data-level', '2');
  });

  it('defaults to level 1 and primary tone', () => {
    renderInList(<ListItem marker="-">List item</ListItem>);
    const item = screen.getByRole('listitem');
    expect(item).toHaveAttribute('data-level', '1');
    expect(item).toHaveAttribute('data-tone', 'primary');
  });

  it('applies the requested tone', () => {
    renderInList(
      <ListItem marker="-" tone="neutral">
        List item
      </ListItem>
    );
    expect(screen.getByRole('listitem')).toHaveAttribute('data-tone', 'neutral');
  });

  it('has no accessibility violations', async () => {
    const { container } = renderWithProviders(
      <ul>
        <ListItem type="ordered" marker="1-">
          First
        </ListItem>
        <ListItem type="icon" icon={<svg aria-hidden="true" />}>
          Second
        </ListItem>
      </ul>
    );
    await expectNoA11yViolations(container);
  });
});
