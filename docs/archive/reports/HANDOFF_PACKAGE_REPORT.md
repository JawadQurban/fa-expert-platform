# Handoff Package Report — Standalone Hackathon Landing Page

> Scope: created a standalone, isolated frontend package containing only what's
> required to run, maintain, and integrate the Hackathon landing page. The
> existing FADS design system and the original application were **not**
> modified, deleted, or altered in any way — see §9.

## 1. Handoff package location

```
handoff/hackathon-landing-page/
```

At the repository root, sibling to `frontend/`, `docs/`, `reports/` — outside
the existing frontend source tree, per instruction. It is a fully independent
npm project (its own `package.json`, `node_modules`, `dist`) with zero imports
pointing back into `frontend/`, `docs/`, `references/`, or `reports/` (verified
by grep — see §7).

## 2. Files included

Full file-by-file manifest with justification lives in the package itself:
`handoff/hackathon-landing-page/FILE_MANIFEST.md`. Summary:

- 9 components (`Button`, `Card`, `Container`, `Divider`, `Footer`, `Header`,
  `Icon`, `Section`, `Typography`) — each extracted verbatim (markup/props/CSS
  unchanged) from the FADS design system, only import paths adjusted.
- 1 page (`HomePage.tsx` + `.module.css` + `.test.tsx`) — extracted verbatim
  from `frontend/src/pages/HomePage.tsx`.
- 3 providers (`Theme`, `Direction`, `Locale`) — `Locale` was **rewritten**
  (not copied) to drop the `i18next` dependency; see §3.
- 1 frozen token stylesheet (`src/styles/tokens.css`) — 193 of 280 `--fads-*`
  tokens, mechanically extracted (see §4).
- 16 icon SVGs + a hand-written 16-entry registry (`src/components/Icon/icons.ts`).
- Content/config: `branding.ts`, `hackathonLanding.ts` (both adjusted), and a
  new `src/config/integration.ts` for the two CTA URLs.
- Test infra: `test/setup.ts`, `test/test-utils.tsx`, `HomePage.test.tsx` (13
  tests, unchanged assertions), `App.test.tsx` (2 new tests for the new shell).
- New app shell: `App.tsx` (provider composition + skip-link/main landmark,
  no router), `main.tsx`.
- 5 documentation files: `README.md`, `INTEGRATION_GUIDE.md`,
  `CONTENT_AND_BRANDING_GUIDE.md`, `BACKEND_HANDOFF.md`, `FILE_MANIFEST.md`.
- Standard project config: `package.json`, `tsconfig*.json`, `vite.config.ts`,
  `eslint.config.js`, `.prettierrc.json`, `.gitignore`, `index.html`,
  `public/favicon.ico`.

## 3. Files intentionally excluded

Per instruction, none of the following were copied:

- The full FADS design-system source — only the 9 components above.
- Figma specifications (`docs/FIGMA_*_SPECIFICATION.md`) and visual
  compliance reports (`reports/VISUAL_COMPLIANCE/**`).
- Design-system governance docs (`docs/VISUAL_COMPLIANCE_WORKFLOW.md`,
  `docs/COMPONENT_APPROVAL_MATRIX.md`, `docs/DESIGN_CONSTRAINTS.md`, etc.).
- Storybook (config, `.stories.tsx` files, `storybook-static`).
- Design-system component tests for the 26 unused components.
- Figma MCP configuration / Claude configuration.
- Raw Figma icon exports (`scripts/icon-raw/`) and the icon-import pipeline
  (`scripts/import-icons.mjs`).
- The token-generation source pipeline (`scripts/generate-tokens.mjs`,
  `references/figma/foundations/*.tokens.json`) — only its frozen _output_
  (the subset of tokens actually used) ships.
- 221 of the 237 icons in the source registry.
- 26 of the 35 design-system components (Accordion, Tabs, Alert,
  Notification, Loading, Pagination, Steps, EmptyState, ErrorState, Toast,
  Modal, Table, FileUploader, DatePicker, Breadcrumbs, NavDrawer, Link, Tag,
  TextInput, Textarea, Select, Checkbox, Radio, Switch, Tooltip, Avatar).
- All root-level internal docs/reports (`CHANGELOG.md`, `CLAUDE.md`,
  `docs/PROJECT_STATUS.md`, `docs/PROJECT_READINESS_REPORT.md`, etc.).
