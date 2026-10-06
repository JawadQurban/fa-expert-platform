# Visual Compliance — TextInput

Compares the official Platforms Code Text Input component (see
`docs/FIGMA_TEXT_INPUT_SPECIFICATION.md`, node `30150:130250` in file
`J0xq7JG3JKshRDzrgAM7E0`) against the FADS `TextInput` primitive as it stood before this pass
(`frontend/src/design-system/primitives/TextInput/TextInput.tsx` / `TextInput.module.css`, both
pre-existing — Text Input was already `Implemented` per `figma-component-map.json`, but with
`nodeId: null` and `visualComplianceStatus: "pending"`).

---

## 1. Prior Implementation Summary

Before this pass, `TextInput` composed the shared `Field` wrapper (label/helper/error) and the
shared `control.module.css` base (also used by `Textarea` and `Select`) for its bordered input
box. It supported only `label`/`helperText`/`errorText`/`requiredField`/`fieldClassName` plus
native `<input>` props — no `size` axis, no `style`/surface axis, no leading icon, no
prefix/suffix, and generic (non-Text-Input-scoped) tokens
(`--fads-sys-color-field-background`, `--fads-sys-color-field-border`,
`--fads-sys-control-height-md`, etc.) shared across all three composing components.

## 2. Architecture Decision: TextInput No Longer Composes `Field`/`control.module.css`

The official Text Input's structure (prefix/suffix badges, a leading-icon slot, a `Size` axis
with per-size typography, a 3-value `Style` surface axis, a Focused-state shadow+underline
treatment) has diverged far enough from the shared `Field`/`control` shape that reusing it would
mean either (a) distorting the shared base to fit one component's needs, silently changing
`Textarea`/`Select`'s behavior too, or (b) making `TextInput` self-contained. Per "never modify
unrelated components," **(b) was chosen**: `TextInput.tsx`/`TextInput.module.css` are now fully
self-contained, with the same accessibility contract (label association, `aria-describedby`,
`aria-invalid`, `aria-required`, `role="alert"` error) re-implemented locally.
`Field.tsx`/`Field.module.css`/`control.module.css`/`Textarea`/`Select` are **untouched** by this
pass — verified via `grep`, `Textarea`/`Select` still import `Field`/`control.module.css`
unchanged.

## 3. Differences Found (and Fixed)

