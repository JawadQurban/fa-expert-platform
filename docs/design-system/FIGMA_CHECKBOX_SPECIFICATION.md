# Figma Checkbox — Official Specification

**Source of truth:** Figma file `J0xq7JG3JKshRDzrgAM7E0` ("Components Library - Platforms Code
(Community)"), component set node `30186:53826` ("Checkbox"), sub-part `_CheckboxBase1`
(`30186:54097`).
**Registry:** `nodeId`/`figmaUrl` were already populated (`nodeResolutionStatus: "pending"` — a
workflow-progress marker, not fabrication; see `CLAUDE.md`'s node resolution policy). Live-verified
this pass via `get_metadata`/`get_design_context`/`get_variable_defs`/`get_screenshot`; flipped to
`"resolved"` on success.
**Design documentation:** https://design.dga.gov.sa/guidelines/components/forms-and-inputs/checkbox
**Figma description:** "A checkbox allows users to make a single selection or indicate a binary
choice. Checkboxes enable users to interact with options within an interface..."

Extracted via read-only Figma MCP tools. The component set contains **108 variant symbols**
(`checked+indeterminate` × `state` × `size` × `style` = 3 × 6 × 3 × 2, where `checked+
indeterminate` only has 3 valid combinations — unchecked, checked, checked+indeterminate;
indeterminate never appears alone). 8 nodes sampled directly via `get_design_context`, plus a full
`get_variable_defs` pull against the component-set root, covering every `state` and both `style`
values at `Size=Medium` — sufficient to determine every axis's color/geometry logic.

---

## 1. Component Hierarchy

```
Checkbox (relative box, size per `Size`)
└─ _CheckboxBase1 (the visual box: border or fill + radius)
   ├─ checkmark icon (when Checked=true, Indeterminate=false)
   └─ indeterminate icon (when Checked=true, Indeterminate=true — a dash, not a checkmark)
Hovered/Pressed states additionally render an "Interaction Circle" — an oversized (33% larger
per side) circular ripple behind the box.
Focused additionally renders a "Focus Ring" — a 2px ring offset ~16.67% outside the box.
```

Figma renders the interactive states (Hovered, Pressed) as a real `<button>` in its own
extraction — confirming this is meant to be a genuine interactive control, not decorative markup.

---

## 2. Variant Properties

| Property | Values | Notes |
|---|---|---|
| `Checked` × `Indeterminate` | `(False,False)`, `(True,False)`, `(True,True)` | Indeterminate never appears with `Checked=False` |
| `State` | `Default`, `Hovered`, `Pressed`, `Focused`, `Read-only`, `Disabled` | See §4 |
| `Size` | `Medium` (24px), `Small` (20px), `x Small` (16px) | Pure dimensional scaling — not independently re-verified per state/style combination beyond the `Medium` samples taken (same "extension by analog" pattern used for every prior component's size axis, e.g. `TextInput`) |
| `Style` | `Primary`, `Neutral` | A color-role axis, not a visual-shape axis — maps to the `mood` prop, matching this codebase's established naming (`Link.mood`, `Tag`'s mood concept) |

**No `Invalid` variant exists in this component set** — confirmed by the full 108-node
`get_metadata` listing; there is no `Error`/`Invalid` axis. Per this task's explicit instruction
("If a state is unavailable in Figma, document that fact instead of inventing it"), invalid/error
styling is **not implemented as a distinct visual state** — an `invalid` prop is still exposed
(sets `aria-invalid` for semantic/AT correctness, matching the `Field` pattern's contract) but it
does not change the checkbox's own colors, since Figma defines none.

---

## 3. Colors (live-verified via `get_variable_defs` against the component-set root)

| Token | Primary | Neutral | Used for |
|---|---|---|---|
| `Controls/control-border` | `#6c737f` | (same) | Unchecked border, all styles |
| `Controls/control-{style}-checked` | `#1b8354` | `#0d121c` | Checked/indeterminate fill, Default state |
| `Controls/control-{style}-hovered` | `#14573a` | `#4d5761` | Checked/indeterminate fill, Hovered state |
| `Controls/control-pressed` | `#d2d6db` | (same) | **Unchecked** fill, Pressed state |
| `Controls/control-{style}-pressed` | `#104631` | `#6c737f` | Checked/indeterminate fill, Pressed state (live-verified: node `30186:53929`) |
| `Controls/control-{style}-focused` | `#1b8354` | `#0d121c` | Checked/indeterminate fill, Focused state (same as Default — the focus ring is a separate visual layer, not a fill change) |
| `Controls/control-ripple-effect` | `#f3f4f6` | (same) | Hover/Pressed interaction-circle background |
| `Controls/Control-icon-hovered` / `-pressed` | `#ffffff` | (same) | Checkmark/indeterminate icon color while hovered/pressed |
| `Icon/icon-oncolor` | `#ffffff` | (same) | Checkmark/indeterminate icon color, Default/Focused (on the filled background) |
| `Border/border-black` | `#161616` | — | Focus ring color |
| `Global/border-disabled` | `#9da4ae` | — | Read-only border (both Checked and Unchecked) |
| `Global/background-disabled` | `#e5e7eb` | — | Disabled fill (both Checked and Unchecked) |
| `radius-xs` | `2px` | — | Box corner radius, all sizes/states |

**Read-only, live-verified (node `30186:54033`, Checked=True):** border-only (`border-disabled`),
**no fill** even when checked — the checkmark icon renders directly on the transparent/bordered
box, not on a green fill. This is visually distinct from every other checked state (which all
fill the box).

**Disabled, live-verified (node `30186:54069`, Checked=True):** solid `background-disabled` fill
(not opacity-dimming of the checked-green color) — same "solid colors, not opacity" pattern
established by every prior approved component (Button, Card, TextInput).

**Needs Confirmation:** the checkmark/indeterminate icon's exact vector path was not independently
extractable — `get_design_context` returned it as a rasterized image reference, not inspectable
path data. Implemented as a standard inline-SVG checkmark/dash glyph (same category as
`Breadcrumb`'s separator-icon approximation, `Link`'s external-icon placeholder) rather than
importing the raster asset through the icon pipeline (out of scope for this component's own
files). The Read-only checked icon's color specifically (rendered on a transparent/bordered box,
so it cannot be the white `icon-oncolor` used everywhere else — an invisible white-on-white
icon) is likewise unconfirmed; implemented using `Controls/control-border` (`#6c737f`, the same
tone as the Read-only border itself) as the closest defensible reading.

---

## 4. States (Primary style, Medium size — live-verified deltas)

| State | Unchecked | Checked/Indeterminate |
|---|---|---|
| Default | border `control-border`, no fill | fill `control-primary-checked`, white icon |
| Hovered | unchanged box + ripple circle appears | fill `control-primary-hovered` + ripple, white icon |
| Pressed | fill becomes `control-pressed` (`#d2d6db`) + ripple | fill `control-primary-pressed` + ripple, white icon |
| Focused | unchanged box + focus ring | unchanged fill (same as Default) + focus ring |
| Read-only | border becomes `border-disabled` | border `border-disabled`, no fill, icon in `control-border` tone |
| Disabled | fill `background-disabled`, no border | fill `background-disabled`, icon (tone unconfirmed, same disabled treatment applied) |

---

## 5. Accessibility

- Canonical documentation: the design-system doc link above; no ARIA annotations beyond it exist
  in the Figma file itself.
- No `Invalid` variant (§2) — `aria-invalid`/error-text association is a functional requirement
  from this task's Phase C, layered on top of the visual spec rather than driven by it.
- Read-only is a genuine web-platform gap: the native `readonly` attribute has **no enforced
  effect on `<input type="checkbox">`** in any browser (HTML spec explicitly excludes checkboxes/
  radios from the `readonly` attribute's behavior) — implemented with a JS-level guard
  (`preventDefault` on click/Space) plus `aria-readonly` for correct AT announcement, since the
  attribute alone cannot deliver the Figma-specified behavior.
- Focus ring (`Border/border-black`, 2px, offset outside the box) is real, visible, and
  non-color-reliant — satisfies the same "real, visible, non-default focus indicator" bar every
  other approved component in this project has been held to.

---

## 6. Node Reference (for future re-verification)

| Variant sampled | Node ID |
|---|---|
| Component set root | `30186:53826` |
| Unchecked, Default, Medium, Primary | `30186:53827` |
| Checked, Default, Medium, Primary | `30186:53835` |
| Checked+Indeterminate, Default, Medium, Primary | `30186:53843` |
| Unchecked, Hovered, Medium, Primary | `30186:53863` |
| Checked, Pressed, Medium, Primary | `30186:53929` |
| Unchecked, Focused, Medium, Primary | `30186:53971` |
| Checked, Read-only, Medium, Primary | `30186:54033` |
| Checked, Disabled, Medium, Primary | `30186:54069` |
| Checked, Default, Medium, Neutral | `30186:53837` |

Full 108-node grid metadata is available via `get_metadata` on the component-set root
`30186:53826`. Small/x Small sizes and the remaining state×style combinations were confirmed to
exist (structurally, via the full metadata listing) but not individually re-sampled beyond the
Medium/Primary set above — extension-by-analog, same pattern as every prior component's size axis.
