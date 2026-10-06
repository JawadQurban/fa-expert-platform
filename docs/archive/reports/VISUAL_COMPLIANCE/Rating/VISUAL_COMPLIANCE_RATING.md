# Visual Compliance — Rating

Compares the new FADS `Rating` composite against the official Platforms
Code Rating component (see `docs/FIGMA_RATING_SPECIFICATION.md`, node
`30150:69520` in file `J0xq7JG3JKshRDzrgAM7E0`). Registry status was
`Missing` before this pass — no prior implementation existed.

---

## 1. Live Verification

`get_design_context` on the component-set root (`30150:69520`) returned the
`size`[Large/Medium/Small] × `brand` variant structure; `get_metadata` +
`get_design_context` on the `_RatingStar` sub-component (`30150:69453`)
returned its own richer 24-variant set (`size` × `state`[Normal/Half/
Selected/Pressed] × `style`[Default/Brand]); `get_variable_defs` on both
returned the full live color token set.

## 2. The Key Finding: Two Real Modes, Not One

Directly sampling the `_RatingStar` **Pressed** state (node `30150:69470`)
confirmed each star is a real, independently-focusable `<button>` in the
live data — a genuine interactive input, not a decorative display. The
**Half** state exists specifically for a half-filled star, which is only
reachable via a non-interactive aggregate/average score display (a user's
own click always commits a whole star). This directly motivated the
dual-mode architecture: interactive `<button>`-per-star when `onChange` is
given, vs. a non-interactive `role="img"` display (supporting `.5`
fractional values) when it is not. See
`docs/FIGMA_RATING_SPECIFICATION.md` §2 for the full reasoning.

## 3. Icon-Registry Gap: Hand-Authored Star

No star icon exists anywhere in the FADS icon registry (checked the
already-imported `Shapes` category specifically). Unlike this batch's
earlier icon-registry gaps, which had reasonable existing substitutes, a
rating component has no substitute for its own defining shape, and
importing a whole new icon category for one glyph would be disproportionate
scope creep. Following the `Checkbox` checkmark precedent, a simple 5-point
star `<path>` is hand-authored inline, with the half-fill implemented as a
CSS `clip-path` overlay of the same path rather than a separate baked
half-star asset (see spec §3–4).

## 4. Byte-Identical / Reused Tokens

`get_variable_defs` confirmed the star fill colors are the design system's
own generic semantic backgrounds (`background-secondary` gold,
`background-primary` green, `background-neutral-200` empty,
`background-neutral-100` hover) — no new one-off hex values invented. Gap
spacing, hover-circle radius, and focus-ring styling all reuse
already-shared generic tokens directly.

## 5. Token Changes

7 new additive `--fads-sys-rating-*` tokens: 4 colors (`star-empty`,
`star-filled`, `star-filled-brand`, `hover-bg`) sourced from
`getLightToken(...)`, plus 3 literal size tokens (`star-size-sm/md/lg`)
matching the live-verified per-size star dimensions.

## 6. No RTL Variant — Confirmed by Absence

Both `Rating`'s and `_RatingStar`'s own Figma-extracted prop lists were
inspected directly and contain no `rtl` prop at all — used as live evidence
that star order is fixed left-to-right regardless of document direction,
not assumed either way (see spec §5).

## 7. Storybook Coverage

ReadOnlyDisplay, ReadOnlyBrand, ReadOnlyZero, ReadOnlyFull, Interactive,
InteractiveBrand, Sizes, **OfficialFigmaReference** — 8 stories (new
component).

## 8. Accessibility

- Read-only mode: single `role="img"` group with a summarizing
  `aria-label`; individual stars are `aria-hidden` since the group label
  already conveys the full value.
- Interactive mode: one real `<button>` per star, each with its own
  `aria-label` ("N of max", optionally prefixed by a caller label) and
  `aria-pressed` reflecting selection — independently focusable and
  operable by keyboard with no extra wiring needed (native button
  semantics).
- `expectNoA11yViolations` checked in both modes — 0 violations.

## 9. Validation

| Command | Result |
|---|---|
| `npm run typecheck` | ✅ Pass |
| `npm run lint` (eslint + `lint:css`) | ✅ Pass |
| `npm run format:check` | ✅ Pass (after `prettier --write` on the new stories/test files and regenerated `tokens.css`) |
| `npm test` | ✅ 641/641 tests, 55 files (9 new in `Rating.test.tsx`, up from 632) |
| `npm run tokens:generate` | ✅ 678 tokens generated |
| `npm run tokens:validate` | ✅ Pass |
| `npm run tokens:check-coverage` | ✅ Defined: 725, Referenced: 630, Missing: 0 |
| `npm run build` | ✅ Pass |
| `npm run build-storybook` | ✅ Pass (`Rating.stories` chunk emitted) |

## 10. Scope

- New files: `Rating.tsx`, `Rating.module.css`, `Rating.stories.tsx`,
  `Rating.test.tsx`.
- `frontend/src/design-system/composite/index.ts` — added `Rating` barrel
  export.
- `frontend/scripts/generate-tokens.mjs` — new additive Rating token block
  (7 tokens).
- Every previously-Approved component is unchanged.
- Confirmed via the full regression suite (641/641, up from 632).

## 11. Approval

Live-verified against both the `Rating` root and `_RatingStar`
sub-component, dual-mode architecture directly motivated by sampled
`Pressed`/`Half` state evidence, hand-authored star glyph disclosed as a
necessary icon-registry-gap decision (same category as `Checkbox`'s own
precedent), no RTL mirroring confirmed by prop-list absence, zero
regressions, Storybook/tests/validation all pass. This closes out the final
of the three composite-layer backlog items (Content Switcher, Menu, Rating)
identified at the start of this session.
