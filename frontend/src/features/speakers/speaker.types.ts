import type { Locale } from '@/types';

/**
 * EH-INT-11 — Speaker records contracts (CAP-01/04, journey **J-04**,
 * «سجل المتحدث»). The internal record of a speaker: someone the Academy invites
 * to speak, who never applies, and who is never a trainer.
 *
 * Three journey rules are encoded **structurally**:
 *
 * 1. **Internal only** (`BR-0113`, J-04 F1/AC-1). Nothing here is reachable from
 *    the trainer portal; every route sits under `internal/`.
 * 2. **Never classified, evaluated, contracted or paid** (`BR-0413`). The DTOs
 *    carry no classification, score, agreement or entitlement field, so no
 *    screen can show one.
 * 3. **The email is not typed here** (owner ruling, 2026-10-13). It is read from
 *    the speaker's FAST profile, so `SpeakerInput` has no email field at all —
 *    only the detail carries one, and today it is `null` with a reason.
 *
 * ⚠️ **Open items carried from J-04**, none of them invented here:
 * - *Required fields* — the owner's matrix marks nothing mandatory. The Arabic
 *   first and last name are required because a record nobody can name cannot be
 *   found or listed. **Needs Confirmation.**
 * - *Bio length* — 2000 characters is the server's limit, not an approved one.
 *   **Needs Confirmation.**
 * - *Participation history* (F3) is deferred until FAST links speakers to
 *   events; the detail serves `history.available: false` until then.
 * - *Specialization filters* come after the matrix is approved — search is by
 *   name and title only.
 */

/** One row of the speaker list (and of the trainer search's speaker rows). */
export interface SpeakerSummaryDto {
  readonly speakerId: string;
  readonly nameAr: string;
  readonly nameEn: string | null;
  readonly title: string | null;
  /** A served path (`/v1/attachments/{id}`) — open it through `apiUrl()`. */
  readonly photoUrl: string | null;
  readonly createdAt: string;
}

export interface SpeakerListDto {
  readonly items: readonly SpeakerSummaryDto[];
  readonly totalCount: number;
  readonly page: number;
  readonly pageSize: number;
  readonly pageCount: number;
}

/** The list query — one search box over name and title (owner ruling). */
export interface SpeakerListQuery {
  readonly search: string;
  /** 1-based. */
  readonly page: number;
}

export const DEFAULT_SPEAKER_PAGE_SIZE = 20;

/** Why the email row is empty — the only reason the server serves today. */
export const SPEAKER_EMAIL_PENDING_FAST = 'fast-profile-unavailable';

export interface SpeakerParticipationDto {
  readonly eventName: string;
  readonly date: string;
  readonly role: string | null;
}

/**
 * F3 — participation history. `available: false` means FAST does not link
 * speakers to events yet; it does **not** mean the speaker has none, and no
 * screen may say "no participations" for it.
 */
export interface SpeakerHistoryDto {
  readonly available: boolean;
  readonly reason: string | null;
  readonly items: readonly SpeakerParticipationDto[];
}

export interface SpeakerDetailDto {
  readonly speakerId: string;
  readonly title: string | null;
  readonly firstNameAr: string;
  readonly middleNameAr: string | null;
  readonly thirdNameAr: string | null;
  readonly lastNameAr: string;
  readonly firstNameEn: string | null;
  readonly middleNameEn: string | null;
  readonly thirdNameEn: string | null;
  readonly lastNameEn: string | null;
  readonly bio: string | null;
  readonly photoAttachmentId: string | null;
  readonly photoUrl: string | null;
  /** From the speaker's FAST profile — never typed into this platform. */
  readonly email: string | null;
  /** `SPEAKER_EMAIL_PENDING_FAST` today; any other value is shown generically. */
  readonly emailUnavailableReason: string | null;
  readonly history: SpeakerHistoryDto;
  readonly createdAt: string;
  readonly updatedAt: string;
}

