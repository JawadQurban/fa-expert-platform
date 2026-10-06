import type { ApplicationService } from '../applications/application.types';
import type { ScreeningCriterionDto } from './screening.types';

/**
 * ⚠️ MOCK EVALUATION MODEL — DEVELOPMENT CONFIGURATION ONLY, **NOT** THE
 * APPROVED SCREENING MATRIX.
 *
 * `DM-GAP-02` / `G6` (the Evaluation Matrix: criteria, weights, and the minimum
 * acceptance threshold per service — J-05 supporting matrix) is **still open**.
 * The business has not approved any weight or threshold value.
 *
 * This file exists solely so the *architecture* required by `BR-0203` can be
 * exercised: the evaluation model is **configuration served to the UI**, not
 * logic embedded in it — an admin changes criteria/weights per service without a
 * deployment. The page renders whatever model it is given.
 *
 * TODO(`DM-GAP-02`): delete these values and serve the approved matrix from the
 * Expert Hub API evaluation-model endpoint. No UI logic changes.
 */

export const MOCK_EVALUATION_MODEL_VERSION = 'mock-dm-gap-02-draft.1';

/** The five scored criteria — application form sections 2–6 (J-05 matrix). */
const CRITERIA_LABELS = [
  { id: 'education', ar: 'المؤهلات العلمية', en: 'Educational qualifications' },
  { id: 'certifications', ar: 'الشهادات المهنية', en: 'Professional certifications' },
  { id: 'experience', ar: 'الخبرة العملية', en: 'Practical experience' },
  { id: 'training-content', ar: 'الخبرة التدريبية والمحتوى', en: 'Training experience & content' },
  { id: 'availability', ar: 'الجاهزية والإتاحة', en: 'Availability & readiness' },
] as const;

/** Per-service weights (each column sums to 100 — the matrix's own rule). */
const MOCK_WEIGHTS: Readonly<Record<ApplicationService, readonly number[]>> = {
  trainer: [20, 15, 25, 30, 10],
  consultant: [25, 20, 35, 10, 10],
  'content-developer': [20, 15, 25, 30, 10],
  'question-writer': [25, 20, 25, 20, 10],
  // Speaker never reaches screening (`BR-0113`/`BR-0413`); kept for type totality.
  speaker: [20, 20, 20, 20, 20],
};

/** Minimum acceptance threshold per service — display-only indicator (F2/AC-5). */
export const MOCK_SCORE_THRESHOLDS: Readonly<Record<ApplicationService, number>> = {
  trainer: 70,
  consultant: 75,
  'content-developer': 70,
  'question-writer': 70,
  speaker: 0,
};

/** Builds the criteria list for a service from the mock weights + raw results. */
export function buildMockCriteria(
  service: ApplicationService,
  rawScores: readonly number[]
): readonly ScreeningCriterionDto[] {
  const weights = MOCK_WEIGHTS[service];
  return CRITERIA_LABELS.map((criterion, index) => ({
    id: criterion.id,
    label: { ar: criterion.ar, en: criterion.en },
    weight: weights[index] ?? 0,
    rawScore: rawScores[index] ?? 0,
    // The mock stands in for the API, so it must produce the SAME shape the
    // API does — including the weighted value, which the page displays and
    // never recomputes.
    weightedScore:
      Math.round((((rawScores[index] ?? 0) * (weights[index] ?? 0)) / 100) * 100) / 100,
    // The mock stands in for the API, so it carries the same field. Nothing in
    // the demo data is unclassified — the real signal comes from the backend.
    unresolved: false,
  }));
}

/** The weighted total (`BR-0201`: a fixed formula, no human or AI input). */
export function weightedTotal(criteria: readonly ScreeningCriterionDto[]): number {
  const total = criteria.reduce((sum, criterion) => sum + criterion.weightedScore, 0);
  return Math.round(total * 10) / 10;
}
