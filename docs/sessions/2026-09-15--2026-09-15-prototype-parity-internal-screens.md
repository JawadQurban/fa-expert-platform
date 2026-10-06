# Prototype parity — the sixteen internal staff screens (Option B, part 1)

## 1. Resume here

| | |
|---|---|
| **Branch** | `expert-hub/prototype-parity`, branched from `main` |
| **Base commit** | `171bcc5`, "fix(expert-hub): every failed page now says what it is". It was in sync with `origin/main` when the session started. |
| **Committed?** | **Yes, on branch `expert-hub/prototype-parity`, pushed to `origin`, not merged.** `main` is untouched at `171bcc5`. The commit carries the 82 changed tracked files (+3,639 / −4,303, three of them deletions), the 10 new `shared/workspace/` files (586 lines) and these docs. The untracked `graphify-out/` was left out. **Since then, uncommitted:** `frontend/vite.expert-hub.config.ts` (vendor chunk, §3 follow-up) and this record. |
| **Release tag** | None new. The latest are `expert-hub-v1.3.0` and `v0.6.0`. |
| **Deployed** | No. |
| **Validation** | `npm run validate:expert-hub`: **687/687 tests (47 files)**, exit 0. Type-check ✓, `lint:expert-hub` 0 errors with 1 pre-existing warning (`InterviewSlotsField.tsx`), `lint:css` ✓. `npm run build:expert-hub` ✓. |
| **Visual state** | All 16 prototype frames are recomposed. Playwright swept 25 routes at **1360px and 390px**: correct `<h1>`, **0 overflow, 0 page errors**. |
| **Next action** | The user looks at the pushed branch running (on the server: check out `expert-hub/prototype-parity`, then build and deploy) and decides on changes, including the DGA-skin question (§8). Merge into `main` only when they approve. |

**Reading order:**

1. This record.
2. The **Phase 9** section of `docs/expert-hub/OPTION_B_FRONTEND_ROLLOUT.md` (frame → route table and the deviations).
3. `frontend/src/apps/expert-hub/shared/workspace/Panel.tsx`.

**Mock data:** the verification build (`VITE_EXPERT_HUB_DEV_ROLE=internal`) runs on the mock providers. The mock records sit at different workflow stages than the prototype frames show. Where a page matches a frame in *anatomy* but not in *content*, that is the reason. It is not a layout gap.

---

## 2. What was asked, in order

1. `/login`.
2. *"still this desgin not the same as the website have https://claude.ai/artifact/MxBxgoU5xTgmGpCPM17Pa4 , https://claude.ai/artifact/MxBxgoU5xTgmGpCPM17Pa4 make sure everything is the same as prototype 100%"*. The artifact is «Option B — شاشات الموظف الداخلي (الجزء ١)», with sixteen staff-screen frames.
3. After a usage-limit reset: continue the task without repeating finished work. The conversation was also compacted once mid-task. Nothing was redone.
4. *"push it to see it then i will decide the change if needed"*: commit the work and push it, so the user can see it before deciding on changes.
5. `/vercel-react-best-practices`, with no arguments: review the Expert Hub frontend against the rules of that guide that apply to a Vite single-page app (the Next.js and server rules do not).

---

## 3. What shipped

The frame → route table, the kit's parts and the deviations are in **rollout Phase 9**. They are not restated here. What a future session needs in order to stay consistent:

### The workspace kit — `shared/workspace/`
**Technique:** the prototype's repeated anatomy was extracted once. The five parts are `WorkspacePage`, `PageHead`, `RecordHead`, `Panel` and `IconTile`. Pages are now *arrangements* of these parts rather than sixteen sets of page CSS. The parts compose `@ds` (`Card`, `Typography`, `Avatar`, `Icon`) and use tokens only. **Nothing under `src/design-system/**` changed.** Conventions to keep:

