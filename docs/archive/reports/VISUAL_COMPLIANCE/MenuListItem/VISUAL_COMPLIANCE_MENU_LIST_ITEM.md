# Visual Compliance — MenuListItem

Compares the new FADS `MenuListItem` composite against the official
Platforms Code Menu list item component (see
`docs/FIGMA_MENU_LIST_ITEM_SPECIFICATION.md`, node `30195:21865` in file
`J0xq7JG3JKshRDzrgAM7E0`). Registry status was `Missing` before this pass —
no prior implementation existed. Built alongside `Menu` (CMP-11) after the
user confirmed both should be built together, since `Menu` has no real
fidelity without its own required list-item sub-component (same category
of dependency this project already resolved for `Select`/`DropdownListItem`).

---

## 1. Live Verification

`get_metadata` enumerated the full 72-variant matrix (`rtl` × `Trail
element`[None/Text/Icon/Button/Tag/Switch] × `state`[Default/Hovered/
Pressed/Selected/Focused/Disabled]); representative variants across every
axis were sampled with `get_design_context`, plus `get_variable_defs` for
the full token set.

## 2. The Key Finding: Trailing Slot Is Generic Content

Sampling each `Trail element` value directly proved they are all just
different *content* in the same trailing position: `Button` is a literal
instance of the already-Approved `Button` (icon-only, small); `Tag` and
`Switch` are literal instances of the already-Approved `Tag`/`Switch`;
`Text`/`Icon` are plain muted text / a decorative icon. `MenuListItem`
therefore exposes one generic `trailing: ReactNode` slot rather than 5
distinct typed props — the consumer composes whichever already-Approved
primitive fits.

## 3. `Selected` vs. a Consumer-Composed Checkmark

Independently sampling the `Selected` state variant directly (not just
reading `Menu`'s own demo composition) revealed it is a pale-green fill +
green text with **no checkmark at all** — the checkmark seen in `Menu`'s
own demo is a separately-composed `Icon` trailing-element usage, not part
of `MenuListItem`'s own `Selected` contract. Implemented exactly as
independently verified, not assumed from the more visually obvious (but
wrong) checkmark example.

## 4. Deliberately Not `role="menuitem"`

The live data shows real nested interactive controls (`Switch`, icon-only
`Button`) inside items. The WAI-ARIA APG "Menu and Menubar" pattern's
roving-tabindex model does not expect a `menuitem` to contain its own
independently-focusable descendant — forcing that role onto this structure
would create an invalid/conflicting ARIA tree. `MenuListItem` renders as a
plain, real `<button>` instead (standard Tab order) — a disclosed,
deliberate deviation required by the live design itself, not an oversight.

## 5. Token Changes

Colors/geometry for Hover, Pressed, the leading-icon size, and item padding
all reuse already-shared generic or `Button`-scoped tokens directly
(confirmed byte-identical). New tokens: `bg-selected`, `text`,
`text-selected`, `text-disabled`, `text-secondary`, `icon-disabled`,
`focus-border` (7 tokens, shared with `Menu`'s own token block — see
`reports/VISUAL_COMPLIANCE/Menu/VISUAL_COMPLIANCE_MENU.md` for the full
combined count).

## 6. Storybook Coverage

Default, Selected, Disabled, WithoutIcon, TrailingText, TrailingIcon,
TrailingButton, TrailingTag, TrailingSwitch, **OfficialFigmaReference** —
10 stories (new component).

## 7. Accessibility

- Real `<button>`, `aria-pressed` for `selected` (a valid, always-supported
  toggle-button pattern, chosen over `aria-selected` since this isn't
  necessarily nested in a `listbox`/`menu`-rooted context).
- Leading icon and any plain trailing icon are decorative
  (`aria-hidden`); interactive trailing content (`Switch`/`Button`) carries
  its own accessible name via its own already-Approved contract.

## 8. Validation

| Command | Result |
|---|---|
| `npm run typecheck` | ✅ Pass |
| `npm run lint` (eslint + `lint:css`) | ✅ Pass |
| `npm run format:check` | ✅ Pass (after `prettier --write` on the new story files and regenerated `tokens.css`/`generate-tokens.mjs`) |
| `npm test` | ✅ 632/632 tests, 54 files (9 new in `MenuListItem.test.tsx`) |
| `npm run tokens:generate` | ✅ 671 tokens generated |
| `npm run tokens:validate` | ✅ Pass |
| `npm run tokens:check-coverage` | ✅ Defined: 718, Referenced: 623, Missing: 0 |
| `npm run build` | ✅ Pass |
| `npm run build-storybook` | ✅ Pass |

## 9. Scope

- New files: `MenuListItem.tsx`, `MenuListItem.module.css`,
  `MenuListItem.stories.tsx`, `MenuListItem.test.tsx`.
- `frontend/src/design-system/composite/index.ts` — added barrel export.
- `frontend/scripts/generate-tokens.mjs` — new additive Menu/Menu list item
  token block (shared with `Menu`, 13 tokens total).
- `Button.tsx`, `Tag.tsx`, `Switch.tsx`, and every other previously-Approved
  component are unchanged — `MenuListItem` composes them via its own
  `trailing`/`icon` slots, not by modifying their code.
- Confirmed via the full regression suite (632/632, up from 618).

## 10. Approval

Live-verified across the full 72-variant matrix, a real trailing-content
architecture insight found and implemented (generic slot, not 5 typed
props), a genuine `Selected`-vs-checkmark distinction independently
confirmed rather than assumed, a disclosed and justified ARIA-role
deviation, zero regressions, Storybook/tests/validation all pass.
