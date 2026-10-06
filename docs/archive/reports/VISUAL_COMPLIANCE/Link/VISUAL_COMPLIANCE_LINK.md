# Visual Compliance — Link

Compares the official Platforms Code Link component (see `docs/FIGMA_LINK_SPECIFICATION.md`,
node `2508:25804` in file `cII2UMRzWj0rwKuMzWFqTU`) against the FADS `Link` primitive as it stood
before this pass (`frontend/src/design-system/primitives/Link/Link.tsx` /
`Link.module.css`, both pre-existing — Link was already `Implemented` per
`figma-component-map.json`, just not yet visually verified).

---

## 1. Prior Implementation Summary

Before this pass, `Link` supported only `external`, `disabled`, `iconEnd`, and the base anchor
props. Styling used 5 shared/general tokens (`--fads-sys-color-text-link`,
`--fads-sys-color-link-hover`, `--fads-sys-color-primary-pressed`,
`--fads-sys-color-link-visited`, `--fads-sys-color-text-disabled`) plus generic
`--fads-sys-control-gap` and `--fads-sys-radius-sm` — **none of which are the Link-scoped Figma
variables** the official component actually uses. There was no `mood`/`style` axis, no `size` axis,
no `inline` axis, and no focus-visible treatment at all (focus fell through to the browser
default outline).

## 2. Differences Found (and Fixed)

| # | Area | Official (live-verified) | Prior implementation | Fixed this pass |
|---|---|---|---|---|
| 1 | Color tokens | 3 moods (`Primary`/`Neutral`/`On-color`) × up to 6 states, all from Link-scoped Figma variables (`Link/link-primary`, `Link/link-neutral`, `Link/link-oncolor`, + hover/pressed/focused/visited/disabled per mood) | One fixed color scheme reusing generic, non-Link tokens (`--fads-sys-color-text-link` etc.) — not sourced from the Link component's own Figma variables at all | ✅ Added 3 full mood color chains as new `--fads-sys-link-*` tokens (`generate-tokens.mjs`), applied via `data-mood` |
| 2 | `mood`/`style` prop | Official `Style` variant: `Primary` / `Neutral` / `On-color` | No such prop — only ever rendered the single hardcoded color scheme | ✅ Added `mood` prop (`LinkMood`), default `'primary'` |
| 3 | `size` prop | Official `Size` variant: `Small` (14px/20px lh, 4px gap, 16px icon) / `Medium` (16px/24px lh, 8px gap, 20px icon) | No size prop — fixed at whatever the inherited font-size happened to be, generic gap token, `0.85em` icon | ✅ Added `size` prop (`LinkSize`), default `'md'`, with dedicated `--fads-sys-link-gap-*`/`--fads-sys-link-icon-size-*` tokens |
| 4 | `inline` prop / underline rule | Official `Inline` variant: `True` → always underlined (every state); `False` (default) → underlined only on Hover/Pressed | Always `text-decoration: underline` at rest, only relied on `:hover`; disabled removed underline. Did not distinguish standalone-vs-embedded usage at all | ✅ Added `inline` prop, default `false`; base link has no underline except `:hover`/`:active`; `[data-inline='true']` forces underline in every state (§6 of spec) |
| 5 | Focus state | A real, live-verified 2px solid border around the whole link box (`Border/border-black` for Primary/Neutral, `Border/border-white` for On-color); text color unchanged from Default | No focus-visible rule at all — relied on the browser's default focus outline | ✅ Added `:focus-visible { border-color: ... }` with a transparent 2px border reserved at rest (no layout shift), mood-aware (`onColor` swaps to the white border token) |
| 6 | Focused text color | Same as Default (`link-primary-focused === link-primary`, etc. — live-verified, no color change) | N/A (no focus state existed) | ✅ No color rule added for `:focus-visible` — correctly matches Default, per the live data (not an omission) |
| 7 | Disabled color | Primary/Neutral disabled both reference the shared `Global/text-default-disabled` token (not a Link-specific one); On-color disabled has its own translucent-white token | Used `--fads-sys-color-text-disabled` (a generic, non-Link token that happens to be the same underlying value) | ✅ Replaced with `--fads-sys-link-disabled` (Primary/Neutral) and `--fads-sys-link-oncolor-disabled` (On-color), independently sourced per the "additive, no cross-component repointing" convention |
| 8 | Pressed color | `Link/link-primary-pressed` (`#88d8ad`) | `--fads-sys-color-primary-pressed` (a Button-scoped/generic token, coincidentally similar in intent but not the same verified value) | ✅ Now uses `--fads-sys-link-primary-pressed`, live-verified |
| 9 | Neutral+Visited discrepancy | Live component references the *Primary*-mood visited token (`#14573a`), not a distinct Neutral-visited color | N/A (no Neutral mood existed) | ⚠ Implemented to match the live node exactly (`--fads-sys-link-neutral-visited: #14573a`) — flagged **Needs Confirmation** in both the spec and the token comment, since `Light.tokens.json`'s own bulk `Link.link-neutral-visited` value (`#4d5761`) disagrees. This is a genuine source inconsistency, not a guess. |
| 10 | Icon sizing | 20px (Medium) / 16px (Small), matching label size tier | Fixed `0.85em` relative sizing, no size-tier awareness | ✅ Icon now uses `--fads-sys-link-icon-size-{sm,md}`, kept the same `0.85em` font-size for the placeholder-glyph fallback inside that box |
| 11 | Gap (label↔icon) | 4px (Small) / 8px (Medium), from `Link/link-sm-gap`/`link-md-gap` | Generic `--fads-sys-control-gap` (not Link-scoped, no size distinction) | ✅ `--fads-sys-link-gap-{sm,md}`, live-verified |
| 12 | `Danger` mood | **Does not exist** on this live component set (only Primary/Neutral/On-color) | N/A | ✅ Confirmed not to add one — an earlier same-day search-only attempt (superseded, see `LINK_NODE_RESOLUTION_REPORT.md`) had surfaced `danger`-named tokens from a *different* file/context; the live node settles this: no Danger variant exists here |
| 13 | RTL | No dedicated RTL markup change needed — logical CSS + native `dir` already reproduce the Figma source's RTL layout (icon visually trailing in both directions) — see spec §8 | Already used only logical properties (`text-underline-offset`, no left/right) | ✅ No change required; verified equivalent (not a gap) — confirmed via live RTL variant sampling this pass |
| 14 | Cursor | `cursor: pointer` on Hovered (live-verified utility class); Disabled has no such class | `cursor: pointer` unconditionally on `.link`, `cursor: not-allowed` on disabled | ✅ Kept `cursor: pointer` as the base link's cursor (standard convention for any actionable link, matches Hovered's affordance) and `not-allowed` on disabled — no functional change, already correct |

