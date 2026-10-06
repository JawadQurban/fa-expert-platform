# Landing Page Rebuild Report — Hackathon Landing Page (Icon + Visual Polish Pass)

> Scope: **frontend landing page only**, rebuilt from the existing Phase 6 implementation
> (`reports/LANDING_PAGE_IMPLEMENTATION_REPORT.md`) to add meaningful icon usage, the
> official dark-green footer variant, and visual-hierarchy polish. No backend,
> authentication, Submit/Manage/Request/Admin/Evaluator work was added — see §9.

## 1. Sections implemented

Exactly the 7 sections specified, unchanged in count/order from the prior build:

1. **Header** — logo/nav/actions, unchanged structurally.
2. **Hero** — title, description, primary/secondary CTA, plus a new icon badge composition.
3. **About the Hackathon** — explanatory copy, plus a new eyebrow icon.
4. **Objectives** — 6 cards, each now carrying a distinct, meaningful icon.
5. **Evaluation Criteria** — 6 ordered cards, each with a distinct icon **and** a visible
   numeral (01–06), addressing the requirement that numbering stay visible even though the
   grid's `list-style: none` suppresses the native `<ol>` marker.
6. **Final CTA** — full-width band, now on the same brand-tint background as the Hero
   (bookending the page), with icons on both `Button`s.
7. **Footer** — now rendered with `background="darkGreen"` (the official on-color variant).

`Divider` (`inset`) remains between every major section (4 instances, asserted by a new test).

## 2. Approved components used

Only existing, approved FADS components — none were recreated or modified:
**Header, Footer, Card, Button, Divider, Icon, Typography, Container, Section.** No new
design-system component was added. A small page-local composition helper,
`ItemCard` (in `HomePage.tsx`), wires `Card` + `Typography` + `Icon` together for the
Objectives/Criteria cards — it does not reimplement any of those components; it only
supplies content into `Card`'s existing free-form `children` slot instead of its
`title`/`description` props, because the icon needed to render **above** the heading and
`Card`'s own slot order (`content` block, then `children`) doesn't allow that ordering
via `title`/`description` alone. `Card.tsx`/`Card.module.css` were not touched.

`Button`, `Divider`, `Typography`, and `Icon` are imported directly from their own files
(`@ds/primitives/Button`, `@ds/primitives/Divider`, `@ds/primitives/Typography/Typography`,
`@ds/primitives/Icon/Icon`) rather than the shared `@ds/primitives` barrel — continuing the
fix from the prior session (the barrel's `Icon` re-export previously forced the entire icon
registry into `HomePage`'s module graph even when no icon was used, which caused a real
router-test timeout under full-suite parallel load; see `CHANGELOG.md`). `Card`/`Container`/
`Section`/`Header`/`Footer` continue to be imported from their existing barrels
(`@ds/composite`, `@ds/layout`, `@ds/shell`) — those barrels don't re-export `Icon`, so they
were out of scope for this fix.

## 3. Icon names used and their purpose

Every name below was verified against `frontend/src/design-system/primitives/Icon/
icon-categories.ts` (the generated registry) before use — none were invented. All are
rendered `decorative` (see §5) because each sits directly beside or above visible text
that already carries the meaning.

