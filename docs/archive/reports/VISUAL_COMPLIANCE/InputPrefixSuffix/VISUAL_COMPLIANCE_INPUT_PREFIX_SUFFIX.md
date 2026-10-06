# Visual Compliance — InputPrefixSuffix

Compares the official Platforms Code Input Prefix-Suffix component (see
`docs/FIGMA_INPUT_PREFIX_SUFFIX_SPECIFICATION.md`, node `30150:60916` in file
`J0xq7JG3JKshRDzrgAM7E0`) against the FADS `InputPrefixSuffix` primitive built
this pass — it did not exist as its own component before (its markup existed
only ad-hoc, inline inside `NumberInput`'s stepper buttons from the previous
Batch 3 pass).

---

## 1. Prior State and the Discovery That Changed the Plan

Before this pass, no `InputPrefixSuffix` file/component existed. The
increment/decrement buttons built into `NumberInput` (previous session) were
a minimal, ad-hoc `<button>` with a flat `background: transparent` and no
distinct Hovered/Pressed/Selected/Focused treatment beyond a generic
`:focus-visible` outline.

Live Figma verification of the registry's own stored node (`30150:60916`,
"Input Prefix-Suffix") revealed this is **not** a generic "Text Input with
icon affixes" demo, but the exact icon-badge sub-component `NumberInput`'s
buttons already instantiate — confirmed by directly matching the Figma node
IDs referenced inside `NumberInput`'s own sampled `prefix`/`suffix` markup
against this component set's own `Type=Plus`/`Type=Minus` `Default`-state
cells. It also has a materially richer state model than the ad-hoc button
had: `Hovered`/`Pressed` background changes, a `Selected` toggle state, and a
real 4px solid focus border (not an outline).

Given the registry lists "Input Prefix-Suffix" as its own numbered Batch 3
component, and per this project's "reuse existing approved components
wherever possible" rule, the correct action was to **extract** this into its
own reusable primitive and have `NumberInput` compose it — not maintain two
divergent implementations of the same visual element.

## 2. Differences Found (and Fixed)

