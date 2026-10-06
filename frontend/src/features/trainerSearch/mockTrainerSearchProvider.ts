import type { ExpertHubApiError } from '../../shared/services/apiClient';
import type { TrainerSearchService } from './trainerSearchService';
import type {
  BioDecision,
  IdentityCardDto,
  PendingBioDto,
  TrainerProfileDto,
  TrainerSearchFilters,
  TrainerSearchResultDto,
} from './trainerSearch.types';

/**
 * Versioned **mock** provider for EH-INT-07/08 (J-15). It simulates the server's
 * side of the search — including file status, which the client could not
 * compute for itself (calculated server-side).
 *
 * ⚠️ MOCK DATA (clearly labelled): trainers, records and evaluations are
 * representative development data.
 *
 * It filters only on what the API filters on. Specialty, domain and minimum
 * evaluation are refused there (`Q16`, `DM-GAP-14`), so they are not simulated
 * here — a mock that honoured them would demo a filter the real API cannot run.
 */

interface MockTrainerRecord extends TrainerSearchResultDto {
  readonly email: string;
  readonly phone: string;
  readonly city: string;
  readonly academicQualification: string;
  readonly certifications: readonly string[];
  readonly record: TrainerProfileDto['record'];
  readonly evaluationSyncedAt: string | null;
  readonly perProgram: readonly { readonly program: string; readonly score: number }[];
  readonly agreement: TrainerProfileDto['agreement'];
}

const MOCK_TRAINERS: readonly MockTrainerRecord[] = [
  {
    trainerId: 'trn-001',
    name: 'د. سارة العتيبي',
    services: ['consultant', 'trainer'],
    specialties: ['leadership', 'human-resources'],
    classification: 'expert',
    fileStatus: 'active',
    evaluationOverall: 4.5,
    certificationCount: 4,
    // The API has no numeric years source — unknown, as it serves it.
    yearsExperience: null,
    email: 'sara@example.sa',
    phone: '+966500000010',
    city: 'الرياض',
    academicQualification: 'دكتوراه في إدارة الأعمال',
    certifications: [
      'شهادة تدريب المدربين (TOT)',
      'محترف إدارة المشاريع (PMP)',
      'عضوية الجمعية السعودية للإدارة',
      'شهادة القيادة التنفيذية',
    ],
    record: [
      { id: 'r1', name: 'برنامج القيادة التنفيذية', role: 'مدرب رئيسي', year: 2025 },
      { id: 'r2', name: 'برنامج إدارة التغيير', role: 'مستشار', year: 2024 },
    ],
    evaluationSyncedAt: '2026-08-14T06:00:00Z',
    perProgram: [
      { program: 'برنامج القيادة التنفيذية', score: 4.7 },
      { program: 'برنامج إدارة التغيير', score: 4.3 },
    ],
    agreement: {
      reference: 'AGR-2026-00042',
      status: 'active',
      startsAt: '2025-09-01T00:00:00Z',
      endsAt: '2026-09-01T00:00:00Z',
    },
  },
  {
    trainerId: 'trn-002',
    name: 'أ. خالد المطيري',
    services: ['trainer'],
    specialties: ['finance'],
    classification: 'senior',
    // J-13: contractually active, but no engagement in the last 6 months.
    // "Monitoring purposes only, with NO effect on matching eligibility."
    fileStatus: 'idle',
    evaluationOverall: 4.0,
    certificationCount: 2,
    // The API has no numeric years source — unknown, as it serves it.
    yearsExperience: null,
    email: 'khaled@example.sa',
    phone: '+966500000011',
    city: 'جدة',
    academicQualification: 'ماجستير في المالية',
    certifications: ['محلل مالي معتمد (CFA)', 'شهادة تدريب المدربين (TOT)'],
    record: [{ id: 'r3', name: 'برنامج التخطيط المالي', role: 'مدرب', year: 2024 }],
    evaluationSyncedAt: '2026-08-10T06:00:00Z',
    perProgram: [{ program: 'برنامج التخطيط المالي', score: 4.0 }],
    agreement: {
      reference: 'AGR-2025-00311',
      status: 'active',
      startsAt: '2023-12-31T00:00:00Z',
      endsAt: '2026-12-31T00:00:00Z',
    },
  },
  {
    trainerId: 'trn-003',
    name: 'م. نورة الشمري',
    services: ['trainer', 'content-developer'],
    specialties: ['digital-transformation', 'data-analytics'],
    classification: 'certified',
    fileStatus: 'expired',
    // Not every trainer has a calculated rating yet (`02D`, P-06).
    evaluationOverall: null,
    certificationCount: 1,
    // The API has no numeric years source — unknown, as it serves it.
    yearsExperience: null,
    email: 'noura@example.sa',
    phone: '+966500000012',
    city: 'الدمام',
    academicQualification: 'بكالوريوس في هندسة الحاسب',
    certifications: ['شهادة تحليل البيانات'],
    record: [],
    evaluationSyncedAt: null,
    perProgram: [],
    agreement: {
      reference: 'AGR-2024-00088',
      status: 'expired',
      startsAt: '2023-07-01T00:00:00Z',
      endsAt: '2026-07-01T00:00:00Z',
    },
  },
  {
    trainerId: 'trn-004',
    name: 'أ. ريم القحطاني',
    services: ['question-writer'],
    specialties: ['cybersecurity'],
    classification: 'senior',
    fileStatus: 'suspended',
    evaluationOverall: 3.5,
    certificationCount: 3,
    // The API has no numeric years source — unknown, as it serves it.
    yearsExperience: null,
    email: 'reem@example.sa',
    phone: '+966500000013',
    city: 'الرياض',
    academicQualification: 'ماجستير في أمن المعلومات',
    certifications: ['CISSP', 'CISM', 'شهادة تدريب المدربين (TOT)'],
    record: [{ id: 'r4', name: 'برنامج الأمن السيبراني', role: 'كاتب أسئلة', year: 2025 }],
    evaluationSyncedAt: '2026-07-30T06:00:00Z',
    perProgram: [{ program: 'برنامج الأمن السيبراني', score: 3.5 }],
    agreement: {
      reference: 'AGR-2026-00108',
      status: 'suspended',
      startsAt: '2026-02-01T00:00:00Z',
      endsAt: '2027-02-01T00:00:00Z',
    },
  },
];

