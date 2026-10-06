using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ExpertHub.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class M10Assignments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ASSIGNMENT_REQUEST",
                columns: table => new
                {
                    request_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    reference = table.Column<string>(type: "nvarchar(24)", maxLength: 24, nullable: false),
                    service_type = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    request_type = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: false),
                    requesting_centre_id = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    responsible_employee = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    required_headcount = table.Column<int>(type: "int", nullable: false),
                    status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    form_values = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    created_by = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ASSIGNMENT_REQUEST", x => x.request_id);
                    table.ForeignKey(
                        name: "FK_ASSIGNMENT_REQUEST_APP_USER_created_by",
                        column: x => x.created_by,
                        principalTable: "APP_USER",
                        principalColumn: "user_id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "MATCHING_MODEL",
                columns: table => new
                {
                    matching_model_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    version = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    weights = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    tie_break_note_ar = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    tie_break_note_en = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    is_active = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MATCHING_MODEL", x => x.matching_model_id);
                });

            migrationBuilder.CreateTable(
                name: "ASSIGNMENT_SLOT",
                columns: table => new
                {
                    slot_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    request_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    slot_number = table.Column<int>(type: "int", nullable: false),
                    confirmed_engagement_id = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    fast_sync_state = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    exhausted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ASSIGNMENT_SLOT", x => x.slot_id);
                    table.ForeignKey(
                        name: "FK_ASSIGNMENT_SLOT_ASSIGNMENT_REQUEST_request_id",
                        column: x => x.request_id,
                        principalTable: "ASSIGNMENT_REQUEST",
                        principalColumn: "request_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ASSIGNMENT_OFFER",
                columns: table => new
                {
                    offer_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    slot_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    trainer_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    status = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    price = table.Column<decimal>(type: "decimal(10,2)", precision: 10, scale: 2, nullable: true),
                    currency = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    sent_at = table.Column<DateTime>(type: "datetime2", nullable: false),
                    response_due_at = table.Column<DateTime>(type: "datetime2", nullable: true),
                    responded_at = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ASSIGNMENT_OFFER", x => x.offer_id);
                    table.ForeignKey(
                        name: "FK_ASSIGNMENT_OFFER_ASSIGNMENT_SLOT_slot_id",
                        column: x => x.slot_id,
                        principalTable: "ASSIGNMENT_SLOT",
                        principalColumn: "slot_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ASSIGNMENT_OFFER_TRAINER_PROFILE_trainer_id",
                        column: x => x.trainer_id,
                        principalTable: "TRAINER_PROFILE",
                        principalColumn: "trainer_id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "CANDIDATE_POOL",
                columns: table => new
                {
                    pool_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    request_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    slot_id = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    path = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    sent_at = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CANDIDATE_POOL", x => x.pool_id);
                    table.ForeignKey(
                        name: "FK_CANDIDATE_POOL_ASSIGNMENT_REQUEST_request_id",
                        column: x => x.request_id,
                        principalTable: "ASSIGNMENT_REQUEST",
                        principalColumn: "request_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CANDIDATE_POOL_ASSIGNMENT_SLOT_slot_id",
                        column: x => x.slot_id,
                        principalTable: "ASSIGNMENT_SLOT",
                        principalColumn: "slot_id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "MATCHING_RUN",
                columns: table => new
                {
                    run_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    request_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    slot_id = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    matching_model_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    required_pool_size = table.Column<int>(type: "int", nullable: false),
                    run_by = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    run_at = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MATCHING_RUN", x => x.run_id);
                    table.ForeignKey(
                        name: "FK_MATCHING_RUN_APP_USER_run_by",
                        column: x => x.run_by,
                        principalTable: "APP_USER",
                        principalColumn: "user_id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_MATCHING_RUN_ASSIGNMENT_REQUEST_request_id",
                        column: x => x.request_id,
                        principalTable: "ASSIGNMENT_REQUEST",
                        principalColumn: "request_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MATCHING_RUN_ASSIGNMENT_SLOT_slot_id",
                        column: x => x.slot_id,
                        principalTable: "ASSIGNMENT_SLOT",
                        principalColumn: "slot_id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_MATCHING_RUN_MATCHING_MODEL_matching_model_id",
                        column: x => x.matching_model_id,
                        principalTable: "MATCHING_MODEL",
                        principalColumn: "matching_model_id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ENGAGEMENT",
                columns: table => new
                {
                    engagement_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    offer_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    trainer_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    slot_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    confirmed_at = table.Column<DateTime>(type: "datetime2", nullable: false),
                    schedule_changed_at = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ENGAGEMENT", x => x.engagement_id);
                    table.ForeignKey(
                        name: "FK_ENGAGEMENT_ASSIGNMENT_OFFER_offer_id",
                        column: x => x.offer_id,
                        principalTable: "ASSIGNMENT_OFFER",
                        principalColumn: "offer_id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ENGAGEMENT_ASSIGNMENT_SLOT_slot_id",
                        column: x => x.slot_id,
                        principalTable: "ASSIGNMENT_SLOT",
                        principalColumn: "slot_id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ENGAGEMENT_TRAINER_PROFILE_trainer_id",
                        column: x => x.trainer_id,
                        principalTable: "TRAINER_PROFILE",
                        principalColumn: "trainer_id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "POOL_MEMBER",
                columns: table => new
                {
                    pool_member_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    pool_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    trainer_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    price_in_class = table.Column<decimal>(type: "decimal(10,2)", precision: 10, scale: 2, nullable: true),
                    price_online = table.Column<decimal>(type: "decimal(10,2)", precision: 10, scale: 2, nullable: true),
                    currency = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    decision = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    preference_rank = table.Column<int>(type: "int", nullable: true),
                    decided_at = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_POOL_MEMBER", x => x.pool_member_id);
                    table.ForeignKey(
                        name: "FK_POOL_MEMBER_CANDIDATE_POOL_pool_id",
                        column: x => x.pool_id,
                        principalTable: "CANDIDATE_POOL",
                        principalColumn: "pool_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_POOL_MEMBER_TRAINER_PROFILE_trainer_id",
                        column: x => x.trainer_id,
                        principalTable: "TRAINER_PROFILE",
                        principalColumn: "trainer_id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "SLOT_CYCLE",
                columns: table => new
                {
                    cycle_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    slot_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    cycle_number = table.Column<int>(type: "int", nullable: false),
                    status = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    pool_id = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SLOT_CYCLE", x => x.cycle_id);
                    table.ForeignKey(
                        name: "FK_SLOT_CYCLE_ASSIGNMENT_SLOT_slot_id",
                        column: x => x.slot_id,
                        principalTable: "ASSIGNMENT_SLOT",
                        principalColumn: "slot_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_SLOT_CYCLE_CANDIDATE_POOL_pool_id",
                        column: x => x.pool_id,
                        principalTable: "CANDIDATE_POOL",
                        principalColumn: "pool_id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "MATCH_CANDIDATE",
                columns: table => new
                {
                    match_candidate_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    run_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    trainer_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    weighted_scores = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: false),
                    total_score = table.Column<decimal>(type: "decimal(6,3)", precision: 6, scale: 3, nullable: false),
                    rank = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MATCH_CANDIDATE", x => x.match_candidate_id);
                    table.ForeignKey(
                        name: "FK_MATCH_CANDIDATE_MATCHING_RUN_run_id",
                        column: x => x.run_id,
                        principalTable: "MATCHING_RUN",
                        principalColumn: "run_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MATCH_CANDIDATE_TRAINER_PROFILE_trainer_id",
                        column: x => x.trainer_id,
                        principalTable: "TRAINER_PROFILE",
                        principalColumn: "trainer_id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "MATCH_EXCLUSION",
                columns: table => new
                {
                    exclusion_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    run_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    trainer_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    reasons = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MATCH_EXCLUSION", x => x.exclusion_id);
                    table.ForeignKey(
                        name: "FK_MATCH_EXCLUSION_MATCHING_RUN_run_id",
                        column: x => x.run_id,
                        principalTable: "MATCHING_RUN",
                        principalColumn: "run_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MATCH_EXCLUSION_TRAINER_PROFILE_trainer_id",
                        column: x => x.trainer_id,
                        principalTable: "TRAINER_PROFILE",
                        principalColumn: "trainer_id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ENGAGEMENT_TERMINATION",
                columns: table => new
                {
                    termination_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    engagement_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    kind = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    actor = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    reason = table.Column<string>(type: "nvarchar(60)", maxLength: 60, nullable: false),
                    note = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    fast_cancel_reason_code = table.Column<string>(type: "nvarchar(60)", maxLength: 60, nullable: true),
                    acted_by = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    occurred_at = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ENGAGEMENT_TERMINATION", x => x.termination_id);
                    table.ForeignKey(
                        name: "FK_ENGAGEMENT_TERMINATION_APP_USER_acted_by",
                        column: x => x.acted_by,
                        principalTable: "APP_USER",
                        principalColumn: "user_id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ENGAGEMENT_TERMINATION_ENGAGEMENT_engagement_id",
                        column: x => x.engagement_id,
                        principalTable: "ENGAGEMENT",
                        principalColumn: "engagement_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MATERIAL_SUBMISSION",
                columns: table => new
                {
                    submission_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    engagement_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    kind = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    status = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    fast_sync_state = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    opened_at = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MATERIAL_SUBMISSION", x => x.submission_id);
                    table.ForeignKey(
                        name: "FK_MATERIAL_SUBMISSION_ENGAGEMENT_engagement_id",
                        column: x => x.engagement_id,
                        principalTable: "ENGAGEMENT",
                        principalColumn: "engagement_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SUBMISSION_ROUND",
                columns: table => new
                {
                    round_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    submission_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    round_number = table.Column<int>(type: "int", nullable: false),
                    file_name = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    decision = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: true),
                    note = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    decided_by = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    decided_at = table.Column<DateTime>(type: "datetime2", nullable: true),
                    uploaded_at = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SUBMISSION_ROUND", x => x.round_id);
                    table.ForeignKey(
                        name: "FK_SUBMISSION_ROUND_APP_USER_decided_by",
                        column: x => x.decided_by,
                        principalTable: "APP_USER",
                        principalColumn: "user_id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_SUBMISSION_ROUND_MATERIAL_SUBMISSION_submission_id",
                        column: x => x.submission_id,
                        principalTable: "MATERIAL_SUBMISSION",
                        principalColumn: "submission_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "MATCHING_MODEL",
                columns: new[] { "matching_model_id", "is_active", "tie_break_note_ar", "tie_break_note_en", "version", "weights" },
                values: new object[] { new Guid("c5000000-0000-0000-0000-000000000001"), true, null, null, "mock-dm-gap-05-draft.1", "{\"language\":34,\"delivery-mode\":33,\"evaluation\":33}" });

            migrationBuilder.CreateIndex(
                name: "IX_ASSIGNMENT_OFFER_slot_id_sent_at",
                table: "ASSIGNMENT_OFFER",
                columns: new[] { "slot_id", "sent_at" });

            migrationBuilder.CreateIndex(
                name: "IX_ASSIGNMENT_OFFER_trainer_id",
                table: "ASSIGNMENT_OFFER",
                column: "trainer_id");

            migrationBuilder.CreateIndex(
                name: "IX_ASSIGNMENT_REQUEST_created_by",
                table: "ASSIGNMENT_REQUEST",
                column: "created_by");

            migrationBuilder.CreateIndex(
                name: "IX_ASSIGNMENT_REQUEST_reference",
                table: "ASSIGNMENT_REQUEST",
                column: "reference",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ASSIGNMENT_SLOT_request_id_slot_number",
                table: "ASSIGNMENT_SLOT",
                columns: new[] { "request_id", "slot_number" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CANDIDATE_POOL_request_id",
                table: "CANDIDATE_POOL",
                column: "request_id");

            migrationBuilder.CreateIndex(
                name: "IX_CANDIDATE_POOL_slot_id",
                table: "CANDIDATE_POOL",
                column: "slot_id");

            migrationBuilder.CreateIndex(
                name: "IX_ENGAGEMENT_offer_id",
                table: "ENGAGEMENT",
                column: "offer_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ENGAGEMENT_slot_id",
                table: "ENGAGEMENT",
                column: "slot_id");

            migrationBuilder.CreateIndex(
                name: "IX_ENGAGEMENT_trainer_id",
                table: "ENGAGEMENT",
                column: "trainer_id");

            migrationBuilder.CreateIndex(
                name: "IX_ENGAGEMENT_TERMINATION_acted_by",
                table: "ENGAGEMENT_TERMINATION",
                column: "acted_by");

            migrationBuilder.CreateIndex(
                name: "IX_ENGAGEMENT_TERMINATION_engagement_id",
                table: "ENGAGEMENT_TERMINATION",
                column: "engagement_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MATCH_CANDIDATE_run_id_trainer_id",
                table: "MATCH_CANDIDATE",
                columns: new[] { "run_id", "trainer_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MATCH_CANDIDATE_trainer_id",
                table: "MATCH_CANDIDATE",
                column: "trainer_id");

            migrationBuilder.CreateIndex(
                name: "IX_MATCH_EXCLUSION_run_id_trainer_id",
                table: "MATCH_EXCLUSION",
                columns: new[] { "run_id", "trainer_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MATCH_EXCLUSION_trainer_id",
                table: "MATCH_EXCLUSION",
                column: "trainer_id");

            migrationBuilder.CreateIndex(
                name: "IX_MATCHING_MODEL_version",
                table: "MATCHING_MODEL",
                column: "version",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MATCHING_RUN_matching_model_id",
                table: "MATCHING_RUN",
                column: "matching_model_id");

            migrationBuilder.CreateIndex(
                name: "IX_MATCHING_RUN_request_id_run_at",
                table: "MATCHING_RUN",
                columns: new[] { "request_id", "run_at" });

            migrationBuilder.CreateIndex(
                name: "IX_MATCHING_RUN_run_by",
                table: "MATCHING_RUN",
                column: "run_by");

            migrationBuilder.CreateIndex(
                name: "IX_MATCHING_RUN_slot_id",
                table: "MATCHING_RUN",
                column: "slot_id");

            migrationBuilder.CreateIndex(
                name: "IX_MATERIAL_SUBMISSION_engagement_id",
                table: "MATERIAL_SUBMISSION",
                column: "engagement_id");

            migrationBuilder.CreateIndex(
                name: "IX_POOL_MEMBER_pool_id_trainer_id",
                table: "POOL_MEMBER",
                columns: new[] { "pool_id", "trainer_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_POOL_MEMBER_trainer_id",
                table: "POOL_MEMBER",
                column: "trainer_id");

            migrationBuilder.CreateIndex(
                name: "IX_SLOT_CYCLE_pool_id",
                table: "SLOT_CYCLE",
                column: "pool_id");

            migrationBuilder.CreateIndex(
                name: "IX_SLOT_CYCLE_slot_id_cycle_number",
                table: "SLOT_CYCLE",
                columns: new[] { "slot_id", "cycle_number" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SUBMISSION_ROUND_decided_by",
                table: "SUBMISSION_ROUND",
                column: "decided_by");

            migrationBuilder.CreateIndex(
                name: "IX_SUBMISSION_ROUND_submission_id_round_number",
                table: "SUBMISSION_ROUND",
                columns: new[] { "submission_id", "round_number" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ENGAGEMENT_TERMINATION");

            migrationBuilder.DropTable(
                name: "MATCH_CANDIDATE");

            migrationBuilder.DropTable(
                name: "MATCH_EXCLUSION");

            migrationBuilder.DropTable(
                name: "POOL_MEMBER");

            migrationBuilder.DropTable(
                name: "SLOT_CYCLE");

            migrationBuilder.DropTable(
                name: "SUBMISSION_ROUND");

            migrationBuilder.DropTable(
                name: "MATCHING_RUN");

            migrationBuilder.DropTable(
                name: "CANDIDATE_POOL");

            migrationBuilder.DropTable(
                name: "MATERIAL_SUBMISSION");

            migrationBuilder.DropTable(
                name: "MATCHING_MODEL");

            migrationBuilder.DropTable(
                name: "ENGAGEMENT");

            migrationBuilder.DropTable(
                name: "ASSIGNMENT_OFFER");

            migrationBuilder.DropTable(
                name: "ASSIGNMENT_SLOT");

            migrationBuilder.DropTable(
                name: "ASSIGNMENT_REQUEST");
        }
    }
}
