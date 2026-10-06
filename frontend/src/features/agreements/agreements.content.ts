import type { Locale } from '@/types';
import type { ApplicationService } from '../applications/application.types';
import { getMyApplicationsContent } from '../applications/myApplications.content';
import type { SignatureMethod, SigningMemberState, SigningValidationCode } from './agreement.types';
import { arNumber, formatNumber } from '../../shared/formatting';

/**
 * EH-INT-06a copy (J-10 Agreement Preparation & Internal Approval) — Arabic
 * authoritative, English best-effort.
 *
 * The signing sequence deliberately speaks in its **own** terms even though it
 * reuses J-09's mechanism: "تسلسل التوقيع" not "لجنة الاعتماد", "مراجعة" not
 * "قرار". J-10/F2/AC-3 insists the two are distinct entities, and vocabulary is
 * how a reader tells them apart.
 */

export interface AgreementsContent {
  readonly documentTitle: (reference: string) => string;
  readonly backToInbox: string;
  /** The breadcrumb's first level — the inbox, named as the header names it. */
  readonly inboxCrumb: string;
  readonly eyebrow: string;
  readonly servicesLabel: string;
  readonly gate: {
    readonly blockedTitle: string;
    readonly blockedBody: string;
    readonly committeeLabel: string;
    readonly bankLabel: string;
    readonly met: string;
    readonly pending: string;
  };
  readonly preparation: {
    readonly heading: string;
    readonly description: string;
    readonly templateNote: string;
    readonly servicesNote: (services: string) => string;
    readonly save: string;
    readonly requiredError: string;
    readonly errorsHeading: string;
    /** Versions are frozen on save; a restarted run is voided and kept. */
    readonly historyNote: string;
    readonly savedTitle: string;
    readonly savedBody: string;
    readonly edit: string;
  };
  readonly formation: {
    readonly heading: string;
    readonly description: string;
    readonly templateLabel: string;
    readonly templatePlaceholder: string;
    readonly templateNone: string;
    readonly templateCopyNote: string;
    readonly membersHeading: string;
    readonly membersHint: string;
    readonly rulesNote: string;
    readonly obligations: { readonly mandatory: string; readonly optional: string };
    readonly obligationLegend: (name: string) => string;
    readonly signerLabel: string;
    readonly signerHint: string;
    readonly moveUp: string;
    readonly moveDown: string;
    readonly remove: string;
    readonly addHeading: string;
    readonly addPlaceholder: string;
    readonly add: string;
    readonly positionLabel: (position: number) => string;
    readonly saveTemplateLabel: string;
    readonly saveTemplateNameLabel: string;
    readonly submit: string;
    readonly errorsHeading: string;
    readonly errors: {
      readonly 'no-members': string;
      readonly 'no-mandatory-member': string;
      readonly 'duplicate-member': string;
      readonly 'no-signer-designated': string;
      readonly 'template-name-missing': string;
    };
  };
  readonly sequence: {
    readonly heading: string;
    readonly description: string;
    readonly states: Readonly<Record<SigningMemberState, string>>;
    readonly signerTag: string;
    readonly reviewerTag: string;
    readonly decidedAt: (date: string) => string;
    readonly you: string;
    readonly noteLabel: string;
  };
  /** The frozen agreement document — shared by J-10 readers and the J-11 applicant. */
  readonly document: {
    readonly heading: string;
    readonly description: string;
    readonly notPrepared: string;
    readonly template: (name: string, version: string) => string;
    readonly version: (versionNumber: number, date: string) => string;
    readonly liveTitle: string;
    readonly liveBody: string;
    readonly bodyHeading: string;
    readonly fieldsHeading: string;
    readonly hashLabel: string;
    readonly signatureMethodTitle: string;
    readonly signatureMethods: Readonly<Record<SignatureMethod, string>>;
  };
  readonly decision: {
    readonly heading: string;
    readonly reviewerDescription: string;
    readonly signerDescription: string;
    readonly noRejectNote: string;
    readonly notYourTurnTitle: string;
    readonly notYourTurnBody: string;
    readonly noteLabel: string;
    readonly approve: string;
    readonly signAndApprove: string;
    readonly requestModification: string;
    readonly errors: Readonly<Record<SigningValidationCode, string>>;
  };
  readonly signDialog: {
    readonly title: string;
    readonly body: string;
    readonly signatureLabel: string;
    readonly signatureHint: string;
    readonly confirm: string;
    readonly cancel: string;
  };
  readonly approveDialog: {
    readonly title: string;
    readonly body: string;
    readonly confirm: string;
    readonly cancel: string;
  };
  readonly modificationDialog: {
    readonly title: string;
    readonly body: string;
    readonly noteLabel: string;
    readonly confirm: string;
    readonly cancel: string;
  };
  readonly modificationBanner: {
    readonly title: string;
    readonly body: (name: string) => string;
    readonly resumeNote: string;
    /** To the creator: the agreement can be corrected before re-submitting. */
    readonly correctNote: string;
    readonly resubmit: string;
  };
  readonly send: {
    readonly heading: string;
    readonly pendingTitle: string;
    readonly pendingSequence: string;
    readonly pendingSignature: string;
    readonly bothRequired: string;
    readonly sentTitle: string;
    readonly sentBody: string;
    readonly sentAt: (date: string) => string;
  };
  readonly errors: {
    readonly loadTitle: string;
    readonly loadBody: string;
    readonly notFoundTitle: string;
    readonly notFoundBody: string;
    readonly sessionTitle: string;
    readonly sessionBody: string;
    readonly unauthorizedTitle: string;
    readonly unauthorizedBody: string;
    readonly submitTitle: string;
    readonly submitBody: string;
    readonly retry: string;
  };
  readonly services: Readonly<Record<ApplicationService, string>>;
}

