# Figma Specification — Button-menu

**Registry name:** Button-menu · **Figma file:** `J0xq7JG3JKshRDzrgAM7E0`
("Components Library - Platforms Code (Community)") · **Node:** `411:4377`
· **Component key:** `07054b8a1d67f04002f43113d2d2889d33b65c52`

Verified live via Figma MCP `get_metadata` (enumerating all 432 variant
nodes) + targeted `get_design_context`/`get_variable_defs` calls on 8
representative nodes covering every axis. Figma's own description: *"Menu
button functions as a toggle to reveal a menu presenting various options."*

## 1. Variant axes (432 total)

`rtl` × `size`[Small/Medium/Large] × `state`[Default/Hovered/Pressed/
Focused/Disabled/Selected] × `style`[Primary/Neutral/Secondary-Solid/
Secondary-Outline/Subtle/Transparent] × `iconOnly`

## 2. Structure — literally `Button` + a trailing chevron

Sampling the Default/Medium/Primary node confirmed the live markup is
byte-for-byte `Button`'s own chrome (`button-background-primary-default`,
`buttons-md-gap`/`-padding`, `radius-sm`, `text-oncolor-primary`) plus an
always-present trailing 16px `arrow-down-01` icon. This is composed, not
rebuilt: `ButtonMenu` renders `<Button variant size iconStart={icon}
iconEnd={<chevron/>}>`.

## 3. `style` → `Button` `variant` mapping

| Figma `style` | `Button` `variant` | Verified how |
| --- | --- | --- |
| Primary | `primary` | Already documented in `Button`'s own spec |
| Neutral | `neutral` | Already documented |
| Secondary-Solid | `secondarySolid` | Already documented |
| Secondary-Outline | `secondary` | Already documented |
| Transparent | `tertiary` | Already documented |
| **Subtle** | **`subtle` (new)** | Live-sampled fresh in this pass — see §4 |

5 of 6 styles already existed as `Button` variants (confirmed via
`Button.module.css`'s own inline comments cross-referencing the official
Figma `Style` names). `Subtle` did not.

## 4. `Button` variant: `subtle` (documented since Button's own original pass, never implemented until now)

`docs/FIGMA_BUTTON_SPECIFICATION.md` already documented `Subtle`'s
Default/Pressed colors from Button's own original build, but `Button.tsx`
never actually implemented it as a selectable variant — a real,
pre-existing gap, only discovered and closed here since `Button-menu`'s own
component set requires every style to be real. Live-sampled fresh across
all 6 states in this pass (nodes `411:4478`/`4730`/`4982`/`5234`/`5494`/
`5762`) — Default/Pressed cross-confirm the original spec exactly; Hovered/
Selected/Focused/Disabled are newly covered:

| State | Background | Text |
| --- | --- | --- |
| Default | transparent | `#161616` (`text-default`) |
| Hovered | `#f3f4f6` (`button-background-neutral-hovered`) | `#161616` |
| Pressed | `#e5e7eb` (`button-background-neutral-pressed`) | `#161616` |
| Selected | `#e5e7eb` (same as Pressed) | `#161616` |
| Focused | `Button`'s existing double-ring (unchanged) | `#161616` |
| **Disabled** | **transparent** (no fill) | `#9da4ae` (`text-default-disabled`) |

Added as a new additive `ButtonVariant` on the already-Approved `Button`
primitive (`docs/FIGMA_BUTTON_SPECIFICATION.md` updated) rather than
duplicated inside `ButtonMenu` — per the reuse-over-duplication policy, and
because `subtle` is a genuine `Button` variant with no `ButtonMenu`-specific
behavior. **Disabled is a live-verified, disclosed exception**: every other
`Button` variant's Disabled state uses the shared flat-gray
`--fads-sys-button-disabled-bg` fill (documented in `Button.module.css` as
"variant-agnostic"), but `subtle`'s own live Disabled data shows no
background fill at all — implemented as a scoped CSS override
(`.button[data-variant='subtle']:disabled`) that does not touch any other
variant's already-verified Disabled behavior. **Needs Confirmation, flagged
for a future pass, not fixed here (out of this component's scope):** whether
`secondary`/`tertiary` (also transparent-by-default) have the same
disabled-stays-transparent behavior that was never independently verified
when `Button` was originally built — `subtle`'s own data raises the
question but resolving it means re-opening `Button`'s own already-Approved
component beyond this one additive variant.

## 5. Chevron

`arrow-down-01` isn't in the Icon registry — CSS-drawn (rotated-border
triangle), the same disclosed-substitute technique already used by
`Select`'s own dropdown indicator. Rotates 180° when open — a reasonable
UX convention, not independently verified against Figma (no open/closed
chevron-rotation variant exists in the live 432-variant set, since Figma has
no interactive "open" concept for this static component).

## 6. Disclosure behavior — not a strict ARIA menu

Figma's own component set has no "open" state showing panel content — only
the trigger button itself is modeled. The disclosed panel is composed via
the `menu` prop (an already-Approved `<Menu>`). Since `Menu`/`MenuListItem`
were already built with real nested-interactive-element buttons rather than
a strict `role="menu"`/`role="menuitem"` roving-tabindex pattern (see
`MenuListItem`'s own disclosed simplification), `ButtonMenu`'s trigger uses
`aria-expanded`/`aria-controls` — a disclosure-button contract — rather than
`aria-haspopup="menu"`, which would overclaim ARIA semantics the composed
panel doesn't implement. Position/portal/outside-click/Escape architecture
reuses the exact pattern already established by `Select`/`DatePicker`
(`getBoundingClientRect()`, `createPortal` to `document.body`).

## 7. Tokens

0 new component-specific tokens for `ButtonMenu` itself — fully composes
`Button`'s own tokens plus the shared `--fads-sys-motion-*` tokens for the
chevron transition. 2 new additive `--fads-sys-button-subtle-bg-*` tokens on
`Button` (see §4).

## 8. Needs Confirmation

See §4 — the disabled-stays-transparent behavior for `secondary`/`tertiary`
was never independently re-verified and is out of this pass's scope.
