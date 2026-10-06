import type { Result } from '@/types';
import type { ExpertHubApiError } from '../../shared/services/apiClient';
import type {
  PublicDeliveredProgram,
  DirectoryListDto,
  DirectoryQuery,
  DirectorySpecialty,
  PublicTrainerProfileDto,
  PublicTrainerSummaryDto,
  TrainerClassification,
} from './directory.types';
import type { DirectoryService } from './directoryService';

/**
 * Versioned **mock** provider for the public directory (`CAP-10`, EH-PUB-02/03) —
 * stands in for the future public Expert Hub API. It simulates the *server's*
 * responsibilities: the **consent gate** (`BR-1002` — only consented trainers
 * are ever returned), search and paging, over the
 * whitelisted projection (`BR-1004`). Swapping this for the HTTP provider changes
 * no UI logic.
 *
 * ⚠️ MOCK DATA (clearly labelled): the seed is representative demo content, not a
 * real trainer base. The specialty/classification vocabulary is the mock config
 * taxonomy (`directory.types.ts`); the exact public whitelist is `G12`.
 *
 * **Privacy invariant (`BR-1007`):** an id that is unknown *and* an id that
 * exists but is not consented both resolve to the **same** `404` — a public
 * caller can never tell a withheld-consent trainer from a non-existent one.
 */

/** Internal seed record — the minimal private row. Carries the consent flag the
 *  public projection strips out; the rating + richer facts are DERIVED in the
 *  projection (see `toSummary`/`toProfile`), not stored here. Only `consent: true`
 *  rows are ever exposed. */
interface MockTrainerRecord {
  readonly id: string;
  readonly name: string;
  readonly classification: TrainerClassification;
  readonly specialties: readonly DirectorySpecialty[];
  readonly consent: boolean;
  /** Where they deliver — `null` when they have not said. */
  readonly city: string | null;
  readonly programsDelivered: number;
}

