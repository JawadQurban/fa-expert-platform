import { EXPERT_HUB_BASE_PATH } from '../config/expertHubConfig';

/**
 * Expert Hub route path registry — the single source of truth for every Expert
 * Hub link, guard redirect, and route registration. **Owned entirely by the
 * Expert Hub application** (it does not reuse the Hackathon `@app/router/paths`,
 * and Hackathon does not reference these).
 *
 * All absolute paths derive from `EXPERT_HUB_BASE_PATH` (`config/expertHubConfig.ts`)
 * so the whole product can be re-based in one place on extraction. The
 * `segments` map holds the base-relative strings used to register the router's
 * child `RouteObject`s.
 */

const base = EXPERT_HUB_BASE_PATH;

/** Join the base path with a relative segment, collapsing duplicate slashes so
 *  it works whether `base` is `/expert-hub` (co-located) or `''` (extracted). */
function abs(segment = ''): string {
  const joined = `${base}/${segment}`.replace(/\/{2,}/g, '/').replace(/\/$/, '');
  return joined === '' ? '/' : joined;
}

/** Base-relative segments for `RouteObject.path` registration (see `routes.tsx`). */
export const expertHubRouteSegments = {
  login: 'login',
  authCallback: 'auth/callback',
  activate: 'activate/:token',
  unauthorized: 'unauthorized',
  home: 'home',
  applications: 'applications',
  applicationsNew: 'applications/new',
  applicationDetail: 'applications/:applicationId',
  applicationAddService: 'applications/:applicationId/add-service',
  directory: 'directory',
  directoryProfile: 'directory/:trainerId',
  profile: 'profile',
  engagements: 'engagements',
  engagementDetail: 'engagements/:engagementId',
  submissions: 'submissions',
  entitlements: 'entitlements',
  internal: 'internal',
  internalApplications: 'internal/applications',
  internalApplicationDetail: 'internal/applications/:id',
  internalApplicationInterview: 'internal/applications/:id/interview',
  internalApplicationCommittee: 'internal/applications/:id/committee',
  internalApplicationAgreement: 'internal/applications/:id/agreement',
  internalServiceRequests: 'internal/service-requests',
  internalServiceRequest: 'internal/service-requests/:requestId',
  internalAssignments: 'internal/assignments',
  internalAssignmentNew: 'internal/assignments/new',
  internalAssignmentMatching: 'internal/assignments/:requestId',
  internalSlotReRouting: 'internal/assignments/:requestId/slots/:slotNumber',
  internalEntitlements: 'internal/entitlements',
  internalSubmissions: 'internal/submissions',
  internalSubmission: 'internal/submissions/:submissionId',
  internalTrainers: 'internal/trainers',
  internalTrainerBios: 'internal/trainers/bios',
  internalTrainer: 'internal/trainers/:trainerId',
  internalAgreements: 'internal/agreements',
  internalAgreementTemplate: 'internal/agreements/template',
  internalAgreement: 'internal/agreements/:agreementId',
  internalAccessPermissions: 'internal/access/permissions',
  internalAccessUsers: 'internal/access/users',
  internalNotificationMatrix: 'internal/notifications/matrix',
  internalNotificationTemplates: 'internal/notifications/templates',
  internalNotificationLog: 'internal/notifications/log',
  internalSlaConsole: 'internal/sla',
  notFound: '*',
} as const;

