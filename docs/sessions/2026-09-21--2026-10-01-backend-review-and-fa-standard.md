# Backend best-practice review, batch 1 of the fixes, and the FA standard adopted

## Resume here

| | |
|---|---|
| **Branch** | `expert-hub/uat-baseline` |
| **Head** | `16f04ed` (docs: FA standard) — code fixes are `ef1ee19` |
| **Release tag** | none for this state; latest is `expert-hub-v1.3.0` |
| **Deployed** | nothing new. These commits are local and unpushed |
| **Backend validation** | `dotnet build` 0 warnings / 0 errors · `dotnet test` **373/373 pass**, 4 min 1 s (run 2026-10-01) |
| **Frontend validation** | **not run this session** — no frontend code changed, only three `AGENTS.md` markdown files |
| **State** | Backend reviewed end to end. Batch 1 of the fixes is committed and green. Batch 2 (needs a migration) is **not started** |
| **Next thing to do** | Batch 2: the conditional-claim concurrency fixes + filtered unique indexes + a 409 handler for unique violations + sequences for reference numbers + the offer-exclusion fix. See *Where it stopped* |

**Reading order:** this record → `context/architecture.md` and
`backend/expert-hub/AGENTS.md` (both new, loaded every session) →
`docs/adr/0001-expert-hub-backend-does-not-follow-tfa-clean-architecture.md`.

⚠️ **Two facts that mislead if skipped.** (1) The review that produced the batch
list ran against the **working tree before** `ca846fd..04bebf8` were committed,
so some line numbers in it have moved and one finding was already fixed — see
*Corrections*. (2) `/fa:init` and `/fa:audit` added a `context/` reference set
that `CLAUDE.md` now imports into **every** session: a wrong fact in there is a
wrong fact everywhere, so treat those files as code.

## What was asked, in order

1. *"Review this ASP.NET Core backend and make sure it follows modern .NET and
   ASP.NET Core best practices. Check the architecture, dependency injection,
   async usage, API design, error handling, EF Core usage, and testing. Use the
   installed dotnet-skills where applicable."*
2. Install the FA standard plugin: `claude plugin marketplace add
   alihassandbouk/fa-ai-standard-template`, then `claude plugin install fa@fa-ai`.
3. `/fa:audit` — which could not run, because the repo had no `context/`.
4. `/fa:init` — scaffold the standard.
5. After the promotion check, *"pick"* → then all three candidates selected.
6. *"add it on the original CLAUDE.md don't create new one,"*
7. *"yes it is"* → confirmed (by question) as: work on `expert-hub/uat-baseline`.
8. `/fa:audit` again, now that `context/` existed.
9. *"what you need to do next?"* → *"start yes"*: commit, and write this record.

The order matters: the review came first and produced the findings, but the
standard was adopted **before** any fix was committed — which is why the two
rules the fixes are built on (catch filters, row claiming) are written into
`context/code-standards.md` rather than only into commit messages.

## What shipped

### The review (no code, 3 parallel read-only agents + direct reading)

About 30k lines of C# across `ExpertHub.Api`, `.Infrastructure`, `.Core` and the
test project. Verdict: the foundations are sound — cancellation tokens forwarded
everywhere, no sync-over-async, no captive dependencies, RFC 7807 on every error
path, append-only tables enforced structurally in `SaveChanges`, audit and outbox
rows written in the same transaction as the change, and integration tests against
a real SQL Server rather than the in-memory provider. The defects clustered in
four places, which became the batch list.

**Technique worth keeping:** the review was split by *dimension per area* and
every agent finding was then re-verified against the file before it was believed.
Three of roughly forty findings did not survive that check.

### Batch 1 — `ef1ee19`

**The principle behind it:** a guard that reads as if it contains a failure, but
does not, is worse than no guard — it moves the failure somewhere nobody is
looking.

- **17 catch sites in 13 files.** `when (e is not OperationCanceledException)`
  also filters `HttpClient.Timeout`'s `TaskCanceledException`. Now written
  against the token: `|| !<token>.IsCancellationRequested`. In `OutboxPublisher`
  this was an availability bug, not a tidiness one: the escaped exception faulted
  `ExecuteAsync`, .NET's default `StopHost` stopped the API, and because the
  attempt was never saved the same message faulted again after restart.
- **The three `HttpClient` singletons** (FAST, Teams, LLM) go through one helper
  with `PooledConnectionLifetime` (DNS) and an explicit `Timeout`.
- **`BusinessCalendar` counts in Riyadh** (fixed `+03:00`, not a time-zone id —
  the id differs between Windows dev and the Linux container).
- **The offer expiry sweep catches per offer** and logs the id; the list is
  ordered by `response_due_at`, so one bad row used to block every later expiry.
- **Attachment download checks the `internal` session role**, not
  `APP_USER.is_employee` — a FAST-sourced flag that nothing ever sets back to
  false.
- **Certificate removal scoped to `RuleCode == "professional-certificate"`**; it
  could delete the CV, the ID document or a qualification.
