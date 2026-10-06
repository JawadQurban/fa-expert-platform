# Visual Compliance — Tag

Compares the official Platforms Code Tag component (see `docs/FIGMA_TAG_SPECIFICATION.md`, node
`421:110968` in file `Sv0oWOS1SjWnwhQwdzRJIE`) against the FADS `Tag` primitive as it stood before
this pass (`frontend/src/design-system/primitives/Tag/Tag.tsx` / `Tag.module.css`, both
pre-existing — Tag was already `Implemented` with `visualComplianceStatus: "verified"` per
`figma-component-map.json`, meaning live Figma variant data had been captured in a prior session
but never turned into a spec/compliance pass or added to `docs/COMPONENT_APPROVAL_MATRIX.md`).

---

## 1. Prior Implementation Summary

Before this pass, `Tag` supported only `variant` (`neutral | primary | success | error | warning |
information`) and a single `iconStart` slot. Styling used 6 shared/general tokens
(`--fads-sys-color-text-default`, `--fads-sys-color-border-default`,
`--fads-sys-color-background-subtle`, `--fads-sys-color-primary-strong`,
`--fads-sys-color-primary`, `--fads-sys-color-status-*`) plus generic `--fads-ref-space-1/2` and
`--fads-sys-border-width-thin`/`--fads-sys-radius-pill` — **none of which are the Tag-scoped
Figma variables** the official component actually uses (`Tag/tag-background-*`,
`Tag/tag-border-*`, `Tag/tag-text-*`, `Tag/tag-icon-*`). There was no `size` axis, no `outline`
axis, no `rounded` axis, no `iconOnly` derivation, and no `onColor` mood.

## 2. Differences Found (and Fixed)

