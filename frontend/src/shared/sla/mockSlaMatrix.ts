import type { SlaDto, SlaInput, SlaMatrixRowDto } from '../types/sla';

/**
 * ⚠️ **MOCK** — the shared stand-in for the server's SLA table.
 *
 * `BR-0705`: «كل مهلة زمنية وتذكيرها، بغض النظر عن القدرة المصدر للحدث، تُدار
 * وتُعدَّل من شاشة إدارة المهل المركزية». One matrix, edited in one place, read
 * by every capability that runs a countdown.
 *
 * Before this module the durations were **three constants in three feature
 * mocks** — screening's five days, the offer's three, the interview's hard-coded
 * instance — each invisible to the console that claims to govern them. Editing
 * the console changed nothing, and one of the three was a number no document
 * contains. This is the single source those four countdowns now read.
 *
 * **It is module-level on purpose.** In production the server holds the table
 * and each provider is an HTTP call; in the mock world "the server" is this
 * module, so a duration changed on the console screen is immediately visible to
 * the screening list — which is exactly the behaviour `F-0704` describes, and is
 * demonstrable rather than asserted.
 *
 * `resetSlaMatrixForTesting()` restores the seed; tests that edit a deadline
 * must call it, or they leak into the next test.
 */

/** ⚠️ MOCK — the seeded matrix. Every row cites the journey it comes from. */
const SEED: readonly SlaMatrixRowDto[] = [
  {
    slaId: 'SLA-0201',
    capabilityCode: 'CAP-02',
    actionCode: 'interview-slot-selection',
    nameAr: 'اختيار مقدّم الطلب لموعد المقابلة',
    nameEn: 'Applicant selects an interview slot',
    source: 'J-06/F1/AC-4',
    onBreachAr: 'لم تنص الرحلة على أثر انتهاء المهلة.',
    onBreachEn: 'The journey does not state what happens when it runs out.',
    status: 'fixed',
    duration: 3,
    unit: 'business-days',
    // "with reminders sent per the Notification Matrix" — the offsets themselves
    // are not stated, so none is seeded.
    reminderOffsets: [],
  },
  {
    slaId: 'SLA-0501',
    capabilityCode: 'CAP-05',
    actionCode: 'assignment-offer-response',
    nameAr: 'رد المرشح على عرض الإسناد',
    nameEn: 'Candidate responds to an assignment offer',
    source: 'J-18/F2 — Candidate Response SLA + AC-1/AC-3',
    onBreachAr: 'ينتهي العرض تلقائيًا وينتقل إلى المرشح التالي في الترتيب.',
    onBreachEn: 'The offer expires automatically and moves to the next-ranked candidate.',
    status: 'fixed',
    duration: 3,
    unit: 'days',
    reminderOffsets: [],
  },
  {
    slaId: 'SLA-0301',
    capabilityCode: 'CAP-03',
    actionCode: 'agreement-expiry',
    nameAr: 'قرب انتهاء الاتفاقية',
    nameEn: 'Agreement approaching expiry',
    source: 'J-12/F1/AC-2→AC-4 (BR-0303, extended)',
    onBreachAr: 'تنتهي الاتفاقية في تاريخها؛ التجديد إجراء إداري مستقل (J-12/F2).',
    onBreachEn: 'The agreement expires on its date; renewal is a separate administrative act.',
    // The deadline is the agreement's own expiry date (1 or 3 years, BR-0302) —
    // only the reminder schedule is configured centrally.
    status: 'record-derived',
    reminderOffsets: [90, 30, 5],
  },
  {
    slaId: 'SLA-0202',
    capabilityCode: 'CAP-02',
    actionCode: 'screening-decision',
    nameAr: 'إنجاز قرار الفرز',
    nameEn: 'Screening decision completed',
    source: 'J-05 — user flow 5 shows “remaining SLA time”, with no duration',
    onBreachAr: 'غير محدد.',
    onBreachEn: 'Not defined.',
    status: 'undefined-duration',
  },
  {
    slaId: 'SLA-0203',
    capabilityCode: 'CAP-02',
    actionCode: 'applicant-signature-no-response',
    nameAr: 'عدم رد المتقدم على الاتفاقية',
    nameEn: 'Applicant does not respond to the agreement',
    source: 'J-11 — open item 1, deferred to “the full SLA matrix”',
    onBreachAr: 'غير محدد.',
    onBreachEn: 'Not defined.',
    status: 'undefined-duration',
  },
  {
    slaId: 'SLA-2001',
    // The BRD names no capability for the material & content area — recorded as
    // `—` in `14_INTERNAL_DASHBOARD_BRD_REVIEW` §1 for the same reason.
    capabilityCode: null,
    actionCode: 'material-review',
    nameAr: 'مراجعة المواد والمحتوى',
    nameEn: 'Material & content review',
    source: 'J-20 — open item 1, “not currently defined” for both paths',
    onBreachAr: 'غير محدد.',
    onBreachEn: 'Not defined.',
    status: 'undefined-duration',
  },
];

