# Open Questions — "Needs Confirmation"

> Per project rules, anything that **cannot be verified** from the references is recorded here instead of assumed `[PROJ: CLAUDE.md, SOURCES.md]`. Nothing in the planning package invents a DGA requirement; every gap below is explicit.
>
> **Two root causes** dominate this list:
> 1. The official site `https://design.dga.gov.sa/` `[S1]`, the Figma `[S2]`, and the Canva deck `[S4]` are **client-side-rendered / not machine-scrapable** — tooling retrieves only shell text. Exact token values live there and need a human with Figma access to export them.
> 2. The brief `content/hackathon.md` `[PROJ]` defines the hackathon's purpose but not all product/UX details.

Priority: 🔴 blocker (gates faithful build) · 🟠 shapes scope/structure · 🟡 nice-to-confirm.

---

## A. DGA design-token & spec gaps (from `[S1]/[S2]` being unscrapable)

| ID | Pri | Question | Impact | Needed from |
|---|---|---|---|---|
| **Q3** | 🔴 | Exact **color hex values** (primary/green, neutrals, background, text, success/error/warning/information, On-Color), **full spacing scale**, **type scale** (per Display/Text variant: size/weight/line-height), **breakpoint pixels**, **grid** (columns/margins/gutters), radius/elevation. | Blocks faithful Foundations; contrast can't be validated. | Official Figma export `[S2]` or `[S1]` inspected by a human |
| **Q6** | 🟠 | The **e-Participation template's 8 sections** — exact names, order, content. Also the **home-page** section list. | Gates landing structure (`INFORMATION_ARCHITECTURE.md §6`). | `[S1]` templates / `[S2]` |
| **Q8** | 🟡 | The **official icon inventory** (which named icons exist) for section/category/action icons. **Partially resolved 2026-07-09:** the official Platforms Code Figma icon file (`PC-1.0-Icons`) is machine-readable via the Figma MCP and holds 4,372 named icons across 60 categories; 49 icons across 4 pilot categories (Git, Shapes, Home, Community Icons) are imported into `src/design-system/primitives/Icon` — see `docs/ICON_LIBRARY.md` and `reports/ICON_IMPORT_REPORT.md`. Remaining 56 categories (~4,323 icons) are pending in resumable batches; still 🟡 until the full library is imported. | Icon selection; custom-icon approval path if missing `[S3: F12]`. | `[S1: iconography]` / `[S2]` |
| **Q20** | 🔴 | **Token acquisition route:** Figma variables export vs an official npm/CSS package vs manual transcription? | Decides token tooling & fidelity. | Client / DGA |

> **📌 Reaffirmed 2026-07-08 (GOV-SA legacy repo review):** The repository `GOV-SA/design-system-gov.sa` is the **legacy GOV.SA design system** (Bootstrap/jQuery/SCSS, TheSans font, no token JSON/Figma tokens) — **NOT** Platforms Code v1.0. It **does NOT close Q3 or Q20.** These remain 🔴 **OPEN** until official Platforms Code v1.0 values are obtained from the official Figma `[S2]`, website `[S1]`, or an official token package. See `LEGACY_REFERENCE_DECISION.md` and `TOKEN_SOURCE_STRATEGY.md`. Q8 (icons) is likewise **not** satisfied by the legacy icon font.

## B. Product scope & template

| ID | Pri | Question | Impact |
|---|---|---|---|
| **Q1** | 🟠 | Is the landing built on the **e-Participation template (8 sections)** or the **Home page template**? | Landing IA & compliance rows T1/T9 (DD-01). |
| **Q2** | 🟠 | Is there a **backend/API**, or is submission **mocked** for the hackathon demo? | Data layer, testing scope. |
| **Q4** | 🟠 | **Authentication model** — who can submit? SSO / Academy staff only / open? | Auth gates on Submit & Manage; WCAG 3.3.8. |
| **Q5** | 🟡 | Does the **Digital Stamp** apply here (is there certified content with a certificate number)? | Include/exclude CMP-32 (DD-12). |
| **Q10** | 🟡 | Is a **site-wide search** in scope? | Search page/template (T10), header search. |

## C. Flows & functionality

| ID | Pri | Question | Impact |
|---|---|---|---|
| **Q13** | 🟠 | Can applicants **edit/withdraw** a submission after sending? | Manage-Requests actions; Modal confirm. |
| **Q14** | 🟠 | Is an **evaluator/reviewer view** in scope, and is **evaluator feedback shown** to applicants? | P3 persona, request-detail content. |
| **Q15** | 🟡 | Is an **admin/CMS** surface in scope, or is content static? | Likely out of scope (`PROJECT_SCOPE.md §6`). |
| **Q16** | 🟡 | **Draft-save** during multi-step submission? | Form flow, message catalog. |

## D. Content & language

| ID | Pri | Question | Impact |
|---|---|---|---|
| **Q9** | 🟠 | **English scope** — full parity or partial? (DGA requires full content on switch if EN offered) `[S3: F16]`. | i18n effort, testing. |
| **Q11** | 🟠 | Actual **privacy policy / terms** text and required legal/consent copy. | Footer, submission consent `[S3: E14]`. |
| **Q12** | 🟠 | Exact **submission form field list** (beyond the 6 criteria) — e.g., department, contact, attachments rules. | Form spec, validation. |
| **Q17** | 🟡 | Hackathon **timeline / key dates**. | Timeline section. |
| **Q18** | 🟡 | Canonical term: **"ابتكار" vs "طلب"** (innovation vs request) for one concept `[S3: E15]`. | Terminology consistency. |
| **Q19** | 🟡 | **Status vocabulary** for requests (e.g., مُرسل/قيد المراجعة/مقبول/مرفوض). | Status Tags, detail timeline. |

