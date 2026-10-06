using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ExpertHub.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class M33StoredDocumentReferences : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "addendum_attachment_id",
                table: "SERVICE_REQUEST",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "attachment_id",
                table: "ADDENDUM",
                type: "uniqueidentifier",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "addendum_attachment_id",
                table: "SERVICE_REQUEST");

            migrationBuilder.DropColumn(
                name: "attachment_id",
                table: "ADDENDUM");
        }
    }
}