- `.env` files, credentials, access tokens (none existed for this frontend-
  only page; none are needed since it makes no API calls).
- `i18next`/`react-i18next`/`i18next-browser-languagedetector` and the
  translation-resource JSON pipeline — see §3 reasoning below.

**Deliberate simplification (confirmed with the user before implementing):**
the source `LocaleProvider` depended on i18next because other screens in the
larger FADS app render copy through `useTranslation()`/`t()`. The Hackathon
landing page never does — every string is locale-keyed data in
`hackathonLanding.ts`. Carrying 3 npm packages and a JSON-resource pipeline
for zero `t()` calls would itself have been an "unused dependency," so the
standalone `LocaleProvider` was rewritten to drive the same public API
(`useLocale()` → `{ locale, setLocale, toggleLocale, availableLocales }`)
with plain `useState`, no i18n library. The two accessibility strings that did
need translating (skip-link text, main-landmark label) are inlined directly
in the new `App.tsx`. This also meant `react-router-dom` was dropped entirely
— `HomePage.tsx` was confirmed (via full dependency trace) to have zero
router dependency; only the app-bootstrap layer used it, for multi-page
routing this package doesn't need.

## 4. Components copied

Button, Card, Container, Divider, Footer, Header, Icon, Section, Typography —
see `FILE_MANIFEST.md` in the package for the full per-component rationale.
None were recreated from scratch; all preserve their original markup, props,
and CSS Module styling exactly, verified by the copied `HomePage.test.tsx`
(13 assertions) and `App.test.tsx` (2 assertions) passing unchanged.

## 5. Icons copied

Exactly the 16 icons `HomePage.tsx` renders (verified against the current
icon registry — no invented names, no path geometry redrawn):

`sprout-01`, `information-circle`, `atom-01`, `atom-02`, `wind-turbine`,
`add-to-list`, `notebook`, `task-done-01`, `seal`,
`presentation-line-chart-01`, `presentation-bar-chart-01`,
`dashboard-speed-01`, `dashboard-speed-02`, `dashboard-circle`,
`search-focus`, `add-circle`.

The source registry (237 icons / 13 categories) was not copied. A new,
hand-written `icons.ts` registers only these 16, with `IconName` as a
16-member literal union — an invalid name anywhere in the package fails
`npm run typecheck` before it can render the missing-icon fallback (also
verified at runtime by a dedicated test: 0 `[data-missing="true"]` nodes).

## 6. Token strategy

A one-off Node script (not shipped in the package) scanned every copied
`.module.css` file plus `global.css`/`reset.css` for `var(--fads-*)`
references, then resolved the reference chain transitively against the
source's `generated/tokens.css` + `tokens.css`. Result: **193 of 280**
`--fads-*` custom properties were mechanically identified as actually used —
these, and only these, were written into a single frozen
`src/styles/tokens.css` in the package, with a header comment marking it as
an approved frozen subset that should not be hand-edited without going
through the source design system's own review process. No token value was
invented or altered — every one is a byte-for-byte copy of its source value.

## 7. Validation results

Run inside `handoff/hackathon-landing-page/` (fresh `npm install`, 383
packages, 0 vulnerabilities):

