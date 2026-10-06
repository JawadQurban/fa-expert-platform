# Token Source Strategy

> How FADS obtains **authoritative DGA Platforms Code v1.0** token values, why the GOV-SA legacy repo does not qualify, and the placeholder policy until official values arrive.
> **Consolidates** the token-mapping/migration concerns from the original task under the 2026-07-08 directive.

---

## 1. Principle

FADS tokens must mirror the **official DGA Platforms Code v1.0** — values come only from an **authoritative source**, never invented, never copied from a non-authoritative or legacy source (`DESIGN_CONSTRAINTS.md DC-01/DC-04`, `LEGACY_REFERENCE_DECISION.md`).

## 2. Acceptable (authoritative) sources — in priority order

| # | Source | Form we can consume | Status |
|---|---|---|---|
| 1 | **Official Figma — Platforms Code** `[S2]` | Figma **Variables export** (JSON/CSS) of colors, type, spacing, radius, elevation, motion, grid | ⏳ Not yet provided (Q20) |
| 2 | **Official website** `design.dga.gov.sa` `[S1]` | Documented token values (foundations pages) transcribed with verification | ⏳ SPA, not machine-scrapable (Q3) |
| 3 | **Official token package** (if DGA publishes one for Platforms Code) | npm / CSS / Style-Dictionary JSON | ⏳ None identified |

A value is "official" only if traceable to one of the above **for Platforms Code v1.0** specifically.

## 3. Explicitly NOT acceptable

- ❌ **GOV-SA legacy repo `[LEGACY]`** — wrong generation (GOV.SA, Bootstrap/jQuery, TheSans). See `LEGACY_REFERENCE_DECISION.md`.
- ❌ Community examples `[S5]/[S6]`.
- ❌ Invented/guessed values.
- ❌ Legacy SCSS values "verified by resemblance" — resemblance is not verification.

## 4. Why the legacy repo cannot close Q3/Q20

| Requirement | Legacy repo provides? |
|---|---|
| Platforms Code v1.0 color values | ❌ (GOV.SA colors, e.g. `#26634B`, unverified vs v1.0) |
| IBM Plex Sans Arabic type scale | ❌ (uses TheSans/Noto) |
| Global spacing tokens (4/8/16…) | ❌ (Bootstrap scale) |
| Machine-readable tokens (JSON/Style Dictionary/Figma) | ❌ (none) |
| Elevation / motion tokens | ❌ (none) |
| Official icon library | ❌ (legacy icon font) |

**Conclusion: Q3 (values) and Q20 (source) remain OPEN.**

## 5. Placeholder policy (until §2 delivers)

- FADS ships **clearly-marked placeholder tokens** (`frontend/src/design-system/tokens/tokens.css`; `DESIGN_TOKENS.md §10`).
- All components consume **tokens only** — no hard-coded visual values.
- Every component/story/doc is stamped **"Pending final DGA token values."**
- **No pixel-perfect DGA compliance is claimed** at any point before §6 completes.

## 6. Integration workflow (when official tokens arrive)

1. Obtain the export from an **acceptable source** (§2); record provenance.
2. Populate **T1 reference tokens** with official values (replace `TODO(Q3)` placeholders).
3. Verify **T2 semantic** mappings against `[S3]` guidance (status colors, On-Color, etc.).
4. Load **IBM Plex Sans Arabic** (resolve Q7 delivery).
5. Run **contrast audit** (WCAG 2.2 AA) on final pairs (`ACCESSIBILITY_CHECKLIST.md`).
6. Validate the Phase-5 **component placeholder tokens** (Q33) against official values; adjust.
7. Run the **final DGA visual audit** (`DGA_VISUAL_REVIEW.md`, `TESTING_STRATEGY.md §7`).
8. Bump DS version toward `1.0.0`; drop the "Pending" stamps.

## 7. Optional legacy cross-check (reference only)
When official values land, the legacy palette/type **may be compared** to spot obvious divergences or continuity — but the **official value always wins**, and legacy is never the tie-breaker.

## 8. Definition of Done (token source)
- [ ] Provenance recorded for every value (authoritative source, §2)
- [ ] 0 placeholder/`TODO(Q3)` tokens remaining
- [ ] IBM Plex Sans Arabic in place (not TheSans)
- [ ] Contrast AA verified
- [ ] Q3, Q20, Q33 closed; "Pending" stamps removed

## 9. Open items
Q3 (values), Q20 (acquisition), Q7 (font delivery), Q8 (icon library), Q33 (component placeholder tokens), Q34 (legacy repo scope confirmation). See `QUESTIONS.md`.
