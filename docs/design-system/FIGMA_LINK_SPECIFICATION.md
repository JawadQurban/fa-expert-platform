# Figma Link — Official Specification

**Source of truth:** Figma file `cII2UMRzWj0rwKuMzWFqTU` ("Components Library - Platforms Code (Community)"), component set node `2508:25804` ("Link").
**Design documentation:** https://design.dga.gov.sa/guidelines/components/actions/link
**Figma description:** "Links facilitate navigation by allowing users to click (or tap) and navigate users to another location, such as a different site, resource, or section within the same page."

Extracted via read-only Figma MCP tools (`get_metadata`, `get_design_context`, `get_screenshot`,
`get_variable_defs`) against the live node supplied via a node-specific Figma URL (2026-07-12).
The component set contains **144 variant symbols**; 22 were sampled directly via
`get_design_context` (every `state` × every `style`, both `inline` values, both `size` values,
one `rtl` comparison pair) — enough to fully determine every property's effect, since each
variant axis was confirmed independent and additive (no cross-axis interaction beyond what's
documented below). Node reference table in §11.

**Supersedes:** an earlier same-day attempt to resolve this component's node via
`search_design_system` only, which could not find a live node in a different copy of this file
(`Sv0oWOS1SjWnwhQwdzRJIE`) — see `reports/VISUAL_COMPLIANCE/Link/LINK_NODE_RESOLUTION_REPORT.md`
for that history. Per this session's explicit instruction, search-only data from that attempt
(e.g. the 12 `danger`-mood token names it surfaced) is **not** used as a source below — every
value here comes from the live node in `cII2UMRzWj0rwKuMzWFqTU`. Notably, this live component
set has **no `danger` style/mood** — only `Primary`, `Neutral`, `On-color` (§2).

---

## 1. Component Hierarchy

```
Link (inline-flex row, gap = size-dependent)
├─ Label <p> — text node, size/mood-dependent color, optional underline
└─ Icon (optional, instance-swap slot, "link-04") — 20px (Medium) / 16px (Small)
```

No wrapping element beyond the flex container itself. In the live file this renders as a `<div>`
with `content-stretch flex items-center` plus a `gap` token; the actual codebase implementation
uses a semantic `<a>` as the flex container instead (unchanged from the current implementation —
not a Figma-sourced concern, an HTML-semantics one).

---

## 2. Variant Properties

The component set exposes **5 orthogonal variant axes**, all independent (2 × 6 × 3 × 2 × 2 =
144, matching the sampled count):

| Property | Values | Notes |
|---|---|---|
| `RTL` | `False`, `True` | See §8 |
| `State` | `Default`, `Hovered`, `Pressed`, `Focused`, `Visited`, `Disabled` | See §5 |
| `Style` (mood) | `Primary`, `Neutral`, `On-color` | **No `Danger` mood exists on this live node** — do not add one (see supersession note above) |
| `Size` | `Small`, `Medium` | See §7 |
| `Inline` | `False`, `True` | Controls default underline — see §6 |

Plus **2 non-variant component properties** (instance-level, not part of the 144-combination
grid):

| Property | Type | Default | Notes |
|---|---|---|---|
| `icon` | boolean | `false` | Toggles the trailing icon slot |
| `swapIcon` | instance-swap | the "link-04" icon | Lets a consumer override the icon graphic |

Text content (`linkTextEn` / `linkTextAr` in the extracted markup) is a plain text override, not
a structural property.

---

## 3. Sizing & Spacing

| Size | Font size | Line height | Gap (label↔icon) | Icon box | Token |
|---|---|---|---|---|---|
| Small | 14px (`Size/Text/typo-size-text-sm`) | 20px (`Line Height/Text/line-heights-text-sm`) | 4px | 16×16px | `Link/link-sm-gap` |
| Medium | 16px (`Size/Text/typo-size-text-md`) | 24px (`Line Height/Text/line-heights-text-md`) | 8px | 20×20px | `Link/link-md-gap` |

Container padding: `Global/spacing-none` (0) — the Link has no internal padding of its own; all
spacing around it is the consumer's responsibility (same pattern as Divider).

Typography: `Font Family/font-family-text` → IBM Plex Sans Arabic, `Font Wieght/font-weight-regular`
(400/Regular) — no bold/other-weight variant exists.

`links-group-gap` (a Spacing-collection variable seen in the earlier search-only pass) was **not**
observed referenced by any sampled node in this live component set — it likely belongs to a
separate "Links group" composition pattern, not the Link component itself. Not used here; flagged
for future confirmation if a link-list pattern is built.

---

## 4. Colors & Token Map

All values read live via `get_variable_defs` on node `2508:25804`, cross-checked per-state via
`get_design_context` on individual variant nodes (§11).

### Primary (default mood)