/**
 * The Identity Card, from the seven matrix rows and nothing else (F2/AC-1),
 * shaped as the API builds it from the trainer profile: related fields from the
 * field/domain answer, social accounts from the LinkedIn and personal-website
 * links, experience as the profile's free text. Photo is `null` (`G26`).
 */
function identityCardFor(trainer: MockTrainerRecord): IdentityCardDto {
  return {
    photoUrl: null,
    name: trainer.name,
    experience: 'قيادة برامج التطوير المهني في القطاع المالي',
    academicQualifications: trainer.academicQualification,
    relatedFields: ['القيادة وإدارة الأعمال العالمية'],
    certifications: trainer.certifications,
    socialAccounts: ['https://www.linkedin.com/in/example'],
    // `G26` — no document generation/storage, and the approved design template
    // is not in this repository. No client-side PDF is invented to fill the gap.
    pdfUrl: null,
  };
}

export interface MockTrainerSearchProviderOptions {
  readonly latencyMs?: number;
  readonly failWith?: ExpertHubApiError;
}

function delay(ms: number): Promise<void> {
  return ms <= 0 ? Promise.resolve() : new Promise((resolve) => setTimeout(resolve, ms));
}

function toResult(trainer: MockTrainerRecord): TrainerSearchResultDto {
  return {
    trainerId: trainer.trainerId,
    name: trainer.name,
    services: trainer.services,
    specialties: trainer.specialties,
    classification: trainer.classification,
    fileStatus: trainer.fileStatus,
    evaluationOverall: trainer.evaluationOverall,
    certificationCount: trainer.certificationCount,
    yearsExperience: trainer.yearsExperience,
  };
}

