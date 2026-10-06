# Figma Text Input — Official Specification

**Source of truth:** Figma file `J0xq7JG3JKshRDzrgAM7E0` ("Components Library - Platforms Code (Community)"), component set node `30150:130250` ("Text Input"), sub-component **Label** node `30150:134187`.
**Registry note:** the registry (`figma-component-map.json`) had `componentKey` only (`ecb793e4c9b3e5618ed474ea40b8755134dd3257`), no `nodeId` — `search_design_system` confirmed the componentKey but returned no canvas node (same MCP limitation documented for `Link`). The user supplied this node-specific URL directly; no Figma Desktop interaction occurred.
**Design documentation:** https://design.dga.gov.sa/guidelines/components/forms-and-inputs/input
**Figma description:** "Text input in Platforms Code are interactive elements where users can enter or edit text, numbers, or other data. They provide a means for users to input information, such as usernames, passwords, or search queries, and are commonly found in forms or search bars. Input fields typically feature visual cues like placeholder text or labels to guide users and enhance usability."

Extracted via read-only Figma MCP tools (`get_metadata`, `get_design_context`, `get_variable_defs`). The component set contains **288 variant symbols** (`rtl` × `state` × `filled` × `error` × `size` × `style` = 2×6×2×2×2×3). 26 were sampled directly via `get_design_context` across two passes (20 in the original spec pass, plus 6 in the 2026-07-13 Storybook/Figma alignment follow-up), covering every `state` at Large for **all three** `Style` values (Default, Filled darker, Filled lighter — the follow-up pass closed the Hovered/Pressed/Read-only gap for the latter two, see §12 item 2), `filled=False` (placeholder), `error=True`, `Medium` size, and one `rtl=True` comparison — enough to determine every axis's effect with the specific extension-by-analog exceptions called out in §12.

---

## 1. Component Hierarchy

```
TextInput (flex-col, gap = field-label-gap = 8px)
├─ Label row (optional, `showLabel`)
│  └─ Label — required-asterisk (optional) + label text, RTL-aware order
├─ Input Field (border, radius-sm, background per state/style)
│  ├─ Prefix (optional) — text badge, own background/border/padding
│  ├─ Icon-Text-stack (flex: 1)
│  │  ├─ Leading Icon (optional, instance-swap slot)
│  │  ├─ Text (entered value or placeholder)
│  │  └─ Type Cursor (Figma-only, Focused state — see §6, not implemented)
│  └─ Suffix (optional) — text badge
└─ Helper text row (optional, `showHelperText`) — feedback icon + text
```

The 320px demo-instance width is this specific sample's authored frame width, not a hard
requirement — same caveat already recorded for Card/Divider's demo instances.

---

## 2. Variant Properties

**6 orthogonal variant axes** (2×6×2×2×2×3 = 288, matching the node count):

| Property | Values | Notes |
|---|---|---|
| `RTL` | `False`, `True` | See §8 |
| `State` | `Default`, `Hovered`, `Pressed`, `Focused`, `Read-only`, `Disabled` | See §6 |
| `Filled` | `False`, `True` | Whether the field shows entered text (`True`) or placeholder text (`False`) — maps directly to native `<input>` value-vs-`::placeholder` rendering, not a component prop (see §5) |
| `Error` | `False`, `True` | Border/helper-text override, independent of state (see §7) |
| `Size` | `Large`, `Medium` | See §4 |
| `Style` | `Default`, `Filled darker`, `Filled lighter` | Background surface treatment — see §6 |

Plus **6 non-variant, independent boolean/content component properties**:

| Property | Type | Notes |
|---|---|---|
| `showLabel` | boolean | Default `true` |
| `icon` | boolean + `swapIcon` instance-swap | Leading icon slot |
| `prefix` | boolean | Text badge before the field content |
| `suffix` | boolean | Text badge after the field content |
| `showHelperText` | boolean + `swapHelperIcon` instance-swap | Helper/error text row with a feedback icon |
| `required` (on **Label**) | boolean | Red `*` before the label text |

---

## 3. Label Sub-component

Separate component set (node `30150:134187`), always `Size=Medium`/`text-sm` regardless of the
parent Text Input's own `Size`. Structure: `* Label` (asterisk before text in LTR, DOM order
reversed for RTL — see §8) with a 4px gap (`Form/label-gap`), text-sm/Regular (14px/20px),
color `Form/field-text-label` (`#161616`). Asterisk color is `Form/field-border-error`
(`#b42318`) in every non-disabled state; when `disabled=True`, both the asterisk and the text
lose their distinct colors and use the shared `Global/input-text-disabled` (`#9da4ae`) gray.

