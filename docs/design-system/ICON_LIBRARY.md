# Icon Library — Platforms Code Icon Import (Phase 6)

> Status: **import in progress (13 / 60 categories, 237 / 4,372 icons), full library import pending** (resumable). See `reports/ICON_IMPORT_REPORT.md` for the current batch-by-batch status and `docs/QUESTIONS.md` Q8 for how this changes that open item.

## 1. Source

- **Figma file:** [`PC-1.0-Icons`](https://www.figma.com/design/DMGtUtda6GvvqcVX4lGvwr/PC-1.0-Icons?node-id=2019-10) — the official Platforms Code icon library, canvas `❖ ICONS`.
- **Access method:** read-only Figma MCP tools only (`get_metadata`, `get_design_context`, `get_screenshot`, `get_variable_defs`, `download_assets`), per `CLAUDE.md`'s Figma MCP Policy. No write tool (`use_figma`, `create_new_file`, etc.) was used at any point.
- **Structure verified live** (2026-07-09): 60 category frames → 4,372 named icon frames → up to 9 style/type symbol variants each (`Stroke`/`Twotone`/`Duotone`/`Solid`/`Bulk` × `Rounded`, `Stroke`/`Solid` × `Sharp`, `Stroke`/`Solid` × `Standard`).

## 2. Scope decision: one canonical style

The Icon component's public API is `<Icon name="search" />` — one name, one glyph. Rather than expose all 9 style variants per icon (~39,663 nodes total), the imported library uses a single canonical style: **`Stroke, Rounded`** (present on 4,370 of 4,372 icons — the two exceptions are documented in the import report's Assumptions). This was a deliberate, user-confirmed scope decision (see `reports/ICON_IMPORT_REPORT.md`), not an invented requirement — it matches the most common single-style icon-library pattern and gives the most complete coverage of any single variant.

If the product later needs multiple visual styles (e.g. `Solid` for filled states), that's an additive change: re-export the additional style per icon and extend the registry — it does not require changing `<Icon name>`'s contract.

## 3. Import process

```
Figma (read-only MCP)
  → scripts/icon-raw/<category>/<icon>.svg      (raw sheet export, one call per icon)
  → node scripts/import-icons.mjs
      → src/assets/icons/<category>/<icon>.svg               (normalized, currentColor, no Figma chrome)
      → src/design-system/primitives/Icon/registry/<category>.ts  (one registry object per category)
      → src/design-system/primitives/Icon/icons.ts                (thin aggregator + IconName type)
      → src/design-system/primitives/Icon/icon-categories.ts      (category metadata)
```

Per-category registry files (added 2026-07-09, starting with the Alert category) keep each generated module small and independently parseable as the library scales toward 4,372 icons — a prior run OOM'd mid-validation on the combination of a monolithic `icons.ts` plus running the full `typecheck → lint → format:check → test → tokens:validate → build → build-storybook` chain after every single category. `icons.ts` now only imports and spreads the per-category objects under `./registry/`; adding a category touches just that category's own registry file. See `reports/ICON_IMPORT_REPORT.md`'s summary note for the validation-cadence change that went with it.

