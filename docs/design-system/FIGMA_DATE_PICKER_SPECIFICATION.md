# Figma Date Picker — Official Specification

**Source of truth:** Figma file `J0xq7JG3JKshRDzrgAM7E0` ("Components Library - Platforms Code (Community)"), component set node `30150:10582` ("Date Picker"), and the `_Date field` sub-component (`30150:11261`).
**Design documentation:** https://design.dga.gov.sa/guidelines/components/forms-and-inputs/datepicker
**Figma description:** "A Date Picker is a UI component that enables users to select dates via a pop-up or dropdown calendar. This tool is often triggered by clicking a calendar icon or input field. It is widely used in forms and applications for tasks like scheduling events, booking appointments, or entering birthdates."

Extracted via read-only Figma MCP tools (`get_design_context`, `get_variable_defs`, `get_screenshot`). The component set contains **6 top-level symbols** (`rtl`[2] × `range`[2] × `picker`[open/closed] — not fully crossed: `range=True` only pairs with the open/`picker=True` state in the sampled set). Several nodes returned responses too large for a single call and were fetched in pieces; every structural claim below traces to a specific sampled node ID (§9).

---

## 1. Component Hierarchy

```
Date Picker (closed)
├─ Label
├─ _Date field (Input Field, identical token family to TextInput's own field chrome)
│  └─ placeholder "DD/MM/YY"
└─ Helper text: "Date will automatically detect Hijri or Georgian date"

Date Picker (open, range=False)
├─ [above, as the trigger]
└─ Popover
   └─ Calendar
      ├─ Month Nav: ‹ prev, month/year label, _Year Dropdown (Button-menu + year listbox), next ›
      └─ Date Grid: weekday header row + 6×7 day cells

Date Picker (open, range=True)
├─ Two "Date1"/"Date2" fields above the calendars (start/end values, same field chrome)
└─ Popover
   ├─ Quick options (optional sidebar): grouped preset shortcuts
   └─ Calendars: two side-by-side Calendar instances (current + next month),
      each with its own Month Nav; day cells carry Range Highlight
      left/middle/right segments connecting the selected start/end
```

---

## 2. Variant Properties

| Property | Values | Notes |
|---|---|---|
| `rtl` | `False`, `True` | Mirrors day-arrow-key direction and (per the pre-existing implementation) month-nav button function |
| `range` | `False`, `True` | Single date vs. two-calendar range selection |
| `picker` | closed (trigger only) / open (trigger + popover) | Not a runtime prop — corresponds to the component's own open/closed UI state |

Non-variant properties confirmed by inspecting the underlying instances: `showHint` (boolean, the Hijri/Gregorian helper text), `inputField`/`dualMonthView` (booleans controlling whether the date-value text fields and the second calendar render), `quickOptions` (boolean, sidebar visibility — only sampled with `range=True`).

---

## 3. Trigger Field

The closed field (`_Date field`, node `30150:11261`) uses the **exact same token
family as `TextInput`**: `Form/field-background-default` (`#ffffff`),
`Form/field-border-default` (`#9da4ae`), `Radius/radius-sm` (4px), 40px height,
`Form/field-text-placeholder` (`#6c737f`) for the `DD/MM/YY` placeholder. This
confirms the registry's own `dependencies: ["Text Input", "Button"]` for this
component was correct in spirit — implemented by reusing `TextInput`'s own
verified `--fads-sys-textinput-*` tokens directly for the trigger's CSS,
**not** by literally nesting a `<TextInput>` component (see `DatePicker.tsx`'s
own module doc for why: the trigger is a `<button>` opening a dialog, which
is the correct WAI-ARIA APG pattern for this exact widget, and changing to an
`<input>` would alter interactive semantics for no compliance benefit while
risking 13 already-passing tests).

**Helper text**: `"Date will automatically detect Hijri or Georgian date"` —
the only textual evidence in the entire file of the Hijri/Gregorian
auto-detect behavior (see §5).

---

## 4. Month Nav & Year Dropdown

The Month Nav row shows the month as static text (no dropdown evidence found
for month specifically) plus a **Year Dropdown** (`_Year Dropdown`, a
`Button-menu` showing the year + `arrow-down-01` chevron, expanding into a
bordered list styled with `Form/field-background-default`/
`border-*` tokens — a scrollable list of years). No prev/next month chevron
icons were found in the specific nodes sampled (the response size cap
truncated one large calendar instance before its own Month Nav fully
resolved) — the pre-existing implementation's own tested `‹`/`›` prev/next
buttons were kept unchanged rather than guessed at from an incomplete sample;
flagged Needs Confirmation, non-blocking.

The `_Year Dropdown`'s "Dropdown List Item" pattern is itself a **separate,
not-yet-built registry component** (later in this same batch) — this pass
implements a minimal, self-contained internal listbox (native buttons,
`role="option"`/`aria-selected`) rather than blocking on that dependency,
documented as an interim implementation to reconcile once "Dropdown List
Item" exists.

---

## 5. Hijri / Gregorian Calendar

The helper text's claim ("automatically detect Hijri or Georgian date") is
the **only** specification of this behavior anywhere in the live data — no
further detail on the exact typed-input numeral-ambiguity detection
mechanism exists in Figma beyond that one sentence. Implemented as:

