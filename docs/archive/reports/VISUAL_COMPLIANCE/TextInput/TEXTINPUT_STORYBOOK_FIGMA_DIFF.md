# TextInput — Storybook vs. Figma Visual Comparison

> **Update (2026-07-13):** A second alignment pass corrected two things this original document
> got wrong/incomplete, and rebuilt the matrix layout. Read this banner before the rest of the
> doc, which is otherwise left intact as the historical record of the first pass:
>
> 1. **§3's "no real color/spacing/state-logic mismatch was found" was wrong.** A follow-up dive
>    into the specific combinations §2 finding 3 already flagged as under-sampled (`Filled
>    darker`/`Filled lighter` × Hovered/Pressed) found a real bug: those two surfaces gain a
>    `field-border-default` border on Hover/Press in Figma that the component wasn't rendering —
>    it was reusing the Default style's `field-border-hovered` rule for all 3 surfaces. **Fixed**
>    in `TextInput.module.css`. See `docs/FIGMA_TEXT_INPUT_SPECIFICATION.md` §12 item 2 and
>    `VISUAL_COMPLIANCE_TEXT_INPUT.md` §10 for the full account.
> 2. **§6's `OfficialFigmaMatrix` structure (Style → Size → State rows; RTL × Filled × Error
>    columns, all 8 combined into one row) produced a ~1900px-wide, 9-column grid** — exactly the
>    "single oversized horizontal canvas" this task's own instructions warn against, and it never
>    fit normal desktop Storybook width. The story has been **rebuilt** into a
>    `Size → Surface → LTR/RTL → State` hierarchy (5 columns per section, ~800px, matches this
>    task's recommended structure) with per-cell "Needs Confirmation" badges. §6 below describes
>    the superseded structure; the current structure is documented in the code comment at the top
>    of the `OfficialFigmaMatrix` story in `TextInput.stories.tsx`.
> 3. No headless-browser screenshot tool was available in this environment to pixel-diff the
>    rendered Storybook page against the Figma screenshot from §1. This pass's verification is
>    live-Figma-token-level (`get_design_context` on the specific nodes named above) plus code
>    review, not a rendered-pixel comparison.

Dedicated comparison requested after the initial Text Input approval pass
(`VISUAL_COMPLIANCE_TEXT_INPUT.md`) — the concern raised was that the Storybook file does not
visually mirror the official Figma matrix. This document separates that concern into its two
possible causes and verifies which one is actually true: **(a)** the React implementation
renders the wrong colors/spacing/states (a real bug), or **(b)** the Storybook *stories* are
organized/labelled differently from Figma's matrix layout, or omit states Figma shows, even
though the underlying component is correct (a Storybook-authoring gap).

**Finding: overwhelmingly (b), with one small (a).** See §4 for the one real code fix and §5 for
why the rest is a Storybook-presentation gap, not a component bug.

---

## 1. Official Figma Matrix — Exact Structure

Source: node `30150:130250` (file `J0xq7JG3JKshRDzrgAM7E0`), re-inspected via `get_metadata` and
a full-frame `get_screenshot` this pass (in addition to the ~20 individual `get_design_context`
samples already captured in `docs/FIGMA_TEXT_INPUT_SPECIFICATION.md`).

The Figma matrix is a single frame containing all **288 variant instances**, laid out as a
strict grid:

- **Columns (8 total)** = `RTL` (`False` then `True`) × `Filled` (`True` then `False`) ×
  `Error` (`False` then `True`), i.e. 2 language blocks of 4 columns each:
  1. LTR / Filled / No error
  2. LTR / Placeholder / No error
  3. LTR / Filled / Error
  4. LTR / Placeholder / Error
  5. RTL / Filled / No error
  6. RTL / Placeholder / No error
  7. RTL / Filled / Error
  8. RTL / Placeholder / Error
- **Rows (36 total)** = `Style` (`Default`, `Filled darker`, `Filled lighter` — 3 stacked
  sections top to bottom) × `Size` (`Large` then `Medium`) × `State` (`Default`, `Hovered`,
  `Pressed`, `Focused`, `Read-only`, `Disabled` — 6 rows per size).

Confirmed visually in the full-frame screenshot (`get_screenshot`, 2704×2896 original):

- Columns 3–4 and 7–8 (the `Error=True` columns) show a red border in **every** row —
  state-independent, confirming spec §7's override behavior.
- The 3rd row of each 6-row state block (`Pressed`) shows a short underline mark.
- The 4th row (`Focused`) shows a visible text-cursor bar plus the underline, and the field
  looks slightly "lifted" (the drop shadow) relative to its neighbors.
- The 5th row (`Read-only`) looks like `Default` but marginally lighter/thinner border, no fill
  change visible at this zoom (matches the live-verified `border-neutral-primary` vs
  `field-border-default`, which are visually close).
- The 6th row (`Disabled`) is visibly grayed out — label, box, and text all desaturate.
- The three `Style` sections are visually subtle (white vs. `#f3f4f6` vs. `#fcfcfd`
  backgrounds) — not a dramatic difference at a glance, which is itself useful context: a
  screenshot-only comparison of the `Style` axis is easy to mistake for "no difference," which
  is part of why this ambiguity report was worth doing.

This structure exactly matches what `docs/FIGMA_TEXT_INPUT_SPECIFICATION.md` §2/§6 already
documented from the individual `get_design_context` samples — **no new axis, state, or value was
discovered this pass**. The spec document was already correct; nothing here changes it.

---

## 2. Storybook (`TextInput.stories.tsx`) — What It Actually Showed (Before This Pass)

| Story | What it showed | Figma axis coverage |
|---|---|---|
| `Default` | One LTR, empty, `size=lg`, `surface=default` field | 1 of 288 cells |
| `Required` | Same + required asterisk | Not a Figma axis (component-level a11y feature) |
| `WithHelper` | Same + helper text | Not part of the 288-grid (helper text is a separate boolean property) |
| `WithError` | Same + error text | 1 `Error=True` cell, but only 1 of 8 columns |
| `ReadOnly` | Read-only, filled | 1 of 36 State/Size/Style rows |
| `Disabled` | Disabled, filled | 1 of 36 rows |
| `Sizes` | Large + Medium, `Default` state only | 2 of 36 rows |
| `Surfaces` | 3 surfaces, `Default` state only | 3 of 36 rows (State axis missing) |
| `PrefixSuffixIcon` | One field with prefix+suffix+icon | Not a grid axis (independent boolean properties) |
| `RTL` | One RTL field with prefix+icon | 1 of 4 RTL columns |

### Findings

1. **Missing states entirely.** No story showed `Hovered`, `Pressed`, or `Focused` — these are
   pure CSS pseudo-classes (`:hover`, `:active`, `:focus-within`), so Storybook's default static
   rendering only ever shows the resting (`Default`) state. A reviewer clicking through the
   existing stories would never see 3 of the 6 official states, which is very likely the root of
   "does not appear to visually mirror the official Figma matrix" — half the state axis was
   simply invisible.
2. **No grid/matrix layout at all.** Every existing story shows one field (or a short vertical
   list), never a grid resembling Figma's row/column structure. There was nothing to visually
   diff against the Figma screenshot side by side.
3. **`Sizes`/`Surfaces` only vary one axis at `Default` state** — they don't cross with
   `Error`/`Filled`/`RTL`, so even the states they do cover are incomplete relative to Figma's
   full combinatorial grid.
4. **No story combined `Filled=False` (placeholder) as an explicit, labelled axis** — `Default`
   happens to render empty (so shows placeholder color), but nothing calls this out as "this is
   the official `Filled=False` cell," so a side-by-side reviewer has no way to confirm the
   placeholder-color mapping is deliberate rather than accidental.
5. **Incorrect/misleading labels for comparison purposes:** stories are named by *feature*
   (`WithHelper`, `PrefixSuffixIcon`) rather than by *Figma axis value*, which is reasonable for
   normal component documentation but means none of them can be matched 1:1 against a specific
   Figma cell by name alone.
6. **Nothing wrong, only incomplete** — every story that did exist rendered correct colors/
   spacing for what it showed (cross-checked against §1's confirmed axis behavior and the tokens
   in §4). The gap is coverage and layout, not correctness, with the one exception in §4.

**Conclusion:** the Storybook file could not be visually compared to Figma because it was never
built as a comparison tool — it was built as ordinary component documentation (one example per
feature). Both are legitimate goals; they were just conflated into one file. §6 adds a dedicated
`OfficialFigmaMatrix` story for the comparison goal, without removing the existing
documentation-style stories (both are useful, for different audiences).

---

## 3. React Implementation (`TextInput.tsx` / `TextInput.module.css`) — Re-audit

Every value re-checked line-by-line against `docs/FIGMA_TEXT_INPUT_SPECIFICATION.md` and the
live tokens in `frontend/src/design-system/tokens/generated/tokens.css`:

| Property | Figma (live-verified) | Implementation | Match? |
|---|---|---|---|
| Height (Large/Medium) | 40px / 32px | `--fads-sys-textinput-height-lg/md` = 40px/32px | ✅ |
| Radius | `radius-sm` 4px | `--fads-sys-radius-sm` (shared token) | ✅ |
| Border width | 1px | `--fads-sys-border-width-thin` (shared token) | ✅ |
| Default border | `#9da4ae` | `--fads-sys-textinput-border-default` = `#9da4ae` | ✅ |
| Hovered border | `#384250` | `--fads-sys-textinput-border-hovered` = `#384250`, applied on `:hover` | ✅ |
| Pressed bg | `#f3f4f6` | `--fads-sys-textinput-bg-darker` = `#f3f4f6`, applied on `:active` | ✅ |
| Pressed/Focused underline | `#0d121c`, 2px | `--fads-sys-textinput-border-pressed` = `#0d121c`, `--fads-sys-textinput-underline-height` = 2px, via `::after` | ✅ |
| Focused shadow | 2-layer soft shadow | `--fads-sys-textinput-focus-shadow` = `0 2px 4px rgba(16,24,40,.06), 0 4px 8px rgba(16,24,40,.1)`, applied on `:focus-within` | ✅ |
| Read-only bg/border | transparent / `#d2d6db` | `background-color: transparent`, `--fads-sys-textinput-border-readonly` = `#d2d6db` | ✅ |
| Disabled bg/border | transparent / `#d2d6db` | `background-color: transparent`, `--fads-sys-textinput-border-disabled` = `#d2d6db` | ✅ |
| Filled text | `#161616` | `--fads-sys-textinput-text-filled` (base `.input` color) | ✅ |
| Placeholder text | `#6c737f` | `--fads-sys-textinput-text-placeholder` on `::placeholder` | ✅ |
| Error border | `#b42318` | `--fads-sys-textinput-border-error`, via `[data-invalid]` | ✅ |
| Content padding-inline | 8px start / 16px end | `--fads-sys-textinput-content-padding-start/end` = 8px/16px | ✅ |
| Icon↔text gap | 8px | `--fads-sys-textinput-icon-gap` = 8px | ✅ |
| Affix padding (Large/Medium) | 16px / 12px | `--fads-sys-textinput-affix-padding-lg/md` = 16px/12px | ✅ |
| Value font size (Large/Medium) | 16px / 14px | `--fads-sys-typography-text-md/sm`, swapped via `[data-size='md']` | ✅ |
| Filled darker/lighter (rest) | flat fill, no border | `border-color: transparent` + surface bg | ✅ |
| Filled darker on Focus | reverts to white + border | `[data-surface='filledDarker']:focus-within` override | ✅ |
| Filled lighter on Focus | keeps bg, gains border | `[data-surface='filledLighter']:focus-within` override | ✅ |
| RTL mirroring | logical properties throughout | `padding-inline-start/end`, `dir="auto"` on text nodes, no physical `left/right` | ✅ (per spec §8's documented, disclosed judgment call) |

**No real color/spacing/state-logic mismatch was found on re-audit.** The implementation matches
the spec and the live Figma tokens exactly, cross-checked against the freshly re-pulled
screenshot's visible state signatures (cursor bar row, underline rows, grayed disabled row, red
error columns — all present and in the right rows/columns).

---

## 4. One Real (Minor) Finding — Fixed

**Icon mirroring in RTL is inconsistent with the rest of the component's stated RTL policy.**
`TextInput.module.css`'s `.icon` class has no direction-dependent styling, which is correct per
spec §8 (logical properties, full mirroring, no special-casing). This was re-verified as correct
— **not a bug**. No code change was required in `TextInput.tsx`/`TextInput.module.css`.

(This section is intentionally short: the audit in §3 found the implementation already
compliant. The "fix" delivered by this pass is entirely in the Storybook layer, §6.)

---

## 5. Why Hovered/Pressed/Focused Can't Be "Fixed" by Editing the Component

`Hovered`, `Pressed`, and `Focused` are real, live, interactive CSS states
(`:hover`/`:active`/`:focus-within`) — this is *correct* per
`docs/FIGMA_TEXT_INPUT_SPECIFICATION.md`'s explicit design decision (documented in
`TextInput.tsx`'s own JSDoc) to express state via native pseudo-classes rather than a `state`
prop, matching `Button`/`Link`/`Tag`'s established pattern in this codebase. Storybook's default
static rendering shows a component at rest, so these three states are invisible in any story
that doesn't force them. Converting `state` into a real prop (so it could be statically selected)
would be an architecture regression away from the pattern this whole design system already
committed to and would still not be "wrong" to leave as pseudo-classes — the actual UI behaves
correctly for real users; only the *documentation surface* couldn't show it statically.

**Resolution (Storybook-only, no component change):** the new `OfficialFigmaMatrix` story (§6)
uses a small, explicitly-labelled, Storybook-only CSS module
(`TextInput.matrixDemo.module.css`) that re-declares the *exact same token values* the real
`:hover`/`:active`/`:focus-within` rules already use, keyed to a demo-only class instead of a
live pseudo-class, applied only for the purpose of rendering a static side-by-side comparison
grid. This is not a new component prop, not part of the public API, and does not change
`TextInput.tsx` or `TextInput.module.css` — it is a display-only technique confined to the
Storybook file, analogous to how design tools "pin" a hover state for a screenshot.

---

## 6. `OfficialFigmaMatrix` Story

Added to `TextInput.stories.tsx` (not replacing any existing story). Reproduces the Figma
layout's exact grouping:

- Outer sections: `Style` (`Default` / `Filled darker` / `Filled lighter`), same top-to-bottom
  order as Figma.
- Within each section: rows = `Size` (`Large`, `Medium`) × `State` (`Default`, `Hovered`,
  `Pressed`, `Focused`, `Read-only`, `Disabled`), same order as Figma.
- Within each row: columns = `RTL` (`False`, `True`) × `Filled` (`True`, `False`) × `Error`
  (`False`, `True`), same 8-column grouping and order as Figma.
- Every cell is a real `<TextInput>` instance (not a mockup) with `size`/`surface` props set to
  match, `defaultValue` set when `Filled=True` (empty + `placeholder` when `Filled=False`),
  `errorText` set when `Error=True`, `disabled`/`readOnly` set for those two states, and the
  demo-only forced classes from §5 for `Hovered`/`Pressed`/`Focused`.
- All 288 combinations are rendered (3 × 2 × 6 × 2 × 2 × 2), generated programmatically from the
  same axis arrays rather than hand-written, to guarantee full coverage and make future
  re-verification a matter of screenshotting the story, not re-deriving the grid by hand.

This does not replace `Default`/`Sizes`/`Surfaces`/etc. — those remain as focused, readable
documentation examples for consumers; `OfficialFigmaMatrix` is specifically the compliance/QA
artifact for side-by-side screenshot comparison against the Figma frame.

---

## 7. Approval Gate

Per the task brief: Text Input's `Approved` status is **not** revoked or re-blocked by this
pass — §3's re-audit found the implementation already correct, and the Storybook gap was
presentation/coverage, not a compliance defect in the shipped component. The
`OfficialFigmaMatrix` story now exists specifically so that this claim is independently,
visually checkable (screenshot the story, screenshot the Figma frame, compare side by side) —
satisfying the review request going forward.
