# Changelog

Notable changes to Expert Hub. The format follows
[Keep a Changelog](https://keepachangelog.com/), and versions follow
[Semantic Versioning](https://semver.org/).

The history before this repository existed is in
[`docs/archive/CHANGELOG-before-extraction.md`](docs/archive/CHANGELOG-before-extraction.md).

---

## [1.4.0] — 2026-10-06 — Own repository

Expert Hub was extracted from `financial-academy-hackathon` (commit `15bbe0c`)
into this repository. Its behaviour is unchanged: the same API, the same
database and migrations (M01–M39), and the same container and volume names, so
an existing deployment switches over without data loss.

### Changed
- **Layout.** `backend/expert-hub` → `backend/`, `deploy/expert-hub` →
  `deploy/`, and the SPA (`frontend/src/apps/expert-hub`) is now the root of
  `frontend/src/`. There is one Vite config, one `index.html`, and the output
  is `dist/`.
- **npm scripts.** The `:expert-hub` variants are now plain `dev`, `build`,
  `test`, `lint`, `typecheck` and `validate`.
- **Docs** are grouped by purpose: `specification/`, `journeys/`
  (the Notion exports, renamed `J-NN-<title>.md`), `inputs/` (the business
  workbooks, with readable names), `operations/`, `reviews/`, `integrations/`,
  `design-system/`, `adr/` and `sessions/`. Superseded material is in
  `archive/`.
- **Data tools** moved from `docs/` to `tools/data/`.
- **CI** runs from the repository root: the frontend validates and builds, and
  the backend builds.

### Removed
- The Innovation Hackathon application, its handoff bundle and its working
  material, along with the import boundary that kept the two products apart.

## [1.3.x] — 2026-10-05 — Last releases in the previous repository

The trainer short bio (`P-331`), Claude for every AI use case (`P-332`),
concurrency claims and M37/M38, the 2026-10-01 business review, and FAST
service-to-service authentication. See the archived changelog for the details.
