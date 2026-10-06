# DGA Repository Analysis — GOV-SA/design-system-gov.sa

> **Repository:** https://github.com/GOV-SA/design-system-gov.sa
> **Analyzed:** 2026-07-08 (via GitHub API + raw source inspection)
> **Verdict (up front):** This is the **legacy "GOV.SA Design System"** — a Bootstrap 4 + jQuery + SCSS/BEM UI kit. It is **NOT** the DGA **Platforms Code v1.0** (كود المنصات) that this project targets, and it is **not an acceptable source of final DGA token values**. See `LEGACY_REFERENCE_DECISION.md` and `TOKEN_SOURCE_STRATEGY.md`.
>
> Reference key introduced: **`[LEGACY]`** = this repository. Priority: **above community examples (`[S5]`/`[S6]`), below the official Platforms Code (`[S1]`/`[S2]`/`[S3]`).**

---

## 1. Repository facts (evidence)

| Attribute | Value | Source |
|---|---|---|
| Title | **GOV.SA Design System** | `README.md` |
| Package name / version | `gov.sa` / **0.0.1** | `package.json` |
| Description | "ui kit based on gov.sa design system guidlines" | `package.json` |
| Author / license | `ds-gov.sa` / **GPL-3.0** | `package.json` |
| Last code push | **2022-12-11** | GitHub API `pushed_at` |
| Primary language | HTML | GitHub API |
| CSS foundation | **Bootstrap 4.3.1** (+ jQuery 3.4.1, Popper.js) | `package.json`, `README.md` |
| Styling | **Sass/SCSS**, **BEM**, `.govsa-` prefix, mobile-first | `README.md` |
| Build system | **Webpack 4** + node-sass + postcss (+ `postcss-rtl`) | `package.json` |
| RTL approach | `postcss-rtl` (auto-flip at build) | `package.json` |

**GPL-3.0 note:** copyleft license — a compliance/legal consideration if any code were ever vendored. (We are not vendoring it.) Flagged in `QUESTIONS.md`.

---

## 2. Capability inventory (the requested checklist)

