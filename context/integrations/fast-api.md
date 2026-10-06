# FAST — INT-05, the Academy's own platform API

**Function:** How Expert Hub reads the Academy's record of a person, and the
conventions around that boundary.

## Setup / connection

- `FastApiClient` (`backend/src/ExpertHub.Infrastructure/Fast/`), a
  singleton over one long-lived `HttpClient` with
  `PooledConnectionLifetime` set and `Fast:TimeoutSeconds` (default 30) as the
  timeout.
- Configured by `Fast__BaseUrl`. **Empty means off:** every call fails closed
  with a reason and the product behaves as it did before. `/health/ready` and the
  internal provider-readiness endpoint report it.
- Readers, one per shape, all scoped: `FastUserReader`, `FastQualificationsReader`,
  `FastContractsReader`, `FastReferenceReader`. `FastCountryReader` is a
  **singleton** because it caches FAST's country table, which is the same for
  everyone.
- `FastReferenceDataSync` + its worker copy FAST reference lists into
  `REFERENCE_VALUE` on a schedule (`Fast:ReferenceSyncIntervalHours`, default 24).

## Conventions

- **Every FAST endpoint is scoped to the authenticated caller's own token.** The
  one moment Expert Hub holds an access token is `OnTicketReceived` at sign-in,
  where the base profile is read and the token is then discarded (`P-215`).
- The replica (`FAST_PROFILE_REPLICA`) is therefore only as fresh as the
  person's last sign-in, and staff cannot read anyone else's profile. That cost
  is accepted and recorded, not hidden.
- **FAST masters what it masters.** Replicated fields are read-only in Expert
  Hub; a change request against a FAST-owned field throws
  `MastershipViolationException`.
- A reference list joins the synchronized set only once its FAST contract is
  documented — a guessed request body is not a contract
  (`FastReferenceLists.All`).
- Failures are recorded, never thrown at the caller: `FastResult.Failure(reason)`.

## Gotchas

- **Two ways a call is authenticated, never mixed.** The sign-in read uses the
  person's own token (`GetWithTokenAsync`); everything else goes through
  `IFastTokenProvider`, which is `ClientCredentialsFastTokenProvider` (OAuth
  client credentials, token cached until 60 s before expiry) when
  `Fast__ClientId` **and** `Fast__ClientSecret` are set, and `NoFastToken`
  otherwise — then the reference sync records
  `WAITING_FOR_FAST_SERVICE_CREDENTIAL`. `Fast__Scope` is sent when set (the STS
  advertises `fast_integration`); the token endpoint is discovered from
  `Fast__Authority`, defaulting to `Oidc__Authority`. Still unconfirmed by FAST:
  whether `/fa-api` endpoints accept a service-principal token at all (A10 in
  `22_FAST_INTEGRATION_REQUEST.md`). An endpoint scoped to «the current user»
  answers about the service principal when called as one.
- Sign-in makes several FAST calls in sequence, so FAST's latency is sign-in
  latency.
- A timeout arrives as `TaskCanceledException`, which **is** an
  `OperationCanceledException` — see the catch-filter rule in
  `code-standards.md`. Every catch here is written against the token.
- `LastError` on a failed sync holds raw exception text and is readable by
  internal users; keep provider detail out of messages that could carry a
  credential.
