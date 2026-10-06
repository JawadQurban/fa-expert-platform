# Expert Hub API

## Overview

The ASP.NET Core 9 backend for Expert Hub: minimal-API modules, one per
capability, over EF Core 9 on SQL Server. It is also the backend-for-frontend for
sign-in — the OIDC flow runs here so no token reaches the browser. Three
projects: `ExpertHub.Api` (endpoints and composition), `ExpertHub.Infrastructure`
(persistence, integrations), `ExpertHub.Core` (domain, no dependencies).

## Key files

| File | Owns |
|---|---|
| `src/ExpertHub.Api/Program.cs` | Composition and the whole route table: `/api`, then `/api/v1` per capability |
| `src/ExpertHub.Api/Auth/AuthenticationSetup.cs` | OIDC + cookie session, role resolution at sign-in |
| `src/ExpertHub.Api/Auth/DatabaseTicketStore.cs` | Server-side session tickets, encrypted; the expired-ticket sweeper |
| `src/ExpertHub.Api/Auth/FeatureAuthorization.cs` | `.RequireFeature("F-xxxx")` — the CAP-08 matrix, read per request |
| `src/ExpertHub.Infrastructure/Persistence/ExpertHubDbContext.cs` | The DbSets, and the append-only / read-only rules enforced in `SaveChanges` |
| `src/ExpertHub.Infrastructure/Persistence/Configurations/*.cs` | Table and column names, indexes, delete behaviour, one file per capability |
| `src/ExpertHub.Infrastructure/Persistence/PersistenceServiceCollectionExtensions.cs` | Every `Add…` registration, including the integration seams and their off-by-default fallbacks |
| `src/ExpertHub.Infrastructure/Integration/OutboxPublisher.cs` | Outbox delivery, backoff, `INTEGRATION_LOG`, drift |
| `src/ExpertHub.Api/Assignments/OfferService.cs` | The offer state machine, and the conditional-claim pattern to copy |
| `src/ExpertHub.Core/Domain/*Codes.cs` | The closed vocabularies — statuses, roles, system codes, event codes |
| `tests/ExpertHub.Api.Tests/LocalDbFixture.cs` | The throwaway LocalDB database every integration test runs on |

## Conventions

- `dotnet build` && `dotnet test` from this folder before handing anything over.
  **Warnings are errors**, so a clean build is a warning-free build.
- One `Map…Endpoints` extension per capability, mounted in `Program.cs`. Handlers
  return `Results.*` and errors are Problem Details.
- Wire records (`…Wire`) are the client boundary; entities never leave.
- Business rules live in static classes that take the `DbContext`
  (`OfferService`, `ApplicationFormLogic`, `AgreementExpiryReminders`) — that is
  what the tests drive. There is no Application layer; see
  `docs/adr/0001-expert-hub-backend-does-not-follow-tfa-clean-architecture.md`.
- Audit rows and outbox messages are written in the **same** `SaveChanges` as the
  change they describe.
- A state transition claims its row with a conditional `ExecuteUpdateAsync`
  (`WHERE status = @expected`) — never read-check-write.
- `[LoggerMessage]` partial methods for logging, with stable event ids. No PII.
- An integration that is not configured is a **null object that reports
  `IsConfigured == false`**, never a half-built client, and the product behaves
  exactly as it did without it.
- Migrations are generated with `dotnet ef`, never hand-edited.

## Gotchas

- **`catch (Exception e) when (e is not OperationCanceledException)` does not do
  what it reads like.** An `HttpClient` timeout is a `TaskCanceledException`,
  which derives from it. Every filter here is written against the token
  (`|| !ct.IsCancellationRequested`); keep it that way, especially in a
  `BackgroundService`, where an escaped exception stops the host.
- **No concurrency tokens exist** in the model. The claim pattern and filtered
  unique indexes are the only protection; a unique-violation reaching the client
  is currently a 500, not a 409.
- **The process boots with no database on purpose.** `/health` stays healthy and
  `/health/ready` reports the gap — that is how a bootstrap administrator reaches
  a fresh deployment, and there is a test for it. Do not "fix" it into a crash.
- Business days are counted in **Riyadh** (`BusinessCalendar`), not UTC. Public
  holidays are still not subtracted — an open infrastructure ask.
- Tests need SQL Server LocalDB running (`sqllocaldb start MSSQLLocalDB`). They
  are Windows-only today, which is why there is no backend CI.
- `net9.0` is out of support; the target framework is one line in
  `Directory.Build.props`.
