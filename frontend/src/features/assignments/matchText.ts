/**
 * The search comparison the API's `MatchText.cs` uses, so the mock provider
 * answers a name search exactly as the live one does (`BUG-039`).
 *
 * Arabic is typed with optional hamza on alef (أحمد / احمد), an interchangeable
 * final ta-marbuta / ha (فاطمة / فاطمه) and alef-maqsura / ya (مصطفى / مصطفي),
 * optional diacritics and the tatweel stretch. This folds those together. It is
 * for comparison only — nothing displays its output.
 */
export function foldSearchText(value: string | null | undefined): string {
  if (value == null) {
    return '';
  }
  return value
    .normalize('NFD')
    .replace(/[̀-ͯؐ-ًؚ-ٰٟۖ-ۭـ]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/[ىئ]/g, 'ي')
    .replace(/ؤ/g, 'و')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/** True when every word of `query` occurs in one of `texts`. Empty matches all. */
export function matchesSearch(query: string, ...texts: readonly string[]): boolean {
  const words = foldSearchText(query)
    .split(' ')
    .filter((word) => word !== '');
  if (words.length === 0) {
    return true;
  }
  return texts.map(foldSearchText).some((text) => words.every((word) => text.includes(word)));
}
