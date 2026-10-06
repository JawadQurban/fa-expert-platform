# Copywriting Guidelines — Financial Academy Innovation Hackathon

> Voice, tone, terminology, and message catalogs. DGA requires **Arabic-first**, clear/concise, uniform-tone content with **consistent terminology** and **consistent error/confirmation messages** `[S3: F15, E5, E8, E15, E16]`. Builds on `CONTENT_STRUCTURE.md` (Hackathon copy) and `CONTENT_MODEL.md` (message-catalog architecture).
>
> ⚠ Final Arabic wording must be approved by the client (**Q12, Q18, Q19**). Strings below are structural defaults, not invented facts; nothing exceeds `content/hackathon.md`.

---

## 1. Voice (constant)
The Financial Academy voice is: **professional, trustworthy, encouraging, and clear.** It is an official government/institutional voice that respects the user's time and intelligence, invites participation, and never uses hype, jargon, or dark patterns.

## 2. Tone (adapts by context)
| Context | Tone |
|---|---|
| Marketing (hero, about, goals) | Inspiring but measured; motivates participation |
| Instructional (forms, steps, help) | Plain, directive, reassuring |
| Success (confirmations) | Warm, affirming, brief |
| Errors | Calm, respectful, solution-oriented — never blaming |
| Legal (privacy/terms) | Precise, formal, transparent |
Tone shifts; **voice stays constant** (`[S3: E8]`).

## 3. Terminology (canonical — single source) `[S3: E15]`
Use `CONTENT_STRUCTURE.md §2` glossary as authoritative. No synonyms for the same concept.
- Exact brief phrases — **do not paraphrase**: «قدم ابتكارك», «إدارة طلباتي» `[PROJ]`.
- ⚠ **Q18:** standardize «ابتكار» vs «طلب» for one concept. **Working default:** the artifact the user creates = «ابتكار» in marketing/submission; the tracked record in Manage = «طلب». Confirm.
- ⚠ **Q19:** status vocabulary. **Working default:** `مُرسل / قيد المراجعة / مقبول / غير مقبول / مسحوب`.
- Every term must clearly reflect its function (`[S3: E15]`).

## 4. Arabic writing rules (primary)
- **Arabic is the source language**; write in Arabic first, translate to English (`CONTENT_MODEL.md`).
- Modern Standard Arabic; formal-institutional register; no dialect.
- Concise: short sentences, active voice, direct address to the user (أنت-form appropriately).
- Correct diacritics only where needed to disambiguate; consistent spelling of key terms.
- Numerals: use the locale's numeral convention consistently (⚠ confirm Arabic-Indic vs Western digits — **Q32**).
- Punctuation: Arabic comma (،) and question mark (؟); correct RTL punctuation placement.
- Bidi: isolate Latin/numeric runs inside Arabic sentences (`CONTENT_MODEL.md §5`).
- Labels/headings: noun phrases or clear imperatives; avoid trailing colons unless a value follows.

## 5. English writing rules (secondary)
- English is a **full-parity** translation when shown `[S3: F16]` — no dropped content on toggle.
- Sentence case for UI text; Title Case only for proper nouns/official names.
- Match the Arabic meaning and tone; don't add or omit information.
- Keep the same terminology mapping (glossary EN column).
- Culturally neutral, plain English (many users are non-native).

## 6. Button & action labels
Verb-first, concise, function-revealing (`[S3: E15]`). Same label = same action everywhere (DC-26).

| Action | Arabic | English |
|---|---|---|
| Primary submit CTA | قدم ابتكارك | Submit Your Innovation |
| Manage | إدارة طلباتي | Manage My Requests |
| Next step | التالي | Next |
| Previous step | السابق | Back |
| Final submit | إرسال | Submit |
| Confirm (modal) | تأكيد | Confirm |
| Cancel | إلغاء | Cancel |
| View item | عرض | View |
| Edit | تعديل | Edit |
| Withdraw | سحب الطلب | Withdraw request |
| Upload | إرفاق ملف | Attach file |
| Remove file | إزالة | Remove |
| Retry | إعادة المحاولة | Retry |
| Back home | العودة للرئيسية | Back to home |
| Submit feedback | إرسال الملاحظات | Send feedback |
Avoid vague labels ("موافق/OK", "إرسال" without object where ambiguous) — prefer descriptive ("تأكيد الإرسال").

