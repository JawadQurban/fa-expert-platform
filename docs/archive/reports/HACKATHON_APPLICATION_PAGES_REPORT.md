# Hackathon Application Pages — Implementation Report

## 1. Executive Summary

Rebuilt and connected the full participant-facing Hackathon Applications journey — Applications Management, the 5-step New Application wizard (Eligibility → Team → Idea → Attachments → Review & Submit), Application Details/Status, and an application-specific Not Found state — entirely as new frontend code under `frontend/src/features/applications/`, composing only already-Approved Design System components.

- **Pages rebuilt:** 8 (Applications Management, Eligibility, Team, Idea, Attachments, Review & Submit, Application Details, application-specific Not Found — the last folded into Application Details rather than a separate route; see §14).
- **Routes connected:** 13 (see §4).
- **Landing Page preservation:** `HomePage.tsx` was **not touched**. The only Landing Page change is two constant string values in `src/content/hackathonLanding.ts` (see §3).
- **Frontend-only scope:** no backend, no real network calls, no real file uploads — a namespaced `localStorage`-backed mock service simulates all persistence (see §9).
- **Final status:** see §17.

## 2. Current Design System Baseline

**Approved components used (all confirmed `status: "Approved"` in `figma-component-map.json` at the time of this work):** Button, Card, Header (Nav Header), Footer, Breadcrumbs, Divider, Tag, Link, TextInput, Select (Dropdown Input), Checkbox, NumberInput, Textarea, FileUploader, Pagination, Table, Alert, Steps (Progress Indicator), Modal, Toast/ToastProvider, Loading, EmptyState, ErrorState, Icon, Typography, Container, Section, SearchBox.

**Batch 3 components confirmed Approved and available, but not used in these pages:** Radio, Switch, Input Prefix-Suffix, Date Picker, Button-Close, Floating Button, Trailing Icon, Dropdown List Item. None of the business fields in this feature genuinely needed a single-exclusive-choice control (Radio), a standalone boolean toggle distinct from a confirmation checkbox (Switch), a date field, or the other listed primitives — reusing them just to exercise the component would have meant inventing a business question, which the task explicitly prohibits. `Select` internally composes `DropdownListItem`, so it is exercised indirectly.

**Nothing was treated as approved without checking.** The registry and `docs/COMPONENT_APPROVAL_MATRIX.md` were read before use for every component in this list.

## 3. Landing Page Integration

- **Route preserved:** `/` still renders the existing `HomePage`, unchanged, under the existing `RootLayout`.
- **CTA links changed:** only the two constant values in `src/content/hackathonLanding.ts` — `PRIMARY_CTA_HREF` (`/submit` → `/applications/new`) and `SECONDARY_CTA_HREF` (`/requests` → `/applications`). `HomePage.tsx` itself was not edited (by its own design, all CTA hrefs are data-driven from this content file).
- **Files changed:** `frontend/src/content/hackathonLanding.ts` only (a doc comment above the two constants was also updated to reflect the new destinations).
- **Confirmation the Landing Page was not rebuilt:** `HomePage.tsx`, `HomePage.module.css`, and `HomePage.test.tsx` have zero diffs from before this pass. `HomePage.test.tsx`'s own CTA assertions read the href dynamically from `content.hero.primaryCta.href`, so they passed unmodified against the new destination values (verified in the full test run, §13).
- Both CTAs are still real `<a href>` links rendered via `Button`'s link mode (the existing, unmodified behavior) — clicking either causes a full navigation into the SPA's own router at `/applications/new` or `/applications`, which is consistent with how this app already treats every landing-page CTA (see `docs/DESIGN_DECISIONS.md`-style precedent already established for `Header`/`Footer`/`Breadcrumbs`, all of which render plain anchors too).

## 4. Routes

| Route | Purpose |
|---|---|
| `/` | Existing Hackathon landing page (preserved) |
| `/applications` | Applications Management (list, filters, pagination) |
| `/applications/new` | No UI — initializes/restores the active draft, then redirects to the first step |
| `/applications/new/eligibility` | Eligibility step (new-draft flow) |
| `/applications/new/team` | Team step (new-draft flow) |
| `/applications/new/idea` | Idea step (new-draft flow) |
| `/applications/new/attachments` | Attachments step (new-draft flow) |
| `/applications/new/review` | Review & Submit step (new-draft flow) |
| `/applications/:applicationId` | Application Details & Status (also renders the application-specific Not Found state inline for an unknown id — see §14) |
| `/applications/:applicationId/edit/eligibility` | Eligibility step (edit flow) |
| `/applications/:applicationId/edit/team` | Team step (edit flow) |
| `/applications/:applicationId/edit/idea` | Idea step (edit flow) |
| `/applications/:applicationId/edit/attachments` | Attachments step (edit flow) |
| `/applications/:applicationId/edit/review` | Review & Submit step (edit flow) |
| `*` | Existing app-wide Not Found (preserved, unmodified) |

