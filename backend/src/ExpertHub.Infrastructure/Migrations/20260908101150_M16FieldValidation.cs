using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ExpertHub.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class M16FieldValidation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "FORM_FIELD",
                keyColumn: "field_id",
                keyValue: new Guid("ff000000-0000-0000-0000-000000000009"),
                column: "definition",
                value: "{\"id\":\"idNumber\",\"type\":\"text\",\"sectionId\":\"personal\",\"labelAr\":\"رقم الهوية الوطنية / هوية مقيم / جواز السفر\",\"labelEn\":\"National ID / Iqama / passport number\",\"requiredFor\":[\"trainer\",\"consultant\",\"content-developer\",\"question-writer\"],\"ownership\":\"sso-profile\",\"validation\":{\"maxLength\":20,\"pattern\":\"^(?:[12][0-9]{9}|[A-Za-z][A-Za-z0-9]{5,19})$\",\"patternMessageAr\":\"أدخل رقم هوية أو إقامة من ١٠ أرقام يبدأ بـ ١ أو ٢، أو رقم جواز سفر صحيحًا.\",\"patternMessageEn\":\"Enter a 10-digit National ID or Iqama starting with 1 or 2, or a valid passport number.\"},\"order\":9}");

            migrationBuilder.UpdateData(
                table: "FORM_FIELD",
                keyColumn: "field_id",
                keyValue: new Guid("ff000000-0000-0000-0000-000000000010"),
                column: "definition",
                value: "{\"id\":\"dateOfBirth\",\"type\":\"date\",\"sectionId\":\"personal\",\"labelAr\":\"تاريخ الميلاد\",\"labelEn\":\"Date of birth\",\"requiredFor\":[\"trainer\",\"consultant\",\"content-developer\",\"question-writer\"],\"ownership\":\"sso-profile\",\"validation\":{\"maxDate\":\"today\"},\"order\":10}");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "FORM_FIELD",
                keyColumn: "field_id",
                keyValue: new Guid("ff000000-0000-0000-0000-000000000009"),
                column: "definition",
                value: "{\"id\":\"idNumber\",\"type\":\"text\",\"sectionId\":\"personal\",\"labelAr\":\"رقم الهوية الوطنية / هوية مقيم / جواز السفر\",\"labelEn\":\"National ID / Iqama / passport number\",\"requiredFor\":[\"trainer\",\"consultant\",\"content-developer\",\"question-writer\"],\"ownership\":\"sso-profile\",\"order\":9}");

            migrationBuilder.UpdateData(
                table: "FORM_FIELD",
                keyColumn: "field_id",
                keyValue: new Guid("ff000000-0000-0000-0000-000000000010"),
                column: "definition",
                value: "{\"id\":\"dateOfBirth\",\"type\":\"date\",\"sectionId\":\"personal\",\"labelAr\":\"تاريخ الميلاد\",\"labelEn\":\"Date of birth\",\"requiredFor\":[\"trainer\",\"consultant\",\"content-developer\",\"question-writer\"],\"ownership\":\"sso-profile\",\"order\":10}");
        }
    }
}
