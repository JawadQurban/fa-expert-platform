# 23 — Business Review: Decisions, Translations, Ranges, Rejection Reasons

*2026-09-16. One place for what the business closed today and what it still owes.
Sources: the Notion «Application Form Matrix» and «Assignment Matrix» (read-only,
last edited 2026-09-14), `DECISIONS.md` P-268…P-276, `21_FAST_REFERENCE_DATA.md`,
`22_FAST_INTEGRATION_REQUEST.md`.*

## 1. Closed today

| Decision | Ruling | Where it lives |
|---|---|---|
| Preferred Programs semantics | A **category** preference («FA Programs», «Events»), not the FAST catalogue. Field code, stored values and label unchanged. A specific-programme list would be a separate field. `PREFERRED_PROGRAMS_SEMANTICS_REQUIRES_BUSINESS_CONFIRMATION` → **closed** | P-268 · `applicationSchema.ts` |
| Nationality source (architecture) | FAST `GetCountries` is the future source. Use it only once `fast-country` holds a successful sync, otherwise the existing options. `sa`/`gcc`/`other` stay readable forever and are never auto-converted. Implementation waits for the credential | P-269 |
| `isRestricted` | Stored only, no behaviour: `PENDING_FAST_DEFINITION` (question in `22` §2) | P-270 |
| Failed service in a multi-service interview | A failed service closes as not accepted on forwarding. Passed services continue to committee. One failure never fails the whole application | P-271 · `InterviewEndpoints.cs` |
| «Trained/spoken before?» details field | Kept conditional and optional. AR «تفاصيل الخبرات السابقة في التدريب أو التحدث في الفعاليات», EN «Previous training or speaking experience details» | P-272 · migration `M28` |
| Rejection-reason wording | One wording per code: the API's list, until an approved matrix exists | P-273 · §5 |
| FAST service credential | `Fast__ClientId`/`Fast__ClientSecret` named in config, compose and the secrets example, all empty. No provider is built until FAST confirms the grant | P-274 · `22` §1 |

## 2. Still pending (not release blockers)

