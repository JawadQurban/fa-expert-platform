import type { Result } from '@/types';
import type { ExpertHubApiError } from '../../shared/services/apiClient';
import { APPLICATION_FORM_SCHEMA } from '../applications/applicationSchema';
import type {
  BankDataFields,
  MyProfileDto,
  ProfileFieldStateDto,
  ProfileFieldValues,
} from './profile.types';
import { BIO_MAX_LENGTH } from './profile.types';
import type { ProfileService } from './profileService';

/**
 * Versioned **mock** provider for `CAP-04` (My Profile, EH-TP-04) — stands in for
 * the future Expert Hub API. It simulates the *server's* responsibilities: the
 * field-ownership model, the FAST **change-request → pending** flow (`BR-0404` —
 * the old value stays until FAST confirms), certificate validation (`BR-0106`),
 * and the visibility-consent write that drives the public directory
 * (`BR-1002/1007`). Swapping this for the HTTP provider changes no UI logic.
 *
 * ⚠️ MOCK DATA (clearly labelled): the seed is representative demo content. The
 * ratings are the calculated indicator (`02D`) with representative values pending
 * the real MTM calc (`G53`–`G64`); FAST provenance/sync are simulated (`G36`).
 *
 * **J-14/F1/AC-1** is honoured at the source: the schema below is *literally*
 * `APPLICATION_FORM_SCHEMA` — the same object EH-TP-05 renders. There is no
 * profile-specific field list to drift out of step with the application form,
 * because there is no profile-specific field list.
 */

/**
 * ⚠️ MOCK per-field editability. In production the server decides this per
 * trainer (P-J9); the mock applies the documented ownership model:
 * `sso-profile` fields are FAST-owned (request-change only, `BR-0404`) and
 * everything else is directly editable. No field is locked here — J-14/F2's
 * three locked rows are profile-level facts, not form fields, and live in
 * `lockedFacts`.
 */
function buildFieldStates(): readonly ProfileFieldStateDto[] {
  return APPLICATION_FORM_SCHEMA.fields.map((field) => {
    const fastOwned = field.ownership === 'sso-profile';
    return {
      fieldId: field.id,
      editability: fastOwned ? ('request-change' as const) : ('editable' as const),
      pendingValue: null,
      lastSyncAt: fastOwned ? '2026-07-20T08:00:00Z' : null,
      lockReason: null,
    };
  });
}

/** Deterministic seed profile (fixed dates — no runtime clock dependency). Reuses
 *  the `خبير تجريبي` identity the applications mock already uses. */
