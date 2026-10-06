import type { Locale } from '@/types';
import type { ExpertHubApiError } from '../../shared/services/apiClient';
import {
  TERMINATION_ERROR_DETAILS,
  type StaffDelinkReason,
  type TrainerWithdrawalReason,
} from './withdrawal.types';
import { arNumber } from '../../shared/formatting';

/**
 * J-22 copy — Arabic authoritative, English best-effort.
 *
 * What this copy carries that the UI cannot:
 *
 * - **De-linking does not cancel the plan.** F2/AC-3 calls it "a platform-side
 *   unlinking only, not a FAST cancellation" — precisely the sort of thing a
 *   staff member assumes wrongly, so the panel says it before they act.
 * - **A cancelled engagement is not a completed one.** F3/AC-5 requires the
 *   three end-states to read differently, so each has its own wording rather
 *   than a shared "ended".
 * - **The withdrawal is final and re-opens the slot.** F1/AC-5 sends it back to
 *   re-matching; a trainer who thinks they can undo it, or that the seat is held
 *   for them, has been misled.
 */

export interface WithdrawalContent {
  /** F1 — the trainer's side. */
  readonly withdraw: {
    readonly action: string;
    readonly heading: string;
    readonly intro: string;
    readonly reasonLegend: string;
    readonly reasons: Readonly<Record<TrainerWithdrawalReason, string>>;
    readonly noteLabel: string;
    readonly noteHint: string;
    readonly warning: string;
    readonly confirm: string;
    readonly cancel: string;
    readonly doneTitle: string;
    readonly doneBody: string;
    /** 409 `engagement-not-upcoming`. */
    readonly unavailable: string;
    /** 409 `termination-deadline-passed` — `D-10`, 4 days before the start. */
    readonly deadlinePassed: string;
  };

  /** F2 — staff's side. */
  readonly delink: {
    readonly action: string;
    readonly heading: string;
    readonly intro: string;
    readonly planUntouched: string;
    readonly reasonLegend: string;
    readonly reasons: Readonly<Record<StaffDelinkReason, string>>;
    readonly noteLabel: string;
    readonly noteHint: string;
    readonly confirm: string;
    readonly cancel: string;
    readonly doneTitle: string;
    readonly doneBody: (slot: number) => string;
    /** `slotReopened: false` — no approved candidate was left to take it. */
    readonly doneBodyExhausted: (slot: number) => string;
    readonly reRouteAction: string;
    readonly unavailable: string;
    /** `D-10` — 24 hours before the start. */
    readonly deadlinePassed: string;
  };

  /** The end-states, as the trainer reads them. */
  readonly outcomes: {
    readonly withdrawnByTrainer: string;
    /** ⚠️ The API does not name the staff member (F2/AC-4). */
    readonly withdrawnByStaff: string;
    readonly cancelledByAcademy: string;
    readonly reasonLabel: string;
    readonly fastReason: (code: string) => string;
    readonly terminatedOn: (date: string) => string;
  };

  readonly errors: {
    readonly reasonRequired: string;
    readonly noteRequired: string;
    readonly actionFailed: string;
    readonly alreadyEnded: string;
  };
}

const fmtAr = (value: number) => arNumber(value);

const ar: WithdrawalContent = {
  withdraw: {
    action: 'الاعتذار عن الارتباط',
    heading: 'الاعتذار عن الارتباط',
    intro: 'اختر سبب الاعتذار. يُبلَّغ المنسّق المسؤول فور تأكيدك.',
    reasonLegend: 'سبب الاعتذار',
    reasons: {
      'personal-emergency': 'ظرف شخصي طارئ',
      'scheduling-conflict': 'تعارض في المواعيد',
      other: 'سبب آخر',
    },
    noteLabel: 'وضّح السبب',
    noteHint: 'يصل هذا النص إلى المنسّق المسؤول مع إشعار الاعتذار.',
    warning: 'الاعتذار نهائي ولا يمكن التراجع عنه؛ يعود المقعد إلى مسار المطابقة لترشيح مدرب آخر.',
    confirm: 'تأكيد الاعتذار',
    cancel: 'إلغاء',
    doneTitle: 'سُجّل اعتذارك',
    doneBody: 'أُنهي ارتباطك على هذا المقعد، وأُبلغ المنسّق المسؤول.',
    unavailable: 'لا يمكن الاعتذار عن ارتباط بدأ تنفيذه أو انتهى.',
    deadlinePassed:
      'انقضت مهلة الاعتذار؛ يجب أن يكون الاعتذار قبل أربعة أيام على الأقل من بدء التنفيذ. تواصل مع المنسّق المسؤول.',
  },

  delink: {
    action: 'فك ارتباط المدرب',
    heading: 'فك ارتباط المدرب',
    intro: 'اختر سبب فك الارتباط. يُبلَّغ المدرب بالسبب المختار.',
    planUntouched: 'فك الارتباط إجراء داخل المنصة فقط، ولا يُلغي الخطة في نظام FAST.',
    reasonLegend: 'سبب فك الارتباط',
    reasons: {
      'operational-need-change': 'تغيّر الاحتياج التشغيلي',
      'administrative-decision': 'قرار إداري',
      other: 'سبب آخر',
    },
    noteLabel: 'وضّح السبب',
    noteHint: 'يصل هذا النص إلى المدرب مع إشعار فك الارتباط.',
    confirm: 'تأكيد فك الارتباط',
    cancel: 'إلغاء',
    doneTitle: 'فُكّ ارتباط المدرب',
    doneBody: (slot) => `أُنهي الارتباط على المقعد رقم ${fmtAr(slot)}، وعاد إلى مسار المطابقة.`,
    doneBodyExhausted: (slot) =>
      `أُنهي الارتباط على المقعد رقم ${fmtAr(slot)}، ولم يتبقَّ مرشحون معتمدون له؛ يلزم إعادة توجيهه.`,
    reRouteAction: 'إعادة توجيه هذا المقعد',
    unavailable: 'لا يمكن فك الارتباط بعد بدء التنفيذ أو انتهائه.',
    deadlinePassed: 'انقضت مهلة فك الارتباط؛ يجب أن يكون قبل 24 ساعة على الأقل من بدء التنفيذ.',
  },

  outcomes: {
    withdrawnByTrainer: 'اعتذرتَ عن هذا الارتباط.',
    withdrawnByStaff: 'فكّ فريق الأكاديمية ارتباطك بهذا المقعد.',
    cancelledByAcademy: 'أُلغي هذا الارتباط لإلغاء الخطة بالكامل من قِبل الأكاديمية.',
    reasonLabel: 'السبب',
    fastReason: (code) => `رمز سبب الإلغاء في نظام FAST: ${code}`,
    terminatedOn: (date) => `بتاريخ ${date}`,
  },

  errors: {
    reasonRequired: 'يجب اختيار سبب.',
    noteRequired: 'يجب توضيح السبب عند اختيار «سبب آخر».',
    actionFailed: 'تعذّر تنفيذ الإجراء. يُرجى المحاولة مرة أخرى.',
    alreadyEnded: 'انتهى هذا الارتباط بالفعل.',
  },
};

