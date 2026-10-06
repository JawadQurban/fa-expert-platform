using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ExpertHub.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class M07Agreements : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "kind",
                table: "COMMITTEE_TEMPLATE",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateTable(
                name: "AGREEMENT_TEMPLATE",
                columns: table => new
                {
                    template_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    version = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    body_text = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    field_map = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    services = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    is_active = table.Column<bool>(type: "bit", nullable: false),
                    updated_at = table.Column<DateTime>(type: "datetime2", nullable: false),
                    updated_by = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AGREEMENT_TEMPLATE", x => x.template_id);
                });

            migrationBuilder.CreateTable(
                name: "BANK_DATA",
                columns: table => new
                {
                    user_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    fields = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    requested_at = table.Column<DateTime>(type: "datetime2", nullable: true),
                    completed_at = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BANK_DATA", x => x.user_id);
                    table.ForeignKey(
                        name: "FK_BANK_DATA_APP_USER_user_id",
                        column: x => x.user_id,
                        principalTable: "APP_USER",
                        principalColumn: "user_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AGREEMENT",
                columns: table => new
                {
                    agreement_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    trainer_user_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    application_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    template_id = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    reference = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    status = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    starts_at = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ends_at = table.Column<DateTime>(type: "datetime2", nullable: true),
                    term_years = table.Column<int>(type: "int", nullable: false),
                    renewal_count = table.Column<int>(type: "int", nullable: false),
                    field_values = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    sent_to_applicant_at = table.Column<DateTime>(type: "datetime2", nullable: true),
                    applicant_decision = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: true),
                    applicant_decision_note = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    applicant_signature_name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    applicant_decided_at = table.Column<DateTime>(type: "datetime2", nullable: true),
                    created_by = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AGREEMENT", x => x.agreement_id);
                    table.ForeignKey(
                        name: "FK_AGREEMENT_AGREEMENT_TEMPLATE_template_id",
                        column: x => x.template_id,
                        principalTable: "AGREEMENT_TEMPLATE",
                        principalColumn: "template_id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_AGREEMENT_APPLICATION_application_id",
                        column: x => x.application_id,
                        principalTable: "APPLICATION",
                        principalColumn: "application_id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_AGREEMENT_APP_USER_trainer_user_id",
                        column: x => x.trainer_user_id,
                        principalTable: "APP_USER",
                        principalColumn: "user_id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ADDENDUM",
                columns: table => new
                {
                    addendum_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    agreement_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    service = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    document_file_name = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    service_request_id = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    approved_by = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    approved_at = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ADDENDUM", x => x.addendum_id);
                    table.ForeignKey(
                        name: "FK_ADDENDUM_AGREEMENT_agreement_id",
                        column: x => x.agreement_id,
                        principalTable: "AGREEMENT",
                        principalColumn: "agreement_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ADDENDUM_SERVICE_REQUEST_service_request_id",
                        column: x => x.service_request_id,
                        principalTable: "SERVICE_REQUEST",
                        principalColumn: "service_request_id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "AGREEMENT_EVENT",
                columns: table => new
                {
                    event_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    agreement_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    kind = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    term_years = table.Column<int>(type: "int", nullable: true),
                    note = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    actor_user_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    occurred_at = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AGREEMENT_EVENT", x => x.event_id);
                    table.ForeignKey(
                        name: "FK_AGREEMENT_EVENT_AGREEMENT_agreement_id",
                        column: x => x.agreement_id,
                        principalTable: "AGREEMENT",
                        principalColumn: "agreement_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AGREEMENT_EVENT_APP_USER_actor_user_id",
                        column: x => x.actor_user_id,
                        principalTable: "APP_USER",
                        principalColumn: "user_id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "AGREEMENT_SERVICE",
                columns: table => new
                {
                    agreement_service_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    agreement_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    service = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AGREEMENT_SERVICE", x => x.agreement_service_id);
                    table.ForeignKey(
                        name: "FK_AGREEMENT_SERVICE_AGREEMENT_agreement_id",
                        column: x => x.agreement_id,
                        principalTable: "AGREEMENT",
                        principalColumn: "agreement_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SIGNING_SEQUENCE",
                columns: table => new
                {
                    sequence_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    agreement_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    status = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    current_step_index = table.Column<int>(type: "int", nullable: false),
                    is_complete = table.Column<bool>(type: "bit", nullable: false),
                    created_by = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SIGNING_SEQUENCE", x => x.sequence_id);
                    table.ForeignKey(
                        name: "FK_SIGNING_SEQUENCE_AGREEMENT_agreement_id",
                        column: x => x.agreement_id,
                        principalTable: "AGREEMENT",
                        principalColumn: "agreement_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SIGNATORY",
                columns: table => new
                {
                    signatory_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    sequence_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    user_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    order_index = table.Column<int>(type: "int", nullable: false),
                    obligation = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    is_signer = table.Column<bool>(type: "bit", nullable: false),
                    decision = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: true),
                    note = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    acted_at = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SIGNATORY", x => x.signatory_id);
                    table.ForeignKey(
                        name: "FK_SIGNATORY_APP_USER_user_id",
                        column: x => x.user_id,
                        principalTable: "APP_USER",
                        principalColumn: "user_id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_SIGNATORY_SIGNING_SEQUENCE_sequence_id",
                        column: x => x.sequence_id,
                        principalTable: "SIGNING_SEQUENCE",
                        principalColumn: "sequence_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "E_SIGNATURE",
                columns: table => new
                {
                    signature_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    signatory_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    signature_name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    ip_address = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    signed_at = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_E_SIGNATURE", x => x.signature_id);
                    table.ForeignKey(
                        name: "FK_E_SIGNATURE_SIGNATORY_signatory_id",
                        column: x => x.signatory_id,
                        principalTable: "SIGNATORY",
                        principalColumn: "signatory_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "AGREEMENT_TEMPLATE",
                columns: new[] { "template_id", "body_text", "field_map", "is_active", "name", "services", "updated_at", "updated_by", "version" },
                values: new object[] { new Guid("a9000000-0000-0000-0000-000000000001"), "⚠️ نص تجريبي — بانتظار النص القانوني المعتمد (DM-GAP-16). تُبرم هذه الاتفاقية بين الأكاديمية المالية والخبير المعتمد لتقديم الخدمات الموضحة في ملحق الخدمات، وفق الشروط والأحكام المعتمدة.", "[{\"id\":\"startDate\",\"label\":{\"ar\":\"تاريخ بداية الاتفاقية\",\"en\":\"Agreement start date\"},\"type\":\"date\",\"required\":true,\"help\":{\"ar\":\"محدَّد ومعتمد في الرحلة.\",\"en\":\"Confirmed by the journey.\"}},{\"id\":\"endDate\",\"label\":{\"ar\":\"تاريخ نهاية الاتفاقية\",\"en\":\"Agreement end date\"},\"type\":\"date\",\"required\":true,\"help\":{\"ar\":\"سنة للاعتماد الأول، وثلاث سنوات لكل تجديد (BR-0302).\",\"en\":\"One year on first accreditation, three years on each renewal (BR-0302).\"}},{\"id\":\"referenceNote\",\"label\":{\"ar\":\"ملاحظة مرجعية\",\"en\":\"Reference note\"},\"type\":\"text\",\"required\":false,\"help\":{\"ar\":\"حقل تجريبي — بانتظار مصفوفة الحقول المعتمدة (DM-GAP-16).\",\"en\":\"Placeholder field — pending the approved field matrix (DM-GAP-16).\"}}]", true, "الاتفاقية الموحدة", "[\"trainer\",\"consultant\",\"content-developer\",\"question-writer\"]", new DateTime(2026, 8, 31, 0, 0, 0, 0, DateTimeKind.Utc), null, "mock-dm-gap-16-draft.1" });

            migrationBuilder.CreateIndex(
                name: "IX_ADDENDUM_agreement_id",
                table: "ADDENDUM",
                column: "agreement_id");

            migrationBuilder.CreateIndex(
                name: "IX_ADDENDUM_service_request_id",
                table: "ADDENDUM",
                column: "service_request_id");

            migrationBuilder.CreateIndex(
                name: "IX_AGREEMENT_application_id",
                table: "AGREEMENT",
                column: "application_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AGREEMENT_reference",
                table: "AGREEMENT",
                column: "reference",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AGREEMENT_template_id",
                table: "AGREEMENT",
                column: "template_id");

            migrationBuilder.CreateIndex(
                name: "IX_AGREEMENT_trainer_user_id",
                table: "AGREEMENT",
                column: "trainer_user_id");

            migrationBuilder.CreateIndex(
                name: "IX_AGREEMENT_EVENT_actor_user_id",
                table: "AGREEMENT_EVENT",
                column: "actor_user_id");

            migrationBuilder.CreateIndex(
                name: "IX_AGREEMENT_EVENT_agreement_id_occurred_at",
                table: "AGREEMENT_EVENT",
                columns: new[] { "agreement_id", "occurred_at" });

            migrationBuilder.CreateIndex(
                name: "IX_AGREEMENT_SERVICE_agreement_id_service",
                table: "AGREEMENT_SERVICE",
                columns: new[] { "agreement_id", "service" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_E_SIGNATURE_signatory_id",
                table: "E_SIGNATURE",
                column: "signatory_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SIGNATORY_sequence_id_order_index",
                table: "SIGNATORY",
                columns: new[] { "sequence_id", "order_index" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SIGNATORY_user_id",
                table: "SIGNATORY",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_SIGNING_SEQUENCE_agreement_id",
                table: "SIGNING_SEQUENCE",
                column: "agreement_id",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ADDENDUM");

            migrationBuilder.DropTable(
                name: "AGREEMENT_EVENT");

            migrationBuilder.DropTable(
                name: "AGREEMENT_SERVICE");

            migrationBuilder.DropTable(
                name: "BANK_DATA");

            migrationBuilder.DropTable(
                name: "E_SIGNATURE");

            migrationBuilder.DropTable(
                name: "SIGNATORY");

            migrationBuilder.DropTable(
                name: "SIGNING_SEQUENCE");

            migrationBuilder.DropTable(
                name: "AGREEMENT");

            migrationBuilder.DropTable(
                name: "AGREEMENT_TEMPLATE");

            migrationBuilder.DropColumn(
                name: "kind",
                table: "COMMITTEE_TEMPLATE");
        }
    }
}