| Placement                                                       | Icon name                    | Category             | Why                                                     |
| --------------------------------------------------------------- | ---------------------------- | -------------------- | ------------------------------------------------------- |
| Hero badge                                                      | `sprout-01`                  | `community-icons`    | Growth/new-idea metaphor for "innovation"               |
| About eyebrow                                                   | `information-circle`         | `alert`              | Literal "about/info" glyph                              |
| Objective 1 — innovation culture & institutional transformation | `atom-01`                    | `science-technology` | Science/innovation metaphor                             |
| Objective 2 — structured program to design & test solutions     | `add-to-list`                | `notes-tasks`        | Building/assembling a structured program                |
| Objective 3 — lasting institutional methodology & governance    | `notebook`                   | `notes-tasks`        | Documented methodology                                  |
| Objective 4 — national center for applied innovation            | `seal`                       | `shapes`             | Official/national-standing seal                         |
| Objective 5 — supporting Vision 2030                            | `presentation-line-chart-01` | `presentation`       | Strategic trend/vision                                  |
| Objective 6 — measurement & capability-building                 | `dashboard-speed-01`         | `dashboard`          | Performance/capability gauge                            |
| Criterion 1 — clarity of idea                                   | `search-focus`               | `search`             | Clarity/focus                                           |
| Criterion 2 — impact on the Academy                             | `presentation-bar-chart-01`  | `presentation`       | Measured impact                                         |
| Criterion 3 — applied feasibility                               | `task-done-01`               | `notes-tasks`        | Executable/achievable                                   |
| Criterion 4 — financial value & efficiency                      | `dashboard-speed-02`         | `dashboard`          | Efficiency gauge (distinct instance from Objective 6's) |
| Criterion 5 — level of innovation                               | `atom-02`                    | `science-technology` | Distinct instance from Objective 1's `atom-01`          |
| Criterion 6 — scalability & sustainability                      | `wind-turbine`               | `science-technology` | Literal sustainability symbol                           |
| Final CTA primary ("قدم ابتكارك")                               | `add-circle`                 | `add-remove`         | Submit/add-new                                          |
| Final CTA secondary ("إدارة طلباتي")                            | `dashboard-circle`           | `dashboard`          | Manage/monitor                                          |

**16 distinct icon names, all decorative, all resolved from the existing 237-icon / 13-category
registry** — no icon name was invented, no third-party icon library was used, no path
geometry was redrawn. Icon choices live in `src/content/hackathonLanding.ts` (typed
`IconName`, so a typo fails `npm run typecheck`), not hardcoded inside `HomePage.tsx` —
consistent with the existing content-centralization pattern for copy and CTA hrefs.

Hero's inline primary/secondary CTAs (`Button`s inside the Hero section) and the compact
header action button deliberately stay icon-free — only the Final CTA's two buttons carry
`iconStart`, per the task's explicit "Final CTA … Use approved Button and Icon components"
instruction, keeping icon emphasis concentrated at the page's two real decision points
(Hero's typographic hierarchy, Final CTA's icon-reinforced buttons) rather than sprinkled
everywhere.

## 4. Branding integration

Unchanged from the prior build, confirmed still correct:

- `frontend/public/favicon.ico` — already linked in `index.html` (`<link rel="icon"
href="/favicon.ico" sizes="any" />`), untouched.
- `frontend/src/assets/branding/full_logo-ar.svg` — the only logo asset, wired through
  `src/content/branding.ts` → `HomePage.tsx`'s `Header.logo` / `Footer.logos` props. No
  Financial Academy logo or organization name is hardcoded into any design-system
  component (`Header`/`Footer` ship with no default branding by design).

## 5. Dark-green footer token

`Footer` is now rendered with `background="darkGreen"`, the official on-color variant
verified during the prior Footer visual-compliance pass
(`reports/VISUAL_COMPLIANCE/Footer/VISUAL_COMPLIANCE_FOOTER.md`). This resolves to
`--fads-sys-footer-bg-oncolor: #074d31`, sourced from the real Figma variable
`Light.Background.background-SA-Flag` (see `docs/TOKEN_MAPPING.md` — "Footer … Colors —
Dark-green (on-color) background variant"). Text/links/legal-caption automatically switch
to `--fads-sys-footer-text-oncolor`/`--fads-sys-footer-link-oncolor` (`#ffffff`) via
`Footer`'s own existing CSS — no new token was added and `Footer.tsx`/`.module.css` were
not modified.

**Flagged, not fixed:** the only available FA logo asset (`full_logo-ar.svg`) has
hardcoded path fills (`#2A3C90`, navy) rather than `currentColor`, so it isn't
background-adaptive. On the new dark-green footer it renders at the same fixed navy plus
`Footer`'s existing `--fads-sys-footer-logos-opacity: 0.7` (unchanged, applies to both
background variants). This is a pre-existing constraint of the one available brand asset,
not a defect introduced here — flagged **Needs Confirmation** (a white/reversed logo
lockup would need to be supplied by the Academy; fabricating one is out of scope for a
"do not invent branding" pass).

## 6. Accessibility decisions

- **All 16 icons are `decorative`** (`aria-hidden`, no `role="img"`) — every one sits
  beside or above visible text (a card heading, a section eyebrow, a button label) that
  already carries the accessible name, per `docs/ICON_LIBRARY.md` §6's decorative/
  functional rule. Verified by a new test that queries every rendered `Icon` span
  (`[data-size][data-tone]`, unique to `Icon` — `Container` also sets `data-size` alone)
  and asserts `aria-hidden="true"` on all of them.
- **No missing-icon fallback** — a new test asserts zero `[data-missing="true"]` spans
  render on the page, i.e. every `IconName` referenced by content actually resolves in the
  registry (this is also enforced at compile time by the `IconName` type on the content
  fields, so a typo would fail `typecheck` before ever reaching this runtime check).
- **Evaluation Criteria numbering** — the visible "01"–"06" badges are `aria-hidden`
  (decorative from an AT perspective) because the cards already sit inside a real `<ol>`,
  so screen readers already announce "N of 6" from native list semantics; the visible
  numeral exists purely to satisfy the **visual** "keep the numbering visible" requirement
  (the shared `.cardGrid` class sets `list-style: none`, which strips the native `<ol>`
  marker for both the `<ul>` Objectives grid and the `<ol>` Criteria grid).
- `expectNoA11yViolations` (axe-core) continues to pass with zero violations across the
  whole rebuilt page.
- RTL: a new test confirms `document.documentElement` carries `dir="rtl"` under the
  default (Arabic) locale — unchanged app behavior, now explicitly asserted for this page.

## 7. Responsive behavior

Unchanged, still correct: `.cardGrid` (`repeat(auto-fit, minmax(16rem, 1fr))`) reflows the
Objectives/Criteria grids from a multi-column layout down to one column with no media
query; `Header`'s existing responsive hamburger collapse (<960px) and `Container`'s
responsive side padding are untouched. No new fixed-width elements were introduced — the
new icon badges are sized from tokens (`--fads-sys-icon-size-featured` = 40px,
`--fads-sys-icon-size-md` = 24px) and scale with their `Icon size` prop, not with the
viewport.

## 8. CTA integration points

Unchanged from the prior build — both CTAs remain **configurable links only**, sourced
from `src/content/hackathonLanding.ts`:

- **`قدم ابتكارك`** (Submit) → `PRIMARY_CTA_HREF = '/submit'`
- **`إدارة طلباتي`** (Manage) → `SECONDARY_CTA_HREF = '/requests'`

Both render as real `<a href>` elements via `Button`'s link mode (not `onClick`/
`window.location.assign` placeholders) — crawlable, keyboard- and right-click-operable, no
API calls. The two routes have no pages yet (Submit/Manage are out of scope for this
phase, per instruction) — swapping in real destinations only requires editing the two
`_HREF` constants in `hackathonLanding.ts`, never `HomePage.tsx`.

