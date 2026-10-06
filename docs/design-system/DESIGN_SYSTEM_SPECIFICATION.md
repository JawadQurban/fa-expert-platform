# Financial Academy Design System (FADS) — Specification

> **Document type:** Design System charter / specification
> **DS version:** `0.1.0` (pre-token — architecture defined, official DGA token values pending Q3/Q20)
> **Last updated:** 2026-07-07
> **Source legend:** defined in `PROJECT_SCOPE.md §1` (`[S1]`–`[S6]`, `[S3]` = `references/DGA_Standards.xlsx`, `[PROJ]` = project brief).

---

## 1. Purpose & positioning

The **Financial Academy Design System (FADS)** is the shared, reusable UI foundation for the Academy's digital products. It is **not a new visual language** — DGA rules forbid customizing the base design `[S3]`. FADS is:

1. A **faithful adoption** of the **DGA Unified Design System — "Platforms Code" v1.0** (tokens, components, states, templates) `[S3]`.
2. An **engineering + composition layer** (React/TypeScript wrappers, content model, patterns, governance) that lets multiple Academy products reuse that adoption without re-implementing it.

> **The Innovation Hackathon page is the first consumer of FADS**, not its owner. Every artifact here is written to serve *N* future Academy products, with the Hackathon as consumer #1. Hackathon-specific mapping lives in `COMPONENT_MAPPING.md`, `WIREFRAME.md`, `USER_FLOW.md`, and `CONTENT_STRUCTURE.md`; product-agnostic definitions live in this document set.

### FADS ≠ a fork of Platforms Code
FADS **must not** introduce alternate colors, spacing, type, or restyled base components. Where the Academy needs something Platforms Code does not cover, FADS composes approved primitives into **patterns** (see §6) using only approved foundations `[S3]`. This is the single most important boundary in the system.

---

## 2. Layered architecture

```
┌─────────────────────────────────────────────────────────────┐
│ L4  Product consumers                                        │
│     • Innovation Hackathon (consumer #1)  • future products  │
├─────────────────────────────────────────────────────────────┤
│ L3  FADS Patterns (composition of approved primitives)       │
│     e.g. multi-step form, entity list+filter, feedback block │
├─────────────────────────────────────────────────────────────┤
│ L2  FADS Component layer (React wrappers over Platforms Code)│
│     primitives · composite · shell — full DGA state sets     │
├─────────────────────────────────────────────────────────────┤
│ L1  FADS Token layer (adopted DGA Design Tokens, unaltered)  │
│     color · type · spacing · radius · elevation · motion     │
├─────────────────────────────────────────────────────────────┤
│ L0  DGA Platforms Code v1.0  (external source of truth) [S3] │
└─────────────────────────────────────────────────────────────┘
```

| Layer | Owns | Reference doc |
|---|---|---|
| L0 | DGA rules & values (external) | `DGA_MASTER_SPECIFICATION.md` |
| L1 | Token taxonomy & names (values from DGA) | `DESIGN_TOKENS.md` |
| L2 | Component contracts, states, a11y | `COMPONENT_INVENTORY.md` |
| L3 | Reusable interaction patterns | `COMPONENT_INVENTORY.md §Patterns` |
| L4 | Product composition | `COMPONENT_MAPPING.md` (Hackathon) |

Cross-cutting: **constraints** (`DESIGN_CONSTRAINTS.md`), **content** (`CONTENT_MODEL.md`), **engineering** (`REACT_ARCHITECTURE.md`, `STATE_MANAGEMENT.md`, `PERFORMANCE_STRATEGY.md`), **quality** (`ACCESSIBILITY_CHECKLIST.md`, `TESTING_STRATEGY.md`).

---

## 3. Design principles (inherited from DGA Experience) `[S3]`

1. **Arabic-first, RTL-default** — primary language Arabic; layout RTL; English secondary with full parity `[S3: F15–F17]`.
2. **Compliance over creativity** — never customize DGA base design; never invent requirements `[S3]` `[PROJ]`.
3. **Reuse over repetition** — one component per DGA element; no page-specific forks `[PROJ: G2]`.
4. **Clarity & minimal steps** — visual hierarchy, intuitive navigation, common tasks in minimal steps `[S3: E1–E3]`.
5. **Consistency** — unified terminology, feedback, and error handling across every product `[S3: E9, E15, E16]`.
6. **Accessible by default** — WCAG 2.2 AA baked into every component (states, contrast, focus) `[PROJ]`.
7. **Predictable & honest** — no key element hidden behind motion; consistent behavior `[S3: E6, E10]`.

