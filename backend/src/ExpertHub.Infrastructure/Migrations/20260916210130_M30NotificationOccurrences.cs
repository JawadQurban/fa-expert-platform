using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ExpertHub.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class M30NotificationOccurrences : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_NOTIFICATION_LOG_recipient_user_id",
                table: "NOTIFICATION_LOG");

            migrationBuilder.AddColumn<string>(
                name: "body",
                table: "NOTIFICATION_LOG",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "occurrence_id",
                table: "NOTIFICATION_LOG",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "subject",
                table: "NOTIFICATION_LOG",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "NOTIFICATION_OCCURRENCE",
                columns: table => new
                {
                    occurrence_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    event_code = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    source_entity_id = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    record_subject_user_id = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    acting_staff_user_id = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    placeholders = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    routing_status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    recipient_count = table.Column<int>(type: "int", nullable: false),
                    dedupe_key = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    raised_at = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NOTIFICATION_OCCURRENCE", x => x.occurrence_id);
                    table.ForeignKey(
                        name: "FK_NOTIFICATION_OCCURRENCE_NOTIFICATION_EVENT_event_code",
                        column: x => x.event_code,
                        principalTable: "NOTIFICATION_EVENT",
                        principalColumn: "event_code",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_NOTIFICATION_LOG_recipient_user_id_channel_sent_at",
                table: "NOTIFICATION_LOG",
                columns: new[] { "recipient_user_id", "channel", "sent_at" });

            migrationBuilder.CreateIndex(
                name: "IX_NOTIFICATION_OCCURRENCE_dedupe_key",
                table: "NOTIFICATION_OCCURRENCE",
                column: "dedupe_key",
                unique: true,
                filter: "[dedupe_key] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_NOTIFICATION_OCCURRENCE_event_code_source_entity_id",
                table: "NOTIFICATION_OCCURRENCE",
                columns: new[] { "event_code", "source_entity_id" });

            migrationBuilder.CreateIndex(
                name: "IX_NOTIFICATION_OCCURRENCE_raised_at",
                table: "NOTIFICATION_OCCURRENCE",
                column: "raised_at");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "NOTIFICATION_OCCURRENCE");

            migrationBuilder.DropIndex(
                name: "IX_NOTIFICATION_LOG_recipient_user_id_channel_sent_at",
                table: "NOTIFICATION_LOG");

            migrationBuilder.DropColumn(
                name: "body",
                table: "NOTIFICATION_LOG");

            migrationBuilder.DropColumn(
                name: "occurrence_id",
                table: "NOTIFICATION_LOG");

            migrationBuilder.DropColumn(
                name: "subject",
                table: "NOTIFICATION_LOG");

            migrationBuilder.CreateIndex(
                name: "IX_NOTIFICATION_LOG_recipient_user_id",
                table: "NOTIFICATION_LOG",
                column: "recipient_user_id");
        }
    }
}
