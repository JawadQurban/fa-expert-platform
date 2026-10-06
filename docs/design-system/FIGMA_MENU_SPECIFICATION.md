# Figma Menu — Official Specification

**Source of truth:** Figma file `J0xq7JG3JKshRDzrgAM7E0` ("Components Library - Platforms Code (Community)"), component set node `30195:22214` ("Menu").
**Design documentation:** https://design.dga.gov.sa/guidelines/components/navigational/menu
**Figma description:** "A menu UI element shows a list of options on a temporary surface, triggered by user interactions with buttons or controls. It organizes menu items, often grouped for better structure, to enhance navigation and functionality."

Extracted via read-only Figma MCP tools (`get_design_context`, `get_variable_defs`).

---

## 1. Component Hierarchy

```
Menu (floating panel)
└─ Section × N
   ├─ Group label (optional, bold uppercase)
   └─ Menu list item × N
```

A bordered, shadowed floating panel containing one or more sections, each
optionally headed by a bold uppercase group label, followed by a stack of
`Menu list item`s. A divider line separates sections.

---

## 2. Scope: Panel Content Only

The live data shows **only the panel's own content structure** — no
trigger button, no open/close state, no positioning/portal behavior exists
in this node at all. `Menu` therefore renders just the panel
(`<Menu>`/`<MenuSection>`), the same scope boundary this project already
drew between `DropdownListItem` (a row primitive) and `Select` (the full
trigger+portal+positioning composite that consumes it) — a future
"Menu button"/trigger composite would consume `Menu` the same way `Select`
consumes `DropdownListItem`.

---

## 3. Byte-Identical Match With `Button`'s Tokens

`get_variable_defs` confirmed the panel's own border color
(`Border/border-neutral-primary`, `#d2d6db`) and radius (`radius/8`, `8px`)
are identical to the already-Approved `Button`'s own
`--fads-sys-button-border-neutral` and the already-shared generic
`--fads-sys-radius-md` tokens — reused directly.

---

## 4. New Tokens

| Token | Value | Source |
|---|---|---|
| `--fads-sys-menu-bg` | `#ffffff` | `Background/background-menu` |
| `--fads-sys-menu-shadow` | `0 24px 48px -12px rgba(16,24,40,.18)` | `Shadows/shadow-2xl` |
| `--fads-sys-menu-width` | `241px` | Live-verified panel width |
| `--fads-sys-menu-section-border` | `#cbd5e1` | `border/border-default` — distinct from the panel's own outer border color |
| `--fads-sys-menu-section-gap` | `12px` | `Global/spacing-lg` |
| `--fads-sys-menu-group-label-text` | `#1f2a37` | `Text/text-display` |

The group label's own typography (12px/bold/18px line-height) reuses the
already-shared generic `--fads-sys-typography-text-xs`/`-line-height-xs`/
`--fads-ref-font-weight-bold` tokens directly — no new typography tokens
needed. Section/item inner padding (8px) reuses the already-shared generic
`--fads-sys-space-inset-sm` token.

---

## 5. Node Reference

| Item | Node ID |
|---|---|
| Component set root (`Menu`) | `30195:22214` |
| `Menu list item` sub-component | `30195:21865` (own spec: `docs/FIGMA_MENU_LIST_ITEM_SPECIFICATION.md`) |

---

## 6. Deviations, Extensions, and Needs-Confirmation Items

1. **Panel content only — no trigger/positioning behavior** — see §2.
2. **`MenuSection`'s group label is `role="presentation"`**, matching the same non-interactive-header convention already established by `DropdownListItem`'s own `groupLabel` type.
