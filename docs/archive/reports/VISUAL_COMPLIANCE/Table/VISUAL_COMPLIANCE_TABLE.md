# Visual Compliance — Table

Compares the official Platforms Code Table component set
(`docs/FIGMA_TABLE_SPECIFICATION.md`, node `5698:40875`) against the pre-existing FADS `Table`
composite (`frontend/src/design-system/composite/Table/`) as it stood before this pass.

## 1. Prior Implementation Summary

Semantic `<table>` with caption, `scope="col"` headers, sortable columns (`aria-sort` +
button), and an `emptyState` slot. Used only generic hand-authored tokens
(`--fads-sys-color-table-header-background`/`-row-border`, defined in the legacy `tokens.css`,
not the live-Figma-verified pipeline). No density, contained, alternating-rows, selection,
hover/selected row states, sticky header, loading/error slots, or footer.

## 2. Differences Found (and Fixed)

| # | Area | Official (live-verified) | Prior implementation | Fixed this pass |
|---|---|---|---|---|
| 1 | Row density | Standard (64px) / Compact (32px) row height, header always 48px | Fixed padding only, no density concept | ✅ New `density` prop (`'standard' \| 'compact'`) |
| 2 | Contained wrapper | 1px border + `radius-md` (8px) around the whole table | No wrapper/border option | ✅ New `contained` prop |
| 3 | Alternating rows | Zebra striping via `table-background-row-alt` `#f9fafb` | Not implemented | ✅ New `alternatingRows` prop |
| 4 | Row hover | `table-background-row-hovered` `#f3f4f6` on any row | Not implemented | ✅ `tbody tr:hover` background, matching Figma's row-state layer |
| 5 | Row selection | Leading 52px checkbox cell (header select-all + per-row), `table-background-row-select` `#f3fcf6` fill | Not implemented | ✅ New `selectable`/`selectedIds`/`onSelectionChange` props composing the Approved `Checkbox` primitive, matching Figma's own leading-checkbox-cell structure exactly |
| 6 | Header text | `Table/table-text-head` `#384250`, `text-xs/Medium` (12px/500) | Inherited body text size, `font-weight-semibold` (600) | ✅ Corrected to the live-verified color/size/weight |
| 7 | Header top border | 1px `table-cell-border` on both top and bottom | Bottom border only | ✅ Added the top border |
| 8 | Token architecture | — | Generic `--fads-sys-color-table-*` aliases (legacy `tokens.css`, not live-Figma-verified) | ✅ 16 new additive `--fads-sys-table-*` tokens sourced from the live Figma `Table` variable group |
| 9 | Loading/Error states | Not defined in Figma (§4 of spec) | Not implemented | ✅ New `loading`/`loadingState`/`errorState` slots composing the Approved `Loading`/`ErrorState` composites (no new visual design invented) |
| 10 | Sticky header | Not a Figma variant (behavioral only) | Not implemented | ✅ New `stickyHeader` prop, built only from already-verified header tokens |
| 11 | Responsive overflow | N/A (fixed-width Figma frame) | No scroll wrapper — long tables would overflow the viewport | ✅ New `overflow-x: auto` scroll container |
| 12 | Footer | No official Figma variant (Needs Confirmation) | Not implemented | ✅ New `footer` slot, built only from already-verified header tokens, flagged Needs Confirmation |

## 3. Accessibility

- Preserved unchanged: semantic `<table>`, `scope="col"`, `aria-sort`, keyboard-operable sort
  button.
- New: `aria-selected` on selected `<tr>`; header select-all `Checkbox` drives its native
  `indeterminate` DOM property for a partial selection; every selection checkbox gets a
  caller-supplied accessible label (visually hidden via the existing `fads-visually-hidden`
  utility, not a new pattern) so no row's checkbox is left unlabeled.
- `loadingState`/`errorState` slots inherit whatever accessibility contract the composed
  `Loading`/`ErrorState` composite already carries (`role="status"`/`aria-live` for Loading,
  `role="alert"` for the Alert-based ErrorState) — nothing new to verify here since no new
  a11y surface was created, only composition of already-approved ones.

## 4. RTL

No layout bug — logical properties throughout (`inline-size`, `padding-inline`, `text-align:
start`, `inset-block-start` for the sticky header). `overflow-x: auto` is direction-agnostic.
Confirmed via a dedicated RTL story and test.

## 5. Scope

- Only `Table.tsx`, `Table.module.css`, `Table.stories.tsx`, `Table.test.tsx`, and
  `scripts/generate-tokens.mjs` (additive tokens only) were touched.
- `Checkbox.tsx`/`Checkbox.module.css`, `Loading.tsx`, `ErrorState.tsx`, `EmptyState.tsx` —
  **unchanged**; `Table` composes them, doesn't modify them.
- `Table` is not consumed by any product page (`grep`-verified), so zero external-breakage risk.
  All new props are additive with safe defaults (`density='standard'`, `contained=false`,
  `alternatingRows=false`, `selectable=false`, `loading=false`) — an existing caller passing only
  the original prop set renders identically to before.
- The two legacy generic tokens (`--fads-sys-color-table-header-background`/`-row-border` in
  `tokens.css`) were left in place (not deleted — out of this component's scope, and nothing else
  in the repo was checked to depend on them being removed); `Table.module.css` simply stopped
  referencing them in favor of the new live-verified tokens.

## 6. Validation

| Command | Result |
|---|---|
| `npm run typecheck` | ✅ Pass |
| `npm run lint` (eslint + `lint:css`) | ✅ Pass |
| `npm run format:check` | ✅ Pass |
| `npm test` (Table only) | ✅ 18/18 passing (up from 5) |
| `npm run tokens:generate` | ✅ 446 tokens generated |

(Full-suite/build/build-storybook validation is re-run once at the end of Batch 2 — see
`reports/BATCH2_DATA_COMPONENTS_REPORT.md` §8 for the final combined results across all five
components.)

## 7. Approval

Live node, the sub-parts-vs-bundled architecture decision, every row-state color, density,
contained wrapper, selection, and accessibility contract verified before Table is marked
Approved. Needs-Confirmation items (non-blocking, spec §6): the selected+hovered stroke token,
the unverified `footer` slot's existence in the official design, and the still-unresolved
Sort/Filter header-cell icon glyphs.