| Item | Status | Owner |
|---|---|---|
| Screening weights, threshold, filters | `PENDING_APPROVED_SCREENING_MATRIX` (placeholder scoring counts only the original version's fields) | Business |
| Matching weights (34/33/33) | `MATCHING_WEIGHTS_PENDING_BUSINESS_APPROVAL` | Business |
| Rejection-reason list and wording | `PENDING_APPROVED_REJECTION_REASON_MATRIX` | Business |
| Public trainer card | `PENDING_APPROVED_PUBLIC_CARD_MATRIX` | Business |
| Centres: operational vs access scope | kept separate; FAST centre data never grants permissions; pending access-governance decision | Business / access governance |
| J-04 Speaker | backlog `EXPERT-HUB-J04-SPEAKER` | Business |
| Directory minimum-years filter | disabled: `WAITING_FOR_STRUCTURED_EXPERIENCE_MODEL` (§4) | Business |
| City, specialization, university lists | `EXTERNAL_REFERENCE_SOURCE_REQUIRED`: free text kept | Business / FAST |
| 147 domains ↔ FAST job families | `PENDING_FAST_DATA` (`domain-job-family-mapping.csv`) | FAST, then business |
| Translations marked pending in §3 | `TEMPORARY_TRANSLATION_REQUIRES_BUSINESS_REVIEW` | Business |

## 3. Translation review

Rule applied: change wording only when an approved project source settles it.
Otherwise record a recommendation and leave the live text alone. Option **codes**
never change.

| Key | Current Arabic | Current English | Recommended Arabic | Recommended English | Source / reference | Changed |
|---|---|---|---|---|---|---|
| `trainingLanguages.options` | ~~العربية / الإنجليزية~~ → عربي / إنجليزي | Arabic / English | عربي / إنجليزي | Arabic / English | Assignment Matrix «عربي، إنجليزي» (same `lookup.Language`); Application Form Matrix «Arabic, English» | **YES** |
| `trainedBeforeDetails.label` | ~~تفاصيل التدريب أو التحدث في الفعاليات~~ | ~~Details of your training or speaking at events~~ | تفاصيل الخبرات السابقة في التدريب أو التحدث في الفعاليات | Previous training or speaking experience details | Business decision 2026-09-16 | **YES** |
| `preferredPrograms.options` | برامج الأكاديمية المالية / الفعاليات | FA Programs / Events | keep | keep | EN from the Application Form Matrix; «الأكاديمية المالية» is the Academy's own name | NO (resolved) |
| `options.languages` (J-16) | عربي / إنجليزي | Arabic / English | keep | keep | Application Form Matrix English for the same values | NO (resolved) |
| `options.daysOther` (J-16) | أخرى | Other | keep | keep | same «أخرى/Other» used throughout the app | NO (resolved) |
| `yearsOfExperience.options` | أقل من سنتين / من 3 إلى 5 سنوات / من 6 إلى 10 سنوات / أكثر من 10 سنوات | matrix | keep until §4 ranges are decided | — | no Arabic source; ranges under review | NO (pending) |
| `trainingExperienceYears.options` | أقل من سنتين / 3–5 سنوات / 6–10 سنوات / أكثر من 10 سنوات | matrix | use one format with `yearsOfExperience` once §4 is decided | — | same concept, two formats | NO (pending) |
| `trainingDaysFinancialSector.options` | 10–20 يومًا … 76 يومًا فأكثر | matrix | follow §4 | — | ranges under review | NO (pending) |
| `trainingDaysSameTopics.options` | أقل من 10 أيام … أكثر من 45 يومًا | matrix | follow §4 | — | ranges under review | NO (pending) |
| `participationTypes.options` | برامج تدريبية رسمية، ورش عمل متخصصة، محاضرات أكاديمية، مؤتمرات وملتقيات مهنية، حلقات نقاش، إرشاد وتوجيه فردي، كتابة متخصصة ونشر أوراق بحثية، محتوى رقمي / بودكاست / يوتيوب | matrix | confirm «حلقات نقاش» vs «جلسات حوارية» for *Panel discussions*; rest reads naturally | — | workbook and matrix are English-only | NO (pending) |
| `audiences.options` | طلاب الجامعات، الخريجون الجدد، المهنيون في منتصف المسار، القيادات التنفيذية والعليا، عموم الجمهور | matrix | «حديثو التخرج»; «المهنيون في منتصف مسارهم المهني»; workbook adds «(التوعية المالية)» to General public | — | English-only source; «منتصف المسار» is literal | NO (pending) |
| `preferredEngagementTypes.options` | تدريب قصير (يوم أو أيام)، تدريب طويل (أسابيع)، … | matrix | «تدريب قصير المدى (يوم أو عدة أيام)»، «تدريب طويل المدى (أسابيع)» | — | English-only source | NO (pending) |
| `annualAvailability.options` | طوال العام / أشهر محددة / فترات محددة / حسب الطلب | matrix | keep | — | English-only source; wording is idiomatic | NO (pending confirmation) |
| `preferredDeliveryMode.options` | matrix (عن بعد / حضوري) | Online / On-site | — | keep (same as J-16 form) | Arabic-only source | NO (pending) |
| `preferredPeriods.options` | matrix (صباحًا / ظهرًا / مساءً / نهاية الأسبوع) | Morning / Noon / Evening / Weekend | — | keep | Arabic-only source | NO (pending) |
| `options.periods` (J-16) | matrix (صباحية / مسائية) | Morning / Evening | — | keep | Arabic-only source | NO (pending) |
| `options.deliveryModes` (J-16) | matrix (حضوري / عن بُعد / بث مباشر) | On-site / Online / Live stream | — | keep | Arabic-only source | NO (pending) |
| `options.traineeLevels` (J-16) | matrix (مبتدئ / متوسط / متقدم) | Beginner / Intermediate / Advanced | — | keep | Arabic-only source | NO (pending) |
| `options.consultationTypes` (J-16) | matrix | Individual / Institutional consultation, Case study, Assessment / audit, Other | — | keep | Arabic-only source | NO (pending) |

The two label changes (`trainingLanguages` option labels, `trainedBeforeDetails`
label) apply to the **current, unreleased** form version `dm-gap-01.2026-09-16`
through migration `M28` (`UpdateData` on two `FORM_FIELD` rows). Earlier versions
keep their wording. Stored answers are codes, so no stored value changes, and
matching reads codes (`ar`/`en`), not labels.

## 4. Experience ranges (not implemented)

| Field | Current values | Problem | Suggested normalized alternatives |
|---|---|---|---|
| `yearsOfExperience` (عدد سنوات الخبرة) | Less than 2 · 3 to 5 · 6 to 10 · Above 10 | **Gap at 2 years**: someone with 2 (or 2½) years has no option | (a) Less than 2 · 2–5 · 6–10 · More than 10; or (b) 0–2 · 3–5 · 6–10 · 11+, stated as *completed* years |
| `trainingExperienceYears` (الخبرة في التدريب…) | less than 2 · 3–5 · 6–10 · more than 10 | Same gap at 2. Same range as the field above with a **different code** (`more-than-10` vs `above-10`) and wording | Use the scale chosen for `yearsOfExperience`, with one code set |
| `trainingDaysFinancialSector` | 10–20 · 21–45 · 46–75 · 76+ | **No option below 10 days**: a newer trainer can only skip the (optional) field, which reads the same as not answering | Add «Less than 10 days» (and optionally «None») |
| `trainingDaysSameTopics` | less than 10 · 11–20 · 21–45 · 45+ | **Exactly 10 days has no option**; **45 falls in two options** (21–45 and 45+) | Less than 10 · 10–20 · 21–45 · More than 45 |
| Both training-days fields | as above | Different boundaries (10–20 vs 11–20; top 76+ vs 45+), so the two answers can't be compared | One shared day scale if they're meant to be compared |
| Directory «minimum years» filter | disabled | A range has no exact minimum; filtering needs either a numeric field or an approved rule such as "a band counts from its lower bound" | Business chooses: numeric years (new field) **or** approved lower-bound semantics; `WAITING_FOR_STRUCTURED_EXPERIENCE_MODEL` |

## 5. Rejection reasons: one wording per code

Codes are unchanged, and none were added or removed. Notion has no approved
wording: the «Matrices & Data Values Register» lists the unified list's ownership
as *Not resolved*. The API's `ServiceRequestRejectionReasons` is therefore the
temporary technical source. It is also what the API **stores** on a rejected
application (`application.rejection_reason`), so the applicant already saw that
wording while the internal screens showed another.

| Code | API (canonical) AR / EN | Screening, interview and committee screens before | Now |
|---|---|---|---|
| `insufficient-qualifications` | عدم استيفاء المؤهلات المطلوبة / Insufficient qualifications | المؤهلات غير كافية | aligned |
| `insufficient-experience` | الخبرة العملية غير كافية للخدمة المطلوبة / Insufficient experience | الخبرة غير كافية | aligned |
| `incomplete-documents` | المستندات غير مكتملة / Incomplete documents | same | — |
| `specialty-not-required` | التخصص غير مطلوب حاليًا / Specialty not currently required | same | — |
| `other` | سبب آخر / Other | أخرى | aligned |

English was already identical. One frontend source (`screening.content.ts`) feeds
the screening, interview and committee screens. Status:
`PENDING_APPROVED_REJECTION_REASON_MATRIX`.
