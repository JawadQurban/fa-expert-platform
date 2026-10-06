# Visual Compliance — Select (Dropdown Input)

Compares the official Platforms Code Dropdown Input component
(`docs/FIGMA_SELECT_SPECIFICATION.md`, node `3534:49934`) against the pre-existing FADS `Select`
primitive (`frontend/src/design-system/primitives/Select/`) as it stood before this pass.

> **2026-07-14 update (Batch 3, component 10 — Dropdown List Item):** the
> option/group-label `<li>` rows described below as ad-hoc inline markup
> were extracted into the separately-registered `DropdownListItem` primitive
> (node `3262:27949`) after live Figma verification confirmed this spec's
> own §9 node table already named that exact node "the Dropdown List Item
> sub-component." `Select` now composes `DropdownListItem` instead of its
> own `.option`/`.groupLabel`/`.check` CSS; all 26 tests below still pass
> unmodified. The extraction also fixed two real, independently-verified
> bugs: the option hover background was `#f9fafb` (should be `#f3f4f6`, an
> explicitly-flagged "Needs Confirmation" guess at the time this report was
> written) and the row padding/gap was `4px` (should be `8px`). See
> `reports/VISUAL_COMPLIANCE/DropdownListItem/VISUAL_COMPLIANCE_DROPDOWN_LIST_ITEM.md`
> for the full diff.

## 1. Prior Implementation Summary

A native `<select>` composing the shared `Field` wrapper and `control.module.css` base. Registry
note (pre-pass): "Implemented as native-`<select>`-based Select; official popover/list-item
structure not matched." No `size`/`surface` axis, no group support, no custom listbox.

## 2. Architecture Decision

See `docs/FIGMA_SELECT_SPECIFICATION.md` §1 in full. Summary: the official component's `Focused`
(open) state is a fully custom listbox panel (grouped sections, checkmarked selected item,
`shadow-xl` elevation, custom scrollbar) that native `<select>` structurally cannot render. Built
as a WAI-ARIA "Select-Only Combobox" — trigger button + portaled listbox — reusing `DatePicker`'s
already-established portal/positioning/outside-click/Escape architecture rather than introducing a
new overlay framework or library, per this task's explicit instruction.

## 3. Differences Found (and Fixed)

| # | Area | Official (live-verified) | Prior implementation | Fixed this pass |
|---|---|---|---|---|
| 1 | Overall structure | Custom trigger + portaled listbox panel with grouped sections and a checkmarked selected item | Native `<select>` — browser-rendered dropdown, no custom panel possible | ✅ Rebuilt as a custom combobox/listbox (spec §1) |
| 2 | `size` | Large (40px) / Medium (32px), matching `TextInput`'s scale exactly | No size prop — one fixed height | ✅ Added `size` prop |
| 3 | `surface` | Default / Filled darker / Filled lighter | Did not exist | ✅ Added `surface` prop, matching `TextInput`/`Textarea`'s naming |
| 4 | Grouped options | `multiSection` — a semibold "Group label" header + divider between sections | Did not exist (native `<option>` has no styled-group equivalent) | ✅ Added an optional `groups` prop (array of `{ label, options }`) alongside the existing flat `options` prop |
| 5 | Selected-item indicator | A checkmark icon on the selected `Dropdown List Item` | N/A (native browser rendering) | ✅ Added, `aria-selected` + a visible check icon |
| 6 | Read-only state | No fill, `border-disabled`, full-strength text | Did not exist as a distinct state (native `<select>` has no read-only concept) | ✅ Added `readOnly` prop with a real interaction guard (opening the panel is prevented) |
| 7 | Disabled state | No fill, `border-disabled`, muted text | Native `disabled` only (browser-default rendering) | ✅ Solid, live-verified colors instead of relying on OS-default disabled styling |
| 8 | Keyboard/open behavior | Custom listbox with active-option highlighting | Native `<select>` keyboard handling (fully correct, but not customizable to match the panel visuals) | ✅ WAI-ARIA "Select-Only Combobox" keyboard pattern (spec §7): Arrow keys, Home/End, Enter/Space, Escape, single-character type-ahead |
| 9 | Loading / empty states | Not a Figma variant (task-level functional requirement, Phase A/C) | Did not exist | ✅ Added `loading`/`loadingText` and an empty-options fallback (`noOptionsText`) — functional additions, not Figma-sourced variants |

