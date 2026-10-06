import { Checkbox, NumberInput, Select, TextInput, Textarea, Typography } from '@ds/primitives';
import { DatePicker } from '@ds/composite';
import type { Locale } from '@/types';
import type { ApplicationService } from '../application.types';
import type { ApplicationFieldSchema, ApplicationFieldValue } from '../applicationForm.types';
import {
  fieldHelp,
  fieldLabel,
  isFieldRequired,
  requiringServices,
} from '../applicationValidation';
import type { NewApplicationContent } from '../newApplication.content';
import styles from './DynamicFieldRenderer.module.css';

/** `date` fields store `YYYY-MM-DD`; the DatePicker works in `Date` objects. */
function parseIsoDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (match == null) {
    return null;
  }
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

function toIsoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/**
 * Renders ONE schema-driven field with the approved input for its type.
 * Everything — label, help, required state (`BR-0104` union), options,
 * read-only/ownership behavior — comes from the schema; the renderer holds no
 * business copy. When a field is required by only *some* of the selected
 * services, the helper text explains which (`BR-0104` "why required").
 *
 * Each field is wrapped in a stable `eh-field-{id}` container the error
 * summary targets for focus.
 */
export function DynamicFieldRenderer({
  field,
  domId,
  value,
  error,
  services,
  locale,
  content,
  onChange,
}: {
  readonly field: ApplicationFieldSchema;
  /**
   * The wrapper's DOM id, which the error summary focuses. Defaults to
   * `eh-field-{id}`; a repeatable entry passes `eh-field-{entryId}::{id}` so
   * the same field in two entries stays two targets.
   */
  readonly domId?: string;
  readonly value: ApplicationFieldValue | undefined;
  readonly error: string | undefined;
  readonly services: readonly ApplicationService[];
  readonly locale: Locale;
  readonly content: NewApplicationContent;
  readonly onChange: (fieldId: string, value: ApplicationFieldValue) => void;
}) {
  const required = isFieldRequired(field, services);
  const help = fieldHelp(field, locale);

  // Explain *why* the field is required when it isn't required by every
  // selected service (`BR-0104`).
  const requiredBy = requiringServices(field, services);
  const becauseHint =
    required && requiredBy.length > 0 && requiredBy.length < services.length
      ? content.serviceStep.requiredBecause(
          requiredBy.map((service) => content.services[service]).join(locale === 'ar' ? '، ' : ', ')
        )
      : undefined;
  const helperText = [help, becauseHint].filter(Boolean).join(' — ') || undefined;

  const label = fieldLabel(field, locale);
  const textValue = typeof value === 'string' ? value : '';
  const wrapperId = domId ?? `eh-field-${field.id}`;

  const inner = () => {
    switch (field.type) {
      case 'textarea':
        return (
          <Textarea
            label={label}
            value={textValue}
            onChange={(event) => onChange(field.id, event.target.value)}
            requiredField={required}
            helperText={helperText}
            errorText={error}
            readOnly={field.readOnly}
            maxLength={field.validation?.maxLength}
            showCharacterCount={field.validation?.maxLength != null}
          />
        );
      case 'select':
        return (
          <Select
            label={label}
            options={(field.options ?? []).map((option) => ({
              value: option.value,
              label: locale === 'en' ? option.labelEn : option.labelAr,
            }))}
            value={textValue === '' ? undefined : textValue}
            onValueChange={(next) => onChange(field.id, next)}
            requiredField={required}
            helperText={helperText}
            errorText={error}
            readOnly={field.readOnly}
          />
        );
      case 'checkbox':
        return (
          <Checkbox
            label={label}
            checked={value === true}
            onChange={(event) => onChange(field.id, event.target.checked)}
            description={helperText}
            errorText={error}
            disabled={field.readOnly}
          />
        );
      case 'number':
        return (
          <NumberInput
            label={label}
            value={
              textValue === '' || Number.isNaN(Number(textValue)) ? undefined : Number(textValue)
            }
            onValueChange={(next) => onChange(field.id, next == null ? '' : String(next))}
            min={field.validation?.min}
            max={field.validation?.max}
            requiredField={required}
            helperText={helperText}
            errorText={error}
            readOnly={field.readOnly}
            incrementLabel={content.numberInput.incrementLabel}
            decrementLabel={content.numberInput.decrementLabel}
          />
        );
      case 'date': {
        const parsed = textValue === '' ? null : parseIsoDate(textValue);
        return (
          <DatePicker
            label={label}
            value={parsed}
            onChange={(date) => onChange(field.id, toIsoDate(date))}
            locale={locale}
            requiredField={required}
            helperText={helperText}
            errorText={error}
            disabled={field.readOnly}
            placeholder={content.datePicker.placeholder}
            todayLabel={content.datePicker.todayLabel}
            previousMonthLabel={content.datePicker.previousMonthLabel}
            nextMonthLabel={content.datePicker.nextMonthLabel}
            yearDropdownLabel={content.datePicker.yearDropdownLabel}
          />
        );
      }
      case 'multi-select': {
        // «اختر كل ما ينطبق» — a fieldset of approved Checkboxes, mirroring
        // the ServiceSelection group pattern. The stored value is the array
        // of selected option values.
        const selected: readonly string[] = Array.isArray(value) ? value : [];
        const toggle = (optionValue: string) =>
          onChange(
            field.id,
            selected.includes(optionValue)
              ? selected.filter((candidate) => candidate !== optionValue)
              : [...selected, optionValue]
          );
        const errorId = error != null ? `${wrapperId}-error` : undefined;
        return (
          <fieldset className={styles.group} aria-describedby={errorId}>
            <legend className={styles.legend}>
              {label}
              {required ? ' *' : ''}
            </legend>
            {helperText != null && (
              <Typography as="p" variant="text-sm" color="muted">
                {helperText}
              </Typography>
            )}
            {error != null && (
              <Typography as="p" id={errorId} variant="text-sm" role="alert">
                {error}
              </Typography>
            )}
            <div className={styles.options}>
              {(field.options ?? []).map((option) => (
                <Checkbox
                  key={option.value}
                  label={locale === 'en' ? option.labelEn : option.labelAr}
                  checked={selected.includes(option.value)}
                  onChange={() => toggle(option.value)}
                  disabled={field.readOnly}
                />
              ))}
            </div>
          </fieldset>
        );
      }
      default:
        return (
          <TextInput
            label={label}
            value={textValue}
            onChange={(event) => onChange(field.id, event.target.value)}
            requiredField={required}
            helperText={helperText}
            errorText={error}
            readOnly={field.readOnly}
          />
        );
    }
  };

  return <div id={wrapperId}>{inner()}</div>;
}
