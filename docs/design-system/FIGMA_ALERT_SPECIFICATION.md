# Figma Alert (Inline Alert) — Official Specification

**Status: RESOLVED.** The registry's Alert row was manually updated with a real canvas node
(`nodeId: "1730:46048"`, `figmaUrl` pointing at node `1730-46048`) after the prior pass's
disclosed blocker. This spec supersedes the prior version (which documented the blocker itself)
with the full live-verified findings.

**Source of truth:** Figma file `J0xq7JG3JKshRDzrgAM7E0` ("Components Library - Platforms Code
(Community)"), component set **Inline Alert** (node `1730:46048`), category "Feedback & Overlays".
**Design documentation:** https://design.dga.gov.sa/guidelines/components/feedback/notification
**Figma description:** "Positioned within task flows, these notifications inform users about the
status of an ongoing action, typically displayed at the top of the main content area."

Extracted via read-only Figma MCP tools. 40 variants (`rtl` × `type` [Neutral/Info/Destructive/
Warning/Success] × `backgroundColor` [White/Color] × `mobile`); 6 sampled directly via
`get_design_context` (Neutral/White, Destructive/White, Destructive/Color, Neutral/Color,
Neutral/White/Mobile), plus `get_variable_defs` on the component-set root.

---

## 1. Alert vs. Notification vs. Toast — Confirmed Separate

Unchanged from the prior pass's finding (re-confirmed): `search_design_system` shows three
distinct official component sets — **Inline Alert** (this component), **Notification** (page
banner), and **Notification Toast** (→ this repo's `Toast`). Not a duplicate of either.

## 2. The Live Structure Is Substantially Richer Than the Prior Implementation

The prior pass's implementation (built while this node was unresolvable) was a plain title/
message/dismiss-button box. The live "Inline Alert" is structurally different:

- A **40px circular "Featured icon"** — a tone-colored circle containing a centered ~20px icon
  glyph. Always present (not a toggleable content property in the sampled variant/prop set).
- **Title** (`leadTextEn`, `text-md`/**Semibold**, `Text/text-display` `#1f2a37`) + optional
  **description** (`helperTextEn`/`helperText` toggle, `text-sm`/Regular, `Text/text-primary-
  paragraph` `#384250`, unaffected by tone or surface).
- **Up to two actions** (`actions`/`secondaryAction` toggles) in a dedicated row, indented to
  align under the text (`padding-inline-start: 40px`, `Global/spacing-5xl`).
- A **dismiss button** (`closeButton` toggle) — 32px, `radius-sm` (4px, **not circular**),
  containing a 20px "×" (`multiplication-sign`) icon.
- A **tone-colored accent stripe** ("Vertical line") along the leading edge — 8px thick, 70%
  opacity, extending 1px beyond the box border on each side. **Always present**, not optional.
- Outer box: 1px border, `radius-md` (8px), `Notification/notification-padding` (16px block) ×
  `Notification/notification-h-padding` (24px inline), `Notification/notification-gap` (16px)
  between the header row and the actions row.

## 3. Official Tones (confirmed — none removed, none invented)

| Figma `Type` | This repo's `tone` | Icon color | Icon-circle bg | Accent stripe |
|---|---|---|---|---|
| Neutral | `neutral` | `Icon/icon-default` `#161616` | `Background/background-neutral-50` `#f9fafb` | `Background/background-neutral-200` `#e5e7eb` |
| Info | `info` | `Icon/icon-info` `#175cd3` | `Background/background-info-50` `#eff8ff` | `Background/background-info` `#1570ef` |
| Destructive | `error` | `Icon/icon-error` `#b42318` | `Background/background-error-50` `#fef3f2` | `Background/background-error` `#d92d20` |
| Warning | `warning` | `Icon/icon-warning` `#b54708` | `Background/background-warning-50` `#fffaeb` | `Background/background-warning` `#dc6803` |
| Success | `success` | `Icon/icon-success` `#067647` | `Background/background-success-50` `#ecfdf3` | `Background/background-success` `#079455` |

All 5 previously-implemented tones are confirmed live — **none removed, none invented**.

## 4. `backgroundColor` (White / Color) — the `surface` Property

- **White** (default): outer box is `Background/background-notification-white` `#ffffff`, border
  is `Border/border-neutral-primary` `#d2d6db` **for every tone** (the box border does not change
  color per tone — only the featured icon and the accent stripe carry the tone color).
- **Color** (tinted): outer box background/border switch to a per-tone tint (e.g.
  `Background/background-error-25` `#fffbfa` + `Border/border-error-light` `#fecdca` for
  Destructive), and the **title text itself** recolors to the tone (`Text/text-error` etc.) — the
  description stays the same neutral color regardless. **Neutral** has no distinct tinted-tone
  color of its own — its "Color" variant is `Background/background-neutral-25` `#fcfcfd` with the
  *same* `border-neutral-primary` border as White (live-verified, not assumed).

## 5. `Mobile` — a Real Official Responsive Layout (replaces the fabricated `compact` prop)

The prior pass added an unverified `compact` prop (reduced padding) with **no Figma evidence**.
Live data proves this was wrong — but a real, different responsive variant exists: `Mobile`.
Restructures the layout entirely:
- Icon + dismiss button share a top row (dismiss pushed to the far end via `justify-content:
  space-between` — a deliberate, disclosed simplification of Figma's literal absolute positioning,
  producing the identical visual result through normal flex flow rather than fighting absolute
  coordinates).
- Text block moves below, full width (no longer beside the icon).
- Actions stack **full width**, vertically (no longer a horizontal row with a 40px indent).
- The accent stripe moves from the **leading vertical edge** to the **top horizontal edge**
  (full width, same 8px thickness).
- Padding becomes uniform 16px on all sides (vs. 24px inline / 16px block for the default layout).

**Corrected this pass:** the fabricated `compact` prop was deleted entirely; the real official
`mobile` boolean property was added in its place.

## 6. Icon Glyph Mapping (approximated — disclosed)

The exact vector icon per tone could not be conclusively identified from the extracted markup
(every sample renders as a raster image export, and Figma's own component-description lookup
returns aggregated hints — "help-circle"/"information" — that aren't reliably tied to one specific
tone's glyph). Mapped to the closest semantically-appropriate icon already in this project's Icon
registry rather than guessing new vector paths:

| Tone | Icon used | Registry category |
|---|---|---|
| Neutral | `help-circle` | `alert` (matches Figma's own component-description hint for this tone) |
| Info | `information-circle` | `alert` |
| Warning | `alert-diamond` | `alert` |
| Error | `alert-circle` | `alert` |
| Success | *(no dedicated checkmark icon exists in the registry)* — reuses the exact inline-SVG checkmark path already established by `Checkbox` | n/a |

Flagged **Needs Confirmation** — the tone-to-icon mapping is a reasonable, disclosed choice, not a
pixel-verified match. The `icon` prop remains fully overridable per instance.

## 7. Dismiss Button

Upgraded from the prior pass's literal "×" text character to a real 32px button (`radius-sm`)
containing the already-imported `cancel-01` icon (a real "X"/cancel glyph from the Icon registry's
`add-remove` category) — closer to Figma's `multiplication-sign` icon than a bare text character,
though not the identical vector asset (Needs Confirmation, non-blocking — same disclosure category
as every other icon-pipeline approximation in this project).

## 8. Needs Confirmation

1. Exact icon-per-tone vector match (§6) — reasonable registry substitutes used, not pixel-exact.
2. Dismiss-button icon color — not independently color-annotated in the extracted markup;
   `Icon/icon-default` used as a reasonable default.
3. The Mobile layout's dismiss-button positioning is implemented via `justify-content: space-
   between` rather than Figma's literal absolute-position values — functionally and visually
   equivalent, disclosed as a simplification rather than an unverified guess.
