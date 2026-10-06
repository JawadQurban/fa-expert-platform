import { describe, expect, it } from 'vitest';
import { renderWithProviders, screen, expectNoA11yViolations } from '@/test/test-utils';
import { Field } from './Field';

describe('Field', () => {
  it('associates the label with the wrapped control via the render-prop id', () => {
    renderWithProviders(<Field label="عنوان الابتكار">{(aria) => <input {...aria} />}</Field>);
    expect(screen.getByLabelText('عنوان الابتكار')).toBeInTheDocument();
  });

  it('links helper text via aria-describedby', () => {
    renderWithProviders(
      <Field label="العنوان" helperText="نص مساعد">
        {(aria) => <input {...aria} />}
      </Field>
    );
    const input = screen.getByLabelText('العنوان');
    const describedBy = input.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy!)).toHaveTextContent('نص مساعد');
  });

  it('marks invalid and exposes the error as an alert linked via aria-describedby', () => {
    renderWithProviders(
      <Field label="العنوان" errorText="الرجاء إدخال العنوان">
        {(aria) => <input {...aria} />}
      </Field>
    );
    const input = screen.getByLabelText('العنوان');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    const describedBy = input.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();
    const error = screen.getByRole('alert');
    expect(error).toHaveTextContent('الرجاء إدخال العنوان');
    expect(describedBy).toContain(error.id);
  });

  it('links both helper and error text via aria-describedby when both are present', () => {
    renderWithProviders(
      <Field label="العنوان" helperText="نص مساعد" errorText="خطأ">
        {(aria) => <input {...aria} />}
      </Field>
    );
    const input = screen.getByLabelText('العنوان');
    const describedBy = input.getAttribute('aria-describedby') ?? '';
    expect(describedBy.split(' ')).toHaveLength(2);
  });

  it('sets aria-required and renders the required indicator when required', () => {
    renderWithProviders(
      <Field label="العنوان" required>
        {(aria) => <input {...aria} />}
      </Field>
    );
    expect(screen.getByLabelText(/العنوان/)).toHaveAttribute('aria-required', 'true');
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('supports a custom required indicator', () => {
    renderWithProviders(
      <Field label="العنوان" required requiredIndicator="(مطلوب)">
        {(aria) => <input {...aria} />}
      </Field>
    );
    expect(screen.getByText('(مطلوب)')).toBeInTheDocument();
  });

  it('omits aria-invalid, aria-required, and aria-describedby when not applicable', () => {
    renderWithProviders(<Field label="العنوان">{(aria) => <input {...aria} />}</Field>);
    const input = screen.getByLabelText('العنوان');
    expect(input).not.toHaveAttribute('aria-invalid');
    expect(input).not.toHaveAttribute('aria-required');
    expect(input).not.toHaveAttribute('aria-describedby');
  });

  it('has no accessibility violations', async () => {
    const { container } = renderWithProviders(
      <Field label="العنوان" helperText="نص مساعد" required>
        {(aria) => <input {...aria} />}
      </Field>
    );
    await expectNoA11yViolations(container);
  });
});
