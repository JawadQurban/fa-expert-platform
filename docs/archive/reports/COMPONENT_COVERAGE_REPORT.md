# Component Coverage Report — Design System (cumulative, through Phase 5C)

> **Date:** 2026-07-08 · **Frontend:** `0.4.0` · **DS component count:** 35 (14 primitives + 2 layout + 15 composite + 4 shell)
> ⚠ **Visual fidelity is "Pending final DGA token values" (Q3/Q20).** All components consume the placeholder token layer only. No pixel-perfect DGA compliance is claimed.

This report is cumulative across the two composite/shell implementation
sessions (Phase 5B and Phase 5C). §1–2 summarize batch history; §3 onward
describe the **current, combined** state of the design system.

## 1. Batch history

**Phase 5B (Frontend 0.3.2)** — finished 9 components that existed as
unfinished, partially broken scaffolding at the start of that session
(failing typecheck/lint, 4 missing CSS files, zero tests/stories, not
exported from `@ds`): **Card** (CMP-07), **Accordion** (CMP-08), **Tabs**
(CMP-09), **Alert** (CMP-23 Inline Alert), **Notification** (CMP-24 Banner),
**Header** (CMP-01), **Footer** (CMP-03), **Breadcrumbs** (CMP-04),
**NavDrawer** (CMP-02). Added the `useFocusTrap` hook.

**Phase 5C (Frontend 0.4.0)** — built 10 new composite components from
scratch (no prior scaffolding): **Loading** (CMP-31), **Pagination**
(CMP-28), **Steps** (CMP-21), **EmptyState** (FADS-authored), **ErrorState**
(FADS-authored, composes Alert), **Toast + ToastProvider/useToast**
(CMP-22), **Modal** (CMP-25), **Table** (CMP-27), **FileUploader** (CMP-20),
**DatePicker** (CMP-19). Extended `useFocusTrap` to restore focus to the
trigger on close (now shared by `NavDrawer`, `Modal`, and `DatePicker`'s
popover).

## 2. Components reused / not duplicated

- `Link` primitive — reused inside `Header`'s `nav` list (Phase 5B).
- `Alert` (CMP-23) — reused as-is inside `ErrorState`, per
  `SCREEN_SPECIFICATIONS.md`'s explicit instruction to compose the existing
  Inline Alert rather than invent a new error-surface shape.
- `Button`, `Tag`, `Icon` primitives — reused inside `ErrorState`,
  `FileUploader`, and the `Table`/`EmptyState` Storybook stories.
- `useIsRtl` (`providers/DirectionProvider`) — reused by `Tabs` (5B) and
  `DatePicker` (5C) for RTL-aware Arrow-key direction.
- `useFocusTrap` (`hooks/`) — reused by `NavDrawer` (5B), then by `Modal` and
  `DatePicker`'s popover (5C) without any component reimplementing focus
  trapping/restoration.
