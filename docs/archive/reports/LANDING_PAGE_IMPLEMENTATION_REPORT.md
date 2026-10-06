# Hackathon Landing Page — Implementation Report (Phase 6)

> **Prepared by:** Principal Frontend Engineer
> **Date:** 2026-07-08
> **Scope:** ONE page — the Hackathon landing page. No backend, auth, Submit/Manage/Request/Admin/Evaluator screens.
> **Consumes:** FADS as approved for this scope in Phase 5.6 (`reports/DESIGN_SYSTEM_HARDENING_REPORT.md`, `docs/PROJECT_STATUS.md`).

---

## 1. Summary

Built the Hackathon landing page (`frontend/src/pages/HomePage.tsx`), replacing the `FoundationHome` placeholder at route `/`. The page composes **only existing FADS components** — no new design-system components were created. All copy, CTA labels, and CTA destinations are centralized in `frontend/src/content/hackathon.ts`, per the explicit instruction to keep future content edits out of the React layer.

Verified green: `typecheck`, `lint` (incl. `lint:css`), `format:check`, `test` (**196 passing**, 42 files), `tokens:validate`, `build`, `build-storybook`.

## 2. Sections implemented (exactly 7, per scope)

| # | Section | Implementation |
|---|---|---|
| 1 | Header | `@ds/shell` `Header` — in-page nav to About/Objectives/Criteria (`#about`, `#objectives`, `#criteria`), brand text in `actions` (not a heading — see §4). |
| 2 | Hero | `Section` + `Container` + `Typography` (single page `<h1>`) + description + two `Button` CTAs. |
| 3 | About the Hackathon | `Section background="subtle"` + `Container size="prose"`; restates the official paragraph and pulls 3 verbatim phrases from it into a highlight list — no invented content (see §5). |
| 4 | Objectives | 6 `Card`s (title = ordinal label, description = verbatim objective text) in a responsive `<ul>` grid. |
| 5 | Evaluation Criteria | 6 `Card`s in a responsive `<ol>` grid (ordered list — the criteria are numbered 1–6 in the source, so list order is meaningful). |
| 6 | Final CTA | Repeats the hero's two CTAs with a closing headline built entirely from verbatim source text (see §5). |
| 7 | Footer | `@ds/shell` `Footer` — link list (Privacy/Terms/Accessibility, existing `paths.ts` routes) + a one-line footer note. |

No Timeline/Partners/FAQ/How-to-Participate/Feedback sections were built — they are not in the 7-section list this phase authorized, and the Feedback section in particular would need the still-unbuilt Rating (CMP-29) component.

## 3. Components used (all pre-existing, none new)

`Header`, `Footer` (shell) · `Card` (composite) · `Container`, `Section` (layout) · `Typography`, `Button` (primitives). `Link` was evaluated for the CTAs but not used — see §6 for why, and the trade-off it created.

## 4. Content centralization

`frontend/src/content/hackathon.ts` exports `getHackathonContent(locale)`, returning a fully-typed `HackathonContent` object (hero, about, objectives, criteria, finalCta, header/footer nav, CTA hrefs). `HomePage.tsx` contains **zero copy literals** — every string, heading, and CTA target is read from this file. Editing wording, reordering objectives/criteria, or repointing a CTA to a real backend URL never requires touching the component.

Arabic is the **official** copy, transcribed verbatim from the brief (objectives, criteria, hero paragraph, CTA labels — no wording changes). English is a **best-effort translation** for the app's existing AR⇄EN locale toggle; it has not been through official review and should be treated as a working draft, not approved copy (flagged here per `DC-24`/`QUESTIONS.md` conventions — needs confirmation before shipping bilingually).

**Heading hierarchy note:** `Header`'s own `title` prop always renders an `<h2>` (`Header.tsx:47`), which would land *before* the page's `<h1>` in document order if used. To keep a single, first, top-level heading (SEO + WCAG 1.3.1), the brand name is passed via `Header`'s `actions` slot (a plain `<span>`, not a heading) instead of `title`.

## 5. Content decisions beyond the verbatim brief