## E. Engineering choices (team defaults, confirm)

| ID | Pri | Question | Impact |
|---|---|---|---|
| **Q7** | 🟠 | **IBM Plex Sans Arabic delivery** — self-host vs approved source? | Font loading, performance. |
| **Q21** | 🟡 | **i18n library** — react-i18next vs react-intl? | Implementation. |
| **Q22** | 🟡 | **Dark mode** wanted? (not a DGA requirement) | Theming scope. |
| **Q23** | 🟡 | **Storybook** (or other) for component-state review? | Tooling, QA. |

## F. Design System engineering choices (added with the FADS documentation, 2026-07-07)

> Raised by `DESIGN_SYSTEM_SPECIFICATION.md`, `REACT_ARCHITECTURE.md`, `STATE_MANAGEMENT.md`, `PERFORMANCE_STRATEGY.md`. These are **engineering decisions**, not DGA requirements — sensible defaults are proposed; confirm before implementation.

| ID | Pri | Question | Impact | Proposed default |
|---|---|---|---|---|
| **Q24** | 🟠 | **DS distribution model** — in-repo folder, monorepo workspaces, or internal published npm package? | Governs reuse across future products (`DESIGN_SYSTEM_SPECIFICATION.md §5`). | Monorepo workspaces (folder split now, publish later) |
| **Q25** | 🟡 | **DS release cadence / branching** strategy. | Versioning governance (§7). | SemVer + CHANGELOG per release |
| **Q26** | 🟡 | **Multi-product theming** within DGA limits — will other Academy products need brand variation? | Token theming scope (`DESIGN_TOKENS.md §6`). | Single DGA theme unless requested |
| **Q27** | 🟠 | **Server-state library** — TanStack Query vs plain fetch hooks? (gated by Q2) | Data fetching/caching (`STATE_MANAGEMENT.md §2`). | TanStack Query if backend confirmed |
| **Q28** | 🟡 | **Styling technology** — CSS Modules vs zero-runtime CSS-in-JS? | Perf + authoring (`PERFORMANCE_STRATEGY.md §5`). | Zero-runtime, token-driven, logical props |
| **Q29** | 🟡 | **Form + validation libraries** — React Hook Form + Zod/Yup? | Form architecture (`REACT_ARCHITECTURE.md §6`). | React Hook Form + Zod |
| **Q30** | 🟡 | **SSG/prerender** for the static landing later? | LCP/SEO (`PERFORMANCE_STRATEGY.md §2`). | SPA now; revisit SSG |
| **Q31** | 🟡 | **Field performance (RUM) tooling** for Core Web Vitals. | Production monitoring (`PERFORMANCE_STRATEGY.md §10`). | TBD |

## G. UI/UX specification questions (added with the UI blueprint, 2026-07-07)

> Raised by `COPYWRITING_GUIDELINES.md`. Content/localization detail — confirm with client.

| ID | Pri | Question | Impact | Proposed default |
|---|---|---|---|---|
| **Q32** | 🟡 | **Numeral convention** — Arabic-Indic (٠١٢٣) vs Western (0123) digits in Arabic UI? | Dates, counts, pagination, tables (`COPYWRITING_GUIDELINES.md §4`). | Follow DGA/Academy house style; confirm |

## H. Component-layer placeholder tokens (added with Phase 5 primitives, 2026-07-08)

> Raised while building the primitives. These are **engineering placeholder
> tokens** created because the base token taxonomy did not enumerate them; they
> need validation against the official DGA Platforms Code once available.

| ID | Pri | Question | Impact | Proposed default |
|---|---|---|---|---|
| **Q33** | 🟠 | Validate all **component-layer placeholder tokens** against official DGA values: Phase-5 interaction/disabled/form-field/control/border/elevation tokens **plus Phase-5A** container widths, icon sizes, selection-control geometry, overlay/scrim, surface, and table tokens (`DESIGN_TOKENS.md §10`). | Component visual fidelity. Bundled with Q3. | Confirm/replace when Q3 tokens land |

## I. Legacy reference (added 2026-07-08)

| ID | Pri | Question | Impact | Proposed default |
|---|---|---|---|---|
| **Q34** | 🟡 | Confirm the **GOV-SA legacy repo** stays **out of scope as a token/component source** (reference only), and note its **GPL-3.0** license precludes vendoring code. | Governs how the repo may be used (`LEGACY_REFERENCE_DECISION.md`). | Legacy reference only; do not vendor (decision recorded) |

> No new **blockers** were introduced by the UI/UX specification or the Phase-5
> component work. Every decision maps to an existing DGA rule or an already-logged
> question; components are buildable now, with final visual fidelity still gated by
> the pre-existing 🔴 Q3/Q20 (Q33 rides along with Q3).

---

## Resolution status
All items **OPEN** as of 2026-07-07. 🔴 blockers (**Q3, Q20**) must be resolved before Foundations can be built to final fidelity; 🟠 items should be resolved before or early in implementation. Q24–Q32 are engineering/content-choice items with proposed defaults and do **not** block the documentation. The package is structured so official values slot in without rework once provided.

**Question index:** Q1–Q23 (planning) + Q24–Q31 (design-system) + Q32 (UI/UX spec) + Q33 (component tokens) + Q34 (legacy repo scope) = **34 open items**.

**🔴 Blockers still open:** Q3 (official token values) and Q20 (acquisition route). The GOV-SA legacy repo did **not** close them (2026-07-08).
