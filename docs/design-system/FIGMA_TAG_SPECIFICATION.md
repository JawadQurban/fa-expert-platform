# Figma Tag — Official Specification

**Source of truth:** Figma file `Sv0oWOS1SjWnwhQwdzRJIE` ("Components Library - Platforms Code (Community)"), component set node `421:110968` ("Tag") — already resolved in `frontend/src/design-system/registry/figma-component-map.json` prior to this pass; no `search_design_system` call was needed (per the registry's node-resolution policy).
**Design documentation:** https://design.dga.gov.sa/guidelines/components/search-and-filters/tags
**Figma description:** "Tags visually convey important information or actions related to components. They use brief text, color, and icons to offer quick insights or alerts to users. Positioned near relevant content, tags grab attention and aid comprehension."

Extracted via read-only Figma MCP tools (`get_metadata`, `get_design_context`, `get_variable_defs`) against the registry-resolved node. The component set contains **288 variant symbols** (2 `RTL` × 3 `Size` × 6 `Style` × 2 `Outline` × 2 `Rounded` × 2 `Icon only`); 14 were sampled directly via `get_design_context`, covering every `Style` at `Size=Medium`, both `Outline` values, both `Size` extremes (x Small/Small), `Rounded=True`, `Icon only=True`, and an `RTL=True` comparison — enough to fully determine every axis's effect, since each axis was confirmed structurally independent (no cross-axis interaction beyond what's documented below).

---

## 1. Component Hierarchy

```
Tag (inline-flex row, centered, size-dependent gap/height/padding)
├─ Lead icon (optional, instance-swap slot, "alert-02" sample icon) — size-dependent
├─ Label <p> — text node, mood/size-dependent color+typography (omitted when Icon only=True)
└─ Trail icon (optional, instance-swap slot) — size-dependent
```

No wrapping element beyond the flex container itself. `Icon only=True` variants drop the label
and the second icon slot entirely, becoming a single centered square icon swatch.

---

## 2. Variant Properties

**6 orthogonal variant axes**, all independent (2 × 3 × 6 × 2 × 2 × 2 = 288, matching the node
count):

| Property | Values | Notes |
|---|---|---|
| `RTL` | `False`, `True` | See §8 |
| `Size` | `x Small`, `Small`, `Medium` | See §3 |
| `Style` (mood) | `Neutral`, `Success`, `Error`, `Warning`, `Info`, `On-Color` | **No `Primary` style exists on this live node** — see §12 |
| `Outline` | `False`, `True` | See §5 |
| `Rounded` | `False`, `True` | `False` → `radius-sm` (4px); `True` → `radius-full` (pill, 9999px) |
| `Icon only` | `False`, `True` | See §7 |

Plus **2 non-variant, independent boolean component properties** (present identically across
every one of the 288 grid variants, not part of the combinatorics above):

| Property | Type | Default (sampled) | Notes |
|---|---|---|---|
| `leadIcon` | boolean | `true` | Toggles the leading icon slot (+ `swapLeadIcon` instance-swap override) |
| `trailIcon` | boolean | `false` | Toggles the trailing icon slot (+ `swapTrailIcon` instance-swap override) |

A Tag can carry a lead icon, a trail icon, both, or neither — these are independent slots, not a
single "has an icon" toggle. `Icon only=True` variants expose only a single icon slot
(`swapLeadIcon`, no label, no `trailIcon`/`swapTrailIcon`).

Text content (`labelEn` / `labelAr` in the extracted markup) is a plain text override, not a
structural property.

---

## 3. Sizing & Spacing

| Size | Height | Padding-inline | Gap (icon↔label) | Icon box | Font size / line-height | Font weight |
|---|---|---|---|---|---|---|
| `x Small` | 20px | 8px (`Global/spacing-md`) | 4px (`Global/spacing-xs`) | 10×10px | 10px / 14px (`text-2xs`) | **600 / SemiBold** |
| `Small` | 24px | 8px (`Global/spacing-md`) | 4px (`Global/spacing-xs`) | 14×14px | 12px / 18px (`text-xs`) | 500 / Medium |
| `Medium` | 32px | 12px (`Global/spacing-lg`) | 4px (`Global/spacing-xs`) | 18×18px | 16px / 24px (`text-md`) | 500 / Medium |

Gap is uniform (4px) across all three sizes — only height, padding-inline, icon box, and
typography scale. **`x Small` uses SemiBold (600) while `Small`/`Medium` use Medium (500)** — a
deliberate legibility choice at the smallest size, verified live (not a typo/inconsistency to
"fix" toward uniform weight).

`Icon only=True` variants (§7) override padding-inline to `Global/spacing-xxs` (2px) and set
`inline-size = block-size` = the size's own height (a square), with `gap: 0`.

Container padding-block is always `Global/spacing-none` (0) — height is controlled entirely by
the fixed `height` value, not by padding.

---

## 4. Colors & Token Map

