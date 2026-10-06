# Testing Strategy

> Verifies the product against DGA Platforms Code `[S3]`, WCAG 2.2 AA `[PROJ]`, responsive behavior, and functional flows. Maps to phases 4–5 in `IMPLEMENTATION_PLAN.md` and closes gates G1–G4 in `COMPLIANCE_MATRIX.md`.

---

## 1. Test layers

| Layer | Tool (candidate) | Scope |
|---|---|---|
| Unit | Vitest + Testing Library | Component logic, props, state transitions |
| Component states | Storybook + visual review | Every DGA state per component `[S3]` |
| Accessibility (automated) | axe-core, Lighthouse a11y | Per-component + per-page WCAG checks |
| Integration | Testing Library | Form flows, filters, navigation |
| E2E | Playwright | `USER_FLOW.md` flows end-to-end, RTL + AR/EN |
| Responsive | Playwright viewports + manual | 320/375/768/1024/1440; portrait/landscape |
| Manual a11y | Keyboard + Arabic screen reader | NVDA/VoiceOver, focus, reading order |
| Contrast | WebAIM contrast checker | Final token values `[S3: F2]` |

## 2. DGA component-state coverage (compliance-critical)
For **every** component in `COMPONENT_MAPPING.md`, assert each required state renders and behaves per `DGA_MASTER_SPECIFICATION.md §4`:
- Interactive states: Default, Hovered, Pressed, Focused, Disabled (+ Read-only, Selected, Visited where defined).
- Contextual states: Expanded/Collapsed, On/Off, Checked/Unchecked/Indeterminate, Selected/Half, Uploaded/Not-Uploaded, Today/Next/Prev, etc.
- **Focused** state must be visible for keyboard users (WCAG 2.4.7).
Missing any required state = compliance failure.

## 3. Accessibility test plan (WCAG 2.2 AA)
Execute `ACCESSIBILITY_CHECKLIST.md` per page. Must-pass:
- Keyboard-only completion of Submit + Manage flows (no traps).
- Arabic screen-reader pass: labels, roles, `aria-live` status (toasts/inline alerts/upload) `[S3: C8,C10,E13]`.
- Contrast AA on final tokens; On-Color on colored backgrounds `[S3: F4]`.
- Reflow at 320px, text zoom 200%.
- 2.2-specific: focus-not-obscured, target size, dragging alternatives, redundant entry, consistent help.
- RTL: mirrored icons, correct focus order/direction.

## 4. Functional test cases (from `USER_FLOW.md`)
| Flow | Key assertions |
|---|---|
| Submit (F2) | Step navigation; validation messages consistent `[S3: E16]`; upload errors; confirm Modal; success Toast; redirect |
| Manage (F3) | List renders; status Tags correct; filters; pagination; empty state; detail view |
| Feedback (F4) | Rating states; confirmation message `[S3: E13]` |
| Language (F6) | Full content switch, no loss; dir flips `[S3: F16]` |
| Help (F5) | FAQ accordion; footer links present `[S3: C21]` |
| Search (F7, cond.) | Search bar on results; category grouping + filters `[S3: T10,E17]` |

## 5. Responsive test matrix
Each page × {320,375,768,1024,1440} × {portrait,landscape} × {RTL,LTR}: verify reflow (`RESPONSIVE_STRATEGY.md §2`), touch targets ≥44px, table→card fallback, nav→drawer, no key element hidden behind motion `[S3: E10]`.

## 6. Content & consistency tests `[S3: E15,E16,E8]`
- Terminology matches `CONTENT_STRUCTURE.md §2` glossary across all screens.
- Error/confirmation messages match the message catalog (§4) exactly.
- Tone/style uniform.

## 7. Final DGA compliance audit (Phase 5, gate G4) `[PROJ]`
- Walk `COMPLIANCE_MATRIX.md` row by row; mark each satisfied/with evidence.
- Cross-check against the original `references/DGA_Standards.xlsx` checklist `[S3]`.
- Confirm all `QUESTIONS.md` blockers resolved or explicitly waived by client.
- Produce a compliance evidence log (screens/tests per criterion).

## 8. Entry/exit criteria
- **Entry:** feature meets its Definition of Done (`IMPLEMENTATION_PLAN.md §5`).
- **Exit:** 0 critical a11y issues; 100% applicable `[S3]` primary criteria pass; all E2E flows green; responsive matrix clean.

## 9. Blocked/deferred
- Contrast + final visual-vs-Figma checks blocked on token values (**Q3**).
- Backend integration tests deferred pending **Q2** (mock layer tested meanwhile).
