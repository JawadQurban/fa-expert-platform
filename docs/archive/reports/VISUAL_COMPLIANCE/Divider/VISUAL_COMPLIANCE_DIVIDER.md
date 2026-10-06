# Visual Compliance — Divider

Compares the official Platforms Code Divider component (see `docs/FIGMA_DIVIDER_SPECIFICATION.md`) against the current project.

**No implementation existed before this pass** — confirmed via repo-wide search
(`Glob **/Divider/**`, `Grep Divider` across `frontend/src`) before writing this
report, no code changes made yet at the time this report was authored, per
`docs/VISUAL_COMPLIANCE_WORKFLOW.md` Step 4.

---

## 1. Current State

No `Divider` component, folder, story, test, or export exists anywhere in
`frontend/src/design-system/`. It is not listed in `docs/COMPONENT_INVENTORY.md`
(no `CMP-*` ID) or `docs/COMPONENT_MAPPING.md`. This is a **new component**, not a
correction of an existing one — Step 5 of the workflow ("Fix only that component")
is read here as "build only that component, faithfully, per the spec."

## 2. Placement Decision

Added under `frontend/src/design-system/primitives/Divider/`, matching the shape of
the simplest existing primitives (e.g. `Tag`, `Icon`) — a Divider is a stateless,
non-interactive visual primitive with no composite/shell characteristics.

## 3. Variants to Implement

Per `docs/FIGMA_DIVIDER_SPECIFICATION.md` §2, the official component has exactly two
real variant axes:

| Axis | Values | Plan |
|---|---|---|
| `Line Type` (→ `orientation` prop) | Horizontal, Vertical | Implement both, exactly as named |
| `Color` (→ `color` prop) | Neutral (default), Primary, White, Alpha-white | Implement all four, exactly as named |

No `Size`/`State` axis exists — none added.

## 4. Missing Variants / Scope Additions Beyond the Official Component

- **`inset`** and **`fullWidth`** are requested by this task but **do not exist as
  Figma variants** (spec §6). Implemented as a generic, FADS-authored convenience
  layered on top of the 8 official variants, built from already-verified generic
  spacing tokens (`--fads-sys-space-inset-*`) — not represented as an "official"
  Figma pattern anywhere in code or docs. `fullWidth` reflects the default/expected
  real-world sizing (spec §10) made explicit as an opt-out-able prop rather than a
  Figma-sourced variant.
- Vertical-orientation color values are applied by extension from the shared `Color`
  property (spec §5) rather than independently read off each Vertical node's own
  markup (which renders as an opaque image asset in the extracted code) — flagged
  **Needs Confirmation** in the spec, not blocking, since it follows directly from
  the component's own variant structure rather than an unrelated guess.

## 5. Token Plan

New, additive `--fads-sys-divider-*` tokens only (per the workflow's "fix only the
component in scope" rule) — no existing shared token (e.g. `--fads-sys-color-border-default`,
already consumed by ~20 other components) is reused or repointed, even where a Figma
source value coincides:

| New token | Value | Source |
|---|---|---|
| `--fads-sys-divider-color-neutral` | `#d2d6db` | Figma variable `Light.Border.border-neutral-primary` |
| `--fads-sys-divider-color-primary` | `#1b8354` | Figma variable `Light.Border.border-primary` |
| `--fads-sys-divider-color-white` | `#ffffff` | Figma variable `Light.Border.border-white` |
| `--fads-sys-divider-color-alpha-white` | `rgba(255, 255, 255, 0.3)` | Figma variable `Light.Alpha.alpha-white-30` |
| `--fads-sys-divider-thickness` | `1px` | Live Figma MCP verified — every sampled node's own frame thickness (spec §4); no named Figma "border-width" variable exists for this |

Padding/inset/fullWidth reuse the **existing, already-generated, shared**
`--fads-sys-space-inset-*` scale (§4) rather than adding new Divider-specific spacing
tokens, since that scale is already correct and general-purpose (not a Divider-only
concern the way color/thickness are).

## 6. Accessibility Plan

- Default render: native `<hr>` (implicit `role="separator"`, horizontal) when
  `orientation="horizontal"` (default).
- `orientation="vertical"`: `<hr>` does not support a meaningful vertical rendering
  natively in most browsers via CSS alone in a fully semantic way, so a
  `<div role="separator" aria-orientation="vertical">` is used instead — the standard
  WCAG/ARIA pattern for a non-`<hr>` separator (spec §9).
- Purely decorative usage (e.g. a hairline with no semantic section boundary) is
  supported via `aria-hidden="true"` on request (a `decorative` prop), consistent with
  how `Icon`/other purely-visual primitives in this design system already expose a
  decorative escape hatch.

## 7. RTL Plan

No official RTL variant exists (spec §8). Implementation uses only logical CSS
properties (`inline-size`, `block-size`, `margin-inline`) — no `left`/`right` — so it
is RTL-safe by construction, consistent with `scripts/verify-css-rules.mjs` (DC-23)
which will fail the build if a physical-direction property is introduced.

## 8. Required Code (this pass)

1. `frontend/src/design-system/primitives/Divider/Divider.tsx` — new component:
   `orientation` (`horizontal` | `vertical`, default `horizontal`), `color`
   (`neutral` | `primary` | `white` | `alphaWhite`, default `neutral`), `inset`
   (boolean), `fullWidth` (boolean, default `true`), `decorative` (boolean).
2. `Divider.module.css` — token-only, no hardcoded colors/borders/spacing/thickness.
3. `scripts/generate-tokens.mjs` — 5 new additive `--fads-sys-divider-*` tokens.
4. `Divider.stories.tsx` — Default, Inset, Vertical, Dark background (Alpha-white/White
   on a colored surface), RTL.
5. `Divider.test.tsx` — rendering, orientation, accessibility (axe + separator role),
   RTL (logical properties, no physical left/right).
6. Export from `frontend/src/design-system/primitives/index.ts` (and therefore the
   public `@ds` API, per the existing barrel-export chain).

No existing component's files are touched. No page is touched.
