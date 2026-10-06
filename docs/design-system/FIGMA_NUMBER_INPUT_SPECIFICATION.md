# Figma Number Input — Official Specification

**Source of truth:** Figma file `J0xq7JG3JKshRDzrgAM7E0` ("Components Library - Platforms Code (Community)"), component set node `30150:61013` ("Number Input").
**Design documentation:** https://design.dga.gov.sa/guidelines/components/forms-and-inputs/input (shared with Text Input — no separate Number Input guideline page was found)

Extracted via read-only Figma MCP tools (`get_design_context`, `get_variable_defs`, `get_screenshot`). The component set contains **288 variant symbols** (`rtl` × `state`[6] × `filled`[2] × `error`[2] × `size`[2] × `style`[3]) — **the exact same governing axes and Figma variable family (`Form/field-*`) as `docs/FIGMA_TEXT_INPUT_SPECIFICATION.md`'s Text Input**. 3 nodes were sampled directly (component root/Default, Hovered, Disabled); every other state/size/style/error/RTL cell was extended by analogy with Text Input's own already-verified matrix, since both components share the identical underlying field chrome — confirmed identical `Form/field-background-*`/`field-border-*`/`field-text-*` token values in every sampled node.

---

## 1. Component Hierarchy

```
NumberInput (flex-col, gap = field-label-gap = 8px)
├─ Label row (optional, `showLabel`) — identical to Text Input's Label
├─ Input Field (border, radius-sm, background per state/style — identical to Text Input)
│  ├─ Prefix — a "plus-sign" icon badge (increment), **always present**, not optional text like Text Input's own prefix
│  ├─ Icon-Text-stack (flex: 1) — the numeric value, no leading icon slot sampled
│  └─ Suffix — a "minus-sign" icon badge (decrement), **always present**
└─ Helper text row (optional) — identical to Text Input's helper/error row
```

Critically: **Number Input's `prefix`/`suffix` are increment/decrement icon buttons, not
free-form text/icon badges** — unlike Text Input, where `prefix`/`suffix` are optional
generic slots. The live sample renders `prefix=true`/`suffix=true` by default with a
`plus-sign` icon in the prefix position and a `minus-sign` icon in the suffix position —
i.e., **increment is the leading-edge control, decrement is the trailing-edge control**,
in that fixed order, in LTR. This is the reverse of what might be conventionally expected
(minus-left/plus-right) — implemented exactly as sampled, not reordered to match a more
"conventional" stepper layout.

---

## 2. Variant Properties

Identical to Text Input (see `docs/FIGMA_TEXT_INPUT_SPECIFICATION.md` §2) — `rtl`,
`state` (Default/Hovered/Pressed/Focused/Read-only/Disabled), `filled`, `error`, `size`
(Large/Medium), `style` (Default/Filled darker/Filled lighter). Every sampled color/
spacing/typography token in this component's inline code matched Text Input's own
token names and values exactly (`Form/field-background-default` `#ffffff`,
`Form/field-border-default` `#9da4ae`, `Form/field-border-hovered` `#384250`,
`Global/background-disabled` `#e5e7eb`, `Global/text-default-disabled` `#9da4ae`,
`Radius/radius-sm` `4px`, heights 40px/32px, etc.) — no independent Number-Input-scoped
color palette exists; this component reuses Text Input's field chrome verbatim.

Non-variant properties specific to Number Input: `prefix`/`suffix` (both boolean,
default `true` — unlike Text Input where they default to absent), no `icon`/`swapIcon`
leading-icon slot was found in the sampled variants (Number Input's Icon-Text-stack
never showed a leading icon in any sampled node).

---

## 3. Increment/Decrement Icons

| Slot | Icon | Figma node | Size |
|---|---|---|---|
| Prefix (leading, LTR) | `plus-sign` | `19478:124491` ("add, plus") | 24×24px |
| Suffix (trailing, LTR) | `minus-sign` | `21967:7954` ("minus") | 24×24px |

