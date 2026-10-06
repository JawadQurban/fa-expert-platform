# DGA Official Component Catalog

> **Planning-phase document. No React code, tokens, tests, or Storybook were touched to
> produce this file.** Read-only Figma MCP tools only (`search_design_system`,
> `get_metadata`, `get_design_context`). No `use_figma` / write tool was called; the
> Figma file was not modified.

## 0. Source-of-truth correction (read this first)

The URL given for this pass —
`https://www.figma.com/design/cII2UMRzWj0rwKuMzWFqTU/Components-Library---Platforms-Code--Community-?node-id=16026-49769`
— resolves to **node `16026:49769` = the "Get Started" page**, an onboarding/install-instructions
canvas (how to import the "PC 1.0 Foundations," "PC 1.0 Icons," and "PC 1.0 Components" library
files into a consuming project). It is not a components page and contains zero real UI
components — walking "upward" from it (per the task's Step 1) leads to the file's only other
loaded canvas, a page literally named `      ↳ Tags` (leading spaces + `↳`, i.e. Figma's
manual-indentation convention for simulating a nested page under a section divider) — one
single component (Tag), not the full library either.

`get_metadata` with no `nodeId` — which lists **top-level pages of the currently-open
document in the Figma desktop app** — returns only those same two pages for this file, and
returns the **identical two pages** even when queried against the file key that this project's
own prior sessions already identified and used successfully
(`Sv0oWOS1SjWnwhQwdzRJIE`, "Components Library - Platforms Code (Community)" — see
`docs/FIGMA_BUTTON_SPECIFICATION.md`, `FIGMA_CARD_SPECIFICATION.md`,
`FIGMA_HEADER_SPECIFICATION.md`, `FIGMA_FOOTER_SPECIFICATION.md`,
`FIGMA_DIVIDER_SPECIFICATION.md`). This confirms the page list reflects **whatever canvases
happen to be loaded in the connected Figma desktop app right now**, not the full page list of
either file — direct node-ID lookups (`get_metadata`/`get_design_context` with an explicit
`nodeId`) work perfectly against nodes outside that list (verified live against the known
Button node `407:510376`, which returned its full 1,344-variant dump).

**Practical consequence:** exhaustive Section → Frame → ComponentSet → Component → Variant
tree-walking (Step 2 as literally specified) is not possible in this session without the user
opening each component's page in the Figma desktop app first — that would mean dozens of
manual round-trips for a single planning pass. Instead, this catalog was built by:

1. Re-using the **6 components already live-verified** by prior sessions (full variant axes,
   node IDs, states, tokens) — Button, Card, Header/Nav Header (+ 6 sub-parts), Footer, Divider, Tag.
2. Running an exhaustive **`search_design_system` sweep** (30+ queries covering every
   category in `docs/COMPONENT_INVENTORY.md` plus generic terms) against the
   `Components Library - Platforms Code (Community)` library, which indexes the **entire**
   published library regardless of what's open on canvas. This surfaced **78 distinct
   `component_set`/`component` assets** — including 34 that do not exist anywhere in the
   current 35-component React inventory (see §3).

Every entry below states plainly whether its node ID is **live-verified** (real canvas ID, a
working Figma URL) or **catalog-only** (name/description/component-key known from the search
index, canvas node ID not yet resolved — the next session must open that component's page in
Figma desktop, then call `get_metadata`/`get_design_context` on it before implementing).
No node ID is invented anywhere in this document.

**Library key** (for `search_design_system(includeLibraryKeys=[...])` in future sessions):
`lk-e7c73ab203b9b60e4a912b1006bd901c9a3b8af798bd5d94cf6f0e6f3ec5a6a0b24f3faff8f26e7e7f98a450456582e682846f9afaabfc886ab89bf131f3c72f`
— **"Components Library - Platforms Code (Community)"**, file key `Sv0oWOS1SjWnwhQwdzRJIE`.

Two other libraries surfaced incidentally and are **out of scope** for this catalog:
`PC 1.0 Icons` (covered separately by `docs/ICON_LIBRARY.md`) and
`Financial Academy - Design System - EN (Copy)` (a product-specific Figma copy, not the DGA
source of truth per `CLAUDE.md`'s Visual Compliance Rule — not used here).

---

## 1. How to read each entry

```
### <Component Name> — <CMP-ID>
- Category: <grouping used in §2>
- Parent section / library path: <filePath from search index, or live page name>
- Figma reference: <live node ID + URL>  OR  <component key only — catalog-only>
- Variant axes: <known axes/values, or "not yet resolved">
- Sizes / States: <known, or "not yet resolved">
- Icon support: <yes/no/unknown>
- RTL support: <yes/no/unknown — this library is RTL-authored by convention (see §4)>
- Accessibility notes: <only what's structurally inferable, no invented ARIA>
- Token references: <only if live-verified>
- Dependencies: <other catalog components this one composes>
- Current FADS status: <Approved / Implemented / Partially Implemented / Missing / Not Applicable>
```

---

## 2. Catalog by category

### 2.1 Actions

#### Button — CMP-05
- Category: Actions
- Parent: `components/Button`
- Figma reference: **live-verified** — file `Sv0oWOS1SjWnwhQwdzRJIE`, node `407:510376`
  <https://www.figma.com/design/Sv0oWOS1SjWnwhQwdzRJIE/?node-id=407-510376>
- Variant axes: `RTL` (False/True) × `Size` (Large/Medium/Small/…) × `State` (Default/Hovered/
  Pressed/Focused/Disabled/Selected) × `Style` (Primary/Secondary-Solid/Secondary-Outline/
  Neutral/…) × `Destructive` (yes/no) × `Icon only` (False/True) × `On-color` (False/True) —
  1,344 total variants.
- Icon support: yes (icon-only + leading/trailing).
- RTL support: yes, dedicated mirrored variants.
- Accessibility notes: `role=button`, visible focus ring, name=label (WCAG 2.5.3), target ≥24px.
- Token references: `--fads-sys-button-primary-bg-*` (5 tokens, live-sourced).
- Dependencies: none (leaf primitive).
- Current FADS status: **✅ Approved** (`reports/VISUAL_COMPLIANCE/Button/VISUAL_COMPLIANCE_BUTTON.md`).

#### Button-menu — CMP-34 *(new)*
- Category: Actions
- Parent: `components/Button-menu`
- Figma reference: catalog-only — component key `07054b8a1d67f04002f43113d2d2889d33b65c52`
- Description: "Menu button functions as a toggle to reveal a menu presenting various options."
- Variant axes / Sizes / States: not yet resolved (search index only).
- Icon support: likely (chevron/caret), unconfirmed.
- RTL support: unknown, not yet resolved.
- Dependencies: likely composes **Menu** (CMP-11) as its popover.
- Current FADS status: **Missing** — no equivalent in `@ds`.

#### Button-Close — CMP-35 *(new)*
- Category: Actions
- Parent: `components/Button-Close`
- Figma reference: catalog-only — component key `593aa032b1492799e6e3b847728f20088a16756d`
- Description: dismiss control for modals/dialogs/popups, "X" icon, keyboard + ARIA support implied.
- Dependencies: consumed by **Modal** (CMP-25), **Notification Toast** (CMP-22), **Notification** (CMP-24).
- Current FADS status: **Missing** as a standalone primitive — `Modal`/`Toast`/`Notification`
  currently each implement their own inline dismiss button rather than a shared `Button-Close`.

#### Floating Button — CMP-36 *(new)*
- Category: Actions
- Parent: `components/Floating Button`
- Figma reference: catalog-only — component key `fbefaffffc1c4adc88b8a4bf8889b1dc1b024b62`
- Description: circular FAB for a screen's primary action.
- Current FADS status: **Missing**.

#### Link — CMP-06
- Category: Actions
- Parent: `components/Link`
- Figma reference: catalog-only — component key `c08122a12d0da7044db09a0eeffc3228b4d72716`
- Description: "Links facilitate navigation by allowing users to click (or tap) and navigate
  users to another location, such as a different site, resource, or section within the same page."
- Variant axes / states: not yet resolved live (our built `Link` already implements Default/
  Hovered/Pressed/Focused/Visited/Disabled from `COMPONENT_INVENTORY.md`'s spec — not yet
  cross-checked pixel-for-pixel against this node).
- Current FADS status: **Implemented**, not yet visually verified — `⏳ Pending` row candidate
  for `docs/COMPONENT_APPROVAL_MATRIX.md`.

---

### 2.2 Forms & Inputs

#### Text Input — CMP-13
- Parent: `components/Text Input`
- Figma reference: catalog-only — component key `ecb793e4c9b3e5618ed474ea40b8755134dd3257`
- Current FADS status: **Implemented** (`TextInput.tsx`), listed `⏳ Pending` in the approval matrix.

#### Textarea — CMP-14
- Parent: `components/Textarea`
- Figma reference: catalog-only — component key `990742e402d904a200f19bc1b5a40056a5e860da`
- Current FADS status: **Implemented**, not yet visually verified.

#### Dropdown Input — CMP-15
- Parent: `components/Dropdown Input`
- Figma reference: catalog-only — component key `7ca1fea893ec3b65eccca5ced5007a53d2d42824`
- Description: "Dropdowns present a list of options from which a user can select one option, or several."
- Dependencies: **Dropdown List Item** (CMP-40b, see below), **Trailing Icon** (CMP-40c).
- Current FADS status: **Implemented** as `Select` (native `<select>`), parity with the
  official multi-part popover structure (List Item + Trailing Icon) not yet verified —
  **Partially Implemented**.

#### Number Input — CMP-38 *(new)*
- Parent: `components/Number Input`
- Figma reference: catalog-only — component key `82d25c5da984a479216eceb2e0971b633b7b9eb4`
- Current FADS status: **Missing** — `TextInput` has no `type="number"` stepper affordance today.

#### Input Prefix-Suffix — CMP-39 *(new)*
- Parent: `components/Input Prefix-Suffix`
- Figma reference: catalog-only — component key `4a04a308d5a7849de2d08bff28cd08dfceecf5f3`
- Description: adornment slots (currency symbol, unit, etc.) on a text input.
- Dependencies: composes **Text Input** (CMP-13).
- Current FADS status: **Missing** — `TextInput` has no prefix/suffix slot prop today.

#### Label — CMP-37 *(new)*
- Parent: `components/Label`
- Figma reference: catalog-only — component key `b0ecca6d4f3e45b967cefb25429387417a1d9634`
- Description: "Displays the title of the input."
- Dependencies: shared by every form input (Text Input, Textarea, Dropdown Input, Checkbox,
  Radio, Switch, Date Picker, Number Input).
- Current FADS status: **Implemented as part of the internal `Field` helper**, not as a
  standalone exported component — `Field` is not itself a catalog component (FADS-internal),
  so this is functionally covered but not 1:1 traceable to a single official node.

#### Checkbox — CMP-17 (+ Checkbox Label)
- Parent: `components/Checkbox`, `components/Checkbox Label`
- Figma reference: catalog-only — `87721877c348c1bbc74c49c8a1d5e6bcde4d0c5e` / `857630f5847525eddd337cb384a48ff563fe0c70`
- Current FADS status: **Implemented** (checked/unchecked/indeterminate), not yet visually verified.

#### Radio — CMP-16 (+ Radio Label)
- Parent: `components/Radio`, `components/Radio Label`
- Figma reference: catalog-only — `0736e247a1a3b256583f8cc5d5b10ea3777297f9` / `d2f7fdfdc487f534baee9402935fa1366870f058`
- Current FADS status: **Implemented** (`Radio`/`RadioGroup`), not yet visually verified.

#### Switch — CMP-18 (+ Switch Label)
- Parent: `components/Switch`, `components/Switch Label`
- Figma reference: catalog-only — `7782880dc80d8c800807a40d65956effc38021f0` / `a9d259942ab77062b7b851fd026208c6672eb33d`
- Current FADS status: **Implemented**, not yet visually verified.

#### Date Picker — CMP-19
- Parent: `components/Date Picker`
- Figma reference: catalog-only — component key `1de70eae5dab91c833b98c708dc6c8a6ebe0204d`
- Current FADS status: **Implemented** (RTL-aware calendar grid), not yet visually verified.

#### File Upload / Single, File Upload / Multiple — CMP-20
- Parent: `components/File Upload / Single`, `components/File Upload / Multiple`
- Figma reference: catalog-only — `8d850735646c095aaf88608edca394cea21f970c` / `61f7ce06a72aa76ed1e31074ae768c6ea7b467dc`
- Current FADS status: **Implemented** as one `FileUploader` (`multiple` prop), single/multiple
  presented as one component rather than two Figma-distinct components — **Partially
  Implemented** pending confirmation the two official variants aren't visually distinct beyond
  the multi-file list.

#### Search Box — CMP-33
- Parent: `components/Search Box`
- Figma reference: catalog-only — component key `f7b24efd40fdc0315f8f35f81c7766f66883cff6`
- Current FADS status: **Missing** (already flagged Primary-conditional/⚠Q10 blocked in
  `COMPONENT_INVENTORY.md` — Figma reference now resolved to a real component name for when
  Q10 clears).

---

### 2.3 Selection & Wayfinding Controls

#### Horizontal Tab / Horizontal Tab List — CMP-09
- Parent: `components/Horizontal Tab`, `components/Horizontal Tab List`
- Figma reference: catalog-only — `3b8e1f6262f04044cf3ffdef15991b406cc94e8d` / `418a17e53d1e7969e18d65243094a5bd3fcf918b`
- Current FADS status: **Implemented** as `Tabs` (horizontal only), not yet visually verified.

#### Vertical Tab / Vertical Tab List — CMP-09b *(new axis of CMP-09)*
- Parent: `components/Vertical Tab`, `components/Vertical Tab List`
- Figma reference: catalog-only — `cba8dc5bfaf65f1572050915dc5373d6ae2bf313` / `2ce3a1c12d4c29b7711bee529104630c7e7dc5ac`
- Current FADS status: **Missing** — our `Tabs` has no `orientation="vertical"` mode.

#### Content Switcher — CMP-10
- Parent: `components/Content Switcher`
- Figma reference: catalog-only — component key `1c31b1a4fe99e5f9017739714ec31f0190a82bb9`
- Current FADS status: **Missing** (already tracked as pending in `COMPONENT_INVENTORY.md`).

#### Pagination — CMP-28
- Parent: `components/Pagination`
- Figma reference: catalog-only — component key `f83ac5711cf7ddbc29ddad3e84febd8d1354c515`
- Current FADS status: **Implemented**, not yet visually verified.

#### Breadcrumb — CMP-04
- Parent: `components/Breadcrumb`
- Figma reference: catalog-only — component key `80ff318bcfdb696a44b8743eee4331e4dbdd1b28`
- Current FADS status: **Implemented** (`Breadcrumbs`), not yet visually verified.

#### TOC / TOC Item — CMP-41 *(new)*
- Parent: `components/TOC`, `components/TOC Item`
- Figma reference: catalog-only — `96e4ff7b37cb223fd86cf3a275412e3b4b9de195` / `26241e6b442f71bfeba527dd8b14502e4dcc3461`
- Description: "provides a navigable outline or summary of content."
- Current FADS status: **Missing**.

---

### 2.4 Navigation Shell

#### Nav Header — CMP-01 (Header)
- Parent: `page 429:130167` — "↳ UI Shell - Nav Header"
- Figma reference: **live-verified** — file `Sv0oWOS1SjWnwhQwdzRJIE`, component-set node `30150:148751`
- Sub-parts, all **live-verified node IDs** (from `docs/FIGMA_HEADER_SPECIFICATION.md`):
  - Header Menu Item (set) — `30150:148312`
  - Header Action (set) — `30150:148445`
  - Header Menu / hamburger toggle (set) — `30150:148860`
  - Logo Placeholder (set) — `30150:149694`
  - **Nav Header Sub-Menu** (mega-dropdown, set) — `30150:148877` — **out of scope in the prior pass**
  - **Header Sub-menu Item** (set) — `30150:148183` — **out of scope in the prior pass**
- Variant axes: `RTL` × `Breakpoint` (`>960`/`600>960`/`<600`) × `Full-width` × slot toggles.
- Current FADS status: **✅ Approved** for the base shell
  (`reports/VISUAL_COMPLIANCE/Header/VISUAL_COMPLIANCE_HEADER.md`); the **mega sub-menu is
  explicitly Missing** — flagged Needs Confirmation/non-blocking in the existing spec, now
  formally tracked here as CMP-47.

#### Nav Header Sub-Menu + Header Sub-menu Item — CMP-47 *(new, split out of CMP-01)*
- Figma reference: **live-verified** node IDs `30150:148877` / `30150:148183` (see above).
- Current FADS status: **Missing** — this is the one piece of the already-Approved Header that
  is not built; kept separate here so it can be scheduled and estimated on its own.

#### Second Nav Header — CMP-45 *(new)*
- Parent: `components/Second Nav Header`
- Figma reference: catalog-only — component key `100219e39ca2643e2abc98beb1477afff100db7c`
- Description: "a secondary navigation bar that appears above the primary navigation."
- Current FADS status: **Missing**.

#### Footer — CMP-03
- Figma reference: **live-verified** — component-set node `30150:165937`, page `4205:18569`
- Current FADS status: **✅ Approved** (`reports/VISUAL_COMPLIANCE/Footer/VISUAL_COMPLIANCE_FOOTER.md`).

#### Nav Drawer Item — CMP-49 *(new, sub-part of CMP-02)*
- Parent: `components/Nav Drawer Item`
- Figma reference: catalog-only — component key `b66bf063b4f9a38e81879fb092b5c27bd534ba79`
- Description: two sub-types — "Parent (Link with Dropdown)" and plain "Link."
- Current FADS status: our `NavDrawer` renders free-form `children`, not this official
  Parent/Link item structure — **Partially Implemented**.

#### Slideout Menu / Slideout Menu Header — CMP-48 *(new, possible CMP-02 equivalent)*
- Parent: `components/Slideout Menu`, `components/Slideout Menu Header`
- Figma reference: catalog-only — `0b91311f831d85cf9ca29e27631dddde0ce15748` / `99fa93c5b0af489346ea61dcd932ce58e31c2689`
- **Needs Confirmation:** this may be the official name for the mobile drawer our `NavDrawer`
  (CMP-02) already implements, or a distinct component. Not resolved this pass — flag for the
  next implementer to open both this and `NavDrawer`'s live node before assuming equivalence.
- Current FADS status: **Missing / Needs Confirmation**.

#### Menu / Menu list item — CMP-11
- Parent: `components/Menu`, `components/Menu list item`
- Figma reference: catalog-only — `db761c025ca70e2452d8fcc6250cb8c87ae2844c` / `cf290c4b117de5ba29d61ff0213120ed28b57357`
- Current FADS status: **Missing** (already tracked as pending).

#### Header Menu / Header Menu Item — CMP-46 *(new, sub-parts, distinct from CMP-01's own Header Menu Item set — same name, verify not a duplicate before building)*
- Parent: `components/Header Menu`, `components/Header Menu Item`
- Figma reference: catalog-only — `886b8b3a128faa6045f1b6437aa637f409d425ec` / `87e55aba2d54a8c244486002f61560fdd2e605d9`
- **Needs Confirmation:** the search index surfaced these as separate top-level catalog
  entries in addition to the live-verified `Header Menu Item` (`30150:148312`) and
  `Header Menu` (`30150:148860`) sub-parts already resolved under CMP-01. They may be the same
  nodes indexed twice under slightly different names, or a genuinely separate component. Not
  resolved this pass.
- Current FADS status: **Needs Confirmation** before scheduling as new work.

#### Dropdown List Item, Trailing Icon, Item Icon — CMP-40 *(new, shared sub-parts)*
- Parent: `components/Dropdown List Item`, `components/Trailing Icon`, `components/Item Icon`
- Figma reference: catalog-only — `4d5ba9d72557167250c36d836d2b569dbcc49794` / `ef14645fa783fb889c177a04f2b6de4953bf4f3c` / `e3c378b8d5ad4a4a7934b4f001f650e6963d256c`
- Dependencies: consumed by Dropdown Input (CMP-15), Menu list item (CMP-11), List item (CMP-43).
- Current FADS status: **Missing** as standalone primitives (built inline/ad hoc inside `Select`/`Menu` today).

---

### 2.5 Data Display

#### Card — CMP-07
- Figma reference: **live-verified** — component-set node `30195:10358`
- Variant axes: `RTL` × `Type` (Default/Expandable/Selectable) × `State` × `Effect`
  (`With Shadow`/`No Shadow`/`Stroke`) × `Expanded` × `Selected` — 6 axes, no `Size` axis.
- Current FADS status: **✅ Approved**; official `Expandable`/`Selectable` types remain
  **Partially Implemented** (our `actionable` prop is a generic analog, not a 1:1 match —
  documented, non-blocking).

#### Table (+ Table Row, Table Header, Table Header Cell, Table Header Cell - Sort, Table Header Cell - Filter, Table Row Cell) — CMP-27
- Parent: `components/Table`, `components/Table Row`, `components/Table Header`,
  `components/Table Header Cell`, `components/Table Header Cell - Sort`,
  `components/Table Header Cell - Filter`, `components/Table Row Cell`
- Figma reference: catalog-only — 7 component keys (see §2 raw search results retained in
  `docs/DGA_COMPONENT_NODE_MAP.md`).
- Current FADS status: our `Table` implements sortable headers and cells inline as part of one
  component, not as the official's 6 separate composable sub-parts (dedicated Sort/Filter
  header-cell variants) — **Partially Implemented**.

#### Structured List / Structured List Row — CMP-42 *(new)*
- Parent: `components/Structured List`, `components/Structured List Row`
- Figma reference: catalog-only — `a8bcfabbf53a1212863f108271cd4f1fc75b7f3a` / `37c20bb35d60e9431a38e3d37e95bb35fcea6cd3`
- Current FADS status: **Missing**.

#### List / List item — CMP-43 *(new)*
- Parent: `components/List`, `components/List item`
- Figma reference: catalog-only — `f51fcfe7480823005afff3ae1ae114af29ed3ed0` / `4b110b637495054379162e4b88627650d059e1b3`
- Description: ordered / unordered / icon-list variants.
- Current FADS status: **Missing** as a dedicated component (product copy uses raw `<ol>`/`<ul>`
  today, e.g. `HomePage.tsx`'s Evaluation Criteria list).

#### Avatar / Avatar Group — CMP-12
- Parent: `components/Avatar`, `components/Avatar Group`
- Figma reference: catalog-only — `bf52bf4e6f37484fecc36e42425b5a4b12bd21a7` / `7d2aa476623f924a7eaba68ddde6f6e03621bfaa`
- Current FADS status: `Avatar` **Implemented**, not yet visually verified; `Avatar Group`
  (stacked/unstacked) — **Missing**.

#### Tag — CMP-26
- Figma reference: **live-verified** — page `12:539`, component-set node `421:110968`
- Variant axes (live-verified, from the Tags page dump): `RTL` (False/True) × `Size` (x Small/…)
  × `Style` (Neutral/Success/Error/…) × `Outline` (False/True) × `Rounded` (False/True) ×
  `Icon only` (False/True). A separate `On-color` frame exists at the same page level.
- Current FADS status: **Implemented** (status vs. neutral/primary variants encoded per DC-05),
  not yet formally added to `docs/COMPONENT_APPROVAL_MATRIX.md` despite having live-verified data.

#### Rating — CMP-29
- Parent: `components/Rating`
- Figma reference: catalog-only — component key `01cc50e78724994709bb01d8957ebfc1160e6d1c`
- Current FADS status: **Missing** (already tracked as pending).

#### Metric — CMP-44 *(new)*
- Parent: `components/Metric`
- Figma reference: catalog-only — component key `d10edf7cce2250685376955dc9ae5625479c297a`
- Description: "used in dashboards or reports to highlight trends, comparisons, and numerical values."
- Current FADS status: **Missing** — no dashboard/stat-tile primitive exists in `@ds` today.

---

### 2.6 Feedback & Overlays

#### Modal — CMP-25
- Parent: `components/Modal`
- Figma reference: catalog-only — component key `ac8abdcd56972891da074ade4e183e5fefd8f85b`
- Current FADS status: **Implemented** (focus trap, `inert` background, Esc), not yet visually verified.

#### Notification Toast — CMP-22
- Parent: `components/Notification Toast`
- Figma reference: catalog-only — component key `fe7f137c751384c4f1002dbd5c851659b64c40c0`
- Current FADS status: **Implemented** (`Toast`/`ToastProvider`), not yet visually verified.

#### Notification — CMP-23 / CMP-24
- Parent: `components/Notification`
- Figma reference: catalog-only — component key `0709bb15cae352fecd62a303f80319079b632d75`
- **Needs Confirmation:** the search index returned exactly **one** `Notification` component
  set, while FADS ships two distinct components against it — `Alert` (CMP-23, "Inline Alert,"
  persistent in-context) and `Notification` (CMP-24, "Banner," page-level). Whether the
  official Figma set has a variant axis distinguishing inline-vs-banner placement, or whether
  these are genuinely one visual component used in two contexts, is **not resolved this
  pass** — requires opening the live node.
- Current FADS status: both **Implemented**, relationship to the single official set **Needs Confirmation**.

#### Tooltip / Help Icon — CMP-30
- Parent: `components/Tooltip`, `components/Help Icon`
- Figma reference: catalog-only — `7cf4d67e90b497b2fde4468e03796084e0354593` / `eec0741cef2b44e85be92a1f1c51e7930ff0453f`
- Current FADS status: **Implemented**, not yet visually verified. `Help Icon` (a dedicated
  info-icon trigger, distinct from a wrapped-children tooltip) not separately built.

#### Loading / Skeleton Square / Skeleton Component — CMP-31
- Parent: `components/Loading`, `components/Skeleton Square`, `components/Skeleton Component`
- Figma reference: catalog-only — `75d048a970d86adc6393dd16d0d7710fee26a7b8` / `81ec1cb35c5daf64e55731b9382b7a0a00b85cfe` / `9825d89af2aaf536fcb83fb3ec2b6d479a6491ca`
- Current FADS status: `Loading` **Implemented** (spinner + a generic line-skeleton variant);
  the official's distinct **Skeleton Square** shape is **Missing** — **Partially Implemented**.

---

### 2.7 Progress & Structure

#### Progress Indicator (Steps) — CMP-21
- Parent: `components/Progress Indicator`
- Figma reference: catalog-only — component key `057e7792860b128120786c3e5269115f43f9a44e`
- Description: "facilitates step-by-step navigation through a process or sequence."
- Current FADS status: **Implemented** as `Steps`, not yet visually verified.

#### Radial Stepper / Circular Stepper — CMP-21b *(new axis of CMP-21)*
- Parent: `components/Radial Stepper`, `components/Circular Stepper`
- Figma reference: catalog-only — `90bca783744fb96a80ada036a5c3dc9619dab43e` / `eb6fd4c006af8b254a22e059de92a6524e95a685`
- Current FADS status: **Missing** — our `Steps` is a linear (horizontal) progression only.

#### Divider — (no CMP-ID in the pre-existing inventory; already tracked outside the numbered range)
- Figma reference: **live-verified** — component-set node `18697:19412`
- Variant axes: `Line Type` × `Color` (neutral/primary/white/alphaWhite).
- Current FADS status: **✅ Approved** (`reports/VISUAL_COMPLIANCE/Divider/VISUAL_COMPLIANCE_DIVIDER.md`).

---

### 2.8 Trust & Verification (DGA-specific, government-site authenticity)

#### Digital Stamp — CMP-32
- Parent: `components/Digital Stamp`
- Figma reference: catalog-only — component key `5848c90b2a05abe94d9903d420a07bfaa9c3c07c`
- Current FADS status: **Missing** (already tracked, blocked on Q5).

#### Extension — CMP-32b *(new, closely related to Digital Stamp)*
- Parent: `components/Extension`
- Figma reference: catalog-only — component key `cffd9bd411f21086318d1635ad31f74bb7b18b77`
- Description: domain-authenticity indicator (`.gov.sa`/`.edu.sa`/`.med.sa`/`.org.sa`/`.sch.sa`,
  HTTPS, DGA registration).
- Current FADS status: **Missing** — not previously tracked anywhere in `COMPONENT_INVENTORY.md`;
  likely shares the Q5 blocker with Digital Stamp (both are DGA trust-mark elements).

---

### 2.9 Out of scope for this catalog

#### flags / SA
- `assetType: component` (single component, not a set) — a Saudi-flag icon asset, not an
  interactive UI component. Belongs with the icon/locale-asset pipeline
  (`docs/ICON_LIBRARY.md`), not the component catalog. **Not Applicable** here.

#### Typography
- No `component`/`component_set` asset named "Typography" (or similar) was returned by any
  search query in this pass. The DGA type scale in this library is almost certainly defined as
  Figma **text styles**, not components — `search_design_system(includeStyles=true)` would
  surface it, but that's a token/style-mapping exercise (`docs/TOKEN_MAPPING.md`), not a
  component to catalog. Confirms the existing approval matrix's "not yet located" note; **Not
  Applicable** to this component catalog by design, not a gap.

#### Container, Section, Field, EmptyState, ErrorState
- FADS-authored compositions/layout primitives with no official DGA component equivalent
  (confirmed by this pass's searches turning up nothing under "Container," "Section," "Empty,"
  "Error"). **Not Applicable** — these stay FADS-only, per `CLAUDE.md`'s "do not invent DGA
  requirements" (the inverse case: don't retroactively invent a Figma source for something that
  doesn't have one).

---

## 3. Newly discovered vs. previously catalogued

> **See `docs/COUNTING_METHODOLOGY.md` for the authoritative reconciliation of this number
> against the registry.** The **78** below is the original session's informal running tally of
> distinct search-sweep names — since superseded by the registry's reconciled figures (81 total
> rows, 78 *canonical* after excluding 2 flagged duplicates and 1 out-of-scope row — a different
> computation that coincidentally also equals 78). Do not treat the two as the same number.

**78 distinct Figma assets found** (`component_set` + standalone `component`) in the official
library via this session's search sweep. Cross-referenced against `docs/COMPONENT_INVENTORY.md`
(pre-existing 33 `CMP-*` IDs across primitives/composite/shell):

- **Previously catalogued and matched:** 32 of 33 existing `CMP-*` IDs found a corresponding
  Figma asset (all except Typography — see §2.9).
- **Newly discovered, no prior `CMP-*` entry:** 34 assets — assigned provisional IDs
  `CMP-34`…`CMP-49` in this pass (see §2 above and `docs/DGA_COMPONENT_NODE_MAP.md` for the
  full list with priorities).
- **Confirmed out of scope:** 4 (flags/SA, Typography, plus the FADS-only Container/
  Section/Field/EmptyState/ErrorState group, which was never expected to match).

## 4. Cross-cutting notes

- **RTL:** every live-verified component (Button, Card, Header + sub-parts, Footer, Tag) carries
  an explicit `RTL` variant axis authored bidirectionally, not a CSS mirror-in-code assumption —
  this pattern should be assumed for the remaining 72 catalog-only components too, consistent
  with `CLAUDE.md`'s "Arabic is primary / RTL is default."
- **States are static snapshots:** confirmed for Button and Card — Figma ships each state as a
  separate authored variant, not a transition. No animation/motion data is retrievable from any
  node inspected this pass; hover/focus transition timing remains an implementation choice.
- **No component in this library carries a documented breakpoint axis except Nav Header**
  (`Breakpoint`: `>960`/`600>960`/`<600`). Responsive behavior for everything else is Needs
  Confirmation on a per-component basis when it's picked up.
