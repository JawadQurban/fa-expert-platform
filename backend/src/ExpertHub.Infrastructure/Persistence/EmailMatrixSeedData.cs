using ExpertHub.Core.Domain;

namespace ExpertHub.Infrastructure.Persistence;

/// <summary>
/// The owner's email matrix — Notion «Email Notification Matrix», read
/// 2026-10-22 (`P-372`). Generated from that table, never retyped by hand:
/// subjects and bodies are Notion's own words; only the placeholders are
/// renamed from Notion's <c>{{snake_case}}</c> to the platform's vocabulary.
/// </summary>
/// <remarks>
/// ⚠️ Every Notion row is marked «Needs Review». The templates are seeded
/// approved and routed because the owner asked for the matrix to be built
/// («the content is on notion build it»); a System Administrator can still
/// edit any wording or pause any row from the matrix screen.
/// </remarks>
internal static class EmailMatrixSeedData
{
    private static readonly DateTime Seeded = new(2026, 10, 22, 0, 0, 0, DateTimeKind.Utc);

    /// <summary>The notification points the matrix adds to the catalogue.</summary>
    internal static readonly NotificationEvent[] Events =
    [
        new() { EventCode = "EV-0105", CapabilityCode = "CAP-01", NameAr = "طلب إضافة خدمة بانتظار المراجعة", NameEn = "Add-service request awaiting review", Source = "Email matrix E-006 (J-03)", JourneyAudienceAr = "موظفو إدارة المدربين.", JourneyAudienceEn = "Trainer management staff." },
        new() { EventCode = "EV-0205", CapabilityCode = "CAP-02", NameAr = "قبول الطلب في الفرز", NameEn = "Application accepted at screening", Source = "Email matrix E-011 (J-05)", JourneyAudienceAr = "المتقدم.", JourneyAudienceEn = "The applicant." },
        new() { EventCode = "EV-0206", CapabilityCode = "CAP-02", NameAr = "قبول جزئي للطلب في الفرز", NameEn = "Application partly accepted at screening", Source = "Email matrix E-012 (J-05)", JourneyAudienceAr = "المتقدم.", JourneyAudienceEn = "The applicant." },
        new() { EventCode = "EV-0207", CapabilityCode = "CAP-02", NameAr = "رفض الطلب في الفرز", NameEn = "Application rejected at screening", Source = "Email matrix E-013 (J-05)", JourneyAudienceAr = "المتقدم.", JourneyAudienceEn = "The applicant." },
        new() { EventCode = "EV-0208", CapabilityCode = "CAP-02", NameAr = "طلب المتقدم إعادة جدولة المقابلة", NameEn = "Applicant asked to reschedule the interview", Source = "Email matrix E-016 (J-06/F4)", JourneyAudienceAr = "صاحب قرار الفرز.", JourneyAudienceEn = "The screening decision-maker." },
        new() { EventCode = "EV-0210", CapabilityCode = "CAP-02", NameAr = "رفض الطلب بعد المقابلة", NameEn = "Application rejected after the interview", Source = "Email matrix E-019 (J-07)", JourneyAudienceAr = "المتقدم.", JourneyAudienceEn = "The applicant." },
        new() { EventCode = "EV-0211", CapabilityCode = "CAP-02", NameAr = "طلب بانتظار موافقة عضو اللجنة", NameEn = "Application awaiting a committee member", Source = "Email matrix E-020 (J-09)", JourneyAudienceAr = "عضو اللجنة الذي حان دوره.", JourneyAudienceEn = "The committee member whose turn it is." },
        new() { EventCode = "EV-0212", CapabilityCode = "CAP-02", NameAr = "الموافقة المبدئية — مطلوب بيانات بنكية", NameEn = "Preliminary approval — bank data required", Source = "Email matrix E-021 (J-09)", JourneyAudienceAr = "المتقدم.", JourneyAudienceEn = "The applicant." },
        new() { EventCode = "EV-0213", CapabilityCode = "CAP-02", NameAr = "رفض نهائي من لجنة الاعتماد", NameEn = "Final rejection by the approval committee", Source = "Email matrix E-022 (J-09)", JourneyAudienceAr = "المتقدم.", JourneyAudienceEn = "The applicant." },
        new() { EventCode = "EV-0214", CapabilityCode = "CAP-02", NameAr = "طلب تعديل من عضو اللجنة", NameEn = "Committee member requested a modification", Source = "Email matrix E-023 (J-09)", JourneyAudienceAr = "منشئ تسلسل اللجنة.", JourneyAudienceEn = "Whoever formed the committee sequence." },
        new() { EventCode = "EV-0215", CapabilityCode = "CAP-02", NameAr = "اكتمال البيانات البنكية", NameEn = "Bank data completed", Source = "Email matrix E-024 (J-09/F6)", JourneyAudienceAr = "منشئ تسلسل اللجنة.", JourneyAudienceEn = "Whoever formed the committee sequence." },
        new() { EventCode = "EV-0217", CapabilityCode = "CAP-02", NameAr = "نتيجة المقابلة جاهزة للقرار", NameEn = "Interview result ready for a decision", Source = "Email matrix E-072 (J-07)", JourneyAudienceAr = "صاحب قرار الفرز.", JourneyAudienceEn = "The screening decision-maker." },
        new() { EventCode = "EV-0305", CapabilityCode = "CAP-03", NameAr = "جاهز لإعداد الاتفاقية", NameEn = "Ready for agreement preparation", Source = "Email matrix E-025 (J-10)", JourneyAudienceAr = "منشئ تسلسل اللجنة.", JourneyAudienceEn = "Whoever formed the committee sequence." },
        new() { EventCode = "EV-0306", CapabilityCode = "CAP-03", NameAr = "اتفاقية بانتظار توقيع داخلي", NameEn = "Agreement awaiting an internal signer", Source = "Email matrix E-026 (J-10)", JourneyAudienceAr = "الموقّع الذي حان دوره.", JourneyAudienceEn = "The signer whose turn it is." },
        new() { EventCode = "EV-0307", CapabilityCode = "CAP-03", NameAr = "طلب تعديل من موقّع داخلي", NameEn = "Internal signer requested a modification", Source = "Email matrix E-027 (J-10)", JourneyAudienceAr = "منشئ تسلسل التوقيع.", JourneyAudienceEn = "Whoever formed the signing sequence." },
        new() { EventCode = "EV-0308", CapabilityCode = "CAP-03", NameAr = "طلب المتقدم تعديل الاتفاقية", NameEn = "Applicant requested an agreement modification", Source = "Email matrix E-029 (J-11)", JourneyAudienceAr = "معدّ الاتفاقية.", JourneyAudienceEn = "The agreement's preparer." },
        new() { EventCode = "EV-0309", CapabilityCode = "CAP-03", NameAr = "رفض المتقدم الاتفاقية", NameEn = "Applicant declined the agreement", Source = "Email matrix E-030 (J-11)", JourneyAudienceAr = "معدّ الاتفاقية.", JourneyAudienceEn = "The agreement's preparer." },
        new() { EventCode = "EV-0310", CapabilityCode = "CAP-03", NameAr = "توقيع الاتفاقية وتفعيلها", NameEn = "Agreement signed and activated", Source = "Email matrix E-031 (J-11)", JourneyAudienceAr = "المدرب.", JourneyAudienceEn = "The trainer." },
        new() { EventCode = "EV-0311", CapabilityCode = "CAP-03", NameAr = "تعليق الاتفاقية", NameEn = "Agreement suspended", Source = "Email matrix E-036 (J-12)", JourneyAudienceAr = "المدرب.", JourneyAudienceEn = "The trainer." },
        new() { EventCode = "EV-0312", CapabilityCode = "CAP-03", NameAr = "إنهاء الاتفاقية", NameEn = "Agreement ended", Source = "Email matrix E-037 (J-12)", JourneyAudienceAr = "المدرب.", JourneyAudienceEn = "The trainer." },
        new() { EventCode = "EV-0401", CapabilityCode = "CAP-04", NameAr = "إنشاء ملف المدرب", NameEn = "Trainer profile created", Source = "Email matrix E-038 (J-13)", JourneyAudienceAr = "المدرب.", JourneyAudienceEn = "The trainer." },
        new() { EventCode = "EV-0509", CapabilityCode = "CAP-05", NameAr = "قائمة مرشحين بانتظار الموافقة", NameEn = "Candidate pool awaiting approval", Source = "Email matrix E-039 (J-17)", JourneyAudienceAr = "منسق الطلب.", JourneyAudienceEn = "The request's coordinator." },
        new() { EventCode = "EV-0510", CapabilityCode = "CAP-05", NameAr = "مادة أو محتوى بانتظار الاعتماد", NameEn = "Material or content awaiting approval", Source = "Email matrix E-041 (J-20)", JourneyAudienceAr = "منسق الطلب.", JourneyAudienceEn = "The request's coordinator." },
        new() { EventCode = "EV-0511", CapabilityCode = "CAP-05", NameAr = "طلب تعديل المادة أو المحتوى", NameEn = "Material or content revision requested", Source = "Email matrix E-042 (J-20)", JourneyAudienceAr = "المدرب أو مطوّر المحتوى.", JourneyAudienceEn = "The trainer or content developer." },
        new() { EventCode = "EV-0512", CapabilityCode = "CAP-05", NameAr = "اعتماد المادة أو المحتوى", NameEn = "Material or content approved", Source = "Email matrix E-043 (J-20)", JourneyAudienceAr = "المدرب أو مطوّر المحتوى.", JourneyAudienceEn = "The trainer or content developer." },
        new() { EventCode = "EV-0513", CapabilityCode = "CAP-05", NameAr = "استلام اعتذار المدرب", NameEn = "Trainer's withdrawal received", Source = "Email matrix E-071 (J-22)", JourneyAudienceAr = "المدرب المعتذر.", JourneyAudienceEn = "The trainer who withdrew." },
        new() { EventCode = "EV-0515", CapabilityCode = "CAP-05", NameAr = "مطلوب رفع المادة التدريبية", NameEn = "Training material upload needed", Source = "Email matrix E-076 (J-20)", JourneyAudienceAr = "المدرب.", JourneyAudienceEn = "The trainer." },
        new() { EventCode = "EV-0516", CapabilityCode = "CAP-05", NameAr = "مطلوب رفع المحتوى", NameEn = "Content upload needed", Source = "Email matrix E-077 (J-20)", JourneyAudienceAr = "مطوّر المحتوى.", JourneyAudienceEn = "The content developer." },
        new() { EventCode = "EV-0801", CapabilityCode = "CAP-08", NameAr = "تحديث أدوار المستخدم", NameEn = "User's roles updated", Source = "Email matrix E-050 (J-26)", JourneyAudienceAr = "المستخدم المعني.", JourneyAudienceEn = "The user concerned." },
    ];

