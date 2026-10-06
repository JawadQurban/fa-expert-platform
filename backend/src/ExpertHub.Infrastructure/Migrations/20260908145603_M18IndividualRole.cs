using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ExpertHub.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class M18IndividualRole : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "CK_ROLE_code",
                table: "ROLE");

            migrationBuilder.InsertData(
                table: "ROLE",
                columns: new[] { "role_id", "code", "description_ar", "description_en", "is_system", "name_ar", "name_en" },
                values: new object[] { 7, "individual", "كل من يدخل المنصة. يتصفح صفحته الرئيسية ويقدّم طلباته ويتابعها، ولا يصل إلى ما يخص المدربين المعتمدين.", "Everybody who signs in: their home page and their own applications, and nothing that belongs to an accredited trainer.", true, "مستخدم مسجل", "Individual" });

            migrationBuilder.AddCheckConstraint(
                name: "CK_ROLE_code",
                table: "ROLE",
                sql: "[code] IN ('trainer', 'staff', 'manager', 'centre_coordinator', 'system_administrator', 'executive', 'individual')");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "CK_ROLE_code",
                table: "ROLE");

            migrationBuilder.DeleteData(
                table: "ROLE",
                keyColumn: "role_id",
                keyValue: 7);

            migrationBuilder.AddCheckConstraint(
                name: "CK_ROLE_code",
                table: "ROLE",
                sql: "[code] IN ('trainer', 'staff', 'manager', 'centre_coordinator', 'system_administrator', 'executive')");
        }
    }
}
