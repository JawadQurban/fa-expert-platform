import type { ApplicationService } from './application.types';

/**
 * EH-TP-05 (New Application) contracts — the **versioned, configurable
 * form-schema model** (`BR-0103`: field requirements are centrally
 * configurable per service) plus draft / attachment / submit DTOs.
 *
 * `G5` / `DM-GAP-01` — the owner supplied the application field matrix on
 * 2026-08-30 (`trainer-application-form.xlsx`), and
 * `applicationSchema.ts` now carries it. The architecture is unchanged: the
 * schema is still a served payload, and rows the matrix itself marks as
 * needing confirmation stay flagged there rather than resolved here.
 */

/**
 * `date` renders the approved DS DatePicker (value: `YYYY-MM-DD`);
 * `multi-select` renders a fieldset of approved Checkboxes (value: the
 * selected option values) — both introduced by the supplied `DM-GAP-01`
 * matrix, which uses Date and Multi-select (Checkbox) field types. `number`
 * renders the DS NumberInput; its value is stored as the digits typed (a
 * string), bounded by `validation.min`/`max`.
 */
export type ApplicationFieldType =
  'text' | 'textarea' | 'select' | 'checkbox' | 'date' | 'multi-select' | 'number';

/** Who owns a field's value (`02C` ownership model). Pre-accreditation the
 *  application data is Expert-Hub-owned; SSO-sourced identity fields are
 *  read-only here (`BR-0102` reuses the applicant's basic profile). */
export type FieldOwnership = 'expert-hub' | 'sso-profile';

export interface ApplicationFieldOption {
  readonly value: string;
  readonly labelAr: string;
  readonly labelEn: string;
}

export interface ApplicationFieldSchema {
  readonly id: string;
  readonly type: ApplicationFieldType;
  /** Section this field renders under. */
  readonly sectionId: string;
  readonly labelAr: string;
  readonly labelEn: string;
  readonly helpAr?: string;
  readonly helpEn?: string;
  /** `BR-0104`: required when required by ≥1 selected service. */
  readonly requiredFor: readonly ApplicationService[];
  /** Renders only when ≥1 of these services is selected. Omitted = always. */
  readonly visibleFor?: readonly ApplicationService[];
  /**
   * Conditional dependency on another field's value: renders only when it
   * `equals`, and never when it `notEquals` (an unset value is not equal, so
   * `notEquals: true` shows the field until a checkbox is ticked).
   */
  readonly dependsOn?: {
    readonly fieldId: string;
    readonly equals?: string | boolean;
    readonly notEquals?: string | boolean;
  };
  readonly validation?: {
    readonly maxLength?: number;
    readonly pattern?: string;
    readonly patternMessageAr?: string;
    readonly patternMessageEn?: string;
    /**
     * `date` fields only. `'today'` rather than a fixed date, because a date
     * of birth ceiling that was correct when the schema was written is wrong
     * tomorrow — QA accepted 30 September 2026 as a birth date (`D-02`).
     */
    readonly maxDate?: string;
    readonly minDate?: string;
    /** `number` fields only — inclusive whole-number bounds. */
    readonly min?: number;
    readonly max?: number;
  };
  readonly options?: readonly ApplicationFieldOption[];
  readonly ownership: FieldOwnership;
  readonly readOnly?: boolean;
  readonly order: number;
}

/**
 * A section that repeats: the applicant adds as many entries as they have
 * (`dm-gap-01.2026-09-21`, PM-confirmed 2026-09-18 — «قد يكون المتقدم لديه عدة
 * شهادات»). Every field of the section belongs to an entry; the section's
 * non-repeatable siblings keep the flat one-value-per-field model.
 *
 * There is deliberately **no maximum**: none is approved.
 */
export interface ApplicationSectionRepeat {
  /** Fewest entries the section may hold — the UI seeds and never drops below it. */
  readonly minEntries: number;
  /** The add control's label, e.g. «+ إضافة مؤهل». */
  readonly addLabelAr: string;
  readonly addLabelEn: string;
  /** One entry's noun — numbered in the UI, e.g. «المؤهل 1». */
  readonly entryLabelAr: string;
  readonly entryLabelEn: string;
}

export interface ApplicationSectionSchema {
  readonly id: string;
  readonly titleAr: string;
  readonly titleEn: string;
  readonly order: number;
  /** Present = the section is a repeatable group. Omitted = one flat entry. */
  readonly repeatable?: ApplicationSectionRepeat;
}

