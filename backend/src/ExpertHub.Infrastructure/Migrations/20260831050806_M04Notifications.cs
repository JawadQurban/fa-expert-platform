using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace ExpertHub.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class M04Notifications : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "NOTIFICATION_EVENT",
                columns: table => new
                {
                    event_code = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    capability_code = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    name_ar = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                    name_en = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                    source = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    journey_audience_ar = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    journey_audience_en = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NOTIFICATION_EVENT", x => x.event_code);
                });

            migrationBuilder.CreateTable(
                name: "NOTIFICATION_TEMPLATE",
                columns: table => new
                {
                    template_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    code = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    subject_ar = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    subject_en = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    body_ar = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    body_en = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    placeholders = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    version = table.Column<int>(type: "int", nullable: false),
                    status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    updated_at = table.Column<DateTime>(type: "datetime2", nullable: false),
                    updated_by = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NOTIFICATION_TEMPLATE", x => x.template_id);
                    table.ForeignKey(
                        name: "FK_NOTIFICATION_TEMPLATE_APP_USER_updated_by",
                        column: x => x.updated_by,
                        principalTable: "APP_USER",
                        principalColumn: "user_id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "SLA_MATRIX_ROW",
                columns: table => new
                {
                    sla_id = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    capability_code = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    action_code = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    name_ar = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                    name_en = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                    source = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                    on_breach_ar = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    on_breach_en = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    status = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    duration = table.Column<int>(type: "int", nullable: true),
                    unit = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    reminder_offsets = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    sort_order = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SLA_MATRIX_ROW", x => x.sla_id);
                });

            migrationBuilder.CreateTable(
                name: "NOTIFICATION_LOG",
                columns: table => new
                {
                    log_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    event_code = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    recipient_user_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    channel = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    language = table.Column<string>(type: "nvarchar(5)", maxLength: 5, nullable: false),
                    template_code = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    template_version = table.Column<int>(type: "int", nullable: false),
                    send_status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    failure_reason = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    source_entity_id = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    sent_at = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NOTIFICATION_LOG", x => x.log_id);
                    table.ForeignKey(
                        name: "FK_NOTIFICATION_LOG_APP_USER_recipient_user_id",
                        column: x => x.recipient_user_id,
                        principalTable: "APP_USER",
                        principalColumn: "user_id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_NOTIFICATION_LOG_NOTIFICATION_EVENT_event_code",
                        column: x => x.event_code,
                        principalTable: "NOTIFICATION_EVENT",
                        principalColumn: "event_code",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "NOTIFICATION_MATRIX_ROW",
                columns: table => new
                {
                    row_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    event_code = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    template_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    audience = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    is_active = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NOTIFICATION_MATRIX_ROW", x => x.row_id);
                    table.ForeignKey(
                        name: "FK_NOTIFICATION_MATRIX_ROW_NOTIFICATION_EVENT_event_code",
                        column: x => x.event_code,
                        principalTable: "NOTIFICATION_EVENT",
                        principalColumn: "event_code",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_NOTIFICATION_MATRIX_ROW_NOTIFICATION_TEMPLATE_template_id",
                        column: x => x.template_id,
                        principalTable: "NOTIFICATION_TEMPLATE",
                        principalColumn: "template_id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "SLA_INSTANCE",
                columns: table => new
                {
                    instance_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    sla_id = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    entity_type = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    entity_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    started_at = table.Column<DateTime>(type: "datetime2", nullable: false),
                    due_at = table.Column<DateTime>(type: "datetime2", nullable: false),
                    state = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    resolved_at = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SLA_INSTANCE", x => x.instance_id);
                    table.ForeignKey(
                        name: "FK_SLA_INSTANCE_SLA_MATRIX_ROW_sla_id",
                        column: x => x.sla_id,
                        principalTable: "SLA_MATRIX_ROW",
                        principalColumn: "sla_id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.InsertData(
                table: "NOTIFICATION_EVENT",
                columns: new[] { "event_code", "capability_code", "journey_audience_ar", "journey_audience_en", "name_ar", "name_en", "source" },
                values: new object[,]
                {
                    { "EV-0101", "CAP-01", "مقدّم الطلب — «إشعار داخل المنصة وإشعار بالبريد».", "The applicant — “in-app + notification”.", "تأكيد استلام طلب الانضمام", "Application submission confirmed", "J-01 — user flow 7" },
                    { "EV-0102", "CAP-01", "المرشَّح، فورًا عند تقديم الموظف للطلب — «بقالب مختلف عن تأكيد التقديم الذاتي».", "The nominee, immediately on staff submission — “a distinct template from the self-submission confirmation”.", "دعوة تفعيل لمرشَّح داخليًا", "Activation invitation for an internally nominated applicant", "J-02/F3/AC-1 + AC-2" },
                    { "EV-0103", "CAP-01", "المدرب — يُشعَر بالاعتماد وبالملحق المحدَّث.", "The trainer — notified of the approval and the updated addendum.", "اعتماد طلب إضافة خدمة بعد رفع الملحق", "Add-service request approved, addendum live", "J-03/F3/AC-6" },
                    { "EV-0104", "CAP-01", "المدرب — يُشعَر بالنتيجة **دون سبب الرفض**.", "The trainer — notified of the outcome **without the rejection reason**.", "رفض طلب إضافة خدمة", "Add-service request rejected", "J-03/F3/AC-7" },
                    { "EV-0201", "CAP-02", "مقدّم الطلب — بريد وإشعار داخل المنصة معًا؛ والاختيار يتم من البوابة لا من البريد.", "The applicant — email and in-platform together; the choice is made in the portal, never in the email.", "توفّر مواعيد المقابلة", "Interview slots available", "J-06/F1/AC-1 (BR-0206)" },
                    { "EV-0202", "CAP-02", "مقدّم الطلب — «تذكيرات تُرسل وفق مصفوفة الإشعارات».", "The applicant — “reminders sent per the Notification Matrix”.", "تذكير باختيار موعد المقابلة", "Reminder to choose an interview slot", "J-06/F1/AC-4" },
                    { "EV-0203", "CAP-02", "مقدّم الطلب وأعضاء اللجنة — دعوة الاجتماع مع إشعار مواز في المنصة بنفس الوقت والرابط.", "The applicant and the committee members — the meeting invite plus a parallel in-platform notification carrying the same time and link.", "تأكيد موعد المقابلة ودعوة الاجتماع", "Interview slot confirmed, meeting invitation issued", "J-06 — user flow 5" },
                    { "EV-0204", "CAP-02", "مقدّم الطلب — يستلم الاتفاقية الموقّعة داخليًا بالكامل عبر إشعار.", "The applicant — receives the fully internally-signed agreement via notification.", "الاتفاقية جاهزة لتوقيع المتقدم", "Agreement ready for the applicant to sign", "J-11 — user flow 1 + F1/AC-1" },
                    { "EV-0301", "CAP-03", "المدرب وموظفو إدارة المدربين معًا.", "Both the trainer and Trainer Management staff.", "تنبيه قرب انتهاء الاتفاقية — 90 يومًا", "Agreement expiry alert — 90 days", "J-12/F1/AC-2 (BR-0303)" },
                    { "EV-0302", "CAP-03", "المدرب وموظفو إدارة المدربين معًا.", "Both the trainer and Trainer Management staff.", "تنبيه قرب انتهاء الاتفاقية — 30 يومًا", "Agreement expiry alert — 30 days", "J-12/F1/AC-3 (BR-0303, extended)" },
                    { "EV-0303", "CAP-03", "المدرب وموظفو إدارة المدربين معًا — التنبيه الأخير.", "Both the trainer and Trainer Management staff — the final alert.", "تنبيه قرب انتهاء الاتفاقية — 5 أيام", "Agreement expiry alert — 5 days", "J-12/F1/AC-4 (BR-0303, extended)" },
                    { "EV-0304", "CAP-03", "المدرب — مع المدة الجديدة صراحةً في نص الإشعار.", "The trainer — with the new duration stated in the message.", "تجديد الاتفاقية", "Agreement renewed", "J-12/F2/AC-3" },
                    { "EV-0501", "CAP-05", "المرشح الأعلى ترتيبًا **وحده** لكل فتحة؛ المرشحون الاحتياطيون لا يُشعَرون حتى يأتي دورهم.", "The top-ranked candidate **only**, per slot; backup candidates receive nothing until their turn.", "عرض إسناد للمرشح الأعلى ترتيبًا", "Assignment offer sent to the top-ranked candidate", "J-18/F1/AC-1 + AC-2" },
                    { "EV-0502", "CAP-05", "الموظفون — فورًا.", "Staff — immediately.", "رفض صريح لعرض الإسناد", "Assignment offer explicitly rejected", "J-18/F2/AC-2 (BR-0507)" },
                    { "EV-0503", "CAP-05", "الموظف الذي رشّح المرشحين **تحديدًا** — «إشعار مستقل عن إشعار الرفض الصريح».", "The staff member who nominated the candidates **specifically** — “a distinct notification from explicit rejection”.", "انتهاء مهلة عرض الإسناد دون رد", "Assignment offer expired with no response", "J-18/F2/AC-4" },
                    { "EV-0504", "CAP-05", "الموظفون — «إشعار مستقل عن إشعار رفض أو انتهاء مهلة مرشح واحد».", "Staff — “distinct from a single candidate’s rejection/expiry notification”.", "استنفاد كل مرشحي الفتحة", "Slot exhausted all approved candidates", "J-19/F1/AC-2" },
                    { "EV-0505", "CAP-05", "المدرب — إشعار فوري بالتغيير.", "The trainer — an immediate notification of the change.", "تغيير مواعيد البرنامج في فاست", "Programme dates changed in FAST", "J-21/F1/AC-3" },
                    { "EV-0506", "CAP-05", "الموظف المسؤول — فورًا.", "The responsible staff member — immediately.", "اعتذار المدرب عن ارتباط", "Trainer withdrew from an engagement", "J-22/F1/AC-4" },
                    { "EV-0507", "CAP-05", "المدرب — مع السبب المختار.", "The trainer — along with the selected reason.", "فك ارتباط المدرب من قِبل الإدارة", "Staff de-linked a trainer from an engagement", "J-22/F2/AC-4" },
                    { "EV-0508", "CAP-05", "كل مدرب مرتبط بالخطة — مع توضيح أن السبب هو إلغاء الأكاديمية للخطة بالكامل.", "Every linked trainer — clarifying the reason is the Academy’s full cancellation of the plan.", "إلغاء الخطة بالكامل من فاست", "Plan fully cancelled in FAST", "J-22/F3/AC-4" }
                });

            migrationBuilder.InsertData(
                table: "SLA_MATRIX_ROW",
                columns: new[] { "sla_id", "action_code", "capability_code", "duration", "name_ar", "name_en", "on_breach_ar", "on_breach_en", "reminder_offsets", "sort_order", "source", "status", "unit" },
                values: new object[,]
                {
                    { "SLA-0201", "interview-slot-selection", "CAP-02", 3, "اختيار مقدّم الطلب لموعد المقابلة", "Applicant selects an interview slot", "لم تنص الرحلة على أثر انتهاء المهلة.", "The journey does not state what happens when it runs out.", "[]", 1, "J-06/F1/AC-4", "fixed", "business-days" },
                    { "SLA-0202", "screening-decision", "CAP-02", null, "إنجاز قرار الفرز", "Screening decision completed", "غير محدد.", "Not defined.", null, 4, "J-05 — user flow 5 shows “remaining SLA time”, with no duration", "undefined-duration", null },
                    { "SLA-0203", "applicant-signature-no-response", "CAP-02", null, "عدم رد المتقدم على الاتفاقية", "Applicant does not respond to the agreement", "غير محدد.", "Not defined.", null, 5, "J-11 — open item 1, deferred to “the full SLA matrix”", "undefined-duration", null },
                    { "SLA-0301", "agreement-expiry", "CAP-03", null, "قرب انتهاء الاتفاقية", "Agreement approaching expiry", "تنتهي الاتفاقية في تاريخها؛ التجديد إجراء إداري مستقل (J-12/F2).", "The agreement expires on its date; renewal is a separate administrative act.", "[90, 30, 5]", 3, "J-12/F1/AC-2→AC-4 (BR-0303, extended)", "record-derived", null },
                    { "SLA-0501", "assignment-offer-response", "CAP-05", 3, "رد المرشح على عرض الإسناد", "Candidate responds to an assignment offer", "ينتهي العرض تلقائيًا وينتقل إلى المرشح التالي في الترتيب.", "The offer expires automatically and moves to the next-ranked candidate.", "[]", 2, "J-18/F2 — Candidate Response SLA + AC-1/AC-3", "fixed", "days" },
                    { "SLA-2001", "material-review", null, null, "مراجعة المواد والمحتوى", "Material & content review", "غير محدد.", "Not defined.", null, 6, "J-20 — open item 1, “not currently defined” for both paths", "undefined-duration", null }
                });

            migrationBuilder.CreateIndex(
                name: "IX_NOTIFICATION_LOG_event_code",
                table: "NOTIFICATION_LOG",
                column: "event_code");

            migrationBuilder.CreateIndex(
                name: "IX_NOTIFICATION_LOG_recipient_user_id",
                table: "NOTIFICATION_LOG",
                column: "recipient_user_id");

            migrationBuilder.CreateIndex(
                name: "IX_NOTIFICATION_LOG_sent_at",
                table: "NOTIFICATION_LOG",
                column: "sent_at");

            migrationBuilder.CreateIndex(
                name: "IX_NOTIFICATION_MATRIX_ROW_event_code",
                table: "NOTIFICATION_MATRIX_ROW",
                column: "event_code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_NOTIFICATION_MATRIX_ROW_template_id",
                table: "NOTIFICATION_MATRIX_ROW",
                column: "template_id");

            migrationBuilder.CreateIndex(
                name: "IX_NOTIFICATION_TEMPLATE_updated_by",
                table: "NOTIFICATION_TEMPLATE",
                column: "updated_by");

            migrationBuilder.CreateIndex(
                name: "IX_SLA_INSTANCE_entity_type_entity_id",
                table: "SLA_INSTANCE",
                columns: new[] { "entity_type", "entity_id" });

            migrationBuilder.CreateIndex(
                name: "IX_SLA_INSTANCE_sla_id",
                table: "SLA_INSTANCE",
                column: "sla_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "NOTIFICATION_LOG");

            migrationBuilder.DropTable(
                name: "NOTIFICATION_MATRIX_ROW");

            migrationBuilder.DropTable(
                name: "SLA_INSTANCE");

            migrationBuilder.DropTable(
                name: "NOTIFICATION_EVENT");

            migrationBuilder.DropTable(
                name: "NOTIFICATION_TEMPLATE");

            migrationBuilder.DropTable(
                name: "SLA_MATRIX_ROW");
        }
    }
}
