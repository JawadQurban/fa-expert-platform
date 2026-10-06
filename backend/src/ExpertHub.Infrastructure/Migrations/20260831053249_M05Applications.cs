using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace ExpertHub.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class M05Applications : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "FORM_SCHEMA",
                columns: table => new
                {
                    schema_version = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    selectable_services = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    published_at = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FORM_SCHEMA", x => x.schema_version);
                });

            migrationBuilder.CreateTable(
                name: "APPLICATION",
                columns: table => new
                {
                    application_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    applicant_user_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    schema_version = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    reference = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    status = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    origin = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    nominated_by = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    activation_token = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    rejection_reason = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false),
                    submitted_at = table.Column<DateTime>(type: "datetime2", nullable: true),
                    updated_at = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_APPLICATION", x => x.application_id);
                    table.ForeignKey(
                        name: "FK_APPLICATION_APP_USER_applicant_user_id",
                        column: x => x.applicant_user_id,
                        principalTable: "APP_USER",
                        principalColumn: "user_id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_APPLICATION_FORM_SCHEMA_schema_version",
                        column: x => x.schema_version,
                        principalTable: "FORM_SCHEMA",
                        principalColumn: "schema_version",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ATTACHMENT_RULE",
                columns: table => new
                {
                    rule_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    schema_version = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    rule_code = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: false),
                    label_ar = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                    label_en = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                    accepted_formats = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    max_size_mb = table.Column<int>(type: "int", nullable: false),
                    max_count = table.Column<int>(type: "int", nullable: false),
                    required_for_services = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ATTACHMENT_RULE", x => x.rule_id);
                    table.ForeignKey(
                        name: "FK_ATTACHMENT_RULE_FORM_SCHEMA_schema_version",
                        column: x => x.schema_version,
                        principalTable: "FORM_SCHEMA",
                        principalColumn: "schema_version",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "FORM_FIELD",
                columns: table => new
                {
                    field_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    schema_version = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    field_code = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: false),
                    section_code = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    label_ar = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                    label_en = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                    input_type = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    order_index = table.Column<int>(type: "int", nullable: false),
                    definition = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FORM_FIELD", x => x.field_id);
                    table.ForeignKey(
                        name: "FK_FORM_FIELD_FORM_SCHEMA_schema_version",
                        column: x => x.schema_version,
                        principalTable: "FORM_SCHEMA",
                        principalColumn: "schema_version",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "FORM_SECTION",
                columns: table => new
                {
                    section_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    schema_version = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    section_code = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    title_ar = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    title_en = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    order_index = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FORM_SECTION", x => x.section_id);
                    table.ForeignKey(
                        name: "FK_FORM_SECTION_FORM_SCHEMA_schema_version",
                        column: x => x.schema_version,
                        principalTable: "FORM_SCHEMA",
                        principalColumn: "schema_version",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "APPLICATION_ATTACHMENT",
                columns: table => new
                {
                    application_attachment_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    application_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    rule_code = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: false),
                    file_name = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    size_bytes = table.Column<long>(type: "bigint", nullable: false),
                    attachment_id = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_APPLICATION_ATTACHMENT", x => x.application_attachment_id);
                    table.ForeignKey(
                        name: "FK_APPLICATION_ATTACHMENT_APPLICATION_application_id",
                        column: x => x.application_id,
                        principalTable: "APPLICATION",
                        principalColumn: "application_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_APPLICATION_ATTACHMENT_ATTACHMENT_attachment_id",
                        column: x => x.attachment_id,
                        principalTable: "ATTACHMENT",
                        principalColumn: "attachment_id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "APPLICATION_FIELD_VALUE",
                columns: table => new
                {
                    value_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    application_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    field_code = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: false),
                    value = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_APPLICATION_FIELD_VALUE", x => x.value_id);
                    table.ForeignKey(
                        name: "FK_APPLICATION_FIELD_VALUE_APPLICATION_application_id",
                        column: x => x.application_id,
                        principalTable: "APPLICATION",
                        principalColumn: "application_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "APPLICATION_SERVICE",
                columns: table => new
                {
                    application_service_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    application_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    service = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    outcome = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    decided_at = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_APPLICATION_SERVICE", x => x.application_service_id);
                    table.ForeignKey(
                        name: "FK_APPLICATION_SERVICE_APPLICATION_application_id",
                        column: x => x.application_id,
                        principalTable: "APPLICATION",
                        principalColumn: "application_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SERVICE_REQUEST",
                columns: table => new
                {
                    service_request_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    application_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    trainer_user_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    reference = table.Column<string>(type: "nvarchar(24)", maxLength: 24, nullable: false),
                    requested_service = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    delta_field_values = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    delta_attachments = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    decision = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    rejection_reason_id = table.Column<string>(type: "nvarchar(60)", maxLength: 60, nullable: true),
                    rejection_reason_text = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    addendum_file_name = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    decision_note = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    decided_by = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    decided_at = table.Column<DateTime>(type: "datetime2", nullable: true),
                    submitted_at = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SERVICE_REQUEST", x => x.service_request_id);
                    table.ForeignKey(
                        name: "FK_SERVICE_REQUEST_APPLICATION_application_id",
                        column: x => x.application_id,
                        principalTable: "APPLICATION",
                        principalColumn: "application_id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_SERVICE_REQUEST_APP_USER_decided_by",
                        column: x => x.decided_by,
                        principalTable: "APP_USER",
                        principalColumn: "user_id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_SERVICE_REQUEST_APP_USER_trainer_user_id",
                        column: x => x.trainer_user_id,
                        principalTable: "APP_USER",
                        principalColumn: "user_id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.InsertData(
                table: "FORM_SCHEMA",
                columns: new[] { "schema_version", "published_at", "selectable_services", "status" },
                values: new object[] { "dm-gap-01.2026-08-30", new DateTime(2026, 8, 30, 0, 0, 0, 0, DateTimeKind.Utc), "[\"trainer\",\"consultant\",\"content-developer\",\"question-writer\"]", "published" });

            migrationBuilder.InsertData(
                table: "ATTACHMENT_RULE",
                columns: new[] { "rule_id", "accepted_formats", "label_ar", "label_en", "max_count", "max_size_mb", "required_for_services", "rule_code", "schema_version" },
                values: new object[,]
                {
                    { new Guid("fa000000-0000-0000-0000-000000000001"), "[\"jpg\",\"jpeg\",\"png\"]", "الصورة الشخصية", "Profile picture", 1, 1, "[]", "photo", "dm-gap-01.2026-08-30" },
                    { new Guid("fa000000-0000-0000-0000-000000000002"), "[\"pdf\",\"doc\",\"docx\"]", "السيرة الذاتية", "CV / résumé", 1, 1, "[\"trainer\",\"consultant\",\"content-developer\",\"question-writer\"]", "cv", "dm-gap-01.2026-08-30" },
                    { new Guid("fa000000-0000-0000-0000-000000000003"), "[\"pdf\",\"doc\",\"docx\"]", "شهادة التأهيل العلمي", "Qualification certificate", 1, 1, "[\"trainer\",\"consultant\",\"content-developer\",\"question-writer\"]", "qualification-certificate", "dm-gap-01.2026-08-30" },
                    { new Guid("fa000000-0000-0000-0000-000000000004"), "[\"pdf\",\"doc\",\"docx\"]", "الشهادة المهنية", "Professional certificate", 1, 1, "[\"trainer\",\"consultant\",\"content-developer\",\"question-writer\"]", "professional-certificate", "dm-gap-01.2026-08-30" }
                });

            migrationBuilder.InsertData(
                table: "FORM_FIELD",
                columns: new[] { "field_id", "definition", "field_code", "input_type", "label_ar", "label_en", "order_index", "schema_version", "section_code" },
                values: new object[,]
                {
                    { new Guid("ff000000-0000-0000-0000-000000000001"), "{\"id\":\"firstNameAr\",\"type\":\"text\",\"sectionId\":\"personal\",\"labelAr\":\"الاسم الأول (بالعربية)\",\"labelEn\":\"First name (Arabic)\",\"requiredFor\":[\"trainer\",\"consultant\",\"content-developer\",\"question-writer\"],\"ownership\":\"sso-profile\",\"order\":1}", "firstNameAr", "text", "الاسم الأول (بالعربية)", "First name (Arabic)", 1, "dm-gap-01.2026-08-30", "personal" },
                    { new Guid("ff000000-0000-0000-0000-000000000002"), "{\"id\":\"middleNameAr\",\"type\":\"text\",\"sectionId\":\"personal\",\"labelAr\":\"الاسم الثاني (بالعربية)\",\"labelEn\":\"Middle name (Arabic)\",\"requiredFor\":[\"trainer\",\"consultant\",\"content-developer\",\"question-writer\"],\"ownership\":\"sso-profile\",\"order\":2}", "middleNameAr", "text", "الاسم الثاني (بالعربية)", "Middle name (Arabic)", 2, "dm-gap-01.2026-08-30", "personal" },
                    { new Guid("ff000000-0000-0000-0000-000000000003"), "{\"id\":\"thirdNameAr\",\"type\":\"text\",\"sectionId\":\"personal\",\"labelAr\":\"الاسم الثالث (بالعربية)\",\"labelEn\":\"Third name (Arabic)\",\"requiredFor\":[\"trainer\",\"consultant\",\"content-developer\",\"question-writer\"],\"ownership\":\"sso-profile\",\"order\":3}", "thirdNameAr", "text", "الاسم الثالث (بالعربية)", "Third name (Arabic)", 3, "dm-gap-01.2026-08-30", "personal" },
                    { new Guid("ff000000-0000-0000-0000-000000000004"), "{\"id\":\"lastNameAr\",\"type\":\"text\",\"sectionId\":\"personal\",\"labelAr\":\"الاسم الأخير (بالعربية)\",\"labelEn\":\"Last name (Arabic)\",\"requiredFor\":[\"trainer\",\"consultant\",\"content-developer\",\"question-writer\"],\"ownership\":\"sso-profile\",\"order\":4}", "lastNameAr", "text", "الاسم الأخير (بالعربية)", "Last name (Arabic)", 4, "dm-gap-01.2026-08-30", "personal" },
                    { new Guid("ff000000-0000-0000-0000-000000000005"), "{\"id\":\"firstNameEn\",\"type\":\"text\",\"sectionId\":\"personal\",\"labelAr\":\"الاسم الأول (بالإنجليزية)\",\"labelEn\":\"First name (English)\",\"requiredFor\":[\"trainer\",\"consultant\",\"content-developer\",\"question-writer\"],\"ownership\":\"sso-profile\",\"order\":5}", "firstNameEn", "text", "الاسم الأول (بالإنجليزية)", "First name (English)", 5, "dm-gap-01.2026-08-30", "personal" },
                    { new Guid("ff000000-0000-0000-0000-000000000006"), "{\"id\":\"middleNameEn\",\"type\":\"text\",\"sectionId\":\"personal\",\"labelAr\":\"الاسم الثاني (بالإنجليزية)\",\"labelEn\":\"Middle name (English)\",\"requiredFor\":[\"trainer\",\"consultant\",\"content-developer\",\"question-writer\"],\"ownership\":\"sso-profile\",\"order\":6}", "middleNameEn", "text", "الاسم الثاني (بالإنجليزية)", "Middle name (English)", 6, "dm-gap-01.2026-08-30", "personal" },
                    { new Guid("ff000000-0000-0000-0000-000000000007"), "{\"id\":\"thirdNameEn\",\"type\":\"text\",\"sectionId\":\"personal\",\"labelAr\":\"الاسم الثالث (بالإنجليزية)\",\"labelEn\":\"Third name (English)\",\"requiredFor\":[\"trainer\",\"consultant\",\"content-developer\",\"question-writer\"],\"ownership\":\"sso-profile\",\"order\":7}", "thirdNameEn", "text", "الاسم الثالث (بالإنجليزية)", "Third name (English)", 7, "dm-gap-01.2026-08-30", "personal" },
                    { new Guid("ff000000-0000-0000-0000-000000000008"), "{\"id\":\"lastNameEn\",\"type\":\"text\",\"sectionId\":\"personal\",\"labelAr\":\"الاسم الأخير (بالإنجليزية)\",\"labelEn\":\"Last name (English)\",\"requiredFor\":[\"trainer\",\"consultant\",\"content-developer\",\"question-writer\"],\"ownership\":\"sso-profile\",\"order\":8}", "lastNameEn", "text", "الاسم الأخير (بالإنجليزية)", "Last name (English)", 8, "dm-gap-01.2026-08-30", "personal" },
                    { new Guid("ff000000-0000-0000-0000-000000000009"), "{\"id\":\"idNumber\",\"type\":\"text\",\"sectionId\":\"personal\",\"labelAr\":\"رقم الهوية الوطنية / هوية مقيم / جواز السفر\",\"labelEn\":\"National ID / Iqama / passport number\",\"requiredFor\":[\"trainer\",\"consultant\",\"content-developer\",\"question-writer\"],\"ownership\":\"sso-profile\",\"order\":9}", "idNumber", "text", "رقم الهوية الوطنية / هوية مقيم / جواز السفر", "National ID / Iqama / passport number", 9, "dm-gap-01.2026-08-30", "personal" },
                    { new Guid("ff000000-0000-0000-0000-000000000010"), "{\"id\":\"dateOfBirth\",\"type\":\"date\",\"sectionId\":\"personal\",\"labelAr\":\"تاريخ الميلاد\",\"labelEn\":\"Date of birth\",\"requiredFor\":[\"trainer\",\"consultant\",\"content-developer\",\"question-writer\"],\"ownership\":\"sso-profile\",\"order\":10}", "dateOfBirth", "date", "تاريخ الميلاد", "Date of birth", 10, "dm-gap-01.2026-08-30", "personal" },
                    { new Guid("ff000000-0000-0000-0000-000000000011"), "{\"id\":\"nationality\",\"type\":\"select\",\"sectionId\":\"personal\",\"labelAr\":\"الجنسية\",\"labelEn\":\"Nationality\",\"requiredFor\":[\"trainer\",\"consultant\",\"content-developer\",\"question-writer\"],\"options\":[{\"value\":\"sa\",\"labelAr\":\"السعودية\",\"labelEn\":\"Saudi Arabia\"},{\"value\":\"gcc\",\"labelAr\":\"دول مجلس التعاون\",\"labelEn\":\"GCC countries\"},{\"value\":\"other\",\"labelAr\":\"أخرى\",\"labelEn\":\"Other\"}],\"ownership\":\"sso-profile\",\"order\":11}", "nationality", "select", "الجنسية", "Nationality", 11, "dm-gap-01.2026-08-30", "personal" },
                    { new Guid("ff000000-0000-0000-0000-000000000012"), "{\"id\":\"gender\",\"type\":\"select\",\"sectionId\":\"personal\",\"labelAr\":\"الجنس\",\"labelEn\":\"Gender\",\"requiredFor\":[\"trainer\",\"consultant\",\"content-developer\",\"question-writer\"],\"options\":[{\"value\":\"male\",\"labelAr\":\"ذكر\",\"labelEn\":\"Male\"},{\"value\":\"female\",\"labelAr\":\"أنثى\",\"labelEn\":\"Female\"}],\"ownership\":\"sso-profile\",\"order\":12}", "gender", "select", "الجنس", "Gender", 12, "dm-gap-01.2026-08-30", "personal" },
                    { new Guid("ff000000-0000-0000-0000-000000000013"), "{\"id\":\"domain\",\"type\":\"select\",\"sectionId\":\"personal\",\"labelAr\":\"المجال\",\"labelEn\":\"Field / domain\",\"helpAr\":\"المجال العام للمتقدم (مالية، تدريب، تقنية...).\",\"helpEn\":\"The applicant’s general field (finance, training, technical…).\",\"requiredFor\":[\"trainer\",\"consultant\",\"content-developer\",\"question-writer\"],\"options\":[{\"value\":\"dom-001\",\"labelAr\":\"تقنية معلومات وادارة وقيادة\",\"labelEn\":\"تقنية معلومات وادارة وقيادة\"},{\"value\":\"dom-002\",\"labelAr\":\"خدمة العملاء والمبيعات\",\"labelEn\":\"خدمة العملاء والمبيعات\"},{\"value\":\"dom-003\",\"labelAr\":\"التحليل المالي والتمويل\",\"labelEn\":\"التحليل المالي والتمويل\"},{\"value\":\"dom-004\",\"labelAr\":\"مجالات الحوكمة والاستدامة المالية وتقديم الاستشارات.\",\"labelEn\":\"مجالات الحوكمة والاستدامة المالية وتقديم الاستشارات.\"},{\"value\":\"dom-005\",\"labelAr\":\"مجالات الذكاء الاصطناعي، الأمن السيبراني، وتحليل البيانات\",\"labelEn\":\"مجالات الذكاء الاصطناعي، الأمن السيبراني، وتحليل البيانات\"},{\"value\":\"dom-006\",\"labelAr\":\"البنوك والتمويل\",\"labelEn\":\"البنوك والتمويل\"},{\"value\":\"dom-007\",\"labelAr\":\"المالية لغير الماليين\",\"labelEn\":\"المالية لغير الماليين\"},{\"value\":\"dom-008\",\"labelAr\":\"الموارد البشرية\",\"labelEn\":\"الموارد البشرية\"},{\"value\":\"dom-009\",\"labelAr\":\"المحاسبة المالية والشراكات بين القطاعين العام والخاص (PPP)\",\"labelEn\":\"المحاسبة المالية والشراكات بين القطاعين العام والخاص (PPP)\"},{\"value\":\"dom-010\",\"labelAr\":\"التأمين\",\"labelEn\":\"التأمين\"},{\"value\":\"dom-011\",\"labelAr\":\"CME1\",\"labelEn\":\"CME1\"},{\"value\":\"dom-012\",\"labelAr\":\"إدارة الأعمال التنفيذية والتدريب القيادي والإبداعي\",\"labelEn\":\"إدارة الأعمال التنفيذية والتدريب القيادي والإبداعي\"},{\"value\":\"dom-013\",\"labelAr\":\"البنوك\",\"labelEn\":\"البنوك\"},{\"value\":\"dom-014\",\"labelAr\":\"إدارة تقنية المعلومات وحوكمة نظم المعلومات\",\"labelEn\":\"إدارة تقنية المعلومات وحوكمة نظم المعلومات\"},{\"value\":\"dom-015\",\"labelAr\":\"القانون\",\"labelEn\":\"القانون\"},{\"value\":\"dom-016\",\"labelAr\":\"تقديم خدمات خبير\",\"labelEn\":\"تقديم خدمات خبير\"},{\"value\":\"dom-017\",\"labelAr\":\"المحاسبة والضرائب\",\"labelEn\":\"المحاسبة والضرائب\"},{\"value\":\"dom-018\",\"labelAr\":\"المالية والمالية الإسلامية\",\"labelEn\":\"المالية والمالية الإسلامية\"},{\"value\":\"dom-019\",\"labelAr\":\"الترجمة وإدارة المشاريع والتطوير الشخصي\",\"labelEn\":\"الترجمة وإدارة المشاريع والتطوير الشخصي\"},{\"value\":\"dom-020\",\"labelAr\":\"الاقتصاد وإدارة المخاطر المصرفية\",\"labelEn\":\"الاقتصاد وإدارة المخاطر المصرفية\"},{\"value\":\"dom-021\",\"labelAr\":\"التحقيق القانوني والتقاضي\",\"labelEn\":\"التحقيق القانوني والتقاضي\"},{\"value\":\"dom-022\",\"labelAr\":\"القيادة وإدارة الأعمال العالمية\",\"labelEn\":\"القيادة وإدارة الأعمال العالمية\"},{\"value\":\"dom-023\",\"labelAr\":\"الأوراق المالية\",\"labelEn\":\"الأوراق المالية\"},{\"value\":\"dom-024\",\"labelAr\":\"الاقتصاد وإدارة الأعمال المصرفية\",\"labelEn\":\"الاقتصاد وإدارة الأعمال المصرفية\"},{\"value\":\"dom-025\",\"labelAr\":\"القطاع المالي والاستثماري والحوكمة المؤسسية\",\"labelEn\":\"القطاع المالي والاستثماري والحوكمة المؤسسية\"},{\"value\":\"dom-026\",\"labelAr\":\"إدارة الأعمال وتطوير الأعمال وإدارة المشاريع\",\"labelEn\":\"إدارة الأعمال وتطوير الأعمال وإدارة المشاريع\"},{\"value\":\"dom-027\",\"labelAr\":\"التأمين وإدارة الأعمال والقيادة\",\"labelEn\":\"التأمين وإدارة الأعمال والقيادة\"},{\"value\":\"dom-028\",\"labelAr\":\"التدريب والتطوير المهني\",\"labelEn\":\"التدريب والتطوير المهني\"},{\"value\":\"dom-029\",\"labelAr\":\"اجادة - لمدراء العمليات\",\"labelEn\":\"اجادة - لمدراء العمليات\"},{\"value\":\"dom-030\",\"labelAr\":\"أمن المعلومات وتقنية المعلومات\",\"labelEn\":\"أمن المعلومات وتقنية المعلومات\"},{\"value\":\"dom-031\",\"labelAr\":\"القطاع المالي والإداري.\",\"labelEn\":\"القطاع المالي والإداري.\"},{\"value\":\"dom-032\",\"labelAr\":\"اكسل\",\"labelEn\":\"اكسل\"},{\"value\":\"dom-033\",\"labelAr\":\"القطاع المالي والإداري – تخصص في الأعمال الإلكترونية، المحاسبة، والحوكمة المؤسسية.\",\"labelEn\":\"القطاع المالي والإداري – تخصص في الأعمال الإلكترونية، المحاسبة، والحوكمة المؤسسية.\"},{\"value\":\"dom-034\",\"labelAr\":\"أمن المعلومات وشبكات الحاسب\",\"labelEn\":\"أمن المعلومات وشبكات الحاسب\"},{\"value\":\"dom-035\",\"labelAr\":\"البرامج القيادية\",\"labelEn\":\"البرامج القيادية\"},{\"value\":\"dom-036\",\"labelAr\":\"خدمة العملاء\",\"labelEn\":\"خدمة العملاء\"},{\"value\":\"dom-037\",\"labelAr\":\"طرق كشف تزوير المستندات والتواقيع\",\"labelEn\":\"طرق كشف تزوير المستندات والتواقيع\"},{\"value\":\"dom-038\",\"labelAr\":\"الذكاء الاصطناعي\",\"labelEn\":\"الذكاء الاصطناعي\"},{\"value\":\"dom-039\",\"labelAr\":\"مسؤول الالتزام المعتمد\",\"labelEn\":\"مسؤول الالتزام المعتمد\"},{\"value\":\"dom-040\",\"labelAr\":\"التنمية البشرية والتطوير القيادي وجودة الحياة.\",\"labelEn\":\"التنمية البشرية والتطوير القيادي وجودة الحياة.\"},{\"value\":\"dom-041\",\"labelAr\":\"التحكيم التجاري وإدارة النزاعات.\",\"labelEn\":\"التحكيم التجاري وإدارة النزاعات.\"},{\"value\":\"dom-042\",\"labelAr\":\"البرامج الخاصة\",\"labelEn\":\"البرامج الخاصة\"},{\"value\":\"dom-043\",\"labelAr\":\"المحاسبة الحكومية\",\"labelEn\":\"المحاسبة الحكومية\"},{\"value\":\"dom-044\",\"labelAr\":\"القطاع المالي والأكاديمي.\",\"labelEn\":\"القطاع المالي والأكاديمي.\"},{\"value\":\"dom-045\",\"labelAr\":\"القانون والقضاء والتحكيم.\",\"labelEn\":\"القانون والقضاء والتحكيم.\"},{\"value\":\"dom-046\",\"labelAr\":\"تحليل القوائم المالية و المالية لغير الماليين\",\"labelEn\":\"تحليل القوائم المالية و المالية لغير الماليين\"},{\"value\":\"dom-047\",\"labelAr\":\"المالية والمصرفية وإدارة المخاطر والامتثال\",\"labelEn\":\"المالية والمصرفية وإدارة المخاطر والامتثال\"},{\"value\":\"dom-048\",\"labelAr\":\"إدارة الموارد البشرية والتطوير القيادي\",\"labelEn\":\"إدارة الموارد البشرية والتطوير القيادي\"},{\"value\":\"dom-049\",\"labelAr\":\"المدفوعات الرقمية والمحافظ الإلكترونية\",\"labelEn\":\"المدفوعات الرقمية والمحافظ الإلكترونية\"},{\"value\":\"dom-050\",\"labelAr\":\"المحاسبة والتدقيق الاستراتيجي والتدريب المهني\",\"labelEn\":\"المحاسبة والتدقيق الاستراتيجي والتدريب المهني\"},{\"value\":\"dom-051\",\"labelAr\":\"الاستثمار المالي\",\"labelEn\":\"الاستثمار المالي\"},{\"value\":\"dom-052\",\"labelAr\":\"المهارات الشخصية والابتكار\",\"labelEn\":\"المهارات الشخصية والابتكار\"},{\"value\":\"dom-053\",\"labelAr\":\"الاقتصاد والتمويل الإسلامي\",\"labelEn\":\"الاقتصاد والتمويل الإسلامي\"},{\"value\":\"dom-054\",\"labelAr\":\"الاستثمار\",\"labelEn\":\"الاستثمار\"},{\"value\":\"dom-055\",\"labelAr\":\"إدارة المحافظ\",\"labelEn\":\"إدارة المحافظ\"},{\"value\":\"dom-056\",\"labelAr\":\"الاحتيال والأمن السيبراني\",\"labelEn\":\"الاحتيال والأمن السيبراني\"},{\"value\":\"dom-057\",\"labelAr\":\"المالية الشخصية والتخطيط المالي.\",\"labelEn\":\"المالية الشخصية والتخطيط المالي.\"},{\"value\":\"dom-058\",\"labelAr\":\"حوكمة الشركات\",\"labelEn\":\"حوكمة الشركات\"},{\"value\":\"dom-059\",\"labelAr\":\"الإدارة والتطوير الشخصي والمهني.\",\"labelEn\":\"الإدارة والتطوير الشخصي والمهني.\"},{\"value\":\"dom-060\",\"labelAr\":\"الطرح العام للمهنيين\",\"labelEn\":\"الطرح العام للمهنيين\"},{\"value\":\"dom-061\",\"labelAr\":\"المالية والإدارة والمراجعة الداخلية.\",\"labelEn\":\"المالية والإدارة والمراجعة الداخلية.\"},{\"value\":\"dom-062\",\"labelAr\":\"المحاسبة والتمويل / التقييم المالي والمحاسبي\",\"labelEn\":\"المحاسبة والتمويل / التقييم المالي والمحاسبي\"},{\"value\":\"dom-063\",\"labelAr\":\"التأمين وإدارة المخاطر والتدريب المهني\",\"labelEn\":\"التأمين وإدارة المخاطر والتدريب المهني\"},{\"value\":\"dom-064\",\"labelAr\":\"مشتريات الحكومية\",\"labelEn\":\"مشتريات الحكومية\"},{\"value\":\"dom-065\",\"labelAr\":\"الإدارة الاستراتيجية وتطوير الأداء والتدريب القيادي\",\"labelEn\":\"الإدارة الاستراتيجية وتطوير الأداء والتدريب القيادي\"},{\"value\":\"dom-066\",\"labelAr\":\"الإدارة وإدارة الأعمال.\",\"labelEn\":\"الإدارة وإدارة الأعمال.\"},{\"value\":\"dom-067\",\"labelAr\":\"الإدارة المالية\",\"labelEn\":\"الإدارة المالية\"},{\"value\":\"dom-068\",\"labelAr\":\"غسل الأموال وتمويل الإرهاب\",\"labelEn\":\"غسل الأموال وتمويل الإرهاب\"},{\"value\":\"dom-069\",\"labelAr\":\"نظم الإدارة والجودة\",\"labelEn\":\"نظم الإدارة والجودة\"},{\"value\":\"dom-070\",\"labelAr\":\"الاستثمار وإدارة الأصول.\",\"labelEn\":\"الاستثمار وإدارة الأصول.\"},{\"value\":\"dom-071\",\"labelAr\":\"المالية والمراجعة الداخلية والمحاسبة الاحترافية.\",\"labelEn\":\"المالية والمراجعة الداخلية والمحاسبة الاحترافية.\"},{\"value\":\"dom-072\",\"labelAr\":\"إدارة المحافظ العقارية\",\"labelEn\":\"إدارة المحافظ العقارية\"},{\"value\":\"dom-073\",\"labelAr\":\"المحاسبة والإدارة المالية.\",\"labelEn\":\"المحاسبة والإدارة المالية.\"},{\"value\":\"dom-074\",\"labelAr\":\"المبيعات والتسويق وتطوير الأعمال\",\"labelEn\":\"المبيعات والتسويق وتطوير الأعمال\"},{\"value\":\"dom-075\",\"labelAr\":\"تدريب المدربين(TOT)\",\"labelEn\":\"تدريب المدربين(TOT)\"},{\"value\":\"dom-076\",\"labelAr\":\"مايكروسوفت Power BI\",\"labelEn\":\"مايكروسوفت Power BI\"},{\"value\":\"dom-077\",\"labelAr\":\"المصرفية الإسلامية\",\"labelEn\":\"المصرفية الإسلامية\"},{\"value\":\"dom-078\",\"labelAr\":\"المحاسبة والتحليل المالي\",\"labelEn\":\"المحاسبة والتحليل المالي\"},{\"value\":\"dom-079\",\"labelAr\":\"الإدارة المالية والاقتصاد\",\"labelEn\":\"الإدارة المالية والاقتصاد\"},{\"value\":\"dom-080\",\"labelAr\":\"الاستثمار والأسواق المالية\",\"labelEn\":\"الاستثمار والأسواق المالية\"},{\"value\":\"dom-081\",\"labelAr\":\"المخاطر التشغيلية\",\"labelEn\":\"المخاطر التشغيلية\"},{\"value\":\"dom-082\",\"labelAr\":\"المهارات الإدارية والسلوكية\",\"labelEn\":\"المهارات الإدارية والسلوكية\"},{\"value\":\"dom-083\",\"labelAr\":\"الإدارة المالية والبنوك والتدريب\",\"labelEn\":\"الإدارة المالية والبنوك والتدريب\"},{\"value\":\"dom-084\",\"labelAr\":\"الامتثال ومكافحة الجرائم المالية\",\"labelEn\":\"الامتثال ومكافحة الجرائم المالية\"},{\"value\":\"dom-085\",\"labelAr\":\"أمن المعلومات وحوكمة تقنية المعلومات\",\"labelEn\":\"أمن المعلومات وحوكمة تقنية المعلومات\"},{\"value\":\"dom-086\",\"labelAr\":\"تقنية المعلومات والأمن السيبراني.\",\"labelEn\":\"تقنية المعلومات والأمن السيبراني.\"},{\"value\":\"dom-087\",\"labelAr\":\"الحوكمة\",\"labelEn\":\"الحوكمة\"},{\"value\":\"dom-088\",\"labelAr\":\"العلاقات العامة والإدارة المالية والاستثمار.\",\"labelEn\":\"العلاقات العامة والإدارة المالية والاستثمار.\"},{\"value\":\"dom-089\",\"labelAr\":\"الإدارة، القيادة، وتطوير الكفاءات البشرية.\",\"labelEn\":\"الإدارة، القيادة، وتطوير الكفاءات البشرية.\"},{\"value\":\"dom-090\",\"labelAr\":\"الاستثمار وإدارة الأصول والإدارة الحكومية.\",\"labelEn\":\"الاستثمار وإدارة الأصول والإدارة الحكومية.\"},{\"value\":\"dom-091\",\"labelAr\":\"سلاسل الإمداد وإدارة العمليات\",\"labelEn\":\"سلاسل الإمداد وإدارة العمليات\"},{\"value\":\"dom-092\",\"labelAr\":\"إدارة المخاطر\",\"labelEn\":\"إدارة المخاطر\"},{\"value\":\"dom-093\",\"labelAr\":\"المالية الإسلامية، القضاء الشرعي، والتدريب الأكاديمي.\",\"labelEn\":\"المالية الإسلامية، القضاء الشرعي، والتدريب الأكاديمي.\"},{\"value\":\"dom-094\",\"labelAr\":\"المالية، إدارة الأعمال، والتأمين.\",\"labelEn\":\"المالية، إدارة الأعمال، والتأمين.\"},{\"value\":\"dom-095\",\"labelAr\":\"التنمية البشرية والتطوير المؤسسي.\",\"labelEn\":\"التنمية البشرية والتطوير المؤسسي.\"},{\"value\":\"dom-096\",\"labelAr\":\"تقديم خدمات استشارية\",\"labelEn\":\"تقديم خدمات استشارية\"},{\"value\":\"dom-097\",\"labelAr\":\"التمويل والمحاسبة والتحليل المالي\",\"labelEn\":\"التمويل والمحاسبة والتحليل المالي\"},{\"value\":\"dom-098\",\"labelAr\":\"تقنية المعلومات والتدريب.\",\"labelEn\":\"تقنية المعلومات والتدريب.\"},{\"value\":\"dom-099\",\"labelAr\":\"القانون، الاستشارات المهنية، والتطوير القيادي.\",\"labelEn\":\"القانون، الاستشارات المهنية، والتطوير القيادي.\"},{\"value\":\"dom-100\",\"labelAr\":\"المالية\",\"labelEn\":\"المالية\"},{\"value\":\"dom-101\",\"labelAr\":\"الذكاء الاصطناعي وعلوم البيانات\",\"labelEn\":\"الذكاء الاصطناعي وعلوم البيانات\"},{\"value\":\"dom-102\",\"labelAr\":\"الموارد البشرية وإدارة المشاريع.\",\"labelEn\":\"الموارد البشرية وإدارة المشاريع.\"},{\"value\":\"dom-103\",\"labelAr\":\"إدارة الأعمال والحوكمة المالية.\",\"labelEn\":\"إدارة الأعمال والحوكمة المالية.\"},{\"value\":\"dom-104\",\"labelAr\":\"المشتقات المالية\",\"labelEn\":\"المشتقات المالية\"},{\"value\":\"dom-105\",\"labelAr\":\"التمويل والمصارف والأسواق المالية\",\"labelEn\":\"التمويل والمصارف والأسواق المالية\"},{\"value\":\"dom-106\",\"labelAr\":\"إدارة الأعمال والحوكمة وإدارة المشاريع\",\"labelEn\":\"إدارة الأعمال والحوكمة وإدارة المشاريع\"},{\"value\":\"dom-107\",\"labelAr\":\"القيادة للقطاع المالي والمشرعين\",\"labelEn\":\"القيادة للقطاع المالي والمشرعين\"},{\"value\":\"dom-108\",\"labelAr\":\"التأمين وإدارة المخاطر والخدمات التأمينية\",\"labelEn\":\"التأمين وإدارة المخاطر والخدمات التأمينية\"},{\"value\":\"dom-109\",\"labelAr\":\"إدارة الأعمال والموارد البشرية.\",\"labelEn\":\"إدارة الأعمال والموارد البشرية.\"},{\"value\":\"dom-110\",\"labelAr\":\"المهارات الشخصية والقيادة\",\"labelEn\":\"المهارات الشخصية والقيادة\"},{\"value\":\"dom-111\",\"labelAr\":\"التقنية المالية\",\"labelEn\":\"التقنية المالية\"},{\"value\":\"dom-112\",\"labelAr\":\"التحقيقات المالية ومكافحة غسل الأموال وتمويل الإرهاب (AML/CFT)\",\"labelEn\":\"التحقيقات المالية ومكافحة غسل الأموال وتمويل الإرهاب (AML/CFT)\"},{\"value\":\"dom-113\",\"labelAr\":\"الحوكمة والاستدامة\",\"labelEn\":\"الحوكمة والاستدامة\"},{\"value\":\"dom-114\",\"labelAr\":\"المهارات الاحترافية وخدمة العملاء في قطاع التأمين\",\"labelEn\":\"المهارات الاحترافية وخدمة العملاء في قطاع التأمين\"},{\"value\":\"dom-115\",\"labelAr\":\"التحليل المالي وإدارة الاستثمارات\",\"labelEn\":\"التحليل المالي وإدارة الاستثمارات\"},{\"value\":\"dom-116\",\"labelAr\":\"التمويل والمصارف والخدمات الائتمانية\",\"labelEn\":\"التمويل والمصارف والخدمات الائتمانية\"},{\"value\":\"dom-117\",\"labelAr\":\"إدارة الجودة والتطوير المؤسسي.\",\"labelEn\":\"إدارة الجودة والتطوير المؤسسي.\"},{\"value\":\"dom-118\",\"labelAr\":\"المصرفية\",\"labelEn\":\"المصرفية\"},{\"value\":\"dom-119\",\"labelAr\":\"الإدارة، الجودة، التخطيط الاستراتيجي، وتطوير المهارات القيادية والمهنية\",\"labelEn\":\"الإدارة، الجودة، التخطيط الاستراتيجي، وتطوير المهارات القيادية والمهنية\"},{\"value\":\"dom-120\",\"labelAr\":\"إدارة الأعمال وسلسلة الإمداد والتمويل.\",\"labelEn\":\"إدارة الأعمال وسلسلة الإمداد والتمويل.\"},{\"value\":\"dom-121\",\"labelAr\":\"التمويل التجاري\",\"labelEn\":\"التمويل التجاري\"},{\"value\":\"dom-122\",\"labelAr\":\"الجميع\",\"labelEn\":\"الجميع\"},{\"value\":\"dom-123\",\"labelAr\":\"المهارات القيادية والاحترافية والتواصل\",\"labelEn\":\"المهارات القيادية والاحترافية والتواصل\"},{\"value\":\"dom-124\",\"labelAr\":\"ضريبة القيمة المضافة\",\"labelEn\":\"ضريبة القيمة المضافة\"},{\"value\":\"dom-125\",\"labelAr\":\"الوعي المالي\",\"labelEn\":\"الوعي المالي\"},{\"value\":\"dom-126\",\"labelAr\":\"إدارة الاعمال\",\"labelEn\":\"إدارة الاعمال\"},{\"value\":\"dom-127\",\"labelAr\":\"تطوير الذات والإدارة الشخصية\",\"labelEn\":\"تطوير الذات والإدارة الشخصية\"},{\"value\":\"dom-128\",\"labelAr\":\"السلوك المهني\",\"labelEn\":\"السلوك المهني\"},{\"value\":\"dom-129\",\"labelAr\":\"الحوكمة وإدارة المخاطر ومكافحة الجرائم المالية\",\"labelEn\":\"الحوكمة وإدارة المخاطر ومكافحة الجرائم المالية\"},{\"value\":\"dom-130\",\"labelAr\":\"القانون المالي والجنائي للشركات\",\"labelEn\":\"القانون المالي والجنائي للشركات\"},{\"value\":\"dom-131\",\"labelAr\":\"المحاسبة والمالية الاحترافية.\",\"labelEn\":\"المحاسبة والمالية الاحترافية.\"},{\"value\":\"dom-132\",\"labelAr\":\"المهارات المهنية\",\"labelEn\":\"المهارات المهنية\"},{\"value\":\"dom-133\",\"labelAr\":\"القانون وأنظمة التشريع.\",\"labelEn\":\"القانون وأنظمة التشريع.\"},{\"value\":\"dom-134\",\"labelAr\":\"مكافحة غسل الأموال وتمويل الارهاب\",\"labelEn\":\"مكافحة غسل الأموال وتمويل الارهاب\"},{\"value\":\"dom-135\",\"labelAr\":\"القوائم المالية\",\"labelEn\":\"القوائم المالية\"},{\"value\":\"dom-136\",\"labelAr\":\"محاسبة\",\"labelEn\":\"محاسبة\"},{\"value\":\"dom-137\",\"labelAr\":\"المهارات الاحترافية والتواصل والمبيعات\",\"labelEn\":\"المهارات الاحترافية والتواصل والمبيعات\"},{\"value\":\"dom-138\",\"labelAr\":\"المالية وإدارة المخاطر.\",\"labelEn\":\"المالية وإدارة المخاطر.\"},{\"value\":\"dom-139\",\"labelAr\":\"إدارة مشاريع (PMP)\",\"labelEn\":\"إدارة مشاريع (PMP)\"},{\"value\":\"dom-140\",\"labelAr\":\"استمرارية العمل\",\"labelEn\":\"استمرارية العمل\"},{\"value\":\"dom-141\",\"labelAr\":\"وعي مالي\",\"labelEn\":\"وعي مالي\"},{\"value\":\"dom-142\",\"labelAr\":\"التدريب وعلوم البيانات\",\"labelEn\":\"التدريب وعلوم البيانات\"},{\"value\":\"dom-143\",\"labelAr\":\"إدارة الأعمال والتدريب الاحترافي.\",\"labelEn\":\"إدارة الأعمال والتدريب الاحترافي.\"},{\"value\":\"dom-144\",\"labelAr\":\"الفنتك\",\"labelEn\":\"الفنتك\"},{\"value\":\"dom-145\",\"labelAr\":\"إدارة المشاريع\",\"labelEn\":\"إدارة المشاريع\"},{\"value\":\"dom-146\",\"labelAr\":\"التأمين، الامتثال، ومكافحة الجرائم المالية في قطاع التأمين\",\"labelEn\":\"التأمين، الامتثال، ومكافحة الجرائم المالية في قطاع التأمين\"},{\"value\":\"dom-147\",\"labelAr\":\"إدارة الأعمال والتأمين الدولي.\",\"labelEn\":\"إدارة الأعمال والتأمين الدولي.\"}],\"ownership\":\"expert-hub\",\"order\":13}", "domain", "select", "المجال", "Field / domain", 13, "dm-gap-01.2026-08-30", "personal" },
                    { new Guid("ff000000-0000-0000-0000-000000000014"), "{\"id\":\"linkedin\",\"type\":\"text\",\"sectionId\":\"personal\",\"labelAr\":\"حساب LinkedIn\",\"labelEn\":\"LinkedIn profile\",\"requiredFor\":[],\"validation\":{\"pattern\":\"^https?://\\\\S+$\",\"patternMessageAr\":\"أدخل رابطًا صحيحًا يبدأ بـ http:// أو https://\",\"patternMessageEn\":\"Enter a valid link starting with http:// or https://\"},\"ownership\":\"expert-hub\",\"order\":14}", "linkedin", "text", "حساب LinkedIn", "LinkedIn profile", 14, "dm-gap-01.2026-08-30", "personal" },
                    { new Guid("ff000000-0000-0000-0000-000000000015"), "{\"id\":\"personalWebsite\",\"type\":\"text\",\"sectionId\":\"personal\",\"labelAr\":\"الموقع الشخصي\",\"labelEn\":\"Personal website\",\"requiredFor\":[],\"validation\":{\"pattern\":\"^https?://\\\\S+$\",\"patternMessageAr\":\"أدخل رابطًا صحيحًا يبدأ بـ http:// أو https://\",\"patternMessageEn\":\"Enter a valid link starting with http:// or https://\"},\"ownership\":\"expert-hub\",\"order\":15}", "personalWebsite", "text", "الموقع الشخصي", "Personal website", 15, "dm-gap-01.2026-08-30", "personal" },
                    { new Guid("ff000000-0000-0000-0000-000000000016"), "{\"id\":\"qualificationType\",\"type\":\"select\",\"sectionId\":\"education\",\"labelAr\":\"نوع المؤهل\",\"labelEn\":\"Qualification type\",\"requiredFor\":[\"trainer\",\"consultant\",\"content-developer\",\"question-writer\"],\"options\":[{\"value\":\"diploma\",\"labelAr\":\"دبلوم\",\"labelEn\":\"Diploma\"},{\"value\":\"bachelor\",\"labelAr\":\"بكالوريوس\",\"labelEn\":\"Bachelor’s\"},{\"value\":\"master\",\"labelAr\":\"ماجستير\",\"labelEn\":\"Master’s\"},{\"value\":\"doctorate\",\"labelAr\":\"دكتوراه\",\"labelEn\":\"Doctorate\"}],\"ownership\":\"expert-hub\",\"order\":1}", "qualificationType", "select", "نوع المؤهل", "Qualification type", 1, "dm-gap-01.2026-08-30", "education" },
                    { new Guid("ff000000-0000-0000-0000-000000000017"), "{\"id\":\"generalSpecialization\",\"type\":\"select\",\"sectionId\":\"education\",\"labelAr\":\"التخصص العام\",\"labelEn\":\"General specialization\",\"requiredFor\":[\"trainer\",\"consultant\",\"content-developer\",\"question-writer\"],\"options\":[{\"value\":\"finance\",\"labelAr\":\"المالية\",\"labelEn\":\"Finance\"},{\"value\":\"management\",\"labelAr\":\"الإدارة\",\"labelEn\":\"Management\"},{\"value\":\"it\",\"labelAr\":\"تقنية المعلومات\",\"labelEn\":\"Information technology\"},{\"value\":\"law\",\"labelAr\":\"القانون\",\"labelEn\":\"Law\"},{\"value\":\"other\",\"labelAr\":\"أخرى\",\"labelEn\":\"Other\"}],\"ownership\":\"expert-hub\",\"order\":2}", "generalSpecialization", "select", "التخصص العام", "General specialization", 2, "dm-gap-01.2026-08-30", "education" },
                    { new Guid("ff000000-0000-0000-0000-000000000018"), "{\"id\":\"specializationDetail\",\"type\":\"text\",\"sectionId\":\"education\",\"labelAr\":\"التخصص\",\"labelEn\":\"Specialization\",\"requiredFor\":[\"trainer\",\"consultant\",\"content-developer\",\"question-writer\"],\"ownership\":\"expert-hub\",\"order\":3}", "specializationDetail", "text", "التخصص", "Specialization", 3, "dm-gap-01.2026-08-30", "education" },
                    { new Guid("ff000000-0000-0000-0000-000000000019"), "{\"id\":\"universityName\",\"type\":\"text\",\"sectionId\":\"education\",\"labelAr\":\"اسم الجامعة\",\"labelEn\":\"University name\",\"requiredFor\":[\"trainer\",\"consultant\",\"content-developer\",\"question-writer\"],\"ownership\":\"expert-hub\",\"order\":4}", "universityName", "text", "اسم الجامعة", "University name", 4, "dm-gap-01.2026-08-30", "education" },
                    { new Guid("ff000000-0000-0000-0000-000000000020"), "{\"id\":\"qualificationDate\",\"type\":\"date\",\"sectionId\":\"education\",\"labelAr\":\"تاريخ الحصول على المؤهل\",\"labelEn\":\"Date obtained\",\"requiredFor\":[\"trainer\",\"consultant\",\"content-developer\",\"question-writer\"],\"ownership\":\"expert-hub\",\"order\":5}", "qualificationDate", "date", "تاريخ الحصول على المؤهل", "Date obtained", 5, "dm-gap-01.2026-08-30", "education" },
                    { new Guid("ff000000-0000-0000-0000-000000000021"), "{\"id\":\"certificateName\",\"type\":\"text\",\"sectionId\":\"certifications\",\"labelAr\":\"اسم الشهادة\",\"labelEn\":\"Certificate name\",\"requiredFor\":[\"trainer\",\"consultant\",\"content-developer\",\"question-writer\"],\"ownership\":\"expert-hub\",\"order\":1}", "certificateName", "text", "اسم الشهادة", "Certificate name", 1, "dm-gap-01.2026-08-30", "certifications" },
                    { new Guid("ff000000-0000-0000-0000-000000000022"), "{\"id\":\"issuingInstitution\",\"type\":\"text\",\"sectionId\":\"certifications\",\"labelAr\":\"الجهة المانحة\",\"labelEn\":\"Issuing institution\",\"requiredFor\":[\"trainer\",\"consultant\",\"content-developer\",\"question-writer\"],\"ownership\":\"expert-hub\",\"order\":2}", "issuingInstitution", "text", "الجهة المانحة", "Issuing institution", 2, "dm-gap-01.2026-08-30", "certifications" },
                    { new Guid("ff000000-0000-0000-0000-000000000023"), "{\"id\":\"certificateDate\",\"type\":\"date\",\"sectionId\":\"certifications\",\"labelAr\":\"تاريخ الحصول\",\"labelEn\":\"Date obtained\",\"requiredFor\":[\"trainer\",\"consultant\",\"content-developer\",\"question-writer\"],\"ownership\":\"expert-hub\",\"order\":3}", "certificateDate", "date", "تاريخ الحصول", "Date obtained", 3, "dm-gap-01.2026-08-30", "certifications" },
                    { new Guid("ff000000-0000-0000-0000-000000000024"), "{\"id\":\"certificateAttachmentName\",\"type\":\"text\",\"sectionId\":\"certifications\",\"labelAr\":\"اسم المرفق\",\"labelEn\":\"Attachment name\",\"requiredFor\":[\"trainer\",\"consultant\",\"content-developer\",\"question-writer\"],\"ownership\":\"expert-hub\",\"order\":4}", "certificateAttachmentName", "text", "اسم المرفق", "Attachment name", 4, "dm-gap-01.2026-08-30", "certifications" },
                    { new Guid("ff000000-0000-0000-0000-000000000025"), "{\"id\":\"jobTitle\",\"type\":\"text\",\"sectionId\":\"experience\",\"labelAr\":\"عنوان الوظيفة\",\"labelEn\":\"Job title\",\"requiredFor\":[\"trainer\",\"consultant\",\"content-developer\",\"question-writer\"],\"ownership\":\"expert-hub\",\"order\":1}", "jobTitle", "text", "عنوان الوظيفة", "Job title", 1, "dm-gap-01.2026-08-30", "experience" },
                    { new Guid("ff000000-0000-0000-0000-000000000026"), "{\"id\":\"organization\",\"type\":\"text\",\"sectionId\":\"experience\",\"labelAr\":\"جهة العمل\",\"labelEn\":\"Organization name\",\"requiredFor\":[\"trainer\",\"consultant\",\"content-developer\",\"question-writer\"],\"ownership\":\"expert-hub\",\"order\":2}", "organization", "text", "جهة العمل", "Organization name", 2, "dm-gap-01.2026-08-30", "experience" },
                    { new Guid("ff000000-0000-0000-0000-000000000027"), "{\"id\":\"currentlyEmployed\",\"type\":\"checkbox\",\"sectionId\":\"experience\",\"labelAr\":\"أنا أعمل حاليًا في هذا المنصب\",\"labelEn\":\"I currently work in this position\",\"requiredFor\":[],\"ownership\":\"expert-hub\",\"order\":3}", "currentlyEmployed", "checkbox", "أنا أعمل حاليًا في هذا المنصب", "I currently work in this position", 3, "dm-gap-01.2026-08-30", "experience" },
                    { new Guid("ff000000-0000-0000-0000-000000000028"), "{\"id\":\"partTimeRole\",\"type\":\"checkbox\",\"sectionId\":\"experience\",\"labelAr\":\"هل العمل بدوام جزئي؟\",\"labelEn\":\"Is this a part-time role?\",\"requiredFor\":[],\"ownership\":\"expert-hub\",\"order\":4}", "partTimeRole", "checkbox", "هل العمل بدوام جزئي؟", "Is this a part-time role?", 4, "dm-gap-01.2026-08-30", "experience" },
                    { new Guid("ff000000-0000-0000-0000-000000000029"), "{\"id\":\"experienceStartDate\",\"type\":\"date\",\"sectionId\":\"experience\",\"labelAr\":\"تاريخ البدء\",\"labelEn\":\"Start date\",\"requiredFor\":[\"trainer\",\"consultant\",\"content-developer\",\"question-writer\"],\"ownership\":\"expert-hub\",\"order\":5}", "experienceStartDate", "date", "تاريخ البدء", "Start date", 5, "dm-gap-01.2026-08-30", "experience" },
                    { new Guid("ff000000-0000-0000-0000-000000000030"), "{\"id\":\"responsibilities\",\"type\":\"textarea\",\"sectionId\":\"experience\",\"labelAr\":\"المسؤوليات\",\"labelEn\":\"Responsibilities\",\"helpAr\":\"أدخل كل مسؤولية في سطر مستقل.\",\"helpEn\":\"Enter each item on a new line.\",\"requiredFor\":[\"trainer\",\"consultant\",\"content-developer\",\"question-writer\"],\"ownership\":\"expert-hub\",\"order\":6}", "responsibilities", "textarea", "المسؤوليات", "Responsibilities", 6, "dm-gap-01.2026-08-30", "experience" },
                    { new Guid("ff000000-0000-0000-0000-000000000031"), "{\"id\":\"participationTypes\",\"type\":\"multi-select\",\"sectionId\":\"training-content\",\"labelAr\":\"أنواع المشاركات السابقة\",\"labelEn\":\"Previous participation types\",\"helpAr\":\"اختر كل ما ينطبق.\",\"helpEn\":\"Select all that apply.\",\"requiredFor\":[\"trainer\",\"consultant\",\"content-developer\",\"question-writer\"],\"options\":[{\"value\":\"official-programs\",\"labelAr\":\"برامج تدريبية رسمية\",\"labelEn\":\"Official training programs\"},{\"value\":\"workshops\",\"labelAr\":\"ورش عمل متخصصة\",\"labelEn\":\"Specialized workshops\"},{\"value\":\"academic-lectures\",\"labelAr\":\"محاضرات أكاديمية\",\"labelEn\":\"Academic lectures\"},{\"value\":\"conferences\",\"labelAr\":\"مؤتمرات وملتقيات مهنية\",\"labelEn\":\"Conferences & professional forums\"},{\"value\":\"panels\",\"labelAr\":\"حلقات نقاش\",\"labelEn\":\"Panel discussions\"},{\"value\":\"mentoring\",\"labelAr\":\"إرشاد وتوجيه فردي\",\"labelEn\":\"Individual mentoring/coaching\"},{\"value\":\"writing-research\",\"labelAr\":\"كتابة متخصصة ونشر أوراق بحثية\",\"labelEn\":\"Specialized writing & research publishing\"},{\"value\":\"digital-content\",\"labelAr\":\"محتوى رقمي / بودكاست / يوتيوب\",\"labelEn\":\"Digital content / podcast / YouTube\"}],\"ownership\":\"expert-hub\",\"order\":1}", "participationTypes", "multi-select", "أنواع المشاركات السابقة", "Previous participation types", 1, "dm-gap-01.2026-08-30", "training-content" },
                    { new Guid("ff000000-0000-0000-0000-000000000032"), "{\"id\":\"audiences\",\"type\":\"multi-select\",\"sectionId\":\"training-content\",\"labelAr\":\"الفئات التي يمكنك مخاطبتها بفعالية\",\"labelEn\":\"Audiences you can effectively address\",\"helpAr\":\"اختر كل ما ينطبق.\",\"helpEn\":\"Select all that apply.\",\"requiredFor\":[\"trainer\",\"consultant\",\"content-developer\",\"question-writer\"],\"options\":[{\"value\":\"university-students\",\"labelAr\":\"طلاب الجامعات\",\"labelEn\":\"University students\"},{\"value\":\"new-graduates\",\"labelAr\":\"الخريجون الجدد\",\"labelEn\":\"New graduates\"},{\"value\":\"mid-career\",\"labelAr\":\"المهنيون في منتصف المسار\",\"labelEn\":\"Mid-career professionals\"},{\"value\":\"executives\",\"labelAr\":\"القيادات التنفيذية والعليا\",\"labelEn\":\"Executive & senior leadership\"},{\"value\":\"general-public\",\"labelAr\":\"عموم الجمهور (الوعي المالي)\",\"labelEn\":\"General public (financial awareness)\"}],\"ownership\":\"expert-hub\",\"order\":2}", "audiences", "multi-select", "الفئات التي يمكنك مخاطبتها بفعالية", "Audiences you can effectively address", 2, "dm-gap-01.2026-08-30", "training-content" },
                    { new Guid("ff000000-0000-0000-0000-000000000033"), "{\"id\":\"hasReadyMaterials\",\"type\":\"select\",\"sectionId\":\"training-content\",\"labelAr\":\"هل لديك مواد أو حقائب تدريبية جاهزة؟\",\"labelEn\":\"Do you have ready-made training materials or kits?\",\"requiredFor\":[\"trainer\",\"consultant\",\"content-developer\",\"question-writer\"],\"options\":[{\"value\":\"yes\",\"labelAr\":\"نعم\",\"labelEn\":\"Yes\"},{\"value\":\"no\",\"labelAr\":\"لا\",\"labelEn\":\"No\"}],\"ownership\":\"expert-hub\",\"order\":3}", "hasReadyMaterials", "select", "هل لديك مواد أو حقائب تدريبية جاهزة؟", "Do you have ready-made training materials or kits?", 3, "dm-gap-01.2026-08-30", "training-content" },
                    { new Guid("ff000000-0000-0000-0000-000000000034"), "{\"id\":\"preferredDeliveryMode\",\"type\":\"select\",\"sectionId\":\"training-content\",\"labelAr\":\"نمط التقديم المفضل لديك\",\"labelEn\":\"Your preferred delivery mode\",\"requiredFor\":[\"trainer\",\"consultant\",\"content-developer\",\"question-writer\"],\"options\":[{\"value\":\"onsite\",\"labelAr\":\"حضوري\",\"labelEn\":\"On-site\"},{\"value\":\"online\",\"labelAr\":\"عن بُعد\",\"labelEn\":\"Online\"},{\"value\":\"hybrid\",\"labelAr\":\"مدمج\",\"labelEn\":\"Hybrid\"}],\"ownership\":\"expert-hub\",\"order\":4}", "preferredDeliveryMode", "select", "نمط التقديم المفضل لديك", "Your preferred delivery mode", 4, "dm-gap-01.2026-08-30", "training-content" },
                    { new Guid("ff000000-0000-0000-0000-000000000035"), "{\"id\":\"portfolioLinks\",\"type\":\"text\",\"sectionId\":\"training-content\",\"labelAr\":\"روابط نماذج الأعمال أو مقاطع تقديمية\",\"labelEn\":\"Portfolio / sample work links\",\"helpAr\":\"رابط لفيديو تعريفي أو ملف عرض أو حلقة بودكاست أو أي نموذج من أعمالك.\",\"helpEn\":\"A link to an intro video, presentation, podcast episode, or any sample of your work.\",\"requiredFor\":[],\"validation\":{\"pattern\":\"^https?://\\\\S+$\",\"patternMessageAr\":\"أدخل رابطًا صحيحًا يبدأ بـ http:// أو https://\",\"patternMessageEn\":\"Enter a valid link starting with http:// or https://\"},\"ownership\":\"expert-hub\",\"order\":5}", "portfolioLinks", "text", "روابط نماذج الأعمال أو مقاطع تقديمية", "Portfolio / sample work links", 5, "dm-gap-01.2026-08-30", "training-content" },
                    { new Guid("ff000000-0000-0000-0000-000000000036"), "{\"id\":\"annualAvailability\",\"type\":\"select\",\"sectionId\":\"availability\",\"labelAr\":\"مدى التوفر خلال العام\",\"labelEn\":\"Availability throughout the year\",\"requiredFor\":[\"trainer\",\"consultant\",\"content-developer\",\"question-writer\"],\"options\":[{\"value\":\"full\",\"labelAr\":\"متاح طوال العام\",\"labelEn\":\"Available all year\"},{\"value\":\"partial\",\"labelAr\":\"متاح جزئيًا\",\"labelEn\":\"Partially available\"},{\"value\":\"limited\",\"labelAr\":\"متاح في فترات محدودة\",\"labelEn\":\"Limited periods\"}],\"ownership\":\"expert-hub\",\"order\":1}", "annualAvailability", "select", "مدى التوفر خلال العام", "Availability throughout the year", 1, "dm-gap-01.2026-08-30", "availability" },
                    { new Guid("ff000000-0000-0000-0000-000000000037"), "{\"id\":\"estimatedAnnualEngagements\",\"type\":\"select\",\"sectionId\":\"availability\",\"labelAr\":\"عدد المشاركات الممكنة سنويًا (تقريبًا)\",\"labelEn\":\"Estimated number of engagements per year\",\"requiredFor\":[\"trainer\",\"consultant\",\"content-developer\",\"question-writer\"],\"options\":[{\"value\":\"1-3\",\"labelAr\":\"1–3 مشاركات\",\"labelEn\":\"1–3 engagements\"},{\"value\":\"4-6\",\"labelAr\":\"4–6 مشاركات\",\"labelEn\":\"4–6 engagements\"},{\"value\":\"7+\",\"labelAr\":\"أكثر من 6 مشاركات\",\"labelEn\":\"More than 6 engagements\"}],\"ownership\":\"expert-hub\",\"order\":2}", "estimatedAnnualEngagements", "select", "عدد المشاركات الممكنة سنويًا (تقريبًا)", "Estimated number of engagements per year", 2, "dm-gap-01.2026-08-30", "availability" },
                    { new Guid("ff000000-0000-0000-0000-000000000038"), "{\"id\":\"inPersonCities\",\"type\":\"text\",\"sectionId\":\"availability\",\"labelAr\":\"المدن المتاح فيها الحضور الشخصي\",\"labelEn\":\"Cities available for in-person attendance\",\"helpAr\":\"مثال: الرياض، جدة، الدمام، أبوظبي.\",\"helpEn\":\"Example: Riyadh, Jeddah, Dammam, Abu Dhabi.\",\"requiredFor\":[\"trainer\",\"consultant\",\"content-developer\",\"question-writer\"],\"ownership\":\"expert-hub\",\"order\":3}", "inPersonCities", "text", "المدن المتاح فيها الحضور الشخصي", "Cities available for in-person attendance", 3, "dm-gap-01.2026-08-30", "availability" },
                    { new Guid("ff000000-0000-0000-0000-000000000039"), "{\"id\":\"preferredEngagementTypes\",\"type\":\"multi-select\",\"sectionId\":\"availability\",\"labelAr\":\"أنواع المشاركات التي تفضلها\",\"labelEn\":\"Preferred engagement types\",\"helpAr\":\"اختر كل ما ينطبق.\",\"helpEn\":\"Select all that apply.\",\"requiredFor\":[\"trainer\",\"consultant\",\"content-developer\",\"question-writer\"],\"options\":[{\"value\":\"short-training\",\"labelAr\":\"تدريب قصير (يوم أو أيام)\",\"labelEn\":\"Short-term training (day(s))\"},{\"value\":\"long-training\",\"labelAr\":\"تدريب طويل (أسابيع)\",\"labelEn\":\"Long-term training (weeks)\"},{\"value\":\"intensive-workshops\",\"labelAr\":\"ورش عمل مكثفة\",\"labelEn\":\"Intensive workshops\"},{\"value\":\"panels-hosting\",\"labelAr\":\"حلقات نقاش واستضافات\",\"labelEn\":\"Panel discussions & hosting\"},{\"value\":\"remote-training\",\"labelAr\":\"تدريب عن بُعد\",\"labelEn\":\"Remote/virtual training\"},{\"value\":\"community-initiatives\",\"labelAr\":\"مبادرات مجتمعية وتوعوية\",\"labelEn\":\"Community & awareness initiatives\"},{\"value\":\"student-programs\",\"labelAr\":\"برامج طلابية وجامعية\",\"labelEn\":\"Student & university programs\"},{\"value\":\"ongoing-mentoring\",\"labelAr\":\"إرشاد فردي مستمر\",\"labelEn\":\"Ongoing individual mentoring\"}],\"ownership\":\"expert-hub\",\"order\":4}", "preferredEngagementTypes", "multi-select", "أنواع المشاركات التي تفضلها", "Preferred engagement types", 4, "dm-gap-01.2026-08-30", "availability" }
                });

            migrationBuilder.InsertData(
                table: "FORM_SECTION",
                columns: new[] { "section_id", "order_index", "schema_version", "section_code", "title_ar", "title_en" },
                values: new object[,]
                {
                    { new Guid("f5000000-0000-0000-0000-000000000001"), 1, "dm-gap-01.2026-08-30", "personal", "المعلومات الأساسية", "Basic information" },
                    { new Guid("f5000000-0000-0000-0000-000000000002"), 2, "dm-gap-01.2026-08-30", "education", "المؤهلات العلمية", "Educational qualifications" },
                    { new Guid("f5000000-0000-0000-0000-000000000003"), 3, "dm-gap-01.2026-08-30", "certifications", "الشهادات المهنية", "Professional certifications" },
                    { new Guid("f5000000-0000-0000-0000-000000000004"), 4, "dm-gap-01.2026-08-30", "experience", "الخبرة العملية", "Practical experience" },
                    { new Guid("f5000000-0000-0000-0000-000000000005"), 5, "dm-gap-01.2026-08-30", "training-content", "الخبرة التدريبية والمحتوى", "Training experience & content" },
                    { new Guid("f5000000-0000-0000-0000-000000000006"), 6, "dm-gap-01.2026-08-30", "availability", "الجاهزية والإتاحة", "Availability & readiness" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_APPLICATION_applicant_user_id",
                table: "APPLICATION",
                column: "applicant_user_id");

            migrationBuilder.CreateIndex(
                name: "IX_APPLICATION_reference",
                table: "APPLICATION",
                column: "reference",
                unique: true,
                filter: "[reference] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_APPLICATION_schema_version",
                table: "APPLICATION",
                column: "schema_version");

            migrationBuilder.CreateIndex(
                name: "IX_APPLICATION_ATTACHMENT_application_id",
                table: "APPLICATION_ATTACHMENT",
                column: "application_id");

            migrationBuilder.CreateIndex(
                name: "IX_APPLICATION_ATTACHMENT_attachment_id",
                table: "APPLICATION_ATTACHMENT",
                column: "attachment_id");

            migrationBuilder.CreateIndex(
                name: "IX_APPLICATION_FIELD_VALUE_application_id_field_code",
                table: "APPLICATION_FIELD_VALUE",
                columns: new[] { "application_id", "field_code" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_APPLICATION_SERVICE_application_id_service",
                table: "APPLICATION_SERVICE",
                columns: new[] { "application_id", "service" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ATTACHMENT_RULE_schema_version_rule_code",
                table: "ATTACHMENT_RULE",
                columns: new[] { "schema_version", "rule_code" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_FORM_FIELD_schema_version_field_code",
                table: "FORM_FIELD",
                columns: new[] { "schema_version", "field_code" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_FORM_SECTION_schema_version_section_code",
                table: "FORM_SECTION",
                columns: new[] { "schema_version", "section_code" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SERVICE_REQUEST_application_id",
                table: "SERVICE_REQUEST",
                column: "application_id");

            migrationBuilder.CreateIndex(
                name: "IX_SERVICE_REQUEST_decided_by",
                table: "SERVICE_REQUEST",
                column: "decided_by");

            migrationBuilder.CreateIndex(
                name: "IX_SERVICE_REQUEST_reference",
                table: "SERVICE_REQUEST",
                column: "reference",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SERVICE_REQUEST_trainer_user_id",
                table: "SERVICE_REQUEST",
                column: "trainer_user_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "APPLICATION_ATTACHMENT");

            migrationBuilder.DropTable(
                name: "APPLICATION_FIELD_VALUE");

            migrationBuilder.DropTable(
                name: "APPLICATION_SERVICE");

            migrationBuilder.DropTable(
                name: "ATTACHMENT_RULE");

            migrationBuilder.DropTable(
                name: "FORM_FIELD");

            migrationBuilder.DropTable(
                name: "FORM_SECTION");

            migrationBuilder.DropTable(
                name: "SERVICE_REQUEST");

            migrationBuilder.DropTable(
                name: "APPLICATION");

            migrationBuilder.DropTable(
                name: "FORM_SCHEMA");
        }
    }
}
