# 26 — UAT External Dependencies

*Prepared 2026-09-17 on `expert-hub/uat-baseline`. Every status below is what the
code can **check**. Nothing is simulated. The live answer per instance is
`GET /api/v1/internal/readiness` (internal role only; statuses and fallback codes,
never a value). `/health` and `/health/ready` stay public and minimal.*

Readiness statuses: `READY` · `NOT_CONFIGURED` · `DEGRADED` · `NOT_REQUIRED` ·
`PENDING_BUSINESS_APPROVAL`.

## Runtime modes: where mocks are allowed

| Mode (`EXPERT_HUB_ENV`) | Demo data / placeholder sign-in | What happens if something is missing |
|---|---|---|
| `development` | MOCK_ALLOWED | Missing API: modules use demo providers. Missing OIDC: the dev sign-in placeholder |
| `test` | MOCK_ALLOWED | Same (unit and contract tests) |
| `uat` | **not allowed** | The frontend **refuses to start** and names the missing keys: `EXPERT_HUB_API_BASE_URL`, the OIDC client, or modules left off `EXPERT_HUB_DATA_MODE` (`deploymentProblems`, `expertHubConfig.ts`) |
| `production` or any other label | **not allowed** | Same as `uat` |

The backend has **no mock providers in any mode**. An unconfigured provider is
the null implementation, and it reports failure, never success
(`NullEmailGateway`, `NoFastToken`, the unconfigured `IMeetingProvider`,
`UnscannedUploadScanner`). Identity (Yaqeen) has no adapter. The frontend's
identity service fails closed outside explicit mock mode (RB-01).

⚠️ The testing server's `env/local.env` sets `EXPERT_HUB_ENV=development`, so
this guard doesn't apply there. A UAT host must use `EXPERT_HUB_ENV=uat`.

## Register

| ID | System | Purpose | Environment | Required configuration | Owner | Current status | Expert Hub fallback | Blocks UAT? | Blocks Production? | Validation test |
|---|---|---|---|---|---|---|---|---|---|---|
| EXT-01 | SSO: FAST STS (OIDC) | Sign-in for every user (INT-01, BFF in the API, `P-163`) | Testing: configured (`ReactApp` on `testingauth.fa.gov.sa`). UAT/Production: not registered | `EXPERT_HUB_OIDC_ISSUER`, `EXPERT_HUB_OIDC_CLIENT_ID`, `EXPERT_HUB_OIDC_CLIENT_SECRET` (secrets file, only for a confidential client), a registered redirect URI (see the checklist below) | FAST identity team | UAT: `NOT_CONFIGURED` | `/api/auth/login` returns **503 "SSO is not configured"**. In UAT/production the frontend refuses to start. No placeholder sign-in | **YES** | **YES** | Readiness `sso = READY`, then the SSO checklist steps 1–8 |
| EXT-02 | FAST service credential | Machine-to-machine token for the reference-data sync (countries, then other lists) | All: none issued | Answers A1–A10 in `22_FAST_INTEGRATION_REQUEST.md` §1, then a token provider replacing `NoFastToken`. `EXPERT_HUB_FAST_CLIENT_ID`/`_SECRET` are reserved and **read by nothing yet** | FAST API team | `DEGRADED` (base URL set) / `NOT_CONFIGURED` (no base URL): `WAITING_FOR_FAST_SERVICE_CREDENTIAL` | The sync records `WAITING_FOR_FAST_SERVICE_CREDENTIAL` and calls nothing. The last good copy is kept (empty until the first success). Forms keep their current local lists. Nothing claims a sync succeeded | NO | NO for the current forms. YES before any form switches to FAST lists | FAST checklist steps 1–10 |
| EXT-03 | FAST Programme / Plan contracts | J-16 programme selection and plan auto-fill | All: contracts not supplied | `GetPlansByProgramId` contract, the plan fields (`22_` §4), the authoritative programme catalogue (`22_` §3) | FAST API team | `NOT_CONFIGURED` (no contract; **not activated**) | J-16 Program/Plan are typed by hand. No FAST call is made | NO | NO (manual entry works) | Contract received; a separate change with its own tests. **Don't activate in UAT** |
| EXT-04 | Microsoft Teams (Graph) | J-06 interview meeting links | All: not configured | `EXPERT_HUB_TEAMS_TENANT_ID`, `_CLIENT_ID`, `_CLIENT_SECRET` (secrets file), `_ORGANIZER_UPN`; Exchange application access policy scoped to the organiser | Infrastructure / M365 admin | `NOT_CONFIGURED` | Internal scheduling works. The ticket shows the meeting as **pending**, with no link. Booking is best-effort and never blocks the interview state | NO | Business choice (meeting links can be sent manually) | Readiness `teams = READY`. Schedule an interview and check that a join link appears for the applicant and the J-05 panel |
| EXT-05 | Email gateway | J-25 email channel | All: no adapter | Gateway type (SMTP or API), host, sender, credentials. **Expert Hub still needs an adapter** (`IEmailGateway` has only `NullEmailGateway`) | Infrastructure + Expert Hub | `NOT_CONFIGURED` | Events are recorded (`NOTIFICATION_OCCURRENCE`). Routed emails wait in the outbox as `pending`; the publisher skips while no channel is configured. Nothing is marked sent | NO (unless UAT must prove delivery) | YES | Readiness `email = READY`, then the email checklist |
| EXT-06 | E-signature provider | Certified signature on agreements (J-10/J-11) | None | Depends on BD-UAT-03 | Legal, then procurement | `PENDING_BUSINESS_APPROVAL` | Internal acceptance only (`internal-acceptance`, frozen version plus SHA-256). Never labelled certified. No signed PDF | NO | Depends on BD-UAT-03 | Agreement checklist (`27_UAT_TEST_MATRIX.md`, scenarios A–C) |
| EXT-07 | Yaqeen (national ID verification) | J-01 guest identity, J-02 nominee linking | None | Service contract, credentials, an adapter (none exists) | NIC / Business | `NOT_CONFIGURED` | Identity **fails closed** (`identity-provider-not-configured`). Guest and activation screens send the person to SSO sign-in. No fake verification | NO (sign-in path) / YES for J-02 | YES for J-01 guest path and J-02 | Readiness `yaqeen`. The guest path shows the sign-in requirement, never a verified identity |
| EXT-08 | Antivirus scanning | Scan uploaded documents | None (`G27`) | A scanner service plus an `IUploadScanner` adapter | Infrastructure / Security | `NOT_CONFIGURED` | Uploads are stored with scan status **`not-scanned`**. Type and size rules are still enforced; download is limited to the owner or internal staff | NO | YES (security) | Readiness `antivirus`. The upload checklist (`27_`) confirms `not-scanned` is recorded |

