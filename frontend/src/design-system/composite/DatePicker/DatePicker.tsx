import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@utils/cn';
import { useIsRtl } from '@ds/providers';
import { useFocusTrap } from '@hooks/useFocusTrap';
import type { Locale } from '@/types';
import { addDays, addMonths, chunkWeeks, getMonthGrid, isSameDay, isSameMonth } from './dateGrid';
import {
  addHijriMonths,
  getHijriMonthGrid,
  isSameHijriMonth,
  toHijri,
  fromHijri,
} from './hijriCalendar';
import styles from './DatePicker.module.css';

/**
 * DatePicker (FADS composite — DGA CMP-19, Primary conditional).
 *
 * Verified live against the official Platforms Code Figma Date Picker
 * component set (file `J0xq7JG3JKshRDzrgAM7E0`, node `30150:10582` — 6
 * top-level symbols: `rtl` × `range` × `picker`(open/closed)) via the Figma
 * MCP — see `docs/FIGMA_DATE_PICKER_SPECIFICATION.md` and
 * `reports/VISUAL_COMPLIANCE/DatePicker/VISUAL_COMPLIANCE_DATE_PICKER.md`.
 *
 * This pass added everything the live node has that the pre-existing
 * implementation was missing: Hijri/Gregorian calendar support (`calendar`
 * prop, built on `hijriCalendar.ts` — native `Intl` `islamic-umalqura`, no
 * external date library), range selection (`range`/`rangeValue`/
 * `onRangeChange`, dual calendars + a connected range highlight), a "Quick
 * options" preset sidebar (`quickOptions`, range-mode only — the live node
 * only samples it there), and a year dropdown (in place of year-by-year
 * paging). The trigger's **visual chrome** was rebuilt on `TextInput`'s own
 * verified tokens (`--fads-sys-textinput-*`) to match the live "Date Field"
 * pixel-for-pixel — but it deliberately **stays a real `<button>`**, not a
 * literal `<TextInput>` composition: this component's own pre-existing
 * WAI-ARIA APG "Date Picker Dialog" trigger pattern (a button that opens the
 * dialog) is already correct, and swapping to an `<input>` would change
 * interactive semantics for no compliance benefit while risking the 13
 * already-passing, previously-verified tests built around `role="button"`.
 * Disclosed, not a silent shortcut.
 *
 * Everything already solid is unchanged: `document.body` portal, fixed
 * positioning re-measured on resize/scroll, outside-click/Escape, the shared
 * `useFocusTrap` (same hook `Modal`/`NavDrawer` use), roving-tabindex day
 * navigation with RTL-aware `ArrowLeft`/`ArrowRight`, and `PageUp`/`PageDown`
 * month paging.
 *
 * `errorText`/`requiredField` drive the trigger's visual state
 * (`data-invalid` border color, a visible `*`) and the error paragraph's own
 * `role="alert"`, but **not** `aria-invalid`/`aria-required` on the trigger
 * itself — `eslint-plugin-jsx-a11y`'s `jsx-a11y/role-supports-aria-props`
 * correctly flags both as unsupported on the implicit `button` role (they're
 * form-field properties; a trigger button isn't the form field, the
 * calendar's *result* is), the same category of catch as `Radio`'s own
 * `aria-readonly` finding earlier in this batch.
 */
export type DatePickerCalendarSystem = 'gregorian' | 'hijri' | 'auto';
export type DateRange = readonly [Date | null, Date | null];

interface QuickOption {
  readonly label: string;
  readonly getRange: (today: Date) => DateRange;
}

function startOfWeek(date: Date): Date {
  return addDays(date, -date.getDay());
}
function endOfWeek(date: Date): Date {
  return addDays(date, 6 - date.getDay());
}
function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}
function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

