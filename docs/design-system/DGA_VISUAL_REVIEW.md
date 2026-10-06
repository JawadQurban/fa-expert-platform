# DGA Visual Review — UI Specification Audit

> A self-audit of every visual decision in the UI Specification package against the authoritative baselines:
> `DGA_MASTER_SPECIFICATION.md` · `COMPLIANCE_MATRIX.md` · `COMPONENT_MAPPING.md` · `DESIGN_SYSTEM_SPECIFICATION.md`.
> Purpose: surface potential inconsistencies, potential DGA violations, and UX improvements **before** implementation, so the engineering team inherits a clean blueprint.
> **Method:** each UI decision traced to a DGA rule; flagged `✅ compliant`, `⚠ at-risk` (needs care in build), or `❌ violation` (must fix). No violations were introduced by design; ⚠ items are guardrails.

---

## 1. Foundations audit

| Area | UI-spec decision | Baseline | Verdict |
|---|---|---|---|
| Color | All color via `sys.color.*`; status colors reserved; On-Color on colored bg | `DGA_MASTER §2.2`, F2–F4 | ✅ (values ⚠Q3) |
| Typography | IBM Plex Sans Arabic; Display/Text tokens; one H1; responsive | `DGA_MASTER §2.3`, F5–F7 | ✅ (scale ⚠Q3) |
| Spacing | Global tokens only; section rhythm via `sys.space.*`; no custom spacing | `DGA_MASTER §2.4`, F8 | ✅ (values ⚠Q3) |
| Icons | Official library; >24px Featured; status vs neutral; external-link icon | `DGA_MASTER §2.5`, F9–F12 | ✅ (inventory ⚠Q8) |
| Responsive | Mobile/Tablet/Desktop reflow; table→cards; drawer on mobile | `DGA_MASTER §2.6`, F13–F14 | ✅ (breakpoints ⚠Q3) |
| Arabic-first/RTL | RTL-default; logical properties; mirrored icons; full-parity EN | `DGA_MASTER §2.7`, F15–F17 | ✅ |

**Risk R-F1 (⚠):** Timeline "current phase" and Steps "current step" emphasis must use **primary/neutral**, not status colors. Explicitly specified (`UI §2.6`, `VISUAL_HIERARCHY §6`) — build must honor DC-05. 
**Risk R-F2 (⚠):** Hero text over image/color — contrast can only be confirmed once tokens land (Q3). On-Color mandated in spec; verify in a11y audit.

## 2. Templates audit

| Template | UI-spec application | Baseline | Verdict |
|---|---|---|---|
| Hero | One approved type (image/color/object); info section first after hero | `DGA_MASTER §3` T2–T3 | ✅ |
| Service/Form | Submit uses exact headings (Steps/Requirements/Required Documents/Service Details Card); Modal not for data entry | `DGA_MASTER §3` T6; C9 | ✅ (DC-13 enforced) |
| Rating/Feedback | Feedback pattern PAT-04 + confirmation | T7–T8, E13 | ✅ |
| E-Participation | Landing order adopted; reconcile to official 8 sections | T9 | ⚠ **R-T1 (Q6)** |
| Search | Bar on results; categorized + filters (conditional) | T10 | ⚠ **R-T2 (Q10)** |

**Risk R-T1 (⚠, Q1/Q6):** The landing section list is an *adopted plan*, not the verified official e-Participation 8-section structure. Blueprint is buildable now; **must reconcile** the section set/order when Q6 is answered. Layout system is unaffected.

## 3. Components audit (spec vs `COMPONENT_MAPPING.md` / `COMPONENT_INVENTORY.md`)

