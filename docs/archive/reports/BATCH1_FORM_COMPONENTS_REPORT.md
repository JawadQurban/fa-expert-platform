# Batch 1 of 2 — Form Components: Checkbox, Textarea, Select, File Upload

**Cycle:** DGA Design System — Missing Components Implementation, Batch 1 of 2
**Order executed:** Checkbox → Textarea → Select → File Upload (as required)
**Date:** 2026-07-13
**Governance model:** `docs/VISUAL_COMPLIANCE_WORKFLOW.md`, `docs/COMPONENT_APPROVAL_MATRIX.md`

---

## 1. Executive Summary

All four Batch 1 components — **Checkbox** (CMP-17), **Textarea** (CMP-14), **Select** /
"Dropdown Input" (CMP-15), and **FileUploader** / File Upload Single+Multiple (CMP-20) — were
taken from their prior state (bare/partial implementations, none Figma-verified against their
live official nodes) through the full 10-step Visual Compliance Workflow to **Approved**, one at
a time, in the required order. Each was live-verified against its official Platforms Code Figma
node, had every found discrepancy fixed, gained full Storybook coverage, a complete test suite
(axe-checked), updated documentation, and a registry/approval-matrix entry. No Batch 2 component
was touched. All required validation commands pass with the full four components included: 432
tests across 43 files, 430 generated tokens with 0 missing references, clean typecheck/lint/
format, and successful `build` + `build-storybook`.

## 2. Figma Verification

All four components used their already-registered `figmaFile`/`nodeId` from
`frontend/src/design-system/registry/figma-component-map.json` per the Official Figma Node
Resolution Policy — no node discovery was performed for already-resolved rows.

| Component | Figma file | Node(s) | Verified via |
|---|---|---|---|
| Checkbox | `J0xq7JG3JKshRDzrgAM7E0` | `30186:53826` (108-variant set: checked+indeterminate × state × size × style) | `get_metadata`, `get_design_context`, `get_variable_defs` |
| Textarea | `J0xq7JG3JKshRDzrgAM7E0` | `5462:417368` (144-variant set: rtl × state × filled × error × style) | same |
| Select | `J0xq7JG3JKshRDzrgAM7E0` | `3534:49934` (288-variant set: rtl × size × filled × state × error × style) | same |
| FileUploader | `J0xq7JG3JKshRDzrgAM7E0` | `30146:37020` (Single, 6 variants) + `30146:37007` (Multiple, 2 variants) | same |

All four rows' `nodeResolutionStatus` moved from `pending` (a workflow-progress marker, not a
missing-node blocker — none of the four had a null `nodeId`) to `resolved` on successful live
verification.

## 3. Issues Discovered

### Checkbox
- **Visual:** was a bare native `<input type="checkbox">` with only browser `accent-color` tint —
  no custom box, no size/mood variants, no real indeterminate glyph.
- **Behavior:** `readOnly` had no effect (native HTML spec excludes checkboxes/radios from the
  `readonly` attribute).
- **Accessibility:** no distinct disabled-checked treatment; relied on opacity rather than the
  live-verified solid disabled colors.
- **Token:** none of the 20 `--fads-sys-checkbox-*` tokens existed; component used generic shared
  color tokens.

### Textarea
- **Visual:** missing `surface` axis (`default`/`filledDarker`/`filledLighter`) entirely; no
  Focused shadow+underline treatment.
- **Behavior:** no `showCharacterCount` support.
- **Cross-component corroboration:** independently re-found the same `Filled darker`/`Filled
  lighter` Hover-border-reveal defect already discovered and fixed in `TextInput`'s own prior
  pass — treated as strong corroborating evidence, implemented correctly from the start.
- **Token:** 26 new `--fads-sys-textarea-*` tokens required; component previously used generic
  shared tokens.

### Select
- **Behavior/API:** was a native `<select>`; live Figma data (the `Focused` state's frame was
  388px tall vs. 68px for other states) proved the open state renders a full custom listbox
  (grouped sections, checkmarked selection, `shadow-xl`, custom scrollbar) that native `<select>`
  cannot produce — native select was insufficient, confirmed by evidence per the task's explicit
  instruction not to assume a custom listbox is required.
