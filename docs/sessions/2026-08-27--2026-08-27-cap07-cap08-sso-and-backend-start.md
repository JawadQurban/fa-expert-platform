# 2026-08-27 — CAP-08, CAP-07, the SLA re-wiring, SSO configuration, and the backend begins

## Resume here

| | |
|---|---|
| **Branch** | `expert-hub/journeys-j05-j09` — pushed, clean, nothing stashed |
| **Head** | `d108ef1` |
| **Release tag** | `expert-hub-v1.3.0` — ⚠️ **stale.** It predates CAP-06, CAP-08, CAP-07, the SLA re-wiring and the OIDC layer |
| **Deployed** | The server still runs `v1.3.0`. **None of this session's work is deployed.** No tag was cut — the owner has not asked for one |
| **Frontend** | `641/641` tests, 45 files · typecheck · `lint:expert-hub` · `lint:css` · `build:expert-hub` — all green, verified at `d108ef1` |
| **Backend** | **New.** `backend/expert-hub` builds with 0 warnings (warnings are errors) and `7/7` tests pass |
| **Decisions** | `P-136` → `P-163` added this session (33 rows) |
| **Next action** | **BE-01** — persistence foundation + migration 01, in `prompts/EXPERT_HUB_BACKEND_PLAYBOOK.md`. Blocked on nothing but a SQL Server instance; LocalDB or a container suffices |

**Reading order:** `prompts/EXPERT_HUB_BACKEND_PLAYBOOK.md` → `docs/expert-hub/17_STACK_DECISION.md` → `docs/expert-hub/16_SSO_OIDC_CONFIGURATION.md`.

> ⚠️ **The whole frontend still runs on in-memory mock providers.** Every screen
> built this session — the permission matrix, the notification matrix, templates,
> the deadline console, the log — is real UI over a mock. The backend that would
> serve them is one commit old and has a health endpoint.
>
> ⚠️ **Three screens ship deliberately empty**: the role×permission grid (348
> cells), the notification routing (20 events), and half the SLA durations. That
> is `DM-GAP-07`, `DM-GAP-08` and `DM-GAP-10` — not an oversight, and **not
> something to helpfully fill in**.

---

## 1. What was asked, in order

1. Continue the playbook — **PB-02** (CAP-08 roles & permissions).
2. *"start the next one"* — **PB-03** (CAP-07 notifications).
3. *"okay recoreded and what you need for me ?"* — what inputs are outstanding.
4. *"publish it on github then start next prompt"* — push, then **PB-04**.
5. *"okay let's stop i have new update on SSO, the FAST team use open id connection i provide them with the url and data scope but strart build the configration floder for this connection so when they provide me with the client id and the information we only change the configration"*
6. *"the server i have is local and the OIDC will be on testing ideneity i want to test this before, also we want to start the backend development on experthub"*
7. *"build for me a full playbook with prompt for start build the backend"*
8. *"push everything to github so i work from home"*
9. *"did you update the seession ?"* — this document.

The shape of the session: three playbook prompts back to back, then an
interruption from the real world (SSO) that redirected everything, and the
backend starting earlier than the playbook had planned because the SSO decision
made it the cheapest path.

---

## 2. What shipped

Full detail is in `CHANGELOG.md`; decisions are `P-136`→`P-163`. What follows is
the **technique**, which is what a future session needs in order to stay
consistent.

### CAP-08 — roles & permissions (`6cba30d`)

Rules encoded as **absences**, continuing the pattern from CAP-06. `BR-0801`
("no permission is granted directly to a user") is not a guard — **no type in the
feature links a user to a permission**, so the rule has to be *invented* before
it can be broken. Six roles are a closed union with no create/delete operation.
`BR-0808` is honoured by the service surface containing no *login / signin /
password / credential / sso / token*, asserted by test.

**The 58 permissions are the BRD's own feature codes**, because §8.8.4 makes the
permission list exactly the feature list. Labels came from the PDF's wrapped
tables and are flagged `labelNeedsVerification` — the codes are verified, the
wording is not.

### CAP-07 — notifications, templates, deadlines, log (`62c0194`)

**The event catalogue is evidence-backed.** §8.7.3 says the matrix covers every
event from all twelve capabilities and lists none, so 20 events were taken from
**ten** approved journeys, each carrying its citation *and the journey's own
words about who is notified*. That evidence renders beside the routing controls
and is deliberately **not** the routing. A test asserts every event has a `J-nn`
citation, so an invented event fails the build.

`BR-0702` is a **missing field** — the matrix row has no `channel`, because the
rule leaves nothing to choose. `BR-0701` is a **union** — only an approved
template is routable, and editing an approved template returns it to draft *and*
unroutes its rows.

### The SLA re-wiring (`96cd01c`)

`BR-0705` puts every deadline under one screen, but the durations were **three
constants in three feature mocks**, invisible to the console that claims to
govern them. Now one shared store, and `SlaDto` carries `slaId` so every
countdown names its configuration.