## 3. Accessibility

- Focus indicator is now a real, visible, non-color-reliant border (previously relied on browser
  default, which is inconsistent across browsers and sometimes suppressed by resets) — a genuine
  a11y improvement, not just a visual match.
- `inline=true`'s always-on underline directly improves WCAG 1.4.1 (use of color) compliance for
  links embedded in running text — see spec §9.
- Disabled semantics (`aria-disabled`, no `href`, `pointer-events: none`) unchanged — already
  correct, no Figma-sourced ARIA guidance contradicts it.
- `dir="auto"` added to the label span (matches `Button`'s existing pattern) for correct
  mixed-direction text rendering.

## 4. RTL

No layout bug found or fixed — confirmed via live comparison (spec §8) that the existing
logical-properties-only approach already reproduces the Figma source's RTL behavior without
needing a DOM-order swap.

## 5. Scope

- Only `Link.tsx`, `Link.module.css`, `Link.stories.tsx`, `Link.test.tsx`, and the two
  `primitives/index.ts` barrel exports were touched.
- `generate-tokens.mjs` gained one new additive `fads-sys-link-*` token block (24 tokens); no
  existing token was modified or removed.
- No other component's files were touched. `Header`/`Footer`/`Breadcrumbs` (which will eventually
  compose `Link`) are unchanged this pass — out of scope per "fix one component at a time."

## 6. Required Code (this pass) — Status

1. ✅ `Link.tsx` — added `mood` (`LinkMood`), `size` (`LinkSize`), `inline` props; kept
   `external`/`disabled`/`iconEnd` unchanged (backward compatible — no existing consumer outside
   Link's own stories/tests found repo-wide).
2. ✅ `Link.module.css` — token-only, no hardcoded colors/spacing (verified: `lint:css` scans for
   this, see §7 validation).
3. ✅ `scripts/generate-tokens.mjs` — 24 new additive `--fads-sys-link-*` tokens.
4. ✅ `Link.stories.tsx` — Default, External, Disabled, Moods, Sizes, Inline, InPageContext, RTL.
5. ✅ `Link.test.tsx` — mood/size/inline data-attribute coverage added alongside the existing
   href/external/disabled/a11y tests; added a disabled-state a11y check.
6. ✅ Exported from both `primitives/Link/index.ts` and `primitives/index.ts` (public `@ds` API)
   — `LinkMood`/`LinkSize` added alongside the existing `LinkProps`.

## 7. Validation

Run one command at a time per the workflow, in order:

| Command | Result |
|---|---|
| `npm run typecheck` | ✅ Pass |
| `npm run lint` (eslint + `lint:css`) | ✅ Pass |
| `npm run format:check` | ✅ Pass (after `prettier --write` on the 3 touched/generated files) |
| `npm test` | ✅ 43 files / 309 tests pass, including 12 Link tests |
| `npm run tokens:validate` | ✅ Pass (254 tokens generated, 0 missing references) |
| `npm run build` | ✅ Pass |
| `npm run build-storybook` | ✅ Pass |

## 8. Approval

All of: live node, all 144 variants' governing axes (rtl/state/style/size/inline), variables,
screenshot, RTL behavior, accessibility, tests, and every validation command above are verified.
**Link is approved** — see `figma-component-map.json` and `docs/COMPONENT_APPROVAL_MATRIX.md` for
the formal record. The one open item (§2 row 9, Neutral+Visited color) is flagged **Needs
Confirmation**, non-blocking — same category as prior components' scoped exceptions (Button's
Destructive/OnColor restriction, Card's Selectable/Expandable gap, etc.).
