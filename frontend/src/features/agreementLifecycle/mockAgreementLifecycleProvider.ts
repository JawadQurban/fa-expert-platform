import { reminderOffsetsFor, SLA_IDS } from '../../shared/sla/mockSlaMatrix';
import { reminderMilestoneFor } from '../../shared/types/sla';
import type { ExpertHubApiError } from '../../shared/services/apiClient';
import { MOCK_AGREEMENT_FIELDS } from '../agreements/mockAgreementTemplate';
import type { AgreementLifecycleService } from './agreementLifecycleService';
import {
  allowedActions,
  validateTemplate,
  type AgreementDetailDto,
  type AgreementFilters,
  type AgreementHistoryEntryDto,
  type AgreementLifecycleInput,
  type AgreementSummaryDto,
  type AgreementTemplateDto,
  type ExpiryMilestone,
  type SaveTemplateInput,
  milestoneKey,
} from './agreementLifecycle.types';

/**
 * Versioned **mock** provider for EH-INT-06 (J-12). It simulates the server's
 * arithmetic, which is where this journey's rules live:
 *
 * - **Calculating the expiry date from the term** (F1/AC-1, `BR-0301`) — never
 *   accepting one.
 * - **Deriving the next term: 1 year first, 3 years on renewal** (F2/AC-2,
 *   `BR-0302`) — never accepting one.
 * - **Deriving the expiry milestone** at the 90/30/5-day thresholds (F1/AC-2–4).
 * - **Enforcing the state machine**, so an action the status forbids is refused
 *   even if the UI somehow offered it.
 *
 * ⚠️ MOCK DATA (clearly labelled): trainers, references and dates are
 * representative development data.
 *
 * ⚠️ Deterministic clock. `now` is a fixed ISO instant, not `Date.now()`, so the
 * milestone boundaries are reproducible in tests and in demos — a countdown that
 * changes with the wall clock cannot be asserted on.
 */

/** ⚠️ MOCK — the fixed "today" every calculation here is relative to. */
const MOCK_NOW = '2026-08-20T09:00:00Z';

const DAY_MS = 24 * 60 * 60 * 1000;

function daysBetween(fromIso: string, toIso: string): number {
  return Math.floor((new Date(toIso).getTime() - new Date(fromIso).getTime()) / DAY_MS);
}

/**
 * F1/AC-2 · AC-3 · AC-4 — the reminder thresholds `BR-0303` defines, read from
 * the **central** matrix (`SLA-0301`, `BR-0705`) rather than hard-coded here.
 * Change 90/30/5 on the deadline console and this table follows.
 */
function milestoneFor(daysToExpiry: number): ExpiryMilestone {
  return reminderMilestoneFor(daysToExpiry, reminderOffsetsFor(SLA_IDS.agreementExpiry));
}

/**
 * F2/AC-2 (`BR-0302`, D-07) — 1 year for a first accreditation, 3 years for
 * every renewal thereafter. One function, so the rule has one home.
 */
function nextTermYearsFor(renewalCount: number): number {
  return renewalCount === 0 ? 1 : 3;
}

/** F1/AC-1 — the expiry date is *calculated* from a start date and a term. */
function addYears(iso: string, years: number): string {
  const date = new Date(iso);
  date.setUTCFullYear(date.getUTCFullYear() + years);
  return date.toISOString();
}

interface MockAgreementRecord {
  readonly id: string;
  readonly reference: string;
  readonly trainerId: string;
  readonly trainerName: string;
  readonly services: readonly AgreementSummaryDto['services'][number][];
  status: AgreementSummaryDto['status'];
  startsAt: string;
  endsAt: string;
  renewalCount: number;
  history: AgreementHistoryEntryDto[];
}

