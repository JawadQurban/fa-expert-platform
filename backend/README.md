# Expert Hub backend

ASP.NET Core + EF Core + SQL Server. The stack decision and its reasoning are in
[`docs/specification/17_STACK_DECISION.md`](../docs/specification/17_STACK_DECISION.md)
(`P-162`).

```bash
cd backend
dotnet build          # warnings are errors
dotnet test           # needs SQL Server LocalDB: sqllocaldb start MSSQLLocalDB
dotnet run --project src/ExpertHub.Api
```

## Layout

| Project | Holds |
|---|---|
| `src/ExpertHub.Api` | The host: endpoints, DI, auth, configuration |
| `src/ExpertHub.Core` | Domain entities and contracts shared across capabilities |
| `src/ExpertHub.Infrastructure` | EF Core, SQL Server, integrations |
| `tests/ExpertHub.Api.Tests` | Boots the real `Program` via `WebApplicationFactory` |

**Modular monolith, one module per capability** (`D-01`). The twelve capabilities
are the boundaries — capability *folders* inside these projects, not twelve
assemblies. They share a database and transactional boundaries (an accreditation
decision writes across CAP-01/02/03), and nothing in the BRD asks for independent
deployment.

## ⚠️ Two things to know before adding code

**No secret is ever committed.** Connection strings and the OIDC client secret
come from the environment or the platform's secret store —
`ConnectionStrings__ExpertHub`, `Oidc__ClientSecret`. `appsettings.json` names
the keys and leaves them empty, and a test fails the build if a value appears.
Locally, use user-secrets:

```bash
dotnet user-secrets set "ConnectionStrings:ExpertHub" "Server=...;Database=ExpertHub;..." \
  --project src/ExpertHub.Api
```

**The target framework is a known debt.** It is `net9.0` because that is what
this machine's SDK builds, and **.NET 9 is STS — its support ended in May 2026**.
It must move to the current LTS before release. That is one line in
[`Directory.Build.props`](Directory.Build.props), because nothing else names a
framework version. See §4 of the stack decision for the infrastructure questions
that should be answered first.

## Next

`PB-19` (INT-01) — the OIDC flow, which per `P-163` lives here rather than in the
browser. It is the recommended first increment: it is small, everything else
needs a signed-in user, and the owner wants to test against the FAST testing
identity provider. Then `PB-09`, schema migration 01.
