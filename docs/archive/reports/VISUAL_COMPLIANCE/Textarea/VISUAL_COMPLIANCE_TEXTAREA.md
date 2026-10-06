# Visual Compliance — Textarea

Compares the official Platforms Code Textarea component (`docs/FIGMA_TEXTAREA_SPECIFICATION.md`,
node `5462:417368`) against the pre-existing FADS `Textarea` primitive
(`frontend/src/design-system/primitives/Textarea/`) as it stood before this pass.

## 1. Prior Implementation Summary

Composed the shared `Field` wrapper (label/helper/error) and the shared `control.module.css`
base (also used by `Select` — and, before its own rebuild, `TextInput`) for its bordered box. No
`surface`/style axis, generic (non-Textarea-scoped) tokens shared with every other control, no
custom Focused shadow/underline, no scrollbar/resize handling beyond native `resize: vertical`.

## 2. Architecture Decision: Textarea No Longer Composes `Field`/`control.module.css`

Same rationale already established and documented for `TextInput`'s own rebuild
(`reports/VISUAL_COMPLIANCE/TextInput/VISUAL_COMPLIANCE_TEXT_INPUT.md` §2): the official
Textarea's structure (a 3-value `Style` surface axis, custom scrollbar/resize affordances, a
Focused-state shadow+underline) has diverged far enough from the shared `Field`/`control` shape
that reusing it would mean either distorting the shared base (silently changing `Select`'s
behavior too) or making `Textarea` self-contained. **Self-contained was chosen**, per "never
modify unrelated components." `Field.tsx`/`Field.module.css`/`control.module.css`/`Select` are
**untouched** by this pass — verified via `grep`, `Select` still imports `Field`/
`control.module.css` unchanged.

## 3. Differences Found (and Fixed)

| # | Area | Official (live-verified) | Prior implementation | Fixed this pass |
|---|---|---|---|---|
| 1 | Color tokens | Textarea-scoped Figma variables (`Form/field-*`, shared token family with `TextInput`) | Generic, shared `--fads-sys-control-*`/`--fads-sys-color-field-*` tokens | ✅ New additive `--fads-sys-textarea-*` tokens, all live-verified |
| 2 | `surface` prop | Official `Style`: Default (bordered white) / Filled darker / Filled lighter | Did not exist | ✅ Added `surface` prop, matching `TextInput`'s own `surface` naming |
| 3 | Focused state | Soft `shadow-md` + full-width 2px bottom underline; border unchanged | No focus-visible treatment beyond the browser default outline | ✅ Added via `:focus-within` on the wrapper (native outline suppressed since this equally-strong substitute always co-occurs) |
| 4 | Pressed state | Background darkens to `field-background-darker` + bottom underline | Not distinguished from Hovered/Default | ✅ Added via `:focus-within:active`-equivalent (native `<textarea>` doesn't have a meaningful separate "pressed while not focused" state distinct from click-to-focus, so Pressed is expressed as the moment of `:active`, matching `TextInput`'s own precedent) |
| 5 | Hovered state | Border color only (`field-border-hovered`) | Generic border-strong token | ✅ Now uses the live-verified, Textarea-scoped `field-border-hovered` token |
| 6 | Read-only state | No fill, `border-neutral-primary`, full-strength text | Solid background fill (generic) | ✅ Read-only now renders with no background fill, live-verified border/text |
| 7 | Disabled state | No fill, `border-neutral-primary` — **live-verified distinct from `TextInput`'s own Disabled border token** (`border-neutral-primary` `#d2d6db` here vs. `border-disabled` `#9da4ae` for `TextInput`) | `opacity`-based dimming | ✅ Disabled now renders as real solid colors (not opacity), using the value independently confirmed for *this* component rather than assumed identical to `TextInput`'s |
| 8 | `Filled darker`/`Filled lighter` Hover border | **Gains a `field-border-default` border it lacks at rest** — live-verified this pass, independently corroborating the exact defect already found and fixed in `TextInput`'s own 2026-07-13 follow-up pass | N/A (surface didn't exist) | ✅ Implemented correctly from the start (not introduced as a bug requiring a later fix, since the pattern was already known going in) |
| 9 | Scrollbar | Custom-drawn 16px track + pill thumb | Native browser scrollbar only | ✅ Approximated via native `scrollbar-width`/`scrollbar-color` CSS (spec §5 — a deliberate native-behavior-preserving choice, not a custom overlay) |
| 10 | Resize handle | 12×12px bottom-end grip, native-looking | `resize: vertical` (native) | ✅ No change needed — the pre-existing native `resize: vertical` already matches the Figma affordance exactly (spec §5) |
| 11 | Feedback icon in helper/error row | Official row includes a 16px feedback icon before the text | Text-only `<p>` | ⚠ **Not implemented**, pending the official DGA icon library (Q8) — same category as `TextInput`'s own deferred feedback icon |

