import type { Result } from '@/types';
import { isModuleLive } from '../../app/config/expertHubConfig';
import { createExpertHubApiClient } from '../../shared/services/apiClient';
import type { ExpertHubApiClient, ExpertHubApiError } from '../../shared/services/apiClient';
import { createMockSpeakerProvider } from './mockSpeakerProvider';
import {
  DEFAULT_SPEAKER_PAGE_SIZE,
  type SpeakerDetailDto,
  type SpeakerInput,
  type SpeakerListDto,
  type SpeakerListQuery,
  type UploadedSpeakerPhotoDto,
} from './speaker.types';

/**
 * Expert Hub speaker-record service — EH-INT-11 (journey **J-04**). Two
 * providers implement the same versioned contract; swapping mock → real API is
 * configuration, not a UI change.
 *
 * Validation errors come back as a 400 whose problem `detail` is
 * `"<field>-<reason>"` (`firstNameAr-required`, `bio-too-long`, …), which the
 * api client surfaces as `error.message` and `parseSpeakerProblem` maps back to
 * the field.
 */

export const SPEAKERS_API_VERSION = 'v1';

export interface SpeakerService {
  /** F2 — the list, newest first, searched by name and title (`F-0413`). */
  listSpeakers(query: SpeakerListQuery): Promise<Result<SpeakerListDto, ExpertHubApiError>>;
  /** The whole record, with the FAST-sourced email and the history (`F-0413`). */
  getSpeaker(id: string): Promise<Result<SpeakerDetailDto, ExpertHubApiError>>;
  /** F1 — create (`F-0105`). Answers the stored record. */
  createSpeaker(input: SpeakerInput): Promise<Result<SpeakerDetailDto, ExpertHubApiError>>;
  /** Edit (`F-0413`). A POST, not a PUT: the api client has GET and POST only. */
  updateSpeaker(
    id: string,
    input: SpeakerInput
  ): Promise<Result<SpeakerDetailDto, ExpertHubApiError>>;
  /**
   * Store the photo FIRST; the save then carries the returned `attachmentId`
   * (J-01's photo rule — JPG/PNG, 1 MB — 422 on format/size).
   */
  uploadPhoto(file: File): Promise<Result<UploadedSpeakerPhotoDto, ExpertHubApiError>>;
}

/** Future-API provider — already wired to the versioned endpoint shape. */
export function createHttpSpeakerProvider(
  client: ExpertHubApiClient = createExpertHubApiClient()
): SpeakerService {
  const base = `${SPEAKERS_API_VERSION}/internal/speakers`;
  return {
    listSpeakers(query) {
      const params = new URLSearchParams();
      if (query.search.trim() !== '') {
        params.set('search', query.search.trim());
      }
      params.set('page', String(query.page));
      params.set('pageSize', String(DEFAULT_SPEAKER_PAGE_SIZE));
      return client.get<SpeakerListDto>(`${base}?${params.toString()}`);
    },
    getSpeaker(id) {
      return client.get<SpeakerDetailDto>(`${base}/${encodeURIComponent(id)}`);
    },
    createSpeaker(input) {
      return client.post<SpeakerDetailDto>(base, input);
    },
    updateSpeaker(id, input) {
      return client.post<SpeakerDetailDto>(`${base}/${encodeURIComponent(id)}`, input);
    },
    uploadPhoto(file) {
      // The application form's multipart shape: the file and what it is for.
      const payload = new FormData();
      payload.append('purpose', 'speaker-photo');
      payload.append('file', file);
      return client.post<UploadedSpeakerPhotoDto>(
        `${SPEAKERS_API_VERSION}/internal/attachments`,
        payload
      );
    },
  };
}

function createDefaultService(): SpeakerService {
  return isModuleLive('speakers') ? createHttpSpeakerProvider() : createMockSpeakerProvider();
}

let serviceInstance: SpeakerService | null = null;

export function getSpeakerService(): SpeakerService {
  serviceInstance ??= createDefaultService();
  return serviceInstance;
}

/** Test seam: inject a seeded/failing provider (`null` restores the default). */
export function setSpeakerServiceForTesting(service: SpeakerService | null): void {
  serviceInstance = service;
}
