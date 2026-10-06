using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace ExpertHub.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class M08DefaultAccessMatrix : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "ROLE_PERMISSION",
                columns: new[] { "permission_id", "role_id", "data_scope" },
                values: new object[,]
                {
                    { 1, 1, "own" },
                    { 3, 1, "own" },
                    { 4, 1, "own" },
                    { 10, 1, "own" },
                    { 18, 1, "own" },
                    { 20, 1, "own" },
                    { 21, 1, "own" },
                    { 33, 1, "own" },
                    { 34, 1, "own" },
                    { 35, 1, "own" },
                    { 36, 1, "own" },
                    { 37, 1, "own" },
                    { 48, 1, "own" },
                    { 54, 1, "own" },
                    { 55, 1, "own" },
                    { 56, 1, "own" },
                    { 57, 1, "own" },
                    { 58, 1, "own" },
                    { 2, 2, "all" },
                    { 5, 2, "all" },
                    { 6, 2, "all" },
                    { 7, 2, "all" },
                    { 9, 2, "all" },
                    { 11, 2, "all" },
                    { 12, 2, "all" },
                    { 15, 2, "all" },
                    { 16, 2, "all" },
                    { 17, 2, "all" },
                    { 19, 2, "all" },
                    { 20, 2, "all" },
                    { 21, 2, "all" },
                    { 22, 2, "all" },
                    { 23, 2, "all" },
                    { 24, 2, "all" },
                    { 25, 2, "all" },
                    { 26, 2, "all" },
                    { 28, 2, "all" },
                    { 30, 2, "all" },
                    { 31, 2, "all" },
                    { 33, 2, "all" },
                    { 34, 2, "all" },
                    { 35, 2, "all" },
                    { 36, 2, "all" },
                    { 38, 2, "all" },
                    { 39, 2, "all" },
                    { 44, 2, "all" },
                    { 48, 2, "all" },
                    { 49, 2, "all" },
                    { 54, 2, "all" },
                    { 55, 2, "all" },
                    { 56, 2, "all" },
                    { 58, 2, "all" },
                    { 2, 3, "all" },
                    { 5, 3, "all" },
                    { 6, 3, "all" },
                    { 7, 3, "all" },
                    { 8, 3, "all" },
                    { 9, 3, "all" },
                    { 11, 3, "all" },
                    { 12, 3, "all" },
                    { 13, 3, "all" },
                    { 14, 3, "all" },
                    { 15, 3, "all" },
                    { 16, 3, "all" },
                    { 17, 3, "all" },
                    { 19, 3, "all" },
                    { 20, 3, "all" },
                    { 21, 3, "all" },
                    { 22, 3, "all" },
                    { 23, 3, "all" },
                    { 24, 3, "all" },
                    { 25, 3, "all" },
                    { 26, 3, "all" },
                    { 28, 3, "all" },
                    { 30, 3, "all" },
                    { 31, 3, "all" },
                    { 32, 3, "all" },
                    { 33, 3, "all" },
                    { 34, 3, "all" },
                    { 35, 3, "all" },
                    { 36, 3, "all" },
                    { 38, 3, "all" },
                    { 39, 3, "all" },
                    { 44, 3, "all" },
                    { 47, 3, "all" },
                    { 48, 3, "all" },
                    { 49, 3, "all" },
                    { 50, 3, "all" },
                    { 53, 3, "all" },
                    { 54, 3, "all" },
                    { 55, 3, "all" },
                    { 56, 3, "all" },
                    { 58, 3, "all" },
                    { 29, 4, "centre" },
                    { 32, 4, "centre" },
                    { 35, 4, "centre" },
                    { 48, 4, "centre" },
                    { 51, 4, "centre" },
                    { 55, 4, "centre" },
                    { 56, 4, "centre" },
                    { 28, 5, "all" },
                    { 41, 5, "all" },
                    { 42, 5, "all" },
                    { 43, 5, "all" },
                    { 44, 5, "all" },
                    { 45, 5, "all" },
                    { 46, 5, "all" },
                    { 47, 5, "all" },
                    { 48, 5, "all" },
                    { 55, 5, "all" },
                    { 56, 5, "all" },
                    { 47, 6, "all" },
                    { 48, 6, "all" },
                    { 52, 6, "all" },
                    { 53, 6, "all" },
                    { 55, 6, "all" },
                    { 56, 6, "all" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "ROLE_PERMISSION",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { 1, 1 });

            migrationBuilder.DeleteData(
                table: "ROLE_PERMISSION",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { 3, 1 });

            migrationBuilder.DeleteData(
                table: "ROLE_PERMISSION",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { 4, 1 });

            migrationBuilder.DeleteData(
                table: "ROLE_PERMISSION",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { 10, 1 });

            migrationBuilder.DeleteData(
                table: "ROLE_PERMISSION",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { 18, 1 });

            migrationBuilder.DeleteData(
                table: "ROLE_PERMISSION",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { 20, 1 });

            migrationBuilder.DeleteData(
                table: "ROLE_PERMISSION",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { 21, 1 });

            migrationBuilder.DeleteData(
                table: "ROLE_PERMISSION",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { 33, 1 });

            migrationBuilder.DeleteData(
                table: "ROLE_PERMISSION",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { 34, 1 });

            migrationBuilder.DeleteData(
                table: "ROLE_PERMISSION",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { 35, 1 });

            migrationBuilder.DeleteData(
                table: "ROLE_PERMISSION",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { 36, 1 });

            migrationBuilder.DeleteData(
                table: "ROLE_PERMISSION",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { 37, 1 });

            migrationBuilder.DeleteData(
                table: "ROLE_PERMISSION",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { 48, 1 });

            migrationBuilder.DeleteData(
                table: "ROLE_PERMISSION",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { 54, 1 });

            migrationBuilder.DeleteData(
                table: "ROLE_PERMISSION",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { 55, 1 });

            migrationBuilder.DeleteData(
                table: "ROLE_PERMISSION",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { 56, 1 });

            migrationBuilder.DeleteData(
                table: "ROLE_PERMISSION",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { 57, 1 });

            migrationBuilder.DeleteData(
                table: "ROLE_PERMISSION",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { 58, 1 });

            migrationBuilder.DeleteData(
                table: "ROLE_PERMISSION",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { 2, 2 });

            migrationBuilder.DeleteData(
                table: "ROLE_PERMISSION",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { 5, 2 });

            migrationBuilder.DeleteData(
                table: "ROLE_PERMISSION",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { 6, 2 });

            migrationBuilder.DeleteData(
                table: "ROLE_PERMISSION",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { 7, 2 });

            migrationBuilder.DeleteData(
                table: "ROLE_PERMISSION",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { 9, 2 });

            migrationBuilder.DeleteData(
                table: "ROLE_PERMISSION",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { 11, 2 });

            migrationBuilder.DeleteData(
                table: "ROLE_PERMISSION",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { 12, 2 });

            migrationBuilder.DeleteData(
                table: "ROLE_PERMISSION",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { 15, 2 });

            migrationBuilder.DeleteData(
                table: "ROLE_PERMISSION",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { 16, 2 });

            migrationBuilder.DeleteData(
                table: "ROLE_PERMISSION",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { 17, 2 });

            migrationBuilder.DeleteData(
                table: "ROLE_PERMISSION",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { 19, 2 });

            migrationBuilder.DeleteData(
                table: "ROLE_PERMISSION",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { 20, 2 });

            migrationBuilder.DeleteData(
                table: "ROLE_PERMISSION",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { 21, 2 });

            migrationBuilder.DeleteData(
                table: "ROLE_PERMISSION",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { 22, 2 });

            migrationBuilder.DeleteData(
                table: "ROLE_PERMISSION",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { 23, 2 });

            migrationBuilder.DeleteData(
                table: "ROLE_PERMISSION",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { 24, 2 });

            migrationBuilder.DeleteData(
                table: "ROLE_PERMISSION",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { 25, 2 });

            migrationBuilder.DeleteData(
                table: "ROLE_PERMISSION",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { 26, 2 });

            migrationBuilder.DeleteData(
                table: "ROLE_PERMISSION",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { 28, 2 });

            migrationBuilder.DeleteData(
                table: "ROLE_PERMISSION",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { 30, 2 });

            migrationBuilder.DeleteData(
                table: "ROLE_PERMISSION",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { 31, 2 });

            migrationBuilder.DeleteData(
                table: "ROLE_PERMISSION",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { 33, 2 });

            migrationBuilder.DeleteData(
                table: "ROLE_PERMISSION",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { 34, 2 });

            migrationBuilder.DeleteData(
                table: "ROLE_PERMISSION",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { 35, 2 });

            migrationBuilder.DeleteData(
                table: "ROLE_PERMISSION",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { 36, 2 });

            migrationBuilder.DeleteData(
                table: "ROLE_PERMISSION",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { 38, 2 });

            migrationBuilder.DeleteData(
                table: "ROLE_PERMISSION",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { 39, 2 });

            migrationBuilder.DeleteData(
                table: "ROLE_PERMISSION",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { 44, 2 });

            migrationBuilder.DeleteData(
                table: "ROLE_PERMISSION",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { 48, 2 });

            migrationBuilder.DeleteData(
                table: "ROLE_PERMISSION",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { 49, 2 });

            migrationBuilder.DeleteData(
                table: "ROLE_PERMISSION",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { 54, 2 });

            migrationBuilder.DeleteData(
                table: "ROLE_PERMISSION",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { 55, 2 });

            migrationBuilder.DeleteData(
                table: "ROLE_PERMISSION",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { 56, 2 });

            migrationBuilder.DeleteData(
                table: "ROLE_PERMISSION",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { 58, 2 });

            migrationBuilder.DeleteData(
                table: "ROLE_PERMISSION",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { 2, 3 });

            migrationBuilder.DeleteData(
                table: "ROLE_PERMISSION",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { 5, 3 });

            migrationBuilder.DeleteData(
                table: "ROLE_PERMISSION",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { 6, 3 });

            migrationBuilder.DeleteData(
                table: "ROLE_PERMISSION",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { 7, 3 });

            migrationBuilder.DeleteData(
                table: "ROLE_PERMISSION",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { 8, 3 });

            migrationBuilder.DeleteData(
                table: "ROLE_PERMISSION",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { 9, 3 });

            migrationBuilder.DeleteData(
                table: "ROLE_PERMISSION",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { 11, 3 });

            migrationBuilder.DeleteData(
                table: "ROLE_PERMISSION",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { 12, 3 });

            migrationBuilder.DeleteData(
                table: "ROLE_PERMISSION",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { 13, 3 });

            migrationBuilder.DeleteData(
                table: "ROLE_PERMISSION",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { 14, 3 });

            migrationBuilder.DeleteData(
                table: "ROLE_PERMISSION",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { 15, 3 });

            migrationBuilder.DeleteData(
                table: "ROLE_PERMISSION",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { 16, 3 });

            migrationBuilder.DeleteData(
                table: "ROLE_PERMISSION",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { 17, 3 });

            migrationBuilder.DeleteData(
                table: "ROLE_PERMISSION",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { 19, 3 });

            migrationBuilder.DeleteData(
                table: "ROLE_PERMISSION",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { 20, 3 });

            migrationBuilder.DeleteData(
                table: "ROLE_PERMISSION",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { 21, 3 });

            migrationBuilder.DeleteData(
                table: "ROLE_PERMISSION",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { 22, 3 });

            migrationBuilder.DeleteData(
                table: "ROLE_PERMISSION",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { 23, 3 });

            migrationBuilder.DeleteData(
                table: "ROLE_PERMISSION",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { 24, 3 });

            migrationBuilder.DeleteData(
                table: "ROLE_PERMISSION",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { 25, 3 });

            migrationBuilder.DeleteData(
                table: "ROLE_PERMISSION",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { 26, 3 });

            migrationBuilder.DeleteData(
                table: "ROLE_PERMISSION",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { 28, 3 });

            migrationBuilder.DeleteData(
                table: "ROLE_PERMISSION",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { 30, 3 });

            migrationBuilder.DeleteData(
                table: "ROLE_PERMISSION",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { 31, 3 });

            migrationBuilder.DeleteData(
                table: "ROLE_PERMISSION",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { 32, 3 });

            migrationBuilder.DeleteData(
                table: "ROLE_PERMISSION",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { 33, 3 });

            migrationBuilder.DeleteData(
                table: "ROLE_PERMISSION",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { 34, 3 });

            migrationBuilder.DeleteData(
                table: "ROLE_PERMISSION",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { 35, 3 });

            migrationBuilder.DeleteData(
                table: "ROLE_PERMISSION",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { 36, 3 });

            migrationBuilder.DeleteData(
                table: "ROLE_PERMISSION",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { 38, 3 });

            migrationBuilder.DeleteData(
                table: "ROLE_PERMISSION",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { 39, 3 });

            migrationBuilder.DeleteData(
                table: "ROLE_PERMISSION",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { 44, 3 });

            migrationBuilder.DeleteData(
                table: "ROLE_PERMISSION",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { 47, 3 });

            migrationBuilder.DeleteData(
                table: "ROLE_PERMISSION",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { 48, 3 });

            migrationBuilder.DeleteData(
                table: "ROLE_PERMISSION",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { 49, 3 });

            migrationBuilder.DeleteData(
                table: "ROLE_PERMISSION",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { 50, 3 });

            migrationBuilder.DeleteData(
                table: "ROLE_PERMISSION",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { 53, 3 });

            migrationBuilder.DeleteData(
                table: "ROLE_PERMISSION",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { 54, 3 });

            migrationBuilder.DeleteData(
                table: "ROLE_PERMISSION",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { 55, 3 });

            migrationBuilder.DeleteData(
                table: "ROLE_PERMISSION",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { 56, 3 });

            migrationBuilder.DeleteData(
                table: "ROLE_PERMISSION",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { 58, 3 });

            migrationBuilder.DeleteData(
                table: "ROLE_PERMISSION",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { 29, 4 });

            migrationBuilder.DeleteData(
                table: "ROLE_PERMISSION",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { 32, 4 });

            migrationBuilder.DeleteData(
                table: "ROLE_PERMISSION",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { 35, 4 });

            migrationBuilder.DeleteData(
                table: "ROLE_PERMISSION",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { 48, 4 });

            migrationBuilder.DeleteData(
                table: "ROLE_PERMISSION",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { 51, 4 });

            migrationBuilder.DeleteData(
                table: "ROLE_PERMISSION",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { 55, 4 });

            migrationBuilder.DeleteData(
                table: "ROLE_PERMISSION",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { 56, 4 });

            migrationBuilder.DeleteData(
                table: "ROLE_PERMISSION",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { 28, 5 });

            migrationBuilder.DeleteData(
                table: "ROLE_PERMISSION",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { 41, 5 });

            migrationBuilder.DeleteData(
                table: "ROLE_PERMISSION",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { 42, 5 });

            migrationBuilder.DeleteData(
                table: "ROLE_PERMISSION",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { 43, 5 });

            migrationBuilder.DeleteData(
                table: "ROLE_PERMISSION",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { 44, 5 });

            migrationBuilder.DeleteData(
                table: "ROLE_PERMISSION",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { 45, 5 });

            migrationBuilder.DeleteData(
                table: "ROLE_PERMISSION",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { 46, 5 });

            migrationBuilder.DeleteData(
                table: "ROLE_PERMISSION",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { 47, 5 });

            migrationBuilder.DeleteData(
                table: "ROLE_PERMISSION",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { 48, 5 });

            migrationBuilder.DeleteData(
                table: "ROLE_PERMISSION",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { 55, 5 });

            migrationBuilder.DeleteData(
                table: "ROLE_PERMISSION",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { 56, 5 });

            migrationBuilder.DeleteData(
                table: "ROLE_PERMISSION",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { 47, 6 });

            migrationBuilder.DeleteData(
                table: "ROLE_PERMISSION",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { 48, 6 });

            migrationBuilder.DeleteData(
                table: "ROLE_PERMISSION",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { 52, 6 });

            migrationBuilder.DeleteData(
                table: "ROLE_PERMISSION",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { 53, 6 });

            migrationBuilder.DeleteData(
                table: "ROLE_PERMISSION",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { 55, 6 });

            migrationBuilder.DeleteData(
                table: "ROLE_PERMISSION",
                keyColumns: new[] { "permission_id", "role_id" },
                keyValues: new object[] { 56, 6 });
        }
    }
}
