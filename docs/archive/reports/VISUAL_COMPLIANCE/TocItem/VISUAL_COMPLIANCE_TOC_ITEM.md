# Visual Compliance Report — TOC Item

**Status:** ✅ Approved (2026-07-20) · **Registry:** was `Missing`, zero prior
code · **Node:** `2962:37761` (`J0xq7JG3JKshRDzrgAM7E0`)

## Summary

New build — no pre-existing implementation to diff against, so there are no
"discrepancies" in the usual sense; every value below is a first-implementation
of the live-verified data.

## Verification method

Figma MCP `get_design_context` (`disableCodeConnect: true`) on node
`2962:37761`, sampling all 48 variants (`rtl` × `level` × `selected` ×
`state`) as returned by a single call (design context response covered the
full variant matrix directly, so no separate `get_metadata` enumeration was
needed).

## What was built

`TocItem.tsx` / `TocItem.module.css` — a native `<button>`, `level`/
`selected` props, `state` expressed via real CSS pseudo-classes
(`:hover`/`:active`/`:focus-visible`) rather than a prop, matching the
already-established pattern for interactive list-style composites (same
approach as `MenuListItem`). `aria-current="true"` marks the selected item
(a TOC list is effectively an in-page nav landmark, so `aria-current` is the
correct ARIA signal — `aria-pressed`, used by `MenuListItem`'s own toggle-like
semantics, would misrepresent a "you are here" indicator as a toggle button).

## Findings

- Padding stays constant across all 3 levels; indentation comes purely from
  0–2 leading 16px nesting-bar elements — confirmed by direct inspection of
  the Level 2/Level 3 markup, not assumed.
- `Focused` state (any `selected`) renders the colored selection-indicator bar
  with **no background fill at all** — reproduced exactly rather than
  "corrected" to always show a color, since the focus ring itself is the
  primary visual cue in that state.
- No `Disabled` variant exists anywhere in the 48-variant set.

## Tokens

16 new additive `--fads-sys-tocitem-*` tokens — see
`docs/FIGMA_TOC_ITEM_SPECIFICATION.md` §6 for the full reuse/mint breakdown.

## Tests / Stories

`TocItem.test.tsx` (8 tests): label rendering, click, `aria-current`/
`data-selected` on/off, nesting-bar count per level, axe (default + selected).
`TocItem.stories.tsx`: Default, Selected, Level2, Level3,
**OfficialFigmaReference** (a 4-item nested nav), RTL, LTR.

## Needs Confirmation

None.
