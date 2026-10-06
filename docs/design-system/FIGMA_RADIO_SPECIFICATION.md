# Figma Radio — Official Specification

**Source of truth:** Figma file `J0xq7JG3JKshRDzrgAM7E0` ("Components Library - Platforms Code (Community)"), component set node `30195:23385` ("Radio"), sub-component `_RadioBase` (`30195:23381`), and the **Radio Label** composed example node `30195:23490`.
**Design documentation:** https://design.dga.gov.sa/guidelines/components/forms-and-inputs/radio
**Figma description (Radio):** "A Radio Button allows users to select a single option from a group, supporting different states for interaction."
**Figma description (Radio Label):** "A radio button lets users choose one option from a group of options. When they pick one, any previously selected option is deselected. This way, users can only select one option at a time. Radio buttons are commonly used in forms and surveys when users need to pick just one choice from a list."

Extracted via read-only Figma MCP tools (`get_design_context`, `get_variable_defs`). The **Radio** component set contains **24 variant symbols** (`state`[6: Default/Hovered/Pressed/Focused/Read-only/Disabled] × `style`[2: Primary/Neutral] × `selected`[2] = 24) — small enough that `get_design_context` returned the full set in one call, not a sparse metadata fallback. **Radio Label** (node `30195:23490`) was sampled separately as the real-world composed unit (Radio + label + optional helper text + optional error row with a `FeedbackIcon`).

---

## 1. Component Hierarchy

```
Radio (32×32px hit target, "Radio elements")
└─ _RadioBase (24×24px visual ring, centered)
   ├─ unchecked: 1px border ring
   └─ checked: colored ring + inner filled dot (opaque image asset in the
      extracted markup — no inline vector path data, unlike Checkbox's checkmark)

Radio Label (real-world composed unit, 382px demo width)
├─ Radio & Label row: Radio + label text (Text md/Medium, `text-display` #1f2a37)
├─ Helper Text row (optional): text-sm/Regular, `text-primary-paragraph` #384250
└─ Alert message row (optional): FeedbackIcon (16px, "alert-circle") +
   text-sm/Medium, `text-error` #b42318
```

The Radio component's own literal markup names its wrapper "Radio & Label" but
never renders label text inside it in any of the 24 sampled variants — the
label/helper/error slots only exist on the separate **Radio Label** node. This
is the same "documented sub-part" relationship the batch brief anticipated —
see §9.

---

## 2. Variant Properties (Radio, 24 variants)

| Property | Values | Notes |
|---|---|---|
| `state` | `Default`, `Hovered`, `Pressed`, `Focused`, `Read-only`, `Disabled` | See §5 |
| `style` | `Primary`, `Neutral` | Maps to `mood` prop |
| `selected` | `False`, `True` | Checked/unchecked |

No `size` axis exists for Radio (unlike `Checkbox`'s `md`/`sm`/`xs`) — every
sample is the same 32px hit-target / 24px ring geometry. No `required` axis
exists either — required-field indication is a `Label`-level concern (see
`docs/FIGMA_TEXT_INPUT_SPECIFICATION.md` §2/§3), not modeled on Radio itself.

**Radio Label**'s own independent boolean slots (all default `true` in the
sampled instance): `helperText`, `alertMessage`, `hitboxFocusRing` (default
`false` — see §8), plus `rtl`.

---

## 3. Sizing & Spacing

| Element | Value | Token |
|---|---|---|
| Hit target ("Radio elements") | 32×32px | `fads-sys-radio-hit-size` |
| Visual ring (`_RadioBase`) | 24×24px | `fads-sys-radio-size` |
| Ripple / interaction circle (Hovered/Pressed) | 48×48px, centered on the 24px ring (exactly double the diameter) | reconstructed via `inset: -50%` on the ring, no separate token needed |
| Radio ↔ Label gap | 8px (`Global/spacing-md`) | reused existing `--fads-sys-control-gap` (already 8px — confirmed match, no new token) |
| Label ↔ helper/error vertical gap | 4px (`Global/spacing-xs`) | reused existing `--fads-sys-space-stack-xs` |
| Helper/error icon ↔ text gap | 16px (`Control/control-title-error-gap`) | `fads-sys-radio-error-gap` |
| Focus ring offset | live-verified as a 2px border around the full 32px hit box | implemented as `outline-offset: 4px` around the 24px ring (24 + 2×4 = 32px, matching) |

