import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, expectNoA11yViolations } from '@/test/test-utils';
import { ContentSwitcher } from './ContentSwitcher';
import type { ContentSwitcherOption } from './ContentSwitcher';

const options: ContentSwitcherOption[] = [
  { value: 'one', label: 'الأول' },
  { value: 'two', label: 'الثاني' },
  { value: 'three', label: 'الثالث' },
];

function ControlledSwitcher({ initial = 'one' }: { initial?: string }) {
  const [value, setValue] = useState(initial);
  return (
    <ContentSwitcher
      label="مبدل المحتوى"
      options={options}
      value={value}
      onValueChange={setValue}
    />
  );
}

describe('ContentSwitcher', () => {
  it('renders a tablist with the given value selected', () => {
    renderWithProviders(
      <ContentSwitcher label="مبدل" options={options} value="two" onValueChange={vi.fn()} />
    );
    expect(screen.getByRole('tab', { name: 'الثاني' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'الأول' })).toHaveAttribute('aria-selected', 'false');
  });

  it('calls onValueChange on click', async () => {
    const onValueChange = vi.fn();
    const { user } = renderWithProviders(
      <ContentSwitcher label="مبدل" options={options} value="one" onValueChange={onValueChange} />
    );
    await user.click(screen.getByRole('tab', { name: 'الثاني' }));
    expect(onValueChange).toHaveBeenCalledWith('two');
  });

  it('activates a tab on click when wired to controlled state', async () => {
    const { user } = renderWithProviders(<ControlledSwitcher />);
    await user.click(screen.getByRole('tab', { name: 'الثاني' }));
    expect(screen.getByRole('tab', { name: 'الثاني' })).toHaveAttribute('aria-selected', 'true');
  });

  it('moves with ArrowRight/ArrowLeft in LTR order', async () => {
    const { user } = renderWithProviders(<ControlledSwitcher />, { locale: 'en' });
    const first = screen.getByRole('tab', { name: 'الأول' });
    first.focus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'الثاني' })).toHaveFocus();
    expect(screen.getByRole('tab', { name: 'الثاني' })).toHaveAttribute('aria-selected', 'true');
    await user.keyboard('{ArrowLeft}');
    expect(screen.getByRole('tab', { name: 'الأول' })).toHaveFocus();
  });

  it('is RTL-aware: ArrowLeft moves to the next tab under RTL', async () => {
    const { user } = renderWithProviders(<ControlledSwitcher />, { locale: 'ar' });
    const first = screen.getByRole('tab', { name: 'الأول' });
    first.focus();
    await user.keyboard('{ArrowLeft}');
    expect(screen.getByRole('tab', { name: 'الثاني' })).toHaveFocus();
    expect(screen.getByRole('tab', { name: 'الثاني' })).toHaveAttribute('aria-selected', 'true');
  });

  it('Home/End jump to the first/last tab', async () => {
    const { user } = renderWithProviders(<ControlledSwitcher />, { locale: 'en' });
    const second = screen.getByRole('tab', { name: 'الثاني' });
    second.focus();
    await user.keyboard('{End}');
    expect(screen.getByRole('tab', { name: 'الثالث' })).toHaveFocus();
    await user.keyboard('{Home}');
    expect(screen.getByRole('tab', { name: 'الأول' })).toHaveFocus();
  });

  it('assigns first/mid/last position data attributes', () => {
    renderWithProviders(
      <ContentSwitcher label="مبدل" options={options} value="one" onValueChange={vi.fn()} />
    );
    const tabs = screen.getAllByRole('tab');
    expect(tabs[0]).toHaveAttribute('data-position', 'first');
    expect(tabs[1]).toHaveAttribute('data-position', 'mid');
    expect(tabs[2]).toHaveAttribute('data-position', 'last');
  });

  it('accepts size and onColor props', () => {
    renderWithProviders(
      <ContentSwitcher
        label="مبدل"
        options={options}
        value="one"
        onValueChange={vi.fn()}
        size="lg"
        onColor
      />
    );
    const tablist = screen.getByRole('tablist');
    expect(tablist).toHaveAttribute('data-size', 'lg');
    expect(tablist).toHaveAttribute('data-on-color', 'true');
  });

  it('has no accessibility violations', async () => {
    const { container } = renderWithProviders(
      <ContentSwitcher label="مبدل المحتوى" options={options} value="one" onValueChange={vi.fn()} />
    );
    await expectNoA11yViolations(container);
  });
});
