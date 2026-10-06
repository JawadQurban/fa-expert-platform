import { createRef } from 'react';
import type { ChangeEvent } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, expectNoA11yViolations } from '@/test/test-utils';
import { Checkbox } from './Checkbox';

describe('Checkbox', () => {
  it('renders unchecked by default', () => {
    renderWithProviders(<Checkbox label="أوافق" />);
    expect(screen.getByRole('checkbox', { name: 'أوافق' })).not.toBeChecked();
  });

  it('renders checked via defaultChecked', () => {
    renderWithProviders(<Checkbox label="أوافق" defaultChecked />);
    expect(screen.getByRole('checkbox')).toBeChecked();
  });

  it('applies the indeterminate DOM state (not an HTML attribute)', () => {
    renderWithProviders(<Checkbox label="تحديد الكل" indeterminate />);
    const box = screen.getByRole<HTMLInputElement>('checkbox');
    expect(box.indeterminate).toBe(true);
    expect(box).not.toHaveAttribute('indeterminate');
  });

  it('supports controlled usage', async () => {
    const onChange = vi.fn();
    const { user, rerender } = renderWithProviders(
      <Checkbox label="أوافق" checked={false} onChange={onChange} />
    );
    const box = screen.getByRole('checkbox');
    await user.click(box);
    expect(onChange).toHaveBeenCalledTimes(1);
    // Controlled: stays unchecked until the parent updates `checked`.
    expect(box).not.toBeChecked();
    rerender(<Checkbox label="أوافق" checked={true} onChange={onChange} />);
    expect(box).toBeChecked();
  });

  it('supports uncontrolled usage and toggles on click', async () => {
    const { user } = renderWithProviders(<Checkbox label="أوافق" />);
    const box = screen.getByRole('checkbox');
    expect(box).not.toBeChecked();
    await user.click(box);
    expect(box).toBeChecked();
  });

  it('fires onChange with the native event', async () => {
    const onChange = vi.fn<(event: ChangeEvent<HTMLInputElement>) => void>();
    const { user } = renderWithProviders(<Checkbox label="أوافق" onChange={onChange} />);
    await user.click(screen.getByRole('checkbox'));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0].target.checked).toBe(true);
  });

  it('toggles when the label is clicked', async () => {
    const { user } = renderWithProviders(<Checkbox label="أوافق" />);
    const box = screen.getByRole('checkbox');
    await user.click(screen.getByText('أوافق'));
    expect(box).toBeChecked();
  });

  it('toggles with the Space key', async () => {
    const { user } = renderWithProviders(<Checkbox label="أوافق" />);
    const box = screen.getByRole('checkbox');
    box.focus();
    await user.keyboard(' ');
    expect(box).toBeChecked();
  });

  it('is disabled and excluded from the tab order', () => {
    renderWithProviders(<Checkbox label="أوافق" disabled />);
    expect(screen.getByRole('checkbox')).toBeDisabled();
  });

  it('does not toggle when disabled', async () => {
    const { user } = renderWithProviders(<Checkbox label="أوافق" disabled />);
    const box = screen.getByRole('checkbox');
    await user.click(box);
    expect(box).not.toBeChecked();
  });

  it('is focusable but does not toggle when read-only', async () => {
    const { user } = renderWithProviders(<Checkbox label="أوافق" readOnly defaultChecked />);
    const box = screen.getByRole('checkbox');
    expect(box).toHaveAttribute('aria-readonly', 'true');
    await user.click(box);
    expect(box).toBeChecked(); // still checked (its initial state), not toggled off
    box.focus();
    await user.keyboard(' ');
    expect(box).toBeChecked();
  });

  it('submits its name and value with a form', () => {
    renderWithProviders(
      <form data-testid="form">
        <Checkbox label="أوافق" name="agree" value="yes" defaultChecked />
      </form>
    );
    const box = screen.getByRole<HTMLInputElement>('checkbox');
    expect(box.name).toBe('agree');
    expect(box.value).toBe('yes');
    expect(new FormData(screen.getByTestId<HTMLFormElement>('form')).get('agree')).toBe('yes');
  });

  it('sets the native required attribute', () => {
    renderWithProviders(<Checkbox label="أوافق" required />);
    expect(screen.getByRole('checkbox')).toBeRequired();
  });

  it('marks invalid and exposes the error as an alert', () => {
    renderWithProviders(<Checkbox label="أوافق" errorText="يجب الموافقة للمتابعة" />);
    const box = screen.getByRole('checkbox');
    expect(box).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent('يجب الموافقة للمتابعة');
  });

  it('links a description via aria-describedby', () => {
    renderWithProviders(<Checkbox label="إشعارات" description="تفاصيل" />);
    const box = screen.getByRole('checkbox');
    const id = box.getAttribute('aria-describedby');
    expect(id).toBeTruthy();
    expect(document.getElementById(id!)).toHaveTextContent('تفاصيل');
  });

  it('forwards the ref to the native input', () => {
    const ref = createRef<HTMLInputElement>();
    renderWithProviders(<Checkbox label="أوافق" ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
    expect(ref.current?.type).toBe('checkbox');
  });

  it.each(['md', 'sm', 'xs'] as const)('accepts size="%s"', (size) => {
    renderWithProviders(<Checkbox label="أوافق" size={size} />);
    expect(screen.getByRole('checkbox').closest('[data-size]')).toHaveAttribute('data-size', size);
  });

  it.each(['primary', 'neutral'] as const)('accepts mood="%s"', (mood) => {
    renderWithProviders(<Checkbox label="أوافق" mood={mood} />);
    expect(screen.getByRole('checkbox').closest('[data-mood]')).toHaveAttribute('data-mood', mood);
  });

  it('renders correctly under RTL', () => {
    renderWithProviders(
      <div dir="rtl">
        <Checkbox label="أوافق" description="تفاصيل إضافية" />
      </div>
    );
    expect(screen.getByRole('checkbox', { name: 'أوافق' })).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = renderWithProviders(<Checkbox label="أوافق" />);
    await expectNoA11yViolations(container);
  });

  it('has no accessibility violations when checked, described, and errored', async () => {
    const { container } = renderWithProviders(
      <Checkbox label="أوافق" description="تفاصيل" errorText="خطأ" defaultChecked />
    );
    await expectNoA11yViolations(container);
  });

  it('has no accessibility violations when disabled', async () => {
    const { container } = renderWithProviders(<Checkbox label="أوافق" disabled />);
    await expectNoA11yViolations(container);
  });
});
