# Matrix alignment, FAST reference data, and the release-readiness review

## 1. Resume here

| | |
|---|---|
| **Branch** | `expert-hub/uat-baseline`. It was created 2026-09-17 from the uncommitted working state on `expert-hub/prototype-parity` (§10) |
| **Base commit** | `39bfe3e` "style(expert-hub): match the internal staff screens to the Option B prototype" |
| **Committed?** | **Yes, one checkpoint commit** on `expert-hub/uat-baseline` (§10). It holds everything from M24 to M33 and the UAT docs. **Not pushed.** `.gitattributes`, `.gitignore` and the root `CLAUDE.md` remain modified and uncommitted **on purpose** (not Expert Hub, not touched in this session). |
| **Deployed** | No. |
| **Validation** | (2026-09-17, before the commit) Backend: clean build with **0 warnings**, **265/265** tests, no pending model changes. Frontend: **792/792** (56 files), typecheck ✓, lint 0 errors, lint:css ✓, build ✓. |
| **Next action** | The user pushes `expert-hub/uat-baseline` and deploys it to the testing server. Then: owners answer `25_UAT_BUSINESS_DECISIONS.md` (BD-UAT-01…07), external owners work through `26_UAT_EXTERNAL_DEPENDENCIES.md` (EXT-01…08), and testers run `27_UAT_TEST_MATRIX.md`. |

Reading order: this record (§10 first) → `25` … `28` → `24_RELEASE_READINESS.md` → `23_BUSINESS_REVIEW.md` →
`22_FAST_INTEGRATION_REQUEST.md` → `21_FAST_REFERENCE_DATA.md`.

## 2. What was asked, in order

