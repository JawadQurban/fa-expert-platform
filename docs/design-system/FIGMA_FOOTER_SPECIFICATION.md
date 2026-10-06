# Figma Footer Specification — official Platforms Code "Footer" (CMP-03)

Source of truth for the FADS `Footer` (shell/CMP-03) visual-compliance pass. Every
value below was pulled **live** via the read-only Figma MCP tools (`get_metadata`,
`get_design_context`, `get_variable_defs`, `get_screenshot`) from the official
"Components Library - Platforms Code (Community)" file — no value here is invented or
approximated. Anything not directly verifiable is marked **Needs Confirmation**.

Governed by `docs/VISUAL_COMPLIANCE_WORKFLOW.md` (Step 3). Compared against the React
implementation in `reports/VISUAL_COMPLIANCE/Footer/VISUAL_COMPLIANCE_FOOTER.md`.

---

## Node Reference

- **File:** `Sv0oWOS1SjWnwhQwdzRJIE` — "Components Library - Platforms Code (Community)"
- **Page / canvas:** `4205:18569` — "↳ UI Shell - Footer"
- **Documentation:** <https://design.dga.gov.sa/guidelines/components/ui-shell/footer>

| Node | ID | Role |
|---|---|---|
| **Footer** (component set) | `30150:165937` | The site-wide footer |
| — `RTL=False, Background=Default, Breakpoint=600+` | `30150:165938` | Desktop, light (sampled in full) |
| — `RTL=False, Background=Dark green, Breakpoint=600+` | `30150:166116` | Desktop, dark-green (tokens sampled) |
| — `RTL=False, Background=Default, Breakpoint=<600` | `30150:166294` | Mobile (layout confirmed via screenshot) |
| **Logo Placeholder** | `13518:53065` | Brand/logo slot used in the legal row |
| **Link** | `2508:25804` | The footer link atom |

---

## 1. Component hierarchy

```
Footer                              (bg background-neutral-100; padding-inline 32px; flex, centered)
└─ Content                          (max-width 1280px; flex column; gap 48px; pad-block 40px top / 24px bottom)
   ├─ Nav links   (optional)        (flex-wrap; gap 24px; pad-block 16px top / 40px bottom; full width)
   │  ├─ Footer group ×N            (flex column; gap 8px; min-width 180px; flex 1)
   │  │  ├─ Group Label             (text-md/Medium; bottom border; pad-block-end 8px)
   │  │  └─ Link Group → Link List  (flex column; gap 8px)
   │  │     └─ Link ×N              (text-sm/Regular; link-neutral)
   │  └─ Footer group (utilities)   (Social media + Accessibility tools: Group Label + row of 32px icon buttons)
   └─ Legal                         (flex; gap 24px; align-items center; pad-block 16px; full width)
      ├─ Links & legal info         (flex 1; flex column; gap 40px)
      │  ├─ Link List               (flex-wrap; gap 16px) — underlined links
      │  └─ Legal info              (flex column; gap 8px)
      │     ├─ Legal caption        (text-sm/Semibold; text-default) — copyright line
      │     └─ Extra Link List      (flex-wrap; gap 16px) — e.g. Terms / Privacy
      └─ Logos                      (flex; justify-end; gap 16px; opacity 0.7) — brand logos
```

---

## 2. Variants / properties (component-set axes)

| Property | Values |
|---|---|
| `RTL` | `False` / `True` |
| `Background Color` | `Default` (light) / `Dark green` |
| `Breakpoint` | `600+` (multi-column) / `<600` (wrapped/stacked) |
| `navLinks` | boolean — toggles the whole upper "Nav links" region |

---

## 3. Auto-layout, sizing & spacing (live-verified, desktop `600+`)

| Element | Property | Value | Token |
|---|---|---|---|
| Footer | background | `#f3f4f6` | `Background/background-neutral-100` |
| Footer | padding-inline | `32px` | `spacing-4xl` |
| Content | max-inline-size | `1280px` | live-verified |
| Content | gap (regions) | `48px` | `Global/spacing-6xl` |
| Content | padding-block-start | `40px` | `spacing-5xl` |
| Content | padding-block-end | `24px` | `spacing-3xl` |
| Nav links | gap (columns) | `24px` | `spacing-3xl` |
| Nav links | padding-block | `16px` top / `40px` bottom | `spacing-xl` / `spacing-5xl` |
| Footer group | gap | `8px` | `spacing-md` |
| Footer group | min-inline-size | `180px` | live-verified |
| Group Label | padding-block-end | `8px` | `spacing-md` |
| Group Label | border-block-end | `1px solid #d2d6db` | `Border/border-neutral-primary` |
| Link List | gap | `8px` | `spacing-md` |
| Link | gap (icon) | `4px` | `Link/link-sm-gap` |
| Legal | gap | `24px` | `spacing-3xl` |
| Legal | padding-block | `16px` | `spacing-xl` |
| Links & legal info | gap | `40px` | `spacing-5xl` |
| Legal Link List | gap | `16px` | `spacing-xl` |
| Legal info | gap | `8px` | `spacing-md` |
| Extra Link List | gap | `16px` | `spacing-xl` |
| Logos | gap | `16px` | `spacing-xl` |
| Logos | opacity | `0.7` | live-verified |
| Social/Accessibility button | box | `32px` square; radius `4px`; `1px` neutral border; icon `20px` | `radius-sm`, `Border/border-neutral-primary` |

