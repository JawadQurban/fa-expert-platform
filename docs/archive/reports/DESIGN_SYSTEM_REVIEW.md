# FADS Design System — Production Readiness Review

> **Reviewer stance:** Independent Principal Frontend Architect audit. This review does not credit intent or prior sign-off — every claim below was re-verified against the actual repository state as of this review.
> **Date:** 2026-07-08 · **Frontend:** `0.4.0` · **DS version:** `0.1.0` (pre-token-adoption)
> **Scope:** all 35 design-system components (14 primitives, 2 layout, 15 composite, 4 shell), the token pipeline, providers/hooks, Storybook, test suite, tooling/CI, and governance documentation.
> **Method:** full-file reads of every component (`.tsx`/`.ts`/`.module.css`/`.test.tsx`/`.stories.tsx`), the token generation pipeline, ESLint/Vite/TS/CI config, and every governance doc's enforcement claims — cross-checked against what the tooling actually does, not what it says it does. Every validation script in the repo was run to completion.
>
> ⚠ **Update (Phase 5.6 hardening, Frontend `0.4.2`):** the critical/high-priority items this review flagged as blocking — Modal background isolation, DatePicker external-value resync, DatePicker popover portal/z-index, ToastProvider nesting, the Alert/Notification/Toast duplication, the dismissLabel/closeLabel naming drift, the RadioGroup onChange collision, Field's missing tests/stories, and the missing CSS enforcement — have all been resolved. See `reports/DESIGN_SYSTEM_HARDENING_REPORT.md` for the full resolution detail and the updated (narrower-scope) **APPROVED** decision for Hackathon landing-page implementation. The findings below are left as originally written (a review is a point-in-time record); items marked ~~RESOLVED~~ inline note where a fix now exists.

---

## 0. Disclosure: a critical defect was found and fixed during this review

Per the review brief ("do not modify implementation unless a critical issue is found"), one issue met that bar and was fixed **during** this review, not before it. It is disclosed here in full because the rest of this document evaluates the **post-fix** state of the repository — readers should not assume this defect was already handled.

**What was wrong:** `frontend/src/design-system/tokens/global.css` loads `./generated/tokens.css` only. The hand-written `frontend/src/design-system/tokens/tokens.css` — which still carried every component/interactive/layout placeholder token added across Phases 5A–5C (control heights, disabled opacity, elevation/shadow, modal overlay color, field colors, icon sizes, selection/switch sizing, container widths, table colors) — was **never imported anywhere** and was dead code. Independently verified: a repo-wide scan found **103 distinct `--fads-*` custom properties referenced** by component stylesheets, of which **39 resolved to nothing** in the file actually loaded by the app, Storybook, and every test. There were **zero CSS fallback values** (`var(--x, fallback)`) anywhere to soften this. Concretely, this meant (in a real browser): every form control's height collapsed to content size, every disabled state looked identical to its enabled state, Modal had no scrim/overlay color, NavDrawer/Modal/Tooltip had no drop shadow, and Table/Checkbox/Radio/Switch/DatePicker sizing tokens were all undefined. Additionally, `generated/tokens.css`'s own semantic layer referenced `var(--fads-ref-neutral-0)` in five places, but its own Figma-sourced neutral scale starts at shade `25` — `neutral-0` was never defined by either file, an internal dangling reference independent of the import-graph bug.

**Root cause:** `scripts/generate-tokens.mjs` was written to emit only the "foundation" token layer (the content of the *original* `tokens.css` before Phase 5A–5C additions). Nobody re-pointed `global.css` at the merged output, and nobody extended the generator to cover the tokens added afterward — two parallel token surfaces silently diverged, and no tooling existed to catch it (see §5).

