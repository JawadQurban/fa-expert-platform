# Figma Button-Close — Official Specification

**Source of truth:** Figma file `J0xq7JG3JKshRDzrgAM7E0` ("Components Library - Platforms Code (Community)"), component set node `2763:420129` ("Button-Close").
**Design documentation:** https://design.dga.gov.sa/guidelines/components/actions/buttons
**Figma description:** "The **Close Button** component is a small, interactive element used to dismiss modals, dialogs, or popups. It typically features an 'X' icon and supports accessibility features like keyboard navigation and ARIA labels."

Extracted via read-only Figma MCP tools (`get_design_context`, `get_variable_defs`) — the entire variant set was returned in a single call (no truncation).

---

## 1. Component Hierarchy

```
Button-Close
└─ multiplication-sign (a plain "×" glyph, node 13758:242455 — an included
   component, not inline vector data; description: "cross, multiplication,
   math, X")
```

A single-node icon-only button — no label slot, no compound structure.

---

## 2. Variant Properties

| Property | Values | Notes |
|---|---|---|
| `size` | `x Small` (default), `Small`, `Medium`, `Large` | Box: 20/24/32/40px. Icon: 16/20/20/24px (Small and Medium share the same 20px icon, only the surrounding box grows) |
| `state` | `Default`, `Hovered`, `Pressed`, `Focused` | Not a runtime prop — real interactive pseudo-states (`:hover`/`:active`/`:focus-visible`), matching every other FADS interactive primitive. **No `Disabled` variant was sampled or exists in this component set.** |
| `onColor` | `false` (default), `true` | Switches to a distinct token family for use on a dark/colored surface (e.g. inside a colored toast or banner) |

---

## 3. Live-Verified Tokens

Via `get_variable_defs` on the component-set root:

| Figma variable | Value | Used for |
|---|---|---|
| `Icon/icon-default` | `#161616` | Icon color, `onColor=false` |
| `Icon/icon-oncolor` | `#ffffff` | Icon color, `onColor=true` |
| `Radius/radius-sm` | `4` (px) | Corner radius, all sizes/states |
| `Button/button-background-neutral-hovered` | `#f3f4f6` | Background, Hovered, `onColor=false` |
| `Button/button-background-neutral-pressed` | `#e5e7eb` | Background, Pressed, `onColor=false` |
| `Button/button-background-transparent-hovered` | `#ffffff33` (rgba(255,255,255,0.2)) | Background, Hovered, `onColor=true` |
| `Button/button-background-transparent-pressed` | `#ffffff66` (rgba(255,255,255,0.4)) | Background, Pressed, `onColor=true` |
| `Border/border-black` | `#161616` | Focus ring, `onColor=false` |
| `Border/border-white` | `#ffffff` | Focus ring, `onColor=true` |

**Focus ring width**: the extracted markup uses a literal `border-2` Tailwind class (2px) for the Focused state, not a named Figma border-width variable — this is live-verified but not variable-backed. Reused the codebase's own already-shared generic `--fads-sys-border-width-thick` token (`2px`, defined in `tokens/tokens.css`, not per-component), which is exactly `2px` — confirmed identical rather than reinvented.

**Radius**: reused the codebase's own already-shared generic `--fads-sys-radius-sm` token instead of adding a new per-component one — same value (`4px`), confirmed identical.

---

## 4. Icon Substitution

The live node's icon is an instance of a separate Figma component named `multiplication-sign` (node `13758:242455`) — a plain "×" glyph with no circle/square decoration, described as "cross, multiplication, math, X". The FADS icon registry does not have an icon literally named `multiplication-sign`, but does have `cancel-01` (`frontend/src/assets/icons/add-remove/cancel-01.svg`) — inspected directly and confirmed to be the identical simple two-stroke "X" glyph (as opposed to `cancel-02`/`cancel-circle`/`cancel-square`, which carry decoration this component's node does not have). Used `cancel-01`, matching the same disclosed-substitution precedent already used for `NumberInput`/`InputPrefixSuffix`'s `plus-sign`/`minus-sign` → `add-01`/`remove-01`.

---

## 5. Accessibility

- Icon-only control — the FADS `ButtonClose` component requires a `label` prop (accessible name via `aria-label`), same contract as `InputPrefixSuffix`.
- No ARIA guidance beyond the shared doc link exists in the Figma file itself; the description's own mention of "keyboard navigation and ARIA labels" is satisfied by using a real `<button>` (native keyboard operability) plus the required `label`.
- Focus state (`Focused` variant) is real, visible, and structurally distinct from Hovered/Pressed (a 2px solid border, not a background change) — satisfies WCAG 2.2 focus-visibility requirements without relying on a background-only cue.

---

## 6. Node Reference

| Item | Node ID |
|---|---|
| Component set root (`Button-Close`) | `2763:420129` |
| `multiplication-sign` icon component | `13758:242455` |

Only one live query was needed — the full 32-variant matrix (`size`[4] × `state`[4] × `onColor`[2]) returned in a single `get_design_context` call with no truncation, unlike several other components in this batch.

---

## 7. Deviations, Extensions, and Needs-Confirmation Items

1. **Icon substitution**: `cancel-01` used in place of the Figma-internal `multiplication-sign` component, which has no directly-named equivalent in the FADS icon registry (see §4). Visually confirmed equivalent, not guessed.
2. **No `Disabled` state exists in the live component set.** The FADS `ButtonClose` still accepts the native `disabled` attribute (every other FADS interactive primitive does), but has no Figma-verified disabled color to apply — only `cursor: not-allowed` and suppressed hover/press feedback, disclosed as a non-blocking, unverified-by-Figma addition rather than an invented visual state.
3. **Focus border width** (2px) is a live-verified literal Tailwind class, not a named Figma variable — reused the codebase's existing generic `--fads-sys-border-width-thick` token (same value) rather than adding a redundant new one.
4. **Not composed into existing ad-hoc consumers this pass.** `Modal`, `Toast`/`Notification` (via the shared `NoticeBody`) each already render their own independent, unverified-against-this-node "×" dismiss button. Per the batch's strict one-component-per-session rule, refactoring those (already-Approved) composites to compose this new primitive is out of scope for this pass — flagged as a future consolidation opportunity, not a silent gap (see the Visual Compliance report §6).
