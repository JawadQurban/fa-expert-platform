# Visual Compliance — Button (CMP-05)

> **Prepared by:** Principal Frontend Engineer
> **Date:** 2026-07-08 (supersedes the 2026-07-08 pass recorded below in §7)
> **Scope:** Button component ONLY (`frontend/src/design-system/primitives/Button/`). No other component, no page.
> **Rule applied:** `CLAUDE.md` § Visual Compliance Rule + § Figma MCP Policy — Figma is the primary visual reference; only read-only MCP tools (`search_design_system`, `get_metadata`, `get_design_context`, `get_screenshot`, `get_variable_defs`) were used; nothing was invented.
> **Relocated:** this is the canonical copy of the Button visual-compliance report, per `reports/VISUAL_COMPLIANCE/README.md`'s one-folder-per-component convention. The original path (`reports/VISUAL_COMPLIANCE_BUTTON.md`) now redirects here.

---

## 1. What changed since the last pass

The previous compliance pass (§7 below) only had access to the **exported design-token JSON** (`references/figma/foundations/*.tokens.json`) — there was no live connection to the actual Figma component. This pass connects directly to the official Button component set via the Figma MCP (`Sv0oWOS1SjWnwhQwdzRJIE`, node `407:510376`, 1,344 variant instances) and inspects real geometry, states, and every `Style`/`Size`/`Destructive`/`On-color`/`Icon only` combination sampled. Full findings: `docs/FIGMA_BUTTON_SPECIFICATION.md`.

This closed every "Needs Confirmation" item the previous pass left open for sizing, typography, disabled, focus, and secondary/tertiary, and surfaced one unrelated but serious bug (§2).

## 2. Headline finding, now fixed — dead token references

`Button.module.css` referenced 9 CSS custom properties that did not exist anywhere in `tokens/generated/tokens.css` (`--fads-sys-control-height-*`, `--fads-sys-control-padding-inline-*`, `--fads-sys-control-radius`, `--fads-sys-border-width-thin/thick`, `--fads-sys-opacity-disabled`, `--fads-sys-color-background-hover/pressed`, `--fads-sys-color-text-on-primary`). None of the `var()` calls had fallback values, so every one of these declarations silently resolved to nothing — the Button had no real height, padding, radius, border width, or disabled treatment at runtime. **Fixed**: all 9 replaced with real, generated tokens; `scripts/verify-tokens.mjs` (`npm run tokens:check-coverage`) now reports 0 missing references (was already a repo-wide gate — Button was the one component still failing it silently, since the gate only runs as part of `tokens:validate`, not `lint`).

## 3. Check-by-check findings and fixes

| Check | Official finding (live Figma MCP) | Fix applied |
|---|---|---|
| **Sizes / padding / height** | Verified: sm=24/8px, md=32/12px, lg=40/16px (height/padding-inline); gap=4px all sizes; icon=16/20/24px. No longer "Pending Q3/Q20" — real values exist. | New `--fads-sys-button-{height,padding-inline,gap,icon-size}-{sm,md,lg}` tokens (generate-tokens.mjs), consumed by `Button.module.css`. |
| **Typography** | Official scale is one rung lower than what we used: Small=12px/18px lh, Medium=14px/20px lh, Large=16px/24px lh; weight is **Medium (500)**, not Semibold (600). | `sm`→text-xs, `md`→text-sm, `lg`→text-md; new `--fads-sys-typography-line-height-{xs,sm,md}` tokens (18/20/24px, general-purpose); font-weight switched to `--fads-ref-font-weight-medium`. |
| **Border radius** | `radius-sm` = 4px, uniform across every size/style/state sampled. | Repointed at the existing `--fads-sys-radius-sm` (was pointing at the undefined `--fads-sys-control-radius`). |
| **Selected state (primary)** | The live "Selected" variant's background class is hard-wired to the same variable as "Pressed" — there is no separate official selected color, despite a distinct `button-background-primary-selected` (`#14573a`) token existing in the shared Figma variable collection. | The fabricated, unused-by-the-real-component `#14573a` value is no longer consumed by `Button.module.css`; `[data-selected='true']` now reuses each variant's own Pressed background, matching the one directly-verified live behavior. The token itself is still generated (real data) but documented as unused by Button. |
| **Disabled state** | Flat, variant-agnostic: background `#e5e7eb`, text `#9da4ae` — not a dimmed version of the variant's own color. | Replaced `opacity: var(--fads-sys-opacity-disabled)` (undefined token) with solid `--fads-sys-button-disabled-bg`/`-disabled-label`, applied identically regardless of variant/destructive/on-color. |
| **Focused state** | A real, distinct double-ring treatment: 2px dark inner border + a separate 3px light ring offset 2px further out — not just "the ambient focus ring." | Added a dedicated `:focus-visible` rule (`box-shadow` + `outline`, non-layout-affecting) using new `--fads-sys-button-focus-ring-{inner,outer}` tokens. |
| **secondary variant** | Maps to the official **Secondary-Outline** style: neutral gray border (`#d2d6db`), dark text (`#161616`) — not a brand-primary-colored outline. | Recolored; border/text now use `--fads-sys-button-border-neutral` / `--fads-sys-button-label-default`. Same prop name/value (`variant="secondary"`), only the CSS changed — no consumer breakage. |
| **tertiary variant** | Maps to the official **Transparent** style: dark text by default, background never gains a fill in any state (including Pressed) — only the text color shifts to primary-pressed green on Pressed. | Recolored to match; no longer permanently brand-green. |
| **Missing variants** | Official has 6 styles + Destructive + On-color + Icon-only axes. | Added `neutral` (official Neutral/solid-dark) and `secondarySolid` (official Secondary-Solid/light-gray) variants; added `destructive`/`onColor` boolean modifiers; added first-class icon-only support (fixed square sizing + dev-time accessible-name warning). Subtle style was not added (not in the requested scope). |
| **RTL** | Label uses `dir="auto"`; the exact icon-mirroring mechanism vs. an `RTL=False` node was not diffed. | Added `dir="auto"` to the rendered label. Icon-mirroring mechanism remains **Needs Confirmation** — not enough live data to act on safely. |
| **Motion** | No transition/easing/duration data exists in the Figma file for this component (static per-state snapshots only). | Unchanged — existing transition timing is an implementation choice, not contradicted or confirmed by Figma. |