| # | Area | Official (live-verified) | Prior implementation | Fixed this pass |
|---|---|---|---|---|
| 1 | Color tokens | Text-Input-scoped Figma variables (`Form/field-background-*`, `Form/field-border-*`, `Form/field-text-*`) | Generic, shared `--fads-sys-color-field-*` tokens (shared with Textarea/Select, not independently sourced) | ✅ 36 new additive `--fads-sys-textinput-*` tokens, all live-verified |
| 2 | `size` prop | Official `Size`: `Large` (40px/text-md) / `Medium` (32px/text-sm — value text actually drops font tier, not just height) | No size prop — single fixed height (`--fads-sys-control-height-md`), no font-size change | ✅ Added `size` prop (`TextInputSize`: `'md' \| 'lg'`, default `'lg'`) |
| 3 | `surface`/`style` prop | Official `Style`: `Default` (bordered white) / `Filled darker` (flat gray fill, no border) / `Filled lighter` (flat near-white fill, no border, affixes lose their background too) | Did not exist | ✅ Added `surface` prop (`TextInputSurface`), default `'default'` |
| 4 | Leading icon | Official `icon`/`swapIcon` slot, 20px, inside the content region before the value text | Did not exist | ✅ Added `iconStart` prop |
| 5 | Prefix / Suffix | Official `prefix`/`suffix` text-badge slots with their own background/padding, scaling with `Size` | Did not exist | ✅ Added `prefix`/`suffix` props |
| 6 | Focused state | A soft 2-layer drop shadow (`shadow-md`) + a full-width 2px bottom "underline" accent; **border color unchanged** | No focus-visible treatment at all — relied on the browser default outline | ✅ Added `box-shadow` + underline via `:focus-within` (the wrapper, since the real `<input>` receives focus); native outline suppressed on `.input` since the wrapper-level treatment always co-occurs |
| 7 | Pressed state | Background darkens to `field-background-darker` + the same bottom underline accent, **regardless of `Style`/surface** | Not distinguished from Hovered at all | ✅ Added via native `:active`, matching the live-verified state-independent darkening |
| 8 | Hovered state | Border color only (`field-border-hovered`), no background change | `border-color: var(--fads-sys-color-border-strong)` (a non-Text-Input-scoped, generic token) | ✅ Now uses the live-verified, Text-Input-scoped `field-border-hovered` token |
| 9 | Read-only state | **No fill at all** (transparent), a lighter neutral border (`border-neutral-primary` `#d2d6db`) | `background-color: var(--fads-sys-color-background-subtle)` (a solid fill — official has none) | ✅ Read-only now renders with no background fill, matching the live node |
| 10 | Disabled state | **No fill at all** (transparent), `border-disabled` `#d2d6db`; **uniform across all 3 `Style`/surface values** (live-verified on `Filled darker` and `Filled lighter`, both converge to the same treatment) | `opacity: var(--fads-sys-opacity-disabled)` (an opacity-based dimming of whatever variant was showing) | ✅ Disabled now renders as a real, solid, surface-independent color set (no opacity trick), matching every other approved component's "solid colors, not opacity" disabled pattern (Button, Card) |
| 11 | Value-text vs. placeholder color | Official `Filled=True`/`False` axis — distinct `field-text-filled` (`#161616`) vs. `field-text-placeholder` (`#6c737f`) colors | `.control::placeholder` existed but the base `.control` text color was a generic `--fads-sys-color-text-default`, not the Text-Input-specific filled color | ✅ `.input` now uses `--fads-sys-textinput-text-filled`; `::placeholder` uses `--fads-sys-textinput-text-placeholder` — the native value-vs-placeholder distinction already does the rest, no `filled` prop needed |
| 12 | Required-asterisk color/disabled handling | Asterisk always `field-border-error` (`#b42318`) unless the field is Disabled, in which case both asterisk and label text drop to the shared `Global/input-text-disabled` gray with no distinct red | `.required { color: var(--fads-sys-color-status-error) }` unconditionally, including when disabled | ✅ Asterisk now correctly grays out with the rest of the label when `disabled` |
| 13 | Radius / border-width | `radius-sm` (4px), 1px border — both already shared SYS-level tokens | Used `--fads-sys-control-radius` (a different, non-Text-Input-verified token) | ✅ Switched to the shared, already-verified `--fads-sys-radius-sm`/`--fads-sys-border-width-thin` (same reuse pattern as Button/Link/Tag) |
| 14 | RTL | See spec §8 — implemented as full logical-properties mirroring | `inline-size: 100%`, no physical properties (already RTL-safe by construction) | ✅ No regression; confirmed via live RTL sampling that full mirroring is the defensible choice over the ambiguous "physical anchoring" reading of one sample (spec §8/§12) |
| 15 | Feedback icon in helper/error row | Official row includes a 16px feedback icon before the text | Text-only `<p>` | ⚠ **Not implemented**, pending the official DGA icon library (Q8) — same category as `Link`'s external-icon placeholder and `Footer`'s utilities slot. Flagged, not silently dropped. |
| 16 | "Type Cursor" (Focused) | A 1px×24px vertical bar simulating a blinking caret | N/A | ✅ Correctly **not implemented** — a real `<input>` already renders its own native caret on focus; adding a fake one would duplicate/conflict with it (spec §6) |

## 4. Accessibility