| Capability | Present? | Evidence / form | Platforms-Code relevance |
|---|---|---|---|
| **Design Tokens** | ⚠ Partial | As **SCSS `$variables`** only (per-component `variables.scss`). No abstract token system. | Not a token package; values are GOV.SA-generation. |
| **CSS Variables** (custom properties) | ❌ No token layer | `dist/css/govsa-ds.css` has no `--govsa-*` token variables; the `--x` hits are **BEM class modifiers** (`--secondary`, `--Filled`, `--colored`). | No consumable CSS-variable tokens. |
| **Typography** | ✅ Yes (legacy) | `src/typography/variables.scss`: **TheSans** family (`thesansplain, thesansb4_semilight, thesansb8_extrabold`), Arabic **Noto Naskh** (`noto_naskh_arabicbold`). Sizes h1 2.5rem…h6 1rem, base 1rem. | ❌ **Font conflict** — Platforms Code mandates **IBM Plex Sans Arabic** (`[S3: F5]`). **0** "IBM Plex" references in the repo. |
| **Color Palette** | ✅ Yes (legacy) | `src/scss/components/color/variables.scss`: primary `$green: #26634B`, secondary `$blue: #005A96`, success `#006604`, warning `#FFC107`, danger `#AF0818`, + tiffany/violet/darkBlue/gray families. | ⚠ GOV.SA colors; **not confirmed** equal to Platforms Code. Do not adopt. |
| **Spacing Tokens** | ⚠ Bootstrap scale | Inherits Bootstrap's rem spacing utilities; no dedicated spacing token file. | Platforms Code uses global spacing tokens (4/8/16…) `[S3: F8]` — different system. |
| **Border Radius** | ✅ Values present | card `8px`, input `8px`, button `3rem`/`3.6rem` (pill), `border-radius-sm: 2.4rem`. | ⚠ GOV.SA values; unverified vs Platforms Code. |
| **Elevation / Shadow** | ❌ Minimal | No shadow token set; card uses a border, not elevation. Bootstrap shadows only. | Platforms Code elevation unknown (Q3). |
| **Motion** | ❌ Minimal | No motion token set; relies on Bootstrap transitions. | Platforms Code motion unknown (Q3). |
| **Icons** | ✅ Yes (legacy) | Icon **font** (`dist/fonts/govsa.ttf/woff/eot/svg`) + colored SVGs (documents, form, payment, profile, regulations, setting, shop, statistics, storage) under `src/govsa-icons`. | ❌ Legacy icon set, **not** the Platforms Code official icon library (Q8). |
| **Storybook** | ❌ No | 0 `.storybook`, 0 `*.stories.*`. | — |
| **React Components** | ❌ No | 0 `.jsx`, 0 `.tsx`. Components are **SCSS + HTML + jQuery** (`src/packages/govsa-*.scss`). | ❌ Cannot be reused in our React app. |
| **Accessibility Utilities** | ❌ None distinct | No dedicated a11y module found; relies on Bootstrap markup conventions (`.sr-only`). | Our FADS a11y layer is more complete. |
| **Tailwind Configuration** | ❌ No | 0 tailwind config. | — |
| **SCSS Variables** | ✅ Yes | Extensive per-component `variables.scss` (the repo's real "token" surface). | Useful only as **implementation-pattern reference**. |
| **Build System** | ✅ Webpack 4 | `webpack.config.js`, `webpack.config.prod.js`, node-sass. | Different from our Vite/TS toolchain. |
| **Design Tokens JSON** | ❌ No | 0 token JSON files. | No machine-readable tokens to import. |
| **Style Dictionary** | ❌ No | 0 style-dictionary config. | — |
| **Figma Tokens** | ❌ No | 0 Figma token export. | Official tokens still require the Platforms Code Figma (Q20). |

### Summary
- **Real content:** SCSS variables, a color palette, a legacy type system (TheSans/Noto), a legacy icon font, and ~23 Bootstrap/jQuery components.
- **Absent:** token JSON, Style Dictionary, CSS-variable token layer, Tailwind, Storybook, React, Figma tokens, a11y utilities — i.e., **nothing that provides authoritative Platforms Code v1.0 tokens or reusable React components.**

---

## 3. Legacy values captured (REFERENCE ONLY — do not adopt)

Recorded for comparison; **not** to be copied into FADS (`LEGACY_REFERENCE_DECISION.md`).

**Colors** `[LEGACY: color/variables.scss]`
`green(primary) #26634B` · `green-shade #066058` · `green-tint #27AA8C` · `green-pastel #ACDDC7` · `green-dark #144D3F` · `blue(secondary) #005A96` · `darkBlue #160F3E` · `tiffany #0AEBD7` · `violet #5505CD` · `gray #323232` · `success #006604` · `info #339EEC` · `warning #FFC107` · `danger #AF0818` · `orange #FD7E14`.

**Typography** `[LEGACY: typography/variables.scss]`
Body `TheSans`; headings `thesansb8_extrabold`; Arabic headings + inputs `noto_naskh_arabicbold`. Scale: base 1rem, lg 1.25rem, sm .875rem; h1 2.5 / h2 2 / h3 1.75 / h4 1.5 / h5 1.25 / h6 1rem; `responsive-font-sizes: true`.

**Radius** `card 8px` · `input 8px` · `button 3rem / 3.6rem` · `border-radius-sm 2.4rem`.

> ⚠ Our current FADS placeholder primary is `#2f8f63`; the legacy repo's is `#26634B`. **Neither is a confirmed Platforms Code value.** This is exactly why placeholders stay until official tokens arrive (Q3).

---

## 4. Comparison against our documentation

| Our doc | Alignment with `[LEGACY]` | Note |
|---|---|---|
| `DGA_MASTER_SPECIFICATION.md` (Platforms Code v1.0, IBM Plex Sans Arabic) | ❌ Conflicts (font, architecture) | Legacy predates Platforms Code. |
| `DESIGN_TOKENS.md` (3-tier CSS-var tokens) | ❌ Different model | Legacy = SCSS `$vars`, no CSS-var tokens. |
| `DESIGN_SYSTEM_SPECIFICATION.md` (React/FADS, no Bootstrap) | ❌ Different stack | Legacy = Bootstrap+jQuery. |
| `COMPONENT_INVENTORY.md` (33 Platforms Code components, React) | ⚠ Partial overlap | Legacy has ~23 SCSS components; see `COMPONENT_GAP_ANALYSIS.md`. |
| `DESIGN_CONSTRAINTS.md` DC-07 (IBM Plex Sans Arabic only) | ❌ Legacy violates | Confirms non-adoption. |

**Recommendation:** follow the **official Platforms Code v1.0** approach in all our documentation. Use `[LEGACY]` only for structure/pattern/behavior reference and gap-spotting.

---

## 5. Permitted uses of this repository `[per client directive 2026-07-08]`
1. Historical **component structure** reference.
2. **Sass/CSS implementation patterns** (BEM, RTL-via-postcss approach).
3. Possible **component behavior** comparison.
4. **Gap identification** vs Platforms Code v1.0 (`COMPONENT_GAP_ANALYSIS.md`).

## 6. Prohibited uses
- ❌ Importing its tokens/colors/type as **final DGA values**.
- ❌ Copying SCSS values into FADS unless verified against official Platforms Code v1.0.
- ❌ Treating it as closing **Q3/Q20**.
- ❌ Adopting its font (TheSans), Bootstrap/jQuery stack, or icon font.

## 7. Outcome
The repository is a useful **historical/official-legacy reference** but adds **no authoritative Platforms Code v1.0 tokens or reusable React components**. Q3/Q20 remain **open**. FADS continues on **placeholder tokens**. Formal decision: `LEGACY_REFERENCE_DECISION.md`.