- **Session tickets encrypted with `IDataProtector`.** `TicketSerializer` only
  serialises — in the cookie the handler encrypted, and a session store sits
  behind that, so the rows held every claim and the id token as readable bytes.
- **`SafeRelativePath` rejects control characters** (`/%09/evil.example`).
- **A failed role resolution at sign-in is logged** (event 5103).
- 8 new tests: the Riyadh weekend boundary across all 24 hours of a day, and the
  four control-character redirect forms.

### The FA standard — `16f04ed`

`/fa:init` scaffolded it; `/fa:audit` filled it from the code (3 read-only
recon agents + one agent for the diagram). `context/project-overview.md`,
`architecture.md`, `code-standards.md`, `ui-rules.md`, nine
`context/integrations/*.md`, `docs/schema.d2` (79 tables, 11 capability
containers), `docs/adr/0001`, and `AGENTS.md` for the backend, the design system
and the Expert Hub SPA.

**Principle applied to the context files:** they record what the build actually
enforces (DC-04/DC-23 by name, warnings-as-errors, the boundary test and the
ESLint rule with their line numbers), and for every integration whether it is
*registered and deliberately off* — because "it is wired but disabled" is the
thing a new session gets wrong first.

## Verbal rulings

| Ruling | What it changed |
|---|---|
| *"add it on the original CLAUDE.md don't create new one,"* | The four `@context/*.md` imports went into the existing 430-line `CLAUDE.md` after `## Objective`. `/fa:init` cannot do this itself — it never overwrites an existing file, and the import block lives in the template's own `CLAUDE.md`, so without this step the whole `context/` set is dead weight |
| *"yes it is"* (→ work on `expert-hub/uat-baseline`) | Batch 1 landed on the UAT branch rather than a fresh one. Ambiguous phrasing, disambiguated by a question before any edit — the answer could equally have meant "the context load is heavy" |
| *"pick"*, then all three | The three promotion candidates each went to their proper home instead of staying in the diary: one ADR, two rules in `context/code-standards.md` |
| *"Use the installed dotnet-skills where applicable."* | `dotnet-webapi`, `efcore-patterns` and `microsoft-extensions-dependency-injection` were loaded and used — and three of their recommendations were **explicitly rejected** for this codebase (see below). A skill is advice, not a spec |

Rejected skill advice, recorded so it is not re-litigated: interface-per-service
(one implementation each), a context-wide `NoTracking` default (would silently
turn existing tracked updates into no-ops), and a `TypedResults` migration
(pays off only with OpenAPI, which this API does not have).

## Corrections

**Four claims made this session turned out to be wrong.**

1. **"Screening returns a 500 for any application with repeated sections"**
   (`ScreeningEndpoints.cs:570`, reported as a fix-first defect). **Already fixed
   in the committed code** — it groups by field code and takes entry 0. The
   review had read the working tree *before* `ca846fd..04bebf8` were committed.
   The cause is general: **line numbers and findings from that review are against
   the pre-commit tree.** The five other batch-1 items were re-verified against
   HEAD before editing, and were still live.
2. **"There's no pipeline file in the repo"** (review, testing section). Wrong:
   `frontend/.github/workflows/ci.yml` exists and runs typecheck, lint,
   format:check, coverage, tokens:validate, build and build-storybook on push to
   `main` and on PRs. What is true, and now recorded in
   `context/architecture.md`, is that **there is no backend workflow** — and that
   CI runs the Expert Hub tests in parallel although `test:expert-hub` passes
   `--no-file-parallelism`.
3. A recon agent reported **"serial execution: absent"** for the Expert Hub
   tests, having looked only at `vite.config.ts`. The flag is in the npm script,
   not the Vite config. Corrected before it reached `context/`.
4. `AuthenticationSetup`'s swallowed-exception site was cited at **line 413**;
   by the time it was edited it was at **485**. Same cause as (1).

**Lesson, now a habit:** re-verify a finding against HEAD immediately before
editing, not when it was first written down.

## Where it stands

**Complete and verified:** the review; batch 1 (committed, 373/373 green); the
`context/` set; `docs/schema.d2`; `ADR-0001` (drafted); the three `AGENTS.md`;
this record.

**Not started (work, not blocked):** batch 2 and batch 3 below. The small tickets
in *Open questions*.

**Waiting on someone else, not on work:**
- `ADR-0001` is **Proposed**. It needs the backend owner's sign-off to become the
  repository's position. Until then the TFA standard and the code disagree in
  writing, which is better than disagreeing silently, but it is not settled.
- Stakeholder names in `context/project-overview.md` are `Needs confirmation` —
  the repository records roles only.
- `BRD-TRN-001 v1.0` is still an initial draft pending formal approval.

