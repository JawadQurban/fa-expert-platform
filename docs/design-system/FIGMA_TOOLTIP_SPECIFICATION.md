# Figma Tooltip — Official Specification

**Source of truth:** Figma file `J0xq7JG3JKshRDzrgAM7E0` ("Components Library - Platforms Code
(Community)"), component `Tooltip` (node `30150:139266`), category "Feedback & Overlays".
**Registry:** `nodeId`/`figmaUrl`/`componentKey` were already populated
(`nodeResolutionStatus: "pending"` — a workflow-progress marker; see `CLAUDE.md`'s node
resolution policy). Live-verified this pass via `get_design_context`/`get_variable_defs`/
`get_screenshot`; flipped to `"resolved"` on success.

## 1. Official Prop Shape (`get_design_context`)

```ts
type TooltipProps = {
  className?: string;
  beakAlignment?: 'Start' | 'Center' | 'End';
  beakPlacement?: 'None' | 'Top' | 'Bottom' | 'Left' | 'Right';
  contentAr?: string;
  contentEn?: string;
  icon?: boolean;
  inverted?: boolean;
  rtl?: boolean;
  title?: boolean;
  titleAr?: string;
  titleEn?: string;
};
```

Defaults: `beakAlignment="Start", beakPlacement="None", icon=true, inverted=false, rtl=false,
title=true`. **The default bubble is light** (`inverted=false`) — this is the single most
important finding of this pass.

## 2. Pre-existing Implementation Gap (found this pass)

The pre-existing `Tooltip.tsx`/`Tooltip.module.css` (built pre-workflow, batch 7) rendered a
bubble that was **always dark** (`--fads-sys-color-background-inverse`/`-text-inverse`, generic
cross-cutting aliases, not Tooltip-specific tokens), had no beak/pointer at all, no `title` slot,
no leading `icon` slot, and used `max-inline-size: 16rem` (256px) instead of the live-verified
240px. This gap was already flagged in `docs/COMPONENT_APPROVAL_MATRIX.md`'s own **Trailing
Icon** row notes ("Tooltip... is `visualComplianceStatus: pending`... its current code is an
explicitly-marked placeholder rendering a dark-inverse bubble, the opposite of the light/white
panel live-verified" for Trailing Icon's own panel) — this pass confirms that finding directly
against Tooltip's own node and fixes it.

## 3. Colors (live-verified via `get_variable_defs` on node `30150:139266`)

| Role | Light (default) | Dark (`inverted`) | New token |
|---|---|---|---|
| Background | `#ffffff` | `#1f2a37` | `--fads-sys-tooltip-background-light`/`-dark` |
| Heading (`title`) | `#1f2a37` | `#f9fafb` | `--fads-sys-tooltip-text-heading-light`/`-dark` |
| Paragraph (`content`) | `#384250` | `#f3f4f6` | `--fads-sys-tooltip-text-paragraph-light`/`-dark` |
| Leading icon | `#384250` (`Icon/icon-neutral`) | `#ffffff` (`Icon/icon-oncolor`) | `--fads-sys-tooltip-icon-color-light`/`-dark` |

Shadow: `Shadows/shadow-lg` — two `DROP_SHADOW` effects, `offset(0,4)/radius 6/spread -2/
#10182808` and `offset(0,12)/radius 16/spread -4/#10182814`, converted to
`--fads-sys-tooltip-shadow: 0 4px 6px -2px rgba(16,24,40,0.03), 0 12px 16px -4px
rgba(16,24,40,0.08)`.

## 4. Sizing and Spacing

| Property | Value | Token |
|---|---|---|
| Min width | 160px | `--fads-sys-tooltip-min-width` (new) |
| Max width | 240px | `--fads-sys-tooltip-max-width` (new; was 256px/16rem before this pass) |
| Padding | 8px | `--fads-sys-space-inset-sm` (existing, exact match — reused, no new token) |
| Icon-to-text gap / title-to-content gap | 8px | `--fads-sys-space-inset-sm` (existing, reused) |
| Corner radius | 4px | `--fads-sys-radius-sm` (existing, exact match) |

## 5. Typography

Both `title` and `content` use `Text xs` (12px), line-height 18px (= 12px × the existing
`--fads-ref-line-height-normal` 1.5 multiplier, an exact match — no new token needed). `title` is
Semibold (`--fads-ref-font-weight-semibold`), `content` is Regular
(`--fads-ref-font-weight-regular`) — both existing tokens, reused.

## 6. Beak (Pointer) — Scope Simplification

The official component's `beakPlacement` (None/Top/Bottom/Left/Right) and `beakAlignment`
(Start/Center/End) are two independent axes because the Figma demo is a static, unattached panel.
This implementation's `Tooltip` is always attached to and centered on a real trigger element (via
`placement`), so:

- The beak's **direction** is derived from the existing `placement` prop rather than a second,
  independently-settable prop that could desync from where the bubble is actually positioned
  (`placement='top'` → bubble above trigger → beak points down at the bubble's bottom edge, and
  so on for `bottom`/`inline-start`/`inline-end`).
- The beak's **alignment** is always centered (`beakAlignment='Center'`, not exposed as `Start`/
  `End`), since the bubble itself is always horizontally/vertically centered on its trigger.

