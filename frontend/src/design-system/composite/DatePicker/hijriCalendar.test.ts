import { describe, expect, it } from 'vitest';
import {
  addHijriMonths,
  fromHijri,
  getHijriMonthGrid,
  hijriMonthLength,
  isSameHijriMonth,
  toHijri,
} from './hijriCalendar';

describe('hijriCalendar', () => {
  it('converts a known Gregorian date to its Hijri equivalent', () => {
    // 2024-01-01 CE is well-documented as 19 Jumada al-Akhirah 1445 AH.
    const parts = toHijri(new Date(2024, 0, 1));
    expect(parts).toEqual({ year: 1445, month: 6, day: 19 });
  });

  it('round-trips fromHijri(toHijri(date)) back to the same calendar day', () => {
    const samples = [new Date(2024, 0, 1), new Date(2025, 5, 15), new Date(2026, 11, 31)];
    for (const date of samples) {
      const parts = toHijri(date);
      const back = fromHijri(parts.year, parts.month, parts.day);
      expect(toHijri(back)).toEqual(parts);
    }
  });

  it('returns a plausible month length (29 or 30)', () => {
    const parts = toHijri(new Date(2024, 0, 1));
    const length = hijriMonthLength(parts.year, parts.month);
    expect([29, 30]).toContain(length);
  });

  it('adds Hijri months and rolls over the year correctly', () => {
    const date = fromHijri(1445, 12, 1); // last Hijri month of 1445
    const next = addHijriMonths(date, 1);
    const parts = toHijri(next);
    expect(parts.year).toBe(1446);
    expect(parts.month).toBe(1);
  });

  it('confirms isSameHijriMonth agrees with addHijriMonths(0)', () => {
    const date = new Date(2024, 0, 1);
    const same = addHijriMonths(date, 0);
    expect(isSameHijriMonth(date, same)).toBe(true);
  });

  it('produces a 42-cell grid whose 15th-ish cell falls in the target Hijri month', () => {
    const date = new Date(2024, 0, 1);
    const grid = getHijriMonthGrid(date);
    expect(grid).toHaveLength(42);
    const targetParts = toHijri(date);
    const midCell = toHijri(grid[20]);
    expect(midCell.year).toBe(targetParts.year);
    expect(midCell.month).toBe(targetParts.month);
  });

  it('grid always starts on a Sunday (index 0 has getDay() === 0)', () => {
    const grid = getHijriMonthGrid(new Date(2024, 5, 15));
    expect(grid[0].getDay()).toBe(0);
  });
});
