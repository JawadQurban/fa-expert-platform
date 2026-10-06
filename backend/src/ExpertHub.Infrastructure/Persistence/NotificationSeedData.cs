using ExpertHub.Core.Domain;

namespace ExpertHub.Infrastructure.Persistence;

/// <summary>
/// CAP-07's seeded facts, extracted by script from the frontend contract's
/// own copies (`mockNotificationProvider.ts` EVENTS, `mockSlaMatrix.ts` SEED)
/// — never retyped, the same discipline as `AccessSeedData`.
/// </summary>
/// <remarks>
/// <para>
/// <b>The twenty events</b> are the notification points ten approved journeys
/// state (`P-146`), each carrying its citation and the journey's own words
/// about who is notified. The catalogue is incomplete by construction — a
/// capability with no journey has not yet declared its events (`BR-0703`).
/// </para>
/// <para>
/// <b>The six SLA rows</b> are the deadlines the journeys name (`BR-0705`):
/// three known because journeys state them, three present with no duration
/// because the journeys explicitly leave the number open — `DM-GAP-10` made
/// visible rather than described.
/// </para>
/// <para>
/// <b>What is NOT seeded</b>: no template (`BR-0701` — inventing message
/// bodies would put words in the Academy's mouth → `Q33`) and no matrix row
/// (`DM-GAP-08` — the approved routing does not exist; the journeys' audience
/// evidence sits on the event rows instead).
/// </para>
/// </remarks>
internal static class NotificationSeedData
{
    internal static readonly object[] Events =
    [
        new
        {
            EventCode = "EV-0101",
            CapabilityCode = "CAP-01",
            NameAr = "تأكيد استلام طلب الانضمام",
            NameEn = "Application submission confirmed",
            Source = "J-01 — user flow 7",
            JourneyAudienceAr = "مقدّم الطلب — «إشعار داخل المنصة وإشعار بالبريد».",
            JourneyAudienceEn = "The applicant — “in-app + notification”.",
        },
        new
        {
            EventCode = "EV-0102",
            CapabilityCode = "CAP-01",
            NameAr = "دعوة تفعيل لمرشَّح داخليًا",
            NameEn = "Activation invitation for an internally nominated applicant",
            Source = "J-02/F3/AC-1 + AC-2",
            JourneyAudienceAr = "المرشَّح، فورًا عند تقديم الموظف للطلب — «بقالب مختلف عن تأكيد التقديم الذاتي».",
            JourneyAudienceEn = "The nominee, immediately on staff submission — “a distinct template from the self-submission confirmation”.",
        },
        new
        {
            EventCode = "EV-0103",
            CapabilityCode = "CAP-01",
            NameAr = "اعتماد طلب إضافة خدمة بعد رفع الملحق",
            NameEn = "Add-service request approved, addendum live",
            Source = "J-03/F3/AC-6",
            JourneyAudienceAr = "المدرب — يُشعَر بالاعتماد وبالملحق المحدَّث.",
            JourneyAudienceEn = "The trainer — notified of the approval and the updated addendum.",
        },
        new
        {
            EventCode = "EV-0104",
            CapabilityCode = "CAP-01",
            NameAr = "رفض طلب إضافة خدمة",
            NameEn = "Add-service request rejected",
            Source = "J-03/F3/AC-7",
            JourneyAudienceAr = "المدرب — يُشعَر بالنتيجة **دون سبب الرفض**.",
            JourneyAudienceEn = "The trainer — notified of the outcome **without the rejection reason**.",
        },
        new
        {
            EventCode = "EV-0201",
            CapabilityCode = "CAP-02",
            NameAr = "توفّر مواعيد المقابلة",
            NameEn = "Interview slots available",
            Source = "J-06/F1/AC-1 (BR-0206)",
            JourneyAudienceAr = "مقدّم الطلب — بريد وإشعار داخل المنصة معًا؛ والاختيار يتم من البوابة لا من البريد.",
            JourneyAudienceEn = "The applicant — email and in-platform together; the choice is made in the portal, never in the email.",
        },
        new
        {
            EventCode = "EV-0202",
            CapabilityCode = "CAP-02",
            NameAr = "تذكير باختيار موعد المقابلة",
            NameEn = "Reminder to choose an interview slot",
            Source = "J-06/F1/AC-4",
            JourneyAudienceAr = "مقدّم الطلب — «تذكيرات تُرسل وفق مصفوفة الإشعارات».",
            JourneyAudienceEn = "The applicant — “reminders sent per the Notification Matrix”.",
        },
        new
        {
            EventCode = "EV-0203",
            CapabilityCode = "CAP-02",
            NameAr = "تأكيد موعد المقابلة ودعوة الاجتماع",
            NameEn = "Interview slot confirmed, meeting invitation issued",
            Source = "J-06 — user flow 5",
            JourneyAudienceAr = "مقدّم الطلب وأعضاء اللجنة — دعوة الاجتماع مع إشعار مواز في المنصة بنفس الوقت والرابط.",
            JourneyAudienceEn = "The applicant and the committee members — the meeting invite plus a parallel in-platform notification carrying the same time and link.",
        },
        new
        {
            EventCode = "EV-0204",
            CapabilityCode = "CAP-02",
            NameAr = "الاتفاقية جاهزة لتوقيع المتقدم",
            NameEn = "Agreement ready for the applicant to sign",
            Source = "J-11 — user flow 1 + F1/AC-1",
            JourneyAudienceAr = "مقدّم الطلب — يستلم الاتفاقية الموقّعة داخليًا بالكامل عبر إشعار.",
            JourneyAudienceEn = "The applicant — receives the fully internally-signed agreement via notification.",
        },
        new
        {
            EventCode = "EV-0301",
            CapabilityCode = "CAP-03",
            NameAr = "تنبيه قرب انتهاء الاتفاقية — 90 يومًا",
            NameEn = "Agreement expiry alert — 90 days",
            Source = "J-12/F1/AC-2 (BR-0303)",
            JourneyAudienceAr = "المدرب وموظفو إدارة المدربين معًا.",
            JourneyAudienceEn = "Both the trainer and Trainer Management staff.",
        },
        new
        {
            EventCode = "EV-0302",
            CapabilityCode = "CAP-03",
            NameAr = "تنبيه قرب انتهاء الاتفاقية — 30 يومًا",
            NameEn = "Agreement expiry alert — 30 days",
            Source = "J-12/F1/AC-3 (BR-0303, extended)",
            JourneyAudienceAr = "المدرب وموظفو إدارة المدربين معًا.",
            JourneyAudienceEn = "Both the trainer and Trainer Management staff.",
        },
        new
        {
            EventCode = "EV-0303",
            CapabilityCode = "CAP-03",
            NameAr = "تنبيه قرب انتهاء الاتفاقية — 5 أيام",
            NameEn = "Agreement expiry alert — 5 days",
            Source = "J-12/F1/AC-4 (BR-0303, extended)",
            JourneyAudienceAr = "المدرب وموظفو إدارة المدربين معًا — التنبيه الأخير.",
            JourneyAudienceEn = "Both the trainer and Trainer Management staff — the final alert.",
        },
        new
        {
            EventCode = "EV-0304",
            CapabilityCode = "CAP-03",
            NameAr = "تجديد الاتفاقية",
            NameEn = "Agreement renewed",
            Source = "J-12/F2/AC-3",
            JourneyAudienceAr = "المدرب — مع المدة الجديدة صراحةً في نص الإشعار.",
            JourneyAudienceEn = "The trainer — with the new duration stated in the message.",
        },
        new
        {
            EventCode = "EV-0501",
            CapabilityCode = "CAP-05",
            NameAr = "عرض إسناد للمرشح الأعلى ترتيبًا",
            NameEn = "Assignment offer sent to the top-ranked candidate",
            Source = "J-18/F1/AC-1 + AC-2",
            JourneyAudienceAr = "المرشح الأعلى ترتيبًا **وحده** لكل فتحة؛ المرشحون الاحتياطيون لا يُشعَرون حتى يأتي دورهم.",
            JourneyAudienceEn = "The top-ranked candidate **only**, per slot; backup candidates receive nothing until their turn.",
        },
        new
        {
            EventCode = "EV-0502",
            CapabilityCode = "CAP-05",
            NameAr = "رفض صريح لعرض الإسناد",
            NameEn = "Assignment offer explicitly rejected",
            Source = "J-18/F2/AC-2 (BR-0507)",
            JourneyAudienceAr = "الموظفون — فورًا.",
            JourneyAudienceEn = "Staff — immediately.",
        },
        new
        {
            EventCode = "EV-0503",
            CapabilityCode = "CAP-05",
            NameAr = "انتهاء مهلة عرض الإسناد دون رد",
            NameEn = "Assignment offer expired with no response",
            Source = "J-18/F2/AC-4",
            JourneyAudienceAr = "الموظف الذي رشّح المرشحين **تحديدًا** — «إشعار مستقل عن إشعار الرفض الصريح».",
            JourneyAudienceEn = "The staff member who nominated the candidates **specifically** — “a distinct notification from explicit rejection”.",
        },
        new
        {
            EventCode = "EV-0504",
            CapabilityCode = "CAP-05",
            NameAr = "استنفاد كل مرشحي الفتحة",
            NameEn = "Slot exhausted all approved candidates",
            Source = "J-19/F1/AC-2",
            JourneyAudienceAr = "الموظفون — «إشعار مستقل عن إشعار رفض أو انتهاء مهلة مرشح واحد».",
            JourneyAudienceEn = "Staff — “distinct from a single candidate’s rejection/expiry notification”.",
        },
        new
        {
            EventCode = "EV-0505",
            CapabilityCode = "CAP-05",
            NameAr = "تغيير مواعيد البرنامج في فاست",
            NameEn = "Programme dates changed in FAST",
            Source = "J-21/F1/AC-3",
            JourneyAudienceAr = "المدرب — إشعار فوري بالتغيير.",
            JourneyAudienceEn = "The trainer — an immediate notification of the change.",
        },
        new
        {
            EventCode = "EV-0506",
            CapabilityCode = "CAP-05",
            NameAr = "اعتذار المدرب عن ارتباط",
            NameEn = "Trainer withdrew from an engagement",
            Source = "J-22/F1/AC-4",
            JourneyAudienceAr = "الموظف المسؤول — فورًا.",
            JourneyAudienceEn = "The responsible staff member — immediately.",
        },
        new
        {
            EventCode = "EV-0507",
            CapabilityCode = "CAP-05",
            NameAr = "فك ارتباط المدرب من قِبل الإدارة",
            NameEn = "Staff de-linked a trainer from an engagement",
            Source = "J-22/F2/AC-4",
            JourneyAudienceAr = "المدرب — مع السبب المختار.",
            JourneyAudienceEn = "The trainer — along with the selected reason.",
        },
        new
        {
            EventCode = "EV-0508",
            CapabilityCode = "CAP-05",
            NameAr = "إلغاء الخطة بالكامل من فاست",
            NameEn = "Plan fully cancelled in FAST",
            Source = "J-22/F3/AC-4",
            JourneyAudienceAr = "كل مدرب مرتبط بالخطة — مع توضيح أن السبب هو إلغاء الأكاديمية للخطة بالكامل.",
            JourneyAudienceEn = "Every linked trainer — clarifying the reason is the Academy’s full cancellation of the plan.",
        },
    ];

