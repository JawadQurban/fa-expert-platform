# FADS Design System — Phase 5.6 Hardening Report

> **Date:** 2026-07-08 · **Frontend:** `0.4.2` · **Prior review:** `reports/DESIGN_SYSTEM_REVIEW.md` (verdict: **NOT APPROVED**)
> **Objective:** fix only the critical/high-priority issues required to approve the Design System for the Hackathon **landing page**. No new components were built. No pages were built. This is convergence/hardening on the existing 35 components — see §9 for the exact diff footprint.

---

## 1. Scope and method

The prior review (§11, §14) recommended a specific, bounded set of fixes as the path from **NOT APPROVED** to **APPROVED**. This session closed exactly the 9 items the hardening brief named, in the order given, verified each one individually before moving to the next, and ran the full validation suite at the end. Nothing outside that list was touched (see §7 for what was deliberately left alone, and why).

---

## 2. Item-by-item resolution

### 1. Modal background inert/isolation issue — ✅ FIXED
**Before:** `Modal` trapped `Tab` inside itself but did nothing to the rest of `document.body` — a screen reader's browse-mode cursor, or a stray `Tab` past the trap, could still reach page content "behind" the dialog (WCAG 4.1.2).
**After:** `Modal.tsx` now marks every other direct child of `document.body` `inert` while open, and restores them on close. A new `data-fads-portal` marker (added to Modal's own scrim, `ToastProvider`'s viewport, and reused by `DatePicker`'s popover) is explicitly skipped, so other FADS overlays are never accidentally disabled by this logic — a nested Modal or an open toast queue keeps working normally while a Modal is open.
**Tests added:** `Modal.test.tsx` — "marks other document.body content inert while open, and restores it on close"; "does not mark other FADS document.body portals (data-fads-portal) inert".

### 2. DatePicker external value resync issue — ✅ FIXED
**Before:** `visibleMonth`/`focusedDate` were seeded from `value` only via `useState`'s initializer — reopening the popover after the controlled `value` prop changed from outside (parent form reset/load) showed a stale month and roving-tabindex cell.
**After:** a `useEffect` watches `value` and resyncs both pieces of state whenever it changes, using functional updaters compared with `isSameMonth`/`isSameDay` so it's a no-op (no extra render) when the incoming value is already reflected.
**Tests added:** `DatePicker.test.tsx` — "resyncs the visible month and focused day when value changes externally" (renders with July, closes, `rerender`s with October, reopens, asserts the popover now shows October with focus on the 20th).

### 3. DatePicker popover portal issue — ✅ FIXED (required by the review)
The review flagged this as the root cause of the z-index/clipping bug (§4.2: "can render its calendar grid partially obscured behind [a] sticky header"), so it was in scope. **Before:** the popover was an absolutely-positioned sibling inside `.datePicker`, subject to any ancestor's `overflow: hidden` or stacking context. **After:** the popover is rendered via a `document.body` portal (marked `data-fads-portal`), positioned from `triggerRef.current.getBoundingClientRect()` and re-measured on open, window resize, and scroll (capture phase, so scrolling any ancestor container repositions it too). Its z-index moved from `--fads-sys-z-dropdown` (1000, below sticky-header's 1100) to `--fads-sys-z-drawer` (1200) — an existing token, no new one added. The outside-click-to-close handler was updated to also recognize clicks inside the now-portaled popover (previously it only checked the trigger's own container).
**Tests added:** "renders the popover as a document.body portal, not nested inside its own container"; "closes when clicking outside, including outside the portaled popover"; "does not close when clicking inside the portaled popover". The existing a11y test was also fixed to scan `baseElement` instead of `container` — with the popover now portaled outside `container`, the old test was silently no longer scanning the popover's contents at all.

### 4. ToastProvider duplicate empty landmark/nesting issue — ✅ FIXED
**Before:** nesting a `ToastProvider` inside another mounted two `role="region"` viewports; the outer one was permanently empty (since `useToast()` always resolves to the nearest provider) but still announced to assistive tech as a second landmark.
**After:** `ToastProvider` now checks for an ancestor via `useContext(ToastContext)` before deciding what to render. If one exists, it renders only its `children` — no context re-provision, no portal, no viewport — so `useToast()` calls beneath it transparently resolve to the outer provider via normal context bubbling, and exactly one viewport ever exists. A `console.error` (dev-only, `import.meta.env.DEV`) explains the misconfiguration to the consumer.
**Tests added:** `Toast.test.tsx` — "renders only one viewport landmark when nested inside another ToastProvider, and warns".

### 5. Alert / Notification / Toast duplication — ✅ FIXED (met the "API or maintainability risk" bar)
The review rated this moderate-severity specifically because the ~90%-duplicated JSX had **already started drifting** (three different background-token choices for the same title/message/dismiss-button structure) — a live maintainability risk, not just a style preference, so it qualified under the brief's "only if it causes API or maintainability risk" condition.
**Fix:** extracted `composite/_shared/NoticeBody.tsx` — an internal, unexported presentational component (not part of the public `@ds` API) that owns exactly the duplicated structure (title/message/dismiss button) and accepts the caller's own CSS Module object as a `styles` prop, so each of Alert/Notification/Toast keeps its own `.module.css` and its own token choices for its own surface (inline alert vs. page banner vs. floating toast are legitimately different surfaces — that part of the "drift" was a deliberate, defensible design decision per-surface, not a bug, and was left alone). Only the structural duplication was collapsed; each component's public props API, tone-to-role logic, and Toast's timer/pause behavior are unchanged.
**Risk of this refactor:** low — `NoticeBody` is unexported, so it cannot become a new public API surface by accident, and all three consumers' existing tests (18 total) pass unchanged.

### 6. Naming consistency for dismissLabel / closeLabel / removeLabel — ✅ RECONCILED
**Decision:** `dismissLabel` is now the single name for "accessible label of the icon-only button that makes an entire notice/dialog go away" — used consistently by `Alert`, `Notification`, `Toast` (already the majority convention, unchanged), and now also `Modal` (renamed from `closeLabel`). `FileUploader.removeLabel` was **deliberately kept as `removeLabel`**, not merged into `dismissLabel` — it names a different action (deleting one file from a list of many), not dismissing the whole component, and collapsing the two names would create a false equivalence. `NavDrawer.toggleLabel` was already correctly distinct per the review ("semantically distinct, fine") and was left alone.
**Changed:** `Modal.tsx` (`closeLabel` → `dismissLabel`), plus its test and story files.

### 7. RadioGroup onChange signature collision — ✅ FIXED
**Before:** `RadioGroup.onChange: (value: string) => void` shared a name with every sibling input's native-DOM `onChange: (e: ChangeEvent) => void` while having an incompatible signature.
**After:** renamed to `onValueChange`, matching the precedent `Switch.onCheckedChange` already established in the same codebase. `Radio`'s own `onChange` prop (the native per-input passthrough from `ComponentPropsWithRef<'input'>`) was correctly left alone — only the group-level, value-oriented callback needed the rename.
**Changed:** `Radio.tsx` (`RadioGroupContextValue`, `RadioGroupProps`, the context value literal, and the internal `group?.onValueChange?.(value)` call site), `Radio.test.tsx`.

### 8. Field tests and Storybook coverage — ✅ ADDED
**Before:** zero tests, zero stories for the shared label/helper/error-wiring primitive that `TextInput`/`Textarea`/`Select` all depend on.
**After:** `Field.test.tsx` (8 tests: label association via the render-prop id, helper-text `aria-describedby` linking, error `role="alert"` + `aria-invalid` + `aria-describedby`, both helper and error linked simultaneously, `aria-required` + the required indicator (default and custom), the "nothing extra when nothing applies" negative case, and an axe scan) and `Field.stories.tsx` (Default/Required/WithHelper/WithError/CustomRequiredIndicator, rendered around a plain `<input>` since `Field` itself is a render-prop wrapper, not a styled control).

### 9. Stylelint or equivalent CSS enforcement — ✅ ADDED
The review confirmed `docs/DESIGN_CONSTRAINTS.md` §6 claims "Lint rules: ban hard-coded color/px/font, ban left/right" with zero tooling behind it — meeting the brief's "if the docs claim it exists" condition.
**Added:** `frontend/scripts/verify-css-rules.mjs` — a small, dependency-free script (matching the precedent already set by `verify-tokens.mjs`) that scans every component `.module.css` under `design-system/` for (a) hard-coded hex/`rgb()`/`rgba()` color literals (DC-04) and (b) physical-direction properties — `left`/`right`/`margin-left`/`margin-right`/`padding-left`/`padding-right`/`border-left`/`border-right`/`text-align: left|right` (DC-23). Token-definition files (`tokens.css`, `generated/`, `reset.css`, `global.css`) are excluded since raw values are their entire purpose. Wired in as `npm run lint:css`, folded into `npm run lint` (`eslint . && npm run lint:css`) so the exact validation command the hardening brief lists (`npm run lint`) now covers it, and therefore so does the existing CI "Lint" step with no separate CI file change needed.
**Scope decision:** this intentionally does **not** also enforce DC-03/DC-08 (no hard-coded spacing/sizing) — the review's own catalogue of 7 pre-existing minor magic-number values (e.g. `Link.module.css`'s `0.2em`) would have immediately failed a broader check, and those were rated minor/not in this hardening brief's fix list. Enforcing only what's already 100% compliant (hex colors, logical properties — both confirmed zero-violation by the review) gives a clean, real, immediately-active gate rather than a broader one that would need those 7 unrelated items fixed first or silenced with exceptions.
**Verified:** running it against the full, unmodified codebase today reports zero violations, confirming the review's own finding.

