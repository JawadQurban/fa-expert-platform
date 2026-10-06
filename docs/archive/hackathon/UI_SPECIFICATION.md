# UI Specification — Financial Academy Innovation Hackathon

> **Phase:** UI/UX Specification (blueprint). **No code, HTML, or CSS** — this is a build-ready specification `[PROJ: TASK.md]`.
> **Consumes:** FADS design system (`DESIGN_SYSTEM_SPECIFICATION.md`), tokens (`DESIGN_TOKENS.md`), components (`COMPONENT_INVENTORY.md`), constraints (`DESIGN_CONSTRAINTS.md`).
> **Granularity:** this document specifies **reusable sections/regions**. Whole-screen composition is in `SCREEN_SPECIFICATIONS.md`; grid math in `LAYOUT_SPECIFICATION.md`; behavior in `INTERACTION_SPECIFICATION.md`.
> **Conventions:** RTL-default (logical start = right). Spacing/type/color are referenced by **token name** (`sys.*`); exact values pending **Q3** (`DESIGN_TOKENS.md`). Breakpoints use the working ranges in `RESPONSIVE_STRATEGY.md §1` (mobile <768 / tablet 768–1023 / desktop ≥1024), non-authoritative pending Q3.

---

## 0. How to read a section spec
Each section below documents: **Purpose · Layout · Content · Components · Spacing · Responsive · Accessibility · States**. "Components" cite FADS IDs (`CMP-##`) and patterns (`PAT-##`). "Spacing" cites semantic tokens, never raw px.

---

## 1. Global App Shell (PAT-05) — present on every screen

### 1.1 Navigation Header (CMP-01)
- **Purpose:** Primary global navigation + persistent access to the two primary actions and language toggle.
- **Layout (RTL):** single horizontal bar. Logical start (right): Academy logo → primary nav links. Logical end (left): search (⚠Q10), language toggle (AR/EN), user menu/avatar (if auth ⚠Q4), primary CTA button «قدم ابتكارك».
- **Content:** logo (links home); nav items `الرئيسية · عن الهاكاثون · قدم ابتكارك · إدارة طلباتي · الأسئلة الشائعة`; language toggle; CTA.
- **Components:** CMP-01, Link CMP-06, Menu CMP-11, Avatar CMP-12, Button CMP-05, Search CMP-33 (cond.).
- **Spacing:** `sys.space.inset.*` for bar padding; `sys.space.inline.*` between items; bar height from header component token.
- **Responsive:** Desktop = full horizontal nav. Tablet = condensed (some links collapse). Mobile = logo + hamburger → **Nav Drawer (CMP-02)**; CTA remains visible (may become icon-labeled but never hidden — DC-14).
- **Accessibility:** `<header>` + `<nav aria-label>`; current item `aria-current="page"`; Selected state visible; keyboard-operable; focus visible (2.4.7); external links carry external-link icon (DC-28).
- **States:** link states Default/Hover/Pressed/Focus/Disabled/Selected `[S3: C20]`; sticky-on-scroll allowed but must not obscure focused elements (WCAG 2.4.11).

### 1.2 Nav Drawer (CMP-02) — mobile/tablet
- **Purpose:** Full navigation on small screens.
- **Layout:** off-canvas panel sliding from logical start (right in RTL); overlay scrim behind.
- **Content:** all header nav items + language toggle + CTA.
- **Components:** CMP-02, CMP-06, CMP-05.
- **Spacing:** `sys.space.inset.lg` panel padding; `sys.space.stack.md` between items.
- **Responsive:** shown < desktop; hidden ≥ desktop.
- **Accessibility:** focus trap while open, `Esc` closes, focus returns to toggle; `aria-expanded` on toggle; scrim click closes; drawer labelled.
- **States:** open / closed; item states as CMP-06.

### 1.3 Breadcrumbs (CMP-04) — all sub-pages (not landing)
- **Purpose:** Show position; support back-navigation; mirror sitemap `[S3: E12]`.
- **Layout:** single row directly under header, logical start aligned.
- **Content:** e.g. `الرئيسية / قدم ابتكارك`; last node = current page.
- **Components:** CMP-04, CMP-06.
- **Spacing:** `sys.space.inline.sm` around separators; `sys.space.stack.sm` below.
- **Responsive:** may truncate middle nodes on mobile (keep first + current).
- **Accessibility:** `<nav aria-label="مسار التنقل">`, ordered list, **current node `aria-current="page"` and non-interactive/Disabled** `[S3: C22]`; separators mirror in RTL (DC-25).
- **States:** Default/Hover/Pressed/Focus/Disabled (current = Disabled).