---

## 4. Sizing & Spacing

| Size | Height | Value text | Prefix/Suffix padding-inline |
|---|---|---|---|
| `Large` | 40px | 16px/24px (`text-md`) | 16px (`Global/spacing-xl`) |
| `Medium` | 32px | 14px/20px (`text-sm`) | 12px (`Global/spacing-lg`) |

The Icon-Text-stack's own internal padding (`Form/Input-container-padding-left` = 8px on the
icon side, `Form/Input-container-padding-right` = 16px on the far side) and the icon↔text gap
(`Form/icon-enteredtext` = 8px) are **constant across both sizes** — only the outer field height,
value-text typography, and prefix/suffix padding scale with `Size`. Leading icon box is 20×20px
at both sizes (not sampled distinctly per size; the one sampled instance was 20px at both Large
and Medium contexts).

Other constants: `Form/field-label-gap` = 8px (label row ↔ input field), `Radius/radius-sm` = 4px
(all corners, all states — a Pressed-state sample showed one corner as a literal `4px` value
instead of the token, but the numeric value is identical, not a real distinction), feedback icon
= 16px, helper-text row `padding-block` = 4px (`Global/spacing-xs`) / gap = 8px
(`Form/icon-helpertext`).

---

## 5. `Filled` — Not a Component Prop

`Filled=True` (entered text, darker color) vs `Filled=False` (placeholder text, muted color,
`Form/field-text-placeholder` `#6c737f`) is **not implemented as a boolean prop** — it is the
literal, automatic distinction between a real `<input>`'s typed `value` (normal text color) and
its `placeholder` attribute (styled via the native `::placeholder` pseudo-element). No React state
or prop is needed; the browser already does this correctly.

---

## 6. States & Styles

### Default style

