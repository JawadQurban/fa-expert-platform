# Batch 3 — Form Controls & Input Family

**Status: COMPLETE.** Per `CLAUDE.md`'s one-component-per-session rule, and the
user's explicit choice (2026-07-13) to run this batch **strictly one component at a
time** rather than override that rule, this report was built as a **living
document**, updated after each component completed its full Visual Compliance
Workflow and received explicit user go-ahead to continue. All 14 scoped
components are now Approved — see §14 (Final Component Matrix).

Scope (registry-ordered): Text Input, Label, Radio, Radio Label, Switch, Switch
Label, Number Input, Input Prefix-Suffix, Date Picker, Button-Close, Floating
Button, Trailing Icon, Dropdown List Item, Search Box.

---

## 1. Executive Summary

- **Component 1 (Text Input / Label):** already fully implemented and Approved
  from a prior pass; re-verified live, zero code changes, only stale registry
  bookkeeping corrected.
- **Component 2 (Radio / Radio Label):** a genuine rebuild — Radio was a bare
  native `<input type="radio">` with no prior Figma spec/compliance work.
  Rebuilt using the Checkbox precedent (hidden native input + decorative box),
  added `mood`/`description`/`readOnly`, found and fixed a real jsdom-specific
  read-only guard bug, and implemented the group error row's `alert-circle`
  icon (previously deferred elsewhere pending the icon library, which has
  since landed).
- **Component 3 (Switch / Switch Label):** a corrective pass, not a re-architecture —
  the existing `<button role="switch">` was already the correct pattern (no
  native HTML input type for a switch to hide), so it was kept and its
  geometry/colors corrected against live Figma data instead. Added
  `description`/`errorText` (closing a gap this project's own status doc had
  tracked as open technical debt) and a `trailing` prop for the official
  `trailSwitch` layout axis.

