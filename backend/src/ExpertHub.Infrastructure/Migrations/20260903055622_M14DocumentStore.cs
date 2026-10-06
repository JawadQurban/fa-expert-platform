using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ExpertHub.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class M14DocumentStore : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "DOCUMENT_BLOB",
                columns: table => new
                {
                    blob_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    content = table.Column<byte[]>(type: "varbinary(max)", nullable: false),
                    mime_type = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: false),
                    file_name = table.Column<string>(type: "nvarchar(260)", maxLength: 260, nullable: false),
                    stored_at = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DOCUMENT_BLOB", x => x.blob_id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DOCUMENT_BLOB");
        }
    }
}