### 1.4 Footer (CMP-03)
- **Purpose:** Mandatory institutional links, contact, policies, logos `[S3: C21]`.
- **Layout (RTL):** multi-column grouped-link grid; bottom strip with logo + copyright + policy links.
- **Content groups:** روابط مهمة (Home/About/Submit/Manage) · الدعم والمساعدة (FAQ/Contact/Accessibility) · السياسات (Privacy/Terms) · Academy logo, contact info, official/social links.
- **Components:** CMP-03, CMP-06.
- **Spacing:** `sys.space.section-gap` above footer; `sys.space.stack.md` between groups/items; `sys.space.inset.lg` block padding.
- **Responsive:** Desktop 3–4 columns → Tablet 2 → Mobile 1 (groups stack; optionally collapsible).
- **Accessibility:** `<footer>` (contentinfo); each group a labelled list; links descriptive; contrast AA incl. On-Color if on colored bg (DC-06).
- **States:** link states per CMP-06.

### 1.5 Skip link (a11y)
- **Purpose:** Bypass header for keyboard/SR users (WCAG 2.4.1).
- **Layout:** visually hidden until focused, then appears at logical start-top.
- **Accessibility:** first focusable element; targets `#main`.

---

## 2. Landing sections (composed on the Landing screen)

> Section order (adopted plan, reconcile with Q1/Q6): Hero → About → Goals → Evaluation Criteria → How to Participate → Timeline → Partners(opt) → FAQ → Feedback → Footer. Rationale: participatory/info platform ⇒ info section first after hero `[S3: T3]`.

### 2.1 Hero
- **Purpose:** Communicate what the hackathon is and drive the two primary actions.
- **Layout:** full-width band; approved hero type (image / colored background / object) `[S3: T2]`. RTL: headline block at logical start; media/object at logical end (or full-bleed background).
- **Content:** H1 (hackathon name), one-line value proposition, primary CTA «قدم ابتكارك», secondary CTA «إدارة طلباتي». Optional eyebrow label.
- **Components:** Button CMP-05 (primary + secondary); optional Tag CMP-26 (eyebrow, neutral color); Featured icon only if >24px (DC-09).
- **Spacing:** generous `sys.space.inset.xl` block padding; `sys.space.stack.md` between headline/sub/CTAs; CTA gap `sys.space.inline.md`.
- **Responsive:** Desktop side-by-side text/media; Tablet reduced; Mobile stacked, single-column, primary CTA emphasized, secondary below.
- **Accessibility:** exactly one H1; CTAs are `<button>`/`<a>` with clear names; if text over image/color, use **On-Color tokens** + verified contrast (DC-06); background media `aria-hidden`/decorative alt.
- **States:** CTA states per CMP-05; no key element hidden behind motion (DC-14).

### 2.2 About / Introduction
- **Purpose:** Explain the hackathon (info-first section) `[S3: T3]`.
- **Layout:** centered/measure-limited prose block, optional supporting stat row.
- **Content:** short paragraph from `content/hackathon.md` `[PROJ]`; optional 2–3 stat highlights.
- **Components:** typography tokens; optional Card CMP-07 (informational, no CTA) for stats.
- **Spacing:** `sys.space.section-gap` above; text measure limited for readability.
- **Responsive:** single column all tiers; stats 3-col → 1-col.
- **Accessibility:** H2 section heading; reading measure ≤ ~70–80 chars for Arabic legibility.
- **States:** static.

### 2.3 Goals
- **Purpose:** Present the 6 strategic goals `[PROJ]`.
- **Layout:** heading + responsive list/card grid.
- **Content:** 6 goal items (from `CONTENT_STRUCTURE.md §3.3`).
- **Components:** Card CMP-07 (informational) or semantic `<ul>`; category icon (neutral color, DC-05).
- **Spacing:** grid gap `sys.space.inline.md` / `sys.space.stack.md`; `sys.space.section-gap` above.
- **Responsive:** Desktop 3-col → Tablet 2 → Mobile 1.
- **Accessibility:** H2 + list semantics; icons decorative (`aria-hidden`) with text label present.
- **States:** static (informational cards, CTA optional per `[S3: Card]`).

### 2.4 Evaluation Criteria
- **Purpose:** Communicate the 6 judging criteria; sets expectations for submission `[PROJ]`.
- **Layout:** heading + 6-card grid (`PAT-03` content grid).
- **Content:** 6 criteria cards (title + description) from `CONTENT_STRUCTURE.md §3.4`.
- **Components:** Card CMP-07 ×6 (informational); neutral category icon per card.
- **Spacing:** grid gap `sys.space.inline.md`; equal-height cards.
- **Responsive:** Desktop 3×2 → Tablet 2×3 → Mobile 1×6.
- **Accessibility:** H2 + each card H3; consistent card structure; icons decorative.
- **States:** Default; Hover/Focus only if cards are made actionable (they are informational by default → no hover elevation needed).

