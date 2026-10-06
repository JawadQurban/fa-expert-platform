import { describe, expect, it } from 'vitest';
import type { ApplicationFieldSchema } from './applicationForm.types';
import {
  entryAttachmentRules,
  entryAttachments,
  entryFieldKey,
  isFieldRequired,
  isFieldVisible,
  normalizeEntries,
  splitEntryKey,
  validateAttachmentFile,
  validateCompleteness,
  validateFieldValue,
  visibleAttachmentRules,
  type ValidationMessages,
} from './applicationValidation';
import { APPLICATION_FORM_SCHEMA } from './applicationSchema';
import { INACTIVE_DOMAIN_CODES } from '../../shared/content/domainCatalogueStatus';
import { SPECIALIZATION_DOMAIN_OPTIONS } from '../../shared/content/specializationDomains';

const messages: ValidationMessages = {
  required: 'required',
  maxLength: (max) => `max:${max}`,
  invalidValue: 'invalid',
  dateNotFuture: 'future',
  dateNotPast: 'past',
  fileFormat: (formats) => `format:${formats}`,
  fileSize: (maxMb) => `size:${maxMb}`,
  fileCount: (max) => `count:${max}`,
};

/**
 * Engine-rule fixtures. The supplied `DM-GAP-01` matrix is **uniform** — every
 * starred field is required for all four services — so the union/visibility/
 * dependency machinery (`BR-0104`) is asserted against constructed fields, the
 * way `addServiceRules.test.ts` already does. The engine still must honour
 * them: the schema is a served payload and a later version may differ.
 */
const fixture = (overrides: Partial<ApplicationFieldSchema>): ApplicationFieldSchema => ({
  id: 'fixture',
  type: 'text',
  sectionId: 'personal',
  labelAr: 'حقل',
  labelEn: 'Field',
  requiredFor: [],
  ownership: 'expert-hub',
  order: 1,
  ...overrides,
});

