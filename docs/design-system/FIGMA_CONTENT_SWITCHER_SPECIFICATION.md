# Figma Content Switcher — Official Specification

**Source of truth:** Figma file `J0xq7JG3JKshRDzrgAM7E0` ("Components Library - Platforms Code (Community)"), component set node `8421:71014` ("Content Switcher"), sub-component **`_Content Switcher Item`** (`8421:70930`).
**Design documentation:** https://design.dga.gov.sa/guidelines/components/data-display/content-switcher
**Figma description:** "Content switchers in the platforms code allow users to navigate between related views efficiently. They display one section at a time, ensuring a focused and user-friendly experience."

Extracted via read-only Figma MCP tools (`get_design_context`, `get_variable_defs`).

---

## 1. Component Hierarchy

```
Content Switcher
└─ _Content Switcher Item × N (First, Mid×0-2, Last)
   └─ text label (English/Arabic)
```

A horizontal row of segmented, pill-cornered items. The first item is
rounded on its leading corners, the last on its trailing corners, and any
middle items are square. No owned "panel"/content-display structure exists
in the live data — this component is the switcher control only.

---

## 2. Variant Properties

| Property | Values | Notes |
|---|---|---|
| `size` | `Small` (default), `Medium`, `Large` | Governs height, padding, and text size — this component's own live-verified scale, **not** identical to `Button`'s own size scale (see §4) |
| `onColor` | `false` (default), `true` | Full-override translucent-white background for use on a dark/colored surface |
| `rtl` | `false`, `true` | See §5 — no special handling needed beyond CSS logical properties |
| `itemType` (per-item) | `First`, `Mid`, `Last` | Governs corner-radius assignment and divider-border placement |
| `state` (per-item) | `Normal`, `Selected` | **Only 2 states exist** — no `Hovered`/`Pressed` variant was sampled |

Non-variant properties confirmed by inspecting the underlying instance:
`prop2ndItem`/`prop3rdItem` (booleans controlling how many middle items the
demo sample shows — the real component accepts any number of items via its
`options` prop, not a fixed count).

---

## 3. Byte-Identical Match With `Button`'s Tokens

`get_variable_defs` confirmed every color is sourced from the same
`Button/*` Figma variable family already used by the already-Approved
`Button` (and, earlier in this project, `FloatingButton`):

| Figma variable | Value | Used for |
|---|---|---|
| `Button/button-background-neutral-default` | `#f3f4f6` | Normal item background (not onColor) |
| `Button/button-background-black-default` | `#0d121c` | Selected item background (not onColor) — reuses `Button`'s own `neutral` variant token (the "black" family) |
| `Button/button-background-primary-default` | `#1b8354` | Selected item background, onColor |
| `Button/button-background-transparent-hovered` | `#ffffff33` (rgba(255,255,255,0.2)) | Normal item background, onColor — **the resting state**, not a hover-only treatment (see §4) |
| `Border/border-neutral-primary` | `#d2d6db` | Divider border (not onColor) |
| `Border/border-transparent-10` | `#ffffff1a` (rgba(255,255,255,0.1)) | Divider border, onColor |
| `Text/text-default` | `#161616` | Normal item text (not onColor) |
| `Text/text-oncolor-primary` | `#ffffff` | Selected item text, and Normal item text when onColor |
| `radius-md` | `8` (px) | Corner radius on the first/last item — reused from the already-shared generic `--fads-sys-radius-md` |
| `Button/buttons-sm-padding` / `-md-padding` / `-lg-padding` | `8` / `12` / `16` (px) | Item inline padding — reused from `Button`'s own `--fads-sys-button-padding-inline-sm/md/lg` (confirmed byte-identical) |

All of the above are reused directly from `Button`'s existing tokens. Only
geometry with no `Button` equivalent needed new tokens — see §4.

---

## 4. New Tokens: Height Scale, Min-Width, Large Typography

Unlike its colors and inline padding, this component's own **height scale**
(`32px`/`40px`/`48px` for Small/Medium/Large) does not match `Button`'s own
height scale (`24px`/`32px`/`40px`) — a consistent `+8px` offset, confirmed
via direct comparison of both live-verified token sets. Genuinely new,
component-scoped tokens were added for height. A `76px` minimum item width
was also live-verified with no existing equivalent.

