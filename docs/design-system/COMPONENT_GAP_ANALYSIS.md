# Component Gap Analysis — GOV-SA Legacy Repo vs FADS / Platforms Code v1.0

> Compares the legacy **GOV-SA** component set against our `COMPONENT_INVENTORY.md` (which targets DGA **Platforms Code v1.0**). Purpose per the 2026-07-08 directive: **structure reference, behavior comparison, and gap identification** — **not** reuse.
>
> **Reuse verdict:** the legacy components are **SCSS + HTML + jQuery** (Bootstrap-based). They **cannot be reused** in our React/TypeScript app. We reference their *structure/patterns* only; we build FADS React components against Platforms Code.

---

## 1. Legacy component set (evidence)

From `README.md`, `src/scss/components/*`, and `src/packages/govsa-*.scss` (~23 components):

`accordion · alert · breadcrumb · button · card · checkbox · color · dropdown · file-upload · footer · header · image · link · outline · pagination · radio · search · side-navigation · switch · table · tabs · tag · text-input`

Each is a `.govsa-*` BEM SCSS module; interactivity via **jQuery/Bootstrap** (`popper.js` for dropdowns/tooltips).

## 2. Mapping: legacy ↔ FADS (Platforms Code) component

| Legacy `.govsa-*` | FADS / DGA (`COMPONENT_INVENTORY.md`) | Notes |
|---|---|---|
| button | Button **CMP-05** ✅ built | Legacy radius pill (3rem); FADS states richer. |
| link | Link **CMP-06** ✅ built | FADS adds external/disabled semantics. |
| tag | Tag **CMP-26** ✅ built | FADS encodes status-vs-category (DC-05). |
| text-input | TextInput **CMP-13** ✅ built | FADS adds Field a11y wiring. |
| accordion | Accordion **CMP-08** | pending |
| alert | Inline Alert **CMP-23** / Notification **CMP-24** | pending |
| breadcrumb | Breadcrumbs **CMP-04** | pending |
| card | Card **CMP-07** | pending |
| checkbox | Checkbox **CMP-17** | pending |
| dropdown | Dropdown **CMP-15** | pending (legacy = Bootstrap dropdown) |
| file-upload | File Uploader **CMP-20** | pending |
| footer | Footer **CMP-03** | pending |
| header | Navigation Header **CMP-01** | pending |
| image | (utility) | not a DGA component per se |
| outline | (focus/outline utility) | maps to our focus-ring token |
| pagination | Pagination **CMP-28** | pending |
| radio | Radio **CMP-16** | pending |
| search | Search **CMP-33** | pending (conditional Q10) |
| side-navigation | Nav Drawer **CMP-02** | pending |
| switch | Switch **CMP-18** | pending |
| table | Table **CMP-27** | pending |
| tabs | Tabs **CMP-09** | pending |
| color | (palette, not a component) | see token analysis |

## 3. Gaps — Platforms Code components MISSING from the legacy repo

The legacy repo does **not** contain these Platforms Code components we require (`COMPONENT_INVENTORY.md`):

- **Modal** (CMP-25) · **Notification/Toast** (CMP-22) · **Content Switcher** (CMP-10) · **Menu** (CMP-11) · **Avatar** (CMP-12) · **Date Picker** (CMP-19) · **Steps** (CMP-21) · **Rating** (CMP-29) · **Tooltip** (CMP-30) · **Loading** (CMP-31) · **Digital Stamp** (CMP-32).

→ These have **no legacy reference**; build them purely from Platforms Code specs.

## 4. Gaps — legacy components with NO direct DGA-v1.0 slot
- `image`, `outline`, `color` are Bootstrap utilities/palette, not Platforms Code components. No action.

## 5. What we can legitimately learn (reference only)
- **Structure/markup** conventions for accordion, dropdown, table, file-upload (DOM shape, ARIA hooks used).
- **RTL build approach** (`postcss-rtl`) — informative, though FADS uses **logical properties** instead (DC-23), which is superior and manual-flip-free.
- **Behavior** expectations (e.g., dropdown open/close, accordion expand) — but FADS re-implements accessibly in React (keyboard, focus trap) per `INTERACTION_SPECIFICATION.md`, which the jQuery versions do not fully guarantee.

## 6. What we must NOT copy
- ❌ jQuery/Bootstrap behavior code.
- ❌ TheSans/Noto typography.
- ❌ Legacy color/radius values as final tokens.
- ❌ BEM `.govsa-*` class system (FADS uses CSS Modules + tokens).
- ❌ The legacy icon font (Q8 icon library is separate/official).

## 7. Reuse decision
| Option | Verdict |
|---|---|
| Reuse legacy React components | ❌ None exist. |
| Vendor legacy SCSS/CSS | ❌ No (Bootstrap/jQuery, wrong generation, GPL-3.0). |
| Reference structure/behavior/patterns | ✅ Yes, informative only. |
| Build FADS React components per Platforms Code | ✅ **Chosen path** (continue Phase 5 on placeholders). |

## 8. Impact on Phase 5 plan
No change to the build order (`COMPONENT_INVENTORY.md §8`). The legacy repo neither accelerates nor blocks it; it provides optional structural reference for the pending components. FADS remains the single implementation, token-only, "Pending final DGA token values."

## 9. Open items
Q3/Q20 (tokens), Q8 (official icons vs legacy icon font), Q34 (confirm legacy scope). See `QUESTIONS.md`.
