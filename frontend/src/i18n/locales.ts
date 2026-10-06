import type { Locale, LocaleMeta } from '@/types';

/**
 * Locale registry. Arabic is the PRIMARY/default locale; English is secondary
 * (docs DC-10, F15/F16). Direction is derived from the locale here so the whole
 * app has a single source of truth for AR⇄EN ⇒ RTL⇄LTR.
 */
export const DEFAULT_LOCALE: Locale = 'ar';

export const LOCALES: Record<Locale, LocaleMeta> = {
  ar: { code: 'ar', label: 'العربية', dir: 'rtl' },
  en: { code: 'en', label: 'English', dir: 'ltr' },
};

export const SUPPORTED_LOCALES: readonly Locale[] = ['ar', 'en'];

export function isSupportedLocale(value: string): value is Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

export function directionForLocale(locale: Locale) {
  return LOCALES[locale].dir;
}