| # | Area | Official (live-verified) | Prior ad-hoc `NumberInput` button | Fixed this pass |
|---|---|---|---|---|
| 1 | Component identity | A separate, independently-versioned sub-component (48 variants: type × state × style × size) | Anonymous inline JSX inside `NumberInput.tsx` | ✅ Extracted to its own `InputPrefixSuffix` primitive |
| 2 | Default background | `button-background-neutral-default` `#f3f4f6` (Solid) / transparent (Subtle) | Always transparent (relied entirely on the parent `TextInput` affix's own static background) | ✅ New `variant` prop (`solid`/`subtle`), own background per state |
| 3 | Hovered | Background stays `#f3f4f6` (Solid) — but also for **Subtle**, live-verified, not backgroundless | No hover treatment at all | ✅ `:hover` rules for both variants |
| 4 | Pressed | `button-background-neutral-pressed` `#e5e7eb`, both variants | No pressed treatment at all | ✅ `:active` rules for both variants |
| 5 | Selected | `button-background-black-selected` `#384250` + inverted `icon-oncolor` `#ffffff`, regardless of variant | Did not exist | ✅ New `selected` prop, `aria-pressed` |
| 6 | Focused | A real 4px solid `border-black` `#161616` border (not an outline) | Generic 2px `outline` | ✅ Rebuilt as an actual `border`, matching the live weight/style exactly |
| 7 | Disabled | Solid gets `background-disabled` `#e5e7eb`; Subtle stays transparent; icon mutes to `icon-default-disabled` `#9da4ae` | Native `:disabled` cursor only, no color change | ✅ Per-variant disabled backgrounds + icon tint |
| 8 | Icon size | 24px Large / 20px Medium | Fixed 24px regardless of `NumberInput`'s own `size` | ✅ `size` prop drives icon dimension (inline `style` override for the 20px Medium case, since no existing `Icon` size preset matches 20px exactly) |

## 3. Accessibility

- Required `label` prop (accessible name) — icon-only control, no Figma-
  sourced default text exists.
- `selected` exposed via `aria-pressed` (WAI-ARIA toggle-button pattern).
- Real, visible 4px focus border, structurally distinct from any hover/press
  state (never conflated).
- `disabled` correctly suppresses `onClick` (native `<button disabled>`
  semantics — no custom guard needed, unlike `Radio`/`Checkbox`'s
  `readOnly`, since a disabled native button already can't fire click
  events).

## 4. RTL

None required — see spec §7. No layout bug to find or fix; the glyph itself
has no directionality.

## 5. Scope

- New files: `InputPrefixSuffix.tsx`, `InputPrefixSuffix.module.css`,
  `InputPrefixSuffix.stories.tsx`, `InputPrefixSuffix.test.tsx`, plus a
  barrel-export addition in `primitives/index.ts`.
- `NumberInput.tsx` was **updated** (not left ad-hoc) to compose the new
  primitive for both its increment and decrement buttons, and its own
  `NumberInput.module.css` was deleted (no longer needed — the `.stepper`
  class it held is now superseded by `InputPrefixSuffix`'s own styling).
  `NumberInput`'s public API (`NumberInputProps`) is unchanged — this is an
  internal implementation swap, not a breaking change. All 21 pre-existing
  `NumberInput` tests still pass unmodified.
- `TextInput.tsx`, `Radio.tsx`, `Switch.tsx`, and every other previously-
  Approved component are unchanged — confirmed via the full regression
  suite (527/527 passing, up from 517).

## 6. Required Code (this pass) — Status

1. ✅ `InputPrefixSuffix.tsx` — new primitive; `icon`/`size`/`variant`/`selected`/`label` props.
2. ✅ `InputPrefixSuffix.module.css` — token-only, no hardcoded colors/spacing (verified: `lint:css`).
3. ✅ `scripts/generate-tokens.mjs` — 8 new additive `--fads-sys-inputaffix-*` tokens.
4. ✅ `InputPrefixSuffix.stories.tsx` — Plus, Minus, Subtle, Selected, Disabled, DisabledSubtle, Medium, OfficialFigmaReference (all 48 combinations grouped by type × style, plus Selected/Disabled call-outs).
5. ✅ `InputPrefixSuffix.test.tsx` — 10 tests: rendering, click, `size`/`variant` data attributes, `selected`/`aria-pressed`, disabled guard, 2 axe scans.
6. ✅ `NumberInput.tsx` refactored to compose it; `NumberInput.module.css` deleted (superseded).
7. ✅ Exported from `primitives/index.ts` (`InputPrefixSuffixProps`/`InputPrefixSuffixIcon`/`InputPrefixSuffixSize`/`InputPrefixSuffixVariant`).

## 7. Validation

| Command | Result |
|---|---|
| `npm run typecheck` | ✅ Pass |
| `npm run lint` (eslint + `lint:css`) | ✅ Pass |
| `npm run format:check` | ✅ Pass |
| `npm test` | ✅ 527/527 tests pass (45 files), including 10 new `InputPrefixSuffix.test.tsx` tests; all 21 pre-existing `NumberInput` tests still pass unmodified after the refactor |
| `npm run tokens:generate` | ✅ 608 tokens generated |
| `npm run tokens:validate` | ✅ Pass |
| `npm run tokens:check-coverage` | ✅ Defined: 655, Referenced: 555, Missing: 0 |
| `npm run build` | ✅ Pass |
| `npm run build-storybook` | ✅ Pass |

## 8. Approval

Live node verified (all 48 variants sampled in one call), the "this is
actually Number Input's own stepper button" discovery confirmed and acted
on (extraction, not duplication), accessibility contract verified, tests/
Storybook/validation all pass. One Needs-Confirmation item remains
non-blocking (spec §9): the `add-01`/`remove-01` icon substitution for the
live node's `plus-sign`/`minus-sign` (already disclosed once for Number
Input; the same substitution, not a new one).