/** ⚠️ MOCK agreements, seeded to land on each expiry milestone. */
function seedAgreements(): MockAgreementRecord[] {
  return [
    {
      id: 'agr-001',
      reference: 'AGR-2026-00042',
      trainerId: 'trn-001',
      trainerName: 'د. سارة العتيبي',
      services: ['consultant'],
      status: 'active',
      startsAt: '2025-09-01T00:00:00Z',
      // ~12 days out → the 30-day milestone.
      endsAt: '2026-09-01T00:00:00Z',
      renewalCount: 0,
      history: [
        {
          id: 'agr-001-h1',
          kind: 'activated',
          at: '2025-09-01T00:00:00Z',
          byName: 'النظام',
          note: null,
          termYears: 1,
        },
      ],
    },
    {
      id: 'agr-002',
      reference: 'AGR-2025-00311',
      trainerId: 'trn-002',
      trainerName: 'أ. خالد المطيري',
      services: ['trainer'],
      status: 'active',
      startsAt: '2023-12-31T00:00:00Z',
      // Comfortably far out → no milestone.
      endsAt: '2026-12-31T00:00:00Z',
      renewalCount: 1,
      history: [
        {
          id: 'agr-002-h1',
          kind: 'activated',
          at: '2022-12-31T00:00:00Z',
          byName: 'النظام',
          note: null,
          termYears: 1,
        },
        {
          id: 'agr-002-h2',
          kind: 'renewed',
          at: '2023-12-31T00:00:00Z',
          byName: 'مدير إدارة المدربين',
          note: null,
          termYears: 3,
        },
      ],
    },
    {
      id: 'agr-003',
      reference: 'AGR-2024-00088',
      trainerId: 'trn-003',
      trainerName: 'م. نورة الشمري',
      services: ['trainer', 'content-developer'],
      // F2/AC-1 — "nearing **or past** expiry" is renewable.
      status: 'expired',
      startsAt: '2023-07-01T00:00:00Z',
      endsAt: '2026-07-01T00:00:00Z',
      renewalCount: 1,
      history: [
        {
          id: 'agr-003-h1',
          kind: 'activated',
          at: '2022-07-01T00:00:00Z',
          byName: 'النظام',
          note: null,
          termYears: 1,
        },
      ],
    },
    {
      id: 'agr-004',
      reference: 'AGR-2026-00108',
      trainerId: 'trn-004',
      trainerName: 'أ. ريم القحطاني',
      services: ['question-writer'],
      status: 'suspended',
      startsAt: '2026-02-01T00:00:00Z',
      endsAt: '2027-02-01T00:00:00Z',
      renewalCount: 0,
      history: [
        {
          id: 'agr-004-h1',
          kind: 'activated',
          at: '2026-02-01T00:00:00Z',
          byName: 'النظام',
          note: null,
          termYears: 1,
        },
        {
          id: 'agr-004-h2',
          kind: 'suspended',
          at: '2026-06-10T00:00:00Z',
          byName: 'مدير إدارة المدربين',
          note: 'إيقاف مؤقت بناءً على طلب الإدارة.',
          termYears: null,
        },
      ],
    },
  ];
}

/**
 * ⚠️ MOCK template. The body text is representative placeholder legal copy — it
 * is **not** an approved contract — and the fields are the same list J-10
 * renders (`DM-GAP-16` open). F4 is the screen through which the real ones would
 * be entered.
 */
const SEED_TEMPLATE: AgreementTemplateDto = {
  id: 'tpl-unified',
  name: 'نموذج الاتفاقية الموحّد',
  // F4/AC-2 — one template serves all four services today; the link is plural
  // because the journey says to design for more than one.
  services: ['trainer', 'consultant', 'content-developer', 'question-writer'],
  bodyText:
    '⚠️ نص تجريبي غير معتمد.\n\nاتفاقية تقديم خدمات تدريبية بين الأكاديمية المالية والطرف الثاني، تُحدَّد بموجبها الخدمات المعتمدة ومدة الاتفاقية والالتزامات المتبادلة.\n\nتسري هذه الاتفاقية اعتبارًا من تاريخ البداية المذكور وحتى تاريخ النهاية، ما لم تُنهَ أو تُوقف وفق الأنظمة المعمول بها.',
  fields: MOCK_AGREEMENT_FIELDS.map((field) => ({
    id: field.id,
    label: field.label,
    type: field.type,
    required: field.required,
  })),
  updatedAt: '2026-07-01T08:00:00Z',
  updatedByName: 'مدير النظام',
};

export interface MockAgreementLifecycleProviderOptions {
  readonly latencyMs?: number;
  readonly failWith?: ExpertHubApiError;
  readonly now?: string;
  /** Simulate a viewer who may look but not act (`04` EH-INT-06 §10, J-26). */
  readonly viewer?: Partial<AgreementDetailDto['viewer']>;
}

function delay(ms: number): Promise<void> {
  return ms <= 0 ? Promise.resolve() : new Promise((resolve) => setTimeout(resolve, ms));
}