let rows: SlaMatrixRowDto[] = SEED.map((row) => ({ ...row }));

export function listSlaMatrix(): readonly SlaMatrixRowDto[] {
  return [...rows];
}

export function findSlaRow(slaId: string): SlaMatrixRowDto | undefined {
  return rows.find((row) => row.slaId === slaId);
}

/** `BR-0705` — the one write path. CAP-07's console is its only caller. */
export function applySlaInput(slaId: string, input: SlaInput): readonly SlaMatrixRowDto[] | null {
  const existing = rows.find((row) => row.slaId === slaId);
  if (existing == null) {
    return null;
  }
  const base = {
    slaId: existing.slaId,
    capabilityCode: existing.capabilityCode,
    actionCode: existing.actionCode,
    nameAr: existing.nameAr,
    nameEn: existing.nameEn,
    source: existing.source,
    onBreachAr: existing.onBreachAr,
    onBreachEn: existing.onBreachEn,
  };
  const next: SlaMatrixRowDto =
    input.kind === 'fixed'
      ? {
          ...base,
          status: 'fixed',
          duration: input.duration,
          unit: input.unit,
          reminderOffsets: [...input.reminderOffsets],
        }
      : { ...base, status: 'record-derived', reminderOffsets: [...input.reminderOffsets] };
  rows = rows.map((row) => (row.slaId === slaId ? next : row));
  return [...rows];
}

export function resetSlaMatrixForTesting(): void {
  rows = SEED.map((row) => ({ ...row }));
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * ⚠️ MOCK — the arithmetic the **server** owns in production (`P-51`).
 *
 * Returns `null` when the central row has **no duration**, because a deadline
 * nobody has defined cannot produce a countdown. That is the whole point of the
 * re-wiring: the screening list used to show a five-day clock derived from a
 * constant in its own mock, while the console said the duration was undefined.
 * Now the two cannot disagree — set a duration on the console and the badge
 * appears; leave it unset and the screen says so.
 *
 * Business days are **not** approximated: `unit` is carried on the row and a
 * `business-days` duration is counted here in plain days with the same caveat
 * `P-51` records — the real calendar is the server's.
 */
export function buildSlaInstance(slaId: string, startedAt: string, nowIso: string): SlaDto | null {
  const row = findSlaRow(slaId);
  if (row == null || row.status !== 'fixed') {
    return null;
  }
  const dueAt = new Date(new Date(startedAt).getTime() + row.duration * DAY_MS);
  const daysRemaining = Math.floor((dueAt.getTime() - new Date(nowIso).getTime()) / DAY_MS);
  return {
    slaId,
    state: daysRemaining < 0 ? 'breached' : daysRemaining <= 1 ? 'approaching' : 'within',
    dueAt: dueAt.toISOString(),
    daysRemaining,
  };
}

/** The reminder schedule a record-derived deadline carries — `[]` if unset. */
export function reminderOffsetsFor(slaId: string): readonly number[] {
  const row = findSlaRow(slaId);
  return row != null && row.status !== 'undefined-duration' ? row.reminderOffsets : [];
}

/** The four countdowns the product runs today, by the row that configures them. */
export const SLA_IDS = {
  screeningDecision: 'SLA-0202',
  interviewSlotSelection: 'SLA-0201',
  assignmentOfferResponse: 'SLA-0501',
  agreementExpiry: 'SLA-0301',
} as const;