---

## SSO UAT checklist (EXT-01)

Values to fill in. **Placeholders only.** Deliver the secret out-of-band, never in this file.

| Item | UAT value | Production value | Where it goes |
|---|---|---|---|
| Authority (issuer) | `<UAT_AUTHORITY>` | `<PROD_AUTHORITY>` | `EXPERT_HUB_OIDC_ISSUER` (compose maps it to `Oidc__Authority` and the frontend `oidcIssuer`) |
| Client ID | `<UAT_CLIENT_ID>` | `<PROD_CLIENT_ID>` | `EXPERT_HUB_OIDC_CLIENT_ID` |
| Client Secret | `<UAT_CLIENT_SECRET>` (only for a confidential client) | `<PROD_CLIENT_SECRET>` | `EXPERT_HUB_OIDC_CLIENT_SECRET` in **`env/api.secrets.env` only**. The frontend entrypoint refuses to start if it reaches the frontend container |
| Redirect URI (register at the STS) | `https://<UAT_HOST>/api/auth/callback` | `https://<PROD_HOST>/api/auth/callback` | Derived, not typed: the API's `Oidc:CallbackPath` (default `/api/auth/callback`, `appsettings.json`) on the forwarded host. The API is mounted at `/api` (`Program.cs`) |
| Post-logout redirect URI (register at the STS) | `https://<UAT_HOST>/expert-hub` | `https://<PROD_HOST>/expert-hub` | Derived: `{scheme}://{host}{Oidc:FrontendReturnPath}` (`AuthEndpoints.cs`, default `/expert-hub`, `EXPERT_HUB_OIDC_FRONTEND_RETURN_PATH`) |
| Scopes | `openid profile email` (unless FAST requires others) | same | `EXPERT_HUB_OIDC_SCOPES` (the API's `Oidc__Scopes` is what the handshake uses) |
| API audience | **Not used by the current code.** The API is a BFF with a cookie session; the ID token is validated for this Client ID. Ask FAST only if a resource/audience is needed for EXT-02 | same | — |
| UAT base URL | Frontend `https://<UAT_HOST>/expert-hub/`. API `https://<UAT_HOST>/api` | — | `EXPERT_HUB_API_BASE_URL=https://<UAT_HOST>/api` |
| Production base URL | — | Frontend `https://<PROD_HOST>/expert-hub/`. API `https://<PROD_HOST>/api` | `EXPERT_HUB_API_BASE_URL=https://<PROD_HOST>/api` |

⚠️ `EXPERT_HUB_OIDC_REDIRECT_URI` / `_POST_LOGOUT_REDIRECT_URI` in the env files
are read only by the **frontend** config, which requires a non-empty redirect URI
before it selects real sign-in (`oidcConfig.ts`). The URI that **FAST must
register** is the API callback above (`16_SSO_OIDC_CONFIGURATION.md`, `P-163`/`Q38`).

Other sign-in keys: `EXPERT_HUB_BOOTSTRAP_ADMINS` (first administrator, `P-181`),
`EXPERT_HUB_TRAINER_FAST_ROLES`, `EXPERT_HUB_OIDC_USE_PAR`.

Steps:
1. FAST registers the redirect and post-logout URIs above for the UAT client.
2. Set the values in the UAT env file plus `api.secrets.env`. Set `EXPERT_HUB_ENV=uat`.
3. Recreate both containers. The frontend must **start** (with no configuration error screen).
4. `GET /health/ready` returns `Healthy`.
5. Sign in as an internal user. `GET /api/v1/internal/readiness` shows `sso = READY`.
6. Sign in as a trainer. Internal pages refuse access (403).
7. Sign out. The browser returns to `https://<UAT_HOST>/expert-hub`.
8. Negative test: blank `EXPERT_HUB_OIDC_CLIENT_ID` on a copy. The frontend shows the configuration error naming the OIDC keys. `/api/auth/login` returns 503.

## FAST UAT checklist (EXT-02 / EXT-03)

References: `22_FAST_INTEGRATION_REQUEST.md` (the request to FAST) and
`21_FAST_REFERENCE_DATA.md` §8 (checks the owner can run).

1. Send `22_FAST_INTEGRATION_REQUEST.md` to the FAST API team and record the answers to A1–A10.
2. Confirm the grant type: fetch the STS discovery document and look for `client_credentials` (`21_` §8 check 2).
3. Confirm whether `Lookup/GetCountries` needs a token (`21_` §8 check 1).
4. FAST issues a **UAT-only** service client. The secret is delivered out-of-band and stored only in `env/api.secrets.env` (`EXPERT_HUB_FAST_CLIENT_ID`/`_SECRET`).
5. Expert Hub builds the token provider that replaces `NoFastToken`: a separate change, with tests, reviewed before deployment. **Until then steps 6–10 can't pass, and that is expected.**
6. Set `EXPERT_HUB_FAST_API_BASE_URL` for UAT. Readiness shows `fast = DEGRADED` (`WAITING_FOR_FAST_SERVICE_CREDENTIAL`) before step 5 and `READY` after it.
7. Wait for one sync (at start-up, then every `EXPERT_HUB_FAST_REFERENCE_SYNC_HOURS`, default 24). `GET /api/v1/internal/integration/reference-data` shows the last attempt, its outcome and the last success.
8. `GET /api/v1/reference-data/fast-country` returns FAST's values. `?includeInactive=true` keeps values that have been removed.
9. Failure drill: point the base URL at an unreachable host. The run records a failure and the previous values stay active.
10. Confirm no credential appears in `INTEGRATION_LOG`, API responses, logs or the frontend `config.js`.

**Don't activate Programme or Plan contracts (EXT-03) in UAT.** J-16 stays on manual entry until FAST supplies the contracts and a separate change is approved.

## Email UAT checklist (EXT-05)

Recipients are **never invented**. Every recipient comes from the approved routing
(BD-UAT-06) and the recipient's own user record.

1. Infrastructure supplies the gateway type, host, sender address and credentials (the secret goes out-of-band).
2. Expert Hub builds the `IEmailGateway` adapter (a separate change with tests).
3. The business approves routing for at least one test event (BD-UAT-06).
4. ⚠️ Before enabling, review the outbox. Routed messages queued while no gateway existed are still `Pending` and **will be sent** once the channel is configured. Decide whether to release or discard them.
5. Readiness shows `email = READY`.
6. Raise the approved test event for a UAT user whose mailbox the tester controls.
7. The message arrives once. The outbox row becomes `published` and `NOTIFICATION_LOG` records the send as `success`.
8. Failure drill: stop the gateway. The message stays `pending` with an increasing attempt count (exponential back-off). `NOTIFICATION_LOG` records `failure`, never `success`.
9. Offer expiry (J-18) still happens on time with the gateway stopped, because expiry does not depend on email.
