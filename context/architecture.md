# Architecture

**Function:** Describes the project's overall architecture *as it stands
today* — stack, structure, deployment. Present-tense only. When architecture
changes, this file is rewritten to reflect the new current state; the
reasoning for the change lives in `docs/adr/`, not here.

---

## Stack

**Frontend** — React 19 + TypeScript 5.7, Vite 6, React Router 7, i18next 24 /
react-i18next 15, CSS Modules with design tokens (no CSS framework), Vitest 3 +
Testing Library + axe-core, Storybook 8.6, ESLint 9 + Prettier 3, Husky.

**Backend (Expert Hub)** — ASP.NET Core 9 minimal APIs, EF Core 9 on SQL Server,
xUnit 2.9 + `Microsoft.AspNetCore.Mvc.Testing`. Nullable reference types on,
`TreatWarningsAsErrors`, `EnforceCodeStyleInBuild`, `AnalysisLevel` =
`latest-recommended`. ⚠️ `net9.0` left support in May 2026; the target framework
is one line in `backend/Directory.Build.props`.

## Folder Structure

```
backend/                     the API — ExpertHub.Api / .Infrastructure / .Core + tests  ← AGENTS.md
frontend/                    the SPA                                                   ← AGENTS.md
  src/app/                   router, path registry, runtime config
  src/features/              one folder per capability (service, types, content, screens)
  src/shared/                API client, session, formatting, workspace layout
  src/design-system/         FADS components, tokens, Figma registry                   ← AGENTS.md
  src/i18n|hooks|utils|types|assets/
deploy/                      Dockerfiles, nginx, compose, env templates, scripts
docs/                        specification/, journeys/, DECISIONS.md, adr/, sessions/, operations/
context/                     this reference set (loaded every session)
tools/data/                  reference-data generators reading docs/inputs/
```

## System Boundaries

- **App → design system, one way.** `src/design-system` may not import the
  app (`@/app/*`, `@/features/*`); ESLint's `no-restricted-imports` enforces it.
- **Frontend → backend** only through `src/shared/services/apiClient.ts`, and
  only to the API base URL. The browser holds no secret and no token.
- **Backend layering** — `ExpertHub.Api` (endpoints, composition) →
  `ExpertHub.Infrastructure` (EF Core, integrations) → `ExpertHub.Core` (domain,
  no dependencies). Note that this is *not* the TFA Clean Architecture layering;
  see `docs/adr/0001-expert-hub-backend-does-not-follow-tfa-clean-architecture.md`.
- **Every crossing to another system goes through CAP-12's integration hub** —
  the outbox, the channel router and `INTEGRATION_LOG` — so no capability grows
  its own ad-hoc client.

## System overview

- **Expert Hub SPA** — three interfaces (trainer portal, internal dashboard,
  public) over one route tree, mounted under `VITE_EXPERT_HUB_BASE_PATH`
  (default `/expert-hub`, `''` for root). Runtime configuration arrives as
  `window.__EXPERT_HUB_RUNTIME_CONFIG__` from the container's `config.js`, so one
  image serves every environment.
- **Expert Hub API** — minimal-API modules, one per capability, mounted on
  `/api/v1`. It is also the backend-for-frontend for sign-in: the OIDC flow runs
  here and the browser gets only an HttpOnly session cookie.
- **Background workers** — the outbox publisher, offer expiry, agreement expiry
  reminders, the FAST reference sync and the expired-session sweeper. Each runs on
  a `PeriodicTimer`, takes a fresh DI scope per tick, and is idle when no database
  is configured.
- **External systems** — one file each in `context/integrations/`: INT-01
  identity, INT-02 MTM, INT-03 ERP, INT-04 email, INT-05 FAST, INT-06 AI, plus
  Teams meetings and the database.

## Data & domain model

One SQL Server database behind `ExpertHubDbContext`, about 80 tables grouped by
capability. Conventions and the rules the context enforces structurally are in
`context/integrations/database.md`; the field-level design is
`docs/specification/10_DATABASE_DESIGN.md`.

The generated diagram is **[`docs/schema.d2`](../docs/schema.d2)** — render with
`d2 --layout=elk docs/schema.d2 docs/schema.svg`. Regenerate it with
`/fa:efcore-d2-db-diagram` after a migration; never hand-edit it.

Core objects: `APPLICATION` (the spine — one undecided application per person) →
`SCREENING_RESULT` → `INTERVIEW` → `ACCREDITATION_DECISION` → `AGREEMENT` →
`TRAINER_PROFILE` → `ASSIGNMENT_REQUEST` → `ASSIGNMENT_SLOT` →
`ASSIGNMENT_OFFER` → `ENGAGEMENT` → `ENTITLEMENT`. Around them: `APP_USER` /
`ROLE` / `PERMISSION` / `USER_ROLE` (CAP-08), `NOTIFICATION_*` and `SLA_*`
(CAP-07), `OUTBOX_MESSAGE` / `INTEGRATION_LOG` / `REPLICATION_STATE` (CAP-12),
and the append-only `AUDIT_LOG`.

## Deployment

```
Browser → server Nginx → Expert Hub containers (frontend 8085, API 8086, both bound to 127.0.0.1)
                                      ↓
                              SQL Server (managed, or the compose `db` profile)
```

- Multi-stage Docker builds from the repository root:
  `deploy/Dockerfile` (frontend → container Nginx) and
  `api.Dockerfile`. Orchestrated by `deploy/docker-compose.yml`;
  per-environment values in `deploy/env/*.env`, with secrets in the
  uncommitted `env/api.secrets.env`.
- Volumes that must survive a redeploy: the data-protection keys and the uploaded
  documents. Both are named volumes, not binds into the image.
- Scripts: `deploy/scripts/{build,deploy,rollback,verify}-expert-hub.sh`.
  They touch the Expert Hub containers only — never a repo-wide
  `docker compose down`.
- EF migrations are applied at startup when `Database__AutoMigrate` is on (the
  compose default).
- **CI covers the frontend only** — `frontend/.github/workflows/ci.yml` on push
  to `main` and on pull requests: `typecheck`, `lint`, `format:check`,
  `coverage`, `tokens:validate`, `build`, `build-storybook`. There is **no
  backend workflow**: `dotnet build` and `dotnet test` from `backend`
  are run by hand. Pre-commit runs `lint-staged` through Husky.
- Full guide: `docs/operations/DEPLOYMENT.md`.

## Related decisions

See `docs/adr/` for the history and reasoning behind these choices.
