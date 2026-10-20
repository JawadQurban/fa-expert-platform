using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ExpertHub.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class M45MatchingWeightedSpecializationLocation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "MATCHING_MODEL",
                keyColumn: "matching_model_id",
                keyValue: new Guid("c5000000-0000-0000-0000-000000000001"),
                column: "weights",
                value: "{\"specialization\":33,\"location\":33,\"language\":34,\"delivery-mode\":33,\"evaluation\":33}");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "MATCHING_MODEL",
                keyColumn: "matching_model_id",
                keyValue: new Guid("c5000000-0000-0000-0000-000000000001"),
                column: "weights",
                value: "{\"language\":34,\"delivery-mode\":33,\"evaluation\":33}");
        }
    }
}
