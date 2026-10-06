# Project Scope — Financial Academy Innovation Hackathon

> **Phase:** Planning & Architecture
> **Status:** Draft for approval
> **Last updated:** 2026-07-07

---

## 1. Source Legend (used across all planning documents)

| Key | Source | Priority | Notes |
|-----|--------|----------|-------|
| `[S1]` | Platforms Code Website — https://design.dga.gov.sa/ | ★★★★★ | Client-side-rendered SPA; guideline URLs are valid but page bodies are **not machine-scrapable**. Human verification required for exact token values. |
| `[S2]` | DGA Figma (Basic Standards deck) | ★★★★★ | Visual source of truth for layout/spacing/components. Not scrapable by tooling. |
| `[S3]` | `references/DGA_Standards.xlsx` — official compliance checklist v1.0 | ★★★★★ | **Richest verifiable source.** Cited as `[S3]` throughout. Contains the criteria list + official guideline URLs. |
| `[S4]` | DGA Presentation (Canva) | ★★★★☆ | Philosophy / UX rationale. Not scrapable. |
| `[S5]` | DGA UI Example — mahmoudadel1996.github.io/dga-ui | ★★★☆☆ | Community reference implementation. |
| `[S6]` | LinkedIn (Mazin Musleh) | ★★☆☆☆ | Community best practices. |
| `[PROJ]` | Project brief — `content/hackathon.md`, `CLAUDE.md`, `TASK.md`, `references/SOURCES.md` | — | Internal project definition. |

**Conflict rule `[S3]`/`[PROJ]`:** Higher-priority sources always win. If two references conflict, the higher star rating prevails. `[S3]` (the official checklist) is the operational baseline for this project because it is the only official source we can read in full.

---

## 2. Purpose

Build a **production-ready React application** for the **Financial Academy Innovation Hackathon** (هاكاثون الابتكار) that is fully compliant with the Saudi **DGA Unified Design System — "Platforms Code" (كود المنصات) v1.0** `[S3]` `[PROJ: CLAUDE.md]`.

The hackathon is an **internal competition** for the Financial Academy (الأكاديمية المالية) that promotes institutional innovation culture in service of the Academy's strategy and Saudi Vision 2030's Financial Sector Development Program `[PROJ: content/hackathon.md]`.

---

## 3. Product Definition

The platform lets Academy employees **discover the hackathon, submit an innovation, and manage their submissions**. Two primary user actions are explicitly required by the brief `[PROJ: content/hackathon.md, line 33]`:

1. **قدم ابتكارك — "Submit Your Innovation"** (primary CTA)
2. **إدارة طلباتي — "Manage My Requests"** (secondary CTA)

### Nature of the platform
The platform is **participatory** (invites employees to contribute ideas to institutional decisions/challenges). Under DGA taxonomy this most closely matches the **e-Participation platform** type, and the **e-Participation page template** is the best-fit primary template `[S3: e-participation-page]`. It also carries **service-like actions** (submit + manage), so the **service page template** and **form template** patterns apply to the submission and request-management flows `[S3: service-page]`.

> ⚠ **Needs Confirmation (Q1):** Whether the client wants the landing page built strictly on the **e-Participation template (8 mandated sections)** or on the **Home page template**. See `QUESTIONS.md`.

---

## 4. Goals & Success Criteria

### Business goals `[PROJ: content/hackathon.md]`
- Advance the Academy's vision of supporting an innovation culture and institutional transformation.
- Launch a structured program to identify challenges and design applicable, testable solutions.
- Position the Academy as a national hub for applied innovation in the financial sector.
- Support Vision 2030's Financial Sector Development Program.

### Product success criteria
| # | Criterion | Measure |
|---|-----------|---------|
| SC1 | Full DGA Platforms Code v1.0 compliance | 100% of applicable `[S3]` primary criteria satisfied; documented in `COMPLIANCE_MATRIX.md` |
| SC2 | Arabic-first, RTL-default | All pages/components RTL; Arabic primary; English secondary `[S3]` `[PROJ]` |
| SC3 | WCAG 2.2 AA | Passes checklist in `ACCESSIBILITY_CHECKLIST.md` `[PROJ: CLAUDE.md]` |
| SC4 | Responsive | Usable at Mobile / Tablet / Desktop with automatic reflow `[S3]` |
| SC5 | Reusable component library | DGA components built once, reused; no page-specific one-offs `[PROJ]` |
| SC6 | Innovation submission possible in minimal steps | Common task completion with minimal steps `[S3: experience]` |

### The hackathon's own judging criteria (product context, not app requirements) `[PROJ]`
Clarity of idea · Impact on the Academy · Feasibility · Financial value/efficiency · Innovation level · Scalability & sustainability. These are the **fields/rubric** the submission form and review views must express — see `CONTENT_STRUCTURE.md`.

---

## 5. In Scope

- Hackathon **landing page** (e-Participation-style) with hero + mandated sections.
- **"Submit Your Innovation"** multi-step form flow (form template + Steps + File Uploader + validation).
- **"Manage My Requests"** area (list/table of submissions, statuses, detail view).
- Supporting content: About the hackathon, goals, evaluation criteria, timeline, FAQ.
- **Feedback / rating** mechanism `[S3: rating-section, feedback-section]`.
- **Sitemap**, navigation header, footer, breadcrumbs `[S3]`.
- Full RTL Arabic-first implementation with English as a secondary language toggle `[S3]`.
- Reusable DGA component library (see `COMPONENT_MAPPING.md`).

## 6. Out of Scope (this project / this phase)

- Backend, database, authentication server, real submission persistence (assume mock/stub API unless confirmed — **Q2**).
- Content authoring/CMS.
- Any non-DGA visual theming or custom branding beyond DGA foundations `[S3]`.
- Native mobile apps.
- **This phase specifically:** No React/HTML/CSS, no mockups, no implementation `[PROJ: TASK.md]`.

---

## 7. Constraints & Non-Negotiables

1. **Never invent DGA requirements.** Unverifiable items go to `QUESTIONS.md` as "Needs Confirmation" `[PROJ: CLAUDE.md]`.
2. **Official DGA guidance outranks community examples** `[S1]/[S2]/[S3]` > `[S5]/[S6]`.
3. **Arabic primary, RTL default** `[S3]` `[PROJ]`.
4. **WCAG 2.2 AA** `[PROJ]`.
5. **TypeScript + React**, modern best practices, semantic HTML, reusable components `[PROJ: CLAUDE.md]`.
6. Use **approved font (IBM Plex Sans Arabic)**, **approved colors**, **approved icons**, **global spacing tokens** — no customization of base component design `[S3]`.
7. Follow the **defined phase workflow**; do not skip phases `[PROJ: CLAUDE.md]`.

---

## 8. Deliverables of This Phase

The 17 planning documents in `docs/` (this document is one). Implementation begins **only after written approval** of `PROJECT_READINESS_REPORT.md` `[PROJ: TASK.md]`.

---

## 9. Key Open Questions (summary — full list in `QUESTIONS.md`)

- **Q1** Landing template: e-Participation vs Home page?
- **Q2** Is there a backend/API, or is submission mocked for the hackathon demo?
- **Q3** Exact DGA color hex values / type scale / breakpoint pixels (not scrapable from `[S1]`).
- **Q4** Authentication model — who can submit (SSO? Academy staff only?).
- **Q5** Digital stamp applicability to this platform type.
