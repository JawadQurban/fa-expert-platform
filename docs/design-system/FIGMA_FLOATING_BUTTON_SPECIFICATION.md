# Figma Floating Button — Official Specification

**Source of truth:** Figma file `J0xq7JG3JKshRDzrgAM7E0` ("Components Library - Platforms Code (Community)"), component set node `19488:124656` ("Floating Button").
**Design documentation:** https://design.dga.gov.sa/guidelines/components/actions/floating-Button
**Figma description:** "A Floating Button is a circular button that 'floats' above the user interface and is typically used to represent a primary or most important action on a screen. It is designed to grab attention and encourage user interaction."

Extracted via read-only Figma MCP tools (`get_design_context`, `get_variable_defs`, `get_screenshot`). The component set is large (700+ instances across every crossed variant); `get_metadata`/`get_design_context` on the root returned a sparse symbol list rather than full code, so representative variants were sampled individually — every structural or color claim below traces to a specific sampled node ID (§7).

---

## 1. Component Hierarchy

```
Floating Button (Icon only = True)
└─ leadIcon (24px, default sample: plus-sign)

Floating Button (Icon only = False)
├─ leadIcon (24px)
└─ label text (16px/Medium, oncolor-white)
```

A single circular (or pill, when labelled) surface — no separate trigger/popover structure, unlike `DatePicker`.

---

## 2. Variant Properties