- **Accessibility:** native `<select>` has no support for the official grouped/multi-section
  layout, no visible checkmark-on-selected affordance matching Figma, and no way to implement the
  live `aria-activedescendant` combobox contract.
- **Token:** 27 new `--fads-sys-select-*` tokens.

### FileUploader
- **Visual:** always rendered one dashed drop-zone box regardless of intended variant. Live data
  showed Single has **no drop-zone chrome at all** (label + helper + solid dark Button only) while
  Multiple has the drop-zone (icon + heading + caption + secondary Button + file list) — a real
  chrome difference the prior implementation collapsed into one look.
- **Behavior:** Browse button always used a hardcoded `secondary` variant regardless of which
  official variant was being rendered.
- **Accessibility:** error status was rendered inline in the status column rather than as the
  live-verified separate bordered error-message row with its own distinct
  `Text/text-error-primary` (`#ce281c`) color.
- **Token:** 17 new `--fads-sys-fileupload-*` tokens; disabled state used opacity instead of the
  live solid disabled colors.

No documentation issues, RTL layout bugs, or test-coverage gaps were found as *pre-existing*
problems for any of the four — RTL and test coverage were both absent/thin before this pass and
are addressed under §4/§8/§9 below as new coverage rather than fixes to existing broken behavior.

## 4. Implementation Completed

- **Checkbox:** rebuilt as a hidden, fully focusable/interactive native `<input type="checkbox">`
  sibling before a decorative `<span>`, styled entirely via sibling-selector CSS
  (`:checked`/`:indeterminate`/`:hover`/`:active`/`:focus-visible`/`:disabled`) rather than a
  `role="checkbox"` custom div, per the task's explicit requirement for real native checkbox
  semantics. Added `size` (`md`/`sm`/`xs`) and `mood` (`primary`/`neutral`) props. `readOnly`
  implemented with a JS `preventDefault` guard (the native attribute has no effect on checkboxes).
  Disabled now uses solid live-verified colors, not opacity.
- **Textarea:** rebuilt as a fully self-contained primitive (no longer composes the shared
  `Field`/`control.module.css` base — Select still does) around the official `surface` prop; real
  Focused shadow+underline; solid Disabled colors; native `resize:vertical` preserved; native
  `scrollbar-width`/`scrollbar-color` approximates the official custom scrollbar;
  `showCharacterCount` added with a `useEffect` syncing length from a controlled `value`.
- **Select:** rebuilt from native `<select>` into a WAI-ARIA APG "Select-Only Combobox"
  (`role="combobox"` trigger, DOM focus never leaves the trigger, `aria-expanded`/
  `aria-controls`/`aria-activedescendant`) with a portaled `role="listbox"` panel, reusing
  `DatePicker`'s existing portal/position/outside-click/Escape architecture rather than building a
  new overlay system. Added `size`/`surface`/`groups` (official multi-section)/`loading`/
  `noOptionsText` props. Native form participation via a hidden `<input type="hidden">` (the same
  technique `Switch` already uses). Full keyboard contract: Arrow/Home/End/Enter/Escape plus
  type-ahead.
- **FileUploader:** added a `variant` prop (`'single' | 'multiple'`, default `'multiple'` —
  matching the prior always-drop-zone behavior, so non-breaking for existing callers) switching
  between the two genuinely distinct official chromes; Browse button now composes `Button`'s
  correct variant per `variant` (`neutral` for Single, `secondarySolid` for Multiple); rebuilt
  file-row/error-row structure to add the separate bordered error-message row; disabled now uses
  solid colors. Kept merged as one component (not split into two), resolving the registry's own
  prior open question. Explicitly presentation/selection-only: no invented upload-progress or
  server behavior — status/progress is caller-supplied via the `files` prop, actual network
  transfer stays outside the component; the drop zone is never the only selection method (a
  visible Browse button + hidden native `<input type="file">` always works); the native input is
  hidden via `aria-hidden`/off-screen positioning, not `display:none`/`visibility:hidden`, so it
  stays in the accessibility tree's interaction path via the Browse button's programmatic
  `.click()`.

## 5. Shared Architecture

