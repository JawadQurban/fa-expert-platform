import type { Result } from '@/types';
import { isModuleLive } from '../../app/config/expertHubConfig';
import { createExpertHubApiClient } from '../../shared/services/apiClient';
import type { ExpertHubApiClient, ExpertHubApiError } from '../../shared/services/apiClient';
import { createMockAssignmentProvider } from './mockAssignmentProvider';
import type {
  AssignmentRequestDetailDto,
  AssignmentRequestSummaryDto,
  AssignmentServiceType,
} from './assignment.types';
import type { CreateCentreRequestInput } from './centreRequestForm.types';
import type {
  CandidatePoolDto,
  MatchCandidateDto,
  MatchingRunDto,
  MatchingViewerDto,
  PoolDecisionInput,
  SendPoolInput,
} from './matching.types';

/**
 * Expert Hub assignment-request service — EH-INT-09 (CAP-05).
 *
 * ⚠️ 2026-08-30 — request capture follows the owner-supplied centre form
 * (`DM-GAP-06`, `centreRequestForm.types.ts`), which replaced J-16's FAST
 * plan-selection capture. **The frontend still never calls FAST** (`02C` §5),
 * and nothing on this surface can create a programme or plan there (F2/AC-3).
 */

export const ASSIGNMENTS_API_VERSION = 'v1';

/** One dropdown row for the form's served lookups (centre / employee / nominee). */
export interface RequestLookupOptionDto {
  readonly value: string;
  readonly labelAr: string;
  readonly labelEn: string;
}

/** A stored upload, as `POST internal/attachments` answers it. */
export interface UploadedAttachmentDto {
  readonly attachmentId: string;
  readonly fileName: string;
  readonly sizeBytes: number;
  readonly downloadUrl: string;
  /**
   * ⚠️ `not-scanned` until the antivirus pass exists (`G27`). Carried, never
   * rendered as a verdict: no page may call an unchecked file safe.
   */
  readonly scanStatus: string | null;
}

export interface AssignmentService {
  listRequests(): Promise<Result<readonly AssignmentRequestSummaryDto[], ExpertHubApiError>>;
  getRequest(requestId: string): Promise<Result<AssignmentRequestDetailDto, ExpertHubApiError>>;
  /** «اسم المركز» — the centres list (reference data, served like P-144's). */
  listCentres(): Promise<Result<readonly RequestLookupOptionDto[], ExpertHubApiError>>;
  /** «اسم المسؤول» — the entering-employee list the workbook names. */
  listResponsibleEmployees(): Promise<Result<readonly RequestLookupOptionDto[], ExpertHubApiError>>;
  /** «إضافة مدرب/استشاري محدد» — optional nominee choices (trainer directory). */
  /**
   * J-16/F5/AC-1 — the people currently approved for `service` (accredited for
   * it, with an active or idle file); every accredited trainer when omitted.
   */
  listNomineeOptions(
    service?: AssignmentServiceType
  ): Promise<Result<readonly RequestLookupOptionDto[], ExpertHubApiError>>;
  /**
   * «النشرة التعريفية» — store the brochure FIRST; the request then carries the
   * returned `attachmentId` (J-01's document rule, 422 on format/size).
   */
  uploadBrochure(file: File): Promise<Result<UploadedAttachmentDto, ExpertHubApiError>>;
  /** Submit the centre form; the server issues the reference and enters matching. */
  createRequest(
    input: CreateCentreRequestInput
  ): Promise<Result<AssignmentRequestSummaryDto, ExpertHubApiError>>;

  /* ── J-17 — matching and nomination ──────────────────────────────────── */

