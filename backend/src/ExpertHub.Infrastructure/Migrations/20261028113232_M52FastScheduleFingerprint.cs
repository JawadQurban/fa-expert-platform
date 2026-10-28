using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ExpertHub.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class M52FastScheduleFingerprint : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "fast_schedule_fingerprint",
                table: "ASSIGNMENT_REQUEST",
                type: "nvarchar(64)",
                maxLength: 64,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "fast_schedule_fingerprint",
                table: "ASSIGNMENT_REQUEST");
        }
    }
}