- **Textarea** followed the self-contained-primitive pattern TextInput established (re-implements
  the accessibility contract locally — label association, `aria-describedby`, `aria-invalid`,
  `aria-required` — rather than distorting the shared `Field` base). **Select**, by contrast, still
  composes `Field` — its official structure didn't diverge enough to warrant the same rebuild.
  This split was a deliberate per-component judgment, not an inconsistency: over-generalizing one
  universal form-field abstraction across both would have forced Select's combobox trigger into a
  shape it doesn't have.
- **Select's overlay** reuses `DatePicker`'s already-proven portal/position/outside-click/Escape
  pattern (not a new implementation of the same idea) — no new overlay framework was introduced,
  per the explicit instruction to reuse existing primitives.
- `useFocusTrap` (used by DatePicker/Modal/NavDrawer) was deliberately **not** used for Select's
  listbox — it would move DOM focus into the panel, which is incorrect for the WAI-ARIA
  "select-only combobox" pattern where focus must stay on the trigger. Documented in both the
  component's JSDoc and its spec doc.
- **FileUploader** and **Select** both reuse the already-Approved `Button` primitive by
  composition (no duplicated button markup/tokens), and **Select** reuses `Switch`'s existing
  hidden-`<input type="hidden">` technique for native form participation.
- No new shared form primitive was introduced. The existing `Field`/`control.module.css` split
  was judged sufficient for the components that still fit it (Select); Checkbox/Textarea's
  divergence from that shape didn't reduce duplication enough to justify forcing them back in —
  consistent with "do not over-engineer a universal form abstraction."

## 6. Tokens

| Component | New tokens | Naming | Notes |
|---|---|---|---|
| Checkbox | 20 | `--fads-sys-checkbox-*` | Includes size/mood-scoped color and geometry tokens |
| Textarea | 26 | `--fads-sys-textarea-*` | Includes the 3 surface variants' full state matrix |
| Select | 27 | `--fads-sys-select-*` | Includes trigger, panel, option, and group-label tokens |
| FileUploader | 17 | `--fads-sys-fileupload-*` | Includes distinct Single vs. Multiple chrome tokens, plus the independently-sourced `text-error-primary` |

Total after Batch 1: **430 generated tokens** (`npm run tokens:generate` output confirms this;
`npm run tokens:check-coverage` confirms 0 of 480 defined/386 referenced custom properties
missing). All are additive — no existing token was renamed or removed. Per the established
component-scoping convention, no token is cross-referenced between components even where values
coincidentally match (e.g., shared color primitives independently sourced by each component from
the same underlying Figma variable) — documented as expected coincidence, not a cross-component
alias, consistent with the naming convention `--fads-sys-<component>-<purpose>`.

One color discrepancy was deliberately **not** silently normalized: FileUploader's error-message
text color (`Text/text-error-primary`, `#ce281c`) does not match the rest of the design system's
usual error red (`#b42318`) — sourced independently at its own live-verified value and flagged
Needs Confirmation rather than assumed identical.

## 7. Accessibility

- **Checkbox:** real native `<input type="checkbox">` semantics preserved (keyboard Space toggle,
  form participation, screen-reader checked/indeterminate announcement) via the hidden-input +
  decorative-span pattern rather than a `role="checkbox"` div. `readOnly` guarded in JS since the
  native attribute doesn't apply to checkboxes. Focus ring is real (not a border-color swap).
- **Textarea:** preserved label association, `aria-describedby` (helper/error text),
  `aria-invalid`, `aria-required` contract identical to TextInput's already-approved pattern.
- **Select:** full WAI-ARIA APG "Select-Only Combobox" contract — `role="combobox"`,
  `aria-expanded`, `aria-controls`, `aria-activedescendant`, `role="listbox"`/`role="option"` on
  the portaled panel, complete keyboard operability (Arrow/Home/End/Enter/Escape/type-ahead), a
  visually-hidden `aria-live="polite"` announcement of the newly selected option, and disabled
  options correctly skipped during keyboard navigation.
