import type { Locale } from '@/types';
import type {
  ApplicationFieldOption,
  ApplicationFieldSchema,
  ApplicationFieldValue,
} from './applicationForm.types';

/**
 * A multi-select's stored choices, read and written in one place.
 *
 * A choice is either a static option's `value` (`city-1`, `other`), or — for
 * an option fetched at runtime (`optionsSource`) — a SNAPSHOT that carries its
 * own names: `<value>|<labelAr>|<labelEn>`, e.g.
 * `fast:7c1f…|برنامج القيادة المالية|Financial Leadership`. The names are
 * taken when the applicant picks, so the answer stays readable after FAST
 * renames or withdraws the programme (BUG-004, `P-386`).
 *
 * The API reads the same shape (`ApplicationFormLogic.RuntimeChoicePattern`).
 */
export const CHOICE_SEPARATOR = '|';

/**
 * A snapshot's shape — `<source>:<id>|<Arabic name>|<English name>`. Shared
 * verbatim with the API, so both engines accept exactly the same answers.
 */
export const RUNTIME_CHOICE_PATTERN = '^[a-z]+:[A-Za-z0-9-]{1,64}\\|[^|]{1,300}\\|[^|]{1,300}$';

const runtimeChoice = new RegExp(RUNTIME_CHOICE_PATTERN);

/** A name with the separator replaced, so a snapshot always splits in three. */
const clean = (label: string): string => label.split(CHOICE_SEPARATOR).join('/').trim();

/** A multi-select's stored choices, or `null` when the value is not a list. */
export function choiceList(value: ApplicationFieldValue | undefined): readonly string[] | null {
  return Array.isArray(value) ? (value as readonly string[]) : null;
}

/** A runtime option as the answer stores it. */
export function encodeChoice(option: ApplicationFieldOption): string {
  return [option.value, clean(option.labelAr), clean(option.labelEn)].join(CHOICE_SEPARATOR);
}

/** The option a stored choice names, and its snapshot names when it carries them. */
export function decodeChoice(stored: string): {
  readonly value: string;
  readonly labelAr?: string;
  readonly labelEn?: string;
} {
  const [value = stored, labelAr, labelEn] = stored.split(CHOICE_SEPARATOR);
  return labelAr == null ? { value } : { value, labelAr, labelEn: labelEn ?? labelAr };
}

/** The option value a stored choice stands for — what «is it chosen?» compares. */
export function choiceValue(stored: string): string {
  return decodeChoice(stored).value;
}

/** Whether `stored` is a well-formed runtime snapshot. */
export function isRuntimeChoice(stored: string): boolean {
  return runtimeChoice.test(stored);
}

/**
 * A stored choice as a reader sees it: the schema option's label, else the
 * snapshot's own name, else the stored text — never a bare code when a name
 * exists.
 */
export function choiceLabel(field: ApplicationFieldSchema, stored: string, locale: Locale): string {
  const { value, labelAr, labelEn } = decodeChoice(stored);
  const option = field.options?.find((candidate) => candidate.value === value);
  if (option != null) {
    return locale === 'en' ? option.labelEn : option.labelAr;
  }
  if (labelAr != null) {
    return locale === 'en' ? labelEn || labelAr : labelAr;
  }
  return stored;
}