const ar: AgreementsContent = {
  documentTitle: (reference) => `إعداد اتفاقية ${reference} — منصة الخبراء والمدربين`,
  backToInbox: 'العودة إلى صندوق الطلبات',
  inboxCrumb: 'صندوق الطلبات',
  eyebrow: 'إعداد الاتفاقية',
  servicesLabel: 'الخدمات المعتمدة',
  gate: {
    blockedTitle: 'لا يمكن بدء إعداد الاتفاقية بعد',
    blockedBody: 'يتطلب البدء اكتمال شرطين معًا من مرحلة لجنة الاعتماد.',
    committeeLabel: 'الاعتماد النهائي من اللجنة',
    bankLabel: 'البيانات المصرفية للمتقدم',
    met: 'مكتمل',
    pending: 'غير مكتمل',
  },
  preparation: {
    heading: 'بيانات الاتفاقية',
    description:
      'أدخل الحقول القابلة للتحرير أولًا. بعد الحفظ تُدمج بيانات المدرب والبيانات المصرفية تلقائيًا — دون إعادة إدخال.',
    templateNote: 'قائمة الحقول المعتمدة لم تصل بعد؛ المؤكد حاليًا هو تاريخا البداية والنهاية فقط.',
    servicesNote: (services) => `تغطي الاتفاقية الخدمات المعتمدة تحديدًا: ${services}.`,
    save: 'حفظ البيانات ومتابعة',
    requiredError: 'هذا الحقل مطلوب.',
    errorsHeading: 'أكمل الحقول المطلوبة',
    historyNote:
      'كل حفظ يغيّر المحتوى يثبّت نسخة جديدة من مستند الاتفاقية. إعادة الإعداد بعد طلب تعديل من المتقدم تبدأ تسلسل توقيع جديدًا، ويُحفظ التسلسل السابق ملغًى بموافقاته وتوقيعاته دون حذف.',
    savedTitle: 'حُفظت بيانات الاتفاقية',
    savedBody: 'مستند الاتفاقية أدناه هو النسخة التي يطّلع عليها المراجعون والموقّعون.',
    edit: 'تعديل البيانات',
  },
  formation: {
    heading: 'تشكيل تسلسل التوقيع الداخلي',
    description:
      'اختر الأشخاص، ورتّب تسلسل المراجعة، وحدّد من منهم الموقّع الإلكتروني الفعلي. هذا التسلسل كيان مستقل عن لجنة الاعتماد رغم تطابق الآلية.',
    templateLabel: 'قالب محفوظ',
    templatePlaceholder: 'اختر قالبًا',
    templateNone: 'بدون قالب — تشكيل جديد',
    templateCopyNote: 'تعديل القالب هنا يخص هذه الاتفاقية فقط ولا يغيّر القالب المحفوظ.',
    membersHeading: 'تسلسل المراجعة والتوقيع',
    membersHint: 'تصل الاتفاقية إلى الأشخاص بالترتيب المحدّد أدناه.',
    rulesNote:
      'لا تُرسل الاتفاقية للمتقدم إلا بعد إتمام جميع من في التسلسل خطوتهم وإرفاق التوقيع الإلكتروني — التوقيع وحده لا يكفي.',
    obligations: { mandatory: 'إلزامي', optional: 'اختياري' },
    obligationLegend: (name) => `تصنيف: ${name}`,
    signerLabel: 'موقّع إلكتروني',
    signerHint: 'يوقّع الاتفاقية فعليًا، وليس بالضرورة آخر شخص في التسلسل.',
    moveUp: 'تقديم في الترتيب',
    moveDown: 'تأخير في الترتيب',
    remove: 'إزالة',
    addHeading: 'إضافة شخص',
    addPlaceholder: 'اختر شخصًا',
    add: 'إضافة',
    positionLabel: (position) => `الترتيب ${arNumber(position)}`,
    saveTemplateLabel: 'حفظ هذا التسلسل كقالب لإعادة استخدامه',
    saveTemplateNameLabel: 'اسم القالب',
    submit: 'اعتماد التسلسل وبدء المراجعة',
    errorsHeading: 'أكمل ما يلي قبل بدء التسلسل',
    errors: {
      'no-members': 'أضف شخصًا واحدًا على الأقل إلى التسلسل.',
      'no-mandatory-member': 'أضف شخصًا إلزاميًا واحدًا على الأقل.',
      'duplicate-member': 'لا يمكن تكرار الشخص نفسه في التسلسل.',
      'no-signer-designated':
        'حدّد موقّعًا إلكترونيًا واحدًا على الأقل — لا تُرسل الاتفاقية للمتقدم بدون توقيع.',
      'template-name-missing': 'اكتب اسمًا للقالب قبل حفظه.',
    },
  },
  sequence: {
    heading: 'تسلسل التوقيع',
    description: 'تنتقل الاتفاقية تلقائيًا إلى الشخص التالي بعد كل موافقة.',
    states: {
      waiting: 'بانتظار الدور',
      current: 'الدور الحالي',
      approved: 'راجع ووافق',
      signed: 'وقّع إلكترونيًا',
      'modification-requested': 'طلب تعديلًا',
    },
    signerTag: 'موقّع',
    reviewerTag: 'مراجع',
    decidedAt: (date) => `في ${date}`,
    you: 'أنت',
    noteLabel: 'ملاحظة',
  },
  document: {
    heading: 'مستند الاتفاقية',
    description: 'اطّلع على الاتفاقية كاملةً — نصها وبنودها وبياناتها — قبل اتخاذ قرارك.',
    notPrepared: 'لم تُعدّ بيانات الاتفاقية بعد — يظهر مستندها هنا فور حفظها.',
    template: (name, version) => `القالب: ${name} — الإصدار ${version}`,
    version: (versionNumber, date) => `النسخة رقم ${arNumber(versionNumber)}، ثُبّتت في ${date}`,
    liveTitle: 'عرض مباشر — ليست نسخة مثبّتة',
    liveBody:
      'أُعدّت هذه الاتفاقية قبل تسجيل نسخ المستند، لذا يُعرض محتواها من البيانات الحالية وقد يتغيّر.',
    bodyHeading: 'نص الاتفاقية',
    fieldsHeading: 'بنود الاتفاقية',
    hashLabel: 'بصمة المحتوى (SHA-256)',
    signatureMethodTitle: 'كيف يُسجَّل التوقيع',
    signatureMethods: {
      'internal-acceptance':
        'تُسجَّل كل موافقة أو توقيع أو قبول على هذه الاتفاقية قبولًا داخليًا في المنصة: باسم الشخص ووقت الإجراء ونسخة المستند المعروضة تحديدًا. وهو ليس توقيعًا إلكترونيًا معتمدًا، إذ لا يوجد مزوّد توقيع إلكتروني مرتبط بالمنصة حاليًا.',
    },
  },
  decision: {
    heading: 'إجراؤك',
    reviewerDescription: 'راجع الاتفاقية ثم وافق عليها، أو اطلب تعديلًا مع ملاحظة إلزامية.',
    signerDescription:
      'أنت الموقّع الإلكتروني المحدّد لهذه الاتفاقية: وقّع ووافق، أو اطلب تعديلًا.',
    noRejectNote:
      'لا يوجد خيار رفض في هذه المرحلة — أهلية المتقدم حُسمت في لجنة الاعتماد. البديل الوحيد للموافقة هو طلب التعديل.',
    notYourTurnTitle: 'ليس دورك حاليًا',
    notYourTurnBody: 'ستتمكن من المراجعة عند وصول الاتفاقية إلى دورك في التسلسل.',
    noteLabel: 'ملاحظة (اختيارية)',
    approve: 'مراجعة وموافقة',
    signAndApprove: 'توقيع إلكتروني وموافقة',
    requestModification: 'طلب تعديل',
    errors: {
      'note-missing': 'اكتب الملاحظة — لا يمكن إرسال طلب التعديل بدونها.',
      'signature-missing': 'اكتب اسمك الكامل لإتمام التوقيع الإلكتروني.',
    },
  },
  signDialog: {
    title: 'تأكيد التوقيع الإلكتروني',
    body: 'سيُسجَّل توقيعك على نسخة المستند المعروضة تحديدًا. إن كنت آخر من في التسلسل، تُرسل الاتفاقية للمتقدم مباشرة.',
    signatureLabel: 'الاسم الكامل للتوقيع',
    signatureHint:
      'يُسجَّل اسمك مع وقت الإجراء ورقم نسخة المستند — قبول داخلي، وليس توقيعًا إلكترونيًا معتمدًا.',
    confirm: 'توقيع وموافقة',
    cancel: 'إلغاء',
  },
  approveDialog: {
    title: 'تأكيد المراجعة والموافقة',
    body: 'ستُسجَّل موافقتك على نسخة المستند المعروضة، وتنتقل الاتفاقية تلقائيًا إلى الشخص التالي في التسلسل.',
    confirm: 'تأكيد الموافقة',
    cancel: 'إلغاء',
  },
  modificationDialog: {
    title: 'طلب تعديل على الاتفاقية',
    body: 'يتوقف التسلسل مؤقتًا وتصل ملاحظتك إلى معدّ الاتفاقية وإلى جميع من في التسلسل.',
    noteLabel: 'الملاحظة',
    confirm: 'إرسال طلب التعديل',
    cancel: 'إلغاء',
  },
  modificationBanner: {
    title: 'طلب تعديل قائم',
    body: (name) => `طلب ${name} تعديلًا على الاتفاقية.`,
    resumeNote: 'بعد إعادة الإرسال يستأنف التسلسل من الشخص نفسه، دون التأثير على من أتمّ خطوته.',
    correctNote:
      'يمكنك تصحيح بيانات الاتفاقية أدناه قبل إعادة الإرسال. تُثبَّت نسخة جديدة من المستند، وتبقى الموافقات السابقة مسجّلة على النسخة التي اعتمدها أصحابها.',
    resubmit: 'إعادة إرسال الاتفاقية بعد التعديل',
  },
  send: {
    heading: 'الإرسال إلى المتقدم',
    pendingTitle: 'لم تُرسل الاتفاقية بعد',
    pendingSequence: 'بانتظار إتمام جميع من في التسلسل خطوتهم.',
    pendingSignature: 'بانتظار إرفاق التوقيع الإلكتروني.',
    bothRequired: 'يلزم تحقق الشرطين معًا — التوقيع وحده لا يكفي لإرسال الاتفاقية.',
    sentTitle: 'أُرسلت الاتفاقية إلى المتقدم',
    sentBody: 'اكتمل التسلسل وأُرفق التوقيع، فأُرسلت الاتفاقية تلقائيًا لتوقيع المتقدم.',
    sentAt: (date) => `أُرسلت في ${date}`,
  },
  errors: {
    loadTitle: 'تعذّر تحميل الاتفاقية',
    loadBody: 'حدث خطأ أثناء تحميل بيانات الاتفاقية. يُرجى المحاولة مرة أخرى.',
    notFoundTitle: 'الطلب غير موجود',
    notFoundBody: 'لم نعثر على طلب بهذا المعرّف.',
    sessionTitle: 'انتهت الجلسة',
    sessionBody: 'انتهت جلستك. يُرجى تسجيل الدخول مرة أخرى للمتابعة.',
    unauthorizedTitle: 'لا تملك صلاحية الوصول',
    unauthorizedBody: 'ليست لديك الصلاحية اللازمة لعرض هذه الاتفاقية.',
    submitTitle: 'تعذّر حفظ الإجراء',
    submitBody: 'حدث خطأ ولم يُحفظ الإجراء. يُرجى المحاولة مرة أخرى.',
    retry: 'إعادة المحاولة',
  },
  services: getMyApplicationsContent('ar').services,
};