| State | Background | Border | Value text |
|---|---|---|---|
| Default | `field-background-default` (white) | `field-border-default` `#9da4ae` | `field-text-filled` `#161616` — **see §12 discrepancy** |
| Hovered | unchanged (white) | `field-border-hovered` `#384250` | `field-text-hovered` `#161616` |
| Pressed | `field-background-darker` `#f3f4f6` | unchanged, **plus** a 2px bottom "underline" accent (`field-border-pressed` `#0d121c`, inset ~103px each side in the sampled instance — an artifact of that instance's own width, treated as full-width in implementation) | `field-text-pressed` `#384250` |
| Focused | unchanged (white) | unchanged, **plus** `Shadows/shadow-md` (a 2-layer soft drop shadow) **and** a full-width 2px bottom underline (`field-border-pressed`) | `field-text-focused` `#384250` |
| Read-only | **none** (transparent — the white fill disappears) | `Border/border-neutral-primary` `#d2d6db` | `field-text-readonly` `#161616` |
| Disabled | **none** (transparent) | `Border/border-disabled` `#d2d6db` | `Global/text-default-disabled` `#9da4ae` |

`Focused`'s "Type Cursor" (a 1px×24px vertical bar simulating a blinking caret) is a
**Figma-canvas-only artifact** — a real `<input>` already renders its own native text caret when
focused; adding a fake DOM element for this would visually duplicate/conflict with it. **Not
implemented**, by design, not omission.

### `Filled darker` / `Filled lighter` styles

At the `Default` state, both replace the border+white-fill entirely with a flat, borderless fill:

| Style | Background | Prefix/Suffix background |
|---|---|---|
| `Filled darker` | `field-background-darker` `#f3f4f6` | `button-background-neutral-default` `#f3f4f6` (kept) |
| `Filled lighter` | `field-background-lighter` `#fcfcfd` | **none** (transparent — prefix/suffix lose their background too) |

**`Disabled` is uniform across all 3 styles** — live-verified on both `Filled darker` and
`Filled lighter`: both converge to the exact same transparent-bg + `border-disabled` +
`text-default-disabled` treatment as the `Default` style's Disabled state (§ above). No
style-specific disabled variant exists.

**`Focused` behaves differently per style** (both live-verified, not extended):
- `Filled darker` → **fully reverts** to `field-background-default` (white) + a
  `field-border-default` border — visually converging with the Default style's own Focused state.
- `Filled lighter` → **keeps** its own `field-background-lighter` fill but **gains** a
  `field-border-default` border it didn't have at rest.
- Both gain the same `shadow-md` + full-width bottom underline as the Default style's Focused.

`Hovered`/`Pressed`/`Read-only` for `Filled darker`/`Filled lighter` were live-sampled in the
2026-07-13 follow-up pass (§11/§12 item 2) — Hovered/Pressed gain a `field-border-default` border
neither surface has at rest (a real implementation gap, now fixed); Read-only is confirmed uniform
across all 3 styles as previously extended.

---

## 7. Error

`Error=True` overrides the border color to `Form/field-border-error` (`#b42318`), sampled only at
`Default` state/`Default` style/`Filled=True`. Implemented as a state-independent override (same
"override regardless of variant" pattern already established for Button's Destructive/OnColor
modifiers) — applies on top of whichever state/style is otherwise active. The helper/error text
row switches from `Text/text-primary-paragraph` (`#384250`) to `Text/text-error` (`#b42318`) when
showing an error message (this part was already correctly implemented pre-pass via `Field`'s
`role="alert"` error paragraph).

---

## 8. RTL Behavior

- Every variant is duplicated across `RTL=False`/`True` (2× the grid).
- The Label's asterisk+text DOM order reverses in the Figma source's own markup (text-first in
  RTL vs asterisk-first in LTR), and the outer field gains `justify-content: end` +
  `text-align: right` + `dir="auto"` on all text nodes.
- **Ambiguous/unverified finding, flagged Needs Confirmation:** in the sampled RTL instance, the
  padding tokens (`Form/Input-container-padding-left`=8px / `-padding-right`=16px) keep their
  exact same **physical** left/right assignment even under RTL, and the Prefix/Suffix/Icon
  sub-elements' DOM order is manually reversed in the Figma source specifically so that, combined
  with `justify-content: end`, the **leading icon and Prefix always land on the physical-left
  edge and Suffix always on the physical-right edge, in both directions** — i.e., they do not
  visually mirror with the text. This is either (a) a deliberate design requirement for a
  right-anchored icon/affix regardless of language, or (b) the same class of Figma-authoring
  artifact already found twice (`Link` §8, `Tag` §8) where the source file manually reorders DOM
  to fake a result achievable with plain logical CSS + `dir`, this time producing a
  *non-mirroring* result rather than a correctly-mirroring one. **Implemented as (b) — full
  logical-properties mirroring** (icon/prefix/suffix flip sides with `dir`, matching every other
  approved component's RTL convention and this codebase's lint-enforced DC-23 rule), since (a)
  would be a genuinely unusual, undocumented RTL pattern inconsistent with the rest of this
  design system and is not confirmed by any explicit design annotation — only inferrable from one
  sample's literal token names. Flagged for explicit design-team confirmation before treating (a)
  as intentional.

---

## 9. Accessibility

- Canonical documentation: https://design.dga.gov.sa/guidelines/components/forms-and-inputs/input.
  No ARIA annotations beyond the description/doc link are present in the Figma file itself.
- Label association, `aria-describedby` (helper + error), `aria-invalid`, `aria-required` — no
  Figma-sourced guidance beyond the visual label/helper/error regions; the pre-existing
  implementation's WCAG 3.3.1/3.3.2/1.4.1-driven wiring (via the shared `Field` pattern) is
  preserved, just re-implemented locally within `TextInput` (see the compliance report for why).
- Disabled/Read-only use native `disabled`/`readOnly` HTML attributes — correct semantic mapping,
  unaffected by this pass.
- Focus indicator (`shadow-md` + bottom underline) is real, visible, and non-color-reliant only in
  combination with the border (border-color does *not* change on focus per §6) — however this is
  a Figma-verified design decision, not a compliance gap: the shadow+underline are themselves
  strong, non-color-only visual differentiators satisfying the same "real, visible, non-default"
  focus-indicator bar every other approved component in this project has been held to.

---

## 10. Responsive Behavior

No breakpoint/responsive variant axis exists. The field's `inline-size: 100%` (fills its
container) is the demo instance's own width choice extended as the sane default, consistent with
every other form-control primitive already in this codebase (`control.module.css`'s
`inline-size: 100%`).

---

