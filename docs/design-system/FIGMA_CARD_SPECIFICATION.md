# Figma Card — Official Specification

**Source of truth:** Figma file `Sv0oWOS1SjWnwhQwdzRJIE` ("Components Library - Platforms Code (Community)"), component set node `30195:10358` ("Card").
**Design documentation:** https://design.dga.gov.sa/guidelines/components/content-display/card
**Figma description:** "A card serves as a container for information and actions related to a specific concept or object... Cards enhance the visibility of information and facilitate predictable patterns."

Extracted via read-only Figma MCP tools (`get_metadata`, `get_design_context`, `get_screenshot`) on a representative sample of the component set's variant nodes.

---

## 1. Component Hierarchy

```
Card (auto-layout frame)
├─ Image                (optional, 250px height, full width, radius-md, object-cover)
├─ Featured icon         (optional, 48px circle, centered 24px icon)
├─ Content               (title + description, grouped, gap 8px)
│   ├─ Title              (<p>, optional)
│   └─ Description        (<p>, optional)
├─ _Swap Placeholder     (Figma-authoring-only dev slot — not a real design element, ignore)
├─ Tags                  (optional row of Tag components, gap 8px)
├─ Rating                (optional: 5 star icons + "N reviews" caption, gap 4px)
├─ Actions               (optional row: secondary Button + primary Button, gap 16px)
└─ Checkbox              (Selectable type only — absolutely positioned top-right corner indicator)
```

Top-level sections (Image / Featured icon / Content / Tags / Rating / Actions) are separated by a **24px gap**. Within the Content block, Title and Description are separated by **8px**.

---

## 2. Variant Properties

The component set exposes 6 variant axes (no `Size` axis — Card has no small/medium/large variant):

| Property | Values |
|---|---|
| `RTL` | `no`, `yes` |
| `Type` | `Default`, `Expandable`, `Selectable` |
| `State` | `Default` (Type=Default only); `Default`, `Hover`, `Focused`, `Disabled` (Type=Expandable/Selectable) |
| `Effect` | `With Shadow` (Figma variant literally named "With Sahdow" — typo in the source file, not a transcription error), `No Shadow`, `Stroke` |
| `Expanded` | `False`, `True` (Type=Expandable only) |
| `Selected` | `False`, `True` (Type=Selectable only) |

**Type=Default** has no interactive states at all — it is a purely static content card (matches our `Card` without `actionable`).
**Type=Expandable** is an accordion-like expand/collapse card (full Default/Hover/Focused/Disabled state set + Expanded toggle).
**Type=Selectable** is a checkbox-based multi-select card (full state set + a persistent corner checkbox indicator, filled/checked when `Selected=True`).

**Neither Expandable nor Selectable corresponds directly to our current `actionable` prop** (a generic single-action clickable/keyboard-operable card, no expand/collapse, no checkbox) — see `reports/VISUAL_COMPLIANCE/Card/VISUAL_COMPLIANCE_CARD.md` §Missing variants.

---

## 3. Auto Layout, Padding, Spacing

- `display: flex`, `flex-direction: column`, `align-items: flex-start`
- Padding: **16px** all sides (`Global/spacing-xl`)
- Gap between top-level sections: **24px** (`Card/card-lg-gap` — a genuine Card-specific Figma variable, not part of the generic spacing scale)
- Gap between Title and Description inside Content: **8px** (`Global/spacing-md`)
- Width: sampled instances are authored at a fixed **360px** in the Figma file. **Needs Confirmation** whether this is a hard requirement or just this sample's authored frame size — our usage (grid cells) suggests fluid width is intended; not changed in this pass.

---

## 4. Border Radius

