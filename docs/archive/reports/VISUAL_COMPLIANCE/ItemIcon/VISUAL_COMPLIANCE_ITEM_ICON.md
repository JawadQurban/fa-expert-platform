# Visual Compliance Report — Item Icon

**Status:** ✅ Approved (2026-07-20) · **Registry:** was `Missing`, briefly
mis-dismissed as a non-component before correction · **Node:** `30150:148742`
(`J0xq7JG3JKshRDzrgAM7E0`)

## Summary

New build, corrected from an earlier mistake this same session. While
building `HeaderSubMenuItem`, this node's own component-description
metadata surfaced inside that component's `get_design_context` response,
and was wrongly interpreted as evidence `Item Icon` was "just a generic
icon-slot wrapper, not a distinct component" — without ever independently
sampling this node's own `get_design_context`. The user caught this by
screenshotting their own Figma view directly, which showed `Item Icon` as
a real, standalone 4-variant component set. This report documents the
correction.

## Verification method

Figma MCP `get_design_context` (`disableCodeConnect: true`) on node
`30150:148742` directly (the user's own linked URL), sampling all 4
variants in one response.

## What was built

`ItemIcon.tsx` / `ItemIcon.module.css` — a standalone composite: `icon`
(required `ReactNode` slot), `contained` (tinted rounded box), `onColor`.
`HeaderSubMenuItem` was refactored to compose `<ItemIcon>` for its own icon
slot instead of duplicating box logic — its `icon`/`boxedIcon`/`onColor`
props now pass straight through.

## Findings

- Confirmed 4 real variants (`contained` × `onColor`), each with a
  genuinely different box treatment — not a single generic wrapper.
- The `contained` box background differs by `onColor`:
  `background-primary-50` (`#f3fcf6`) light, `alpha-white-10`
  (`rgba(255,255,255,0.1)`) on-color — **the original `HeaderSubMenuItem`
  pass had only implemented the light-mode value and never handled the
  on-color+boxed combination at all**, a real gap now fixed by this
  refactor.
- Icon glyph color could not be pixel-sampled per variant with confidence;
  implemented using the one live-verified value (`#161616`) plus the
  already-established on-color white switch — disclosed as Needs
  Confirmation rather than guessed from the demo checkmark's own coloring.

## Tokens

6 new additive `--fads-sys-itemicon-*` tokens — see
`docs/FIGMA_ITEM_ICON_SPECIFICATION.md` §5. 2 now-dead
`--fads-sys-headersubmenuitem-icon-box-*` tokens from the earlier incorrect
pass were removed (superseded by `ItemIcon`'s own tokens).

## Tests / Stories

`ItemIcon.test.tsx` (5 tests): icon content render, `aria-hidden`,
`data-contained` on/off, `data-oncolor`. `ItemIcon.stories.tsx`: Plain,
Contained, OnColorPlain, OnColorContained, **OfficialFigmaReference** (all
4 variants side by side, matching the live component-set screenshot).

## Needs Confirmation

Icon color per variant — see spec §3.
