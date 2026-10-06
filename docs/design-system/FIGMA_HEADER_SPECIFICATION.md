# Figma Header Specification — official Platforms Code "Nav Header" (CMP-01)

Source of truth for the FADS `Header` (shell/CMP-01) visual-compliance pass. Every
value below was pulled **live** via the read-only Figma MCP tools
(`get_metadata`, `get_design_context`, `get_variable_defs`, `get_screenshot`) from
the official "Components Library - Platforms Code (Community)" file — no value here
is invented or approximated. Anything not directly verifiable against the live
component is explicitly marked **Needs Confirmation**.

Governed by `docs/VISUAL_COMPLIANCE_WORKFLOW.md` (Step 3). Compared against the
React implementation in `reports/VISUAL_COMPLIANCE/Header/VISUAL_COMPLIANCE_HEADER.md`.

---

## Node Reference

- **File:** `Sv0oWOS1SjWnwhQwdzRJIE` — "Components Library - Platforms Code (Community)"
- **Page / canvas:** `429:130167` — "↳ UI Shell - Nav Header"
- **Documentation:** <https://design.dga.gov.sa/guidelines/components/ui-shell/navigation-header>

| Sub-component | Node ID | Role |
|---|---|---|
| **Nav Header** (component set) | `30150:148751` | The top-level navigation header shell |
| — Nav Header, `Breakpoint=>960`, `Full-width=False`, `RTL=False` | `30150:148752` | Desktop layout (sampled in full) |
| — Nav Header, `Breakpoint=600>960` | `30150:148812` | Tablet layout |
| — Nav Header, `Breakpoint=<600` | `30150:148838` | Mobile layout |
| **Header Menu Item** (set) | `30150:148312` | A single nav link (Selected × State × RTL) |
| **Header Action** (set) | `30150:148445` | An action item (icon/label, icon-position, selected) |
| **Header Menu** (set) | `30150:148860` | The hamburger / responsive-menu toggle button (Opened × State) |
| **Logo Placeholder** (set) | `30150:149694` | The brand/logo slot (Size × Position × RTL) |
| **Nav Header Sub-Menu** (set) | `30150:148877` | Mega-dropdown panel (out of scope this pass) |
| **Header Sub-menu Item** (set) | `30150:148183` | Sub-menu row (out of scope this pass) |

---

## 1. Component hierarchy

```
Nav Header                         (bg background-menu #fff; padding-inline; flex column, centered)
└─ Header Content                  (flex row; align-items:center; justify-content:space-between; width 100%)
   ├─ Logo & Menu Items            (left group; flex; gap 16px; align-items:center; flex:1)
   │  ├─ Logo Placeholder          (emblem/logo + platform-name label)
   │  └─ Menu Items                (flex row; the inline primary-nav links)
   │     └─ Header Menu Item ×N    (label [+ optional chevron])
   └─ Actions                      (right group; flex; justify-content:flex-end)
      └─ Header Action ×N          (icon + label; last may be a primary Button)
```

Responsive re-composition (by `Breakpoint` variant):

- **`>960` (desktop):** `[ Logo + inline Menu Items ] … [ Actions ]`.
- **`600>960` (tablet):** three equal zones — `[ Header Menu (hamburger) ] [ Logo, centered ] [ Actions ]`. The inline Menu Items collapse behind the hamburger.
- **`<600` (mobile):** same 3-zone structure, **padding-inline reduces from 32px to 16px**; left zone is a utility/overflow button, right zone the hamburger. Menu Items collapse behind the toggle.

---

## 2. Variants / properties (component-set axes)

| Component | Property | Values |
|---|---|---|
| Nav Header | `RTL` | `False` / `True` |
| Nav Header | `Breakpoint` | `>960` / `600>960` / `<600` |
| Nav Header | `Full-width` | `False` / `True` (content spans full width vs. max-width container) |
| Nav Header | `actions`, `menuItems`, `logoEn` | boolean/slot toggles for the three regions |
| Header Menu Item | `RTL` | `False` / `True` |
| Header Menu Item | `State` | `Default` / `Hovered` / `Pressed` / `Focused` / `Disabled` |
| Header Menu Item | `Selected` | `True` / `False` |
| Header Action | `State`, `Selected`, `RTL` | as above |
| Header Action | `Icon position` | `Inline` / `Top` |
| Header Action | `Icon only` | `True` / `False` |
| Header Menu (toggle) | `Opened` | `False` / `True` |
| Header Menu (toggle) | `State` | `Default` / `Hovered` / `Pressed` / `Focused` |
| Logo Placeholder | `Size` | `Large` / `Medium` / `Small` |
| Logo Placeholder | `Logo Position` | `Side` / `Top` |
| Logo Placeholder | `RTL` | `False` / `True` |

---

## 3. Auto-layout, sizing & spacing (live-verified)

