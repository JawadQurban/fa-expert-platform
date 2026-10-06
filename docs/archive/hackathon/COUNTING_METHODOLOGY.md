# Counting Methodology

Every number that appears in the DGA planning documents (`docs/DGA_OFFICIAL_COMPONENT_CATALOG.md`,
`docs/DGA_COMPONENT_NODE_MAP.md`, `docs/DGA_COMPONENT_IMPLEMENTATION_QUEUE.md`,
`docs/DGA_IMPLEMENTATION_ORDER.md`, `reports/DGA_PROJECT_PROGRESS.md`, and
`frontend/src/design-system/registry/figma-component-map.json`) is defined here, precisely,
with the reasoning for why different documents report different totals. **This document is the
tie-breaker.** If a number elsewhere conflicts with this document, this document is right and
the other should be corrected.

All figures below were recomputed directly from the registry JSON during the 2026-07-12
hardening pass (not recalled from memory) — see `reports/PLANNING_HARDENING_REPORT.md` for the
verification commands.

---

## 1. The four numbers, resolved

| Number | What it is | Still valid? |
|---|---|---|
| **78** (original) | An informal, same-session running tally of distinct Figma asset *names* returned by `search_design_system` across ~34 queries during the initial cataloguing pass (2026-07-12, first session). Computed by eye while narrating discovery, before reconciling against prior-session live-verified data or explicitly flagging duplicate search hits. | **Superseded.** Kept only as a historical footnote in `docs/DGA_OFFICIAL_COMPONENT_CATALOG.md` §3. Do not use for anything going forward. |
| **81** | The number of rows in `figma-component-map.json`'s `components` array (= "**Registry Entries**", §2 below) as originally published. Equals the 78 search-discovered names, **plus 2 components sourced from a prior session's live-verified Figma docs but not independently re-found by this session's search sweep** (`Header Action`, `Logo Placeholder` — see §2), **plus 1 net additional row from explicit duplicate-tracking** (two ambiguous search hits — `Header Menu (duplicate?)`, `Header Menu Item (duplicate?)` — were added as their *own* traceable rows rather than silently merged, which is where the reconciliation arithmetic against the original 78 stops being exactly invertible; see the note at the end of §2). | **Still the literal row count today** — the hardening pass did not delete rows, it added fields (see §5). `components.length === 81` remains true. |
| **80** | `81 − 1`, i.e. registry entries minus the one `flags / SA` row (marked `NotApplicable` — an icon/locale asset, not a UI component). Used by the *original* `reports/DGA_PROJECT_PROGRESS.md` as the percentage denominator ("Approved: 9/80"). | **Superseded by 78 (new meaning) as the recommended denominator** — see §2's canonical-count definition. `80` undercounts by not also excluding the 2 explicitly-flagged duplicate rows, which should never have been in a percentage denominator once they exist as flagged duplicates. |
| **85** | The number of rows in `docs/DGA_COMPONENT_NODE_MAP.md`'s table. Equals the 81 registry rows **plus 4 rows that have no Figma component-catalog source at all**: `Typography`, `Container`, `Section` (FADS/foundation rows, tracked for completeness but not Figma assets — see §3), and one aggregate row representing all 6 `PAT-01`…`PAT-06` patterns as a single line (patterns are compositions with no dedicated Figma node — see §4). `81 + 3 + 1 = 85`. | **Still correct** — `DGA_COMPONENT_NODE_MAP.md` intentionally tracks a superset of the registry for planning completeness; it is not supposed to equal 81. |

### The important coincidence — read this before quoting "78" anywhere

After this hardening pass, **`registryNotes.canonicalComponentCount` in the JSON is also 78** —
computed as `81 total rows − 2 rows with isDuplicate:true − 1 row with status NotApplicable = 78`.

