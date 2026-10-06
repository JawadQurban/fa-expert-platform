# Screen Specifications — Financial Academy Innovation Hackathon

> Whole-screen blueprints. Each screen **composes** reusable sections defined in `UI_SPECIFICATION.md` (referenced as *UI §x*) and follows layout from `LAYOUT_SPECIFICATION.md`, behavior from `INTERACTION_SPECIFICATION.md`.
> **RTL-default; Arabic-first.** Tokens by name (values ⚠Q3). Routes from `INFORMATION_ARCHITECTURE.md §5`.
> Every screen includes the **App Shell** (Header UI §1.1 / Drawer §1.2 / Footer §1.4 / Skip link §1.5) unless noted.

Per-screen template: **Purpose · Layout · Navigation · Components · Interactions · Empty · Loading · Error · Responsive · Accessibility**.

---

## SCR-01 — Landing Page  `/`
- **Purpose:** Introduce the hackathon and drive «قدم ابتكارك» / «إدارة طلباتي».
- **Layout (top→bottom):** Hero (UI §2.1) → About (§2.2) → Goals (§2.3) → Evaluation Criteria (§2.4) → How to Participate (§2.5) → Timeline (§2.6) → Partners opt (§2.7) → FAQ (§4.1) → Feedback (§4.2) → Footer. No breadcrumb on landing.
- **Navigation:** Header nav; hero CTAs deep-link to `/submit` and `/requests`; in-page anchor scroll to sections; footer links.
- **Components:** CMP-01/02/03/05/06/07/08/21/26/29 + Featured icon; patterns PAT-03, PAT-04, PAT-05.
- **Interactions:** CTA hover/focus/press; anchor smooth-scroll (respect reduced-motion); FAQ expand/collapse; feedback submit → confirmation. (Details `INTERACTION_SPECIFICATION.md`.)
- **Empty:** Partners/Timeline hidden if no content (⚠Q17); page never shows empty shell.
- **Loading:** If any section is data-backed (e.g., dynamic FAQ), show section-level skeleton (CMP-31); hero/static render immediately.
- **Error:** Section-level Inline Alert (CMP-23) if a data section fails; rest of page still usable.
- **Responsive:** grids reflow 3→2→1; hero stacks; header→drawer on mobile.
- **Accessibility:** one H1 (hero); H2 per section; landmark regions; skip link; anchor targets focusable.

## SCR-02 — Submit Innovation  `/submit`
- **Purpose:** Submit an innovation via the multi-step form (PAT-01).
- **Layout:** Breadcrumb `الرئيسية / قدم ابتكارك` → Steps indicator → current step panel → step nav. Steps: ①بيانات ②المعايير ③المستندات ④المراجعة (UI §3.1–3.2).
- **Navigation:** «التالي»/«السابق»; leaving with unsaved data prompts (⚠Q16 draft); on success → redirect `/requests`.
- **Components:** CMP-21/13/14/15/16/17/20/05/25/22/23/07; PAT-01.
- **Interactions:** inline validation on blur + on next; upload with progress; final confirm Modal → success Toast (full flow `INTERACTION_SPECIFICATION.md §8`).
- **Empty:** Step 3 uploads empty = allowed (attachments optional ⚠Q12) with helper text; empty required fields block progression.
- **Loading:** submit → button loading + disabled; upload → per-file Uploading state.
- **Error:** field-level errors (consistent placement, DC-33); upload errors (type/size/fail) `[S3: C10]`; submit failure → Inline Alert with retry, form data preserved.
- **Responsive:** single-column form all tiers; Steps horizontal→compact; sticky step-nav on mobile bottom (must not obscure focus, 2.4.11).
- **Accessibility:** step announced on change; focus to step heading; required + error wiring (`aria-describedby`, `role=alert`); auth gate if required (⚠Q4, WCAG 3.3.8).

## SCR-03 — Manage Requests  `/requests`
- **Purpose:** View/track all submissions (PAT-02).
- **Layout:** Breadcrumb `الرئيسية / إدارة طلباتي` → filter bar → Table/Card list → Pagination (UI §3.3).
- **Navigation:** row/card «عرض» → `/requests/:id`; filters update URL query (`STATE_MANAGEMENT.md §5`); empty CTA → `/submit`.
- **Components:** CMP-15/26/27/07/28/31/23/05.
- **Interactions:** filter (status/category/date), sort (⚠ if in scope), paginate; hover row highlight; keyboard row navigation.
- **Empty:** «لا توجد طلبات بعد» + Featured icon + «قدم ابتكارك».
- **Loading:** table skeleton / Loading (CMP-31).
- **Error:** Inline Alert + «إعادة المحاولة»; preserves filters.
- **Responsive:** Desktop table → Tablet scroll-in-container → Mobile stacked cards.
- **Accessibility:** table semantics (`th scope`, caption); status by text+Tag (not color-only); filters labelled; pagination nav; auth gate (⚠Q4).

## SCR-04 — Request Details  `/requests/:id`
- **Purpose:** Full read-only submission view + actions (UI §3.4).
- **Layout:** Breadcrumb `… / تفاصيل الطلب` → Details Card (title/category/status/date) → status timeline → submission content → evaluator feedback (⚠Q14) → actions.
- **Navigation:** back to list; «تعديل»/«سحب» (⚠Q13) → confirm Modal.
- **Components:** CMP-07/26/21/05/25/23.
- **Interactions:** withdraw → confirm Modal → success Toast → status update; edit → returns to form prefilled (⚠Q13).
- **Empty:** no evaluator feedback yet → neutral "لا توجد ملاحظات بعد" (not an error).
- **Loading:** detail skeleton.
- **Error:** invalid/unknown id → 404 (SCR-07); load failure → Inline Alert + retry.
- **Responsive:** single column; Details Card full width; timeline horizontal→vertical.
- **Accessibility:** heading outline; status text; action confirmations; focus management on Modal.

