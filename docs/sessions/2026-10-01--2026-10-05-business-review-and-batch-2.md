# Business review committed, and batch 2 of the backend fixes finished

## Resume here

| | |
|---|---|
| **Branch** | `expert-hub/uat-baseline` |
| **Head** | `4d63db2` (FAST server-to-server auth) + this record update |
| **Pushed** | up to `4d63db2`. This record update is local |
| **Release tag** | none for this state; latest is `expert-hub-v1.3.0` |
| **Deployed** | `4d63db2` on the testing server (`172.16.160.84`, `experts.fa.gov.sa`), M37+M38 applied, backup `ExpertHub-pre-4d63db2.bak`. The bio work (M39) is **not** deployed |
| **Backend validation** | `dotnet build` 0 warnings / 0 errors · `dotnet test` **399/399**, 4 min 30 s (run 2026-10-05, after the last code change) |
| **Frontend validation** | typecheck clean · `lint:expert-hub` 0 errors (1 pre-existing `react-refresh` warning, `InterviewSlotsField.tsx:43`) · `lint:css` OK · `test:expert-hub` **884/884** · `build:expert-hub` ✓ (run 2026-10-05 after the bio work) |
| **State** | Batch 2 is **complete**. 13 business decisions from the 2026-10-01 review are with the business owner |
| **Next thing to do** | Wait for FAST's client credential (message sent by the user). Meanwhile batch 3, see *Where it stopped* |

**Reading order:** this record → `docs/expert-hub/BUSINESS-REVIEW-2026-10-01.md`
(its *Open decisions* table) → `DECISIONS.md` `P-328`, `P-329`.

⚠️ **Before M37/M38 reach a database with real data**, run
`backend/expert-hub/scripts/sql/m37-live-row-uniqueness-preflight.sql`. Migrations
run at startup, and a failed unique-index creation is logged while the process
keeps serving. The result is a silently missing index.

## What was asked, in order

1. *"what we are missing ?"* The answer came from the repo: the business-review
   work was uncommitted (119 files) and had no record, `a0f98d8` had no record
   either, batch 2 was half done, and 13 business decisions were open.
2. *"so what you need for me our what the next ?"* That produced three questions:
   (A) delete the two zips? (B) can a renewal be applied twice on purpose?
   (C) push?
3. *"A yes / B yes / C yes / start but give me short list to answer"* The
   13-question business list went to the user. Then validate, commit, push,
   finish batch 2, and write this record.

The order was deliberate: validation first, because the business review had
recorded typecheck and lint but **no test run** and no backend run after its
three backend edits.

## What shipped

### The 2026-10-01 business review, committed (`ab5ce99`, `03d9b31`)

The work was done in an earlier session. This session validated, committed and
pushed it. The detail per item is in `BUSINESS-REVIEW-2026-10-01.md`. Separately
committed: `docs.zip` and `handoff.zip` deleted (39 MB, copies of tracked
folders), and `graphify-out/` ignored.

### Batch 2, part 1 (`a0f98d8`, committed 2026-10-01, unrecorded until now)

M37's four filtered unique indexes and `UniqueViolationExceptionHandler`
(2601/2627 → 409). See `P-328` and the commit message, which carries the two EF
traps.

### Batch 2, part 2 (`5b15920`)

**Principle:** the index is the backstop and the claim is the mechanism. Each
transition now runs `ExecuteUpdateAsync … WHERE <state it read>` inside a
transaction, and a zero row count is a 409 naming the business state. Where the
transition writes several columns, the claim **sets a column to itself**. That
still takes the row lock and still counts the row, so a concurrent loser blocks,
re-reads and finds it moved. Every early `return` after the claim relies on
`await using` disposal to roll back.

| Transition | Claimed on |
|---|---|
| Lifecycle renew/suspend/reactivate/end | `status`, `ends_at`, `renewal_count` as read (`P-329`) |
| Signing-sequence formation | `formation → in_progress` |
| Applicant sign/reject/request-modification | `status = sent_to_applicant` |
| Pool decision (request and slot scope) | `sent → decided` |
| Interview evaluation | the interview row locked first, so the panel serialises; then the member's own `submitted_at IS NULL` |

**M38: `REFERENCE_COUNTER`** replaces `max + 1` in all four generators (`EH-`,
`EH-ASR-`, `AGR-`, `ASR-`) with `ReferenceNumbers.NextAsync`: one `MERGE … WITH
(HOLDLOCK) … OUTPUT`. It is seeded from the highest stored reference on every
call, so existing series continue and the counter can never fall behind the
table. A rolled-back caller leaves a gap, which is harmless. A per-year SQL
`SEQUENCE` was not used because the series restart each year.

### FAST server-to-server authentication (`4d63db2`, `P-330`)

`ClientCredentialsFastTokenProvider` replaces the `NoFastToken` seam when
`Fast__ClientId` and `Fast__ClientSecret` are both set. It discovers the token
endpoint, posts `client_credentials`, and caches the token until 60 s before
expiry. Every failure fails closed. **Principle:** two authentication paths that
never mix. The sign-in read keeps the person's own token, because a «current
user» endpoint answers about whoever holds the token. The testing STS discovery
document (read 2026-10-05) advertises `client_credentials`,
`client_secret_basic`/`post` and a `fast_integration` scope. FAST does **not**
need our API URL for this grant: nothing calls back. At most it needs our
outbound IP.

