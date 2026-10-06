import type { ExpertHubApiError } from '../../shared/services/apiClient';
import type { EntitlementService } from './entitlementService';
import {
  isVisibleToTrainer,
  type EntitlementQuery,
  type StaffEntitlementDto,
} from './entitlement.types';

/**
 * Versioned **mock** provider for CAP-06 / J-28.
 *
 * The seed exists to make `BR-0603` observable: one record is deliberately
 * **incompletely linked**, so staff can see it and the trainer cannot. If every
 * seeded record were complete, the rule would be untestable and the two-DTO
 * design would look like ceremony.
 *
 * ⚠️ MOCK DATA (clearly labelled). ⚠️ Every value here stands in for something
 * ERP owns — `BR-0601` means the platform never authors any of it.
 */

/** ⚠️ MOCK — the signed-in trainer in the portal-side tests. */
const ME = 'trn-101';

/**
 * ⚠️ MOCK ERP disbursement statuses. §8.6 never enumerates them (`Q27`), so
 * these are stand-ins carried as code + label and rendered as given — the
 * platform recognises none of them, deliberately.
 */
const STATUS = {
  paid: {
    code: 'ERP-PAID',
    label: { ar: 'مصروف', en: 'Disbursed' },
  },
  pending: {
    code: 'ERP-PENDING',
    label: { ar: 'قيد الصرف', en: 'Pending disbursement' },
  },
  onHold: {
    code: 'ERP-HOLD',
    label: { ar: 'موقوف مؤقتًا', en: 'On hold' },
  },
} as const;

/** ⚠️ MOCK entitlement records, as ERP would have supplied them. */
const SEED: readonly StaffEntitlementDto[] = [
  {
    linkage: 'complete',
    trainerId: ME,
    trainerName: 'د. سارة العتيبي',
    entitlementId: 'ent-001',
    purchaseOrderNumber: 'PO-2026-004512',
    agreementReference: 'AGR-2026-00042',
    programName: { ar: 'برنامج القيادة التنفيذية', en: 'Executive Leadership Programme' },
    status: STATUS.paid,
    amount: { value: 9000, currency: 'SAR' },
    disbursementDate: '2026-07-02T00:00:00Z',
  },
  {
    linkage: 'complete',
    trainerId: ME,
    trainerName: 'د. سارة العتيبي',
    entitlementId: 'ent-002',
    purchaseOrderNumber: 'PO-2026-004977',
    agreementReference: 'AGR-2026-00042',
    programName: { ar: 'إدارة المخاطر المصرفية', en: 'Banking Risk Management' },
    status: STATUS.pending,
    amount: { value: 7500, currency: 'SAR' },
    // Pending — ERP has issued no date yet, and none is invented.
    disbursementDate: null,
  },
  {
    // `BR-0603` — ERP sent the money but the chain does not resolve: the PO
    // exists, the agreement is identified, the programme link is not. The
    // trainer must not see this; staff must, so they can answer the call.
    linkage: 'incomplete',
    trainerId: ME,
    trainerName: 'د. سارة العتيبي',
    entitlementId: 'ent-003',
    purchaseOrderNumber: 'PO-2026-005130',
    agreementReference: 'AGR-2026-00042',
    programName: null,
    status: STATUS.onHold,
    amount: { value: 6200, currency: 'SAR' },
    disbursementDate: null,
    missingLinks: ['programme'],
  },
  {
    linkage: 'complete',
    trainerId: 'trn-104',
    trainerName: 'أ. ريم القحطاني',
    entitlementId: 'ent-004',
    purchaseOrderNumber: 'PO-2026-004610',
    agreementReference: 'AGR-2026-00201',
    programName: { ar: 'التخطيط المالي المؤسسي', en: 'Corporate Financial Planning' },
    status: STATUS.paid,
    amount: { value: 8000, currency: 'SAR' },
    disbursementDate: '2026-06-18T00:00:00Z',
  },
  {
    // A second incomplete case, missing two hops rather than one.
    linkage: 'incomplete',
    trainerId: 'trn-102',
    trainerName: 'أ. خالد المطيري',
    entitlementId: 'ent-005',
    purchaseOrderNumber: 'PO-2026-005204',
    agreementReference: null,
    programName: null,
    status: STATUS.pending,
    amount: { value: 5400, currency: 'SAR' },
    disbursementDate: null,
    missingLinks: ['agreement', 'programme'],
  },
];

export interface MockEntitlementProviderOptions {
  readonly latencyMs?: number;
  readonly failWith?: ExpertHubApiError;
  /** Whose portal this is, for `listMyEntitlements`. */
  readonly trainerId?: string;
}

function delay(ms: number): Promise<void> {
  return ms <= 0 ? Promise.resolve() : new Promise((resolve) => setTimeout(resolve, ms));
}

export function createMockEntitlementProvider(
  options: MockEntitlementProviderOptions = {}
): EntitlementService {
  const { latencyMs = 300, failWith, trainerId: me = ME } = options;

  return {
    async listMyEntitlements() {
      await delay(latencyMs);
      if (failWith != null) {
        return { ok: false, error: failWith };
      }
      // `BR-0603` applied at the source: an incompletely-linked record is
      // filtered here, on the server's side of the boundary, so it never
      // reaches a client that could accidentally render it.
      const mine = SEED.filter(
        (entitlement) => entitlement.trainerId === me && isVisibleToTrainer(entitlement)
      ).map((entitlement) => {
        const { linkage, trainerId, trainerName, ...rest } = entitlement as Extract<
          StaffEntitlementDto,
          { linkage: 'complete' }
        >;
        void linkage;
        void trainerId;
        void trainerName;
        return rest;
      });
      return { ok: true, value: mine };
    },

    async listEntitlements(query: EntitlementQuery) {
      await delay(latencyMs);
      if (failWith != null) {
        return { ok: false, error: failWith };
      }
      const term = query.trainer.trim();
      const rows = SEED.filter((entitlement) => {
        if (term !== '' && !entitlement.trainerName.includes(term)) {
          return false;
        }
        return !query.onlyIncomplete || entitlement.linkage === 'incomplete';
      });
      return { ok: true, value: rows };
    },
  };
}

export { ME as MOCK_TRAINER_ID, STATUS as MOCK_DISBURSEMENT_STATUSES };