### 2.5 How to Participate (Steps overview)
- **Purpose:** Preview the submission process to reduce friction `[S3: E3]`.
- **Layout:** horizontal step sequence (desktop) / vertical (mobile).
- **Content:** 4 steps mirroring the submit flow: بيانات → المعايير → المستندات → المراجعة.
- **Components:** Steps CMP-21 (display/overview variant); Button CMP-05 «قدم ابتكارك».
- **Spacing:** `sys.space.inline.lg` between steps; `sys.space.section-gap` above.
- **Responsive:** horizontal → vertical stack on mobile.
- **Accessibility:** ordered list semantics; not a live progress here (informational).
- **States:** static display.

### 2.6 Timeline ⚠Q17
- **Purpose:** Key dates/milestones.
- **Layout:** vertical or horizontal timeline of dated milestones.
- **Content:** milestone label + date (⚠ dates pending Q17).
- **Components:** list/Card; Tag CMP-26 (neutral) for phase labels.
- **Spacing:** `sys.space.stack.md` between milestones.
- **Responsive:** horizontal (desktop) → vertical (mobile).
- **Accessibility:** ordered list; dates in `<time>`; localized numerals/dates (`CONTENT_MODEL.md §5`).
- **States:** optional past/current/upcoming styling using neutral/primary (not status colors, DC-05). ⚠ If "current phase" emphasis needed, use primary — not success/warning.

### 2.7 Partners / Sponsors (optional) `[S3: T4]`
- **Purpose:** Credibility; standardized partners section if content exists.
- **Layout:** logo grid/row.
- **Content:** partner logos (⚠ only if provided).
- **Components:** standardized partners section pattern; Image.
- **Spacing:** `sys.space.inline.lg` between logos.
- **Responsive:** wrap/scale; 5–6 across → 2–3 → grid on mobile.
- **Accessibility:** each logo `alt` = partner name; links external → external-link semantics.
- **States:** static.

### 2.8 FAQ (see §4.1 — reused shell)
### 2.9 Feedback (see §4.2 — reused shell)

---

## 3. Form & flow sections

### 3.1 Multi-step Submission block (PAT-01)
- **Purpose:** Capture an innovation across minimal steps `[S3: E3, T6]`.
- **Layout:** Steps indicator (top) + current step panel + step nav buttons (logical: «السابق» at start, «التالي»/«إرسال» at end).
- **Content:** per-step fields (`CONTENT_STRUCTURE.md §3.5`); service-template headings unchanged (الخطوات/الشروط/المستندات المطلوبة/بطاقة تفاصيل الخدمة) `[S3: T6]`.
- **Components:** Steps CMP-21 (live), Text Input CMP-13, Textarea CMP-14, Dropdown CMP-15, Radio CMP-16, Checkbox CMP-17, File Uploader CMP-20, Button CMP-05, Modal CMP-25, Notification CMP-22/23.
- **Spacing:** field vertical rhythm `sys.space.stack.md`; label→control `sys.space.stack.xs`; section `sys.space.section-gap`.
- **Responsive:** Desktop comfortable measure (single column form recommended for clarity); Mobile full-width, labels above controls; Steps indicator horizontal→compact/vertical.
- **Accessibility:** each field labelled (`<label for>`); required marked in text + `aria-required`; errors via `aria-describedby` + `role="alert"` region; step change announced; focus moves to step heading on navigation; upload status `aria-live` (4.1.3).
- **States (per field):** Default/Hover/Pressed/Focus/Read-only/Disabled; error state with message; (upload) Default/Drag+Hover/Uploading/Completed/Failed/Disabled `[S3: C10]`.
- **Flow states:** step in-progress, validating, submitting (loading), submitted (success), error. Full flow in `INTERACTION_SPECIFICATION.md §8`.

### 3.2 Review & Consent block (Submit Step 4)
- **Purpose:** Let user verify before sending; capture consent `[S3: E14]`.
- **Layout:** read-only **Service Details Card** summary + consent Checkbox + submit.
- **Components:** Card CMP-07 (details), Checkbox CMP-17, Button CMP-05, Modal CMP-25 (confirm).
- **Spacing:** `sys.space.stack.md` between summary groups.
- **Accessibility:** summary is readable text (not disabled inputs); consent checkbox required; confirm Modal traps focus.
- **States:** consent unchecked (submit disabled) / checked (enabled); submit → confirm Modal → success.

