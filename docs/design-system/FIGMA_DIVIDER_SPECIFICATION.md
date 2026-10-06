# Figma Divider — Official Specification

**Source of truth:** Figma file `Sv0oWOS1SjWnwhQwdzRJIE` ("Components Library - Platforms Code (Community)"), component set node `18697:19412` ("Divider").
**Design documentation:** https://design.dga.gov.sa/guidelines/components/content-display/divider
**Figma description:** "A divider is a user interface element that visually separates content into distinct sections. It is used to organize or group content, making it easier for users to distinguish different areas of a page or layout."

Extracted via read-only Figma MCP tools (`get_metadata`, `get_design_context`, `get_variable_defs`, `get_screenshot`) — every one of the 8 variant nodes in the set was sampled (this component is small enough to inspect exhaustively, unlike Button/Card/Header/Footer).

---

## 1. Component Hierarchy

```
Divider (1px line)
└─ Background fill (Horizontal: a <div> with a background color, 1px tall)
   or a pre-rendered 1px line asset (Vertical — see §9)
```

This is the simplest component covered by the visual-compliance workflow so far: no
sub-elements, no icons, no text, no interactive states.

---

## 2. Variant Properties

The component set exposes exactly **2 variant axes** (no `Size`, no `State`, no
`inset`/`full-width` axis — see §6):

| Property | Values |
|---|---|
| `Color` | `Neutral`, `Primary`, `Alpha-white`, `White` |
| `Line Type` | `Horizontal`, `Vertical` |

2 × 4 = 8 total variants, all sampled.

---

## 3. Orientation (Horizontal / Vertical)

- **Horizontal**: a 1px-tall, full-width line (`h-px`, `w-[192px]` in the sampled
  instance — 192px is this specific demo instance's authored width, not a fixed
  requirement; see §10).
- **Vertical**: a 1px-wide, full-height line (`h-[192px] w-0` in the sampled instance,
  rendered via a pre-baked line asset offset `inset: 0 0 0 -1px` — effectively a 1px
  stroke).

---

## 4. Thickness

**1px**, uniform across every sampled Color and both Line Types. Not driven by any
named Figma "border-width" variable — the component's own frame dimensions directly
encode it (`height: 1px` for Horizontal, an effective 1px line asset for Vertical).

---

## 5. Color

| Color variant | Token | Value |
|---|---|---|
| Neutral (default) | `Border/border-neutral-primary` | `#D2D6DB` |
| Primary | `Border/border-primary` | `#1B8354` |
| White | `Border/border-white` | `#FFFFFF` |
| Alpha-white | `Alpha/alpha-white-30` | `rgba(255, 255, 255, 0.3)` (30% white — for use on colored/image backgrounds) |

**Needs Confirmation:** the four Vertical-orientation nodes render as pre-baked image
assets in the extracted markup rather than an inspectable `background-color`/CSS
variable (unlike Horizontal, which exposes a literal `bg-[var(--border/...)]` class).
No color data could be read directly off the Vertical nodes. Because `Color` and `Line
Type` are independent, orthogonal variant axes on the *same* component set (e.g. "Color=Primary,
Line Type=Vertical" and "Color=Primary, Line Type=Horizontal" are two states of one
`Color=Primary` value, not two different colors), the color values above are applied
identically to both orientations — this follows directly from the component's own
variant-naming structure, not a guess at an unrelated value.

---

## 6. Full-width vs Inset Variants

**No such variant exists in the official component.** The 8 sampled variants are only
`Color` × `Line Type` — there is no `Inset`, `Full-width`, `Size`, or `State` property
anywhere in the component set. A Divider is authored as a bare 1px line with no
internal padding/margin of its own.

Any "inset" treatment (e.g. a divider indented from a list's edges) is therefore **not
an official Figma variant** — it is a generic, FADS-authored convenience for common
usage, built entirely from already-verified generic spacing tokens (the same
`--fads-sys-space-inset-*` scale other components already use), not a new Figma-sourced
value. Documented as such in the implementation, not represented as "official."

---

## 7. Spacing

The Divider component itself carries **no internal spacing** — no padding, no margin.
Any spacing *around* a Divider (e.g. vertical rhythm between a Divider and surrounding
content) is the consuming layout's responsibility, same as native HTML `<hr>`. Nothing
to fix or add here beyond the optional `inset` convenience (§6).

---

## 8. RTL Behavior

No RTL-specific variant exists (no `RTL=yes/no` property on this component, unlike
Button/Card/Header/Footer). This makes sense structurally: a horizontal line's
rendering doesn't change with text direction, and a vertical line's rendering doesn't
either — logical CSS properties (`inline-size`/`block-size`, no hardcoded
`left`/`right`) are sufficient to keep it RTL-safe without needing a distinct RTL
variant, and the DGA docs confirm no unique RTL guidance for Divider beyond that.

---

## 9. Accessibility

- Canonical documentation: https://design.dga.gov.sa/guidelines/components/content-display/divider.
  No ARIA annotations beyond the doc link are present in the Figma file itself.
- A purely decorative/presentational line separating content has a well-established
  native HTML/ARIA pattern: `role="separator"` (or the native `<hr>` element, which
  carries an implicit `separator` role) for a horizontal rule between sections of
  content, `aria-orientation="vertical"` when used as a vertical separator. Nothing in
  the Figma file contradicts this — it is the standard, WCAG-compatible mapping for
  this exact visual pattern, not an invented behavior.

---

## 10. Responsive Behavior

No responsive/breakpoint variant axis exists. The 192px sample width (Horizontal) /
192px sample height (Vertical) are this specific demo instance's authored frame size on
the Figma canvas — a Divider has no fixed-size requirement analogous to Button's fixed
per-size dimensions; it is meant to fill whatever container it's placed in (matching
native `<hr>` behavior: `width: 100%` block-level by default). **Needs Confirmation**
only in the sense that no Figma instance demonstrates fluid sizing directly — same
caveat already recorded for Card's 360px sample width.

---

## 11. Node Reference (for future re-verification)

| Variant sampled | Node ID |
|---|---|
| Component set root | `18697:19412` |
| Color=Neutral, Horizontal | `18697:19411` |
| Color=Primary, Horizontal | `18697:19416` |
| Color=Alpha-white, Horizontal | `18697:19410` |
| Color=White, Horizontal | `18697:19414` |
| Color=Neutral, Vertical | `22372:124` |
| Color=Primary, Vertical | `22372:126` |
| Color=Alpha-white, Vertical | `22372:131` |
| Color=White, Vertical | `22372:135` |