export const MOCK_PROFILE: MyProfileDto = {
  displayName: 'خبير تجريبي',
  email: 'expert@example.sa',
  avatarUrl: null,
  classification: 'expert',
  // J-14/F1/AC-1 — the SAME schema the application form uses, not a copy.
  formSchema: APPLICATION_FORM_SCHEMA,
  fieldValues: {
    // Field ids are the supplied `DM-GAP-01` map's (`applicationSchema.ts`).
    firstNameAr: 'خبير',
    middleNameAr: 'بن',
    thirdNameAr: 'مثال',
    lastNameAr: 'تجريبي',
    firstNameEn: 'Khabeer',
    middleNameEn: 'Bin',
    thirdNameEn: 'Mithal',
    lastNameEn: 'Tajreebi',
    idNumber: '1000000001',
    dateOfBirth: '1985-03-01',
    nationality: 'sa',
    gender: 'male',
    sector: 'finance',
    domain: 'dom-023',
    qualificationType: 'master',
    generalSpecialization: 'finance',
    // Option codes since `dm-gap-01.2026-09-21`: these three fields became
    // dropdowns over the delivered reference lists, so a free-text value here
    // would render as "not chosen".
    specializationDetail: 'spec-004',
    universityName: 'uni-001',
    qualificationDate: '2010-06-01',
    certificateName: 'CERT-0075',
    issuingInstitution: 'CFA Institute',
    certificateDate: '2015-09-01',
    certificateAttachmentName: 'شهادة CFA',
    jobTitle: 'مستشار مالي أول',
    organization: 'شركة تجريبية',
    currentlyEmployed: true,
    experienceStartDate: '2016-01-01',
    responsibilities: 'تقديم الاستشارات المالية.',
    // Added by `dm-gap-01.2026-09-22` and mandatory for all four services —
    // the same controlled «مجال التخصص» list `domain` uses. Without a value
    // here the profile's own save cannot validate, because `save()` checks
    // every editable field of the schema.
    participationTypes: ['official-programs', 'workshops'],
    audiences: ['executives'],
    // Mandatory for the Trainer since `dm-gap-01.2026-10-07` (`P-342`).
    hasTrainedBefore: 'yes',
    hasReadyMaterials: 'yes',
    preferredDeliveryMode: 'onsite',
    // Required by the per-service split of `dm-gap-01.2026-09-21`; this demo
    // trainer also holds Consultant, so both sides are answered.
    trainingExperienceYears: '6-10',
    consultingExperienceYears: '3-5',
    readyConsultingMaterials: 'yes',
    engagementMode: 'part-time',
    annualAvailability: 'specific-periods',
    estimatedAnnualEngagements: '4-6',
    inPersonCities: 'الرياض، جدة',
    preferredEngagementTypes: ['short-training', 'intensive-workshops'],
  },
  fieldStates: buildFieldStates(),
  // J-14/F2 — visible, never editable, updated only from their source.
  lockedFacts: {
    classification: 'expert',
    evaluationOverall: 4.5,
    agreementStatus: 'active',
    agreementEndsAt: '2027-06-30T23:59:59Z',
  },
  services: ['trainer', 'consultant'],
  specialties: ['leadership', 'human-resources'],
  programs: [
    { id: 'prog-1', name: 'برنامج القيادة التنفيذية', role: 'مدرب رئيسي', year: 2025 },
    { id: 'prog-2', name: 'برنامج إدارة التغيير', role: 'مدرب', year: 2024 },
    { id: 'prog-3', name: 'برنامج تطوير القيادات الوسطى', role: 'مستشار', year: 2024 },
  ],
  ratings: {
    state: 'calculated',
    overall: 4.5,
    lastRefreshedAt: '2026-07-18T08:00:00Z',
    programs: [
      { program: 'برنامج القيادة التنفيذية', score: 5 },
      { program: 'برنامج إدارة التغيير', score: 4.5 },
      { program: 'برنامج تطوير القيادات الوسطى', score: 4 },
    ],
  },
  certificates: [{ id: 'cert-1', name: 'شهادة-اعتماد-مدرب.pdf' }],
  academyRecords: {
    // ⚠️ The OVERFLOW: the newest degree is already in the fields above, so
    // what shows here is the one the single set of fields could not hold.
    education: [
      {
        qualification: 'بكالوريوس',
        specialization: 'محاسبة',
        institution: 'جامعة الملك سعود',
        obtainedAt: '2012-06-01T00:00:00Z',
      },
    ],
    certifications: [],
    contracts: [],
    syncedAt: '2026-09-10T08:00:00Z',
  },
  visibilityConsent: true,
  /**
   * ⚠️ MOCK: seeded as `requested` so the J-09/F6 section is demonstrable — this
   * is the state a trainer is in immediately after preliminary approval. Before
   * that the state is `not-requested` and the section does not render at all.
   */
  bankData: {
    state: 'requested',
    fields: null,
    requestedAt: '2026-07-29T09:00:00Z',
    completedAt: null,
  },
  fastAvailable: true,
  establishedInExpertHub: true,
  bio: {
    status: 'none',
    draft: null,
    draftSource: null,
    published: null,
    reviewNote: null,
    revision: 0,
    hasCv: true,
  },
};

