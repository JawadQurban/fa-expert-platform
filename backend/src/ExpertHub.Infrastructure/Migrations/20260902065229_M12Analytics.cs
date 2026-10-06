using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace ExpertHub.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class M12Analytics : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "DASHBOARD",
                columns: table => new
                {
                    dashboard_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    role_id = table.Column<int>(type: "int", nullable: false),
                    feature_code = table.Column<string>(type: "nvarchar(16)", maxLength: 16, nullable: false),
                    name_ar = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    name_en = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DASHBOARD", x => x.dashboard_id);
                    table.ForeignKey(
                        name: "FK_DASHBOARD_ROLE_role_id",
                        column: x => x.role_id,
                        principalTable: "ROLE",
                        principalColumn: "role_id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "METRIC_DEFINITION",
                columns: table => new
                {
                    metric_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    code = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    name_ar = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    name_en = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    source_capability = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    formula = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    aggregation_level = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_METRIC_DEFINITION", x => x.metric_id);
                });

            migrationBuilder.CreateTable(
                name: "DASHBOARD_METRIC",
                columns: table => new
                {
                    dashboard_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    metric_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    order_index = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DASHBOARD_METRIC", x => new { x.dashboard_id, x.metric_id });
                    table.ForeignKey(
                        name: "FK_DASHBOARD_METRIC_DASHBOARD_dashboard_id",
                        column: x => x.dashboard_id,
                        principalTable: "DASHBOARD",
                        principalColumn: "dashboard_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_DASHBOARD_METRIC_METRIC_DEFINITION_metric_id",
                        column: x => x.metric_id,
                        principalTable: "METRIC_DEFINITION",
                        principalColumn: "metric_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "DASHBOARD",
                columns: new[] { "dashboard_id", "feature_code", "name_ar", "name_en", "role_id" },
                values: new object[,]
                {
                    { new Guid("c9010000-0000-0000-0000-000000000001"), "F-0901", "لوحة مؤشرات إدارة المدربين", "Trainer management dashboard", 2 },
                    { new Guid("c9010000-0000-0000-0000-000000000002"), "F-0902", "لوحة مؤشرات المدير", "Manager dashboard", 3 },
                    { new Guid("c9010000-0000-0000-0000-000000000003"), "F-0903", "لوحة مؤشرات منسق المركز", "Centre coordinator dashboard", 4 },
                    { new Guid("c9010000-0000-0000-0000-000000000004"), "F-0904", "لوحة الإدارة العليا", "Executive dashboard", 6 }
                });

            migrationBuilder.InsertData(
                table: "METRIC_DEFINITION",
                columns: new[] { "metric_id", "aggregation_level", "code", "formula", "name_ar", "name_en", "source_capability" },
                values: new object[,]
                {
                    { new Guid("c9000000-0000-0000-0000-000000000001"), "count", "awaiting-screening", null, "بانتظار الفرز", "Awaiting screening", "CAP-01" },
                    { new Guid("c9000000-0000-0000-0000-000000000002"), "count", "in-screening", null, "قيد الفرز", "In screening", "CAP-02" },
                    { new Guid("c9000000-0000-0000-0000-000000000003"), "count", "interviews", null, "مقابلات مجدولة", "Interviews scheduled", "CAP-02" },
                    { new Guid("c9000000-0000-0000-0000-000000000004"), "count", "awaiting-decision", null, "بانتظار القرار", "Awaiting decision", "CAP-02" },
                    { new Guid("c9000000-0000-0000-0000-000000000005"), "count", "materials-awaiting-approval", null, "مواد بانتظار الاعتماد", "Materials awaiting approval", "CAP-05" }
                });

            migrationBuilder.InsertData(
                table: "DASHBOARD_METRIC",
                columns: new[] { "dashboard_id", "metric_id", "order_index" },
                values: new object[,]
                {
                    { new Guid("c9010000-0000-0000-0000-000000000001"), new Guid("c9000000-0000-0000-0000-000000000001"), 1 },
                    { new Guid("c9010000-0000-0000-0000-000000000001"), new Guid("c9000000-0000-0000-0000-000000000002"), 2 },
                    { new Guid("c9010000-0000-0000-0000-000000000001"), new Guid("c9000000-0000-0000-0000-000000000003"), 3 },
                    { new Guid("c9010000-0000-0000-0000-000000000001"), new Guid("c9000000-0000-0000-0000-000000000004"), 4 },
                    { new Guid("c9010000-0000-0000-0000-000000000001"), new Guid("c9000000-0000-0000-0000-000000000005"), 5 },
                    { new Guid("c9010000-0000-0000-0000-000000000002"), new Guid("c9000000-0000-0000-0000-000000000001"), 1 },
                    { new Guid("c9010000-0000-0000-0000-000000000002"), new Guid("c9000000-0000-0000-0000-000000000002"), 2 },
                    { new Guid("c9010000-0000-0000-0000-000000000002"), new Guid("c9000000-0000-0000-0000-000000000003"), 3 },
                    { new Guid("c9010000-0000-0000-0000-000000000002"), new Guid("c9000000-0000-0000-0000-000000000004"), 4 },
                    { new Guid("c9010000-0000-0000-0000-000000000002"), new Guid("c9000000-0000-0000-0000-000000000005"), 5 }
                });

            migrationBuilder.CreateIndex(
                name: "IX_DASHBOARD_role_id",
                table: "DASHBOARD",
                column: "role_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_DASHBOARD_METRIC_metric_id",
                table: "DASHBOARD_METRIC",
                column: "metric_id");

            migrationBuilder.CreateIndex(
                name: "IX_METRIC_DEFINITION_code",
                table: "METRIC_DEFINITION",
                column: "code",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DASHBOARD_METRIC");

            migrationBuilder.DropTable(
                name: "DASHBOARD");

            migrationBuilder.DropTable(
                name: "METRIC_DEFINITION");
        }
    }
}
