# DGA Component Node Map

Companion to `docs/DGA_OFFICIAL_COMPONENT_CATALOG.md`. **85 rows total** — see
`docs/COUNTING_METHODOLOGY.md` for exactly why this number differs from the registry's 81, 80,
and 78 (in short: this map is a superset that also tracks 3 non-Figma FADS rows and 1 pattern
aggregate row that the registry JSON intentionally does not contain). The 81 Figma-sourced rows
here have the same granularity as, and are directly diffable against,
`frontend/src/design-system/registry/figma-component-map.json`.

> **2026-07-12 hardening pass:** the registry JSON now carries four independent status axes
> (`implementationStatus`, `visualComplianceStatus`, `officialCoverage`, `nodeResolutionStatus`)
> replacing the old single overloaded `status` field as the source of truth, plus explicit
> `isDuplicate`/`duplicateOf`/`duplicateReason` metadata. This document's "Current Status" column
> still shows the old single-string style for readability, but **the JSON is authoritative** —
> see `reports/PLANNING_HARDENING_REPORT.md` for the full rationale. Two batch reassignments were
> also made here to fix forward-dependency violations (rows #16 `Label` and #17 `Button-menu`,
> flagged inline below).

**Node ID column key:**
- `LIVE nodeId` — a real, working canvas node ID verified this session or a prior session
  (`get_metadata`/`get_design_context` succeeded against it). Figma URL =
  `https://www.figma.com/design/Sv0oWOS1SjWnwhQwdzRJIE/?node-id=<id with - instead of :>`.
- `KEY <componentKey>` — found only via `search_design_system`; the canvas node ID is not yet
  resolved. **Per Step 11 policy: do not re-search for these** — instead, open the named
  component's page in the Figma desktop app, then call `get_metadata`/`get_design_context` on
  it directly before implementation begins on that row.

**Priority:** P0 already done · P1 high reuse / high visibility · P2 medium · P3 low or blocked
on an open question (Q5/Q10/etc., see `docs/QUESTIONS.md`).
**Complexity:** S <0.5 day · M 0.5–1 day · L 1–2 days · XL 2+ days.

