import type { Locale } from '@/types';
import type { ApplicationService } from './application.types';
import type {
  ApplicationAttachmentRule,
  ApplicationDraftDto,
  ApplicationEntryDto,
  ApplicationFieldSchema,
  ApplicationFieldValue,
  ApplicationFormSchemaDto,
  ApplicationSectionSchema,
  DraftAttachmentDto,
} from './applicationForm.types';
import { choiceLabel, choiceList, choiceValue, isRuntimeChoice } from './fieldChoices';

/**
 * Pure validation + schema-reading engine for the EH-TP-05 dynamic form.
 * Implements the BRD rules the page must honor:
 *
 * - `BR-0104` — a field/attachment is **required when ≥1 selected service
 *   requires it** (union, one unified form — never duplicated per service).
 * - `BR-0105` — submission is blocked until every required field and
 *   attachment is complete (used by the step gates, the review step, and the
 *   mock server on submit).
 * - `BR-0106` — attachment format/size/count validated immediately.
 *
 * Everything is pure and schema-driven (`BR-0103`) so the same logic serves the
 * approved `G5` field map unchanged. Localized message *copy* is injected from
 * the page content — no strings live here.
 */

export interface ValidationMessages {
  readonly required: string;
  readonly maxLength: (max: number) => string;
  readonly invalidValue: string;
  readonly dateNotFuture: string;
  readonly dateNotPast: string;
  /** An end date before its start. Optional: a caller without it gets `invalidValue`. */
  readonly dateBeforeStart?: string;
  readonly fileFormat: (formats: string) => string;
  readonly fileSize: (maxMb: number) => string;
  readonly fileCount: (max: number) => string;
}

/* ── schema text helpers (AR authoritative / EN toggle) ─────────────────── */

export function fieldLabel(field: ApplicationFieldSchema, locale: Locale): string {
  return locale === 'en' ? field.labelEn : field.labelAr;
}

export function fieldHelp(field: ApplicationFieldSchema, locale: Locale): string | undefined {
  return locale === 'en' ? field.helpEn : field.helpAr;
}

export function sectionTitle(section: ApplicationSectionSchema, locale: Locale): string {
  return locale === 'en' ? section.titleEn : section.titleAr;
}

export function ruleLabel(rule: ApplicationAttachmentRule, locale: Locale): string {
  return locale === 'en' ? rule.labelEn : rule.labelAr;
}

/** One entry's heading — «المؤهل 1» / «Qualification 1». */
export function entryTitle(
  section: ApplicationSectionSchema,
  locale: Locale,
  index: number
): string {
  const repeat = section.repeatable;
  const noun =
    repeat == null
      ? sectionTitle(section, locale)
      : locale === 'en'
        ? repeat.entryLabelEn
        : repeat.entryLabelAr;
  return `${noun} ${index + 1}`;
}

/** The add control's own label — «+ إضافة مؤهل» / «+ Add qualification». */
export function addEntryLabel(section: ApplicationSectionSchema, locale: Locale): string {
  const repeat = section.repeatable;
  if (repeat == null) {
    return '';
  }
  return locale === 'en' ? repeat.addLabelEn : repeat.addLabelAr;
}

/* ── visibility + requiredness (`BR-0104`) ──────────────────────────────── */

export function isFieldVisible(
  field: ApplicationFieldSchema,
  services: readonly ApplicationService[],
  values: Readonly<Record<string, ApplicationFieldValue>>
): boolean {
  if (field.visibleFor != null && !field.visibleFor.some((s) => services.includes(s))) {
    return false;
  }
  return conditionHolds(field.dependsOn, values);
}

function conditionHolds(
  condition: ApplicationFieldSchema['dependsOn'],
  values: Readonly<Record<string, ApplicationFieldValue>>
): boolean {
  if (condition == null) {
    return true;
  }
  const actual = values[condition.fieldId];
  if (condition.equals !== undefined && !conditionMatches(actual, condition.equals)) {
    return false;
  }
  return condition.notEquals === undefined || !conditionMatches(actual, condition.notEquals);
}

