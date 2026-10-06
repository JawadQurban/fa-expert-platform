import type { Locale } from '@/types';
import type {
  AudienceCode,
  NotificationChannel,
  NotificationLogDto,
  SlaUnit,
} from './notification.types';
import { arNumber } from '../../shared/formatting';

/**
 * CAP-07 copy — Arabic authoritative, English best-effort.
 *
 * What this copy has to carry, because the screens alone cannot:
 *
 * - **The routing is a draft, not policy** (`DM-GAP-08`), and the matrix says so
 *   at the top — the same handling as CAP-08's grid.
 * - **Why there is no channel choice.** `BR-0702` fires email and in-platform
 *   together; an administrator looking for a per-channel toggle is told it is
 *   the rule rather than a missing control.
 * - **Why a draft template cannot be routed.** `BR-0701` allows only approved
 *   bilingual templates, so the reason the option is absent is stated.
 * - **Why the log has no resend.** `US-0705` wants failures handled, and §8.7
 *   never defines what a resend does — so the screen says so instead of
 *   pretending the need does not exist.
 */

export interface NotificationsContent {
  readonly nav: {
    readonly label: string;
    readonly matrix: string;
    readonly templates: string;
    readonly sla: string;
    readonly log: string;
  };

  readonly matrix: {
    readonly documentTitle: string;
    readonly title: string;
    readonly intro: string;
    readonly unapprovedTitle: string;
    readonly unapprovedBody: string;
    readonly bothChannelsNote: string;
    readonly catalogueNote: string;
    readonly noTemplatesTitle: string;
    readonly noTemplatesBody: string;
    readonly capabilityLabel: string;
    readonly capabilityOption: (code: string, count: number) => string;
    readonly eventLabel: string;
    readonly evidenceLabel: string;
    readonly routingLabel: string;
    readonly unrouted: string;
    readonly routedTo: (template: string) => string;
    readonly templateLabel: (event: string) => string;
    readonly audienceLegend: (event: string) => string;
    readonly activeLabel: (event: string) => string;
    readonly save: string;
    readonly routedCount: (routed: number, total: number) => string;
  };

  readonly templates: {
    readonly documentTitle: string;
    readonly title: string;
    readonly intro: string;
    readonly adminOnlyNote: string;
    readonly bilingualNote: string;
    readonly readOnlyNotice: string;
    readonly empty: string;
    readonly newTemplate: string;
    readonly edit: (code: string) => string;
    readonly approve: (code: string) => string;
    readonly editorHeading: string;
    readonly codeLabel: string;
    readonly subjectArLabel: string;
    readonly subjectEnLabel: string;
    readonly bodyArLabel: string;
    readonly bodyEnLabel: string;
    readonly placeholderHelp: (names: string) => string;
    readonly save: string;
    readonly cancel: string;
    readonly versionLine: (version: number, name: string, date: string) => string;
    readonly statuses: Readonly<Record<'draft' | 'approved', string>>;
  };

  readonly sla: {
    readonly documentTitle: string;
    readonly title: string;
    readonly intro: string;
    readonly centralNote: string;
    readonly coverageNote: (defined: number, total: number) => string;
    readonly capabilityLabel: string;
    readonly noCapability: string;
    readonly sourceLabel: string;
    readonly onBreachLabel: string;
    readonly undefinedDuration: string;
    readonly recordDerived: string;
    readonly durationValue: (duration: number, unit: string) => string;
    readonly remindersValue: (offsets: string) => string;
    readonly noReminders: string;
    readonly edit: (name: string) => string;
    readonly editorHeading: (name: string) => string;
    readonly durationLabel: string;
    readonly unitLabel: string;
    readonly remindersLabel: string;
    readonly remindersHelp: string;
    readonly save: string;
    readonly cancel: string;
    readonly units: Readonly<Record<SlaUnit, string>>;
  };

