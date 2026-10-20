using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ExpertHub.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class M50FastDeliveredPlans : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "fast_plan_id",
                table: "TRAINER_RECORD",
                type: "nvarchar(64)",
                maxLength: 64,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_TRAINER_RECORD_trainer_id_fast_plan_id",
                table: "TRAINER_RECORD",
                columns: new[] { "trainer_id", "fast_plan_id" },
                unique: true,
                filter: "[fast_plan_id] IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_TRAINER_RECORD_trainer_id_fast_plan_id",
                table: "TRAINER_RECORD");

            migrationBuilder.DropColumn(
                name: "fast_plan_id",
                table: "TRAINER_RECORD");
        }
    }
}
