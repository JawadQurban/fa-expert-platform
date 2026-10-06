/**
 * Hijri (Umm al-Qura) calendar helpers — built entirely on the native `Intl`
 * API's `islamic-umalqura` calendar (broadly supported in modern browsers and
 * Node/V8's bundled ICU), no external date library, consistent with
 * `dateGrid.ts`'s own "no external date library" convention.
 *
 * Every `Date` object here is an ordinary Gregorian JS `Date` representing a
 * real instant — Hijri is purely a display/navigation layer on top, never a
 * separately-stored representation. All construction happens at local noon
 * (not UTC) specifically so these dates interoperate safely with
 * `dateGrid.ts`'s local-getter-based `isSameDay`/`isSameMonth` elsewhere in
 * `DatePicker.tsx` (mixing UTC- and local-based date semantics for what's
 * conceptually "the same day" is a common source of off-by-one calendar
 * bugs near midnight).
 */
export interface HijriParts {
  readonly year: number;
  /** 1-indexed (1 = Muharram), matching `Intl`'s own convention. */
  readonly month: number;
  readonly day: number;
}

const formatterCache = new Map<string, Intl.DateTimeFormat>();

function hijriFormatter(locale: string): Intl.DateTimeFormat {
  let formatter = formatterCache.get(locale);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(`${locale}-u-ca-islamic-umalqura`, {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    });
    formatterCache.set(locale, formatter);
  }
  return formatter;
}

export function toHijri(date: Date, locale = 'en'): HijriParts {
  const parts = hijriFormatter(locale).formatToParts(date);
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  return { year: get('year'), month: get('month'), day: get('day') };
}

const MS_PER_DAY = 86400000;
/** Local noon on the given Hijri-era epoch anchor (622-07-16 CE, approximate). */
const HIJRI_EPOCH = new Date(622, 6, 16, 12).getTime();

/**
 * Finds the Gregorian date for a given Hijri (year, month, day) by scanning
 * outward from an astronomical estimate (~29.53059 days/lunar month since the
 * epoch) until `toHijri` confirms an exact match — bounded to a small number
 * of iterations, since the estimate is always within a few days of the true
 * date.
 */
export function fromHijri(year: number, month: number, day: number, locale = 'en'): Date {
  const monthsSinceEpoch = (year - 1) * 12 + (month - 1);
  let candidate = new Date(HIJRI_EPOCH + (monthsSinceEpoch * 29.53059 + (day - 1)) * MS_PER_DAY);

  for (let iteration = 0; iteration < 60; iteration += 1) {
    const parts = toHijri(candidate, locale);
    if (parts.year === year && parts.month === month && parts.day === day) return candidate;
    const monthDiff = (year - parts.year) * 12 + (month - parts.month);
    const dayDiff = monthDiff * 29.53059 + (day - parts.day);
    const step = Math.round(dayDiff);
    candidate = new Date(
      candidate.getTime() + (step === 0 ? Math.sign(dayDiff) || 1 : step) * MS_PER_DAY
    );
  }
  return candidate; // best-effort after the bounded search
}

/** 29 or 30, per the Umm al-Qura calendar's own month-length rules. */
export function hijriMonthLength(year: number, month: number, locale = 'en'): number {
  const first = fromHijri(year, month, 1, locale);
  for (let day = 29; day <= 30; day += 1) {
    const candidate = new Date(first.getTime() + (day - 1) * MS_PER_DAY);
    const parts = toHijri(candidate, locale);
    if (parts.year !== year || parts.month !== month) return day - 1;
  }
  return 30;
}

export function addHijriMonths(date: Date, amount: number, locale = 'en'): Date {
  const { year, month, day } = toHijri(date, locale);
  let targetMonth = month + amount;
  let targetYear = year;
  while (targetMonth > 12) {
    targetMonth -= 12;
    targetYear += 1;
  }
  while (targetMonth < 1) {
    targetMonth += 12;
    targetYear -= 1;
  }
  const length = hijriMonthLength(targetYear, targetMonth, locale);
  return fromHijri(targetYear, targetMonth, Math.min(day, length), locale);
}

export function isSameHijriMonth(a: Date, b: Date, locale = 'en'): boolean {
  const partsA = toHijri(a, locale);
  const partsB = toHijri(b, locale);
  return partsA.year === partsB.year && partsA.month === partsB.month;
}

/**
 * Always returns exactly 42 Gregorian dates (6 weeks) covering `monthDate`'s
 * Hijri month, Sunday-first — matching `dateGrid.ts`'s own
 * `getMonthGrid`/Sunday-first convention exactly (same disclosed
 * simplification: not an independently DGA-verified week-start rule).
 */
export function getHijriMonthGrid(monthDate: Date, locale = 'en'): Date[] {
  const { year, month } = toHijri(monthDate, locale);
  const first = fromHijri(year, month, 1, locale);
  const gridStart = new Date(first.getTime() - first.getDay() * MS_PER_DAY);
  return Array.from(
    { length: 42 },
    (_, index) => new Date(gridStart.getTime() + index * MS_PER_DAY)
  );
}