/** Attachment rule (`BR-0106`: format/size validated immediately on upload). */
export interface ApplicationAttachmentRule {
  readonly id: string;
  readonly labelAr: string;
  readonly labelEn: string;
  /** Lower-case extensions, e.g. `['pdf', 'docx']`. */
  readonly acceptedFormats: readonly string[];
  readonly maxSizeMb: number;
  readonly maxCount: number;
  /** Required when required by ≥1 selected service (`BR-0104` applied to files). */
  readonly requiredFor: readonly ApplicationService[];
  /**
   * The id of a **repeatable** section whose every entry carries one of these
   * files (each qualification has its own certificate). Such a rule is not
   * shown on the attachments step at all — it renders inside the entry, and
   * `maxCount`/`requiredFor` are read per entry, not per application.
   */
  readonly perEntryOf?: string;
}

export interface ApplicationFormSchemaDto {
  /** Schema payload version — bumps when the (future, `G5`) approved map changes. */
  readonly version: string;
  /** The selectable service catalogue: the **4 contractual services only** —
   *  Speaker is an internal-only simplified record and is never self-service
   *  selectable here (`BR-0113`, `04` EH-TP-05 §5). */
  readonly selectableServices: readonly ApplicationService[];
  readonly sections: readonly ApplicationSectionSchema[];
  readonly fields: readonly ApplicationFieldSchema[];
  readonly attachments: readonly ApplicationAttachmentRule[];
}

/** A stored attachment reference on the draft. */
export interface DraftAttachmentDto {
  readonly id: string;
  readonly ruleId: string;
  readonly fileName: string;
  readonly sizeBytes: number;
  /**
   * The repeatable entry this file belongs to, for a `perEntryOf` rule.
   * `null`/absent = an application-level attachment (and every historical row,
   * which must keep reading as one).
   */
  readonly entryId?: string | null;
}

/** `string[]` carries a multi-select's chosen option values. */
export type ApplicationFieldValue = string | boolean | readonly string[];

/**
 * One entry of a repeatable section.
 *
 * `entryId` is the wire identity the API's value rows carry (each row is
 * `{ entryId: string | null, entryIndex: number, fieldId, value }`); order on
 * the wire is the array's own order, which is `entryIndex`.
 */
export interface ApplicationEntryDto {
  readonly entryId: string;
  readonly values: Readonly<Record<string, ApplicationFieldValue>>;
}

/** The working application draft (`BR-0107`: **no reference number** on drafts). */
export interface ApplicationDraftDto {
  readonly id: string;
  /** The form version this draft was started on — it keeps it (`BR-0103`). */
  readonly schemaVersion: string;
  readonly services: readonly ApplicationService[];
  /** Non-repeatable sections: one value per field id (`entryId: null` rows). */
  readonly values: Readonly<Record<string, ApplicationFieldValue>>;
  /**
   * Repeatable sections, keyed by section id. **Optional on purpose**: a draft
   * or application saved before `dm-gap-01.2026-09-21` has none, and must
   * render as exactly one entry per repeatable section built from `values` —
   * see `normalizeEntries`. Historical data is never rewritten.
   */
  readonly entries?: Readonly<Record<string, readonly ApplicationEntryDto[]>>;
  readonly attachments: readonly DraftAttachmentDto[];
  readonly updatedAt: string;
}

/**
 * Why a new application cannot be started. J-01 blocks for **two different
 * reasons that need different exits**, so they are distinct values rather than
 * one boolean:
 *
 * - `open-application` — an un-decided application already exists (`BR-0101`,
 *   J-01/F3/AC-3). The applicant should go **track that application**.
 * - `approved-trainer` — the matched account already holds an active, approved
 *   Trainer role (J-01/F3/AC-4 and the Identity Linking edge-case table). A full
 *   re-submission is blocked; the applicant is sent to **add a service** instead
 *   (J-03), which is a different journey with a different form.
 *
 * Collapsing these would send an accredited trainer to the wrong place.
 */
export type NewApplicationBlockReason = 'open-application' | 'approved-trainer';

/** Result of opening EH-TP-05: resume, fresh draft, or blocked. */
export interface StartOrResumeDraftDto {
  /** `null` when blocked for either reason below. */
  readonly draft: ApplicationDraftDto | null;
  readonly resumed: boolean;
  /** `null` when not blocked. */
  readonly blockReason: NewApplicationBlockReason | null;
  /** The un-decided application to link to — set only for `open-application`. */
  readonly blockedByApplicationId: string | null;
}

export interface SaveDraftInput {
  readonly services: readonly ApplicationService[];
  readonly values: Readonly<Record<string, ApplicationFieldValue>>;
  readonly entries?: Readonly<Record<string, readonly ApplicationEntryDto[]>>;
}

/** Successful submission (`BR-0105` completeness enforced server-side too;
 *  `BR-0107`: the reference is generated by the service at submit only). */
export interface SubmitApplicationDto {
  readonly applicationId: string;
  readonly reference: string;
  readonly submittedAt: string;
}