- **Panel shape.** `Panel shape="bar"` puts the title on a ruled bar with an icon tile, meta and actions. `shape="inline"` puts the title in the body; decision panels use it.
- **Flush body.** `flush` gives the body no padding, for edge-to-edge compact tables. Toolbar and footer are separate ruled regions.
- **Focus targets.** Post-action focus targets keep their ids through `focusableTitle` + `titleId`: `eh-decision-heading`, `eh-decided-heading`, `eh-actions-heading`. Page titles are `tabIndex={-1}` with `:focus { outline: none }`.
- **Fact lines.** `RecordHead` facts are **one `<span>` each** with `aria-hidden` `·` separators. Do not merge them into one text node; `getByText` depends on it.
- **No title.** A `Panel` with no `title` renders no heading. Pages that need the heading *inside* the body, for `closest('div')` tests, put it there (IdentityCardPanel, agreement history).

### The screens
**Technique: the tests are the spec.** **No test file was changed** (`git status` shows zero `*.test.*` files). Every DOM and aria contract, feature, API call, route and permission was preserved; only composition and CSS moved. Two files were removed:

- `interviews/components/InterviewTicketCard.tsx` and its CSS. Its facts now live in the interview `RecordHead`.
- `agreements/AgreementPreparationPage.module.css`.

Nine internal pages the prototype does not draw got the same kit, so the staff side reads as one product. They are listed in Phase 9.

New content keys, ar and en:

- **internal:** `breadcrumbRoot`, `breadcrumbLabel`, `pagination.range`.
- **screening:** `inboxCrumb`, `submittedOn`, `scores.outOfScale`.
- **interviews, committee, agreements:** `inboxCrumb`.

### The mobile fix — `access/AccessPage.module.css`
**Technique:** a horizontal scroller that holds `@ds` form controls must be a **containing block** (`position: relative`). Otherwise the controls' absolutely-positioned visually-hidden labels escape `overflow-x: auto` and widen the page. See correction 7.

### Follow-up: React best-practices review
The applicable rules (bundle, waterfalls, re-render, rendering, JS) were checked against the Expert Hub frontend, starting with what the parity pass added.

**Already right, no change:**

- All 44 routes are `lazy()` behind `Suspense`, and the build emits 125 chunks.
- Pages that load several things on arrival already use `Promise.all` (matching, permissions, user roles, new application). No waterfall was found.
- The permission matrix resolves each cell from a `Map`, not a search.
- The workspace kit defines no component inside a component and has no `&&` that can render a stray `0`.

**Fixed (uncommitted): the vendor chunk missed the renderer.** `manualChunks` named `react-dom`, but `main.tsx` imports `react-dom/client`, which is a different module id. So the ~540 KB renderer (pre-minify) sat in the entry chunk, whose hash changes on every app deploy.

| Chunk | Before | After |
|---|---|---|
| Entry | 903 KB (gzip 263 KB) | 721 KB (gzip 207 KB) |
| `react` vendor | 104 KB (gzip 35 KB) | 286 KB (gzip 92 KB) |

The total first-visit download is unchanged. The gain is that the renderer now stays cached across Expert Hub deploys. The file is Expert-Hub-only (CLAUDE.md lists it among the Expert Hub assets). Validation 687/687, and a smoke run of 6 routes on the rebuilt preview showed 0 page errors.

**Not fixed, because it is `@ds` scope: the icon library ships whole.** The `Icon` registry imports all **237** SVGs as raw strings into one object map, so none can be tree-shaken. That is **631 KB pre-minify, most of the 721 KB entry chunk**, and it is why the 500 KB warning remains. Expert Hub uses a few dozen icons. The fix belongs in the design system (per-category or per-icon lazy loading, or build-time named exports) as a separate DS task with its own regression run. An app-side alias override would be exactly the local workaround CLAUDE.md forbids.

### Docs
- Rollout **Phase 9**, including a correction to phases 3–4.
- This record and its row in the sessions index.

---

## 4. Verbal rulings

