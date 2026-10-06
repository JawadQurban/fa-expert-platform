import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, expectNoA11yViolations, within } from '@/test/test-utils';
import { Select } from './Select';

const options = [
  { value: 'a', label: 'أ' },
  { value: 'b', label: 'ب' },
  { value: 'c', label: 'ج', disabled: true },
];

const groups = [
  { label: 'المجموعة الأولى', options: [{ value: 'a', label: 'أ' }] },
  { label: 'المجموعة الثانية', options: [{ value: 'b', label: 'ب' }] },
];

describe('Select', () => {
  it('associates the label with the combobox', () => {
    renderWithProviders(<Select label="التصنيف" options={options} />);
    expect(screen.getByRole('combobox', { name: 'التصنيف' })).toBeInTheDocument();
  });

  it('shows the placeholder when nothing is selected', () => {
    renderWithProviders(<Select label="التصنيف" placeholder="اختر" options={options} />);
    expect(screen.getByRole('combobox')).toHaveTextContent('اختر');
  });

  it('supports an uncontrolled defaultValue', () => {
    renderWithProviders(<Select label="التصنيف" options={options} defaultValue="b" />);
    expect(screen.getByRole('combobox')).toHaveTextContent('ب');
  });

  it('supports a controlled value', () => {
    const { rerender } = renderWithProviders(
      <Select label="التصنيف" options={options} value="a" onValueChange={() => {}} />
    );
    expect(screen.getByRole('combobox')).toHaveTextContent('أ');
    rerender(<Select label="التصنيف" options={options} value="b" onValueChange={() => {}} />);
    expect(screen.getByRole('combobox')).toHaveTextContent('ب');
  });

  it('opens the listbox on click and closes on Escape', async () => {
    const { user } = renderWithProviders(<Select label="التصنيف" options={options} />);
    const trigger = screen.getByRole('combobox');
    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('selects an option on click and calls onValueChange', async () => {
    const onValueChange = vi.fn();
    const { user } = renderWithProviders(
      <Select label="التصنيف" options={options} onValueChange={onValueChange} />
    );
    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByRole('option', { name: 'ب' }));
    expect(onValueChange).toHaveBeenCalledWith('b');
    expect(screen.getByRole('combobox')).toHaveTextContent('ب');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('does not select a disabled option', async () => {
    const onValueChange = vi.fn();
    const { user } = renderWithProviders(
      <Select label="التصنيف" options={options} onValueChange={onValueChange} />
    );
    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByRole('option', { name: 'ج' }));
    expect(onValueChange).not.toHaveBeenCalled();
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  it('navigates options with ArrowDown/ArrowUp and selects with Enter', async () => {
    const onValueChange = vi.fn();
    const { user } = renderWithProviders(
      <Select label="التصنيف" options={options} onValueChange={onValueChange} />
    );
    const trigger = screen.getByRole('combobox');
    trigger.focus();
    await user.keyboard('{ArrowDown}');
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{Enter}');
    expect(onValueChange).toHaveBeenCalledWith('b');
  });

  it('jumps to the first/last option with Home/End', async () => {
    const { user } = renderWithProviders(<Select label="التصنيف" options={options} />);
    const trigger = screen.getByRole('combobox');
    trigger.focus();
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{End}');
    // Last enabled option is "b" (c is disabled) — End should land there, not on "c".
    await user.keyboard('{Enter}');
    expect(trigger).toHaveTextContent('ب');
  });

  it('closes on outside click without changing the selection', async () => {
    const { user } = renderWithProviders(
      <div>
        <Select label="التصنيف" options={options} />
        <button type="button">خارج</button>
      </div>
    );
    await user.click(screen.getByRole('combobox'));
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'خارج' }));
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('returns focus to the trigger after selecting an option', async () => {
    const { user } = renderWithProviders(<Select label="التصنيف" options={options} />);
    const trigger = screen.getByRole('combobox');
    await user.click(trigger);
    await user.click(screen.getByRole('option', { name: 'أ' }));
    expect(trigger).toHaveFocus();
  });

  it('does not open when disabled', async () => {
    const { user } = renderWithProviders(<Select label="التصنيف" options={options} disabled />);
    const trigger = screen.getByRole('combobox');
    expect(trigger).toBeDisabled();
    await user.click(trigger);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('does not open when read-only, but stays focusable', async () => {
    const { user } = renderWithProviders(
      <Select label="التصنيف" options={options} readOnly defaultValue="a" />
    );
    const trigger = screen.getByRole('combobox');
    expect(trigger).toHaveAttribute('aria-readonly', 'true');
    expect(trigger).not.toBeDisabled();
    await user.click(trigger);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('marks invalid and exposes the error as an alert', () => {
    renderWithProviders(<Select label="التصنيف" options={options} errorText="مطلوب" />);
    expect(screen.getByRole('combobox')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent('مطلوب');
  });

  it('links helper text via aria-describedby', () => {
    renderWithProviders(<Select label="التصنيف" options={options} helperText="نص مساعد" />);
    const trigger = screen.getByRole('combobox');
    const describedBy = trigger.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy!)).toHaveTextContent('نص مساعد');
  });

  it('renders grouped options with a group label', async () => {
    const { user } = renderWithProviders(<Select label="التصنيف" groups={groups} />);
    await user.click(screen.getByRole('combobox'));
    const listbox = screen.getByRole('listbox');
    expect(within(listbox).getByText('المجموعة الأولى')).toBeInTheDocument();
    expect(within(listbox).getByText('المجموعة الثانية')).toBeInTheDocument();
  });

  it('shows a loading row instead of options', async () => {
    const { user } = renderWithProviders(
      <Select label="التصنيف" options={options} loading loadingText="جارٍ التحميل" />
    );
    await user.click(screen.getByRole('combobox'));
    expect(screen.getByText('جارٍ التحميل')).toBeInTheDocument();
    expect(screen.queryByRole('option')).not.toBeInTheDocument();
  });

  it('shows a fallback message when there are no options', async () => {
    const { user } = renderWithProviders(
      <Select label="التصنيف" options={[]} noOptionsText="لا توجد خيارات" />
    );
    await user.click(screen.getByRole('combobox'));
    expect(screen.getByText('لا توجد خيارات')).toBeInTheDocument();
  });

  it('participates in native form submission via a hidden input', () => {
    renderWithProviders(
      <form data-testid="form">
        <Select label="التصنيف" options={options} name="category" defaultValue="b" />
      </form>
    );
    expect(new FormData(screen.getByTestId<HTMLFormElement>('form')).get('category')).toBe('b');
  });

  it.each(['default', 'filledDarker', 'filledLighter'] as const)(
    'accepts surface="%s"',
    (surface) => {
      renderWithProviders(<Select label="التصنيف" options={options} surface={surface} />);
      expect(screen.getByRole('combobox')).toHaveAttribute('data-surface', surface);
    }
  );

  it('renders correctly under RTL', async () => {
    const { user } = renderWithProviders(
      <div dir="rtl">
        <Select label="التصنيف" options={options} />
      </div>
    );
    await user.click(screen.getByRole('combobox'));
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = renderWithProviders(
      <Select label="التصنيف" options={options} helperText="نص مساعد" />
    );
    await expectNoA11yViolations(container);
  });

  it('has no accessibility violations when open', async () => {
    const { container, user } = renderWithProviders(<Select label="التصنيف" options={options} />);
    await user.click(screen.getByRole('combobox'));
    await expectNoA11yViolations(container);
  });

  it('has no accessibility violations when disabled', async () => {
    const { container } = renderWithProviders(
      <Select label="التصنيف" options={options} disabled />
    );
    await expectNoA11yViolations(container);
  });
});
