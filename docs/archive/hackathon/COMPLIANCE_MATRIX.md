# DGA Compliance Matrix

> Traceability from every applicable **DGA Platforms Code v1.0** criterion `[S3]` to how this project satisfies it. This is the master audit artifact for SC1 (`PROJECT_SCOPE.md §4`).
>
> **Applies?** = does this criterion apply to the Financial Academy Hackathon platform.
> **Status legend:** `PLANNED` = design approach defined this phase · `PENDING-IMPL` = to build in implementation · `NEEDS-CONF` = blocked on a `QUESTIONS.md` item · `N/A` = not applicable (justified).
> Full detail per requirement lives in `DGA_MASTER_SPECIFICATION.md`; this table is the checklist view.

---

## A. Foundations (أساسات) — Primary

| # | Criterion `[S3]` | Applies? | Approach / Where satisfied | Status |
|---|---|---|---|---|
| F1 | Platforms Code v1.0 implemented | Yes | `DESIGN_SYSTEM_PLAN.md` token/component strategy | PLANNED |
| F2 | Approved colors / Color Design Tokens only | Yes | Consume DGA tokens; no custom colors | PLANNED / NEEDS-CONF (Q3 hex) |
| F3 | Status colors reserved (success/error/warning/info) | Yes | Notifications, tags, form validation | PLANNED |
| F4 | "On Color" property on colored backgrounds | Yes | Hero, colored section CTAs | PLANNED |
| F5 | Approved font IBM Plex Sans Arabic | Yes | `DESIGN_SYSTEM_PLAN.md` font loading | PLANNED / NEEDS-CONF (Q7 delivery) |
| F6 | Typography tokens (Display + Text variants) | Yes | Type scale mapping | PLANNED / NEEDS-CONF (Q3 scale) |
| F7 | Responsive typography + heading weights | Yes | `RESPONSIVE_STRATEGY.md` | PLANNED |
| F8 | Global spacing tokens only (4/8/16…) | Yes | No element-custom spacing | PLANNED / NEEDS-CONF (Q3 scale) |
| F9 | Official icons only; no size/color change | Yes | DGA icon library | PLANNED / NEEDS-CONF (Q8 inventory) |
| F10 | Featured icon for >24px | Yes | Hero/feature sections | PLANNED |
| F11 | Icon usage modes (status vs neutral/primary) | Yes | Section/category icons neutral; alerts status | PLANNED |
| F12 | Custom icon → design + approval request | Conditional | Only if a needed icon is missing | PLANNED (process) |
| F13 | Responsive Mobile/Tablet/Desktop auto-reflow | Yes | `RESPONSIVE_STRATEGY.md` | PLANNED / NEEDS-CONF (Q3 breakpoints) |
| F14 | Fully usable on mobile (touch, viewport, nav) | Yes | Nav drawer, 44px targets | PLANNED |
| F15 | Arabic-first content | Yes | All copy Arabic-primary | PLANNED |
| F16 | English secondary; full content on switch | Yes | i18n toggle | PLANNED / NEEDS-CONF (Q9 EN scope) |
| F17 | RTL default layout | Yes | Logical properties, `dir="rtl"` | PLANNED |

## B. Templates (قوالب) — Primary

| # | Criterion `[S3]` | Applies? | Approach | Status |
|---|---|---|---|---|
| T1 | Home page template | Conditional | Landing page — pending Q1 template choice | NEEDS-CONF (Q1) |
| T2 | Hero using one approved type (image/color/object) | Yes | Hackathon hero | PLANNED |
| T3 | First section after hero matches platform type | Yes | For e-participation/info: info section first | PLANNED / NEEDS-CONF (Q1) |
| T4 | Reuse standardized sections (partners etc.) | Yes | Partners/sponsors if present | PLANNED |
| T5 | New sections use approved foundations | Yes | Any custom section uses tokens only | PLANNED |
| T6 | Service page template (Steps/Requirements/Docs/Details Card) | Yes | Submission flow uses exact terms/headings | PLANNED |
| T7 | Rating section | Yes | Feedback on platform/experience | PLANNED |
| T8 | Feedback section | Yes | Standardized feedback form | PLANNED |
| T9 | E-Participation template — 8 sections | Yes (likely primary) | Landing structure | NEEDS-CONF (Q6 section list) |
| T10 | Search template + search bar on results | Conditional | If site-wide search included | NEEDS-CONF (Q10) |
| T11 | Search results categorized + filters | Conditional | Ideas/requests filtering | PLANNED |

## C. Components (عناصر)

