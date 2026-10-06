# Accessibility Checklist — WCAG 2.2 AA

> Target: **WCAG 2.2 Level AA** `[PROJ: CLAUDE.md]`, reinforced by DGA Experience criteria (contrast, On-Color, Focused states, clear errors, predictable UI) `[S3]`. This checklist is verified during the a11y audit phase (`TESTING_STRATEGY.md`) and feeds gate **G1** (`COMPLIANCE_MATRIX.md`).
>
> DGA components already define **Focused** and interactive states `[S3]` — building all of them is itself an accessibility requirement.

---

## 1. Perceivable

| ✔ | Criterion (WCAG) | Project application | DGA link |
|---|---|---|---|
| ☐ | 1.1.1 Non-text content | All images/icons have Arabic `alt`/labels; decorative icons `aria-hidden` | `[S3: F9]` |
| ☐ | 1.3.1 Info & relationships | Semantic HTML: headings, lists, `<table>`, `<form>`, `<nav>`; ARIA only where needed | `[PROJ]` |
| ☐ | 1.3.2 Meaningful sequence | RTL reading order correct; DOM order = visual order | `[S3: F17]` |
| ☐ | 1.3.5 Identify input purpose | `autocomplete` on personal fields | — |
| ☐ | 1.4.3 Contrast (min) AA | Verify all text ≥4.5:1 (≥3:1 large) via WebAIM; use On-Color on colored bg | `[S3: F2, F4]` |
| ☐ | 1.4.4 Resize text 200% | Responsive typography; no clipping | `[S3: F7]` |
| ☐ | 1.4.10 Reflow | No 2-D scroll at 320px; single-column reflow | `[S3: F13]` |
| ☐ | 1.4.11 Non-text contrast | UI/state indicators ≥3:1 (focus ring, borders) | `[S3]` |
| ☐ | 1.4.12 Text spacing | Layout survives user text-spacing overrides | — |
| ☐ | 1.4.13 Content on hover/focus | Tooltips dismissable, hoverable, persistent | `[S3: C30 Tooltip]` |

## 2. Operable

| ✔ | Criterion | Project application | DGA link |
|---|---|---|---|
| ☐ | 2.1.1 Keyboard | All interactions keyboard-operable (menus, accordion, tabs, modal, uploader, datepicker) | `[S3]` states |
| ☐ | 2.1.2 No keyboard trap | Modal/drawer focus management, escape closes | `[S3: C25]` |
| ☐ | 2.4.1 Bypass blocks | "Skip to content" link | — |
| ☐ | 2.4.3 Focus order | Logical RTL tab order | `[S3: F17]` |
| ☐ | 2.4.4 Link purpose | Descriptive Arabic link text; external-link icon | `[S3: C4]` |
| ☐ | 2.4.7 Focus visible | **Focused** state on every interactive component | `[S3]` (all component states) |
| ☐ | 2.4.11 Focus not obscured (min) **[2.2]** | Sticky header/footer must not hide focused element | — |
| ☐ | 2.5.3 Label in name | Visible label matches accessible name | `[S3: E15]` |
| ☐ | 2.5.5 Target size (AA 2.5.8) **[2.2]** | Interactive targets ≥24px (aim ≥44px for touch) | `[S3: F14, E11]` |
| ☐ | 2.5.7 Dragging movements **[2.2]** | File-upload drag has click/keyboard alternative | `[S3: C10]` |

## 3. Understandable

| ✔ | Criterion | Project application | DGA link |
|---|---|---|---|
| ☐ | 3.1.1 Language of page | `<html lang="ar" dir="rtl">`; switch updates lang/dir | `[S3: F15,F16]` |
| ☐ | 3.1.2 Language of parts | `lang` on inline English parts | `[S3: F16]` |
| ☐ | 3.2.3 Consistent navigation | Header/footer consistent across pages | `[S3: E2, E7]` |
| ☐ | 3.2.4 Consistent identification | Same component = same label/role everywhere | `[S3: E15]` |
| ☐ | 3.2.6 Consistent help **[2.2]** | Help/contact in consistent location | `[S3: E4]` |
| ☐ | 3.3.1 Error identification | Inline, clear, consistent errors | `[S3: E16]` |
| ☐ | 3.3.2 Labels/instructions | Every field labelled + helper text | `[S3: C14, C15]` |
| ☐ | 3.3.3 Error suggestion | Errors say how to fix | `[S3: E16]` |
| ☐ | 3.3.4 Error prevention | Confirm before final submit (Modal) | `[S3: C9, E13]` |
| ☐ | 3.3.7 Redundant entry **[2.2]** | Don't re-ask known data across steps | `[S3: E3]` |
| ☐ | 3.3.8 Accessible authentication **[2.2]** | If auth added, no cognitive-test-only login | ⚠Q4 |

## 4. Robust

| ✔ | Criterion | Project application | DGA link |
|---|---|---|---|
| ☐ | 4.1.2 Name/Role/Value | Correct roles/states on custom widgets (tabs, accordion, switch, modal) | `[S3]` states |
| ☐ | 4.1.3 Status messages | `aria-live` for toasts/inline alerts/upload status | `[S3: C8, C10, E13]` |

## 5. RTL-specific accessibility checks
- ☐ Directional icons (arrows, breadcrumb chevrons, next/prev) mirror correctly in RTL.
- ☐ Focus ring and reading order follow RTL start (right).
- ☐ Date picker Next/Prev direction correct for RTL `[S3: C19]`.
- ☐ Numbers/latin content embedded in Arabic use correct bidi handling.

## 6. Testing tooling (see `TESTING_STRATEGY.md`)
Automated: axe-core / Lighthouse. Manual: keyboard-only pass, Arabic screen reader (NVDA/VoiceOver), 200% zoom, 320px reflow, WebAIM contrast on final tokens `[S3]`.

## 7. Blocked items
Contrast ratios cannot be finalized until real token hex values are known (**Q3**); accessible-auth (3.3.8) depends on **Q4**.