describe('applicationValidation (schema engine)', () => {
  it('BR-0104: a field is required when ≥1 selected service requires it (union)', () => {
    const field = fixture({ requiredFor: ['trainer', 'consultant'] });
    expect(isFieldRequired(field, ['content-developer'])).toBe(false);
    expect(isFieldRequired(field, ['content-developer', 'trainer'])).toBe(true);
    expect(isFieldRequired(field, ['consultant'])).toBe(true);
  });

  it('visibility follows the selected services (visibleFor)', () => {
    const field = fixture({ visibleFor: ['trainer'] });
    expect(isFieldVisible(field, ['consultant'], {})).toBe(false);
    expect(isFieldVisible(field, ['consultant', 'trainer'], {})).toBe(true);
  });

  it('conditional dependency shows a field only when its controller matches', () => {
    const field = fixture({ dependsOn: { fieldId: 'controller', equals: true } });
    expect(isFieldVisible(field, ['trainer'], {})).toBe(false);
    expect(isFieldVisible(field, ['trainer'], { controller: true })).toBe(true);
  });

  it('maxDate today accepts today’s own date and rejects tomorrow, in local time', () => {
    const field = fixture({
      type: 'date',
      requiredFor: ['trainer'],
      validation: { maxDate: 'today' },
    });
    const iso = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const today = new Date();
    const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    expect(validateFieldValue(field, iso(today), ['trainer'], 'ar', messages)).toBeNull();
    expect(validateFieldValue(field, iso(tomorrow), ['trainer'], 'ar', messages)).toBe('future');
  });

  it('a notEquals dependency hides a field only while its controller has that value', () => {
    const field = fixture({ dependsOn: { fieldId: 'controller', notEquals: true } });
    // Never touched, or switched off → shown.
    expect(isFieldVisible(field, ['trainer'], {})).toBe(true);
    expect(isFieldVisible(field, ['trainer'], { controller: false })).toBe(true);
    expect(isFieldVisible(field, ['trainer'], { controller: true })).toBe(false);
  });

  it('a required multi-select is empty until at least one option is chosen', () => {
    const field = fixture({ type: 'multi-select', requiredFor: ['trainer'] });
    expect(validateFieldValue(field, undefined, ['trainer'], 'ar', messages)).toBe('required');
    expect(validateFieldValue(field, [], ['trainer'], 'ar', messages)).toBe('required');
    expect(validateFieldValue(field, ['a'], ['trainer'], 'ar', messages)).toBeNull();
  });

  it('a required date behaves like a required value; a filled one passes', () => {
    const field = fixture({ type: 'date', requiredFor: ['trainer'] });
    expect(validateFieldValue(field, undefined, ['trainer'], 'ar', messages)).toBe('required');
    expect(validateFieldValue(field, '2026-08-30', ['trainer'], 'ar', messages)).toBeNull();
  });

  it('BR-0106: rejects wrong format, oversized files, and over-count uploads', () => {
    // The CV rule of the supplied map — J-01's APPROVED table: pdf/doc/docx, 1 MB.
    const cvRule = APPLICATION_FORM_SCHEMA.attachments.find((rule) => rule.id === 'cv')!;
    expect(validateAttachmentFile(cvRule, { name: 'cv.exe', size: 100 }, 0, messages)).toMatch(
      /^format:/
    );
    expect(
      validateAttachmentFile(cvRule, { name: 'cv.pdf', size: 2 * 1024 * 1024 }, 0, messages)
    ).toMatch(/^size:/);
    expect(validateAttachmentFile(cvRule, { name: 'cv.pdf', size: 100 }, 1, messages)).toMatch(
      /^count:/
    );
    expect(validateAttachmentFile(cvRule, { name: 'cv.pdf', size: 100 }, 0, messages)).toBeNull();
  });

  it('BR-0105: completeness reports missing required fields and attachments', () => {
    const incomplete = validateCompleteness(
      APPLICATION_FORM_SCHEMA,
      { services: ['question-writer'], values: {}, attachments: [] },
      'ar',
      messages
    );
    expect(incomplete.valid).toBe(false);
    // The supplied map's first starred field.
    expect(Object.keys(incomplete.fieldErrors)).toContain('firstNameAr');
    expect(incomplete.missingAttachmentRuleIds).toContain('cv');
    // The profile picture is the workbook's one Optional attachment.
    expect(incomplete.missingAttachmentRuleIds).not.toContain('photo');
  });

  /* ── the supplied DM-GAP-01 map itself ─────────────────────────────────── */

  const fieldById = (id: string) => APPLICATION_FORM_SCHEMA.fields.find((f) => f.id === id)!;

  it.each([
    ['trainer', true],
    ['consultant', false],
    ['content-developer', false],
    ['question-writer', false],
  ] as const)(
    'preferredDeliveryMode is required by exactly the services that see it (%s)',
    (service, expected) => {
      // Business decision 2026-09-29. `requiredFor` used to name all four
      // services while `visibleFor` named only the trainer — inert, because a
      // hidden field is never validated, but unreadable. The two now agree, and
      // this must match the backend's own assertion of the same rule.
      const field = fieldById('preferredDeliveryMode');

      expect(isFieldRequired(field, [service])).toBe(expected);
      expect(isFieldVisible(field, [service], {})).toBe(expected);
      expect(field.requiredFor).toEqual(field.visibleFor);

      // Completeness agrees: a non-trainer is never asked for it.
      const incomplete = validateCompleteness(
        APPLICATION_FORM_SCHEMA,
        { services: [service], values: {}, attachments: [] },
        'ar',
        messages
      );
      expect('preferredDeliveryMode' in incomplete.fieldErrors).toBe(expected);

      // The meaning and the options are untouched by the correction.
      expect(field.options?.map((o) => o.value)).toEqual(['online', 'onsite', 'blended']);
    }
  );

  it('the served schema is the supplied field map, not the retired mock', () => {
    expect(APPLICATION_FORM_SCHEMA.version).toBe('dm-gap-01.2026-09-29');
    // The six J-01 sections, in the workbook's own order.
    expect(APPLICATION_FORM_SCHEMA.sections.map((s) => s.id)).toEqual([
      'personal',
      'education',
      'certifications',
      'experience',
      'training-content',
      'availability',
    ]);
    // Spot checks straight from the sheets: the four-part Arabic name…
    for (const id of ['firstNameAr', 'middleNameAr', 'thirdNameAr', 'lastNameAr']) {
      expect(APPLICATION_FORM_SCHEMA.fields.some((f) => f.id === id)).toBe(true);
    }
    // …the supplied qualification types…
    const qualification = APPLICATION_FORM_SCHEMA.fields.find((f) => f.id === 'qualificationType');
    expect(qualification?.options?.map((o) => o.labelAr)).toEqual([
      'دبلوم',
      'بكالوريوس',
      'ماجستير',
      'دكتوراه',
    ]);
    // …and the owner-supplied domain list, minus the 13 values the business
    // ruled are not domains at all (approved policy, 2026-09-28). The master
    // list keeps all 147 so historical applications stay readable.
    const domain = APPLICATION_FORM_SCHEMA.fields.find((f) => f.id === 'domain');
    expect(SPECIALIZATION_DOMAIN_OPTIONS).toHaveLength(147);
    expect(INACTIVE_DOMAIN_CODES).toHaveLength(13);
    expect(domain?.options?.length).toBe(134);
    // The retired mock's invented rows are gone (the `bio` lesson, §2.3).
    for (const id of ['fullName', 'email', 'phone', 'yearsExperience', 'noticePeriod']) {
      expect(APPLICATION_FORM_SCHEMA.fields.some((f) => f.id === id)).toBe(false);
    }
  });

  /* ── the business decisions of 2026-09-16 (dm-gap-01.2026-09-16) ────────── */

  it('previously trained / spoken is Yes/No and opens its details only for Yes', () => {
    const trained = APPLICATION_FORM_SCHEMA.fields.find((f) => f.id === 'hasTrainedBefore')!;
    expect(trained.options?.map((o) => o.labelAr)).toEqual(['نعم', 'لا']);
    const details = APPLICATION_FORM_SCHEMA.fields.find((f) => f.id === 'trainedBeforeDetails')!;
    expect(isFieldVisible(details, ['trainer'], {})).toBe(false);
    expect(isFieldVisible(details, ['trainer'], { hasTrainedBefore: 'no' })).toBe(false);
    expect(isFieldVisible(details, ['trainer'], { hasTrainedBefore: 'yes' })).toBe(true);
  });

  it('weekday availability offers the seven days as a multi-select', () => {
    const days = APPLICATION_FORM_SCHEMA.fields.find((f) => f.id === 'weekdayAvailability')!;
    expect(days.type).toBe('multi-select');
    expect(days.options?.map((o) => o.labelAr)).toEqual([
      'الأحد',
      'الاثنين',
      'الثلاثاء',
      'الأربعاء',
      'الخميس',
      'الجمعة',
      'السبت',
    ]);
  });

  it('hours per day is a whole number from 1 to 24', () => {
    const hours = APPLICATION_FORM_SCHEMA.fields.find((f) => f.id === 'dailyTrainingHours')!;
    expect(hours.type).toBe('number');
    for (const valid of ['1', '8', '24', '']) {
      expect(validateFieldValue(hours, valid, ['trainer'], 'ar', messages)).toBeNull();
    }
    for (const invalid of ['0', '25', '7.5', 'abc']) {
      expect(validateFieldValue(hours, invalid, ['trainer'], 'ar', messages)).not.toBeNull();
    }
  });

  it('general specialization is free text and the qualification label is «المؤهل»', () => {
    expect(fieldById('generalSpecialization').type).toBe('text');
    expect(fieldById('generalSpecialization').options).toBeUndefined();
    expect(fieldById('qualificationType').labelAr).toBe('المؤهل');
    expect(fieldById('qualificationType').labelEn).toBe('Qualification');
  });

  /* ── the Notion Application Form Matrix (dm-gap-01.2026-09-14) ─────────── */

  const optionValues = (id: string) => fieldById(id).options?.map((o) => o.value);

  it('End date shows only while «I currently work in this position» is off', () => {
    const endDate = fieldById('experienceEndDate');
    expect(endDate.labelAr).toBe('تاريخ الانتهاء');
    expect(isFieldVisible(endDate, ['trainer'], {})).toBe(true);
    expect(isFieldVisible(endDate, ['trainer'], { currentlyEmployed: false })).toBe(true);
    expect(isFieldVisible(endDate, ['trainer'], { currentlyEmployed: true })).toBe(false);
  });

  it('carries the matrix’s approved values', () => {
    expect(optionValues('preferredDeliveryMode')).toEqual(['online', 'onsite', 'blended']);
    expect(optionValues('annualAvailability')).toEqual([
      'throughout-year',
      'specific-months',
      'specific-periods',
      'upon-request',
    ]);
    expect(optionValues('trainingLanguages')).toEqual(['ar', 'en', 'bilingual']);
    expect(fieldById('preferredPeriods').options?.map((o) => o.labelAr)).toEqual([
      'صباحًا',
      'ظهرًا',
      'مساءً',
      'نهاية الأسبوع',
    ]);
    expect(fieldById('yearsOfExperience').options?.map((o) => o.labelEn)).toEqual([
      '1 to 5 years',
      '5 to 10 years',
      '11 to 15 years',
      '16+ years',
    ]);
    expect(optionValues('trainingDaysFinancialSector')).toEqual(['10-20', '21-45', '46-75', '76+']);
    expect(optionValues('trainingDaysSameTopics')).toEqual([
      'less-than-10',
      '11-20',
      '21-45',
      '45+',
    ]);
    expect(optionValues('preferredPrograms')).toEqual(['fa-programs', 'events']);
    expect(fieldById('jobTitle').labelAr).toBe('المسمى الوظيفي');
    expect(fieldById('qualificationType').options?.map((o) => o.labelEn)).toEqual([
      'Diploma',
      'Bachelor',
      'Master',
      'PhD',
    ]);
  });

  it('adds nothing mandatory: the matrix has no required column', () => {
    const added = [
      'hasTrainedBefore',
      'trainedBeforeDetails',
      'weekdayAvailability',
      'dailyTrainingHours',
      'experienceEndDate',
      'yearsOfExperience',
      'trainingLanguages',
      // `trainingExperienceYears` left this list on 2026-09-21: it became
      // required FOR TRAINERS by the approved per-service split below.
      'trainingDaysFinancialSector',
      'preferredPrograms',
      'trainingDaysSameTopics',
      'preferredPeriods',
    ];
    for (const id of added) {
      expect(fieldById(id).requiredFor).toEqual([]);
    }
    const referrals = APPLICATION_FORM_SCHEMA.attachments.find((a) => a.id === 'client-referrals');
    expect(referrals?.requiredFor).toEqual([]);
  });

  /* ── dm-gap-01.2026-09-21 — the reference lists ────────────────────────── */

  it('specialization, university and certificate name are dropdowns over the delivered lists', () => {
    // The predecessor's «has not reached this repository» note is closed.
    expect(fieldById('specializationDetail').type).toBe('select');
    expect(fieldById('specializationDetail').options?.length).toBe(25);
    expect(fieldById('universityName').type).toBe('select');
    expect(fieldById('universityName').options?.length).toBe(517);
    expect(fieldById('certificateName').type).toBe('select');
    expect(fieldById('certificateName').options?.length).toBe(228);
  });

  it('never carries a scoring column into the browser', () => {
    // `relevant` / `isGlobal` belong to the Evaluation Matrix, server-side. A
    // weight that reaches the page is a weight an applicant can read.
    for (const id of ['specializationDetail', 'certificateName']) {
      for (const option of fieldById(id).options ?? []) {
        expect(Object.keys(option).sort()).toEqual(['labelAr', 'labelEn', 'value']);
      }
    }
  });

  /* ── dm-gap-01.2026-09-21 — the per-service split ──────────────────────── */

  it('splits years-of-experience and readiness per service', () => {
    const training = fieldById('trainingExperienceYears');
    expect(training.labelAr).toBe('سنوات الخبرة التدريبية');
    expect(training.requiredFor).toEqual(['trainer']);
    expect(training.visibleFor).toEqual(['trainer']);

    const consulting = fieldById('consultingExperienceYears');
    expect(consulting.requiredFor).toEqual(['consultant']);
    expect(consulting.options?.map((o) => o.value)).toEqual(training.options?.map((o) => o.value));

    // EVAL-GAP-09 — distinct from `hasReadyMaterials`, which excludes consultants.
    expect(fieldById('readyConsultingMaterials').visibleFor).toEqual(['consultant']);
    expect(fieldById('hasReadyMaterials').visibleFor).toEqual([
      'trainer',
      'content-developer',
      'question-writer',
    ]);

    expect(fieldById('contentQuestionExperienceYears').requiredFor).toEqual([
      'content-developer',
      'question-writer',
    ]);

    // EVAL-GAP-06 — the only Section 6 field that applies to all four services.
    const engagement = fieldById('engagementMode');
    expect(engagement.requiredFor).toEqual([
      'trainer',
      'consultant',
      'content-developer',
      'question-writer',
    ]);
    expect(engagement.options?.map((o) => o.value)).toEqual(['full-time', 'part-time']);
  });

  it('a field required but not visible for a service never blocks that service', () => {
    // `preferredDeliveryMode` is Training-only yet still required-for-all.
    const consultantOnly = validateCompleteness(
      APPLICATION_FORM_SCHEMA,
      { services: ['consultant'], values: {}, attachments: [] },
      'ar',
      messages
    );
    expect(Object.keys(consultantOnly.fieldErrors)).not.toContain('preferredDeliveryMode');
    expect(Object.keys(consultantOnly.fieldErrors)).toContain('consultingExperienceYears');
  });

  /* ── dm-gap-01.2026-09-21 — repeatable sections ────────────────────────── */

  const sectionById = (id: string) => APPLICATION_FORM_SCHEMA.sections.find((s) => s.id === id)!;

  it('education, certifications and experience are repeatable; no maximum is invented', () => {
    expect(sectionById('education').repeatable?.minEntries).toBe(1);
    expect(sectionById('experience').repeatable?.minEntries).toBe(1);
    // PM, 2026-09-18: «an applicant may have zero professional certifications».
    expect(sectionById('certifications').repeatable?.minEntries).toBe(0);
    expect(sectionById('personal').repeatable).toBeUndefined();
    for (const id of ['education', 'certifications', 'experience']) {
      expect(sectionById(id).repeatable).not.toHaveProperty('maxEntries');
    }
    // The whole certifications section is optional, for all four services.
    for (const field of APPLICATION_FORM_SCHEMA.fields.filter(
      (f) => f.sectionId === 'certifications'
    )) {
      expect(field.requiredFor).toEqual([]);
    }
  });

  it('«المجال» is the controlled field the evaluation matrix scores', () => {
    // Evaluation-Matrix criterion #3 (10%). Notion renamed the criterion to
    // «المجال» on 2026-09-22, and the owner confirmed Practical Experience
    // carries no field of its own — so #3 reads THIS field, which Section 1
    // has offered all along. No second domain field exists.
    const field = APPLICATION_FORM_SCHEMA.fields.find((c) => c.id === 'domain');
    expect(field?.type).toBe('select');
    expect(field?.sectionId).toBe('personal');
    /*
     * It offers the approved «مجال التخصص» master MINUS the 13 values the
     * business classified as master-data problems on 2026-09-28 — tools,
     * certifications, methodologies, programmes, service types and a
     * catch-all. The master itself still holds all 147, and every earlier
     * schema version still offers them, so a historical application that
     * selected one stays readable.
     */
    expect(field?.options).toHaveLength(134);
    expect(SPECIALIZATION_DOMAIN_OPTIONS).toHaveLength(147);
    expect(field?.options?.[0]?.value).toBe('dom-001');
    const offered = field?.options?.map((option) => option.value) ?? [];
    expect(INACTIVE_DOMAIN_CODES).toHaveLength(13);
    for (const hidden of INACTIVE_DOMAIN_CODES) {
      expect(offered).not.toContain(hidden);
    }
    // No scoring column reaches the browser (the weights are the backend's).
    expect(Object.keys(field?.options?.[0] ?? {})).toEqual(['value', 'labelAr', 'labelEn']);
    // …and there is exactly ONE domain field on the whole form.
    expect(APPLICATION_FORM_SCHEMA.fields.filter((c) => c.options === field?.options)).toHaveLength(
      1
    );
  });

  it('the certificate attachments belong to an entry, not to the application', () => {
    const attachmentById = (id: string) =>
      APPLICATION_FORM_SCHEMA.attachments.find((a) => a.id === id)!;
    expect(attachmentById('qualification-certificate').perEntryOf).toBe('education');
    expect(attachmentById('professional-certificate').perEntryOf).toBe('certifications');
    // …so the attachments STEP no longer offers them.
    const stepRules = visibleAttachmentRules(APPLICATION_FORM_SCHEMA, ['trainer']).map((r) => r.id);
    expect(stepRules).toEqual(['photo', 'cv', 'client-referrals']);
    expect(
      entryAttachmentRules(APPLICATION_FORM_SCHEMA, 'education', ['trainer']).map((r) => r.id)
    ).toEqual(['qualification-certificate']);
  });

  it('client referrals accept enough files for criterion #5 to reach its top bucket', () => {
    // The matrix scores the NUMBER OF FILES: 0 / 1–3 / 4–7 / 8+.
    const referrals = APPLICATION_FORM_SCHEMA.attachments.find((a) => a.id === 'client-referrals')!;
    expect(referrals.maxCount).toBeGreaterThanOrEqual(8);
    expect(
      validateAttachmentFile(referrals, { name: 'ref.pdf', size: 100 }, 7, messages)
    ).toBeNull();
  });

  /* ── the historical-data adapter ───────────────────────────────────────── */

  it('a draft with no entries renders as exactly ONE entry per repeatable section', () => {
    // Exactly the shape every draft saved before 2026-09-21 has on disk.
    const historical = {
      values: {
        firstNameAr: 'خالد',
        qualificationType: 'bachelor',
        universityName: 'uni-001',
        jobTitle: 'مستشار مالي',
        certificateName: 'cert-001',
      },
    };
    const entries = normalizeEntries(APPLICATION_FORM_SCHEMA, historical);
    expect(entries.education).toHaveLength(1);
    expect(entries.education[0].values.qualificationType).toBe('bachelor');
    expect(entries.education[0].values.universityName).toBe('uni-001');
    expect(entries.experience).toHaveLength(1);
    expect(entries.experience[0].values.jobTitle).toBe('مستشار مالي');
    expect(entries.certifications).toHaveLength(1);
    expect(entries.certifications[0].values.certificateName).toBe('cert-001');
    // A repeatable section's values are NOT stolen from another section.
    expect(entries.education[0].values.firstNameAr).toBeUndefined();
    // And the flat values are left exactly as they were — never rewritten.
    expect(historical.values.qualificationType).toBe('bachelor');
  });

  it('an empty historical draft still yields minEntries, and none where none is required', () => {
    const entries = normalizeEntries(APPLICATION_FORM_SCHEMA, { values: {} });
    expect(entries.education).toHaveLength(1);
    expect(entries.experience).toHaveLength(1);
    expect(entries.education[0].values).toEqual({});
    // «zero professional certifications» is a real answer, not a gap.
    expect(entries.certifications).toHaveLength(0);
  });

  it('an explicitly emptied section stays empty, and supplied entries win', () => {
    const entries = normalizeEntries(APPLICATION_FORM_SCHEMA, {
      values: { certificateName: 'cert-001', qualificationType: 'diploma' },
      entries: {
        certifications: [],
        education: [
          { entryId: 'e1', values: { qualificationType: 'master' } },
          { entryId: 'e2', values: { qualificationType: 'doctorate' } },
        ],
      },
    });
    expect(entries.certifications).toHaveLength(0);
    expect(entries.education.map((e) => e.values.qualificationType)).toEqual([
      'master',
      'doctorate',
    ]);
  });

  it('completeness keys a repeatable field by its entry, and checks every entry', () => {
    const result = validateCompleteness(
      APPLICATION_FORM_SCHEMA,
      {
        services: ['trainer'],
        values: {},
        entries: {
          education: [
            { entryId: 'e1', values: {} },
            { entryId: 'e2', values: {} },
          ],
        },
        attachments: [],
      },
      'ar',
      messages
    );
    expect(result.fieldErrors[entryFieldKey('e1', 'qualificationType')]).toBe('required');
    expect(result.fieldErrors[entryFieldKey('e2', 'qualificationType')]).toBe('required');
    expect(splitEntryKey(entryFieldKey('e2', 'qualificationType'))).toEqual({
      entryId: 'e2',
      fieldId: 'qualificationType',
    });
    // Each entry misses its own certificate.
    expect(result.missingAttachmentRuleIds).toContain('qualification-certificate::e1');
    expect(result.missingAttachmentRuleIds).toContain('qualification-certificate::e2');
  });

  it('a historical attachment with no entryId still satisfies the first entry', () => {
    // The file was uploaded when the rule was application-level. Losing it
    // would make a complete application read as incomplete.
    const legacy = [
      { id: 'att-1', ruleId: 'qualification-certificate', fileName: 'degree.pdf', sizeBytes: 10 },
    ];
    expect(entryAttachments(legacy, 'qualification-certificate', 'education-1', 0)).toHaveLength(1);
    expect(entryAttachments(legacy, 'qualification-certificate', 'education-2', 1)).toHaveLength(0);

    const result = validateCompleteness(
      APPLICATION_FORM_SCHEMA,
      {
        services: ['trainer'],
        values: {},
        entries: { education: [{ entryId: 'education-1', values: {} }] },
        attachments: legacy,
      },
      'ar',
      messages
    );
    expect(result.missingAttachmentRuleIds).not.toContain('qualification-certificate::education-1');
  });
});