- `formatDate`-style explicit `locale` prop convention (`utils/format.ts`) —
  followed by `DatePicker` (accepts `locale` as a prop rather than reading
  `useLocale()` internally, keeping the design system decoupled from the
  app's specific i18n/react-i18next setup, matching existing precedent).

## 3. Current composite/shell inventory

| Layer | Built | Component (ID) |
|---|---|---|
| Composite | 13 of 16 catalog IDs | Card (07), Accordion (08), Tabs (09), Date Picker (19), File Uploader (20), Steps (21), Toast (22), Alert/Inline Alert (23), Notification/Banner (24), Modal (25), Table (27), Pagination (28), Loading (31) |
| Composite | +2 FADS-authored | EmptyState, ErrorState (not numbered DGA `CMP-*` items) |
| Composite | 3 remaining | Content Switcher (10), Menu (11), Rating (29) |
| Shell | 4 of 6 | Header (01), Nav Drawer (02), Footer (03), Breadcrumbs (04) |
| Shell | 2 remaining, blocked | Search (33, ⚠Q10), Digital Stamp (32, ⚠Q5) |
| Patterns | 0 of 6 | PAT-01…PAT-06 not started |

## 4. Storybook coverage

All 35 design-system components have a `*.stories.tsx` with a `Default`
story plus tone/state/variant stories where applicable (e.g. `DatePicker`:
Default/WithValue/Disabled; `FileUploader`: Empty/WithFiles/Disabled/
Interactive; `Table`: Default/Sortable/Empty; `Toast`: Info/Success/Warning/
Error via `ToastProvider` decorator; `Modal`: Default/DestructiveConfirmation).
Global RTL/LTR preview is via the Storybook locale toolbar rather than a
separate per-component "RTL story," matching the convention used throughout.
`npm run build-storybook` passes (81 story modules).

## 5. Test coverage

175 unit + axe tests across 40 files (up from 116 after Phase 5B, 67 after
Phase 5A). New in Phase 5C: 59 tests across 10 files, covering rendering,
keyboard interaction (Enter/Space/Arrow/Home/End/Escape/PageUp/PageDown/
Tab-trap), drag-and-drop + native-input fallback, auto-dismiss timers with
pause-on-hover (`vi.useFakeTimers` + `fireEvent`, avoiding the fake-timer /
`user-event` interaction hang), focus restoration after modal/popover close,
RTL-specific keyboard direction (`DatePicker`'s Arrow keys under
`locale: 'ar'` vs `'en'`), and `expectNoA11yViolations` (axe,
`color-contrast` disabled per project policy pending real tokens) for every
component. `npm test` passes (40 files, 175 tests).

## 6. Accessibility coverage

- Each component carries the ARIA roles/attributes its
  `COMPONENT_INVENTORY.md` contract requires: `role="dialog"`/`aria-modal`/
  focus trap for `Modal`; `role="grid"`/`row`/`columnheader`/`gridcell` for
  `DatePicker`; `role="status"`/`aria-live="polite"` for `Loading` and
  `Toast`; `aria-sort` for sortable `Table` columns; `nav` landmark +
  `aria-current="page"` for `Pagination`; `aria-current="step"` for `Steps`.
- Three real a11y bugs were caught by axe **during this batch** and fixed
  before merging (not shipped, not just noted):
  1. `Card`-style `role="button"` on a non-`<div>` element is not the issue
     here, but the equivalent pitfall recurred: `FileUploader`'s file list
     was first drafted as `<ul role="status">`, which axe flagged as an
     `aria-allowed-role` violation (and broke the list's own
     `listitem`/`list` structure for its children) — fixed by dropping the
     role and keeping only `aria-live="polite"` on the real `<ul>`.
  2. `DatePicker`'s weekday-header cells were briefly `aria-hidden="true"`,
     which strips them from the accessibility tree entirely — since they
     were the *only* children of their `role="row"`, this tripped axe's
     `aria-required-children` rule (a `row` needs an accessible cell/
     columnheader child). Fixed by removing `aria-hidden` — the weekday
     abbreviations are real structural information, not decorative.
  3. `DatePicker`'s day buttons had `aria-selected` directly on a plain
     `<button>`, which is not a supported ARIA property for the implicit
     `button` role (`jsx-a11y/role-supports-aria-props`, caught by lint
     before the test even ran) — moved `aria-selected` to the wrapping
     `role="gridcell"` div instead, which does support it.
- `color-contrast` axe checks remain disabled (jsdom limitation) pending
  real DGA token values (Q3), consistent with the rest of the design system.

## 7. Components pending (not built)

| Layer | Components | Notes |
|---|---|---|
| Composite (3) | Content Switcher (CMP-10), Menu (CMP-11), Rating (CMP-29) | Not requested in this session's scope; no blockers, just not yet built |
| Shell (2) | Search (CMP-33), Digital Stamp (CMP-32) | Both blocked on open questions (Q10, Q5) |
| Patterns (6) | PAT-01…PAT-06 | Not started; depend on composite/shell completion per `COMPONENT_INVENTORY.md §8` build order |

## 8. Remaining blockers

- 🔴 **Q3** (DGA token values) / **Q20** (acquisition route) — unchanged hard blockers; all styling in every batch is placeholder-token-only.
- 🟡 **Q5** (digital stamp) / **Q10** (search scope) — block the 2 remaining shell components.
- No new blockers introduced by this batch.

## 9. Remaining technical debt

- **Header (CMP-01) is still not a full Navigation Header** (carried over from Phase 5B) — title/subtitle/actions banner + a flat `nav` list, not multi-level navigation.
- **Toast/Alert/Notification are not yet unified under a shared "notification system" abstraction** (`PAT-06`) — all three now exist (CMP-22/23/24) but there's no shared queue/stacking layer coordinating them; each manages its own lifecycle independently. Worth revisiting once `PAT-06` is scoped.
- **`DatePicker` always renders weeks Sunday-first** — a known simplification (documented in its JSDoc/`dateGrid.ts`), not a DGA-verified week-start convention. Revisit once Q3/Q20 land.
- **`DatePicker` has no min/max date range restriction** — out of scope for this batch; the Hackathon's actual date-field requirements aren't confirmed (no open question currently tracks this, so it isn't blocking, just unimplemented).
- **`NavDrawer` still has no visual scrim/backdrop** (carried over from Phase 5B).
- **`Table`'s cell-level Arrow-key navigation is not implemented** — explicitly marked optional in `INTERACTION_SPECIFICATION.md` §4, so this is a deliberate scope decision, not a gap.

## 10. Components requiring official DGA review

All 35 design-system components require a visual/contrast re-audit once
official DGA Platforms Code token values are integrated (Q3/Q20). No
component should be treated as visually final. `DatePicker` additionally
needs DGA confirmation of the actual required week-start convention and
whether a min/max date range is part of the official pattern.

## 11. Future enhancements (not blocking, not started)

- Multi-level navigation support for Header once product routing/IA is finalized (carried over).
- Backdrop/scrim option for NavDrawer (carried over).
- Shared notification queue/coordination layer once `PAT-06` is scoped (Toast/Alert/Notification all exist now but aren't unified).
- `DatePicker`: locale-aware week-start day, min/max date constraints, year-level navigation (Shift+PageUp/PageDown).
- `Table`: optional cell-level Arrow-key navigation (explicitly deferred, not required).
- Content Switcher (CMP-10), Menu (CMP-11), Rating (CMP-29) — next composite batch.
