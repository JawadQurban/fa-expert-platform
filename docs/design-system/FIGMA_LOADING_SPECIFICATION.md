# Figma Loading — Official Specification

**Source of truth:** Figma file `J0xq7JG3JKshRDzrgAM7E0` ("Components Library - Platforms Code
(Community)"), component set **Loading** (node `5698:11136`), category "Feedback & Overlays".
**Registry:** `nodeId`/`figmaUrl` were already populated (`nodeResolutionStatus: "pending"` — a
workflow-progress marker; see `CLAUDE.md`'s node resolution policy). Live-verified this pass via
`get_metadata`/`get_design_context`/`get_variable_defs`; flipped to `"resolved"` on success.
**Design documentation:** https://design.dga.gov.sa/guidelines/components/loading-and-status/loading
**Figma description:** "The loading component indicates that a process is ongoing and that the
user should wait for it to complete."

---

## 1. Only a Spinner Is Officially Defined

The task required determining which loading patterns exist (Spinner / Inline Spinner / Overlay /
Full Page / Skeleton / Loading Label) and implementing **only the verified ones**. The live
`Loading` component set has exactly one shape — a rotating-ring **spinner** — across 84 variants
(`size` [7: xxSmall/xSmall/Small/Medium/Large/xLarge/xxLarge] × `style` [Neutral/Primary/On-Color]
× `indicator` [1-4]). Every sampled variant renders as a **static raster image export**
(`<img src=...>`), confirming `indicator` is an animation-frame sample of one rotating ring, not a
distinct visual state — it is not exposed in this component's API.

**No Overlay, Full Page, or Loading Label visual chrome exists on this node.** Per "only implement
verified variants," none of these are invented as new built-in variants:
- **Overlay / Full Page**: these are composition patterns, not new component variants. A consumer
  wanting a full-page loading treatment should wrap `Loading` in their own `position: fixed`
  container using the already-Approved `--fads-sys-color-overlay` token (the exact token `Modal`'s
  own backdrop already uses) — reusing an existing verified primitive/token rather than inventing
  a new one.
- **Loading Label**: already satisfied by the existing `label` prop (visually-hidden accessible
  status text via `aria-label`) — there is no separate "visible label" variant in the Figma node.

**Skeleton** (`variant="skeleton"`) is kept from the pre-existing implementation but is **not**
verified against this "Loading" node — the dedicated `Skeleton Square` (node `26177:5624`) and
`Skeleton Component` (`nodeId: null`) registry rows both remain `status: "Missing"`, unresolved.
Kept (not deleted, to avoid an unnecessary regression for existing callers) but flagged Needs
Confirmation.

## 2. Colors (live-verified via `get_variable_defs`)

Each style has a two-tone ring: a muted "track" (full circle) and an accent "indicator" (the
rotating arc, rendered via the top border edge):

| Style | Track | Indicator |
|---|---|---|
| Neutral | `Background/background-neutral-100` `#f3f4f6` | `Background/background-black` `#161616` |
| Primary | `Background/background-neutral-100` `#f3f4f6` (same neutral track) | `Background/background-primary` `#1b8354` |
| On-Color | `Alpha/alpha-white-30` (30%-alpha white) | `Background/surface-oncolor` `#ffffff` |

## 3. Sizes (live-verified via `get_metadata`)

| Figma name | Token size | Pixels |
|---|---|---|
| xx Small | `xxs` | 20px |
| x Small | `xs` | 24px |
| Small | `sm` | 28px |
| Medium | `md` | 32px |
| Large | `lg` | 36px |
| x Large | `xl` | 40px |
| xx Large | `xxl` | 44px |

## 4. Accessibility

- `role="status"`/`aria-live="polite"`/`aria-busy="true"` with a caller-supplied `label`
  (visually hidden) — preserved unchanged from the pre-existing implementation.
- New: both the spinner rotation and the skeleton shimmer respect
  `@media (prefers-reduced-motion: reduce)` — animation stops entirely; the spinner's two-tone
  ring (track vs. indicator color) still visually communicates an in-progress state without
  motion (WCAG 2.3.3). jsdom does not evaluate CSS media queries, so this was verified by code
  review of the CSS rather than a runtime test assertion (documented in the compliance report).

## 5. Needs Confirmation

1. **Exact stroke width and arc angle** — every sampled variant is a raster image export with no
   extractable vector path data; approximated as a proportional `border`-based ring (same
   technique the pre-existing implementation already used), not pixel-measured from the export.
2. **The `skeleton` variant** is not verified against this "Loading" node at all (§1) — its
   dedicated Figma sub-components remain unresolved.
