import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, expectNoA11yViolations } from '@/test/test-utils';
import { NumberInput } from './NumberInput';

describe('NumberInput', () => {
  it('associates the label with the input', () => {
    renderWithProviders(<NumberInput label="الكمية" />);
    expect(screen.getByLabelText('الكمية')).toBeInTheDocument();
  });

  it('renders as a spinbutton with aria-value attributes', () => {
    renderWithProviders(<NumberInput label="الكمية" defaultValue={5} min={0} max={10} />);
    const input = screen.getByRole('spinbutton', { name: 'الكمية' });
    expect(input).toHaveAttribute('aria-valuenow', '5');
    expect(input).toHaveAttribute('aria-valuemin', '0');
    expect(input).toHaveAttribute('aria-valuemax', '10');
  });

  it('accepts typed numeric input (uncontrolled)', async () => {
    const { user } = renderWithProviders(<NumberInput label="الكمية" />);
    const input = screen.getByLabelText('الكمية');
    await user.type(input, '42');
    expect(input).toHaveValue('42');
  });

  it('increments via the increment button', async () => {
    const onValueChange = vi.fn();
    const { user } = renderWithProviders(
      <NumberInput label="الكمية" defaultValue={5} onValueChange={onValueChange} />
    );
    await user.click(screen.getByRole('button', { name: 'Increment' }));
    expect(onValueChange).toHaveBeenCalledWith(6);
    expect(screen.getByLabelText('الكمية')).toHaveValue('6');
  });

  it('decrements via the decrement button', async () => {
    const onValueChange = vi.fn();
    const { user } = renderWithProviders(
      <NumberInput label="الكمية" defaultValue={5} onValueChange={onValueChange} />
    );
    await user.click(screen.getByRole('button', { name: 'Decrement' }));
    expect(onValueChange).toHaveBeenCalledWith(4);
    expect(screen.getByLabelText('الكمية')).toHaveValue('4');
  });

  it('respects a custom step', async () => {
    const onValueChange = vi.fn();
    const { user } = renderWithProviders(
      <NumberInput label="الكمية" defaultValue={10} step={5} onValueChange={onValueChange} />
    );
    await user.click(screen.getByRole('button', { name: 'Increment' }));
    expect(onValueChange).toHaveBeenCalledWith(15);
  });

  it('clamps the increment button at max', async () => {
    const onValueChange = vi.fn();
    const { user } = renderWithProviders(
      <NumberInput label="الكمية" defaultValue={10} max={10} onValueChange={onValueChange} />
    );
    await user.click(screen.getByRole('button', { name: 'Increment' }));
    expect(onValueChange).toHaveBeenCalledWith(10);
  });

  it('clamps the decrement button at min', async () => {
    const onValueChange = vi.fn();
    const { user } = renderWithProviders(
      <NumberInput label="الكمية" defaultValue={0} min={0} onValueChange={onValueChange} />
    );
    await user.click(screen.getByRole('button', { name: 'Decrement' }));
    expect(onValueChange).toHaveBeenCalledWith(0);
  });

  it('steps with ArrowUp and ArrowDown keys', async () => {
    const { user } = renderWithProviders(<NumberInput label="الكمية" defaultValue={5} />);
    const input = screen.getByLabelText('الكمية');
    input.focus();
    await user.keyboard('{ArrowUp}');
    expect(input).toHaveValue('6');
    await user.keyboard('{ArrowDown}{ArrowDown}');
    expect(input).toHaveValue('4');
  });

  it('clamps out-of-range typed values on blur, not while typing', async () => {
    const onValueChange = vi.fn();
    const { user } = renderWithProviders(
      <NumberInput label="الكمية" min={0} max={10} onValueChange={onValueChange} />
    );
    const input = screen.getByLabelText('الكمية');
    await user.type(input, '99');
    expect(input).toHaveValue('99');
    expect(onValueChange).toHaveBeenLastCalledWith(99);
    await user.tab();
    expect(input).toHaveValue('10');
    expect(onValueChange).toHaveBeenLastCalledWith(10);
  });

  it('supports a fully controlled value', async () => {
    function Controlled() {
      const [value, setValue] = useState(3);
      return (
        <NumberInput label="الكمية" value={value} onValueChange={(next) => setValue(next ?? 0)} />
      );
    }
    const { user } = renderWithProviders(<Controlled />);
    const input = screen.getByLabelText('الكمية');
    expect(input).toHaveValue('3');
    await user.click(screen.getByRole('button', { name: 'Increment' }));
    expect(input).toHaveValue('4');
  });

  it('does not step when disabled', async () => {
    const onValueChange = vi.fn();
    const { user } = renderWithProviders(
      <NumberInput label="الكمية" defaultValue={5} disabled onValueChange={onValueChange} />
    );
    await user.click(screen.getByRole('button', { name: 'Increment' }));
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('does not step when read-only', async () => {
    const onValueChange = vi.fn();
    const { user } = renderWithProviders(
      <NumberInput label="الكمية" defaultValue={5} readOnly onValueChange={onValueChange} />
    );
    await user.click(screen.getByRole('button', { name: 'Increment' }));
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('marks invalid and exposes the error as an alert', () => {
    renderWithProviders(<NumberInput label="الكمية" errorText="القيمة غير صالحة" />);
    expect(screen.getByLabelText('الكمية')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent('القيمة غير صالحة');
  });

  it('links helper text via aria-describedby', () => {
    renderWithProviders(<NumberInput label="الكمية" helperText="نص مساعد" />);
    const input = screen.getByLabelText('الكمية');
    const describedBy = input.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy!)).toHaveTextContent('نص مساعد');
  });

  it.each(['md', 'lg'] as const)('accepts size="%s"', (size) => {
    renderWithProviders(<NumberInput label="الكمية" size={size} />);
    expect(screen.getByLabelText('الكمية').closest('[data-size]')).toHaveAttribute(
      'data-size',
      size
    );
  });

  it('renders custom increment/decrement accessible labels', () => {
    renderWithProviders(
      <NumberInput label="الكمية" incrementLabel="زيادة" decrementLabel="إنقاص" />
    );
    expect(screen.getByRole('button', { name: 'زيادة' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'إنقاص' })).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = renderWithProviders(
      <NumberInput label="الكمية" helperText="نص مساعد" min={0} max={100} />
    );
    await expectNoA11yViolations(container);
  });

  it('has no accessibility violations when disabled', async () => {
    const { container } = renderWithProviders(<NumberInput label="الكمية" disabled />);
    await expectNoA11yViolations(container);
  });

  it('renders RTL correctly under an RTL ancestor', () => {
    renderWithProviders(
      <div dir="rtl">
        <NumberInput label="الكمية" defaultValue={5} />
      </div>
    );
    expect(screen.getByLabelText('الكمية')).toHaveValue('5');
  });
});
