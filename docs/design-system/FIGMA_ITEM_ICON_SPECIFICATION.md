# Figma Specification — Item Icon

**Registry name:** Item Icon · **Figma file:** `J0xq7JG3JKshRDzrgAM7E0`
("Components Library - Platforms Code (Community)") · **Node:**
`30150:148742` · **Component key:** `e3c378b8d5ad4a4a7934b4f001f650e6963d256c`

Verified live via Figma MCP `get_design_context` (`disableCodeConnect: true`).
Figma's own description: *"The Item Icon displays a list item icons."*
Documentation: https://design.dga.gov.sa/guidelines/components/ui-shell/navigation-header

## Correction

An earlier pass in this same session (while building `HeaderSubMenuItem`)
incorrectly concluded this was "just a generic icon slot, not a distinct
component" and skipped building it — based only on this node's own
component-description metadata surfacing inside a different component's
`get_design_context` response, without ever independently sampling this
node's own structure. The user caught this directly by screenshotting their
own Figma view, showing "Item Icon" as its own real 4-variant component
set. This spec corrects that: `ItemIcon` is built as a standalone composite,
and `HeaderSubMenuItem` now composes it instead of duplicating its logic.

## 1. Variant axes (4 total)

`contained`(bool) × `onColor`(bool) — plus a `swapIcon` slot for the actual
glyph (the live demo content is a `checkmark-square-02` icon, not a fixed
default).

## 2. Structure

A 24×24px icon slot. `contained=true` wraps it in a `12px`-padded,
`radius-md` rounded box:

| `contained` | `onColor` | Box background |
| --- | --- | --- |
| false | false | none (plain icon) |
| true | false | `background-primary-50` `#f3fcf6` |
| false | true | none (plain icon, on colored surface) |
| true | true | `alpha-white-10` `rgba(255,255,255,0.1)` |

## 3. Icon color

Not independently pixel-sampled per variant (the live demo's own checkmark
glyph appears to render with a distinct green tint in the `contained`
light-mode screenshot, which may be intentional demo-content coloring for
that specific icon rather than a general `ItemIcon` color rule). This
implementation instead grounds icon color in the one value confirmed via
`get_variable_defs` for this exact usage context (`Icon/icon-default`
`#161616`) for `!onColor`, and the same white switch already live-verified
for `HeaderSubMenuItem`'s own `onColor` text for `onColor` — consistent with
every other on-color color-switch already verified in this Header file
rather than the possibly-demo-specific green tint. **Needs Confirmation.**

## 4. `swapIcon` / icon content

No `checkmark-square` (or equivalent) glyph exists in this codebase's Icon
registry — same disclosed gap already accepted for `Alert`/`Toast`/
`Notification`'s own missing checkmark. `icon` is a required consumer-
supplied `ReactNode` slot (renamed from Figma's own `swapIcon` to match this
codebase's `icon` prop convention used by every other icon-slot composite
this session). Storybook stories hand-author a `checkmark-square` glyph
purely for visual-reference purposes, matching the live demo — not baked
into the component itself.

## 5. Tokens

6 new additive `--fads-sys-itemicon-*` tokens. Reuses `--fads-ref-primary-50`/
`--fads-sys-radius-md` directly; `#161616`/`#ffffff`/`rgba(255,255,255,0.1)`
are independently-sourced literals (matching the same pattern already used
by many other components' own on-color/black tokens in this codebase).

## 6. Composition

`HeaderSubMenuItem`'s own `icon`/`boxedIcon`/`onColor` props pass straight
through to a composed `<ItemIcon>` — see
`docs/FIGMA_HEADER_SUB_MENU_ITEM_SPECIFICATION.md`'s own updated notes.
