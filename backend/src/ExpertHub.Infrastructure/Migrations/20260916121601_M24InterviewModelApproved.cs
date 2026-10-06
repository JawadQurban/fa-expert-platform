using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace ExpertHub.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class M24InterviewModelApproved : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "pass_threshold",
                table: "INTERVIEW_MODEL",
                type: "decimal(5,1)",
                precision: 5,
                scale: 1,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "rating_scale",
                table: "INTERVIEW_MODEL",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "result_max_score",
                table: "INTERVIEW_MODEL",
                type: "decimal(5,1)",
                precision: 5,
                scale: 1,
                nullable: false,
                // Every model that exists before this migration is the draft,
                // whose totals are on a 0–5 scale.
                defaultValue: 5m);

            migrationBuilder.AddColumn<string>(
                name: "model_version",
                table: "INTERVIEW",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            // Every interview that exists before this migration was created —
            // and possibly scored — under the draft model, the only model there
            // was. Pin it there, so activating the approved model below never
            // re-scores it.
            migrationBuilder.Sql(
                "UPDATE [INTERVIEW] SET [model_version] = N'mock-dm-gap-03-draft.1' WHERE [model_version] IS NULL;");

            migrationBuilder.UpdateData(
                table: "INTERVIEW_MODEL",
                keyColumn: "interview_model_id",
                keyValue: new Guid("e3000000-0000-0000-0000-000000000001"),
                columns: new[] { "is_active", "pass_threshold", "rating_scale", "result_max_score" },
                values: new object[] { false, null, null, 5m });

            migrationBuilder.UpdateData(
                table: "INTERVIEW_MODEL",
                keyColumn: "interview_model_id",
                keyValue: new Guid("e3000000-0000-0000-0000-000000000002"),
                columns: new[] { "is_active", "pass_threshold", "rating_scale", "result_max_score" },
                values: new object[] { false, null, null, 5m });

            migrationBuilder.UpdateData(
                table: "INTERVIEW_MODEL",
                keyColumn: "interview_model_id",
                keyValue: new Guid("e3000000-0000-0000-0000-000000000003"),
                columns: new[] { "is_active", "pass_threshold", "rating_scale", "result_max_score" },
                values: new object[] { false, null, null, 5m });

            migrationBuilder.UpdateData(
                table: "INTERVIEW_MODEL",
                keyColumn: "interview_model_id",
                keyValue: new Guid("e3000000-0000-0000-0000-000000000004"),
                columns: new[] { "is_active", "pass_threshold", "rating_scale", "result_max_score" },
                values: new object[] { false, null, null, 5m });

            migrationBuilder.InsertData(
                table: "INTERVIEW_MODEL",
                columns: new[] { "interview_model_id", "is_active", "pass_threshold", "rating_scale", "result_max_score", "service", "version" },
                values: new object[,]
                {
                    { new Guid("e5000000-0000-0000-0000-000000000001"), true, 70m, "[{\"score\":1,\"labelAr\":\"لا يظهر السلوك/المهارة إطلاقًا — قصور واضح\",\"labelEn\":\"Very Poor\"},{\"score\":2,\"labelAr\":\"أداء ضعيف — أقل من الحد الأدنى المطلوب\",\"labelEn\":\"Poor\"},{\"score\":3,\"labelAr\":\"أداء مقبول — يفي بالحد الأدنى المطلوب\",\"labelEn\":\"Acceptable\"},{\"score\":4,\"labelAr\":\"أداء جيد — يتجاوز المتوقع في معظم الجوانب\",\"labelEn\":\"Good\"},{\"score\":5,\"labelAr\":\"أداء ممتاز — نموذجي، لا يحتاج تطوير\",\"labelEn\":\"Excellent\"}]", 100m, "trainer", "dm-gap-03.2026-09-02" },
                    { new Guid("e5000000-0000-0000-0000-000000000002"), true, 70m, "[{\"score\":1,\"labelAr\":\"لا يظهر السلوك/المهارة إطلاقًا — قصور واضح\",\"labelEn\":\"Very Poor\"},{\"score\":2,\"labelAr\":\"أداء ضعيف — أقل من الحد الأدنى المطلوب\",\"labelEn\":\"Poor\"},{\"score\":3,\"labelAr\":\"أداء مقبول — يفي بالحد الأدنى المطلوب\",\"labelEn\":\"Acceptable\"},{\"score\":4,\"labelAr\":\"أداء جيد — يتجاوز المتوقع في معظم الجوانب\",\"labelEn\":\"Good\"},{\"score\":5,\"labelAr\":\"أداء ممتاز — نموذجي، لا يحتاج تطوير\",\"labelEn\":\"Excellent\"}]", 100m, "consultant", "dm-gap-03.2026-09-02" },
                    { new Guid("e5000000-0000-0000-0000-000000000003"), true, 70m, "[{\"score\":1,\"labelAr\":\"لا يظهر السلوك/المهارة إطلاقًا — قصور واضح\",\"labelEn\":\"Very Poor\"},{\"score\":2,\"labelAr\":\"أداء ضعيف — أقل من الحد الأدنى المطلوب\",\"labelEn\":\"Poor\"},{\"score\":3,\"labelAr\":\"أداء مقبول — يفي بالحد الأدنى المطلوب\",\"labelEn\":\"Acceptable\"},{\"score\":4,\"labelAr\":\"أداء جيد — يتجاوز المتوقع في معظم الجوانب\",\"labelEn\":\"Good\"},{\"score\":5,\"labelAr\":\"أداء ممتاز — نموذجي، لا يحتاج تطوير\",\"labelEn\":\"Excellent\"}]", 100m, "content-developer", "dm-gap-03.2026-09-02" },
                    { new Guid("e5000000-0000-0000-0000-000000000004"), true, 70m, "[{\"score\":1,\"labelAr\":\"لا يظهر السلوك/المهارة إطلاقًا — قصور واضح\",\"labelEn\":\"Very Poor\"},{\"score\":2,\"labelAr\":\"أداء ضعيف — أقل من الحد الأدنى المطلوب\",\"labelEn\":\"Poor\"},{\"score\":3,\"labelAr\":\"أداء مقبول — يفي بالحد الأدنى المطلوب\",\"labelEn\":\"Acceptable\"},{\"score\":4,\"labelAr\":\"أداء جيد — يتجاوز المتوقع في معظم الجوانب\",\"labelEn\":\"Good\"},{\"score\":5,\"labelAr\":\"أداء ممتاز — نموذجي، لا يحتاج تطوير\",\"labelEn\":\"Excellent\"}]", 100m, "question-writer", "dm-gap-03.2026-09-02" }
                });

            migrationBuilder.InsertData(
                table: "INTERVIEW_AXIS",
                columns: new[] { "axis_id", "axis_code", "description_ar", "description_en", "interview_model_id", "label_ar", "label_en", "max_score", "order_index", "weight" },
                values: new object[,]
                {
                    { new Guid("e6000000-0000-0000-0000-000000000101"), "training-skills", null, null, new Guid("e5000000-0000-0000-0000-000000000001"), "مهارات التدريب", "Training Skills", 5m, 1, 33.3m },
                    { new Guid("e6000000-0000-0000-0000-000000000102"), "communication-skills", null, null, new Guid("e5000000-0000-0000-0000-000000000001"), "مهارات الإتصال / التواصل", "Communication Skills", 5m, 2, 16.7m },
                    { new Guid("e6000000-0000-0000-0000-000000000103"), "training-camps-willingness", null, null, new Guid("e5000000-0000-0000-0000-000000000001"), "الإستعداد لحضور المعسكرات التدريبية", "Willingness to Attend Training Camps", 5m, 3, 16.7m },
                    { new Guid("e6000000-0000-0000-0000-000000000104"), "energy-levels", null, null, new Guid("e5000000-0000-0000-0000-000000000001"), "مستويات الطاقة", "Energy Levels", 5m, 4, 6.7m },
                    { new Guid("e6000000-0000-0000-0000-000000000105"), "emotional-intelligence", null, null, new Guid("e5000000-0000-0000-0000-000000000001"), "التعامل مع الذكاء العاطفي", "Emotional Intelligence", 5m, 5, 6.7m },
                    { new Guid("e6000000-0000-0000-0000-000000000106"), "client-needs-flexibility", null, null, new Guid("e5000000-0000-0000-0000-000000000001"), "المرونة والإستعداد للتكيف مع إحتياجات العميل", "Flexibility & Adaptability to Client Needs", 5m, 6, 6.7m },
                    { new Guid("e6000000-0000-0000-0000-000000000107"), "community-giving-back", null, null, new Guid("e5000000-0000-0000-0000-000000000001"), "الميل لرد الجميل للمجتمع / رؤية 2030", "Giving Back to Community / Vision 2030", 5m, 7, 3.3m },
                    { new Guid("e6000000-0000-0000-0000-000000000108"), "organizational-values", null, null, new Guid("e5000000-0000-0000-0000-000000000001"), "التوافق مع القيم التنظيمية", "Alignment with Organizational Values", 5m, 8, 3.3m },
                    { new Guid("e6000000-0000-0000-0000-000000000109"), "cultural-sensitivity", null, null, new Guid("e5000000-0000-0000-0000-000000000001"), "الحساسية الثقافية", "Cultural Sensitivity", 5m, 9, 3.3m },
                    { new Guid("e6000000-0000-0000-0000-000000000110"), "thinking-comprehension", null, null, new Guid("e5000000-0000-0000-0000-000000000001"), "القدرة على التفكير والإستيعاب", "Thinking & Comprehension Ability", 5m, 10, 3.3m },
                    { new Guid("e6000000-0000-0000-0000-000000000201"), "training-skills", null, null, new Guid("e5000000-0000-0000-0000-000000000002"), "مهارات التدريب", "Training Skills", 5m, 1, 33.3m },
                    { new Guid("e6000000-0000-0000-0000-000000000202"), "communication-skills", null, null, new Guid("e5000000-0000-0000-0000-000000000002"), "مهارات الإتصال / التواصل", "Communication Skills", 5m, 2, 16.7m },
                    { new Guid("e6000000-0000-0000-0000-000000000203"), "training-camps-willingness", null, null, new Guid("e5000000-0000-0000-0000-000000000002"), "الإستعداد لحضور المعسكرات التدريبية", "Willingness to Attend Training Camps", 5m, 3, 16.7m },
                    { new Guid("e6000000-0000-0000-0000-000000000204"), "energy-levels", null, null, new Guid("e5000000-0000-0000-0000-000000000002"), "مستويات الطاقة", "Energy Levels", 5m, 4, 6.7m },
                    { new Guid("e6000000-0000-0000-0000-000000000205"), "emotional-intelligence", null, null, new Guid("e5000000-0000-0000-0000-000000000002"), "التعامل مع الذكاء العاطفي", "Emotional Intelligence", 5m, 5, 6.7m },
                    { new Guid("e6000000-0000-0000-0000-000000000206"), "client-needs-flexibility", null, null, new Guid("e5000000-0000-0000-0000-000000000002"), "المرونة والإستعداد للتكيف مع إحتياجات العميل", "Flexibility & Adaptability to Client Needs", 5m, 6, 6.7m },
                    { new Guid("e6000000-0000-0000-0000-000000000207"), "community-giving-back", null, null, new Guid("e5000000-0000-0000-0000-000000000002"), "الميل لرد الجميل للمجتمع / رؤية 2030", "Giving Back to Community / Vision 2030", 5m, 7, 3.3m },
                    { new Guid("e6000000-0000-0000-0000-000000000208"), "organizational-values", null, null, new Guid("e5000000-0000-0000-0000-000000000002"), "التوافق مع القيم التنظيمية", "Alignment with Organizational Values", 5m, 8, 3.3m },
                    { new Guid("e6000000-0000-0000-0000-000000000209"), "cultural-sensitivity", null, null, new Guid("e5000000-0000-0000-0000-000000000002"), "الحساسية الثقافية", "Cultural Sensitivity", 5m, 9, 3.3m },
                    { new Guid("e6000000-0000-0000-0000-000000000210"), "thinking-comprehension", null, null, new Guid("e5000000-0000-0000-0000-000000000002"), "القدرة على التفكير والإستيعاب", "Thinking & Comprehension Ability", 5m, 10, 3.3m },
                    { new Guid("e6000000-0000-0000-0000-000000000301"), "training-skills", null, null, new Guid("e5000000-0000-0000-0000-000000000003"), "مهارات التدريب", "Training Skills", 5m, 1, 33.3m },
                    { new Guid("e6000000-0000-0000-0000-000000000302"), "communication-skills", null, null, new Guid("e5000000-0000-0000-0000-000000000003"), "مهارات الإتصال / التواصل", "Communication Skills", 5m, 2, 16.7m },
                    { new Guid("e6000000-0000-0000-0000-000000000303"), "training-camps-willingness", null, null, new Guid("e5000000-0000-0000-0000-000000000003"), "الإستعداد لحضور المعسكرات التدريبية", "Willingness to Attend Training Camps", 5m, 3, 16.7m },
                    { new Guid("e6000000-0000-0000-0000-000000000304"), "energy-levels", null, null, new Guid("e5000000-0000-0000-0000-000000000003"), "مستويات الطاقة", "Energy Levels", 5m, 4, 6.7m },
                    { new Guid("e6000000-0000-0000-0000-000000000305"), "emotional-intelligence", null, null, new Guid("e5000000-0000-0000-0000-000000000003"), "التعامل مع الذكاء العاطفي", "Emotional Intelligence", 5m, 5, 6.7m },
                    { new Guid("e6000000-0000-0000-0000-000000000306"), "client-needs-flexibility", null, null, new Guid("e5000000-0000-0000-0000-000000000003"), "المرونة والإستعداد للتكيف مع إحتياجات العميل", "Flexibility & Adaptability to Client Needs", 5m, 6, 6.7m },
                    { new Guid("e6000000-0000-0000-0000-000000000307"), "community-giving-back", null, null, new Guid("e5000000-0000-0000-0000-000000000003"), "الميل لرد الجميل للمجتمع / رؤية 2030", "Giving Back to Community / Vision 2030", 5m, 7, 3.3m },
                    { new Guid("e6000000-0000-0000-0000-000000000308"), "organizational-values", null, null, new Guid("e5000000-0000-0000-0000-000000000003"), "التوافق مع القيم التنظيمية", "Alignment with Organizational Values", 5m, 8, 3.3m },
                    { new Guid("e6000000-0000-0000-0000-000000000309"), "cultural-sensitivity", null, null, new Guid("e5000000-0000-0000-0000-000000000003"), "الحساسية الثقافية", "Cultural Sensitivity", 5m, 9, 3.3m },
                    { new Guid("e6000000-0000-0000-0000-000000000310"), "thinking-comprehension", null, null, new Guid("e5000000-0000-0000-0000-000000000003"), "القدرة على التفكير والإستيعاب", "Thinking & Comprehension Ability", 5m, 10, 3.3m },
                    { new Guid("e6000000-0000-0000-0000-000000000401"), "training-skills", null, null, new Guid("e5000000-0000-0000-0000-000000000004"), "مهارات التدريب", "Training Skills", 5m, 1, 33.3m },
                    { new Guid("e6000000-0000-0000-0000-000000000402"), "communication-skills", null, null, new Guid("e5000000-0000-0000-0000-000000000004"), "مهارات الإتصال / التواصل", "Communication Skills", 5m, 2, 16.7m },
                    { new Guid("e6000000-0000-0000-0000-000000000403"), "training-camps-willingness", null, null, new Guid("e5000000-0000-0000-0000-000000000004"), "الإستعداد لحضور المعسكرات التدريبية", "Willingness to Attend Training Camps", 5m, 3, 16.7m },
                    { new Guid("e6000000-0000-0000-0000-000000000404"), "energy-levels", null, null, new Guid("e5000000-0000-0000-0000-000000000004"), "مستويات الطاقة", "Energy Levels", 5m, 4, 6.7m },
                    { new Guid("e6000000-0000-0000-0000-000000000405"), "emotional-intelligence", null, null, new Guid("e5000000-0000-0000-0000-000000000004"), "التعامل مع الذكاء العاطفي", "Emotional Intelligence", 5m, 5, 6.7m },
                    { new Guid("e6000000-0000-0000-0000-000000000406"), "client-needs-flexibility", null, null, new Guid("e5000000-0000-0000-0000-000000000004"), "المرونة والإستعداد للتكيف مع إحتياجات العميل", "Flexibility & Adaptability to Client Needs", 5m, 6, 6.7m },
                    { new Guid("e6000000-0000-0000-0000-000000000407"), "community-giving-back", null, null, new Guid("e5000000-0000-0000-0000-000000000004"), "الميل لرد الجميل للمجتمع / رؤية 2030", "Giving Back to Community / Vision 2030", 5m, 7, 3.3m },
                    { new Guid("e6000000-0000-0000-0000-000000000408"), "organizational-values", null, null, new Guid("e5000000-0000-0000-0000-000000000004"), "التوافق مع القيم التنظيمية", "Alignment with Organizational Values", 5m, 8, 3.3m },
                    { new Guid("e6000000-0000-0000-0000-000000000409"), "cultural-sensitivity", null, null, new Guid("e5000000-0000-0000-0000-000000000004"), "الحساسية الثقافية", "Cultural Sensitivity", 5m, 9, 3.3m },
                    { new Guid("e6000000-0000-0000-0000-000000000410"), "thinking-comprehension", null, null, new Guid("e5000000-0000-0000-0000-000000000004"), "القدرة على التفكير والإستيعاب", "Thinking & Comprehension Ability", 5m, 10, 3.3m }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "INTERVIEW_AXIS",
                keyColumn: "axis_id",
                keyValue: new Guid("e6000000-0000-0000-0000-000000000101"));

            migrationBuilder.DeleteData(
                table: "INTERVIEW_AXIS",
                keyColumn: "axis_id",
                keyValue: new Guid("e6000000-0000-0000-0000-000000000102"));

            migrationBuilder.DeleteData(
                table: "INTERVIEW_AXIS",
                keyColumn: "axis_id",
                keyValue: new Guid("e6000000-0000-0000-0000-000000000103"));

            migrationBuilder.DeleteData(
                table: "INTERVIEW_AXIS",
                keyColumn: "axis_id",
                keyValue: new Guid("e6000000-0000-0000-0000-000000000104"));

            migrationBuilder.DeleteData(
                table: "INTERVIEW_AXIS",
                keyColumn: "axis_id",
                keyValue: new Guid("e6000000-0000-0000-0000-000000000105"));

            migrationBuilder.DeleteData(
                table: "INTERVIEW_AXIS",
                keyColumn: "axis_id",
                keyValue: new Guid("e6000000-0000-0000-0000-000000000106"));

            migrationBuilder.DeleteData(
                table: "INTERVIEW_AXIS",
                keyColumn: "axis_id",
                keyValue: new Guid("e6000000-0000-0000-0000-000000000107"));

            migrationBuilder.DeleteData(
                table: "INTERVIEW_AXIS",
                keyColumn: "axis_id",
                keyValue: new Guid("e6000000-0000-0000-0000-000000000108"));

            migrationBuilder.DeleteData(
                table: "INTERVIEW_AXIS",
                keyColumn: "axis_id",
                keyValue: new Guid("e6000000-0000-0000-0000-000000000109"));

            migrationBuilder.DeleteData(
                table: "INTERVIEW_AXIS",
                keyColumn: "axis_id",
                keyValue: new Guid("e6000000-0000-0000-0000-000000000110"));

            migrationBuilder.DeleteData(
                table: "INTERVIEW_AXIS",
                keyColumn: "axis_id",
                keyValue: new Guid("e6000000-0000-0000-0000-000000000201"));

            migrationBuilder.DeleteData(
                table: "INTERVIEW_AXIS",
                keyColumn: "axis_id",
                keyValue: new Guid("e6000000-0000-0000-0000-000000000202"));

            migrationBuilder.DeleteData(
                table: "INTERVIEW_AXIS",
                keyColumn: "axis_id",
                keyValue: new Guid("e6000000-0000-0000-0000-000000000203"));

            migrationBuilder.DeleteData(
                table: "INTERVIEW_AXIS",
                keyColumn: "axis_id",
                keyValue: new Guid("e6000000-0000-0000-0000-000000000204"));

            migrationBuilder.DeleteData(
                table: "INTERVIEW_AXIS",
                keyColumn: "axis_id",
                keyValue: new Guid("e6000000-0000-0000-0000-000000000205"));

            migrationBuilder.DeleteData(
                table: "INTERVIEW_AXIS",
                keyColumn: "axis_id",
                keyValue: new Guid("e6000000-0000-0000-0000-000000000206"));

            migrationBuilder.DeleteData(
                table: "INTERVIEW_AXIS",
                keyColumn: "axis_id",
                keyValue: new Guid("e6000000-0000-0000-0000-000000000207"));

            migrationBuilder.DeleteData(
                table: "INTERVIEW_AXIS",
                keyColumn: "axis_id",
                keyValue: new Guid("e6000000-0000-0000-0000-000000000208"));

            migrationBuilder.DeleteData(
                table: "INTERVIEW_AXIS",
                keyColumn: "axis_id",
                keyValue: new Guid("e6000000-0000-0000-0000-000000000209"));

            migrationBuilder.DeleteData(
                table: "INTERVIEW_AXIS",
                keyColumn: "axis_id",
                keyValue: new Guid("e6000000-0000-0000-0000-000000000210"));

            migrationBuilder.DeleteData(
                table: "INTERVIEW_AXIS",
                keyColumn: "axis_id",
                keyValue: new Guid("e6000000-0000-0000-0000-000000000301"));

            migrationBuilder.DeleteData(
                table: "INTERVIEW_AXIS",
                keyColumn: "axis_id",
                keyValue: new Guid("e6000000-0000-0000-0000-000000000302"));

            migrationBuilder.DeleteData(
                table: "INTERVIEW_AXIS",
                keyColumn: "axis_id",
                keyValue: new Guid("e6000000-0000-0000-0000-000000000303"));

            migrationBuilder.DeleteData(
                table: "INTERVIEW_AXIS",
                keyColumn: "axis_id",
                keyValue: new Guid("e6000000-0000-0000-0000-000000000304"));

            migrationBuilder.DeleteData(
                table: "INTERVIEW_AXIS",
                keyColumn: "axis_id",
                keyValue: new Guid("e6000000-0000-0000-0000-000000000305"));

            migrationBuilder.DeleteData(
                table: "INTERVIEW_AXIS",
                keyColumn: "axis_id",
                keyValue: new Guid("e6000000-0000-0000-0000-000000000306"));

            migrationBuilder.DeleteData(
                table: "INTERVIEW_AXIS",
                keyColumn: "axis_id",
                keyValue: new Guid("e6000000-0000-0000-0000-000000000307"));

            migrationBuilder.DeleteData(
                table: "INTERVIEW_AXIS",
                keyColumn: "axis_id",
                keyValue: new Guid("e6000000-0000-0000-0000-000000000308"));

            migrationBuilder.DeleteData(
                table: "INTERVIEW_AXIS",
                keyColumn: "axis_id",
                keyValue: new Guid("e6000000-0000-0000-0000-000000000309"));

            migrationBuilder.DeleteData(
                table: "INTERVIEW_AXIS",
                keyColumn: "axis_id",
                keyValue: new Guid("e6000000-0000-0000-0000-000000000310"));

            migrationBuilder.DeleteData(
                table: "INTERVIEW_AXIS",
                keyColumn: "axis_id",
                keyValue: new Guid("e6000000-0000-0000-0000-000000000401"));

            migrationBuilder.DeleteData(
                table: "INTERVIEW_AXIS",
                keyColumn: "axis_id",
                keyValue: new Guid("e6000000-0000-0000-0000-000000000402"));

            migrationBuilder.DeleteData(
                table: "INTERVIEW_AXIS",
                keyColumn: "axis_id",
                keyValue: new Guid("e6000000-0000-0000-0000-000000000403"));

            migrationBuilder.DeleteData(
                table: "INTERVIEW_AXIS",
                keyColumn: "axis_id",
                keyValue: new Guid("e6000000-0000-0000-0000-000000000404"));

            migrationBuilder.DeleteData(
                table: "INTERVIEW_AXIS",
                keyColumn: "axis_id",
                keyValue: new Guid("e6000000-0000-0000-0000-000000000405"));

            migrationBuilder.DeleteData(
                table: "INTERVIEW_AXIS",
                keyColumn: "axis_id",
                keyValue: new Guid("e6000000-0000-0000-0000-000000000406"));

            migrationBuilder.DeleteData(
                table: "INTERVIEW_AXIS",
                keyColumn: "axis_id",
                keyValue: new Guid("e6000000-0000-0000-0000-000000000407"));

            migrationBuilder.DeleteData(
                table: "INTERVIEW_AXIS",
                keyColumn: "axis_id",
                keyValue: new Guid("e6000000-0000-0000-0000-000000000408"));

            migrationBuilder.DeleteData(
                table: "INTERVIEW_AXIS",
                keyColumn: "axis_id",
                keyValue: new Guid("e6000000-0000-0000-0000-000000000409"));

            migrationBuilder.DeleteData(
                table: "INTERVIEW_AXIS",
                keyColumn: "axis_id",
                keyValue: new Guid("e6000000-0000-0000-0000-000000000410"));

            migrationBuilder.DeleteData(
                table: "INTERVIEW_MODEL",
                keyColumn: "interview_model_id",
                keyValue: new Guid("e5000000-0000-0000-0000-000000000001"));

            migrationBuilder.DeleteData(
                table: "INTERVIEW_MODEL",
                keyColumn: "interview_model_id",
                keyValue: new Guid("e5000000-0000-0000-0000-000000000002"));

            migrationBuilder.DeleteData(
                table: "INTERVIEW_MODEL",
                keyColumn: "interview_model_id",
                keyValue: new Guid("e5000000-0000-0000-0000-000000000003"));

            migrationBuilder.DeleteData(
                table: "INTERVIEW_MODEL",
                keyColumn: "interview_model_id",
                keyValue: new Guid("e5000000-0000-0000-0000-000000000004"));

            migrationBuilder.DropColumn(
                name: "pass_threshold",
                table: "INTERVIEW_MODEL");

            migrationBuilder.DropColumn(
                name: "rating_scale",
                table: "INTERVIEW_MODEL");

            migrationBuilder.DropColumn(
                name: "result_max_score",
                table: "INTERVIEW_MODEL");

            migrationBuilder.DropColumn(
                name: "model_version",
                table: "INTERVIEW");

            migrationBuilder.UpdateData(
                table: "INTERVIEW_MODEL",
                keyColumn: "interview_model_id",
                keyValue: new Guid("e3000000-0000-0000-0000-000000000001"),
                column: "is_active",
                value: true);

            migrationBuilder.UpdateData(
                table: "INTERVIEW_MODEL",
                keyColumn: "interview_model_id",
                keyValue: new Guid("e3000000-0000-0000-0000-000000000002"),
                column: "is_active",
                value: true);

            migrationBuilder.UpdateData(
                table: "INTERVIEW_MODEL",
                keyColumn: "interview_model_id",
                keyValue: new Guid("e3000000-0000-0000-0000-000000000003"),
                column: "is_active",
                value: true);

            migrationBuilder.UpdateData(
                table: "INTERVIEW_MODEL",
                keyColumn: "interview_model_id",
                keyValue: new Guid("e3000000-0000-0000-0000-000000000004"),
                column: "is_active",
                value: true);
        }
    }
}
