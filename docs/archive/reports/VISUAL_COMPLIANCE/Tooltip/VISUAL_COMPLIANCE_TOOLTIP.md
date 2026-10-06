# Visual Compliance — Tooltip

Compares the official Platforms Code Tooltip component (`docs/FIGMA_TOOLTIP_SPECIFICATION.md`,
node `30150:139266`) against the pre-existing FADS `Tooltip` primitive
(`frontend/src/design-system/primitives/Tooltip/`) as it stood before this pass.

## 1. Prior Implementation Summary

`role="tooltip"` bubble shown on hover/focus of a cloned trigger, dismissable via Escape,
`aria-describedby` linking, 4-way logical `placement`. Always rendered a **dark** bubble via
generic `--fads-sys-color-background-inverse`/`-text-inverse` tokens, with no beak/pointer, no
`title` slot, no leading `icon` slot, and a 256px max-width.

## 2. Differences Found (and Fixed)

| # | Area | Official (live-verified) | Prior implementation | Fixed this pass |
|---|---|---|---|---|
| 1 | Default bubble color | **Light** (`#ffffff` bg, dark text) | Always dark | ✅ New `inverted` prop (default `false` = light, matching the official default); dark is now opt-in |
| 2 | Beak/pointer | A rotated-square diamond beak on the edge closest to the trigger | None at all | ✅ Beak added, direction derived from the existing `placement` prop (§6 of the spec — a disclosed scope simplification vs. the official's independent `beakPlacement`/`beakAlignment` axes) |
| 3 | Title slot | Optional semibold heading above the body text | Not implemented | ✅ New `title` prop |
| 4 | Icon slot | Optional leading 18px help/question icon, default `true` | Not implemented | ✅ New `icon` prop (default `true`), rendering the existing `help-circle` registry icon at the nearest available 16px `sm` size (Needs Confirmation, spec §7) |
| 5 | Max width | 240px | 256px (16rem) | ✅ New `--fads-sys-tooltip-max-width` token |
| 6 | Min width | 160px | Not set | ✅ New `--fads-sys-tooltip-min-width` token |
| 7 | Shadow | `Shadows/shadow-lg` (two-layer, live-verified values) | Generic `--fads-sys-elevation-2` | ✅ New `--fads-sys-tooltip-shadow` token, independently sourced |
| 8 | Colors | 6 live-verified Tooltip-specific colors (light/dark × background/heading/paragraph) | 2 generic cross-cutting aliases | ✅ 6 new `--fads-sys-tooltip-*` color tokens, plus 2 for the icon |

## 3. Accessibility

- Preserved unchanged: `role="tooltip"`, `aria-describedby` (only while open), Escape dismissal,
  shown on both hover and focus, persists on focus (WCAG 1.4.13 — dismissable/hoverable/
  persistent).
- New: the leading `icon` renders `decorative` (`aria-hidden`, no separate accessible name) since
  the tooltip's own text content already conveys the meaning.

## 4. RTL

`placement='inline-start'`/`'inline-end'` use `flex-direction: row`/`row-reverse` and
`inset-inline-*`/`margin-inline-*` logical properties throughout — confirmed via a dedicated RTL
story and test to mirror correctly with zero JS-level DOM reordering, the same category of
finding already made for `Button`/`FloatingButton`/`ContentSwitcher`. The official `rtl` prop
axis is not exposed separately; it's redundant with the app's own `dir="rtl"` default plus
logical CSS.

## 5. Scope

- Only `Tooltip.tsx`, `Tooltip.module.css`, `Tooltip.stories.tsx`, `Tooltip.test.tsx`, and
  `scripts/generate-tokens.mjs` (additive tokens only) were touched.
- `Tooltip` has zero consumers in product code (confirmed via `grep`: only its own test file, the
  registry, the barrel export, and `design-system/README.md` reference it) — so the `icon={true}`
  default change (a visible behavior change from "no icon ever" to "icon by default") carries no
  breaking-change risk to any existing page.
- Not touched: `TrailingIcon`, which deliberately built its own independent panel rather than
  compose the (at-the-time-unverified) `Tooltip` — its own `--fads-sys-trailingicon-*` tokens are
  untouched and it remains its own separately-Approved component, per its own compliance report's
  disclosed "future reconciliation" note. Reconciling the two is a discretionary follow-up, not
  required by this pass.

## 6. Validation

| Command | Result |
|---|---|
| `npm run typecheck` | ✅ Pass |
| `npm run lint` (eslint + `lint:css`) | ✅ Pass (DC-04 no hardcoded colors, DC-23 no physical-direction props) |
| `npm run format:check` (touched files) | ✅ Pass |
| `npm test` (Tooltip only) | ✅ 12/12 passing (up from 2) |
| `npm run tokens:validate` | ✅ 765 defined, 672 referenced, 0 missing |
| `npm run build` | ✅ Pass |
| `npm run build-storybook` | ✅ Pass |

Full-suite `npm test`: 714/720 passing; the same 6 pre-existing failures as the prior Avatar pass
(`HomePage.test.tsx`/`hackathonFlow.test.tsx`/`ApplicationFormPage.test.tsx`, a combobox-selection
timing issue unrelated to Tooltip or any token this pass touched).

## 7. Approval

Live node, both light/dark modes, all 4 placements, the title/icon slots, and RTL verified before
Tooltip is marked Approved. Needs-Confirmation items (non-blocking, spec §9): the icon-size
approximation (16px vs. the live-verified 18px) and the beak's CSS-reconstructed geometry (not
independently pixel-verified, same category as `TrailingIcon`'s own beak).