- Label association (`htmlFor`/`id`), `aria-describedby` (helper + error), `aria-invalid`,
  `aria-required` — preserved exactly, all 5 pre-existing tests for this contract still pass
  unchanged.
- Focus indicator (shadow + underline) is real, visible, and applies via `:focus-within` on the
  wrapper (the actual `<input>` still receives real keyboard focus) — the native default outline
  is suppressed only because this equally-strong substitute always co-occurs with it.
- Disabled: real solid colors (not opacity), `disabled` attribute — verified via a new axe check
  (`has no accessibility violations when disabled`).
- Read-only: native `readOnly` attribute, distinct from Disabled both visually (retains
  full-strength text color) and semantically (still focusable/selectable, not excluded from the
  tab order).

## 5. RTL

No layout bug found or fixed beyond confirming (spec §8) that full logical-properties mirroring —
already this codebase's universal convention — is the correct, defensible choice over one
ambiguous live sample that could be read as "icon/prefix/suffix stay physically anchored."
Implementing the latter would have been a genuinely unusual, unconfirmed RTL pattern inconsistent
with every other approved component; flagged for design-team confirmation rather than guessed at.

## 6. Scope

- Only `TextInput.tsx`, `TextInput.module.css`, `TextInput.stories.tsx`, `TextInput.test.tsx`,
  and the two `primitives/index.ts` barrel exports were touched.
- `generate-tokens.mjs` gained one new additive `fads-sys-textinput-*` token block (36 tokens),
  including a new generic `getFormColor()` alias-resolver (mirroring the existing
  `getButtonColor()` pattern) since `Light.tokens.json`'s `Form` group stores most Text Input
  colors as alias strings rather than direct hex values.
- `Field.tsx`, `Field.module.css`, `control.module.css`, `Textarea.tsx`, `Textarea.module.css`,
  `Select.tsx`, `Select.module.css` — **all unchanged**, confirmed via `grep` before and after.
- `TextInput` is not consumed by any product page or other component (`grep`-verified — only its
  own test file referenced it before this pass), so this rebuild carries zero external-breakage
  risk.

## 7. Required Code (this pass) — Status

1. ✅ `TextInput.tsx` — self-contained; added `size`, `surface`, `iconStart`, `prefix`, `suffix`
   props; preserved the full existing a11y contract.
2. ✅ `TextInput.module.css` — token-only, no hardcoded colors/spacing (verified: `lint:css`).
3. ✅ `scripts/generate-tokens.mjs` — 36 new additive `--fads-sys-textinput-*` tokens.
4. ✅ `TextInput.stories.tsx` — Default, Required, WithHelper, WithError, ReadOnly, Disabled,
   Sizes, Surfaces, PrefixSuffixIcon, RTL.
5. ✅ `TextInput.test.tsx` — size/surface/prefix/suffix/iconStart coverage added alongside the 5
   pre-existing a11y-contract tests (all still pass); added a disabled-state axe check.
6. ✅ Exported from both `primitives/TextInput/index.ts` and `primitives/index.ts` (public `@ds`
   API) — `TextInputSize`/`TextInputSurface` added alongside the existing `TextInputProps`.

## 8. Validation

Run one command at a time per the workflow, in order:

| Command | Result |
|---|---|
| `npm run typecheck` | ⚠ 2 errors found and fixed, then ✅ Pass |
| `npm run lint` (eslint + `lint:css`) | ✅ Pass |
| `npm run format:check` | ✅ Pass (after `prettier --write` on 3 generated/touched files) |
| `npm test` | ✅ 43 files / 328 tests pass, including 16 TextInput tests |
| `npm run tokens:validate` | ✅ Pass (336 tokens generated, 0 missing references) |
| `npm run build` | ✅ Pass |
| `npm run build-storybook` | ✅ Pass |