---

## 4. What FADS provides to a consuming product

| Deliverable | Description |
|---|---|
| **Token package** | Adopted DGA tokens as CSS custom properties + typed TS map (`DESIGN_TOKENS.md`) |
| **Component library** | React/TS components with full DGA states + a11y (`COMPONENT_INVENTORY.md`) |
| **Patterns** | Higher-order compositions (forms, lists, feedback) built from primitives |
| **RTL/i18n scaffolding** | Direction + locale providers, logical-property conventions |
| **Content model** | Localization + terminology governance (`CONTENT_MODEL.md`) |
| **Guardrails** | Lint/architecture rules enforcing constraints (`DESIGN_CONSTRAINTS.md`) |
| **Quality gates** | A11y + DGA audit checklists (`ACCESSIBILITY_CHECKLIST.md`, `TESTING_STRATEGY.md`) |

A product consumer (like the Hackathon) **composes** these — it does not restyle or extend base components.

---

## 5. Governance

- **Single source of truth:** DGA **Platforms Code v1.0** `[S1]/[S2]/[S3]`. FADS tracks it; it never diverges.
- **Legacy reference boundary (2026-07-08):** The `GOV-SA/design-system-gov.sa` repo is the **legacy GOV.SA** system (Bootstrap/jQuery/SCSS, TheSans font) — a **reference only**, ranked above community examples but **below** Platforms Code, and **not** a source of tokens or components. See `LEGACY_REFERENCE_DECISION.md`.
- **Change control:** any new token/component/pattern requires (a) a DGA source citation or (b) a composition of approved primitives — documented as a decision in `DESIGN_DECISIONS.md`.
- **Versioning:** semantic versioning for the FADS package (see §7). Docs carry a `DS version`.
- **Additions vs. customizations:** *Additions* = new compositions from approved primitives (allowed). *Customizations* = altering base component shape/color/spacing (forbidden `[S3]`).
- **Deprecation:** components map 1:1 to DGA elements; if DGA deprecates, FADS follows.
- ⚠ **Distribution model** (in-repo folder vs internal npm package vs monorepo) is undecided — **Q24**.

## 6. Patterns (L3) — composition, not new components

Patterns are named, reusable compositions of approved primitives that recur across products:

| Pattern | Composed from | First consumer |
|---|---|---|
| **Multi-step form** | Steps + Inputs + File Uploader + Modal + Notification | Hackathon "Submit" |
| **Entity list + filter** | Table/Card + Dropdown + Tag + Pagination | Hackathon "Manage Requests" |
| **Content-section grid** | Card grid + heading + CTA | Hackathon landing |
| **Feedback block** | Rating + Textarea + confirmation Notification | Hackathon feedback |
| **App shell** | Nav Header + Nav Drawer + Breadcrumbs + Footer | All products |

Each pattern must obey all `DESIGN_CONSTRAINTS.md` rules and use only L1/L2.

## 7. Versioning & release

- **SemVer** for the FADS package: `MAJOR.MINOR.PATCH`.
- `0.x` = pre-adoption (current) — architecture ready, official token values not yet integrated.
- `1.0.0` target = all DGA tokens integrated + core components pass DGA + a11y audits.
- Changes recorded in root `CHANGELOG.md`.
- ⚠ Release cadence/branching — **Q25**.

## 8. Relationship to existing planning docs

| This spec references | For |
|---|---|
| `DGA_MASTER_SPECIFICATION.md` | The external DGA rules (L0) |
| `COMPLIANCE_MATRIX.md` | Traceability of every rule |
| `DESIGN_TOKENS.md` / `COMPONENT_INVENTORY.md` | L1 / L2 detail |
| `DESIGN_CONSTRAINTS.md` | The guardrails |
| `REACT_ARCHITECTURE.md` / `STATE_MANAGEMENT.md` / `PERFORMANCE_STRATEGY.md` | Engineering |
| `CONTENT_MODEL.md` | Content/localization |

## 9. Open questions raised here
Q24 (distribution), Q25 (release cadence), Q26 (multi-product theming within DGA limits) — see `QUESTIONS.md`. Plus all inherited blockers (Q3, Q20).
