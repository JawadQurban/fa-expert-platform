# Expert Hub — UAT External Dependencies

*Prepared 2026-09-29 against commits `ca846fd` and `630c02e` on
`expert-hub/uat-baseline`. This is the **UAT-decision view** of the register in
[`26_UAT_EXTERNAL_DEPENDENCIES.md`](../specification/26_UAT_EXTERNAL_DEPENDENCIES.md), which stays
the reference for configuration keys and the per-system checklists. Nothing here
supersedes it; the statuses below were re-verified in code on 2026-09-29.*

**The live answer for any instance is `GET /api/v1/internal/readiness`** (internal
role only — `ProviderReadiness.cs:79`). It reports a status and a fallback code,
never a configured value. `/health` and `/health/ready` stay public and minimal.

> ⚠️ **No external integration below is marked READY.** Every one is
> `NOT_CONFIGURED`, `DEGRADED` or `PENDING_BUSINESS_APPROVAL` in the code as it
> stands. A status only becomes `READY` when the provider is actually configured
> at the instance — the code computes it, this document does not assert it.

---

## Summary — can UAT proceed?

| ID | System | Status in code | Blocks UAT? |
|---|---|---|---|
| EXT-01 | SSO — FAST STS (OIDC) | `NOT_CONFIGURED` until registered | **YES — hard gate** |
| EXT-02 | FAST service credential | `DEGRADED` / `NOT_CONFIGURED` | No |
| EXT-03 | FAST Programme / Plan contracts | Not activated | No — **must not be activated in UAT** |
| EXT-04 | Microsoft Teams (Graph) | `NOT_CONFIGURED` | No — J-06 degrades, never blocks |
| EXT-05 | Email gateway | `NOT_CONFIGURED` | No — unless UAT must prove delivery |
| EXT-06 | E-signature provider | `PENDING_BUSINESS_APPROVAL` | No — UAT signs by internal acceptance |
| EXT-07 | Yaqeen / Nafath | `NOT_CONFIGURED` | No for signed-in paths · **YES for J-02** and the J-01 guest path |
| EXT-08 | Antivirus scanning | `NOT_CONFIGURED` | No — uploads record `not-scanned` |
| EXT-09 | Legal agreement text | Not legally approved | No — UAT agreements are test records |

**Exactly one external dependency blocks UAT: EXT-01.** Without a registered SSO
client nobody can sign in, and every journey except the public directory begins
with sign-in. Everything else degrades to a defined, visible fallback.

---

## Register

### EXT-01 — SSO: FAST STS (OIDC)

| | |
|---|---|
| **Purpose** | Sign-in for every user. The API is the BFF and holds the cookie session (`P-163`) |
| **Current status** | `sso = NOT_CONFIGURED`, fallback `sign-in-unavailable` (`ProviderReadiness.cs:51-53`). Testing host configured; UAT/production client **not registered** |
| **Journeys affected** | **All except J-24** (public directory). J-01 … J-23, J-25, J-26 |
| **Can UAT proceed without it?** | **NO.** This is the only hard external gate |
| **Fallback / mock behaviour** | None in UAT. Demo providers and the placeholder sign-in are allowed **only** when `EXPERT_HUB_ENV` is `development` or `test` |
| **Fail-closed behaviour** | `/api/auth/login` returns **503 "SSO is not configured"**. With `EXPERT_HUB_ENV=uat` the frontend **refuses to start** and names the missing keys on a configuration-error screen (`deploymentProblems`, `expertHubConfig.ts`) |
| **Needed from owner** | FAST registers the UAT client and both URIs: redirect `https://<UAT_HOST>/api/auth/callback`, post-logout `https://<UAT_HOST>/expert-hub`. DevOps sets `EXPERT_HUB_OIDC_ISSUER`, `_CLIENT_ID`, `_CLIENT_SECRET` (secrets file only), `EXPERT_HUB_API_BASE_URL`, `EXPERT_HUB_ENV=uat` |
| **Owner** | FAST identity team · DevOps |
| **Verify** | `26_UAT_EXTERNAL_DEPENDENCIES.md` SSO checklist, steps 1–8 |

### EXT-02 — FAST service credential

