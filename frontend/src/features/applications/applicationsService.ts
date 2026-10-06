import type { Result } from '@/types';
import { isModuleLive } from '../../app/config/expertHubConfig';
import { createExpertHubApiClient } from '../../shared/services/apiClient';
import type { ExpertHubApiClient, ExpertHubApiError } from '../../shared/services/apiClient';
import type { MyApplicationsListDto, MyApplicationsQuery } from './application.types';
import type { BankDataFields } from '../profile/profile.types';
import type {
  ApplicationDraftDto,
  ApplicationFormSchemaDto,
  DraftAttachmentDto,
  SaveDraftInput,
  StartOrResumeDraftDto,
  SubmitApplicationDto,
} from './applicationForm.types';
import type {
  ApplicantAgreementDecisionInput,
  ApplicationDetailDto,
  RequestRescheduleInput,
} from './applicationDetail.types';
import type {
  AddServiceContextDto,
  AddServiceRequestDto,
  AddServiceRequestInput,
} from './addService.types';
import { createMockApplicationsProvider } from './mockApplicationsProvider';

/**
 * Expert Hub applications service (`CAP-API-01` list-my-applications) — the
 * **only** data source `EH-TP-02` consumes. Two providers implement the same
 * versioned contract:
 *
 * - **HTTP provider** — the future Expert Hub ASP.NET Core API, reached through
 *   the shared `apiClient` (which itself never talks to FAST / MTM / ERP / SSO —
 *   `02C` §5). Selected automatically once `VITE_EXPERT_HUB_API_BASE_URL` is
 *   configured.
 * - **Mock provider** — the versioned in-memory stand-in used until then.
 *
 * Swapping mock → real API is therefore configuration, not a UI change.
 */

/** API version prefix baked into every applications endpoint. */
export const APPLICATIONS_API_VERSION = 'v1';

