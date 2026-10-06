# Figma Specification — TOC

**Registry name:** TOC · **Figma file:** `J0xq7JG3JKshRDzrgAM7E0` ("Components
Library - Platforms Code (Community)") · **Node:** `2962:38090` · **Component
key:** `96e4ff7b37cb223fd86cf3a275412e3b4b9de195`

Verified live via Figma MCP `get_design_context` (`disableCodeConnect: true`).
Figma's own component description: *"The Table of Contents is used to
provide a navigable outline or summary of content, allowing users to quickly
understand and jump to specific sections."* Documentation:
https://design.dga.gov.sa/guidelines/components/ui-shell/table-of-content

## 1. Variant axes

`rtl` only. The live node's own body is a fixed, non-parameterized demo list
of `TocItem` instances (level 1/2/3 mixed, all `selected={false}` except the
first) — not a configurable `count`/`items` axis.

## 2. Structure

```
<nav>                                 gap: 8px, column
  <heading block>                     gap: 8px, column
    <eyebrow>  "On this page"         text-sm/Medium, #384250
    <title>    "[Page Name]"          text-xl/Semibold, #1f2a37
  <items>                             column, no gap (each TocItem owns its
                                       own vertical padding)
    <TocItem> × N
```

No divider, no border, no background on the container itself — purely a
heading plus a stack of the already-verified `TocItem`.

## 3. RTL

Heading text right-aligns and switches to `dir="auto"`; `TocItem`'s own RTL
handling (already verified) covers the item list. No additional
component-specific RTL logic needed beyond `text-align` on the heading.

## 4. Composition

Renders `children` (consumer-composed `<TocItem>` elements) rather than an
`items` config array — matches the live node's own flat, unconfigurable list
structure exactly; no synthetic grouping/config layer was invented.

## 5. Tokens

6 new additive `--fads-sys-toc-*` tokens. `title-font-size`/`title-line-height`
(20px/30px) are freshly minted since no `xl` step exists yet on this
codebase's shared typography scale (only this component samples it so far);
`eyebrow-color`/`title-color` reuse `--fads-ref-neutral-700`/`-800` directly
(exact hex match).

## 6. Needs Confirmation

The live node hard-codes example content ("On this page" / "[Page Name]" /
"Page Section" × N) rather than exposing a formal parameterized API — the
`eyebrow`/`title`/`children` prop shape here is a reasonable, disclosed
generalization of that fixed demo, not a literal 1:1 mapping of a
Figma-defined prop set (TOC itself has no other variant properties beyond
`rtl`).
