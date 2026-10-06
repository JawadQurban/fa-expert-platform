using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace ExpertHub.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class M03IntegrationHub : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "INTEGRATED_SYSTEM",
                columns: table => new
                {
                    system_code = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    name_ar = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    name_en = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    direction = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    benefiting_capabilities = table.Column<string>(type: "nvarchar(400)", maxLength: 400, nullable: false),
                    importance = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    is_active = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_INTEGRATED_SYSTEM", x => x.system_code);
                });

            migrationBuilder.CreateTable(
                name: "DATA_ELEMENT",
                columns: table => new
                {
                    element_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    system_code = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    element_name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    owning_system = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: false),
                    entity_name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    direction = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DATA_ELEMENT", x => x.element_id);
                    table.ForeignKey(
                        name: "FK_DATA_ELEMENT_INTEGRATED_SYSTEM_system_code",
                        column: x => x.system_code,
                        principalTable: "INTEGRATED_SYSTEM",
                        principalColumn: "system_code",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "INTEGRATION_LOG",
                columns: table => new
                {
                    log_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    system_code = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    operation = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: false),
                    entity_type = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    entity_id = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    idempotency_key = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    outcome = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    error_detail = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    attempt_number = table.Column<int>(type: "int", nullable: false),
                    occurred_at = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_INTEGRATION_LOG", x => x.log_id);
                    table.ForeignKey(
                        name: "FK_INTEGRATION_LOG_INTEGRATED_SYSTEM_system_code",
                        column: x => x.system_code,
                        principalTable: "INTEGRATED_SYSTEM",
                        principalColumn: "system_code",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "OUTBOX_MESSAGE",
                columns: table => new
                {
                    outbox_message_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    system_code = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    element_name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    entity_type = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    entity_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    entity_version = table.Column<int>(type: "int", nullable: false),
                    operation = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: false),
                    payload = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    idempotency_key = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    attempt_count = table.Column<int>(type: "int", nullable: false),
                    next_attempt_at = table.Column<DateTime>(type: "datetime2", nullable: false),
                    last_error = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false),
                    published_at = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OUTBOX_MESSAGE", x => x.outbox_message_id);
                    table.ForeignKey(
                        name: "FK_OUTBOX_MESSAGE_INTEGRATED_SYSTEM_system_code",
                        column: x => x.system_code,
                        principalTable: "INTEGRATED_SYSTEM",
                        principalColumn: "system_code",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "REPLICATION_STATE",
                columns: table => new
                {
                    state_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    entity_type = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    local_entity_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    remote_entity_id = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    system_code = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    master_side = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    local_version = table.Column<int>(type: "int", nullable: false),
                    remote_version = table.Column<int>(type: "int", nullable: true),
                    last_synced_at = table.Column<DateTime>(type: "datetime2", nullable: true),
                    drift_status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_REPLICATION_STATE", x => x.state_id);
                    table.ForeignKey(
                        name: "FK_REPLICATION_STATE_INTEGRATED_SYSTEM_system_code",
                        column: x => x.system_code,
                        principalTable: "INTEGRATED_SYSTEM",
                        principalColumn: "system_code",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.InsertData(
                table: "INTEGRATED_SYSTEM",
                columns: new[] { "system_code", "benefiting_capabilities", "direction", "importance", "is_active", "name_ar", "name_en" },
                values: new object[,]
                {
                    { "INT-01", "[\"CAP-08\",\"CAP-09\"]", "bidirectional", "critical", true, "هوية الأكاديمية (الدخول الموحد)", "Academy identity (SSO)" },
                    { "INT-02", "[\"CAP-04\",\"CAP-02\"]", "inbound", "high", true, "نظام تقييمات المتدربين (MTM)", "MTM trainee-evaluation system" },
                    { "INT-03", "[\"CAP-06\"]", "inbound", "high", true, "نظام تخطيط الموارد (ERP)", "ERP" },
                    { "INT-04", "[\"CAP-07\"]", "outbound", "high", true, "بوابة البريد الإلكتروني", "Email gateway" },
                    { "INT-05", "[\"CAP-03\",\"CAP-05\",\"CAP-04\"]", "bidirectional", "critical", true, "نظام فاست (إدارة التدريب)", "FAST training management" },
                    { "INT-06", "[\"CAP-01\"]", "bidirectional", "medium", true, "مزوّد الذكاء الاصطناعي", "AI provider" }
                });

            migrationBuilder.InsertData(
                table: "DATA_ELEMENT",
                columns: new[] { "element_id", "direction", "element_name", "entity_name", "owning_system", "system_code" },
                values: new object[,]
                {
                    { new Guid("de000000-0000-0000-0000-000000000001"), "inbound", "trainer_profile_base", "TRAINER", "fast", "INT-05" },
                    { new Guid("de000000-0000-0000-0000-000000000002"), "outbound", "trainer_accreditation", "TRAINER", "expert_hub", "INT-05" },
                    { new Guid("de000000-0000-0000-0000-000000000003"), "outbound", "engagement", "PlanTrainer", "expert_hub", "INT-05" },
                    { new Guid("de000000-0000-0000-0000-000000000004"), "outbound", "approved_training_material", "TrainingMaterial", "expert_hub", "INT-05" },
                    { new Guid("de000000-0000-0000-0000-000000000005"), "inbound", "programme_plan", "Plan", "fast", "INT-05" },
                    { new Guid("de000000-0000-0000-0000-000000000006"), "inbound", "enrolment_attendance", "PlanTaker", "fast", "INT-05" },
                    { new Guid("de000000-0000-0000-0000-000000000007"), "inbound", "trainee_evaluation", "SurveyResponse", "mtm", "INT-02" },
                    { new Guid("de000000-0000-0000-0000-000000000008"), "inbound", "entitlement", "PurchaseOrder", "erp", "INT-03" },
                    { new Guid("de000000-0000-0000-0000-000000000009"), "inbound", "user_identity", "APP_USER", "academy_identity", "INT-01" },
                    { new Guid("de000000-0000-0000-0000-000000000010"), "outbound", "notification_message", "NOTIFICATION_LOG", "expert_hub", "INT-04" },
                    { new Guid("de000000-0000-0000-0000-000000000011"), "outbound", "screening_analysis", "AI_ANALYSIS", "expert_hub", "INT-06" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_DATA_ELEMENT_system_code_element_name",
                table: "DATA_ELEMENT",
                columns: new[] { "system_code", "element_name" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_INTEGRATION_LOG_system_code_occurred_at",
                table: "INTEGRATION_LOG",
                columns: new[] { "system_code", "occurred_at" });

            migrationBuilder.CreateIndex(
                name: "IX_OUTBOX_MESSAGE_idempotency_key",
                table: "OUTBOX_MESSAGE",
                column: "idempotency_key",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_OUTBOX_MESSAGE_status_next_attempt_at",
                table: "OUTBOX_MESSAGE",
                columns: new[] { "status", "next_attempt_at" });

            migrationBuilder.CreateIndex(
                name: "IX_OUTBOX_MESSAGE_system_code",
                table: "OUTBOX_MESSAGE",
                column: "system_code");

            migrationBuilder.CreateIndex(
                name: "IX_REPLICATION_STATE_entity_type_local_entity_id_system_code",
                table: "REPLICATION_STATE",
                columns: new[] { "entity_type", "local_entity_id", "system_code" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_REPLICATION_STATE_system_code",
                table: "REPLICATION_STATE",
                column: "system_code");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DATA_ELEMENT");

            migrationBuilder.DropTable(
                name: "INTEGRATION_LOG");

            migrationBuilder.DropTable(
                name: "OUTBOX_MESSAGE");

            migrationBuilder.DropTable(
                name: "REPLICATION_STATE");

            migrationBuilder.DropTable(
                name: "INTEGRATED_SYSTEM");
        }
    }
}