**Fix applied (minimal, non-component):**
1. `scripts/generate-tokens.mjs` — the 5 `var(--fads-ref-neutral-0)` semantic references now point to `var(--fads-ref-neutral-25)`, the actual lightest shade in the adopted Figma scale (not an invented value).
2. `frontend/src/design-system/tokens/tokens.css` — trimmed to contain **only** the additive placeholder tokens not covered by the generator (its stale "sourced from Figma" header claim, which was never true of this file's own content, is corrected).
3. `frontend/src/design-system/tokens/global.css` — now imports `./generated/tokens.css` **then** `./tokens.css`, so every token a component references resolves.
4. New `frontend/scripts/verify-tokens.mjs` + `npm run tokens:check-coverage`, wired into `npm run tokens:validate` and now a required step in `.github/workflows/ci.yml` — it statically diffs every `var(--fads-*)` reference in `.module.css` files against what's actually defined and fails the build on any gap. This is the control that should have existed from the start; its absence is discussed as a governance/tooling finding in its own right (§5, §9).

**Verification:** re-ran `typecheck`, `lint`, `format:check`, `test` (175/175 passing), `tokens:validate` (now includes the new coverage gate, passing — 0 missing of 103 referenced tokens), `build`, and `build-storybook` — all green. The production CSS bundle grew from 6.79 kB to 9.52 kB gzip, which is the expected, correct signal: the previously-orphaned placeholder tokens are now actually shipping.

No other implementation changes were made. Everything else below is reported, not fixed, per the review brief.

---

## 1. Executive summary

FADS is a well-structured, honestly-documented, mid-stage design system with real accessibility and RTL discipline baked into most individual components. The layered architecture (tokens → primitives → composite → shell → patterns) is sound and the "no DGA values invented" discipline has been maintained consistently in documentation. However, it is **not production-ready as a distributable, multi-product package** today, for reasons that are structural rather than cosmetic:

- It nearly shipped with the majority of its visual design silently broken (§0) — caught only by this review, not by any existing test or lint gate.
- It has no packaging/distribution story at all (§3.4) — despite `design-system/README.md` explicitly claiming to be "consumed by all Financial Academy products," there is no `sideEffects`/`exports`/build-lib output; it is a single private Vite app with path aliases that only resolve inside this one repo. **Still open** — a scope/business decision (Q24), not addressed by Phase 5.6 hardening.
- Three governance claims in `docs/DESIGN_CONSTRAINTS.md` §6 ("ban hard-coded color/px/font," "ban left/right," "ban literal UI strings") have **no enforcing tooling whatsoever** — compliance today is 100% due to author discipline, not gates. There is no stylelint anywhere in the toolchain. ✅ **PARTIALLY RESOLVED (Phase 5.6):** the color and left/right rules are now enforced via `npm run lint:css` (folded into `npm run lint`); the "no literal UI strings" rule remains unenforced.
- Real, user-facing API naming has drifted batch-to-batch with no reconciliation: four different names for "accessible label of a small icon-only button" (`dismissLabel`/`closeLabel`/`removeLabel`/`toggleLabel`), and `RadioGroup.onChange` collides in signature with the native-DOM `onChange` every sibling input component uses. ✅ **RESOLVED (Phase 5.6):** `Modal.closeLabel` renamed to `dismissLabel`; `RadioGroup.onChange` renamed to `onValueChange`. `FileUploader.removeLabel` was deliberately kept distinct (different action, not merged) and `toggleLabel` was already correctly distinct — see the hardening report §2 item 6 for the rationale.
- Alert/Notification/Toast are ~90% copy-pasted with the copy already drifting (three different background-token choices for what should be one visual concept). ✅ **RESOLVED (Phase 5.6):** structural duplication (title/message/dismiss-button JSX) extracted into an internal, unexported `composite/_shared/NoticeBody.tsx`; each component keeps its own CSS Module and token choices for its own surface.
- Two real, currently-shipping bugs exist in `DatePicker` (doesn't resync when `value` changes externally; popover isn't portaled, so it can render clipped behind sticky headers/drawers) and one in `Modal` (no `inert`/`aria-hidden` isolation of background content — a real WCAG 4.1.2 gap for the one component whose entire job is being an isolated dialog). ✅ **ALL THREE RESOLVED (Phase 5.6)** — see `reports/DESIGN_SYSTEM_HARDENING_REPORT.md` §2 items 1–3.
- Test and Storybook coverage is broad (175 tests / 40 files; 34 of 35 components have stories) but uneven in depth, and the one component with **zero** tests and **zero** stories (`Field`) is the shared a11y-wiring primitive that three other primitives depend on. ✅ **`Field` gap RESOLVED (Phase 5.6)** — 8 tests + 5 stories added; the depth-unevenness between other near-identical siblings (e.g. TextInput/Textarea) is unchanged.

None of this is a rebuild-from-scratch situation. The primitives layer in particular is close to solid. But an executive sign-off on "production-ready, ship to N products" would be premature. See §11 for the full decision rationale.

---

## 2. Scorecard

| Dimension | Score | Basis |
|---|---|---|
| **Overall score** | **70 / 100** | Weighted below; pulled down by the critical defect (now fixed, but its existence is a process finding), the packaging gap, and unenforced governance |
| **Production readiness** | **65%** | Structurally sound, but not shippable as a multi-product package today; still fundamentally gated on Q3/Q20 (real DGA values) for any visual-compliance claim, independent of this review |
| **Accessibility score** | **78 / 100** | Strong per-component ARIA/keyboard implementation; real gaps: Modal background isolation, `ErrorState`'s documented-but-unimplemented focus-move, zero automated contrast checking (structurally deferred, not just untested), Field untested |
| **Maintainability score** | **65 / 100** | Alert/Notification/Toast duplication, disabled-CSS and icon-wrapper duplication (5 occurrences across 3 components each), the token dead-file confusion this review just resolved, inconsistent barrel-file (`index.ts`) usage in primitives |
| **Scalability score** | **60 / 100** | No packaging/distribution model, no stylelint, `Table` has no row memoization or virtualization; the primitive/composite/shell layering itself would scale content-wise if these were addressed |
| **Developer experience score** | **72 / 100** | Excellent TypeScript coverage and JSDoc; undermined by prop-naming drift (`label`/`aria-label`/`legend`/`name` for the same concept; `dismissLabel` vs `closeLabel` vs `removeLabel`; `onChange` signature collision on `RadioGroup`) |
| **Storybook coverage** | **~92%** (34 of 35 wired to `.stories.tsx`; Field is the sole gap) | No component demonstrates explicit RTL vs LTR side-by-side despite several components making direct RTL-mirroring claims in their own JSDoc |
| **Testing coverage** | **175 tests / 40 files**, ~92% of components tested (Field untested) | Depth is uneven between near-identical siblings (TextInput 6 tests vs Textarea 3); several documented behaviors are untested (Modal background isolation, DatePicker external-value resync, FileUploader drag-sequencing, RadioGroup arrow-keys, ErrorState focus-move) |

Scoring method: each dimension scored 0–100 by the reviewer against what a production design system intended for reuse across multiple products should deliver, not against this project's own prior self-assessment. "Production readiness" is a holistic estimate distinct from the arithmetic mean of the other scores, since packaging and governance-enforcement gaps block "production" status somewhat independent of code quality.

---

## 3. Architecture review

### 3.1 Layered architecture — sound in principle, consistently documented
The L0 (DGA) → L1 (tokens) → L2 (components) → L3 (patterns, not yet built) → L4 (product consumers) model in `docs/DESIGN_SYSTEM_SPECIFICATION.md` is a reasonable, industry-standard shape, and the "one component per DGA element, no page-specific forks" principle (DC-21) is genuinely followed — no evidence of duplicated per-page component forks was found anywhere in the audit.

### 3.2 Folder structure — clean, with one inconsistency
`design-system/{tokens,providers,primitives,layout,composite,shell,patterns}` is a clear, browsable structure. The one structural inconsistency: only 6 of 16 primitive folders (`Button`, `Field`, `Link`, `Tag`, `TextInput`, `Textarea`) have their own `index.ts`; the other 10 do not, forcing `primitives/index.ts` to import inconsistently (`from './Button'` vs `from './Select/Select'` vs `from './Avatar/Avatar'`) with no documented rule for which pattern a new component should follow.

### 3.3 Public API — tree-shakeable, but with real naming drift
`composite/index.ts`, `shell/index.ts`, `primitives/index.ts`, `layout/index.ts`, and the top-level `design-system/index.ts` are all-named-export barrels with zero default exports, zero module-level mutable state (confirmed via repo-wide grep — `ToastProvider`'s id counter is a per-instance `useRef`, not module scope), and zero import-time side effects. This is a genuine strength for tree-shaking. The API surface itself, however, has drifted:
- Four names for one concept (small icon-only dismiss/close button's accessible label): `dismissLabel` (Alert/Notification/Toast), `closeLabel` (Modal), `removeLabel` (FileUploader), `toggleLabel` (NavDrawer — semantically distinct, this one is fine).
- `RadioGroup.onChange: (value: string) => void` collides in **name** with every sibling input's native-DOM `onChange: (e: ChangeEvent) => void` while having an incompatible signature. `Switch.onCheckedChange: (checked: boolean) => void` is the correct precedent already established in the same codebase and should be the template (`RadioGroup` should be `onValueChange`).
- `label` means "visible rendered label text" on Field/TextInput/Textarea/Select/Checkbox/Radio/Switch, but "ARIA-only accessible name, never rendered" on `Icon`, and `RadioGroup` uses `legend` and `Avatar` uses `name` for what a consumer would reasonably expect to be the same concept.
- Overlay-visibility control philosophy differs between `Modal` (`onClose: () => void`, fire-once) and `NavDrawer` (`onOpenChange?: (open: boolean) => void`, two-way) with no documented rule for which composites get which shape.

### 3.4 Distribution/packaging — not addressed; this is the single biggest scalability gap
`frontend/package.json` has `"private": true`, no `sideEffects` field, no `exports` map, no `main`/`module`/`types` fields, and no library build target in `vite.config.ts` (only the app build). The `@ds` alias (and siblings `@app`, `@i18n`, `@lib`, `@hooks`, `@utils`, `@layouts`) is defined in exactly two places — `vite.config.ts` and `tsconfig.app.json` — and resolves only inside this repository. `docs/DESIGN_SYSTEM_SPECIFICATION.md` §5 itself flags this honestly as **Q24, still open**: "Distribution model (in-repo folder vs internal npm package vs monorepo) is undecided." That flag is correct and should be treated as a hard blocker on any "production-ready, multi-product" claim — today, a second product cannot consume FADS without literally copying this repository's `frontend/src/design-system` folder and rebuilding the alias config by hand.

### 3.5 Governance vs. actual tooling — three specific claims do not hold up
`docs/DESIGN_CONSTRAINTS.md` §6 ("Enforcement plan") states: *"Lint rules: ban hard-coded color/px/font, ban left/right, ban literal UI strings"* and *"Architecture tests: features/\* may import from design-system/\* but not vice-versa."* Verified against `eslint.config.js` in full:
- **No stylelint or any CSS-linting tool exists anywhere** in the toolchain (confirmed absent from `package.json` devDependencies and the whole repo tree). DC-03 (tokens only) and DC-23 (no left/right) have **zero automated enforcement** — and this is exactly the class of gap that let §0's critical defect ship undetected.
- **No custom ESLint rule bans literal UI strings** (DC-24) — no `no-restricted-syntax` targeting JSX text, no i18n-lint plugin dependency. Every "no hardcoded strings" claim made in component JSDoc across the codebase is true only by author discipline.
- The architecture-boundary rule **does exist** and is correctly implemented (`eslint.config.js`, a `no-restricted-imports` rule scoped to `src/design-system/**` blocking `@app/*`, `@layouts/*`, `@/pages/*`, `@/app/*`, `@/layouts/*`) — but the governance doc's own vocabulary ("features/\*") names a directory (`src/features/`) that does not exist in this repository at all. The rule protects the directories that do exist; if a `features/` folder is added later under a different alias, this rule would silently not cover it.

### 3.6 Future compatibility with Platforms Code updates
The `--fads-ref-*` → `--fads-sys-*` → component tier separation is the right shape for absorbing future DGA token updates without touching component code — *when it works*. §0's finding shows that shape had already partially broken down in practice (two competing token files). With the fix applied and the new `tokens:check-coverage` CI gate, this compatibility story is now credible going forward; before this review it was not, silently.

---

## 4. Component consistency findings (condensed; full detail available on request)

### 4.1 Primitives + layout (16 components)
- **Ref handling is split roughly in half** with no documented rule: 8 of 16 support a consumer `ref` (React 19 plain-prop style, no legacy `forwardRef` anywhere — that much is modern and consistent); the other 8 (`Typography`, `Icon`, `Field`, `Switch`, `Tooltip`, `Avatar`, `Container`, `Section`) do not, some for good reason (polymorphic `as`), some because they have a fully bespoke prop interface with no ref field and no `...rest` passthrough at all (`Switch`, `Tooltip`, `Avatar` cannot accept extra `data-*`/`aria-*`/`id` today).
- **Duplicated "decorative icon wrapper" markup, 5 occurrences across 3 components** (`Button.iconStart`/`iconEnd`, `Link.iconEnd`, `Tag.iconStart`) — none of them compose the `Icon` primitive that exists specifically to enforce DC-09 size/tone rules, so a consumer can pass an arbitrarily-sized raw SVG into any of these slots and nothing enforces the constraint `Icon` was built for.
- **Duplicated disabled-opacity CSS, 5 near-identical blocks** (`Button`, the shared `control.module.css`, `Checkbox`, `Radio`, `Switch`) — notable because the codebase already demonstrates the alternative (the focus-ring rule is centralized exactly once in `global.css`), so the precedent for centralizing this exists but wasn't applied here.
- **Feature-completeness gap:** `Checkbox` and `Switch` have no `errorText`/required-state concept at all, while `TextInput`/`Textarea`/`Select`/`RadioGroup` all do — a plausible DC-12 compliance gap if the DGA spec has an Invalid/Required state for checkbox/switch groups.
- **`Field` — the shared a11y-wiring primitive consumed by TextInput/Textarea/Select — has zero tests and zero Storybook stories.** This is the most consequential documentation/test gap in the primitives layer given how central it is.
- **7 un-tokenized "magic number" CSS values** found across otherwise 100%-token-compliant stylesheets: `Link.module.css` (`0.2em`, `0.85em`), `Checkbox.module.css` (`0.125rem`), `Switch.module.css` (`0.1875rem`, twice), `Tooltip.module.css` (`16rem`), `Avatar.module.css` (`line-height: 1`, low severity). Everything else in all 16 stylesheets is 100% `var(--fads-*)`.
- **Logical CSS properties are fully clean** — zero `left`/`right`/physical-direction rules found anywhere in the 16 stylesheets. This is a genuine strength.
- **No component's Storybook stories demonstrate RTL vs LTR side-by-side**, despite several components' own JSDoc making explicit mirroring claims (`Switch`, `Tooltip`, `Link`).
- Minor gaps: `Textarea`'s tests/stories are thinner than its near-twin `TextInput` (missing helper-text-linking and `aria-required` tests, missing a `ReadOnly` story); `Tooltip` stories omit the `InlineStart` placement; `Container` stories omit the `Full` size; no isolated single-`Radio` story outside a group.

### 4.2 Composite (15 components) + shell (4 components)

**Critical-severity (already covered in §0, token-layer — not component logic).**

**Moderate-severity, component logic:**
- **Alert / Notification / Toast are ~90% copy-pasted, and the copy has already drifted**: near-identical title/message/dismiss-button JSX, but each independently picked a different background token (`--fads-sys-color-background-subtle` vs `-raised` vs a different token *family* entirely, `--fads-sys-color-surface-raised`). A retheme today requires hunting three files instead of one. Toast's pause-on-hover/focus timer is the only genuinely novel logic among the three — everything else should be a shared internal base.
- **Modal has no `inert`/`aria-hidden` isolation of background content** (contrast with `NavDrawer`, which correctly sets `inert` on itself when closed) — a real WCAG 4.1.2 gap for the component whose entire documented job is being an isolated dialog. No test would catch this since all Modal tests assert Tab/Escape/scrim behavior, never sibling-content reachability.
- **`DatePicker` does not resync `visibleMonth`/`focusedDate` when `value` changes from outside** after mount — reopening the popover after an external reset shows a stale month/cell. Untested.
- **`DatePicker`'s popover is not portaled** (unlike Modal/Toast), and uses `z-index: var(--fads-sys-z-dropdown)` — the lowest tier in the z-index scale, below sticky-header/drawer/modal. A DatePicker field near a sticky header, or opened while a NavDrawer is open, can render its calendar grid genuinely clipped/obscured. This is also the one place the shared `useFocusTrap` pattern is used without a portal, unlike its two siblings.
- **Nested `ToastProvider` produces a duplicate, permanently-empty `role="region"` landmark** — no guard exists, and `useToast()` always resolves to the nearest provider, silently orphaning the outer one.
- **`FileUploader`'s drag-active visual state can flicker** — bare `onDragOver`/`onDragLeave` with no enter/leave counter or `relatedTarget` check, the textbook nested-drag-target bug. Untested beyond `drop` and `disabled`.
- **`ErrorState`'s own JSDoc cites a "focus → alert" requirement from `INTERACTION_SPECIFICATION.md` §9 that is not implemented** — no ref, no `.focus()` call anywhere in the component. Either the doc-comment overstates the implementation or a real a11y requirement is missing; both are review-blocking for a WCAG 2.2 AA claim.
- **Prop/callback naming drift** — covered in §3.3; the composite layer is where it's most visible (4 different "dismiss button label" names, 2 different overlay-control philosophies).

**Minor-severity:**
- `Card`'s keyboard-activation path uses `onClick?.(event as never)` — the one unsafe cast found in the composite scope; a consumer reading `event.clientX` inside their handler (reasonable given the prop's declared `MouseEvent` type) gets `undefined` at runtime with zero compile-time warning.
- Escape-key handling is independently reimplemented (not centralized) in `Modal`, `NavDrawer`, and `DatePicker` — the pattern hasn't drifted (all three attach a native listener to the trap ref, not `document`), but it's the same ~10 lines duplicated three times; `useFocusTrap` could accept an `onEscape` option instead.
- `Table` has no row-level memoization or virtualization — will not scale past a few hundred rows; every other composite's render-cost patterns were checked and are fine (DatePicker's grid memoization has correct dependency arrays).
- `Table.captionHidden` reaches past its own CSS module to a bare global class-name string (`'fads-visually-hidden'`) — works today, but renaming that global utility class would silently break it with no compiler error.

**Shell components (Header, Footer, Breadcrumbs, NavDrawer) — no defects found.** All four are consistent, token-only, RTL-safe, and correctly tested; this is the most polished layer in the audit besides providers/hooks.

**Providers & hooks — no defects found.** `DirectionProvider`, `ThemeProvider` (its `data-theme` mechanism was inert against the loaded CSS due to §0's bug — now fixed and live), `useFocusTrap`, `useMediaQuery`, `usePrefersReducedMotion`, and `LocaleProvider` are all correct, SSR-safe where relevant, and well-commented. This is the strongest-reviewed part of the codebase.

---

## 5. Accessibility

**Strengths:** every composite/shell/primitive that needs one carries the correct ARIA role/attribute set for its documented contract (`role="dialog"`/`aria-modal` + focus trap for Modal; `role="grid"`/`row`/`columnheader`/`gridcell` for DatePicker; `role="status"`/`aria-live="polite"` for Loading/Toast; `aria-sort` for sortable Table columns; `aria-current="page"`/`"step"`/`"date"` used correctly and distinctly across Breadcrumbs/Header/Steps/DatePicker). `useFocusTrap` correctly snapshots and restores the pre-activation focus target, guarded against focusing a detached node. Logical CSS properties are used exclusively — zero physical-direction rules found in any of the 21 audited stylesheets across primitives/layout.

**Gaps:**
1. Modal's missing background isolation (§4.2) — the single most concrete WCAG gap found.
2. `color-contrast` axe checks are disabled everywhere (jsdom cannot compute contrast) — this is a reasonable, explicitly-documented interim stance given Q3/Q20 are still open, but it means **zero contrast verification exists today**, automated or otherwise, across all 35 components. This should be gated as a hard pre-1.0 requirement once real token values land, not left implicit.
3. `ErrorState`'s documented focus-move-on-error behavior is not implemented (§4.2).
4. No stylelint/CSS-lint tool enforces DC-04/DC-06 (approved colors, On-Color variants) or DC-09 (icon sizing) at all — these are 100% review-dependent today.
5. `Field` (the shared label/helper/error wiring primitive) has no axe test — a gap given it's the a11y backbone for three other primitives.

---

## 6. RTL support

RTL is handled correctly at the CSS level everywhere audited — `inset-inline-*`, `margin-inline`, `padding-inline`, `text-align: start/end` used exclusively, zero `left`/`right` found in any stylesheet. `DirectionProvider` defaults to RTL (correct per DC-10) and `useIsRtl()` is correctly consumed by `Tabs` and `DatePicker` for RTL-aware Arrow-key direction (both verified with actual `locale: 'ar'` vs `'en'` tests). The one systemic gap: **no component's Storybook stories demonstrate RTL and LTR side-by-side**, despite multiple components (`Switch`, `Tooltip`, `Link`, `Tabs`, `DatePicker`) making explicit RTL-correctness claims in their own JSDoc. Global RTL preview exists via the Storybook locale toolbar, but nothing forces a reviewer to actually flip it per-component — a paired story per RTL-sensitive component would catch regressions the toolbar alone won't reliably surface in day-to-day review.

---

## 7. Token usage

Covered in depth in §0 (the critical finding) and §3.5 (missing enforcement tooling). Post-fix: single coherent load order (`generated/tokens.css` → `tokens.css` → `reset.css`), zero dangling `var()` references (0 of 103 referenced tokens now missing, mechanically verified), and a permanent CI gate (`tokens:check-coverage`) preventing regression. Remaining, pre-existing, and out of this review's fix scope: `frontend/src/design-system/tokens/tokens.ts` (hand-written public `token` API) and `generated/tokens.ts` are two parallel typed accessor maps with no single source of truth between them — cosmetically harmless today (both just emit `var(--fads-sys-*)` strings) but worth consolidating before 1.0.

---

## 8. Storybook

34 of 35 components have a `.stories.tsx` (Field is the sole gap — see §4.1). Coverage quality is generally good — Default plus documented state variants (loading/disabled/error/tone) for most components — but uneven: `Tooltip` never demonstrates its `InlineStart` placement, `Container` never demonstrates its `Full` size, no standalone `Radio` story exists outside a `RadioGroup`. `build-storybook` passes cleanly (81 story modules, verified in this review). The a11y addon (`@storybook/addon-a11y`) is correctly configured. As noted in §6, no story anywhere forces an explicit RTL/LTR comparison.

---

## 9. Testing

175 tests across 40 files, all passing. Coverage is broad — every composite/shell/primitive except `Field` has at least a smoke test plus an axe scan — but depth is uneven between near-identical siblings (`TextInput`: 6 assertions including helper-text linking and `aria-required`; `Textarea`: 3, missing both of those despite wrapping the identical `Field`). The specific untested-but-documented behaviors flagged in §4.2 (Modal background isolation, DatePicker external-value resync, FileUploader drag-sequencing, RadioGroup arrow-key navigation, ErrorState focus-move) are the highest-value gaps to close next, since they're exactly the kind of regression a reviewer reading the JSDoc would assume is already covered. CI runs `typecheck`, `lint`, `format:check`, `coverage` (full test run with coverage), `build`, and `build-storybook` on every push/PR; as of this review, `tokens:validate` is now also a required CI step (§0) — it was not, before this review, despite `docs/PROJECT_STATUS.md` implying it had been continuously "verified green."

---

## 10. Developer experience, performance, bundle size, tree-shaking, type safety

- **Type safety:** strong overall — `@typescript-eslint/no-explicit-any: error` is enforced and holds (zero `any` found in the audited scope); every component exports its own typed `XxxProps`. Two real weak spots: `Card`'s `onClick?.(event as never)` cast (§4.2), and the general absence of any lint rule that would catch a future `any` regression in test files (test files relax `no-non-null-assertion`, which is a reasonable, narrow, intentional carve-out — not a gap).
- **Tree-shaking/bundle:** genuinely good — all-named-export barrels, no default exports outside `.stories.tsx`, no module-level mutable state, no import-time side effects. The blocker to actually realizing this benefit for other products is §3.4 (no package to import from).
- **Performance:** `Table` lacks row memoization/virtualization (§4.2) and will not scale past a few hundred rows without it; every other component's render-cost pattern checked out fine, including `DatePicker`'s 42-cell grid memoization (correct dependency arrays, verified).
- **Developer experience:** JSDoc is consistently high-quality and honest (every component's "pending final DGA token values" disclaimer is present and accurate) — the main friction is the naming drift cataloged in §3.3/§4, which will cost every new component author time re-deriving "which name do I use for this concept" with no style-guide doc to consult.

---

## 11. Recommended refactors (priority order)

1. ✅ **DONE** (this review) Token pipeline single-source-of-truth — keep `tokens:check-coverage` in CI permanently; do not let a second orphaned token file reappear.
2. ✅ **DONE (Phase 5.6)** Extracted a shared `NoticeBody` internal component for Alert/Notification/Toast — collapsed the duplicated JSX; each keeps its own CSS/tone tokens.
3. ✅ **DONE (Phase 5.6)** Fixed `Modal`'s background isolation — `inert` on the rest of `document.body` while open, restored on close, with a `data-fads-portal` escape hatch for other FADS overlays.
4. ✅ **DONE (Phase 5.6)** Fixed `DatePicker`'s external-`value` resync and portaled its popover (z-index moved to `--fads-sys-z-drawer`).
5. ✅ **DONE (Phase 5.6)** Reconciled dismiss/close naming (`Modal.closeLabel` → `dismissLabel`; `FileUploader.removeLabel` deliberately kept distinct) and renamed `RadioGroup.onChange` to `onValueChange`.
6. **Still open** — Centralize the disabled-opacity CSS rule (5 duplicated blocks) and route `Button`/`Link`/`Tag`'s icon slots through the `Icon` primitive (5 duplicated hand-rolled wrappers). Not in the Phase 5.6 fix list; tracked as technical debt.
7. ✅ **DONE (Phase 5.6)** `Field.test.tsx` (8 tests) and `Field.stories.tsx` (5 stories) added.
8. ✅ **DONE (Phase 5.6)** `ToastProvider` nesting guard added (dev-only console warning; inner instance renders no viewport).

## 12. Technical debt

- No stylelint/CSS-linting tool — DC-03/DC-04/DC-06/DC-09/DC-23 enforcement is 100% manual review today.
- No ESLint rule for DC-24 (no hard-coded UI strings) — same manual-only enforcement gap.
- No packaging/distribution model (§3.4) — tracked as the project's own Q24, correctly flagged as open, but worth escalating given its blocking effect on any "production-ready for reuse" claim.
- `tokens.ts` vs `generated/tokens.ts` — two unsynchronized typed accessor maps for the same underlying CSS variables.
- Uneven test/story depth between near-identical components (TextInput/Textarea; Tooltip's missing placement story; Container's missing size story).
- `Checkbox`/`Switch` have no error/required state support, unlike their sibling form controls.
- Architecture-boundary ESLint rule's pattern list names today's folders (`@app`, `@layouts`, `@/pages`), not the "features/\*" vocabulary the governance doc uses — latent, not currently exploitable, but will need updating the day a `features/` directory is introduced.

## 13. Future improvements

- Explicit RTL/LTR paired Storybook stories for every component making an RTL-mirroring claim.
- A real contrast-verification gate (beyond the current explicitly-deferred jsdom limitation) once Q3/Q20 land.
- `Table` virtualization/row memoization once real Manage-Requests data volumes are known.
- A written naming-convention style guide (this review's §3.3/§4 findings are effectively the first draft of one).
- Consolidate `tokens.ts`/`generated/tokens.ts` into one generated typed accessor map.
- Decide and implement Q24 (distribution model) before any second product attempts to consume FADS.

---

## 14. Decision

# NOT APPROVED

**Rationale:** The design system demonstrates strong component-level engineering — accessibility semantics, RTL discipline, and TypeScript rigor are genuinely good in the majority of individual components, and the layered architecture is the right shape. But "production-ready" for an enterprise, multi-product design system means more than "each component is individually well-built," and on that bar this repository is not there yet:

- It shipped (until this review) with the majority of its own visual design silently non-functional, undetected by any existing gate — a process failure, not a one-off typo, since the missing control class (token-coverage validation) is exactly the kind of check a mature design system's CI should have had from day one.
- It has no way for a second product to actually consume it (§3.4) — a hard blocker on the "production-ready for reuse" framing specifically, independent of code quality.
- Three of its own governance document's four enforcement claims are not backed by tooling (§3.5) — the gap between documented and actual quality gates is itself a maintainability/trust risk.
- Real, user-facing bugs exist in components already presented as complete (`Modal`, `DatePicker`) that a consuming product would hit in normal use, not edge cases.

**Path to APPROVED:** close items 2–6 in §11 (the naming/duplication/bug fixes do not require new architecture, just consolidation), decide Q24 (distribution model) and implement at least an in-repo "package boundary" if full extraction isn't yet warranted, and add the stylelint/string-literal enforcement that §3.5 shows is currently missing. None of this requires new components or a rebuild — it is entirely convergence and hardening work on what already exists. Independent of this review, remember that full visual/contrast compliance remains gated on Q3/Q20 regardless of how the above items resolve.

---

> ## ⚠ Superseding decision (Phase 5.6 hardening, 2026-07-08)
>
> The critical/high-priority items above (§11 items 2–5, 7–8; the color/left-right half of §3.5's tooling gap) have been resolved — see `reports/DESIGN_SYSTEM_HARDENING_REPORT.md` for full detail. That report issues a **narrower-scope decision, APPROVED for Hackathon landing-page implementation**, while explicitly leaving this review's broader "production-ready, multi-product package" verdict (**NOT APPROVED**) unchanged and intact — the distribution-model decision (Q24) and the full DC-24 string-literal enforcement remain open, and neither was required to unblock landing-page work specifically. Do not read the narrower approval as overturning this document's conclusion about multi-product readiness.
