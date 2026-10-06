/**
 * **Where each FAST-sourced Expert Hub field actually comes from.**
 *
 * The browser never talks to FAST (`02C` §5) — every value here arrives through
 * the Expert Hub API, which resolves FAST's integer lookup ids into the strings
 * the DTOs carry. So this map is *not* a schema the frontend consumes. It is the
 * **provenance record**: the list of Expert Hub fields whose value originates in
 * a named FAST column.
 *
 * It exists for three reasons, in order of how much they matter:
 *
 * 1. **It makes a claim checkable.** `fastSources.test.ts` asserts every entry
 *    below against `FAST_SCHEMA_SNAPSHOT`, which is generated from the two
 *    supplied field files. A field FAST never supplied cannot be claimed here
 *    without failing the build — which is the same discipline the journeys get:
 *    make the wrong thing unrepresentable rather than merely discouraged.
 * 2. **It is the shopping list for the Expert Hub database.** The owner's plan is
 *    to build one once the architecture settles. FAST supplied 406 columns; the
 *    frontend actually consumes the ~50 below. That difference is the useful
 *    part of this file.
 * 3. **It shows what is *not* sourced yet.** `PENDING_FAST_SOURCES` names the
 *    fields we render that have no supplied column behind them. Every one is a
 *    real gap already tracked in `TODO.md`, restated here where the code is.
 *
 * ⚠️ Nothing in this file is inferred. Where a mapping is *likely* but not
 * confirmed, it belongs in `PENDING_FAST_SOURCES` with the question that would
 * settle it — not in `FAST_SOURCES` with a hopeful comment.
 */

/** One Expert Hub field, and the FAST column its value comes from. */
export interface FastSource {
  /** The Expert Hub DTO field, as `TypeName.field`. */
  readonly field: string;
  /** `Table.Column`, exactly as the supplied files spell it. */
  readonly column: string;
  /** The journey / AC that requires it, so the mapping is traceable both ways. */
  readonly requiredBy: string;
  /** Anything the mapping does not make obvious. */
  readonly note?: string;
}

