# Visual Compliance — Breadcrumb

Compares the official Platforms Code Breadcrumb component (see
`docs/FIGMA_BREADCRUMB_SPECIFICATION.md`, node `5698:2597` in file
`J0xq7JG3JKshRDzrgAM7E0`) against the pre-existing FADS `Breadcrumbs` shell component
(`frontend/src/design-system/shell/Breadcrumbs/Breadcrumbs.tsx` /
`Breadcrumbs.module.css`) as it stood before this pass — `Implemented`, `nodeResolutionStatus:
"pending"`, not yet in `docs/COMPONENT_APPROVAL_MATRIX.md`.

## 1. Prior Implementation Summary

A `<nav>` + `<ol>` of items, each rendered as a link (or, for the last item, non-interactive text
with `aria-current="page"`), separated by a literal `"/"` text character rendered after every
non-last item. No `Levels`-collapse behavior. Used generic, non-Breadcrumb-scoped tokens
(`--fads-sys-color-text-link`, `--fads-sys-color-text-muted`, `--fads-ref-font-weight-medium`).

## 2. Differences Found (and Fixed)

| # | Area | Official (live-verified) | Prior implementation | Fixed this pass |
|---|---|---|---|---|
| 1 | Separator | A directional arrow icon (`arrow-right-01`/`arrow-left-01`, 16×16), **before** every non-first item | Literal `"/"` text, **after** every non-last item | ✅ Replaced with a bidi-mirroring `›` glyph (§9 of the spec — the exact SVG icon isn't in the registry yet), repositioned to lead each non-first item |
| 2 | Ancestor item color | `Link/link-neutral` `#384250` (matches the already-Approved `Link` component's own `mood="neutral"` token exactly) | `--fads-sys-color-text-link` (generic link-blue) | ✅ Ancestor items now compose the actual `<Link mood="neutral" size="sm">` component instead of a bare `<a>` — reuses Link's own verified tokens/hover/focus behavior for free, zero new color tokens needed |
| 3 | Current-page item color/weight | `Global/text-default-disabled` `#9da4ae`, **Regular** weight | `--fads-sys-color-text-muted` **+ `font-weight-medium` (bold)** | ✅ New `--fads-sys-breadcrumb-text-current` token (`#9da4ae`), regular weight (bold removed — it was never in the live data) |
| 4 | `Levels=">5"` collapse | Root → interactive `"..."` button → last 2 items | Not implemented — always renders every passed item | ✅ Added: `items.length > 5` collapses to `[first, ellipsisButton, ...last 2]`; click-to-reveal-in-place (spec §5, flagged Needs Confirmation on the exact interaction) |
| 5 | Item↔separator gap | `Link/link-sm-gap` `4px` (same Figma variable the `Link` component's own `size="sm"` gap independently sources) | N/A (separator was a suffix with `gap: var(--fads-sys-space-inline-sm)`, `8px` — a generic, non-Breadcrumb-scoped spacing token) | ✅ New `--fads-sys-breadcrumb-item-gap` token (`4px`), independently sourced (not a `var()` reference into `Link`'s own token, per "no cross-component token aliasing") |

## 3. Accessibility

- `<nav aria-label>`, `aria-current="page"` on the current item, non-interactive current item —
  all already correct pre-pass, unchanged.
- Separator is `aria-hidden="true"` (decorative) — already correct pre-pass for the old `/`
  character, preserved for the new `›` glyph.
- New: the `Levels>5` ellipsis button gets `aria-expanded` (`false` initially, `true` once
  clicked) and an explicit `aria-label` (caller-overridable, defaults to English per this
  codebase's established i18n convention for other components' default labels — e.g.
  `Pagination`'s `previousLabel`/`nextLabel`).
- Verified via a new axe check on the collapsed (`Levels>5`) state, in addition to the existing
  default-state check.

## 4. RTL

No layout bug found or fixed beyond confirming (spec §6) that full logical-properties mirroring —
already this codebase's universal convention (composing `<Link>`, which is itself already
RTL-verified, plus the bidi-mirroring `›`/`‹` glyph pair, plus `justify-content: end` under
`dir="rtl"`) — is the correct, defensible choice over the one sampled RTL node's literal
reversed-DOM-order reading. Same category of judgment call as `Link`/`Tag`/`TextInput`'s own RTL
findings.

## 5. Scope

- Only `Breadcrumbs.tsx`, `Breadcrumbs.module.css`, `Breadcrumbs.stories.tsx`,
  `Breadcrumbs.test.tsx`, and `scripts/generate-tokens.mjs` (additive tokens only) were touched.
- The composed `Link` component (`Link.tsx`/`Link.module.css`) is **unchanged** — Breadcrumb only
  *consumes* it as a child, confirmed via `grep` before and after.
- `Breadcrumbs` is not yet consumed by any product page (`grep`-verified — only its own test file
  referenced it before this pass), so this rebuild carries zero external-breakage risk.

## 6. Required Code (this pass) — Status

1. ✅ `Breadcrumbs.tsx` — composes `Link` for ancestor items; new `›`/`‹` bidi-mirroring
   separator; `Levels>5` collapse-to-ellipsis behavior with click-to-reveal; preserved the
   existing `BreadcrumbItem`/`BreadcrumbsProps` public shape (`items`, `label`, `className`) —
   no breaking change to the props API.
2. ✅ `Breadcrumbs.module.css` — token-only, no hardcoded colors/spacing (verified: `lint:css`).
3. ✅ `scripts/generate-tokens.mjs` — 2 new additive `--fads-sys-breadcrumb-*` tokens
   (`text-current`, `item-gap`); separator color reuses the newly-added-for-this-pass generic
   `Icon/icon-neutral`-sourced value, independently added as its own `--fads-sys-breadcrumb-
   separator-color` token (not a cross-component alias).
4. ✅ `Breadcrumbs.stories.tsx` — Default, TwoLevels (pre-existing), plus new: ManyLevels
   (`Levels>5` collapse demo), RTL.
5. ✅ `Breadcrumbs.test.tsx` — existing 4 tests preserved (label association still holds since the
   markup change kept the same accessible structure), new coverage for the collapse behavior and
   the composed-`Link`-item's href/text.
6. ✅ Exported from `frontend/src/design-system/shell/index.ts` (unchanged export path) — no
   consumer-facing breaking change.

## 7. Validation

Run one command at a time per the workflow, in order:

| Command | Result |
|---|---|
| `npm run typecheck` | ✅ Pass |
| `npm run lint` (eslint + `lint:css`) | ✅ Pass |
| `npm run format:check` | ✅ Pass (after `prettier --write` on 2 generated/touched files) |
| `npm test` | ✅ 43 files / 359 tests pass, including 9 new Breadcrumbs tests (up from 4) |
| `npm run tokens:validate` | ✅ Pass (340 tokens generated, 0 missing references) |
| `npm run build` | ✅ Pass |
| `npm run build-storybook` | ✅ Pass |

## 8. Approval

All of: live node, both governing variant axes (`rtl`/`levels`), the composed-`Link` reuse,
accessibility, tests, and every validation command above must be verified before Breadcrumb is
marked Approved — recorded in `figma-component-map.json` and `docs/COMPONENT_APPROVAL_MATRIX.md`
once §7 is complete. Three Needs-Confirmation items remain non-blocking (spec §9): the
approximated separator glyph/color pending the DGA icon-library import, and the `Levels>5`
ellipsis-button's exact click behavior — same category as prior components' scoped exceptions
(`Link`'s external-icon placeholder, `TextInput`'s deferred feedback icon).