| Property | Values | Notes |
|---|---|---|
| `style` | `Primary- Neutral` (default), `Primary-Brand`, `Secondary-Solid` | Governed by the **exact same Figma variables** as the already-Approved `Button` primitive's `neutral`/`primary`/`secondarySolid` variants (see §3) |
| `size` | `Small` (default, 56px), `Large` (64px) | Both icon-only and with-label share the same padding-driven sizing per size |
| `Icon only` | `True` (default), `False` | `False` renders a pill (still `radius-full`) with a label after the icon |
| `On color` | `No` (default), `Yes` | A full-override white/oncolor treatment, same convention as `Button`'s own `onColor` modifier |
| `state` | `Default`, `Hovered`, `Pressed`, `Selected`, `Foucsed` [sic, Figma's own typo for Focused], `Disabled` | Not a runtime prop — real interactive pseudo-states (`:hover`/`:active`/`:focus-visible`), matching `Button`'s own convention |
| `rtl` | `False`, `True` | No dedicated mirroring code needed — see §6 |

---

## 3. Token Reuse — Identical to `Button`

`get_variable_defs` on the component-set root returned the exact same Figma variable names/values already sourced for the `Button` primitive:

| Figma variable | Value | Already used by `Button` as |
|---|---|---|
| `Button/button-background-black-default/-hovered/-pressed/-selected` | `#0d121c` / `#1f2a37` / `#4d5761` / `#384250` | `--fads-sys-button-neutral-bg-*` (Style=Neutral) |
| `Button/button-background-primary-default/-hovered/-pressed/-selected` | `#1b8354` / `#166a45` / `#104631` / `#14573a` | `--fads-sys-button-primary-bg-*` |
| `Button/button-background-neutral-default/-hovered/-pressed/-selected` | `#f3f4f6` / `#f3f4f6` / `#e5e7eb` / `#e5e7eb` | `--fads-sys-button-secondary-solid-bg-*` |
| `Button/button-background-oncolor-default/-hovered/-pressed/-selected` | `#ffffff` / `rgba(255,255,255,.8)` / `rgba(255,255,255,.6)` / `rgba(255,255,255,.7)` | `--fads-sys-button-oncolor-bg-*` |
| `Text/text-oncolor-primary` | `#ffffff` | `--fads-sys-button-label-oncolor` |
| `Global/background-disabled`, `Global/icon-default-disabled` | `#e5e7eb`, `#9da4ae` | `--fads-sys-button-disabled-bg`/`-label` |
| `Radius/radius-full` | `9999` | `--fads-sys-radius-full` (already shared/generic) |

This confirms the registry's own `dependencies: ["Button"]` was correct in spirit. **No new color, typography, disabled, or focus-ring tokens were added** — `FloatingButton` reuses `Button`'s own `--fads-sys-button-*` tokens directly.

Only 3 new geometry tokens were needed (padding/gap — see §4), because this component's sizing model (fixed padding driving a true circle) is structurally different from `Button`'s own height/padding-inline model.

---

## 4. Geometry

| Item | Value | Figma source |
|---|---|---|
| Padding, Small | `16px` (all sides) | `Global/spacing-xl` |
| Padding, Large | `20px` (all sides) | `Global/spacing-2xl` |
| Icon↔label gap | `8px` | `Global/spacing-md` |
| Icon size | `24px` (both Small and Large) | Matches `Button`'s own already-defined `--fads-sys-button-icon-size-lg` — reused directly, no new token |
| Corner radius | `9999px` (a true circle when icon-only) | `Radius/radius-full` — already shared/generic |

Box math (live-verified against sampled instance metadata): Small icon-only = `16×2 + 24 = 56px` (matches the sampled `56×56` symbol); Large icon-only = `20×2 + 24 = 64px` (matches the sampled `64×64` symbol). The with-label pill's height follows the identical formula (`16×2+24=56` / `20×2+24=64`); width simply hugs the label's own intrinsic content width.

**No box-shadow/elevation was found in any sampled node** — despite the component's own description calling it a button that "floats," the live data specifies no shadow token. Not invented; see §8.

---

## 5. A Real, Disclosed Divergence from `Button`: the `Selected` State

`Button.module.css` documents that `Button`'s own `Selected` state deliberately **reuses the Pressed color**, not the distinct `-selected` token Figma also defines for it (verified live for `Button` itself). Floating Button's own `Selected` state was independently live-verified (node `19488:124967`, screenshot confirmed) to use the **distinct** `button-background-black-selected` (`#384250`) — genuinely different from Pressed (`#4d5761`). This is why `FloatingButton` is **not** a literal composition of `<Button selected>` (which would have silently applied the wrong color) — see `FloatingButton.tsx`'s own module doc.

---

## 6. RTL

No RTL-specific styling was added. The sampled RTL+label node (`19656:828`) shows the label rendered before the icon in the underlying layer order for `rtl=True` (opposite of the LTR sample's icon-before-label order) — but this is Figma's own hand-placed layer order, not evidence that a real CSS implementation needs to swap DOM order. `Button` itself has no `dir(rtl)` handling either and already relies on the browser's native bidi/logical-flow behavior (`display: inline-flex` with no fixed `flex-direction`, under the app's default `dir="rtl"`) to mirror icon/label position automatically. `FloatingButton` follows the exact same convention for consistency.

---

## 7. Node Reference

| Variant sampled | Node ID |
|---|---|
| Component set root | `19488:124656` |
| Default, Primary-Neutral, Icon only, Small | `19488:124657` |
| Default, Primary-Neutral, with label, Small | `19488:124803` |
| Default, Primary-Neutral, Icon only, Large | `19656:7213` |
| Default, Primary-Neutral, Icon only, Small, On color=Yes | `19682:929` |
| Selected, Primary-Neutral, Icon only, Small | `19488:124967` |
| Focused ("Foucsed"), Primary-Neutral, Icon only, Small | `19528:125851` |
| RTL, Default/Pressed, Primary-Neutral, with label, Small | `19656:828` / `19656:849` |

---

## 8. Deviations, Extensions, and Needs-Confirmation Items

1. **No elevation/box-shadow found in any sampled node**, despite the component's own "floats above the interface" description. Not invented — implemented with no shadow. Flagged Needs Confirmation, non-blocking; typical real-world floating-action-button placement (fixed position over page content) would usually carry a shadow, but that is not what the live data shows.
2. **`Selected` uses a distinct token, diverging from `Button`'s own precedent of reusing Pressed for Selected** — a genuine, independently live-verified difference (see §5), not an inconsistency to "fix" toward matching `Button`.
3. **Not a literal composition of `<Button>`** — see §5 for why, and `FloatingButton.tsx`'s own module doc.
4. **RTL icon/label DOM order** — no special handling added; relies on the same natural bidi/logical-flow behavior `Button` already uses, rather than mirroring Figma's own hand-placed RTL layer order literally (see §6).
5. **`plus-sign` icon substitution**: the default demo icon (`add-01`) is the same disclosed substitute already used for Number Input/Input Prefix-Suffix/Button-Close's plus/cross glyphs — `FloatingButton` itself accepts any `icon` node, it is not hardcoded to a specific icon.
