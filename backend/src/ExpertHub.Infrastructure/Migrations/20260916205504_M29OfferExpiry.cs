using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ExpertHub.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class M29OfferExpiry : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "expired_at",
                table: "ASSIGNMENT_OFFER",
                type: "datetime2",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_ASSIGNMENT_OFFER_status_response_due_at",
                table: "ASSIGNMENT_OFFER",
                columns: new[] { "status", "response_due_at" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_ASSIGNMENT_OFFER_status_response_due_at",
                table: "ASSIGNMENT_OFFER");

            migrationBuilder.DropColumn(
                name: "expired_at",
                table: "ASSIGNMENT_OFFER");
        }
    }
}
