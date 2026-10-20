using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace ExpertHub.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class M49FastTrainingReferenceLists : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "REFERENCE_LIST",
                columns: new[] { "list_code", "is_editable", "name_ar", "name_en" },
                values: new object[,]
                {
                    { "fast-cancellation-reason", false, "أسباب إلغاء الخطط (FAST)", "Plan cancellation reasons (FAST)" },
                    { "fast-delivery-mode", false, "آليات التنفيذ (FAST)", "Delivery modes (FAST)" },
                    { "fast-food-service-period", false, "فترات الضيافة (FAST)", "Food service periods (FAST)" },
                    { "fast-job-family", false, "العائلات الوظيفية (FAST)", "Job families (FAST)" },
                    { "fast-language", false, "لغات التدريب (FAST)", "Training languages (FAST)" },
                    { "fast-plan-status", false, "حالات الخطط (FAST)", "Plan statuses (FAST)" },
                    { "fast-program-skill-type", false, "أنواع مهارات البرامج (FAST)", "Programme skill types (FAST)" },
                    { "fast-program-type", false, "أنواع البرامج (FAST)", "Programme types (FAST)" },
                    { "fast-sector", false, "القطاعات والقطاعات الفرعية (FAST)", "Sectors and sub-sectors (FAST)" },
                    { "fast-target-gender", false, "الفئات المستهدفة حسب الجنس (FAST)", "Target genders (FAST)" },
                    { "fast-topic", false, "موضوعات البرامج (FAST)", "Programme topics (FAST)" },
                    { "fast-trainee-level", false, "مستويات المتدربين (FAST)", "Trainee levels (FAST)" },
                    { "fast-training-material-status", false, "حالات المادة التدريبية (FAST)", "Training material statuses (FAST)" },
                    { "fast-venue-scope", false, "نطاقات مكان التنفيذ (FAST)", "Venue scopes (FAST)" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "REFERENCE_LIST",
                keyColumn: "list_code",
                keyValue: "fast-cancellation-reason");

            migrationBuilder.DeleteData(
                table: "REFERENCE_LIST",
                keyColumn: "list_code",
                keyValue: "fast-delivery-mode");

            migrationBuilder.DeleteData(
                table: "REFERENCE_LIST",
                keyColumn: "list_code",
                keyValue: "fast-food-service-period");

            migrationBuilder.DeleteData(
                table: "REFERENCE_LIST",
                keyColumn: "list_code",
                keyValue: "fast-job-family");

            migrationBuilder.DeleteData(
                table: "REFERENCE_LIST",
                keyColumn: "list_code",
                keyValue: "fast-language");

            migrationBuilder.DeleteData(
                table: "REFERENCE_LIST",
                keyColumn: "list_code",
                keyValue: "fast-plan-status");

            migrationBuilder.DeleteData(
                table: "REFERENCE_LIST",
                keyColumn: "list_code",
                keyValue: "fast-program-skill-type");

            migrationBuilder.DeleteData(
                table: "REFERENCE_LIST",
                keyColumn: "list_code",
                keyValue: "fast-program-type");

            migrationBuilder.DeleteData(
                table: "REFERENCE_LIST",
                keyColumn: "list_code",
                keyValue: "fast-sector");

            migrationBuilder.DeleteData(
                table: "REFERENCE_LIST",
                keyColumn: "list_code",
                keyValue: "fast-target-gender");

            migrationBuilder.DeleteData(
                table: "REFERENCE_LIST",
                keyColumn: "list_code",
                keyValue: "fast-topic");

            migrationBuilder.DeleteData(
                table: "REFERENCE_LIST",
                keyColumn: "list_code",
                keyValue: "fast-trainee-level");

            migrationBuilder.DeleteData(
                table: "REFERENCE_LIST",
                keyColumn: "list_code",
                keyValue: "fast-training-material-status");

            migrationBuilder.DeleteData(
                table: "REFERENCE_LIST",
                keyColumn: "list_code",
                keyValue: "fast-venue-scope");
        }
    }
}
