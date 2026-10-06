# Visual Compliance — FloatingButton

Compares the new FADS `FloatingButton` primitive against the official
Platforms Code Floating Button component (see
`docs/FIGMA_FLOATING_BUTTON_SPECIFICATION.md`, node `19488:124656` in file
`J0xq7JG3JKshRDzrgAM7E0`). Registry status was `Missing` before this pass —
no prior implementation existed.

---

## 1. Live Verification

The component set is unusually large (700+ variant instances). A single
`get_metadata`/`get_design_context` call on the root returned only a sparse
symbol list, so representative variants were sampled individually across
every governing axis: `style`[Primary-Neutral/Primary-Brand/
Secondary-Solid] × `size`[Small/Large] × `Icon only`[True/False] ×
`On color`[No/Yes] × `state`[Default/Hovered/Pressed/Selected/Focused/
Disabled] × `rtl`[False/True]. `get_variable_defs` on the root returned the
full token set in one call.

## 2. The Key Finding: Token-Identical to `Button`

Every color variable returned by `get_variable_defs` for Floating Button
(`button-background-black-*`, `button-background-primary-*`,
`button-background-neutral-*`, `button-background-oncolor-*`,
`text-oncolor-primary`, `background-disabled`, `icon-default-disabled`) is
**byte-identical** to the values already sourced for the already-Approved
`Button` primitive's `neutral`/`primary`/`secondarySolid` variants and
`onColor` modifier — confirmed by direct comparison against
`Button.module.css`'s own token sources. This validates the registry's own
`dependencies: ["Button"]` entry. As a result, `FloatingButton` reuses
`Button`'s own `--fads-sys-button-*` tokens directly for every color,
typography, disabled, and focus-ring value — **zero new color tokens**.

## 3. Implementation Summary

New primitive `FloatingButton`:

- `variant`: `'neutral' | 'primary' | 'secondarySolid'` (default `'neutral'`,
  matching the Figma component's own default style), reusing `Button`'s own
  background-color tokens per variant.
- `size`: `'sm' | 'lg'` (56px/64px), driven by 2 new padding tokens (the
  only genuinely new geometry this component needed).
- `onColor`: full-override white/oncolor treatment, same convention as
  `Button`'s own `onColor` modifier, reusing the same tokens.
- `selected`: sets `aria-pressed` + `data-selected`, using a **distinct**
  live-verified `-selected` background token — see §4, a real divergence
  from `Button`'s own Selected-state behavior.
- `icon` (required `ReactNode`) + optional `children` (visible label) —
  icon-only renders a true circle, a label renders a pill (still
  `radius-full`).
- Same icon-only accessible-name dev warning as `Button`.

## 4. A Real, Disclosed Divergence: `Selected`

`Button.module.css` documents that `Button`'s own `Selected` state
deliberately reuses the Pressed color rather than Figma's own distinct
`-selected` token. Independently live-verifying Floating Button's own
`Selected` state (node `19488:124967`) showed it **does** use the distinct
`button-background-black-selected` (`#384250`, different from Pressed's
`#4d5761`). This is why `FloatingButton` is a small, self-contained sibling
primitive that reuses `Button`'s tokens directly rather than literally
composing `<Button selected>` — composing `<Button>` here would have
silently applied the wrong Selected color. Same category of architecture
decision as `DatePicker`'s trigger reusing `TextInput`'s tokens without
literally nesting a `<TextInput>`.

## 5. Token Changes

3 new additive `--fads-sys-floatingbutton-*` tokens (padding-sm, padding-lg,
gap) — pure geometry, since every color is reused from `Button`. Icon size
also reuses `Button`'s own `--fads-sys-button-icon-size-lg` directly (both
Floating Button sizes use a fixed 24px icon, live-verified identical to
`Button`'s Large icon size). No tokens removed.

## 6. Storybook Coverage

Neutral, Primary, SecondarySolid, WithLabel, Large, Selected, Disabled,
OnColor, **OfficialFigmaReference** (every style × both sizes, icon-only and
labelled) — 9 stories (new component).

## 7. Accessibility

- Required `icon` prop; accessible name comes from `children` (visible
  label) or `aria-label`/`aria-labelledby` — same dev-time warning pattern
  as `Button`.
- `selected` exposed via `aria-pressed` (toggle-button pattern), matching
  `Button`'s own convention.
- Focus state reuses `Button`'s own live-verified double-ring treatment
  exactly (2px dark inner ring + 3px light outer ring, offset).

## 8. RTL

No RTL-specific code added — relies on the same natural bidi/logical-flow
mirroring `Button` already uses (no fixed `flex-direction`, under the app's
default `dir="rtl"`), rather than literally reproducing Figma's own
hand-placed RTL layer reordering. See spec §6.

## 9. Validation

| Command | Result |
|---|---|
| `npm run typecheck` | ✅ Pass |
| `npm run lint` (eslint + `lint:css`) | ✅ Pass |
| `npm run format:check` | ✅ Pass (after `prettier --write` on the new story file and regenerated `tokens.css`) |
| `npm test` | ✅ 576/576 tests, 48 files — 18 new in `FloatingButton.test.tsx` |
| `npm run tokens:generate` | ✅ 631 tokens generated |
| `npm run tokens:validate` | ✅ Pass |
| `npm run tokens:check-coverage` | ✅ Defined: 678, Referenced: 582, Missing: 0 |
| `npm run build` | ✅ Pass |
| `npm run build-storybook` | ✅ Pass |

## 10. Scope

- New files: `FloatingButton.tsx`, `FloatingButton.module.css`,
  `FloatingButton.stories.tsx`, `FloatingButton.test.tsx`.
- `frontend/src/design-system/primitives/index.ts` — added barrel export.
- `frontend/scripts/generate-tokens.mjs` — new additive Floating Button
  token block (3 tokens).
- `Button.tsx`/`Button.module.css` and every other previously-Approved
  component are **unchanged** — `FloatingButton` reuses `Button`'s tokens,
  not its code, so nothing about `Button` itself needed to change.
- Confirmed via the full regression suite (576/576, up from 558).

## 11. Approval

Live-sampled across every governing variant axis (style/size/icon-only/
on-color/state/rtl), the color-token identity with `Button` independently
confirmed via `get_variable_defs`, one genuine and disclosed divergence
found and correctly implemented (`Selected`'s distinct token), zero new
color tokens, Storybook/tests/validation all pass. One Needs-Confirmation
item (no shadow found in any sampled node, despite the "floating" name) is
non-blocking and explicitly not invented around.
