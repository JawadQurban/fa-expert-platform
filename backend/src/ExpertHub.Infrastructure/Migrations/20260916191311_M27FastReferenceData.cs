using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ExpertHub.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class M27FastReferenceData : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "attributes",
                table: "REFERENCE_VALUE",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "source",
                table: "REFERENCE_VALUE",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "synced_at",
                table: "REFERENCE_VALUE",
                type: "datetime2",
                nullable: true);

            migrationBuilder.InsertData(
                table: "REFERENCE_LIST",
                columns: new[] { "list_code", "is_editable", "name_ar", "name_en" },
                values: new object[] { "fast-country", false, "الدول والجنسيات (FAST)", "Countries and nationalities (FAST)" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "REFERENCE_LIST",
                keyColumn: "list_code",
                keyValue: "fast-country");

            migrationBuilder.DropColumn(
                name: "attributes",
                table: "REFERENCE_VALUE");

            migrationBuilder.DropColumn(
                name: "source",
                table: "REFERENCE_VALUE");

            migrationBuilder.DropColumn(
                name: "synced_at",
                table: "REFERENCE_VALUE");
        }
    }
}