/** Absolute Expert Hub paths (for links, `navigate`, and guard redirects). */
export const expertHubPaths = {
  base,
  landing: abs(''),
  login: abs('login'),
  authCallback: abs('auth/callback'),
  /** J-02/F4 — the nominee's activation link. **Public**: they have no account
   *  yet, which is the point. The token is issued with the invitation (F3). */
  activate: (token = ':token') => abs(`activate/${token}`),
  unauthorized: abs('unauthorized'),
  /** EH-TP-01 Portal Home — the role-resolved entry (`ResolveHomeByRole`):
   *  trainers render Portal Home here; staff-only sessions are redirected to
   *  the internal dashboard. The default post-login landing. */
  home: abs('home'),
  applications: abs('applications'),
  applicationsNew: abs('applications/new'),
  applicationDetail: (id = ':applicationId') => abs(`applications/${id}`),
  /** EH-TP-06 Add Service — request an additional service on an approved application. */
  applicationAddService: (id = ':applicationId') => abs(`applications/${id}/add-service`),
  /** EH-PUB-02 Trainer Directory (public, live) + EH-PUB-03 Public Trainer
   *  Profile (`directory/:trainerId`). */
  directory: abs('directory'),
  directoryProfile: (id = ':trainerId') => abs(`directory/${id}`),
  profile: abs('profile'),
  /** EH-TP-07 — My Engagements (J-18): the offers awaiting this trainer's
   *  answer, and the engagements they have confirmed. F3/AC-2 names the
   *  section, so it gets a route of its own rather than a tab elsewhere. */
  engagements: abs('engagements'),
  /** EH-TP-07c — engagement execution follow-up (J-21): session link or venue,
   *  live enrolment, the attendance layer, and the MTM trainee evaluations.
   *  Read-only — completion is a date, never an action. */
  engagementDetail: (id = ':engagementId') => abs(`engagements/${id}`),
  /** EH-TP-08 — Material & content submission (J-20). Both of the journey's
   *  paths live here: training material when the plan has none (F1), and
   *  service-linked content from confirmation (F4). */
  submissions: abs('submissions'),
  /** EH-TP-09 — the trainer's own entitlement record (CAP-06 / `F-0601`).
   *  Read-only: every value is consumed from ERP (`BR-0601`). */
  entitlements: abs('entitlements'),
  /** EH-INT-01 Internal Dashboard (staff) + EH-INT-02 Application Inbox. Nested
   *  under `internal/` behind the internal-role guard (the IA's same-URL,
   *  role-resolved render is a later reconciliation). */
  internal: abs('internal'),
  internalApplications: abs('internal/applications'),
  /** EH-INT-03 Screening Detail / Application Insight Page — J-05 (Screening &
   *  Initial Decision) + J-08 (Interview Exemption). The inbox "Open" action
   *  resolves here. The evaluation matrix itself remains open (`DM-GAP-02`) and
   *  reaches the page as configuration, never as hard-coded weights. */
  internalApplicationDetail: (id = ':id') => abs(`internal/applications/${id}`),
  /** EH-INT-04 Interview Evaluation & Post-Interview Decision — J-07, plus the
   *  staff half of J-06 (reschedule). The interview evaluation model itself
   *  remains open (`DM-GAP-03`) and reaches the page as configuration. */
  internalApplicationInterview: (id = ':id') => abs(`internal/applications/${id}/interview`),
  /** EH-INT-05 Approval Committee Decision — J-09 (formation, sequential
   *  approval, modification requests, and the bank-data gate into J-10). */
  internalApplicationCommittee: (id = ':id') => abs(`internal/applications/${id}/committee`),
  /** EH-INT-06a Agreement Preparation & Internal Approval — J-10 (preparation,
   *  signing-sequence formation with designated e-signer(s), and the send gate
   *  that requires both a complete sequence and an attached signature). */
  internalApplicationAgreement: (id = ':id') => abs(`internal/applications/${id}/agreement`),
  /** EH-INT-02b — Service Requests queue (J-03/F2: the decision-maker's list,
   *  searchable by trainer name and filterable by requested service + status). */
  internalServiceRequests: abs('internal/service-requests'),
  /** EH-INT-02b detail — one request beside the trainer's full approved profile
   *  (J-03/F2/AC-1), and the single administrative decision (J-03/F3). */
  internalServiceRequest: (id = ':requestId') => abs(`internal/service-requests/${id}`),
  /** EH-INT-09 — Assignment Requests (J-16). The shell J-17's matching and
   *  nomination will hang from; J-16 itself ends at submission. */
  internalAssignments: abs('internal/assignments'),
  /** EH-INT-09 — create a request: service type first, then an existing FAST
   *  plan (pull only), then the headcount (J-16/F1–F5). */
  internalAssignmentNew: abs('internal/assignments/new'),
  /** EH-INT-09 matching workspace (J-17): run the engine or search manually,
   *  build a pool of exactly 3 per slot, send it as one batch, then the
   *  requesting party decides on each candidate and ranks the approved. */
  internalAssignmentMatching: (id = ':requestId') => abs(`internal/assignments/${id}`),
  /** EH-INT-09d — slot re-routing (J-19). Only an **exhausted** slot has a
   *  cycle here: F2/AC-2 forbids reopening a confirmed one, so the server
   *  answers 404 for any other slot and the page says why. */
  internalSlotReRouting: (id = ':requestId', slot: number | string = ':slotNumber') =>
    abs(`internal/assignments/${id}/slots/${String(slot)}`),
  /** EH-INT-10 — the coordinator's material & content review queue (J-20,
   *  F2/AC-1 + F5/AC-1). Both paths share it: the review act is identical
   *  and only the destination on approval differs. */
  /** EH-INT-17 — the staff entitlement register (CAP-06 / `F-0602`): any
   *  trainer's record tied to their agreement and programmes, **including the
   *  incompletely-linked records `BR-0603` hides from the trainer**. */
  internalEntitlements: abs('internal/entitlements'),
  internalSubmissions: abs('internal/submissions'),
  /** EH-INT-10 detail — approve, or send a note opening a new upload.
   *  There is no third decision (F2/AC-3, F5/AC-3). */
  internalSubmission: (id = ':submissionId') => abs(`internal/submissions/${id}`),
  /** EH-INT-07 — Trainer Database (J-15/F1/AC-3: browse and monitor; candidate
   *  selection for an assignment is J-17, deliberately not here). */
  internalTrainers: abs('internal/trainers'),
  /** `P-331` — the short bios waiting for a trainer-management decision. */
  internalTrainerBios: abs('internal/trainers/bios'),
  /** EH-INT-08 — the unified trainer profile, complete in one screen (J-15/F1). */
  internalTrainer: (id = ':trainerId') => abs(`internal/trainers/${id}`),
  /** EH-INT-06 — Agreement Management (J-12/F1: expiry tracking across the base). */
  internalAgreements: abs('internal/agreements'),
  /** EH-INT-06 — the central agreement template (J-12/F4, System Administrator). */
  internalAgreementTemplate: abs('internal/agreements/template'),
  /** EH-INT-06 detail — one agreement's lifecycle: renew / suspend / end (J-12/F2+F3). */
  internalAgreement: (id = ':agreementId') => abs(`internal/agreements/${id}`),
  /** EH-INT-14 — the role × permission matrix (CAP-08 / `F-0801`), the
   *  System Administrator's screen. ⚠️ Its **contents** are `DM-GAP-07`, so the
   *  grid ships empty and marked unapproved rather than seeded with guesses. */
  internalAccessPermissions: abs('internal/access/permissions'),
  /** EH-INT-14 — users and the roles they hold (CAP-08 / `F-0802`). `BR-0801`
   *  grants exclusively through the six roles, so there is no per-user
   *  permission route and no service operation that could serve one. */
  internalAccessUsers: abs('internal/access/users'),
  /** EH-INT-12 — the central notification matrix (CAP-07 / `F-0702`): event →
   *  template → audience, for events raised by all twelve capabilities.
   *  ⚠️ Its **routing** is `DM-GAP-08`, so it ships unrouted and says so. */
  internalNotificationMatrix: abs('internal/notifications/matrix'),
  /** EH-INT-12 — bilingual message templates (CAP-07 / `F-0703`). `BR-0701`
   *  allows only approved bilingual templates in any system notification. */
  internalNotificationTemplates: abs('internal/notifications/templates'),
  /** EH-INT-12 — the notification log (CAP-07 / `F-0705`), read-only. */
  internalNotificationLog: abs('internal/notifications/log'),
  /** EH-INT-13 — the central deadline console (CAP-07 / `F-0704`). Not nested
   *  under `notifications/`: `BR-0705` puts every SLA here, and a deadline is
   *  not a notification even though §8.7 gives both screens to one person. */
  internalSlaConsole: abs('internal/sla'),
  /* ── Navigation carries pages, not sections ────────────────────────────
   *
   * The public header once carried `/about`, `/services` and `/faq` as "future
   * pages, not yet registered" — three of its five tabs resolving to NotFound
   * since the header was built (P-119).
   *
   * They are **not** replaced by anchors into the landing page. *About* and
   * *Services* are landing-page sections, and the landing page is one click
   * away on every screen: a header tab that scrolls you into a section of
   * another page is a second, weaker way to reach content that already has one
   * (P-123). FAQ has no content anywhere.
   *
   * So the public navigation is the two things that are pages in their own
   * right — the landing page and the directory — and nothing else. */
} as const;

/** Login URL carrying a post-login return target (return-URL handling). */
export function loginWithReturn(returnUrl: string): string {
  return `${expertHubPaths.login}?returnUrl=${encodeURIComponent(returnUrl)}`;
}

export type ExpertHubPaths = typeof expertHubPaths;
