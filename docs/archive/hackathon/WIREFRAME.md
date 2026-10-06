# Wireframes (Text-Only) — Financial Academy Innovation Hackathon

> **Low-fidelity, text-only structural layouts.** No HTML, no CSS, no visual mockups — per phase rules `[PROJ: TASK.md]`. These describe block order and content regions only; exact styling comes from DGA tokens `[S3]`.
>
> **RTL note:** The platform is RTL `[S3]`. In these ASCII sketches, treat the **right edge as the start** of each row (logical start). Boxes are regions, not pixel layouts.

---

## Legend
`[ ]` region · `« »` CTA/button · `▸` interactive · `▾` expandable · `⬚` image/media · `≣` list/table

---

## W1 — Hackathon Landing (Desktop)

```
┌──────────────────────────────────────────────────────────────┐
│ [Nav Header]  logo | الرئيسية · عن الهاكاثون · قدم · إدارة · FAQ │
│                            search▸  AR/EN▸  «قدم ابتكارك» avatar▸ │  ← C20, C4, C23
├──────────────────────────────────────────────────────────────┤
│ [HERO — approved type: image/color/object]        (T2)         │
│    H1: هاكاثون الابتكار — الأكاديمية المالية                     │
│    sub: مسابقة داخلية لتعزيز ثقافة الابتكار المؤسسي              │
│    «قدم ابتكارك»(primary)   «إدارة طلباتي»(secondary)           │
├──────────────────────────────────────────────────────────────┤
│ [About / Introduction]  (T3 — info section first)              │
│    paragraph …                                                  │
├──────────────────────────────────────────────────────────────┤
│ [Goals]   ≣ 6 goal items (cards or list)   (C19)               │
├──────────────────────────────────────────────────────────────┤
│ [Evaluation Criteria]  6 Cards in a responsive grid  (C19)     │
│   [Card1 وضوح] [Card2 الأثر] [Card3 الجدوى]                     │
│   [Card4 القيمة] [Card5 الابتكار] [Card6 التوسع]                │
├──────────────────────────────────────────────────────────────┤
│ [How to Participate]  Steps overview 1▸2▸3▸4  (C30)            │
├──────────────────────────────────────────────────────────────┤
│ [Timeline]  ⚠Q17 key dates                                     │
├──────────────────────────────────────────────────────────────┤
│ [Partners/Sponsors]  ⬚ logos (T4)  — if present                │
├──────────────────────────────────────────────────────────────┤
│ [FAQ]  ▾ accordion items  (C5)                                 │
├──────────────────────────────────────────────────────────────┤
│ [Feedback/Rating]  ★★★★★ + comment  «إرسال»  (C24,T7,T8)       │
├──────────────────────────────────────────────────────────────┤
│ [Footer]  groups: روابط مهمة | الدعم | السياسات | logo/contact  │  ← C21
└──────────────────────────────────────────────────────────────┘
```

## W1-m — Landing (Mobile)
```
┌───────────────────────┐
│ ☰(Nav Drawer) logo AR/EN│  ← C27
├───────────────────────┤
│ [HERO stacked]         │
│  H1 / sub              │
│  «قدم ابتكارك»          │
│  «إدارة طلباتي»          │
├───────────────────────┤
│ About (single column)  │
│ Goals (stacked cards)  │
│ Criteria (1-col cards) │  ← reflow F13
│ Steps (vertical)       │
│ Timeline / FAQ / Feed. │
├───────────────────────┤
│ Footer (stacked groups)│
└───────────────────────┘
```

---

## W2 — Submit Your Innovation (Steps)  `[S3: T6, C30]`