---

## 4. `mood` (official `Style`)

| Mood | Checked (Default) | Hovered | Pressed | Focused |
|---|---|---|---|---|
| `primary` (default) | `control-primary-checked` `#1b8354` | `control-primary-hovered` `#14573a` | `control-primary-pressed` `#104631` | `control-primary-focused` `#1b8354` (**identical to checked** — live-verified, focus never recolors) |
| `neutral` | `control-neutral-checked` `#0d121c` | `control-neutral-hovered` `#4d5761` | `control-neutral-pressed` `#6c737f` | `control-neutral-focused` `#0d121c` (**identical to checked**) |

Unchecked ring border color does **not** vary by mood — both moods share the
same `control-border` `#6c737f` (Default/Hovered/Focused-unchecked) or
`border-disabled` `#9da4ae` (Read-only/Disabled-unchecked).

---

## 5. States

| State | Unchecked ring | Unchecked fill | Checked dot | Notes |
|---|---|---|---|---|
| Default | `control-border` `#6c737f` | transparent | mood-checked color | baseline |
| Hovered | `control-border` (unchanged) | transparent + 48px ripple (`control-ripple-effect` `#f3f4f6`) | mood-hovered color | ripple appears regardless of checked |
| Pressed | `control-border` (unchanged) | `control-pressed` `#d2d6db` fill + ripple | mood-pressed color | unchecked ring becomes a filled gray disc, not just a ripple |
| Focused | `control-border`/mood color unchanged | unchanged | unchanged | adds only an outer 2px `border-black` (`#161616`) ring around the full 32px hit box — **never recolors** the ring/dot itself (live-verified) |
| Read-only | `border-disabled` `#9da4ae` | transparent | **Needs Confirmation** — see §9.2 | native `readonly` has no effect on radios; guarded in JS |
| Disabled | `border-disabled` `#9da4ae` (same as Read-only) | transparent | `Global/control-disabled` `#9da4ae`, **uniform across both moods** (live-verified: the identical image asset is reused for Disabled-checked-Primary and Disabled-checked-Neutral) | solid color, not opacity — matches Checkbox/Button/Card's established "disabled uses solid colors" convention |

---

## 6. Checked-dot reconstruction — disclosed, not guessed

The checked ring+dot look in the live screenshot (a colored ring with a
visible gap and a smaller solid center) is rendered in the extracted Figma
markup as an opaque image asset (`<img src=".../asset/...">`), not inline SVG
path data — unlike Checkbox's checkmark, which Figma exported as literal
`<path>` data. The downloaded asset URLs also expired/errored before pixel
inspection was possible in this session. The implementation reconstructs this
as a standard two-tone radio shape: a `.dot` inner circle sized at 50% of the
24px ring, shown via `:checked`, colored per the live-verified mood/state
tokens from §4. The 50% proportion is a faithful visual match to the
screenshot, not an independently-measured value — flagged Needs Confirmation,
non-blocking, same category as prior components' icon-pipeline/asset gaps
(e.g. Table's sort/filter glyphs, Pagination's chevrons).

---

## 7. Accessibility

- Canonical documentation: https://design.dga.gov.sa/guidelines/components/forms-and-inputs/radio. No ARIA annotations beyond the description/doc link are present in the Figma file itself.
- Native `<input type="radio">` + shared `name` already gives the correct
  `role="radio"` semantics, `aria-checked` state, and arrow-key roving
  navigation within a group — no custom keyboard handling needed.
- `RadioGroup` renders a real `<fieldset><legend>` (WCAG 1.3.1), preserved
  from the pre-existing implementation, unchanged by this pass.
- Focus indicator (2px `border-black` outline, 4px offset) is real, visible,
  and non-color-reliant — satisfies the same "real, visible, non-default
  focus indicator" bar every other approved component in this project is
  held to.
