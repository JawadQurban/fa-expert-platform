# Link (CMP-06) — Node Resolution Report

> **RESOLVED 2026-07-12 (later same day).** The live node was supplied directly via a
> node-specific Figma URL: `fileKey cII2UMRzWj0rwKuMzWFqTU`, `nodeId 2508:25804`
> (`https://www.figma.com/design/cII2UMRzWj0rwKuMzWFqTU/Components-Library---Platforms-Code--Community-?node-id=2508-25750&t=Z4aJJ5KxePF4XBuc-0`).
> Verified live via `get_metadata`/`get_design_context`/`get_screenshot`/`get_variable_defs` — a
> 144-variant component set (`rtl` × `state` × `style` × `size` × `inline`). Registry's
> `nodeResolutionStatus` is now `"resolved"`; full variant/token data is in
> `docs/FIGMA_LINK_SPECIFICATION.md`. **Note:** this file (`cII2UMRzWj0rwKuMzWFqTU`) is a
> different Figma file key than the one used in the original blocked attempt below
> (`Sv0oWOS1SjWnwhQwdzRJIE`) — both are named "Components Library - Platforms Code (Community)",
> but only the node-specific URL's file actually contains a resolvable Link node; the search
> results in §3 of the original attempt (from `Sv0oWOS1SjWnwhQwdzRJIE`) surfaced a real
> `componentKey` match but that specific file copy had no open/inspectable Link page during this
> project's session. **The original attempt log below is preserved verbatim as history — it
> remains an accurate record of what MCP-only resolution could and couldn't do before a live URL
> was supplied, and is not a description of a permanent tooling limitation.**

---

## Original report (2026-07-12, earlier same day) — Outcome at the time: Blocked — Node Resolution

No implementation, spec, or visual-compliance work was started during this original pass. This
report exists solely to record the MCP resolution attempt for `docs/DGA_COMPONENT_NODE_MAP.md`
row #12 / `figma-component-map.json`'s `Link` entry, per that row's `nodeResolutionPlan`.

---

## 1. Constraint for this pass

Per explicit instruction: resolve the live canvas node using **only** the approved read-only MCP
tools (`search_design_system`, `get_metadata`, `get_design_context`, `get_screenshot`,
`get_variable_defs`, `download_assets`), with **no assumption about, or request to change, Figma
desktop-app state**. If MCP cannot resolve a live node under that constraint, mark
`nodeResolutionStatus: "blocked"`, document available vs. unverified data, and stop — do not
implement, do not approve.

## 2. Attempts made (in order)

1. **`search_design_system(query: "Link", fileKey: Sv0oWOS1SjWnwhQwdzRJIE)`** — returned the
   target component (`name: "Link"`, `assetType: "component_set"`, `componentKey:
   c08122a12d0da7044db09a0eeffc3228b4d72716`, library `Components Library - Platforms Code
   (Community)`, `filePath: design_systems/Components Library - Platforms Code
   (Community)/components/Link`) plus 12 Link-scoped design variables (§3). **No node ID, page ID,
   or canvas coordinates are present anywhere in this response** — `search_design_system` indexes
   the published library and returns name/description/`componentKey` only, never a live node
   reference.
2. **`search_design_system(query: "c08122a12d0da7044db09a0eeffc3228b4d72716", …)`** — searching by
   the componentKey itself as a text query returned unrelated components (`Avatar Group`, `flags /
   SA`); the tool does not resolve a componentKey to a node ID.
3. **`search_design_system(query: "components/Link", …)`** — searching the known `filePath`
   string as a query also returned unrelated results (a Financial Academy-copy `link` component
   and an icon named `redux`); confirms `filePath` is descriptive metadata, not a lookup key.
4. **`get_metadata(fileKey: Sv0oWOS1SjWnwhQwdzRJIE)` with no `nodeId`** — returns only the
   top-level pages currently loaded in the connected Figma desktop app, not the full document (see
   memory note `figma-mcp-desktop-app-scoping`). Result: exactly 2 pages — `16026:49769 "Get
   Started"` and `12:539 "      ↳ Tags"`. Neither is the Link component's own page.
5. **`get_metadata(fileKey, nodeId: "12:539")`** — fetched the full "Tags" page (the one
   Link-adjacent page already loaded) on the chance Link was nested nearby; returned a 63k-character
   XML dump. Grepped the saved output for `Link` (case-insensitive): **0 matches**. Confirmed Link
   is not present on this page.
6. **`get_metadata(fileKey, nodeId: "16026:49769")`** ("Get Started") — inspected in full; this is
   onboarding/documentation content (library-install walkthrough), not a component page. No Link
   reference.

