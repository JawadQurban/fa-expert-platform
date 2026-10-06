using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ExpertHub.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class M40AgreementDocumentFile : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "attachment_id",
                table: "AGREEMENT_DOCUMENT_VERSION",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "document_attachment_id",
                table: "AGREEMENT",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_AGREEMENT_DOCUMENT_VERSION_attachment_id",
                table: "AGREEMENT_DOCUMENT_VERSION",
                column: "attachment_id");

            migrationBuilder.AddForeignKey(
                name: "FK_AGREEMENT_DOCUMENT_VERSION_ATTACHMENT_attachment_id",
                table: "AGREEMENT_DOCUMENT_VERSION",
                column: "attachment_id",
                principalTable: "ATTACHMENT",
                principalColumn: "attachment_id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AGREEMENT_DOCUMENT_VERSION_ATTACHMENT_attachment_id",
                table: "AGREEMENT_DOCUMENT_VERSION");

            migrationBuilder.DropIndex(
                name: "IX_AGREEMENT_DOCUMENT_VERSION_attachment_id",
                table: "AGREEMENT_DOCUMENT_VERSION");

            migrationBuilder.DropColumn(
                name: "attachment_id",
                table: "AGREEMENT_DOCUMENT_VERSION");

            migrationBuilder.DropColumn(
                name: "document_attachment_id",
                table: "AGREEMENT");
        }
    }
}