/* ------------------------------------------------------------------ *
 * The form — the owner's "Speaker Record" matrix, 11 fields, in order
 * ------------------------------------------------------------------ */

/** The ten text fields of the matrix (row 1, the photo, is an upload). */
export const SPEAKER_TEXT_FIELDS = [
  'title',
  'firstNameAr',
  'middleNameAr',
  'thirdNameAr',
  'lastNameAr',
  'firstNameEn',
  'middleNameEn',
  'thirdNameEn',
  'lastNameEn',
  'bio',
] as const;

export type SpeakerTextField = (typeof SPEAKER_TEXT_FIELDS)[number];

/** Every field the server can name in a `"<field>-<reason>"` problem detail. */
export type SpeakerField = SpeakerTextField | 'photoAttachmentId';

/** What the server sends (`POST v1/internal/speakers[/{id}]`). Blank → `null`. */
export type SpeakerInput = Readonly<Record<SpeakerTextField, string | null>> & {
  readonly photoAttachmentId: string | null;
  /** Create only: set after the user confirms a same-name record is someone else (RUN-040). */
  readonly confirmDuplicate?: boolean;
};

/** The form's own state: every text field a string, never `null`. */
export type SpeakerFormValues = Readonly<Record<SpeakerTextField, string>>;

export const EMPTY_SPEAKER_FORM: SpeakerFormValues = {
  title: '',
  firstNameAr: '',
  middleNameAr: '',
  thirdNameAr: '',
  lastNameAr: '',
  firstNameEn: '',
  middleNameEn: '',
  thirdNameEn: '',
  lastNameEn: '',
  bio: '',
};

/** ⚠️ Needs Confirmation — the matrix marks nothing mandatory (see the header). */
export const REQUIRED_SPEAKER_FIELDS: readonly SpeakerTextField[] = ['firstNameAr', 'lastNameAr'];

export const SPEAKER_NAME_MAX_LENGTH = 100;
export const SPEAKER_TITLE_MAX_LENGTH = 200;
/** ⚠️ Needs Confirmation — the server's limit, not an approved one. */
export const SPEAKER_BIO_MAX_LENGTH = 2000;

export function speakerFieldMaxLength(field: SpeakerTextField): number {
  return field === 'title'
    ? SPEAKER_TITLE_MAX_LENGTH
    : field === 'bio'
      ? SPEAKER_BIO_MAX_LENGTH
      : SPEAKER_NAME_MAX_LENGTH;
}

export type SpeakerFieldReason = 'required' | 'too-long' | 'invalid';

export interface SpeakerFieldIssue {
  readonly field: SpeakerField;
  readonly reason: SpeakerFieldReason;
}

export function toSpeakerInput(
  values: SpeakerFormValues,
  photoAttachmentId: string | null
): SpeakerInput {
  const clean = (value: string) => (value.trim() === '' ? null : value.trim());
  return {
    title: clean(values.title),
    firstNameAr: clean(values.firstNameAr),
    middleNameAr: clean(values.middleNameAr),
    thirdNameAr: clean(values.thirdNameAr),
    lastNameAr: clean(values.lastNameAr),
    firstNameEn: clean(values.firstNameEn),
    middleNameEn: clean(values.middleNameEn),
    thirdNameEn: clean(values.thirdNameEn),
    lastNameEn: clean(values.lastNameEn),
    bio: clean(values.bio),
    photoAttachmentId,
  };
}

export function toSpeakerFormValues(detail: SpeakerDetailDto): SpeakerFormValues {
  return {
    title: detail.title ?? '',
    firstNameAr: detail.firstNameAr,
    middleNameAr: detail.middleNameAr ?? '',
    thirdNameAr: detail.thirdNameAr ?? '',
    lastNameAr: detail.lastNameAr,
    firstNameEn: detail.firstNameEn ?? '',
    middleNameEn: detail.middleNameEn ?? '',
    thirdNameEn: detail.thirdNameEn ?? '',
    lastNameEn: detail.lastNameEn ?? '',
    bio: detail.bio ?? '',
  };
}

