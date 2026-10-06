using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ExpertHub.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class M21FastQualifications : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "qualifications_education",
                table: "FAST_USER_PROFILE",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "qualifications_practical_experience",
                table: "FAST_USER_PROFILE",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "qualifications_professional",
                table: "FAST_USER_PROFILE",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "qualifications_synced_at",
                table: "FAST_USER_PROFILE",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "qualifications_training_courses",
                table: "FAST_USER_PROFILE",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "qualifications_education",
                table: "FAST_USER_PROFILE");

            migrationBuilder.DropColumn(
                name: "qualifications_practical_experience",
                table: "FAST_USER_PROFILE");

            migrationBuilder.DropColumn(
                name: "qualifications_professional",
                table: "FAST_USER_PROFILE");

            migrationBuilder.DropColumn(
                name: "qualifications_synced_at",
                table: "FAST_USER_PROFILE");

            migrationBuilder.DropColumn(
                name: "qualifications_training_courses",
                table: "FAST_USER_PROFILE");
        }
    }
}
