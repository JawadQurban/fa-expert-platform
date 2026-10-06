/**
 * Expert Hub application-tracking contracts (`EH-TP-02` My Applications —
 * CAP-01/04, flow J1 tracking portion). **New Expert Hub types** — deliberately
 * not the Hackathon `HackathonApplication` shape (`05` EH-TP-02 implementation
 * notes: "model after Hackathon ApplicationsTable but with new Expert Hub
 * types").
 *
 * These DTOs mirror the future Expert Hub ASP.NET Core API (`CAP-API-01`
 * list-my-applications): the React app talks **only** to that API — never to
 * FAST / MTM / ERP / SSO directly (`02C` §5). The page consumes them through
 * `applicationsService.ts`, so swapping the mock provider for the real HTTP
 * provider changes no UI logic.
 */

/**
 * The trainer-visible aggregated presentation vocabulary — the locked 11-value
 * set (`DECISIONS.md` P-05, `04` EH-TP-02 §5). Internal technical states and
 * FAST-sync state are **never** part of this type and never shown on EH-TP-02.
 */
export const APPLICATION_STATUSES = [
  'draft',
  'submitted',
  'under-review',
  'interview-scheduled',
  'interview-completed',
  'approval-in-progress',
  'approved',
  'agreement-pending',
  'active',
  'rejected',
  'closed',
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

/**
 * What a list row can display: the 11 business statuses plus the neutral
 * `updating` presentation state for a row whose live aggregation is momentarily
 * incomplete (`04` EH-TP-02 §11 Partial — "never a wrong status").
 */
export type ApplicationPresentationStatus = ApplicationStatus | 'updating';

/** The five service types (BRD §6) an application can request. */
export const APPLICATION_SERVICES = [
  'trainer',
  'consultant',
  'content-developer',
  'question-writer',
  'speaker',
] as const;

export type ApplicationService = (typeof APPLICATION_SERVICES)[number];

/** One row of the trainer's application list (`CAP-API-01` item). */
export interface ApplicationSummaryDto {
  readonly id: string;
  /** Issued only at submission (`BR-0107`) — `null` while the item is a draft. */
  readonly reference: string | null;
  /** One or more requested services per application (BRD §6). */
  readonly services: readonly ApplicationService[];
  /** Aggregated, trainer-visible presentation status only (`BR-0108`, P-05). */
  readonly status: ApplicationPresentationStatus;
  readonly createdAt: string;
  /** `null` while draft (`BR-0107`). */
  readonly submittedAt: string | null;
  readonly updatedAt: string;
}

/** The Filter-Bar (P-11) state the page holds — the UI face of the query below. */
export interface ApplicationsFilters {
  readonly search: string;
  readonly status: ApplicationStatus | 'all';
  readonly service: ApplicationService | 'all';
}

export const DEFAULT_APPLICATIONS_FILTERS: ApplicationsFilters = {
  search: '',
  status: 'all',
  service: 'all',
};

export function hasActiveFilters(filters: ApplicationsFilters): boolean {
  return filters.search.trim() !== '' || filters.status !== 'all' || filters.service !== 'all';
}

/** Server-side list query (paging + the documented Filter-Bar dimensions). */
export interface MyApplicationsQuery {
  /** 1-based page index. */
  readonly page: number;
  readonly pageSize: number;
  /** Free-text search over the reference number (P-11 / §0.12). */
  readonly search?: string;
  readonly status?: ApplicationStatus | 'all';
  readonly service?: ApplicationService | 'all';
}

/**
 * `CAP-API-01` response: one page of the trainer's applications plus the
 * page-level flags the UI needs (`BR-0101` one-active-application) and the
 * unfiltered per-status counts that drive the summary cards.
 */
export interface MyApplicationsListDto {
  readonly items: readonly ApplicationSummaryDto[];
  /** Count after search/filters (drives pagination). */
  readonly totalCount: number;
  readonly page: number;
  readonly pageSize: number;
  readonly pageCount: number;
  /** `BR-0101`: false while an un-decided application exists. */
  readonly canCreateNew: boolean;
  /** The blocking un-decided application, so the UI can link to it. */
  readonly activeApplicationId: string | null;
  /** Unfiltered total of all my applications (summary cards). */
  readonly totalApplications: number;
  /** Unfiltered counts per business status (summary cards). A row whose
   *  aggregation is momentarily `updating` has no business status yet, so it
   *  counts only toward `totalApplications`. */
  readonly statusCounts: Readonly<Record<ApplicationStatus, number>>;
}
