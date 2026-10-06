import type { Locale } from '@/types';

/**
 * API-authored bilingual text — **distinct from UI copy**, which lives in each
 * feature's `*.content.ts`. Use this for values the Expert Hub API returns in
 * both languages (evaluation criteria labels, committee role titles, AI summary
 * text, attachment type names): they are data, not interface strings, so they
 * are never translated in the frontend.
 *
 * Shared across features (screening, interviews, …) so the convention stays one
 * shape rather than being re-declared per module.
 */
export interface LocalizedText {
  readonly ar: string;
  readonly en: string;
}

/** Reads a `LocalizedText` for the active locale, falling back to Arabic (primary). */
export function localized(text: LocalizedText, locale: Locale): string {
  return text[locale] ?? text.ar;
}