| Ruling (user's words) | What it changed |
|---|---|
| *"make sure everything is the same as prototype 100%"* | The bar moved from *Option B spec compliance*, where phases 3–4 had stopped, to **frame-by-frame parity**: structure, hierarchy, density, card anatomy, alerts, table and head patterns. |
| *"push it to see it then i will decide the change if needed"* | Committed on branch `expert-hub/prototype-parity` and pushed, **not merged**. The user reviews it running first and decides on changes afterwards; `main` stays at `171bcc5` until they approve. |

**Standing rules applied, not given this session:** `@ds` is read-only, and CLAUDE.md makes the DS win where a reference conflicts. That is what limits "100%": the DGA component skins stay (§7). **The user has not ruled on that conflict.** It is the open question in §8.

---

## 5. Corrections — mandatory

1. **"These routes are Option B complete."** Rollout phases 3–4 said so, and called the screening page "exemplary … No changes required". That was measured against the Option B *specification*, never against the prototype frames. Side by side with the frames, every screen differed in anatomy. **Now lives in:** rollout Phase 9, "Correction to phases 3–4".
2. **The prototype's brown table text is not a design colour.** It comes from a `.tw` class collision in the artifact's own CSS. It was not reproduced. **Now lives in:** Phase 9 deviations.
3. **"Verify on the dev server" did not work.** On the Vite dev server (port 5199) with `VITE_EXPERT_HUB_DEV_ROLE=internal`, `/expert-hub/auth/callback` never redirected and a resource returned 404. The likely culprit is the runtime `config.js`, but that is **unconfirmed**. All verification used a **preview build** instead (§9).
4. **`npm run preview:expert-hub -- --port 4173` hit the known arg-forwarding trap.** The 2026-09-14 record documents it for `dev:expert-hub`; it applies to `preview:expert-hub` too. Vite took `4173` as the project root.
5. **The first `RecordHead` broke four tests.**
   - It put the fact line in a single `<p>`, which broke `getByText` in the interview tests and the `slaWiring` "not configured" test.
   - It replaced the SLA badge text with the countdown, but `slaWiring` expects `content.sla.labels[state]`.

   Fixed in the component: one `<span>` per fact, the label restored on the badge, and the countdown moved into the fact line.
6. **Duplicate accessible names on two pages.**
   - The Entitlements toolbar `aria-label` repeated the search input's label.
   - The AgreementTemplate `Panel label` repeated the textarea's label.

   Both caused "Found multiple elements". Both labels were removed.
7. **The mobile overflow was misdiagnosed first.** The probe listed `TABLE._matrix` at 1120px wide and left −747, and the working hypothesis was an unconstrained scroller needing `min-inline-size: 0`. **Wrong.** The scroller measured 356px wide and scrolled its 1120px content correctly. The overflow came from the DS checkboxes' **visually-hidden labels**: `position: absolute`, with a containing block outside the scroller, so the scroller never clipped them. The fix is one declaration, `position: relative` on `.matrixFlush`. **Lesson:** an "elements outside the viewport" probe reports content inside scrollers as offenders. Filter to absolutely-positioned elements before trusting it.
8. **Git Bash rewrote route arguments.** `node overflow.mjs /internal/access/permissions` received `C:/Program Files/Git/internal/access/permissions`. Use `MSYS_NO_PATHCONV=1` and a Windows-style script path.

---

## 6. Where it stands

**Complete:**

- the workspace kit;
- all 16 prototype frames;
- 9 further internal pages;
- the permission-matrix mobile fix;
- validation (687/687) and build;
- desktop and 390px sweeps of 25 routes;
- rollout Phase 9 and this record.

**Waiting on someone else, not on work:**

- **DGA skins → prototype skins** (header, pagination, tab divider, checkbox, button heights). Needs a user or product-owner ruling. If the answer is yes, CLAUDE.md requires a **separate DS task** with its own cross-consumer regression, not a page edit.
- **Inbox "service" and "duration" filters, and Export.** The inbox endpoint accepts only `page`, `pageSize`, `search` and `status`. This needs API support first.
- **KPI tiles on the agreements list.** Needs per-status counts from the API.
- **Review of the pushed branch.** The user decides on changes after seeing it running, then whether to merge into `main`.

**Deliberately not done:** tabs on the trainer profile. J-15/F1/AC-1 asks for one screen, and a test asserts no `tablist`. Changing that is a product decision, not a styling one.

**Not started:**

- The prototype is «الجزء ١». If a part 2 exists (trainer portal, remaining screens), it has not been provided or compared.
- The DS `Header` overlap at 390px (§7). It is pre-existing: no shell or `@ds` file changed this session. It was not investigated.

---

## 7. Open questions, by who can answer them

**User / product owner**
- Replace the DGA component skins with the prototype's exact skins? This conflicts with CLAUDE.md's DS rule, so a yes means a separate DS task.
- Should the trainer profile gain tabs, overriding the J-15/F1/AC-1 one-screen requirement?
- Is there a «الجزء ٢» of the prototype to match next?
- Merge `expert-hub/prototype-parity` into `main` once reviewed?

**Backend / API**
- `service` and duration filter parameters on the inbox, and an export endpoint.
- Per-status agreement counts, for the prototype's KPI tiles.

**Data**
- Optional: seed mock records at the frames' workflow stages, so demos match the prototype in content as well as anatomy.

**Technical**
- Why the dev-server auth callback fails on port 5199 (correction 3; cause unconfirmed).
- At 390px the shared DS `Header`'s «المزيد» trigger overlaps the logo wordmark (seen in the permission-matrix mobile shot). This is shell/DS scope.
- **`@ds` icon registry ships all 237 icons in the entry chunk** (631 KB pre-minify). Needs a DS task to make icons load per use (§3 follow-up).

---

## 8. Where it stopped

The work is complete and verified. The session ended with the final report to the user, which listed the deviations and asked the one open question: **should the DS component skins that differ from the prototype be replaced?** Those are the header, pagination, tab divider, checkbox and button heights. The case for leaving them: CLAUDE.md makes the DS the source of truth where a reference conflicts, and the user's "100%" cannot be met on those parts without a DS change. Nothing is half-done. Asked to *"push it to see it then i will decide the change if needed"*, the work was committed on branch `expert-hub/prototype-parity` and pushed. `main` was left alone, so nothing under review can reach it by accident.

---

## 9. Resuming

```bash
R="…/financial-academy-hackathon/financial-academy-hackathon"   # the NESTED folder is the repo

git -C "$R" fetch origin
git -C "$R" checkout expert-hub/prototype-parity   # the reviewed work; main is still 171bcc5

cd "$R/frontend"
npm run validate:expert-hub                          # 687/687 expected
VITE_EXPERT_HUB_DEV_ROLE=internal npm run build:expert-hub
npx vite preview --config vite.expert-hub.config.ts --port 4173 --strictPort
# Sign in: open http://localhost:4173/expert-hub/auth/callback → redirects to /internal
```

### Environment traps (cost time once; will again)
- **Verify authenticated pages on a preview build, not the dev server.** The dev-server callback did not redirect (correction 3). `vite preview` serves `dist/` directly: rebuild and reload, no restart needed.
- **npm arg forwarding.** Never pass `-- --port …` through `npm run dev:expert-hub` or `npm run preview:expert-hub`. Call `npx vite preview|dev --config vite.expert-hub.config.ts --port N --strictPort` instead.
- **Git Bash path conversion.** Arguments starting with `/` get rewritten to `C:/Program Files/Git/…`. Prefix `MSYS_NO_PATHCONV=1` and pass the script as a Windows path.
- **Playwright without a download.** Use the npx-cached package (`…/npm-cache/_npx/705bc6b22212b352/node_modules/playwright`) with `channel: 'msedge'`. The sweep and probe scripts lived in the session scratchpad and are gone; the route list they used is the frame → route table in rollout Phase 9, plus `/internal`, `/internal/service-requests`, `/internal/submissions`, `/internal/notifications/templates`, `/internal/notifications/log`, `/internal/access/users`, `/internal/agreements/agr-001` and `/internal/agreements/template`.
- **Overflow probes lie about scrollers.** Content inside an `overflow: auto` box shows up as outside the viewport even when it is clipped. Check `document.documentElement.scrollWidth`, then look for **absolutely-positioned** escapees (correction 7).
- **`@ds` form controls in a horizontal scroller.** Give the scroller `position: relative`, or the visually-hidden labels widen the page on mobile.
- **The prototype artifact's CSS has a `.tw` collision.** Do not copy colours from its tables.
- **This Git Bash blocks some coreutils.** `sort`, `find` and `timeout` fail with "Permission denied". Use `awk '!seen[$0]++'` to dedupe, `shopt -s globstar` for recursive globs, and plain background runs instead of `timeout`.
- **Heredocs through the Bash tool can lose backslashes.** A doubled backslash in a regex arrived as a single one and broke a script. Write any script that contains backslashes with a file tool, or avoid them (`String.fromCharCode(92)`).
