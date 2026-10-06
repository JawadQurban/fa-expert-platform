using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace ExpertHub.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class M31AssignmentCentres : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "REFERENCE_LIST",
                columns: new[] { "list_code", "is_editable", "name_ar", "name_en" },
                values: new object[] { "assignment-centre", false, "مراكز طلبات الإسناد", "Assignment request centres" });

            migrationBuilder.InsertData(
                table: "REFERENCE_VALUE",
                columns: new[] { "value_id", "attributes", "code", "is_active", "label_ar", "label_en", "list_code", "sort_order", "source", "synced_at" },
                values: new object[,]
                {
                    { new Guid("ac000000-0000-0000-0000-000000000001"), null, "banking-finance", true, "البنوك والتمويل", "البنوك والتمويل", "assignment-centre", 1, null, null },
                    { new Guid("ac000000-0000-0000-0000-000000000002"), null, "securities", true, "الأوراق المالية", "الأوراق المالية", "assignment-centre", 2, null, null },
                    { new Guid("ac000000-0000-0000-0000-000000000003"), null, "insurance", true, "التامين", "التامين", "assignment-centre", 3, null, null },
                    { new Guid("ac000000-0000-0000-0000-000000000004"), null, "special-programs", true, "البرامج الخاصة", "البرامج الخاصة", "assignment-centre", 4, null, null },
                    { new Guid("ac000000-0000-0000-0000-000000000005"), null, "leadership", true, "القيادات", "القيادات", "assignment-centre", 5, null, null }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "REFERENCE_VALUE",
                keyColumn: "value_id",
                keyValue: new Guid("ac000000-0000-0000-0000-000000000001"));

            migrationBuilder.DeleteData(
                table: "REFERENCE_VALUE",
                keyColumn: "value_id",
                keyValue: new Guid("ac000000-0000-0000-0000-000000000002"));

            migrationBuilder.DeleteData(
                table: "REFERENCE_VALUE",
                keyColumn: "value_id",
                keyValue: new Guid("ac000000-0000-0000-0000-000000000003"));

            migrationBuilder.DeleteData(
                table: "REFERENCE_VALUE",
                keyColumn: "value_id",
                keyValue: new Guid("ac000000-0000-0000-0000-000000000004"));

            migrationBuilder.DeleteData(
                table: "REFERENCE_VALUE",
                keyColumn: "value_id",
                keyValue: new Guid("ac000000-0000-0000-0000-000000000005"));

            migrationBuilder.DeleteData(
                table: "REFERENCE_LIST",
                keyColumn: "list_code",
                keyValue: "assignment-centre");
        }
    }
}
