# The approved evaluation matrix, repeatable sections, and the step-per-section application form

## 1. Resume here

| | |
|---|---|
| **Branch** | `expert-hub/uat-baseline` (unchanged — this session branched nothing) |
| **Base commit** | `01babd7` "feat(expert-hub): establish UAT-ready baseline" |
| **Committed?** | **No.** The user's instruction was «Do not commit.» Everything below is in the working tree |
| **Deployed** | No |
| **Validation** | *(as of 2026-09-29, §15)* Backend: clean build **0 warnings**, **347/347** tests, `has-pending-model-changes` → «No changes have been made to the model since the last migration.» Frontend: typecheck ✓, lint **0 errors** (1 pre-existing warning, `InterviewSlotsField.tsx:43`), `lint:css` ✓, **838/838** (56 files), `build:expert-hub` ✓ |
| **Migration** | **M34** (fully additive) + **M35** + **M36** `M36EvalGap11AndDeliveryMode` — M35 and M36 are each 5 `UpdateData` + 6 `InsertData`, **0 destructive operations in `Up`** |
| **Next action** | Committed: `ca846fd` (checkpoint) + the §15 rule-gap commit on top of it, neither pushed. Schedule `EXPERT-HUB-DOMAIN-MASTER-CLEANUP` with a data owner — run its usage query first |