## 9. Remaining limitations

- **Icon registry eager-bundling (pre-existing, documented in `docs/ICON_LIBRARY.md` §9,
  not introduced by this pass).** `Icon.tsx`/`icons.ts` statically import every currently
  registered icon's raw SVG (`?raw`) — using `Icon` at all, even for one name, pulls in the
  whole current registry (237 icons / 13 categories). Before this rebuild, `HomePage`
  didn't import `Icon` and its lazy-loaded route chunk was small; using 16 icon names now
  means that chunk carries the full 237-icon registry — confirmed in `npm run build`'s
  output (`HomePage-*.js` grew to ~663 kB / ~185 kB gzip). This is scoped to `HomePage`'s
  own lazy route chunk (not the initial app shell, which is unchanged), and every icon
  actually _rendered_ on the page is one of the 16 real, meaningful names above — no
  gallery, no enumeration of the registry. Fixing the underlying eager-bundling would mean
  changing `Icon`/`icons.ts`'s loading strategy (dynamic import or sprite, per the existing
  documented plan) — out of scope here per `CLAUDE.md` ("Do not modify … Icon unless a
  genuine blocking bug is found") and the task's explicit stop condition ("Do not continue
  importing icons"). Flagged, not fixed.
- **FA logo isn't background-adaptive** — see §5.
- **Single-style icon library** — only `Stroke, Rounded` is available (13/60 categories,
  237/4,372 icons imported so far); the semantic mapping above was chosen entirely from
  what already exists, matching the task's "only when matching icons exist" instruction —
  no icon category was extended and no new icon was fetched from Figma as part of this
  pass.
- **Visual fidelity for Objectives/Criteria card icon badges** uses the existing
  `--fads-ref-primary-25` tint (already used by the Hero band) and `--fads-sys-radius-lg`
  — no new component-specific token was added, since these are page-level compositions of
  already-approved primitives, not a new design-system component requiring its own
  Figma-verified token set.

## 10. Confirmation: no backend logic was added

No backend, authentication, API calls, Submit workflow, Manage Requests workflow, Request
detail, Admin, or Evaluator code was added or modified. The only files touched are:
`frontend/src/pages/HomePage.tsx`, `frontend/src/pages/HomePage.module.css`,
`frontend/src/pages/HomePage.test.tsx`, `frontend/src/content/hackathonLanding.ts`, plus
this report and the changelog/status docs. `CLAUDE.md`'s Figma MCP Policy was not invoked
this pass — no new Figma calls were made; every icon name was sourced from the
already-imported local registry.

## 11. Validation

Run one command at a time, per instruction; all passed:

- ✅ `npm run typecheck`
- ✅ `npm run lint` (incl. `lint:css` — 0 hardcoded colors, 0 physical-direction properties)
- ✅ `npm run format:check`
- ✅ `npm test` — **301 passed**, 43 files (up from 296/43 — 5 new `HomePage.test.tsx` cases:
  divider count, visible criterion numbering, RTL default, icon decorative-only, no
  missing-icon fallback)
- ✅ `npm run tokens:validate` (230 generated tokens; 280 defined / 199 referenced / 0
  missing)
- ✅ `npm run build` (chunk-size warning on `HomePage-*.js`, see §9 — not an error)
- ✅ `npm run build-storybook` (same pre-existing chunk-size warning class on `Icon-*.js`,
  unrelated to this page)