**Bugs found and fixed during `npm run typecheck`:**
1. `prefix` collided with a global RDFa HTML attribute (`prefix?: string`, present on every
   element in React's DOM typings) — our own `prefix?: ReactNode` prop needed an explicit `Omit`
   from `ComponentPropsWithRef<'input'>` to override it.
2. Omitting `'id'` from the base props (a leftover from the old `Field`-based version, which
   generated its own id internally and never let callers override it) left `TextInputProps`
   without an `id` field at all, even though the new implementation reads `id: idProp` to allow an
   optional override. Removed `'id'` from the `Omit` list.

## 9. Approval

All of: live node, all 6 governing variant axes (rtl/state/filled/error/size/style), variables,
RTL behavior, accessibility, tests, and every validation command above must be verified before
Text Input is marked Approved — recorded in `figma-component-map.json` and
`docs/COMPONENT_APPROVAL_MATRIX.md` once §8 is complete. Two Needs-Confirmation items remain
non-blocking (spec §12): the Large-size Default-state text-color token discrepancy, and the
RTL icon/prefix/suffix anchoring ambiguity — same category as prior components' scoped
exceptions (Button's Destructive/OnColor restriction, Link's Neutral-Visited discrepancy, etc.).

---

## 10. 2026-07-13 Follow-up — Storybook/Figma Alignment Pass

Triggered by a dedicated request to make the Storybook a faithful visual-verification surface.
Full re-audit against live Figma data; see
`reports/VISUAL_COMPLIANCE/TextInput/TEXTINPUT_STORYBOOK_FIGMA_DIFF.md` for the complete diff.
Summary of what changed:

1. **One real component bug found and fixed** — `Filled darker`/`Filled lighter` Hovered/Pressed
   were previously only "extended by analog" (not directly sampled). Direct sampling this pass
   (nodes `30150:131667`/`131771`/`132011`/`132979`/`133083`/`133323`) found they gain a
   `field-border-default` border on Hover/Press that the component wasn't rendering — it was
   applying the Default style's `field-border-hovered` border rule to all 3 surfaces uniformly.
   Fixed in `TextInput.module.css` (see spec §12 item 2). No new tokens needed — reuses the
   existing `--fads-sys-textinput-border-default`.
2. **`OfficialFigmaMatrix` story rebuilt** from a single 9-column (`auto` + 8×220px ≈ 1900px)
   grid into a `Size → Surface → LTR/RTL → State` hierarchy matching the task's recommended
   structure — each section is now 5 columns (`auto` + 4×176px, ~800px) and fits normal desktop
   Storybook width without horizontal overflow. Layout chrome (headings, grid, legend, NC badge)
   moved out of inline styles into `TextInput.matrixDemo.module.css`, using the shared generic SYS
   tokens (`--fads-sys-color-text-*`, `--fads-sys-typography-text-*`) where available; no
   generic spacing-scale token exists in this codebase to replace the remaining plain-rem gaps.
3. **Needs-Confirmation badges added** — every matrix cell not directly sampled via
   `get_design_context` is now flagged "NC" in the story itself (not just in prose in a separate
   doc), so a reviewer can tell at a glance which of the 288 cells are live-verified vs. extended
   by analog.
4. **Tests added**: RTL `dir="auto"` propagation to input/affixes, a console-error-free render
   across the full prop surface (guards the earlier `prefix`-attribute-collision class of bug),
   and a parametrized stability check across size × surface × error × disabled × readOnly.
5. **Validation**: `typecheck`, `lint` (incl. `lint:css`), `format:check`, `test` (354/354,
   including 42 TextInput tests), `tokens:validate`, `build`, `build-storybook` — all pass.
6. **Not done**: no headless-browser/screenshot tool was available in this environment to
   pixel-diff the rendered Storybook page against the Figma screenshot. Verification here is
   live-Figma-token-level (get_design_context on the specific previously-unverified nodes) plus
   code review, not a rendered-pixel comparison — flagged per this task's own Step 5 instruction
   not to claim exact visual compliance from `build-storybook` passing alone.
