import type { Locale } from '@/types';
import type { LinkageStep } from './entitlement.types';
import { arNumber } from '../../shared/formatting';

/**
 * CAP-06 / J-28 copy — Arabic authoritative, English best-effort.
 *
 * Three things this copy has to carry, because the UI alone cannot:
 *
 * - **Nothing here is the platform's number.** `BR-0601` consumes every value
 *   from ERP, so the screen says so. A financial figure with no stated source
 *   invites the trainer to argue with the wrong party.
 * - **There is no dispute button, and that is deliberate.** `BR-0605` puts
 *   enquiries outside the platform for this release, so the page says where to
 *   go instead of leaving someone hunting.
 * - **Staff are told why a record is hidden from its own trainer.** `BR-0603`
 *   hides an incompletely-linked entitlement, and «الربط غير مكتمل» plus the
 *   missing hop is the answer to the call that `US-0602` exists to handle.
 */

export interface EntitlementsContent {
  /** F-0601 — the trainer's own record. */
  readonly mine: {
    readonly documentTitle: string;
    readonly title: string;
    readonly intro: string;
    readonly sourceNote: string;
    readonly noDisputeNote: string;
    readonly emptyTitle: string;
    readonly emptyBody: string;
    readonly resultsLabel: string;
  };

  /** F-0602 — the staff view. */
  readonly internal: {
    readonly documentTitle: string;
    readonly title: string;
    readonly intro: string;
    readonly searchLabel: string;
    readonly searchPlaceholder: string;
    readonly onlyIncompleteLabel: string;
    readonly clear: string;
    readonly resultsLabel: string;
    readonly resultsCount: (count: number) => string;
    readonly emptyTitle: string;
    readonly emptyBody: string;
    readonly hiddenTitle: string;
    readonly hiddenBody: string;
    readonly missingLabel: string;
  };

  readonly columns: {
    readonly trainer: string;
    readonly program: string;
    readonly purchaseOrder: string;
    readonly agreement: string;
    readonly status: string;
    readonly amount: string;
    readonly date: string;
    readonly linkage: string;
  };

  readonly linkageSteps: Readonly<Record<LinkageStep, string>>;
  readonly notLinkedYet: string;
  readonly noDate: string;
  readonly amountValue: (value: string, currency: string) => string;

  readonly errors: {
    readonly loadTitle: string;
    readonly loadBody: string;
    readonly retry: string;
  };
}

const ar: EntitlementsContent = {
  mine: {
    documentTitle: 'مستحقاتي — منصة الخبراء',
    title: 'مستحقاتي المالية',
    intro: 'حالة الصرف والمبلغ والتاريخ لكل برنامج نفّذته مع الأكاديمية.',
    sourceNote:
      'تُستهلَك هذه البيانات كما هي من النظام المالي (ERP)، ولا تُحتسب ولا تُعدَّل داخل المنصة.',
    noDisputeNote:
      'لا يوجد مسار اعتراض داخل المنصة في هذا الإصدار. لأي استفسار عن مستحق، تواصل مع إدارة المدربين مباشرة.',
    emptyTitle: 'لا توجد مستحقات بعد',
    emptyBody: 'يظهر المستحق هنا بعد صدور أمر الشراء المرتبط بالبرنامج الذي نفّذته.',
    resultsLabel: 'سجل المستحقات',
  },

  internal: {
    documentTitle: 'المستحقات المالية — منصة الخبراء',
    title: 'المستحقات المالية',
    intro: 'سجل المستحقات لكل مدرب، مربوطًا باتفاقيته وبرامجه، للرد على استفساراتهم.',
    searchLabel: 'بحث باسم المدرب',
    searchPlaceholder: 'اسم المدرب',
    onlyIncompleteLabel: 'غير المكتملة الربط فقط',
    clear: 'مسح البحث',
    resultsLabel: 'سجل المستحقات',
    resultsCount: (count) => (count === 1 ? 'سجل واحد' : `${arNumber(count)} سجلات`),
    emptyTitle: 'لا توجد سجلات مطابقة',
    emptyBody: 'جرّب اسمًا آخر أو امسح البحث.',
    hiddenTitle: 'هذا السجل مخفي عن المدرب',
    hiddenBody:
      'لا يظهر المستحق في بوابة المدرب إلا بعد اكتمال الربط: أمر الشراء ← الاتفاقية ← البرنامج.',
    missingLabel: 'الناقص',
  },

  columns: {
    trainer: 'المدرب',
    program: 'البرنامج',
    purchaseOrder: 'أمر الشراء',
    agreement: 'الاتفاقية',
    status: 'حالة الصرف',
    amount: 'المبلغ',
    date: 'تاريخ الصرف',
    linkage: 'الربط',
  },

  linkageSteps: {
    'purchase-order': 'أمر الشراء',
    agreement: 'الاتفاقية',
    programme: 'البرنامج',
  },
  notLinkedYet: 'غير مربوط',
  noDate: 'لم يُحدَّد بعد',
  amountValue: (value, currency) => `${value} ${currency}`,

  errors: {
    loadTitle: 'تعذّر تحميل المستحقات',
    loadBody: 'حدث خطأ أثناء التحميل. يُرجى المحاولة مرة أخرى.',
    retry: 'إعادة المحاولة',
  },
};

