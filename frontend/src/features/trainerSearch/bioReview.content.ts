import type { Locale } from '@/types';

/** `P-331` — the staff review of trainers' short bios. */
export interface BioReviewContent {
  readonly documentTitle: string;
  readonly title: string;
  readonly lead: string;
  readonly count: (n: string) => string;
  readonly listLabel: string;
  readonly submittedAt: (date: string) => string;
  readonly sourceAi: string;
  readonly sourceTrainer: string;
  readonly publishedNow: string;
  readonly approve: string;
  readonly returnAction: string;
  readonly noteLabel: string;
  readonly noteHelper: string;
  readonly confirmReturn: string;
  readonly cancel: string;
  readonly approved: (name: string) => string;
  readonly returned: (name: string) => string;
  readonly noteRequired: string;
  readonly conflict: string;
  readonly failed: string;
  readonly empty: { readonly title: string; readonly body: string };
  readonly loadError: { readonly title: string; readonly body: string };
  readonly retry: string;
  readonly openLink: string;
}

const ar: BioReviewContent = {
  documentTitle: 'مراجعة النبذ المختصرة — منصة الخبراء',
  title: 'مراجعة النبذ المختصرة',
  lead: 'نبذ أرسلها المدربون للمراجعة. لا تظهر النبذة في دليل الخبراء العام إلا بعد اعتمادها، ولمن فعّل الظهور العام فقط.',
  count: (n) => `${n} بانتظار المراجعة`,
  listLabel: 'النبذ بانتظار المراجعة',
  submittedAt: (date) => `أُرسلت في ${date}`,
  sourceAi: 'مقترحة من السيرة الذاتية',
  sourceTrainer: 'كتبها المدرب',
  publishedNow: 'النبذة المعتمدة حاليًا',
  approve: 'اعتماد',
  returnAction: 'إعادة للتعديل',
  noteLabel: 'سبب الإعادة',
  noteHelper: 'يظهر للمدرب في ملفه، فاذكر ما يلزم تعديله.',
  confirmReturn: 'إرسال الإعادة',
  cancel: 'إلغاء',
  approved: (name) => `اعتُمدت نبذة ${name}.`,
  returned: (name) => `أُعيدت نبذة ${name} للتعديل.`,
  noteRequired: 'اذكر سبب الإعادة.',
  conflict: 'عدّل المدرب النبذة بعد فتح الصفحة. راجع النص الجديد ثم قرّر.',
  failed: 'تعذّر حفظ القرار. حاول مرة أخرى.',
  empty: {
    title: 'لا توجد نبذ بانتظار المراجعة',
    body: 'تظهر هنا النبذ التي يرسلها المدربون من ملفاتهم.',
  },
  loadError: {
    title: 'تعذّر تحميل النبذ',
    body: 'لم نتمكن من تحميل النبذ بانتظار المراجعة. حاول مرة أخرى.',
  },
  retry: 'إعادة المحاولة',
  openLink: 'مراجعة النبذ المختصرة',
};

const en: BioReviewContent = {
  documentTitle: 'Short bio review — Expert Hub',
  title: 'Short bio review',
  lead: 'Bios trainers submitted for review. A bio appears in the public expert directory only once approved, and only for trainers who chose to be visible.',
  count: (n) => `${n} awaiting review`,
  listLabel: 'Bios awaiting review',
  submittedAt: (date) => `Submitted ${date}`,
  sourceAi: 'Suggested from the CV',
  sourceTrainer: 'Written by the trainer',
  publishedNow: 'Currently approved bio',
  approve: 'Approve',
  returnAction: 'Return for changes',
  noteLabel: 'Reason for returning',
  noteHelper: 'The trainer sees this on their profile, so say what needs to change.',
  confirmReturn: 'Send back',
  cancel: 'Cancel',
  approved: (name) => `${name}'s bio was approved.`,
  returned: (name) => `${name}'s bio was returned for changes.`,
  noteRequired: 'Give a reason for returning it.',
  conflict: 'The trainer edited this bio after the page opened. Review the new text, then decide.',
  failed: 'The decision could not be saved. Please try again.',
  empty: {
    title: 'No bios awaiting review',
    body: 'Bios trainers submit from their profiles appear here.',
  },
  loadError: {
    title: 'Bios could not be loaded',
    body: 'We could not load the bios awaiting review. Please try again.',
  },
  retry: 'Try again',
  openLink: 'Review short bios',
};

export function getBioReviewContent(locale: Locale): BioReviewContent {
  return locale === 'en' ? en : ar;
}
