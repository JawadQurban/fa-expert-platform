# Figma Switch — Official Specification

**Source of truth:** Figma file `J0xq7JG3JKshRDzrgAM7E0` ("Components Library - Platforms Code (Community)"), component set node `30150:69895` ("Switch"), and the **Switch Label** composed example node `30150:69998`.
**Design documentation:** https://design.dga.gov.sa/guidelines/components/forms-and-inputs/switch
**Figma description:** "A switch is a control used to alternate quickly between two possible states. Toggles are used specifically for binary actions that occur immediately when the user 'flips the switch'. They are most commonly used for 'on/off' settings."

Extracted via read-only Figma MCP tools (`get_design_context`, `get_variable_defs`, `get_screenshot`). The **Switch** component set contains **20 variant symbols** (`rtl`[2] × `state`[5: Default/Hovered/Pressed/Focused/Disabled] × `on`[2] = 20) — small enough that `get_design_context` returned the full set in one call. **Switch Label** (node `30150:69998`) was sampled separately as the real-world composed unit.

---

## 1. Component Hierarchy

```
Switch (48×24px track)
├─ Track (pill, border or solid fill depending on state/on)
└─ Thumb (16×16px circle, white, shadow-sm, slides between the two ends)

Switch Label (real-world composed unit, 382px demo width)
├─ Switch & Label row: Switch + label text (Text md/Medium, `text-display` #1f2a37)
│  — an independent `trailSwitch` axis controls whether the Switch renders
│    before or after the label (see §6)
├─ Helper Text row (optional): text-sm/Regular, `text-primary-paragraph` #384250
└─ Alert message row (optional): FeedbackIcon (16px, "alert-circle") +
   text-sm/Medium, `text-error` #b42318
```

---

## 2. Variant Properties (Switch, 20 variants)

| Property | Values | Notes |
|---|---|---|
| `rtl` | `False`, `True` | Thumb slides to the mirrored side |
| `state` | `Default`, `Hovered`, `Pressed`, `Focused`, `Disabled` | See §4. **No `Read-only` state exists** (unlike `Checkbox`/`Radio`) — not implemented |
| `on` | `False`, `True` | Checked/unchecked |

No `size`, `mood`/`style`, or `required` axis exists — a single fixed
geometry and a single accent color (no Primary/Neutral choice, unlike
`Radio`/`Checkbox`).

**Switch Label**'s own independent properties: `helperText`, `alertMessage`
(both default `true` in the sample), `trailSwitch` (default `false`), `rtl`.

---

## 3. Sizing & Spacing

| Element | Value | Token |
|---|---|---|
| Track | 48×24px | `fads-sys-switch-track-inline` / `-track-block` |
| Thumb | 16×16px | `fads-sys-switch-thumb-size` |
| Thumb inset from track edge | 4px (both axes — 16.67% of 24px and 8.33% of 48px both independently resolve to 4px) | `fads-sys-switch-thumb-inset` |
| Hover/Pressed ripple halo | uniform 4px outward on all sides | reconstructed via `inset: -4px`, no separate token |
| Focus ring | a separate 4px-outward, `radius-xs` (2px) rectangular overlay — **not** the same element as the ripple halo, and **not** shaped like the track's own pill | `fads-sys-switch-focus-ring-radius` |
| Switch ↔ Label gap | 16px (`Control/control-title-error-gap`) | reused directly as a literal value, no dedicated token (single use) |
| Helper/error icon ↔ text gap | 16px in the leading-switch layout, 8px in the `trailSwitch` layout (live-verified, genuinely different per layout) | `fads-sys-switch-error-gap` — 16px chosen for consistency with `Radio`'s identical row; see §7 |

---

## 4. States

