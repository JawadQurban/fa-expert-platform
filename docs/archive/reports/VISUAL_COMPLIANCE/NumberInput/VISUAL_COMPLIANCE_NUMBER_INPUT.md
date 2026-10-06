# Visual Compliance — NumberInput

Compares the official Platforms Code Number Input component (see
`docs/FIGMA_NUMBER_INPUT_SPECIFICATION.md`, node `30150:61013` in file
`J0xq7JG3JKshRDzrgAM7E0`) against the FADS `NumberInput` primitive built this
pass — Number Input did not exist in this codebase before (registry status
`Missing`, no prior implementation, no prior spec/compliance work).

> **2026-07-14 update (Batch 3, component 5 — Input Prefix-Suffix):** the
> increment/decrement stepper buttons described below as ad-hoc inline JSX
> were extracted into their own reusable `InputPrefixSuffix` primitive after
> live Figma verification proved the registry's separate "Input
> Prefix-Suffix" entry (node `30150:60916`) is the exact icon-badge
> sub-component these buttons already instantiate. `NumberInput` now
> composes `InputPrefixSuffix` instead of the inline button shown in §3
> below; its public API and behavior are unchanged (all 21 tests below still
> pass unmodified). See
> `reports/VISUAL_COMPLIANCE/InputPrefixSuffix/VISUAL_COMPLIANCE_INPUT_PREFIX_SUFFIX.md`
> for the full diff of what the extraction corrected (real Hovered/Pressed/
> Selected states and a proper 4px focus border that the ad-hoc button never
> had).

---

## 1. Prior State

No `NumberInput` component, file, story, or test existed anywhere in the
repository before this pass (confirmed via a dedicated repository audit).
The registry (`figma-component-map.json`) carried the row with `status:
"Missing"`, dependencies `["Text Input", "Label"]`.

## 2. Architecture Decision: Compose `TextInput`, Do Not Duplicate It

Per this batch's explicit instruction ("Compose using the approved Text
Input... Do not create another text input implementation") and live Figma
confirmation that Number Input shares Text Input's exact field chrome
(identical `Form/field-*` token family, identical 288-variant governing
axes, identical heights/radius/typography), `NumberInput` is a thin
composition layer: it renders a `<TextInput>` and supplies only the
increment/decrement stepper buttons via `TextInput`'s existing `prefix`/
`suffix` slots. Zero new color, spacing, radius, or typography tokens were
needed — every visual property is inherited from `TextInput` unchanged.

## 3. Structure Implemented

| Area | Detail |
|---|---|
| Value entry | Real `<input>` (via `TextInput`), `type="text"` `inputMode="decimal"`, `role="spinbutton"` + `aria-valuenow`/`aria-valuemin`/`aria-valuemax` (WAI-ARIA APG Spinbutton pattern) |
| Increment | `TextInput`'s `prefix` slot (leading edge, LTR) — a plain `<button>` filling the affix, containing the `add-01` icon (24px) |
| Decrement | `TextInput`'s `suffix` slot (trailing edge, LTR) — same technique, `remove-01` icon |
| min/max/step | Passed straight through to the underlying native `<input>` (`min`/`max`/`step` attributes) and used for clamping logic |
| Controlled/uncontrolled | `value`/`defaultValue`/`onValueChange`, mirroring the `checked`/`defaultChecked`/`onCheckedChange` pattern already established by `Switch` |
| Clamping | On blur and on every stepper/arrow-key step; **not** on every keystroke, so typing a multi-digit value isn't fought mid-entry |
| Keyboard | ArrowUp/ArrowDown step the value by `step` (WAI-ARIA APG Spinbutton baseline expectation) — new keyboard behavior beyond plain typing |

## 4. Figma Verification