**This is a coincidence, not the same number as the original informal 78 above, and the two must
never be conflated.** The old 78 was a rough, pre-reconciliation tally of raw search hits (it
happened to already exclude `flags/SA`... no — it did not exclude `flags/SA`; see the reasoning
trail below). The new 78 is a precisely reproducible formula over the reconciled 81-row registry.
Going forward, **"78" always means the new, reconciled, canonical count** — `81 − duplicates(2) −
notApplicable(1)`. If you need to refer to the pre-hardening estimate, call it "the original informal
78-name tally," never just "78," to avoid this exact ambiguity.

---

## 2. Definitions

### Official Figma assets
Anything `search_design_system` or a direct `get_metadata`/`get_design_context` node lookup
returned from the **"Components Library - Platforms Code (Community)"** library
(`libraryKey lk-e7c73ab...f131f3c72f`, file `Sv0oWOS1SjWnwhQwdzRJIE`) with `assetType`
`component` or `component_set`. This is the raw universe before any project-specific curation —
includes things later marked out of scope (`flags / SA`) and things later flagged as possible
duplicates.

### Registry entries
Rows in `frontend/src/design-system/registry/figma-component-map.json`'s `components` array.
**Currently 81.** Every official Figma asset this project has discovered gets a row here,
including duplicate-flagged and out-of-scope ones — nothing is ever silently dropped from this
file; ambiguity is recorded as metadata instead (`isDuplicate`, `status: "NotApplicable"`), per
Task 3 of the 2026-07-12 hardening pass. This is why "Registry Entries" (81) is a different,
larger number than "Official DGA Components" (78, below) — the registry is a superset that
includes everything *found*, not just everything *in scope and unique*.

### Official DGA components (the canonical count)
`registryNotes.canonicalComponentCount` in the JSON — **78**. Defined as: registry entries where
`isDuplicate === false` **and** `status !== "NotApplicable"`. This is the number to use whenever
you need "how many real DGA components are there" — for percentages, for batch-completion
tracking, for anything comparable to `docs/COMPONENT_INVENTORY.md`'s original 33-`CMP-*` count.
**Use this number, not 80 or 81, for all future percentage-style reporting.**

### FADS-authored components
Components that exist in `frontend/src/design-system/` with **no official Figma component-catalog
source at all** — confirmed by this project's searches turning up nothing under their name.
Three exist: `Container`, `Section` (layout primitives) and the internal `Field` helper, plus two
composed, non-primitive components: `EmptyState`, `ErrorState`. These are tracked in
`docs/DGA_COMPONENT_NODE_MAP.md` for planning completeness (so nothing "disappears" from the
project's view of its own component inventory) but **are never counted in any Figma-catalog
percentage** — there is nothing to be compliant against.

### Out-of-scope assets
Official Figma assets that are not DGA UI components at all. Currently one: `flags / SA`
(`assetType: component`, not `component_set` — a single Saudi-flag icon graphic, part of the
icon/locale-asset pipeline documented in `docs/ICON_LIBRARY.md`, not this component work).
Tracked with `status: "NotApplicable"` in the registry so it's visibly accounted-for rather than
mysteriously absent, but excluded from every count and percentage.

### Pattern rows
`docs/COMPONENT_INVENTORY.md §5`'s `PAT-01`…`PAT-06` (Multi-step form, Entity list + filter,
Content-section grid, Feedback block, App shell, Notification system). These have **no dedicated
Figma node** by design — a "pattern" in this project's vocabulary is a product-level composition
of already-catalogued components, not a library asset, confirmed by no search query surfacing
anything resembling one. `docs/DGA_COMPONENT_NODE_MAP.md` tracks all 6 as a **single aggregate
row** (not 6 separate rows) because they share one scheduling reality: Batch 09, after everything
they compose is finished. They are never part of the 78/80/81 Figma-asset counts.

### Aggregate rows
Any row in `docs/DGA_COMPONENT_NODE_MAP.md` that represents more than one registry entry for
readability (currently only the Patterns row, which stands in for 6). The registry JSON itself
has no aggregate rows — every JSON row is exactly one Figma asset (or one out-of-scope asset, or
one flagged duplicate).

