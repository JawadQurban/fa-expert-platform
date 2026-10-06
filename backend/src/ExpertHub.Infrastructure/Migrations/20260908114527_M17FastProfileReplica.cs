using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ExpertHub.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class M17FastProfileReplica : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "FAST_USER_PROFILE",
                columns: table => new
                {
                    user_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    fast_user_id = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: true),
                    id_number = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: true),
                    passport_number = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: true),
                    residency_number = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: true),
                    date_of_birth = table.Column<DateTime>(type: "datetime2", nullable: true),
                    nationality_country_id = table.Column<int>(type: "int", nullable: true),
                    job_title = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    organization = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    social_media_url = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    can_change_profile = table.Column<bool>(type: "bit", nullable: false),
                    is_organization_admin = table.Column<bool>(type: "bit", nullable: false),
                    is_organization_coordinator = table.Column<bool>(type: "bit", nullable: false),
                    fast_roles = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    expert_corrector = table.Column<bool>(type: "bit", nullable: false),
                    expert_reviewer = table.Column<bool>(type: "bit", nullable: false),
                    expert_question_author = table.Column<bool>(type: "bit", nullable: false),
                    bank_fields = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    last_synced_at = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FAST_USER_PROFILE", x => x.user_id);
                    table.ForeignKey(
                        name: "FK_FAST_USER_PROFILE_APP_USER_user_id",
                        column: x => x.user_id,
                        principalTable: "APP_USER",
                        principalColumn: "user_id",
                        onDelete: ReferentialAction.Cascade);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "FAST_USER_PROFILE");
        }
    }
}
