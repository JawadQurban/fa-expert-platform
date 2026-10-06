# Option B — Frontend Rollout (page-by-page control record)

> Control record for `OPTION_B_FULL_FRONTEND_IMPLEMENTATION_PLAYBOOK.md`. A route
> is **Done** only when its features, states, roles, RTL/LTR, responsive
> behavior, and applicable tests are verified. Design reference: the approved
> Option B artifact (`ca01bb25-…`) + `PROPOSED_COMPONENT_REGISTRY.md`.
>
> Status legend: ✅ Done · 🟡 In progress · ⬜ Pending · ➖ N/A

Last updated: 2026-09-14 · Branch: `main`

---

## Baseline (Phase 1)

Established before implementation, from the real commands — **no pre-existing failures**:

| Check | Command | Result |
|---|---|---|
| Type-check | `npm run typecheck:expert-hub` | ✅ pass |
| Lint (ESLint) | `npm run lint:expert-hub` | ✅ pass (1 pre-existing warning in `interviews/components/InterviewSlotsField.tsx`, unrelated) |
| CSS rules (DC-04/DC-23) | `npm run lint:css` | ✅ pass |
| Tests | `npm run test:expert-hub` | ✅ **682 passed / 47 files** |
| Build | `npm run build:expert-hub` | ✅ pass |

Pre-existing issues to not attribute to this work: the one `react-refresh/only-export-components` lint **warning** above; `awaiting-committee` renders as a raw status code in the stage-distribution (mock emits a status with no Arabic label).

Runtime: the app runs entirely on the `internalService`/service **mocks** (no live API). Dev access to the internal shell: `VITE_EXPERT_HUB_DEV_ROLE=internal`, then `/expert-hub/auth/callback` mints a staff session and lands on `/expert-hub/internal`.

---

## Shared foundation (Phase 2)

