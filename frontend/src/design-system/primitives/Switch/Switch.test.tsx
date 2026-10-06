import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, expectNoA11yViolations } from '@/test/test-utils';
import { Switch } from './Switch';

describe('Switch', () => {
  it('renders a labelled switch that is off by default', () => {
    renderWithProviders(<Switch label="الإشعارات" />);
    const sw = screen.getByRole('switch', { name: 'الإشعارات' });
    expect(sw).toHaveAttribute('aria-checked', 'false');
  });

  it('toggles on click and reports the new state (uncontrolled)', async () => {
    const onChange = vi.fn();
    const { user } = renderWithProviders(<Switch label="الإشعارات" onCheckedChange={onChange} />);
    await user.click(screen.getByRole('switch'));
    expect(onChange).toHaveBeenCalledWith(true);
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
  });

  it('reflects a controlled checked value and does not change it without a re-render', async () => {
    const onChange = vi.fn();
    const { user } = renderWithProviders(
      <Switch label="الإشعارات" checked={false} onCheckedChange={onChange} />
    );
    const sw = screen.getByRole('switch');
    expect(sw).toHaveAttribute('aria-checked', 'false');
    await user.click(sw);
    expect(onChange).toHaveBeenCalledWith(true);
    // Controlled: checked prop unchanged by the click alone.
    expect(sw).toHaveAttribute('aria-checked', 'false');
  });

  it('toggles with the Space key', async () => {
    const { user } = renderWithProviders(<Switch label="الإشعارات" />);
    const sw = screen.getByRole('switch');
    sw.focus();
    await user.keyboard(' ');
    expect(sw).toHaveAttribute('aria-checked', 'true');
  });

  it('toggles with the Enter key', async () => {
    const { user } = renderWithProviders(<Switch label="الإشعارات" />);
    const sw = screen.getByRole('switch');
    sw.focus();
    await user.keyboard('{Enter}');
    expect(sw).toHaveAttribute('aria-checked', 'true');
  });

  it('does not toggle when disabled', async () => {
    const onChange = vi.fn();
    const { user } = renderWithProviders(
      <Switch label="الإشعارات" disabled onCheckedChange={onChange} />
    );
    await user.click(screen.getByRole('switch'));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('renders an optional description associated via aria-describedby', () => {
    renderWithProviders(<Switch label="المزامنة" description="تحديث البيانات تلقائيًا." />);
    const sw = screen.getByRole('switch');
    const describedBy = sw.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy!)).toHaveTextContent('تحديث البيانات تلقائيًا.');
  });

  it('marks invalid and exposes the error as an alert', () => {
    renderWithProviders(<Switch label="الإشعارات" errorText="تعذّر الحفظ" />);
    const sw = screen.getByRole('switch');
    expect(sw).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent('تعذّر الحفظ');
  });

  it('submits its value via a hidden input when name is provided', () => {
    renderWithProviders(<Switch label="الإشعارات" name="notifications" defaultChecked />);
    const hidden = document.querySelector('input[type="hidden"][name="notifications"]');
    expect(hidden).toHaveValue('on');
  });

  it('renders the switch after the label when trailing is set', () => {
    renderWithProviders(<Switch label="الإشعارات" trailing />);
    const sw = screen.getByRole('switch');
    const label = screen.getByText('الإشعارات');
    // DOCUMENT_POSITION_FOLLOWING (4) means `sw` comes after `label` in the DOM.
    expect(label.compareDocumentPosition(sw) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('renders the switch before the label by default (non-trailing)', () => {
    renderWithProviders(<Switch label="الإشعارات" />);
    const sw = screen.getByRole('switch');
    const label = screen.getByText('الإشعارات');
    expect(label.compareDocumentPosition(sw) & Node.DOCUMENT_POSITION_PRECEDING).toBeTruthy();
  });

  it('renders RTL text correctly under an RTL ancestor', () => {
    renderWithProviders(
      <div dir="rtl">
        <Switch label="خيار" description="وصف الخيار" />
      </div>
    );
    expect(screen.getByText('وصف الخيار')).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = renderWithProviders(<Switch label="الإشعارات" />);
    await expectNoA11yViolations(container);
  });

  it('has no accessibility violations with an error and a description', async () => {
    const { container } = renderWithProviders(
      <Switch label="الإشعارات" description="وصف" errorText="خطأ" />
    );
    await expectNoA11yViolations(container);
  });

  it('has no accessibility violations when disabled', async () => {
    const { container } = renderWithProviders(<Switch label="الإشعارات" disabled />);
    await expectNoA11yViolations(container);
  });
});
