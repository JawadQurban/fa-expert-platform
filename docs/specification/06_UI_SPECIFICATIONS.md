# 06 — UI Specifications

**Status:** ⬜ Not started · **Depends on:** [05_WIREFRAMES](05_WIREFRAMES.md)
**Source of truth:** `BRD-TRN-001 v1.0` · **Design system:** DGA "كود المنصات"

> Purpose: component-level specification per screen — which design-system components, states, validation, and copy. Built on the DGA design system; **no new visual identity** (`NFR-34/35`).

---

## Ground rules
- Use only DGA "كود المنصات" components (see existing `docs/FIGMA_*_SPECIFICATION.md` and `docs/DGA_*` catalogs in this repo).
- Bilingual AR/EN; RTL layout; local date/number formatting (`NFR-27`); language preference persists (`NFR-28`).
- Every official message uses approved bilingual templates (`BR-0701`); actual send is single-language per recipient (`BR-0707`).
- Immutable audit surfaced where relevant (`NFR-07`).

## Spec structure (per screen)
- [ ] Component list (mapped to DGA catalog)
- [ ] Field-level validation (ties to `DM-GAP-01` field rules)
- [ ] States: default, loading, empty, error, success, disabled/locked
- [ ] Locked vs. editable fields (e.g., CAP-04: classification/evaluations/contract locked — `BR-0411`)
- [ ] Microcopy (AR/EN)
- [ ] Accessibility notes (ref `docs/ACCESSIBILITY_CHECKLIST.md`)

## Screen specs (to complete)
_Populate from [04_SCREEN_INVENTORY](04_SCREEN_INVENTORY.md)._