Typography: Small items reuse the already-generic `--fads-sys-typography-
text-md`/`-line-height-md` (16px/24px) and Medium items reuse the already-
generic `--fads-sys-typography-text-lg`/`-line-height-lg` (18px/28px, both
confirmed exact matches) — but Large items use `20px`/`30px`, which has no
existing generic match (the codebase's own generic "xl" typography token is
`24px`, a `display`-scale value, not `20px`). One new token pair was added
for this.

The onColor Normal-item background (`rgba(255,255,255,0.2)`) and its border
(`rgba(255,255,255,0.1)`) also needed new tokens — no existing generic
token at the top level matches these exact translucent-white values (a
scoped match exists inside `ButtonClose`'s own tokens, but reusing another
component's scoped token by value alone, across an unrelated semantic
domain, would be poor separation of concerns — new tokens were added
instead, matching this project's own established convention).

---

## 5. RTL: No Manual DOM Reordering Needed

The extracted Figma markup conditionally swaps which item renders first in
DOM depending on the `rtl` prop (so the "first, selected, rounded" item is
always the *last* DOM child under RTL) — an artifact of Figma having no
concept of CSS logical properties, not evidence that a real implementation
needs manual reordering. This component's corner-radius/divider CSS uses
**logical** `border-start-start-radius`/`border-end-end-radius`/
`border-inline-end` properties (per this codebase's own DC-23 rule), which
already mirror automatically under the app's default `dir="rtl"` — the same
finding already confirmed for `Button`/`FloatingButton`/`DropdownListItem`
earlier in this project. Keyboard interaction (`ArrowLeft`/`ArrowRight`)
still needs an explicit RTL-aware swap (arrow keys are always physical, not
logical) — implemented via the same `useIsRtl()` hook this project's
existing `Tabs` composite already uses, for consistency.

---

## 6. Not `Tabs`

This project already has a separate, already-Approved `Tabs` composite
(DGA CMP-09). `Content Switcher` (DGA CMP-10) is a distinct official
catalog entry with its own Figma node, and is visually and structurally
different: `Tabs` uses a `radius-pill` outer container and owns its own
`tabpanel`, while `Content Switcher` uses per-segment `radius-md` corners,
hairline dividers, solid-fill selected segments, and (per the live data)
**no owned content panel at all**. `ContentSwitcher` therefore renders only
the `role="tablist"`/`role="tab"` control — the consumer wires the selected
`value` to whatever content it swaps elsewhere, rather than this component
owning a `tabpanel` the way `Tabs` does.

---

## 7. No Hovered/Pressed State Exists

Only `Normal`/`Selected` states exist in the live 2-state set for
`_Content Switcher Item` — no `Hovered`/`Pressed` variant was sampled or
exists. A `:focus-visible` outline was still added (non-Figma-sampled,
using already-shared generic tokens) since WCAG 2.2 requires visible focus
regardless of Figma sample completeness; no hover-only background was
invented.

---

## 8. Node Reference

| Item | Node ID |
|---|---|
| Component set root (`Content Switcher`) | `8421:71014` |
| `_Content Switcher Item` sub-component | `8421:70930` |

---

## 9. Deviations, Extensions, and Needs-Confirmation Items

1. **No owned `tabpanel`** — this component renders only the switcher control (`role="tablist"`/`role="tab"`), unlike `Tabs`; see §6.
2. **Height scale is new** (not `Button`'s own) — a consistent `+8px` offset confirmed via direct comparison, not assumed.
3. **No Hovered/Pressed variant exists** — a non-Figma-sampled focus-visible outline was added for WCAG 2.2 compliance only.
4. **No manual RTL DOM reordering** — logical CSS properties handle corner-radius/divider mirroring automatically; only the keyboard arrow-key mapping needs an explicit RTL swap (via `useIsRtl()`, matching `Tabs`'s own precedent).
5. **Item count is not fixed** — the live sample shows up to 4 items (`prop2ndItem`/`prop3rdItem` toggles), but the real component accepts any number of `options`.
