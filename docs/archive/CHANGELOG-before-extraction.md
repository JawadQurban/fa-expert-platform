# Changelog — Financial Academy Hackathon & Design System (FADS)

All notable changes to this project's documentation and (later) code are recorded here.
Format based on [Keep a Changelog](https://keepachangelog.com/); the design system follows [Semantic Versioning](https://semver.org/).

Phases are documentation-only until the Implementation phase is authorized (`TASK.md`).

---

## [Expert Hub] — 2026-10-05 — The trainer short bio (UI-15, `P-331`)

A trainer can now have a short bio on their public profile. It is **AI-drafted
from their CV** (off until `Q28`; the trainer writes it by hand meanwhile),
**edited and submitted by the trainer**, and **approved by trainer management**
on a new review page under the trainer database (`F-0401`). Only the approved
text appears on the public profile (for trainers who consented) and the internal
profile; an edit after approval goes back to review while the approved text
stays up. The consent copy now names the bio among what is published.

Migration **M39** (additive: `TRAINER_BIO`, one `DATA_ELEMENT` row). New
dependency: `PdfPig` 0.1.11 (Apache-2.0) for reading PDF CVs. Backend 399/399,
frontend 884/884.

---

## [Expert Hub] — 2026-10-01 — HTTP timeouts stopped escaping their handlers, and the FA standard adopted

A best-practice review of the whole backend, then the first batch of fixes.

**The headline fault was one idiom, repeated.** `catch (Exception e) when (e is
not OperationCanceledException)` reads as "everything except cancellation", but
an `HttpClient` timeout throws `TaskCanceledException`, which derives from
`OperationCanceledException` — so all 17 catch sites written to contain a failed
integration call were letting the timeout through. In `OutboxPublisher` that was
an availability bug: the escaped exception faulted `ExecuteAsync`, .NET's default
`StopHost` stopped the API, and because the attempt was never saved the same
message faulted again after the restart. Every filter is now written against the
token.

Fixed in the same pass: the three long-lived `HttpClient` singletons get
`PooledConnectionLifetime` and an explicit timeout instead of the 100-second
default; **business days are counted in Riyadh, not UTC** (a deadline set between
21:00 and 24:00 UTC started from the wrong weekday and could fall due on a
Friday); the offer expiry sweep catches per offer, so one bad row no longer
blocks every later expiry; attachment download checks the session's `internal`
role instead of `APP_USER.is_employee`, a FAST flag nothing sets back to false;
removing a "certificate" is scoped to its rule code and can no longer delete a
CV; **session ticket payloads are encrypted** with `IDataProtector` (they held
every claim and the id token as readable bytes — `TicketSerializer` serialises,
it does not encrypt); the open redirect through control characters is closed; and
a failed role resolution at sign-in is logged rather than silently stripping
everyone's roles.

⚠️ On deployment: everyone signs in once more (pre-existing session rows cannot
be decrypted), and some deadlines move by a day — that is the Riyadh fix working.

Alongside it, the FA AI development standard was adopted: a `context/` reference
set filled from the code and imported by `CLAUDE.md` into every session, nine
integration files, `docs/schema.d2` (79 tables), three `AGENTS.md`, and
`docs/adr/0001` recording that this backend does not follow the TFA Clean
Architecture layering — **Proposed**, pending the backend owner.

Backend 373/373, build clean. Batch 2 (concurrency claims, filtered unique
indexes, 409 on unique violations, sequences) is not started: see
`docs/expert-hub/sessions/2026-09-21--2026-10-01-backend-review-and-fa-standard.md`.

---

## [Expert Hub] — 2026-09-10 — the country lookup, corrected (**P-267**)

Verified on the server: `nationality_country_id = 1` for every person,
`nationality_code` NULL for every person, and **no log line anywhere**. The
only way to find out was to query the database and infer it.

Two faults. The lookup called `GetAllCountries`, which has no documented
shape; the register documents `CountryRegistrationLookupDto` for
`GetCountries`, and that is what it calls now. And it read only `nameAr` /
`nameEn` — FAST carries «السعودية» and «سعودي» in different fields, and which
one is populated has varied between operations, so a row that resolved
perfectly well still produced null. Both pairs are read now.

A country carrying no name at all still resolves to **null, not «other»**:
«other» is an answer, and an empty record is not grounds to put one in a
nationality field on a government form.

And it logs when it cannot load, at warning. The silent null was the reason
this took a database query to find.

Backend 207/207.

---

## [Expert Hub] — 2026-09-10 — the Academy's trainer contracts, read-only (**P-266**)

FAST exposes `TrainerContracts/trainer-contracts` with List, Download,
**Approve** and **Refuse**. They were declared in August and deliberately left
uncalled, because whether a FAST «trainer contract» is the same artefact as an
Expert Hub agreement is still unanswered — and `BR-1201` sits behind that
question.

They are now read at sign-in, stored raw, and shown beside «حالة الاتفاقية»
under a notice that says — before listing anything — that these are the
Academy's documents and **not** the Expert Hub agreement.

⚠️ Reading is reversible; approving is not. If the answer turns out to be «the
same artefact», this becomes the source and nothing has to be undone. Had
Approve/Refuse shipped, Expert Hub would have committed to FAST mastering the
agreement before anybody decided that. So there is no approve, no refuse and no
download here — a button would imply otherwise.

A failed read leaves the last good copy and its date alone: an outage is not
«this person has no contracts». `M23` adds the two columns.

Backend 201/201, frontend 682/682, both builds clean.

---

## [Expert Hub] — 2026-09-10 — every qualification the Academy holds, not just the newest (**P-265**)

«The user can add multiple experience roles … I think it's in FAST.» It is:
FAST holds a list for all four collections while the form holds one of each
(`DM-GAP-11`), so the previous build showed the most recent degree and silently
dropped the rest.

The further records now render read-only inside the section they belong to —
extra degrees under «المؤهلات العلمية», extra certificates under «الشهادات
المهنية» — so there is still one place per topic. The application form stays
single-entry for now.

⚠️ The risk here is double-rendering, not omission. `P-258` deleted a panel
that duplicated «المؤهل العلمي» beside itself, and a naive list would put it
straight back. So the mapping reports whether its newest entry actually reached
the form's fields, and the profile skips exactly that one — and skips nothing
when the person's own answer filled those fields instead, because then no FAST
entry is on screen and skipping one would hide a qualification.

Backend 201/201, frontend 682/682, both builds clean.

---

## [Expert Hub] — 2026-09-10 — the completion prompt (**P-264**)

«It should pop up to complete the data when it logs in — this only for the
trainer come from the FAST.»

The population is exactly `establishedInExpertHub === false`: the trainer role
came from the Academy's own record and Expert Hub's accreditation never
happened. An accredited trainer is never asked, because telling them to
complete a file they already have would be false.

Dismissal is remembered in `sessionStorage`, not `localStorage`. «لاحقًا» means
this visit, not forever — their data really is incomplete, and a prompt that
never returns quietly drops the ask. It also never shows twice in one session:
a prompt that returns on every navigation stops being a prompt.

The body names what is already filled, so the ask reads as «finish this»
rather than «start again» — they have given the Academy this data once.

Frontend 682/682, build clean.

---

## [Expert Hub] — 2026-09-10 — everything the Academy holds, on every profile (**P-261** → **P-263**)

«Work on all the data from FAST, and if it comes from FAST it should be already
approved — all this information on the API, also for the approved one.»

**FAST sends the given name and the prefill said it did not.** That file
documented «FAST sends one `fullNameAr` and one `fullNameEn`», called splitting
it a guess, and left all eight name fields blank on that basis — with a test
asserting the same absence. The real payload, captured and sitting a few lines
above that test, carries `firstNameAr` and `firstNameEn` as their own
properties. Nobody had read past the full names. `M22` keeps them, and
`FastNameSplit` anchors on the known given name so only the remainder is
positional.

**One mapping, three surfaces.** `FastFieldMap` is now read by the application
form and by both profile paths — the accredited trainer's included — so the
form somebody fills in and the profile they read afterwards cannot disagree.
The trainer's own stored answers still win every field they have one for.

**Three gaps kept as gaps**, because each alternative is a guess on a
government form:

- `gender` — `Users/Info` has no such property at all. The box stays empty.
- `nationality` — FAST sends a country *id*, resolved through
  `Lookup/GetAllCountries` at sign-in (cached; a failed read is never cached).
  An unresolved id leaves the field empty: the ordering of somebody else's
  lookup table is not a fact about a person's nationality.
- A name with more tokens than parts («عبد الرحمن» written as two) keeps the
  given name and splits nothing.

**And a label that was lying.** `P-260` tagged every locked field «يُستكمل عند
الاعتماد», including the ones the Academy had already filled and verified — so
a completed qualification read as an outstanding task. Fields the Academy
supplied now carry `from-academy` («من سجل الأكاديمية»), rendered as a success
tag and dated with the last sync; `not-accredited` is left for the fields that
are genuinely still empty.

Backend 199/199, frontend 679/679, both builds clean.

---

## [Expert Hub] — 2026-09-10 — every field renders, locked, on the unaccredited profile (**P-260**)

Reported from the server with a screenshot: «المؤهلات العلمية», «الشهادات
المهنية» and every other section showing as a heading with nothing underneath.

A defect the previous entry introduced. `ProfileFieldsForm` returns `null` for
any field it has no `fieldStates` entry for, so the `FieldStates: []` served to
somebody with no trainer file emptied the entire form — worse than the 404 that
path replaced, because an empty section reads as an answer rather than as a
failure.

Every field of the current schema now gets a state, **locked** rather than
editable: there is no `TRAINER_PROFILE` row to write to, and an input with a
save button that cannot save is a promise the endpoint would break. Locked
still renders the label and the value, so the Academy's record shows and every
field it does not cover shows «—». A fourth `ProfileLockReason`,
`not-accredited` («يُستكمل عند الاعتماد»), because none of the three existing
ones is true here.

The test now asserts `fieldStates.Count == formSchema.fields.length`, which is
what would have caught it.

Backend 191/191, frontend 679/679, both builds clean.

---

## [Expert Hub] — 2026-09-10 — the Academy's qualifications, in the platform's own fields (**P-258**, **P-259**)

Reported from the server: «this user have qualification and education but
nothing show», and then the ruling that changed the shape of the fix — «it
shouldn't do this at all, it should save in the same qualification in the
platform».

The first build was wrong. It served the Academy's record as its own read-only
block, which would have put «المؤهل العلمي» and «الشهادات المهنية» on the page
**twice**: once from FAST, filled, and once from the application form's own
sections of the same name, empty. Expert Hub already asks for every one of
these fields, and the two models were built from the same BRD — they line up
almost exactly. So the record now maps onto the form's own field codes
(`FastQualificationFields`) and arrives through `fieldValues`, where the form
cannot tell a FAST-sourced answer from a stored one. The separate wire, its
three DTOs and the frontend section are deleted.

Three limits, each chosen deliberately over a guess:

- **FAST holds a list; the form holds one of each.** Newest-first decides, so
  the most recent degree is the one that shows. The rest stay in the replica —
  not lost, but not displayed. Repeating groups are `DM-GAP-11`.
- **A `select` is never invented.** `qualificationType` maps through an exact
  table of degree names. `generalSpecialization` does not map at all: FAST's
  list is open and the form's is five options, and «الهندسة الكيميائية» is not
  «أخرى» just because nothing else fits. An unmapped select is left **empty so
  the page marks it missing** — which is true — rather than filled with a value
  the person never chose.
- **The person's own answer wins.** A stored `TRAINER_FIELD_VALUE` is what they
  wrote on an application the Academy accredited; the replica is a copy of what
  FAST held at their last sign-in.

Also here: `classification` renders as «غير معتمد بعد» rather than a tier when
there is no trainer file, and the profile carries an `info` notice naming what
Expert Hub still needs — `P-257`'s flag, put to use.

Backend 191/191, frontend 679/679, both builds clean.

---

## [Expert Hub] — 2026-09-08 — the Academy's own record of a person, reflected (**P-227** → **P-231**)

`GET /api/v1/Users/Info` returns the whole base profile FAST holds: real names
in both languages, national ID, date of birth, nationality, phone, job,
organisation, the Academy's own roles, three Expert flags, and **all eight of
`J-09/F6`'s bank fields**. Every FAST endpoint is scoped to «the currently
authenticated user» and `P-215` discards the access token, so the profile is
read in `OnTicketReceived` — the one moment a token is in hand — and the token
is still discarded immediately after. The cost, stated rather than hidden: the
replica is only ever as fresh as that person's last sign-in.

Three things change on screen.

**Names.** `D-15` is fixed at its root: applicants shown as `JawadQurban` and
`1000499630` across the inbox, trainer base, public directory and user list,
with name search returning nothing, because the token carries only `sub` and
`email`. I had filed that as an ask on FAST — «can a display-name claim be
added?» — and it never needed a claim.

**The access screen** now shows who a person is in the Academy beside the roles
Expert Hub grants: identity number, organisation, job title, staff or not, the
Academy's roles and the Expert flags — as plain text with no control in it,
because `BR-0801` grants exclusively through Expert Hub's own roles and a test
pins that the panel adds none.

**The bank form** opens filled with what the Academy already holds, under its
own `suggested` key so it can never be mistaken for what the applicant
confirmed. `BANK_DATA.completed_at` still moves only when they press the button.

Migration 17 adds `FAST_USER_PROFILE`. Backend **151/151**, frontend
**665/665**, both builds clean.

---

## [Expert Hub] — 2026-08-30 — The API ships: Docker, compose, the /api route (**P-180**)

The ASP.NET API gets production packaging so the testing server can run the
real SSO flow: a multi-stage `api.Dockerfile` (non-root aspnet:9.0), an
`expert-hub-api` compose service on `127.0.0.1:8086`, the server-Nginx
`/api/` location (no prefix strip — `P-166`), and `UseForwardedHeaders` so
the OIDC redirect URI and cookie Secure flag derive from the public https
host rather than the container's internal address (test-pinned). Secrets ride
a second, gitignored env file mapped only to the API service; the API boots
without a database — readiness says so honestly, and the handshake needs no
DB. `local.env` now sets `EXPERT_HUB_API_BASE_URL`, flipping the deployed
frontend to real Academy SSO (`P-168`): deploying this IS the live test of
FAST's "returns to where you came from" claim (`Q38`). Backend **42/42**.

---

## [Expert Hub] — 2026-09-03 — attachments actually upload (**P-206**, **P-207**)

Two defects found on the testing server, both of which made a working system
look broken.

**Files were saved nowhere.** Every attachment failed with "the upload failed,
remove it and try again" — and retrying could never have worked, because the
HTTP provider returned 501 by design while document storage and antivirus were
undecided. Both are now ports with working defaults: the bytes go in the
platform's own database and the scan status records `not-scanned`, which is a
different thing from `clean`. Each storage ref carries its store's scheme, so
when the real store is chosen it issues its own refs and the files already
uploaded keep resolving — there is nothing to migrate. The upload rule is
re-checked server-side, and a download endpoint ships alongside, because an
uploaded CV the screener cannot open is not an upload.

**A signed-in visitor was still offered "Log in"** on the landing page. The
public header picked its actions from the variant alone and never looked at
the session.

Backend **131/131**, frontend **659/659**.

---

## [Expert Hub] — 2026-09-02 — the platform stops speaking in BRD codes (**P-205**)

A person using Expert Hub should never have to hold the requirements document
to read a screen. Five places were making them.

The permission matrix was the worst: 58 rows, each showing `F-0101` beside an
English name that was literally "Application Management — F-0101", with Arabic
labels that were truncated fragments lifted from the source PDF's wrapped
tables. Every one of the 58 is now written as what the feature actually does,
in both languages, in the seed and the mock together — and the grid groups by
area name rather than by `CAP-04`.

Also gone from the screen: the event code chip on the notification matrix, the
capability code on the deadline console, the internal draft id that was being
printed as the matching model's "version", and a gap reference that had ended
up inside a sentence addressed to an applicant.

The codes are still searchable on the matrix, for an administrator working
from the document, and still fill the source comments, which is where
provenance belongs. The labels remain flagged for verification — they are no
longer truncated, but they are now authored, and the Academy should match them
against its own wording.

Backend **129/129**, frontend **658/658**.

---

## [Expert Hub] — 2026-09-02 — INT-06, channel routing, and the unblocked backlog (**P-202**–**P-204**)

Six items, all of which were waiting on nobody.

**BE-17 — the AI provider (INT-06)** is built and ships dark. `Q28` blocks the
feature's go-live, not its build, so the adapter, the channel and the trigger
all exist and the provider reports itself unconfigured until someone sets a key
and a model in the environment. The data-minimisation rule became a signature:
the port no longer takes an application id at all, so an implementation cannot
leak an identifier it was never given.

**The outbox routes per system.** INT-06 was the second real channel, which is
exactly the follow-up BE-04's own comment predicted. Channels now name the
system they speak for and a router dispatches by it, so the mount order of the
capability modules stopped being load-bearing.

**A 403 now says so** on the internal list and console pages, instead of
claiming the page failed to load — and loses its retry button, because retrying
a denial produces the same denial.

**Nafath became Yaqeen** across the identity screens, per the owner's ruling;
FAST's own `IsNafath` column is untouched, being somebody else's schema.

**The conformance audit was re-run** against the implemented system rather than
the mocks (BE-20), and **two journey documents were amended** where owner
rulings had overtaken them. The re-audit found no regression: six acceptance
criteria are now enforced by types rather than by convention, and every
outstanding finding is waiting on a document or a dataset from outside the team.

Backend **129/129**, frontend **658/658**.

---

## [Expert Hub] — 2026-09-02 — CAP-09: dashboards, personal metrics (**P-198**, **P-199**)

BE-12, and the last capability with a service contract waiting on it. The
internal dashboard is no longer a hard-coded list of four tiles: migration 12
seeds metric definitions and one dashboard per role, and the endpoint resolves
the caller's role to their dashboard and serves its placements in order. The
centre coordinator's and the executive's dashboards exist and carry no
metrics, which is exactly what §8.9 says about them — it names their
dashboards and defines none of their tiles.

`F-0902`'s third tile, «مواد بانتظار الاعتماد», ships for the first time; BE-10
had already built the submission queue it counts. It forced a small correction
to the dashboard contract, which had assumed every tile drills into the
application inbox: a tile now carries a discriminated target, so one that
belongs to another queue cannot claim an application-status filter that means
nothing for it.

`GET v1/me/home` completes the trainer's portal home — own data only, nothing
persisted, and the empty state decided server-side so a brand-new person sees
"nothing yet" rather than a wall of zeroes. With it, **every module in the
product runs on the real API**; the only demo path left is the Nafath identity
resolver.

⚠️ `METRIC_DEFINITION.formula` is null on every row, and that is `Q26` kept
open rather than filled: §8.9 writes no formulas, so none is stored. The
export half (`F-0905`) is recorded as unbuilt for the same reason — no
contract, no screen, no definitions. Backend **118/118**, frontend **657/657**.

---

## [Expert Hub] — 2026-09-01 — CAP-06: entitlements, read-only (**P-196**, **P-197**)

BE-11, and the smallest capability in the product by design. Migration 11
builds two tables — the ERP purchase-order mirror and the entitlement
projection — and deliberately not the third column the schema draws:
`linkage_complete` is annotated DERIVED, and a stored flag can outlive the
chain it summarises, so it is computed on every read instead.

`BR-0601` is now enforced by the compiler. The context exposes both tables as
read-only queryables and keeps the writable sets internal to the
infrastructure assembly, so the API project cannot compile a change to an
entitlement even by accident; the only author is the ERP importer, on the far
side of INT-03. `BR-0603` is the trainer DTO's private constructor: a record
whose chain is incomplete cannot be built in that shape at all, so it is
never filtered — it never exists. `F-0603`, "the automatic link", has no
route, because nobody performs it; it re-resolves on every sync, and an
agreement signed after the money arrived completes the chain by itself.

⚠️ **The capability ships correct and empty.** The ERP payload as specified
names no programme, so `BR-0602`'s third hop has no source and no trainer can
see anything yet — `Q39` asks for it, and no heuristic was invented to paper
over it. Backend **108/108**, frontend **656/656**.

---

## [Expert Hub] — 2026-09-01 — CAP-05: request, matching, offer, engagement (**P-194**, **P-195**)

BE-10, the longest chain in the product. Migration 10's fourteen tables carry
a centre's request through matching to an offer nobody sends — the system
creates it when a slot has an approved candidate whose turn came, so no
send-offer endpoint exists to be called. Exactly three candidates per person,
refused at any other size on both the engine and manual paths; one live offer
per slot; the three-day window read from the central SLA row; per-slot FAST
sync through the outbox. Re-routing is slot-scoped and counted without a cap;
withdrawal and de-linking are distinct end states over two reason lists kept
deliberately apart; material review can approve or ask for changes and has no
rejection at all.

The matching engine's shape is the rule: its exclusionary half returns only
reasons and its weighted half only numbers, so "no weighted criterion
excludes a candidate on its own" cannot be violated by a later edit. Weights
are seeded evenly because `DM-GAP-05` approves none — an even split claims
nothing. Gaps stay visible: no FAST plan feed, so `pulled` is null; `Q20`
leaves enrolment and attendance unavailable with the gap named rather than
zeroed; prices serve null because the agreement template has no price rows.

Six more modules go live, leaving only entitlements and the Nafath identity
path on demo data. Backend **97/97**, frontend **656/656**.

---

## [Expert Hub] — 2026-08-31 — CAP-04: the trainer profile, the public directory, the trainer base (**P-192**, **P-193**)

BE-09. The trainer record is created **at signature** (J-13), so an applicant
has no profile and the endpoint says so. Per-field editability comes from the
schema's own ownership: a FAST-mastered field is changed by REQUEST and the
old value keeps displaying until FAST confirms — which is write-through
(`P-135`) and is why `Q30` turns out to decide whether a pending change
resolves, not how any of this is built. The public directory is anonymous and
consent-gated, carrying name, specialties and delivered programmes and
nothing else (asserted against the raw payload, so a field added later cannot
slip in). `file_status` stays off the trainer's surface entirely (`BR-0408`).
Gaps are served as gaps: no specialty taxonomy, no classification rules, no
calculated rating, and the Identity Card's two sourceless rows null rather
than empty.

With `profile` live the bank-data save reaches its real endpoint, so the
**whole chain now runs on real data** — apply, screen, committee, bank data,
agreement, signature, an active trainer. Backend **91/91**, frontend
**656/656**.

---

## [Expert Hub] — 2026-08-31 — The staff inbox and dashboard, served for real (**P-191**)

Opening an application from the inbox on the testing server answered
«الطلب غير موجود». Not a defect — a module-selection mistake: the inbox was
left on demo data while the screening page it links to went live, so it
handed the live API a demo id. The inbox is the entry every internal
journey is reached from, so it now ships with them: `GET
v1/internal/dashboard` (the four pipeline tiles) and `GET
v1/internal/applications` (the queue — paged, searchable, drafts excluded
because an unsubmitted draft is nobody's queue item). The rule is recorded
beside the data-mode flag: a module that supplies ids goes live with the
modules that consume them. Backend **85/85**.

---

## [Expert Hub] — 2026-08-31 — Permissions are enforced per feature (**P-190**)

Owner ruling: permissions at feature level, not capability level. The data
model was already there — 58 permissions keyed by feature code — but nothing
consulted it: every internal endpoint asked only "is this session internal?".
Now each route declares the feature it needs and the answer comes from
`USER_ROLE → ROLE_PERMISSION → PERMISSION`, failing closed. Two features of
the *same* capability can now answer differently for the same person, which
is the whole point: Staff screen applications (`F-0201`) but cannot decide a
committee (`F-0204`); the System Administrator configures the platform but
cannot screen. A **draft** default matrix of 117 grants is seeded from the
BRD's own role descriptions so the product works on day one — `DM-GAP-07` is
still open, `modelStatus` still says `unapproved`, and every row is editable
in the access screen without a deployment. The trainer's own `/me/*` surface
stays guarded by ownership rather than features, because J-01 lets someone
with no role at all apply. Backend **84/84**.

---

## [Expert Hub] — 2026-08-31 — Nine modules now serve real data (**P-189**)

The owner asked whether the screens were live. They were not: one global
`EXPERT_HUB_DATA_MODE=mock` blanked the API base for every data service, so
authentication was real and everything else was demo. The flag is now a
per-module **list** (`api:applications,screening,…`) resolved through
`isModuleLive(module)`, because "the API exists" was never true of the whole
product at once. Access, notifications, applications, add-service,
screening, interviews, committee, agreements and the agreement lifecycle
serve real data from the testing database; the thirteen modules without a
backend keep their demo providers. ⚠️ `profile` is one of them, so the
bank-data save does not yet reach its real endpoint — the live flow runs
from submission through the committee decision, and BE-09 opens the rest.
Frontend **656/656**.

---

## [Expert Hub] — 2026-08-31 — CAP-03 served for real: preparation, signing, the applicant's decision, the lifecycle (**P-188**)

BE-08. Migration 07 carries `10` §3.5 with the document tables deliberately
unbuilt (`G26`). The J-09→J-10 gate checks both halves separately, so the
screen can name whichever is missing; J-09/F6's bank data is now collected
for real (requested in parallel with the committee's approval, all eight
fields mandatory). The internal signing sequence cannot complete without its
signature — a designated e-signer who merely approves is refused — and the
send still tests `BR-0213`'s two conditions independently before raising
`EV-0204`. The applicant's three answers are one endpoint: signing activates
with the server's own term (`BR-0302` — one year first), rejection
permanently closes the application, a modification request returns it to the
preparer with its mandatory note. J-12 renews for three years with no input
that could carry a duration, and `expired` is derived from the calendar
rather than stored. An approved add-service now writes an addendum against
the existing agreement (`BR-0305`) — never a second one. Backend **80/80**,
0 warnings.

---

## [Expert Hub] — 2026-08-31 — CAP-02 served for real: screening, interview, committee (**P-187**)

BE-07 — the heart of the internal workflow. Migration 06: fifteen tables,
the draft evaluation/interview models seeded as data (`BR-0203`) under the
frontend's own `mock-…-draft.1` labels (`DM-GAP-02`/`DM-GAP-03` stay open).
The AI boundary is structural: the scorer's signature cannot receive the
advisory analysis (`BR-0201`/`BR-0202`), and `IAiAnalysisProvider` waits on
`Q28` behind a null stand-in. Screening acceptance demands a complete path
per service; the interview holds `BR-0220` (no result until every member
responds, non-attendance excluded not zeroed); the committee walks
sequentially with the mandatory/optional split, modification-resume from
the requester (`BR-0218`), and accreditation rows on final approval. The
exemption is invisible to the applicant by omission (P-45) — asserted
against the raw JSON. Ten new internal endpoints + the trainer's
slot-confirmation and reschedule now real. Backend **74/74**, 0 warnings.

---

## [Expert Hub] — 2026-08-31 — CAP-01 served for real: the owner's form, drafts, submission, add-service (**P-186**)

BE-06 — the first user-facing business capability. Migration 05 carries the
owner's `DM-GAP-01` workbook as data: 39 fields, 6 sections, 4 attachment
rules, extracted from `applicationSchema.ts` by script and served verbatim
from `GET v1/applications/schema` (anonymous — the guest reads the form
first). Drafts never hold a reference; submission enforces completeness
against the same schema rows, issues `EH-YYYY-NNNNN`, and raises `EV-0101`
through the CAP-07 dispatcher in the same transaction. Add-service bypasses
screening into one internal decision: approval demands its addendum
(`BR-0305`), rejection demands a served reason — and notifies the trainer
without it (F3/AC-7, proven against the queued email payload). Interview and
agreement actions are stage-guarded conflicts until BE-07/BE-08 add their
states. Backend **70/70**, 0 warnings.

---

## [Expert Hub] — 2026-08-31 — CAP-07 served for real: events, templates, SLA, and a dispatcher on the outbox (**P-185**)

BE-05. Migration 04 builds `10` §3.9's six tables; the twenty cited events
(`P-146`) and six SLA rows are script-extracted from the frontend contract's
own mock and seeded — `source` survives into the database, because an event
with no citation is an invented event. `NotificationDispatcher` carries the
four structural rules (`BR-0703`/`BR-0702`/`BR-0701`/`BR-0707`) with the
email leg riding BE-04's outbox through INT-04 behind a new `IEmailGateway`
seam — no gateway yet, so emails queue as pending, visibly. Nine endpoints
match `notificationService.ts`; template management is `BR-0704`-gated from
`USER_ROLE`; `/internal/sla` is the one write path for every deadline
(`BR-0705`). Ships empty where the gaps are: `DM-GAP-08` routing, `Q33`
wording, `Q32` resend. Backend **63/63**, 0 warnings.

---

## [Expert Hub] — 2026-08-30 — Staff land on the internal dashboard, not the trainer portal (**P-184**)

Owner, after the first live admin sign-in: the bootstrap administrator was
dropped onto the trainer's My Applications page. The default post-login
landing (login page + both SSO adapters) now points at the role-resolved
`/expert-hub/home`: trainers render Portal Home (EH-TP-01), staff-only
sessions redirect to the internal dashboard (EH-INT-01) via the new
`ResolveHomeByRole` guard. Explicit `?returnUrl=` from route guards still
wins. `test:expert-hub` now serializes vitest files (the jsdom-contention
trap, fixed at the script). Frontend **656/656**.

---

## [Expert Hub] — 2026-08-30 — The testing stack gets a database, and CAP-12's hub exists before anyone needs it (**P-182**, **P-183**)

Two backend increments, one owner choice ("DB container + BE-04"):

**The stack (`P-182`):** an opt-in `expert-hub-db` SQL Server 2022 service in
the testing compose file (`--profile db`, no host port, named volume, sa
password in the uncommitted `env/api.secrets.env`), and startup auto-migration
in the API (`Database__AutoMigrate`, compose default true; log-and-keep-serving
on failure). Users, roles, the P-181 bootstrap-admin grant and the audit trail
now persist on the testing server.

**BE-04 (`P-183`):** CAP-12's integration hub per `08` §4.2 — the crossing
registry (`INTEGRATED_SYSTEM` seeded with INT-01…INT-06), the mastership
register as data (`DATA_ELEMENT`, `P-129`), the transactional outbox
(`OUTBOX_MESSAGE`, unique idempotency key, staged in the caller's
transaction), the append-only `INTEGRATION_LOG` (`BR-1204`), and
`REPLICATION_STATE` with visible drift (`BR-1203`). The publisher retries
with capped backoff and never abandons; with no channel configured (every
real contract is still open) outbound messages queue as `pending` behind the
`IIntegrationChannel` seam. Registry readable at
`GET v1/internal/integration/systems`. Migration 03. Backend **54/54**,
0 warnings.

---

## [Expert Hub] — 2026-08-30 — Roles are the platform's own (**P-181**)

Owner ruling after the first live sign-in: FAST's token carries only the
identity (`sub` + `email`) — no role claim, no name. Roles are
user-management data and live in Expert Hub's own `USER_ROLE` table, which
BE-03 already built. At sign-in the API JIT-provisions the user, maps their
`USER_ROLE` rows onto the coarse session roles (trainer → `trainer`, any
staff role → `internal`), and grants configured **bootstrap administrators**
(`EXPERT_HUB_BOOTSTRAP_ADMINS` — sub ids or emails) the system-administrator
role — persisted with an audit entry when the database is up, session-only
when it is not, fail closed for everyone else. Display name falls back
name → email → sub. Backend **45/45**. The role half of `Q37` is closed;
what remains is session lifetime/logout and a human name claim.

---

## [Expert Hub] — 2026-08-30 — Portal-first, silent: the login page auto-starts the SSO handshake

Owner correction and mechanism ruling (**P-178**): FAST's flow is **login on
the testing portal, then back to Expert Hub** — and the identity arrives via
the **silent SSO handshake**. The portal's login leaves a session at the STS;
when the user lands here, the BFF challenge (BE-02, unchanged) redirects to
the STS, which recognizes the session and returns at once — no second login
screen. The registered `testingdashboard…/callback` is the **portal's own**
callback, which amends the previous entry's framing; the one ask to FAST is
unchanged and now precisely scoped — register
`https://experts.fa.gov.sa/api/auth/callback` so the silent leg can return.

The login page now **auto-starts** the handshake under the real adapter —
once per visit, never in a loop, a visible «redirecting to Academy SSO»
status, the single button kept as fallback. The development placeholder never
auto-starts (rendering a page must not sign tests in). New focused
`LoginPage` suite through the `AuthProvider` seam.

typecheck · lint · lint:css · **654/654 tests, 47 files** · build — green.

---

## [Expert Hub] — 2026-08-30 — SSO is the only way in, and FAST's testing identity is wired

### The details arrived (**P-176**)

FAST shared the testing identity registration: authority
`https://testingauth.fa.gov.sa/identitymanagement.sts`, client id `ReactApp`
— wired into the frontend runtime config (`local.env`) and the backend dev
launch profiles. In `launchSettings.json` env vars rather than
`appsettings.Development.json` on purpose: the test suite keeps the honest
unconfigured default, and its 503-while-unregistered tests caught exactly
that when the values were tried there first.

**The one thing still missing is theirs:** the registered redirect URI is
`https://testingdashboard.fa.gov.sa/callback` — a host this product does not
serve — so the handshake cannot complete until FAST registers
**`https://experts.fa.gov.sa/api/auth/callback`** (`Q38`, now exactly that
one ask plus the client type).

### One sign-in action (**P-177**)

Owner ruling — «remove all sign in and keep it only for the SSO»: the login
page renders exactly one action, Academy SSO. The development persona picker
is retired (page, copy, and the adapter's persona machinery); the placeholder
adapter survives underneath the same button for offline development and the
test suite, its role taken from `VITE_EXPERT_HUB_DEV_ROLE`, its dev-build
notice still visible.

### Verification

Backend **41/41** · frontend typecheck · lint · lint:css · **651/651** ·
`build:expert-hub` — all green.

---

## [Expert Hub] — 2026-08-30 — The owner's field matrices land: the application form and the centre request form

> Two workbooks arrived (`docs/expert-hub/`): the bilingual **trainer
> application field matrix** and the **centres' request form** «طلب تقديم
> البرنامج» — closing the two oldest field gaps, `DM-GAP-01` and `DM-GAP-06`.

### The application form serves the supplied map (**P-172**)

`applicationSchema.ts` replaces the retired mock: six sections, ~40 fields,
labels and mandatory flags verbatim. The `*` legend makes the matrix uniform
across the four services — so the add-service delta (`BR-0111`) is honestly
**empty** and the page says so. The schema engine gained `date` and
`multi-select` field types; FAST-mapped identity rows carry `sso-profile`
ownership (application-time entry, change-request later — `BR-0404`);
`email`/`phone` are gone because the matrix carries neither. Everything the
workbook leaves open stays flagged, not resolved — provisional dropdown
lists marked per field, the ID-routing mechanism, the not-shown experience
columns, availability rows 5–6, and **repeatable entries as a named
follow-up** (**P-173**). The 147-value «مجال التخصص» list was extracted by
script and serves both forms.

### The centre request form replaces J-16's capture (**P-174**, owner ruling)

الخيارات الرئيسية first (centre · request type · responsible employee), then
the workbook's five request types decide the field set — general programmes,
private programmes (+ client name), workshop/seminar, content development
(«لغة المحتوى»), consultations (topic/hours/type/beneficiary). What survives
J-16: nothing creates a programme or plan in FAST (F2/AC-3, said on screen);
pulled FAST data still reaches matching and engagement offers untouched.
Three derivations are provisional and flagged (**P-175**): the request-type→
service mapping, the defaulted headcount, and the provisional lists/lookups.

### Verification

typecheck · lint:expert-hub · lint:css · **651/651 tests, 46 files** ·
`build:expert-hub` — all green. Backend untouched.

---

## [Expert Hub] — 2026-08-30 — BE-03: the first business module — CAP-08's endpoints, for real

### The contract, served

All seven routes `accessService.ts` already calls: the matrix, grants, users,
role assignment and revocation, the audit trail, and centres. The wire shapes
are `access.types.ts`'s exactly — `permissionId` **is** the feature code
(**P-169**), the coordinator's `scopeRef`/`scopeName` exist only on that
member of the discriminated union (omitted, not nulled, elsewhere — and a
scope on any other role is refused), and audit summaries carry the contract's
own wording verbatim.

### Seeded: the BRD's facts. Not seeded: the matrix

Migration 02 seeds the **six roles** — §8.8.5's bilingual names and
descriptions — and the **58 permissions** (§8.8.4: the permission list is the
feature list), extracted from the contract's provider by script and flagged
`label_needs_verification` (P-139). **Every grant starts absent** and
`modelStatus` serves `unapproved` — `DM-GAP-07` is the owner's to fill, from
the screen. The `centre` list exists with **no values**: real centres are
organizational data nobody has supplied.

### Fail closed, and a posture bug caught

`v1/internal/*` requires a session carrying the `internal` role (**P-170**) —
the API decides, the SPA's guard merely mirrors (`P-J9`); while `Q37`'s
mapping is unconfigured, the surface denies everyone. Writing that test
exposed a BE-02 bug: an anonymous **data** request was answered with a 302 to
the identity provider — the default challenge is now the cookie scheme (401/
403 always); only `/api/auth/login` challenges OIDC. A second catch: a
`Guid.ToString()` translated into SQL served UPPERCASE centre ids — mapped in
memory now.

### The contract outranked the design document

`ROLE_CODES` says **`system_administrator`**; `10_DATABASE_DESIGN` said
`sysadmin` and BE-01 had followed it. Migration 02 rewrites the CHECK
constraint, `ROLE` gains the description pair, `PERMISSION` the verification
flag, and the document is corrected (**P-171**).

### Verification

`dotnet build` 0 warnings · **41/41** — 7 new full-stack tests that sign in
through the real OIDC handshake (fake IdP, machinery extracted to
`TestOidc`), carry the session cookie, and exercise every route against a
real SQL Server, each on a pristine database so the empty-matrix assertions
mean what they say. ⚠️ The playbook's “run `Access.test.tsx` against the real
API” cannot be executed literally — the suite pins its mock through the test
seam; the full-stack tests are the equivalent statement, and the playbook now
says so.

---

## [Expert Hub] — 2026-08-30 — BE-02: the login exists — INT-01's OIDC flow, in the API

### The flow, where `P-163` put it

`GET /api/auth/login` → Authorization Code + PKCE at the provider → the
middleware-owned callback (`Oidc:CallbackPath`) → an **HttpOnly, SameSite=Lax
session cookie**. The browser never sees a token. `GET /api/auth/session`
returns the frontend's `ExpertHubSession` shape exactly — `userId`,
`displayName`, `roles`, `expiresAt` (epoch ms) — or 401; `POST
/api/auth/logout` always ends the local session and names the provider's
end-session URL (`id_token_hint`) when discovery advertises one (**P-167**).

The framework's OpenIdConnect handler performs the exchange, because the
non-negotiables — `iss`/`aud`/`exp`/`nbf`, signature against JWKS, `nonce`,
server-side `state`, PKCE — are exactly what a hand-rolled flow gets subtly
wrong and the handler validates by default.

### Fail closed, everywhere

The role claim's **name and values are configuration** (`Oidc__RoleClaim` +
value maps — `G16`/`G28`, `Q37`): an unmapped value grants **no role**, so the
product's out-of-the-box state is *authenticated and entitled to nothing*.
`returnUrl` must be a relative path (open-redirect guard); a failed handshake
issues nothing and lands on `?error=sso_failed`; unconfigured SSO answers a
503 ProblemDetails — the truth (`Q38`), not an outage. Session lifetime is
provisional configuration pending `Q37`, with no sliding renewal invented.

### One mount — `/api` (**P-166**)

The committed callback path and the URL `P-164` registered fix the API's
external mount, so **`apiBaseUrl` ends with `/api`** and the in-app `v1`
group moved under it. Health endpoints stay at the root for the orchestrator.

### The frontend half

`academySsoAdapter` — a BFF client of exactly three endpoints, credentials
included, never throws at the UI. `authMode` now requires **both**
`apiBaseUrl` and a configured client (**P-168**), failing closed to the dev
placeholder, which is untouched and still carries local development.

### Verification

Backend `dotnet build` 0 warnings · **34/34** — 17 new, including a full
round trip against a **fake identity provider with a genuinely signed ID
token**: PKCE/state/nonce asserted on the authorize redirect, a valid
handshake issues a session with mapped roles, an unmapped value grants none,
a tampered `state` is rejected with no session, logout clears and names
`end_session`. Frontend typecheck · lint · lint:css · **652/652** (11 new) ·
`build:expert-hub` — all green.

---

## [Expert Hub] — 2026-08-30 — BE-01: the database foundation, verified against a real SQL Server

> Two owner rulings opened the session: `experts.fa.gov.sa` serves Expert Hub
> at the **domain root** (**P-164**), and FAST has **already registered** the
> OIDC client against the previously-supplied — presumed stale — URL
> (**P-165**, tracked as `Q38`). Then BE-01, on the owner's go-ahead, against
> the LocalDB instance the machine already runs.

### Migration 01 — the nine tables of `10_DATABASE_DESIGN` §3.1–3.2

EF Core + SQL Server behind `ExpertHubDbContext`; `ATTACHMENT`,
`REFERENCE_LIST`, `REFERENCE_VALUE`, `APP_USER`, `ROLE`, `PERMISSION`,
`ROLE_PERMISSION`, `USER_ROLE`, `AUDIT_LOG` — named exactly as the design
document names them, bilingual pairs as two NOT NULL columns throughout
(BRD §10.4).

### The structural rules crossed the tier

- **`AUDIT_LOG` is append-only three times over** (`NFR-07`, `BR-0806`): the
  context exposes no `DbSet` for it (reads are no-tracking, `AppendAudit` is
  the only write), `SaveChanges` throws on a modified or deleted entry, and
  `scripts/sql/audit-log-append-only.sql` grants the application principal
  INSERT and SELECT and **denies** the rest — because «cannot be edited by
  anyone» must bind clients that never load the DbContext.
- **`REFERENCE_VALUE` deactivates, never deletes** — the context refuses the
  delete; `is_active` is the only retirement path, so history still resolves.
- **The closed unions are closed in the database itself** — CHECK constraints
  on `ROLE.code` (the six roles of §8.8.5) and `ROLE_PERMISSION.data_scope`
  (all/own/centre), tested with raw SQL. And there is still **no
  user→permission table at all** (`BR-0801`, P-137).
- **One EF default overridden deliberately**: the unique index on `USER_ROLE`
  (user, role, scope) drops EF's `[scope_ref] IS NOT NULL` filter, which would
  have exempted exactly the unscoped rows five of the six roles produce
  (P-140). A test asserts on the unscoped duplicate on purpose.

### Liveness and readiness, split

`/health` still touches nothing. `/health/ready` consults the database and
reports **“not configured”** while `ConnectionStrings__ExpertHub` is empty —
the process boots healthy either way, so a database blip takes the instance
out of rotation instead of restarting it.

### Verification

`dotnet build` with 0 warnings (warnings are errors) · **17/17 tests** — the
10 new ones are integration tests against **LocalDB** (`MSSQLLocalDB`), a
throwaway database per run, because the in-memory provider enforces none of
the constraints this migration exists to create. Infrastructure has still not
supplied a SQL Server instance; LocalDB is the playbook-sanctioned stand-in.

---

## [Expert Hub] — 2026-08-27 — OIDC configuration for INT-01 (FAST identity)

> Owner update: the FAST team uses OpenID Connect and will issue a client id.
> This builds the configuration layer so that handing it over is an env-file
> edit rather than a release.

### Config, not code

Ten runtime values — issuer, discovery URL, client id, scopes, both redirect
URIs, and four claim-mapping settings — now arrive through the container's
`config.js` like every other runtime value, so one image still serves every
environment (**P-158**). `deploy/expert-hub/env/{development,uat,production}.env`
are the files to edit; `16_SSO_OIDC_CONFIGURATION.md` says what goes where.

**Claim names *and* values are configuration too.** `G16`/`G28` are open, so when
FAST says which claim carries the role, that is an edit and not a build.

`authMode` is now **derived** from whether a client is configured rather than
being a separate switch — there is no state where the app claims Academy SSO
while missing the client id, because a partly-configured client fails in ways
that look like an outage.

### ⚠️ A secret is unrepresentable, and the container refuses to start with one

`config.js` is served to every browser, so a secret placed there is a *published*
secret. `OidcConfig` has **no field** that could hold one — a test asserts no key
matches `/secret|password|credential|privatekey/` — and `docker-entrypoint.sh`
exits non-zero if `EXPERT_HUB_OIDC_CLIENT_SECRET` is set on this container
(**P-159**).

**If FAST issues a secret, the client is confidential and cannot run in a browser
at all**; the code exchange then belongs in the Expert Hub API, which is what
`02C` already prescribes. → **`Q36`**, and it blocks the adapter.

Authorization Code + PKCE is likewise **not a setting**: no `responseType`, no
`usePkce`, no `flow`. The validator also refuses plain `http` outside `localhost`
and a redirect URI carrying a fragment (**P-160**).

### ⚠️ The redirect URI given to FAST was the landing page

An OIDC `redirect_uri` receives `?code=…&state=…`; a landing page does not read
them, so the login would complete at the provider and then silently do nothing.
Expert Hub already has `/expert-hub/auth/callback`. The setting is configurable
either way, so an already-registered landing page still works — but it is worth
one message to correct before the client is issued (**P-161**).
`16_SSO_OIDC_CONFIGURATION.md` §2 carries the exact URLs per environment.

### Not built

The adapter that performs the flow — PKCE, callback, code exchange, ID-token
validation, claim mapping, refresh. It plugs into the existing
`ExpertHubAuthAdapter` seam, and it cannot be finished sensibly before `Q36` is
answered. §6 of the new document says so plainly rather than letting "config
only" imply the integration is complete.

**Validation:** typecheck · `lint:expert-hub` · `lint:css` · **641/641 tests**
(14 new) · `build:expert-hub` — all green.

---

## [Expert Hub] — 2026-08-27 — One SLA matrix: the countdowns now read from the console

> A re-wiring that turned up an invented business rule.

### The console governed nothing

`BR-0705` puts every deadline under one screen «مهما كانت القدرة المصدر
للحدث». The durations were **three constants in three feature mocks** —
screening's five days, the offer's three, the interview's hard-coded instance —
each invisible to the console built the same day. Editing the console changed
nothing anywhere.

Now the **vocabulary** lives in `shared/types/sla.ts` and the **rows** in one
shared store (**P-155**). It is not in CAP-07 on purpose: four features consume a
deadline and only one configures it, so putting the types there would have made
CAP-07 a dependency of half the product.

`SlaDto` gained **`slaId`** — every countdown names the row that configures it,
so a deadline governed by nothing fails a test instead of shipping.

### ⚠️ The screening countdown was a number nobody approved

The screening screen showed a **five-business-day** SLA. That figure appears in
no journey, no BRD section and no approved document — it was
`SCREENING_SLA_DAYS = 5` in the screening feature's own mock, rendered as though
it were policy. `shared/types/sla.ts` had marked it "provisional pending `Q8`"
and nothing ever acted on that.

J-05 shows "remaining SLA time" and **never states a duration**, which is why the
console reports `SLA-0202` as undefined. The page now says «لم تُضبط مدة إنجاز
للفرز بعد — تُحدَّد من شاشة إدارة المهل» instead of a fabricated countdown
(**P-156**). **This is the only visible change** — a correctness fix, not the
redesign PB-04 forbade. Set a duration on the console and the badge returns with
no code change; a cross-feature test does exactly that. → **`Q35`**.

### J-12 stopped hard-coding 90/30/5

`ExpiryMilestone` was `'90-days' | '30-days' | '5-days'` — a type that baked in
the values `BR-0705` exists to make configurable. It now carries the number, the
copy formats it, the tag's tone follows the offset's **position** among the
configured ones, and the filter's options are **served with the list** so the
page holds no list of its own (**P-157**). With the approved 90/30/5 nothing
looks different; a test changes them to 60/10 on the console and watches the
agreements table follow.

### Tests that a per-feature test could not replace

`shared/sla/slaWiring.test.tsx` is cross-feature on purpose: it edits a deadline
through CAP-07's provider and asserts what CAP-02's and CAP-03's screens render.
A per-feature test would have passed with the three constants still in place.

**Validation:** typecheck · `lint:expert-hub` · `lint:css` · **627/627 tests**
(10 new) · `build:expert-hub` — all green.

---

## [Expert Hub] — 2026-08-27 — CAP-07: notifications, templates, deadlines, log (J-25)

> The third capability built from the **BRD**, and the one that finally gives the
> ten journeys' notification points somewhere to live.

### Built from §8.7

J-25 has no journey document (`Q17`). §8.7 gives the capability definition, its
scope, four entities, five features and six business rules. **EH-INT-12** is three
screens behind one header entry — the matrix (`F-0702`), bilingual templates
(`F-0703`) and the log (`F-0705`) — plus **EH-INT-13**, the central deadline
console (`F-0704`), which the design docs already numbered separately.

⚠️ **Screen IDs had forked and were reconciled** (**P-154**): the built screens
had drifted off the namespace `02C`/`04`/`05` all share, so CAP-08's access
screens moved to `EH-INT-14` and CAP-06's entitlement register to `EH-INT-17`.
The IDs live only in comments and docs, never in a route.

### The event catalogue is real, and carries its own evidence

§8.7.3 says the matrix covers every event from all twelve capabilities and never
lists one. **Twenty events** were taken from **ten** approved journeys — J-01,
J-02, J-03, J-06, J-11, J-12, J-18, J-19, J-21, J-22 — and each carries its
**citation** and the journey's own words about who is notified. That evidence sits
beside the routing controls and is deliberately not the routing (**P-146**). A
test asserts every event has a `J-nn` citation, so an invented event fails the
build. The catalogue is **incomplete by construction** — a capability with no
journey has declared no events — and the screen says so.

`14_INTERNAL_DASHBOARD_BRD_REVIEW` said *eight* journeys name notification
points. It is ten: J-01's submission confirmation and J-02/F3's activation
invitation were missed. Corrected there.

### Rules as structure

- **`BR-0702`** — email and in-platform fire together, so `NotificationMatrixRowDto`
  has **no `channel` field at all** (**P-147**). A toggle would imply a choice the
  rule removes. Channel lives on the log, which is why one event produces two
  entries and one of them can fail alone. `10_DATABASE_DESIGN` §3.9 was corrected
  to match — it had a `channel` column annotated "both together".
- **`BR-0701`** — no free-form wording anywhere. No type carries a body except the
  template, `routeEvent` takes a template id and never text, and a row's `routed`
  member accepts only an **approved** template (**P-148**). Editing an approved
  template returns it to draft *and* returns its rows to unrouted: the approval was
  of the wording, and the wording changed.
- **`BR-0707`** — the template is bilingual, the **send is not**. `language` is a
  single `Locale` with no `'both'`, while a template cannot be approved unless both
  languages are complete (**P-149**).
- **`BR-0704`** — template management is server-decided (`canManageTemplates`),
  never inferred from a role string.

### The deadline console ships what the journeys approved

⚠️ **This deviates from PB-03's own instruction** to ship the SLA table empty.
That was wrong in one direction: J-06/F1/AC-4 (3 business days), J-18/F2 (3 days)
and J-12/F1/AC-2–4 (90/30/5-day reminders) are **approved journey text** and the
product already runs those countdowns — blanking them would have discarded
approved rules, not avoided inventing any. So three deadlines are seeded with
their citation, and three that a journey explicitly leaves open show **no
duration** (**P-150**). `DM-GAP-10` appears as a count on screen.

J-12's deadline is the agreement's **own** expiry date, so `SlaMatrixRowDto` has a
third member — `record-derived` carries reminders and no duration, and the editor
shows no duration field for it (**P-151**). Two members would have forced a
fabricated number.

### No resend, and the screen says why

`US-0705` wants failed notifications followed up *and handled*, so the need is
real — but §8.7 never defines what a resend does: which template version it
renders, whether it writes a second entry, how the language is re-resolved. A
button would have baked one answer in silently. The log surfaces every failure
with its reason and states the absence (**P-152**). → **`Q32`**.

### Not invented

⚠️ §8.7.5 numbers its rules 0701–0705 and **0707** — `BR-0706` does not exist in
the document, the second such gap after `BR-0604` (**P-153**). The template
placeholder vocabulary is undefined in §8.7 and is served, flagged as mock →
**`Q33`**. The routing itself is **`Q34`**.

**Validation:** typecheck · `lint:expert-hub` · `lint:css` · **617/617 tests**
(30 new) · `build:expert-hub` — all green.

---

## [Expert Hub] — 2026-08-27 — CAP-08: roles & permissions administration (J-26)

> The second capability built from the **BRD** rather than a journey — and the
> first whose central screen ships **deliberately empty**.

### Built from §8.8

J-26 has no journey document (`Q17`). §8.8 settles more than most journeys do:
the three-layer model (user → role → permission), the six approved roles with
their own descriptions, the definition of a permission as *one capability
feature*, four business rules, and both features. Same reasoning as CAP-06
(P-124), recorded as **P-136**.

**EH-INT-14** — *(committed as `EH-INT-12`; renumbered same day, P-154)* — the
matrix «مصفوفة الأدوار والصلاحيات» (`F-0801`) at
`/internal/access/permissions`, and «المستخدمون والأدوار» (`F-0802`) at
`/internal/access/users`. One header entry covers both (**P-141**); the two
screens cross-link with `aria-current`.

### The rules are absences, again

- **`BR-0801`** — «لا تُمنح أي صلاحية مباشرة لمستخدم». **No type in
  `features/access` links a user to a permission**, and `AccessService` has no
  operation that could name both. A guard can be bypassed by the next endpoint
  someone adds; an absent type has to be invented first (**P-137**).
- **§8.8.5** — six roles, fixed. No create-role, delete-role or rename
  operation, and `RoleCode` is a closed union. The screen says so rather than
  leaving an administrator hunting for the add button.
- **`BR-0806`** — the audit trail is immutable, so the only audit operation is a
  read. Every grant change, assignment and revocation writes one entry, and both
  screens render the trail.
- **`BR-0808`** — login, authentication and SSO are managed neither here nor by
  the platform (P-133). The whole service surface contains no *login / signin /
  password / credential / sso / token*, and a test asserts it (**P-142**).
- **`BR-0807`** — the matrix is configuration, not code: every grant is a row an
  administrator edits, and a permission change never needs a release.

### The grid ships empty, and says so

`DM-GAP-07` is the approved role×permission **contents**, and it does not exist.
Seeding six plausible role profiles would have produced a grid that *looks* like
policy, that no administrator could tell apart from the approved one, and that
would have been quietly wrong in the one area where being quietly wrong grants
access. So all **348 cells start ungranted**, `modelStatus` is `unapproved`, and
the page leads with that (**P-138**). Same handling as `DM-GAP-02`/`DM-GAP-05`.

Building the screen before the contents is deliberate: there was previously
nowhere to *enter* the approved model, so asking for it meant asking for a
spreadsheet nobody could apply. → **`Q31`**.

### Not invented

The **58 permissions are the BRD's own feature codes** (`F-0101`…`F-1004`,
CAP-01→CAP-10), because §8.8.4 makes the permission list exactly the feature
list (**P-139**). ⚠️ Their **labels** were extracted from the PDF's wrapped
tables and many are truncated — each carries `labelNeedsVerification` and the
screen states how many. The codes are verified; the wording is not.

### The one scoped role

§8.8.5 scopes *منسق مركز* «لمركزه… ضمن نطاق طلبه فقط». `AssignedRoleDto` is
discriminated on the role: the coordinator member **requires** `scopeRef`, every
other member **has no such field**. A coordinator with no centre and a manager
with one are both unrepresentable, and the form mirrors it — choosing the role
reveals the centre, choosing any other hides it (**P-140**).

### One capability at a time

58 features × 6 roles is **348 live controls on one screen**, re-rendered on
every keystroke — which made this feature's own suite take 150 seconds and would
have made the search box laggy for the administrator too. §8.8.4 already supplies
the unit: a permission is one feature *within a capability*. The grid now renders
one capability at a time (≤13 rows) behind a capability picker, and **searching
spans everything** with the picker disabled and a note saying so — a code like
`F-0801` should be findable without first knowing which capability owns it. Suite
time: 150s → 3s (**P-143**).

### Reference data stays served

The coordinator's scope picker needs the centres, and the first cut imported
them from the mock provider — the only page in Expert Hub that imported mock
data. `AccessService` gained a `listCentres()` read at `v1/internal/centres`,
deliberately **not** under `/access`: a centre is organizational reference
data, not part of the access model (**P-144**).

### Navigation

`navigationTargets.test.ts` now also requires `internalEntitlements` — which
P-121 added to the header but never to that list — and the CAP-08 entry point.

**Validation:** typecheck · `lint:expert-hub` · `lint:css` · **587/587 tests**
(25 new) · `build:expert-hub` — all green. ⚠️ The suite must be run with
`--no-file-parallelism` on a loaded machine: a parallel run showed 16 failures
across 11 unrelated files, all `Unable to find role="heading"`, which the
serial run does not reproduce.

---

## [Expert Hub] — 2026-08-26 — CAP-06: financial entitlements (J-28)

> The first capability built from the **BRD** rather than a journey — and the
> first where every business rule was about what must *not* happen.

### Built from §8.6, because §8.6 is enough

J-28 has no journey document, and I had been calling that *blocked*. The BRD
specifies the capability completely: the entity, three features, four business
rules, both interfaces (P-124). Waiting for a journey to restate it would have
left a fully-specified, owner-requested capability unbuilt.

**EH-TP-09** «مستحقاتي» for the trainer (`F-0601`) and **EH-INT-11** «المستحقات
المالية» for staff (`F-0602`) — *renumbered to `EH-INT-17` on 2026-08-27,
see P-154: `EH-INT-11` was already Speaker Records.* Both are in the header — `F-0601` was missing from
the trainer portal too, not only the internal one.

### Four rules, four absences

Every rule in §8.6.5 forbids something, so the contract was built to have no way
to do any of it:

- **`BR-0601`** — status, amount and date are "consumed whole from ERP" and may
  never be entered or edited by hand «بأي حال». `EntitlementService` has **two
  operations and both are reads** (P-127). No input type exists anywhere.
- **`BR-0605`** — there is no dispute path in this release. Nothing raises one,
  and the trainer's page *names where an enquiry goes instead* — a money screen
  with a disputed figure and no visible route is worse than one that says
  "contact Trainer Management".
- **§8.6.1** — the capability "calculates no amount". So **no total is shown**
  (P-125). A platform-computed sum is a number ERP did not send, and the moment
  it disagrees with the system of record the platform is wrong by construction.
  A test asserts the sum never appears.
- **`BR-0603`** — the interesting one, below.

### `BR-0603` is two DTOs, not one with a flag

«لا يظهر أي مستحق للمدرب في بوابته إلا بعد اكتمال الربط الكامل» — an entitlement
whose chain (purchase order → agreement → programme) has not resolved stays
hidden from the trainer.

`TrainerEntitlementDto` has **no way to express an incomplete link**: every
linkage field is non-nullable (P-126). A record the trainer must not see cannot
be constructed in their shape at all — there is no `null` to forget to check and
no flag to mis-read.

Staff get the union, and the incomplete member **names which hop is missing** —
because `US-0602` exists to answer one specific phone call, *"why can't I see my
payment?"*, and «الربط غير مكتمل: البرنامج» is the answer. A filter isolates
those records, and the seed deliberately contains two so the rule is observable
rather than theoretical.

### What was not invented

§8.6 never enumerates the ERP disbursement statuses, so `DisbursementStatusDto`
carries an opaque code plus a bilingual label and every status is toned
identically (P-128). *Disbursed* and *On hold* therefore look alike — honest, not
helpful, and now `Q27`.

⚠️ Also recorded: §8.6.5 numbers its rules 0601, 0602, 0603, **0605**.
`BR-0604` does not exist in the source document.

Validation: `validate:expert-hub` + `build:expert-hub` green (562 tests).

---

## [Expert Hub] — 2026-08-26 — Navigation: every tab now goes somewhere

> Reported as "a lot of tabs not working". Three of the public header's five
> were dead, the search button was dead, and four built internal screens had no
> tab at all.

### The public header

*About*, *Services* and *FAQ* pointed at `/about`, `/services` and `/faq` —
registered nowhere, falling through to NotFound since the header was built.

Two of the three describe content that **already exists** as real sections on the
landing page, so they became anchors onto those headings (P-119):

| Tab | Now points at |
|---|---|
| الرئيسية / Home | the landing page |
| عن المنصة / About the platform | `#eh-about-title` — the About section |
| الخدمات / Services | `#eh-eligibility-title` — whose "المجالات المطلوبة" tab lists the five BRD §6 services |
| دليل الخبراء والمدربين / Directory | the directory |

**FAQ was removed.** No FAQ content exists anywhere and no journey asks for one,
so pointing it somewhere plausible would have been the same mistake in a new
place. A tab is a promise; the honest number of tabs is the number of things that
exist.

> **Superseded the same day (P-123).** The owner's ruling — «ما احتاج عن المنصة و
> الخدمات لانها موجودة في اللاندنق بيج» — went further, and correctly. *About*
> and *Services* are landing-page **sections**, and `home` reaches the landing
> page from every screen, so a tab for each is a second and weaker route to
> content that already has one: it scrolls you into the middle of a page instead
> of taking you to a page. Both tabs were **dropped**, in the header and the
> footer, and the two anchor entries were deleted from the path registry.
>
> The public navigation is now the two things that are pages in their own right:
>
> | Tab | Goes to |
> |---|---|
> | الرئيسية / Home | the landing page — About, Services and the five BRD §6 service types all live on it |
> | دليل الخبراء والمدربين / Directory | the directory |
>
> The diagnosis in P-119 was right; the remedy was one step too clever.

The **search** button pointed at a `/search` route that was never built. It now
points at the directory (P-120) — the Expert Hub's only searchable public
surface, and one that has real search on it. All four never-built paths were
deleted from the registry, because leaving them there is what let the header
point at them.

### The internal header

It listed three entries. **Service Requests, Assignment Requests, the Trainer
Database and Agreements were all built and reachable only by typing the URL**
(P-121). All four are now in the nav.

### The guard

`navigationTargets.test.ts` resolves every header and footer `href` against the
**registered route table** (P-122). A tab that goes nowhere now fails the build.

This is worth stating plainly: the bug survived a 546-test suite because the
existing tests asserted that each link's `href` matched its content entry — which
it did. The entry and the link were wrong together. Checking the copy against the
copy proves nothing; checking it against the router proves the thing that
matters. The test also asserts both locales expose the same items, since a tab
present in Arabic and missing in English is a tab someone forgot.

The footer carried the same three dead links and was fixed with it.

Validation: `validate:expert-hub` + `build:expert-hub` green (546 tests).

---

## [Expert Hub] — 2026-08-23 — FAST data dictionary: provenance made checkable

> Two field files arrived — 15 tables, 406 columns. The interesting part was not
> what they added, but what they proved we already had wrong.

### Provenance is data now, and a test enforces it

`shared/fast/` holds a **generated** snapshot of exactly what FAST supplied, a
map from each FAST-sourced Expert Hub field to its `Table.Column`, and a test
that checks the second against the first.

**A FAST column nobody supplied cannot be claimed without failing the build.**
That is the same discipline every journey got — make the wrong thing
unrepresentable rather than merely discouraged — applied to the data dictionary.
The test also asserts the *gaps* as gaps: `plan.PlanTaker` is still absent, no
lookup table arrived, and every pending entry must name the question that would
settle it.

The map doubles as the shopping list for the Academy's own database: FAST
supplied **406 columns; the frontend consumes about 50.**

### Two models were thinner than reality

Neither was caused by the schema — both were exposed by it.

- **The identity brief is bilingual.** `Program.BriefAr` *and* `BriefEn` exist;
  we carried a single `string`. In an Arabic-primary product with an English
  toggle, that put Arabic prose in the middle of an otherwise translated panel
  for an English reader. Now `LocalizedText`, the type `name` already used.
- **An MTM evaluation carries a scale *range*, not a maximum.**
  `SurveyResponse` holds `ScaleLow` **and** `ScaleHigh`; `scale: number` assumed
  every survey starts at 1, so a 0–10 instrument would have read "7 out of 10".
  Now `scaleLow` + `scaleHigh`, and the copy says "on a scale of X to Y".

### What deliberately did not change

**No DTO was renamed to match a FAST row.** `02C` §5 keeps FAST out of the
browser — the API resolves `LanguageId`, `CountryId`, `CityId` into labels before
they arrive. Renaming fields to FAST's columns would leak one system's schema
into another's contract, and would have to be undone the moment the Academy's own
database replaces FAST as the immediate source. Provenance is recorded *about*
the fields, not *in* their names.

Every FAST field the journeys named exists, with the name the journey used —
`PlanTrainer.TrainerId`, `PlanScheduleDay.EndDate` (plus `IsLatestSchedule`,
which is how "last" is actually identified), `TrainingMaterialStatusId`,
`TeamsUrl`, `PlanCancelReasonId`/`CancelReasonOther`. Nothing built had to move.

Validation: `validate:expert-hub` + `build:expert-hub` green (540 tests).

---

## [Expert Hub] — 2026-08-20 — J-22 Withdrawal / Cancellation Handling

> Three scenarios that end the same engagement in three different ways. The
> journey is the fact that they stay apart — so the contract keeps them apart.

### The platform cannot cancel a plan

F3/AC-2 is unusually absolute: "there is no path to cancel a plan manually from
within the platform **under any circumstance** — cancellation originates
exclusively from FAST."

`WithdrawalService` therefore has two operations, both belonging to people
(P-108). F3 needs none at all, because *receiving a consequence* is not an
operation — which is why the mock seeds its cancelled engagement already
terminated. Nothing in this codebase could have produced it, and that is exactly
the point.

### Two reason lists that cannot be confused

F1/AC-2 gives the trainer *Personal Emergency / Scheduling Conflict / Other*.
F2/AC-2 gives staff *Operational Need Change / Administrative Decision / Other*.
Different people, different reasons.

`EngagementTerminationDto` is discriminated by **who ended it**, and each member
carries only its own reason union (P-109). A staff reason on a trainer's
withdrawal is not a bug to catch later — it is a program that does not compile.
The test proves it the honest way: `staffName` is only reachable after narrowing
on `by`.

The shared `TerminationPanel` takes its list as a prop and holds none of its own,
so the two call sites cannot leak into each other.

"Other (free text)" carries the text as a **required field** (P-110) — third use
of that technique, after J-03's addendum and J-20's note. An "Other" with nothing
after it explains nothing.

### Three end-states, and none of them collapses

F3/AC-5 requires *Cancelled* to be "clearly distinct from 'Completed' (J-21/F5)
and 'Withdrawn'". So all three are declared in one place and read differently
everywhere (P-111). **Withdrawn covers both triggers** — the journey names one
outcome for trainer withdrawal and staff de-linking, and *who* did it lives on
the termination record rather than being smuggled into the status.

`isActive` became an allow-list rather than `!== 'completed'`, so a state added
later is inactive by default instead of quietly appearing among a trainer's live
engagements.

And the derivation order matters (P-112): a **termination overrides the
schedule**. If J-21's date logic ran unconditionally, a withdrawn engagement
would re-label itself "completed" the moment its window elapsed, and the
trainer's record would show them delivering a programme they withdrew from. The
seeded cancelled engagement is tested across its own end date to prove it does
not.

### De-linking says what it is *not*

F2/AC-3 calls it "a platform-side unlinking only, **not a FAST cancellation**".
There is no FAST-write field on the result *and* the panel states the plan is
untouched before staff act (P-113) — "we changed nothing in FAST" is precisely
the sort of thing a user assumes wrongly.

The action appears on a **confirmed** slot and nowhere else: an unfilled slot has
nothing to unlink, so `confirmedEngagementId` is `null` until there is one.

Both human paths hand the slot back to **J-19** and say so, because a slot that
silently reopened would leave staff hunting for it.

⚠️ **J-25** — every notification here (staff on withdrawal, the trainer on
de-linking, every linked trainer on plan cancellation) belongs to the missing
Notification Matrix. What is built is the state each notification describes.

### The journey programme is finished

J-22 is the last documented journey. **22 of the 24 documented journeys are
complete**; the two that are not are waiting on inputs, not on work — J-02/F3
needs `J-25`, and J-04 needs the Speaker Fields matrix. J-25–J-28 have no
documents at all (`Q17`).

Validation: `validate:expert-hub` + `build:expert-hub` green (532 tests).

---

## [Expert Hub] — 2026-08-20 — EH-TP-07c: J-21 Engagement Execution Follow-up

> A journey with almost no actions in it. Everything on this page belongs to
> FAST, to MTM, or to the calendar — so the work was making sure nothing here
> can pretend otherwise.

### Completion is a date, not an act

F5/AC-1 completes an engagement "once today's date exceeds its schedule end
date… **regardless of any later administrative action in FAST**".

`ExecutionService` therefore has two operations and both are reads (P-102). The
status is derived from the schedule, by the server, every time — and the page
*explains* that the date moved it, because a trainer whose engagement quietly
relocated to "Past engagements" would otherwise assume somebody closed it.

"Active" turns out to be two states, not one: F1/AC-2 needs *Upcoming* and *In
Progress* told apart, so the union has three members and `isActive` names the
pair (P-103). J-18's `MyEngagementDto` **imports** that union rather than
declaring a second one, so the dashboard split and the detail page cannot drift
apart about what active means — the same reasoning that made J-14 import J-12's
agreement status (P-65).

### Link or venue, never both

F2 gives an online engagement the Teams URL and an in-person one a venue,
"specifying whether it's inside the Academy or outside it". `EngagementLocationDto`
is a discriminated union: the in-person member has **no `meetingUrl` field**, and
the online member has no venue (P-104).

That is also the answer to a question J-16 left hanging. Row 11 of its matrix
carried `meetingUrl` from the very beginning, marked "shown to the trainer only
on engagement confirmation, and only if online" — and until now there was simply
no member anywhere that could read it. The field has been sitting in the contract
for five journeys waiting for this page.

### An enrollee is a name

F3/AC-2: "only their names (Arabic/English) are displayed — **no additional
data**". `EnrolleeDto` has no identifier, no contact field, no organisation
(P-105) — so no future page can display one, and the list is keyed positionally
*because* adding an id just to key it would be adding exactly the data the
journey forbids. The page states the restriction, since a list of bare names
otherwise reads as unfinished.

Attendance (F4) then arrives "as an additional layer on top of the enrollee list
— **not a replacement**", so it is a nullable field on the same rows (P-106). A
parallel roster could disagree with the enrolment list; a column cannot.

⚠️ **Open item 1** — the exact FAST field for attendance is pending. The
behaviour is modelled and the page says the field name is unconfirmed, rather
than naming one that does not exist.

### Evaluations are unrelated to completion, in the type

F6/AC-4 says evaluations appear "regardless" of the engagement's completion
status. Encoding that as **no relationship at all** — evaluations sit on the DTO
unconditionally, and nothing in the contract connects them to the lifecycle — is
stronger than a rule someone has to remember not to add (P-107).

Each record carries its own trainer and programme name (F6/AC-3) rather than
inheriting them from whatever engagement it renders under, because F6/AC-2 makes
MTM the direct source, "without FAST as an intermediary". And per `02D` these are
**raw MTM values**: the page labels them as such so they are never read as the
calculated rating on the trainer's profile.

### F1/AC-3 — a schedule change is visible

FAST can move a plan's dates. The engagement always shows the current dates, and
`scheduleChangedAt` makes the change *visible* rather than silent. ⚠️ The
"immediate notification" the AC also requires is **J-25**'s; what is built is the
state it would describe.

Validation: `validate:expert-hub` + `build:expert-hub` green (514 tests).

---

## [Expert Hub] — 2026-08-20 — EH-TP-08 / EH-INT-10: J-20 Material & Content Submission

> Two paths that are the same act, differing in exactly two places. Both
> differences live in the types.

### One union, and only one member syncs

Approved **training material** is copied back to the plan in FAST (F3/AC-1).
Approved **service-linked content** "is stored within the platform — no external
sync to FAST for this path" (F5/AC-5).

So `SubmissionDto` is a discriminated union, and the content member carries **no
`fastSync` key at all** (P-96). A shared nullable field would have left the rule
to a null check somebody could get wrong; a field that does not exist cannot be
read, set, or misreported. `syncsToFast()` narrows, so the sync block on the
review page is only reachable on the path that has one.

The other difference is the trigger: material opens only when FAST holds "Not
Available" (F1/AC-1, which is J-18/F5/AC-3), content opens on confirmation "with
no dependency on any FAST field" (F4/AC-1). Each path **says which it is** on the
page (P-100) — an upload box that appears on one engagement and not another is
otherwise arbitrary.

### There is no reject

F2/AC-3 and F5/AC-3 give the coordinator two options, and the second is *send a
note opening a new upload opportunity*. `SubmissionStatus` has no terminal
failure and the decision input has no reject member (P-97), so a submission can
always be re-uploaded — which is exactly what F2/AC-4 describes.

The note is a **required field of the request**, not an optional extra (P-98):
the AC says *send a note*, so the union member carries `note: string` and a
note-less request cannot be constructed. Whitespace is refused on both sides.

The review page states that there is no outright rejection, because a missing
button reads as a missing feature unless something explains it.

### "The same rules from J-01", made literal

F1/AC-2 and F4/AC-2 both require J-01's attachment validation. The page calls
**`validateAttachmentFile`** — the function EH-TP-05 uses — against a served
`ApplicationAttachmentRule` (P-99). Not a resemblance: the same function, the
same type, so an approved `G5` rule change lands in both places at once.

### The absences that are the point

- **No approval deadline.** J-20's open item 1 leaves both paths without an SLA,
  so no countdown appears anywhere and the queue *says* no timeframe is defined.
  Every other queue in this product has one; an unexplained absence would read as
  an oversight rather than as the truth.
- **No fabricated preview.** `G26` is unresolved, so an uploaded file is named
  and never linked — F2/AC-2's preview is stated unavailable beside it.

⚠️ **Open item 2** — the Content Developer path's *origin* is unreachable:
J-16's request matrix for that service is empty, so no such request, matching or
offer exists. F4/F5 are fully specified and are built; the mock seeds that
engagement directly and labels it (P-101).

Validation: `validate:expert-hub` + `build:expert-hub` green (493 tests).

---

## [Expert Hub] — 2026-08-20 — EH-INT-09d: J-19 Re-routing After Offer Rejection

> J-17 run again, narrowed to one slot. The narrowing *is* the journey, so it is
> the thing the contract enforces.

### Slot-scoped, and nothing else

F2/AC-1 has staff re-match "scoped to that specific slot only", explicitly "not
the entire original request". `ReRoutingService` has five operations and **all
five take a slot number** (P-91) — a request-wide re-match is not something this
contract can express. J-17's request-scoped operations stay what they always
were: the original cycle, run once.

### A confirmed slot has no cycle at all

F2/AC-2 forbids re-matching from affecting or **reopening** a slot whose
engagement is already confirmed. The server answers **404** for any slot that is
not exhausted (P-92): an empty workspace would leave something for a UI to act
in, whereas nothing leaves nothing to act on.

The request's other slots still appear — as `SiblingSlotDto`, read-only data that
no operation accepts — with the page stating they are unaffected and rendering
**no controls beside them**. A confirmed slot with a button next to it invites
exactly the reopening the AC forbids.

### Someone who already refused is not disqualified

F2/AC-3 is unusually explicit: the same exclusions apply, "with **no restriction
against candidates previously rejected/expired for this same slot** — they can be
re-included if still a valid match". `MatchExclusionReason` has four members and
none of them is history, so a prior refuser can only be excluded for something
true of them *today* (P-93).

The page leans into this rather than hiding it: it lists who already refused,
says beside that list that none of them is excluded, and tags a returning
candidate in the new ranking. Staff who saw a familiar name reappear with no
explanation would report it as a bug.

### Counting, without a ceiling

F3/AC-3: a slot that exhausts repeatedly "repeats without limit — **no escalation
mechanism is triggered**". So `cycleNumber` counts and nothing compares it to a
maximum; `SlotCycleStatus` has no `escalated` member; there is no escalate
operation (P-94). Rejecting a whole new pool simply returns the slot to
`exhausted`, and the page says the cycle can run again — otherwise a
twice-exhausted slot reads as a dead end.

### "Exactly as in J-17/F4", made structural

F3/AC-1 sends the new set to the requesting party exactly as the original cycle
did, so this module **imports** J-17's `CandidatePoolDto`, `SendPoolInput`,
`PoolDecisionInput`, `validatePool` and `validatePoolDecision` instead of
restating them (P-95). Same one-batch rule, same decision-per-candidate, same
ranking check. Only the headcount differs, and `RE_MATCH_HEADCOUNT` names why it
is 1 — which is what makes the pool three.

⚠️ **J-25** — F1/AC-2's exhausted-slot notification, "distinct from a single
candidate's rejection/expiry notification", belongs to the missing Notification
Matrix. What is built is the state it would describe.

Validation: `validate:expert-hub` + `build:expert-hub` green (475 tests).

---

## [Expert Hub] — 2026-08-20 — EH-TP-07: J-18 Assignment Offer Handling & Response Management

> A journey where almost every action belongs to the system or to the trainer —
> and where staff, for once, are spectators. Most of the work was deciding what
> the contract must **not** be able to do.

### Nobody sends an offer

F1/AC-1: once the requesting party approves and ranks, the system sends the offer
to the top-ranked candidate for each slot "with **no additional manual staff
action**". So `EngagementService` has four operations — list my offers, list my
engagements, respond, and read a request's slots — and **no way to send one**
(P-84). An offer exists because J-17's approval created it.

The internal tracking panel *says* this out loud. Staff who arrive expecting a
send button need to know the absence is the rule, not a missing feature.

### One live offer per slot

F1/AC-2: "only the top-ranked candidate receives the offer at any given time;
remaining approved (backup) candidates receive nothing until their turn comes."
`AssignmentSlotDto` holds one nullable `currentOffer` and a `backups` list of
*candidates* — not of offers — so two simultaneous offers on one slot cannot be
constructed (P-85).

### Rejection and expiry: same effect, different record

F2/AC-3 gives silent expiry "the same effect as rejection". F2/AC-4 then requires
the staff member who nominated the candidates to receive a **distinct**
notification when an offer lapses. Both are true at once, so there is **one
advance path with two outcomes** (P-86): collapsing them would make the two
notifications impossible to tell apart at the only place the difference is
recorded.

Expiry itself is the server's (P-87). The 3-day window arrives as a P-J4
`SlaDto`; an offer that lapsed while the page was open comes back `409`, and the
page says the offer moved on rather than reporting a generic failure. A browser
that disagreed with the server about whether three days had passed would be
answering for the trainer.

### FAST syncs per slot, not per request

F4/AC-1 is unusually specific: `PlanTrainer.TrainerId` updates immediately "with
**no waiting for the remaining required slots** on the same request to be
filled". A request-level sync field would have made the forbidden coupling the
natural implementation, so the state lives on the slot (P-88). Following the
trainer-facing precedent, `SlotSyncState` has **no `failed` member** — a stalled
sync stays `processing` and never reverts a confirmed engagement.

### The training-material status is a list, and the rule is phrased negatively

F5/AC-1 says `Plan.TrainingMaterialStatusId` is "a defined list of values, **not
a simple empty/filled attachment**" — so `hasMaterial: boolean` would be exactly
the mistake the AC warns against. The list ends in "etc.", which is why
`enablesTrainerUpload` returns true **only** for `not-available` (P-89): a value
nobody here has seen must behave as material-carrying, not fall through to the
upload path. `canUploadMaterial` is server-decided so the portal never re-derives
the rule from a status string.

### "My Engagements" is a place

F3/AC-2 names the section, so it gets one: **EH-TP-07** at
`/expert-hub/engagements`, with a portal nav entry and a dashboard shortcut, so
the journey's "appears immediately" has somewhere to be immediate to (P-90). The
offers awaiting an answer sit above it on the same page — a trainer who has one
is being asked a question.

⚠️ **J-25** — every notification this journey describes (rejection to staff, the
distinct expiry notice to the nominating staff member, the offer reaching the
trainer) belongs to the missing Notification Matrix. What is built is the state
each notification would describe, and the panel says so.

Validation: `validate:expert-hub` + `build:expert-hub` green (458 tests).

---

## [Expert Hub] — 2026-08-20 — EH-INT-09: J-17 Matching & Nomination

> The richest journey so far — seven matching criteria split across two kinds, an
> exact pool size, two actors, and four outcomes.

### The central distinction: exclusionary vs weighted

The Matching Matrix has seven rows, and J-17 treats them as two different kinds
of thing. That distinction is encoded in the types, not left to a scoring
function's discretion:

- **Exclusionary** (specialization, location, schedule conflict, file status) —
  failing any one removes a candidate **entirely** (F1/AC-2). They are returned
  as `MatchExclusionReason`s on a **separate list**, never as a low score. Mixing
  them into the ranking would let a UI present someone the matrix rules out;
  hiding them would look like the engine missed them. Staff see *why* someone
  they expected is absent (P-80).
- **Weighted** (language, delivery mode, evaluation/classification) — these rank,
  and **cannot exclude on their own** (F1/AC-3). `WeightedCriterionScore`
  produces a number and has no way to express exclusion, so the rule is
  impossible to violate rather than merely documented (P-79).

The location row carries its own parenthetical: it does not apply at all when the
plan is online, because an online plan has no location to match against.

### Exactly three per slot — on both paths

`BR-0505`, generalized by F2/AC-2 to the headcount: a request for 2 trainers
needs **exactly 6** candidates, "no fewer, no more". `poolSizeFor` names the
arithmetic once, the send action stays disabled until the selection is that size,
and the server refuses any other size.

The manual path (F2/AC-1) is **not a way around the rules** — it is the other way
to satisfy them. F3/AC-3 says the conflict exclusion is enforced before
presentation "regardless of which matching path was used", so `sendPool`
re-checks every exclusionary criterion and refuses a manually-picked candidate
who fails one (P-81).

### Two opposite-looking rules from the same journey

- **F3/AC-1** — the pool is sent "together… **never sent one at a time**". There
  is no per-candidate send operation anywhere on the contract.
- **F4/AC-1** — the requesting party reviews "each candidate individually…
  **not a single group-level decision on the whole pool**". There is no "approve
  all" control.

Both absences are in the contract, not merely in the UI (P-82).

### The four outcomes of a decision

- Approve some, rank them (F4/AC-2), and the **top-ranked per slot** move to J-18
  while the rest are named as **ranked backups** (F4/AC-4) — a real state, so it
  is labelled rather than left as "not first".
- Reject **every** candidate and the cycle restarts (F4/AC-3), which the page
  says plainly. The re-routing itself is J-19's.

### `DM-GAP-05` — unapproved weights, handled the same way as before

The weights and tie-breaking rule are not approved, so they arrive as **served
configuration** exactly as the screening evaluation matrix does (P-24). The page
renders whatever model it is given, shows the **weighted breakdown behind each
rank**, and **names the model version as unapproved** — a ranked list whose order
has no visible reason is a black box, and one built on unapproved weights should
say so (P-83).

### Two actors, one page

J-17 has Trainer Management staff who build the pool and a requesting party who
decides on it. Which half you see is **server-decided** (`viewer`, P-J9), since
J-26 has no document and nothing here may read a role. A viewer who may not act
is told so rather than shown a broken workspace.

⚠️ **Open item 1** — matching for Consultant, Content Developer and Question
Writer is undefined because their *request* matrices are still pending from J-16.
Those requests cannot be created, so no unreachable matching path was built.

Validation: `validate:expert-hub` + `build:expert-hub` green (437 tests).

---

## [Expert Hub] — 2026-08-20 — EH-INT-09: J-16 Assignment Request Creation

> The Trainer path in full. The other three services are blocked on their own
> supporting matrices, which J-16 ships empty.

### F1 — the service type is first, because it branches everything

Nothing else renders until a service is chosen. Trainer opens the FAST plan
selection; Consultant, Content Developer and Question Writer produce a **named
blocked state** — their supporting matrices in J-16 are blank and marked
*pending definition* (open item 1), so no fields are invented. "Not available"
would read as a bug; "this service's request data is not defined yet" is the
truth (P-78).

### F2 — pull only, and the exclusions belong to the source

**Nothing here can create a programme or plan** — AC-3 says "under any
circumstance", the service interface has no create counterpart, and the page
says so. A search returning nothing useful is precisely when someone reaches for
"add new"; they should know the absence is deliberate (P-76).

**AC-2's exclusions are applied at the source.** A plan whose FAST status is
*Final Closed*, or whose end date has passed, is filtered before the list is
returned **and** re-checked on pull and on submit — so an excluded plan is
unreachable, not merely hidden. Which plans are closed is FAST's call, never the
browser's (P-77).

### F3 — the two sources are never mixed

AC-2 is explicit that the identity brief comes from the **Program** level and
every operational detail from the **Plan** level, and that the two are never
mixed. They are modelled as **two nested objects**, not one flat record, so
merging them would take a deliberate act rather than an accidental spread — and
they render as two separately-labelled groups, because the distinction is only
useful if the reader can see it (P-74).

**AC-1's "no manual entry" is structural.** The pulled payload is output-only:
the submit input carries a service type, a plan id and a headcount, and nothing
that could overwrite what FAST supplied. Read-only fields alone would leave the
rule to convention (P-75).

Two matrix notes are honoured explicitly:

- **Row 6** — the programme fee is "display only, fully separate from the
  trainer's own price". It is shown with that stated, and nothing computes
  against it.
- **Row 11** — the Teams link is **not rendered**. It belongs to the trainer at
  engagement confirmation (**J-21**); the page notes the link exists rather than
  leaking it to the requesting party now. A test asserts the URL never reaches
  the DOM.

### F4 + F5

Headcount accepts any whole number ≥ 1. **No maximum is invented** — J-16's open
item 2 leaves min and max undefined, and ≥ 1 is inherent to the field's meaning
rather than a policy someone chose. A request for more than one person is marked
on the list, because AC-2 says the request must support several nominations
against it downstream and J-17 will need to know.

Submission issues the reference (F5/AC-1) and the page says where the request
went (F5/AC-2).

### Scope note

J-16 ends at submission and does not ask for a list. One is built anyway: a
create-only screen leaves a submitted request nowhere to be seen, and **J-17
needs exactly this shell** to hang matching and nomination from. It shows what
J-16 produces and nothing more — no matching, no shortlist, no nomination.

Validation: `validate:expert-hub` + `build:expert-hub` green (419 tests).

---

## [Expert Hub] — 2026-08-20 — EH-INT-07/08: J-15 Trainer Search & Unified Profile

> First of the assignment half. It is also the counterpart to a rule the trainer
> portal has been enforcing since J-14.

### F1/AC-2 — the file status finally has somewhere to live

J-13/AC-9 has the system calculate a Trainer Profile Status; J-13/AC-10
(`BR-0408`) restricts it to internal staff, which is why it is deliberately
absent from `MyProfileDto` (P-48). **J-15/F1/AC-2 is the other half of that
rule** — staff must see it — and this is the screen where they do. One rule, seen
from both sides, and the two contracts encode it: `TrainerProfileDto` has
`fileStatus`, `MyProfileDto` has no such field. A test asserts the internal
vocabulary has not leaked back into the trainer's own content.

***Idle* is presented as a monitoring signal, never a restriction.** J-13 says it
has "no effect on matching eligibility", so it carries a neutral tone rather than
a warning, and a note says what it does *not* mean wherever it appears. A warning
badge would quietly turn a monitoring flag into a filter staff apply in their
heads.

### F1/AC-1 — one screen, and it means one screen

Personal data, the record with the Academy, the evaluation, the agreement and the
file status render **together**. Tabs would satisfy the letter and lose the
point, which is that staff see the whole picture before making a call.

The evaluation carries its **last sync date** (AC-1, `02D` §9) — internal views
show the provenance the trainer's own view does not. A score with no idea how
stale it is invites a decision it cannot support.

### F1/AC-3 — seven filter dimensions, one of them blocked

Service, specialty, certifications, experience, evaluation, and file status are
built. **Domain is `Q16`**: J-15 and J-24 both treat *domain* and *specialization*
as distinct, and no domain taxonomy exists anywhere. The control renders only
when the server supplies options, so nothing is invented and the filter appears
the moment the taxonomy does — a test covers both states.

One detail worth naming: an **un-rated trainer does not pass a minimum-evaluation
filter**. Treating `null` as zero would be a judgement the rating engine has not
made.

### J-15's scope is a feature, not a limitation

The journey is explicit: *"a look-up and oversight tool, **not** a
candidate-selection mechanism — sourcing trainers for a specific assignment/event
is handled entirely in J-17."* So there is no shortlist, rank or nominate action
— and the page **says so**, because a filtered list of trainers reads exactly
like a selection tool and staff would reasonably use it as one (P-72).

### F2 — the Identity Card, including what is missing from it

AC-1 is unusually prescriptive: the card is built "per the matrix above, **with
no additional content or custom wording**". So the DTO holds exactly the seven
matrix rows and no free-text slot for an eighth.

**Two of the seven have no source field** in the trainer record — *Related
Fields* and *Social Media Accounts* — and neither J-01's form nor J-13's profile
creation collects them. They render as explicitly unavailable rather than being
dropped: a five-row card that looked complete would hide the gap from the one
person who could report it (`Q19`).

PDF export stays disabled and says why. `G26` leaves document generation
unresolved, and the "approved design template" AC-1 requires is not in this
repository — a client-side PDF in the wrong design is worse than none.

### Route deviation, recorded

`04` EH-INT-07/08 place these at `/expert-hub/profile` as a *staff render* of the
trainer's own route. They are built under `/expert-hub/internal/trainers`
instead, matching the eleven internal routes that already follow that convention
and avoiding a role branch inside a route resolving to a different layout. Page
structure is the page specs' authority (P-20); routing architecture is not
(P-70).

Validation: `validate:expert-hub` + `build:expert-hub` green (401 tests).

---

## [Expert Hub] — 2026-08-20 — J-02/F4: nominee account activation

> Found while answering "what is the partial remaining?". J-02 has **four**
> features; earlier versions of the audit only ever tracked three. F4 was never
> listed, and it was never blocked — it was simply missed.

### What F4 is

Staff nominate someone (J-02/F1), so an application exists in that person's name
before they have ever signed in. F4 is how they take ownership of it: open the
activation link, prove who they are, and gain **full Trainer Portal access** to
track and act on the application.

The route is **public by necessity** — they have no account yet, which is the
entire point. A route guard here would make the journey unreachable, the same
mistake corrected for J-01's guest path last increment (P-68).

### Three routes, chosen by the server

- **AC-3 — existing account.** A matched account already exists, so they sign in
  rather than re-verify. Nothing is verified twice.
- **AC-1 — Nafath.** Citizen/resident with no matched account. This calls the
  *same* `verifyWithNafath` J-01 uses and renders the *same* validation messages,
  which is what makes **AC-2** ("the same Nafath-failure handling from J-01
  applies") a consequence of there being one implementation rather than a
  similarity someone must remember to maintain (P-69).
- **AC-1 — email.** Foreigner/GCC. The link reaching their inbox *is* the
  verification, so the page says so instead of presenting an empty form. Note
  this deliberately differs from J-01's manual path for the same ID type: J-01
  has them type document details because no email round-trip has happened yet.

### AC-4 — access does not wait for the screening stage

"Full Trainer Portal access… **regardless of the application's current screening
stage**" is encoded by omission: nothing branches on the status, and
`ActivationResultDto` carries no capability for a later branch to read. The
status is shown only so the nominee can see where things stand, and the page says
in words that access does not depend on it — because someone discovering a
mid-screening application in their name will reasonably wonder whether they are
allowed in yet. The mock seeds a **late-stage** application precisely so the test
proves activation at `approval-in-progress`, not just for a fresh submission.

### Token states

Invalid, expired and already-used are distinguished rather than collapsed into
one "bad link". An already-used link offers the obvious next step — sign in —
because that is what the person actually wants.

### Still blocked

**F3**, the invitation email that carries the link, is a notification: the
missing **J-25**. It is now the only part of J-02 outstanding.

⚠️ J-02/F3/AC-2 cites "the Notification Matrix (**J-26**)", but J-26 in the
catalogue is *Roles, Permissions & Delegation* — the Notification Matrix is
**J-25**. The journey cites the wrong ID; worth confirming when requesting them.

⚠️ The mock activation tokens are **not real**: the suffix selects which route or
failure to demonstrate, so all of AC-1/AC-3 and every token state are reachable
without a real invitation email.

Validation: `validate:expert-hub` + `build:expert-hub` green (382 tests).

---

## [Expert Hub] — 2026-08-20 — EH-INT-06: J-12 Agreement Lifecycle

> The next journey in the accreditation spine, and the real producer of the
> agreement status EH-TP-04 has been showing from a mock since J-14.

### F1 — expiry tracking

Every agreement's expiry is **calculated from its term**, never entered
(`BR-0301`), and the list shows which of `BR-0303`'s three milestones it has
reached: 90 days, 30 days, 5 days, or lapsed. The milestone is conveyed by
**text and tone together, with the day count beside it** — a badge that only
changes hue tells a colour-blind reader nothing.

The mock runs on a **fixed clock** rather than `Date.now()`, so milestone
boundaries are reproducible in tests and demos. A countdown that shifts with the
wall clock cannot be asserted on.

⚠️ The **alerts** F1/AC-2–4 describe are notifications — the missing **J-25**.
What is built is the milestone being *visible*, which is not the same as an alert
being *sent*.

### F2 — administrative renewal, with the term taken out of anyone's hands

`BR-0302`/D-07 sets the term: **1 year for a first accreditation, 3 years for
every renewal**. `nextTermYears` arrives server-derived and the renew input
carries **no duration field at all** (P-64) — a staff member who could type a
term could break the rule, so there is nowhere to type it. The dialog announces
the term and the date it produces, and says the length is set by rule; AC-3's
"including the new duration" is shown *before* the act, not only after it.

F2/AC-1's directness is stated on the page, not left as an unexplained absence —
the same treatment as J-03/F3/AC-1. And "nearing **or past** expiry" is honoured:
a lapsed agreement is renewable, with the new term running from today rather than
from the date it expired.

### F3 — status control

Suspend, reactivate, end. Ending is **terminal** and says so before it happens,
behind an explicit acknowledgement, pointing at suspension as the reversible
alternative — the J-11/AC-4 precedent applied to the other irreversible act in
the product. `ended` and `expired` stay distinct throughout: J-13's matrix
defines *expired* as ending **without renewal**, i.e. a lapse, while ending is
deliberate.

The state machine lives in one function (`allowedActions`) and is enforced
**server-side too**, so a client that skipped the UI cannot renew an agreement
someone deliberately terminated.

### F4 — template management

The System Administrator edits the fixed legal text and the structural merge
fields used across all agreement generation. This is the screen that would settle
**`DM-GAP-16`** — which is why that gap never blocked J-10: the field list was
always meant to be configuration, and this is where it is configured.

F4/AC-2 asks for a structure supporting several templates "even though a single
unified template currently serves all four services", so the template carries its
linked services from the start. That is the journey giving an explicit
instruction, not speculation.

### Two page-spec deltas, resolved in the journey's favour

- `04` EH-INT-06 §7 says renewal grants "a new 3-year term". **J-12/F2/AC-2 is
  1 year first, 3 years subsequent** — the page spec collapsed `BR-0302`.
- `04` §7 lists "add annex" as an action here. **J-12's scope defers it**:
  "Addendum handling… is already covered in J-03/F3 and is *referenced here, not
  rebuilt*." It is absent by design; EH-INT-02b owns it. A second entry point
  would be a second implementation of `BR-0305` (P-66).

### One rule taken from the page spec, and flagged

J-12/F3/AC-1 says staff "can suspend it or end it" and is **silent on lifting a
suspension**. `04` §7 calls suspend "reversible" and terminate "terminal", and
the journey does not contradict it — so reactivation is built on the page spec's
authority, because without it a suspended agreement would have no way back, which
no document asks for. Recorded as **Needs Confirmation** (`TODO.md` `Q18`,
P-67).

### Also

`AgreementStatus` **imports** `ProfileAgreementStatus` rather than redeclaring
it. EH-TP-04 has shown that status since J-14; J-12 is its real producer, and one
imported union is what stops "the same fact" becoming two vocabularies (P-65).

Validation: `validate:expert-hub` + `build:expert-hub` green (370 tests).

---

## [Expert Hub] — 2026-08-19 — J-01 Identity Linking + the guest path

> The last partial journey. It had been carried as "blocked on `G4`" since the
> audit — and that turned out to be the wrong reading.

### What was actually blocked

`G4` covers the **Nafath/SSO integration contract**: endpoints, payloads, token
exchange. Nothing else. J-01's supporting rule set — *"a prerequisite layer
before form completion begins"* — settles everything above it: the two
verification paths, the timing of account matching, and all five edge-case
outcomes. Those are product rules, and they were buildable all along behind a
service seam. Treating the open integration as blocking the whole layer had left
the journey's largest feature unstarted for no reason (P-60).

### The two independent decisions J-01 defines

**§3A — which verification path?** The ID-type choice decides whether Nafath
applies at all. Citizens and residents verify through it; foreigners and GCC
nationals have **no Nafath call**, so they are not shown one, and the page says
why rather than leaving a gap that looks broken.

**§3B — which account outcome, and when?** Citizens/residents are matched the
moment Nafath succeeds ("early enough to block duplicates before effort is
wasted"). Foreigners/GCC are **deliberately deferred to submission**, by email,
because no live match is possible for them. The service still returns an answer
either way — one code path, one shape — it is just `deferred`.

The five §5 outcomes are one closed union, so a sixth behaviour cannot appear
without amending the journey first. Both blocking outcomes **name their exit**:
an active trainer goes to add a service (**J-03**, never a new J-01), an open
applicant gets a link to track theirs. A block with no exit is a dead end, and
J-01 does not leave one (P-63).

### The guest path — a route guard was making it unreachable

EH-TP-05 sat behind `RequireAuth`, so J-01's guest — who is supposed to complete
the *whole* form with the account auto-provisioned at submission — could not
reach it. The route moved to the public area and **the guard moved into the
page**: the identity gate renders for anyone not signed in, and an authenticated
applicant skips it entirely (§3B row 1). The check is where the journey puts it,
not removed (P-61).

**Governing rule 2** — "a guest can fill the form, but cannot save a draft until
logged in / account created" — is one property of the identity session rather
than a condition re-derived at each call site (P-62). The guest is told up front
what they cannot do, and a save attempt explains it and offers sign-in **with
their entered data still on screen**, which is what §5's "redirected to
login/account creation first" has to mean in practice.

### Also

A heading-structure gap surfaced while testing: the gate branch rendered an `h2`
with no `h1` above it. The page now keeps its own `h1` while the gate runs —
correct structurally, and correct as UX, since identity linking is the first step
of "New application" rather than a separate page.

**J-02/F2** is satisfied by the same work: the journey says the "same Identity
Linking rules from J-01 apply, triggered by staff submission instead of applicant
self-entry", so it consumes the same service and the same five outcomes at a
different trigger. J-02/F3 (the activation invitation) is a notification and
still needs the missing **J-25**.

⚠️ The mock national IDs are **not real numbers**: the last digit selects which
§5 row to demonstrate, so every outcome is reachable in development without a
Nafath connection.

Validation: `validate:expert-hub` + `build:expert-hub` green (351 tests).

---

## [Expert Hub] — 2026-08-19 — EH-INT-02b: the internal half of J-03 (add service)

> Third partial journey completed after the conformance audit
> (`12_JOURNEY_CONFORMANCE_AUDIT.md` §2.4). J-03 was one third built: the trainer
> could submit a request, and nothing received it.

### A new screen, because the page specs never had one

`04_PAGE_SPECIFICATIONS` has no entry for the internal side of J-03 — it predates
the journeys, which outrank it on business logic (P-20). **EH-INT-02b** is built
from J-03/F2+F3 directly: a queue at `/expert-hub/internal/service-requests` and
a decision page at `.../:requestId`, reachable from the internal dashboard.

### F2 — the request is judged in context, never alone

AC-1 enumerates what the decision-maker must see beside the request: *current
services, specializations, classification, evaluations, and active agreement*.
`TrainerContextCard` renders exactly that list, in that order, above the
request's own data — because the point of the AC is that the profile is a peer of
the request, not a link away from it. The active agreement is there for a second
reason: it is the document the addendum attaches to.

AC-2's three search/filter dimensions — trainer name, requested service, status —
are the Filter Bar's only three. No invented fourth.

### F3 — one administrative decision, with two hard gates

- **AC-4 is the interesting one.** "The decision cannot be finalized until they
  upload the corresponding addendum" is modelled by making the addendum a
  **required field of the approve input**. An approval without one cannot be
  constructed — stronger than a flag someone could forget to check, and stronger
  than J-10's two-boolean send gate (P-38), which is right here because there is
  one condition rather than two. The dialog also states what `BR-0305`
  guarantees: no new agreement, no additional e-signature.
- **AC-3** — rejection always carries a reason, with free text required for the
  "Other" entry. The reason list is **served as configuration** rather than
  imported from the screening feature: J-03's open item 2 leaves it unresolved
  whether the two lists are one, and importing would have silently answered it
  (P-57). The mock seeds the same five entries, labelled as a convenience.
- **AC-1** — the decision union has exactly two members, so routing to screening
  is unrepresentable. The page also *says* there is no screening step, because a
  missing stage reads as a bug unless something explains it (P-59).
- **AC-5** — approving joins the service to the trainer's approved scope in the
  same write, which is what "reflects everywhere the trainer's services are
  shown" means from the frontend's side.

Authority is server-decided (`viewer.canDecide`, P-J9): J-03's open item 1 leaves
the decision-maker role unresolved, so nothing reads a role, and a viewer who
cannot decide is told why rather than shown an empty panel.

### Found while building

A seeded request could carry `status: 'approved'` with no decision record behind
it — a state the server cannot produce. The mock now derives a decision record
for any already-decided seed, so the detail page never shows an outcome status
with no outcome.

### Blocked, and named

**AC-6 and AC-7** are notifications, i.e. the missing **J-25**. AC-7 is the
notable one: the trainer is told the outcome **without** the rejection reason —
the opposite of EH-TP-03's application rejection, where the reason is shown
deliberately. The reason is marked internal-only on the contract and labelled as
such in the UI, so whatever trainer-facing surface is built later cannot claim
the constraint was unmarked.

Validation: `validate:expert-hub` + `build:expert-hub` green (338 tests).

---

## [Expert Hub] — 2026-08-19 — J-14: the profile edits the application form, not a copy of it

> Second partial journey completed after the conformance audit
> (`12_JOURNEY_CONFORMANCE_AUDIT.md` §2.2 + §2.3). The largest open conflict.

### The conflict

J-14/F1/AC-1 (`BR-0404`) is unusually specific: *"editing uses the **exact same
fields/sections** as the original application form — **no separate update form is
created**."* EH-TP-04 had exactly that separate form: a hand-built
`EditableProfileFields` of three fields (`bio`, `phone`, `city`) plus its own
`FastFieldDto[]` list, while EH-TP-05 and EH-TP-06 both already drove off the
schema engine.

### The fix

`MyProfileDto` now carries `formSchema` — the **same `ApplicationFormSchemaDto`**
the application form renders — plus `fieldValues` and per-field `fieldStates`.
Sharing the *type* is what makes AC-1 structural rather than a promise: a profile
form that diverges from the application form is unrepresentable, because there is
only one schema, and both pages render it through the same
`DynamicFieldRenderer` and the same validation. Field labels come from the schema
too, so the same field necessarily carries the same words on both pages.

**Editability is per field and server-decided** (P-53), never inferred from an id
or an ownership string:

- `editable` — a live input; saving reflects immediately, with no resubmission
  and no approval cycle (AC-4).
- `request-change` — FAST/SSO-owned. Read-only, with provenance and a *Request a
  change* action; a submitted change shows as **pending beside the still-current
  value**, never replacing it (`BR-0404`, `03` J5).
- `locked` — visible, not editable, and **always with a named reason**. A
  disabled control with no explanation reads as a bug, not as a rule.

The server re-checks on save, so a client that skipped the form cannot write a
locked or FAST-owned field.

### F2 — the Locked Fields matrix, including the one that was missing

J-14/F2 says the matrix fields "remain **visible** but non-editable". *Visible*
is the operative word: classification and the evaluation were scattered into the
page header, and the **agreement status was not shown to the trainer anywhere**.
All three now render together in `LockedFactsSection`, with no edit affordance
and a stated source.

The agreement-status vocabulary (`active` / `suspended` / `expired` / `ended`)
comes from **J-12**, which owns it — F1 tracks expiry, F3 lets staff "suspend it
or end it", and J-13 defines *Expired* as ended **without renewal**, i.e. a lapse
rather than a deliberate act. J-12 is not built yet, so the mock serves it; when
J-12 lands it must produce this union, not a new one.

⚠️ Not to be confused with the **Trainer Profile Status** (J-13/AC-9), which
`BR-0408` keeps internal-only and which remains absent from the whole
trainer-facing contract (P-48).

### The invented `bio` field is gone

`bio` had been added to the mock schema to fill the open `DM-GAP-01`, and
`BR-1004` as corrected in J-24 states there is **no free-text bio field, since
none exists**. Filling an open gap with a field the business says is not real is
worse than leaving the gap visible. The public leak was closed by P-40; this
removes the form that was still asking for it (P-55). The mock draft that
demonstrates resume-with-values now carries a real content-developer field
instead, so the walkthrough still proves service-scoped values are restored.

### Still open on this page

**General attachment self-update** (F1/AC-2 + AC-3). Certificates already upload
and remove; the rest of the J-01 attachment rules need the same treatment, and
production upload stays blocked on `G26`/`G27` either way.

Validation: `validate:expert-hub` + `build:expert-hub` green (321 tests).

---

## [Expert Hub] — 2026-08-19 — J-06: the applicant's half of interview scheduling

> First of the *partial* journeys to be completed after the full conformance
> audit (`12_JOURNEY_CONFORMANCE_AUDIT.md` §2.1). The staff side of J-06 shipped
> with J-07; the applicant side was one action wide.

### The dead end

EH-TP-03 offered the applicant exactly one thing at the interview stage: *confirm
one of these times*. J-06/F4/AC-1 says that when **none** of the proposed times
suits them, they request a reschedule **instead of** selecting — an alternative,
not a fallback. An applicant in that position had no control that fitted their
situation and no way to say so.

### What J-06 actually asks for

- **F4/AC-1** — request different times *instead of* selecting. The button now
  sits beside the confirm action rather than behind it, because that is what
  "instead of" means.
- **F4/AC-2** — request different times *after* confirming, for the thing that
  comes up later. The interview stays actionable rather than dropping to
  read-only once a slot is picked.
- **F4/AC-6** — a reschedule **retains the same interview ticket number**. It is
  a plain field on the interview rather than something derived from the confirmed
  slot, so it survives by construction; a test asserts it across a reschedule.
- **F1/AC-4** — a 3-business-day clock on the selection, now shown.
- **F1/AC-2** — the action lives in the portal. The email is a notification
  channel only, never the place the applicant acts.
- **F2/AC-1 + AC-3** — the meeting link and the interview number are surfaced to
  the applicant, since F1/AC-2 rules out the email as the place they go looking.

`DetailAction` renamed `select-slot` → `manage-interview`, for the same reason
`sign-agreement` became `decide-agreement` last increment: an action named after
one of several answers hides the rest. The loose `interviewSlots` /
`selectedSlotId` pair became one `ApplicantInterviewDto`, so interview UI cannot
render over an interview that does not exist.

### Two rules deliberately **not** invented

- **The reschedule note is optional.** J-06/F4 asks for no reason. It is offered
  because it lets the applicant say *when* they are free, which is what makes the
  next proposal land — but it is not required (P-50).
- **No reschedule limit is enforced.** J-06's own open item 4 says the maximum is
  undefined. Availability is the server-decided `canRequestReschedule` (P-J9), so
  a future cap changes one boolean and nothing else.

### P-J4 promoted to `shared/`

J-06/F1/AC-4 puts the same three-state countdown in front of the *applicant* that
J-05 already showed staff, so `SlaState`/`SlaDto` and `SlaBadge` moved to
`shared/` with copy injected per journey. Screening migrated onto it with all 22
of its tests unchanged and green.

The state stays **server-decided**. Business days depend on the Academy calendar,
which the frontend does not have and must not approximate: a countdown that
quietly disagrees with the server about whether a deadline passed is worse than
no countdown at all. `daysRemaining` is a value to render, never an input to a
calculation (P-51).

### Still blocked, and named as such

- **Teams meeting creation (F2)** — the Teams API is absent from the `CAP-12`
  integration table (J-06's own open item 1). `meetingUrl` is `null` until it
  exists; no link is fabricated.
- **Selection reminders (F1/AC-4)** — these belong to the Notification Matrix,
  i.e. the **missing J-25** (`TODO.md` `Q17`).

Validation: `validate:expert-hub` + `build:expert-hub` green (320 tests).

---

## [Expert Hub] — 2026-08-19 — EH-TP-06 conformed to J-03; EH-TP-04 verified against J-13

> Closes the last two open rows of the pre-journey conformance audit
> (`11_JOURNEY_IMPLEMENTATION_MAP` §3b). Both were logged as *unverified* rather
> than as findings; checking them turned one into two real conflicts and cleared
> the other.

### EH-TP-06 Add Service — two conflicts with J-03/F1

- **AC-1 — already-approved services are *excluded*, not disabled.** The page
  offered every selectable service and greyed out the ones the trainer already
  held, with an "(already approved)" suffix. The AC is explicit: "the selection
  list **only shows** services not already approved for them — previously
  approved services are **excluded**". They now never enter the control. Nothing
  is hidden from the trainer: the read-only "current services" section directly
  above already lists what they hold. One question per control — that section
  answers *what do I have*, the selection answers *what can I add*.
- **AC-2 — only the *mandatory* delta fields are requested.** The delta filter
  matched on visibility alone, so an optional service-specific field would have
  been asked for. The AC says "only the **mandatory** fields specific to that
  service, missing from the trainer's existing profile". This is a no-op against
  today's mock schema — both service-specific fields there are already required —
  and that is precisely the value: it stops an optional field added later from
  quietly re-creating the onboarding friction J-03 exists to remove.
- **The rules moved out of the page** into `addService.types.ts`
  (`availableServicesFor`, `deltaFieldsFor`, `deltaAttachmentsFor`), matching how
  every other journey rule in this codebase lives beside its contract. New
  `addServiceRules.test.ts` asserts them directly — including against a schema
  variant carrying an optional service-specific field, which the demo data does
  not contain, so the mandatory clause is actually tested rather than merely
  written.

### EH-TP-04 My Profile — J-13/AC-10 verified clean

The calculated Trainer Profile Status (Active / Idle / Suspended / Expired,
J-13/AC-9) is restricted by AC-10 (`BR-0408`) to internal Trainer Management
staff — "never displayed to the trainer themselves or on any public-facing
view". `MyProfileDto` carries no status field, so EH-TP-04 cannot render one.
The guarantee is now written down on the contract and guarded by a test that
scans the rendered page for the status vocabulary in both languages, so a future
addition fails a test instead of shipping a quiet disclosure (P-48).

*Idle* is worth calling out: the matrix says it is "for monitoring purposes only,
with no effect on matching eligibility". Showing it to a trainer would imply a
consequence that does not exist.

Validation: `validate:expert-hub` + `build:expert-hub` green (317 tests).

---

## [Expert Hub] — 2026-08-19 — EH-TP-03 conformed to journeys J-11 and J-08

> Third page in the conformance pass over the pre-journey work
> (`11_JOURNEY_IMPLEMENTATION_MAP` §3b). EH-TP-03 modelled the agreement step as
> *upload a signed PDF* — a page-spec invention that journey J-11 supersedes.

### The applicant's decision on the agreement — J-11/F1

J-11 gives the applicant **three** decisions on the fully internally-signed
agreement, not one. `DetailAction` renamed `sign-agreement` → `decide-agreement`,
because naming the action after a single outcome hid the other two.

- **E-sign** (AC-3) — captured **inside the platform**, never uploaded. The
  journey says "using the same e-signature mechanism built in J-10", so the
  mechanism was promoted to `shared/` (**P-J10**) and both journeys consume it:
  J-10's `SignAndApproveInput` and J-11's `ApplicantSignInput` each *extend*
  `ESignatureInput`, so "the same mechanism" is a fact about the types rather
  than a claim in a comment. J-10 migrated onto it with all 32 of its tests
  unchanged and green.
- **Reject** (AC-4) — permanently closes the application. The journey states the
  permanence, so the dialog does too: a warning, an explicit acknowledgement that
  gates the confirm button, and a button that names what it does. The reason
  stays **optional** — J-11 does not ask for one, and requiring it would be an
  invented rule (P-44).
- **Request a modification** (AC-5) — the note is **mandatory**, because it goes
  back to the person who prepared the agreement in J-10; a request with nothing
  to act on stalls the chain at someone who cannot tell what to change. The
  application is not closed — it waits for the revised agreement, which re-enters
  a brand-new internal signing sequence (AC-7).
- **Signing generates the final signed PDF and files a copy in the trainer's own
  portal** (F2/AC-1 + AC-3), so it appears in their attachments and not only
  internally. FAST sync still runs on its own track and never reverts the
  Approved status (`§0.9`).

**AC-2 — "preview or fully download it before deciding, showing all agreement
data without exception."** Document storage is still `G26`, so there is no PDF to
link to. Rather than ship a dead button or drop the requirement, the new
`AgreementPreviewCard` renders the agreement's **complete data** in-page — the
same `MergedDataGroup` shape J-10 assembled, so the applicant reads exactly what
the internal signers approved — and says plainly that the PDF download is not
wired yet. Nobody is asked to decide on something they cannot read.

### The interview exemption — J-08/F2/AC-3

An exempted service must show the interview step as **passed** without disclosing
that an exemption was granted. That now holds **by omission**: `TimelineStageDto`
carries a state and nothing else — no exemption flag, no reason, no `skipped`
state — so no component can render one and the exempted path is
indistinguishable from a completed interview (P-45). A labelled mock scenario and
a test that scans for exemption wording in both languages keep it that way.

### Notes

- The upload path is gone entirely: no file input, no format/size copy, no
  `signAgreement(id, file)`. The service exposes `decideOnAgreement(id, input)` —
  one endpoint, three mutually exclusive answers.
- The page-owned confirmation dialog is now slot-only. Each J-11 decision carries
  its own dialog, because the three need materially different confirmations (a
  signature field, a permanence acknowledgement, a mandatory note) and one shared
  dialog could not state any of them honestly.

Validation: `validate:expert-hub` + `build:expert-hub` green (310 tests).

---

## [Expert Hub] — 2026-08-19 — Conformance pass on the pre-journey pages (J-01, J-24)

> The application form and the public directory were built before the 24
> journeys arrived, against `04_PAGE_SPECIFICATIONS` — now superseded (P-20).
> Auditing them produced a table of findings in
> `11_JOURNEY_IMPLEMENTATION_MAP` §3b, split into **gaps** (missing work) and
> **conflicts** (shipped behaviour that contradicts an approved rule). Conflicts
> are being fixed first; this entry covers the two pages whose conflicts are now
> closed.

### EH-TP-05 New Application — conformed to J-01

- **Attachment rules** now match J-01's approved table exactly: every attachment
  is **1 MB**, with `PDF/DOC/DOCX` for documents and `JPG/JPEG/PNG` for the
  photo. The previous 5–10 MB limits and the `pptx` type were invented by the
  page spec and are gone.
- **Six named sections** replace the three ad-hoc ones — personal, education,
  certifications, experience, training content, availability — with every field
  re-homed to the section J-01 puts it in, plus the missing `deliveryMode` and
  `noticePeriod` fields.
- **An account already holding an approved Trainer role is blocked at the door**
  (F3/AC-4) and routed to *add a service* (J-03), not to "track your
  application". The block reason is a contract field
  (`open-application | approved-trainer`), so the page cannot show the wrong
  message for the wrong reason; the approved-trainer check runs *before* the
  open-draft check, matching the journey's order.

### EH-PUB-02 / EH-PUB-03 Public directory — conformed to J-24 *(privacy)*

J-24/F2/AC-1 (`BR-1004` **corrected**) enumerates the public profile as *name,
domain, specialization, and programs delivered with the Academy — with no
financial or sensitive personal data*, and the journey's open item records that
public evaluation display is **"fully removed from this journey for now"**. The
owner confirmed the enumeration is exhaustive and that the journey supersedes
the earlier instruction to surface a rating.

- **Removed from the public contract, not merely from the layout**: `bio` /
  `briefBio`, `rating` / `ratingBreakdown`, `classification`, `yearsExperience`
  and `traineesTrained` no longer exist on `PublicTrainerSummaryDto` or
  `PublicTrainerProfileDto`. A DTO with no shape for a field cannot leak it —
  stronger than trusting every future page not to render it (P-40/P-41).
- **Added** `deliveredPrograms` (name + year), the one enrichment AC-1 permits,
  rendered as the profile's single content section.
- **Result cards** are now avatar + name link + specializations only.
- **The hero's `expertCount` became `programsDelivered`.** The old figure
  aggregated `classification`, which is not public — and an aggregate over a
  private field still discloses it.
- **Free-text search** no longer matches against the removed bio.
- **Classification labels survive as a standalone export**
  (`getTrainerClassificationLabels`) rather than hanging off the *public*
  `DirectoryContent`, because the trainer's own profile (EH-TP-04) and the portal
  home render them on authenticated, trainer-private surfaces.
- **Two negative tests guard the boundary**: the profile asserts no star rating,
  no classification label from the vocabulary, and no bio text is reachable; the
  directory asserts the same for the result cards. A regression re-adds a failing
  test, not a silent disclosure.

**Still open on these pages** — J-24 and J-15 list *domain* and *specialization*
as two distinct fields, but no domain taxonomy exists in the BRD or any journey.
The profile renders specialization only; no domain was invented (`TODO.md` `Q16`).
`Q5` (source of the public rating) is closed by P-40. J-01's identity-linking
layer and the guest path remain a gap awaiting the `G4` SSO contract.

Validation: `validate:expert-hub` + `build:expert-hub` green (305 tests).

---

## [Expert Hub] — 2026-08-17 — EH-INT-06a Agreement Preparation (journey J-10)

> Fourth increment of the 24-journey build, consuming the two outcomes J-09
> produces. New `features/agreements/` module at
> `/expert-hub/internal/applications/:id/agreement`.
>
> **P-J1 promoted to a shared mechanism first.** J-10/F2/AC-2 requires the
> signing sequence to use J-09's mechanics "exactly", while AC-3 insists the two
> remain distinct entities. Rather than fork a second implementation that would
> drift, sequence formation moved to `shared/components/SequenceFormation.tsx` +
> `shared/types/sequence.ts`: one component, per-journey copy adapters, and
> opt-in rules (`requireMandatory` for J-09, `designateSigners` for J-10). The
> committee module migrated onto it with all 34 of its tests unchanged and green.
>
> **J-10 in full**: the two-condition gate from J-09 (each half named separately
> so the creator knows who to chase); editable template fields with trainer and
> bank data merged in **afterwards**; signing-sequence formation with designated
> e-signer(s); the reviewer-vs-signer split; modification requests with
> resume-from-requester; and the send gate.
>
> Five journey rules are enforced **structurally**: (1) preparation is gated on
> both J-09 outcomes, carried as separate booleans (F1/AC-1); (2) merged data is
> server-supplied and appears only after the fields are saved — there is no input
> anywhere that would let the creator re-key trainer or bank values, which is
> what `BR-0212`'s "no manual re-entry" means in practice; (3) the agreement
> covers exactly the approved services, server-derived and never an input
> (F1/AC-3); (4) **rejection is unrepresentable** — the decision union has only
> `approve`, `sign-and-approve`, and `request-modification`, and the UI states
> *why* the option is absent rather than silently omitting a button (F3/AC-6);
> (5) sending requires a complete sequence **and** an attached signature as two
> separate booleans (`BR-0213`) — the journey spells out that "the e-signature
> alone is not sufficient", so a test asserts exactly that case.
>
> A signing sequence with nobody designated to sign is refused at formation, on
> the same fail-fast reasoning as J-09's mandatory-member rule: it could never
> complete. `DM-GAP-16` (the approved template field list) stays open — only the
> journey-confirmed start and end dates are required, and the form says so.
> Document preview/download remains blocked on storage (`G26`) with an honest
> unavailable state rather than a dead link.
>
> The chain stays walkable: the committee's bank-data gate now links to J-10 once
> both conditions are met. Recorded as `DECISIONS.md` P-35 → P-39.
>
> Validation: `typecheck` ✓ · `lint:expert-hub` ✓ · `lint:css` ✓ ·
> `test:expert-hub` **303/303** across 25 files (32 new agreement tests including
> an axe pass; the 34 committee tests re-run green after the P-J1 migration) ·
> `build:expert-hub` ✓. Only `frontend/src/apps/expert-hub/**` changed.

## [Expert Hub] — 2026-08-16 — EH-INT-05 Approval Committee + bank data (journey J-09)

> Third increment of the 24-journey build, consuming the forward-to-committee
> decision from J-07. Two surfaces: the new `features/committee/` module at
> `/expert-hub/internal/applications/:id/committee`, and the J-09/F6 **Bank
> Data** section added to the trainer profile (EH-TP-04).
>
> **Sequence formation (F2)** — the creator picks approvers, orders them,
> classifies each mandatory/optional, and may save the arrangement as a named
> template. Built as **P-J1**, the reusable pattern J-10/F2 will reuse for the
> internal *signing* sequence (identical mechanics per `J-10/F2/AC-2`, distinct
> record per `AC-3`); copy is injected so the signing sequence can speak in its
> own terms without forking the component.
>
> Six journey rules are enforced **structurally**: (1) mandatory and optional are
> separate contract fields, not one "rejected" flag — a mandatory rejection halts
> the application (`BR-0210`) while an optional one is a logged note that leaves
> the outcome untouched (`BR-0211` revised), and the rejection dialog's warning is
> **obligation-specific** so the difference is stated at the moment of decision;
> (2) a sequence must contain at least one mandatory member, refused at formation
> rather than stalling later, since "finally approved" *means* all mandatory
> members approved; (3) reusing a template **copies** its members, so
> per-application edits never mutate the saved template (F2/AC-5), stated in the
> UI beside the field; (4) the decision is on the application **as a whole**
> (`BR-0209`) — no per-service decision exists in this contract, unlike screening
> and interview; (5) a modification request carries **per-member state**, not a
> cursor, so re-submission resumes from the requesting member with earlier
> approvals preserved (`BR-0218`); (6) final approval and bank-data collection are
> **two independent readiness flags** that both gate J-10 (F4/AC-5 + F5/AC-3), so
> the UI can say which half is outstanding instead of one opaque "ready" badge.
>
> **Bank data (F6)** — the eight mandatory fields open on the profile only after
> preliminary approval (`state !== 'not-requested'`), validate as a set reporting
> every missing field at once, and on save report that the team was notified so
> agreement preparation can proceed (AC-4). The **permanence** question the
> journey itself flags (permanent profile vs per-agreement) is recorded as `Q14`
> in `TODO.md` and marked in code — modelled on the profile because AC-2 says the
> fields "open in their profile", not because it was assumed settled.
>
> The chain stays walkable: the interview page now links to the committee once an
> application is forwarded. Recorded as `DECISIONS.md` P-30 → P-34.
>
> Validation: `typecheck` ✓ · `lint:expert-hub` ✓ · `lint:css` ✓ ·
> `test:expert-hub` **270/270** across 23 files (34 new committee tests + 4 new
> bank-data tests, including axe passes) · `build:expert-hub` ✓. Only
> `frontend/src/apps/expert-hub/**` changed.

## [Expert Hub] — 2026-08-16 — Dev test personas + walkable internal chain

> **Why:** the internal work built in the two preceding entries (EH-INT-03
> screening, EH-INT-04 interview) sits behind `RequireRole("internal")`, but the
> dev SSO placeholder only ever issued a **trainer** session unless the
> `VITE_EXPERT_HUB_DEV_ROLE` env var was set. `/expert-hub/internal/*` was
> therefore unreachable from the UI, and the work looked like nothing had
> changed. Two fixes:
>
> 1. **Two development test personas on the login page** — "الدخول كمدرب"
>    (trainer portal) and "الدخول كموظف داخلي" (internal dashboard), each with a
>    one-line description of what it opens. The choice is recorded before the
>    normal `startSso` redirect, so the persona rides through the *same* flow the
>    real provider will use and the `ExpertHubAuthAdapter` interface gains **no
>    dev-only parameter**. The internal persona lands on the internal dashboard
>    rather than the trainer portal; an explicit `?returnUrl=` still wins.
>    Rendered only while `isPlaceholderAuth` is true, so the block disappears
>    with the rest of the placeholder when Academy SSO (INT-01) lands. Logout now
>    also clears the persona, so the next login starts from the picker instead of
>    silently reusing the previous tester's role.
> 2. **The accreditation chain is walkable**: EH-INT-03 now links to EH-INT-04
>    when the application has reached an interview stage — previously the
>    interview page was reachable only by typing its URL.
>
> Three new router/guard tests cover both personas and the returnUrl precedence.
> Validation: `typecheck` ✓ · `lint` ✓ · `lint:css` ✓ · `test:expert-hub`
> **232/232** across 21 files · `build:expert-hub` ✓.

## [Expert Hub] — 2026-08-16 — EH-INT-04 Interview Evaluation (journey J-07 + J-06 staff side)

> Second increment of the 24-journey build, consuming the committee and slots
> that increment 1's screening decision produces. New `features/interviews/`
> module at `/expert-hub/internal/applications/:id/interview`.
>
> **J-07 in full**: the interview ticket from J-06/F2 (number, confirmed time,
> Teams-link slot, reschedule count); a committee response tracker; the
> per-member evaluation form scoring **each accepted service independently**
> against model-supplied axes (F1/AC-2); "did not attend" as a confirmed,
> first-class alternative to scoring; the consolidated result; and the
> post-interview decision — forward to the approval committee, or reject
> directly with a reason from the platform-wide unified list.
>
> Four journey rules are enforced **structurally**: (1) `result` is `null`
> rather than a partial average until every assigned member has responded
> (`BR-0220`, F2/AC-1), so no component *can* render a half-formed number;
> (2) non-attendance is a distinct response state excluded from the average and
> reported as an exclusion — never a score of zero (F1/AC-3, F2/AC-2); (3) each
> accepted service is averaged on its own key with no blended field anywhere;
> (4) decision authority arrives as a server-decided `viewer.canDecide`
> (`BR-0208`) rather than being inferred from a role string. A blocked decision
> renders **disabled with a named reason** instead of vanishing.
>
> **J-06 staff side**: the Internal-Dashboard reschedule (F4/AC-3+AC-4) —
> propose new slots and a note, restarting the applicant selection flow, with
> the dialog stating AC-6 explicitly (the same interview number is retained; a
> reschedule never issues a new one). The Teams meeting link is surfaced as
> ticket data and shown as an explicit pending state — the Teams API is not in
> the CAP-12 integration table yet (J-06 open item 1), so the frontend never
> fabricates a link.
>
> **Reuse, not duplication**: `LocalizedText` moved to `shared/types` (screening
> re-exports it); the proposed-slots editor was extracted to
> `InterviewSlotsField` in the interviews feature and screening now consumes it
> — one editor for both places the platform proposes times; the rejection-reason
> list is imported from the screening module rather than re-declared, since
> J-07/F3/AC-2 points at the *platform-wide unified* list (`BR-0219`).
> `DM-GAP-03` (interview axes/weights) stays open and arrives as configuration
> per the `BR-0203` pattern. Recorded as `DECISIONS.md` P-26 → P-29.
>
> Validation: `typecheck` ✓ · `lint:expert-hub` ✓ · `lint:css` ✓ ·
> `test:expert-hub` **229/229** across 21 files (28 new interview tests,
> including an axe pass; the 22 screening tests re-run green after the shared
> slots-field refactor) · `build:expert-hub` ✓ (page lazy-chunked at 36 kB /
> 11 kB gzip). Only `frontend/src/apps/expert-hub/**` changed.
>
> One content defect found and fixed while testing: the reschedule dialog's hint
> and its validation error were the same Arabic string, so the error was
> indistinguishable from the hint.

## [Expert Hub] — 2026-08-16 — EH-INT-03 Screening Detail (journeys J-05 + J-08)

> First increment of the **24-journey build**. The owner added the 24 journey
> documents (`docs/expert-hub/J-01 …` → `J-24 …`) as the newer business source of
> truth; this session read the full documentation set, audited every journey
> against the shipped Expert Hub app, and published
> `docs/expert-hub/11_JOURNEY_IMPLEMENTATION_MAP.md` — a per-journey coverage
> table (2 built · 6 partial · 15 unbuilt · 1 system-only at audit time), a
> 10-increment dependency-ordered build order, 7 cross-journey patterns to build
> once and reuse, and **7 catalogued deltas where the journeys supersede the
> older `04_PAGE_SPECIFICATIONS` / `05_WIREFRAME_SPECIFICATIONS`** (recorded as
> `DECISIONS.md` P-20 → P-25).
>
> **Built: EH-INT-03 — the Application Insight Page** at
> `/expert-hub/internal/applications/:id`, replacing the `ComingSoonPage` stub
> the inbox previously opened into. New `features/screening/` module:
> `screening.types.ts` (DTOs + the `validateAcceptDecision` /
> `validateRejectDecision` gates), `screeningService.ts` (mock + HTTP providers
> on one versioned contract), `mockScreeningProvider.ts`, the clearly-labelled
> `mockEvaluationModel.ts`, AR-authoritative/EN `screening.content.ts`, six
> components, the page, and two test files.
>
> Three journey rules are enforced **structurally rather than by convention**:
> the objective score and the AI qualitative analysis are separate contract
> fields rendered by separate components, so no shape exists in which an AI value
> reaches the official score (`BR-0201`/`BR-0202`); scoring is per service with
> no application-level total field (J-05/F2/AC-3); and every accepted service
> must resolve to interview slots **and** committee members together, or an
> interview exemption with a reason (J-05/F5/AC-3+AC-4, J-08/F1) — a single
> validation gate that reports every incomplete service at once and refuses to
> open the confirmation dialog. Services left unselected are auto-rejected and
> disclosed **before** confirmation (AC-2); rejection stays whole-application
> with an explicit warning and a mandatory reason (AC-7/AC-8, `BR-0219`).
>
> The evaluation matrix itself (`DM-GAP-02`) stays open: weights and thresholds
> arrive as configuration per `BR-0203`, never hard-coded in a component, so the
> approved matrix drops in with no UI change. The below-threshold marker is
> display-only with an explicit note (F2/AC-5). Attachment preview is disabled
> with a visible explanation rather than a dead link while storage is unresolved
> (`G26`).
>
> Validation: `typecheck` ✓ · `lint:expert-hub` ✓ · `lint:css` ✓ (DC-04/DC-23) ·
> `test:expert-hub` **201/201** across 19 files, including 22 new screening tests
> and an axe pass on the new page · `build:expert-hub` ✓ (page lazy-chunked at
> 48 kB / 14.5 kB gzip). Scope boundary respected — only
> `frontend/src/apps/expert-hub/**` changed; no Design System, Hackathon, or
> shared-utility edits.

## [Frontend 0.5.8] — 2026-07-20 — Visual Compliance: Notification (CMP-24)

> Twelfth component of the "Complete All Remaining Registry Components"
> cycle — the last of step 7 (Modal and Notification Toast already done),
> closing step 7 out entirely. Live verification
> (`get_metadata`/`get_design_context`/`get_variable_defs` on node
> `30150:56889`, 10 variants: `rtl` × `style`, no `mobile` axis) confirmed
> `Notification` is a genuinely distinct shape from `Alert`/`Toast` (both
> boxed cards) — a slim, full-width, single-row banner (1280×56px),
> `radius-xs` (2px), no shadow, a 24px **solid** tone-colored icon with a
> **white** glyph (opposite of `Alert`'s tint+colored-icon treatment), an
> optional bold tone-colored `leadText` prefix, a **tone-colored message**
> (unlike `Alert`/`Toast`'s neutral-gray message), inline `link`+`action` in
> the same row as the text, and a thin tone-colored accent line along the
> **bottom** edge (opacity 0.7, 0.6 for Neutral). Rebuilt as a self-contained
> primitive (stopped composing `_shared/NoticeBody`, same precedent as
> `Alert`/`Toast`); added `tone="neutral"` and inline `link`/`action` slots.
> Real finding: the action button is byte-identical to `Button`
> `variant="neutral"`, the link to `Link` `mood="neutral"` — the same
> `Button` mapping already found for `Modal`'s Primary Action, confirmed a
> second time independently — disclosed as composition guidance. 21 new
> additive `--fads-sys-notification-*` tokens. `Notification.test.tsx` grew
> from 5 to 10 tests, all 5 pre-existing tests unmodified. Full validation
> suite green (the same 6 pre-existing, unrelated `ApplicationFormPage`/
> `HomePage` failures independently reconfirmed against a clean-`HEAD`
> baseline worktree — zero regression from this cycle's work). Docs:
> `docs/FIGMA_NOTIFICATION_SPECIFICATION.md`,
> `reports/VISUAL_COMPLIANCE/Notification/VISUAL_COMPLIANCE_NOTIFICATION.md`.

## [Frontend 0.5.8] — 2026-07-20 — Visual Compliance: Notification Toast (CMP-22)

> Eleventh component of the "Complete All Remaining Registry Components"
> cycle — the other half of step 7 (Modal already done). Near-total rebuild,
> same severity as `Alert`/`Avatar` before their own passes: the pre-existing
> `Toast` composed the shared `_shared/NoticeBody` (plain title/message/
> ad-hoc-`×`-button, tone as a thin border color only). Live verification
> (`get_metadata`/`get_design_context`/`get_variable_defs` on node
> `8680:37527`, 20 variants) found it matches the already-Approved `Alert`'s
> own structure almost exactly (same `PAT-06` family) — a 40px tone-colored
> featured icon, up to two actions, a literal `Button-Close` dismiss control,
> an always-present tone-colored accent stripe. Rebuilt as a self-contained
> primitive (stopped composing `NoticeBody`); added `tone="neutral"` (a 5th
> tone the pre-existing implementation lacked) and new `icon`/`action`/
> `secondaryAction` slots; composed `<ButtonClose>`; kept the auto-dismiss
> timer (pause-on-hover/focus) completely unchanged. Real finding: desktop
> action buttons are byte-identical to `Button` `variant="tertiary"`, mobile
> action buttons to `variant="secondarySolid"` `size="lg"` — a genuine
> variant *switch* generic action slots can't auto-apply, disclosed as a
> scope limitation. Mobile layout applied via CSS media query (`flex-wrap` +
> `order` on one shared DOM structure) rather than a boolean prop, since
> `ToastProvider`'s queue has no reliable viewport signal at queue time.
> `ToastOptions`/`ToastProvider` extended to pass through the new props. 31
> new additive `--fads-sys-toast-*` tokens. `Toast.test.tsx` grew from 7 to
> 12 tests, all 7 pre-existing behavioral tests unmodified. Full validation
> suite green. Docs: `docs/FIGMA_NOTIFICATION_TOAST_SPECIFICATION.md`,
> `reports/VISUAL_COMPLIANCE/Toast/VISUAL_COMPLIANCE_TOAST.md`.

## [Frontend 0.5.8] — 2026-07-20 — Visual Compliance: Vertical Tab List (CMP-09b, dependent row)

> Tenth item of the "Complete All Remaining Registry Components" cycle,
> unblocked immediately by Vertical Tab's own approval and processed in the
> same session. Live re-verification (`get_metadata`/`get_design_context` on
> node `418:100259`, 12 variants: `rtl` × `size` × `tabIcons`) found the live
> structure — plain `flex-col` column, **no baseline divider at all** (not a
> toggleable prop, genuinely absent), no inter-tab gap, no `flush`-equivalent
> prop, full-width tabs — already exactly matches what the
> `orientation="vertical"` `Tabs` implementation produces. **Zero code
> changes needed.** `tabIcons` is already achievable via the existing
> per-item `TabItem.icon` prop. Added spec §6, a compliance-report addendum,
> and two new stories (`VerticalOfficialFigmaReference`, `VerticalNoIcons`).
> `COMPONENT_APPROVAL_MATRIX.md` row renamed to "Vertical Tab / Vertical Tab
> List" to cover both, matching the Horizontal Tab / Horizontal Tab List
> row's own format. Docs: `docs/FIGMA_VERTICAL_TAB_SPECIFICATION.md` §6,
> `reports/VISUAL_COMPLIANCE/VerticalTab/VISUAL_COMPLIANCE_VERTICAL_TAB.md`
> §6 addendum.

## [Frontend 0.5.8] — 2026-07-20 — Visual Compliance: Vertical Tab (CMP-09b)

> Ninth component of the "Complete All Remaining Registry Components" cycle,
> unblocked by Horizontal Tab List's own approval. Registry status was
> `Missing` — a genuinely new build (zero prior code), unlike the other
> `Tabs`-related passes. Live verification (`get_metadata`/
> `get_design_context`/`get_variable_defs` on node `418:99793`, 68 variants)
> confirmed Vertical Tab is the same official `Tab/*` Figma variable family as
> the already-Approved Horizontal Tab (colors/hover/pressed/focus mechanics
> byte-identical) — implemented as a new `orientation="vertical"` mode on the
> existing `Tabs` composite rather than a separate component, per the
> registry's own original scope note. New: column layout; an inline-start
> vertical indicator bar (vertically inset) instead of a bottom bar;
> `ArrowDown`/`ArrowUp` navigation (not RTL-sensitive) + `aria-orientation`;
> Semibold(600)/Regular(400) selected/unselected typography (vs. horizontal's
> Bold/Medium) and text-md at Large size; per-size padding/indicator-inset
> tokens. A live-sampled quirk (Disabled+Selected renders Medium(500) weight,
> matching neither enabled state's own weight) was reproduced exactly, not
> corrected. No `moreTab`-equivalent overflow trigger exists for this axis —
> not implemented (`overflow-y: auto` used instead). 8 new additive
> `--fads-sys-tabs-vertical-*` tokens. `Tabs.test.tsx` grew from 15 to 23
> tests, all pre-existing horizontal-mode tests unmodified. Full validation
> suite green. Vertical Tab List (dependent, still `Missing`) is out of scope
> for this pass. Docs: `docs/FIGMA_VERTICAL_TAB_SPECIFICATION.md`,
> `reports/VISUAL_COMPLIANCE/VerticalTab/VISUAL_COMPLIANCE_VERTICAL_TAB.md`.

## [Frontend 0.5.8] — 2026-07-20 — Visual Compliance: Modal (CMP-25)

> Eighth component of the "Complete All Remaining Registry Components" cycle —
> step 7 of the execution plan (Modal / Notification Toast / Notification,
> each independent; Modal chosen). Unlike recent rebuilds, Modal's behavioral
> architecture (portal, focus trap + restore, `Esc`-close, scrim dismissal,
> `inert` background isolation, `aria-modal`/`aria-labelledby`) was already
> correct — this was a visual/structural pass. Live verification
> (`get_metadata`/`get_design_context`/`get_variable_defs` on node
> `30150:55001`) found the close control was an ad-hoc "×" button instead of
> the already-Approved `ButtonClose` (confirmed as a literal `Button-Close`
> instance in the live node — composed directly, now flips correctly under
> RTL via logical positioning); no featured-icon slot existed (added as a
> fully optional `icon` prop); title/body used generic/wrong color tokens
> instead of the live-verified `text-display`/`text-primary-paragraph`;
> container radius/padding/shadow/width were generic, unverified values
> instead of the live-verified `radius-md`/24px/exact shadow/600px; no mobile
> action-stacking existed. A real finding while fixing this: Figma's Primary
> Action (`#0d121c`) is byte-identical to this repo's `Button`
> `variant="neutral"` (not `variant="primary"`), and Secondary/Tertiary
> Action matches `variant="secondary"` (not the borderless `variant="tertiary"`)
> — documented as composition guidance (new `OfficialFigmaReference` story),
> not a breaking API change, since the generic `footer` slot was kept
> unchanged for its real consumer (`ConfirmActionModal.tsx`, which needs a
> `destructive` variant with no Figma equivalent). 6 new additive
> `--fads-sys-modal-*` tokens. `Modal.test.tsx` grew from 10 to 13 tests, all
> prior behavioral tests unmodified; `ApplicationDetailsPage.test.tsx`
> re-confirmed passing (real consumer, no regression). Full validation suite
> green. Docs: `docs/FIGMA_MODAL_SPECIFICATION.md`,
> `reports/VISUAL_COMPLIANCE/Modal/VISUAL_COMPLIANCE_MODAL.md`.

## [Frontend 0.5.8] — 2026-07-19 — Visual Compliance: Horizontal Tab / Horizontal Tab List (CMP-09)

> Seventh component of the "Complete All Remaining Registry Components" cycle,
> processed as one unit (`Tabs.tsx`) per the registry's own bundled-file note.
> Live verification (`get_metadata` to enumerate all 68 + 10 variant nodes,
> `get_design_context` with `disableCodeConnect`, `get_variable_defs` on nodes
> `30150:125017` / `30150:125364`) found the pre-existing `Tabs` (built
> pre-workflow, Phase 5B) was a generic bordered-pill style with no
> relationship to the official bottom-underline-indicator component — the
> same severity of mismatch previously found for `Alert`/`Avatar`. Rebuilt
> around the live component: real `size` (`sm`/`md`/`lg`), a per-item `icon`
> slot, real Hover/Pressed states (neutral background + a black "preview"
> indicator bar for unselected tabs), a `Button`-style double-ring
> focus-visible treatment, solid (not opacity) Disabled colors, the
> previously-missing Tab List baseline `divider`, a `flush` prop, real
> `overflow-x:auto` scrolling (replacing an invented `flex-wrap` + inter-tab
> `gap`), and a visual-only `moreTab` overflow-trigger shell (CSS-drawn ⋯
> glyph — `more-horizontal` isn't in the Icon registry). Confirmed no
> badge/count sub-element exists on this component — correctly not
> implemented. Kept the pre-existing RTL-aware roving-tabindex keyboard logic
> unchanged (independently correct against WAI-ARIA APG). A real
> `aria-required-children` accessibility bug (the optional overflow-trigger
> button nested inside the same subtree as `role="tablist"`) was found and
> fixed by this pass's own axe scan, via a `display:contents` inner wrapper
> that isolates the ARIA tablist to only its real tab children. 24 new
> additive `--fads-sys-tabs-*` tokens. `Tabs.test.tsx` grew from 6 to 17
> tests; 722/728 tests pass repo-wide (60 files — 6 pre-existing, unrelated
> failures). Full validation suite green (`tokens:check-coverage`: 789
> defined, 695 referenced, 0 missing). Docs:
> `docs/FIGMA_HORIZONTAL_TAB_SPECIFICATION.md`,
> `reports/VISUAL_COMPLIANCE/HorizontalTab/VISUAL_COMPLIANCE_HORIZONTAL_TAB.md`.

## [Frontend 0.5.8] — 2026-07-16 — Visual Compliance: Tooltip (CMP-30)

> Sixth component of the "Complete All Remaining Registry Components" cycle.
> Already flagged in advance by `TrailingIcon`'s own approval notes: Tooltip's
> code was an explicitly-marked placeholder rendering a dark-inverse bubble,
> the opposite of the light panel live-verified for TrailingIcon's own
> separate panel. Live verification (`get_design_context` +
> `get_variable_defs` + `get_screenshot` on node `30150:139266`) confirmed
> the official default bubble is light, not dark — fixed via a new
> `inverted` prop (dark now opt-in). Added a beak/pointer (direction derived
> from the existing `placement` prop), a new `title` heading slot, and a new
> `icon` slot (default `true`, matching the official default, using the
> already-registered `help-circle` icon). Fixed max-width `256px`→`240px`.
> 12 new additive `--fads-sys-tooltip-*` tokens. Zero consumers in product
> code today, so the `icon` default change carries no breaking-change risk.
> 12 tests pass (up from 2); full validation suite green. Docs:
> `docs/FIGMA_TOOLTIP_SPECIFICATION.md`,
> `reports/VISUAL_COMPLIANCE/Tooltip/VISUAL_COMPLIANCE_TOOLTIP.md`.

## [Frontend 0.5.8] — 2026-07-16 — Visual Compliance: Avatar (CMP-12)

> Fifth component of the "Complete All Remaining Registry Components" cycle,
> and the first genuinely new build in it (registry status was `Implemented`/
> `visualComplianceStatus: "pending"` — real open work). Live verification
> (`get_design_context` + `get_variable_defs` on node `5699:53529`) found the
> pre-existing implementation only covered 3 of 7 official sizes, had no
> `square`/`border` props, used a flat font-weight instead of the official
> per-size scale, and used the wrong background token (`#f9fafb` instead of
> the live-verified `#f3f4f6`). Fixed all four: `AvatarSize` extended
> additively to 7 sizes (existing `sm`/`md`/`lg` unchanged — non-breaking);
> new `square`/`border` props; 25 new additive `--fads-sys-avatar-*` tokens.
> The official default Icon-type "user" glyph is not in this codebase's Icon
> registry — `icon` stays a consumer-supplied slot, a disclosed scope
> boundary, not a defect. 16 tests pass (up from 3); full validation suite
> green. Docs: `docs/FIGMA_AVATAR_SPECIFICATION.md`,
> `reports/VISUAL_COMPLIANCE/Avatar/VISUAL_COMPLIANCE_AVATAR.md`.

## [Frontend 0.5.8] — 2026-07-16 — Registry Retirement: "Header Menu Item (duplicate?)"

> Fourth component of the "Complete All Remaining Registry Components" cycle,
> same pattern as "Header Menu (duplicate?)", reusing evidence from the same
> `search_design_system` call. Confirmed exactly one "Header Menu Item"
> component_set in the library, componentKey-identical to the already-Approved
> "Header Menu Item" row. Marked `status: "Duplicate"` (retired), not
> `Approved`.

## [Frontend 0.5.8] — 2026-07-16 — Registry Retirement: "Header Menu (duplicate?)"

> Third component of the "Complete All Remaining Registry Components" cycle.
> This `NeedsConfirmation` row's `nodeId` was null, so `search_design_system`
> was permitted per `CLAUDE.md`'s policy — it returned exactly one "Header
> Menu" component_set in the whole library, componentKey-identical to the
> already-Approved "Header Menu (hamburger)" row. Confirmed duplicate, not a
> distinct component. Marked `status: "Duplicate"` (retired), not `Approved`
> — it has no implementation/spec/report of its own.

## [Frontend 0.5.8] — 2026-07-16 — Registry Catch-Up: Progress Indicator (CMP-21)

> Second component of the "Complete All Remaining Registry Components" cycle,
> same shape as Loading. Progress Indicator (Steps, CMP-21) was already
> `Approved` in `docs/COMPONENT_APPROVAL_MATRIX.md`/`docs/PROJECT_STATUS.md`
> since 2026-07-13, with a complete spec and compliance report already on
> disk. Re-verified live via `get_design_context` against node
> `30150:68350` — zero drift found (48-variant matrix, official
> `showDescription`/`showStepName` properties all match). Only the registry
> row was corrected; no code/spec/test changes needed.

## [Frontend 0.5.8] — 2026-07-16 — Registry Catch-Up: Loading (CMP-31)

> First component of the "Complete All Remaining Registry Components" cycle. Full
> `figma-component-map.json` audit: 38 Approved, 1 NotApplicable, 43 actionable
> (24 Missing, 9 Implemented, 5 PartiallyImplemented, 5 NeedsConfirmation) — see
> `reports/REMAINING_REGISTRY_COMPONENTS_REPORT.md`. Loading (CMP-31) was found to
> be a stale registry row, not open work: already `Approved` in
> `docs/COMPONENT_APPROVAL_MATRIX.md`/`docs/PROJECT_STATUS.md` since 2026-07-13,
> with a complete spec and compliance report already on disk. Re-verified live via
> `get_design_context` against node `5698:11136` — zero drift found. Only the
> registry row's status fields were corrected; no code/spec/test changes needed.

## [Frontend 0.5.8] — 2026-07-12 — Visual Compliance Correction: Text Input (CMP-13)

> Fixed ONLY the `TextInput` component (CMP-13) against the official Platforms Code
> Figma **Text Input** component set (file `J0xq7JG3JKshRDzrgAM7E0`, node
> `30150:130250` — 288 variants: `rtl` × `state` × `filled` × `error` × `size` ×
> `style`), verified live via the read-only Figma MCP tools. The registry had only a
> `componentKey`, no `nodeId`; `search_design_system` confirmed the component but
> returned no canvas node (same limitation documented for `Link`), so the user
> supplied a node-specific URL directly. Third component of Batch 01
> (`docs/DGA_COMPONENT_IMPLEMENTATION_QUEUE.md`). No other component, no page,
> touched. Full detail in `docs/FIGMA_TEXT_INPUT_SPECIFICATION.md` and
> `reports/VISUAL_COMPLIANCE/TextInput/VISUAL_COMPLIANCE_TEXT_INPUT.md`.

### Changed (architecture)

- `TextInput` is now a **fully self-contained primitive** — it no longer composes
  the shared `Field`/`control.module.css` base that `Textarea`/`Select` still use.
  The official Text Input's structure (prefix/suffix badges, a leading-icon slot, a
  `Size` axis with per-size typography, a 3-value `Style` surface axis) had diverged
  too far from that shared shape to reuse without distorting it for one component's
  needs. `Field.tsx`, `Field.module.css`, `control.module.css`, `Textarea.tsx`, and
  `Select.tsx` are **unchanged** (`grep`-verified before and after). The full
  label-association / `aria-describedby` / `aria-invalid` / `aria-required` a11y
  contract is preserved, just re-implemented locally.

### Added

- `size` prop (`TextInputSize`: `'md' | 'lg'`, default `'lg'`) — maps to the
  official `Size` variant. `Medium` correctly drops the value-text font tier to
  `text-sm` (14px), not just the field height.
- `surface` prop (`TextInputSurface`: `'default' | 'filledDarker' | 'filledLighter'`)
  — maps to the official `Style` variant. `Filled darker`/`Filled lighter` are flat,
  borderless fills; both live-verified to fully or partially revert to the Default
  style's white-background + border on Focus, and to converge to the same uniform
  Disabled treatment as every other surface.
  `iconStart`, `prefix`, `suffix` props — leading-icon and text-badge slots that
  did not exist before.
- A real Focused-state treatment: the official 2-layer soft drop shadow
  (`shadow-md`) plus a full-width 2px bottom underline accent — previously no
  focus-visible styling existed at all.
- A real Pressed-state treatment (background darkens + underline accent,
  state-independent of `surface`) via native `:active` — previously indistinguishable
  from Hovered.
- 36 new additive `--fads-sys-textinput-*` tokens in `scripts/generate-tokens.mjs`,
  plus a new generic `getFormColor()` alias-resolver (mirroring the existing
  `getButtonColor()` pattern) since `Light.tokens.json`'s `Form` group stores most
  Text Input colors as alias strings rather than direct hex values.

### Fixed

- **Read-only background** — official Read-only has **no fill** (transparent);
  previously rendered a solid `--fads-sys-color-background-subtle` fill.
- **Disabled treatment** — official Disabled is a real, solid, surface-independent
  color set (no fill, gray border/text); previously used `opacity` to dim whatever
  variant was showing, unlike every other approved component's "solid colors, not
  opacity" pattern (Button, Card).
- **Required-asterisk disabled state** — the asterisk now correctly grays out with
  the rest of the label when `disabled`, instead of keeping its red error color.
- **Radius/border-width tokens** — switched from unverified generic tokens
  (`--fads-sys-control-radius`) to the shared, already-verified
  `--fads-sys-radius-sm`/`--fads-sys-border-width-thin` (same reuse pattern as
  Button/Link/Tag).
- Two `npm run typecheck` bugs found and fixed mid-pass: a `prefix` prop naming
  collision with a global RDFa HTML attribute present on all React DOM elements,
  and a missing `id` field caused by an over-broad `Omit` inherited from the old
  `Field`-based implementation.

### Not implemented / Flagged (non-blocking)

- The official "Type Cursor" (a fake blinking-caret element in the Focused-state
  Figma node) is **intentionally not implemented** — a real `<input>` already
  renders its own native caret on focus.
- The feedback icon in the helper/error text row is **not implemented**, pending
  the official DGA icon library (Q8) — same category as `Link`'s external-icon
  placeholder.
- **Needs Confirmation:** a Large-size/Default-state value-text color discrepancy
  (uses `field-text-focused` instead of the semantically-matching
  `field-text-filled`, which the otherwise-identical Medium-size sample uses) —
  implemented using `field-text-filled` for both sizes, per the token's own name.
- **Needs Confirmation:** one live RTL sample's padding/DOM-order structure could be
  read as "icon/prefix/suffix stay physically anchored, don't mirror with text
  direction" — implemented as full logical-properties mirroring instead (this
  codebase's universal, lint-enforced RTL convention), since the alternative would
  be a genuinely unusual, unconfirmed pattern inconsistent with every other
  approved component.

Verified green: `typecheck` · `lint` (incl. `lint:css`) · `format:check` · `test`
(**328 passing**, 43 files) · `tokens:validate` (336 generated tokens, 0 referenced
missing) · `build` · `build-storybook`. **Text Input: ✅ Approved** —
`docs/COMPONENT_APPROVAL_MATRIX.md`,
`frontend/src/design-system/registry/figma-component-map.json`.

---

## [Frontend 0.5.8] — 2026-07-12 — Visual Compliance Correction: Tag (CMP-26)

> Fixed ONLY the `Tag` component (CMP-26) against the official Platforms Code Figma
> **Tag** component set (file `Sv0oWOS1SjWnwhQwdzRJIE`, node `421:110968` — 288
> variants: `rtl` × `size` × `style` × `outline` × `rounded` × `iconOnly`), verified
> live via the read-only Figma MCP tools. The node was already resolved in the
> registry from a prior session, so no `search_design_system` call was needed.
> Second component of Batch 01 (`docs/DGA_COMPONENT_IMPLEMENTATION_QUEUE.md`). No
> other component, no page, touched. Full detail in
> `docs/FIGMA_TAG_SPECIFICATION.md` and
> `reports/VISUAL_COMPLIANCE/Tag/VISUAL_COMPLIANCE_TAG.md`.

### Added

- `size` prop (`TagSize`: `'xs' | 'sm' | 'md'`) — maps to the official `Size`
  variant (x Small/Small/Medium: 20/24/32px height, 8/8/12px padding-inline,
  10/14/18px icon). `x Small` correctly uses SemiBold (600) typography per the live
  data, `sm`/`md` use Medium (500) — a genuine, verified distinction, not an
  inconsistency to normalize away.
- `outline` prop — maps to the official `Outline` variant: filled (light
  background + light border) vs. outline (transparent background + strong border);
  text/icon color unchanged either way.
- `rounded` prop — maps to the official `Rounded` variant: `radius-sm` (4px,
  previously the *only* shape rendered, incorrectly, since the old implementation
  was hardcoded to the pill radius) vs. `radius-full` (pill).
- `iconEnd` prop — the official component has an independent `trailIcon` slot
  alongside the existing `leadIcon` (`iconStart`); `iconOnly` is now derived
  automatically (`children == null && (iconStart || iconEnd)`, mirroring `Button`'s
  established pattern) with a dev-mode accessible-name warning.
- `onColor` added to `TagVariant` — the official `Style=On-Color` mood for
  placement on a dark/colored surface; structurally distinct from the other 5
  moods (no border at all when filled, verified live).
- 29 new additive `--fads-sys-tag-*` tokens in `scripts/generate-tokens.mjs`, plus
  3 new **shared** typography-scale tokens (`--fads-ref-font-size-2xs`,
  `--fads-sys-typography-text-2xs`, `--fads-sys-typography-line-height-2xs`) for
  Tag's `x Small` size — shared by design, matching the existing `text-xs/sm/md/lg`
  pattern, not Tag-exclusive.

### Removed

- `variant="primary"` — **no official `Primary` style exists** on the live
  288-node component set (`Style` = `Neutral | Success | Error | Warning | Info |
  On-Color` only). Confirmed unused by any product page (`grep`-verified — only
  `Tag.tsx`/`Tag.stories.tsx`/`index.ts` referenced it); non-breaking removal under
  the "never invent variants" rule, same category as `Link`'s confirmed absence of
  a `Danger` mood.

### Fixed

- **Icon color vs. text color (Neutral)** — live-verified: Neutral's icon uses the
  shared `Icon/icon-default` token (`#161616`), genuinely different from its own
  text color (`#1f2a37`). The icon previously just inherited the tag's text
  `color` with no distinct token.
- **`aria-prohibited-attr` accessibility bug** (found during `npm test`, this
  pass) — a plain `<span>` has an implicit ARIA `generic` role, which prohibits
  naming attributes (`aria-label`/`aria-labelledby`) per the ARIA-in-HTML spec.
  `Tag.tsx` now sets `role="img"` on the root `<span>` when `iconOnly` is `true`.

Verified green: `typecheck` · `lint` (incl. `lint:css`) · `format:check` · `test`
(**318 passing**, 43 files — 1 test failure found and fixed mid-pass) ·
`tokens:validate` (297 generated tokens, 0 referenced missing) · `build` ·
`build-storybook`. **Tag: ✅ Approved** — `docs/COMPONENT_APPROVAL_MATRIX.md`,
`frontend/src/design-system/registry/figma-component-map.json`.

---

## [Frontend 0.5.8] — 2026-07-12 — Visual Compliance Correction: Link (CMP-06)

> Fixed ONLY the `Link` component (CMP-06) against the official Platforms Code Figma
> **Link** component set (file `cII2UMRzWj0rwKuMzWFqTU`, node `2508:25804` — 144
> variants: `rtl` × `state` × `style` × `size` × `inline`), verified live via the
> read-only Figma MCP tools. First component of Batch 01
> (`docs/DGA_COMPONENT_IMPLEMENTATION_QUEUE.md`). No other component, no page, touched.
> Full detail in `docs/FIGMA_LINK_SPECIFICATION.md` and
> `reports/VISUAL_COMPLIANCE/Link/VISUAL_COMPLIANCE_LINK.md`.

### Added

- `mood` prop (`LinkMood`: `'primary' | 'neutral' | 'onColor'`) — maps to the official
  `Style` variant. Confirmed the live component has **no `Danger` mood**; none was added.
- `size` prop (`LinkSize`: `'sm' | 'md'`) — maps to the official `Size` variant (14px/20px
  line-height/4px gap/16px icon vs. 16px/24px/8px/20px).
- `inline` prop — maps to the official `Inline` variant: `true` forces an always-visible
  underline (a link embedded in body text, WCAG 1.4.1); `false` (default) underlines only
  on hover/press (a standalone link).
- A real `:focus-visible` treatment — a 2px solid border around the link box, live-verified
  (previously absent; fell through to the browser default outline).
- 24 new additive `--fads-sys-link-*` tokens in `scripts/generate-tokens.mjs` (3 mood color
  chains × up to 6 states, focus-border colors/width, size-scoped gap/icon-size).

### Changed

- `Link.module.css` — replaced 5 generic/non-Link tokens
  (`--fads-sys-color-text-link`, `--fads-sys-color-link-hover`,
  `--fads-sys-color-primary-pressed`, `--fads-sys-color-link-visited`,
  `--fads-sys-color-text-disabled`) and generic `--fads-sys-control-gap` with the new
  Link-scoped, live-verified token set.
- `Link.stories.tsx` — added `Moods`, `Sizes`, `Inline`, `RTL` stories alongside the
  existing `Default`/`External`/`Disabled`/`InPageContext`.
- `Link.test.tsx` — added `mood`/`size`/`inline` data-attribute coverage and a
  disabled-state axe check.
- `primitives/Link/index.ts` and `primitives/index.ts` — export `LinkMood`/`LinkSize`
  alongside the existing `LinkProps`.

### Fixed / Flagged

- **Needs Confirmation, non-blocking:** the live Neutral+Visited state's node references
  the *Primary*-mood visited color (`#14573a`), not a distinct Neutral-visited token —
  disagreeing with `Light.tokens.json`'s own bulk `link-neutral-visited` value
  (`#4d5761`). Implemented to match the live component exactly, per the "no invented
  variants" rule; flagged for future confirmation, same category as prior components'
  scoped exceptions (Button's Destructive/OnColor restriction, etc.).

Verified green: `typecheck` · `lint` (incl. `lint:css`) · `format:check` · `test`
(**309 passing**, 43 files) · `tokens:validate` (254 generated tokens, 0 referenced
missing) · `build` · `build-storybook`. **Link: ✅ Approved** —
`docs/COMPONENT_APPROVAL_MATRIX.md`, `frontend/src/design-system/registry/figma-component-map.json`.

---

## [Frontend 0.5.8] — 2026-07-12 — Landing Page Rebuild: icon usage, dark-green footer, visual polish

> Rebuilt the existing Hackathon landing page (`HomePage.tsx`) — same 7 sections, same
> approved components, no new design-system component, no backend/auth/other-page work —
> to add meaningful icon usage (16 names, all verified against the current 237-icon
> registry, none invented), the official dark-green Footer variant, and visual-hierarchy
> polish (hero/about icon badges, card icon compositions, visible criterion numbering,
> a brand-tint Final CTA band). Full detail in `reports/LANDING_PAGE_REBUILD_REPORT.md`.

### Changed

- `frontend/src/content/hackathonLanding.ts` — added `IconName`-typed `icon` fields to
  `hero`, `about`, every Objectives/Criteria `LandingItem`, and the Final CTA's
  `LandingCta`s (`Required<LandingCta>` there, since those two always carry an icon) —
  an invalid icon name now fails `npm run typecheck` before it can ship.
- `frontend/src/pages/HomePage.tsx` — added a `<Icon>` import (direct file path, not the
  `@ds/primitives` barrel) and a small page-local `ItemCard` composition
  (`Card` + `Typography` + `Icon`, using `Card`'s `children` slot instead of its
  `title`/`description` props so the icon can render above the heading) shared by the
  Objectives and Evaluation Criteria grids; Evaluation Criteria cards additionally render
  a visible "01"–"06" numeral (`aria-hidden`, since the surrounding `<ol>` already gives
  assistive tech "N of 6" — the numeral is a **visual** requirement, because the shared
  `.cardGrid` class sets `list-style: none`, which strips the native `<ol>` marker).
  Final CTA's two `Button`s now pass `iconStart`. `Footer` now renders
  `background="darkGreen"` (the already-approved on-color variant from
  `reports/VISUAL_COMPLIANCE/Footer/VISUAL_COMPLIANCE_FOOTER.md` — `--fads-sys-footer-bg-oncolor:
#074d31`).
- `frontend/src/pages/HomePage.module.css` — new token-only classes for the hero/about
  icon badges, the card icon-badge composition, the criterion numeral, and a
  `--fads-ref-primary-25`-tinted Final CTA band (reusing the Hero's existing tint, not a
  new color) — no hardcoded values, logical properties throughout.
- `frontend/src/pages/HomePage.test.tsx` — 5 new tests: divider count (4), visible
  criterion numbering, RTL-by-default, "every icon is decorative," and "no icon on the
  page falls back to the missing-glyph placeholder." **301 tests passing** (up from 296),
  43 files.

### Known limitation (not fixed, see report §9)

- Using `Icon` at all still eagerly bundles the whole current 237-icon registry (a
  pre-existing, documented architecture limitation — `docs/ICON_LIBRARY.md` §9), so
  `HomePage`'s lazy route chunk grew to ~663 kB / ~185 kB gzip in `npm run build`. Scoped
  to this one route's chunk (the initial app shell is unchanged); fixing the underlying
  eager-bundling would mean changing `Icon`/`icons.ts`'s loading strategy, which is out of
  scope here per `CLAUDE.md`'s "do not modify Icon unless a genuine blocking bug is found."

### Verification

- ✅ `typecheck` · ✅ `lint` (incl. `lint:css`) · ✅ `format:check` · ✅ `test`
  (**301 passing**, 43 files) · ✅ `tokens:validate` (230 generated tokens, 0 of 199
  referenced missing) · ✅ `build` (chunk-size warning, not an error — see above) ·
  ✅ `build-storybook`.

---

## [Unreleased] — 2026-07-09 — Phase 6: Platforms Code icon library import (pilot batch)

> Read-only Figma MCP inspection of the official `PC-1.0-Icons` file found 4,372
> named icons across 60 categories (canvas `❖ ICONS`), each with up to 9 style
> variants. No batch-export tool exists on the read-only MCP surface, so — per an
> explicit scope decision confirmed with the user before spending the export
> budget — this pass imports one canonical style (`Stroke, Rounded`) and pilots
> the full pipeline against 4 small categories (49 icons) end-to-end before
> scaling to the remaining 56 categories in resumable batches. Full detail in
> `docs/ICON_LIBRARY.md` and `reports/ICON_IMPORT_REPORT.md`; `docs/QUESTIONS.md`
> Q8 updated to reflect partial resolution.

### Added

- `frontend/scripts/import-icons.mjs` — resumable, idempotent import pipeline:
  normalizes raw Figma SVG exports (`frontend/scripts/icon-raw/<category>/<icon>.svg`)
  by extracting the canonical style group and stripping Figma sheet chrome, swaps
  hardcoded ink fills for `currentColor`, writes clean assets to
  `src/assets/icons/<category>/<icon>.svg`, and generates the `icons.ts` registry
  (+ `IconName` literal type) and `icon-categories.ts` metadata. Detects
  cross-category name collisions and disambiguates (`${name}__${category}`)
  rather than silently overwriting — zero collisions found in this batch.
- 49 icons imported (Community Icons 9, Git 10, Shapes 15, Home 15).
- `Icon` primitive rebuilt around the new registry: `<Icon name="home-01" />`
  replaces the old `children`-glyph API (which had no consumers outside its own
  tests/stories, so no other component needed updating). New props: `title`
  (functional/accessible name), `decorative` (explicit override, independent of
  `title`), `mirrorInRTL` (opt-in directional-icon flip under `:dir(rtl)` — per-icon
  directionality isn't derivable from the Figma source), and a visible dashed
  fallback glyph + dev console warning for an unregistered `name`. `size`/`tone`
  (renamed `color`→`tone` per DC-04 — token-bound, not a free-form color) carry
  over unchanged from the prior wrapper.
- `Icon.test.tsx` (16 tests): rendering, decorative/functional a11y modes + axe,
  size/tone/RTL data hooks, full-registry lookup, missing-name fallback, category
  metadata integrity, and the duplicate-name disambiguation policy.
- `Icon.stories.tsx`: Default, Sizes, Colors, RTL, Decorative, Accessible,
  Category preview, and a client-side Searchable gallery — never renders the
  full registry on one page (documented as needing virtualization once the
  ~4,400-icon full library lands).
- `docs/ICON_LIBRARY.md`, `reports/ICON_IMPORT_REPORT.md`.

### Known limitations (see `docs/ICON_LIBRARY.md` §9)

- Only 49/4,372 icons and 4/60 categories imported so far; only one style variant
  (`Stroke, Rounded`) per icon.
- `icons.ts` eagerly bundles every registered icon's SVG via static `?raw`
  imports — fine at pilot scale, needs a dynamic-import/sprite strategy before
  the full library is imported (the Icon component's public API won't need to
  change when that happens).
- Two source-data anomalies flagged for the next batch: `Games/ski` uses
  non-standard variant-property naming; `Mathematics/Text` is a stray non-icon
  frame.

---

## [Frontend 0.5.7] — 2026-07-09 — Visual Compliance: new Divider primitive

> Built a new Divider component (no prior implementation existed) against the
> official Platforms Code Figma Divider component
> (`Sv0oWOS1SjWnwhQwdzRJIE`, node `18697:19412`, verified live via the Figma MCP
> read-only tools, exhaustively — all 8 variants sampled), following
> `docs/VISUAL_COMPLIANCE_WORKFLOW.md`. No other component, no page. Full detail in
> `docs/FIGMA_DIVIDER_SPECIFICATION.md` and
> `reports/VISUAL_COMPLIANCE/Divider/VISUAL_COMPLIANCE_DIVIDER.md`.

### Added

- `frontend/src/design-system/primitives/Divider/` — new primitive:
  `orientation` (`horizontal` | `vertical`, default `horizontal`) and `color`
  (`neutral` | `primary` | `white` | `alphaWhite`, default `neutral`) map 1:1 to the
  official `Line Type`/`Color` variant axes (the only two axes the real component
  has — no `Size`/`State`). `inset` and `fullWidth` are FADS-authored conveniences
  (no official Figma variant exists for either) built from the existing shared
  `--fads-sys-space-inset-md` token, not a new Figma-sourced value. `decorative`
  strips separator semantics for purely visual hairlines.
- Rendered as `<div role="separator">` (with `aria-orientation="vertical"` when
  vertical) rather than native `<hr>`, which has no standard vertical rendering —
  the standard WCAG/ARIA pattern for a non-`<hr>` separator.
- 5 new, additive `--fads-sys-divider-*` tokens (4 colors + thickness), all sourced
  from real Figma variables (`Light.Border.border-neutral-primary/-primary/-white`,
  `Light.Alpha.alpha-white-30`) except thickness (1px, live-verified frame geometry —
  no named Figma "border-width" variable exists for it).
- `Divider.stories.tsx` (Default, Inset, Vertical, DarkBackground, AllColors, RTL);
  `Divider.test.tsx` (18 tests: rendering, both orientations, all 4 colors,
  inset/fullWidth attributes, decorative escape hatch, RTL, axe × 3 render modes,
  token-provenance/no-hardcoding/no-cross-component-repointing/logical-properties
  checks matching the pattern established for Button/Card/Header/Footer).
- Exported from `frontend/src/design-system/primitives/index.ts` → public `@ds` API.

### Verified / documented, unchanged

- Vertical-orientation color values could not be read directly off the Vertical nodes
  (they render as opaque pre-baked image assets in `get_design_context`, unlike
  Horizontal's inspectable `background-color`) — applied by extension from the shared
  `Color` variant property instead, since `Color` and `Line Type` are independent
  axes on one component set. Flagged **Needs Confirmation**, non-blocking — same
  category of scoped exception as prior components.
- Verified green: `typecheck` · `lint` (incl. `lint:css`) · `format:check` ·
  `test` (**264 passing**, 43 files — 18 new, all in Divider) · `tokens:validate`
  (230 tokens, 0 of 199 referenced tokens missing) · `build` · `build-storybook`.
- Report: `reports/VISUAL_COMPLIANCE/Divider/VISUAL_COMPLIANCE_DIVIDER.md`. Matrix
  updated: `docs/COMPONENT_APPROVAL_MATRIX.md` (Divider now ✅ Approved). Token
  provenance recorded: `docs/TOKEN_MAPPING.md`.

---

## [Frontend 0.5.6] — 2026-07-09 — Visual Compliance Correction: Footer

> Fixed ONLY the Footer component (CMP-03) against the official Platforms Code Figma
> **Footer** (`Sv0oWOS1SjWnwhQwdzRJIE`, component set `30150:165937`, page
> `4205:18569`, verified live via the read-only Figma MCP tools), following
> `docs/VISUAL_COMPLIANCE_WORKFLOW.md`. No Button/Card/Header, no page. Full detail in
> `docs/FIGMA_FOOTER_SPECIFICATION.md` and
> `reports/VISUAL_COMPLIANCE/Footer/VISUAL_COMPLIANCE_FOOTER.md`.

### Fixed

- **Wrong component shape** — the pre-fix `Footer` was a minimal placeholder (free-form
  `children` + one flat link list) with none of the official regions. Rebuilt
  `Footer.tsx`/`Footer.module.css` around the official structure: an optional upper
  **grouped nav-links** region and a **legal** region.
- **Link color** — was `--fads-sys-color-text-link` (brand blue); official footer links
  are neutral `#384250` (`Link/link-neutral`).
- **Background** — was `--fads-sys-color-background-subtle`; official is
  `#f3f4f6` (`Background/background-neutral-100`).
- **Spacing / typography** — replaced placeholder inset/stack tokens with the official
  metrics: 1280px content max-width, 32px padding-inline, 48/40/24/16px region rhythm,
  text-md/Medium group labels with a `#d2d6db` underline, text-sm/Regular links, and a
  text-sm/**Semibold** legal caption.

### Added

- **Grouped nav-links region** — new `groups: FooterGroup[]` (each a bordered label +
  link list) + `groupsLabel`, and an optional `utilities` slot for social/accessibility
  icon buttons (icons pending the DGA icon library, Q8, so exposed as a caller slot
  rather than fabricated).
- **Legal region** — `copyright` (semibold caption), `secondaryLinks` (extra link list);
  the existing `links` now render as the official bottom **underlined** legal link list.
- **Configurable logo slot** — new `logos` prop. **No Financial Academy logo or
  organization name is hardcoded** — the Footer ships no default logo; `logos`/
  `copyright` are `undefined` unless the consumer supplies them (verified by a "ships no
  default branding" test).
- **`background="darkGreen"`** — the official dark-green (on-color) variant
  (`#074d31` bg, white text/links, `rgba(255,255,255,0.3)` label underline).
- New additive `--fads-sys-footer-*` tokens (10 colors + 12 geometry) in
  `scripts/generate-tokens.mjs`, all live-verified from Figma; the on-color border
  resolves its `alpha:0.3` via a new `getLightAlphaColor` helper. Catalogued in
  `docs/TOKEN_MAPPING.md`.
- `docs/FIGMA_FOOTER_SPECIFICATION.md` — the full official Footer specification.

### Backward compatibility

- `links`, `navLabel`, and `children` are retained with compatible semantics, so the
  landing page (`HomePage.tsx`, which passes exactly those three) works unchanged — **no
  page was touched.**

### Not implemented (documented, spec §10)

- Social/Accessibility icon buttons (caller `utilities` slot; DGA icons pending Q8),
  default logo artwork (branding stays caller-supplied), and a fixed per-breakpoint
  column grid (handled by flex-wrap + `min-width:180px`). All **Needs Confirmation**;
  non-blocking.

### Verified / documented, unchanged

- `Footer.module.css` references no `var(--fads-sys-button-*/-card-*/-header-*)` and
  repoints no shared token — confirmed by `Footer.test.tsx`.
- Verified green: `typecheck` · `lint` (incl. `lint:css`) · `test` (**246 passing**,
  42 files — 15 in Footer, up from 4) · `tokens:validate` (225 generated tokens, 0 of
  the referenced `--fads-*` tokens missing) · `build` · `build-storybook`.
- Report: `reports/VISUAL_COMPLIANCE/Footer/VISUAL_COMPLIANCE_FOOTER.md`. Matrix updated:
  `docs/COMPONENT_APPROVAL_MATRIX.md` (Footer now ✅ Approved).

---

## [Repo] — 2026-07-09 — Line-ending policy (.gitattributes)

> Repository hygiene only — no source was reformatted and no component changed.

### Added

- `.gitattributes` at the repository root with `* text=auto eol=lf`. Git now
  normalizes text files to LF in the index and working tree, so future commits
  can't introduce the CRLF noise a Windows checkout otherwise produces (the
  frontend `.prettierrc` requires `endOfLine: "lf"`). This is forward-looking:
  **the whole repo was deliberately not reformatted/renormalized** — only the
  policy for future commits was set, so the diff is a single new file.

### Notes

- This resolves the environment-only `npm run format:check` skew noted in the
  Frontend 0.5.5 (Header) entry below, where every file failed Prettier purely
  because the fresh checkout had CRLF terminators.

---

## [Frontend 0.5.5] — 2026-07-08 — Visual Compliance Correction: Header

> Fixed ONLY the Header component (CMP-01) against the official Platforms Code Figma
> **Nav Header** (`Sv0oWOS1SjWnwhQwdzRJIE`, component set `30150:148751`, page
> `429:130167`, verified live via the read-only Figma MCP tools), following
> `docs/VISUAL_COMPLIANCE_WORKFLOW.md`. No other component, no page. Full detail in
> `docs/FIGMA_HEADER_SPECIFICATION.md` and
> `reports/VISUAL_COMPLIANCE/Header/VISUAL_COMPLIANCE_HEADER.md`.

### Fixed

- **Wrong component shape** — the pre-fix `Header` was a generic title/subtitle/
  actions _content banner_ with a `Link`-primitive nav list; the official CMP-01 is a
  **Nav Header**: a configurable logo/brand slot + platform-name label on the leading
  side, an inline primary-nav list, and a trailing actions region, with a responsive
  toggle below 960px. Rebuilt `Header.tsx`/`Header.module.css` to that shape.
- **Nav items** — rebuilt from `Link`-primitive styling (link color + underline +
  external "↗" marker) into the official **Header Menu Item** tab: text-md 16px /
  **Medium 500** / line-height 24px / `#161616`, 72px tall, 16px inline / 8px block
  padding, 4px radius, with the full official state set — Hover `#f3f4f6`, Pressed
  `#e5e7eb`, Focused `2px #161616` border, Disabled `#9da4ae`.
- **Selected (current page)** — was bold + default text color; official is the green
  tab treatment (`#1b8354` background, white text, `#54c08a` selection-indicator bar),
  driven by `aria-current="page"`.
- **Header background** — was `--fads-sys-color-background-default` (an off-white
  neutral-25); official is pure white `Background/background-menu` (`#ffffff`).
- **Spacing / typography** — replaced placeholder `--fads-sys-space-*` values with the
  official 72px bar, 32px header padding-inline (16px at `<600`), 16px logo↔menu gap,
  and the text-md/500 label scale — all live-verified.
- **RTL** — logical properties throughout (no physical left/right, DC-23), so the
  layout mirrors via the document `dir` to match the official `RTL=True` variants.

### Added

- **Logo slot + configurable branding** — new `logo`, `logoLabel`, `logoHref`,
  `logoLinkLabel` props. **No Financial Academy logo or organization name is hardcoded**
  — the Header ships no default logo and no default name; both are `undefined` unless the
  consumer supplies them (verified by a "ships no default branding" test).
- **Responsive menu** — inline nav collapses behind a hamburger toggle below 960px
  (via `useMediaQuery`), revealing a stacked panel; controlled (`menuOpen`/
  `onMenuOpenChange`) or uncontrolled (`defaultMenuOpen`); the toggle is a real
  `<button>` with `aria-expanded` + `aria-controls` + `menuLabel`. Toggle glyph is a
  placeholder (☰/✕) pending the DGA icon library (Q8), matching the `Link` precedent.
- **Nav item options** — `disabled` (non-navigable, `aria-disabled`, no `href`) and
  `hasSubmenu` (trailing chevron) on `HeaderNavItem`.
- New additive `--fads-sys-header-*` tokens (13 colors + 14 geometry) in
  `scripts/generate-tokens.mjs`, all sourced from the live-verified Figma variables —
  catalogued in `docs/TOKEN_MAPPING.md`.
- `docs/FIGMA_HEADER_SPECIFICATION.md` — the full official Nav Header specification
  (hierarchy, variants, sizes, states, tokens, a11y/RTL/motion/responsive notes),
  pulled live via the Figma MCP read-only tools.

### Removed (breaking, in-scope)

- `title` / `subtitle` / `children` props — not part of the official Nav Header
  (they described the old banner shape). The landing page (`HomePage.tsx`) never used
  them, so no page changed; `nav` / `navLabel` / `actions` are unchanged and remain
  backward-compatible.

### Not implemented (documented as out of scope, spec §11)

- The **Nav Header Sub-Menu** (`30150:148877`) mega-dropdown and **Header Sub-menu Item**
  systems, **Header Action** `Icon position=Top` / `Icon only` variants and their
  selection indicator (actions are a caller-composed slot), and the pixel-exact tablet
  (600–959px) 3-zone geometry (approximated by the shared collapse-below-960 treatment).
  All flagged **Needs Confirmation**; non-blocking.

### Verified / documented, unchanged

- `Header.module.css` references **no** `var(--fads-sys-button-*)` and does not repoint
  any shared token (values that coincide with Button tokens were independently sourced
  from the same Figma primitive) — confirmed by `Header.test.tsx`.
- Verified green: `typecheck` · `lint` (incl. `lint:css`) · `test` (**235 passing**,
  42 files — 13 in Header, up from 4) · `tokens:validate` (203 generated tokens; 0 of
  173 referenced `--fads-*` tokens missing) · `build` · `build-storybook`.
  (`format:check` is clean for the touched files; the repo-wide run is skewed by
  CRLF line endings from this Windows checkout — an environment artifact, unrelated.)
- Report: `reports/VISUAL_COMPLIANCE/Header/VISUAL_COMPLIANCE_HEADER.md`. Matrix updated:
  `docs/COMPONENT_APPROVAL_MATRIX.md` (Header now ✅ Approved).

---

## [Frontend 0.5.4] — 2026-07-08 — Visual Compliance Correction: Card

> Fixed ONLY the Card component (CMP-07) against the official Platforms Code Figma
> Card component (`Sv0oWOS1SjWnwhQwdzRJIE`, node `30195:10358`, verified live via the
> Figma MCP read-only tools), following `docs/VISUAL_COMPLIANCE_WORKFLOW.md`. No other
> component, no page. Full detail in `docs/FIGMA_CARD_SPECIFICATION.md` and
> `reports/VISUAL_COMPLIANCE/Card/VISUAL_COMPLIANCE_CARD.md`.

### Fixed

- **Gap** — top-level sections (title/description block, `children`, `footer`) were
  flat siblings sharing one 8px gap; official is a 24px gap between sections with
  Title+Description grouped internally at 8px. Restructured `Card.tsx`/`.module.css`
  to match, via a new Card-specific `--fads-sys-card-gap` (24px) token (the 8px
  internal/16px padding values were already correct, reusing existing shared tokens).
- **Radius** — was `--fads-sys-radius-md` (8px); official is `radius-lg` (16px),
  uniform across every sampled Type/State/Effect. Repointed at the existing
  `--fads-sys-radius-lg`.
- **Background** — was the shared `--fads-sys-color-background-default` (resolves to
  an off-white neutral-25); official is pure white (`Background/background-card`,
  `#FFFFFF`). Added a new, additive `--fads-sys-card-bg` token rather than repointing
  the shared one (consumed by many other components).
- **Border** — was an unconditional 1px border on every Card; official has **no
  border** for the default (With Shadow/No Shadow) look — a border only appears for a
  new `Stroke` effect variant or the Focused state. Removed the unconditional border.
- **Shadow** — was the shared `--fads-sys-elevation-1` placeholder; official is a
  distinct two-layer effect style (`Shadows/shadow-md`:
  `0 2px 4px -2px rgba(16,24,40,.06)` + `0 4px 8px -2px rgba(16,24,40,.1)`). Added a
  new, additive `--fads-sys-card-shadow` token.
- **Typography** — Title was Semibold (600) with no explicit line-height/color;
  official is **Bold (700)**, 28px line-height, color `#1F2A37`. Description had no
  explicit size/line-height and used a **muted** color; official Description uses the
  **same `#1F2A37` as Title** (only smaller/lighter-weight, not a lighter shade). Added
  a new general-purpose `--fads-sys-typography-line-height-lg` (28px) token (matching
  the xs/sm/md tokens added during the Button pass) and a new `--fads-sys-card-text`
  token; both Title and Description now set these explicitly.
- **Disabled state** — was `opacity: var(--fads-sys-opacity-disabled)` (0.5, a real
  but non-Figma placeholder value); official Disabled is solid (background `#E5E7EB`,
  text `#9DA4AE`) with the **shadow removed entirely**. Replaced with new
  `--fads-sys-card-bg-disabled`/`-text-disabled` tokens, no opacity.
- **Actionable hover/focus** — previously only changed `cursor` on hover and relied on
  an unstyled browser default focus outline. Added real background changes on
  hover/focus (`--fads-sys-card-bg-hover`/`-bg-focused`, `#F9FAFB`) and a real 2px
  solid focus border (`--fads-sys-card-border-focus`, `#161616`), matching the
  official Selectable type's verified state colors — the closest analog, since a
  plain single-action clickable card has no direct official Type equivalent
  (Selectable is checkbox-multi-select; Expandable is accordion) — documented in the
  compliance report.

### Added

- New `effect?: 'shadow' | 'none' | 'stroke'` prop on `Card` (default `'shadow'`),
  matching the official `Effect` variant (With Shadow / No Shadow / Stroke) —
  previously undocumented in code despite being listed in `docs/COMPONENT_INVENTORY.md`
  CMP-07 since before this pass.
- `docs/FIGMA_CARD_SPECIFICATION.md` — full official Card specification pulled live
  via the Figma MCP (hierarchy, variants, sizes states, tokens, a11y/RTL/motion notes).

### Corrected finding from the Button pass

- The Button pass (0.5.3) assumed 9 CSS custom properties were entirely "dead"
  (undefined). Re-checking for Card revealed those same tokens are actually defined in
  a second, hand-written placeholder file (`tokens/tokens.css`) that `global.css` also
  imports — `tokens:check-coverage` confirms 0 missing references repo-wide. Card (and
  Button) had no dead-token bug; both were rendering with non-Figma **placeholder**
  values, not nothing. Recorded in `reports/VISUAL_COMPLIANCE/Card/VISUAL_COMPLIANCE_CARD.md`
  §0 to correct the record.

### Not implemented (documented as missing, out of scope this pass)

- Official `Selectable` (checkbox multi-select, persistent corner checkbox) and
  `Expandable` (accordion expand/collapse) types, and the Image/Featured-icon/Tags/
  Rating/dual-Action-button slots — would substantially expand Card's API and
  interaction model beyond a visual-compliance fix; not requested, not attempted.

### Verified / documented, unchanged

- `--fads-sys-elevation-1`, `--fads-sys-opacity-disabled`, `--fads-sys-color-background-default`,
  and `--fads-sys-radius-md` are consumed by ~20 other components (confirmed via grep
  before making any change) and were intentionally left untouched — all Card fixes use
  new, additive `--fads-sys-card-*` tokens instead.
- Verified green: `typecheck` · `lint` (incl. `lint:css`) · `format:check` ·
  `test` (**226 passing**, 42 files — 10 new, all in Card) · `tokens:validate`
  (226 tokens, 0 of 146 referenced tokens missing) · `build` · `build-storybook`.
- Report: `reports/VISUAL_COMPLIANCE/Card/VISUAL_COMPLIANCE_CARD.md`. Matrix updated:
  `docs/COMPONENT_APPROVAL_MATRIX.md` (Card now ✅ Approved).

---

## [Docs] — 2026-07-08 — Visual Compliance governance: workflow, approval matrix, per-component reports

> Establishes the repeatable, mandatory process for bringing every FADS component into
> visual compliance with the official Platforms Code Figma library, generalizing the
> approach used for Button (Frontend 0.5.3). No React components were changed, no
> landing page was touched, no other component was touched.

### Added

- `docs/VISUAL_COMPLIANCE_WORKFLOW.md` — the official 10-step process for every
  component: inspect the official Figma component via read-only MCP tools only,
  generate a Figma specification, compare against the React implementation, fix
  only that component, update Storybook, update tests, run full validation, mark
  approval status, and move to the next component only after approval. Includes a
  "Definition of Approved" checklist and the governing rules (one component at a
  time, read-only Figma access only, never invent, fix only the component in
  scope).
- `docs/COMPONENT_APPROVAL_MATRIX.md` — tracks each component's progress through
  the workflow (Figma node/source, spec, compliance report, implementation,
  Storybook, tests, accessibility, approval status). **Button is marked ✅
  Approved** (matching the completed 0.5.3 work); **Card, Header, Footer,
  Typography, Input (`TextInput`), Container, and Section are marked ⏳ Pending** —
  already built and tested, but not yet run through the Figma-verification
  workflow.
- `reports/VISUAL_COMPLIANCE/README.md` — documents the one-folder-per-component
  convention (`reports/VISUAL_COMPLIANCE/<Component>/VISUAL_COMPLIANCE_<COMPONENT>.md`)
  going forward.
- `reports/VISUAL_COMPLIANCE/Button/VISUAL_COMPLIANCE_BUTTON.md` — the canonical
  copy of Button's compliance report, relocated into the new per-component folder
  structure.

### Changed

- `reports/VISUAL_COMPLIANCE_BUTTON.md` — replaced with a short redirect stub
  pointing to the new location above. Kept in place (not deleted) because
  `Button.tsx`/`Button.module.css`/`Button.test.tsx` contain code comments citing
  this exact path, and this pass did not modify any React component file.

### Verification

- Documentation-only change; no build/test/lint impact. Existing Button
  cross-references (code comments in `Button.tsx`/`.module.css`/`.test.tsx`,
  `docs/FIGMA_BUTTON_SPECIFICATION.md`) still resolve via the redirect stub.

---

## [Frontend 0.5.3] — 2026-07-08 — Visual Compliance Correction: Button (live Figma MCP pass)

> Fixed ONLY the Button component (CMP-05), this time against a **live Figma MCP
> connection** to the official Platforms Code Button component set
> (`Sv0oWOS1SjWnwhQwdzRJIE`, node `407:510376`), superseding the 0.5.1 pass which
> only had access to exported token JSON. No other component, no page. Full detail
> in `docs/FIGMA_BUTTON_SPECIFICATION.md` and `reports/VISUAL_COMPLIANCE_BUTTON.md`.

### Fixed

- **Dead token references** — `Button.module.css` referenced 9 `--fads-sys-*` custom
  properties that didn't exist anywhere in `tokens/generated/tokens.css` (control
  height/padding-inline/radius, border-width thin/thick, opacity-disabled,
  background-hover/pressed, text-on-primary). None had CSS fallbacks, so the Button
  had no real height, padding, radius, border width, or disabled treatment at
  runtime. All 9 replaced with real, generated tokens; `tokens:check-coverage` now
  reports 0 missing references for the whole design system.
- **Sizing** — height/padding-inline/gap/icon-size verified live for sm/md/lg
  (24/8, 32/12, 40/16px; gap 4px; icons 16/20/24px) and added as new generated
  tokens — no longer "Pending Q3/Q20."
- **Typography** — the sm/md/lg scale was one rung too high (14/16/18px instead of
  the official 12/14/16px) and used Semibold (600) instead of the official Medium
  (500). Corrected; new per-size line-height tokens (18/20/24px) added.
- **Border radius** — repointed at the existing, already-correct `--fads-sys-radius-sm`
  (was pointing at the undefined `--fads-sys-control-radius`).
- **Selected state** — the fabricated `#14573a` "selected" color (real Figma data,
  but not what the live Button component actually applies) is no longer consumed;
  Selected now reuses each variant's own Pressed color, matching the one directly
  verified live behavior.
- **Disabled state** — replaced opacity-based dimming (a now-confirmed-undefined
  token) with the official flat, variant-agnostic solid colors.
- **Focused state** — implemented the official double-ring treatment (2px dark
  inner ring + 3px light ring offset 2px out) via `box-shadow`/`outline`; previously
  there was no dedicated focus styling at all.
- **`secondary` variant** — recolored to match the official Secondary-Outline style
  (neutral gray border + dark text) instead of an invented brand-primary-colored
  outline. Same prop name/value — no consumer breakage.
- **`tertiary` variant** — recolored to match the official Transparent style (dark
  text by default, background never fills even when pressed; text turns green only
  on Pressed) instead of a permanently brand-green ghost button.

### Added

- **`neutral`** and **`secondarySolid`** variants, matching the official Neutral
  (solid dark) and Secondary-Solid (light gray) styles.
- **`destructive`** and **`onColor`** boolean props — verified live only in
  combination with the Primary style, so implemented as full-variant overrides
  rather than fabricating untested combinations with the other variants.
- First-class **icon-only** support: fixed square sizing per size, plus a dev-only
  console warning when an icon-only button has no `aria-label`/`aria-labelledby`.
- `docs/FIGMA_BUTTON_SPECIFICATION.md` — the full official Button specification
  (hierarchy, variants, sizes, states, tokens, a11y/RTL/motion notes), pulled live
  via the Figma MCP read-only tools.

### Verified / documented, unchanged

- `destructive`/`onColor` combined with non-Primary variants, Secondary-Outline's
  and Transparent's hover state, and the exact RTL icon-mirroring mechanism were
  not sampled live — left as-is (or unchanged from Default) rather than invented;
  flagged **Needs Confirmation** in the report.
- Verified green: `typecheck` · `lint` (incl. `lint:css`) · `format:check` ·
  `test` (**216 passing**, 42 files — 17 new) · `tokens:validate` (215 tokens,
  0 of 136 referenced tokens missing) · `build` · `build-storybook`.

---

## [Frontend 0.5.2] — 2026-07-08 — Storybook Runtime Fix (dependency version skew)

> Storybook was failing at runtime with "Failed to fetch dynamically imported module"
> for the `entry-preview-docs` chunk. No component visuals, stories, or config content
> were changed — dependency versions and stale caches only.

### Fixed

- All `@storybook/*` packages (and `storybook` itself) were declared with a `^8.5.0`
  caret range in `package.json`, letting npm resolve each independently. The lockfile
  had drifted: `@storybook/addon-essentials`, `addon-interactions`, and `blocks` sat at
  `8.6.14` while `core`, `react`, `react-vite`, `test`, and `addon-a11y` were at `8.6.18`.
  Storybook's packages must all be the exact same version — this skew is what broke the
  `entry-preview-docs` dynamic import (the addon-essentials-bundled docs support didn't
  match the core/preview chunk it was trying to load).
- Pinned every `@storybook/*` package and `storybook` to the exact same version
  (`8.6.18`) in `package.json`, ran `npm install` to reconcile, and cleared the stale
  `node_modules/.cache/storybook` / `sb-vite-plugin-externals` caches (and the prior
  `storybook-static` build) that had been built against the mismatched versions.
- Verified: `npm run build-storybook` builds clean; `npm run storybook` serves both `/`
  and `/iframe.html` with `200` and no dynamic-import errors; `npm test` (199 passing,
  42 files) and `npm run lint` (incl. `lint:css`) unaffected.

---

## [Frontend 0.5.1] — 2026-07-08 — Visual Compliance Correction: Button

> Fixed ONLY the Button component (CMP-05) to match the official Platforms Code Figma
> Button. No other component, no page. Full detail in `reports/VISUAL_COMPLIANCE_BUTTON.md`.

### Fixed

- **Button `primary` variant** — background colors for Default/Hovered/Pressed/Selected/
  Focused were one reference-shade too light and had no distinct Selected color at all
  (silently reused Pressed). Discovered that `scripts/generate-tokens.mjs` never ingested
  `references/figma/foundations/Light.tokens.json`'s official per-component `Button` color
  tokens — only the generic primitive scale. Added 5 new, additive
  `--fads-sys-button-primary-bg-*` tokens generated from that official source, consumed
  only by `Button.module.css`; no other component's tokens changed.

### Verified / documented, unchanged

- Border radius, RTL, loading spinner, and disabled-state treatment were checked against
  available official token data and are already compliant or have no official source to
  compare against (Q3/Q20 sizing remains open).
- `secondary` (outline) and `tertiary` (ghost) variants have no verified official Figma
  equivalent (no outline token group exists; the only "transparent" tokens are on-color
  hero washes) — left unchanged and flagged **Needs Confirmation**, per "do not invent
  variants."
- Verified green: `typecheck` · `lint` (incl. `lint:css`) · `format:check` ·
  `test` (**199 passing**, 42 files) · `tokens:validate` · `build-storybook`.

---

## [Frontend 0.5.0] — 2026-07-08 — Hackathon Landing Page (Phase 6)

> First product page. Built the 7-section Hackathon landing page consuming FADS as
> approved in Phase 5.6 — no new design-system components, no backend, no auth, no
> other product screens. Full detail in `reports/LANDING_PAGE_IMPLEMENTATION_REPORT.md`.

### Added

- `frontend/src/pages/HomePage.tsx` — Header, Hero, About, Objectives (6 cards),
  Evaluation Criteria (6 cards), Final CTA, Footer, composed entirely from existing
  `@ds` primitives/layout/composite/shell components.
- `frontend/src/content/hackathon.ts` — single source of truth for all landing-page
  copy and CTA destinations (Arabic official, English best-effort translation),
  so future content edits never touch the React component.
- `HomePage.test.tsx` (6 tests): single-`<h1>` check, header/footer landmarks, CTA
  presence, objectives/criteria list counts, axe a11y check.

### Changed

- `frontend/src/app/router/routes.tsx` — index route (`/`) now renders `HomePage`
  instead of the `FoundationHome` placeholder.
- `frontend/index.html` — `<title>` and meta description updated to the Hackathon page.
- `frontend/src/app/router/router.test.tsx` — updated for the real page (name, timeout).

### Removed

- `frontend/src/pages/FoundationHome.tsx` and its `foundation.*` i18n keys — superseded.

### Notes

- CTAs ("قدم ابتكارك" / "إدارة طلباتي") navigate via `window.location.assign`, not a
  router `<Link>` or a real `<a href>` — Submit/Manage pages don't exist yet; this is
  an inert placeholder the next team swaps for real navigation/API calls.
- Verified green: `typecheck` · `lint` (incl. `lint:css`) · `format:check` ·
  `test` (**196 passing**, 42 files) · `tokens:validate` · `build` · `build-storybook`.

---

## [Frontend 0.4.2] — 2026-07-08 — Design System Hardening (Phase 5.6) — APPROVED for Hackathon landing page

> Closes exactly the 9 critical/high-priority items `reports/DESIGN_SYSTEM_REVIEW.md` flagged
> as blocking. No new components, no pages. Convergence/hardening only — see
> `reports/DESIGN_SYSTEM_HARDENING_REPORT.md` for full detail on every item.

### Fixed

- **Modal** — background content isolation: every other direct child of `document.body` is
  now marked `inert` while the Modal is open (WCAG 4.1.2), restored on close. A new shared
  `data-fads-portal` marker (added to Modal's own scrim, `ToastProvider`'s viewport, and
  `DatePicker`'s popover) is skipped by this logic so other FADS overlays are never
  accidentally disabled.
- **DatePicker** — `visibleMonth`/`focusedDate` now resync via a `useEffect` whenever the
  controlled `value` prop changes externally (previously set only once via `useState`'s
  initializer). The popover is now rendered through a `document.body` portal, positioned
  from the trigger's `getBoundingClientRect()` and re-measured on open/resize/scroll —
  resolving the sticky-header/drawer clipping bug the non-portaled version had; z-index
  moved from `--fads-sys-z-dropdown` to `--fads-sys-z-drawer`. The outside-click-to-close
  handler now also recognizes clicks inside the (now-portaled) popover.
- **ToastProvider** — nesting guard: mounting a `ToastProvider` inside another now renders
  only `children` (no duplicate context/portal/viewport), with a dev-only `console.error`
  explaining the misconfiguration — closes the "duplicate empty landmark" defect.

### Changed

- **Alert / Notification / Toast** — extracted the duplicated title/message/dismiss-button
  structure into a new internal, unexported `composite/_shared/NoticeBody.tsx`. Each
  component keeps its own `.module.css` and tone/token choices for its own surface; only
  the structural duplication (which had already started drifting) was collapsed.
- **`Modal.closeLabel`** renamed to **`dismissLabel`**, aligning with the convention
  `Alert`/`Notification`/`Toast` already used. `FileUploader.removeLabel` was deliberately
  **kept distinct** (it names removing one file from a list, not dismissing a whole
  surface) and `NavDrawer.toggleLabel` was already correctly distinct — neither was merged.
- **`RadioGroup.onChange`** renamed to **`onValueChange`** (`(value: string) => void`),
  matching the `Switch.onCheckedChange` precedent and removing the name collision with
  every sibling input's native-DOM `onChange: (e: ChangeEvent) => void`. `Radio`'s own
  native `onChange` passthrough is unaffected.

### Added

- `Field.test.tsx` (8 tests) and `Field.stories.tsx` (5 stories) — the shared
  label/helper/error-wiring primitive consumed by `TextInput`/`Textarea`/`Select` had zero
  of either before this session.
- `scripts/verify-css-rules.mjs` (`npm run lint:css`, folded into `npm run lint` so the
  existing CI "Lint" step covers it with no separate CI change) — a small, dependency-free
  script (matching the `verify-tokens.mjs` precedent) that bans hard-coded hex/`rgb()`
  color literals (DC-04) and physical-direction properties (DC-23) in component
  stylesheets. Token-definition files are excluded (raw values are their entire purpose).
  Zero violations found against the existing codebase — this makes
  `docs/DESIGN_CONSTRAINTS.md` §6's lint-enforcement claim actually true for those two
  rules (it previously was not, per the Phase 5D review).
- 15 new tests total (2 Modal, 4 DatePicker, 1 Toast, 8 Field); existing DatePicker a11y
  test fixed to scan `baseElement` instead of `container` (the popover is no longer a
  descendant of `container` now that it's portaled, so the old test had silently stopped
  scanning it).

### Verification

- ✅ `typecheck` · ✅ `lint` (0 ESLint problems + 0 CSS-rule violations) · ✅ `format:check` ·
  ✅ `test` (**190 tests**, 41 files, up from 175/40) · ✅ `tokens:validate` (0 of 102
  referenced tokens missing) · ✅ `build` · ✅ `build-storybook`.

### Not done (deliberately out of scope — see `reports/DESIGN_SYSTEM_HARDENING_REPORT.md` §3/§7)

- No packaging/distribution model (Q24, still open) — a scope/business decision, not a
  code defect, and irrelevant to a landing page built inside this same repository.
- No ESLint rule for DC-24 (hard-coded UI strings) — the existing convention (English
  defaults, always overridable) is already followed; not required for landing-page
  approval.
- 7 pre-existing minor CSS magic-number values, icon-wrapper/disabled-CSS duplication in
  `Button`/`Link`/`Tag`/form controls, `Checkbox`/`Switch` error-state support,
  `ErrorState`'s focus-move, `FileUploader`'s drag-flicker, `Table` virtualization — none
  were in this hardening's fix list and none affect the landing page's actual component
  needs.

### Decision

**APPROVED for Hackathon landing-page implementation** — narrower in scope than the
Phase 5D review's "production-ready, multi-product package" bar, which remains
**NOT APPROVED** and unchanged (see `reports/DESIGN_SYSTEM_REVIEW.md`'s superseding-decision
note). Visual fidelity remains "pending final DGA token values" (Q3/Q20) regardless of this
approval — no pixel-perfect DGA compliance is claimed.

### Changed (docs)

- Updated `docs/PROJECT_STATUS.md`, `docs/PROJECT_READINESS_REPORT.md`, and
  `reports/DESIGN_SYSTEM_REVIEW.md` (inline ✅ RESOLVED annotations + a superseding-decision
  note, original findings left intact as a point-in-time record).

---

## [Frontend 0.4.1] — 2026-07-08 — Production Readiness Review (Phase 5D) — NOT APPROVED, one critical fix applied

> Independent, architect-style audit of the entire design system: architecture, public API,
> folder structure, component consistency, accessibility, RTL, token usage, Storybook,
> testing, DX, maintainability, scalability, performance, bundle size, tree-shaking, type
> safety, documentation, and governance. **No new components were built.** Full findings,
> scorecard, and decision in `reports/DESIGN_SYSTEM_REVIEW.md`.

### Fixed (the one critical issue found; everything else in the review was reported, not fixed)

- **Token pipeline had two competing, unsynchronized files, and only one was ever loaded.**
  `design-system/tokens/global.css` imported `./generated/tokens.css` only.
  `design-system/tokens/tokens.css` (hand-written) — which still held every
  component/interactive/layout placeholder token added across Phases 5A–5C (control
  heights, disabled opacity, elevation/shadow, modal overlay color, field colors, icon
  sizes, selection/switch sizing, container widths, table colors) — was never imported
  anywhere and was dead code. Verified: **39 of 103** `--fads-*` custom properties
  referenced by component stylesheets resolved to nothing at runtime, with **zero** CSS
  fallback values anywhere to soften it. `generated/tokens.css` also independently
  referenced `var(--fads-ref-neutral-0)` in 5 places despite never defining it (the
  adopted Figma neutral scale starts at shade `25`, not `0`).
  - `scripts/generate-tokens.mjs` — the 5 dangling `--fads-ref-neutral-0` references now
    point to `--fads-ref-neutral-25` (the actual lightest Figma-adopted shade — not an
    invented value).
  - `design-system/tokens/tokens.css` — trimmed to hold only the additive placeholder
    tokens the generator doesn't cover; its stale "sourced from Figma" header (never true
    of this file's own content) is corrected to describe its actual, narrower role.
  - `design-system/tokens/global.css` — now imports `./generated/tokens.css` **then**
    `./tokens.css`, so every token referenced by a component resolves.
  - New `scripts/verify-tokens.mjs` + `npm run tokens:check-coverage`: statically diffs
    every `var(--fads-*)` reference in `.module.css` files against what's actually
    defined and fails on any gap. Wired into `tokens:validate` and now a required step in
    `.github/workflows/ci.yml` — this exact class of regression can no longer ship
    silently.

### Verification

- ✅ `typecheck` · ✅ `lint` (0 problems) · ✅ `format:check` · ✅ `test`
  (**175 tests**, 40 files, unchanged) · ✅ `tokens:validate` (now includes the coverage
  gate: 0 of 103 referenced tokens missing) · ✅ `build` (CSS bundle correctly grew from
  6.79 kB to 9.52 kB gzip — the previously-orphaned tokens are now actually shipping) ·
  ✅ `build-storybook`.

### Reported, not fixed (see `reports/DESIGN_SYSTEM_REVIEW.md` for full detail)

- No packaging/distribution model — the design system cannot be consumed by a second
  product without copying source; tracked as the project's own open **Q24**.
- No stylelint/CSS-lint tool anywhere — DC-03/DC-04/DC-06/DC-09/DC-23 have zero automated
  enforcement; no ESLint rule bans hard-coded UI strings (DC-24) either.
- Alert / Notification / Toast are ~90% copy-pasted, with the copy already drifting
  (three different background-token choices for the same visual concept).
- Naming drift: `dismissLabel`/`closeLabel`/`removeLabel`/`toggleLabel` for the same
  "small icon-only button's accessible label" concept; `RadioGroup.onChange` collides in
  signature with every sibling input's native-DOM `onChange`; `label` means three
  different things across `Icon`/form-controls/`RadioGroup`'s `legend`/`Avatar`'s `name`.
- Real bugs: `Modal` has no `inert`/`aria-hidden` isolation of background content (WCAG
  4.1.2 gap); `DatePicker` doesn't resync `visibleMonth`/`focusedDate` when `value`
  changes externally, and its popover isn't portaled (can render clipped behind sticky
  headers/drawers, unlike `Modal`/`Toast`); `ToastProvider` nested inside another produces
  a duplicate, permanently-empty ARIA landmark; `FileUploader`'s drag-active state can
  flicker on nested drag targets; `ErrorState`'s own JSDoc cites a "focus → alert"
  requirement that isn't implemented.
- `Field` (the shared a11y-wiring primitive for TextInput/Textarea/Select) has zero tests
  and zero Storybook stories — the highest-leverage single gap in the primitives layer.
- Duplicated CSS: disabled-opacity rule repeated verbatim in 5 components; decorative-icon
  wrapper markup repeated in 5 places across `Button`/`Link`/`Tag`, none composing the
  `Icon` primitive built specifically to enforce icon-sizing rules.
- `Table` has no row memoization or virtualization.

### Decision

**NOT APPROVED.** Convergence/hardening work on the existing 35 components, not a
rebuild — see `reports/DESIGN_SYSTEM_REVIEW.md` §11–14 for the prioritized refactor list
and re-approval criteria.

---

## [Frontend 0.4.0] — 2026-07-08 — Design System: second composite batch complete (Phase 5C)

> Q3/Q20 remain open. All styling consumes placeholder tokens only — no
> hard-coded visual values, no legacy GOV.SA values, **no pixel-perfect DGA claim.**

### Added — composite (`frontend/src/design-system/composite/`)

- **Loading** (CMP-31, Secondary) — `spinner`/`skeleton` variants, `role="status"`/`aria-live="polite"`/`aria-busy`.
- **Pagination** (CMP-28, Secondary) — windowed page list (first/last/current ±1, ellipsis for gaps), `nav` landmark, `aria-current="page"`.
- **Steps** (CMP-21, Secondary) — ordered step progression, `aria-current="step"`; navigation via step buttons only when `onStepClick` is given (never free-jump, per `INTERACTION_SPECIFICATION.md` §4).
- **EmptyState** (FADS-authored — not a numbered DGA `CMP-*`) — icon + title + description + action composition for "no results" surfaces (`SCREEN_SPECIFICATIONS.md`).
- **ErrorState** (FADS-authored, composes `Alert`/CMP-23 + `Button`) — the standard "failed to load, data preserved" surface (`INTERACTION_SPECIFICATION.md` §9), reusing Inline Alert rather than inventing a new alert shape.
- **Toast + ToastProvider/useToast** (CMP-22, `PAT-06`) — transient, auto-dismissing (5s default) notification queue rendered via a `document.body` portal; pauses on hover/focus; stacks; `role="status"`/`aria-live="polite"`. Distinct from the `Alert`/`Notification` built in the prior batch.
- **Modal** (CMP-25) — confirmation/feedback dialog (never large data entry, DC-13); focus trap + restore, `Esc` always closes, scrim click closes unless `dismissOnScrimClick={false}` (for destructive confirmations), `aria-modal` + labelled.
- **Table** (CMP-27) — semantic `<table>` with required `caption` + `scope="col"` headers; sortable columns expose `aria-sort`; `render` is required per column (no unsafe row-key indexing); optional `emptyState` slot renders in place of rows.
- **FileUploader** (CMP-20) — drag-and-drop with a required click/keyboard alternative (WCAG 2.5.7) via a hidden input triggered by a `Browse` button; per-file status list (`aria-live="polite"`) with progress/error/remove; upload transfer itself is owned by the caller.
- **DatePicker** (CMP-19, Primary conditional) — trigger + popover calendar grid (WAI-ARIA APG "Date Picker Dialog"); **RTL-aware** Arrow keys (day/week), `PageUp`/`PageDown` (month), `Esc` closes with focus restored to the trigger; no external date library.

### Added — shared

- `hooks/useFocusTrap` now also **restores focus to whatever was focused before activation** once `active` becomes false (previously only trapped `Tab`/`Shift+Tab`) — closes the "on close, restore focus to the trigger" rule (`INTERACTION_SPECIFICATION.md` §3) for `NavDrawer`, and is reused as-is by `Modal` and `DatePicker`'s popover.

### Fixed (found while building this batch)

- An empty-table `<ul role="status">` pattern (first draft of `FileUploader`'s file list) was reverted in favor of a plain `<ul aria-live="polite">` — `role="status"` is not an allowed override on `<ul>` (axe `aria-allowed-role`), and it also broke the list's own `listitem`/`list` structure for its children.
- `DatePicker`'s weekday-header cells were briefly marked `aria-hidden="true"`, which strips required `row` children per axe's `aria-required-children` — removed (they carry real structural information, not decorative).
- `Table`'s sortable-column pattern initially considered `role="button"`-in-`article"`-style native indexing; landed on requiring `render` per column instead, avoiding any unsafe property access.

### Verification

- ✅ `typecheck` · ✅ `lint` (0 problems) · ✅ `format:check` · ✅ `test`
  (**175 tests**, 40 files) · ✅ `tokens:validate` · ✅ `build` · ✅ `build-storybook`.

### Not done (intentionally, logged as remaining work)

- Composite: Content Switcher (CMP-10), Menu (CMP-11), Rating (CMP-29).
- Shell: Search (CMP-33, ⚠Q10) and Digital Stamp (CMP-32, ⚠Q5) — both still blocked on open questions.
- Patterns: PAT-01…PAT-06 — not started; depend on the now-larger composite/shell surface per `COMPONENT_INVENTORY.md §8` build order.
- Design-system component count: **25 → 35** (14 primitives + 2 layout + 15 composite + 4 shell).

### Changed

- Synced `docs/COMPONENT_INVENTORY.md` §6a/§7, `docs/PROJECT_STATUS.md`,
  `docs/PROJECT_READINESS_REPORT.md`, `reports/COMPONENT_COVERAGE_REPORT.md`,
  `frontend/src/design-system/README.md` (component usage table), and
  `frontend/package.json` version.

---

## [Frontend 0.3.2] — 2026-07-08 — Design System: first composite + shell batch complete (Phase 5B)

> Q3/Q20 remain open. All styling consumes placeholder tokens only — no
> hard-coded visual values, no legacy GOV.SA values, **no pixel-perfect DGA claim.**

### Context

At the start of this session, 5 composite + 4 shell components existed in
`frontend/src/design-system/` as unfinished, partially broken scaffolding:
`typecheck` failed (5 errors), `lint` failed (5 errors), all 4 shell components
imported `.module.css` files that didn't exist on disk (masked only because
nothing imported `design-system/shell` or `design-system/composite` yet), zero
`.test.tsx`/`.stories.tsx` existed for any of the 9, and none were re-exported
from the public `@ds` API. This release finishes that batch rather than
rebuilding it.

### Fixed

- **Alert / Notification / Header / NavDrawer** — `title` prop collided with
  the native HTML `title` attribute inherited from `ComponentPropsWithoutRef`
  (TS2430); now `Omit<..., 'title'>`.
- **Card** — `disabled` did not actually block pointer clicks on an
  `actionable` card (only `keydown` was gated); fixed. Also fixed an
  `aria-allowed-role` a11y violation: an actionable card rendered
  `role="button"` on an `<article>`, which is not an allowed role override for
  that element — it now renders a plain `<div>` when `actionable` and no
  explicit `as` is given.
- **Tabs** — Arrow-key navigation was **not RTL-aware** (`ArrowRight` always
  moved forward regardless of document direction), contrary to
  `INTERACTION_SPECIFICATION.md`. Now uses `useIsRtl()` so the key always
  matches the visual direction of travel. Also fixed: roving tabindex didn't
  move actual DOM focus after Arrow/Home/End (selection changed but focus
  stayed behind); disabled tabs are now skipped during Arrow navigation; an
  unused `index` var (lint) was removed.
- **Breadcrumbs / Footer** — list-item `key` templates stringified a
  `ReactNode` label (`no-base-to-string` lint error); switched to
  index-based keys.
- **Breadcrumbs, Footer, Header, NavDrawer** — the 4 missing `.module.css`
  files were created (token-only, logical properties, no hard-coded values).

### Added

- **Composite:** finished Card (CMP-07), Accordion (CMP-08), Tabs (CMP-09),
  Alert (CMP-23 Inline Alert), Notification (CMP-24 Banner) — each with
  Storybook stories (all states) and unit + axe tests.
- **Shell:** finished Header (CMP-01 — title/subtitle/actions banner + an
  optional primary-nav `nav` list built on the existing `Link` primitive, so
  external-link marking and `aria-current` selection come for free), Footer
  (CMP-03), Breadcrumbs (CMP-04), NavDrawer (CMP-02 — added a toggle button,
  `Esc`-to-close, and a `Tab`/`Shift+Tab` focus trap via a new `useFocusTrap`
  hook, plus `inert` while closed so off-canvas content is unreachable by
  keyboard/AT).
- `hooks/useFocusTrap` — reusable focus-trap hook (exported from `hooks/`).
- `design-system/index.ts` now re-exports `./composite` and `./shell` — all 9
  components are reachable from the public `@ds` import path for the first
  time.
- Replaced hardcoded, non-overridable Arabic strings (Alert/Notification
  dismiss button, Footer/NavDrawer/Breadcrumbs landmark labels) with props
  that default to English and can be localized by the caller, matching the
  existing `label`/`toggleLabel` convention used elsewhere in the design system.
- Design-system component count: **16 → 25** (14 primitives + 2 layout + 5
  composite + 4 shell).

### Verification

- ✅ `typecheck` · ✅ `lint` (0 problems) · ✅ `format:check` · ✅ `test`
  (**116 tests**, 30 files) · ✅ `tokens:validate` · ✅ `build` · ✅ `build-storybook`.
- Also fixed 3 pre-existing unrelated `lint` errors in `tokens/tokens.test.ts`
  (unsafe `any` from an untyped `JSON.parse`) while getting `lint` fully green.

### Not done (intentionally, logged as remaining work)

- **Toast (CMP-22)** — transient auto-dismiss/stacking notification with a
  `ToastProvider` — is a distinct component from Alert/Notification and was
  not built this batch; remains pending.
- Remaining composite (10), shell (2 — Search/CMP-33 and Digital Stamp/CMP-32,
  both blocked on Q10/Q5), and all 6 patterns.
- Header (CMP-01) implements a title/subtitle/actions/nav banner, not a full
  multi-level site navigation header; flagged as a gap in
  `reports/COMPONENT_COVERAGE_REPORT.md`.

### Changed

- Synced `docs/COMPONENT_INVENTORY.md` §6a/§7, `docs/PROJECT_STATUS.md`,
  `docs/PROJECT_READINESS_REPORT.md`, `TASK.md` (was stale — described a
  "Planning" phase where implementation was "NOT allowed," contradicting the
  actual repo state).
- Added `reports/COMPONENT_COVERAGE_REPORT.md`.

---

## [Frontend 0.3.1] — 2026-07-08 — Token generation pipeline added

### Added

- Token generation pipeline from [references/figma/foundations/Values.tokens.json](references/figma/foundations/Values.tokens.json) into [frontend/src/design-system/tokens/generated](frontend/src/design-system/tokens/generated).
- npm scripts `tokens:generate` and `tokens:validate` in [frontend/package.json](frontend/package.json).
- Generated CSS, TypeScript, and JSON artifacts for the design-system token layer.

### Changed

- [frontend/src/design-system/tokens/global.css](frontend/src/design-system/tokens/global.css) now imports the generated token stylesheet.
- [frontend/src/design-system/tokens/tokens.test.ts](frontend/src/design-system/tokens/tokens.test.ts) now verifies the generated token artifacts.

### Verification

- ✅ `npm run tokens:generate`
- ✅ `npm run tokens:validate`

---

## [Frontend 0.3.0] — 2026-07-08 — Design System: primitives + layout complete (Phase 5A)

> Q3/Q20 remain open. All styling consumes placeholder tokens only — no
> hard-coded visual values, no legacy GOV.SA values, **no pixel-perfect DGA claim.**

### Added — components (`frontend/src/design-system/`)

- **Primitives:** `Typography` (Display/Text variants, polymorphic), `Icon`
  (size caps, tone, decorative/functional), `Select` (native, options/placeholder),
  `Checkbox` (checked/unchecked/indeterminate), `Radio` + `RadioGroup`
  (fieldset/legend, controlled/uncontrolled), `Switch` (role=switch, RTL thumb),
  `Tooltip` (RTL placement, focus/hover, Escape — WCAG 1.4.13), `Avatar`
  (image/initials/icon + fallback).
- **Layout:** `Container` (page/prose/form/full), `Section` (rhythm band + backgrounds).
- Total design-system components now **16** (with the batch-1 primitives).
- `utils/mergeRefs` helper (indeterminate checkbox ref forwarding).

### Added — tokens

- Phase-5A **placeholder tokens**: container widths, icon sizes (≤24 / Featured),
  selection-control geometry, overlay/scrim, surfaces, table. Documented in
  `DESIGN_TOKENS.md §10`; tracked with **Q33**.

### Per-component coverage

TypeScript props · RTL (logical properties) · keyboard + visible focus · disabled
state · error state (where applicable) · Storybook story · unit + axe tests · JSDoc
usage. `color-contrast` deferred to a real browser (jsdom limitation, post-Q3).

### Changed

- `design-system/README.md` — component usage table.
- Synced `COMPONENT_INVENTORY.md §6a`, `DESIGN_TOKENS.md §10`, `QUESTIONS.md` (Q33),
  `PROJECT_STATUS.md`, `PROJECT_READINESS_REPORT.md`.

### Verification

- ✅ `typecheck` · ✅ `lint` (0 problems) · ✅ `format:check` · ✅ `test`
  (**67 tests**, 20 files) · ✅ `build` · ✅ `build-storybook`.

### Remaining (next milestones)

- Composite (15), Shell (6), Patterns (6) — see `COMPONENT_INVENTORY.md §6a` and
  `reports/DESIGN_SYSTEM_IMPLEMENTATION_REPORT.md`.

---

## [Docs] — 2026-07-08 — GOV-SA legacy repository review

### Context

The repository `GOV-SA/design-system-gov.sa` was added as an authoritative reference. A full analysis established it is the **legacy "GOV.SA Design System"** (v0.0.1, last pushed Dec 2022): Bootstrap 4 + jQuery + SCSS/BEM, TheSans/Noto fonts, **no** token JSON / Style Dictionary / CSS-variable tokens / Tailwind / Storybook / React / Figma tokens.

### Decision

- **Classified as a legacy reference only** — **not** the DGA Platforms Code v1.0 token source, and **not** a source of reusable components.
- **Q3 (token values) and Q20 (acquisition route) remain 🔴 OPEN** — the repo does not close them. Official Platforms Code v1.0 values must still come from the official Figma, website, or an official token package.
- **Placeholder tokens retained**; no legacy values copied into FADS; **no pixel-perfect DGA compliance claim.**
- Permitted uses: historical structure reference, Sass/CSS patterns, behavior comparison, gap identification.

### Added

- `docs/DGA_REPOSITORY_ANALYSIS.md` — full capability inventory + evidence + verdict.
- `docs/LEGACY_REFERENCE_DECISION.md` — ADR (legacy reference, not token source; source hierarchy).
- `docs/TOKEN_SOURCE_STRATEGY.md` — acceptable/unacceptable token sources, placeholder policy, integration workflow.
- `docs/COMPONENT_GAP_ANALYSIS.md` — legacy ↔ FADS component mapping, gaps, non-reuse decision.

### Changed

- `QUESTIONS.md` — reaffirmed Q3/Q20 open; added **Q34** (legacy repo scope + GPL-3.0); index → 34.
- `PROJECT_READINESS_REPORT.md` — phase log + R5 risk formally mitigated.
- `DESIGN_TOKENS.md`, `COMPONENT_INVENTORY.md`, `DESIGN_SYSTEM_SPECIFICATION.md` — legacy-boundary notes.
- Introduced reference key **`[LEGACY]`** (ranked above community `[S5]/[S6]`, below Platforms Code `[S1]/[S2]/[S3]`).

### Notes

- No code changed. Phase 5 continues on placeholder tokens only. `frontend` validation remains green (34 tests).

---

## [Frontend 0.2.0] — 2026-07-08 — Component Implementation (Phase 5, batch 1: primitives)

> Acknowledged up front: **Q3 (official DGA token values) and Q20 (acquisition
> route) remain open.** All components consume the placeholder token layer only —
> no hard-coded visual values. **Visual fidelity is "Pending final DGA token
> values"; no pixel-perfect DGA compliance is claimed.**

### Added — FADS primitives (`frontend/src/design-system/primitives/`)

- **Button** (CMP-05) — variants (primary/secondary/tertiary), sizes, `loading`
  (aria-busy), `selected` (aria-pressed), `disabled`, icon slots; full DGA state set.
- **Link** (CMP-06) — external handling (target/rel + **placeholder** external
  marker pending the DGA icon library, Q8), disabled (non-navigable), visited state.
- **Tag** (CMP-26) — `neutral`/`primary` (category) vs `success`/`error`/`warning`/
  `information` (status only); DC-05 encoded in the API; meaning via text, not color.
- **TextInput** (CMP-13) & **Textarea** (CMP-14) — label/helper/error, DGA states
  (default/hover/focus/read-only/disabled/invalid).
- **Field** (internal) — shared label + helper + error wrapper wiring
  `aria-describedby` / `aria-invalid` / `aria-required` and `role="alert"` errors.
- Each component ships **Storybook stories** (all states, Arabic/RTL) and **unit +
  axe accessibility tests**.
- Barrels + `@ds` now re-export the primitives.

### Added — tokens

- Component/interactive **placeholder tokens** (interaction states, disabled,
  form-field, control sizing, border widths, elevation) in `tokens.css`; every one
  is clearly marked NON-DGA and documented (`DESIGN_TOKENS.md §10`, **Q33**).

### Changed

- `test-utils`: `expectNoA11yViolations` disables `color-contrast` (jsdom can't
  compute contrast; deferred to a real browser after Q3). Structural a11y fully checked.
- Styling approach realized as **CSS Modules + `composes`** with logical properties
  (Q28 default) — zero runtime, token-only.
- Synced `docs/COMPONENT_INVENTORY.md` (§6a status), `docs/DESIGN_TOKENS.md`,
  `docs/QUESTIONS.md` (Q33), `docs/PROJECT_STATUS.md`.

### Verification

- ✅ `typecheck` · ✅ `lint` (0 problems) · ✅ `format:check` · ✅ `test` (**34 tests**)
  · ✅ `build` · ✅ `build-storybook`.

### Not done (intentionally)

- Remaining primitives (Checkbox, Radio, Switch, Dropdown, Tooltip, Avatar) and the
  composite/shell/pattern layers. Final DGA visual audit happens only after official
  tokens (Q3) are provided.

---

## [Frontend 0.1.0] — 2026-07-07 — React Foundation

### Added — `frontend/` project (verified end-to-end)

- **Toolchain:** React 19 + TypeScript (strict, no `any`) + Vite 6; React Router 7;
  ESLint 9 (flat, type-checked, + architecture-boundary rule) + Prettier; Husky +
  lint-staged (pre-commit); Storybook 8 (react-vite + a11y addon); Vitest + React
  Testing Library + axe-core; GitHub Actions CI.
- **Design tokens (L1):** `src/design-system/tokens` — 3-tier CSS custom properties
  (`--fads-ref/sys-*`) + typed `token` map + reset + global base. ⚠ **Values are
  clearly-marked NON-DGA placeholders** pending Q3/Q20 — nothing invented as an
  approved DGA value.
- **Providers:** `ThemeProvider` (data-theme), `DirectionProvider` (RTL default),
  `LocaleProvider` (Arabic-first, AR⇄EN drives RTL⇄LTR), `AppProviders` composition
  root, and an `ErrorBoundary` with a localized fallback.
- **i18n:** i18next + react-i18next, `ar` (primary) + `en` resources, typed keys.
- **Routing:** path registry, lazy route table, `RootLayout` (skip link + `<main>`,
  no header/footer), foundation placeholder + 404 pages.
- **API abstraction:** `ApiAdapter` interface + `httpAdapter` + `mockAdapter`
  (default until Q2), no product endpoints.
- **Shared:** hooks (`useMediaQuery`, `usePrefersReducedMotion`, provider hooks),
  utils (`cn`, `env`, locale-aware `format`), types (generic domain shapes),
  test utilities (`renderWithProviders`, `expectNoA11yViolations`).
- **Docs:** `frontend/README.md` (architecture, folder structure, how to run /
  develop / add features).

### Verification

- ✅ `typecheck` · ✅ `lint` · ✅ `format:check` · ✅ `test` (10 tests) · ✅ `build`
  (route-split) · ✅ `build-storybook`. 588 packages installed on Node 24.

### Notes / constraints honored

- **No reusable UI components, no product pages, no business logic** — foundation only.
- Placeholder tokens + missing IBM Plex Sans Arabic web font (Q7) are the only
  cosmetic gaps; final visual fidelity is gated by **Q3/Q20**.
- vitest pinned to v3 to dedupe Vite (single vite@6); `@types/*` alias dropped in
  favor of `@/types` (avoids TS reserved-scope clash).

### Changed

- `docs/PROJECT_STATUS.md`, `docs/PROJECT_READINESS_REPORT.md` — advanced to the
  React Foundation phase; recorded build verification.

---

## [UISpec 1.0.0] — 2026-07-07 — UI/UX Specification (blueprint)

### Added

- **UI Specification package (9 docs)** — build-ready blueprint for the Innovation Hackathon (first FADS consumer):
  - `docs/UI_SPECIFICATION.md` — section-by-section spec (shell + landing + form/flow + support sections): purpose, layout, content, components, spacing, responsive, accessibility, states.
  - `docs/SCREEN_SPECIFICATIONS.md` — 11 screens (Landing, Submit, Manage, Request Detail, FAQ, Feedback, 404, Privacy, Terms, Accessibility Statement, Search): purpose/layout/navigation/components/interactions/empty/loading/error/responsive/accessibility.
  - `docs/LAYOUT_SPECIFICATION.md` — grid, containers, content widths, section spacing, columns matrix, RTL alignment, section ordering.
  - `docs/INTERACTION_SPECIFICATION.md` — hover/focus/keyboard/touch, transitions, navigation, form behavior & validation, submission & request-management flows, confirmation dialogs, notifications.
  - `docs/VISUAL_HIERARCHY.md` — typography/section/CTA/information hierarchy, RTL scanning, government UX principles.
  - `docs/COPYWRITING_GUIDELINES.md` — voice/tone/terminology, Arabic & English rules, button labels, success/error/validation/empty-state message catalogs.
  - `docs/MICROINTERACTIONS.md` — hover/focus/loading/progress/success/failure feedback, motion tokens & timing (proposed defaults), reduced-motion.
  - `docs/ICONOGRAPHY_SPECIFICATION.md` — usage, sizes, placement, meaning, decorative vs functional, status vs category icons, accessibility.
  - `docs/DGA_VISUAL_REVIEW.md` — self-audit vs `DGA_MASTER_SPECIFICATION`/`COMPLIANCE_MATRIX`/`COMPONENT_MAPPING`/`DESIGN_SYSTEM_SPECIFICATION`; inconsistencies, potential violations, UX improvements, recommendations, risk register.
- `QUESTIONS.md` §G — new content question **Q32** (numeral convention).

### Changed

- `docs/PROJECT_STATUS.md` — advanced to "UI/UX Specification" phase; listed 9 new UI docs; DS marked approved.
- `docs/PROJECT_READINESS_REPORT.md` — phase log + summary + gates updated; overall completeness ≈93%; verdict remains **Conditional GO**.
- `docs/QUESTIONS.md` — index expanded to Q1–Q32.

### Review outcome (`DGA_VISUAL_REVIEW.md`)

- **No DGA violations introduced.** All flagged items are either pending external token values (Q3) or documented build-time guardrails (DC-05/09/13, WCAG 1.4.1).
- Risk register: R-F1/F2, R-T1/T2, R-C1/C2, R-A1 (all tracked to existing questions).

### Notes

- Still **no React / HTML / CSS / UI** produced — documentation only, per `TASK.md`.
- FADS design system **not modified** this phase (consumed, not changed).
- 🔴 Hard blockers unchanged: **Q3** / **Q20**.

---

## [DS 0.1.0] — 2026-07-07 — Design System Documentation

### Added

- **Financial Academy Design System (FADS) documentation package (8 docs):**
  - `docs/DESIGN_SYSTEM_SPECIFICATION.md` — FADS charter, layered architecture (L0 DGA → L1 tokens → L2 components → L3 patterns → L4 products), governance, versioning. Establishes the Hackathon as **consumer #1**, not owner.
  - `docs/DESIGN_TOKENS.md` — 3-tier token taxonomy (reference/system/component), naming convention, categories (color/type/space/radius/elevation/motion/breakpoints/z-index/icon). **No DGA values invented**; placeholders marked `TODO(Q3)`.
  - `docs/COMPONENT_INVENTORY.md` — product-agnostic L2 component catalog (primitives/composite/shell) + L3 patterns (PAT-01…PAT-06), shared `CMP-` IDs with `COMPONENT_MAPPING.md`, per-component a11y contracts.
  - `docs/DESIGN_CONSTRAINTS.md` — binding guardrails DC-01…DC-37 (absolute/structural/UX), allowed-vs-forbidden, enforcement plan.
  - `docs/CONTENT_MODEL.md` — reusable content architecture, message-catalog model, content entities, localization/RTL, terminology governance.
  - `docs/REACT_ARCHITECTURE.md` — multi-product React 18 + TS structure, package boundaries, patterns, providers, routing, forms, data layer, a11y architecture, tooling.
  - `docs/STATE_MANAGEMENT.md` — state taxonomy (server/form/UI/global/URL), mechanisms, async/error handling, anti-patterns.
  - `docs/PERFORMANCE_STRATEGY.md` — CWV targets & budgets, font/image/CSS strategy, RTL/i18n perf, measurement gates.
- `QUESTIONS.md` §F — new design-system engineering questions **Q24–Q31** (with proposed defaults).

### Changed

- `docs/PROJECT_STATUS.md` — advanced to "Design System Documentation" phase; marked planning package approved; listed 8 new DS docs; DS version `0.1.0`.
- `docs/PROJECT_READINESS_REPORT.md` — added phase log; recorded planning approval + DS-docs completion; added FADS readiness gate; verdict remains **Conditional GO**; noted Q24–Q31 defaults.
- `docs/QUESTIONS.md` — question index expanded to Q1–Q31.

### Notes

- Still **no React / HTML / CSS / UI** produced — documentation only, per `TASK.md`.
- 🔴 Hard blockers unchanged: **Q3** (DGA token values) and **Q20** (token acquisition route). Faithful visual compliance cannot close until these are integrated from the official Figma/package.

---

## [Planning 1.0.0] — 2026-07-07 — Planning & Architecture (APPROVED)

### Added

- Full planning package (16 docs) in `docs/`:
  `PROJECT_SCOPE`, `DGA_MASTER_SPECIFICATION`, `COMPLIANCE_MATRIX`, `USER_PERSONAS`, `USER_FLOW`, `INFORMATION_ARCHITECTURE`, `CONTENT_STRUCTURE`, `WIREFRAME` (text-only), `COMPONENT_MAPPING`, `DESIGN_DECISIONS`, `ACCESSIBILITY_CHECKLIST`, `RESPONSIVE_STRATEGY`, `DESIGN_SYSTEM_PLAN`, `IMPLEMENTATION_PLAN`, `TESTING_STRATEGY`, `QUESTIONS` (Q1–Q23).
- `PROJECT_READINESS_REPORT.md` — completeness ≈92%, risks, recommendations, **Conditional GO**.
- Full extraction & analysis of `references/DGA_Standards.xlsx` (official DGA compliance checklist v1.0) — the project's primary verifiable source `[S3]`.

### Notes

- Established source legend `[S1]`–`[S6]`, `[PROJ]`; compliance IDs (F/T/C/E/G); component IDs (CMP-01…CMP-33).
- Recorded that the official DGA site/Figma/Canva are client-side-rendered and **not machine-scrapable**; exact token values require human Figma export.
- Approved by client to proceed to the Design System documentation phase.

---

## [0.0.0] — 2026-07-07 — Project setup

### Added

- Repository scaffold: `CLAUDE.md`, `TASK.md`, `README.md`, `references/SOURCES.md`, `references/DGA_Standards.xlsx`, `content/hackathon.md`, `docs/PROJECT_STATUS.md`.