All routes are registered as children of the existing single `paths.home` (`/`) route in `frontend/src/app/router/routes.tsx`, inside the existing `RootLayout` — **no second router was introduced**. A new `ApplicationsFeatureLayout` (not a route-level page, just a provider-mounting element) wraps the `/applications/*` subtree once with `ApplicationsProvider` (mock data/state) and `ToastProvider` (submission feedback), so those providers aren't re-created per page.

Each of the 5 wizard step page components is reused unmodified between the new-draft flow and the edit flow via a shared `useDraftApplication()` hook that resolves either the active draft (no `:applicationId`) or the given `:applicationId` (edit flow) — satisfying "Existing draft-editing flow" without duplicating the 5 step components.

## 5. Pages Implemented

- **Applications Management** (`pages/ApplicationsManagementPage.tsx`) — summary cards, filters (`SearchBox` + two `Select`s + Clear), `Table`-based list, client-side pagination, loading/error/empty/no-results states, row actions per status, New Application action.
- **Eligibility** (`pages/EligibilityStepPage.tsx`) — 3 confirmation `Checkbox`es, accessible error summary, blocks Continue until all are checked.
- **Team** (`pages/TeamStepPage.tsx`) — team/leader fields, city `Select`, a `NumberInput`-driven dynamic team-member list (add/remove, stable ids).
- **Idea** (`pages/IdeaStepPage.tsx`) — title, category `Select`, 6 required `Textarea`s with character counts, optional feasibility/technologies/notes.
- **Attachments** (`pages/AttachmentsStepPage.tsx`) — `FileUploader` (multiple), frontend validation (type/size/count/duplicate), optional per spec.
- **Review & Submit** (`pages/ReviewStepPage.tsx`) — read-only summary of all 4 prior sections with per-section Edit links, final declaration checkbox, accessible error summary linking to the offending step, frontend submission with `Toast` success feedback.
- **Application Details** (`pages/ApplicationDetailsPage.tsx`) — reference/status/dates, team/idea/attachments read-only summary, status history, status-specific `Alert`, status-specific actions (Continue Editing/Delete Draft, Withdraw, Edit & Resubmit, etc.).
- **Not Found** (folded into Application Details — see §14).

## 6. Shared Application Components

All under `frontend/src/features/applications/components/` — feature-internal, never exported from `@ds/*`:

| Component | Purpose |
|---|---|
| `AppLink` | Composes DS `Link` with `react-router-dom`'s `useHref`/`useLinkClickHandler` for real SPA navigation (per `Link`'s own module doc, which explicitly calls for a "product-level wrapper") |
| `ApplicationLayout` | Header/Breadcrumb/title/description/step-nav/actions/Footer shell, reused by every page instead of duplicating it |
| `ApplicationStatusTag` | Status → `{label, Tag variant, icon}` — label + icon always accompany color |
| `ApplicationSummaryCards` | Count cards per status (only statuses present in the data render) |
| `ApplicationFilters` | `SearchBox` + status/category `Select` + Clear Filters |
| `ApplicationsTable` | `Table` composition with reference-as-`AppLink`, category `Tag`, status `ApplicationStatusTag`, per-status row actions |
| `ConfirmActionModal` | Shared `Modal`-based confirmation for Delete Draft / Withdraw |
| `ApplicationSteps` | Wraps `Steps`, only completed steps clickable, never a forward jump |
| `ApplicationStepActions` | Shared Back / Cancel / Continue row |
| `ApplicationReviewSection` + `ReviewField` | Read-only `Card` + `dl` section with an Edit link, reused by both Review and Details pages |
| `ApplicationStatusHistory` | Chronological list of status-history entries (deliberately not the `Steps` stepper — see §11) |

## 7. Design System Usage