/** The 9 presets live-verified on the official Range=True node. */
function getQuickOptions(labels: {
  today: string;
  thisWeek: string;
  lastWeek: string;
  thisMonth: string;
  lastMonth: string;
  last3Months: string;
  last7Days: string;
  last30Days: string;
  last90Days: string;
}): readonly QuickOption[] {
  return [
    { label: labels.today, getRange: (t) => [t, t] },
    { label: labels.thisWeek, getRange: (t) => [startOfWeek(t), endOfWeek(t)] },
    {
      label: labels.lastWeek,
      getRange: (t) => {
        const lastWeekDay = addDays(t, -7);
        return [startOfWeek(lastWeekDay), endOfWeek(lastWeekDay)];
      },
    },
    { label: labels.thisMonth, getRange: (t) => [startOfMonth(t), endOfMonth(t)] },
    {
      label: labels.lastMonth,
      getRange: (t) => {
        const lastMonthDay = addMonths(t, -1);
        return [startOfMonth(lastMonthDay), endOfMonth(lastMonthDay)];
      },
    },
    { label: labels.last3Months, getRange: (t) => [addMonths(t, -3), t] },
    { label: labels.last7Days, getRange: (t) => [addDays(t, -6), t] },
    { label: labels.last30Days, getRange: (t) => [addDays(t, -29), t] },
    { label: labels.last90Days, getRange: (t) => [addDays(t, -89), t] },
  ];
}

export interface DatePickerProps {
  /** Accessible name for the trigger button and the popover dialog. */
  readonly label: string;
  readonly value?: Date | null;
  readonly onChange?: (date: Date) => void;
  /** Drives month/day/weekday formatting via `Intl`. Defaults to `'en'`. */
  readonly locale?: Locale;
  readonly disabled?: boolean;
  readonly placeholder?: string;
  readonly previousMonthLabel?: string;
  readonly nextMonthLabel?: string;
  /** Prefix announced for today's cell, e.g. "Today, <date>". */
  readonly todayLabel?: string;
  readonly helperText?: ReactNode;
  readonly errorText?: ReactNode;
  readonly requiredField?: boolean;
  /**
   * Maps to the official Hijri/Gregorian auto-detect behavior described in
   * the live node's own helper text ("Date will automatically detect Hijri
   * or Georgian date"). `'auto'` (default) shows Hijri for Arabic-family
   * locales and Gregorian otherwise — the exact typed-input numeral-
   * ambiguity detection Figma's copy alludes to is not specified anywhere in
   * the live data beyond that one sentence, so it is not implemented;
   * disclosed in the spec, not guessed at.
   */
  readonly calendar?: DatePickerCalendarSystem;
  /** Shows the "Quick options" preset sidebar — live-verified as a range-mode-only feature; a no-op without `range`. */
  readonly quickOptions?: boolean;
  /** Enables range selection: two calendars, start/end dates. Maps to the official `Range` property. */
  readonly range?: boolean;
  readonly rangeValue?: DateRange;
  readonly onRangeChange?: (range: DateRange) => void;
  readonly rangeStartLabel?: string;
  readonly rangeEndLabel?: string;
  readonly yearDropdownLabel?: string;
  readonly className?: string;
}