| | |
|---|---|
| Figma file | `J0xq7JG3JKshRDzrgAM7E0` |
| Node ID | `30150:61013` (component-set root) |
| Variants | 288 (`rtl` × `state`[6] × `filled`[2] × `error`[2] × `size`[2] × `style`[3]) — identical governing axes to Text Input |
| Nodes sampled | `30150:61014` (Default/Large/Filled/Default-style baseline), `30150:61110` (Hovered), `30150:61527` (Disabled) — 3 nodes, confirming the field chrome is token-identical to Text Input's own already-verified matrix |
| Result | Every sampled color/spacing/typography token matched `TextInput`'s own values exactly — no independent Number-Input-scoped palette exists. The `prefix`=`plus-sign`/`suffix`=`minus-sign` icon badges are the only genuinely new structural element. |

## 5. Icon Substitution (Disclosed)

The live node's icons are named `plus-sign` (Figma node `19478:124491`) and
`minus-sign` (`21967:7954`) — neither exists under those names in this
project's already-imported Icon registry. `add-01`/`remove-01` (in the
`add-remove` category) were inspected directly at the raw-SVG level and
confirmed to be simple, undecorated plus/minus glyphs — a faithful visual
substitute, used and disclosed rather than triggering a new icon import for
this pass.

## 6. Accessibility

- `role="spinbutton"` + `aria-valuenow`/`aria-valuemin`/`aria-valuemax` — the
  WAI-ARIA APG-recommended pattern for exactly this widget shape (text entry
  + separate step controls). Not Figma-sourced (no ARIA annotations exist in
  the file) but a functional requirement, same category as `TextInput`'s own
  label/`aria-describedby`/`aria-invalid` contract, which is inherited
  unchanged.
- Increment/decrement buttons are icon-only, each with a required
  `incrementLabel`/`decrementLabel` accessible name (English defaults
  provided; Storybook demonstrates localized Arabic labels).
- ArrowUp/ArrowDown keyboard stepping added (APG baseline expectation).
- `disabled`/`readOnly` correctly suppress both the stepper buttons and
  ArrowUp/ArrowDown stepping, not just direct typing.
- `helperText`/`errorText`/`requiredField` all pass straight through to
  `TextInput`'s own already-verified accessibility contract — no
  reimplementation, no regression risk.

## 7. RTL

Not independently re-sampled from a live RTL Number Input node this pass —
extended by analogy from `TextInput`'s own already-verified RTL prefix/
suffix mirroring, since the structural containers are identical. Flagged
Needs Confirmation, non-blocking (spec §6/§8).

## 8. Scope

- New files only: `NumberInput.tsx`, `NumberInput.module.css`,
  `NumberInput.stories.tsx`, `NumberInput.test.tsx`, plus a barrel-export
  addition in `primitives/index.ts`.
- `TextInput.tsx`/`TextInput.module.css` and every other previously-Approved
  component are **unchanged** — confirmed via the full regression suite
  (517/517 passing, up from 496).
- Zero new design tokens — `NumberInput` consumes only `TextInput`'s
  existing tokens plus two pre-existing generic tokens
  (`--fads-sys-border-width-thick`, `--fads-sys-color-border-focus`) for the
  stepper buttons' own focus ring.

## 9. Validation

| Command | Result |
|---|---|
| `npm run typecheck` | ✅ Pass |
| `npm run lint` (eslint + `lint:css`) | ✅ Pass |
| `npm run format:check` | ✅ Pass |
| `npm test` | ✅ 517/517 tests pass (44 files), including 21 new `NumberInput.test.tsx` tests |
| `npm run tokens:generate` | ✅ 599 tokens generated (unchanged — no new tokens) |
| `npm run tokens:validate` | ✅ Pass |
| `npm run tokens:check-coverage` | ✅ Defined: 646, Referenced: 546, Missing: 0 (unchanged) |
| `npm run build` | ✅ Pass |
| `npm run build-storybook` | ✅ Pass |

## 10. Approval

Live node verified, composition-over-duplication confirmed (no second input
primitive was built), accessibility contract verified (WAI-ARIA Spinbutton
pattern + inherited `TextInput` contract), tests/Storybook/validation all
pass. Two Needs-Confirmation items remain non-blocking (spec §8): the
increment-left/decrement-right layout (implemented exactly as sampled, not
"corrected" to a more conventional order) and RTL behavior extended by
analogy rather than independently re-sampled.