| # | Area | Official (live-verified) | Prior implementation | Fixed this pass |
|---|---|---|---|---|
| 1 | Color tokens | 6 moods (`Neutral`/`Success`/`Error`/`Warning`/`Info`/`On-Color`), each with distinct filled-bg/filled-border/outline-border/text/icon Tag-scoped Figma variables | One fixed color scheme per variant reusing generic, non-Tag tokens — not sourced from the Tag component's own Figma variables at all | ✅ Added all 6 mood color chains as new `--fads-sys-tag-*` tokens (`generate-tokens.mjs`), applied via `data-variant` |
| 2 | `Primary` style | **Does not exist** on the live 288-node component set (`Style` = `Neutral \| Success \| Error \| Warning \| Info \| On-Color` only) | `variant="primary"` rendered a green, brand-colored tag with its own Storybook story | ✅ Removed — confirmed unused by any product page (`grep`-verified: only `Tag.tsx`/`Tag.stories.tsx`/`index.ts` referenced it), a non-breaking correction under "never invent variants" |
| 3 | `onColor` mood | Official `Style=On-Color`: translucent-white fill with **no border** when filled, translucent-white border when outline | Did not exist | ✅ Added `variant="onColor"`, structurally distinct from the other 5 moods (no border in filled mode) per spec §4 |
| 4 | `size` prop | Official `Size`: `x Small` (20px/8px pad/10px icon/text-2xs **SemiBold**), `Small` (24px/8px/14px/text-xs Medium), `Medium` (32px/12px/18px/text-md Medium) | No size prop — fixed at a single implicit size using generic spacing tokens, no size-tier typography | ✅ Added `size` prop (`TagSize`), default `'md'`, with dedicated `--fads-sys-tag-height-*`/`-padding-inline-*`/`-icon-size-*` tokens; `xs` correctly uses SemiBold (600) per the live data, `sm`/`md` use Medium (500) |
| 5 | `outline` prop | Official `Outline`: filled (light bg + light border) vs. outline (transparent bg + strong border), text/icon color unchanged either way | No such prop — implementation always rendered a border-only "outline-like" look regardless of intent, with no filled-background state at all | ✅ Added `outline` prop, default `false` (filled); each mood now has both a filled and an outline treatment matching the live tokens exactly |
| 6 | `rounded` prop | Official `Rounded`: `False` → `radius-sm` (4px), `True` → `radius-full` (pill) | Always rendered as a pill (`--fads-sys-color-... border-radius: var(--fads-sys-radius-pill)` unconditionally) — the **default** shape was wrong (official default is `radius-sm`, not pill) | ✅ Added `rounded` prop, default `false` → `--fads-sys-radius-sm`; `rounded` → `--fads-sys-radius-pill` (both shared SYS tokens, reused directly per the established Button/Link precedent for radius specifically) |
| 7 | Icon color vs. text color (Neutral) | Live-verified: Neutral's icon uses the shared `Icon/icon-default` token (`#161616`), genuinely different from its own text color (`#1f2a37`) | Icon inherited the tag's text `color` (no separate icon color at all) | ✅ `.icon` now gets its own `color` per mood; Neutral's icon correctly differs from its text (§4 of the spec) |
| 8 | `iconOnly` | Official `Icon only=True`: drops the label, becomes a centered square (side = the size's own height), padding `spacing-xxs` (2px), `gap: 0` | Not supported — `iconStart` always rendered next to a (possibly empty) label, no square icon-only treatment | ✅ Derived automatically (`children == null && (iconStart \|\| iconEnd)`, mirroring `Button`'s established pattern) with a dev-mode accessible-name warning, matching `Button`'s icon-only guard |
| 9 | Trailing icon | Official component has an independent `trailIcon`/`swapTrailIcon` slot alongside `leadIcon` | Only `iconStart` (leading) existed | ✅ Added `iconEnd` prop |
| 10 | Border reservation | N/A (no prior outline/filled distinction) | Border color set unconditionally per variant, no transparent reservation | ✅ Base `.tag` reserves `border: var(--fads-sys-border-width-thin) solid transparent`, so filled-vs-outline (and on-color's no-border state) never shift the box's outer size — same pattern as `Button`/`Link`'s focus-border reservation |
| 11 | RTL | No dedicated RTL markup change needed — logical CSS + native `dir` already reproduce the Figma source's RTL layout (icons visually correct in both directions) — see spec §8 | N/A (single `iconStart` only, no RTL-specific concern previously) | ✅ No change required beyond adding `dir="auto"` to the label (mirrors `Link`/`Button`); verified equivalent via live RTL variant sampling, not a gap |
| 12 | Typography scale gap | `x Small` needs a `text-2xs` (10px/14px line-height) tier that didn't exist anywhere in the token pipeline | N/A | ✅ Added `--fads-ref-font-size-2xs`, `--fads-sys-typography-text-2xs`, and `--fads-sys-typography-line-height-2xs` as new **shared** typography-scale tokens (not Tag-scoped — consistent with how `text-xs/sm/md/lg` are already shared across every component that needs them) |

## 3. Accessibility

- Icon-only tags now carry the same dev-mode "needs an accessible name" console warning
  `Button` already has for its own icon-only mode — closes a real a11y gap the prior
  implementation had no way to catch.
- Meaning is still carried by the text label, never color alone (WCAG 1.4.1) — the prior
  implementation's DC-05 status-only rule for success/error/warning/information is unchanged and
  now also documented for `onColor` (a mood, not a status, so DC-05 doesn't restrict it).
- Tag remains a non-interactive `<span>` — confirmed correct: the live 288-node grid has no
  `State` variant axis at all (no hover/pressed/focused Tag variant exists).
- `dir="auto"` added to the label span (matches `Button`/`Link`'s existing pattern).

## 4. RTL

No layout bug found or fixed — confirmed via live comparison (spec §8) that a fixed DOM order
(`iconStart`, label, `iconEnd`) plus the ancestor's `dir` attribute already reproduces the Figma
source's RTL behavior (which swaps DOM order as an authoring artifact) without needing any
DOM-order change in code — the same conclusion already verified for `Link`.

## 5. Scope

- Only `Tag.tsx`, `Tag.module.css`, `Tag.stories.tsx`, `Tag.test.tsx`, and the two
  `primitives/index.ts` barrel exports were touched.
- `generate-tokens.mjs` gained one new additive `fads-sys-tag-*` token block (29 tokens) plus 3
  new **shared** typography-scale tokens (`text-2xs` size/sys, `line-height-2xs`) — the latter
  are shared by design (matching the existing `text-xs/sm/md/lg` pattern), not Tag-exclusive.
- `Table.stories.tsx` (the only other consumer of `Tag`, via `<Tag variant={statusTone[...]}>`)
  was checked and uses only `success`/`information`/`error` — unaffected by the `primary` removal
  or any prop change; **not modified**.
- No other component's files were touched.

## 6. Required Code (this pass) — Status

1. ✅ `Tag.tsx` — added `size` (`TagSize`), `outline`, `rounded`, `iconEnd` props; removed
   `variant="primary"`; added `onColor` to `TagVariant`; derived `iconOnly` + dev-mode a11y
   warning (mirrors `Button`).
2. ✅ `Tag.module.css` — token-only, no hardcoded colors/spacing (verified: `lint:css`).
3. ✅ `scripts/generate-tokens.mjs` — 29 new additive `--fads-sys-tag-*` tokens + 3 new shared
   typography-scale tokens (`2xs` tier).
4. ✅ `Tag.stories.tsx` — Neutral, StatusSet, OnColor, Outline, Sizes, Rounded, IconOnly, RTL
   (replaced the removed `Primary` story).
5. ✅ `Tag.test.tsx` — size/outline/rounded/iconOnly/iconEnd coverage added alongside the
   existing label/variant/a11y tests; added an icon-only a11y check.
6. ✅ Exported from both `primitives/Tag/index.ts` and `primitives/index.ts` (public `@ds` API)
   — `TagSize` added alongside the existing `TagProps`/`TagVariant`.

## 7. Validation

Run one command at a time per the workflow, in order:

| Command | Result |
|---|---|
| `npm run typecheck` | ✅ Pass |
| `npm run lint` (eslint + `lint:css`) | ✅ Pass |
| `npm run format:check` | ✅ Pass (after `prettier --write` on 3 generated/touched files) |
| `npm test` | ⚠ 1 failure found and fixed, then ✅ 43 files / 318 tests pass |
| `npm run tokens:validate` | ✅ Pass (297 tokens generated, 0 missing references) |
| `npm run build` | ✅ Pass |
| `npm run build-storybook` | ✅ Pass |

**Bug found and fixed during `npm test`:** the icon-only a11y test failed
(`aria-prohibited-attr`) — a plain `<span>` has an implicit ARIA `generic` role, which
**prohibits** naming attributes (`aria-label`/`aria-labelledby`) per the ARIA-in-HTML spec.
`Tag.tsx` now sets `role="img"` on the root `<span>` when `iconOnly` is true, giving it a role
that permits an accessible name — the same fix pattern any icon-only, non-interactive glyph
needs. Re-ran the full suite after the fix: all 318 tests pass.

## 8. Approval

Live node, all 6 governing variant axes (rtl/size/style/outline/rounded/iconOnly), variables, RTL
behavior, accessibility (including the icon-only fix above), tests, and every validation command
above are verified. **Tag is approved** — see `figma-component-map.json` and
`docs/COMPONENT_APPROVAL_MATRIX.md` for the formal record. No open Needs-Confirmation items this
pass (unlike Link's Neutral+Visited discrepancy) — every token and variant matched the live node
directly with no source inconsistency found.
