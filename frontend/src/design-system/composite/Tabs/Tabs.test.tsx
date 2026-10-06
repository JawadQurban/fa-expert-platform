import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, expectNoA11yViolations } from '@/test/test-utils';
import { Tabs } from './Tabs';

const items = [
  { id: 'one', label: 'الأول', content: 'محتوى الأول' },
  { id: 'two', label: 'الثاني', content: 'محتوى الثاني' },
  { id: 'three', label: 'الثالث', content: 'محتوى الثالث' },
];

describe('Tabs', () => {
  it('renders a tablist with the first tab active by default', () => {
    renderWithProviders(<Tabs items={items} />);
    expect(screen.getByRole('tab', { name: 'الأول' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('محتوى الأول');
  });

  it('activates a tab on click', async () => {
    const { user } = renderWithProviders(<Tabs items={items} />);
    await user.click(screen.getByRole('tab', { name: 'الثاني' }));
    expect(screen.getByRole('tab', { name: 'الثاني' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('محتوى الثاني');
  });

  it('moves with ArrowRight/ArrowLeft in LTR order', async () => {
    const { user } = renderWithProviders(<Tabs items={items} />, { locale: 'en' });
    const first = screen.getByRole('tab', { name: 'الأول' });
    first.focus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'الثاني' })).toHaveFocus();
    expect(screen.getByRole('tab', { name: 'الثاني' })).toHaveAttribute('aria-selected', 'true');
    await user.keyboard('{ArrowLeft}');
    expect(screen.getByRole('tab', { name: 'الأول' })).toHaveFocus();
  });

  it('is RTL-aware: ArrowLeft moves to the next tab under RTL', async () => {
    const { user } = renderWithProviders(<Tabs items={items} />, { locale: 'ar' });
    const first = screen.getByRole('tab', { name: 'الأول' });
    first.focus();
    await user.keyboard('{ArrowLeft}');
    expect(screen.getByRole('tab', { name: 'الثاني' })).toHaveFocus();
    expect(screen.getByRole('tab', { name: 'الثاني' })).toHaveAttribute('aria-selected', 'true');
  });

  it('Home/End jump to the first/last enabled tab', async () => {
    const { user } = renderWithProviders(<Tabs items={items} />, { locale: 'en' });
    const second = screen.getByRole('tab', { name: 'الثاني' });
    second.focus();
    await user.keyboard('{End}');
    expect(screen.getByRole('tab', { name: 'الثالث' })).toHaveFocus();
    await user.keyboard('{Home}');
    expect(screen.getByRole('tab', { name: 'الأول' })).toHaveFocus();
  });

  it('skips disabled tabs when navigating with arrow keys', async () => {
    const withDisabled = [items[0], { ...items[1], disabled: true }, items[2]];
    const { user } = renderWithProviders(<Tabs items={withDisabled} />, { locale: 'en' });
    const first = screen.getByRole('tab', { name: 'الأول' });
    first.focus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'الثالث' })).toHaveFocus();
  });

  it('renders a disabled tab with the native disabled attribute', () => {
    const withDisabled = [items[0], { ...items[1], disabled: true }, items[2]];
    renderWithProviders(<Tabs items={withDisabled} />);
    expect(screen.getByRole('tab', { name: 'الثاني' })).toBeDisabled();
  });

  it('defaults to size="md" and applies data-size to each tab', () => {
    renderWithProviders(<Tabs items={items} />);
    expect(screen.getByRole('tab', { name: 'الأول' })).toHaveAttribute('data-size', 'md');
  });

  it('applies the requested size to every tab', () => {
    renderWithProviders(<Tabs items={items} size="lg" />);
    for (const item of items) {
      expect(screen.getByRole('tab', { name: item.label })).toHaveAttribute('data-size', 'lg');
    }
  });

  it('renders a leading icon when provided', () => {
    const withIcon = [{ ...items[0], icon: <svg data-testid="tab-icon" /> }, items[1], items[2]];
    renderWithProviders(<Tabs items={withIcon} />);
    expect(screen.getByTestId('tab-icon')).toBeInTheDocument();
  });

  it('marks the active tab with data-selected="true"', async () => {
    const { user } = renderWithProviders(<Tabs items={items} />);
    expect(screen.getByRole('tab', { name: 'الأول' })).toHaveAttribute('data-selected', 'true');
    await user.click(screen.getByRole('tab', { name: 'الثاني' }));
    expect(screen.getByRole('tab', { name: 'الأول' })).toHaveAttribute('data-selected', 'false');
    expect(screen.getByRole('tab', { name: 'الثاني' })).toHaveAttribute('data-selected', 'true');
  });

  it('hides the baseline divider when divider={false}', () => {
    // Each tab always renders its own aria-hidden selection-indicator span (one per item);
    // the list-level baseline divider is one more aria-hidden node on top of that count.
    const withDivider = renderWithProviders(<Tabs items={items} />);
    expect(withDivider.container.querySelectorAll('[aria-hidden="true"]')).toHaveLength(
      items.length + 1
    );

    const withoutDivider = renderWithProviders(<Tabs items={items} divider={false} />);
    expect(withoutDivider.container.querySelectorAll('[aria-hidden="true"]')).toHaveLength(
      items.length
    );
  });

  it('renders an overflow trigger with an accessible name when provided', async () => {
    const onClick = vi.fn();
    const { user } = renderWithProviders(
      <Tabs items={items} overflowTrigger={{ label: 'المزيد', onClick }} />
    );
    const trigger = screen.getByRole('button', { name: 'المزيد' });
    expect(trigger).toHaveAttribute('aria-haspopup', 'true');
    await user.click(trigger);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('has no accessibility violations', async () => {
    const { container } = renderWithProviders(<Tabs items={items} label="علامات تبويب المحتوى" />);
    await expectNoA11yViolations(container);
  });

  it('has no accessibility violations with icons and an overflow trigger', async () => {
    const withIcons = items.map((item) => ({ ...item, icon: <svg aria-hidden="true" /> }));
    const { container } = renderWithProviders(
      <Tabs
        items={withIcons}
        label="علامات تبويب المحتوى"
        overflowTrigger={{ label: 'المزيد من علامات التبويب' }}
      />
    );
    await expectNoA11yViolations(container);
  });

  describe('orientation="vertical" (CMP-09b)', () => {
    it('sets aria-orientation="vertical" on the tablist', () => {
      renderWithProviders(<Tabs items={items} orientation="vertical" />);
      expect(screen.getByRole('tablist')).toHaveAttribute('aria-orientation', 'vertical');
    });

    it('does not set aria-orientation for the default horizontal mode', () => {
      renderWithProviders(<Tabs items={items} />);
      expect(screen.getByRole('tablist')).not.toHaveAttribute('aria-orientation');
    });

    it('moves with ArrowDown/ArrowUp regardless of locale', async () => {
      const { user } = renderWithProviders(<Tabs items={items} orientation="vertical" />, {
        locale: 'ar',
      });
      const first = screen.getByRole('tab', { name: 'الأول' });
      first.focus();
      await user.keyboard('{ArrowDown}');
      expect(screen.getByRole('tab', { name: 'الثاني' })).toHaveFocus();
      expect(screen.getByRole('tab', { name: 'الثاني' })).toHaveAttribute('aria-selected', 'true');
      await user.keyboard('{ArrowUp}');
      expect(screen.getByRole('tab', { name: 'الأول' })).toHaveFocus();
    });

    it('does not move on ArrowRight/ArrowLeft when vertical', async () => {
      const { user } = renderWithProviders(<Tabs items={items} orientation="vertical" />, {
        locale: 'en',
      });
      const first = screen.getByRole('tab', { name: 'الأول' });
      first.focus();
      await user.keyboard('{ArrowRight}');
      expect(first).toHaveFocus();
    });

    it('Home/End still jump to the first/last enabled tab', async () => {
      const { user } = renderWithProviders(<Tabs items={items} orientation="vertical" />);
      const second = screen.getByRole('tab', { name: 'الثاني' });
      second.focus();
      await user.keyboard('{End}');
      expect(screen.getByRole('tab', { name: 'الثالث' })).toHaveFocus();
      await user.keyboard('{Home}');
      expect(screen.getByRole('tab', { name: 'الأول' })).toHaveFocus();
    });

    it('renders no baseline divider when vertical, even with divider={true}', () => {
      const { container } = renderWithProviders(
        <Tabs items={items} orientation="vertical" divider />
      );
      expect(container.querySelectorAll('[aria-hidden="true"]')).toHaveLength(items.length);
    });

    it('applies data-orientation to each tab', () => {
      renderWithProviders(<Tabs items={items} orientation="vertical" />);
      for (const item of items) {
        expect(screen.getByRole('tab', { name: item.label })).toHaveAttribute(
          'data-orientation',
          'vertical'
        );
      }
    });

    it('has no accessibility violations', async () => {
      const { container } = renderWithProviders(
        <Tabs items={items} orientation="vertical" label="علامات تبويب عمودية" />
      );
      await expectNoA11yViolations(container);
    });
  });
});