---

## 3. What was explicitly not built or changed

Per "do not add unnecessary new components" and "fix only the critical and high-priority issues":
- No new public components. `NoticeBody` is internal/unexported.
- No CSS/spacing magic-number cleanup (7 pre-existing minor values, not in the fix list — tracked as technical debt, see §7).
- No icon-wrapper-through-`Icon`-primitive refactor for `Button`/`Link`/`Tag` (moderate-priority, not in the fix list).
- No `ErrorState` focus-move implementation, no `FileUploader` drag-flicker fix, no `Table` virtualization — none were in the fix list, none affect the landing page's actual component needs (Card grid, Accordion FAQ, Header/Footer/NavDrawer shell, Tabs, Steps).
- No distribution/packaging decision (Q24) — a scope/business decision, not a code defect, and irrelevant to a landing page built inside this same repository (it only matters the day a *second* product needs to consume FADS).
- No token-value/contrast work — still hard-gated on Q3/Q20, unchanged and out of this hardening's control.

---

## 4. Validation

All commands the hardening brief specified were run to completion after every fix and once more at the end:

| Command | Result |
|---|---|
| `npm run typecheck` | ✅ Pass |
| `npm run lint` | ✅ Pass (0 ESLint problems + 0 CSS-rule violations — this command now runs both) |
| `npm run format:check` | ✅ Pass |
| `npm test` | ✅ **190/190 passing**, 41 files (up from 175/40 before this session — 15 new tests: 2 Modal, 4 DatePicker, 1 Toast, 8 Field) |
| `npm run tokens:validate` | ✅ Pass (0 of 102 referenced tokens missing — the DatePicker portal change removed 2 static `inset-*` declarations that referenced a spacing token, hence 103→102) |
| `npm run build` | ✅ Pass |
| `npm run build-storybook` | ✅ Pass (81 story modules) |

