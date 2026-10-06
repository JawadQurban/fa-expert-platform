# Figma File Upload (Single / Multiple) — Official Specification

**Source of truth:** Figma file `J0xq7JG3JKshRDzrgAM7E0` ("Components Library - Platforms Code
(Community)"), component sets **File Upload / Single** (node `30146:37020`) and
**File Upload / Multiple** (node `30146:37007`), sub-part **`_File`** (`30146:36958`).
**Registry:** both rows' `nodeId`/`figmaUrl` were already populated (`nodeResolutionStatus:
"pending"` — a workflow-progress marker; see `CLAUDE.md`'s node resolution policy). Live-verified
this pass via `get_metadata`/`get_design_context`/`get_variable_defs`; both flipped to
`"resolved"` on success.
**Design documentation:** https://design.dga.gov.sa/guidelines/components/forms-and-inputs/file-uploader
**Figma description:** "File uploader facilitates selecting and uploading files from the user's
device to a web platform. Users initiate the process through a designated area, review
selections, and monitor upload progress..."

Extracted via read-only Figma MCP tools. **Single** contains 6 variants (`rtl` × `state`
[Default/Disabled/Uploaded]); **Multiple** contains 2 (`rtl` only, with independent boolean
`file2`/`file3`/`uploaded` content properties). 4 nodes sampled directly via `get_design_context`
(Single: Default, Uploaded, Disabled; Multiple: full frame with all 3 file-row states), plus
`get_variable_defs` on both component-set roots.

---

## 1. Single vs. Multiple Are Visually Distinct — Not the Same Chrome

The pre-existing implementation always rendered one dashed drop-zone box regardless of
`multiple`. Live data shows this is **wrong for the Single variant**: none of Single's 3 sampled
states (`30146:37021` Default, `30146:37041` Uploaded, `30146:37031` Disabled) render a
drop-zone box, icon, or "drag and drop" heading at all — only a `Label` + helper text (`text-xs`,
tertiary gray) + a **solid black** `Browse Files` button (`button-background-black-default`
`#0d121c`, the `Button` component's neutral/dark variant). Uploaded-state Single shows the same
label/helper/button **plus** one `_File` row below (no drop-zone).

**Multiple** (`30146:37008`) is the drop-zone variant already resembling the pre-existing
implementation, but with different exact chrome: `background-neutral-100` fill, `border-dashed`
`border-neutral-primary`, a centered file-upload icon, a **medium-weight `text-md` heading**
("Drag and drop files here to upload") + a **separate `text-xs` caption** (not one combined
label+hint), and a **secondary/neutral-styled** `Browse Files` button
(`button-background-neutral-default` `#f3f4f6` — light gray, not black). A `Files` list renders
below with one row per file.

**Fixed this pass:** added a `variant` prop (`'single' | 'multiple'`) that switches the chrome to
match each official variant exactly, rather than always forcing the drop-zone box. Both variants
keep the same underlying interaction model (hidden native `<input type="file">`, Browse button,
drag-and-drop support attached to whichever container renders) — Single's lack of a *visible*
drop-zone in Figma is a chrome difference, not proof drag-and-drop is functionally disabled;
flagged **Needs Confirmation** since Figma shows no interaction annotations either way.

---

## 2. `_File` Row Structure (live-verified, node `30146:36973`/`30146:37011`–`37013`)

```
File row (bg background-neutral-100, border border-neutral-primary, radius-sm)
├─ Indicator + file name + remove (padding 8px, gap 8px)
│  ├─ Status icon (20px): success-check (green) / loading spinner / error feedback icon
│  ├─ File name (text-sm/Medium, text-default, flex:1, dir="auto")
│  └─ Button-Close (20px, × icon)
└─ Error message row (error status only) — border-block-start, padding 8px,
   text-sm/Regular, `text-error-primary` #ce281c
```

**Needs Confirmation:** the error message's live color (`Text/text-error-primary` `#ce281c`) does
not match the `Form/field-border-error`/`text-error` red (`#b42318`) every other approved
component's error state uses — sourced independently as its own distinct, live-verified value
rather than assumed identical, same "flag the discrepancy" pattern as `TextInput`'s Large-size
text-color finding.

---

## 3. Colors (live-verified via `get_variable_defs`, both component-set roots)

| Token | Value | Used for |
|---|---|---|
| `Background/background-neutral-100` | `#f3f4f6` | Drop-zone fill (Multiple); file-row fill (both) |
| `Border/border-neutral-primary` | `#d2d6db` | Drop-zone dashed border; file-row border (non-error) |
| `Border/border-error` | `#b42318` | File-row border, error status |
| `Text/text-error-primary` | `#ce281c` | Error-message text (§2 Needs Confirmation) |
| `Text/text-display` | `#1f2a37` | Drop-zone heading (Multiple) |
| `Text/text-primary-paragraph` | `#384250` | Drop-zone caption (Multiple) |
| `Text/text-tertiary` | `#64748b` | Helper text (Single) |
| `Text/text-default` | `#161616` | File name |
| `Icon/icon-success` | `#067647` | Success-check status icon |
| `Icon/icon-default` | `#161616` | Drop-zone icon (Multiple) |
| `Global/background-disabled` | `#e5e7eb` | Browse button fill, Disabled |
| `Global/text-default-disabled` | `#9da4ae` | Label/helper/button text, Disabled |
| `Button/button-background-black-default` | `#0d121c` | Browse button fill, Single (dark/neutral `Button` variant) |
| `Button/button-background-neutral-default` | `#f3f4f6` | Browse button fill, Multiple (secondary `Button` variant) |
| `radius-sm` | `4px` | Drop-zone and file-row corners |

The Browse button in both variants is a real instance of the already-Approved `Button` component
(node `407:510376`, confirmed by name in both extractions) — Single uses `Button`'s dark/neutral
variant, Multiple uses its secondary/neutral-solid variant. Implemented by composing `Button`
directly rather than a hand-rolled button element, reusing its already-verified tokens.

---

## 4. Needs Confirmation

1. Whether Single genuinely has no drag-and-drop capability, or Figma simply omits the chrome for
   that variant while the interaction still works (§1). Implemented as: drag-and-drop stays
   functionally available in both variants (a strictly more-capable, non-regressive reading);
   flagged for design-team confirmation.
2. `text-error-primary` (`#ce281c`) vs. the rest of this design system's `#b42318` error red
   (§2) — implemented using the independently-sampled, distinct value rather than assuming they
   match.
3. The drop-zone icon (file-upload glyph) and the status icons (success-check, loading spinner,
   error) are not in this project's Icon registry — approximated with simple inline
   glyphs/characters, same category as every prior component's icon-pipeline gap (`Breadcrumb`'s
   separator, `Checkbox`'s checkmark, `TextInput`'s feedback icon).
