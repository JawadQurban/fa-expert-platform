import type { ExpertHubApiError } from '../../shared/services/apiClient';
import type { SpeakerService } from './speakerService';
import {
  DEFAULT_SPEAKER_PAGE_SIZE,
  SPEAKER_EMAIL_PENDING_FAST,
  speakerNameAr,
  speakerNameEn,
  speakerPhotoIssue,
  validateSpeakerInput,
  type SpeakerDetailDto,
  type SpeakerInput,
  type SpeakerListQuery,
  type SpeakerSummaryDto,
} from './speaker.types';

/**
 * Versioned **mock** provider for EH-INT-11 (J-04). It simulates the server's
 * side: the search over name parts and title, newest first, the paging, the
 * same validation (`validateSpeakerInput`, then the photo id), and the two
 * things FAST cannot serve yet — the email and the participation history.
 *
 * ⚠️ MOCK DATA (clearly labelled): the speakers below are representative
 * development data, not real people.
 */

/** The history the server serves until FAST links speakers to events. */
const HISTORY_PENDING_FAST: SpeakerDetailDto['history'] = {
  available: false,
  reason: 'fast-speaker-history-unavailable',
  items: [],
};

function seed(
  speakerId: string,
  createdAt: string,
  values: Omit<
    SpeakerDetailDto,
    | 'speakerId'
    | 'createdAt'
    | 'updatedAt'
    | 'photoAttachmentId'
    | 'photoUrl'
    | 'email'
    | 'emailUnavailableReason'
    | 'history'
  >
): SpeakerDetailDto {
  return {
    speakerId,
    ...values,
    photoAttachmentId: null,
    photoUrl: null,
    // Owner ruling (2026-10-13): read from the FAST profile, never typed here.
    email: null,
    emailUnavailableReason: SPEAKER_EMAIL_PENDING_FAST,
    history: HISTORY_PENDING_FAST,
    createdAt,
    updatedAt: createdAt,
  };
}

/** ⚠️ MOCK: three representative speakers, oldest first. */
export const MOCK_SPEAKERS: readonly SpeakerDetailDto[] = [
  seed('spk-001', '2026-08-02T09:00:00Z', {
    title: 'خبير في التقنية المالية',
    firstNameAr: 'فيصل',
    middleNameAr: 'عبدالله',
    thirdNameAr: null,
    lastNameAr: 'الحربي',
    firstNameEn: 'Faisal',
    middleNameEn: 'Abdullah',
    thirdNameEn: null,
    lastNameEn: 'Alharbi',
    bio: 'متحدث في مؤتمرات التقنية المالية، يركّز على المدفوعات الرقمية والأنظمة المصرفية المفتوحة.',
  }),
  seed('spk-002', '2026-09-15T09:00:00Z', {
    title: 'رئيسة تنفيذية سابقة',
    firstNameAr: 'هيفاء',
    middleNameAr: null,
    thirdNameAr: null,
    lastNameAr: 'الزهراني',
    firstNameEn: 'Haifa',
    middleNameEn: null,
    thirdNameEn: null,
    lastNameEn: 'Alzahrani',
    bio: null,
  }),
  seed('spk-003', '2026-10-01T09:00:00Z', {
    title: null,
    firstNameAr: 'ماجد',
    middleNameAr: 'سعد',
    thirdNameAr: 'محمد',
    lastNameAr: 'الدوسري',
    firstNameEn: null,
    middleNameEn: null,
    thirdNameEn: null,
    lastNameEn: null,
    bio: null,
  }),
];

export function toSpeakerSummary(detail: SpeakerDetailDto): SpeakerSummaryDto {
  return {
    speakerId: detail.speakerId,
    nameAr: speakerNameAr(detail),
    nameEn: speakerNameEn(detail),
    title: detail.title,
    photoUrl: detail.photoUrl,
    createdAt: detail.createdAt,
  };
}

/**
 * The server's search: any Arabic or English name part, or the title,
 * case-insensitively. Shared with the trainer-search mock so a speaker is found
 * the same way on both screens.
 */
export function speakerMatchesSearch(detail: SpeakerDetailDto, search: string): boolean {
  const needle = search.trim().toLowerCase();
  if (needle === '') {
    return true;
  }
  return [
    detail.firstNameAr,
    detail.middleNameAr,
    detail.thirdNameAr,
    detail.lastNameAr,
    detail.firstNameEn,
    detail.middleNameEn,
    detail.thirdNameEn,
    detail.lastNameEn,
    detail.title,
  ].some((value) => value != null && value.toLowerCase().includes(needle));
}

export interface MockSpeakerProviderOptions {
  readonly latencyMs?: number;
  readonly failWith?: ExpertHubApiError;
  /** Fails only the saves (create/update) — for the server-validation tests. */
  readonly failSaveWith?: ExpertHubApiError;
  /** Starts with no speakers — the empty state. */
  readonly empty?: boolean;
}

function delay(ms: number): Promise<void> {
  return ms <= 0 ? Promise.resolve() : new Promise((resolve) => setTimeout(resolve, ms));
}