  readonly log: {
    readonly documentTitle: string;
    readonly title: string;
    readonly intro: string;
    readonly noResendNote: string;
    readonly bothChannelsNote: string;
    readonly languageNote: string;
    readonly searchLabel: string;
    readonly searchPlaceholder: string;
    readonly statusLabel: string;
    readonly channelLabel: string;
    readonly allStatuses: string;
    readonly allChannels: string;
    /** Introduces the row of currently-applied filters. */
    readonly activeHeading: string;
    /** Accessible name for a chip's remove control. */
    readonly removeFilter: (label: string, value: string) => string;
    readonly resultsLabel: string;
    readonly empty: string;
    readonly columns: {
      readonly event: string;
      readonly recipient: string;
      readonly channel: string;
      readonly language: string;
      readonly template: string;
      readonly status: string;
      readonly sentAt: string;
    };
    readonly statuses: Readonly<Record<NotificationLogDto['sendStatus'], string>>;
    readonly failureLabel: string;
    readonly templateVersion: (code: string, version: number) => string;
  };

  readonly channels: Readonly<Record<NotificationChannel, string>>;
  readonly audiences: Readonly<Record<AudienceCode, string>>;
  readonly languages: Readonly<Record<Locale, string>>;

  readonly errors: {
    readonly loadTitle: string;
    readonly loadBody: string;
    readonly actionFailed: string;
    readonly retry: string;
    readonly templateRequired: string;
    readonly templateNotApproved: string;
    readonly audienceRequired: string;
    readonly codeRequired: string;
    readonly subjectArRequired: string;
    readonly subjectEnRequired: string;
    readonly bodyArRequired: string;
    readonly bodyEnRequired: string;
    readonly unknownPlaceholder: string;
    readonly durationPositive: string;
    readonly reminderPositive: string;
    readonly reminderWithinDuration: string;
  };
}