### The trainer short bio (`P-331`, UI-15) — uncommitted at the time of writing

**Principle:** two texts, never one. `TRAINER_BIO.draft` is the trainer's, and
`published` is the last approved one, the only one any other surface reads. A
`revision` counter goes back with every action (draft request, AI write,
submission, decision), so stale reviewers get 409 and late AI answers write
nothing. The AI rides the existing INT-06 channel (`TrainerBioDrafting`), and
reads the CV at send time (`CvText`, PdfPig for PDF). It is off until `Q28`.
Review is a page under the trainer database (`/internal/trainers/bios`), gated
on `F-0401`. The 400 / 409 / 403 rules, the audit rows and the late-answer
claim each have a test.

## Verbal rulings

| Ruling | What it changed |
|---|---|
| *"B yes"* (to *"Can a renewal ever be applied twice on purpose?"*) | The lifecycle claim refuses a **stale** request, not a second renewal (`P-329`). The concurrent-renewal test accordingly asserts that every success is counted once, not that one of them loses |
| *"A yes"* (delete `handoff.zip` / `docs.zip`) | Committed as their own `chore` commit (`ab5ce99`) |
| *"i want to intgrate with fast to auth the API server to serverr not what we are doing now"* | `P-330`: service identity via client credentials; the sign-in read stays on the user token |
| *"8 - A: Add one … and this should come from the CV when persening it"*, then by question: AI drafts / trainer confirms · employee approves · public with consent | `P-331`, and the whole bio feature |
| *"C yes"* (push) | Pushed `04bebf8..03d9b31`. Read as covering the commits it was asked about, so `5b15920` was **not** pushed without asking again |

## Corrections

1. **"Batch 2 still needs the offer-exclusion fix"** (the previous record's
   item 5, repeated in this session's first answer). **Wrong.** It was already
   in committed code: `DEF-02`, `OfferService.cs:88-119` excludes anyone holding
   a live offer on a sibling slot, including offers opened earlier in the same
   loop. Like the screening correction in the previous record, the batch list
   was written against the pre-commit tree.
2. **"The newest session record is the 2026-10-01 one, so the repo is
   documented to head."** It was not: `a0f98d8` and the whole business review
   came after that record and were in neither it nor the index. This record
   covers both.

## Where it stands

- **Complete:** batch 1, batch 2, and the business-review remediation as far as
  it can go without decisions.
- **Waiting on the business owner, not on work:** the 13 decisions in
  `BUSINESS-REVIEW-2026-10-01.md` § *Open decisions* (the user has them as a
  short list), which block UI-01/03/04/07/09/13/14/15/16/22/23/27/28.
- **Known limit, accepted:** two renewals that do not overlap in time look the
  same as two deliberate ones. Telling them apart would need the client to send
  the state it saw.

## Open questions, by who can answer them

- **Business owner:** the 13 decisions (agreement legal text DM-GAP-16, version
  and hash visibility, bank list, «معتمد» per service, trainer bio, who fills
  `TRAINER_RECORD`, specialization taxonomy, «ارتباط»/«إسناد», CTA labels, Portal
  Home labels, consent enumeration, public record id).
- **Design System owner:** Latin digits in `Pagination` (UI-14).
- **FAST team** (message drafted for the user, 2026-10-05): the client ID and secret per environment, confirmation of the `fast_integration` scope, **whether `/fa-api` accepts a service-principal token (A10, the biggest risk)**, the production authority, and IP allow-listing.
- **Infrastructure:** the API server's outbound IP, if FAST allow-lists.
- **Technical:** none blocking.

## Where it stopped

The record was the last step. **Nothing is half-done.** `5b15920` and this record
need a push, which was not re-asked.

Proposed next, in order of value:
1. **Batch 3:** a backend CI workflow (none exists; `dotnet test` is manual),
   .NET 10 (`net9.0` is out of support), OpenAPI, rate limiting on the anonymous
   directory, paging on the unbounded internal lists.
2. **Small tickets:** the PascalCase `VisibilityConsentDecidedAt` column (needs a
   migration), the CAP-03 entities filed under the CAP-05 comment in
   `ExpertHubDbContext.cs`, and `04_SCREEN_INVENTORY.md` still saying "Not
   started".
3. The business decisions as they arrive.

## Resuming

```bash
git switch expert-hub/uat-baseline           # head 5b15920 + this record
sqllocaldb start MSSQLLocalDB
cd backend/expert-hub && dotnet build && dotnet test    # expect 383/383, ~4 min
cd ../../frontend && npm run validate:expert-hub && npm run build:expert-hub   # 876/876
```

**Environment traps (new this session):**

- `test:expert-hub` takes **~5 minutes** (`--no-file-parallelism`), so give the
  command a 10-minute timeout.
- `graphify query` **does** work from the Bash tool now. The previous record said
  it was not on PATH.
- `/usr/bin/sort` is still permission-denied in the Bash tool.
