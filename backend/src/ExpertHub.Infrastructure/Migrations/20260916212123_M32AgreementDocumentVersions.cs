using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ExpertHub.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class M32AgreementDocumentVersions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_SIGNING_SEQUENCE_agreement_id",
                table: "SIGNING_SEQUENCE");

            migrationBuilder.AddColumn<DateTime>(
                name: "voided_at",
                table: "SIGNING_SEQUENCE",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "document_version_id",
                table: "SIGNATORY",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "method",
                table: "E_SIGNATURE",
                type: "nvarchar(30)",
                maxLength: 30,
                nullable: false,
                defaultValue: "internal-acceptance");

            migrationBuilder.AddColumn<Guid>(
                name: "applicant_document_version_id",
                table: "AGREEMENT",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "applicant_signature_method",
                table: "AGREEMENT",
                type: "nvarchar(30)",
                maxLength: 30,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "AGREEMENT_DOCUMENT_VERSION",
                columns: table => new
                {
                    document_version_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    agreement_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    version_number = table.Column<int>(type: "int", nullable: false),
                    template_id = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    template_name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    template_version = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    body_text = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    fields = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    merged_data = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    content_hash = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    created_by = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AGREEMENT_DOCUMENT_VERSION", x => x.document_version_id);
                    table.ForeignKey(
                        name: "FK_AGREEMENT_DOCUMENT_VERSION_AGREEMENT_agreement_id",
                        column: x => x.agreement_id,
                        principalTable: "AGREEMENT",
                        principalColumn: "agreement_id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "AGREEMENT_TEMPLATE_VERSION",
                columns: table => new
                {
                    template_version_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    template_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    version = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    body_text = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    field_map = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    recorded_at = table.Column<DateTime>(type: "datetime2", nullable: false),
                    recorded_by = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AGREEMENT_TEMPLATE_VERSION", x => x.template_version_id);
                    table.ForeignKey(
                        name: "FK_AGREEMENT_TEMPLATE_VERSION_AGREEMENT_TEMPLATE_template_id",
                        column: x => x.template_id,
                        principalTable: "AGREEMENT_TEMPLATE",
                        principalColumn: "template_id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_SIGNING_SEQUENCE_agreement_id",
                table: "SIGNING_SEQUENCE",
                column: "agreement_id");

            migrationBuilder.CreateIndex(
                name: "IX_AGREEMENT_DOCUMENT_VERSION_agreement_id_version_number",
                table: "AGREEMENT_DOCUMENT_VERSION",
                columns: new[] { "agreement_id", "version_number" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AGREEMENT_TEMPLATE_VERSION_template_id_recorded_at",
                table: "AGREEMENT_TEMPLATE_VERSION",
                columns: new[] { "template_id", "recorded_at" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AGREEMENT_DOCUMENT_VERSION");

            migrationBuilder.DropTable(
                name: "AGREEMENT_TEMPLATE_VERSION");

            migrationBuilder.DropIndex(
                name: "IX_SIGNING_SEQUENCE_agreement_id",
                table: "SIGNING_SEQUENCE");

            migrationBuilder.DropColumn(
                name: "voided_at",
                table: "SIGNING_SEQUENCE");

            migrationBuilder.DropColumn(
                name: "document_version_id",
                table: "SIGNATORY");

            migrationBuilder.DropColumn(
                name: "method",
                table: "E_SIGNATURE");

            migrationBuilder.DropColumn(
                name: "applicant_document_version_id",
                table: "AGREEMENT");

            migrationBuilder.DropColumn(
                name: "applicant_signature_method",
                table: "AGREEMENT");

            migrationBuilder.CreateIndex(
                name: "IX_SIGNING_SEQUENCE_agreement_id",
                table: "SIGNING_SEQUENCE",
                column: "agreement_id",
                unique: true);
        }
    }
}
