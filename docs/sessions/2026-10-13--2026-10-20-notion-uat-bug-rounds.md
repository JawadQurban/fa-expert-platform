# The Notion UAT bug rounds (Round 1 + Round 2) fixed, and the owner's six rulings

## Resume here

| | |
|---|---|
| Branch | `cr/notion-2026-10-07` (pushed) |
| Head | the commit that carries this record (`fix: Notion UAT bug rounds 1 and 2 …`) |
| Release tag | none |
| Deployed | **Not yet.** The server still runs the state before `f701f58`; this commit, `f701f58` and `1d0e59a` all await a deploy |
| Validation | Backend **464/464** (build 0 warnings) · frontend **1716/1716** in 124 files (1 lint warning that predates this session, `InterviewSlotsField.tsx`) · `npm run build` ✓ |
| Migrations waiting for the server | M44 `SubmissionRoundFile` · M45 `MatchingWeightedSpecializationLocation` · M46 `UatApplicationForm` · M47 `MatchingConsultantAvailabilityWeighted` · M48 `TrainerFileStatusOverride` — applied at startup (`Database__AutoMigrate`) |
| Next | Deploy the API and frontend (see *Resuming*), then re-run the Round 2 test cases with the testers |

Read in this order: this file → `CHANGELOG.md` *[Unreleased]* → `docs/DECISIONS.md` `P-352`–`P-355`.

## What was asked, in order

1. Earlier in the session: the Academy Notifications Gateway for email (`66e71c1`),
   a batch of UI and logic fixes (`f701f58`), the centre coordinator's centre
   scope (`1d0e59a`, `P-351`), a QA role script, and the pre-pentest security
   report.
2. «i want you to check the bugs listed on notion and start fixing all the bugs» —
   the two lists under *Release readiness - 20sep*: **Bugs - Ready to deliver (1)**
   (BUG-001…049) and **Bugs - Round (2)** (RUN-001…040, with severity).
3. Six agents split the lists by area (notifications, interviews, agreements,
   profile/directory, matching/offers, uploads/form) in isolated worktrees; the
   results were merged on a transport branch and copied onto this branch.
4. The owner answered the open rulings (below) and asked for the remaining plain
   bugs to be fixed: «and fix the thing you meansend».
5. A second wave of four agents: decision card + exemption label, matching
   availability + declined offers, manual file status, years-of-experience + bank
   details. BUG-033 was done directly after the owner confirmed it.
6. «commit and push to repo».

## What shipped

All of it is in `CHANGELOG.md` *[Unreleased]*. By theme:

- **Notifications (RUN-001/BUG-002, RUN-023, BUG-028/029)** — a header bell for
  every role, «إشعاراتي», offers raise EV-0501 to the trainer, the log filters by
  date, upcoming interviews and reschedule requests on both homes. The unread
  count lives in the browser (`ponytail:` marked).
- **Interviews (RUN-002, RUN-021, RUN-022, RUN-036/BUG-030, BUG-032, BUG-033)** —
  the evaluation states say *why* a member cannot evaluate; a reschedule
  proposes, it never fixes, and sends an instant (no +3 h); status moves on open
  and on accept; the pass mark is advisory (`P-355`).
- **Agreements (RUN-003, RUN-014, RUN-015, RUN-016, RUN-037)** — the term is the
  entered dates (`TermOf`) and the preparation refuses an end before the start;
  «معتمد» as the applicant status; the amendment note and signing steps shown.
- **Uploads and the form (RUN-004, BUG-001, RUN-020/BUG-013, RUN-019, RUN-038,
  BUG-006/007/014/015)** — real multipart storage for submission rounds, inline
  PDF/image serving, remove-then-upload fixed, Gregorian dates, «أخرى» opens a
  free-text field. Years of experience follows «أعمل حاليًا» through a new
  schema rule, `requiredWhen` (M46 corrected in place — it was never deployed).
- **Matching and offers (RUN-011/BUG-038, BUG-039/040/041, RUN-013/BUG-044,
  BUG-047/048/049, RUN-039)** — two exclusions only; specialization and location
  weighted 33/33 (M45); a consultant's scheduling conflict weighted (M47,
  `P-353`); declined offers on the staff home; a de-link returns the request to
  matching.
- **Profile and directory (RUN-005, RUN-017, RUN-025, RUN-026, RUN-027,
  RUN-029, RUN-031, RUN-033, RUN-040)** — directory switch, full comprehensive
  file, manual file status under F-0411 (M48, `P-354`), bank country from FAST's
  list with an ISO 13616 IBAN check, CV replacement, every-word search and the
  specialization filters, stored Arabic names, duplicate-speaker warning.
- **Screening (RUN-034, BUG-034)** — exempted services count as accepted on the
  decision card, a post-interview rejection shows; the applicant sees
  «مستثنى من المقابلة» (`P-352`, supersedes `P-45`).
- **Tooling** — the pre-commit hook runs `lint-staged` from `frontend/`.

## Verbal rulings