const MOCK_PENDING_BIOS: readonly PendingBioDto[] = [
  {
    trainerId: 'mock-trainer-bio',
    trainerName: 'نورة القحطاني',
    draft:
      'مدربة معتمدة في الامتثال المالي ومكافحة غسل الأموال، تحمل درجة الماجستير في الإدارة المالية، وتقدّم برامج تدريبية للعاملين في القطاع المصرفي.',
    draftSource: 'ai',
    published: null,
    submittedAt: '2026-10-04T09:00:00Z',
    revision: 3,
  },
];

export function createMockTrainerSearchProvider(
  options: MockTrainerSearchProviderOptions = {}
): TrainerSearchService {
  const { latencyMs = 300, failWith } = options;
  // ⚠️ MOCK: one bio waiting, so the review screen is demonstrable.
  let pendingBios: PendingBioDto[] = [...MOCK_PENDING_BIOS];

  return {
    async getPendingBios() {
      await delay(latencyMs);
      if (failWith != null) {
        return { ok: false, error: failWith };
      }
      return { ok: true, value: [...pendingBios] };
    },

    async decideBio(trainerId: string, decision: BioDecision, note: string, revision: number) {
      await delay(latencyMs);
      if (failWith != null) {
        return { ok: false, error: failWith };
      }
      const target = pendingBios.find((bio) => bio.trainerId === trainerId);
      if (target == null || target.revision !== revision) {
        return { ok: false, error: { status: 409, message: 'Already changed.' } };
      }
      if (decision === 'return' && note.trim() === '') {
        return { ok: false, error: { status: 400, message: 'note-required' } };
      }
      pendingBios = pendingBios.filter((bio) => bio.trainerId !== trainerId);
      return { ok: true, value: [...pendingBios] };
    },

    async searchTrainers(filters: TrainerSearchFilters) {
      await delay(latencyMs);
      if (failWith != null) {
        return { ok: false, error: failWith };
      }
      const search = filters.search.trim().toLowerCase();
      const items = MOCK_TRAINERS.filter((trainer) => {
        if (search !== '' && !trainer.name.toLowerCase().includes(search)) {
          return false;
        }
        if (filters.service !== 'all' && !trainer.services.includes(filters.service)) {
          return false;
        }
        if (filters.fileStatus !== 'all' && trainer.fileStatus !== filters.fileStatus) {
          return false;
        }
        if (
          filters.minCertifications != null &&
          trainer.certificationCount < filters.minCertifications
        ) {
          return false;
        }
        return true;
      }).map(toResult);

      return {
        ok: true,
        value: { items, totalCount: items.length },
      };
    },

    async getTrainerProfile(trainerId: string) {
      await delay(latencyMs);
      if (failWith != null) {
        return { ok: false, error: failWith };
      }
      const trainer = MOCK_TRAINERS.find((candidate) => candidate.trainerId === trainerId);
      if (trainer == null) {
        return { ok: false, error: { status: 404, message: 'Trainer not found.' } };
      }
      const value: TrainerProfileDto = {
        trainerId: trainer.trainerId,
        name: trainer.name,
        email: trainer.email,
        phone: trainer.phone,
        city: trainer.city,
        avatarUrl: null,
        services: trainer.services,
        specialties: trainer.specialties,
        classification: trainer.classification,
        yearsExperience: trainer.yearsExperience,
        academicQualification: trainer.academicQualification,
        certifications: trainer.certifications,
        fileStatus: trainer.fileStatus,
        record: trainer.record,
        evaluation: {
          overall: trainer.evaluationOverall,
          // AC-1 asks for the last sync date explicitly — internal views carry
          // the provenance the trainer's own view does not (`02D` §9).
          lastSyncedAt: trainer.evaluationSyncedAt,
          perProgram: trainer.perProgram,
        },
        agreement: trainer.agreement,
        identityCard: identityCardFor(trainer),
        bio: null,
      };
      return { ok: true, value };
    },
  };
}
