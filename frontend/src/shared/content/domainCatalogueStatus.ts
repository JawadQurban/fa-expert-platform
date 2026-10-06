/**
 * Domain codes that are NOT valid professional domains — tools,
 * certifications, methodologies, programmes, service types and a catch-all
 * that reached the legacy «مجال التخصص» master list.
 *
 * ⚠️ GENERATED — do not edit by hand. Produced by
 * `tools/data/practical-experience-relevance.py extract` from the
 * business's own classification workbook.
 *
 * They are **kept in the master list** (13 of 147): a historical
 * application that selected one must stay readable forever, and no code is
 * renamed, merged or deleted. This list exists only so a NEW application's
 * «المجال» dropdown can stop offering them — the form schema is versioned and
 * each version carries its own frozen copy of the options, so filtering the
 * current version leaves every earlier one untouched.
 *
 * Evaluation-Matrix criterion #3 reports these as UNRESOLVED rather than
 * scoring them, which is the same statement made on the scoring side.
 *
 * Cleanup backlog: `EXPERT-HUB-DOMAIN-MASTER-CLEANUP`.
 */

export const INACTIVE_DOMAIN_CODES: readonly string[] = [
  // CME1 — Certification (CME1) — evaluate under the certificate criteria, not domain relevance
  'dom-011',
  // تقديم خدمات خبير — Service type, not a domain
  'dom-016',
  // اجادة - لمدراء العمليات — Named programme, not a domain
  'dom-029',
  // اكسل — Tool (Excel) — evaluate under skills, not domain relevance
  'dom-032',
  // البرامج القيادية — Programme type, not a domain
  'dom-035',
  // طرق كشف تزوير المستندات والتواقيع — Methodology, not a domain
  'dom-037',
  // مسؤول الالتزام المعتمد — Certification (Certified Compliance Officer), not a domain
  'dom-039',
  // البرامج الخاصة — Programme category, not a domain
  'dom-042',
  // تدريب المدربين(TOT) — Methodology (TOT) — evaluate under training capability, not domain relevance
  'dom-075',
  // مايكروسوفت Power BI — Tool (Power BI) — evaluate under skills, not domain relevance
  'dom-076',
  // تقديم خدمات استشارية — Service type, not a domain
  'dom-096',
  // الجميع — Catch-all value, not a domain
  'dom-122',
  // إدارة مشاريع (PMP) — Certification (PMP) named in the value — project management itself scores via dom-145
  'dom-139',
];

/** The catalogue a NEW application should offer — the master list minus those. */
export function activeDomains<T extends { readonly value: string }>(
  catalogue: readonly T[]
): readonly T[] {
  return catalogue.filter((option) => !INACTIVE_DOMAIN_CODES.includes(option.value));
}