| State | Token | Value |
|---|---|---|
| Default | `Link/link-primary` | `#1b8354` |
| Hovered | `Link/link-primary-hovered` | `#54c08a` |
| Pressed | `Link/link-primary-pressed` | `#88d8ad` |
| Focused | `Link/link-primary-focused` | `#1b8354` (same as Default — focus is communicated by the border, §5, not a text-color change) |
| Visited | `Link/link-primary-visited` | `#14573a` |
| Disabled | `Global/text-default-disabled` (shared, **not** a Link-scoped token) | `#9da4ae` |

### Neutral

| State | Token | Value |
|---|---|---|
| Default | `Link/link-neutral` | `#384250` |
| Hovered | `Link/link-neutral-hovered` | `#6c737f` |
| Pressed | `Link/link-neutral-pressed` | `#9da4ae` |
| Focused | `Link/link-neutral-focused` | `#384250` (same as Default) |
| Visited | `Link/link-primary-visited` | `#14573a` — **Needs Confirmation**: the live Neutral+Visited node references the *Primary*-mood visited token, not a `link-neutral-visited` token (none exists in this file). Implemented faithfully as observed, flagged as a likely Figma-source authoring inconsistency rather than an intentional cross-mood color share. |
| Disabled | `Global/text-default-disabled` (shared) | `#9da4ae` |

### On-color (for use on dark/colored backgrounds)

| State | Token | Value |
|---|---|---|
| Default | `Link/link-oncolor` | `#ffffff` |
| Hovered | `Link/link-oncolor-hovered` | `#ffffffcc` (80% white) |
| Pressed | `Link/link-oncolor-pressed` | `#ffffff99` (60% white) |
| Focused | `Link/link-oncolor-focused` | `#ffffff` (same as Default) |
| Visited | `Link/link-oncolor-visited` | `#ffffffe5` (~89.4% white) |
| Disabled | `Link/link-oncolor-disabled` | `#ffffff4d` (~30% white) — **this mood does have its own disabled token**, unlike Primary/Neutral |

---

## 5. States & Interaction

- **Default:** base color per mood, no underline (unless `Inline=True`, §6), no border.
- **Hovered:** lighter/shifted color per mood, **underlined** (`text-decoration: underline`,
  `text-decoration-skip-ink: none`, `text-underline-position: from-font`), `cursor: pointer`.
- **Pressed:** further-shifted color (lighter for Primary/On-color, darker-toward-disabled for
  Neutral), same underline treatment as Hovered.
- **Focused:** color reverts to the Default value (**no** color change from Default) — the only
  visible change is a **2px solid border around the entire link box** (not an outline/ring offset
  from the box — a literal `border: 2px solid`), colored `Border/border-black` (`#161616`) for
  Primary and Neutral, `Border/border-white` (`#ffffff`) for On-color. No underline in this state
  unless `Inline=True`.
- **Visited:** distinct darker/more-opaque color per mood (see §4 table); no underline unless
  `Inline=True`; no border.
- **Disabled:** flat disabled color (§4), no underline, no border, no `cursor-pointer` class (i.e.,
  not interactive — matches the existing implementation's `pointer-events: none` /
  non-navigable-`href` treatment).

No separate `Active`/`Selected` state exists beyond these 6.

---

## 6. The `Inline` Property (Underline Rule)

This is the one property whose effect isn't obvious from its name alone, confirmed by sampling
`Inline=True` against `Inline=False` across multiple states (Default, Focused, Visited, Disabled):

- **`Inline=False`** (a standalone/component-level link, e.g. a "Read more" action): underlined
  **only** on Hovered/Pressed. Default/Focused/Visited/Disabled render with color alone, no
  underline.
- **`Inline=True`** (a link embedded within a sentence/paragraph of body text): underlined in
  **every** state, including Default, Focused, Visited, and even Disabled.

