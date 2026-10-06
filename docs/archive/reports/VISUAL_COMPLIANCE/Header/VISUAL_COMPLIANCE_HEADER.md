# Visual Compliance Report — Header (CMP-01)

Compares the official Platforms Code **Nav Header** (see
`docs/FIGMA_HEADER_SPECIFICATION.md`, live-verified via read-only Figma MCP) against
the FADS React implementation at `frontend/src/design-system/shell/Header/`.
Follows `docs/VISUAL_COMPLIANCE_WORKFLOW.md` Step 4.

- **Figma node:** `Sv0oWOS1SjWnwhQwdzRJIE`, Nav Header set `30150:148751` (page `429:130167`).
- **Status:** ✅ Corrected — see §3 for the change checklist and §4 for what was applied.

---

## 0. Starting point (pre-fix implementation)

The pre-fix `Header.tsx` was **not the official component's shape at all.** It was a
generic *content banner*: `title` (`<h2>`) + `subtitle` (`<p>`) + `actions` + an
optional `nav` list of `Link` primitives + a `children` slot. It had:

- No **logo slot** and no configurable branding.
- No **responsive menu** / hamburger toggle — the nav simply wrapped.
- Nav links rendered with the **`Link` primitive's** own visual style (link color +
  underline + external "↗" marker), not the official Header Menu Item tab style.
- Placeholder spacing/typography tokens (`--fads-sys-space-*`, `text-lg` title at
  semibold) with no relationship to the official 72px bar, 16px item padding, or the
  text-md/500 label scale.

In short: a different component wearing the same name. This pass rebuilds it around
the official Nav Header (logo + primary nav + actions + responsive toggle).

---

## 1. Structural / shape gaps

| # | Official | Pre-fix | Verdict |
|---|---|---|---|
| S1 | Logo slot (emblem + platform-name label) | absent | **Missing → added** (`logo` + `logoLabel` props) |
| S2 | Inline primary-nav "Header Menu Item" tabs | `Link`-primitive list | **Wrong style → rebuilt** as header menu items |
| S3 | Responsive hamburger toggle + collapsible menu below 960px | absent (nav wrapped) | **Missing → added** |
| S4 | `title`/`subtitle`/`children` banner | present | **Not in official component → removed** |
| S5 | Actions region (trailing) | present (`actions` slot) | **Kept** (caller composes `Button`s) — matches official "caller-composed action" intent |

## 2. Token / spacing / typography gaps

| # | Property | Official | Pre-fix | Verdict |
|---|---|---|---|---|
| T1 | Bar height | `72px` items | none (padding-only) | Fixed |
| T2 | Header padding-inline | `32px` (`≥600`), `16px` (`<600`) | `--fads-sys-space-inset-md` (16px) | Fixed |
| T3 | Item padding | `16px` inline / `8px` block | n/a | Fixed |
| T4 | Item radius | `4px` (`radius-sm`) | n/a | Fixed |
| T5 | Item label type | text-md 16px / **Medium 500** / lh 24px / `#161616` | `Link` styles | Fixed |
| T6 | Logo label type | text-sm 14px / Medium / lh 20px / `#6c737f` | n/a | Fixed |
| T7 | Selected (current) treatment | green fill `#1b8354` + white text + `#54c08a` indicator | bold + text-default color | Fixed |
| T8 | Hover / Pressed | `#f3f4f6` / `#e5e7eb` backgrounds | none | Fixed |
| T9 | Focused | `2px #161616` outline | browser default | Fixed |
| T10 | Disabled | text `#9da4ae` | not supported | Fixed |
| T11 | Header background | `#ffffff` (`background-menu`) | `--fads-sys-color-background-default` (neutral-25 off-white) | Fixed |

## 3. Required-code-changes checklist (from Step 4)

1. **Tokens** — add additive `--fads-sys-header-*` tokens (all sourced from the
   live-verified Figma variables in the spec §6) to `scripts/generate-tokens.mjs`;
   regenerate. Do **not** repoint any shared token.
2. **`Header.tsx`** — rebuild the API around the official shape:
   - `logo` (ReactNode) + `logoLabel` (ReactNode) + `logoHref` — **configurable
     branding; no hardcoded Financial Academy logo or name.**
   - `nav: HeaderNavItem[]` rendered as header menu items (anchors), `selected` →
     `aria-current="page"` → green Selected treatment; `disabled`, `external`,
     optional `hasSubmenu` chevron.
   - `actions` slot retained.
   - Responsive toggle: `menuLabel`, controlled (`menuOpen`/`onMenuOpenChange`) or
     uncontrolled (`defaultMenuOpen`) collapsible nav below 960px.
   - Remove `title`/`subtitle`/`children`.
3. **`Header.module.css`** — token-only, logical properties only (DC-04/DC-23):
   72px bar, item metrics, all states, selection indicator, responsive breakpoints.
4. **Stories / tests** — cover logo slot, nav states, selected, disabled, responsive
   toggle, RTL, actions, a11y.
5. **Docs** — token mapping, approval matrix, changelog, project status.

## 4. Applied fixes

- `scripts/generate-tokens.mjs`: added the `--fads-sys-header-*` group (background,
  item text / hover / pressed / focus-border / disabled, selected bg/hover/pressed/
  text, indicator, logo-label color) + item/logo geometry — sourced from spec §6.
- `Header.tsx`: rebuilt per §3.2. Branding is fully prop-driven; **nothing about the
  Financial Academy is hardcoded** (the component ships no default logo image and no
  default organization name — both are `undefined` unless the consumer passes them).
- `Header.module.css`: rewritten to the official metrics/tokens with a `960px`
  collapse breakpoint and `<600px` compact padding.
- `Header.stories.tsx` / `Header.test.tsx`: rewritten.

## 5. Accessibility verification

- axe clean (unit test) in desktop and expanded-mobile states.
- Keyboard: nav links are anchors; toggle is a `<button>` with `aria-expanded` +
  `aria-controls`; focus-visible shows the `2px #161616` outline.
- `aria-current="page"` on the selected item; disabled items non-navigable
  (`aria-disabled`, no `href`).
- RTL: logical properties only; layout mirrors via document `dir`.

## 6. Needs Confirmation (non-blocking)

- **Selected = full green fill.** The official Header Menu Item `Selected=True`
  renders a solid `#1b8354` tab with white text (verified on nodes `30150:148313`
  et al.). This is a strong treatment for a nav item but is exactly what the
  component specifies — implemented as-is, not softened.
- **Tablet (600–959px) exact geometry** is approximated by the shared "collapsed
  below 960" treatment rather than the official equal-`flex:1`/`max-width:144px`
  3-zone layout. Cosmetic; documented in spec §11.
- **Motion** — no explicit Figma transition tokens for the header; reuses shared
  `--fads-sys-motion-*` and honors reduced-motion.
- **Mega Sub-Menu / Sub-menu Item / action icon-position / icon-only** — out of
  scope, per spec §11.

These are scoped exceptions (same category as Button's Destructive/OnColor limits
and Card's Selectable/Expandable omissions) and do not block approval of the core
Header + Navigation + Logo slot + Responsive menu + spacing + typography + RTL.
