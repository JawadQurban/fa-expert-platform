using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ExpertHub.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class M13FeatureNames : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 1,
                columns: new[] { "name_ar", "name_en" },
                values: new object[] { "تقديم طلب انضمام", "Submit a join application" });

            migrationBuilder.UpdateData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 2,
                columns: new[] { "name_ar", "name_en" },
                values: new object[] { "ترشيح متقدّم من داخل الأكاديمية", "Nominate an applicant internally" });

            migrationBuilder.UpdateData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 3,
                columns: new[] { "name_ar", "name_en" },
                values: new object[] { "طلب إضافة خدمة", "Request an added service" });

            migrationBuilder.UpdateData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 4,
                columns: new[] { "name_ar", "name_en" },
                values: new object[] { "إدخال بيانات متقدّم نيابةً عنه", "Enter applicant details on their behalf" });

            migrationBuilder.UpdateData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 5,
                columns: new[] { "name_ar", "name_en" },
                values: new object[] { "الفرز الأولي للطلبات", "Initial application screening" });

            migrationBuilder.UpdateData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 6,
                columns: new[] { "name_ar", "name_en" },
                values: new object[] { "جدولة المقابلات", "Schedule interviews" });

            migrationBuilder.UpdateData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 7,
                column: "name_en",
                value: "Evaluate an interview");

            migrationBuilder.UpdateData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 8,
                columns: new[] { "name_ar", "name_en" },
                values: new object[] { "قرار لجنة الاعتماد", "Accreditation committee decision" });

            migrationBuilder.UpdateData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 9,
                columns: new[] { "name_ar", "name_en" },
                values: new object[] { "إدارة سير الاعتماد", "Manage the approval sequence" });

            migrationBuilder.UpdateData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 10,
                columns: new[] { "name_ar", "name_en" },
                values: new object[] { "استقبال توقيع المتقدّم", "Receive the applicant’s signature" });

            migrationBuilder.UpdateData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 11,
                columns: new[] { "name_ar", "name_en" },
                values: new object[] { "إعداد الاتفاقية وتفعيلها", "Prepare and activate an agreement" });

            migrationBuilder.UpdateData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 12,
                columns: new[] { "name_ar", "name_en" },
                values: new object[] { "تنبيهات قرب انتهاء الاتفاقية", "Agreement expiry alerts" });

            migrationBuilder.UpdateData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 13,
                columns: new[] { "name_ar", "name_en" },
                values: new object[] { "تجديد الاتفاقية إداريًا", "Renew an agreement administratively" });

            migrationBuilder.UpdateData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 14,
                columns: new[] { "name_ar", "name_en" },
                values: new object[] { "تعليق الاتفاقية أو إنهاؤها", "Suspend or end an agreement" });

            migrationBuilder.UpdateData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 15,
                columns: new[] { "name_ar", "name_en" },
                values: new object[] { "إلحاق خدمة جديدة بالاتفاقية", "Add a service to an agreement" });

            migrationBuilder.UpdateData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 16,
                columns: new[] { "name_ar", "name_en" },
                values: new object[] { "إنشاء ملف المدرب", "Create a trainer profile" });

            migrationBuilder.UpdateData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 17,
                columns: new[] { "name_ar", "name_en" },
                values: new object[] { "عرض الملف الشامل للمدرب", "View the full trainer profile" });

            migrationBuilder.UpdateData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 18,
                columns: new[] { "name_ar", "name_en" },
                values: new object[] { "تحديث المدرب لبياناته", "Trainer self-service updates" });

            migrationBuilder.UpdateData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 19,
                columns: new[] { "name_ar", "name_en" },
                values: new object[] { "إدارة الخدمات المعتمدة", "Manage accredited services" });

            migrationBuilder.UpdateData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 20,
                columns: new[] { "name_ar", "name_en" },
                values: new object[] { "عرض سجل البرامج المنفّذة", "View delivered programme history" });

            migrationBuilder.UpdateData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 21,
                columns: new[] { "name_ar", "name_en" },
                values: new object[] { "عرض تقييمات المدرب", "View trainer ratings" });

            migrationBuilder.UpdateData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 22,
                columns: new[] { "name_ar", "name_en" },
                values: new object[] { "عرض طلبات المدربين", "View trainers’ applications" });

            migrationBuilder.UpdateData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 23,
                columns: new[] { "name_ar", "name_en" },
                values: new object[] { "عرض بيانات المدرب الأساسية", "View core trainer data" });

            migrationBuilder.UpdateData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 24,
                columns: new[] { "name_ar", "name_en" },
                values: new object[] { "كشف تعارض الارتباطات", "Detect engagement conflicts" });

            migrationBuilder.UpdateData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 25,
                columns: new[] { "name_ar", "name_en" },
                values: new object[] { "البحث في قاعدة المدربين", "Search the trainer base" });

            migrationBuilder.UpdateData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 26,
                columns: new[] { "name_ar", "name_en" },
                values: new object[] { "ضبط حالة ملف المدرب", "Set a trainer’s file status" });

            migrationBuilder.UpdateData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 27,
                columns: new[] { "name_ar", "name_en" },
                values: new object[] { "تغذية محرك المطابقة ببيانات الملف", "Feed the matching engine from the profile" });

            migrationBuilder.UpdateData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 28,
                columns: new[] { "name_ar", "name_en" },
                values: new object[] { "إدارة سجل المدرب لدى الأكاديمية", "Manage the trainer’s Academy record" });

            migrationBuilder.UpdateData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 29,
                columns: new[] { "name_ar", "name_en" },
                values: new object[] { "إنشاء طلب إسناد", "Raise an assignment request" });

            migrationBuilder.UpdateData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 30,
                columns: new[] { "name_ar", "name_en" },
                values: new object[] { "الترشيح الآلي للمدربين", "Automatic candidate matching" });

            migrationBuilder.UpdateData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 31,
                columns: new[] { "name_ar", "name_en" },
                values: new object[] { "البحث اليدوي وترشيح المدربين", "Search and nominate candidates manually" });

            migrationBuilder.UpdateData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 32,
                columns: new[] { "name_ar", "name_en" },
                values: new object[] { "موافقة المركز على المرشحين", "Centre approval of candidates" });

            migrationBuilder.UpdateData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 33,
                columns: new[] { "name_ar", "name_en" },
                values: new object[] { "إدارة عروض الإسناد", "Manage assignment offers" });

            migrationBuilder.UpdateData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 34,
                columns: new[] { "name_ar", "name_en" },
                values: new object[] { "رفع المادة التدريبية واعتمادها", "Upload and approve training material" });

            migrationBuilder.UpdateData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 35,
                columns: new[] { "name_ar", "name_en" },
                values: new object[] { "متابعة تنفيذ الارتباط", "Follow up engagement execution" });

            migrationBuilder.UpdateData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 36,
                columns: new[] { "name_ar", "name_en" },
                values: new object[] { "إلغاء ارتباط مدرب", "De-link a trainer from an engagement" });

            migrationBuilder.UpdateData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 37,
                columns: new[] { "name_ar", "name_en" },
                values: new object[] { "عرض مستحقاتي", "View my entitlements" });

            migrationBuilder.UpdateData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 38,
                columns: new[] { "name_ar", "name_en" },
                values: new object[] { "عرض مستحقات المدربين", "View trainers’ entitlements" });

            migrationBuilder.UpdateData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 39,
                columns: new[] { "name_ar", "name_en" },
                values: new object[] { "ربط المستحق بالاتفاقية والبرنامج", "Link an entitlement to its agreement and programme" });

            migrationBuilder.UpdateData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 40,
                columns: new[] { "name_ar", "name_en" },
                values: new object[] { "استقبال الإشعارات عبر القنوات", "Receive notifications across channels" });

            migrationBuilder.UpdateData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 41,
                columns: new[] { "name_ar", "name_en" },
                values: new object[] { "إدارة مصفوفة الإشعارات", "Manage the notification matrix" });

            migrationBuilder.UpdateData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 42,
                columns: new[] { "name_ar", "name_en" },
                values: new object[] { "إدارة قوالب الرسائل", "Manage message templates" });

            migrationBuilder.UpdateData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 43,
                columns: new[] { "name_ar", "name_en" },
                values: new object[] { "إدارة المهل الزمنية", "Manage deadlines" });

            migrationBuilder.UpdateData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 44,
                columns: new[] { "name_ar", "name_en" },
                values: new object[] { "عرض سجل الإشعارات", "View the notification log" });

            migrationBuilder.UpdateData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 45,
                columns: new[] { "name_ar", "name_en" },
                values: new object[] { "إدارة مصفوفة الصلاحيات", "Manage the permission matrix" });

            migrationBuilder.UpdateData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 46,
                columns: new[] { "name_ar", "name_en" },
                values: new object[] { "إسناد الأدوار للمستخدمين", "Assign roles to users" });

            migrationBuilder.UpdateData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 47,
                columns: new[] { "name_ar", "name_en" },
                values: new object[] { "عرض سجل التدقيق", "View the audit log" });

            migrationBuilder.UpdateData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 48,
                columns: new[] { "name_ar", "name_en" },
                values: new object[] { "إدارة الحساب الشخصي", "Manage your own account" });

            migrationBuilder.UpdateData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 49,
                columns: new[] { "name_ar", "name_en" },
                values: new object[] { "لوحة مؤشرات إدارة المدربين", "Trainer-management dashboard" });

            migrationBuilder.UpdateData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 50,
                columns: new[] { "name_ar", "name_en" },
                values: new object[] { "لوحة مؤشرات المدير", "Manager dashboard" });

            migrationBuilder.UpdateData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 51,
                columns: new[] { "name_ar", "name_en" },
                values: new object[] { "لوحة مؤشرات منسق المركز", "Centre coordinator dashboard" });

            migrationBuilder.UpdateData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 52,
                column: "name_en",
                value: "Executive dashboard");

            migrationBuilder.UpdateData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 53,
                columns: new[] { "name_ar", "name_en" },
                values: new object[] { "التقارير الدورية القابلة للتصدير", "Exportable periodic reports" });

            migrationBuilder.UpdateData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 54,
                columns: new[] { "name_ar", "name_en" },
                values: new object[] { "المؤشرات الشخصية للمدرب", "A trainer’s personal metrics" });

            migrationBuilder.UpdateData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 55,
                columns: new[] { "name_ar", "name_en" },
                values: new object[] { "صفحة الهبوط العامة", "Public landing page" });

            migrationBuilder.UpdateData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 56,
                columns: new[] { "name_ar", "name_en" },
                values: new object[] { "دليل المدربين العام", "Public trainer directory" });

            migrationBuilder.UpdateData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 57,
                columns: new[] { "name_ar", "name_en" },
                values: new object[] { "موافقة المدرب على الظهور العام", "Trainer consent to public listing" });

            migrationBuilder.UpdateData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 58,
                columns: new[] { "name_ar", "name_en" },
                values: new object[] { "الملف العام للمدرب", "Public trainer profile" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 1,
                columns: new[] { "name_ar", "name_en" },
                values: new object[] { "تقديم طلب", "Application Management — F-0101" });

            migrationBuilder.UpdateData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 2,
                columns: new[] { "name_ar", "name_en" },
                values: new object[] { "الترشيح", "Application Management — F-0102" });

            migrationBuilder.UpdateData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 3,
                columns: new[] { "name_ar", "name_en" },
                values: new object[] { "طلب إضافة", "Application Management — F-0104" });

            migrationBuilder.UpdateData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 4,
                columns: new[] { "name_ar", "name_en" },
                values: new object[] { "إدخال بيانات", "Application Management — F-0105" });

            migrationBuilder.UpdateData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 5,
                columns: new[] { "name_ar", "name_en" },
                values: new object[] { "الفرز الأولي", "Screening & Evaluation — F-0201" });

            migrationBuilder.UpdateData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 6,
                columns: new[] { "name_ar", "name_en" },
                values: new object[] { "جدولة المقابلة", "Screening & Evaluation — F-0202" });

            migrationBuilder.UpdateData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 7,
                column: "name_en",
                value: "Screening & Evaluation — F-0203");

            migrationBuilder.UpdateData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 8,
                columns: new[] { "name_ar", "name_en" },
                values: new object[] { "قرار لجنة", "Screening & Evaluation — F-0204" });

            migrationBuilder.UpdateData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 9,
                columns: new[] { "name_ar", "name_en" },
                values: new object[] { "سير اعتماد", "Screening & Evaluation — F-0205" });

            migrationBuilder.UpdateData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 10,
                columns: new[] { "name_ar", "name_en" },
                values: new object[] { "توقيع المتقدم", "Screening & Evaluation — F-0206" });

            migrationBuilder.UpdateData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 11,
                columns: new[] { "name_ar", "name_en" },
                values: new object[] { "تفعيل الاتفاقية", "Agreement & Contract — F-0301" });

            migrationBuilder.UpdateData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 12,
                columns: new[] { "name_ar", "name_en" },
                values: new object[] { "تنبيهات الانتهاء", "Agreement & Contract — F-0302" });

            migrationBuilder.UpdateData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 13,
                columns: new[] { "name_ar", "name_en" },
                values: new object[] { "التجديد الإداري", "Agreement & Contract — F-0303" });

            migrationBuilder.UpdateData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 14,
                columns: new[] { "name_ar", "name_en" },
                values: new object[] { "ضبط حالة الاتفاقية", "Agreement & Contract — F-0304" });

            migrationBuilder.UpdateData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 15,
                columns: new[] { "name_ar", "name_en" },
                values: new object[] { "إلحاق خدمة جديدة", "Agreement & Contract — F-0305" });

            migrationBuilder.UpdateData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 16,
                columns: new[] { "name_ar", "name_en" },
                values: new object[] { "إنشاء ملف", "Trainer Profile — F-0401" });

            migrationBuilder.UpdateData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 17,
                columns: new[] { "name_ar", "name_en" },
                values: new object[] { "الملف الشامل", "Trainer Profile — F-0402" });

            migrationBuilder.UpdateData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 18,
                columns: new[] { "name_ar", "name_en" },
                values: new object[] { "التحديث الذاتي", "Trainer Profile — F-0403" });

            migrationBuilder.UpdateData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 19,
                columns: new[] { "name_ar", "name_en" },
                values: new object[] { "الخدمات", "Trainer Profile — F-0404" });

            migrationBuilder.UpdateData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 20,
                columns: new[] { "name_ar", "name_en" },
                values: new object[] { "سجل البرامج", "Trainer Profile — F-0405" });

            migrationBuilder.UpdateData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 21,
                columns: new[] { "name_ar", "name_en" },
                values: new object[] { "تقييمات المدرب", "Trainer Profile — F-0406" });

            migrationBuilder.UpdateData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 22,
                columns: new[] { "name_ar", "name_en" },
                values: new object[] { "عرض طلبات", "Trainer Profile — F-0407" });

            migrationBuilder.UpdateData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 23,
                columns: new[] { "name_ar", "name_en" },
                values: new object[] { "عرض بيانات", "Trainer Profile — F-0408" });

            migrationBuilder.UpdateData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 24,
                columns: new[] { "name_ar", "name_en" },
                values: new object[] { "كشف تعارض", "Trainer Profile — F-0409" });

            migrationBuilder.UpdateData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 25,
                columns: new[] { "name_ar", "name_en" },
                values: new object[] { "البحث والفلترة", "Trainer Profile — F-0410" });

            migrationBuilder.UpdateData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 26,
                columns: new[] { "name_ar", "name_en" },
                values: new object[] { "حالة ملف", "Trainer Profile — F-0411" });

            migrationBuilder.UpdateData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 27,
                columns: new[] { "name_ar", "name_en" },
                values: new object[] { "تغذية محرك", "Trainer Profile — F-0412" });

            migrationBuilder.UpdateData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 28,
                columns: new[] { "name_ar", "name_en" },
                values: new object[] { "إدارة سجل", "Trainer Profile — F-0413" });

            migrationBuilder.UpdateData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 29,
                columns: new[] { "name_ar", "name_en" },
                values: new object[] { "إنشاء طلب الإسناد", "Assignment & Matching — F-0501" });

            migrationBuilder.UpdateData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 30,
                columns: new[] { "name_ar", "name_en" },
                values: new object[] { "الترشيح الآلي", "Assignment & Matching — F-0502" });

            migrationBuilder.UpdateData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 31,
                columns: new[] { "name_ar", "name_en" },
                values: new object[] { "البحث والترشيح", "Assignment & Matching — F-0503" });

            migrationBuilder.UpdateData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 32,
                columns: new[] { "name_ar", "name_en" },
                values: new object[] { "موافقة المركز", "Assignment & Matching — F-0504" });

            migrationBuilder.UpdateData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 33,
                columns: new[] { "name_ar", "name_en" },
                values: new object[] { "عرض الإسناد", "Assignment & Matching — F-0505" });

            migrationBuilder.UpdateData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 34,
                columns: new[] { "name_ar", "name_en" },
                values: new object[] { "رفع واعتماد مادة", "Assignment & Matching — F-0506" });

            migrationBuilder.UpdateData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 35,
                columns: new[] { "name_ar", "name_en" },
                values: new object[] { "متابعة الارتباط", "Assignment & Matching — F-0507" });

            migrationBuilder.UpdateData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 36,
                columns: new[] { "name_ar", "name_en" },
                values: new object[] { "إلغاء الارتباط من", "Assignment & Matching — F-0508" });

            migrationBuilder.UpdateData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 37,
                columns: new[] { "name_ar", "name_en" },
                values: new object[] { "عرض المستحقات", "Entitlement Management — F-0601" });

            migrationBuilder.UpdateData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 38,
                columns: new[] { "name_ar", "name_en" },
                values: new object[] { "عرض المستحقات", "Entitlement Management — F-0602" });

            migrationBuilder.UpdateData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 39,
                columns: new[] { "name_ar", "name_en" },
                values: new object[] { "ربط المستحق", "Entitlement Management — F-0603" });

            migrationBuilder.UpdateData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 40,
                columns: new[] { "name_ar", "name_en" },
                values: new object[] { "الإشعارات متعددة", "Communication — F-0701" });

            migrationBuilder.UpdateData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 41,
                columns: new[] { "name_ar", "name_en" },
                values: new object[] { "إدارة مصفوفة", "Communication — F-0702" });

            migrationBuilder.UpdateData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 42,
                columns: new[] { "name_ar", "name_en" },
                values: new object[] { "إدارة القوالب", "Communication — F-0703" });

            migrationBuilder.UpdateData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 43,
                columns: new[] { "name_ar", "name_en" },
                values: new object[] { "شاشة إدارة المهل", "Communication — F-0704" });

            migrationBuilder.UpdateData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 44,
                columns: new[] { "name_ar", "name_en" },
                values: new object[] { "سجل الإشعارات", "Communication — F-0705" });

            migrationBuilder.UpdateData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 45,
                columns: new[] { "name_ar", "name_en" },
                values: new object[] { "مصفوفة الصلاحيات", "Access & Permissions — F-0801" });

            migrationBuilder.UpdateData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 46,
                columns: new[] { "name_ar", "name_en" },
                values: new object[] { "إدارة المستخدمين", "Access & Permissions — F-0802" });

            migrationBuilder.UpdateData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 47,
                columns: new[] { "name_ar", "name_en" },
                values: new object[] { "سجل التدقيق", "Access & Permissions — F-0805" });

            migrationBuilder.UpdateData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 48,
                columns: new[] { "name_ar", "name_en" },
                values: new object[] { "إدارة الحساب الذاتي", "Access & Permissions — F-0806" });

            migrationBuilder.UpdateData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 49,
                columns: new[] { "name_ar", "name_en" },
                values: new object[] { "لوحة مؤشرات", "Analytics & Reporting — F-0901" });

            migrationBuilder.UpdateData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 50,
                columns: new[] { "name_ar", "name_en" },
                values: new object[] { "لوحة مؤشرات", "Analytics & Reporting — F-0902" });

            migrationBuilder.UpdateData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 51,
                columns: new[] { "name_ar", "name_en" },
                values: new object[] { "لوحة مؤشرات", "Analytics & Reporting — F-0903" });

            migrationBuilder.UpdateData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 52,
                column: "name_en",
                value: "Analytics & Reporting — F-0904");

            migrationBuilder.UpdateData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 53,
                columns: new[] { "name_ar", "name_en" },
                values: new object[] { "التقارير الدورية", "Analytics & Reporting — F-0905" });

            migrationBuilder.UpdateData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 54,
                columns: new[] { "name_ar", "name_en" },
                values: new object[] { "المؤشرات الشخصية", "Analytics & Reporting — F-0906" });

            migrationBuilder.UpdateData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 55,
                columns: new[] { "name_ar", "name_en" },
                values: new object[] { "صفحة الهبوط", "Public Presence — F-1001" });

            migrationBuilder.UpdateData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 56,
                columns: new[] { "name_ar", "name_en" },
                values: new object[] { "صفحة دليل المدربين", "Public Presence — F-1002" });

            migrationBuilder.UpdateData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 57,
                columns: new[] { "name_ar", "name_en" },
                values: new object[] { "موافقة الظهور", "Public Presence — F-1003" });

            migrationBuilder.UpdateData(
                table: "PERMISSION",
                keyColumn: "permission_id",
                keyValue: 58,
                columns: new[] { "name_ar", "name_en" },
                values: new object[] { "الملف العام", "Public Presence — F-1004" });
        }
    }
}
