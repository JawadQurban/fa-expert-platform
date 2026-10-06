import type { Result } from '@/types';
import { isModuleLive } from '../../app/config/expertHubConfig';
import { createExpertHubApiClient } from '../../shared/services/apiClient';
import type { ExpertHubApiClient, ExpertHubApiError } from '../../shared/services/apiClient';
import { createMockAgreementProvider } from './mockAgreementProvider';
import type {
  AgreementDetailDto,
  FormSigningSequenceInput,
  PrepareAgreementInput,
  SigningDecisionInput,
  UploadedAgreementDocumentDto,
} from './agreement.types';

/**
 * Expert Hub agreement service — EH-INT-06a (CAP-03, journey J-10). Two
 * providers implement the same versioned contract; swapping mock → real API is
 * configuration, not a UI change.
 *
 * Every mutation returns the **whole refreshed detail**, because one decision
 * can change several things at once: advance the sequence, attach a signature,
 * complete the sequence, and — only when both of those hold — send the agreement
 * to the applicant (J-10/F3/AC-5). Only the server knows which happened.
 */

export const AGREEMENT_API_VERSION = 'v1';

export interface AgreementService {
  getAgreementDetail(applicationId: string): Promise<Result<AgreementDetailDto, ExpertHubApiError>>;
  /** `P-333` — stores the trainer's agreement file (PDF/DOC/DOCX, 1 MB, J-01's rule). */
  uploadAgreementDocument(
    file: File
  ): Promise<Result<UploadedAgreementDocumentDto, ExpertHubApiError>>;
  /** F1 — the creator saves the editable fields; the server merges the rest. */
  prepareAgreement(
    applicationId: string,
    input: PrepareAgreementInput
  ): Promise<Result<AgreementDetailDto, ExpertHubApiError>>;
  /** F2 — form the internal signing sequence (optionally saving a template). */
  formSigningSequence(
    applicationId: string,
    input: FormSigningSequenceInput
  ): Promise<Result<AgreementDetailDto, ExpertHubApiError>>;
  /** F3/F4 — approve, e-sign and approve, or request a modification. */
  submitSigningDecision(
    applicationId: string,
    input: SigningDecisionInput
  ): Promise<Result<AgreementDetailDto, ExpertHubApiError>>;
  /** F4/AC-2+AC-3 — creator re-submits; the sequence resumes from the requester. */
  resubmitAgreement(applicationId: string): Promise<Result<AgreementDetailDto, ExpertHubApiError>>;
}

/** Future-API provider — already wired to the versioned endpoint shape. */
export function createHttpAgreementProvider(
  client: ExpertHubApiClient = createExpertHubApiClient()
): AgreementService {
  const base = (applicationId: string) =>
    `${AGREEMENT_API_VERSION}/internal/applications/${encodeURIComponent(applicationId)}/agreement`;

  return {
    getAgreementDetail(applicationId) {
      return client.get<AgreementDetailDto>(base(applicationId));
    },
    uploadAgreementDocument(file) {
      const payload = new FormData();
      payload.append('purpose', 'agreement-document');
      payload.append('file', file);
      return client.post<UploadedAgreementDocumentDto>(
        `${AGREEMENT_API_VERSION}/internal/attachments`,
        payload
      );
    },
    prepareAgreement(applicationId, input) {
      return client.post<AgreementDetailDto>(`${base(applicationId)}/preparation`, input);
    },
    formSigningSequence(applicationId, input) {
      return client.post<AgreementDetailDto>(`${base(applicationId)}/signing-sequence`, input);
    },
    submitSigningDecision(applicationId, input) {
      return client.post<AgreementDetailDto>(`${base(applicationId)}/decisions`, input);
    },
    resubmitAgreement(applicationId) {
      return client.post<AgreementDetailDto>(`${base(applicationId)}/resubmit`);
    },
  };
}

function createDefaultService(): AgreementService {
  return isModuleLive('agreements') ? createHttpAgreementProvider() : createMockAgreementProvider();
}

let serviceInstance: AgreementService | null = null;

export function getAgreementService(): AgreementService {
  serviceInstance ??= createDefaultService();
  return serviceInstance;
}

/** Test seam: inject a seeded/failing provider (`null` restores the default). */
export function setAgreementServiceForTesting(service: AgreementService | null): void {
  serviceInstance = service;
}
