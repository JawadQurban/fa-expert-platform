import type { InterviewModelDto } from './interview.types';

/**
 * MOCK-MODE COPY of the approved interview evaluation model.
 *
 * The authoritative model is the API's (`INTERVIEW_MODEL` / `INTERVIEW_AXIS`,
 * seeded from Notion «Interview Evaluation Model (axes, criteria, weights)»,
 * status Finalized). This file only mirrors it so mock mode and tests render
 * the same criteria, weights and scale; the live page renders whatever model
 * the API serves for the interview.
 */
export const MOCK_INTERVIEW_MODEL: InterviewModelDto = {
  version: 'dm-gap-03.2026-09-02',
  axes: [
    { id: 'training-skills', label: { ar: 'مهارات التدريب', en: 'Training Skills' }, weight: 33.3 },
    {
      id: 'communication-skills',
      label: { ar: 'مهارات الإتصال / التواصل', en: 'Communication Skills' },
      weight: 16.7,
    },
    {
      id: 'training-camps-willingness',
      label: {
        ar: 'الإستعداد لحضور المعسكرات التدريبية',
        en: 'Willingness to Attend Training Camps',
      },
      weight: 16.7,
    },
    { id: 'energy-levels', label: { ar: 'مستويات الطاقة', en: 'Energy Levels' }, weight: 6.7 },
    {
      id: 'emotional-intelligence',
      label: { ar: 'التعامل مع الذكاء العاطفي', en: 'Emotional Intelligence' },
      weight: 6.7,
    },
    {
      id: 'client-needs-flexibility',
      label: {
        ar: 'المرونة والإستعداد للتكيف مع إحتياجات العميل',
        en: 'Flexibility & Adaptability to Client Needs',
      },
      weight: 6.7,
    },
    {
      id: 'community-giving-back',
      label: {
        ar: 'الميل لرد الجميل للمجتمع / رؤية 2030',
        en: 'Giving Back to Community / Vision 2030',
      },
      weight: 3.3,
    },
    {
      id: 'organizational-values',
      label: { ar: 'التوافق مع القيم التنظيمية', en: 'Alignment with Organizational Values' },
      weight: 3.3,
    },
    {
      id: 'cultural-sensitivity',
      label: { ar: 'الحساسية الثقافية', en: 'Cultural Sensitivity' },
      weight: 3.3,
    },
    {
      id: 'thinking-comprehension',
      label: { ar: 'القدرة على التفكير والإستيعاب', en: 'Thinking & Comprehension Ability' },
      weight: 3.3,
    },
  ].map((axis) => ({ ...axis, description: null, maxScore: 5 })),
  ratingScale: [
    { score: 1, label: { ar: 'لا يظهر السلوك/المهارة إطلاقًا — قصور واضح', en: 'Very Poor' } },
    { score: 2, label: { ar: 'أداء ضعيف — أقل من الحد الأدنى المطلوب', en: 'Poor' } },
    { score: 3, label: { ar: 'أداء مقبول — يفي بالحد الأدنى المطلوب', en: 'Acceptable' } },
    { score: 4, label: { ar: 'أداء جيد — يتجاوز المتوقع في معظم الجوانب', en: 'Good' } },
    { score: 5, label: { ar: 'أداء ممتاز — نموذجي، لا يحتاج تطوير', en: 'Excellent' } },
  ],
};

/** The approved model's result scale and display-only pass indicator (mirrors the API seed). */
export const MOCK_INTERVIEW_RESULT_MAX_SCORE = 100;
export const MOCK_INTERVIEW_PASS_THRESHOLD = 70;
