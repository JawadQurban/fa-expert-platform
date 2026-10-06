# Figma Specification — List item

**Registry name:** List item · **Figma file:** `J0xq7JG3JKshRDzrgAM7E0`
("Components Library - Platforms Code (Community)") · **Node:** `7850:3463`
· **Component key:** `4b110b637495054379162e4b88627650d059e1b3`

Verified live via Figma MCP `get_design_context` (`disableCodeConnect: true`).
Figma's own description: *"**Ordered List**: Used when item sequence
matters, ensuring a specific viewing or processing order. **Unordered
List**: Used for items without a required order or hierarchy. **List with
Icons**: Like an unordered list but with icons instead of bullets for
visual emphasis."* Documentation:
https://design.dga.gov.sa/guidelines/components/content-display/list

## 1. Variant axes

`rtl` × `type`[Ordered/Unordered/With Icon] × `level`[One/Two] ×
`style`[Primary/Neutral/On-Color] × `icon`(swappable, for "With Icon")

## 2. Structure

A single flex row (`gap: 8px`): marker/icon (leading) + text. No fixed
marker-column width — indentation for `level="Two"` comes purely from a
24px `padding-inline-start` on the whole row, not a reserved gutter.

## 3. Marker content is per-instance, not generated

The live demo passes marker text (`"1-"`, `"a-"`, `"-"`, `"•"`) as literal
per-instance string props (`itemNumber`/`itemLetterEn`/`itemLetterAr`), not
computed via CSS counters or native `<ol>` numbering. This implementation
follows the same shape: `marker` is a generic `ReactNode` slot, left for the
consumer (or the not-yet-built parent `List` composite — the registry's own
dependency order is "List item" before "List") to populate, rather than
inventing numbering/lettering logic that belongs to the parent.

## 4. Live-sampled asymmetry — reproduced exactly

`Unordered`/Level One uses a `-` marker; Level Two uses a `•` — the
**opposite** of the usual bullet-then-dash nesting convention. Confirmed by
direct inspection of the extracted markup, not assumed, and implemented
as sampled rather than "corrected."

## 5. Color — the whole item shares one tone, not just the marker

Unusually, `style` (renamed `tone` to avoid the reserved-word collision
already established for `SecondNavHeader`'s own `style`→`variant` rename)
colors the **entire item** — marker/icon and text alike — as one unit, not
just the marker as might be assumed from a typical list design. Confirmed
by direct inspection: the container's own text-color class applies
uniformly to every child `<p>`.

| Tone | Color |
| --- | --- |
| Primary | `#1b8354` (`text-primary`, brand green) |
| Neutral | `#161616` (`text-default`) |
| On-Color | `#ffffff` (`text-oncolor-primary`) |

## 6. Icon

`checkmark-circle-02` (the live demo's own icon) isn't in this codebase's
Icon registry — same disclosed gap already accepted for `Alert`/`Toast`/
`Notification`/`ItemIcon`'s own missing checkmark. `icon` stays a fully
optional consumer-supplied slot.

## 7. Semantic HTML

Renders a real `<li>` rather than a generic `<div>` — meant to be composed
inside a `<ul>`/`<ol>` (native list semantics), per `CLAUDE.md`'s "use
semantic HTML" rule.

## 8. Tokens

6 new additive `--fads-sys-listitem-*` tokens. Reuses
`--fads-ref-primary-600` directly; `#161616`/`#ffffff` are independently-
sourced literals (matching the same pattern used by many other components'
own on-color/black tokens in this codebase).

## 9. Needs Confirmation

None — every sampled state matches the implementation exactly.
