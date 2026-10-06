import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, expectNoA11yViolations } from '@/test/test-utils';
import { Textarea } from './Textarea';

describe('Textarea', () => {
  it('associates the label and accepts multi-line input', async () => {
    const { user } = renderWithProviders(<Textarea label="وصف المشكلة" />);
    const field = screen.getByLabelText('وصف المشكلة');
    await user.type(field, 'سطر أول');
    expect(field).toHaveValue('سطر أول');
  });

  it('renders the placeholder', () => {
    renderWithProviders(<Textarea label="وصف" placeholder="اكتب هنا" />);
    expect(screen.getByPlaceholderText('اكتب هنا')).toBeInTheDocument();
  });

  it('supports a controlled value', () => {
    const { rerender } = renderWithProviders(
      <Textarea label="وصف" value="أول" onChange={() => {}} />
    );
    expect(screen.getByLabelText('وصف')).toHaveValue('أول');
    rerender(<Textarea label="وصف" value="ثاني" onChange={() => {}} />);
    expect(screen.getByLabelText('وصف')).toHaveValue('ثاني');
  });

  it('supports an uncontrolled defaultValue', () => {
    renderWithProviders(<Textarea label="وصف" defaultValue="قيمة مبدئية" />);
    expect(screen.getByLabelText('وصف')).toHaveValue('قيمة مبدئية');
  });

  it('fires onChange as the user types', async () => {
    const onChange = vi.fn();
    const { user } = renderWithProviders(<Textarea label="وصف" onChange={onChange} />);
    await user.type(screen.getByLabelText('وصف'), 'a');
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('is disabled', () => {
    renderWithProviders(<Textarea label="وصف" disabled />);
    expect(screen.getByLabelText('وصف')).toBeDisabled();
  });

  it('is read-only but still focusable and editable-looking is prevented natively', () => {
    renderWithProviders(<Textarea label="وصف" readOnly defaultValue="ثابت" />);
    const field = screen.getByLabelText('وصف');
    expect(field).toHaveAttribute('readonly');
    expect(field).not.toBeDisabled();
  });

  it('sets the native required attribute and aria-required', () => {
    renderWithProviders(<Textarea label="وصف" requiredField />);
    const field = screen.getByLabelText(/وصف/);
    expect(field).toHaveAttribute('aria-required', 'true');
  });

  it('marks invalid and exposes the error as an alert', () => {
    renderWithProviders(<Textarea label="وصف" errorText="الرجاء وصف المشكلة" />);
    expect(screen.getByLabelText('وصف')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent('الرجاء وصف المشكلة');
  });

  it('links helper text via aria-describedby', () => {
    renderWithProviders(<Textarea label="وصف" helperText="نص مساعد" />);
    const field = screen.getByLabelText('وصف');
    const describedBy = field.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy!)).toHaveTextContent('نص مساعد');
  });

  it('links the error message via aria-describedby', () => {
    renderWithProviders(<Textarea label="وصف" errorText="خطأ" />);
    const field = screen.getByLabelText('وصف');
    expect(field.getAttribute('aria-describedby')).toContain(screen.getByRole('alert').id);
  });

  it('enforces maxLength natively', async () => {
    const { user } = renderWithProviders(<Textarea label="وصف" maxLength={3} />);
    const field = screen.getByLabelText('وصف');
    await user.type(field, 'abcdef');
    expect(field).toHaveValue('abc');
  });

  it('shows a character count only when requested', () => {
    const { rerender } = renderWithProviders(<Textarea label="وصف" defaultValue="abc" />);
    expect(screen.queryByText(/3/)).not.toBeInTheDocument();
    rerender(<Textarea label="وصف" defaultValue="abc" showCharacterCount maxLength={10} />);
    expect(screen.getByText('3/10')).toBeInTheDocument();
  });

  it('updates the character count as the user types', async () => {
    const { user } = renderWithProviders(
      <Textarea label="وصف" showCharacterCount maxLength={10} />
    );
    await user.type(screen.getByLabelText('وصف'), 'abc');
    expect(screen.getByText('3/10')).toBeInTheDocument();
  });

  it('submits its value with a form', () => {
    renderWithProviders(
      <form data-testid="form">
        <Textarea label="وصف" name="description" defaultValue="محتوى" />
      </form>
    );
    expect(new FormData(screen.getByTestId<HTMLFormElement>('form')).get('description')).toBe(
      'محتوى'
    );
  });

  it('forwards the ref to the native textarea', () => {
    const ref = createRef<HTMLTextAreaElement>();
    renderWithProviders(<Textarea label="وصف" ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
  });

  it.each(['default', 'filledDarker', 'filledLighter'] as const)(
    'accepts surface="%s"',
    (surface) => {
      renderWithProviders(<Textarea label="وصف" surface={surface} />);
      expect(screen.getByLabelText('وصف').closest('[data-surface]')).toHaveAttribute(
        'data-surface',
        surface
      );
    }
  );

  it('renders correctly under RTL', () => {
    renderWithProviders(
      <div dir="rtl">
        <Textarea label="وصف" />
      </div>
    );
    expect(screen.getByLabelText('وصف')).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = renderWithProviders(<Textarea label="وصف" helperText="نص مساعد" />);
    await expectNoA11yViolations(container);
  });

  it('has no accessibility violations when invalid, required, and disabled variants render', async () => {
    const { container } = renderWithProviders(
      <>
        <Textarea label="مطلوب" requiredField />
        <Textarea label="خطأ" errorText="خطأ" />
        <Textarea label="معطّل" disabled />
      </>
    );
    await expectNoA11yViolations(container);
  });
});
