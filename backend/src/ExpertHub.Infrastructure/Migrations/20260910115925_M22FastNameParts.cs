using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ExpertHub.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class M22FastNameParts : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "first_name_ar",
                table: "FAST_USER_PROFILE",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "first_name_en",
                table: "FAST_USER_PROFILE",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "nationality_code",
                table: "FAST_USER_PROFILE",
                type: "nvarchar(16)",
                maxLength: 16,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "first_name_ar",
                table: "FAST_USER_PROFILE");

            migrationBuilder.DropColumn(
                name: "first_name_en",
                table: "FAST_USER_PROFILE");

            migrationBuilder.DropColumn(
                name: "nationality_code",
                table: "FAST_USER_PROFILE");
        }
    }
}