| State | Track (off) | Track (on) | Notes |
|---|---|---|---|
| Default | border-only, `Needs Confirmation` color (see §5) | solid fill, `control-primary-checked` `#1b8354` | Both are opaque raster assets in the extracted markup — no inline code |
| Hovered | border `control-neutral-hovered` `#4d5761` + ripple halo (`control-ripple-effect` `#f3f4f6`) | fill `control-primary-hovered` `#14573a` + ripple halo | live inline code, directly sampled |
| Pressed | border `control-neutral-pressed` `#6c737f` + ripple halo | fill `control-primary-pressed` `#104631` + ripple halo | live inline code, directly sampled |
| Focused | border `control-neutral-focused` `#0d121c` (unchanged from its own border, **not** recolored by focus) + a separate rectangular ring in the same color | fill unchanged from Default's checked color + a separate rectangular ring in **`border-black`** `#161616` (a universal color, not the mood color) | live inline code, directly sampled — the checked-focus ring's color choice (universal black, not the track's own green) is a genuine, disclosed asymmetry vs. the unchecked-focus ring (which reuses its own border color) |
| Disabled | opaque raster asset, both on/off | opaque raster asset, both on/off | no inline code at all; colors extended by analogy (§5) |

The thumb itself never changes color across any state — always a plain white
circle with `Shadows/shadow-sm` (a 2-layer soft drop shadow). No checkmark or
other icon was found inside the thumb in either the extracted markup or the
downloaded screenshot at any zoom level tested — despite `Controls/Control-
icon-hovered`/`-pressed`/`-disabled` (all `#ffffff`) appearing in the sampled
variable set, no visible icon glyph is used by this component; these tokens
are not consumed by the implementation (Needs Confirmation, non-blocking —
possibly reserved for a different component or an unused leftover in the
Figma variable set).

---

## 5. Needs Confirmation: Default and Disabled State Colors

Unlike every other governing state, **Default** (both on/off) and **Disabled**
(both on/off) render as opaque raster/vector image assets in the extracted
markup, not inline code with bound color variables — `get_variable_defs`
cannot introspect per-property bindings on an image-fill node the way it can
for the live inline-code states (Hovered/Pressed/Focused). Implemented by
disclosed analogy:

- **Default off-border**: extends `Controls.control-border` (`#6c737f`) — the
  same token `Checkbox`/`Radio` both use for their own Default-unchecked
  state, not independently sampled for Switch.
- **Disabled off-border**: `Controls.Control-boarder-disabled` (`#9da4ae`,
  sic — the literal Figma variable name includes a typo) — this one **was**
  present in the sampled variable set even though Disabled itself is a
  raster asset, since the variable dictionary aggregates across the whole
  component set, not just the directly-inspectable nodes.
- **Disabled on-fill**: `Global.control-disabled` (`#d2d6db`) — present in
  the sampled variable set for the same reason; matches the "Disabled
  converges to a solid uniform gray" pattern already independently confirmed
  for `Radio`'s own Disabled-checked state.

---

## 6. `trailSwitch` — an Independent Layout Axis

`Switch Label` exposes a `trailSwitch` boolean (default `false`) that moves
the Switch from *before* the label (default) to *after* it — genuinely
independent of `rtl` (both axes were sampled in combination). Implemented as
the `trailing` prop on `Switch`. No official `Read-only` or `size` axis
exists for Switch, so neither was added.

---

## 7. Description/Error Indent — Sidestepped via Layout (same as Radio)

The Figma sample uses different literal padding values to align the helper/
error text under the label depending on layout: `Control/control-switch-
description-padding` (64px) for the default leading-switch layout vs.
`spacing-6xl` (48px) for the `trailSwitch` layout — because the indent must
clear whichever element (switch or nothing) precedes the label in that mode.
Implemented via the same flexbox-column structure already established for
`Radio` (`label`/`description`/`error` stacked inside one `.text` column that
is a flex sibling of the track) rather than replicating either literal
padding value — this produces the same correct alignment result in both
`trailing` and non-`trailing` layouts automatically, sidestepping the
literal-value asymmetry entirely.

---

## 8. Accessibility

- Canonical documentation: https://design.dga.gov.sa/guidelines/components/forms-and-inputs/switch. No ARIA annotations beyond the description/doc link are present in the Figma file itself.
- No native HTML input type exists for a switch — a real `<button
  role="switch">` with `aria-checked` is the WAI-ARIA APG-recommended
  pattern (not a hidden-input + decorative-box architecture like
  `Checkbox`/`Radio`, which both have a real native input type to hide).
  Native `<button>` semantics already give Space/Enter activation for free.
- `description` (new this pass) wired to `aria-describedby`, matching every
  other FADS form primitive's contract.
- `errorText` (new this pass) wired to `aria-invalid`/`aria-describedby`/
  `role="alert"` — closes a previously-tracked gap (`docs/PROJECT_STATUS.md`'s
  technical-debt list explicitly named "Checkbox/Switch error-state support";
  `Checkbox` already closed its half, this pass closes Switch's).
- Focus indicator (a real, visible rectangular ring, distinct from the
  Hover/Pressed ripple) is real and non-color-reliant only in combination
  with its own shape difference from the ripple — same "real, visible,
  non-default" bar every other approved component in this project is held to.

---

## 9. RTL Behavior

The thumb slides to the mirrored side automatically via CSS logical
properties (`inset-inline-start`, already the pre-existing implementation's
approach — no bug found here). `trailSwitch` and `rtl` are independent axes,
both correctly composable (see §6).

---

## 10. Node Reference (for future re-verification)

| Variant sampled | Node ID |
|---|---|
| Component set root (Switch) | `30150:69895` |
| Switch Label (composed example) | `30150:69998` |
| All 20 Switch rtl × state × on combinations | returned in full by a single `get_design_context` call on `30150:69895` (small enough to avoid the sparse-metadata fallback) |

---

## 11. Deviations, Extensions, and Needs-Confirmation Items

1. **Default/Disabled exact colors** — extended by disclosed analogy with Checkbox/Radio and the aggregated variable dictionary, not independently sampled per-node (raster assets). See §5.
2. **Thumb icon tokens present but unused** — `Control-icon-{hovered,pressed,disabled}` exist in the sampled variable set but no visible icon glyph was found in the screenshot at any tested zoom level; not implemented. See §4.
3. **Checked-focus ring uses a universal color, not the mood color** — a genuine, live-verified asymmetry vs. the unchecked-focus ring (which reuses its own border color). Implemented exactly as sampled, not normalized to look "more consistent."
4. **Description/error indent (64px vs. 48px, leading vs. trailing layout)** — sidestepped via flexbox structure rather than replicating either literal value. See §7.
5. **Error-row icon↔text gap (16px vs. 8px, same leading/trailing split)** — implemented uniformly at 16px for consistency with Radio's own identical row; the `trailSwitch` layout's 8px value not separately replicated.