| # | Component | CMP-ID | Category | Node ID | Priority | Dependencies | Current Status | Batch | Complexity | Est. Effort |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Button | CMP-05 | Actions | LIVE `407:510376` | P0 | none | ✅ Approved | Done | — | — |
| 2 | Card | CMP-07 | Data Display | LIVE `30195:10358` | P0 | none | ✅ Approved | Done | — | — |
| 3 | Nav Header | CMP-01 | Navigation Shell | LIVE `30150:148751` | P0 | Header Menu Item, Header Action, Header Menu, Logo Placeholder | ✅ Approved | Done | — | — |
| 4 | Header Menu Item | CMP-01 (sub) | Navigation Shell | LIVE `30150:148312` | P0 | — | ✅ Approved (bundled in Header) | Done | — | — |
| 5 | Header Action | CMP-01 (sub) | Navigation Shell | LIVE `30150:148445` | P0 | — | ✅ Approved (bundled) | Done | — | — |
| 6 | Header Menu (hamburger) | CMP-01 (sub) | Navigation Shell | LIVE `30150:148860` | P0 | — | ✅ Approved (bundled) | Done | — | — |
| 7 | Logo Placeholder | CMP-01 (sub) | Navigation Shell | LIVE `30150:149694` | P0 | — | ✅ Approved (bundled) | Done | — | — |
| 8 | Footer | CMP-03 | Navigation Shell | LIVE `30150:165937` | P0 | none | ✅ Approved | Done | — | — |
| 9 | Divider | — | Progress & Structure | LIVE `18697:19412` | P0 | none | ✅ Approved | Done | — | — |
| 10 | Tag | CMP-26 | Data Display | LIVE `421:110968` | P1 | none | Implemented, live data captured, not yet in approval matrix | 01 | S | 0.25d (matrix entry + confirm) |
| 11 | Typography | — | Foundation | N/A — Figma text styles, not a component | P1 | none | Implemented, pending style verification | 01 | S | 0.5d |
| 12 | Link | CMP-06 | Actions | KEY `c08122a12d0da7044db09a0eeffc3228b4d72716` | P1 | none | Implemented, not visually verified | 01 | S | 0.5d |
| 13 | Text Input | CMP-13 | Forms & Inputs | KEY `ecb793e4c9b3e5618ed474ea40b8755134dd3257` | P1 | Label | Implemented, not visually verified | 01 | M | 0.5d |
| 14 | Container | — | Foundation (FADS-only) | N/A — no Figma equivalent | P1 | none | Implemented, no Figma source to verify against | 01 | S | 0.25d (documentation only) |
| 15 | Section | — | Foundation (FADS-only) | N/A — no Figma equivalent | P1 | none | Implemented, no Figma source to verify against | 01 | S | 0.25d (documentation only) |
| 16 | Label | CMP-37 | Forms & Inputs | KEY `b0ecca6d4f3e45b967cefb25429387417a1d9634` | P1 ⬆ | none | Implemented inside internal `Field`, not standalone | **01** ⬅ (was 02) | S | 0.5d |
| 17 | Button-menu | CMP-34 | Actions | KEY `07054b8a1d67f04002f43113d2d2889d33b65c52` | P2 | Menu (CMP-11) | Missing | **05** ⬅ (was 02) | M | 1d |
| 18 | Button-Close | CMP-35 | Actions | KEY `593aa032b1492799e6e3b847728f20088a16756d` | P1 | none | Missing | 02 | S | 0.5d |
| 19 | Floating Button | CMP-36 | Actions | KEY `fbefaffffc1c4adc88b8a4bf8889b1dc1b024b62` | P3 | Button | Missing | 02 | S | 0.5d |
| 20 | Number Input | CMP-38 | Forms & Inputs | KEY `82d25c5da984a479216eceb2e0971b633b7b9eb4` | P2 | Text Input, Label | Missing | 03 | M | 1d |
| 21 | Input Prefix-Suffix | CMP-39 | Forms & Inputs | KEY `4a04a308d5a7849de2d08bff28cd08dfceecf5f3` | P2 | Text Input | Missing | 03 | M | 1d |
| 22 | Dropdown List Item | CMP-40 | Forms & Inputs / Nav Shell | KEY `4d5ba9d72557167250c36d836d2b569dbcc49794` | P2 | none | Missing (Select uses native option list) | 03 | S | 0.5d |
| 23 | Trailing Icon | CMP-40 | Forms & Inputs | KEY `ef14645fa783fb889c177a04f2b6de4953bf4f3c` | P2 | Icon | Missing | 03 | S | 0.5d |
| 24 | Dropdown Input | CMP-15 | Forms & Inputs | KEY `7ca1fea893ec3b65eccca5ced5007a53d2d42824` | P1 | Dropdown List Item, Trailing Icon | Partially Implemented (`Select`, native) | 03 | L | 1.5d |
| 25 | Search Box | CMP-33 | Forms & Inputs | KEY `f7b24efd40fdc0315f8f35f81c7766f66883cff6` | P3 (Q10-blocked) | Text Input | Missing | 03 | M | 1d |
| 26 | Checkbox | CMP-17 | Forms & Inputs | KEY `87721877c348c1bbc74c49c8a1d5e6bcde4d0c5e` | P1 | none | Implemented, not visually verified | 03 | M | 0.5d |
| 27 | Checkbox Label | CMP-17 (sub) | Forms & Inputs | KEY `857630f5847525eddd337cb384a48ff563fe0c70` | P1 | Checkbox, Label | Implemented (bundled) | 03 | — | bundled with #26 |
| 28 | Radio | CMP-16 | Forms & Inputs | KEY `0736e247a1a3b256583f8cc5d5b10ea3777297f9` | P1 | none | Implemented, not visually verified | 03 | M | 0.5d |
| 29 | Radio Label | CMP-16 (sub) | Forms & Inputs | KEY `d2f7fdfdc487f534baee9402935fa1366870f058` | P1 | Radio, Label | Implemented (bundled) | 03 | — | bundled with #28 |
| 30 | Switch | CMP-18 | Forms & Inputs | KEY `7782880dc80d8c800807a40d65956effc38021f0` | P1 | none | Implemented, not visually verified | 03 | M | 0.5d |
| 31 | Switch Label | CMP-18 (sub) | Forms & Inputs | KEY `a9d259942ab77062b7b851fd026208c6672eb33d` | P1 | Switch, Label | Implemented (bundled) | 03 | — | bundled with #30 |
| 32 | Textarea | CMP-14 | Forms & Inputs | KEY `990742e402d904a200f19bc1b5a40056a5e860da` | P1 | Label | Implemented, not visually verified | 03 | M | 0.5d |
| 33 | Date Picker | CMP-19 | Forms & Inputs | KEY `1de70eae5dab91c833b98c708dc6c8a6ebe0204d` | P2 | Text Input, Button | Implemented, not visually verified | 03 | L | 1d |
| 34 | File Upload / Single | CMP-20 | Forms & Inputs | KEY `8d850735646c095aaf88608edca394cea21f970c` | P2 | Button | Partially Implemented (merged with Multiple) | 03 | M | 0.75d |
| 35 | File Upload / Multiple | CMP-20 | Forms & Inputs | KEY `61f7ce06a72aa76ed1e31074ae768c6ea7b467dc` | P2 | File Upload / Single | Partially Implemented | 03 | — | bundled with #34 |
| 36 | Horizontal Tab | CMP-09 | Selection & Wayfinding | KEY `3b8e1f6262f04044cf3ffdef15991b406cc94e8d` | P1 | none | Implemented, not visually verified | 04 | S | 0.5d |
| 37 | Horizontal Tab List | CMP-09 | Selection & Wayfinding | KEY `418a17e53d1e7969e18d65243094a5bd3fcf918b` | P1 | Horizontal Tab | Implemented, not visually verified | 04 | — | bundled with #36 |
| 38 | Vertical Tab | CMP-09b | Selection & Wayfinding | KEY `cba8dc5bfaf65f1572050915dc5373d6ae2bf313` | P2 | Tabs (CMP-09) | Missing (`orientation="vertical"`) | 04 | M | 1d |
| 39 | Vertical Tab List | CMP-09b | Selection & Wayfinding | KEY `2ce3a1c12d4c29b7711bee529104630c7e7dc5ac` | P2 | Vertical Tab | Missing | 04 | — | bundled with #38 |
| 40 | Content Switcher | CMP-10 | Selection & Wayfinding | KEY `1c31b1a4fe99e5f9017739714ec31f0190a82bb9` | P2 | Button (segment style) | Missing | 04 | M | 1d |
| 41 | Pagination | CMP-28 | Selection & Wayfinding | KEY `f83ac5711cf7ddbc29ddad3e84febd8d1354c515` | P2 | Button | Implemented, not visually verified | 04 | S | 0.5d |
| 42 | Breadcrumb | CMP-04 | Selection & Wayfinding | KEY `80ff318bcfdb696a44b8743eee4331e4dbdd1b28` | P1 | Link | Implemented, not visually verified | 04 | S | 0.5d |
| 43 | TOC | CMP-41 | Selection & Wayfinding | KEY `96e4ff7b37cb223fd86cf3a275412e3b4b9de195` | P3 | TOC Item | Missing | 04 | M | 1d |
| 44 | TOC Item | CMP-41 (sub) | Selection & Wayfinding | KEY `26241e6b442f71bfeba527dd8b14502e4dcc3461` | P3 | Link | Missing | 04 | — | bundled with #43 |
| 45 | Menu | CMP-11 | Navigation Shell | KEY `db761c025ca70e2452d8fcc6250cb8c87ae2844c` | P2 | Menu list item | Missing | 05 | L | 1.5d |
| 46 | Menu list item | CMP-11 (sub) | Navigation Shell | KEY `cf290c4b117de5ba29d61ff0213120ed28b57357` | P2 | Item Icon, Trailing Icon, Tag | Missing | 05 | — | bundled with #45 |
| 47 | Item Icon | CMP-40 | Navigation Shell | KEY `e3c378b8d5ad4a4a7934b4f001f650e6963d256c` | P3 | Icon | Missing | 05 | S | 0.25d |
| 48 | Second Nav Header | CMP-45 | Navigation Shell | KEY `100219e39ca2643e2abc98beb1477afff100db7c` | P3 | Header | Missing | 05 | M | 1d |
| 49 | Nav Header Sub-Menu | CMP-47 | Navigation Shell | LIVE `30150:148877` | P2 | Header Sub-menu Item | Missing (deferred in original Header pass) | 05 | XL | 2d |
| 50 | Header Sub-menu Item | CMP-47 (sub) | Navigation Shell | LIVE `30150:148183` | P2 | Link | Missing (deferred) | 05 | — | bundled with #49 |
| 51 | Nav Drawer Item | CMP-49 | Navigation Shell | KEY `b66bf063b4f9a38e81879fb092b5c27bd534ba79` | P2 | NavDrawer (CMP-02) | Partially Implemented (free-form `children` today) | 05 | M | 1d |
| 52 | Slideout Menu | CMP-48 | Navigation Shell | KEY `0b91311f831d85cf9ca29e27631dddde0ce15748` | P3 (Needs Confirmation vs. NavDrawer) | NavDrawer | Missing / Needs Confirmation | 05 | M | 0.5d (confirm) + TBD |
| 53 | Slideout Menu Header | CMP-48 (sub) | Navigation Shell | KEY `99fa93c5b0af489346ea61dcd932ce58e31c2689` | P3 | Slideout Menu | Missing / Needs Confirmation | 05 | — | bundled with #52 |
| 54 | Header Menu (2nd index hit) | CMP-46 | Navigation Shell | KEY `886b8b3a128faa6045f1b6437aa637f409d425ec` | P3 (Needs Confirmation vs. #6) | — | Needs Confirmation — may duplicate #6 | 05 | S | 0.25d (confirm only) |
| 55 | Header Menu Item (2nd index hit) | CMP-46 (sub) | Navigation Shell | KEY `87e55aba2d54a8c244486002f61560fdd2e605d9` | P3 (Needs Confirmation vs. #4) | — | Needs Confirmation — may duplicate #4 | 05 | S | 0.25d (confirm only) |
| 56 | Table | CMP-27 | Data Display | KEY `6d3b55558f43c835ae2d0f6716cdd69cc88e18b4` | P1 | Table Row, Table Header, cells | Partially Implemented | 06 | XL | 2d |
| 57 | Table Row | CMP-27 (sub) | Data Display | KEY `f694464422d43602cd247f039bc750f7ec352d19` | P1 | Table Row Cell | Partially Implemented (bundled) | 06 | — | bundled with #56 |
| 58 | Table Header | CMP-27 (sub) | Data Display | KEY `9310e92f9ca08e8e92108d1a04abe4ae965e02f3` | P1 | Table Header Cell | Partially Implemented (bundled) | 06 | — | bundled with #56 |
| 59 | Table Header Cell | CMP-27 (sub) | Data Display | KEY `85942fe55af71aa3d516cc904e5e8ba599b2ec5e` | P1 | none | Partially Implemented (bundled) | 06 | — | bundled with #56 |
| 60 | Table Header Cell - Sort | CMP-27 (sub) | Data Display | KEY `8cb9a4b90a21e6dc32a3a976a33311a25c943e04` | P2 | Table Header Cell | Missing as a distinct sub-component (sort exists inline) | 06 | S | 0.5d |
| 61 | Table Header Cell - Filter | CMP-27 (sub) | Data Display | KEY `e5c28a2b37dee7d5e5a7f47ccf30d9e87d3721cc` | P3 | Table Header Cell | Missing | 06 | M | 1d |
| 62 | Table Row Cell | CMP-27 (sub) | Data Display | KEY `05ef64f05a1ace1a697fd42659b8d659f728f569` | P1 | none | Partially Implemented (bundled) | 06 | — | bundled with #56 |
| 63 | Structured List | CMP-42 | Data Display | KEY `a8bcfabbf53a1212863f108271cd4f1fc75b7f3a` | P3 | Structured List Row | Missing | 06 | M | 1d |
| 64 | Structured List Row | CMP-42 (sub) | Data Display | KEY `37c20bb35d60e9431a38e3d37e95bb35fcea6cd3` | P3 | none | Missing | 06 | — | bundled with #63 |
| 65 | List | CMP-43 | Data Display | KEY `f51fcfe7480823005afff3ae1ae114af29ed3ed0` | P2 | List item | Missing | 06 | S | 0.5d |
| 66 | List item | CMP-43 (sub) | Data Display | KEY `4b110b637495054379162e4b88627650d059e1b3` | P2 | Icon | Missing | 06 | — | bundled with #65 |
| 67 | Avatar | CMP-12 | Data Display | KEY `bf52bf4e6f37484fecc36e42425b5a4b12bd21a7` | P1 | none | Implemented, not visually verified | 06 | S | 0.5d |
| 68 | Avatar Group | CMP-12 (sub) | Data Display | KEY `7d2aa476623f924a7eaba68ddde6f6e03621bfaa` | P2 | Avatar | Missing | 06 | M | 1d |
| 69 | Rating | CMP-29 | Data Display | KEY `01cc50e78724994709bb01d8957ebfc1160e6d1c` | P2 | none | Missing | 06 | M | 1d |
| 70 | Metric | CMP-44 | Data Display | KEY `d10edf7cce2250685376955dc9ae5625479c297a` | P3 | Typography | Missing | 06 | M | 1d |
| 71 | Modal | CMP-25 | Feedback & Overlays | KEY `ac8abdcd56972891da074ade4e183e5fefd8f85b` | P1 | Button-Close | Implemented, not visually verified | 07 | M | 1d |
| 72 | Notification Toast | CMP-22 | Feedback & Overlays | KEY `fe7f137c751384c4f1002dbd5c851659b64c40c0` | P1 | Button-Close | Implemented, not visually verified | 07 | M | 1d |
| 73 | Notification | CMP-23 / CMP-24 | Feedback & Overlays | KEY `0709bb15cae352fecd62a303f80319079b632d75` | P1 (Needs Confirmation re: Alert/Banner split) | Button-Close | Implemented (as 2 components), relationship to 1 official set unresolved | 07 | M | 1d (confirm) |
| 74 | Tooltip | CMP-30 | Feedback & Overlays | KEY `7cf4d67e90b497b2fde4468e03796084e0354593` | P1 | none | Implemented, not visually verified | 07 | S | 0.5d |
| 75 | Help Icon | CMP-30 (sub) | Feedback & Overlays | KEY `eec0741cef2b44e85be92a1f1c51e7930ff0453f` | P3 | Tooltip, Icon | Missing | 07 | S | 0.5d |
| 76 | Loading | CMP-31 | Feedback & Overlays | KEY `75d048a970d86adc6393dd16d0d7710fee26a7b8` | P1 | none | Implemented, not visually verified | 07 | S | 0.5d |
| 77 | Skeleton Square | CMP-31 (sub) | Feedback & Overlays | KEY `81ec1cb35c5daf64e55731b9382b7a0a00b85cfe` | P3 | Loading | Missing (distinct shape) | 07 | S | 0.5d |
| 78 | Skeleton Component | CMP-31 (sub) | Feedback & Overlays | KEY `9825d89af2aaf536fcb83fb3ec2b6d479a6491ca` | P3 | Loading | Missing | 07 | — | bundled with #77 |
| 79 | Progress Indicator (Steps) | CMP-21 | Progress & Structure | KEY `057e7792860b128120786c3e5269115f43f9a44e` | P2 | none | Implemented, not visually verified | 08 | M | 1d |
| 80 | Radial Stepper | CMP-21b | Progress & Structure | KEY `90bca783744fb96a80ada036a5c3dc9619dab43e` | P3 | none | Missing | 08 | M | 1d |
| 81 | Circular Stepper | CMP-21b | Progress & Structure | KEY `eb6fd4c006af8b254a22e059de92a6524e95a685` | P3 | none | Missing | 08 | — | bundled with #80 |
| 82 | Digital Stamp | CMP-32 | Trust & Verification | KEY `5848c90b2a05abe94d9903d420a07bfaa9c3c07c` | P3 (Q5-blocked) | none | Missing | 08 | L | 1.5d |
| 83 | Extension | CMP-32b | Trust & Verification | KEY `cffd9bd411f21086318d1635ad31f74bb7b18b77` | P3 (Q5-blocked) | Digital Stamp | Missing | 08 | M | 1d |
| 84 | flags / SA | — | Out of scope | KEY `d26f93d6667132dbbcb5d05c2af8ed6203a7aa17` | N/A | none | Not Applicable — icon/locale asset, not a component | — | — | — |
| 85 | PAT-01…06 (patterns) | PAT-01…06 | Patterns (L3) | N/A — compositions of the above, no dedicated Figma node | P2 | all constituent components | Missing (0 of 6 built) | 09 | XL (each) | 1–2d each |

## Dependency-ordering corrections (2026-07-12 hardening pass)

A systematic forward-dependency check (every row's `dependencies` compared against its own
`batch` number) found exactly 2 violations — a dependency scheduled in a *later* batch than the
component that needs it. Both are fixed by moving the dependent row, not by pulling the
dependency earlier (pulling a dependency earlier can just relocate the violation, as explained
below). Full rationale in `docs/DGA_IMPLEMENTATION_ORDER.md` and `reports/PLANNING_HARDENING_REPORT.md`.

- **Row #16, Label:** was Batch 02, but row #13 `Text Input` (Batch 01) depends on it — Text
  Input's visual-compliance pass can't meaningfully proceed without Label existing as a
  standalone primitive first. **Moved to Batch 01.** Label is a low-risk extraction from the
  already-shipped internal `Field` helper (not new UI), so this doesn't change Batch 01's
  low-risk character, just its scope by one row.
- **Row #17, Button-menu:** was Batch 02, but depends on `Menu` (Batch 05). Menu itself has a
  multi-step dependency chain (Menu list item → Item Icon/Trailing Icon/Tag), which makes pulling
  Menu forward to Batch 02 impractical (it would just relocate the violation into Menu's own
  dependencies). **Moved to Batch 05**, to be built directly after Menu + Menu list item within
  that batch.
- No other rows required a batch change — every other dependency in this table resolves to a
  component in the same batch or an earlier one. (`Icon` and `Typography` appear as dependencies
  on a few rows — e.g. Trailing Icon, Item Icon, List item, Help Icon depend on `Icon`; Metric
  depends on `Typography` — these are intentionally not their own registry rows: `Icon` is the
  pre-existing FADS icon primitive, already implemented outside this catalog's Figma-node
  tracking, and `Typography` is tracked only in this map, row #11, Batch 01. Neither creates a
  forward-dependency risk since both are already available before any later batch needs them.)

## Notes on rows without a dedicated node ID

- **Typography, Container, Section** (#11, #14, #15): kept in this map because the task brief
  requires tracking every component under discussion, but they are **not Figma component-catalog
  entries** — Typography is a text-style export (§2.9 of the catalog doc), Container/Section are
  FADS-only layout primitives. Their "batch" work is documentation/token-mapping, not new UI.
- **Patterns (row 85)**: `docs/COMPONENT_INVENTORY.md §5` already defines PAT-01…06 as
  compositions of existing components (e.g. PAT-05 App Shell = Header + NavDrawer + Breadcrumbs +
  Footer). They have no standalone Figma node because a "pattern" in this library's sense is a
  product-level composition, not a library asset — confirmed by no search query surfacing
  anything resembling them as a component. Scheduled last (Batch 09) because every pattern
  depends on components from every earlier batch being finished first.
