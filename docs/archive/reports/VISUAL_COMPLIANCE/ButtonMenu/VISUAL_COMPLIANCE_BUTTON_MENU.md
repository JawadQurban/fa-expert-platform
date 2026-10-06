# Visual Compliance Report — Button-menu

**Status:** ✅ Approved (2026-07-21) · **Registry:** was `Missing`, zero
prior code · **Node:** `411:4377` (`J0xq7JG3JKshRDzrgAM7E0`) · **Depends
on:** `Button` (Approved, extended), `Menu` (Approved, composed)

## Summary

New build — no pre-existing implementation.

## Verification method

`get_metadata` on node `411:4377` (432 variant nodes enumerated), then
targeted `get_design_context` calls on 8 representative nodes: Default/
Primary/Medium (text mode), Default/Primary/Medium (icon-only mode),
Default/Subtle/Medium, Hovered/Subtle/Medium, Hovered/Transparent/Medium
(to confirm `Subtle` and `Transparent` are genuinely distinct), Pressed/
Subtle/Medium, Focused/Subtle/Medium, Disabled/Subtle/Medium, Selected/
Subtle/Medium.

## What was built

`ButtonMenu.tsx`/`ButtonMenu.module.css` — composes the already-Approved
`Button` (trigger, with a CSS-drawn trailing chevron in `iconEnd`) and the
already-Approved `Menu` (disclosed panel, portaled via the same position/
outside-click/Escape architecture already established by `Select`/
`DatePicker`). Also extended `Button` itself with a new `subtle` variant
(§ below).

## Findings

- The live component is literally `Button`'s own chrome plus an
  always-present trailing chevron — confirmed by direct token/class
  comparison, not assumed.
- 5 of 6 `style` values already mapped 1:1 onto `Button`'s existing
  variants (confirmed via `Button.module.css`'s own inline comments
  cross-referencing the official Figma style names). The 6th, `Subtle`, was
  a genuinely new variant — live-sampled across all 6 states and added
  additively to `Button` itself (not duplicated inside `ButtonMenu`), per
  reuse-over-duplication.
- **Real, disclosed exception found:** `Subtle`'s own Disabled state has no
  background fill, unlike every other `Button` variant's shared flat-gray
  disabled treatment. Fixed with a scoped CSS override touching only the new
  variant — no other variant's already-verified Disabled behavior was
  changed. This also surfaced an open question about whether `secondary`/
  `tertiary`'s own Disabled treatment was ever independently verified
  against this same "stays transparent" pattern — flagged Needs
  Confirmation for a future pass, not resolved here (reopening `Button`'s
  full Disabled behavior across all variants is out of this component's
  scope).
- `arrow-down-01` isn't in the Icon registry — CSS-drawn, same disclosed
  substitute technique as `Select`'s own chevron.
- The composed `Menu` panel doesn't implement a strict ARIA `role="menu"`
  pattern (an already-disclosed `MenuListItem` simplification) — the
  trigger correctly uses `aria-expanded`/`aria-controls` rather than
  overclaiming `aria-haspopup="menu"`.

## Tokens

0 new tokens for `ButtonMenu` itself (fully composed). 2 new additive
`--fads-sys-button-subtle-bg-*` tokens added to the already-Approved
`Button` — see `docs/FIGMA_BUTTON_MENU_SPECIFICATION.md` §7.

## Tests / Stories

`ButtonMenu.test.tsx` (7 tests): trigger renders, collapsed by default,
opens on click + moves focus into the panel, closes on Escape + returns
focus to trigger, closes on outside click, stays closed when disabled, axe
(closed + open, scoped to the actual portaled panel). `Button.test.tsx`
extended to cover the new `subtle` variant in its existing parametrized test
(34 tests, up from 32). `ButtonMenu.stories.tsx`: Primary, Neutral,
SecondarySolid, Secondary, Subtle, Transparent, Sizes, WithLeadingIcon,
IconOnly, Disabled, **OfficialFigmaReference**, RTL. `Button.stories.tsx`
gained a new `Subtle` story.

## Visual verification

Screenshotted the rendered `OfficialFigmaReference` ButtonMenu story and the
new Button `Subtle` story via headless-Edge — chrome, chevron, and the
transparent-default/muted-text `Subtle` treatment all match the live Figma
sampling.

## Needs Confirmation

See spec §4/§8 — whether `secondary`/`tertiary`'s Disabled state should
also stay transparent rather than take the shared flat-gray fill.
