# Visual Compliance Report — Header Sub-menu Item

**Status:** ✅ Approved (2026-07-20) · **Registry:** was `Missing`, deferred
out of scope in the original Header pass · **Node:** `30150:148183`
(`Sv0oWOS1SjWnwhQwdzRJIE`)

## Summary

New build — no pre-existing implementation.

## Verification method

Figma MCP `get_design_context` (`disableCodeConnect: true`) on node
`30150:148183`, sampling the full variant matrix (`rtl` × `onColor` ×
`state` × `icon`/`helperText`/`tag` toggles) via a single call. **Follow-up
pass:** after the initial build, a `get_screenshot` comparison against the
actual rendered Storybook output (via a headless-browser check) caught a
real, missed border — corrected before this component was finalized as
Approved. See §"Correction" below.

## What was built

`HeaderSubMenuItem.tsx` / `HeaderSubMenuItem.module.css` — a native
`<button>` row: optional leading `icon` slot, `label`, optional `helperText`,
optional composed `tag` slot. `onColor` renders the on-brand variant.
Hovered/Pressed/Focused expressed as real CSS pseudo-classes.

## Findings

- Confirmed `Item Icon` (a separately tracked registry row, node
  `30150:148742`) is literally the icon slot used here, not an independent
  component — see `docs/FIGMA_HEADER_SUB_MENU_ITEM_SPECIFICATION.md` §3 and
  the "Item Icon" row's own resolution.
- The "New" badge is a literal `Tag` `variant="success"` instance
  (byte-identical token comparison) — composed via a generic slot rather
  than reinvented.
- Label gets `text-decoration: underline` on Hovered/Pressed/Focused (all
  three, consistently, in both `rtl` and `onColor` combinations) — not just
  Hovered as might be assumed; confirmed by direct inspection of the
  extracted conditional logic.

## Correction — missed border, caught by visual re-check

The initial build (based solely on `get_design_context`/`get_variable_defs`
text extraction, with no visual comparison) rendered every state
**borderless**. A follow-up visual check — screenshotting the live Figma
node directly via `get_screenshot`, then screenshotting the actual rendered
Storybook story via a headless browser, and comparing the two side by side —
showed the real component has a visible 1px card border in every
non-focused state (including `Default`), which neither `get_design_context`
nor `get_variable_defs` had surfaced in their text/variable output. Fixed by
adding `border: 1px solid` with a visually-approximated color (exact bound
value unavailable from either tool) — see
`docs/FIGMA_HEADER_SUB_MENU_ITEM_SPECIFICATION.md` §2a. A second, unrelated
defect was also caught by the same visual pass: this component's own
Storybook `OnColor` story used a hand-picked wrapper background
(`#1b8354`, the shared brand-primary green) instead of the live-verified
`#074d31` "SA flag green" — a documentation/story bug, not a component
defect, also fixed. **Lesson applied going forward:** every component in
this batch now gets an actual `get_screenshot` vs. rendered-Storybook visual
comparison before being marked Approved, not just a text-level Figma MCP
read.

## Tokens

17 new additive `--fads-sys-headersubmenuitem-*` tokens (15 initial + 2
border tokens from the correction above) — see
`docs/FIGMA_HEADER_SUB_MENU_ITEM_SPECIFICATION.md` §7.

## Tests / Stories

`HeaderSubMenuItem.test.tsx` (7 tests): label render, click, helper
text present/absent, tag slot, `data-oncolor`, axe.
`HeaderSubMenuItem.stories.tsx`: Default, WithoutHelperText, WithoutIcon,
WithTag, OnColor, RTL.

## Needs Confirmation

The border color — visually approximated, not pixel-sampled (see spec §2a
and §8).
