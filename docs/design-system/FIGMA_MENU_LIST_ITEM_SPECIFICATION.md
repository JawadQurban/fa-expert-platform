# Figma Menu List Item — Official Specification

**Source of truth:** Figma file `J0xq7JG3JKshRDzrgAM7E0` ("Components Library - Platforms Code (Community)"), component set node `30195:21865` ("Menu list item").
**Design documentation:** https://design.dga.gov.sa/guidelines/components/navigational/menu
**Figma description:** "Each menu item has a trailing elements which either present data or allow user to interact with such as tags, controllers or buttons."

Extracted via read-only Figma MCP tools (`get_metadata`, `get_design_context`, `get_variable_defs`). The full 72-variant matrix was enumerated via `get_metadata`; representative variants were sampled with `get_design_context`.

---

## 1. Component Hierarchy

```
Menu list item
├─ leading icon (optional, swappable)
├─ label text
└─ trailing element (optional; one of: Text, Icon, Button, Tag, Switch)
```

## 2. Variant Properties

| Property | Values | Notes |
|---|---|---|
| `rtl` | `false`, `true` | No special handling needed beyond `dir="auto"` (natural CSS mirroring) |
| `Trail element` | `None`, `Text`, `Icon`, `Button`, `Tag`, `Switch` | See §3 — **not** modeled as distinct typed props |
| `state` | `Default`, `Hovered`, `Pressed`, `Selected`, `Focused`, `Disabled` | 72 variants total (`rtl` × `Trail element` × `state`) |

---

## 3. The Trailing Slot Is Generic Content, Not 5 Distinct Types

Sampling each `Trail element` value directly proved every one is simply
different *content* placed in the same trailing position, not a
structurally distinct rendering mode:

| `Trail element` | Sampled content |
|---|---|
| `Text` | Plain muted text (e.g. `"+99"`, `Text/text-secondary-paragraph` `#6c737f`) |
| `Icon` | A plain decorative icon (default `tick-02`, swappable) |
| `Button` | A literal instance of the already-Approved `Button` (icon-only, small) |
| `Tag` | A literal instance of the already-Approved `Tag` |
| `Switch` | A literal instance of the already-Approved `Switch` |

`MenuListItem` therefore exposes one generic `trailing: ReactNode` slot —
the consumer composes whichever already-Approved primitive (or plain
content) matches the variant they need, rather than the component
reinventing per-type rendering logic.

---

## 4. States

| State | Treatment |
|---|---|
| `Default` | Plain `<div>`-equivalent, transparent background, `Text/text-default` (`#161616`) |
| `Hovered` | `Button/button-background-neutral-hovered` (`#f3f4f6`) — **byte-identical** to the already-Approved `Button`'s own `secondarySolid` variant hover token |
| `Pressed` | `Button/button-background-neutral-pressed` (`#e5e7eb`) — same `Button` token family |
| `Selected` | `Background/background-primary-50` (`#f3fcf6`) fill + `Text/text-primary` (`#1b8354`) text — **not** a checkmark; see §5 |
| `Focused` | A real 2px solid `Border/border-black` border |
| `Disabled` | Muted text/icon (`Global/text-default-disabled`/`icon-default-disabled`, `#9da4ae`), no background change |

---

## 5. `Selected` vs. a Consumer-Composed Checkmark

The live `Menu` component's own demo shows one row with a checkmark
rendered *before* the label text — this is **not** `MenuListItem`'s own
`Selected` state (which is a pale-green fill with no checkmark at all,
confirmed by independently sampling the `Selected` state variant directly).
The checkmark row is the `Icon` trailing-element variant, manually composed
by the design as a "this option is currently active" usage pattern. Both
are real, distinct, live-verified patterns — `MenuListItem`'s `selected`
prop maps only to the pale-green/green-text state; a checkmark is just
content a consumer can place in the `trailing` (or leading `icon`) slot.

---

## 6. Deliberately Not `role="menuitem"`

The WAI-ARIA APG "Menu and Menubar" pattern's roving-tabindex model assumes
each `menuitem` is a single simple action, not a container with its own
independently-focusable descendant. The live data shows real nested
interactive controls (a `Switch`, an icon-only `Button`) inside items —
forcing `role="menu"`/`role="menuitem"` onto this structure would create an
invalid/conflicting ARIA tree. `MenuListItem` renders as a plain, real
`<button>` (standard Tab order) instead — a disclosed, deliberate deviation
from a stricter native-menu pattern, chosen because the live design itself
requires it, not invented for convenience.

---

## 7. Node Reference

| Variant sampled | Node ID |
|---|---|
| Component set root | `30195:21865` |
| `None`, Default | `30195:21866` |
| `None`, Hovered | `30195:21895` |
| `None`, Selected | `30195:21953` |
| `None`, Focused | `30195:21982` |
| `None`, Disabled | `30195:22011` |
| `Text` | `30195:21870` |
| `Icon` | `30195:21875` |
| `Button` | `30195:21880` |

---

## 8. Deviations, Extensions, and Needs-Confirmation Items

1. **Trailing slot is generic content**, not 5 distinct typed props — see §3.
2. **Not `role="menuitem"`** — a real nested-interactive-control conflict with the strict ARIA menu pattern; see §6.
3. **The live node's own `tick-02`/`arrow-right-02` icons are not in the FADS icon registry** (belong to the not-yet-imported `Check`/`Arrows` categories) — a disclosed registry gap, not a substitution; Storybook demos use already-imported icons/a literal `"✓"` character instead, matching this batch's established convention for such gaps.
4. **Pressed reuses `Button`'s own `secondarySolid`-family hover/pressed tokens directly** — confirmed byte-identical, not independently re-derived.
