# User Personas — Financial Academy Innovation Hackathon

> Derived from the hackathon brief `[PROJ: content/hackathon.md]` and the two required user actions ("Submit Your Innovation", "Manage My Requests") `[PROJ]`. Personas drive `USER_FLOW.md` and the Experience criteria in `COMPLIANCE_MATRIX.md §D`.
>
> ⚠ Personas are **inferred from the brief**, not from user research. Validate with the client — see **Q4** and **Q12** in `QUESTIONS.md`.

---

## Primary persona — P1: The Innovator (المبتكر)

**Who:** A Financial Academy employee submitting an innovation idea to the internal hackathon.

| Attribute | Detail |
|---|---|
| Language | Arabic-first; may occasionally prefer English `[S3]` |
| Device mix | Desktop at work + mobile off-desk → responsive is essential `[S3]` |
| Tech comfort | Mixed; assume moderate — keep steps minimal `[S3: E3]` |
| Primary goal | Submit a well-formed idea and track its status |
| Key tasks | Read criteria → **Submit Your Innovation** → attach documents → **Manage My Requests** |
| Motivations | Recognition, impact on the Academy, contributing to Vision 2030 |
| Frustrations to avoid | Long/confusing forms, unclear status, lost work, unclear errors `[S3: E16]` |
| DGA needs | Clear hierarchy, minimal steps, clear error handling, confirmation on submit, accessible help `[S3: E1,E3,E13,E16]` |

## Secondary persona — P2: The Returning Applicant

Same as P1 but revisiting to **manage/track** existing submissions.

| Key tasks | View submissions list, check status/feedback, edit/withdraw (if allowed), resubmit |
| DGA needs | Table/list with clear statuses (Tags), pagination, breadcrumbs, predictable UI `[S3: C18,C22,C26,C28,E6]` |

> ⚠ **Q13:** Can applicants edit/withdraw after submission? Affects Manage-Requests actions.

## Persona — P3: The Evaluator / Committee Member (لجنة التحكيم)

Reviews submissions against the 6 judging criteria `[PROJ]`.

| Status | ⚠ **Q14:** Is an evaluator/reviewer view in scope for this build, or is the platform applicant-facing only? |
| If in scope | Needs list/table, filters, detail view, scoring against criteria, feedback entry |

## Persona — P4: The Administrator / Program Owner

Manages the hackathon program (challenges, timeline, content).

| Status | ⚠ **Q15:** Is an admin/CMS surface in scope, or is content static for the hackathon demo? Likely **out of scope** per `PROJECT_SCOPE.md §6`. |

## Accessibility personas (cross-cutting, WCAG 2.2 AA) `[PROJ]`

| Persona | Need | Design implication |
|---|---|---|
| A1 — Screen-reader user (Arabic NVDA/VoiceOver) | Semantic structure, ARIA, RTL reading order | Semantic HTML, labelled forms, logical `dir="rtl"` order |
| A2 — Keyboard-only user | Visible focus, no traps, logical tab order | DGA **Focused** states on every interactive component `[S3]` |
| A3 — Low-vision user | Contrast, zoom, responsive text | On-Color property, contrast checks, responsive typography `[S3: F4,F7]` |
| A4 — Motor-impaired / touch user | Large targets, forgiving interactions | ≥44px targets, touch gestures `[S3: F14,E11]` |
| A5 — Cognitive-load-sensitive user | Simple language, minimal steps, consistency | Concise Arabic copy, Steps component, consistent terminology `[S3: E3,E5,E15]` |

---

## Persona → primary DGA experience criteria map

| Persona | Most-critical `[S3]` Experience criteria |
|---|---|
| P1 Innovator | E1, E3, E5, E13, E16 |
| P2 Returning | E2, E6, E9, E12 |
| P3 Evaluator (if in scope) | E2, E17, E16 |
| A1–A5 | G1 (WCAG 2.2 AA) + component Focused states |