---

## 4. Typography (live-verified variables)

| Element | Style | Family | Weight | Size | Line-height | Color |
|---|---|---|---|---|---|---|
| Group Label | Text md / Medium | IBM Plex Sans Arabic | Medium (500) | `16px` | `24px` | `#161616` (`Text/text-default`) |
| Footer Link | Text sm / Regular | IBM Plex Sans Arabic | Regular (400) | `14px` | `20px` | `#384250` (`Link/link-neutral`) |
| Legal Link | Text sm / Regular underlined | IBM Plex Sans Arabic | Regular (400) | `14px` | `20px` | `#384250`, underlined |
| Legal caption | Text sm / Semibold | IBM Plex Sans Arabic | Semibold (600) | `14px` | `20px` | `#161616` (`Text/text-default`) |
| Logo label | Text xs / Medium | IBM Plex Sans Arabic | Medium (500) | `12px` | `18px` | `#6c737f` (`Text/text-secondary-paragraph`) |

---

## 5. Colors / tokens (name → value → source)

### Default (light) background
| Figma variable | Value |
|---|---|
| `Background/background-neutral-100` | `#f3f4f6` |
| `Text/text-default` | `#161616` |
| `Border/border-neutral-primary` | `#d2d6db` |
| `Link/link-neutral` | `#384250` |
| `Text/text-secondary-paragraph` | `#6c737f` (logo label) |

### Dark green background (`Background Color=Dark green`)
| Figma variable | Value |
|---|---|
| `Background/background-SA-Flag` | `#074d31` |
| `Text/text-oncolor-primary` | `#ffffff` (labels + captions) |
| `Link/link-oncolor` | `#ffffff` (links) |
| `Border/border-oncolor-transparent-30` | `rgba(255,255,255,0.3)` (label underline) |

The FADS `--fads-sys-footer-*` tokens generated from these are catalogued in
`docs/TOKEN_MAPPING.md`.

---

## 6. Accessibility

- Rendered inside a `<footer>` landmark (`contentinfo`).
- Each footer link list is a `<nav>` landmark with a distinct accessible label
  (grouped-links landmark and the bottom legal-links landmark use different labels,
  so landmarks stay unique).
- Group labels are true headings/labels for their lists.
- Links are anchors with real `href`s; a link without an `href` is rendered as inert
  text (not a fake link).
- The copyright line is a normal, readable paragraph.
- Social/accessibility icon buttons (when supplied) must carry accessible names — the
  official DGA icon library is not yet available (Q8), so these are exposed as a
  caller-supplied `utilities` slot rather than fabricating icons.

---

## 7. RTL behavior

- Layout is direction-agnostic: logical flex and logical spacing/border properties
  only (no physical left/right — DC-23), so in a right-to-left document columns and
  the legal row mirror to match the official `RTL=True` variants.

---

## 8. Responsive behavior (`Breakpoint`)

| Breakpoint | Layout |
|---|---|
| `600+` | Multi-column nav-links row (columns are `flex:1`, `min-width:180px`); legal row = links/legal-info on the leading side, logos trailing. |
| `<600` | Same content; columns **wrap** (min-width forces 2→1 per row); the legal row wraps so logos drop below. Achieved by the same flex-wrap + min-width rules — no separate markup. |

---

## 9. Motion / interaction

- Footer links use a simple hover treatment (underline / color); the Figma file
  exposes no explicit transition tokens for the footer — **Needs Confirmation** —
  so the FADS implementation reuses the shared `--fads-sys-motion-*` tokens and
  honors `prefers-reduced-motion`.

---

## 10. Out of scope this pass (documented, not implemented as fixed markup)

- **Social media / Accessibility tools icon buttons** — exposed as an optional
  caller-supplied `utilities` slot (icon buttons need the DGA icon library, Q8);
  not fabricated. **Needs Confirmation** on exact button states.
- **Logo Placeholder** default artwork — the Footer ships *no* default logo;
  `logos` is a caller slot (branding must stay configurable).
- Exact per-breakpoint column counts are handled by flex-wrap + `min-width:180px`
  rather than fixed media-query column templates — cosmetic, **Needs Confirmation**
  if a pixel-exact column grid is later required.
