# Information Architecture — Financial Academy Innovation Hackathon

> Sitemap, navigation model, and page inventory. A **comprehensive, up-to-date sitemap consistent with the nav header, footer, and breadcrumbs is a DGA requirement** `[S3: E12, "Sitemap"]`. Navigation must be intuitive with logical grouping/labeling `[S3: E2]`.

---

## 1. Sitemap

```
الرئيسية (Home / Hackathon Landing)
│
├─ عن الهاكاثون (About the Hackathon)
│     ├─ الأهداف (Goals)
│     └─ معايير التقييم (Evaluation Criteria — the 6)
│
├─ قدم ابتكارك (Submit Your Innovation)        ← PRIMARY action
│     └─ [Steps 1–4: basics → criteria → documents → review]
│
├─ إدارة طلباتي (Manage My Requests)            ← PRIMARY action
│     └─ تفاصيل الطلب (Request Detail) : /requests/:id
│
├─ الأسئلة الشائعة (FAQ)
│
├─ التقييم / الملاحظات (Feedback & Rating)
│
├─ الجدول الزمني (Timeline)                     ⚠ Q17 (dates)
│
├─ بحث (Search)                                 ⚠ Q10 (conditional)
│
└─ Footer utility:
      ├─ سياسة الخصوصية (Privacy Policy)        [S3: E14]
      ├─ الشروط والأحكام (Terms)                ⚠ Q11
      ├─ تواصل معنا (Contact)                    [S3: footer]
      ├─ خريطة الموقع (Sitemap page)            [S3: E12]
      └─ إمكانية الوصول (Accessibility statement) [PROJ: WCAG]
```

> ⚠ **Q1** determines whether the landing is an **e-Participation** page (8 mandated sections) or a **Home** page. The section inventory below is the working model pending that answer.

---

## 2. Global navigation (Navigation Header) `[S3: C20]`

**Primary nav items (Arabic-first):**
`الرئيسية` · `عن الهاكاثون` · `قدم ابتكارك` · `إدارة طلباتي` · `الأسئلة الشائعة`

**Header utilities:** language toggle (AR/EN), search (if Q10), user menu/avatar (if auth), primary CTA button "قدم ابتكارك".

- External links (if any) show the **external-link (Link Square) icon** `[S3: C4, C20]`.
- Header is **responsive**; collapses to **Nav Drawer** on mobile `[S3: C27, F13]`.
- **Selected** state marks the current section `[S3: C20]`.

## 3. Footer `[S3: C21]` (mandatory content)

Grouped link columns with headings, e.g.:

| Group | Links |
|---|---|
| روابط مهمة (Important Links) | Home, About, Submit, Manage |
| الدعم والمساعدة (Support & Help) | FAQ, Contact, Accessibility |
| السياسات (Policies) | Privacy Policy, Terms |
| — | Academy logo(s), contact info, social/official links `[S3]` |

Footer must include **official links, org logos, contact info, privacy policies** `[S3]`.

## 4. Breadcrumbs `[S3: C22]`

Applied on all sub-pages; consistent with sitemap hierarchy; **current page disabled/non-interactive**. Examples:

- `الرئيسية / قدم ابتكارك`
- `الرئيسية / إدارة طلباتي / تفاصيل الطلب`
- `الرئيسية / الأسئلة الشائعة`

## 5. Page inventory

| # | Page | Route (indicative) | Template basis `[S3]` | Auth ⚠Q4 |
|---|---|---|---|---|
| 1 | Hackathon Landing | `/` | E-Participation / Home (Q1) | No |
| 2 | About / Goals / Criteria | `/about` | Content sections | No |
| 3 | Submit Your Innovation | `/submit` | Service + Form + Steps | Likely yes |
| 4 | Manage My Requests | `/requests` | Table/list | Yes |
| 5 | Request Detail | `/requests/:id` | Service-detail style | Yes |
| 6 | FAQ | `/faq` | Accordion content | No |
| 7 | Feedback & Rating | `/feedback` | Rating + Feedback section | No |
| 8 | Search results | `/search` | Search template (Q10) | No |
| 9 | Privacy / Terms | `/privacy`, `/terms` | Content | No |
| 10 | Sitemap page | `/sitemap` | Content | No |
| 11 | Accessibility statement | `/accessibility` | Content | No |
| 12 | 404 / error | `*` | Error pattern | No |

## 6. Landing-page section inventory (working model — reconcile with Q1/Q6)

Ordered top→bottom:

1. **Hero** — hackathon name, tagline, primary CTA "قدم ابتكارك", secondary "إدارة طلباتي" `[S3: T2]`.
2. **About / Introduction** — what the hackathon is (info section first, matching participatory type) `[S3: T3]`.
3. **Goals** — the strategic goals `[PROJ]`.
4. **Evaluation Criteria** — the 6 criteria as cards `[PROJ]`.
5. **How to Participate / Steps** — overview of the submission process `[S3: C30]`.
6. **Timeline** — key dates ⚠ Q17.
7. **Partners / Sponsors** — if present, standardized section `[S3: T4]`.
8. **FAQ** — accordion `[S3: C5]`.
9. **Feedback / Rating** `[S3: T7, T8]`.
10. **Footer** `[S3: C21]`.

> ⚠ If the **e-Participation 8-section** structure is mandated (Q1/Q6), sections 1–9 map onto those 8 sections — final naming/order pending the template spec, which is **not machine-verifiable** from `[S1]`.

## 7. Content grouping rationale `[S3: E2]`

- **Discover** (Hero, About, Goals, Criteria, Timeline) — informational, top of page.
- **Act** (Submit, Manage) — persistent CTAs in header + hero.
- **Support** (FAQ, Feedback, Contact, Policies) — bottom + footer.

This three-tier grouping keeps the two primary actions reachable from anywhere while satisfying "logical grouping and labeling" `[S3: E2]`.
