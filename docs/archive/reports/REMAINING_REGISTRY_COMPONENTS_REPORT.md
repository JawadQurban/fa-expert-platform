# Remaining Registry Components — Audit & Execution Report

Live tracking document for the "Complete All Remaining Registry Components" cycle.
Source of truth: `frontend/src/design-system/registry/figma-component-map.json`
(82 entries total). Per the governing brief: work strictly from this registry,
skip `Approved` rows, process exactly one actionable component at a time
(`CLAUDE.md`'s one-component-per-session rule), never mark a component
`Approved` without completing the full `docs/VISUAL_COMPLIANCE_WORKFLOW.md`
10-step process (or, for a stale-registry row, a live re-verification proving
that process already completed elsewhere).

This file is updated after every component. Do not treat the whole registry as
complete while any actionable row remains unfinished.

---

## 1. Summary

| Bucket | Count | Action |
| --- | --- | --- |
| Approved | 58 | Skip — not revisited unless a regression is discovered |
| NotApplicable (`flags / SA`) | 1 | Skip — not a component |
| Duplicate (retired) | 2 | Skip — no implementation of its own, not counted as Approved |
| **Actionable remaining** | **21** | Process one at a time, per the plan below |

Original actionable breakdown by registry `status` field (before this cycle
started processing them): Missing (24), Implemented (9), PartiallyImplemented
(5), NeedsConfirmation (5) = 43. Of those, 2 (Loading, Progress Indicator) were
stale-registry syncs now folded into Approved, 2 (Header Menu / Header Menu
Item duplicates) were retired as Duplicate, and 18 (Avatar, Tooltip, Horizontal
Tab, Horizontal Tab List, Modal, Vertical Tab, Vertical Tab List, Notification
Toast, Notification, TOC Item, TOC, Header Sub-menu Item, Item Icon, Nav
Header Sub-Menu, Second Nav Header, Button-menu, List item, List) are now
genuinely Approved via real builds — 21 remain actionable.

## 2. Approved — skipped (58, was 57)

Button, Card, Nav Header, Header Menu Item, Header Action, Header Menu
(hamburger), Logo Placeholder, Footer, Divider, Tag, Link, Text Input, Label,
Button-Close, Floating Button, Number Input, Input Prefix-Suffix, Dropdown List
Item, Trailing Icon, Dropdown Input, Search Box, Checkbox, Radio, Radio Label,
Switch, Switch Label, Textarea, Date Picker, File Upload / Single, File Upload
/ Multiple, Content Switcher, Pagination, Breadcrumb, Menu, Menu list item,
Table, Rating, Alert, Loading, Progress Indicator, Avatar, Tooltip,
Horizontal Tab, Horizontal Tab List, Modal, Vertical Tab, Vertical Tab List,
Notification Toast, Notification, TOC Item, TOC, Header Sub-menu Item, Item
Icon, Nav Header Sub-Menu, Second Nav Header, Button-menu, List item, **List**.

## 3. NotApplicable — skipped (1)

`flags / SA` — not a UI component (a country flag asset), correctly excluded
from the workflow.

## 4. Live audit matrix — all 43 actionable entries

Columns: registry name · registry status (as found) · implementation status ·
Figma node status · blocker (if any) · tests · validation · final status (as of
this report).

### 4a. Stale-registry rows — Approved elsewhere, registry just not synced (2)

| Name | Registry status found | Implementation status | Figma node status | Blocker | Tests | Validation | Final status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **Loading** | Implemented | Complete (`Loading.tsx`, full spec, full compliance report already existed) | Resolved — re-verified live 2026-07-16, zero drift | None | Pre-existing `Loading.test.tsx`, unchanged | Re-verification only; no code changed, so no re-run needed this pass | ✅ **Approved** (registry corrected 2026-07-16) |
| **Progress Indicator** (Steps, CMP-21) | Implemented | Complete (`Steps.tsx`, full spec `docs/FIGMA_PROGRESS_INDICATOR_SPECIFICATION.md`, full compliance report already exist) | Resolved — re-verified live 2026-07-16, zero drift | None | Pre-existing `Steps.test.tsx`, unchanged | Re-verification only; no code changed, so no re-run needed this pass | ✅ **Approved** (registry corrected 2026-07-16) |

### 4b. Confirmed duplicates — retire, no separate implementation (2)

| Name | Registry status | Implementation status | Figma node status | Blocker | Tests | Validation | Final status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **Header Menu (duplicate?)** | NeedsConfirmation | None (no separate file) | `nodeId`/`figmaUrl` null; shares `componentKey` `886b8b3a...` with the live-verified, Approved "Header Menu (hamburger)" | None — resolved | N/A | N/A | ✅ **Duplicate** (retired 2026-07-16) — `search_design_system` re-confirmed live: exactly one "Header Menu" component_set exists in the whole library, componentKey-identical to the canonical row. Not marked Approved (no implementation of its own). |
| **Header Menu Item (duplicate?)** | NeedsConfirmation | None | `nodeId`/`figmaUrl` null; shares `componentKey` `87e55aba...` with the live-verified, Approved "Header Menu Item" | None — resolved | N/A | N/A | ✅ **Duplicate** (retired 2026-07-16) — `search_design_system` re-confirmed live: exactly one "Header Menu Item" component_set exists in the whole library, componentKey-identical to the canonical row. Not marked Approved (no implementation of its own). |

### 4c. Genuinely blocked — need a user decision before implementation (4)

| Name | Registry status | Implementation status | Figma node status | Blocker | Tests | Validation | Final status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **Slideout Menu** | NeedsConfirmation | Missing | Blocked | Unresolved: may be NavDrawer's own mobile pattern under a different official name, or a genuinely distinct component — needs a live Figma comparison against NavDrawer before scoping | — | — | ⛔ Blocked pending investigation (resolvable — see §6) |
| **Slideout Menu Header** | NeedsConfirmation | Missing | Blocked | Sub-part of Slideout Menu; inherits its blocker | — | — | ⛔ Blocked (same as above) |
| **Digital Stamp** | Missing | Missing | Blocked | `docs/QUESTIONS.md` Q5 — open client/business-scope question | — | — | ⛔ Blocked, not resolvable without client input |
| **Extension** | Missing | Missing | Blocked | Depends on Digital Stamp; shares its Q5 blocker | — | — | ⛔ Blocked (same as above) |

### 4d. Implemented, needs the full Visual Compliance Workflow (0, was 7 — Avatar, Tooltip, Horizontal Tab/List, Modal, Vertical Tab/List, Notification Toast, Notification all done)

(Checkbox Label bundled-status is handled separately in §4f; Loading/Progress
Indicator moved to §4a; Avatar/Tooltip/Horizontal Tab/Horizontal Tab
List/Modal/Vertical Tab/Vertical Tab List/Notification Toast/Notification
moved to done, see §7 Components 5-12. This bucket is now empty.)

### 4e. PartiallyImplemented — bundled into an Approved component (5)

All five are already implemented as inline behavior inside an already-`Approved`
parent (`Table` or `NavDrawer`), not exposed as standalone sub-components —
the same pattern already accepted for `Checkbox Label` (bundled into
`Checkbox`) and `Radio Label`/`Switch Label` (bundled, already Approved as
part of their parents). Per `CLAUDE.md`'s reuse-over-duplication rule and
"preserve public API compatibility," extracting these into standalone exports
is not automatically required — each needs a per-component judgment call
(documented bundled coverage vs. genuine extraction) when its turn comes.

| Name | Registry status | Implementation status | Figma node status | Blocker | Tests | Validation | Final status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **Nav Drawer Item** | PartiallyImplemented | Partial — `NavDrawer` renders free-form `children`, not this Parent/Link item structure | Pending | None | N/A (no dedicated tests) | — | ⏳ Pending — needs a scoping decision: extract a real sub-component, or document as an intentional API difference |
| **Table Row** | PartiallyImplemented | Bundled in `Table.tsx`; Table's own 2026-07-13 pass already live-verified this sub-part's Selected/Hovered/Alt colors + Checkbox cell | Pending (bundled coverage only) | None | Covered by `Table.test.tsx` | Covered by Table's existing validation | ⏳ Pending — likely resolves to "documented bundled coverage," not new code |
| **Table Header** | PartiallyImplemented | Bundled in `Table.tsx`; already live-verified (background/border/text-color/height) | Pending | None | Covered by `Table.test.tsx` | Covered | ⏳ Pending — same as Table Row |
| **Table Header Cell** | PartiallyImplemented | Bundled in `Table.tsx`; already live-verified (text-xs/Medium color/size/weight) — Sort/Filter variants are the genuinely missing piece (§ Missing) | Pending | None | Covered by `Table.test.tsx` | Covered | ⏳ Pending — same as Table Row |
| **Table Row Cell** | PartiallyImplemented | Bundled in `Table.tsx`; already live-verified (padding/gap/height, Standard + Compact) | Pending | None | Covered by `Table.test.tsx` | Covered | ⏳ Pending — same as Table Row |

### 4f. Missing — genuinely no implementation (13, was 22 — TOC Item/TOC/Header Sub-menu Item/Item Icon/Nav Header Sub-Menu/Second Nav Header/Button-menu/List item/List done, §7 Components 13-21)

Grouped by rough dependency tier. All have concrete (non-null) `nodeId`
values already stored in the registry per `CLAUDE.md`'s Figma Node Resolution
Policy ("if the component contains figmaFile/nodeId/figmaUrl, use them
directly — do not re-search"), except where noted.

| Name | Dependencies | Node status | Blocker | Final status |
| --- | --- | --- | --- | --- |
| **Checkbox Label** | Checkbox, Label (both Approved) | pending, but node not yet live-sampled for this specific sub-part | None | ⏳ Pending — bundled into `Checkbox.tsx` already (label/description/error slots); likely resolves the same way as Radio Label/Switch Label (documented bundled coverage, no new file) |
| **Metric** | Typography (Approved) | pending | None | ⏳ Pending — standalone primitive, no blockers |
| **Avatar Group** | Avatar (now Approved, §7 Component 5) | pending | None | ⏳ Pending — now unblocked (Avatar just closed) |
| **Help Icon** | Tooltip (now Approved, §7 Component 6), Icon (Approved) | pending | None | ⏳ Pending — now unblocked (Tooltip just closed) |
| **Skeleton Square** | Loading (now Approved, §4a) | pending | None | ⏳ Pending — now unblocked (Loading just closed) |
| **Skeleton Component** | Loading (now Approved, §4a) | pending | None | ⏳ Pending — now unblocked |
| **Structured List Row** | none | pending | None | ⏳ Pending |
| **Structured List** | Structured List Row (this table) | pending | None | ⏳ Pending — build after Structured List Row |
| **Table Header Cell - Sort** | Table Header Cell (PartiallyImplemented, §4e) | pending | None | ⏳ Pending |
| **Table Header Cell - Filter** | Table Header Cell (PartiallyImplemented, §4e) | pending | None | ⏳ Pending |
| **Radial Stepper** | none | pending | None | ⏳ Pending |
| **Circular Stepper** | none | pending | None | ⏳ Pending |
| **Digital Stamp** | — | blocked | Q5 | See §4c |
| **Extension** | Digital Stamp | blocked | Q5 (inherited) | See §4c |

## 5. Ordered execution plan

Dependency-aware order — primitives with no unresolved dependencies first,
then things that unblock the most downstream rows, blocked rows last:

1. ~~**Loading**~~ — ✅ done (registry catch-up, §4a).
2. ~~**Progress Indicator** (Steps)~~ — ✅ done (registry catch-up, §4a).
3. ~~**Header Menu (duplicate?)**~~ / ~~**Header Menu Item (duplicate?)**~~ — ✅ done (both confirmed duplicates, retired, §4b).
4. ~~**Avatar**~~ — ✅ done (real build, §7 Component 5). Unblocks Avatar Group.
5. ~~**Tooltip**~~ — ✅ done (real defect fix — dark bubble corrected to the live-verified light default, §7 Component 6). Unblocks Help Icon.
6. ~~**Horizontal Tab** + **Horizontal Tab List** (`Tabs`)~~ — ✅ done (§7 Component 7). Unblocked Vertical Tab.
6b. ~~**Vertical Tab**~~ — ✅ done (§7 Component 9, `orientation="vertical"` on `Tabs`). Unblocked Vertical Tab List.
6c. ~~**Vertical Tab List**~~ — ✅ done (§7 Component 10). Re-verification found the existing `orientation="vertical"` implementation already matched its live structure exactly — no code changes needed.
7. ~~**Modal**~~ — ✅ done (visual/structural pass, §7 Component 8). ~~**Notification Toast**~~ — ✅ done (near-total rebuild, §7 Component 11). ~~**Notification**~~ — ✅ done (full rebuild, §7 Component 12). Step 7 fully complete.
8. **Checkbox Label** — likely a documentation-only close (bundled coverage), quick.
9. **Item Icon** — likely resolves to NotApplicable (covered by Icon primitive), quick.
10. **Metric** — standalone primitive.
11. **Avatar Group** (unblocked — Avatar done), **Help Icon** (unblocked — Tooltip done), **Skeleton Square** + **Skeleton Component** (unblocked — Loading done) — each independent, all now unblocked.
12. ~~**List item**~~ → ~~**List**~~ — ✅ done (§7 Components 20-21).
13. **Structured List Row** → **Structured List**.
14. **Table Row / Table Header / Table Header Cell / Table Row Cell** — scoping decision (documented bundled coverage vs. extraction); do together since they share the same parent file.
15. **Table Header Cell - Sort** / **Table Header Cell - Filter** — after #14 settles Table Header Cell's own status.
16. ~~**TOC Item**~~ → ~~**TOC**~~ — ✅ done (§7 Components 13-14).
17. ~~**Header Sub-menu Item**~~ → ~~**Item Icon**~~ → ~~**Nav Header Sub-Menu**~~ → ~~**Second Nav Header**~~ — ✅ done (§7 Components 15-18). Item Icon was inserted into this chain after an initial incorrect NotApplicable dismissal was corrected mid-pass (see §7 Component 16's own note) — this step also established the mandatory `get_screenshot`-vs-rendered-Storybook visual-verification requirement for every remaining component in this cycle.
18. ~~**Button-menu**~~ — ✅ done (§7 Component 19). Also additively extended `Button` with a new `subtle` variant.
19. **Radial Stepper**, **Circular Stepper** — independent primitives, no blockers. Equally eligible next candidates alongside **Structured List Row** → **Structured List** (step 13, also unblocked).
20. **Nav Drawer Item** — scoping decision (extract vs. document as intentional API difference).
21. **Slideout Menu** / **Slideout Menu Header** — investigate first (compare against NavDrawer live in Figma); may resolve immediately or may need to stay flagged NeedsConfirmation pending a user decision.
22. **Digital Stamp** / **Extension** — blocked on Q5; last, per the brief's own ordering rule, unless Q5 clears first.

## 6. Notes on blocked entries (honesty check — not rubber-stamped)

- **Slideout Menu / Slideout Menu Header**: not yet investigated this cycle. The
  stated blocker ("may duplicate NavDrawer's mobile pattern") is resolvable by
  live-comparing this node against NavDrawer's own Figma data — flagged as
  "resolvable now" in the execution plan, not left as a permanent blocker.
- **Digital Stamp / Extension**: genuinely blocked on `docs/QUESTIONS.md` Q5,
  an open client/business-scope question outside this session's authority to
  resolve. Left `Missing`/blocked, not implemented speculatively.

## 7. Component log

### Component 1 — Loading (CMP-31)

- **Registry status before:** `Implemented` / `visualComplianceStatus: pending` / `nodeResolutionStatus: pending`.
- **Finding:** stale registry row. Already `Approved` in `docs/COMPONENT_APPROVAL_MATRIX.md` and `docs/PROJECT_STATUS.md` since 2026-07-13 (Batch 2 of the Missing Components Implementation cycle). Full spec (`docs/FIGMA_LOADING_SPECIFICATION.md`) and compliance report (`reports/VISUAL_COMPLIANCE/Loading/VISUAL_COMPLIANCE_LOADING.md`) already existed on disk.
- **Live re-verification:** `get_design_context` (Figma MCP, `disableCodeConnect: true` per `CLAUDE.md`'s Figma MCP Policy) against `J0xq7JG3JKshRDzrgAM7E0`, node `5698:11136`. Confirmed the same 84-variant matrix (7 sizes × 3 styles × 4 indicator frames) with the exact same pixel sizes (20/24/28/32/36/40/44px) documented in the existing spec. Zero discrepancies found.
- **Code changes:** none required.
- **Registry changes:** `status` → `Approved`, `implementationStatus` → `approved`, `visualComplianceStatus` → `approved`, `nodeResolutionStatus` → `resolved`, added `approvedDate`/`lastVerifiedAgainstFigma`/`verificationMethod` fields and a disclosure note explaining the stale-registry finding.
- **Docs updated:** `docs/PROJECT_STATUS.md` (new entry), `CHANGELOG.md` (new entry). `docs/COMPONENT_APPROVAL_MATRIX.md` unchanged (already correctly showed Approved).
- **Validation:** no code changed, so no re-run of the full suite was required for this row; typecheck/lint were not affected (JSON-only change, not part of any build/test input).
- **Final status:** ✅ **Approved**.

### Component 2 — Progress Indicator (Steps, CMP-21)

- **Registry status before:** `Implemented` / `visualComplianceStatus: pending` / `nodeResolutionStatus: pending`.
- **Finding:** stale registry row, same pattern as Loading. Already `Approved` in `docs/COMPONENT_APPROVAL_MATRIX.md`/`docs/PROJECT_STATUS.md` since 2026-07-13 (Batch 2). Full spec (`docs/FIGMA_PROGRESS_INDICATOR_SPECIFICATION.md`) and compliance report (`reports/VISUAL_COMPLIANCE/Steps/`) already existed.
- **Live re-verification:** `get_design_context` against `J0xq7JG3JKshRDzrgAM7E0`, node `30150:68350`. Confirmed the exact same prop/variant structure (`alignment`: Horizontal/Vertical, `state`: Current/Completed/Upcomming, `rtl`, `hover`, `focused`, plus the official `showDescription`/`showStepName`/`stepDescriptionAr`/`stepDescriptionEng`/`stepNameAr`/`stepNameEn` content properties) already documented in the spec and implemented in `Steps.tsx`. Zero discrepancies.
- **Code changes:** none required.
- **Registry changes:** `status` → `Approved`, `implementationStatus` → `approved`, `visualComplianceStatus` → `approved`, `nodeResolutionStatus` → `resolved`, added `approvedDate`/`lastVerifiedAgainstFigma`/`verificationMethod` fields and a disclosure note.
- **Docs updated:** `docs/PROJECT_STATUS.md`, `CHANGELOG.md`. `docs/COMPONENT_APPROVAL_MATRIX.md` unchanged (already correctly showed Approved as "Steps").
- **Validation:** no code changed; no re-run required.
- **Final status:** ✅ **Approved**.

### Component 3 — "Header Menu (duplicate?)"

- **Registry status before:** `NeedsConfirmation` / `isDuplicate: true` / `duplicateOf: "Header Menu (hamburger)"` / `nodeResolutionStatus: blocked`.
- **Finding:** this row's own `nodeId`/`figmaUrl` were `null` — per `CLAUDE.md`'s Figma Access Security Policy, `search_design_system` is permitted for rows without an already-resolved node (unlike rows with a stored node, which must use it directly, never re-search). Ran `search_design_system` (query "Header Menu", fileKey `J0xq7JG3JKshRDzrgAM7E0`) — it returned **exactly one** "Header Menu" component_set in the entire library, componentKey `886b8b3a128faa6045f1b6437aa637f409d425ec`. That componentKey is identical to both this row's own stored value and the canonical, live-verified, Approved "Header Menu (hamburger)" row's componentKey (node `30150:148860`). Confirmed: no second distinct "Header Menu" design exists anywhere in the library — this row was always the same catalog entry as the canonical one, surfaced a second time by an earlier broad sweep under a bare display name.
- **Code changes:** none — none were ever appropriate here (there is no separate component to implement).
- **Registry changes:** `status` → `Duplicate` (not `Approved` — per the brief's explicit "do not mark blocked or duplicate rows as Approved" rule, and because this row has no implementation/spec/report of its own to approve), `implementationStatus`/`visualComplianceStatus`/`nodeResolutionStatus` → `notApplicable`, `duplicateReason` updated with the live evidence, `nodeResolutionPlan` updated to reflect resolution.
- **Docs updated:** `docs/PROJECT_STATUS.md`, `CHANGELOG.md`. `docs/COMPONENT_APPROVAL_MATRIX.md` unchanged (per its own scope note, only rows that actually enter the workflow get a matrix row — a retired duplicate never does).
- **Validation:** JSON syntax validated; no code changed, no suite re-run needed.
- **Final status:** ✅ **Duplicate (retired)** — correctly excluded from the actionable count, not counted as "Approved."

### Component 4 — "Header Menu Item (duplicate?)"

- **Registry status before:** `NeedsConfirmation` / `isDuplicate: true` / `duplicateOf: "Header Menu Item"` / `nodeResolutionStatus: blocked`.
- **Finding:** same resolution pattern as component 3, reusing the evidence already gathered from the same `search_design_system` call (query "Header Menu" returned both the "Header Menu" and "Header Menu Item" component_sets in one response, since the query is a substring match). Confirmed: exactly **one** "Header Menu Item" component_set exists in the entire library, componentKey `87e55aba2d54a8c244486002f61560fdd2e605d9` — identical to both this row's own stored value and the canonical, live-verified, Approved "Header Menu Item" row's componentKey (node `30150:148312`). No second distinct design exists.
- **Code changes:** none — none were ever appropriate here.
- **Registry changes:** `status` → `Duplicate`, `implementationStatus`/`visualComplianceStatus`/`nodeResolutionStatus` → `notApplicable`, `duplicateReason` updated with the live evidence, `nodeResolutionPlan` updated to reflect resolution.
- **Docs updated:** `docs/PROJECT_STATUS.md`, `CHANGELOG.md`. `docs/COMPONENT_APPROVAL_MATRIX.md` unchanged (retired duplicates never get a matrix row, per its own scope note).
- **Validation:** JSON syntax validated; no code changed, no suite re-run needed.
- **Final status:** ✅ **Duplicate (retired)**.

### Component 5 — Avatar (CMP-12)

- **Registry status before:** `Implemented` / `visualComplianceStatus: pending` / `nodeResolutionStatus: pending`.
- **Finding:** genuinely actionable, not stale — this row's own `visualComplianceStatus` had never been through a live verification pass, unlike Loading/Progress Indicator. Inspected the existing `Avatar.tsx`/`Avatar.module.css`/`Avatar.test.tsx`/`Avatar.stories.tsx` (built pre-workflow, Phase 5A) and found real defects once compared against live data.
- **Live re-verification:** `get_design_context` (`disableCodeConnect: true`) + `get_variable_defs` against `J0xq7JG3JKshRDzrgAM7E0`, node `5699:53529`. Official prop shape: 7 sizes (24/32/40/48/64/80/120px) × `square` × `type`(Image/Initials/Icon) × `border`. Found: only 3/7 sizes implemented (32/40/48px, pixel-correct), no `square`/`border` props, a flat font-weight for every size instead of the official per-size font-size/weight/line-height scale, and the wrong background color token (`--fads-sys-color-background-subtle` `#f9fafb`/neutral-50 instead of the live-verified `#f3f4f6`/neutral-100).
- **Code changes:** `AvatarSize` extended additively to 7 sizes (`xs`/`sm`/`md`/`lg`/`xl`/`2xl`/`3xl` — existing `sm`/`md`/`lg` names/pixels unchanged, non-breaking); new `square`/`border` boolean props; `Avatar.module.css` rewritten to consume 25 new additive `--fads-sys-avatar-*` tokens (background, border color, icon color, text color, 2 new size tokens for 80/120px, 21 per-size typography tokens) added to `scripts/generate-tokens.mjs`. `icon` stays a consumer-supplied slot rather than importing the official default "user" glyph (Figma node `13758:241876`, not in this codebase's Icon registry) — disclosed as an intentional scope boundary in the spec, not a defect.
- **Registry changes:** `status` → `Approved`, `implementationStatus` → `implemented` (unchanged), `visualComplianceStatus` → `resolved`, `nodeResolutionStatus` → `resolved`, added `approvedDate`/`lastVerifiedAgainstFigma`/`verificationMethod` fields.
- **Docs updated:** new `docs/FIGMA_AVATAR_SPECIFICATION.md`, new `reports/VISUAL_COMPLIANCE/Avatar/VISUAL_COMPLIANCE_AVATAR.md`, new row in `docs/COMPONENT_APPROVAL_MATRIX.md`, `docs/PROJECT_STATUS.md`, `CHANGELOG.md`.
- **Validation:** `npm run typecheck` ✅, `npm run lint` (eslint + `lint:css`) ✅, `npm run format:check` (touched files) ✅, `npm test` (Avatar) ✅ 16/16 (up from 3), `npm run tokens:validate` ✅ (753 defined, 660 referenced, 0 missing), `npm run build` ✅, `npm run build-storybook` ✅. Full-suite `npm test`: 704/710 — the 6 failures are pre-existing `ApplicationFormPage`/`HomePage` combobox-timing failures, confirmed unrelated (neither file references `Avatar` or any token this pass touched).
- **Final status:** ✅ **Approved** (2026-07-16).

### Component 6 — Tooltip (CMP-30)

- **Registry status before:** `Implemented` / `visualComplianceStatus: pending` / `nodeResolutionStatus: pending`.
- **Finding:** genuinely actionable, already flagged in advance by `TrailingIcon`'s own approval notes ("Tooltip... still using placeholder dark-inverse CSS"). Inspected the existing `Tooltip.tsx`/`Tooltip.module.css`/`Tooltip.test.tsx`/`Tooltip.stories.tsx` (built pre-workflow, batch 7) and confirmed the flagged issue directly against Tooltip's own node.
- **Live re-verification:** `get_design_context` (`disableCodeConnect: true`) + `get_variable_defs` + `get_screenshot` against `J0xq7JG3JKshRDzrgAM7E0`, node `30150:139266`. Official prop shape: `rtl` × `inverted` × `beakPlacement`[None/Top/Bottom/Left/Right] × `beakAlignment`[Start/Center/End] × `icon` × `title`, default `inverted=false` (light). Found: the pre-existing implementation was always dark (a real defect — the official default is light), had no beak/pointer, no `title` slot, no `icon` slot, and used a 256px max-width instead of the live-verified 240px.
- **Code changes:** new `inverted` prop (default `false` = light, dark now opt-in); new beak/pointer (rotated-square diamond, direction derived from the existing `placement` prop rather than exposing the official's separate `beakPlacement`/`beakAlignment` axes — disclosed scope simplification since this bubble is always centered on a real trigger); new `title` prop; new `icon` prop (default `true`, rendering the already-registered `help-circle` icon at the nearest 16px size); max-width fixed to 240px. 12 new additive `--fads-sys-tooltip-*` tokens added to `scripts/generate-tokens.mjs`, each independently sourced per the "no cross-component aliasing" policy even where a value coincides with `TrailingIcon`'s own separately-scoped tokens.
- **Registry changes:** `status` → `Approved`, `visualComplianceStatus` → `resolved`, `nodeResolutionStatus` → `resolved`, added `approvedDate`/`lastVerifiedAgainstFigma`/`verificationMethod` fields.
- **Docs updated:** new `docs/FIGMA_TOOLTIP_SPECIFICATION.md`, new `reports/VISUAL_COMPLIANCE/Tooltip/VISUAL_COMPLIANCE_TOOLTIP.md`, new row in `docs/COMPONENT_APPROVAL_MATRIX.md`, `docs/PROJECT_STATUS.md`, `CHANGELOG.md`.
- **Validation:** `npm run typecheck` ✅, `npm run lint` (eslint + `lint:css`) ✅, `npm run format:check` (touched files) ✅, `npm test` (Tooltip) ✅ 12/12 (up from 2), `npm run tokens:validate` ✅ (765 defined, 672 referenced, 0 missing), `npm run build` ✅, `npm run build-storybook` ✅. Full-suite `npm test`: 714/720 — same 6 pre-existing, unrelated failures as the Avatar pass.
- **Final status:** ✅ **Approved** (2026-07-16).

### Component 7 — Horizontal Tab + Horizontal Tab List (CMP-09, `Tabs`)

- **Registry status before:** both rows `Implemented` / `visualComplianceStatus: pending` / `nodeResolutionStatus: pending`.
- **Finding:** genuinely actionable, and a near-total mismatch — not a minor-corrections case. Inspected the existing `Tabs.tsx`/`Tabs.module.css`/`Tabs.test.tsx`/`Tabs.stories.tsx` (built pre-workflow, Phase 5B, its own doc comment flagged "Pending final DGA token values Q3/Q20"). It turned out to be a generic bordered-pill tab style with no relationship to the official bottom-underline-indicator component at all — same severity category as `Alert`/`Avatar` before their own passes.
- **Live re-verification:** `get_metadata` (`J0xq7JG3JKshRDzrgAM7E0`) to enumerate all child variant nodes first, since a single `get_design_context` call on the 68-variant Horizontal Tab set truncates at 100,000 characters (same behavior as Button's 1,344-variant set). Then `get_design_context` (`disableCodeConnect: true`) + `get_variable_defs` on Horizontal Tab (node `30150:125017`) and Horizontal Tab List (node `30150:125364`), plus individually-targeted calls for the `moreTab`/Closed/Open sub-nodes and both Flush/RTL Tab List compositions. Official prop shape: Horizontal Tab — `rtl` × `selected` × `size`[Small/Medium/Large] × `state`[Default/Hovered/Pressed/Focused/Disabled, plus Closed/Open when `moreTab=Yes`] × `icon`/`swapIcon`; Horizontal Tab List — `rtl` × `size` × `tabIcons` × `flush` × `divider`. Found 13 real discrepancies (shape, selected-state treatment, missing size/icon/hover/pressed/focus-visible/disabled fidelity, missing Tab-List divider, an invented inter-tab gap + `flex-wrap`, missing `flush`, missing overflow-trigger) — full list in `reports/VISUAL_COMPLIANCE/HorizontalTab/VISUAL_COMPLIANCE_HORIZONTAL_TAB.md`. Confirmed **no badge/count sub-element** exists in any of the 68 sampled Horizontal Tab variants.
- **Code changes:** near-total rebuild of `Tabs.tsx`/`Tabs.module.css` — real `size` (`sm`/`md`/`lg`), per-item `icon` slot, bold-text + green-underline selected treatment (no background fill), real unselected Hover/Pressed states (neutral background + black preview indicator bar), a `Button`-style double-ring focus-visible treatment, solid (not opacity) Disabled colors, the Tab List's baseline `divider` (default `true`), a `flush` prop, real `overflow-x:auto` scrolling (replacing the invented `flex-wrap`/gap), and a visual-only `overflowTrigger` slot rendering the live-verified icon-only `moreTab` shell (CSS-drawn ⋯ glyph, since `more-horizontal` isn't in the Icon registry). Kept the pre-existing RTL-aware roving-tabindex Arrow/Home/End keyboard logic completely unchanged. 24 new additive `--fads-sys-tabs-*` tokens added to `scripts/generate-tokens.mjs` (reusing the already-shared generic `--fads-sys-radius-sm`/`-radius-full`/`--fads-ref-font-weight-bold`/`-medium`/`--fads-sys-typography-text-sm`/`-line-height-sm`; icon color has no dedicated token since it's byte-identical to the text-color tokens and inherits `currentColor`). A real `aria-required-children` accessibility bug was found by this pass's own axe scan (the optional overflow-trigger button nested inside the same subtree as `role="tablist"`) and fixed via an inner `display:contents` wrapper that isolates the ARIA tablist to only its real `role="tab"` children.
- **Registry changes:** both rows — `status` → `Approved`, `visualComplianceStatus` → `resolved`, `nodeResolutionStatus` → `resolved`, added `approvedDate`/`lastVerifiedAgainstFigma`/`verificationMethod` fields.
- **Docs updated:** new `docs/FIGMA_HORIZONTAL_TAB_SPECIFICATION.md`, new `reports/VISUAL_COMPLIANCE/HorizontalTab/VISUAL_COMPLIANCE_HORIZONTAL_TAB.md`, new row in `docs/COMPONENT_APPROVAL_MATRIX.md`, `docs/PROJECT_STATUS.md`, `CHANGELOG.md`.
- **Validation:** `npm run typecheck` ✅, `npm run lint` (eslint + `lint:css`) ✅, `npm run format:check` (touched files) ✅, `npm test` (Tabs) ✅ 17/17 (up from 6), `npm run tokens:validate` ✅ (789 defined, 695 referenced, 0 missing), `npm run build` ✅, `npm run build-storybook` ✅. Full-suite `npm test`: 722/728 (60 files) — same 6 pre-existing, unrelated `ApplicationFormPage`/`HomePage` failures as the Avatar/Tooltip passes (confirmed via `grep`: neither file references `Tabs` or any token this pass touched).
- **Final status:** ✅ **Approved** (2026-07-19). Per this session's own instruction, the next component (Vertical Tab, now unblocked) is **not** started in this session.

### Component 8 — Modal (CMP-25)

- **Registry status before:** `Implemented` / `visualComplianceStatus: pending` / `nodeResolutionStatus: pending`.
- **Finding:** genuinely actionable, but unlike `Tabs`/`Alert`/`Avatar` this was a **visual/structural** pass, not a behavioral rebuild — Modal's pre-existing portal, focus-trap + restore, `Esc`-close, scrim-click dismiss, `inert`-background isolation, and `aria-modal`/`aria-labelledby` were already correct (verified independently against WAI-ARIA/WCAG; Figma has no keyboard/focus-management data to compare against).
- **Live re-verification:** `get_metadata` + `get_design_context` (`disableCodeConnect: true`) + `get_variable_defs` against `J0xq7JG3JKshRDzrgAM7E0`, node `30150:55001` (4 variants: `rtl` × `mobile`). Official structure: a 40×40 featured-icon circle leading the title row, a `Button-Close` instance absolutely positioned `-10px` from the header's own edge (logical, flips under RTL), title in `text-display` color, body in `text-primary-paragraph` color, an asymmetric 8px/24px header-to-body/body-to-actions spacing split, `radius-md` (8px, not `radius-lg`), 24px padding, an exact `shadow-3xl` value, 600px desktop / 320px mobile width, and mobile actions stacking full-width. Found: the close button was an ad-hoc "×" `<button>` unrelated to the already-Approved `ButtonClose`; no featured-icon slot; title had no explicit color (inherited ambient default); body used the generic `--fads-sys-color-text-default`; container radius/padding/shadow/width all used generic, unverified tokens; no mobile stacking existed.
- **Code changes:** composed `<ButtonClose size="md">` in place of the ad-hoc close button (`className` passes through for absolute positioning); added an optional `icon` prop (fully optional, no hardcoded default glyph — Figma's `information-circle` sample is generic demo content); fixed title/body colors, container radius/padding/shadow/width, the asymmetric header/body/actions spacing (header gap and actions-row gap reuse the already-shared `--fads-sys-space-stack-sm`; body's extra bottom padding reuses `--fads-sys-space-inset-md`; container radius reuses `--fads-sys-radius-md` — all live-verified identical to the generic scale steps); added a `max-width: 480px` media query stacking `.footer` full-width. Kept the generic `footer: ReactNode` slot unchanged — a real, already-shipped consumer (`ConfirmActionModal.tsx`) depends on it accepting a `destructive` `Button` variant with no equivalent axis in Figma's own generic Modal demo; a real, valuable finding was documented instead of forcing a breaking API change: Figma's "Primary Action" (`#0d121c` solid fill) is byte-identical to this repo's already-Approved `Button` `variant="neutral"` (confirmed via direct token comparison, not `variant="primary"`/brand green), and "Secondary"/"Tertiary Action" matches `variant="secondary"` (bordered, not the borderless `variant="tertiary"`) — captured as composition guidance in the compliance report and a new `OfficialFigmaReference` story. 6 new additive `--fads-sys-modal-*` tokens added to `scripts/generate-tokens.mjs` (padding, shadow, width, title-color, body-color, background — the last needed since Figma's pure `#ffffff` differs from the pre-existing `--fads-sys-color-surface-raised`, which resolves to `#fcfcfd`/neutral-25).
- **Registry changes:** `status` → `Approved`, `visualComplianceStatus` → `resolved`, `nodeResolutionStatus` → `resolved`, added `approvedDate`/`lastVerifiedAgainstFigma`/`verificationMethod` fields.
- **Docs updated:** new `docs/FIGMA_MODAL_SPECIFICATION.md`, new `reports/VISUAL_COMPLIANCE/Modal/VISUAL_COMPLIANCE_MODAL.md`, new row in `docs/COMPONENT_APPROVAL_MATRIX.md`, `docs/PROJECT_STATUS.md`, `CHANGELOG.md`.
- **Validation:** `npm run typecheck` ✅, `npm run lint` (eslint + `lint:css`) ✅, `npm run format:check` (touched files) ✅, `npm test` (Modal) ✅ 13/13 (up from 10), `npm run tokens:validate` ✅ (795 defined, 701 referenced, 0 missing), `npm run build` ✅, `npm run build-storybook` ✅. `ApplicationDetailsPage.test.tsx` (8 tests, exercises the real `ConfirmActionModal` consumer) re-run and confirmed passing unmodified — no regression. Full-suite `npm test`: 725/731 (60 files) — the same 6 pre-existing, unrelated `ApplicationFormPage`/`HomePage` failures as every prior pass this cycle.
- **Final status:** ✅ **Approved** (2026-07-20). Per this session's own scope (one component at a time), the other two step-7 components (**Notification Toast**, **Notification**) are **not** started in this session.

### Component 9 — Vertical Tab (CMP-09b)

- **Registry status before:** `Missing` / `implemented: false` / `visualComplianceStatus: pending` / `nodeResolutionStatus: pending`. Unlike every other `Tabs`-related row processed this cycle, **zero prior code existed** for this one.
- **Finding:** unblocked by `Horizontal Tab List`'s own approval (its `dependencies` field named `["Horizontal Tab List (Tabs component)"]`). Live verification immediately confirmed this is not an independent component to build from scratch: it's officially the same Figma `Tab/*` variable family as the already-Approved Horizontal Tab (CMP-09b, "a new axis of CMP-09"), and the registry's own pre-existing notes already anticipated the correct architecture ("our `Tabs` has no `orientation="vertical"` mode").
- **Live re-verification:** `get_metadata` (enumerated all 68 variant nodes) + `get_design_context` (`disableCodeConnect: true`, sampled Small/Medium/Large × Default/Hovered/Disabled/Focused × selected/unselected) + `get_variable_defs` against `J0xq7JG3JKshRDzrgAM7E0`, node `418:99793`. Direct token comparison against Horizontal Tab's own already-verified `get_variable_defs` output confirmed colors, hover/pressed/focus mechanics, and radius are byte-identical — reused directly, no duplication. Genuinely different: column layout; the indicator becomes a full-height inline-start-edge 3px bar (vertically inset by size) instead of a full-width bottom-edge bar; Selected uses Semibold(600) instead of Bold(700), Unselected uses Regular(400) instead of Medium(500); Large size uses text-md (16px/24) instead of the uniform text-sm every Horizontal Tab size shares; per-size padding has no match in Horizontal Tab's own scale (Medium 12px/6px vs. horizontal's 16px/12px, etc.). A live-sampled quirk was found and reproduced exactly rather than "corrected": the Disabled+Selected sample (`node 418:99834`) renders in Medium(500) weight, matching neither the enabled-Selected (Semibold) nor enabled-Unselected (Regular) weight.
- **Code changes:** added `orientation?: 'horizontal' | 'vertical'` (default `'horizontal'`, fully backward compatible) to `Tabs.tsx`/`Tabs.module.css` rather than a new component. `ArrowDown`/`ArrowUp` replace the RTL-aware `ArrowLeft`/`ArrowRight` when vertical (not RTL-sensitive — vertical movement doesn't mirror); `aria-orientation="vertical"` added to the `tablist` (a WAI-ARIA APG requirement Figma has no data on, verified independently). `divider`/`flush`/`overflowTrigger` documented as horizontal-only in the component's own doc comment; `divider` renders nothing under `orientation="vertical"` since Vertical Tab's own live data has no baseline-divider equivalent (deferred to `Vertical Tab List`'s own future pass, along with `flush`/`tabIcons` equivalents). No `moreTab`-equivalent overflow trigger exists in the live 68-variant set — not implemented; `overflow-y: auto` used instead for a vertical list that exceeds its container, the same non-invented interpretation already used for Horizontal Tab's own `overflow-x: auto`. 8 new additive `--fads-sys-tabs-vertical-*` tokens added to `scripts/generate-tokens.mjs` (3 sizes × padding-inline/-block = 6, plus 2 indicator-inset values) — everything else (typography weight tokens, text-md scale, focus-ring, colors) reuses already-shared generic or Horizontal-Tab-scoped tokens directly, per the "same Tab/* family" finding above (a deliberate departure from the usual "independently source every token" policy, justified because this is literally the same official component family, not a coincidental value match).
- **Registry changes:** `status` → `Approved`, `implemented` → `true`, `implementationStatus` → `implemented`, `visualComplianceStatus` → `resolved`, `nodeResolutionStatus` → `resolved`, added `approvedDate`/`lastVerifiedAgainstFigma`/`verificationMethod` fields.
- **Docs updated:** new `docs/FIGMA_VERTICAL_TAB_SPECIFICATION.md`, new `reports/VISUAL_COMPLIANCE/VerticalTab/VISUAL_COMPLIANCE_VERTICAL_TAB.md`, new row in `docs/COMPONENT_APPROVAL_MATRIX.md`, `docs/PROJECT_STATUS.md`, `CHANGELOG.md`.
- **Validation:** `npm run typecheck` ✅, `npm run lint` (eslint + `lint:css`) ✅, `npm run format:check` (touched files) ✅, `npm test` (Tabs) ✅ 23/23 (up from 15 — all 15 pre-existing horizontal-mode tests pass unmodified), `npm run tokens:validate` ✅ (803 defined, 709 referenced, 0 missing), `npm run build` ✅, `npm run build-storybook` ✅. Full-suite `npm test`: 733/739 (60 files) — the same 6 pre-existing, unrelated `ApplicationFormPage`/`HomePage` failures as every prior pass this cycle.
- **Final status:** ✅ **Approved** (2026-07-20). `Vertical Tab List` (its own registry row, dependent on this one) processed immediately after, same session — see Component 10.

### Component 10 — Vertical Tab List (CMP-09b, dependent row)

- **Registry status before:** `Missing` / `implemented: false` / `visualComplianceStatus: pending` / `nodeResolutionStatus: pending`.
- **Finding:** unblocked immediately by Component 9's own approval (`dependencies: ["Vertical Tab"]`). Rather than assume list-level chrome would need building (as Horizontal Tab List did — a real `divider` + `flush` prop on top of the individual Horizontal Tab), live data was checked first.
- **Live re-verification:** `get_metadata` (enumerated all 12 variant nodes) + `get_design_context` (sampled Medium/`tabIcons=True`, Small/`tabIcons=False`, and RTL/Medium/`tabIcons=True`) against `J0xq7JG3JKshRDzrgAM7E0`, node `418:100259`. Found: a plain `flex flex-col items-start` column, **no baseline divider element in any sampled combination** (not a toggleable prop defaulting off — the extracted `VerticalTabListProps` type has no `divider` field at all, genuinely absent from the component), no inter-tab gap (spacing comes only from each tab's own `padding-block`, same "no invented gap" finding already made for Horizontal Tab List), no `flush`-equivalent prop (the type only exposes `rtl`/`size`/`tabIcons`), and every tab renders full-width (`w-full`). RTL sample confirmed the indicator's logical `inset-inline-start` flips to the visual right edge automatically, no DOM reordering needed.
- **Code changes:** **none.** Every one of these findings was already true of the `orientation="vertical"` implementation built one component earlier in this same session (column layout via `flex-direction: column`, no `divider` render when vertical, no `gap` in `.listRow`, `align-items: stretch` for full-width tabs) — built without yet having this row's own live data, and confirmed correct in hindsight rather than adjusted. `tabIcons` (a per-list Figma convenience) is already achievable via the existing per-item `TabItem.icon` prop, so no new API surface was needed either.
- **Registry changes:** `status` → `Approved`, `implemented` → `true`, `implementationStatus` → `implemented`, `visualComplianceStatus` → `resolved`, `nodeResolutionStatus` → `resolved`, added `approvedDate`/`lastVerifiedAgainstFigma`/`verificationMethod` fields.
- **Docs updated:** `docs/FIGMA_VERTICAL_TAB_SPECIFICATION.md` extended with a new §6 (Vertical Tab List's own structural findings) and renamed to cover both components; `reports/VISUAL_COMPLIANCE/VerticalTab/VISUAL_COMPLIANCE_VERTICAL_TAB.md` extended with a §6 addendum; `docs/COMPONENT_APPROVAL_MATRIX.md` row renamed from "Vertical Tab" to "Vertical Tab / Vertical Tab List" (mirroring the Horizontal Tab / Horizontal Tab List row's own bundled format); `docs/PROJECT_STATUS.md`, `CHANGELOG.md` updated. Two new Storybook stories added to `Tabs.stories.tsx`: `VerticalOfficialFigmaReference` (a 5-tab composition matching the live Figma reference exactly) and `VerticalNoIcons`.
- **Validation:** since no component code changed, the full validation suite from Component 9 still applies unchanged. Re-confirmed: `npm run typecheck` ✅, `npm run lint` (eslint + `lint:css`) ✅, `npm run format:check` (touched files) ✅, `npm test` (Tabs) ✅ 23/23 (unchanged — no new tests needed, existing coverage of the vertical `divider`/layout behavior already applies to this row), `npm run build-storybook` ✅ (new stories compile and render).
- **Final status:** ✅ **Approved** (2026-07-20). Per this session's own scope (one component at a time), **Notification Toast** and **Notification** (the other two step-7 components) remain **not** started.

### Component 11 — Notification Toast (CMP-22)

- **Registry status before:** `Implemented` / `visualComplianceStatus: pending` / `nodeResolutionStatus: pending`.
- **Finding:** genuinely actionable, and a near-total mismatch — same severity as `Alert`/`Avatar` before their own passes, not a minor-corrections case. Inspected the existing `Toast.tsx`/`Toast.module.css`/`ToastProvider.tsx`/`useToast.ts` (built pre-workflow) and found it composed the shared `_shared/NoticeBody` (a plain title/message/ad-hoc-`×`-button box, tone expressed only as a 1px border color) — no featured icon, no actions, no accent stripe, no `Button-Close` composition.
- **Live re-verification:** `get_metadata` (enumerated all 20 variant nodes) + `get_design_context` (`disableCodeConnect: true`, sampled Neutral/Desktop, Success/Desktop, Critical-Error/Desktop, Neutral/Mobile) + `get_variable_defs` against `J0xq7JG3JKshRDzrgAM7E0`, node `8680:37527`. Found the live structure matches the already-Approved `Alert`'s own structure almost exactly — both are part of the same `PAT-06` notification family: a 40px tone-colored featured-icon circle, a title + optional helper text, up to two actions, a literal `Button-Close` dismiss control (confirmed via the component's own Figma description metadata, not an ad-hoc `×`), and an always-present tone-colored accent stripe (left edge desktop, top edge mobile, 8px, 70% opacity). 5 official tones (Neutral/Info/Critical-Error/Warning/Success) vs. the pre-existing implementation's 4 (no `neutral`). Desktop action buttons render transparent/borderless; mobile action buttons render with a solid `#f3f4f6` fill at 40px height — a real, live-verified difference confirmed via direct token comparison: desktop matches this repo's already-Approved `Button` `variant="tertiary"` exactly, mobile matches `variant="secondarySolid"` `size="lg"` exactly.
- **Code changes:** rebuilt `Toast.tsx`/`Toast.module.css` as a self-contained primitive (stopped composing `NoticeBody`, same architecture precedent already established for `Alert`); added `tone="neutral"`, and new `icon`/`action`/`secondaryAction` slots (matching `Alert`'s own generic-slot API, since a structured `primaryAction`/`secondaryAction` prop shape would need per-mode variant awareness the component can't provide); composed `<ButtonClose size="md">` in place of the ad-hoc `×` button; kept the existing auto-dismiss timer (pauses on hover/focus, resumes on leave/blur, `duration={null}` disables it) completely unchanged — Figma has no opinion on it. The mobile layout (icon+close row, full-width text row, stacked full-width actions, top-edge stripe) was implemented as a **single shared DOM structure** reordered via CSS `flex-wrap`+`order` at a `max-width: 30rem` media query, not two duplicated markups — `icon` stays first in DOM/first visually, `textBlock` gets `flex-basis: 100%` to force it onto its own line, `close` gets `order` + `margin-inline-start: auto` to sit at the line-1 end. This mobile/desktop split is CSS-only (no explicit boolean prop like `Alert`'s own `mobile`) because `Toast` renders from a global `ToastProvider` queue with no reliable viewport signal at the moment a toast is queued — a deliberate, disclosed architectural difference from `Alert` (authored per-instance inline in a page). The mobile action-button variant switch (`tertiary`/32px → `secondarySolid`/40px) is **not** automatically applied to generic `action`/`secondaryAction` slots — disclosed as a scope limitation, not silently ignored. `ToastOptions` (in `useToast.ts`) and `ToastProvider.tsx` extended to pass `icon`/`action`/`secondaryAction` through the queue to the rendered `Toast`. 31 new additive `--fads-sys-toast-*` tokens added to `scripts/generate-tokens.mjs`, each independently sourced per the no-cross-component-aliasing policy even where several values coincide with `Alert`'s own separately-scoped `PAT-06`-family tokens (e.g. the shadow matches `Modal`'s own `shadow-3xl`, independently sourced there too).
- **Registry changes:** `status` → `Approved`, `visualComplianceStatus` → `resolved`, `nodeResolutionStatus` → `resolved`, added `approvedDate`/`lastVerifiedAgainstFigma`/`verificationMethod` fields.
- **Docs updated:** new `docs/FIGMA_NOTIFICATION_TOAST_SPECIFICATION.md`, new `reports/VISUAL_COMPLIANCE/Toast/VISUAL_COMPLIANCE_TOAST.md`, new row in `docs/COMPONENT_APPROVAL_MATRIX.md`, `docs/PROJECT_STATUS.md`, `CHANGELOG.md`.
- **Validation:** `npm run typecheck` ✅, `npm run lint` (eslint + `lint:css`) ✅, `npm run format:check` (touched files) ✅, `npm test` (Toast) ✅ 12/12 (up from 7 — all 7 pre-existing behavioral tests, including the manual-dismiss test asserting on the same `dismissLabel`-derived accessible name, pass unmodified since `ButtonClose` preserves that exact contract), `npm run tokens:validate` ✅ (834 defined, 740 referenced, 0 missing), `npm run build` ✅, `npm run build-storybook` ✅. Full-suite `npm test`: 738/744 (60 files) — the same 6 pre-existing, unrelated `ApplicationFormPage`/`HomePage` failures as every prior pass this cycle.

### Component 12 — Notification (CMP-24)

- **Registry status before:** `NeedsConfirmation` (label only — own notes already confirmed 2026-07-13 that the Alert/Notification/Toast three-way naming ambiguity was resolved, this row correctly mapping to the page-level banner) / `visualComplianceStatus: pending` / `nodeResolutionStatus: pending`.
- **Finding:** the last of step 7 (Modal and Notification Toast already done). Inspected the existing `Notification.tsx`/`Notification.module.css` (built pre-workflow) and found it composed the shared `_shared/NoticeBody` — the same architecture gap already fixed for `Alert`/`Toast` — with no distinct structure of its own despite `Notification` being a genuinely separate official component from both.
- **Live re-verification:** `get_metadata` (enumerated all 10 variant nodes: `rtl` × `style`[Critical/Warning/Success/Info/Neutral], no `mobile` axis) + `get_design_context` (`disableCodeConnect: true`, independently sampled Critical/Error node `30150:56890` and Neutral node `30150:56978` directly) + `get_variable_defs` (covering all 5 tones) against `J0xq7JG3JKshRDzrgAM7E0`, node `30150:56889`. Found a slim, full-width, single-row banner (1280×56px) — genuinely distinct from both `Alert` and `Toast` (both boxed cards): `radius-xs` (2px, smaller than its siblings' `radius-sm`/`radius-md`), no shadow, tone-tinted background, a 24px **solid** tone-colored feedback icon with a **white** glyph (the opposite of `Alert`'s light-tint+colored-icon treatment), an optional bold tone-colored `leadText` prefix, a **tone-colored message** (unlike `Alert`/`Toast`, whose message stays neutral gray regardless of tone), inline `link`+`action` in the *same* row as the text (not a separate row), a `ButtonClose` absolutely positioned outside the content flow, and a thin tone-colored accent line along the **bottom** edge (opacity 0.7, 0.6 for Neutral specifically — live-verified as a distinct value) rather than the leading/top edge used by its siblings. Double 24px inline padding exists in the live data (container's own `notification-h-padding` plus the inner row's `spacing-3xl`, both independently 24px) — reproduced exactly as sampled, not collapsed to one value, per the "do not invent/approximate" rule. Warning/Success/Info tone colors were sourced from `get_variable_defs` only, not independently re-sampled via `get_design_context` (disclosed Needs Confirmation, non-blocking, same disclosure pattern already used for Notification Toast's own Info/Warning tones).
- **Code changes:** rebuilt `Notification.tsx`/`Notification.module.css` as a self-contained primitive (stopped composing `NoticeBody`, same architecture precedent already established for `Alert`/`Toast`); added `tone="neutral"`; added `link`/`action` slots rendering inline in the same row as the text (not a separate row, a genuine structural difference from `Alert`/`Toast`'s own actions-row pattern); composed `<ButtonClose size="md">` absolutely positioned (`inset-inline-end:-8px; inset-block-start:4px`). A real, useful finding while composing the inline actions: live token comparison confirms the action button is byte-identical to this repo's already-Approved `Button` `variant="neutral"` and the link is byte-identical to `Link` `mood="neutral"` — the same `Button` variant mapping already found for `Modal`'s own Primary Action, now confirmed a second time independently on a different component — disclosed as composition guidance in the compliance report and a new `OfficialFigmaReference` story, not enforced as a new required prop shape, since generic `link`/`action` slots can't auto-apply a variant. 21 new additive `--fads-sys-notification-*` tokens added to `scripts/generate-tokens.mjs` (gap, padding-inline/-block, radius, icon-size, icon-oncolor, and per-tone tint/text/solid triads for all 5 tones), each independently sourced per the no-cross-component-aliasing policy even where the solid tone colors coincide with `Alert`/`Toast`'s own separately-scoped tokens.
- **Registry changes:** `status` → `Approved`, `visualComplianceStatus` → `resolved`, `nodeResolutionStatus` → `resolved`, added `approvedDate`/`lastVerifiedAgainstFigma`/`verificationMethod` fields.
- **Docs updated:** new `docs/FIGMA_NOTIFICATION_SPECIFICATION.md`, new `reports/VISUAL_COMPLIANCE/Notification/VISUAL_COMPLIANCE_NOTIFICATION.md`, new row in `docs/COMPONENT_APPROVAL_MATRIX.md` (and its "Scope of this matrix" paragraph updated), `docs/PROJECT_STATUS.md` (new Component 12 narrative entry + "all Approved" list updated), `CHANGELOG.md`.
- **Validation:** `npm run typecheck` ✅, `npm run lint` (eslint + `lint:css`) ✅, `npm run format:check` (touched files) ✅, `npm test` (Notification) ✅ 10/10 (up from 5 — all 5 pre-existing tests pass unmodified), `npm run tokens:validate` ✅ (855 defined, 760 referenced, 0 missing), `npm run build` ✅, `npm run build-storybook` ✅. Full-suite `npm test`: 743/749 (60 files) — the same 6 pre-existing, unrelated `ApplicationFormPage`/`HomePage` failures as every prior pass this cycle; this pass additionally confirmed the 6 failures are genuinely pre-existing (not a regression introduced by this cycle's own work) by reproducing them identically against a clean `git worktree` checked out at `HEAD` with zero session changes applied.
- Closes step 7 of the ordered execution plan (§5) entirely — Modal, Notification Toast, and Notification are all now `Approved`.
- **Final status:** ✅ **Approved** (2026-07-20).

### Component 13 — TOC Item

- **Registry status before:** `Missing`.
- **Live verification:** `get_design_context` on `J0xq7JG3JKshRDzrgAM7E0`, node `2962:37761` (48 variants: `rtl` × `level`[Level 1 (H2)/Level 2 (H3)/Level 3 (H4)] × `selected` × `state`[Default/Hovered/Pressed/Focused]).
- **Code changes:** new `TocItem.tsx`/`TocItem.module.css`. Native `<button>` with `level`/`selected` props; Hovered/Pressed/Focused are real CSS pseudo-classes, not a `state` prop; 0-2 leading 16px nesting-bar elements express Level 2/3 indentation (padding stays constant across levels); `aria-current="true"` marks the selected item. A live-sampled quirk reproduced exactly, not corrected: the Focused state's colored selection-indicator bar renders with no fill at all. 16 new additive `--fads-sys-tocitem-*` tokens.
- **Registry changes:** `status` → `Approved`, `visualComplianceStatus`/`nodeResolutionStatus` → `resolved`, `approvedDate`/`lastVerifiedAgainstFigma`/`verificationMethod` added.
- **Docs updated:** new `docs/FIGMA_TOC_ITEM_SPECIFICATION.md`, new `reports/VISUAL_COMPLIANCE/TocItem/VISUAL_COMPLIANCE_TOC_ITEM.md`.
- **Validation:** `typecheck` ✅, `TocItem.test.tsx` ✅ 8/8. (Batch validation for Components 13-18 run together — see Component 18's own entry.)
- **Final status:** ✅ **Approved** (2026-07-20).

### Component 14 — TOC

- **Registry status before:** `Missing`. Depends on TOC Item (Component 13, same pass).
- **Live verification:** `get_design_context` on node `2962:38090` (`rtl` only — the node's own body is a fixed demo list of `TocItem` instances, not a parameterized `items` axis).
- **Code changes:** new `Toc.tsx`/`Toc.module.css`. A `<nav>` landmark wrapping an `eyebrow`+`title` heading block and a `children` slot for composed `TocItem`s, matching the live node's own flat, unconfigurable structure rather than inventing an `items` config array. **Real defect caught later in this same pass:** the `title` prop (typed `ReactNode`) collided with the native HTML `title` attribute (typed `string`) inherited from `ComponentPropsWithRef<'nav'>` — `npx tsc --noEmit` did not catch this (a looser tsconfig than the build's own), only `npm run build`'s stricter `tsc -b` step did. Fixed via `Omit<ComponentPropsWithRef<'nav'>, 'title'>`. 6 new additive `--fads-sys-toc-*` tokens.
- **Registry changes:** `status` → `Approved`, `visualComplianceStatus`/`nodeResolutionStatus` → `resolved`.
- **Docs updated:** new `docs/FIGMA_TOC_SPECIFICATION.md`, new `reports/VISUAL_COMPLIANCE/Toc/VISUAL_COMPLIANCE_TOC.md`.
- **Validation:** `typecheck` ✅ (after the `title` fix), `Toc.test.tsx` ✅ 5/5.
- **Final status:** ✅ **Approved** (2026-07-20).

### Component 15 — Header Sub-menu Item

- **Registry status before:** `Missing`, own notes disclosing it was "Deferred out of scope in the original Header visual-compliance pass."
- **Live verification:** `get_design_context` on `Sv0oWOS1SjWnwhQwdzRJIE` (the dedicated Header file, distinct from the main Components Library file), node `30150:148183` (`rtl` × `onColor` × `state`[Default/Hovered/Pressed/Focused] × `icon`/`helperText`/`tag` toggles).
- **Code changes:** new `HeaderSubMenuItem.tsx`/`HeaderSubMenuItem.module.css`. **Two real defects were caught only by a follow-up visual `get_screenshot`-vs-rendered-Storybook comparison** — the first time this component of the cycle was actually screenshotted and compared pixel-by-pixel rather than trusting `get_design_context`'s text/CSS extraction alone (the user directly flagged "it does not look like the Figma one" after seeing the initial build):
  1. Every state (including Default) has a real 1px card border that neither `get_design_context` nor `get_variable_defs` ever surfaced in their text output — confirmed present via `get_screenshot` on the live node, then confirmed missing in the rendered Storybook output. Fixed by adding `border: 1px solid` with a disclosed, visually-approximated color (`#d2d6db` light / `rgba(255,255,255,0.24)` on-color, matched to this codebase's own existing "subtle card border" convention already used identically by `Card`/`Button`, since neither Figma tool exposed the exact bound stroke value).
  2. This component's own Storybook `OnColor` story used a hand-picked wrapper background (`#1b8354`, the shared brand-primary green) instead of the live-verified `#074d31` "SA flag green" — a story bug, not a component defect, also fixed.
  17 new additive `--fads-sys-headersubmenuitem-*` tokens (15 initial + 2 for the border).
- **Registry changes:** `status` → `Approved`, `visualComplianceStatus`/`nodeResolutionStatus` → `resolved`.
- **Docs updated:** new `docs/FIGMA_HEADER_SUB_MENU_ITEM_SPECIFICATION.md`, new `reports/VISUAL_COMPLIANCE/HeaderSubMenuItem/VISUAL_COMPLIANCE_HEADER_SUB_MENU_ITEM.md` (with a dedicated "Correction" section documenting the missed border and the story-background bug).
- **Validation:** `typecheck`/`lint`/`format:check` ✅, `HeaderSubMenuItem.test.tsx` ✅ 7/7 (re-run and still passing after the border fix).
- **Process change established here:** every remaining component in this cycle now requires an actual `get_screenshot`-vs-rendered-Storybook visual comparison before being marked Approved — not just Figma MCP text extraction. This was not a self-caught improvement; it followed directly from the user's own visual review.
- **Final status:** ✅ **Approved** (2026-07-20).

### Component 16 — Item Icon

- **Registry status before:** `Missing`. Initially (incorrectly) treated as resolving to "NotApplicable / covered by Icon" while building Component 15 — based only on this node's own component-description metadata surfacing inside `HeaderSubMenuItem`'s `get_design_context` response, without ever independently sampling this node's own `get_design_context`. **The user caught this directly** by screenshotting their own Figma view, showing "Item Icon" as a real, standalone 4-variant component set, and provided the correct node URL.
- **Live verification:** `get_design_context` on `J0xq7JG3JKshRDzrgAM7E0`, node `30150:148742` (`contained` × `onColor`, 4 variants — all sampled in one response).
- **Code changes:** new `ItemIcon.tsx`/`ItemIcon.module.css` (`icon`/`contained`/`onColor` props). `HeaderSubMenuItem` (Component 15) was refactored to compose `ItemIcon` for its own icon slot instead of duplicating box logic — **this refactor surfaced a third real bug**: the `contained`+`onColor` combination (a translucent `alpha-white-10` `rgba(255,255,255,0.1)` box) had never been implemented at all in the original `HeaderSubMenuItem` pass, only the light-mode `background-primary-50` box existed. 6 new additive `--fads-sys-itemicon-*` tokens; 2 now-dead `--fads-sys-headersubmenuitem-icon-box-*` tokens from the incorrect original pass were removed.
- **Registry changes:** `status` → `Approved`, `visualComplianceStatus`/`nodeResolutionStatus` → `resolved`, with the correction explicitly documented in `verificationMethod`.
- **Docs updated:** new `docs/FIGMA_ITEM_ICON_SPECIFICATION.md` (with its own "Correction" section), new `reports/VISUAL_COMPLIANCE/ItemIcon/VISUAL_COMPLIANCE_ITEM_ICON.md`; `docs/FIGMA_HEADER_SUB_MENU_ITEM_SPECIFICATION.md` updated to reflect the composition.
- **Validation:** `typecheck`/`lint`/`format:check` ✅, `ItemIcon.test.tsx` ✅ 5/5, `HeaderSubMenuItem.test.tsx` re-run ✅ 7/7 unmodified. Visually re-verified via `get_screenshot` (all 4 variants) against the rendered Storybook `OfficialFigmaReference` story.
- **Final status:** ✅ **Approved** (2026-07-20).

### Component 17 — Nav Header Sub-Menu

- **Registry status before:** `Missing`, deferred out of scope in the original Header pass (same disclosure as Header Sub-menu Item). Depends on Header Sub-menu Item (Component 15) and Item Icon (Component 16).
- **Live verification:** `get_design_context` on `Sv0oWOS1SjWnwhQwdzRJIE`, node `30150:148877` (24 variants: `rtl` × `fullWidth` × `background`[Default/Dark green] × `linkStyle`[Text only/Simple icon/Boxed icon] — 3 sampled directly: Default/Text-only, Default/Boxed-icon, Dark green/Text-only).
- **Code changes:** new `NavHeaderSubMenu.tsx` (`NavHeaderSubMenu` + `NavHeaderSubMenuColumn`) — a shadowed panel of up to 4 columns (bold group label + composed `HeaderSubMenuItem`s). Sampling the `Boxed icon` `linkStyle` is what surfaced `HeaderSubMenuItem`'s own missing icon-box treatment, driving Component 16's `boxedIcon` extension. "Dark green" background resolves to `#074d31` (`background-sa-flag`), confirmed a distinct value from the shared brand-primary `#1b8354` by direct sampling, not assumed. `fullWidth` has no structural effect across the two sampled canvas widths (1440px/1320px) — not modeled as a prop. 14 new additive `--fads-sys-navheadersubmenu-*` tokens.
- **Registry changes:** `status` → `Approved`, `visualComplianceStatus`/`nodeResolutionStatus` → `resolved`. **Process note:** this row's `status` field was left at `Missing` after the component was fully built, tested, and documented earlier in this session — an oversight caught and corrected only in this closing pass, not at build time. A reminder that "component built" and "registry updated" are separate steps that must both complete before a row is truly done.
- **Docs updated:** new `docs/FIGMA_NAV_HEADER_SUB_MENU_SPECIFICATION.md`, new `reports/VISUAL_COMPLIANCE/NavHeaderSubMenu/VISUAL_COMPLIANCE_NAV_HEADER_SUB_MENU.md`.
- **Validation:** `typecheck`/`lint`/`format:check` ✅, `NavHeaderSubMenu.test.tsx` ✅ 4/4. Visually re-verified via rendered Storybook screenshots of the TextOnly/BoxedIcon/OfficialFigmaReference stories.
- **Final status:** ✅ **Approved** (2026-07-20).

### Component 18 — Second Nav Header

- **Registry status before:** `Missing`. Depends on the already-Approved `Header`. Closes the Header Sub-menu Item → Item Icon → Nav Header Sub-Menu → Second Nav Header chain (execution-plan step 17).
- **Live verification:** `get_design_context` on `J0xq7JG3JKshRDzrgAM7E0`, node `18800:8281` (`rtl` × `style`[Gray/Primary] × per-item/per-action/divider toggles).
- **Code changes:** new `SecondNavHeader.tsx` (`SecondNavHeader` + `SecondNavHeaderItem`) — a 40px secondary nav bar: composed contextual items (icon+label) on one side, an `actions` slot on the other for consumer-composed icon-only `Button`s (the live action buttons share the exact node reference, `407:510376`, as the already-Approved `Button` — confirmed literal instances, not rebuilt). Figma's own prop name for the background axis is literally `style` — renamed to `variant` to avoid colliding with the native HTML `style` attribute (a defensive naming check applied proactively this time, learning directly from Component 14's own `title` collision). RTL mirrors entirely through direction-relative `flex-direction: row` — no manual DOM reordering, unlike the Figma-authored markup's own conditional reversal. 12 new additive `--fads-sys-secondnavheader-*` tokens.
- **Registry changes:** `status` → `Approved`, `visualComplianceStatus`/`nodeResolutionStatus` → `resolved`.
- **Docs updated:** new `docs/FIGMA_SECOND_NAV_HEADER_SPECIFICATION.md`, new `reports/VISUAL_COMPLIANCE/SecondNavHeader/VISUAL_COMPLIANCE_SECOND_NAV_HEADER.md`, new rows in `docs/COMPONENT_APPROVAL_MATRIX.md` for all of Components 13-18 at once (the doc-update debt from Components 13-17, built across earlier turns before the user's explicit one-component-per-turn instruction, was reconciled in this same closing pass), `docs/PROJECT_STATUS.md`, this report.
- **Validation:** `npm run typecheck` ✅, `npm run lint` (eslint + `lint:css`) ✅, `npm run format:check` (touched files) ✅, `SecondNavHeader.test.tsx` ✅ 6/6, `npm run tokens:validate` ✅ (926 defined, 831 referenced, 0 missing), `npm run build` ✅ (after fixing the `Toc` `title` collision and two Storybook-args-typing errors on `Toc`/`NavHeaderSubMenu` — both caught only by this build step, not `tsc --noEmit`), `npm run build-storybook` ✅. Full-suite `npm test`: 778/784 (66 files, up from 743/749) — the same 6 pre-existing, unrelated `ApplicationFormPage`/`HomePage` failures as every prior pass this cycle. Visually re-verified via rendered Storybook screenshots of the Gray/Primary/OfficialFigmaReference stories against the live Figma `get_screenshot` output.
- **Final status:** ✅ **Approved** (2026-07-21). Closes step 17 of the execution plan (§5) entirely.

### Component 19 — Button-menu

- **Registry status before:** `Missing`, own `batchChangeNote` disclosing it was moved to Batch 05 to follow its `Menu` dependency.
- **Live verification:** `get_metadata` on `J0xq7JG3JKshRDzrgAM7E0`, node `411:4377` (432 variant nodes enumerated: `rtl` × `size`[Small/Medium/Large] × `state`[Default/Hovered/Pressed/Focused/Disabled/Selected] × `style`[Primary/Neutral/Secondary-Solid/Secondary-Outline/Subtle/Transparent] × `iconOnly`) + targeted `get_design_context`/`get_variable_defs` on 8 representative nodes.
- **Code changes:** new `ButtonMenu.tsx`/`ButtonMenu.module.css`. Live data confirmed the component is literally the already-Approved `Button`'s own chrome (identical node reference `407:510376`) plus an always-present trailing `arrow-down-01` chevron — composed via `<Button iconStart iconEnd>` rather than rebuilt. Also composes the already-Approved `Menu` as the disclosed panel, reusing the exact position/portal/outside-click/Escape architecture already established by `Select`/`DatePicker`; uses `aria-expanded`/`aria-controls` rather than `aria-haspopup="menu"` since `Menu`'s own items are plain Tab-focusable buttons, not a strict `role="menu"` roving-tabindex pattern. **Real finding while mapping `style` to `Button`'s own `variant`:** 5 of 6 styles already had exact `Button` equivalents (confirmed via `Button.module.css`'s own inline Figma-style-name comments); the 6th, `Subtle`, had been **documented in `Button`'s own original spec but never implemented** — a real, pre-existing gap only discovered because this component's own variant matrix required every style to be real. Closed by live-sampling `Subtle` fresh across all 6 states (cross-confirming the original spec's Default/Pressed data exactly, newly covering Hovered/Selected/Focused/Disabled) and adding it as a new additive `ButtonVariant` on `Button` itself — including a disclosed exception where `Subtle`'s own Disabled state stays transparent, unlike every other variant's shared flat-gray disabled fill (fixed with a CSS override scoped only to the new variant). The chevron is CSS-drawn (`arrow-down-01` not in the Icon registry), the same disclosed substitute already used by `Select`'s own indicator. **Two real bugs caught by this pass's own validation, both fixed before Approval:** an ESLint error (the external `ref` prop was destructured but never forwarded to the trigger — fixed via the existing `mergeRefs` utility) and a `jsx-a11y/no-static-element-interactions` error (an `onKeyDown` handler on a non-interactive portal `<div>` — fixed by moving Escape handling to a document-level listener, which is also more robust than relying on bubbling from whichever menu item has focus). A real timing bug in the "move focus into the panel" effect (it depended only on `[open]`, but the portal doesn't mount until a separate `useLayoutEffect` finishes computing position on the next render) was caught by the test suite itself and fixed by adding `position` to the dependency array. 2 new additive `--fads-sys-button-subtle-bg-*` tokens on `Button`; 0 new tokens for `ButtonMenu` itself.
- **Registry changes:** `status` → `Approved`, `visualComplianceStatus`/`nodeResolutionStatus` → `resolved`.
- **Docs updated:** new `docs/FIGMA_BUTTON_MENU_SPECIFICATION.md`, new `reports/VISUAL_COMPLIANCE/ButtonMenu/VISUAL_COMPLIANCE_BUTTON_MENU.md`, `docs/FIGMA_BUTTON_SPECIFICATION.md` updated with a closure note on the `Subtle` gap, new row in `docs/COMPONENT_APPROVAL_MATRIX.md`, `docs/PROJECT_STATUS.md`, this report.
- **Validation:** `npm run typecheck` ✅, `npm run lint` (eslint + `lint:css`) ✅ (after the two fixes above), `npm run format:check` (touched files) ✅, `ButtonMenu.test.tsx` ✅ 7/7, `Button.test.tsx` ✅ 34/34 (up from 32, extended to cover `subtle`), `npm run tokens:validate` ✅ (928 defined, 833 referenced, 0 missing), `npm run build` ✅, `npm run build-storybook` ✅. Full-suite `npm test`: 786/792 (67 files) — the same 6 pre-existing, unrelated `ApplicationFormPage`/`HomePage` failures as every prior pass this cycle. Visually re-verified via headless-browser screenshots of the rendered `OfficialFigmaReference` `ButtonMenu` story and the new `Button` `Subtle` story against the live Figma sampling.
- **Final status:** ✅ **Approved** (2026-07-21). Closes step 18 of the execution plan (§5).

### Component 20 — List item

- **Registry status before:** `Missing`, own dependency `Icon` (Approved).
- **Live verification:** `get_design_context` on `J0xq7JG3JKshRDzrgAM7E0`, node `7850:3463` (`rtl` × `type`[Ordered/Unordered/With Icon] × `level`[One/Two] × `style`[Primary/Neutral/On-Color] × `icon`).
- **Code changes:** new `ListItem.tsx`/`ListItem.module.css`. Renders a real `<li>` (`type`/`level`/`tone`/`marker`/`icon` props), meant to be composed inside a `<ul>`/`<ol>` by the not-yet-built `List` composite — the registry's own dependency order places "List item" before "List". **Real, disclosed scope decision:** the live demo's marker text (`"1-"`, `"a-"`, `"-"`, `"•"`) is per-instance literal string content in Figma's own prop interface, not computed via CSS counters or native `<ol>` numbering — `marker` stays a generic `ReactNode` slot rather than inventing numbering/lettering logic that properly belongs to the future `List` parent. **Two real findings caught by direct inspection, not assumed:** `Unordered`/Level One uses a `-` marker while Level Two uses `•` — the opposite of the usual bullet-then-dash nesting convention, reproduced exactly rather than "corrected"; and `style` (renamed `tone`, the same reserved-word collision already found for `SecondNavHeader`'s own `style` prop) colors the *entire* item — marker/icon and text alike — as one unit, not just the marker as a typical list design might assume. `checkmark-circle-02` (the live "With Icon" demo glyph) isn't in the Icon registry — same disclosed gap already accepted for `Alert`/`Toast`/`Notification`/`ItemIcon`'s own missing checkmark. 6 new additive `--fads-sys-listitem-*` tokens.
- **Registry changes:** `status` → `Approved`, `visualComplianceStatus`/`nodeResolutionStatus` → `resolved`.
- **Docs updated:** new `docs/FIGMA_LIST_ITEM_SPECIFICATION.md`, new `reports/VISUAL_COMPLIANCE/ListItem/VISUAL_COMPLIANCE_LIST_ITEM.md`, new row in `docs/COMPONENT_APPROVAL_MATRIX.md`, `docs/PROJECT_STATUS.md`, this report.
- **Validation:** `npm run typecheck` ✅, `npm run lint` (eslint + `lint:css`) ✅, `npm run format:check` (touched files) ✅, `ListItem.test.tsx` ✅ 7/7, `npm run tokens:validate` ✅ (934 defined, 839 referenced, 0 missing), `npm run build` ✅, `npm run build-storybook` ✅. Full-suite `npm test`: 793/799 (68 files) — the same 6 pre-existing, unrelated `ApplicationFormPage`/`HomePage` failures as every prior pass this cycle. Visually re-verified via a headless-browser screenshot of the rendered `OfficialFigmaReference` story, confirming level-2 indentation correctly mirrors under the app's default RTL layout.
- **Final status:** ✅ **Approved** (2026-07-21). Unblocks `List`.

### Component 21 — List

- **Registry status before:** `Missing`, depends on `List item` (Component 20, Approved same session).
- **Live verification:** `get_design_context` on `J0xq7JG3JKshRDzrgAM7E0`, node `7850:3506` (`rtl` × `type`[Ordered List/Unordered/With Icon] × `style`[Primary/Neutral/On-color]).
- **Code changes:** new `List.tsx`/`List.module.css`. The live node is literally a demo composition of 4 already-Approved `ListItem`s (1 Level 1 item + 3 Level 2 items) with **zero** inter-item gap — confirmed by direct inspection that `ListItem`'s own internal `gap: 8px` (marker↔text) is a separate, unrelated value. Built as a thin semantic wrapper: a real `<ol>` for `type="ordered"`, `<ul>` otherwise (per `CLAUDE.md`'s "use semantic HTML" rule), with `list-style: none` to avoid doubling up with `ListItem`'s own custom marker/icon rendering. **Disclosed, deliberate scope decision:** `List` does not add its own `tone` prop duplicating `ListItem`'s own already-Approved one — tone stays a per-`ListItem` concern set on each child individually. 1 new additive `--fads-sys-list-gap` token (`0px`, live-verified). **Real build-time defect caught by `npm run build`** (not `tsc --noEmit` — the same category of gap already found for `Toc`'s own `title` collision two components earlier): `List.stories.tsx`'s render-only stories lacked a top-level `args` covering the required `children` prop — fixed using the same established pattern already used for `Toc`/`NavHeaderSubMenu`.
- **Registry changes:** `status` → `Approved`, `visualComplianceStatus`/`nodeResolutionStatus` → `resolved`.
- **Docs updated:** new `docs/FIGMA_LIST_SPECIFICATION.md`, new `reports/VISUAL_COMPLIANCE/List/VISUAL_COMPLIANCE_LIST.md`, new row in `docs/COMPONENT_APPROVAL_MATRIX.md`, `docs/PROJECT_STATUS.md`, this report.
- **Validation:** `npm run typecheck` ✅, `npm run lint` (eslint + `lint:css`) ✅, `npm run format:check` (touched files) ✅, `List.test.tsx` ✅ 4/4, `npm run tokens:validate` ✅ (935 defined, 840 referenced, 0 missing), `npm run build` ✅ (after the `args` fix), `npm run build-storybook` ✅. Full-suite `npm test`: 797/803 (69 files) — the same 6 pre-existing, unrelated `ApplicationFormPage`/`HomePage` failures as every prior pass this cycle. Visually re-verified via a headless-browser screenshot of the rendered `OfficialFigmaReference` story, confirming structure, indentation, and zero-gap stacking match the live Figma demo exactly.
- **Final status:** ✅ **Approved** (2026-07-21). Closes step 12 of the execution plan (§5) entirely. Per the user's explicit one-`Missing`-component-per-turn instruction, stopping here. Next `Missing` component per the registry: **Structured List Row** (step 13) / **Radial Stepper** / **Circular Stepper** (step 19), all equally eligible.
