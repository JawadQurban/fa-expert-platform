using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ExpertHub.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class M44SubmissionRoundFile : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "attachment_id",
                table: "SUBMISSION_ROUND",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_SUBMISSION_ROUND_attachment_id",
                table: "SUBMISSION_ROUND",
                column: "attachment_id");

            migrationBuilder.AddForeignKey(
                name: "FK_SUBMISSION_ROUND_ATTACHMENT_attachment_id",
                table: "SUBMISSION_ROUND",
                column: "attachment_id",
                principalTable: "ATTACHMENT",
                principalColumn: "attachment_id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_SUBMISSION_ROUND_ATTACHMENT_attachment_id",
                table: "SUBMISSION_ROUND");

            migrationBuilder.DropIndex(
                name: "IX_SUBMISSION_ROUND_attachment_id",
                table: "SUBMISSION_ROUND");

            migrationBuilder.DropColumn(
                name: "attachment_id",
                table: "SUBMISSION_ROUND");
        }
    }
}