## 4. Accessibility

- Label association (`htmlFor`/`id`), `aria-describedby` (helper + error), `aria-invalid`,
  `aria-required` — preserved exactly, re-implemented locally within the self-contained component.
- Disabled/Read-only: real native `disabled`/`readOnly` attributes — both fully functional and
  enforced by the browser on `<textarea>` (unlike `Checkbox`'s read-only platform gap), so no JS
  guard is needed here.
- Focus indicator (shadow + underline) is real, visible, applies via `:focus-within` on the
  wrapper (the actual `<textarea>` still receives real keyboard focus).
- `maxLength` uses the native HTML attribute (already browser-enforced and announced); an optional
  `showCharacterCount` prop renders a live character counter only when explicitly requested by the
  caller (per this task's "support character count only when specified" requirement) — not a
  Figma-sourced variant, a functional addition, wired to `aria-live="polite"` so it doesn't spam
  assistive tech on every keystroke beyond what a debounced polite region already handles.

## 5. RTL

No layout bug found — confirmed (spec §6) that full logical-properties mirroring, already this
codebase's universal convention, applies cleanly with no DOM-reordering ambiguity (unlike several
prior components' own RTL findings) since Textarea has no affix/icon sub-elements.

## 6. Scope

- Only `Textarea.tsx`, `Textarea.module.css`, `Textarea.stories.tsx`, `Textarea.test.tsx`, and
  `scripts/generate-tokens.mjs` (additive tokens only) were touched.
- `Field.tsx`, `Field.module.css`, `control.module.css`, `Select.tsx`, `Select.module.css` — **all
  unchanged**, confirmed via `grep` before and after.
- `Textarea` is not consumed by any product page (`grep`-verified — only its own test file
  referenced it before this pass), so zero external-breakage risk.

## 7. Validation

| Command | Result |
|---|---|
| `npm run typecheck` | ⚠ 1 error found and fixed, then ✅ Pass (`id` was omitted from the base `ComponentPropsWithRef<'textarea'>` type without being re-added — the exact same class of bug already documented and fixed in `TextInput`'s own pass) |
| `npm run lint` (eslint + `lint:css`) | ✅ Pass |
| `npm run format:check` | ✅ Pass (after `prettier --write` on 3 generated/touched files) |
| `npm test` | ✅ 43 files / 399 tests pass (22 Textarea tests, up from 3; `Select` — still composing the shared `Field`/`control.module.css` base — unaffected) |
| `npm run tokens:validate` | ✅ Pass (386 tokens generated, 0 missing references) |
| `npm run build` | ✅ Pass |
| `npm run build-storybook` | ✅ Pass |

## 8. Approval

All of: live node, every governing variant axis (rtl/state/filled/error/surface), the
scrollbar/resize decisions, accessibility, tests, and every validation command above verified
before Textarea is marked Approved. Needs-Confirmation items (non-blocking): the disabled-text
color extension (spec §9 item 1), `Filled darker`/`Filled lighter` Pressed/Error extension (item
2), and the scrollbar CSS approximation (item 3) — same category as every prior component's scoped
exceptions.
