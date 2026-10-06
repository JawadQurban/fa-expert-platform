# Visual Compliance — Checkbox

Compares the official Platforms Code Checkbox component (`docs/FIGMA_CHECKBOX_SPECIFICATION.md`,
node `30186:53826`) against the pre-existing FADS `Checkbox` primitive
(`frontend/src/design-system/primitives/Checkbox/`) as it stood before this pass.

## 1. Prior Implementation Summary

A bare native `<input type="checkbox">` styled only via `accent-color: var(--fads-sys-selection-
color-checked)` and native OS/browser rendering for everything else (box shape, border, radius,
checkmark, hover, pressed, focus). No `size` prop, no `mood`/style prop, no `errorText`/invalid
support, no read-only support, no visible custom focus treatment beyond the browser default.

## 2. Differences Found (and Fixed)

| # | Area | Official (live-verified) | Prior implementation | Fixed this pass |
|---|---|---|---|---|
| 1 | Visual box | Custom 2px-radius square, bordered when unchecked, filled green (Primary) when checked, with a checkmark/dash icon | Native OS checkbox rendering (`accent-color` tint only) — shape/radius/border entirely OS-dependent, not DGA-specified at all | ✅ Rebuilt as a visually-hidden native `<input>` (kept for all real semantics/interaction) + a decorative custom-drawn sibling box driven by `:checked`/`:indeterminate`/`:hover`/`:active`/`:focus-visible`/`:disabled` |
| 2 | `size` | 3 official sizes: Medium (24px), Small (20px), x Small (16px) | No size prop — one fixed `--fads-sys-selection-size` | ✅ Added `size` prop (`'md' \| 'sm' \| 'xs'`, default `'md'`) |
| 3 | `mood`/style | 2 official color roles: Primary (green), Neutral (near-black) | No such axis | ✅ Added `mood` prop (`'primary' \| 'neutral'`, default `'primary'`), matching this codebase's `Link.mood` naming convention |
| 4 | Hover | A ripple/interaction-circle appears around the box; box itself unchanged when unchecked | No custom hover treatment (native browser default only) | ✅ Added the ripple circle (`::before`, radius-full, `control-ripple-effect` token) |
| 5 | Pressed | Unchecked→fills gray (`control-pressed`); Checked→darker fill (`control-{mood}-pressed`) | Not distinguished from Hovered/Default at all | ✅ Added via `:active` |
| 6 | Focused | 2px ring (`border-black`) offset outside the box, `mix-blend-mode: multiply` | Browser default outline only | ✅ Added via `:focus-visible` + `outline`/`outline-offset`; native outline suppressed since this equally-strong substitute always co-occurs |
| 7 | Read-only | Border-only, no fill, even when checked — visually and semantically distinct from Disabled | Did not exist as a state at all | ✅ Added `readOnly` prop; since the native `readonly` attribute has no enforced effect on checkboxes (browser platform gap, spec §5), implemented with a `preventDefault` guard on click/Space + `aria-readonly` |
| 8 | Disabled | Solid `background-disabled` fill (not opacity-dimming) | `opacity: var(--fads-sys-opacity-disabled)` | ✅ Disabled now uses real solid colors, matching every other approved component's disabled pattern |
| 9 | Checkmark/indeterminate icon | Two distinct icon glyphs (check vs. dash), white on filled backgrounds | N/A (native OS checkmark only) | ✅ Added as inline SVG (exact vector path not extractable — spec §3 Needs Confirmation, approximated as a standard checkmark/dash) |
| 10 | `errorText`/invalid | No official Figma variant exists (spec §2) | Did not exist | ✅ Added `errorText`/`aria-invalid` anyway — a functional a11y requirement independent of Figma's visual variant set (task Phase C), does not change the checkbox's own colors since Figma defines none for this axis |

## 3. Accessibility

- Real native `<input type="checkbox">` retained for all semantics — `checked`/`indeterminate`
  (DOM property, applied via ref) /`disabled`/`required` all native, form-submittable, exposed to
  AT correctly, Space-key toggle free from the browser.
- Label click-to-toggle: native `<label htmlFor>` association (unchanged from prior pass).
- `readOnly`: `aria-readonly` + interaction guard (§2 row 7) — focusable and announced, not
  togglable, distinct from `disabled` (which is excluded from the tab order).
- New `errorText` wired through the same `aria-describedby`/`aria-invalid`/`role="alert"` contract
  every other FADS form primitive (`TextInput`, `Textarea`, `Select`) already uses.
- Focus ring is real, visible, non-color-reliant (spec §5).
- Target size: Medium (24px) meets WCAG 2.5.8 (24×24 CSS px minimum) as-is; `sm`/`xs` are smaller
  than the 24px AA minimum — flagged, not silently shipped: callers should default to `size="md"`
  in any touch-primary context, `sm`/`xs` are for dense desktop layouts (same "smaller sizes trade
  target-size for density" tradeoff already accepted for `Tag`'s `xs`/`sm` sizes and `Button`'s
  `sm` size in this codebase).

## 4. RTL

No layout bug — the box is square/symmetric and the label sits after it in DOM order; layout
already used `display: flex` (direction-agnostic) with no physical `left`/`right` properties.
Verified via a new RTL story/test.

## 5. Scope

- Only `Checkbox.tsx`, `Checkbox.module.css`, `Checkbox.stories.tsx`, `Checkbox.test.tsx`, and
  `scripts/generate-tokens.mjs` (additive tokens only) were touched.
- `Radio`/`Switch` share some of the same generic `--fads-sys-selection-*`/`--fads-sys-control-*`
  tokens Checkbox used to consume — this pass does not remove or repoint those shared tokens
  (Checkbox now uses its own new `--fads-sys-checkbox-*` tokens instead), confirmed via `grep`
  that `Radio.module.css`/`Switch.module.css` are unchanged and still resolve correctly.
- `Checkbox` is not yet consumed by any product page (`grep`-verified), so zero external-breakage
  risk.

## 6. Validation

| Command | Result |
|---|---|
| `npm run typecheck` | ✅ Pass |
| `npm run lint` (eslint + `lint:css`) | ✅ Pass (2 test-file type-safety findings fixed: unsafe `any` member access on a mock's event arg, an unnecessary type assertion) |
| `npm run format:check` | ✅ Pass (after `prettier --write` on 4 touched/generated files) |
| `npm test` | ✅ 43 files / 380 tests pass (25 Checkbox tests, up from 4; `Radio`/`Switch` — sharers of the generic `--fads-sys-selection-*`/`--fads-sys-control-gap` tokens — both still pass unaffected) |
| `npm run tokens:validate` | ✅ Pass (360 tokens generated, 0 missing references) |
| `npm run build` | ✅ Pass |
| `npm run build-storybook` | ✅ Pass |

## 7. Approval

All of: live node, every governing variant axis (checked/indeterminate, state, size, mood),
accessibility, tests, and every validation command above verified before Checkbox is marked
Approved. Needs-Confirmation items (non-blocking): checkmark/indeterminate icon vector shape and
the Read-only icon color (spec §3) — same category as every prior component's icon-pipeline gaps.
