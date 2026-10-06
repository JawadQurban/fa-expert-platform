# Figma Rating — Official Specification

**Source of truth:** Figma file `J0xq7JG3JKshRDzrgAM7E0` ("Components Library - Platforms Code (Community)"), component set node `30150:69520` ("Rating"), with sub-component `_RatingStar` at node `30150:69453`.
**Design documentation:** Needs Confirmation (no `design.dga.gov.sa` URL surfaced by the live data for this component).
**Figma description:** Needs Confirmation (no component description string was present on the root node).

Extracted via read-only Figma MCP tools (`get_design_context`, `get_metadata`, `get_variable_defs`).

---

## 1. Component Hierarchy

```
Rating (root)
└─ _RatingStar × N (one per star, `max` count)
```

`Rating`'s own variant axes are `size`[Large/Medium/Small] and `brand`
(Default gold vs. Brand green). Each individual `_RatingStar` sub-component
carries its own richer axis set: `size`[Large/Medium/Small] ×
`state`[Normal/Half/Selected/Pressed] × `style`[Default/Brand] — 24
variants total.

---

## 2. Interactive vs. Read-Only: Two Real Modes, Not One

Directly sampling the `_RatingStar` **Pressed** state (node `30150:69470`)
confirmed each star renders as a real, independently-focusable `<button>`
in the live data — this is a genuine **interactive rating input**, not a
decorative display. At the same time, the **Half** state exists specifically
to render a half-filled star, which is only meaningful for a non-interactive
*aggregate/average* score display (a user's own click can only ever commit a
whole star).

The implementation therefore has two modes, selected by whether `onChange`
is supplied:

- **Interactive** (`onChange` given): renders one real `<button>` per star,
  `aria-pressed` reflecting selection, `onClick` committing a whole-star
  value. No half-star rendering — not reachable via user interaction.
- **Read-only** (`onChange` omitted): renders a single `role="img"` group
  with an `aria-label` summarizing the numeric value (or a caller-supplied
  `label`), supporting `.5` fractional values via the half-star clip
  technique (see §4). Individual stars are `aria-hidden`, since the group's
  own label already conveys the full value.

---

## 3. Hand-Authored Star Glyph — Icon Registry Gap

No star icon exists anywhere in the FADS icon registry (checked, among
others, the already-imported `Shapes` category specifically) — unlike this
project's earlier icon-registry gaps (e.g. `TrailingIcon`'s `mic-01`,
`DropdownListItem`/`MenuListItem`'s `tick-02`/`arrow-right-02`), which had
reasonable existing substitutes to fall back on, a rating component has no
substitute for its own defining shape. Importing a whole new icon category
for a single glyph would be disproportionate scope creep.

Following the same precedent already established for `Checkbox`'s own
hand-authored checkmark path, `Rating` hand-authors a simple 5-point star
`<path>` inline (`STAR_PATH` in `Rating.tsx`), colored via CSS classes
(`fill`) rather than `currentColor`, since a half-filled star needs two
independently colored overlaid paths (empty background + filled
foreground) in the same glyph.

---

## 4. Half-Star Rendering — CSS `clip-path` Overlay

Rather than requiring a separate baked "half-star" icon asset, a half-filled
star reuses the exact same star path twice: an empty-colored base path, and
a filled-colored path clipped to its left 50% via an SVG `<clipPath>`
(a `<rect x="0" y="0" width="12" height="24">` over the 24×24 viewBox). This
reproduces the live data's own `Half` state visually (a half-filled star)
without inventing a new visual — a disclosed implementation technique, not
an invented one.

---

## 5. No RTL Variant — Confirmed by Absence

Both `Rating`'s and `_RatingStar`'s own Figma-extracted prop lists
(`RatingProps`/`RatingStarProps`) contain **no `rtl` prop at all** — checked
directly, not assumed either way. Star order is therefore fixed
left-to-right regardless of document direction, matching the common
real-world convention that rating widgets do not mirror under RTL.

---

## 6. Byte-Identical / Reused Tokens

`get_variable_defs` on both the `Rating` root and `_RatingStar` sub-component
confirmed the following live color values, none of which needed new
one-off hex values invented:

| Token | Value | Source |
|---|---|---|
| `--fads-sys-rating-star-empty` | `#e5e7eb` | `Background/background-neutral-200` |
| `--fads-sys-rating-star-filled` | `#dba102` | `Background/background-secondary` (Default/gold) |
| `--fads-sys-rating-star-filled-brand` | `#1b8354` | `Background/background-primary` (Brand/green) |
| `--fads-sys-rating-hover-bg` | `#f3f4f6` | `Background/background-neutral-100` |

Star gap spacing reuses the already-shared generic
`--fads-sys-space-inset-xs` token; the interactive hover/press circle radius
reuses the already-shared generic `--fads-sys-radius-full` token; the focus
ring reuses the already-shared generic `--fads-sys-border-width-thick`/
`--fads-sys-focus-ring-color` tokens — none of these needed a new
Rating-specific token.

## 7. New Size Tokens

| Token | Value | Source |
|---|---|---|
| `--fads-sys-rating-star-size-sm` | `24px` | Live-verified `Small` size star dimensions |
| `--fads-sys-rating-star-size-md` | `32px` | Live-verified `Medium` size star dimensions |
| `--fads-sys-rating-star-size-lg` | `48px` | Live-verified `Large` size star dimensions |

---

## 8. Node Reference

| Item | Node ID |
|---|---|
| Component set root (`Rating`) | `30150:69520` |
| `_RatingStar` sub-component | `30150:69453` |
| `_RatingStar` — `Pressed` state (sampled directly to confirm interactivity) | `30150:69470` |

---

## 9. Deviations, Extensions, and Needs-Confirmation Items

1. **Dual-mode architecture (interactive input vs. read-only display)** — see §2. Not a Figma-visible variant axis; a necessary implementation split driven directly by the live `Pressed`/`Half` state evidence.
2. **Hand-authored star glyph** — see §3. Same category of choice as `Checkbox`'s own hand-authored checkmark.
3. **`clip-path` half-star overlay** — see §4. Implementation technique, not an invented visual.
4. **No RTL mirroring** — see §5. Confirmed by prop-list absence, not assumed.
5. **Design documentation URL and Figma component description** — Needs Confirmation; neither surfaced in the live data for this node.
