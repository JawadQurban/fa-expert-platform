# Visual Compliance — Switch / Switch Label

Compares the official Platforms Code Switch component (see
`docs/FIGMA_SWITCH_SPECIFICATION.md`, node `30150:69895` in file
`J0xq7JG3JKshRDzrgAM7E0`) against the FADS `Switch` primitive as it stood
before this pass (`frontend/src/design-system/primitives/Switch/Switch.tsx` /
`Switch.module.css`, both pre-existing — Switch was already `Implemented`
per `figma-component-map.json`, "⚠ Visual fidelity Pending final DGA token
values (Q3/Q20)", never through the Visual Compliance Workflow before this
pass).

---

## 1. Prior Implementation Summary

Before this pass, `Switch` was a `<button role="switch">` (correct
architecture, kept unchanged — see §2) styled with generic, unverified
tokens: `--fads-sys-color-border-strong` (track border), `--fads-sys-color-
background-subtle` (track fill), `--fads-sys-selection-color-checked`
(checked fill), `--fads-sys-opacity-disabled` (disabled dimming). Track was
44×24px (`2.75rem`×`1.5rem`), thumb 18px (`1.125rem`) — both wrong vs. the
live-verified 48×24px track / 16px thumb. No `description`/`errorText` props
existed at all (a tracked gap: `docs/PROJECT_STATUS.md`'s technical-debt list
named "Checkbox/Switch error-state support" explicitly). No `trailing` layout
option existed. 4 Storybook stories, 5 tests. No
`docs/FIGMA_SWITCH_SPECIFICATION.md` or `reports/VISUAL_COMPLIANCE/Switch/`
existed.

## 2. Architecture Decision: Keep `<button role="switch">` (No Hidden-Input Rebuild)

Unlike `Checkbox`/`Radio` (both rebuilt this batch cycle from a bare native
input into a hidden-input + decorative-box architecture), **Switch's
existing `<button role="switch">` architecture was kept unchanged** — there
is no native HTML input type for a switch to hide, so a real `<button>`
carrying `role="switch"`/`aria-checked` is itself the WAI-ARIA APG-recommended
pattern, not a shortcut needing replacement. The separate `<input
type="hidden">` mirroring state for form submission (the same technique the
registry's `Select` entry explicitly credits to Switch) was also kept
unchanged.

## 3. Differences Found (and Fixed)

| # | Area | Official (live-verified) | Prior implementation | Fixed this pass |
|---|---|---|---|---|
| 1 | Track size | 48×24px | 44×24px (`2.75rem`×`1.5rem`) | ✅ New `fads-sys-switch-track-inline`/`-block` tokens |
| 2 | Thumb size | 16px | 18px (`1.125rem`) | ✅ New `fads-sys-switch-thumb-size` token |
| 3 | Thumb inset | 4px (both axes, independently confirmed) | `0.1875rem` (3px), hardcoded, not a token | ✅ New `fads-sys-switch-thumb-inset` token |
| 4 | Checked-fill color | `control-primary-checked` `#1b8354` | Generic `--fads-sys-selection-color-checked` (unverified) | ✅ New `fads-sys-switch-bg-checked` + hovered/pressed/disabled variants |
| 5 | Unchecked border color | `control-border`/`control-neutral-{hovered,pressed,focused}` per state | Generic `--fads-sys-color-border-strong` (unverified, static across all states) | ✅ New `fads-sys-switch-border-*` tokens, per-state |
| 6 | Hover/Pressed ripple halo | A 4px-outward blended (`mix-blend-multiply`) overlay | Did not exist | ✅ New `.track::before` pseudo-element + `fads-sys-switch-ripple` token |
| 7 | Focus ring | A **separate**, rectangular (`radius-xs`), 4px-outward overlay — distinct from the ripple; unchecked reuses its own border color, checked uses a universal black | Native browser default outline only | ✅ New `.track::after` pseudo-element + `fads-sys-switch-focus-ring-{off,on}`/`-radius` tokens |
| 8 | Disabled | `opacity: var(--fads-sys-opacity-disabled)` (dimming trick) | Solid uniform colors (not opacity) — matches Checkbox/Radio's established pattern | ✅ New `fads-sys-switch-border-disabled`/`-bg-checked-disabled` tokens |
| 9 | Thumb background/shadow | White + `Shadows/shadow-sm` (2-layer) | Generic `--fads-sys-color-background-default`, no shadow | ✅ New `fads-sys-switch-thumb-bg`/`-thumb-shadow` tokens |
| 10 | Label text color | `text-display` `#1f2a37` | Generic `--fads-sys-color-text-default` `#161616` | ✅ New `fads-sys-switch-label-text` token |
| 11 | `description`/helper text | `text-primary-paragraph` `#384250` | Did not exist as a prop | ✅ New `description` prop (mirrors Checkbox/Radio), new `fads-sys-switch-description-text` token |
| 12 | `errorText` | `text-error` `#b42318` + a 16px `FeedbackIcon` ("alert-circle") | Did not exist — a long-tracked gap (`docs/PROJECT_STATUS.md` technical debt list) | ✅ New `errorText` prop, real `alert-circle` icon, `fads-sys-switch-error-text`/`-error-gap` tokens |
| 13 | `trailing` (official `trailSwitch`) | Switch renders after the label instead of before | Did not exist | ✅ New `trailing` prop |

## 4. Accessibility

- `role="switch"`/`aria-checked` and Space/Enter activation are native
  `<button>` behavior, unchanged and re-verified working (added an explicit
  Enter-key test — only Space was previously tested).
- New `description`/`errorText` wired to `aria-describedby`/`aria-invalid`/
  `role="alert"`, closing the tracked "Checkbox/Switch error-state support"
  gap for Switch's half.
- Focus indicator is real, visible, and structurally distinct from the
  Hover/Pressed ripple (different pseudo-element, different shape/color
  rules) — not reused/conflated, matching the live Figma distinction.
- Disabled: solid colors (not opacity), native `disabled` attribute.

## 5. RTL

No layout bug found or fixed — the thumb's `inset-inline-start`-based
positioning was already correctly RTL-aware pre-pass. The new `description`/
`error` slots use the same flexbox-column structure already established for
`Radio`, which sidesteps the Figma sample's own 64px-vs-48px (leading-vs-
trailing layout) padding asymmetry rather than replicating either literal
value — same resolution technique as Radio's own RTL description-indent
finding.