export const FAST_SOURCES: readonly FastSource[] = [
  /* ── J-16 · the programme half of the pulled payload ─────────────────── */
  {
    field: 'PulledProgramDataDto.programId',
    column: 'ImsTraining.program.Program.Id',
    requiredBy: 'J-16/F3',
  },
  {
    field: 'PulledProgramDataDto.name.ar',
    column: 'ImsTraining.program.Program.NameAr',
    requiredBy: 'J-16/F3 row 2',
  },
  {
    field: 'PulledProgramDataDto.name.en',
    column: 'ImsTraining.program.Program.NameEn',
    requiredBy: 'J-16/F3 row 2',
  },
  {
    field: 'PulledProgramDataDto.identityBrief.ar',
    column: 'ImsTraining.program.Program.BriefAr',
    requiredBy: 'J-16/F3 row 1',
    note: 'Bilingual in FAST, so bilingual here — see P-114.',
  },
  {
    field: 'PulledProgramDataDto.identityBrief.en',
    column: 'ImsTraining.program.Program.BriefEn',
    requiredBy: 'J-16/F3 row 1',
  },

  /* ── J-16 · the plan half ────────────────────────────────────────────── */
  { field: 'PulledPlanDataDto.planId', column: 'ImsTraining.plan.Plan.Id', requiredBy: 'J-16/F3' },
  {
    field: 'PulledPlanDataDto.days',
    column: 'ImsTraining.plan.Plan.NumberOfDays',
    requiredBy: 'J-16/F3 row 4',
  },
  {
    field: 'PulledPlanDataDto.hours',
    column: 'ImsTraining.plan.Plan.NumberOfHours',
    requiredBy: 'J-16/F3 row 5',
    note: '`float` in FAST — half-hours are representable.',
  },
  {
    field: 'PulledPlanDataDto.programFee',
    column: 'ImsTraining.plan.Plan.ProgramFees',
    requiredBy: 'J-16/F3 row 6',
    note: 'Display only, and separate from the trainer fee (P-74).',
  },
  {
    field: 'PulledPlanDataDto.language',
    column: 'ImsTraining.plan.Plan.LanguageId',
    requiredBy: 'J-16/F3 row 7',
    note: 'An `int` id in FAST; the API resolves it to a label before the browser sees it.',
  },
  {
    field: 'PulledPlanDataDto.country',
    column: 'ImsTraining.plan.Plan.CountryId',
    requiredBy: 'J-16/F3 row 9',
    note: 'Resolved id, as above.',
  },
  {
    field: 'PulledPlanDataDto.city',
    column: 'ImsTraining.plan.Plan.CityId',
    requiredBy: 'J-16/F3 row 9',
    note: 'Resolved id, as above.',
  },
  {
    field: 'PulledPlanDataDto.startsAt',
    column: 'ImsTraining.plan.PlanScheduleDay.StartDate',
    requiredBy: 'J-16/F3 row 10',
    note: 'The *first* schedule day. FAST holds one row per day; the API derives the range.',
  },
  {
    field: 'PulledPlanDataDto.endsAt',
    column: 'ImsTraining.plan.PlanScheduleDay.EndDate',
    requiredBy: 'J-16/F3 row 10 · J-21/F5/AC-1',
    note: 'The *last* schedule day — which `IsLatestSchedule` identifies. J-21 completes the engagement off exactly this value.',
  },
  {
    field: 'PulledPlanDataDto.meetingUrl',
    column: 'ImsTraining.plan.Plan.TeamsUrl',
    requiredBy: 'J-16/F3 row 11 · J-21/F2/AC-1',
    note: 'Carried from J-16 and surfaced only by J-21, only when online (P-104).',
  },
  {
    field: 'PulledPlanDataDto.trainingMaterialName',
    column: 'ImsTraining.plan.Plan.TrainingMaterialAttachmentId',
    requiredBy: 'J-16/F3 row 12 · J-20/F5/AC-2',
  },

  /* ── J-16/F2/AC-2 · which plans are selectable at all ─────────────────── */
  {
    field: 'FastPlanSummaryDto.fastStatus',
    column: 'ImsTraining.plan.Plan.PlanStatusId',
    requiredBy: 'J-16/F2/AC-2',
    note: 'The Final-Closed exclusion is applied at the source, never in the browser (P-77). `FinalClosedOn` / `ClosedOn` carry the timestamps.',
  },

  /* ── J-18 · the offer, and the FAST write on acceptance ───────────────── */
  {
    field: 'AssignmentSlotDto.confirmedTrainerId',
    column: 'ImsTraining.plan.PlanTrainer.TrainerId',
    requiredBy: 'J-18/F4/AC-1',
    note: 'The field the sync writes. Per slot and immediate (P-88).',
  },
  {
    field: 'AssignmentSlotDto.fastSync',
    column: 'ImsTraining.plan.PlanTrainer.PlanId',
    requiredBy: 'J-18/F4/AC-1',
    note: 'The link row the sync creates — "linked to the same plan the request was submitted for".',
  },

  /* ── J-20 · the training-material status check ────────────────────────── */
  {
    field: 'TrainingMaterialDto.status',
    column: 'ImsTraining.plan.Plan.TrainingMaterialStatusId',
    requiredBy: 'J-18/F5/AC-1 · J-20/F1/AC-1',
    note: 'The *values* are `lookup.TrainingMaterialStatus`, which was not supplied — see `PENDING_FAST_SOURCES`.',
  },
  {
    field: 'TrainingMaterialDto.attachmentName',
    column: 'ImsTraining.plan.Plan.TrainingMaterialAttachmentId',
    requiredBy: 'J-18/F5/AC-2 · J-20/F3/AC-1',
    note: 'J-20/F3 writes an approved upload back to this column — the one platform → FAST flow.',
  },

  /* ── J-21 · execution ─────────────────────────────────────────────────── */
  {
    field: 'EngagementDetailDto.status',
    column: 'ImsTraining.plan.PlanScheduleDay.EndDate',
    requiredBy: 'J-21/F5/AC-1',
    note: 'Derived, not stored: today past the last schedule day ⇒ completed (P-102).',
  },
  {
    field: 'EngagementDetailDto.scheduleChangedAt',
    column: 'ImsTraining.plan.PlanScheduleDay.IsLatestSchedule',
    requiredBy: 'J-21/F1/AC-3',
    note: 'FAST keeps superseded schedules; a new latest row is what "the dates changed" means.',
  },
  {
    field: 'TraineeEvaluationDto.rawValue',
    column: 'ImsCommon.Survey.SurveyResponse.AnswerData',
    requiredBy: 'J-21/F6/AC-1',
    note: 'The raw MTM answer. `02D`: never overwritten, always distinguishable from a calculated figure.',
  },
  {
    field: 'TraineeEvaluationDto.scaleLow',
    column: 'ImsCommon.Survey.SurveyResponse.ScaleLow',
    requiredBy: 'J-21/F6/AC-1',
    note: 'MTM supplies a scale *range*, not a maximum — see P-115.',
  },
  {
    field: 'TraineeEvaluationDto.scaleHigh',
    column: 'ImsCommon.Survey.SurveyResponse.ScaleHigh',
    requiredBy: 'J-21/F6/AC-1',
  },
  {
    field: 'TraineeEvaluationDto.receivedAt',
    column: 'ImsCommon.Survey.SurveyResponse.EnteredDateTime',
    requiredBy: 'J-21/F6/AC-1',
  },
  {
    field: 'TraineeEvaluationDto.trainerName',
    column: 'ImsCommon.Survey.Instructor.InstructorFirstName',
    requiredBy: 'J-21/F6/AC-3',
    note: 'Carried on the record, not inferred from the engagement (P-107). `InstructorLastName` completes it.',
  },

  /* ── J-22 · cancellation received from FAST ───────────────────────────── */
  {
    field: 'EngagementTerminationDto.reasonCode',
    column: 'ImsTraining.plan.Plan.PlanCancelReasonId',
    requiredBy: 'J-22/F3/AC-1',
    note: 'Rendered as given — `lookup.PlanCancelReason` was not supplied, so nothing translates it.',
  },
  {
    field: 'EngagementTerminationDto.reasonText',
    column: 'ImsTraining.plan.Plan.CancelReasonOther',
    requiredBy: 'J-22/F3/AC-1',
  },
  {
    field: 'EngagementTerminationDto.at',
    column: 'ImsTraining.plan.Plan.CanceledOn',
    requiredBy: 'J-22/F3/AC-1',
    note: 'For the `cancelled` member only. The two `withdrawn` members are Expert Hub’s own.',
  },

  /* ── J-09/F6 · bank data (`Q14`, answered 2026-08-23) ─────────────────── */
  {
    field: 'BankDataDto.country',
    column: 'profile.UserProfile.BankCountry',
    requiredBy: 'J-09/F6/AC-3',
  },
  { field: 'BankDataDto.city', column: 'profile.UserProfile.BankCity', requiredBy: 'J-09/F6/AC-3' },
  {
    field: 'BankDataDto.bankName',
    column: 'profile.UserProfile.BankName',
    requiredBy: 'J-09/F6/AC-3',
  },
  {
    field: 'BankDataDto.branch',
    column: 'profile.UserProfile.BankBranch',
    requiredBy: 'J-09/F6/AC-3',
  },
  { field: 'BankDataDto.iban', column: 'profile.UserProfile.BankIBAN', requiredBy: 'J-09/F6/AC-3' },
  {
    field: 'BankDataDto.swiftCode',
    column: 'profile.UserProfile.BankSwiftCode',
    requiredBy: 'J-09/F6/AC-3',
  },
  {
    field: 'BankDataDto.nameOnCard',
    column: 'profile.UserProfile.NameInBankCard',
    requiredBy: 'J-09/F6/AC-3',
  },
  {
    field: 'BankDataDto.accountNumber',
    column: 'profile.UserProfile.BankAccount',
    requiredBy: 'J-09/F6/AC-3',
    note: 'All eight sit on the permanent profile, not a per-agreement table — which is what closed `Q14`.',
  },

  /* ── J-14 / J-15 · the trainer record ─────────────────────────────────── */
  {
    field: 'MyProfileDto.fullName',
    column: 'dbo.AspNetUsers.FullNameAr',
    requiredBy: 'J-14/F1 · J-24/F2/AC-1',
    note: '`FullNameEn` carries the English toggle.',
  },
  {
    field: 'MyProfileDto.email',
    column: 'dbo.AspNetUsers.Email',
    requiredBy: 'J-14/F2',
    note: 'A locked field — FAST-owned, shown but not editable.',
  },
  {
    field: 'MyProfileDto.phone',
    column: 'dbo.AspNetUsers.PhoneNumber',
    requiredBy: 'J-14/F2',
  },
  {
    field: 'TrainerProfileDto.specializations',
    column: 'profile.Education.Specialization',
    requiredBy: 'J-15/F1/AC-1 · J-24/F2/AC-1',
    note: 'Scoped to an education record in FAST, not to the trainer — part of why `Q16` is still open.',
  },
];