This is a disclosed, intentional scope simplification, not a missing variant — the official
`Left`/`Right` beak-placement values are the same concept as this implementation's
`inline-start`/`inline-end` (rendered via `flex-direction: row`/`row-reverse`, which already
mirrors correctly under RTL without a separate `rtl` prop).

Construction: a small `8px` square rotated 45° (`--fads-sys-tooltip-beak-size`), the same
technique already established for the separately-scoped `TrailingIcon` panel
(`docs/FIGMA_TRAILING_ICON_SPECIFICATION.md`) — reused as a pattern, not as a shared token (each
component's tokens are independently sourced per the "no cross-component aliasing" policy).

## 7. Icon and Title Slots

- `icon` (boolean, default `true`, matching the official default): renders a leading 18px
  `FeedbackIcon` (Figma sub-component, default glyph a "Neutral-?" question-mark). This
  codebase's existing `help-circle` icon (`frontend/src/design-system/primitives/Icon/registry/
  alert.ts`) is a live-registry match already used elsewhere for the same "supplementary help"
  meaning (e.g. `SearchBox`'s helper row) — reused directly via `<Icon name="help-circle"
  size="sm" decorative />`. The `Icon` component's `size` scale (`sm`=16px/`md`=24px/
  `featured`=40px) has no exact 18px step; `sm` (16px) is used as the nearest match — **Needs
  Confirmation** (disclosed, non-blocking, same category as other components' near-miss icon/
  size substitutions).
- `title` (optional `ReactNode`, default unset — **not** `true` with placeholder text, since a
  real component should never auto-render placeholder copy): renders a semibold heading line
  above `content` when provided.

Tooltip has zero consumers in product code today (confirmed via `grep` — only its own test file,
the registry, the barrel export, and the design-system `README.md` reference it), so defaulting
`icon={true}` to match the official Figma default carries no breaking-change risk.

## 8. Accessibility

- Unchanged: `role="tooltip"`, `aria-describedby` linking to the trigger only while open,
  `Escape` dismissal, show/hide on both hover and focus (WCAG 1.4.13 — dismissable, hoverable,
  persistent).
- `icon` renders `decorative` (no `aria-label`) since the tooltip's own text already conveys its
  meaning — the icon is purely visual reinforcement.

## 9. Needs Confirmation

1. **Icon size** (§7) — 16px (`Icon` component's `sm` scale) used in place of the live-verified
   18px; no exact token exists on the shared Icon size scale.
2. **Beak geometry** (§6) — a CSS-reconstructed rotated square, not independently pixel-verified
   against the live raster beak asset (same category of approximation as `TrailingIcon`'s own
   beak, which was also not pixel-diffed).