    internal static readonly object[] SlaRows =
    [
        new
        {
            SlaId = "SLA-0201",
            CapabilityCode = (string?)"CAP-02",
            ActionCode = "interview-slot-selection",
            NameAr = "اختيار مقدّم الطلب لموعد المقابلة",
            NameEn = "Applicant selects an interview slot",
            Source = "J-06/F1/AC-4",
            OnBreachAr = "لم تنص الرحلة على أثر انتهاء المهلة.",
            OnBreachEn = "The journey does not state what happens when it runs out.",
            Status = "fixed",
            Duration = (int?)3,
            Unit = (string?)"business-days",
            ReminderOffsets = (string?)"[]",
            SortOrder = 1,
        },
        new
        {
            SlaId = "SLA-0501",
            CapabilityCode = (string?)"CAP-05",
            ActionCode = "assignment-offer-response",
            NameAr = "رد المرشح على عرض الإسناد",
            NameEn = "Candidate responds to an assignment offer",
            Source = "J-18/F2 — Candidate Response SLA + AC-1/AC-3",
            OnBreachAr = "ينتهي العرض تلقائيًا وينتقل إلى المرشح التالي في الترتيب.",
            OnBreachEn = "The offer expires automatically and moves to the next-ranked candidate.",
            Status = "fixed",
            Duration = (int?)3,
            Unit = (string?)"days",
            ReminderOffsets = (string?)"[]",
            SortOrder = 2,
        },
        new
        {
            SlaId = "SLA-0301",
            CapabilityCode = (string?)"CAP-03",
            ActionCode = "agreement-expiry",
            NameAr = "قرب انتهاء الاتفاقية",
            NameEn = "Agreement approaching expiry",
            Source = "J-12/F1/AC-2→AC-4 (BR-0303, extended)",
            OnBreachAr = "تنتهي الاتفاقية في تاريخها؛ التجديد إجراء إداري مستقل (J-12/F2).",
            OnBreachEn = "The agreement expires on its date; renewal is a separate administrative act.",
            Status = "record-derived",
            Duration = (int?)null,
            Unit = (string?)null,
            ReminderOffsets = (string?)"[90, 30, 5]",
            SortOrder = 3,
        },
        new
        {
            SlaId = "SLA-0202",
            CapabilityCode = (string?)"CAP-02",
            ActionCode = "screening-decision",
            NameAr = "إنجاز قرار الفرز",
            NameEn = "Screening decision completed",
            Source = "J-05 — user flow 5 shows “remaining SLA time”, with no duration",
            OnBreachAr = "غير محدد.",
            OnBreachEn = "Not defined.",
            Status = "undefined-duration",
            Duration = (int?)null,
            Unit = (string?)null,
            ReminderOffsets = (string?)null,
            SortOrder = 4,
        },
        new
        {
            SlaId = "SLA-0203",
            CapabilityCode = (string?)"CAP-02",
            ActionCode = "applicant-signature-no-response",
            NameAr = "عدم رد المتقدم على الاتفاقية",
            NameEn = "Applicant does not respond to the agreement",
            Source = "J-11 — open item 1, deferred to “the full SLA matrix”",
            OnBreachAr = "غير محدد.",
            OnBreachEn = "Not defined.",
            Status = "undefined-duration",
            Duration = (int?)null,
            Unit = (string?)null,
            ReminderOffsets = (string?)null,
            SortOrder = 5,
        },
        new
        {
            SlaId = "SLA-2001",
            CapabilityCode = (string?)null,
            ActionCode = "material-review",
            NameAr = "مراجعة المواد والمحتوى",
            NameEn = "Material & content review",
            Source = "J-20 — open item 1, “not currently defined” for both paths",
            OnBreachAr = "غير محدد.",
            OnBreachEn = "Not defined.",
            Status = "undefined-duration",
            Duration = (int?)null,
            Unit = (string?)null,
            ReminderOffsets = (string?)null,
            SortOrder = 6,
        },
    ];
}