/**
 * The server's rules, applied the same way here (trimmed, blank → absent), so
 * the form says what is wrong before a round trip. The server re-checks; the
 * mock applies this same function as the server would.
 */
export function validateSpeakerInput(input: SpeakerInput): readonly SpeakerFieldIssue[] {
  const issues: SpeakerFieldIssue[] = [];
  for (const field of SPEAKER_TEXT_FIELDS) {
    const value = input[field];
    if (value == null) {
      if (REQUIRED_SPEAKER_FIELDS.includes(field)) {
        issues.push({ field, reason: 'required' });
      }
    } else if (value.length > speakerFieldMaxLength(field)) {
      issues.push({ field, reason: 'too-long' });
    }
  }
  return issues;
}

const SPEAKER_FIELDS: readonly SpeakerField[] = [...SPEAKER_TEXT_FIELDS, 'photoAttachmentId'];
const SPEAKER_REASONS: readonly SpeakerFieldReason[] = ['required', 'too-long', 'invalid'];

/**
 * Reads the server's `"<field>-<reason>"` problem detail (surfaced by the api
 * client as `error.message`) back into a field issue. `null` for any other
 * failure, which the form reports as a save failure instead.
 */
export function parseSpeakerProblem(detail: string): SpeakerFieldIssue | null {
  for (const reason of SPEAKER_REASONS) {
    const suffix = `-${reason}`;
    if (detail.endsWith(suffix)) {
      const field = detail.slice(0, -suffix.length) as SpeakerField;
      return SPEAKER_FIELDS.includes(field) ? { field, reason } : null;
    }
  }
  return null;
}

/* ------------------------------------------------------------------ *
 * The photo — J-01's approved photo rule
 * ------------------------------------------------------------------ */

/** What the upload answers (`POST v1/internal/attachments`, `speaker-photo`). */
export interface UploadedSpeakerPhotoDto {
  readonly attachmentId: string;
  readonly fileName: string;
  readonly sizeBytes: number;
  readonly downloadUrl: string;
  /** `not-scanned` until the antivirus pass exists (`G27`); never shown. */
  readonly scanStatus: string | null;
}

/** J-01's approved image rule (JPG/PNG, 1 MB), which the API applies too. */
export const SPEAKER_PHOTO_FORMATS: readonly string[] = ['jpg', 'jpeg', 'png'];
export const SPEAKER_PHOTO_MAX_BYTES = 1024 * 1024;

export function speakerPhotoIssue(file: {
  readonly name: string;
  readonly size: number;
}): 'format' | 'size' | null {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
  if (!SPEAKER_PHOTO_FORMATS.includes(extension)) {
    return 'format';
  }
  return file.size > SPEAKER_PHOTO_MAX_BYTES ? 'size' : null;
}

/* ------------------------------------------------------------------ *
 * Names
 * ------------------------------------------------------------------ */

function joinParts(parts: readonly (string | null)[]): string {
  return parts.filter((part): part is string => part != null && part.trim() !== '').join(' ');
}

export function speakerNameAr(detail: SpeakerDetailDto): string {
  return joinParts([
    detail.firstNameAr,
    detail.middleNameAr,
    detail.thirdNameAr,
    detail.lastNameAr,
  ]);
}

/** `null` when no English name part was recorded. */
export function speakerNameEn(detail: SpeakerDetailDto): string | null {
  const name = joinParts([
    detail.firstNameEn,
    detail.middleNameEn,
    detail.thirdNameEn,
    detail.lastNameEn,
  ]);
  return name === '' ? null : name;
}

/** The name to show in a list: the English one in English when recorded. */
export function speakerDisplayName(summary: SpeakerSummaryDto, locale: Locale): string {
  return locale === 'en' && summary.nameEn != null ? summary.nameEn : summary.nameAr;
}
