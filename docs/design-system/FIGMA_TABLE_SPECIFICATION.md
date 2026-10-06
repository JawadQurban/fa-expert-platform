# Figma Table — Official Specification

**Source of truth:** Figma file `J0xq7JG3JKshRDzrgAM7E0` ("Components Library - Platforms Code
(Community)"), component set **Table** (node `5698:40875`), category "Data Display".
**Registry:** `nodeId`/`figmaUrl` were already populated (`nodeResolutionStatus: "pending"` — a
workflow-progress marker, not a missing node; see `CLAUDE.md`'s node resolution policy).
Live-verified this pass via `get_metadata`/`get_design_context`/`get_variable_defs`; flipped to
`"resolved"` on success.

Extracted via read-only Figma MCP tools. 16 variants sampled at the metadata level (`rtl` ×
`alternatingRows` × `compact` × `contained`); 3 sampled directly via `get_design_context`
(Default `RTL=False,Alternating=False,Compact=False,Contained=False`, Contained=True, Compact=True)
plus `get_variable_defs` on the component-set root.

---

## 1. Official Structure — Sub-Parts vs. This Component

The official library treats **Table Row**, **Table Header**, **Table Row Cell**, and **Table
Header Cell** (plus dedicated **Table Header Cell - Sort** / **- Filter** variants) as 7 separate
composable sub-parts (registry rows, all `batch: 6`). This FADS component bundles all of it inline
into one `Table`, matching the pre-existing architecture decision (not a rebuild) — the registry's
own note already recorded this as "Officially partial coverage, not a rebuild candidate."

**Sort/Filter icon glyphs are NOT implemented.** `Table Header Cell - Sort` (node `5698:40813`)
and `Table Header Cell - Filter` (node `5894:21746`) are both registry `status: "Missing"` —
neither has ever been resolved/sampled, and no sort-related text or icon reference appears
anywhere in the sampled Table variants' extracted code. The existing `sortable`/`aria-sort`/
`onSortChange` behavior is preserved unchanged (a WCAG 4.1.2 requirement independent of any visual
icon), but no sort-caret or filter-icon glyph is invented — per this task's explicit "do not
introduce advanced grid functionality unless verified."

## 2. Variant Axes (16 total)

| Axis | Values |
|---|---|
| `rtl` | False / True |
| `alternatingRows` | False / True |
| `compact` | False / True |
| `contained` | False / True |

No `loading`/`error`/`empty`/`sticky header`/`footer`/`selected-row` axis exists on the Table
component set itself — see §4.

## 3. Structure & Colors (live-verified via `get_design_context` + `get_variable_defs`)

**Header row** (`Table Header`): background `Table/table-background-header` `#f3f4f6`, 1px
top+bottom border `Table/table-cell-border` `#d2d6db`, cell text `Table/table-text-head` `#384250`
at `Text xs/Medium` (12px/500/18px line-height), min-height **48px** (identical in Standard and
Compact density).

**Body row** (`Table Row`): plain cells have no background (transparent); a leading checkbox cell
(**52px** wide) matches the official row's own leading `Checkbox` sub-instance — implemented by
composing the already-Approved `Checkbox` primitive directly, not a re-drawn box. Row min-height
is **64px** (Standard) / **32px** (Compact) — live-verified from the two density variants'
extracted code (`min-h-[64px]` vs. `min-h-[32px]`).

**Row states** (conditionally-rendered background layers inside `TableRow`, all live-verified):

| State | Token | Hex |
|---|---|---|
| Alternating (`altBg`) | `Table/table-background-row-alt` | `#f9fafb` |
| Selected | `Table/table-background-row-select` | `#f3fcf6` |
| Hovered | `Table/table-background-row-hovered` | `#f3f4f6` |

**Needs Confirmation:** a separate `Table/table-boarder-row-selected-hovered` token (`#f3f4f6`,
scoped to `TEXT_FILL`/`STROKE` — i.e. a stroke, not a fill) exists in the local JSON export,
suggesting a subtle additional border might appear when a row is *both* selected and hovered
simultaneously. Since `table-background-row-select` and its `-selected-hovered` counterpart share
the identical `#f3fcf6` fill hex, the fill itself does not change on the combined state — only a
possible stroke might. This could not be conclusively confirmed from the extracted code (no
combined selected+hovered sample was directly rendered), so it is **not implemented**; the
selected-row background stays constant regardless of hover.

**Contained** (`5699:73788`): adds a 1px outer border (`Table/table-cell-border`) + `radius-md`
(8px) rounded corners around the whole table; the default (`Contained=False`) has neither.

## 4. States Not Defined in Figma — Composed, Not Invented

The Table component set defines no loading/error/empty/footer/sticky-header/selection-column
variant of its own. Per this task's "never invent DGA requirements" rule, none of these are
rendered as new hand-drawn visual designs:

- **Loading / Error / Empty:** implemented as `loadingState`/`errorState`/`emptyState` slot props
  (a `ReactNode`, shown in place of the row body) that the consumer fills with the
  already-Approved `Loading` / `ErrorState` / `EmptyState` composites — reusing existing approved
  visual designs, inventing nothing new. Precedence: loading → error → empty → rows.
- **Selection column:** IS an official Figma element (§3 above — the row's own leading `Checkbox`
  cell), so `selectable` composes the Approved `Checkbox` primitive directly, matching Figma
  exactly rather than being a FADS invention.
- **Sticky header:** a behavioral opt-in (`position: sticky`) using only the header's own
  already-verified background/border/text tokens — no new colors, spacing, or visual design.
- **Footer:** a FADS-authored extension (`footer` slot rendering a `<tfoot>` row) with **no
  official Figma footer variant** — styled using only the already-verified header background/
  border/padding tokens (no new colors invented). Flagged **Needs Confirmation**, non-blocking.
- **Responsive overflow:** a `overflow-x: auto` scroll wrapper — standard, direction-agnostic
  responsive behavior for a fixed-width table on a narrow viewport, not a new visual design.

## 5. Accessibility

- Semantic `<table>` retained; `scope="col"` on every header cell (pre-existing, unchanged).
- `aria-sort` on sortable columns, keyboard-operable header `<button>` (pre-existing, unchanged).
- New: selectable rows get `aria-selected` on `<tr>`; the header "select all" `Checkbox` uses its
  native `indeterminate` DOM property for a partial selection (same mechanism already
  Approved on `Checkbox` itself); each row's checkbox gets a caller-supplied accessible label via
  `selectRowLabel(row)` (visually hidden, composed via the existing `fads-visually-hidden` utility
  class — not a new a11y pattern).

## 6. Needs Confirmation

1. The `table-boarder-row-selected-hovered` stroke token (§3) — not implemented, no combined
   selected+hovered sample was directly renderable from the extracted code.
2. The `footer` slot (§4) has no official Figma variant — implemented conservatively from
   already-verified tokens only, pending design-team confirmation it's wanted at all.
3. Sort/Filter icon glyphs (§1) remain unresolved pending `Table Header Cell - Sort`/`- Filter`
   node resolution — functional sort behavior is unaffected.
