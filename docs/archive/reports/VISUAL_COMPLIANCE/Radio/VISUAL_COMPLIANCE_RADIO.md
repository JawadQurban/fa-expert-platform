# Visual Compliance — Radio / Radio Label

Compares the official Platforms Code Radio component (see
`docs/FIGMA_RADIO_SPECIFICATION.md`, node `30195:23385` in file
`J0xq7JG3JKshRDzrgAM7E0`) against the FADS `Radio`/`RadioGroup` primitive as it
stood before this pass (`frontend/src/design-system/primitives/Radio/Radio.tsx`
/ `Radio.module.css`, both pre-existing — Radio was already `Implemented` per
`figma-component-map.json`, "built pre-workflow" per its own header comment:
"⚠ Visual fidelity Pending final DGA token values (Q3/Q20)", never through the
Visual Compliance Workflow before this pass).

---

## 1. Prior Implementation Summary

Before this pass, `Radio` was a **bare native `<input type="radio">`** styled
only via `accent-color: var(--fads-sys-selection-color-checked)` (a generic,
un-scoped, un-verified token resolving to `--fads-sys-color-primary`
`#25935f` — genuinely different from the live-verified `control-primary-checked`
`#1b8354`). No custom box/ring/dot visuals, no `size` (Radio never had one),
no `mood`/style prop, no `readOnly`, no `description` slot, no dedicated
`--fads-sys-radio-*` token family (borrowed generic `--fads-sys-selection-size`
`1.25rem`/20px — vs. the live-verified 24px ring — and
`--fads-sys-opacity-disabled` for Disabled, an opacity trick rather than solid
colors). 3 Storybook stories, 4 tests. No `docs/FIGMA_RADIO_SPECIFICATION.md`
or `reports/VISUAL_COMPLIANCE/Radio/` existed.

## 2. Architecture Decision: Hidden Native Input + Decorative Box (Checkbox Precedent)

`Checkbox` (CMP-17, Approved 2026-07-13) was already rebuilt from an
equivalent bare-native starting point into a visually-hidden, fully-interactive
native input + a decorative sibling `<span>` rendering the DGA-specified
visuals via CSS state selectors. Radio has the exact same class of problem
(native OS-rendered radio dots can't be arbitrarily recolored per mood/state,
can't show a 48px ripple, can't show a 2px focus ring around a 32px hit box) —
so the identical architecture was applied: a real `<input type="radio">`
(`position:absolute; inset:0; opacity:0`, still fully focusable/keyboard/AT-
interactive) plus a decorative `.visual`/`.dot` sibling styled via
`:checked`/`:hover`/`:active`/`:focus-visible`/`:disabled`/`[data-readonly]`.

## 3. Differences Found (and Fixed)

