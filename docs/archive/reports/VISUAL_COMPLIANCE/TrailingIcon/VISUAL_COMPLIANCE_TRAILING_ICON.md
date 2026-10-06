# Visual Compliance — TrailingIcon

Compares the new FADS `TrailingIcon` primitive against the official
Platforms Code Trailing Icon component (see
`docs/FIGMA_TRAILING_ICON_SPECIFICATION.md`, node `30150:92875` in file
`J0xq7JG3JKshRDzrgAM7E0`). Registry status was `Missing` before this pass —
no prior implementation existed.

---

## 1. Live Verification

The full 2-variant set (`Open`[False/True]) resolved in a single
`get_design_context` call — the smallest variant set of any component in
this batch so far. A dedicated `get_screenshot` on the `Open=True` node was
needed to correctly determine panel placement (see §2). `get_variable_defs`
returned 8 named Figma variables.

## 2. A Real Finding: Panel Placement

The extracted markup's nested flex structure was ambiguous about whether
the helper-text panel appears above or below the icon. A dedicated
screenshot of the `Open=True` variant resolved this: the icon sits on top,
the panel appears **below** it with the beak pointing **up** toward the
icon — the reverse of the more common tooltip-above-trigger convention.
Implemented exactly as observed, not assumed from the more common pattern.

## 3. Implementation Summary

New primitive `TrailingIcon` — a real `<button>` (required `icon` +
`label` props, `label` drives both `aria-label` and the panel's visible
text) with a `role="tooltip"` panel that shows on hover/focus and hides on
mouseleave/blur/Escape, linked via `aria-describedby` only while open —
mirrors this project's existing `Tooltip` primitive's own interaction
pattern. The panel's own visual (white fill, dark semibold text, a
CSS-drawn beak, two-layer shadow) is **not** reused from `Tooltip`'s current
code — see §4.

## 4. A Real Dependency Gap: Same Figma Tokens as `Tooltip`, Different Code

`get_variable_defs` returned `Tooltip/tooltip-gap`, `-background-light`,
`-text-heading-light`, `-padding` — the same Figma variable family as this
project's own separately-registered `Tooltip` component. `Tooltip` itself
is `visualComplianceStatus: "pending"` (scheduled batch 7, not yet
reached) and its current CSS is an explicitly-marked placeholder
("⚠ Pending final DGA token values") rendering a **dark-inverse** bubble —
the opposite of the **light/white** panel live-verified here. Composing
`<Tooltip>` as-is would have shipped the wrong visual; expanding this
session to also fix `Tooltip` would have broken the batch's strict
one-component-per-session rule. `TrailingIcon` therefore implements its own
small, accurately-verified panel, reusing `Tooltip`'s interaction pattern
but not its markup/CSS — the same category of "not-yet-verified dependency"
situation as `DatePicker`'s year-dropdown and the not-yet-built "Dropdown
List Item," disclosed for future reconciliation once `Tooltip` gets its own
compliance pass.

## 5. Token Changes

12 new additive `--fads-sys-trailingicon-*` tokens (hit-padding, icon size/
color, tooltip gap/min-width/max-width/background/shadow/padding/text/
font-size/line-height). Corner radius, z-index, and semibold font-weight
reuse the already-shared generic `--fads-sys-radius-sm`/`--fads-sys-z-tooltip`/
`--fads-ref-font-weight-semibold` tokens directly (not duplicated). No
tokens removed.

## 6. Icon Substitution — a Registry Gap, Not a Wrong Shape

The live sample's default icon (`mic-01`) does not exist anywhere in the
FADS icon registry — it belongs to the not-yet-imported `Communications`
category (179 icons, per `docs/ICON_LIBRARY.md`/`reports/ICON_IMPORT_REPORT.md`).
Importing an entire 179-icon category for one icon would be disproportionate
scope creep for this component's own session and would violate the
established per-category import batching convention. `TrailingIcon`'s
`icon` prop is fully generic (any `ReactNode`) — the component itself is
not blocked; only the Storybook demos use already-imported icons
(`cancel-01`/`search-01`) in place of the literal `mic-01`. Disclosed as a
registry gap, not a visual-fidelity substitution.

## 7. Storybook Coverage

Clear, Search, Disabled, **OfficialFigmaReference** — 4 stories (new
component).

## 8. Accessibility

- Required `label` prop (icon-only control) drives both `aria-label` and
  the panel's visible text.
- Panel is `role="tooltip"`, linked via `aria-describedby` only while open
  — WCAG 1.4.13-compatible (dismissable via Escape, persists on
  hover/focus).
- No Figma-verified `Focused` state exists (only 2 variants total) — a
  focus-visible outline was still added using already-shared generic
  tokens, since WCAG 2.2 requires visible focus regardless of Figma sample
  completeness.

## 9. Validation

| Command | Result |
|---|---|
| `npm run typecheck` | ✅ Pass |
| `npm run lint` (eslint + `lint:css`) | ✅ Pass |
| `npm run format:check` | ✅ Pass (after `prettier --write` on the new test file and regenerated `tokens.css`/`generate-tokens.mjs`) |
| `npm test` | ✅ 585/585 tests, 49 files (9 new in `TrailingIcon.test.tsx`) |
| `npm run tokens:generate` | ✅ 643 tokens generated |
| `npm run tokens:validate` | ✅ Pass |
| `npm run tokens:check-coverage` | ✅ Defined: 690, Referenced: 594, Missing: 0 |
| `npm run build` | ✅ Pass |
| `npm run build-storybook` | ✅ Pass |

## 10. Scope

- New files: `TrailingIcon.tsx`, `TrailingIcon.module.css`,
  `TrailingIcon.stories.tsx`, `TrailingIcon.test.tsx`.
- `frontend/src/design-system/primitives/index.ts` — added barrel export.
- `frontend/scripts/generate-tokens.mjs` — new additive Trailing Icon token
  block (12 tokens).
- `Tooltip.tsx`/`Tooltip.module.css` and every previously-Approved
  component are **unchanged** — confirmed via the full regression suite
  (585/585, up from 576).

## 11. Approval

Live-verified across its full (small) 2-variant set, a dedicated screenshot
resolved a real panel-placement ambiguity, one genuine dependency gap found
and correctly handled (reusing `Tooltip`'s interaction pattern without its
unverified visual), one disclosed icon-registry gap (not a wrong-shape
substitution), zero regressions, Storybook/tests/validation all pass.
