# Visual Compliance — Menu

Compares the new FADS `Menu` composite against the official Platforms Code
Menu component (see `docs/FIGMA_MENU_SPECIFICATION.md`, node `30195:22214`
in file `J0xq7JG3JKshRDzrgAM7E0`). Registry status was `Missing` before this
pass — no prior implementation existed.

---

## 1. Scope Decision: Build Alongside `Menu list item`

`Menu`'s own registry entry depends on a separate, also-`Missing` "Menu
list item" component with a richer variant set of its own (72 variants).
The user was presented with this finding (build both now / list-item only /
audit-only) and explicitly chose to build both together — the same
category of required-sub-component relationship this project already
resolved for `Select`/`DropdownListItem`, since `Menu` has no real fidelity
without its own list-item component. See
`reports/VISUAL_COMPLIANCE/MenuListItem/VISUAL_COMPLIANCE_MENU_LIST_ITEM.md`
for that component's own full compliance report.

## 2. Live Verification

`get_design_context` on the component-set root returned the full panel
structure in one call (3 sections, each with a group label and 3 items
demonstrating None/Switch/Tag trailing content); `get_variable_defs`
returned the panel's own token set.

## 3. The Key Finding: Panel Content Only

The live data shows only the floating panel's own content structure — no
trigger button, no open/close state, no positioning/portal behavior at
all. `Menu` therefore renders just the panel (`<Menu>`/`<MenuSection>`),
the same scope boundary already drawn between `DropdownListItem` (a row
primitive) and `Select` (the full trigger+portal composite consuming it) —
a future "Menu button"/trigger composite would consume `Menu` the same way.

## 4. Byte-Identical Match With `Button`'s Tokens

The panel's own border color (`#d2d6db`) and radius (`8px`) are confirmed
identical to the already-Approved `Button`'s own `--fads-sys-button-
border-neutral` and the already-shared generic `--fads-sys-radius-md`
tokens — reused directly, not duplicated.

## 5. Token Changes

6 new additive `--fads-sys-menu-*` tokens (bg, shadow, width, section-
border, section-gap, group-label-text) plus 7 new `--fads-sys-
menulistitem-*` tokens (documented in that component's own report) — 13
total, shared in one `generate-tokens.mjs` block. The group label's own
typography reuses already-shared generic tokens directly — zero new
typography tokens for `Menu` itself.

## 6. Storybook Coverage

Default, MultipleSections, WithoutGroupLabels, RTL,
**OfficialFigmaReference** — 5 stories (new component).

## 7. Accessibility

- `MenuSection`'s group label is `role="presentation"` — a non-interactive
  header, matching the same convention `DropdownListItem`'s own
  `groupLabel` type already established.
- No RTL-specific code needed for the panel/section layout — natural CSS
  logical flow handles mirroring.

## 8. Validation

| Command | Result |
|---|---|
| `npm run typecheck` | ✅ Pass |
| `npm run lint` (eslint + `lint:css`) | ✅ Pass |
| `npm run format:check` | ✅ Pass (after `prettier --write` on the new story file and regenerated `tokens.css`/`generate-tokens.mjs`) |
| `npm test` | ✅ 632/632 tests, 54 files (5 new in `Menu.test.tsx`, 9 new in `MenuListItem.test.tsx`) |
| `npm run tokens:generate` | ✅ 671 tokens generated |
| `npm run tokens:validate` | ✅ Pass |
| `npm run tokens:check-coverage` | ✅ Defined: 718, Referenced: 623, Missing: 0 |
| `npm run build` | ✅ Pass |
| `npm run build-storybook` | ✅ Pass |

## 9. Scope

- New files: `Menu.tsx`, `Menu.module.css`, `Menu.stories.tsx`,
  `Menu.test.tsx` (plus `MenuListItem`'s own 4 files, see its own report).
- `frontend/src/design-system/composite/index.ts` — added barrel exports
  for `Menu`, `MenuSection`, and `MenuListItem`.
- `frontend/scripts/generate-tokens.mjs` — new additive Menu/Menu list item
  token block (13 tokens total).
- `Button.tsx`, `Tag.tsx`, `Switch.tsx`, and every other previously-Approved
  component are unchanged.
- Confirmed via the full regression suite (632/632, up from 618).

## 10. Approval

Live-verified panel structure, correctly scoped to panel-content-only
(matching this project's own established `DropdownListItem`/`Select`
scope precedent), byte-identical border/radius match with `Button`
confirmed, built alongside its required `Menu list item` sub-component per
explicit user decision, zero regressions, Storybook/tests/validation all
pass.