/** ⚠️ MOCK: what the AI step returns here, instantly. The real draft arrives later. */
const MOCK_BIO_DRAFT =
  'مدربة معتمدة في الامتثال المالي ومكافحة غسل الأموال، تحمل درجة الماجستير في الإدارة المالية، وتقدّم برامج تدريبية للعاملين في القطاع المصرفي.';

export interface MockProfileProviderOptions {
  /** Profile override (tests seed their own scenarios). */
  readonly seed?: MyProfileDto;
  /** Simulated network latency. Keep 0 in tests. */
  readonly latencyMs?: number;
  /** When set, every call fails with this error (error-state testing). */
  readonly failWith?: ExpertHubApiError;
  /** Make certificate upload fail (upload-error / retry testing). */
  readonly uploadFailWith?: ExpertHubApiError;
}

function delay(ms: number): Promise<void> {
  return ms <= 0 ? Promise.resolve() : new Promise((resolve) => setTimeout(resolve, ms));
}

function clone(profile: MyProfileDto): MyProfileDto {
  return {
    ...profile,
    fieldValues: { ...profile.fieldValues },
    fieldStates: profile.fieldStates.map((state) => ({ ...state })),
    lockedFacts: { ...profile.lockedFacts },
    services: [...profile.services],
    specialties: [...profile.specialties],
    programs: profile.programs.map((program) => ({ ...program })),
    ratings: { ...profile.ratings, programs: profile.ratings.programs.map((row) => ({ ...row })) },
    certificates: profile.certificates.map((cert) => ({ ...cert })),
  };
}