1. **Export** — for each icon, `download_assets` is called on the _symbol_ node id for its `Style=Stroke, Type=Rounded` variant (found via `get_metadata`), format `svg`. The MCP tool has no batch-export API, so this is one call per icon.
2. **Stage** — the raw SVG is saved under `scripts/icon-raw/<category>/<icon>.svg`. Raw exports still contain Figma sheet chrome (a background swatch, the category's giant translate group, a dashed selection-frame indicator) — all of it sits outside the 24×24 viewBox and is discarded by the next step.
3. **Normalize** (`scripts/import-icons.mjs`) —
   - Parses the raw SVG (via `jsdom`) and extracts only the canonical style group's content.
   - Strips descriptive Figma ids (`Icon`, `Vector (Stroke)`, …) so multiple inlined icons never share duplicate DOM ids on one page.
   - Replaces the hardcoded ink fill (`fill="#161616"`) with `fill="currentColor"` so `Icon`'s `tone` prop can drive color via CSS custom properties — this is a color-binding transform, not a redraw; **no path geometry is touched, added, or approximated.**
   - Writes the clean SVG to `src/assets/icons/<category>/<icon>.svg`.
4. **Register** — generates `registry/<category>.ts` per category (one `?raw` import + registry entry per icon in that category), `icons.ts` (aggregates all category registries, `IconName` as a literal union), and `icon-categories.ts` (category → icon list + label).

Re-running `node scripts/import-icons.mjs` after dropping more raw exports into `scripts/icon-raw/` regenerates all of the above from scratch — it is idempotent and never requires changing `Icon.tsx`.

## 4. Category structure

The 60 official categories are preserved as the on-disk and registry grouping (`icon-categories.ts`), each keyed by its kebab-case id (e.g. `community-icons`, `git`). 13 of 60 are populated so far — see the report for the full list and pending batches.

## 5. Naming convention

- **Category ids and icon names are kebab-case**, derived from the Figma layer name: non-alphanumeric runs (spaces, `+`, `_`) become a single `-`, then lowercased. E.g. `"Download + Upload"` → `download-upload`, `"Community Icons"` → `community-icons`.
- **Cross-category name collisions** (same icon name used in two categories) are detected and disambiguated: the first category to claim a name keeps the bare name; every later occurrence is registered as `` `${name}__${category}` `` and logged in the import report's Duplicates section. On disk this never matters (each category has its own folder), only the flat registry key needs disambiguation. As of the pilot batch there are **zero** collisions.

## 6. Accessibility usage

Mirrors `docs/ICONOGRAPHY_SPECIFICATION.md` §5–8:

```tsx
// Decorative — meaning is already conveyed by adjacent text or a labelled parent control.
<Icon name="home-01" decorative />

// Functional — the icon is (part of) the accessible name.
<Icon name="home-01" title="الرئيسية" />

// Icon inside an already-labelled icon-only button: pass `decorative` explicitly
// rather than relying on the absence of `title`, so the icon never double-announces.
<button aria-label="حذف العنصر">
  <Icon name="zakat-bag-open" decorative />
</button>
```

- No `title` and `decorative` not `false` → `aria-hidden="true"`, no role (default).
- `title` given and `decorative` not `true` → `role="img"` + `aria-label={title}`.
- `decorative` explicitly `true` → always hidden, regardless of `title`.
- An unregistered `name` renders a visible dashed-circle fallback glyph (never a blank/broken render) and logs a dev-only console warning — see `Icon.tsx`.
- Color always comes from the `tone` token (`inherit` / `neutral` / `primary` / `success` / `error` / `warning` / `information`), matching DC-04/DC-05 — no free-form `color` prop, by design (see `Icon.types.ts`).

## 7. RTL guidance

Per-icon directionality (which icons are "arrows"/"chevrons" that should flip under RTL) is **not derivable from the Figma source** — the MCP metadata has no such tag, and guessing from the name (e.g. matching `left`/`right`/`next`) risks false positives on icons that merely _contain_ those words. This is recorded as a limitation, not invented.

Instead, `Icon` exposes an opt-in `mirrorInRTL` boolean — the caller (who knows the icon is directional in that usage) sets it:

```tsx
<Icon name="git-compare" mirrorInRTL title="مقارنة" />
```

Under `dir="rtl"` (via `:dir(rtl)` in `Icon.module.css`) this applies `transform: scaleX(-1)`; under `ltr` it's a no-op.

## 8. How to add/sync icons later

1. Use the read-only Figma MCP tools to find the next category/icon's `Style=Stroke, Type=Rounded` (or `Property 1=Stroke, Property 2=Rounded`) symbol node id via `get_metadata`.
2. `download_assets` with `defaultFormat: 'svg'` on that node id; save the response to `scripts/icon-raw/<category>/<icon>.svg` (category folder name doesn't need to be pre-formatted — the script normalizes it).
3. Run `node scripts/import-icons.mjs`. Read its JSON summary: `exported`, `skipped`, `failed`, `duplicates`, `categories`.
4. Run `npx prettier --write scripts/import-icons.mjs src/design-system/primitives/Icon/icons.ts src/design-system/primitives/Icon/icon-categories.ts src/design-system/primitives/Icon/registry/*.ts` — the generator's output isn't Prettier-formatted (same known tradeoff as `scripts/generate-tokens.mjs`'s `tokens.css`; see `CHANGELOG.md`).
5. Update `reports/ICON_IMPORT_REPORT.md` with the new totals and any newly-completed/pending categories.
6. Run the **lighter** per-category validation, not the full heavyweight chain: `npm run typecheck && npm run lint && npm run format:check && npx vitest run src/design-system/primitives/Icon/Icon.test.tsx -t "category: <new-category-id>"`. Reserve the full `npm run validate && npm run build && npm run build-storybook` chain for periodic checkpoints (e.g. every several categories, or before ending a session) — running it after every single category is what caused a prior out-of-memory crash mid-import.

If a batch is interrupted by a rate limit, a failed export mid-category, or an OOM during validation, the raw-export step is safe to resume from wherever it stopped — `import-icons.mjs` only ever reads what's already staged in `scripts/icon-raw/`, and re-running it is always safe (it rebuilds `src/assets/icons/`, `icons.ts`, `icon-categories.ts`, and `registry/*.ts` from scratch from whatever raw files currently exist — this never re-fetches anything from Figma and never re-processes a category's raw SVGs into different output).

## 9. Known limitations

- **Single style only.** Only the `Stroke, Rounded` variant is imported; `Twotone`/`Duotone`/`Solid`/`Bulk`/`Sharp`/`Standard` variants exist in Figma but are not in the registry (§2).
- **Full library pending.** 237 of 4,372 discovered icons (13 of 60 categories) are imported. See `reports/ICON_IMPORT_REPORT.md` for pending categories.
- **No per-icon RTL metadata.** `mirrorInRTL` is always an opt-in, per-usage decision by the caller (§7) — never inferred.
- **Eager bundling, now per-category.** `icons.ts` still statically imports every registered icon's raw SVG (`?raw`) transitively via `registry/<category>.ts`, so importing the module pulls in all registered icons' markup — the per-category split (§3) bounds how much any _one_ generated file holds, but doesn't yet make loading lazy. This is fine at 237 icons; at full-library scale (~4,400+) this still needs to move to a dynamic-import or sprite strategy. Because raw normalized SVGs already live as separate files in `src/assets/icons/`, that migration only touches `icons.ts`/`registry/*.ts`'s loading strategy — it does not change the `Icon` component's public API (`import-icons.mjs`'s stated goal).
- **Two source-data anomalies**, both non-blocking, documented in the import report: one icon (`Games/ski`) uses a non-standard variant-property naming in Figma; one stray frame (`Mathematics/Text`) has zero symbol children and isn't a real icon (the pipeline's per-category "Header" frame — a sheet-metadata block, not an icon — is filtered out the same way).
- **Color is `tone`, not `color`.** Per DC-04 (no hardcoded/free-form colors), `Icon` exposes a design-token-bound `tone` prop rather than an arbitrary `color` string — see `Icon.types.ts`.