| # | Component `[S3]` | Applies? | Where used (this project) | Status |
|---|---|---|---|---|
| C1 | Digital Stamp | NEEDS-CONF | Only if certified content exists | NEEDS-CONF (Q5) |
| C2 | Buttons | Yes | CTAs, form actions | PENDING-IMPL |
| C3 | Dropdown | Yes | Filters, form selects (dept, category) | PENDING-IMPL |
| C4 | Link | Yes | Nav, footer, inline; external-link icon | PENDING-IMPL |
| C5 | Accordion | Yes | FAQ, evaluation-criteria details | PENDING-IMPL |
| C6 | Menu | Yes | Header/user menu | PENDING-IMPL |
| C7 | Content Switcher | Yes | Toggle idea views / request states | PENDING-IMPL |
| C8 | Notification (Toast/Inline/Notification) | Yes | Submit success, validation, banners | PENDING-IMPL |
| C9 | Modal | Yes | Confirm submit/withdraw | PENDING-IMPL |
| C10 | File Uploader | Yes | Attach supporting docs to idea | PENDING-IMPL |
| C11 | Radio | Yes | Form single-choice fields | PENDING-IMPL |
| C12 | Checkbox | Yes | Consent, multi-select | PENDING-IMPL |
| C13 | Switch | Yes | Preferences (e.g., notifications) | PENDING-IMPL |
| C14 | Text Input | Yes | Form fields | PENDING-IMPL |
| C15 | Textarea | Yes | Idea description fields | PENDING-IMPL |
| C16 | Date Picker | Conditional | If dated fields needed | PENDING-IMPL |
| C17 | Tabs | Yes | Manage-requests states; landing sub-nav | PENDING-IMPL |
| C18 | Tags | Yes | Idea categories, request status labels | PENDING-IMPL |
| C19 | Card | Yes | Criteria, sections, idea/request cards | PENDING-IMPL |
| C20 | Navigation Header | Yes | Global header | PENDING-IMPL |
| C21 | Footer | Yes | Global footer (mandatory elements) | PENDING-IMPL |
| C22 | Breadcrumbs | Yes | Sub-pages / form steps | PENDING-IMPL |
| C23 | Avatar | Yes | User/menu | PENDING-IMPL |
| C24 | Rating | Yes | Feedback/rating section | PENDING-IMPL |
| C25 | Tooltip | Yes | Field hints, icon labels | PENDING-IMPL |
| C26 | Table | Yes | Manage-requests list | PENDING-IMPL |
| C27 | Nav Drawer (secondary) | Yes | Mobile navigation | PENDING-IMPL |
| C28 | Pagination (secondary) | Yes | Request list / ideas list | PENDING-IMPL |
| C29 | Loading (secondary) | Yes | Async states | PENDING-IMPL |
| C30 | Steps (secondary) | Yes | Multi-step submission | PENDING-IMPL |

> Every component above must implement the **exact state set** listed in `DGA_MASTER_SPECIFICATION.md §4` — that state coverage is itself a compliance line item and is tracked per component in `COMPONENT_MAPPING.md`.

## D. Experience (التجربة) — Primary & Secondary

| # | Criterion `[S3]` | Applies? | Approach / Where | Status |
|---|---|---|---|---|
| E1 | Clear visual hierarchy | Yes | `WIREFRAME.md`, type scale | PLANNED |
| E2 | Intuitive navigation, logical grouping | Yes | `INFORMATION_ARCHITECTURE.md` | PLANNED |
| E3 | Common tasks in minimal steps | Yes | Submission flow ≤ defined steps | PLANNED |
| E4 | Accessible help resources | Yes | FAQ, help links | PLANNED |
| E5 | Clear/concise language + localization | Yes | `CONTENT_STRUCTURE.md` | PLANNED |
| E6 | Predictable UI | Yes | Consistent components/states | PLANNED |
| E7 | Consistent interaction patterns | Yes | Shared component library | PLANNED |
| E8 | Uniform content tone | Yes | `CONTENT_STRUCTURE.md` tone guide | PLANNED |
| E9 | Consistent feedback (style/timing) | Yes | Notification patterns | PLANNED |
| E10 | Motion never hides key elements | Yes | `DESIGN_DECISIONS.md` motion rule | PLANNED |
| E11 | Touch gestures (swipe/long-press/scroll) | Yes | `RESPONSIVE_STRATEGY.md` | PLANNED |
| E12 | Sitemap (comprehensive, consistent) | Yes | `INFORMATION_ARCHITECTURE.md` | PLANNED |
| E13 | Feedback mechanism + confirmation | Yes | Feedback form + toast | PLANNED |
| E14 | Privacy/security notices visible & placed | Yes | Footer + submission consent | PLANNED / NEEDS-CONF (Q11 policy text) |
| E15 | Terminology consistency | Yes | `CONTENT_STRUCTURE.md` glossary | PLANNED |
| E16 | Consistent error handling | Yes | `ACCESSIBILITY_CHECKLIST.md` + form spec | PLANNED |
| E17 | Search results organized + filters | Conditional | Ideas/requests filtering | PLANNED / NEEDS-CONF (Q10) |

## E. Cross-cutting quality gates

| # | Gate | Status |
|---|---|---|
| G1 | WCAG 2.2 AA `[PROJ]` | Tracked in `ACCESSIBILITY_CHECKLIST.md` |
| G2 | Reusable components, no page-specific one-offs `[PROJ]` | `COMPONENT_MAPPING.md` / `DESIGN_SYSTEM_PLAN.md` |
| G3 | Semantic HTML + TypeScript `[PROJ]` | `IMPLEMENTATION_PLAN.md` |
| G4 | Final DGA audit before sign-off `[PROJ]` | `TESTING_STRATEGY.md` |

---

## Summary counts

- **Foundations:** 17 criteria — all apply.
- **Templates:** 11 — 6 apply directly, 5 conditional/pending.
- **Components:** 30 — 27 apply, 3 conditional (Digital Stamp, Date Picker, some search).
- **Experience:** 17 — all apply (some conditional).
- **Open blockers:** Q1, Q3, Q5, Q6, Q7, Q8, Q9, Q10, Q11 (see `QUESTIONS.md`).