### 3.3 Entity List + Filter block (PAT-02) — Manage Requests
- **Purpose:** List/track submissions with filtering `[S3: E17]`.
- **Layout:** filter bar (top) + Table (desktop) / Card list (mobile) + Pagination.
- **Content:** columns العنوان · التصنيف(Tag neutral) · الحالة(Tag status) · التاريخ · إجراءات(«عرض»).
- **Components:** Dropdown CMP-15 (filters), Tag CMP-26, Table CMP-27, Card CMP-07 (mobile fallback), Pagination CMP-28, Link/Button.
- **Spacing:** filter gap `sys.space.inline.md`; row padding via table token; `sys.space.stack.md` between cards on mobile.
- **Responsive:** Desktop table; Tablet condensed/scroll-in-container; Mobile → stacked cards (one per request).
- **Accessibility:** `<table>` with `<th scope>` + caption; status Tags have text (not color-only, 1.4.1); filters labelled; pagination `<nav>` + `aria-current`.
- **States:** loading (skeleton/Loading CMP-31), empty («لا توجد طلبات» + CTA), error (Inline Alert + retry), populated.

### 3.4 Request Detail block
- **Purpose:** Full read-only view of one submission + actions.
- **Layout:** Service Details Card header (title/category/status/date) → status timeline → submission content → evaluator feedback (⚠Q14) → actions.
- **Components:** Card CMP-07, Tag CMP-26, Steps/timeline, Button CMP-05, Modal CMP-25 (withdraw ⚠Q13).
- **Spacing:** `sys.space.section-gap` between blocks.
- **Accessibility:** headings hierarchy; status conveyed by text + Tag; withdraw confirmation Modal.
- **States:** loading, loaded, not-found (→ 404 pattern), action-in-progress.

---

## 4. Support sections

### 4.1 FAQ block
- **Purpose:** Answer common questions; reduce support load `[S3: E4]`.
- **Layout:** heading + Accordion list.
- **Components:** Accordion CMP-08.
- **Spacing:** `sys.space.stack.sm` between items.
- **Responsive:** full width all tiers.
- **Accessibility:** each header a `<button aria-expanded>` controlling a region; only content toggles (headers always visible, DC-14).
- **States:** Expanded/Collapsed; Default/Hover/Pressed/Focus/Disabled `[S3: C5]`.

### 4.2 Feedback block (PAT-04)
- **Purpose:** Standardized feedback + confirmation `[S3: T7, T8, E13]`.
- **Layout:** Rating + optional Textarea + submit; confirmation replaces/announces on success.
- **Components:** Rating CMP-29, Textarea CMP-14, Button CMP-05, Notification CMP-22.
- **Spacing:** `sys.space.stack.md`.
- **Accessibility:** rating keyboard-operable + labelled; confirmation `aria-live`.
- **States:** empty, filled, submitting, success (confirmation), error.

### 4.3 Static content block (Privacy / Terms / Accessibility statement)
- **Purpose:** Legal/institutional content `[S3: E14]`.
- **Layout:** single-column long-form prose, optional in-page anchor nav.
- **Components:** typography tokens, Link CMP-06, optional Accordion for long sections.
- **Spacing:** `sys.space.stack.md` between blocks; limited measure.
- **Accessibility:** proper heading outline; anchor links; `lang` on foreign fragments.
- **States:** static.

### 4.4 Search Results block (conditional ⚠Q10)
- **Purpose:** Find content across the platform `[S3: T10]`.
- **Layout:** search bar (present on results page) + filters + categorized results + pagination.
- **Components:** Search CMP-33, Dropdown CMP-15 (type/date filters), Tag CMP-26, Pagination CMP-28.
- **Accessibility:** `role="search"`; result count announced; filters labelled.
- **States:** no-query, results, no-results, loading, error.

### 4.5 Empty / 404 / error block
- **Purpose:** Graceful dead-ends.
- **Layout:** centered Featured icon (>24px, DC-09) + message + primary CTA «العودة للرئيسية».
- **Components:** Featured icon, Button CMP-05.
- **Accessibility:** H1 describing the state; focus moved to heading.
- **States:** 404, generic error, empty-collection variants.

---

## 5. Cross-section rules (apply everywhere)
- **Tokens only** — no raw values (DC-03); spacing via `sys.space.*`; color via `sys.color.*`; type via `sys.typography.*`.
- **Status vs neutral color** — status colors reserved for status Tags/alerts only (DC-05).
- **RTL** — logical properties; mirrored directional icons (DC-23/25).
- **One H1 per screen**; logical heading order.
- **Every interactive element** has a visible Focus state (DC-27) and ≥24px (aim 44px touch) target (`RESPONSIVE_STRATEGY.md §3`).
- **Loading/empty/error** states are mandatory for every data-backed section (see per-section States).

## 6. Open items referenced
Q1/Q6 (section structure), Q3 (token values), Q10 (search), Q12–Q19 (content specifics), Q4/Q13/Q14/Q16 (flows). Full list `QUESTIONS.md`. None block writing this spec; they refine final values/scope.
