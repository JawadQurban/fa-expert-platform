import type { Locale } from '@/types';
import type {
  ApplicationFieldSchema,
  ApplicationFieldValue,
} from '../../applications/applicationForm.types';

/**
 * A stored value rendered for reading: an option's **label**, a multi-select's
 * labels joined, a tick for a checkbox, or the text as typed.
 *
 * ⚠️ A stored option code is never shown. Three education/certification fields
 * became dropdowns over the delivered reference lists on 2026-09-21, so a value
 * printed raw reads as `uni-001` where the trainer wrote «جامعة الملك سعود».
 *
 * Its own module so the components that use it stay component-only exports
 * (the `react-refresh/only-export-components` rule).
 */
export function displayValue(
  field: ApplicationFieldSchema,
  value: ApplicationFieldValue | undefined,
  locale: Locale
): string {
  if (value == null || value === '') {
    return '';
  }
  if (typeof value === 'boolean') {
    return value ? '✓' : '—';
  }
  const label = (code: string): string => {
    const option = field.options?.find((candidate) => candidate.value === code);
    return option == null ? code : locale === 'ar' ? option.labelAr : option.labelEn;
  };
  return typeof value === 'string'
    ? label(value)
    : value.map(label).join(locale === 'ar' ? '، ' : ', ');
}
