import { describe, expect, it } from 'vitest';
import { foldSearchText, matchesSearch } from './matchText';

describe('matchText — the name search the API and the mock share (BUG-039)', () => {
  it('folds hamza, ta-marbuta, alef-maqsura, diacritics and tatweel', () => {
    expect(foldSearchText('أحمد')).toBe(foldSearchText('احمد'));
    expect(foldSearchText('إبراهيم')).toBe(foldSearchText('ابراهيم'));
    expect(foldSearchText('فاطمة')).toBe(foldSearchText('فاطمه'));
    expect(foldSearchText('مصطفى')).toBe(foldSearchText('مصطفي'));
    expect(foldSearchText('مُحَمَّد')).toBe(foldSearchText('محمد'));
    expect(foldSearchText('محـــمد')).toBe(foldSearchText('محمد'));
  });

  it('matches every word, in any order, partially, in either language', () => {
    expect(matchesSearch('احمد العتيبي', 'أحمد بن سعد العتيبي')).toBe(true);
    expect(matchesSearch('العتيب', 'أحمد بن سعد العتيبي')).toBe(true);
    expect(matchesSearch('ahmed', 'أحمد العتيبي', 'Ahmed Alotaibi')).toBe(true);
    expect(matchesSearch('خالد', 'أحمد العتيبي', 'Ahmed Alotaibi')).toBe(false);
    expect(matchesSearch('   ', 'أي اسم')).toBe(true);
  });
});
