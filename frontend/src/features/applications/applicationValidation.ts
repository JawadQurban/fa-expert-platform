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
  const dependsOn = field.dependsOn;
  if (dependsOn == null) {
    return true;
  }
  const actual = values[dependsOn.fieldId];
  if (dependsOn.equals !== undefined && actual !== dependsOn.equals) {
    return false;
  }
  return dependsOn.notEquals === undefined || actual !== dependsOn.notEquals;
}

/** `BR-0104`: required when required by at least one selected service. */
export function isFieldRequired(
  field: ApplicationFieldSchema,
  services: readonly ApplicationService[]
): boolean {
  return field.requiredFor.some((s) => services.includes(s));
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

export function validateFieldValue(
  field: ApplicationFieldSchema,
  value: ApplicationFieldValue | undefined,
  services: readonly ApplicationService[],
  locale: Locale,
  messages: ValidationMessages
): string | null {
  const required = isFieldRequired(field, services);
  const text = typeof value === 'string' ? value.trim() : '';
  // Emptiness is per-type: a checkbox is "empty" unless ticked, a multi-select
  // unless at least one option is chosen, everything else unless text exists.
  const empty =
    field.type === 'checkbox'
      ? value !== true
      : field.type === 'multi-select'
        ? !Array.isArray(value) || value.length === 0
        : text === '';

  if (required && empty) {
    return messages.required;
  }
  if (empty) {
    return null;
  }
  // Length/pattern constraints apply to textual values only — a multi-select's
  // array carries option values already validated by construction.
  if (field.validation?.maxLength != null && text.length > field.validation.maxLength) {
    return messages.maxLength(field.validation.maxLength);
  }
  if (field.type === 'date' && text !== '') {
    const bound = dateBoundError(field, text, messages);
    if (bound != null) {
      return bound;
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
  if (Number.isNaN(value.getTime())) {
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
            messages
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
        messages
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
