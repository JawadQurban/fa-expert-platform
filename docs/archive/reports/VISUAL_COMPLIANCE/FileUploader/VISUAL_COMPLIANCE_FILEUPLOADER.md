# Visual Compliance — FileUploader (File Upload / Single + Multiple)

Compares the official Platforms Code File Upload components
(`docs/FIGMA_FILE_UPLOAD_SPECIFICATION.md`, nodes `30146:37020` Single / `30146:37007` Multiple)
against the pre-existing FADS `FileUploader` composite
(`frontend/src/design-system/composite/FileUploader/`) as it stood before this pass.

## 1. Prior Implementation Summary

Always rendered one dashed drop-zone box (generic `--fads-sys-color-*` tokens) regardless of a
`multiple` prop, with a `Browse` button (composing `Button`, already correct) and a file-status
list. Registry note (pre-pass): "Merged with File Upload / Single into one FileUploader(multiple)
component... Batch 03 will confirm whether the two Figma variants are visually distinct enough to
warrant splitting" — this pass answers that: yes, distinct chrome, not distinct components (see
spec §1).

## 2. Differences Found (and Fixed)

| # | Area | Official (live-verified) | Prior implementation | Fixed this pass |
|---|---|---|---|---|
| 1 | Single vs. Multiple chrome | Single = label + helper + solid **dark** `Button`, no drop-zone box at all; Multiple = drop-zone (icon + heading + caption + **secondary** `Button`) + file list | Always rendered the drop-zone box, regardless of variant | ✅ Added `variant` prop (`'single' \| 'multiple'`, default `'multiple'`) switching the chrome to match each official variant exactly |
| 2 | Browse button styling | Composes the already-Approved `Button` — dark/neutral variant (Single) vs. secondary/neutral-solid (Multiple) | Composed `Button` with a hardcoded `variant="secondary"` regardless | ✅ Now passes the correct `Button` variant per `variant` |
| 3 | Drop-zone tokens | `Background/background-neutral-100`, `border-dashed` `Border/border-neutral-primary`, `radius-sm` | Generic `--fads-sys-color-background-subtle`/`--fads-sys-color-border-default`/`--fads-sys-radius-md` | ✅ New additive `--fads-sys-fileupload-*` tokens, live-verified |
| 4 | File-row structure | `_File`: bg `background-neutral-100`, border `border-neutral-primary` (→ `border-error` red on error), status icon + name + close, **plus a separate bordered error-message row** below on error | A single row; error rendered inline as a `role="alert"` span inside the status column, no separate message row | ✅ Rebuilt to match: error status now renders the additional bordered message row, matching the live structure |
| 5 | Error message color | `Text/text-error-primary` `#ce281c` — live-verified **distinct** from this design system's usual `#b42318` error red | Used the generic `--fads-sys-color-status-error` token | ✅ New token sourced independently at the live-verified value, flagged (spec §4 item 2) rather than assumed identical |
| 6 | Disabled state | Solid `background-disabled` button fill + `text-default-disabled` text (not opacity) | `opacity: var(--fads-sys-opacity-disabled)` on the whole dropzone | ✅ Real solid colors, matching every other approved component's disabled pattern |

## 3. Accessibility

- Preserved from the prior pass (already correct, re-verified against Figma's own
  `Button-Close`/`multiplication-sign` sub-parts): hidden native `<input type="file">` triggered by
  a visible `Browse Files` button (WCAG 2.5.7 click/keyboard alternative — drag-and-drop is never
  the only way to select a file), `aria-live="polite"` file-status list (a real `<ul>`, no role
  override), per-file error as `role="alert"`.
- New: the error-message row is now a distinct, visually bordered region matching Figma, still
  associated via the same `role="alert"` on the message text.
- Repeated selection of the same file: the hidden input's `value` is reset after each `onChange`
  (already correct pre-pass, confirmed unchanged) so selecting the identical file twice in a row
  still fires a change event.

## 4. RTL

No layout bug — logical properties throughout (already the case pre-pass), confirmed against both
variants' `RTL=True` samples (structure identical, only text alignment/icon-mirroring differs,
already handled by existing `dir="auto"` usage).

## 5. Scope

- Only `FileUploader.tsx`, `FileUploader.module.css`, `FileUploader.stories.tsx`,
  `FileUploader.test.tsx`, and `scripts/generate-tokens.mjs` (additive tokens only) were touched.
- `Button.tsx`/`Button.module.css` — **unchanged**; `FileUploader` composes it, doesn't modify it.
- `FileUploader` is not consumed by any product page (`grep`-verified), so zero external-breakage
  risk. **Breaking change, disclosed:** the default rendering for existing callers changes from
  "always drop-zone chrome" to "drop-zone chrome only when `variant='multiple'`" — since
  `variant` defaults to `'multiple'` (matching the prior always-drop-zone behavior), this is
  non-breaking for any caller that didn't pass a variant.

## 6. Validation

| Command | Result |
|---|---|
| `npm run typecheck` | ✅ Pass |
| `npm run lint` (eslint + `lint:css`) | ✅ Pass |
| `npm run format:check` | ✅ Pass (after `prettier --write` on 5 generated/touched files) |
| `npm test` | ✅ 43 files / 432 tests pass (19 FileUploader tests, up from 7) |
| `npm run tokens:validate` | ✅ Pass (430 tokens generated, 0 missing references) |
| `npm run build` | ✅ Pass |
| `npm run build-storybook` | ✅ Pass |

## 7. Approval

All of: both live nodes, the Single/Multiple chrome distinction, the file-row/error-row
structure, accessibility, tests, and every validation command above verified before FileUploader
is marked Approved. Needs-Confirmation items (non-blocking, spec §4): whether Single genuinely
lacks drag-and-drop capability or just its chrome, the `text-error-primary` color discrepancy, and
the approximated drop-zone/status icons pending the DGA icon library.
