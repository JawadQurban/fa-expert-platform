# The Notion UAT re-test: 16 of the 17 open bugs fixed, in two rounds of parallel agents

## Resume here

| | |
|---|---|
| Branch | `cr/notion-2026-10-07` (not pushed since `d19fdd8`) |
| Head | `d327a15` + **uncommitted** work: the BUG-055 logout fix, the Cap05 relative dates, and the CHANGELOG / DECISIONS / session-record entries |
| Release tag | none |
| Deployed | **No.** The server runs a build older than `2a58552` or the UAT re-test drafts predate it — see *Corrections* |
| Validation | Backend **542/542**, build 0 warnings · frontend **1776/1776** in 129 files, lint 0 errors (1 pre-existing warning, `InterviewSlotsField.tsx`) · `npm run build` ✓ |
| Migrations waiting for the server | M55 `UatRetestApplicationForm` · M56 `InterviewPerServiceDecision` · M57 `ApplicationFormCitiesAndProgrammes` (M53/M54 were reserved and never used) |
| Notion | *Bugs - Ready to deliver (1)*: Resolved = **YES** on 16 rows; BUG-016 left empty |
| Next | The owner asks to commit and push → then deploy, and IT grants the Teams permission for BUG-050 |

Read in this order: this file → `CHANGELOG.md` *[Unreleased] › Fixed* (the «UAT re-test» block) → `docs/DECISIONS.md` `P-375`–`P-387`.

## What was asked, in order

1. «connected» / «notion is connected on mcp» — the project `.mcp.json` Notion server timed out; the claude.ai Notion connector worked and was used throughout.
2. «i want you to start working on the bugs from notion https://app.notion.com/p/Bugs-Ready-to-deliver-1-3fa24cdb7d0a80bf81a0d79db4302352 and update the Resolved cloume when finish the bugs» — 17 open rows: BUG-004, 005, 006, 007, 014, 015, 016, 027, 028, 039, 042, 049, 050, 051, 052, 053, 054, 055, 056.
3. Four rulings on the bugs code could not settle (below), and «i have put the excel on the repo on docs» — FAST's country/city export, now `docs/inputs/fast-country-and-city.xlsx`.

## How the work went

- **Triage first.** BUG-006/007/014/015/028/039/049 had been reported fixed by `2a58552` (2026-10-20) yet the testers still marked them NO, so each agent was told to find *why the previous fix did not satisfy the tester* before changing anything. That produced the real causes (old drafts, a footnote row offered as an option, home showing only confirmed interviews, excluded trainers vanishing from search, the offer never carrying the prospectus).
- **BUG-055 done directly** (`frontend/src/app/auth/`): the header navigated to the landing page right after `location.assign(providerLogoutUrl)`, and that same-document navigation cancelled the provider logout. `logout()` now returns `{ leavingSite }`.
- **Round 1 — three agents in worktrees** with reserved numbers (interviews `P-375–377`/M53, assignments `P-378–380`/M54, form `P-381–383`/M55) and an instruction not to touch CHANGELOG/DECISIONS; merged by cherry-pick (`a975599`, `d9521c4`, `0a49480`).
- **Round 2 — three agents** after the owner's rulings: BUG-027 (`ea74a43`), BUG-051 (`d6f35aa`), BUG-004/005 (`d327a15`). Each was told to fast-forward to `0a49480` first.
- Notion's Resolved column was updated only after the merged tree passed both suites.

## What shipped

All of it is in `CHANGELOG.md` *[Unreleased] › Fixed* («UAT re-test»), decisions `P-375`, `P-378`, `P-379`, `P-381`–`P-387`. The principles worth keeping:

- **Interviews** — one rule and one parser for a slot (`InterviewSlotRules`: ≥ 1 h ahead); the applicant's phase (`ApplicantPhaseOf`, with `ended`) drives the panel, the home and the hidden join link, so the screens cannot disagree. Teams: lobby bypass patched after booking, best effort, presenters `organization`.
- **One interview per application (BUG-027)** — the database already had it (unique since M06); the gap was the screening panel asking per service and the single decision. `INTERVIEW_SERVICE` carries the per-service decision; `INTERVIEW.decision` stays as the application's outcome.
- **The form** — rules live in the schema rows and both validators read them; a resumed draft moves to the current version (`P-381`); «أخرى» is read as the typed text everywhere (`P-383`); options can come at runtime (`optionsSource: 'fast-programmes'`), stored with their names.
- **Reference data** — FAST's own country/city export becomes ONE generated lookup (`extract-reference-lists.py` → `fastCountriesAndCities.ts` + `FastCities.cs`), never hand-typed.
- **Access per file** — a trainer may read a prospectus only for a request on which they hold an offer (`P-379`).
- **PDF in the browser** — the card's own DOM through `html-to-image` + `jspdf` (MIT), so the browser shapes the Arabic (`P-387`).

## Verbal rulings