| # | Area | Official (live-verified) | Prior implementation | Fixed this pass |
|---|---|---|---|---|
| 1 | Visual architecture | Custom ring + inner dot, ripple, focus ring, per-mood colors | Bare native `<input>`, `accent-color` tint only | ✅ Hidden-input + decorative-box architecture (Checkbox precedent) |
| 2 | Ring/dot size | 24px ring, 32px hit target | `--fads-sys-selection-size` = 20px (generic, wrong size) | ✅ New `fads-sys-radio-size` (24px) / `fads-sys-radio-hit-size` (32px) tokens |
| 3 | Checked color | `control-primary-checked` `#1b8354` (Primary) / `control-neutral-checked` `#0d121c` (Neutral) | `accent-color` resolving to `#25935f` (generic primary, no Neutral option at all) | ✅ 12 new `fads-sys-radio-{primary,neutral}-{checked,hovered,pressed,focused}` tokens; new `mood` prop |
| 4 | Hover/Pressed | Ripple (48px, `control-ripple-effect`) + pressed-unchecked gray fill (`control-pressed`) + per-mood dot shade change | Not distinguished at all (native OS hover, if any) | ✅ Implemented via `:hover`/`:active` on the hidden input |
| 5 | Focused | Real 2px `border-black` outline around the full 32px hit box; ring/dot color never changes | Native browser default outline only | ✅ `outline` via `:focus-visible`, `outline-offset: 4px`; new `fads-sys-radio-focus-ring` token |
| 6 | Disabled | Uniform solid gray dot (`Global/control-disabled` `#9da4ae`) regardless of mood, border-only ring | `opacity: var(--fads-sys-opacity-disabled)` (dimming trick) | ✅ Solid colors, not opacity — matches Checkbox/Button/Card's established pattern; new `fads-sys-radio-bg-disabled` token |
| 7 | Read-only | Border-only ring (same as Disabled), checked dot **keeps** its full mood color (unlike Disabled) | Did not exist as a concept — native `readonly` has no effect on radios and was never guarded | ✅ New `readOnly` prop on `RadioGroup`, JS-guarded (see §4), `data-readonly` styling |
| 8 | Label text color | `text-display` `#1f2a37` (Radio Label node) | Generic `--fads-sys-color-text-default` `#161616` — a genuinely different, unverified color | ✅ New `fads-sys-radio-label-text` token, live-verified via `Light.Text.text-display` |
| 9 | Description/helper text | `text-primary-paragraph` `#384250` | Did not exist as a slot | ✅ New `description` prop on `Radio` (mirrors Checkbox's own), new `fads-sys-radio-description-text` token |
| 10 | Group error row | `text-error` `#b42318` + a 16px `FeedbackIcon` ("alert-circle") | Plain `role="alert"` text, no icon, generic (unverified) `--fads-sys-color-status-error` `#f04438` | ✅ New `fads-sys-radio-error-text`/`fads-sys-radio-error-gap` tokens; **real `alert-circle` icon now rendered** (`@ds` `Icon` primitive — this icon was unavailable when TextInput's own equivalent helper/error icon was deferred pending Q8; it exists now, so Radio implements it directly rather than re-deferring) |
| 11 | `mood`/`style` prop | Official `Style`: `Primary` (default) / `Neutral` | Did not exist | ✅ Added `mood` prop on both `RadioGroup` (applies to every child) and `Radio` (per-item override) |

## 4. `readOnly` — a Real jsdom-Environment Gap Found and Fixed

Following the exact `Checkbox` technique (`preventDefault` on click/Space)
was **insufficient** for grouped radios in this project's test environment:
clicking a different, previously-unchecked radio in the same `name` group
still fired the native `change` event and toggled the DOM `checked` state,
even with `preventDefault()` called synchronously inside the `onClick`
handler — unlike a standalone checkbox's simple on/off toggle, a radio
group's "check this one, uncheck every sibling" activation behavior was not
reliably cancellable this way in this environment. **Fixed** by adding an
authoritative guard *inside* `onChange` itself (skip calling
`group.onValueChange` and the consumer's own `onChange` when `readOnly`) —
this is correct regardless of the click-level quirk, because for **controlled**
usage (`value`, not `defaultValue`) React re-pins `checked` to the unchanged
prop on every render regardless of any transient native DOM toggle. `readOnly`
groups are documented as requiring controlled usage for this reason (see the
`Radio.tsx` module doc and the corresponding test).

## 5. Accessibility

- `role="radio"`/`aria-checked`, `<fieldset><legend>` group semantics, and
  arrow-key roving navigation are all native-browser behavior, unchanged and
  re-verified working.
- A real eslint-plugin-jsx-a11y finding: `aria-readonly` is **not** a
  supported property for the implicit `radio` role (unlike `checkbox`) —
  caught by `jsx-a11y/role-supports-aria-props` during this pass and
  correctly **not** added (documented in `Radio.tsx`, §7 of the spec).
- New `description` prop wired to `aria-describedby`, same pattern as every
  other FADS form primitive.
- Focus indicator (2px outline, 4px offset) is real, visible, and
  non-color-reliant.
- Disabled: solid colors (not opacity), native `disabled` cascade via
  `<fieldset disabled>`, unchanged and re-verified.

## 6. RTL

No layout bug found or fixed. The description/label are stacked in a single
flexbox column indented as a unit by the Radio's own width+gap, sidestepping
the Figma sample's own 40px-vs-48px LTR/RTL padding asymmetry (spec §9) rather
than replicating either literal value — flagged for confirmation, non-blocking.

## 7. Scope

- Only `Radio.tsx`, `Radio.module.css`, `Radio.stories.tsx`, `Radio.test.tsx`,
  `scripts/generate-tokens.mjs` (additive Radio token block), and the
  `primitives/index.ts` barrel export were touched.
- `Checkbox.tsx`/`Checkbox.module.css`, `Field.tsx`, `TextInput.tsx`, and every
  other previously-Approved component are **unchanged** — confirmed via the
  full regression test suite (486/486 passing, up from 475).
- `Radio`/`RadioGroup` are consumed only by their own Storybook stories and
  tests (`grep`-verified) — this rebuild carries no external-breakage risk to
  any product page.

## 8. Required Code (this pass) — Status

1. ✅ `Radio.tsx` — hidden-input + decorative-box architecture; added `mood`,
   `description`, `readOnly` (on `RadioGroup`) props; real `alert-circle`
   icon in the group error row; preserved the full existing a11y contract.
2. ✅ `Radio.module.css` — token-only, no hardcoded colors/spacing (verified:
   `lint:css`).
3. ✅ `scripts/generate-tokens.mjs` — 24 new additive `--fads-sys-radio-*`
   tokens.
4. ✅ `Radio.stories.tsx` — Group, WithDescription, Moods, WithError,
   ReadOnly, Disabled, RTL, OfficialFigmaReference (reproduces the live
   Radio Label example in both LTR and RTL).
5. ✅ `Radio.test.tsx` — 15 tests (up from 4): rendering, uncontrolled
   selection, controlled selection stability, keyboard arrow-key navigation,
   description/`aria-describedby`, group error, disabled cascade, read-only
   (controlled) guard, `mood` (group-level and per-Radio override), RTL
   text rendering, and 3 axe scans (default, error+description, disabled).
6. ✅ Exported from `primitives/index.ts` (`RadioMood` type added alongside
   the existing `RadioProps`/`RadioGroupProps`).

## 9. Validation

| Command | Result |
|---|---|
| `npm run typecheck` | ✅ Pass |
| `npm run lint` (eslint + `lint:css`) | ⚠ 1 real finding (`aria-readonly` unsupported on `role="radio"`), fixed, then ✅ Pass |
| `npm run format:check` | ✅ Pass |
| `npm test` | ✅ 486/486 tests pass (43 files), including 15 Radio tests (up from 4) |
| `npm run tokens:generate` | ✅ 577 tokens generated |
| `npm run tokens:validate` | ✅ Pass |
| `npm run tokens:check-coverage` | ✅ Defined: 627, Referenced: 528, Missing: 0 |
| `npm run build` | ✅ Pass |
| `npm run build-storybook` | ✅ Pass |

**Bug found and fixed during `npm test`:** the click/Space-level `readOnly`
guard (copied verbatim from `Checkbox`) did not reliably block the native
change event for a **grouped** radio in this test environment — see §4.
Fixed with an authoritative `onChange`-level guard; documented as requiring
controlled usage.

## 10. Approval

All of: live node (Radio + Radio Label), all 3 governing variant axes
(state/style/selected), variables, RTL behavior, accessibility, tests, and
every validation command above have been verified — recorded in
`figma-component-map.json` and `docs/COMPONENT_APPROVAL_MATRIX.md`. Five
Needs-Confirmation items remain non-blocking (spec §11): checked-dot exact
shape/color (no inline vector data available), Read-only checked color,
`hitboxFocusRing` (not implemented, defaults off), the RTL description-indent
asymmetry (sidestepped via layout, not replicated), and the per-option vs.
group-level error interpretation — same category as prior components'
scoped exceptions (Button's Destructive/OnColor restriction, TextInput's RTL
affix-anchoring ambiguity, Checkbox's Read-only icon-tone reasoning).