| | |
|---|---|
| **Purpose** | Machine-to-machine token for the reference-data sync |
| **Current status** | `fast = NOT_CONFIGURED` (no base URL) or `DEGRADED` with fallback `WAITING_FOR_FAST_SERVICE_CREDENTIAL` (`ProviderReadiness.cs:57-61`). The only token source is still the `NoFastToken` seam |
| **Journeys affected** | None directly. Forms use local approved lists, not FAST lists |
| **Can UAT proceed without it?** | **YES** |
| **Fallback / mock behaviour** | The sync records `WAITING_FOR_FAST_SERVICE_CREDENTIAL` and **calls nothing**. The last good copy is kept (empty until a first success). Nothing ever claims a sync succeeded |
| **Fail-closed behaviour** | No call is attempted without a token. A failed run keeps the previous values active |
| **Needed from owner** | Answers A1–A10 in `22_FAST_INTEGRATION_REQUEST.md`, then a UAT-only service client. Expert Hub must then build the token provider replacing `NoFastToken` — a separate change with its own tests |
| **Owner** | FAST API team |

### EXT-03 — FAST Programme / Plan contracts

| | |
|---|---|
| **Purpose** | J-16 programme selection and plan auto-fill |
| **Current status** | Contracts not supplied. **Not activated.** No code path calls them |
| **Journeys affected** | J-16 |
| **Can UAT proceed without it?** | **YES** — Programme and Plan are typed by hand |
| **Fallback / mock behaviour** | Manual entry. No FAST call is made |
| **Fail-closed behaviour** | N/A — the integration does not exist yet, so there is nothing to fail |
| **Needed from owner** | The `GetPlansByProgramId` contract, the plan fields, the authoritative programme catalogue |
| **Owner** | FAST API team |
| ⚠️ | **Do not activate in UAT.** J-16 stays on manual entry until a separate approved change lands |

### EXT-04 — Microsoft Teams (Graph)

| | |
|---|---|
| **Purpose** | J-06 interview meeting links |
| **Current status** | `teams = NOT_CONFIGURED`, fallback `internal-scheduling-meeting-link-pending` (`ProviderReadiness.cs:62-64`) |
| **Journeys affected** | J-06 (and the interview ticket surface of J-07) |
| **Can UAT proceed without it?** | **YES** |
| **Fallback / mock behaviour** | Internal scheduling works in full. The ticket shows the meeting as **pending** with no link. Booking is best-effort and never blocks the interview state |
| **Fail-closed behaviour** | A booking failure does not roll back or block the scheduled interview |
| **Needed from owner** | `EXPERT_HUB_TEAMS_TENANT_ID`, `_CLIENT_ID`, `_CLIENT_SECRET` (secrets file), `_ORGANIZER_UPN`, plus an Exchange application access policy scoped to the organiser |
| **Owner** | Infrastructure / M365 admin |

### EXT-05 — Email gateway

| | |
|---|---|
| **Purpose** | J-25 email channel |
| **Current status** | `email = NOT_CONFIGURED`, fallback `outbox-delivery-pending` (`ProviderReadiness.cs:65-67`). `IEmailGateway` has only `NullEmailGateway` — **no adapter exists** |
| **Journeys affected** | J-25, and the notification steps of J-02, J-03, J-06, J-12, J-18, J-19 |
| **Can UAT proceed without it?** | **YES — unless UAT must prove a person receives a message.** Separate the two: *application behaviour* (events raised and recorded) works; *external delivery* does not exist |
| **Fallback / mock behaviour** | Every raised event is recorded as a `NOTIFICATION_OCCURRENCE`. Routed messages queue in the outbox as `pending`; the publisher skips while no channel is configured. **Nothing is marked sent.** Offer expiry, reminders and state changes all still happen — none depends on delivery |
| **Fail-closed behaviour** | `NullEmailGateway` reports failure, never success. `NOTIFICATION_LOG` records `failure`, never a fabricated `success` |
| **Needed from owner** | Gateway type, host, sender, credentials (out-of-band) from Infrastructure; an `IEmailGateway` adapter from Expert Hub (separate change); routing approval (BD-UAT-06) from the business |
| **Owner** | Infrastructure + Expert Hub + Business |
| ⚠️ | Before enabling, **review the outbox**: messages queued while no gateway existed are still `Pending` and **will send**. Decide release or discard |

### EXT-06 — E-signature provider

| | |
|---|---|
| **Purpose** | Certified signature on agreements (J-10 / J-11) |
| **Current status** | `e-signature = PENDING_BUSINESS_APPROVAL`, fallback `internal-acceptance-only` (`ProviderReadiness.cs:70`). No provider exists; none is being selected until BD-UAT-03 is decided |
| **Journeys affected** | J-10, J-11, J-12 |
| **Can UAT proceed without it?** | **YES** |
| **Fallback / mock behaviour** | Acceptance is recorded as method `internal-acceptance` against the exact frozen document version and its SHA-256 hash. The UI **never** calls it certified or qualified. **No signed PDF is fabricated** |
| **Fail-closed behaviour** | No certified-signature claim is ever made. The signature method is recorded per signature, so a provider can be added later without migrating history |
| **Needed from owner** | BD-UAT-03: is internal in-platform acceptance legally sufficient, or is an external provider required before production? |
| **Owner** | Legal, then procurement |