| Item | Change | Status |
|---|---|---|
| App shell ground | `ExpertHubShell` `<main>` → `background: subtle` so every page gets Option B figure/ground and white `@ds` cards read as elevated | ✅ |
| Internal header IA | `ExpertHubMainHeader`: 6 primary tabs + "المزيد" overflow menu (was 10 wrapping); portal/public unchanged | ✅ |
| Elevated cards | KPI tiles + quick-cards + `Card` use `card-bg` (#fff) + `card-shadow` on subtle ground | ✅ (dashboard; propagates via shell ground elsewhere) |
| Page-header pattern | Reusable `PageHeader` (eyebrow/title/subtitle/summary/actions) | ⬜ (to extract) |
| Filter bar pattern | `DashboardWorkQueue` filter (SearchBox + Select + clear) reused; inbox already uses P-11 filter | ✅ (pattern exists) |
| SLA health meter | `SlaHealthMeter` (app component) | ✅ |
| Work-queue rows | `DashboardWorkQueue` identity rows | ✅ |
| Status presentation | `ApplicationStatusBadge` (Tag, icon+label, never color-alone) | ✅ (existing) |
| Feedback states | `Loading`/`EmptyState`/`ErrorState` (DS) used across pages | ✅ (existing, verify per page) |

Proposed components implemented so far (see registry): **KPI Tile**, **SLA Health Meter**, **Work-Queue Row**, **Filter Bar** (composition). Not yet built: Saved View Selector, Filter Chip, Trend Indicator (deferred — `submissionDelta` is null), Alerts Feed, App Sidebar Nav (superseded by the top-header IA decision), Bulk Action Bar / Side Inspector / Data Toolbar (Alternative C only).

---

## Route inventory & status

### Application shell / layouts
| Component | Role | Type | Option B change | Status |
|---|---|---|---|---|
| `ExpertHubShell` / `ExpertHubHeader` / `ExpertHubMainHeader` | all | shell | Subtle ground; 6-tab + "More" internal nav | ✅ |
| `ExpertHubRootLayout` / `PublicLayout` / `PortalLayout` / `InternalLayout` | all | layout | Inherit shell ground; no structural change | ✅ |

### Internal staff journeys (`/internal/*`, role: internal)
| Route | Type | Current features | APIs/State | Option B change | Risk | Status |
|---|---|---|---|---|---|---|
| `/internal` | dashboard | KPI tiles, SLA, distribution, recent/queue | `getDashboard`,`getInbox` | Compact head, elevated cards, work queue + filter, SLA meters | Low | ✅ |
| `/internal/applications` (inbox) | list | search+status filter, table/cards, pagination | `getInbox` | Filter bar + results as elevated white panels (⚠️ required: the table's alternating-row token equals the page ground, so stripes vanish without a surface) | Low | ✅ |
| `/internal/applications/:id` (screening) | detail/form | screening decision, SLA countdowns | screening svc | Identity+status header, summary-first, sections | Med | ⬜ |
| `/internal/applications/:id/interview` | detail/form | interview eval + reschedule | interviews svc | Detail header, grouped form, states | Med | ⬜ |
| `/internal/applications/:id/committee` | detail/form | committee sequence/approval | committee svc | Detail header, sequence panel, states | Med | ⬜ |
| `/internal/applications/:id/agreement` | detail/form | agreement prep + signing seq | agreements svc | Detail header, sticky actions | Med | ⬜ |
| `/internal/service-requests` | list | search/filter/status queue | serviceRequests svc | PageHeader, filter bar, rows | Low | ⬜ |
| `/internal/service-requests/:requestId` | detail | request + trainer profile, decision | serviceRequests svc | Identity/status header, actions | Med | ⬜ |
| `/internal/assignments` | list | assignment requests | assignments svc | PageHeader, list, primary action | Low | ⬜ |
| `/internal/assignments/new` | form | create request (multi-step) | assignments svc | Steps, grouped form | Med | ⬜ |
| `/internal/assignments/:requestId` | workspace | matching & nomination (J-17) | assignments svc | Header, panels, drill-down | Med | ⬜ |
| `/internal/assignments/:requestId/slots/:slotNumber` | detail | slot re-routing (J-19) | assignments svc | Header, states | Med | ⬜ |
| `/internal/submissions` | list | material review queue | submissions svc | PageHeader, filter, rows | Low | ⬜ |
| `/internal/submissions/:submissionId` | detail | approve / request re-upload | submissions svc | Identity/status header, actions | Med | ⬜ |
| `/internal/trainers` | search/list | trainer database search | trainerSearch svc | PageHeader, search/filter, results | Low | ⬜ |
| `/internal/trainers/:trainerId` | detail | unified trainer profile | trainerSearch svc | Identity header, sections/tabs | Med | ⬜ |
| `/internal/agreements` | list | expiry tracking (90/30/5) | agreementLifecycle svc | PageHeader, filter, status | Low | ⬜ |
| `/internal/agreements/template` | config | central template | agreementLifecycle svc | Config header, sections | Low | ⬜ |
| `/internal/agreements/:agreementId` | detail | renew/suspend/end | agreementLifecycle svc | Identity/status header, actions | Med | ⬜ |
| `/internal/entitlements` | list | staff entitlement register | entitlements svc | PageHeader, table, states | Low | ⬜ |
| `/internal/access/permissions` | admin | role×permission matrix (empty/DM-GAP-07) | access svc | Config header, scope note | Low | ⬜ |
| `/internal/access/users` | admin | users↔roles | access svc | Config header, table | Low | ⬜ |
| `/internal/notifications/matrix` | admin | event→template→audience | notifications svc | Config header, table | Low | ⬜ |
| `/internal/notifications/templates` | admin | bilingual templates | notifications svc | Config header, list/detail | Low | ⬜ |
| `/internal/notifications/log` | admin | notification log (read-only) | notifications svc | PageHeader, table, states | Low | ⬜ |
| `/internal/sla` | admin | central deadline console | slaWiring | Config header, table | Low | ⬜ |

### Trainer portal journeys (`RequireAuth` / `RequireTrainer`, role: individual/trainer)
| Route | Type | Option B change | Risk | Status |
|---|---|---|---|---|
| `/home` (PortalHome, role-resolved) | dashboard | Head, summary cards, quick actions on subtle ground | Low | ⬜ |
| `/applications` (My Applications) | list | PageHeader, filter, status cards/table | Low | ⬜ |
| `/applications/:applicationId` (detail) | detail | Identity/status header, timeline | Med | ⬜ |
| `/applications/:applicationId/add-service` | form | Grouped form, states | Med | ⬜ |
| `/profile` (My Profile) | detail/form | Sections, edit states | Med | ⬜ |
| `/engagements` (My Engagements) | list | PageHeader, offer/engagement cards | Low | ⬜ |
| `/engagements/:engagementId` (execution) | detail | Identity/status header, sections | Med | ⬜ |
| `/submissions` (My Submissions) | list/form | PageHeader, upload states | Med | ⬜ |
| `/entitlements` (My Entitlements) | list | PageHeader, ERP-sourced note, table | Low | ⬜ |

### Public + auth + system-state pages
| Route | Type | Option B change | Risk | Status |
|---|---|---|---|---|
| `/` (Landing, EH-PUB-01) | public/marketing | Keep marketing composition; align cards/spacing to Option B tokens | Low | ⬜ |
| `/directory` (Trainer Directory) | list | PageHeader, filter, result cards | Low | ⬜ |
| `/directory/:trainerId` (Public Profile) | detail | Identity header, sections | Low | ⬜ |
| `/applications/new` (New Application, guest-capable) | multi-step form | Step indicator, grouped fields, identity gate, review/success | High | ⬜ |
| `/activate/:token` (Activation) | form/system | Focused card, states | Low | ⬜ |
| `/login` | auth | Focused card, SSO action | Low | ⬜ |
| `/auth/callback` | system | Loading/failure states | Low | ⬜ |
| `/unauthorized` | system | `SystemMessage` alignment | Low | ⬜ |
| `*` (NotFound) | system | `SystemMessage` alignment | Low | ⬜ |

---

## Phase log
- **Phase 1 — Baseline & inventory:** ✅ complete (this record).
- **Phase 2 — Shared foundation:** ✅ shell ground, shell table surface, internal header IA (6 + "المزيد"), elevated cards, KPI tile, work queue, SLA meters, filter-bar pattern. (`PageHeader` extraction judged unnecessary — pages already compose a consistent title/lead/action head.)
- **Phase 3 — By journey:** ✅ dashboard · inbox · landing (visuals only, approved layout) · 14 further internal/admin/public routes · 7 trainer-portal routes · 6 detail routes · New Application (verified compliant, deliberately untouched).
- **Phase 9 — Prototype parity (16 staff screens):** ✅ the `shared/workspace/` kit; all 16 prototype frames plus 9 more internal pages recomposed; 25 routes swept at 1360px and 390px, 0 overflow, 0 page errors; no test changed; permission-matrix mobile overflow fixed at its root. 687/687. **Corrects the visual-parity claim of phases 3–4** (see below).
- **Phase 8 — `PageLoadError`:** ✅ 31 blocks / 30 files; every failed page has an `<h1>`; a 403-handling bug fixed en route. 687/687.
- **Phase 7 — Trainer-portal survey:** ✅ blanks-on-action fixed on 2 more pages; **corrections recorded** (see below). 687/687.
- **Phase 6 — Detail-page consistency:** ✅ action-reload blanking fixed (2 pages), one head treatment across all 12 (see below). 686/686.
- **Phase 5 — Active-filter chips:** ✅ all five filtered lists (see below). 685/685.
- **Phase 4 — Consistency pass + full validation:** ✅ KPI tile normalized across staff + portal; runtime smoke 18/18 + 7 + 6 with **zero console/page errors**; RTL **and** LTR; mobile/tablet/desktop with **0px overflow**; permission allowed/denied both proven; type-check, lint, css-rules, **682/682 tests**, and production build all green.

### Deep sub-routes — closed (2026-09-14)
Swept by **following each list's own first detail link** (which also verifies list→detail navigation), plus direct ids where a list had none. All render with the correct `<h1>`, **zero horizontal overflow**, no console/page errors, and heights ≤2.4k px:

| Sub-route | h1 | Height |
|---|---|---|
| `/internal/service-requests/asr-001` | طلب إضافة خدمة | 1434px |
| `/internal/submissions/sub-002` | مراجعة الملف | 1266px |
| `/internal/agreements/agr-001` | الاتفاقية | 1172px |
| `/internal/assignments/asg-001` | المطابقة والترشيح | 1344px |
| `/internal/trainers/trn-001` | د. سارة العتيبي | 2393px |
| `/internal/agreements/template` | نموذج الاتفاقية الموحّد | 1934px |
| `/applications/:id` | تفاصيل الطلب | 1236px |
| `/applications/:id/add-service` | طلب إضافة خدمة | 1000px |
| `/engagements/eng-1`, `eng-2` | متابعة الارتباط | 1914 / 2009px |

Two real findings, both handled:
- **`add-service` reported "(no h1)"** — the main path has one, but the **not-eligible / FAST-unavailable** branch rendered an Alert and nothing else, so the page never said what it was. Fixed (`c5418ae`). Deliberately *not* added to the loading branch: a skeleton carrying the loaded page's title makes anything waiting on the heading fire too early — recorded in a code comment so it is not "fixed" back later.
- **`engagement detail` was unreachable in the first sweep** — not a defect: that trainer has offers but no *confirmed* engagements, so no card and no link. Verified directly against `eng-1` / `eng-2`.

**Remaining (honest):** the DS `Header` wrap is fixed (2/3/4/6 tabs by width, single 72px row from 1024px up). Slot re-routing (`/internal/assignments/:id/slots/:n`) is the one route still not individually rendered — it requires an *exhausted* slot, a state the mock does not currently produce; it is covered by `ReRouting.test.tsx` (17 tests).

### Phase 5 — Active-filter chips on every filtered list (2026-09-14)

The prototype's list screens say what a list is narrowed **BY**, above the
results. Rolled out to every filtered list in the product, as one shared
component (`shared/components/ActiveFilterChips.tsx`) rather than five
copies:

| List | Dimensions chipped | Commit | Tests |
|---|---|---|---|
| Application inbox (`EH-INT-01b`) | search, status, service | `a231308` | 683 |
| Service requests (`EH-INT-02b`) | search, status, service | `88f4fa3` | 17/17 file |
| Agreements (`EH-INT-06`) | search, status, expiry milestone | `eed8f7c` | 19/19 file |
| Trainer database (`EH-INT-07`) | all 7 + free text | `eed8f7c` | 20/20 file |
| Notification log (`CAP-07`) | search, send status, channel | `7142877` | 31/31 file |

Each chip drops **exactly its own dimension** — the point of the pattern over
the pre-existing single "clear all", and what the new test on each page
asserts.

Two rules the chips had to respect rather than re-implement:
- **Agreements** — the milestone chip re-uses `content.milestone(...)`, the same
  wording the Select builds from the offsets the **console serves**, so a chip
  can never name an offset this deployment does not hold (`BR-0705`).
- **Trainer database** — the domain chip resolves its label from the served
  `availableDomains` taxonomy (`Q16`), never a list the page carries. If the
  taxonomy no longer holds the id, the chip still appears carrying the id: a
  narrowing the reader cannot see is worse than an ugly one they can remove.

All five are **presentation-only over existing filter state** — no new fields,
no new service calls, no contract change — which is why they carry no risk
against the live API the server runs on.

**Not applied** to the trainer-side lists (My Applications, Engagements): they
have no filter controls, and the pattern is not a reason to invent some.

⚠️ **Environment trap — an unidentified flake.** One full-suite run failed 1/685
and I did not capture which test; the same command then passed 685/685 twice,
and the notification-log file passed 4/4 in isolation. Recorded rather than
buried: if a single-test failure appears in a future `validate:expert-hub`,
capture the output before re-running — it may be this one, and it is not yet
diagnosed.

### Phase 6 — Detail-page consistency pass (2026-09-14)

Surveyed all 12 detail pages on a presence/absence matrix (back affordance,
breadcrumb, head anatomy, focus handling) rather than by eye. Three findings,
two fixed and one deliberately left alone.

**1 — An action that blanked the workspace (`8b89af3`).** Two pages bump
`reloadKey` after an action rather than only on a retry: matching (nominating)
and engagement detail (withdrawing). Both load effects called
`setPhase('loading')` unconditionally, so the action tore the whole view down
to a skeleton and rebuilt it. Three defects in one shape:

- the page blanked at the moment the reader committed to something;
- focus landed on `<body>` — a keyboard reader at the bottom of a ~1340px page
  lost their place, with no way to have asked for it;
- on engagements it destroyed the `role="status"` withdrawal confirmation
  before it had reliably been announced.

Only a first arrival shows the skeleton now. Matching also sends focus to the
outcome its decision produced (`eh-decided-heading`) — the two-ref shape the
service-request and application detail pages already used. **Swept the other
ten:** their only other `setReloadKey` is the error-state retry, where the
skeleton is correct; and the four pages keyed on `detail?.id` are safe, because
the id is stable across a refetch so the effect does not re-fire.

**2 — Head treatment split three ways (`b338d96`).** Five pages opened with an
elevated summary card, six with a bare head on the subtle ground, one with a
hero band. The split fell *inside a single journey*: walking screening →
interview → committee → agreement, the head appeared as a card, vanished for
two steps, and came back. All six bare heads now use the same card, matching
`ScreeningDetailPage.module.css` down to the tokens. Interview additionally
shows the reference its breadcrumb and document title already carried.

**3 — The `display-md` / `display-lg` split: left alone, on purpose.** It looks
like noise and is not. `display-lg` marks the four-step application-review
journey reached from the inbox (3 crumbs, eyebrow above the name);
`display-md` marks standalone record pages. Public trainer profile keeps its
full-bleed hero band — it is a public page, not a workspace.

Verified by **screenshot before and after** at 1360px signed in as `internal`
(`heads.mjs`, scratchpad), not by reading the diff. 686/686.

⚠️ **Environment trap — the preview build bakes the dev role.**
`VITE_EXPERT_HUB_DEV_ROLE` is read at *build* time, so a preview built without
it answers 403 on every internal route and a sweep reports
«لا تملك صلاحية الوصول» as the `<h1>` for all of them. Set it before
`npm run build:expert-hub`, not before `vite preview`.

### Phase 7 — Trainer-portal survey (2026-09-14)

Same presence/absence matrix, run over the nine trainer-portal routes.

**The blanks-on-action pattern is on two more pages** — `MyEngagementsPage`
(answering an offer, 2 call sites) and `MySubmissionsPage` (a successful
upload). Both now guard the skeleton behind `loadedOnce.current`, as
`EngagementDetailPage` already did. Added a test pinning that answering an
offer moves focus to the section the result lands in — a contract nothing
covered before.

**Corrections — claims made during phase 6/7 that turned out to be wrong:**

1. **"Focus failed against an unmounted node on `MyEngagementsPage`."** False,
   and caught by deliberately reverting the guard and re-running the new test:
   it passed either way. `justResponded` *survives* the loading phase, because
   the focus effect returns early rather than consuming the flag while
   `phase !== 'ready'`. Focus arrived correctly even with the blank. The comment
   in the source has been rewritten to say what is actually true, and the test
   now states in its own body that it does **not** cover the skeleton guard.
2. **`AssignmentMatchingPage` is the one place focus genuinely landed on
   `<body>`** — proven, by a test that failed before the fix and passes after.
   Do not generalise that finding to the other pages; it was specific to an
   unguarded `[phase]` effect with no `loadedOnce`.
3. **"The `role="status"` confirmation was destroyed before it had reliably been
   announced"** (phase 6, engagement detail) is an *inference* about aria-live
   remount behaviour, not something measured with a screen reader. The blank
   itself is real and observed; the announcement claim is not verified.

**Head treatment finished.** `EngagementDetailPage` was the last detail page
with a bare head while `ApplicationDetailPage` beside it carried the card. It
now matches. The rule across the product is settled: **detail pages open with
an elevated summary card, list pages with a bare head** — internal and trainer
sides alike. `PortalHomePage` and `MyProfilePage` keep their bespoke hero
bands, and `PublicTrainerProfilePage` its full-bleed band; those are entry
screens, not record views.

#### ✅ CLOSED in phase 8 — see below. Original finding kept for the reasoning.

#### Finding — full-page error states had no heading at all

Verified on the trainer application-detail not-found state: the page renders
`<Section aria-label>` → `<Container>` → `<ErrorState>` → a back button, and
**nothing else**. `ErrorState` composes `Alert`, which does not render a
heading element, so the page has **zero headings** — not merely no `<h1>`.
A reader navigating by heading finds nothing; the `aria-label` on the region
is the only thing naming the page.

Scope: the **full-page early-return** branches only. The many list pages that
render `ErrorState` *in place of their table* already have their `<h1>` and are
fine. Roughly eleven detail/console pages are affected, and they are close to
identical:

```tsx
<Section aria-label={copy.title}>
  <Container size="prose">
    <ErrorState title={copy.title} description={copy.body} onRetry={…} />
    <div className={styles.errorHome}><Button href={…}>{back}</Button></div>
  </Container>
</Section>
```

Recommended fix — **one shared `PageLoadError` component** in
`shared/components/`, not eleven hand-edits: promote `copy.title` to a real
`<h1>` and drop `ErrorState`'s `title` prop (it is optional in the DS API), so
the page says what it is and the alert says what went wrong, without printing
the same string twice.

**Deliberately not done in this session.** It changes the visual of every error
state in the product, and a partial conversion would create a *new* split
(some error states with a heading, some without) — worse than either end state.
It wants an explicit go-ahead, then doing in one pass.

**What the skeleton guard is and is not backed by:** the blank it removes is a
transient frame, so it is **not covered by an automated test** on any of the
four pages — it rests on reading the effect order. Worth knowing before
treating these as regression-proof.

### Phase 8 — `PageLoadError`: every failed page now says what it is (2026-09-15)

Done on the user's instruction to carry the open finding through rather than
leave it for a go-ahead.

**Scale correction.** The finding above estimated "roughly eleven" branches.
The real number is **31 blocks across 30 files** — nearly three times the
estimate. The estimate came from counting detail pages; it missed the consoles,
the admin screens, the portal home, the activation page and the public profile.

**One component, not thirty hand-edits.**
`shared/components/PageLoadError.tsx` promotes the title to a real `<h1>` and
drops `ErrorState`'s `title` (optional in the DS API), so the page says what it
is and the alert says what went wrong — the string is not printed twice. The
`<h1>` carries `tabIndex={-1}` but the component **never focuses it**: pages own
their focus effects and those are gated on a ready phase, so focusing from here
would fight them.

**Method.** A conservative codemod (`convert.py`, scratchpad) that rewrote only
blocks matching the exact shape and reported anything else. Six files were
correctly left alone — their `ErrorState` is *inline*, on a page that already
has its `<h1>`. Then `prettier` was run, which reformatted 36 unrelated files;
those were reverted so the commit carries the conversion only.

**A real bug fell out of it.** `AssignmentMatchingPage` computed the 403-aware
`describeLoadFailure` result and then **ignored it**, rendering the generic
"failed to load" wording *with a retry button*. So a permission denial told
staff their system had broken and offered to retry — which produces the same
403. It now uses `failure.title` / `failure.body` / `failure.canRetry`. This was
invisible until the conversion made the unused variable a type error.

**Verified**: all four error/denial states carry exactly one `<h1>`
(`err.mjs`, scratchpad) — not-found on two records and two denials, no console
or page errors. Route-level 403s are a different path (a dedicated denial
screen) and already had a heading. Regression guard added to
`TrainerSearch.test.tsx`: the not-found state must expose a level-1 heading.

687/687, build green.

### Phase 9 — Prototype parity: the sixteen internal staff screens (2026-09-15)

**Asked:** *"still this desgin not the same as the website have https://claude.ai/artifact/MxBxgoU5xTgmGpCPM17Pa4 … make sure everything is the same as prototype 100%"*.
The reference is the approved artifact **«Option B — شاشات الموظف الداخلي (الجزء ١)»**, which has sixteen frames.

**Correction to phases 3–4.** Those phases marked these routes "✅ Option B" and
called the screening page "already exemplary … No changes required". That
verdict was measured against the Option B *specification*, **not against the
prototype frames**. Put next to the frames, every screen differed in its
*anatomy*:

- the prototype has a compact record head (avatar, fact line and status tags in one card);
- panels carry an icon title bar;
- lists are one card holding a toolbar, a flush compact table and a pagination footer;
- decisions sit in an inline panel.

The live pages were page-level `Section`/`Container` stacks of stroked cards.
Phases 3–4 still hold for data, routing, permissions and a11y. They do **not**
hold for visual parity.

**One kit, not sixteen page styles.** The prototype's repeated anatomy became an
app-level composition kit in `shared/workspace/`. It is built from `@ds` `Card`,
`Typography`, `Avatar` and `Icon`, uses tokens only and logical properties, and
**changes nothing in `@ds`**:

| Part | Prototype anatomy it reproduces |
|---|---|
| `WorkspacePage` | The page frame: one column, the page container width, the stack rhythm. It replaces `Section` + `Container` on staff pages. |
| `PageHead` | Breadcrumbs, then `display-lg` title, lead, a `role="status"` summary line, and actions pushed to the end. |
| `RecordHead` | The record card: avatar (or icon tile) and bold title, then a fact line of separate `<span>`s joined by `·`, then status tags and actions. |
| `Panel` | The panel: elevated card, `bar` (icon tile + title + meta + actions on a ruled bar) or `inline` (title in the body), optional toolbar and footer regions, and a `flush` body for edge-to-edge tables. |
| `IconTile` | The tinted square behind panel and record icons (primary-50 / primary-100 / primary-700, with warning and error tones). |

**Screens recomposed, frame → route:**

| # | Frame | Route | What changed |
|---|---|---|---|
| 1 | Application inbox | `/internal/applications` | One panel: toolbar (search, status, clear, chips), then a flush compact table, then a footer with "عرض ١–١٠ من ١٤" and small pagination. The "فتح" link became a small secondary button. |
| 2 | Screening | `/internal/applications/:id` | Record head with a fact line (reference, submitted on, services, source, SLA) and tags. The decision panel is inline. The tabs sit inside a flush panel. The score is one line over a compact table. |
| 3 | Interview | `…/interview` | The ticket card was folded into the record head: facts in the fact line, reschedule and join as actions. `InterviewTicketCard` was deleted. Evaluation comes first, then committee responses, result and decision. |
| 4 | Committee | `…/committee` | Record head, then combined results, bank gate, member decision and approval sequence as panels. |
| 5 | Agreement preparation | `…/agreement` | Order is decision → formation → preparation → sequence → send. The page stylesheet was deleted. |
| 6 | Service request | `/internal/service-requests/:id` | `1fr 20rem` grid; trainer context is a bar panel; the decision is an inline panel. |
| 7 | Assignment requests (+ new) | `/internal/assignments`, `…/new` | Page head and list panel. |
| 8 | Matching | `/internal/assignments/:id` | The summary shows the pool size; run engine and send pool are head actions; the workspace grid is 1.7fr/1fr. |
| 9 | Trainer search | `/internal/trainers` | Page head, then a toolbar panel with results. |
| 10 | Trainer profile | `/internal/trainers/:id` | Record head and panels. **Tabs deliberately not added** (see deviations). |
| 11 | Agreements | `/internal/agreements` | Page head and list panel. |
| 12 | Submission review | `/internal/submissions/:id` | Queue layout; `SubmissionRounds` gained `showHeading`. |
| 13 | Entitlements | `/internal/entitlements` | Toolbar panel. |
| 14 | Permission matrix | `/internal/access/permissions` | Area nav became a tab strip; the matrix is flush in its panel with table-token headers and zebra rows. |
| 15 | Notification matrix | `/internal/notifications/matrix` | The same tab strip; rules are ruled console rows. |
| 16 | SLA console | `/internal/sla` | Page head and panels. |

The same kit was applied to the internal pages the prototype does not draw, so
the staff side stays one product:

- service-request list;
- submission queue;
- notification log and templates;
- user-role assignment;
- agreement detail and template;
- slot re-routing;
- the dashboard's page frame.

**Method: the tests were the spec.** No test file was changed. Every failure
was fixed in the component:

- **Fact line.** `RecordHead` facts in one `<p>` broke `getByText`, so each fact is now its own `<span>`.
- **SLA badge.** `slaWiring` expects the badge to carry the SLA label, so the countdown moved into the fact line.
- **Duplicate names (two pages).** A toolbar region and a panel `label` repeated their field's label, and the tests hit "multiple elements". Both labels were removed.
- **`closest('div')` tests.** These put a panel heading inside the body.

**A mobile bug the sweep caught.** At 390px the permission matrix pushed the page
to 1049px. The table itself scrolled correctly inside `.matrixFlush`. The
page was widened by the DS checkboxes' **visually-hidden labels**: they are
`position: absolute` with no positioned ancestor inside the scroller, so their
containing block was the page and `overflow-x: auto` never clipped them. The fix
is `position: relative` on the scroller, which makes it their containing block.
The same trap waits for any `@ds` form control placed in a non-positioned
horizontal scroller.

**Verified.** The preview build was swept with Playwright on Edge, and each
prototype frame was compared against the matching route at 1360px:

- **Desktop, 1360px:** 25 routes (16 frames, the new-assignment form, the dashboard and 7 more), correct `<h1>`, 0 overflow, 0 page errors.
- **Mobile, 390px:** the same 25 routes, 0 overflow, 0 page errors.
- **Validation:** 687/687 tests (47 files), type-check, `lint:expert-hub` (1 pre-existing warning, `InterviewSlotsField.tsx`) and `lint:css` all pass; the build is green.

**Deviations — the prototype is not copied here, and why:**

- **DGA component skins stay.** The DS `Header` stays, not the prototype's compact bar. So do DS `Pagination`, the DS tab divider, the DS checkbox and DS button heights (24/32/40). CLAUDE.md makes the DS the source of truth where a reference conflicts with it. Replacing them is a DS task, or a product-owner ruling, not a page edit.
- **No inbox "service" or "duration" filters, and no Export.** The inbox endpoint accepts only `page`, `pageSize`, `search` and `status`. A control that does nothing would be a fabricated feature.
- **No tabs on the trainer profile.** J-15/F1/AC-1 asks for one screen, and a test asserts there is no `tablist`.
- **No KPI tiles on the agreements list.** The data has no per-status counts, and invented figures are ruled out (absence ≠ zero).
- **Different workflow stages.** The mock records sit at other stages than the frames show, so some panels differ in *content* while matching in *anatomy*.
- **Brown table text not reproduced.** In the prototype's CSS, a `.tw` class collision turns table text brown. That is an artifact bug, not a design intent.

**Seen, not caused here.** At 390px the shared DS `Header`'s «المزيد» trigger
overlaps the logo wordmark. No shell or `@ds` file changed in this phase. The
overlap is logged as an open item and was not investigated.

687/687, build green.

## Runtime verification sweep (authenticated, 2026-09-14)

Driven with Playwright against the **production preview build** (`vite preview`), signed in through the dev callback as `internal`. Script: `shoot.mjs` (scratchpad) — navigates each route, asserts an `<h1>`, captures a full-page screenshot, and records console/page errors.

**Result: 18/18 routes render with the correct heading and ZERO console or page errors.**

| Route | h1 | Verdict |
|---|---|---|
| `/internal` | مرحبًا، موظف تجريبي | ✅ Option B (KPI row, queue, SLA meters) |
| `/internal/applications` | صندوق الطلبات | ✅ elevated filter panel + white table + pagination |
| `/internal/service-requests` | طلبات إضافة الخدمات | ✅ filter Card + table |
| `/internal/assignments` | طلبات الإسناد | ✅ |
| `/internal/trainers` | قاعدة المدربين | ✅ |
| `/internal/agreements` | إدارة الاتفاقيات | ✅ |
| `/internal/submissions` | المواد والمحتوى بانتظار الاعتماد | ✅ |
| `/internal/entitlements` | المستحقات المالية | ✅ |
| `/internal/access/permissions` | مصفوفة الأدوار والصلاحيات | ✅ tabs + impact alert + matrix on white |
| `/internal/access/users` | المستخدمون والأدوار | ✅ |
| `/internal/notifications/matrix` | مصفوفة الإشعارات المركزية | ✅ |
| `/internal/notifications/templates` | قوالب الرسائل ثنائية اللغة | ✅ |
| `/internal/notifications/log` | سجل الإشعارات | ✅ |
| `/internal/sla` | إدارة المهل الزمنية | ✅ |
| `/directory` | دليل الخبراء والمدربين | ✅ |
| `/login` | (redirects when signed in) | ✅ correct behaviour |
| `/unauthorized` | لا تملك صلاحية الوصول | ✅ |
| `*` (not found) | الصفحة غير موجودة | ✅ |

### Trainer-portal sweep (role: `trainer`, 2026-09-14)
Rebuilt with `VITE_EXPERT_HUB_DEV_ROLE=trainer` and swept the portal routes — **7/7 render with the correct `<h1>`, no console/page errors**: `/home` (مرحبًا، خبير تجريبي) · `/applications` (طلباتي) · `/engagements` (ارتباطاتي) · `/submissions` (رفع المواد والمحتوى) · `/entitlements` (مستحقاتي المالية) · `/profile` · `/applications/new` (طلب انضمام جديد).

Findings and actions:
- **Portal Home metric tiles were the old pattern** (icon + decorative dash, figure, then label) while the staff dashboard had moved to icon + label → figure. **Normalized** `HomeMetricCard` to the shared KPI tile so a metric reads identically on both sides of the product (Phase 4 consistency). Portal Home tests 14/14 green.
- **New Application (`/applications/new`) already satisfies Option B §4** — breadcrumbs, draft-resumed alert, a correct RTL 4-step indicator, grouped service selection with a visible selected state, save-as-draft + next, and a last-saved timestamp. It is the highest-regression-risk page in the product, it is already compliant, so it was **deliberately left untouched** ("never trade a working feature for a cleaner screen").

### Detail journeys + permissions + responsive (2026-09-14)
- **Detail pages verified** with real mock ids — screening (`app-3003`), interview (`app-3005`), committee + agreement preparation (`app-3008`), trainer profile, and an unknown id. All render, no console/page errors, **zero horizontal overflow**. The screening page is already exemplary Option B: breadcrumbs → identity/status header card → objective-score table on white → assist panel with its caveat alert → collapsible data sections → attachments → decision panel with permission-scoped actions. No changes required.
- **Permission path proven end-to-end:** the same detail sweep run against a **trainer** build renders «لا تملك صلاحية الوصول» on every `/internal/*` route — the guard denies, the 403 page renders properly, and nothing errors. Allowed vs unauthorized both covered.
- **Responsive:** `/home` and `/applications` measured at mobile 390×844, tablet 834×1112, desktop 1440×900 — **overflow = 0px at every size**, no page errors. Mobile is genuinely usable, not merely non-overflowing: nav stacks, KPI tiles go 2×2, the table becomes cards with status tags, filters stack, pagination stays. No feature is hidden to solve mobile.
- **Async/empty/error states** are covered by the 682-test suite (each list/detail page has explicit load-failure-with-retry, empty, and no-results tests).

### English LTR
Toggled to English on the dashboard and inbox: `document.dir` flips to `ltr`, the whole layout mirrors correctly (header, KPI row, work-queue rows, SLA meters, footer), Arabic applicant names still render RTL inside the LTR page (`<bdi>` doing its job), and there are **no page errors**. Screenshots: `shots/ltr-dashboard.png`, `shots/ltr-inbox.png`.

**Finding that changed the plan:** the application was already consistently built on `@ds` (`Card`, `Breadcrumbs`, `Table`, `Tag`, `EmptyState`/`ErrorState`/`Loading`), so Option B did **not** require rewriting page internals. The lift came from three shared changes — the subtle page ground, the table surface fix, and the header IA — plus the dashboard rebuild. Remaining per-page work is verification and targeted deviations, not reconstruction.

## Landing page — approved, visuals only

**Owner ruling (2026-09-14):** *"keep the landing page as it is because it's approved … the structure and content is approved but improve the visualisation"*, and *"suggest picture places"*. So the landing page's **structure, sections, order, and copy are frozen**; only presentation may change.

Applied (CSS-only, `LandingPage.module.css`, token-only):
- Photographs (`.sectionImage`, `.bannerImage`) are now **framed** — hairline stroke + card shadow — so a photo reads as an intentional media panel, not a bitmap dropped on the page.
- `.eligibilityNumber` gains a soft `primary-50` ring (lifts the marker without a new colour).
- `.timelineMarker` gains a background-coloured ring so it punches through the connector line instead of sitting on a visible seam.

### Suggested picture places (for the owner to supply art)
Existing: `expert-about.png` (About panel), `students_gateway_why_us_500kb.webp` (Why-join banner).

| # | Where | Suggested image | Ratio | Notes |
|---|---|---|---|---|
| 1 | Hero, beside the copy | A trainer mid-session / Academy venue | 4:3 or 16:9 | Today the hero is pattern-over-tint; a real photo would make it the page's focal point. Keep text on the start side. |
| 2 | "أهداف المنصة" (goals) | One supporting photo or a per-goal icon strip | 16:6 banner | Section is currently text+icons only. |
| 3 | Collaboration timeline | Small portrait/scene per step (4) | 1:1 | Optional; humanises the 4-step path. |
| 4 | Eligibility / join guidelines | One photo beside the numbered list | 4:3 | Balances a long list. |
| 5 | Final CTA band | Subtle background photograph behind the tint | 21:9 | Must stay readable — overlay the existing `primary-25` tint. |
| 6 | Directory result rows (`/directory`) | Trainer avatars (real photos) | 1:1 | `Avatar` already falls back to initials; `G26` blocks upload today. |

All slots are **data-shaped** (`imageUrl` → placeholder when null), so real art drops in with no layout change.

## Notes / deviations
- **App Sidebar Nav** (registry) intentionally **not** used: the product IA is the shared top header for all personas; Option B is applied via the top header + "More" overflow instead. Documented deviation.
- Trend Indicator / week-on-week deltas intentionally **absent** on KPI tiles: `submissionDelta` is `null` in the data (absence ≠ zero).
- Production `@ds` unchanged throughout.
