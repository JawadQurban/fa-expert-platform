# Component Inventory (FADS L2 + L3)

> The **product-agnostic** catalog of the Financial Academy Design System component library and patterns. Each entry is a **DGA Platforms Code** element wrapped for React with its full state set and accessibility contract `[S3]`.
>
> **Relationship to `COMPONENT_MAPPING.md`:** that document maps these components onto **Hackathon** pages/regions (consumer #1). *This* document is the canonical, reusable inventory shared by all future products. IDs (`CMP-01`…`CMP-33`) are shared between both docs.
>
> **DS version:** `0.1.0`. **No component is built this phase** — this is the contract every component must satisfy in implementation.

---

## 1. Tiers

| Tier | Definition | Location (`REACT_ARCHITECTURE.md`) |
|---|---|---|
| **Primitive** | Single DGA element, minimal composition | `design-system/primitives` |
| **Composite** | DGA element with internal structure/subparts | `design-system/composite` |
| **Shell** | App-frame elements | `design-system/shell` |
| **Pattern (L3)** | Reusable composition of the above | `design-system/patterns` |

Every component must implement the exact DGA **state set** from `DGA_MASTER_SPECIFICATION.md §4` — state completeness is a compliance line item (`TESTING_STRATEGY.md §2`).

---

## 2. Primitives

| ID | Component | Tier | Required states `[S3]` | A11y contract (WCAG 2.2 AA) | Priority |
|---|---|---|---|---|---|
| CMP-05 | Button | Primitive | Default, Hovered, Pressed, Selected, Focused, Disabled | role=button, visible focus (2.4.7), name=label (2.5.3), target ≥24px | Primary |
| CMP-06 | Link | Primitive | Default, Hovered, Pressed, Focused, Visited, Disabled | descriptive text (2.4.4), external-link icon `[S3: C4]` | Primary |
| CMP-13 | Text Input | Primitive | Default, Hovered, Pressed, Focused, Read-only, Disabled | label+for, error via aria-describedby (3.3.1/2) | Primary |
| CMP-14 | Textarea | Primitive | Default, Hovered, Pressed, Focused, Read-only, Disabled | placeholder+helper+error (3.3) | Primary |
| CMP-15 | Dropdown | Primitive | Default, Hovered, Pressed, Focused, Read-only, Disabled | listbox/combobox roles, keyboard nav | Primary |
| CMP-16 | Radio | Primitive | Default, Hovered, Focused, Read-only, Disabled; Selected/Unselected | radiogroup, arrow-key nav | Primary |
| CMP-17 | Checkbox | Primitive | Checked/Unchecked/Indeterminate (+ focus/disabled) | aria-checked incl. mixed | Primary |
| CMP-18 | Switch | Primitive | Default, Hovered, Focused, Disabled; On/Off | role=switch, aria-checked | Primary |
| CMP-26 | Tag | Primitive | status vs neutral/primary | status color only for status (4.1.2) `[S3: F11]` | Primary |
| CMP-30 | Tooltip | Primitive | placement (top/bottom/right/left) + alignment | dismissable/hoverable/persistent (1.4.13) | Primary |
| CMP-12 | Avatar | Primitive | initials / image / icon | alt/name for image variant | Primary |

## 3. Composite

| ID | Component | Required states / rules `[S3]` | A11y contract | Priority |
|---|---|---|---|---|
| CMP-07 | Card | Default, Hover, Focused, Disabled; only 2 allowed adjustments; variants (content/image/shadow/no-shadow); CTA on actionable | actionable card is a single focusable target | Primary |
| CMP-08 | Accordion | Default, Hovered, Pressed, Focused, Disabled; Expanded/Collapsed | button+aria-expanded, region | Primary |
| CMP-09 | Tabs | Selected/Unselected | tablist/tab/tabpanel, arrow nav | Primary |
| CMP-10 | Content Switcher | Normal, Hovered, Focused | grouped control, aria-pressed | Primary |
| CMP-11 | Menu | Selected | menu/menuitem, keyboard nav | Primary |
| CMP-19 | Date Picker | Default, Hovered, Pressed, Focused, Disabled; Selected/Today/Next/Prev | grid semantics, RTL next/prev direction | Primary (cond.) |
| CMP-20 | File Uploader | Default, Drag+Hover, Disabled; Uploaded/Not Uploaded; status; errors | drag has click/keyboard alt (2.5.7), status via aria-live (4.1.3) | Primary |
| CMP-21 | Steps | step progression | current step announced, ordered | Secondary |
| CMP-22 | Notification (Toast) | temporary | aria-live=polite, dismissable | Primary |
| CMP-23 | Inline Alert | permanent | role=alert/status as appropriate | Primary |
| CMP-24 | Notification (banner) | high-priority permanent, top of page | role=alert for high priority | Primary |
| CMP-25 | Modal | confirmation/feedback/alerts only (not bulk entry) | focus trap+restore, Esc, aria-modal, labelled | Primary |
| CMP-27 | Table | per spec | proper th/scope, caption | Primary |
| CMP-28 | Pagination | per spec | nav landmark, current aria-current | Secondary |
| CMP-29 | Rating | Normal, Pressed; Selected, Half | radiogroup/slider semantics, keyboard | Primary |
| CMP-31 | Loading | per spec | aria-busy / status text | Secondary |

## 4. Shell

| ID | Component | Required states / rules `[S3]` | A11y contract | Priority |
|---|---|---|---|---|
| CMP-01 | Navigation Header | Default, Hovered, Pressed, Focused, Disabled, Selected; external-link icon; responsive | nav landmark, current aria-current | Primary |
| CMP-02 | Nav Drawer | open/closed (mobile) | focus trap when open, Esc, toggle button name | Secondary |
| CMP-03 | Footer | official links, logos, contact, privacy; grouped headings | contentinfo landmark, grouped lists | Primary |
| CMP-04 | Breadcrumbs | Default…Disabled; current page disabled/non-interactive | nav+aria-current=page, RTL separators mirror | Primary |
| CMP-33 | Search | search bar + results; bar present on results page | role=search, label | Primary (cond.) |
| CMP-32 | Digital Stamp | top of page; certificate-number link; ≤2 secondary elements (left) | link to cert page, accessible name | Primary (cond. ⚠Q5) |

## 5. Patterns (L3) — reusable compositions

| Pattern ID | Name | Composed from | Rules | First consumer |
|---|---|---|---|---|
| PAT-01 | Multi-step form | CMP-21 + inputs + CMP-20 + CMP-25 + CMP-22/23 | service/form template terms unchanged `[S3: T6]`; Modal only for confirm `[S3: C9]`; consistent errors `[S3: E16]` | Hackathon Submit |
| PAT-02 | Entity list + filter | CMP-27/07 + CMP-15 + CMP-26 + CMP-28 | status via status Tags; category via neutral Tags `[S3: F11]`; filters `[S3: E17]` | Hackathon Manage |
| PAT-03 | Content-section grid | CMP-07 grid + heading + CMP-05 | informational cards CTA optional `[S3: Card]` | Hackathon landing |
| PAT-04 | Feedback block | CMP-29 + CMP-14 + CMP-22 | standardized feedback + confirmation `[S3: T7,T8,E13]` | Hackathon feedback |
| PAT-05 | App shell | CMP-01 + CMP-02 + CMP-04 + CMP-03 | consistent nav (3.2.3); sitemap-consistent `[S3: E12]` | All products |
| PAT-06 | Notification system | CMP-22 + CMP-23 + CMP-24 | Toast=transient, Inline=persistent, Banner=high-priority `[S3: C8]` | All products |

## 6. Component contract (applies to every entry)

Each FADS component ships with:
1. **Strict TypeScript props API** (typed variants/states; no `any`).
2. **Full DGA state set** (from `DGA_MASTER_SPECIFICATION.md §4`).
3. **RTL correctness** — logical properties; mirrored directional icons `[S3: F17]`.
4. **A11y** — semantic element/role, keyboard operability, visible focus, correct name/role/value `[G1]`.
5. **Token-only styling** — no hard-coded values `[DESIGN_TOKENS.md]`.
6. **i18n-ready** — all copy via message catalog, no literals `[CONTENT_MODEL.md]`.
7. **Tests + state showcase** — unit + axe + isolated state review `[TESTING_STRATEGY.md]`.

A component is **Done** only when all seven hold.

## 6a. Implementation status (Phase 5.6 hardening, updated 2026-07-08)

Built in `frontend/src/design-system/` — TypeScript, DGA states, RTL (logical
properties), keyboard + focus, Storybook stories, and unit + axe tests. **Visual
fidelity is "Pending final DGA token values" (Q3/Q20/Q33)** — no pixel-perfect
DGA claim. **Primitives + layout layers are COMPLETE. Composite is now 13 of 16
catalog components** (plus 2 FADS-authored compositions not in the DGA catalog)
**and shell is 4 of 6** — see `reports/COMPONENT_COVERAGE_REPORT.md` for the
full per-component contract checklist.

Component/status counts are unchanged since Phase 5C (still 35 total; no new
components were added or removed by Phase 5.6). Phase 5.6 hardened existing
components in place — see `reports/DESIGN_SYSTEM_HARDENING_REPORT.md` — and
included two **public API renames** worth noting for anyone integrating
against these components: **CMP-16 `RadioGroup`**'s `onChange` prop is now
`onValueChange`, and **CMP-25 `Modal`**'s `closeLabel` prop is now
`dismissLabel`. Nothing in this repository consumed either prop yet (no
product pages exist), so this was a zero-consumer-impact rename.

### Primitives ✅ (14 components)
| ID | Component | Status |
|---|---|---|
| CMP-05 | Button | ✅ variants, sizes, loading, selected, disabled |
| CMP-06 | Link | ✅ external (+placeholder icon, Q8), disabled, visited |
| CMP-26 | Tag / Badge | ✅ neutral/primary + status variants (DC-05 encoded) |
| CMP-13 | TextInput | ✅ label/helper/error via shared `Field` |
| CMP-14 | Textarea | ✅ shared `Field` + control base |
| CMP-15 | Select / Dropdown | ✅ native select, options/placeholder, invalid |
| CMP-17 | Checkbox | ✅ checked/unchecked/**indeterminate**, description |
| CMP-16 | Radio + RadioGroup | ✅ grouped (fieldset/legend), controlled/uncontrolled |
| CMP-18 | Switch | ✅ role=switch, on/off, keyboard, RTL thumb |
| CMP-30 | Tooltip | ✅ placement (RTL-safe), focus/hover, Escape (1.4.13) |
| CMP-12 | Avatar | ✅ image/initials/icon, fallback |
| — | Typography | ✅ Display/Text variants, polymorphic `as` |
| — | Icon (wrapper) | ✅ size caps, tone, decorative/functional |
| — | `Field` (internal) | ✅ shared label/helper/error + ARIA wiring |

### Layout ✅ (2 components)
| Component | Status |
|---|---|
| Container | ✅ page/prose/form/full max-widths |
| Section | ✅ vertical rhythm band + background variants |

### Composite ✅ (13 of 16 catalog components, + 2 FADS-authored)
| ID | Component | Status |
|---|---|---|
| CMP-07 | Card | ✅ static or `actionable` (single focusable target, Enter/Space, disabled) |
| CMP-08 | Accordion | ✅ single-expand disclosure, native button headers, region panels |
| CMP-09 | Tabs | ✅ roving tabindex, **RTL-aware** Arrow keys, Home/End, disabled tabs skipped |
| CMP-19 | Date Picker | ✅ trigger + popover calendar grid, **RTL-aware** Arrow/PageUp/PageDown, focus trap + restore, Esc closes (Primary cond.) |
| CMP-20 | File Uploader | ✅ drag-and-drop + required click/keyboard alternative, per-file status list |
| CMP-21 | Steps | ✅ step progression, `aria-current="step"`, navigation via step buttons only (Secondary) |
| CMP-22 | Notification (Toast) | ✅ `ToastProvider`/`useToast`, auto-dismiss + stacking + pause on hover/focus |
| CMP-23 | Alert (Inline Alert) | ✅ persistent in-context notice; role alert/status by tone |
| CMP-24 | Notification (Banner) | ✅ page-level persistent notice; role alert (error) / status |
| CMP-25 | Modal | ✅ confirmation/feedback only; focus trap + restore, Esc, scrim-click policy |
| CMP-27 | Table | ✅ semantic table, required caption + scope=col, sortable `aria-sort`, empty-state slot |
| CMP-28 | Pagination | ✅ windowed page list, nav landmark, `aria-current="page"` (Secondary) |
| CMP-31 | Loading | ✅ spinner/skeleton, `role="status"`/`aria-busy` (Secondary) |
| — | EmptyState (FADS-authored) | ✅ icon + title + description + action composition |
| — | ErrorState (FADS-authored) | ✅ composes Alert (CMP-23) + retry `Button` |

### Shell ✅ (4 of 6 components)
| ID | Component | Status |
|---|---|---|
| CMP-01 | Header | ✅ title/subtitle/actions banner + optional primary-nav `nav` list (`Link`-based, `aria-current`) — not yet a full multi-level Navigation Header |
| CMP-03 | Footer | ✅ free-form content + labelled links `<nav>` |
| CMP-04 | Breadcrumbs | ✅ ancestor trail; current page is non-interactive text with `aria-current="page"` |
| CMP-02 | Nav Drawer | ✅ controlled open/close, focus trap, Escape, toggle button, `inert` while closed (Secondary) |

### Pending (next milestones)
- **Composite (3 remaining):** Content Switcher (CMP-10), Menu (CMP-11), Rating (CMP-29).
- **Shell (2 remaining):** Search (CMP-33, ⚠Q10), Digital Stamp (CMP-32, ⚠Q5).
- **Patterns (6):** PAT-01…PAT-06.

`color-contrast` a11y checks are deferred to a real browser after Q3 (jsdom
cannot compute contrast).

> **Legacy reference (2026-07-08):** The GOV-SA legacy repo contains ~23 SCSS/jQuery
> `.govsa-*` components. They are **not reusable** (not React; Bootstrap-based; wrong
> generation). We use them only for structure/behavior reference and gap-spotting —
> see `COMPONENT_GAP_ANALYSIS.md`. FADS remains the single React implementation.

## 7. Coverage summary
- Primitives: 11 catalog IDs (14 built, incl. Typography/Icon/Field) · Composite: 16 catalog IDs (13 built, + 2 FADS-authored non-catalog compositions) · Shell: 6 (4 built) · Patterns: 6 (0 built).
- Conditional (pending questions): CMP-19 (date, ✅ built) is no longer blocked on scope, just on token values (Q3) like everything else; CMP-32 (stamp, still blocked on Q5); CMP-33 (search, still blocked on Q10).
- Full DGA rule text per component: `DGA_MASTER_SPECIFICATION.md §4`. Hackathon usage: `COMPONENT_MAPPING.md`.

## 8. Build order (feeds `IMPLEMENTATION_PLAN.md` Phase 2)
Tokens/RTL/font → Shell (PAT-05) → Primitives → Composite → Patterns → product features. Matches `COMPONENT_MAPPING.md §5`.