  /** The pool and the viewer's rights for one request. */
  getMatching(
    requestId: string
  ): Promise<
    Result<
      { readonly pool: CandidatePoolDto; readonly viewer: MatchingViewerDto },
      ExpertHubApiError
    >
  >;
  /**
   * **J-17/F1** — run the engine. Ranking is entirely the server's: the
   * exclusionary criteria depend on the trainer's confirmed engagements and file
   * status, and the weights are unapproved configuration (`DM-GAP-05`). The page
   * ranks nothing; it renders a ranked list.
   *
   * **F1/AC-4** — one cycle, one pool, whatever the headcount.
   */
  runMatching(requestId: string): Promise<Result<MatchingRunDto, ExpertHubApiError>>;
  /**
   * **J-17/F2/AC-1** — the manual path. Searching the trainer base directly,
   * still returning candidates in the same shape, so F3's exclusions and pool
   * rules apply identically to whatever staff pick.
   */
  searchCandidates(
    requestId: string,
    query: string
  ): Promise<Result<readonly MatchCandidateDto[], ExpertHubApiError>>;
  /**
   * **J-17/F3/AC-1** — send the pool **as one batch**. There is no
   * send-one-candidate operation, by design.
   *
   * F3/AC-3 — the schedule-conflict exclusion is re-checked here, "regardless of
   * which matching path was used", so a manually-picked conflicted trainer is
   * refused rather than presented.
   */
  sendPool(
    requestId: string,
    input: SendPoolInput
  ): Promise<Result<CandidatePoolDto, ExpertHubApiError>>;
  /** **J-17/F4** — the requesting party's per-candidate decision and ranking. */
  decidePool(
    requestId: string,
    input: PoolDecisionInput
  ): Promise<Result<CandidatePoolDto, ExpertHubApiError>>;
}

/** Future-API provider — already wired to the versioned endpoint shape. */
export function createHttpAssignmentProvider(
  client: ExpertHubApiClient = createExpertHubApiClient()
): AssignmentService {
  const base = `${ASSIGNMENTS_API_VERSION}/internal/assignment-requests`;
  return {
    listRequests() {
      return client.get<readonly AssignmentRequestSummaryDto[]>(base);
    },
    getRequest(requestId) {
      return client.get<AssignmentRequestDetailDto>(`${base}/${encodeURIComponent(requestId)}`);
    },
    listCentres() {
      // The approved OPERATIONAL centres (Assignment Matrix). Not
      // `internal/centres`, which is access scope and serves another shape.
      return client.get<readonly RequestLookupOptionDto[]>(`${base}/lookups/centres`);
    },
    listResponsibleEmployees() {
      return client.get<readonly RequestLookupOptionDto[]>(`${base}/lookups/responsible-employees`);
    },
    listNomineeOptions(service) {
      const query = service == null ? '' : `?service=${encodeURIComponent(service)}`;
      return client.get<readonly RequestLookupOptionDto[]>(`${base}/lookups/nominees${query}`);
    },
    uploadBrochure(file) {
      // The application form's multipart shape: the file and what it is for.
      const payload = new FormData();
      payload.append('purpose', 'assignment-brochure');
      payload.append('file', file);
      return client.post<UploadedAttachmentDto>(
        `${ASSIGNMENTS_API_VERSION}/internal/attachments`,
        payload
      );
    },
    createRequest(input) {
      return client.post<AssignmentRequestSummaryDto>(base, input);
    },
    getMatching(requestId) {
      return client.get<{ pool: CandidatePoolDto; viewer: MatchingViewerDto }>(
        `${base}/${encodeURIComponent(requestId)}/matching`
      );
    },
    runMatching(requestId) {
      return client.post<MatchingRunDto>(`${base}/${encodeURIComponent(requestId)}/matching/run`);
    },
    searchCandidates(requestId, query) {
      const suffix = query.trim() === '' ? '' : `?q=${encodeURIComponent(query.trim())}`;
      return client.get<readonly MatchCandidateDto[]>(
        `${base}/${encodeURIComponent(requestId)}/matching/candidates${suffix}`
      );
    },
    sendPool(requestId, input) {
      return client.post<CandidatePoolDto>(`${base}/${encodeURIComponent(requestId)}/pool`, input);
    },
    decidePool(requestId, input) {
      return client.post<CandidatePoolDto>(
        `${base}/${encodeURIComponent(requestId)}/pool/decision`,
        input
      );
    },
  };
}

function createDefaultService(): AssignmentService {
  return isModuleLive('assignments')
    ? createHttpAssignmentProvider()
    : createMockAssignmentProvider();
}

let serviceInstance: AssignmentService | null = null;

export function getAssignmentService(): AssignmentService {
  serviceInstance ??= createDefaultService();
  return serviceInstance;
}

/** Test seam: inject a seeded/failing provider (`null` restores the default). */
export function setAssignmentServiceForTesting(service: AssignmentService | null): void {
  serviceInstance = service;
}
