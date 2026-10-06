using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ExpertHub.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class M01Foundation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "APP_USER",
                columns: table => new
                {
                    user_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    external_identity_id = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    email = table.Column<string>(type: "nvarchar(320)", maxLength: 320, nullable: false),
                    phone = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: true),
                    full_name_ar = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    full_name_en = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    preferred_communication_language = table.Column<string>(type: "nvarchar(5)", maxLength: 5, nullable: false),
                    preferred_ui_language = table.Column<string>(type: "nvarchar(5)", maxLength: 5, nullable: false),
                    is_active = table.Column<bool>(type: "bit", nullable: false),
                    is_employee = table.Column<bool>(type: "bit", nullable: false),
                    last_login_at = table.Column<DateTime>(type: "datetime2", nullable: true),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_APP_USER", x => x.user_id);
                });

            migrationBuilder.CreateTable(
                name: "PERMISSION",
                columns: table => new
                {
                    permission_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    capability_code = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    feature_code = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    name_ar = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                    name_en = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PERMISSION", x => x.permission_id);
                });

            migrationBuilder.CreateTable(
                name: "REFERENCE_LIST",
                columns: table => new
                {
                    list_code = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    name_ar = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    name_en = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    is_editable = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_REFERENCE_LIST", x => x.list_code);
                });

            migrationBuilder.CreateTable(
                name: "ROLE",
                columns: table => new
                {
                    role_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    code = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    name_ar = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    name_en = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    is_system = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ROLE", x => x.role_id);
                    table.CheckConstraint("CK_ROLE_code", "[code] IN ('trainer', 'staff', 'manager', 'centre_coordinator', 'sysadmin', 'executive')");
                });

            migrationBuilder.CreateTable(
                name: "ATTACHMENT",
                columns: table => new
                {
                    attachment_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    file_name = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    mime_type = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    size_bytes = table.Column<long>(type: "bigint", nullable: false),
                    storage_ref = table.Column<string>(type: "nvarchar(400)", maxLength: 400, nullable: false),
                    checksum = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: true),
                    scan_status = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: true),
                    uploaded_by = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    uploaded_at = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ATTACHMENT", x => x.attachment_id);
                    table.ForeignKey(
                        name: "FK_ATTACHMENT_APP_USER_uploaded_by",
                        column: x => x.uploaded_by,
                        principalTable: "APP_USER",
                        principalColumn: "user_id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "AUDIT_LOG",
                columns: table => new
                {
                    audit_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    user_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    action = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    entity_type = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    entity_id = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    before_state = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    after_state = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ip_address = table.Column<string>(type: "nvarchar(45)", maxLength: 45, nullable: true),
                    occurred_at = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AUDIT_LOG", x => x.audit_id);
                    table.ForeignKey(
                        name: "FK_AUDIT_LOG_APP_USER_user_id",
                        column: x => x.user_id,
                        principalTable: "APP_USER",
                        principalColumn: "user_id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "REFERENCE_VALUE",
                columns: table => new
                {
                    value_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    list_code = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    code = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    label_ar = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                    label_en = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                    sort_order = table.Column<int>(type: "int", nullable: false),
                    is_active = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_REFERENCE_VALUE", x => x.value_id);
                    table.ForeignKey(
                        name: "FK_REFERENCE_VALUE_REFERENCE_LIST_list_code",
                        column: x => x.list_code,
                        principalTable: "REFERENCE_LIST",
                        principalColumn: "list_code",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ROLE_PERMISSION",
                columns: table => new
                {
                    role_id = table.Column<int>(type: "int", nullable: false),
                    permission_id = table.Column<int>(type: "int", nullable: false),
                    data_scope = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ROLE_PERMISSION", x => new { x.role_id, x.permission_id });
                    table.CheckConstraint("CK_ROLE_PERMISSION_data_scope", "[data_scope] IN ('all', 'own', 'centre')");
                    table.ForeignKey(
                        name: "FK_ROLE_PERMISSION_PERMISSION_permission_id",
                        column: x => x.permission_id,
                        principalTable: "PERMISSION",
                        principalColumn: "permission_id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ROLE_PERMISSION_ROLE_role_id",
                        column: x => x.role_id,
                        principalTable: "ROLE",
                        principalColumn: "role_id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "USER_ROLE",
                columns: table => new
                {
                    user_role_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    user_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    role_id = table.Column<int>(type: "int", nullable: false),
                    scope_ref = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    assigned_by = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    assigned_at = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_USER_ROLE", x => x.user_role_id);
                    table.ForeignKey(
                        name: "FK_USER_ROLE_APP_USER_assigned_by",
                        column: x => x.assigned_by,
                        principalTable: "APP_USER",
                        principalColumn: "user_id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_USER_ROLE_APP_USER_user_id",
                        column: x => x.user_id,
                        principalTable: "APP_USER",
                        principalColumn: "user_id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_USER_ROLE_ROLE_role_id",
                        column: x => x.role_id,
                        principalTable: "ROLE",
                        principalColumn: "role_id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_APP_USER_external_identity_id",
                table: "APP_USER",
                column: "external_identity_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ATTACHMENT_uploaded_by",
                table: "ATTACHMENT",
                column: "uploaded_by");

            migrationBuilder.CreateIndex(
                name: "IX_AUDIT_LOG_entity_type_entity_id",
                table: "AUDIT_LOG",
                columns: new[] { "entity_type", "entity_id" });

            migrationBuilder.CreateIndex(
                name: "IX_AUDIT_LOG_occurred_at",
                table: "AUDIT_LOG",
                column: "occurred_at");

            migrationBuilder.CreateIndex(
                name: "IX_AUDIT_LOG_user_id",
                table: "AUDIT_LOG",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_PERMISSION_feature_code",
                table: "PERMISSION",
                column: "feature_code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_REFERENCE_VALUE_list_code_code",
                table: "REFERENCE_VALUE",
                columns: new[] { "list_code", "code" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ROLE_code",
                table: "ROLE",
                column: "code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ROLE_PERMISSION_permission_id",
                table: "ROLE_PERMISSION",
                column: "permission_id");

            migrationBuilder.CreateIndex(
                name: "IX_USER_ROLE_assigned_by",
                table: "USER_ROLE",
                column: "assigned_by");

            migrationBuilder.CreateIndex(
                name: "IX_USER_ROLE_role_id",
                table: "USER_ROLE",
                column: "role_id");

            migrationBuilder.CreateIndex(
                name: "IX_USER_ROLE_user_id_role_id_scope_ref",
                table: "USER_ROLE",
                columns: new[] { "user_id", "role_id", "scope_ref" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ATTACHMENT");

            migrationBuilder.DropTable(
                name: "AUDIT_LOG");

            migrationBuilder.DropTable(
                name: "REFERENCE_VALUE");

            migrationBuilder.DropTable(
                name: "ROLE_PERMISSION");

            migrationBuilder.DropTable(
                name: "USER_ROLE");

            migrationBuilder.DropTable(
                name: "REFERENCE_LIST");

            migrationBuilder.DropTable(
                name: "PERMISSION");

            migrationBuilder.DropTable(
                name: "APP_USER");

            migrationBuilder.DropTable(
                name: "ROLE");
        }
    }
}