    /// <summary>One template per Notion row, coded by its Notion id.</summary>
    internal static readonly NotificationTemplate[] Templates =
    [
        new()
        {
            TemplateId = new Guid("e4d0fe0b-4271-5594-b11a-d2b419ae6b86"),
            Code = "E-001",
            SubjectAr = "طلبك وصلنا!",
            SubjectEn = "We've Got Your Application!",
            BodyAr = "مرحبًا {{recipientName}}،\n\nنفيدكم بأنه تم استلام طلب انضمامكم بنجاح، ورقم المرجع الخاص بطلبكم هو {{referenceNumber}}.\n\nسيتم مراجعة الطلب من قبل الفريق المختص، وسيتم إعلامكم بأي تحديث أولًا بأول. يمكنكم متابعة حالة الطلب في أي وقت من خلال لوحة التحكم الخاصة بكم.\n\nمع تحيات فريق منصة الخبراء والمدربين",
            BodyEn = "Dear {{recipientName}},\n\nThis is to confirm that your application has been received successfully. Your reference number is {{referenceNumber}}.\n\nYour application will be reviewed by our team, and you will be notified of any updates. You may track its status at any time from your dashboard.\n\nKind regards,\nExpert Hub Team",
            Placeholders = "[\"recipientName\", \"referenceNumber\"]",
            Version = 1,
            Status = TemplateStatuses.Approved,
            UpdatedAt = Seeded,
            UpdatedBy = null,
        },
        new()
        {
            TemplateId = new Guid("22ff2145-97de-5dc7-a2c4-bb1412988a00"),
            Code = "E-002",
            SubjectAr = "أهلًا بك في منصتنا",
            SubjectEn = "Welcome Aboard",
            BodyAr = "مرحبًا بك في منصة الخبراء والمدربين! تم إنشاء حسابك بنجاح، وأصبح بإمكانك الدخول في أي وقت لمتابعة رحلتك معنا من البداية حتى الاعتماد.",
            BodyEn = "Welcome to Expert Hub! Your account is ready. Log in anytime to follow your journey with us, from application to approval.",
            Placeholders = "[]",
            Version = 1,
            Status = TemplateStatuses.Approved,
            UpdatedAt = Seeded,
            UpdatedBy = null,
        },
        new()
        {
            TemplateId = new Guid("b021ce95-978a-5a72-bac6-f621a87c5adb"),
            Code = "E-003",
            SubjectAr = "أكمل طلبك المحفوظ",
            SubjectEn = "Complete Your Saved Application",
            BodyAr = "لديك طلب غير مكتمل محفوظ كمسودة. يمكنك إكمال تقديمه في أي وقت.",
            BodyEn = "You have an incomplete draft application saved. You can resume and submit it anytime.",
            Placeholders = "[]",
            Version = 1,
            Status = TemplateStatuses.Approved,
            UpdatedAt = Seeded,
            UpdatedBy = null,
        },
        new()
        {
            TemplateId = new Guid("bb63a843-937d-5055-a644-6645da542cee"),
            Code = "E-004",
            SubjectAr = "تفعيل حسابك كمرشح",
            SubjectEn = "Activate Your Nominee Account",
            BodyAr = "تمت إضافتك كمرشح داخلي من قبل الأكاديمية. يرجى تفعيل حسابك لمتابعة طلبك.",
            BodyEn = "You have been registered as an internal nominee by the Academy. Please activate your account to track your application.",
            Placeholders = "[]",
            Version = 1,
            Status = TemplateStatuses.Approved,
            UpdatedAt = Seeded,
            UpdatedBy = null,
        },
        new()
        {
            TemplateId = new Guid("30e985bd-e88d-5323-abf0-9473bf883d8a"),
            Code = "E-005",
            SubjectAr = "تم تفعيل الحساب",
            SubjectEn = "Account Activated",
            BodyAr = "تم تفعيل حسابك بنجاح. يمكنك الآن متابعة طلبك من بوابة المدرب.",
            BodyEn = "Your account has been activated. You can now track your application from the Trainer Portal.",
            Placeholders = "[]",
            Version = 1,
            Status = TemplateStatuses.Approved,
            UpdatedAt = Seeded,
            UpdatedBy = null,
        },
        new()
        {
            TemplateId = new Guid("1d25b574-17bb-563d-b12c-2d4481039c2b"),
            Code = "E-006",
            SubjectAr = "طلب إضافة خدمة بانتظار المراجعة",
            SubjectEn = "Service Addition Request Awaiting Review",
            BodyAr = "يوجد طلب إضافة خدمة جديد بانتظار مراجعتك للمدرب {{trainerName}}.",
            BodyEn = "A new service-addition request from {{trainerName}} is awaiting your review.",
            Placeholders = "[\"trainerName\"]",
            Version = 1,
            Status = TemplateStatuses.Approved,
            UpdatedAt = Seeded,
            UpdatedBy = null,
        },
        new()
        {
            TemplateId = new Guid("4eca8e8b-610c-52a9-9b63-6e01bcc1d714"),
            Code = "E-007",
            SubjectAr = "تمت الموافقة على إضافة الخدمة",
            SubjectEn = "Service Addition Approved",
            BodyAr = "تمت الموافقة على إضافة الخدمة الجديدة إلى ملفك، وتم تحديث اتفاقيتك.",
            BodyEn = "Your new service addition has been approved and your agreement addendum has been updated.",
            Placeholders = "[]",
            Version = 1,
            Status = TemplateStatuses.Approved,
            UpdatedAt = Seeded,
            UpdatedBy = null,
        },
        new()
        {
            TemplateId = new Guid("672b3c7e-b33e-5889-97b8-6d50d99a6f06"),
            Code = "E-008",
            SubjectAr = "قرار بشأن طلب إضافة الخدمة",
            SubjectEn = "Service Addition Decision",
            BodyAr = "نأسف، لم تتم الموافقة على طلب إضافة الخدمة الجديدة.",
            BodyEn = "We regret to inform you that your service-addition request was not approved.",
            Placeholders = "[]",
            Version = 1,
            Status = TemplateStatuses.Approved,
            UpdatedAt = Seeded,
            UpdatedBy = null,
        },
        new()
        {
            TemplateId = new Guid("a307f12a-f282-51ec-a967-422cf2579cb3"),
            Code = "E-009",
            SubjectAr = "إنشاء سجل متحدث",
            SubjectEn = "Speaker Record Created",
            BodyAr = "تم إنشاء سجلك كمتحدث في منصة الخبراء والمدربين.",
            BodyEn = "A speaker record has been created for you on the Expert Hub platform.",
            Placeholders = "[]",
            Version = 1,
            Status = TemplateStatuses.Approved,
            UpdatedAt = Seeded,
            UpdatedBy = null,
        },
        new()
        {
            TemplateId = new Guid("2ccc8c3a-b37e-57a3-9c2c-ae665adc240a"),
            Code = "E-010",
            SubjectAr = "تحديث سجل المتحدث",
            SubjectEn = "Speaker Record Updated",
            BodyAr = "تم تحديث بيانات سجلك كمتحدث.",
            BodyEn = "Your speaker record details have been updated.",
            Placeholders = "[]",
            Version = 1,
            Status = TemplateStatuses.Approved,
            UpdatedAt = Seeded,
            UpdatedBy = null,
        },
        new()
        {
            TemplateId = new Guid("b2304dc0-5083-5102-af18-cc4b36d7770d"),
            Code = "E-011",
            SubjectAr = "تم قبول طلبك",
            SubjectEn = "Your Application Was Accepted",
            BodyAr = "تهانينا! تم قبول طلبك للخدمة/الخدمات المطلوبة.",
            BodyEn = "Congratulations! Your application has been accepted for the requested service(s).",
            Placeholders = "[]",
            Version = 1,
            Status = TemplateStatuses.Approved,
            UpdatedAt = Seeded,
            UpdatedBy = null,
        },
        new()
        {
            TemplateId = new Guid("5456128c-7bcc-5987-b6cd-bcd5992122b7"),
            Code = "E-012",
            SubjectAr = "تهانينا! تم قبول طلبك جزئيًا",
            SubjectEn = "Congratulations — Part of Your Application Was Accepted",
            BodyAr = "تهانينا {{recipientName}}! تم قبول طلبك للخدمات التالية: {{serviceList}}. يسعدنا مرافقتك في الخطوة القادمة من رحلتك معنا.",
            BodyEn = "Congratulations, {{recipientName}}! Your application has been accepted for: {{serviceList}}. We're glad to guide you through the next step of your journey with us.",
            Placeholders = "[\"recipientName\", \"serviceList\"]",
            Version = 1,
            Status = TemplateStatuses.Approved,
            UpdatedAt = Seeded,
            UpdatedBy = null,
        },
        new()
        {
            TemplateId = new Guid("ffe3ca70-3346-5811-8a6b-5148156cedc7"),
            Code = "E-013",
            SubjectAr = "نتيجة الطلب",
            SubjectEn = "Application Decision",
            BodyAr = "نأسف لإبلاغك بأن طلبك لم يُقبل.",
            BodyEn = "We regret to inform you that your application was not accepted.",
            Placeholders = "[]",
            Version = 1,
            Status = TemplateStatuses.Approved,
            UpdatedAt = Seeded,
            UpdatedBy = null,
        },
        new()
        {
            TemplateId = new Guid("00d2c697-9895-5d6e-96a0-9d715b2412be"),
            Code = "E-014",
            SubjectAr = "مواعيد المقابلة متاحة",
            SubjectEn = "Interview Slots Available",
            BodyAr = "تتوفر مواعيد لمقابلتك. يرجى اختيار الموعد المناسب من بوابتك.",
            BodyEn = "Interview slots are now available. Please select your preferred time from your portal.",
            Placeholders = "[]",
            Version = 1,
            Status = TemplateStatuses.Approved,
            UpdatedAt = Seeded,
            UpdatedBy = null,
        },
        new()
        {
            TemplateId = new Guid("b07efcc9-9e99-5721-b682-9a830c0727ce"),
            Code = "E-015",
            SubjectAr = "تأكيد موعد المقابلة",
            SubjectEn = "Interview Scheduled",
            BodyAr = "تم تأكيد موعد مقابلتك. التفاصيل: {{date}} - {{time}}. الرابط: {{actionUrl}}.",
            BodyEn = "Your interview has been scheduled. Details: {{date}} at {{time}}. Link: {{actionUrl}}.",
            Placeholders = "[\"date\", \"time\", \"actionUrl\"]",
            Version = 1,
            Status = TemplateStatuses.Approved,
            UpdatedAt = Seeded,
            UpdatedBy = null,
        },
        new()
        {
            TemplateId = new Guid("f29771f3-12bb-5c09-9280-1ffceb5d8140"),
            Code = "E-016",
            SubjectAr = "إعادة جدولة المقابلة",
            SubjectEn = "Interview Reschedule",
            BodyAr = "تم طلب إعادة جدولة موعد المقابلة. سيتم تزويدك بموعد جديد قريبًا.",
            BodyEn = "A reschedule has been requested for your interview. A new time will be provided shortly.",
            Placeholders = "[]",
            Version = 1,
            Status = TemplateStatuses.Approved,
            UpdatedAt = Seeded,
            UpdatedBy = null,
        },
        new()
        {
            TemplateId = new Guid("54a68362-205a-53f7-bb43-a538db7681fe"),
            Code = "E-017",
            SubjectAr = "تذكير: اختر موعد مقابلتك",
            SubjectEn = "Reminder: Select Your Interview Slot",
            BodyAr = "تذكير: يرجى اختيار موعد مقابلتك قبل انتهاء المهلة.",
            BodyEn = "Reminder: please select your interview slot before the deadline.",
            Placeholders = "[]",
            Version = 1,
            Status = TemplateStatuses.Approved,
            UpdatedAt = Seeded,
            UpdatedBy = null,
        },
        new()
        {
            TemplateId = new Guid("70c88d12-443b-5816-b299-c738d6321339"),
            Code = "E-018",
            SubjectAr = "تذكير بتقديم تقييم المقابلة",
            SubjectEn = "Reminder: Submit Interview Evaluation",
            BodyAr = "يرجى تقديم تقييمك للمقابلة التي حضرتها في أقرب وقت.",
            BodyEn = "Please submit your evaluation for the interview you attended at your earliest convenience.",
            Placeholders = "[]",
            Version = 1,
            Status = TemplateStatuses.Approved,
            UpdatedAt = Seeded,
            UpdatedBy = null,
        },
        new()
        {
            TemplateId = new Guid("1dc65a00-ce01-5ba1-ad64-0b4762dce4d3"),
            Code = "E-019",
            SubjectAr = "نتيجة ما بعد المقابلة",
            SubjectEn = "Post-Interview Decision",
            BodyAr = "نأسف لإبلاغك بأن طلبك لم يُقبل بعد نتيجة المقابلة.",
            BodyEn = "We regret to inform you that your application was not accepted following the interview result. Reason: {{reasonText}}.",
            Placeholders = "[\"reasonText\"]",
            Version = 1,
            Status = TemplateStatuses.Approved,
            UpdatedAt = Seeded,
            UpdatedBy = null,
        },
        new()
        {
            TemplateId = new Guid("f30f2f1d-1031-599f-a6f3-6f923925975d"),
            Code = "E-020",
            SubjectAr = "طلب بانتظار موافقتك",
            SubjectEn = "Application Awaiting Your Approval",
            BodyAr = "يوجد طلب بانتظار موافقتك ضمن لجنة الاعتماد.",
            BodyEn = "An application is awaiting your approval as part of the approval committee.",
            Placeholders = "[]",
            Version = 1,
            Status = TemplateStatuses.Approved,
            UpdatedAt = Seeded,
            UpdatedBy = null,
        },
        new()
        {
            TemplateId = new Guid("fb0cde34-dc2d-5914-9355-7156c13107a9"),
            Code = "E-021",
            SubjectAr = "موافقة مبدئية - مطلوب بيانات بنكية",
            SubjectEn = "Preliminary Approval — Bank Data Required",
            BodyAr = "تهانينا! تمت الموافقة المبدئية على طلبك. يرجى استكمال بياناتك البنكية لإتمام الإجراءات.",
            BodyEn = "Congratulations! Your application has received preliminary approval. Please complete your bank details to proceed.",
            Placeholders = "[]",
            Version = 1,
            Status = TemplateStatuses.Approved,
            UpdatedAt = Seeded,
            UpdatedBy = null,
        },
        new()
        {
            TemplateId = new Guid("43c8d6ee-81a7-516e-8c40-17163be16154"),
            Code = "E-022",
            SubjectAr = "قرار نهائي بالرفض",
            SubjectEn = "Final Rejection Decision",
            BodyAr = "نأسف، تم رفض طلبك نهائيًا من لجنة الاعتماد.",
            BodyEn = "We regret to inform you that your application has been finally rejected by the approval committee. Reason: {{reasonText}}.",
            Placeholders = "[\"reasonText\"]",
            Version = 1,
            Status = TemplateStatuses.Approved,
            UpdatedAt = Seeded,
            UpdatedBy = null,
        },
        new()
        {
            TemplateId = new Guid("7b9a4042-8424-58b7-8198-05020a9f4830"),
            Code = "E-023",
            SubjectAr = "طلب تعديل على الطلب",
            SubjectEn = "Application Modification Requested",
            BodyAr = "تم طلب تعديل على الطلب من أحد أعضاء اللجنة. يرجى مراجعة الملاحظة.",
            BodyEn = "A committee member has requested a modification to the application. Please review the note.",
            Placeholders = "[]",
            Version = 1,
            Status = TemplateStatuses.Approved,
            UpdatedAt = Seeded,
            UpdatedBy = null,
        },
        new()
        {
            TemplateId = new Guid("dd12b23b-36f6-5c55-b2ac-1cb1c8c492a3"),
            Code = "E-024",
            SubjectAr = "اكتملت البيانات البنكية",
            SubjectEn = "Bank Data Completed",
            BodyAr = "أكمل المتقدم بياناته البنكية. يمكنك الآن المتابعة لإعداد الاتفاقية.",
            BodyEn = "The applicant has completed their bank data. You may now proceed with agreement preparation.",
            Placeholders = "[]",
            Version = 1,
            Status = TemplateStatuses.Approved,
            UpdatedAt = Seeded,
            UpdatedBy = null,
        },
        new()
        {
            TemplateId = new Guid("0bcd0f1f-5d70-5dd4-b932-4b2710fd4e5f"),
            Code = "E-025",
            SubjectAr = "جاهز لإعداد الاتفاقية",
            SubjectEn = "Ready for Agreement Preparation",
            BodyAr = "يمكنك الآن البدء في إعداد اتفاقية المتقدم {{trainerName}}.",
            BodyEn = "You may now begin preparing the agreement for applicant {{trainerName}}.",
            Placeholders = "[\"trainerName\"]",
            Version = 1,
            Status = TemplateStatuses.Approved,
            UpdatedAt = Seeded,
            UpdatedBy = null,
        },
        new()
        {
            TemplateId = new Guid("aea0ea17-8723-5ac8-a052-5397fa38089a"),
            Code = "E-026",
            SubjectAr = "اتفاقية بانتظار التوقيع",
            SubjectEn = "Agreement Awaiting Signature",
            BodyAr = "توجد اتفاقية بانتظار مراجعتك أو توقيعك.",
            BodyEn = "An agreement is awaiting your review or signature.",
            Placeholders = "[]",
            Version = 1,
            Status = TemplateStatuses.Approved,
            UpdatedAt = Seeded,
            UpdatedBy = null,
        },
        new()
        {
            TemplateId = new Guid("326639ee-e6b7-5a74-9bec-f9028b0dce78"),
            Code = "E-027",
            SubjectAr = "طلب تعديل على الاتفاقية",
            SubjectEn = "Agreement Modification Requested",
            BodyAr = "تم طلب تعديل على الاتفاقية من أحد الموقّعين الداخليين. يرجى المراجعة.",
            BodyEn = "A modification has been requested on the agreement by an internal signer. Please review.",
            Placeholders = "[]",
            Version = 1,
            Status = TemplateStatuses.Approved,
            UpdatedAt = Seeded,
            UpdatedBy = null,
        },
        new()
        {
            TemplateId = new Guid("1f3d4334-38a6-5a32-8956-20e46503570d"),
            Code = "E-028",
            SubjectAr = "اتفاقيتك جاهزة للتوقيع",
            SubjectEn = "Your Agreement Is Ready to Sign",
            BodyAr = "اتفاقيتك جاهزة للتوقيع. يرجى مراجعتها والتوقيع عليها من بوابتك.",
            BodyEn = "Your agreement is ready for signature. Please review and sign it from your portal.",
            Placeholders = "[]",
            Version = 1,
            Status = TemplateStatuses.Approved,
            UpdatedAt = Seeded,
            UpdatedBy = null,
        },
        new()
        {
            TemplateId = new Guid("093a7ecf-17cf-5256-819f-e8da4c98e21e"),
            Code = "E-029",
            SubjectAr = "طلب تعديل من المتقدم",
            SubjectEn = "Applicant Requested Modification",
            BodyAr = "طلب المتقدم تعديلاً على الاتفاقية. يرجى مراجعة الملاحظة وإعادة التقديم.",
            BodyEn = "The applicant has requested a modification to the agreement. Please review the note and resubmit.",
            Placeholders = "[]",
            Version = 1,
            Status = TemplateStatuses.Approved,
            UpdatedAt = Seeded,
            UpdatedBy = null,
        },
        new()
        {
            TemplateId = new Guid("1594a1ed-6cbb-5a36-b7c9-5ed3ad61b506"),
            Code = "E-030",
            SubjectAr = "تم رفض الاتفاقية",
            SubjectEn = "Agreement Declined",
            BodyAr = "قام المتقدم برفض شروط الاتفاقية. تم إغلاق الطلب نهائيًا.",
            BodyEn = "The applicant has declined the agreement terms. The application has been permanently closed.",
            Placeholders = "[]",
            Version = 1,
            Status = TemplateStatuses.Approved,
            UpdatedAt = Seeded,
            UpdatedBy = null,
        },
        new()
        {
            TemplateId = new Guid("43d4e2f6-4893-57a4-80d0-adad5403f8d5"),
            Code = "E-031",
            SubjectAr = "تم توقيع الاتفاقية",
            SubjectEn = "Agreement Signed & Activated",
            BodyAr = "تهانينا! تم توقيع اتفاقيتك بنجاح وأصبحت مدربًا معتمدًا.",
            BodyEn = "Congratulations! Your agreement has been signed and you are now an approved Trainer.",
            Placeholders = "[]",
            Version = 1,
            Status = TemplateStatuses.Approved,
            UpdatedAt = Seeded,
            UpdatedBy = null,
        },
        new()
        {
            TemplateId = new Guid("4333a775-1fbc-532e-8fc5-629b18189078"),
            Code = "E-032",
            SubjectAr = "تنبيه انتهاء الاتفاقية (90 يومًا)",
            SubjectEn = "Agreement Expiry Alert (90 Days)",
            BodyAr = "تنتهي مدة اتفاقيتك خلال 90 يومًا. يرجى المتابعة مع الأكاديمية عند الحاجة.",
            BodyEn = "Your agreement expires in 90 days. Please follow up with the Academy if needed.",
            Placeholders = "[]",
            Version = 1,
            Status = TemplateStatuses.Approved,
            UpdatedAt = Seeded,
            UpdatedBy = null,
        },
        new()
        {
            TemplateId = new Guid("26945866-4bea-5c7f-876c-5227b80ba7cd"),
            Code = "E-033",
            SubjectAr = "تنبيه انتهاء الاتفاقية (30 يومًا)",
            SubjectEn = "Agreement Expiry Alert (30 Days)",
            BodyAr = "تنتهي مدة اتفاقيتك خلال 30 يومًا. يرجى المتابعة مع الأكاديمية عند الحاجة.",
            BodyEn = "Your agreement expires in 30 days. Please follow up with the Academy if needed.",
            Placeholders = "[]",
            Version = 1,
            Status = TemplateStatuses.Approved,
            UpdatedAt = Seeded,
            UpdatedBy = null,
        },
        new()
        {
            TemplateId = new Guid("9bc73c01-44ea-5ca6-9e10-6d69852ebc4e"),
            Code = "E-034",
            SubjectAr = "تنبيه عاجل: انتهاء الاتفاقية (5 أيام)",
            SubjectEn = "Urgent: Agreement Expiry Alert (5 Days)",
            BodyAr = "تنتهي مدة اتفاقيتك خلال 5 أيام. يرجى المتابعة عند الحاجة مع الأكاديمية.",
            BodyEn = "Your agreement expires in 5 days. Please follow up with the Academy urgently.",
            Placeholders = "[]",
            Version = 1,
            Status = TemplateStatuses.Approved,
            UpdatedAt = Seeded,
            UpdatedBy = null,
        },
        new()
        {
            TemplateId = new Guid("1b7bf85c-74b0-5828-98eb-067ccae9d612"),
            Code = "E-035",
            SubjectAr = "تم تجديد الاتفاقية",
            SubjectEn = "Agreement Renewed",
            BodyAr = "تم تجديد اتفاقيتك لمدة {{agreementDuration}}.",
            BodyEn = "Your agreement has been renewed for {{agreementDuration}}.",
            Placeholders = "[\"agreementDuration\"]",
            Version = 1,
            Status = TemplateStatuses.Approved,
            UpdatedAt = Seeded,
            UpdatedBy = null,
        },
        new()
        {
            TemplateId = new Guid("e490430b-321c-5775-821e-4f1e5aab06c6"),
            Code = "E-036",
            SubjectAr = "تعليق الاتفاقية",
            SubjectEn = "Agreement Suspended",
            BodyAr = "تم تعليق اتفاقيتك من قبل الأكاديمية.",
            BodyEn = "Your agreement has been suspended by the Academy.",
            Placeholders = "[]",
            Version = 1,
            Status = TemplateStatuses.Approved,
            UpdatedAt = Seeded,
            UpdatedBy = null,
        },
        new()
        {
            TemplateId = new Guid("d30f8f56-6c26-5aeb-a284-03ae0cd6edef"),
            Code = "E-037",
            SubjectAr = "إنهاء الاتفاقية",
            SubjectEn = "Agreement Ended",
            BodyAr = "تم إنهاء اتفاقيتك مع الأكاديمية.",
            BodyEn = "Your agreement with the Academy has been ended.",
            Placeholders = "[]",
            Version = 1,
            Status = TemplateStatuses.Approved,
            UpdatedAt = Seeded,
            UpdatedBy = null,
        },
        new()
        {
            TemplateId = new Guid("cdc7ac91-b27d-59e8-bb9a-82a235b5e70a"),
            Code = "E-038",
            SubjectAr = "ملفك كمدرب جاهز",
            SubjectEn = "Your Trainer Profile Is Ready",
            BodyAr = "تم إنشاء ملفك الرسمي كمدرب معتمد. يمكنك استعراضه من بوابتك.",
            BodyEn = "Your official Trainer Profile has been created. You can view it from your portal.",
            Placeholders = "[]",
            Version = 1,
            Status = TemplateStatuses.Approved,
            UpdatedAt = Seeded,
            UpdatedBy = null,
        },
        new()
        {
            TemplateId = new Guid("a0316082-d8e9-5f06-a00c-185cd1d56ac1"),
            Code = "E-039",
            SubjectAr = "مرشحون بانتظار موافقتك",
            SubjectEn = "Candidates Awaiting Your Approval",
            BodyAr = "توجد قائمة مرشحين جاهزة لمراجعتك واعتمادك.",
            BodyEn = "A candidate pool is ready for your review and approval.",
            Placeholders = "[]",
            Version = 1,
            Status = TemplateStatuses.Approved,
            UpdatedAt = Seeded,
            UpdatedBy = null,
        },
        new()
        {
            TemplateId = new Guid("9c0bdb16-05f4-5668-bc86-07dfbb63814b"),
            Code = "E-040",
            SubjectAr = "عرض إسناد جديد",
            SubjectEn = "New Assignment Offer",
            BodyAr = "لديك عرض إسناد جديد. يرجى الرد خلال 3 أيام. التفاصيل: {{actionUrl}}.",
            BodyEn = "You have a new assignment offer. Please respond within 3 days. Details: {{actionUrl}}.",
            Placeholders = "[\"actionUrl\"]",
            Version = 1,
            Status = TemplateStatuses.Approved,
            UpdatedAt = Seeded,
            UpdatedBy = null,
        },
        new()
        {
            TemplateId = new Guid("556cf60c-cf33-5631-b070-a9eecab20652"),
            Code = "E-041",
            SubjectAr = "بانتظار الاعتماد",
            SubjectEn = "Awaiting Approval",
            BodyAr = "تم رفع مادة/محتوى بانتظار اعتمادك.",
            BodyEn = "Material/content has been uploaded and is awaiting your approval.",
            Placeholders = "[]",
            Version = 1,
            Status = TemplateStatuses.Approved,
            UpdatedAt = Seeded,
            UpdatedBy = null,
        },
        new()
        {
            TemplateId = new Guid("4c5f9336-bed6-5e07-91b5-ea1fe55ef0ef"),
            Code = "E-042",
            SubjectAr = "طلب تعديل",
            SubjectEn = "Revision Requested",
            BodyAr = "تم طلب تعديل على المادة/المحتوى المرفوع. يرجى إعادة الرفع.",
            BodyEn = "A revision has been requested for your uploaded material/content. Please re-upload.",
            Placeholders = "[]",
            Version = 1,
            Status = TemplateStatuses.Approved,
            UpdatedAt = Seeded,
            UpdatedBy = null,
        },
        new()
        {
            TemplateId = new Guid("142952ed-a9ce-5af2-bb9f-4643f169c7e0"),
            Code = "E-043",
            SubjectAr = "تم الاعتماد",
            SubjectEn = "Approved",
            BodyAr = "تم اعتماد المادة/المحتوى الذي قمت برفعه.",
            BodyEn = "Your uploaded material/content has been approved.",
            Placeholders = "[]",
            Version = 1,
            Status = TemplateStatuses.Approved,
            UpdatedAt = Seeded,
            UpdatedBy = null,
        },
        new()
        {
            TemplateId = new Guid("9b0cd31c-c124-5db0-ad41-e0cc422a06f4"),
            Code = "E-044",
            SubjectAr = "تغيير موعد البرنامج",
            SubjectEn = "Program Schedule Changed",
            BodyAr = "تم تغيير موعد برنامجك. التفاصيل الجديدة: {{date}} - {{time}}.",
            BodyEn = "Your program's schedule has changed. New details: {{date}} at {{time}}.",
            Placeholders = "[\"date\", \"time\"]",
            Version = 1,
            Status = TemplateStatuses.Approved,
            UpdatedAt = Seeded,
            UpdatedBy = null,
        },
        new()
        {
            TemplateId = new Guid("7abd7606-acd8-5088-9ae4-ae96d31b1be9"),
            Code = "E-046",
            SubjectAr = "إلغاء الارتباط",
            SubjectEn = "Engagement De-linked",
            BodyAr = "تم إلغاء ارتباطك بالبرنامج. السبب: {{reasonText}}.",
            BodyEn = "Your engagement with the program has been de-linked. Reason: {{reasonText}}.",
            Placeholders = "[\"reasonText\"]",
            Version = 1,
            Status = TemplateStatuses.Approved,
            UpdatedAt = Seeded,
            UpdatedBy = null,
        },
        new()
        {
            TemplateId = new Guid("3b667fa6-a011-5469-8441-1baec028540c"),
            Code = "E-047",
            SubjectAr = "إلغاء البرنامج",
            SubjectEn = "Program Cancelled",
            BodyAr = "تم إلغاء البرنامج المرتبط بارتباطك من قبل الأكاديمية. السبب: {{reasonText}}.",
            BodyEn = "The program linked to your engagement has been cancelled by the Academy. Reason: {{reasonText}}.",
            Placeholders = "[\"reasonText\"]",
            Version = 1,
            Status = TemplateStatuses.Approved,
            UpdatedAt = Seeded,
            UpdatedBy = null,
        },
        new()
        {
            TemplateId = new Guid("ae8b6c56-ca5c-5d9e-b522-4614aa47c51a"),
            Code = "E-048",
            SubjectAr = "بدء التفويض",
            SubjectEn = "Delegation Started",
            BodyAr = "بدأ تفويض صلاحية الاعتماد بينك وبين {{counterpartName}}.",
            BodyEn = "Approval delegation has begun between you and {{counterpartName}}.",
            Placeholders = "[\"counterpartName\"]",
            Version = 1,
            Status = TemplateStatuses.Approved,
            UpdatedAt = Seeded,
            UpdatedBy = null,
        },
        new()
        {
            TemplateId = new Guid("22dcf9cb-7627-5897-b880-f1d4bb3052b8"),
            Code = "E-049",
            SubjectAr = "انتهاء التفويض",
            SubjectEn = "Delegation Ended",
            BodyAr = "انتهى تفويض صلاحية الاعتماد بينك وبين {{counterpartName}}.",
            BodyEn = "Approval delegation between you and {{counterpartName}} has ended.",
            Placeholders = "[\"counterpartName\"]",
            Version = 1,
            Status = TemplateStatuses.Approved,
            UpdatedAt = Seeded,
            UpdatedBy = null,
        },
        new()
        {
            TemplateId = new Guid("73ba0ad2-3de2-5d2f-9f41-c6c4a8c74283"),
            Code = "E-050",
            SubjectAr = "تحديث الصلاحيات",
            SubjectEn = "Role & Permissions Updated",
            BodyAr = "تم تحديث دورك وصلاحياتك على المنصة.",
            BodyEn = "Your role and permissions on the platform have been updated.",
            Placeholders = "[]",
            Version = 1,
            Status = TemplateStatuses.Approved,
            UpdatedAt = Seeded,
            UpdatedBy = null,
        },
        new()
        {
            TemplateId = new Guid("b577d872-ff0e-506c-ac39-757ebc0f4289"),
            Code = "E-051",
            SubjectAr = "تنبيه أمان الحساب",
            SubjectEn = "Account Security Notice",
            BodyAr = "تم رصد نشاط أمني على حسابك (مثل إعادة تعيين كلمة المرور). إذا لم تقم بذلك، يرجى التواصل فورًا.",
            BodyEn = "A security-related activity was detected on your account (e.g. password reset). If this wasn't you, please contact us immediately.",
            Placeholders = "[]",
            Version = 1,
            Status = TemplateStatuses.Approved,
            UpdatedAt = Seeded,
            UpdatedBy = null,
        },
        new()
        {
            TemplateId = new Guid("5e471bb8-892e-59fd-9a2c-7a1899948bb7"),
            Code = "E-052",
            SubjectAr = "برنامجك القادم يقترب",
            SubjectEn = "Your Upcoming Session Is Coming Up",
            BodyAr = "مرحبًا {{recipientName}}، برنامجك القادم يقترب! نتمنى لك تجربة تدريبية ملهمة. التفاصيل: {{date}} - {{time}}.",
            BodyEn = "Hi {{recipientName}}, your upcoming program is just around the corner! We wish you an inspiring session. Details: {{date}} at {{time}}.",
            Placeholders = "[\"recipientName\", \"date\", \"time\"]",
            Version = 1,
            Status = TemplateStatuses.Approved,
            UpdatedAt = Seeded,
            UpdatedBy = null,
        },
        new()
        {
            TemplateId = new Guid("7a511e05-b62f-57a9-9b12-e1987dca47e2"),
            Code = "E-053",
            SubjectAr = "شكرًا لك على جهودك!",
            SubjectEn = "Thank You for a Great Session",
            BodyAr = "شكرًا لك {{recipientName}} على جهدك وعطائك في هذا البرنامج! أثرك في المتدربين لا يُقدر بثمن، ونتطلع للعمل معك مجددًا قريبًا.",
            BodyEn = "Thank you, {{recipientName}}, for your dedication in this program! The impact you make on trainees is invaluable, and we look forward to working with you again soon.",
            Placeholders = "[\"recipientName\"]",
            Version = 1,
            Status = TemplateStatuses.Approved,
            UpdatedAt = Seeded,
            UpdatedBy = null,
        },
        new()
        {
            TemplateId = new Guid("9ddbc393-f773-5862-aab8-d94d28a5e280"),
            Code = "E-054",
            SubjectAr = "تم صرف مستحقاتك المالية",
            SubjectEn = "Your Payment Has Been Processed",
            BodyAr = "أخبار سارة {{recipientName}}! تم صرف مستحقاتك المالية عن برنامج {{programName}}. شكرًا لتميّزك المستمر معنا.",
            BodyEn = "Good news, {{recipientName}}! Your payment for {{programName}} has been processed. Thank you for your continued excellence with us.",
            Placeholders = "[\"recipientName\", \"programName\"]",
            Version = 1,
            Status = TemplateStatuses.Approved,
            UpdatedAt = Seeded,
            UpdatedBy = null,
        },
        new()
        {
            TemplateId = new Guid("5129d61e-1487-5909-99c5-913f8a1ad7e2"),
            Code = "E-055",
            SubjectAr = "تحديث بخصوص مستحقاتك المالية",
            SubjectEn = "An Update on Your Payment",
            BodyAr = "مرحبًا {{recipientName}}، نود إعلامك بوجود تأخير بسيط في صرف مستحقاتك، وفريقنا يعمل على حله في أقرب وقت. نعتذر عن أي إزعاج.",
            BodyEn = "Hi {{recipientName}}, we want to let you know there's a short delay in processing your payment, and our team is actively working to resolve it. We apologize for any inconvenience.",
            Placeholders = "[\"recipientName\"]",
            Version = 1,
            Status = TemplateStatuses.Approved,
            UpdatedAt = Seeded,
            UpdatedBy = null,
        },
        new()
        {
            TemplateId = new Guid("df8f3358-16ed-5f99-836b-1f294a7065ab"),
            Code = "E-056",
            SubjectAr = "تقييمات رائعة بانتظارك!",
            SubjectEn = "Great Feedback Is Waiting for You",
            BodyAr = "مرحبًا {{recipientName}}، حصلت على تقييمات رائعة من متدربيك في برنامجك الأخير! نفخر بك ونشكرك على تميزك.",
            BodyEn = "Hi {{recipientName}}, you received wonderful feedback from your trainees in your latest program! We're proud of you and thank you for your excellence.",
            Placeholders = "[\"recipientName\"]",
            Version = 1,
            Status = TemplateStatuses.Approved,
            UpdatedAt = Seeded,
            UpdatedBy = null,
        },
        new()
        {
            TemplateId = new Guid("d058f110-37af-5101-9628-764eb9e1287a"),
            Code = "E-059",
            SubjectAr = "فرص جديدة تناسب تخصصك",
            SubjectEn = "New Opportunities Matching Your Specialty",
            BodyAr = "مرحبًا {{recipientName}}، توجد فرص تدريبية جديدة تناسب تخصصك! اطّلع عليها",
            BodyEn = "Hi {{recipientName}}, new training opportunities matching your specialty are available! Take a look now and be among the first to apply.",
            Placeholders = "[\"recipientName\"]",
            Version = 1,
            Status = TemplateStatuses.Approved,
            UpdatedAt = Seeded,
            UpdatedBy = null,
        },
        new()
        {
            TemplateId = new Guid("576bcbe3-7cc1-5a02-90df-2c94d00989f6"),
            Code = "E-061",
            SubjectAr = "أكمل ملفك الشخصي",
            SubjectEn = "Complete Your Profile",
            BodyAr = "مرحبًا {{recipientName}}، أكمل ملفك الشخصي (الصورة، الروابط المهنية) ليصل إلى فرص أكثر وليعكس حضورك المهني بأفضل شكل.",
            BodyEn = "Hi {{recipientName}}, complete your profile (photo, professional links) so it reaches more opportunities and reflects your professional presence at its best.",
            Placeholders = "[\"recipientName\"]",
            Version = 1,
            Status = TemplateStatuses.Approved,
            UpdatedAt = Seeded,
            UpdatedBy = null,
        },
        new()
        {
            TemplateId = new Guid("212c220d-7e82-5489-87f6-ee88b51b890a"),
            Code = "E-062",
            SubjectAr = "زد من ظهورك المهني",
            SubjectEn = "Boost Your Professional Visibility",
            BodyAr = "مرحبًا {{recipientName}}، هل تعلم أن ظهورك في الدليل العام للمدربين يزيد من فرص التعرف عليك؟ فعّل الظهور العام من إعداداتك متى ناسبك ذلك.",
            BodyEn = "Hi {{recipientName}}, did you know appearing in our public trainer directory increases your visibility? Turn on public visibility from your settings whenever it suits you.",
            Placeholders = "[\"recipientName\"]",
            Version = 1,
            Status = TemplateStatuses.Approved,
            UpdatedAt = Seeded,
            UpdatedBy = null,
        },
        new()
        {
            TemplateId = new Guid("6f0835f5-f4ac-5e9a-81bf-c722402eceaf"),
            Code = "E-063",
            SubjectAr = "عامك الأول معنا!",
            SubjectEn = "Happy Trainer Anniversary!",
            BodyAr = "مبروك {{recipientName}}! 🎂 اليوم يصادف مرور عام على انضمامك إلينا كمدرب معتمد. شكرًا لك على رحلتك الملهمة معنا.",
            BodyEn = "Congratulations, {{recipientName}}! 🎂 Today marks one year since you joined us as an approved Trainer. Thank you for an inspiring journey with us.",
            Placeholders = "[\"recipientName\"]",
            Version = 1,
            Status = TemplateStatuses.Approved,
            UpdatedAt = Seeded,
            UpdatedBy = null,
        },
        new()
        {
            TemplateId = new Guid("dddfd5e0-6eec-524f-bb1d-5a6d5e7313e4"),
            Code = "E-065",
            SubjectAr = "مقابلتك غدًا",
            SubjectEn = "Your Interview Is Tomorrow",
            BodyAr = "مرحبًا {{recipientName}}، تذكير: مقابلتك غدًا الساعة {{time}}. نتمنى لك التوفيق ونتطلع للقائك!",
            BodyEn = "Hi {{recipientName}}, reminder: your interview is tomorrow at {{time}}. We wish you the best and look forward to meeting you!",
            Placeholders = "[\"recipientName\", \"time\"]",
            Version = 1,
            Status = TemplateStatuses.Approved,
            UpdatedAt = Seeded,
            UpdatedBy = null,
        },
        new()
        {
            TemplateId = new Guid("6eef4954-5355-5841-b8e4-700b4c153030"),
            Code = "E-066",
            SubjectAr = "تذكير: ارفع مادتك التدريبية",
            SubjectEn = "Reminder — Upload Your Training Material",
            BodyAr = "مرحبًا {{recipientName}}، يقترب موعد برنامجك ولم يتم رفع المادة التدريبية بعد. يرجى رفعها في أقرب وقت لضمان جاهزية تامة.",
            BodyEn = "Hi {{recipientName}}, your program date is approaching and the training material hasn't been uploaded yet. Please upload it soon to be fully ready.",
            Placeholders = "[\"recipientName\"]",
            Version = 1,
            Status = TemplateStatuses.Approved,
            UpdatedAt = Seeded,
            UpdatedBy = null,
        },
        new()
        {
            TemplateId = new Guid("371b0d7a-4008-5855-b7b2-9108d17e98be"),
            Code = "E-067",
            SubjectAr = "شكرًا لمشاركتك المميزة",
            SubjectEn = "Thank You for a Great Session",
            BodyAr = "شكرًا لك {{recipientName}} على مشاركتك المميزة كمتحدث! أضفت قيمة حقيقية لحضورنا، ونتطلع لدعوتك مجددًا.",
            BodyEn = "Thank you, {{recipientName}}, for your outstanding participation as a speaker! You added real value for our audience, and we look forward to inviting you again.",
            Placeholders = "[\"recipientName\"]",
            Version = 1,
            Status = TemplateStatuses.Approved,
            UpdatedAt = Seeded,
            UpdatedBy = null,
        },
        new()
        {
            TemplateId = new Guid("57bbc3bb-00af-51b1-976a-baa0408e038b"),
            Code = "E-068",
            SubjectAr = "نصائح لبداية موفقة",
            SubjectEn = "Tips to Get You Started",
            BodyAr = "مرحبًا {{recipientName}}، إليك بعض النصائح لتبدأ رحلتك معنا بأفضل شكل: أكمل ملفك، استكشف بوابتك، وترقّب أول فرصة تدريبية قريبًا!",
            BodyEn = "Hi {{recipientName}}, here are a few tips to get the most out of your journey with us: complete your profile, explore your portal, and watch for your first opportunity soon!",
            Placeholders = "[\"recipientName\"]",
            Version = 1,
            Status = TemplateStatuses.Approved,
            UpdatedAt = Seeded,
            UpdatedBy = null,
        },
        new()
        {
            TemplateId = new Guid("8dfad49a-38da-56a0-a446-e1fd320663bd"),
            Code = "E-070",
            SubjectAr = "حان وقت مراجعة ملفك",
            SubjectEn = "Time for Your Annual Profile Check-Up",
            BodyAr = "مرحبًا {{recipientName}}، حان وقت مراجعة ملفك الشخصي! تأكد من تحديث بياناتك وخبراتك لتبقى دائمًا في أفضل صورة أمام الفرص القادمة.",
            BodyEn = "Hi {{recipientName}}, it's time for your annual profile check-up! Make sure your information and experience are up to date so you always put your best foot forward.",
            Placeholders = "[\"recipientName\"]",
            Version = 1,
            Status = TemplateStatuses.Approved,
            UpdatedAt = Seeded,
            UpdatedBy = null,
        },
        new()
        {
            TemplateId = new Guid("4fb9561d-f56a-58fc-a7a3-757904cba23b"),
            Code = "E-071",
            SubjectAr = "تم استلام اعتذارك",
            SubjectEn = "We've Received Your Withdrawal",
            BodyAr = "مرحبًا {{recipientName}}، تم استلام اعتذارك عن هذا الارتباط. نتفهم ظروفك تمامًا، ونتطلع للعمل معك في فرصة قادمة قريبًا.",
            BodyEn = "Hi {{recipientName}}, we've received your withdrawal from this engagement. We completely understand, and we look forward to working with you on a future opportunity soon.",
            Placeholders = "[\"recipientName\"]",
            Version = 1,
            Status = TemplateStatuses.Approved,
            UpdatedAt = Seeded,
            UpdatedBy = null,
        },
        new()
        {
            TemplateId = new Guid("f8d905c7-70f2-583a-bf36-9eb01696ba61"),
            Code = "E-072",
            SubjectAr = "قرار مطلوب: نتيجة المقابلة جاهزة",
            SubjectEn = "Action Needed — Interview Result Ready",
            BodyAr = "مرحبًا {{recipientName}}، اكتملت نتيجة المقابلة للطلب {{referenceNumber}}. يرجى اتخاذ القرار: تحويل الطلب إلى لجنة الاعتماد أو رفضه.",
            BodyEn = "Hi {{recipientName}}, the interview result for application {{referenceNumber}} is finalized. Please decide: forward to the approval committee or reject.",
            Placeholders = "[\"recipientName\", \"referenceNumber\"]",
            Version = 1,
            Status = TemplateStatuses.Approved,
            UpdatedAt = Seeded,
            UpdatedBy = null,
        },
        new()
        {
            TemplateId = new Guid("7ab9ee6e-dbb9-57a0-af2b-9612d36a894c"),
            Code = "E-073",
            SubjectAr = "تذكير: أكمل بياناتك البنكية",
            SubjectEn = "Reminder — Complete Your Bank Details",
            BodyAr = "مرحبًا {{recipientName}}، لا تزال بياناتك البنكية غير مكتملة. أكملها الآن لإتمام إجراءات اعتمادك دون تأخير.",
            BodyEn = "Hi {{recipientName}}, your bank details are still incomplete. Please complete them now so we can finalize your approval without delay.",
            Placeholders = "[\"recipientName\"]",
            Version = 1,
            Status = TemplateStatuses.Approved,
            UpdatedAt = Seeded,
            UpdatedBy = null,
        },
        new()
        {
            TemplateId = new Guid("86d43258-4aeb-5fef-a566-fc0456fbf421"),
            Code = "E-074",
            SubjectAr = "تذكير: اتفاقيتك بانتظار التوقيع",
            SubjectEn = "Reminder — Your Agreement Awaits Signature",
            BodyAr = "مرحبًا {{recipientName}}، اتفاقيتك لا تزال بانتظار توقيعك. راجعها ووقّعها الآن لإتمام انضمامك.",
            BodyEn = "Hi {{recipientName}}, your agreement is still awaiting your signature. Review and sign it now to complete your onboarding.",
            Placeholders = "[\"recipientName\"]",
            Version = 1,
            Status = TemplateStatuses.Approved,
            UpdatedAt = Seeded,
            UpdatedBy = null,
        },
        new()
        {
            TemplateId = new Guid("6eb29e81-a0d2-509e-86f2-6b326a510f59"),
            Code = "E-075",
            SubjectAr = "تذكير: عرضك على وشك الانتهاء",
            SubjectEn = "Reminder — Your Offer Is Expiring Soon",
            BodyAr = "مرحبًا {{recipientName}}، عرض الإسناد الخاص بك سينتهي قريبًا. يرجى الرد قبل انتهاء المهلة حتى لا تفوتك الفرصة.",
            BodyEn = "Hi {{recipientName}}, your assignment offer is expiring soon. Please respond before the deadline so you don't miss this opportunity.",
            Placeholders = "[\"recipientName\"]",
            Version = 1,
            Status = TemplateStatuses.Approved,
            UpdatedAt = Seeded,
            UpdatedBy = null,
        },
        new()
        {
            TemplateId = new Guid("f47aef8a-5d65-5887-a8b9-e00f86ed6a7f"),
            Code = "E-076",
            SubjectAr = "مطلوب: ارفع مادتك التدريبية",
            SubjectEn = "Action Needed — Upload Your Training Material",
            BodyAr = "مرحبًا {{recipientName}}، برنامجك لا يحتوي على مادة تدريبية جاهزة. يمكنك الآن رفع موادك الخاصة من بوابتك.",
            BodyEn = "Hi {{recipientName}}, your program doesn't have ready-made training material. You can now upload your own material from your portal.",
            Placeholders = "[\"recipientName\"]",
            Version = 1,
            Status = TemplateStatuses.Approved,
            UpdatedAt = Seeded,
            UpdatedBy = null,
        },
        new()
        {
            TemplateId = new Guid("075db772-27e7-5cf7-91ae-321db671f3fe"),
            Code = "E-077",
            SubjectAr = "مطلوب: ارفع محتواك",
            SubjectEn = "Action Needed — Upload Your Content",
            BodyAr = "مرحبًا {{recipientName}}، تم تأكيد ارتباطك. يمكنك الآن رفع المحتوى المطلوب من بوابتك.",
            BodyEn = "Hi {{recipientName}}, your engagement is confirmed. You can now upload the required content from your portal.",
            Placeholders = "[\"recipientName\"]",
            Version = 1,
            Status = TemplateStatuses.Approved,
            UpdatedAt = Seeded,
            UpdatedBy = null,
        },
    ];

