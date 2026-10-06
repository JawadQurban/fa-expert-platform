# Hackathon Phase 2 — Exact Single-Page Application Submission Form

## Scope note: replacing the existing wizard

The Phase 2 brief specified an exact single-page submission form (11 fields,
specific Arabic labels/helper text/order) at a route it called
`/hackathon/apply`. The required starting review found this field set —
Idea Title, Idea Description, Challenge, Required Support, and five
evaluation-criteria dropdowns (Innovation Level, Academy Impact, Financial
Value, Implementation Feasibility, Idea Clarity) — has **no overlap** with
the data model of the 5-step wizard already shipped in Phase 7
(Eligibility/Team/Idea/Attachments/Review, fields like `teamName`,
`problemStatement`, `challengeCategory`). Notably, the five dropdowns map
exactly to the six evaluation criteria already published on the Landing
Page, something the old wizard never captured at all.

Per user direction, this phase **replaced** the 5-step wizard rather than
adding a second, parallel `/hackathon/apply` flow next to it. The route
path itself was kept as `/applications/new` (the real, already-linked
equivalent established in Phase 1) rather than introducing a new
`/hackathon/apply` — the Landing Page CTA, already correct, needed no
change.

## What was removed

- Pages: `EligibilityStepPage`, `TeamStepPage` (+ its CSS), `IdeaStepPage`,
  `AttachmentsStepPage`, `ReviewStepPage`, `NewApplicationInitPage`.
- Hook: `hooks/useDraftApplication.ts` (wizard-only draft resolution).
- Components: `ApplicationSteps`, `ApplicationStepActions` (+ CSS) — the
  step/progress-indicator UI this phase explicitly forbids.
- Routes: `new/eligibility`, `new/team`, `new/idea`, `new/attachments`,
  `new/review`, and their five `:applicationId/edit/*` counterparts.
- Type fields: `eligibility`, `team` (+ `TeamMember`), the nested `idea.*`
  shape, `CHALLENGE_CATEGORIES`, `STEP_IDS`/`StepId` — none of which the
  Phase 2 field list (1–11) includes, and the brief's own suggested
  TypeScript interface confirms by omission ("do not add unrelated fields").
