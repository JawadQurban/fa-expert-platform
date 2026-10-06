import { ACADEMIC_SPECIALIZATION_OPTIONS } from '../../shared/content/academicSpecializations';
import { PROFESSIONAL_CERTIFICATION_OPTIONS } from '../../shared/content/professionalCertifications';
import { activeDomains } from '../../shared/content/domainCatalogueStatus';
import { SPECIALIZATION_DOMAIN_OPTIONS } from '../../shared/content/specializationDomains';
import { UNIVERSITY_OPTIONS } from '../../shared/content/universities';
import type {
  ApplicationFormSchemaDto,
  ApplicationFieldOption,
  ApplicationFieldSchema,
} from './applicationForm.types';
import type { ApplicationService } from './application.types';

/**
 * THE APPLICATION FIELD MAP — version `dm-gap-01.2026-09-29`: the Notion
 * «Application Form Matrix» (Matrices) applied on top of `DM-GAP-01`, the
 * workbook delivered 2026-08-30 as
 * `docs/inputs/trainer-application-form.xlsx`, plus the
 * business decisions of 2026-09-16, the PM confirmations of 2026-09-18 and the
 * Evaluation-Matrix alignment of 2026-09-19/2026-09-20.
 *
 * The API seeds this object as `ApplicationSeedData.Current*`; every previous
 * version stays seeded unchanged, and every draft or application keeps the
 * version it was started on.
 *
 * `dm-gap-01.2026-09-14` added: the conditional «تاريخ الانتهاء», the two
 * «years of experience» ranges, «اللغة», the three training-days/programmes
 * dropdowns, «الفترات المفضلة», the client-referrals attachment, the approved
 * values of delivery mode and annual availability, and label wording.
 *
 * `dm-gap-01.2026-09-16` (business decisions) added: «هل سبق لك التدريب أو
 * التحدث في فعاليات؟» (Yes/No) with conditional details, weekday availability,
 * hours per day (a number, 1–24), «التخصص العام» as free text, and the
 * «المؤهل / Qualification» label.
 *
 * `dm-gap-01.2026-09-21` (this version) closes the two biggest open items the
 * predecessors recorded — the missing reference lists, and repeatable entries:
 *
 * - **Repeatable groups.** `education`, `certifications` and `experience` are
 *   now `repeatable` sections (PM-confirmed 2026-09-18 — an applicant «may add
 *   multiple qualifications», «may have zero professional certifications»,
 *   holds «multiple past roles»). `education`/`experience` require at least one
 *   entry with every field inside it mandatory; `certifications` requires none
 *   and is **optional for all four services** end to end. This is the
 *   follow-up the previous version named («multi-entry groups are a named
 *   follow-up, not silently dropped»), not a new mechanism.
 * - **The reference lists arrived** (2026-09-21) and three free-text fields
 *   become dropdowns over them: «التخصص» → the 25-value academic-specialization
 *   list, «اسم الجامعة» → the 517-institution list, «اسم الشهادة» → the
 *   228-entry classified certification list. The lists' scoring columns
 *   (`relevant`, `isGlobal`) are deliberately **dropped** on the way into the
 *   schema: the form collects, the Evaluation Matrix scores, and the frontend
 *   must never carry a weight.
 * - **Evaluation-Matrix alignment**: «عدد سنوات الخبرة» takes the workbook's own
 *   buckets (2026-09-19), «ثنائي اللغة» and «حضوري وعن بعد» join their option
 *   lists (EVAL-GAP-08), and the per-service experience/readiness fields
 *   (`trainingExperienceYears`, `consultingExperienceYears`,
 *   `readyConsultingMaterials` — EVAL-GAP-09 —, `contentQuestionExperienceYears`)
 *   and «نمط التعامل» (`engagementMode` — EVAL-GAP-06) are split per service.
 *
 * `dm-gap-01.2026-09-28` changes ONE option list. The business
 * classified the «مجال التخصص» master on 2026-09-28 and found 13 of its 147
 * values are not professional domains at all — tools, certifications,
 * methodologies, programmes, service types and a catch-all. They are kept in
 * the master and in every earlier schema version, so historical applications
 * stay readable; this version simply stops offering them to new applicants.
 * No field was added, removed or re-labelled.
 *
 * `dm-gap-01.2026-09-29` (this version) corrects ONE declaration. Business
 * decision 2026-09-29: «نمط التقديم المفضل لديك» (`preferredDeliveryMode`)
 * applies to the Trainer only, so its `requiredFor` now matches its
 * `visibleFor` instead of naming all four services. The change is INERT —
 * both validators skip a hidden field, so no application's outcome differs
 * either way — but a schema that says a consultant must answer a question
 * they never see is a schema that cannot be read literally. Nothing else
 * changed: same fields, same options, same labels, same attachment rules.
 *
 * Mandatory flags: the matrix has no required column and J-01's «Application
 * Fields by Service» is still «?», so every existing flag is kept as it was
 * and every field this version adds is optional — REQUIRES REVIEW.
 *
 * `TEMPORARY_TRANSLATION_REQUIRES_BUSINESS_REVIEW` marks option labels the
 * matrix gives in one language only; the other language is a working
 * translation.
 *
 * ## What the matrix leaves open — flagged, not resolved (REQUIRES REVIEW)
 *
 * - **ID routing**: one form field, several DB columns (national ID / iqama /
 *   passport / gulf ID) — «needs a routing mechanism based on the selected ID
 *   type».
 * - **Sector → Field/Domain cascade, nationality, cities**: FAST exposes no
 *   list Expert Hub can call for a form (see
 *   `docs/specification/20_FAST_API_STUDY.md`) — the existing controls stay.
 *   ✅ RESOLVED 2026-09-21 for specialization, university and certificate name:
 *   the owner's own lists arrived and now back those three dropdowns. Their
 *   codes (`spec-NNN` / `uni-NNN` / `cert-NNN`) are the list modules' own,
 *   pending real FAST lookup ids.
 * - **«عدد المشاركات الممكنة سنويًا»**: named without values — keeps its
 *   provisional list (business decision: unchanged until replaced).
 * - **Experience ranges** skip «2 to 3 years» and the training-day ranges do
 *   not meet — kept exactly as approved, BUSINESS_REVIEW_REQUIRED.
 * - **Profile picture, CV, client referrals** sit inside sections in the
 *   matrix; the form renders every file in its attachments step.
 * - **The 3-year qualification-date rule** is «suggested … needs confirmation»
 *   — not enforced.
 * - **Repeatable entries**: ✅ RESOLVED — the workbook's note («قد يكون المتقدم
 *   لديه عدة شهادات فلابد من وضع ذلك عند تصميم المنصة») is implemented by the
 *   `repeatable` sections below. No **maximum** entry count is approved, so
 *   none is declared.
 * - **⚠️ PROVISIONAL OPTION LISTS**: where no approved values exist
 *   (nationality, general specialization, ready-materials, engagements/year),
 *   the options below are placeholders marked on each field. The
 *   specializations / universities / certifications lists — «تم تسليمها
 *   للزميلة مي سابقًا» — arrived 2026-09-21 and are no longer provisional.
 * - **Multi-select option wording**: the workbook lists those options in
 *   English only; the Arabic option labels are working translations pending
 *   the approved Arabic wording. The option *codes* follow the English list.
 *
 * `email`/`phone` are deliberately **absent**: the workbook's field list does
 * not carry them (identity arrives via INT-01), and inventing rows the matrix
 * dropped would repeat the `bio` mistake this file's predecessor documents.
 *
 * File attachments (profile picture, CV, qualification certificate,
 * professional certificate) live in `attachments` below — the workbook marks
 * their formats/sizes as «still need to be defined», so the values reuse
 * J-01's **approved** attachment-validation table unchanged (1 MB ceilings).
 */