const en: AgreementsContent = {
  documentTitle: (reference) => `Agreement ${reference} — Expert Hub`,
  backToInbox: 'Back to the application inbox',
  inboxCrumb: 'Application inbox',
  eyebrow: 'Agreement preparation',
  servicesLabel: 'Approved services',
  gate: {
    blockedTitle: 'Agreement preparation cannot start yet',
    blockedBody: 'Two conditions from the approval committee stage must both be complete.',
    committeeLabel: 'Final committee approval',
    bankLabel: 'Applicant bank data',
    met: 'Complete',
    pending: 'Outstanding',
  },
  preparation: {
    heading: 'Agreement data',
    description:
      'Enter the editable fields first. Once saved, the trainer and bank data are merged in automatically — with no re-entry.',
    templateNote:
      'The approved field list has not arrived yet. Only the start and end dates are confirmed today.',
    servicesNote: (services) => `The agreement covers exactly the approved services: ${services}.`,
    save: 'Save and continue',
    requiredError: 'This field is required.',
    errorsHeading: 'Complete the required fields',
    historyNote:
      'Each save that changes the content freezes a new version of the agreement document. Re-preparing after the applicant asks for changes starts a new signing sequence; the earlier one is kept, voided, with its approvals and signatures — nothing is deleted.',
    savedTitle: 'Agreement data saved',
    savedBody: 'The agreement document below is the version reviewers and signers read.',
    edit: 'Edit the data',
  },
  formation: {
    heading: 'Form the internal signing sequence',
    description:
      'Select the people, arrange the review order, and designate who actually e-signs. This sequence is a distinct entity from the approval committee, despite the identical mechanics.',
    templateLabel: 'Saved template',
    templatePlaceholder: 'Select a template',
    templateNone: 'No template — build a new sequence',
    templateCopyNote:
      'Editing the template here applies to this agreement only and does not change the saved template.',
    membersHeading: 'Review and signing order',
    membersHint: 'The agreement reaches people in the order shown below.',
    rulesNote:
      'The agreement is only sent to the applicant once everyone has completed their step and the e-signature is attached — the signature alone is not enough.',
    obligations: { mandatory: 'Mandatory', optional: 'Optional' },
    obligationLegend: (name) => `Classification for ${name}`,
    signerLabel: 'E-signer',
    signerHint: 'Actually signs the agreement, and need not be last in the sequence.',
    moveUp: 'Move earlier',
    moveDown: 'Move later',
    remove: 'Remove',
    addHeading: 'Add a person',
    addPlaceholder: 'Select a person',
    add: 'Add',
    positionLabel: (position) => `Position ${formatNumber(position, 'en')}`,
    saveTemplateLabel: 'Save this sequence as a reusable template',
    saveTemplateNameLabel: 'Template name',
    submit: 'Confirm and start the review',
    errorsHeading: 'Complete the following before starting',
    errors: {
      'no-members': 'Add at least one person to the sequence.',
      'no-mandatory-member': 'Add at least one mandatory person.',
      'duplicate-member': 'The same person cannot appear twice in the sequence.',
      'no-signer-designated':
        'Designate at least one e-signer — the agreement is never sent to the applicant unsigned.',
      'template-name-missing': 'Enter a template name before saving it.',
    },
  },
  sequence: {
    heading: 'Signing sequence',
    description: 'The agreement advances to the next person automatically after each approval.',
    states: {
      waiting: 'Awaiting turn',
      current: 'Current turn',
      approved: 'Reviewed and approved',
      signed: 'E-signed',
      'modification-requested': 'Requested a modification',
    },
    signerTag: 'Signer',
    reviewerTag: 'Reviewer',
    decidedAt: (date) => `on ${date}`,
    you: 'You',
    noteLabel: 'Note',
  },
  document: {
    heading: 'Agreement document',
    description: 'Read the complete agreement — its text, terms and data — before you decide.',
    notPrepared: 'The agreement has not been prepared yet — its document appears here once saved.',
    template: (name, version) => `Template: ${name} — version ${version}`,
    version: (versionNumber, date) =>
      `Version ${formatNumber(versionNumber, 'en')}, frozen on ${date}`,
    liveTitle: 'Live rendering — not a frozen version',
    liveBody:
      'This agreement was prepared before document versions were recorded, so its content is rendered from the current data and may change.',
    bodyHeading: 'Agreement text',
    fieldsHeading: 'Agreement terms',
    hashLabel: 'Content fingerprint (SHA-256)',
    signatureMethodTitle: 'How signing is recorded',
    signatureMethods: {
      'internal-acceptance':
        'Every approval, signature or acceptance of this agreement is recorded as an internal acceptance in the platform: with the person’s name, the time and this exact document version. It is not a certified electronic signature — no e-signature provider is integrated.',
    },
  },
  decision: {
    heading: 'Your action',
    reviewerDescription:
      'Review the agreement and approve it, or request a modification with a mandatory note.',
    signerDescription:
      'You are the designated e-signer for this agreement: sign and approve, or request a modification.',
    noRejectNote:
      'There is no reject option at this stage — eligibility was settled by the approval committee. The only alternative to approval is a modification request.',
    notYourTurnTitle: 'It is not your turn yet',
    notYourTurnBody: 'You can review once the agreement reaches your position in the sequence.',
    noteLabel: 'Note (optional)',
    approve: 'Review and approve',
    signAndApprove: 'E-sign and approve',
    requestModification: 'Request a modification',
    errors: {
      'note-missing': 'Write the note — a modification request cannot be sent without one.',
      'signature-missing': 'Enter your full name to complete the e-signature.',
    },
  },
  signDialog: {
    title: 'Confirm e-signature',
    body: 'Your signature is recorded against the exact document version shown. If you are the last in the sequence, the agreement is sent to the applicant immediately.',
    signatureLabel: 'Full name for the signature',
    signatureHint:
      'Your name is recorded with the time and the document version — an internal acceptance, not a certified electronic signature.',
    confirm: 'Sign and approve',
    cancel: 'Cancel',
  },
  approveDialog: {
    title: 'Confirm review and approval',
    body: 'Your approval is recorded against the document version shown, and the agreement advances automatically to the next person.',
    confirm: 'Confirm approval',
    cancel: 'Cancel',
  },
  modificationDialog: {
    title: 'Request a modification',
    body: 'The sequence pauses and your note reaches the preparer and everyone in the sequence.',
    noteLabel: 'Note',
    confirm: 'Send the modification request',
    cancel: 'Cancel',
  },
  modificationBanner: {
    title: 'Modification requested',
    body: (name) => `${name} requested a modification to the agreement.`,
    resumeNote:
      'After re-submission the sequence resumes from the same person, leaving completed steps untouched.',
    correctNote:
      'You can correct the agreement data below before re-submitting. A new document version is frozen, and earlier approvals stay recorded against the version each person approved.',
    resubmit: 'Re-submit after the modification',
  },
  send: {
    heading: 'Sending to the applicant',
    pendingTitle: 'The agreement has not been sent yet',
    pendingSequence: 'Waiting for everyone in the sequence to complete their step.',
    pendingSignature: 'Waiting for the e-signature to be attached.',
    bothRequired:
      'Both conditions must hold — a signature alone is not enough to send the agreement.',
    sentTitle: 'The agreement was sent to the applicant',
    sentBody:
      'The sequence completed and the signature was attached, so the agreement was sent automatically for the applicant to sign.',
    sentAt: (date) => `Sent on ${date}`,
  },
  errors: {
    loadTitle: 'Could not load the agreement',
    loadBody: 'Something went wrong while loading the agreement. Please try again.',
    notFoundTitle: 'Application not found',
    notFoundBody: 'We could not find an application with this id.',
    sessionTitle: 'Session expired',
    sessionBody: 'Your session has expired. Please log in again to continue.',
    unauthorizedTitle: 'You do not have access',
    unauthorizedBody: 'You do not have permission to view this agreement.',
    submitTitle: 'Could not save the action',
    submitBody: 'Something went wrong and the action was not saved. Please try again.',
    retry: 'Try again',
  },
  services: getMyApplicationsContent('en').services,
};

const CONTENT: Record<Locale, AgreementsContent> = { ar, en };

export function getAgreementsContent(locale: Locale): AgreementsContent {
  return CONTENT[locale] ?? CONTENT.ar;
}