| Check | Result |
|---|---|
| Every UI region maps to a FADS component (CMP-##)? | ✅ (UI §, SCREEN §, cross-referenced) |
| Component **state sets** specified per DGA? | ✅ states enumerated in UI §3, INTERACTION §1/§4 |
| Notifications used correctly (Toast=transient, Inline=persistent, Banner=high-priority)? | ✅ INTERACTION §11 |
| Modal only for confirm/feedback/alerts? | ✅ DC-13; submit uses form pages |
| Cards: ≤2 allowed adjustments; CTA on actionable only? | ✅ UI §2.3–2.4 (informational cards, CTA optional) |
| Breadcrumb current page Disabled/non-interactive? | ✅ UI §1.3 |
| External links carry external-link icon? | ✅ ICONOGRAPHY §1, DC-28 |
| Digital Stamp? | ⚠ **R-C1** deferred (Q5) — not placed; revisit if certified content appears |
| Date Picker? | ⚠ conditional (only if dated fields; Q12) |

**Risk R-C2 (⚠):** Status must be conveyed by **text + Tag**, never color-only (WCAG 1.4.1). Specified in SCREEN §SCR-03 and ICONOGRAPHY §6 — verify in build/tests.

## 4. Design-system alignment (`DESIGN_SYSTEM_SPECIFICATION.md`)

| Check | Result |
|---|---|
| UI composes FADS L2/L3 only; no restyled base components? | ✅ DC-20/21; UI/SCREEN reference components/patterns, not custom styling |
| No hard-coded values (tokens only)? | ✅ specs cite `sys.*` names; 0 hex in docs (verified) |
| Patterns reused (PAT-01…06) rather than page-specific one-offs? | ✅ Submit=PAT-01, Manage=PAT-02, sections=PAT-03, feedback=PAT-04, shell=PAT-05, notifications=PAT-06 |
| Hackathon treated as *consumer*, not owner of DS? | ✅ specs consume DS docs; no DS modification made |
| Copy via message catalog (no literals)? | ✅ COPYWRITING §13, DC-24 |

## 5. Accessibility cross-check (`ACCESSIBILITY_CHECKLIST.md`, WCAG 2.2 AA)

| Check | Result |
|---|---|
| One H1/screen, logical headings | ✅ VISUAL_HIERARCHY §1, SCREEN specs |
| Visible focus everywhere; focus management on route/modal | ✅ INTERACTION §3 |
| Keyboard operability per component | ✅ INTERACTION §4 |
| Target size ≥24px (aim 44px), gesture alternatives | ✅ INTERACTION §5, ICONOGRAPHY §8 |
| Errors: identify + suggest + consistent placement | ✅ INTERACTION §7, COPYWRITING §8–9 |
| Status messages via aria-live | ✅ INTERACTION §11–12, MICRO §5–6 |
| Reduced motion, no motion-only info | ✅ MICRO §9 |
| Contrast AA | ⚠ **R-A1 (Q3)** — verifiable only after token values |

## 6. Potential visual inconsistencies (found & resolved in spec)
1. **Button order in RTL flows** — resolved: primary at logical end, back at start (`LAYOUT §7`); flagged to confirm DGA convention vs Figma (⚠Q6).
2. **"Innovation" vs "Request" terminology** — resolved with a working default + glossary (`COPYWRITING §3`); confirm Q18.
3. **Timeline/Steps emphasis color** — resolved: primary/neutral, not status (R-F1).
4. **Table on mobile** — resolved: card-list fallback (`UI §3.3`, `LAYOUT §6`) to avoid horizontal page scroll.
5. **Numeral convention (Arabic-Indic vs Western)** — new open item Q32 (`COPYWRITING §4`).

## 7. Potential DGA violations (watch-list for implementation)
None introduced by the specification. The following are **build-time risks** the team must not trip:
- ❌→avoid: using status colors for category/emphasis (DC-05).
- ❌→avoid: scaling a standard icon past 24px instead of Featured (DC-09).
- ❌→avoid: Modal for multi-field data entry (DC-13).
- ❌→avoid: custom spacing/colors/fonts (DC-03/04/07/08).
- ❌→avoid: color-only status (WCAG 1.4.1).
- ❌→avoid: hiding CTAs behind motion (DC-14).

## 8. Potential UX improvements (recommendations)
1. **Error summary** at form top on multi-error submit (links to fields) — improves efficiency for long forms (proposed in INTERACTION §7).
2. **Save-as-draft** for the multi-step form — reduces loss/frustration (depends on Q16/backend Q2).
3. **Autosave indicator** if drafts adopted — clear feedback (E9).
4. **Inline character counters** on long Textareas — positive-framed microcopy (COPYWRITING §12).
5. **Sticky step-nav on mobile** for the submit flow — faster completion (ensure it doesn't obscure focus, 2.4.11).
6. **Filter chips** on Manage results showing active filters — improves clarity/reversibility (E17).
7. **"Skip to content"** confirmed present — small but high-value a11y win.
8. **Accessibility Statement page** (SCR-10) — beyond DGA minimum; builds trust/transparency.

## 9. Recommendations to unblock final visual fidelity
1. **Resolve Q3/Q20** (official DGA token values + acquisition) — the only hard blocker to closing Foundations & contrast audits.
2. **Confirm Q1/Q6** (landing template / 8-section structure) to lock section order (R-T1).
3. **Confirm Q18/Q19** (terminology/statuses) so copy + status Tags finalize.
4. **Confirm Q4/Q2** (auth/backend) to finalize gated screens and data/loading states.
5. Then run the **final DGA audit** (`TESTING_STRATEGY.md §7`) row-by-row against `COMPLIANCE_MATRIX.md`.

## 10. Verdict
The UI specification is **DGA-aligned and internally consistent**. No violations were introduced; all ⚠ items are either (a) pending external values (Q3) or (b) build-time guardrails already documented as constraints. The package is **ready to hand to engineering**, with the standing caveat that final visual compliance closes only after Q3/Q20 and the scope confirmations above.

## 11. Risk register (this review)
| ID | Risk | Type | Blocked by |
|---|---|---|---|
| R-F1 | Status color misuse on Timeline/Steps | build guardrail | — (DC-05) |
| R-F2 | Hero contrast unverifiable | external | Q3 |
| R-T1 | Landing vs official 8-section | scope | Q1/Q6 |
| R-T2 | Search scope | scope | Q10 |
| R-C1 | Digital Stamp applicability | scope | Q5 |
| R-C2 | Color-only status | build guardrail | — (1.4.1) |
| R-A1 | Contrast AA verification | external | Q3 |
