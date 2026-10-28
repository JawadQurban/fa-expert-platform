using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ExpertHub.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class M57ApplicationFormCitiesAndProgrammes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "FORM_FIELD",
                keyColumn: "field_id",
                keyValue: new Guid("ff000000-0000-0000-0009-000000000050"),
                columns: new[] { "definition", "input_type" },
                values: new object[] { "{\"id\":\"preferredPrograms\",\"type\":\"multi-select\",\"display\":\"dropdown\",\"optionsSource\":\"fast-programmes\",\"sectionId\":\"training-content\",\"labelAr\":\"بناءً على اطلاعكم على موقع الأكاديمية المالية، ما هي أبرز البرامج التدريبية أو الورش أو الفعاليات التي ترغبون في تقديمها؟\",\"labelEn\":\"Preferred programs/workshops to deliver\",\"helpAr\":\"اختر من برامج الأكاديمية، أو «أخرى» لفعالية أو برنامج غير مدرج.\",\"helpEn\":\"Choose from the Academy’s programmes, or “Other” for an event or anything not listed.\",\"requiredFor\":[],\"options\":[{\"value\":\"other\",\"labelAr\":\"أخرى\",\"labelEn\":\"Other\"}],\"ownership\":\"expert-hub\",\"order\":11}", "multi-select" });

            migrationBuilder.UpdateData(
                table: "FORM_FIELD",
                keyColumn: "field_id",
                keyValue: new Guid("ff000000-0000-0000-0009-000000000055"),
                columns: new[] { "definition", "input_type" },
                values: new object[] { "{\"id\":\"inPersonCities\",\"type\":\"multi-select\",\"display\":\"dropdown\",\"sectionId\":\"availability\",\"labelAr\":\"المدن المتاح فيها الحضور الشخصي\",\"labelEn\":\"Cities available for in-person attendance\",\"helpAr\":\"اختر مدينة أو أكثر من مدن المملكة.\",\"helpEn\":\"Choose one or more cities in the Kingdom.\",\"requiredFor\":[\"trainer\",\"consultant\",\"content-developer\",\"question-writer\"],\"options\":[{\"value\":\"city-1\",\"labelAr\":\"الرياض\",\"labelEn\":\"Riyadh\"},{\"value\":\"city-2\",\"labelAr\":\"جدة\",\"labelEn\":\"Jeddah\"},{\"value\":\"city-3\",\"labelAr\":\"الدمام\",\"labelEn\":\"Dammam\"},{\"value\":\"city-4\",\"labelAr\":\"ابها\",\"labelEn\":\"Abha\"},{\"value\":\"city-5\",\"labelAr\":\"حائل\",\"labelEn\":\"Hail\"},{\"value\":\"city-6\",\"labelAr\":\"جازان\",\"labelEn\":\"Jezan\"},{\"value\":\"city-7\",\"labelAr\":\"الخبر\",\"labelEn\":\"Al Khobar\"},{\"value\":\"city-8\",\"labelAr\":\"القصيم\",\"labelEn\":\"Qassem\"},{\"value\":\"city-9\",\"labelAr\":\"مكة المكرمة\",\"labelEn\":\"Makkah\"},{\"value\":\"city-10\",\"labelAr\":\"المدينة المنورة\",\"labelEn\":\"Madinah\"},{\"value\":\"city-11\",\"labelAr\":\"الطائف\",\"labelEn\":\"Taif\"},{\"value\":\"city-13\",\"labelAr\":\"ينبع\",\"labelEn\":\"Yanboua\"},{\"value\":\"city-14\",\"labelAr\":\"بريده\",\"labelEn\":\"Boraidah\"},{\"value\":\"city-16\",\"labelAr\":\"تبوك\",\"labelEn\":\"Tabouk\"},{\"value\":\"city-18\",\"labelAr\":\"نجران\",\"labelEn\":\"Najran\"},{\"value\":\"city-20\",\"labelAr\":\"الظهران\",\"labelEn\":\"Dhahran\"},{\"value\":\"city-21\",\"labelAr\":\"القطيف\",\"labelEn\":\"Qatif\"},{\"value\":\"city-22\",\"labelAr\":\"الهفوف\",\"labelEn\":\"Hofuf\"},{\"value\":\"city-23\",\"labelAr\":\"الرس\",\"labelEn\":\"Alras\"},{\"value\":\"city-24\",\"labelAr\":\"الجبيل\",\"labelEn\":\"Al Jubail\"},{\"value\":\"city-25\",\"labelAr\":\"الأحساء\",\"labelEn\":\"Al Ahsa\"},{\"value\":\"city-26\",\"labelAr\":\"شرورة\",\"labelEn\":\"Sharurah\"},{\"value\":\"city-27\",\"labelAr\":\"ضباء\",\"labelEn\":\"Deba\"},{\"value\":\"city-30\",\"labelAr\":\"عفيف\",\"labelEn\":\"Afif\"},{\"value\":\"city-31\",\"labelAr\":\"النماص\",\"labelEn\":\"Al Nomas\"},{\"value\":\"city-33\",\"labelAr\":\"خميس مشيط\",\"labelEn\":\"Khamis Mushayt\"},{\"value\":\"city-625\",\"labelAr\":\"عرعر\",\"labelEn\":\"Arar\"},{\"value\":\"city-633\",\"labelAr\":\"الباحة\",\"labelEn\":\"Al Baha\"},{\"value\":\"city-635\",\"labelAr\":\"حفر الباطن\",\"labelEn\":\"Hafer Al Batin\"},{\"value\":\"city-636\",\"labelAr\":\"بقيق\",\"labelEn\":\"Abqaiq\"},{\"value\":\"city-648\",\"labelAr\":\"ثادق\",\"labelEn\":\"Thadeq\"},{\"value\":\"city-660\",\"labelAr\":\"القريات\",\"labelEn\":\"Al-Qriyat\"},{\"value\":\"city-661\",\"labelAr\":\"الجوف\",\"labelEn\":\"Al-Jouf\"},{\"value\":\"city-662\",\"labelAr\":\"دومة الجندل\",\"labelEn\":\"Dumat Al Jandal\"},{\"value\":\"city-663\",\"labelAr\":\"العلا\",\"labelEn\":\"Al-Olaa\"},{\"value\":\"city-664\",\"labelAr\":\"طريف\",\"labelEn\":\"Turaif\"},{\"value\":\"city-665\",\"labelAr\":\"تيماء\",\"labelEn\":\"Tema\"},{\"value\":\"city-666\",\"labelAr\":\"محافظة المهد\",\"labelEn\":\"Al Mahd\"},{\"value\":\"city-673\",\"labelAr\":\"المجمعه\",\"labelEn\":\"Al Majmah\"},{\"value\":\"city-675\",\"labelAr\":\"راس تنورة\",\"labelEn\":\"Ras Tanurah\"},{\"value\":\"city-682\",\"labelAr\":\"المنطقة الشرقية\",\"labelEn\":\"Eastern Region\"},{\"value\":\"city-692\",\"labelAr\":\"الزلفي\",\"labelEn\":\"Alzulfi\"},{\"value\":\"city-693\",\"labelAr\":\"الخرج\",\"labelEn\":\"Al Kharj\"},{\"value\":\"city-695\",\"labelAr\":\"عنيزه\",\"labelEn\":\"Onezah\"},{\"value\":\"city-701\",\"labelAr\":\"الوجه\",\"labelEn\":\"Al Wajh\"},{\"value\":\"city-712\",\"labelAr\":\"سكاكا\",\"labelEn\":\"Sukaka\"},{\"value\":\"city-713\",\"labelAr\":\"عسير\",\"labelEn\":\"Aseer\"},{\"value\":\"city-715\",\"labelAr\":\"المنطقة الشمالية\",\"labelEn\":\"North Region\"},{\"value\":\"city-716\",\"labelAr\":\"بلجرشي\",\"labelEn\":\"Baljorashi\"},{\"value\":\"city-721\",\"labelAr\":\"أبو عريش\",\"labelEn\":\"Abu Areesh\"},{\"value\":\"city-722\",\"labelAr\":\"أحد رفيده\",\"labelEn\":\"Ahad Rfaidah\"},{\"value\":\"city-723\",\"labelAr\":\"صفوى\",\"labelEn\":\"Safwa\"},{\"value\":\"city-727\",\"labelAr\":\"القنفذة\",\"labelEn\":\"Al Qonfethah\"},{\"value\":\"city-743\",\"labelAr\":\"الدرعية\",\"labelEn\":\"Ad Dereyah\"},{\"value\":\"city-744\",\"labelAr\":\"ظهران الجنوب\",\"labelEn\":\"Dhahran Al Janoub\"},{\"value\":\"city-747\",\"labelAr\":\"المندق\",\"labelEn\":\"Al Mandag\"},{\"value\":\"city-748\",\"labelAr\":\"المخواة\",\"labelEn\":\"Al Mekhwah\"},{\"value\":\"city-749\",\"labelAr\":\"القويعية\",\"labelEn\":\"Al Gwaieyah\"},{\"value\":\"city-750\",\"labelAr\":\"الرويضة\",\"labelEn\":\"Ar Rwaidah\"},{\"value\":\"city-753\",\"labelAr\":\"الليث\",\"labelEn\":\"Al Lith\"},{\"value\":\"city-754\",\"labelAr\":\"الحريق\",\"labelEn\":\"Harig\"},{\"value\":\"city-755\",\"labelAr\":\"الثقبة\",\"labelEn\":\"Al-Thoqba\"},{\"value\":\"city-756\",\"labelAr\":\"رياض الخبراء\",\"labelEn\":\"Riyadh Al-Khabra\"},{\"value\":\"city-757\",\"labelAr\":\"البكيرية\",\"labelEn\":\"Albukairiah\"},{\"value\":\"city-760\",\"labelAr\":\"المذنب\",\"labelEn\":\"Al Methnab\"},{\"value\":\"city-761\",\"labelAr\":\"القيصومة\",\"labelEn\":\"Al Qesomah\"},{\"value\":\"city-762\",\"labelAr\":\"المزاحمية\",\"labelEn\":\"Elmzahmeyah\"},{\"value\":\"city-763\",\"labelAr\":\"سبت العلايه\",\"labelEn\":\"Sabt AlAlaya\"},{\"value\":\"city-767\",\"labelAr\":\"السعيرة\",\"labelEn\":\"Alsa'yrah\"},{\"value\":\"city-773\",\"labelAr\":\"رابغ\",\"labelEn\":\"Rabigh\"},{\"value\":\"city-774\",\"labelAr\":\"وادي الدواسر\",\"labelEn\":\"Wadi Aldwaser\"},{\"value\":\"city-777\",\"labelAr\":\"شقراء\",\"labelEn\":\"Shaqra\"},{\"value\":\"city-780\",\"labelAr\":\"وادي فاطمة\",\"labelEn\":\"Wadi Fatima\"},{\"value\":\"city-781\",\"labelAr\":\"البطحاء\",\"labelEn\":\"Al-Bathaa\"}],\"ownership\":\"expert-hub\",\"order\":3}", "multi-select" });

            migrationBuilder.InsertData(
                table: "FORM_FIELD",
                columns: new[] { "field_id", "definition", "field_code", "input_type", "label_ar", "label_en", "order_index", "schema_version", "section_code" },
                values: new object[] { new Guid("ff000000-0000-0000-0009-000000000060"), "{\"id\":\"preferredProgramsOther\",\"type\":\"text\",\"sectionId\":\"training-content\",\"labelAr\":\"البرامج أو الفعاليات (أخرى)\",\"labelEn\":\"Programmes or events (other)\",\"helpAr\":\"اكتب البرامج أو الورش أو الفعاليات التي ترغب في تقديمها.\",\"helpEn\":\"Name the programmes, workshops or events you would like to deliver.\",\"requiredFor\":[\"trainer\",\"consultant\",\"content-developer\",\"question-writer\"],\"dependsOn\":{\"fieldId\":\"preferredPrograms\",\"equals\":\"other\"},\"validation\":{\"maxLength\":300,\"pattern\":\"[A-Za-z\\\\u0621-\\\\u0652\\\\u0640\\\\u0671-\\\\u06D3]\",\"patternMessageAr\":\"يجب أن يحتوي النص على حروف، لا أرقام أو رموز فقط.\",\"patternMessageEn\":\"The text must contain letters, not only digits or symbols.\"},\"ownership\":\"expert-hub\",\"order\":11.1}", "preferredProgramsOther", "text", "البرامج أو الفعاليات (أخرى)", "Programmes or events (other)", 60, "dm-gap-01.2026-10-28", "training-content" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "FORM_FIELD",
                keyColumn: "field_id",
                keyValue: new Guid("ff000000-0000-0000-0009-000000000060"));

            migrationBuilder.UpdateData(
                table: "FORM_FIELD",
                keyColumn: "field_id",
                keyValue: new Guid("ff000000-0000-0000-0009-000000000050"),
                columns: new[] { "definition", "input_type" },
                values: new object[] { "{\"id\":\"preferredPrograms\",\"type\":\"select\",\"sectionId\":\"training-content\",\"labelAr\":\"بناءً على اطلاعكم على موقع الأكاديمية المالية، ما هي أبرز البرامج التدريبية أو الورش أو الفعاليات التي ترغبون في تقديمها؟\",\"labelEn\":\"Preferred programs/workshops to deliver\",\"requiredFor\":[],\"options\":[{\"value\":\"fa-programs\",\"labelAr\":\"برامج الأكاديمية المالية\",\"labelEn\":\"FA Programs\"},{\"value\":\"events\",\"labelAr\":\"الفعاليات\",\"labelEn\":\"Events\"}],\"ownership\":\"expert-hub\",\"order\":11}", "select" });

            migrationBuilder.UpdateData(
                table: "FORM_FIELD",
                keyColumn: "field_id",
                keyValue: new Guid("ff000000-0000-0000-0009-000000000055"),
                columns: new[] { "definition", "input_type" },
                values: new object[] { "{\"id\":\"inPersonCities\",\"type\":\"text\",\"sectionId\":\"availability\",\"labelAr\":\"المدن المتاح فيها الحضور الشخصي\",\"labelEn\":\"Cities available for in-person attendance\",\"helpAr\":\"مثال: الرياض، جدة، الدمام، أبوظبي.\",\"helpEn\":\"Example: Riyadh, Jeddah, Dammam, Abu Dhabi.\",\"requiredFor\":[\"trainer\",\"consultant\",\"content-developer\",\"question-writer\"],\"validation\":{\"maxLength\":300,\"pattern\":\"^(?=.*[A-Za-z\\\\u0621-\\\\u0652\\\\u0640\\\\u0671-\\\\u06D3])[A-Za-z\\\\u0621-\\\\u0652\\\\u0640\\\\u0671-\\\\u06D3 ,،-]+$\",\"patternMessageAr\":\"اكتب أسماء المدن بالحروف، وافصل بينها بفاصلة.\",\"patternMessageEn\":\"Write the city names in letters, separated by commas.\"},\"ownership\":\"expert-hub\",\"order\":3}", "text" });
        }
    }
}