Neither `plus-sign` nor `minus-sign` exists under those exact names in this project's
already-imported Icon registry (`docs/ICON_LIBRARY.md`'s pipeline). The closest already-
imported equivalents — `add-01` (a simple centered plus glyph) and `remove-01` (a simple
centered minus glyph), both in the `add-remove` icon category — were inspected directly
(their raw SVG path data) and confirmed to be visually equivalent simple plus/minus
glyphs, not a "plus in a circle" or other decorated variant. Used as a disclosed,
verified substitution rather than importing new assets for this pass.

Both badges use the same container styling as Text Input's own `prefix`/`suffix`
affixes (`Button/button-background-neutral-default` `#f3f4f6` background,
`Global/spacing-xl` `16px` inline padding, full field height) — confirmed identical
across Default/Hovered (no separate hover treatment on the badge itself — the field's
own border color is what changes on Hover, not the affix) and Disabled (`Global/
background-disabled` `#e5e7eb` background, `Global/text-default-disabled` `#9da4ae`
icon tint — same disabled-affix behavior Text Input already implements).

---

## 4. Sizing & Spacing

Identical to Text Input (§4 of that spec): Large = 40px height / 16px value text,
Medium = 32px height / 14px value text. The demo instance's own width (183px) is that
sample's authored frame width, not a hard requirement — same caveat as Text Input's
own 320px demo width.

---

## 5. Accessibility

- No ARIA guidance is present in the Figma file beyond the shared Text Input
  documentation link.
- Implemented as the WAI-ARIA APG **Spinbutton** pattern
  (https://www.w3.org/WAI/ARIA/apg/patterns/spinbutton/) — a text box (`role="spinbutton"`,
  `aria-valuenow`/`aria-valuemin`/`aria-valuemax`) that accepts direct typing *and* has
  separate increment/decrement controls, plus ArrowUp/ArrowDown stepping on the text
  box itself. This is not a Figma-sourced requirement (Figma has no ARIA annotations)
  but a functional accessibility requirement independent of the visual variant set —
  same category as `TextInput`'s own label/`aria-describedby`/`aria-invalid` contract,
  which this component inherits unchanged.
- The increment/decrement buttons are icon-only and **require** an accessible name —
  `incrementLabel`/`decrementLabel` props (no Figma-sourced default text exists for
  these buttons; English defaults `"Increment"`/`"Decrement"` are provided, callers are
  expected to supply localized labels, exactly as the Storybook stories demonstrate
  with Arabic labels).

---

## 6. RTL Behavior

Not independently re-verified with a live RTL Number Input sample this pass — extended
by analogy from Text Input's own already-verified RTL prefix/suffix mirroring
(`docs/FIGMA_TEXT_INPUT_SPECIFICATION.md` §8), since Number Input's `prefix`/`suffix`
slots are structurally identical containers reusing the exact same CSS. Flagged Needs
Confirmation, non-blocking — same category as several of Text Input's own extended-by-
analogy cells.

---

## 7. Node Reference

| Variant sampled | Node ID |
|---|---|
| Component set root | `30150:61013` |
| Default, Filled=True, Error=False, Large, Default style | `30150:61014` |
| Hovered (same combo) | `30150:61110` |
| Disabled (same combo) | `30150:61527` |

Full 288-node grid metadata is available via `get_metadata`/`get_design_context` on the
component-set root `30150:61013`. Every other cell was extended by analogy with Text
Input's own already-verified full matrix (not independently re-sampled), given the
confirmed identical token family.

---

## 8. Deviations, Extensions, and Needs-Confirmation Items

1. **Increment-left/decrement-right order** — implemented exactly as sampled (§1), not
   normalized to a "more conventional" layout.
2. **`add-01`/`remove-01` icon substitution** — the exact `plus-sign`/`minus-sign` Figma
   icon names have no matching registry entry; visually-equivalent existing icons used
   instead (§3), disclosed rather than importing new assets.
3. **Value-clamping UX (min/max) is a FADS-authored behavior, not a Figma-sourced
   visual** — the live component only shows the field's *visual* Error state (border/
   helper-text color), not an interaction model for out-of-range typed values. This
   implementation clamps on blur (not on every keystroke) as a reasonable, disclosed
   interaction choice — Figma provides no guidance either way.
4. **RTL not independently re-sampled** — extended by analogy from Text Input's own
   verified RTL behavior (§6).
5. **Most of the 288-cell matrix extended by analogy** from Text Input's own
   already-verified matrix rather than independently re-sampled cell-by-cell, since
   both components share verified-identical token values in every node actually
   sampled — same "extend a verified axis by analog" pattern already used throughout
   this codebase (e.g. Text Input's own `OfficialFigmaMatrix` NC badges).
