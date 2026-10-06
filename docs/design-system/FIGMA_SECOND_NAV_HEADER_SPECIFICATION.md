# Figma Specification — Second Nav Header

**Registry name:** Second Nav Header · **Figma file:** `J0xq7JG3JKshRDzrgAM7E0`
("Components Library - Platforms Code (Community)") · **Node:** `18800:8281`
· **Component key:** `100219e39ca2643e2abc98beb1477afff100db7c`

Verified live via Figma MCP `get_design_context` (`disableCodeConnect: true`).
Figma's own description: *"The Second Nav Header component is a secondary
navigation bar that appears above the primary navigation and offers
additional controls or context-based information."* Documentation:
https://design.dga.gov.sa/guidelines/components/ui-shell/second-nav-header

## 1. Variant axes

`rtl` × `style`[Gray/Primary] × `showContent`/`showItem2`/`showItem3`/
`showItem4`(bool, up to 4 contextual items) × `showActions`/`showAction2`/
`showAction3`/`showAction4`(bool, up to 4 action buttons) × `showDivider`

## 2. Structure

A `40px`-tall bar, `padding-inline: 32px`. One row: a flex-1 group of
contextual `sub-header-Item`s (24px icon + 16px/24px Regular label, `gap:
4px` each, `gap: 16px` between items) on the leading side, an `actions`
group (`gap: 6px`) on the trailing side. An optional 1px divider along the
bottom edge.

Figma's own demo content for the 4 items is a weather/date/time/location
dashboard (`Cloudy`, `3-Sep-2024`, `2:30 PM`, `Al-Riyadh`) — generic
placeholder data, not a fixed content contract. `SecondNavHeaderItem`
(`icon`+`children`) is the reusable unit; `SecondNavHeader` composes any
number of them via `children`.

## 3. `style` → `variant` rename

Figma's own prop name for the background axis is `style`. Renamed to
`variant` in this implementation since `style` collides with the native
HTML `style` attribute (inline CSS) already present on every DOM element —
using it as a component prop name would shadow that and break consumer
usage.

## 4. Colors

| | Gray | Primary |
| --- | --- | --- |
| Background | `#f3f4f6` (neutral-100) | `#1b8354` (brand primary) |
| Text/icon | `#384250` (text-primary-paragraph) | `#ffffff` (text-oncolor-primary) |
| Divider | `#d2d6db` (border-neutral-primary) | `rgba(255,255,255,0.3)` (alpha-white-30) |

## 5. Actions

The live action buttons (zoom-in, zoom-out, mic, view icons in the demo)
share the exact node reference (`407:510376`) as the already-Approved
`Button` component — confirmed literal `Button` instances, not a distinct
control. `actions` is a generic `ReactNode` slot for consumer-composed
icon-only `<Button>`s rather than a rebuilt control; the live 32×32px /
`radius-sm` icon-button sizing was not independently re-verified against
`Button`'s own size scale (out of this pass's scope — `Button` is already
Approved and unchanged here). **Needs Confirmation** (non-blocking): exact
`Button` `size` mapping for a pixel-identical 32×32 match.

## 6. RTL

Single logical-property DOM structure — `flex-direction: row` is
direction-relative in CSS, so it mirrors automatically under `dir="rtl"`.
No manual DOM reordering, unlike the Figma-authored markup's own
conditional reversal (same category of authoring artifact already found for
Button/DropdownListItem/TrailingIcon/TocItem).

## 7. Tokens

12 new additive `--fads-sys-secondnavheader-*` tokens. Reuses
`--fads-ref-neutral-100`/`-300`/`-700`/`--fads-ref-primary-600` directly
where values matched exactly.

## 8. Needs Confirmation

The exact `Button` `size` mapping for the action buttons (§5).
