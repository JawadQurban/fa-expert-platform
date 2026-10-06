# Visual Compliance — ButtonClose

Compares the new FADS `ButtonClose` primitive against the official Platforms
Code Button-Close component (see `docs/FIGMA_BUTTON_CLOSE_SPECIFICATION.md`,
node `2763:420129` in file `J0xq7JG3JKshRDzrgAM7E0`). Registry status was
`Missing` before this pass — no prior implementation existed.

---

## 1. Live Verification

A single `get_design_context` call returned the full 32-variant matrix
(`size`[x Small/Small/Medium/Large] × `state`[Default/Hovered/Pressed/
Focused] × `onColor`[false/true]) with no truncation — the only component in
this batch so far where the entire variant set resolved in one call.
`get_variable_defs` returned 9 named Figma variables (icon colors, radius,
neutral/transparent button-background hover/pressed pairs, black/white
border colors) — see spec §3 for the full table.

## 2. Implementation Summary

New primitive `ButtonClose` (`frontend/src/design-system/primitives/ButtonClose/`):

- `size`: `'xs' | 'sm' | 'md' | 'lg'` (default `'xs'`, matching the Figma
  component's own default variant) — controls both box and icon dimension.
- `onColor`: boolean — switches to the transparent-white hover/pressed fill
  and white icon/focus-ring, for use on a dark/colored surface.
- `label`: required accessible name (icon-only control, same contract as
  `InputPrefixSuffix`).
- `state` is **not** a prop — Hovered/Pressed/Focused are real
  `:hover`/`:active`/`:focus-visible` pseudo-classes, consistent with every
  other FADS interactive primitive in this batch.
- Icon: `cancel-01` (see spec §4 for the substitution rationale — the live
  node's own `multiplication-sign` icon has no directly-named registry
  equivalent, and `cancel-01` was inspected and confirmed to be the
  identical plain "×" glyph).

## 3. Token Changes

15 new additive `--fads-sys-buttonclose-*` tokens (icon colors ×2,
hover/pressed backgrounds ×4, focus-ring colors ×2, box sizes ×4, icon sizes
×3 — Small and Medium share one icon-size token, matching the live-verified
shared 20px value). Corner radius and the 2px focus-border width reuse the
already-shared generic `--fads-sys-radius-sm`/`--fads-sys-border-width-thick`
tokens directly (confirmed identical values, not reinvented). No tokens
removed.

## 4. Storybook Coverage

XSmall (default), Small, Medium, Large, OnColor, Disabled,
**OfficialFigmaReference** (all 4 sizes on both the default and a
dark/colored surface) — 7 stories (new component).

## 5. Accessibility

- Required `label` prop drives `aria-label` (icon-only control).
- Real `<button>` — native keyboard operability, no ARIA role needed.
- Focused state is a real, visible 2px solid border (not a background-only
  cue or an outline), live-verified and structurally distinct from
  Hovered/Pressed.
- `disabled` supported (native attribute) even though no `Disabled` variant
  exists in the live Figma set (see spec §7.2) — no invented visual beyond
  `cursor: not-allowed` and suppressed hover/press feedback.

## 6. Scope — Not Refactoring Existing Ad-Hoc Consumers

`Modal.tsx` and the shared `NoticeBody.tsx` (used by `Toast`/`Notification`)
each already render their own independent "×" dismiss button, built ad hoc
in earlier sessions against **unverified** generic tokens — not this live
node. Composing this new, now-verified primitive into those three
already-Approved composites would be a legitimate future consolidation (the
same category of move as this batch's own component 5, which extracted
`InputPrefixSuffix` from `NumberInput`'s ad-hoc stepper and refactored
`NumberInput` to compose it). It is **not done in this pass**: those
composites are already `Approved` components in their own right, and this
batch's strict one-component-per-session rule scopes this session to
`Button-Close` alone. Disclosed here as a real, actionable gap rather than a
silent omission — not a blocking issue for this component's own approval.

## 7. Validation

| Command | Result |
|---|---|
| `npm run typecheck` | ✅ Pass |
| `npm run lint` (eslint + `lint:css`) | ✅ Pass |
| `npm run format:check` | ✅ Pass (after `prettier --write` on the regenerated `tokens.css`) |
| `npm test` | ✅ 558/558 tests, 47 files — 13 new in `ButtonClose.test.tsx` |
| `npm run tokens:generate` | ✅ 628 tokens generated |
| `npm run tokens:validate` | ✅ Pass |
| `npm run tokens:check-coverage` | ✅ Defined: 675, Referenced: 575, Missing: 0 |
| `npm run build` | ✅ Pass |
| `npm run build-storybook` | ✅ Pass |

## 8. Files

- `frontend/src/design-system/primitives/ButtonClose/ButtonClose.tsx` — new.
- `frontend/src/design-system/primitives/ButtonClose/ButtonClose.module.css` — new.
- `frontend/src/design-system/primitives/ButtonClose/ButtonClose.stories.tsx` — new (7 stories).
- `frontend/src/design-system/primitives/ButtonClose/ButtonClose.test.tsx` — new (13 tests).
- `frontend/src/design-system/primitives/index.ts` — added `ButtonClose` barrel export.
- `frontend/scripts/generate-tokens.mjs` — new additive Button-Close token block (15 tokens).
- `docs/FIGMA_BUTTON_CLOSE_SPECIFICATION.md` — new.
- `frontend/src/design-system/registry/figma-component-map.json` — Button-Close row updated from `Missing` to `Approved`/resolved.

`Modal.tsx`, `Toast.tsx`, `NoticeBody.tsx`, and every previously-Approved
component are unchanged — confirmed via the full regression suite
(558/558, up from 545 before this pass).

## 9. Approval

Live node verified in a single, un-truncated call across the full 32-variant
matrix, every token live-mapped (or reused from an already-shared generic
token, confirmed identical), one disclosed icon substitution, zero
regressions, Storybook/tests/validation all pass.