/**
 * One value against a condition's operand. A multi-select «equals» an option
 * when it INCLUDES it — «أخرى» among the chosen programmes (BUG-004) — which
 * the API's `ApplicationFormLogic.Holds` reads the same way.
 */
function conditionMatches(actual: ApplicationFieldValue | undefined, expected: string | boolean) {
  const list = choiceList(actual);
  if (list != null) {
    return typeof expected === 'string' && list.some((item) => choiceValue(item) === expected);
  }
  return actual === expected;
}

/**
 * `BR-0104`: required when required by at least one selected service — and,
 * for a field with `requiredWhen`, only while that condition holds on `values`.
 */
export function isFieldRequired(
  field: ApplicationFieldSchema,
  services: readonly ApplicationService[],
  values: Readonly<Record<string, ApplicationFieldValue>> = {}
): boolean {
  return (
    field.requiredFor.some((s) => services.includes(s)) &&
    conditionHolds(field.requiredWhen, values)
  );
}

/** The selected services that make this field required (the "why required" hint). */
export function requiringServices(
  field: ApplicationFieldSchema,
  services: readonly ApplicationService[]
): readonly ApplicationService[] {
  return field.requiredFor.filter((s) => services.includes(s));
}

/** Visible fields of one section, in display order. */
export function visibleSectionFields(
  schema: ApplicationFormSchemaDto,
  sectionId: string,
  services: readonly ApplicationService[],
  values: Readonly<Record<string, ApplicationFieldValue>>
): readonly ApplicationFieldSchema[] {
  return schema.fields
    .filter((field) => field.sectionId === sectionId && isFieldVisible(field, services, values))
    .slice()
    .sort((a, b) => a.order - b.order);
}

/* ── «أخرى» named in words (BUG-006) ────────────────────────────────────── */

/**
 * Whether `field` is the text box that names a select's «أخرى» — a `text`
 * field shown only while another field's select holds one of its options
 * («التخصص (أخرى)», «اسم الشهادة (أخرى)», «المجال (أخرى)»). Read views fold
 * it into its select, so the answer reads as what the applicant wrote.
 */
export function isOtherTextField(
  schema: ApplicationFormSchemaDto,
  field: ApplicationFieldSchema
): boolean {
  const condition = field.dependsOn;
  if (field.type !== 'text' || condition == null || typeof condition.equals !== 'string') {
    return false;
  }
  const parent = schema.fields.find((candidate) => candidate.id === condition.fieldId);
  return (
    (parent?.type === 'select' || parent?.type === 'multi-select') &&
    (parent.options ?? []).some((option) => option.value === condition.equals)
  );
}

/**
 * What the applicant wrote for a select answered «أخرى», or `null` — the
 * value read views show **instead of** the word «أخرى» (BUG-006: «what is
 * shown must be the typed text»).
 */
export function otherAnswerText(
  schema: ApplicationFormSchemaDto,
  field: ApplicationFieldSchema,
  values: Readonly<Record<string, ApplicationFieldValue>>,
  locale: Locale = 'ar'
): string | null {
  const chosen = values[field.id];
  const typedFor = (option: string): string | null => {
    const naming = schema.fields.find(
      (candidate) =>
        candidate.dependsOn?.fieldId === field.id &&
        candidate.dependsOn.equals === option &&
        isOtherTextField(schema, candidate)
    );
    const typed = naming == null ? undefined : values[naming.id];
    return typeof typed === 'string' && typed.trim() !== '' ? typed.trim() : null;
  };
  if (field.type === 'select' && typeof chosen === 'string') {
    return typedFor(chosen);
  }
  const list = choiceList(chosen);
  if (field.type === 'multi-select' && list != null) {
    // BUG-004 — «أخرى» among the chosen programmes reads as what was written,
    // in its place in the list; with nothing named, the list reads as stored.
    if (!list.some((item) => typedFor(choiceValue(item)) != null)) {
      return null;
    }
    return list
      .map((item) => typedFor(choiceValue(item)) ?? choiceLabel(field, item, locale))
      .join(locale === 'ar' ? '، ' : ', ');
  }
  return null;
}