export function createMockSpeakerProvider(
  options: MockSpeakerProviderOptions = {}
): SpeakerService {
  const { latencyMs = 300, failWith, failSaveWith, empty = false } = options;
  // ⚠️ MOCK: state lives in this provider instance only.
  let speakers: SpeakerDetailDto[] = empty ? [] : [...MOCK_SPEAKERS];
  const photos = new Map<string, string>();
  let nextId = speakers.length + 1;

  /** The server's validation: the text rules, then the photo must resolve. */
  const refuse = (input: SpeakerInput): ExpertHubApiError | null => {
    const issue = validateSpeakerInput(input)[0];
    if (issue != null) {
      return { status: 400, message: `${issue.field}-${issue.reason}` };
    }
    if (input.photoAttachmentId != null && !photos.has(input.photoAttachmentId)) {
      return { status: 400, message: 'photoAttachmentId-invalid' };
    }
    return null;
  };

  const apply = (
    current: Pick<SpeakerDetailDto, 'speakerId' | 'createdAt' | 'email' | 'history'>,
    input: SpeakerInput,
    now: string
  ): SpeakerDetailDto => ({
    speakerId: current.speakerId,
    title: input.title,
    firstNameAr: input.firstNameAr ?? '',
    middleNameAr: input.middleNameAr,
    thirdNameAr: input.thirdNameAr,
    lastNameAr: input.lastNameAr ?? '',
    firstNameEn: input.firstNameEn,
    middleNameEn: input.middleNameEn,
    thirdNameEn: input.thirdNameEn,
    lastNameEn: input.lastNameEn,
    bio: input.bio,
    photoAttachmentId: input.photoAttachmentId,
    photoUrl: input.photoAttachmentId == null ? null : `/v1/attachments/${input.photoAttachmentId}`,
    email: current.email,
    emailUnavailableReason: current.email == null ? SPEAKER_EMAIL_PENDING_FAST : null,
    history: current.history,
    createdAt: current.createdAt,
    updatedAt: now,
  });

  return {
    async listSpeakers(query: SpeakerListQuery) {
      await delay(latencyMs);
      if (failWith != null) {
        return { ok: false, error: failWith };
      }
      const matching = speakers
        .filter((speaker) => speakerMatchesSearch(speaker, query.search))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      const pageSize = DEFAULT_SPEAKER_PAGE_SIZE;
      const pageCount = Math.max(1, Math.ceil(matching.length / pageSize));
      const page = Math.min(Math.max(1, query.page), pageCount);
      return {
        ok: true,
        value: {
          items: matching.slice((page - 1) * pageSize, page * pageSize).map(toSpeakerSummary),
          totalCount: matching.length,
          page,
          pageSize,
          pageCount,
        },
      };
    },

    async getSpeaker(id: string) {
      await delay(latencyMs);
      if (failWith != null) {
        return { ok: false, error: failWith };
      }
      const speaker = speakers.find((candidate) => candidate.speakerId === id);
      return speaker == null
        ? { ok: false, error: { status: 404, message: 'Speaker not found.' } }
        : { ok: true, value: speaker };
    },

    async createSpeaker(input: SpeakerInput) {
      await delay(latencyMs);
      const failure = failWith ?? failSaveWith ?? refuse(input);
      if (failure != null) {
        return { ok: false, error: failure };
      }
      const now = new Date().toISOString();
      const created = apply(
        {
          speakerId: `spk-${String(nextId).padStart(3, '0')}`,
          createdAt: now,
          email: null,
          history: HISTORY_PENDING_FAST,
        },
        input,
        now
      );
      nextId += 1;
      speakers = [...speakers, created];
      return { ok: true, value: created };
    },

    async updateSpeaker(id: string, input: SpeakerInput) {
      await delay(latencyMs);
      if (failWith != null) {
        return { ok: false, error: failWith };
      }
      const current = speakers.find((candidate) => candidate.speakerId === id);
      if (current == null) {
        return { ok: false, error: { status: 404, message: 'Speaker not found.' } };
      }
      // The stored photo stays valid on an edit that keeps it.
      if (current.photoAttachmentId != null) {
        photos.set(current.photoAttachmentId, 'existing');
      }
      const failure = failSaveWith ?? refuse(input);
      if (failure != null) {
        return { ok: false, error: failure };
      }
      const updated = apply(current, input, new Date().toISOString());
      speakers = speakers.map((speaker) => (speaker.speakerId === id ? updated : speaker));
      return { ok: true, value: updated };
    },

    async uploadPhoto(file: File) {
      await delay(latencyMs);
      if (failWith != null) {
        return { ok: false, error: failWith };
      }
      if (file.size === 0) {
        return { ok: false, error: { status: 400, message: 'file-required' } };
      }
      // J-01's photo rule, re-checked as the server re-checks it.
      const issue = speakerPhotoIssue(file);
      if (issue != null) {
        return {
          ok: false,
          error: {
            status: 422,
            message: issue === 'size' ? 'The file is larger than 1 MB.' : 'Not an accepted format.',
          },
        };
      }
      const attachmentId = `att-speaker-photo-${String(photos.size + 1).padStart(3, '0')}`;
      photos.set(attachmentId, file.name);
      return {
        ok: true,
        value: {
          attachmentId,
          fileName: file.name,
          sizeBytes: file.size,
          downloadUrl: `/v1/attachments/${attachmentId}`,
          // Stored unchecked, exactly as the server stores it until `G27`.
          scanStatus: 'not-scanned',
        },
      };
    },
  };
}