### Nav Header container
| Property | Value | Token / source |
|---|---|---|
| Background | `#ffffff` | `Background/background-menu` |
| Direction | column, `align-items:center; justify-content:center` | — |
| Padding-inline (`≥600`) | `32px` | `spacing-4xl` |
| Padding-inline (`<600`) | `16px` | `spacing-xl` |
| Bar height | `72px` (driven by the 72px-tall items) | live-verified item frame height |

### Header Content row
`flex; align-items:center; justify-content:space-between; width:100%`.

### Logo & Menu Items (left group)
| Property | Value | Token |
|---|---|---|
| gap (logo ↔ menu) | `16px` | `spacing-xl` |
| align | center; `flex:1` | — |

### Logo Placeholder
| Property | Value | Token |
|---|---|---|
| gap (emblem ↔ label) | `8px` | `spacing-md` |
| padding-inline | `4px` | — |
| padding-block | `5px` | — |
| emblem size (Medium) | `48px` | live-verified |
| label typography | Text sm / Medium | see §5 |
| label color | `#6c737f` | `Text/text-secondary-paragraph` |

### Header Menu Item
| Property | Value | Token |
|---|---|---|
| height | `72px` | live-verified |
| padding-inline | `16px` | `spacing-xl` |
| padding-block | `8px` | `spacing-md` |
| gap (label ↔ chevron) | `4px` | `spacing-xs` |
| radius | `4px` | `radius-sm` |
| chevron size | `20px` | live-verified |
| label typography | Text md / Medium | see §5 |

### Header Action
Same box metrics as Header Menu Item (`h 72px`, `px 16px`, `py 8px`, `gap 4px`, `radius 4px`);
leading icon `24px`; `min-width 72px`. The last action in the desktop sample is a
**primary Button** (`Button/button-background-primary-default #1b8354`, label
`Text/text-oncolor-primary #fff`, SemiBold) with a bottom **selection indicator** bar.

### Header Menu (hamburger toggle)
| Property | Value | Token |
|---|---|---|
| outer container | flex col; `h 72px`; `py 8px`; `radius 4px` | `spacing-md`, `radius-sm` |
| button box | `40 × 40px` (min=max) | live-verified |
| button padding-inline | `16px` | `Button/buttons-lg-padding` |
| button radius | `4px` | `radius-sm` |
| icon | `24px` (`menu-01` hamburger; `Opened=True` swaps to close) | live-verified |

### Selection indicator (selected / pressed items)
| Property | Value | Token |
|---|---|---|
| bar height | `6px` | live-verified |
| radius | full | `radius-full` (9999) |
| color | `#54c08a` | `Background/background-primary-400` |
| horizontal inset | `8px` | `spacing-md` |
| position | bottom edge of the 72px item | — |

---

## 4. States & colors (Header Menu Item, live-verified)

### Selected = False (a normal, non-current nav link)
| State | Background | Text | Border |
|---|---|---|---|
| Default | transparent | `#161616` (`Text/text-default`) | none |
| Hovered | `#f3f4f6` (`Button/button-background-neutral-hovered`) | `#161616` | none |
| Pressed | `#e5e7eb` (`Button/button-background-neutral-pressed`) + indicator bar | `#161616` | none |
| Focused | transparent | `#161616` | `2px` solid `#161616` (`Border/border-black`) |
| Disabled | transparent | `#9da4ae` (`Global/text-default-disabled`) | none |

### Selected = True (the current page — `aria-current="page"`)
| State | Background | Text |
|---|---|---|
| Default | `#1b8354` (`Button/button-background-primary-default`) + `#54c08a` indicator | `#ffffff` (`Text/text-oncolor-primary`) |
| Hovered | `#166a45` (`…primary-hovered`) | `#ffffff` |
| Pressed | `#104631` (`…primary-pressed`) | `#ffffff` |
| Focused | `#1b8354` + `2px` `#161616` border | `#ffffff` |
| Disabled | `#e5e7eb` (`Global/background-disabled`) | `#9da4ae` (`Global/text-default-disabled`) |

### Header Menu (toggle) — neutral treatment
Default transparent; Hovered `#f3f4f6`; Pressed `#e5e7eb`; Focused `2px #161616` border
(`Button/button-background-neutral-*` + `Border/border-black`), icon `Icon/icon-default #161616`.

---

## 5. Typography (live-verified variables)

| Element | Style | Family | Weight | Size | Line-height | Color |
|---|---|---|---|---|---|---|
| Menu-item / action label | Text md / Medium | IBM Plex Sans Arabic | Medium (500) | `16px` (`typo-size-text-md`) | `24px` (`line-heights-text-md`) | `#161616` |
| Logo label | Text sm / Medium | IBM Plex Sans Arabic | Medium (500) | `14px` (`typo-size-text-sm`) | `20px` (`line-heights-text-sm`) | `#6c737f` |
| Primary-action button label | (Button) SemiBold | IBM Plex Sans Arabic | SemiBold (600) | `16px` | `24px` | `#ffffff` |