1. **Phase 1:** align the code's matrices with the approved Notion matrices. Gap analysis first; Notion READ-ONLY. The instruction was re-sent twice; the third copy was declined to avoid duplicate migrations.
2. **Phase 2:** "Resolve Approved Business Decisions + Reuse Existing FAST Integration". Covered the interview model (70% pass mark, optional recommendation), form version `dm-gap-01.2026-09-16` (M26), named trainer, identity card, and more.
3. **FAST Reference Data:** investigate authentication, classify datasets, and build the persisted reference-data foundation (M27). Also fixed defects `preferenceOrder`/`preferenceRank` and the minimum-years filter.
4. **Final Business Decisions + FAST Integration Readiness** (this record's last part):
   - closed decisions P-268 … P-276;
   - wrote the FAST request document `22`;
   - named the credential keys;
   - produced the translation, range and rejection-reason review in `23`;
   - applied the label migration M28 and the domain mapping CSV;
   - ran a strict J-01 … J-26 review (`24`).

## 3. Rulings given in conversation

- «The frontend must NOT call FAST directly. FAST credentials/tokens must NEVER be exposed to the frontend.»
- «DO NOT invent credentials. DO NOT reuse an end-user token as a service credential.» / «DO NOT implement fake authentication.»
- «Keep the current meaning as CATEGORY preference for now. … Do NOT connect this field to FAST Program IDs.»
- «DO NOT switch the application dropdown yet … Historical: sa gcc other must remain readable forever. Do NOT automatically convert them.»
- «Do not assign business behavior to: isRestricted until FAST explains its semantics.»
- «One failed service must NOT fail the entire multi-service application.»
- «Do NOT merge duplicates yet. Do NOT automatically map POSSIBLE_MATCH values.»
- «frontend and backend must not display different wording for the SAME reason code … choose one existing canonical backend wording as the temporary technical source»
- «Do not mark READY just because a page exists. Verify the journey actually works end-to-end.»
- Standing rules: Notion READ-ONLY, Design System READ-ONLY, additive migrations only, never modify old migrations, «Do not commit.»

## 4. Corrections (claims that turned out wrong)

- **`11_JOURNEY_IMPLEMENTATION_MAP.md` marks J-02, J-03, J-06, J-10, J-11 and J-18 … J-22 as done.** The review showed several of those pages fail against the real API (mock-only tests), and J-02 has no backend. Replaced by `24`; a note was added at the top of `11`.
- **Phase 2's forward gate (`no-service-passed`)** was believed to implement "only passed services proceed". It mishandles an application with an interview-*exempted* service when every interviewed service fails: only whole-application rejection remains. Recorded in `24` (non-blocking findings); not fixed, because it needs a wire change.
- **`FastCountryReader` typed `nafathMappingCode` as a string.** The register DTO says integer, so a real response would have failed to deserialize. Fixed in the FAST phase.
- **The FAST report said the sync "makes an AR call and an EN call".** That is the *design* for programmes; nothing like it is built (countries carry both languages). The doc was corrected.
- **`npx tsc --noEmit -p tsconfig.json` was trusted as the type check.** It doesn't cover Expert Hub. Use `npm run typecheck:expert-hub`.
- **A `grep … && python …` chain reported success while the edit never ran** (grep exited 1). Verify edits after chained commands.

## 5. Where it stopped

- All requested artefacts are written.
- Nothing is committed.
- The user's open question: `SAFE_TO_COMMIT_CHECKPOINT`, answered in the final report.
- The FAST request is not yet sent (the user shares it).

## 6. Validation (numbers seen this session)

- Backend `dotnet build --no-incremental`: 0 warnings, 0 errors. `dotnet test`: **241/241**. `has-pending-model-changes`: none.
- Frontend `validate:expert-hub`: typecheck ✓, lint 0 errors / 1 pre-existing warning (`InterviewSlotsField.tsx`), `lint:css` ✓, **721/721** tests (49 files). `build:expert-hub` ✓.

## 7. Questions, by who can answer

- **FAST:**
  - a client-credentials service client (A1–A10 in `22`);
  - the `GetPlansByProgramId` contract;
  - the complete programme catalogue;
  - `FrameworkStructureRequestDto`;
  - the `GetSectors`/education/topic/competency schemas;
  - what `isRestricted` means;
  - STS redirect-URI registration (`Q38`).
- **Business:**
  - J-02 scope (build or descope, and remove the button);
  - the operational centre list;
  - the addendum rule when there is no active agreement;
  - pending translations and experience ranges (`23` §3–4);
  - rejection-reason, screening, matching, notification and public-card matrices;
  - 147-domain mapping once FAST data arrives.
- **Legal:** agreement text retention, signed artefact, e-signature provider.
- **Infrastructure / DevOps:** email gateway; UAT/production `EXPERT_HUB_API_BASE_URL` and OIDC client.

## 8. Environment traps

- Bash heredocs with Arabic, quotes or backslashes break. Write a Python script to the scratchpad and run it.
- `graphify` isn't on the Git-Bash PATH. Use `python -m graphify update .` from the repo root.
- EF prints "may result in the loss of data" for a migration that only runs `UpdateData`. Read the operations before trusting or fearing it (M28 is `UpdateData` only).
- Frontend command output carries ANSI codes. Strip them (`sed 's/\x1b\[[0-9;]*m//g'`) before grepping for totals.
- The backend suite takes about 2 minutes on LocalDB. Don't run it while another build writes `bin/`.

---

## 9. Continuation — 2026-09-17: release-blocker remediation

**Asked:** «Fix All Technically Resolvable Blockers and Critical Defects» — plan RB-01…RB-13, then implement. Rules: «The frontend must NOT call FAST directly», «Do not invent: FAST contracts, legal agreement text, centre master data, notification routing rules … external credentials», «Do not commit», old migrations untouched.

**Done:** see `24_RELEASE_READINESS.md` → *Remediation — 2026-09-17* (7 RESOLVED, 6 PARTIALLY_RESOLVED, 0 STILL_BLOCKED) and `DECISIONS.md` P-277…P-290. Migrations M29 (offer expiry), M30 (notification occurrences), M31 (assignment centres), M32 (agreement document versions), M33 (stored document references) — all additive.

**Method:** a requirements agent (Notion READ-ONLY) settled the rules first; backend changes were serial (one migration at a time); four frontend agents worked on disjoint feature folders against **contract fixtures generated by backend tests** (`contracts/fixtures`, `ContractFixtures.cs`, P-277).

**Corrections this continuation:**
- The first J-19 test assertions and the reminder test raced the new hosted workers (they run at start-up on the real clock): the reminder test now uses a 2030 clock.
- Twice a `dotnet test --no-build` ran against a stale build after a compile error / a new migration file — always build first.
- `/internal/centres` served `{centreId,nameAr,nameEn}` while the request form expected `{value,labelAr,labelEn}`: another mock/API drift, fixed by a dedicated lookup.
- The J-17 full-rejection copy promised an automatic new list; the platform opens a re-routing cycle for staff — copy corrected.

**Validation (seen):** backend clean build 0 warnings, **262/262**, no pending model changes; frontend typecheck ✓, lint 0 errors (1 pre-existing warning), lint:css ✓, **788/788** (55 files), build ✓. Frontend runs with file parallelism showed occasional first-test timeouts under load; the official serial `test:expert-hub` run is green.

**Where it stopped:** nothing committed. Remaining items are external (STS registration, UAT/prod env, email gateway, Yaqeen, e-signature/legal) or business (J-02 identity linking, J-03 no-agreement approval, J-17 segregation and automatic re-pool, J-26 feature codes, notification routing).

---

## 10. Continuation — 2026-09-17: UAT baseline, hardening and checkpoint

**Asked:** «EXPERT HUB — UAT BASELINE, FINAL HARDENING & CHECKPOINT». Create `expert-hub/uat-baseline` «from the CURRENT working state». Audit secrets and migrations. Harden contracts. «UAT and Production MUST NOT silently use mocks». Add an internal provider readiness view. Write the business-decision, external-dependency and UAT-matrix documents. Run full verification. Commit a checkpoint only if all of it passes. Then give the server update commands.

**Rulings quoted:** «Do not invent missing business rules. Do not implement fake external integrations.» · «Do NOT make the business decision yourself.» · BD-UAT-04 «Do not change until approved.» · «Do not guess route paths. Inspect code.» · «Do not blindly commit unrelated files.» · «If any real secret is found: STOP. Do not commit it.»

**Done:**
- Branch created without switching.
- Secrets audit over the whole intended diff: no real values. Only empty keys, documentation text and test-only strings.
- Migration audit M24–M33: all additive. The one caveat is that **M32's `Down` restores a UNIQUE index on `SIGNING_SEQUENCE.agreement_id`, which fails once voided chains exist**, so rolling M32 back is only safe before any modification cycle. `RemediationMigrationTests` covers legacy rows through M29–M33, a rollback to M28, and an empty database.
- **P-291:** the frontend refuses to start outside `development`/`test` if it would use demo data, the placeholder sign-in, or a module off `EXPERT_HUB_DATA_MODE` (`deploymentProblems`). `uat.env`/`production.env` comments corrected.
- **P-292:** `GET /api/v1/internal/readiness` (internal role, statuses only).
- New docs: `25_UAT_BUSINESS_DECISIONS.md`, `26_UAT_EXTERNAL_DEPENDENCIES.md` (SSO/FAST/email checklists), `27_UAT_TEST_MATRIX.md`, `28_API_CONTRACT_INVENTORY.md`.

**Corrections this continuation:**
- `uat.env`/`production.env` said an empty API base URL «runs on its in-memory mock providers». That was true, and it was the defect. The comments now say the app refuses to start.
- The OIDC redirect URI in the env files (`/expert-hub/auth/callback`) is **not** the URI the STS returns to. It only switches the frontend to real sign-in (`oidcConfig.ts` requires it). The URI to register is the API's `/api/auth/callback` (`Oidc:CallbackPath`). Recorded in `26`.
- `Fast__ClientId`/`Fast__ClientSecret` are read by **no code** (the token provider is still `NoFastToken`). Readiness therefore reports FAST as `DEGRADED`/`NOT_CONFIGURED`, never READY, whatever those keys hold.
- `dotnet ef migrations has-pending-model-changes` fails when `--startup-project src/ExpertHub.Api` is passed (no EF Design reference there). Use `--project src/ExpertHub.Infrastructure` alone.
- First drafts of `28` guessed service method names and claimed every mock imports its fixture. Both were checked against the code and corrected (three mocks import fixtures; the rest are typed only).

**Validation (seen, before the commit):**
- Backend: `dotnet build --no-incremental` gives 0 warnings and 0 errors. `dotnet test` passes **265/265**. `has-pending-model-changes`: none. Filtered runs: migrations 6/6, FAST reference 7/7, readiness plus configuration safety 16/16, Cap03 plus Cap05 (contract fixtures) 29/29.
- Frontend: `validate:expert-hub` passes (typecheck ✓, lint 0 errors / 1 pre-existing warning, lint:css ✓, **792/792**, 56 files). `build:expert-hub` ✓.

**Where it stopped:** the checkpoint commit is on `expert-hub/uat-baseline` and not pushed. Push and deploy are the user's step. Open items are in `25` (business), `26` (external) and `24` (remaining findings).

