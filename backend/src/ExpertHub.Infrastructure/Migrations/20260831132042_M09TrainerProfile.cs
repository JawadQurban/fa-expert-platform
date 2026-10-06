using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ExpertHub.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class M09TrainerProfile : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "TRAINER_PROFILE",
                columns: table => new
                {
                    trainer_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    user_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    application_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    fast_user_profile_id = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    file_status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    visibility_consent = table.Column<bool>(type: "bit", nullable: false),
                    photo_attachment_id = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TRAINER_PROFILE", x => x.trainer_id);
                    table.ForeignKey(
                        name: "FK_TRAINER_PROFILE_APPLICATION_application_id",
                        column: x => x.application_id,
                        principalTable: "APPLICATION",
                        principalColumn: "application_id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_TRAINER_PROFILE_APP_USER_user_id",
                        column: x => x.user_id,
                        principalTable: "APP_USER",
                        principalColumn: "user_id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "PROFILE_CHANGE_REQUEST",
                columns: table => new
                {
                    change_request_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    trainer_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    field_code = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: false),
                    proposed_value = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    requested_at = table.Column<DateTime>(type: "datetime2", nullable: false),
                    resolved_at = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PROFILE_CHANGE_REQUEST", x => x.change_request_id);
                    table.ForeignKey(
                        name: "FK_PROFILE_CHANGE_REQUEST_TRAINER_PROFILE_trainer_id",
                        column: x => x.trainer_id,
                        principalTable: "TRAINER_PROFILE",
                        principalColumn: "trainer_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "RATING_SOURCE_RECORD",
                columns: table => new
                {
                    record_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    trainer_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    mtm_record_id = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    raw_value = table.Column<decimal>(type: "decimal(5,2)", precision: 5, scale: 2, nullable: false),
                    scale_low = table.Column<int>(type: "int", nullable: false),
                    scale_high = table.Column<int>(type: "int", nullable: false),
                    response_count = table.Column<int>(type: "int", nullable: false),
                    source_date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    received_at = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RATING_SOURCE_RECORD", x => x.record_id);
                    table.ForeignKey(
                        name: "FK_RATING_SOURCE_RECORD_TRAINER_PROFILE_trainer_id",
                        column: x => x.trainer_id,
                        principalTable: "TRAINER_PROFILE",
                        principalColumn: "trainer_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TRAINER_FIELD_VALUE",
                columns: table => new
                {
                    value_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    trainer_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    field_code = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: false),
                    value = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TRAINER_FIELD_VALUE", x => x.value_id);
                    table.ForeignKey(
                        name: "FK_TRAINER_FIELD_VALUE_TRAINER_PROFILE_trainer_id",
                        column: x => x.trainer_id,
                        principalTable: "TRAINER_PROFILE",
                        principalColumn: "trainer_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TRAINER_RECORD",
                columns: table => new
                {
                    record_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    trainer_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    program_name_ar = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                    program_name_en = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                    role = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    delivered_from = table.Column<DateTime>(type: "datetime2", nullable: false),
                    delivered_to = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TRAINER_RECORD", x => x.record_id);
                    table.ForeignKey(
                        name: "FK_TRAINER_RECORD_TRAINER_PROFILE_trainer_id",
                        column: x => x.trainer_id,
                        principalTable: "TRAINER_PROFILE",
                        principalColumn: "trainer_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TRAINER_SERVICE",
                columns: table => new
                {
                    trainer_service_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    trainer_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    service = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    classification = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    accredited_at = table.Column<DateTime>(type: "datetime2", nullable: false),
                    status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TRAINER_SERVICE", x => x.trainer_service_id);
                    table.ForeignKey(
                        name: "FK_TRAINER_SERVICE_TRAINER_PROFILE_trainer_id",
                        column: x => x.trainer_id,
                        principalTable: "TRAINER_PROFILE",
                        principalColumn: "trainer_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TRAINER_RATING",
                columns: table => new
                {
                    rating_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    trainer_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    scope = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    record_id = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    calculated_value = table.Column<decimal>(type: "decimal(4,2)", precision: 4, scale: 2, nullable: false),
                    calculation_version = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    calculated_at = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TRAINER_RATING", x => x.rating_id);
                    table.ForeignKey(
                        name: "FK_TRAINER_RATING_TRAINER_PROFILE_trainer_id",
                        column: x => x.trainer_id,
                        principalTable: "TRAINER_PROFILE",
                        principalColumn: "trainer_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_TRAINER_RATING_TRAINER_RECORD_record_id",
                        column: x => x.record_id,
                        principalTable: "TRAINER_RECORD",
                        principalColumn: "record_id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PROFILE_CHANGE_REQUEST_trainer_id_field_code_status",
                table: "PROFILE_CHANGE_REQUEST",
                columns: new[] { "trainer_id", "field_code", "status" });

            migrationBuilder.CreateIndex(
                name: "IX_RATING_SOURCE_RECORD_trainer_id_mtm_record_id",
                table: "RATING_SOURCE_RECORD",
                columns: new[] { "trainer_id", "mtm_record_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TRAINER_FIELD_VALUE_trainer_id_field_code",
                table: "TRAINER_FIELD_VALUE",
                columns: new[] { "trainer_id", "field_code" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TRAINER_PROFILE_application_id",
                table: "TRAINER_PROFILE",
                column: "application_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TRAINER_PROFILE_user_id",
                table: "TRAINER_PROFILE",
                column: "user_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TRAINER_RATING_record_id",
                table: "TRAINER_RATING",
                column: "record_id");

            migrationBuilder.CreateIndex(
                name: "IX_TRAINER_RATING_trainer_id_scope",
                table: "TRAINER_RATING",
                columns: new[] { "trainer_id", "scope" });

            migrationBuilder.CreateIndex(
                name: "IX_TRAINER_RECORD_trainer_id",
                table: "TRAINER_RECORD",
                column: "trainer_id");

            migrationBuilder.CreateIndex(
                name: "IX_TRAINER_SERVICE_trainer_id_service",
                table: "TRAINER_SERVICE",
                columns: new[] { "trainer_id", "service" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PROFILE_CHANGE_REQUEST");

            migrationBuilder.DropTable(
                name: "RATING_SOURCE_RECORD");

            migrationBuilder.DropTable(
                name: "TRAINER_FIELD_VALUE");

            migrationBuilder.DropTable(
                name: "TRAINER_RATING");

            migrationBuilder.DropTable(
                name: "TRAINER_SERVICE");

            migrationBuilder.DropTable(
                name: "TRAINER_RECORD");

            migrationBuilder.DropTable(
                name: "TRAINER_PROFILE");
        }
    }
}