All values read live via `get_variable_defs` on node `421:110968`, cross-checked per-mood via
`get_design_context` on individual variant nodes (§11). Two structurally different color
patterns exist:

### Filled (`Outline=False`) — status moods (Neutral/Success/Error/Warning/Info)

Each has a **light background + light border + saturated text/icon** — background and border are
*different* tokens from each other (not the same color at different opacity):

| Mood | Background | Border (light) | Text | Icon |
|---|---|---|---|---|
| Neutral | `Tag/tag-background-neutral-light` `#f9fafb` | `Border/border-neutral-secondary` `#e5e7eb` | `Tag/tag-text-neutral` `#1f2a37` | `Icon/icon-default` `#161616` (**not** the text color — verified distinct) |
| Success | `Tag/tag-background-success-light` `#ecfdf3` | `Tag/tag-border-success-light` `#abefc6` | `Tag/tag-text-success` `#085d3a` | `Tag/tag-icon-success` `#085d3a` (same as text) |
| Error | `Tag/tag-background-error-light` `#fef3f2` | `Tag/tag-border-error-light` `#fecdca` | `Tag/tag-text-error` `#912018` | `Tag/tag-icon-error` `#912018` (same as text) |
| Warning | `Tag/tag-background-warning-light` `#fffaeb` | `Tag/tag-border-warning-light` `#fedf89` | `Tag/tag-text-warning` `#93370d` | `Tag/tag-icon-warning` `#93370d` (same as text) |
| Info | `Tag/tag-background-info-light` `#eff8ff` | `Tag/tag-border-info-light` `#b2ddff` | `Tag/tag-text-info` `#1849a9` | `Tag/tag-icon-info` `#1849a9` (same as text) |

### Outline (`Outline=True`) — same 5 moods