## 7. Success messages `[S3: E13]`
Warm, brief, confirm what happened + what's next.
| Event | Arabic | English |
|---|---|---|
| Innovation submitted | تم إرسال ابتكارك بنجاح | Your innovation was submitted successfully |
| Draft saved (⚠Q16) | تم حفظ المسودة | Draft saved |
| Feedback received | شكرًا لك، تم استلام ملاحظاتك | Thank you, your feedback was received |
| Request withdrawn (⚠Q13) | تم سحب الطلب | Request withdrawn |

## 8. Error messages `[S3: E16]`
Structure: **what happened + why (if useful) + how to fix.** Never blame the user; no error codes as primary text.
| Situation | Arabic | English |
|---|---|---|
| Generic load failure | تعذّر تحميل البيانات، الرجاء إعادة المحاولة | Couldn't load data. Please try again |
| Submit failure | تعذّر إرسال ابتكارك، الرجاء إعادة المحاولة | Couldn't submit your innovation. Please try again |
| Upload type | نوع الملف غير مدعوم | Unsupported file type |
| Upload size | حجم الملف يتجاوز الحد المسموح | File exceeds the size limit |
| Network | لا يوجد اتصال بالإنترنت | No internet connection |
| Not found | الصفحة غير موجودة | Page not found |
| Session/auth (⚠Q4) | انتهت الجلسة، الرجاء تسجيل الدخول مجددًا | Session expired, please sign in again |

## 9. Validation messages (inline, per field) `[S3: E16]`
Consistent placement/style across fields (DC-33). Pattern: «الرجاء {الإجراء} {الحقل}».
| Rule | Arabic |
|---|---|
| Required | الرجاء إدخال {الحقل} |
| Required select | الرجاء اختيار {الحقل} |
| Too short | يجب أن يحتوي {الحقل} على {n} أحرف على الأقل |
| Too long | الحد الأقصى {n} حرف |
| Consent required | الرجاء الموافقة على الشروط للمتابعة |
| Invalid email (if used) | الرجاء إدخال بريد إلكتروني صحيح |
Use named placeholders `{الحقل}`/`{n}`, never concatenation (bidi-safe, `CONTENT_MODEL.md §3`).

## 10. Empty-state copy
Encouraging + a clear next action (never a dead end).
| Screen | Arabic | CTA |
|---|---|---|
| Manage (no requests) | لا توجد طلبات بعد. ابدأ بتقديم ابتكارك الأول. | قدم ابتكارك |
| Search (no results) | لا توجد نتائج مطابقة. جرّب كلمات مختلفة. | — |
| Detail (no feedback yet) | لا توجد ملاحظات على طلبك حتى الآن. | — |
| FAQ (none) | سيتم إضافة الأسئلة الشائعة قريبًا. | — |

## 11. Placeholder & helper text
- Placeholders **assist**, never replace labels (labels always present, WCAG 3.3.2).
- Helper text is persistent guidance (e.g., accepted file types/sizes near the uploader).
- Don't put essential info only in a placeholder (disappears on input).

## 12. Microcopy principles
- Front-load meaning (first words carry the point) — aids RTL scanning (`VISUAL_HIERARCHY.md §5`).
- One idea per sentence; avoid nested clauses.
- Positive framing where possible ("متبقٍ حرفان" vs "تجاوزت الحد").
- Consistent capitalization/spacing per language rules (§4/§5).
- No idioms that don't translate; no humor in errors/legal.

## 13. Governance
- All strings live in the message catalog keyed per `CONTENT_MODEL.md §3`; **no hard-coded UI strings** (DC-24).
- Terminology changes update the glossary first, then propagate.
- New copy passes: glossary check, tone check, AR/EN parity check (`TESTING_STRATEGY.md §6`).

## 14. Open items
Q11 (policy text), Q12 (field list/labels), Q18 (canonical term), Q19 (statuses), Q32 (numeral convention). See `QUESTIONS.md`.
