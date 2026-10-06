# Visual Compliance — Steps (Progress Indicator)

Compares the official Platforms Code Progress Indicator component set
(`docs/FIGMA_PROGRESS_INDICATOR_SPECIFICATION.md`, node `30150:68350`) against the pre-existing
FADS `Steps` composite (`frontend/src/design-system/composite/Steps/`) as it stood before this
pass.

## 1. Prior Implementation Summary

Real `<ol>` + `aria-current="step"`, completed/current/upcoming markers with a checkmark-or-number
glyph, connector-free layout (no line between markers), completed steps clickable only when
`onStepClick` given. Single orientation (horizontal-only), no description slot, no
optional/disabled/error support, generic (non-Figma-verified) colors.

## 2. Differences Found (and Fixed)

| # | Area | Official (live-verified) | Prior implementation | Fixed this pass |
|---|---|---|---|---|
| 1 | Orientation | Horizontal AND Vertical are both official (`Alignment` property) | Horizontal only | ✅ New `orientation` prop (`'horizontal'\|'vertical'`), live-verified layout for both |
| 2 | Connector line | A colored line between each marker (green when the step is completed, muted gray otherwise) | No connector at all | ✅ Added, matching live-verified per-state colors |
| 3 | Description | Official `showDescription` content property | Not supported | ✅ New `description` field on `StepItem` |
| 4 | Marker colors | Completed `#1b8354` fill + white check; Current `#1b8354` outline; Upcoming `#d2d6db` outline | Generic `--fads-sys-color-primary`/`-border-default`/`-text-on-primary` aliases | ✅ 10 new additive `--fads-sys-steps-*` color tokens sourced from the live `Stepper` variable group |
| 5 | Hover | Live-verified hover colors for the clickable (completed) marker | Not implemented | ✅ Wired `stepper-button-completed-hovered` to the button's `:hover` |
| 6 | Optional/Disabled/Error | Not defined in Figma (spec §4) | Not supported | ✅ Added as FADS-authored extensions using already-approved cross-cutting tokens (not fabricated), explicitly disclosed as non-Figma-verified for this component |
| 7 | **Accessible name bug** | N/A | N/A (bug introduced then caught within this same pass) | ✅ Moving the step-name text out of the button (to correctly match the Horizontal/Vertical marker+text layout) initially left clickable step buttons with no accessible name — caught by this pass's own axe scan and fixed via `aria-labelledby` |

## 3. Accessibility

- `<ol>` + `aria-current="step"`, never `role="progressbar"` — preserved and re-confirmed correct
  against the live Figma "Stepper" semantics (task's own explicit rule).
- Real bug found and fixed within this same implementation pass (§2 item 7) — disclosed rather
  than silently corrected, since it demonstrates the axe-scan step actually caught something
  real, not just a rubber-stamp pass.
- `aria-disabled="true"` on disabled steps; disabled steps are never rendered as a `<button>`.

## 4. RTL

Logical properties throughout (`padding-inline-end`, `inline-size`/`block-size` for the
connector). Confirmed via a dedicated RTL story and test — 48 of the 48 live Figma variants
include an explicit `rtl` axis, confirming the design itself is RTL-aware, not merely mirrored by
this implementation.

## 5. Responsive

`orientation="vertical"` is the primary responsive affordance the live design itself provides for
narrow viewports (a common stepper pattern — switch from horizontal to vertical below a
breakpoint); this component exposes the prop, the breakpoint decision is left to the consumer
(page-level responsibility, consistent with how other approved composites handle responsive
composition).

## 6. Scope

- Only `Steps.tsx`, `Steps.module.css`, `Steps.stories.tsx`, `Steps.test.tsx`, and
  `scripts/generate-tokens.mjs` (additive tokens only) were touched.
- `Steps` is not consumed by any product page (`grep`-verified), so zero external-breakage risk.

## 7. Validation

| Command | Result |
|---|---|
| `npm run typecheck` | ✅ Pass |
| `npm run lint` (eslint + `lint:css`) | ✅ Pass |
| `npm run format:check` | ✅ Pass |
| `npm test` (Steps only) | ✅ 13/13 passing (up from 5) |
| `npm run tokens:generate` | ✅ 526 tokens generated |

## 8. Approval

Live node, both orientations, all 3 states' colors, hover, and the description slot verified
before Steps is marked Approved. Needs-Confirmation items (non-blocking, spec §6): the
disabled/error/optional visual treatment (functionally correct, not independently pixel-verified
for this component) and focus-ring scope on non-interactive steps.
