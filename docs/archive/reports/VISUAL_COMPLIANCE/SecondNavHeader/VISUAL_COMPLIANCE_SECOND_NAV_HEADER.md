# Visual Compliance Report — Second Nav Header

**Status:** ✅ Approved (2026-07-21) · **Registry:** was `Missing`, zero prior
code · **Node:** `18800:8281` (`J0xq7JG3JKshRDzrgAM7E0`) · **Depends on:**
`Header` (Approved)

## Summary

New build — no pre-existing implementation.

## Verification method

Figma MCP `get_design_context` (`disableCodeConnect: true`) on node
`18800:8281`, which returned the full variant matrix (`rtl` × `style` ×
per-item/per-action/divider toggles) in one response.

## What was built

`SecondNavHeader.tsx` / `SecondNavHeader.module.css` — a slim 40px bar
composing `SecondNavHeaderItem` (icon+label) instances via `children`, plus
an `actions` slot for consumer-composed icon-only `Button`s. `variant`
(`gray`/`primary`) switches background/text/divider colors.

## Findings

- Figma's own prop name for the background axis is literally `style` — a
  reserved HTML attribute name. Renamed to `variant` to avoid shadowing the
  native inline-style prop, a genuine naming conflict rather than a
  stylistic choice.
- The live action buttons share the exact same node reference
  (`407:510376`) as the already-Approved `Button` — confirmed literal
  `Button` instances. `actions` was built as a generic slot rather than a
  rebuilt control, per "reuse Approved components, don't duplicate
  primitives."
- RTL handled entirely through CSS logical properties and direction-relative
  `flex-direction: row` — no manual DOM reordering needed, despite the
  Figma-authored markup's own conditional reversal for the RTL variant.

## Tokens

12 new additive `--fads-sys-secondnavheader-*` tokens — see
`docs/FIGMA_SECOND_NAV_HEADER_SPECIFICATION.md` §7.

## Tests / Stories

`SecondNavHeader.test.tsx` (6 tests): composed items render, composed
actions render, variant default/override, divider default/hidden, axe.
`SecondNavHeader.stories.tsx`: Gray, Primary, WithoutDivider,
**OfficialFigmaReference** (4-item + 2-action composition matching the live
demo), RTL.

## Visual verification

Screenshotted the rendered `Gray`/`Primary`/`OfficialFigmaReference` stories
via headless-Edge against the live Figma `get_screenshot` output — bar
height, item spacing, icon+label layout, and both background/divider color
combinations match.

## Needs Confirmation

The exact `Button` `size` mapping for a pixel-identical 32×32 action-button
match — see spec §5/§8 (non-blocking; `Button` itself is unmodified and
already Approved).
