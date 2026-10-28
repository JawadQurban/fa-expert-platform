using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ExpertHub.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class M56InterviewPerServiceDecision : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "INTERVIEW_SERVICE",
                columns: table => new
                {
                    interview_service_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    interview_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    service = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    decision = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    decision_reason_id = table.Column<string>(type: "nvarchar(60)", maxLength: 60, nullable: true),
                    decision_reason_text = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    decided_by = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    decided_at = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_INTERVIEW_SERVICE", x => x.interview_service_id);
                    table.ForeignKey(
                        name: "FK_INTERVIEW_SERVICE_APP_USER_decided_by",
                        column: x => x.decided_by,
                        principalTable: "APP_USER",
                        principalColumn: "user_id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_INTERVIEW_SERVICE_INTERVIEW_interview_id",
                        column: x => x.interview_id,
                        principalTable: "INTERVIEW",
                        principalColumn: "interview_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_INTERVIEW_SERVICE_decided_by",
                table: "INTERVIEW_SERVICE",
                column: "decided_by");

            migrationBuilder.CreateIndex(
                name: "IX_INTERVIEW_SERVICE_interview_id_service",
                table: "INTERVIEW_SERVICE",
                columns: new[] { "interview_id", "service" },
                unique: true);

            /*
             * P-384 — backfill. `IX_INTERVIEW_application_id` has been UNIQUE
             * since M06, so no application holds more than one interview and
             * there is nothing to merge: every evaluation and score already
             * hangs off the application's single interview. What did not exist
             * is the per-service row, so each interview gets one row per service
             * its screening sent to the interview (`decision = 'accept'`;
             * exempted services stay out, J-08), carrying the decision the
             * interview already recorded:
             *
             * - interview rejected → every covered service rejected, with the
             *   interview's reason;
             * - interview forwarded → forwarded, EXCEPT a service that was closed
             *   as rejected at or before that decision (the superseded P-271
             *   pass-mark closure, which wrote no reason) → rejected;
             * - interview undecided → undecided.
             */
            migrationBuilder.Sql(
                """
                INSERT INTO [INTERVIEW_SERVICE]
                    ([interview_service_id], [interview_id], [service], [decision],
                     [decision_reason_id], [decision_reason_text], [decided_by], [decided_at])
                SELECT NEWID(), i.[interview_id], s.[service],
                       CASE
                           WHEN i.[decision] IS NULL THEN NULL
                           WHEN i.[decision] = N'reject' THEN N'reject'
                           WHEN s.[outcome] = N'rejected' AND s.[decided_at] IS NOT NULL
                                AND i.[decided_at] IS NOT NULL AND s.[decided_at] <= i.[decided_at]
                               THEN N'reject'
                           ELSE N'forward'
                       END,
                       CASE WHEN i.[decision] = N'reject' THEN i.[decision_reason_id] END,
                       CASE WHEN i.[decision] = N'reject' THEN i.[decision_reason_text] END,
                       i.[decided_by], i.[decided_at]
                FROM [INTERVIEW] i
                JOIN [APPLICATION_SERVICE] s ON s.[application_id] = i.[application_id]
                JOIN [SCREENING_RESULT] r ON r.[application_service_id] = s.[application_service_id]
                WHERE r.[decision] = N'accept';
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "INTERVIEW_SERVICE");
        }
    }
}
