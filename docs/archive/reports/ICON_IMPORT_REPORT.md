# Icon Import Report — Phase 6 (Platforms Code Icon Library)

**Source:** [`PC-1.0-Icons`](https://www.figma.com/design/DMGtUtda6GvvqcVX4lGvwr/PC-1.0-Icons?node-id=2019-10) (official Platforms Code Figma icon file), canvas `❖ ICONS`
**Access:** read-only Figma MCP tools only (`get_metadata`, `download_assets`) — see `CLAUDE.md` Figma MCP Policy
**Companion doc:** `docs/ICON_LIBRARY.md`
**Status:** import in progress, resumable — updated after every completed category.

## Summary (current)

| Metric                                    | Value                                                         |
| ----------------------------------------- | ------------------------------------------------------------- |
| Total icons discovered (source structure) | **4,372** (across 60 categories)                              |
| Total icons exported so far               | **237**                                                       |
| Categories complete                       | **13 / 60**                                                   |
| Duplicate registry names                  | **0**                                                         |
| Renamed/disambiguated icons               | **0**                                                         |
| Skipped icons                             | **0**                                                         |
| Failed exports (persistent)               | **0** (2 transient failures, both resolved on retry — see §6) |
| Style scope                               | Single canonical style: `Stroke, Rounded`                     |
| Validation result                         | **PASS** after every completed category so far — see §7       |

> **2026-07-09 process change:** a prior run was terminated mid-validation after an out-of-memory failure (the full `validate` chain — typecheck, lint, format:check, test, tokens:validate, **build**, **build-storybook** — run in one shot after every category, on top of a monolithic `icons.ts` that statically imports every icon's raw SVG). Two changes went in as a result, both applied starting with the Alert category below:
>
> 1. **Per-category registry files** — `scripts/import-icons.mjs` now writes one `src/design-system/primitives/Icon/registry/<category>.ts` per category; `icons.ts` is a thin aggregator that spreads them together. Adding a category only touches that category's own file.
> 2. **Lighter per-category validation** — after each category, run `typecheck`, `lint`, `format:check`, and a targeted `Icon.test.tsx` pass (now grouped `describe.each` by category, so e.g. `npx vitest run -t "category: alert"` validates just the new one) instead of the full `validate` + `build` + `build-storybook` chain. The full heavyweight chain (including `build`/`build-storybook`) is reserved for periodic checkpoints, not every category, to avoid repeating the OOM.
>
> No already-imported category was regenerated or re-fetched from Figma as part of this change — `node scripts/import-icons.mjs` only re-derives generated files from raw SVGs already staged on disk.

## 1. Discovery (source structure) — one-time, covers the full library

Verified live via `get_metadata` on the canvas node (`2019:10`) and category-level nodes, 2026-07-09:

- 60 top-level category frames.
- 4,432 depth-2 frames, of which **60 are "Header" sheet-metadata blocks** (category title, "Icons :" counter, "Last Update" — not icons) and were filtered out, leaving **4,372 real icon-name frames**.
- Each icon frame holds up to 9 style/type symbol variants: `Style=Stroke/Twotone/Duotone/Solid/Bulk, Type=Rounded`, `Style=Stroke/Solid, Type=Sharp`, `Style=Stroke/Solid, Type=Standard` (~39,663 variant nodes total — not imported; see §2).
- Zero cross-category icon-name collisions across all 4,372 discovered icons (checked once, up front, over the full manifest — not just imported categories).

## 2. Scope decision (confirmed with user before export)

1. **Style:** import only the canonical `Style=Stroke, Type=Rounded` variant (present on 4,370/4,372 icons; the `Property 1=Stroke, Property 2=Rounded` alternate naming covers 21 of those). Matches the `<Icon name="search" />` API (one name → one glyph); avoids a ~9x export-call multiplier.
2. **Execution order:** pilot small categories first to prove the pipeline, then continue category-by-category, smallest-first, in resumable batches — each icon needs its own `download_assets` call (no batch-export tool exists on the read-only MCP surface).

## 3. Completed categories

| #   | Category             | Kebab id             | Icons   | Batch     | Notes                                                                                                   |
| --- | -------------------- | -------------------- | ------- | --------- | ------------------------------------------------------------------------------------------------------- |
| 1   | Community Icons      | `community-icons`    | 9       | 1 (pilot) |                                                                                                         |
| 2   | Git                  | `git`                | 10      | 1 (pilot) |                                                                                                         |
| 3   | Shapes               | `shapes`             | 15      | 1 (pilot) |                                                                                                         |
| 4   | Home                 | `home`               | 15      | 1 (pilot) | 1 transient export failure on `home-03` (null export on first attempt); retried immediately, succeeded. |
| 5   | Presentation         | `presentation`       | 15      | 2         |                                                                                                         |
| 6   | Search               | `search`             | 15      | 3         |                                                                                                         |
| 7   | Login + Logout       | `login-logout`       | 16      | 4         |                                                                                                         |
| 8   | Download + Upload    | `download-upload`    | 20      | 5         |                                                                                                         |
| 9   | Dashboard            | `dashboard`          | 21      | 6         |                                                                                                         |
| 10  | Science + Technology | `science-technology` | 22      | 7         |                                                                                                         |
| 11  | Notes + Tasks        | `notes-tasks`        | 25      | 8         |                                                                                                         |
| 12  | Alert                | `alert`              | 27      | 9         |                                                                                                         |
| 13  | Add + Remove         | `add-remove`         | 27      | 10        |                                                                                                         |
|     | **Total**            |                      | **237** |           |                                                                                                         |

## 4. Duplicate names

**Zero** duplicates found in the full 4,372-icon discovery pass (§1) and **zero** in the 64 icons exported so far. The pipeline (`scripts/import-icons.mjs`, `resolveRegistryName`) implements and unit-tests (`Icon.test.tsx`) the disambiguation policy regardless — first occurrence keeps the bare name, later occurrences become `` `${name}__${category}` `` — since collisions become more likely as more categories are imported.

## 5. Renamed icons

None required renaming for uniqueness (§4). Two source names were normalized for casing consistency by the kebab-case pass (a normalization, not a rename): `Sprout-02` → `sprout-02`, `Zakat-bag-closed` → `zakat-bag-closed` (both in `community-icons`, batch 1).

## 6. Skipped / failed exports and known source-data anomalies

- **Skipped:** none so far.
- **Failed (persistent):** none so far. Transient (resolved on immediate retry): `home-03` (batch 1).
- **Anomalies flagged during discovery (§1), not yet reached by import** — resolve when that category comes up:
  - `Games/ski` has no `Style=Stroke, Type=Rounded` (or `Property 1=...`) symbol; its variants are named `Style=dice-faces-01, Type=Stroke, Property 3=Rounded` (a Figma authoring inconsistency — likely copy-pasted from a "dice-faces" icon and never relabeled). **Needs Confirmation** at import time: treat as `Type=Stroke` under the odd property naming, or flag for manual review — do not guess silently.
  - `Mathematics/Text` is a stray frame with zero symbol children (not a real icon, same pattern as the 60 filtered "Header" frames). Skip it, don't import, when `mathematics` is processed.

## 7. Validation result (per completed category)

Batches 1–8 are each a full run of `typecheck → lint → format:check → test → tokens:validate → build → build-storybook`, stopping immediately on the first failure (none have occurred). Starting with batch 9 (Alert), the per-category step is the lighter chain described in the process-change note in §Summary — `typecheck → lint → format:check → targeted Icon.test.tsx` — with the full chain (including `build`/`build-storybook`) reserved for periodic checkpoints.

| After category                            | Result                                                                                                                                       |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Home (batch 1, pilot: 49 icons)           | ✅ PASS — 271/271 tests → **284/284 after `Icon.test.tsx` added**                                                                            |
| Presentation (batch 2: +15 icons)         | ✅ PASS — 284/284 tests                                                                                                                      |
| Search (batch 3: +15 icons)               | ✅ PASS — 284/284 tests                                                                                                                      |
| Login + Logout (batch 4: +16 icons)       | ✅ PASS — 284/284 tests                                                                                                                      |
| Download + Upload (batch 5: +20 icons)    | ✅ PASS — 284/284 tests                                                                                                                      |
| Dashboard (batch 6: +21 icons)            | ✅ PASS — 284/284 tests                                                                                                                      |
| Science + Technology (batch 7: +22 icons) | ✅ PASS — 284/284 tests                                                                                                                      |
| Notes + Tasks (batch 8: +25 icons)        | ✅ PASS — 284/284 tests                                                                                                                      |
| Alert (batch 9: +27 icons)                | ✅ PASS (lighter chain) — typecheck clean, lint clean, format clean, `Icon.test.tsx` 27/27 (12 category groups incl. `category: alert`)      |
| Add + Remove (batch 10: +27 icons)        | ✅ PASS (lighter chain) — typecheck clean, lint clean, format clean, `Icon.test.tsx` 28/28 (13 category groups incl. `category: add-remove`) |

## 8. Pending categories (47 / 60, ~4,135 icons)

Sorted smallest → largest:

| Category         | Kebab id         | Icons |
| ---------------- | ---------------- | ----- |
| Filter + Sorting | `filter-sorting` | 27    |
| Link + Unlink    | `link-unlink`    | 27    |
| Space            | `space`          | 27    |
| Menu             | `menu`           | 28    |
| Award            | `award`          | 34    |
| Animation        | `animation`      | 35    |
| Legal            | `legal`          | 36    |
| Check            | `check`          | 39    |
| Bookmark         | `bookmark`       | 41    |
| Kitchen          | `kitchen`        | 41    |
| Layout           | `layout`         | 42    |
| Settings         | `settings`       | 43    |
| Islamic          | `islamic`        | 45    |
| Gym              | `gym`            | 48    |
| Emojis           | `emojis`         | 59    |
| Date + Time      | `date-time`      | 60    |
| Hierarchy        | `hierarchy`      | 60    |
| Users            | `users`          | 62    |
| Clothing         | `clothing`       | 63    |
| Media            | `media`          | 64    |
| Buildings        | `buildings`      | 65    |
| Programming      | `programming`    | 67    |
| Wifi             | `wifi`           | 70    |
| Furnitures       | `furnitures`     | 72    |
| Image + Camera   | `image-camera`   | 73    |
| Crypto           | `crypto`         | 74    |
| Mouse            | `mouse`          | 78    |
| Medical          | `medical`        | 78    |
| Logistics        | `logistics`      | 83    |
| Energy           | `energy`         | 85    |
| AI               | `ai`             | 87    |
| Security         | `security`       | 90    |
| Education        | `education`      | 96    |
| Weather          | `weather`        | 96    |
| Maps             | `maps`           | 98    |
| Foods            | `foods`          | 99    |
| Games            | `games`          | 121   | contains the `ski` anomaly, §6  |
| Devices          | `devices`        | 128   |
| E-Commerce       | `e-commerce`     | 140   |
| Files Folders    | `files-folders`  | 143   |
| Mathematics      | `mathematics`    | 149   | contains the `Text` anomaly, §6 |
| Arrows           | `arrows`         | 153   |
| Hands            | `hands`          | 166   |
| Logos            | `logos`          | 170   |
| Communications   | `communications` | 179   |
| Editing          | `editing`        | 296   |
| Business         | `business`       | 298   |

**Total pending: 4,135 icons.** To continue: follow `docs/ICON_LIBRARY.md` §8, one category at a time, moving its row from §8 to §3 and updating §7 after each.
