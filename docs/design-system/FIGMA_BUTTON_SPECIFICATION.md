# Figma Button — Official Specification

**Source of truth:** Figma file `Sv0oWOS1SjWnwhQwdzRJIE` ("Components Library - Platforms Code (Community)"), component set node `407:510376` ("Button").
**Design documentation:** https://design.dga.gov.sa/guidelines/components/actions/buttons
**Figma description:** "Buttons are interactive components that trigger specific actions. The label on a button describes the action that will occur when it is clicked by the user."

Extracted via read-only Figma MCP tools (`get_metadata`, `get_design_context`, `get_variable_defs`, `get_screenshot`) on a representative sample of variant nodes. The component set contains **1,344 individual variant instances**; this document reports the values sampled directly and flags anything not directly sampled as **Needs Confirmation**.

---

## 1. Component Hierarchy

Each Button variant is a single auto-layout frame:

```
Button (auto-layout frame)
├─ Trailing icon        (optional, square, only rendered when trailIcon=true)
├─ Text wrapper
│   └─ Label (<p dir="auto">)   (omitted entirely in Icon-only variants)
└─ Leading Icon          (optional, square, only rendered when leadIcon=true)
└─ Focus outline         (Focused state only — absolutely positioned overlay, see §6)
```

Icon-only variants drop the Text wrapper and both named icon slots in favor of a single centered icon inside a fixed square container.

Source order in the extracted markup is always **Trailing icon → Text wrapper → Leading Icon**, regardless of the `RTL` property value in the samples pulled (see §9, RTL — flagged Needs Confirmation since an `RTL=False` node was not diffed side-by-side).

---

## 2. Variant Properties

The component set exposes 7 variant axes:

| Property | Values |
|---|---|
| `RTL` | `False`, `True` |
| `Size` | `Large`, `Medium`, `Small` |
| `State` | `Default`, `Hovered`, `Pressed`, `Selected`, `Focused`, `Disabled` |
| `Style` | `Primary`, `Neutral`, `Secondary-Solid`, `Secondary-Outline`, `Subtle`, `Transparent` |
| `Destructive` | `no`, `yes` |
| `Icon only` | `False`, `True` |
| `On-color` | `False`, `True` |

Not every combination exists (1,344 of a theoretical 1,728 permutations are defined), meaning some axis combinations are intentionally pruned by the design team.

---

## 3. Sizes

Sampled on `Style=Primary, State=Default, RTL=True, Destructive=no, Icon only=False, On-color=False`:

| Size | Height | Padding-inline | Padding-block | Gap | Font size | Line height | Icon size | Radius |
|---|---|---|---|---|---|---|---|---|
| Large | 40px | 16px (`Button/buttons-lg-padding`) | 0 | 4px (`Button/buttons-lg-gap`) | 16px (text-md) | 24px | 24px | 4px |
| Medium | 32px | 12px (`Button/buttons-md-padding`) | 0 | 4px (`Button/buttons-md-gap`) | 14px (text-sm) | 20px | 20px | 4px |
| Small | 24px | 8px (`Button/buttons-sm-padding`) | 0 | 4px (`Button/buttons-sm-gap`) | 12px (text-xs) | 18px | 16px | 4px |
| Icon-only (Large sampled) | 40×40 (fixed square) | 16px | 0 | n/a (single child) | n/a | n/a | 24px | 4px |

Padding-block is always `0` (`Global/spacing-none`) for every size.

---

## 4. Auto Layout Configuration

- `display: flex` (Figma "content-stretch" / fill sizing)
- `align-items: center`
- `justify-content: center`
- `overflow: clip`
- Horizontal (row) direction
- Icon-only variants use a fixed square (`min/max-width` = `min/max-height` = button height), no gap, single centered child

---

## 5. Border Radius

`Radius/radius-sm` = **4px**, uniform across every size, style, and state sampled. There is no size-dependent radius scaling.

---

## 6. Borders & Shadows

| Style | Border (non-focused states) |
|---|---|
| Primary, Neutral, Secondary-Solid, Subtle, Transparent | none |
| Secondary-Outline | 1px solid `Border/border-neutral-primary` `#d2d6db` |

**Focused state** (sampled on Primary/Large; assumed to apply uniformly — Needs Confirmation across all styles):
- Adds a **2px solid border**, color `Border/border-black` `#161616`, directly on the button edge
- Adds a **separate absolutely-positioned overlay** ("Focus outline" layer): 3px solid `Icon/icon-oncolor` (white, `#ffffff`), `inset: -2px`, `radius-sm` — i.e. a two-ring halo (dark ring hugging the button + a light ring offset outside it), not a single browser-native outline.

