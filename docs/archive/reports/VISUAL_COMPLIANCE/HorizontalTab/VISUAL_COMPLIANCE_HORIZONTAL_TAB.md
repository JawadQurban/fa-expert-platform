# Visual Compliance Report — Horizontal Tab / Horizontal Tab List (CMP-09)

Comparison of `docs/FIGMA_HORIZONTAL_TAB_SPECIFICATION.md` against the pre-existing
`frontend/src/design-system/composite/Tabs/` implementation (`Tabs.tsx` / `Tabs.module.css`,
built pre-workflow, Phase 5B). **No code changes in this file** — comparison only, per
`docs/VISUAL_COMPLIANCE_WORKFLOW.md` Step 4.

The pre-existing implementation predates any live Figma verification (its own doc comment reads
"⚠ Visual fidelity Pending final DGA token values (Q3/Q20)") and turns out to be a generic
"bordered pill" tab style with **no relationship to the official DGA component at all** — the
same category of near-total mismatch previously found for `Alert` and `Avatar`, not a
minor-corrections case like `Link`/`Tag`.

## Discrepancies found

| # | Area | Figma (live-verified) | Pre-existing implementation | Fix required |
|---|---|---|---|---|
| 1 | Shape | Borderless, bottom 3px underline-bar indicator | Full pill (`border-radius: pill`) with a visible `border` on every tab | Remove border/pill entirely; add the underline indicator |
| 2 | Selected style | No background change; bold `#161616` text + green underline | Solid `background-color: primary` fill + `text-on-primary` (inverted) text | Remove the fill; use bold text + underline |
| 3 | `size` prop | 3 sizes (Small/Medium/Large), independent padding + height | None — single unsized style | Add `size` (`sm`/`md`/`lg`) |
| 4 | Icon support | 16×16 leading icon slot (`icon` boolean + `swapIcon` override) on every size | None | Add an `icon: ReactNode` slot per tab item |
| 5 | Disabled | Generic `opacity: var(--fads-sys-opacity-disabled)` | Solid muted `#9da4ae` on text/icon/indicator, no opacity | Replace opacity approximation with live-verified solid colors |
| 6 | Hover (unselected) | `#f3f4f6` background + black preview indicator bar + pointer cursor | No hover treatment at all | Add the real hover state |
| 7 | Pressed (unselected) | `#e5e7eb` background + black preview indicator bar | No pressed treatment at all | Add the real pressed state |
| 8 | Focus-visible | Double-ring (3px black inner + 1px white outer offset), same construction already Approved on `Button` | Native browser default outline only | Add the Button-style double ring |
| 9 | Tab List baseline | Full-width 3px `#d2d6db` divider behind the per-tab indicator | No divider element exists | Add the `divider` element (default `true`) |
| 10 | Inter-tab spacing | **None** — tabs sit directly adjacent, spacing only from each tab's own padding | `.list { gap: var(--fads-sys-space-inline-sm) }` — an invented gap | Remove the gap |
| 11 | Wrapping | No wrap variant in Figma; overflow handled via a dedicated `moreTab` trigger, not multi-row wrap | `.list { flex-wrap: wrap }` — lets tabs wrap to a second row | Remove `flex-wrap`; add real `overflow-x: auto` single-row scroll instead |
| 12 | `flush` prop | Removes the tab row's leading padding inset so the first label touches the container edge | Not implemented | Add `flush` |
| 13 | `moreTab` overflow trigger | Icon-only 32×32 shell, trailing item in the row | Not implemented | Add an optional overflow-trigger slot (visual shell only — see spec §5 Needs Confirmation) |
| 14 | Badge/count | **Confirmed absent** in all 68 sampled Figma variants | Not implemented | No change — confirmed non-requirement, not a gap |
| 15 | Tokens | Consumes only generic shared tokens (`--fads-sys-color-primary`, `--fads-sys-color-text-on-primary`, `--fads-sys-radius-pill`, `--fads-sys-space-inline-sm`, etc.) — none of them the real Tab-specific values | New additive `--fads-sys-tabs-*` tokens, independently sourced from live `get_variable_defs` output | Mint the new token set (`scripts/generate-tokens.mjs`), reuse only the already-shared cross-cutting `--fads-sys-radius-sm`/`--fads-sys-radius-full`/`--fads-ref-font-weight-*`/`--fads-sys-typography-text-sm`/`--fads-sys-typography-line-height-sm` |

## What is kept unchanged (already correct)

- `role="tablist"`/`role="tab"`/`role="tabpanel"` structure, roving `tabindex`, and the
  RTL-aware Arrow-key handling (`ArrowRight`/`ArrowLeft` swap meaning under `dir="rtl"` so the key
  always matches the visual direction of travel) — already matches WAI-ARIA APG Tabs and needed no
  Figma-side correction (Figma has no keyboard-interaction annotations to compare against; this
  behavior was independently verified as correct against the WAI-ARIA spec, not against Figma).
- `Home`/`End` jump-to-first/last-enabled-tab behavior — same reasoning.
- The single generic `label: ReactNode` per item (Figma's `textEn`/`textAr` dual-language props are
  its own mock-content mechanism, not evidence of a required dual-prop API — see spec §1).

## Accessibility notes

- Axe scan required on: default (icon + no-icon), selected/unselected, disabled, focus-visible,
  RTL, and the overflow-trigger shell.
- The `moreTab` trigger shell needs a real accessible name (`aria-label`) since it renders no
  visible text — same requirement already established for `ButtonClose`/`Pagination`'s icon-only
  controls.

## Required code changes (Step 5 checklist)

1. `scripts/generate-tokens.mjs` — add ~24 new additive `--fads-sys-tabs-*` tokens (see spec §2–4),
   run `npm run tokens:generate`.
2. `Tabs.tsx` — add `size`, per-item `icon`, `flush`, `divider` (default `true`), and an optional
   overflow-trigger slot; keep existing ARIA/keyboard logic.
3. `Tabs.module.css` — full rebuild: remove pill/border/fill styling; add underline indicator,
   per-size padding/height, hover/pressed/focus-visible states, disabled solid colors, the Tab
   List divider, and `overflow-x: auto` (no wrap).
4. `Tabs.stories.tsx` — cover every corrected/new variant.
5. `Tabs.test.tsx` — extend for `size`, icon rendering, disabled visuals, and keep all existing
   ARIA/keyboard coverage passing unmodified.

## Needs Confirmation (non-blocking — see spec §7)

1. `moreTab` Closed vs. Open visual difference (pixel-identical in the two sampled nodes).
2. `more-horizontal` icon glyph — CSS-drawn substitute (registry gap, same category as Pagination's
   arrow icons).
3. `flush` at Large size / combined with RTL — extended by analogy, not independently re-sampled.
4. The exact overflow/auto-collapse algorithm behind `moreTab` — Figma shows no evidence of one;
   this pass ships the trigger's visual shell plus a real `overflow-x: auto` scroll fallback, not
   an invented collapse algorithm.