---

## 5. Design-system component count

Unchanged at **35** (14 primitives + 2 layout + 15 composite + 4 shell) — this session added zero new public components. One new internal, unexported file (`composite/_shared/NoticeBody.tsx`) and two new build scripts (`verify-css-rules.mjs`, already-existing `verify-tokens.mjs`) support the existing 35, they are not new design-system components themselves.

---

## 6. Governance accuracy restored

Two of the three governance claims the review found unenforced are now actually true:
- *"Lint rules: ban hard-coded color..., ban left/right"* (`DESIGN_CONSTRAINTS.md` §6) — **now true**, enforced by `npm run lint`.
- *"Lint rules:... ban literal UI strings"* — **still not enforced** (out of this hardening's fix list; no ESLint rule exists for DC-24). Not required for landing-page approval since the existing convention (English-default, always-overridable label props) is already followed consistently in code, per both reviews.

---

## 7. Remaining technical debt (unchanged from the review, not addressed this session)

Carried forward from `reports/DESIGN_SYSTEM_REVIEW.md` §12, none of which block landing-page implementation:
- No packaging/distribution model (Q24, open).
- No ESLint rule for DC-24 (hard-coded strings) — convention-enforced only.
- `tokens.ts` vs `generated/tokens.ts` — two unsynchronized typed accessor maps.
- 7 pre-existing minor CSS magic-number values (`Link`, `Checkbox`, `Switch`, `Tooltip`, `Avatar`).
- `Checkbox`/`Switch` have no error/required state support.
- Icon-wrapper and disabled-opacity CSS duplication across `Button`/`Link`/`Tag`/form controls.
- `ErrorState`'s documented focus-move-on-error, `FileUploader`'s drag-enter/leave flicker, `Table`'s lack of row memoization/virtualization.
- Architecture-boundary ESLint rule's pattern list names today's folders, not the governance doc's "features/\*" vocabulary.

None of these were flagged as landing-page blockers by either review, and none were in this hardening's numbered fix list.

---

## 8. Decision

# APPROVED — for Hackathon landing-page implementation

**Scope of this approval:** this is narrower than the prior review's "production-ready, multi-product package" bar (which remains **not** met — see §7 and the original review's §3.4/§3.5 for the distribution-model and full-governance gaps, both explicitly out of scope for a landing page built inside this same repository). Within the scope actually asked for — *can engineering begin building the Hackathon landing page against this design system* — the answer is yes:

- All four critical/high-priority defects the review identified as blocking (Modal isolation, DatePicker resync, DatePicker portal/clipping, ToastProvider nesting) are fixed and independently tested.
- The two moderate-priority items conditionally in scope (Alert/Notification/Toast duplication, naming drift) are resolved with low-risk, backward-compatible-in-spirit changes (the two prop renames — `Modal.closeLabel`→`dismissLabel`, `RadioGroup.onChange`→`onValueChange` — are breaking changes to those two props specifically, but nothing in this repository consumed either yet, since no product pages exist).
- The `Field` test/story gap — the single largest documentation/coverage gap in the primitives layer — is closed.
- The governance/tooling gap that let the original critical token-pipeline defect ship silently is narrowed: CSS-level DC-04/DC-23 enforcement is now real, not just documented.
- Full validation suite is green: typecheck, lint (now including CSS rules), format, 190 tests, token-coverage, build, and build-storybook.

**Conditions that remain true regardless of this approval, and must keep being disclosed on every screen the landing page ships:** visual fidelity is still "pending final DGA token values" (Q3/Q20) — nothing in this hardening session changes that, and no pixel-perfect DGA compliance can be claimed until those values land. This approval is for **implementation to proceed**, not for a final visual/DGA audit, which `CLAUDE.md`'s own workflow correctly reserves for a later phase.
