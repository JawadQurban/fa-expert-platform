# Figma Modal — Official Specification

**Source of truth:** Figma file `J0xq7JG3JKshRDzrgAM7E0` ("Components Library - Platforms Code
(Community)"), component set **Modal** (node `30150:55001`), category "Feedback & Overlays".
**Registry:** `nodeId`/`figmaUrl` were already populated (`nodeResolutionStatus: "pending"` — a
workflow-progress marker; per `CLAUDE.md`'s node resolution policy the stored node was used
directly, no `search_design_system` call was made). Live-verified this pass via `get_metadata` +
`get_design_context` (`disableCodeConnect: true`) + `get_variable_defs`; flipped to `"resolved"`
on success.

**Design documentation:** https://design.dga.gov.sa/guidelines/components/feedback/modal

4 variants (`rtl` × `mobile`), all 4 sampled directly via `get_design_context`.

---

## 1. Structure (live-verified across all 4 variants)

- **Container:** `background/background-white` (`#ffffff`), `flex-col`, gap `Model/modal-gap`
  (8px), padding `Model/modal-padding` (24px), radius `Radius/radius-md` (8px — **not**
  `radius-lg`), shadow `Shadows/shadow-3xl` (`0px 32px 64px -12px rgba(16,24,40,0.14)`), width
  **600px** desktop / **320px** mobile.
- **Header** (`_Modal Header`): `flex-col`, gap 8px (same `modal-gap` token), full width.
  - **Title row**: `flex`, gap `Global/spacing-md` (8px), `items-start`.
    - **Featured icon**: 40×40 circle, `background/background-neutral-50` (`#f9fafb`), a 20px
      icon centered inside (sample glyph: `information-circle`).
    - **Close button**: a literal **`Button-Close`** component instance (confirmed by Figma's own
      component-description metadata and node naming), 32×32 (`size="md"` on this repo's
      `ButtonClose`), absolutely positioned `inset-block-start: -10px` /
      `inset-inline-end: -10px` relative to the title row (flips to `inset-inline-start: -10px`
      under `rtl` — confirmed live, logical-property behavior, no manual reordering needed).
  - **Title text**: full width, `Font Wieght/font-weight-semibold` (600), `Size/Text/typo-size-
    text-Ig` (18px / 28px line-height), color `Text/text-display` (`#1f2a37`).
- **Body** (`_Modal Body`): `flex-col`, `padding-block-end: Model/modal-content-bottom-padding`
  (16px, **on top of** the container's own 8px flex gap — total space between body and actions is
  24px, vs. only 8px between header and body). Text: `Font Wieght/font-weight-regular` (400),
  `Size/Text/typo-size-text-sm` (14px / 20px line-height), color `Text/text-primary-paragraph`
  (`#384250`).
- **Actions** (`_Modal Actions`): `flex`, gap `Button/buttons-group-gap` (8px), `justify-content:
  flex-end`.
  - **Desktop**: a single row. A `tertiaryAction` (if present) is `flex:1 0 0`, occupying all
    leftover space — this naturally pushes `secondaryAction`/`primaryAction` to the row's trailing
    edge under both LTR and RTL (Figma's own RTL sample hand-reverses DOM order to fake the same
    visual result — a static-mockup artifact, not something real code needs to replicate; the
    `flex:1` + `justify-content:flex-end` combination already mirrors correctly).
  - **Mobile**: `flex-col`, gap 8px, each action **full width** (`w-full`), stacked
    **Primary → Secondary → Tertiary** top-to-bottom.
  - **Button styling** (all 32px tall, `Radius/radius-sm` 4px, `Button/buttons-md-padding` 12px
    inline, `Button/buttons-md-gap` 4px icon↔label gap):
    - **Primary Action**: solid fill `Button/button-background-black-default` (`#0d121c`), text
      `Text/text-oncolor-primary` (white). **Byte-identical to this repo's already-Approved
      `Button` `variant="neutral"`** (`--fads-sys-button-neutral-bg-default` is the same `#0d121c`
      — confirmed via direct token comparison, not assumed).
    - **Secondary / Tertiary Action**: `border: 1px solid Border/border-neutral-primary`
      (`#d2d6db`), transparent fill, text `Text/text-default` (`#161616`). Matches this repo's
      already-Approved `Button` `variant="secondary"` (bordered, `border-neutral`, transparent
      fill) — **not** `variant="tertiary"` (which is borderless on this repo's `Button`).
  - Each sampled action button also carries a leading 20px icon (a rotated arrow glyph) — this is
    Figma's own generic demo content for the `Button` sub-component, not evidence every Modal
    action requires an icon.

## 2. Tokens (live-verified via `get_variable_defs`)

| Token | Value | Used for |
|---|---|---|
| `Model/modal-gap` | 8px | Container flex-col gap; header's own internal gap |
| `Model/modal-padding` | 24px | Container padding |
| `Model/modal-content-bottom-padding` | 16px | Body's own extra bottom padding |
| `Global/spacing-md` | 8px | Title-row gap (icon ↔ close-button spacing) |
| `Button/buttons-group-gap` | 8px | Actions row gap |
| `Radius/radius-md` | 8px | Container radius |
| `Radius/radius-sm` | 4px | Action-button radius |
| `radius-full` | 9999px | Featured-icon circle radius |
| `Background/background-white` | `#ffffff` | Container fill |
| `Background/background-neutral-50` | `#f9fafb` | Featured-icon circle fill |
| `Text/text-display` | `#1f2a37` | Title color |
| `Text/text-primary-paragraph` | `#384250` | Body text color |
| `Text/text-default` | `#161616` | Secondary/Tertiary action label |
| `Text/text-oncolor-primary` | `#ffffff` | Primary action label |
| `Button/button-background-black-default` | `#0d121c` | Primary action fill (= `Button` `neutral` variant) |
| `Border/border-neutral-primary` | `#d2d6db` | Secondary/Tertiary action border (= `Button` `secondary` variant) |
| `Shadows/shadow-3xl` | `0px 32px 64px -12px rgba(16,24,40,0.14)` | Container shadow |

## 3. Needs Confirmation

1. **Featured-icon default glyph** — Figma's sample uses `information-circle`; the real component
   has no fixed default icon per se (a generic slot), so this repo's `Modal` exposes `icon` as a
   fully optional, consumer-supplied slot with no hardcoded default (consistent with `Avatar`'s
   `icon` prop precedent).
2. **Mobile breakpoint value** — Figma's `mobile` axis is a boolean property, not tied to a
   specific numeric viewport width in the extracted data; this repo's implementation applies the
   stacked/full-width action layout at a conventional small-viewport media query, not a
   Figma-specified breakpoint number.
3. **Action button icons** — the live sample's arrow icon on every action button is generic demo
   content (a placeholder `Button` sub-component instance), not a required Modal-specific icon
   rule; left as an ordinary optional `Button` `iconStart` per normal `Button` usage, not forced.
