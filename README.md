# Expert Hub — منصة الخبراء والمدربين

The Financial Academy's platform for managing independent experts and trainers
(`BRD-TRN-001`). It holds the whole relationship in one governed record:
application, screening, interview, committee accreditation, agreement,
assignment, engagement execution and entitlements. There is a trainer portal, a
staff workspace and a public trainer directory.

Arabic-first and RTL by default. It follows the Saudi DGA Platforms Code and
targets WCAG 2.2 AA.

## Repository layout

| Path | What it holds |
|---|---|
| [`backend/`](backend/) | ASP.NET Core 9 API, EF Core 9 on SQL Server. `ExpertHub.Api` / `.Infrastructure` / `.Core`, plus tests |
| [`frontend/`](frontend/) | React 19 + TypeScript SPA (Vite), with the FADS design system in `src/design-system/` |
| [`deploy/`](deploy/) | Dockerfiles, Nginx, Docker Compose, env templates, deploy scripts |
| [`docs/`](docs/) | Specification, journeys, decisions, ADRs, operations — see [`docs/README.md`](docs/README.md) |
| [`context/`](context/) | The present-tense reference set every engineering session loads |
| [`tools/data/`](tools/data/) | Scripts that generate reference data from the business workbooks in `docs/inputs/` |
| [`references/`](references/) | Figma design-token exports (the source for `npm run tokens:generate`) |

## Getting started

**Prerequisites:** .NET 9 SDK, Node 20+, and SQL Server (LocalDB on Windows for
the backend tests).

```bash
# Backend — warnings are errors, so a clean build is a warning-free build
cd backend
dotnet build
dotnet test                                  # needs: sqllocaldb start MSSQLLocalDB
dotnet run --project src/ExpertHub.Api

# Frontend
cd frontend
npm ci
npm run dev                                  # http://localhost:5173/expert-hub/
npm run validate                             # typecheck, lint, format, tests
npm run build
```

With no `apiBaseUrl` configured, the frontend runs on in-memory mock data, so the
UI can be worked on without the API.

## Deployment

The product ships as two containers, the frontend (Nginx) and the API, behind the
server's Nginx. Every setting comes from the environment, so one image serves
every environment, and secrets live only in `deploy/env/api.secrets.env`, which
is never committed. See [`docs/operations/DEPLOYMENT.md`](docs/operations/DEPLOYMENT.md).

## Engineering conventions

The rules a change is reviewed against are in
[`context/code-standards.md`](context/code-standards.md) and
[`context/ui-rules.md`](context/ui-rules.md). Architecture decisions are recorded
in [`docs/adr/`](docs/adr/), business rulings in
[`docs/DECISIONS.md`](docs/DECISIONS.md), and each working session's hand-off in
[`docs/sessions/`](docs/sessions/).

## History

This repository was extracted on 2026-10-06 from `financial-academy-hackathon`
(at commit `15bbe0c`), which also held the Financial Academy Innovation
Hackathon. Its earlier history, including the full changelog, stays in that
repository; superseded material is kept under [`docs/archive/`](docs/archive/).

© The Financial Academy. All rights reserved.
