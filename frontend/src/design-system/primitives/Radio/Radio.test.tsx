import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, expectNoA11yViolations } from '@/test/test-utils';
import { Radio, RadioGroup } from './Radio';

describe('Radio / RadioGroup', () => {
  it('renders a labelled group of radios', () => {
    renderWithProviders(
      <RadioGroup legend="الأولوية">
        <Radio value="low" label="منخفض" />
        <Radio value="high" label="مرتفع" />
      </RadioGroup>
    );
    expect(screen.getByRole('group', { name: 'الأولوية' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'منخفض' })).toBeInTheDocument();
  });

  it('selects an option and reports the value (uncontrolled)', async () => {
    const onValueChange = vi.fn();
    const { user } = renderWithProviders(
      <RadioGroup legend="الأولوية" onValueChange={onValueChange}>
        <Radio value="low" label="منخفض" />
        <Radio value="high" label="مرتفع" />
      </RadioGroup>
    );
    await user.click(screen.getByRole('radio', { name: 'مرتفع' }));
    expect(onValueChange).toHaveBeenCalledWith('high');
    expect(screen.getByRole('radio', { name: 'مرتفع' })).toBeChecked();
  });

  it('reflects a controlled value and does not change it without a re-render', async () => {
    const onValueChange = vi.fn();
    const { user } = renderWithProviders(
      <RadioGroup legend="الأولوية" value="low" onValueChange={onValueChange}>
        <Radio value="low" label="منخفض" />
        <Radio value="high" label="مرتفع" />
      </RadioGroup>
    );
    expect(screen.getByRole('radio', { name: 'منخفض' })).toBeChecked();
    await user.click(screen.getByRole('radio', { name: 'مرتفع' }));
    expect(onValueChange).toHaveBeenCalledWith('high');
    // Controlled: value prop unchanged by the click alone, so "low" stays checked.
    expect(screen.getByRole('radio', { name: 'منخفض' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'مرتفع' })).not.toBeChecked();
  });

  it('supports keyboard arrow-key navigation within a group (native radio semantics)', async () => {
    const { user } = renderWithProviders(
      <RadioGroup legend="الأولوية" defaultValue="low">
        <Radio value="low" label="منخفض" />
        <Radio value="high" label="مرتفع" />
      </RadioGroup>
    );
    const low = screen.getByRole('radio', { name: 'منخفض' });
    const high = screen.getByRole('radio', { name: 'مرتفع' });
    low.focus();
    await user.keyboard('{ArrowDown}');
    expect(high).toHaveFocus();
    expect(high).toBeChecked();
  });

  it('renders an optional description associated via aria-describedby', () => {
    renderWithProviders(
      <RadioGroup legend="خطة">
        <Radio value="pro" label="احترافي" description="يشمل ميزات متقدمة." />
      </RadioGroup>
    );
    const radio = screen.getByRole('radio', { name: 'احترافي' });
    const describedBy = radio.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy!)).toHaveTextContent('يشمل ميزات متقدمة.');
  });

  it('exposes a group error as an alert', () => {
    renderWithProviders(
      <RadioGroup legend="الأولوية" errorText="مطلوب">
        <Radio value="low" label="منخفض" />
      </RadioGroup>
    );
    expect(screen.getByRole('alert')).toHaveTextContent('مطلوب');
  });

  it('disables every radio in the group via the native fieldset cascade', () => {
    renderWithProviders(
      <RadioGroup legend="الأولوية" disabled defaultValue="low">
        <Radio value="low" label="منخفض" />
        <Radio value="high" label="مرتفع" />
      </RadioGroup>
    );
    expect(screen.getByRole('radio', { name: 'منخفض' })).toBeDisabled();
    expect(screen.getByRole('radio', { name: 'مرتفع' })).toBeDisabled();
  });

  it('blocks selection changes when the group is readOnly (controlled)', async () => {
    // readOnly is naturally a controlled-usage pattern (showing a fixed answer) — the
    // authoritative guard is the onChange-level no-op, which relies on the parent's
    // `value` never updating; React then keeps `checked` pinned to it on re-render
    // regardless of any transient native DOM toggle a click may otherwise cause.
    const onValueChange = vi.fn();
    const { user } = renderWithProviders(
      <RadioGroup legend="الأولوية" readOnly value="low" onValueChange={onValueChange}>
        <Radio value="low" label="منخفض" />
        <Radio value="high" label="مرتفع" />
      </RadioGroup>
    );
    await user.click(screen.getByRole('radio', { name: 'مرتفع' }));
    expect(onValueChange).not.toHaveBeenCalled();
    expect(screen.getByRole('radio', { name: 'منخفض' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'مرتفع' })).not.toBeChecked();
  });

  it.each(['primary', 'neutral'] as const)('accepts mood="%s" on RadioGroup', (mood) => {
    renderWithProviders(
      <RadioGroup legend="الأولوية" mood={mood} defaultValue="low">
        <Radio value="low" label="منخفض" />
      </RadioGroup>
    );
    expect(screen.getByRole('radio', { name: 'منخفض' })).toBeInTheDocument();
  });

  it('allows a per-Radio mood override', () => {
    renderWithProviders(
      <RadioGroup legend="الأولوية" mood="primary" defaultValue="low">
        <Radio value="low" label="منخفض" mood="neutral" />
      </RadioGroup>
    );
    expect(screen.getByRole('radio', { name: 'منخفض' })).toBeInTheDocument();
  });

  it('sets dir="auto" is not required — label/description render RTL text correctly under an RTL ancestor', () => {
    renderWithProviders(
      <div dir="rtl">
        <RadioGroup legend="عنوان" defaultValue="a">
          <Radio value="a" label="خيار" description="وصف الخيار" />
        </RadioGroup>
      </div>
    );
    expect(screen.getByText('وصف الخيار')).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = renderWithProviders(
      <RadioGroup legend="الأولوية" defaultValue="low">
        <Radio value="low" label="منخفض" />
        <Radio value="high" label="مرتفع" />
      </RadioGroup>
    );
    await expectNoA11yViolations(container);
  });

  it('has no accessibility violations with an error and a description', async () => {
    const { container } = renderWithProviders(
      <RadioGroup legend="الأولوية" errorText="مطلوب" defaultValue="low">
        <Radio value="low" label="منخفض" description="وصف" />
        <Radio value="high" label="مرتفع" />
      </RadioGroup>
    );
    await expectNoA11yViolations(container);
  });

  it('has no accessibility violations when disabled', async () => {
    const { container } = renderWithProviders(
      <RadioGroup legend="الأولوية" disabled defaultValue="low">
        <Radio value="low" label="منخفض" />
        <Radio value="high" label="مرتفع" />
      </RadioGroup>
    );
    await expectNoA11yViolations(container);
  });
});
