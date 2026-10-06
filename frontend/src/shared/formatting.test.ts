import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { arNumber, formatDate, formatNumber, localeTag } from './formatting';

/**
 * Business review 2026-10-01, G-02 — every number Expert Hub generates uses
 * Latin digits (0-9), never Arabic-Indic (٠-٩).
 *
 * Two halves: the formatter behaves, and nothing bypasses it. The second half
 * is the one that matters over time — the Arabic-Indic digits got in because
 * 91 files each built their own `new Intl.NumberFormat('ar-SA')`.
 */

const EXPERT_HUB_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const THIS_MODULE = join(EXPERT_HUB_DIR, 'shared', 'formatting.ts');
const DESIGN_SYSTEM_DIR = join(EXPERT_HUB_DIR, 'design-system');

/** U+0660-U+0669 Arabic-Indic, U+06F0-U+06F9 Extended (Persian) Arabic-Indic. */
const ARABIC_INDIC_DIGITS = /[٠-٩۰-۹]/;

describe('localeTag', () => {
  it('pins the Arabic tag to the Latin numbering system', () => {
    expect(localeTag('ar')).toBe('ar-SA-u-nu-latn');
    expect(localeTag('en')).toBe('en-GB');
  });

  it('keeps the Gregorian calendar and the Latin numbering system for Arabic', () => {
    const resolved = new Intl.DateTimeFormat(localeTag('ar')).resolvedOptions();
    expect(resolved.calendar).toBe('gregory');
    expect(resolved.numberingSystem).toBe('latn');
  });
});

describe('formatNumber', () => {
  it('writes Arabic numbers with Latin digits and Latin grouping', () => {
    expect(formatNumber(1234567, 'ar')).toBe('1,234,567');
    expect(formatNumber(1234567, 'en')).toBe('1,234,567');
  });

  it('writes Arabic decimals with a Latin decimal point', () => {
    const options = { minimumFractionDigits: 1, maximumFractionDigits: 1 };
    expect(formatNumber(4.5, 'ar', options)).toBe('4.5');
    expect(formatNumber(4.5, 'en', options)).toBe('4.5');
  });

  it('honours useGrouping, so a year is not written 2,026', () => {
    expect(formatNumber(2026, 'ar', { useGrouping: false })).toBe('2026');
  });

  it('emits no Arabic-Indic digit for any Arabic number', () => {
    for (const value of [0, 1, 7, 42, 100, 999, 1000, 12345, 1234567, 0.5, 99.95]) {
      expect(formatNumber(value, 'ar')).not.toMatch(ARABIC_INDIC_DIGITS);
    }
  });

  it('arNumber is the Arabic branch of formatNumber', () => {
    expect(arNumber(1234)).toBe(formatNumber(1234, 'ar'));
    expect(arNumber(2026, { useGrouping: false })).toBe('2026');
  });
});

describe('formatDate', () => {
  // 2026-09-30T13:45Z — a date whose day, month and year all differ.
  const date = new Date(Date.UTC(2026, 8, 30, 13, 45));

  it('writes Arabic dates with Latin digits and Arabic month names', () => {
    expect(formatDate(date, 'ar', { dateStyle: 'long' })).toBe('30 سبتمبر 2026');
    expect(formatDate(date, 'en', { dateStyle: 'long' })).toBe('30 September 2026');
  });

  it('defaults to the medium date style', () => {
    expect(formatDate(date, 'ar')).toBe(formatDate(date, 'ar', { dateStyle: 'medium' }));
  });

  it('accepts a Date, an epoch number and an ISO string alike', () => {
    const expected = formatDate(date, 'ar', { dateStyle: 'long' });
    expect(formatDate(date.getTime(), 'ar', { dateStyle: 'long' })).toBe(expected);
    expect(formatDate(date.toISOString(), 'ar', { dateStyle: 'long' })).toBe(expected);
  });

  it('emits no Arabic-Indic digit for any Arabic date or time style', () => {
    const styles: Intl.DateTimeFormatOptions[] = [
      { dateStyle: 'medium' },
      { dateStyle: 'long' },
      { dateStyle: 'full', timeStyle: 'short' },
      { dateStyle: 'medium', timeStyle: 'short' },
      { timeStyle: 'short' },
      { day: 'numeric', month: 'long', year: 'numeric' },
    ];
    for (const options of styles) {
      expect(formatDate(date, 'ar', options)).not.toMatch(ARABIC_INDIC_DIGITS);
    }
  });
});

/**
 * Several comments in this tree are prose *about* Arabic-Indic digits — they
 * quote `٣٠‏/٠٩‏/٢٠٢٦` to explain why the rule exists. Only what ships to a
 * screen is in scope, so comments are dropped before the digit scan.
 */
function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
}

function productionSources(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    // The design system is out of scope: its DatePicker renders the Gregorian
    // and Hijri calendars with Intl by design, in either numbering system.
    if (full === DESIGN_SYSTEM_DIR) {
      continue;
    }
    if (statSync(full).isDirectory()) {
      out.push(...productionSources(full));
    } else if (/\.tsx?$/.test(entry) && !/\.(test|stories)\.tsx?$/.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

describe('nothing bypasses the central formatter', () => {
  const sources = productionSources(EXPERT_HUB_DIR).filter((file) => file !== THIS_MODULE);

  it('scans the whole Expert Hub tree', () => {
    expect(sources.length).toBeGreaterThan(100);
  });

  it('constructs Intl formatters only in shared/formatting.ts', () => {
    const offenders = sources
      .filter((file) =>
        /new Intl\.(NumberFormat|DateTimeFormat)\b/.test(readFileSync(file, 'utf8'))
      )
      .map((file) => relative(EXPERT_HUB_DIR, file));

    expect(
      offenders,
      'Import formatNumber/formatDate/arNumber from shared/formatting instead — ' +
        'a per-page Intl formatter is how Arabic-Indic digits got in (G-02).'
    ).toEqual([]);
  });

  it('names no Arabic locale that would resolve to Arabic-Indic digits', () => {
    const offenders = sources
      .filter((file) => /['"`]ar-SA['"`]/.test(stripComments(readFileSync(file, 'utf8'))))
      .map((file) => relative(EXPERT_HUB_DIR, file));

    expect(
      offenders,
      "The bare 'ar-SA' tag resolves to the arab numbering system. Use localeTag('ar') (G-02)."
    ).toEqual([]);
  });

  it('leaves no Arabic-Indic digit literal in a user-facing string', () => {
    const offenders = sources
      .filter((file) => ARABIC_INDIC_DIGITS.test(stripComments(readFileSync(file, 'utf8'))))
      .map((file) => relative(EXPERT_HUB_DIR, file));

    expect(offenders, 'Write application-generated numbers with Latin digits (G-02).').toEqual([]);
  });
});