/** Deterministic demo dataset (no runtime clock dependency). */
export const MOCK_TRAINERS: readonly MockTrainerRecord[] = [
  {
    id: 'trn-001',
    name: 'د. سارة العتيبي',
    classification: 'expert',
    specialties: ['leadership', 'human-resources'],
    consent: true,
    city: 'الرياض',
    programsDelivered: 3,
  },
  {
    id: 'trn-002',
    name: 'أ. خالد المطيري',
    classification: 'senior',
    specialties: ['finance', 'project-management'],
    consent: true,
    city: 'جدة',
    programsDelivered: 5,
  },
  {
    id: 'trn-003',
    name: 'د. نورة القحطاني',
    classification: 'expert',
    specialties: ['digital-transformation', 'data-analytics'],
    consent: true,
    city: 'الرياض',
    programsDelivered: 2,
  },
  {
    id: 'trn-004',
    name: 'أ. عبدالله الشهري',
    classification: 'certified',
    specialties: ['cybersecurity'],
    consent: true,
    city: 'الدمام',
    programsDelivered: 7,
  },
  {
    id: 'trn-005',
    name: 'د. ريم الدوسري',
    classification: 'expert',
    specialties: ['customer-experience', 'leadership'],
    consent: true,
    city: 'الرياض',
    programsDelivered: 4,
  },
  {
    id: 'trn-006',
    name: 'أ. فهد الغامدي',
    classification: 'senior',
    specialties: ['project-management'],
    consent: true,
    city: 'جدة',
    programsDelivered: 6,
  },
  {
    id: 'trn-007',
    name: 'د. منى الحربي',
    classification: 'expert',
    specialties: ['human-resources', 'leadership'],
    consent: true,
    city: 'الرياض',
    programsDelivered: 1,
  },
  {
    id: 'trn-008',
    name: 'أ. ماجد السبيعي',
    classification: 'certified',
    specialties: ['finance'],
    consent: true,
    city: 'مكة',
    programsDelivered: 2,
  },
  {
    id: 'trn-009',
    name: 'د. هند الزهراني',
    classification: 'senior',
    specialties: ['data-analytics', 'digital-transformation'],
    consent: true,
    city: 'الرياض',
    programsDelivered: 3,
  },
  {
    id: 'trn-010',
    name: 'أ. طلال العنزي',
    classification: 'certified',
    specialties: ['customer-experience'],
    consent: true,
    city: 'جدة',
    programsDelivered: 5,
  },
  {
    id: 'trn-011',
    name: 'د. عبير الشمري',
    classification: 'senior',
    specialties: ['project-management', 'leadership'],
    consent: true,
    city: 'الرياض',
    programsDelivered: 2,
  },
  {
    id: 'trn-012',
    name: 'أ. سلطان البقمي',
    classification: 'expert',
    specialties: ['cybersecurity', 'data-analytics'],
    consent: true,
    city: 'الدمام',
    programsDelivered: 7,
  },
  {
    id: 'trn-013',
    name: 'د. لمياء الفيفي',
    classification: 'expert',
    specialties: ['digital-transformation', 'customer-experience'],
    consent: true,
    city: 'الرياض',
    programsDelivered: 4,
  },
  {
    id: 'trn-014',
    name: 'أ. راكان الحارثي',
    classification: 'certified',
    specialties: ['finance'],
    consent: true,
    city: 'جدة',
    programsDelivered: 6,
  },
  {
    id: 'trn-015',
    name: 'د. جواهر السالم',
    classification: 'senior',
    specialties: ['human-resources'],
    consent: true,
    city: 'الرياض',
    programsDelivered: 1,
  },
  {
    id: 'trn-016',
    name: 'أ. بدر الرشيدي',
    classification: 'certified',
    specialties: ['data-analytics'],
    consent: true,
    city: 'مكة',
    programsDelivered: 2,
  },
  {
    id: 'trn-017',
    name: 'د. أمل الزهراني',
    classification: 'expert',
    specialties: ['leadership', 'customer-experience'],
    consent: true,
    city: 'الرياض',
    programsDelivered: 3,
  },
  {
    id: 'trn-018',
    name: 'أ. ناصر العمري',
    classification: 'senior',
    specialties: ['project-management', 'digital-transformation'],
    consent: true,
    city: 'جدة',
    programsDelivered: 5,
  },
  // Non-consented rows — real ids that MUST resolve to the same neutral 404 as an
  // unknown id (privacy, `BR-1007`). They never appear in the list either.
  {
    id: 'trn-101',
    name: 'خبير بدون موافقة على الظهور',
    classification: 'expert',
    specialties: ['leadership'],
    consent: false,
    city: 'الرياض',
    programsDelivered: 2,
  },
  {
    id: 'trn-102',
    name: 'خبير سحب موافقة الظهور',
    classification: 'senior',
    specialties: ['finance'],
    consent: false,
    city: 'الدمام',
    programsDelivered: 7,
  },
];

export interface MockDirectoryProviderOptions {
  /** Dataset override (tests seed their own scenarios). Defaults to the demo set. */
  readonly seed?: readonly MockTrainerRecord[];
  /** Simulated network latency. Keep 0 in tests. */
  readonly latencyMs?: number;
  /** When set, every call fails with this error (error-state testing). */
  readonly failWith?: ExpertHubApiError;
}

function delay(ms: number): Promise<void> {
  return ms <= 0 ? Promise.resolve() : new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * ⚠️ MOCK delivered-programs derivation (clearly labelled). Deterministic
 * pseudo-values from the trainer id — **not real history**. The real list comes
 * from the trainer's Academy record (FAST, surfaced through the Expert Hub
 * projection per `BR-1005`). Deterministic so tests and the demo stay stable,
 * with no runtime clock or RNG.
 *
 * Note what is NOT derived here any more: there is no rating, no years of
 * experience, and no trainee count. J-24/F2/AC-1 does not permit them publicly,
 * so the mock cannot produce them even by accident.
 */
function hashId(seed: string): number {
  let hash = 0;
  for (const char of seed) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  return hash;
}

const PROGRAM_NAMES: readonly string[] = [
  'برنامج القيادة التنفيذية',
  'برنامج إدارة التغيير',
  'برنامج التخطيط المالي',
  'برنامج حوكمة البيانات',
  'برنامج تجربة المستفيد',
  'برنامج إدارة المشاريع الاحترافية',
];

