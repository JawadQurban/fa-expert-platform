# Content Structure & Copy Model — Financial Academy Innovation Hackathon

> Content model, terminology glossary, and tone. DGA requires **Arabic-first** content, **consistent terminology**, **clear/concise language**, **uniform tone**, and **consistent error messages** `[S3: F15, E5, E8, E15, E16]`. Source content: `content/hackathon.md` `[PROJ]`.
>
> ⚠ Copy below is **structural/placeholder** derived from the brief. Final Arabic wording must be approved by the client — see **Q12/Q18**. Nothing here invents hackathon facts beyond `content/hackathon.md`.

---

## 1. Language & tone rules `[S3]`

- **Arabic is primary** on every page/component; English is secondary and, on toggle, must mirror content fully `[S3: F15, F16]`.
- Tone: formal-institutional, encouraging, concise. Uniform across all screens `[S3: E8]`.
- Every term must clearly reflect its function; avoid synonyms for the same concept `[S3: E15]`.
- Error/confirmation messages: clear, concise, unified style (e.g., "تم حفظ البيانات بنجاح", "الرجاء إدخال البريد الإلكتروني") `[S3: E16]`.

## 2. Canonical terminology glossary (single source of truth) `[S3: E15]`

| Concept | Approved Arabic term | English | Notes |
|---|---|---|---|
| The program | هاكاثون الابتكار | Innovation Hackathon | From brief |
| The organization | الأكاديمية المالية | Financial Academy | |
| Submit action | قدم ابتكارك | Submit Your Innovation | Exact brief wording — do not paraphrase `[PROJ]` |
| Manage action | إدارة طلباتي | Manage My Requests | Exact brief wording `[PROJ]` |
| A submission | ابتكار / طلب | Innovation / Request | ⚠ Q18: standardize on one term |
| Evaluation | معايير التقييم | Evaluation Criteria | |
| Idea | الفكرة | Idea | |
| Status | الحالة | Status | |

> ⚠ **Q18:** The brief uses both "ابتكار" (innovation) and "طلبات" (requests). Confirm one canonical term per concept to satisfy E15.

## 3. Content model per section/page

### 3.1 Hero
- Hackathon name (H1), one-line value proposition, primary CTA, secondary CTA.
- Approved hero type: image / colored background / object `[S3: T2]`.

### 3.2 About the Hackathon `[PROJ: content/hackathon.md]`
> "هي مسابقة داخلية تهدف لتعزيز ثقافة الابتكار المؤسسي بما يخدم الأهداف الاستراتيجية للأكاديمية وتقديم حلول عملية لتحديات مؤسسية…"
- 1 short paragraph + optional supporting stat/point.

### 3.3 Goals (الأهداف) `[PROJ]`
Six goals from the brief, presented as list/cards:
1. تحقيق أحد أهداف رؤية الأكاديمية في دعم ثقافة الابتكار وتفعيل التحول المؤسسي.
2. إطلاق برنامج منظم لتحديد التحديات وتصميم حلول قابلة للتطبيق واختبارها.
3. إرساء منهجية ابتكار مؤسسية دائمة تشمل حوكمة ومنهجية متكررة.
4. ترسيخ موقع الأكاديمية كمركز وطني للابتكار التطبيقي في القطاع المالي.
5. دعم برنامج تطوير القطاع المالي لرؤية 2030.
6. تحقيق متطلبات القياس في مجال الابتكار وبناء قدرات دائمة.

### 3.4 Evaluation Criteria (معايير التقييم) `[PROJ]` — 6 cards
| # | Criterion | Description (from brief) |
|---|---|---|
| 1 | وضوح الفكرة | وضوح المشكلة والحل المقترح |
| 2 | الأثر على الأكاديمية المالية | مساهمة الفكرة في تطوير رأس المال البشري وتعزيز مكانة الأكاديمية |
| 3 | الجدوى التطبيقية | إمكانية التنفيذ في بيئة الأكاديمية (أنظمة، لوائح، موارد) |
| 4 | القيمة المالية / الكفاءة | خفض تكاليف أو زيادة كفاءة أو خلق إيراد محتمل |
| 5 | مستوى الابتكار | حداثة الفكرة واختلافها عن الممارسات الحالية |
| 6 | قابلية التوسع والاستدامة | إمكانية تعميمها واستمرار أثرها على المدى الطويل |

These 6 also structure **Step 2 of the submission form** (`USER_FLOW.md` Flow 2).

### 3.5 Submission form content (service/form template terms) `[S3: T6]`
Use the mandated headings **without modification**: **الخطوات (Steps)**, **الشروط (Requirements)**, **المستندات المطلوبة (Required Documents)**, **بطاقة تفاصيل الخدمة (Service Details Card)**.

Field inventory (indicative — validate Q12/Q18):
| Field | Component | Required | Validation message pattern `[S3: E16]` |
|---|---|---|---|
| عنوان الابتكار | Text Input | Yes | "الرجاء إدخال عنوان الابتكار" |
| التصنيف | Dropdown | Yes | "الرجاء اختيار التصنيف" |
| القسم/الإدارة | Dropdown | ⚠Q12 | — |
| المشكلة | Textarea | Yes | "الرجاء وصف المشكلة" |
| الحل المقترح | Textarea | Yes | "الرجاء وصف الحل المقترح" |
| مبررات وفق المعايير الستة | Textarea ×6 or grouped | ⚠Q12 | — |
| المستندات الداعمة | File Uploader | Optional | "نوع الملف غير مدعوم / تجاوز الحجم المسموح" |
| الإقرار/الموافقة | Checkbox | Yes | "الرجاء الموافقة على الشروط" |

### 3.6 Manage My Requests
List/table columns: العنوان · التصنيف · الحالة · التاريخ · إجراءات. Status values (Tags) ⚠ Q19: e.g., مُرسل / قيد المراجعة / مقبول / مرفوض.

### 3.7 FAQ, Feedback, Footer, Policies
- FAQ: Q/A pairs in Accordion `[S3: C5]`.
- Feedback: rating + optional comment + confirmation `[S3: T7,T8,E13]`.
- Footer & policies: privacy/terms/contact/sitemap/accessibility `[S3: C21, E14]` — ⚠ Q11 policy text.

## 4. Message catalog (consistency source) `[S3: E9,E13,E16]`

| Event | Message (Arabic) |
|---|---|
| Submit success | تم إرسال ابتكارك بنجاح |
| Save draft (if Q16) | تم حفظ المسودة |
| Field required | الرجاء إدخال {الحقل} |
| Upload type/size error | تعذّر رفع الملف: تحقّق من النوع أو الحجم |
| Feedback received | شكرًا لك، تم استلام ملاحظاتك |
| Withdraw confirm (if Q13) | هل أنت متأكد من سحب الطلب؟ |

Centralizing messages here enforces E9/E15/E16 (consistent feedback, terminology, error handling).

## 5. Open content questions
Q11 (policy text), Q12 (field list), Q17 (timeline dates), Q18 (canonical term), Q19 (status vocabulary). See `QUESTIONS.md`.