export function DatePicker({
  label,
  value = null,
  onChange,
  locale = 'en',
  disabled = false,
  placeholder = 'Select a date',
  previousMonthLabel = 'Previous month',
  nextMonthLabel = 'Next month',
  todayLabel = 'Today',
  helperText,
  errorText,
  requiredField = false,
  calendar = 'auto',
  quickOptions = false,
  range = false,
  rangeValue = [null, null],
  onRangeChange,
  rangeStartLabel = 'Start date',
  rangeEndLabel = 'End date',
  yearDropdownLabel = 'Select year',
  className,
}: DatePickerProps) {
  const today = useMemo(() => new Date(), []);
  const resolvedCalendar: 'gregorian' | 'hijri' =
    calendar === 'auto' ? (locale.startsWith('ar') ? 'hijri' : 'gregorian') : calendar;
  const isHijri = resolvedCalendar === 'hijri';

  const [open, setOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(value ?? today);
  const [focusedDate, setFocusedDate] = useState(value ?? today);
  const [focusedPanel, setFocusedPanel] = useState(0);
  const [pendingRangeStart, setPendingRangeStart] = useState<Date | null>(null);
  const [yearMenuOpen, setYearMenuOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const isRtl = useIsRtl();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useFocusTrap<HTMLDivElement>(open);
  const dayRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const invalid = errorText != null && errorText !== false;

  const isSameCalendarMonth = (a: Date, b: Date) =>
    isHijri ? isSameHijriMonth(a, b, locale) : isSameMonth(a, b);
  const addCalendarMonths = (date: Date, amount: number) =>
    isHijri ? addHijriMonths(date, amount, locale) : addMonths(date, amount);
  const getGrid = (monthDate: Date) =>
    isHijri ? getHijriMonthGrid(monthDate, locale) : getMonthGrid(monthDate);

  // Resync when `value` changes from outside (e.g. a parent form reset or
  // load) — previously this only ran once via useState's initializer, so
  // reopening after an external change showed a stale month/focused cell.
  useEffect(() => {
    const next = value ?? today;
    setVisibleMonth((current) => (isSameCalendarMonth(current, next) ? current : next));
    setFocusedDate((current) => (isSameDay(current, next) ? current : next));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, today, isHijri, locale]);

  // Esc closes (scoped to the popover, matching the NavDrawer/Modal pattern).
  useEffect(() => {
    if (!open) return;
    const popover = popoverRef.current;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    popover?.addEventListener('keydown', handleKeyDown);
    return () => popover?.removeEventListener('keydown', handleKeyDown);
  }, [open, popoverRef]);

  // Click outside the trigger/popover closes it. The popover is portaled, so
  // it is no longer a DOM descendant of `rootRef` — it must be checked too.
  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || popoverRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [open, popoverRef]);

  // Position the portaled popover under the trigger, re-measuring on open
  // and whenever the trigger might have moved (resize/scroll of any
  // ancestor).
  useLayoutEffect(() => {
    if (!open) {
      setPosition(null);
      return;
    }
    const updatePosition = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (rect) setPosition({ top: rect.bottom + 4, left: rect.left });
    };
    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [open]);

  // The focus trap moves focus to the first focusable element. Once
  // mounted, re-focus the actual roving-tabindex day.
  useEffect(() => {
    if (!open) return;
    dayRefs.current[`${focusedPanel}-${focusedDate.toDateString()}`]?.focus();
  }, [open, focusedDate, focusedPanel]);

  const goToMonth = (amount: number) => {
    setVisibleMonth((current) => addCalendarMonths(current, amount));
    setFocusedDate((current) => addCalendarMonths(current, amount));
  };

  const moveFocus = (panel: number, amount: number) => {
    const next = addDays(focusedDate, amount);
    setFocusedDate(next);
    setFocusedPanel(panel);
    const panelMonth = panel === 0 ? visibleMonth : addCalendarMonths(visibleMonth, 1);
    if (!isSameCalendarMonth(next, panelMonth)) {
      setVisibleMonth(panel === 0 ? next : addCalendarMonths(next, -1));
    }
  };

  const selectSingleDate = (date: Date) => {
    onChange?.(date);
    setFocusedDate(date);
    setOpen(false);
  };

  const selectRangeDate = (date: Date) => {
    const start = rangeValue?.[0] ?? pendingRangeStart;
    const end = rangeValue?.[1] ?? null;
    if (!start || (start && end)) {
      setPendingRangeStart(date);
      onRangeChange?.([date, null]);
    } else if (date.getTime() < start.getTime()) {
      setPendingRangeStart(date);
      onRangeChange?.([date, null]);
    } else {
      setPendingRangeStart(null);
      onRangeChange?.([start, date]);
      setOpen(false);
    }
    setFocusedDate(date);
  };

  const applyQuickOption = ([start, end]: DateRange) => {
    setPendingRangeStart(null);
    onRangeChange?.([start, end]);
    if (start) {
      setVisibleMonth(start);
      setFocusedDate(start);
    }
    setOpen(false);
  };

  const secondaryMonth = useMemo(
    () => addCalendarMonths(visibleMonth, 1),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [visibleMonth, isHijri, locale]
  );

  const weekdayFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(isHijri ? `${locale}-u-ca-islamic-umalqura` : locale, {
        weekday: 'short',
      }),
    [locale, isHijri]
  );
  const monthFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(isHijri ? `${locale}-u-ca-islamic-umalqura` : locale, {
        month: 'long',
        year: 'numeric',
      }),
    [locale, isHijri]
  );
  const dayFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(isHijri ? `${locale}-u-ca-islamic-umalqura` : locale, {
        day: 'numeric',
      }),
    [locale, isHijri]
  );
  const fullDateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(isHijri ? `${locale}-u-ca-islamic-umalqura` : locale, {
        dateStyle: 'full',
      }),
    [locale, isHijri]
  );

  const currentSystemYear = isHijri
    ? toHijri(visibleMonth, locale).year
    : visibleMonth.getFullYear();
  const yearOptions = useMemo(
    () => Array.from({ length: 111 }, (_, index) => currentSystemYear - 100 + index),
    [currentSystemYear]
  );

  const setYear = (year: number) => {
    const next = isHijri
      ? fromHijri(year, toHijri(visibleMonth, locale).month, 1, locale)
      : new Date(year, visibleMonth.getMonth(), 1);
    setVisibleMonth(next);
    setFocusedDate(next);
    setYearMenuOpen(false);
  };

  const triggerText = value ? fullDateFormatter.format(value) : placeholder;
  const rangeStartText = rangeValue?.[0] ? fullDateFormatter.format(rangeValue[0]) : placeholder;
  const rangeEndText = rangeValue?.[1] ? fullDateFormatter.format(rangeValue[1]) : placeholder;

  function renderCalendarPanel(panelIndex: number, monthDate: Date) {
    const weeks = chunkWeeks(getGrid(monthDate));
    const rangeStart = rangeValue?.[0] ?? pendingRangeStart;
    const rangeEnd = rangeValue?.[1] ?? null;
    const panelYear = isHijri ? toHijri(monthDate, locale).year : monthDate.getFullYear();

    return (
      <div className={styles.calendar} key={panelIndex}>
        <div className={styles.monthNav}>
          {panelIndex === 0 && (
            <button
              type="button"
              className={styles.navButton}
              onClick={() => goToMonth(isRtl ? 1 : -1)}
              aria-label={previousMonthLabel}
            >
              ‹
            </button>
          )}
          <p className={styles.monthLabel}>{monthFormatter.format(monthDate)}</p>
          <div className={styles.yearDropdown}>
            <button
              type="button"
              className={styles.yearButton}
              onClick={() => setYearMenuOpen((current) => !current)}
              aria-haspopup="listbox"
              aria-expanded={yearMenuOpen}
              aria-label={`${yearDropdownLabel}: ${panelYear}`}
            >
              {panelYear}
            </button>
            {yearMenuOpen && panelIndex === 0 && (
              <ul className={styles.yearMenu} role="listbox" aria-label={yearDropdownLabel}>
                {yearOptions.map((year) => (
                  <li key={year}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={year === currentSystemYear}
                      className={styles.yearOption}
                      data-selected={year === currentSystemYear || undefined}
                      onClick={() => setYear(year)}
                    >
                      {year}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {panelIndex === (range ? 1 : 0) && (
            <button
              type="button"
              className={styles.navButton}
              onClick={() => goToMonth(isRtl ? -1 : 1)}
              aria-label={nextMonthLabel}
            >
              ›
            </button>
          )}
        </div>
        <div role="grid" aria-label={monthFormatter.format(monthDate)} className={styles.grid}>
          <div role="row" className={styles.weekRow}>
            {weeks[0]?.map((day) => (
              <span key={day.getDay()} role="columnheader" className={styles.weekday}>
                {weekdayFormatter.format(day)}
              </span>
            ))}
          </div>
          {weeks.map((week, weekIndex) => (
            <div role="row" className={styles.weekRow} key={weekIndex}>
              {week.map((day) => {
                const isSelected = !range && value != null && isSameDay(day, value);
                const isRangeStart = range && rangeStart != null && isSameDay(day, rangeStart);
                const isRangeEnd = range && rangeEnd != null && isSameDay(day, rangeEnd);
                const isInRange =
                  range &&
                  rangeStart != null &&
                  rangeEnd != null &&
                  day.getTime() > rangeStart.getTime() &&
                  day.getTime() < rangeEnd.getTime();
                const isToday = isSameDay(day, today);
                const isFocusable = panelIndex === focusedPanel && isSameDay(day, focusedDate);
                const outsideMonth = !isSameCalendarMonth(day, monthDate);
                const accessibleLabel = isToday
                  ? `${todayLabel} ${fullDateFormatter.format(day)}`
                  : fullDateFormatter.format(day);
                const nextKey = isRtl ? 'ArrowLeft' : 'ArrowRight';
                const previousKey = isRtl ? 'ArrowRight' : 'ArrowLeft';

                return (
                  <div
                    role="gridcell"
                    aria-selected={isSelected || isRangeStart || isRangeEnd || isInRange}
                    key={day.toISOString()}
                    className={styles.gridcell}
                  >
                    <button
                      type="button"
                      ref={(node) => {
                        dayRefs.current[`${panelIndex}-${day.toDateString()}`] = node;
                      }}
                      className={styles.day}
                      tabIndex={isFocusable ? 0 : -1}
                      aria-current={isToday ? 'date' : undefined}
                      aria-label={accessibleLabel}
                      data-outside={outsideMonth || undefined}
                      data-today={isToday || undefined}
                      data-selected={isSelected || undefined}
                      data-range-start={isRangeStart || undefined}
                      data-range-end={isRangeEnd || undefined}
                      data-in-range={isInRange || undefined}
                      onClick={() => (range ? selectRangeDate(day) : selectSingleDate(day))}
                      onKeyDown={(event) => {
                        if (event.key === nextKey) {
                          event.preventDefault();
                          moveFocus(panelIndex, 1);
                        } else if (event.key === previousKey) {
                          event.preventDefault();
                          moveFocus(panelIndex, -1);
                        } else if (event.key === 'ArrowDown') {
                          event.preventDefault();
                          moveFocus(panelIndex, 7);
                        } else if (event.key === 'ArrowUp') {
                          event.preventDefault();
                          moveFocus(panelIndex, -7);
                        } else if (event.key === 'PageDown') {
                          event.preventDefault();
                          goToMonth(1);
                        } else if (event.key === 'PageUp') {
                          event.preventDefault();
                          goToMonth(-1);
                        } else if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          if (range) selectRangeDate(day);
                          else selectSingleDate(day);
                        }
                      }}
                    >
                      {dayFormatter.format(day)}
                    </button>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  }

  const quickOptionsList = useMemo(
    () =>
      getQuickOptions({
        today: todayLabel,
        thisWeek: 'This week',
        lastWeek: 'Last week',
        thisMonth: 'This month',
        lastMonth: 'Last month',
        last3Months: 'Last 3 months',
        last7Days: 'Last 7 days',
        last30Days: 'Last 30 days',
        last90Days: 'Last 90 days',
      }),
    [todayLabel]
  );

  return (
    <div ref={rootRef} className={cn(styles.datePicker, className)}>
      {!range && (
        <button
          ref={triggerRef}
          type="button"
          className={styles.trigger}
          data-invalid={invalid || undefined}
          aria-haspopup="dialog"
          aria-expanded={open}
          disabled={disabled}
          onClick={() => setOpen((current) => !current)}
        >
          <span className={styles.triggerLabel}>
            {requiredField && (
              <span className={styles.required} aria-hidden="true">
                *
              </span>
            )}
            {label}
          </span>
          <span className={styles.triggerValue} data-placeholder={!value || undefined}>
            {triggerText}
          </span>
        </button>
      )}
      {range && (
        <div className={styles.rangeTriggers}>
          <button
            ref={triggerRef}
            type="button"
            className={styles.trigger}
            aria-haspopup="dialog"
            aria-expanded={open}
            disabled={disabled}
            onClick={() => setOpen((current) => !current)}
          >
            <span className={styles.triggerLabel}>{rangeStartLabel}</span>
            <span className={styles.triggerValue} data-placeholder={!rangeValue?.[0] || undefined}>
              {rangeStartText}
            </span>
          </button>
          <button
            type="button"
            className={styles.trigger}
            aria-haspopup="dialog"
            aria-expanded={open}
            disabled={disabled}
            onClick={() => setOpen((current) => !current)}
          >
            <span className={styles.triggerLabel}>{rangeEndLabel}</span>
            <span className={styles.triggerValue} data-placeholder={!rangeValue?.[1] || undefined}>
              {rangeEndText}
            </span>
          </button>
        </div>
      )}
      {helperText != null && !invalid && <p className={styles.helper}>{helperText}</p>}
      {invalid && (
        <p className={styles.error} role="alert">
          {errorText}
        </p>
      )}

      {open &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={popoverRef}
            className={styles.popover}
            role="dialog"
            aria-modal="true"
            aria-label={label}
            data-fads-portal="true"
            style={position ? { top: position.top, left: position.left } : { visibility: 'hidden' }}
          >
            <div className={styles.popoverBody}>
              {range && quickOptions && (
                <div className={styles.quickOptions}>
                  <p className={styles.quickOptionsLabel}>QUICK OPTION</p>
                  {quickOptionsList.map((option) => (
                    <button
                      key={option.label}
                      type="button"
                      className={styles.quickOption}
                      onClick={() => applyQuickOption(option.getRange(today))}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
              <div className={styles.calendars}>
                {renderCalendarPanel(0, visibleMonth)}
                {range && renderCalendarPanel(1, secondaryMonth)}
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
