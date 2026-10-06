# Figma Specification — List

**Registry name:** List · **Figma file:** `J0xq7JG3JKshRDzrgAM7E0`
("Components Library - Platforms Code (Community)") · **Node:** `7850:3506`
· **Component key:** `f51fcfe7480823005afff3ae1ae114af29ed3ed0`

Verified live via Figma MCP `get_design_context` (`disableCodeConnect: true`).
Figma's own description: *"Lists are used to organize a set of items into a
single, cohesive unit, typically displayed as a series of options or links.
List items begin with either a number or a bullet."* Documentation:
https://design.dga.gov.sa/guidelines/components/content-display/list

## 1. Variant axes

`rtl` × `type`[Ordered List/Unordered/With Icon] × `style`[Primary/Neutral/
On-color]

## 2. Structure — a thin wrapper composing `ListItem`

The live node is literally a demo composition of 4 already-Approved
`ListItem`s: one Level 1 item (marker `"1-"`) followed by 3 Level 2 items
(markers `"a-"`, `"b-"`, `"c-"`). **Zero** inter-item gap — `ListItem`'s own
internal `gap: 8px` is the marker↔text gap within a single item, not
spacing between items, confirmed by direct inspection of the container's
own `gap-[spacing-none]` class.

## 3. Semantic element choice

Renders a real `<ol>` for `type="ordered"` and `<ul>` otherwise, per
`CLAUDE.md`'s "use semantic HTML" rule. `list-style: none` suppresses the
native marker glyph, since the composed `ListItem` already renders its own
custom marker/icon (native bullets/numbers would double up otherwise).

## 4. Tone is not duplicated at the `List` level

Figma's own `style` (tone) axis is set once per `List` instance, but since
the already-Approved `ListItem` already owns an independent `tone` prop
(built one pass earlier in this same session), `List` does not add its own
duplicate tone prop — each composed `ListItem` sets its own tone. A
disclosed, deliberate simplification to avoid two overlapping sources of
truth for the same value, not a coverage gap.

## 5. Tokens

1 new additive `--fads-sys-list-gap` token (`0px`, live-verified).

## 6. Needs Confirmation

None — every sampled state matches the implementation exactly.
