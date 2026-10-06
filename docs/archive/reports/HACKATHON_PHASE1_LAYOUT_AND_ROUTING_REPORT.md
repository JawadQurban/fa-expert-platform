# Hackathon Phase 1 — Shared Layout, Routing, and Landing Page Integration

## Scope note: audit, not build

The Phase 1 brief for this session assumed a starting state where no shared
Hackathon layout, submission form, My Applications table, or CTA wiring
existed yet, and asked for new routes at `/hackathon/apply` and
`/hackathon/applications`.

The required starting review (`CLAUDE.md` — "read the entire repository
before making changes", "continue from the current project phase recorded
in `PROJECT_STATUS.md`") found that assumption does not hold. Per
`docs/PROJECT_STATUS.md`, this repository is already at **Phase 7 —
Hackathon Application Pages, built & connected**: a full 5-step submission
wizard, My Applications management, Application Details/Status, and an
in-feature Application Not Found state already exist and are already wired
to the Landing Page's CTAs, at `/applications/new` and `/applications`
(not under a `/hackathon/*` prefix).

Building the brief literally — a second submission form, a second My
Applications table, or parallel `/hackathon/apply` / `/hackathon/applications`
routes — would have violated the brief's own hard rules against a second
router, a second Header/Footer, and duplicated pages, and would have
produced two competing implementations of the same product.

The user confirmed the intended approach for this session (see below):
**treat `/applications/new` and `/applications` as the real equivalents of
`/hackathon/apply` and `/hackathon/applications`, audit the existing shell
against every Phase 1 requirement, add only the test coverage the brief
calls for, and report reality** — instead of creating new routes or pages.

## Existing Landing Page preservation

**No Landing Page file was changed.** `frontend/src/pages/HomePage.tsx` and
`frontend/src/content/hackathonLanding.ts` were read-only for this session.
The Landing Page's CTAs already point at the real Applications feature:

- Primary CTA ("قدم ابتكارك" / "Submit your innovation") → `/applications/new`
- Secondary CTA ("إدارة طلباتي" / "Manage my requests") → `/applications`

Both hrefs are asserted by existing tests (`src/pages/HomePage.test.tsx`,
`src/app/router/router.test.tsx`) and were re-verified passing in this
session. No new CTA, no visual change, no restructuring was needed or made.

## Shared layout used

No new shared-layout component was created. Two pieces already compose the
same shell on every route:

1. **`frontend/src/layouts/RootLayout.tsx`** — mounted once at the router
   root (`app/router/routes.tsx`). Provides the skip link and the sole
   `<main id="main">` landmark that every page's content renders into.
2. **`frontend/src/features/applications/components/ApplicationLayout.tsx`**
   — composes Header + Breadcrumbs + page title/description/actions +
   Footer, reused by every Applications page (`ApplicationsManagementPage`,
   `EligibilityStepPage`, `TeamStepPage`, `IdeaStepPage`,
   `AttachmentsStepPage`, `ReviewStepPage`, `ApplicationDetailsPage`,
   including its Not Found branch). `HomePage.tsx` composes the same
   `Header`/`Footer` shell components inline (it predates `ApplicationLayout`
   and has its own content structure per the Hard Landing Page Constraint,
   but uses the identical `@ds/shell` components).

This satisfies the brief's "do not create a second router / Header / Footer"
and "reuse or minimally extend an existing shared shell" instructions more
directly than adding a new `HackathonLayout` would have — a second layout
component would have been a second, parallel shell-composition path.

## Header / Footer reuse

Both `Header` (CMP-01) and `Footer` (CMP-03) are ✅ **Approved** in
`docs/COMPONENT_APPROVAL_MATRIX.md` (Figma-verified, tokenized, tested). No
component code was touched this session. Every page renders exactly one
instance of each — verified by new tests (below), not assumed.

## Routes

No routes were added, removed, or renamed. `frontend/src/app/router/routes.tsx`
and `frontend/src/app/router/paths.ts` were read-only. The existing route
table already covers the brief's required surface:

| Brief's requested route | Existing equivalent | Status |
|---|---|---|
| `/` (Landing Page, preserved) | `/` → `HomePage` | Unchanged |
| `/hackathon/apply` | `/applications/new` → `NewApplicationInitPage` → first wizard step | Already built (Phase 7), beyond "route shell" |
| `/hackathon/applications` | `/applications` → `ApplicationsManagementPage` | Already built (Phase 7), beyond "route shell" |
| `/hackathon/applications/:id` (optional) | `/applications/:applicationId` → `ApplicationDetailsPage` | Already built, incl. its own Not Found state |
| 404 | `*` → `NotFound` | Unchanged |

No `/eligibility`, `/team`, `/idea`, `/attachments`, `/review` top-level
routes exist or were added — they exist only as already-shipped nested
segments (`/applications/new/eligibility`, etc.), which is a pre-existing,
out-of-scope-to-relitigate Phase 7 decision, not something created this
session.

## Landing Page CTA integration

Already correct; verified, not changed (see above).

## Files modified this session

- `frontend/src/app/router/router.test.tsx` — added a `describe('shared
  Hackathon layout', ...)` block with 4 new tests (below). This is the only
  source file changed in this session.

No design-system file, no page/component/content file, and no route/path
file was modified. `build-storybook` was therefore not required and was not
run (per the brief's own instruction).

## Tests run

New tests added to `src/app/router/router.test.tsx`, exercising the real
routed tree (`RootLayout` + page + shell), not isolated component mounts:

- Landing Page (`/`) renders exactly one Header (`banner`), one Footer
  (`contentinfo`), and one `main` landmark.
- My Applications (`/applications`) renders exactly one Header, one Footer,
  and one `main` landmark.
- The Submission Form's first step (`/applications/new`) renders exactly
  one Header, one Footer, and one `main` landmark.
- Route entry moves focus to the page's `<h1>` (`#app-page-title`),
  confirming the project's existing route-change-focus convention holds for
  the Applications routes.

Cross-checked against the brief's required test list:

| Brief requirement | Coverage |
|---|---|
| Existing Landing Page still renders | Existing: `router.test.tsx`, `HomePage.test.tsx` |
| Apply CTA navigates to the apply route | Existing: `router.test.tsx` ("...links to /applications/new...") |
| My Applications CTA navigates to the applications route | Existing: same test ("...and /applications") |
| Submission Form route renders | Existing: `router.test.tsx` (renders Eligibility step at `/applications/new`) |
| My Applications route renders | Existing: `router.test.tsx` |
| Header appears on Landing Page | New (this session) |
| Header appears on Submission Form | New (this session) |
| Header appears on My Applications | New (this session) |
| Footer appears on all three pages | New (this session) |
| Only one Header renders per page | New (this session) |
| Only one Footer renders per page | New (this session) |
| No duplicate Landing Page route exists | Existing: `router.test.tsx` |
| Route focus behavior follows project conventions | New (this session) |

No submission-form behavior tests or My Applications table behavior tests
were added (out of scope; extensive ones already exist from Phase 7 —
`EligibilityStepPage` et al., `ApplicationsManagementPage.test.tsx`,
`applicationFlow.test.tsx` — and were left untouched).

## Validation results

All run from `frontend/`:

| Check | Result |
|---|---|
| `npm run typecheck` | ✅ Pass, 0 errors |
| `npm run lint` (incl. `lint:css`) | ✅ 0 errors (3 pre-existing `react-refresh` warnings, unrelated files, unchanged) |
| `npm run format:check` | ✅ Pass (1 pre-existing warning on a generated token file, untouched) |
| `npm test` | ✅ **670/670 tests passing**, 58 files (up from 666/57 — 4 new tests, all passing, no regressions) |
| `npm run build` | ✅ Succeeds (pre-existing >500kB chunk-size advisory on the Icon bundle, unrelated to this change) |
| `npm run build-storybook` | Not run — no design-system file changed, per the brief's own instruction |

## Remaining blockers

None blocking. Two non-blocking observations surfaced during the audit,
neither introduced this session and neither in this phase's scope to fix:

1. **`HomePage.tsx` does not move focus to its `<h1>` on mount**, unlike
   `NotFound.tsx` and every `ApplicationLayout`-based page, which do. This
   is a pre-existing Landing Page implementation detail; the Hard Landing
   Page Constraint for this phase ("must not be rebuilt", "only minimal
   integration changes required for navigation") means it was left
   untouched and is flagged here rather than silently patched.
2. The top-level catch-all `NotFound.tsx` (route `*`, for unrecognized
   URLs) renders no Header/Footer — it predates the shell components
   ("Foundation 404 route... no design-system components yet" per its own
   comment). This is distinct from the in-feature Application Not Found
   state (unknown `:applicationId`), which does use `ApplicationLayout` and
   was already in this phase's required-coverage list. The generic 404 is
   not one of this phase's required pages and was left untouched.

An initial hypothesis — that nesting Header/Footer inside `RootLayout`'s
single `<main>` landmark might strip their `banner`/`contentinfo` roles per
the HTML-AAM spec — was raised and then disproved by direct measurement
(a throwaway probe test, since deleted) before being written up here, to
avoid reporting a false finding.

## Final Status

Phase 1 Complete — Shared Layout, Header/Footer, and Routes Connected