**The tests are cross-feature on purpose** — they edit a deadline through CAP-07's
provider and assert what CAP-02's and CAP-03's screens render. A per-feature test
would have passed with the constants still in place.

### SSO / OIDC configuration (`855e961`, `d734ffb`)

Ten runtime values through the container's `config.js`, so handing over a client
id is an env-file edit. **A secret is unrepresentable**: no field can hold one, a
test asserts it, and the entrypoint *exits non-zero* if
`EXPERT_HUB_OIDC_CLIENT_SECRET` is set on the frontend container.

### The backend begins (`1c27a5b`, `60e400d`)

Solution, host, config safety, and a 21-prompt playbook. The framing that matters:
**the API specification already exists in TypeScript and is tested** — 22 service
interfaces, 641 tests. The backend is implementing a contract a consumer already
depends on, so "done" means *the frontend's own tests pass against the real API*.

---

## 3. Verbal rulings

| Ruling | What it changed |
|---|---|
| *"i give them the redirect URL to the landing page"* | Revealed a registration about to be made wrong. A landing page cannot consume `?code=…&state=…`. Made the redirect URI **configuration** so whatever they registered would work, and gave the correct URLs (`P-161`) |
| *"experts.fa.gov.sa"* — the local test origin | `deploy/expert-hub/env/local.env`, set to **https** because IdPs reject non-https outside localhost, with the base-path trap flagged |
| **ASP.NET Core + EF Core + SQL Server** (chosen from options) | `P-162`. Unblocked all of Phases 3–5 |
| *"the server i have is local and the OIDC will be on testing ideneity i want to test this before"* | Surfaced a genuine conflict: a BFF login cannot be tested before the BFF exists. Resolved by making INT-01 the first backend increment rather than building a throwaway browser adapter |
| *"we want to start the backend development on experthub"* | Backend scaffolded the same session; `CLAUDE.md` scope widened to `backend/expert-hub/**` |

**Standing rule from an earlier session, still in force:** summaries in English,
even when the request is in Arabic. The product stays Arabic-primary.

---

## 4. Corrections — claims I made that were wrong

**Nine.** This is the section that saves the next session time.

1. **`hideLabel` on `Checkbox` / `Select`.** I wrote the permission matrix using
   a prop that does not exist. The DS ships a global `fads-visually-hidden`
   class, and the established pattern is
   `label={<span className="fads-visually-hidden">…</span>}`.

2. **"Eight journeys name notification points."** My own earlier playbook text.
   **It is ten** — J-01's submission confirmation and J-02/F3's activation
   invitation were missed. Corrected in the playbook and `14_`.

3. **"Ship the SLA table empty."** My own PB-03 instruction, wrong in one
   direction: J-06/F1/AC-4, J-18/F2 and J-12/F1/AC-2–4 **state** their deadlines
   and the product already ran those countdowns. Blanking them would have
   discarded approved rules. The rule it was reaching for is narrower — *ship the
   unapproved parts empty, not the approved ones* (`P-150`).

4. **Screen IDs had forked, and I made it worse.** `02C`/`04`/`05` all agree on
   one namespace; CAP-06 had taken `EH-INT-11` (already Speaker Records), CAP-08
   took `EH-INT-12` (already Notifications), and I took `EH-INT-13` (already the
   SLA console) for all four CAP-07 screens. Renumbered onto the documented set
   (`P-154`): CAP-07 → `EH-INT-12`/`13`, CAP-08 → `EH-INT-14`, CAP-06 →
   `EH-INT-17`.

5. **Document number collision.** I created `16_SSO_OIDC_CONFIGURATION.md` while
   PB-08 already reserved `16_STACK_DECISION.md`. The stack decision became `17`.

6. **The users page imported `MOCK_CENTRES` from the mock provider** — the only
   page in Expert Hub importing mock data, in the same session I criticised that
   pattern. Fixed by adding `listCentres()` to the service (`P-144`). **The same
   mistake recurred hours later** with the template placeholder vocabulary, and
   was caught the same way.

7. **The secret-scan test flagged its own comment.** My `appsettings.json`
   guidance note mentions `Oidc__ClientSecret`, and the test scanned raw text.
   The check was too blunt, not the file wrong — rewritten to walk JSON *values*.
   **Then verified by planting `Password=Hunter2` and watching it fail**, because
   a guard never seen to fail is not a guard.

8. **`17_STACK_DECISION.md` §4 described .NET 8's support window.** Written
   before scaffolding revealed the machine has only .NET 9 SDK — so the document
   described the wrong risk. .NET 9 is STS and **already out of support (May
   2026)**. Corrected in `d108ef1`.

9. **The redirect URIs I gave the owner went stale within hours.** §2 of the SSO
   document tells them to register the SPA callback; `P-163` then moved the flow
   into the API, making it an API route. The document now says so at the top, but
   **if FAST was told the SPA URL before that, it needs correcting.**

