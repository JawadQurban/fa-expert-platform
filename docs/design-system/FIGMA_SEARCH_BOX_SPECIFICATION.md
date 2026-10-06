# Figma Search Box — Official Specification

**Source of truth:** Figma file `J0xq7JG3JKshRDzrgAM7E0` ("Components Library - Platforms Code (Community)"), component set node `30150:90990` ("Search Box").
**Design documentation:** https://design.dga.gov.sa/guidelines/components/search-and-filters/search-box
**Figma description:** "The Search Box component allows users to input queries and find relevant results within an application or website."

Extracted via read-only Figma MCP tools (`get_design_context`, `get_variable_defs`). A representative variant resolved in a single call.

---

## 0. Scope Note: Registry Block vs. Component Reality

This registry row was flagged `nodeResolutionStatus: "blocked"` pending `docs/QUESTIONS.md` Q10 ("is a site-wide search in scope?"). Live verification, however, shows this component is governed by the exact same `rtl` × `state` × `filled` × `size` × `style` axes already sourced for the already-Approved `TextInput` — a plain reusable input-field primitive, with no results-page or site-search-feature structure baked into the component itself. The user was presented with this finding and explicitly chose to build it now, as a design-system primitive independent of the still-open Q10 product-scope question (which instead gates whether any *page* in the product actually uses site-wide search — a separate, unrelated decision from whether this reusable field component should exist in the library).

---

## 1. Component Hierarchy

```
Search Box
├─ Label (optional, showLabel)
├─ Input Field (bordered, radius-sm — token-identical to TextInput's own field)
│  └─ Icon-Text-stack (single un-badged flex row, gap 8px)
│     ├─ search-01 icon (optional, `icon` property, 20px)
│     ├─ Text (the input value/placeholder)
│     └─ Trailing Icon (optional, showTrailingIcon — a literal instance of
│        the already-Approved `TrailingIcon` component, confirmed by
│        matching node IDs)
└─ Helper text row (optional, showHelperText)
   ├─ Feedback Icon (`help-circle`, 16px)
   └─ helper text
```

---

## 2. Variant Properties

| Property | Values | Notes |
|---|---|---|
| `rtl` | `False`, `True` | No special handling needed beyond `dir="auto"` — same convention as `TextInput` |
| `state` | `Default`, `Hovered`, `Pressed`, `Focused`, `Read-only`, `Disabled` | Not a runtime prop — real `:hover`/`:active`/`:focus-within` and `disabled`/`readOnly` attributes, exactly matching `TextInput`'s own convention |
| `filled` | `False`, `True` | Not a prop — a real `<input>`'s `value` vs. `::placeholder`, same as `TextInput` |
| `size` | `Medium`, `Large` | Maps 1:1 to `TextInput`'s own `size` (`md`/`lg`) |
| `style` | `Default`, `Filled darker`, `Filled lighter` | Maps 1:1 to `TextInput`'s own `surface` |

Non-variant properties confirmed by inspecting the underlying instance: `icon` (boolean, shows/hides the leading search icon), `showLabel`, `showHelperText`, `showTrailingIcon`, `swapHelperIcon`.

---

## 3. Byte-Identical Match With `TextInput`'s Tokens

`get_variable_defs` on a representative Medium/Default/Filled instance returned Figma variable values confirmed identical to `TextInput`'s own already-verified `--fads-sys-textinput-*` tokens:

| Figma variable | Value | Already used by `TextInput` as |
|---|---|---|
| `Form/field-background-default` | `#ffffff` | `--fads-sys-textinput-bg-default` |
| `Form/field-border-default` | `#9da4ae` | `--fads-sys-textinput-border-default` |
| `Form/field-text-label` | `#161616` | `--fads-sys-textinput-label-text` |
| `Text/text-primary-paragraph` | `#384250` | `--fads-sys-textinput-helper-text` |
| `Radius/radius-sm` | `4` | `--fads-sys-radius-sm` (generic, reused) |
| `Global/spacing-md` (icon↔text gap) | `8` | `--fads-sys-textinput-icon-gap` |
| `Form/field-label-gap` | `8` | `--fads-sys-textinput-label-gap` |
| icon size (search-01) | `20px` | `--fads-sys-textinput-icon-size` |

