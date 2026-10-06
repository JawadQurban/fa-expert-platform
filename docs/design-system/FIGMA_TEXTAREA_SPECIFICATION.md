# Figma Textarea — Official Specification

**Source of truth:** Figma file `J0xq7JG3JKshRDzrgAM7E0` ("Components Library - Platforms Code
(Community)"), component set node `5462:417368` ("Textarea"), sub-component **Label**
(`30150:134187`, shared with the already-Approved `TextInput`).
**Registry:** `nodeId`/`figmaUrl` were already populated (`nodeResolutionStatus: "pending"` — a
workflow-progress marker; see `CLAUDE.md`'s node resolution policy). Live-verified this pass via
`get_metadata`/`get_design_context`/`get_variable_defs`; flipped to `"resolved"` on success.
**Design documentation:** https://design.dga.gov.sa/guidelines/components/forms-and-inputs/textarea
**Figma description:** "A text area is a UI element that enables users to input and edit multiple
lines of text, providing a larger space than a regular text input field..."

Extracted via read-only Figma MCP tools. The component set contains **144 variant symbols**
(`RTL` × `State` × `Filled` × `Error` × `Style` = 2×6×2×2×3). 6 nodes sampled directly via
`get_design_context` (Default, Focused, Read-only, Disabled, Error=True — all Default style — plus
Filled darker Default+Hovered), and a full `get_variable_defs` pull against the component-set root
confirms every color token referenced anywhere in the set, including `field-border-hovered`/
`field-text-hovered`/`field-text-pressed`/`field-background-darker` — the exact same tokens (same
values) already live-verified during the `TextInput` pass — sufficient to determine Hovered/
Pressed behavior for the Default style without an additional per-state screenshot sample.

**This component shares its entire governing token family (`Form/field-*`) with the
already-Approved `TextInput`** (file/node prefix `30150:1xxxxx` for `TextInput` vs `5462:4xxxxx`
for `Textarea`, same `Form/` variable group). Architecture decision (§9) and most color values
below are therefore corroborated by, not merely analogous to, `TextInput`'s own live-verified spec.

---

## 1. Component Hierarchy

```
Textarea (flex-col, gap = Form/iable-container = 8px)
├─ Label row (optional, `showLabel`) — same shared Label sub-component as TextInput
├─ Contents (border, radius-sm, background per state/style)
│  ├─ Icon-Text-stack (flex: 1, padding 16px inline / 12px block)
│  │  └─ Text (entered value or placeholder) — multi-line
│  ├─ _Textarea-Scrollbar (optional, `scrollBar`) — a custom-drawn scroll track/thumb
│  └─ .Resize handler (optional, `resize`) — bottom-end 12×12px grip
└─ Helper text row (optional, `showHelperText`) — feedback icon + text
```

The 320px demo-instance width and 96px demo-instance height are this specific sample's authored
frame size, not a hard requirement — same caveat already recorded for `TextInput`'s own demo
instance (spec §1) and every other component sampled from a fixed-size Figma frame.

---

## 2. Variant Properties

| Property | Values | Notes |
|---|---|---|
| `RTL` | `False`, `True` | See §8 |
| `State` | `Default`, `Hovered`, `Pressed`, `Focused`, `Read-only`, `Disabled` | See §6 |
| `Filled` | `False`, `True` | Native `<textarea>` value vs. `::placeholder` — not a component prop, same reasoning as `TextInput` spec §5 |
| `Error` | `False`, `True` | Border/helper-text override, state-independent (§7) |
| `Style` | `Default`, `Filled darker`, `Filled lighter` | Background surface treatment |

Plus 4 non-variant, independent boolean component properties: `showLabel`, `showHelperText` (+
`swapIcon` instance-swap), `scrollBar`, `resize`. No `Size` axis exists on this component (unlike
`TextInput`'s Large/Medium) — a single fixed content typography tier (`text-md`, 16px/24px).

---

## 3. Colors (live-verified, `Form/field-*` token family shared with `TextInput`)

| State/Style | Background | Border | Text |
|---|---|---|---|
| Default | `field-background-default` (white) | `field-border-default` `#9da4ae` | `field-text-filled` `#161616` |
| Hovered | unchanged | `field-border-hovered` `#384250` (confirmed present in this component's own `get_variable_defs`) | `field-text-hovered` `#161616` |
| Pressed | `field-background-darker` `#f3f4f6` | `field-border-pressed` `#0d121c` (confirmed present) | `field-text-pressed` `#384250` |
| Focused | unchanged | unchanged, **plus** `Shadows/shadow-md` **and** a full-width 2px bottom underline (`field-border-pressed`) — live-verified `left-0 right-0`, no inset ambiguity (unlike `TextInput`'s own Pressed-sample artifact) | `field-text-focused` `#384250` |
| Read-only | **none** (transparent) | `Border/border-neutral-primary` `#d2d6db` | `field-text-readonly` `#161616` |
| Disabled | **none** (transparent) | `Border/border-neutral-primary` `#d2d6db` — **not** `Global/border-disabled` (`#9da4ae`) despite that being `TextInput`'s own Disabled border token; live-verified distinct here | `Global/input-text-disabled` `#9da4ae` (see §9 item 1 — the sampled node's literal text color is an untokenized stray hex, not this named token) |

**Read-only vs. Disabled, live-verified distinct:** both share the identical transparent-bg +
`border-neutral-primary` treatment, differing only in text color (`field-text-readonly` #161616
full-strength vs. the muted disabled gray) — same "Read-only keeps full-strength text" pattern
already established for every prior approved form component.

### `Filled darker` / `Filled lighter` styles

At rest (Default state), both replace the border+white-fill with a flat, borderless fill —
`field-background-darker` / `field-background-lighter` respectively, **no border** (confirmed:
the Default-state Filled-darker sample has no `border` class at all).

**Hovered, live-verified (node `5462:418321`) — Filled darker gains a border it lacks at rest:**
`border-color: field-border-default` (`#9da4ae`) appears on Hover, while the background keeps its
own darker fill. **This independently corroborates the exact same finding already made (and
fixed) for `TextInput`** during its own 2026-07-13 follow-up pass
(`docs/FIGMA_TEXT_INPUT_SPECIFICATION.md` §12 item 2) — not a coincidence or extension-by-analogy
this time, but a second, independent live sample of the identical pattern on a sibling component
sharing the same token family. Implemented from the start (not as a later-discovered gap).

Error, Focused-shadow, and Pressed/Hover-fill behavior for `Filled darker`/`Filled lighter` were
not independently re-sampled per style this pass — extended from the verified Default style's own
deltas plus the one live Hovered sample above, same "closest verified analog" pattern already
established and now doubly corroborated for this exact token family.

---

## 4. Error

`Error=True` overrides the border to `Form/field-border-error` (`#b42318`), live-verified at
Default state/Default style/Filled=True (node `5462:417387`) — state/style-independent override,
same pattern as `TextInput` §7. The helper/error text switches to `Text/text-error` (`#b42318`).

---

## 5. Scrollbar and Resize Handle

- **`_Textarea-Scrollbar`**: a custom-drawn 16px-wide track (background `background-neutral-100`
  `#f3f4f6`, left border `field-border-default`) with a pill-shaped thumb (`Textarea-scrollbar-bar`
  `#d2d6db`). **Not implemented as a custom-built overlay** — this task's Phase C explicitly
  directs "prefer native browser controls... whenever practical," and a real, functioning custom
  scrollbar (correct drag behavior, wheel/touch/keyboard scrolling, RTL-correct positioning)
  reinventing native scroll semantics would be exactly the kind of unnecessary complexity that
  principle warns against. Approximated via the standard CSS `scrollbar-width`/`scrollbar-color`
  properties (native, cross-browser-supported progressive enhancement — Firefox/Chromium honor
  it, Safari falls back to its own native scrollbar). Flagged **Needs Confirmation**: exact pixel
  fidelity (16px track, specific thumb radius) is not achievable through these CSS properties
  alone; this is a close visual approximation, not a pixel-exact reproduction.
- **`.Resize handler`**: a 12×12px bottom-end grip, present whenever `resize=true`. This maps
  directly to the native CSS `resize: vertical` property already used by the pre-existing
  implementation — browsers already render their own native resize grip in this exact corner,
  natively accessible. **No change needed here** — confirms the already-correct pre-existing
  choice rather than revealing a gap.

---

## 6. RTL Behavior

- Full logical-properties mirroring — `justify-content`/padding/text-align via logical properties,
  `dir="auto"` on the value text, consistent with every other approved component.
- No DOM-reordering ambiguity was observed in this component's structure (unlike `Breadcrumb`/
  `Link`/`Tag`/`TextInput`'s own RTL findings) — the Textarea's single text region has no
  affix/icon sub-elements whose physical anchoring could be ambiguous.

---

## 7. Accessibility

- Canonical documentation: the design-system doc link above; no ARIA annotations beyond it exist
  in the Figma file itself.
- Label association, `aria-describedby` (helper + error), `aria-invalid`, `aria-required` — no
  Figma-sourced guidance beyond the visual label/helper/error regions; re-implemented locally
  within a self-contained `Textarea` (see §9 architecture note), same contract `TextInput`
  established.
- Disabled/Read-only use native `disabled`/`readOnly` HTML attributes — both are **fully
  functional** on `<textarea>` (unlike `Checkbox`'s `readonly` platform gap, spec
  `FIGMA_CHECKBOX_SPECIFICATION.md` §5) — no JS interaction guard needed here.
- Focus indicator (`shadow-md` + full-width bottom underline) is real, visible, and
  non-color-reliant, satisfying the same bar every other approved component has been held to.

---

## 8. Node Reference (for future re-verification)

| Variant sampled | Node ID |
|---|---|
| Component set root | `5462:417368` |
| Default, Filled=True, Error=False, Default style | `5462:417369` |
| Focused (same combo) | `5462:417593` |
| Read-only (same combo) | `5462:417681` |
| Disabled (same combo) | `5462:417745` |
| Error=True, Default state, Default style | `5462:417387` |
| Default, Filled darker | `5462:418249` |
| Hovered, Filled darker | `5462:418321` |

Full 144-node grid metadata is available via `get_metadata` on the component-set root
`5462:417368`.

---

## 9. Deviations, Extensions, and Needs-Confirmation Items

1. **Disabled text color.** The sampled Disabled node's value-text layer carries a literal,
   untokenized color (`#7e838b`) not wrapped in any `var()` reference in the extraction — unlike
   every other color on every other sampled node, which all resolve through named Figma
   variables. Treated as a Figma-authoring stray (a manually-overridden layer color, not a
   deliberate design token), same category as `TextInput`'s own §12 item 1 finding. Implemented
   using `Global/input-text-disabled` (`#9da4ae`) instead — the same token the Disabled Label
   sub-component itself uses, and the same disabled-gray convention every prior component's
   Disabled state uses. Flagged, not silently substituted.
2. **`Filled darker`/`Filled lighter` Pressed/Error, and Focused-shadow per style** — extended
   from the verified Default style's deltas plus the one live Hovered sample (§3), not
   individually re-sampled. Same "closest verified analog" pattern as `TextInput`'s own spec.
3. **Scrollbar** (§5) — approximated via native CSS `scrollbar-width`/`scrollbar-color`, not a
   pixel-exact custom-built reproduction. Flagged, deliberate (native-behavior-preserving) choice.
4. **`Size` axis absent.** Confirmed via the full 144-node metadata listing — no `Size` variant
   exists on this component (unlike `TextInput`'s Large/Medium). A single `md`-equivalent
   typography tier is correct, not a gap.
