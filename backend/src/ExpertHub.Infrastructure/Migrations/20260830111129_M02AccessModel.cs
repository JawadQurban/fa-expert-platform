using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace ExpertHub.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class M02AccessModel : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "CK_ROLE_code",
                table: "ROLE");

            migrationBuilder.AddColumn<string>(
                name: "description_ar",
                table: "ROLE",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "description_en",
                table: "ROLE",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<bool>(
                name: "label_needs_verification",
                table: "PERMISSION",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.InsertData(
                table: "PERMISSION",
                columns: new[] { "permission_id", "capability_code", "feature_code", "label_needs_verification", "name_ar", "name_en" },
                values: new object[,]
                {
                    { 1, "CAP-01", "F-0101", true, "تقديم طلب", "Application Management — F-0101" },
                    { 2, "CAP-01", "F-0102", true, "الترشيح", "Application Management — F-0102" },
                    { 3, "CAP-01", "F-0104", true, "طلب إضافة", "Application Management — F-0104" },
                    { 4, "CAP-01", "F-0105", true, "إدخال بيانات", "Application Management — F-0105" },
                    { 5, "CAP-02", "F-0201", true, "الفرز الأولي", "Screening & Evaluation — F-0201" },
                    { 6, "CAP-02", "F-0202", true, "جدولة المقابلة", "Screening & Evaluation — F-0202" },
                    { 7, "CAP-02", "F-0203", true, "تقييم المقابلة", "Screening & Evaluation — F-0203" },
                    { 8, "CAP-02", "F-0204", true, "قرار لجنة", "Screening & Evaluation — F-0204" },
                    { 9, "CAP-02", "F-0205", true, "سير اعتماد", "Screening & Evaluation — F-0205" },
                    { 10, "CAP-02", "F-0206", true, "توقيع المتقدم", "Screening & Evaluation — F-0206" },
                    { 11, "CAP-03", "F-0301", true, "تفعيل الاتفاقية", "Agreement & Contract — F-0301" },
                    { 12, "CAP-03", "F-0302", true, "تنبيهات الانتهاء", "Agreement & Contract — F-0302" },
                    { 13, "CAP-03", "F-0303", true, "التجديد الإداري", "Agreement & Contract — F-0303" },
                    { 14, "CAP-03", "F-0304", true, "ضبط حالة الاتفاقية", "Agreement & Contract — F-0304" },
                    { 15, "CAP-03", "F-0305", true, "إلحاق خدمة جديدة", "Agreement & Contract — F-0305" },
                    { 16, "CAP-04", "F-0401", true, "إنشاء ملف", "Trainer Profile — F-0401" },
                    { 17, "CAP-04", "F-0402", true, "الملف الشامل", "Trainer Profile — F-0402" },
                    { 18, "CAP-04", "F-0403", true, "التحديث الذاتي", "Trainer Profile — F-0403" },
                    { 19, "CAP-04", "F-0404", true, "الخدمات", "Trainer Profile — F-0404" },
                    { 20, "CAP-04", "F-0405", true, "سجل البرامج", "Trainer Profile — F-0405" },
                    { 21, "CAP-04", "F-0406", true, "تقييمات المدرب", "Trainer Profile — F-0406" },
                    { 22, "CAP-04", "F-0407", true, "عرض طلبات", "Trainer Profile — F-0407" },
                    { 23, "CAP-04", "F-0408", true, "عرض بيانات", "Trainer Profile — F-0408" },
                    { 24, "CAP-04", "F-0409", true, "كشف تعارض", "Trainer Profile — F-0409" },
                    { 25, "CAP-04", "F-0410", true, "البحث والفلترة", "Trainer Profile — F-0410" },
                    { 26, "CAP-04", "F-0411", true, "حالة ملف", "Trainer Profile — F-0411" },
                    { 27, "CAP-04", "F-0412", true, "تغذية محرك", "Trainer Profile — F-0412" },
                    { 28, "CAP-04", "F-0413", true, "إدارة سجل", "Trainer Profile — F-0413" },
                    { 29, "CAP-05", "F-0501", true, "إنشاء طلب الإسناد", "Assignment & Matching — F-0501" },
                    { 30, "CAP-05", "F-0502", true, "الترشيح الآلي", "Assignment & Matching — F-0502" },
                    { 31, "CAP-05", "F-0503", true, "البحث والترشيح", "Assignment & Matching — F-0503" },
                    { 32, "CAP-05", "F-0504", true, "موافقة المركز", "Assignment & Matching — F-0504" },
                    { 33, "CAP-05", "F-0505", true, "عرض الإسناد", "Assignment & Matching — F-0505" },
                    { 34, "CAP-05", "F-0506", true, "رفع واعتماد مادة", "Assignment & Matching — F-0506" },
                    { 35, "CAP-05", "F-0507", true, "متابعة الارتباط", "Assignment & Matching — F-0507" },
                    { 36, "CAP-05", "F-0508", true, "إلغاء الارتباط من", "Assignment & Matching — F-0508" },
                    { 37, "CAP-06", "F-0601", true, "عرض المستحقات", "Entitlement Management — F-0601" },
                    { 38, "CAP-06", "F-0602", true, "عرض المستحقات", "Entitlement Management — F-0602" },
                    { 39, "CAP-06", "F-0603", true, "ربط المستحق", "Entitlement Management — F-0603" },
                    { 40, "CAP-07", "F-0701", true, "الإشعارات متعددة", "Communication — F-0701" },
                    { 41, "CAP-07", "F-0702", true, "إدارة مصفوفة", "Communication — F-0702" },
                    { 42, "CAP-07", "F-0703", true, "إدارة القوالب", "Communication — F-0703" },
                    { 43, "CAP-07", "F-0704", true, "شاشة إدارة المهل", "Communication — F-0704" },
                    { 44, "CAP-07", "F-0705", true, "سجل الإشعارات", "Communication — F-0705" },
                    { 45, "CAP-08", "F-0801", true, "مصفوفة الصلاحيات", "Access & Permissions — F-0801" },
                    { 46, "CAP-08", "F-0802", true, "إدارة المستخدمين", "Access & Permissions — F-0802" },
                    { 47, "CAP-08", "F-0805", true, "سجل التدقيق", "Access & Permissions — F-0805" },
                    { 48, "CAP-08", "F-0806", true, "إدارة الحساب الذاتي", "Access & Permissions — F-0806" },
                    { 49, "CAP-09", "F-0901", true, "لوحة مؤشرات", "Analytics & Reporting — F-0901" },
                    { 50, "CAP-09", "F-0902", true, "لوحة مؤشرات", "Analytics & Reporting — F-0902" },
                    { 51, "CAP-09", "F-0903", true, "لوحة مؤشرات", "Analytics & Reporting — F-0903" },
                    { 52, "CAP-09", "F-0904", true, "لوحة الإدارة العليا", "Analytics & Reporting — F-0904" },
                    { 53, "CAP-09", "F-0905", true, "التقارير الدورية", "Analytics & Reporting — F-0905" },
                    { 54, "CAP-09", "F-0906", true, "المؤشرات الشخصية", "Analytics & Reporting — F-0906" },
                    { 55, "CAP-10", "F-1001", true, "صفحة الهبوط", "Public Presence — F-1001" },
                    { 56, "CAP-10", "F-1002", true, "صفحة دليل المدربين", "Public Presence — F-1002" },
                    { 57, "CAP-10", "F-1003", true, "موافقة الظهور", "Public Presence — F-1003" },
                    { 58, "CAP-10", "F-1004", true, "الملف العام", "Public Presence — F-1004" }
                });

            migrationBuilder.InsertData(
                table: "REFERENCE_LIST",
                columns: new[] { "list_code", "is_editable", "name_ar", "name_en" },
                values: new object[] { "centre", true, "المراكز", "Centres" });

            migrationBuilder.InsertData(
                table: "ROLE",
                columns: new[] { "role_id", "code", "description_ar", "description_en", "is_system", "name_ar", "name_en" },
                values: new object[,]
                {
                    { 1, "trainer", "يدير ملفه الشخصي، ويتابع طلباته، وإسناداته، ومستحقاته، ويستخدم الخدمات المخصصة له.", "Manages their own profile, applications, engagements and entitlements.", true, "مدرب", "Trainer" },
                    { 2, "staff", "ينفذ العمليات التشغيلية اليومية عبر دورة حياة المدرب: الفرز، والتقييم، والاعتماد، وإدارة الملفات، والإسناد، ومتابعة المستحقات.", "Runs the daily operations across the trainer lifecycle, per the permissions granted.", true, "موظف إدارة المدربين", "Trainer Management staff" },
                    { 3, "manager", "يشرف على أعمال إدارة المدربين، ويملك جميع صلاحيات الموظف، بالإضافة إلى الاعتماد والقرارات الإشرافية.", "Supervises the department; holds every staff permission plus supervisory approvals.", true, "مدير إدارة المدربين", "Trainer Management manager" },
                    { 4, "centre_coordinator", "ينشئ طلبات إسناد المدربين ويتابعها لمركزه، ويراجع حالة الطلبات والتعيينات ضمن نطاق طلبه فقط.", "Raises and tracks assignment requests for their own centre, and sees only their own scope.", true, "منسق مركز", "Centre coordinator" },
                    { 5, "system_administrator", "يدير إعدادات المنصة، والأدوار، والصلاحيات، وقوائم التوجيه، والإعدادات التشغيلية.", "Manages platform settings, roles, permissions, routing lists and operational configuration.", true, "مشرف النظام", "System Administrator" },
                    { 6, "executive", "تطلع على مؤشرات الأداء والتقارير على مستوى المنصة، بصلاحيات القراءة والتصدير فقط دون تنفيذ أي عمليات تشغيلية.", "Reads platform-wide indicators and reports. Read and export only — no operational actions.", true, "الإدارة العليا", "Senior management" }
                });

            migrationBuilder.AddCheckConstraint(
                name: "CK_ROLE_code",
                table: "ROLE",
                sql: "[code] IN ('trainer', 'staff', 'manager', 'centre_coordinator', 'system_administrator', 'executive')");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "CK_ROLE_code",
                table: "ROLE");

            migrationBuilder.DeleteData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 3);

            migrationBuilder.DeleteData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 4);

            migrationBuilder.DeleteData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 5);

            migrationBuilder.DeleteData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 6);

            migrationBuilder.DeleteData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 7);

            migrationBuilder.DeleteData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 8);

            migrationBuilder.DeleteData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 9);

            migrationBuilder.DeleteData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 10);

            migrationBuilder.DeleteData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 11);

            migrationBuilder.DeleteData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 12);

            migrationBuilder.DeleteData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 13);

            migrationBuilder.DeleteData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 14);

            migrationBuilder.DeleteData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 15);

            migrationBuilder.DeleteData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 16);

            migrationBuilder.DeleteData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 17);

            migrationBuilder.DeleteData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 18);

            migrationBuilder.DeleteData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 19);

            migrationBuilder.DeleteData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 20);

            migrationBuilder.DeleteData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 21);

            migrationBuilder.DeleteData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 22);

            migrationBuilder.DeleteData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 23);

            migrationBuilder.DeleteData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 24);

            migrationBuilder.DeleteData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 25);

            migrationBuilder.DeleteData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 26);

            migrationBuilder.DeleteData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 27);

            migrationBuilder.DeleteData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 28);

            migrationBuilder.DeleteData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 29);

            migrationBuilder.DeleteData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 30);

            migrationBuilder.DeleteData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 31);

            migrationBuilder.DeleteData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 32);

            migrationBuilder.DeleteData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 33);

            migrationBuilder.DeleteData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 34);

            migrationBuilder.DeleteData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 35);

            migrationBuilder.DeleteData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 36);

            migrationBuilder.DeleteData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 37);

            migrationBuilder.DeleteData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 38);

            migrationBuilder.DeleteData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 39);

            migrationBuilder.DeleteData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 40);

            migrationBuilder.DeleteData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 41);

            migrationBuilder.DeleteData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 42);

            migrationBuilder.DeleteData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 43);

            migrationBuilder.DeleteData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 44);

            migrationBuilder.DeleteData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 45);

            migrationBuilder.DeleteData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 46);

            migrationBuilder.DeleteData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 47);

            migrationBuilder.DeleteData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 48);

            migrationBuilder.DeleteData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 49);

            migrationBuilder.DeleteData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 50);

            migrationBuilder.DeleteData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 51);

            migrationBuilder.DeleteData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 52);

            migrationBuilder.DeleteData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 53);

            migrationBuilder.DeleteData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 54);

            migrationBuilder.DeleteData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 55);

            migrationBuilder.DeleteData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 56);

            migrationBuilder.DeleteData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 57);

            migrationBuilder.DeleteData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 58);

            migrationBuilder.DeleteData(
                table: "REFERENCE_LIST",
                keyColumn: "list_code",
                keyValue: "centre");

            migrationBuilder.DeleteData(
                table: "ROLE",
                keyColumn: "role_id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "ROLE",
                keyColumn: "role_id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "ROLE",
                keyColumn: "role_id",
                keyValue: 3);

            migrationBuilder.DeleteData(
                table: "ROLE",
                keyColumn: "role_id",
                keyValue: 4);

            migrationBuilder.DeleteData(
                table: "ROLE",
                keyColumn: "role_id",
                keyValue: 5);

            migrationBuilder.DeleteData(
                table: "ROLE",
                keyColumn: "role_id",
                keyValue: 6);

            migrationBuilder.DropColumn(
                name: "description_ar",
                table: "ROLE");

            migrationBuilder.DropColumn(
                name: "description_en",
                table: "ROLE");

            migrationBuilder.DropColumn(
                name: "label_needs_verification",
                table: "PERMISSION");

            migrationBuilder.AddCheckConstraint(
                name: "CK_ROLE_code",
                table: "ROLE",
                sql: "[code] IN ('trainer', 'staff', 'manager', 'centre_coordinator', 'sysadmin', 'executive')");
        }
    }
}
