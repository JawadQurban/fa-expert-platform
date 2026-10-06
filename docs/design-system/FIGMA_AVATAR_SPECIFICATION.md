# Figma Avatar — Official Specification

**Source of truth:** Figma file `J0xq7JG3JKshRDzrgAM7E0` ("Components Library - Platforms Code
(Community)"), component `Avatar` (node `5699:53529`), category "Data Display".
**Registry:** `nodeId`/`figmaUrl`/`componentKey` were already populated
(`nodeResolutionStatus: "pending"` — a workflow-progress marker; see `CLAUDE.md`'s node resolution
policy). Live-verified this pass via `get_design_context`/`get_variable_defs`; flipped to
`"resolved"` on success.
**Design documentation:** https://design.dga.gov.sa/guidelines/components/data-display/avatar
**Figma description:** "The avatar is a visual representation of a user, showing either an image,
initials, or an icon."

---

## 1. Official Prop Shape (`get_design_context`)

```ts
type AvatarProps = {
  className?: string;
  border?: boolean;
  size?: '24px' | '32px' | '40px' | '48px' | '64px' | '80px' | '120px';
  square?: boolean;
  swapIcon?: React.ReactNode | null;
  textEn?: string;
  type?: 'Image' | 'Initials' | 'Icon';
};
```

Defaults: `border=false, size="24px", square=false, swapIcon=null, textEn="AB", type="Initials"`.

The live component set is a 7-size × 2-shape (Rounded / Square) × 3-type (Initials / Icon / Image)
grid, with an independent `border` toggle — confirmed via `get_screenshot`.

## 2. Pre-existing Implementation Gap (found this pass)

Before this pass, `Avatar.tsx`/`Avatar.module.css` only implemented 3 of 7 sizes (`sm`/`md`/`lg` =
32/40/48px, pixel-correct), had no `square` or `border` prop, used a single flat font-weight for
all sizes instead of the per-size scale below, and used
`--fads-sys-color-background-subtle` (`#f9fafb`, `neutral-50`) for the Initials/Icon background
instead of the live-verified official `#f3f4f6` (`neutral-100`). All of these are fixed in this
pass; the existing `sm`/`md`/`lg` names and their pixel sizes are preserved unchanged (additive
extension, not a breaking rename).

## 3. Colors (live-verified via `get_variable_defs` on node `5699:53529`)

| Role | Figma variable | Value | New token |
|---|---|---|---|
| Initials/Icon background | `Button/button-background-neutral-default` (same underlying `Background/background-neutral-100` primitive `Loading`'s neutral track already uses) | `#f3f4f6` | `--fads-sys-avatar-background-fallback` |
| Border/framing | `Border/border-white` (`Background/background-white`) | `#ffffff` | `--fads-sys-avatar-border-color` |
| Icon glyph | `Icon/icon-default` | `#161616` | `--fads-sys-avatar-icon-color` |
| Initials text | `Text/text-default` | `#161616` | `--fads-sys-avatar-text-color` |

Per the "no cross-component aliasing" policy (`docs/TOKEN_MAPPING.md`), `Avatar` does not reuse
`fads-sys-loading-track-neutral` even though the value coincides — each component's token is
independently sourced from the same underlying Figma primitive.

## 4. Sizes

| Figma size | FADS size name | Pixels | Token |
|---|---|---|---|
| 24px | `xs` | 24px | `--fads-ref-space-5` (existing) |
| 32px | `sm` (unchanged) | 32px | `--fads-ref-space-6` (existing) |
| 40px | `md` (unchanged, default) | 40px | `--fads-ref-space-7` (existing) |
| 48px | `lg` (unchanged) | 48px | `--fads-ref-space-8` (existing) |
| 64px | `xl` | 64px | `--fads-ref-space-9` (existing) |
| 80px | `2xl` | 80px | `--fads-sys-avatar-size-2xl` (new — no match on the existing space scale, which stops at 64px) |
| 120px | `3xl` | 120px | `--fads-sys-avatar-size-3xl` (new) |

## 5. Shape and Border

- **Rounded** (default): `border-radius: var(--fads-sys-radius-pill)` — unchanged from the
  pre-existing implementation.
- **Square** (`square` prop, new): live-verified corner radius via `get_variable_defs` — `radius/4`
  (`--fads-sys-radius-sm`, 4px) for sizes up to 64px, `radius/8` (`--fads-sys-radius-md`, 8px) for
  80px/120px. Both radius tokens already existed and match exactly; no new radius token needed.
- **Border** (`border` prop, new): a white framing ring, implemented as
  `box-shadow: 0 0 0 var(--fads-sys-avatar-border-width) var(--fads-sys-avatar-border-color)` so it
  does not affect layout box size or get clipped by the avatar's own `overflow: hidden`. The exact
  stroke width has no extractable vector data in the raster export; approximated at `2px`
  (`--fads-sys-avatar-border-width`) — **Needs Confirmation**.

## 6. Typography (per-size, live-verified via `get_variable_defs`)

Each of the 7 sizes pairs with a distinct Text/Display style — font-size, weight, and line-height
all vary together:

| Size | Figma style | Font size | Weight | Line height |
|---|---|---|---|---|
| `xs` (24px) | Text 2xs / Bold | 10px | 700 | 14px |
| `sm` (32px) | Text xs / Semibold | 12px | 600 | 18px |
| `md` (40px) | Text sm / Semibold | 14px | 600 | 20px |
| `lg` (48px) | Text md / Medium | 16px | 500 | 24px |
| `xl` (64px) | Text xl / Medium | 20px | 500 | 30px |
| `2xl` (80px) | Display sm / Regular | 30px | 400 | 38px |
| `3xl` (120px) | Display md / Regular | 36px | 400 | 44px |

The pre-existing implementation used one flat `font-weight: semibold` for all sizes — this was a
genuine defect, now fixed with the per-size scale above.

## 7. Icon Type — Composition, Not a Baked-in Glyph

The official component's default Icon-type glyph is a "user" silhouette icon (Figma node
`13758:241876`), not currently present in this codebase's Icon registry
(`frontend/src/design-system/primitives/Icon/registry/`). Rather than importing a new icon into
the registry mid-Avatar-pass (a separate, documented pipeline — see `docs/ICON_LIBRARY.md`) or
hand-rolling an unverified substitute SVG, `Avatar`'s `icon` prop remains a consumer-supplied
`ReactNode` slot: the caller passes whatever icon they need (consistent with how other FADS
components expose icon slots). This is a disclosed, intentional scope boundary, not a defect —
Figma's `type="Icon"` variant selection is expressed in the React API as "did the caller pass
`icon`," which is a faithful behavioral translation of the same three-context priority
(`src` → `icon` → initials) already implemented.

## 8. Accessibility

- Functional avatars (`decorative` unset): `role="img"` + `aria-label={name}` on the wrapper;
  the image itself is `alt=""` (decorative) since the wrapper already carries the accessible name.
- Decorative avatars (`decorative` prop): `aria-hidden="true"`, entirely hidden from assistive
  tech — unchanged, pre-existing and correct.
- No directional (RTL-sensitive) layout — the avatar is a centered circle/square with no
  inline-direction-dependent content; verified via a dedicated Storybook RTL story and test.

## 9. Needs Confirmation

1. **Border stroke width** (§5) — approximated at 2px; no extractable vector stroke-width from the
   raster export.
