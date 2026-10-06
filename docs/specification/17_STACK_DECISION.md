# 17 — Backend stack decision (PB-08)

**Status:** 🟢 Decided 2026-08-27 by the owner. **ASP.NET Core + EF Core + SQL
Server.** Recorded as `P-162`.

> PB-08 asked for this at `16_STACK_DECISION.md`; 16 was taken by
> `16_SSO_OIDC_CONFIGURATION.md` earlier the same day, so it is 17. The playbook
> reference is corrected.

---

## 1. The decision

| Layer | Choice | ⚠️ |
|---|---|---|
| Runtime | **.NET LTS** — see §4 on which version | Needs Confirmation |
| API | **ASP.NET Core**, Minimal APIs, versioned `/v1/…` | |
| Data access | **EF Core** + migrations | |
| Database | **SQL Server** | |
| Identity | **OIDC client in the API** (INT-01), cookie session to the browser | see §5 |
| Audit | Append-only table, no UPDATE/DELETE grant (`NFR-07`, `BR-0806`) | |
| Structure | **Modular monolith, one module per capability** | |
| Tests | xUnit + WebApplicationFactory; SQL Server for integration | |

---

## 2. Why — the constraints that actually narrowed it

PB-08 said "weigh those, do not just state a preference". Four constraints do
almost all the narrowing, and three of them point the same way.

**The estate is SQL Server, and it is not ours to change.** The schema supplied
by the FAST team (`13_FAST_DATA_DICTIONARY_MAP`, 15 tables / 406 columns) is
T-SQL. Expert Hub replicates entities from it (`P-129` entity-level mastership)
and writes back through it (`P-135` write-through). A stack whose data tooling
treats SQL Server as a second-class target adds friction to the one integration
the product cannot do without.

**FAST is itself an ASP.NET application.** Its schema contains `dbo.AspNetUsers`
with the ASP.NET Identity column shape. That is not decisive on its own, but it
means the team on the other side of INT-05 and INT-01 works in the same
ecosystem — shared vocabulary on connection handling, claims, and hosting, and a
shorter path when an integration behaves unexpectedly.

**The frontend already assumes it.** `runtimeConfig.ts`, `expertHubConfig.ts` and
`02C` all describe "the future Expert Hub ASP.NET Core API". That is weak
evidence by itself — a comment is not a decision — but it means no client code
changes as a result of this ruling.

**It must run inside the Academy's environment.** A runtime the Academy already
hosts, patches and monitors is one fewer thing to introduce. ⚠️ This is the part
this document cannot verify — see §4.

### What was weighed against it

**Node.js + NestJS + Prisma** — one language across the stack and a large hiring
pool. Set aside because it sits awkwardly beside a SQL Server estate and a .NET
counterpart system, and adds a second runtime for the Academy to host and patch.
The single-language argument is real but weaker here than usual: the frontend is
already fully built and its contracts are settled, so there is little day-to-day
context-switching left to save.

---

## 3. What the architecture already fixes, whatever the stack

These are not stack choices; they were settled earlier and the stack must serve
them.

- **One module per capability** (`D-01`, BRD §7.1) — the twelve capabilities are
  the module boundaries, not layers. A modular monolith, because the capabilities
  share a database and transactional boundaries (an accreditation decision writes
  across CAP-01/02/03), and nothing in the BRD asks for independent deployment.
- **Config-as-data** (`BR-0807`, `BR-0705`) — the role×permission matrix, the
  notification matrix, the templates and the SLA matrix are **rows**. A permission
  or a deadline change must never require a release. The frontend already models
  them this way (`P-138`, `P-146`, `P-155`).
- **Server-decided capabilities** (`P-J9`, `P-27`) — the API tells the client what
  it may do; the client never infers it from a role string. Every DTO that gates
  an action already carries the flag.
- **Append-only audit** (`NFR-07`, `BR-0806`) — enforced by permissions at the
  database level, not by application discipline: the application's principal gets
  INSERT and SELECT on the audit table and nothing else.
- **Authentication is external, authorization is entirely ours** (`P-133`,
  `BR-0808`, `BR-1205`) — no credential is ever stored.
- **One source per entity** (`BR-1201`, `P-129`) — the integration layer carries
  the mastership map; a replica write to a master-owned field is rejected, not
  silently kept.

