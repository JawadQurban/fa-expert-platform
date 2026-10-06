# Figma Breadcrumb — Official Specification

**Source of truth:** Figma file `J0xq7JG3JKshRDzrgAM7E0` ("Components Library - Platforms Code
(Community)"), component set node `5698:2597` ("Breadcrumb"). Sub-parts: `_Breadcrumb Item`
(`5698:2585`), and the already-approved `Link` component (`2508:25804`, DGA CMP-06).
**Registry:** `nodeId`/`figmaUrl` were already populated in `figma-component-map.json`
(`nodeResolutionStatus: "pending"` — a workflow-progress marker, not evidence the ID was
fabricated; see `reports/HACKATHON_PAGES_COMPONENT_DEPENDENCY_AUDIT.md` §1). Live-verified this
pass via `get_metadata`/`get_design_context`/`get_screenshot`; flipped to `"resolved"` on success.
**Design documentation:** https://design.dga.gov.sa/guidelines/components/navigational/breadcrumbs
**Figma description:** "Breadcrumb navigation is a user interface element that enhances user
orientation within a website or application. It outlines a pathway, showing how the current page
fits into the overall site hierarchy. This feature improves usability by enabling users to
backtrack to more general pages seamlessly."

Extracted via read-only Figma MCP tools (`get_metadata`, `get_design_context`, `get_screenshot`).
The component set contains **10 variant symbols** (`RTL` × `Levels` = 2 × 5, `Levels` ∈
`{2, 3, 4, 5, >5}`). All 10 were inspected: 3 directly sampled via `get_design_context`
(`Levels=3` LTR, `Levels=>5` LTR, `Levels=3` RTL — node IDs in §7), the remaining 7 confirmed
structurally consistent via the full-frame `get_metadata` listing and `get_screenshot`.

---

## 1. Component Hierarchy

```
Breadcrumb (flex row, items-start LTR / items-center+justify-end RTL)
└─ _Breadcrumb Item × N (one per level)
   ├─ Separator icon (arrow-right-01 LTR / arrow-left-01 RTL, 16×16px) — every item except the first
   └─ Link instance (official Link component, Style=Neutral, Size=sm)
```

`Levels=">5"` replaces one or more middle `_Breadcrumb Item`s with a single interactive
**`<button>`** containing the separator icon + a literal `"..."` label (§5).

---

## 2. Variant Properties

**2 orthogonal variant axes** (2 × 5 = 10, matching the node count):

| Property | Values | Notes |
|---|---|---|
| `RTL` | `False`, `True` | Full DOM/layout mirroring — see §6 |
| `Levels` | `2`, `3`, `4`, `5`, `>5` | Number of breadcrumb items rendered; `>5` triggers the collapsed/ellipsis pattern (§5) |

No other variant properties exist on this component set (no separate "state" axis — items are
plain text/links, not interactive controls with their own hover/focus states beyond what the
composed `Link` instance already provides).

---

## 3. Item Structure & Ordering

Each `_Breadcrumb Item` (LTR) = `[separator icon]` + `[Link instance]`, **except the first item**,
which omits the separator (there is nothing before the root). This is confirmed identical for
every sampled `Levels` value: `N` items produce `N-1` separators, always leading (never trailing)
each non-first item — not a "text + trailing slash" pattern like the pre-existing FADS
implementation used.

---

## 4. Colors & Typography

| Element | Token | Value | Notes |
|---|---|---|---|
| Ancestor item link text | `Link/link-neutral` | `#384250` | **Not** the generic link-blue color the pre-existing implementation used (`--fads-sys-color-text-link`) — confirmed live on every ancestor item across all 3 sampled nodes. Matches the already-Approved `Link` component's own `mood="neutral"` token exactly (`--fads-sys-link-neutral: #384250`, live-verified independently during the Link pass) — composing `<Link mood="neutral" size="sm">` for ancestor items is therefore both correct and free (no new color token needed for this part). |
| Current-page (last) item text | `Global/text-default-disabled` | `#9da4ae` | **Not** a distinct "current page" emphasis token, and **not bold** — plain `text-sm`/Regular weight, just the same muted gray already used for disabled text elsewhere (Button/Card/TextInput all independently source this same Figma variable). The pre-existing implementation used `--fads-sys-color-text-muted` **and** `font-weight-medium` (bold) — both wrong per live data. |
| Separator icon | `Icon/icon-neutral` (closest plausible generic icon-color token) | `#384250` | **Needs Confirmation** — the separator renders as a vector/image asset in `get_design_context`'s extraction, not an inspectable text-color, so its exact fill could not be independently confirmed the way text-color tokens can be. `Icon/icon-neutral` is used as the closest generic muted-icon variable (same hex as `Link/link-neutral`, visually consistent with the screenshot's gray chevrons) rather than guessed. |
| All item text | `text-sm` / Regular | 14px / 20px line-height | Same `--fads-sys-typography-text-sm` shared token every other component's `text-sm` tier already uses — no new typography token needed. |

---

## 5. `Levels=">5"` — Collapsed / Ellipsis Pattern

Sampled node (`5698:2616`, LTR) shows exactly 4 rendered items for an underlying "more than 5"
level count: **root** → **`"..."` button** → **parent** → **current**. The `"..."` element is a
real `<button>` (`cursor-pointer` in the extracted markup), not decorative text — it is an
interactive collapse-expand trigger, not a static ellipsis.

