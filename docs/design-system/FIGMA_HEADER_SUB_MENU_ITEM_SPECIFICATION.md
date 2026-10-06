# Figma Specification — Header Sub-menu Item

**Registry name:** Header Sub-menu Item · **Figma file:** `Sv0oWOS1SjWnwhQwdzRJIE`
(the dedicated Header file, distinct from the main "Components Library"
file) · **Node:** `30150:148183` · **Component key:**
`f6190b02ddda97e3d53f53296415df5f73e44cd8`

Verified live via Figma MCP `get_design_context` (`disableCodeConnect: true`).
Figma's own description: *"The Header Sub-Menu Item displays a list item
states."* Documentation:
https://design.dga.gov.sa/guidelines/components/ui-shell/navigation-header

Deferred out of scope in the original Header visual-compliance pass (see the
registry row's own pre-existing note) — built now.

## 1. Variant axes

`rtl` × `onColor` × `state`[Default/Hovered/Pressed/Focused] × `icon`(bool) ×
`helperText`(bool) × `tag`(bool)

## 2. Structure

Row: `gap: 16px`, `padding-inline: 16px`, `padding-block: 8px`,
`border-radius: 8px` (`radius-md`, reused directly), **`border: 1px solid`
in every non-focused state** (see §2a — this was missed by the first
extraction pass and caught only via a follow-up `get_screenshot` visual
check). Leading 24px icon (optional) → content column (`gap: 12px`) →
label+tag row (`gap: 8px`, 16px/24px Medium label, optional composed `Tag`
"New" badge) → optional helper text (14px/20px Regular).

## 2a. Border — extraction gap, caught by visual re-check

`get_design_context` (all 4 states sampled) and `get_variable_defs` **both
omitted** a real 1px card border that is visible on every non-focused state,
including `Default` — confirmed only after a `get_screenshot` comparison
against the rendered Storybook output showed the built component looked
flat/borderless next to the real Figma reference. Neither tool surfaced a
bound variable for it (likely an "inside" stroke set directly on the frame
rather than through the variable system, which this Dev Mode extraction
path doesn't always emit). The exact color could not be sampled, so it is
**visually approximated**: `#d2d6db` (`--fads-ref-neutral-300`) for
`!onColor`, matching this codebase's own existing generic "subtle card
border" convention (already used identically by `Card`/`Button`);
`rgba(255,255,255,0.24)` for `onColor`, matching the same translucent-white
family already live-verified for the 0.2/0.4 hover/press on-color
backgrounds. **Needs Confirmation** — not pixel-sampled, a reasoned match.

## 3. `Item Icon` finding

The response's own component-description block surfaced `Item Icon` (node
`30150:148742` — the exact node already tracked as its own registry row) as
a nested sub-component here, confirming it is a generic icon-slot wrapper,
not an independent component. This repo exposes it as a plain `icon?:
ReactNode` prop rather than building a separate `ItemIcon` composite — see
the "Item Icon" registry row's own resolution.

## 4. State matrix

| State | Background (`!onColor`) | Background (`onColor`) | Label decoration |
| --- | --- | --- | --- |
| Default | none | none | none |
| Hovered | `#f3f4f6` (neutral-100), pointer | `rgba(255,255,255,0.2)` | underline |
| Pressed | `#e5e7eb` (neutral-200) | `rgba(255,255,255,0.4)` | underline |
| Focused | `box-shadow: inset 0 0 0 2px #161616` | `inset 0 0 0 2px #ffffff` | underline |

Text color: `#1f2a37` (`text-display`) when `!onColor`; `#ffffff` when
`onColor` (label, helper, and icon all follow this same switch). Helper text
uses `#384250` (`text-primary-paragraph`) when `!onColor`.

## 5. `Tag`

The live "New"/"وسم" badge is a literal instance of the already-Approved
`Tag` component (`variant="success"`, byte-identical background/border/text
colors confirmed by direct comparison) — composed via a generic `tag?:
ReactNode` slot rather than a hardcoded badge.

## 6. RTL

Row reverses via `flex-direction` mirroring naturally under `dir="rtl"`
(no explicit RTL-only styling needed — logical properties throughout).

## 7. Tokens

17 new additive `--fads-sys-headersubmenuitem-*` tokens (15 from the initial
pass + 2 border tokens added in the §2a follow-up fix). Reuses
`--fads-sys-radius-md`/`--fads-sys-typography-text-md`/`-sm`/
`--fads-ref-neutral-700`/`-800` directly; on-color translucent
backgrounds/`#ffffff` text/focus-ring are freshly minted (no existing
generic "on-color" scale in this codebase yet).

## 8. Needs Confirmation

The border color in §2a — visually approximated, not pixel-sampled (see
§2a for the exact values and reasoning).
