import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from './locales';
import arCommon from './resources/ar/common.json';
import enCommon from './resources/en/common.json';

/**
 * i18next initialization. Arabic-first (fallback + default = 'ar').
 * All UI copy lives in namespaced resource files — no hard-coded strings in
 * components (docs DC-24 / CONTENT_MODEL §3).
 *
 * Resources are bundled here for the foundation; a product may lazy-load
 * additional namespaces/locales later (PERFORMANCE_STRATEGY §6).
 */
export const defaultNS = 'common';

export const resources = {
  ar: { common: arCommon },
  en: { common: enCommon },
} as const;

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    defaultNS,
    ns: ['common'],
    fallbackLng: DEFAULT_LOCALE,
    supportedLngs: [...SUPPORTED_LOCALES],
    load: 'languageOnly',
    interpolation: { escapeValue: false }, // React already escapes
    detection: {
      order: ['localStorage', 'htmlTag', 'navigator'],
      lookupLocalStorage: 'fads.locale',
      caches: ['localStorage'],
    },
    returnNull: false,
  });

export default i18n;