**No background** (transparent); border switches to a *stronger* mood-specific token (distinct
from the filled variant's light border); text/icon colors are unchanged from the filled variant:

| Mood | Border (strong) |
|---|---|
| Neutral | `Tag/tag-border-neutral` `#4d5761` |
| Success | `Tag/tag-border-success` `#067647` |
| Error | `Tag/tag-border-error` `#b42318` |
| Warning | `Tag/tag-border-warning` `#b54708` |
| Info | `Tag/tag-border-info` `#175cd3` |

### On-Color (for placement on a dark/colored surface) — structurally different from the other 5

| Outline | Background | Border | Text/Icon |
|---|---|---|---|
| `False` (filled) | `Tag/tag-background-on-color` `#ffffff33` (20% white) | **none** (no border at all — verified: filled On-Color has no border class in the live markup, unlike the other 5 moods' filled state) | `Text/text-oncolor-primary` / `Icon/icon-oncolor` `#ffffff` |
| `True` (outline) | none (transparent) | `Tag/tag-border-on-color` `#ffffff99` (60% white) | `#ffffff` (unchanged) |

**Verified, not guessed:** Neutral's icon color (`#161616`, the shared `Icon/icon-default` token)
is genuinely different from its text color (`#1f2a37`) — confirmed by `get_variable_defs`
returning both as distinct entries with no shared alias. Every other mood's icon token matches its
text token's value exactly (kept as separate tokens below for full traceability to their distinct
Figma variable names, even though the numbers coincide).

---

## 5. Outline Property

Toggles between the "filled" (light background + light/no border) and "outline" (transparent
background + strong-colored border) treatments described in §4. Text and icon color are
**unchanged** by this toggle for every mood — only background presence and border color/strength
change.

---

## 6. Rounded Property

`False` → `radius-sm` (4px, the shared `--fads-sys-radius-sm` token already used by
Button/Card/Divider/Link). `True` → `radius-full` (9999px, a full pill — the shared
`--fads-sys-radius-pill` token already used by Button's spinner). No new radius token needed;
reuses the existing shared SYS-level radius tokens directly (consistent with how Button and Link
already do for radius specifically — unlike color/spacing values, which get component-scoped
copies per this codebase's established convention).

---

## 7. Icon Only Property

When `True`: the label and the second icon slot (`trailIcon`) are dropped entirely; the remaining
single icon slot (`swapLeadIcon`) is centered in a **square** container whose side equals the
size's own `height` value (20/24/32px), with `padding-inline`/`padding-block` both set to
`Global/spacing-xxs` (2px) and `gap: 0`. Verified directly on the `Size=Medium, Style=Neutral`
node; the same square-sizing rule is applied by extension to `x Small`/`Small` and every other
mood, since `Icon only` is an orthogonal axis independent of `Size`/`Style` in the variant grid
(same reasoning already used for Divider's Vertical-orientation color extension).

---

## 8. RTL Behavior

- Every variant is duplicated across `RTL=False` / `RTL=True` (2× the grid).
- Sampled comparison (Neutral/Medium/filled, lead+trail icons both enabled): the Figma source's
  own markup **swaps DOM order** for the RTL variant — `[trailIcon, label, leadIcon]` instead of
  the LTR order `[leadIcon, label, trailIcon]` — plus `dir="auto"` on the label.
- **This DOM-order swap is a Figma-authoring artifact, not a required implementation pattern** —
  the identical conclusion already verified for `Link` (`docs/FIGMA_LINK_SPECIFICATION.md` §8).
  Native CSS flexbox `flex-direction: row` resolves its main-start/main-end from the inline
  (reading) direction: under `dir="rtl"`, a row's first DOM child renders at the visual right
  (RTL's reading-start) automatically. Keeping a **fixed** DOM order (`iconStart`, then label,
  then `iconEnd`) and relying only on the ancestor's `dir` attribute reproduces the same visual
  result as the Figma source's swapped markup, with no DOM reordering needed in code.
- No layout-affecting property differs between `RTL=False`/`True` beyond the (unnecessary-to-copy)
  DOM order — height/padding/gap/colors/typography are all identical.

---

## 9. Accessibility

- Canonical documentation: https://design.dga.gov.sa/guidelines/components/search-and-filters/tags.
  No ARIA annotations beyond the description/doc link are present in the Figma file itself.
- Tag is **non-interactive** (no `State` variant axis exists at all — no hover/pressed/focused
  variants anywhere in the 288-node grid, confirmed by the full `get_metadata` symbol dump).
  Renders as a plain `<span>`, consistent with the pre-existing implementation.
- Meaning must be carried by the text label, never color alone (WCAG 1.4.1) — already enforced by
  this codebase's own `CLAUDE.md`/DC-05 rule (status colors reserved for status, restated in the
  pre-existing `Tag.tsx` JSDoc) and unaffected by this pass's changes.
- `Icon only=True` tags have no visible text — same accessible-name gap Button already guards
  against for its own icon-only mode; the implementation should carry an equivalent dev-mode
  warning when no `aria-label`/`aria-labelledby` is supplied.

---

## 10. Responsive Behavior

No breakpoint/responsive variant axis exists. A Tag's width is intrinsic to its content
(label + optional icons) plus the fixed per-size metrics (§3) — no fixed-width requirement.

---

## 11. Node Reference (for future re-verification)

| Variant sampled | Node ID |
|---|---|
| Component set root | `421:110968` |
| RTL=False, Size=Medium, Style=Neutral, Outline=False, Rounded=False, Icon only=False | `421:110954` |
| RTL=False, Size=Medium, Style=Neutral, Outline=True, Rounded=False, Icon only=False | `421:110951` |
| RTL=False, Size=Medium, Style=Success, Outline=False, Rounded=False, Icon only=False | `421:111173` |
| RTL=False, Size=Medium, Style=Error, Outline=False, Rounded=False, Icon only=False | `421:111497` |
| RTL=False, Size=Medium, Style=Warning, Outline=False, Rounded=False, Icon only=False | `421:111659` |
| RTL=False, Size=Medium, Style=Info, Outline=False, Rounded=False, Icon only=False | `422:114250` |
| RTL=False, Size=Medium, Style=On-Color, Outline=False, Rounded=False, Icon only=False | `422:114682` |
| RTL=False, Size=Medium, Style=On-Color, Outline=True, Rounded=False, Icon only=False | `422:114688` |
| RTL=False, Size=Small, Style=Neutral, Outline=False, Rounded=False, Icon only=False | `421:110965` |
| RTL=False, Size=x Small, Style=Neutral, Outline=False, Rounded=False, Icon only=False | `421:110963` |
| RTL=False, Size=Medium, Style=Neutral, Outline=False, Rounded=True, Icon only=False | `422:115321` |
| RTL=False, Size=Medium, Style=Neutral, Outline=False, Rounded=False, Icon only=True | `421:110952` |
| RTL=True, Size=Medium, Style=Neutral, Outline=False, Rounded=False, Icon only=False | `422:117751` |

Full 288-node grid metadata (all `RTL`/`Size`/`Style`/`Outline`/`Rounded`/`Icon only`
combinations, positions, and dimensions) is available via `get_metadata` on the component-set
root `421:110968`.

---

## 12. Deviation from the pre-existing implementation: no `Danger`/no `Primary`

The pre-existing `Tag.tsx`/`Tag.stories.tsx` exposed a `variant="primary"` option (green,
brand-colored) with its own Storybook story. **No `Primary` style exists anywhere in the live
288-node Tag component set** — the `Style` axis is exactly `Neutral | Success | Error | Warning |
Info | On-Color`. `primary` was never consumed by any product page (`grep`-verified — only
`Tag.tsx`/`Tag.stories.tsx`/`index.ts` referenced it), so removing it is a non-breaking, in-scope
correction under the "never invent variants" rule — same category as `Link`'s confirmed absence
of a `Danger` mood (`docs/FIGMA_LINK_SPECIFICATION.md` §2).
