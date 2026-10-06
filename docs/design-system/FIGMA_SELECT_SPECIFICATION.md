# Figma Select (Dropdown Input) — Official Specification

**Source of truth:** Figma file `J0xq7JG3JKshRDzrgAM7E0` ("Components Library - Platforms Code
(Community)"), component set node `3534:49934` ("Dropdown Input"), sub-parts **Dropdown List
Item** (`3262:27949`) and the shared **Label** (`30150:134187`).
**Registry:** `nodeId`/`figmaUrl` were already populated (`nodeResolutionStatus: "pending"` — a
workflow-progress marker; see `CLAUDE.md`'s node resolution policy). Live-verified this pass via
`get_metadata`/`get_design_context`/`get_variable_defs`; flipped to `"resolved"` on success.
**Design documentation:** https://design.dga.gov.sa/guidelines/components/actions/dropdown
**Figma description:** "Dropdowns present a list of options from which a user can select one
option, or several."

Extracted via read-only Figma MCP tools. The component set contains **288 variant symbols**
(`rtl` × `size` × `filled` × `state` × `error` × `style` = 2×2×2×6×2×3). 6 nodes sampled directly
via `get_design_context` (closed Default/Hovered/Read-only/Disabled at Large/Default style, plus
the **open (Focused) state showing the full listbox panel**), plus a full `get_variable_defs` pull
against the component-set root.

---

## 1. Architecture Decision — Custom Listbox, Not Native `<select>`

**This task's own instruction is explicit: "Do not assume a custom listbox is required if native
select behavior satisfies the design."** Live data was checked against that bar and native
`<select>` does **not** satisfy it — the `Focused` (open) state (node `3534:49935`) is a real,
fully-specified custom popover, not a browser-native dropdown:

- A **"List Sections" panel** (`shadow-xl` elevation, `border-neutral-primary` border,
  `radius-sm` corners) renders below the trigger, containing individual **Dropdown List Item**s
  each with their own hover/selected state and a **checkmark icon on the selected item** — native
  `<select>` cannot render custom item styling, checkmarks, or elevation.
- An optional **`multiSection`** property groups options under a **semibold "Group label"**
  header with a divider between groups — native `<option>`/`<optgroup>` cannot match this exact
  visual treatment (no custom group-label typography, no per-group borders).
- A **`typeCursor`** property (a blinking text-caret shown in the trigger's text region) confirms
  this is an **editable/type-ahead-capable trigger**, not a plain click-to-open button — closer to
  a WAI-ARIA "combobox" than a "listbox button."
- A **`scrollBar`** property (custom-drawn scroll thumb) on the panel, matching the same
  custom-scrollbar treatment already found on `Textarea`.

**Decision: build a custom, accessible combobox** following the WAI-ARIA APG "Select-Only
Combobox" pattern — a `role="combobox"` trigger button (DOM focus never leaves it) with
`aria-expanded`/`aria-controls`/`aria-activedescendant`, and a portaled `role="listbox"` panel of
`role="option"` items. This reuses the exact portal/position/click-outside/Escape architecture
already established by `DatePicker` (`createPortal` to `document.body`, `getBoundingClientRect()`
positioning re-measured on resize/scroll, outside-click and `Escape` to close) — per this task's
"reuse existing... primitives, do not create another overlay framework" instruction, no new
overlay library or pattern was introduced; the existing one was extended. `useFocusTrap` was
**not** reused here — it moves DOM focus into its container on activation, which is correct for
`DatePicker`'s `role="dialog"` calendar but wrong for a combobox listbox (per APG, DOM focus stays
on the combobox trigger the whole time; `aria-activedescendant` — not DOM focus — tracks the
highlighted option).

**Not implemented, flagged Needs Confirmation:** true type-ahead *filtering* (narrowing the
option list as the user types, like a text-search combobox). The `typeCursor` property is
consistent with either (a) a full editable-combobox-with-filtering, or (b) a single-character
type-ahead-to-jump behavior identical to native `<select>`'s own long-standing convention (press
"f" to jump to the next option starting with "f"). Figma shows only the static cursor glyph, not a
filtered-list frame, so there is no live evidence to distinguish (a) from (b). Implemented as (b)
— the simpler, native-select-equivalent behavior — since it is unambiguously supported by the
static evidence and (a) would be inventing filtering logic Figma never demonstrated.

---

## 2. Component Hierarchy

```
Select (flex-col, gap = Form/iable-container = 8px)
├─ Label row (optional, `showLabel`)
├─ Dropdown Field (trigger button: border, radius-sm, background per state/style)
│  ├─ Leading Icon (optional)
│  ├─ Text (selected option's label, or muted placeholder)
│  └─ Chevron (arrow-down-01 closed / arrow-up-01 open)
├─ List Sections (portaled panel, open only)
│  └─ Section × 1–2 (optional Group label header) → Dropdown List Item × N
│     └─ Text + Check icon (selected item only)
└─ Helper text row (optional, `showHelperText`) — feedback icon + text
```

---

## 3. Variant Properties

| Property | Values | Notes |
|---|---|---|
| `RTL` | `False`, `True` | Logical mirroring, consistent with every other approved component |
| `Size` | `Large` (40px), `Medium` (32px) | Matches `TextInput`'s own size scale exactly |
| `Filled` | `False`, `True` | Whether an option is selected (shows its label) vs. placeholder shown — **not a component prop**, same reasoning as `TextInput`/`Textarea` (native value-vs-placeholder), adapted here to "selected option present vs. not" |
| `State` | `Default`, `Hovered`, `Pressed`, `Focused` (open), `Read-only`, `Disabled` | See §5 |
| `Error` | `False`, `True` | Border override, state-independent |
| `Style` | `Default`, `Filled darker`, `Filled lighter` | Background surface, matching `TextInput`/`Textarea` |

Plus non-variant properties: `showLabel`, `icon`/`leadingIcon`, `showHelperText`, `multiSection`,
`scrollBar`, `typeCursor` (§1).

---

## 4. Colors (live-verified, same `Form/field-*` family as `TextInput`/`Textarea`)

| State | Background | Border | Text |
|---|---|---|---|
| Default | `field-background-default` (white) | `field-border-default` `#9da4ae` | `field-text-placeholder` `#6c737f` (no selection) / `field-text-filled` `#161616` (selected) |
| Hovered | unchanged | `field-border-hovered` `#384250` | unchanged |
| Read-only | **none** (transparent) | `Global/border-disabled` `#9da4ae` | `field-text-filled` `#161616` (full strength — live-verified distinct from Disabled) |
| Disabled | **none** (transparent) | `Global/border-disabled` `#9da4ae` | `Global/text-default-disabled` `#9da4ae` |
| Open panel | `field-background-default` (white) | `border-neutral-primary` `#d2d6db` | list items: `Text/text-default` `#161616`; group labels: `text-primary-paragraph` `#384250` semibold |

`Pressed` was not independently re-sampled this pass — extended from the identical
`field-background-pressed` (`#f3f4f6`, confirmed present via `get_variable_defs`) already used by
the same token family on `TextInput`, same "closest verified analog" pattern. Chevron icon:
`Icon/icon-default` `#161616` (enabled) / `Icon/icon-default-400`≈`Global/icon-default-disabled`
`#9da4ae` (disabled).

**Icon-affix container gap** (`Form/dropdown-icon-content`) = **4px** — narrower than `TextInput`'s
own 8px icon↔text gap (`Form/icon-enteredtext`), live-verified as a genuinely distinct value for
this component, not copied from `TextInput`.

---

## 5. States

Read-only/Disabled converge on the same transparent-bg + `border-disabled` treatment already
established for `TextInput`/`Textarea` — differing only by text color (Read-only full-strength,
Disabled muted), same pattern. Hovered/Focused/Error/Pressed all directly mirror the already
twice-verified `Form/field-*` state logic (§4).

---

## 6. Node Reference

| Variant sampled | Node ID |
|---|---|
| Component set root | `3534:49934` |
| Closed, Default, Large, Unfilled, Default style | `3534:50135` |
| Closed, Hovered (same combo) | `3534:50139` |
| Closed, Read-only (same combo) | `3534:50147` |
| Closed, Disabled (same combo) | `3534:50151` |
| **Open (Focused), Large, Unfilled, Default style — full listbox panel** | `3534:49935` |
| Dropdown List Item sub-component | `3262:27949` |

Full 288-node grid metadata is available via `get_metadata` on the component-set root
`3534:49934`.

---

## 7. Accessibility

- WAI-ARIA APG "Select-Only Combobox" pattern: trigger `role="combobox"` `aria-haspopup="listbox"`
  `aria-expanded` `aria-controls` `aria-activedescendant`; panel `role="listbox"`; items
  `role="option"` `aria-selected`. Group headers use `role="presentation"` text (not
  `role="group"`/`aria-labelledby`-per-group, since the Figma structure shows a plain text header,
  not a semantically distinct grouping construct beyond visual sectioning) — flagged Needs
  Confirmation, non-blocking, extendable to full `role="group"` semantics later if required.
- Keyboard: `ArrowDown`/`ArrowUp` opens (if closed) or moves the active option; `Home`/`End` jump
  to first/last enabled option; `Enter`/`Space` selects the active option and closes; `Escape`
  closes without changing selection; single-character keys jump to the next option starting with
  that character (native-`<select>`-equivalent type-ahead, §1).
- Native form integration via a hidden `<input type="hidden" name aria-hidden>` mirroring the
  selected value — same technique this codebase's own `Switch` component already uses for a
  non-native control's form participation.
- Read-only/Disabled both prevent opening the panel; Disabled is excluded from the tab order
  (native `disabled` on the trigger button), Read-only stays focusable (`aria-readonly`, keeps
  `tabIndex={0}`, matching `TextInput`/`Textarea`'s established read-only convention).