const en: EntitlementsContent = {
  mine: {
    documentTitle: 'My entitlements — Expert Hub',
    title: 'My financial entitlements',
    intro:
      'The disbursement status, amount and date for each programme you delivered with the Academy.',
    sourceNote:
      'This data is consumed as-is from the financial system (ERP); it is neither calculated nor edited inside the platform.',
    noDisputeNote:
      'There is no dispute path inside the platform in this release. For any question about an entitlement, contact Trainer Management directly.',
    emptyTitle: 'No entitlements yet',
    emptyBody:
      'An entitlement appears here once the purchase order for a programme you delivered is issued.',
    resultsLabel: 'Entitlement record',
  },

  internal: {
    documentTitle: 'Financial entitlements — Expert Hub',
    title: 'Financial entitlements',
    intro:
      'Each trainer’s entitlement record, tied to their agreement and programmes, so you can answer their questions.',
    searchLabel: 'Search by trainer name',
    searchPlaceholder: 'Trainer name',
    onlyIncompleteLabel: 'Incompletely linked only',
    clear: 'Clear search',
    resultsLabel: 'Entitlement record',
    resultsCount: (count) => (count === 1 ? '1 record' : `${count} records`),
    emptyTitle: 'No matching records',
    emptyBody: 'Try a different name, or clear the search.',
    hiddenTitle: 'This record is hidden from the trainer',
    hiddenBody:
      'An entitlement only appears in the trainer’s portal once the chain resolves: purchase order → agreement → programme.',
    missingLabel: 'Missing',
  },

  columns: {
    trainer: 'Trainer',
    program: 'Programme',
    purchaseOrder: 'Purchase order',
    agreement: 'Agreement',
    status: 'Disbursement status',
    amount: 'Amount',
    date: 'Disbursement date',
    linkage: 'Linkage',
  },

  linkageSteps: {
    'purchase-order': 'Purchase order',
    agreement: 'Agreement',
    programme: 'Programme',
  },
  notLinkedYet: 'Not linked',
  noDate: 'Not set yet',
  amountValue: (value, currency) => `${value} ${currency}`,

  errors: {
    loadTitle: 'Could not load the entitlements',
    loadBody: 'Something went wrong while loading. Please try again.',
    retry: 'Try again',
  },
};

const CONTENT: Record<Locale, EntitlementsContent> = { ar, en };

export function getEntitlementsContent(locale: Locale): EntitlementsContent {
  return CONTENT[locale] ?? CONTENT.ar;
}
