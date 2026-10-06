# Hackathon Pages — Component Dependency Audit

Design-system-only audit for two upcoming pages: **My Requests / إدارة الطلبات** and
**Submit Innovation Request / تقديم طلب ابتكار**. No page code is built or modified by this
document or this pass — per the task brief, this is planning + (where in scope) component
hardening only.

## 0. Inputs and a documentation gap

- Read: `CLAUDE.md`, `README.md` (effectively empty — 1 line, no content to extract),
  `docs/VISUAL_COMPLIANCE_WORKFLOW.md`, `docs/COMPONENT_APPROVAL_MATRIX.md`,
  `docs/TOKEN_MAPPING.md`, `docs/DGA_COMPONENT_NODE_MAP.md`,
  `docs/DGA_COMPONENT_IMPLEMENTATION_QUEUE.md`, `reports/DGA_PROJECT_PROGRESS.md`, the full
  `frontend/src/design-system/registry/figma-component-map.json`, and every candidate
  component's current `.tsx` implementation.
- **`references/ui/hackathon/my-requests.png`, `submit-request-part-1.png`,
  `submit-request-part-2.png` do not exist in this repository** — only
  `references/figma/foundations/*.tokens.json` exists under `references/`. This audit's page
  section breakdown is therefore built from the **functional requirements spelled out directly
  in this task's own brief** (field lists, form requirements), not from the screenshots. Every
  section/field inferred this way is marked **Needs Confirmation** below rather than asserted as
  fact — provide the actual PNGs (or confirm the field lists below are complete) before page
  implementation begins.

## 1. Node-resolution policy applied this pass