```
┌──────────────────────────────────────────────────────────────┐
│ [Nav Header]                                                   │
│ Breadcrumb: الرئيسية / قدم ابتكارك   (C22, current disabled)   │
├──────────────────────────────────────────────────────────────┤
│ [Steps indicator]  ①بيانات ②المعايير ③المستندات ④المراجعة       │
├──────────────────────────────────────────────────────────────┤
│ STEP 1 — بيانات الابتكار                                       │
│   عنوان الابتكار      [ Text Input ]        (C14)              │
│   التصنيف            [ Dropdown ▾ ]         (C3)               │
│   المشكلة            [ Textarea ............ ] (C15)           │
│   الحل المقترح        [ Textarea ............ ]                 │
│   inline errors under fields (E16)                             │
│                         «التالي»  (C2)                         │
├──────────────────────────────────────────────────────────────┤
│ STEP 2 — التوافق مع معايير التقييم (6)                          │
│   6 grouped inputs / textareas per criterion  [PROJ]           │
│                 «السابق»   «التالي»                            │
├──────────────────────────────────────────────────────────────┤
│ STEP 3 — المستندات الداعمة                                     │
│   [ File Uploader ]  drag+drop; name/status/remove  (C10)     │
│   error: نوع/حجم الملف (E16)                                    │
│                 «السابق»   «التالي»                            │
├──────────────────────────────────────────────────────────────┤
│ STEP 4 — المراجعة والإقرار                                     │
│   read-only summary (Service Details Card)  (T6)              │
│   ☐ أوافق على الشروط (Checkbox C12, E14)                       │
│                 «السابق»   «إرسال»                             │
│   → Confirmation Modal (C9) → success Toast (C8,E13)           │
└──────────────────────────────────────────────────────────────┘
```

---

## W3 — Manage My Requests  `[S3: C26, C18, C28]`

```
┌──────────────────────────────────────────────────────────────┐
│ [Nav Header]   Breadcrumb: الرئيسية / إدارة طلباتي             │
├──────────────────────────────────────────────────────────────┤
│ [Filters]  الحالة▾  التصنيف▾  التاريخ▾   (E17)                 │
├──────────────────────────────────────────────────────────────┤
│ [Table]  ≣                                                     │
│  العنوان        | التصنيف | الحالة(Tag) | التاريخ | إجراءات▸    │
│  ابتكار أ …      | تشغيل   | قيد المراجعة | 2026-.. | عرض▸       │
│  ابتكار ب …      | مالية   | مقبول        | 2026-.. | عرض▸       │
├──────────────────────────────────────────────────────────────┤
│ [Pagination]  ‹ 1 2 3 ›   (C28)                                │
│ Empty state: «لا توجد طلبات» + «قدم ابتكارك»                    │
└──────────────────────────────────────────────────────────────┘
```

### W3b — Request Detail  `/requests/:id`
```
Breadcrumb: الرئيسية / إدارة طلباتي / تفاصيل الطلب
[ Service Details Card ]  title, category(Tag), status(Tag), date
[ Status timeline ]  مُرسل → قيد المراجعة → (نتيجة)
[ Submission content ] read-only
[ Evaluator feedback ] ⚠Q14
[ Actions ] «تعديل» «سحب»  ⚠Q13 → Modal confirm (C9)
```

---

## W4 — FAQ
```
Breadcrumb: الرئيسية / الأسئلة الشائعة
[ Accordion ]  ▾ سؤال 1 … ▾ سؤال 2 …   (C5, states Expanded/Collapsed)
```

## W5 — Feedback & Rating
```
[ Rating ] ★★★★★ (Normal/Pressed, Selected/Half)  (C24)
[ Textarea ] optional comment
«إرسال»  → confirmation message  (E13)
```

## W6 — Search results (conditional ⚠Q10)
```
[ Search bar present on results page ]  (T10)
[ Filters: نوع المحتوى ▾  التاريخ ▾ ]     (E17)
[ Results list grouped by category ]  ≣
[ Pagination ]
```

## W7 — Error / 404
```
[ Featured icon >24px ]  (F10)
H1: الصفحة غير موجودة
«العودة للرئيسية»
```

---

## Wireframe → component/state coverage
Every region above maps to a DGA component in `COMPONENT_MAPPING.md`, and every interactive region must expose its DGA state set (incl. **Focused**) per `DGA_MASTER_SPECIFICATION.md §4`. Region order enforces **visual hierarchy** and **first-section-after-hero** rules `[S3: E1, T3]`.
