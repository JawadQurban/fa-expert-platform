import type { AssignmentServiceType } from './assignment.types';

/**
 * THE CENTRE REQUEST FORM — Notion «Assignment Matrix» (J-16 / J-17), the
 * approved successor of the `DM-GAP-06` workbook this form was first built from.
 *
 * The API (`CentreRequestMatrix.cs`) is the authority a submitted request is
 * checked against; this module mirrors the same matrix so the page can render
 * each form and pre-validate it. Change both together.
 *
 * What the matrix fixes: the ten request types, the form each one opens, the
 * service it is matched against, every form's fields, their order, which are
 * mandatory, and the allowed values.
 *
 * ## Deliberately not implemented — REQUIRES REVIEW
 *
 * - «لقاء / ندوة» route to the Speaker category in Notion, and «ورشة عمل» to
 *   «متحدث، مدرب» (2026-09-29). Speaker (J-04) is not built, so all three keep
 *   the trainer routing — the owner's ruling, `P-341`.
 * - Forms 1–5 are "FAST-driven" (plan/event/exam selection auto-fills them).
 *   No FAST read exists, so the centre still enters them by hand.
 * - «مجال التخصص» is Notion's Sector → Job Family cascade from FAST; the
 *   existing 147-value list stays until that lookup is available.
 * - A named person bypassing matching (J-16/F5, J-18/F4) is a workflow change.
 * - Form 1's field table omits «إضافة مدرب محدد» while J-16/F5 applies it to
 *   every form; the existing optional field is kept.
 *
 * ## Approved — the request carries a headcount, and may name up to N experts
 *
 * The request no longer implies one person. `requiredHeadcount` (>= 1, no
 * approved maximum) says how many are needed, and `specificNominees` may name
 * up to that many. Each named expert is an approved pool member on their own
 * slot; the slots left unnamed still go through J-17 matching. The single
 * `specificNominee` stays readable for back-compat.
 */

export const CENTRE_REQUEST_TYPES = [
  'general-program',
  'private-program',
  'training-workshop',
  'meeting',
  'seminar',
  'content-development-request',
  'question-writing',
  'technical-presentations',
  'consultations',
  'other',
] as const;

export type CentreRequestType = (typeof CENTRE_REQUEST_TYPES)[number];

/** The matrix's six forms. */
export type CentreRequestForm =
  | 'general-program'
  | 'private-program'
  | 'event'
  | 'content-development'
  | 'question-writing'
  | 'consultation';

/** «Routing: نوع الطلب» — which form each request type opens. */
export function formFor(type: CentreRequestType): CentreRequestForm {
  switch (type) {
    case 'general-program':
      return 'general-program';
    case 'private-program':
      return 'private-program';
    case 'training-workshop':
    case 'meeting':
    case 'seminar':
      return 'event';
    case 'content-development-request':
    case 'technical-presentations':
      return 'content-development';
    case 'question-writing':
      return 'question-writing';
    default:
      return 'consultation';
  }
}

/** Forms 1–5 describe a programme, event, content or exam; form 6 a consultation. */
export function isProgramLike(type: CentreRequestType): boolean {
  return formFor(type) !== 'consultation';
}

/** «اسم العميل» — on forms 2–5 (absent on form 1). */
export function hasClientField(type: CentreRequestType): boolean {
  return isProgramLike(type) && formFor(type) !== 'general-program';
}

/** «اسم العميل» is mandatory on form 2 only; optional on forms 3–5. */
export function clientRequired(type: CentreRequestType): boolean {
  return formFor(type) === 'private-program';
}

/**
 * The categories each request type may be matched against (Notion's routing
 * table). Where there is more than one, the requester picks («الفئة المطلوبة»)
 * and the request is matched against that one only (`P-341`).
 * ⚠️ Form 3's types route to Speaker in Notion — not built, so trainer is kept.
 */
export function serviceChoicesFor(type: CentreRequestType): readonly AssignmentServiceType[] {
  // «عروض فنية / محاور البرامج» → «مطوّر محتوى أو مدرب» (2026-09-29).
  if (type === 'technical-presentations') {
    return ['content-developer', 'trainer'];
  }
  return [defaultServiceFor(type)];
}

/**
 * The service a request is matched against: the requester's pick where the
 * type allows several, else the type's only one. `null` while a required pick
 * is still missing.
 */
export function serviceTypeFor(
  type: CentreRequestType,
  chosen?: string
): AssignmentServiceType | null {
  const choices = serviceChoicesFor(type);
  if (choices.length === 1) {
    return choices[0];
  }
  return choices.find((service) => service === chosen) ?? null;
}

function defaultServiceFor(type: CentreRequestType): AssignmentServiceType {
  switch (formFor(type)) {
    case 'content-development':
      return 'content-developer';
    case 'question-writing':
      return 'question-writer';
    case 'consultation':
      return 'consultant';
    default:
      return 'trainer';
  }
}