Letter-spacing `0` throughout.

---

## 6. Tokens used (name → value → source)

Colors (all Figma variables, live-verified via `get_variable_defs` on the sampled nodes):

| Figma variable | Value |
|---|---|
| `Background/background-menu` | `#ffffff` |
| `Background/background-white` | `#ffffff` |
| `Text/text-default` | `#161616` |
| `Text/text-secondary-paragraph` | `#6c737f` |
| `Text/text-oncolor-primary` | `#ffffff` |
| `Icon/icon-default` | `#161616` |
| `Button/button-background-neutral-default` | `#f3f4f6` |
| `Button/button-background-neutral-hovered` | `#f3f4f6` |
| `Button/button-background-neutral-pressed` | `#e5e7eb` |
| `Button/button-background-primary-default` | `#1b8354` |
| `Button/button-background-primary-hovered` | `#166a45` |
| `Button/button-background-primary-pressed` | `#104631` |
| `Border/border-black` | `#161616` |
| `Background/background-primary-400` | `#54c08a` |
| `Global/background-disabled` | `#e5e7eb` |
| `Global/text-default-disabled` | `#9da4ae` |

Spacing / radius / type (Figma variables):

| Figma variable | Value |
|---|---|
| `spacing-xs` | `4` |
| `spacing-md` | `8` |
| `spacing-xl` | `16` |
| `spacing-4xl` | `32` |
| `radius-sm` | `4` |
| `radius-full` | `9999` |
| `Button/buttons-lg-padding` | `16` |
| `Size/Text/typo-size-text-md` | `16` |
| `Size/Text/typo-size-text-sm` | `14` |
| `Line Height/Text/line-heights-text-md` | `24` |
| `Line Height/Text/line-heights-text-sm` | `20` |
| `Font Wieght/font-weight-medium` | `Medium (500)` |
| `Font Family/font-family-text` | `IBM Plex Sans Arabic` |

The FADS `--fads-sys-header-*` tokens generated from these are catalogued in
`docs/TOKEN_MAPPING.md`.

---

## 7. Accessibility

- The header renders inside a `<header>` landmark; primary navigation is a `<nav>`
  with an accessible label (`navLabel`).
- Nav links are anchors; the current page carries `aria-current="page"` (which
  drives the Selected visual treatment).
- The responsive toggle is a real `<button type="button">` with `aria-expanded`,
  `aria-controls` (pointing at the collapsible nav panel), and an accessible label.
- Focused state is a visible `2px` `#161616` outline (meets WCAG 2.4.7 / 2.4.11).
- Disabled items are non-interactive and communicate state to assistive tech.
- Icons in items (chevron, action leading icon, hamburger) are decorative unless
  the item is icon-only, in which case the item must carry an accessible name.

---

## 8. RTL behavior

- The header layout is direction-agnostic: it uses logical flex ordering, so in a
  right-to-left document the logo/menu group sits on the right and the actions on
  the left — matching the official `RTL=True` variants — with **no physical
  left/right** properties (DC-23).
- Directional glyphs (chevron, action arrows) mirror with the document direction;
  the official set ships explicit `RTL=True` mirrors of every item.

---

## 9. Motion / interaction

- State changes (hover/press/focus background & border) are simple token-driven
  color transitions; **Needs Confirmation** — the Figma file does not expose an
  explicit transition duration/easing for the header, so the FADS implementation
  reuses the shared `--fads-sys-motion-*` fast/standard tokens and honors
  `prefers-reduced-motion`.
- The responsive menu opens/closes a collapsible panel below the bar on toggle.

---

## 10. Responsive behavior

| Breakpoint | Layout |
|---|---|
| `≥960px` | Logo + **inline** Menu Items on the leading side; Actions on the trailing side; padding-inline `32px`. |
| `600–959px` | Hamburger toggle replaces inline Menu Items; logo centered; Actions trailing; padding-inline `32px`. |
| `<600px` | Same collapsed structure; padding-inline `16px`. |

---

## 11. Out of scope this pass (documented, not implemented)

- **Nav Header Sub-Menu** (`30150:148877`) mega-dropdown and **Header Sub-menu Item**
  (`30150:148183`) — a full multi-level dropdown/mega-menu system with `Full width`,
  `Background=Default/Dark green`, and `Link style=Text only/Simple icon/Boxed icon`
  axes. Implementing it would substantially expand the Header's API and interaction
  model beyond a visual-compliance fix; not requested, not attempted.
- **Header Action** `Icon position=Top` and `Icon only` variants, and the primary-
  action **selection indicator** on actions — actions are exposed as a caller-composed
  `actions` slot (callers pass FADS `Button`s), so these are the caller's concern.
- The exact tablet (`600>960`) 3-zone geometry (equal `flex:1` zones, `max-width:144px`
  side zones) is approximated by the shared "collapsed below 960" treatment — **Needs
  Confirmation** against the tablet variant if pixel-exact tablet layout is later required.
