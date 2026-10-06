# Figma Dropdown List Item — Official Specification

**Source of truth:** Figma file `J0xq7JG3JKshRDzrgAM7E0` ("Components Library - Platforms Code (Community)"), component set node `3262:27949` ("Dropdown List Item").
**Design documentation:** https://design.dga.gov.sa/guidelines/components/actions/dropdown
**Figma description:** "A list of options to choose from, displayed as an open state."

Extracted via read-only Figma MCP tools (`get_design_context`, `get_variable_defs`). The full variant set resolved in a single call.

---

## 1. A Confirmed Match With `Select`'s Own Spec

Node `3262:27949` is the **exact same node** this project's own `docs/FIGMA_SELECT_SPECIFICATION.md` already names as the "Dropdown List Item sub-component" (§9 node table) and references as "Section × 1–2 (optional Group label header) → **Dropdown List Item × N**" in `Select`'s own component hierarchy (§1) — confirmed by the identical node ID, the same relationship this batch's component 5 (`InputPrefixSuffix`) found for `NumberInput`'s stepper buttons. `Select.tsx` has been refactored to compose this new primitive for its option/group rows instead of its own ad-hoc `<li>` markup (see §5).

---

## 2. Component Hierarchy

```
Dropdown List Item (type=Group label)
└─ text (semibold, gray)

Dropdown List Item (type=Single Select)
├─ text (regular)
└─ Check icon (trailing, only when selected)

Dropdown List Item (type=Multi Select)
├─ Checkbox (leading, x Small/Neutral)
└─ text (regular)
```

Live-verified: the checkmark/checkbox position is fixed per `type`, not per `rtl` — Single Select always trails its checkmark after the text, Multi Select always leads with its checkbox before the text. The extracted markup's own conditional DOM reordering per `rtl` reproduces exactly what natural CSS logical-flow mirroring already produces under the app's own `dir="rtl"` default (confirmed via a dedicated screenshot comparison) — no special RTL-specific code was needed, matching this batch's `FloatingButton`/`Button` precedent.

---

## 3. Variant Properties

| Property | Values | Notes |
|---|---|---|
| `type` | `Single Select`, `Multi Select`, `Group label` | Governs both the leading/trailing control and interactivity — `Group label` is non-interactive (`role="presentation"`) |
| `state` | `Default`, `Hovered`, `Pressed`, `Focused`, `Disabled` | `Hovered`/`Pressed` are real `:hover`/`:active` pseudo-classes. `Focused` is **not** native DOM focus — see §4 |
| `selected` | `false`, `true` (default `true` in the sampled component) | Shows the trailing checkmark (Single Select) or checks the checkbox (Multi Select) |
| `divider` | `false` (default), `true` | A 1px bottom divider line, `mix-blend-mode: multiply` |
| `rtl` | `false`, `true` | See §2 — no special handling needed |

---

## 4. `Focused` Is Not Native DOM Focus

The live `Focused` variant shows a real 2px solid border (`Border/border-black`), distinct from `Hovered`'s background-only fill (`Form/option-background-hover`). This component is always used inside `Select`'s WAI-ARIA APG "Select-Only Combobox" pattern (`docs/FIGMA_SELECT_SPECIFICATION.md`), where real DOM focus never leaves the trigger button — the "active"/highlighted row is tracked via `aria-activedescendant`, not `:focus-visible`. `DropdownListItem` exposes this as an `active` boolean prop (not a CSS pseudo-class), which the consumer (`Select`) drives from its own roving-highlight `activeIndex` state.

---

## 5. A Real Fidelity Fix in `Select`

Refactoring `Select.tsx` to compose this primitive surfaced two real, independently-verified discrepancies in `Select`'s own prior ad-hoc option-row CSS:

| | Prior (`Select.module.css`) | Live-verified (this component) |
|---|---|---|
| Option hover background | `#f9fafb` (`Background/background-body` — explicitly flagged "Needs Confirmation, closest live-confirmed neutral tone" at the time) | `#f3f4f6` (`Form/option-background-hover`) |
| Row padding/gap | `4px` | `8px` (`Global/spacing-md`) |