`SearchBox` reuses every one of these directly — **the only new token this component needed is the 16px helper-icon size** (`--fads-sys-searchbox-helper-icon-size`), since `TextInput`'s own helper row has never had a leading icon.

---

## 4. Not a Literal `<TextInput>` Composition

Despite the near-total token overlap, `SearchBox` is its own self-contained primitive, not `<TextInput>` with extra props, for one structural reason: `TextInput`'s own `suffix` prop renders a **separately-backgrounded badge** (`Form/field-affix-*` tokens — a filled box, like a currency-code suffix "`.sa`"). Live verification of Search Box's own trailing slot shows it sits **inside the same un-badged content row** as the leading icon and the input — no badge background at all. Composing `<TextInput suffix={<TrailingIcon .../>}>` would have wrapped the trailing icon in the wrong chrome. `SearchBox` instead renders its own `.content` row with the trailing slot as a direct sibling of the `<input>`, matching the live layout exactly, while still reusing every other `TextInput` token verbatim.

---

## 5. Trailing Slot Is a Confirmed `TrailingIcon` Instance

The extracted markup's trailing-icon sub-tree uses node IDs (`I30150:90999;30150:92877`, `;30150:92878`, `;30150:92879`) that are literal instance references into the already-Approved `TrailingIcon` component's own node IDs (`30150:92877`/`30150:92878`/`30150:92879` — see `docs/FIGMA_TRAILING_ICON_SPECIFICATION.md`). `SearchBox` exposes a generic `trailingIcon: ReactNode` prop rather than hardcoding this relationship, so a consumer composes `<SearchBox trailingIcon={<TrailingIcon icon={...} label="..." onClick={...} />} />` — the same "accept any node in a slot" pattern `TextInput`'s own `iconStart`/`prefix`/`suffix` already use.

---

## 6. Helper Text Always Pairs an Icon

The live node's helper-text row always shows a `help-circle` "Feedback Icon" (16px) beside the text — a structure `TextInput`'s own helper row has never had (confirmed: `TextInput.module.css`'s `.helper` is a plain `<p>`, no icon slot). Rather than add this to `TextInput` (out of scope for this component's own session — `TextInput` is unchanged), `SearchBox` renders its own small icon+text row for its `helperText` prop. The `errorText` row is unaffected — it stays a plain text row, matching `TextInput`'s own existing error-row convention (no live-verified error-state icon exists for Search Box either).

---

## 7. `role="searchbox"`, Not `type="search"`

The native `<input>` gets an explicit `role="searchbox"` for correct assistive-technology semantics. It deliberately keeps `type="text"` rather than `type="search"`: native `type="search"` inputs inject their own browser-drawn clear ("×") affordance in several browsers (notably Chromium desktop), which would visually double up with this component's own explicit `trailingIcon` slot. Figma's static export has no way to represent native browser chrome either way, so this is a disclosed, deliberate implementation choice, not an oversight.

---

## 8. Node Reference

| Item | Node ID |
|---|---|
| Component set root | `30150:90990` |
| Sampled instance (Medium, Default, Filled, Default style) | `30150:90991` |
| `search-01` leading icon | `14313:61519` |
| `help-circle` feedback icon | `12313:10671` |
| Trailing icon instance (confirmed `TrailingIcon` reference) | `I30150:90999;30150:92877` et al. |

---

## 9. Deviations, Extensions, and Needs-Confirmation Items

1. **Registry block (Q10) does not apply to this design-system primitive** — see §0. A product decision (site-wide search page scope), not a component-fidelity gate.
2. **Not a literal `<TextInput>` composition** — the trailing slot's un-badged layout genuinely differs from `TextInput`'s own badged `suffix`; see §4.
3. **Helper-icon row is new to this component**, not added to `TextInput`; see §6.
4. **`type="text"` + explicit `role="searchbox"`, not `type="search"`** — disclosed choice to avoid native browser clear-icon conflicts with the explicit `trailingIcon` slot; see §7.
5. **No independently-verified error-state visual** exists for Search Box in the live data (unlike `TextInput`'s own explicit `error` axis) — `errorText` still works via the same generic border/row treatment `TextInput` already has, inherited by direct token reuse, not fabricated separately.