| Command                | Result                                                                                                                                                                                                                                          |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run typecheck`    | ✅ clean                                                                                                                                                                                                                                        |
| `npm run lint`         | ✅ clean (0 errors, 0 warnings after one eslint-config fix — see below)                                                                                                                                                                         |
| `npm run format:check` | ✅ clean                                                                                                                                                                                                                                        |
| `npm test`             | ✅ **15/15 passing**, 2 files (`HomePage.test.tsx` 13, `App.test.tsx` 2)                                                                                                                                                                        |
| `npm run build`        | ✅ succeeds — `dist/` is 264.83 kB JS (85.49 kB gzip) total, down from the source app's 663 kB _single lazy chunk_ for this same page (13/60-category, 237-icon registry vs. this package's 16-icon registry, plus no react-router-dom/i18next) |

Also confirmed:

- **No unresolved imports** — `tsc -b` and `vite build` both fully resolve
  every import; a repo-wide grep for the old design-system aliases
  (`@ds/`, `@i18n/`, `@app/`, `@layouts/`, `@hooks/` other than
  `useMediaQuery`) and for any `../../frontend` path returned zero matches.
- **No dependency on the original repository** — confirmed by the same grep,
  plus the package installs and builds standalone with its own
  `node_modules`.
- **No missing assets** — `dist/favicon.ico` and `dist/assets/full_logo-ar-*.svg`
  both present and correctly referenced after build.
- **No missing icon fallback** — `HomePage.test.tsx` asserts 0
  `[data-missing="true"]` icon nodes.
- **CTA URLs come from configuration** — both `submitInnovationUrl` and
  `manageRequestsUrl` are read from `src/config/integration.ts`, not
  hardcoded in content or component files.
- **Arabic RTL works** — `document.documentElement` carries `dir="rtl"` by
  default (asserted in both test files); the locale toggle flips it live.
- **The dark-green footer is preserved** — `HomePage.tsx` renders
  `<Footer background="darkGreen" />`, resolving to
  `--fads-sys-footer-bg-oncolor: #074d31`, included in the frozen token file.
- **Production build succeeds** — see table above.

One fix was needed during validation (not a "critical packaging bug" in the
landing page itself, just a config gap discovered while validating): the
initial `eslint.config.js` didn't carry over the source config's
`react-refresh/only-export-components: 'off'` override for `src/test/**`,
so `test-utils.tsx` (which legitimately co-locates a render helper, an a11y
helper, and an `export *`) produced 2 warnings. Added the same override the
source config already had. No source/component code changed to fix this.

## 8. Known limitations

- **`react-refresh`/HMR granularity**: `LocaleProvider.tsx` and `test-utils.tsx`
  intentionally co-locate a component with hooks/helpers — normal for
  provider/infrastructure files, same pattern the source repo uses.
- **English copy is a best-effort translation**, not officially reviewed —
  same caveat as the source repo; flagged again in `BACKEND_HANDOFF.md`'s
  acceptance checklist.
- **The FA logo asset has hardcoded fill colors** (not `currentColor`), so it
  isn't background-adaptive — same asset, same limitation as the source app;
  documented in `CONTENT_AND_BRANDING_GUIDE.md` §2.
- **No error boundary** — deliberately omitted for minimalism (not a
  requirement of the landing page's own behavior); documented as an easy
  addition in `INTEGRATION_GUIDE.md` §5 if the hosting app wants one.
- **Icon registry is still eagerly bundled** (all 16 SVGs load together, not
  lazily) — inherited architecture from the source `Icon` component; at 16
  icons this is a non-issue (part of why the JS bundle shrank from 663 kB to
  265 kB total), unlike the source's 237-icon registry.

## 9. Backend integration points

Both documented in-package (`BACKEND_HANDOFF.md`, `INTEGRATION_GUIDE.md`):

- `src/config/integration.ts` → `submitInnovationUrl` (placeholder
  `#submit-innovation`) — destination for "قدم ابتكارك" (4 render locations).
- `src/config/integration.ts` → `manageRequestsUrl` (placeholder
  `#manage-requests`) — destination for "إدارة طلباتي" (3 render locations).
- No API calls, no authentication, no business forms are implemented or
  assumed anywhere in the package (grep-verified: no `fetch`/`axios`/`XMLHttpRequest`).

## 10. Confirmation: the original Design System was not modified

`git status` in the repository root, taken after building this package,
shows the handoff work touched **only**:

- `handoff/` (new, untracked directory — the entire standalone package)
- `reports/HANDOFF_PACKAGE_REPORT.md` (this file, new)

No file under `frontend/src/design-system/**`, `frontend/src/pages/**`,
`docs/**`, `references/**`, or any other existing project file was created,
edited, or deleted by this task. (Separately, `frontend/package.json`,
`frontend/src/pages/HomePage.*`, `frontend/src/content/hackathonLanding.ts`,
`CHANGELOG.md`, and `docs/PROJECT_STATUS.md` show as modified in `git status`
— those changes are from the **prior** landing-page rebuild session, already
reported in `reports/LANDING_PAGE_REBUILD_REPORT.md`, and are unrelated to
and untouched by this handoff-packaging task.)

Storybook, the design-system test suite, the icon-import pipeline, and every
governance document remain exactly as they were before this task began.
