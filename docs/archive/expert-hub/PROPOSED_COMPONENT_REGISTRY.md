# Expert Hub — Proposed Component Registry (Dashboard Redesign)

> **Status:** DESIGN PHASE — proposed only. **Nothing here modifies production `@ds`.**
> This registry records components the three dashboard redesign alternatives (A/B/C)
> require that do **not** yet exist as approved FADS components. It is the working
> counterpart to the official resolved registry at
> `frontend/src/design-system/registry/figma-component-map.json` (which is READ-ONLY
> for this phase). Each entry is classified:
>
> - **PROPOSED_DS_COMPONENT** — should become a real, reusable FADS component (own a task + Figma node later).
> - **PROPOSED_VARIANT** — a new variant/size of an existing approved FADS component.
> - **APPLICATION_COMPONENT** — Expert-Hub-owned composition of approved `@ds` parts; lives in the app, not the DS.
> - **PAGE_ONLY** — one-off page composition; not extracted.
>
> Visual language, spacing, color, radius, and typography for every entry below are
> bound to existing FADS tokens (`--fads-*`). No new token is introduced.

Created: 2026-09-14 · Owner (design): Expert Hub · Source of truth for implementation: `@ds`

---

## Summary table

| # | Component | Category | Classification | Used in | Extends |
|---|-----------|----------|----------------|---------|---------|
| 1 | KPI / Stat Card | Data display | PROPOSED_DS_COMPONENT | A, B | (fills `Metric`, gap G15) |
| 2 | KPI Tile (compact) | Data display | PROPOSED_VARIANT | B, C | #1 |
| 3 | Trend Indicator | Data display | PROPOSED_DS_COMPONENT | A, B, C | Tag |
| 4 | Sparkline | Data viz | APPLICATION_COMPONENT | A, B | (charting deferred G9) |
| 5 | Area / Line Trend Chart | Data viz | APPLICATION_COMPONENT | A, B | (G9) |
| 6 | SLA Health Meter | Data viz | PROPOSED_DS_COMPONENT | A, B, C | — |
| 7 | Filter Bar / Toolbar | Navigation/Input | PROPOSED_DS_COMPONENT | B, C | Select+SearchBox+Button |
| 8 | Data Toolbar | Table | PROPOSED_DS_COMPONENT | C | Table |
| 9 | Saved View Selector | Navigation | PROPOSED_DS_COMPONENT | B, C | ButtonMenu+Menu |
| 10 | Filter Chip / Builder | Input | PROPOSED_DS_COMPONENT | C | Tag |
| 11 | Bulk Action Bar | Action | PROPOSED_DS_COMPONENT | C | Toast+Button |
| 12 | Side Inspector (drawer) | Overlay | PROPOSED_DS_COMPONENT | C | Modal |
| 13 | Status Summary Bar | Data display | PROPOSED_VARIANT | B, C | ContentSwitcher+Tag |
| 14 | Work-Queue Action Row | List/Table | PROPOSED_VARIANT | B | List/Table |
| 15 | Alerts / Activity Feed item | List | APPLICATION_COMPONENT | A, B | List |
| 16 | App Sidebar Nav | Navigation | APPLICATION_COMPONENT | B, C | Menu |
| 17 | Density Toggle | Input | PROPOSED_VARIANT | C | ContentSwitcher |
| 18 | Column Config menu | Table | PROPOSED_DS_COMPONENT | C | Menu+Checkbox |

---