- `aria-readonly` is **not** set on individual radios: the WAI-ARIA `radio`
  role does not support that property at all (unlike `role="checkbox"`,
  which does) — confirmed by `eslint-plugin-jsx-a11y`'s
  `jsx-a11y/role-supports-aria-props` rule during this pass. `data-readonly`
  still drives the visual state via CSS; the read-only *behavior* (blocking
  selection changes) is enforced in JS regardless of the missing ARIA
  attribute.

---

## 8. `Radio Label`'s `hitboxFocusRing` — not implemented

The Radio Label node exposes a `hitboxFocusRing` boolean (default `false` in
the sampled instance, not shown in the live screenshot) that renders a
dashed-looking `mix-blend-multiply` 2px border around the *entire* label row
with a 4px negative inset. Since it defaults off and isn't visible in the
reference screenshot, and the individual `Radio`'s own live-verified Focused
state (§5) already provides a real, correct focus indicator on the actual
interactive element, this alternate/superseding treatment was **not**
implemented — flagged Needs Confirmation, non-blocking, in case it represents
an intentional "whole-row is the click target" pattern for a context not yet
seen in this codebase.

---

## 9. RTL Behavior

- Radio Label mirrors: in RTL, the label text renders `text-right`/`dir="auto"`
  before the Radio visually (DOM order reverses — Radio moves after the text
  wrapper), and the helper/error rows re-align to `items-end`/`justify-end`.
  The FeedbackIcon moves to visually trail the (now right-aligned) error text.
- **Ambiguous/unverified finding, flagged Needs Confirmation:** the sampled
  RTL helper-text padding used `Global/spacing-5xl` (40px) on the trailing
  edge, vs. the LTR sample's `Control/control-radio-description-padding`
  (48px) on the leading edge — an 8px asymmetry between directions for what
  should logically be a mirrored value. Implemented via this codebase's
  flexbox-column structure (`label`/`description` stacked directly under one
  another inside a shared `.text` column, indented as a unit by the Radio's
  own 32px+8px-gap width) rather than replicating either literal padding
  value — this achieves the same visual alignment result through layout
  structure instead of a hardcoded indent, sidestepping the 40-vs-48
  discrepancy entirely rather than picking one arbitrarily. Same category of
  resolution as TextInput's own RTL affix-anchoring ambiguity (§8 of that
  spec) — a disclosed interpretation, not a silent guess.

---

## 10. Node Reference (for future re-verification)

| Variant sampled | Node ID |
|---|---|
| Component set root (Radio) | `30195:23385` |
| `_RadioBase` sub-component | `30195:23381` |
| Radio Label (composed example) | `30195:23490` |
| All 24 Radio state × style × selected combinations | returned in full by a single `get_design_context` call on `30195:23385` (small enough to avoid the sparse-metadata fallback) — individual node IDs range `30195:23386`–`30195:23489`, see the raw response for the complete per-cell mapping |

---

## 11. Deviations, Extensions, and Needs-Confirmation Items

1. **Checked-dot exact color/shape** — reconstructed as a 50%-sized inner
   circle from live-verified color tokens, not pixel-measured from the
   (unavailable) raster asset. See §6.
2. **Read-only checked color** — implemented as unchanged from Default's
   checked color (full mood color retained, matching TextInput/Checkbox's
   own "Read-only stays visually answered" precedent), not independently
   pixel-verified against the live asset. See §5.
3. **`hitboxFocusRing`** — not implemented, defaults off in the sample. See §8.
4. **RTL description-indent asymmetry (40px vs. 48px)** — sidestepped via
   flexbox structure rather than replicating either literal value. See §9.
5. **Per-option vs. group-level error** — `Radio Label`'s `alertMessage` slot
   models error at the individual-item level; implemented as a **group-level**
   `errorText` on `RadioGroup` instead, since a per-option error has no
   sensible "choose one of these" semantics and no precedent elsewhere in
   this design system. A deliberate interpretation — see the `Radio.tsx`
   module doc.
