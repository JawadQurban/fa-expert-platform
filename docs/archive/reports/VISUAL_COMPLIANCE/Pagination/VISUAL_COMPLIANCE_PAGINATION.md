# Visual Compliance — Pagination

Compares the official Platforms Code Pagination component set
(`docs/FIGMA_PAGINATION_SPECIFICATION.md`, node `7936:8133`) against the pre-existing FADS
`Pagination` composite (`frontend/src/design-system/composite/Pagination/`) as it stood before
this pass.

## 1. Prior Implementation Summary

`nav` landmark with a windowed page list (first, last, current ±1, non-interactive ellipsis for
gaps), Previous/Next always present and disabled at the bounds, `aria-current="page"`. Visible
text labels on Previous/Next, a filled-background current-page treatment, an unstyled ellipsis,
and no size axis — none of these had ever been checked against the live Figma component.

## 2. Differences Found (and Fixed)

| # | Area | Official (live-verified) | Prior implementation | Fixed this pass |
|---|---|---|---|---|
| 1 | Previous/Next content | Icon-only buttons, no visible text | Visible "Previous"/"Next" text | ✅ `previousLabel`/`nextLabel` now drive `aria-label` only; visible content is a CSS-drawn chevron |
| 2 | Current-page indicator | Same text color/weight as any page number + a `background-primary` underline bar beneath it | Filled `background-primary` box + inverted text color | ✅ Replaced with the live-verified underline `.selector` bar |
| 3 | Overflow item | 1px `border-black` box around "…" | Plain unstyled ellipsis | ✅ Added the border, kept non-interactive |
| 4 | Sizes | 3 sizes (Large 40px / Medium 32px / Small 24px), each with its own icon/padding/underline width | One unsized, non-Figma-verified layout | ✅ New `size` prop (`'sm' \| 'md' \| 'lg'`, default `'md'`) with live-verified dimensions per size |
| 5 | Windowing logic | First, last, current ±1, ellipsis for gaps — confirmed by the live "1 … 999" / "2,3 current" sample layout | Same algorithm | ✅ No change — already matched Figma exactly |
| 6 | Token architecture | — | Generic `--fads-sys-control-*`/`--fads-sys-color-*` aliases | ✅ 22 new additive `--fads-sys-pagination-*` tokens sourced from the live Figma variable group |

## 3. Accessibility

- Preserved unchanged: `nav` landmark with `aria-label`, `aria-current="page"`, disabled
  Previous/Next at the bounds, real `<button>` elements (native keyboard Enter/Space activation,
  no custom key handling needed).
- New: Previous/Next icon-only buttons still carry a real accessible name via `aria-label`
  (`previousLabel`/`nextLabel` — same props as before, just no longer rendered as visible text);
  the chevron glyph itself is `aria-hidden`. The underline `.selector` indicator is `aria-hidden`
  (the accessible signal for "current page" remains `aria-current="page"`, unaffected by the
  visual redesign). The overflow item stays non-interactive/`aria-hidden`, unchanged.

## 4. RTL

Logical properties throughout (`inline-size`, `padding-inline`, `inset-block-end`). The CSS-drawn
chevrons mirror via `:dir(rtl)` (the same technique already used by `Icon`'s own
`data-mirror-rtl`), so Previous/Next continue to point the correct reading-order direction under
RTL without a second hand-authored glyph. Confirmed via a dedicated RTL story and test.

## 5. Scope

- Only `Pagination.tsx`, `Pagination.module.css`, `Pagination.stories.tsx`,
  `Pagination.test.tsx`, and `scripts/generate-tokens.mjs` (additive tokens only) were touched.
- `Pagination` is not consumed by any product page (`grep`-verified), so zero external-breakage
  risk. The `PaginationProps` shape is unchanged except for the additive `size` prop —
  `previousLabel`/`nextLabel` keep their exact prior names/types, only their rendering target
  changed (visible text → `aria-label`), which is a visual fix, not an API break.

## 6. Validation

| Command | Result |
|---|---|
| `npm run typecheck` | ✅ Pass |
| `npm run lint` (eslint + `lint:css`) | ✅ Pass |
| `npm run format:check` | ✅ Pass |
| `npm test` (Pagination only) | ✅ 11/11 passing (up from 5) |
| `npm run tokens:generate` | ✅ 470 tokens generated |

(Full-suite/build/build-storybook validation is re-run once at the end of Batch 2 — see
`reports/BATCH2_DATA_COMPONENTS_REPORT.md` §8.)

## 7. Approval

Live node, all 3 sizes, the current-page indicator redesign, the icon-only Previous/Next buttons,
and the overflow-item border verified before Pagination is marked Approved. Needs-Confirmation
items (non-blocking, spec §4): the CSS-drawn chevron approximation pending the DGA icon library,
whether the overflow item is meant to be interactive, and the chosen `'md'` default size (Figma
marks no size as default).
