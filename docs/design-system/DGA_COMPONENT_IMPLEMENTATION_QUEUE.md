# DGA Component Implementation Queue

Batches for all remaining work identified in `docs/DGA_COMPONENT_NODE_MAP.md` and
`frontend/src/design-system/registry/figma-component-map.json`. **Planning only — nothing in
this batch plan has been built yet.** Rationale for the ordering is in
`docs/DGA_IMPLEMENTATION_ORDER.md`.

Batch 00 (Button, Card, Header, Footer, Divider, + Header's 4 approved sub-parts) is already
**Done** — omitted below. Work strictly one batch at a time; within a batch, follow
`docs/VISUAL_COMPLIANCE_WORKFLOW.md` for anything with an existing React implementation, and
the same 10-step spirit (inspect live → spec → build → verify → approve) for anything Missing.

---

## Batch 01 — Visual-compliance verification of already-built primitives (+ one foundational extraction)

Mostly no new components — closes the gap between "Implemented" and "Approved" for the
primitives that carry the most reuse across every later batch. **One exception, added in the
2026-07-12 hardening pass:** Label is pulled in from Batch 02 because Text Input (this batch)
depends on it — see `docs/DGA_IMPLEMENTATION_ORDER.md §1` and
`reports/PLANNING_HARDENING_REPORT.md §3` for why. Label is a low-risk extraction from the
already-shipped internal `Field` helper, so it doesn't change this batch's overall risk profile.

- **Label (CMP-37)** — extract from internal `Field` into a standalone exported primitive
  **first, before Text Input's pass below** — every later form-input batch (03) also depends on it.
- Typography (style-mapping pass, not a component — see catalog §2.9)
- Link (CMP-06)
- Text Input (CMP-13) — after Label
- Container, Section (FADS-only — document their "no Figma source" status formally, no code change)
- Tag (CMP-26) — already has live Figma data captured this session; just needs a
  `docs/COMPONENT_APPROVAL_MATRIX.md` row and confirmation pass

---

## Batch 02 — Actions completion

- Button-Close (CMP-35) — shared dismiss control, currently duplicated ad hoc inside
  Modal/Toast/Notification
- Floating Button (CMP-36)

**Button-menu (CMP-34) was moved out of this batch** (2026-07-12 hardening pass) — it depends on
`Menu` (CMP-11), which is scheduled in Batch 05, a forward-dependency violation. See Batch 05
below.

---

## Batch 03 — Forms & Inputs completion

Visual-compliance pass for everything already built, plus the genuinely missing pieces. Grouped
together because they all share `Label` (Batch 02) and the `Field` pattern.

- Checkbox, Radio, Switch, Textarea (visual compliance)
- Date Picker (visual compliance)
- File Upload / Single + Multiple (visual compliance; confirm whether the two Figma variants
  need to stay one component or split)
- Dropdown Input / Select (visual compliance + Dropdown List Item + Trailing Icon sub-parts)
- Number Input (new)
- Input Prefix-Suffix (new)
- Search Box (new — only if Q10 has cleared by the time this batch starts; otherwise skip and
  re-queue in Batch 09)

---

## Batch 04 — Selection & Wayfinding controls

- Horizontal Tab / Tab List (visual compliance)
- Vertical Tab / Tab List (new — extends `Tabs` with `orientation="vertical"`)
- Content Switcher (CMP-10, new)
- Pagination (visual compliance)
- Breadcrumb (visual compliance)
- TOC / TOC Item (new)

---

## Batch 05 — Navigation shell completion

The single largest batch — deliberately, since Header/NavDrawer/Menu all share the same
dropdown/overlay mechanics and should be designed together rather than three separate times.

- **Resolve the two Needs-Confirmation duplicate pairs first** (Header Menu / Header Menu Item
  — do they duplicate the already-Approved Header sub-parts, or are they distinct?) — a
  half-day confirmation spike, not a build task, and it gates everything else in this batch.
- Nav Header Sub-Menu + Header Sub-menu Item (CMP-47) — closes the one deferred piece of the
  already-Approved Header
- Second Nav Header (CMP-45, new)
- **Menu + Menu list item (CMP-11), then Button-menu (CMP-34)** — build in this exact order
  within the batch: Menu list item → Menu → Button-menu, since Button-menu consumes Menu.
  Button-menu was relocated here from Batch 02 (2026-07-12 hardening pass) specifically to keep
  this dependency in-batch rather than forward-referencing it.
- Item Icon (shared sub-part)
- Nav Drawer Item — bring `NavDrawer`'s content model in line with the official Parent/Link
  structure
- Slideout Menu + Slideout Menu Header — resolve Needs-Confirmation vs. NavDrawer, then build
  only if genuinely distinct

---

## Batch 06 — Data display completion

- Table sub-parts: Table Header Cell - Sort, Table Header Cell - Filter (visual-compliance +
  gap-fill on the already-Partially-Implemented `Table`)
- Structured List / Structured List Row (new)
- List / List item (new)
- Avatar (visual compliance) + Avatar Group (new)
- Rating (CMP-29, new)
- Metric (new — depends on Typography being verified in Batch 01)

---

## Batch 07 — Feedback & overlays polish

- Modal, Notification Toast, Tooltip, Loading (visual compliance)
- **Resolve Notification vs. Alert/Banner split** (Needs Confirmation) before doing visual
  compliance on either — may reveal one of the two is not a real official variant
- Help Icon (new)
- Skeleton Square / Skeleton Component (new — distinct shapes beyond `Loading`'s current
  line-skeleton variant)

---

## Batch 08 — Progress & Trust

- Progress Indicator / Steps (visual compliance)
- Radial Stepper, Circular Stepper (new)
- Digital Stamp (CMP-32) + Extension (new) — **only if Q5 has cleared**; otherwise this batch
  is skipped entirely and its slot absorbed by Batch 09

---

## Batch 09 — Patterns (L3) + residual

Everything here depends on components from every earlier batch, which is why patterns are last
regardless of how simple any individual pattern looks.

- PAT-05 App Shell (Header + NavDrawer + Breadcrumbs + Footer) — build first; every other
  pattern sits inside it on a real page
- PAT-06 Notification system (Toast + Alert + Notification) — do this right after the Batch 07
  Notification/Alert split is resolved, while the distinction is fresh
- PAT-03 Content-section grid (Card grid + heading + Button) — already informally proven by the
  Hackathon landing page; formalize as a reusable pattern
- PAT-01 Multi-step form (Steps + inputs + FileUploader + Modal + Toast/Alert)
- PAT-02 Entity list + filter (Table/Card + Select + Tag + Pagination)
- PAT-04 Feedback block (Rating + Textarea + Toast)
- Any item still carrying `NeedsConfirmation` or blocked on an open `docs/QUESTIONS.md` item by
  this point (Search Box/Q10, Digital Stamp+Extension/Q5, Slideout Menu vs. NavDrawer)

---

## Explicitly not batched

- **flags / SA** — not a component; routed to the icon/locale-asset pipeline
  (`docs/ICON_LIBRARY.md`), never enters this queue.
- **Typography, Container, Section** — no Figma component source; their "work" is a
  documentation/style-mapping pass (folded into Batch 01), not new UI.