### EXT-07 — Yaqeen / Nafath (national ID verification)

| | |
|---|---|
| **Purpose** | J-01 guest identity check, J-02 nominee linking |
| **Current status** | `yaqeen = NOT_CONFIGURED`, fallback `no-automated-identity-verification` (`ProviderReadiness.cs:72`). **No adapter exists** |
| **Journeys affected** | J-01 (guest path only), J-02 |
| **Can UAT proceed without it?** | **YES for every signed-in path.** **NO for J-02**, and **no** for the J-01 guest path |
| **Fallback / mock behaviour** | Identity **fails closed** (`identity-provider-not-configured`). The guest and activation screens send the person to SSO sign-in. **No fake verification is ever shown** outside explicit mock mode |
| **Fail-closed behaviour** | The mock identity check is reachable only when there is no API base URL or `EXPERT_HUB_DATA_MODE=mock`. A UAT host (`EXPERT_HUB_ENV=uat`) can reach neither |
| **Needed from owner** | A service contract, credentials and an adapter. J-02 additionally needs BD-UAT-01 (how a nominee record links to an SSO identity) — a **security** decision, not just an integration |
| **Owner** | NIC / Business + Information Security |

### EXT-08 — Antivirus scanning

| | |
|---|---|
| **Purpose** | Scan uploaded documents |
| **Current status** | `antivirus = NOT_CONFIGURED`, fallback `stored-as-not-scanned` (`ProviderReadiness.cs:73-75`). `IUploadScanner` is `UnscannedUploadScanner` |
| **Journeys affected** | J-01, J-03, J-10, J-11, J-14, J-16, J-20 (every upload) |
| **Can UAT proceed without it?** | **YES** |
| **Fallback / mock behaviour** | Uploads are stored with scan status **`not-scanned`** — recorded as itself, never as "clean". Type and size rules are still enforced; download stays limited to the owner or internal staff |
| **Fail-closed behaviour** | The status is never upgraded to a pass it did not earn |
| **Needed from owner** | A scanner service plus an `IUploadScanner` adapter |
| **Owner** | Infrastructure / Security |
| ⚠️ | Blocks **production**, not UAT. UAT testers should upload only non-sensitive test files |

### EXT-09 — Legal agreement text

*Tracked here because UAT testers will sign agreements, but it is a legal
approval rather than a system integration.*

| | |
|---|---|
| **Purpose** | The trainer agreement's actual legal wording |
| **Current status** | The active template's text is served, frozen per agreement version and hashed. **The text itself is not legally approved** (BD-UAT-07) |
| **Journeys affected** | J-10, J-11, J-12 |
| **Can UAT proceed without it?** | **YES**, provided every UAT agreement is marked test data |
| **Fallback / mock behaviour** | Template edits create a new template version and never alter an agreement already prepared |
| **Needed from owner** | Legal supplies the final text, loaded as a new template version |
| **Owner** | Legal |

---

## What "READY" would require

A dependency moves to READY only when `GET /api/v1/internal/readiness` says so on
that instance. Do not mark one ready in a test plan because a key has been typed
into an env file — run the endpoint and read the status.

| System | READY means |
|---|---|
| EXT-01 SSO | `sso = READY` **and** SSO checklist steps 1–8 pass |
| EXT-02 FAST | `fast = READY` — requires the token provider, not just a base URL. A base URL alone yields `DEGRADED` |
| EXT-04 Teams | `teams = READY` **and** a join link appears for the applicant and the J-05 panel |
| EXT-05 Email | `email = READY` **and** a message arrives once, outbox `published`, `NOTIFICATION_LOG` `success` |
| EXT-08 Antivirus | `antivirus = READY` — `scanner` is no longer `UnscannedUploadScanner` |
| EXT-06 E-signature | Cannot become READY by configuration. It needs BD-UAT-03 first |

---

Related: [`26_UAT_EXTERNAL_DEPENDENCIES.md`](../specification/26_UAT_EXTERNAL_DEPENDENCIES.md)
(keys and checklists) · [`25_UAT_BUSINESS_DECISIONS.md`](../specification/25_UAT_BUSINESS_DECISIONS.md)
(BD-UAT-01 … 07) · [`UAT_JOURNEY_MATRIX.md`](UAT_JOURNEY_MATRIX.md) ·
[`UAT_ACCEPTANCE_PLAN.md`](UAT_ACCEPTANCE_PLAN.md)
