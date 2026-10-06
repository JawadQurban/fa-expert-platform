# Visual Compliance — DropdownListItem

Compares the new FADS `DropdownListItem` primitive against the official
Platforms Code Dropdown List Item component (see
`docs/FIGMA_DROPDOWN_LIST_ITEM_SPECIFICATION.md`, node `3262:27949` in file
`J0xq7JG3JKshRDzrgAM7E0`). Registry status was `Missing` before this pass —
no prior standalone implementation existed, though (as this pass discovered)
the exact same node was already sampled and referenced during `Select`'s own
earlier pass.

---

## 1. Live Verification

The full variant set (`type`[Single Select/Multi Select/Group label] ×
`state`[Default/Hovered/Pressed/Focused/Disabled] × `selected` × `divider` ×
`rtl`) resolved in a single `get_design_context` call. `get_variable_defs`
returned 12 named Figma variables.

## 2. The Key Finding: This Is Already `Select`'s Own Sub-Component

`docs/FIGMA_SELECT_SPECIFICATION.md` (written during an earlier pass)
literally names node `3262:27949` as the "Dropdown List Item sub-component"
in its own node table, and its component hierarchy diagram already reads
"Section × 1–2 → **Dropdown List Item × N**". This is a confirmed,
node-identical match — the same category of finding as this batch's
component 5 (`InputPrefixSuffix`, extracted from `NumberInput`'s stepper
buttons). Per this project's "reuse existing approved components" rule,
`Select.tsx` was refactored to compose the new `DropdownListItem` primitive
for its option/group rows instead of its own ad-hoc `<li>` markup.

## 3. A Real Fidelity Fix Found in `Select`

Refactoring surfaced two genuine, independently-verified discrepancies in
`Select`'s prior option-row CSS:

| | Prior (`Select.module.css`) | Live-verified |
|---|---|---|
| Hover background | `#f9fafb` (explicitly flagged "Needs Confirmation" at the time it was written) | `#f3f4f6` |
| Row padding/gap | `4px` | `8px` |

Both are now correct via the shared primitive. `Select`'s own now-dead
`.option`/`.groupLabel`/`.check` CSS classes and 4 fully-unused tokens
(`select-option-text`, `select-option-hover-bg`, `select-group-text`,
`select-panel-gap`) were removed.

## 4. Implementation Summary

New primitive `DropdownListItem` — renders a real `<li>` (`role="option"`
or `role="presentation"` for `type="groupLabel"`), meant to sit inside a
consumer's own `<ul role="listbox">`. `type` (`'option' |
'multiSelectOption' | 'groupLabel'`), `selected` (drives `aria-selected` +
the trailing checkmark or checked box), `disabled`, `divider`, and `active`
— the live `Focused` state, which is **not** native DOM focus: `Select`'s
own WAI-ARIA "Select-Only Combobox" pattern keeps real focus on the trigger
button and tracks the highlighted row via `aria-activedescendant`, so
`active` is a consumer-driven prop rendering the live-verified 2px border,
not a `:focus-visible` style.

The Multi Select checkbox is a **decorative reuse of `Checkbox`'s own
tokens** (`get_variable_defs` confirmed byte-identical `xs`/`neutral`/
`checked` values), not a literal `<Checkbox>` composition: `Checkbox`'s
`label` always renders at its own 16px type scale, which would be wrong for
this component's live-verified 14px list-item text, and there is no prop to
override just the label's font size. The outer `<li>` owns the real
`aria-selected` state; the checkbox visual is `aria-hidden`.

## 5. Token Changes

10 new additive `--fads-sys-dropdownlistitem-*` tokens (text, text-disabled,
group-text, icon-default, bg-hover, bg-pressed, focus-border,
checkbox-border, divider, padding). Border-width/radius reuse the
already-shared generic `--fads-sys-border-width-thick`/`-thin`/
`--fads-sys-radius-sm` tokens; the Multi Select checkbox reuses `Checkbox`'s
own `--fads-sys-checkbox-size-xs`/`-radius`/`-neutral-checked`/
`-icon-oncolor` tokens directly. 4 now-fully-unused `Select`-scoped tokens
were removed (§3). Net: 10 new, 4 removed.

## 6. Storybook Coverage

Option, Selected, Active, Disabled, WithDivider, MultiSelectOption,
GroupLabel, **OfficialFigmaReference** — 8 stories (new component).

## 7. Accessibility

- Real `role="option"`/`role="presentation"`, `aria-selected`,
  `aria-disabled`.
- Multi Select's decorative checkbox is `aria-hidden` — `aria-selected` on
  the `<li>` is the single source of truth for assistive technology.
- No RTL-specific code needed — the checkmark/checkbox position is fixed
  per `type` and mirrors correctly under the app's own `dir="rtl"` default
  via natural CSS logical-flow, confirmed against a dedicated screenshot
  comparison (see spec §2).

## 8. Validation

| Command | Result |
|---|---|
| `npm run typecheck` | ✅ Pass |
| `npm run lint` (eslint + `lint:css`) | ✅ Pass (one now-unused `eslint-disable` comment in `Select.tsx`, left over from the pre-refactor `<li>` markup, was found and removed) |
| `npm run format:check` | ✅ Pass (after `prettier --write` on the regenerated `tokens.css`) |
| `npm test` | ✅ 597/597 tests, 50 files — 12 new in `DropdownListItem.test.tsx`; all 26 pre-existing `Select.test.tsx` tests pass unmodified |
| `npm run tokens:generate` | ✅ 649 tokens generated |
| `npm run tokens:validate` | ✅ Pass |
| `npm run tokens:check-coverage` | ✅ Defined: 696, Referenced: 600, Missing: 0 |
| `npm run build` | ✅ Pass |
| `npm run build-storybook` | ✅ Pass |

## 9. Scope

- New files: `DropdownListItem.tsx`, `DropdownListItem.module.css`,
  `DropdownListItem.stories.tsx`, `DropdownListItem.test.tsx`.
- `frontend/src/design-system/primitives/index.ts` — added barrel export.
- `frontend/scripts/generate-tokens.mjs` — new additive Dropdown List Item
  token block (10 tokens); removed 4 now-unused `Select` tokens.
- `Select.tsx` — refactored to compose `DropdownListItem` for option/group
  rows; module doc updated to reference this component and the two fidelity
  fixes found.
- `Select.module.css` — removed the now-superseded `.option`/`.groupLabel`/
  `.check` classes.
- `DatePicker.tsx`'s own internal year-dropdown listbox is **not** refactored
  in this pass — it renders plain year numbers, not the label+checkmark/
  checkbox pattern this component models, so adopting it here would be
  discretionary, not a proven node-identical match (unlike `Select`). Left
  as previously disclosed, pending future evaluation.
- Every other previously-Approved component is unchanged — confirmed via
  the full regression suite (597/597, up from 585).

## 10. Approval

Live-verified across the full variant set in one call, a confirmed
node-identical match with `Select`'s own pre-existing spec (triggering a
required extraction + refactor, not a discretionary one), two real fidelity
bugs found and fixed in `Select`'s own prior implementation, one disclosed
architecture decision (decorative checkbox reusing `Checkbox`'s tokens
rather than composing it), zero regressions across `Select`'s own 26
pre-existing tests, Storybook/tests/validation all pass.