const ar: NotificationsContent = {
  nav: {
    label: 'إدارة التواصل والإشعارات',
    matrix: 'مصفوفة الإشعارات',
    templates: 'قوالب الرسائل',
    sla: 'إدارة المهل',
    log: 'سجل الإشعارات',
  },

  matrix: {
    documentTitle: 'مصفوفة الإشعارات — منصة الخبراء',
    title: 'مصفوفة الإشعارات المركزية',
    intro: 'اربط كل حدث بقالبه وجمهوره المستهدف، من مكان واحد ولكل القدرات.',
    unapprovedTitle: 'هذه المصفوفة مسوّدة عمل ولم تُعتمد بعد',
    unapprovedBody:
      'لم يُعتمد بعد توجيه الأحداث (الحدث ← القالب ← الجمهور)، فالمصفوفة تبدأ بلا توجيه عمدًا. ما تراه بجانب كل حدث هو نص الرحلة التي عرّفته، لا قرارًا معتمدًا.',
    bothChannelsNote:
      'كل حدث معرَّف في المصفوفة يُرسَل بالبريد الإلكتروني وإشعار داخل المنصة معًا؛ لذلك لا يوجد اختيار للقناة في هذه الشاشة.',
    catalogueNote:
      'قائمة الأحداث مصدرها القدرات نفسها: كل قدرة تُطلق حدثها، وهذه الشاشة تحدد المستلم والقالب. لا تُنشأ الأحداث من هنا، والقدرات التي لا رحلة لها لم تُعلن أحداثها بعد.',
    noTemplatesTitle: 'لا توجد قوالب معتمدة بعد',
    noTemplatesBody:
      'لا يمكن توجيه أي حدث قبل اعتماد قالب ثنائي اللغة له. ابدأ من شاشة «قوالب الرسائل».',
    capabilityLabel: 'القدرة',
    capabilityOption: (code, count) => `${code} — ${arNumber(count)} حدث`,
    eventLabel: 'الحدث',
    evidenceLabel: 'ما نصّت عليه الرحلة',
    routingLabel: 'التوجيه',
    unrouted: 'بلا توجيه — لن يُرسل هذا الحدث أي إشعار.',
    routedTo: (template) => `موجَّه عبر القالب ${template}`,
    templateLabel: (event) => `قالب الرسالة للحدث ${event}`,
    audienceLegend: (event) => `الجمهور المستهدف للحدث ${event}`,
    activeLabel: (event) => `تفعيل توجيه الحدث ${event}`,
    save: 'حفظ التوجيه',
    routedCount: (routed, total) => `وُجِّه ${arNumber(routed)} من ${arNumber(total)} حدث`,
  },

  templates: {
    documentTitle: 'قوالب الرسائل — منصة الخبراء',
    title: 'قوالب الرسائل ثنائية اللغة',
    intro: 'صياغة واحدة معتمدة لكل رسالة رسمية، بالعربية والإنجليزية معًا.',
    adminOnlyNote: 'إنشاء القوالب وتعديلها من صلاحيات مشرف النظام وحده.',
    bilingualNote:
      'لا يُعتمد القالب إلا باكتمال اللغتين معًا؛ ولا يُوجَّه أي حدث إلى قالب غير معتمد. أي تعديل على قالب معتمد يعيده إلى مسوّدة ويوقف توجيهه.',
    readOnlyNotice: 'ليس لديك صلاحية تعديل القوالب؛ العرض فقط.',
    empty: 'لا توجد قوالب بعد. أنشئ أول قالب لتبدأ المصفوفة بالعمل.',
    newTemplate: 'قالب جديد',
    edit: (code) => `تعديل القالب ${code}`,
    approve: (code) => `اعتماد القالب ${code}`,
    editorHeading: 'محرّر القالب',
    codeLabel: 'رمز القالب',
    subjectArLabel: 'عنوان الرسالة (عربي)',
    subjectEnLabel: 'عنوان الرسالة (إنجليزي)',
    bodyArLabel: 'نص الرسالة (عربي)',
    bodyEnLabel: 'نص الرسالة (إنجليزي)',
    placeholderHelp: (names) => `المتغيرات المتاحة: ${names}. تُكتب هكذا: {{name}}`,
    save: 'حفظ القالب',
    cancel: 'إلغاء',
    versionLine: (version, name, date) => `الإصدار ${arNumber(version)} — ${name} في ${date}`,
    statuses: { draft: 'مسوّدة', approved: 'معتمد' },
  },

  sla: {
    documentTitle: 'إدارة المهل — منصة الخبراء',
    title: 'إدارة المهل الزمنية',
    intro: 'كل المهل والتذكيرات عبر القدرات، تُدار وتُعدَّل من هنا.',
    centralNote:
      'كل مهلة زمنية وتذكيرها، مهما كانت القدرة المصدر، تُدار من هذه الشاشة وحدها ولا تُعدَّل من داخل القدرة.',
    coverageNote: (defined, total) =>
      `⚠️ ${arNumber(defined)} من ${arNumber(total)} مهلة لها مدة محددة؛ الباقي وردت في الرحلات دون رقم، ولم يُفترض لها أي قيمة.`,
    capabilityLabel: 'القدرة',
    noCapability: 'لم تُسنَد لقدرة في وثيقة المتطلبات',
    sourceLabel: 'المصدر',
    onBreachLabel: 'عند انتهاء المهلة',
    undefinedDuration: 'المدة غير محددة',
    recordDerived: 'المهلة من تاريخ السجل نفسه؛ ما يُضبط هنا هو التذكيرات.',
    durationValue: (duration, unit) => `${arNumber(duration)} ${unit}`,
    remindersValue: (offsets) => `تذكيرات قبل: ${offsets}`,
    noReminders: 'لا توجد تذكيرات محددة.',
    edit: (name) => `تعديل مهلة ${name}`,
    editorHeading: (name) => `تعديل مهلة ${name}`,
    durationLabel: 'المدة',
    unitLabel: 'الوحدة',
    remindersLabel: 'التذكيرات (أيام قبل الموعد)',
    remindersHelp: 'أرقام مفصولة بفواصل، مثل: 90، 30، 5',
    save: 'حفظ المهلة',
    cancel: 'إلغاء',
    units: { days: 'يوم', 'business-days': 'يوم عمل' },
  },

  log: {
    documentTitle: 'سجل الإشعارات — منصة الخبراء',
    title: 'سجل الإشعارات',
    intro: 'كل إشعار أُرسل وحالته، لمتابعة المتعثّر منها.',
    noResendNote:
      'لا تتوفر إعادة الإرسال في هذا الإصدار: وثيقة المتطلبات لا تحدد ما الذي تعنيه إعادة الإرسال — أي إصدار من القالب يُستخدم، وهل يُنشأ سجل جديد، وبأي لغة. السجل يعرض سبب كل إخفاق لمعالجته خارج المنصة.',
    bothChannelsNote:
      'الحدث الواحد ينتج سجلّين: البريد وإشعار المنصة، لأنهما يُرسلان معًا. قد ينجح أحدهما ويخفق الآخر.',
    languageNote:
      'يُرسل كل إشعار بلغة واحدة، تُحدَّد من «اللغة الأساسية» في ملف المستلم؛ ولا تُرسل نسخة ثنائية اللغة.',
    searchLabel: 'بحث في السجل',
    searchPlaceholder: 'اسم المستلم أو رمز الحدث أو القالب',
    statusLabel: 'حالة الإرسال',
    channelLabel: 'القناة',
    allStatuses: 'كل الحالات',
    allChannels: 'كل القنوات',
    activeHeading: 'التصفية النشطة:',
    removeFilter: (label, value) => `أزل تصفية ${label}: ${value}`,
    resultsLabel: 'سجل الإشعارات',
    empty: 'لا توجد سجلات مطابقة.',
    columns: {
      event: 'الحدث',
      recipient: 'المستلم',
      channel: 'القناة',
      language: 'اللغة',
      template: 'القالب',
      status: 'الحالة',
      sentAt: 'وقت الإرسال',
    },
    statuses: { success: 'نجح', failure: 'أخفق' },
    failureLabel: 'سبب الإخفاق',
    templateVersion: (code, version) => `${code} — الإصدار ${arNumber(version)}`,
  },

  channels: { email: 'البريد الإلكتروني', 'in-platform': 'إشعار داخل المنصة' },
  audiences: {
    record_subject: 'صاحب السجل (المدرب أو مقدّم الطلب)',
    acting_staff: 'الموظف المسؤول عن الإجراء',
    trainer: 'المدربون',
    staff: 'موظفو إدارة المدربين',
    manager: 'مدير إدارة المدربين',
    centre_coordinator: 'منسقو المراكز',
    system_administrator: 'مشرف النظام',
    executive: 'الإدارة العليا',
  },
  languages: { ar: 'العربية', en: 'الإنجليزية' },

  errors: {
    loadTitle: 'تعذّر تحميل البيانات',
    loadBody: 'حدث خطأ أثناء التحميل. يُرجى المحاولة مرة أخرى.',
    actionFailed: 'تعذّر تنفيذ الإجراء. يُرجى المحاولة مرة أخرى.',
    retry: 'إعادة المحاولة',
    templateRequired: 'اختر قالبًا لتوجيه هذا الحدث.',
    templateNotApproved: 'لا يمكن التوجيه إلى قالب غير معتمد.',
    audienceRequired: 'اختر جمهورًا واحدًا على الأقل.',
    codeRequired: 'رمز القالب مطلوب.',
    subjectArRequired: 'عنوان الرسالة بالعربية مطلوب.',
    subjectEnRequired: 'عنوان الرسالة بالإنجليزية مطلوب.',
    bodyArRequired: 'نص الرسالة بالعربية مطلوب.',
    bodyEnRequired: 'نص الرسالة بالإنجليزية مطلوب.',
    unknownPlaceholder: 'النص يحتوي متغيرًا غير معروف.',
    durationPositive: 'المدة يجب أن تكون رقمًا صحيحًا أكبر من صفر.',
    reminderPositive: 'كل تذكير يجب أن يكون رقمًا صحيحًا أكبر من صفر.',
    reminderWithinDuration: 'التذكير يجب أن يسبق انتهاء المهلة.',
  },
};

