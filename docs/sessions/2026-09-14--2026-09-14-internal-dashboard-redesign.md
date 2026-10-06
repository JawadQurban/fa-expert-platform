# Internal Dashboard (EH-INT-01) — assessment, three design alternatives, and the "Operational" redesign

## 1. Resume here

| | |
|---|---|
| **Branch** | `main` (fast-forwarded) |
| **Head commit** | `a561600` — feat(expert-hub): recompose internal dashboard to operational layout (EH-INT-01) |
| **Pushed?** | **No — `main` is ahead of `origin/main` by 1.** The server pulls from the remote, so nothing can be built there until this is pushed. |
| **Release tag** | none new (latest existing: `expert-hub-v1.3.0`, `v0.6.0`) |
| **Deployed** | Not deployed. Server build/deploy is pending the push. |
| **Validation** | `npm run validate:expert-hub` → **682/682** tests (47 files) ✓ · `npm run build:expert-hub` ✓ · confirmed rendering live at `/expert-hub/internal` |
| **State** | EH-INT-01 recomposed to the "Operational" layout (design **Alternative B**), preserving all data/routing/permissions/a11y. |
| **Next action** | `git push origin main`, then on the server: `cd deploy/expert-hub/scripts && ./build-expert-hub.sh && ./deploy-expert-hub.sh "$(cat .last-built-tag)"` |

**Reading order:** this record → the three design artifacts (URLs in §3) → `docs/expert-hub/PROPOSED_COMPONENT_REGISTRY.md`.

**Mock-data caveat:** the dashboard runs entirely on the `internalService` **mock** (`getDashboard()`), not a live API. The figures are real *outputs of that mock*: metric counts 3 / 3 / 3 / 2 / **0** (materials tile is genuinely 0 — the mock has no submission seed), `totalOpen = 12`, `submissionDelta = null` (so **no** week-on-week deltas render), and exactly two SLA rows (`SLA-0201`, `SLA-0202`). Swapping to the HTTP provider is configuration, not a UI change.

---

## 2. What was asked, in order

1. **`/design-login`, then:** "Review the current dashboard implementation. Do NOT modify anything yet." Analyze UX / layout / visual hierarchy / spacing / typography / information density / responsive / accessibility / RTL. "Use @ds as the design-system source of truth." Improve visual design "while preserving: functionality, API integration, business logic, routing, permissions." "First give me the design problems you identify."
2. **"Start the design work now… Create the three design alternatives now":** A — Clean Executive Layout, B — Modern Operational Dashboard, C — High-Density Data Workspace. Use the Figma MCP "actively while designing," update a proposed component registry, and — emphatically — "Produce **Actual Designs** … Create the actual visual designs in Claude Design. I want to review real design outputs, not another analysis document." RTL from the start, WCAG 2.2 AA, `@ds` **read-only**.
3. **Chose B, with corrections:** *"i think B is good choise but it should be use the APIs and data from the real one, and the dsgin should be consistanse for all personas and the colours and font should be clear and follow the design system we have."*
4. **"no start"** → proceed with the React implementation of B (no further refinement).
5. **"1"** → run the app and screenshot `/expert-hub/internal` to visually confirm.
6. **"comit and give me comand to build it on the server."**
7. **"mirge it"** → merge the feature branch into `main`.
8. **"save this session using the skill."**

---

## 3. What shipped

### Assessment (analysis only, no commit)
Grounded in the actual `@ds` tokens (`src/design-system/tokens/generated/tokens.css`) and component CSS. Headline problems: the page was **flat** (white `#fff` cards with `effect="stroke"` on a `#fcfcfd` ground, plus hand-rolled tiles at the *same* colour as the page — separated only by hairlines); **flattened hierarchy** (h1 at `display-md` 24px = the metric numbers; section h2 = quick-card titles); a **weak hero**; **redundant navigation** (an 8-card quick-links grid duplicating the header); a **4+1 metric-row orphan** from `auto-fit`; a fixed 48px hero inline-padding cramping mobile; and an **eyebrow contrast** ≈ 3.8:1 (below AA for 14px bold). RTL and a11y were already strong and were preserved.

### Three design artifacts — **Claude Artifacts** (hosted on claude.ai, *not* in the repo)
Built as self-contained Arabic-RTL HTML pixel-faithful to the FADS tokens. These are review surfaces, not code:
- **A — Clean Executive Layout:** https://claude.ai/code/artifact/c904b094-9c94-4f98-aa92-5b3f9a6013ce
- **B — Modern Operational Dashboard (v2, real data + DS shell):** https://claude.ai/code/artifact/ca01bb25-ea7a-4ccd-9754-d2412324197d
- **C — High-Density Data Workspace:** https://claude.ai/code/artifact/430ba5b7-fb3b-40cc-9538-0d9d48cfbc01