Reading order: this record → `DECISIONS.md` P-293…P-321 → `EvaluationMatrixSeedData.cs` (the matrix as code) → `EvaluationMatrixCalculationTests.cs` (the matrix as arithmetic) → `practical_experience_relevance.xlsx` (criterion #3's classification, the business's own).

## 2. What was asked, in order

One instruction, in 32 numbered sections. The order it was worked in:

1. **Read the UPDATED Evaluation Matrix from Notion first**, and «Do not assume the previous calculation is still correct».
2. Produce a change analysis classifying every item (UNCHANGED / CHANGED / NEW / CALCULATION_CHANGED / AMBIGUOUS).
3. «If the updated Notion matrix does NOT clearly define how the calculation should work: STOP before changing the calculation and ask me.»
4. Implement the approved matrix as a **new model version**, without touching historical results.
5. Redesign the application form from one long page into logical steps.
6. Multiple qualifications; multiple experts «where the relevant field/journey requires experts».
7. Tests, then the complete regression suite.

## 3. Rulings given in conversation

Four questions were asked up front (§3 of the instruction). The answers:

- **Years of practical experience across repeatable entries** → «Highest bucket across entries». Closes `EVAL-GAP-03`.
- **Client referrals (#5), whose approved field is an attachment but whose weight table is a count** → «Count uploaded files».
- **Multiple experts** → «Headcount N + up to N named experts», against Notion's own «the named person as the **sole candidate**».
- **The 29% whose source data did not exist** → the first answer was not an option but an instruction: «this okay but review the application and review the infomation on notion and excel files and study it will». That study is what found the two classification workbooks; asked again with the finding, the answer was **«You drop both files in the repo»** — and both were already there by the time the question was answered.

Two more, asked once the repeatable sections made them live:

- **Identity Card, multiple qualifications (`CARD-GAP-05`)** → «Highest degree».
- **Identity Card, multiple past roles (`CARD-GAP-04`)** → «Most recent 2 entries».

Standing rules restated and held: Notion **READ-ONLY**, Design System **READ-ONLY**, additive migrations only, never modify old migrations, «Do not weaken or delete existing tests simply to make the new implementation pass», «Do not commit.»

## 4. Corrections — claims that turned out wrong

**This section is mandatory and is never omitted.**

- **«The current application schema has 47 fields.»** Wrong, and it came from the instruction itself. 47 is the *superseded* `dm-gap-01.2026-09-14`; the live version was `dm-gap-01.2026-09-16` with **51**, and is now `dm-gap-01.2026-09-21` with **55**. The 39-field version is `dm-gap-01.2026-08-30`.
- **«The two classification workbooks are unreachable.»** Wrong twice over. `notion-download-attachment` only serves attachments the MCP itself created, so the conclusion looked right — but the user had already placed both files in `docs/expert-hub/`. Checking the directory would have been cheaper than reasoning about the tool. They unblocked 19 of the 29 percentage points.
- **`CERT-0030` was assumed Global.** It is `Saudi / Local` **and** `Relevant`. Caught by verifying the fixture against the workbook before writing the test, not by the test failing. The global-and-irrelevant certificate is `CERT-0044`.
- **The first `EvaluationLookupTables.cs` did not compile.** The generator chunked the JSON every 110 characters, which split `\"` mid-escape. It now chunks on whole key:value pairs.
- **`dotnet ef migrations remove` failed silently, twice.** It cannot construct the `DbContext` while a seed is invalid, prints that error — and **leaves the migration files in place**. The next `add` then scaffolded a *delta* migration on top of the one that was supposed to be gone, so M34 briefly existed as two partial files with only 2 of the 7 `AddColumn`s between them. Always `ls Migrations | grep M3x` after a failed remove.
- **`ApplicationFieldValue.EntryId` was first declared `Guid?`.** The client's entry handle is a string (`"education-1"`), so storing it as a Guid would have meant inventing a mapping. It is `string?`.
- **`repeatable` and `perEntryOf` were assumed to ride along inside `FORM_FIELD.definition`.** They belong to sections and attachment rules, which carry explicit columns rather than a verbatim JSON blob — both needed new columns and both needed adding to the wire builder. Nothing would have failed loudly: the API would simply have served a schema the form could not read as repeatable.
- **The frontend's weighted-score formula was believed to be a display detail.** `rawScore × weight ÷ 100` is exactly right for the completeness model and **wrong** for the approved one, whose tables return already-weighted points; at 1-dp raw precision 3.43 came back as 3.432. Fixed at the root (`P-300`): the backend serves the number it summed.

## 5. Where it stopped

- Every requested change is implemented and validated; nothing is committed.
- **Criterion #3 «مجال الخبرة العملية» (10%) is the only part of the approved matrix not computing.** It is seeded, labelled, weighted and scoring zero, so every track's ceiling is 90 rather than 100 and the breakdown says why. It needs a relevance-classified controlled field that does not exist.
- `MyProfilePage` (EH-TP-04) still renders the repeatable sections flat — it validates and saves correctly, it just shows one qualification for an applicant who submitted three. The backend now carries all of them; the page is the remaining half.

## 6. Validation — numbers seen this session

| | |
|---|---|
| `dotnet build` | 0 warnings, 0 errors (warnings are errors here) |
| `dotnet test` | **308/308** (was 265 at session start; +37 calculation tests, +6 repeatable-section tests) |
| `dotnet ef migrations has-pending-model-changes` | «No changes have been made to the model since the last migration.» |
| `npm run typecheck:expert-hub` | clean |
| `npm run lint:expert-hub` | 0 errors, 1 warning (pre-existing) |
| `npm run lint:css` | OK — no DC-04 / DC-23 violations |
| `npm run test:expert-hub` | **821/821**, 56 files |
| `npm run build:expert-hub` | ✓ built |

M34 `Up`: 7 `AddColumn`, 3 widening `AlterColumn` (5,1 → 6,2 — the approved tables carry 2-dp values like 1.71), 2 index swaps that are equivalent for existing rows (`entry_index` defaults to 0), seed inserts and updates. **0 destructive operations.**

## 7. Questions, by who can answer

**Business / PM:**
1. **Criterion #3** — supply a relevance-classified «مجال الخبرة العملية», or confirm the 90 ceiling is acceptable. Until then 10% of every track is unearnable.
2. One academic specialization ships with a **blank relevance cell** and currently scores as not-related (the matrix's own `EVAL-GAP-11` reading). Confirm.
3. The referral bucket labels **overlap at 7** («4–7» then «7+»); implemented as the contiguous 4–7 / 8+ the first two buckets imply. Confirm.
4. `preferredDeliveryMode` is now `requiredFor: ALL_SERVICES` but `visibleFor: ['trainer']` — harmless (only visible fields validate) but the schema says a consultant must answer a question they never see. Worth a tidy-up.

**Notion / documentation owner:** `EVAL-GAP-01`, `04`, `05`, `06`, `08`, `09` and `EVAL-GAP-03` are resolved in code and can be closed on the matrix page; `CARD-GAP-04`/`05` are answered. Notion was not edited — it is read-only for this work.

## 8. Environment traps

- **`dotnet ef migrations add|remove` fails with `--startup-project src/ExpertHub.Api`** (no EF Design reference there). Use `--project src/ExpertHub.Infrastructure` alone. Already recorded on 2026-09-16; hit again.
- **A failed `migrations remove` leaves the files behind** — see §4. Verify with `ls`.
- **`find` is blocked by the sandbox** (`/usr/bin/find: Permission denied`) and returns nothing rather than erroring visibly in a pipeline. Use `ls` or the Glob tool.
- **`grep -c` exits 1 when the count is 0**, which silently aborts an `&&` chain.
- **Python writing to `/tmp` from Git Bash lands in `C:\tmp`**, not the Git-Bash `/tmp` — a later `cat /tmp/x` then says "No such file". Write to the scratchpad path directly.
- **The console is cp1252**: Arabic printed from Python is mojibake even when redirected to a file, because the mangling happens at `print`. Write UTF-8 with `io.open(...)` and read it back with the Read tool.
- **`FORM_FIELD.order_index` is an `int`** but `applicationSchema.ts` uses fractional orders (9.1, 9.2) to slot a new field between two existing ones. The extractor emits a dense rank for the column and keeps the fraction in the served definition.
- `dotnet test` takes ~2m35s on LocalDB. Don't run it while another build writes `bin/`.

## 9. What was built

**Generated, never retyped** — two scripts now keep the copies honest:

- `docs/expert-hub/extract-reference-lists.py` — the three approved lists (25 classified specializations, 517 universities, 228 classified certifications) into `shared/content/*.ts` **and** the backend's `EvaluationLookupTables.cs`. The list a person picks from and the table their pick is scored against come from the same workbook rows.
- `frontend/scripts/extract-application-schema.mjs` — evaluates `applicationSchema.ts` with esbuild and emits `ApplicationSchemaSeed.<version>.cs`. It **refuses** to overwrite an existing version's file: a published schema is history (`BR-0103`). The earlier versions were extracted by an ad-hoc script that was never checked in; this is that script, kept.

**The matrix as code:** `EvaluationMatrixSeedData.cs` reads as the Notion page, criterion by criterion, with each weight table beside the Arabic label it came from.

**The boundary that still holds:** `ScreeningScorer.Score` takes the model and the answers and *cannot* take an `AiAnalysis` — `BR-0201`/`BR-0202` enforced by the compiler, unchanged by any of this.


---

## 10. Continuation — 2026-09-22: criterion #3 gets its field

**Asked:** «Complete Practical Experience Criterion + Repeatable Profile Fix», and explicitly «Do not use the previous workaround where Criterion #3 always scores zero.» The business decision that had been missing arrived with it: «مجال الخبرة العملية must be a CONTROLLED DROPDOWN … The applicant explicitly selects their Field of Practical Experience from an approved controlled list.»

**What the search found before anything was built.** Three approved sources were checked for the controlled list and for a Field ↔ Service relevance mapping:

- `cmpt.JobFamily`, which the matrix names, **has never synced**: `domain-job-family-mapping.csv` carries 147 rows at `PENDING_FAST_DATA` with **zero** Job Family ids and a Business Decision column that is 100% empty, and the FAST reference sync is still `WaitingForCredential` with only `Countries` persisted.
- The two supplied classification workbooks carry no practical-experience list and **no Service/Track column at all**.
- `profile.PracticalExperience` has no field-of-experience column in `Trainer_Profile_Fields.xlsx`.

So the mapping did not exist, and §5 said to stop and ask rather than guess. It also surfaced a **structural conflict worth recording**: Notion puts #3 in the COMMON block — «one shared table, applied identically regardless of which service(s) are requested» — while the request's §4 described a per-service relationship. Those need different data (147 decisions versus 441).

**Rulings given, 2026-09-22:**

- **The list** → «Reuse the 147-value «مجال التخصص» list» — no second master list (`P-302`).
- **The shape** → «Common — one flag per value», i.e. Notion's own structure, not per-service (`P-303`).
- **The data** → «I generate a worksheet for you to fill» (`P-304`).

**Built:** `P-301`…`P-306`. The field lives inside the repeatable Experience entry, so each past role carries its own and the criterion takes the best of them. Application schema `dm-gap-01.2026-09-22` (56 fields); evaluation model `dm-gap-02.2026-09-22`, with `dm-gap-02.2026-09-21` kept inactive and its criterion #3 still `unavailable` so a result decided under it keeps its score. Migration **M35**, pure data, 0 destructive operations.

**Corrections this continuation:**

- **The schema extractor hardcoded `VERSION_ORDINAL = 4`**, so the second generated version produced the SAME seed GUIDs as the first and EF refused the model with a duplicate-key error. It now derives the ordinal from the version's position in the chain, which also makes re-running reproduce any version's ids exactly.
- **A Bash heredoc broke on a patch containing `'''` and Arabic.** Writing the patch to a file and running it is the reliable route for anything non-trivial — the same class of trap as the Arabic-in-heredoc one already recorded.
- **`npx vitest run --config vite.expert-hub.config.ts` is NOT the test command.** `test:expert-hub` uses the DEFAULT vite config (`vitest run src/apps/expert-hub --no-file-parallelism`); passing the build config gives «window is not defined» on every component test. Target a folder with `npx vitest run <path> --no-file-parallelism` instead.
- **The script's own stdout crashed on a cp1256 console** when it printed «⚠️» and Arabic. File contents stay UTF-8; the messages are ASCII now.

**Where it stopped:** the worksheet `docs/expert-hub/practical_experience_relevance.xlsx` is generated and **empty** — 147 rows, column E blank. Until the business fills it, criterion #3's table pays nothing and the reachable maximum stays 90. That is a **data** state, not a code state: `python docs/expert-hub/practical-experience-relevance.py extract` regenerates the table and the tests follow the data automatically.

**Two more corrections, both found late:**

- **A new test was passing vacuously.** `Three_qualifications_survive_the_submission_and_come_back_on_the_detail` returned early when submission answered 400 — which it always did, because the fixture filled only the education section. It asserted nothing. Probing it (replacing the early return with `Assert.Equal(OK, …)`) is what exposed it; it now submits a complete form. **A test that can silently assert nothing is worse than no test**, and the only defence is to prove it fails when it should.
- **That test then caught a real defect.** `ApplyDraftInputAsync` wrote flat `values` before `entries` and skipped duplicates, so a payload carrying both shapes for one field discarded the entry — the first qualification came back as `diploma` instead of `bachelor`. Entries now win (`P-308`).

**Also closed this continuation:** the two wire gaps the profile agent surfaced — `ApplicationDetailWire` had never carried a single submitted answer, and `MyProfileWire` had no entries at all (`P-307`). Both now serve them through one shared grouper.

**Final validation (2026-09-22, seen):** backend clean build 0 warnings, **325/325**, no pending model changes, migration **M35** pure data with 0 destructive operations. Frontend typecheck ✓, lint 0 errors (1 pre-existing warning), `lint:css` ✓, **834/834** across 56 files, `build:expert-hub` ✓.

---

## 11. Continuation — 2026-09-22, later: criterion #3 is «المجال», and a day's work reverted

**Asked:** «read the notion again please and see.»

Notion's Evaluation Matrix had been edited at **09:04 that morning** — after the work in §10 was built. One change, and it undid most of it: criterion #3 was renamed from «مجال الخبرة العملية» to **«المجال»**.

«المجال» is Form 1 #16 — `domain` in the schema. A controlled dropdown over the *same* 147-value list, mandatory for all four services since `dm-gap-01.2026-08-30`, and mapped to `cmpt.JobFamily.NameAr/NameEn` — **the source column the matrix had named in that row all along**. The owner confirmed it in one line: «في الخبرة العملية لا يوجد مجال للخبرة المجال فقط في APPLICATION FORM».

**Corrections (this is the important part):**

- **The field criterion #3 needed already existed, and had since the first schema version.** `P-301` added `practicalExperienceField` to the repeatable Experience section on the strength of a written instruction that named a field and a location. Both were wrong. The instruction's own rule — «Before creating a new lookup list, inspect whether an approved controlled list already exists… Do not create duplicate master data» — would have caught it.
- **The check that was skipped was cheap:** match the criterion's **Source Field column** (`cmpt.JobFamily`) to an existing form field. It resolves to «المجال» and never to Section 4. The red «needs a new controlled field» note was taken at face value instead, and it was stale.
- **`dm-gap-01.2026-09-22` was deleted, not published.** With the duplicate field gone it was byte-identical to `…09-21`, so publishing it would have been a version that changed nothing. The published form version is `dm-gap-01.2026-09-21` again, 55 fields.
- **#3's aggregation is `single`, not MAX.** Section 1 is not repeatable, so the best-of rule the previous instruction specified for #3 does not apply to it. `P-295` still governs #1, #2, #4, #7 and #8.

**What survived unchanged:** the relevance worksheet and its generator, the scoring engine, the `dm-gap-02` version boundary, and every repeatable-section behaviour. All of it was built against the *criterion*, not against the field — which is why re-pointing it was a handful of lines rather than a rebuild.

**Validation (seen):** backend clean build 0 warnings, **320/320**, no pending model changes. Migration **M35** is now 4 `UpdateData` + 2 `InsertData`, **no form-schema rows at all**, 0 destructive operations. Frontend typecheck ✓, lint 0 errors (1 pre-existing warning), `lint:css` ✓, **834/834** across 56 files, build ✓.

---

## 12. Continuation — 2026-09-22, final: the classification, and fail-safe scoring

**Asked:** finalize the criterion #3 relevance classification. The interpretation from §11 is accepted and fixed: #3 reads `domain` / «المجال», no new field, no schema change.

**Found:** the workbook is **entirely unclassified** — 147 rows, 147 unique codes, no duplicates, no missing or unknown codes, and **zero decisions**. So the classification was produced as a list to answer, not invented (`docs/expert-hub/practical_experience_relevance.md`, and the fillable `.xlsx`).

**Built:**

- **`P-311` — unresolved is a first-class state.** The generated table is now CLOSED: an undecided value is omitted rather than written as `0`, and the rule carries `"strict":true`. An answer the table does not carry is reported `Unresolved` — it scores nothing but is visibly a configuration problem, on the breakdown and the wire. NOT answering stays the applicant's own legitimate zero. The old shape wrote all 147 as zeros, which made a missing decision indistinguishable from a made one.
- **Obsolete field verified gone**: 0 runtime references to `practicalExperienceField`. The two that survived were a stale comment and a misleading parameter name, both corrected; the historical record in `DECISIONS.md` and §11 is deliberately kept.
- **§13 proved rather than assumed**: a test writes two extra qualification entries into `TRAINER_FIELD_VALUE` and asserts `/me/profile/` serves **three**, with the flat map still reading as entry 0.

**Corrections this continuation:**

- **A test asserted 147 keys were present in the scoring table.** It only passed because unclassified values were being written as zeros — i.e. the assertion was pinning the very behaviour `P-311` removes. Rewritten to pin the closed-table guarantee instead: every key present is one of the approved 147 and pays either 0.1 or nothing.
- **Regenerating the seed invalidated the migration silently.** The whole suite failed with `PendingModelChangesWarning`, not with a scoring error — changing generated seed data means re-running `migrations add`, and the failure surfaces as an unrelated-looking fixture crash.

**Validation (seen):** backend clean build 0 warnings, **323/323**, no pending model changes; **M35** is 4 `UpdateData` + 2 `InsertData`, 0 destructive. Frontend typecheck ✓, lint 0 errors (1 pre-existing warning), `lint:css` ✓, **834/834** across 56 files, build ✓.

**Where it stopped:** waiting on 147 binary decisions. Until then criterion #3 resolves nothing and the reachable maximum is 90 — visibly, by design.

---

## 13. Continuation — 2026-09-27: the business review, before 147 decisions

**Asked, explicitly ANALYSIS ONLY:** before classifying 147 domains one by one, group them into five categories, produce a review workbook, sort what needs a decision most-ambiguous-first, and flag values that are not domains at all **without removing them**. The instruction ended: do **not** write RELATED/NOT_RELATED into the authoritative workbook yet.

**Why the ask was right:** 147 binary decisions is a form nobody fills in honestly. The same 147 values collapse to a handful of *kinds* of judgement, and a reviewer can answer those.

**Produced:** `docs/expert-hub/practical_experience_relevance_review.xlsx`, 7 sheets — Summary, Clearly Related (80), Likely Related (35), Needs Business Decision (32), Likely Not Related (0), Clearly Not Related (0), All Domains (147). 16 values carry a `Master Data Flag`. The 32 undecided ones are grouped into **7 decision clusters**, so the reviewer answers 7 questions instead of 32: `NOT_A_DOMAIN` 7, `MIXED_BUNDLE` 6, `TECHNOLOGY_AND_DATA` 7, `LAW_AND_DISPUTE` 5, `OPERATIONS_AND_QUALITY` 4, `PERSONAL_DEVELOPMENT` 2, `COMMERCIAL` 1.

**The finding that mattered:** zero values landed in *Likely Not Related* or *Clearly Not Related*. That is not a gap in the analysis — read against the Academy's actual remit, essentially every real domain on the list is in scope, and the values that cannot earn the points are the ones that are not domains at all. That shape is what made the approval in §14 a policy rather than a list.

**Constraint honoured:** the authoritative workbook was not touched. Every cell in the review is a *proposal* with the English column labelled «working translation — not approved».

---

## 14. Continuation — 2026-09-28: the policy is approved, and criterion #3 finally pays

**Asked:** approve the policy. Every review cluster → RELATED. Master-data values → invalid/unresolved, **never** NOT_RELATED. Write it into the authoritative workbook. Implement dropdown filtering for new applications *if the architecture supports it safely*. Do not merge duplicates — raise a cleanup backlog. Regenerate via the established workflow and verify no pending EF model changes. Verify multiple qualifications still work. Report. Do not commit.

### What the classification came out as

**134 RELATED · 0 NOT_RELATED · 13 MASTER_DATA_REVIEW_REQUIRED · 0 unclassified.**

`practical_experience_relevance.xlsx` was rebuilt with the classification in column E under a three-value dropdown, and the score in column F as a **derived formula** (`=IF(E2="RELATED",10,IF(E2="NOT_RELATED",0,""))`) — so neither an uncontrolled word nor an arbitrary number can be typed into the authoritative record. See `P-312`, `P-313`.

**Zero NOT_RELATED is a position, not an omission** (`P-312`), and the engine's support for it is proved anyway: `The_engine_still_supports_a_NOT_RELATED_domain` substitutes a table ruling `dom-003` not related and asserts a **resolved** zero — the only test in the file that substitutes anything.

### The three-way distinction that carries the whole design

|  | Scores | `Unresolved`? | What it says |
|---|---|---|---|
| `RELATED` | 10.00 | no | the business ruled: relevant |
| `NOT_RELATED` | 0.00 | **no** | the business ruled: not relevant |
| `MASTER_DATA_REVIEW_REQUIRED` | — | **yes** | nobody ruled, because the value is not a domain |
| *field left blank* | 0.00 | no | the applicant's own legitimate zero |

Rows 2 and 3 both end at zero points and mean opposite things; rows 3 and 4 are both "no points, no ruling" and have opposite *owners*. Collapsing any pair is the failure `P-294` avoided for a missing FIELD and `P-311` for a missing VALUE.

### Dropdown filtering — safe, because the architecture had already paid for it

The instruction made filtering conditional on safety. It is safe, and for a reason that predates this session: **each form-schema version carries its own frozen copy of the option list** rather than referencing a shared one. So `dm-gap-01.2026-09-28` offers 134 while `dm-gap-01.2026-09-21` still offers all 147, and no historical application can be reached by the change (`P-314`). `activeDomains()` and `INACTIVE_DOMAIN_CODES` are generated by the *same script* that generates the scoring table, so the list a person picks from and the table their pick is scored against cannot drift.

### Duplicates: recorded, not merged

3 near-duplicate pairs (`dom-125`/`dom-141`, `dom-111`/`dom-144`, `dom-145`/`dom-139`). Both sides of each are RELATED, so **scoring is identical whether they are ever merged or not** — which is exactly why merging them now would be risk for no benefit. `docs/expert-hub/EXPERT-HUB-DOMAIN-MASTER-CLEANUP.md` carries the 13 non-domains grouped by fault kind, the 3 pairs with a canonical *recommendation* (not a decision), the usage-count SQL to run against production first, the three places a `dom-###` code lives and which must survive forever, and a migration order that never rewrites an applicant's answer in place. `P-315`.

### Corrections this continuation

- **No new evaluation model version was minted, and `P-305` says one should be.** Checked rather than assumed: `dm-gap-02.2026-09-22` appears for the first time in **M35** — `M34` carries only `dm-gap-02.2026-09-21`, and the 09-22 work was never committed. So this finished defining a model that has never shipped, rather than changing a published one; no `SCREENING_RESULT` can pin to a row that never existed. Recorded as `P-316` so the next reader does not re-derive it.
- **The frontend suite failed on assertions that had pinned the old catalogue size.** `applicationValidation.test.ts` asserted `version === 'dm-gap-01.2026-09-21'` and `domain.options.length === 147`. Both were *correct* before the filter and wrong after. Updated to assert the real invariant instead of the old number: the master list is still 147, `INACTIVE_DOMAIN_CODES` is 13, the served version offers 134, and **none** of the inactive codes is offered.
- **A python patch aborted mid-run on a failed assertion.** It writes files only after every replacement matches, so nothing was half-applied — but the guard is the only reason. Worth keeping in every patch script.

### Validation — numbers seen on 2026-09-28

| | |
|---|---|
| Backend build | `Build succeeded. 0 Warning(s) 0 Error(s)` (warnings are errors here) |
| Backend tests | **331/331** passed, 0 failed, 0 skipped |
| Multi-qualification (§18) | **11/11** — incl. `Several_qualifications_survive_a_save_and_a_reload`, `Removing_the_middle_qualification_keeps_the_survivors_and_their_ids`, `Editing_one_qualification_leaves_the_others_alone`, `An_application_written_before_entries_reads_as_exactly_one`, `The_highest_qualification_scores_across_several_qualifications` |
| Pending model changes | «No changes have been made to the model since the last migration.» |
| M35 `Up` | 5 `UpdateData` + 6 `InsertData` — **0 destructive operations** |
| Frontend | typecheck ✓ · lint **0 errors** (1 pre-existing warning) · `lint:css` ✓ · **834/834** across 56 files · `build:expert-hub` exit 0 |
| Generated | `ClassifiedCount = 134`, `MasterDataReviewCount = 13`, `IsComplete = true` |
| Journey score | **39.92 → 49.92** — criterion #3 now pays its full 10.00 from the seeded table |
| Committed? | **No.** «Do not commit» stood throughout |

### Where it stopped

Criterion #3 is closed: every one of the 147 values carries a business classification, the reachable maximum is 100, and nothing scores by inference. Two things are open and **neither is a developer's**:

1. `EXPERT-HUB-DOMAIN-MASTER-CLEANUP` needs a data owner — run the usage query first.
2. Eight days of work (2026-09-21 → 2026-09-28, M34 + M35) sit uncommitted in one tree because «Do not commit» has stood since the first instruction. Somebody has to decide the branch.

---

## 15. Continuation — 2026-09-29: the three remaining business decisions

**Asked:** close the three items §14 left open, and nothing else. The checkpoint commit `ca846fd` is the accepted baseline.

### EVAL-GAP-11 — a blank classification is UNRESOLVED

`spec-025` turned out to be the **footnote row** under «أخرى» («*عند اختيار اخرى تتيح للخبير أو المدرب كتابة التخصص»), captured into the list as if it were a specialization. Its relevance cell is empty, and the generator wrote it as `0` — a silent zero wearing the face of a decided «غير ذي صلة مباشرة».

It was **not** reclassified as «not a specialization», which would have been a business decision nobody made. Blank → UNRESOLVED is exactly what was approved, and it is all that was done.

Fixed at the generator, not the symptom: an unclassified row is now **omitted**, and `"strict":true` went onto **all three** generated tables. Criteria #2, #7 and #8 join #3 as closed look-ups. #7 and #8 had no blanks — their generator already refused one — so strict there guards an unknown *code* rather than an unclassified one, which is the other half of the approved wording («missing lookup, unknown lookup»).

The frontend list gained a third state (`relevant: boolean | null`), because `false` was the same lie on that side.

**Deliberately untouched:** leaving the field blank stays the applicant's own legitimate zero, unflagged. A test pins it, because that distinction is the only thing that makes the flag mean anything.

### Referral buckets — the labels were wrong, the arithmetic was not

Checked before changing anything: the seeded rule was already `upTo 0 / 3 / 7 / open` — the contiguous 0 · 1–3 · 4–7 · 8+ reading. So this corrected comments and strengthened tests, and **created no version**. Inventing one would have been the "unnecessary version" the instruction forbids.

### preferredDeliveryMode — inert, and versioned anyway

`requiredFor: ALL_SERVICES` with `visibleFor: ['trainer']`. Verified on **both** sides that a hidden field is skipped (`ApplicationFormLogic.MissingOrInvalidFields` and `validateCompleteness` both `continue`), so no application's outcome differed either way.

I had reasoned from `M28` — which edited a published version's field definitions in place for wording — that an inert fix could ride in place too. **The generator overruled me**, in as many words:

> `REFUSED: … already exists and would change.`
> `A published schema version is history — bump the version in applicationSchema.ts instead of editing dm-gap-01.2026-09-28.`

That guard is the versioning policy in executable form. It is also why the evaluation model got a new version: applying a laxer rule to the model than the tooling applies to the form is an inconsistency nobody could defend later (`P-321`).

### Corrections this continuation

- **I was about to edit a published schema version in place.** The generator's own guard stopped it. Recorded because the `M28` precedent I reasoned from is real but narrower than it looks — wording-only, and not a licence.
- **I first determined that EVAL-GAP-11 needed *no* new model version**, reasoning from `P-316` that `dm-gap-02.2026-09-22` had never reached a database. Reversed once the schema guard showed what this project means by «published». `P-316` is not wrong; it is narrower than I was using it.
- **The GUID prefix scheme silently ran out.** Versions are tagged `e7…`, `f7…` — so I wrote `g7…`, and the seed's static initialiser threw at design time (`Unable to create a 'DbContext'`), because `g` is not a hexadecimal digit. The new version takes `a7…`/`a8…`; the prefix is a frozen tag, not an ordering.
- **A python inspection script left `docs/expert-hub/__pycache__/` in the tree** by importing the generator as a module. Deleted before staging. Import generators with `importlib` into a scratch directory, or set `sys.dont_write_bytecode`.

### Validation — numbers seen on 2026-09-29

| | |
|---|---|
| Backend build | `0 Warning(s) 0 Error(s)` |
| Backend tests | **347 / 347** (was 331 — 16 added, none removed or weakened) |
| Frontend | typecheck ✓ · lint **0 errors** (1 pre-existing warning) · `lint:css` ✓ · **838 / 838** (was 834) · build ✓ |
| Pending model changes | «No changes have been made to the model since the last migration.» |
| M36 `Up` | 5 `UpdateData` + 6 `InsertData` — **0 destructive**, and **no `EVALUATION_CRITERION` row of a superseded version is touched** |
| Versions created | `dm-gap-02.2026-09-29` (evaluation) · `dm-gap-01.2026-09-29` (form). Referral buckets: **none** |

### Where it stopped

All three decisions closed. `EXPERT-HUB-DOMAIN-MASTER-CLEANUP` remains **not started**, as instructed.
