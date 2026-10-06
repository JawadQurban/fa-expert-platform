# Visual Compliance — DatePicker

Compares the official Platforms Code Date Picker component (see
`docs/FIGMA_DATE_PICKER_SPECIFICATION.md`, node `30150:10582` in file
`J0xq7JG3JKshRDzrgAM7E0`) against the FADS `DatePicker` composite as it stood
before this pass. Unlike every other component in this batch, this one
carried an explicit brief: *"Verify the existing implementation against live
Figma. Do not replace unless visual compliance requires changes."* Live
verification found the gap was **functional, not cosmetic** — the user was
asked to scope the response and chose a full rebuild (see §1).

---

## 1. Scoping Decision

Live Figma verification revealed the official component has four things the
pre-existing implementation completely lacked: Hijri/Gregorian dual-calendar
support (the live node's own helper text explicitly claims this), range
selection (a `Range=True` variant with dual calendars and a connected
highlight), a "Quick options" preset sidebar, and a year-dropdown selector
(in place of the existing year-by-year paging). The user was presented with
three options — full rebuild, a contained TextInput-composition fix with the
rest documented as gaps, or an audit-only pass with no code changes — and
chose the full rebuild.

## 2. Prior Implementation Summary

Before this pass: single Gregorian date only (`Date` object, no Hijri), no
range mode, no quick options, no year dropdown (year changed only via
month-by-month `PageUp`/`PageDown` paging), no `helperText`/`errorText`/
`requiredField` props at all, and an independent trigger implementation
(bare native `<button>` with generic/unverified tokens) despite the registry
listing `dependencies: ["Text Input", "Button"]`. 3 stories, 13 tests. No
`docs/FIGMA_DATE_PICKER_SPECIFICATION.md` or
`reports/VISUAL_COMPLIANCE/DatePicker/` existed.

Already solid and **unchanged this pass**: `document.body` portal
positioning (re-measured on resize/scroll), outside-click/Escape, the shared
`useFocusTrap` hook (same one `Modal`/`NavDrawer` use), roving-tabindex day
navigation with RTL-aware `ArrowLeft`/`ArrowRight`, and `PageUp`/`PageDown`
month paging.

## 3. Differences Found (and Fixed)

| # | Area | Official (live-verified) | Prior implementation | Fixed this pass |
|---|---|---|---|---|
| 1 | Calendar system | Auto-detects/supports Hijri and Gregorian (live node's own helper text) | Gregorian only, no Hijri concept at all | ✅ New `calendar` prop (`gregorian`/`hijri`/`auto`), built on a new `hijriCalendar.ts` (native `Intl` `islamic-umalqura`, no external library) |
| 2 | Range selection | A `Range=True` variant: dual calendars, two value fields, connected range highlight | Single date only | ✅ New `range`/`rangeValue`/`onRangeChange` props, dual calendar panels, range-highlight CSS |
| 3 | Quick options | A 160px sidebar with 9 presets (Today, This week, Last week, This month, Last month, Last 3 months, Last 7 days, Last 30 days, Last 90 days), range-mode only | Did not exist | ✅ New `quickOptions` prop |
| 4 | Year navigation | A year dropdown (Button-menu + scrollable list) | Year changed only via repeated month paging | ✅ New year-dropdown UI (minimal internal listbox — see spec §4 for why not the not-yet-built "Dropdown List Item") |
| 5 | Trigger field chrome | Token-identical to `TextInput`'s own field (confirmed: same `Form/field-*` tokens, 40px height, `DD/MM/YY` placeholder) | Generic/unverified tokens (`--fads-sys-color-field-border`, `--fads-sys-control-radius`, etc.) | ✅ Trigger CSS rebuilt on `TextInput`'s own verified `--fads-sys-textinput-*` tokens — kept as a `<button>` (see §4), not a literal `<TextInput>` |
| 6 | Helper text | "Date will automatically detect Hijri or Georgian date" | Did not exist | ✅ New `helperText` prop (generic — the specific Hijri/Gregorian copy is a Storybook example, not hardcoded) |
| 7 | `errorText`/`requiredField` | Not modeled as a distinct Figma state, but the same functional-a11y-requirement pattern every other FADS form primitive has | Did not exist at all | ✅ New `errorText`/`requiredField` props, `role="alert"` error row |

## 4. Architecture Decision: Trigger Stays a `<button>`

The trigger's **visual chrome** was rebuilt on `TextInput`'s own live-verified
tokens for pixel parity with the "Date Field" node. It deliberately did
**not** become a literal `<TextInput>` composition: this component's
pre-existing WAI-ARIA APG "Date Picker Dialog" pattern (a button that opens a
dialog) is already the correct pattern for this widget, and swapping to an
`<input>` would change interactive semantics for no compliance benefit while
risking regressions across the 13 already-passing, previously-verified tests
built around `role="button"` queries. Disclosed, not a silent shortcut — see
`DatePicker.tsx`'s own module doc.

## 5. Hijri Calendar Implementation

New file `hijriCalendar.ts`, built entirely on `Intl.DateTimeFormat` with the
`islamic-umalqura` calendar extension (`${locale}-u-ca-islamic-umalqura`) —
no external date library, matching `dateGrid.ts`'s own established
convention. Since `Intl` only converts Gregorian→Hijri (not the reverse), a
bounded scan-and-converge algorithm (`fromHijri`) finds the Gregorian date
for a given Hijri (year, month, day) by estimating via the ~29.53059-day
lunar month average and refining against `Intl`'s own output until an exact
match — verified round-trip-correct in 7 dedicated unit tests
(`hijriCalendar.test.ts`), including a documented reference date (2024-01-01
CE ⇔ 19 Jumada II 1445 AH) and a year-rollover case.

## 6. Accessibility

- Everything from the pre-existing WAI-ARIA APG Date Picker Dialog pattern is unchanged and re-verified (24/24 tests, up from 13).
- A real `eslint-plugin-jsx-a11y` finding: `aria-invalid`/`aria-required` are not supported on the implicit `button` role — caught and correctly not added to the trigger (visual/announced-error state still comes from `data-invalid` + the error paragraph's own `role="alert"`).
- The year-dropdown button's accessible name combines the label and the currently-selected year (avoiding a name collision between a purpose-only `aria-label` and the visible year text).
- Icon-only stepper-style controls (quick options, year options) all have real accessible names.

## 7. RTL

No regression to the pre-existing RTL day-navigation mirroring or (per the
existing code) month-nav button function swap. Not independently re-verified
against a live RTL range/quick-options node this pass (response-size limits
prevented fetching the full RTL range node) — extended by structural analogy
from the LTR range node, which was fully sampled. Flagged Needs Confirmation,
non-blocking (spec §10).

## 8. Scope

- New files: `hijriCalendar.ts`, `hijriCalendar.test.ts`.
- Modified: `DatePicker.tsx`, `DatePicker.module.css`, `DatePicker.stories.tsx`, `DatePicker.test.tsx`.
- `dateGrid.ts` unchanged — Gregorian grid generation still lives there; `hijriCalendar.ts` is a parallel, independent module for the Hijri case, selected between at the call site in `DatePicker.tsx`.
- `TextInput.tsx`, `Radio.tsx`, `Switch.tsx`, `NumberInput.tsx`, `InputPrefixSuffix.tsx`, and every other previously-Approved component are unchanged — confirmed via the full regression suite (545/545 passing, up from 527).
- `DatePicker` is consumed only by its own stories/tests (`grep`-verified) — this rebuild carries no external-breakage risk.

## 9. Required Code (this pass) — Status

1. ✅ `hijriCalendar.ts` — new, native-`Intl`-based Hijri calendar helpers.
2. ✅ `DatePicker.tsx` — `calendar`/`range`/`rangeValue`/`onRangeChange`/`quickOptions`/`helperText`/`errorText`/`requiredField`/`rangeStartLabel`/`rangeEndLabel`/`yearDropdownLabel` props added; trigger CSS rebuilt on `TextInput`'s tokens; everything else preserved.
3. ✅ `DatePicker.module.css` — token-only (verified: `lint:css`); 5 new additive `--fads-sys-datepicker-*` tokens plus direct reuse of `TextInput`'s own tokens for the trigger.
4. ✅ `DatePicker.stories.tsx` — Default, WithValue, Disabled, WithHelperText, WithError, Required, HijriCalendar, AutoDetectArabic, RangeMode, RangeWithQuickOptions, RTL, **OfficialFigmaReference**.
5. ✅ `DatePicker.test.tsx` — 24 tests (up from 13): all 13 pre-existing tests pass unmodified, plus 11 new (helper/error/required, Hijri display, locale auto-detect, range triggers/dual-calendar/two-click-range-build/auto-close, quick options gating + apply, year dropdown).
6. ✅ `hijriCalendar.test.ts` — 7 new tests (conversion accuracy, round-trip, month length, month-add rollover, grid shape/Sunday-first).

## 10. Validation

| Command | Result |
|---|---|
| `npm run typecheck` | ✅ Pass |
| `npm run lint` (eslint + `lint:css`) | ⚠ 2 real findings (`aria-invalid`/`aria-required` unsupported on `role="button"`; 2 unnecessary non-null assertions in the new Hijri test), both fixed, then ✅ Pass |
| `npm run format:check` | ✅ Pass |
| `npm test` | ✅ 545/545 tests pass (46 files) — 24 in `DatePicker.test.tsx` (up from 13) + 7 new in `hijriCalendar.test.ts` |
| `npm run tokens:generate` | ✅ 613 tokens generated |
| `npm run tokens:validate` | ✅ Pass |
| `npm run tokens:check-coverage` | ✅ Defined: 660, Referenced: 560, Missing: 0 |
| `npm run build` | ✅ Pass |
| `npm run build-storybook` | ✅ Pass |

## 11. Approval

Live node verified across all 6 sampled top-level symbols plus the `_Date
field` sub-component, every functional gap found and closed (Hijri, range,
quick options, year dropdown, TextInput-token trigger), accessibility
contract re-verified with zero regressions to the 13 pre-existing tests,
Storybook/tests/validation all pass. Several Needs-Confirmation items remain
non-blocking (spec §10): prev/next month chevrons not independently
re-sampled (response-size limits), typed-input Hijri/Gregorian numeral
detection not implemented (locale-based auto-detect only), the year dropdown
as an interim internal listbox pending the "Dropdown List Item" registry
component, reconstructed range-highlight colors, and RTL range mode extended
by analogy from the fully-sampled LTR range node.
