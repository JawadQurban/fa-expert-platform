# Design Constraints (FADS Guardrails)

> The **binding rules** every FADS component, pattern, and consuming product must obey. These are the enforceable form of the DGA Platforms Code `[S3]` and the project mandate `[PROJ]`. Violating a 🔴 constraint is a compliance failure.
>
> Constraint IDs (`DC-##`) are referenced by `TESTING_STRATEGY.md`, code review, and lint rules in implementation.

---

## 1. Absolute constraints (🔴 — never violate) `[S3]`

| ID | Constraint | Source | Enforced by |
|---|---|---|---|
| DC-01 | **Never invent a DGA requirement.** Unverifiable → `QUESTIONS.md`. | `[PROJ: CLAUDE.md]` | Review |
| DC-02 | **Use DGA components as defined** — no change to shape, border-radius, color, spacing. | `[S3]` | Review + visual audit |
| DC-03 | **Tokens only** — no hard-coded color/space/type/radius/elevation/motion values. | `[DESIGN_TOKENS.md]` | Lint + review |
| DC-04 | **Only approved colors** (DGA Color Design Tokens); no replacements. | `[S3: F2]` | Lint + contrast audit |
| DC-05 | **Status colors reserved** for success/error/warning/information only. Categories use neutral/primary. | `[S3: F3, F11]` | Review |
| DC-06 | **On-Color** variants required on colored/image backgrounds. | `[S3: F4]` | Review + contrast |
| DC-07 | **Approved font only:** IBM Plex Sans Arabic. No other families. | `[S3: F5]` | Lint |
| DC-08 | **Global spacing tokens only** — no element-custom spacing. | `[S3: F8]` | Lint |
| DC-09 | **Official icons only** — no resize/recolor; **>24px ⇒ Featured icon**. | `[S3: F9, F10]` | Review |
| DC-10 | **Arabic-first, RTL-default**; English secondary with full parity on switch. | `[S3: F15–F17]` | Review + i18n tests |
| DC-11 | **WCAG 2.2 AA** for every component and page. | `[PROJ]` | axe + manual audit |
| DC-12 | **Every DGA state** for a component must be implemented. | `[S3]` | State tests |
| DC-13 | **Modal not used for large data entry** — use form template/pattern. | `[S3: C9]` | Review |
| DC-14 | **Motion never hides key elements**; respect `prefers-reduced-motion`. | `[S3: E10]` | Review |
| DC-15 | **Semantic HTML + TypeScript**; no `any`, no div-soup for interactive elements. | `[PROJ]` | Lint + review |

## 2. Structural constraints (🟠 — architectural)

| ID | Constraint | Source |
|---|---|---|
| DC-20 | Products (L4) compose from FADS only; **never restyle base components**. | `[PROJ: G2]` `[DESIGN_SYSTEM_SPECIFICATION.md]` |
| DC-21 | One component per DGA element; **no page-specific forks**. | `[PROJ: G2]` |
| DC-22 | New needs are met by **patterns** (composition of approved primitives), not new base styling. | `[S3]` |
| DC-23 | Logical CSS properties only (`*-inline/*-block`); **no `left`/`right`** in styling or token names. | `[S3: F17]` |
| DC-24 | All copy via the message catalog; **no hard-coded strings** in components. | `[CONTENT_MODEL.md]` |
| DC-25 | Directional icons/assets mirror correctly on direction change. | `[S3: F17]` |
| DC-26 | Consistent terminology, feedback, and error patterns across products. | `[S3: E9, E15, E16]` |
| DC-27 | Every interactive element exposes a visible **Focused** state. | `[S3]` (2.4.7) |
| DC-28 | External links carry the external-link (Link Square) icon. | `[S3: C4, C20]` |

## 3. Content & UX constraints `[S3: التجربة]`

| ID | Constraint |
|---|---|
| DC-30 | Clear visual hierarchy; important elements first `[S3: E1]`. |
| DC-31 | Common tasks completable in **minimal steps** `[S3: E3]`. |
| DC-32 | Predictable, consistent interaction patterns `[S3: E6, E7]`. |
| DC-33 | Consistent, clear error messages (problem + how to fix) `[S3: E16]`. |
| DC-34 | Confirmation message after key submissions `[S3: E13]`. |
| DC-35 | Privacy/security notices visible & placed at key points `[S3: E14]`. |
| DC-36 | Sitemap kept consistent with nav header/footer/breadcrumb `[S3: E12]`. |
| DC-37 | Search results categorized + user filters (type/date) `[S3: E17]`. |

## 4. Explicitly ALLOWED (to prevent over-restriction)

| Allowed | Boundary `[S3]` |
|---|---|
| **Card adjustments** | Only **two**: internal alignment OR inner spacing — for visual contrast across multiple cards `[S3: Card]`. |
| **New sections** | Permitted if built from approved foundations (colors, fonts, buttons) `[S3: Templates]`. |
| **Dropdown list items** | Adding Dropdown List Items is the only allowed change `[S3: Dropdown]`. |
| **Composition** | Combining approved primitives into patterns (L3). |
| **Adding a needed icon** | Only if missing from the library, designed per guidelines, and **submitted for approval** `[S3: F12]`. |

## 5. Forbidden (anti-patterns) — quick reference
❌ Custom button/input styling · ❌ Modal for bulk data entry · ❌ Status colors for decoration/category · ❌ Custom spacing · ❌ Resized/recolored icons · ❌ Non-approved fonts · ❌ `left`/`right` styling · ❌ Hard-coded values/strings · ❌ Page-specific component forks · ❌ Hiding CTAs behind motion.

## 6. Enforcement plan (implementation)
- **Lint rules:** ban hard-coded color/px/font, ban `left`/`right`, ban literal UI strings.
- **Architecture tests:** `features/*` may import from `design-system/*` but not vice-versa; base components not re-exported with style overrides.
- **CI gates:** axe (DC-11), state-coverage tests (DC-12), contrast check when tokens land (DC-04/06).
- **Manual DGA audit:** `COMPLIANCE_MATRIX.md` walkthrough (`TESTING_STRATEGY.md §7`).

## 7. Blocked verification
Contrast (DC-04/06) and exact spacing/type conformance (DC-08/09) can only be fully verified once DGA token values are integrated — **Q3/Q20**.
