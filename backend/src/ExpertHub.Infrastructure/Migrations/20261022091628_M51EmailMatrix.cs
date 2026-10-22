using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace ExpertHub.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class M51EmailMatrix : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<Guid>(
                name: "updated_by",
                table: "NOTIFICATION_TEMPLATE",
                type: "uniqueidentifier",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier");

            migrationBuilder.InsertData(
                table: "NOTIFICATION_EVENT",
                columns: new[] { "event_code", "capability_code", "journey_audience_ar", "journey_audience_en", "name_ar", "name_en", "source" },
                values: new object[,]
                {
                    { "EV-0105", "CAP-01", "موظفو إدارة المدربين.", "Trainer management staff.", "طلب إضافة خدمة بانتظار المراجعة", "Add-service request awaiting review", "Email matrix E-006 (J-03)" },
                    { "EV-0205", "CAP-02", "المتقدم.", "The applicant.", "قبول الطلب في الفرز", "Application accepted at screening", "Email matrix E-011 (J-05)" },
                    { "EV-0206", "CAP-02", "المتقدم.", "The applicant.", "قبول جزئي للطلب في الفرز", "Application partly accepted at screening", "Email matrix E-012 (J-05)" },
                    { "EV-0207", "CAP-02", "المتقدم.", "The applicant.", "رفض الطلب في الفرز", "Application rejected at screening", "Email matrix E-013 (J-05)" },
                    { "EV-0208", "CAP-02", "صاحب قرار الفرز.", "The screening decision-maker.", "طلب المتقدم إعادة جدولة المقابلة", "Applicant asked to reschedule the interview", "Email matrix E-016 (J-06/F4)" },
                    { "EV-0210", "CAP-02", "المتقدم.", "The applicant.", "رفض الطلب بعد المقابلة", "Application rejected after the interview", "Email matrix E-019 (J-07)" },
                    { "EV-0211", "CAP-02", "عضو اللجنة الذي حان دوره.", "The committee member whose turn it is.", "طلب بانتظار موافقة عضو اللجنة", "Application awaiting a committee member", "Email matrix E-020 (J-09)" },
                    { "EV-0212", "CAP-02", "المتقدم.", "The applicant.", "الموافقة المبدئية — مطلوب بيانات بنكية", "Preliminary approval — bank data required", "Email matrix E-021 (J-09)" },
                    { "EV-0213", "CAP-02", "المتقدم.", "The applicant.", "رفض نهائي من لجنة الاعتماد", "Final rejection by the approval committee", "Email matrix E-022 (J-09)" },
                    { "EV-0214", "CAP-02", "منشئ تسلسل اللجنة.", "Whoever formed the committee sequence.", "طلب تعديل من عضو اللجنة", "Committee member requested a modification", "Email matrix E-023 (J-09)" },
                    { "EV-0215", "CAP-02", "منشئ تسلسل اللجنة.", "Whoever formed the committee sequence.", "اكتمال البيانات البنكية", "Bank data completed", "Email matrix E-024 (J-09/F6)" },
                    { "EV-0217", "CAP-02", "صاحب قرار الفرز.", "The screening decision-maker.", "نتيجة المقابلة جاهزة للقرار", "Interview result ready for a decision", "Email matrix E-072 (J-07)" },
                    { "EV-0305", "CAP-03", "منشئ تسلسل اللجنة.", "Whoever formed the committee sequence.", "جاهز لإعداد الاتفاقية", "Ready for agreement preparation", "Email matrix E-025 (J-10)" },
                    { "EV-0306", "CAP-03", "الموقّع الذي حان دوره.", "The signer whose turn it is.", "اتفاقية بانتظار توقيع داخلي", "Agreement awaiting an internal signer", "Email matrix E-026 (J-10)" },
                    { "EV-0307", "CAP-03", "منشئ تسلسل التوقيع.", "Whoever formed the signing sequence.", "طلب تعديل من موقّع داخلي", "Internal signer requested a modification", "Email matrix E-027 (J-10)" },
                    { "EV-0308", "CAP-03", "معدّ الاتفاقية.", "The agreement's preparer.", "طلب المتقدم تعديل الاتفاقية", "Applicant requested an agreement modification", "Email matrix E-029 (J-11)" },
                    { "EV-0309", "CAP-03", "معدّ الاتفاقية.", "The agreement's preparer.", "رفض المتقدم الاتفاقية", "Applicant declined the agreement", "Email matrix E-030 (J-11)" },
                    { "EV-0310", "CAP-03", "المدرب.", "The trainer.", "توقيع الاتفاقية وتفعيلها", "Agreement signed and activated", "Email matrix E-031 (J-11)" },
                    { "EV-0311", "CAP-03", "المدرب.", "The trainer.", "تعليق الاتفاقية", "Agreement suspended", "Email matrix E-036 (J-12)" },
                    { "EV-0312", "CAP-03", "المدرب.", "The trainer.", "إنهاء الاتفاقية", "Agreement ended", "Email matrix E-037 (J-12)" },
                    { "EV-0401", "CAP-04", "المدرب.", "The trainer.", "إنشاء ملف المدرب", "Trainer profile created", "Email matrix E-038 (J-13)" },
                    { "EV-0509", "CAP-05", "منسق الطلب.", "The request's coordinator.", "قائمة مرشحين بانتظار الموافقة", "Candidate pool awaiting approval", "Email matrix E-039 (J-17)" },
                    { "EV-0510", "CAP-05", "منسق الطلب.", "The request's coordinator.", "مادة أو محتوى بانتظار الاعتماد", "Material or content awaiting approval", "Email matrix E-041 (J-20)" },
                    { "EV-0511", "CAP-05", "المدرب أو مطوّر المحتوى.", "The trainer or content developer.", "طلب تعديل المادة أو المحتوى", "Material or content revision requested", "Email matrix E-042 (J-20)" },
                    { "EV-0512", "CAP-05", "المدرب أو مطوّر المحتوى.", "The trainer or content developer.", "اعتماد المادة أو المحتوى", "Material or content approved", "Email matrix E-043 (J-20)" },
                    { "EV-0513", "CAP-05", "المدرب المعتذر.", "The trainer who withdrew.", "استلام اعتذار المدرب", "Trainer's withdrawal received", "Email matrix E-071 (J-22)" },
                    { "EV-0515", "CAP-05", "المدرب.", "The trainer.", "مطلوب رفع المادة التدريبية", "Training material upload needed", "Email matrix E-076 (J-20)" },
                    { "EV-0516", "CAP-05", "مطوّر المحتوى.", "The content developer.", "مطلوب رفع المحتوى", "Content upload needed", "Email matrix E-077 (J-20)" },
                    { "EV-0801", "CAP-08", "المستخدم المعني.", "The user concerned.", "تحديث أدوار المستخدم", "User's roles updated", "Email matrix E-050 (J-26)" }
                });

            migrationBuilder.InsertData(
                table: "NOTIFICATION_TEMPLATE",
                columns: new[] { "template_id", "body_ar", "body_en", "code", "placeholders", "status", "subject_ar", "subject_en", "updated_at", "updated_by", "version" },
                values: new object[,]
                {
                    { new Guid("00d2c697-9895-5d6e-96a0-9d715b2412be"), "تتوفر مواعيد لمقابلتك. يرجى اختيار الموعد المناسب من بوابتك.", "Interview slots are now available. Please select your preferred time from your portal.", "E-014", "[]", "approved", "مواعيد المقابلة متاحة", "Interview Slots Available", new DateTime(2026, 10, 22, 0, 0, 0, 0, DateTimeKind.Utc), null, 1 },
                    { new Guid("075db772-27e7-5cf7-91ae-321db671f3fe"), "مرحبًا {{recipientName}}، تم تأكيد ارتباطك. يمكنك الآن رفع المحتوى المطلوب من بوابتك.", "Hi {{recipientName}}, your engagement is confirmed. You can now upload the required content from your portal.", "E-077", "[\"recipientName\"]", "approved", "مطلوب: ارفع محتواك", "Action Needed — Upload Your Content", new DateTime(2026, 10, 22, 0, 0, 0, 0, DateTimeKind.Utc), null, 1 },
                    { new Guid("093a7ecf-17cf-5256-819f-e8da4c98e21e"), "طلب المتقدم تعديلاً على الاتفاقية. يرجى مراجعة الملاحظة وإعادة التقديم.", "The applicant has requested a modification to the agreement. Please review the note and resubmit.", "E-029", "[]", "approved", "طلب تعديل من المتقدم", "Applicant Requested Modification", new DateTime(2026, 10, 22, 0, 0, 0, 0, DateTimeKind.Utc), null, 1 },
                    { new Guid("0bcd0f1f-5d70-5dd4-b932-4b2710fd4e5f"), "يمكنك الآن البدء في إعداد اتفاقية المتقدم {{trainerName}}.", "You may now begin preparing the agreement for applicant {{trainerName}}.", "E-025", "[\"trainerName\"]", "approved", "جاهز لإعداد الاتفاقية", "Ready for Agreement Preparation", new DateTime(2026, 10, 22, 0, 0, 0, 0, DateTimeKind.Utc), null, 1 },
                    { new Guid("142952ed-a9ce-5af2-bb9f-4643f169c7e0"), "تم اعتماد المادة/المحتوى الذي قمت برفعه.", "Your uploaded material/content has been approved.", "E-043", "[]", "approved", "تم الاعتماد", "Approved", new DateTime(2026, 10, 22, 0, 0, 0, 0, DateTimeKind.Utc), null, 1 },
                    { new Guid("1594a1ed-6cbb-5a36-b7c9-5ed3ad61b506"), "قام المتقدم برفض شروط الاتفاقية. تم إغلاق الطلب نهائيًا.", "The applicant has declined the agreement terms. The application has been permanently closed.", "E-030", "[]", "approved", "تم رفض الاتفاقية", "Agreement Declined", new DateTime(2026, 10, 22, 0, 0, 0, 0, DateTimeKind.Utc), null, 1 },
                    { new Guid("1b7bf85c-74b0-5828-98eb-067ccae9d612"), "تم تجديد اتفاقيتك لمدة {{agreementDuration}}.", "Your agreement has been renewed for {{agreementDuration}}.", "E-035", "[\"agreementDuration\"]", "approved", "تم تجديد الاتفاقية", "Agreement Renewed", new DateTime(2026, 10, 22, 0, 0, 0, 0, DateTimeKind.Utc), null, 1 },
                    { new Guid("1d25b574-17bb-563d-b12c-2d4481039c2b"), "يوجد طلب إضافة خدمة جديد بانتظار مراجعتك للمدرب {{trainerName}}.", "A new service-addition request from {{trainerName}} is awaiting your review.", "E-006", "[\"trainerName\"]", "approved", "طلب إضافة خدمة بانتظار المراجعة", "Service Addition Request Awaiting Review", new DateTime(2026, 10, 22, 0, 0, 0, 0, DateTimeKind.Utc), null, 1 },
                    { new Guid("1dc65a00-ce01-5ba1-ad64-0b4762dce4d3"), "نأسف لإبلاغك بأن طلبك لم يُقبل بعد نتيجة المقابلة.", "We regret to inform you that your application was not accepted following the interview result. Reason: {{reasonText}}.", "E-019", "[\"reasonText\"]", "approved", "نتيجة ما بعد المقابلة", "Post-Interview Decision", new DateTime(2026, 10, 22, 0, 0, 0, 0, DateTimeKind.Utc), null, 1 },
                    { new Guid("1f3d4334-38a6-5a32-8956-20e46503570d"), "اتفاقيتك جاهزة للتوقيع. يرجى مراجعتها والتوقيع عليها من بوابتك.", "Your agreement is ready for signature. Please review and sign it from your portal.", "E-028", "[]", "approved", "اتفاقيتك جاهزة للتوقيع", "Your Agreement Is Ready to Sign", new DateTime(2026, 10, 22, 0, 0, 0, 0, DateTimeKind.Utc), null, 1 },
                    { new Guid("212c220d-7e82-5489-87f6-ee88b51b890a"), "مرحبًا {{recipientName}}، هل تعلم أن ظهورك في الدليل العام للمدربين يزيد من فرص التعرف عليك؟ فعّل الظهور العام من إعداداتك متى ناسبك ذلك.", "Hi {{recipientName}}, did you know appearing in our public trainer directory increases your visibility? Turn on public visibility from your settings whenever it suits you.", "E-062", "[\"recipientName\"]", "approved", "زد من ظهورك المهني", "Boost Your Professional Visibility", new DateTime(2026, 10, 22, 0, 0, 0, 0, DateTimeKind.Utc), null, 1 },
                    { new Guid("22dcf9cb-7627-5897-b880-f1d4bb3052b8"), "انتهى تفويض صلاحية الاعتماد بينك وبين {{counterpartName}}.", "Approval delegation between you and {{counterpartName}} has ended.", "E-049", "[\"counterpartName\"]", "approved", "انتهاء التفويض", "Delegation Ended", new DateTime(2026, 10, 22, 0, 0, 0, 0, DateTimeKind.Utc), null, 1 },
                    { new Guid("22ff2145-97de-5dc7-a2c4-bb1412988a00"), "مرحبًا بك في منصة الخبراء والمدربين! تم إنشاء حسابك بنجاح، وأصبح بإمكانك الدخول في أي وقت لمتابعة رحلتك معنا من البداية حتى الاعتماد.", "Welcome to Expert Hub! Your account is ready. Log in anytime to follow your journey with us, from application to approval.", "E-002", "[]", "approved", "أهلًا بك في منصتنا", "Welcome Aboard", new DateTime(2026, 10, 22, 0, 0, 0, 0, DateTimeKind.Utc), null, 1 },
                    { new Guid("26945866-4bea-5c7f-876c-5227b80ba7cd"), "تنتهي مدة اتفاقيتك خلال 30 يومًا. يرجى المتابعة مع الأكاديمية عند الحاجة.", "Your agreement expires in 30 days. Please follow up with the Academy if needed.", "E-033", "[]", "approved", "تنبيه انتهاء الاتفاقية (30 يومًا)", "Agreement Expiry Alert (30 Days)", new DateTime(2026, 10, 22, 0, 0, 0, 0, DateTimeKind.Utc), null, 1 },
                    { new Guid("2ccc8c3a-b37e-57a3-9c2c-ae665adc240a"), "تم تحديث بيانات سجلك كمتحدث.", "Your speaker record details have been updated.", "E-010", "[]", "approved", "تحديث سجل المتحدث", "Speaker Record Updated", new DateTime(2026, 10, 22, 0, 0, 0, 0, DateTimeKind.Utc), null, 1 },
                    { new Guid("30e985bd-e88d-5323-abf0-9473bf883d8a"), "تم تفعيل حسابك بنجاح. يمكنك الآن متابعة طلبك من بوابة المدرب.", "Your account has been activated. You can now track your application from the Trainer Portal.", "E-005", "[]", "approved", "تم تفعيل الحساب", "Account Activated", new DateTime(2026, 10, 22, 0, 0, 0, 0, DateTimeKind.Utc), null, 1 },
                    { new Guid("326639ee-e6b7-5a74-9bec-f9028b0dce78"), "تم طلب تعديل على الاتفاقية من أحد الموقّعين الداخليين. يرجى المراجعة.", "A modification has been requested on the agreement by an internal signer. Please review.", "E-027", "[]", "approved", "طلب تعديل على الاتفاقية", "Agreement Modification Requested", new DateTime(2026, 10, 22, 0, 0, 0, 0, DateTimeKind.Utc), null, 1 },
                    { new Guid("371b0d7a-4008-5855-b7b2-9108d17e98be"), "شكرًا لك {{recipientName}} على مشاركتك المميزة كمتحدث! أضفت قيمة حقيقية لحضورنا، ونتطلع لدعوتك مجددًا.", "Thank you, {{recipientName}}, for your outstanding participation as a speaker! You added real value for our audience, and we look forward to inviting you again.", "E-067", "[\"recipientName\"]", "approved", "شكرًا لمشاركتك المميزة", "Thank You for a Great Session", new DateTime(2026, 10, 22, 0, 0, 0, 0, DateTimeKind.Utc), null, 1 },
                    { new Guid("3b667fa6-a011-5469-8441-1baec028540c"), "تم إلغاء البرنامج المرتبط بارتباطك من قبل الأكاديمية. السبب: {{reasonText}}.", "The program linked to your engagement has been cancelled by the Academy. Reason: {{reasonText}}.", "E-047", "[\"reasonText\"]", "approved", "إلغاء البرنامج", "Program Cancelled", new DateTime(2026, 10, 22, 0, 0, 0, 0, DateTimeKind.Utc), null, 1 },
                    { new Guid("4333a775-1fbc-532e-8fc5-629b18189078"), "تنتهي مدة اتفاقيتك خلال 90 يومًا. يرجى المتابعة مع الأكاديمية عند الحاجة.", "Your agreement expires in 90 days. Please follow up with the Academy if needed.", "E-032", "[]", "approved", "تنبيه انتهاء الاتفاقية (90 يومًا)", "Agreement Expiry Alert (90 Days)", new DateTime(2026, 10, 22, 0, 0, 0, 0, DateTimeKind.Utc), null, 1 },
                    { new Guid("43c8d6ee-81a7-516e-8c40-17163be16154"), "نأسف، تم رفض طلبك نهائيًا من لجنة الاعتماد.", "We regret to inform you that your application has been finally rejected by the approval committee. Reason: {{reasonText}}.", "E-022", "[\"reasonText\"]", "approved", "قرار نهائي بالرفض", "Final Rejection Decision", new DateTime(2026, 10, 22, 0, 0, 0, 0, DateTimeKind.Utc), null, 1 },
                    { new Guid("43d4e2f6-4893-57a4-80d0-adad5403f8d5"), "تهانينا! تم توقيع اتفاقيتك بنجاح وأصبحت مدربًا معتمدًا.", "Congratulations! Your agreement has been signed and you are now an approved Trainer.", "E-031", "[]", "approved", "تم توقيع الاتفاقية", "Agreement Signed & Activated", new DateTime(2026, 10, 22, 0, 0, 0, 0, DateTimeKind.Utc), null, 1 },
                    { new Guid("4c5f9336-bed6-5e07-91b5-ea1fe55ef0ef"), "تم طلب تعديل على المادة/المحتوى المرفوع. يرجى إعادة الرفع.", "A revision has been requested for your uploaded material/content. Please re-upload.", "E-042", "[]", "approved", "طلب تعديل", "Revision Requested", new DateTime(2026, 10, 22, 0, 0, 0, 0, DateTimeKind.Utc), null, 1 },
                    { new Guid("4eca8e8b-610c-52a9-9b63-6e01bcc1d714"), "تمت الموافقة على إضافة الخدمة الجديدة إلى ملفك، وتم تحديث اتفاقيتك.", "Your new service addition has been approved and your agreement addendum has been updated.", "E-007", "[]", "approved", "تمت الموافقة على إضافة الخدمة", "Service Addition Approved", new DateTime(2026, 10, 22, 0, 0, 0, 0, DateTimeKind.Utc), null, 1 },
                    { new Guid("4fb9561d-f56a-58fc-a7a3-757904cba23b"), "مرحبًا {{recipientName}}، تم استلام اعتذارك عن هذا الارتباط. نتفهم ظروفك تمامًا، ونتطلع للعمل معك في فرصة قادمة قريبًا.", "Hi {{recipientName}}, we've received your withdrawal from this engagement. We completely understand, and we look forward to working with you on a future opportunity soon.", "E-071", "[\"recipientName\"]", "approved", "تم استلام اعتذارك", "We've Received Your Withdrawal", new DateTime(2026, 10, 22, 0, 0, 0, 0, DateTimeKind.Utc), null, 1 },
                    { new Guid("5129d61e-1487-5909-99c5-913f8a1ad7e2"), "مرحبًا {{recipientName}}، نود إعلامك بوجود تأخير بسيط في صرف مستحقاتك، وفريقنا يعمل على حله في أقرب وقت. نعتذر عن أي إزعاج.", "Hi {{recipientName}}, we want to let you know there's a short delay in processing your payment, and our team is actively working to resolve it. We apologize for any inconvenience.", "E-055", "[\"recipientName\"]", "approved", "تحديث بخصوص مستحقاتك المالية", "An Update on Your Payment", new DateTime(2026, 10, 22, 0, 0, 0, 0, DateTimeKind.Utc), null, 1 },
                    { new Guid("5456128c-7bcc-5987-b6cd-bcd5992122b7"), "تهانينا {{recipientName}}! تم قبول طلبك للخدمات التالية: {{serviceList}}. يسعدنا مرافقتك في الخطوة القادمة من رحلتك معنا.", "Congratulations, {{recipientName}}! Your application has been accepted for: {{serviceList}}. We're glad to guide you through the next step of your journey with us.", "E-012", "[\"recipientName\", \"serviceList\"]", "approved", "تهانينا! تم قبول طلبك جزئيًا", "Congratulations — Part of Your Application Was Accepted", new DateTime(2026, 10, 22, 0, 0, 0, 0, DateTimeKind.Utc), null, 1 },
                    { new Guid("54a68362-205a-53f7-bb43-a538db7681fe"), "تذكير: يرجى اختيار موعد مقابلتك قبل انتهاء المهلة.", "Reminder: please select your interview slot before the deadline.", "E-017", "[]", "approved", "تذكير: اختر موعد مقابلتك", "Reminder: Select Your Interview Slot", new DateTime(2026, 10, 22, 0, 0, 0, 0, DateTimeKind.Utc), null, 1 },
                    { new Guid("556cf60c-cf33-5631-b070-a9eecab20652"), "تم رفع مادة/محتوى بانتظار اعتمادك.", "Material/content has been uploaded and is awaiting your approval.", "E-041", "[]", "approved", "بانتظار الاعتماد", "Awaiting Approval", new DateTime(2026, 10, 22, 0, 0, 0, 0, DateTimeKind.Utc), null, 1 },
                    { new Guid("576bcbe3-7cc1-5a02-90df-2c94d00989f6"), "مرحبًا {{recipientName}}، أكمل ملفك الشخصي (الصورة، الروابط المهنية) ليصل إلى فرص أكثر وليعكس حضورك المهني بأفضل شكل.", "Hi {{recipientName}}, complete your profile (photo, professional links) so it reaches more opportunities and reflects your professional presence at its best.", "E-061", "[\"recipientName\"]", "approved", "أكمل ملفك الشخصي", "Complete Your Profile", new DateTime(2026, 10, 22, 0, 0, 0, 0, DateTimeKind.Utc), null, 1 },
                    { new Guid("57bbc3bb-00af-51b1-976a-baa0408e038b"), "مرحبًا {{recipientName}}، إليك بعض النصائح لتبدأ رحلتك معنا بأفضل شكل: أكمل ملفك، استكشف بوابتك، وترقّب أول فرصة تدريبية قريبًا!", "Hi {{recipientName}}, here are a few tips to get the most out of your journey with us: complete your profile, explore your portal, and watch for your first opportunity soon!", "E-068", "[\"recipientName\"]", "approved", "نصائح لبداية موفقة", "Tips to Get You Started", new DateTime(2026, 10, 22, 0, 0, 0, 0, DateTimeKind.Utc), null, 1 },
                    { new Guid("5e471bb8-892e-59fd-9a2c-7a1899948bb7"), "مرحبًا {{recipientName}}، برنامجك القادم يقترب! نتمنى لك تجربة تدريبية ملهمة. التفاصيل: {{date}} - {{time}}.", "Hi {{recipientName}}, your upcoming program is just around the corner! We wish you an inspiring session. Details: {{date}} at {{time}}.", "E-052", "[\"recipientName\", \"date\", \"time\"]", "approved", "برنامجك القادم يقترب", "Your Upcoming Session Is Coming Up", new DateTime(2026, 10, 22, 0, 0, 0, 0, DateTimeKind.Utc), null, 1 },
                    { new Guid("672b3c7e-b33e-5889-97b8-6d50d99a6f06"), "نأسف، لم تتم الموافقة على طلب إضافة الخدمة الجديدة.", "We regret to inform you that your service-addition request was not approved.", "E-008", "[]", "approved", "قرار بشأن طلب إضافة الخدمة", "Service Addition Decision", new DateTime(2026, 10, 22, 0, 0, 0, 0, DateTimeKind.Utc), null, 1 },
                    { new Guid("6eb29e81-a0d2-509e-86f2-6b326a510f59"), "مرحبًا {{recipientName}}، عرض الإسناد الخاص بك سينتهي قريبًا. يرجى الرد قبل انتهاء المهلة حتى لا تفوتك الفرصة.", "Hi {{recipientName}}, your assignment offer is expiring soon. Please respond before the deadline so you don't miss this opportunity.", "E-075", "[\"recipientName\"]", "approved", "تذكير: عرضك على وشك الانتهاء", "Reminder — Your Offer Is Expiring Soon", new DateTime(2026, 10, 22, 0, 0, 0, 0, DateTimeKind.Utc), null, 1 },
                    { new Guid("6eef4954-5355-5841-b8e4-700b4c153030"), "مرحبًا {{recipientName}}، يقترب موعد برنامجك ولم يتم رفع المادة التدريبية بعد. يرجى رفعها في أقرب وقت لضمان جاهزية تامة.", "Hi {{recipientName}}, your program date is approaching and the training material hasn't been uploaded yet. Please upload it soon to be fully ready.", "E-066", "[\"recipientName\"]", "approved", "تذكير: ارفع مادتك التدريبية", "Reminder — Upload Your Training Material", new DateTime(2026, 10, 22, 0, 0, 0, 0, DateTimeKind.Utc), null, 1 },
                    { new Guid("6f0835f5-f4ac-5e9a-81bf-c722402eceaf"), "مبروك {{recipientName}}! 🎂 اليوم يصادف مرور عام على انضمامك إلينا كمدرب معتمد. شكرًا لك على رحلتك الملهمة معنا.", "Congratulations, {{recipientName}}! 🎂 Today marks one year since you joined us as an approved Trainer. Thank you for an inspiring journey with us.", "E-063", "[\"recipientName\"]", "approved", "عامك الأول معنا!", "Happy Trainer Anniversary!", new DateTime(2026, 10, 22, 0, 0, 0, 0, DateTimeKind.Utc), null, 1 },
                    { new Guid("70c88d12-443b-5816-b299-c738d6321339"), "يرجى تقديم تقييمك للمقابلة التي حضرتها في أقرب وقت.", "Please submit your evaluation for the interview you attended at your earliest convenience.", "E-018", "[]", "approved", "تذكير بتقديم تقييم المقابلة", "Reminder: Submit Interview Evaluation", new DateTime(2026, 10, 22, 0, 0, 0, 0, DateTimeKind.Utc), null, 1 },
                    { new Guid("73ba0ad2-3de2-5d2f-9f41-c6c4a8c74283"), "تم تحديث دورك وصلاحياتك على المنصة.", "Your role and permissions on the platform have been updated.", "E-050", "[]", "approved", "تحديث الصلاحيات", "Role & Permissions Updated", new DateTime(2026, 10, 22, 0, 0, 0, 0, DateTimeKind.Utc), null, 1 },
                    { new Guid("7a511e05-b62f-57a9-9b12-e1987dca47e2"), "شكرًا لك {{recipientName}} على جهدك وعطائك في هذا البرنامج! أثرك في المتدربين لا يُقدر بثمن، ونتطلع للعمل معك مجددًا قريبًا.", "Thank you, {{recipientName}}, for your dedication in this program! The impact you make on trainees is invaluable, and we look forward to working with you again soon.", "E-053", "[\"recipientName\"]", "approved", "شكرًا لك على جهودك!", "Thank You for a Great Session", new DateTime(2026, 10, 22, 0, 0, 0, 0, DateTimeKind.Utc), null, 1 },
                    { new Guid("7ab9ee6e-dbb9-57a0-af2b-9612d36a894c"), "مرحبًا {{recipientName}}، لا تزال بياناتك البنكية غير مكتملة. أكملها الآن لإتمام إجراءات اعتمادك دون تأخير.", "Hi {{recipientName}}, your bank details are still incomplete. Please complete them now so we can finalize your approval without delay.", "E-073", "[\"recipientName\"]", "approved", "تذكير: أكمل بياناتك البنكية", "Reminder — Complete Your Bank Details", new DateTime(2026, 10, 22, 0, 0, 0, 0, DateTimeKind.Utc), null, 1 },
                    { new Guid("7abd7606-acd8-5088-9ae4-ae96d31b1be9"), "تم إلغاء ارتباطك بالبرنامج. السبب: {{reasonText}}.", "Your engagement with the program has been de-linked. Reason: {{reasonText}}.", "E-046", "[\"reasonText\"]", "approved", "إلغاء الارتباط", "Engagement De-linked", new DateTime(2026, 10, 22, 0, 0, 0, 0, DateTimeKind.Utc), null, 1 },
                    { new Guid("7b9a4042-8424-58b7-8198-05020a9f4830"), "تم طلب تعديل على الطلب من أحد أعضاء اللجنة. يرجى مراجعة الملاحظة.", "A committee member has requested a modification to the application. Please review the note.", "E-023", "[]", "approved", "طلب تعديل على الطلب", "Application Modification Requested", new DateTime(2026, 10, 22, 0, 0, 0, 0, DateTimeKind.Utc), null, 1 },
                    { new Guid("86d43258-4aeb-5fef-a566-fc0456fbf421"), "مرحبًا {{recipientName}}، اتفاقيتك لا تزال بانتظار توقيعك. راجعها ووقّعها الآن لإتمام انضمامك.", "Hi {{recipientName}}, your agreement is still awaiting your signature. Review and sign it now to complete your onboarding.", "E-074", "[\"recipientName\"]", "approved", "تذكير: اتفاقيتك بانتظار التوقيع", "Reminder — Your Agreement Awaits Signature", new DateTime(2026, 10, 22, 0, 0, 0, 0, DateTimeKind.Utc), null, 1 },
                    { new Guid("8dfad49a-38da-56a0-a446-e1fd320663bd"), "مرحبًا {{recipientName}}، حان وقت مراجعة ملفك الشخصي! تأكد من تحديث بياناتك وخبراتك لتبقى دائمًا في أفضل صورة أمام الفرص القادمة.", "Hi {{recipientName}}, it's time for your annual profile check-up! Make sure your information and experience are up to date so you always put your best foot forward.", "E-070", "[\"recipientName\"]", "approved", "حان وقت مراجعة ملفك", "Time for Your Annual Profile Check-Up", new DateTime(2026, 10, 22, 0, 0, 0, 0, DateTimeKind.Utc), null, 1 },
                    { new Guid("9b0cd31c-c124-5db0-ad41-e0cc422a06f4"), "تم تغيير موعد برنامجك. التفاصيل الجديدة: {{date}} - {{time}}.", "Your program's schedule has changed. New details: {{date}} at {{time}}.", "E-044", "[\"date\", \"time\"]", "approved", "تغيير موعد البرنامج", "Program Schedule Changed", new DateTime(2026, 10, 22, 0, 0, 0, 0, DateTimeKind.Utc), null, 1 },
                    { new Guid("9bc73c01-44ea-5ca6-9e10-6d69852ebc4e"), "تنتهي مدة اتفاقيتك خلال 5 أيام. يرجى المتابعة عند الحاجة مع الأكاديمية.", "Your agreement expires in 5 days. Please follow up with the Academy urgently.", "E-034", "[]", "approved", "تنبيه عاجل: انتهاء الاتفاقية (5 أيام)", "Urgent: Agreement Expiry Alert (5 Days)", new DateTime(2026, 10, 22, 0, 0, 0, 0, DateTimeKind.Utc), null, 1 },
                    { new Guid("9c0bdb16-05f4-5668-bc86-07dfbb63814b"), "لديك عرض إسناد جديد. يرجى الرد خلال 3 أيام. التفاصيل: {{actionUrl}}.", "You have a new assignment offer. Please respond within 3 days. Details: {{actionUrl}}.", "E-040", "[\"actionUrl\"]", "approved", "عرض إسناد جديد", "New Assignment Offer", new DateTime(2026, 10, 22, 0, 0, 0, 0, DateTimeKind.Utc), null, 1 },
                    { new Guid("9ddbc393-f773-5862-aab8-d94d28a5e280"), "أخبار سارة {{recipientName}}! تم صرف مستحقاتك المالية عن برنامج {{programName}}. شكرًا لتميّزك المستمر معنا.", "Good news, {{recipientName}}! Your payment for {{programName}} has been processed. Thank you for your continued excellence with us.", "E-054", "[\"recipientName\", \"programName\"]", "approved", "تم صرف مستحقاتك المالية", "Your Payment Has Been Processed", new DateTime(2026, 10, 22, 0, 0, 0, 0, DateTimeKind.Utc), null, 1 },
                    { new Guid("a0316082-d8e9-5f06-a00c-185cd1d56ac1"), "توجد قائمة مرشحين جاهزة لمراجعتك واعتمادك.", "A candidate pool is ready for your review and approval.", "E-039", "[]", "approved", "مرشحون بانتظار موافقتك", "Candidates Awaiting Your Approval", new DateTime(2026, 10, 22, 0, 0, 0, 0, DateTimeKind.Utc), null, 1 },
                    { new Guid("a307f12a-f282-51ec-a967-422cf2579cb3"), "تم إنشاء سجلك كمتحدث في منصة الخبراء والمدربين.", "A speaker record has been created for you on the Expert Hub platform.", "E-009", "[]", "approved", "إنشاء سجل متحدث", "Speaker Record Created", new DateTime(2026, 10, 22, 0, 0, 0, 0, DateTimeKind.Utc), null, 1 },
                    { new Guid("ae8b6c56-ca5c-5d9e-b522-4614aa47c51a"), "بدأ تفويض صلاحية الاعتماد بينك وبين {{counterpartName}}.", "Approval delegation has begun between you and {{counterpartName}}.", "E-048", "[\"counterpartName\"]", "approved", "بدء التفويض", "Delegation Started", new DateTime(2026, 10, 22, 0, 0, 0, 0, DateTimeKind.Utc), null, 1 },
                    { new Guid("aea0ea17-8723-5ac8-a052-5397fa38089a"), "توجد اتفاقية بانتظار مراجعتك أو توقيعك.", "An agreement is awaiting your review or signature.", "E-026", "[]", "approved", "اتفاقية بانتظار التوقيع", "Agreement Awaiting Signature", new DateTime(2026, 10, 22, 0, 0, 0, 0, DateTimeKind.Utc), null, 1 },
                    { new Guid("b021ce95-978a-5a72-bac6-f621a87c5adb"), "لديك طلب غير مكتمل محفوظ كمسودة. يمكنك إكمال تقديمه في أي وقت.", "You have an incomplete draft application saved. You can resume and submit it anytime.", "E-003", "[]", "approved", "أكمل طلبك المحفوظ", "Complete Your Saved Application", new DateTime(2026, 10, 22, 0, 0, 0, 0, DateTimeKind.Utc), null, 1 },
                    { new Guid("b07efcc9-9e99-5721-b682-9a830c0727ce"), "تم تأكيد موعد مقابلتك. التفاصيل: {{date}} - {{time}}. الرابط: {{actionUrl}}.", "Your interview has been scheduled. Details: {{date}} at {{time}}. Link: {{actionUrl}}.", "E-015", "[\"date\", \"time\", \"actionUrl\"]", "approved", "تأكيد موعد المقابلة", "Interview Scheduled", new DateTime(2026, 10, 22, 0, 0, 0, 0, DateTimeKind.Utc), null, 1 },
                    { new Guid("b2304dc0-5083-5102-af18-cc4b36d7770d"), "تهانينا! تم قبول طلبك للخدمة/الخدمات المطلوبة.", "Congratulations! Your application has been accepted for the requested service(s).", "E-011", "[]", "approved", "تم قبول طلبك", "Your Application Was Accepted", new DateTime(2026, 10, 22, 0, 0, 0, 0, DateTimeKind.Utc), null, 1 },
                    { new Guid("b577d872-ff0e-506c-ac39-757ebc0f4289"), "تم رصد نشاط أمني على حسابك (مثل إعادة تعيين كلمة المرور). إذا لم تقم بذلك، يرجى التواصل فورًا.", "A security-related activity was detected on your account (e.g. password reset). If this wasn't you, please contact us immediately.", "E-051", "[]", "approved", "تنبيه أمان الحساب", "Account Security Notice", new DateTime(2026, 10, 22, 0, 0, 0, 0, DateTimeKind.Utc), null, 1 },
                    { new Guid("bb63a843-937d-5055-a644-6645da542cee"), "تمت إضافتك كمرشح داخلي من قبل الأكاديمية. يرجى تفعيل حسابك لمتابعة طلبك.", "You have been registered as an internal nominee by the Academy. Please activate your account to track your application.", "E-004", "[]", "approved", "تفعيل حسابك كمرشح", "Activate Your Nominee Account", new DateTime(2026, 10, 22, 0, 0, 0, 0, DateTimeKind.Utc), null, 1 },
                    { new Guid("cdc7ac91-b27d-59e8-bb9a-82a235b5e70a"), "تم إنشاء ملفك الرسمي كمدرب معتمد. يمكنك استعراضه من بوابتك.", "Your official Trainer Profile has been created. You can view it from your portal.", "E-038", "[]", "approved", "ملفك كمدرب جاهز", "Your Trainer Profile Is Ready", new DateTime(2026, 10, 22, 0, 0, 0, 0, DateTimeKind.Utc), null, 1 },
                    { new Guid("d058f110-37af-5101-9628-764eb9e1287a"), "مرحبًا {{recipientName}}، توجد فرص تدريبية جديدة تناسب تخصصك! اطّلع عليها", "Hi {{recipientName}}, new training opportunities matching your specialty are available! Take a look now and be among the first to apply.", "E-059", "[\"recipientName\"]", "approved", "فرص جديدة تناسب تخصصك", "New Opportunities Matching Your Specialty", new DateTime(2026, 10, 22, 0, 0, 0, 0, DateTimeKind.Utc), null, 1 },
                    { new Guid("d30f8f56-6c26-5aeb-a284-03ae0cd6edef"), "تم إنهاء اتفاقيتك مع الأكاديمية.", "Your agreement with the Academy has been ended.", "E-037", "[]", "approved", "إنهاء الاتفاقية", "Agreement Ended", new DateTime(2026, 10, 22, 0, 0, 0, 0, DateTimeKind.Utc), null, 1 },
                    { new Guid("dd12b23b-36f6-5c55-b2ac-1cb1c8c492a3"), "أكمل المتقدم بياناته البنكية. يمكنك الآن المتابعة لإعداد الاتفاقية.", "The applicant has completed their bank data. You may now proceed with agreement preparation.", "E-024", "[]", "approved", "اكتملت البيانات البنكية", "Bank Data Completed", new DateTime(2026, 10, 22, 0, 0, 0, 0, DateTimeKind.Utc), null, 1 },
                    { new Guid("dddfd5e0-6eec-524f-bb1d-5a6d5e7313e4"), "مرحبًا {{recipientName}}، تذكير: مقابلتك غدًا الساعة {{time}}. نتمنى لك التوفيق ونتطلع للقائك!", "Hi {{recipientName}}, reminder: your interview is tomorrow at {{time}}. We wish you the best and look forward to meeting you!", "E-065", "[\"recipientName\", \"time\"]", "approved", "مقابلتك غدًا", "Your Interview Is Tomorrow", new DateTime(2026, 10, 22, 0, 0, 0, 0, DateTimeKind.Utc), null, 1 },
                    { new Guid("df8f3358-16ed-5f99-836b-1f294a7065ab"), "مرحبًا {{recipientName}}، حصلت على تقييمات رائعة من متدربيك في برنامجك الأخير! نفخر بك ونشكرك على تميزك.", "Hi {{recipientName}}, you received wonderful feedback from your trainees in your latest program! We're proud of you and thank you for your excellence.", "E-056", "[\"recipientName\"]", "approved", "تقييمات رائعة بانتظارك!", "Great Feedback Is Waiting for You", new DateTime(2026, 10, 22, 0, 0, 0, 0, DateTimeKind.Utc), null, 1 },
                    { new Guid("e490430b-321c-5775-821e-4f1e5aab06c6"), "تم تعليق اتفاقيتك من قبل الأكاديمية.", "Your agreement has been suspended by the Academy.", "E-036", "[]", "approved", "تعليق الاتفاقية", "Agreement Suspended", new DateTime(2026, 10, 22, 0, 0, 0, 0, DateTimeKind.Utc), null, 1 },
                    { new Guid("e4d0fe0b-4271-5594-b11a-d2b419ae6b86"), "مرحبًا {{recipientName}}،\n\nنفيدكم بأنه تم استلام طلب انضمامكم بنجاح، ورقم المرجع الخاص بطلبكم هو {{referenceNumber}}.\n\nسيتم مراجعة الطلب من قبل الفريق المختص، وسيتم إعلامكم بأي تحديث أولًا بأول. يمكنكم متابعة حالة الطلب في أي وقت من خلال لوحة التحكم الخاصة بكم.\n\nمع تحيات فريق منصة الخبراء والمدربين", "Dear {{recipientName}},\n\nThis is to confirm that your application has been received successfully. Your reference number is {{referenceNumber}}.\n\nYour application will be reviewed by our team, and you will be notified of any updates. You may track its status at any time from your dashboard.\n\nKind regards,\nExpert Hub Team", "E-001", "[\"recipientName\", \"referenceNumber\"]", "approved", "طلبك وصلنا!", "We've Got Your Application!", new DateTime(2026, 10, 22, 0, 0, 0, 0, DateTimeKind.Utc), null, 1 },
                    { new Guid("f29771f3-12bb-5c09-9280-1ffceb5d8140"), "تم طلب إعادة جدولة موعد المقابلة. سيتم تزويدك بموعد جديد قريبًا.", "A reschedule has been requested for your interview. A new time will be provided shortly.", "E-016", "[]", "approved", "إعادة جدولة المقابلة", "Interview Reschedule", new DateTime(2026, 10, 22, 0, 0, 0, 0, DateTimeKind.Utc), null, 1 },
                    { new Guid("f30f2f1d-1031-599f-a6f3-6f923925975d"), "يوجد طلب بانتظار موافقتك ضمن لجنة الاعتماد.", "An application is awaiting your approval as part of the approval committee.", "E-020", "[]", "approved", "طلب بانتظار موافقتك", "Application Awaiting Your Approval", new DateTime(2026, 10, 22, 0, 0, 0, 0, DateTimeKind.Utc), null, 1 },
                    { new Guid("f47aef8a-5d65-5887-a8b9-e00f86ed6a7f"), "مرحبًا {{recipientName}}، برنامجك لا يحتوي على مادة تدريبية جاهزة. يمكنك الآن رفع موادك الخاصة من بوابتك.", "Hi {{recipientName}}, your program doesn't have ready-made training material. You can now upload your own material from your portal.", "E-076", "[\"recipientName\"]", "approved", "مطلوب: ارفع مادتك التدريبية", "Action Needed — Upload Your Training Material", new DateTime(2026, 10, 22, 0, 0, 0, 0, DateTimeKind.Utc), null, 1 },
                    { new Guid("f8d905c7-70f2-583a-bf36-9eb01696ba61"), "مرحبًا {{recipientName}}، اكتملت نتيجة المقابلة للطلب {{referenceNumber}}. يرجى اتخاذ القرار: تحويل الطلب إلى لجنة الاعتماد أو رفضه.", "Hi {{recipientName}}, the interview result for application {{referenceNumber}} is finalized. Please decide: forward to the approval committee or reject.", "E-072", "[\"recipientName\", \"referenceNumber\"]", "approved", "قرار مطلوب: نتيجة المقابلة جاهزة", "Action Needed — Interview Result Ready", new DateTime(2026, 10, 22, 0, 0, 0, 0, DateTimeKind.Utc), null, 1 },
                    { new Guid("fb0cde34-dc2d-5914-9355-7156c13107a9"), "تهانينا! تمت الموافقة المبدئية على طلبك. يرجى استكمال بياناتك البنكية لإتمام الإجراءات.", "Congratulations! Your application has received preliminary approval. Please complete your bank details to proceed.", "E-021", "[]", "approved", "موافقة مبدئية - مطلوب بيانات بنكية", "Preliminary Approval — Bank Data Required", new DateTime(2026, 10, 22, 0, 0, 0, 0, DateTimeKind.Utc), null, 1 },
                    { new Guid("ffe3ca70-3346-5811-8a6b-5148156cedc7"), "نأسف لإبلاغك بأن طلبك لم يُقبل.", "We regret to inform you that your application was not accepted.", "E-013", "[]", "approved", "نتيجة الطلب", "Application Decision", new DateTime(2026, 10, 22, 0, 0, 0, 0, DateTimeKind.Utc), null, 1 }
                });

            // P-372 — routing is seeded only for an event nobody has routed yet:
            // an administrator's own routing on a running server wins, and the
            // one-row-per-event index would refuse a second row anyway.
            migrationBuilder.Sql(
                "INSERT INTO NOTIFICATION_MATRIX_ROW (row_id, audience, event_code, is_active, template_id) "
                + "SELECT '0a843f90-d8a8-5887-9ada-5cf020fbb88b', N'[\"record_subject\"]', 'EV-0207', 1, 'ffe3ca70-3346-5811-8a6b-5148156cedc7' "
                + "WHERE NOT EXISTS (SELECT 1 FROM NOTIFICATION_MATRIX_ROW WHERE event_code = 'EV-0207');");
            migrationBuilder.Sql(
                "INSERT INTO NOTIFICATION_MATRIX_ROW (row_id, audience, event_code, is_active, template_id) "
                + "SELECT '0d77184b-aef5-56a8-95b0-4d9a8da2a576', N'[\"record_subject\"]', 'EV-0103', 1, '4eca8e8b-610c-52a9-9b63-6e01bcc1d714' "
                + "WHERE NOT EXISTS (SELECT 1 FROM NOTIFICATION_MATRIX_ROW WHERE event_code = 'EV-0103');");
            migrationBuilder.Sql(
                "INSERT INTO NOTIFICATION_MATRIX_ROW (row_id, audience, event_code, is_active, template_id) "
                + "SELECT '0d7d080c-f093-5de2-87ce-204327eef050', N'[\"record_subject\"]', 'EV-0508', 1, '3b667fa6-a011-5469-8441-1baec028540c' "
                + "WHERE NOT EXISTS (SELECT 1 FROM NOTIFICATION_MATRIX_ROW WHERE event_code = 'EV-0508');");
            migrationBuilder.Sql(
                "INSERT INTO NOTIFICATION_MATRIX_ROW (row_id, audience, event_code, is_active, template_id) "
                + "SELECT '10f47da5-9d2d-54ec-82f2-f5350db9eef2', N'[\"acting_staff\"]', 'EV-0211', 1, 'f30f2f1d-1031-599f-a6f3-6f923925975d' "
                + "WHERE NOT EXISTS (SELECT 1 FROM NOTIFICATION_MATRIX_ROW WHERE event_code = 'EV-0211');");
            migrationBuilder.Sql(
                "INSERT INTO NOTIFICATION_MATRIX_ROW (row_id, audience, event_code, is_active, template_id) "
                + "SELECT '299f08fd-a919-5bc3-ac01-30580db54b5e', N'[\"record_subject\"]', 'EV-0310', 1, '43d4e2f6-4893-57a4-80d0-adad5403f8d5' "
                + "WHERE NOT EXISTS (SELECT 1 FROM NOTIFICATION_MATRIX_ROW WHERE event_code = 'EV-0310');");
            migrationBuilder.Sql(
                "INSERT INTO NOTIFICATION_MATRIX_ROW (row_id, audience, event_code, is_active, template_id) "
                + "SELECT '2eacd1c4-874a-593c-907f-2be85904cb4b', N'[\"record_subject\"]', 'EV-0213', 1, '43c8d6ee-81a7-516e-8c40-17163be16154' "
                + "WHERE NOT EXISTS (SELECT 1 FROM NOTIFICATION_MATRIX_ROW WHERE event_code = 'EV-0213');");
            migrationBuilder.Sql(
                "INSERT INTO NOTIFICATION_MATRIX_ROW (row_id, audience, event_code, is_active, template_id) "
                + "SELECT '31b9f4e1-eba4-5ba8-a996-54782433eb03', N'[\"record_subject\"]', 'EV-0102', 1, 'bb63a843-937d-5055-a644-6645da542cee' "
                + "WHERE NOT EXISTS (SELECT 1 FROM NOTIFICATION_MATRIX_ROW WHERE event_code = 'EV-0102');");
            migrationBuilder.Sql(
                "INSERT INTO NOTIFICATION_MATRIX_ROW (row_id, audience, event_code, is_active, template_id) "
                + "SELECT '36114fab-26d0-5813-96e1-8a62c85423d6', N'[\"record_subject\"]', 'EV-0511', 1, '4c5f9336-bed6-5e07-91b5-ea1fe55ef0ef' "
                + "WHERE NOT EXISTS (SELECT 1 FROM NOTIFICATION_MATRIX_ROW WHERE event_code = 'EV-0511');");
            migrationBuilder.Sql(
                "INSERT INTO NOTIFICATION_MATRIX_ROW (row_id, audience, event_code, is_active, template_id) "
                + "SELECT '39a27893-ff88-559e-919b-78ec37397a60', N'[\"acting_staff\"]', 'EV-0208', 1, 'f29771f3-12bb-5c09-9280-1ffceb5d8140' "
                + "WHERE NOT EXISTS (SELECT 1 FROM NOTIFICATION_MATRIX_ROW WHERE event_code = 'EV-0208');");
            migrationBuilder.Sql(
                "INSERT INTO NOTIFICATION_MATRIX_ROW (row_id, audience, event_code, is_active, template_id) "
                + "SELECT '3a3a203b-8356-5ee0-8a7c-b566a405f196', N'[\"record_subject\"]', 'EV-0210', 1, '1dc65a00-ce01-5ba1-ad64-0b4762dce4d3' "
                + "WHERE NOT EXISTS (SELECT 1 FROM NOTIFICATION_MATRIX_ROW WHERE event_code = 'EV-0210');");
            migrationBuilder.Sql(
                "INSERT INTO NOTIFICATION_MATRIX_ROW (row_id, audience, event_code, is_active, template_id) "
                + "SELECT '418b0fa4-54e8-51bc-8a28-04a15d11ea88', N'[\"acting_staff\"]', 'EV-0215', 1, 'dd12b23b-36f6-5c55-b2ac-1cb1c8c492a3' "
                + "WHERE NOT EXISTS (SELECT 1 FROM NOTIFICATION_MATRIX_ROW WHERE event_code = 'EV-0215');");
            migrationBuilder.Sql(
                "INSERT INTO NOTIFICATION_MATRIX_ROW (row_id, audience, event_code, is_active, template_id) "
                + "SELECT '50648be2-cdb2-558d-b0f5-73f675258af9', N'[\"record_subject\"]', 'EV-0801', 1, '73ba0ad2-3de2-5d2f-9f41-c6c4a8c74283' "
                + "WHERE NOT EXISTS (SELECT 1 FROM NOTIFICATION_MATRIX_ROW WHERE event_code = 'EV-0801');");
            migrationBuilder.Sql(
                "INSERT INTO NOTIFICATION_MATRIX_ROW (row_id, audience, event_code, is_active, template_id) "
                + "SELECT '5067d5ca-c8b6-51c6-9b88-06fa97acf1c4', N'[\"record_subject\"]', 'EV-0205', 1, 'b2304dc0-5083-5102-af18-cc4b36d7770d' "
                + "WHERE NOT EXISTS (SELECT 1 FROM NOTIFICATION_MATRIX_ROW WHERE event_code = 'EV-0205');");
            migrationBuilder.Sql(
                "INSERT INTO NOTIFICATION_MATRIX_ROW (row_id, audience, event_code, is_active, template_id) "
                + "SELECT '5d8d43e3-d094-5467-9554-fc1de5b74fdf', N'[\"record_subject\"]', 'EV-0505', 1, '9b0cd31c-c124-5db0-ad41-e0cc422a06f4' "
                + "WHERE NOT EXISTS (SELECT 1 FROM NOTIFICATION_MATRIX_ROW WHERE event_code = 'EV-0505');");
            migrationBuilder.Sql(
                "INSERT INTO NOTIFICATION_MATRIX_ROW (row_id, audience, event_code, is_active, template_id) "
                + "SELECT '5edb944c-13b1-5d0a-9ab0-94bf77017cde', N'[\"record_subject\"]', 'EV-0312', 1, 'd30f8f56-6c26-5aeb-a284-03ae0cd6edef' "
                + "WHERE NOT EXISTS (SELECT 1 FROM NOTIFICATION_MATRIX_ROW WHERE event_code = 'EV-0312');");
            migrationBuilder.Sql(
                "INSERT INTO NOTIFICATION_MATRIX_ROW (row_id, audience, event_code, is_active, template_id) "
                + "SELECT '672c4ca1-57c1-544b-aed8-76567c0fee8f', N'[\"record_subject\"]', 'EV-0513', 1, '4fb9561d-f56a-58fc-a7a3-757904cba23b' "
                + "WHERE NOT EXISTS (SELECT 1 FROM NOTIFICATION_MATRIX_ROW WHERE event_code = 'EV-0513');");
            migrationBuilder.Sql(
                "INSERT INTO NOTIFICATION_MATRIX_ROW (row_id, audience, event_code, is_active, template_id) "
                + "SELECT '6cd078ad-1bd8-5d84-9e62-4c889c2eb280', N'[\"record_subject\"]', 'EV-0311', 1, 'e490430b-321c-5775-821e-4f1e5aab06c6' "
                + "WHERE NOT EXISTS (SELECT 1 FROM NOTIFICATION_MATRIX_ROW WHERE event_code = 'EV-0311');");
            migrationBuilder.Sql(
                "INSERT INTO NOTIFICATION_MATRIX_ROW (row_id, audience, event_code, is_active, template_id) "
                + "SELECT '738a10a3-4d52-5cdc-808c-fb9c0aa558ef', N'[\"record_subject\"]', 'EV-0104', 1, '672b3c7e-b33e-5889-97b8-6d50d99a6f06' "
                + "WHERE NOT EXISTS (SELECT 1 FROM NOTIFICATION_MATRIX_ROW WHERE event_code = 'EV-0104');");
            migrationBuilder.Sql(
                "INSERT INTO NOTIFICATION_MATRIX_ROW (row_id, audience, event_code, is_active, template_id) "
                + "SELECT '74fe9f94-2e44-59b3-9000-3f4e6cc5962e', N'[\"record_subject\", \"staff\"]', 'EV-0301', 1, '4333a775-1fbc-532e-8fc5-629b18189078' "
                + "WHERE NOT EXISTS (SELECT 1 FROM NOTIFICATION_MATRIX_ROW WHERE event_code = 'EV-0301');");
            migrationBuilder.Sql(
                "INSERT INTO NOTIFICATION_MATRIX_ROW (row_id, audience, event_code, is_active, template_id) "
                + "SELECT '776798e3-942f-58e4-82e7-22b49c2654a0', N'[\"acting_staff\"]', 'EV-0214', 1, '7b9a4042-8424-58b7-8198-05020a9f4830' "
                + "WHERE NOT EXISTS (SELECT 1 FROM NOTIFICATION_MATRIX_ROW WHERE event_code = 'EV-0214');");
            migrationBuilder.Sql(
                "INSERT INTO NOTIFICATION_MATRIX_ROW (row_id, audience, event_code, is_active, template_id) "
                + "SELECT '78308114-e1ee-53b8-bdb3-3218654c51e5', N'[\"record_subject\"]', 'EV-0206', 1, '5456128c-7bcc-5987-b6cd-bcd5992122b7' "
                + "WHERE NOT EXISTS (SELECT 1 FROM NOTIFICATION_MATRIX_ROW WHERE event_code = 'EV-0206');");
            migrationBuilder.Sql(
                "INSERT INTO NOTIFICATION_MATRIX_ROW (row_id, audience, event_code, is_active, template_id) "
                + "SELECT '7e03f3ae-ee91-5c55-81ba-77c8c40c6f92', N'[\"record_subject\"]', 'EV-0515', 1, 'f47aef8a-5d65-5887-a8b9-e00f86ed6a7f' "
                + "WHERE NOT EXISTS (SELECT 1 FROM NOTIFICATION_MATRIX_ROW WHERE event_code = 'EV-0515');");
            migrationBuilder.Sql(
                "INSERT INTO NOTIFICATION_MATRIX_ROW (row_id, audience, event_code, is_active, template_id) "
                + "SELECT '8248304e-b933-5085-beaf-c2f5103e6495', N'[\"record_subject\"]', 'EV-0501', 1, '9c0bdb16-05f4-5668-bc86-07dfbb63814b' "
                + "WHERE NOT EXISTS (SELECT 1 FROM NOTIFICATION_MATRIX_ROW WHERE event_code = 'EV-0501');");
            migrationBuilder.Sql(
                "INSERT INTO NOTIFICATION_MATRIX_ROW (row_id, audience, event_code, is_active, template_id) "
                + "SELECT '8f29f84a-1645-5968-8f79-ae210ca5be6a', N'[\"record_subject\"]', 'EV-0101', 1, 'e4d0fe0b-4271-5594-b11a-d2b419ae6b86' "
                + "WHERE NOT EXISTS (SELECT 1 FROM NOTIFICATION_MATRIX_ROW WHERE event_code = 'EV-0101');");
            migrationBuilder.Sql(
                "INSERT INTO NOTIFICATION_MATRIX_ROW (row_id, audience, event_code, is_active, template_id) "
                + "SELECT '9bfcee11-5c7a-5688-a6e8-dee7ed0ac5ff', N'[\"acting_staff\"]', 'EV-0306', 1, 'aea0ea17-8723-5ac8-a052-5397fa38089a' "
                + "WHERE NOT EXISTS (SELECT 1 FROM NOTIFICATION_MATRIX_ROW WHERE event_code = 'EV-0306');");
            migrationBuilder.Sql(
                "INSERT INTO NOTIFICATION_MATRIX_ROW (row_id, audience, event_code, is_active, template_id) "
                + "SELECT '9cdf3841-82a8-5d3b-8159-4d7481dee044', N'[\"acting_staff\"]', 'EV-0308', 1, '093a7ecf-17cf-5256-819f-e8da4c98e21e' "
                + "WHERE NOT EXISTS (SELECT 1 FROM NOTIFICATION_MATRIX_ROW WHERE event_code = 'EV-0308');");
            migrationBuilder.Sql(
                "INSERT INTO NOTIFICATION_MATRIX_ROW (row_id, audience, event_code, is_active, template_id) "
                + "SELECT '9e293a02-71da-5e5d-8f90-2bcd11a12bea', N'[\"record_subject\"]', 'EV-0201', 1, '00d2c697-9895-5d6e-96a0-9d715b2412be' "
                + "WHERE NOT EXISTS (SELECT 1 FROM NOTIFICATION_MATRIX_ROW WHERE event_code = 'EV-0201');");
            migrationBuilder.Sql(
                "INSERT INTO NOTIFICATION_MATRIX_ROW (row_id, audience, event_code, is_active, template_id) "
                + "SELECT 'a050a977-c44b-5495-b15e-9ad10eaa32df', N'[\"acting_staff\"]', 'EV-0509', 1, 'a0316082-d8e9-5f06-a00c-185cd1d56ac1' "
                + "WHERE NOT EXISTS (SELECT 1 FROM NOTIFICATION_MATRIX_ROW WHERE event_code = 'EV-0509');");
            migrationBuilder.Sql(
                "INSERT INTO NOTIFICATION_MATRIX_ROW (row_id, audience, event_code, is_active, template_id) "
                + "SELECT 'a1949b0e-f245-586f-952a-9b8bbf82880c', N'[\"record_subject\"]', 'EV-0204', 1, '1f3d4334-38a6-5a32-8956-20e46503570d' "
                + "WHERE NOT EXISTS (SELECT 1 FROM NOTIFICATION_MATRIX_ROW WHERE event_code = 'EV-0204');");
            migrationBuilder.Sql(
                "INSERT INTO NOTIFICATION_MATRIX_ROW (row_id, audience, event_code, is_active, template_id) "
                + "SELECT 'acde5dec-3744-5bfd-a0ab-638b06dc09ea', N'[\"record_subject\"]', 'EV-0401', 1, 'cdc7ac91-b27d-59e8-bb9a-82a235b5e70a' "
                + "WHERE NOT EXISTS (SELECT 1 FROM NOTIFICATION_MATRIX_ROW WHERE event_code = 'EV-0401');");
            migrationBuilder.Sql(
                "INSERT INTO NOTIFICATION_MATRIX_ROW (row_id, audience, event_code, is_active, template_id) "
                + "SELECT 'b53bda75-ec56-56e8-9620-1e0b2e338543', N'[\"record_subject\"]', 'EV-0304', 1, '1b7bf85c-74b0-5828-98eb-067ccae9d612' "
                + "WHERE NOT EXISTS (SELECT 1 FROM NOTIFICATION_MATRIX_ROW WHERE event_code = 'EV-0304');");
            migrationBuilder.Sql(
                "INSERT INTO NOTIFICATION_MATRIX_ROW (row_id, audience, event_code, is_active, template_id) "
                + "SELECT 'b7a66f28-134a-5bac-8fb3-474fd3c314de', N'[\"record_subject\", \"staff\"]', 'EV-0303', 1, '9bc73c01-44ea-5ca6-9e10-6d69852ebc4e' "
                + "WHERE NOT EXISTS (SELECT 1 FROM NOTIFICATION_MATRIX_ROW WHERE event_code = 'EV-0303');");
            migrationBuilder.Sql(
                "INSERT INTO NOTIFICATION_MATRIX_ROW (row_id, audience, event_code, is_active, template_id) "
                + "SELECT 'bb7fee8c-ca22-5a31-bca1-d5f34fece5c8', N'[\"record_subject\"]', 'EV-0507', 1, '7abd7606-acd8-5088-9ae4-ae96d31b1be9' "
                + "WHERE NOT EXISTS (SELECT 1 FROM NOTIFICATION_MATRIX_ROW WHERE event_code = 'EV-0507');");
            migrationBuilder.Sql(
                "INSERT INTO NOTIFICATION_MATRIX_ROW (row_id, audience, event_code, is_active, template_id) "
                + "SELECT 'cd1b5a1d-7c2d-5b38-ade9-11f2d7853af6', N'[\"acting_staff\"]', 'EV-0307', 1, '326639ee-e6b7-5a74-9bec-f9028b0dce78' "
                + "WHERE NOT EXISTS (SELECT 1 FROM NOTIFICATION_MATRIX_ROW WHERE event_code = 'EV-0307');");
            migrationBuilder.Sql(
                "INSERT INTO NOTIFICATION_MATRIX_ROW (row_id, audience, event_code, is_active, template_id) "
                + "SELECT 'cf167440-e7f2-509f-bb1a-c56d45c3749f', N'[\"record_subject\"]', 'EV-0212', 1, 'fb0cde34-dc2d-5914-9355-7156c13107a9' "
                + "WHERE NOT EXISTS (SELECT 1 FROM NOTIFICATION_MATRIX_ROW WHERE event_code = 'EV-0212');");
            migrationBuilder.Sql(
                "INSERT INTO NOTIFICATION_MATRIX_ROW (row_id, audience, event_code, is_active, template_id) "
                + "SELECT 'cf3262b1-abb3-5f58-bc0a-8ff0ea8fcea9', N'[\"acting_staff\"]', 'EV-0309', 1, '1594a1ed-6cbb-5a36-b7c9-5ed3ad61b506' "
                + "WHERE NOT EXISTS (SELECT 1 FROM NOTIFICATION_MATRIX_ROW WHERE event_code = 'EV-0309');");
            migrationBuilder.Sql(
                "INSERT INTO NOTIFICATION_MATRIX_ROW (row_id, audience, event_code, is_active, template_id) "
                + "SELECT 'd22d344b-0b4c-51c3-9d09-e3263c0f2477', N'[\"record_subject\", \"staff\"]', 'EV-0302', 1, '26945866-4bea-5c7f-876c-5227b80ba7cd' "
                + "WHERE NOT EXISTS (SELECT 1 FROM NOTIFICATION_MATRIX_ROW WHERE event_code = 'EV-0302');");
            migrationBuilder.Sql(
                "INSERT INTO NOTIFICATION_MATRIX_ROW (row_id, audience, event_code, is_active, template_id) "
                + "SELECT 'd274b255-2999-59ba-9cdd-70265a0ec772', N'[\"record_subject\"]', 'EV-0203', 1, 'b07efcc9-9e99-5721-b682-9a830c0727ce' "
                + "WHERE NOT EXISTS (SELECT 1 FROM NOTIFICATION_MATRIX_ROW WHERE event_code = 'EV-0203');");
            migrationBuilder.Sql(
                "INSERT INTO NOTIFICATION_MATRIX_ROW (row_id, audience, event_code, is_active, template_id) "
                + "SELECT 'd446f3d5-3448-587e-8b8e-4c613844c866', N'[\"record_subject\"]', 'EV-0512', 1, '142952ed-a9ce-5af2-bb9f-4643f169c7e0' "
                + "WHERE NOT EXISTS (SELECT 1 FROM NOTIFICATION_MATRIX_ROW WHERE event_code = 'EV-0512');");
            migrationBuilder.Sql(
                "INSERT INTO NOTIFICATION_MATRIX_ROW (row_id, audience, event_code, is_active, template_id) "
                + "SELECT 'db08c4ec-2d34-5c9b-a1d7-b98c6a42a1d1', N'[\"staff\"]', 'EV-0105', 1, '1d25b574-17bb-563d-b12c-2d4481039c2b' "
                + "WHERE NOT EXISTS (SELECT 1 FROM NOTIFICATION_MATRIX_ROW WHERE event_code = 'EV-0105');");
            migrationBuilder.Sql(
                "INSERT INTO NOTIFICATION_MATRIX_ROW (row_id, audience, event_code, is_active, template_id) "
                + "SELECT 'de2b416e-36f3-5f07-9dbb-2b3e20d7020e', N'[\"acting_staff\"]', 'EV-0217', 1, 'f8d905c7-70f2-583a-bf36-9eb01696ba61' "
                + "WHERE NOT EXISTS (SELECT 1 FROM NOTIFICATION_MATRIX_ROW WHERE event_code = 'EV-0217');");
            migrationBuilder.Sql(
                "INSERT INTO NOTIFICATION_MATRIX_ROW (row_id, audience, event_code, is_active, template_id) "
                + "SELECT 'e1289ace-8dff-528f-b7da-42b20d41f505', N'[\"acting_staff\"]', 'EV-0510', 1, '556cf60c-cf33-5631-b070-a9eecab20652' "
                + "WHERE NOT EXISTS (SELECT 1 FROM NOTIFICATION_MATRIX_ROW WHERE event_code = 'EV-0510');");
            migrationBuilder.Sql(
                "INSERT INTO NOTIFICATION_MATRIX_ROW (row_id, audience, event_code, is_active, template_id) "
                + "SELECT 'f2583c08-9da1-5f3c-8de7-2e575ed9fd5f', N'[\"record_subject\"]', 'EV-0516', 1, '075db772-27e7-5cf7-91ae-321db671f3fe' "
                + "WHERE NOT EXISTS (SELECT 1 FROM NOTIFICATION_MATRIX_ROW WHERE event_code = 'EV-0516');");
            migrationBuilder.Sql(
                "INSERT INTO NOTIFICATION_MATRIX_ROW (row_id, audience, event_code, is_active, template_id) "
                + "SELECT 'f360943e-72e9-5149-9866-e5a050c20219', N'[\"acting_staff\"]', 'EV-0305', 1, '0bcd0f1f-5d70-5dd4-b932-4b2710fd4e5f' "
                + "WHERE NOT EXISTS (SELECT 1 FROM NOTIFICATION_MATRIX_ROW WHERE event_code = 'EV-0305');");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "NOTIFICATION_MATRIX_ROW",
                keyColumn: "row_id",
                keyValue: new Guid("0a843f90-d8a8-5887-9ada-5cf020fbb88b"));

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_MATRIX_ROW",
                keyColumn: "row_id",
                keyValue: new Guid("0d77184b-aef5-56a8-95b0-4d9a8da2a576"));

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_MATRIX_ROW",
                keyColumn: "row_id",
                keyValue: new Guid("0d7d080c-f093-5de2-87ce-204327eef050"));

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_MATRIX_ROW",
                keyColumn: "row_id",
                keyValue: new Guid("10f47da5-9d2d-54ec-82f2-f5350db9eef2"));

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_MATRIX_ROW",
                keyColumn: "row_id",
                keyValue: new Guid("299f08fd-a919-5bc3-ac01-30580db54b5e"));

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_MATRIX_ROW",
                keyColumn: "row_id",
                keyValue: new Guid("2eacd1c4-874a-593c-907f-2be85904cb4b"));

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_MATRIX_ROW",
                keyColumn: "row_id",
                keyValue: new Guid("31b9f4e1-eba4-5ba8-a996-54782433eb03"));

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_MATRIX_ROW",
                keyColumn: "row_id",
                keyValue: new Guid("36114fab-26d0-5813-96e1-8a62c85423d6"));

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_MATRIX_ROW",
                keyColumn: "row_id",
                keyValue: new Guid("39a27893-ff88-559e-919b-78ec37397a60"));

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_MATRIX_ROW",
                keyColumn: "row_id",
                keyValue: new Guid("3a3a203b-8356-5ee0-8a7c-b566a405f196"));

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_MATRIX_ROW",
                keyColumn: "row_id",
                keyValue: new Guid("418b0fa4-54e8-51bc-8a28-04a15d11ea88"));

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_MATRIX_ROW",
                keyColumn: "row_id",
                keyValue: new Guid("50648be2-cdb2-558d-b0f5-73f675258af9"));

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_MATRIX_ROW",
                keyColumn: "row_id",
                keyValue: new Guid("5067d5ca-c8b6-51c6-9b88-06fa97acf1c4"));

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_MATRIX_ROW",
                keyColumn: "row_id",
                keyValue: new Guid("5d8d43e3-d094-5467-9554-fc1de5b74fdf"));

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_MATRIX_ROW",
                keyColumn: "row_id",
                keyValue: new Guid("5edb944c-13b1-5d0a-9ab0-94bf77017cde"));

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_MATRIX_ROW",
                keyColumn: "row_id",
                keyValue: new Guid("672c4ca1-57c1-544b-aed8-76567c0fee8f"));

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_MATRIX_ROW",
                keyColumn: "row_id",
                keyValue: new Guid("6cd078ad-1bd8-5d84-9e62-4c889c2eb280"));

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_MATRIX_ROW",
                keyColumn: "row_id",
                keyValue: new Guid("738a10a3-4d52-5cdc-808c-fb9c0aa558ef"));

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_MATRIX_ROW",
                keyColumn: "row_id",
                keyValue: new Guid("74fe9f94-2e44-59b3-9000-3f4e6cc5962e"));

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_MATRIX_ROW",
                keyColumn: "row_id",
                keyValue: new Guid("776798e3-942f-58e4-82e7-22b49c2654a0"));

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_MATRIX_ROW",
                keyColumn: "row_id",
                keyValue: new Guid("78308114-e1ee-53b8-bdb3-3218654c51e5"));

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_MATRIX_ROW",
                keyColumn: "row_id",
                keyValue: new Guid("7e03f3ae-ee91-5c55-81ba-77c8c40c6f92"));

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_MATRIX_ROW",
                keyColumn: "row_id",
                keyValue: new Guid("8248304e-b933-5085-beaf-c2f5103e6495"));

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_MATRIX_ROW",
                keyColumn: "row_id",
                keyValue: new Guid("8f29f84a-1645-5968-8f79-ae210ca5be6a"));

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_MATRIX_ROW",
                keyColumn: "row_id",
                keyValue: new Guid("9bfcee11-5c7a-5688-a6e8-dee7ed0ac5ff"));

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_MATRIX_ROW",
                keyColumn: "row_id",
                keyValue: new Guid("9cdf3841-82a8-5d3b-8159-4d7481dee044"));

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_MATRIX_ROW",
                keyColumn: "row_id",
                keyValue: new Guid("9e293a02-71da-5e5d-8f90-2bcd11a12bea"));

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_MATRIX_ROW",
                keyColumn: "row_id",
                keyValue: new Guid("a050a977-c44b-5495-b15e-9ad10eaa32df"));

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_MATRIX_ROW",
                keyColumn: "row_id",
                keyValue: new Guid("a1949b0e-f245-586f-952a-9b8bbf82880c"));

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_MATRIX_ROW",
                keyColumn: "row_id",
                keyValue: new Guid("acde5dec-3744-5bfd-a0ab-638b06dc09ea"));

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_MATRIX_ROW",
                keyColumn: "row_id",
                keyValue: new Guid("b53bda75-ec56-56e8-9620-1e0b2e338543"));

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_MATRIX_ROW",
                keyColumn: "row_id",
                keyValue: new Guid("b7a66f28-134a-5bac-8fb3-474fd3c314de"));

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_MATRIX_ROW",
                keyColumn: "row_id",
                keyValue: new Guid("bb7fee8c-ca22-5a31-bca1-d5f34fece5c8"));

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_MATRIX_ROW",
                keyColumn: "row_id",
                keyValue: new Guid("cd1b5a1d-7c2d-5b38-ade9-11f2d7853af6"));

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_MATRIX_ROW",
                keyColumn: "row_id",
                keyValue: new Guid("cf167440-e7f2-509f-bb1a-c56d45c3749f"));

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_MATRIX_ROW",
                keyColumn: "row_id",
                keyValue: new Guid("cf3262b1-abb3-5f58-bc0a-8ff0ea8fcea9"));

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_MATRIX_ROW",
                keyColumn: "row_id",
                keyValue: new Guid("d22d344b-0b4c-51c3-9d09-e3263c0f2477"));

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_MATRIX_ROW",
                keyColumn: "row_id",
                keyValue: new Guid("d274b255-2999-59ba-9cdd-70265a0ec772"));

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_MATRIX_ROW",
                keyColumn: "row_id",
                keyValue: new Guid("d446f3d5-3448-587e-8b8e-4c613844c866"));

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_MATRIX_ROW",
                keyColumn: "row_id",
                keyValue: new Guid("db08c4ec-2d34-5c9b-a1d7-b98c6a42a1d1"));

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_MATRIX_ROW",
                keyColumn: "row_id",
                keyValue: new Guid("de2b416e-36f3-5f07-9dbb-2b3e20d7020e"));

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_MATRIX_ROW",
                keyColumn: "row_id",
                keyValue: new Guid("e1289ace-8dff-528f-b7da-42b20d41f505"));

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_MATRIX_ROW",
                keyColumn: "row_id",
                keyValue: new Guid("f2583c08-9da1-5f3c-8de7-2e575ed9fd5f"));

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_MATRIX_ROW",
                keyColumn: "row_id",
                keyValue: new Guid("f360943e-72e9-5149-9866-e5a050c20219"));

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_TEMPLATE",
                keyColumn: "template_id",
                keyValue: new Guid("212c220d-7e82-5489-87f6-ee88b51b890a"));

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_TEMPLATE",
                keyColumn: "template_id",
                keyValue: new Guid("22dcf9cb-7627-5897-b880-f1d4bb3052b8"));

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_TEMPLATE",
                keyColumn: "template_id",
                keyValue: new Guid("22ff2145-97de-5dc7-a2c4-bb1412988a00"));

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_TEMPLATE",
                keyColumn: "template_id",
                keyValue: new Guid("2ccc8c3a-b37e-57a3-9c2c-ae665adc240a"));

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_TEMPLATE",
                keyColumn: "template_id",
                keyValue: new Guid("30e985bd-e88d-5323-abf0-9473bf883d8a"));

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_TEMPLATE",
                keyColumn: "template_id",
                keyValue: new Guid("371b0d7a-4008-5855-b7b2-9108d17e98be"));

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_TEMPLATE",
                keyColumn: "template_id",
                keyValue: new Guid("5129d61e-1487-5909-99c5-913f8a1ad7e2"));

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_TEMPLATE",
                keyColumn: "template_id",
                keyValue: new Guid("54a68362-205a-53f7-bb43-a538db7681fe"));

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_TEMPLATE",
                keyColumn: "template_id",
                keyValue: new Guid("576bcbe3-7cc1-5a02-90df-2c94d00989f6"));

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_TEMPLATE",
                keyColumn: "template_id",
                keyValue: new Guid("57bbc3bb-00af-51b1-976a-baa0408e038b"));

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_TEMPLATE",
                keyColumn: "template_id",
                keyValue: new Guid("5e471bb8-892e-59fd-9a2c-7a1899948bb7"));

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_TEMPLATE",
                keyColumn: "template_id",
                keyValue: new Guid("6eb29e81-a0d2-509e-86f2-6b326a510f59"));

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_TEMPLATE",
                keyColumn: "template_id",
                keyValue: new Guid("6eef4954-5355-5841-b8e4-700b4c153030"));

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_TEMPLATE",
                keyColumn: "template_id",
                keyValue: new Guid("6f0835f5-f4ac-5e9a-81bf-c722402eceaf"));

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_TEMPLATE",
                keyColumn: "template_id",
                keyValue: new Guid("70c88d12-443b-5816-b299-c738d6321339"));

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_TEMPLATE",
                keyColumn: "template_id",
                keyValue: new Guid("7a511e05-b62f-57a9-9b12-e1987dca47e2"));

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_TEMPLATE",
                keyColumn: "template_id",
                keyValue: new Guid("7ab9ee6e-dbb9-57a0-af2b-9612d36a894c"));

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_TEMPLATE",
                keyColumn: "template_id",
                keyValue: new Guid("86d43258-4aeb-5fef-a566-fc0456fbf421"));

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_TEMPLATE",
                keyColumn: "template_id",
                keyValue: new Guid("8dfad49a-38da-56a0-a446-e1fd320663bd"));

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_TEMPLATE",
                keyColumn: "template_id",
                keyValue: new Guid("9ddbc393-f773-5862-aab8-d94d28a5e280"));

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_TEMPLATE",
                keyColumn: "template_id",
                keyValue: new Guid("a307f12a-f282-51ec-a967-422cf2579cb3"));

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_TEMPLATE",
                keyColumn: "template_id",
                keyValue: new Guid("ae8b6c56-ca5c-5d9e-b522-4614aa47c51a"));

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_TEMPLATE",
                keyColumn: "template_id",
                keyValue: new Guid("b021ce95-978a-5a72-bac6-f621a87c5adb"));

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_TEMPLATE",
                keyColumn: "template_id",
                keyValue: new Guid("b577d872-ff0e-506c-ac39-757ebc0f4289"));

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_TEMPLATE",
                keyColumn: "template_id",
                keyValue: new Guid("d058f110-37af-5101-9628-764eb9e1287a"));

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_TEMPLATE",
                keyColumn: "template_id",
                keyValue: new Guid("dddfd5e0-6eec-524f-bb1d-5a6d5e7313e4"));

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_TEMPLATE",
                keyColumn: "template_id",
                keyValue: new Guid("df8f3358-16ed-5f99-836b-1f294a7065ab"));

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_EVENT",
                keyColumn: "event_code",
                keyValue: "EV-0105");

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_EVENT",
                keyColumn: "event_code",
                keyValue: "EV-0205");

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_EVENT",
                keyColumn: "event_code",
                keyValue: "EV-0206");

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_EVENT",
                keyColumn: "event_code",
                keyValue: "EV-0207");

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_EVENT",
                keyColumn: "event_code",
                keyValue: "EV-0208");

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_EVENT",
                keyColumn: "event_code",
                keyValue: "EV-0210");

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_EVENT",
                keyColumn: "event_code",
                keyValue: "EV-0211");

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_EVENT",
                keyColumn: "event_code",
                keyValue: "EV-0212");

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_EVENT",
                keyColumn: "event_code",
                keyValue: "EV-0213");

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_EVENT",
                keyColumn: "event_code",
                keyValue: "EV-0214");

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_EVENT",
                keyColumn: "event_code",
                keyValue: "EV-0215");

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_EVENT",
                keyColumn: "event_code",
                keyValue: "EV-0217");

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_EVENT",
                keyColumn: "event_code",
                keyValue: "EV-0305");

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_EVENT",
                keyColumn: "event_code",
                keyValue: "EV-0306");

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_EVENT",
                keyColumn: "event_code",
                keyValue: "EV-0307");

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_EVENT",
                keyColumn: "event_code",
                keyValue: "EV-0308");

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_EVENT",
                keyColumn: "event_code",
                keyValue: "EV-0309");

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_EVENT",
                keyColumn: "event_code",
                keyValue: "EV-0310");

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_EVENT",
                keyColumn: "event_code",
                keyValue: "EV-0311");

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_EVENT",
                keyColumn: "event_code",
                keyValue: "EV-0312");

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_EVENT",
                keyColumn: "event_code",
                keyValue: "EV-0401");

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_EVENT",
                keyColumn: "event_code",
                keyValue: "EV-0509");

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_EVENT",
                keyColumn: "event_code",
                keyValue: "EV-0510");

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_EVENT",
                keyColumn: "event_code",
                keyValue: "EV-0511");

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_EVENT",
                keyColumn: "event_code",
                keyValue: "EV-0512");

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_EVENT",
                keyColumn: "event_code",
                keyValue: "EV-0513");

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_EVENT",
                keyColumn: "event_code",
                keyValue: "EV-0515");

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_EVENT",
                keyColumn: "event_code",
                keyValue: "EV-0516");

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_EVENT",
                keyColumn: "event_code",
                keyValue: "EV-0801");

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_TEMPLATE",
                keyColumn: "template_id",
                keyValue: new Guid("00d2c697-9895-5d6e-96a0-9d715b2412be"));

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_TEMPLATE",
                keyColumn: "template_id",
                keyValue: new Guid("075db772-27e7-5cf7-91ae-321db671f3fe"));

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_TEMPLATE",
                keyColumn: "template_id",
                keyValue: new Guid("093a7ecf-17cf-5256-819f-e8da4c98e21e"));

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_TEMPLATE",
                keyColumn: "template_id",
                keyValue: new Guid("0bcd0f1f-5d70-5dd4-b932-4b2710fd4e5f"));

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_TEMPLATE",
                keyColumn: "template_id",
                keyValue: new Guid("142952ed-a9ce-5af2-bb9f-4643f169c7e0"));

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_TEMPLATE",
                keyColumn: "template_id",
                keyValue: new Guid("1594a1ed-6cbb-5a36-b7c9-5ed3ad61b506"));

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_TEMPLATE",
                keyColumn: "template_id",
                keyValue: new Guid("1b7bf85c-74b0-5828-98eb-067ccae9d612"));

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_TEMPLATE",
                keyColumn: "template_id",
                keyValue: new Guid("1d25b574-17bb-563d-b12c-2d4481039c2b"));

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_TEMPLATE",
                keyColumn: "template_id",
                keyValue: new Guid("1dc65a00-ce01-5ba1-ad64-0b4762dce4d3"));

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_TEMPLATE",
                keyColumn: "template_id",
                keyValue: new Guid("1f3d4334-38a6-5a32-8956-20e46503570d"));

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_TEMPLATE",
                keyColumn: "template_id",
                keyValue: new Guid("26945866-4bea-5c7f-876c-5227b80ba7cd"));

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_TEMPLATE",
                keyColumn: "template_id",
                keyValue: new Guid("326639ee-e6b7-5a74-9bec-f9028b0dce78"));

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_TEMPLATE",
                keyColumn: "template_id",
                keyValue: new Guid("3b667fa6-a011-5469-8441-1baec028540c"));

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_TEMPLATE",
                keyColumn: "template_id",
                keyValue: new Guid("4333a775-1fbc-532e-8fc5-629b18189078"));

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_TEMPLATE",
                keyColumn: "template_id",
                keyValue: new Guid("43c8d6ee-81a7-516e-8c40-17163be16154"));

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_TEMPLATE",
                keyColumn: "template_id",
                keyValue: new Guid("43d4e2f6-4893-57a4-80d0-adad5403f8d5"));

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_TEMPLATE",
                keyColumn: "template_id",
                keyValue: new Guid("4c5f9336-bed6-5e07-91b5-ea1fe55ef0ef"));

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_TEMPLATE",
                keyColumn: "template_id",
                keyValue: new Guid("4eca8e8b-610c-52a9-9b63-6e01bcc1d714"));

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_TEMPLATE",
                keyColumn: "template_id",
                keyValue: new Guid("4fb9561d-f56a-58fc-a7a3-757904cba23b"));

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_TEMPLATE",
                keyColumn: "template_id",
                keyValue: new Guid("5456128c-7bcc-5987-b6cd-bcd5992122b7"));

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_TEMPLATE",
                keyColumn: "template_id",
                keyValue: new Guid("556cf60c-cf33-5631-b070-a9eecab20652"));

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_TEMPLATE",
                keyColumn: "template_id",
                keyValue: new Guid("672b3c7e-b33e-5889-97b8-6d50d99a6f06"));

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_TEMPLATE",
                keyColumn: "template_id",
                keyValue: new Guid("73ba0ad2-3de2-5d2f-9f41-c6c4a8c74283"));

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_TEMPLATE",
                keyColumn: "template_id",
                keyValue: new Guid("7abd7606-acd8-5088-9ae4-ae96d31b1be9"));

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_TEMPLATE",
                keyColumn: "template_id",
                keyValue: new Guid("7b9a4042-8424-58b7-8198-05020a9f4830"));

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_TEMPLATE",
                keyColumn: "template_id",
                keyValue: new Guid("9b0cd31c-c124-5db0-ad41-e0cc422a06f4"));

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_TEMPLATE",
                keyColumn: "template_id",
                keyValue: new Guid("9bc73c01-44ea-5ca6-9e10-6d69852ebc4e"));

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_TEMPLATE",
                keyColumn: "template_id",
                keyValue: new Guid("9c0bdb16-05f4-5668-bc86-07dfbb63814b"));

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_TEMPLATE",
                keyColumn: "template_id",
                keyValue: new Guid("a0316082-d8e9-5f06-a00c-185cd1d56ac1"));

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_TEMPLATE",
                keyColumn: "template_id",
                keyValue: new Guid("aea0ea17-8723-5ac8-a052-5397fa38089a"));

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_TEMPLATE",
                keyColumn: "template_id",
                keyValue: new Guid("b07efcc9-9e99-5721-b682-9a830c0727ce"));

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_TEMPLATE",
                keyColumn: "template_id",
                keyValue: new Guid("b2304dc0-5083-5102-af18-cc4b36d7770d"));

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_TEMPLATE",
                keyColumn: "template_id",
                keyValue: new Guid("bb63a843-937d-5055-a644-6645da542cee"));

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_TEMPLATE",
                keyColumn: "template_id",
                keyValue: new Guid("cdc7ac91-b27d-59e8-bb9a-82a235b5e70a"));

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_TEMPLATE",
                keyColumn: "template_id",
                keyValue: new Guid("d30f8f56-6c26-5aeb-a284-03ae0cd6edef"));

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_TEMPLATE",
                keyColumn: "template_id",
                keyValue: new Guid("dd12b23b-36f6-5c55-b2ac-1cb1c8c492a3"));

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_TEMPLATE",
                keyColumn: "template_id",
                keyValue: new Guid("e490430b-321c-5775-821e-4f1e5aab06c6"));

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_TEMPLATE",
                keyColumn: "template_id",
                keyValue: new Guid("e4d0fe0b-4271-5594-b11a-d2b419ae6b86"));

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_TEMPLATE",
                keyColumn: "template_id",
                keyValue: new Guid("f29771f3-12bb-5c09-9280-1ffceb5d8140"));

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_TEMPLATE",
                keyColumn: "template_id",
                keyValue: new Guid("f30f2f1d-1031-599f-a6f3-6f923925975d"));

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_TEMPLATE",
                keyColumn: "template_id",
                keyValue: new Guid("f47aef8a-5d65-5887-a8b9-e00f86ed6a7f"));

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_TEMPLATE",
                keyColumn: "template_id",
                keyValue: new Guid("f8d905c7-70f2-583a-bf36-9eb01696ba61"));

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_TEMPLATE",
                keyColumn: "template_id",
                keyValue: new Guid("fb0cde34-dc2d-5914-9355-7156c13107a9"));

            migrationBuilder.DeleteData(
                table: "NOTIFICATION_TEMPLATE",
                keyColumn: "template_id",
                keyValue: new Guid("ffe3ca70-3346-5811-8a6b-5148156cedc7"));

            migrationBuilder.AlterColumn<Guid>(
                name: "updated_by",
                table: "NOTIFICATION_TEMPLATE",
                type: "uniqueidentifier",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier",
                oldNullable: true);
        }
    }
}