const en: NotificationsContent = {
  nav: {
    label: 'Communication and notifications administration',
    matrix: 'Notification matrix',
    templates: 'Message templates',
    sla: 'Deadlines',
    log: 'Notification log',
  },

  matrix: {
    documentTitle: 'Notification matrix — Expert Hub',
    title: 'Central notification matrix',
    intro:
      'Bind each event to its template and its audience, from one place, for every capability.',
    unapprovedTitle: 'This matrix is a working draft and is not approved',
    unapprovedBody:
      'The routing — event → template → audience — has not been approved, so the matrix starts unrouted on purpose. What sits beside each event is the wording of the journey that defined it, not an approved decision.',
    bothChannelsNote:
      'Every event in the matrix sends by email and in-platform together, so there is no channel to choose on this screen.',
    catalogueNote:
      'The event list comes from the capabilities themselves: each capability raises its own event and this screen decides the recipient and the template. Events are not created here, and a capability with no journey has not declared its events yet.',
    noTemplatesTitle: 'No approved templates yet',
    noTemplatesBody:
      'No event can be routed before a bilingual template is approved for it. Start from the Message templates screen.',
    capabilityLabel: 'Capability',
    capabilityOption: (code, count) => `${code} — ${count} events`,
    eventLabel: 'Event',
    evidenceLabel: 'What the journey states',
    routingLabel: 'Routing',
    unrouted: 'Unrouted — this event will send nothing.',
    routedTo: (template) => `Routed via ${template}`,
    templateLabel: (event) => `Message template for ${event}`,
    audienceLegend: (event) => `Audience for ${event}`,
    activeLabel: (event) => `Activate routing for ${event}`,
    save: 'Save routing',
    routedCount: (routed, total) => `${routed} of ${total} events routed`,
  },

  templates: {
    documentTitle: 'Message templates — Expert Hub',
    title: 'Bilingual message templates',
    intro: 'One approved wording per official message, in Arabic and English together.',
    adminOnlyNote: 'Creating and editing templates is the System Administrator’s alone.',
    bilingualNote:
      'A template is approved only when both languages are complete, and no event may be routed to an unapproved one. Editing an approved template returns it to draft and stops its routing.',
    readOnlyNotice: 'You do not have permission to edit templates; view only.',
    empty: 'No templates yet. Create the first one to put the matrix to work.',
    newTemplate: 'New template',
    edit: (code) => `Edit ${code}`,
    approve: (code) => `Approve ${code}`,
    editorHeading: 'Template editor',
    codeLabel: 'Template code',
    subjectArLabel: 'Subject (Arabic)',
    subjectEnLabel: 'Subject (English)',
    bodyArLabel: 'Body (Arabic)',
    bodyEnLabel: 'Body (English)',
    placeholderHelp: (names) => `Available placeholders: ${names}. Written as {{name}}`,
    save: 'Save template',
    cancel: 'Cancel',
    versionLine: (version, name, date) => `Version ${version} — ${name} on ${date}`,
    statuses: { draft: 'Draft', approved: 'Approved' },
  },

  sla: {
    documentTitle: 'Deadlines — Expert Hub',
    title: 'Deadline management',
    intro: 'Every deadline and reminder across the capabilities, managed from here.',
    centralNote:
      'Every deadline and its reminder, whatever capability raises the event, is managed from this screen alone and never from inside that capability.',
    coverageNote: (defined, total) =>
      `⚠️ ${defined} of ${total} deadlines have a duration; the rest are named by a journey that gives no number, and none has been assumed.`,
    capabilityLabel: 'Capability',
    noCapability: 'No capability assigned in the requirements document',
    sourceLabel: 'Source',
    onBreachLabel: 'When it runs out',
    undefinedDuration: 'Duration not defined',
    recordDerived:
      'The deadline comes from the record’s own date; only the reminders are set here.',
    durationValue: (duration, unit) => `${duration} ${unit}`,
    remindersValue: (offsets) => `Reminders before: ${offsets}`,
    noReminders: 'No reminders defined.',
    edit: (name) => `Edit the ${name} deadline`,
    editorHeading: (name) => `Edit the ${name} deadline`,
    durationLabel: 'Duration',
    unitLabel: 'Unit',
    remindersLabel: 'Reminders (days before)',
    remindersHelp: 'Comma-separated numbers, e.g. 90, 30, 5',
    save: 'Save deadline',
    cancel: 'Cancel',
    units: { days: 'days', 'business-days': 'business days' },
  },

  log: {
    documentTitle: 'Notification log — Expert Hub',
    title: 'Notification log',
    intro: 'Every notification sent and its status, so the failed ones can be followed up.',
    noResendNote:
      'Resending is not available in this release: the requirements document does not define what a resend means — which template version it uses, whether it writes a new log entry, and in which language. The log shows every failure’s reason so it can be handled outside the platform.',
    bothChannelsNote:
      'One event produces two entries — email and in-platform — because they are sent together. One can succeed while the other fails.',
    languageNote:
      'Each notification is sent in one language, taken from the recipient’s primary-language field; no bilingual copy is sent.',
    searchLabel: 'Search the log',
    searchPlaceholder: 'Recipient, event code or template',
    statusLabel: 'Send status',
    channelLabel: 'Channel',
    allStatuses: 'All statuses',
    allChannels: 'All channels',
    activeHeading: 'Active filters:',
    removeFilter: (label, value) => `Remove ${label} filter: ${value}`,
    resultsLabel: 'Notification log',
    empty: 'No matching entries.',
    columns: {
      event: 'Event',
      recipient: 'Recipient',
      channel: 'Channel',
      language: 'Language',
      template: 'Template',
      status: 'Status',
      sentAt: 'Sent at',
    },
    statuses: { success: 'Succeeded', failure: 'Failed' },
    failureLabel: 'Failure reason',
    templateVersion: (code, version) => `${code} — version ${version}`,
  },

  channels: { email: 'Email', 'in-platform': 'In-platform' },
  audiences: {
    record_subject: 'The subject of the record (trainer or applicant)',
    acting_staff: 'The staff member responsible for the action',
    trainer: 'Trainers',
    staff: 'Trainer Management staff',
    manager: 'Trainer Management manager',
    centre_coordinator: 'Centre coordinators',
    system_administrator: 'System Administrator',
    executive: 'Senior management',
  },
  languages: { ar: 'Arabic', en: 'English' },

  errors: {
    loadTitle: 'Could not load the data',
    loadBody: 'Something went wrong while loading. Please try again.',
    actionFailed: 'The action could not be completed. Please try again.',
    retry: 'Try again',
    templateRequired: 'Choose a template to route this event.',
    templateNotApproved: 'An unapproved template cannot be routed to.',
    audienceRequired: 'Choose at least one audience.',
    codeRequired: 'A template code is required.',
    subjectArRequired: 'The Arabic subject is required.',
    subjectEnRequired: 'The English subject is required.',
    bodyArRequired: 'The Arabic body is required.',
    bodyEnRequired: 'The English body is required.',
    unknownPlaceholder: 'The text uses an unknown placeholder.',
    durationPositive: 'The duration must be a whole number greater than zero.',
    reminderPositive: 'Every reminder must be a whole number greater than zero.',
    reminderWithinDuration: 'A reminder must fall before the deadline.',
  },
};

const CONTENT: Record<Locale, NotificationsContent> = { ar, en };

export function getNotificationsContent(locale: Locale): NotificationsContent {
  return CONTENT[locale] ?? CONTENT.ar;
}
