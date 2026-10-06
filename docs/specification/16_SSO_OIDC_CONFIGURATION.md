# 16 — SSO / OpenID Connect configuration (INT-01)

**Status:** 🟡 Scaffolding built 2026-08-27. ⚠️ **FAST reports the client already
registered** (owner, 2026-08-30) against a presumed-stale URL — details unverified,
see the update below and `Q38`. **No code change is needed when the corrected
registration arrives** — see §4.

> ✅ **Update 2026-08-30, later** (`P-176`–`P-178`): FAST shared the **testing
> identity details** — authority `https://testingauth.fa.gov.sa/identitymanagement.sts`,
> client id `ReactApp` — now wired into `local.env` and the backend dev launch
> profiles. **The flow is portal-first and silent (`P-178`)**: the user signs
> in on the testing portal (`testingdashboard.fa.gov.sa` — whose own callback
> is the registered `…/callback`), is sent to Expert Hub, and our BFF
> challenge completes **silently** against the STS session — no second login
> screen; the login page auto-starts that handshake. Sign-in is **SSO-only**
> (`P-177`). ⚠️ The one remaining ask: register
> `https://experts.fa.gov.sa/api/auth/callback` (plus a localhost callback for
> development) so the silent leg can return to us — `Q38`.
>
> ⚠️ **Update 2026-08-30** (`P-164`→`P-179`, `P-165`): the base-path ruling was
> **corrected the same day** — the testing server serves Expert Hub at
> **`https://experts.fa.gov.sa/expert-hub/`** (`P-179`; the earlier root ruling
> `P-164` is superseded), so this document's `/expert-hub`-prefixed URIs apply
> as written and the default build needs no base-path flag. The URI to register
> is unchanged either way: **`https://experts.fa.gov.sa/api/auth/callback`** —
> the API route (`P-163`, `Oidc:CallbackPath`), independent of the SPA base.
> FAST's registration status and the ask are tracked as `Q38`.

> ⚠️ **Read §3 first.** Later the same day the backend was decided (`P-162`),
> which moves the OIDC flow into the API (`P-163`) and changes the redirect
> URI to register. The frontend configuration below is still correct and still
> used — the API base URL and session handling are read from it — but the
> **client registration should be done against the API's callback**, not the
> SPA's. Test origin: `https://experts.fa.gov.sa` (`deploy/env/local.env`).

> **Why this document exists.** The FAST team uses OpenID Connect. The
> configuration layer is now built so that handing over a client id is an edit to
> an environment file, not a release. What is *not* built is the adapter that
> performs the flow — §6 is explicit about that.

---

## 1. ⚠️ First, a correction to make before FAST issues the client

The redirect URL sent to FAST was **the landing page**. That will not work as an
OIDC `redirect_uri`, for two reasons:

1. The provider returns the browser to that URL carrying `?code=…&state=…`. The
   landing page is a public marketing page that does not read those parameters,
   so the login would complete at the identity provider and then silently do
   nothing.
2. An authorization code is single-use and short-lived, but it is still a
   credential in transit. It belongs on a route whose only job is to consume it —
   not on the most-linked, most-shared page in the product.

Expert Hub already has that route: **`/expert-hub/auth/callback`**
(`expertHubPaths.authCallback`, with `AuthCallbackPage` behind it).

**Ask FAST to register the URLs in §2 instead.** If they have already registered
the landing page and changing it is difficult, it still works — set
`EXPERT_HUB_OIDC_REDIRECT_URI` to whatever they registered, because the redirect
URI is configuration precisely so that their decision wins without a code change.
It is worth one message to get it right first.

---

## 2. What to send the FAST team

### Redirect URIs to register

Replace the hosts with the real ones. They must match **character for
character** — a trailing slash difference is a rejected login.

| Environment | `redirect_uri` | `post_logout_redirect_uri` |
|---|---|---|
| Development | `http://localhost:5173/expert-hub/auth/callback` | `http://localhost:5173/expert-hub` |
| UAT | `https://<uat-host>/expert-hub/auth/callback` | `https://<uat-host>/expert-hub` |
| Production | `https://<prod-host>/expert-hub/auth/callback` | `https://<prod-host>/expert-hub` |

✅ **Corrected 2026-08-30 (`P-179`, superseding `P-164`)**: the testing server
serves Expert Hub at **`https://experts.fa.gov.sa/expert-hub/`**, so the rows
above apply as written. Per `P-163` the URI to register remains the **API
callback**, `https://experts.fa.gov.sa/api/auth/callback` — independent of the
SPA base path.

### Client type

**Public client, Authorization Code + PKCE.** Not implicit, not hybrid.

Say this explicitly when registering: some providers default a new client to
*confidential* and issue a secret, and a secret is unusable here — see §3.

### Scopes requested

`openid profile email`

`openid` is required by the specification. If the Academy uses a different scope
to release role claims, ask for its name and add it to
`EXPERT_HUB_OIDC_SCOPES` — that is a config edit.

---

## 3. ⚠️ The client secret question

> **SUPERSEDED 2026-08-27 by `P-163`, later the same day.** The backend was
> committed (`17_STACK_DECISION.md`), so **the OIDC flow moves into the Expert
> Hub API** and **either client type now works** — register whichever FAST
> prefers. A secret is fine, because the API is the one component that may
> hold one. What follows still governs **this frontend**: no secret may ever
> reach `config.js`, and the guards below stay.
>
> ⚠️ **The redirect URI changes with it** — it becomes an API route rather
> than the SPA callback in §2. Settle the exact path before FAST registers
> the client; re-registering later is a request to another team.

