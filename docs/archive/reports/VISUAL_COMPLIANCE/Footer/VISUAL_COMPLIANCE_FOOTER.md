# Visual Compliance Report — Footer (CMP-03)

Compares the official Platforms Code **Footer** (see
`docs/FIGMA_FOOTER_SPECIFICATION.md`, live-verified via read-only Figma MCP) against
the FADS React implementation at `frontend/src/design-system/shell/Footer/`.
Follows `docs/VISUAL_COMPLIANCE_WORKFLOW.md` Step 4.

- **Figma node:** `Sv0oWOS1SjWnwhQwdzRJIE`, Footer set `30150:165937` (page `4205:18569`).
- **Status:** ✅ Corrected — see §3 for the change checklist and §4 for what was applied.

---

## 0. Starting point (pre-fix implementation)

The pre-fix `Footer` was a minimal placeholder: free-form `children` + one flat list
of link anchors rendered as a single `<nav>`. Its styling used placeholder tokens
(`--fads-sys-space-*`, `--fads-sys-color-background-subtle`, `--fads-sys-color-text-link`)
with no relationship to the official footer's structure, spacing, typography, or
colors. It had **none** of the official regions:

- No grouped **nav-links columns** (Group Label + link list).
- No **legal region** (underlined link list + semibold copyright caption + extra links).
- No **logo/brand slot**.
- No Default/Dark-green **background variant**.
- Links were brand-blue link color, not the official neutral `#384250`.

---

## 1. Structural / shape gaps

| # | Official | Pre-fix | Verdict |
|---|---|---|---|
| S1 | Upper grouped nav-links columns (Group Label + list) | single flat link list | **Missing → added** (`groups`) |
| S2 | Legal region: underlined links + semibold copyright + extra links | free-form children + flat links | **Rebuilt** (`links` → legal links, `copyright`, `secondaryLinks`) |
| S3 | Logo/brand slot (opacity 0.7 logos row) | absent | **Missing → added** (`logos`, caller-supplied) |
| S4 | Social media / Accessibility tools icon-button groups | absent | **Added as optional `utilities` slot** (icons pending Q8) |
| S5 | Default / Dark-green background variant | single bg | **Added** (`background`) |

## 2. Token / spacing / typography gaps

| # | Property | Official | Pre-fix | Verdict |
|---|---|---|---|---|
| T1 | Footer background | `#f3f4f6` (`background-neutral-100`) | `--fads-sys-color-background-subtle` | Fixed |
| T2 | Link color | `#384250` (`link-neutral`) | `--fads-sys-color-text-link` (brand blue) | Fixed |
| T3 | Group Label | text-md 16px / Medium / `#161616` + bottom border `#d2d6db` | n/a | Fixed |
| T4 | Footer link | text-sm 14px / Regular / lh 20px | inherited | Fixed |
| T5 | Legal caption | text-sm 14px / **Semibold** / `#161616` | n/a | Fixed |
| T6 | Region spacing | 48/40/24/16px per the spec §3 | placeholder inset/stack tokens | Fixed |
| T7 | Padding-inline | `32px` + 1280px max-width content | `--fads-sys-space-inset-md` | Fixed |
| T8 | Dark-green | bg `#074d31`, oncolor `#fff`, border `rgba(255,255,255,.3)` | none | Fixed |

## 3. Required-code-changes checklist (from Step 4)

1. **Tokens** — add additive `--fads-sys-footer-*` tokens (colors for both Default and
   Dark-green backgrounds + geometry) to `scripts/generate-tokens.mjs`, sourced from the
   live-verified Figma variables in the spec §5. No shared token repointed.
2. **`Footer.tsx`** — rebuild around the official structure:
   - `groups: FooterGroup[]` + `groupsLabel` → upper grouped nav-links region.
   - `utilities` slot → social/accessibility icon buttons (caller-supplied).
   - `links` (kept) + `navLabel` → bottom legal (underlined) link list.
   - `copyright` → semibold legal caption; `secondaryLinks` → extra link list.
   - `logos` (ReactNode, **caller-supplied — no hardcoded logo**).
   - `background: 'default' | 'darkGreen'`.
   - `children` retained (free-form legal content).
3. **`Footer.module.css`** — token-only, logical properties only (DC-04/DC-23): all
   region spacing, typography, group-label border, dark-green overrides, flex-wrap
   responsiveness.
4. **Stories / tests** — cover groups, legal links, copyright, secondary links, logos,
   dark-green, RTL, a11y.
5. **Docs** — token mapping, approval matrix, changelog, project status.

## 4. Applied fixes

- `scripts/generate-tokens.mjs`: added the `--fads-sys-footer-*` group (5 Default
  colors + 3 Dark-green colors + geometry) — sourced from spec §5; the dark-green
  label border resolves the `alpha: 0.3` over `#ffffff` to `rgba(255,255,255,0.3)`.
- `Footer.tsx`: rebuilt per §3.2. **Branding is fully caller-supplied** — the Footer
  ships no default logo and no organization name; `logos`/`copyright`/labels are all
  `undefined` unless the consumer passes them.
- `Footer.module.css`: rewritten to the official metrics/tokens with flex-wrap
  responsiveness and a `data-background="darkGreen"` override block.
- `Footer.stories.tsx` / `Footer.test.tsx`: rewritten.

## 5. Accessibility verification

- axe clean (unit test) for the full footer and the dark-green variant.
- `<footer>` landmark; grouped-links and legal-links `<nav>` landmarks have distinct
  labels (unique landmarks).
- Links are anchors with real `href`s; a link with no `href` renders as inert text.
- RTL: logical properties only; layout mirrors via document `dir`.

## 6. Backward compatibility

- `links`, `navLabel`, and `children` are retained with compatible semantics, so
  `HomePage.tsx` (which passes exactly those three) continues to work unchanged — no
  page was touched. `links` now render as the official bottom legal link list.

## 7. Needs Confirmation (non-blocking)

- **Social/Accessibility icon buttons** — exposed as the optional `utilities` slot
  rather than fabricated (DGA icon library pending, Q8).
- **Motion** — no explicit Figma transition tokens; reuses shared `--fads-sys-motion-*`.
- **Per-breakpoint column counts** — handled by flex-wrap + `min-width:180px` instead
  of a fixed media-query grid (cosmetic).

These are scoped exceptions (same category as Header's mega-submenu omission and
Button's Destructive/OnColor limits) and do not block approval of the core Footer +
grouped nav links + legal region + configurable logo slot + spacing + typography + RTL.
