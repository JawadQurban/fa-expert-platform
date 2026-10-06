using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ExpertHub.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class M37LiveRowUniqueness : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "UX_SIGNING_SEQUENCE_agreement_live",
                table: "SIGNING_SEQUENCE",
                column: "agreement_id",
                unique: true,
                filter: "[voided_at] IS NULL");

            migrationBuilder.CreateIndex(
                name: "UX_ENGAGEMENT_slot_id_live",
                table: "ENGAGEMENT",
                column: "slot_id",
                unique: true,
                filter: "[status] <> 'withdrawn' AND [status] <> 'cancelled'");

            migrationBuilder.CreateIndex(
                name: "UX_ASSIGNMENT_OFFER_slot_id_live",
                table: "ASSIGNMENT_OFFER",
                column: "slot_id",
                unique: true,
                filter: "[status] = 'awaiting_response'");

            migrationBuilder.CreateIndex(
                name: "UX_APPLICATION_applicant_draft",
                table: "APPLICATION",
                column: "applicant_user_id",
                unique: true,
                filter: "[status] = 'draft'");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "UX_SIGNING_SEQUENCE_agreement_live",
                table: "SIGNING_SEQUENCE");

            migrationBuilder.DropIndex(
                name: "UX_ENGAGEMENT_slot_id_live",
                table: "ENGAGEMENT");

            migrationBuilder.DropIndex(
                name: "UX_ASSIGNMENT_OFFER_slot_id_live",
                table: "ASSIGNMENT_OFFER");

            migrationBuilder.DropIndex(
                name: "UX_APPLICATION_applicant_draft",
                table: "APPLICATION");
        }
    }
}