- **FileUploader:** hidden native `<input type="file">` triggered by a visible, keyboard-operable
  `Browse` button is a real, independent WCAG 2.5.7 click/keyboard alternative to drag-and-drop —
  the drop zone is never the only way to select a file, and the native input is hidden via
  off-screen positioning + `aria-hidden` (not `display:none`), keeping it reachable through the
  Browse button's programmatic click rather than removed from the interaction path. File list is a
  real `<ul aria-live="polite">` (no role override); each error gets its own `role="alert"` row.
- All four components pass `axe` scans in their test suites across their key states (default,
  error/invalid, disabled, and — for Select — open and for FileUploader — both variants).

## 8. Storybook

| Component | Stories file | Coverage |
|---|---|---|
| Checkbox | `Checkbox.stories.tsx` | 12 stories: Unchecked, Checked, Indeterminate, WithDescription, WithError, ReadOnly, Disabled, DisabledChecked, Sizes, Moods, Controlled, RTL |
| Textarea | `Textarea.stories.tsx` | 9 stories: Default, Required, WithHelper, WithError, ReadOnly, Disabled, Surfaces, WithCharacterCount, RTL |
| Select | `Select.stories.tsx` | 12 stories: Default, Required, WithHelper, WithError, ReadOnly, Disabled, Loading, NoOptions, Grouped, Sizes, Surfaces, Controlled, RTL |
| FileUploader | `FileUploader.stories.tsx` | 8 stories: MultipleEmpty, SingleEmpty, WithFiles, SingleWithFile, Disabled, DisabledSingle, Interactive, RTL |

`npm run build-storybook` succeeds with all four included (confirmed this pass — see §9).

## 9. Tests and Validation

Actual results from this session, run after all four components were complete:

| Command | Result |
|---|---|
| `npm run typecheck` | ✅ Pass (`tsc -b --noEmit`, 0 errors) |
| `npm run lint` (eslint + `lint:css`) | ✅ Pass, 0 violations |
| `npm run format:check` | ✅ Pass (after one expected `prettier --write` on the regenerated `tokens.css`) |
| `npm test` (`vitest run --run`) | ✅ **432 tests passed, 43 test files passed**, 0 failed |
| `npm run tokens:generate` | ✅ "Generated 430 tokens" |
| `npm run tokens:validate` | ✅ Pass (3/3 token tests) |
| `npm run tokens:check-coverage` | ✅ "Defined: 480, Referenced: 386, Missing: 0" |
| Component export checks | ✅ Fixed and verified — see below |
| `npm run build` | ✅ Pass |
| `npm run build-storybook` | ✅ Pass |

Per-component test counts (all included in the 432 total): Checkbox 25, Textarea 22, Select 26,
FileUploader 19.

**Component export checks — issue found and fixed this pass:** auditing
`frontend/src/design-system/primitives/index.ts` and `composite/index.ts` found that several
newly-introduced types were implemented and used internally but not re-exported from the public
`@ds` barrels: `TextareaSurface`, `CheckboxSize`, `CheckboxMood`, `SelectSize`, `SelectSurface`,
`SelectOptionGroup`, and `FileUploaderVariant`. Fixed by adding them to the relevant `export type`
statements in `primitives/index.ts`, `primitives/Textarea/index.ts`, and `composite/index.ts`
(mirroring the existing `TextInputSize`/`TextInputSurface` precedent). Re-ran `typecheck` after
the fix — clean. This was caught specifically because the Required Validation list calls out
"component export checks" as its own item; it would not have been caught by tests or lint alone
since internal component files imported their own local types directly rather than through the
barrel.

## 10. Files Modified

**Registry / governance (shared across all four, incremental updates):**
- `frontend/src/design-system/registry/figma-component-map.json`
- `docs/COMPONENT_APPROVAL_MATRIX.md`
- `frontend/scripts/generate-tokens.mjs`
- `frontend/src/design-system/tokens/generated/tokens.css` (generated, then formatted)

