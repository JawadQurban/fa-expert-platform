# Database — SQL Server + EF Core

**Function:** How Expert Hub stores data, and the conventions specific to its
persistence layer.

## Setup / connection

- SQL Server, reached through EF Core 9 (`Microsoft.EntityFrameworkCore.SqlServer`).
- One context: `ExpertHubDbContext` (`backend/src/ExpertHub.Infrastructure/Persistence/`),
  registered scoped by `AddExpertHubPersistence`.
- The connection string comes from the environment as `ConnectionStrings__ExpertHub`,
  never from `appsettings.json`. **With no connection string the context is
  registered provider-less on purpose:** the process boots, `/health` stays
  healthy, and `/health/ready` reports the database as the missing piece.
- `Database__AutoMigrate` (default `true` in compose) applies migrations at
  startup. A failure is logged and the process keeps serving.
- Tests run against a real database — SQL Server LocalDB, one throwaway
  database per test, migrated and dropped (`tests/ExpertHub.Api.Tests/LocalDbFixture.cs`).
  There is no in-memory provider, deliberately: the constraints under test
  (CHECK, unique indexes, NOT NULL) do not exist there.

## Conventions

- **Table and column names are SCREAMING_SNAKE_CASE and set explicitly**
  (`APPLICATION`, `applicant_user_id`) in `Persistence/Configurations/*.cs`, one
  `IEntityTypeConfiguration<T>` file per capability. They match
  `docs/specification/10_DATABASE_DESIGN.md` one to one — renaming in code only
  breaks that correspondence.
- **Migrations are generated, never hand-written.** `dotnet ef migrations add`
  from `backend`. They are marked `generated_code = true` in
  `.editorconfig`, so analyzers do not run on them.
- **Append-only tables are enforced in `SaveChanges`.** `AUDIT_LOG`,
  `NOTIFICATION_LOG`, `NOTIFICATION_OCCURRENCE`, `INTEGRATION_LOG`, the
  agreement document and template versions, and the signing evidence throw
  `InvalidOperationException` on update or delete. `REFERENCE_VALUE` throws on
  delete — retirement is `is_active = false`.
- **Append-only and read-only tables expose no writable `DbSet`.** Reads go
  through an `IQueryable` property that already applies `AsNoTracking()`; writes
  go through an `Append…` method. CAP-06's entitlement sets are `internal` so
  only the ERP importer can reach them.
- **An audit row is written in the same `SaveChanges` as the change it records**
  (`BR-0806`), never afterwards.
- **An outbox message is written in the same transaction as the business change**
  it announces; the publisher delivers it later.
- A state transition claims its row with a conditional `ExecuteUpdateAsync` —
  see *A workflow state transition claims its row* in `code-standards.md`.

## Gotchas

- **No entity carries a concurrency token.** There is no `rowversion` and no
  `IsConcurrencyToken` anywhere in the model, so a lost update is prevented by
  the conditional claim and by filtered unique indexes, not by EF.
- **Retry on failure is off.** `UseSqlServer` is called without
  `EnableRetryOnFailure`. Turning it on requires wrapping the two explicit
  transactions (`OfferService`, `EngagementEndpoints`) in
  `CreateExecutionStrategy`, or they throw at runtime.
- **Reads are tracked by default.** `AsNoTracking()` is used in few places. Do
  not flip the context-wide default to fix this: existing write paths rely on
  tracking and would silently stop saving.
- `InvariantGlobalization` is `false` because Arabic collation and formatting
  matter; do not re-enable it for a smaller image.