**Shadows:** No `box-shadow`/effect data was returned for any sampled node (Primary/Neutral/Secondary-Solid/Secondary-Outline/Subtle/Transparent × Default/Hovered/Pressed/Selected/Focused/Disabled). Styles/state combinations not directly sampled (e.g. On-color × non-Primary styles) are marked **Needs Confirmation**.

---

## 7. Typography

Font family: **IBM Plex Sans Arabic**, weight **Medium (500)**, letter-spacing `0`. (The Figma variable key is literally `Font Wieght/font-weight-medium` — the typo is in the source design system itself, not a transcription error here.)

| Size | Font token | Font size | Line-height token | Line height |
|---|---|---|---|---|
| Large | `typo-size-text-md` | 16px | `line-heights-text-md` | 24px |
| Medium | `typo-size-text-sm` | 14px | `line-heights-text-sm` | 20px |
| Small | `typo-size-text-xs` | 12px | `line-heights-text-xs` | 18px |

Label text is rendered as `<p dir="auto">`, single line, no wrap, `word-break: break-word` as a safety net.

---

## 8. Colors per Style

Sampled at `Size=Large, RTL=True, Destructive=no, Icon only=False, On-color=False` unless noted.

### Primary
| State | Background token | Value | Text |
|---|---|---|---|
| Default | `Button/button-background-primary-default` | `#1b8354` | `Text/text-oncolor-primary` white |
| Hovered | `Button/button-background-primary-hovered` | `#166a45` | white |
| Pressed | `Button/button-background-primary-pressed` | `#104631` | white |
| Selected | **reuses** `Button/button-background-primary-pressed` | `#104631` | white |
| Focused | `Button/button-background-primary-default` (same as Default) + border ring, see §6 | `#1b8354` | white |
| Disabled | `Global/background-disabled` | `#e5e7eb` | `Global/text-default-disabled` `#9da4ae` |

**Important:** the Figma "Selected" variant's background class is hard-wired to the same `button-background-primary-pressed` variable as "Pressed" — there is **no distinct "selected" background token** in the official component.

### Neutral (sampled Default/Pressed only)
| State | Background | Value |
|---|---|---|
| Default | `Button/button-background-black-default` | `#0d121c` |
| Pressed | `Button/button-background-black-pressed` | `#4d5761` |

Text: white (`Text/text-oncolor-primary`).

### Secondary-Solid
| State | Background | Value |
|---|---|---|
| Default | `Button/button-background-neutral-default` | `#f3f4f6` |
| Pressed | `Button/button-background-neutral-pressed` | `#e5e7eb` |

Text: `Text/text-default` `#161616` (dark — not primary-colored). No border.

### Secondary-Outline
| State | Background | Border |
|---|---|---|
| Default | transparent | 1px `#d2d6db` |
| Pressed | `Button/button-background-neutral-pressed` `#e5e7eb` | 1px `#d2d6db` |

Text: `Text/text-default` `#161616` (dark — not primary-colored).

### Subtle
| State | Background |
|---|---|
| Default | transparent |
| Pressed | `Button/button-background-neutral-pressed` `#e5e7eb` |

Text: `Text/text-default` `#161616`. No border.

