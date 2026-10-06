# Visual Compliance Report — Nav Header Sub-Menu

**Status:** ✅ Approved (2026-07-20) · **Registry:** was `Missing`, deferred
out of scope in the original Header pass · **Node:** `30150:148877`
(`Sv0oWOS1SjWnwhQwdzRJIE`) · **Depends on:** `HeaderSubMenuItem` (Approved,
same session)

## Summary

New build — no pre-existing implementation.

## Verification method

Figma MCP `get_design_context` (`disableCodeConnect: true`), sampling 3 of
24 variants directly (Default/Text-only, Default/Boxed-icon, Dark
green/Text-only) — sufficient to cover every structural and color axis
without sampling all 24 (the remaining axes are `rtl`/`fullWidth`, both
confirmed as pure mirroring/no-op respectively from prior components'
findings).

## What was built

`NavHeaderSubMenu.tsx` / `NavHeaderSubMenu.module.css` — a shadowed panel
(`NavHeaderSubMenu`) wrapping 1-4 `NavHeaderSubMenuColumn`s (group label +
composed `HeaderSubMenuItem`s). **Also extended** the already-Approved
`HeaderSubMenuItem` with a new `boxedIcon?: boolean` prop (additive,
non-breaking) after sampling the `Boxed icon` `linkStyle` revealed a
genuinely new icon-box treatment not covered by the existing `icon`/
`helperText` toggles.

## Findings

- `Boxed icon` wraps the icon in a `background-primary-50` (`#f3fcf6`)
  rounded 12px-padded box — a real, previously-unmodeled variant, not
  something the original `HeaderSubMenuItem` pass missed (it wasn't sampled
  in that pass's own variant set).
- "Dark green" background is `#074d31`, **not** the shared brand-primary
  `#1b8354` — a distinct token, confirmed by direct sampling.
- `fullWidth` has no structural effect — the two sampled canvas widths are
  demo-frame sizing only, not implemented as a prop.

## Tokens

16 new additive tokens (14 `--fads-sys-navheadersubmenu-*` + 2
`--fads-sys-headersubmenuitem-icon-box-*` on the extended `HeaderSubMenuItem`)
— see `docs/FIGMA_NAV_HEADER_SUB_MENU_SPECIFICATION.md` §7.

## Tests / Stories

`NavHeaderSubMenu.test.tsx` (4 tests): composed columns + items render,
multiple columns, `data-oncolor`, axe. `NavHeaderSubMenu.stories.tsx`:
TextOnly, SimpleIcon, BoxedIcon, OnColor, **OfficialFigmaReference** (4
columns × 4 items, matching the live demo), RTL. `HeaderSubMenuItem.test.tsx`
unchanged and still passing (the `boxedIcon` extension is additive).

## Needs Confirmation

See spec §8 — `onColor`/`boxedIcon` must be applied per-item by the
consumer, a disclosed limitation of `children`-based composition (same
category already accepted for `Toc`).
