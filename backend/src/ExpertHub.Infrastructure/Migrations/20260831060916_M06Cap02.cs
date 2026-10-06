using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace ExpertHub.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class M06Cap02 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ACCREDITATION_DECISION",
                columns: table => new
                {
                    decision_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    application_service_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    outcome = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    classification = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: true),
                    decided_by = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    decided_at = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ACCREDITATION_DECISION", x => x.decision_id);
                    table.ForeignKey(
                        name: "FK_ACCREDITATION_DECISION_APPLICATION_SERVICE_application_service_id",
                        column: x => x.application_service_id,
                        principalTable: "APPLICATION_SERVICE",
                        principalColumn: "application_service_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ACCREDITATION_DECISION_APP_USER_decided_by",
                        column: x => x.decided_by,
                        principalTable: "APP_USER",
                        principalColumn: "user_id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "AI_ANALYSIS",
                columns: table => new
                {
                    analysis_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    application_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    summary_ar = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    summary_en = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    detail = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    advisory_score = table.Column<decimal>(type: "decimal(5,1)", precision: 5, scale: 1, nullable: true),
                    analyzed_field_codes = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: false),
                    provider = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    model_version = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    prompt_version = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    produced_at = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AI_ANALYSIS", x => x.analysis_id);
                    table.ForeignKey(
                        name: "FK_AI_ANALYSIS_APPLICATION_application_id",
                        column: x => x.application_id,
                        principalTable: "APPLICATION",
                        principalColumn: "application_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "COMMITTEE_SEQUENCE",
                columns: table => new
                {
                    sequence_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    application_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    created_from_template_id = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    status = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    current_step_index = table.Column<int>(type: "int", nullable: false),
                    created_by = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false),
                    decided_at = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_COMMITTEE_SEQUENCE", x => x.sequence_id);
                    table.ForeignKey(
                        name: "FK_COMMITTEE_SEQUENCE_APPLICATION_application_id",
                        column: x => x.application_id,
                        principalTable: "APPLICATION",
                        principalColumn: "application_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_COMMITTEE_SEQUENCE_APP_USER_created_by",
                        column: x => x.created_by,
                        principalTable: "APP_USER",
                        principalColumn: "user_id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "COMMITTEE_TEMPLATE",
                columns: table => new
                {
                    template_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    members = table.Column<string>(type: "nvarchar(4000)", maxLength: 4000, nullable: false),
                    created_by = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_COMMITTEE_TEMPLATE", x => x.template_id);
                    table.ForeignKey(
                        name: "FK_COMMITTEE_TEMPLATE_APP_USER_created_by",
                        column: x => x.created_by,
                        principalTable: "APP_USER",
                        principalColumn: "user_id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "EVALUATION_MODEL",
                columns: table => new
                {
                    model_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    service = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    version = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    pass_threshold = table.Column<decimal>(type: "decimal(5,1)", precision: 5, scale: 1, nullable: false),
                    is_active = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EVALUATION_MODEL", x => x.model_id);
                });

            migrationBuilder.CreateTable(
                name: "INTERVIEW",
                columns: table => new
                {
                    interview_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    application_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ticket_number = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    status = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    confirmed_slot_id = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    reschedule_requested_at = table.Column<DateTime>(type: "datetime2", nullable: true),
                    reschedule_note = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    reschedule_count = table.Column<int>(type: "int", nullable: false),
                    meeting_url = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    sla_due_at = table.Column<DateTime>(type: "datetime2", nullable: true),
                    decision = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    decision_reason_id = table.Column<string>(type: "nvarchar(60)", maxLength: 60, nullable: true),
                    decision_reason_text = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    decided_by = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    decided_at = table.Column<DateTime>(type: "datetime2", nullable: true),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_INTERVIEW", x => x.interview_id);
                    table.ForeignKey(
                        name: "FK_INTERVIEW_APPLICATION_application_id",
                        column: x => x.application_id,
                        principalTable: "APPLICATION",
                        principalColumn: "application_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "INTERVIEW_MODEL",
                columns: table => new
                {
                    interview_model_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    service = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    version = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    is_active = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_INTERVIEW_MODEL", x => x.interview_model_id);
                });

            migrationBuilder.CreateTable(
                name: "COMMITTEE_STEP",
                columns: table => new
                {
                    step_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    sequence_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    member_user_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    order_index = table.Column<int>(type: "int", nullable: false),
                    is_mandatory = table.Column<bool>(type: "bit", nullable: false),
                    decision = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: true),
                    rejection_reason_id = table.Column<string>(type: "nvarchar(60)", maxLength: 60, nullable: true),
                    rejection_reason_text = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    note = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    acted_at = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_COMMITTEE_STEP", x => x.step_id);
                    table.ForeignKey(
                        name: "FK_COMMITTEE_STEP_APP_USER_member_user_id",
                        column: x => x.member_user_id,
                        principalTable: "APP_USER",
                        principalColumn: "user_id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_COMMITTEE_STEP_COMMITTEE_SEQUENCE_sequence_id",
                        column: x => x.sequence_id,
                        principalTable: "COMMITTEE_SEQUENCE",
                        principalColumn: "sequence_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "EVALUATION_CRITERION",
                columns: table => new
                {
                    criterion_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    model_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    label_ar = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    label_en = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    source_section_code = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    weight = table.Column<decimal>(type: "decimal(5,1)", precision: 5, scale: 1, nullable: false),
                    order_index = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EVALUATION_CRITERION", x => x.criterion_id);
                    table.ForeignKey(
                        name: "FK_EVALUATION_CRITERION_EVALUATION_MODEL_model_id",
                        column: x => x.model_id,
                        principalTable: "EVALUATION_MODEL",
                        principalColumn: "model_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SCREENING_RESULT",
                columns: table => new
                {
                    screening_result_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    application_service_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    model_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    objective_score = table.Column<decimal>(type: "decimal(5,1)", precision: 5, scale: 1, nullable: false),
                    decision = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    rejection_reason = table.Column<string>(type: "nvarchar(60)", maxLength: 60, nullable: true),
                    rejection_reason_text = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    exemption_reason = table.Column<string>(type: "nvarchar(60)", maxLength: 60, nullable: true),
                    exemption_reason_text = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    decided_by = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    decided_at = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SCREENING_RESULT", x => x.screening_result_id);
                    table.ForeignKey(
                        name: "FK_SCREENING_RESULT_APPLICATION_SERVICE_application_service_id",
                        column: x => x.application_service_id,
                        principalTable: "APPLICATION_SERVICE",
                        principalColumn: "application_service_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_SCREENING_RESULT_APP_USER_decided_by",
                        column: x => x.decided_by,
                        principalTable: "APP_USER",
                        principalColumn: "user_id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_SCREENING_RESULT_EVALUATION_MODEL_model_id",
                        column: x => x.model_id,
                        principalTable: "EVALUATION_MODEL",
                        principalColumn: "model_id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "INTERVIEW_EVALUATION",
                columns: table => new
                {
                    interview_evaluation_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    interview_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    evaluator_user_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    did_not_attend = table.Column<bool>(type: "bit", nullable: false),
                    recommendations = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    note = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    submitted_at = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_INTERVIEW_EVALUATION", x => x.interview_evaluation_id);
                    table.ForeignKey(
                        name: "FK_INTERVIEW_EVALUATION_APP_USER_evaluator_user_id",
                        column: x => x.evaluator_user_id,
                        principalTable: "APP_USER",
                        principalColumn: "user_id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_INTERVIEW_EVALUATION_INTERVIEW_interview_id",
                        column: x => x.interview_id,
                        principalTable: "INTERVIEW",
                        principalColumn: "interview_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "INTERVIEW_SLOT",
                columns: table => new
                {
                    slot_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    interview_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    starts_at = table.Column<DateTime>(type: "datetime2", nullable: false),
                    is_superseded = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_INTERVIEW_SLOT", x => x.slot_id);
                    table.ForeignKey(
                        name: "FK_INTERVIEW_SLOT_INTERVIEW_interview_id",
                        column: x => x.interview_id,
                        principalTable: "INTERVIEW",
                        principalColumn: "interview_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "INTERVIEW_AXIS",
                columns: table => new
                {
                    axis_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    interview_model_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    axis_code = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    label_ar = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    label_en = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    description_ar = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    description_en = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    weight = table.Column<decimal>(type: "decimal(5,1)", precision: 5, scale: 1, nullable: false),
                    max_score = table.Column<decimal>(type: "decimal(4,1)", precision: 4, scale: 1, nullable: false),
                    order_index = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_INTERVIEW_AXIS", x => x.axis_id);
                    table.ForeignKey(
                        name: "FK_INTERVIEW_AXIS_INTERVIEW_MODEL_interview_model_id",
                        column: x => x.interview_model_id,
                        principalTable: "INTERVIEW_MODEL",
                        principalColumn: "interview_model_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SCREENING_CRITERION_SCORE",
                columns: table => new
                {
                    score_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    screening_result_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    criterion_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    raw_score = table.Column<decimal>(type: "decimal(5,1)", precision: 5, scale: 1, nullable: false),
                    weighted_score = table.Column<decimal>(type: "decimal(5,1)", precision: 5, scale: 1, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SCREENING_CRITERION_SCORE", x => x.score_id);
                    table.ForeignKey(
                        name: "FK_SCREENING_CRITERION_SCORE_EVALUATION_CRITERION_criterion_id",
                        column: x => x.criterion_id,
                        principalTable: "EVALUATION_CRITERION",
                        principalColumn: "criterion_id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_SCREENING_CRITERION_SCORE_SCREENING_RESULT_screening_result_id",
                        column: x => x.screening_result_id,
                        principalTable: "SCREENING_RESULT",
                        principalColumn: "screening_result_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "INTERVIEW_AXIS_SCORE",
                columns: table => new
                {
                    axis_score_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    interview_evaluation_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    axis_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    service = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    score = table.Column<decimal>(type: "decimal(4,1)", precision: 4, scale: 1, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_INTERVIEW_AXIS_SCORE", x => x.axis_score_id);
                    table.ForeignKey(
                        name: "FK_INTERVIEW_AXIS_SCORE_INTERVIEW_AXIS_axis_id",
                        column: x => x.axis_id,
                        principalTable: "INTERVIEW_AXIS",
                        principalColumn: "axis_id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_INTERVIEW_AXIS_SCORE_INTERVIEW_EVALUATION_interview_evaluation_id",
                        column: x => x.interview_evaluation_id,
                        principalTable: "INTERVIEW_EVALUATION",
                        principalColumn: "interview_evaluation_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "EVALUATION_MODEL",
                columns: new[] { "model_id", "is_active", "pass_threshold", "service", "version" },
                values: new object[,]
                {
                    { new Guid("e1000000-0000-0000-0000-000000000001"), true, 70m, "trainer", "mock-dm-gap-02-draft.1" },
                    { new Guid("e1000000-0000-0000-0000-000000000002"), true, 75m, "consultant", "mock-dm-gap-02-draft.1" },
                    { new Guid("e1000000-0000-0000-0000-000000000003"), true, 70m, "content-developer", "mock-dm-gap-02-draft.1" },
                    { new Guid("e1000000-0000-0000-0000-000000000004"), true, 70m, "question-writer", "mock-dm-gap-02-draft.1" }
                });

            migrationBuilder.InsertData(
                table: "INTERVIEW_MODEL",
                columns: new[] { "interview_model_id", "is_active", "service", "version" },
                values: new object[,]
                {
                    { new Guid("e3000000-0000-0000-0000-000000000001"), true, "trainer", "mock-dm-gap-03-draft.1" },
                    { new Guid("e3000000-0000-0000-0000-000000000002"), true, "consultant", "mock-dm-gap-03-draft.1" },
                    { new Guid("e3000000-0000-0000-0000-000000000003"), true, "content-developer", "mock-dm-gap-03-draft.1" },
                    { new Guid("e3000000-0000-0000-0000-000000000004"), true, "question-writer", "mock-dm-gap-03-draft.1" }
                });

            migrationBuilder.InsertData(
                table: "EVALUATION_CRITERION",
                columns: new[] { "criterion_id", "label_ar", "label_en", "model_id", "order_index", "source_section_code", "weight" },
                values: new object[,]
                {
                    { new Guid("e2000000-0000-0000-0000-000000000011"), "المؤهلات العلمية", "Educational qualifications", new Guid("e1000000-0000-0000-0000-000000000001"), 1, "education", 20m },
                    { new Guid("e2000000-0000-0000-0000-000000000012"), "الشهادات المهنية", "Professional certifications", new Guid("e1000000-0000-0000-0000-000000000001"), 2, "certifications", 15m },
                    { new Guid("e2000000-0000-0000-0000-000000000013"), "الخبرة العملية", "Practical experience", new Guid("e1000000-0000-0000-0000-000000000001"), 3, "experience", 25m },
                    { new Guid("e2000000-0000-0000-0000-000000000014"), "الخبرة التدريبية والمحتوى", "Training experience & content", new Guid("e1000000-0000-0000-0000-000000000001"), 4, "training-content", 30m },
                    { new Guid("e2000000-0000-0000-0000-000000000015"), "الجاهزية والإتاحة", "Availability & readiness", new Guid("e1000000-0000-0000-0000-000000000001"), 5, "availability", 10m },
                    { new Guid("e2000000-0000-0000-0000-000000000021"), "المؤهلات العلمية", "Educational qualifications", new Guid("e1000000-0000-0000-0000-000000000002"), 1, "education", 25m },
                    { new Guid("e2000000-0000-0000-0000-000000000022"), "الشهادات المهنية", "Professional certifications", new Guid("e1000000-0000-0000-0000-000000000002"), 2, "certifications", 20m },
                    { new Guid("e2000000-0000-0000-0000-000000000023"), "الخبرة العملية", "Practical experience", new Guid("e1000000-0000-0000-0000-000000000002"), 3, "experience", 35m },
                    { new Guid("e2000000-0000-0000-0000-000000000024"), "الخبرة التدريبية والمحتوى", "Training experience & content", new Guid("e1000000-0000-0000-0000-000000000002"), 4, "training-content", 10m },
                    { new Guid("e2000000-0000-0000-0000-000000000025"), "الجاهزية والإتاحة", "Availability & readiness", new Guid("e1000000-0000-0000-0000-000000000002"), 5, "availability", 10m },
                    { new Guid("e2000000-0000-0000-0000-000000000031"), "المؤهلات العلمية", "Educational qualifications", new Guid("e1000000-0000-0000-0000-000000000003"), 1, "education", 20m },
                    { new Guid("e2000000-0000-0000-0000-000000000032"), "الشهادات المهنية", "Professional certifications", new Guid("e1000000-0000-0000-0000-000000000003"), 2, "certifications", 15m },
                    { new Guid("e2000000-0000-0000-0000-000000000033"), "الخبرة العملية", "Practical experience", new Guid("e1000000-0000-0000-0000-000000000003"), 3, "experience", 25m },
                    { new Guid("e2000000-0000-0000-0000-000000000034"), "الخبرة التدريبية والمحتوى", "Training experience & content", new Guid("e1000000-0000-0000-0000-000000000003"), 4, "training-content", 30m },
                    { new Guid("e2000000-0000-0000-0000-000000000035"), "الجاهزية والإتاحة", "Availability & readiness", new Guid("e1000000-0000-0000-0000-000000000003"), 5, "availability", 10m },
                    { new Guid("e2000000-0000-0000-0000-000000000041"), "المؤهلات العلمية", "Educational qualifications", new Guid("e1000000-0000-0000-0000-000000000004"), 1, "education", 25m },
                    { new Guid("e2000000-0000-0000-0000-000000000042"), "الشهادات المهنية", "Professional certifications", new Guid("e1000000-0000-0000-0000-000000000004"), 2, "certifications", 20m },
                    { new Guid("e2000000-0000-0000-0000-000000000043"), "الخبرة العملية", "Practical experience", new Guid("e1000000-0000-0000-0000-000000000004"), 3, "experience", 25m },
                    { new Guid("e2000000-0000-0000-0000-000000000044"), "الخبرة التدريبية والمحتوى", "Training experience & content", new Guid("e1000000-0000-0000-0000-000000000004"), 4, "training-content", 20m },
                    { new Guid("e2000000-0000-0000-0000-000000000045"), "الجاهزية والإتاحة", "Availability & readiness", new Guid("e1000000-0000-0000-0000-000000000004"), 5, "availability", 10m }
                });

            migrationBuilder.InsertData(
                table: "INTERVIEW_AXIS",
                columns: new[] { "axis_id", "axis_code", "description_ar", "description_en", "interview_model_id", "label_ar", "label_en", "max_score", "order_index", "weight" },
                values: new object[,]
                {
                    { new Guid("e4000000-0000-0000-0000-000000000011"), "subject-mastery", "عمق المعرفة بالمجال ودقة الإجابة عن الأسئلة التخصصية.", "Depth of domain knowledge and accuracy on specialist questions.", new Guid("e3000000-0000-0000-0000-000000000001"), "التمكن من المادة العلمية", "Subject-matter mastery", 5m, 1, 30m },
                    { new Guid("e4000000-0000-0000-0000-000000000012"), "delivery-skills", "وضوح الطرح، إدارة الوقت، والتفاعل مع الحضور.", "Clarity, time management, and audience engagement.", new Guid("e3000000-0000-0000-0000-000000000001"), "مهارات العرض والتقديم", "Presentation & delivery skills", 5m, 2, 25m },
                    { new Guid("e4000000-0000-0000-0000-000000000013"), "practical-experience", "القدرة على ربط المحتوى بحالات عملية من السوق.", "Ability to connect content to real market cases.", new Guid("e3000000-0000-0000-0000-000000000001"), "الخبرة التطبيقية", "Applied experience", 5m, 3, 25m },
                    { new Guid("e4000000-0000-0000-0000-000000000014"), "professional-conduct", "الالتزام، والتواصل، والاستعداد للمقابلة.", "Commitment, communication, and interview readiness.", new Guid("e3000000-0000-0000-0000-000000000001"), "السلوك المهني", "Professional conduct", 5m, 4, 20m },
                    { new Guid("e4000000-0000-0000-0000-000000000021"), "subject-mastery", "عمق المعرفة بالمجال ودقة الإجابة عن الأسئلة التخصصية.", "Depth of domain knowledge and accuracy on specialist questions.", new Guid("e3000000-0000-0000-0000-000000000002"), "التمكن من المادة العلمية", "Subject-matter mastery", 5m, 1, 30m },
                    { new Guid("e4000000-0000-0000-0000-000000000022"), "delivery-skills", "وضوح الطرح، إدارة الوقت، والتفاعل مع الحضور.", "Clarity, time management, and audience engagement.", new Guid("e3000000-0000-0000-0000-000000000002"), "مهارات العرض والتقديم", "Presentation & delivery skills", 5m, 2, 25m },
                    { new Guid("e4000000-0000-0000-0000-000000000023"), "practical-experience", "القدرة على ربط المحتوى بحالات عملية من السوق.", "Ability to connect content to real market cases.", new Guid("e3000000-0000-0000-0000-000000000002"), "الخبرة التطبيقية", "Applied experience", 5m, 3, 25m },
                    { new Guid("e4000000-0000-0000-0000-000000000024"), "professional-conduct", "الالتزام، والتواصل، والاستعداد للمقابلة.", "Commitment, communication, and interview readiness.", new Guid("e3000000-0000-0000-0000-000000000002"), "السلوك المهني", "Professional conduct", 5m, 4, 20m },
                    { new Guid("e4000000-0000-0000-0000-000000000031"), "subject-mastery", "عمق المعرفة بالمجال ودقة الإجابة عن الأسئلة التخصصية.", "Depth of domain knowledge and accuracy on specialist questions.", new Guid("e3000000-0000-0000-0000-000000000003"), "التمكن من المادة العلمية", "Subject-matter mastery", 5m, 1, 30m },
                    { new Guid("e4000000-0000-0000-0000-000000000032"), "delivery-skills", "وضوح الطرح، إدارة الوقت، والتفاعل مع الحضور.", "Clarity, time management, and audience engagement.", new Guid("e3000000-0000-0000-0000-000000000003"), "مهارات العرض والتقديم", "Presentation & delivery skills", 5m, 2, 25m },
                    { new Guid("e4000000-0000-0000-0000-000000000033"), "practical-experience", "القدرة على ربط المحتوى بحالات عملية من السوق.", "Ability to connect content to real market cases.", new Guid("e3000000-0000-0000-0000-000000000003"), "الخبرة التطبيقية", "Applied experience", 5m, 3, 25m },
                    { new Guid("e4000000-0000-0000-0000-000000000034"), "professional-conduct", "الالتزام، والتواصل، والاستعداد للمقابلة.", "Commitment, communication, and interview readiness.", new Guid("e3000000-0000-0000-0000-000000000003"), "السلوك المهني", "Professional conduct", 5m, 4, 20m },
                    { new Guid("e4000000-0000-0000-0000-000000000041"), "subject-mastery", "عمق المعرفة بالمجال ودقة الإجابة عن الأسئلة التخصصية.", "Depth of domain knowledge and accuracy on specialist questions.", new Guid("e3000000-0000-0000-0000-000000000004"), "التمكن من المادة العلمية", "Subject-matter mastery", 5m, 1, 30m },
                    { new Guid("e4000000-0000-0000-0000-000000000042"), "delivery-skills", "وضوح الطرح، إدارة الوقت، والتفاعل مع الحضور.", "Clarity, time management, and audience engagement.", new Guid("e3000000-0000-0000-0000-000000000004"), "مهارات العرض والتقديم", "Presentation & delivery skills", 5m, 2, 25m },
                    { new Guid("e4000000-0000-0000-0000-000000000043"), "practical-experience", "القدرة على ربط المحتوى بحالات عملية من السوق.", "Ability to connect content to real market cases.", new Guid("e3000000-0000-0000-0000-000000000004"), "الخبرة التطبيقية", "Applied experience", 5m, 3, 25m },
                    { new Guid("e4000000-0000-0000-0000-000000000044"), "professional-conduct", "الالتزام، والتواصل، والاستعداد للمقابلة.", "Commitment, communication, and interview readiness.", new Guid("e3000000-0000-0000-0000-000000000004"), "السلوك المهني", "Professional conduct", 5m, 4, 20m }
                });

            migrationBuilder.CreateIndex(
                name: "IX_ACCREDITATION_DECISION_application_service_id",
                table: "ACCREDITATION_DECISION",
                column: "application_service_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ACCREDITATION_DECISION_decided_by",
                table: "ACCREDITATION_DECISION",
                column: "decided_by");

            migrationBuilder.CreateIndex(
                name: "IX_AI_ANALYSIS_application_id",
                table: "AI_ANALYSIS",
                column: "application_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_COMMITTEE_SEQUENCE_application_id",
                table: "COMMITTEE_SEQUENCE",
                column: "application_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_COMMITTEE_SEQUENCE_created_by",
                table: "COMMITTEE_SEQUENCE",
                column: "created_by");

            migrationBuilder.CreateIndex(
                name: "IX_COMMITTEE_STEP_member_user_id",
                table: "COMMITTEE_STEP",
                column: "member_user_id");

            migrationBuilder.CreateIndex(
                name: "IX_COMMITTEE_STEP_sequence_id_order_index",
                table: "COMMITTEE_STEP",
                columns: new[] { "sequence_id", "order_index" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_COMMITTEE_TEMPLATE_created_by",
                table: "COMMITTEE_TEMPLATE",
                column: "created_by");

            migrationBuilder.CreateIndex(
                name: "IX_EVALUATION_CRITERION_model_id",
                table: "EVALUATION_CRITERION",
                column: "model_id");

            migrationBuilder.CreateIndex(
                name: "IX_EVALUATION_MODEL_service_version",
                table: "EVALUATION_MODEL",
                columns: new[] { "service", "version" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_INTERVIEW_application_id",
                table: "INTERVIEW",
                column: "application_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_INTERVIEW_ticket_number",
                table: "INTERVIEW",
                column: "ticket_number",
                unique: true,
                filter: "[ticket_number] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_INTERVIEW_AXIS_interview_model_id",
                table: "INTERVIEW_AXIS",
                column: "interview_model_id");

            migrationBuilder.CreateIndex(
                name: "IX_INTERVIEW_AXIS_SCORE_axis_id",
                table: "INTERVIEW_AXIS_SCORE",
                column: "axis_id");

            migrationBuilder.CreateIndex(
                name: "IX_INTERVIEW_AXIS_SCORE_interview_evaluation_id_axis_id_service",
                table: "INTERVIEW_AXIS_SCORE",
                columns: new[] { "interview_evaluation_id", "axis_id", "service" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_INTERVIEW_EVALUATION_evaluator_user_id",
                table: "INTERVIEW_EVALUATION",
                column: "evaluator_user_id");

            migrationBuilder.CreateIndex(
                name: "IX_INTERVIEW_EVALUATION_interview_id_evaluator_user_id",
                table: "INTERVIEW_EVALUATION",
                columns: new[] { "interview_id", "evaluator_user_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_INTERVIEW_MODEL_service_version",
                table: "INTERVIEW_MODEL",
                columns: new[] { "service", "version" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_INTERVIEW_SLOT_interview_id",
                table: "INTERVIEW_SLOT",
                column: "interview_id");

            migrationBuilder.CreateIndex(
                name: "IX_SCREENING_CRITERION_SCORE_criterion_id",
                table: "SCREENING_CRITERION_SCORE",
                column: "criterion_id");

            migrationBuilder.CreateIndex(
                name: "IX_SCREENING_CRITERION_SCORE_screening_result_id",
                table: "SCREENING_CRITERION_SCORE",
                column: "screening_result_id");

            migrationBuilder.CreateIndex(
                name: "IX_SCREENING_RESULT_application_service_id",
                table: "SCREENING_RESULT",
                column: "application_service_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SCREENING_RESULT_decided_by",
                table: "SCREENING_RESULT",
                column: "decided_by");

            migrationBuilder.CreateIndex(
                name: "IX_SCREENING_RESULT_model_id",
                table: "SCREENING_RESULT",
                column: "model_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ACCREDITATION_DECISION");

            migrationBuilder.DropTable(
                name: "AI_ANALYSIS");

            migrationBuilder.DropTable(
                name: "COMMITTEE_STEP");

            migrationBuilder.DropTable(
                name: "COMMITTEE_TEMPLATE");

            migrationBuilder.DropTable(
                name: "INTERVIEW_AXIS_SCORE");

            migrationBuilder.DropTable(
                name: "INTERVIEW_SLOT");

            migrationBuilder.DropTable(
                name: "SCREENING_CRITERION_SCORE");

            migrationBuilder.DropTable(
                name: "COMMITTEE_SEQUENCE");

            migrationBuilder.DropTable(
                name: "INTERVIEW_AXIS");

            migrationBuilder.DropTable(
                name: "INTERVIEW_EVALUATION");

            migrationBuilder.DropTable(
                name: "EVALUATION_CRITERION");

            migrationBuilder.DropTable(
                name: "SCREENING_RESULT");

            migrationBuilder.DropTable(
                name: "INTERVIEW_MODEL");

            migrationBuilder.DropTable(
                name: "INTERVIEW");

            migrationBuilder.DropTable(
                name: "EVALUATION_MODEL");
        }
    }
}
