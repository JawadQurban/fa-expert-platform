# The FAST contract document, the add-service dead end, and J-04 speaker records

## Resume here

| | |
|---|---|
| **Branch** | `claude/charming-euler-vbqhft` (pushed) |
| **Head** | `ca22990` — on top of `6e6ca21`: `757b901` add-service fix · `25f050c` speakers API · `db88c1b` speakers screens · `ca22990` format fix |
| **Release tag** | none for this state; latest is `expert-hub-v1.3.0` |
| **Deployed** | Nothing from this session. **M43** (`SPEAKER_RECORD`, F-0105/F-0413 relabel and regrant) is not on any server |
| **Backend validation** | `dotnet build` 0 warnings / 0 errors · `dotnet test` **406/406** in 11 min (run 2026-10-13 on `ca22990`, Linux container, SQL Server 2022 in Docker — see *Environment traps*) |
| **Frontend validation** | `npm run validate` clean (1 existing warning, `InterviewSlotsField.tsx:43`) · **1648/1648** in 122 files · `npm run build` ✓ · `lint:css` OK · `tokens:check-coverage` Missing 0 |
| **State** | J-04 F1 and F2 built; AC-4's email and F3's history wait on FAST (B-16, B-17). The FAST contract document is written; its email is drafted, not sent |
| **Next thing to do** | Send the FAST document and email (the user's call). Then the user's choice between J-02 (blocked on Yaqeen) and the open owner questions below |

**Reading order:** this record → `DECISIONS.md` `P-346`–`P-349` → the FAST
contract document (Claude Docs, *Expert Hub ↔ FAST — Integration Contract and
Blocked Items*, https://claude.ai/code/artifact/cf9e6786-3a93-4100-bc73-92af1171c769).

## What was asked, in order

1. *"what the API missing from fast?"* — answered from `22_FAST_INTEGRATION_REQUEST.md` and the last session record.
2. *"give me the data needed from fast all the data with the filed and what will be send throw the api and what we expect"*, then *"lift what we see i want expactly wha data we need from fast to use it on expert hub, like program name then plans…"* — the request/response contract per API, in the order the product uses it.
3. *"give me a doucmnet and keep in mind i need every then is blocked from fast on this document, we have also serves yaqen … this service is live on fast now … give me the full document and email to fast team"* — the Claude Docs document, with a blocked-items register and the email.
4. *"it only id and birthday and it should create base acount base on infomraion returend from yaqeen, english email"* — B-02 rewritten; the email made fully English.
5. *"where is this — زر اضافة خدمة لمدرب معتمد، وترشيح مدرب داخليًا، وتسجيل متحدث"* — located all three.
6. *"2 and 3 is on notion, and fix 1."* — fixed the add-service dead end (`757b901`). Notion showed the owner's own hands-on test note: «يوجهه بس مافيه زر اضافة خدمة».
7. *"yes start it and before start push it i have fix github issue"* — pushed, then built J-04 after four questions (rulings below).

## What shipped

### The FAST integration contract (Claude Docs, not the repository)
17 services, each with the exact input Expert Hub sends and the output it needs,
the FAST `Table.Column` each value comes from, and a blocked-items register
(B-01 … B-17) with a status dropdown. **Principle:** field names are Expert Hub's
proposal; FAST may keep its own if it gives the mapping. B-16 (a speaker's FAST
account and email) and B-17 (speaker participation history) were added when J-04
was built. The repository's `22_FAST_INTEGRATION_REQUEST.md` was **not**
rewritten to match — the document is the newer, fuller version.

### The add-service dead end (`757b901`)
`POST v1/me/applications/draft/start` now returns the accredited application as
`blockedByApplicationId` for the `approved-trainer` block, and the button opens
its add-service form. **Root cause, not symptom:** the page had no id to link to,
so it linked to My Profile, which has no add-service entry.

### J-04 speaker records (`25f050c`, `db88c1b`; `P-346`–`P-349`)
- **Schema** from the Notion *Speaker Record* matrix, exactly its 11 fields plus
  a nullable `fast_user_id` (M43, generated with `dotnet ef`).
- **Internal only** by construction: the routes sit behind the internal policy
  and no `/me` route exists (`BR-0113`).
- **Update is POST**, not PUT — the codebase has no PUT and the frontend client
  only has `get`/`post`.
- **Search integration:** the trainer search returns `speakers` as a separate
  list, never as trainer rows, because a speaker has no file status, rating,
  certifications or experience to fill a trainer row with.
- **Unavailable is not empty:** the record serves `email: null` with
  `emailUnavailableReason` and `history.available: false` with a reason, so the
  page says "waiting on FAST", never "no email" or "no participations".
- **Contract fixtures** `internal.speakers.json` and `internal.speaker-detail.json`
  are written by `SpeakerTests` and rendered by `Speakers.contract.test.tsx`.
- The frontend was built by a subagent from a written brief, then reviewed,
  given its contract test, and checked visually at 1440px and 390px.

## Verbal rulings

| Ruling (as given) | What it changed |
|---|---|
| *"it only id and birthday and it should create base acount base on infomraion returend from yaqeen"* | FAST doc B-02: input is identity number + date of birth only; output is the base account and Yaqeen's data |
| *"english email"* | The FAST email is fully English |
| *"2 and 3 is on notion, and fix 1."* | Fixed add-service; the J-02/J-04 specs live in Notion |
| *"yes start it and before start push it"* | Push first, then J-04 |
| *"it should take the email for the profail from fast"* | No email field on the speaker form; `fast_user_id`; AC-4 blocked on FAST (`P-347`) |
| «Own screen + tagged in search» (chosen option) | Speakers screen + `speakers` list in the trainer search (`P-348`) |
| «Name and title» (chosen option) | One search box over names and title; no specialization filter (`P-348`) |
| «Defer, add to FAST doc» (chosen option) | F3 shows a pending state; B-17 in the FAST doc (`P-349`) |

## Corrections

1. **"Yaqeen account creation is FAST's `identity/registration` service"** (first version of B-02, with its 20-field `IndividualRegistrationRequest`). **Wrong** — the user: the Yaqeen service takes only the identity number and birth date and builds the account from Yaqeen's data. The exact path is still unknown and is asked of FAST.
2. **"J-04 is not built and out of scope — the speaker field list was never supplied."** **Wrong.** The repo said so (`24_RELEASE_READINESS`, `11_JOURNEY_IMPLEMENTATION_MAP`, the journey file), but Notion's *Speaker Record* page had the finalized matrix. All three repo files now point at it.
3. **Notion's J-04 page says «13 fields finalized … (title, dates, delivery mode, language, specialization, named speaker)»**; the matrix it links has **11**, and none of dates/delivery/language/specialization. Built the 11; the discrepancy is in `P-346`.
4. **F-0105 was «إدخال بيانات متقدّم نيابةً عنه» granted to the Trainer role.** The BRD (§8.1.5, US-0107) says F-0105 is «إدخال بيانات متحدث»; F-0413 likewise (§8.4.5, US-0417). Corrected in M43 (`P-349`).
5. **"The first backend test run is hung."** It was not a test hang: it was disturbed by my rebuilds while it ran, and my restart killed itself (see traps). A clean run here takes 4 to 11 minutes, logging only failures at normal verbosity. The single `Cap02Tests` content-root failure in that run did not recur.
6. **`757b901` passed `npm run validate` before commit and still went in unformatted** — the pre-commit hook reformatted `applicationForm.types.ts` with the global Prettier 3.8.1. Fixed in `ca22990`.

## Where it stands

- **Complete:** the add-service fix; J-04 F1 (create/edit) and F2 (own screen, search by name/title, tagged in trainer search).
- **Waiting on FAST, not on work:** J-04 F1/AC-4 (creation email — needs B-16, then B-13); J-04 F3 (history — needs B-17); every blocked item in the FAST document.
- **Waiting on Yaqeen/FAST + a security decision:** J-02 nomination (the «ترشيح» button was removed earlier, RB-02).
- **Needs Confirmation:** which speaker fields are mandatory (we require the Arabic first and last name); the bio limit (2000).

## Open questions, by who can answer them

- **Owner / business:** mandatory speaker fields; bio length; the notification template for the speaker-creation email (J-25 matrix); the speaker search fields beyond name and title; is a speaker always a FAST user?
- **FAST team:** everything in the document — above all B-01 (permission), B-02 (Yaqeen path), B-06 (plan details), B-16, B-17.
- **Technical:** none blocking.

## Where it stopped

All work is committed and pushed. The FAST document is ready for the user to send;
its email is drafted inside it. A small polish item was noticed and left: on the
speaker pages the header highlights «لوحة العمل», not «قاعدة المدربين», because
the speakers route has no nav entry of its own.

## Resuming

```bash
git switch claude/charming-euler-vbqhft
cd backend && dotnet build && dotnet test        # Windows: LocalDB; expect 406/406
cd ../frontend && npm run validate && npm run build   # expect 1648/1648
```

**Environment traps (new this session):**
- **Cloud container, no .NET by default.** `dot.net` and the Azure CDN are blocked; `packages.microsoft.com` is not. `apt-get install dotnet-sdk-10.0` works (9.0 is not in that repo). Build with **`-p:AnalysisLevel=9.0-recommended`**: SDK 10's newer analyzers flag CA1873 in existing code. An env var `AnalysisLevel=…` does NOT override `Directory.Build.props`; `-p:` does. Run tests with `DOTNET_ROLL_FORWARD=Major` (only the .NET 10 runtime is installed).
- **Backend tests on Linux:** start `dockerd`, run `mcr.microsoft.com/mssql/server:2022-latest` on 1433, and point `LocalDbFixture.ConnectionString` at `Server=localhost,1433;User Id=sa;…;TrustServerCertificate=true` **locally only — never commit it**. `dotnet tool install -g dotnet-ef --version 9.*` works through NuGet.
- **`pkill -f "<pattern>"` kills its own shell** when the pattern appears in the same command line (exit 144). Kill by PID.
- **Don't rebuild while `dotnet test` is running** — it disturbs the run.
- **The pre-commit hook (`npx lint-staged` at the repo root) uses the global Prettier 3.8.1**, found in Node's own bin before PATH, not the project's 3.9.4. It reformats union types differently and breaks `format:check`. After committing, run `npm run format:check`; fix with the project's `npx prettier --write <file>` from `frontend/`.
- **Contract fixtures:** `EXPERT_HUB_WRITE_CONTRACTS=1 dotnet test --filter …SpeakerTests` writes them; rerun without the flag to verify.
