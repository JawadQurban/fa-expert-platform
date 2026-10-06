# Table Storybook Fidelity Correction

Corrects a Storybook/Figma mismatch found after Batch 2: the Table component was marked Approved,
but no story reproduced the official Figma Table's canonical, richer sample composition (a
9-column "kitchen sink" demonstrating every supported cell type). This report determines whether
the mismatch was story-only, component-only, or both, and documents the fix.

## 1. Diagnosis — Story-Only, Not a Component Defect

Re-opened the live registered Table node `5698:40875` (`RTL=False, Alternating=False,
Compact=False, Contained=False`) via `get_metadata`/`get_design_context` and extracted the full
row structure this time (the Batch 2 pass had truncated its own extraction partway through the
row, missing the final two cells). The canonical sample has **9 columns**, in this exact order:

| # | Column | Figma content | Width behavior |
|---|---|---|---|
| 1 | Selection | `Checkbox` (small) | fixed 52px |
| 2 | Link | `Link` component, `Link/link-primary` `#1b8354`, text-md | flexible (`flex-1`, min 100px) |
| 3–5 | Generic text ×3 | plain body text | flexible (`flex-1`, min 100px) |
| 6 | Tag | plain `Tag` (`tag-background-neutral-light` `#f9fafb` + `border-neutral-secondary` `#e5e7eb`, `radius-sm`) | fixed 120px |
| 7 | Status | `StatusTag` = a `Tag` with a 10px leading status-dot, `rounded-full` | fixed 120px |
| 8 | Generic text | plain body text (labeled "Cell" in the sample) | flexible (`flex-1`, min 100px) |
| 9 | Action | trailing icon-only button (rotated arrow glyph), right-aligned | fixed 64px |

The header row mirrors this 1:1, with one exception: **column 9's header cell is an icon-only
Filter button** (`TableHeaderCellFilter`, `bg-button-background-neutral-default` `#f3f4f6`,
20×20px), not a text label — the header shows a filter affordance in the same column position
where the body shows a trailing action button.

**Every one of these 9 columns is already renderable through the existing public `Table` API**:
- Column 1 → the existing `selectable` prop (already composes the Approved `Checkbox`).
- Columns 2–8 → `TableColumn.render` already accepts arbitrary `ReactNode` — a `Link`, a `Tag`
  (plain), a `Tag` with `rounded` + `iconStart` (the status dot), and plain text are all directly
  expressible without any new prop.
- Column 9's header → `TableColumn.header` is *also* already arbitrary `ReactNode` — an icon-only
  filter button can be passed directly as the header value.

**Conclusion: the mismatch was story-only.** No `Table` implementation change was needed or made
— every column of the canonical Figma sample is reproducible today through composition alone.
This was verified by building the story (see §2) and confirming it renders correctly with zero
changes to `Table.tsx`/`Table.module.css`.

## 2. What Changed

- Added a new canonical story, **`OfficialFigmaReference`**, in
  `frontend/src/design-system/composite/Table/Table.stories.tsx`, reproducing all 9 columns above
  using `selectable` + composition of the already-Approved `Link`/`Tag` primitives, rendered in
  `dir="rtl"` (this project's default reading direction) with `Contained=false`/
  `density="standard"`/`alternatingRows=false` — matching the exact live-sampled default variant.
- Three small decorative SVG glyphs (`StatusDot`, `FilterGlyph`, `ActionArrowGlyph`) were added
  **inside the story file only** (fixture-level, not `Table` or `Icon` code) to approximate the
  status dot, filter icon, and action arrow — none of the three exist in the Icon registry yet
  (confirmed absent via a full-registry search), the same icon-pipeline gap already documented for
  `Pagination`'s Previous/Next chevrons.
- Existing stories (Default, Compact, Contained, AlternatingRows, StickyHeader, Sortable,
  Selectable, LoadingState, Error, Empty, WithFooter, RTL) were **not removed** — they remain the
  focused single-behavior demos; `OfficialFigmaReference` is the new canonical multi-column
  reference.
- Added one new regression test to `Table.test.tsx` (`Table.test.tsx` now 19 tests, up from 18)
  confirming the canonical composition pattern itself — a selection column plus arbitrary
  `ReactNode` headers and cells (a real `<a>` link and a custom-`data-testid` cell/header) — all
  render together correctly. This guards the pattern the new story depends on, independent of
  Storybook's own build.

## 3. Fixture-Content Disclosure

The live Figma sample uses literal English placeholder text for every column ("Header", "Link",
"Tag", "Cell", "Status"). Per this repo's established convention — every other story in this
codebase uses realistic Arabic sample content, not literal Figma placeholder labels — the new
story uses realistic Arabic column headers and row data (owner names, dates, amounts, a status of
"نشط"/"متوقف") instead of literally reproducing "Header"/"Link"/"Tag"/"Cell". This is a
**fixture-content choice, not a visual-fidelity gap**: column structure, order, widths, cell
types, and styling all match the live data exactly; only the placeholder text differs, and this
was a deliberate content decision, not an oversight.

## 4. Differences Remaining (Honest, Non-Blocking)

- The status-dot, filter, and action-arrow glyphs are approximated inline SVGs, not the real
  Figma icon assets (none exist in the Icon registry yet — same disclosed gap as
  `Pagination`'s chevrons and other components' icon-pipeline gaps).
- The Tag column's exact border width/color and the StatusTag's exact dot size were read directly
  from the extracted code (`border-neutral-secondary` `#e5e7eb`, 10px dot) and match the
  already-Approved `Tag` component's own live-verified default tokens — no new Table-specific
  token was needed or added.
- Row count: the canonical story uses 3 rows, matching the live sample's own row density (2
  `<TableRow/>` component references + 1 additional inline row in the sampled frame).

## 5. Validation

| Command | Result |
|---|---|
| `npm run typecheck` | ✅ Pass (after fixing a generic-type mismatch — the new story's fixture row type differs from the existing `Request` fixture type used by `meta.args`, so `OfficialFigmaReference` is a standalone `StoryObj` with its own local demo component rather than sharing the typed `Story` alias) |
| `npm run lint` (eslint + `lint:css`) | ✅ Pass (after fixing one `jsx-a11y/anchor-is-valid` violation — the test's placeholder `<a href="#">` was changed to a real URL) |
| `npm test` (Table only) | ✅ 19/19 passing (up from 18) |
| `npm run build-storybook` | ✅ Pass — `Table.stories` bundle includes the new story |

## 6. Approval

Table remains **Approved** — the canonical Storybook reference now faithfully represents the
official 9-column Figma composition (column order, widths, cell types, and colors all verified),
and no unresolved implementation discrepancy remains. This was a Storybook-fixture correction
only; `Table.tsx`/`Table.module.css` are unchanged from Batch 2.
