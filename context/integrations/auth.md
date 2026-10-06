# Auth — INT-01, the Academy identity provider (FAST / IMS)

**Function:** How a person signs in to Expert Hub, and the conventions that keep
the session safe.

## Setup / connection

- OpenID Connect, **Authorization Code + PKCE, run by the API** — never the
  browser (`P-163`). Wired in
  `backend/src/ExpertHub.Api/Auth/AuthenticationSetup.cs` with the
  framework's `AddOpenIdConnect`, because `iss`/`aud`/`exp`/`nbf`/signature/
  `nonce`/`state`/PKCE validation is what a hand-rolled flow gets subtly wrong.
- Routes: `/api/auth/login`, `/api/auth/session`, `/api/auth/logout`. The
  provider callback is the middleware's own, at `Oidc:CallbackPath`, fixed to
  `/api/auth/callback` because that absolute URL is what is registered with FAST.
- Configuration is `Oidc__*` environment variables. `Oidc__ClientSecret` exists
  only in the environment or the secret store. An empty secret is valid — a
  public client, still protected by PKCE.
- The browser holds one cookie, `ExpertHub.Session`: HttpOnly, SameSite=Lax,
  Secure on every https request. **The ticket itself lives in the database**
  (`SESSION_TICKET`) through `DatabaseTicketStore`, so the cookie is one GUID.

## Conventions

- **An API answers with a status code, never a redirect to the provider.** The
  cookie scheme's `OnRedirectToLogin`/`OnRedirectToAccessDenied` return 401 and
  403. Only `/api/auth/login` challenges the OIDC scheme, and it names it.
- **Roles are Expert Hub's own data, not claims** (`P-181`). FAST's token
  carries identity only (`sub`, `email`); roles are resolved from `USER_ROLE` at
  sign-in and added as claims for the session. The claim-mapping options
  (`Oidc__RoleClaim` and the two value lists) still work and are honoured first.
- **Fail closed.** An unmapped claim value grants nothing. If the database is
  unreachable, only the bootstrap administrator list applies and everyone else
  signs in role-less — and that is now logged (event 5103).
- `Access__BootstrapAdministrators` is the only way a first administrator
  exists, because an empty `USER_ROLE` table can authorize nobody to fill it.
- **No credential is ever stored.** The access and refresh tokens are dropped at
  `OnTicketReceived`; only the id token is kept, for `id_token_hint` at logout.
- The session ticket payload is encrypted with `IDataProtector` before it is
  stored. `TicketSerializer` alone does not encrypt — in the cookie that was the
  cookie handler's job, and a session store sits behind it.

## Gotchas

- **Data-protection keys must outlive the container.** They encrypt the session
  cookie and the ticket payload; compose mounts them on a volume
  (`deploy/docker-compose.yml`). Lose them and every session is
  invalid — the "users are logged out after every deploy" failure.
- **The ticket store exists because the cookie got too big.** With every claim
  and saved token in it, the cookie chunked across `…C1`, `…C2` and nginx
  answered `400 Request Header Or Cookie Too Large` (2026-09-06).
- Sign-in still works with no database, on purpose: that is how a bootstrap
  administrator reaches a fresh deployment. There is a test for it.
- A role granted while someone is signed in reaches them at their next sign-in,
  because session roles are a snapshot. Feature permissions are read from the
  database per request, so those take effect immediately.
- The full FAST-side facts, registration asks and open questions live in the
  `fast-sso-integration` skill and `docs/specification/16_SSO_OIDC_CONFIGURATION.md`.
