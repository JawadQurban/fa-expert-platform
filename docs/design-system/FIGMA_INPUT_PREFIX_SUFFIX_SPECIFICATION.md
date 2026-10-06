# Figma Input Prefix-Suffix — Official Specification

**Source of truth:** Figma file `J0xq7JG3JKshRDzrgAM7E0` ("Components Library - Platforms Code (Community)"), component set node `30150:60916` ("Input Prefix-Suffix").
**Design documentation:** none found independently of the shared Forms & Inputs guideline pages — no Figma description text was attached to this specific node.

Extracted via read-only Figma MCP tools (`get_design_context`, `get_variable_defs`, `get_screenshot`). The component set contains **48 variant symbols** (`type`[2: Plus/Minus] × `state`[6: Default/Hovered/Pressed/Selected/Focused/Disabled] × `style`[2: Solid/Subtle] × `size`[2: Large/Medium]) — small enough that `get_design_context` returned every variant in a single call, no sparse-metadata fallback needed.

**Critical discovery:** this is not a generic "Text Input with icon prefix/suffix" demo — it is the **exact icon-badge sub-component that `NumberInput`'s own increment/decrement buttons instantiate**, confirmed by directly matching Figma node IDs (`30150:60918`/`60920`, the `plus-sign`/`Icon` sub-nodes referenced inside `NumberInput`'s own `prefix`/`suffix` slots in the earlier Number Input verification pass, are the identical asset references sampled here as the `Type=Plus, State=Default` / `Type=Minus, State=Default` cells of this component set).

---

## 1. Component Hierarchy

```
InputPrefixSuffix (icon-only badge/button)
└─ Icon (24×24px Large / 20×20px Medium, centered)
```

A single flat container — no label, no helper text, no nested sub-parts. Meant
to be dropped into a parent field's affix slot (e.g. `TextInput`'s `prefix`/
`suffix`), whose own height/padding already matches this component's own
Large/Medium geometry token-for-token (confirmed: 40px/16px-padding Large,
32px/12px-padding Medium — identical to `TextInput`'s own affix sizing).

---

## 2. Variant Properties

| Property | Values | Notes |
|---|---|---|
| `type` | `Plus`, `Minus` | The icon glyph — see §3 |
| `state` | `Default`, `Hovered`, `Pressed`, `Selected`, `Focused`, `Disabled` | See §4 |
| `style` | `Solid`, `Subtle` | See §4 |
| `size` | `Large`, `Medium` | 24px/20px icon respectively; outer box size comes from the parent affix, not this component itself |

---

## 3. Icon Substitution

| Type | Figma node | Notes |
|---|---|---|
| Plus | `19478:124491` ("add, plus") | No exact registry match — substituted with `add-01` (visually equivalent simple plus glyph, verified at the raw-SVG level) |
| Minus | `21967:7954` ("minus") | Substituted with `remove-01` (visually equivalent simple minus glyph) |

Same substitution already disclosed in `docs/FIGMA_NUMBER_INPUT_SPECIFICATION.md` §3 — this component and Number Input's own stepper buttons are the same underlying element, so the same substitution applies once, not twice.

---

## 4. States & Styles

| State | Solid background | Subtle background | Icon color |
|---|---|---|---|
| Default | `button-background-neutral-default` `#f3f4f6` | none (transparent) | `icon-default` `#161616` |
| Hovered | `button-background-neutral-hovered` `#f3f4f6` (live-verified identical to Default) | **same as Solid's Hovered** `#f3f4f6` — live-verified: Subtle is *not* backgroundless once interacted with | `icon-default` (unchanged) |
| Pressed | `button-background-neutral-pressed` `#e5e7eb` | **same as Solid's Pressed** `#e5e7eb` | `icon-default` (unchanged) |
| Selected | `button-background-black-selected` `#384250` — **applies regardless of `style`**, live-verified identical for both Solid and Subtle | same | `icon-oncolor` `#ffffff` (inverted, for contrast against the dark fill) |
| Focused | Reverts to each style's own resting background (Solid keeps its neutral fill; Subtle reverts to transparent) **plus** a real 4px solid `border-black` `#161616` border — not an outline, an actual border, live-verified at both styles/sizes | same border treatment | `icon-default` (unchanged) |
| Disabled | `background-disabled` `#e5e7eb` | none (transparent, stays backgroundless) | `icon-default-disabled` `#9da4ae` |

The "Selected" state is a real, independent toggle-style treatment — not
exercised by `NumberInput`'s own momentary increment/decrement actions, but
supported on the component's own prop surface (`selected` prop) since it's a
directly Figma-verified axis, for any future consumer that needs a toggled
icon-affix (e.g. a unit-selector button).

---

## 5. Sizing & Spacing

| Size | Icon | Parent-affix height (for reference, not owned by this component) | Parent-affix padding |
|---|---|---|---|
| Large | 24×24px | 40px | 16px (`Global/spacing-xl`) |
| Medium | 20×20px | 32px | 12px (`Global/spacing-lg`) |

This component does not set its own outer box height/padding — it fills
100%×100% of whatever affix container it's placed in (already sized
identically by the parent, confirmed above), and only sizes its own icon
glyph.

---

## 6. Accessibility

- No ARIA guidance exists in the Figma file (no description/doc link was
  attached to this specific node).
- Implemented as a plain `<button type="button">` with a required `label`
  prop (accessible name) — icon-only controls always need one; there is no
  Figma-sourced default text (this is a generic icon badge, not
  english/arabic-labelled content), so `label` has no default value.
- `selected` is exposed via `aria-pressed`, matching the WAI-ARIA "pressed
  button" pattern for a toggleable icon button (used for the Selected
  variant when a consumer needs it — `NumberInput` does not).
- Focus indicator is a real, visible 4px border (not the native default
  outline) — non-color-reliant given its distinct shape/weight.

---

## 7. RTL Behavior

None required — a centered plus/minus glyph in a fixed-size box has no
inherent directionality to mirror. `NumberInput`'s own RTL correctness comes
from `TextInput`'s existing prefix/suffix side-mirroring, unaffected by this
component's own (direction-agnostic) internals.

---

## 8. Node Reference

| Variant sampled | Node ID |
|---|---|
| Component set root | `30150:60916` |
| All 48 type × state × style × size combinations | returned in full by a single `get_design_context` call on `30150:60916` (small enough to avoid the sparse-metadata fallback) |

---

## 9. Deviations, Extensions, and Needs-Confirmation Items

1. **`add-01`/`remove-01` icon substitution** — see §3, same disclosed substitution as `NumberInput`'s own spec.
2. **Subtle style's Hovered/Pressed backgrounds** — genuinely NOT backgroundless despite the "Subtle" name; implemented exactly as sampled (§4), not "corrected" to stay transparent throughout.
3. **`selected` prop is unused by `NumberInput`** but supported on this component's own surface since it's a directly-verified Figma axis, for future reuse.
