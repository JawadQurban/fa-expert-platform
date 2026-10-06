import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, within, expectNoA11yViolations } from '@/test/test-utils';
import { DatePicker } from './DatePicker';

describe('DatePicker', () => {
  beforeEach(() => {
    vi.setSystemTime(new Date(2026, 6, 8)); // 2026-07-08, a Wednesday
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows a placeholder when no value is selected', () => {
    renderWithProviders(<DatePicker label="تاريخ الميلاد" placeholder="اختر تاريخًا" />, {
      locale: 'en',
    });
    expect(screen.getByRole('button', { name: /تاريخ الميلاد/ })).toHaveTextContent('اختر تاريخًا');
  });

  it('opens a labelled dialog with a calendar grid on click', async () => {
    const { user } = renderWithProviders(<DatePicker label="تاريخ الميلاد" />, { locale: 'en' });
    await user.click(screen.getByRole('button', { name: /تاريخ الميلاد/ }));
    expect(screen.getByRole('dialog', { name: 'تاريخ الميلاد' })).toBeInTheDocument();
    expect(screen.getByRole('grid')).toBeInTheDocument();
  });

  it('marks today\'s cell with aria-current="date"', async () => {
    const { user } = renderWithProviders(<DatePicker label="تاريخ الميلاد" todayLabel="اليوم" />, {
      locale: 'en',
    });
    await user.click(screen.getByRole('button', { name: /تاريخ الميلاد/ }));
    const todayCell = screen.getByRole('button', { name: /^اليوم/ });
    expect(todayCell).toHaveAttribute('aria-current', 'date');
  });

  it('selects a date on click, closes the popover, and restores trigger focus', async () => {
    const onChange = vi.fn();
    const { user } = renderWithProviders(<DatePicker label="تاريخ الميلاد" onChange={onChange} />, {
      locale: 'en',
    });
    const trigger = screen.getByRole('button', { name: /تاريخ الميلاد/ });
    await user.click(trigger);
    await user.click(screen.getByRole('button', { name: /July 15, 2026/ }));
    expect(onChange).toHaveBeenCalledWith(new Date(2026, 6, 15));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('closes on Escape', async () => {
    const { user } = renderWithProviders(<DatePicker label="تاريخ الميلاد" />, { locale: 'en' });
    await user.click(screen.getByRole('button', { name: /تاريخ الميلاد/ }));
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('navigates to the next/previous month with PageDown/PageUp', async () => {
    const { user } = renderWithProviders(
      <DatePicker label="تاريخ الميلاد" value={new Date(2026, 6, 8)} />,
      {
        locale: 'en',
      }
    );
    await user.click(screen.getByRole('button', { name: /تاريخ الميلاد/ }));
    expect(screen.getByText('July 2026')).toBeInTheDocument();

    await user.keyboard('{PageDown}');
    expect(screen.getByText('August 2026')).toBeInTheDocument();

    await user.keyboard('{PageUp}');
    await user.keyboard('{PageUp}');
    expect(screen.getByText('June 2026')).toBeInTheDocument();
  });

  it('moves focus by day with ArrowRight in LTR', async () => {
    const { user } = renderWithProviders(
      <DatePicker label="تاريخ الميلاد" value={new Date(2026, 6, 8)} />,
      {
        locale: 'en',
      }
    );
    await user.click(screen.getByRole('button', { name: /تاريخ الميلاد/ }));
    await user.keyboard('{ArrowRight}');
    expect(document.activeElement).toHaveAccessibleName(/July 9, 2026/);
  });

  it('is RTL-aware: ArrowLeft moves to the next day under RTL', async () => {
    const { user } = renderWithProviders(
      <DatePicker label="تاريخ الميلاد" value={new Date(2026, 6, 8)} />,
      {
        locale: 'ar',
      }
    );
    await user.click(screen.getByRole('button', { name: /تاريخ الميلاد/ }));
    await user.keyboard('{ArrowLeft}');
    expect(document.activeElement).toHaveAccessibleName(/July 9, 2026/);
  });

  it('resyncs the visible month and focused day when value changes externally', async () => {
    const { user, rerender } = renderWithProviders(
      <DatePicker label="تاريخ الميلاد" value={new Date(2026, 6, 8)} />,
      { locale: 'en' }
    );
    await user.click(screen.getByRole('button', { name: /تاريخ الميلاد/ }));
    expect(screen.getByText('July 2026')).toBeInTheDocument();
    await user.keyboard('{Escape}');

    rerender(<DatePicker label="تاريخ الميلاد" value={new Date(2026, 9, 20)} />);
    await user.click(screen.getByRole('button', { name: /تاريخ الميلاد/ }));
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('October 2026')).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: /October 20, 2026/ })).toHaveFocus();
  });

  it('renders the popover as a document.body portal, not nested inside its own container', async () => {
    const { container, user } = renderWithProviders(<DatePicker label="تاريخ الميلاد" />, {
      locale: 'en',
    });
    await user.click(screen.getByRole('button', { name: /تاريخ الميلاد/ }));
    const dialog = screen.getByRole('dialog');
    expect(container.contains(dialog)).toBe(false);
    expect(document.body.contains(dialog)).toBe(true);
  });

  it('closes when clicking outside, including outside the portaled popover', async () => {
    const { user } = renderWithProviders(<DatePicker label="تاريخ الميلاد" />, { locale: 'en' });
    await user.click(screen.getByRole('button', { name: /تاريخ الميلاد/ }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.click(document.body);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('does not close when clicking inside the portaled popover', async () => {
    const { user } = renderWithProviders(
      <DatePicker label="تاريخ الميلاد" value={new Date(2026, 6, 8)} />,
      { locale: 'en' }
    );
    await user.click(screen.getByRole('button', { name: /تاريخ الميلاد/ }));
    await user.click(screen.getByText('July 2026'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { baseElement, user } = renderWithProviders(<DatePicker label="تاريخ الميلاد" />, {
      locale: 'en',
    });
    await user.click(screen.getByRole('button', { name: /تاريخ الميلاد/ }));
    await expectNoA11yViolations(baseElement);
  });

  it('renders helper text and a required indicator', () => {
    renderWithProviders(<DatePicker label="تاريخ الميلاد" helperText="نص مساعد" requiredField />, {
      locale: 'en',
    });
    expect(screen.getByText('نص مساعد')).toBeInTheDocument();
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('marks the trigger invalid and announces the error as an alert', () => {
    renderWithProviders(<DatePicker label="تاريخ الميلاد" errorText="حقل مطلوب" />, {
      locale: 'en',
    });
    expect(screen.getByRole('alert')).toHaveTextContent('حقل مطلوب');
    expect(screen.getByRole('button', { name: /تاريخ الميلاد/ })).toHaveAttribute(
      'data-invalid',
      'true'
    );
  });

  describe('Hijri calendar', () => {
    it('shows Hijri month/year and day formatting when calendar="hijri"', async () => {
      const { user } = renderWithProviders(
        <DatePicker label="تاريخ الميلاد" value={new Date(2024, 0, 1)} calendar="hijri" />,
        { locale: 'en' }
      );
      await user.click(screen.getByRole('button', { name: /تاريخ الميلاد/ }));
      // 2024-01-01 CE = 19 Jumada II 1445 AH (live-verified in hijriCalendar.test.ts).
      expect(screen.getByRole('grid')).toHaveAttribute(
        'aria-label',
        expect.stringContaining('1445')
      );
    });

    it('auto-detects Hijri for an Arabic-family locale and Gregorian otherwise', async () => {
      const { user, rerender } = renderWithProviders(
        <DatePicker label="تاريخ الميلاد" value={new Date(2024, 0, 1)} locale="ar" />,
        { locale: 'ar' }
      );
      await user.click(screen.getByRole('button', { name: /تاريخ الميلاد/ }));
      expect(screen.getByRole('grid')).toHaveAttribute(
        'aria-label',
        expect.stringContaining('1445')
      );
      await user.keyboard('{Escape}');

      rerender(<DatePicker label="تاريخ الميلاد" value={new Date(2024, 0, 1)} locale="en" />);
      await user.click(screen.getByRole('button', { name: /تاريخ الميلاد/ }));
      expect(screen.getByText('January 2024')).toBeInTheDocument();
    });
  });

  describe('range mode', () => {
    it('renders separate start/end triggers', () => {
      renderWithProviders(
        <DatePicker label="المدة" range rangeStartLabel="من" rangeEndLabel="إلى" />,
        { locale: 'en' }
      );
      expect(screen.getByRole('button', { name: /من/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /إلى/ })).toBeInTheDocument();
    });

    it('renders two calendars side by side when open', async () => {
      const { user } = renderWithProviders(
        <DatePicker label="المدة" range rangeStartLabel="من" rangeEndLabel="إلى" />,
        { locale: 'en' }
      );
      await user.click(screen.getByRole('button', { name: /من/ }));
      expect(screen.getAllByRole('grid')).toHaveLength(2);
    });

    it('builds a range across two clicks and reports it via onRangeChange', async () => {
      const onRangeChange = vi.fn();
      const { user } = renderWithProviders(
        <DatePicker
          label="المدة"
          range
          rangeStartLabel="من"
          rangeEndLabel="إلى"
          value={new Date(2026, 6, 8)}
          onRangeChange={onRangeChange}
        />,
        { locale: 'en' }
      );
      await user.click(screen.getByRole('button', { name: /من/ }));
      await user.click(screen.getByRole('button', { name: /July 5, 2026/ }));
      expect(onRangeChange).toHaveBeenLastCalledWith([new Date(2026, 6, 5), null]);

      await user.click(screen.getByRole('button', { name: /July 20, 2026/ }));
      expect(onRangeChange).toHaveBeenLastCalledWith([new Date(2026, 6, 5), new Date(2026, 6, 20)]);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('closes the popover once a full range is selected', async () => {
      const { user } = renderWithProviders(
        <DatePicker
          label="المدة"
          range
          rangeStartLabel="من"
          rangeEndLabel="إلى"
          rangeValue={[new Date(2026, 6, 5), null]}
        />,
        { locale: 'en' }
      );
      await user.click(screen.getByRole('button', { name: /من/ }));
      await user.click(screen.getByRole('button', { name: /July 10, 2026/ }));
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('quick options', () => {
    it('renders quick option presets only in range mode', async () => {
      const { user } = renderWithProviders(
        <DatePicker label="المدة" range quickOptions rangeStartLabel="من" rangeEndLabel="إلى" />,
        { locale: 'en' }
      );
      await user.click(screen.getByRole('button', { name: /من/ }));
      expect(screen.getByRole('button', { name: 'Today' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Last 7 days' })).toBeInTheDocument();
    });

    it('applies a quick option and closes the popover', async () => {
      const onRangeChange = vi.fn();
      const { user } = renderWithProviders(
        <DatePicker
          label="المدة"
          range
          quickOptions
          rangeStartLabel="من"
          rangeEndLabel="إلى"
          onRangeChange={onRangeChange}
        />,
        { locale: 'en' }
      );
      await user.click(screen.getByRole('button', { name: /من/ }));
      await user.click(screen.getByRole('button', { name: 'Today' }));
      expect(onRangeChange).toHaveBeenCalled();
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('year dropdown', () => {
    it('opens a year listbox and jumps to the selected year', async () => {
      const { user } = renderWithProviders(
        <DatePicker label="تاريخ الميلاد" value={new Date(2026, 6, 8)} />,
        { locale: 'en' }
      );
      await user.click(screen.getByRole('button', { name: /تاريخ الميلاد/ }));
      expect(screen.getByText('July 2026')).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: /Select year: 2026/ }));
      expect(screen.getByRole('listbox')).toBeInTheDocument();
      await user.click(screen.getByRole('option', { name: '2020' }));
      expect(screen.getByText('July 2020')).toBeInTheDocument();
    });
  });
});