export function orderedSections(
  schema: ApplicationFormSchemaDto
): readonly ApplicationSectionSchema[] {
  return schema.sections.slice().sort((a, b) => a.order - b.order);
}

function ruleApplies(
  rule: ApplicationAttachmentRule,
  services: readonly ApplicationService[]
): boolean {
  return rule.requiredFor.length === 0 || rule.requiredFor.some((s) => services.includes(s));
}

/**
 * Application-level attachment rules relevant to the selection (required-for ∅
 * = optional, always shown). **`perEntryOf` rules are excluded**: they belong
 * to one entry of a repeatable section and render there, not on the
 * attachments step — see `entryAttachmentRules`.
 */
export function visibleAttachmentRules(
  schema: ApplicationFormSchemaDto,
  services: readonly ApplicationService[]
): readonly ApplicationAttachmentRule[] {
  return schema.attachments.filter(
    (rule) => rule.perEntryOf == null && ruleApplies(rule, services)
  );
}

/** The attachment rules that belong to **one entry** of a repeatable section. */
export function entryAttachmentRules(
  schema: ApplicationFormSchemaDto,
  sectionId: string,
  services: readonly ApplicationService[]
): readonly ApplicationAttachmentRule[] {
  return schema.attachments.filter(
    (rule) => rule.perEntryOf === sectionId && ruleApplies(rule, services)
  );
}

export function isRuleRequired(
  rule: ApplicationAttachmentRule,
  services: readonly ApplicationService[]
): boolean {
  return rule.requiredFor.some((s) => services.includes(s));
}

/* ── repeatable entries (`dm-gap-01.2026-09-21`) ────────────────────────── */

/**
 * The separator joining an entry id to a field id (or an attachment rule id)
 * in every key the form produces — error maps, DOM ids, completeness results.
 * Two colons, because no entry id, field id or rule id contains one.
 */
export const ENTRY_KEY_SEPARATOR = '::';

export function entryFieldKey(entryId: string, fieldId: string): string {
  return `${entryId}${ENTRY_KEY_SEPARATOR}${fieldId}`;
}

/** `entryId::fieldId` → its parts; a plain key returns `entryId: null`. */
export function splitEntryKey(key: string): { entryId: string | null; fieldId: string } {
  const at = key.indexOf(ENTRY_KEY_SEPARATOR);
  return at < 0
    ? { entryId: null, fieldId: key }
    : { entryId: key.slice(0, at), fieldId: key.slice(at + ENTRY_KEY_SEPARATOR.length) };
}

/** A per-entry attachment's completeness key: `ruleId::entryId`. */
export function entryAttachmentKey(ruleId: string, entryId: string): string {
  return `${ruleId}${ENTRY_KEY_SEPARATOR}${entryId}`;
}

/**
 * **The historical-data adapter.** Returns every repeatable section's entries,
 * whatever shape the draft/application arrived in:
 *
 * - `entries[sectionId]` present (including an explicitly empty array) → used
 *   as-is. An emptied section stays empty; it is an answer, not a gap.
 * - absent → **exactly one entry built from the flat `values`**, which is how
 *   every draft and application saved before `dm-gap-01.2026-09-21` stored
 *   these sections. Nothing is lost and nothing is rewritten: the flat values
 *   stay where they are, and this only reads them.
 * - a section whose flat values are all empty yields no entry at all…
 * - …then the list is padded with blank entries up to `minEntries`, so
 *   «at least one qualification» holds even for an empty draft.
 */
export function normalizeEntries(
  schema: ApplicationFormSchemaDto,
  draft: Pick<ApplicationDraftDto, 'values' | 'entries'>
): Record<string, readonly ApplicationEntryDto[]> {
  const normalized: Record<string, readonly ApplicationEntryDto[]> = {};
  for (const section of schema.sections) {
    const repeat = section.repeatable;
    if (repeat == null) {
      continue;
    }
    const supplied = draft.entries?.[section.id];
    const entries: ApplicationEntryDto[] =
      supplied != null
        ? supplied.map((entry) => ({ entryId: entry.entryId, values: { ...entry.values } }))
        : legacyEntries(schema, section.id, draft.values);
    while (entries.length < repeat.minEntries) {
      entries.push({ entryId: `${section.id}-${entries.length + 1}`, values: {} });
    }
    normalized[section.id] = entries;
  }
  return normalized;
}