/**
 * Fields Expert Hub already renders that have **no supplied FAST column**.
 *
 * Each is a real gap, tracked in `TODO.md`. They are restated here because the
 * code is where someone will next wonder, and because a mapping file that only
 * lists successes hides exactly the information that matters.
 */
export interface PendingFastSource {
  readonly field: string;
  /** What FAST would have to supply. */
  readonly needs: string;
  readonly question: string;
}

export const PENDING_FAST_SOURCES: readonly PendingFastSource[] = [
  {
    field: 'EnrolleeDto.nameAr / nameEn',
    needs: 'plan.PlanTaker — named by J-21/F3/AC-3 and not supplied',
    question: 'Q20',
  },
  {
    field: 'EnrolleeDto.attendance',
    needs: 'the attendance/absence column on plan.PlanTaker',
    question: 'Q20 · J-21 open item 1',
  },
  {
    field: 'TrainingMaterialStatus (the union members)',
    needs: 'lookup.TrainingMaterialStatus rows',
    question: 'Q21',
  },
  {
    field: 'PulledPlanDataDto.deliveryMode',
    needs: 'lookup.TrainingType rows — the likely in-class/online source',
    question: 'Q21',
  },
  {
    field: 'EngagementLocationDto.scope (inside/outside the Academy)',
    needs: 'lookup.PlanLocation rows; RoomId vs ExternalLocationId may be the real discriminator',
    question: 'Q21 · J-21/F2/AC-2',
  },
  {
    field: 'TrainerPublicProfileDto.domain',
    needs: 'a ruling on which vocabulary is the public domain',
    question: 'Q16',
  },
  {
    field: 'IdentityCardDto.relatedFields',
    needs: 'confirmation that profile.AreasOfTraining is the intended source',
    question: 'Q19',
  },
  {
    field: 'IdentityCardDto.socialAccounts',
    needs: 'profile.UserProfile.SocialMediaUrl holds ONE url; the matrix says "accounts"',
    question: 'Q19',
  },
  {
    field: 'ApplicationService (the four accredited services)',
    needs: 'FAST has three Expert* bits and none of them is trainer or consultant',
    question: 'Q22',
  },
];
