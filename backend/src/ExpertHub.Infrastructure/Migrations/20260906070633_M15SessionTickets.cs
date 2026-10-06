using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ExpertHub.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class M15SessionTickets : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "SESSION_TICKET",
                columns: table => new
                {
                    session_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    payload = table.Column<byte[]>(type: "varbinary(max)", nullable: false),
                    subject = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    expires_at = table.Column<DateTime>(type: "datetime2", nullable: true),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SESSION_TICKET", x => x.session_id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_SESSION_TICKET_expires_at",
                table: "SESSION_TICKET",
                column: "expires_at");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SESSION_TICKET");
        }
    }
}
