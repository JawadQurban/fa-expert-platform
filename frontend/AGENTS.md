# Expert Hub — web client

## Overview

The Expert Hub SPA: three interfaces over one route tree. They are the trainer
portal, the staff workspace (`/internal/*`) and the public pages (the landing
page and the trainer directory). It is built into its own container image and
served under `EXPERT_HUB_BASE_PATH`.

## Key files

| Path                           | Owns                                                                                      |
| ------------------------------ | ----------------------------------------------------------------------------------------- |
| `src/main.tsx`                 | The entry point (`index.html` → `vite.config.ts`)                                         |
| `src/app/router/`              | The route tree and the path registry (`paths.ts`)                                         |
| `src/app/config/`              | Runtime configuration and per-module live/mock switching                                  |
| `src/features/*/`              | One folder per capability: its service (HTTP + mock provider), types, content and screens |
| `src/shared/`                  | App infrastructure: the API client, session, formatting, workspace layout pieces          |
| `src/design-system/`           | FADS — see its own `AGENTS.md`                                                            |
| `src/contracts/fixtures/`      | Wire samples the backend tests also read, so both sides agree on a shape                  |
| `src/test/renderExpertHub.tsx` | Mounts the real route tree inside the real providers, session seeded                      |

## Conventions

- Validate with `npm run validate` (typecheck, lint, format, tests) and
  `npm run build`.
- Aliases: `@/*` (src), `@ds/*`, `@i18n/*`, `@hooks/*`, `@utils/*`, declared in
  both `tsconfig.app.json` and `vite.config.ts`, and kept in sync.
- The base path comes from `EXPERT_HUB_BASE_PATH`
  (`VITE_EXPERT_HUB_BASE_PATH`, default `/expert-hub`) and is mirrored by Vite's
  `base`. Never hardcode it.
- Runtime values come from `window.__EXPERT_HUB_RUNTIME_CONFIG__` (`config.js`,
  rendered per container), never from the build, and never a secret.
- Every API call goes through a feature service over `shared/services/apiClient.ts`,
  which returns `Result<T, ExpertHubApiError>`: render the error, never throw.
  Each service has a mock provider with the same contract, and the server's
  problem `detail` arrives as `error.message`.
- Numbers and dates go through `shared/formatting.ts` only (Latin digits, G-02).
  `formatting.test.ts` fails the build on a stray `Intl` formatter or `'ar-SA'`.
- Tests live beside their source as `*.test.tsx` and render through
  `renderExpertHub`, asserting what the user sees rather than component
  internals.
- Every screen is Arabic-first and RTL-correct, composed only from design-system
  components and tokens. Creativity comes through composition, never new visual
  primitives.
- Every failed page says what failed, and an empty state is a design-system
  `EmptyState`, not a bare sentence.

## Gotchas

- Tests run without file parallelism (`vite.config.ts`). Keep it that way: the
  suite shares session storage.
- The session cookie is set by the API on its own origin, so API calls go with
  credentials and the API's CORS allow-list must name this origin. A new
  environment needs both.
- Uploads go to the API, which caps the body at 25 MB, but the **server** Nginx
  caps it at 1 MB by default. A failing upload is usually that, not the code.
