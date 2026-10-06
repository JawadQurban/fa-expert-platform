# Layout Specification — Financial Academy Innovation Hackathon

> The spatial system: grid, containers, spacing, columns, alignment, and section ordering. RTL-default. All metrics reference **FADS tokens** (`DESIGN_TOKENS.md`); **exact pixel values are pending Q3** and must come from the official DGA grid `[S3: F8, F13]`. Working numeric ranges below are **non-authoritative placeholders** (from `RESPONSIVE_STRATEGY.md §1`) so engineers can start structuring; they must be swapped for official DGA values.

---

## 1. Breakpoint tiers `[S3: F13]`
| Tier | Token | Working range (⚠Q3) | Base columns (working) |
|---|---|---|---|
| Mobile | `sys.breakpoint.mobile` | < 768px | 4 |
| Tablet | `sys.breakpoint.tablet` | 768–1023px | 8 |
| Desktop | `sys.breakpoint.desktop` | ≥ 1024px | 12 |

- Mobile-first: base styles target Mobile; enhance upward.
- ⚠ Column counts, exact thresholds, and whether DGA uses a 12-col grid are **pending Q3** (official grid). Structure the code so the column count is token-driven.

## 2. Grid system
- **12-column fluid grid** (working assumption) with token-driven **gutter** and **margin**.
- Grid tokens (values ⚠Q3): `sys.grid.columns.{mobile,tablet,desktop}`, `sys.grid.gutter.{...}`, `sys.grid.margin.{...}`.
- Use CSS Grid/Flex with **logical** placement (no `left/right`, DC-23). Column spans expressed logically (start/end).
- Cards and section content align to the grid; never arbitrary offsets.

## 3. Containers & content width
| Container | Purpose | Max width (⚠Q3) | Behavior |
|---|---|---|---|
| `container.full` | Hero backgrounds, full-bleed bands | 100% | edge-to-edge; inner content still gridded |
| `container.page` | Default page content | large max (e.g. ~1200–1280px working) | centered; side margins from grid margin token |
| `container.prose` | Long-form text (About, Privacy, Terms, A11y) | reading measure (~65–80 Arabic chars) | improves legibility (`VISUAL_HIERARCHY.md`) |
| `container.form` | Submission form | narrow-medium | single-column focus |

- Content never exceeds `container.page`; text-heavy blocks use `container.prose`.
- Wide content (tables, timelines) that can't fit **scrolls within its own container** — the page body never scrolls horizontally (WCAG 1.4.10).

## 4. Section spacing (vertical rhythm)
- Between major sections: `sys.space.section-gap` (largest global step).
- Within a section (heading→content): `sys.space.stack.lg`.
- Between items in a group: `sys.space.stack.md` / `sys.space.inline.md`.
- Label→control (forms): `sys.space.stack.xs`.
- **Global spacing tokens only** — no element-custom spacing (DC-08 / `[S3: F8]`). All steps are multiples of the 4/8/16 base scale `[S3]`.

## 5. Margins & insets
- Page side margins = grid `margin` token (responsive: smaller on mobile, larger on desktop).
- Component internal padding = `sys.space.inset.*` scaled by component size.
- Touch spacing: interactive targets keep ≥ `sys.space.inline.sm` separation to avoid mis-taps (supports 2.5.8).

## 6. Columns per section (responsive matrix)
| Section | Desktop | Tablet | Mobile |
|---|---|---|---|
| Hero (text/media) | 6 + 6 (or full-bleed) | stacked or 7+5 | 1 (stacked) |
| Goals | 3-col | 2-col | 1-col |
| Evaluation Criteria (6) | 3×2 | 2×3 | 1×6 |
| How to Participate (4 steps) | 4 across (horizontal) | 4 across / 2×2 | vertical |
| Timeline | horizontal | horizontal/scroll | vertical |
| Partners | 5–6 across | 3 across | 2 across |
| FAQ | full width (1) | full width | full width |
| Feedback | centered narrow | narrow | full width |
| Footer groups | 4-col | 2-col | 1-col (stacked) |
| Manage table | 12-col table | scroll container | card list (1-col) |
| Submit form | `container.form` (1-col) | 1-col | 1-col |

## 7. Alignment rules (RTL)
- **Text alignment:** Arabic → start (right). Latin/numeric fragments handled via bidi isolation, not forced alignment.
- **Block alignment:** content blocks align to grid start; centered only for hero text, empty states, 404, and short feedback blocks.
- **Icon-label pairs:** icon at logical start of label (mirrors in LTR) (DC-25).
- **Form fields:** labels above controls (recommended for clarity + mobile), start-aligned.
- **Numbers/dates:** localized; tabular alignment in tables (end-aligned numeric columns as appropriate).
- **Buttons in a row:** primary action at logical **end** of the group in flows (e.g., «التالي» end, «السابق» start); confirm the DGA button-order convention against Figma (⚠Q6 note).

## 8. Vertical order & z-layering
- **DOM order = visual order = reading order** (RTL) for a11y (WCAG 1.3.2).
- Z-index via `sys.z.*` scale (base < dropdown < sticky-header < drawer < modal < toast < tooltip) — single ordered scale (`DESIGN_TOKENS.md §4.7`).
- Sticky header allowed; must not obscure focused content (WCAG 2.4.11) — offset focus scroll accordingly.

## 9. Section ordering rules `[S3: T3, E1]`
- Hero is always first; the **first section after hero is the info/about section** (participatory/info platform) — not a service list.
- Primary actions (Submit/Manage) reachable from header on every screen + hero on landing.
- Support content (FAQ/Feedback/Policies) sits late/bottom + footer.
- Ordering is consistent across the app (consistent navigation, WCAG 3.2.3).
- ⚠ If the official **e-Participation 8-section** order (Q6) differs, reconcile the landing order to it; the grid/container/spacing system is unaffected.

## 10. Density & whitespace
- Government-appropriate, generous whitespace; avoid cramped layouts (aids scanning, `VISUAL_HIERARCHY.md`).
- Consistent section rhythm creates predictable scanning (WCAG 3.2 predictability).

## 11. Definition of Done (layout)
- [ ] Grid/gutter/margin from DGA tokens (0 hard-coded, DC-03/08)
- [ ] No horizontal page scroll at 320px (1.4.10)
- [ ] Logical properties only (DC-23)
- [ ] Reflow matrix (§6) verified at all tiers
- [ ] DOM = visual = reading order (1.3.2)
- [ ] Prose blocks use reading-measure container

## 12. Open items
Q3 (grid/breakpoint/spacing values), Q6 (section order reconciliation). See `QUESTIONS.md`.