function legacyEntries(
  schema: ApplicationFormSchemaDto,
  sectionId: string,
  values: Readonly<Record<string, ApplicationFieldValue>>
): ApplicationEntryDto[] {
  const entryValues: Record<string, ApplicationFieldValue> = {};
  for (const field of schema.fields) {
    const value = values[field.id];
    if (field.sectionId === sectionId && value !== undefined) {
      entryValues[field.id] = value;
    }
  }
  const filled = Object.values(entryValues).some(
    (value) => value !== '' && value !== false && !(Array.isArray(value) && value.length === 0)
  );
  return filled ? [{ entryId: `${sectionId}-1`, values: entryValues }] : [];
}

/**
 * The files stored for one rule on one entry.
 *
 * ⚠️ A row with **no** `entryId` is a pre-`dm-gap-01.2026-09-21` attachment,
 * uploaded when the rule was application-level. It belongs to the first entry
 * — the same entry the flat values became — so a historical application still
 * reads as complete.
 */
export function entryAttachments(
  attachments: readonly DraftAttachmentDto[],
  ruleId: string,
  entryId: string,
  entryIndex: number
): readonly DraftAttachmentDto[] {
  return attachments.filter(
    (attachment) =>
      attachment.ruleId === ruleId &&
      (attachment.entryId === entryId || (attachment.entryId == null && entryIndex === 0))
  );
}

/**
 * Which entry a **stored** attachment belongs to — `undefined` for an
 * application-level file. A per-entry rule's row with no `entryId` is
 * historical and belongs to the first entry, matching `entryAttachments`, so
 * reopening an old draft shows the file where the applicant left it.
 */
export function attachmentEntryId(
  schema: ApplicationFormSchemaDto,
  attachment: DraftAttachmentDto,
  entries: Readonly<Record<string, readonly ApplicationEntryDto[]>>
): string | undefined {
  if (attachment.entryId != null) {
    return attachment.entryId;
  }
  const rule = schema.attachments.find((candidate) => candidate.id === attachment.ruleId);
  return rule?.perEntryOf == null ? undefined : entries[rule.perEntryOf]?.[0]?.entryId;
}

/* ── field-level validation ─────────────────────────────────────────────── */

/**
 * Emptiness is per-type: a checkbox is "empty" unless ticked, a multi-select
 * unless at least one option is chosen, everything else unless text exists.
 */
function isEmptyValue(field: ApplicationFieldSchema, value: ApplicationFieldValue | undefined) {
  if (field.type === 'checkbox') {
    return value !== true;
  }
  if (field.type === 'multi-select') {
    return !Array.isArray(value) || value.length === 0;
  }
  return typeof value !== 'string' || value.trim() === '';
}

/**
 * Whether a field's value is final the moment it changes — a pick from a
 * list, a date, a tick — and so is judged on change. Typed text is judged
 * when the applicant leaves the field, never mid-word.
 */
export function judgedOnChange(field: ApplicationFieldSchema): boolean {
  return field.type !== 'text' && field.type !== 'textarea' && field.type !== 'number';
}

/**
 * **J-01/F1 AC-6 at the field** (UAT BUG-014/BUG-015): «when the applicant
 * enters invalid data, then the field is flagged». The step gate (AC-3) only
 * ran on «التالي», so an end date before its start, a link without a host or
 * a name in digits sat unflagged until then — which is how the testers read
 * «no validation».
 *
 * Returns the fields to re-judge after `fieldId` changed in `values` — the
 * field itself and every field whose `notBefore` names it, so moving a start
 * date past its end flags the end date at once — each mapped to its message,
 * or `null` to clear it. An EMPTY field maps to `null`: completeness stays
 * the step gate's (AC-3), and a field is never shouted at before it is
 * filled. A field the values hide maps to `null` too.
 */