Both are now corrected via the shared `DropdownListItem` primitive — `Select`'s own now-superseded `.option`/`.groupLabel`/`.check` CSS classes and their 4 now-fully-unused tokens (`select-option-text`, `select-option-hover-bg`, `select-group-text`, `select-panel-gap`) were removed.

---

## 6. Live-Verified Tokens

Via `get_variable_defs`:

| Figma variable | Value | Used for |
|---|---|---|
| `Text/text-default` | `#161616` | Option row text |
| `Text/text-primary-paragraph` | `#384250` | Group label text |
| `Icon/icon-default` | `#161616` | Single Select checkmark color |
| `Global/text-default-disabled` | `#9da4ae` | Disabled row text |
| `Form/option-background-hover` | `#f3f4f6` | Hovered background |
| `Form/option-background-pressed` | `#e5e7eb` | Pressed background |
| `Border/border-black` | `#161616` | Focused (active) border |
| `Global/spacing-md` | `8` (px) | Row padding/gap |
| `Radius/radius-sm` | `4` (px) | Row corner radius — reused from the already-shared generic token |
| `Controls/control-neutral-checked` | `#0d121c` | Multi Select checked box fill — **byte-identical** to `Checkbox`'s own `--fads-sys-checkbox-neutral-checked` |
| `radius-xs` | `2` (px) | Multi Select box corner radius — **byte-identical** to `Checkbox`'s own `--fads-sys-checkbox-radius` |

Not returned by `get_variable_defs` (default sample was `checked=true`), but present in the extracted markup's own fallback value: `Controls/control-border` (`#6c737f`), the unchecked Multi Select box's border color.

---

## 7. Icon/Checkbox Reuse Decisions

- **Single Select checkmark**: the live node's own SVG glyph. `Select`'s existing implementation already used a literal `"✓"` Unicode character (a disclosed simplification from an earlier pass); `DropdownListItem` keeps that same convention for zero visual regression when `Select` was refactored to compose it.
- **Multi Select checkbox**: `get_variable_defs` confirms this is **byte-identical** to the already-Approved `Checkbox` primitive's own `xs`/`neutral`/`checked` tokens. Not composed as a literal `<Checkbox>`, though: `Checkbox`'s own `label` always renders at its own 16px type scale (verified against its own standalone-checkbox Figma context), which would be wrong for this component's live-verified 14px list-item text, and `Checkbox` has no prop to override just the label's font size. `DropdownListItem` instead renders its own small decorative box reusing `Checkbox`'s own color/radius/size tokens directly (zero new tokens for those), with the outer `<li role="option">` owning the real `aria-selected` state — the box itself is `aria-hidden`.

---

## 8. Accessibility

- Renders a real `<li role="option">` (or `role="presentation"` for `type="groupLabel"`), meant to sit inside a consumer's own `<ul role="listbox">` — same architecture `Select` already uses.
- `selected` drives `aria-selected`.
- `disabled` drives `aria-disabled` — the component does not itself gate interaction (no native `disabled` concept on `<li>`); the consumer (`Select`) is responsible for skipping its own click/hover handlers when disabled, matching its pre-existing pattern.
- The Multi Select checkbox visual is `aria-hidden` — `aria-selected` on the outer `<li>` is the single source of truth for assistive technology.

---

## 9. Node Reference

| Item | Node ID |
|---|---|
| Component set root (`Dropdown List Item`) | `3262:27949` |
| `tick-02` checkmark icon (referenced, not registered — `Select` uses `"✓"` instead) | `31813:61385` |
| `Checkbox` (already-Approved, reused via tokens) | `30186:53826` |

---

## 10. Deviations, Extensions, and Needs-Confirmation Items

1. **Multi Select checkbox is a decorative reuse of `Checkbox`'s tokens, not a literal `<Checkbox>` composition** — see §7.
2. **Single Select checkmark stays a literal `"✓"` character**, matching `Select`'s own pre-existing, disclosed simplification — not the live node's own SVG `tick-02` glyph (not in the FADS icon registry; belongs to the not-yet-imported `Check` category).
3. **`active` (the live `Focused` state) is a consumer-driven prop, not `:focus-visible`** — see §4.
4. **Unchecked Multi Select box border color** (`Controls/control-border`, `#6c737f`) was not returned by `get_variable_defs` (default sample was checked) — sourced from the extracted markup's own fallback value instead, disclosed as such.