## SCR-05 — FAQ  `/faq`
- **Purpose:** Standalone FAQ (also embedded on landing).
- **Layout:** Breadcrumb → H1 → Accordion list (UI §4.1). Optional category filter/tabs if many items.
- **Navigation:** deep-link to a specific question via anchor.
- **Components:** CMP-08, optional CMP-09 (tabs) / CMP-33 (search within FAQ, opt).
- **Interactions:** expand/collapse; anchor auto-expands target.
- **Empty:** if no FAQs configured → hide page or show "سيتم إضافة الأسئلة قريبًا" (⚠ content Q).
- **Loading:** skeleton rows if data-backed.
- **Error:** Inline Alert.
- **Responsive:** full-width single column.
- **Accessibility:** accordion `aria-expanded`/region; headings; keyboard operable.

## SCR-06 — Feedback  `/feedback`
- **Purpose:** Standalone feedback/rating (also embedded on landing) (UI §4.2, PAT-04).
- **Layout:** Breadcrumb → H1 → Rating + Textarea + submit.
- **Navigation:** on success, confirmation + link back home.
- **Components:** CMP-29/14/05/22.
- **Interactions:** select rating (keyboard/click), optional comment, submit → confirmation `[S3: E13]`.
- **Empty:** submit disabled until a rating chosen.
- **Loading:** submit button loading.
- **Error:** Inline Alert; input preserved.
- **Responsive:** single column, comfortable measure.
- **Accessibility:** rating labelled + keyboard; confirmation `aria-live`.

## SCR-07 — 404 / Not Found  `*`
- **Purpose:** Graceful dead-end (UI §4.5).
- **Layout:** centered Featured icon + H1 «الصفحة غير موجودة» + supportive line + «العودة للرئيسية».
- **Navigation:** home CTA; header still present.
- **Components:** Featured icon, Button CMP-05.
- **Interactions:** CTA to `/`.
- **Empty/Loading/Error:** n/a (terminal state).
- **Responsive:** centered, single column.
- **Accessibility:** focus to H1 on mount; `<main>`; meaningful title.

## SCR-08 — Privacy Policy  `/privacy`
- **Purpose:** Privacy notice (required `[S3: E14]`).
- **Layout:** Breadcrumb → H1 → long-form content (UI §4.3) + optional anchor nav.
- **Navigation:** linked from footer + submission consent.
- **Components:** typography, Link, optional Accordion.
- **Interactions:** anchor jumps.
- **Empty/Loading/Error:** content is static/bundled; if CMS-backed (⚠Q15) add loading/error.
- **Responsive:** single column, limited measure.
- **Accessibility:** heading outline; readable measure; `lang` on foreign terms.
- **Content:** ⚠Q11 (actual policy text).

## SCR-09 — Terms & Conditions  `/terms`
- Same spec as SCR-08 with terms content. ⚠Q11.

## SCR-10 — Accessibility Statement  `/accessibility`
- **Purpose:** Declare WCAG 2.2 AA conformance + contact for issues (good practice + `[S3]` transparency).
- **Layout:** Breadcrumb → H1 → conformance statement, known limitations, feedback contact.
- **Components:** typography, Link CMP-06.
- **Interactions:** contact link.
- **Responsive/Accessibility:** exemplary — this page is a showcase of the a11y baseline.
- **Content:** references `ACCESSIBILITY_CHECKLIST.md` conformance.

## SCR-11 — Search Results  `/search` (conditional ⚠Q10)
- **Purpose:** Cross-platform search `[S3: T10]` (UI §4.4).
- **Layout:** Breadcrumb → search bar (present on results) → filters (type/date) → categorized results → Pagination.
- **Navigation:** query in URL; result → target page.
- **Components:** CMP-33/15/26/28/31/23.
- **Interactions:** submit query, filter, paginate; debounce (`INTERACTION_SPECIFICATION.md`).
- **Empty:** no-query prompt; no-results "لا توجد نتائج مطابقة" + suggestions.
- **Loading:** results skeleton.
- **Error:** Inline Alert + retry.
- **Responsive:** results list reflow; filters collapse into drawer/expander on mobile.
- **Accessibility:** `role=search`; result count announced (`aria-live`); filters labelled.

---

## Screen → primary flow map
| Screen | Flow (`USER_FLOW.md`) |
|---|---|
| SCR-01 | F1 Discover |
| SCR-02 | F2 Submit |
| SCR-03/04 | F3 Manage |
| SCR-06 | F4 Feedback |
| SCR-05 | F5 Help |
| Header | F6 Language, F7 Search |

## Global state coverage checklist (every data-backed screen)
- [ ] Loading state (skeleton/Loading CMP-31)
- [ ] Empty state (icon + message + CTA)
- [ ] Error state (Inline Alert CMP-23 + retry, data preserved)
- [ ] Success feedback (Toast CMP-22 / confirmation) `[S3: E13]`
- [ ] RTL + responsive verified at all tiers
- [ ] Keyboard + SR pass (`ACCESSIBILITY_CHECKLIST.md`)

## Open items
Q4 (auth on SCR-02/03/04), Q10 (SCR-11), Q11 (SCR-08/09), Q12–Q19 (content), Q13/Q14/Q16 (flows). See `QUESTIONS.md`.