No other approved tool accepts a componentKey, name, or query string — `get_design_context`,
`get_screenshot`, and `get_variable_defs` all require a concrete `nodeId` (regex-validated
`\d+[:-]\d+`), which is exactly the value this component is missing. Per the node map's own
policy ("do not guess node IDs"), no node ID was fabricated or inferred from adjacent components'
IDs (e.g. Button's `407:510376`).

**Conclusion: under the read-only-MCP-only constraint, with no component page already loaded in
the connected desktop app, there is no available tool call that converts a `componentKey` into a
canvas `nodeId`.** This is a tooling gap, not an exhausted-effort assumption — every approved tool
was tried against every available lead (name, componentKey, filePath, adjacent open pages).

## 3. Data that **is** available (from `search_design_system`, safe to use for planning only)

- **Identity:** `name: "Link"`, `assetType: component_set` (i.e., a variant set, confirming Link
  has multiple variants/states rather than being a single fixed node), `componentKey:
  c08122a12d0da7044db09a0eeffc3228b4d72716`, `updatedAt: 2026-05-21T08:04:07Z`.
- **Description:** "Links facilitate navigation by allowing users to click (or tap) and navigate
  users to another location, such as a different site, resource, or section within the same
  page."
- **12 Link-scoped variables** (library `Foundations - Platforms Code (Community)`, collections
  `Spacing` and `Themes`) — names only; **no resolved values**, since `get_variable_defs` also
  requires a `nodeId`:

  | Variable | Collection | Type | Scope |
  |---|---|---|---|
  | `Link/link-sm-gap` | Spacing | FLOAT | GAP |
  | `Link/link-md-gap` | Spacing | FLOAT | GAP |
  | `Link/links-group-gap` | Spacing | FLOAT | GAP |
  | `Link/link-primary` | Themes | COLOR | TEXT_FILL, STROKE |
  | `Link/link-neutral` | Themes | COLOR | TEXT_FILL, STROKE |
  | `Link/link-danger` | Themes | COLOR | TEXT_FILL, STROKE |
  | `Link/link-oncolor` | Themes | COLOR | TEXT_FILL, STROKE |
  | `Link/link-primary-pressed` | Themes | COLOR | TEXT_FILL, STROKE |
  | `Link/link-primary-focused` | Themes | COLOR | TEXT_FILL, STROKE |
  | `Link/link-primary-visited` | Themes | COLOR | TEXT_FILL, STROKE |
  | `Link/link-danger-hovered` | Themes | COLOR | TEXT_FILL, STROKE |
  | `Link/link-danger-focused` | Themes | COLOR | TEXT_FILL, STROKE |
  | `Link/link-danger-pressed` | Themes | COLOR | TEXT_FILL, STROKE |
  | `Link/link-danger-visited` | Themes | COLOR | TEXT_FILL, STROKE |

  These names imply, but do not confirm: two sizes (`sm`/`md`, each with its own icon/label gap), a
  color/"mood" axis of at least `primary` / `neutral` / `danger` / `oncolor`, and a state axis of at
  least default / hovered / pressed / focused / visited per mood (full hover/pressed/focused/visited
  rows only enumerated for `primary` and `danger` in this search — `neutral`/`oncolor` state
  variants may exist but did not surface in this query and were not guessed into this table).
  A `links-group-gap` token additionally implies an official multi-link grouping/list pattern.

## 4. What remains unverified (blocking implementation)

Everything requiring a live node is unverified — none of this may be assumed or approximated:

- Actual variant *property* names/values (e.g. is size really `sm`/`md`, or `small`/`medium`? Is
  the mood axis called `color`, `style`, or `type`? Are `hover`/`pressed`/`focused`/`visited` real
  boolean/enum states or CSS-only pseudo-states in the design?).
  Does `neutral` and `oncolor` each carry the same 5-state set as `primary`/`danger`, or fewer?
- Resolved token **values** (hex colors, gap in px) for all 12 variables above.
- Layout: icon placement/size for the external-link marker, underline treatment (always-on vs.
  hover-only), font size/weight/line-height per size, focus ring treatment.
- Disabled state: no `link-disabled` variable surfaced in this search — unknown whether disabled
  reuses a shared `text-disabled` token or has no official disabled treatment at all.
- RTL behavior (icon mirroring, underline offset, gap direction).
- Accessibility annotations (any `aria-*` or semantic guidance attached to the node in Figma).
- A live screenshot of the component set for visual reference.

## 5. Comparison to the current implementation (context only, not a compliance verdict)

`frontend/src/design-system/primitives/Link/Link.tsx` / `Link.module.css` currently implement:
`external`, `disabled`, `iconEnd` props; states via `:hover`/`:active`/`:visited`/`[aria-disabled]`
CSS selectors; a single untyped size; tokens `--fads-sys-color-text-link`,
`--fads-sys-color-link-hover`, `--fads-sys-color-primary-pressed`,
`--fads-sys-color-link-visited`, `--fads-sys-color-text-disabled`, `--fads-sys-control-gap`,
`--fads-sys-radius-sm` — **none of which are the 12 Link-scoped tokens found in §3**, and the
implementation has no `mood`/`color` axis (`primary`/`neutral`/`danger`/`oncolor`) or `size` axis
(`sm`/`md`) at all. This is noted for awareness only — **not** a verified gap list, since §4's
missing data means an accurate compliance comparison cannot be written yet.

## 6. Resolution status

- `nodeResolutionStatus`: **`blocked`** (registry updated accordingly — see
  `frontend/src/design-system/registry/figma-component-map.json`, `Link` row).
- `implementationStatus`, `visualComplianceStatus`, `officialCoverage`: **unchanged** — no code,
  spec, or compliance work was performed this pass.
- **No component was approved or implemented.** `docs/COMPONENT_APPROVAL_MATRIX.md`,
  `CHANGELOG.md`, and `reports/PROJECT_PROGRESS.md` were **not** touched — those updates are
  Step 9 of the requested workflow and are gated on Steps 1–8 completing, which did not happen.

## 7. How to unblock (unchanged from the registry's own guidance)

The only known way to obtain Link's canvas node ID is for the connected Figma desktop app to have
the Link component's page loaded, so that a subsequent no-`nodeId` `get_metadata` call lists it (or
so that visual inspection of the canvas yields its node ID directly). No MCP-only sequence
discovered in this session substitutes for that. This is recorded here rather than acted on, per
this session's instruction not to request or assume any manual Figma desktop step.
