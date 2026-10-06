import type {
  ApplicationPresentationStatus,
  ApplicationService,
  ApplicationStatus,
} from '../applications/application.types';

/**
 * Internal / staff contracts — EH-INT-01 (Internal Dashboard, CAP-09) and
 * EH-INT-02 (Application Inbox, CAP-01). Consumed **only** through
 * `internalService` (the versioned mock today, the Expert Hub API later); no
 * direct FAST/MTM/SSO calls.
 *
 * ⚠️ Dashboard metrics are **derived operational counts** over the application
 * pipeline — presentation groupings, not the (still-undefined) management KPI set
 * (`DM-GAP-09`/`G13`) or charting (`G9`). Same "derived, not invented" precedent
 * as the EH-TP-02 summary cards; scoped strictly to what the data supports.
 */

/** One row of the staff application inbox (all applicants, role-scoped). */
export interface InboxApplicationDto {
  readonly id: string;
  readonly reference: string;
  /** Applicant display name — the staff view adds identity the trainer list omits. */
  readonly applicantName: string;
  readonly services: readonly ApplicationService[];
  readonly status: ApplicationPresentationStatus;
  readonly submittedAt: string;
  readonly updatedAt: string;
}

export interface InboxFilters {
  readonly search: string;
  readonly status: ApplicationStatus | 'all';
}

export const DEFAULT_INBOX_FILTERS: InboxFilters = { search: '', status: 'all' };

export function hasActiveInboxFilters(filters: InboxFilters): boolean {
  return filters.search.trim() !== '' || filters.status !== 'all';
}

export interface InboxQuery {
  readonly page: number;
  readonly pageSize: number;
  readonly search?: string;
  readonly status?: ApplicationStatus | 'all';
}

export interface InboxListDto {
  readonly items: readonly InboxApplicationDto[];
  readonly totalCount: number;
  readonly page: number;
  readonly pageSize: number;
  readonly pageCount: number;
  readonly totalOpen: number;
}

/**
 * Dashboard metric tiles — the four pipeline groupings (P-22) plus «مواد
 * بانتظار الاعتماد», the third tile `F-0902` names by name (BE-12, CAP-09).
 *
 * The set is closed here and seeded in `METRIC_DEFINITION` server-side: a
 * dashboard is a placement of these, so a definition cannot introduce a tile
 * this app has no label or icon for.
 */
export type DashboardMetricId =
  | 'awaiting-screening'
  | 'in-screening'
  | 'interviews'
  | 'awaiting-decision'
  | 'materials-awaiting-approval';

/**
 * Where a tile drills. Most open the application inbox filtered by a status;
 * the material tile opens the submission queue, which **has no application
 * status** — so the target is a union rather than a bare status field, and a
 * tile that does not belong to the inbox cannot claim a filter it has no
 * meaning for.
 */
export type DashboardMetricTarget =
  | { readonly queue: 'applications'; readonly status: ApplicationStatus }
  | { readonly queue: 'submissions'; readonly status?: null };

export interface DashboardMetricDto {
  readonly id: DashboardMetricId;
  readonly value: number;
  readonly target: DashboardMetricTarget;
}

/**
 * How a stage is performing against the deadline the BRD set for it.
 *
 * ⚠️ **Three of these fields are nullable and none of the nulls mean zero.**
 * `targetDays` is null where the BRD states no duration (`DM-GAP-10`), and
 * `actualDays` is null where the platform records only one end of the stage.
 * A dashboard that renders either as `0` tells somebody the stage is instant.
 */
export interface DashboardSlaDto {
  /** The matrix row this measures — every figure names its source. */
  readonly slaId: string;
  readonly nameAr: string;
  readonly nameEn: string;
  readonly targetDays: number | null;
  /** `fixed` or `undefined`, straight from the matrix. */
  readonly targetStatus: string;
  /** The mean elapsed time, or null where it cannot be measured. */
  readonly actualDays: number | null;
  /** How many are past their deadline right now. */
  readonly breaches: number;
  /** How many finished items the mean is drawn from. */
  readonly measured: number;
}

/** One bar: how many applications sit at a stage, and what share that is. */
export interface DashboardDistributionDto {
  readonly status: string;
  readonly count: number;
  readonly percent: number;
}

export interface DashboardDto {
  readonly metrics: readonly DashboardMetricDto[];
  /** A short preview of the newest submissions (drives the dashboard queue peek). */
  readonly recent: readonly InboxApplicationDto[];
  readonly totalOpen: number;
  /**
   * How many more applications arrived this week than last — a rolling seven
   * days against the seven before. `null` when there is no earlier week to
   * compare against, which is not the same as no change.
   */
  readonly submissionDelta: number | null;
  readonly distribution: readonly DashboardDistributionDto[];
  readonly sla: readonly DashboardSlaDto[];
}
