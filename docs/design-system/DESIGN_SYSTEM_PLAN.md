# Design System Plan — Consuming DGA Platforms Code in React

> How the project will **consume** the DGA Platforms Code design system in a React + TypeScript codebase (planning only — no code this phase). Enforces "use components as defined, no customization" and "reusable components" `[S3]` `[PROJ: G2]`.

---

## 1. Token strategy

DGA mandates **Color Design Tokens**, **Typography Design Tokens (Display + Text)**, and **Global Spacing Design Tokens** used **without modification** `[S3: F2, F6, F8]`.

**Plan:**
- Define a single **token source of truth** as CSS custom properties (`:root`) + a typed TS map, mirroring the official Platforms Code token names.
- **No hard-coded values** in components — reference tokens only.
- Token **names** are modeled now; **exact values** (hex, px scale, type scale) are filled from the official Figma/site once obtained (**Q3/Q20**). Placeholders will be clearly marked `TODO(Q3)` and never shipped as final.

**Token categories to define:**
| Category | Source | Status |
|---|---|---|
| Color (primary, neutral, background, text, success/error/warning/info, On-Color) | `[S3: color-system]` | names ready; values ⚠Q3 |
| Typography (Display-*, Text-* variants; weights; line-heights) | `[S3: typography]` | families known (IBM Plex Sans Arabic); scale ⚠Q3 |
| Spacing (4/8/16… global scale) | `[S3: layout-and-spacing]` | steps known; full scale ⚠Q3 |
| Radius / elevation / borders | `[S3: components]` | ⚠Q3 |
| Breakpoints / grid | `[S3: responsive]` | ⚠Q3 |

> ⚠ **Q20:** Preferred official token-acquisition route — Figma variables export, an official npm/CSS package, or manual transcription from `[S1]`? This decides tooling.

## 2. Component layer architecture

```
src/
  design-system/
    tokens/            ← CSS vars + typed token map (single source of truth)
    primitives/        ← Button, Link, Input, Textarea, Dropdown, Checkbox,
                          Radio, Switch, Tag, Tooltip, Avatar
    composite/         ← Card, Accordion, Tabs, ContentSwitcher, Table,
                          Steps, FileUploader, Modal, Notification, Rating,
                          Pagination, Breadcrumbs, DatePicker, Loading
    shell/             ← NavHeader, NavDrawer, Footer, Menu, Search, DigitalStamp(cond.)
  features/            ← hackathon-specific composition (uses design-system only)
    landing/  submit/  requests/  feedback/  faq/
  i18n/                ← ar (primary), en (secondary)
  routes/  pages/
```
- **Rule:** `features/*` compose from `design-system/*`; features never restyle base components (keeps `[S3]` "no customization" + reusability G2).
- Each component exports a strict TS props API and implements its full DGA **state set** (`COMPONENT_MAPPING.md`).

## 3. RTL & bidi strategy `[S3: F17]`
- `<html dir="rtl" lang="ar">` default.
- Use **CSS logical properties** (`margin-inline`, `padding-inline`, `inset-inline`) — one ruleset serves RTL/LTR.
- Mirror directional icons (chevrons, arrows, breadcrumb, next/prev) on direction change.
- Bidi-safe rendering of Latin/numeric content inside Arabic.

## 4. Internationalization `[S3: F15, F16]`
- Arabic = default/primary locale; English = secondary.
- On toggle, switch **both** content and `dir`; **no content loss** (WCAG 3.1.1).
- Library candidates: `react-i18next` or `react-intl`. ⚠ **Q21** — team preference. Keep all copy in the message catalog (`CONTENT_STRUCTURE.md §4`).

## 5. Typography loading `[S3: F5]`
- IBM Plex Sans Arabic, Display + Text token variants.
- ⚠ **Q7:** self-host (woff2, `font-display: swap`, subset Arabic+Latin) vs official/approved delivery. Recommend self-hosting for performance + offline demo.

## 6. Theming & "On Color" `[S3: F4]`
- Provide On-Color token variants for elements on colored/image backgrounds.
- Single theme (DGA light) unless the client requests dark mode (not a DGA requirement) — ⚠ Q22.

## 7. Reuse & governance `[PROJ: G2]`
- One component per DGA element; no page-specific forks.
- A component is "done" only when **all its DGA states** exist and are visually verified against Figma (`TESTING_STRATEGY.md`).
- Storybook (or equivalent) recommended to review each component's states in isolation — ⚠ Q23 (tooling choice).

## 8. What blocks a faithful build
Exact token values (Q3), acquisition route (Q20), font delivery (Q7), i18n lib (Q21). None are invented; components are structured to slot official values in without rework.