**Not a correction, but nearly reported as one:** a parallel test run showed 16
failures across 11 unrelated files. Serial reproduced none. Machine load — see §7.

---

## 5. Where it stands

**Complete and verified:** CAP-06, CAP-07, CAP-08 frontends; the central SLA
matrix; the OIDC configuration layer; the backend scaffold; the backend playbook.
22 of 24 documented journeys, plus three BRD-sourced capabilities.

**Not started (not blocked):** BE-01 through BE-05 — persistence, INT-01,
authorization, the integration hub, notifications. **These depend on no
unanswered question except a SQL Server instance.**

**Waiting on someone else, not on work:**

- The **matrix contents** — three screens exist and are empty by design.
- The **FAST client registration** — BE-02 cannot finish without it, though it
  can be built and tested against a testing IdP before the claim contract lands.
- **`Q30`** — whether FAST exposes a write API decides if dual change is
  deliverable at all.

**Known debt, tracked:** the backend targets `net9.0`, which is out of support.
One line in `Directory.Build.props`; tracked as **BE-21**.

---

## 6. Open questions, by who can answer them

**Product Owner / Business Analyst**
- `Q31` — the role×permission matrix: 6 roles × 58 permissions + data scope.
- `Q34` — notification routing: which audience receives each of the 20 events.
- `Q33` — the template placeholder vocabulary **and the approved message wording**.
- `Q32` — what «أعالجها» requires in `US-0705`; a resend needs three answers first.
- `Q35` — the screening SLA duration, and J-11's and J-20's.
- `Q25` — which of the six roles are in scope for this release.

**FAST / IMS team**
- The OIDC client registration — issuer, client id, client type. ⚠️ **The redirect
  URI is now an API route** (`P-163`); settle it before they register.
- `Q37` — the claim contract: which claim carries the role, its values, whether it
  is in the ID token or only userinfo, session lifetime and logout.
- `Q30` (write API), `Q20` (`plan.PlanTaker`), `Q21` (19 lookup lists).

**Infrastructure**
- A SQL Server instance — the only thing blocking BE-01.
- Which .NET LTS the Academy hosts (decides BE-21).
- Hosting topology and CI/CD path — `17_STACK_DECISION.md` §4.

**Data protection + procurement**
- `Q28` — whether applicant free-text may leave the Academy's boundary. Blocks
  go-live of the AI feature, not the build.

---

## 7. Where it stopped

The last exchange was administrative: everything was pushed for the owner to
work from home, then *"did you update the seession ?"* — which this document
answers. **I had not, and should have offered before being asked.**

**No unanswered question blocks the next step.** The proposed next action is
**BE-01** (persistence foundation + migration 01), which needs only a SQL Server
instance and can use LocalDB or a container meanwhile.

**Nothing is half-done.** Every commit is complete and validated; there is no
partially-built feature to pick up mid-flight.

⚠️ **One thing to do before more OIDC work:** confirm what URL FAST was actually
given, and whether the base path on `experts.fa.gov.sa` is `/expert-hub` or the
root. The base path is **build-time**, not configuration — it is baked into asset
URLs — so it must be settled before the redirect URI is registered.

---

## 8. Resuming

```bash
git checkout expert-hub/journeys-j05-j09
cd frontend && npm install
npm run validate:expert-hub
cd ../backend/expert-hub && dotnet build && dotnet test
```

### Environment traps

| Trap | Cost | Avoid it by |
|---|---|---|
| **Vitest flakes under parallel load** | A parallel run showed 16 failures across 11 unrelated files, all `Unable to find role="heading"`; serial reproduced none | Always `npx vitest run src/apps/expert-hub --no-file-parallelism` |
| **`byRole` queries with `name` over a large DOM** | The 348-cell permission grid made its own suite take **150 seconds** | Fixed at the source — the grid renders one capability at a time (`P-143`). If a suite suddenly crawls, look for a query filtering by accessible name over hundreds of controls |
| **Bash heredocs fail on large or Arabic content** | "unexpected EOF" repeatedly | Write a Python script to the scratchpad, then `python <path>`. Set `PYTHONIOENCODING=utf-8` — Windows defaults to cp1256 |
| **`npm run` from the repo root fails** | `package.json` is in `frontend/` | `cd frontend` first |
| **NuGet's current packages target `net10.0`** | `Microsoft.AspNetCore.Mvc.Testing` 10.0.11 will not restore on `net9.0` | Pin test packages to `9.0.*` until BE-21 |
| **`dotnet test` fails on CA1707** | Underscored test names are the readable convention | Already suppressed in `tests/Directory.Build.props` — for tests only |

---

*Previous record: [Journeys J-18→J-22, FAST alignment, navigation, CAP-06](2026-08-18--2026-08-26-journeys-fast-and-entitlements.md).*
