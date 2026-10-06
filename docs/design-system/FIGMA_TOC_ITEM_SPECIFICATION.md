# Figma Specification — TOC Item

**Registry name:** TOC Item · **Figma file:** `J0xq7JG3JKshRDzrgAM7E0` ("Components
Library - Platforms Code (Community)") · **Node:** `2962:37761` · **Component key:**
`26241e6b442f71bfeba527dd8b14502e4dcc3461`

Verified live via Figma MCP `get_design_context` (`disableCodeConnect: true`).
Figma's own component description: *"The TOC Item represents a navigational
entry in a structured content list. It supports hierarchy, active states, and
click interaction for seamless navigation."*

## 1. Variant axes (48 total)

`rtl` × `level`[Level 1 (H2)/Level 2 (H3)/Level 3 (H4)] × `selected` ×
`state`[Default/Hovered/Pressed/Focused]

## 2. Structure

A single-row `<button>`-equivalent, `min-width: 140px`, `padding-inline-start:
16px`, `padding-inline-end: 8px` (constant across all levels — indentation
comes from nesting-bar elements, not extra padding), `border-radius: 2px`
(`radius-xs`).

- **Nesting indicator(s):** Level 2 renders one 16px-wide slot containing a
  2px-wide, full-height vertical bar (`background-neutral-300` `#d2d6db`,
  rounded); Level 3 renders two. Level 1 renders none.
- **Label:** `padding-block: 6px`, text-sm (14px/20px line-height).
- **Selection indicator:** an absolute-positioned 3px-wide, full-height,
  fully-rounded bar at the leading edge — color depends on state (below).

## 3. State matrix

| State | Selected | Background | Label weight/color | Indicator |
| --- | --- | --- | --- | --- |
| Default | ✅ | none | Semibold, `#161616` | `#1b8354` (brand primary) |
| Hovered | ✅ | none | Semibold, `#161616` | `#1b8354` |
| Pressed | ✅ | none | Semibold, `#161616` | `#1b8354` |
| Focused | ✅ | none | Semibold, `#161616` | **transparent** (focus ring below takes over) |
| Default | ❌ | none | Regular, `#384250` | none |
| Hovered | ❌ | `#f3f4f6` (neutral-100), cursor pointer | Regular, `#161616` | `#9da4ae` (neutral-400) |
| Pressed | ❌ | `#e5e7eb` (neutral-200) | Regular, `#161616` | `#1f2a37` (neutral-800) |
| Focused | ❌ | none | Regular, `#384250` | none |

**Focused** (any `selected`): a `2px solid #161616` border wraps the whole
item, replacing the colored indicator (which renders with no fill — a
live-verified quirk, reproduced as sampled). Implemented as an inset
`box-shadow` to avoid layout shift instead of an actual border.

## 4. RTL

Padding, indicator side, and nesting-bar alignment all flip. Implemented via
CSS logical properties (`padding-inline-*`, `inset-inline-start`) — no manual
DOM reversal needed, unlike the Figma-authored markup's own conditional
reordering (same category of authoring artifact already found for
Button/DropdownListItem/TrailingIcon).

## 5. No `Disabled` variant

Not sampled anywhere in the 48-variant set — not implemented. Native
`disabled` still works via the browser default only (unstyled).

## 6. Tokens

16 new additive `--fads-sys-tocitem-*` tokens. Reuses shared `--fads-ref-neutral-*`/
`--fads-ref-primary-600`/`--fads-sys-radius-full`/`--fads-sys-typography-text-sm`
directly wherever the live value matches exactly; mints its own tokens for
padding/radius/focus-ring (the `#161616` focus-ring/selected-text value is a
literal already used independently by many other components' own tokens —
Button, Card, Header, Link, Tag, TextInput — not a shared ref primitive in
this codebase).

## 7. Needs Confirmation

None — every sampled state matches the implementation exactly.