| Page | Registry components used |
|---|---|
| Applications Management | Header, Footer, Breadcrumbs, Container, Section, Typography, Card, Tag, SearchBox, Select, Button, Icon, Table, Pagination, Loading, EmptyState, ErrorState, Modal |
| Eligibility | (shell as above) + Alert, Checkbox, Steps |
| Team | (shell as above) + TextInput, Select, NumberInput, Button, Icon, Steps |
| Idea | (shell as above) + TextInput, Select, Textarea, Steps |
| Attachments | (shell as above) + FileUploader, Steps |
| Review & Submit | (shell as above) + Alert, Checkbox, Card, Divider, Link, Button, Steps, Toast |
| Application Details | (shell as above) + Alert, EmptyState, Button, Icon, Typography, Tag, Card, Divider, Link, Modal |

No primitive or composite was reimplemented locally; every page composes the existing exports from `@ds/primitives`, `@ds/composite`, `@ds/shell`, and `@ds/layout`.

## 8. Icons

Used (all confirmed present in `icon-categories.ts` before use): `add-circle`, `add-to-list`, `search-remove`, `search-focus`, `note-01`, `upload-01`, `alert-diamond`, `task-done-01`, `cancel-circle`, `remove-circle`, `delete-01`.

**Disclosed substitutions:** none required — every icon used maps directly to its intended meaning (e.g. `delete-01` for "remove member/file", `task-done-01` for "accepted", `alert-diamond` for "requires update"). No new icon category was imported and no icon name was invented.

## 9. Mock Data and State