| Ruling (as given) | What it changed |
|---|---|
| BUG-033 — «1 yes»; then, asked again: «Yes, do it now» | The interview pass mark is advisory; forwarding never refused, no service closed by its score (`P-355`, supersedes `P-271`) |
| Matching weights — «2 yes» | Specialization 33 / location 33, and M45 overwrites any admin-edited weights |
| Scheduling conflict — «3 lower their score»; then «Consultants only lose points» | `availability` weighted row for the consultant service; every other service still excludes (`P-353`) |
| Specialization filters — «4 no do what bug say» | RUN-029/RUN-031 filters kept as the bugs ask, reversing `P-287`/`P-348` |
| Years of experience — «5 no» | Required only while «أعمل حاليًا» is off |
| Manual file status — «6 yes» | F-0411 control with a mandatory reason (`P-354`) |
| System administrator access — «No, admin sets it on screen» | The seed is NOT changed: the admin grants F-0402/F-0411 from the access matrix if wanted. TC-B0-F0411-SYS_ADMIN fails until then |
| Commit — «commit and push to repo» | Committed and pushed; **not deployed** |

## Corrections

- **The pre-commit hook was not "broken from the root": it never ran at all.**
  `core.hooksPath` pointed at `frontend/.husky/_`, which did not exist. Fixed by
  making the hook `cd frontend && npx lint-staged` and re-running `npm run prepare`.
- **There was no separate consultant scheduling-conflict exclusion.** I reported
  one; the engine had only the engagement conflict (`schedule-conflict`) and the
  file status. The owner's ruling was applied as "for the consultant service the
  overlap is weighted", then confirmed by the owner.
- **Duplicate numbers from parallel agents.** Two M44 migrations (renamed to
  M45/M46) and three `P-352` rows (renumbered to `P-352`/`P-353`/`P-354`).
- **The first merge base was wrong.** The first wave's worktrees started at
  `6e6ca21`, not `1d0e59a`; cherry-picks conflicted until every agent rebased.
- **BUG-033 was refused twice by the auto-mode permission check** (once as a
  direct edit, once as an agent task) because it reverses a recorded decision on
  the strength of Notion text. It was done only after the owner confirmed it
  through a direct question.
- **RUN-032 is not a bug**: «✓» is the design system's selected tick.

## Where it stands

**Done:** every bug in both lists that needed only code, except the ones below.

**Not done, waiting on something else:**

| Item | Waiting on |
|---|---|
| BUG-004 programmes list | the published programmes/events list (a source) |
| BUG-005, bank city | a Saudi cities list — none in the repository |
| RUN-019 remainder | the per-service field matrix (Needs Confirmation) |
| RUN-024 delegation and audit screen | scope ruling |
| RUN-028 PDF card, RUN-037 signed PDF | a document-generation service |
| RUN-030 FAST plans | the FAST plans API |
| BUG-016/018 foreign applicants | identity route for non-Nafath applicants |
| BUG-027 one interview for all services | a design ruling |
| RUN-035 page not refreshing after confirm | a live reproduction on EH-2026-00015 — no cause in the code |
| ASR-0002 | a database check of AGR-2026-0007/0008 (status `active`, owner) |
| Agreements signed before the RUN-003 fix | a one-off data correction of their stored dates |

## Open questions, by who can answer them

- **Owner:** BUG-027 (one interview per application); RUN-024 scope; whether
  `automatic` (hand a manual file status back to the agreement) is wanted.
- **Documents/data:** Saudi city list; published programmes list; the
  per-service field matrix.
- **FAST:** the `countryCode` format on `fast-country` (ISO-2 expected; ISO-3
  would skip the IBAN prefix check); the plans API.
- **Technical:** deploy; data-correct the old agreements; check ASR-0002.

## Where it stopped

Committed and pushed on owner request. Not deployed — the deploy is the next
action, then a Round 2 re-test.

## Resuming

```bash
git checkout cr/notion-2026-10-07
cd backend && dotnet build && dotnet test
cd ../frontend && npm run validate && npm run build
```

Server deploy (API + frontend only; never `down` or `prune`):

```bash
cd ~/fa-expert-hub
cp deploy/env/local.env /tmp/local.env.bak && git pull && cp /tmp/local.env.bak deploy/env/local.env
docker compose --env-file env/local.env --env-file env/api.secrets.env up -d --build expert-hub-api expert-hub-frontend
```

**Environment traps**

- Parallel agents each mint the "next" migration and decision number — renumber
  on merge (files, class names, `[Migration]` ids, DECISIONS rows, CHANGELOG).
- `git worktree add` into the long scratchpad path fails on Windows ("Could not
  reset index") — use `.claude/worktrees/<name>`.
- `dotnet ef migrations has-pending-model-changes` cannot run: the API project
  does not reference `Microsoft.EntityFrameworkCore.Design`. The
  `RemediationMigrationTests` pending-model check covers it.
- In Python, `str.replace` replaces every occurrence — when editing a test,
  assert the count first.
- `sort` is not permitted in this environment's bash.
