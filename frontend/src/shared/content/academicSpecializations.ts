/**
 * التخصص — the academic-specialization list delivered 2026-09-21, extracted
 * verbatim (by script — `tools/data/extract-reference-lists.py`) from the
 * «جميع التخصصات» sheet of `docs/inputs/specializations-and-universities.xlsx`.
 *
 * `relevant` is the workbook's own «مدى الصلة بالأكاديمية المالية» column, and
 * it is what makes Evaluation-Matrix criterion #2 («التخصص العام», max 10%)
 * computable at all — the matrix looks the applicant's selected specialization
 * up here and pays 0.1 for a related one, 0 for one ruled unrelated.
 * 17 of 25 are related.
 *
 * ⚠️ `relevant: null` means the source row carries NO relevance value, so no
 * business decision exists — 1 of 25. It is neither
 * related nor unrelated: such a value is OMITTED from criterion #2's scoring
 * table, the table is `strict`, and the answer is reported UNRESOLVED rather
 * than scored zero (`EVAL-GAP-11`, decided 2026-09-29). Writing it as «not
 * related» would state a decision nobody made.
 *
 * ⚠️ Codes (`spec-NNN`) are positional and stable — this module's own, pending
 * a real `profile.Education.Specialization` lookup id.
 */

export interface AcademicSpecializationOption {
  readonly value: string;
  readonly labelAr: string;
  readonly labelEn: string;
  /**
   * «ذو صلة مباشرة بالأكاديمية المالية» — Evaluation Matrix criterion #2.
   * `null` = the source carries no classification, so no decision exists.
   */
  readonly relevant: boolean | null;
}

export const ACADEMIC_SPECIALIZATION_OPTIONS: readonly AcademicSpecializationOption[] = [
  {
    value: 'spec-001',
    labelAr: 'إدارة الأعمال',
    labelEn: 'Business Administration',
    relevant: true,
  },
  { value: 'spec-002', labelAr: 'المحاسبة', labelEn: 'Accounting', relevant: true },
  { value: 'spec-003', labelAr: 'العلاقات العامة', labelEn: 'Public Relations', relevant: true },
  {
    value: 'spec-004',
    labelAr: 'التمويل والاستثمار',
    labelEn: 'Finance and Investment',
    relevant: true,
  },
  {
    value: 'spec-005',
    labelAr: 'الأسواق المالية والأوراق المالية',
    labelEn: 'Financial Markets and Securities',
    relevant: true,
  },
  {
    value: 'spec-006',
    labelAr: 'التأمين وإدارة المخاطر',
    labelEn: 'Insurance and Risk Management',
    relevant: true,
  },
  { value: 'spec-007', labelAr: 'المصرفية والعمل المصرفي', labelEn: 'Banking', relevant: true },
  { value: 'spec-008', labelAr: 'الاقتصاد', labelEn: 'Economics', relevant: true },
  { value: 'spec-009', labelAr: 'التسويق', labelEn: 'Marketing', relevant: true },
  {
    value: 'spec-010',
    labelAr: 'نظم المعلومات الإدارية',
    labelEn: 'Management Information Systems',
    relevant: true,
  },
  {
    value: 'spec-011',
    labelAr: 'إدارة الموارد البشرية',
    labelEn: 'Human Resources Management',
    relevant: true,
  },
  { value: 'spec-012', labelAr: 'ريادة الأعمال', labelEn: 'Entrepreneurship', relevant: true },
  {
    value: 'spec-013',
    labelAr: 'القيادة الاستراتيجية',
    labelEn: 'Strategic Leadership',
    relevant: true,
  },
  { value: 'spec-014', labelAr: 'إدارة المشاريع', labelEn: 'Project Management', relevant: true },
  {
    value: 'spec-015',
    labelAr: 'التطوير التنظيمي والموارد البشرية',
    labelEn: 'Organizational Development and Human Resources',
    relevant: true,
  },
  {
    value: 'spec-016',
    labelAr: 'الأنظمة (القانون)',
    labelEn: 'Law (Regulations)',
    relevant: false,
  },
  {
    value: 'spec-017',
    labelAr: 'الأنظمة التجارية',
    labelEn: 'Commercial Regulations',
    relevant: true,
  },
  { value: 'spec-018', labelAr: 'علوم الحاسب', labelEn: 'Computer Science', relevant: false },
  {
    value: 'spec-019',
    labelAr: 'تقنية المعلومات',
    labelEn: 'Information Technology',
    relevant: false,
  },
  {
    value: 'spec-020',
    labelAr: 'هندسة البرمجيات',
    labelEn: 'Software Engineering',
    relevant: false,
  },
  { value: 'spec-021', labelAr: 'الأمن السيبراني', labelEn: 'Cybersecurity', relevant: false },
  {
    value: 'spec-022',
    labelAr: 'الذكاء الاصطناعي وعلم البيانات',
    labelEn: 'Artificial Intelligence and Data Science',
    relevant: false,
  },
  {
    value: 'spec-023',
    labelAr: 'الرياضيات والإحصاء',
    labelEn: 'Mathematics and Statistics',
    relevant: true,
  },
  { value: 'spec-024', labelAr: 'أخرى*', labelEn: 'Others*', relevant: false },
  {
    value: 'spec-025',
    labelAr: '*عند اختيار اخرى تتيح للخبير أو المدرب كتابة التخصص',
    labelEn: '*عند اختيار اخرى تتيح للخبير أو المدرب كتابة التخصص',
    relevant: null,
  },
];