Two structural requirements (STEP 4's "About" and "Final CTA" sections) had no separate copy in the brief — only the Hero paragraph and the two CTA labels were given as official text. To avoid inventing new business claims:

- **About** reuses the Hero paragraph verbatim as its body, and lifts three already-present phrases from that same sentence into a highlight list (`تعزيز ثقافة الابتكار المؤسسي`, `حلول عملية للتحديات المؤسسية`, `نتائج قابلة للقياس من الفكرة إلى التطبيق`) — restructuring, not rewriting.
- **Final CTA** heading reuses the primary CTA label itself (`قدم ابتكارك`) and its supporting line is the literal closing clause of the Hero paragraph (`خطة واضحة تضمن انتقال الحلول من الفكرة إلى التطبيق`).

Both are 100% verbatim substrings of the official text, restructured under "You may improve structure, readability, hierarchy, and presentation while preserving intent." Flagging this explicitly since it's an interpretive call, not a literal instruction match.

Objective card titles ("الهدف الأول" … "الهدف السادس") and numeral style follow the numbering convention already present in the source brief (Western digits, e.g. "1. وضوح الفكرة") rather than inventing an Arabic-Indic alternative — `QUESTIONS.md` Q32 (numeral convention) is still open project-wide; this page just doesn't introduce a second, conflicting convention.

## 6. CTA implementation — a documented trade-off

Both primitives available for navigation have a gap for this use case:
- `Button` (`@ds/primitives/Button`) is a real `<button>` with no anchor mode — correct prominence, wrong semantics for navigation.
- `Link` (`@ds/primitives/Link`) is a real `<a>` but has one, deliberately understated, text-link visual treatment — correct semantics, wrong prominence for a hero CTA.

Per this phase's constraint ("don't create new Design System components unless absolutely necessary"), CTAs are implemented as `Button` with an `onClick` that calls `window.location.assign(href)`, where `href` comes from `content/hackathon.ts` (`/submit`, `/requests` — both already reserved in `paths.ts`). This satisfies "configurable URLs or props," "no routing logic" (no React Router APIs touched), and is trivially replaced by the team building Submit/Manage. **Known limitation:** this is not a crawlable `<a href>`, so it doesn't fully satisfy "SEO-friendly" for the CTAs specifically (the rest of the page — heading hierarchy, landmarks, `<title>`/meta description — is). Given Submit/Manage don't exist yet regardless, the crawlability gap is low-value today; recommend introducing an anchor-capable CTA treatment in a future FADS iteration if this becomes load-bearing.

## 7. Accessibility

- Single `<h1>` (Hero) → `<h2>` per section → `<h3>` per card (Card's own semantics) — no skipped levels.
- Every `<Section>` has `aria-labelledby` pointing at its own heading, naming the landmark for assistive tech.
- Objectives/Criteria are real `<ul>`/`<ol>` lists (`aria-label`'d) — screen readers announce set size ("list, 6 items"); criteria specifically use `<ol>` since the source numbers them 1–6.
- Skip link + `<main>` landmark unchanged (`RootLayout`, untouched this phase).
- `expectNoA11yViolations` (axe-core, structural rules — color-contrast disabled per project-wide policy pending Q3/Q20 final token values) passes in `HomePage.test.tsx`.
- Focus-visible ring, disabled/hover/pressed states, and keyboard operability all come for free from the underlying `Button`/`Card`/`Header`/`Footer` components — unchanged by this work.

## 8. Responsive behavior

- `Container` caps width via existing tokens (`--fads-sys-container-page` / `-prose`); no new breakpoint values invented.
- The Objectives/Criteria grids use `grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr))` — reflows from 1 column on narrow viewports up to N columns on wide ones without a hand-authored breakpoint list. **Known gap:** the token system has no `--fads-sys-grid-*`/breakpoint tokens yet (consistent with `Container`/`Section`'s existing "Pending final DGA token values" placeholder status); the `16rem` minimum column width is therefore a plain CSS value, not a token, and is the one deliberate exception to "token-only" in this page's CSS.
- Header/Footer nav already wrap via flexbox (`Header.module.css`/`Footer.module.css`, unchanged) — no additional work needed for narrow viewports.

## 9. Outstanding limitations / needs confirmation

1. English copy in `content/hackathon.ts` is a working translation, not officially reviewed text.
2. CTA buttons navigate via `window.location.assign`, not a real `<a href>` (§6) — revisit once Submit/Manage exist.
3. No `--fads-sys-grid-*`/breakpoint tokens exist yet; the card-grid minimum width is a hand-picked value (§8).
4. `QUESTIONS.md` Q32 (Arabic-Indic vs. Western numerals) is still open; this page follows the source brief's own Western-numeral convention rather than resolving Q32 project-wide.
5. Per STOP CONDITION: no other pages, backend, or auth were implemented or wired. `paths.ts` already reserves `/submit` and `/requests`; those routes are not registered in `routes.tsx` (only `/` and `*` are), by design.

## 10. Files changed

- `frontend/src/content/hackathon.ts` (new) — content config.
- `frontend/src/pages/HomePage.tsx` (new), `HomePage.module.css` (new), `HomePage.test.tsx` (new, 6 tests).
- `frontend/src/pages/FoundationHome.tsx` (removed — superseded).
- `frontend/src/app/router/routes.tsx` — index route now renders `HomePage`.
- `frontend/src/app/router/router.test.tsx` — updated test name/timeout for the heavier real page.
- `frontend/src/i18n/resources/{ar,en}/common.json` — removed the now-unused `foundation.*` placeholder keys.
- `frontend/index.html` — `<title>` and meta description updated to the Hackathon page.
