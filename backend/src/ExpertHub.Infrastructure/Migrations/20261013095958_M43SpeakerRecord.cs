using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace ExpertHub.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class M43SpeakerRecord : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "ROLE_PERMISSION",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { 4, 1 });

            migrationBuilder.CreateTable(
                name: "SPEAKER_RECORD",
                columns: table => new
                {
                    speaker_record_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    title = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    first_name_ar = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    middle_name_ar = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    third_name_ar = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    last_name_ar = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    first_name_en = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    middle_name_en = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    third_name_en = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    last_name_en = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    bio = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    photo_attachment_id = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    fast_user_id = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    created_by = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false),
                    updated_by = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    updated_at = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SPEAKER_RECORD", x => x.speaker_record_id);
                    table.ForeignKey(
                        name: "FK_SPEAKER_RECORD_APP_USER_created_by",
                        column: x => x.created_by,
                        principalTable: "APP_USER",
                        principalColumn: "user_id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_SPEAKER_RECORD_APP_USER_updated_by",
                        column: x => x.updated_by,
                        principalTable: "APP_USER",
                        principalColumn: "user_id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_SPEAKER_RECORD_ATTACHMENT_photo_attachment_id",
                        column: x => x.photo_attachment_id,
                        principalTable: "ATTACHMENT",
                        principalColumn: "attachment_id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.UpdateData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 4,
                columns: new[] { "label_needs_verification", "name_ar", "name_en" },
                values: new object[] { false, "إدخال بيانات متحدث", "Enter speaker details" });

            migrationBuilder.UpdateData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 28,
                columns: new[] { "label_needs_verification", "name_ar", "name_en" },
                values: new object[] { false, "إدارة سجل المتحدث", "Manage a speaker record" });

            // The access matrix is edited at runtime (CAP-08), so a server may
            // already hold one of these grants — on FA-QIYAS, role 2 had F-0105
            // and a plain InsertData failed the whole migration. Insert only
            // what is missing; an existing grant keeps its scope.
            migrationBuilder.Sql(
                """
                INSERT INTO [ROLE_PERMISSION] ([permission_id], [role_id], [data_scope])
                SELECT g.[permission_id], g.[role_id], g.[data_scope]
                FROM (VALUES (4, 2, N'all'), (4, 3, N'all')) AS g ([permission_id], [role_id], [data_scope])
                WHERE NOT EXISTS (
                    SELECT 1 FROM [ROLE_PERMISSION] rp
                    WHERE rp.[permission_id] = g.[permission_id] AND rp.[role_id] = g.[role_id]);
                """);

            migrationBuilder.CreateIndex(
                name: "IX_SPEAKER_RECORD_created_at",
                table: "SPEAKER_RECORD",
                column: "created_at");

            migrationBuilder.CreateIndex(
                name: "IX_SPEAKER_RECORD_created_by",
                table: "SPEAKER_RECORD",
                column: "created_by");

            migrationBuilder.CreateIndex(
                name: "IX_SPEAKER_RECORD_photo_attachment_id",
                table: "SPEAKER_RECORD",
                column: "photo_attachment_id");

            migrationBuilder.CreateIndex(
                name: "IX_SPEAKER_RECORD_updated_by",
                table: "SPEAKER_RECORD",
                column: "updated_by");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SPEAKER_RECORD");

            migrationBuilder.DeleteData(
                table: "ROLE_PERMISSION",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { 4, 2 });

            migrationBuilder.DeleteData(
                table: "ROLE_PERMISSION",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { 4, 3 });

            migrationBuilder.UpdateData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 4,
                columns: new[] { "label_needs_verification", "name_ar", "name_en" },
                values: new object[] { true, "إدخال بيانات متقدّم نيابةً عنه", "Enter applicant details on their behalf" });

            migrationBuilder.UpdateData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 28,
                columns: new[] { "label_needs_verification", "name_ar", "name_en" },
                values: new object[] { true, "إدارة سجل المدرب لدى الأكاديمية", "Manage the trainer’s Academy record" });

            migrationBuilder.InsertData(
                table: "ROLE_PERMISSION",
                columns: new[] { "permission_id", "role_id", "data_scope" },
                values: new object[] { 4, 1, "own" });
        }
    }
}