## 4. Scope limits — what was intentionally NOT extended

- **`destructive`/`onColor` are implemented as full-variant overrides**, independent of `variant`, because the live component was only sampled for these axes in combination with the **Primary** style. Applying them to `neutral`/`secondarySolid`/`secondary`/`tertiary` would require fabricating untested combinations — not done. If product needs e.g. a destructive Secondary-Outline button, it must be verified against the real component first.
- **Secondary-Outline's and Transparent's hover state were not sampled live** (only Default/Pressed were). Both are left equal to Default rather than inventing a hover shade — flagged in code comments.
- **Subtle style was not added** — not requested in this pass's scope, and closely overlaps with Transparent/Secondary-Solid already added.
- **Icon-mirroring for RTL** was not changed beyond adding `dir="auto"` to the label — the exact mechanism needs a direct `RTL=False` vs `RTL=True` diff before any layout change is made.

## 5. Files changed

- `frontend/scripts/generate-tokens.mjs` — resolves alias-string Button token values (e.g. `{Alpha.alpha-white-60}`); generates the full official color set (neutral/secondarySolid/danger/oncolor + label/border/focus/disabled scalars) from `Light.tokens.json`; generates Button size tokens (height/padding-inline/gap/icon-size) and general-purpose typography line-height tokens, sourced from live Figma MCP verification (no local JSON variable exists for these).
- `frontend/src/design-system/tokens/generated/tokens.css`/`tokens.ts`/`token-map.json` — regenerated (215 tokens, up from 123).
- `frontend/src/design-system/primitives/Button/Button.module.css` — rewritten: dead tokens removed, typography/sizing/radius corrected, secondary/tertiary recolored, neutral/secondarySolid/destructive/onColor added, disabled and focus reimplemented, icon sizing tokenized per-size.
- `frontend/src/design-system/primitives/Button/Button.tsx` — `ButtonVariant` extended with `neutral`/`secondarySolid`; new `destructive`/`onColor` props; icon-only detection (`data-icon-only`) with a dev-only console warning when an icon-only button has no accessible name; `dir="auto"` added to the label.
- `frontend/src/design-system/primitives/Button/Button.stories.tsx` — added Neutral, SecondarySolid, Destructive, OnColor, IconOnly stories; updated AllVariants/description.
- `frontend/src/design-system/primitives/Button/Button.test.tsx` — 28 tests (up from 11): the fabricated `#14573a` assertion removed and replaced with a reuses-Pressed assertion; new tests for every new token group, the typography-rung fix, disabled solid colors, the focus double-ring, all 5 variants, destructive/onColor attributes, and icon-only behavior (including the dev warning).
- `docs/FIGMA_BUTTON_SPECIFICATION.md` — new: full official Button specification pulled live from Figma MCP.

No other component's `.module.css`, tests, or stories were touched. `HomePage.tsx`/the landing page were not touched — its existing `variant="primary"`/`variant="secondary"` usage keeps working (same prop values, corrected colors).

## 6. Verification

Green: `typecheck` · `lint` (incl. `lint:css`, zero hard-coded-color/physical-property violations) · `format:check` · `test` (**216 passing**, 42 files — 17 new, all in Button) · `tokens:validate` (215 tokens generated, **0 of 136 referenced tokens missing** — was silently broken for Button before this pass) · `build` · `build-storybook`.

## 7. Prior pass (2026-07-08, token-JSON-only access) — superseded above, kept for history

<details>
<summary>Original report (Frontend 0.5.1) — click to expand</summary>

### What was actually available to compare against

`references/figma/LINKS.md` points at the official Figma Component Library, but only its **exported design tokens** were checked into the repo at the time — there was no live Figma MCP connection yet. "Compare against the official Figma Button" was done at the **token level**, not a live component inspection.

### Fixed then

- `scripts/generate-tokens.mjs` had never ingested `Light.tokens.json`'s official per-component `Button` color tokens. The `primary` variant's Default/Hovered/Pressed colors were one reference shade too light, and Selected had no distinct color at all (silently reused Pressed). Fixed via 5 new, additive `--fads-sys-button-primary-bg-*` tokens.

### Left unchanged then (Needs Confirmation) — now resolved above

- `secondary`/`tertiary` had no verified official equivalent from token JSON alone → now mapped to Secondary-Outline/Transparent per live inspection (§3).
- Sizing (height/padding) had no official token source → now verified live (§3).
- Disabled state's opacity approach had no official data to contradict it → now known to be wrong; replaced with solid colors (§3).
- `black`, `danger-primary`, `danger-secondary`, `oncolor` color groups were not added, since nothing called for them → `neutral` (black) and `destructive`/`onColor` (danger/oncolor) added in this pass, in the same restricted scope described in §4.

</details>
