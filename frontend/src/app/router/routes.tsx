import { lazy, Suspense } from 'react';
import type { ReactElement } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import type { RouteObject } from 'react-router-dom';
import { EXPERT_HUB_BASE_PATH } from '../config/expertHubConfig';
import { expertHubRouteSegments } from './paths';
import { ExpertHubRootLayout } from '../layouts/ExpertHubRootLayout';
import { PublicLayout } from '../layouts/PublicLayout';
import { PortalLayout } from '../layouts/PortalLayout';
import { InternalLayout } from '../layouts/InternalLayout';
import { RequireAuth, RequireRole, RequireTrainer, ResolveHomeByRole } from '../auth/guards';

/**
 * Expert Hub route table — **owned entirely by the Expert Hub application**. It
 * is registered as a top-level sibling of the Hackathon route tree in the
 * shared bootstrap; it is never nested under the Hackathon `RootLayout`, and it
 * uses its own root/public/portal/internal layouts and its own auth guards.
 *
 * Pages are lazy-loaded for route-level code splitting (layouts and guards are
 * small and imported directly). On extraction to its own repository, the
 * standalone entry uses `createExpertHubRouter()` below — nothing else changes.
 */
const LandingPage = lazy(() => import('../../features/landing/LandingPage'));
const MyApplicationsPage = lazy(() => import('../../features/applications/MyApplicationsPage'));
const NewApplicationPage = lazy(() => import('../../features/applications/NewApplicationPage'));
const ApplicationDetailPage = lazy(
  () => import('../../features/applications/ApplicationDetailPage')
);
const AddServicePage = lazy(() => import('../../features/applications/AddServicePage'));
const TrainerDirectoryPage = lazy(() => import('../../features/directory/TrainerDirectoryPage'));
const PublicTrainerProfilePage = lazy(
  () => import('../../features/directory/PublicTrainerProfilePage')
);
const MyProfilePage = lazy(() => import('../../features/profile/MyProfilePage'));
const PortalHomePage = lazy(() => import('../../features/home/PortalHomePage'));
const MyEngagementsPage = lazy(() => import('../../features/engagements/MyEngagementsPage'));
const InternalDashboardPage = lazy(() => import('../../features/internal/InternalDashboardPage'));
const ApplicationInboxPage = lazy(() => import('../../features/internal/ApplicationInboxPage'));
const ScreeningDetailPage = lazy(() => import('../../features/screening/ScreeningDetailPage'));
const InterviewEvaluationPage = lazy(
  () => import('../../features/interviews/InterviewEvaluationPage')
);
const CommitteeDecisionPage = lazy(() => import('../../features/committee/CommitteeDecisionPage'));
const AgreementPreparationPage = lazy(
  () => import('../../features/agreements/AgreementPreparationPage')
);
const ServiceRequestsPage = lazy(
  () => import('../../features/serviceRequests/ServiceRequestsPage')
);
const ServiceRequestDetailPage = lazy(
  () => import('../../features/serviceRequests/ServiceRequestDetailPage')
);
const AssignmentRequestsPage = lazy(
  () => import('../../features/assignments/AssignmentRequestsPage')
);
const NewAssignmentRequestPage = lazy(
  () => import('../../features/assignments/NewAssignmentRequestPage')
);
const AssignmentMatchingPage = lazy(
  () => import('../../features/assignments/AssignmentMatchingPage')
);
const SlotReRoutingPage = lazy(() => import('../../features/reRouting/SlotReRoutingPage'));
const EngagementDetailPage = lazy(() => import('../../features/execution/EngagementDetailPage'));
const MySubmissionsPage = lazy(() => import('../../features/submissions/MySubmissionsPage'));
const MyEntitlementsPage = lazy(() => import('../../features/entitlements/MyEntitlementsPage'));
const InternalEntitlementsPage = lazy(
  () => import('../../features/entitlements/InternalEntitlementsPage')
);
const SubmissionQueuePage = lazy(() => import('../../features/submissions/SubmissionQueuePage'));
const SubmissionReviewPage = lazy(() => import('../../features/submissions/SubmissionReviewPage'));
const TrainerSearchPage = lazy(() => import('../../features/trainerSearch/TrainerSearchPage'));
const BioReviewPage = lazy(() => import('../../features/trainerSearch/BioReviewPage'));
const InternalTrainerProfilePage = lazy(
  () => import('../../features/trainerSearch/TrainerProfilePage')
);
const AgreementsPage = lazy(() => import('../../features/agreementLifecycle/AgreementsPage'));
const AgreementLifecycleDetailPage = lazy(
  () => import('../../features/agreementLifecycle/AgreementDetailPage')
);
const AgreementTemplatePage = lazy(
  () => import('../../features/agreementLifecycle/AgreementTemplatePage')
);
const PermissionMatrixPage = lazy(() => import('../../features/access/PermissionMatrixPage'));
const UserRoleAssignmentPage = lazy(() => import('../../features/access/UserRoleAssignmentPage'));
const NotificationMatrixPage = lazy(
  () => import('../../features/notifications/NotificationMatrixPage')
);
const NotificationTemplatesPage = lazy(
  () => import('../../features/notifications/NotificationTemplatesPage')
);
const NotificationLogPage = lazy(() => import('../../features/notifications/NotificationLogPage'));
const SlaConsolePage = lazy(() => import('../../features/notifications/SlaConsolePage'));
const ActivationPage = lazy(() => import('../../features/identity/ActivationPage'));
const LoginPage = lazy(() => import('../../features/auth/LoginPage'));
const AuthCallbackPage = lazy(() => import('../../features/auth/AuthCallbackPage'));
const UnauthorizedPage = lazy(() => import('../../features/auth/UnauthorizedPage'));
// `features/placeholders/ComingSoonPage` stays available for internal sub-routes
// that are still unbuilt (J-07 interview evaluation, J-09 committee decision, …);
// no route resolves to it today now that EH-INT-03 is a real page.
const ExpertHubNotFoundPage = lazy(() => import('../../features/system/ExpertHubNotFoundPage'));