**Needs Confirmation:** Figma shows only the *collapsed* state — no expanded-state variant
exists in the 10-node set, so the exact interaction the button performs (reveal hidden items
inline vs. navigate to an intermediate page vs. open a menu) is not directly verifiable. Per this
codebase's established pattern for interaction gaps not resolvable from static Figma data alone
(e.g. `Header`'s deferred mega-submenu, `TextInput`'s Type Cursor), this is implemented as the
most defensible minimal reading — **click reveals the hidden middle items in place** (the button
is replaced by the full item list, `aria-expanded` toggled) — flagged for design-team
confirmation rather than guessed at silently.

**Collapse threshold, derived from the 5 sampled `Levels` values:** `Levels` 2–5 always render
every item in full; only `>5` collapses. Implemented as: when `items.length > 5`, render
`[items[0], ellipsisButton, ...items.slice(-2)]` — root, ellipsis, then the last two items
(parent + current) — matching the exact 4-visible-item shape of the sampled node.

---

## 6. RTL Behavior

- `justify-content: end` on the row, full logical mirroring of padding (`padding-inline-start`
  instead of the LTR sample's physical `padding-right`).
- Separator icon direction flips (`arrow-left-01` instead of `arrow-right-01`) — a **different
  icon**, not a CSS-mirrored rotation of the same asset.
- **Needs Confirmation, same category as `Link`/`Tag`/`TextInput`'s own RTL findings (§8 in each
  of their specs):** the RTL sample's raw DOM order is the **full reverse** of the LTR sample's
  DOM order (current-page item first in the RTL markup, root last), rather than the same logical
  order (root → current) mirrored purely via `dir`. Implemented as **full logical-properties
  mirroring** — render items in the same logical order (root → current) regardless of `RTL`, let
  `dir`/logical CSS handle the visual flip — consistent with every other approved component in
  this design system and this codebase's lint-enforced DC-23 rule, rather than reproducing a
  one-off manually-reversed DOM order. Flagged for design-team confirmation, not blocking.

---

## 7. Node Reference (for future re-verification)

| Variant sampled | Node ID |
|---|---|
| Component set root | `5698:2597` |
| `_Breadcrumb Item` sub-component | `5698:2585` |
| `Levels=3`, RTL=False | `5698:2601` |
| `Levels=>5`, RTL=False | `5698:2616` |
| `Levels=3`, RTL=True | `5698:3387` |
| `Levels=2`, RTL=False (metadata-confirmed, not individually sampled) | `5698:2598` |
| `Levels=4`, RTL=False (metadata-confirmed) | `5698:2605` |
| `Levels=5`, RTL=False (metadata-confirmed) | `5698:2610` |
| `Levels=2`, RTL=True (metadata-confirmed) | `5698:3384` |
| `Levels=4`, RTL=True (metadata-confirmed) | `5698:3391` |
| `Levels=5`, RTL=True (metadata-confirmed) | `5698:3396` |
| `Levels=>5`, RTL=True (metadata-confirmed) | `5698:3402` |
| Separator icon, LTR (`arrow-right-01`) | `31820:128809` |
| Separator icon, RTL (`arrow-left-01`) | `31820:128704` |
| Composed `Link` component (already Approved) | `2508:25804` |

---

## 8. Accessibility

- `<nav aria-label>` landmark — already correct in the pre-existing implementation, unchanged.
- Current page as non-interactive text with `aria-current="page"` — already correct, unchanged
  (`COMPONENT_MAPPING.md` §3 contract; Figma's own "current item = muted, non-link" visual
  treatment is consistent with this, even though Figma's raw markup doesn't literally distinguish
  interactive-vs-not at the node-type level for the current item — the color/style cue plus this
  codebase's own established `aria-current` contract together satisfy WCAG 2.4.8).
- Separator icon is decorative (`aria-hidden="true"`) — the trail's structure is already conveyed
  by the `<nav>`/`<ol>`/link semantics, not the visual separator.
- `Levels=">5"` ellipsis button: needs `aria-expanded` and an accessible name (e.g. "Show hidden
  breadcrumb levels") since it is a real interactive control, not decorative text.

---

## 9. Deviations, Extensions, and Needs-Confirmation Items

1. **Separator glyph is not the exact official SVG icon.** The official `arrow-right-01`/
   `arrow-left-01` icons (Figma nodes `31820:128809`/`31820:128704`) do not exist in this
   project's current Icon registry (`frontend/src/design-system/primitives/Icon/registry/` — no
   arrow/chevron/navigation category exists yet, confirmed by grep). Rather than importing a new
   icon through the full `docs/ICON_LIBRARY.md` pipeline (out of scope for "fix only the
   component in scope" — the Icon registry is a shared, separately-versioned asset pipeline, not
   Breadcrumb's own file), this pass uses the Unicode angle-quotation glyph `›` (U+203A), which
   carries the `Bidi_Mirrored=Yes` Unicode property — browsers automatically render it as `‹`
   under RTL directionality with zero extra logic, matching the "different icon per direction"
   requirement from live data without needing two separate icon assets. Flagged, not silently
   substituted: this is a visual approximation of the real icon shape (a chevron vs. the DGA
   library's specific arrow glyph), same category as `Link`'s "↗" external-link placeholder and
   `TextInput`'s deferred feedback icon (both pending the same underlying icon-library gap, Q8).
2. **Separator color** (§4) — approximated via the generic `Icon/icon-neutral` variable rather
   than an independently-confirmed exact fill (the vector asset wasn't color-inspectable via
   `get_design_context`). Non-blocking.
3. **`Levels=">5"` ellipsis-button interaction** (§5) — implemented as click-to-reveal-in-place;
   Figma shows only the collapsed state, not what the button does. Non-blocking, flagged for
   confirmation.
4. **RTL DOM ordering** (§6) — implemented as full logical-properties mirroring over the sampled
   RTL node's literal reversed-DOM-order reading, consistent with every other approved
   component's own resolution of the same ambiguity.
