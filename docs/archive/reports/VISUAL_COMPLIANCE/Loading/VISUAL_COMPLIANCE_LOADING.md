# Visual Compliance — Loading

Compares the official Platforms Code Loading component set
(`docs/FIGMA_LOADING_SPECIFICATION.md`, node `5698:11136`) against the pre-existing FADS
`Loading` composite (`frontend/src/design-system/composite/Loading/`) as it stood before this
pass.

## 1. Prior Implementation Summary

`role="status"`/`aria-live="polite"`/`aria-busy` with a `spinner`/`skeleton` variant and 3
non-Figma-verified sizes (`sm`/`md`/`lg`). Colors used generic `--fads-sys-color-border-default`/
`-primary` aliases, not a live-verified Loading-specific palette.

## 2. Differences Found (and Fixed)

| # | Area | Official (live-verified) | Prior implementation | Fixed this pass |
|---|---|---|---|---|
| 1 | Loading patterns | Only a spinner is defined in Figma; no Overlay/Full-Page/Loading-Label chrome exists | N/A | ✅ Confirmed via live data rather than assumed — none of those three are invented as new variants (spec §1); documented Overlay/Full-Page as a consumer-composition pattern reusing `Modal`'s existing `--fads-sys-color-overlay` token |
| 2 | Sizes | 7 sizes (xxSmall 20px .. xxLarge 44px) | 3 non-verified sizes | ✅ New `LoadingSize` = `'xxs'\|'xs'\|'sm'\|'md'\|'lg'\|'xl'\|'xxl'`, all 7 live-verified dimensions |
| 3 | Style/mood | 3 styles (Neutral/Primary/On-Color), each a distinct two-tone track+indicator color pair | One implicit style only | ✅ New `mood` prop (`'neutral'\|'primary'\|'onColor'`) with live-verified colors |
| 4 | Reduced motion | N/A (Figma doesn't encode motion) | Not implemented — spinner/shimmer always animated | ✅ `@media (prefers-reduced-motion: reduce)` stops both animations (WCAG 2.3.3) |
| 5 | Token architecture | — | Generic `--fads-sys-color-border-default`/`-primary` aliases | ✅ 15 new additive `--fads-sys-loading-*` tokens sourced from the live Figma variable group |
| 6 | Skeleton | Not defined on this node at all | Existing `variant="skeleton"` | ⚠ Kept unchanged, explicitly flagged as not Figma-verified rather than silently implying it is (spec §1) |

## 3. Accessibility

- Preserved unchanged: `role="status"`, `aria-live="polite"`, `aria-busy="true"`, caller-supplied
  `label`.
- New: both animations stop under `prefers-reduced-motion: reduce`; the spinner's two-tone ring
  (a differently-colored start edge vs. the rest of the ring) still visually communicates
  "in progress" without relying on motion. jsdom has no CSS media-query evaluation, so this was
  verified by direct code review of `Loading.module.css` rather than a jsdom runtime assertion —
  documented here rather than backed by a misleading always-passing test.

## 4. RTL

No layout bug — the spinner is a symmetric ring (direction-agnostic) and the skeleton uses
`inline-size` (logical, already correct). Confirmed via a dedicated RTL story and test.

## 5. Scope

- Only `Loading.tsx`, `Loading.module.css`, `Loading.stories.tsx`, `Loading.test.tsx`, and
  `scripts/generate-tokens.mjs` (additive tokens only) were touched.
- Consumed by `Table.stories.tsx`'s new `LoadingState` story (added this same batch, using only
  default props) — no other product code or component consumes `Loading`
  (`grep`-verified), so zero external-breakage risk. Both new props (`size`, `mood`) default to
  the same visual result the old defaults produced (`md`/`primary` ≈ the old `md` default already
  using `--fads-sys-color-primary`), so any hypothetical existing caller using only the old props
  renders unchanged.

## 6. Validation

| Command | Result |
|---|---|
| `npm run typecheck` | ✅ Pass |
| `npm run lint` (eslint + `lint:css`) | ✅ Pass |
| `npm run format:check` | ✅ Pass |
| `npm test` (Loading only) | ✅ 8/8 passing (up from 4) |
| `npm run tokens:generate` | ✅ 504 tokens generated |

## 7. Approval

Live node, all 7 sizes, all 3 moods, and the reduced-motion accommodation verified before Loading
is marked Approved. Needs-Confirmation items (non-blocking, spec §5): the approximated stroke
width/arc angle (raster export, no vector data), and the `skeleton` variant's own visual fidelity
(kept but not verified against this node).
