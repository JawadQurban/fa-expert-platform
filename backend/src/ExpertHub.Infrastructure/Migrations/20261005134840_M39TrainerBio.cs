using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ExpertHub.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class M39TrainerBio : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "TRAINER_BIO",
                columns: table => new
                {
                    trainer_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    draft = table.Column<string>(type: "nvarchar(600)", maxLength: 600, nullable: true),
                    draft_source = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: true),
                    revision = table.Column<int>(type: "int", nullable: false),
                    review_note = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    submitted_at = table.Column<DateTime>(type: "datetime2", nullable: true),
                    published = table.Column<string>(type: "nvarchar(600)", maxLength: 600, nullable: true),
                    published_at = table.Column<DateTime>(type: "datetime2", nullable: true),
                    reviewed_by = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    reviewed_at = table.Column<DateTime>(type: "datetime2", nullable: true),
                    updated_at = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TRAINER_BIO", x => x.trainer_id);
                    table.ForeignKey(
                        name: "FK_TRAINER_BIO_APP_USER_reviewed_by",
                        column: x => x.reviewed_by,
                        principalTable: "APP_USER",
                        principalColumn: "user_id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_TRAINER_BIO_TRAINER_PROFILE_trainer_id",
                        column: x => x.trainer_id,
                        principalTable: "TRAINER_PROFILE",
                        principalColumn: "trainer_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "DATA_ELEMENT",
                columns: new[] { "element_id", "direction", "element_name", "entity_name", "owning_system", "system_code" },
                values: new object[] { new Guid("de000000-0000-0000-0000-000000000012"), "outbound", "trainer_bio_draft", "TRAINER_BIO", "expert_hub", "INT-06" });

            migrationBuilder.CreateIndex(
                name: "IX_TRAINER_BIO_reviewed_by",
                table: "TRAINER_BIO",
                column: "reviewed_by");

            migrationBuilder.CreateIndex(
                name: "IX_TRAINER_BIO_status",
                table: "TRAINER_BIO",
                column: "status");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TRAINER_BIO");

            migrationBuilder.DeleteData(
                table: "DATA_ELEMENT",
                keyColumn: "element_id",
                keyValue: new Guid("de000000-0000-0000-0000-000000000012"));
        }
    }
}