- **Types** (`types/application.types.ts`): `ApplicationStatus`, `TeamMember`, `ApplicationAttachment`, `ApplicationStatusHistoryItem`, `HackathonApplication`, `CHALLENGE_CATEGORIES` — matches the guidance model in the task almost verbatim, plus one addition: a top-level `declarationAccepted: boolean` mapping to the single, real consent checkbox documented in `docs/CONTENT_STRUCTURE.md` §3.5 (kept separate from the 3 Eligibility-step confirmations, which map to "eligibility conditions/participation requirements/mandatory confirmations" — none of these 4 booleans are redundant with each other).
- **Mock records** (`data/applications.mock.ts`): `emptyApplication()` (draft skeleton) and `seedApplications()` (3 realistic seed records — accepted, requires-update, draft — covering every status-specific UI branch without extra setup).
- **Service functions** (`services/applications.mock-service.ts`): exactly the operations requested — `getApplications`, `getApplicationById`, `createDraft`, `updateDraft`, `submitApplication`, `withdrawApplication`, `deleteDraft`, `resubmitApplication` — plus `getActiveDraftId`/`setActiveDraftId` for the no-duplicate-draft guarantee. All are `async` functions that only touch `localStorage`; none call a real endpoint.
- **State**: a small `useReducer`-based `ApplicationsProvider` (mirrors the existing `LocaleProvider` context+hook pattern), mounted once for the `/applications/*` subtree. `ensureActiveDraft()` is guarded by an in-flight-promise ref so concurrent callers (the `/applications/new` initializer and the Eligibility step it redirects to) can never race into two separate drafts.
- **Persistence**: namespaced, versioned `localStorage` keys (`fads-hackathon:applications:v1`, `fads-hackathon:active-draft-id:v1`). Every read validates the parsed shape and silently falls back to the seed data on corrupt/unexpected JSON. A `__resetMockStoreForTests()` export provides the safe reset mechanism (used by every test file's `beforeEach`).
- **Attachment limitation (disclosed):** only `ApplicationAttachment` metadata (`id/name/size/type/validationStatus/validationMessage`) is persisted — real `File` objects are never stored (can't be serialized to `localStorage`, and there is no real upload to hold a reference to anyway). After a reload, previously "selected" files still show their name/status but cannot be re-downloaded or re-validated against their original bytes — an inherent, disclosed limitation of a frontend-only mock, not a bug.

## 10. User Journey

Landing Page → **Apply CTA** → `/applications/new` (draft ensured) → `/applications/new/eligibility` → Team → Idea → Attachments → Review & Submit → **Submit** → `/applications/:applicationId` (now `submitted`, read-only) → **Applications Management CTA** (Header/Footer/Breadcrumb or the page's own "Back to Applications") → `/applications` (submitted application now listed). Verified end-to-end by `applicationFlow.test.tsx`'s first test.

## 11. Accessibility

- **Route focus:** every page (via the shared `ApplicationLayout`) focuses its own `<h1>` (`tabIndex={-1}` + `element.focus()` on mount) — the same convention already established by the pre-existing `NotFound.tsx`.
- **Landmarks:** `Header`/`main` (from the existing `RootLayout`)/`Footer` on every page; `Breadcrumbs` is its own `nav` landmark.
- **Form accessibility:** every field uses the DS primitives' own label/helper/error wiring (`aria-describedby`, `aria-invalid`, `aria-required`); no bare `<input>`s.
- **Validation:** each step's error summary is a real `Alert` (`role="alert"`/`"status"` per DS convention) with focus moved to it on failure; errors are never color-only (text + icon).
- **Table/Pagination:** `Table`'s own `scope="col"` headers/caption contract and `Pagination`'s `aria-current="page"`/`nav` landmark are used as-is, unmodified.
- **Progress Indicator:** `Steps` is used exactly per its own contract — `aria-current="step"`, only completed steps clickable, never `role="progressbar"`.
- **Status presentation:** `ApplicationStatusTag` always pairs an icon + text label with color — never color alone. `ApplicationStatusHistory` deliberately does **not** reuse `Steps` for status history: application statuses (`requires-update`, `rejected`, `withdrawn`) are genuine non-linear branches, not steps toward a fixed sequential end, so forcing them into a completed/current stepper would misrepresent the semantics — a plain chronological `<ol>` is used instead, per the task's own explicit guidance on this point.
- **RTL:** every new CSS module uses only logical properties (`inline-start`/`inline-end`/`padding-inline`/`border-inline-start`, etc.) — no physical `left`/`right`. No data array was ever reversed to "simulate" RTL; the app's existing `dir="rtl"` default plus logical CSS handles mirroring automatically, the same pattern already established by every approved DS component this feature composes.

## 12. Responsive and RTL

Verified by inspection of the CSS (flex-wrap + `minmax()` grids throughout `ApplicationSummaryCards`, `ApplicationFilters`, `TeamStepPage`'s member rows, `ApplicationDetailsPage`'s meta grid) rather than a manual multi-viewport walkthrough in this pass — every layout uses `flex-wrap: wrap` or CSS Grid `auto-fit`/`auto-fill` with `minmax()`, so cards/filters/actions reflow rather than overflow at narrower widths, and long Arabic titles/attachment names wrap naturally (no fixed-width truncation was introduced anywhere). RTL correctness rests on the logical-properties discipline described in §11, already proven correct by the existing DS components these pages compose (their own RTL handling is unchanged).

## 13. Testing and Validation

**New tests added this pass: 25** (repo total: **666**, up from 641 before this feature).

| File | Tests |
|---|---|
| `router.test.tsx` (extended) | +5 (Landing CTA hrefs, no duplicate Landing route, `/applications` renders, `/applications/new` reaches Eligibility, unknown application id renders Not Found) |
| `ApplicationsManagementPage.test.tsx` | 9 (render, title/reference search, status filter, Clear Filters, no-results state, empty-store state, pagination reset-on-filter, New Application action, a11y) |
| `ApplicationDetailsPage.test.tsx` | 8 (valid render, unknown id → Not Found, requires-update alert, draft actions, delete-draft, submitted→withdraw, accepted has no destructive actions, a11y) |
| `applicationFlow.test.tsx` | 3 (full draft→submit→details journey; back-navigation state preservation; no duplicate active draft on repeat `/applications/new` visit) |

| Command | Result |
|---|---|
| `npm run typecheck` | ✅ Pass |
| `npm run lint` (eslint + `lint:css`) | ✅ Pass (3 pre-existing-category `react-refresh/only-export-components` warnings only, same class already accepted elsewhere, e.g. `useToast`) |
| `npm run format:check` | ✅ Pass (after `prettier --write` on all new/changed files) |
| `npm test` (full suite) | ✅ **666/666**, 58 files — run twice back-to-back to confirm no flakiness |
| `npm run tokens:generate` | ✅ 678 tokens (unchanged — no new DS tokens were needed; every new CSS module reuses existing `--fads-sys-*` tokens) |
| `npm run tokens:validate` / `tokens:check-coverage` | ✅ Defined: 725, Referenced: 630, Missing: 0 |
| `npm run build` | ✅ Pass (route-level code-split chunks emitted per new page) |
| `npm run build-storybook` | ✅ Pass (no DS component stories were touched; no new page-composition stories were added this pass — see §15) |

## 14. Files Created and Modified

**New application files** (`frontend/src/features/applications/`):
`types/application.types.ts`, `data/applications.mock.ts`, `services/applications.mock-service.ts`, `state/applications.reducer.ts`, `state/ApplicationsProvider.tsx`, `ApplicationsFeatureLayout.tsx`, `hooks/useDraftApplication.ts`, `components/{AppLink,ApplicationLayout(+.module.css),ApplicationStatusTag,ApplicationSummaryCards(+.module.css),ApplicationFilters(+.module.css),ApplicationsTable(+.module.css),ConfirmActionModal,ApplicationSteps,ApplicationStepActions(+.module.css),ApplicationReviewSection(+.module.css),ApplicationStatusHistory(+.module.css),index.ts}`, `pages/{ApplicationsManagementPage(+.module.css)(+.test.tsx),NewApplicationInitPage,EligibilityStepPage,TeamStepPage(+.module.css),IdeaStepPage,AttachmentsStepPage,ReviewStepPage,ApplicationDetailsPage(+.module.css)(+.test.tsx)}`, `applicationFlow.test.tsx`.

**Existing application integration files (modified):**
`frontend/src/app/router/paths.ts` (added `applications`/`applicationsNew`/`applicationsNewStep`/`applicationDetail`/`applicationEditStep`), `frontend/src/app/router/routes.tsx` (registered the `/applications/*` subtree under the existing root route), `frontend/src/app/router/router.test.tsx` (added the 5 tests in §13).

**Minimal Landing Page change:**
`frontend/src/content/hackathonLanding.ts` — only the two CTA href constants (see §3). `HomePage.tsx`/`HomePage.module.css`/`HomePage.test.tsx` unchanged.

**Not implemented as a separate file:** a dedicated "Application Not Found" page/route. The task's route table maps the app-wide `/*` catch-all to "Application-level Not Found," which is already served by the existing, unmodified `NotFound.tsx` — no second catch-all was added (would conflict with "do not introduce a second router" / duplicate-route concerns). The genuinely new requirement — an unknown **application id** under the valid `/applications/:applicationId` route pattern — is handled inline inside `ApplicationDetailsPage.tsx` (an `EmptyState` with a link back to Applications Management), reusing the same shell rather than a separate page component.

## 15. Frontend-Only Limitations

- No backend, database, or API endpoints — everything is `localStorage`.
- No real authentication/authorization.
- No real server persistence — data is per-browser (`localStorage`), not shared across devices/users.
- No real file upload — attachments are validated and their metadata is kept; the underlying bytes are never transmitted or stored.
- No real email/SMS notifications — submission feedback is a `Toast` only.
- No real approval workflow — status transitions (`under-review`/`accepted`/`rejected`) on the seed data are static fixtures; there is no evaluator-facing flow to move an application between them (out of scope per the task).
- Bilingual (ar/en) parity is **not** built for these new pages (disclosed simplification) — all new copy is Arabic-only, unlike the Landing Page's full `ar`/`en` content-object pattern. RTL/accessibility/logical-CSS correctness is unaffected by this; only the locale-toggle button's effect on this feature's own text is out of scope this pass.
- No Storybook page-composition stories were added this pass (see §6/§13 for the components that exist to compose them from, if a future pass wants to add these).

## 16. Remaining Risks

- **No en translation** for the Applications feature's own copy (see §15) — a real gap if the existing locale toggle is exercised while inside this feature; nothing breaks, but the UI stays Arabic.
- **Responsive/RTL verification was by CSS inspection, not a live multi-viewport/browser walkthrough** (see §12) — a real, disclosed verification gap, not a known defect.
- **Business fields without a confirmed source spec** (eligibility criteria text, team-size limits, challenge-category list, attachment type/size/count limits) were reasonably designed per §9/§2 of the codebase's own docs, matching the task's explicit allowance to do so — but they are not officially confirmed business rules and may need revision once a real spec exists.
- **`localStorage` capacity/quota** is not explicitly handled beyond the try/catch around `setActiveDraftId`; a very large number of drafts/attach ­ments-metadata could theoretically hit browser storage limits (unlikely in normal use, not exercised by tests).

## 17. Final Status

Hackathon Application Pages Complete — Existing Landing Page Preserved and Connected