export function liveFieldErrors(
  schema: ApplicationFormSchemaDto,
  fieldId: string,
  values: Readonly<Record<string, ApplicationFieldValue>>,
  services: readonly ApplicationService[],
  locale: Locale,
  messages: ValidationMessages
): Readonly<Record<string, string | null>> {
  const judged: Record<string, string | null> = {};
  for (const field of schema.fields) {
    if (field.id !== fieldId && field.validation?.notBefore !== fieldId) {
      continue;
    }
    const value = values[field.id];
    judged[field.id] =
      !isFieldVisible(field, services, values) || isEmptyValue(field, value)
        ? null
        : validateFieldValue(field, value, services, locale, messages, values);
  }
  return judged;
}

export function validateFieldValue(
  field: ApplicationFieldSchema,
  value: ApplicationFieldValue | undefined,
  services: readonly ApplicationService[],
  locale: Locale,
  messages: ValidationMessages,
  /** The values the field sits among (its entry's, or the flat form's) — for `notBefore` and `requiredWhen`. */
  siblings: Readonly<Record<string, ApplicationFieldValue>> = {}
): string | null {
  const required = isFieldRequired(field, services, siblings);
  const text = typeof value === 'string' ? value.trim() : '';
  const empty = isEmptyValue(field, value);

  if (required && empty) {
    return messages.required;
  }
  if (empty) {
    return null;
  }
  // A multi-select holds only its own options — or, for a list fetched at
  // runtime, a well-formed snapshot of one (BUG-004/BUG-005; the API's
  // `ShapeIsValid` judges the same way).
  if (field.type === 'multi-select' && Array.isArray(value)) {
    const known = new Set((field.options ?? []).map((option) => option.value));
    const allowed = (item: string) =>
      known.has(item) || (field.optionsSource != null && isRuntimeChoice(item));
    if (known.size > 0 && !value.every(allowed)) {
      return messages.invalidValue;
    }
    return null;
  }
  // Length/pattern constraints apply to textual values only.
  if (field.validation?.maxLength != null && text.length > field.validation.maxLength) {
    return messages.maxLength(field.validation.maxLength);
  }
  if (field.type === 'date' && text !== '') {
    const bound = dateBoundError(field, text, messages);
    if (bound != null) {
      return bound;
    }
    // ISO dates compare as strings; a sibling that is empty or malformed is
    // that field's own error, not this one's.
    const startId = field.validation?.notBefore;
    const start = startId == null ? undefined : siblings[startId];
    if (typeof start === 'string' && ISO_DATE.test(start) && text < start) {
      return messages.dateBeforeStart ?? messages.invalidValue;
    }
  }
  const patternMessage =
    (locale === 'en' ? field.validation?.patternMessageEn : field.validation?.patternMessageAr) ??
    messages.invalidValue;
  if (
    field.validation?.pattern != null &&
    text !== '' &&
    !new RegExp(field.validation.pattern).test(text)
  ) {
    return patternMessage;
  }
  // Whole-number bounds — the same rule the API applies to `min`/`max`.
  const { min, max } = field.validation ?? {};
  if ((min != null || max != null) && text !== '') {
    const number = Number(text);
    if (
      !Number.isInteger(number) ||
      (min != null && number < min) ||
      (max != null && number > max)
    ) {
      return patternMessage;
    }
  }
  return null;
}

