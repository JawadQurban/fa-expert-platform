import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, expectNoA11yViolations } from '@/test/test-utils';
import { TextInput } from './TextInput';

const MATRIX_SIZES = ['md', 'lg'] as const;
const MATRIX_SURFACES = ['default', 'filledDarker', 'filledLighter'] as const;

describe('TextInput', () => {
  it('associates the label with the input', () => {
    renderWithProviders(<TextInput label="عنوان الابتكار" />);
    expect(screen.getByLabelText('عنوان الابتكار')).toBeInTheDocument();
  });

  it('accepts typed input', async () => {
    const { user } = renderWithProviders(<TextInput label="العنوان" />);
    const input = screen.getByLabelText('العنوان');
    await user.type(input, 'فكرة جديدة');
    expect(input).toHaveValue('فكرة جديدة');
  });

  it('links helper text via aria-describedby', () => {
    renderWithProviders(<TextInput label="العنوان" helperText="نص مساعد" />);
    const input = screen.getByLabelText('العنوان');
    const describedBy = input.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy!)).toHaveTextContent('نص مساعد');
  });

  it('marks invalid and exposes the error as an alert', () => {
    renderWithProviders(<TextInput label="العنوان" errorText="الرجاء إدخال العنوان" />);
    const input = screen.getByLabelText('العنوان');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent('الرجاء إدخال العنوان');
  });

  it('sets aria-required when required', () => {
    renderWithProviders(<TextInput label="العنوان" requiredField />);
    expect(screen.getByLabelText(/العنوان/)).toHaveAttribute('aria-required', 'true');
  });

  it('defaults to size="lg", surface="default"', () => {
    renderWithProviders(<TextInput label="العنوان" />);
    const wrapper = screen.getByLabelText('العنوان').closest('[data-size]');
    expect(wrapper).toHaveAttribute('data-size', 'lg');
    expect(wrapper).toHaveAttribute('data-surface', 'default');
  });

  it.each(['md', 'lg'] as const)('accepts size="%s"', (size) => {
    renderWithProviders(<TextInput label="العنوان" size={size} />);
    expect(screen.getByLabelText('العنوان').closest('[data-size]')).toHaveAttribute(
      'data-size',
      size
    );
  });

  it.each(['default', 'filledDarker', 'filledLighter'] as const)(
    'accepts surface="%s"',
    (surface) => {
      renderWithProviders(<TextInput label="العنوان" surface={surface} />);
      expect(screen.getByLabelText('العنوان').closest('[data-surface]')).toHaveAttribute(
        'data-surface',
        surface
      );
    }
  );

  it('renders a prefix and suffix', () => {
    renderWithProviders(<TextInput label="السعر" prefix="ر.س" suffix=".00" />);
    expect(screen.getByText('ر.س')).toBeInTheDocument();
    expect(screen.getByText('.00')).toBeInTheDocument();
  });

  it('renders a leading icon', () => {
    renderWithProviders(
      <TextInput label="بحث" iconStart={<span data-testid="lead-icon" aria-hidden="true" />} />
    );
    expect(screen.getByTestId('lead-icon')).toBeInTheDocument();
  });

  it('is disabled and read-only via native attributes', () => {
    renderWithProviders(<TextInput label="معطّل" disabled />);
    expect(screen.getByLabelText('معطّل')).toBeDisabled();
  });

  it('has no accessibility violations', async () => {
    const { container } = renderWithProviders(<TextInput label="العنوان" helperText="نص مساعد" />);
    await expectNoA11yViolations(container);
  });

  it('has no accessibility violations when disabled', async () => {
    const { container } = renderWithProviders(<TextInput label="العنوان" disabled />);
    await expectNoA11yViolations(container);
  });

  it('sets dir="auto" on the input and on prefix/suffix for RTL-safe rendering', () => {
    renderWithProviders(
      <div dir="rtl">
        <TextInput label="السعر" prefix="ر.س" suffix=".00" />
      </div>
    );
    expect(screen.getByLabelText('السعر')).toHaveAttribute('dir', 'auto');
    expect(screen.getByText('ر.س')).toHaveAttribute('dir', 'auto');
    expect(screen.getByText('.00')).toHaveAttribute('dir', 'auto');
  });

  it('renders no unrecognized-DOM-attribute warnings with the full prop surface', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    renderWithProviders(
      <TextInput
        label="العنوان"
        helperText="نص مساعد"
        errorText="خطأ"
        requiredField
        prefix="ر.س"
        suffix=".00"
        iconStart={<span aria-hidden="true" />}
        size="md"
        surface="filledDarker"
        disabled
      />
    );
    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  describe('official Figma matrix — size × surface × error × disabled × readOnly stability', () => {
    it.each(
      MATRIX_SIZES.flatMap((size) =>
        MATRIX_SURFACES.flatMap((surface) => [
          { size, surface, error: false, disabled: false, readOnly: false },
          { size, surface, error: true, disabled: false, readOnly: false },
          { size, surface, error: false, disabled: true, readOnly: false },
          { size, surface, error: false, disabled: false, readOnly: true },
        ])
      )
    )(
      'renders size=$size surface=$surface error=$error disabled=$disabled readOnly=$readOnly without throwing',
      ({ size, surface, error, disabled, readOnly }) => {
        renderWithProviders(
          <TextInput
            label="عنوان"
            size={size}
            surface={surface}
            errorText={error ? 'خطأ' : undefined}
            disabled={disabled}
            readOnly={readOnly}
            defaultValue={disabled || readOnly ? 'قيمة' : undefined}
          />
        );
        const wrapper = screen.getByLabelText('عنوان').closest('[data-size]');
        expect(wrapper).toHaveAttribute('data-size', size);
        expect(wrapper).toHaveAttribute('data-surface', surface);
        if (error) expect(wrapper).toHaveAttribute('data-invalid', 'true');
        if (disabled) expect(screen.getByLabelText('عنوان')).toBeDisabled();
        if (readOnly) expect(screen.getByLabelText('عنوان')).toHaveAttribute('readonly');
      }
    );
  });
});
