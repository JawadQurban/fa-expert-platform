# Visual Compliance — SearchBox

Compares the new FADS `SearchBox` primitive against the official Platforms
Code Search Box component (see `docs/FIGMA_SEARCH_BOX_SPECIFICATION.md`,
node `30150:90990` in file `J0xq7JG3JKshRDzrgAM7E0`). Registry status was
`Missing`, flagged `nodeResolutionStatus: "blocked"` pending
`docs/QUESTIONS.md` Q10 — see §1 for how that block was resolved.

---

## 1. Scope Resolution (Q10 Block)

Live verification showed this component is governed by the exact same
`rtl` × `state` × `filled` × `size` × `style` axes already sourced for the
already-Approved `TextInput` — a plain reusable input-field primitive with
no site-search-feature or results-page structure baked into the component
itself. The user was presented with this finding (build now / stay blocked /
audit-only) and explicitly chose to build it now: Q10 gates whether the
*product* ships a site-wide search page, a separate decision from whether
this reusable field component belongs in the design system.

## 2. Live Verification

A representative instance (`Medium`/`Default`/`Filled=True`/`Default` style)
resolved in a single `get_design_context` call; `get_variable_defs` returned
16 named Figma variables.

## 3. The Key Finding: Byte-Identical to `TextInput`

Every field-chrome color/geometry token (background, border, radius, label
text, helper text, icon size/gap) returned by `get_variable_defs` is
confirmed identical to `TextInput`'s own already-verified
`--fads-sys-textinput-*` tokens. `SearchBox` reuses every one of them
directly — **the only new token is the 16px helper-icon size**
(`--fads-sys-searchbox-helper-icon-size`).

## 4. Not a Literal `<TextInput>` Composition

Despite the near-total token overlap, `SearchBox` is its own self-contained
primitive: `TextInput`'s own `suffix` prop renders a separately-backgrounded
badge (`Form/field-affix-*` tokens), but live verification shows Search
Box's trailing slot sits **inside the same un-badged content row** as the
leading icon and the input — no badge background. Composing
`<TextInput suffix={...}>` would have wrapped the trailing icon in the
wrong chrome. Same category of decision as `FloatingButton` not composing
`<Button>` and `DropdownListItem`'s decorative checkbox not composing
`<Checkbox>`.

## 5. The Trailing Slot Is a Confirmed `TrailingIcon` Instance

The extracted markup's trailing-icon sub-tree node IDs are literal instance
references into the already-Approved `TrailingIcon` component's own node
IDs (confirmed by direct match) — the same category of finding as this
batch's `InputPrefixSuffix`/`NumberInput` and `DropdownListItem`/`Select`
matches. `SearchBox` exposes a generic `trailingIcon: ReactNode` prop
rather than hardcoding this relationship (consumers compose
`<SearchBox trailingIcon={<TrailingIcon .../>} />`), matching the same
"accept any node in a slot" pattern `TextInput`'s own `iconStart`/`prefix`/
`suffix` already use.

## 6. Helper Text Row Is New

The live node's helper-text row always pairs a `help-circle` icon (16px)
with the text — a structure `TextInput`'s own helper row has never had
(confirmed: `TextInput.module.css`'s `.helper` is a plain `<p>`, no icon
slot). Built as `SearchBox`'s own small icon+text row rather than added to
`TextInput` (out of scope for this component's own session — `TextInput`
is unchanged).

## 7. `role="searchbox"`, Not `type="search"`

The native `<input>` gets an explicit `role="searchbox"` for correct
semantics while deliberately keeping `type="text"` — native
`type="search"` injects a browser-drawn clear affordance in several
browsers, which would visually double up with this component's own
explicit `trailingIcon` slot. Disclosed, deliberate choice.

## 8. Token Changes

1 new additive token: `--fads-sys-searchbox-helper-icon-size` (16px). Every
other color/typography/geometry value reuses `TextInput`'s own tokens
directly. No tokens removed.

## 9. Storybook Coverage

Default, WithTrailingIcon, WithHelper, WithError, ReadOnly, Disabled, Sizes,
Surfaces, RTL, **OfficialFigmaReference** — 10 stories (new component).

## 10. Accessibility

- Real `<label htmlFor>` association (same as `TextInput`).
- Explicit `role="searchbox"` on the native input.
- `aria-describedby` links helper/error text; `aria-invalid`/`aria-required`
  wired identically to `TextInput`'s own contract.
- Helper icon (`help-circle`) is decorative (`aria-hidden`), same convention
  as every other FADS icon usage.

## 11. Validation

| Command | Result |
|---|---|
| `npm run typecheck` | ✅ Pass |
| `npm run lint` (eslint + `lint:css`) | ✅ Pass |
| `npm run format:check` | ✅ Pass (after `prettier --write` on the new component/story files and regenerated `tokens.css`) |
| `npm test` | ✅ 609/609 tests, 51 files — 12 new in `SearchBox.test.tsx` |
| `npm run tokens:generate` | ✅ 650 tokens generated |
| `npm run tokens:validate` | ✅ Pass |
| `npm run tokens:check-coverage` | ✅ Defined: 697, Referenced: 602, Missing: 0 |
| `npm run build` | ✅ Pass |
| `npm run build-storybook` | ✅ Pass |

## 12. Scope

- New files: `SearchBox.tsx`, `SearchBox.module.css`, `SearchBox.stories.tsx`,
  `SearchBox.test.tsx`.
- `frontend/src/design-system/primitives/index.ts` — added barrel export.
- `frontend/scripts/generate-tokens.mjs` — new additive Search Box token
  block (1 token).
- `TextInput.tsx`/`TextInput.module.css`, `TrailingIcon.tsx`, and every other
  previously-Approved component are unchanged — `SearchBox` reuses their
  tokens/composes `TrailingIcon` via a slot, not by modifying their code.
- Confirmed via the full regression suite (609/609, up from 597).

## 13. Approval

Live-verified against a representative instance, byte-identical token match
with `TextInput` confirmed via `get_variable_defs`, one genuine structural
difference correctly identified and implemented (un-badged trailing slot),
the trailing slot's `TrailingIcon` relationship confirmed via node-ID match,
a real registry scope-block resolved via explicit user decision (not
silently overridden), zero regressions, Storybook/tests/validation all pass.
