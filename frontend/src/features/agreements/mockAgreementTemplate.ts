import type {
  AgreementDocumentDto,
  AgreementFieldSchema,
  AgreementFieldValues,
  MergedDataGroup,
} from './agreement.types';

/**
 * ⚠️ MOCK AGREEMENT TEMPLATE — DEVELOPMENT CONFIGURATION ONLY, **NOT** THE
 * APPROVED FIELD LIST.
 *
 * `DM-GAP-16` is open. J-10's supporting matrix is explicitly marked *"pending
 * full list"*, and states that the only confirmed fields today are the **start
 * date and end date**.
 *
 * Those two are therefore the only fields marked `required` below. The rest are
 * clearly optional placeholders that exercise the field types the approved
 * template will need — they must not be read as approved content.
 *
 * TODO(`DM-GAP-16`): replace this list with the approved template fields served
 * by the Expert Hub API. No UI logic changes — the form renders whatever schema
 * it receives.
 */
export const MOCK_AGREEMENT_TEMPLATE_VERSION = 'mock-dm-gap-16-draft.1';

/** ⚠️ MOCK — the backend's seeded placeholder template, labelled as such in its own text. */
export const MOCK_AGREEMENT_TEMPLATE_NAME = 'الاتفاقية الموحدة';
export const MOCK_AGREEMENT_BODY_TEXT =
  '⚠️ نص تجريبي — بانتظار النص القانوني المعتمد (DM-GAP-16). تُبرم هذه الاتفاقية بين الأكاديمية المالية والخبير المعتمد لتقديم الخدمات الموضحة في ملحق الخدمات، وفق الشروط والأحكام المعتمدة.';

export const MOCK_AGREEMENT_FIELDS: readonly AgreementFieldSchema[] = [
  {
    id: 'startDate',
    label: { ar: 'تاريخ بداية الاتفاقية', en: 'Agreement start date' },
    type: 'date',
    required: true,
    help: { ar: 'محدَّد ومعتمد في الرحلة.', en: 'Confirmed by the journey.' },
  },
  {
    id: 'endDate',
    label: { ar: 'تاريخ نهاية الاتفاقية', en: 'Agreement end date' },
    type: 'date',
    required: true,
    help: {
      ar: 'سنة للاعتماد الأول، وثلاث سنوات لكل تجديد (BR-0302).',
      en: 'One year on first accreditation, three years on each renewal (BR-0302).',
    },
  },
  {
    id: 'referenceNote',
    label: { ar: 'ملاحظة مرجعية', en: 'Reference note' },
    type: 'text',
    required: false,
    help: {
      ar: 'حقل تجريبي — بانتظار مصفوفة الحقول المعتمدة (DM-GAP-16).',
      en: 'Placeholder field — pending the approved field matrix (DM-GAP-16).',
    },
  },
];

/**
 * ⚠️ MOCK frozen document version, in the exact `AgreementDocumentDto` shape the
 * API serves (`contracts/fixtures/internal.agreement-document.json`). The hash is
 * a labelled placeholder — the server computes a real SHA-256.
 */
export function buildMockAgreementDocument(
  versionNumber: number,
  values: AgreementFieldValues,
  mergedData: readonly MergedDataGroup[],
  createdAt: string
): AgreementDocumentDto {
  return {
    documentVersionId: `mock-agreement-version-${versionNumber}`,
    versionNumber,
    templateName: MOCK_AGREEMENT_TEMPLATE_NAME,
    templateVersion: MOCK_AGREEMENT_TEMPLATE_VERSION,
    bodyText: MOCK_AGREEMENT_BODY_TEXT,
    fields: MOCK_AGREEMENT_FIELDS.map((field) => ({
      id: field.id,
      label: field.label,
      value: values[field.id] ?? '',
    })),
    mergedData,
    contentHash: `MOCK-CONTENT-HASH-V${versionNumber}`,
    createdAt,
    snapshot: true,
    signatureMethod: 'internal-acceptance',
  };
}