**Left deliberately untouched:** `.gitattributes`, `.gitignore` (both carry the
user's own graphify lines) and the `docs.zip` / `handoff.zip` deletions are
uncommitted and are not mine to commit.

## Open questions, by who can answer them

**Product owner / backend owner**
- Sign off or reject `ADR-0001` (the layering deviation).
- Should the `CLAUDE.md` deployment section be updated? It describes Expert Hub
  as "an independently deployable **frontend**" and its asset list omits
  `api.Dockerfile`, but compose now ships `expert-hub-api` too. A human wrote it,
  so the audit left it alone.
- Who are the named business owner, tech lead and reviewers?

**Documents needed**
- Formal BRD approval.
- The Academy holiday calendar: `BusinessCalendar` now counts the Riyadh weekend
  correctly but still subtracts no public holidays.

**Technical / infrastructure**
- A backend CI workflow. The suite is LocalDB-only and therefore Windows-only;
  Testcontainers with the `mssql/server` image would let it run on a Linux
  runner. Until then no automation runs `dotnet test` at all.
- `net9.0` left support in May 2026 — one line in `Directory.Build.props`, but
  the .NET 10 SDK is not installed on this machine (9.0.300 / 9.0.317 only).
- Should CI run `validate:expert-hub` (serial) rather than bare `coverage`?

## Where it stopped

The last exchange was *"what you need to do next?"* → *"start yes"*, meaning:
commit the two groups and write this record. Both commits are in and this
document is the last of it. **Nothing is half-done.**

The proposed next step is **batch 2**, and the case for it is that every item is
a defect a second click can trigger today:

1. **Concurrency claims** on the transitions that currently read-check-write: the
   pool decision (two live offers per slot), signing-sequence formation (two
   active chains), applicant sign vs request-modification, lifecycle renew/end
   (renew twice adds 12 years), interview completion (the last two evaluators can
   both see the other as pending, leaving the interview `Scheduled` for ever).
   The pattern to copy is in `OfferService` and is written down in
   `context/code-standards.md`.
2. **Filtered unique indexes** as the backstop: one live offer per slot, one
   non-withdrawn engagement per slot, one non-voided signing sequence per
   agreement, one draft application per applicant.
3. **One `IExceptionHandler`** mapping SQL 2601/2627 to `409`. Today every race
   that hits an index returns 500.
4. **Sequences** for the reference numbers (`max+1` and `count+1` collide).
5. **The offer-exclusion fix**: `OfferService` excludes trainers already
   *engaged* on a request but not those holding a *live offer* on a sibling slot,
   so every slot of a request can go to one person.

**What blocks it:** nothing technical — but it needs a migration, so it is a
decision to take deliberately rather than a continuation of batch 1. Two
questions belong to the owner before (1): is a 409 the right answer for a
double-submitted committee or pool decision (versus idempotently returning the
first result), and may a renewal ever be applied twice on purpose?

Batch 3, lower priority: .NET 10, backend CI, OpenAPI (`AddOpenApi()` would
generate what `28_API_CONTRACT_INVENTORY.md` maintains by hand), rate limiting on
the anonymous directory, and paging on the unbounded internal lists.

Small tickets, each independent:
- `TRAINER_PROFILE.VisibilityConsentDecidedAt` has no `HasColumnName`, so it is
  the one PascalCase column in the database. Needs a migration.
- `AgreementDocumentVersion` / `AgreementTemplateVersion` sit under the CAP-05
  comment block in `ExpertHubDbContext.cs` but belong to CAP-03.
- `04_SCREEN_INVENTORY.md` still says "Not started".
- The previous session record's index row still says "**Not committed**"; that
  work is now `ca846fd..04bebf8`.

## Resuming

```bash
git switch expert-hub/uat-baseline          # already here; head 16f04ed
sqllocaldb start MSSQLLocalDB               # the test suite needs it
cd backend/expert-hub && dotnet build && dotnet test   # expect 373/373, ~4 min
```

**Environment traps that cost time this session:**

- **`graphify` is not on PATH in the shell**, so `graphify query` fails and the
  CLAUDE.md rule cannot be followed interactively — read files directly. It *is*
  available to the git hooks: a post-commit hook launches a background rebuild
  (log: `~/.cache/graphify-rebuild.log`), so the graph refreshes itself on commit.
- **`git config user.name` returns empty** in this shell even though commits are
  authored correctly. `git var GIT_AUTHOR_IDENT` resolves (`Jawad Qurban
  <jqurban@fa.gov.sa>`); use that, not `config --get`, when a name is needed.
- **In the Bash tool, `/usr/bin/find`, `sort` and `timeout` are permission-denied.**
  Use the PowerShell tool for listing and counting, or the Glob/Grep tools.
- **PowerShell `Set-Location` persists** between calls and silently changes the
  working directory for everything after it. Prefer absolute paths.
- **The test suite takes ~4 minutes for 373 tests** because 21 test classes build
  a fresh LocalDB database and apply all 36 migrations **per test** (xUnit
  instantiates the class per test). Nothing is wrong; budget the time. A
  per-class database plus Respawn would cut most of it.
- **The `d2` CLI is not installed**, so `docs/schema.d2` cannot be rendered
  locally. It was validated statically only (balanced braces, every edge endpoint
  resolving to a declared column).
- Two volumes must survive a redeploy or sessions and uploads are lost: the
  data-protection keys and `Documents__RootPath`. Batch 1 made the first one
  matter more — the ticket payload is now encrypted with those keys.