**New documentation:**
- `docs/FIGMA_CHECKBOX_SPECIFICATION.md`
- `docs/FIGMA_TEXTAREA_SPECIFICATION.md`
- `docs/FIGMA_SELECT_SPECIFICATION.md`
- `docs/FIGMA_FILE_UPLOAD_SPECIFICATION.md`
- `reports/VISUAL_COMPLIANCE/Checkbox/VISUAL_COMPLIANCE_CHECKBOX.md`
- `reports/VISUAL_COMPLIANCE/Textarea/VISUAL_COMPLIANCE_TEXTAREA.md`
- `reports/VISUAL_COMPLIANCE/Select/VISUAL_COMPLIANCE_SELECT.md`
- `reports/VISUAL_COMPLIANCE/FileUploader/VISUAL_COMPLIANCE_FILEUPLOADER.md`
- `reports/BATCH1_FORM_COMPONENTS_REPORT.md` (this report)

**Checkbox:**
- `frontend/src/design-system/primitives/Checkbox/Checkbox.tsx`
- `frontend/src/design-system/primitives/Checkbox/Checkbox.module.css`
- `frontend/src/design-system/primitives/Checkbox/Checkbox.stories.tsx`
- `frontend/src/design-system/primitives/Checkbox/Checkbox.test.tsx`

**Textarea:**
- `frontend/src/design-system/primitives/Textarea/Textarea.tsx`
- `frontend/src/design-system/primitives/Textarea/Textarea.module.css`
- `frontend/src/design-system/primitives/Textarea/Textarea.stories.tsx`
- `frontend/src/design-system/primitives/Textarea/Textarea.test.tsx`
- `frontend/src/design-system/primitives/Textarea/index.ts` (export fix)

**Select:**
- `frontend/src/design-system/primitives/Select/Select.tsx`
- `frontend/src/design-system/primitives/Select/Select.module.css`
- `frontend/src/design-system/primitives/Select/Select.stories.tsx`
- `frontend/src/design-system/primitives/Select/Select.test.tsx`

**FileUploader:**
- `frontend/src/design-system/composite/FileUploader/FileUploader.tsx`
- `frontend/src/design-system/composite/FileUploader/FileUploader.module.css`
- `frontend/src/design-system/composite/FileUploader/FileUploader.stories.tsx`
- `frontend/src/design-system/composite/FileUploader/FileUploader.test.tsx`

**Public API barrels (export fixes):**
- `frontend/src/design-system/primitives/index.ts`
- `frontend/src/design-system/composite/index.ts`

No file belonging to a Batch 2 component, no unrelated approved component, and no shared
architecture outside what's listed above was modified.

## 11. Remaining Risks

- **FileUploader — Single drag-and-drop capability (Needs Confirmation, non-blocking):** Figma
  shows no drop-zone chrome for the Single variant, and there are no interaction annotations
  either way. Implemented as functionally available in both variants (a strictly more-capable,
  non-regressive reading) rather than guessed-disabled — a real design-team confirmation is still
  needed to close this out, but it does not block approval since the implementation defaults to
  the safer, more accessible behavior.
- **FileUploader — error-text color discrepancy:** `text-error-primary` (`#ce281c`) vs. this
  design system's usual `#b42318` error red — implemented at its own independently-sampled value
  rather than normalized, flagged for confirmation.
- **Select — type-ahead vs. single-character jump, and group-header ARIA semantics:** implemented
  as continuous type-ahead per the WAI-ARIA APG combobox pattern; not independently confirmed
  against a Figma interaction spec since Figma doesn't encode keyboard behavior.
- **Checkbox — exact checkmark/indeterminate vector shape and Read-only icon color:** approximated
  pending the DGA icon library import pipeline, same category as every other approved component's
  icon-pipeline gap (Breadcrumb's separator, TextInput's feedback icon).
- **Textarea — Disabled text-color extension and scrollbar CSS approximation:** the Disabled
  text color was extended from an untokenized stray hex sampled in the live node; the scrollbar
  uses standard CSS properties as a visual approximation of Figma's custom scrollbar graphic.
- None of the above block Approved status — all are pre-existing categories of Needs-Confirmation
  disclosure already accepted as non-blocking for every previously-approved component in this
  repo (Button's Destructive/OnColor scope, Card's Selectable/Expandable omission, Header's
  Mega-Submenu omission, etc.).
- No regressions were introduced in any of the 27 other test files/components — the full 432-test
  suite (up from 359 before this batch) passes, including all previously-approved components.

## 12. Final Status

**Batch 1 Complete — All Four Components Approved**