- The old `applicationFlow.test.tsx` wizard integration test (superseded by
  `ApplicationFormPage.test.tsx`'s own integration tests).

## What was built

- **`features/applications/types/application.types.ts`** — rewritten to the
  flat shape the brief's field list requires: `ideaTitle`, `ideaDescription`,
  `challenge?`, `requiredSupport?`, `innovationLevel`, `academyImpact`,
  `financialValue`, `implementationFeasibility`, `ideaClarity`,
  `attachment?` (`{ name, size, type }` — metadata only, never a `File`),
  `declarationAccepted`, plus the pre-existing `id`/`reference`/`status`/
  timestamps/`statusHistory` bookkeeping. A new `HackathonApplicationInput`
  type is exactly the fields the form collects.
- **`features/applications/data/formOptions.ts`** — centralizes the five
  dropdowns' option sets and the attachment's accept-list/max-size/idea-title
  max-length constants. **Disclosed fixture**: no official DGA/Financial
  Academy source enumerates discrete values for the five evaluation-criteria
  dropdowns (the Landing Page only publishes their *names*, never a rating
  scale), so all five share one plain three-point scale
  (مرتفع/متوسط/منخفض). This is a placeholder value set, not an invented
  business rule — it changes nothing about which dropdowns are required.
  The attachment accept-list/max-size (PDF/Word/PowerPoint, 10MB) is reused
  as-is from the prior wizard's own already-disclosed Attachments-step
  fixture, narrowed from multi-file to the single-file model Field 10
  requires.
- **`features/applications/services/applications.mock-service.ts`** —
  rewritten around `createApplication(input)` (generates id/reference,
  timestamps, sets `status: 'submitted'`, seeds `statusHistory`) and
  `updateApplication(id, input)` (for the edit route); `getApplications`/
  `getApplicationById`/`withdrawApplication`/`deleteDraft` kept. All
  draft/active-draft tracking (`createDraft`, `ensureActiveDraft`,
  `getActiveDraftId`) was removed — this form has one Save action, not a
  draft-then-submit two-phase flow. Storage key unchanged
  (`fads-hackathon:applications:v1` — an existing, already-namespaced
  convention reused rather than switching to the brief's suggested key).
- **`features/applications/state/ApplicationsProvider.tsx`** — exposes
  `createApplication`/`updateApplication` in place of the removed
  draft-specific operations; `refresh`/`getApplicationById`/
  `withdrawApplication`/`deleteDraft` unchanged.
- **`features/applications/pages/ApplicationFormPage.tsx`** (+ CSS) — the
  new page. Handles both `/applications/new` (create) and
  `/applications/:applicationId/edit` (edit — reused by the pre-existing
  "Continue Editing"/"Edit and Resubmit" actions on `ApplicationsTable`/
  `ApplicationDetailsPage` so they weren't silently broken by the data-model
  change). Renders inside the existing `ApplicationLayout` (Header/
  Breadcrumbs/Footer, unchanged) — no second Header/Footer.

## Exact field order (as implemented)

1. عنوان الفكرة: — `TextInput`, required, `maxLength=150` (disclosed
   fixture — no documented maximum exists)
2. اوصف فكرتك: — `Textarea`, required, 6 rows
3. التحدي: — `Textarea`, optional, helper text preserved verbatim, 4 rows
4. الدعم المطلوب: — `Textarea`, optional, helper text preserved verbatim, 4 rows
5. مستوى الابتكار: — `Select`, required, placeholder as specified
6. الأثر على الأكاديمية المالية: — `Select`, required
7. القيمة المالية / الكفاءة: — `Select`, required
8. الجدوى التطبيقية: — `Select`, required
9. وضوح الفكرة: — `Select`, required, helper text preserved verbatim
10. ملف مرفق للفكرة: — `FileUploader` (`variant="single"`), optional, helper
    text preserved verbatim exactly ("ملفات الدعم المسموح بها")
11. Declaration — `Checkbox`, mandatory, exact text preserved, blocks Save
    while unchecked

Save / إلغاء render at the bottom via the Approved `Button`.

## Required-vs-optional disclosure

The brief marks Idea Title/Description "required" explicitly but only says
"required Dropdown Input fields" for the validation category, without
naming which of the five. Resolved via the brief's own suggested TypeScript
interface: `innovationLevel`/`academyImpact`/`financialValue`/
`implementationFeasibility`/`ideaClarity` are all **non-optional** (no `?`)
there, while `challenge`/`requiredSupport`/`attachment` are all optional
(`?`) — so all five dropdowns were implemented as required, and the three
`?` fields as optional. This is a disclosed interpretation, not an invented
rule.

## Save / Cancel behavior

- **Save**: validates all required fields client-side; on failure, shows an
  Arabic error summary (`Alert`, `role="alert"`) plus per-field `errorText`,
  and moves focus to the first invalid control in field order (text inputs/
  textareas/dropdown triggers/the checkbox all forward a ref for this).
  Attachment metadata (`{name, size, type}`) is computed from whichever the
  user last did (kept existing / replaced / removed) — never a `File`
  object is persisted. On success: creates/updates the record with
  `status: 'submitted'`, shows an accessible success toast
  (`useToast`, already-Approved `Toast`/`ToastProvider`), and navigates to
  `/applications`.
- **Cancel**: navigates directly to `/applications` (My Applications) — no
  `window.confirm`, no Modal. The brief permits either Landing Page or My
  Applications and only requires a confirmation Modal "if unsaved-change
  confirmation is required by the established flow" — no such flow is
  established anywhere in this repository, so none was added.

## Compatibility fixes (not new features)

Adapting to the new flat shape required minimal, mechanical changes to
already-built My Applications code so it kept working — not a rebuild of
that phase's scope:

- `ApplicationsTable.tsx` — `idea.title` → `ideaTitle`; the challenge-category
  column (field no longer exists) replaced by an Innovation Level tag;
  edit-action hrefs repointed from the removed step routes to
  `paths.applicationEdit(id)`.
- `ApplicationFilters.tsx` / `ApplicationsManagementPage.tsx` — the
  category filter (its field is gone) was dropped; search/status filtering
  kept, now matching on `ideaTitle`.
- `ApplicationDetailsPage.tsx` — the Team/Idea/Attachments review sections
  now render the new flat fields (including all five evaluation-criteria
  labels) instead of the old nested `team`/`idea` objects; a real bug was
  caught and fixed here in passing (`pendingDelete?.idea.title` would have
  thrown at runtime against the new shape — now `pendingDelete?.ideaTitle`).
- `app/router/paths.ts` — `applicationsNewStep`/`applicationEditStep`
  (multi-step helpers) replaced by a single `applicationEdit(id)`.

Seed data (`applications.mock.ts`) kept the same ids/references/`ideaTitle`
text/statuses as before wherever possible specifically so pre-existing,
untouched tests (`ApplicationDetailsPage.test.tsx`, most of
`ApplicationsManagementPage.test.tsx`) kept passing without modification —
confirmed: all 8 `ApplicationDetailsPage` tests pass unchanged.

## Tests

- **New**: `features/applications/pages/ApplicationFormPage.test.tsx` (14
  tests) — Header/Footer/main-landmark-once, form landmark, exact field
  order (via DOM-position comparison, not text snapshots), Arabic labels/
  helper text/RTL, empty-required-field validation with Arabic messages and
  first-invalid-field focus (both the text-field and dropdown cases), valid/
  invalid-type/oversized file selection, file removal + same-file
  reselection, Cancel navigation without persistence, Save creating a record
  and navigating to My Applications, persistence surviving a fresh route
  render, and an axe accessibility scan.
- **Updated**: `router.test.tsx` (heading text for `/applications/new` now
  "تقديم فكرة جديدة"; the Phase 1 shared-layout test for that route updated
  to match); `ApplicationsManagementPage.test.tsx` (one inline fixture using
  the old nested shape rewritten to the new flat shape).
- **Removed**: `applicationFlow.test.tsx` (drove the now-deleted wizard
  route-by-route) — its intent (full create-to-persisted-record journey) is
  now covered by `ApplicationFormPage.test.tsx`'s own integration tests.

No submission-form Storybook stories were created (Storybook remains
Design-System-only, per this phase's explicit boundary); no Design System
file was changed, so `build-storybook` was not run.

## Validation results

All run from `frontend/`:

| Check | Result |
|---|---|
| `npm run typecheck` | Pass, 0 errors |
| `npm run lint` (incl. `lint:css`) | 0 errors (3 pre-existing `react-refresh` warnings on unrelated files, unchanged) |
| `npm run format:check` | Pass (1 pre-existing warning on a generated token file, untouched) |
| `npm test` | **681/681 tests passing**, 58 files |
| `npm run build` | Succeeds (pre-existing >500kB chunk-size advisory, unrelated to this change) |
| `npm run build-storybook` | Not run — no Design System file changed |

## Remaining blockers / disclosures

None blocking. Carried forward as disclosed, non-blocking placeholders,
consistent with this repository's existing disclosure convention:

1. The five evaluation-criteria dropdown option values (مرتفع/متوسط/منخفض)
   are a frontend fixture — no official source enumerates them.
2. Idea Title's 150-character maximum is a disclosed, undocumented fixture.
3. The attachment accept-list/max-size are reused from the prior wizard's
   own disclosed fixture, not a newly-invented rule.
4. Cancel navigates to My Applications (one of the two brief-permitted
   destinations) — a disclosed choice, not the only valid one.
5. The long declaration checkbox label's wrapping/RTL behavior relies on the
   already-Approved `Checkbox` component's existing CSS — not independently
   pixel-verified against a live screenshot (none was provided this
   session).

## Final Status

Phase 2 Complete — Exact Single-Page Submission Form Implemented