/** «الفترة» — صباحية، مسائية. */
export const PERIODS = ['morning', 'evening'] as const;
/** «الية التنفيذ» — حضوري، عن بُعد; form 3 adds «بث مباشر». */
export const DELIVERY_MODES = ['onsite', 'online', 'live-stream'] as const;
/** «لغة التدريب / المحتوى / الاستشارة» — عربي، إنجليزي. */
export const LANGUAGES = ['ar', 'en'] as const;
/** «مستوى المتدربين» — مبتدئ، متوسط، متقدم. */
export const TRAINEE_LEVELS = ['beginner', 'intermediate', 'advanced'] as const;
/** «نوع الاستشارة». */
export const CONSULTATION_TYPES = [
  'individual',
  'institutional',
  'case-study',
  'assessment-audit',
  'other',
] as const;
/** «عدد الأيام» — 1 to 8. «أخرى» is carried as `daysCountOther`. */
export const MAX_LISTED_DAYS = 8;

export type DeliveryMode = (typeof DELIVERY_MODES)[number];

/** The execution modes a request type may choose from. */
export function deliveryModesFor(type: CentreRequestType): readonly DeliveryMode[] {
  return formFor(type) === 'event' ? DELIVERY_MODES : ['onsite', 'online'];
}

/**
 * What the centre submits. One flat input; which fields apply is decided by
 * the request type (`validateCentreRequest` enforces it).
 */
export interface CreateCentreRequestInput {
  /* — الخيارات الرئيسية — */
  readonly centreId: string;
  readonly requestType: CentreRequestType;
  /** «الفئة المطلوبة» — only for a type routed to several categories. */
  readonly serviceType?: AssignmentServiceType;
  /** «اسم المسؤول» — the entering employee. */
  readonly responsibleEmployee: string;

  /* — forms 1–5 — */
  /** «اسم البرنامج» / «اسم الفعالية» / «اسم البرنامج/المحتوى» / «اسم الاختبار». */
  readonly programName?: string;
  /** «عدد الأيام», 1–8; absent when «أخرى» was chosen. */
  readonly daysCount?: number;
  /** «أخرى» in «عدد الأيام». */
  readonly daysCountOther?: boolean;
  readonly dateFrom?: string;
  readonly dateTo?: string;
  readonly period?: string;
  readonly deliveryMechanism?: string;
  /** «المدينة / الموقع» — the location as typed, or «تيمز». */
  readonly city?: string;
  /** «لغة التدريب» / «لغة المحتوى» / «لغة الاستشارة» per form. */
  readonly language?: string;
  readonly traineeLevel?: string;
  /** «اسم العميل (البرامج الخاصة)». */
  readonly clientName?: string;
  /**
   * «العدد المطلوب» — how many experts this request needs. `>= 1`, and 1 when
   * absent. **No approved maximum**, so none is invented here.
   */
  readonly requiredHeadcount?: number;
  /**
   * «إضافة خبراء محددين» — optional. At most `requiredHeadcount` trainer ids,
   * no duplicates. Each one becomes an approved pool member on its own slot;
   * the slots left unnamed still go through J-17 matching.
   */
  readonly specificNominees?: readonly string[];
  /**
   * Legacy single value — the form named exactly one person before the
   * headcount existed. Still accepted, and read as a one-item list
   * (`nomineesOf`), so an existing draft or payload still loads.
   */
  readonly specificNominee?: string;

  /* — form 6 — */
  readonly consultationTopic?: string;
  /** Optional; a value given must be a whole number of hours. */
  readonly expectedHours?: number;
  readonly consultationType?: string;
  /** Optional. */
  readonly beneficiary?: string;

  /* — shared — */
  /** «مجال التخصص». */
  readonly specializationDomain?: string;
  /**
   * «النشرة التعريفية» (forms 1–5) / «المرفقات» (form 6) — mandatory, and
   * mandatory as a STORED document: the id `POST internal/attachments`
   * returned. A file name alone is refused (`required-field-missing`).
   */
  readonly attachmentId?: string | null;
  /** The uploaded file's name. Still sent (the matrix checks it), but the
   *  server overwrites it with the stored file's own name. */
  readonly attachmentName?: string | null;
  readonly notes?: string;
}

/**
 * J-01's approved document rule, which the API reuses for the brochure
 * (`AttachmentUploads.cs`: PDF/DOC/DOCX, 1 MB). Checked here only so the page
 * can say which rule a file breaks before sending it; the server re-checks.
 */
export const BROCHURE_FORMATS: readonly string[] = ['pdf', 'doc', 'docx'];
export const BROCHURE_MAX_BYTES = 1024 * 1024;

export function brochureFileIssue(file: {
  readonly name: string;
  readonly size: number;
}): 'format' | 'size' | null {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
  if (!BROCHURE_FORMATS.includes(extension)) {
    return 'format';
  }
  return file.size > BROCHURE_MAX_BYTES ? 'size' : null;
}

/** Absent headcount means one person, exactly as the form behaved before. */
export const DEFAULT_HEADCOUNT = 1;

