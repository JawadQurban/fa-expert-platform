# DGA Project Progress Report

**Date:** 2026-07-12 · **Phase:** Planning pass — official Figma component catalog + implementation
roadmap. **No React code, tokens, Storybook, or tests were changed to produce this report** —
see `docs/DGA_OFFICIAL_COMPONENT_CATALOG.md` §0 for exactly which read-only Figma MCP calls
were made and why the literal task URL (`node-id=16026-49769`, the "Get Started" onboarding
page) was not the real components source.

## 1. Headline numbers

> **Updated 2026-07-12 (planning-hardening pass):** these percentages now use **78** — the
> *canonical* component count — as the denominator, not the original **80**. See
> `docs/COUNTING_METHODOLOGY.md` for the full definition. In short: the registry has **81** total
> rows; the canonical count of **78** excludes the 1 out-of-scope `flags / SA` row **and** the 2
> rows now explicitly flagged `isDuplicate: true` (`Header Menu (duplicate?)`,
> `Header Menu Item (duplicate?)`) that the original 80-based percentages were still counting as
> if they were unique components. The absolute counts below are unchanged from the original pass
> (no implementation progress was made or claimed during the hardening pass) — only the
> denominator and the resulting percentages were corrected.

Counting every distinct official Figma asset tracked in
`frontend/src/design-system/registry/figma-component-map.json` (81 total rows; 78 canonical —
see `docs/COUNTING_METHODOLOGY.md` §1–2 for exactly what's excluded and why):

| Status | Count | % of 78 (canonical) |
|---|---|---|
| ✅ **Approved** (live-Figma-verified + visually corrected + shipped) | 9 | 11.5% |
| **Implemented** (built, tested, shipped — not yet visually verified against this catalog) | 22 | 28.2% |
| **Partially Implemented** (built, but missing an official variant/sub-part) | 9 | 11.5% |
| **Needs Confirmation** (ambiguous vs. an already-built component — see below) | 3 | 3.8% |
| **Missing** (no React component exists) | 35 | 44.9% |

(The 2 rows flagged `isDuplicate: true` are excluded from this table entirely, per the duplicate
policy in `docs/COUNTING_METHODOLOGY.md` §3 — they are not double-counted as a 6th "duplicate"
status row, since that would just reintroduce the same inflation under a different label.)

**Read together:** Approved + Implemented + Partially Implemented = **40 of 78 (51.3%)** of the
official catalog already has *some* working React implementation. Only **9 of 78 (11.5%)** has
cleared full live-Figma visual-compliance sign-off — the bar the project's own
`docs/VISUAL_COMPLIANCE_WORKFLOW.md` and `CLAUDE.md` require before a component may be called
DGA-compliant, not merely DGA-inspired.

## 2. What changed this session vs. what was already known

Before this pass, `docs/COMPONENT_INVENTORY.md` tracked **33 numbered `CMP-*` components** (plus
2 FADS-authored, non-catalog compositions) as the complete known universe, of which 35 were
built. This session's `search_design_system` sweep against the real
"Components Library - Platforms Code (Community)" library found **34 additional official
components with no prior `CMP-*` entry at all** — provisionally numbered `CMP-34`…`CMP-49` in
`docs/DGA_COMPONENT_NODE_MAP.md`. Notable additions:

- A **Table sub-part family** (Table Row, Table Header, 4 distinct cell types including
  dedicated Sort/Filter header cells) — the existing `Table` component bundles all of this
  inline; the official library treats them as 7 separate composable pieces.
- A **Menu/navigation family** (Menu, Menu list item, Button-menu, Second Nav Header, Slideout
  Menu + Header) that materially overlaps what `NavDrawer`/`Header` already do — 2 items in
  this family are flagged `Needs Confirmation` because they may be duplicates of Header
  sub-parts already Approved (same `componentKey` surfaced under what looked like a second,
  separate search result).
- **List, Structured List, TOC, Avatar Group, Rating, Metric** — none previously in the
  inventory at all.
- **Digital Stamp's sibling, Extension** (domain-authenticity indicator) — previously undocumented
  anywhere, likely shares Digital Stamp's Q5 block.

One open ambiguity carried into the queue rather than silently resolved: the official library
appears to expose **one `Notification` component set**, while FADS ships **two** components
against it (`Alert` for inline/persistent, `Notification` for page-level banners) — whether
that's a real variant axis on the one Figma set or a FADS-invented split is unresolved and
explicitly flagged, not guessed at.

## 3. Known limitation on this pass's Figma coverage

`get_metadata` without a `nodeId` (used to enumerate "top-level pages of the document") reflects
only whatever canvases are currently loaded in the connected Figma desktop app — it returned the
same 2 pages ("Get Started" + a single "Tags" page) regardless of which of the two candidate
file keys was queried. Direct node-ID lookups work fine outside that list (confirmed against the
known Button node). Practical effect: **full recursive Section → Frame → ComponentSet → Variant
tree-walking was not possible this session** for anything beyond the 6 components (10 nodes
counting Header's sub-parts) already live-verified by prior sessions. The other 71 components
are catalogued from `search_design_system`'s index (name, description, component key) only —
real, not guessed, but without canvas node IDs or live variant/state data yet. This is
documented per-row in the registry (`nodeId: null` + a resolution instruction) so no future
session re-searches for something already found, and so nothing here is mistaken for
live-verified data it isn't.

## 4. Estimated remaining work

From `docs/DGA_COMPONENT_NODE_MAP.md`'s per-row estimates, summed by batch (Batch 00 already done):

| Batch | Theme | Rows | Rough effort |
|---|---|---|---|
| 01 | Visual-compliance verification + Label extraction | 6 | ~2 days |
| 02 | Actions completion | 2 | ~1 day |
| 03 | Forms & Inputs completion | 17 (several bundled) | ~7 days |
| 04 | Selection & Wayfinding | 9 (several bundled) | ~5 days |
| 05 | Navigation shell completion (incl. Button-menu) | 12 (several bundled) | ~8 days (incl. 0.5d confirmation spikes) |
| 06 | Data display completion | 15 (several bundled) | ~9 days |
| 07 | Feedback & overlays polish | 8 (several bundled) | ~4.5 days |
| 08 | Progress & Trust | 4 (Q5-conditional) | ~3.5 days |
| 09 | Patterns (L3) + residual | 6 patterns + carry-overs | ~9–12 days |

(Row/effort shifts vs. the original pass: Batch 01 gained Label — +1 row, +0.5d; Batch 02 lost
Label and Button-menu — −2 rows, −2d; Batch 05 gained Button-menu — +1 row, +1d. Net total
effort is essentially unchanged; only the batch each falls in moved, per the forward-dependency
fixes in `docs/DGA_IMPLEMENTATION_ORDER.md` §1 and `reports/PLANNING_HARDENING_REPORT.md` §3.)

**Total estimated remaining effort: roughly 6–7 weeks of focused, one-component-at-a-time work**
(consistent with the project's established "fix one component at a time" governance rule),
**before** accounting for template/page-level work (Submit/Manage/Detail/Admin/Evaluator
screens), which remains separately out of scope per `docs/PROJECT_STATUS.md`'s Phase 6 stop
condition.

This is a **planning-grade estimate**, not a committed schedule — several rows are gated on
open `docs/QUESTIONS.md` items (Q5 for Digital Stamp/Extension, Q10 for Search Box) or on
same-session confirmation spikes (the two Needs-Confirmation duplicate pairs, the Notification/
Alert split) whose outcome could shrink or grow adjacent rows.

## 5. Recommended next batch

**Batch 01** (`docs/DGA_COMPONENT_IMPLEMENTATION_QUEUE.md`) — **extract `Label` first**, then
visual-compliance verification of Typography, Link, Text Input, Container, Section, plus
formally adding Tag's already-captured live Figma data to `docs/COMPONENT_APPROVAL_MATRIX.md`.
Rationale (full detail in `docs/DGA_IMPLEMENTATION_ORDER.md §2`): **almost zero new visual
surface, lowest possible risk**, and it's the same well-proven process that already succeeded 5
times (Button, Card, Header, Footer, Divider) — Label is the one addition, a low-risk extraction
of code that already ships, pulled in during the 2026-07-12 hardening pass specifically because
Text Input (this batch) depends on it. Batch 01 also unblocks every later batch that depends on
Typography's type scale being confirmed (Metric in Batch 06, and implicitly every text-heavy
component after it).

## 6. Overall completion

- **By "has a working React component" (Approved + Implemented + Partially Implemented):
  51.3% (40/78 canonical).**
- **By "DGA visual-compliance Approved" (the project's actual completion bar per `CLAUDE.md`):
  11.5% (9/78 canonical).**
- **Newly-discovered scope this session: +34 components (+74% growth) over the previously known
  33-component catalog** — the honest takeaway is that the DGA component surface is
  meaningfully larger than `docs/COMPONENT_INVENTORY.md` alone suggested, not that less
  progress has been made than previously believed.
- These percentages use the **78-canonical** denominator established in the 2026-07-12
  hardening pass (`docs/COUNTING_METHODOLOGY.md`), not the original pass's 80. No implementation
  work happened between the two — only the counting method was corrected.

## 7. Source-of-truth going forward

Per the task's stop condition: **`frontend/src/design-system/registry/figma-component-map.json`
is now the permanent registry.** Any future implementation session must read it first. If a
component is already listed there (whether `nodeId` is resolved or still `null`), do not
re-run `search_design_system` for it — only search Figma for components genuinely absent from
the registry. When a `null`-nodeId row is picked up for implementation, resolve its real canvas
node ID first (open that component's page in the Figma desktop app, then `get_metadata`/
`get_design_context` directly on it) and update the registry entry in place before writing any
component code — consult that row's `nodeResolutionPlan` field first (added in the 2026-07-12
hardening pass) for exactly why it's unresolved and whether it's safe to resolve immediately or
gated on something else.

**Since this report was first written**, a planning-hardening pass (2026-07-12) replaced the
registry's single overloaded `status` field with four independent axes
(`implementationStatus`, `visualComplianceStatus`, `officialCoverage`, `nodeResolutionStatus`),
added explicit duplicate-tracking metadata, and fixed two forward-dependency batch placements
(Label, Button-menu). See `docs/COUNTING_METHODOLOGY.md` and
`reports/PLANNING_HARDENING_REPORT.md` for full detail. `status` is retained for backward
compatibility but is now derived, not authoritative.

## 8. Implementation update (2026-07-12, later same day) — Link (CMP-06) Approved

Batch 01's first implementation component: **Link's live Figma node was resolved** (file
`cII2UMRzWj0rwKuMzWFqTU`, node `2508:25804` — a 144-variant set), and the component moved from
`Implemented` to **`Approved`** after a full visual-compliance pass — see
`docs/FIGMA_LINK_SPECIFICATION.md` and `reports/VISUAL_COMPLIANCE/Link/VISUAL_COMPLIANCE_LINK.md`.
`Link.tsx`/`Link.module.css` were rebuilt around the official `mood` (Primary/Neutral/On-color —
confirmed no `Danger` variant exists on this component), `size` (sm/md), and `inline` axes, with
24 new additive `--fads-sys-link-*` tokens and a real `:focus-visible` border (previously absent).
All 7 validation commands pass.

**Effect on §1's headline numbers:** Approved moves **9 → 10** (12.8% of 78 canonical);
Implemented moves **22 → 21** (26.9%). The Approved+Implemented+PartiallyImplemented sum (51.3%)
is unchanged — this was a status transition within already-counted rows, not new scope. One item
remains **Needs Confirmation** (non-blocking): the live Neutral+Visited state reuses the
Primary-visited color rather than a distinct Neutral-visited token, disagreeing with
`Light.tokens.json`'s own bulk value for that token — see the compliance report §2 row 9.

Per the task's "fix one component at a time" rule, no other Batch 01 row (Typography, Text Input,
Container, Section, Tag's matrix entry) was touched this pass.

## 9. Implementation update (2026-07-12, later same day) — Tag (CMP-26) Approved

Batch 01's second implementation component: **Tag's live Figma node was already resolved** in the
registry from a prior session (file `Sv0oWOS1SjWnwhQwdzRJIE`, node `421:110968` — a 288-variant
set: `rtl` × `size` × `style` × `outline` × `rounded` × `iconOnly`), so no node-discovery step was
needed — went straight to `get_metadata`/`get_design_context`/`get_variable_defs` per the registry
node-resolution policy. The component moved from `Implemented` (`visualComplianceStatus:
"verified"`, live variant data captured in a prior session but never turned into a spec/compliance
pass) to **`Approved`** after a full visual-compliance pass — see
`docs/FIGMA_TAG_SPECIFICATION.md` and `reports/VISUAL_COMPLIANCE/Tag/VISUAL_COMPLIANCE_TAG.md`.

`Tag.tsx`/`Tag.module.css` were rebuilt around the official `size` (xs/sm/md), `outline`, and
`rounded` axes, with 29 new additive `--fads-sys-tag-*` tokens plus 3 new shared `text-2xs`
typography tokens. The non-official `variant="primary"` was removed (confirmed absent from the
live 288-node grid, unused by any product page) and the official `onColor` mood was added. One
real accessibility bug was found and fixed mid-pass: an icon-only `<span>` violated
`aria-prohibited-attr` (a `generic`-role element cannot carry `aria-label`) — fixed with
`role="img"`. All 7 validation commands pass (318 tests, up from 309).

**Effect on §1's headline numbers:** Approved moves **10 → 11** (14.1% of 78 canonical);
Implemented moves **21 → 20** (25.6%). The Approved+Implemented+PartiallyImplemented sum (51.3%)
is unchanged — another status transition within already-counted rows, not new scope. No open
Needs-Confirmation items this pass — unlike Link's Neutral+Visited discrepancy, every Tag
token/variant matched the live node directly with no source inconsistency found.

Per the task's "fix one component at a time" rule, no other Batch 01 row (Typography, Text Input,
Container, Section) was touched this pass.

## 10. Implementation update (2026-07-12, later same day) — Text Input (CMP-13) Approved

Batch 01's third implementation component: the registry had only a `componentKey` for Text
Input (no `nodeId`); `search_design_system` confirmed the component but returned no canvas node
(same MCP limitation documented for Link), so the user supplied a node-specific URL directly
(file `J0xq7JG3JKshRDzrgAM7E0`, node `30150:130250` — a 288-variant set: `rtl` × `state` ×
`filled` × `error` × `size` × `style`). The component moved from `Implemented`
(`visualComplianceStatus: "pending"`, `nodeResolutionStatus: "pending"`) to **`Approved`** after
a full visual-compliance pass — see `docs/FIGMA_TEXT_INPUT_SPECIFICATION.md` and
`reports/VISUAL_COMPLIANCE/TextInput/VISUAL_COMPLIANCE_TEXT_INPUT.md`.

**Architecture note:** `TextInput` is now fully self-contained — it no longer composes the
shared `Field`/`control.module.css` base that `Textarea`/`Select` still use unchanged. The
official component's structure (prefix/suffix, leading icon, size/surface axes) had diverged
too far from that shared shape to reuse without distorting it for those two other components,
which "never modify unrelated components" rules out. The full label/`aria-describedby`/
`aria-invalid`/`aria-required` accessibility contract was preserved, just re-implemented locally.

`TextInput.tsx`/`TextInput.module.css` were rebuilt around the official `size` (md/lg),
`surface` (default/filledDarker/filledLighter), `iconStart`, `prefix`, `suffix` props, with 36
new additive `--fads-sys-textinput-*` tokens. Real Focused (shadow+underline) and Pressed
(darken+underline) treatments were added — the prior implementation had neither. Disabled now
uses solid colors instead of opacity, matching Button/Card's established pattern; Read-only now
correctly has no background fill. Two `npm run typecheck` bugs were found and fixed mid-pass (a
`prefix` prop collision with a global RDFa HTML attribute, and a missing `id` field from an
over-broad `Omit`). All 7 validation commands pass (328 tests, up from 318).

**Effect on §1's headline numbers:** Approved moves **11 → 12** (15.4% of 78 canonical);
Implemented moves **20 → 19** (24.4%). The Approved+Implemented+PartiallyImplemented sum (51.3%)
is unchanged — another status transition within already-counted rows, not new scope. Two
Needs-Confirmation items, both non-blocking (spec §12): a Large-size Default-state text-color
token discrepancy (same category as Link's Neutral+Visited finding), and an RTL
icon/prefix/suffix physical-anchoring ambiguity (implemented as full logical-properties
mirroring, consistent with every other approved component, rather than the unusual
non-mirroring reading one live sample could support).

Per the task's "fix one component at a time" rule, no other Batch 01 row (Typography, Container,
Section) was touched this pass. Batch 01 now has 3 of 6 rows Approved (Link, Tag, Text Input);
remaining: Typography, Container, Section (Label was already extracted earlier in Batch 01).

## 11. Storybook/Figma alignment refinement (2026-07-13) — Text Input (CMP-13), still Approved

A dedicated request to make the Text Input Storybook a faithful visual-verification surface
(not a new implementation pass — Text Input was already `Approved`). Re-verified the live
288-node component set via `get_metadata`/`get_screenshot`, then directly sampled the 6 nodes
(`30150:131667`/`131771`/`132011`/`132979`/`133083`/`133323`) that the original spec pass had
only extended by analog (`Filled darker`/`Filled lighter` × Hovered/Pressed/Read-only).

**One real bug found and fixed:** those two surfaces gain a `field-border-default` (`#9da4ae`)
border on Hover/Press that the shipped component wasn't rendering — it was reusing the Default
style's `field-border-hovered` rule for all 3 surfaces uniformly. Fixed in `TextInput.module.css`
with surface-scoped overrides reusing the existing `--fads-sys-textinput-border-default` token (no
new tokens). See `docs/FIGMA_TEXT_INPUT_SPECIFICATION.md` §12 item 2 and
`reports/VISUAL_COMPLIANCE/TextInput/VISUAL_COMPLIANCE_TEXT_INPUT.md` §10 for the full account.

**Storybook rebuilt:** the `OfficialFigmaMatrix` story was restructured from a single ~1900px-wide
9-column grid (Style → Size → State rows; RTL × Filled × Error columns combined) into a
`Size → Surface → LTR/RTL → State` hierarchy — each section is ~800px and fits normal desktop
Storybook width. All 288 combinations are still rendered; cells not directly sampled from Figma
now carry a visible "NC" (Needs Confirmation) badge instead of the ambiguity being disclosed only
in prose in a separate report. Layout chrome moved out of inline styles into
`TextInput.matrixDemo.module.css`, reusing the shared generic SYS tokens. 26 tests added (RTL
`dir` propagation, a console-error-free full-prop render, and a parametrized
size×surface×error×disabled×readOnly stability check), bringing the suite to 42 TextInput tests
(354 total). All 7 validation commands pass. See
`reports/VISUAL_COMPLIANCE/TextInput/TEXTINPUT_STORYBOOK_FIGMA_DIFF.md` for the full diff,
including its update banner explaining what the original diff-report pass got wrong.

**Effect on §1's headline numbers:** none — Text Input was already counted as `Approved`; this is
a within-row correctness/presentation refinement, not a status transition. No headless-browser
screenshot tool was available in this environment to pixel-diff the rendered Storybook against
the Figma screenshot; verification here is live-Figma-token-level plus code review.

Per the task's "fix one component at a time" rule, no other component was touched this pass.

## 12. Hackathon Pages component readiness pass, component #1 — Breadcrumb (2026-07-13)

Design-system-only preparation for two upcoming pages, **My Requests / إدارة الطلبات** and
**Submit Innovation Request / تقديم طلب ابتكار** — no page code, backend, or API was built or
touched this pass. Full dependency audit: `reports/HACKATHON_PAGES_COMPONENT_DEPENDENCY_AUDIT.md`
(page → UI region → component map for both pages, minimal-set determination, and a focused
9-component execution order). Key correction made during the audit: an earlier draft incorrectly
flagged `Textarea`/`File Upload` as blocked (`nodeId: null`) based on stale memory rather than a
fresh registry read — re-verified directly against the current JSON before finalizing; only
`Progress Indicator` (Steps) is genuinely `nodeId: null` (Manual Node Registration Required).

Per `CLAUDE.md`'s "one component per session" rule, Step 3 (implementation) this pass covered
**Breadcrumb only** — component #1 of the audit's execution order, needed by both pages.

**Breadcrumb (CMP-04) — Approved.** Live-verified against node `5698:2597` (10-variant set:
`rtl` × `levels`[2,3,4,5,>5]). Findings, all fixed:

1. Ancestor items now compose the already-Approved `Link` primitive (`mood="neutral"`,
   `size="sm"`) instead of a bare `<a>` styled with the generic link-blue token — live data
   showed ancestor items use `Link/link-neutral` (`#384250`), exactly matching `Link`'s own
   `mood="neutral"` token, so composing it was both correct and free (no new color token).
2. The separator was a literal `"/"` rendered *after* each non-last item; live data shows a
   **directional arrow icon** (different icons for LTR/RTL, not one glyph rotated) rendered
   *before* each non-first item. Since the official `arrow-right-01`/`arrow-left-01` icons aren't
   in this project's Icon registry yet (no arrow/chevron category exists), this pass uses the
   Unicode `›`/`‹` angle-quotation glyph pair, which the browser auto-mirrors under `dir="rtl"`
   via its `Bidi_Mirrored=Yes` property — zero extra logic needed, flagged as an approximation of
   the real icon pending the same icon-library gap already noted for `Link`'s external-link
   marker and `TextInput`'s feedback icon.
3. The current-page item was `--fads-sys-color-text-muted` **+ bold** — live data shows
   `Global/text-default-disabled` (`#9da4ae`), **regular weight**. Both values were wrong.
4. The official `Levels=">5"` variant (root → interactive `"..."` button → last 2 items) was
   entirely unimplemented — the prior component always rendered every passed item regardless of
   count. Added: collapses when `items.length > 5`, click-to-reveal-in-place (Figma shows only
   the collapsed state, so the exact interaction is a disclosed, non-blocking judgment call).

4 new additive `--fads-sys-breadcrumb-*` tokens (`text-current`, `separator-color`,
`ellipsis-text`, `item-gap`) — two of the four coincide in value with `Link`'s own tokens
(`link-neutral`, `link-sm-gap`) because both independently source the same underlying Figma
variable, not a cross-component alias (same "expected coincidence" pattern documented for every
prior component in `docs/TOKEN_MAPPING.md`). 9 Breadcrumbs tests (up from 4); 359 tests pass
repo-wide. All 7 validation commands green. Props API unchanged (`items`/`label`/`className`)
plus one new optional `expandLabel` prop — no breaking change; `Breadcrumbs` was not yet consumed
by any product page, so zero external-breakage risk regardless.

**Effect on §1's headline numbers:** Approved moves **12 → 13**; `Breadcrumb` was not previously
tracked in `docs/COMPONENT_APPROVAL_MATRIX.md` at all (this is its first pass, not a status
transition within an already-counted row — the matrix itself gained a new row, per its own
documented scope-expansion pattern already used for `Divider`/`Link`/`Tag`). Two Needs-Confirmation
items, both non-blocking: the approximated separator glyph/color pending the icon-library import,
and the `Levels>5` ellipsis's exact click behavior.

**Remaining scope, explicitly not done this pass:** 8 more components from the audit's execution
order (Checkbox, Textarea, Select, File Upload, Table, Pagination, Alert, Loading), each requiring
its own full session per `CLAUDE.md`. `Progress Indicator`/Steps is Manual-Node-Registration-
Required. See `reports/HACKATHON_PAGES_COMPONENT_READINESS_REPORT.md` for the resulting
**NOT READY for page implementation** decision and the full remaining-work breakdown.
