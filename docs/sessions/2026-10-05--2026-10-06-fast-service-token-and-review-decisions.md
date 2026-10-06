# FAST service token working, the FA portal API register regenerated, and the 13 review decisions

## Resume here

| | |
|---|---|
| **Branch** | `expert-hub/uat-baseline` |
| **Head** | `15bbe0c`. **Everything in this record is uncommitted** |
| **Release tag** | none for this state; latest is `expert-hub-v1.3.0` |
| **Deployed** | Testing server (`FA-QIYAS`) runs `15bbe0c` with the FAST service credential added to `env/api.secrets.env` (`fast_test`, scope `fast_integration`). The code in this record (M40) is **not** deployed |
| **Backend validation** | `dotnet build` 0 warnings / 0 errors · `dotnet test` **402/402**, 4 min 22 s (run 2026-10-06 after the last backend change). Cap03+Cap04 re-run 26/26 after the fixture re-apply |
| **Frontend validation** | `validate:expert-hub` clean (1 existing warning, `InterviewSlotsField.tsx:43`) · **886/886** · `build:expert-hub` ✓ · Design System suite **725/725** |
| **State** | All 13 review decisions answered (`P-333`–`P-340`); everything buildable is built. Two waiting: `P-337` (FAST), `P-338` (Academy list) |
| **Next thing to do** | Ask to commit (suggested split below), then deploy M40. Separately, send FAST the authorization question (*Where it stopped*) |

**Reading order:** this record → `DECISIONS.md` `P-333`–`P-340` →
`BUSINESS-REVIEW-2026-10-01.md` § *Open decisions* (now has an *Answer* column) →
`fa-portal-api-register.md` header.

⚠️ **The agreement-preparation endpoint now REQUIRES an uploaded file**
(`documentAttachmentId`, 400 `agreement-document-required`). Any script or test
data that prepares agreements without one will break.

## What was asked, in order

1. The FAST team's reply on service-to-service auth: *"Client ID: fast_test … Allowed Scope: fast_integration … please check whether the integration is working properly"*.
2. How to restart the container. Then step-by-step help on the server: env-file placeholder, `invalid_client`, and *"this is the clint "ClientSecret" … how i should but it on .env?"*.
3. *"i have update the cline and i want to test it"* → a token was issued, and the lookups returned 200.
4. *"i get 200 not 401 but i want to see the upcoming plans to do assginment"* → Program/Search and GetPlansByProgramId tested live.
5. *"before starting anything make sure all data is there from this swagger URL and build for me registry for this swagger"*.
6. More live calls (paging, LiveSessions, PlanTakers), then *"how to chack the token ? and test it again"*.
7. The 13-item decision list from the 2026-10-01 review, with the owner's answers, and three follow-up questions.

## What shipped (uncommitted)

### FAST server-to-server, configured and tested (no code)
`ClientCredentialsFastTokenProvider` (`P-330`) needed nothing. The testing server
got the three `EXPERT_HUB_FAST_*` values, and the reference sync copied
`fast-country` (319 rows). Live results: tokens are issued; a protected endpoint
refuses the token at **authorization**, not authentication (details in the
register header).

### The FA portal API register is generated
`docs/expert-hub/fast-api/build-register.py` rebuilds `fa-portal-api-register.md`
from saved inputs:
- `swagger-v1.json` / `swagger-v2.json`, the snapshots;
- `live-calls.json`, the live results;
- `observed-fields.json`, the fields of untyped responses.

Sections 1–3 are hand-written and carried over; 4–8 are generated. A rerun with no
new capture produces identical output and keeps the last diff. **Principle:**
live observations are data next to the swagger, never hand edits to the register.
Since 8 September: +29 / −1 operations (353 total).

### The 13 review decisions (`P-333`–`P-340`, see `CHANGELOG.md` 2026-10-06)
- **Agreement = uploaded file per trainer** (`P-333`). Migration **M40** adds
  `AGREEMENT.document_attachment_id` and `AGREEMENT_DOCUMENT_VERSION.attachment_id`.
  The upload is `POST v1/internal/attachments`, purpose `agreement-document`,
  feature F-0301. **Technique:**
  - The version hash is the upload's recorded SHA-256 (`Attachment.Checksum`).
  - A new version is cut when the file **or** the fields or merged data change.
  - Same file → same hash, by design.
  - The attachment download route now also admits the agreement's trainer, once
    the agreement has been sent to them.
- **Staff-only version/hash** (`P-334`). A separate `ApplicantAgreementDocumentWire`
  carries no template name, version or hash, and no body when a file exists. The
  frontend type `ApplicantAgreementDocumentDto` mirrors it.
- **Public profile** (`P-335`). `PublicProfileAsync` holds the one
  consent+listable gate for both the profile and the new
  `/directory/{id}/photo`, returning one identical 404. The privacy test is now a
  **property allow-list** (closes the UI-27 test gap).
- **Wording** (`P-339`) and **Pagination** (`P-340`, test-only Design System change).

## Verbal rulings

