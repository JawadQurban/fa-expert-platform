# Visual Compliance Report — List item

**Status:** ✅ Approved (2026-07-21) · **Registry:** was `Missing`, zero
prior code · **Node:** `7850:3463` (`J0xq7JG3JKshRDzrgAM7E0`)

## Summary

New build — no pre-existing implementation.

## Verification method

Figma MCP `get_design_context` (`disableCodeConnect: true`) on node
`7850:3463`, which returned the full variant matrix (`rtl` × `type` ×
`level` × `style`) in one response.

## What was built

`ListItem.tsx`/`ListItem.module.css` — a real `<li>` with `type`/`level`/
`tone`/`marker`/`icon` props, meant to be composed inside a `<ul>`/`<ol>`.

## Findings

- The live marker text is per-instance literal content, not generated —
  `marker` is a generic slot, deliberately not baking in numbering/
  lettering logic that belongs to the not-yet-built parent `List`.
- **Live-sampled asymmetry, reproduced exactly:** `Unordered`/Level One uses
  a `-` marker, Level Two uses `•` — the opposite of the usual
  bullet-then-dash nesting convention.
- **Unusual color scoping, confirmed not assumed:** `tone` colors the
  *entire* item (marker/icon + text) as one unit, not just the marker.
- Figma's own `style` prop was renamed to `tone` for the same reserved-word
  collision reason already established for `SecondNavHeader`'s own
  `style`→`variant` rename.
- `checkmark-circle-02` isn't in the Icon registry — same disclosed gap
  already accepted for `Alert`/`Toast`/`Notification`/`ItemIcon`.

## Tokens

6 new additive `--fads-sys-listitem-*` tokens — see
`docs/FIGMA_LIST_ITEM_SPECIFICATION.md` §8.

## Tests / Stories

`ListItem.test.tsx` (7 tests): renders as `listitem` with text, marker
render, icon slot replaces marker for `type="icon"`, `data-level`
attribute, level/tone defaults, tone override, axe. `ListItem.stories.tsx`:
Unordered, Ordered, NestedLevel2, WithIcon, Tones, **OfficialFigmaReference**
(3-item ordered list with a nested level-2 item, matching the live demo),
RTL.

## Visual verification

Screenshotted the rendered `OfficialFigmaReference` story via headless-Edge
— confirmed level-2 indentation is correctly pushed further from the
reading-start edge under the app's default RTL layout (logical CSS
properties mirror automatically, no manual DOM reordering needed).

## Needs Confirmation

None.