export interface ApplicationsService {
  listMyApplications(
    query: MyApplicationsQuery
  ): Promise<Result<MyApplicationsListDto, ExpertHubApiError>>;
  /**
   * EH-TP-05: the configurable form schema (`BR-0103`) — the published
   * version, or the named `version` a draft was started on.
   */
  getApplicationFormSchema(
    version?: string
  ): Promise<Result<ApplicationFormSchemaDto, ExpertHubApiError>>;
  /**
   * What the Academy already knows about the signed-in person, keyed by field
   * code (owner ruling, 2026-09-09).
   *
   * ⚠️ Suggestions, never answers. Nothing here is submitted, and a saved
   * draft always wins over it — see the seeding in `NewApplicationPage`.
   */
  getApplicationPrefill(): Promise<Result<Record<string, string>, ExpertHubApiError>>;
  /** EH-TP-05: resume the existing draft, start a fresh one, or report the `BR-0101` block. */
  startOrResumeDraft(): Promise<Result<StartOrResumeDraftDto, ExpertHubApiError>>;
  /** EH-TP-05: explicit draft save — never issues a reference (`BR-0107`). */
  saveDraft(input: SaveDraftInput): Promise<Result<ApplicationDraftDto, ExpertHubApiError>>;
  /**
   * EH-TP-05: upload one attachment for a rule (`BR-0106` re-validated
   * server-side). `entryId` names the repeatable entry the file belongs to for
   * a `perEntryOf` rule; omitted for an application-level attachment.
   */
  uploadAttachment(
    ruleId: string,
    file: File,
    entryId?: string
  ): Promise<Result<DraftAttachmentDto, ExpertHubApiError>>;
  removeAttachment(attachmentId: string): Promise<Result<null, ExpertHubApiError>>;
  /** EH-TP-05: submit — completeness enforced (`BR-0105`), reference issued here only (`BR-0107`). */
  submitApplication(
    input: SaveDraftInput
  ): Promise<Result<SubmitApplicationDto, ExpertHubApiError>>;
  /** EH-TP-03: one owned application in full (404 for unknown/foreign id → NotFound). */
  getApplication(id: string): Promise<Result<ApplicationDetailDto, ExpertHubApiError>>;
  /** EH-TP-03 / **J-06/F1**: confirm an interview slot (`BR-0206`) → Interview Scheduled. */
  selectInterviewSlot(
    id: string,
    slotId: string
  ): Promise<Result<ApplicationDetailDto, ExpertHubApiError>>;
  /**
   * EH-TP-03 / **J-06/F4**: ask for a different time — either because no
   * proposed slot suits (AC-1) or to change an already-confirmed one (AC-2).
   * The server proposes new slots and the F1 flow repeats (AC-4), keeping the
   * same interview ticket number (AC-6).
   */
  requestInterviewReschedule(
    id: string,
    input: RequestRescheduleInput
  ): Promise<Result<ApplicationDetailDto, ExpertHubApiError>>;
  /**
   * EH-TP-03 / **J-11/F1**: the applicant's decision on the fully
   * internally-signed agreement — e-sign (→ Approved, FAST sync queued
   * separately), reject (→ permanently closed), or request a modification
   * (→ returned to the J-10 creator). One endpoint, because the three are
   * mutually exclusive answers to the same question.
   */
  decideOnAgreement(
    id: string,
    input: ApplicantAgreementDecisionInput
  ): Promise<Result<ApplicationDetailDto, ExpertHubApiError>>;
  /**
   * `J-09/F6` — the applicant supplies their bank data. Reachable from the
   * application because the profile page does not exist yet at this stage
   * (`AC-2` says "their profile"; before accreditation there is none).
   * Returns the refreshed application so the required action moves on.
   */
  saveBankData(
    id: string,
    fields: BankDataFields
  ): Promise<Result<ApplicationDetailDto, ExpertHubApiError>>;
  /** EH-TP-06: read current approved scope + eligibility for an add-service request. */
  getAddServiceContext(id: string): Promise<Result<AddServiceContextDto, ExpertHubApiError>>;
  /** EH-TP-06: submit an add-service request (`BR-0110`/`BR-0112`) → admin decision path. */
  submitAddServiceRequest(
    id: string,
    input: AddServiceRequestInput
  ): Promise<Result<AddServiceRequestDto, ExpertHubApiError>>;
}