## 11. Node Reference (for future re-verification)

| Variant sampled | Node ID |
|---|---|
| Component set root | `30150:130250` |
| Label sub-component | `30150:134187` |
| Default, Filled=True, Error=False, Large, Default style | `30150:130251` |
| Hovered (same combo) | `30150:130355` |
| Pressed (same combo) | `30150:130459` |
| Focused (same combo) | `30150:130571` |
| Read-only (same combo) | `30150:130700` |
| Disabled (same combo) | `30150:130804` |
| Filled=False, Default, Large, Default style | `30150:130264` |
| Error=True, Default, Large, Default style | `30150:130277` |
| Default, Filled=True, Medium, Default style | `30150:130908` |
| Default, Filled=True, Large, Filled darker | `30150:131563` |
| Default, Filled=True, Large, Filled lighter | `30150:132875` |
| Focused, Large, Filled darker | `30150:131883` |
| Disabled, Large, Filled darker | `30150:132115` |
| Focused, Large, Filled lighter | `30150:133195` |
| Disabled, Large, Filled lighter | `30150:133427` |
| RTL=True, Default, Filled=True, Large, Default style | `30150:130342` |
| Hovered, Large, Filled darker (2026-07-13 follow-up) | `30150:131667` |
| Pressed, Large, Filled darker (2026-07-13 follow-up) | `30150:131771` |
| Read-only, Large, Filled darker (2026-07-13 follow-up) | `30150:132011` |
| Hovered, Large, Filled lighter (2026-07-13 follow-up) | `30150:132979` |
| Pressed, Large, Filled lighter (2026-07-13 follow-up) | `30150:133083` |
| Read-only, Large, Filled lighter (2026-07-13 follow-up) | `30150:133323` |

Full 288-node grid metadata is available via `get_metadata` on the component-set root
`30150:130250`.

---

## 12. Deviations, Extensions, and Needs-Confirmation Items

1. **Large/Default-state/Filled=True value-text color discrepancy.** The Large-size sample uses
   `field-text-focused` (`#384250`) for its Default-state entered text, while the otherwise
   identical Medium-size sample uses `field-text-filled` (`#161616`) — the token whose name
   actually matches the `Filled=True` property. Treated as a Figma-authoring inconsistency (a
   stale/uncorrected layer reference on the Large node specifically); implemented using
   `field-text-filled` for **both** sizes' Default state, matching Medium's sample and the token's
   own name. Flagged, not silently "fixed" — same category as `Link`'s Neutral+Visited discrepancy.
2. **`Filled darker`/`Filled lighter` Hovered/Pressed/Read-only — re-verified 2026-07-13, one
   real bug found and fixed.** A follow-up pass (triggered by a Storybook/Figma alignment review)
   directly sampled all three previously-unsampled states via `get_design_context` (nodes
   `30150:131667`/`131771`/`132011` for Filled darker; `30150:132979`/`133083`/`133323` for Filled
   lighter — see §11). Findings:
   - **Read-only**: confirmed uniform across all 3 styles, exactly as extended (transparent bg +
     `border-neutral-primary`) — no change.
   - **Hovered/Pressed**: the earlier "keeps the surface's own background and only changes text
     color" extension was *incomplete* — both surfaces also **gain a `field-border-default`
     (`#9da4ae`) border on Hover/Press that they don't have at rest** (their rest-state border is
     transparent). Critically, this is a **different token than the Default style's own Hovered
     border** (`field-border-hovered` `#384250`) — Filled darker/lighter use the plain default-gray
     border, not the darker hover-specific shade. The pre-fix implementation applied the Default
     style's generic `:hover`/`:active` border rule to all 3 surfaces uniformly, so Filled
     darker/lighter never showed a border change on Hover/Press. **Fixed** in
     `TextInput.module.css` with surface-scoped `[data-surface='filledDarker']:hover`/`:active` and
     `[data-surface='filledLighter']:hover`/`:active` overrides using the existing
     `--fads-sys-textinput-border-default` token (no new token needed). Background-darkening and
     the underline accent on Pressed were already correct and needed no change.
3. **RTL icon/prefix/suffix physical-anchoring vs. full mirroring** — see §8. Implemented as full
   logical-properties mirroring; flagged for confirmation.
4. **`Error=True` sampled only at one state/style combination** — implemented as a
   state/style-independent border-color override, per §7.
