# Content Model (FADS)

> **Product-agnostic content & localization model** for the Financial Academy Design System. Defines how content is structured, localized, and governed so every consuming product stays Arabic-first, consistent, and DGA-compliant `[S3]`.
>
> **Relationship to `CONTENT_STRUCTURE.md`:** that document holds the **Hackathon's** concrete copy and field lists (consumer #1). *This* document defines the **reusable content architecture** (types, entities, localization, governance). Cross-referenced, not duplicated.

---

## 1. Principles `[S3]`
1. **Arabic is the source language**; English is a secondary translation with **full parity on switch** `[S3: F15, F16]`.
2. **Single terminology source** — one approved term per concept across all products `[S3: E15]`.
3. **No hard-coded strings** in components — all copy resolved from a message catalog (`DESIGN_CONSTRAINTS.md DC-24`).
4. **Consistent tone** — formal-institutional, concise `[S3: E8]`.
5. **Consistent messages** — errors/confirmations follow one catalog `[S3: E13, E16]`.

## 2. Content layers

| Layer | What | Owner |
|---|---|---|
| **Message catalog** | UI strings (labels, buttons, errors, confirmations) keyed by ID | FADS + product |
| **Content entities** | Structured domain data (records) | Product |
| **Static content** | Editorial sections (about, FAQ, policies) | Product/CMS |
| **Terminology glossary** | Canonical term per concept | FADS (governed) |

## 3. Message catalog model

- **Key convention:** `<domain>.<component-or-screen>.<element>[.<state>]` — e.g. `form.submit.button`, `error.field.required`, `feedback.success`.
- **Locales:** `ar` (primary, complete) and `en` (secondary). A missing `en` key falls back to `ar` **only in non-production**; production requires parity (DC-10).
- **Interpolation:** named placeholders (`{field}`, `{count}`) — never string concatenation (bidi-safe).
- **Pluralization/gender:** use ICU-style rules where the i18n lib supports it (⚠Q21).
- Reusable message families (shared across products):
  | Family | Examples | DGA link |
  |---|---|---|
  | Validation | `error.field.required`, `error.file.type`, `error.file.size` | `[S3: E16, C10]` |
  | Confirmation | `confirm.submit.success`, `confirm.feedback.received` | `[S3: E13]` |
  | Status | `status.submitted`, `status.in-review`, `status.accepted`, `status.rejected` | `[S3: C18]` (⚠Q19) |
  | Action | `action.submit`, `action.next`, `action.previous`, `action.withdraw` | — |
  | Empty/loading | `state.empty`, `state.loading` | `[S3: C31]` |

The Hackathon's concrete strings populate these keys in `CONTENT_STRUCTURE.md §4`.

## 4. Content entities (reusable domain model)

Generic entities the Academy's participatory/service products reuse. (Hackathon instantiates them.)

| Entity | Key fields (conceptual) | Notes |
|---|---|---|
| **Submission / Request** | id, title, category, status, createdAt, owner, attachments[] | Hackathon = "ابتكار/طلب" (⚠Q18) |
| **EvaluationCriterion** | id, label, description, weight? | Hackathon = the 6 criteria `[PROJ]` |
| **Attachment** | id, name, mimeType, size, uploadStatus | drives File Uploader `[S3: C10]` |
| **FeedbackEntry** | id, rating, comment?, createdAt | drives Feedback pattern `[S3: T7,T8]` |
| **FaqItem** | id, question, answer | drives Accordion `[S3: C5]` |
| **ContentSection** | id, heading, body, media?, cta? | landing sections `[S3: Templates]` |
| **NavNode** | id, label, href, external?, children[] | header/footer/breadcrumb + sitemap `[S3: E12]` |
| **UserProfile** | id, name, initials, avatar?, role | Avatar contexts `[S3: C23]` (⚠Q4) |

Field-level validation rules map to the Validation message family (§3) and to component states (`COMPONENT_INVENTORY.md`).

## 5. Localization & RTL rules `[S3: F16, F17]`
- `dir` and `lang` switch together with locale; no partial switches (DC-10).
- Inline foreign-language fragments carry their own `lang` (WCAG 3.1.2).
- Numbers, dates, currency localized per locale; bidi isolation around Latin/numeric runs inside Arabic.
- Directional content (icons, progress, next/prev) mirrors with direction (`DESIGN_CONSTRAINTS.md DC-25`).

## 6. Terminology governance `[S3: E15]`
- The **glossary is authoritative**; a term may not have synonyms in UI copy.
- Hackathon glossary lives in `CONTENT_STRUCTURE.md §2`; shared/cross-product terms are promoted here over time.
- Open canonical decisions: **Q18** (ابتكار vs طلب), **Q19** (status vocabulary).

## 7. Static/editorial content
- Structured as `ContentSection`/`FaqItem` records, not free HTML (keeps semantic + i18n integrity, DC-15/DC-24).
- Policy/legal text (privacy/terms) is required content `[S3: E14]` — ⚠Q11 (actual text).
- Sourcing/CMS vs static bundling — ⚠Q15/Q2.

## 8. Definition of Done (content)
- [ ] 100% `ar` coverage; `en` parity if English shipped `[S3: F16]`
- [ ] Zero hard-coded UI strings (DC-24)
- [ ] All messages resolve to catalog families (§3)
- [ ] Terminology matches glossary — no synonyms `[S3: E15]`
- [ ] Error/confirmation copy matches catalog `[S3: E13, E16]`
- [ ] RTL/bidi correct for mixed content `[S3: F17]`

## 9. Open items
Q2 (content source), Q11 (policy text), Q15 (CMS), Q18 (canonical term), Q19 (statuses), Q21 (i18n lib). See `QUESTIONS.md`.
