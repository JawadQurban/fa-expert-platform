# Visual Compliance Report — List

**Status:** ✅ Approved (2026-07-21) · **Registry:** was `Missing`, zero
prior code · **Node:** `7850:3506` (`J0xq7JG3JKshRDzrgAM7E0`) · **Depends
on:** `List item` (Approved, same session)

## Summary

New build — no pre-existing implementation.

## Verification method

Figma MCP `get_design_context` (`disableCodeConnect: true`) on node
`7850:3506`, which returned the full 4-item demo composition (`rtl` ×
`type` × `style`) in one response.

## What was built

`List.tsx`/`List.module.css` — a thin semantic wrapper (`<ol>` for
`type="ordered"`, `<ul>` otherwise) composing `children` (already-Approved
`ListItem`s) with zero inter-item gap and `list-style: none` (to avoid
doubling up with `ListItem`'s own custom marker/icon).

## Findings

- Confirmed via direct inspection that the live node's inter-item spacing is
  genuinely zero — `ListItem`'s own internal `gap: 8px` (marker↔text) is a
  separate, unrelated value, not misread as inter-item spacing.
- Deliberately did not add a `List`-level `tone` prop duplicating
  `ListItem`'s own already-Approved `tone` — a disclosed simplification
  avoiding two overlapping sources of truth for the same value.

## Tokens

1 new additive `--fads-sys-list-gap` token — see
`docs/FIGMA_LIST_SPECIFICATION.md` §5.

## Tests / Stories

`List.test.tsx` (4 tests): renders as `<ul>`/`<ol>` per `type`, composed
children render, axe. `List.stories.tsx`: Unordered, Ordered,
**OfficialFigmaReference** (1 Level-1 item + 3 Level-2 items, matching the
live demo exactly), RTL.

## Visual verification

Screenshotted the rendered `OfficialFigmaReference` story via headless-Edge
— structure, indentation, and zero-gap stacking all match the live Figma
demo.

## Needs Confirmation

None.
