import type { Locale } from '@/types';

/**
 * The single place Expert Hub turns a number or a date into display text.
 *
 * Business review 2026-10-01, G-02: every number the application generates is
 * written with Latin digits (0-9), never Arabic-Indic (٠-٩). The Arabic tag is
 * therefore `ar-SA-u-nu-latn` — the `-u-nu-latn` extension changes *only* the
 * numbering system. Arabic month names, field order, separators and the
 * Gregorian calendar are all identical to plain `ar-SA`:
 *
 *   ar-SA            1234567 -> ١٬٢٣٤٬٥٦٧   medium -> ٣٠‏/٠٩‏/٢٠٢٦   long -> ٣٠ سبتمبر ٢٠٢٦
 *   ar-SA-u-nu-latn  1234567 -> 1,234,567   medium -> 30‏/09‏/2026   long -> 30 سبتمبر 2026
 *
 * `en-GB` is already Latin and already Gregorian, and produces byte-identical
 * numbers to the bare `en` tag some call sites used before.
 *
 * Do not call `new Intl.NumberFormat`/`new Intl.DateTimeFormat` anywhere else in
 * the app (the design system's calendar excepted) — `formatting.test.ts` fails
 * the build if you do, because a per-page `'ar-SA'` is exactly how the
 * Arabic-Indic digits got in.
 */
export function localeTag(locale: Locale): 'ar-SA-u-nu-latn' | 'en-GB' {
  return locale === 'ar' ? 'ar-SA-u-nu-latn' : 'en-GB';
}

/**
 * A reusable formatter, for the pages that build one per render and reuse it
 * down a list. The returned object is the native `Intl` one, so existing
 * `.format(…)` call sites keep working unchanged.
 */
export function numberFormatter(locale: Locale, options?: Intl.NumberFormatOptions) {
  return new Intl.NumberFormat(localeTag(locale), options);
}

export function dateFormatter(locale: Locale, options?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat(localeTag(locale), options);
}

export function formatNumber(
  value: number,
  locale: Locale,
  options?: Intl.NumberFormatOptions
): string {
  return numberFormatter(locale, options).format(value);
}

export function formatDate(
  value: Date | number | string,
  locale: Locale,
  options: Intl.DateTimeFormatOptions = { dateStyle: 'medium' }
): string {
  const date = value instanceof Date ? value : new Date(value);
  return dateFormatter(locale, options).format(date);
}

/**
 * Arabic-only shorthand for the `*.content.ts` modules, whose Arabic branch
 * builds sentences inline and has no `locale` in scope.
 */
export function arNumber(value: number, options?: Intl.NumberFormatOptions): string {
  return formatNumber(value, 'ar', options);
}