### Planning rows
The union of everything tracked in `docs/DGA_COMPONENT_NODE_MAP.md` (85 rows): all 81 registry
entries, plus the 3 FADS-authored rows with no Figma source, plus the 1 pattern aggregate row.
"Planning rows" is the broadest of all the counts in this document — it is a project-management
view, not a Figma-catalog view, and should never be used as a percentage denominator against
Figma compliance.

---

## 3. Duplicate handling (see also `reports/PLANNING_HARDENING_REPORT.md` §3)

Two registry rows carry `isDuplicate: true`:

- `Header Menu (duplicate?)` → `duplicateOf: "Header Menu (hamburger)"`
- `Header Menu Item (duplicate?)` → `duplicateOf: "Header Menu Item"`

Both share an exact `componentKey` with an already live-verified sub-part of the Approved Header
component. They are **kept as separate rows** (not deleted) purely for audit traceability of what
`search_design_system` actually returned — deleting them would make a future session unable to
tell why two names ever seemed to exist. They are **excluded from `canonicalComponentCount`** and
from every percentage in `reports/DGA_PROJECT_PROGRESS.md`. Resolving the ambiguity (same asset
indexed twice vs. two genuinely distinct components) requires opening both candidate Figma pages
directly — not resolved this pass, tracked as an open item.

## 4. Status vocabulary (single source, used everywhere)

Every planning document uses exactly these 6 prose terms (plus a reserved 7th for future use).
The registry JSON's legacy `status` field uses the same terms in PascalCase-no-space form for
programmatic use; this is a casing convention difference, not a different vocabulary:

| Prose (docs) | JSON `status` (legacy field) |
|---|---|
| Approved | `Approved` |
| Implemented | `Implemented` |
| Partially Implemented | `PartiallyImplemented` |
| Missing | `Missing` |
| Needs Confirmation | `NeedsConfirmation` |
| Deprecated *(reserved — unused so far)* | `Deprecated` |
| Not Applicable | `NotApplicable` |

As of this hardening pass, the registry's **source of truth is no longer this single field** — it
is the four-axis model (`implementationStatus`, `visualComplianceStatus`, `officialCoverage`,
`nodeResolutionStatus`) described in the registry's own `registryNotes.statusModel` and in
`reports/PLANNING_HARDENING_REPORT.md` §2. The legacy `status` field is retained for
backward-compatible reads only and is derived from the four-axis fields, not the other way around.

**Not part of this vocabulary:** `docs/COMPONENT_APPROVAL_MATRIX.md` — a separate, pre-existing
document (established before this catalog work) — uses its own legend (`✅ done`, `⏳ not
started`, `🔲 built pre-workflow, not yet Figma-verified`) for tracking progress through
`docs/VISUAL_COMPLIANCE_WORKFLOW.md`'s steps. `docs/DGA_OFFICIAL_COMPONENT_CATALOG.md` quotes
that legend verbatim in a couple of places (e.g. "`⏳ Pending` row candidate") when cross-
referencing that document — this is an intentional citation of a different document's vocabulary,
not an inconsistency in this one. Conceptually, matrix `⏳ not started` ≈ registry
`visualComplianceStatus: "pending"`, and matrix `✅ done` ≈ registry `visualComplianceStatus:
"approved"` — but the two documents are not required to share literal terms, only to agree on
meaning.

## 5. How to reproduce every number in this document

```
node -e "
const d = require('./frontend/src/design-system/registry/figma-component-map.json');
const c = d.components;
console.log('total registry rows:', c.length);                                    // 81
console.log('duplicate rows:', c.filter(x=>x.isDuplicate).length);                 // 2
console.log('not-applicable rows:', c.filter(x=>x.status==='NotApplicable').length); // 1
console.log('canonical components:', d.registryNotes.canonicalComponentCount);      // 78
"
```

Node-map row count (85) is verified by counting `docs/DGA_COMPONENT_NODE_MAP.md`'s table rows
directly — it is a hand-maintained planning document, not generated from the JSON, so it is
verified by inspection rather than by script.