/**
 * A date field's bounds. `'today'` is resolved when the check runs, never when
 * the schema is written.
 */
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function dateBoundError(
  field: ApplicationFieldSchema,
  text: string,
  messages: ValidationMessages
): string | null {
  // A bare `YYYY-MM-DD` parses as UTC midnight, but «today» is local midnight —
  // east of UTC that made today's own date read as the future. Compare both
  // as local dates.
  const localDate = (date: string) =>
    new Date(/^\d{4}-\d{2}-\d{2}$/.test(date) ? `${date}T00:00:00` : date);
  const value = localDate(text);
  if (!ISO_DATE.test(text) || Number.isNaN(value.getTime())) {
    return messages.invalidValue;
  }
  const resolve = (bound: string) =>
    bound === 'today' ? new Date(new Date().toDateString()) : localDate(bound);

  const max = field.validation?.maxDate;
  if (max != null && value > resolve(max)) {
    return messages.dateNotFuture;
  }
  const min = field.validation?.minDate;
  if (min != null && value < resolve(min)) {
    return messages.dateNotPast;
  }
  return null;
}

/* ── attachment validation (`BR-0106`) ──────────────────────────────────── */

export function validateAttachmentFile(
  rule: ApplicationAttachmentRule,
  file: { readonly name: string; readonly size: number },
  existingCount: number,
  messages: ValidationMessages
): string | null {
  if (existingCount >= rule.maxCount) {
    return messages.fileCount(rule.maxCount);
  }
  const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
  if (!rule.acceptedFormats.includes(extension)) {
    return messages.fileFormat(rule.acceptedFormats.join(', '));
  }
  if (file.size > rule.maxSizeMb * 1024 * 1024) {
    return messages.fileSize(rule.maxSizeMb);
  }
  return null;
}

/* ── completeness (`BR-0105`) ───────────────────────────────────────────── */

export interface CompletenessResult {
  /**
   * fieldId → localized message, in schema display order. A field inside a
   * repeatable section is keyed `entryId::fieldId` (`splitEntryKey`).
   */
  readonly fieldErrors: Readonly<Record<string, string>>;
  /** Rule ids, and `ruleId::entryId` for a missing per-entry file. */
  readonly missingAttachmentRuleIds: readonly string[];
  readonly valid: boolean;
}

export function validateCompleteness(
  schema: ApplicationFormSchemaDto,
  draft: Pick<ApplicationDraftDto, 'services' | 'values' | 'attachments' | 'entries'>,
  locale: Locale,
  messages: ValidationMessages
): CompletenessResult {
  const fieldErrors: Record<string, string> = {};
  const entries = normalizeEntries(schema, draft);
  const missingAttachmentRuleIds: string[] = [];

  for (const section of orderedSections(schema)) {
    // A repeatable section is validated entry by entry: each entry carries its
    // own values, so a `dependsOn` inside one resolves within that entry.
    if (section.repeatable != null) {
      for (const [index, entry] of (entries[section.id] ?? []).entries()) {
        for (const field of visibleSectionFields(
          schema,
          section.id,
          draft.services,
          entry.values
        )) {
          const message = validateFieldValue(
            field,
            entry.values[field.id],
            draft.services,
            locale,
            messages,
            entry.values
          );
          if (message != null) {
            fieldErrors[entryFieldKey(entry.entryId, field.id)] = message;
          }
        }
        for (const rule of entryAttachmentRules(schema, section.id, draft.services)) {
          if (
            isRuleRequired(rule, draft.services) &&
            entryAttachments(draft.attachments, rule.id, entry.entryId, index).length === 0
          ) {
            missingAttachmentRuleIds.push(entryAttachmentKey(rule.id, entry.entryId));
          }
        }
      }
      continue;
    }
    for (const field of visibleSectionFields(schema, section.id, draft.services, draft.values)) {
      const message = validateFieldValue(
        field,
        draft.values[field.id],
        draft.services,
        locale,
        messages,
        draft.values
      );
      if (message != null) {
        fieldErrors[field.id] = message;
      }
    }
  }

  missingAttachmentRuleIds.unshift(
    ...visibleAttachmentRules(schema, draft.services)
      .filter(
        (rule) =>
          isRuleRequired(rule, draft.services) &&
          !draft.attachments.some((attachment) => attachment.ruleId === rule.id)
      )
      .map((rule) => rule.id)
  );

  return {
    fieldErrors,
    missingAttachmentRuleIds,
    valid: Object.keys(fieldErrors).length === 0 && missingAttachmentRuleIds.length === 0,
  };
}