/** The request's effective headcount. */
export function headcountOf(
  input: Pick<Partial<CreateCentreRequestInput>, 'requiredHeadcount'>
): number {
  return input.requiredHeadcount ?? DEFAULT_HEADCOUNT;
}

/**
 * The named experts, as one list — the legacy single `specificNominee` reads
 * back as a one-item list, so nothing downstream has to know which shape it
 * was given. Blank entries (an open picker row) are not names.
 */
export function nomineesOf(
  input: Pick<Partial<CreateCentreRequestInput>, 'specificNominees' | 'specificNominee'>
): readonly string[] {
  const named =
    input.specificNominees ?? (input.specificNominee == null ? [] : [input.specificNominee]);
  return named.filter((id) => id.trim() !== '');
}

export type CentreRequestValidationCode =
  | 'centre-required'
  | 'request-type-required'
  | 'service-type-required'
  | 'responsible-required'
  | 'program-name-required'
  | 'days-invalid'
  | 'dates-required'
  | 'dates-order'
  | 'period-required'
  | 'mechanism-required'
  | 'city-required'
  | 'language-required'
  | 'trainee-level-required'
  | 'client-required'
  | 'topic-required'
  | 'hours-invalid'
  | 'consultation-type-required'
  | 'attachment-required'
  | 'domain-required'
  | 'headcount-invalid'
  | 'duplicate-nominee'
  | 'nominees-exceed-headcount';

function missing(value: string | null | undefined): boolean {
  return value == null || value.trim() === '';
}

function notOneOf(value: string | undefined, allowed: readonly string[]): boolean {
  return missing(value) || !allowed.includes(value as string);
}

/** The matrix's field rules, enforced per request type. */
export function validateCentreRequest(
  input: Partial<CreateCentreRequestInput>
): readonly CentreRequestValidationCode[] {
  const issues: CentreRequestValidationCode[] = [];
  if (missing(input.centreId)) {
    issues.push('centre-required');
  }
  if (input.requestType == null || !CENTRE_REQUEST_TYPES.includes(input.requestType)) {
    issues.push('request-type-required');
    return issues;
  }
  if (missing(input.responsibleEmployee)) {
    issues.push('responsible-required');
  }
  const type = input.requestType;
  if (serviceTypeFor(type, input.serviceType) == null) {
    issues.push('service-type-required');
  }

  if (isProgramLike(type)) {
    if (missing(input.programName)) {
      issues.push('program-name-required');
    }
    if (
      input.daysCountOther !== true &&
      (input.daysCount == null ||
        !Number.isInteger(input.daysCount) ||
        input.daysCount < 1 ||
        input.daysCount > MAX_LISTED_DAYS)
    ) {
      issues.push('days-invalid');
    }
    if (notOneOf(input.period, PERIODS)) {
      issues.push('period-required');
    }
    if (notOneOf(input.traineeLevel, TRAINEE_LEVELS)) {
      issues.push('trainee-level-required');
    }
    if (clientRequired(type) && missing(input.clientName)) {
      issues.push('client-required');
    }
  } else {
    if (missing(input.consultationTopic)) {
      issues.push('topic-required');
    }
    if (
      input.expectedHours != null &&
      (!Number.isInteger(input.expectedHours) || input.expectedHours < 1)
    ) {
      issues.push('hours-invalid');
    }
    if (notOneOf(input.consultationType, CONSULTATION_TYPES)) {
      issues.push('consultation-type-required');
    }
  }

  // Shared across every form.
  if (missing(input.dateFrom) || missing(input.dateTo)) {
    issues.push('dates-required');
  } else if (String(input.dateTo).slice(0, 10) < String(input.dateFrom).slice(0, 10)) {
    // The API's rule: the end may be the same day, never before the start —
    // compared as dates (YYYY-MM-DD sorts as text).
    issues.push('dates-order');
  }
  if (notOneOf(input.deliveryMechanism, deliveryModesFor(type))) {
    issues.push('mechanism-required');
  }
  if (missing(input.city)) {
    issues.push('city-required');
  }
  if (notOneOf(input.language, LANGUAGES)) {
    issues.push('language-required');
  }
  // An uploaded document, not a chosen file name.
  if (missing(input.attachmentId)) {
    issues.push('attachment-required');
  }
  if (missing(input.specializationDomain)) {
    issues.push('domain-required');
  }

  // J-16/F4 — the headcount, and the experts named against it. Naming nobody
  // is still valid: those slots go to matching.
  if (
    input.requiredHeadcount != null &&
    (!Number.isInteger(input.requiredHeadcount) || input.requiredHeadcount < 1)
  ) {
    issues.push('headcount-invalid');
  }
  const nominees = nomineesOf(input);
  if (new Set(nominees).size !== nominees.length) {
    issues.push('duplicate-nominee');
  }
  if (nominees.length > headcountOf(input)) {
    issues.push('nominees-exceed-headcount');
  }

  return issues;
}