**2026-07-21 update:** this style was documented here from the original
Button pass but never implemented in `Button.tsx` — a real, pre-existing
gap, only closed while building the dependent `Button-menu` composite
(`docs/FIGMA_BUTTON_MENU_SPECIFICATION.md`), whose own live component set
shares Button's exact style/size/state matrix and required every style to
be real. That pass's independent live sampling of Default/Pressed matches
this table exactly (cross-confirmed, not contradicted), and additionally
sampled Hovered (`#f3f4f6` neutral-hover), Selected (same as Pressed),
Focused (the existing double-ring, unchanged), and Disabled (**stays
transparent**, unlike every other variant's shared flat-gray disabled
fill — not covered in this table's original sampling). `subtle` is now a
real additive `ButtonVariant`.

### Transparent
| State | Background | Text |
|---|---|---|
| Default | none (no background at all, in any state) | `Text/text-default` `#161616` |
| Pressed | none | `Button/button-background-primary-pressed` `#104631` (the **text color** switches to the primary-pressed green — the background never gains a fill) |

### Destructive = yes (sampled on Primary style)
| State | Background | Value |
|---|---|---|
| Default | `Button/button-background-danger-primary-default` | `#d92d20` |
| Pressed | `Button/button-background-danger-primary-pressed` | `#7a271a` |

Text: white.

### On-color = True (sampled on Primary style — for buttons placed on colored/dark surfaces)
| State | Background | Value |
|---|---|---|
| Default | `Button/button-background-oncolor-default` | white |
| Pressed | `Button/button-background-oncolor-pressed` | `rgba(255,255,255,0.6)` |

Text: `Text/text-default` `#161616` (dark text on the white/translucent button for contrast against the colored surface it sits on).

---

## 9. Icons

- Two optional named slots, **Leading Icon** and **Trailing Icon**, both squares sized per §3 (24/20/16px for Large/Medium/Small).
- In the extracted markup each icon is wrapped in a container with an internal `-rotate-90 -scale-x-100` transform. This is an artifact of the specific placeholder icon asset used in this file's variants (an arrow glyph, `arrow-right-02`) and is **not a Button-level rule** — real usage swaps in the semantic icon needed and should not copy this transform.
- Icon-only variants enforce a fixed square footprint equal to the button's height, single centered icon, no visible label.

---

## 10. Accessibility Behavior

- Canonical documentation: https://design.dga.gov.sa/guidelines/components/actions/buttons. The Figma file itself carries no ARIA/WCAG annotations beyond this link — exact success-criteria mapping is **Needs Confirmation** (fetching the external doc page was out of scope for this read-only Figma pass).
- The **Focused** state is an explicit, high-contrast, always-visible two-ring treatment (§6) — not an optional/subtle affordance. Per DGA's WCAG 2.2 AA requirement, this indicates focus visibility is a first-class design requirement here, not an incidental browser default.
- **Disabled** uses solid, distinctly muted colors (background `#e5e7eb`, text `#9da4ae`) rather than opacity — preserving legibility instead of uniformly dimming whatever variant color sits underneath.
- **Icon-only** buttons have no visible label; an accessible name (`aria-label` or equivalent) is implied as required, though Figma does not encode this directly. Exact label copy per instance is **Needs Confirmation** with content/UX.

---

## 11. RTL Behavior

- `RTL` is a first-class variant property (`False`/`True`) defined on every single variant combination — the component is authored bidirectionally rather than mirrored automatically by the browser.
- The label `<p>` carries `dir="auto"`, so text direction is content-driven independent of the button's own RTL flag.
- **Needs Confirmation:** the exact RTL mirroring mechanism. The two `RTL=True` nodes sampled did not reveal a DOM-order difference from what would be expected — icon/text source order was identical in shape to what a same-props `RTL=False` node would likely produce (Trailing icon → Text → Leading Icon in all samples). Whether Figma is mirroring via a flipped icon glyph, a `scaleX(-1)` on the icon only, or an actual `flex-direction`/order swap was not directly diffed against an `RTL=False` node in this pass. A follow-up pull of an `RTL=False` node is recommended before changing any RTL-related code.

---

## 12. Motion / Interaction Notes

No transition, animation, duration, or easing data was returned for any sampled node — Figma component variants are static per-state snapshots; motion is not authored in the source file. Any hover/press/focus transition timing is an implementation-layer decision, not a Figma-sourced requirement. **Needs Confirmation.**

---

## 13. Responsive Behavior

- No responsive/breakpoint variant axis exists — sizing is controlled purely by the explicit `Size` property (Large/Medium/Small), chosen by the consumer, not derived from viewport.
- All buttons are intrinsically sized (hug content: text width + icon slots + horizontal padding) — none of the sampled variants are fluid/100%-width by default.
- Icon-only variants lock width = height (fixed square), overriding hug-content sizing.
- A "full width" button pattern has **no equivalent Figma variant** in this component set. **Needs Confirmation** whether Platforms Code endorses full-width buttons elsewhere (e.g. form-layout guidance).

---

## 14. Node Reference (for future re-verification)

| Variant sampled | Node ID |
|---|---|
| Component set root | `407:510376` |
| RTL=True, Large, Default, Primary | `407:514410` |
| RTL=True, Large, Hovered, Primary | `407:514515` |
| RTL=True, Large, Pressed, Primary | `407:514620` |
| RTL=True, Large, Selected, Primary | `407:514725` |
| RTL=True, Large, Focused, Primary | `407:514830` |
| RTL=True, Large, Disabled, Primary | `407:514965` |
| RTL=True, Medium, Default, Primary | `407:514435` |
| RTL=True, Small, Default, Primary | `407:514460` |
| RTL=True, Large, Default, Secondary-Solid | `407:514415` |
| RTL=True, Large, Default, Secondary-Outline | `407:514420` |
| RTL=True, Large, Default, Subtle | `407:514425` |
| RTL=True, Large, Default, Transparent | `407:514430` |
| RTL=True, Large, Default, Neutral | `411:3902` |
| RTL=True, Large, Icon only=True, Primary | `407:514485` |
| RTL=True, Large, Default, Primary, Destructive=yes | `13337:185125` |
| RTL=True, Large, Default, Primary, On-color=True | `4464:57650` |