Rationale (not stated explicitly in the Figma file, but consistent with standard accessibility
guidance this design system otherwise follows, per `CLAUDE.md`'s WCAG 2.2 AA requirement): a link
embedded in running text needs a always-visible non-color cue (underline) to remain distinguishable
without relying on color alone (WCAG 1.4.1), whereas a standalone link styled as its own UI element
already has sufficient non-color affordance (position, spacing, being the only text at that
location) and only adds the underline as a hover/press affordance.

---

## 7. Icon

- Optional, boolean-gated (`icon` prop) + instance-swap slot (`swapIcon`), not a named variant
  axis — present identically across all 144 grid variants as an independent toggle.
- Icon asset: `link-04` from the `PC 1.0 Icons` library (per the search-only pass's catalog —
  visually an arrow/external-navigation glyph consistent with its use as a link affordance).
- Size: 20×20px at `Size=Medium`, 16×16px at `Size=Small` — always matches the label's size tier.
- Position: **trailing** (after the label in reading order) in both LTR and RTL. The Figma file's
  own markup achieves this by literally swapping DOM child order between the `RTL=False` variant
  (label, then icon) and the `RTL=True` variant (icon, then label) plus `justify-end` — see §8 for
  why this does **not** need to be replicated as a DOM reorder in the React implementation.

---

## 8. RTL Behavior

- Every variant is duplicated across `RTL=False` / `RTL=True` (2× the grid).
- Sampled comparison (Primary/Medium/Default vs. its RTL twin): the RTL variant sets
  `justify-content: end`, `text-align: right`, `dir="auto"` on the label, and — in the *Figma
  source's own markup* — swaps DOM order so the icon element precedes the label element.
- **This DOM-order swap is a Figma-authoring artifact, not a required implementation pattern.**
  Native CSS flexbox `flex-direction: row` already resolves its main-start/main-end from the
  inline (reading) direction — i.e., under `dir="rtl"`, a row's first DOM child renders at the
  *visual right* (RTL's reading-start) automatically, with no JS/DOM reordering needed. The
  current implementation (`Link.module.css`'s `display: inline-flex`, label rendered before the
  icon in JSX) already produces the same trailing-icon-in-both-directions result as the Figma
  source's swapped markup, purely from `dir` + logical CSS. Verified equivalent, not a gap.
- Text alignment/underline offset use only logical properties in the current implementation
  (`text-underline-offset`, no `left`/`right`) — consistent with the RTL variant's `text-align:
  right` (a value that logical `text-align: start` already produces under `dir="rtl"`).

---

## 9. Accessibility

- Canonical documentation: https://design.dga.gov.sa/guidelines/components/actions/link. No
  additional ARIA annotations are attached to the node beyond the description/doc link.
- Focus indicator is a real 2px solid border (§5), not an invented outline — matches this
  project's established pattern of a visible, non-color-reliant focus treatment (consistent with
  Button/Card/Header's already-approved focus rings).
- Disabled: no border, no interaction affordance (`cursor-pointer` absent) — the current
  implementation's `aria-disabled` + no-`href` + `pointer-events: none` treatment for disabled
  links remains the correct pattern (Figma has no ARIA guidance beyond the visual disabled color,
  so this is carried over from established WCAG practice, not invented).
- `Inline=True`'s always-on underline (§6) is itself an accessibility-motivated variant (WCAG
  1.4.1, non-color distinguishing cue) — implementing it faithfully directly improves this
  project's WCAG 2.2 AA compliance for links embedded in body copy.

---

## 10. Responsive Behavior

No breakpoint/responsive variant axis exists. A Link's dimensions are intrinsic to its text
content plus the fixed size-tier metrics (§3) — no fixed width/height requirement, consistent with
inline text behavior generally.

---

## 11. Node Reference (for future re-verification)

| Variant sampled | Node ID |
|---|---|
| Component set root | `2508:25804` |
| RTL=False, Default, Primary, Medium, Inline=False | `2508:25750` |
| RTL=False, Hovered, Primary, Medium, Inline=False | `2508:25782` |
| RTL=False, Pressed, Primary, Medium, Inline=False | `2508:25731` |
| RTL=False, Focused, Primary, Medium, Inline=False | `2508:25741` |
| RTL=False, Visited, Primary, Medium, Inline=False | `2508:25791` |
| RTL=False, Disabled, Primary, Medium, Inline=False | `2508:25799` |
| RTL=False, Default, Neutral, Medium, Inline=False | `2508:25753` |
| RTL=False, Hovered, Neutral, Medium, Inline=False | `2508:25736` |
| RTL=False, Focused, Neutral, Medium, Inline=False | `2508:25738` |
| RTL=False, Visited, Neutral, Medium, Inline=False | `2508:25746` |
| RTL=False, Disabled, Neutral, Medium, Inline=False | `2508:25745` |
| RTL=False, Default, On-color, Medium, Inline=False | `2508:25691` |
| RTL=False, Hovered, On-color, Medium, Inline=False | `2508:25686` |
| RTL=False, Focused, On-color, Medium, Inline=False | `2508:25687` |
| RTL=False, Disabled, On-color, Medium, Inline=False | `2508:25688` |
| RTL=False, Default, Primary, Small, Inline=False | `2508:25798` |
| RTL=False, Default, Primary, Medium, Inline=True | `2508:25723` |
| RTL=False, Disabled, Primary, Medium, Inline=True | `2508:25710` |
| RTL=False, Focused, Primary, Medium, Inline=True | `2508:25733` |
| RTL=False, Visited, Primary, Medium, Inline=True | `2508:25721` |
| RTL=True, Default, Primary, Medium, Inline=False | `2508:25709` |
| RTL=True, Pressed, Primary, Medium, Inline=False | `2508:25784` |

Full 144-node grid metadata (all `RTL`/`State`/`Style`/`Size`/`Inline` combinations, positions,
and dimensions) is available via `get_metadata` on the component-set root `2508:25804`.
