using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ExpertHub.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class M28ApplicationFormWording : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "FORM_FIELD",
                keyColumn: "field_id",
                keyValue: new Guid("ff000000-0000-0000-0003-000000000035"),
                column: "definition",
                value: "{\"id\":\"trainingLanguages\",\"type\":\"select\",\"sectionId\":\"training-content\",\"labelAr\":\"اللغة\",\"labelEn\":\"Language\",\"requiredFor\":[],\"options\":[{\"value\":\"ar\",\"labelAr\":\"عربي\",\"labelEn\":\"Arabic\"},{\"value\":\"en\",\"labelAr\":\"إنجليزي\",\"labelEn\":\"English\"}],\"ownership\":\"expert-hub\",\"order\":3}");

            migrationBuilder.UpdateData(
                table: "FORM_FIELD",
                keyColumn: "field_id",
                keyValue: new Guid("ff000000-0000-0000-0003-000000000037"),
                columns: new[] { "definition", "label_ar", "label_en" },
                values: new object[] { "{\"id\":\"trainedBeforeDetails\",\"type\":\"textarea\",\"sectionId\":\"training-content\",\"labelAr\":\"تفاصيل الخبرات السابقة في التدريب أو التحدث في الفعاليات\",\"labelEn\":\"Previous training or speaking experience details\",\"helpAr\":\"أدخل كل تجربة في سطر مستقل.\",\"helpEn\":\"Enter each item on a new line.\",\"requiredFor\":[],\"dependsOn\":{\"fieldId\":\"hasTrainedBefore\",\"equals\":\"yes\"},\"ownership\":\"expert-hub\",\"order\":5}", "تفاصيل الخبرات السابقة في التدريب أو التحدث في الفعاليات", "Previous training or speaking experience details" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "FORM_FIELD",
                keyColumn: "field_id",
                keyValue: new Guid("ff000000-0000-0000-0003-000000000035"),
                column: "definition",
                value: "{\"id\":\"trainingLanguages\",\"type\":\"select\",\"sectionId\":\"training-content\",\"labelAr\":\"اللغة\",\"labelEn\":\"Language\",\"requiredFor\":[],\"options\":[{\"value\":\"ar\",\"labelAr\":\"العربية\",\"labelEn\":\"Arabic\"},{\"value\":\"en\",\"labelAr\":\"الإنجليزية\",\"labelEn\":\"English\"}],\"ownership\":\"expert-hub\",\"order\":3}");

            migrationBuilder.UpdateData(
                table: "FORM_FIELD",
                keyColumn: "field_id",
                keyValue: new Guid("ff000000-0000-0000-0003-000000000037"),
                columns: new[] { "definition", "label_ar", "label_en" },
                values: new object[] { "{\"id\":\"trainedBeforeDetails\",\"type\":\"textarea\",\"sectionId\":\"training-content\",\"labelAr\":\"تفاصيل التدريب أو التحدث في الفعاليات\",\"labelEn\":\"Details of your training or speaking at events\",\"helpAr\":\"أدخل كل تجربة في سطر مستقل.\",\"helpEn\":\"Enter each item on a new line.\",\"requiredFor\":[],\"dependsOn\":{\"fieldId\":\"hasTrainedBefore\",\"equals\":\"yes\"},\"ownership\":\"expert-hub\",\"order\":5}", "تفاصيل التدريب أو التحدث في الفعاليات", "Details of your training or speaking at events" });
        }
    }
}