**If FAST issues a client secret, stop and tell them the client type is wrong —
or move the flow to the backend.**

A browser application cannot keep a secret. Everything the frontend holds is
downloaded to the user's machine and readable in developer tools, so a secret
placed in `config.js` is a *published* secret. `CLAUDE.md` states the rule:
never put secrets, credentials, or FAST / MTM / ERP / SQL values in the frontend.

This is enforced, not just documented:

- `OidcConfig` **has no field** that could hold a secret, and a test asserts no
  key matches `/secret|password|credential|privatekey/`.
- The container entrypoint **refuses to start** if
  `EXPERT_HUB_OIDC_CLIENT_SECRET` is set, so the mistake is loud.

If the Academy's policy requires a confidential client, that is a legitimate
choice — but then the authorization-code exchange belongs in the **Expert Hub
API**, which holds the secret and hands the browser an HttpOnly session cookie.
That is a backend task (playbook PB-19, INT-01), and it is arguably the better
architecture anyway: `02C` already says the frontend talks only to the Expert Hub
API and never to SSO directly.

**This is a decision to take deliberately, not discover during integration.**

---

## 4. What FAST sends back, and where each value goes

Every one of these is an edit to `deploy/env/<environment>.env`.
No rebuild, no image change, no code edit.

| From FAST | Variable |
|---|---|
| Issuer URL (`iss`) | `EXPERT_HUB_OIDC_ISSUER` |
| Discovery URL, only if non-standard | `EXPERT_HUB_OIDC_DISCOVERY_URL` |
| **Client ID** | `EXPERT_HUB_OIDC_CLIENT_ID` |
| Granted scopes, if different from requested | `EXPERT_HUB_OIDC_SCOPES` |

Then restart the container:

```bash
docker compose --env-file deploy/env/production.env up -d --force-recreate
```

While `EXPERT_HUB_OIDC_CLIENT_ID` is empty the app stays on its **development
sign-in placeholder** — it does not half-attempt a real login, because a
partly-configured client fails in ways that look like an outage.

---

## 5. The claim contract — still open (`G16` / `G28`)

Authentication tells us *who* the user is; Expert Hub decides *what they may do*
(`BR-0808`, P-133, and CAP-08). The one thing we need from the token is enough to
resolve the coarse access role — `trainer` (self-service) or `internal`
(operational) — after which the platform's own role×permission matrix takes over.

**Ask FAST:**

1. **Which claim carries the user's role or group membership?** (`roles`,
   `groups`, a namespaced claim, …) → `EXPERT_HUB_OIDC_ROLE_CLAIM`
2. **What are its values** for Academy staff versus external trainers?
   → `EXPERT_HUB_OIDC_INTERNAL_ROLE_VALUES` / `EXPERT_HUB_OIDC_TRAINER_ROLE_VALUES`
3. **Which claim is the stable user identifier?** `sub` is the specification's
   answer; confirm it is stable across sessions and not reassigned.
4. **Which claim carries the display name**, and is there an Arabic form?
   → `EXPERT_HUB_OIDC_NAME_CLAIM`
5. **Is the role claim in the ID token, or only from the userinfo endpoint?**
   That decides whether one round trip is enough.
6. **Session lifetime and refresh.** How long is a session valid, is there a
   refresh token for a public client, and is there front-channel or back-channel
   logout?

Claim **names and values are both configuration** for exactly this reason: when
the answers arrive they are an env-file edit, not a release.

---

## 6. ⚠️ What is built, and what is not

**Built (2026-08-27):**

- `app/config/oidcConfig.ts` — the typed client configuration, its validation,
  and `isOidcConfigured()`. No secret field; no way to downgrade the flow.
- `app/config/runtimeConfig.ts` — the ten new runtime values.
- `deploy/config.js.template` + `docker-entrypoint.sh` — injection at
  container start, and the secret guard.
- `deploy/env/{development,uat,production}.env` — the files to edit.
- `oidcConfig.test.ts` — 14 tests, including the no-secret guarantee.

**Built (2026-08-30, BE-02 — `0d8d842`):** the flow itself, **in the API**
(`P-163` settled where; `Q36` is closed). The framework's OpenIdConnect handler
runs Authorization Code + PKCE and validates `iss`/`aud`/`exp`/`nbf`, the
signature against JWKS, `nonce` and `state`; the browser holds an HttpOnly
cookie and never a token. Endpoints: `GET /api/auth/login` · `GET
/api/auth/session` · `POST /api/auth/logout` (+ the middleware-owned callback).
The **`academySsoAdapter`** now exists on the frontend (`app/auth/academySsoAdapter.ts`)
— a BFF client of those three endpoints — and `authMode` selects it once both
`apiBaseUrl` and the client are configured (`P-168`), failing closed to the
development placeholder until then. The claim mapping is configuration on the
**API** side too (`Oidc__RoleClaim` and friends), and an unmapped value grants
no role. The whole handshake is proven in tests against a fake identity
provider with a genuinely signed ID token.

So the honest statement of §4's promise now: **config-only holds end to end.**
What remains is not code — it is `Q38` (what FAST actually registered, and the
re-registration of `https://experts.fa.gov.sa/api/auth/callback`) and `Q37`
(the claim contract, the session lifetime, and the logout arrangements), every
one of which lands as an env-file edit.

---

*Related: `02C` (integration architecture) · `08_BACKEND_ARCHITECTURE` §2.3
(authentication vs authorization) · `DECISIONS.md` P-04, P-133 · `TODO.md`
`G16`/`G28` · playbook PB-19.*
