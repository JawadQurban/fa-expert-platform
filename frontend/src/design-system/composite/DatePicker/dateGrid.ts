/**
 * Pure date-grid helpers for `DatePicker` — no React, no locale-specific
 * week-start handling (weeks always render Sunday-first; a known
 * simplification, not a DGA-verified week-start convention — Q3/Q20).
 */
export function addDays(date: Date, amount: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

export function addMonths(date: Date, amount: number): Date {
  const next = new Date(date);
  const day = next.getDate();
  next.setDate(1);
  next.setMonth(next.getMonth() + amount);
  // Clamp to the last day of the target month if the original day overflows
  // (e.g. Jan 31 + 1 month should not silently become Mar 3).
  const daysInTargetMonth = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
  next.setDate(Math.min(day, daysInTargetMonth));
  return next;
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

/** Always returns exactly 42 dates (6 Sunday-first weeks) covering `monthDate`'s month. */
export function getMonthGrid(monthDate: Date): Date[] {
  const firstOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const gridStart = addDays(firstOfMonth, -firstOfMonth.getDay());
  return Array.from({ length: 42 }, (_, index) => addDays(gridStart, index));
}

export function chunkWeeks(days: Date[]): Date[][] {
  const weeks: Date[][] = [];
  for (let index = 0; index < days.length; index += 7) {
    weeks.push(days.slice(index, index + 7));
  }
  return weeks;
}