function deliveredProgramsFor(record: MockTrainerRecord): PublicDeliveredProgram[] {
  const hash = hashId(`${record.id}-programs`);
  const count = 2 + (hash % 3); // 2–4 programs
  return Array.from({ length: count }, (_value, index) => {
    const pick = (hash + index * 7) % PROGRAM_NAMES.length;
    return {
      id: `${record.id}-prog-${index + 1}`,
      name: PROGRAM_NAMES[pick],
      year: 2023 + ((hash + index) % 3),
    };
  });
}

/**
 * Strip everything that is not public. The consent flag never leaves this
 * module, and neither does any field outside J-24/F2/AC-1's list.
 */
function toSummary(record: MockTrainerRecord): PublicTrainerSummaryDto {
  return {
    id: record.id,
    name: record.name,
    specialties: record.specialties,
    city: record.city,
    programsDelivered: record.programsDelivered,
    classification: record.classification,
  };
}

function toProfile(record: MockTrainerRecord): PublicTrainerProfileDto {
  return {
    ...toSummary(record),
    deliveredPrograms: deliveredProgramsFor(record),
    bio: null,
  };
}

/**
 * Name only, as the API matches. No specialty filter and no specialty search:
 * the API has no taxonomy behind either (`Q16`), and a mock that honoured them
 * would demo results the real directory cannot return.
 */
function matchesQuery(record: MockTrainerRecord, query: DirectoryQuery): boolean {
  const search = query.search?.trim().toLowerCase() ?? '';
  return search === '' || record.name.toLowerCase().includes(search);
}

export function createMockDirectoryProvider(
  options: MockDirectoryProviderOptions = {}
): DirectoryService {
  const { seed = MOCK_TRAINERS, latencyMs = 300, failWith } = options;

  // The consent gate is applied ONCE, up front: everything downstream (list,
  // search, filter, get-by-id) operates only over consented rows.
  const consented = seed.filter((record) => record.consent);

  return {
    async listDirectory(
      query: DirectoryQuery
    ): Promise<Result<DirectoryListDto, ExpertHubApiError>> {
      await delay(latencyMs);
      if (failWith != null) {
        return { ok: false, error: failWith };
      }
      const filtered = consented.filter((record) => matchesQuery(record, query));
      const pageCount = Math.max(1, Math.ceil(filtered.length / query.pageSize));
      const page = Math.min(Math.max(1, query.page), pageCount);
      const start = (page - 1) * query.pageSize;
      // Hero highlight aggregates — over the WHOLE consented set, not the filtered
      // page (derived counts, computed exactly as the real server will).
      const specialtiesRepresented = new Set(consented.flatMap((record) => record.specialties))
        .size;
      // Aggregates only PUBLIC data. The previous `expertCount` counted the
      // `expert` classification, which J-24/F2/AC-1 does not publish.
      const programsDelivered = consented.reduce(
        (total, record) => total + deliveredProgramsFor(record).length,
        0
      );
      return {
        ok: true,
        value: {
          items: filtered.slice(start, start + query.pageSize).map(toSummary),
          totalCount: filtered.length,
          page,
          pageSize: query.pageSize,
          pageCount,
          totalConsented: consented.length,
          specialtiesRepresented,
          programsDelivered,
        },
      };
    },

    async getPublicTrainer(
      id: string
    ): Promise<Result<PublicTrainerProfileDto, ExpertHubApiError>> {
      await delay(latencyMs);
      if (failWith != null) {
        return { ok: false, error: failWith };
      }
      // Search only the consented set: an unknown id and a non-consented id are
      // therefore indistinguishable — both fall through to the same 404 (privacy,
      // `BR-1007`). Never look at non-consented rows here.
      const record = consented.find((candidate) => candidate.id === id);
      if (record == null) {
        return { ok: false, error: { status: 404, message: 'Profile not available.' } };
      }
      return { ok: true, value: toProfile(record) };
    },
  };
}