function RouteFallback() {
  return <div role="status" aria-live="polite" style={{ padding: '1rem' }} />;
}

function withSuspense(element: ReactElement) {
  return <Suspense fallback={<RouteFallback />}>{element}</Suspense>;
}

export const expertHubRoutes: RouteObject[] = [
  {
    // `EXPERT_HUB_BASE_PATH` is `/expert-hub` today; `''` (standalone root build)
    // resolves to `/` so the root layout still has a valid top-level path.
    path: EXPERT_HUB_BASE_PATH === '' ? '/' : EXPERT_HUB_BASE_PATH,
    element: <ExpertHubRootLayout />,
    children: [
      // Public area — landing + the auth chrome pages, under the public shell.
      {
        element: <PublicLayout />,
        children: [
          { index: true, element: withSuspense(<LandingPage />) },
          // EH-PUB-02 — Trainer Directory (public, consent-gated projection).
          {
            path: expertHubRouteSegments.directory,
            element: withSuspense(<TrainerDirectoryPage />),
          },
          // EH-PUB-03 — Public Trainer Profile (hidden/not-found if not consented).
          {
            path: expertHubRouteSegments.directoryProfile,
            element: withSuspense(<PublicTrainerProfilePage />),
          },
          {
            // EH-TP-05 — New Application. **Not behind `RequireAuth`**: J-01's
            // Identity Linking layer is explicit that a guest can complete the
            // whole form, with the account auto-provisioned at submission
            // (§3B, §5). The page renders the identity gate first for anyone who
            // is not signed in, and an authenticated applicant skips it — so the
            // guard moved *into* the page, where the journey puts it, rather than
            // being dropped.
            path: expertHubRouteSegments.applicationsNew,
            element: withSuspense(<NewApplicationPage />),
          },
          {
            // J-02/F4 — nominee account activation. **Public by necessity**: an
            // application exists in this person's name and they have no account
            // yet; the link is how they get one.
            path: expertHubRouteSegments.activate,
            element: withSuspense(<ActivationPage />),
          },
          { path: expertHubRouteSegments.login, element: withSuspense(<LoginPage />) },
          {
            path: expertHubRouteSegments.authCallback,
            element: withSuspense(<AuthCallbackPage />),
          },
          {
            path: expertHubRouteSegments.unauthorized,
            element: withSuspense(<UnauthorizedPage />),
          },
          // Catch-all for unknown /expert-hub/* paths — stays inside this product.
          {
            path: expertHubRouteSegments.notFound,
            element: withSuspense(<ExpertHubNotFoundPage />),
          },
        ],
      },
      // Authenticated area — behind the Expert Hub route guards.
      {
        element: <RequireAuth />,
        children: [
          {
            element: <PortalLayout />,
            children: [
              {
                // EH-TP-01 — Portal Home, at the role-resolved entry: a
                // staff-only session is redirected to the internal dashboard.
                element: <ResolveHomeByRole />,
                children: [
                  {
                    path: expertHubRouteSegments.home,
                    element: withSuspense(<PortalHomePage />),
                  },
                ],
              },
              {
                // EH-TP-02 — My Applications (trainer render of this route).
                path: expertHubRouteSegments.applications,
                element: withSuspense(<MyApplicationsPage />),
              },
              {
                // EH-TP-06 — Add Service (request an additional service). Above
                // the `:applicationId` detail route so the more specific path wins.
                path: expertHubRouteSegments.applicationAddService,
                element: withSuspense(<AddServicePage />),
              },
              {
                // EH-TP-03 — Application Details (trainer render).
                path: expertHubRouteSegments.applicationDetail,
                element: withSuspense(<ApplicationDetailPage />),
              },
              {
                /*
                 * The areas that exist only once the Academy has accredited
                 * this person. Each is a consequence of an active agreement —
                 * a trainer file, engagements, materials, entitlements — so
                 * before one exists they have nothing to show, and offering
                 * them promises a standing the person has not been granted
                 * (owner ruling, 2026-09-08).
                 *
                 * ⚠️ Guarded here rather than only hidden from the header,
                 * because a bookmark or a typed URL never sees the header.
                 */
                element: <RequireTrainer />,
                children: [
                  {
                    // EH-TP-04 — My Profile (trainer render).
                    path: expertHubRouteSegments.profile,
                    element: withSuspense(<MyProfilePage />),
                  },
                  {
                    // EH-TP-07 — My Engagements (J-18): assignment offers
                    // awaiting this trainer's answer (F2) and their confirmed
                    // engagements (F3/AC-2). Read + respond only — sending and
                    // expiry are the system's, so no route here reaches them.
                    path: expertHubRouteSegments.engagements,
                    element: withSuspense(<MyEngagementsPage />),
                  },
                  {
                    // EH-TP-07c — one engagement, followed through execution
                    // (J-21). Registered after the collection root; the deeper
                    // path still matches first because it is more specific.
                    path: expertHubRouteSegments.engagementDetail,
                    element: withSuspense(<EngagementDetailPage />),
                  },
                  {
                    // EH-TP-08 — Material & content submission (J-20). Both
                    // paths on one page: the act is the same, and only the
                    // trigger and the destination on approval differ.
                    path: expertHubRouteSegments.submissions,
                    element: withSuspense(<MySubmissionsPage />),
                  },
                  {
                    // EH-TP-09 — the trainer's own entitlements (CAP-06 /
                    // F-0601). Read-only; BR-0603 filters hidden records
                    // server-side.
                    path: expertHubRouteSegments.entitlements,
                    element: withSuspense(<MyEntitlementsPage />),
                  },
                ],
              },
            ],
          },
          {
            element: <RequireRole requiredRole="internal" />,
            children: [
              {
                element: <InternalLayout />,
                children: [
                  {
                    // EH-INT-01 — Internal Dashboard (staff entry).
                    path: expertHubRouteSegments.internal,
                    element: withSuspense(<InternalDashboardPage />),
                  },
                  {
                    // EH-INT-02 — Application Inbox (staff triage queue).
                    path: expertHubRouteSegments.internalApplications,
                    element: withSuspense(<ApplicationInboxPage />),
                  },
                  {
                    // EH-INT-03 — Screening Detail / Application Insight Page
                    // (J-05 Screening & Initial Decision + J-08 Interview
                    // Exemption). The evaluation matrix itself stays open
                    // (`DM-GAP-02`) and is served as configuration, so the page
                    // ships against the journey's structure, not invented weights.
                    path: expertHubRouteSegments.internalApplicationDetail,
                    element: withSuspense(<ScreeningDetailPage />),
                  },
                  {
                    // EH-INT-04 — Interview Evaluation & Post-Interview Decision
                    // (J-07) + the staff half of J-06 (reschedule). Registered
                    // after the screening route; the deeper path still matches
                    // first because it is more specific.
                    path: expertHubRouteSegments.internalApplicationInterview,
                    element: withSuspense(<InterviewEvaluationPage />),
                  },
                  {
                    // EH-INT-05 — Approval Committee Decision (J-09): sequence
                    // formation, sequential approval, modification requests, and
                    // the bank-data gate that (with final approval) unblocks J-10.
                    path: expertHubRouteSegments.internalApplicationCommittee,
                    element: withSuspense(<CommitteeDecisionPage />),
                  },
                  {
                    // EH-INT-06a — Agreement Preparation & Internal Approval
                    // (J-10): preparation gated on the two J-09 outcomes,
                    // signing-sequence formation with designated e-signer(s),
                    // and the send gate requiring a complete sequence AND an
                    // attached signature (`BR-0213`).
                    path: expertHubRouteSegments.internalApplicationAgreement,
                    element: withSuspense(<AgreementPreparationPage />),
                  },
                  {
                    // EH-INT-02b — Service Requests queue (J-03/F2/AC-2:
                    // searchable by trainer name, filterable by requested
                    // service and status).
                    path: expertHubRouteSegments.internalServiceRequests,
                    element: withSuspense(<ServiceRequestsPage />),
                  },
                  {
                    // EH-INT-02b detail — the request beside the trainer's full
                    // approved profile (J-03/F2/AC-1), and the single
                    // administrative decision (J-03/F3): approve only with the
                    // agreement addendum attached, or reject with a reason.
                    path: expertHubRouteSegments.internalServiceRequest,
                    element: withSuspense(<ServiceRequestDetailPage />),
                  },
                  {
                    // EH-INT-09 — Assignment Requests (J-16). Registered above
                    // the `new` route is unnecessary here: `new` is a literal
                    // segment and this is the collection root.
                    path: expertHubRouteSegments.internalAssignments,
                    element: withSuspense(<AssignmentRequestsPage />),
                  },
                  {
                    // EH-INT-09 — create a request (J-16/F1–F5): service type
                    // first, an existing FAST plan (pull only, never created
                    // here), auto-pulled data, then the headcount.
                    path: expertHubRouteSegments.internalAssignmentNew,
                    element: withSuspense(<NewAssignmentRequestPage />),
                  },
                  {
                    // EH-INT-09d — slot re-routing (J-19). Registered ABOVE the
                    // `:requestId` matching route: it is the deeper path, and
                    // J-19's whole point is that it is scoped to one slot.
                    path: expertHubRouteSegments.internalSlotReRouting,
                    element: withSuspense(<SlotReRoutingPage />),
                  },
                  {
                    // EH-INT-09 matching workspace (J-17). Registered AFTER the
                    // literal `new` segment so `/assignments/new` is not read as
                    // a request id.
                    path: expertHubRouteSegments.internalAssignmentMatching,
                    element: withSuspense(<AssignmentMatchingPage />),
                  },
                  {
                    // EH-INT-14 — the role × permission matrix (CAP-08 /
                    // F-0801). The System Administrator's screen; its
                    // contents are DM-GAP-07 and it says so on the page.
                    path: expertHubRouteSegments.internalAccessPermissions,
                    element: withSuspense(<PermissionMatrixPage />),
                  },
                  {
                    // EH-INT-14 — users and the roles they hold (CAP-08 /
                    // F-0802). Roles only: BR-0801 forbids granting a
                    // permission to a user, so no route reaches one.
                    path: expertHubRouteSegments.internalAccessUsers,
                    element: withSuspense(<UserRoleAssignmentPage />),
                  },
                  {
                    // EH-INT-12 — the central notification matrix (CAP-07 /
                    // F-0702). Its routing is DM-GAP-08 and it says so.
                    path: expertHubRouteSegments.internalNotificationMatrix,
                    element: withSuspense(<NotificationMatrixPage />),
                  },
                  {
                    // EH-INT-12 — bilingual templates (CAP-07 / F-0703).
                    // BR-0701: no free-form wording reaches a notification.
                    path: expertHubRouteSegments.internalNotificationTemplates,
                    element: withSuspense(<NotificationTemplatesPage />),
                  },
                  {
                    // EH-INT-12 — the notification log (CAP-07 / F-0705).
                    path: expertHubRouteSegments.internalNotificationLog,
                    element: withSuspense(<NotificationLogPage />),
                  },
                  {
                    // EH-INT-13 — the central deadline console (CAP-07 /
                    // F-0704). BR-0705 puts every capability's SLA here.
                    path: expertHubRouteSegments.internalSlaConsole,
                    element: withSuspense(<SlaConsolePage />),
                  },
                  {
                    // EH-INT-17 — the staff entitlement register (CAP-06 /
                    // F-0602), including the records BR-0603 hides from the
                    // trainer, which is what the support call is about.
                    path: expertHubRouteSegments.internalEntitlements,
                    element: withSuspense(<InternalEntitlementsPage />),
                  },
                  {
                    // EH-INT-10 — the material & content review queue (J-20).
                    // Registered ABOVE the `:submissionId` detail so the
                    // collection root is unambiguous.
                    path: expertHubRouteSegments.internalSubmissions,
                    element: withSuspense(<SubmissionQueuePage />),
                  },
                  {
                    // EH-INT-10 detail — approve, or send a note opening a new
                    // upload (F2/AC-3, F5/AC-3). There is no third decision.
                    path: expertHubRouteSegments.internalSubmission,
                    element: withSuspense(<SubmissionReviewPage />),
                  },
                  {
                    // EH-INT-07 — Trainer Database (J-15/F1/AC-3). Browse and
                    // monitor only; sourcing candidates for an assignment is
                    // J-17 and deliberately absent here.
                    path: expertHubRouteSegments.internalTrainers,
                    element: withSuspense(<TrainerSearchPage />),
                  },
                  {
                    // `P-331` — the short bios awaiting review. Registered
                    // ABOVE `:trainerId` so the literal segment is unambiguous.
                    path: expertHubRouteSegments.internalTrainerBios,
                    element: withSuspense(<BioReviewPage />),
                  },
                  {
                    // EH-INT-08 — the unified trainer profile: everything
                    // J-15/F1/AC-1 enumerates, in one screen.
                    path: expertHubRouteSegments.internalTrainer,
                    element: withSuspense(<InternalTrainerProfilePage />),
                  },
                  {
                    // EH-INT-06 — Agreement Management (J-12/F1: expiry tracking
                    // at the 90/30/5-day milestones `BR-0303` defines).
                    path: expertHubRouteSegments.internalAgreements,
                    element: withSuspense(<AgreementsPage />),
                  },
                  {
                    // EH-INT-06 — the central agreement template (J-12/F4).
                    // Registered ABOVE the `:agreementId` detail route so the
                    // literal `template` segment wins over the parameter.
                    path: expertHubRouteSegments.internalAgreementTemplate,
                    element: withSuspense(<AgreementTemplatePage />),
                  },
                  {
                    // EH-INT-06 detail — renew (direct, term set by `BR-0302`),
                    // suspend, reactivate, or end (J-12/F2+F3).
                    path: expertHubRouteSegments.internalAgreement,
                    element: withSuspense(<AgreementLifecycleDetailPage />),
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
];

/**
 * Standalone router factory — used by the Expert Hub application's own entry
 * point once it is extracted to a separate repository. In the co-located build,
 * the shared bootstrap composes `expertHubRoutes` into the single app router
 * instead (there is one `createBrowserRouter` per SPA).
 */
export function createExpertHubRouter() {
  return createBrowserRouter(expertHubRoutes);
}