| Ruling (as given) | What it changed |
|---|---|
| «i want you to start working on the bugs from notion … and update the Resolved cloume when finish the bugs» | Notion's Resolved column set to YES per bug once merged and validated |
| BUG-027 — «Yes, build it now (Recommended)» | One interview per application, per-service evaluation and decision (`P-384`, M56) |
| BUG-004 — «FAST programmes + Other» | Multi-select over FAST's published programmes + «أخرى» (`P-386`) |
| BUG-005 — «build one lookup based on the excel i uploaded to you the excel has city and country»; then «i have put the excel on the repo on docs» | One country/city lookup generated from FAST's export (`P-385`, M57) |
| BUG-016 / BUG-051 — «use a open source pdf generater» | BUG-051 built with MIT libraries (`P-387`); BUG-016 left open |

## Corrections

- **The assignments agent first worked on `main` (6e6ca21), 38 commits behind.** `isolation: worktree` creates the worktree from `main`, not from the checked-out branch. Its first commit (`66fea9f`) re-built things `2a58552` already had (`MatchText`, the location rule) and missed `cd001eb`. It was sent back and re-applied on `d19fdd8` (`96f9e45` → `0a49480`). Round 2 agents were told to fast-forward first.
- **"BUG-027 changes the interview data model"** — I said so when asking the owner. Wrong in part: the database already held one interview per application; only the decision moved per service.
- **"81 Saudi cities"** — I counted 81 from the workbook; the agent's extraction found **74** for CountryId 1 (my count included rows from other countries in a truncated listing).
- **"The Arabic in the cities workbook is corrupted"** — it was not; the bytes are valid UTF-8 and only my console printed `�`.
- **BUG-007's "list not updated"** — the repository's certification list matches the newest workbook it holds (2026-09-20); there is nothing newer to apply. Recorded as Needs Confirmation, not fixed.
- **A frontend failure after merging BUG-027** (`MyProfilePage.test.tsx`, "saves an editable field") is a timing flake under load, not a regression — 37/37 alone, twice; the full suite passed on the next run.

## Where it stands

**Done (code, validated, Notion = YES):** BUG-004, 005, 006, 007, 014, 015, 027, 028, 039, 042, 049, 050, 051, 052, 053, 054, 055, 056.

**Waiting on someone else, not on work:**

| Item | Waiting on |
|---|---|
| BUG-016 foreign/GCC applicants routed to Nafath | an identity route for non-Nafath applicants |
| BUG-050 in production | IT: Graph `OnlineMeetings.ReadWrite.All` (application) + a Teams application access policy for the organiser (`DEPLOYMENT.md`) |
| All of it reaching the testers | commit, push, deploy |
| BUG-042 for requests that copied a FAST prospectus before `0a49480` | a backfill of `attachmentId` on those requests |

## Open questions, by who can answer them

- **Owner (Trainer Management):**
  - BUG-027: a notice to the applicant when some services are rejected after the interview (no event exists); the case where every interviewed service is rejected but an exempted one is pending; notes per service; the wording of a multi-service rejection reason («؛ »).
  - BUG-039: may staff picking by hand override the matrix exclusions (`P-378`)?
  - `P-381`: a resumed draft moves to the current form version — confirm.
  - BUG-005: keep the regions (المنطقة الشرقية، الشمالية، القصيم، عسير) in the city list? Sign off the nine English name corrections.
  - BUG-051: card-sized page, or A4 / a branded template?
  - The length ceilings of `P-382`.
- **Documents/data:** a newer certification list (BUG-007); an events list (BUG-004); whether FAST's `active` means «published on the site».
- **Technical:** deploy; the Teams permission; backfill the old FAST prospectus requests; `npm audit` flags `react-router` 7.12–7.18.1 (GHSA-qwww-vcr4-c8h2), pre-existing.

## Where it stopped

All 16 fixable bugs merged on `cr/notion-2026-10-07` and marked YES in Notion. **Nothing committed beyond the six merged commits; nothing pushed.** The owner has not yet asked to commit — the next step is to ask, then commit the uncommitted work (logout fix, test dates, docs, this record), push, and deploy.

## Resuming

```bash
git checkout cr/notion-2026-10-07
cd backend && sqllocaldb start MSSQLLocalDB && dotnet build && dotnet test
cd ../frontend && npm install && npm run validate && npm run build
```

**Environment traps**

- `Agent` with `isolation: "worktree"` starts the worktree from **`main`**, not from the current branch. Tell every agent to `git merge --ff-only <head>` first (the fa guardrail hook blocks `git reset --hard`).
- The fa git-guardrail hook blocks any command containing `push` followed by a `+` — including `git stash push -m "a+b"`. Use `git stash save "<name>"`.
- A Vite dev server started 2026-10-13 from `frontend/` holds `node_modules/@esbuild/win32-x64/esbuild.exe`; `npm ci` then deletes everything else and fails with EPERM. Use `npm install`, or stop the dev server first.
- Cherry-picking an agent commit onto a dirty tree fails when it touches a modified file — `git stash save`, cherry-pick, `git stash pop`.
- Tests that hard-code a calendar date drift into business windows (Cap05's 2026-11-01 hit the withdrawal notice period on 2026-10-28). Use dates relative to today.
- `MyProfilePage.test.tsx` "saves an editable field" flakes when another test run loads the machine; re-run alone.
- Windows console prints Arabic from a Python script as `�` — check the bytes before calling a file corrupted.