Every candidate component below already has a **non-null** `nodeId`/`figmaUrl` in the registry,
but most carry `nodeResolutionStatus: "pending"` with a `nodeResolutionPlan.whyUnresolved` note
saying the ID came from `search_design_system` and "has not been resolved" via a live call yet.
This is the same starting state `Text Input` and `Link` were in before their own approval passes
(`CLAUDE.md`'s Official Figma Node Resolution Policy: *"If the component contains figmaFile /
nodeId / figmaUrl then these values MUST be used directly"*) — `nodeResolutionStatus: "pending"`
is a **workflow-progress marker** ("not yet live-verified this session"), not a signal that the
ID is fabricated. The hard gate is `nodeId === null` (genuinely unresolved — e.g. `Progress
Indicator`/`Steps`, `Trailing Icon`), which **does** trigger "Manual Node Registration Required"
per `CLAUDE.md`'s Figma Access Security Policy §5. This pass:

- Uses the stored `nodeId` directly with read-only MCP tools for any row with a populated,
  non-null `nodeId`, live-verifies it, and — only on success — flips `nodeResolutionStatus` to
  `"resolved"` as part of that component's own approval (the same mechanism that moved `Text
  Input` from `pending`→`resolved` last pass).
- Treats a genuinely `null` `nodeId` as **Manual Node Registration Required** and does not
  attempt implementation on that row this pass.

## 2. Page → region → component map

### My Requests / إدارة الطلبات

| # | UI region | Required component | Current impl. | Visual compliance | Official coverage | Node resolution | Dependencies | Work required? |
|---|---|---|---|---|---|---|---|---|
| 1 | Page chrome (top/bottom) | Header, Footer | ✅ Approved | ✅ Approved | partial | resolved | — | No |
| 2 | Breadcrumb trail | Breadcrumb | 🔲 Implemented (`shell/Breadcrumbs`) | pending | complete | pending (nodeId `5698:2597` populated) | Link | **Yes** |
| 3 | Page title / intro text | Typography | 🔲 Implemented | pending | — | N/A (text styles, not a component) | — | Not in scope this pass (tracked separately in Batch 01, not blocking these 2 pages functionally) |
| 4 | "New Request" action | Button | ✅ Approved | ✅ Approved | partial | resolved | — | No |
| 5 | Requests data table (seq #, title, created date, last-modified date, status, final evaluation, row action) | Table | 🔲 Implemented (`composite/Table`) — generic, typed, `render`-per-column, no hardcoded columns already (good — satisfies "do not hardcode Hackathon column labels") | pending | partial | pending (main `Table` nodeId `5698:40875` populated; Table Row `5698:40844` / Table Header `5898:27389` sub-part nodes also populated) | Table Row, Table Header, cells | **Yes** |
| 6 | Status / Final Evaluation badges (table cells) | Tag | ✅ Approved (not in the task's original component lists, but the obvious fit for status/evaluation badges — flagged here as a correction to the audit input) | ✅ Approved | complete | resolved | — | No — reuse as-is |
| 7 | Row action / navigate-to-detail | Link or icon-Button (existing primitives) | ✅ Approved (Link) / ✅ Approved (Button) | ✅ Approved | — | resolved | — | No |
| 8 | Table empty state (no requests yet) | Table's `emptyState` slot + `EmptyState` composite | 🔲 Implemented, not yet in approval matrix | pending | — | N/A (FADS composite, no dedicated Figma node found in registry) | — | Not required by this task's explicit component list; flagged **Needs Confirmation** on whether `EmptyState` needs its own pass — out of scope unless the table pass surfaces a real defect |
| 9 | Table loading state | Loading | 🔲 Implemented | pending | complete | pending (nodeId `5698:11136` populated) | — | **Should be verified** if the page will show it (task lists "Loading" as a maybe-needed component); scoped as **optional, lower priority** than Table/Pagination since a loading spinner has low visual-fidelity risk relative to a 288-variant-class component |
| 10 | Pagination control | Pagination | 🔲 Implemented (`composite/Pagination`) | pending | complete | pending (nodeId `7936:8133` populated) | Button | **Yes** |
| 11 | Section separators | Divider | ✅ Approved | ✅ Approved | partial | resolved | — | No |

### Submit Innovation Request / تقديم طلب ابتكار

| # | UI region | Required component | Current impl. | Visual compliance | Official coverage | Node resolution | Dependencies | Work required? |
|---|---|---|---|---|---|---|---|---|
| 1 | Page chrome | Header, Footer | ✅ Approved | ✅ Approved | partial | resolved | — | No |
| 2 | Breadcrumb trail | Breadcrumb | (same row as My Requests §1.2) | pending | complete | pending | Link | **Yes** (shared work item, not duplicated) |
| 3 | Multi-part form indicator ("part 1"/"part 2" per the task's own screenshot filenames) | Steps (`composite/Steps`, registry name **Progress Indicator**) | 🔲 Implemented | pending | complete | **`nodeId: null` — Manual Node Registration Required** | — | **Blocked** — not independently resolvable this pass. Flagged **Needs Confirmation**: without the actual screenshots, it's not even confirmed the page uses a visible stepper vs. two plain sections/scroll anchors — do not build this without either (a) a resolved node, or (b) confirmation the page needs it at all. |
| 4 | Section grouping | Card, Divider | ✅ Approved | ✅ Approved | — | resolved | — | No |
| 5 | Field: innovation title | TextInput | ✅ Approved | ✅ Approved | complete | resolved | Label | No |
| 6 | Field: description / long text | Textarea | 🔲 Implemented | pending | complete | pending (nodeId `5462:417368` populated) | Label | **Yes** |
| 7 | Field: category / classification dropdown | Select (registry: Dropdown Input) | 🔲 Implemented as a native-`<select>`-based `Select`; official popover/list-item structure not matched (registry note) | pending | partial | pending (nodeId `3534:49934` populated) | Dropdown List Item, Trailing Icon | **Yes**, scoped to what's independently resolvable — see §4 |
| 8 | Field: file attachment | FileUploader | 🔲 Implemented (`composite/FileUploader`), merged Single+Multiple per registry note | pending | partial | pending (nodeId `30146:37020` Single / `30146:37007` Multiple, both populated) | Button | **Yes** |
| 9 | Checkbox agreement | Checkbox | 🔲 Implemented (`primitives/Checkbox`) | pending | complete | pending (nodeId `30186:53826` populated) | — | **Yes** |
| 10 | Field validation errors, required labels, helper text | Already handled by the shared `Field` pattern (used by TextInput/Textarea/Select) | ✅ Existing, approved-adjacent (TextInput's own pass re-implemented this contract locally; Textarea/Select still use the shared `Field`) | — | — | — | Field | No new work — confirm during each field component's own pass that `Field`'s contract (label, `aria-describedby`, `aria-invalid`, `aria-required`) is intact, do not modify `Field` itself (per "no other component's `.tsx` may change" rule) |
| 11 | Form-level error/notice (e.g. "please fix the fields below") | Alert (Inline Alert) | 🔲 Implemented (`composite/Alert`) | pending | unknown | pending (nodeId `30150:56889`, shared with `Notification` — **registry flags a NeedsConfirmation split between Alert=inline and Notification=banner against a single official Figma set found**) | Button-Close (missing) | **Yes, but scoped carefully** — the Alert/Notification duplication question must be resolved as part of this component's own pass, per `docs/DGA_COMPONENT_IMPLEMENTATION_QUEUE.md` Batch 07 guidance, before trusting either implementation's variant set |
| 12 | Submit button (+ disabled state) | Button | ✅ Approved | ✅ Approved | partial | resolved | — | No |

## 3. Minimal component set required

Cross-referencing both tables, the **actual minimal set of components not already Approved**
that these two pages need is:

1. **Breadcrumb** — both pages
2. **Table** (+ its bundled Table Row/Header/cells) — My Requests only
3. **Pagination** — My Requests only
4. **Select** (registry: Dropdown Input) — Submit Request only
5. **Textarea** — Submit Request only
6. **File Upload** (Single + Multiple, merged as `FileUploader`) — Submit Request only
7. **Checkbox** — Submit Request only
8. **Alert** (Inline Alert) — Submit Request only, contingent on resolving the Alert/Notification
   split
9. **Loading** — My Requests only, lower priority (optional/cosmetic relative to the above)

**Steps/Progress Indicator cannot proceed this pass** (genuinely null `nodeId` — see §4); every
other candidate component in both page tables has a populated `nodeId` and is independently
resolvable. **Typography, Icon, Tag, EmptyState** are already sufficient/approved or explicitly
out of this task's scope; no work item opened for them here.

**Correction note:** an earlier draft of this audit incorrectly listed Textarea and File
Upload/Single/Multiple as blocked (`nodeId: null`), based on a stale memory of an earlier
registry snapshot rather than a fresh read. Re-verified directly against the current registry
JSON before finalizing this document — all three have populated `nodeId`s (Textarea
`5462:417368`, File Upload/Single `30146:37020`, File Upload/Multiple `30146:37007`) and are
**not** blocked. Only `Progress Indicator` (Steps) is genuinely null.

This differs from the task brief's own "Expected components" list in two ways, both flagged
rather than silently followed:

- **Tag** is not in the brief's lists at all, but is the obvious, already-Approved fit for the My
  Requests "status"/"final evaluation" columns — added here as a **no-work reuse**, not a new
  build.
- **Tooltip** — the brief says "only if genuinely needed." Nothing in either page's described
  field list needs a tooltip, and the screenshots to confirm are missing. **Not included** in the
  minimal set; do not build it speculatively.

## 4. Manual Node Registration Required (blocked this pass)

Verified directly against the current registry JSON, not the (partially stale) planning docs:

| Component | Registry `nodeId` | Registry `figmaUrl` | Status |
|---|---|---|---|
| **Progress Indicator (Steps)** | `null` | `null` | Manual Node Registration Required |

This is the **only** row in either page's dependency map with a genuinely null `nodeId`. Per the
task's own instruction, it is reported here and the audit continues only with the independently
resolvable components in §3. Whether the Submit Request page even needs a visible stepper is
itself unconfirmed (§2 row 3, missing screenshots) — do not build a "Steps" pass speculatively
either way; it stays queued pending either a resolved node or confirmation it's out of scope.

Every other candidate component in both page tables (Breadcrumb, Checkbox, Select, Textarea,
File Upload ×2, Table + sub-parts, Pagination, Alert/Notification, Loading, Trailing Icon) has a
populated, non-null `nodeId` in the registry and is independently resolvable per §1's policy.

## 5. Step 2 — Focused implementation order

Ordered by (a) shared-dependency position — `Breadcrumb` depends on the already-Approved `Link`
and blocks nothing else in this set, so it goes first — then (b) the task's own recommended
order, filtered to only the components resolvable per §3/§4:

1. **Breadcrumb** — smallest scope, no blocking dependents, needed by both pages.
2. **Checkbox** — small, no dependencies, needed by Submit Request.
3. **Textarea** — small, shares the `Field` pattern with the already-Approved `TextInput`,
   needed by Submit Request.
4. **Select** (Dropdown Input) — needed by Submit Request; proceeds as the existing
   native-`<select>` implementation (Dropdown List Item/Trailing Icon sub-parts have their own
   populated nodes but are not required for a native-`<select>`-based approval, same reasoning
   already applied to `TextInput` not needing every sub-part resolved).
5. **File Upload** — needed by Submit Request; depends on the already-Approved `Button`.
6. **Table** — needed by My Requests; largest scope in this set (bundled Row/Header/cell
   sub-parts).
7. **Pagination** — needed by My Requests; depends on the already-Approved `Button`.
8. **Alert** (Inline Alert) — needed by Submit Request; must resolve the Alert/Notification
   split as part of its own pass before trusting either component's variant set.
9. **Loading** — optional/lower-priority, My Requests only.

**Progress Indicator (Steps) is skipped** (§4) — the only row that remains `Manual Node
Registration Required` until a node is supplied or the page confirms it isn't needed.

## 6. Governing constraint on this pass's execution

`CLAUDE.md`'s Implementation Rule is explicit: *"Every implementation session is limited to ONE
component... Multi-component implementation is not allowed."* This audit (Steps 1–2) is planning,
not implementation, so it covers the full set above in one pass. **Step 3 (implementation) this
session is scoped to component #1, Breadcrumb, only** — taken through the full 10-step workflow
to Approved. Components #2–9 stay queued in the order above for subsequent sessions, each
starting fresh at `docs/VISUAL_COMPLIANCE_WORKFLOW.md` Step 1. See
`reports/HACKATHON_PAGES_COMPONENT_READINESS_REPORT.md` for the resulting readiness decision.
