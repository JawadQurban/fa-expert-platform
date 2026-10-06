using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ExpertHub.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class M23FastContracts : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "contracts",
                table: "FAST_USER_PROFILE",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "contracts_synced_at",
                table: "FAST_USER_PROFILE",
                type: "datetime2",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "contracts",
                table: "FAST_USER_PROFILE");

            migrationBuilder.DropColumn(
                name: "contracts_synced_at",
                table: "FAST_USER_PROFILE");
        }
    }
}