| Ruling | What it changed |
|---|---|
| *"1- it will be uploaded file"*, then **"A file per trainer"** | `P-333` |
| *"2- it will be uploaded agreement"*, then **"Staff only"** | `P-334` |
| *"3- النبدةو الاسم المجال، البرامج المقدمة مع الاكاديمية الصورة الشخصية"*, then **"exactly my list with the classification"** | `P-335`: city dropped, photo added, classification kept |
| *"9- remove the tag"* | Badge removed; classification shown as text (reconciled with item 3) |
| *"4- A"*, *"5- keep it as free text"*, *"6- A"*, *"7- A"*, *"10- A"*, *"11 - A"*, *"12 - A"*, *"13 - A"* | `P-335`, `P-336`, `P-337`, `P-338`, `P-339`, `P-340` |

## Corrections

1. **"`Pagination` still shows Arabic-Indic digits"** (UI-14, and repeated as item 13 of the list given to the owner). **Wrong.** It renders a raw number, which React writes as 0–9; the existing test already named a page button `3`. Recorded in `P-340`. No component change; a guard test was added.
2. **"The service token is rejected"** (said after the first `GetProgramLiveSessions` call). **Imprecise.** No token and a fake token both get HTTP 401 from the middleware. The `fast_test` token passes it and is refused in the controller (`success=false, Unauthorized`). It authenticates and fails authorization. The register header says so.
3. **"Search returned 12 programmes"** was read at first as the catalogue. It was **page 1**: `totalItems=270`, and the page size is capped at 100.
4. **Worktree agents** were launched for the build and failed at creation: *Filename too long* on Windows, from the long journey file names. The work was done sequentially in the main tree. Don't use `isolation: worktree` in this repo on Windows.
5. **`prettier --write` on whole feature folders** reformatted 24 unrelated files that were not prettier-clean. They were reverted with `git checkout`. The revert loop also reverted the three contract fixtures by mistake; they were re-applied and re-verified (Cap03/04 26/26, frontend 886/886). Format only the files you touched.

## Where it stands

- **Complete:** every decision that can be built.
- **Waiting on others, not on work:**
  - `P-337`: FAST has no endpoint returning another person's delivered programmes.
  - `P-338`: the Academy's specialization list.
- **Needs Confirmation:** whether J-01's 1 MB upload limit is enough for an agreement file (`P-333`).

## Open questions, by who can answer them

- **FAST team:**
  - Which `/fa-api` endpoints does `fast_integration` grant? (`GetProgramLiveSessions` refuses it at authorization.) What does the token's `client_role` need to be?
  - Plan status, plan code and the assigned trainer's id on plans; an endpoint to record the assigned trainer.
  - Per-trainer delivered programmes (`P-337`).
  - A production client.
- **Academy / owner:** the specialization list (`P-338`); is 1 MB enough for agreement files?
- **Technical:** none blocking.

## Where it stopped

The session record was the last step; **nothing is half-done**. The user had not
yet sent the `client_role` value from the decoded token (their paste started at
`all claims`). The reply to FAST was drafted in conversation but not sent.
Proposed next step, after a commit: the read-only "upcoming FAST plans" picker
for the J-16 assignment request (`Program/Search`, paged and dated only →
`GetPlansByProgramId`, plans with an empty `trainerName`). It was offered and is
not yet approved.

Suggested commit split:
1. `docs(fast)`: the register generator and its inputs, and the regenerated register.
2. `feat(expert-hub)`: `P-333`/`P-334`, the agreement file (M40).
3. `feat(expert-hub)`: `P-335`, the public profile.
4. `fix(expert-hub)`: `P-339`, wording.
5. `test(ds)`: `P-340`, Pagination digits.
6. `docs`: DECISIONS, BUSINESS-REVIEW, CHANGELOG, this record.

## Resuming

```bash
git switch expert-hub/uat-baseline
sqllocaldb start MSSQLLocalDB
cd backend/expert-hub && dotnet build && dotnet test      # expect 402/402, ~4.5 min
cd ../../frontend && npm run validate:expert-hub && npm run build:expert-hub   # 886/886
python docs/expert-hub/fast-api/build-register.py 2026-10-06   # from repo root; identical output
```

**Environment traps (new this session):**
- `dotnet ef migrations add` with `--startup-project src/ExpertHub.Api` fails (no EF Design reference). Use `--project src/ExpertHub.Infrastructure` alone (already recorded 2026-09-16, hit again).
- `AgreementDocuments.SnapshotAsync` joins its hash input with an invisible `\x1f` separator. A text match that types `""` misses it.
- Git Bash heredocs containing large Python scripts can fail with *unexpected EOF*. Write the script to the scratchpad and run it.
- Python string literals turn `٠` into the real character. Use a raw string when the target file needs the escape.
- On the server, `docker compose restart` does not re-read env files. Use `up -d expert-hub-api` with the same `--env-file` list (`local.env`, then `api.secrets.env`; the compose label `com.docker.compose.project.environment_file` shows it).