const ALL_SERVICES: readonly ApplicationService[] = [
  'trainer',
  'consultant',
  'content-developer',
  'question-writer',
];

/** Shared URL shape for the workbook's `Text (URL)` fields. */
const URL_VALIDATION: ApplicationFieldSchema['validation'] = {
  pattern: '^https?://\\S+$',
  patternMessageAr: 'أدخل رابطًا صحيحًا يبدأ بـ http:// أو https://',
  patternMessageEn: 'Enter a valid link starting with http:// or https://',
};

/**
 * The reference lists carry scoring columns (`relevant` on specializations and
 * certifications, `isGlobal` on certifications). They are **dropped here on
 * purpose**: they belong to the Evaluation Matrix, which is the backend's, and
 * a weight that reaches the browser is a weight an applicant can read.
 */
const asOptions = (
  list: readonly { value: string; labelAr: string; labelEn: string }[]
): readonly ApplicationFieldOption[] =>
  list.map(({ value, labelAr, labelEn }) => ({ value, labelAr, labelEn }));

/**
 * «الخبرة … بالسنوات» — one option set, three fields (training / consulting /
 * content-and-questions). The four codes and labels are the approved weight
 * table's own; the services differ, the buckets do not.
 */
const EXPERIENCE_YEAR_OPTIONS: readonly ApplicationFieldOption[] = [
  { value: 'less-than-2', labelAr: 'أقل من سنتين', labelEn: 'Less than 2 years' },
  { value: '3-5', labelAr: '3–5 سنوات', labelEn: '3–5 years' },
  { value: '6-10', labelAr: '6–10 سنوات', labelEn: '6–10 years' },
  { value: 'more-than-10', labelAr: 'أكثر من 10 سنوات', labelEn: 'More than 10 years' },
];

const YES_NO_OPTIONS: readonly ApplicationFieldOption[] = [
  { value: 'yes', labelAr: 'نعم', labelEn: 'Yes' },
  { value: 'no', labelAr: 'لا', labelEn: 'No' },
];

