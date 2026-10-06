# Design Decisions Log (ADR-style)

> Each decision records: context, decision, DGA source, alternatives, and status. Decisions marked **Provisional** depend on a `QUESTIONS.md` item. **No DGA requirement is invented** `[PROJ: CLAUDE.md]`.

---

### DD-01 — Primary template = e-Participation (provisional)
- **Context:** Platform invites employees to contribute innovation ideas — a participatory model with submit + manage actions `[PROJ]`.
- **Decision:** Base the landing on the **e-Participation page template** (8 sections), with the **service/form template** for the submission flow.
- **Source:** `[S3: e-participation-page, service-page]`.
- **Alternatives:** Home page template (informational).
- **Status:** **Provisional — Q1/Q6.**

### DD-02 — Arabic-first, RTL-default
- **Decision:** Arabic is the primary language; layout defaults to RTL using CSS **logical properties** and `dir="rtl"`; English is a secondary toggle mirroring all content.
- **Source:** `[S3: F15, F16]` `[PROJ: CLAUDE.md]`.
- **Alternatives:** LTR-first with RTL retrofit — rejected (violates Arabic-first).
- **Status:** Accepted.

### DD-03 — Consume DGA design system, do not fork
- **Decision:** Use the official Platforms Code tokens/components as-is; build a thin React wrapper layer only. No base-design customization.
- **Source:** `[S3]` ("use component as defined … without customization").
- **Note:** The public `GOV-SA/design-system-gov.sa` GitHub repo is an **older generation** (TheSans/Noto fonts, not IBM Plex Sans Arabic) and is **not** the Platforms Code — do **not** adopt its tokens. `[Verified via repo inspection]`
- **Status:** Accepted. Token acquisition method pending **Q3/Q20**.

### DD-04 — Font = IBM Plex Sans Arabic
- **Decision:** Use IBM Plex Sans Arabic exclusively, with Display + Text typography tokens.
- **Source:** `[S3: F5, F6]`.
- **Open:** Delivery method (self-host vs approved source) — **Q7**.
- **Status:** Accepted (value verified).

### DD-05 — Global spacing tokens only
- **Decision:** All spacing from global spacing tokens (4/8/16… scale); never element-custom spacing.
- **Source:** `[S3: F8]`.
- **Status:** Accepted; full scale pending **Q3**.

### DD-06 — Status colors reserved; On-Color for colored backgrounds
- **Decision:** success/error/warning/information reserved for attention states only; categories use neutral/primary; any element on colored/image backgrounds uses the **On Color** variant.
- **Source:** `[S3: F3, F4, F11]`.
- **Status:** Accepted.

### DD-07 — Submission as multi-step form, not a modal
- **Decision:** Submission is a **Steps**-based form page (service/form template); Modal used only for the final confirmation.
- **Source:** `[S3: C9, C30, T6]`.
- **Status:** Accepted; step count/fields pending **Q12/Q16**.

### DD-08 — Feedback via Rating + Feedback section
- **Decision:** Provide standardized feedback with the Rating component and a confirmation message.
- **Source:** `[S3: T7, T8, C24, E13]`.
- **Status:** Accepted.

### DD-09 — Notifications strategy
- **Decision:** Toast for transient success; Inline Alert for persistent form/page errors; top-of-page Notification for high-priority banners.
- **Source:** `[S3: C8]`.
- **Status:** Accepted.

### DD-10 — Status via Tags; categories via neutral Tags
- **Decision:** Request statuses use status-colored Tags; idea categories use neutral/primary Tags.
- **Source:** `[S3: C18, F3, F11]`.
- **Status:** Accepted; status vocabulary pending **Q19**.

### DD-11 — Motion never hides key elements
- **Decision:** No animation hides CTAs/content; important elements always visible without scroll/interaction.
- **Source:** `[S3: E10]`.
- **Status:** Accepted.

### DD-12 — Digital Stamp deferred
- **Decision:** Do **not** include the Digital Stamp unless certified content exists (it belongs at page top and links a certificate number — no such artifact identified).
- **Source:** `[S3: digital-stamp]`.
- **Status:** **Provisional — Q5.**

### DD-13 — Tech stack: React + TypeScript + Vite
- **Decision:** React 18 + TypeScript + Vite; component-driven; semantic HTML.
- **Source:** `[PROJ: CLAUDE.md]` (React, TS, modern best practices). Vite is a team default (not a DGA requirement).
- **Status:** Accepted; i18n/RTL library choices in `DESIGN_SYSTEM_PLAN.md` — **Q21**.

### DD-14 — Sitemap as first-class artifact
- **Decision:** Maintain a real sitemap page + XML, consistent with header/footer/breadcrumb.
- **Source:** `[S3: E12]`.
- **Status:** Accepted.

### DD-15 — Privacy/security notice placement
- **Decision:** Privacy/terms links in footer + consent at submission; notices visible and accessible.
- **Source:** `[S3: E14]`.
- **Status:** Accepted; policy text pending **Q11**.

---

## Decision status summary
| Accepted | Provisional (blocked) |
|---|---|
| DD-02,03,04,05,06,07,08,09,10,11,13,14,15 | DD-01 (Q1/Q6), DD-12 (Q5) |
