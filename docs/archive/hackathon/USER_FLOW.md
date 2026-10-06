# User Flows — Financial Academy Innovation Hackathon

> Text-only flows (no UI). Built from personas (`USER_PERSONAS.md`), the two required actions `[PROJ]`, and DGA Experience criteria (minimal steps, predictable UI, consistent feedback, confirmation) `[S3: E3,E6,E9,E13]`.
>
> Flows read **right-to-left in the UI** (RTL) `[S3]`; the arrows below are logical sequence, not visual direction.

---

## Flow 1 — Discover the hackathon (P1/P2)

```
Entry (link / direct URL)
  → Landing page (hero: hackathon name + primary CTA "قدم ابتكارك")
  → Scroll: About → Goals → Evaluation Criteria (6) → Timeline → FAQ → Feedback
  → Decision:
        • "قدم ابتكارك"  → Flow 2 (Submit)
        • "إدارة طلباتي" → Flow 3 (Manage)
        • FAQ/Help        → Flow 5 (Help)
```
DGA hooks: hero one approved type `[S3: T2]`; first section after hero matches platform type `[S3: T3]`; clear visual hierarchy `[S3: E1]`.

---

## Flow 2 — Submit Your Innovation (قدم ابتكارك) — PRIMARY

Uses the **service/form template** + **Steps** component. Target: minimal steps `[S3: E3, C30]`.

```
Start "قدم ابتكارك"
  → [Auth gate?] ⚠ Q4  → (if required) sign in
  → Step 1 — Idea basics:
        title, category (Dropdown), problem statement (Textarea),
        proposed solution (Textarea)
  → Step 2 — Alignment with judging criteria (the 6):
        clarity, Academy impact, feasibility, financial value/efficiency,
        innovation level, scalability/sustainability   [PROJ]
  → Step 3 — Supporting documents:
        File Uploader (name/status/remove; error on size/type/fail)  [S3: C10]
  → Step 4 — Review & consent:
        summary (read-only) + privacy/consent checkbox  [S3: E14, C12]
  → Submit action:
        • Confirmation Modal ("تأكيد الإرسال؟")  [S3: C9]
        • On confirm → success Notification/Toast ("تم إرسال ابتكارك بنجاح")  [S3: C8, E13]
        • → redirect to Manage My Requests (Flow 3)
  Error paths at each step:
        • Inline field validation, consistent style/placement  [S3: E16]
        • Blocking errors surfaced as Inline Alert  [S3: C8]
        • Draft-save behavior ⚠ Q16
```
DGA hooks: service-page terms/headings unchanged (Steps/Requirements/Required Documents) `[S3: T6]`; Modal not used for bulk data entry `[S3: C9]`; confirmation after submit `[S3: E13]`.

---

## Flow 3 — Manage My Requests (إدارة طلباتي) — PRIMARY

```
Start "إدارة طلباتي"
  → [Auth gate?] ⚠ Q4
  → Requests list (Table/Cards):
        columns: title | category (Tag) | status (Tag) | date | actions
        filters: status / category / date  [S3: E17]
        pagination if long  [S3: C28]
  → Select a request → Detail view:
        full submission (read-only), status timeline, evaluator feedback (if any) ⚠ Q14
        actions: edit / withdraw (if allowed) ⚠ Q13
  → Empty state:
        "لا توجد طلبات بعد" + CTA "قدم ابتكارك" → Flow 2
```
DGA hooks: status via Tags (status colors) `[S3: C18, F3]`; predictable UI `[S3: E6]`; consistent feedback `[S3: E9]`.

---

## Flow 4 — Provide feedback / rating (P1/P2)

```
Feedback section (landing or post-submission)
  → Rating component (stars) + optional Textarea  [S3: C24, T7, T8]
  → Submit → confirmation message  [S3: E13]
```

## Flow 5 — Get help (all personas)

```
Any page
  → Header/Footer help link OR FAQ Accordion  [S3: C5]
  → FAQ expand/collapse; contact info in footer  [S3: C21]
```

## Flow 6 — Switch language (AR ⇄ EN)

```
Header language toggle
  → Entire content switches, no loss of info  [S3: F16]
  → Direction flips RTL⇄LTR appropriately
```
⚠ **Q9:** Full English parity vs partial.

## Flow 7 — Search (conditional) ⚠ Q10

```
Header search → results page (search bar present)
  → results categorized + filters (type/date)  [S3: T10, E17]
```

---

## Cross-flow rules (apply to all)

- **Minimal steps** for common tasks `[S3: E3]`.
- **Consistent feedback** style & timing on every action `[S3: E9]`.
- **Consistent error handling** — same visual style/placement per context `[S3: E16]`.
- **Breadcrumbs** reflect position; current page non-interactive `[S3: C22]`.
- **Predictable navigation**; no key element hidden behind motion `[S3: E6, E10]`.
- Every interactive step exposes **Focused** state for keyboard users `[S3]` (WCAG 2.2 AA).

## Open questions surfaced by flows
Q4 (auth), Q9 (EN scope), Q10 (search), Q13 (edit/withdraw), Q14 (evaluator feedback visible), Q16 (draft save). See `QUESTIONS.md`.
