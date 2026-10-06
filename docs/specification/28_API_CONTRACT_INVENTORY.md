# 28 — API Contract Inventory (fixture-pinned contracts)

*2026-09-17, `expert-hub/uat-baseline`. RB-08 … RB-12 happened because pages read
field names the API never sent. Each contract below is now pinned twice: the
backend test that produces the response **verifies its shape** against the
committed fixture, and the frontend contract test **renders that same fixture**
through the real HTTP provider.*

## How the pinning works

- **Backend:** `ContractFixtures.Verify(name, json)` (`tests/ExpertHub.Api.Tests/ContractFixtures.cs`)
  compares property names and JSON value kinds recursively. A fixture `null` is a
  wildcard, and arrays are checked against their first element. A renamed, removed
  or re-typed field fails the backend build.
- **Regenerate** (only on a deliberate contract change):
  `EXPERT_HUB_WRITE_CONTRACTS=1 dotnet test` from `backend`. Then review
  the fixture diff and update the frontend DTO types and contract tests in the
  same change.
- **Frontend:** `*.contract.test.tsx` feed the fixture to the feature's HTTP
  service through `contracts/fakeApiClient.ts` and render the real page.
- **Determinism:** only the shape is compared, so ids and timestamps in the
  committed files never cause a failure. The files change only when the write mode
  is used.
- **Data:** synthetic test records only. Seeded names such as «سارة العتيبي» and
  «مدرب 1», `*@test.fa.gov.sa` addresses, and the published sample IBAN
  `SA0380000000608010167519`. No credentials, tokens or real personal data.
- **Mocks:** the J-18, J-20 and J-21 demo providers are **built from the fixtures
  themselves** (`mockEngagementProvider`, `mockSubmissionProvider` and
  `mockExecutionProvider` import the JSON and change only values). The J-19, J-22
  and J-10 mocks are typed by the same DTOs and documented against their fixtures.
  A mock can't add or rename a field without a type error.

## Inventory

| Fixture | Backend endpoint | Backend DTO | Frontend adapter / service | Frontend page | Test (backend → frontend) |
|---|---|---|---|---|---|
| `me.assignment-offers` | `GET /api/v1/me/assignment-offers` | `OfferWire` (+ `OfferPriceWire`, `SlaWire`) — `EngagementEndpoints.cs` | `engagementService.ts` `listMyOffers` | `MyEngagementsPage` (J-18) | `Cap05Tests` → `Engagements.contract.test.tsx` |
| `me.engagements` | `GET /api/v1/me/engagements` (also the body of `POST …/assignment-offers/{offerId}/response`) | `MyEngagementWire` (+ `SlotWire`, `MaterialWire`) | `engagementService.ts` `listMyEngagements` / `respondToOffer` | `MyEngagementsPage` (J-18) | `Cap05Tests` → `Engagements.contract.test.tsx` |
| `internal.request-slots` | `GET /api/v1/internal/assignment-requests/{requestId}/slots` | `SlotWire` (+ `SlotBackupWire`) | `engagementService.ts` `getRequestSlots` | `SlotTrackingPanel` in `AssignmentMatchingPage` (J-17/J-18) | `Cap05Tests` → `Engagements.contract.test.tsx` |
| `internal.slot-cycle` | `GET /api/v1/internal/assignment-requests/{requestId}/slots/{slotNumber}/cycle` | anonymous projection in `AssignmentEndpoints.cs` (reference, status, exhausted, confirmed, cycles, previouslyOffered, viewer) | `reRoutingService.ts` `getSlotCycle` | `SlotReRoutingPage` (J-19) | `Cap05Tests` → `ReRouting.contract.test.tsx` |
| `internal.candidate-pool` | `POST …/slots/{slotNumber}/pool` and `…/pool/decision` | `CandidatePoolWire` (+ `PoolMemberWire`) | `reRoutingService.ts` `sendSlotPool` / `decideSlotPool` | `SlotReRoutingPage` (J-19) | `Cap05Tests` → `ReRouting.contract.test.tsx` |
| `me.submissions` | `GET /api/v1/me/submissions` | `SubmissionWire` (+ `SubmissionRoundWire`) | `submissionService.ts` `listMySubmissions` | `MySubmissionsPage` (J-20) | `Cap05Tests` → `Submissions.contract.test.tsx` |
| `internal.submissions` | `GET /api/v1/internal/submissions` | `SubmissionWire` | `submissionService.ts` `listSubmissions` | `SubmissionQueuePage` (J-20) | `Cap05Tests` → `Submissions.contract.test.tsx` |
| `internal.submission-detail` | `GET /api/v1/internal/submissions/{submissionId}` (and `POST …/decision` with `{decision}`) | `SubmissionWire` / `SubmissionDecisionInputWire` | `submissionService.ts` `getSubmission` / `decideSubmission` | `SubmissionReviewPage` (J-20) | `Cap05Tests` → `Submissions.contract.test.tsx` |
| `me.engagement-detail` | `GET /api/v1/me/engagements/{engagementId}` | anonymous projection in `EngagementEndpoints.cs` (including `evaluations {available, reason, items}`, `termination`) | `executionService.ts` `getEngagement` | `EngagementDetailPage` (J-21) | `Cap05Tests` → `Execution.contract.test.tsx`, `Withdrawal.contract.test.tsx` |
| `me.engagement-detail.terminated` | same, for a withdrawn engagement | same | same | `EngagementDetailPage` → `TerminationSummary` (J-21/J-22) | `Cap05Tests` → `Execution.contract.test.tsx` |
| `me.engagement-termination` | `POST /api/v1/me/engagements/{engagementId}/withdrawal` · `POST /api/v1/internal/engagements/{engagementId}/delink` | termination result (`TerminationInputWire` in) | `withdrawalService.ts` `withdrawFromEngagement` / `delinkTrainer` | `TerminationPanel` in `EngagementDetailPage` (J-22) | `Cap05Tests` → `Withdrawal.contract.test.tsx`, `Engagements.contract.test.tsx` |
| `internal.agreement-detail` | `GET /api/v1/internal/applications/{id}/agreement` | agreement detail (including `Document`, `IsCreator`) — `AgreementEndpoints.cs` | `agreementService.ts` | `AgreementPreparationPage` (J-10) | `Cap03Tests` → `Agreements.contract.test.tsx` |
| `internal.agreement-document` | `GET /api/v1/internal/applications/{id}/agreement/document` | `AgreementDocumentWire` — `AgreementDocuments.cs` | `agreementService.ts` | `AgreementDocumentView` (J-10) | `Cap03Tests` → `Agreements.contract.test.tsx` |
| `me.application-agreement` | `GET /api/v1/me/applications/{id}` → `agreement` | applicant agreement view (including `document`) — `ApplicantAgreementEndpoints.cs` | `applicationsService.ts` | `AgreementPreviewCard` (J-11) | `Cap03Tests` → `Agreements.contract.test.tsx` |

J-18 … J-22 are fully covered. J-10/J-11 were added with RB-05/RB-06. The other
features are still tested against their mock providers only. A contract test per
feature remains the recommendation in `24_RELEASE_READINESS.md`.