- **Component 4 (Number Input):** the first genuinely new component in this
  batch — registry status was `Missing`, zero prior code/spec/compliance
  work. Built as a thin composition over the already-Approved `TextInput`
  (per the batch's explicit "do not create another text input
  implementation" instruction) rather than a second input primitive; only
  the increment/decrement stepper buttons are new, dropped into
  `TextInput`'s existing `prefix`/`suffix` slots. Implements the WAI-ARIA APG
  Spinbutton pattern. Zero new design tokens.
- **Component 5 (Input Prefix-Suffix):** live verification of this registry
  entry's own stored node revealed it is the exact icon-badge sub-component
  `NumberInput`'s own increment/decrement buttons already instantiate
  (confirmed by matching Figma node IDs) — not a generic demo. Extracted
  from `NumberInput`'s ad-hoc inline JSX into its own reusable primitive and
  refactored `NumberInput` to compose it (public API unchanged, all 21 prior
  tests still pass). A genuine fidelity fix too: adds real Hovered/Pressed
  backgrounds, a Selected toggle state, and a proper 4px solid focus border
  the ad-hoc button never had.
- **Component 6 (Date Picker):** the one component in this batch with a
  unique brief — *"verify against live Figma, don't replace unless
  required."* Live verification found the gap was functional, not cosmetic
  (no Hijri calendar, no range mode, no quick options, no year dropdown), so
  the user was asked to scope the response and chose a full rebuild. Added
  native-`Intl`-based Hijri calendar support (`hijriCalendar.ts`, no external
  library), range selection, a quick-options preset sidebar, and a year
  dropdown, while deliberately keeping the trigger as a `<button>` (not a
  literal `<TextInput>`) to preserve its correct WAI-ARIA APG "Date Picker
  Dialog" semantics and all 13 pre-existing tests.
- **Component 7 (Button-Close):** the second genuinely new component in this
  batch — registry status was `Missing`, zero prior code/spec/compliance
  work. Live verification was unusually clean: the entire 32-variant matrix
  (`size` × `state` × `onColor`) resolved in a single un-truncated call. A
  small icon-only `<button>` requiring a `label` prop; `state` isn't a
  runtime prop, matching every other interactive primitive built in this
  batch. The live node's own icon is an internal Figma sub-component with no
  direct registry equivalent — resolved via direct SVG-path inspection
  (`cancel-01`, a disclosed substitute). 15 new tokens; deliberately not
  composed into `Modal`/`Toast`'s existing ad-hoc close buttons this pass
  (disclosed, out of scope for this component's own session).
- **Component 8 (Floating Button):** the third genuinely new component in
  this batch — registry status was `Missing`, zero prior code/spec/
  compliance work, and the largest variant set sampled so far (700+
  instances). `get_variable_defs` found its colors are byte-identical to
  the already-Approved `Button`'s own `neutral`/`primary`/`secondarySolid`
  variants, reused directly (zero new color tokens, only 3 new geometry
  tokens for its circular/pill sizing). Deliberately not a literal
  `<Button>` composition: its own `Selected` state was independently
  verified to use a distinct token, diverging from `Button`'s own
  documented Selected-reuses-Pressed behavior — composing `<Button
  selected>` would have silently applied the wrong color.
- **Component 9 (Trailing Icon):** the fourth genuinely new component in
  this batch — registry status was `Missing`, zero prior code/spec/
  compliance work, and the smallest variant set encountered so far (only
  `Open`[False/True]). A dedicated screenshot resolved a real structural
  ambiguity: the helper-text panel appears below the icon, beak pointing
  up, not above as the more common convention would suggest. Its panel
  tokens share the same Figma variable family as this project's own
  separate, not-yet-visually-verified `Tooltip` component — composing
  `<Tooltip>` would have shipped the wrong (dark-inverse) visual, so a
  small, accurately-verified light panel was built instead, reusing only
  `Tooltip`'s interaction pattern. The live sample's default icon
  (`mic-01`) isn't in the FADS icon registry at all (a disclosed gap, not
  a substitution) — `icon` itself stays fully generic.
- **Component 10 (Dropdown List Item):** registry status was `Missing`, but
  live verification confirmed this exact node is already named "Dropdown
  List Item sub-component" in `Select`'s own spec — a confirmed match, same
  category as component 5. `Select.tsx` was refactored to compose the new
  primitive for its option/group rows, fixing two real, independently
  verified bugs found in the process (option hover background and row
  padding/gap were both wrong). The live `Focused` state turned out not to
  be native DOM focus (exposed as a consumer-driven `active` prop instead),
  and Multi Select's checkbox reuses `Checkbox`'s own byte-identical tokens
  without literally composing it (label type-scale mismatch). All 26 of
  `Select`'s pre-existing tests pass unmodified.
- **Component 11 (Search Box, final component in this batch):** registry
  status was `Missing`, flagged `blocked` pending Q10 (site-wide search
  product scope). Live verification showed this is a plain reusable
  input-field primitive — governed by the same axes as `TextInput`, with no
  results-page structure baked in — so the user was presented with the
  finding and explicitly chose to build it now, since Q10 gates a separate
  product decision, not this component's own fidelity. Field chrome is
  byte-identical to `TextInput`'s own tokens (reused directly, only 1 new
  token needed). Not a literal `<TextInput>` composition: the trailing slot
  sits in an un-badged row (unlike `TextInput`'s own backgrounded `suffix`)
  and turned out to be a confirmed `TrailingIcon` instance via node-ID match.

No regressions found in any pass. 609/609 tests pass repo-wide as of
component 11 (up from 432 before Batch 3 started) — **Batch 3 is complete.**

---

## 2. Component 1 — Text Input / Label

### 2.1 Figma Verification

**Text Input**

| | |
|---|---|
| Figma file | `J0xq7JG3JKshRDzrgAM7E0` |
| Node ID | `30150:130250` (component-set root) |
| Variants | 288 (`rtl` × `state`[6] × `filled`[2] × `error`[2] × `size`[2] × `style`[3]) |
| Verification method | Live Figma MCP (`get_design_context`, `get_variable_defs`, `get_screenshot`) |
| Nodes sampled | `30150:130251` (Default/Large/Filled/Default-style baseline), `30150:130571` (Focused), `30150:130804` (Disabled), `30150:130700` (Read-only), `30150:130277` (Error), `30150:130342` (RTL), `30150:130355` (Hovered), `30150:130459` (Pressed), `30150:130908` (Medium/Default), `30150:131563` (Filled darker), `30150:132875` (Filled lighter), `30150:130264` (Filled=False/placeholder) — 12 nodes |
| Result | Zero discrepancies vs. the existing `docs/FIGMA_TEXT_INPUT_SPECIFICATION.md` / `reports/VISUAL_COMPLIANCE/TextInput/VISUAL_COMPLIANCE_TEXT_INPUT.md` |

**Label** — Node `30150:134187` (Text Input sub-component). Sampled as an
embedded sub-component in every Text Input `get_design_context` call above.
Matches spec §3 exactly.

### 2.2 Issues Found

None — re-verification of already-Approved work, not a first-time implementation.

### 2.3 Implementation Summary

No code changes. Existing self-contained `TextInput` (`size`, `surface`,
`iconStart`, `prefix`, `suffix` props; native `:hover`/`:active`/`:focus-within`
states; `Label` covered internally) confirmed correct as-is.

### 2.4 Token Changes

None. All 42 `--fads-sys-textinput-*` tokens re-confirmed live-accurate.

### 2.5 Storybook Coverage

Unchanged — 11 existing stories reviewed, not modified.

### 2.6 Accessibility Improvements

None needed — existing contract confirmed correct via full test re-run.

### 2.7 Validation Results

| Command | Result |
|---|---|
| `npm run typecheck` | ✅ Pass |
| `npm run lint` (eslint + `lint:css`) | ✅ Pass |
| `npm run format:check` | ✅ Pass |
| `npm test` | ✅ 475/475 tests, 43 files |
| `npm run tokens:validate` | ✅ Pass (607 defined, 511 referenced, 0 missing) |
| `npm run build` | ✅ Pass |
| `npm run build-storybook` | ✅ Pass |

### 2.8 Files Modified

- `frontend/src/design-system/registry/figma-component-map.json` — Text Input/Label rows corrected from stale `Implemented`/`pending` to `Approved`/`resolved`.
- `docs/COMPONENT_APPROVAL_MATRIX.md` — re-verification note appended (status unchanged, already `✅ Approved`).
- `docs/PROJECT_STATUS.md` — Batch 3 kickoff status line added.

No component source, test, Storybook, or token-generator files were touched for this component.

### 2.9 Remaining Risks (carried from prior pass, non-blocking)

1. Large-size Default-state value-text color uses `field-text-filled` rather than the literal (likely stale) `field-text-focused` token on that one node — implemented to match the Medium-size sample and the token's own name.
2. RTL icon/prefix/suffix anchoring ambiguity — implemented as full logical-properties mirroring.
3. Feedback icon in the helper/error row not implemented, pending the DGA icon library (Q8 — since resolved for Radio, see §3.9; not revisited for TextInput itself in this batch).
4. No headless-browser screenshot tool available to pixel-diff rendered Storybook against Figma.

---

## 3. Component 2 — Radio / Radio Label

### 3.1 Figma Verification

**Radio**

| | |
|---|---|
| Figma file | `J0xq7JG3JKshRDzrgAM7E0` |
| Node ID | `30195:23385` (component-set root) |
| Variants | 24 (`state`[6] × `style`[2: Primary/Neutral] × `selected`[2]) |
| Verification method | Live Figma MCP (`get_design_context`, `get_variable_defs`) — the entire 24-variant set was returned in a single `get_design_context` call (small enough to avoid the sparse-metadata fallback) |
| Result | No prior Figma verification existed at all — first-time visual compliance pass |

**Radio Label** — Node `30195:23490` (composed real-world example: Radio +
label + optional helper text + optional error row with a `FeedbackIcon`).
Sampled directly via its own `get_design_context` call.

### 3.2 Issues Found

**Visual:**
- Ring/dot size was 20px (generic `--fads-sys-selection-size` token) vs. the live-verified 24px.
- Checked color used a generic primary token (`#25935f`) vs. the live-verified `control-primary-checked` (`#1b8354`); no Neutral mood existed at all.
- No Hover/Pressed/Focused visual distinction existed (native browser default only).
- Disabled used an opacity trick instead of the live-verified solid uniform gray.
- Label text color used the generic `text-default` (`#161616`) vs. the live-verified `text-display` (`#1f2a37`) — a real, confirmed color difference.

**Behaviour:**
- No `readOnly` concept existed at all (native `readonly` has no effect on radios).
- A real jsdom-environment bug: the `Checkbox`-style click-level `preventDefault` guard did not reliably block a grouped radio's native activation behavior (see §3.3).

**Accessibility:**
- A real `eslint-plugin-jsx-a11y` finding: `aria-readonly` is not a supported property for the WAI-ARIA `radio` role (unlike `checkbox`) — caught and correctly not added.

**Tokens:**
- No dedicated `--fads-sys-radio-*` token family existed; borrowed mismatched generic tokens throughout (see §3.4).

**Storybook / Tests:**
- Only 3 stories and 4 tests existed, with no mood/description/readOnly/RTL/OfficialFigmaReference coverage.

### 3.3 A Real Bug Found and Fixed: `readOnly` Guard for Grouped Radios

Copying `Checkbox`'s exact `preventDefault`-on-click/Space technique was
insufficient: clicking a different, previously-unchecked radio in the same
`name` group still fired the native `change` event and toggled the DOM
`checked` state in this test environment, unlike a standalone checkbox's
simple on/off toggle. **Fixed** by adding an authoritative guard inside
`onChange` itself. `readOnly` groups are now documented as requiring
**controlled** usage (`value`, not `defaultValue`) — for controlled inputs,
React re-pins `checked` to the unchanged prop on every render regardless of
any transient native DOM toggle a click may otherwise cause.

### 3.4 Implementation Summary

Rebuilt `Radio`/`RadioGroup` using the same hidden-native-input +
decorative-box architecture already established for `Checkbox`:

- `RadioGroup` gained `mood` (`'primary' | 'neutral'`, applies to every child) and `readOnly` props.
- `Radio` gained `mood` (per-item override, falls back to the group's mood, then `'primary'`) and `description` props.
- A real `<input type="radio">` is visually hidden (`position:absolute; inset:0; opacity:0`) but fully focusable/interactive; a decorative `.visual`/`.dot` sibling renders the ring/dot/ripple/focus-ring visuals via CSS state selectors.
- Group error row now renders the real `alert-circle` icon (`@ds` `Icon` primitive) alongside the error text.

### 3.5 Token Changes

24 new additive `--fads-sys-radio-*` tokens: `hit-size`, `size`,
`border-default`, `border-readonly`, `bg-pressed-unchecked`, `bg-disabled`,
`ripple`, `focus-ring`, `primary-{checked,hovered,pressed,focused}`,
`neutral-{checked,hovered,pressed,focused}`, `label-text`,
`description-text`, `error-text`, `error-gap`. Several values are numerically
identical to existing `--fads-sys-checkbox-*` tokens (both read the same
underlying Figma `Light.Controls.*` variables) — minted as a separate family
per this codebase's established per-component-token convention, not
duplicated by oversight. No tokens removed.

### 3.6 Storybook Coverage

`Group`, `WithDescription`, `Moods`, `WithError`, `ReadOnly`, `Disabled`,
`RTL`, `OfficialFigmaReference` (reproduces the live Radio Label example,
LTR and RTL) — 8 stories, up from 3.

### 3.7 Accessibility Improvements

- New `description` prop wired to `aria-describedby`.
- Real, visible `:focus-visible` outline (2px, 4px offset) replacing the native browser default.
- `aria-readonly` correctly omitted (WAI-ARIA `radio` role doesn't support it) — a real lint finding, not an oversight.
- Disabled uses solid colors (not opacity), matching the established pattern.

### 3.8 Validation Results

| Command | Result |
|---|---|
| `npm run typecheck` | ✅ Pass |
| `npm run lint` (eslint + `lint:css`) | ⚠ 1 real finding (`aria-readonly` unsupported on `role="radio"`), fixed, then ✅ Pass |
| `npm run format:check` | ✅ Pass |
| `npm test` | ✅ 486/486 tests, 43 files (15 in `Radio.test.tsx`, up from 4) |
| `npm run tokens:generate` | ✅ 577 tokens generated |
| `npm run tokens:validate` | ✅ Pass |
| `npm run tokens:check-coverage` | ✅ Defined: 627, Referenced: 528, Missing: 0 |
| `npm run build` | ✅ Pass |
| `npm run build-storybook` | ✅ Pass |

### 3.9 Files Modified

- `frontend/src/design-system/primitives/Radio/Radio.tsx` — rebuilt.
- `frontend/src/design-system/primitives/Radio/Radio.module.css` — rebuilt.
- `frontend/src/design-system/primitives/Radio/Radio.stories.tsx` — rebuilt (8 stories).
- `frontend/src/design-system/primitives/Radio/Radio.test.tsx` — rebuilt (15 tests).
- `frontend/scripts/generate-tokens.mjs` — new additive Radio token block (24 tokens).
- `frontend/src/design-system/primitives/index.ts` — added `RadioMood` type export.
- `docs/FIGMA_RADIO_SPECIFICATION.md` — new.
- `reports/VISUAL_COMPLIANCE/Radio/VISUAL_COMPLIANCE_RADIO.md` — new.
- `frontend/src/design-system/registry/figma-component-map.json` — Radio/Radio Label rows corrected to `Approved`/`resolved`.
- `docs/COMPONENT_APPROVAL_MATRIX.md` — new Radio row added.
- `docs/PROJECT_STATUS.md` — Batch 3 component 2 status line added.

`Checkbox.tsx`/`Checkbox.module.css`, `TextInput.tsx`, `Field.tsx`, and every
other previously-Approved component are unchanged — confirmed via the full
regression suite. `Radio`/`RadioGroup` are consumed only by their own stories
and tests — zero external-breakage risk.

### 3.10 Remaining Risks (non-blocking)

1. Checked-dot exact shape/color — reconstructed from live-verified color tokens as a 50%-sized inner circle; the official asset was an opaque raster/vector image, not inline path data, and the downloaded asset URLs expired before pixel inspection.
2. Read-only-checked color — implemented as unchanged from Default's checked color (full mood color retained); not independently pixel-verified against the live asset.
3. `Radio Label`'s `hitboxFocusRing` property — not implemented (defaults off in the sample, not shown in the reference screenshot).
4. RTL description-indent asymmetry (the Figma sample used 48px LTR vs. 40px RTL padding) — sidestepped via flexbox layout structure rather than replicating either literal value.
5. Group-level (not per-option) error interpretation of `Radio Label`'s `alertMessage` slot — a deliberate, disclosed interpretation with no precedent for per-option errors elsewhere in this design system.

---

## 4. Component 3 — Switch / Switch Label

### 4.1 Figma Verification

**Switch**

| | |
|---|---|
| Figma file | `J0xq7JG3JKshRDzrgAM7E0` |
| Node ID | `30150:69895` (component-set root) |
| Variants | 20 (`rtl`[2] × `state`[5: Default/Hovered/Pressed/Focused/Disabled] × `on`[2]) |
| Verification method | Live Figma MCP (`get_design_context`, `get_variable_defs`, `get_screenshot`) — the entire 20-variant set was returned in a single `get_design_context` call |
| Result | No prior Figma verification existed at all — first-time visual compliance pass |

**Switch Label** — Node `30150:69998` (composed real-world example: Switch +
label + optional helper text + optional error row, plus an independent
`trailSwitch` layout axis). Sampled directly via its own `get_design_context`
call.

### 4.2 Issues Found

**Visual:**
- Track was 44×24px vs. the live-verified 48×24px.
- Thumb was 18px vs. the live-verified 16px; thumb inset was a hardcoded `0.1875rem` (3px) vs. the live-verified 4px.
- Checked-fill color used a generic, unverified token instead of the live-verified `control-primary-checked` (`#1b8354`).
- Unchecked border used one static generic token instead of the live-verified per-state colors (Default/Hovered/Pressed/Focused each distinct).
- No Hover/Pressed ripple halo existed.
- No real keyboard-focus ring existed (native browser default outline only) — the live component uses a distinct rectangular overlay, separate from the ripple.
- Disabled used an opacity trick instead of the live-verified solid colors.
- Thumb had no background/shadow tokens at all (generic background token, no shadow).
- Label text color used the generic `text-default` instead of the live-verified `text-display`.

**Behaviour:**
- No `description`/`errorText` props existed — a gap explicitly named in this project's own technical-debt list ("Checkbox/Switch error-state support").
- No `trailing` layout option existed, despite `trailSwitch` being a real, independently-verified official Figma axis.

**Tokens:**
- No dedicated `--fads-sys-switch-*` color/geometry token family existed for most values; the one dedicated geometry token family that did exist (`--fads-sys-switch-track-*`/`-thumb-size`) held the wrong (unverified) values.

**Storybook / Tests:**
- Only 4 stories and 5 tests existed, with no description/error/trailing/RTL/OfficialFigmaReference coverage; only Space (not Enter) was tested for keyboard activation.

### 4.3 Implementation Summary

Unlike Radio, **the existing `<button role="switch">` architecture was kept
unchanged** — there is no native HTML input type for a switch, so a real
button carrying `role="switch"`/`aria-checked` is itself the WAI-ARIA
APG-recommended pattern, not a shortcut needing replacement. Changes:

- Corrected all geometry tokens (48×24 track, 16px thumb, 4px inset).
- Corrected all color tokens against the live-verified palette, per-state.
- Added a Hover/Pressed ripple halo (`::before` pseudo-element, `mix-blend-multiply`).
- Added a real, distinct rectangular keyboard-focus ring (`::after` pseudo-element) — structurally separate from the ripple, matching the live Figma distinction (unchecked ring reuses its own border color; checked ring uses a universal black, not the mood color).
- Added `description` and `errorText` props (mirrors Checkbox/Radio's own pattern), including a real `alert-circle` icon in the error row.
- Added a `trailing` prop mapping to the official `trailSwitch` axis.

### 4.4 Token Changes

22 new additive `--fads-sys-switch-*` tokens: `track-inline`, `track-block`,
`thumb-size`, `thumb-inset`, `border-{default,hovered,pressed,disabled}`,
`focus-ring-{off,on,radius}`, `bg-checked-{,hovered,pressed,disabled}`,
`ripple`, `thumb-bg`, `thumb-shadow`, `label-text`, `description-text`,
`error-text`, `error-gap`. Several color values are numerically identical to
existing `--fads-sys-checkbox-*`/`--fads-sys-radio-*` tokens (all three read
overlapping `Light.Controls.*` Figma variables) — minted as a separate family
per this codebase's established per-component-token convention. No tokens
removed; the pre-existing `--fads-sys-switch-track-inline`/`-track-block`/
`-thumb-size` tokens were corrected in place (wrong values, not wrong names).

### 4.5 Storybook Coverage

`Off`, `On`, `WithDescription`, `WithError`, `Disabled`, `DisabledOn`,
`Trailing`, `RTL`, `OfficialFigmaReference` (reproduces the live Switch Label
example, leading/trailing/RTL) — 9 stories, up from 4.

### 4.6 Accessibility Improvements

- New `description`/`errorText` wired to `aria-describedby`/`aria-invalid`/`role="alert"` — closes the tracked "Checkbox/Switch error-state support" gap for Switch's half (Checkbox's half was closed earlier this cycle).
- Real, visible, structurally-distinct keyboard-focus ring (separate pseudo-element from the hover/press ripple, not conflated).
- Added an explicit Enter-key activation test (only Space was previously tested).

### 4.7 Validation Results

| Command | Result |
|---|---|
| `npm run typecheck` | ✅ Pass |
| `npm run lint` (eslint + `lint:css`) | ✅ Pass |
| `npm run format:check` | ✅ Pass |
| `npm test` | ✅ 496/496 tests, 43 files (15 in `Switch.test.tsx`, up from 5) |
| `npm run tokens:generate` | ✅ 599 tokens generated |
| `npm run tokens:validate` | ✅ Pass |
| `npm run tokens:check-coverage` | ✅ Defined: 646, Referenced: 546, Missing: 0 |
| `npm run build` | ✅ Pass |
| `npm run build-storybook` | ✅ Pass |

### 4.8 Files Modified

- `frontend/src/design-system/primitives/Switch/Switch.tsx` — corrected + extended (architecture kept).
- `frontend/src/design-system/primitives/Switch/Switch.module.css` — corrected + extended.
- `frontend/src/design-system/primitives/Switch/Switch.stories.tsx` — rebuilt (9 stories).
- `frontend/src/design-system/primitives/Switch/Switch.test.tsx` — rebuilt (15 tests).
- `frontend/scripts/generate-tokens.mjs` — new additive Switch token block (22 tokens).
- `docs/FIGMA_SWITCH_SPECIFICATION.md` — new.
- `reports/VISUAL_COMPLIANCE/Switch/VISUAL_COMPLIANCE_SWITCH.md` — new.
- `frontend/src/design-system/registry/figma-component-map.json` — Switch/Switch Label rows corrected to `Approved`/`resolved`.
- `docs/COMPONENT_APPROVAL_MATRIX.md` — new Switch row added.
- `docs/PROJECT_STATUS.md` — Batch 3 component 3 status line added.

No barrel export change was needed — `SwitchProps` already covers the new
optional fields. `Checkbox.tsx`, `Radio.tsx`, `TextInput.tsx`, `Field.tsx`,
and every other previously-Approved component are unchanged — confirmed via
the full regression suite. `Switch` is consumed only by its own stories and
tests — zero external-breakage risk.

### 4.9 Remaining Risks (non-blocking)

1. Default/Disabled exact colors — both states are opaque raster assets with no inspectable per-property variable bindings; extended by disclosed analogy with Checkbox/Radio's own identical Default-state token choice and the aggregated variable dictionary.
2. Thumb-icon tokens (`Control-icon-{hovered,pressed,disabled}`) exist in the sampled Figma variable set but no visible icon glyph was found in the screenshot at any tested zoom level — not implemented.
3. Checked-focus-ring uses a universal black color rather than the mood color, an asymmetry vs. the unchecked-focus-ring (which reuses its own border color) — implemented exactly as sampled, not normalized.
4. Description/error indent asymmetry (64px leading-switch vs. 48px trailing-switch layout) — sidestepped via flexbox structure, same technique as Radio's own RTL indent finding.
5. Error-row icon↔text gap asymmetry (16px leading vs. 8px trailing layout) — implemented uniformly at 16px.

---

## 5. Component 4 — Number Input

### 5.1 Figma Verification

| | |
|---|---|
| Figma file | `J0xq7JG3JKshRDzrgAM7E0` |
| Node ID | `30150:61013` (component-set root) |
| Variants | 288 (`rtl` × `state`[6] × `filled`[2] × `error`[2] × `size`[2] × `style`[3]) — identical governing axes to Text Input |
| Verification method | Live Figma MCP (`get_design_context`, `get_variable_defs`, `get_screenshot`) |
| Nodes sampled | `30150:61014` (Default/Large/Filled/Default-style baseline), `30150:61110` (Hovered), `30150:61527` (Disabled) — 3 nodes, confirming token-identical field chrome to Text Input's own already-verified matrix |
| Result | No prior Figma verification existed at all — first-time visual compliance pass. Every sampled color/spacing/typography token matched `TextInput`'s own values exactly. |

### 5.2 Issues Found

None in the traditional "existing implementation was wrong" sense — Number
Input never existed before this pass. The design work was determining the
correct composition strategy: confirming (via live sampling) that Number
Input shares Text Input's exact field chrome, so it could be built as a thin
wrapper rather than a duplicate input primitive.

### 5.3 Implementation Summary

New primitive `NumberInput` composing `TextInput`:
- Increment (`prefix` slot, leading edge) / decrement (`suffix` slot,
  trailing edge) icon-only buttons — matching the live node's exact
  leading/trailing order (not "corrected" to a conventional minus-left/
  plus-right layout).
- `add-01`/`remove-01` icons (disclosed substitutes for the live node's
  `plus-sign`/`minus-sign`, which have no exact registry match — verified
  visually equivalent at the raw-SVG level).
- WAI-ARIA APG Spinbutton pattern: `role="spinbutton"` +
  `aria-valuenow`/`aria-valuemin`/`aria-valuemax`, ArrowUp/ArrowDown
  keyboard stepping.
- Controlled/uncontrolled `value`/`defaultValue`/`onValueChange` API,
  mirroring `Switch`'s own established `checked`/`defaultChecked`/
  `onCheckedChange` pattern.
- Blur+step clamping to `min`/`max` (not on every keystroke, so typing a
  multi-digit value isn't fought mid-entry).

### 5.4 Token Changes

None. Every color, spacing, and typography value is inherited from
`TextInput` unchanged. The stepper buttons' own focus ring reuses two
pre-existing generic tokens (`--fads-sys-border-width-thick`,
`--fads-sys-color-border-focus`).

### 5.5 Storybook Coverage

`Default`, `WithDefaultValue`, `WithMinMax`, `WithStep`, `WithHelper`,
`WithError`, `ReadOnly`, `Disabled`, `Sizes`, `Controlled`, `RTL` — 11
stories (new component).

### 5.6 Accessibility Improvements

- `role="spinbutton"` + `aria-valuenow`/`aria-valuemin`/`aria-valuemax` (WAI-ARIA APG Spinbutton pattern).
- Icon-only stepper buttons require `incrementLabel`/`decrementLabel` accessible names.
- ArrowUp/ArrowDown keyboard stepping (APG baseline expectation).
- `disabled`/`readOnly` correctly suppress stepper buttons and keyboard stepping, not just direct typing.
- `helperText`/`errorText`/`requiredField` pass straight through to `TextInput`'s already-verified contract.

### 5.7 Validation Results

| Command | Result |
|---|---|
| `npm run typecheck` | ✅ Pass |
| `npm run lint` (eslint + `lint:css`) | ✅ Pass |
| `npm run format:check` | ✅ Pass |
| `npm test` | ✅ 517/517 tests, 44 files (21 in `NumberInput.test.tsx`, new) |
| `npm run tokens:generate` | ✅ 599 tokens generated (unchanged) |
| `npm run tokens:validate` | ✅ Pass |
| `npm run tokens:check-coverage` | ✅ Defined: 646, Referenced: 546, Missing: 0 (unchanged) |
| `npm run build` | ✅ Pass |
| `npm run build-storybook` | ✅ Pass |

### 5.8 Files Modified

- `frontend/src/design-system/primitives/NumberInput/NumberInput.tsx` — new.
- `frontend/src/design-system/primitives/NumberInput/NumberInput.module.css` — new.
- `frontend/src/design-system/primitives/NumberInput/NumberInput.stories.tsx` — new (11 stories).
- `frontend/src/design-system/primitives/NumberInput/NumberInput.test.tsx` — new (21 tests).
- `frontend/src/design-system/primitives/index.ts` — added `NumberInput`/`NumberInputProps` barrel export.
- `docs/FIGMA_NUMBER_INPUT_SPECIFICATION.md` — new.
- `reports/VISUAL_COMPLIANCE/NumberInput/VISUAL_COMPLIANCE_NUMBER_INPUT.md` — new.
- `frontend/src/design-system/registry/figma-component-map.json` — Number Input row updated from `Missing` to `Approved`/`resolved`.
- `docs/COMPONENT_APPROVAL_MATRIX.md` — new Number Input row added.
- `docs/PROJECT_STATUS.md` — Batch 3 component 4 status line added.

`TextInput.tsx`/`TextInput.module.css` and every other previously-Approved
component are unchanged — confirmed via the full regression suite.
`NumberInput` is consumed only by its own stories and tests — zero
external-breakage risk.

### 5.9 Remaining Risks (non-blocking)

1. Increment-left/decrement-right layout order — implemented exactly as sampled, not normalized to a more conventional order.
2. `add-01`/`remove-01` icon substitution for the live node's `plus-sign`/`minus-sign` — visually equivalent, disclosed, not an exact asset match.
3. RTL behavior extended by analogy from Text Input's own verified RTL mirroring, not independently re-sampled from a live RTL Number Input node.
4. Value-clamping UX (blur-time clamping) is a FADS-authored interaction choice — Figma shows no interaction model for out-of-range typed values, only the field's visual Error state.
5. Most of the 288-cell variant matrix extended by analogy from Text Input's own already-verified matrix rather than independently re-sampled cell-by-cell.

---

## 6. Component 5 — Input Prefix-Suffix

### 6.1 Figma Verification

| | |
|---|---|
| Figma file | `J0xq7JG3JKshRDzrgAM7E0` |
| Node ID | `30150:60916` (component-set root) |
| Variants | 48 (`type`[Plus/Minus] × `state`[6] × `style`[Solid/Subtle] × `size`[Large/Medium]) |
| Verification method | Live Figma MCP (`get_design_context`, `get_variable_defs`, `get_screenshot`) — the entire 48-variant set was returned in a single call |
| Result | This is the exact icon-badge sub-component `NumberInput`'s own increment/decrement buttons instantiate — confirmed by directly matching the Figma node IDs referenced inside `NumberInput`'s own sampled `prefix`/`suffix` markup against this component set's `Type=Plus`/`Type=Minus` `Default`-state cells. Not a generic "Text Input with icon affixes" demo. |

### 6.2 Issues Found

The prior ad-hoc button (inside `NumberInput`, previous session) lacked:
- Any Hovered/Pressed background feedback (relied entirely on the parent `TextInput` affix's static background).
- A `Selected` toggle state.
- A correctly-shaped focus indicator — the live node specifies a real 4px solid border, not an outline.
- Per-`size` icon dimension (always rendered at 24px regardless of the field's own `size`).

### 6.3 Implementation Summary

Extracted a new primitive, `InputPrefixSuffix`, with `icon` (`'plus' | 'minus'`),
`size` (`'lg' | 'md'`), `variant` (`'solid' | 'subtle'`), `selected`, and a
required `label` (accessible name). Refactored `NumberInput` to compose it for
both its increment and decrement buttons — `NumberInput`'s own public API
(`NumberInputProps`) is unchanged, and `NumberInput.module.css` (which only
held the now-superseded ad-hoc `.stepper` class) was deleted.

### 6.4 Token Changes

8 new additive `--fads-sys-inputaffix-*` tokens: `icon-default`,
`icon-oncolor`, `icon-disabled`, `bg-solid-default`, `bg-solid-hovered`,
`bg-solid-pressed`, `bg-selected`, `bg-disabled`, `focus-ring`. No tokens
removed.

### 6.5 Storybook Coverage

`Plus`, `Minus`, `Subtle`, `Selected`, `Disabled`, `DisabledSubtle`,
`Medium`, `OfficialFigmaReference` (all 48 combinations grouped by type ×
style, plus Selected/Disabled call-outs) — 8 stories (new component).

### 6.6 Accessibility Improvements

- Required `label` prop (icon-only control).
- `selected` exposed via `aria-pressed` (WAI-ARIA toggle-button pattern).
- Real, visible 4px focus border, structurally distinct from hover/press.

### 6.7 Validation Results

| Command | Result |
|---|---|
| `npm run typecheck` | ✅ Pass |
| `npm run lint` (eslint + `lint:css`) | ✅ Pass |
| `npm run format:check` | ✅ Pass |
| `npm test` | ✅ 527/527 tests, 45 files (10 in `InputPrefixSuffix.test.tsx`, new; all 21 `NumberInput` tests still pass unmodified) |
| `npm run tokens:generate` | ✅ 608 tokens generated |
| `npm run tokens:validate` | ✅ Pass |
| `npm run tokens:check-coverage` | ✅ Defined: 655, Referenced: 555, Missing: 0 |
| `npm run build` | ✅ Pass |
| `npm run build-storybook` | ✅ Pass |

### 6.8 Files Modified

- `frontend/src/design-system/primitives/InputPrefixSuffix/InputPrefixSuffix.tsx` — new.
- `frontend/src/design-system/primitives/InputPrefixSuffix/InputPrefixSuffix.module.css` — new.
- `frontend/src/design-system/primitives/InputPrefixSuffix/InputPrefixSuffix.stories.tsx` — new (8 stories).
- `frontend/src/design-system/primitives/InputPrefixSuffix/InputPrefixSuffix.test.tsx` — new (10 tests).
- `frontend/src/design-system/primitives/NumberInput/NumberInput.tsx` — refactored to compose `InputPrefixSuffix`.
- `frontend/src/design-system/primitives/NumberInput/NumberInput.module.css` — deleted (superseded).
- `frontend/scripts/generate-tokens.mjs` — new additive Input Prefix-Suffix token block (8 tokens).
- `frontend/src/design-system/primitives/index.ts` — added `InputPrefixSuffix` barrel export.
- `docs/FIGMA_INPUT_PREFIX_SUFFIX_SPECIFICATION.md` — new.
- `reports/VISUAL_COMPLIANCE/InputPrefixSuffix/VISUAL_COMPLIANCE_INPUT_PREFIX_SUFFIX.md` — new.
- `reports/VISUAL_COMPLIANCE/NumberInput/VISUAL_COMPLIANCE_NUMBER_INPUT.md` — update note appended.
- `frontend/src/design-system/registry/figma-component-map.json` — Input Prefix-Suffix row updated from `Missing` to `Approved`/`resolved`.
- `docs/COMPONENT_APPROVAL_MATRIX.md` — new row added.
- `docs/PROJECT_STATUS.md` — Batch 3 component 5 status line added.

`TextInput.tsx`, `Radio.tsx`, `Switch.tsx`, and every other previously-
Approved component are unchanged — confirmed via the full regression suite.

### 6.9 Remaining Risks (non-blocking)

1. `add-01`/`remove-01` icon substitution for the live node's `plus-sign`/`minus-sign` — same disclosed substitution already used for `NumberInput`.
2. Subtle style's Hovered/Pressed backgrounds are genuinely not backgroundless — implemented exactly as sampled, not "corrected" to stay transparent.
3. `selected` is unused by `NumberInput` but supported on the component's own surface for future reuse.

---

## 7. Component 6 — Date Picker

### 7.1 Figma Verification

| | |
|---|---|
| Figma file | `J0xq7JG3JKshRDzrgAM7E0` |
| Node ID | `30150:10582` (component-set root), plus 6 sampled variant instances and the `_Date field` sub-component (`30150:11261`) — see `docs/FIGMA_DATE_PICKER_SPECIFICATION.md` §9 for the full node table |
| Variants | 6 top-level symbols sampled (`rtl`[2] × `range`[2] × `picker`[open/closed], not fully crossed — `range=True` only sampled paired with `picker=True`) |
| Verification method | Live Figma MCP (`get_design_context`, `get_variable_defs`, `get_screenshot`); several nodes exceeded the single-call response-size cap and were fetched in pieces |
| Task instruction (unique to this component) | *"Verify the existing implementation against live Figma. Do not replace the implementation unless visual compliance requires changes."* |
| Result | Gap was **functional, not cosmetic** — the live component has Hijri/Gregorian dual-calendar support, a `Range=True` mode, a Quick Options sidebar, and a year-dropdown selector, none of which existed in the prior implementation. User was asked to scope the response (contained fix / full rebuild / audit-only) and chose **full rebuild**. |

### 7.2 Issues Found

The prior `DatePicker` (built in an earlier session, 13 tests, 3 stories) lacked:
- Any Hijri calendar concept at all (Gregorian-only), despite the live node's own helper text explicitly claiming automatic Hijri/Gregorian detection.
- Range selection (`range`/`rangeValue`/`onRangeChange`) — single date only.
- A Quick Options preset sidebar (Today/This week/Last week/This month/Last month/Last 3 months/Last 7/30/90 days).
- A year dropdown — year only changed via repeated `PageUp`/`PageDown` month paging.
- `helperText`/`errorText`/`requiredField` props — entirely absent, unlike every other FADS form primitive.
- Verified trigger chrome — used generic/unverified tokens instead of `TextInput`'s own live-verified field tokens, despite the registry already declaring `dependencies: ["Text Input", "Button"]`.

Already correct and **kept unchanged**: `document.body` portal positioning (re-measured on resize/scroll), outside-click/Escape handling, the shared `useFocusTrap` hook, roving-tabindex day-grid navigation with RTL-aware arrow keys, and `PageUp`/`PageDown` month paging.

### 7.3 Implementation Summary

New `hijriCalendar.ts` module (native `Intl.DateTimeFormat` with the `islamic-umalqura` calendar extension, no external date library) provides Hijri conversion, a bounded scan-and-converge Hijri→Gregorian algorithm, month-length/month-add helpers, and a 42-cell Sunday-first grid generator mirroring `dateGrid.ts`'s own convention. `DatePicker.tsx` gained: `calendar` (`'gregorian' | 'hijri' | 'auto'`, default `'auto'`, resolving to Hijri for Arabic-family locales), `range`/`rangeValue`/`onRangeChange` (dual-calendar range mode with a two-click build-a-range interaction), `quickOptions` (9 presets, range-mode only), a year-dropdown selector (interim internal listbox, `role="option"`/`aria-selected`, pending the not-yet-built "Dropdown List Item" registry component), and `helperText`/`errorText`/`requiredField`. The trigger's CSS was rebuilt directly on `TextInput`'s own verified tokens for pixel parity, while deliberately remaining a real `<button>` (not a literal `<TextInput>` composition) to preserve the correct WAI-ARIA APG "Date Picker Dialog" trigger semantics and all 13 pre-existing `role="button"`-based tests.

### 7.4 Token Changes

5 new additive `--fads-sys-datepicker-*` tokens: `selected-bg`, `selected-text`, `range-bg`, `popover-radius`, `popover-shadow` — plus direct reuse of `TextInput`'s own `--fads-sys-textinput-*` tokens for the trigger's chrome (no duplication). No tokens removed.

### 7.5 Storybook Coverage

Default, WithValue, Disabled, WithHelperText, WithError, Required, HijriCalendar, AutoDetectArabic, RangeMode, RangeWithQuickOptions, RTL, **OfficialFigmaReference** — 12 stories (up from 3).

### 7.6 Accessibility Improvements

- Pre-existing WAI-ARIA APG Date Picker Dialog pattern (dialog role, focus trap, roving-tabindex grid, RTL-aware arrow keys, Escape-to-close) unchanged and re-verified.
- Real `eslint-plugin-jsx-a11y` finding: `aria-invalid`/`aria-required` are not supported on the implicit `button` role — removed from the trigger; error/invalid state communicated instead via `data-invalid` (visual) and the error paragraph's own `role="alert"`. Same category of catch as `Radio`'s earlier `aria-readonly` finding.
- Year-dropdown button's accessible name combines the static label and the current year (e.g. "Select year: 2026") to avoid an accessible-name collision between `aria-label` and the visible year text — a real bug found and fixed during test-writing, not just a test adjustment.

### 7.7 Validation Results

| Command | Result |
|---|---|
| `npm run typecheck` | ✅ Pass |
| `npm run lint` (eslint + `lint:css`) | ⚠ 2 real findings (`aria-invalid`/`aria-required` unsupported on `role="button"`; 2 unnecessary non-null assertions in the new Hijri test), both fixed, then ✅ Pass |
| `npm run format:check` | ✅ Pass |
| `npm test` | ✅ 545/545 tests, 46 files — `DatePicker.test.tsx` 24 tests (up from 13, all originals preserved unmodified) + `hijriCalendar.test.ts` 7 new tests |
| `npm run tokens:generate` | ✅ 613 tokens generated |
| `npm run tokens:validate` | ✅ Pass |
| `npm run tokens:check-coverage` | ✅ Defined: 660, Referenced: 560, Missing: 0 |
| `npm run build` | ✅ Pass |
| `npm run build-storybook` | ✅ Pass |

### 7.8 Files Modified

- `frontend/src/design-system/composite/DatePicker/hijriCalendar.ts` — new.
- `frontend/src/design-system/composite/DatePicker/hijriCalendar.test.ts` — new (7 tests).
- `frontend/src/design-system/composite/DatePicker/DatePicker.tsx` — rebuilt (Hijri/range/quick-options/year-dropdown/helper/error/required props; trigger CSS rebuilt on `TextInput` tokens, kept as `<button>`).
- `frontend/src/design-system/composite/DatePicker/DatePicker.module.css` — rebuilt (new range/quick-options/year-dropdown/helper/error classes; 5 new additive tokens).
- `frontend/src/design-system/composite/DatePicker/DatePicker.stories.tsx` — rebuilt (12 stories, up from 3).
- `frontend/src/design-system/composite/DatePicker/DatePicker.test.tsx` — extended (24 tests, up from 13).
- `frontend/scripts/generate-tokens.mjs` — new additive Date Picker token block (5 tokens).
- `docs/FIGMA_DATE_PICKER_SPECIFICATION.md` — new.
- `reports/VISUAL_COMPLIANCE/DatePicker/VISUAL_COMPLIANCE_DATE_PICKER.md` — new.
- `frontend/src/design-system/registry/figma-component-map.json` — Date Picker row updated from `Implemented`/pending to `Approved`/resolved.
- `docs/COMPONENT_APPROVAL_MATRIX.md` — new row added.
- `docs/PROJECT_STATUS.md` — Batch 3 component 6 status paragraph added.

`TextInput.tsx`, `Radio.tsx`, `Switch.tsx`, `NumberInput.tsx`, `InputPrefixSuffix.tsx`, `dateGrid.ts`, and every other previously-Approved component are unchanged — confirmed via the full regression suite.

### 7.9 Remaining Risks (non-blocking)

1. Prev/next month chevron icons not independently re-sampled from Figma (response-size limits truncated the relevant node) — the pre-existing, already-tested `‹`/`›` buttons were kept unchanged.
2. Typed-input Hijri/Gregorian numeral-ambiguity detection is not implemented — only locale-based auto-detection is; Figma's own copy doesn't specify the mechanism beyond one sentence.
3. Year dropdown is an interim internal listbox, not the (separately-registered, not-yet-built) "Dropdown List Item" component — documented for future reconciliation once that component exists.
4. Range-highlight rendering is a reconstructed CSS band (`:has()`-based), not literal Figma vector data, using the live-verified `datecell-background-100`/`datecell-background-default` colors.
5. RTL range mode + quick options extended by structural analogy from the fully-sampled LTR range node — the equivalent live RTL node was not independently re-sampled (response-size limits).

---

## 8. Component 7 — Button-Close

### 8.1 Figma Verification

| | |
|---|---|
| Figma file | `J0xq7JG3JKshRDzrgAM7E0` |
| Node ID | `2763:420129` (component-set root) |
| Variants | 32 (`size`[x Small/Small/Medium/Large] × `state`[Default/Hovered/Pressed/Focused] × `onColor`[false/true]) |
| Verification method | Live Figma MCP (`get_design_context`, `get_variable_defs`) — the entire 32-variant set was returned in a single call, no truncation |
| Result | Registry status was `Missing` — zero prior implementation. A genuinely new primitive. |

### 8.2 Issues Found

None (no prior implementation existed to audit against). The only genuine implementation question was icon substitution: the live node's icon is an internal Figma sub-component (`multiplication-sign`, node `13758:242455`) with no directly-named FADS registry equivalent — resolved by inspecting the raw SVG path data of the registry's own `cancel-01` and confirming it is the identical plain "×" glyph (no circle/square decoration), as opposed to `cancel-02`/`cancel-circle`/`cancel-square`.

### 8.3 Implementation Summary

New primitive `ButtonClose` — a small icon-only `<button>` with a required `label` prop (`aria-label`, same contract as `InputPrefixSuffix`). `size` (`'xs' | 'sm' | 'md' | 'lg'`, default `'xs'` matching the Figma component's own default variant) controls both box (20/24/32/40px) and icon (16/20/20/24px, Small and Medium sharing the same 20px icon) dimensions. `onColor` switches to a distinct transparent-white hover/pressed fill and white icon/focus-ring for use on a dark/colored surface. `state` is not a runtime prop — Hovered/Pressed/Focused are real `:hover`/`:active`/`:focus-visible` pseudo-classes, consistent with every other interactive FADS primitive built in this batch.

### 8.4 Token Changes

15 new additive `--fads-sys-buttonclose-*` tokens: icon colors ×2 (default/oncolor), hover/pressed backgrounds ×4 (default ×2, oncolor ×2), focus-ring colors ×2, box sizes ×4 (xs/sm/md/lg), icon sizes ×3 (xs/sm-and-md-shared/lg). Corner radius and the live-verified 2px focus-border width intentionally reuse the codebase's already-shared generic `--fads-sys-radius-sm`/`--fads-sys-border-width-thick` tokens (confirmed identical values) rather than adding redundant new ones. No tokens removed.

### 8.5 Storybook Coverage

XSmall, Small, Medium, Large, OnColor, Disabled, **OfficialFigmaReference** (all 4 sizes on both the default and a dark/colored surface) — 7 stories (new component).

### 8.6 Accessibility Improvements

- Required `label` prop (icon-only control).
- Real `<button>` — native keyboard operability, no ARIA role needed.
- Focused state is a real, visible 2px solid border, live-verified and structurally distinct from Hovered/Pressed.

### 8.7 Validation Results

| Command | Result |
|---|---|
| `npm run typecheck` | ✅ Pass |
| `npm run lint` (eslint + `lint:css`) | ✅ Pass |
| `npm run format:check` | ✅ Pass (after `prettier --write` on the regenerated `tokens.css`) |
| `npm test` | ✅ 558/558 tests, 47 files (13 in `ButtonClose.test.tsx`, new) |
| `npm run tokens:generate` | ✅ 628 tokens generated |
| `npm run tokens:validate` | ✅ Pass |
| `npm run tokens:check-coverage` | ✅ Defined: 675, Referenced: 575, Missing: 0 |
| `npm run build` | ✅ Pass |
| `npm run build-storybook` | ✅ Pass |

### 8.8 Files Modified

- `frontend/src/design-system/primitives/ButtonClose/ButtonClose.tsx` — new.
- `frontend/src/design-system/primitives/ButtonClose/ButtonClose.module.css` — new.
- `frontend/src/design-system/primitives/ButtonClose/ButtonClose.stories.tsx` — new (7 stories).
- `frontend/src/design-system/primitives/ButtonClose/ButtonClose.test.tsx` — new (13 tests).
- `frontend/src/design-system/primitives/index.ts` — added `ButtonClose` barrel export.
- `frontend/scripts/generate-tokens.mjs` — new additive Button-Close token block (15 tokens).
- `docs/FIGMA_BUTTON_CLOSE_SPECIFICATION.md` — new.
- `reports/VISUAL_COMPLIANCE/ButtonClose/VISUAL_COMPLIANCE_BUTTON_CLOSE.md` — new.
- `frontend/src/design-system/registry/figma-component-map.json` — Button-Close row updated from `Missing` to `Approved`/resolved.
- `docs/COMPONENT_APPROVAL_MATRIX.md` — new row added.
- `docs/PROJECT_STATUS.md` — Batch 3 component 7 status paragraph added.

`TextInput.tsx`, `Radio.tsx`, `Switch.tsx`, `NumberInput.tsx`, `InputPrefixSuffix.tsx`, `DatePicker.tsx`, `Modal.tsx`, `Toast.tsx`, `NoticeBody.tsx`, and every other previously-Approved component are unchanged — confirmed via the full regression suite.

### 8.9 Remaining Risks (non-blocking)

1. No `Disabled` variant exists in the live Figma set at all — `disabled` is still supported via the native HTML attribute, with no invented visual beyond `cursor: not-allowed` and suppressed hover/press feedback.
2. `cancel-01` icon substitution for the live node's internal `multiplication-sign` sub-component — same disclosed-substitution category already used for Number Input/Input Prefix-Suffix.
3. `Modal.tsx` and the shared `NoticeBody.tsx` (`Toast`/`Notification`) each still render their own independent, unverified-against-this-node ad-hoc "×" dismiss button — not refactored to compose this new primitive in this pass (out of scope for this component's own strict one-at-a-time session; flagged as a real future consolidation opportunity, not a silent gap).

---

## 9. Component 8 — Floating Button

### 9.1 Figma Verification

| | |
|---|---|
| Figma file | `J0xq7JG3JKshRDzrgAM7E0` |
| Node ID | `19488:124656` (component-set root) |
| Variants | 700+ instances (`style`[Primary-Neutral/Primary-Brand/Secondary-Solid] × `size`[Small/Large] × `Icon only` × `On color` × `state`[Default/Hovered/Pressed/Selected/Focused/Disabled] × `rtl`) — too large for a single `get_design_context` call, sampled representatively |
| Verification method | Live Figma MCP (`get_design_context` on ~9 representative variant nodes, `get_variable_defs` on the root, one targeted `get_screenshot`) |
| Result | Registry status was `Missing` — zero prior implementation. `get_variable_defs` revealed this component's color tokens are byte-identical to the already-Approved `Button` primitive's own `neutral`/`primary`/`secondarySolid` variants. |

### 9.2 Issues Found

None (no prior implementation existed). The genuine implementation question was architectural: given the near-total token overlap with `Button`, should this literally compose `<Button>`? Investigation found a real, disclosed reason not to — see §9.3.

### 9.3 Implementation Summary

New primitive `FloatingButton` — reuses `Button`'s own `--fads-sys-button-*` tokens directly for every color/typography/disabled/focus-ring value (confirmed byte-identical via `get_variable_defs`), adding only 3 new geometry tokens (padding-sm/-lg, gap) since its circular/pill sizing model (fixed padding driving a true circle via `radius-full`) differs structurally from `Button`'s own height/padding-inline model. **Not** a literal `<Button>` composition: independently live-verifying this component's own `Selected` state (node `19488:124967`) showed it uses a genuinely distinct `-selected` background token (`#384250`), diverging from `Button`'s own documented behavior of reusing the Pressed color for Selected (`Button.module.css`'s own comment) — composing `<Button selected>` would have silently applied the wrong color. `variant` (`'neutral'|'primary'|'secondarySolid'`), `size` (`'sm'|'lg'`), `onColor`, `selected`, required `icon` + optional visible `children` label (icon-only renders a true circle, a label renders a pill).

### 9.4 Token Changes

3 new additive `--fads-sys-floatingbutton-*` tokens (padding-sm, padding-lg, gap) — pure geometry. Icon size reuses `Button`'s own `--fads-sys-button-icon-size-lg` directly (both Floating Button sizes use a fixed 24px icon). Zero new color tokens — every color, the disabled treatment, and the focus ring are reused from `Button`'s existing tokens.

### 9.5 Storybook Coverage

Neutral, Primary, SecondarySolid, WithLabel, Large, Selected, Disabled, OnColor, **OfficialFigmaReference** — 9 stories (new component).

### 9.6 Accessibility Improvements

- Required `icon` prop; accessible name via `children` or `aria-label`/`aria-labelledby`, with the same icon-only dev-time warning `Button` already has.
- `selected` exposed via `aria-pressed`.
- Focus state reuses `Button`'s own live-verified double-ring treatment exactly.

### 9.7 Validation Results

| Command | Result |
|---|---|
| `npm run typecheck` | ✅ Pass |
| `npm run lint` (eslint + `lint:css`) | ✅ Pass |
| `npm run format:check` | ✅ Pass (after `prettier --write` on the new story file and regenerated `tokens.css`) |
| `npm test` | ✅ 576/576 tests, 48 files (18 in `FloatingButton.test.tsx`, new) |
| `npm run tokens:generate` | ✅ 631 tokens generated |
| `npm run tokens:validate` | ✅ Pass |
| `npm run tokens:check-coverage` | ✅ Defined: 678, Referenced: 582, Missing: 0 |
| `npm run build` | ✅ Pass |
| `npm run build-storybook` | ✅ Pass |

### 9.8 Files Modified

- `frontend/src/design-system/primitives/FloatingButton/FloatingButton.tsx` — new.
- `frontend/src/design-system/primitives/FloatingButton/FloatingButton.module.css` — new.
- `frontend/src/design-system/primitives/FloatingButton/FloatingButton.stories.tsx` — new (9 stories).
- `frontend/src/design-system/primitives/FloatingButton/FloatingButton.test.tsx` — new (18 tests).
- `frontend/src/design-system/primitives/index.ts` — added `FloatingButton` barrel export.
- `frontend/scripts/generate-tokens.mjs` — new additive Floating Button token block (3 tokens).
- `docs/FIGMA_FLOATING_BUTTON_SPECIFICATION.md` — new.
- `reports/VISUAL_COMPLIANCE/FloatingButton/VISUAL_COMPLIANCE_FLOATING_BUTTON.md` — new.
- `frontend/src/design-system/registry/figma-component-map.json` — Floating Button row updated from `Missing` to `Approved`/resolved.
- `docs/COMPONENT_APPROVAL_MATRIX.md` — new row added.
- `docs/PROJECT_STATUS.md` — Batch 3 component 8 status paragraph added.

`Button.tsx`/`Button.module.css` and every other previously-Approved component are unchanged — `FloatingButton` reuses `Button`'s tokens, not its code, so nothing about `Button` itself needed to change. Confirmed via the full regression suite.

### 9.9 Remaining Risks (non-blocking)

1. No box-shadow/elevation found in any sampled node, despite the component's own "floats above the interface" description — not invented.
2. `Selected` uses a distinct token, genuinely diverging from `Button`'s own precedent of reusing Pressed for Selected — a real, independently live-verified difference, not an inconsistency to reconcile.
3. No RTL-specific code added — relies on the same natural bidi/logical-flow mirroring `Button` already uses, rather than reproducing Figma's own hand-placed RTL layer reordering literally.

---

## 10. Component 9 — Trailing Icon

### 10.1 Figma Verification

| | |
|---|---|
| Figma file | `J0xq7JG3JKshRDzrgAM7E0` |
| Node ID | `30150:92875` (component-set root) |
| Variants | 2 (`Open`[False/True]) — the smallest set in this batch, resolved in a single call |
| Verification method | Live Figma MCP (`get_design_context`, `get_variable_defs`, a dedicated `get_screenshot` on `Open=True`) |
| Result | Registry status was `Missing` — zero prior implementation. A dedicated screenshot resolved a real ambiguity in panel placement (see §10.2). |

### 10.2 Issues Found

None (no prior implementation existed). The genuine finding was structural: the extracted markup's nested flex structure was ambiguous about whether the helper-text panel sits above or below the icon. A dedicated `get_screenshot` of the `Open=True` node resolved it: the panel appears **below** the icon, beak pointing **up** — the reverse of the more common tooltip-above-trigger convention.

### 10.3 Implementation Summary

New primitive `TrailingIcon` — a real `<button>` (required `icon` + `label` props) with a `role="tooltip"` panel shown on hover/focus and hidden on mouseleave/blur/Escape, linked via `aria-describedby` only while open — mirrors this project's existing `Tooltip` primitive's own interaction pattern. The panel's own visual (white fill, dark semibold text, a CSS-drawn beak, two-layer shadow) is **not** reused from `Tooltip`'s current code: `Tooltip` itself is a separate, not-yet-visually-verified registry component (batch 7) whose current placeholder CSS renders a dark-inverse bubble — the opposite of what was live-verified here. Building this panel's own accurate implementation avoids shipping the wrong visual while `Tooltip` awaits its own pass.

### 10.4 Token Changes

12 new additive `--fads-sys-trailingicon-*` tokens (hit-padding, icon size/color, tooltip gap/min-width/max-width/background/shadow/padding/text/font-size/line-height). Radius, z-index, and semibold font-weight reuse the already-shared generic `--fads-sys-radius-sm`/`--fads-sys-z-tooltip`/`--fads-ref-font-weight-semibold` tokens directly. No tokens removed.

### 10.5 Storybook Coverage

Clear, Search, Disabled, **OfficialFigmaReference** — 4 stories (new component).

### 10.6 Accessibility Improvements

- Required `label` prop drives both `aria-label` and the panel's visible text.
- Panel is `role="tooltip"`, linked via `aria-describedby` only while open (WCAG 1.4.13-compatible).
- No Figma-verified `Focused` state exists (only 2 variants total) — a focus-visible outline was still added using already-shared generic tokens, since WCAG 2.2 requires visible focus regardless of Figma sample completeness.

### 10.7 Validation Results

| Command | Result |
|---|---|
| `npm run typecheck` | ✅ Pass |
| `npm run lint` (eslint + `lint:css`) | ✅ Pass |
| `npm run format:check` | ✅ Pass (after `prettier --write` on the new test file and regenerated `tokens.css`/`generate-tokens.mjs`) |
| `npm test` | ✅ 585/585 tests, 49 files (9 new in `TrailingIcon.test.tsx`) |
| `npm run tokens:generate` | ✅ 643 tokens generated |
| `npm run tokens:validate` | ✅ Pass |
| `npm run tokens:check-coverage` | ✅ Defined: 690, Referenced: 594, Missing: 0 |
| `npm run build` | ✅ Pass |
| `npm run build-storybook` | ✅ Pass |

### 10.8 Files Modified

- `frontend/src/design-system/primitives/TrailingIcon/TrailingIcon.tsx` — new.
- `frontend/src/design-system/primitives/TrailingIcon/TrailingIcon.module.css` — new.
- `frontend/src/design-system/primitives/TrailingIcon/TrailingIcon.stories.tsx` — new (4 stories).
- `frontend/src/design-system/primitives/TrailingIcon/TrailingIcon.test.tsx` — new (9 tests).
- `frontend/src/design-system/primitives/index.ts` — added `TrailingIcon` barrel export.
- `frontend/scripts/generate-tokens.mjs` — new additive Trailing Icon token block (12 tokens).
- `docs/FIGMA_TRAILING_ICON_SPECIFICATION.md` — new.
- `reports/VISUAL_COMPLIANCE/TrailingIcon/VISUAL_COMPLIANCE_TRAILING_ICON.md` — new.
- `frontend/src/design-system/registry/figma-component-map.json` — Trailing Icon row updated from `Missing` to `Approved`/resolved.
- `docs/COMPONENT_APPROVAL_MATRIX.md` — new row added.
- `docs/PROJECT_STATUS.md` — Batch 3 component 9 status paragraph added.

`Tooltip.tsx`/`Tooltip.module.css` and every other previously-Approved component are unchanged — confirmed via the full regression suite.

### 10.9 Remaining Risks (non-blocking)

1. Panel tokens share the same Figma `Tooltip/*` variable family as the separate, not-yet-verified `Tooltip` component — disclosed for future reconciliation once `Tooltip` gets its own compliance pass (batch 7).
2. The live sample's default icon (`mic-01`) isn't in the FADS icon registry at all (belongs to the not-yet-imported 179-icon Communications category) — a registry gap, not a wrong-shape substitution; `icon` itself is fully generic.
3. No Hovered/Pressed/Focused/Disabled variant exists in the live 2-variant set — the focus-visible outline is a non-Figma-sampled WCAG 2.2 addition.

---

## 11. Component 10 — Dropdown List Item

### 11.1 Figma Verification

| | |
|---|---|
| Figma file | `J0xq7JG3JKshRDzrgAM7E0` |
| Node ID | `3262:27949` (component-set root) |
| Variants | `type`[Single Select/Multi Select/Group label] × `state`[Default/Hovered/Pressed/Focused/Disabled] × `selected` × `divider` × `rtl` — resolved in a single call |
| Verification method | Live Figma MCP (`get_design_context`, `get_variable_defs`) |
| Result | Registry status was `Missing`, but this exact node is already named "Dropdown List Item sub-component" in `docs/FIGMA_SELECT_SPECIFICATION.md`'s own node table — a confirmed node-identical match. |

### 11.2 Issues Found

The genuine finding was a required extraction, not a defect: `Select`'s own spec already committed to this relationship (same category as component 5's `InputPrefixSuffix`/`NumberInput`). Refactoring `Select.tsx` to compose the new primitive then surfaced two real, independently-verified fidelity bugs in its prior ad-hoc `<li>` CSS: option hover background was `#f9fafb` (explicitly flagged "Needs Confirmation" when originally written) instead of the correct `#f3f4f6`, and row padding/gap was `4px` instead of the correct `8px`.

### 11.3 Implementation Summary

New primitive `DropdownListItem` — a real `<li role="option">` (or `role="presentation"` for `type="groupLabel"`) meant to sit inside a consumer's `<ul role="listbox">`. `type` (`'option' | 'multiSelectOption' | 'groupLabel'`), `selected`, `disabled`, `divider`, and `active` (the live `Focused` state — **not** native DOM focus, since `Select`'s own WAI-ARIA combobox pattern keeps real focus on the trigger; exposed as a consumer-driven prop rendering a real 2px border). Multi Select's checkbox is a decorative reuse of the already-Approved `Checkbox`'s own byte-identical `xs`/`neutral`/`checked` tokens, not a literal `<Checkbox>` composition (its `label` always renders at its own 16px scale, wrong for this component's 14px text). `Select.tsx` now composes this primitive for its option/group rows.

### 11.4 Token Changes

10 new additive `--fads-sys-dropdownlistitem-*` tokens (text, text-disabled, group-text, icon-default, bg-hover, bg-pressed, focus-border, checkbox-border, divider, padding). Border-width/radius reuse already-shared generic tokens; the Multi Select checkbox reuses `Checkbox`'s own tokens directly. 4 now-fully-unused `Select`-scoped tokens (`select-option-text`, `select-option-hover-bg`, `select-group-text`, `select-panel-gap`) were removed.

### 11.5 Storybook Coverage

Option, Selected, Active, Disabled, WithDivider, MultiSelectOption, GroupLabel, **OfficialFigmaReference** — 8 stories (new component).

### 11.6 Accessibility Improvements

- Real `role="option"`/`role="presentation"`, `aria-selected`, `aria-disabled`.
- Multi Select's decorative checkbox is `aria-hidden` — `aria-selected` on the `<li>` is the single source of truth.
- No RTL-specific code needed — a dedicated screenshot comparison confirmed the checkmark/checkbox position (fixed per `type`) already mirrors correctly under the app's own `dir="rtl"` default via natural CSS logical flow.

### 11.7 Validation Results

| Command | Result |
|---|---|
| `npm run typecheck` | ✅ Pass |
| `npm run lint` (eslint + `lint:css`) | ✅ Pass (one now-unused `eslint-disable` comment in `Select.tsx` found and removed) |
| `npm run format:check` | ✅ Pass (after `prettier --write` on the regenerated `tokens.css`) |
| `npm test` | ✅ 597/597 tests, 50 files — 12 new in `DropdownListItem.test.tsx`; all 26 pre-existing `Select.test.tsx` tests pass unmodified |
| `npm run tokens:generate` | ✅ 649 tokens generated |
| `npm run tokens:validate` | ✅ Pass |
| `npm run tokens:check-coverage` | ✅ Defined: 696, Referenced: 600, Missing: 0 |
| `npm run build` | ✅ Pass |
| `npm run build-storybook` | ✅ Pass |

### 11.8 Files Modified

- `frontend/src/design-system/primitives/DropdownListItem/DropdownListItem.tsx` — new.
- `frontend/src/design-system/primitives/DropdownListItem/DropdownListItem.module.css` — new.
- `frontend/src/design-system/primitives/DropdownListItem/DropdownListItem.stories.tsx` — new (8 stories).
- `frontend/src/design-system/primitives/DropdownListItem/DropdownListItem.test.tsx` — new (12 tests).
- `frontend/src/design-system/primitives/index.ts` — added `DropdownListItem` barrel export.
- `frontend/scripts/generate-tokens.mjs` — new additive Dropdown List Item token block (10 tokens); removed 4 now-unused `Select` tokens.
- `frontend/src/design-system/primitives/Select/Select.tsx` — refactored to compose `DropdownListItem`; module doc updated.
- `frontend/src/design-system/primitives/Select/Select.module.css` — removed superseded `.option`/`.groupLabel`/`.check` classes.
- `docs/FIGMA_DROPDOWN_LIST_ITEM_SPECIFICATION.md` — new.
- `reports/VISUAL_COMPLIANCE/DropdownListItem/VISUAL_COMPLIANCE_DROPDOWN_LIST_ITEM.md` — new.
- `reports/VISUAL_COMPLIANCE/Select/VISUAL_COMPLIANCE_SELECT.md` — update note appended.
- `frontend/src/design-system/registry/figma-component-map.json` — Dropdown List Item row updated from `Missing` to `Approved`/resolved; `Dropdown Input` (Select) notes updated.
- `docs/COMPONENT_APPROVAL_MATRIX.md` — new row added; `Select`'s row notes updated.
- `docs/PROJECT_STATUS.md` — Batch 3 component 10 status paragraph added.

Every other previously-Approved component is unchanged — confirmed via the full regression suite.

### 11.9 Remaining Risks (non-blocking)

1. Multi Select checkbox is a decorative reuse of `Checkbox`'s tokens, not a literal composition — disclosed architecture decision, not a gap.
2. Single Select checkmark stays a literal `"✓"` character (matching `Select`'s own pre-existing convention) rather than the live node's own `tick-02` SVG glyph, which isn't in the FADS icon registry.
3. `DatePicker`'s own internal year-dropdown listbox was not refactored to use this component in this pass — a discretionary future improvement, not a proven node-identical match like `Select`'s.

---

## 12. Component 11 — Search Box (final component in this batch)

### 12.1 Figma Verification

| | |
|---|---|
| Figma file | `J0xq7JG3JKshRDzrgAM7E0` |
| Node ID | `30150:90990` (component-set root) |
| Variants | `rtl` × `state`[Default/Hovered/Pressed/Focused/Read-only/Disabled] × `filled` × `size`[Medium/Large] × `style`[Default/Filled darker/Filled lighter] — the exact same governing axes already sourced for the already-Approved `TextInput` |
| Verification method | Live Figma MCP (`get_design_context` on a representative instance, `get_variable_defs`) |
| Result | Registry status was `Missing`, flagged `nodeResolutionStatus: "blocked"` pending `docs/QUESTIONS.md` Q10. Live data resolved the block — see §12.2. |

### 12.2 Scope Resolution (Q10 Block)

Live verification showed this component is a plain reusable input-field primitive with no results-page/site-search-feature structure baked in — governed by the same axes as `TextInput`. The user was presented with the finding (build now / stay blocked / audit-only) and explicitly chose to build it now: Q10 gates whether the *product* ships a site-wide search page (a separate shell-layer component, "Search"/CMP-33, which remains genuinely blocked), not whether this reusable field belongs in the design system.

### 12.3 Implementation Summary

New primitive `SearchBox` — `get_variable_defs` confirmed the field chrome is byte-identical to `TextInput`'s own `--fads-sys-textinput-*` tokens, reused directly (only 1 new token needed: the 16px helper-icon size). Not a literal `<TextInput>` composition: `TextInput`'s own `suffix` renders a separately-backgrounded badge, but live verification showed the trailing slot sits inside the same un-badged content row as the leading icon — and that slot's own node IDs are a literal instance reference into the already-Approved `TrailingIcon` (confirmed by direct match, same category as `InputPrefixSuffix`/`NumberInput` and `DropdownListItem`/`Select`). The helper-text row always pairs a `help-circle` icon with the text (new to this component, not added to `TextInput`). The native input gets `role="searchbox"` while deliberately keeping `type="text"` (not `type="search"`) to avoid native browser clear-icon conflicts with the explicit `trailingIcon` slot.

### 12.4 Token Changes

1 new additive token: `--fads-sys-searchbox-helper-icon-size` (16px). Every other value reuses `TextInput`'s own tokens directly. No tokens removed.

### 12.5 Storybook Coverage

Default, WithTrailingIcon, WithHelper, WithError, ReadOnly, Disabled, Sizes, Surfaces, RTL, **OfficialFigmaReference** — 10 stories (new component).

### 12.6 Accessibility Improvements

- Real `<label htmlFor>` association, same as `TextInput`.
- Explicit `role="searchbox"` on the native input.
- `aria-describedby`/`aria-invalid`/`aria-required` wired identically to `TextInput`'s own contract.

### 12.7 Validation Results

| Command | Result |
|---|---|
| `npm run typecheck` | ✅ Pass |
| `npm run lint` (eslint + `lint:css`) | ✅ Pass |
| `npm run format:check` | ✅ Pass (after `prettier --write` on the new component/story files and regenerated `tokens.css`) |
| `npm test` | ✅ 609/609 tests, 51 files (12 new in `SearchBox.test.tsx`) |
| `npm run tokens:generate` | ✅ 650 tokens generated |
| `npm run tokens:validate` | ✅ Pass |
| `npm run tokens:check-coverage` | ✅ Defined: 697, Referenced: 602, Missing: 0 |
| `npm run build` | ✅ Pass |
| `npm run build-storybook` | ✅ Pass |

### 12.8 Files Modified

- `frontend/src/design-system/primitives/SearchBox/SearchBox.tsx` — new.
- `frontend/src/design-system/primitives/SearchBox/SearchBox.module.css` — new.
- `frontend/src/design-system/primitives/SearchBox/SearchBox.stories.tsx` — new (10 stories).
- `frontend/src/design-system/primitives/SearchBox/SearchBox.test.tsx` — new (12 tests).
- `frontend/src/design-system/primitives/index.ts` — added `SearchBox` barrel export.
- `frontend/scripts/generate-tokens.mjs` — new additive Search Box token block (1 token).
- `docs/FIGMA_SEARCH_BOX_SPECIFICATION.md` — new.
- `reports/VISUAL_COMPLIANCE/SearchBox/VISUAL_COMPLIANCE_SEARCH_BOX.md` — new.
- `frontend/src/design-system/registry/figma-component-map.json` — Search Box row updated from `Missing`/`blocked` to `Approved`/resolved.
- `docs/COMPONENT_APPROVAL_MATRIX.md` — new row added.
- `docs/PROJECT_STATUS.md` — Batch 3 component 11 (final) status paragraph added.

`TextInput.tsx`/`TextInput.module.css`, `TrailingIcon.tsx`, and every other previously-Approved component are unchanged — confirmed via the full regression suite.

### 12.9 Remaining Risks (non-blocking)

1. No independently-verified error-state visual exists for Search Box in the live data (unlike `TextInput`'s own explicit `error` axis) — `errorText` still works via the same inherited generic border/row treatment, not fabricated separately.
2. The shell-layer "Search" component (CMP-33, a results page/site-search feature) remains genuinely blocked on Q10 — only this reusable field primitive was unblocked by the user's explicit decision.

---

## 13. Cumulative Validation Snapshot (as of component 11 — batch complete)

| Metric | Before Batch 3 | After component 1 | After component 2 | After component 3 | After component 4 | After component 5 | After component 6 | After component 7 | After component 8 | After component 9 | After component 10 | After component 11 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Tests passing | 432 | 475 | 486 | 496 | 517 | 527 | 545 | 558 | 576 | 585 | 597 | 609 |
| Tokens defined | — | 607 | 627 | 646 | 646 | 655 | 660 | 675 | 678 | 690 | 696 | 697 |
| Tokens referenced | — | 511 | 528 | 546 | 546 | 555 | 560 | 575 | 582 | 594 | 600 | 602 |
| Missing token references | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |

---

## 14. Final Component Matrix — Batch 3 COMPLETE

| # | Component | Status | Date | Notes |
|---|---|---|---|---|
| 1 | Text Input | ✅ Approved | 2026-07-13 (re-verified) | Registry bookkeeping corrected; zero code changes |
| 2 | Label | ✅ Approved | 2026-07-13 (re-verified) | Bundled coverage via Text Input's internal Label markup + `Field` helper |
| 3 | Radio | ✅ Approved | 2026-07-13 | Rebuilt from bare native input to hidden-input + decorative-box architecture; 24 new tokens |
| 4 | Radio Label | ✅ Approved | 2026-07-13 | Bundled into `Radio` (label/description/error slots) |
| 5 | Switch | ✅ Approved | 2026-07-13 | Kept correct `<button role="switch">` architecture; corrected geometry/colors, added description/error/trailing; 22 new tokens |
| 6 | Switch Label | ✅ Approved | 2026-07-13 | Bundled into `Switch` (label/description/error slots + `trailing` layout) |
| 7 | Number Input | ✅ Approved | 2026-07-13 | New primitive composing `TextInput`; zero new tokens; WAI-ARIA Spinbutton pattern |
| 8 | Input Prefix-Suffix | ✅ Approved | 2026-07-14 | New primitive; extracted from Number Input's own ad-hoc stepper button; `NumberInput` refactored to compose it; 8 new tokens |
| 9 | Date Picker | ✅ Approved | 2026-07-14 | Full rebuild (user-approved scope): added Hijri calendar, range mode, quick options, year dropdown, helper/error/required; trigger kept as `<button>` rebuilt on `TextInput` tokens; 5 new tokens; 24 tests (up from 13) |
| 10 | Button-Close | ✅ Approved | 2026-07-14 | New primitive; entire 32-variant matrix resolved in one un-truncated call; icon-only `<button>`, `cancel-01` icon substitute; 15 new tokens; not yet composed into Modal/Toast's existing ad-hoc close buttons (disclosed) |
| 11 | Floating Button | ✅ Approved | 2026-07-14 | New primitive; color tokens byte-identical to `Button`'s neutral/primary/secondarySolid variants (reused directly, zero new color tokens); 3 new geometry tokens; not a literal `<Button>` composition since Selected uses a distinct token, diverging from `Button`'s own Selected-reuses-Pressed behavior |
| 12 | Trailing Icon | ✅ Approved | 2026-07-14 | New primitive; smallest variant set in the batch (Open only); panel placement resolved via dedicated screenshot (below icon, not above); own accurate panel built instead of composing the not-yet-verified `Tooltip`; 12 new tokens; `mic-01` icon is a disclosed registry gap |
| 13 | Dropdown List Item | ✅ Approved | 2026-07-14 | New primitive; confirmed node-identical match with `Select`'s own spec; `Select` refactored to compose it, fixing 2 real bugs (hover bg, padding/gap); 10 new tokens, 4 removed; decorative checkbox reuses `Checkbox`'s tokens |
| 14 | Search Box | ✅ Approved | 2026-07-14 | New primitive; registry `blocked` flag (Q10) resolved by user decision as a product-scope question, not a component-fidelity gate; byte-identical `TextInput` token reuse (1 new token); trailing slot confirmed a `TrailingIcon` instance |

**Batch 3 (Form Controls & Input Family) is complete: all 14 scoped registry components are Approved.** 609/609 tests pass repo-wide (up from 432 before the batch started), 697 tokens defined / 602 referenced / 0 missing, and every validation command (`typecheck`, `lint`, `format:check`, `test`, `tokens:generate`/`validate`/`check-coverage`, `build`, `build-storybook`) is green as of the final component.