export function createMockAgreementLifecycleProvider(
  options: MockAgreementLifecycleProviderOptions = {}
): AgreementLifecycleService {
  const { latencyMs = 300, failWith, now = MOCK_NOW, viewer: viewerOverride } = options;

  const agreements = seedAgreements();
  let template = { ...SEED_TEMPLATE, fields: SEED_TEMPLATE.fields.map((f) => ({ ...f })) };
  let historyCounter = 0;

  function toSummary(record: MockAgreementRecord): AgreementSummaryDto {
    const daysToExpiry = daysBetween(now, record.endsAt);
    return {
      id: record.id,
      reference: record.reference,
      trainerId: record.trainerId,
      trainerName: record.trainerName,
      services: record.services,
      status: record.status,
      startsAt: record.startsAt,
      endsAt: record.endsAt,
      // An ended agreement has no meaningful countdown — it did not lapse.
      expiryMilestone: record.status === 'ended' ? { kind: 'none' } : milestoneFor(daysToExpiry),
      daysToExpiry,
      renewalCount: record.renewalCount,
    };
  }

  function toDetail(record: MockAgreementRecord): AgreementDetailDto {
    const allowed = allowedActions(record.status);
    const termYears = nextTermYearsFor(record.renewalCount);
    return {
      ...toSummary(record),
      nextTermYears: termYears,
      // F1/AC-1 — a renewal's end date is calculated too. Renewing a lapsed
      // agreement runs the new term from today, not from the date it expired.
      renewedEndsAt: addYears(record.status === 'expired' ? now : record.endsAt, termYears),
      history: [...record.history].reverse(),
      documentUrl: null,
      viewer: {
        canRenew: viewerOverride?.canRenew ?? allowed.includes('renew'),
        canSuspend: viewerOverride?.canSuspend ?? allowed.includes('suspend'),
        canEnd: viewerOverride?.canEnd ?? allowed.includes('end'),
        canReactivate: viewerOverride?.canReactivate ?? allowed.includes('reactivate'),
      },
    };
  }

  function record(
    target: MockAgreementRecord,
    kind: AgreementHistoryEntryDto['kind'],
    note: string,
    termYears: number | null
  ) {
    historyCounter += 1;
    target.history.push({
      id: `${target.id}-h-${historyCounter}`,
      kind,
      at: now,
      byName: 'موظف تجريبي',
      note: note.trim() || null,
      termYears,
    });
  }

  return {
    async listAgreements(filters: AgreementFilters) {
      await delay(latencyMs);
      if (failWith != null) {
        return { ok: false, error: failWith };
      }
      const search = filters.search.trim().toLowerCase();
      const all = agreements.map(toSummary);
      const items = all.filter(
        (item) =>
          (search === '' ||
            item.trainerName.toLowerCase().includes(search) ||
            item.reference.toLowerCase().includes(search)) &&
          (filters.status === 'all' || item.status === filters.status) &&
          (filters.milestone === 'all' || milestoneKey(item.expiryMilestone) === filters.milestone)
      );
      return {
        ok: true,
        value: {
          items,
          totalCount: items.length,
          expiringCount: all.filter((item) => item.expiryMilestone.kind !== 'none').length,
          reminderOffsets: reminderOffsetsFor(SLA_IDS.agreementExpiry),
        },
      };
    },

    async getAgreement(id: string) {
      await delay(latencyMs);
      if (failWith != null) {
        return { ok: false, error: failWith };
      }
      const found = agreements.find((item) => item.id === id);
      return found == null
        ? { ok: false, error: { status: 404, message: 'Agreement not found.' } }
        : { ok: true, value: toDetail(found) };
    },

    async applyLifecycleAction(id: string, input: AgreementLifecycleInput) {
      await delay(latencyMs);
      if (failWith != null) {
        return { ok: false, error: failWith };
      }
      const found = agreements.find((item) => item.id === id);
      if (found == null) {
        return { ok: false, error: { status: 404, message: 'Agreement not found.' } };
      }
      // The state machine, enforced server-side too: a client that skipped the
      // UI must not be able to end an already-ended agreement, or renew one that
      // was deliberately terminated.
      if (!allowedActions(found.status).includes(input.kind)) {
        return {
          ok: false,
          error: { status: 409, message: `Action ${input.kind} not allowed from ${found.status}.` },
        };
      }

      switch (input.kind) {
        case 'renew': {
          // F2/AC-2 — the term comes from the rule, never from the request.
          const termYears = nextTermYearsFor(found.renewalCount);
          const from = found.status === 'expired' ? now : found.endsAt;
          found.startsAt = from;
          found.endsAt = addYears(from, termYears);
          found.renewalCount += 1;
          found.status = 'active';
          record(found, 'renewed', input.note, termYears);
          break;
        }
        case 'suspend':
          found.status = 'suspended';
          record(found, 'suspended', input.note, null);
          break;
        case 'reactivate':
          found.status = 'active';
          record(found, 'reactivated', input.note, null);
          break;
        case 'end':
          found.status = 'ended';
          record(found, 'ended', input.note, null);
          break;
      }
      return { ok: true, value: toDetail(found) };
    },

    async getTemplate() {
      await delay(latencyMs);
      if (failWith != null) {
        return { ok: false, error: failWith };
      }
      return { ok: true, value: { ...template, fields: template.fields.map((f) => ({ ...f })) } };
    },

    async saveTemplate(input: SaveTemplateInput) {
      await delay(latencyMs);
      if (failWith != null) {
        return { ok: false, error: failWith };
      }
      if (validateTemplate(input).length > 0) {
        return { ok: false, error: { status: 400, message: 'Invalid template.' } };
      }
      template = {
        ...template,
        bodyText: input.bodyText,
        fields: input.fields.map((field) => ({ ...field })),
        updatedAt: now,
        updatedByName: 'مدير النظام',
      };
      return { ok: true, value: { ...template, fields: template.fields.map((f) => ({ ...f })) } };
    },
  };
}

/** Exposed so tests can assert against the same seed the UI renders. */
export { seedAgreements as MOCK_AGREEMENT_SEED, MOCK_NOW };
