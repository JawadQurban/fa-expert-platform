# Planning Hardening Report

**Date:** 2026-07-12 · **Phase:** Documentation and registry quality pass over the DGA planning
artifacts produced earlier this project. **No React code, tokens, Storybook, or tests were
touched.** No component was marked Approved, and no implementation progress was made or claimed
— every change here is a correction to how existing, unchanged progress is counted, ordered, and
described. All verification commands below were actually run against the repository during this
pass, not asserted from memory.

---

## 1. Summary of changes

| Area | What changed |
|---|---|
| Counting | New `docs/COUNTING_METHODOLOGY.md` resolves the 78/80/81/85 ambiguity with a precise, reproducible definition for every number. |
| Registry structure | `status` split into 4 independent axes (`implementationStatus`, `visualComplianceStatus`, `officialCoverage`, `nodeResolutionStatus`); legacy `status` kept for backward compatibility. |
| Duplicate handling | 2 rows now carry `isDuplicate`/`duplicateOf`/`duplicateReason` instead of being silently counted as unique; a new `canonicalComponentCount` (78) excludes them and the 1 out-of-scope row. |
| Dependency ordering | 2 forward-dependency violations found and fixed by moving components between batches (`Label`: Batch 02 → 01; `Button-menu`: Batch 02 → 05). Verified 0 violations remain. |
| Node resolution | Every unresolved row now carries a `nodeResolutionPlan` (why unresolved / how to resolve / blocked or not / is search sufficient / is a live node mandatory). |
| Validation | Full scan for duplicate keys/names/URLs/node IDs, missing priority/batch/category/dependencies, and 7 rows with an ambiguous status but no explanatory note — all fixed. |
| Terminology | Confirmed all 6 planning documents already used one consistent 6-term vocabulary (Approved / Implemented / Partially Implemented / Missing / Needs Confirmation / Not Applicable, + reserved Deprecated); documented the one legitimate exception (`COMPONENT_APPROVAL_MATRIX.md`'s own pre-existing legend, correctly cited rather than duplicated). |
| JSON bug fix | The registry's top-level `$schema` key held a free-text usage note, which is a reserved JSON-tooling key — the IDE's JSON language server was trying to resolve it as a schema URI and failing (visible as a diagnostic warning). Renamed to `registryNotes`. |

---

## 2. Registry restructuring detail (Task 2)

The single `status` field (`Approved | Implemented | PartiallyImplemented | Missing |
NeedsConfirmation | NotApplicable`) conflated four genuinely different questions. It is retained
verbatim on every row — nothing was deleted — but is now documented as **derived, not
authoritative**. The four new fields:

- **`implementationStatus`** — does the code exist? `missing | partial | implemented | approved
  | notApplicable`.
- **`visualComplianceStatus`** — has it been checked against the live Figma node?
  `pending | verified | approved | notApplicable`. `verified` is a new middle state this model
  makes expressible for the first time — e.g. **Tag** now correctly reads `verified` (live Figma
  variant data was captured this session) rather than being indistinguishable from a row that's
  never been looked at, which the old single field couldn't represent.
- **`officialCoverage`** — how much of the official component's variant/sub-part surface does
  the FADS implementation actually cover? `complete | partial | unknown | notApplicable`. This
  is the field that most improves on the old model: **Button, Card, Nav Header, Footer,
  Divider** — all `status: Approved` — are correctly `officialCoverage: "partial"`, because
  each has a documented, non-blocking gap (Button's destructive/onColor combo restriction,
  Card's missing Expandable/Selectable types, Header's missing mega-menu, Footer's utilities
  slot, Divider's vertical-color-by-extension). The old single field made "Approved" look like
  "100% done," which was never true and was never claimed in prose — it just wasn't
  machine-readable before.
- **`nodeResolutionStatus`** — is the Figma canvas node known? `resolved | pending | blocked |
  notApplicable`, with a companion `nodeResolutionPlan` object per row (Task 5, §4 below).

Verified via script: every row's `implementationStatus` agrees with its `implemented` boolean and
its legacy `status` (no contradictions — e.g. no row claims `implemented: true` with
`implementationStatus: "missing"`, or vice versa).

## 3. Duplicate handling detail (Task 3)

Two rows were flagged during the original catalogue pass with a `(duplicate?)` name suffix but
were still being counted as ordinary unique rows in every percentage calculation:

- `Header Menu (duplicate?)` — shares `componentKey 886b8b3a...` with the live-verified
  `Header Menu (hamburger)` (node `30150:148860`).
- `Header Menu Item (duplicate?)` — shares `componentKey 87e55aba...` with the live-verified
  `Header Menu Item` (node `30150:148312`).

Both now carry `isDuplicate: true`, `duplicateOf` (the canonical row's name), and
`duplicateReason` (why they're suspected duplicates and what would confirm/deny it). They are
**not deleted** — removing them would destroy the audit trail of what `search_design_system`
actually returned this session, and Task 3 only asked to stop *counting* duplicates as unique,
not to erase evidence. A new `registryNotes.canonicalComponentCount` (78) is computed as
`total rows (81) − isDuplicate rows (2) − NotApplicable rows (1)` and is now the recommended
denominator for all percentage reporting (used in the corrected `reports/DGA_PROJECT_PROGRESS.md`).

**Coincidence flagged, not hidden:** this new canonical count is also 78 — the same digits as the
*original* informal search-sweep tally from the first session. `docs/COUNTING_METHODOLOGY.md`
calls this out explicitly with a "read this before quoting '78' anywhere" section, because the
two numbers are computed completely differently and agreeing is accidental. Future sessions
should say "the 78-canonical count" and cite `registryNotes.canonicalComponentCount`, never a bare
"78."

## 4. Dependency and batch corrections (Task 4)

**Method:** a script (not manual inspection) compared every row's `batch` number against every
name in its `dependencies` array, resolving each dependency name to its own row (with a small
alias table for cross-references like `"Header"` → `Nav Header`, and treating `Icon`/`Typography`/
`NavDrawer` as legitimate external references rather than registry rows — see below). A
dependency scheduled in a strictly later batch than its dependent is a violation.

**Found: exactly 2 violations, both now fixed:**

1. **Text Input** (Batch 01) depended on **Label** (was Batch 02). Fixed by moving Label to
   Batch 01 — it's a low-risk extraction of code that already ships inside the internal `Field`
   helper, not new UI, so this doesn't change Batch 01's risk profile, just adds one row.
2. **Button-menu** (Batch 02) depended on **Menu** (Batch 05). Considered pulling Menu forward to
   Batch 02 instead, but rejected: Menu has its own dependency chain (Menu list item → Item
   Icon/Trailing Icon/Tag) that would just relocate the same violation one level down. Fixed by
   moving Button-menu to Batch 05, to be built immediately after Menu + Menu list item.

**Re-verified after the fix: 0 forward-dependency violations remain** (script output reproduced
in §7 below). The example components named in the task brief — Button-menu, Menu, Menu List
Item, Header Menu, Header Menu Item — were all in scope of this check: Menu, Menu List Item,
Header Menu, and Header Menu Item required no change (all their dependencies already resolve
to the same batch or earlier); only Button-menu needed to move.

**Dependencies that intentionally don't resolve to a registry row** (`Icon`, `Typography`,
`NavDrawer`) are not violations — `Icon` is the pre-existing FADS icon primitive (already
implemented, outside this catalog's Figma-node tracking), `Typography` is tracked only in
`docs/DGA_COMPONENT_NODE_MAP.md` (row #11, Batch 01, so still available before any dependent's
batch), and `NavDrawer` is the existing shipped React component name (as distinct from the Figma
catalog row `Nav Drawer Item`, which tracks a sub-part of it). This overlap in naming
(`NavDrawer` the component vs. `Nav Drawer Item` the Figma asset) is noted here so it isn't
mistaken for an unresolved dependency in a future automated check.

## 5. Node resolution documentation (Task 5)

Every row's `nodeResolutionStatus` now has a matching `nodeResolutionPlan` object with five
fields answering the task's five questions directly:

- `whyUnresolved` — the specific reason (not found via search sufficiently, blocked on a
  question, blocked on a duplicate/identity confirmation, or not applicable).
- `howToResolve` — the concrete next action.
- `implementationBlocked` — boolean; `true` only for `nodeResolutionStatus: "blocked"` rows.
- `searchSufficientForPlanning` — `true` for every row except out-of-scope; `search_design_system`
  is always sufficient to keep a row catalogued and planned around, even when blocked.
- `liveNodeMandatoryBeforeImplementation` — `true` for every real component row without
  exception. No component should be implemented from a `componentKey`/description alone; a live
  canvas node is always required before writing code, even for `pending` (not blocked) rows.

Three sub-categories of `blocked`, each with distinct guidance: (a) duplicate-identity rows
(compare both candidate nodes directly), (b) `docs/QUESTIONS.md`-gated rows — Search Box/Q10,
Digital Stamp+Extension/Q5 (do not spend resolution effort until the question clears, since scope
may change), (c) other same-session confirmation spikes (Slideout Menu vs. NavDrawer).

## 6. Validation results (Task 6)

Ran a full scripted check (reproducible via the commands in §7):

- **Duplicate `componentKey` among non-duplicate-flagged rows:** 0 (only the 2 intentionally
  flagged rows share keys with their canonical counterparts).
- **Duplicate `nodeId`:** 0. **Duplicate `figmaUrl`:** 0. **Duplicate `name`:** 0.
- **Missing `priority`, `batch`, `category`, or `dependencies`:** 0 rows — these were already
  complete in the original registry.
- **Missing implementation notes on rows whose status needs one** (originally 7: `File Upload /
  Multiple`, `Slideout Menu Header`, `Table`, `Table Row`, `Table Header`, `Table Header Cell`,
  `Table Row Cell`): **all 7 fixed** — each now has a concrete note explaining its gap or
  relationship to a sibling row.
- **Cross-field sanity** (`implemented` boolean vs. `implementationStatus` vs. legacy `status`):
  0 contradictions found.

## 7. Reproduction commands

```
node -e "
const d = require('./frontend/src/design-system/registry/figma-component-map.json');
const c = d.components;
console.log('total rows:', c.length);                                              // 81
console.log('canonical:', d.registryNotes.canonicalComponentCount);                 // 78
console.log('duplicate rows:', c.filter(x=>x.isDuplicate).length);                  // 2
console.log('not-applicable rows:', c.filter(x=>x.status==='NotApplicable').length);// 1
console.log('rows missing notes but needing one:', c.filter(x =>
  (['PartiallyImplemented','NeedsConfirmation'].includes(x.status) || x.isDuplicate) && !x.notes
).length);                                                                          // 0
"
```

Forward-dependency check (full script, aliasing `Header`→`Nav Header` and treating
`Icon`/`Typography`/`NavDrawer` as external, non-registry dependencies):

```
node -e "
const d = require('./frontend/src/design-system/registry/figma-component-map.json');
const c = d.components; const byName = {}; c.forEach(x => byName[x.name] = x);
const alias = { Header: 'Nav Header', Icon: null, Typography: null, NavDrawer: null };
let violations = 0;
c.forEach(x => { if (x.batch == null) return;
  (x.dependencies || []).forEach(dep => {
    let d2 = byName[dep];
    if (!d2 && alias.hasOwnProperty(dep)) d2 = alias[dep] ? byName[alias[dep]] : null;
    if (!d2) return;
    if (d2.batch != null && d2.batch > x.batch) { violations++; console.log(x.name, x.batch, '->', d2.name, d2.batch); }
  });
});
console.log('violations:', violations);  // 0
"
```

---

## 8. Remaining open questions (unchanged by this pass — not resolved, just re-confirmed as open)

None of the following were investigated or resolved this pass — they are listed here so the
hardening report is a complete picture of what's still outstanding, not because this pass touched
them:

1. **Notification vs. Alert/Banner split** — does the one official `Notification` Figma set have
   an inline/banner variant axis, or is FADS's two-component split unverified against a single
   official shape? (`officialCoverage: "unknown"` on that row, deliberately, until resolved.)
2. **Header Menu / Header Menu Item duplicate identity** — are the two flagged rows the same
   asset indexed twice, or genuinely distinct components? Resolvable only by opening both
   candidate Figma pages directly.
3. **Slideout Menu vs. NavDrawer** — is "Slideout Menu" the official name for the mobile pattern
   `NavDrawer` already implements, or a distinct component?
4. **Q5 (Digital Stamp / Extension) and Q10 (Search Box)** — client questions in
   `docs/QUESTIONS.md`, unrelated to this hardening pass, still blocking those 3 rows.
5. **File Upload / Single vs. Multiple** — whether the two official variants are visually
   distinct enough to warrant splitting FADS's merged `FileUploader(multiple)` component,
   deferred to Batch 03's visual-compliance pass as originally planned.

## 9. Recommendations before Batch 01

- **Read `docs/COUNTING_METHODOLOGY.md` first** in any future session before quoting a component
  count — it is now the tie-breaker for every number in this project's planning docs.
- **Start Batch 01 with `Label`**, not with the visual-compliance items — the dependency fix in
  §4 only holds if Label is actually built first within the batch, not just assigned to it on
  paper.
- **Do not resolve node IDs for Search Box, Digital Stamp, or Extension yet** — per their
  `nodeResolutionPlan.howToResolve`, that effort is gated on Q10/Q5 clearing first.
- **Before Batch 05 begins**, spend the flagged half-day confirming the two Header Menu /
  Header Menu Item duplicate rows and the Slideout Menu/NavDrawer question — building on top of
  an unresolved identity question is the single highest-risk mistake available in the current
  queue (a second "Header Menu" component that turns out to be the one already shipped).
- **No further planning-document changes are needed before implementation starts** — this pass's
  stop condition is met (Counting Methodology ✔, Registry improvements ✔, Dependency validation
  ✔, Documentation consistency ✔, this report ✔). The next session should implement, not plan.