## 4. Accessibility

- WAI-ARIA APG "Select-Only Combobox" pattern throughout (spec §7) — `role="combobox"` trigger,
  DOM focus never leaves it, `aria-activedescendant` tracks the highlighted option (not native
  focus movement), `role="listbox"`/`role="option"` for the panel.
- Native form participation via a hidden `<input type="hidden">` mirroring the selected value —
  the same technique this codebase's own `Switch` component already uses for a non-native control.
- Read-only vs. Disabled are semantically and visually distinct (spec §5), matching every other
  approved form primitive's own convention.
- Screen-reader announcement: a visually-hidden `aria-live="polite"` region announces the newly
  selected option's label on change, in addition to the standard `aria-activedescendant`/
  `role="option"`/`aria-selected` combobox semantics (belt-and-braces, per this task's explicit
  "screen-reader announcements" requirement).

## 5. RTL

Full logical-properties mirroring; the portaled panel's horizontal position is computed from the
trigger's own `getBoundingClientRect()` (already direction-agnostic — the same technique
`DatePicker` already uses successfully under RTL).

## 6. Scope

- Only `Select.tsx`, `Select.module.css`, `Select.stories.tsx`, `Select.test.tsx`, and
  `scripts/generate-tokens.mjs` (additive tokens only) were touched.
- `Field.tsx`, `Field.module.css`, `control.module.css`, `Textarea` — **unchanged**, confirmed via
  `grep`. `DatePicker.tsx` — **unchanged**; its portal/position/focus pattern was read and
  followed as a reference, not imported or modified.
- `Select` is not consumed by any product page (`grep`-verified), so zero external-breakage risk.
  **Breaking change, disclosed:** the public API changes from a thin wrapper around a native
  `<select>` (accepting arbitrary native `<select>` props via prop-spreading) to a dedicated
  combobox API (`options`/`groups`/`value`/`onValueChange`/`name`, no native `<select>`-specific
  props like `multiple` or `size` — the latter is repurposed as the Figma `Size` axis). This
  mirrors the exact same category of change already accepted for `TextInput`'s own rebuild.

## 7. Validation

| Command | Result |
|---|---|
| `npm run typecheck` | ✅ Pass |
| `npm run lint` (eslint + `lint:css`) | ⚠ 1 finding fixed, then ✅ Pass — `jsx-a11y/click-events-have-key-events` on the option `<li>`; suppressed with a documented, scoped `eslint-disable` block (WAI-ARIA APG: options are never independently focused/keyboard-operated, all keyboard interaction goes through the trigger) |
| `npm run format:check` | ✅ Pass (after `prettier --write` on 4 generated/touched files) |
| `npm test` | ✅ 43 files / 420 tests pass (26 Select tests, up from 5; `DatePicker` — whose portal/position pattern was read and followed, not modified — still passes unaffected) |
| `npm run tokens:validate` | ✅ Pass (413 tokens generated, 0 missing references) |
| `npm run build` | ✅ Pass |
| `npm run build-storybook` | ✅ Pass |

## 8. Approval

All of: live node, the architecture decision (§1), every governing variant axis, the custom
combobox's full keyboard/ARIA contract, tests, and every validation command above verified before
Select is marked Approved. Needs-Confirmation items (non-blocking): true type-ahead filtering vs.
single-character jump (spec §1), and group-header ARIA semantics (spec §7) — same category as
every prior component's scoped exceptions.