    /// <summary>The routing: which event sends which template to whom.</summary>
    internal static readonly NotificationMatrixRow[] Rows =
    [
        new() { RowId = new Guid("8f29f84a-1645-5968-8f79-ae210ca5be6a"), EventCode = "EV-0101", TemplateId = new Guid("e4d0fe0b-4271-5594-b11a-d2b419ae6b86"), Audience = "[\"record_subject\"]", IsActive = true }, // E-001
        new() { RowId = new Guid("31b9f4e1-eba4-5ba8-a996-54782433eb03"), EventCode = "EV-0102", TemplateId = new Guid("bb63a843-937d-5055-a644-6645da542cee"), Audience = "[\"record_subject\"]", IsActive = true }, // E-004
        new() { RowId = new Guid("0d77184b-aef5-56a8-95b0-4d9a8da2a576"), EventCode = "EV-0103", TemplateId = new Guid("4eca8e8b-610c-52a9-9b63-6e01bcc1d714"), Audience = "[\"record_subject\"]", IsActive = true }, // E-007
        new() { RowId = new Guid("738a10a3-4d52-5cdc-808c-fb9c0aa558ef"), EventCode = "EV-0104", TemplateId = new Guid("672b3c7e-b33e-5889-97b8-6d50d99a6f06"), Audience = "[\"record_subject\"]", IsActive = true }, // E-008
        new() { RowId = new Guid("db08c4ec-2d34-5c9b-a1d7-b98c6a42a1d1"), EventCode = "EV-0105", TemplateId = new Guid("1d25b574-17bb-563d-b12c-2d4481039c2b"), Audience = "[\"staff\"]", IsActive = true }, // E-006
        new() { RowId = new Guid("9e293a02-71da-5e5d-8f90-2bcd11a12bea"), EventCode = "EV-0201", TemplateId = new Guid("00d2c697-9895-5d6e-96a0-9d715b2412be"), Audience = "[\"record_subject\"]", IsActive = true }, // E-014
        new() { RowId = new Guid("d274b255-2999-59ba-9cdd-70265a0ec772"), EventCode = "EV-0203", TemplateId = new Guid("b07efcc9-9e99-5721-b682-9a830c0727ce"), Audience = "[\"record_subject\"]", IsActive = true }, // E-015
        new() { RowId = new Guid("a1949b0e-f245-586f-952a-9b8bbf82880c"), EventCode = "EV-0204", TemplateId = new Guid("1f3d4334-38a6-5a32-8956-20e46503570d"), Audience = "[\"record_subject\"]", IsActive = true }, // E-028
        new() { RowId = new Guid("5067d5ca-c8b6-51c6-9b88-06fa97acf1c4"), EventCode = "EV-0205", TemplateId = new Guid("b2304dc0-5083-5102-af18-cc4b36d7770d"), Audience = "[\"record_subject\"]", IsActive = true }, // E-011
        new() { RowId = new Guid("78308114-e1ee-53b8-bdb3-3218654c51e5"), EventCode = "EV-0206", TemplateId = new Guid("5456128c-7bcc-5987-b6cd-bcd5992122b7"), Audience = "[\"record_subject\"]", IsActive = true }, // E-012
        new() { RowId = new Guid("0a843f90-d8a8-5887-9ada-5cf020fbb88b"), EventCode = "EV-0207", TemplateId = new Guid("ffe3ca70-3346-5811-8a6b-5148156cedc7"), Audience = "[\"record_subject\"]", IsActive = true }, // E-013
        new() { RowId = new Guid("39a27893-ff88-559e-919b-78ec37397a60"), EventCode = "EV-0208", TemplateId = new Guid("f29771f3-12bb-5c09-9280-1ffceb5d8140"), Audience = "[\"acting_staff\"]", IsActive = true }, // E-016
        new() { RowId = new Guid("3a3a203b-8356-5ee0-8a7c-b566a405f196"), EventCode = "EV-0210", TemplateId = new Guid("1dc65a00-ce01-5ba1-ad64-0b4762dce4d3"), Audience = "[\"record_subject\"]", IsActive = true }, // E-019
        new() { RowId = new Guid("10f47da5-9d2d-54ec-82f2-f5350db9eef2"), EventCode = "EV-0211", TemplateId = new Guid("f30f2f1d-1031-599f-a6f3-6f923925975d"), Audience = "[\"acting_staff\"]", IsActive = true }, // E-020
        new() { RowId = new Guid("cf167440-e7f2-509f-bb1a-c56d45c3749f"), EventCode = "EV-0212", TemplateId = new Guid("fb0cde34-dc2d-5914-9355-7156c13107a9"), Audience = "[\"record_subject\"]", IsActive = true }, // E-021
        new() { RowId = new Guid("2eacd1c4-874a-593c-907f-2be85904cb4b"), EventCode = "EV-0213", TemplateId = new Guid("43c8d6ee-81a7-516e-8c40-17163be16154"), Audience = "[\"record_subject\"]", IsActive = true }, // E-022
        new() { RowId = new Guid("776798e3-942f-58e4-82e7-22b49c2654a0"), EventCode = "EV-0214", TemplateId = new Guid("7b9a4042-8424-58b7-8198-05020a9f4830"), Audience = "[\"acting_staff\"]", IsActive = true }, // E-023
        new() { RowId = new Guid("418b0fa4-54e8-51bc-8a28-04a15d11ea88"), EventCode = "EV-0215", TemplateId = new Guid("dd12b23b-36f6-5c55-b2ac-1cb1c8c492a3"), Audience = "[\"acting_staff\"]", IsActive = true }, // E-024
        new() { RowId = new Guid("de2b416e-36f3-5f07-9dbb-2b3e20d7020e"), EventCode = "EV-0217", TemplateId = new Guid("f8d905c7-70f2-583a-bf36-9eb01696ba61"), Audience = "[\"acting_staff\"]", IsActive = true }, // E-072
        new() { RowId = new Guid("74fe9f94-2e44-59b3-9000-3f4e6cc5962e"), EventCode = "EV-0301", TemplateId = new Guid("4333a775-1fbc-532e-8fc5-629b18189078"), Audience = "[\"record_subject\", \"staff\"]", IsActive = true }, // E-032
        new() { RowId = new Guid("d22d344b-0b4c-51c3-9d09-e3263c0f2477"), EventCode = "EV-0302", TemplateId = new Guid("26945866-4bea-5c7f-876c-5227b80ba7cd"), Audience = "[\"record_subject\", \"staff\"]", IsActive = true }, // E-033
        new() { RowId = new Guid("b7a66f28-134a-5bac-8fb3-474fd3c314de"), EventCode = "EV-0303", TemplateId = new Guid("9bc73c01-44ea-5ca6-9e10-6d69852ebc4e"), Audience = "[\"record_subject\", \"staff\"]", IsActive = true }, // E-034
        new() { RowId = new Guid("b53bda75-ec56-56e8-9620-1e0b2e338543"), EventCode = "EV-0304", TemplateId = new Guid("1b7bf85c-74b0-5828-98eb-067ccae9d612"), Audience = "[\"record_subject\"]", IsActive = true }, // E-035
        new() { RowId = new Guid("f360943e-72e9-5149-9866-e5a050c20219"), EventCode = "EV-0305", TemplateId = new Guid("0bcd0f1f-5d70-5dd4-b932-4b2710fd4e5f"), Audience = "[\"acting_staff\"]", IsActive = true }, // E-025
        new() { RowId = new Guid("9bfcee11-5c7a-5688-a6e8-dee7ed0ac5ff"), EventCode = "EV-0306", TemplateId = new Guid("aea0ea17-8723-5ac8-a052-5397fa38089a"), Audience = "[\"acting_staff\"]", IsActive = true }, // E-026
        new() { RowId = new Guid("cd1b5a1d-7c2d-5b38-ade9-11f2d7853af6"), EventCode = "EV-0307", TemplateId = new Guid("326639ee-e6b7-5a74-9bec-f9028b0dce78"), Audience = "[\"acting_staff\"]", IsActive = true }, // E-027
        new() { RowId = new Guid("9cdf3841-82a8-5d3b-8159-4d7481dee044"), EventCode = "EV-0308", TemplateId = new Guid("093a7ecf-17cf-5256-819f-e8da4c98e21e"), Audience = "[\"acting_staff\"]", IsActive = true }, // E-029
        new() { RowId = new Guid("cf3262b1-abb3-5f58-bc0a-8ff0ea8fcea9"), EventCode = "EV-0309", TemplateId = new Guid("1594a1ed-6cbb-5a36-b7c9-5ed3ad61b506"), Audience = "[\"acting_staff\"]", IsActive = true }, // E-030
        new() { RowId = new Guid("299f08fd-a919-5bc3-ac01-30580db54b5e"), EventCode = "EV-0310", TemplateId = new Guid("43d4e2f6-4893-57a4-80d0-adad5403f8d5"), Audience = "[\"record_subject\"]", IsActive = true }, // E-031
        new() { RowId = new Guid("6cd078ad-1bd8-5d84-9e62-4c889c2eb280"), EventCode = "EV-0311", TemplateId = new Guid("e490430b-321c-5775-821e-4f1e5aab06c6"), Audience = "[\"record_subject\"]", IsActive = true }, // E-036
        new() { RowId = new Guid("5edb944c-13b1-5d0a-9ab0-94bf77017cde"), EventCode = "EV-0312", TemplateId = new Guid("d30f8f56-6c26-5aeb-a284-03ae0cd6edef"), Audience = "[\"record_subject\"]", IsActive = true }, // E-037
        new() { RowId = new Guid("acde5dec-3744-5bfd-a0ab-638b06dc09ea"), EventCode = "EV-0401", TemplateId = new Guid("cdc7ac91-b27d-59e8-bb9a-82a235b5e70a"), Audience = "[\"record_subject\"]", IsActive = true }, // E-038
        new() { RowId = new Guid("8248304e-b933-5085-beaf-c2f5103e6495"), EventCode = "EV-0501", TemplateId = new Guid("9c0bdb16-05f4-5668-bc86-07dfbb63814b"), Audience = "[\"record_subject\"]", IsActive = true }, // E-040
        new() { RowId = new Guid("5d8d43e3-d094-5467-9554-fc1de5b74fdf"), EventCode = "EV-0505", TemplateId = new Guid("9b0cd31c-c124-5db0-ad41-e0cc422a06f4"), Audience = "[\"record_subject\"]", IsActive = true }, // E-044
        new() { RowId = new Guid("bb7fee8c-ca22-5a31-bca1-d5f34fece5c8"), EventCode = "EV-0507", TemplateId = new Guid("7abd7606-acd8-5088-9ae4-ae96d31b1be9"), Audience = "[\"record_subject\"]", IsActive = true }, // E-046
        new() { RowId = new Guid("0d7d080c-f093-5de2-87ce-204327eef050"), EventCode = "EV-0508", TemplateId = new Guid("3b667fa6-a011-5469-8441-1baec028540c"), Audience = "[\"record_subject\"]", IsActive = true }, // E-047
        new() { RowId = new Guid("a050a977-c44b-5495-b15e-9ad10eaa32df"), EventCode = "EV-0509", TemplateId = new Guid("a0316082-d8e9-5f06-a00c-185cd1d56ac1"), Audience = "[\"acting_staff\"]", IsActive = true }, // E-039
        new() { RowId = new Guid("e1289ace-8dff-528f-b7da-42b20d41f505"), EventCode = "EV-0510", TemplateId = new Guid("556cf60c-cf33-5631-b070-a9eecab20652"), Audience = "[\"acting_staff\"]", IsActive = true }, // E-041
        new() { RowId = new Guid("36114fab-26d0-5813-96e1-8a62c85423d6"), EventCode = "EV-0511", TemplateId = new Guid("4c5f9336-bed6-5e07-91b5-ea1fe55ef0ef"), Audience = "[\"record_subject\"]", IsActive = true }, // E-042
        new() { RowId = new Guid("d446f3d5-3448-587e-8b8e-4c613844c866"), EventCode = "EV-0512", TemplateId = new Guid("142952ed-a9ce-5af2-bb9f-4643f169c7e0"), Audience = "[\"record_subject\"]", IsActive = true }, // E-043
        new() { RowId = new Guid("672c4ca1-57c1-544b-aed8-76567c0fee8f"), EventCode = "EV-0513", TemplateId = new Guid("4fb9561d-f56a-58fc-a7a3-757904cba23b"), Audience = "[\"record_subject\"]", IsActive = true }, // E-071
        new() { RowId = new Guid("7e03f3ae-ee91-5c55-81ba-77c8c40c6f92"), EventCode = "EV-0515", TemplateId = new Guid("f47aef8a-5d65-5887-a8b9-e00f86ed6a7f"), Audience = "[\"record_subject\"]", IsActive = true }, // E-076
        new() { RowId = new Guid("f2583c08-9da1-5f3c-8de7-2e575ed9fd5f"), EventCode = "EV-0516", TemplateId = new Guid("075db772-27e7-5cf7-91ae-321db671f3fe"), Audience = "[\"record_subject\"]", IsActive = true }, // E-077
        new() { RowId = new Guid("50648be2-cdb2-558d-b0f5-73f675258af9"), EventCode = "EV-0801", TemplateId = new Guid("73ba0ad2-3de2-5d2f-9f41-c6c4a8c74283"), Audience = "[\"record_subject\"]", IsActive = true }, // E-050
    ];
}