const en: WithdrawalContent = {
  withdraw: {
    action: 'Withdraw from this engagement',
    heading: 'Withdraw from this engagement',
    intro: 'Choose a reason. The responsible coordinator is notified as soon as you confirm.',
    reasonLegend: 'Reason for withdrawing',
    reasons: {
      'personal-emergency': 'Personal emergency',
      'scheduling-conflict': 'Scheduling conflict',
      other: 'Other (free text)',
    },
    noteLabel: 'Explain the reason',
    noteHint: 'This text reaches the responsible coordinator with the withdrawal notice.',
    warning:
      'Withdrawing is final and cannot be undone; the slot returns to matching so another trainer can be nominated.',
    confirm: 'Confirm the withdrawal',
    cancel: 'Cancel',
    doneTitle: 'Your withdrawal is recorded',
    doneBody: 'Your engagement on this slot has ended, and the centre can see it.',
    unavailable: 'An engagement that has started or finished cannot be withdrawn from.',
    deadlinePassed:
      'The withdrawal deadline has passed: withdrawing must happen at least four days before delivery starts. Contact the responsible coordinator.',
  },

  delink: {
    action: 'De-link the trainer',
    heading: 'De-link the trainer',
    intro: 'Choose a reason. The trainer is notified, along with the reason you select.',
    planUntouched:
      'De-linking is a platform-side action only; it does not cancel the plan in FAST.',
    reasonLegend: 'Reason for de-linking',
    reasons: {
      // J-22/F2/AC-2's wording: Operational Need Change / Administrative Decision / Other (free text).
      'operational-need-change': 'Operational need change',
      'administrative-decision': 'Administrative decision',
      other: 'Other (free text)',
    },
    noteLabel: 'Explain the reason',
    noteHint: 'This text reaches the trainer with the de-linking notice.',
    confirm: 'Confirm the de-linking',
    cancel: 'Cancel',
    doneTitle: 'The trainer has been de-linked',
    doneBody: (slot) => `The engagement on slot ${slot} has ended and returned to matching.`,
    doneBodyExhausted: (slot) =>
      `The engagement on slot ${slot} has ended, and no approved candidate is left for it; it needs re-routing.`,
    reRouteAction: 'Re-route this slot',
    unavailable: 'A trainer cannot be de-linked once delivery has started or finished.',
    deadlinePassed:
      'The de-linking deadline has passed: it must happen at least 24 hours before delivery starts.',
  },

  outcomes: {
    withdrawnByTrainer: 'You withdrew from this engagement.',
    withdrawnByStaff: 'Academy staff de-linked you from this slot.',
    cancelledByAcademy:
      'This engagement was cancelled because the Academy cancelled the plan in full.',
    reasonLabel: 'Reason',
    fastReason: (code) => `FAST cancellation reason code: ${code}`,
    terminatedOn: (date) => `on ${date}`,
  },

  errors: {
    reasonRequired: 'Choose a reason.',
    noteRequired: 'Explain the reason when choosing “Other (free text)”.',
    actionFailed: 'The action could not be completed. Please try again.',
    alreadyEnded: 'This engagement has already ended.',
  },
};

const CONTENT: Record<Locale, WithdrawalContent> = { ar, en };

export function getWithdrawalContent(locale: Locale): WithdrawalContent {
  return CONTENT[locale] ?? CONTENT.ar;
}

/**
 * The copy for a refused withdrawal (`withdraw`) or de-link (`delink`), keyed by
 * the server's `detail`. Anything unrecognised is a plain failure, never a
 * guess at what went wrong.
 */
export function terminationErrorText(
  content: WithdrawalContent,
  path: 'withdraw' | 'delink',
  error: ExpertHubApiError
): string {
  switch (error.message) {
    case TERMINATION_ERROR_DETAILS.notUpcoming:
      return content[path].unavailable;
    case TERMINATION_ERROR_DETAILS.deadlinePassed:
      return content[path].deadlinePassed;
    case TERMINATION_ERROR_DETAILS.alreadyEnded:
      return content.errors.alreadyEnded;
    case TERMINATION_ERROR_DETAILS.reasonRequired:
      return content.errors.reasonRequired;
    case TERMINATION_ERROR_DETAILS.noteRequired:
      return content.errors.noteRequired;
    default:
      return content.errors.actionFailed;
  }
}