export const APPLICATION_FORM_SCHEMA: ApplicationFormSchemaDto = {
  version: 'dm-gap-01.2026-09-29',
  // Speaker intentionally absent (`BR-0113`) — and the workbook's own `*`
  // legend confirms the form is for the four contractual services. The
  // workbook's «الخدمة | Service Type» row IS the service-selection step the
  // page already opens with; it is not duplicated as a schema field.
  selectableServices: ['trainer', 'consultant', 'content-developer', 'question-writer'],
  sections: [
    { id: 'personal', titleAr: 'المعلومات الأساسية', titleEn: 'Basic information', order: 1 },
    {
      // Repeatable, ≥1 entry (PM, 2026-09-18): «an applicant may add multiple
      // qualifications; at least one entry is required, and every field inside
      // an entry is mandatory».
      id: 'education',
      titleAr: 'المؤهلات العلمية',
      titleEn: 'Educational qualifications',
      order: 2,
      repeatable: {
        minEntries: 1,
        addLabelAr: '+ إضافة مؤهل',
        addLabelEn: '+ Add qualification',
        entryLabelAr: 'المؤهل',
        entryLabelEn: 'Qualification',
      },
    },
    {
      // Repeatable and entirely OPTIONAL (PM, 2026-09-18): «an applicant may
      // have zero professional certifications» — hence `minEntries: 0` and
      // `requiredFor: []` on every field of the section, for all 4 services.
      id: 'certifications',
      titleAr: 'الشهادات المهنية',
      titleEn: 'Professional certifications',
      order: 3,
      repeatable: {
        minEntries: 0,
        addLabelAr: '+ إضافة شهادة',
        addLabelEn: '+ Add certificate',
        entryLabelAr: 'الشهادة',
        entryLabelEn: 'Certificate',
      },
    },
    {
      // Repeatable, ≥1 entry (PM, 2026-09-18): «multiple past roles».
      id: 'experience',
      titleAr: 'الخبرة العملية',
      titleEn: 'Practical experience',
      order: 4,
      repeatable: {
        minEntries: 1,
        addLabelAr: '+ إضافة خبرة',
        addLabelEn: '+ Add experience',
        entryLabelAr: 'الخبرة',
        entryLabelEn: 'Experience',
      },
    },
    {
      id: 'training-content',
      titleAr: 'الخبرة التدريبية والمحتوى',
      titleEn: 'Training experience & content',
      order: 5,
    },
    {
      id: 'availability',
      titleAr: 'الجاهزية والإتاحة',
      titleEn: 'Availability & readiness',
      order: 6,
    },
  ],
  fields: [
    /* ── 1 · Basic Information ──────────────────────────────────────────
     * Names/ID/DOB/nationality/gender map to FAST base-profile tables in the
     * workbook (`dbo.AspNetUsers` / `profile.UserProfile`), so they carry
     * `sso-profile` ownership: entered here at application time, but
     * change-request-only later on the profile (`BR-0404`, P-134/P-135). */
    {
      id: 'firstNameAr',
      type: 'text',
      sectionId: 'personal',
      labelAr: 'الاسم الأول (بالعربية)',
      labelEn: 'First name (Arabic)',
      requiredFor: ALL_SERVICES,
      ownership: 'sso-profile',
      order: 1,
    },
    {
      id: 'middleNameAr',
      type: 'text',
      sectionId: 'personal',
      labelAr: 'الاسم الثاني (بالعربية)',
      labelEn: 'Middle name (Arabic)',
      requiredFor: ALL_SERVICES,
      ownership: 'sso-profile',
      order: 2,
    },
    {
      id: 'thirdNameAr',
      type: 'text',
      sectionId: 'personal',
      labelAr: 'الاسم الثالث (بالعربية)',
      labelEn: 'Third name (Arabic)',
      requiredFor: ALL_SERVICES,
      ownership: 'sso-profile',
      order: 3,
    },
    {
      id: 'lastNameAr',
      type: 'text',
      sectionId: 'personal',
      labelAr: 'الاسم الأخير (بالعربية)',
      labelEn: 'Last name (Arabic)',
      requiredFor: ALL_SERVICES,
      ownership: 'sso-profile',
      order: 4,
    },
    {
      id: 'firstNameEn',
      type: 'text',
      sectionId: 'personal',
      labelAr: 'الاسم الأول (بالإنجليزية)',
      labelEn: 'First name (English)',
      requiredFor: ALL_SERVICES,
      ownership: 'sso-profile',
      order: 5,
    },
    {
      id: 'middleNameEn',
      type: 'text',
      sectionId: 'personal',
      labelAr: 'الاسم الثاني (بالإنجليزية)',
      labelEn: 'Middle name (English)',
      requiredFor: ALL_SERVICES,
      ownership: 'sso-profile',
      order: 6,
    },
    {
      id: 'thirdNameEn',
      type: 'text',
      sectionId: 'personal',
      labelAr: 'الاسم الثالث (بالإنجليزية)',
      labelEn: 'Third name (English)',
      requiredFor: ALL_SERVICES,
      ownership: 'sso-profile',
      order: 7,
    },
    {
      id: 'lastNameEn',
      type: 'text',
      sectionId: 'personal',
      labelAr: 'الاسم الأخير (بالإنجليزية)',
      labelEn: 'Last name (English)',
      requiredFor: ALL_SERVICES,
      ownership: 'sso-profile',
      order: 8,
    },
    {
      // ⚠️ One form field, several DB columns (IdNumber / ResidencyNumber /
      // PassportNumber / GulfIdNumber) — the workbook says the ID-type routing
      // mechanism «needs a defined mechanism». One field, as the form shows;
      // the routing stays an open backend question, not a client guess.
      id: 'idNumber',
      type: 'text',
      sectionId: 'personal',
      labelAr: 'رقم الهوية الوطنية / هوية مقيم / جواز السفر',
      labelEn: 'National ID / Iqama / passport number',
      requiredFor: ALL_SERVICES,
      ownership: 'sso-profile',
      // The API's rule, mirrored so the mock rejects what the API rejects.
      validation: {
        maxLength: 20,
        pattern: '^(?:[12][0-9]{9}|[A-Za-z][A-Za-z0-9]{5,19})$',
        patternMessageAr:
          'أدخل رقم هوية أو إقامة من 10 أرقام يبدأ بـ 1 أو 2، أو رقم جواز سفر صحيحًا.',
        patternMessageEn:
          'Enter a 10-digit National ID or Iqama starting with 1 or 2, or a valid passport number.',
      },
      order: 9,
    },
    {
      id: 'dateOfBirth',
      type: 'date',
      sectionId: 'personal',
      labelAr: 'تاريخ الميلاد',
      labelEn: 'Date of birth',
      requiredFor: ALL_SERVICES,
      ownership: 'sso-profile',
      validation: { maxDate: 'today' },
      order: 10,
    },
    {
      id: 'nationality',
      type: 'select',
      sectionId: 'personal',
      labelAr: 'الجنسية',
      labelEn: 'Nationality',
      requiredFor: ALL_SERVICES,
      // ⚠️ PROVISIONAL — the workbook names a dropdown but supplies no country
      // list; replaced by the approved lookup when it arrives.
      options: [
        { value: 'sa', labelAr: 'السعودية', labelEn: 'Saudi Arabia' },
        { value: 'gcc', labelAr: 'دول مجلس التعاون', labelEn: 'GCC countries' },
        { value: 'other', labelAr: 'أخرى', labelEn: 'Other' },
      ],
      ownership: 'sso-profile',
      order: 11,
    },
    {
      id: 'gender',
      type: 'select',
      sectionId: 'personal',
      labelAr: 'الجنس',
      labelEn: 'Gender',
      requiredFor: ALL_SERVICES,
      options: [
        { value: 'male', labelAr: 'ذكر', labelEn: 'Male' },
        { value: 'female', labelAr: 'أنثى', labelEn: 'Female' },
      ],
      ownership: 'sso-profile',
      order: 12,
    },
    {
      /*
       * «المجال» — the applicant's general field, and the source of
       * Evaluation-Matrix criterion #3. Options: the owner-supplied
       * «مجال التخصص» list, MINUS the 13 values the business classified as
       * master-data problems (tools, certifications, methodologies,
       * programmes, service types, a catch-all) on 2026-09-28.
       *
       * ⚠️ Nothing is removed from the master list. Every earlier schema
       * version keeps its own frozen copy of all 147, so an application that
       * selected one of them stays readable forever — only NEW applications
       * stop being offered them. Related open item: `Q16`.
       */
      id: 'domain',
      type: 'select',
      sectionId: 'personal',
      labelAr: 'المجال',
      labelEn: 'Field / domain',
      helpAr: 'المجال العام للمتقدم (مالية، تدريب، تقنية...).',
      helpEn: 'The applicant’s general field (finance, training, technical…).',
      requiredFor: ALL_SERVICES,
      options: activeDomains(SPECIALIZATION_DOMAIN_OPTIONS),
      ownership: 'expert-hub',
      order: 13,
    },
    {
      id: 'linkedin',
      type: 'text',
      sectionId: 'personal',
      labelAr: 'حساب LinkedIn',
      labelEn: 'LinkedIn profile',
      requiredFor: [],
      validation: URL_VALIDATION,
      ownership: 'expert-hub',
      order: 14,
    },
    {
      id: 'personalWebsite',
      type: 'text',
      sectionId: 'personal',
      labelAr: 'الموقع الشخصي',
      labelEn: 'Personal website',
      requiredFor: [],
      validation: URL_VALIDATION,
      ownership: 'expert-hub',
      order: 15,
    },

    /* ── 2 · Educational Qualifications ─────────────────────────────────── */
    {
      id: 'qualificationType',
      type: 'select',
      sectionId: 'education',
      labelAr: 'المؤهل',
      labelEn: 'Qualification',
      requiredFor: ALL_SERVICES,
      // The matrix's four values (English wording); codes unchanged.
      options: [
        { value: 'diploma', labelAr: 'دبلوم', labelEn: 'Diploma' },
        { value: 'bachelor', labelAr: 'بكالوريوس', labelEn: 'Bachelor' },
        { value: 'master', labelAr: 'ماجستير', labelEn: 'Master' },
        { value: 'doctorate', labelAr: 'دكتوراه', labelEn: 'PhD' },
      ],
      ownership: 'expert-hub',
      order: 1,
    },
    {
      // Free text — the matrix table's own type (business decision,
      // 2026-09-16). FAST holds the same field as free text too
      // (`qualifications-education.generalSpecialization`); no authoritative list
      // exists to offer instead.
      id: 'generalSpecialization',
      type: 'text',
      sectionId: 'education',
      labelAr: 'التخصص العام',
      labelEn: 'General specialization',
      requiredFor: ALL_SERVICES,
      ownership: 'expert-hub',
      order: 2,
    },
    {
      // The owner's «جميع التخصصات» list, delivered 2026-09-21 — this closes
      // the predecessor's «has not reached this repository» note. The list's
      // own «مدى الصلة» column is NOT carried: the frontend collects, it
      // never scores.
      id: 'specializationDetail',
      type: 'select',
      sectionId: 'education',
      labelAr: 'التخصص',
      labelEn: 'Specialization',
      requiredFor: ALL_SERVICES,
      options: asOptions(ACADEMIC_SPECIALIZATION_OPTIONS),
      ownership: 'expert-hub',
      order: 3,
    },
    {
      // The owner's «جميع الجامعات» list, delivered 2026-09-21 (517 entries).
      id: 'universityName',
      type: 'select',
      sectionId: 'education',
      labelAr: 'اسم الجامعة',
      labelEn: 'University name',
      requiredFor: ALL_SERVICES,
      options: asOptions(UNIVERSITY_OPTIONS),
      ownership: 'expert-hub',
      order: 4,
    },
    {
      // ⚠️ The «at least 3 years old» rule from the earlier reference form is
      // marked «needs confirmation» in the workbook — NOT enforced here.
      id: 'qualificationDate',
      type: 'date',
      sectionId: 'education',
      labelAr: 'تاريخ الحصول على المؤهل',
      labelEn: 'Date obtained',
      requiredFor: ALL_SERVICES,
      ownership: 'expert-hub',
      order: 5,
    },

    /* ── 3 · Professional Certifications ────────────────────────────────
     * REPEATABLE and entirely OPTIONAL for all four services (PM, 2026-09-18:
     * «an applicant may have zero professional certifications»). Every field
     * below therefore carries `requiredFor: []` — the section as a whole is
     * what became optional, not one row of it. */
    {
      // The classified certification master list, delivered 2026-09-21 (228
      // entries). Its `relevant` / `isGlobal` columns are NOT carried: the
      // Evaluation Matrix reads them server-side, the form only collects.
      id: 'certificateName',
      type: 'select',
      sectionId: 'certifications',
      labelAr: 'اسم الشهادة',
      labelEn: 'Certificate name',
      requiredFor: [],
      options: asOptions(PROFESSIONAL_CERTIFICATION_OPTIONS),
      ownership: 'expert-hub',
      order: 1,
    },
    {
      id: 'issuingInstitution',
      type: 'text',
      sectionId: 'certifications',
      labelAr: 'الجهة المانحة',
      labelEn: 'Issuing institution',
      requiredFor: [],
      ownership: 'expert-hub',
      order: 2,
    },
    {
      id: 'certificateDate',
      type: 'date',
      sectionId: 'certifications',
      labelAr: 'تاريخ الحصول',
      labelEn: 'Date obtained',
      requiredFor: [],
      ownership: 'expert-hub',
      order: 3,
    },
    {
      id: 'certificateAttachmentName',
      type: 'text',
      sectionId: 'certifications',
      labelAr: 'اسم المرفق',
      labelEn: 'Attachment name',
      requiredFor: [],
      ownership: 'expert-hub',
      order: 4,
    },

    /* ── 4 · Practical Experience ─────────────────────────────────────── */
    {
      id: 'jobTitle',
      type: 'text',
      sectionId: 'experience',
      labelAr: 'المسمى الوظيفي',
      labelEn: 'Job title',
      requiredFor: ALL_SERVICES,
      ownership: 'expert-hub',
      order: 1,
    },
    {
      id: 'organization',
      type: 'text',
      sectionId: 'experience',
      labelAr: 'جهة العمل',
      labelEn: 'Organization name',
      requiredFor: ALL_SERVICES,
      ownership: 'expert-hub',
      order: 2,
    },
    {
      id: 'currentlyEmployed',
      type: 'checkbox',
      sectionId: 'experience',
      labelAr: 'أنا أعمل حاليًا في هذا المنصب',
      labelEn: 'I currently work in this position',
      requiredFor: [],
      ownership: 'expert-hub',
      order: 3,
    },
    {
      id: 'partTimeRole',
      type: 'checkbox',
      sectionId: 'experience',
      labelAr: 'هل العمل بدوام جزئي؟',
      labelEn: 'Is this a part-time role?',
      requiredFor: [],
      ownership: 'expert-hub',
      order: 4,
    },
    {
      id: 'experienceStartDate',
      type: 'date',
      sectionId: 'experience',
      labelAr: 'تاريخ البدء',
      labelEn: 'Start date',
      requiredFor: ALL_SERVICES,
      ownership: 'expert-hub',
      order: 5,
    },
    {
      id: 'responsibilities',
      type: 'textarea',
      sectionId: 'experience',
      labelAr: 'المسؤوليات',
      labelEn: 'Responsibilities',
      helpAr: 'أدخل كل مسؤولية في سطر مستقل.',
      helpEn: 'Enter each item on a new line.',
      requiredFor: ALL_SERVICES,
      ownership: 'expert-hub',
      order: 6,
    },
    {
      // Confirmed rule: shown only while «أنا أعمل حاليًا في هذا المنصب» is off.
      // Optional — REQUIRES REVIEW (no mandatory flag in the matrix).
      id: 'experienceEndDate',
      type: 'date',
      sectionId: 'experience',
      labelAr: 'تاريخ الانتهاء',
      labelEn: 'End date',
      requiredFor: [],
      dependsOn: { fieldId: 'currentlyEmployed', notEquals: true },
      ownership: 'expert-hub',
      order: 7,
    },
    {
      // Option set REPLACED 2026-09-19 to match the Evaluation Matrix
      // (Notion, Form 4 #8). ⚠️ The buckets are the workbook's own and they
      // skip 10→11 — «5 to 10» is followed by «11 to 15», so a 10.5-year
      // career falls between two buckets. Kept verbatim rather than rounded
      // into something nobody approved: BUSINESS_REVIEW_REQUIRED.
      id: 'yearsOfExperience',
      type: 'select',
      sectionId: 'experience',
      labelAr: 'عدد سنوات الخبرة',
      labelEn: 'Years of experience',
      requiredFor: [],
      options: [
        { value: '1-5', labelAr: 'من 1 إلى 5 سنوات', labelEn: '1 to 5 years' },
        { value: '5-10', labelAr: 'من 5 إلى 10 سنوات', labelEn: '5 to 10 years' },
        { value: '11-15', labelAr: 'من 11 إلى 15 سنة', labelEn: '11 to 15 years' },
        { value: '16-plus', labelAr: '16 سنة فأكثر', labelEn: '16+ years' },
      ],
      ownership: 'expert-hub',
      order: 8,
    },

    /* ── 5 · Training Experience & Content ──────────────────────────────
     * The workbook marks the two multi-selects «Mandatory (assumed)» — kept
     * required, with the assumption recorded here rather than silently. Their
     * Arabic option labels are working translations of the matrix's
     * English-only option lists (TEMPORARY_TRANSLATION_REQUIRES_BUSINESS_REVIEW). */
    {
      id: 'participationTypes',
      type: 'multi-select',
      sectionId: 'training-content',
      labelAr: 'أنواع المشاركات السابقة',
      labelEn: 'Previous participation types',
      helpAr: 'اختر كل ما ينطبق.',
      helpEn: 'Select all that apply.',
      requiredFor: ALL_SERVICES,
      options: [
        {
          value: 'official-programs',
          labelAr: 'برامج تدريبية رسمية',
          labelEn: 'Official training programs',
        },
        { value: 'workshops', labelAr: 'ورش عمل متخصصة', labelEn: 'Specialized workshops' },
        { value: 'academic-lectures', labelAr: 'محاضرات أكاديمية', labelEn: 'Academic lectures' },
        {
          value: 'conferences',
          labelAr: 'مؤتمرات وملتقيات مهنية',
          labelEn: 'Conferences & professional forums',
        },
        { value: 'panels', labelAr: 'حلقات نقاش', labelEn: 'Panel discussions' },
        {
          value: 'mentoring',
          labelAr: 'إرشاد وتوجيه فردي',
          labelEn: 'Individual mentoring/coaching',
        },
        {
          value: 'writing-research',
          labelAr: 'كتابة متخصصة ونشر أوراق بحثية',
          labelEn: 'Specialized writing & research paper publishing',
        },
        {
          value: 'digital-content',
          labelAr: 'محتوى رقمي / بودكاست / يوتيوب',
          labelEn: 'Digital content / podcast / YouTube',
        },
      ],
      ownership: 'expert-hub',
      order: 1,
    },
    {
      id: 'audiences',
      type: 'multi-select',
      sectionId: 'training-content',
      labelAr: 'الفئات التي يمكنك مخاطبتها بفعالية',
      labelEn: 'Audiences you can effectively address',
      helpAr: 'اختر كل ما ينطبق.',
      helpEn: 'Select all that apply.',
      requiredFor: ALL_SERVICES,
      options: [
        { value: 'university-students', labelAr: 'طلاب الجامعات', labelEn: 'University students' },
        { value: 'new-graduates', labelAr: 'الخريجون الجدد', labelEn: 'New graduates' },
        {
          value: 'mid-career',
          labelAr: 'المهنيون في منتصف المسار',
          labelEn: 'Mid-career professionals',
        },
        {
          value: 'executives',
          labelAr: 'القيادات التنفيذية والعليا',
          labelEn: 'Executive & senior leadership',
        },
        { value: 'general-public', labelAr: 'عموم الجمهور', labelEn: 'General public' },
      ],
      ownership: 'expert-hub',
      order: 2,
    },
    {
      // «اللغة». The id is the one matching already reads (`AssignmentEndpoints`),
      // and the codes are the centre request's language codes, so the two meet.
      // Arabic option labels: the approved Assignment Matrix's wording for the
      // same `lookup.Language` values («عربي، إنجليزي»); English: this matrix's
      // own «Arabic, English». Codes unchanged. Optional — REQUIRES REVIEW.
      id: 'trainingLanguages',
      type: 'select',
      sectionId: 'training-content',
      labelAr: 'اللغة',
      labelEn: 'Language',
      // «ثنائي اللغة» added 2026-09-21: «Application Fields by Service» lists
      // Arabic / English / Bilingual, and the Evaluation Matrix scores
      // «ثنائي اللغة» at 0.02 — a value the form could not previously produce.
      requiredFor: [],
      options: [
        { value: 'ar', labelAr: 'عربي', labelEn: 'Arabic' },
        { value: 'en', labelAr: 'إنجليزي', labelEn: 'English' },
        { value: 'bilingual', labelAr: 'ثنائي اللغة', labelEn: 'Bilingual' },
      ],
      ownership: 'expert-hub',
      order: 3,
    },
    {
      // Business decision (2026-09-16): Yes / No. Optional.
      id: 'hasTrainedBefore',
      type: 'select',
      sectionId: 'training-content',
      labelAr: 'هل سبق لك التدريب أو التحدث في فعاليات؟',
      labelEn: 'Have you previously trained or spoken at events?',
      requiredFor: [],
      options: [
        { value: 'yes', labelAr: 'نعم', labelEn: 'Yes' },
        { value: 'no', labelAr: 'لا', labelEn: 'No' },
      ],
      ownership: 'expert-hub',
      order: 4,
    },
    {
      // Shown only for «نعم». The same one-item-per-line text the form already
      // uses for «المسؤوليات», the closest existing experience structure.
      // Label wording: business decision of 2026-09-16 (final). Optional.
      id: 'trainedBeforeDetails',
      type: 'textarea',
      sectionId: 'training-content',
      labelAr: 'تفاصيل الخبرات السابقة في التدريب أو التحدث في الفعاليات',
      labelEn: 'Previous training or speaking experience details',
      helpAr: 'أدخل كل تجربة في سطر مستقل.',
      helpEn: 'Enter each item on a new line.',
      requiredFor: [],
      dependsOn: { fieldId: 'hasTrainedBefore', equals: 'yes' },
      ownership: 'expert-hub',
      order: 5,
    },
    {
      // Training materials — Notion's «Application Fields by Service» excludes
      // Consultant only; a consultant answers `readyConsultingMaterials`
      // instead. `requiredFor` unchanged (all four): a service that cannot see
      // the field is never blocked by it.
      id: 'hasReadyMaterials',
      type: 'select',
      sectionId: 'training-content',
      labelAr: 'هل لديك مواد أو حقائب تدريبية جاهزة؟',
      labelEn: 'Do you have ready-made training materials or kits?',
      requiredFor: ALL_SERVICES,
      visibleFor: ['trainer', 'content-developer', 'question-writer'],
      // ⚠️ PROVISIONAL — dropdown named without values in the workbook.
      options: YES_NO_OPTIONS,
      ownership: 'expert-hub',
      order: 6,
    },
    {
      id: 'preferredDeliveryMode',
      type: 'select',
      sectionId: 'training-content',
      labelAr: 'نمط التقديم المفضل لديك',
      labelEn: 'Your preferred delivery mode',
      // Trainer-only, and the two lists must AGREE. It was `ALL_SERVICES` while
      // `visibleFor` was already `['trainer']` — inert, because both validators
      // skip a hidden field, but it declared that a consultant must answer a
      // question they never see. Business decision, 2026-09-29.
      requiredFor: ['trainer'],
      // The matrix's two values, in its order. TEMPORARY_TRANSLATION_REQUIRES_BUSINESS_REVIEW
      // — English option labels. The 3rd option «حضوري وعن بعد» was added
      // 2026-09-19 and resolves EVAL-GAP-08; Notion scopes the whole field to
      // the Training service.
      options: [
        { value: 'online', labelAr: 'عن بعد', labelEn: 'Online' },
        { value: 'onsite', labelAr: 'حضوري', labelEn: 'On-site' },
        { value: 'blended', labelAr: 'حضوري وعن بعد', labelEn: 'On-site and online' },
      ],
      visibleFor: ['trainer'],
      ownership: 'expert-hub',
      order: 7,
    },
    {
      id: 'portfolioLinks',
      type: 'text',
      sectionId: 'training-content',
      labelAr: 'روابط نماذج الأعمال أو مقاطع تقديمية',
      labelEn: 'Portfolio / sample work links',
      helpAr: 'رابط لفيديو تعريفي أو ملف عرض أو حلقة بودكاست أو أي نموذج من أعمالك.',
      helpEn:
        'A link to an intro video, presentation, podcast episode, or any sample of your work.',
      requiredFor: [],
      validation: URL_VALIDATION,
      ownership: 'expert-hub',
      order: 8,
    },
    /*
     * The four dropdowns below are new in this version. All optional —
     * REQUIRES REVIEW. TEMPORARY_TRANSLATION_REQUIRES_BUSINESS_REVIEW — their
     * Arabic option labels (the matrix gives English values).
     * «هل سبق لك التدريب أو التحدث في فعاليات؟» is absent: no values given.
     */
    /*
     * «سنوات الخبرة» split per service (2026-09-19/2026-09-21). One catch-all
     * range — «التدريب أو تطوير المحتوى أو الاستشارات» — could not be scored,
     * because the Evaluation Matrix weighs the years **of the service applied
     * for**. Same four codes and labels in all three; only the audience and
     * the wording differ.
     */
    {
      id: 'trainingExperienceYears',
      type: 'select',
      sectionId: 'training-content',
      labelAr: 'سنوات الخبرة التدريبية',
      labelEn: 'Years of training experience',
      requiredFor: ['trainer'],
      visibleFor: ['trainer'],
      options: EXPERIENCE_YEAR_OPTIONS,
      ownership: 'expert-hub',
      order: 9,
    },
    {
      id: 'consultingExperienceYears',
      type: 'select',
      sectionId: 'training-content',
      labelAr: 'سنوات خبرة استشارات',
      labelEn: 'Years of consulting experience',
      requiredFor: ['consultant'],
      visibleFor: ['consultant'],
      options: EXPERIENCE_YEAR_OPTIONS,
      ownership: 'expert-hub',
      order: 9.1,
    },
    {
      // New field, 2026-09-19 — resolves EVAL-GAP-09. DISTINCT from
      // `hasReadyMaterials`: that one asks about training kits and is hidden
      // from consultants; this one asks a consultant about consulting
      // material. Two questions, two answers, never merged.
      id: 'readyConsultingMaterials',
      type: 'select',
      sectionId: 'training-content',
      labelAr: 'هل لديك مواد أو استشارات جاهزة؟',
      labelEn: 'Do you have ready consulting materials?',
      requiredFor: ['consultant'],
      visibleFor: ['consultant'],
      options: YES_NO_OPTIONS,
      ownership: 'expert-hub',
      order: 9.2,
    },
    {
      id: 'contentQuestionExperienceYears',
      type: 'select',
      sectionId: 'training-content',
      labelAr: 'الخبرة في تطوير المحتوى أو كتابة الأسئلة بالسنوات',
      labelEn: 'Years of experience — content development / question writing',
      requiredFor: ['content-developer', 'question-writer'],
      visibleFor: ['content-developer', 'question-writer'],
      options: EXPERIENCE_YEAR_OPTIONS,
      ownership: 'expert-hub',
      order: 9.3,
    },
    {
      // ⚠️ The matrix's ranges start at 10 days — no bucket below it.
      id: 'trainingDaysFinancialSector',
      type: 'select',
      sectionId: 'training-content',
      labelAr: 'عدد أيام تدريب البنوك والخدمات المالية والتأمين خلال آخر 12 شهرًا',
      labelEn: 'Training days (financial sector) — last 12 months',
      requiredFor: [],
      options: [
        { value: '10-20', labelAr: '10–20 يومًا', labelEn: '10–20 days' },
        { value: '21-45', labelAr: '21–45 يومًا', labelEn: '21–45 days' },
        { value: '46-75', labelAr: '46–75 يومًا', labelEn: '46–75 days' },
        { value: '76+', labelAr: '76 يومًا فأكثر', labelEn: '76+ days' },
      ],
      ownership: 'expert-hub',
      order: 10,
    },
    {
      // A CATEGORY preference (business decision, 2026-09-16): the kind of
      // engagement the expert prefers — Academy programmes or events. NOT the
      // FAST programme catalogue and never a FAST programme id; a «specific
      // preferred programmes» list would be a separate field. Option labels:
      // «الأكاديمية المالية» is the Academy's own name.
      id: 'preferredPrograms',
      type: 'select',
      sectionId: 'training-content',
      labelAr:
        'بناءً على اطلاعكم على موقع الأكاديمية المالية، ما هي أبرز البرامج التدريبية أو الورش أو الفعاليات التي ترغبون في تقديمها؟',
      labelEn: 'Preferred programs/workshops to deliver',
      requiredFor: [],
      options: [
        { value: 'fa-programs', labelAr: 'برامج الأكاديمية المالية', labelEn: 'FA Programs' },
        { value: 'events', labelAr: 'الفعاليات', labelEn: 'Events' },
      ],
      ownership: 'expert-hub',
      order: 11,
    },
    {
      id: 'trainingDaysSameTopics',
      type: 'select',
      sectionId: 'training-content',
      labelAr: 'عدد أيام التدريب لذات المواضيع خلال آخر 12 شهرًا',
      labelEn: 'Training days (same topics) — last 12 months',
      requiredFor: [],
      options: [
        { value: 'less-than-10', labelAr: 'أقل من 10 أيام', labelEn: 'Less than 10 days' },
        { value: '11-20', labelAr: '11–20 يومًا', labelEn: '11–20 days' },
        { value: '21-45', labelAr: '21–45 يومًا', labelEn: '21–45 days' },
        { value: '45+', labelAr: 'أكثر من 45 يومًا', labelEn: '45+ days' },
      ],
      ownership: 'expert-hub',
      order: 12,
    },

    /* ── 6 · Availability & Readiness ───────────────────────────────────
     * Rows 5–6 (weekday availability, hours/day) name dropdowns without
     * values — absent, REQUIRES REVIEW. */
    {
      // New field, 2026-09-20 — resolves EVAL-GAP-06. Notion's «Application
      // Fields by Service» makes it the ONLY field in this section that
      // applies to all four services; the rest are per-service or optional.
      id: 'engagementMode',
      type: 'select',
      sectionId: 'availability',
      labelAr: 'نمط التعامل',
      labelEn: 'Engagement mode',
      requiredFor: ALL_SERVICES,
      options: [
        { value: 'full-time', labelAr: 'تفرغ كامل', labelEn: 'Full-time' },
        { value: 'part-time', labelAr: 'تفرغ جزئي', labelEn: 'Part-time' },
      ],
      ownership: 'expert-hub',
      order: 0,
    },
    {
      id: 'annualAvailability',
      type: 'select',
      sectionId: 'availability',
      labelAr: 'مدى التوفر خلال العام',
      labelEn: 'Availability throughout the year',
      requiredFor: ALL_SERVICES,
      // The matrix's four values. TEMPORARY_TRANSLATION_REQUIRES_BUSINESS_REVIEW
      // — Arabic option labels.
      options: [
        { value: 'throughout-year', labelAr: 'طوال العام', labelEn: 'Throughout the year' },
        { value: 'specific-months', labelAr: 'أشهر محددة', labelEn: 'Specific months' },
        { value: 'specific-periods', labelAr: 'فترات محددة', labelEn: 'Specific periods' },
        { value: 'upon-request', labelAr: 'حسب الطلب', labelEn: 'Upon request' },
      ],
      ownership: 'expert-hub',
      order: 1,
    },
    {
      id: 'estimatedAnnualEngagements',
      type: 'select',
      sectionId: 'availability',
      labelAr: 'عدد المشاركات الممكنة سنويًا (تقريبًا)',
      labelEn: 'Estimated number of engagements per year',
      requiredFor: ALL_SERVICES,
      // ⚠️ PROVISIONAL — dropdown named without values in the workbook.
      options: [
        { value: '1-3', labelAr: '1–3 مشاركات', labelEn: '1–3 engagements' },
        { value: '4-6', labelAr: '4–6 مشاركات', labelEn: '4–6 engagements' },
        { value: '7+', labelAr: 'أكثر من 6 مشاركات', labelEn: 'More than 6 engagements' },
      ],
      ownership: 'expert-hub',
      order: 2,
    },
    {
      // The workbook recommends a multi-select over a cities table later;
      // today it is the form's Text field, exactly as supplied.
      id: 'inPersonCities',
      type: 'text',
      sectionId: 'availability',
      labelAr: 'المدن المتاح فيها الحضور الشخصي',
      labelEn: 'Cities available for in-person attendance',
      helpAr: 'مثال: الرياض، جدة، الدمام، أبوظبي.',
      helpEn: 'Example: Riyadh, Jeddah, Dammam, Abu Dhabi.',
      requiredFor: ALL_SERVICES,
      ownership: 'expert-hub',
      order: 3,
    },
    {
      id: 'preferredEngagementTypes',
      type: 'multi-select',
      sectionId: 'availability',
      labelAr: 'أنواع المشاركات التي تفضلها',
      labelEn: 'Preferred engagement types',
      helpAr: 'اختر كل ما ينطبق.',
      helpEn: 'Select all that apply.',
      requiredFor: ALL_SERVICES,
      options: [
        {
          value: 'short-training',
          labelAr: 'تدريب قصير (يوم أو أيام)',
          labelEn: 'Short-term training (day(s))',
        },
        {
          value: 'long-training',
          labelAr: 'تدريب طويل (أسابيع)',
          labelEn: 'Long-term training (weeks)',
        },
        { value: 'intensive-workshops', labelAr: 'ورش عمل مكثفة', labelEn: 'Intensive workshops' },
        {
          value: 'panels-hosting',
          labelAr: 'حلقات نقاش واستضافات',
          labelEn: 'Panel discussions & hosting',
        },
        { value: 'remote-training', labelAr: 'تدريب عن بُعد', labelEn: 'Remote/virtual training' },
        {
          value: 'community-initiatives',
          labelAr: 'مبادرات مجتمعية وتوعوية',
          labelEn: 'Community & awareness initiatives',
        },
        {
          value: 'student-programs',
          labelAr: 'برامج طلابية وجامعية',
          labelEn: 'Student & university programs',
        },
        {
          value: 'ongoing-mentoring',
          labelAr: 'إرشاد فردي مستمر',
          labelEn: 'Ongoing individual mentoring',
        },
      ],
      ownership: 'expert-hub',
      order: 4,
    },
    {
      // Business decision (2026-09-16): the seven days, multi-select. Optional,
      // and not read by matching or screening until their rules are approved.
      id: 'weekdayAvailability',
      type: 'multi-select',
      sectionId: 'availability',
      labelAr: 'متاح للتدريب أو الاستشارات خلال أيام الأسبوع',
      labelEn: 'Available during weekdays',
      helpAr: 'اختر كل ما ينطبق.',
      helpEn: 'Select all that apply.',
      requiredFor: [],
      options: [
        { value: 'sunday', labelAr: 'الأحد', labelEn: 'Sunday' },
        { value: 'monday', labelAr: 'الاثنين', labelEn: 'Monday' },
        { value: 'tuesday', labelAr: 'الثلاثاء', labelEn: 'Tuesday' },
        { value: 'wednesday', labelAr: 'الأربعاء', labelEn: 'Wednesday' },
        { value: 'thursday', labelAr: 'الخميس', labelEn: 'Thursday' },
        { value: 'friday', labelAr: 'الجمعة', labelEn: 'Friday' },
        { value: 'saturday', labelAr: 'السبت', labelEn: 'Saturday' },
      ],
      ownership: 'expert-hub',
      order: 5,
    },
    {
      // Business decision (2026-09-16): a number, technically 1–24 — no
      // business ranges. Optional, and not scored.
      id: 'dailyTrainingHours',
      type: 'number',
      sectionId: 'availability',
      labelAr: 'متاح لعدد من ساعات التدريب أو الاستشارات في اليوم',
      labelEn: 'Available hours per day',
      requiredFor: [],
      validation: {
        pattern: '^[0-9]+$',
        min: 1,
        max: 24,
        patternMessageAr: 'أدخل عددًا صحيحًا من 1 إلى 24.',
        patternMessageEn: 'Enter a whole number from 1 to 24.',
      },
      ownership: 'expert-hub',
      order: 6,
    },
    {
      // TEMPORARY_TRANSLATION_REQUIRES_BUSINESS_REVIEW — English option labels.
      // Optional — REQUIRES REVIEW.
      id: 'preferredPeriods',
      type: 'select',
      sectionId: 'availability',
      labelAr: 'الفترات المفضلة',
      labelEn: 'Preferred periods',
      requiredFor: [],
      options: [
        { value: 'morning', labelAr: 'صباحًا', labelEn: 'Morning' },
        { value: 'noon', labelAr: 'ظهرًا', labelEn: 'Noon' },
        { value: 'evening', labelAr: 'مساءً', labelEn: 'Evening' },
        { value: 'weekend', labelAr: 'نهاية الأسبوع', labelEn: 'Weekend' },
      ],
      ownership: 'expert-hub',
      order: 7,
    },
  ],
  // The workbook's file fields, as attachment rules. ⚠️ It marks formats and
  // sizes as «still need to be defined» — so the values reuse J-01's APPROVED
  // attachment-validation table unchanged (images JPG/PNG · documents
  // PDF/DOC/DOCX · 1 MB), exactly as before.
  attachments: [
    {
      id: 'photo',
      labelAr: 'الصورة الشخصية',
      labelEn: 'Profile picture',
      acceptedFormats: ['jpg', 'jpeg', 'png'],
      maxSizeMb: 1,
      maxCount: 1,
      requiredFor: [], // the workbook marks it Optional
    },
    {
      id: 'cv',
      labelAr: 'السيرة الذاتية',
      labelEn: 'CV / résumé',
      acceptedFormats: ['pdf', 'doc', 'docx'],
      maxSizeMb: 1,
      maxCount: 1,
      requiredFor: ALL_SERVICES,
    },
    {
      // PER-ENTRY: every qualification carries its own certificate, so
      // `maxCount: 1` is one file **per education entry**, not per
      // application. Rendered inside the entry, never on the attachments step.
      id: 'qualification-certificate',
      labelAr: 'شهادة التأهيل العلمي',
      labelEn: 'Qualification certificate',
      acceptedFormats: ['pdf', 'doc', 'docx'],
      maxSizeMb: 1,
      maxCount: 1,
      requiredFor: ALL_SERVICES,
      perEntryOf: 'education',
    },
    {
      // PER-ENTRY, same shape. `certifications` has `minEntries: 0`, so an
      // applicant with no certificates is asked for no file at all — but a
      // certificate they DO claim must be evidenced.
      id: 'professional-certificate',
      labelAr: 'الشهادة المهنية',
      labelEn: 'Professional certificate',
      acceptedFormats: ['pdf', 'doc', 'docx'],
      maxSizeMb: 1,
      maxCount: 1,
      requiredFor: ALL_SERVICES,
      perEntryOf: 'certifications',
    },
    {
      // «إحالات العملاء / شهادات المشاركين» — a document, so J-01's document
      // rule. Optional — REQUIRES REVIEW.
      //
      // ⚠️ `maxCount` raised from 1 to 20 (2026-09-21). Evaluation-Matrix
      // criterion #5 scores the NUMBER OF FILES on this field — 0 / 1–3 /
      // 4–7 / 8+ — so a cap of 1 made its top three buckets unreachable. The
      // ceiling must clear 8; 20 is a headroom figure, not an approved limit
      // (BUSINESS_REVIEW_REQUIRED).
      id: 'client-referrals',
      labelAr: 'إحالات العملاء / شهادات المشاركين',
      labelEn: 'Client referrals / testimonials',
      acceptedFormats: ['pdf', 'doc', 'docx'],
      maxSizeMb: 1,
      maxCount: 20,
      requiredFor: [],
    },
  ],
};
