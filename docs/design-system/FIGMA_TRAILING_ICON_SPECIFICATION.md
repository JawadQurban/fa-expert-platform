# Figma Trailing Icon — Official Specification

**Source of truth:** Figma file `J0xq7JG3JKshRDzrgAM7E0` ("Components Library - Platforms Code (Community)"), component set node `30150:92875` ("Trailing Icon").
**Design documentation:** https://design.dga.gov.sa/guidelines/components/search-and-filters/search-box
**Figma description:** "Trailing icon is positioned at the end, often used for actions like clearing input or searching by voice."

Extracted via read-only Figma MCP tools (`get_design_context`, `get_variable_defs`, `get_screenshot`). The full 2-variant set resolved in a single call, no truncation.

---

## 1. Component Hierarchy

```
Trailing Icon (Open=False)
└─ Icon (20px, default sample: mic-01)

Trailing Icon (Open=True)
├─ Icon (20px)
└─ Panel (appears BELOW the icon, not above)
   ├─ Beak (8px, pointing up toward the icon)
   └─ Content (white fill, "Search by voice" text)
```

Live-verified via a dedicated screenshot of the `Open=True` node: the icon
sits on top, the helper-text panel appears **below** it with the beak
pointing **up** at the icon — the reverse of the more common
tooltip-above-trigger placement.

---

## 2. Variant Properties

| Property | Values | Notes |
|---|---|---|
| `Open` | `False` (default), `True` | Not a runtime prop in the FADS implementation — a real show/hide-on-hover/focus interaction, matching this project's existing `Tooltip` primitive's own pattern |

Non-variant properties confirmed by inspecting the underlying instance: `swapIcon` (the icon content is swappable — the live sample's default is `mic-01`, but the slot itself is generic).

**No `Hovered`/`Pressed`/`Focused`/`Disabled` state exists in this 2-variant set** — unusually minimal compared to every other component in this batch.

---

## 3. Live-Verified Tokens

Via `get_variable_defs`:

| Figma variable | Value | Used for |
|---|---|---|
| `Icon/icon-default` | `#161616` | Icon color |
| `Tooltip/tooltip-gap` | `8` (px) | Icon↔panel gap |
| `Tooltip/tooltip-background-light` | `#ffffff` | Panel fill |
| `Tooltip/tooltip-text-heading-light` | `#1f2a37` | Panel text color |
| `Tooltip/tooltip-padding` | `8` (px) | Panel inner padding |
| `Radius/radius-sm` | `4` (px) | Panel corner radius — reused from the already-shared generic `--fads-sys-radius-sm`, not duplicated |
| `Shadows/shadow-lg` | Two-layer drop shadow: `0 4px 6px -2px rgba(16,24,40,.03)`, `0 12px 16px -4px rgba(16,24,40,.08)` | Panel elevation |
| `Text xs/Semibold` | 12px / 600 / 18px line-height, IBM Plex Sans Arabic | Panel text typography |

Geometry not backed by a named Figma variable, but live-verified in the extracted markup: `4px` padding around the icon (a slightly larger hit target than the 20px glyph itself), `160px`/`240px` min/max panel width.

---

## 4. A Real Dependency Gap: This Reuses `Tooltip`'s Own Figma Variable Namespace, But Not Its Code

The panel's tokens (`Tooltip/tooltip-gap`, `-background-light`, `-text-heading-light`, `-padding`) are literally the same Figma variable family as this project's own separate, already-registered `Tooltip` component (`visualComplianceStatus: "pending"`, scheduled batch 7 — not yet visually verified). `Tooltip.module.css` currently renders a **dark-inverse** bubble (placeholder tokens, explicitly marked "⚠ Pending final DGA token values"), which does not match what was live-verified here (a **light**, white-background panel with a beak). Rather than either (a) ship the wrong visual by composing the current `Tooltip`, or (b) expand this session's scope into also verifying/fixing `Tooltip` itself, `TrailingIcon` implements its own small, accurate panel — reusing `Tooltip`'s interaction pattern (show/hide on hover/focus/Escape, `aria-describedby`) but not its markup or CSS. Same category of "not-yet-built/verified dependency" situation as `DatePicker`'s year-dropdown and the not-yet-built "Dropdown List Item" — disclosed for future reconciliation once `Tooltip` gets its own compliance pass.

---

## 5. Icon Substitution — a Registry Gap, Not a Wrong-Shape Substitute

The live sample's default icon (`mic-01`, a microphone glyph) does not exist anywhere in the FADS icon registry. Per `docs/ICON_LIBRARY.md`, the icon import is an ongoing, separately-tracked effort (13 of 60 categories imported so far); `mic-01` belongs to the not-yet-imported **Communications** category (179 icons) — importing an entire 179-icon category to obtain one icon is disproportionate to this single component's own session scope and would violate the icon pipeline's own established per-category batch convention (`reports/ICON_IMPORT_REPORT.md`). This is a **"not yet available" gap**, not a wrong-shape substitution like `cancel-01`/`add-01` elsewhere in this batch: `TrailingIcon`'s own `icon` prop is fully generic (any `ReactNode`), so the component itself is not blocked — only the Storybook/demo examples use already-imported icons (`cancel-01`/`search-01`) instead of the literal `mic-01`.

---

## 6. Accessibility

- Real `<button>` with a required `label` prop driving `aria-label`.
- The panel is `role="tooltip"`, linked via `aria-describedby` only while open — mirrors WCAG 1.4.13 (dismissable via Escape, persists on hover/focus, hoverable).
- No Figma-verified Focused state exists for this component; a focus-visible outline was still added using already-shared generic tokens (`--fads-sys-border-width-thick`/`--fads-sys-focus-ring-color`), since WCAG 2.2 requires visible focus regardless of Figma sample completeness.

---

## 7. Node Reference

| Variant sampled | Node ID |
|---|---|
| Component set root | `30150:92875` |
| `Open=False` | `30150:92876` |
| `Open=True` | `30150:92881` |
| `mic-01` icon (referenced, not registered) | `18738:4761` |

---

## 8. Deviations, Extensions, and Needs-Confirmation Items

1. **Panel implemented as its own small primitive, not composing `Tooltip`** — see §4.
2. **`mic-01` icon not in the registry** — a genuine gap, not a substitution; disclosed (§5).
3. **Focus-visible outline is not Figma-sampled** — added for WCAG 2.2 compliance using already-shared generic tokens, since no Focused variant exists in the live 2-variant set.
4. **No Disabled variant exists either** — `disabled` still supported via the native HTML attribute, consistent with every other FADS primitive in this batch, with no invented visual beyond `cursor: not-allowed`.
