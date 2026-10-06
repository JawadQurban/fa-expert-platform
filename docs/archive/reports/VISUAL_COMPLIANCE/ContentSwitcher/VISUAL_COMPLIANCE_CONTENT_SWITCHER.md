# Visual Compliance — ContentSwitcher

Compares the new FADS `ContentSwitcher` composite against the official
Platforms Code Content Switcher component (see
`docs/FIGMA_CONTENT_SWITCHER_SPECIFICATION.md`, node `8421:71014` in file
`J0xq7JG3JKshRDzrgAM7E0`). Registry status was `Missing` before this pass —
no prior implementation existed.

---

## 1. Live Verification

`get_design_context` on the component-set root and `get_variable_defs`
returned the full picture in two calls: the `Content Switcher` container
(`size` × `onColor` × `rtl`) and its `_Content Switcher Item` sub-component
(`itemType` × `state` × `onColor` × `size` × `rtl`).

## 2. The Key Finding: Byte-Identical Colors to `Button`

Every color variable returned by `get_variable_defs`
(`button-background-neutral/black/primary/transparent-hovered-default`,
`border-neutral-primary`, `border-transparent-10`, `text-default`,
`text-oncolor-primary`) is confirmed identical to the already-Approved
`Button`'s own token sources (the same finding this project already made
for `FloatingButton`). `ContentSwitcher` reuses `Button`'s existing
`--fads-sys-button-*` tokens directly — zero new color tokens.

## 3. New Tokens: A Distinct Height Scale, Not `Button`'s Own

Despite the color-token identity, this component's height scale
(32/40/48px for Small/Medium/Large) is a consistent `+8px` offset from
`Button`'s own height scale (24/32/40px) — confirmed via direct comparison,
not assumed. Inline padding, however, **is** byte-identical to `Button`'s
own (`8`/`12`/`16px`) and was reused directly. A `76px` minimum item width
and one new Large-size typography pair (`20px`/`30px`, no existing generic
match) were also added. The onColor translucent-white background/border
needed their own new tokens too (a value-identical but semantically
unrelated token exists inside `ButtonClose`; reusing it across components
would be poor separation of concerns).

## 4. Implementation Summary

New composite `ContentSwitcher` — a `role="tablist"` of `role="tab"`
items, fully controlled (`value`/`onValueChange`, no internal state). No
owned `tabpanel`: the live Figma data shows no panel structure at all, so
the consumer wires the selected `value` to whatever content it swaps
elsewhere — a deliberate difference from this project's existing `Tabs`
composite (see §5). Keyboard interaction (roving tabindex, RTL-aware
`ArrowLeft`/`ArrowRight` swap via `useIsRtl()`, `Home`/`End`) mirrors
`Tabs`'s own already-established pattern for consistency.

## 5. Not `Tabs` — a Real, Separate Catalog Entry

`Tabs` (CMP-09) already exists and is Approved in this project. `Content
Switcher` (CMP-10) is a distinct official DGA catalog entry with its own
Figma node, visually and structurally different: `Tabs` uses a
`radius-pill` outer container and owns a `tabpanel`; `Content Switcher`
uses per-segment `radius-md` corners with hairline dividers and a solid-
fill selected segment, and has no owned panel at all. Confirmed via direct
comparison of both components' own live-verified specs before building —
not assumed to be redundant, and not merged.

## 6. RTL: Logical CSS Properties, No Manual DOM Reordering

The extracted Figma markup conditionally reorders DOM children for `rtl`
(an artifact of Figma having no logical-property concept). This
component's corner-radius/divider CSS uses logical `border-start-start-
radius`/`border-end-end-radius`/`border-inline-end` properties instead,
which already mirror correctly under the app's `dir="rtl"` default — the
same finding already confirmed for `Button`/`FloatingButton`/
`DropdownListItem`. Only the keyboard `ArrowLeft`/`ArrowRight` mapping
needs an explicit RTL swap (arrow keys are always physical), implemented
via the same `useIsRtl()` hook `Tabs` already uses.

## 7. No Hovered/Pressed State Exists

Only `Normal`/`Selected` exist in the live 2-state set for
`_Content Switcher Item`. A `:focus-visible` outline was still added
(non-Figma-sampled, using already-shared generic tokens) for WCAG 2.2
compliance; no hover-only background was invented.

## 8. Token Changes

8 new additive `--fads-sys-contentswitcher-*` tokens (height ×3,
min-width, onColor background/border ×2, Large-size text/line-height ×2).
Corner radius, inline padding, and every color reuse already-shared
generic or `Button`-scoped tokens directly. No tokens removed.

## 9. Storybook Coverage

Default, TwoItems, Sizes, OnColor, RTL, **OfficialFigmaReference** — 6
stories (new component).

## 10. Accessibility

- Real `role="tablist"`/`role="tab"` with `aria-selected` and roving
  `tabIndex`.
- RTL-aware keyboard navigation (`ArrowLeft`/`ArrowRight` swap via
  `useIsRtl()`), `Home`/`End` jump to first/last.
- Non-Figma-sampled `:focus-visible` outline for WCAG 2.2, since no
  Hovered/Pressed/Focused variant exists in the live data.

## 11. Validation

| Command | Result |
|---|---|
| `npm run typecheck` | ✅ Pass |
| `npm run lint` (eslint + `lint:css`) | ✅ Pass |
| `npm run format:check` | ✅ Pass (after `prettier --write` on the new story/test files and regenerated `tokens.css`) |
| `npm test` | ✅ 618/618 tests, 52 files (9 new in `ContentSwitcher.test.tsx`) |
| `npm run tokens:generate` | ✅ 658 tokens generated |
| `npm run tokens:validate` | ✅ Pass |
| `npm run tokens:check-coverage` | ✅ Defined: 705, Referenced: 610, Missing: 0 |
| `npm run build` | ✅ Pass |
| `npm run build-storybook` | ✅ Pass |

## 12. Scope

- New files: `ContentSwitcher.tsx`, `ContentSwitcher.module.css`,
  `ContentSwitcher.stories.tsx`, `ContentSwitcher.test.tsx`.
- `frontend/src/design-system/composite/index.ts` — added barrel export.
- `frontend/scripts/generate-tokens.mjs` — new additive Content Switcher
  token block (8 tokens).
- `Button.tsx`/`Button.module.css`, `Tabs.tsx`, and every other previously-
  Approved component are unchanged — `ContentSwitcher` reuses `Button`'s
  tokens and mirrors `Tabs`'s interaction pattern, without modifying either.
- Confirmed via the full regression suite (618/618, up from 609).

## 13. Approval

Live-verified across the full variant set, byte-identical color-token
match with `Button` confirmed via `get_variable_defs`, a genuinely distinct
height scale correctly identified (not assumed reusable), confirmed
distinct from the existing `Tabs` composite (not redundantly merged),
correct logical-CSS RTL handling with no manual DOM reordering, zero
regressions, Storybook/tests/validation all pass.
