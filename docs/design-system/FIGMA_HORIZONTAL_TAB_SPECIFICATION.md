# Figma Horizontal Tab / Horizontal Tab List — Official Specification

**Source of truth:** Figma file `J0xq7JG3JKshRDzrgAM7E0` ("Components Library - Platforms Code
(Community)"), category "Selection & Wayfinding":
- **Horizontal Tab** (CMP-09), component set node `30150:125017` — 68 variants
  (`rtl` × `state`[Default/Hovered/Pressed/Focused/Disabled] × `size`[Small/Medium/Large] ×
  `selected`, plus a separate `moreTab`=Yes axis with `state`[Closed/Open] × `rtl`, Medium only).
- **Horizontal Tab List** (CMP-09), component set node `30150:125364` — 10 variants
  (`rtl` × `size`[Small/Medium/Large] × `tabIcons` × `flush`).

**Registry:** both rows already had `nodeId`/`figmaUrl` populated (`nodeResolutionStatus:
"pending"` — a workflow-progress marker, not a discovery blocker; per `CLAUDE.md`'s Official Figma
Node Resolution Policy the stored node was used directly, no `search_design_system` call was
made). Live-verified this pass via `get_metadata` + `get_design_context` (`disableCodeConnect:
true`) + `get_variable_defs`; both flipped to `"resolved"` on success.

**Design documentation:** https://design.dga.gov.sa/guidelines/components/navigational/tabs

Extracted via read-only Figma MCP tools only (`get_metadata`, `get_design_context`,
`get_variable_defs`) per `CLAUDE.md`'s Figma MCP Policy. The Horizontal Tab component set is large
enough that a single `get_design_context` call on the whole set truncates at 100,000 characters
(same behavior previously documented for Button's 1,344-variant set) — `get_metadata` was used
first to enumerate every child variant node, then individual `get_design_context` calls targeted
the `moreTab` axis (not reached before truncation) and representative Tab List compositions.

---

## 1. Horizontal Tab — properties

| Property | Values | Notes |
|---|---|---|
| `rtl` | `False` / `True` | Controls physical icon/label order in the extracted markup (icon renders after the label in the RTL variant's JSX) — a static-mockup technique; real code achieves the same visual result via the document's native `dir="rtl"` bidi flip on a `display:flex` row, no manual reordering needed (confirmed against this repo's existing `Tabs` implementation and `Pagination`/`Steps`' own precedent). |
| `selected` | boolean | Active vs. inactive tab. |
| `size` | `Small` / `Medium` / `Large` | Independent padding/height per size (see §2). |
| `state` | `Default` / `Hovered` / `Pressed` / `Focused` / `Disabled` | Interaction state. A separate `Closed`/`Open` pair exists only when `moreTab=Yes` (see §5). |
| `icon` | boolean | Shows/hides a 16×16 leading icon (sample glyph: `home-05`, already in this repo's Icon registry). |
| `swapIcon` | slot | Consumer-supplied icon override — maps 1:1 to this repo's existing generic `icon: ReactNode` slot pattern (Button, Card, etc.); no new API needed. |
| `moreTab` | boolean | Renders an icon-only overflow-trigger shell instead of a text tab (see §5). |
| `textEn` / `textAr` | string | Figma's dual-language mock-content mechanism — real code takes one consumer-supplied `label: ReactNode`, unchanged from the existing API. |

No badge/count sub-element exists on this component in any of the 68 sampled variants — **not
implemented**, per `CLAUDE.md`'s "do not invent variants" rule.

## 2. Sizing (all live-verified via `get_design_context` + `get_variable_defs`)

| Size | Padding | Height | Icon | Gap (icon↔label) | Indicator inset |
|---|---|---|---|---|---|
| Large (`lg`) | `16px` uniform (`Tab/horizontal-tab-md-button-h-padding` reused on all 4 sides — live-verified, not a typo) | 52px | 16×16px | `Tab/tab-button-gap` 4px | 16px (`spacing-xl`) |
| Medium (`md`) | inline 16px / block 12px | 44px | 16×16px | 4px | 16px (`spacing-xl`) |
| Small (`sm`) | inline 12px / block 8px | 36px | 16×16px | 4px | 12px (`spacing-lg`) |

Radius: `Radius/radius-sm` (4px) default — reuses the already-shared `--fads-sys-radius-sm`.
Focused state radius shrinks to `Radius/radius-xs` (2px) — see §4.

## 3. Typography & color (live-verified via `get_variable_defs`)

| Token | Value | Used for |
|---|---|---|
| `Text/text-default` | `#161616` | Selected tab label + leading icon |
| `Text/text-primary-paragraph` | `#384250` | Unselected tab label + leading icon (`Icon/unselected-tab-icon` is the same `#384250`) |
| `Global/text-default-disabled` / `Global/icon-default-disabled` / `Global/border-disabled` | `#9da4ae` | Disabled label + icon + indicator, uniformly regardless of `selected` |
| `Border/border-primary` | `#1b8354` | Selected indicator bar (Default/Hovered/Pressed/Focused) |
| `Border/border-black` | `#161616` | Unselected-tab **preview** indicator bar shown on Hover/Pressed (see §4); also the Focused double-ring inner border |
| `Border/border-white` | `#ffffff` | Focused double-ring outer ring |
| `Button/button-background-neutral-hovered` | `#f3f4f6` | Unselected + Hovered background |
| `Button/button-background-neutral-pressed` | `#e5e7eb` | Unselected + Pressed background |
| Font | IBM Plex Sans Arabic, `text-sm` (14px / 20px line-height) | Selected = **Bold** (700); unselected = **Medium** (500) — weight is the sole typographic distinguisher, no size change |

## 4. States (per size × rtl × selected — live-verified)

- **Selected + Default/Hovered/Pressed**: visually **identical** — bold `#161616` text/icon, green
  (`#1b8354`) 3px indicator bar. Figma gives the already-active tab no extra hover/press affordance.
- **Unselected + Default**: medium `#384250` text/icon, no background, no indicator.
- **Unselected + Hovered**: adds `#f3f4f6` background + `cursor:pointer` + a **black** (`#161616`,
  not green) 3px preview indicator bar — a real, distinct "about to become active" affordance the
  pre-existing implementation had no equivalent for.
- **Unselected + Pressed**: same preview indicator, background becomes `#e5e7eb`.
- **Focused** (keyboard focus-visible), selected or not: a double-ring identical in construction to
  the already-Approved `Button`'s own focus treatment — a 3px solid `#161616` border directly on
  the tab (radius shrinks to `radius-xs` 2px), plus a separate 1px white ring offset `-1px` at
  `radius-sm` (4px). Selected+Focused keeps its green indicator; unselected+Focused has none.
- **Disabled**: uniform `#9da4ae` for text, icon, and indicator (when `selected`); no background
  change, no hover/press affordance (native `disabled` semantics).

## 5. The `moreTab` overflow trigger

Only `size=Medium` was sampled (nodes `30150:125354/56/58/60`, `rtl` × `state`[Closed/Open]).
Structure: the same 44px-tall/16px-h-padding/12px-v-padding tab shell as a regular Medium tab, but
containing a single icon-only 32×32px "Button" sub-part with a 20px `more-horizontal` (⋯) icon —
no visible text. `Closed` and `Open` render **pixel-identical** in the sampled nodes (no hover/
press/focus/disabled sub-states were exposed on this axis either) — flagged **Needs Confirmation**,
non-blocking, same category as `Pagination`'s "whether the overflow item is interactive."

`more-horizontal` is not in this repo's Icon registry (same category of gap as `Pagination`'s
`arrow-left-01`/`arrow-right-01` and `TrailingIcon`'s `mic-01`) — approximated with a CSS-drawn
three-dot glyph (`currentColor`, symmetric so it needs no RTL mirroring), same disclosed-substitute
technique as Pagination's chevrons.

Figma gives no evidence of what opens when this trigger is activated (no dropdown/menu content in
any sampled node) — this pass implements the trigger's **visual shell only**; wiring it to an
actual overflow menu is left to the consumer (`onOverflowTriggerClick`), same scope boundary as
Table's unverified `footer` slot.

## 6. Horizontal Tab List — properties

| Property | Values | Notes |
|---|---|---|
| `rtl` | `False` / `True` | See §1 — native bidi flip, no manual DOM reordering. |
| `size` | `Small` / `Medium` / `Large` | Propagates to every child Horizontal Tab. |
| `tabIcons` | boolean | Toggles the leading icon on every child tab at once. |
| `flush` | boolean | See below. |
| `divider` (not a sampled variant axis, but present as a boolean prop in every sampled node's own generated type, default `true`) | boolean | Full-width baseline divider (see below). |

**Structure (live-verified across Medium/Small, LTR/RTL, Flush True/False):**
- Tabs sit in a plain `display:flex; align-items:center` row with **no extra gap between tabs** —
  spacing comes only from each tab's own horizontal padding. The pre-existing implementation added
  a `flex-wrap: wrap` + inter-tab `gap` that has no basis in the live component — both removed.
- **`divider`**: a full-width absolute baseline, 3px tall, `Border/border-neutral-primary`
  (`#d2d6db`), `radius-full`, positioned at the bottom of the whole list, layered **behind**
  (z-index below) each tab's own per-tab selection-indicator bar. The pre-existing implementation
  had no equivalent element at all — a real, missing piece of chrome.
- **`flush`**: shifts the tab row toward the layout-start edge by exactly the active size's own
  horizontal padding (e.g. 16px at Medium), clipped by the container, so the **first tab's label**
  — not its invisible padding — touches the container's edge. A real, verified prop; implemented
  via a logical negative `margin-inline-start` on the tab row (auto-mirrors under `dir="rtl"`).
- The `moreTab` trigger (§5), when present, is always the trailing item in the tabs row (DOM-last
  under LTR; under RTL the sampled composition uses `justify-end` with reversed DOM order to
  achieve the same *visual* trailing position — real code relies on the native bidi flex-reversal
  instead, so no DOM reordering is needed here either, consistent with §1).
- No background color, border, or shadow on the Tab List container itself — fully transparent
  except for the divider baseline.

## 7. Needs Confirmation

1. **`moreTab` Closed vs. Open visual difference** — pixel-identical in the two sampled nodes; no
   hover/press/focus/disabled sub-states sampled on this axis (§5).
2. **`more-horizontal` icon glyph** — not in the Icon registry; CSS-drawn substitute used (§5).
3. **`flush` at `Small` size and combined with RTL** — only Medium/Small `flush=True` (LTR) and
   Medium `flush=False` (RTL) were directly sampled; Large `flush=True` and any RTL+`flush=True`
   combination are extended by analogy (same negative-offset mechanism, size-appropriate padding
   value), not independently re-sampled.
4. **Overflow/scroll behavior beyond the `moreTab` trigger** — Figma shows no wrapping or
   scrolling variant for a tab list that overflows its container; this pass implements a real,
   standard `overflow-x: auto` single-row scroll on the Tab List container (never `flex-wrap`) as
   the safe, non-invented interpretation, and does not attempt to reproduce a specific
   auto-collapse-to-`moreTab` algorithm since Figma provides no evidence of one.
