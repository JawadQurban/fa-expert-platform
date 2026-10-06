# Figma Pagination — Official Specification

**Source of truth:** Figma file `J0xq7JG3JKshRDzrgAM7E0` ("Components Library - Platforms Code
(Community)"), component set **Pagination** (node `7936:8133`), category "Selection & Wayfinding".
**Registry:** `nodeId`/`figmaUrl` were already populated (`nodeResolutionStatus: "pending"` — a
workflow-progress marker; see `CLAUDE.md`'s node resolution policy). Live-verified this pass via
`get_metadata`/`get_design_context`/`get_variable_defs`; flipped to `"resolved"` on success.
**Design documentation:** https://design.dga.gov.sa/guidelines/components/navigational/pagination

Extracted via read-only Figma MCP tools. 6 variants (`rtl` × `size` [Large/Medium/Small]); all 3
sizes (RTL=False) sampled directly via `get_design_context`, plus `get_variable_defs` on the
component-set root.

---

## 1. Real Visual Differences Found vs. the Pre-Existing Implementation

1. **Previous/Next are icon-only buttons.** Every sampled size shows a square icon button
   (40/32/24px) containing only a leading icon (`arrow-left-01` / `arrow-right-01`, per the
   Figma-supplied component descriptions) — **no visible "Previous"/"Next" text** anywhere. The
   pre-existing implementation rendered visible English/localized text labels inside the control
   buttons. Fixed: `previousLabel`/`nextLabel` are now the buttons' `aria-label` only; the visible
   glyph is a CSS-drawn chevron (the real icons aren't in the Icon registry — see §4).
2. **Current page has no filled background.** The pre-existing implementation filled the active
   page number with `background-primary` and inverted its text color. Live data shows the current
   page keeps the **same** text color/weight as every other page number (`Text/text-default`
   `#161616`, `Text md/Regular`) — the only distinguishing mark is a small rounded **underline bar**
   (`Selector`, `background-primary` `#1b8354`, 3px tall, centered) beneath the number. Fixed:
   replaced the filled-background treatment with the underline indicator.
3. **The overflow ("…") item has a visible border**, not a bare unstyled ellipsis. Live data shows
   a 1px solid `border-black` `#161616` box around the "…" text, matching the same box shape as a
   real page-number item. Fixed: added the border; kept it non-interactive (`aria-hidden`,
   `<li>` not `<button>`) since Figma gives no evidence it's clickable.
4. **Three distinct sizes exist** (Large 40px / Medium 32px / Small 24px item boxes, with their
   own icon size, padding, and underline-indicator width) — the pre-existing implementation had
   only one, non-Figma-verified sizing. Fixed: added a `size` prop (`'sm' | 'md' | 'lg'`, default
   `'md'`) with all three densities' exact live-verified dimensions.

## 2. Sizing Table (all live-verified)

| Size | Item box | Icon | Text | Padding | Underline width | Underline height |
|---|---|---|---|---|---|---|
| Large (`lg`) | 40×40px | 24px | `text-md` 16px/24 | 8px | 24px | 3px |
| Medium (`md`) | 32×32px | 20px | `text-md` 16px/24 (shares Large's text size — live-verified, not a typo) | 6px | 24px | 3px |
| Small (`sm`) | 24×24px (min-width, height fixed) | 16px | `text-sm` 14px/20 | 4px | 16px | 3px |

Radius is `radius-sm` (4px) on every size (Medium's own `pagination-Item-md-radius` variable
resolves to the identical 4px value).

## 3. Colors (live-verified via `get_variable_defs`)

| Token | Value | Used for |
|---|---|---|
| `Text/text-default` | `#161616` | Page-number text (every state — current page is NOT recolored) |
| `Background/background-primary` | `#1b8354` | Current-page underline indicator |
| `Border/border-black` | `#161616` | Overflow "…" item border |
| `Icon/icon-default` | `#161616` | Previous/Next icon (approximated — see §4) |

## 4. Needs Confirmation

1. **Icon glyphs not implemented.** `arrow-left-01` (node `13758:241766`) and `arrow-right-01`
   (node `13758:241790`) are named in Figma's component descriptions but are not present in this
   project's Icon registry (`frontend/src/design-system/primitives/Icon/registry/` has no
   `navigation`/`arrows` category at all). Approximated with a CSS-drawn chevron (border-corner
   technique, `currentColor`), mirrored under RTL via the same `:dir(rtl)` pattern `Icon`'s own
   `data-mirror-rtl` uses — same category as every other approved component's icon-pipeline gap.
2. **Overflow item interactivity** — Figma shows no interaction annotation distinguishing whether
   the bordered "…" item is meant to be clickable (e.g. jump N pages) or purely decorative. Kept
   non-interactive (matching the pre-existing behavior) since inventing a jump-N-pages interaction
   would not be verifiable against Figma.
3. **Default size** — Figma names all three sizes as peers with no marked "default" variant;
   `'md'` was chosen as this component's default for consistency with this repo's other sized
   primitives (Select, TextInput), not because Figma marks it as such.