---

## 4. ⚠️ Needs Confirmation — the runtime version

**The .NET version is an infrastructure question this document cannot answer,
and the scaffold currently sits on an out-of-support runtime.**

⚠️ **What was found when the solution was scaffolded** (`1c27a5b`, the same day):
the build machine has **.NET SDK 9.0.300 / 9.0.317 and nothing newer**, so
`Directory.Build.props` targets `net9.0` — and **.NET 9 is STS, whose support
ended in May 2026**. NuGet confirmed the ecosystem has moved on: the current
`Microsoft.AspNetCore.Mvc.Testing` is **10.0.11 and targets `net10.0` only**, so
the test package is pinned to the 9.x line.

That is a deliberate stopgap so the scaffold builds and its tests run today. **It
is not acceptable at release**: a DGA-registered government platform must not run
on an unsupported runtime. The current LTS (.NET 10, November 2025) runs to
November 2028.

**The upgrade is one line** in `backend/Directory.Build.props`, because
nothing else names a framework version — that was the point of putting it there.
It is tracked as **BE-21** in the backend playbook.

**Ask the Academy's infrastructure team:**

1. Which .NET runtimes are approved and already hosted?
2. Which SQL Server version and edition, and is a dedicated database available?
3. Is hosting IIS, Kestrel behind a reverse proxy, containers, or a managed
   service? The frontend already ships as a container behind the server's Nginx.
4. What is the CI/CD path — is there an approved pipeline, or is deployment
   manual today as it is for the frontend?

None of these change the decision in §1. They change the version numbers and the
deployment topology, and they should be settled before **BE-01** writes the first
migration — and before the runtime upgrade in **BE-21**, since the answer to
question 1 decides which LTS to move to.

---

## 5. Where the OIDC flow lives — this decision moves it

`16_SSO_OIDC_CONFIGURATION.md` §3 left this open as `Q36`, because with no
backend the only available answer was a browser-based public client.

**With a backend now committed, the flow belongs in the API.** The reasons were
already true and were merely unaffordable:

- `02C` says the frontend talks **only** to the Expert Hub API and never to SSO
  directly. A browser-based OIDC client contradicts that.
- Tokens never reach JavaScript. The browser holds an **HttpOnly, Secure,
  SameSite** session cookie; an XSS bug cannot read it.
- It stops mattering whether FAST issues a client secret. A confidential client
  is fine — the API holds the secret, which is what a secret is for.

This supersedes the browser-public-client assumption in
`16_SSO_OIDC_CONFIGURATION.md`, and **`Q36` is answered**: register whichever
client type FAST prefers, because the API can be either.

⚠️ **One consequence for testing.** The owner wants to test against the FAST
testing identity provider *before* the backend is ready. Those two facts
conflict: a BFF login cannot be tested before the BFF exists. Either the OIDC
integration is the **first** thing built in the new API — which is the
recommendation, since it is small and everything else needs a signed-in user
anyway — or a throwaway browser-side adapter is built to prove the connection and
discarded. The first is barely slower and leaves something worth keeping.

⚠️ **The redirect URI changes** when the flow moves to the API: it becomes an API
route (`https://experts.fa.gov.sa/api/auth/callback`, exact path to be fixed in
**BE-02**) rather than the SPA callback route. **Settle this before FAST registers
the client**, because re-registering later is a request to another team.

---

## 6. What this unblocks

The whole of Phases 3–5, which PB-08 was blocking. The detailed sequence now
lives in **[`prompts/EXPERT_HUB_BACKEND_PLAYBOOK.md`](../archive/prompts/EXPERT_HUB_BACKEND_PLAYBOOK.md)**
(BE-00→BE-21).

**BE-01 → BE-05 — persistence, identity, authorization, the integration hub and
notifications — depends on no unanswered question except a SQL Server
instance.** BE-02 (INT-01) is the recommended first real increment, per §5.

---

*Related: `08_BACKEND_ARCHITECTURE` (the design this implements) ·
`10_DATABASE_DESIGN` (97 entities) · `13_FAST_DATA_DICTIONARY_MAP` (the estate) ·
`16_SSO_OIDC_CONFIGURATION` (the client registration) · `DECISIONS.md` `P-162`.*