export function createMockProfileProvider(
  options: MockProfileProviderOptions = {}
): ProfileService {
  const { seed = MOCK_PROFILE, latencyMs = 300, failWith, uploadFailWith } = options;

  // Profile state held in the closure exactly as the server holds it. Cloned so
  // tests never mutate the shared seed.
  let profile = clone(seed);
  let certCounter = 0;

  const ok = (): Result<MyProfileDto, ExpertHubApiError> => ({ ok: true, value: clone(profile) });

  return {
    async getMyProfile() {
      await delay(latencyMs);
      if (failWith != null) {
        return { ok: false, error: failWith };
      }
      return ok();
    },

    async saveProfileFields(values: ProfileFieldValues) {
      await delay(latencyMs);
      if (failWith != null) {
        return { ok: false, error: failWith };
      }
      // The same gate the UI applies, applied again here: a client that skipped
      // the form must not be able to write a FAST-owned or locked field
      // (`BR-0404`, `BR-0411`).
      const writable = new Set(
        profile.fieldStates
          .filter((state) => state.editability === 'editable')
          .map((state) => state.fieldId)
      );
      const rejected = Object.keys(values).filter((fieldId) => !writable.has(fieldId));
      if (rejected.length > 0) {
        return {
          ok: false,
          error: { status: 400, message: `Not editable: ${rejected.join(', ')}` },
        };
      }
      // J-14/F1/AC-4 — reflected immediately; no resubmission, no approval cycle.
      profile = { ...profile, fieldValues: { ...profile.fieldValues, ...values } };
      return ok();
    },

    async requestFastFieldChange(fieldId: string, newValue: string) {
      await delay(latencyMs);
      if (failWith != null) {
        return { ok: false, error: failWith };
      }
      const target = profile.fieldStates.find((state) => state.fieldId === fieldId);
      if (target == null || target.editability !== 'request-change') {
        return { ok: false, error: { status: 400, message: 'Field is not request-change.' } };
      }
      // `BR-0404` / `03` J5: a change request sets `pendingValue`; the confirmed
      // value in `fieldValues` stays displayed until FAST confirms (the mock
      // leaves it pending — real confirmation is FAST's, `G36`).
      profile = {
        ...profile,
        fieldStates: profile.fieldStates.map((state) =>
          state.fieldId === fieldId ? { ...state, pendingValue: newValue } : state
        ),
      };
      return ok();
    },

    async setVisibilityConsent(consent: boolean) {
      await delay(latencyMs);
      if (failWith != null) {
        return { ok: false, error: failWith };
      }
      // `BR-1007`: the change is immediate — the public directory reflects it now.
      profile = { ...profile, visibilityConsent: consent };
      return ok();
    },

    async saveBankData(fields: BankDataFields) {
      await delay(latencyMs);
      if (failWith != null) {
        return { ok: false, error: failWith };
      }
      // J-09/F6/AC-4 — saving completes the data; the server then notifies the
      // application's creator that agreement preparation (J-10) can proceed.
      profile = {
        ...profile,
        bankData: {
          state: 'complete',
          fields: { ...fields },
          requestedAt: profile.bankData.requestedAt,
          completedAt: '2026-07-29T12:00:00Z',
        },
      };
      return ok();
    },

    async uploadCertificate(file: File) {
      await delay(latencyMs);
      if (failWith != null) {
        return { ok: false, error: failWith };
      }
      if (uploadFailWith != null) {
        return { ok: false, error: uploadFailWith };
      }
      // J-14/F1/AC-2 — the trainer's application `professional-certificate`
      // rule, in the server's order: no rule (409), empty (400), format/size (422).
      const rule = profile.formSchema.attachments.find(
        (candidate) => candidate.id === 'professional-certificate'
      );
      if (rule == null) {
        return { ok: false, error: { status: 409, message: 'certificate-rule-unavailable' } };
      }
      if (file.size === 0) {
        return { ok: false, error: { status: 400, message: 'file-required' } };
      }
      const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
      if (!rule.acceptedFormats.includes(extension) || file.size > rule.maxSizeMb * 1024 * 1024) {
        return { ok: false, error: { status: 422, message: 'Invalid certificate file.' } };
      }
      certCounter += 1;
      profile = {
        ...profile,
        certificates: [...profile.certificates, { id: `cert-new-${certCounter}`, name: file.name }],
      };
      return ok();
    },

    async requestBioDraft(revision: number) {
      await delay(latencyMs);
      if (failWith != null) {
        return { ok: false, error: failWith };
      }
      const bio = profile.bio;
      if (bio == null || bio.revision !== revision || bio.status === 'pending_review') {
        return { ok: false, error: { status: 409, message: 'Already changed.' } };
      }
      if (!bio.hasCv) {
        return { ok: false, error: { status: 409, message: 'no-cv' } };
      }
      profile = {
        ...profile,
        bio: {
          ...bio,
          status: 'ai_draft',
          draft: MOCK_BIO_DRAFT,
          draftSource: 'ai',
          revision: bio.revision + 2,
        },
      };
      return ok();
    },

    async submitBio(text: string, revision: number) {
      await delay(latencyMs);
      if (failWith != null) {
        return { ok: false, error: failWith };
      }
      const bio = profile.bio;
      if (bio == null || bio.revision !== revision) {
        return { ok: false, error: { status: 409, message: 'Already changed.' } };
      }
      const trimmed = text.trim();
      if (trimmed === '' || trimmed.length > BIO_MAX_LENGTH) {
        return { ok: false, error: { status: 400, message: 'bio-length' } };
      }
      profile = {
        ...profile,
        bio: {
          ...bio,
          status: 'pending_review',
          draft: trimmed,
          draftSource: bio.draftSource === 'ai' && bio.draft === trimmed ? 'ai' : 'trainer',
          reviewNote: null,
          revision: bio.revision + 1,
        },
      };
      return ok();
    },

    async removeCertificate(id: string) {
      await delay(latencyMs);
      if (failWith != null) {
        return { ok: false, error: failWith };
      }
      profile = {
        ...profile,
        certificates: profile.certificates.filter((cert) => cert.id !== id),
      };
      return ok();
    },
  };
}