Recommendation given: **B** as the default home, with A's executive band and C's workspace as two "zoom levels" of the same product.

### Proposed component registry — `a561600`
`docs/expert-hub/PROPOSED_COMPONENT_REGISTRY.md` — 18 entries (KPI/Stat Card, Trend Indicator, Sparkline, SLA Health Meter, Filter Bar, Data Toolbar, Saved View Selector, Filter Chip, Bulk Action Bar, Side Inspector, Status Summary Bar, Work-Queue Row, Alerts Feed, App Sidebar Nav, Density Toggle, Column Config …) each classified `PROPOSED_DS_COMPONENT` / `PROPOSED_VARIANT` / `APPLICATION_COMPONENT` / `PAGE_ONLY` with anatomy / variants / states / a11y / RTL / responsive / ownership. **Production `@ds` untouched.**

### The B implementation — `a561600`
`InternalDashboardPage.tsx` + `InternalDashboardPage.module.css` recomposed.
- **Technique that matters for the next session:** this was a **composition/CSS recompose that preserves every tested DOM/aria contract** (greeting `h1#eh-dashboard-title`, the five metric-tile links + their drill-in `href`s, the recent list + "view all" link, the quick-links `region`, the SLA table's null-handling, the distribution list, the error/403/loading/empty branches). The test file was the spec; nothing in it was changed and all 14 dashboard tests stayed green.
- Compact page head replaces the branded-pattern hero; the shared three-level DS `Header` (from `ExpertHubShell`) is the shell, not a second banner. Two-column working area (recent-submissions queue peek leads; deadline performance + stage distribution beside it). Metric tiles → **fixed** responsive columns (5/3/2, no orphan). Queue rows gained DS `Avatar` initials; cards switched to the elevated (shadow) DS variant for depth; the marketing quick-start media-placeholder card was dropped. Token-only + logical properties, **no new visual values**.

---

## 4. Verbal rulings

| Ruling (user's words) | What it changed |
|---|---|
| "it should be use the APIs and data from the real one" | Design **and** implementation bound to `internalService.getDashboard()`; **fabricated KPI trend deltas removed** because `submissionDelta` is `null` (absence ≠ zero, the codebase's own rule). Real `MOCK_INBOX` records, statuses, and SLA rows used. |
| "the dsgin should be consistanse for all personas" | Dropped the bespoke dark sidebar from the B prototype; the redesign uses the **same `ExpertHubShell` + DS `Header`** every persona (public / portal / internal) already renders — only the nav set differs by role. |
| "the colours and font should be clear and follow the design system" | Light DS palette only; status via the DS `Tag` variant map from `ApplicationStatusBadge` (all mid-pipeline = `information`); `IBM Plex Sans Arabic` family stack + the DS type scale. |
| "@ds is READ ONLY" / "Do not modify production @ds" | Every new component is **proposed only** (registry doc). No file under `src/design-system/**` was changed. |
| "i think B is good choise" | B selected as the single implementation target. |
| "mirge it" | Merged the feature branch into `main` (fast-forward). |

---

## 5. Corrections — mandatory

1. **The B prototype invented data and the wrong shell.** It showed week-on-week KPI deltas ("+٦ / −٣") and a **dark left sidebar**. Both were wrong against the real system: `getDashboard()` returns `submissionDelta: null` (so *no* delta may render), and the real app already gives every persona the **light three-level DS Header** — there is no sidebar anywhere in FADS. Corrected in the B v2 artifact and in the shipped code.
2. **Invented applicants/counts.** The prototype used made-up names/numbers. The real mock (`mockInternalProvider.ts` → `MOCK_INBOX`) has specific records (`د. سارة العتيبي` / `EH-2026-00212`, …), maps all mid-pipeline statuses to the `information` Tag variant, and returns `0` for the materials tile. The implementation uses the real data path; the v2 artifact was rebuilt on the real values.
3. **"I'll screenshot it with headless Chrome" — Chrome failed silently here.** On this Windows box, `chrome.exe --headless=new --screenshot` produced nothing (exit 1, no output). Root cause: the deeply-nested scratchpad `--user-data-dir` path overflowed Windows `MAX_PATH`, breaking Chrome's cache dirs. Also **`--virtual-time-budget` broke the screenshot in both Chrome and Edge.** What worked: **Playwright's `screenshot` CLI** driving **installed Edge** (`npx -y playwright@latest screenshot --channel msedge …` — no browser download) with `--wait-for-selector`. First attempt still caught the *loading* state because I waited on the always-present `#eh-dashboard-title`; the fix was to wait on a **loaded-only** element (`text=أحدث الطلبات`) plus a short `--wait-for-timeout`.
4. **`npm run dev:expert-hub -- --port 5199 …` mangled the args.** npm forwarded them such that Vite ran as `vite --config … 5199 127.0.0.1`, treating `5199` as a **positional project root** → server rooted at a bogus dir → 404 on every URL. Fix: run with the env var only and let Vite auto-pick a free port.
5. **Pre-existing, not introduced this session:** the distribution panel renders the raw code `awaiting-committee` because the mock emits a status that has **no Arabic label** in the `statuses` map, and `StageDistribution` falls back to the raw string. Worth a one-line content fix.

---

## 6. Where it stands

**Complete:** assessment; three design artifacts; proposed registry; the B implementation; validation (682 tests + build); a live-render check; commit `a561600`; merge to `main`.

**Blocked on someone else (not on work):**
- **Server deploy** is blocked only by the **unpushed commit** — `main` is 1 ahead of `origin/main`. Push, then the deploy scripts run.

**Not started (deferred, by choice):**
- **Increment 2** — the `getInbox()`-backed *filterable* work queue (the one B feature intentionally deferred; the dashboard is read-only per §7, so filtering currently lives in the inbox and the dashboard shows a peek from `data.recent`).
- The `awaiting-committee` Arabic label fix (correction #5).
- Removing the now-unused `MediaPlaceholder.tsx` (dropped from the page; the file still exists).

**Environment note:** the Figma read-only MCP tools (`get_design_context`, `get_screenshot`, …) were **not connected** this session — only an OAuth-handshake tool was exposed. Per the user's own rule, the work was grounded in the **synchronized `@ds`** (whose CSS is itself Figma-verified) instead.

---

## 7. Open questions, by who can answer them

**Product owner**
- Is dropping the quick-start "guide" card and demoting the quick-links grid acceptable long-term? (Quick-links `region` was *kept* — the tests require nominate + directory there — but it is no longer the page's focus.)
- Should the dashboard gain the full `getInbox()` filterable queue, or stay a read-only peek (respecting §7 "no state created")?

**Data / content**
- `awaiting-committee` needs an approved Arabic label (or the mock should stop emitting a status with no label).

**Technical / infrastructure**
- Confirm the server's `deploy/expert-hub/.env.expert-hub` runtime values (`EXPERT_HUB_API_BASE_URL`, SSO entry URL, telemetry) before the deploy replaces the container.

---

## 8. Where it stopped

The user asked to save the session. Immediately before that, `main` was fast-forwarded to `a561600` and left **unpushed**. The proposed and agreed next step is **`git push origin main`**, after which the server build is a two-command run (build → deploy, both health-gated, in `deploy/expert-hub/scripts/`). Nothing is half-done; the only thing standing between this and a live deploy is the push, which the user has not yet authorized.

---

## 9. Resuming

```bash
# Repo root is the NESTED folder (the wrapper is not a git repo).
R="…/financial-academy-hackathon/financial-academy-hackathon"

git -C "$R" status -sb            # expect: main, ahead of origin/main by 1
git -C "$R" push origin main      # the pending step

# Validate (from the frontend dir):
cd "$R/frontend" && npm run validate:expert-hub   # 682/682 expected
npm run build:expert-hub                           # then optional

# Server build + deploy (on the server, after it has pulled main):
cd "$R/deploy/expert-hub/scripts"
./build-expert-hub.sh                              # tags :<timestamp> + :latest, writes .last-built-tag
./deploy-expert-hub.sh "$(cat .last-built-tag)"    # health-gated swap, auto-rollback
```

### Environment traps (cost time once; will again)
- **Nested repo:** all `git` ops use the nested `financial-academy-hackathon/financial-academy-hackathon` path — the wrapper folder is not a repo.
- **Windows headless screenshots:** `chrome.exe --headless` fails on long `--user-data-dir` paths (MAX_PATH) and both browsers break with `--virtual-time-budget`. Use **`npx playwright screenshot --channel msedge`** with a short profile dir and **`--wait-for-selector` on a loaded-only element** (not the always-present heading).
- **`dev:expert-hub` arg forwarding is broken:** do **not** pass `-- --port …`; it becomes a Vite positional root and 404s everything. Run with the env var only; Vite picks a free port.
- **Dev auth has no persona picker:** set `VITE_EXPERT_HUB_DEV_ROLE=internal` and navigate to `/expert-hub/auth/callback` — the dev placeholder mints a `sessionStorage` session (ignores `code`/`state`) and redirects staff to `/internal`.
- **CSS lint scope:** `scripts/verify-css-rules.mjs` (DC-04/DC-23) scans **only** `src/design-system/**`, not app CSS — but keep app CSS token-only + logical-properties anyway (CLAUDE.md).
