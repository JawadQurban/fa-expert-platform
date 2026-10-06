# Figma Specification — Nav Header Sub-Menu

**Registry name:** Nav Header Sub-Menu · **Figma file:** `Sv0oWOS1SjWnwhQwdzRJIE`
· **Node:** `30150:148877` · **Component key:** `c15c10729b352e0c97d5264d9194348464f0012a`

Verified live via Figma MCP `get_design_context` (`disableCodeConnect: true`),
sampling 3 of the 24 variants directly: `Default/FullWidth/Text only`
(`30150:148878`), `Default/FullWidth/Boxed icon` (`30150:149150`), and
`Dark green/FullWidth/Text only` (`30150:148912`). Figma's own description:
*"The Header Sub-Menu displays a list item style."*

## 1. Variant axes (24 total)

`rtl` × `fullWidth` × `background`[Default/Dark green] ×
`linkStyle`[Text only/Simple icon/Boxed icon]

## 2. Structure

```
<panel>              padding-inline 32px, shadow-lg (2-layer), overflow clip
  <content>          flex-wrap row, gap 24px, max-width 1280px, centered,
                      padding-block 32px
    <column> × 1-4    flex:1, min-width 240px, gap 12px
      <group label>   padding-inline 16px, 18px/28px Bold, #1b8354 (green)
      <navigation>    column, gap 4px
        <HeaderSubMenuItem> × N   (already-Approved, composed directly)
```

## 3. `linkStyle` finding

`Text only`/`Simple icon` map directly to `HeaderSubMenuItem`'s existing
`icon`/`helperText` toggles. `Boxed icon` additionally wraps the icon in a
`background-primary-50` (`#f3fcf6`) rounded 12px-padded box — sampling this
variant surfaced a genuinely new, previously-unmodeled treatment, so
`HeaderSubMenuItem` was extended (additively) with a `boxedIcon?: boolean`
prop rather than reinventing icon rendering inside this panel.

## 4. `background` finding

"Dark green" resolves to `#074d31` (`background-sa-flag`) — a **distinct**
value from the shared brand-primary `#1b8354` used elsewhere in this design
system (Button, TocItem's selected indicator, etc.). Confirmed via direct
sampling, not assumed. Group labels switch to white (`text-oncolor-primary`)
in this mode, matching `HeaderSubMenuItem`'s own `onColor` white-text switch.

## 5. `fullWidth`

Not modeled as a prop. The two sampled canvas widths (1440px vs 1320px) are
demo-frame sizing only — no structural or spacing difference was found
between them. The panel is built as `inline-size: 100%`, consumer-controlled.

## 6. Composition

`NavHeaderSubMenuColumn` (`label` + `children`) wraps 0-N composed
`HeaderSubMenuItem`s; `NavHeaderSubMenu` wraps 1-4 columns as `children` —
matches the live node's own flat per-column structure exactly, no
`columns`-array config layer invented.

## 7. Tokens

16 new additive tokens: 14 `--fads-sys-navheadersubmenu-*` plus 2
`--fads-sys-headersubmenuitem-icon-box-*` (added to the already-Approved
`HeaderSubMenuItem`'s own token set for the boxed-icon extension).

## 8. Needs Confirmation

`onColor`/`boxedIcon` must be applied to each composed `HeaderSubMenuItem`
individually by the consumer — a generic `children` slot can't reach into
composed elements to flip their own props automatically. Disclosed, not a
defect (same category of limitation already accepted for `Toc`'s `children`
composition of `TocItem`).
