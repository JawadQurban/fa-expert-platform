import type { Result } from '@/types';
import { isModuleLive } from '../../app/config/expertHubConfig';
import { createExpertHubApiClient } from '../../shared/services/apiClient';
import type { ExpertHubApiClient, ExpertHubApiError } from '../../shared/services/apiClient';
import type { BankDataFields, MyProfileDto, ProfileFieldValues } from './profile.types';
import { createMockProfileProvider } from './mockProfileProvider';

/**
 * Expert Hub profile service (`CAP-04`, EH-TP-04) — the **only** data source the
 * My Profile page consumes. Two providers implement the same versioned contract:
 *
 * - **HTTP provider** — the future Expert Hub API, reached through the shared
 *   `apiClient` (which never talks to FAST / MTM / SSO directly — `02C`; the FAST
 *   change-request + rating calc happen server-side behind these endpoints).
 *   Selected automatically once `VITE_EXPERT_HUB_API_BASE_URL` is set.
 * - **Mock provider** — the versioned in-memory stand-in used until then.
 *
 * Swapping mock → real API is configuration, not a UI change.
 */

export const PROFILE_API_VERSION = 'v1';

export interface ProfileService {
  getMyProfile(): Promise<Result<MyProfileDto, ExpertHubApiError>>;
  /**
   * **J-14/F1/AC-4** — save the editable fields of the shared application-form
   * schema. "The profile reflects the changes immediately — no application
   * resubmission or approval cycle is triggered", which is why this returns the
   * updated profile rather than a request receipt.
   *
   * Only fields whose `editability` is `editable` are accepted; the server
   * re-checks, because a client that skipped the UI must not be able to write a
   * locked or FAST-owned field.
   */
  saveProfileFields(values: ProfileFieldValues): Promise<Result<MyProfileDto, ExpertHubApiError>>;
  /** Submit a FAST-owned change request → field goes "change pending" (`BR-0404`). */
  requestFastFieldChange(
    fieldId: string,
    newValue: string
  ): Promise<Result<MyProfileDto, ExpertHubApiError>>;
  /** Toggle public-directory visibility consent — immediate effect (`BR-1007`). */
  setVisibilityConsent(consent: boolean): Promise<Result<MyProfileDto, ExpertHubApiError>>;
  /** J-09/F6 — save the eight mandatory bank-data fields; completing them
   *  notifies the application's creator that agreement preparation can proceed. */
  saveBankData(fields: BankDataFields): Promise<Result<MyProfileDto, ExpertHubApiError>>;
  /**
   * **J-14/F1/AC-2** — add a certificate: multipart to `me/profile/certificates`,
   * answered with the whole refreshed profile. The server checks the file
   * against the trainer's application `professional-certificate` rule (422),
   * and stores it `not-scanned` — the antivirus pass is still `G27`.
   */
  uploadCertificate(file: File): Promise<Result<MyProfileDto, ExpertHubApiError>>;
  removeCertificate(id: string): Promise<Result<MyProfileDto, ExpertHubApiError>>;
  /**
   * `P-331` — ask the AI to draft the bio from the CV. Answers at once with the
   * bio `drafting`; the draft lands later. 409 `ai-unavailable` until the AI is
   * switched on (`Q28`), and 409 `no-cv` with no CV to read.
   */
  requestBioDraft(revision: number): Promise<Result<MyProfileDto, ExpertHubApiError>>;
  /** `P-331` — submit the bio for staff review (it is never published unreviewed). */
  submitBio(text: string, revision: number): Promise<Result<MyProfileDto, ExpertHubApiError>>;
}

/** Future-API provider — already wired to the versioned endpoint shape. */
export function createHttpProfileProvider(
  client: ExpertHubApiClient = createExpertHubApiClient()
): ProfileService {
  return {
    getMyProfile() {
      return client.get<MyProfileDto>(`${PROFILE_API_VERSION}/me/profile`);
    },
    saveProfileFields(values) {
      return client.post<MyProfileDto>(`${PROFILE_API_VERSION}/me/profile/fields`, { values });
    },
    requestFastFieldChange(fieldId, newValue) {
      return client.post<MyProfileDto>(`${PROFILE_API_VERSION}/me/profile/change-request`, {
        fieldId,
        newValue,
      });
    },
    setVisibilityConsent(consent) {
      return client.post<MyProfileDto>(`${PROFILE_API_VERSION}/me/profile/visibility`, { consent });
    },
    saveBankData(fields) {
      return client.post<MyProfileDto>(`${PROFILE_API_VERSION}/me/profile/bank-data`, fields);
    },
    uploadCertificate(file) {
      // The application form's multipart shape; the rule is the server's.
      const payload = new FormData();
      payload.append('file', file);
      return client.post<MyProfileDto>(`${PROFILE_API_VERSION}/me/profile/certificates`, payload);
    },
    removeCertificate(id) {
      return client.post<MyProfileDto>(`${PROFILE_API_VERSION}/me/profile/certificates/remove`, {
        id,
      });
    },
    requestBioDraft(revision) {
      return client.post<MyProfileDto>(`${PROFILE_API_VERSION}/me/profile/bio/draft-from-cv`, {
        revision,
      });
    },
    submitBio(text, revision) {
      return client.post<MyProfileDto>(`${PROFILE_API_VERSION}/me/profile/bio`, { text, revision });
    },
  };
}

function createDefaultService(): ProfileService {
  return isModuleLive('profile') ? createHttpProfileProvider() : createMockProfileProvider();
}

let serviceInstance: ProfileService | null = null;

/** The application-wide profile service instance the page consumes. */
export function getProfileService(): ProfileService {
  serviceInstance ??= createDefaultService();
  return serviceInstance;
}

/**
 * Test seam: inject a seeded/failing provider (pass `null` to restore the
 * default). Test-only — production code never calls this.
 */
export function setProfileServiceForTesting(service: ProfileService | null): void {
  serviceInstance = service;
}
