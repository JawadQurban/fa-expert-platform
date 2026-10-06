import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { Locale } from '@/types';
import { useDirection } from '@ds/providers';
import './config';
import {
  DEFAULT_LOCALE,
  LOCALES,
  SUPPORTED_LOCALES,
  directionForLocale,
  isSupportedLocale,
} from './locales';

/**
 * LocaleProvider — owns the active locale and keeps the document in sync.
 *
 * On locale change it: updates i18next, sets `<html lang>`, and drives
 * direction via the DirectionProvider so AR⇄EN atomically flips RTL⇄LTR with
 * no content loss (docs F16 / INTERACTION §6). Must be mounted INSIDE a
 * <DirectionProvider>.
 */

interface LocaleContextValue {
  readonly locale: Locale;
  readonly setLocale: (locale: Locale) => void;
  readonly toggleLocale: () => void;
  readonly availableLocales: typeof LOCALES;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

interface LocaleProviderProps {
  readonly children: ReactNode;
  readonly defaultLocale?: Locale;
}

export function LocaleProvider({ children, defaultLocale }: LocaleProviderProps) {
  const { i18n } = useTranslation();
  const { setDirection } = useDirection();

  const initial: Locale =
    defaultLocale ?? (isSupportedLocale(i18n.language) ? i18n.language : DEFAULT_LOCALE);
  const [locale, setLocaleState] = useState<Locale>(initial);

  const setLocale = useCallback(
    (next: Locale) => {
      setLocaleState(next);
      void i18n.changeLanguage(next);
      setDirection(directionForLocale(next));
      if (typeof document !== 'undefined') {
        document.documentElement.lang = next;
      }
    },
    [i18n, setDirection]
  );

  // Apply the initial locale to the document once on mount.
  useEffect(() => {
    setLocale(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleLocale = useCallback(() => {
    setLocale(locale === 'ar' ? 'en' : 'ar');
  }, [locale, setLocale]);

  const value = useMemo<LocaleContextValue>(
    () => ({ locale, setLocale, toggleLocale, availableLocales: LOCALES }),
    [locale, setLocale, toggleLocale]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error('useLocale must be used within a <LocaleProvider>.');
  }
  return ctx;
}

export { LocaleContext, SUPPORTED_LOCALES };
export type { LocaleContextValue };