`Radius/radius-lg` = **16px**, uniform across every `Type`/`State`/`Effect` sampled. (Image and Featured-icon child elements use a smaller `radius-md` = 8px and `radius-full` respectively — not the card's own radius.)

---

## 5. Effect Variants (background / border / shadow)

Sampled on `Type=Default, State=Default, RTL=no`:

| Effect | Background | Border | Shadow |
|---|---|---|---|
| With Shadow (default) | `Background/background-card` `#FFFFFF` | none | Two-layer drop shadow (see below) |
| No Shadow | `Background/background-card` `#FFFFFF` | none | none |
| Stroke | `Background/background-card` `#FFFFFF` | 1px solid `Border/border-neutral-primary` `#D2D6DB` | none |

Shadow (named Figma effect style `Shadows/shadow-md`, two stacked drop shadows):
- `0 2px 4px -2px rgba(16, 24, 40, 0.06)`
- `0 4px 8px -2px rgba(16, 24, 40, 0.1)`

---

## 6. States (sampled on `Type=Selectable` — the only type with a full state set not tied to expand/collapse)

| State | Background | Border | Text | Shadow |
|---|---|---|---|---|
| Default | `#FFFFFF` | none | `Text/text-display` `#1F2A37` | per Effect |
| Hover | `Background/background-neutral-50` `#F9FAFB` | none | `#1F2A37` | per Effect (retained) |
| Focused | `#F9FAFB` (same as Hover) | **2px solid** `Border/border-black` `#161616` | `#1F2A37` | per Effect (retained) |
| Disabled | `Global/background-disabled` `#E5E7EB` | none | `Global/text-default-disabled` `#9DA4AE` | **none** (shadow removed entirely) |

Note: the Hover-state sample renders as a real `<button>` element in the generated markup (unlike Default, which renders as a `<div>`), and text alignment becomes explicit `text-start` — both consistent with Selectable being an interactive element.

---

## 7. Typography

| Element | Font | Weight | Size | Line height | Color |
|---|---|---|---|---|---|
| Title | IBM Plex Sans Arabic | **Bold (700)** | 18px (`text-lg`) | **28px** (`line-heights-text-lg`) | `Text/text-display` `#1F2A37` |
| Description | IBM Plex Sans Arabic | Regular (400) | 16px (`text-md`) | 24px (`line-heights-text-md`) | `#1F2A37` (**same as Title** — not a lighter/muted shade) |
| Rating caption ("N reviews") | IBM Plex Sans Arabic | Regular (400) | 12px (`text-xs`) | 18px | a tertiary/muted color (exact token group not resolved this pass — **Needs Confirmation**) |
| Tag label | IBM Plex Sans Arabic | Medium (500) | 12px (`text-xs`) | 18px | `Tag/tag-text-neutral` `#1F2A37` |

Both Title and Description inherit `color: text-display` from their shared "Content" wrapper — Description is **not** a muted/lighter color, only smaller and lighter-weight than Title.

---

## 8. Borders (recap)

- No border on Default/No-Shadow/With-Shadow effects.
- 1px solid `#D2D6DB` on Stroke effect.
- 2px solid `#161616` on Focused state (Selectable/Expandable), added on top of whichever Effect border already applies.

---

## 9. Shadows (recap)

See §5 — two-layer `0 2px 4px -2px rgba(16,24,40,.06)` + `0 4px 8px -2px rgba(16,24,40,.1)` for the "With Shadow" effect; none for "No Shadow"/"Stroke"; none at all when Disabled (shadow is dropped regardless of Effect).

---

## 10. Icons

- **Featured icon**: optional, 48px circle, background `Icon/background-brand-light` `#F3FCF6`, centered 24px icon (sampled icon: `checkmark-circle-02`, a placeholder — real usage swaps in the semantic icon needed). Disabled state changes the circle background to `Global/background-inverse-disabled` `#F3F4F6`.
- **Rating stars**: 5× 24px star icons (filled/half/empty states via different asset variants).
- **Checkbox** (Selectable type only): 20×20px, unchecked = 1px border `Controls/control-border` `#6C737F` (`Global/border-disabled` `#9DA4AE` when Disabled); checked = filled `#1B8354` with a check-mark asset.

---

## 11. Accessibility Behavior

- Canonical documentation: https://design.dga.gov.sa/guidelines/components/content-display/card. No ARIA annotations beyond the doc link are present in the Figma file itself.
- Type=Selectable's Focused state uses a real, solid 2px border (not a double-ring like Button) — a simple, high-contrast, always-visible focus indicator.
- Type=Selectable's Disabled state uses solid, distinctly muted colors (background `#E5E7EB`, text `#9DA4AE`), not opacity-based dimming — consistent with the Button component's official Disabled treatment (`docs/FIGMA_BUTTON_SPECIFICATION.md` §6).
- The corner Checkbox (Selectable type) implies a real `<input type="checkbox">` or `role="checkbox"` semantic in implementation — not present in our current Card at all (see compliance report).

---

## 12. RTL Behavior

- `RTL` is a variant property (`no`/`yes`) on every Type/State/Effect combination — authored bidirectionally.
- The Selectable-type corner Checkbox is positioned via a literal `right` offset in the extracted markup for `RTL=no` — **Needs Confirmation** whether Figma mirrors this to a `left` offset (or an actual logical `inset-inline-end`) for `RTL=yes`; an `RTL=yes` node was not diffed in this pass beyond confirming it exists as a symbol.

---

## 13. Motion / Interaction Notes

No transition/animation/duration data was returned for any sampled node — same as Button, Figma component variants here are static per-state snapshots. Any hover/focus transition timing is an implementation choice, not a Figma-sourced requirement.

---

## 14. Responsive Behavior

No responsive/breakpoint variant axis exists. Every sampled instance is authored at a fixed 360px width (§3) — **Needs Confirmation** whether a fluid/responsive width (as our current grid usage assumes) is the intended real-world consumption pattern, since the component itself doesn't demonstrate one.

---

## 15. Node Reference (for future re-verification)

| Variant sampled | Node ID |
|---|---|
| Component set root | `30195:10358` |
| RTL=no, Default, Default, With Shadow | `30195:10359` |
| RTL=no, Default, Default, No Shadow | `30195:10376` |
| RTL=no, Default, Default, Stroke | `30195:10393` |
| RTL=no, Selectable, Default, With Shadow, Selected=False | `30195:11229` |
| RTL=no, Selectable, Default, With Shadow, Selected=True | `30195:11319` |
| RTL=no, Selectable, Hover, With Shadow | `30195:11409` |
| RTL=no, Selectable, Focused, With Shadow | `30195:11589` |
| RTL=no, Selectable, Disabled, With Shadow | `30195:11769` |