## 6. Scope

- Only `Switch.tsx`, `Switch.module.css`, `Switch.stories.tsx`,
  `Switch.test.tsx`, `scripts/generate-tokens.mjs` (additive Switch token
  block), and the `primitives/index.ts` barrel export were reviewed (no new
  exported type was needed — `SwitchProps` already existed and only gained
  new optional fields).
- `Checkbox.tsx`/`Checkbox.module.css`, `Radio.tsx`/`Radio.module.css`,
  `TextInput.tsx`, `Field.tsx`, and every other previously-Approved component
  are **unchanged** — confirmed via the full regression test suite (496/496
  passing, up from 486).
- `Switch` is consumed only by its own Storybook stories and tests
  (`grep`-verified) — this rebuild carries no external-breakage risk.

## 7. Required Code (this pass) — Status

1. ✅ `Switch.tsx` — kept the `<button role="switch">` architecture; added
   `description`, `errorText`, `trailing` props; preserved the full existing
   a11y contract and the hidden-input form-participation technique.
2. ✅ `Switch.module.css` — token-only, no hardcoded colors/spacing (verified:
   `lint:css`); the one pre-existing hardcoded value (`0.1875rem` thumb
   inset) replaced with a token.
3. ✅ `scripts/generate-tokens.mjs` — 22 new additive `--fads-sys-switch-*`
   tokens.
4. ✅ `Switch.stories.tsx` — Off, On, WithDescription, WithError, Disabled,
   DisabledOn, Trailing, RTL, OfficialFigmaReference (reproduces the live
   Switch Label example, leading/trailing/RTL).
5. ✅ `Switch.test.tsx` — 15 tests (up from 5): rendering, uncontrolled
   toggle, controlled toggle stability, Space toggle, Enter toggle (new),
   disabled guard, description/`aria-describedby`, error/`role="alert"`,
   hidden-input form participation, `trailing` DOM-order (both directions),
   RTL text rendering, and 3 axe scans (default, error+description, disabled).
6. ✅ No barrel export change needed beyond what already existed
   (`SwitchProps` already covers the new optional fields).

## 8. Validation

| Command | Result |
|---|---|
| `npm run typecheck` | ✅ Pass |
| `npm run lint` (eslint + `lint:css`) | ✅ Pass |
| `npm run format:check` | ✅ Pass |
| `npm test` | ✅ 496/496 tests pass (43 files), including 15 Switch tests (up from 5) |
| `npm run tokens:generate` | ✅ 599 tokens generated |
| `npm run tokens:validate` | ✅ Pass |
| `npm run tokens:check-coverage` | ✅ Defined: 646, Referenced: 546, Missing: 0 |
| `npm run build` | ✅ Pass |
| `npm run build-storybook` | ✅ Pass |

## 9. Approval

All of: live node (Switch + Switch Label), all 3 governing variant axes
(rtl/state/on), variables, RTL behavior, accessibility, tests, and every
validation command above have been verified — recorded in
`figma-component-map.json` and `docs/COMPONENT_APPROVAL_MATRIX.md`. Five
Needs-Confirmation items remain non-blocking (spec §11): Default/Disabled
exact colors (raster assets, extended by disclosed analogy), unused thumb-
icon tokens present in the Figma variable set with no visible glyph, the
checked-focus-ring's universal-black-vs-mood-color asymmetry (implemented
exactly as sampled), the description/error indent asymmetry (sidestepped via
layout), and the error-row icon↔text gap's leading-vs-trailing asymmetry
(implemented uniformly at 16px).