## 1. KPI / Stat Card  — `PROPOSED_DS_COMPONENT`
- **Category:** Data display
- **Purpose:** Present one headline business figure with its context (trend + period), as the primary scanning unit of an executive/operational dashboard. Directly fills the **Missing `Metric`** gap (assessment `G15`).
- **Anatomy:** container (Card, `effect="stroke"` or shadow) → header row: label (`text-sm`, muted) + optional `ItemIcon`; value (`display-lg`/`display-xl`, `text-default`, `tabular-nums`); footer row: **Trend Indicator** (#3) + period caption (`text-xs`, muted); optional **Sparkline** (#4) pinned to the inline-end/bottom.
- **Variants:** `emphasis=hero | default`; `withSparkline=true|false`; `withIcon`; `tone=neutral|primary` (accent reserved for the single most important KPI only).
- **States:** default, hover (whole card actionable → `card-bg-hover`), focus-visible (2px `border-focus`), loading (skeleton), no-comparison (Trend Indicator hidden — never renders "٠" as "no change").
- **Figma reference:** none yet (propose new node in Platforms Code library, "Metric/Stat" family). Tokens only until then.
- **Accessibility:** value + label form the accessible name when the card is a link; number is always text (never encoded in the sparkline alone); trend has a text label, not color alone. Target 4.5:1 for all text.
- **RTL:** logical layout; sparkline endpoint on the inline-start; delta sign handled with `<bdi>` so `+`/`−` sits on the intended side of Arabic-Indic numerals.
- **Responsive:** min-width ~13rem; wraps in an `auto-fill` grid; hero variant spans 2 columns at ≥`64rem`.
- **Recommended ownership:** FADS (design system).

## 2. KPI Tile (compact) — `PROPOSED_VARIANT` of #1
- **Purpose:** Denser operational KPI for a row of 5+ metrics that double as filter entry points (click → filtered queue).
- **Anatomy:** icon + value (`display-md`) + label (`text-sm`) + inline mini-sparkline; optional Trend Indicator.
- **Variants:** `interactive=true` (renders as `<a>`), `selected` (reflects the active filter).
- **States:** default/hover/focus/selected/loading; `active-filter` shows a 2px inline-start accent stripe (`primary`).
- **A11y/RTL/Responsive:** as #1; selected state is not color-only (adds the stripe + `aria-current`).
- **Ownership:** FADS.

## 3. Trend Indicator — `PROPOSED_DS_COMPONENT`
- **Purpose:** The worded, directional delta beside a figure (`+١٢`, `−٣ أيام`, `لا تغيّر`).
- **Anatomy:** arrow glyph (`arrow-up`/`arrow-down`) + value + optional unit; wrapped as a small pill or inline text.
- **Variants:** `direction=up|down|flat`; `sentiment=positive|negative|neutral` (decoupled from direction — a rising breach count is *negative*); `style=pill|inline`.
- **States:** static; `none` → renders nothing (absence ≠ zero).
- **Accessibility:** direction carried by the arrow glyph **and** the sign, never color alone; sentiment color is supplementary. Status/sentiment palette kept separate from the green brand accent.
- **RTL:** `<bdi>` around the signed number; arrow mirrors by semantic (up/down are vertical, so unaffected).
- **Ownership:** FADS.

## 4. Sparkline — `APPLICATION_COMPONENT`
- **Purpose:** Inline single-series micro-trend inside a KPI card. Charting has no agreed DS approach yet (`G9`), so this lives in the app until a FADS chart primitive exists.
- **Anatomy:** inline SVG polyline + soft area fill (`primary` at low alpha) + emphasized endpoint dot; no axes/labels.
- **Variants:** `tone=primary|neutral|status`; `filled=true|false`.
- **States:** static; empty (flat baseline).
- **Accessibility:** `aria-hidden` — the KPI value carries the fact; a table/tooltip gives the series on demand.
- **RTL:** time flows inline-start→inline-end reversed (latest on the inline-start) to match Arabic reading; endpoint dot on the inline-start.
- **Ownership:** App (Expert Hub) now; candidate for FADS chart primitive later.

## 5. Area / Line Trend Chart — `APPLICATION_COMPONENT`
- **Purpose:** The "major trends" panel (submissions over weeks). Single series → single hue, no categorical palette.
- **Anatomy:** SVG with faint horizontal grid, one area+line series (`primary`), emphasized endpoint, direct value labels on hover (crosshair + tooltip), x-axis week labels.
- **Variants:** `series=1` (default); `compact`.
- **States:** default, hover (crosshair/tooltip), loading (skeleton), empty.
- **Accessibility:** paired with a "عرض كجدول" (view as table) toggle; endpoint labeled; grid recessive; not color-alone (single series named in title).
- **RTL:** x-axis runs right→left; tooltip flips side near edges.
- **Ownership:** App now; FADS chart primitive later.

## 6. SLA Health Meter — `PROPOSED_DS_COMPONENT`
- **Purpose:** Show a stage's performance against its deadline as a horizontal meter (actual vs target) with a health state.
- **Anatomy:** label + track (`neutral-100`) + fill; target marker (tick); trailing state Tag (`success`/`warning`/`error`) + numeric actual/target (`tabular-nums`).
- **Variants:** `state=on-track|at-risk|breached`; `showTarget=true|false`.
- **States:** default; `no-target` ("لم تُحدَّد" — never 0); `not-measured` ("غير مقاس").
- **Accessibility:** `role="meter"` + `aria-valuenow/min/max`; state is Tag (icon+label), not fill-color alone; numbers always shown.
- **RTL:** fill grows from inline-start; target tick positioned with logical `inset-inline-start`.
- **Ownership:** FADS.

## 7. Filter Bar / Toolbar — `PROPOSED_DS_COMPONENT`
- **Purpose:** One-row cluster of the page's filters + search + primary action above a queue/table.
- **Anatomy:** leading `SearchBox`; `Select`s (region, status, date range); active-filter **Chips** (#10); trailing "مسح التصفية" ghost button + primary action; overflow into a "المزيد" menu on narrow widths.
- **Variants:** `sticky`; `withSavedViews` (hosts #9); `density=comfortable|compact`.
- **States:** default, some-filters-active (chips visible + count badge), disabled.
- **Accessibility:** wrapped in `role="search"` region with a group label; each control labelled; clear-all reachable by keyboard; live region announces result count.
- **RTL:** controls flow right→left; search icon on the inline-start of the field.
- **Responsive:** collapses filters behind a "التصفية" button (popover) below `48rem`.
- **Ownership:** FADS.

## 8. Data Toolbar — `PROPOSED_DS_COMPONENT`
- **Purpose:** The command strip bound to a data table: result count, saved views (#9), density toggle (#17), column config (#18), export, and (contextually) the bulk bar (#11).
- **Anatomy:** inline-start: title + count; inline-end: icon buttons (`ButtonMenu`) for view/density/columns/export.
- **Variants:** `withSelectionSummary`; `sticky`.
- **States:** default; selection-active (morphs region into #11).
- **A11y/RTL/Responsive:** toolbar `role="toolbar"` with arrow-key roving; buttons labelled; overflow to menu on narrow.
- **Ownership:** FADS.

## 9. Saved View Selector — `PROPOSED_DS_COMPONENT`
- **Purpose:** Switch between saved filter+column presets ("طلباتي المتأخرة", "مقابلات هذا الأسبوع") and save the current view.
- **Anatomy:** `ButtonMenu` trigger (current view name + caret) → `Menu` of views (with a "•" active marker) + a divider + "حفظ العرض الحالي" / "إدارة العروض".
- **Variants:** `withStar` (favorite), `readonly` (shared views).
- **States:** default, open, active-view, unsaved-changes (dot on trigger).
- **Accessibility:** `aria-haspopup="menu"`, active item `aria-checked`; unsaved state announced in text, not dot-alone.
- **RTL:** menu anchors to inline-end; caret mirrors.
- **Ownership:** FADS.

## 10. Filter Chip / Filter Builder — `PROPOSED_DS_COMPONENT`
- **Purpose:** Represent one active filter as a removable chip; "+ إضافة تصفية" opens a builder popover (field → operator → value).
- **Anatomy:** Tag (`neutral`, rounded) with field:value label + `ButtonClose`; builder is a small `Menu`/popover form.
- **Variants:** `removable`; `editable` (click opens builder pre-filled); `count` (n+ overflow chip).
- **States:** default, hover, focus, applied, invalid.
- **Accessibility:** chip is a button with "أزل تصفية: الحالة = بانتظار الفرز"; remove has its own label; builder is a labelled dialog.
- **RTL:** close affordance on the inline-start; label direction isolated with `<bdi>` for mixed AR/EN values.
- **Ownership:** FADS.

## 11. Bulk Action Bar — `PROPOSED_DS_COMPONENT`
- **Purpose:** Contextual action bar shown when ≥1 table rows are selected.
- **Anatomy:** floating bar (bottom-center, inside the table region): selection count + "تحديد الكل" + action buttons (اعتماد، إسناد، تصدير، …) + dismiss.
- **Variants:** `placement=floating|inline`; `destructiveGrouped` (danger actions separated).
- **States:** hidden (0 selected), visible, action-in-progress (button loading).
- **Accessibility:** `role="region"` + `aria-live="polite"` announcing "٤ عناصر محددة"; focus moves to the bar on first selection; Esc clears.
- **RTL:** actions flow right→left; bar centered, direction-agnostic.
- **Responsive:** stacks actions into a menu on narrow.
- **Ownership:** FADS.

## 12. Side Inspector (drawer) — `PROPOSED_DS_COMPONENT`
- **Purpose:** Inspect/act on the selected record without leaving the table (master–detail).
- **Anatomy:** right-anchored (RTL: left) panel: header (title + `ButtonClose`) → status + key fields → `StatusTimeline` → quick actions footer. Non-modal (table stays usable) with an optional scrim variant.
- **Variants:** `modal=true|false`; `width=sm|md`; `pinned` (stays open across row changes).
- **States:** closed, open, loading, empty ("اختر صفًا لعرض التفاصيل").
- **Accessibility:** `role="complementary"` when non-modal / `dialog` + focus-trap when modal; labelled by its heading; Esc closes; focus returns to the originating row.
- **RTL:** anchors to inline-start edge; slide transition along the inline axis; respects `prefers-reduced-motion`.
- **Responsive:** becomes a full-screen sheet below `48rem`.
- **Ownership:** FADS (drawer variant of the approved `Modal`).

## 13. Status Summary Bar — `PROPOSED_VARIANT` (ContentSwitcher + Tag)
- **Purpose:** A one-line, clickable breakdown of a dataset by status ("الكل ٢٤٨ · بانتظار الفرز ٣٢ · قيد الفرز ١٨ …") that also filters.
- **Anatomy:** segmented row of count+label pills; the active segment reflects the current filter.
- **Variants:** `scrollable` (overflow), `withTotals`.
- **States:** default, selected segment (`aria-current`), hover, focus.
- **A11y/RTL:** each segment a button; selection not color-alone (weight + underline); scrolls inline under RTL.
- **Ownership:** FADS.

## 14. Work-Queue Action Row — `PROPOSED_VARIANT` (List/Table)
- **Purpose:** A queue row optimized for "act now": identity + status Tag + SLA age + a primary row action, denser than a Card but richer than a table row.
- **Anatomy:** avatar/ref → name + meta → status Tag → SLA age (with health color+icon) → "فتح"/row menu.
- **States:** default, hover, focus-within, overdue (inline-start severity stripe), selected.
- **A11y/RTL:** row is a list item with a labelled primary link; stripe + icon carry "overdue", not color-alone.
- **Ownership:** App (candidate FADS `List` variant).

## 15. Alerts / Activity Feed item — `APPLICATION_COMPONENT`
- **Purpose:** Chronological operational events / risk alerts ("تجاوزت مهلة الفرز", "اتفاقية تنتهي خلال ٧ أيام").
- **Anatomy:** severity icon + text + relative time + optional action link; grouped by day.
- **Variants:** `severity=info|warning|error|success`; `withAction`.
- **States:** default, unread (weight + dot), hover.
- **A11y/RTL:** severity via icon+label; time uses `<time>`; unread not dot-alone.
- **Ownership:** App.

## 16. App Sidebar Nav — `APPLICATION_COMPONENT`
- **Purpose:** Persistent primary navigation for the operational shell (areas + counts).
- **Anatomy:** brand → nav items (icon + label + optional count badge) → collapse toggle → user.
- **Variants:** `expanded|collapsed(rail)`; item `active`.
- **States:** default, hover, active (`aria-current="page"` + stripe), focus, collapsed (tooltip labels).
- **A11y/RTL:** `<nav aria-label>`; anchors to the inline-end edge (right in RTL); active not color-alone (stripe + weight).
- **Responsive:** off-canvas drawer below `64rem`.
- **Ownership:** App (composition of `Menu`/`NavDrawer`).

## 17. Density Toggle — `PROPOSED_VARIANT` (ContentSwitcher)
- **Purpose:** Switch table row height (مريح / مضغوط) — maps to Table `data-density`.
- **Anatomy:** 2-segment ContentSwitcher with density icons.
- **States:** comfortable (default), compact (selected).
- **A11y/RTL:** ContentSwitcher semantics; persists per-user.
- **Ownership:** FADS.

## 18. Column Config menu — `PROPOSED_DS_COMPONENT`
- **Purpose:** Show/hide/reorder table columns.
- **Anatomy:** `Menu` of `Checkbox` items (column names) + "إعادة تعيين"; drag handle for order.
- **States:** default, open, column hidden, reordering.
- **A11y/RTL:** checkbox menu; reorder keyboard-operable; anchors inline-end.
- **Ownership:** FADS.

---

### Reused approved `@ds` components (no change required)
`Card`, `Table` (+ `data-density`, `data-alternating`, `stickyHeader`, `selectCell`, `sortButton`), `Tag`, `Button`, `ButtonMenu`, `ButtonClose`, `Icon`, `ItemIcon`, `Typography`, `SearchBox`, `Select`, `Checkbox`, `Radio`, `Switch`, `Pagination`, `Tabs`, `ContentSwitcher`, `Menu`/`MenuListItem`, `Modal`, `Alert`, `Notification`, `Toast`, `Steps`/`StatusTimeline`, `Breadcrumbs`, `Avatar`, `Tooltip`, `List`/`ListItem`, `Loading`, `EmptyState`, `ErrorState`, `Container`, `Section`, `Divider`.

All spacing/color/radius/type above resolve to existing `--fads-*` tokens; **no new token is proposed.**
