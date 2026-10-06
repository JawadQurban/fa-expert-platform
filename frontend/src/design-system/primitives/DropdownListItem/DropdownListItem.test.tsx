import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, expectNoA11yViolations } from '@/test/test-utils';
import { DropdownListItem } from './DropdownListItem';

function renderInListbox(node: React.ReactNode) {
  return renderWithProviders(
    <ul role="listbox" aria-label="قائمة">
      {node}
    </ul>
  );
}

describe('DropdownListItem', () => {
  it('renders an option row with role="option"', () => {
    renderInListbox(<DropdownListItem>Option</DropdownListItem>);
    expect(screen.getByRole('option', { name: 'Option' })).toBeInTheDocument();
  });

  it('reflects selected via aria-selected and shows a checkmark', () => {
    renderInListbox(<DropdownListItem selected>Option</DropdownListItem>);
    const option = screen.getByRole('option');
    expect(option).toHaveAttribute('aria-selected', 'true');
    expect(option).toHaveTextContent('✓');
  });

  it('does not show a checkmark when not selected', () => {
    renderInListbox(<DropdownListItem>Option</DropdownListItem>);
    expect(screen.getByRole('option')).not.toHaveTextContent('✓');
  });

  it('exposes the active (roving-highlight) state via data-active', () => {
    renderInListbox(<DropdownListItem active>Option</DropdownListItem>);
    expect(screen.getByRole('option')).toHaveAttribute('data-active', 'true');
  });

  it('exposes disabled via aria-disabled and data-disabled', () => {
    renderInListbox(<DropdownListItem disabled>Option</DropdownListItem>);
    const option = screen.getByRole('option');
    expect(option).toHaveAttribute('aria-disabled', 'true');
    expect(option).toHaveAttribute('data-disabled', 'true');
  });

  it('exposes divider via data-divider', () => {
    renderInListbox(<DropdownListItem divider>Option</DropdownListItem>);
    expect(screen.getByRole('option')).toHaveAttribute('data-divider', 'true');
  });

  it('calls onClick when clicked', async () => {
    const onClick = vi.fn();
    const { user } = renderInListbox(<DropdownListItem onClick={onClick}>Option</DropdownListItem>);
    await user.click(screen.getByRole('option'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  describe('type="multiSelectOption"', () => {
    it('renders a decorative checkbox visual, not a real checkbox input', () => {
      renderInListbox(
        <DropdownListItem type="multiSelectOption" selected>
          Option
        </DropdownListItem>
      );
      expect(screen.getByRole('option', { name: 'Option' })).toBeInTheDocument();
      expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    });
  });

  describe('type="groupLabel"', () => {
    it('renders role="presentation", not role="option"', () => {
      renderInListbox(<DropdownListItem type="groupLabel">Group label</DropdownListItem>);
      expect(screen.getByText('Group label')).toHaveAttribute('role', 'presentation');
      expect(screen.queryByRole('option')).not.toBeInTheDocument();
    });
  });

  it('has no accessibility violations', async () => {
    const { container } = renderInListbox(<DropdownListItem>Option</DropdownListItem>);
    await expectNoA11yViolations(container);
  });

  it('has no accessibility violations when selected', async () => {
    const { container } = renderInListbox(<DropdownListItem selected>Option</DropdownListItem>);
    await expectNoA11yViolations(container);
  });

  it('has no accessibility violations for a group label followed by options', async () => {
    const { container } = renderInListbox(
      <>
        <DropdownListItem type="groupLabel">Group label</DropdownListItem>
        <DropdownListItem>Option</DropdownListItem>
      </>
    );
    await expectNoA11yViolations(container);
  });
});
