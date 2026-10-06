using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ExpertHub.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class M11Entitlements : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "EXT_ERP_PURCHASE_ORDER",
                columns: table => new
                {
                    po_number = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    trainer_ref = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: false),
                    amount = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    currency = table.Column<string>(type: "nvarchar(3)", maxLength: 3, nullable: false),
                    disbursement_status = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    disbursement_date = table.Column<DateTime>(type: "datetime2", nullable: true),
                    received_at = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EXT_ERP_PURCHASE_ORDER", x => x.po_number);
                });

            migrationBuilder.CreateTable(
                name: "ENTITLEMENT",
                columns: table => new
                {
                    entitlement_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    trainer_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    purchase_order_number = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    agreement_id = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    engagement_id = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    disbursement_status_code = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    disbursement_status_label_ar = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    disbursement_status_label_en = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    amount = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    currency = table.Column<string>(type: "nvarchar(3)", maxLength: 3, nullable: false),
                    disbursement_date = table.Column<DateTime>(type: "datetime2", nullable: true),
                    last_synced_at = table.Column<DateTime>(type: "datetime2", nullable: false),
                    sync_status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ENTITLEMENT", x => x.entitlement_id);
                    table.ForeignKey(
                        name: "FK_ENTITLEMENT_AGREEMENT_agreement_id",
                        column: x => x.agreement_id,
                        principalTable: "AGREEMENT",
                        principalColumn: "agreement_id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ENTITLEMENT_ENGAGEMENT_engagement_id",
                        column: x => x.engagement_id,
                        principalTable: "ENGAGEMENT",
                        principalColumn: "engagement_id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ENTITLEMENT_EXT_ERP_PURCHASE_ORDER_purchase_order_number",
                        column: x => x.purchase_order_number,
                        principalTable: "EXT_ERP_PURCHASE_ORDER",
                        principalColumn: "po_number",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ENTITLEMENT_TRAINER_PROFILE_trainer_id",
                        column: x => x.trainer_id,
                        principalTable: "TRAINER_PROFILE",
                        principalColumn: "trainer_id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ENTITLEMENT_agreement_id",
                table: "ENTITLEMENT",
                column: "agreement_id");

            migrationBuilder.CreateIndex(
                name: "IX_ENTITLEMENT_engagement_id",
                table: "ENTITLEMENT",
                column: "engagement_id");

            migrationBuilder.CreateIndex(
                name: "IX_ENTITLEMENT_purchase_order_number",
                table: "ENTITLEMENT",
                column: "purchase_order_number",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ENTITLEMENT_trainer_id",
                table: "ENTITLEMENT",
                column: "trainer_id");

            migrationBuilder.CreateIndex(
                name: "IX_EXT_ERP_PURCHASE_ORDER_trainer_ref",
                table: "EXT_ERP_PURCHASE_ORDER",
                column: "trainer_ref");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ENTITLEMENT");

            migrationBuilder.DropTable(
                name: "EXT_ERP_PURCHASE_ORDER");
        }
    }
}