/** Future-API provider — already wired to the versioned endpoint shape. */
export function createHttpApplicationsProvider(
  client: ExpertHubApiClient = createExpertHubApiClient()
): ApplicationsService {
  return {
    listMyApplications(query) {
      const params = new URLSearchParams({
        page: String(query.page),
        pageSize: String(query.pageSize),
      });
      if (query.search != null && query.search.trim() !== '') {
        params.set('search', query.search.trim());
      }
      if (query.status != null && query.status !== 'all') {
        params.set('status', query.status);
      }
      if (query.service != null && query.service !== 'all') {
        params.set('service', query.service);
      }
      return client.get<MyApplicationsListDto>(
        `${APPLICATIONS_API_VERSION}/me/applications?${params.toString()}`
      );
    },
    getApplicationPrefill() {
      // Authenticated and own-scope: the schema route is anonymous by design
      // (`J-01` §3B), so personal data cannot travel on it.
      return client.get<Record<string, string>>(
        `${APPLICATIONS_API_VERSION}/me/applications/prefill`
      );
    },
    getApplicationFormSchema(version) {
      // TODO(G5/DM-GAP-01): this endpoint serves the centrally-configured
      // field-mandatory map (`BR-0103`) once the business approves it.
      const query = version == null ? '' : `?version=${encodeURIComponent(version)}`;
      return client.get<ApplicationFormSchemaDto>(
        `${APPLICATIONS_API_VERSION}/applications/schema${query}`
      );
    },
    startOrResumeDraft() {
      return client.post<StartOrResumeDraftDto>(
        `${APPLICATIONS_API_VERSION}/me/applications/draft/start`
      );
    },
    saveDraft(input) {
      return client.post<ApplicationDraftDto>(
        `${APPLICATIONS_API_VERSION}/me/applications/draft`,
        input
      );
    },
    uploadAttachment(ruleId, file, entryId) {
      // The rule is re-checked server-side against the same row the form
      // rendered from, so this sends the file, the rule, and — for a
      // per-entry rule — the entry that owns it.
      const payload = new FormData();
      payload.append('ruleId', ruleId);
      payload.append('file', file);
      if (entryId != null) {
        payload.append('entryId', entryId);
      }
      return client.post<DraftAttachmentDto>(
        `${APPLICATIONS_API_VERSION}/me/applications/draft/attachments`,
        payload
      );
    },
    removeAttachment(attachmentId) {
      return client.post<null>(
        `${APPLICATIONS_API_VERSION}/me/applications/draft/attachments/remove`,
        { attachmentId }
      );
    },
    submitApplication(input) {
      return client.post<SubmitApplicationDto>(
        `${APPLICATIONS_API_VERSION}/me/applications/submit`,
        input
      );
    },
    getApplication(id) {
      return client.get<ApplicationDetailDto>(
        `${APPLICATIONS_API_VERSION}/me/applications/${encodeURIComponent(id)}`
      );
    },
    selectInterviewSlot(id, slotId) {
      return client.post<ApplicationDetailDto>(
        `${APPLICATIONS_API_VERSION}/me/applications/${encodeURIComponent(id)}/interview-slot`,
        { slotId }
      );
    },
    requestInterviewReschedule(id, input) {
      return client.post<ApplicationDetailDto>(
        `${APPLICATIONS_API_VERSION}/me/applications/${encodeURIComponent(id)}/interview-reschedule`,
        input
      );
    },
    decideOnAgreement(id, input) {
      // The decision itself is a plain JSON call — no upload, because J-11/F1/AC-3
      // captures the signature in-platform (P-J10). What remains blocked is the
      // FINAL SIGNED PDF the server generates afterwards (F2/AC-1): its storage
      // location is `G26`. That is a server-side concern, so the frontend seam is
      // just `agreement.documentUrl`, which stays `null` until `G26` closes.
      return client.post<ApplicationDetailDto>(
        `${APPLICATIONS_API_VERSION}/me/applications/${encodeURIComponent(id)}/agreement-decision`,
        input
      );
    },
    async saveBankData(id, fields) {
      const saved = await client.post<unknown>(
        `${APPLICATIONS_API_VERSION}/me/profile/bank-data`,
        fields
      );
      if (!saved.ok) {
        return saved;
      }
      // The save answers with the bank-data state, not the application — so
      // the application is re-read, which is also what moves the required
      // action on from "provide bank data" to whatever is next.
      return client.get<ApplicationDetailDto>(
        `${APPLICATIONS_API_VERSION}/me/applications/${encodeURIComponent(id)}`
      );
    },
    getAddServiceContext(id) {
      return client.get<AddServiceContextDto>(
        `${APPLICATIONS_API_VERSION}/me/applications/${encodeURIComponent(id)}/services/context`
      );
    },
    submitAddServiceRequest(id, input) {
      return client.post<AddServiceRequestDto>(
        `${APPLICATIONS_API_VERSION}/me/applications/${encodeURIComponent(id)}/services`,
        input
      );
    },
  };
}

function createDefaultService(): ApplicationsService {
  // Real backend configured → HTTP provider; otherwise the versioned mock.
  return isModuleLive('applications')
    ? createHttpApplicationsProvider()
    : createMockApplicationsProvider();
}

let serviceInstance: ApplicationsService | null = null;

/** The application-wide service instance the page consumes. */
export function getApplicationsService(): ApplicationsService {
  serviceInstance ??= createDefaultService();
  return serviceInstance;
}

/**
 * Test seam: inject a seeded/failing provider (pass `null` to restore the
 * default). Test-only — production code never calls this.
 */
export function setApplicationsServiceForTesting(service: ApplicationsService | null): void {
  serviceInstance = service;
}