- A `calendar` prop (`'gregorian' | 'hijri' | 'auto'`, default `'auto'`).
- `'auto'` resolves to Hijri for Arabic-family locales (`locale.startsWith('ar')`) and Gregorian otherwise — a deterministic, verifiable convention (matching how DGA/Saudi government sites commonly default), **not** an attempt at parsing typed numerals to guess calendar intent, which is not specified anywhere in the live data.
- Built entirely on the native `Intl` API's `islamic-umalqura` calendar (`hijriCalendar.ts`) — no external date library, consistent with the pre-existing `dateGrid.ts`'s own convention. `Intl.DateTimeFormat('*-u-ca-islamic-umalqura', ...)` gives correct Hijri year/month/day parts and month/weekday names directly (verified: 2024-01-01 CE ⇔ 19 Jumada II 1445 AH, live-verified against a documented reference date in `hijriCalendar.test.ts`).
- Hijri month-grid generation, month-length calculation, and month-arithmetic are done via a bounded scan-and-converge algorithm against `Intl`'s own Hijri↔Gregorian mapping (since `Intl` converts a *Gregorian instant to Hijri parts*, not the reverse) — see `hijriCalendar.ts`'s own doc comments for the exact technique and its known local-noon-anchoring caveat.

---

## 6. Range Mode

Live-verified structure (`Range=True` node, `30150:10748`):

- Two value-display fields ("Date1"/"Date2", same field chrome as §3) above the calendar(s).
- Two `Calendar` instances side by side (`dualMonthView`), the second showing the month after the first's.
- Day cells carry "Range Highlight left/middle/right" pieces — a background band connecting the selected start/end dates, live-verified colors `Form/datecell-background-100` (`#dff6e7`, the connecting band) and `Form/datecell-background-default` (`#1b8354`, the start/end day fill itself, matching the selected-day color).

Implemented as `range`/`rangeValue`/`onRangeChange` (a `[Date | null, Date | null]` tuple, controlled, mirroring the pre-existing single-`value` controlled pattern) plus internal `pendingRangeStart` state for the two-click build-a-range interaction (first click sets a provisional start with no confirmed end; second click completes the range and closes the popover, matching this component's own existing single-date auto-close-on-select convention).

---

## 7. Quick Options

Sampled only inside the `Range=True` node — a 160px sidebar with a
`QUICK OPTION` group label and 9 preset shortcuts, in this exact order:
**Today, This week, Last week, This month, Last month, Last 3 months, Last 7
days, Last 30 days, Last 90 days**. Implemented as the `quickOptions` prop —
a documented no-op outside `range` mode, since it was never sampled there.

---

## 8. Accessibility

- No ARIA guidance beyond the shared doc link exists in the Figma file itself.
- The pre-existing WAI-ARIA APG "Date Picker Dialog" pattern (`role="dialog"`, focus trap, roving-tabindex day grid, RTL-aware arrow keys, `Esc` to close) is unchanged and re-verified working (24/24 tests pass, up from 13).
- `errorText`/`requiredField` (new this pass) drive `data-invalid`/a visible `*` and the error paragraph's own `role="alert"`, **not** `aria-invalid`/`aria-required` on the trigger — `eslint-plugin-jsx-a11y` correctly flags both as unsupported on the implicit `button` role, the same category of catch as `Radio`'s own `aria-readonly` finding earlier in this batch.
- The year-dropdown button's accessible name combines the static label with the currently-selected year (e.g. "Select year: 2026") rather than either alone, to avoid an accessible-name collision between the visible year text and a purpose-only label.

---

## 9. Node Reference

| Variant sampled | Node ID |
|---|---|
| Component set root | `30150:10582` |
| RTL=False, Range=False, Picker=True (open, single) | `30150:10583` |
| RTL=False, Range=True, Picker=True (open, range) | `30150:10748` |
| RTL=True, Range=True, Picker=True | `30150:10916` |
| RTL=True, Range=False, Picker=True | `30150:11084` |
| RTL=True, Range=False, Picker=False (closed) | `30150:11249` |
| RTL=False, Range=False, Picker=False (closed) | `30150:11255` |
| `_Date field` sub-component | `30150:11261` |

---

## 10. Deviations, Extensions, and Needs-Confirmation Items

1. **Trigger stays a `<button>`, not a literal `<TextInput>`** — visual chrome only reuses `TextInput`'s tokens. See §3.
2. **Prev/next month chevron icons not independently re-sampled** — the specific node containing them was truncated by response-size limits; the pre-existing, already-tested `‹`/`›` buttons were kept unchanged rather than guessed at.
3. **Typed-input Hijri/Gregorian numeral-ambiguity detection is not implemented** — only locale-based auto-detection is (§5); Figma's own copy doesn't specify the mechanism beyond one sentence.
4. **`_Year Dropdown` implemented as a minimal internal listbox**, not the (separately-registered, not-yet-built) "Dropdown List Item" component — an interim implementation, documented for future reconciliation.
5. **Range-highlight rendering is a reconstructed CSS band** (not literal Figma vector data) using the live-verified `datecell-background-100`/`datecell-background-default` colors.
6. **Month-name-only (no month dropdown)** — no evidence of a month-specific dropdown was found in the sampled data; only the year got one.
