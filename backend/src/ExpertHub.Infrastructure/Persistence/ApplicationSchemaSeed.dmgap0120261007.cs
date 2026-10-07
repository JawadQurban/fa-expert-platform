using ExpertHub.Core.Domain;

namespace ExpertHub.Infrastructure.Persistence;

/// <summary>
/// The application form map, version <c>dm-gap-01.2026-10-07</c>.
/// </summary>
/// <remarks>
/// ⚠️ GENERATED — do not edit by hand. Produced by
/// <c>frontend/scripts/extract-application-schema.mjs</c>, which EVALUATES
/// <c>applicationSchema.ts</c> (the form's single source of truth) rather than
/// retyping it, so the object the browser renders and the rows the API serves
/// are the same bytes.
///
/// A published version is history (<c>BR-0103</c>): this file is never edited
/// once its migration ships. A change to the form writes a NEW version beside
/// it, and every draft and application keeps the version it was answered
/// against.
/// </remarks>
internal static class ApplicationSchemadmgap0120261007
{
    internal const string Version = FormSchemaVersions.Current;

    internal static readonly object Schema = new
    {
        SchemaVersion = Version,
        Status = FormSchemaStatuses.Published,
        SelectableServices = "[\"trainer\",\"consultant\",\"content-developer\",\"question-writer\"]",
        PublishedAt = (DateTime?)new DateTime(2026, 10, 7, 0, 0, 0, DateTimeKind.Utc),
    };

    internal static readonly object[] Sections =
    [
        new
        {
            SectionId = new Guid("f5000000-0000-0000-0007-000000000001"),
            SchemaVersion = Version,
            SectionCode = "personal",
            TitleAr = "المعلومات الأساسية",
            TitleEn = "Basic information",
            OrderIndex = 1,
            Repeatable = (string?)null,
        },
        new
        {
            SectionId = new Guid("f5000000-0000-0000-0007-000000000002"),
            SchemaVersion = Version,
            SectionCode = "education",
            TitleAr = "المؤهلات العلمية",
            TitleEn = "Educational qualifications",
            OrderIndex = 2,
            Repeatable = "{\"minEntries\":1,\"addLabelAr\":\"+ إضافة مؤهل\",\"addLabelEn\":\"+ Add qualification\",\"entryLabelAr\":\"المؤهل\",\"entryLabelEn\":\"Qualification\"}",
        },
        new
        {
            SectionId = new Guid("f5000000-0000-0000-0007-000000000003"),
            SchemaVersion = Version,
            SectionCode = "certifications",
            TitleAr = "الشهادات المهنية",
            TitleEn = "Professional certifications",
            OrderIndex = 3,
            Repeatable = "{\"minEntries\":0,\"addLabelAr\":\"+ إضافة شهادة\",\"addLabelEn\":\"+ Add certificate\",\"entryLabelAr\":\"الشهادة\",\"entryLabelEn\":\"Certificate\"}",
        },
        new
        {
            SectionId = new Guid("f5000000-0000-0000-0007-000000000004"),
            SchemaVersion = Version,
            SectionCode = "experience",
            TitleAr = "الخبرة العملية",
            TitleEn = "Practical experience",
            OrderIndex = 4,
            Repeatable = "{\"minEntries\":1,\"addLabelAr\":\"+ إضافة خبرة\",\"addLabelEn\":\"+ Add experience\",\"entryLabelAr\":\"الخبرة\",\"entryLabelEn\":\"Experience\"}",
        },
        new
        {
            SectionId = new Guid("f5000000-0000-0000-0007-000000000005"),
            SchemaVersion = Version,
            SectionCode = "training-content",
            TitleAr = "الخبرة التدريبية والمحتوى",
            TitleEn = "Training experience & content",
            OrderIndex = 5,
            Repeatable = (string?)null,
        },
        new
        {
            SectionId = new Guid("f5000000-0000-0000-0007-000000000006"),
            SchemaVersion = Version,
            SectionCode = "availability",
            TitleAr = "الجاهزية والإتاحة",
            TitleEn = "Availability & readiness",
            OrderIndex = 6,
            Repeatable = (string?)null,
        },
    ];

    internal static readonly object[] Fields =
    [
        new
        {
            FieldId = new Guid("ff000000-0000-0000-0007-000000000001"),
            SchemaVersion = Version,
            FieldCode = "firstNameAr",
            SectionCode = "personal",
            LabelAr = "الاسم الأول (بالعربية)",
            LabelEn = "First name (Arabic)",
            InputType = "text",
            OrderIndex = 1,
            Definition = "{\"id\":\"firstNameAr\",\"type\":\"text\",\"sectionId\":\"personal\",\"labelAr\":\"الاسم الأول (بالعربية)\",\"labelEn\":\"First name (Arabic)\",\"requiredFor\":[\"trainer\",\"consultant\",\"content-developer\",\"question-writer\"],\"ownership\":\"sso-profile\",\"order\":1}",
        },
        new
        {
            FieldId = new Guid("ff000000-0000-0000-0007-000000000002"),
            SchemaVersion = Version,
            FieldCode = "middleNameAr",
            SectionCode = "personal",
            LabelAr = "الاسم الثاني (بالعربية)",
            LabelEn = "Middle name (Arabic)",
            InputType = "text",
            OrderIndex = 2,
            Definition = "{\"id\":\"middleNameAr\",\"type\":\"text\",\"sectionId\":\"personal\",\"labelAr\":\"الاسم الثاني (بالعربية)\",\"labelEn\":\"Middle name (Arabic)\",\"requiredFor\":[\"trainer\",\"consultant\",\"content-developer\",\"question-writer\"],\"ownership\":\"sso-profile\",\"order\":2}",
        },
        new
        {
            FieldId = new Guid("ff000000-0000-0000-0007-000000000003"),
            SchemaVersion = Version,
            FieldCode = "thirdNameAr",
            SectionCode = "personal",
            LabelAr = "الاسم الثالث (بالعربية)",
            LabelEn = "Third name (Arabic)",
            InputType = "text",
            OrderIndex = 3,
            Definition = "{\"id\":\"thirdNameAr\",\"type\":\"text\",\"sectionId\":\"personal\",\"labelAr\":\"الاسم الثالث (بالعربية)\",\"labelEn\":\"Third name (Arabic)\",\"requiredFor\":[\"trainer\",\"consultant\",\"content-developer\",\"question-writer\"],\"ownership\":\"sso-profile\",\"order\":3}",
        },
        new
        {
            FieldId = new Guid("ff000000-0000-0000-0007-000000000004"),
            SchemaVersion = Version,
            FieldCode = "lastNameAr",
            SectionCode = "personal",
            LabelAr = "الاسم الأخير (بالعربية)",
            LabelEn = "Last name (Arabic)",
            InputType = "text",
            OrderIndex = 4,
            Definition = "{\"id\":\"lastNameAr\",\"type\":\"text\",\"sectionId\":\"personal\",\"labelAr\":\"الاسم الأخير (بالعربية)\",\"labelEn\":\"Last name (Arabic)\",\"requiredFor\":[\"trainer\",\"consultant\",\"content-developer\",\"question-writer\"],\"ownership\":\"sso-profile\",\"order\":4}",
        },
        new
        {
            FieldId = new Guid("ff000000-0000-0000-0007-000000000005"),
            SchemaVersion = Version,
            FieldCode = "firstNameEn",
            SectionCode = "personal",
            LabelAr = "الاسم الأول (بالإنجليزية)",
            LabelEn = "First name (English)",
            InputType = "text",
            OrderIndex = 5,
            Definition = "{\"id\":\"firstNameEn\",\"type\":\"text\",\"sectionId\":\"personal\",\"labelAr\":\"الاسم الأول (بالإنجليزية)\",\"labelEn\":\"First name (English)\",\"requiredFor\":[\"trainer\",\"consultant\",\"content-developer\",\"question-writer\"],\"ownership\":\"sso-profile\",\"order\":5}",
        },
        new
        {
            FieldId = new Guid("ff000000-0000-0000-0007-000000000006"),
            SchemaVersion = Version,
            FieldCode = "middleNameEn",
            SectionCode = "personal",
            LabelAr = "الاسم الثاني (بالإنجليزية)",
            LabelEn = "Middle name (English)",
            InputType = "text",
            OrderIndex = 6,
            Definition = "{\"id\":\"middleNameEn\",\"type\":\"text\",\"sectionId\":\"personal\",\"labelAr\":\"الاسم الثاني (بالإنجليزية)\",\"labelEn\":\"Middle name (English)\",\"requiredFor\":[\"trainer\",\"consultant\",\"content-developer\",\"question-writer\"],\"ownership\":\"sso-profile\",\"order\":6}",
        },
        new
        {
            FieldId = new Guid("ff000000-0000-0000-0007-000000000007"),
            SchemaVersion = Version,
            FieldCode = "thirdNameEn",
            SectionCode = "personal",
            LabelAr = "الاسم الثالث (بالإنجليزية)",
            LabelEn = "Third name (English)",
            InputType = "text",
            OrderIndex = 7,
            Definition = "{\"id\":\"thirdNameEn\",\"type\":\"text\",\"sectionId\":\"personal\",\"labelAr\":\"الاسم الثالث (بالإنجليزية)\",\"labelEn\":\"Third name (English)\",\"requiredFor\":[\"trainer\",\"consultant\",\"content-developer\",\"question-writer\"],\"ownership\":\"sso-profile\",\"order\":7}",
        },
        new
        {
            FieldId = new Guid("ff000000-0000-0000-0007-000000000008"),
            SchemaVersion = Version,
            FieldCode = "lastNameEn",
            SectionCode = "personal",
            LabelAr = "الاسم الأخير (بالإنجليزية)",
            LabelEn = "Last name (English)",
            InputType = "text",
            OrderIndex = 8,
            Definition = "{\"id\":\"lastNameEn\",\"type\":\"text\",\"sectionId\":\"personal\",\"labelAr\":\"الاسم الأخير (بالإنجليزية)\",\"labelEn\":\"Last name (English)\",\"requiredFor\":[\"trainer\",\"consultant\",\"content-developer\",\"question-writer\"],\"ownership\":\"sso-profile\",\"order\":8}",
        },
        new
        {
            FieldId = new Guid("ff000000-0000-0000-0007-000000000009"),
            SchemaVersion = Version,
            FieldCode = "idNumber",
            SectionCode = "personal",
            LabelAr = "رقم الهوية الوطنية / هوية مقيم / جواز السفر",
            LabelEn = "National ID / Iqama / passport number",
            InputType = "text",
            OrderIndex = 9,
            Definition = "{\"id\":\"idNumber\",\"type\":\"text\",\"sectionId\":\"personal\",\"labelAr\":\"رقم الهوية الوطنية / هوية مقيم / جواز السفر\",\"labelEn\":\"National ID / Iqama / passport number\",\"requiredFor\":[\"trainer\",\"consultant\",\"content-developer\",\"question-writer\"],\"ownership\":\"sso-profile\",\"validation\":{\"maxLength\":20,\"pattern\":\"^(?:[12][0-9]{9}|[A-Za-z][A-Za-z0-9]{5,19})$\",\"patternMessageAr\":\"أدخل رقم هوية أو إقامة من 10 أرقام يبدأ بـ 1 أو 2، أو رقم جواز سفر صحيحًا.\",\"patternMessageEn\":\"Enter a 10-digit National ID or Iqama starting with 1 or 2, or a valid passport number.\"},\"order\":9}",
        },
        new
        {
            FieldId = new Guid("ff000000-0000-0000-0007-000000000010"),
            SchemaVersion = Version,
            FieldCode = "dateOfBirth",
            SectionCode = "personal",
            LabelAr = "تاريخ الميلاد",
            LabelEn = "Date of birth",
            InputType = "date",
            OrderIndex = 10,
            Definition = "{\"id\":\"dateOfBirth\",\"type\":\"date\",\"sectionId\":\"personal\",\"labelAr\":\"تاريخ الميلاد\",\"labelEn\":\"Date of birth\",\"requiredFor\":[\"trainer\",\"consultant\",\"content-developer\",\"question-writer\"],\"ownership\":\"sso-profile\",\"validation\":{\"maxDate\":\"today\"},\"order\":10}",
        },
        new
        {
            FieldId = new Guid("ff000000-0000-0000-0007-000000000011"),
            SchemaVersion = Version,
            FieldCode = "nationality",
            SectionCode = "personal",
            LabelAr = "الجنسية",
            LabelEn = "Nationality",
            InputType = "select",
            OrderIndex = 11,
            Definition = "{\"id\":\"nationality\",\"type\":\"select\",\"sectionId\":\"personal\",\"labelAr\":\"الجنسية\",\"labelEn\":\"Nationality\",\"requiredFor\":[\"trainer\",\"consultant\",\"content-developer\",\"question-writer\"],\"options\":[{\"value\":\"sa\",\"labelAr\":\"السعودية\",\"labelEn\":\"Saudi Arabia\"},{\"value\":\"gcc\",\"labelAr\":\"دول مجلس التعاون\",\"labelEn\":\"GCC countries\"},{\"value\":\"other\",\"labelAr\":\"أخرى\",\"labelEn\":\"Other\"}],\"ownership\":\"sso-profile\",\"order\":11}",
        },
        new
        {
            FieldId = new Guid("ff000000-0000-0000-0007-000000000012"),
            SchemaVersion = Version,
            FieldCode = "gender",
            SectionCode = "personal",
            LabelAr = "الجنس",
            LabelEn = "Gender",
            InputType = "select",
            OrderIndex = 12,
            Definition = "{\"id\":\"gender\",\"type\":\"select\",\"sectionId\":\"personal\",\"labelAr\":\"الجنس\",\"labelEn\":\"Gender\",\"requiredFor\":[\"trainer\",\"consultant\",\"content-developer\",\"question-writer\"],\"options\":[{\"value\":\"male\",\"labelAr\":\"ذكر\",\"labelEn\":\"Male\"},{\"value\":\"female\",\"labelAr\":\"أنثى\",\"labelEn\":\"Female\"}],\"ownership\":\"sso-profile\",\"order\":12}",
        },
        new
        {
            FieldId = new Guid("ff000000-0000-0000-0007-000000000013"),
            SchemaVersion = Version,
            FieldCode = "sector",
            SectionCode = "personal",
            LabelAr = "القطاع",
            LabelEn = "Sector",
            InputType = "select",
            OrderIndex = 13,
            Definition = "{\"id\":\"sector\",\"type\":\"select\",\"sectionId\":\"personal\",\"labelAr\":\"القطاع\",\"labelEn\":\"Sector\",\"requiredFor\":[\"trainer\",\"consultant\",\"content-developer\",\"question-writer\"],\"options\":[{\"value\":\"finance\",\"labelAr\":\"التمويل\",\"labelEn\":\"Finance\"},{\"value\":\"insurance\",\"labelAr\":\"التأمين\",\"labelEn\":\"Insurance\"},{\"value\":\"banking\",\"labelAr\":\"البنوك\",\"labelEn\":\"Banking\"},{\"value\":\"capital-market\",\"labelAr\":\"الأوراق المالية\",\"labelEn\":\"Capital market\"}],\"ownership\":\"expert-hub\",\"order\":12.5}",
        },
        new
        {
            FieldId = new Guid("ff000000-0000-0000-0007-000000000014"),
            SchemaVersion = Version,
            FieldCode = "domain",
            SectionCode = "personal",
            LabelAr = "المجال",
            LabelEn = "Field / domain",
            InputType = "select",
            OrderIndex = 14,
            Definition = "{\"id\":\"domain\",\"type\":\"select\",\"sectionId\":\"personal\",\"labelAr\":\"المجال\",\"labelEn\":\"Field / domain\",\"helpAr\":\"المجال العام للمتقدم (مالية، تدريب، تقنية...).\",\"helpEn\":\"The applicant’s general field (finance, training, technical…).\",\"requiredFor\":[\"trainer\",\"consultant\",\"content-developer\",\"question-writer\"],\"options\":[{\"value\":\"dom-001\",\"labelAr\":\"تقنية معلومات وادارة وقيادة\",\"labelEn\":\"تقنية معلومات وادارة وقيادة\"},{\"value\":\"dom-002\",\"labelAr\":\"خدمة العملاء والمبيعات\",\"labelEn\":\"خدمة العملاء والمبيعات\"},{\"value\":\"dom-003\",\"labelAr\":\"التحليل المالي والتمويل\",\"labelEn\":\"التحليل المالي والتمويل\"},{\"value\":\"dom-004\",\"labelAr\":\"مجالات الحوكمة والاستدامة المالية وتقديم الاستشارات.\",\"labelEn\":\"مجالات الحوكمة والاستدامة المالية وتقديم الاستشارات.\"},{\"value\":\"dom-005\",\"labelAr\":\"مجالات الذكاء الاصطناعي، الأمن السيبراني، وتحليل البيانات\",\"labelEn\":\"مجالات الذكاء الاصطناعي، الأمن السيبراني، وتحليل البيانات\"},{\"value\":\"dom-006\",\"labelAr\":\"البنوك والتمويل\",\"labelEn\":\"البنوك والتمويل\"},{\"value\":\"dom-007\",\"labelAr\":\"المالية لغير الماليين\",\"labelEn\":\"المالية لغير الماليين\"},{\"value\":\"dom-008\",\"labelAr\":\"الموارد البشرية\",\"labelEn\":\"الموارد البشرية\"},{\"value\":\"dom-009\",\"labelAr\":\"المحاسبة المالية والشراكات بين القطاعين العام والخاص (PPP)\",\"labelEn\":\"المحاسبة المالية والشراكات بين القطاعين العام والخاص (PPP)\"},{\"value\":\"dom-010\",\"labelAr\":\"التأمين\",\"labelEn\":\"التأمين\"},{\"value\":\"dom-012\",\"labelAr\":\"إدارة الأعمال التنفيذية والتدريب القيادي والإبداعي\",\"labelEn\":\"إدارة الأعمال التنفيذية والتدريب القيادي والإبداعي\"},{\"value\":\"dom-013\",\"labelAr\":\"البنوك\",\"labelEn\":\"البنوك\"},{\"value\":\"dom-014\",\"labelAr\":\"إدارة تقنية المعلومات وحوكمة نظم المعلومات\",\"labelEn\":\"إدارة تقنية المعلومات وحوكمة نظم المعلومات\"},{\"value\":\"dom-015\",\"labelAr\":\"القانون\",\"labelEn\":\"القانون\"},{\"value\":\"dom-017\",\"labelAr\":\"المحاسبة والضرائب\",\"labelEn\":\"المحاسبة والضرائب\"},{\"value\":\"dom-018\",\"labelAr\":\"المالية والمالية الإسلامية\",\"labelEn\":\"المالية والمالية الإسلامية\"},{\"value\":\"dom-019\",\"labelAr\":\"الترجمة وإدارة المشاريع والتطوير الشخصي\",\"labelEn\":\"الترجمة وإدارة المشاريع والتطوير الشخصي\"},{\"value\":\"dom-020\",\"labelAr\":\"الاقتصاد وإدارة المخاطر المصرفية\",\"labelEn\":\"الاقتصاد وإدارة المخاطر المصرفية\"},{\"value\":\"dom-021\",\"labelAr\":\"التحقيق القانوني والتقاضي\",\"labelEn\":\"التحقيق القانوني والتقاضي\"},{\"value\":\"dom-022\",\"labelAr\":\"القيادة وإدارة الأعمال العالمية\",\"labelEn\":\"القيادة وإدارة الأعمال العالمية\"},{\"value\":\"dom-023\",\"labelAr\":\"الأوراق المالية\",\"labelEn\":\"الأوراق المالية\"},{\"value\":\"dom-024\",\"labelAr\":\"الاقتصاد وإدارة الأعمال المصرفية\",\"labelEn\":\"الاقتصاد وإدارة الأعمال المصرفية\"},{\"value\":\"dom-025\",\"labelAr\":\"القطاع المالي والاستثماري والحوكمة المؤسسية\",\"labelEn\":\"القطاع المالي والاستثماري والحوكمة المؤسسية\"},{\"value\":\"dom-026\",\"labelAr\":\"إدارة الأعمال وتطوير الأعمال وإدارة المشاريع\",\"labelEn\":\"إدارة الأعمال وتطوير الأعمال وإدارة المشاريع\"},{\"value\":\"dom-027\",\"labelAr\":\"التأمين وإدارة الأعمال والقيادة\",\"labelEn\":\"التأمين وإدارة الأعمال والقيادة\"},{\"value\":\"dom-028\",\"labelAr\":\"التدريب والتطوير المهني\",\"labelEn\":\"التدريب والتطوير المهني\"},{\"value\":\"dom-030\",\"labelAr\":\"أمن المعلومات وتقنية المعلومات\",\"labelEn\":\"أمن المعلومات وتقنية المعلومات\"},{\"value\":\"dom-031\",\"labelAr\":\"القطاع المالي والإداري.\",\"labelEn\":\"القطاع المالي والإداري.\"},{\"value\":\"dom-033\",\"labelAr\":\"القطاع المالي والإداري – تخصص في الأعمال الإلكترونية، المحاسبة، والحوكمة المؤسسية.\",\"labelEn\":\"القطاع المالي والإداري – تخصص في الأعمال الإلكترونية، المحاسبة، والحوكمة المؤسسية.\"},{\"value\":\"dom-034\",\"labelAr\":\"أمن المعلومات وشبكات الحاسب\",\"labelEn\":\"أمن المعلومات وشبكات الحاسب\"},{\"value\":\"dom-036\",\"labelAr\":\"خدمة العملاء\",\"labelEn\":\"خدمة العملاء\"},{\"value\":\"dom-038\",\"labelAr\":\"الذكاء الاصطناعي\",\"labelEn\":\"الذكاء الاصطناعي\"},{\"value\":\"dom-040\",\"labelAr\":\"التنمية البشرية والتطوير القيادي وجودة الحياة.\",\"labelEn\":\"التنمية البشرية والتطوير القيادي وجودة الحياة.\"},{\"value\":\"dom-041\",\"labelAr\":\"التحكيم التجاري وإدارة النزاعات.\",\"labelEn\":\"التحكيم التجاري وإدارة النزاعات.\"},{\"value\":\"dom-043\",\"labelAr\":\"المحاسبة الحكومية\",\"labelEn\":\"المحاسبة الحكومية\"},{\"value\":\"dom-044\",\"labelAr\":\"القطاع المالي والأكاديمي.\",\"labelEn\":\"القطاع المالي والأكاديمي.\"},{\"value\":\"dom-045\",\"labelAr\":\"القانون والقضاء والتحكيم.\",\"labelEn\":\"القانون والقضاء والتحكيم.\"},{\"value\":\"dom-046\",\"labelAr\":\"تحليل القوائم المالية و المالية لغير الماليين\",\"labelEn\":\"تحليل القوائم المالية و المالية لغير الماليين\"},{\"value\":\"dom-047\",\"labelAr\":\"المالية والمصرفية وإدارة المخاطر والامتثال\",\"labelEn\":\"المالية والمصرفية وإدارة المخاطر والامتثال\"},{\"value\":\"dom-048\",\"labelAr\":\"إدارة الموارد البشرية والتطوير القيادي\",\"labelEn\":\"إدارة الموارد البشرية والتطوير القيادي\"},{\"value\":\"dom-049\",\"labelAr\":\"المدفوعات الرقمية والمحافظ الإلكترونية\",\"labelEn\":\"المدفوعات الرقمية والمحافظ الإلكترونية\"},{\"value\":\"dom-050\",\"labelAr\":\"المحاسبة والتدقيق الاستراتيجي والتدريب المهني\",\"labelEn\":\"المحاسبة والتدقيق الاستراتيجي والتدريب المهني\"},{\"value\":\"dom-051\",\"labelAr\":\"الاستثمار المالي\",\"labelEn\":\"الاستثمار المالي\"},{\"value\":\"dom-052\",\"labelAr\":\"المهارات الشخصية والابتكار\",\"labelEn\":\"المهارات الشخصية والابتكار\"},{\"value\":\"dom-053\",\"labelAr\":\"الاقتصاد والتمويل الإسلامي\",\"labelEn\":\"الاقتصاد والتمويل الإسلامي\"},{\"value\":\"dom-054\",\"labelAr\":\"الاستثمار\",\"labelEn\":\"الاستثمار\"},{\"value\":\"dom-055\",\"labelAr\":\"إدارة المحافظ\",\"labelEn\":\"إدارة المحافظ\"},{\"value\":\"dom-056\",\"labelAr\":\"الاحتيال والأمن السيبراني\",\"labelEn\":\"الاحتيال والأمن السيبراني\"},{\"value\":\"dom-057\",\"labelAr\":\"المالية الشخصية والتخطيط المالي.\",\"labelEn\":\"المالية الشخصية والتخطيط المالي.\"},{\"value\":\"dom-058\",\"labelAr\":\"حوكمة الشركات\",\"labelEn\":\"حوكمة الشركات\"},{\"value\":\"dom-059\",\"labelAr\":\"الإدارة والتطوير الشخصي والمهني.\",\"labelEn\":\"الإدارة والتطوير الشخصي والمهني.\"},{\"value\":\"dom-060\",\"labelAr\":\"الطرح العام للمهنيين\",\"labelEn\":\"الطرح العام للمهنيين\"},{\"value\":\"dom-061\",\"labelAr\":\"المالية والإدارة والمراجعة الداخلية.\",\"labelEn\":\"المالية والإدارة والمراجعة الداخلية.\"},{\"value\":\"dom-062\",\"labelAr\":\"المحاسبة والتمويل / التقييم المالي والمحاسبي\",\"labelEn\":\"المحاسبة والتمويل / التقييم المالي والمحاسبي\"},{\"value\":\"dom-063\",\"labelAr\":\"التأمين وإدارة المخاطر والتدريب المهني\",\"labelEn\":\"التأمين وإدارة المخاطر والتدريب المهني\"},{\"value\":\"dom-064\",\"labelAr\":\"مشتريات الحكومية\",\"labelEn\":\"مشتريات الحكومية\"},{\"value\":\"dom-065\",\"labelAr\":\"الإدارة الاستراتيجية وتطوير الأداء والتدريب القيادي\",\"labelEn\":\"الإدارة الاستراتيجية وتطوير الأداء والتدريب القيادي\"},{\"value\":\"dom-066\",\"labelAr\":\"الإدارة وإدارة الأعمال.\",\"labelEn\":\"الإدارة وإدارة الأعمال.\"},{\"value\":\"dom-067\",\"labelAr\":\"الإدارة المالية\",\"labelEn\":\"الإدارة المالية\"},{\"value\":\"dom-068\",\"labelAr\":\"غسل الأموال وتمويل الإرهاب\",\"labelEn\":\"غسل الأموال وتمويل الإرهاب\"},{\"value\":\"dom-069\",\"labelAr\":\"نظم الإدارة والجودة\",\"labelEn\":\"نظم الإدارة والجودة\"},{\"value\":\"dom-070\",\"labelAr\":\"الاستثمار وإدارة الأصول.\",\"labelEn\":\"الاستثمار وإدارة الأصول.\"},{\"value\":\"dom-071\",\"labelAr\":\"المالية والمراجعة الداخلية والمحاسبة الاحترافية.\",\"labelEn\":\"المالية والمراجعة الداخلية والمحاسبة الاحترافية.\"},{\"value\":\"dom-072\",\"labelAr\":\"إدارة المحافظ العقارية\",\"labelEn\":\"إدارة المحافظ العقارية\"},{\"value\":\"dom-073\",\"labelAr\":\"المحاسبة والإدارة المالية.\",\"labelEn\":\"المحاسبة والإدارة المالية.\"},{\"value\":\"dom-074\",\"labelAr\":\"المبيعات والتسويق وتطوير الأعمال\",\"labelEn\":\"المبيعات والتسويق وتطوير الأعمال\"},{\"value\":\"dom-077\",\"labelAr\":\"المصرفية الإسلامية\",\"labelEn\":\"المصرفية الإسلامية\"},{\"value\":\"dom-078\",\"labelAr\":\"المحاسبة والتحليل المالي\",\"labelEn\":\"المحاسبة والتحليل المالي\"},{\"value\":\"dom-079\",\"labelAr\":\"الإدارة المالية والاقتصاد\",\"labelEn\":\"الإدارة المالية والاقتصاد\"},{\"value\":\"dom-080\",\"labelAr\":\"الاستثمار والأسواق المالية\",\"labelEn\":\"الاستثمار والأسواق المالية\"},{\"value\":\"dom-081\",\"labelAr\":\"المخاطر التشغيلية\",\"labelEn\":\"المخاطر التشغيلية\"},{\"value\":\"dom-082\",\"labelAr\":\"المهارات الإدارية والسلوكية\",\"labelEn\":\"المهارات الإدارية والسلوكية\"},{\"value\":\"dom-083\",\"labelAr\":\"الإدارة المالية والبنوك والتدريب\",\"labelEn\":\"الإدارة المالية والبنوك والتدريب\"},{\"value\":\"dom-084\",\"labelAr\":\"الامتثال ومكافحة الجرائم المالية\",\"labelEn\":\"الامتثال ومكافحة الجرائم المالية\"},{\"value\":\"dom-085\",\"labelAr\":\"أمن المعلومات وحوكمة تقنية المعلومات\",\"labelEn\":\"أمن المعلومات وحوكمة تقنية المعلومات\"},{\"value\":\"dom-086\",\"labelAr\":\"تقنية المعلومات والأمن السيبراني.\",\"labelEn\":\"تقنية المعلومات والأمن السيبراني.\"},{\"value\":\"dom-087\",\"labelAr\":\"الحوكمة\",\"labelEn\":\"الحوكمة\"},{\"value\":\"dom-088\",\"labelAr\":\"العلاقات العامة والإدارة المالية والاستثمار.\",\"labelEn\":\"العلاقات العامة والإدارة المالية والاستثمار.\"},{\"value\":\"dom-089\",\"labelAr\":\"الإدارة، القيادة، وتطوير الكفاءات البشرية.\",\"labelEn\":\"الإدارة، القيادة، وتطوير الكفاءات البشرية.\"},{\"value\":\"dom-090\",\"labelAr\":\"الاستثمار وإدارة الأصول والإدارة الحكومية.\",\"labelEn\":\"الاستثمار وإدارة الأصول والإدارة الحكومية.\"},{\"value\":\"dom-091\",\"labelAr\":\"سلاسل الإمداد وإدارة العمليات\",\"labelEn\":\"سلاسل الإمداد وإدارة العمليات\"},{\"value\":\"dom-092\",\"labelAr\":\"إدارة المخاطر\",\"labelEn\":\"إدارة المخاطر\"},{\"value\":\"dom-093\",\"labelAr\":\"المالية الإسلامية، القضاء الشرعي، والتدريب الأكاديمي.\",\"labelEn\":\"المالية الإسلامية، القضاء الشرعي، والتدريب الأكاديمي.\"},{\"value\":\"dom-094\",\"labelAr\":\"المالية، إدارة الأعمال، والتأمين.\",\"labelEn\":\"المالية، إدارة الأعمال، والتأمين.\"},{\"value\":\"dom-095\",\"labelAr\":\"التنمية البشرية والتطوير المؤسسي.\",\"labelEn\":\"التنمية البشرية والتطوير المؤسسي.\"},{\"value\":\"dom-097\",\"labelAr\":\"التمويل والمحاسبة والتحليل المالي\",\"labelEn\":\"التمويل والمحاسبة والتحليل المالي\"},{\"value\":\"dom-098\",\"labelAr\":\"تقنية المعلومات والتدريب.\",\"labelEn\":\"تقنية المعلومات والتدريب.\"},{\"value\":\"dom-099\",\"labelAr\":\"القانون، الاستشارات المهنية، والتطوير القيادي.\",\"labelEn\":\"القانون، الاستشارات المهنية، والتطوير القيادي.\"},{\"value\":\"dom-100\",\"labelAr\":\"المالية\",\"labelEn\":\"المالية\"},{\"value\":\"dom-101\",\"labelAr\":\"الذكاء الاصطناعي وعلوم البيانات\",\"labelEn\":\"الذكاء الاصطناعي وعلوم البيانات\"},{\"value\":\"dom-102\",\"labelAr\":\"الموارد البشرية وإدارة المشاريع.\",\"labelEn\":\"الموارد البشرية وإدارة المشاريع.\"},{\"value\":\"dom-103\",\"labelAr\":\"إدارة الأعمال والحوكمة المالية.\",\"labelEn\":\"إدارة الأعمال والحوكمة المالية.\"},{\"value\":\"dom-104\",\"labelAr\":\"المشتقات المالية\",\"labelEn\":\"المشتقات المالية\"},{\"value\":\"dom-105\",\"labelAr\":\"التمويل والمصارف والأسواق المالية\",\"labelEn\":\"التمويل والمصارف والأسواق المالية\"},{\"value\":\"dom-106\",\"labelAr\":\"إدارة الأعمال والحوكمة وإدارة المشاريع\",\"labelEn\":\"إدارة الأعمال والحوكمة وإدارة المشاريع\"},{\"value\":\"dom-107\",\"labelAr\":\"القيادة للقطاع المالي والمشرعين\",\"labelEn\":\"القيادة للقطاع المالي والمشرعين\"},{\"value\":\"dom-108\",\"labelAr\":\"التأمين وإدارة المخاطر والخدمات التأمينية\",\"labelEn\":\"التأمين وإدارة المخاطر والخدمات التأمينية\"},{\"value\":\"dom-109\",\"labelAr\":\"إدارة الأعمال والموارد البشرية.\",\"labelEn\":\"إدارة الأعمال والموارد البشرية.\"},{\"value\":\"dom-110\",\"labelAr\":\"المهارات الشخصية والقيادة\",\"labelEn\":\"المهارات الشخصية والقيادة\"},{\"value\":\"dom-111\",\"labelAr\":\"التقنية المالية\",\"labelEn\":\"التقنية المالية\"},{\"value\":\"dom-112\",\"labelAr\":\"التحقيقات المالية ومكافحة غسل الأموال وتمويل الإرهاب (AML/CFT)\",\"labelEn\":\"التحقيقات المالية ومكافحة غسل الأموال وتمويل الإرهاب (AML/CFT)\"},{\"value\":\"dom-113\",\"labelAr\":\"الحوكمة والاستدامة\",\"labelEn\":\"الحوكمة والاستدامة\"},{\"value\":\"dom-114\",\"labelAr\":\"المهارات الاحترافية وخدمة العملاء في قطاع التأمين\",\"labelEn\":\"المهارات الاحترافية وخدمة العملاء في قطاع التأمين\"},{\"value\":\"dom-115\",\"labelAr\":\"التحليل المالي وإدارة الاستثمارات\",\"labelEn\":\"التحليل المالي وإدارة الاستثمارات\"},{\"value\":\"dom-116\",\"labelAr\":\"التمويل والمصارف والخدمات الائتمانية\",\"labelEn\":\"التمويل والمصارف والخدمات الائتمانية\"},{\"value\":\"dom-117\",\"labelAr\":\"إدارة الجودة والتطوير المؤسسي.\",\"labelEn\":\"إدارة الجودة والتطوير المؤسسي.\"},{\"value\":\"dom-118\",\"labelAr\":\"المصرفية\",\"labelEn\":\"المصرفية\"},{\"value\":\"dom-119\",\"labelAr\":\"الإدارة، الجودة، التخطيط الاستراتيجي، وتطوير المهارات القيادية والمهنية\",\"labelEn\":\"الإدارة، الجودة، التخطيط الاستراتيجي، وتطوير المهارات القيادية والمهنية\"},{\"value\":\"dom-120\",\"labelAr\":\"إدارة الأعمال وسلسلة الإمداد والتمويل.\",\"labelEn\":\"إدارة الأعمال وسلسلة الإمداد والتمويل.\"},{\"value\":\"dom-121\",\"labelAr\":\"التمويل التجاري\",\"labelEn\":\"التمويل التجاري\"},{\"value\":\"dom-123\",\"labelAr\":\"المهارات القيادية والاحترافية والتواصل\",\"labelEn\":\"المهارات القيادية والاحترافية والتواصل\"},{\"value\":\"dom-124\",\"labelAr\":\"ضريبة القيمة المضافة\",\"labelEn\":\"ضريبة القيمة المضافة\"},{\"value\":\"dom-125\",\"labelAr\":\"الوعي المالي\",\"labelEn\":\"الوعي المالي\"},{\"value\":\"dom-126\",\"labelAr\":\"إدارة الاعمال\",\"labelEn\":\"إدارة الاعمال\"},{\"value\":\"dom-127\",\"labelAr\":\"تطوير الذات والإدارة الشخصية\",\"labelEn\":\"تطوير الذات والإدارة الشخصية\"},{\"value\":\"dom-128\",\"labelAr\":\"السلوك المهني\",\"labelEn\":\"السلوك المهني\"},{\"value\":\"dom-129\",\"labelAr\":\"الحوكمة وإدارة المخاطر ومكافحة الجرائم المالية\",\"labelEn\":\"الحوكمة وإدارة المخاطر ومكافحة الجرائم المالية\"},{\"value\":\"dom-130\",\"labelAr\":\"القانون المالي والجنائي للشركات\",\"labelEn\":\"القانون المالي والجنائي للشركات\"},{\"value\":\"dom-131\",\"labelAr\":\"المحاسبة والمالية الاحترافية.\",\"labelEn\":\"المحاسبة والمالية الاحترافية.\"},{\"value\":\"dom-132\",\"labelAr\":\"المهارات المهنية\",\"labelEn\":\"المهارات المهنية\"},{\"value\":\"dom-133\",\"labelAr\":\"القانون وأنظمة التشريع.\",\"labelEn\":\"القانون وأنظمة التشريع.\"},{\"value\":\"dom-134\",\"labelAr\":\"مكافحة غسل الأموال وتمويل الارهاب\",\"labelEn\":\"مكافحة غسل الأموال وتمويل الارهاب\"},{\"value\":\"dom-135\",\"labelAr\":\"القوائم المالية\",\"labelEn\":\"القوائم المالية\"},{\"value\":\"dom-136\",\"labelAr\":\"محاسبة\",\"labelEn\":\"محاسبة\"},{\"value\":\"dom-137\",\"labelAr\":\"المهارات الاحترافية والتواصل والمبيعات\",\"labelEn\":\"المهارات الاحترافية والتواصل والمبيعات\"},{\"value\":\"dom-138\",\"labelAr\":\"المالية وإدارة المخاطر.\",\"labelEn\":\"المالية وإدارة المخاطر.\"},{\"value\":\"dom-140\",\"labelAr\":\"استمرارية العمل\",\"labelEn\":\"استمرارية العمل\"},{\"value\":\"dom-141\",\"labelAr\":\"وعي مالي\",\"labelEn\":\"وعي مالي\"},{\"value\":\"dom-142\",\"labelAr\":\"التدريب وعلوم البيانات\",\"labelEn\":\"التدريب وعلوم البيانات\"},{\"value\":\"dom-143\",\"labelAr\":\"إدارة الأعمال والتدريب الاحترافي.\",\"labelEn\":\"إدارة الأعمال والتدريب الاحترافي.\"},{\"value\":\"dom-144\",\"labelAr\":\"الفنتك\",\"labelEn\":\"الفنتك\"},{\"value\":\"dom-145\",\"labelAr\":\"إدارة المشاريع\",\"labelEn\":\"إدارة المشاريع\"},{\"value\":\"dom-146\",\"labelAr\":\"التأمين، الامتثال، ومكافحة الجرائم المالية في قطاع التأمين\",\"labelEn\":\"التأمين، الامتثال، ومكافحة الجرائم المالية في قطاع التأمين\"},{\"value\":\"dom-147\",\"labelAr\":\"إدارة الأعمال والتأمين الدولي.\",\"labelEn\":\"إدارة الأعمال والتأمين الدولي.\"},{\"value\":\"other\",\"labelAr\":\"أخرى\",\"labelEn\":\"Other\"}],\"ownership\":\"expert-hub\",\"order\":13}",
        },
        new
        {
            FieldId = new Guid("ff000000-0000-0000-0007-000000000015"),
            SchemaVersion = Version,
            FieldCode = "domainOther",
            SectionCode = "personal",
            LabelAr = "المجال (أخرى)",
            LabelEn = "Field / domain (other)",
            InputType = "text",
            OrderIndex = 15,
            Definition = "{\"id\":\"domainOther\",\"type\":\"text\",\"sectionId\":\"personal\",\"labelAr\":\"المجال (أخرى)\",\"labelEn\":\"Field / domain (other)\",\"helpAr\":\"اكتب مجالك إن لم يكن في القائمة.\",\"helpEn\":\"Name your field if it is not in the list.\",\"requiredFor\":[\"trainer\",\"consultant\",\"content-developer\",\"question-writer\"],\"dependsOn\":{\"fieldId\":\"domain\",\"equals\":\"other\"},\"ownership\":\"expert-hub\",\"order\":13.1}",
        },
        new
        {
            FieldId = new Guid("ff000000-0000-0000-0007-000000000016"),
            SchemaVersion = Version,
            FieldCode = "linkedin",
            SectionCode = "personal",
            LabelAr = "حساب LinkedIn",
            LabelEn = "LinkedIn profile",
            InputType = "text",
            OrderIndex = 16,
            Definition = "{\"id\":\"linkedin\",\"type\":\"text\",\"sectionId\":\"personal\",\"labelAr\":\"حساب LinkedIn\",\"labelEn\":\"LinkedIn profile\",\"requiredFor\":[],\"validation\":{\"pattern\":\"^https?://\\\\S+$\",\"patternMessageAr\":\"أدخل رابطًا صحيحًا يبدأ بـ http:// أو https://\",\"patternMessageEn\":\"Enter a valid link starting with http:// or https://\"},\"ownership\":\"expert-hub\",\"order\":14}",
        },
        new
        {
            FieldId = new Guid("ff000000-0000-0000-0007-000000000017"),
            SchemaVersion = Version,
            FieldCode = "personalWebsite",
            SectionCode = "personal",
            LabelAr = "الموقع الشخصي",
            LabelEn = "Personal website",
            InputType = "text",
            OrderIndex = 17,
            Definition = "{\"id\":\"personalWebsite\",\"type\":\"text\",\"sectionId\":\"personal\",\"labelAr\":\"الموقع الشخصي\",\"labelEn\":\"Personal website\",\"requiredFor\":[],\"validation\":{\"pattern\":\"^https?://\\\\S+$\",\"patternMessageAr\":\"أدخل رابطًا صحيحًا يبدأ بـ http:// أو https://\",\"patternMessageEn\":\"Enter a valid link starting with http:// or https://\"},\"ownership\":\"expert-hub\",\"order\":15}",
        },
        new
        {
            FieldId = new Guid("ff000000-0000-0000-0007-000000000018"),
            SchemaVersion = Version,
            FieldCode = "qualificationType",
            SectionCode = "education",
            LabelAr = "المؤهل",
            LabelEn = "Qualification",
            InputType = "select",
            OrderIndex = 18,
            Definition = "{\"id\":\"qualificationType\",\"type\":\"select\",\"sectionId\":\"education\",\"labelAr\":\"المؤهل\",\"labelEn\":\"Qualification\",\"requiredFor\":[\"trainer\",\"consultant\",\"content-developer\",\"question-writer\"],\"options\":[{\"value\":\"diploma\",\"labelAr\":\"دبلوم\",\"labelEn\":\"Diploma\"},{\"value\":\"bachelor\",\"labelAr\":\"بكالوريوس\",\"labelEn\":\"Bachelor\"},{\"value\":\"master\",\"labelAr\":\"ماجستير\",\"labelEn\":\"Master\"},{\"value\":\"doctorate\",\"labelAr\":\"دكتوراه\",\"labelEn\":\"PhD\"}],\"ownership\":\"expert-hub\",\"order\":1}",
        },
        new
        {
            FieldId = new Guid("ff000000-0000-0000-0007-000000000019"),
            SchemaVersion = Version,
            FieldCode = "generalSpecialization",
            SectionCode = "education",
            LabelAr = "التخصص العام",
            LabelEn = "General specialization",
            InputType = "text",
            OrderIndex = 19,
            Definition = "{\"id\":\"generalSpecialization\",\"type\":\"text\",\"sectionId\":\"education\",\"labelAr\":\"التخصص العام\",\"labelEn\":\"General specialization\",\"requiredFor\":[\"trainer\",\"consultant\",\"content-developer\",\"question-writer\"],\"ownership\":\"expert-hub\",\"order\":2}",
        },
        new
        {
            FieldId = new Guid("ff000000-0000-0000-0007-000000000020"),
            SchemaVersion = Version,
            FieldCode = "specializationDetail",
            SectionCode = "education",
            LabelAr = "التخصص",
            LabelEn = "Specialization",
            InputType = "select",
            OrderIndex = 20,
            Definition = "{\"id\":\"specializationDetail\",\"type\":\"select\",\"sectionId\":\"education\",\"labelAr\":\"التخصص\",\"labelEn\":\"Specialization\",\"requiredFor\":[\"trainer\",\"consultant\",\"content-developer\",\"question-writer\"],\"options\":[{\"value\":\"spec-001\",\"labelAr\":\"إدارة الأعمال\",\"labelEn\":\"Business Administration\"},{\"value\":\"spec-002\",\"labelAr\":\"المحاسبة\",\"labelEn\":\"Accounting\"},{\"value\":\"spec-003\",\"labelAr\":\"العلاقات العامة\",\"labelEn\":\"Public Relations\"},{\"value\":\"spec-004\",\"labelAr\":\"التمويل والاستثمار\",\"labelEn\":\"Finance and Investment\"},{\"value\":\"spec-005\",\"labelAr\":\"الأسواق المالية والأوراق المالية\",\"labelEn\":\"Financial Markets and Securities\"},{\"value\":\"spec-006\",\"labelAr\":\"التأمين وإدارة المخاطر\",\"labelEn\":\"Insurance and Risk Management\"},{\"value\":\"spec-007\",\"labelAr\":\"المصرفية والعمل المصرفي\",\"labelEn\":\"Banking\"},{\"value\":\"spec-008\",\"labelAr\":\"الاقتصاد\",\"labelEn\":\"Economics\"},{\"value\":\"spec-009\",\"labelAr\":\"التسويق\",\"labelEn\":\"Marketing\"},{\"value\":\"spec-010\",\"labelAr\":\"نظم المعلومات الإدارية\",\"labelEn\":\"Management Information Systems\"},{\"value\":\"spec-011\",\"labelAr\":\"إدارة الموارد البشرية\",\"labelEn\":\"Human Resources Management\"},{\"value\":\"spec-012\",\"labelAr\":\"ريادة الأعمال\",\"labelEn\":\"Entrepreneurship\"},{\"value\":\"spec-013\",\"labelAr\":\"القيادة الاستراتيجية\",\"labelEn\":\"Strategic Leadership\"},{\"value\":\"spec-014\",\"labelAr\":\"إدارة المشاريع\",\"labelEn\":\"Project Management\"},{\"value\":\"spec-015\",\"labelAr\":\"التطوير التنظيمي والموارد البشرية\",\"labelEn\":\"Organizational Development and Human Resources\"},{\"value\":\"spec-016\",\"labelAr\":\"الأنظمة (القانون)\",\"labelEn\":\"Law (Regulations)\"},{\"value\":\"spec-017\",\"labelAr\":\"الأنظمة التجارية\",\"labelEn\":\"Commercial Regulations\"},{\"value\":\"spec-018\",\"labelAr\":\"علوم الحاسب\",\"labelEn\":\"Computer Science\"},{\"value\":\"spec-019\",\"labelAr\":\"تقنية المعلومات\",\"labelEn\":\"Information Technology\"},{\"value\":\"spec-020\",\"labelAr\":\"هندسة البرمجيات\",\"labelEn\":\"Software Engineering\"},{\"value\":\"spec-021\",\"labelAr\":\"الأمن السيبراني\",\"labelEn\":\"Cybersecurity\"},{\"value\":\"spec-022\",\"labelAr\":\"الذكاء الاصطناعي وعلم البيانات\",\"labelEn\":\"Artificial Intelligence and Data Science\"},{\"value\":\"spec-023\",\"labelAr\":\"الرياضيات والإحصاء\",\"labelEn\":\"Mathematics and Statistics\"},{\"value\":\"spec-024\",\"labelAr\":\"أخرى*\",\"labelEn\":\"Others*\"},{\"value\":\"spec-025\",\"labelAr\":\"*عند اختيار اخرى تتيح للخبير أو المدرب كتابة التخصص\",\"labelEn\":\"*عند اختيار اخرى تتيح للخبير أو المدرب كتابة التخصص\"}],\"ownership\":\"expert-hub\",\"order\":3}",
        },
        new
        {
            FieldId = new Guid("ff000000-0000-0000-0007-000000000021"),
            SchemaVersion = Version,
            FieldCode = "universityName",
            SectionCode = "education",
            LabelAr = "اسم الجامعة",
            LabelEn = "University name",
            InputType = "select",
            OrderIndex = 21,
            Definition = "{\"id\":\"universityName\",\"type\":\"select\",\"sectionId\":\"education\",\"labelAr\":\"اسم الجامعة\",\"labelEn\":\"University name\",\"requiredFor\":[\"trainer\",\"consultant\",\"content-developer\",\"question-writer\"],\"options\":[{\"value\":\"uni-001\",\"labelAr\":\"جامعة الملك سعود\",\"labelEn\":\"King Saud University\"},{\"value\":\"uni-002\",\"labelAr\":\"جامعة الإمام محمد بن سعود الإسلامية\",\"labelEn\":\"Imam Muhammad ibn Saud Islamic University\"},{\"value\":\"uni-003\",\"labelAr\":\"جامعة الأميرة نورة بنت عبدالرحمن\",\"labelEn\":\"Princess Nourah bint Abdulrahman University\"},{\"value\":\"uni-004\",\"labelAr\":\"جامعة الأمير سطام بن عبدالعزيز\",\"labelEn\":\"Prince Sattam bin Abdulaziz University\"},{\"value\":\"uni-005\",\"labelAr\":\"جامعة شقراء\",\"labelEn\":\"Shaqra University\"},{\"value\":\"uni-006\",\"labelAr\":\"جامعة المجمعة\",\"labelEn\":\"Majmaah University\"},{\"value\":\"uni-007\",\"labelAr\":\"الجامعة السعودية الإلكترونية\",\"labelEn\":\"Saudi Electronic University\"},{\"value\":\"uni-008\",\"labelAr\":\"جامعة الملك عبدالعزيز\",\"labelEn\":\"King Abdulaziz University\"},{\"value\":\"uni-009\",\"labelAr\":\"جامعة أم القرى\",\"labelEn\":\"Umm Al-Qura University\"},{\"value\":\"uni-010\",\"labelAr\":\"جامعة جدة\",\"labelEn\":\"University of Jeddah\"},{\"value\":\"uni-011\",\"labelAr\":\"جامعة الطائف\",\"labelEn\":\"Taif University\"},{\"value\":\"uni-012\",\"labelAr\":\"الجامعة الإسلامية\",\"labelEn\":\"The Islamic University of Madinah\"},{\"value\":\"uni-013\",\"labelAr\":\"جامعة طيبة\",\"labelEn\":\"Taibah University\"},{\"value\":\"uni-014\",\"labelAr\":\"جامعة الملك فهد للبترول والمعادن\",\"labelEn\":\"King Fahd University of Petroleum and Minerals\"},{\"value\":\"uni-015\",\"labelAr\":\"جامعة الإمام عبدالرحمن بن فيصل\",\"labelEn\":\"Imam Abdulrahman Bin Faisal University\"},{\"value\":\"uni-016\",\"labelAr\":\"جامعة الملك فيصل\",\"labelEn\":\"King Faisal University\"},{\"value\":\"uni-017\",\"labelAr\":\"جامعة الملك خالد\",\"labelEn\":\"King Khalid University\"},{\"value\":\"uni-018\",\"labelAr\":\"جامعة الباحة\",\"labelEn\":\"Al Baha University\"},{\"value\":\"uni-019\",\"labelAr\":\"جامعة نجران\",\"labelEn\":\"Najran University\"},{\"value\":\"uni-020\",\"labelAr\":\"جامعة جازان\",\"labelEn\":\"Jazan University\"},{\"value\":\"uni-021\",\"labelAr\":\"جامعة القصيم\",\"labelEn\":\"Qassim University\"},{\"value\":\"uni-022\",\"labelAr\":\"جامعة حائل\",\"labelEn\":\"University of Hail\"},{\"value\":\"uni-023\",\"labelAr\":\"جامعة الجوف\",\"labelEn\":\"Jouf University\"},{\"value\":\"uni-024\",\"labelAr\":\"جامعة تبوك\",\"labelEn\":\"University of Tabuk\"},{\"value\":\"uni-025\",\"labelAr\":\"جامعة الحدود الشمالية\",\"labelEn\":\"Northern Border University\"},{\"value\":\"uni-026\",\"labelAr\":\"جامعة الملك سعود بن عبدالعزيز للعلوم الصحية\",\"labelEn\":\"King Saud bin Abdulaziz University for Health Sciences\"},{\"value\":\"uni-027\",\"labelAr\":\"جامعة الملك عبدالله للعلوم والتقنية (كاوست)\",\"labelEn\":\"King Abdullah University of Science and Technology (KAUST)\"},{\"value\":\"uni-028\",\"labelAr\":\"جامعة الأمير سلطان\",\"labelEn\":\"Prince Sultan University\"},{\"value\":\"uni-029\",\"labelAr\":\"جامعة الفيصل\",\"labelEn\":\"Alfaisal University\"},{\"value\":\"uni-030\",\"labelAr\":\"جامعة اليمامة\",\"labelEn\":\"Yamamah University\"},{\"value\":\"uni-031\",\"labelAr\":\"جامعة دار العلوم\",\"labelEn\":\"Dar Al Uloom University\"},{\"value\":\"uni-032\",\"labelAr\":\"جامعة الأمير محمد بن فهد\",\"labelEn\":\"Prince Mohammad Bin Fahd University\"},{\"value\":\"uni-033\",\"labelAr\":\"جامعة الأمير فهد بن سلطان\",\"labelEn\":\"Prince Fahd bin Sultan University\"},{\"value\":\"uni-034\",\"labelAr\":\"جامعة عفت\",\"labelEn\":\"Effat University\"},{\"value\":\"uni-035\",\"labelAr\":\"جامعة دار الحكمة\",\"labelEn\":\"Dar Al-Hekma University\"},{\"value\":\"uni-036\",\"labelAr\":\"جامعة سليمان الراجحي\",\"labelEn\":\"Sulaiman AlRajhi University\"},{\"value\":\"uni-037\",\"labelAr\":\"الجامعة العربية المفتوحة (فرع السعودية)\",\"labelEn\":\"Arab Open University (Saudi Branch)\"},{\"value\":\"uni-038\",\"labelAr\":\"جامعة الفارابي\",\"labelEn\":\"Al-Farabi University College\"},{\"value\":\"uni-039\",\"labelAr\":\"جامعة المدينة العالمية (فرع السعودية)\",\"labelEn\":\"Al-Madinah International University (Saudi Branch)\"},{\"value\":\"uni-040\",\"labelAr\":\"كلية إنجاز\",\"labelEn\":\"Enjaz College\"},{\"value\":\"uni-041\",\"labelAr\":\"جامعة حفر الباطن\",\"labelEn\":\"University of Hafr Al-Batin\"},{\"value\":\"uni-042\",\"labelAr\":\"جامعة الزلفي\",\"labelEn\":\"Al-Zulfi University College\"},{\"value\":\"uni-043\",\"labelAr\":\"جامعة القريات (كلية)\",\"labelEn\":\"Qurayyat University (College)\"},{\"value\":\"uni-044\",\"labelAr\":\"جامعة بيشة\",\"labelEn\":\"University of Bisha\"},{\"value\":\"uni-045\",\"labelAr\":\"الجامعة العربية المفتوحة\",\"labelEn\":\"Arab Open University\"},{\"value\":\"uni-046\",\"labelAr\":\"جامعة الأعمال والتكنولوجيا\",\"labelEn\":\"University of Business and Technology\"},{\"value\":\"uni-047\",\"labelAr\":\"جامعة الأمير مقرن بن عبدالعزيز\",\"labelEn\":\"Prince Muqrin bin Abdulaziz University\"},{\"value\":\"uni-048\",\"labelAr\":\"جامعة رياض العلم\",\"labelEn\":\"Riyadh Elm University\"},{\"value\":\"uni-049\",\"labelAr\":\"جامعة الفيصل – كلية الأمير سلطان للإدارة\",\"labelEn\":\"Alfaisal University – Prince Sultan College of Business\"},{\"value\":\"uni-050\",\"labelAr\":\"كلية ابن رشد للعلوم الإدارية\",\"labelEn\":\"Ibn Rushd College of Management Sciences\"},{\"value\":\"uni-051\",\"labelAr\":\"كلية ابن سينا الأهلية\",\"labelEn\":\"Ibn Sina National College\"},{\"value\":\"uni-052\",\"labelAr\":\"كلية الأمير محمد بن سلمان للإدارة وريادة الأعمال\",\"labelEn\":\"Prince Mohammed bin Salman College for Business and Entrepreneurship\"},{\"value\":\"uni-053\",\"labelAr\":\"كلية الباحة الأهلية للعلوم\",\"labelEn\":\"Al Baha National College of Sciences\"},{\"value\":\"uni-054\",\"labelAr\":\"كلية الحقوق والعلوم الإسلامية بالمدينة المنورة\",\"labelEn\":\"College of Law and Islamic Sciences in Madinah\"},{\"value\":\"uni-055\",\"labelAr\":\"كلية الرؤية بالرياض\",\"labelEn\":\"Al-Ru'ya College in Riyadh\"},{\"value\":\"uni-056\",\"labelAr\":\"كلية الفيحاء الأهلية\",\"labelEn\":\"Al-Faihaa National College\"},{\"value\":\"uni-057\",\"labelAr\":\"كلية جدارة للعلوم الإدارية والإنسانية بحفر الباطن\",\"labelEn\":\"Jadara College of Administrative and Human Sciences in Hafr Al-Batin\"},{\"value\":\"uni-058\",\"labelAr\":\"كلية جدة العالمية الأهلية\",\"labelEn\":\"Jeddah International National College\"},{\"value\":\"uni-059\",\"labelAr\":\"كلية كابسارك للسياسات العامة\",\"labelEn\":\"KAPSARC College of Public Policy\"},{\"value\":\"uni-060\",\"labelAr\":\"كلية مكة الأهلية\",\"labelEn\":\"Makkah National College\"},{\"value\":\"uni-061\",\"labelAr\":\"كلية منار الجنوب للعلوم والتقنية\",\"labelEn\":\"Manar Al-Janoub College of Science and Technology\"},{\"value\":\"uni-062\",\"labelAr\":\"كليات الأصالة الأهلية\",\"labelEn\":\"Al-Asalah National Colleges\"},{\"value\":\"uni-063\",\"labelAr\":\"كليات بريدة الأهلية\",\"labelEn\":\"Buraydah National Colleges\"},{\"value\":\"uni-064\",\"labelAr\":\"كليات الخليج الأهلية\",\"labelEn\":\"Al-Khaleej National Colleges\"},{\"value\":\"uni-065\",\"labelAr\":\"كليات الريان الأهلية بالمدينة المنورة\",\"labelEn\":\"Al-Rayan National Colleges in Madinah\"},{\"value\":\"uni-066\",\"labelAr\":\"كليات الشرق العربي للدراسات العليا\",\"labelEn\":\"Arab East Colleges for Graduate Studies\"},{\"value\":\"uni-067\",\"labelAr\":\"كليات عنيزة الأهلية\",\"labelEn\":\"Unaizah National Colleges\"},{\"value\":\"uni-068\",\"labelAr\":\"جامعة ملبورن\",\"labelEn\":\"University of Melbourne\"},{\"value\":\"uni-069\",\"labelAr\":\"الجامعة الوطنية الأسترالية\",\"labelEn\":\"The Australian National University\"},{\"value\":\"uni-070\",\"labelAr\":\"جامعة غرب أستراليا\",\"labelEn\":\"The University of Western Australia\"},{\"value\":\"uni-071\",\"labelAr\":\"جامعة كوبنهاغن\",\"labelEn\":\"University of Copenhagen\"},{\"value\":\"uni-072\",\"labelAr\":\"جامعة آرهوس\",\"labelEn\":\"The University of Aarhus\"},{\"value\":\"uni-073\",\"labelAr\":\"معهد كارولينسكا\",\"labelEn\":\"Karolinska Institute\"},{\"value\":\"uni-074\",\"labelAr\":\"جامعة أوبسالا\",\"labelEn\":\"University of Uppsala\"},{\"value\":\"uni-075\",\"labelAr\":\"جامعة ستوكهولم\",\"labelEn\":\"Stockholm University\"},{\"value\":\"uni-076\",\"labelAr\":\"جامعة هايدلبرغ\",\"labelEn\":\"Heidelberg University\"},{\"value\":\"uni-077\",\"labelAr\":\"جامعة بون\",\"labelEn\":\"University of Bonn\"},{\"value\":\"uni-078\",\"labelAr\":\"جامعة ميونخ\",\"labelEn\":\"University of Munich\"},{\"value\":\"uni-079\",\"labelAr\":\"جامعة أوسلو\",\"labelEn\":\"The University of Oslo\"},{\"value\":\"uni-080\",\"labelAr\":\"جامعة طوكيو\",\"labelEn\":\"The University of Tokyo\"},{\"value\":\"uni-081\",\"labelAr\":\"جامعة كيوتو\",\"labelEn\":\"Kyoto University\"},{\"value\":\"uni-082\",\"labelAr\":\"جامعة ناغويا\",\"labelEn\":\"Nagoya University\"},{\"value\":\"uni-083\",\"labelAr\":\"جامعة أوساكا\",\"labelEn\":\"Osaka University\"},{\"value\":\"uni-084\",\"labelAr\":\"جامعة هارفارد\",\"labelEn\":\"Harvard University\"},{\"value\":\"uni-085\",\"labelAr\":\"جامعة ستانفورد\",\"labelEn\":\"Stanford University\"},{\"value\":\"uni-086\",\"labelAr\":\"معهد ماساتشوستس للتقنية\",\"labelEn\":\"Massachusetts Institute of Technology\"},{\"value\":\"uni-087\",\"labelAr\":\"جامعة كاليفورنيا - بيركلي\",\"labelEn\":\"University of California - Berkeley\"},{\"value\":\"uni-088\",\"labelAr\":\"جامعة برينستون\",\"labelEn\":\"Princeton University\"},{\"value\":\"uni-089\",\"labelAr\":\"جامعة كولومبيا في مدينة نيويورك\",\"labelEn\":\"Columbia University in the City of New York\"},{\"value\":\"uni-090\",\"labelAr\":\"جامعة شيكاغو\",\"labelEn\":\"University of Chicago\"},{\"value\":\"uni-091\",\"labelAr\":\"جامعة ييل\",\"labelEn\":\"Yale University\"},{\"value\":\"uni-092\",\"labelAr\":\"جامعة كاليفورنيا - لوس أنجلوس\",\"labelEn\":\"University of California - Los Angeles\"},{\"value\":\"uni-093\",\"labelAr\":\"جامعة كورنيل\",\"labelEn\":\"Cornell University\"},{\"value\":\"uni-094\",\"labelAr\":\"جامعة واشنطن - سياتل\",\"labelEn\":\"University of Washington - Seattle\"},{\"value\":\"uni-095\",\"labelAr\":\"جامعة بنسلفانيا\",\"labelEn\":\"University of Pennsylvania\"},{\"value\":\"uni-096\",\"labelAr\":\"جامعة كاليفورنيا - سان فرانسيسكو\",\"labelEn\":\"University of California - San Francisco\"},{\"value\":\"uni-097\",\"labelAr\":\"جامعة ميشيغان - آن أربور\",\"labelEn\":\"University of Michigan - Ann Arbor\"},{\"value\":\"uni-098\",\"labelAr\":\"جامعة ويسكونسن - ماديسون\",\"labelEn\":\"University of Wisconsin - Madison\"},{\"value\":\"uni-099\",\"labelAr\":\"جامعة نيويورك\",\"labelEn\":\"New York University\"},{\"value\":\"uni-100\",\"labelAr\":\"جامعة نورث وسترن\",\"labelEn\":\"Northwestern University\"},{\"value\":\"uni-101\",\"labelAr\":\"جامعة إلينوي في أوربانا شامبين\",\"labelEn\":\"University of Illinois at Urbana Champaign\"},{\"value\":\"uni-102\",\"labelAr\":\"جامعة مينيسوتا - توين سيتيز\",\"labelEn\":\"University of Minnesota - Twin Cities\"},{\"value\":\"uni-103\",\"labelAr\":\"جامعة ديوك\",\"labelEn\":\"Duke University\"},{\"value\":\"uni-104\",\"labelAr\":\"جامعة واشنطن (سانت لويس)\",\"labelEn\":\"Washington University\"},{\"value\":\"uni-105\",\"labelAr\":\"جامعة روكفلر\",\"labelEn\":\"Rockefeller University\"},{\"value\":\"uni-106\",\"labelAr\":\"جامعة كولورادو في بولدر\",\"labelEn\":\"University of Colorado at Boulder\"},{\"value\":\"uni-107\",\"labelAr\":\"جامعة تكساس في أوستن\",\"labelEn\":\"The University of Texas at Austin\"},{\"value\":\"uni-108\",\"labelAr\":\"جامعة كاليفورنيا - سانتا باربارا\",\"labelEn\":\"University of California - Santa Barbara\"},{\"value\":\"uni-109\",\"labelAr\":\"جامعة نورث كارولاينا في تشابل هيل\",\"labelEn\":\"University of North Carolina at Chapel Hill\"},{\"value\":\"uni-110\",\"labelAr\":\"جامعة ميريلاند - كوليدج بارك\",\"labelEn\":\"University of Maryland - College Park\"},{\"value\":\"uni-111\",\"labelAr\":\"جامعة جنوب كاليفورنيا\",\"labelEn\":\"University of Southern California\"},{\"value\":\"uni-112\",\"labelAr\":\"جامعة كاليفورنيا - إيرفاين\",\"labelEn\":\"University of California - Irvine\"},{\"value\":\"uni-113\",\"labelAr\":\"جامعة فاندربيلت\",\"labelEn\":\"Vanderbilt University\"},{\"value\":\"uni-114\",\"labelAr\":\"جامعة كاليفورنيا - ديفيس\",\"labelEn\":\"University of California - Davis\"},{\"value\":\"uni-115\",\"labelAr\":\"جامعة ولاية بنسلفانيا - الحرم الرئيسي\",\"labelEn\":\"Pennsylvania State University - Main Campus\"},{\"value\":\"uni-116\",\"labelAr\":\"جامعة كارنيغي ميلون\",\"labelEn\":\"Carnegie Mellon University\"},{\"value\":\"uni-117\",\"labelAr\":\"جامعة بيردو - الحرم الرئيسي\",\"labelEn\":\"Purdue University - Main Campus\"},{\"value\":\"uni-118\",\"labelAr\":\"جامعة روتجرز - نيو برونزويك\",\"labelEn\":\"Rutgers University - New Brunswick\"},{\"value\":\"uni-119\",\"labelAr\":\"جامعة ولاية أوهايو - الحرم الرئيسي\",\"labelEn\":\"Ohio State University - Main Campus\"},{\"value\":\"uni-120\",\"labelAr\":\"جامعة بيتسبرغ - الحرم الرئيسي\",\"labelEn\":\"University of Pittsburgh - Main Campus\"},{\"value\":\"uni-121\",\"labelAr\":\"جامعة بوسطن\",\"labelEn\":\"Boston University\"},{\"value\":\"uni-122\",\"labelAr\":\"جامعة براون\",\"labelEn\":\"Brown University\"},{\"value\":\"uni-123\",\"labelAr\":\"جامعة فلوريدا\",\"labelEn\":\"University of Florida\"},{\"value\":\"uni-124\",\"labelAr\":\"جامعة رايس\",\"labelEn\":\"Rice University\"},{\"value\":\"uni-125\",\"labelAr\":\"جامعة أريزونا\",\"labelEn\":\"University of Arizona\"},{\"value\":\"uni-126\",\"labelAr\":\"جامعة كاليفورنيا - سانتا كروز\",\"labelEn\":\"University of California - Santa Cruz\"},{\"value\":\"uni-127\",\"labelAr\":\"جامعة يوتا\",\"labelEn\":\"The University of Utah\"},{\"value\":\"uni-128\",\"labelAr\":\"جامعة ولاية ميشيغان\",\"labelEn\":\"Michigan State University\"},{\"value\":\"uni-129\",\"labelAr\":\"جامعة تكساس إيه آند إم - كوليدج ستيشن\",\"labelEn\":\"Texas A & M University - College Station\"},{\"value\":\"uni-130\",\"labelAr\":\"جامعة كيس ويسترن ريزيرف\",\"labelEn\":\"Case Western Reserve University\"},{\"value\":\"uni-131\",\"labelAr\":\"جامعة كامبريدج\",\"labelEn\":\"University of Cambridge\"},{\"value\":\"uni-132\",\"labelAr\":\"جامعة أكسفورد\",\"labelEn\":\"University of Oxford\"},{\"value\":\"uni-133\",\"labelAr\":\"كلية لندن الجامعية\",\"labelEn\":\"University College London\"},{\"value\":\"uni-134\",\"labelAr\":\"جامعة مانشستر\",\"labelEn\":\"University of Manchester\"},{\"value\":\"uni-135\",\"labelAr\":\"جامعة إدنبرة\",\"labelEn\":\"University of Edinburgh\"},{\"value\":\"uni-136\",\"labelAr\":\"كينغز كوليدج لندن\",\"labelEn\":\"King's College London\"},{\"value\":\"uni-137\",\"labelAr\":\"جامعة بريستول\",\"labelEn\":\"University of Bristol\"},{\"value\":\"uni-138\",\"labelAr\":\"جامعة وارويك\",\"labelEn\":\"University of Warwick\"},{\"value\":\"uni-139\",\"labelAr\":\"جامعة غنت\",\"labelEn\":\"Ghent University\"},{\"value\":\"uni-140\",\"labelAr\":\"جامعة لوفان الكاثوليكية\",\"labelEn\":\"Katholieke Universiteit Leuven\"},{\"value\":\"uni-141\",\"labelAr\":\"المعهد الفدرالي السويسري للتقنية في زيورخ\",\"labelEn\":\"Swiss Federal Institute of Technology Zurich\"},{\"value\":\"uni-142\",\"labelAr\":\"جامعة زيورخ\",\"labelEn\":\"University of Zurich\"},{\"value\":\"uni-143\",\"labelAr\":\"جامعة جنيف\",\"labelEn\":\"University of Geneva\"},{\"value\":\"uni-144\",\"labelAr\":\"جامعة بازل\",\"labelEn\":\"University of Basel\"},{\"value\":\"uni-145\",\"labelAr\":\"جامعة بيير وماري كوري - باريس 6\",\"labelEn\":\"Pierre and Marie Curie University - Paris 6\"},{\"value\":\"uni-146\",\"labelAr\":\"جامعة باريس الجنوبية (باريس 11)\",\"labelEn\":\"University of Paris-Sud (Paris 11)\"},{\"value\":\"uni-147\",\"labelAr\":\"المدرسة العليا للأساتذة (إيكول نورمال سوبيريور)\",\"labelEn\":\"Ecole Normale Superieure\"},{\"value\":\"uni-148\",\"labelAr\":\"جامعة ستراسبورغ\",\"labelEn\":\"University of Strasbourg\"},{\"value\":\"uni-149\",\"labelAr\":\"جامعة إكس مرسيليا\",\"labelEn\":\"Aix Marseille University\"},{\"value\":\"uni-150\",\"labelAr\":\"جامعة هلسنكي\",\"labelEn\":\"University of Helsinki\"},{\"value\":\"uni-151\",\"labelAr\":\"جامعة أوترخت\",\"labelEn\":\"Utrecht University\"},{\"value\":\"uni-152\",\"labelAr\":\"جامعة غرونينغن\",\"labelEn\":\"University of Groningen\"},{\"value\":\"uni-153\",\"labelAr\":\"جامعة ليدن\",\"labelEn\":\"Leiden University\"},{\"value\":\"uni-154\",\"labelAr\":\"جامعة أمستردام\",\"labelEn\":\"University of Amsterdam\"},{\"value\":\"uni-155\",\"labelAr\":\"جامعة ولاية أريزونا\",\"labelEn\":\"ARIZONA STATE UNIVERSITY\"},{\"value\":\"uni-156\",\"labelAr\":\"معهد جورجيا للتقنية - الحرم الرئيسي\",\"labelEn\":\"GEORGIA INSTITUTE OF TECHNOLOGY - MAIN CAMPUS\"},{\"value\":\"uni-157\",\"labelAr\":\"جامعة إنديانا - بلومنغتون\",\"labelEn\":\"INDIANA UNIVERSITY - BLOOMINGTON\"},{\"value\":\"uni-158\",\"labelAr\":\"كلية ديكسون للقانون - جامعة ولاية بنسلفانيا\",\"labelEn\":\"Penn State Dickson Law-Pennsylvania State University\"},{\"value\":\"uni-159\",\"labelAr\":\"المعهد التقني بجامعة نيويورك\",\"labelEn\":\"Polytechnic Institute of NYU\"},{\"value\":\"uni-160\",\"labelAr\":\"جامعة ولاية سانت كلاود\",\"labelEn\":\"St. Cloud State University\"},{\"value\":\"uni-161\",\"labelAr\":\"جامعة تمبل\",\"labelEn\":\"Temple University\"},{\"value\":\"uni-162\",\"labelAr\":\"جامعة تكساس إيه آند إم\",\"labelEn\":\"TEXAS A & M UNIVERSITY\"},{\"value\":\"uni-163\",\"labelAr\":\"جامعة ولاية أوهايو\",\"labelEn\":\"The Ohio State University\"},{\"value\":\"uni-164\",\"labelAr\":\"جامعة توليدو\",\"labelEn\":\"The University of Toledo\"},{\"value\":\"uni-165\",\"labelAr\":\"جامعة كاليفورنيا - سان دييغو\",\"labelEn\":\"University of California - San Diego\"},{\"value\":\"uni-166\",\"labelAr\":\"جامعة كولورادو بولدر\",\"labelEn\":\"University of Colorado Boulder\"},{\"value\":\"uni-167\",\"labelAr\":\"جامعة ديلاوير\",\"labelEn\":\"University of Delaware\"},{\"value\":\"uni-168\",\"labelAr\":\"جامعة ماساتشوستس - أمهرست\",\"labelEn\":\"UNIVERSITY OF MASSACHUSETTS - AMHERST\"},{\"value\":\"uni-169\",\"labelAr\":\"جامعة سان دييغو\",\"labelEn\":\"University of San Diego\"},{\"value\":\"uni-170\",\"labelAr\":\"جامعة فرجينيا - الحرم الرئيسي\",\"labelEn\":\"UNIVERSITY OF VIRGINIA - MAIN CAMPUS\"},{\"value\":\"uni-171\",\"labelAr\":\"جامعة واشنطن - بوثيل\",\"labelEn\":\"UNIVERSITY OF WASHINGTON - BOTHELL\"},{\"value\":\"uni-172\",\"labelAr\":\"جامعة واشنطن - تاكوما\",\"labelEn\":\"University of Washington Tacoma\"},{\"value\":\"uni-173\",\"labelAr\":\"جامعة ولاية واشنطن - الحرم الرئيسي\",\"labelEn\":\"WASHINGTON STATE UNIVERSITY - MAIN CAMPUS\"},{\"value\":\"uni-174\",\"labelAr\":\"جامعة ميشيغان الغربية\",\"labelEn\":\"Western Michigan University\"},{\"value\":\"uni-175\",\"labelAr\":\"الجامعة الأمريكية (واشنطن)\",\"labelEn\":\"American University\"},{\"value\":\"uni-176\",\"labelAr\":\"كلية بيكون\",\"labelEn\":\"Beacon College\"},{\"value\":\"uni-177\",\"labelAr\":\"كلية بيركلي للموسيقى\",\"labelEn\":\"Berklee College of Music\"},{\"value\":\"uni-178\",\"labelAr\":\"كلية كلاركسون\",\"labelEn\":\"Clarkson College\"},{\"value\":\"uni-179\",\"labelAr\":\"كلية دارتموث\",\"labelEn\":\"DARTMOUTH COLLEGE\"},{\"value\":\"uni-180\",\"labelAr\":\"جامعة ديبول\",\"labelEn\":\"DePaul University\"},{\"value\":\"uni-181\",\"labelAr\":\"جامعة دومينيكان في كاليفورنيا\",\"labelEn\":\"Dominican University of California\"},{\"value\":\"uni-182\",\"labelAr\":\"جامعة إيموري\",\"labelEn\":\"EMORY UNIVERSITY\"},{\"value\":\"uni-183\",\"labelAr\":\"جامعة غالوديت\",\"labelEn\":\"Gallaudet University\"},{\"value\":\"uni-184\",\"labelAr\":\"جامعة جورج واشنطن - الحرم الرئيسي\",\"labelEn\":\"George Washington University - Main Campus\"},{\"value\":\"uni-185\",\"labelAr\":\"جامعة جورجتاون\",\"labelEn\":\"GEORGETOWN UNIVERSITY\"},{\"value\":\"uni-186\",\"labelAr\":\"كلية هالت الدولية لإدارة الأعمال\",\"labelEn\":\"Hult International Business School\"},{\"value\":\"uni-187\",\"labelAr\":\"جامعة جونز هوبكنز\",\"labelEn\":\"JOHNS HOPKINS UNIVERSITY\"},{\"value\":\"uni-188\",\"labelAr\":\"كلية كيندال\",\"labelEn\":\"Kendall College\"},{\"value\":\"uni-189\",\"labelAr\":\"جامعة ماريمونت\",\"labelEn\":\"Marymount University\"},{\"value\":\"uni-190\",\"labelAr\":\"كلية نازاريث\",\"labelEn\":\"Nazareth College\"},{\"value\":\"uni-191\",\"labelAr\":\"معهد روتشستر للتقنية\",\"labelEn\":\"Rochester Institute of Technology\"},{\"value\":\"uni-192\",\"labelAr\":\"جامعة روكهيرست\",\"labelEn\":\"Rockhurst University\"},{\"value\":\"uni-193\",\"labelAr\":\"جامعة تافتس\",\"labelEn\":\"TUFTS UNIVERSITY\"},{\"value\":\"uni-194\",\"labelAr\":\"جامعة بريدجبورت\",\"labelEn\":\"University of Bridgeport\"},{\"value\":\"uni-195\",\"labelAr\":\"جامعة إنديانابوليس\",\"labelEn\":\"University of Indianapolis\"},{\"value\":\"uni-196\",\"labelAr\":\"جامعة لا فيرن\",\"labelEn\":\"University of La Verne\"},{\"value\":\"uni-197\",\"labelAr\":\"جامعة روتشستر\",\"labelEn\":\"University of Rochester\"},{\"value\":\"uni-198\",\"labelAr\":\"جامعة واشنطن في سانت لويس\",\"labelEn\":\"Washington University in St. Louis\"},{\"value\":\"uni-199\",\"labelAr\":\"جامعة ويستكليف\",\"labelEn\":\"Westcliff University\"},{\"value\":\"uni-200\",\"labelAr\":\"بيربيك، جامعة لندن\",\"labelEn\":\"Birkbeck, University of London\"},{\"value\":\"uni-201\",\"labelAr\":\"جامعة برمنغهام سيتي\",\"labelEn\":\"Birmingham City University\"},{\"value\":\"uni-202\",\"labelAr\":\"جامعة بورنموث\",\"labelEn\":\"Bournemouth University\"},{\"value\":\"uni-203\",\"labelAr\":\"جامعة برونيل لندن\",\"labelEn\":\"Brunel University London\"},{\"value\":\"uni-204\",\"labelAr\":\"جامعة كارديف متروبوليتان\",\"labelEn\":\"Cardiff Metropolitan University\"},{\"value\":\"uni-205\",\"labelAr\":\"جامعة كارديف\",\"labelEn\":\"Cardiff University\"},{\"value\":\"uni-206\",\"labelAr\":\"سيتي، جامعة لندن\",\"labelEn\":\"City, Univerity of London\"},{\"value\":\"uni-207\",\"labelAr\":\"جامعة كينغستون\",\"labelEn\":\"Kingston University\"},{\"value\":\"uni-208\",\"labelAr\":\"جامعة لندن ساوث بانك\",\"labelEn\":\"London South Bank University\"},{\"value\":\"uni-209\",\"labelAr\":\"جامعة نيوكاسل\",\"labelEn\":\"Newcastle University\"},{\"value\":\"uni-210\",\"labelAr\":\"جامعة كوينز بلفاست\",\"labelEn\":\"Queen's University Belfast\"},{\"value\":\"uni-211\",\"labelAr\":\"جامعة لندن (SOAS) لدراسات الشرق وأفريقيا\",\"labelEn\":\"SOAS University of London\"},{\"value\":\"uni-212\",\"labelAr\":\"جامعة سولنت - ساوثهامبتون\",\"labelEn\":\"Solent University | Southampton\"},{\"value\":\"uni-213\",\"labelAr\":\"جامعة أبردين\",\"labelEn\":\"University of Aberdeen\"},{\"value\":\"uni-214\",\"labelAr\":\"جامعة باث\",\"labelEn\":\"University of Bath\"},{\"value\":\"uni-215\",\"labelAr\":\"جامعة بيدفوردشير\",\"labelEn\":\"University of Bedfordshire\"},{\"value\":\"uni-216\",\"labelAr\":\"جامعة برمنغهام\",\"labelEn\":\"University of Birmingham\"},{\"value\":\"uni-217\",\"labelAr\":\"جامعة بولتون\",\"labelEn\":\"University of Bolton\"},{\"value\":\"uni-218\",\"labelAr\":\"جامعة برايتون\",\"labelEn\":\"University of Brighton\"},{\"value\":\"uni-219\",\"labelAr\":\"جامعة وسط لانكشاير\",\"labelEn\":\"University of Central Lancashire\"},{\"value\":\"uni-220\",\"labelAr\":\"جامعة ديربي\",\"labelEn\":\"University of Derby\"},{\"value\":\"uni-221\",\"labelAr\":\"جامعة دندي\",\"labelEn\":\"University of Dundee\"},{\"value\":\"uni-222\",\"labelAr\":\"جامعة درم\",\"labelEn\":\"University of Durham\"},{\"value\":\"uni-223\",\"labelAr\":\"جامعة إيست أنجليا\",\"labelEn\":\"University of East Anglia\"},{\"value\":\"uni-224\",\"labelAr\":\"جامعة شرق لندن\",\"labelEn\":\"University of East London\"},{\"value\":\"uni-225\",\"labelAr\":\"جامعة إسكس\",\"labelEn\":\"University of Essex\"},{\"value\":\"uni-226\",\"labelAr\":\"جامعة إكستر\",\"labelEn\":\"University of Exeter\"},{\"value\":\"uni-227\",\"labelAr\":\"جامعة غلاسكو\",\"labelEn\":\"University of Glasgow\"},{\"value\":\"uni-228\",\"labelAr\":\"جامعة غلوسترشير\",\"labelEn\":\"University of Gloucestershire\"},{\"value\":\"uni-229\",\"labelAr\":\"جامعة غرينتش\",\"labelEn\":\"University of Greenwich\"},{\"value\":\"uni-230\",\"labelAr\":\"جامعة هيرتفوردشير\",\"labelEn\":\"University of Hertfordshire\"},{\"value\":\"uni-231\",\"labelAr\":\"جامعة هال\",\"labelEn\":\"University of Hull\"},{\"value\":\"uni-232\",\"labelAr\":\"جامعة كنت\",\"labelEn\":\"University of Kent\"},{\"value\":\"uni-233\",\"labelAr\":\"جامعة ليدز\",\"labelEn\":\"University of Leeds\"},{\"value\":\"uni-234\",\"labelAr\":\"جامعة ليستر\",\"labelEn\":\"University of Leicester\"},{\"value\":\"uni-235\",\"labelAr\":\"جامعة لينكولن\",\"labelEn\":\"University of Lincoln\"},{\"value\":\"uni-236\",\"labelAr\":\"جامعة ليفربول\",\"labelEn\":\"University of Liverpool\"},{\"value\":\"uni-237\",\"labelAr\":\"جامعة نورثهامبتون\",\"labelEn\":\"University of Northampton\"},{\"value\":\"uni-238\",\"labelAr\":\"جامعة نورثمبريا في نيوكاسل\",\"labelEn\":\"University of Northumbria at Newcastle\"},{\"value\":\"uni-239\",\"labelAr\":\"جامعة نوتنغهام\",\"labelEn\":\"University of Nottingham\"},{\"value\":\"uni-240\",\"labelAr\":\"جامعة بليموث\",\"labelEn\":\"University of Plymouth\"},{\"value\":\"uni-241\",\"labelAr\":\"جامعة بورتسموث\",\"labelEn\":\"University of Portsmouth\"},{\"value\":\"uni-242\",\"labelAr\":\"جامعة ريدينغ\",\"labelEn\":\"University of Reading\"},{\"value\":\"uni-243\",\"labelAr\":\"جامعة سالفورد\",\"labelEn\":\"University of Salford\"},{\"value\":\"uni-244\",\"labelAr\":\"جامعة شيفيلد\",\"labelEn\":\"University of Sheffield\"},{\"value\":\"uni-245\",\"labelAr\":\"جامعة جنوب ويلز\",\"labelEn\":\"University of South Wales\"},{\"value\":\"uni-246\",\"labelAr\":\"جامعة ساوثهامبتون\",\"labelEn\":\"University of Southampton\"},{\"value\":\"uni-247\",\"labelAr\":\"جامعة سانت أندروز\",\"labelEn\":\"University of St Andrews\"},{\"value\":\"uni-248\",\"labelAr\":\"جامعة ستيرلينغ\",\"labelEn\":\"University of Stirling\"},{\"value\":\"uni-249\",\"labelAr\":\"جامعة ستراثكلايد\",\"labelEn\":\"University of Strathclyde\"},{\"value\":\"uni-250\",\"labelAr\":\"جامعة سندرلاند\",\"labelEn\":\"University of Sunderland\"},{\"value\":\"uni-251\",\"labelAr\":\"جامعة ساري\",\"labelEn\":\"University of Surrey\"},{\"value\":\"uni-252\",\"labelAr\":\"جامعة ساسكس\",\"labelEn\":\"University of Sussex\"},{\"value\":\"uni-253\",\"labelAr\":\"جامعة تيسايد\",\"labelEn\":\"University of Teesside\"},{\"value\":\"uni-254\",\"labelAr\":\"جامعة الفنون في لندن\",\"labelEn\":\"University of the Arts London\"},{\"value\":\"uni-255\",\"labelAr\":\"جامعة غرب إنجلترا\",\"labelEn\":\"University of the West of England\"},{\"value\":\"uni-256\",\"labelAr\":\"جامعة غرب اسكتلندا\",\"labelEn\":\"University of the West of Scotland\"},{\"value\":\"uni-257\",\"labelAr\":\"جامعة أولستر\",\"labelEn\":\"University of Ulster\"},{\"value\":\"uni-258\",\"labelAr\":\"جامعة وستمنستر\",\"labelEn\":\"University of Westminster\"},{\"value\":\"uni-259\",\"labelAr\":\"جامعة ولفرهامبتون\",\"labelEn\":\"University of Wolverhampton\"},{\"value\":\"uni-260\",\"labelAr\":\"جامعة يورك\",\"labelEn\":\"University of York\"},{\"value\":\"uni-261\",\"labelAr\":\"جامعة الفنون الإبداعية\",\"labelEn\":\"University for the Creative Arts‎\"},{\"value\":\"uni-262\",\"labelAr\":\"جامعة أكاديا\",\"labelEn\":\"Acadia University\"},{\"value\":\"uni-263\",\"labelAr\":\"جامعة ألغوما\",\"labelEn\":\"Algoma University\"},{\"value\":\"uni-264\",\"labelAr\":\"كلية ألغونكوين\",\"labelEn\":\"Algonquin College\"},{\"value\":\"uni-265\",\"labelAr\":\"جامعة بيشوبس\",\"labelEn\":\"Bishops University\"},{\"value\":\"uni-266\",\"labelAr\":\"جامعة براندون\",\"labelEn\":\"Brandon University\"},{\"value\":\"uni-267\",\"labelAr\":\"كلية بريشيا الجامعية\",\"labelEn\":\"Brescia University College\"},{\"value\":\"uni-268\",\"labelAr\":\"جامعة بروك\",\"labelEn\":\"Brock University\"},{\"value\":\"uni-269\",\"labelAr\":\"كلية كاموسون\",\"labelEn\":\"Camosun College\"},{\"value\":\"uni-270\",\"labelAr\":\"كلية كامبيون\",\"labelEn\":\"Campion College\"},{\"value\":\"uni-271\",\"labelAr\":\"كلية كانادور\",\"labelEn\":\"Canadore College\"},{\"value\":\"uni-272\",\"labelAr\":\"جامعة كابيلانو\",\"labelEn\":\"Capilano University\"},{\"value\":\"uni-273\",\"labelAr\":\"جامعة كارلتون\",\"labelEn\":\"Carleton University\"},{\"value\":\"uni-274\",\"labelAr\":\"كلية سنتينيال\",\"labelEn\":\"Centennial College\"},{\"value\":\"uni-275\",\"labelAr\":\"كلية جامعة سانت بونيفاس\",\"labelEn\":\"College University de Saint-Boniface\"},{\"value\":\"uni-276\",\"labelAr\":\"جامعة كونكورديا\",\"labelEn\":\"Concordia University\"},{\"value\":\"uni-277\",\"labelAr\":\"كلية كونستوغا\",\"labelEn\":\"Conestoga College\"},{\"value\":\"uni-278\",\"labelAr\":\"جامعة دالهوزي\",\"labelEn\":\"Dalhousie University\"},{\"value\":\"uni-279\",\"labelAr\":\"كلية دوغلاس\",\"labelEn\":\"Douglas College\"},{\"value\":\"uni-280\",\"labelAr\":\"جامعة الأمم الأولى الكندية\",\"labelEn\":\"First Nations University of Canada\"},{\"value\":\"uni-281\",\"labelAr\":\"كلية جورج براون\",\"labelEn\":\"George Brown College\"},{\"value\":\"uni-282\",\"labelAr\":\"جامعة غرانت ماكإيوان\",\"labelEn\":\"Grant MacEwan University\"},{\"value\":\"uni-283\",\"labelAr\":\"كلية HEC مونتريال لإدارة الأعمال\",\"labelEn\":\"HEC Monterial\"},{\"value\":\"uni-284\",\"labelAr\":\"كلية هَمبر\",\"labelEn\":\"Humber College\"},{\"value\":\"uni-285\",\"labelAr\":\"كلية هيورون الجامعية\",\"labelEn\":\"Huron University College\"},{\"value\":\"uni-286\",\"labelAr\":\"كلية كينغز الجامعية (جامعة غرب أونتاريو)\",\"labelEn\":\"King's University College (University of Western Ontario)‎\"},{\"value\":\"uni-287\",\"labelAr\":\"جامعة كوانتلن التقنية\",\"labelEn\":\"Kwantlen Polytechnic University\"},{\"value\":\"uni-288\",\"labelAr\":\"جامعة ليكهيد\",\"labelEn\":\"Lakehead University\"},{\"value\":\"uni-289\",\"labelAr\":\"كلية لانغارا\",\"labelEn\":\"Langara College\"},{\"value\":\"uni-290\",\"labelAr\":\"جامعة لورنتيان في سدبري\",\"labelEn\":\"Laurentian University of Sudbury\"},{\"value\":\"uni-291\",\"labelAr\":\"جامعة ماكغيل\",\"labelEn\":\"McGill University\"},{\"value\":\"uni-292\",\"labelAr\":\"جامعة ماكماستر\",\"labelEn\":\"McMaster University\"},{\"value\":\"uni-293\",\"labelAr\":\"جامعة ميموريال نيوفاوندلاند\",\"labelEn\":\"Memorial University of Newfoundland\"},{\"value\":\"uni-294\",\"labelAr\":\"جامعة ماونت أليسون\",\"labelEn\":\"Mount Allison University\"},{\"value\":\"uni-295\",\"labelAr\":\"جامعة ماونت رويال\",\"labelEn\":\"Mount Royal University\"},{\"value\":\"uni-296\",\"labelAr\":\"جامعة ماونت سانت فينسنت\",\"labelEn\":\"Mount Saint Vincent University\"},{\"value\":\"uni-297\",\"labelAr\":\"كلية نياغرا\",\"labelEn\":\"Niagara College\"},{\"value\":\"uni-298\",\"labelAr\":\"جامعة نيبيسينغ\",\"labelEn\":\"Nipissing University\"},{\"value\":\"uni-299\",\"labelAr\":\"كلية أوكاناغان\",\"labelEn\":\"Okanagan College\"},{\"value\":\"uni-300\",\"labelAr\":\"كلية بورتاج\",\"labelEn\":\"Portage College\"},{\"value\":\"uni-301\",\"labelAr\":\"جامعة كوينز في كينغستون\",\"labelEn\":\"Queens University at Kingston\"},{\"value\":\"uni-302\",\"labelAr\":\"جامعة سانت ماري\",\"labelEn\":\"Saint Marys University\"},{\"value\":\"uni-303\",\"labelAr\":\"معهد سايت التقني\",\"labelEn\":\"SAIT Polytechnic\"},{\"value\":\"uni-304\",\"labelAr\":\"كلية سو\",\"labelEn\":\"Sault College\"},{\"value\":\"uni-305\",\"labelAr\":\"كلية سلكيرك\",\"labelEn\":\"Selkirk College\"},{\"value\":\"uni-306\",\"labelAr\":\"كلية سينيكا\",\"labelEn\":\"Seneca College\"},{\"value\":\"uni-307\",\"labelAr\":\"كلية شيريدان\",\"labelEn\":\"Sheridan College\"},{\"value\":\"uni-308\",\"labelAr\":\"جامعة سايمون فريزر\",\"labelEn\":\"Simon Fraser University\"},{\"value\":\"uni-309\",\"labelAr\":\"جامعة سانت فرانسيس إكزافيير\",\"labelEn\":\"St Francis Xavier University\"},{\"value\":\"uni-310\",\"labelAr\":\"جامعة سانت توماس\",\"labelEn\":\"St Thomas University\"},{\"value\":\"uni-311\",\"labelAr\":\"جامعة سانت جيروم\",\"labelEn\":\"St. Jerome's University\"},{\"value\":\"uni-312\",\"labelAr\":\"كلية سانت لورنس\",\"labelEn\":\"St. Lawrence College\"},{\"value\":\"uni-313\",\"labelAr\":\"كلية سانت توماس مور\",\"labelEn\":\"St.Thomas More College\"},{\"value\":\"uni-314\",\"labelAr\":\"جامعة بريتيش كولومبيا\",\"labelEn\":\"The University of British Columbia\"},{\"value\":\"uni-315\",\"labelAr\":\"جامعة ليثبريدج\",\"labelEn\":\"The University of Lethbridge\"},{\"value\":\"uni-316\",\"labelAr\":\"جامعة ريجاينا\",\"labelEn\":\"The University of Regina\"},{\"value\":\"uni-317\",\"labelAr\":\"جامعة غرب أونتاريو\",\"labelEn\":\"The University of Western Ontario\"},{\"value\":\"uni-318\",\"labelAr\":\"جامعة تومبسون ريفرز\",\"labelEn\":\"Thompson Rivers University\"},{\"value\":\"uni-319\",\"labelAr\":\"جامعة تورونتو متروبوليتان\",\"labelEn\":\"Toronto Metropolitan University\"},{\"value\":\"uni-320\",\"labelAr\":\"جامعة ترينت\",\"labelEn\":\"Trent University\"},{\"value\":\"uni-321\",\"labelAr\":\"جامعة كيبك في شيكوتيمي\",\"labelEn\":\"Université du Québec à Chicoutimi\"},{\"value\":\"uni-322\",\"labelAr\":\"جامعة كيبك في ريموسكي\",\"labelEn\":\"Université du Québec à Rimouski\"},{\"value\":\"uni-323\",\"labelAr\":\"جامعة كيبك في ترois-ريفيير\",\"labelEn\":\"Université du Québec a Trois-Rivières\"},{\"value\":\"uni-324\",\"labelAr\":\"جامعة كيبك في أبيتيبي تيميسكامينغ\",\"labelEn\":\"Université du Québec en Abitibi-Témiscamingue\"},{\"value\":\"uni-325\",\"labelAr\":\"جامعة سانت آن\",\"labelEn\":\"Université Sainte-Anne\"},{\"value\":\"uni-326\",\"labelAr\":\"جامعة مونكتون\",\"labelEn\":\"University de Moncton\"},{\"value\":\"uni-327\",\"labelAr\":\"جامعة مونتريال\",\"labelEn\":\"University de Montreal\"},{\"value\":\"uni-328\",\"labelAr\":\"جامعة كيبك - المدرسة الوطنية للإدارة العامة\",\"labelEn\":\"University de Quebec Ecole nationale dadministration publique\"},{\"value\":\"uni-329\",\"labelAr\":\"جامعة كيبك (التعليم عن بعد)\",\"labelEn\":\"University de Quebec Tele-university (now affiliated with UQAM)‎\"},{\"value\":\"uni-330\",\"labelAr\":\"جامعة كيبك في أوتاوايس\",\"labelEn\":\"University de Quebec en Outaouais\"},{\"value\":\"uni-331\",\"labelAr\":\"جامعة شيربروك\",\"labelEn\":\"University de Sherbrooke\"},{\"value\":\"uni-332\",\"labelAr\":\"جامعة كيبك في مونتريال\",\"labelEn\":\"University du Quebec Montreal\"},{\"value\":\"uni-333\",\"labelAr\":\"جامعة لافال\",\"labelEn\":\"University Laval\"},{\"value\":\"uni-334\",\"labelAr\":\"جامعة وينيبيغ\",\"labelEn\":\"University of Winnipeg\"},{\"value\":\"uni-335\",\"labelAr\":\"جامعة ألبرتا\",\"labelEn\":\"University of Alberta\"},{\"value\":\"uni-336\",\"labelAr\":\"جامعة كالغاري\",\"labelEn\":\"University of Calgary\"},{\"value\":\"uni-337\",\"labelAr\":\"جامعة غويلف\",\"labelEn\":\"University of Guelph\"},{\"value\":\"uni-338\",\"labelAr\":\"جامعة كينغز كوليدج\",\"labelEn\":\"University of Kings College\"},{\"value\":\"uni-339\",\"labelAr\":\"جامعة مانيتوبا\",\"labelEn\":\"University of Manitoba\"},{\"value\":\"uni-340\",\"labelAr\":\"جامعة نيو برونزويك\",\"labelEn\":\"University of New Brunswick\"},{\"value\":\"uni-341\",\"labelAr\":\"جامعة شمال بريتيش كولومبيا\",\"labelEn\":\"University of Northern British Columbia\"},{\"value\":\"uni-342\",\"labelAr\":\"جامعة أوتاوا\",\"labelEn\":\"University of Ottawa\"},{\"value\":\"uni-343\",\"labelAr\":\"جامعة الأمير إدوارد أيلاند\",\"labelEn\":\"University of Prince Edward Island\"},{\"value\":\"uni-344\",\"labelAr\":\"جامعة ساسكاتشوان\",\"labelEn\":\"University of Saskatchewan\"},{\"value\":\"uni-345\",\"labelAr\":\"جامعة كلية سانت مايكل\",\"labelEn\":\"University of St Michaels College\"},{\"value\":\"uni-346\",\"labelAr\":\"جامعة وادي فريزر\",\"labelEn\":\"University of The Fraser Valley\"},{\"value\":\"uni-347\",\"labelAr\":\"جامعة تورونتو\",\"labelEn\":\"University of Toronto\"},{\"value\":\"uni-348\",\"labelAr\":\"جامعة ترينيتي كوليدج\",\"labelEn\":\"University of Trinity College\"},{\"value\":\"uni-349\",\"labelAr\":\"جامعة فيكتوريا\",\"labelEn\":\"University of Victoria\"},{\"value\":\"uni-350\",\"labelAr\":\"جامعة واترلو\",\"labelEn\":\"University of Waterloo\"},{\"value\":\"uni-351\",\"labelAr\":\"جامعة وندسور\",\"labelEn\":\"University of Windsor\"},{\"value\":\"uni-352\",\"labelAr\":\"جامعة جزيرة فانكوفر\",\"labelEn\":\"Vancouver Island University\"},{\"value\":\"uni-353\",\"labelAr\":\"جامعة فيكتوريا - تورونتو\",\"labelEn\":\"Victoria University- Toronto\"},{\"value\":\"uni-354\",\"labelAr\":\"جامعة وسترن\",\"labelEn\":\"Western University\"},{\"value\":\"uni-355\",\"labelAr\":\"جامعة ويلفريد لورييه\",\"labelEn\":\"Wilfrid Laurier University\"},{\"value\":\"uni-356\",\"labelAr\":\"جامعة يورك (كندا)\",\"labelEn\":\"York University\"},{\"value\":\"uni-357\",\"labelAr\":\"جامعة فيرلي ديكنسون - حرم فانكوفر\",\"labelEn\":\"Fairleigh Dickinson University Vancouver Campus\"},{\"value\":\"uni-358\",\"labelAr\":\"كلية لاسال - فانكوفر\",\"labelEn\":\"Lasalle College Vancouver\"},{\"value\":\"uni-359\",\"labelAr\":\"معهد تريباس - كيبك\",\"labelEn\":\"Trebas Institute Quebec Inc\"},{\"value\":\"uni-360\",\"labelAr\":\"جامعة أنهوي\",\"labelEn\":\"Anhui University\"},{\"value\":\"uni-361\",\"labelAr\":\"جامعة بيهانغ\",\"labelEn\":\"Beihang University\"},{\"value\":\"uni-362\",\"labelAr\":\"معهد بكين للإدارة (أكاديمية العلوم الصينية)\",\"labelEn\":\"Beijing Institute of Management)Chinese Academy of Sciences\"},{\"value\":\"uni-363\",\"labelAr\":\"معهد بكين للتقنية\",\"labelEn\":\"Beijing Institute of Technology\"},{\"value\":\"uni-364\",\"labelAr\":\"جامعة بكين للدراسات الدولية\",\"labelEn\":\"Beijing International Studies University\"},{\"value\":\"uni-365\",\"labelAr\":\"جامعة بكين جياوتونغ\",\"labelEn\":\"Beijing Jiaotong University\"},{\"value\":\"uni-366\",\"labelAr\":\"جامعة بكين للغة والثقافة\",\"labelEn\":\"Beijing Language and Culture University\"},{\"value\":\"uni-367\",\"labelAr\":\"جامعة بكين التربوية\",\"labelEn\":\"Beijing Normal University\"},{\"value\":\"uni-368\",\"labelAr\":\"جامعة بكين للتقنية\",\"labelEn\":\"Beijing University of Technology\"},{\"value\":\"uni-369\",\"labelAr\":\"جامعة وسط الصين التربوية\",\"labelEn\":\"Central China Normal University\"},{\"value\":\"uni-370\",\"labelAr\":\"جامعة الجنوب الأوسط (سنترال ساوث)\",\"labelEn\":\"Central South University\"},{\"value\":\"uni-371\",\"labelAr\":\"الجامعة المركزية للمالية والاقتصاد\",\"labelEn\":\"Central University of Finance and Economics\"},{\"value\":\"uni-372\",\"labelAr\":\"جامعة تشانغآن\",\"labelEn\":\"Chang'an University\"},{\"value\":\"uni-373\",\"labelAr\":\"جامعة الصين للشؤون الخارجية\",\"labelEn\":\"China Foreign Affairs University\"},{\"value\":\"uni-374\",\"labelAr\":\"جامعة تشونغتشينغ\",\"labelEn\":\"Chongqing University\"},{\"value\":\"uni-375\",\"labelAr\":\"جامعة هونغ كونغ المدينة (سيتي)\",\"labelEn\":\"City University of Hong Kong\"},{\"value\":\"uni-376\",\"labelAr\":\"جامعة داليان للتقنية\",\"labelEn\":\"Dalian University of Technology\"},{\"value\":\"uni-377\",\"labelAr\":\"جامعة دونغهوا\",\"labelEn\":\"Donghua University\"},{\"value\":\"uni-378\",\"labelAr\":\"جامعة شرق الصين التربوية\",\"labelEn\":\"East China Normal University\"},{\"value\":\"uni-379\",\"labelAr\":\"جامعة شرق الصين للعلوم والتقنية\",\"labelEn\":\"East China University of Science and Technology\"},{\"value\":\"uni-380\",\"labelAr\":\"جامعة فودان\",\"labelEn\":\"Fudan University\"},{\"value\":\"uni-381\",\"labelAr\":\"جامعة فوتشو\",\"labelEn\":\"Fuzhou University\"},{\"value\":\"uni-382\",\"labelAr\":\"جامعة قوانغشي\",\"labelEn\":\"Guangxi University\"},{\"value\":\"uni-383\",\"labelAr\":\"جامعة هاربين الهندسية\",\"labelEn\":\"Harbin Engineering University (CSTIND\"},{\"value\":\"uni-384\",\"labelAr\":\"معهد هاربين للتقنية\",\"labelEn\":\"Harbin Institute of Technology (CSTIND) ‎\"},{\"value\":\"uni-385\",\"labelAr\":\"جامعة هوهاي\",\"labelEn\":\"Hohai University\"},{\"value\":\"uni-386\",\"labelAr\":\"جامعة هونغ كونغ المعمدانية\",\"labelEn\":\"Hong Kong Baptist University\"},{\"value\":\"uni-387\",\"labelAr\":\"جامعة هواتشونغ الزراعية\",\"labelEn\":\"Huazhong Agricultural University\"},{\"value\":\"uni-388\",\"labelAr\":\"جامعة هواتشونغ للعلوم والتقنية\",\"labelEn\":\"Huazhong University of Science and Technology\"},{\"value\":\"uni-389\",\"labelAr\":\"جامعة هونان التربوية\",\"labelEn\":\"Hunan Normal University\"},{\"value\":\"uni-390\",\"labelAr\":\"جامعة هونان\",\"labelEn\":\"Hunan University\"},{\"value\":\"uni-391\",\"labelAr\":\"جامعة منغوليا الداخلية\",\"labelEn\":\"Inner Mongolia University\"},{\"value\":\"uni-392\",\"labelAr\":\"جامعة جيانغنان\",\"labelEn\":\"Jiangnan University\"},{\"value\":\"uni-393\",\"labelAr\":\"جامعة جيلين\",\"labelEn\":\"Jilin University\"},{\"value\":\"uni-394\",\"labelAr\":\"جامعة جينان\",\"labelEn\":\"JiNan University\"},{\"value\":\"uni-395\",\"labelAr\":\"جامعة لانتشو\",\"labelEn\":\"Lanzhou University\"},{\"value\":\"uni-396\",\"labelAr\":\"جامعة لياونينغ\",\"labelEn\":\"Liaoning University\"},{\"value\":\"uni-397\",\"labelAr\":\"جامعة لينغنان\",\"labelEn\":\"Lingnan University\"},{\"value\":\"uni-398\",\"labelAr\":\"المركز الطبي لجامعة فودان\",\"labelEn\":\"Medical Center of Fudan University\"},{\"value\":\"uni-399\",\"labelAr\":\"جامعة الصين للقوميات (مينزو)\",\"labelEn\":\"Minzu University of China\"},{\"value\":\"uni-400\",\"labelAr\":\"جامعة نانتشانغ\",\"labelEn\":\"Nanchang University\"},{\"value\":\"uni-401\",\"labelAr\":\"جامعة نانجينغ\",\"labelEn\":\"Nanjing University\"},{\"value\":\"uni-402\",\"labelAr\":\"جامعة نانجينغ للعلوم والتقنية\",\"labelEn\":\"Nanjing University of Science and Technology (CSTIND)‎\"},{\"value\":\"uni-403\",\"labelAr\":\"جامعة نانكاي\",\"labelEn\":\"Nankai University\"},{\"value\":\"uni-404\",\"labelAr\":\"الجامعة الوطنية لتقنية الدفاع\",\"labelEn\":\"National University of Defense Technology\"},{\"value\":\"uni-405\",\"labelAr\":\"جامعة شمال شرق الصين التربوية\",\"labelEn\":\"Northeast Normal University\"},{\"value\":\"uni-406\",\"labelAr\":\"الجامعة الشمالية الشرقية (الصين)\",\"labelEn\":\"Northeastern University\"},{\"value\":\"uni-407\",\"labelAr\":\"جامعة الشمال الغربي\",\"labelEn\":\"Northwest University\"},{\"value\":\"uni-408\",\"labelAr\":\"الجامعة التقنية الشمالية الغربية\",\"labelEn\":\"Northwestern Polytechnical University\"},{\"value\":\"uni-409\",\"labelAr\":\"جامعة الصين للمحيطات\",\"labelEn\":\"Ocean University of China\"},{\"value\":\"uni-410\",\"labelAr\":\"جامعة بكين\",\"labelEn\":\"Peking University\"},{\"value\":\"uni-411\",\"labelAr\":\"جامعة الصين الشعبية (رنمين)\",\"labelEn\":\"Renmin University of China( People University of China)‎\"},{\"value\":\"uni-412\",\"labelAr\":\"الجامعة الطبية العسكرية الثانية\",\"labelEn\":\"Second Military Medical University\"},{\"value\":\"uni-413\",\"labelAr\":\"جامعة شنشي التربوية\",\"labelEn\":\"Shaanxi Normal University\"},{\"value\":\"uni-414\",\"labelAr\":\"جامعة شاندونغ\",\"labelEn\":\"Shandong University\"},{\"value\":\"uni-415\",\"labelAr\":\"جامعة شنغهاي جياوتونغ\",\"labelEn\":\"Shanghai Jiao tong University\"},{\"value\":\"uni-416\",\"labelAr\":\"جامعة شنغهاي\",\"labelEn\":\"Shanghai University\"},{\"value\":\"uni-417\",\"labelAr\":\"جامعة شنغهاي للمالية والاقتصاد\",\"labelEn\":\"Shanghai University of Finance & Economics\"},{\"value\":\"uni-418\",\"labelAr\":\"جامعة سيتشوان\",\"labelEn\":\"Sichuan University\"},{\"value\":\"uni-419\",\"labelAr\":\"جامعة سوتشو\",\"labelEn\":\"Soochow University\"},{\"value\":\"uni-420\",\"labelAr\":\"جامعة جنوب الصين التربوية\",\"labelEn\":\"South China Normal University\"},{\"value\":\"uni-421\",\"labelAr\":\"جامعة جنوب الصين للتقنية\",\"labelEn\":\"South China University of Technology\"},{\"value\":\"uni-422\",\"labelAr\":\"جامعة جنوب شرق الصين\",\"labelEn\":\"Southeast University\"},{\"value\":\"uni-423\",\"labelAr\":\"الجامعة الجنوبية للعلوم والتقنية\",\"labelEn\":\"Southern University of Science and Technology\"},{\"value\":\"uni-424\",\"labelAr\":\"جامعة الجنوب الغربي جياوتونغ\",\"labelEn\":\"Southwest Jiaotong University\"},{\"value\":\"uni-425\",\"labelAr\":\"جامعة الجنوب الغربي\",\"labelEn\":\"Southwest University\"},{\"value\":\"uni-426\",\"labelAr\":\"جامعة الجنوب الغربي للمالية والاقتصاد\",\"labelEn\":\"Southwestern University of Finance and Economics\"},{\"value\":\"uni-427\",\"labelAr\":\"جامعة صن يات صن\",\"labelEn\":\"Sun Yat-sen University\"},{\"value\":\"uni-428\",\"labelAr\":\"جامعة تاييوان للتقنية\",\"labelEn\":\"Taiyuan University of Technology\"},{\"value\":\"uni-429\",\"labelAr\":\"جامعة هونغ كونغ الصينية\",\"labelEn\":\"The Chinese University of Hong Kong (CUHK)‎\"},{\"value\":\"uni-430\",\"labelAr\":\"الجامعة الطبية العسكرية الرابعة\",\"labelEn\":\"The Fourth Military Medical University\"},{\"value\":\"uni-431\",\"labelAr\":\"أكاديمية هونغ كونغ للفنون الأدائية\",\"labelEn\":\"The Hong Kong Academy for Performing Arts\"},{\"value\":\"uni-432\",\"labelAr\":\"معهد هونغ كونغ للتربية\",\"labelEn\":\"The Hong Kong Institute of Education\"},{\"value\":\"uni-433\",\"labelAr\":\"جامعة هونغ كونغ التقنية (بوليتكنيك)\",\"labelEn\":\"The Hong Kong Polytechnic University\"},{\"value\":\"uni-434\",\"labelAr\":\"جامعة هونغ كونغ للعلوم والتقنية\",\"labelEn\":\"The Hong Kong University of Science and Technology\"},{\"value\":\"uni-435\",\"labelAr\":\"جامعة هونغ كونغ\",\"labelEn\":\"The University of Hong Kong\"},{\"value\":\"uni-436\",\"labelAr\":\"جامعة تيانجين\",\"labelEn\":\"Tianjin University\"},{\"value\":\"uni-437\",\"labelAr\":\"جامعة تونغجي\",\"labelEn\":\"Tongji University\"},{\"value\":\"uni-438\",\"labelAr\":\"جامعة تسينغهوا\",\"labelEn\":\"Tsinghua University\"},{\"value\":\"uni-439\",\"labelAr\":\"جامعة الصين للعلوم والتقنية الإلكترونية\",\"labelEn\":\"University of Electronic Science and Technology of china\"},{\"value\":\"uni-440\",\"labelAr\":\"جامعة الأعمال والاقتصاد الدولية\",\"labelEn\":\"University of International Business and Economics\"},{\"value\":\"uni-441\",\"labelAr\":\"جامعة العلاقات الدولية\",\"labelEn\":\"University of International Relations\"},{\"value\":\"uni-442\",\"labelAr\":\"جامعة بكين للعلوم والتقنية\",\"labelEn\":\"University of Science and Technology Beijing\"},{\"value\":\"uni-443\",\"labelAr\":\"جامعة الصين للعلوم والتقنية\",\"labelEn\":\"University of Science and Technology of China\"},{\"value\":\"uni-444\",\"labelAr\":\"جامعة ووهان\",\"labelEn\":\"Wuhan University\"},{\"value\":\"uni-445\",\"labelAr\":\"جامعة ووهان للتقنية\",\"labelEn\":\"Wuhan University of Technology\"},{\"value\":\"uni-446\",\"labelAr\":\"جامعة شيامن\",\"labelEn\":\"Xiamen University\"},{\"value\":\"uni-447\",\"labelAr\":\"جامعة شيان جياوتونغ\",\"labelEn\":\"Xi'an Jiaotong University\"},{\"value\":\"uni-448\",\"labelAr\":\"جامعة شيديان\",\"labelEn\":\"Xidian University\"},{\"value\":\"uni-449\",\"labelAr\":\"جامعة شينجيانغ\",\"labelEn\":\"Xinjiang University\"},{\"value\":\"uni-450\",\"labelAr\":\"جامعة يانبيان\",\"labelEn\":\"Yanbian University\"},{\"value\":\"uni-451\",\"labelAr\":\"جامعة يوننان\",\"labelEn\":\"Yunnan University\"},{\"value\":\"uni-452\",\"labelAr\":\"جامعة تشجيانغ\",\"labelEn\":\"Zhejiang University\"},{\"value\":\"uni-453\",\"labelAr\":\"جامعة تشنغتشو\",\"labelEn\":\"Zhengzhou University\"},{\"value\":\"uni-454\",\"labelAr\":\"جامعة هونغ كونغ شو يان\",\"labelEn\":\"Hong Kong Shue Yan University\"},{\"value\":\"uni-455\",\"labelAr\":\"أكاديمية السادات للعلوم الإدارية\",\"labelEn\":\"Sadat Academy for Management Sciences\"},{\"value\":\"uni-456\",\"labelAr\":\"جامعة أسيوط\",\"labelEn\":\"Assiut University\"},{\"value\":\"uni-457\",\"labelAr\":\"جامعة الأزهر\",\"labelEn\":\"Al-Azhar University\"},{\"value\":\"uni-458\",\"labelAr\":\"جامعة الإسكندرية\",\"labelEn\":\"Alexandria University\"},{\"value\":\"uni-459\",\"labelAr\":\"جامعة الزقازيق\",\"labelEn\":\"Zagazig University\"},{\"value\":\"uni-460\",\"labelAr\":\"جامعة السويس\",\"labelEn\":\"Suez University\"},{\"value\":\"uni-461\",\"labelAr\":\"جامعة العاصمة\",\"labelEn\":\"Al-Asema University (Capital University)\"},{\"value\":\"uni-462\",\"labelAr\":\"جامعة الفيوم\",\"labelEn\":\"Fayoum University\"},{\"value\":\"uni-463\",\"labelAr\":\"جامعة القاهرة\",\"labelEn\":\"Cairo University\"},{\"value\":\"uni-464\",\"labelAr\":\"جامعة المنصورة\",\"labelEn\":\"Mansoura University\"},{\"value\":\"uni-465\",\"labelAr\":\"جامعة المنوفية\",\"labelEn\":\"Menoufia University\"},{\"value\":\"uni-466\",\"labelAr\":\"جامعة المنيا\",\"labelEn\":\"Minia University\"},{\"value\":\"uni-467\",\"labelAr\":\"جامعة دمنهور\",\"labelEn\":\"Damanhour University\"},{\"value\":\"uni-468\",\"labelAr\":\"جامعة دمياط\",\"labelEn\":\"Damietta University\"},{\"value\":\"uni-469\",\"labelAr\":\"جامعة طنطا\",\"labelEn\":\"Tanta University\"},{\"value\":\"uni-470\",\"labelAr\":\"جامعة عين شمس\",\"labelEn\":\"Ain Shams University\"},{\"value\":\"uni-471\",\"labelAr\":\"جامعة قناة السويس\",\"labelEn\":\"Suez Canal University\"},{\"value\":\"uni-472\",\"labelAr\":\"جامعة كفر الشيخ\",\"labelEn\":\"Kafrelsheikh University\"},{\"value\":\"uni-473\",\"labelAr\":\"الجامعة الألمانية بالقاهرة\",\"labelEn\":\"German University in Cairo\"},{\"value\":\"uni-474\",\"labelAr\":\"الجامعة الأمريكية بالقاهرة\",\"labelEn\":\"American University in Cairo\"},{\"value\":\"uni-475\",\"labelAr\":\"الجامعة البريطانية في مصر\",\"labelEn\":\"The British University in Egypt\"},{\"value\":\"uni-476\",\"labelAr\":\"جامعة 6 اكتوبر\",\"labelEn\":\"October 6 University\"},{\"value\":\"uni-477\",\"labelAr\":\"جامعة الملك سلمان الدولية الأهلية\",\"labelEn\":\"King Salman International University\"},{\"value\":\"uni-478\",\"labelAr\":\"جامعة بدر بالقاهرة\",\"labelEn\":\"Badr University in Cairo\"},{\"value\":\"uni-479\",\"labelAr\":\"جامعة بني سويف\",\"labelEn\":\"Beni-Suef University\"},{\"value\":\"uni-480\",\"labelAr\":\"جامعة فاروس بالاسكندرية\",\"labelEn\":\"Pharos University in Alexandria\"},{\"value\":\"uni-481\",\"labelAr\":\"جامعة مصر للعلوم والتكنولوجيا\",\"labelEn\":\"Misr University for Science and Technology\"},{\"value\":\"uni-482\",\"labelAr\":\"فرع جامعة كوفنتري\",\"labelEn\":\"Coventry University Branch (Egypt)\"},{\"value\":\"uni-483\",\"labelAr\":\"فرع جامعة لندن بالقاهرة\",\"labelEn\":\"University of London Branch in Cairo\"},{\"value\":\"uni-484\",\"labelAr\":\"فرع جامعة وسط لانكشاير\",\"labelEn\":\"University of Central Lancashire Branch (Egypt)\"},{\"value\":\"uni-485\",\"labelAr\":\"الجامعة الأردنية\",\"labelEn\":\"The University of Jordan\"},{\"value\":\"uni-486\",\"labelAr\":\"الجامعة الألمانية الأردنية\",\"labelEn\":\"German Jordanian University\"},{\"value\":\"uni-487\",\"labelAr\":\"الجامعة الهاشمية\",\"labelEn\":\"The Hashemite University\"},{\"value\":\"uni-488\",\"labelAr\":\"جامعة آل البيت\",\"labelEn\":\"Al al-Bayt University\"},{\"value\":\"uni-489\",\"labelAr\":\"جامعة البلقاء التطبيقية\",\"labelEn\":\"Al-Balqa Applied University\"},{\"value\":\"uni-490\",\"labelAr\":\"جامعة الحسين بن طلال\",\"labelEn\":\"Al-Hussein Bin Talal University\"},{\"value\":\"uni-491\",\"labelAr\":\"جامعة الطفيلة التقنية\",\"labelEn\":\"Tafila Technical University\"},{\"value\":\"uni-492\",\"labelAr\":\"جامعة العلوم والتكنولوجيا\",\"labelEn\":\"Jordan University of Science and Technology\"},{\"value\":\"uni-493\",\"labelAr\":\"جامعة اليرموك\",\"labelEn\":\"Yarmouk University\"},{\"value\":\"uni-494\",\"labelAr\":\"جامعة مؤته\",\"labelEn\":\"Mutah University\"},{\"value\":\"uni-495\",\"labelAr\":\"جامعة بيدفوردشير في الأردن\",\"labelEn\":\"University of Bedfordshire in Jordan\"},{\"value\":\"uni-496\",\"labelAr\":\"الجامعة الأمريكية في مادبا\",\"labelEn\":\"American University of Madaba\"},{\"value\":\"uni-497\",\"labelAr\":\"الجامعة العربية المفتوحة بالأردن\",\"labelEn\":\"Arab Open University (Jordan Branch)\"},{\"value\":\"uni-498\",\"labelAr\":\"جامعة اربد الأهلية\",\"labelEn\":\"Irbid National University\"},{\"value\":\"uni-499\",\"labelAr\":\"جامعة الإسراء\",\"labelEn\":\"Isra University\"},{\"value\":\"uni-500\",\"labelAr\":\"جامعة الأميرة سمية للتكنولوجيا\",\"labelEn\":\"Princess Sumaya University for Technology\"},{\"value\":\"uni-501\",\"labelAr\":\"جامعة البترا\",\"labelEn\":\"Petra University\"},{\"value\":\"uni-502\",\"labelAr\":\"جامعة الحسين بن عبدالله الثاني التقنية\",\"labelEn\":\"Al Hussein Technical University\"},{\"value\":\"uni-503\",\"labelAr\":\"جامعة الزرقاء\",\"labelEn\":\"Zarqa University\"},{\"value\":\"uni-504\",\"labelAr\":\"جامعة الزيتونة الأردنية\",\"labelEn\":\"Al-Zaytoonah University of Jordan\"},{\"value\":\"uni-505\",\"labelAr\":\"جامعة الشرق الأوسط\",\"labelEn\":\"Middle East University\"},{\"value\":\"uni-506\",\"labelAr\":\"جامعة العقبة للتكنولوجيا\",\"labelEn\":\"Aqaba University of Technology\"},{\"value\":\"uni-507\",\"labelAr\":\"جامعة العقبة للعلوم الطبية\",\"labelEn\":\"Aqaba Medical Sciences University\"},{\"value\":\"uni-508\",\"labelAr\":\"جامعة العلوم الإسلامية العالمية\",\"labelEn\":\"World Islamic Sciences and Education University (WISE)\"},{\"value\":\"uni-509\",\"labelAr\":\"جامعة العلوم التطبيقية الخاصة\",\"labelEn\":\"Applied Science Private University\"},{\"value\":\"uni-510\",\"labelAr\":\"جامعة جدارا\",\"labelEn\":\"Jadara University\"},{\"value\":\"uni-511\",\"labelAr\":\"جامعة جرش\",\"labelEn\":\"Jerash University\"},{\"value\":\"uni-512\",\"labelAr\":\"جامعة عجلون الوطنية\",\"labelEn\":\"Ajloun National University\"},{\"value\":\"uni-513\",\"labelAr\":\"جامعة عمَّان الأهلية\",\"labelEn\":\"Al-Ahliyya Amman University\"},{\"value\":\"uni-514\",\"labelAr\":\"جامعة عمّان العربية\",\"labelEn\":\"Amman Arab University\"},{\"value\":\"uni-515\",\"labelAr\":\"جامعة فيلادلفيا\",\"labelEn\":\"Philadelphia University\"},{\"value\":\"uni-516\",\"labelAr\":\"أخرى**\",\"labelEn\":\"Others**\"},{\"value\":\"uni-517\",\"labelAr\":\"**عند اختياراخرى تتيح للخبيرأوالمدرب كتابة التخصص\",\"labelEn\":\"**عند اختياراخرى تتيح للخبيرأوالمدرب كتابة التخصص\"}],\"ownership\":\"expert-hub\",\"order\":4}",
        },
        new
        {
            FieldId = new Guid("ff000000-0000-0000-0007-000000000022"),
            SchemaVersion = Version,
            FieldCode = "qualificationDate",
            SectionCode = "education",
            LabelAr = "تاريخ الحصول على المؤهل",
            LabelEn = "Date obtained",
            InputType = "date",
            OrderIndex = 22,
            Definition = "{\"id\":\"qualificationDate\",\"type\":\"date\",\"sectionId\":\"education\",\"labelAr\":\"تاريخ الحصول على المؤهل\",\"labelEn\":\"Date obtained\",\"requiredFor\":[\"trainer\",\"consultant\",\"content-developer\",\"question-writer\"],\"ownership\":\"expert-hub\",\"order\":5}",
        },
        new
        {
            FieldId = new Guid("ff000000-0000-0000-0007-000000000023"),
            SchemaVersion = Version,
            FieldCode = "certificateName",
            SectionCode = "certifications",
            LabelAr = "اسم الشهادة",
            LabelEn = "Certificate name",
            InputType = "select",
            OrderIndex = 23,
            Definition = "{\"id\":\"certificateName\",\"type\":\"select\",\"sectionId\":\"certifications\",\"labelAr\":\"اسم الشهادة\",\"labelEn\":\"Certificate name\",\"requiredFor\":[],\"options\":[{\"value\":\"CERT-0001\",\"labelAr\":\"Saudi Board Certification (Saudi Commission for Health Specialties)\",\"labelEn\":\"Saudi Board Certification (Saudi Commission for Health Specialties)\"},{\"value\":\"CERT-0002\",\"labelAr\":\"Health Practitioner Professional Classification and Registration (Saudi Commission for Health Specialties)\",\"labelEn\":\"Health Practitioner Professional Classification and Registration (Saudi Commission for Health Specialties)\"},{\"value\":\"CERT-0003\",\"labelAr\":\"SOCPA Fellowship Certificate\",\"labelEn\":\"SOCPA Fellowship Certificate\"},{\"value\":\"CERT-0004\",\"labelAr\":\"SOCPA VAT Specialist Certificate\",\"labelEn\":\"SOCPA VAT Specialist Certificate\"},{\"value\":\"CERT-0005\",\"labelAr\":\"SOCPA Accounting Technician Certificate\",\"labelEn\":\"SOCPA Accounting Technician Certificate\"},{\"value\":\"CERT-0006\",\"labelAr\":\"SOCPA Professional Certification in Public Sector Accounting Standards\",\"labelEn\":\"SOCPA Professional Certification in Public Sector Accounting Standards\"},{\"value\":\"CERT-0007\",\"labelAr\":\"SOCPA Financial Fraud Examiner Certification\",\"labelEn\":\"SOCPA Financial Fraud Examiner Certification\"},{\"value\":\"CERT-0008\",\"labelAr\":\"SOCPA International Financial Reporting Standards (IFRS) Certificate\",\"labelEn\":\"SOCPA International Financial Reporting Standards (IFRS) Certificate\"},{\"value\":\"CERT-0009\",\"labelAr\":\"SOCPA Government Accounting Training Track Certificate\",\"labelEn\":\"SOCPA Government Accounting Training Track Certificate\"},{\"value\":\"CERT-0010\",\"labelAr\":\"SOCPA Government Auditing Training Track Certificate\",\"labelEn\":\"SOCPA Government Auditing Training Track Certificate\"},{\"value\":\"CERT-0011\",\"labelAr\":\"Accounting and Auditing Practice License (SOCPA)\",\"labelEn\":\"Accounting and Auditing Practice License (SOCPA)\"},{\"value\":\"CERT-0012\",\"labelAr\":\"CMA Qualification Examination: International Introduction to Securities and Investment (CME-1A)\",\"labelEn\":\"CMA Qualification Examination: International Introduction to Securities and Investment (CME-1A)\"},{\"value\":\"CERT-0013\",\"labelAr\":\"CMA Qualification Examination: General Saudi Capital Market Rules and Regulations (CME-1B)\",\"labelEn\":\"CMA Qualification Examination: General Saudi Capital Market Rules and Regulations (CME-1B)\"},{\"value\":\"CERT-0014\",\"labelAr\":\"CMA Qualification Examination: Global Financial Compliance (CME-2A)\",\"labelEn\":\"CMA Qualification Examination: Global Financial Compliance (CME-2A)\"},{\"value\":\"CERT-0015\",\"labelAr\":\"CMA Qualification Examination: Saudi Capital Market Rules and Regulations - Compliance, Anti-Money Laundering and Combating the Financing of Terrorism (CME-2B)\",\"labelEn\":\"CMA Qualification Examination: Saudi Capital Market Rules and Regulations - Compliance, Anti-Money Laundering and Combating the Financing of Terrorism (CME-2B)\"},{\"value\":\"CERT-0016\",\"labelAr\":\"CMA Qualification Examination: Securities (CME-3A)\",\"labelEn\":\"CMA Qualification Examination: Securities (CME-3A)\"},{\"value\":\"CERT-0017\",\"labelAr\":\"CMA Qualification Examination: Saudi Capital Market Rules and Regulations - Brokers (CME-3B)\",\"labelEn\":\"CMA Qualification Examination: Saudi Capital Market Rules and Regulations - Brokers (CME-3B)\"},{\"value\":\"CERT-0018\",\"labelAr\":\"CMA Qualification Examination: International Certificate in Wealth and Investment Management (CME-4A)\",\"labelEn\":\"CMA Qualification Examination: International Certificate in Wealth and Investment Management (CME-4A)\"},{\"value\":\"CERT-0019\",\"labelAr\":\"CMA Qualification Examination: Saudi Capital Market Rules and Regulations - Asset Managers (CME-4B)\",\"labelEn\":\"CMA Qualification Examination: Saudi Capital Market Rules and Regulations - Asset Managers (CME-4B)\"},{\"value\":\"CERT-0020\",\"labelAr\":\"CMA Qualification Examination: Corporate Finance Technical Foundations (CME-5A)\",\"labelEn\":\"CMA Qualification Examination: Corporate Finance Technical Foundations (CME-5A)\"},{\"value\":\"CERT-0021\",\"labelAr\":\"CMA Qualification Examination: Saudi Capital Market Rules and Regulations - Corporate Finance (CME-5B)\",\"labelEn\":\"CMA Qualification Examination: Saudi Capital Market Rules and Regulations - Corporate Finance (CME-5B)\"},{\"value\":\"CERT-0022\",\"labelAr\":\"Insurance Fundamentals Certificate Examination (IFCE)\",\"labelEn\":\"Insurance Fundamentals Certificate Examination (IFCE)\"},{\"value\":\"CERT-0023\",\"labelAr\":\"Credit Advisor Certification (SAMA-mandated)\",\"labelEn\":\"Credit Advisor Certification (SAMA-mandated)\"},{\"value\":\"CERT-0024\",\"labelAr\":\"Compliance Foundations Professional Certificate (Financial Academy)\",\"labelEn\":\"Compliance Foundations Professional Certificate (Financial Academy)\"},{\"value\":\"CERT-0025\",\"labelAr\":\"Professional Certification in Compliance for the Financing Companies Sector\",\"labelEn\":\"Professional Certification in Compliance for the Financing Companies Sector\"},{\"value\":\"CERT-0026\",\"labelAr\":\"Taqeem Fellowship Certificate in Real Estate Valuation\",\"labelEn\":\"Taqeem Fellowship Certificate in Real Estate Valuation\"},{\"value\":\"CERT-0027\",\"labelAr\":\"Taqeem Fellowship Certificate in Business Valuation\",\"labelEn\":\"Taqeem Fellowship Certificate in Business Valuation\"},{\"value\":\"CERT-0028\",\"labelAr\":\"Taqeem Fellowship Certificate in Machinery and Equipment Valuation\",\"labelEn\":\"Taqeem Fellowship Certificate in Machinery and Equipment Valuation\"},{\"value\":\"CERT-0029\",\"labelAr\":\"Taqeem Professional Certificate - Inspector (Mu'ayin)\",\"labelEn\":\"Taqeem Professional Certificate - Inspector (Mu'ayin)\"},{\"value\":\"CERT-0030\",\"labelAr\":\"Accredited Valuer License (Taqeem)\",\"labelEn\":\"Accredited Valuer License (Taqeem)\"},{\"value\":\"CERT-0031\",\"labelAr\":\"Professional Accreditation of Engineers - Associate / Professional / Consultant Classification (Saudi Council of Engineers)\",\"labelEn\":\"Professional Accreditation of Engineers - Associate / Professional / Consultant Classification (Saudi Council of Engineers)\"},{\"value\":\"CERT-0032\",\"labelAr\":\"Real Estate Brokerage (FAL) License (Real Estate General Authority)\",\"labelEn\":\"Real Estate Brokerage (FAL) License (Real Estate General Authority)\"},{\"value\":\"CERT-0033\",\"labelAr\":\"Lawyer Practice License (Ministry of Justice)\",\"labelEn\":\"Lawyer Practice License (Ministry of Justice)\"},{\"value\":\"CERT-0034\",\"labelAr\":\"Professional License for Teachers (Education and Training Evaluation Commission)\",\"labelEn\":\"Professional License for Teachers (Education and Training Evaluation Commission)\"},{\"value\":\"CERT-0035\",\"labelAr\":\"Commercial Pilot License (General Authority of Civil Aviation)\",\"labelEn\":\"Commercial Pilot License (General Authority of Civil Aviation)\"},{\"value\":\"CERT-0036\",\"labelAr\":\"Project Management Professional (PMP)\",\"labelEn\":\"Project Management Professional (PMP)\"},{\"value\":\"CERT-0037\",\"labelAr\":\"Certified Associate in Project Management (CAPM)\",\"labelEn\":\"Certified Associate in Project Management (CAPM)\"},{\"value\":\"CERT-0038\",\"labelAr\":\"Program Management Professional (PgMP)\",\"labelEn\":\"Program Management Professional (PgMP)\"},{\"value\":\"CERT-0039\",\"labelAr\":\"Portfolio Management Professional (PfMP)\",\"labelEn\":\"Portfolio Management Professional (PfMP)\"},{\"value\":\"CERT-0040\",\"labelAr\":\"PMI Agile Certified Practitioner (PMI-ACP)\",\"labelEn\":\"PMI Agile Certified Practitioner (PMI-ACP)\"},{\"value\":\"CERT-0041\",\"labelAr\":\"PMI Risk Management Professional (PMI-RMP)\",\"labelEn\":\"PMI Risk Management Professional (PMI-RMP)\"},{\"value\":\"CERT-0042\",\"labelAr\":\"PMI Scheduling Professional (PMI-SP)\",\"labelEn\":\"PMI Scheduling Professional (PMI-SP)\"},{\"value\":\"CERT-0043\",\"labelAr\":\"PMI Professional in Business Analysis (PMI-PBA)\",\"labelEn\":\"PMI Professional in Business Analysis (PMI-PBA)\"},{\"value\":\"CERT-0044\",\"labelAr\":\"PMI Construction Professional (PMI-CP)\",\"labelEn\":\"PMI Construction Professional (PMI-CP)\"},{\"value\":\"CERT-0045\",\"labelAr\":\"PMI PMO Certified Professional (PMI-PMOCP)\",\"labelEn\":\"PMI PMO Certified Professional (PMI-PMOCP)\"},{\"value\":\"CERT-0046\",\"labelAr\":\"Professional Scrum Master I (PSM I)\",\"labelEn\":\"Professional Scrum Master I (PSM I)\"},{\"value\":\"CERT-0047\",\"labelAr\":\"Professional Scrum Product Owner I (PSPO I)\",\"labelEn\":\"Professional Scrum Product Owner I (PSPO I)\"},{\"value\":\"CERT-0048\",\"labelAr\":\"Certified ScrumMaster (CSM)\",\"labelEn\":\"Certified ScrumMaster (CSM)\"},{\"value\":\"CERT-0049\",\"labelAr\":\"Certified Scrum Product Owner (CSPO)\",\"labelEn\":\"Certified Scrum Product Owner (CSPO)\"},{\"value\":\"CERT-0050\",\"labelAr\":\"Entry Certificate in Business Analysis (ECBA)\",\"labelEn\":\"Entry Certificate in Business Analysis (ECBA)\"},{\"value\":\"CERT-0051\",\"labelAr\":\"Certification of Capability in Business Analysis (CCBA)\",\"labelEn\":\"Certification of Capability in Business Analysis (CCBA)\"},{\"value\":\"CERT-0052\",\"labelAr\":\"Certified Business Analysis Professional (CBAP)\",\"labelEn\":\"Certified Business Analysis Professional (CBAP)\"},{\"value\":\"CERT-0053\",\"labelAr\":\"TOGAF Enterprise Architecture Certification\",\"labelEn\":\"TOGAF Enterprise Architecture Certification\"},{\"value\":\"CERT-0054\",\"labelAr\":\"ITIL 4 Foundation\",\"labelEn\":\"ITIL 4 Foundation\"},{\"value\":\"CERT-0055\",\"labelAr\":\"ASQ Certified Six Sigma Green Belt (CSSGB)\",\"labelEn\":\"ASQ Certified Six Sigma Green Belt (CSSGB)\"},{\"value\":\"CERT-0056\",\"labelAr\":\"ASQ Certified Six Sigma Black Belt (CSSBB)\",\"labelEn\":\"ASQ Certified Six Sigma Black Belt (CSSBB)\"},{\"value\":\"CERT-0057\",\"labelAr\":\"ASQ Certified Quality Engineer (CQE)\",\"labelEn\":\"ASQ Certified Quality Engineer (CQE)\"},{\"value\":\"CERT-0058\",\"labelAr\":\"ASQ Certified Quality Auditor (CQA)\",\"labelEn\":\"ASQ Certified Quality Auditor (CQA)\"},{\"value\":\"CERT-0059\",\"labelAr\":\"ASQ Certified Manager of Quality/Organizational Excellence (CMQ/OE)\",\"labelEn\":\"ASQ Certified Manager of Quality/Organizational Excellence (CMQ/OE)\"},{\"value\":\"CERT-0060\",\"labelAr\":\"Certified Supply Chain Professional (CSCP)\",\"labelEn\":\"Certified Supply Chain Professional (CSCP)\"},{\"value\":\"CERT-0061\",\"labelAr\":\"Certified in Planning and Inventory Management (CPIM)\",\"labelEn\":\"Certified in Planning and Inventory Management (CPIM)\"},{\"value\":\"CERT-0062\",\"labelAr\":\"Certified in Logistics, Transportation and Distribution (CLTD)\",\"labelEn\":\"Certified in Logistics, Transportation and Distribution (CLTD)\"},{\"value\":\"CERT-0063\",\"labelAr\":\"SHRM Certified Professional (SHRM-CP)\",\"labelEn\":\"SHRM Certified Professional (SHRM-CP)\"},{\"value\":\"CERT-0064\",\"labelAr\":\"SHRM Senior Certified Professional (SHRM-SCP)\",\"labelEn\":\"SHRM Senior Certified Professional (SHRM-SCP)\"},{\"value\":\"CERT-0065\",\"labelAr\":\"Professional in Human Resources (PHR)\",\"labelEn\":\"Professional in Human Resources (PHR)\"},{\"value\":\"CERT-0066\",\"labelAr\":\"Senior Professional in Human Resources (SPHR)\",\"labelEn\":\"Senior Professional in Human Resources (SPHR)\"},{\"value\":\"CERT-0067\",\"labelAr\":\"Global Professional in Human Resources (GPHR)\",\"labelEn\":\"Global Professional in Human Resources (GPHR)\"},{\"value\":\"CERT-0068\",\"labelAr\":\"Certified Professional in Talent Development (CPTD)\",\"labelEn\":\"Certified Professional in Talent Development (CPTD)\"},{\"value\":\"CERT-0069\",\"labelAr\":\"ICF Associate Certified Coach (ACC)\",\"labelEn\":\"ICF Associate Certified Coach (ACC)\"},{\"value\":\"CERT-0070\",\"labelAr\":\"ICF Professional Certified Coach (PCC)\",\"labelEn\":\"ICF Professional Certified Coach (PCC)\"},{\"value\":\"CERT-0071\",\"labelAr\":\"ICF Master Certified Coach (MCC)\",\"labelEn\":\"ICF Master Certified Coach (MCC)\"},{\"value\":\"CERT-0072\",\"labelAr\":\"Nielsen Norman Group UX Certification\",\"labelEn\":\"Nielsen Norman Group UX Certification\"},{\"value\":\"CERT-0073\",\"labelAr\":\"IAAP Certified Professional in Accessibility Core Competencies (CPACC)\",\"labelEn\":\"IAAP Certified Professional in Accessibility Core Competencies (CPACC)\"},{\"value\":\"CERT-0074\",\"labelAr\":\"IAAP Web Accessibility Specialist (WAS)\",\"labelEn\":\"IAAP Web Accessibility Specialist (WAS)\"},{\"value\":\"CERT-0075\",\"labelAr\":\"Chartered Financial Analyst (CFA) Charterholder\",\"labelEn\":\"Chartered Financial Analyst (CFA) Charterholder\"},{\"value\":\"CERT-0076\",\"labelAr\":\"Certified Public Accountant (CPA)\",\"labelEn\":\"Certified Public Accountant (CPA)\"},{\"value\":\"CERT-0077\",\"labelAr\":\"Certified Management Accountant (CMA)\",\"labelEn\":\"Certified Management Accountant (CMA)\"},{\"value\":\"CERT-0078\",\"labelAr\":\"Certified Internal Auditor (CIA)\",\"labelEn\":\"Certified Internal Auditor (CIA)\"},{\"value\":\"CERT-0079\",\"labelAr\":\"ACCA Qualification (Association of Chartered Certified Accountants)\",\"labelEn\":\"ACCA Qualification (Association of Chartered Certified Accountants)\"},{\"value\":\"CERT-0080\",\"labelAr\":\"ICAEW Chartered Accountancy Qualification (ACA)\",\"labelEn\":\"ICAEW Chartered Accountancy Qualification (ACA)\"},{\"value\":\"CERT-0081\",\"labelAr\":\"CPA Australia Certified Practising Accountant\",\"labelEn\":\"CPA Australia Certified Practising Accountant\"},{\"value\":\"CERT-0082\",\"labelAr\":\"Certified Financial Planner (CFP)\",\"labelEn\":\"Certified Financial Planner (CFP)\"},{\"value\":\"CERT-0083\",\"labelAr\":\"Financial Risk Manager (FRM)\",\"labelEn\":\"Financial Risk Manager (FRM)\"},{\"value\":\"CERT-0084\",\"labelAr\":\"Energy Risk Professional (ERP)\",\"labelEn\":\"Energy Risk Professional (ERP)\"},{\"value\":\"CERT-0085\",\"labelAr\":\"Sustainability and Climate Risk (SCR) Certificate\",\"labelEn\":\"Sustainability and Climate Risk (SCR) Certificate\"},{\"value\":\"CERT-0086\",\"labelAr\":\"Chartered Alternative Investment Analyst (CAIA)\",\"labelEn\":\"Chartered Alternative Investment Analyst (CAIA)\"},{\"value\":\"CERT-0087\",\"labelAr\":\"Professional Risk Manager (PRM)\",\"labelEn\":\"Professional Risk Manager (PRM)\"},{\"value\":\"CERT-0088\",\"labelAr\":\"Chartered Market Technician (CMT)\",\"labelEn\":\"Chartered Market Technician (CMT)\"},{\"value\":\"CERT-0089\",\"labelAr\":\"Certified Fraud Examiner (CFE)\",\"labelEn\":\"Certified Fraud Examiner (CFE)\"},{\"value\":\"CERT-0090\",\"labelAr\":\"Certified Anti-Money Laundering Specialist (CAMS)\",\"labelEn\":\"Certified Anti-Money Laundering Specialist (CAMS)\"},{\"value\":\"CERT-0091\",\"labelAr\":\"Series 7 - General Securities Representative Qualification Examination\",\"labelEn\":\"Series 7 - General Securities Representative Qualification Examination\"},{\"value\":\"CERT-0092\",\"labelAr\":\"Series 24 - General Securities Principal Qualification Examination\",\"labelEn\":\"Series 24 - General Securities Principal Qualification Examination\"},{\"value\":\"CERT-0093\",\"labelAr\":\"Chartered Property Casualty Underwriter (CPCU)\",\"labelEn\":\"Chartered Property Casualty Underwriter (CPCU)\"},{\"value\":\"CERT-0094\",\"labelAr\":\"Associate of the Society of Actuaries (ASA)\",\"labelEn\":\"Associate of the Society of Actuaries (ASA)\"},{\"value\":\"CERT-0095\",\"labelAr\":\"Fellow of the Society of Actuaries (FSA)\",\"labelEn\":\"Fellow of the Society of Actuaries (FSA)\"},{\"value\":\"CERT-0096\",\"labelAr\":\"Chartered Insurance Institute Qualifications (ACII / FCII)\",\"labelEn\":\"Chartered Insurance Institute Qualifications (ACII / FCII)\"},{\"value\":\"CERT-0097\",\"labelAr\":\"Certified Information Systems Auditor (CISA)\",\"labelEn\":\"Certified Information Systems Auditor (CISA)\"},{\"value\":\"CERT-0098\",\"labelAr\":\"Certified Information Security Manager (CISM)\",\"labelEn\":\"Certified Information Security Manager (CISM)\"},{\"value\":\"CERT-0099\",\"labelAr\":\"Certified in Risk and Information Systems Control (CRISC)\",\"labelEn\":\"Certified in Risk and Information Systems Control (CRISC)\"},{\"value\":\"CERT-0100\",\"labelAr\":\"Certified in the Governance of Enterprise IT (CGEIT)\",\"labelEn\":\"Certified in the Governance of Enterprise IT (CGEIT)\"},{\"value\":\"CERT-0101\",\"labelAr\":\"Certified Data Privacy Solutions Engineer (CDPSE)\",\"labelEn\":\"Certified Data Privacy Solutions Engineer (CDPSE)\"},{\"value\":\"CERT-0102\",\"labelAr\":\"Certified Information Systems Security Professional (CISSP)\",\"labelEn\":\"Certified Information Systems Security Professional (CISSP)\"},{\"value\":\"CERT-0103\",\"labelAr\":\"Certified Cloud Security Professional (CCSP)\",\"labelEn\":\"Certified Cloud Security Professional (CCSP)\"},{\"value\":\"CERT-0104\",\"labelAr\":\"Systems Security Certified Practitioner (SSCP)\",\"labelEn\":\"Systems Security Certified Practitioner (SSCP)\"},{\"value\":\"CERT-0105\",\"labelAr\":\"Certified Secure Software Lifecycle Professional (CSSLP)\",\"labelEn\":\"Certified Secure Software Lifecycle Professional (CSSLP)\"},{\"value\":\"CERT-0106\",\"labelAr\":\"Certified in Governance, Risk and Compliance (CGRC)\",\"labelEn\":\"Certified in Governance, Risk and Compliance (CGRC)\"},{\"value\":\"CERT-0107\",\"labelAr\":\"Certified in Cybersecurity (CC)\",\"labelEn\":\"Certified in Cybersecurity (CC)\"},{\"value\":\"CERT-0108\",\"labelAr\":\"CompTIA A+\",\"labelEn\":\"CompTIA A+\"},{\"value\":\"CERT-0109\",\"labelAr\":\"CompTIA Network+\",\"labelEn\":\"CompTIA Network+\"},{\"value\":\"CERT-0110\",\"labelAr\":\"CompTIA Security+\",\"labelEn\":\"CompTIA Security+\"},{\"value\":\"CERT-0111\",\"labelAr\":\"CompTIA Cloud+\",\"labelEn\":\"CompTIA Cloud+\"},{\"value\":\"CERT-0112\",\"labelAr\":\"CompTIA Linux+\",\"labelEn\":\"CompTIA Linux+\"},{\"value\":\"CERT-0113\",\"labelAr\":\"CompTIA Server+\",\"labelEn\":\"CompTIA Server+\"},{\"value\":\"CERT-0114\",\"labelAr\":\"CompTIA Project+\",\"labelEn\":\"CompTIA Project+\"},{\"value\":\"CERT-0115\",\"labelAr\":\"CompTIA Data+\",\"labelEn\":\"CompTIA Data+\"},{\"value\":\"CERT-0116\",\"labelAr\":\"CompTIA Cybersecurity Analyst (CySA+)\",\"labelEn\":\"CompTIA Cybersecurity Analyst (CySA+)\"},{\"value\":\"CERT-0117\",\"labelAr\":\"CompTIA PenTest+\",\"labelEn\":\"CompTIA PenTest+\"},{\"value\":\"CERT-0118\",\"labelAr\":\"Certified Ethical Hacker (CEH)\",\"labelEn\":\"Certified Ethical Hacker (CEH)\"},{\"value\":\"CERT-0119\",\"labelAr\":\"Offensive Security Certified Professional (OSCP)\",\"labelEn\":\"Offensive Security Certified Professional (OSCP)\"},{\"value\":\"CERT-0120\",\"labelAr\":\"GIAC Security Essentials (GSEC)\",\"labelEn\":\"GIAC Security Essentials (GSEC)\"},{\"value\":\"CERT-0121\",\"labelAr\":\"GIAC Certified Incident Handler (GCIH)\",\"labelEn\":\"GIAC Certified Incident Handler (GCIH)\"},{\"value\":\"CERT-0122\",\"labelAr\":\"GIAC Penetration Tester (GPEN)\",\"labelEn\":\"GIAC Penetration Tester (GPEN)\"},{\"value\":\"CERT-0123\",\"labelAr\":\"GIAC Certified Forensic Analyst (GCFA)\",\"labelEn\":\"GIAC Certified Forensic Analyst (GCFA)\"},{\"value\":\"CERT-0124\",\"labelAr\":\"Certified Information Privacy Professional/Europe (CIPP/E)\",\"labelEn\":\"Certified Information Privacy Professional/Europe (CIPP/E)\"},{\"value\":\"CERT-0125\",\"labelAr\":\"Certified Information Privacy Professional/United States (CIPP/US)\",\"labelEn\":\"Certified Information Privacy Professional/United States (CIPP/US)\"},{\"value\":\"CERT-0126\",\"labelAr\":\"Certified Information Privacy Manager (CIPM)\",\"labelEn\":\"Certified Information Privacy Manager (CIPM)\"},{\"value\":\"CERT-0127\",\"labelAr\":\"Certified Information Privacy Technologist (CIPT)\",\"labelEn\":\"Certified Information Privacy Technologist (CIPT)\"},{\"value\":\"CERT-0128\",\"labelAr\":\"Artificial Intelligence Governance Professional (AIGP)\",\"labelEn\":\"Artificial Intelligence Governance Professional (AIGP)\"},{\"value\":\"CERT-0129\",\"labelAr\":\"AWS Certified Cloud Practitioner\",\"labelEn\":\"AWS Certified Cloud Practitioner\"},{\"value\":\"CERT-0130\",\"labelAr\":\"AWS Certified Solutions Architect - Associate\",\"labelEn\":\"AWS Certified Solutions Architect - Associate\"},{\"value\":\"CERT-0131\",\"labelAr\":\"AWS Certified Solutions Architect - Professional\",\"labelEn\":\"AWS Certified Solutions Architect - Professional\"},{\"value\":\"CERT-0132\",\"labelAr\":\"AWS Certified Developer - Associate\",\"labelEn\":\"AWS Certified Developer - Associate\"},{\"value\":\"CERT-0133\",\"labelAr\":\"AWS Certified DevOps Engineer - Professional\",\"labelEn\":\"AWS Certified DevOps Engineer - Professional\"},{\"value\":\"CERT-0134\",\"labelAr\":\"AWS Certified Security - Specialty\",\"labelEn\":\"AWS Certified Security - Specialty\"},{\"value\":\"CERT-0135\",\"labelAr\":\"Microsoft Certified: Azure Fundamentals\",\"labelEn\":\"Microsoft Certified: Azure Fundamentals\"},{\"value\":\"CERT-0136\",\"labelAr\":\"Microsoft Certified: Azure Administrator Associate\",\"labelEn\":\"Microsoft Certified: Azure Administrator Associate\"},{\"value\":\"CERT-0137\",\"labelAr\":\"Microsoft Certified: Azure Solutions Architect Expert\",\"labelEn\":\"Microsoft Certified: Azure Solutions Architect Expert\"},{\"value\":\"CERT-0138\",\"labelAr\":\"Microsoft Certified: Azure Developer Associate\",\"labelEn\":\"Microsoft Certified: Azure Developer Associate\"},{\"value\":\"CERT-0139\",\"labelAr\":\"Microsoft Certified: Azure Security Engineer Associate\",\"labelEn\":\"Microsoft Certified: Azure Security Engineer Associate\"},{\"value\":\"CERT-0140\",\"labelAr\":\"Microsoft Certified: Azure AI Fundamentals\",\"labelEn\":\"Microsoft Certified: Azure AI Fundamentals\"},{\"value\":\"CERT-0141\",\"labelAr\":\"Microsoft Certified: Azure Data Fundamentals\",\"labelEn\":\"Microsoft Certified: Azure Data Fundamentals\"},{\"value\":\"CERT-0142\",\"labelAr\":\"Microsoft Certified: Security, Compliance, and Identity Fundamentals\",\"labelEn\":\"Microsoft Certified: Security, Compliance, and Identity Fundamentals\"},{\"value\":\"CERT-0143\",\"labelAr\":\"Microsoft Certified: Power BI Data Analyst Associate\",\"labelEn\":\"Microsoft Certified: Power BI Data Analyst Associate\"},{\"value\":\"CERT-0144\",\"labelAr\":\"Microsoft 365 Fundamentals\",\"labelEn\":\"Microsoft 365 Fundamentals\"},{\"value\":\"CERT-0145\",\"labelAr\":\"Google Cloud Certified - Cloud Digital Leader\",\"labelEn\":\"Google Cloud Certified - Cloud Digital Leader\"},{\"value\":\"CERT-0146\",\"labelAr\":\"Google Cloud Certified - Associate Cloud Engineer\",\"labelEn\":\"Google Cloud Certified - Associate Cloud Engineer\"},{\"value\":\"CERT-0147\",\"labelAr\":\"Google Cloud Certified - Professional Cloud Architect\",\"labelEn\":\"Google Cloud Certified - Professional Cloud Architect\"},{\"value\":\"CERT-0148\",\"labelAr\":\"Google Cloud Certified - Professional Data Engineer\",\"labelEn\":\"Google Cloud Certified - Professional Data Engineer\"},{\"value\":\"CERT-0149\",\"labelAr\":\"Google Cloud Certified - Professional Cloud Developer\",\"labelEn\":\"Google Cloud Certified - Professional Cloud Developer\"},{\"value\":\"CERT-0150\",\"labelAr\":\"Google Cloud Certified - Professional Cloud Security Engineer\",\"labelEn\":\"Google Cloud Certified - Professional Cloud Security Engineer\"},{\"value\":\"CERT-0151\",\"labelAr\":\"Google Cloud Certified - Professional Machine Learning Engineer\",\"labelEn\":\"Google Cloud Certified - Professional Machine Learning Engineer\"},{\"value\":\"CERT-0152\",\"labelAr\":\"Google Cloud Certified - Professional Cloud DevOps Engineer\",\"labelEn\":\"Google Cloud Certified - Professional Cloud DevOps Engineer\"},{\"value\":\"CERT-0153\",\"labelAr\":\"Cisco Certified Network Associate (CCNA)\",\"labelEn\":\"Cisco Certified Network Associate (CCNA)\"},{\"value\":\"CERT-0154\",\"labelAr\":\"Certified Kubernetes Administrator (CKA)\",\"labelEn\":\"Certified Kubernetes Administrator (CKA)\"},{\"value\":\"CERT-0155\",\"labelAr\":\"Certified Kubernetes Application Developer (CKAD)\",\"labelEn\":\"Certified Kubernetes Application Developer (CKAD)\"},{\"value\":\"CERT-0156\",\"labelAr\":\"Certified Kubernetes Security Specialist (CKS)\",\"labelEn\":\"Certified Kubernetes Security Specialist (CKS)\"},{\"value\":\"CERT-0157\",\"labelAr\":\"HashiCorp Certified: Terraform Associate\",\"labelEn\":\"HashiCorp Certified: Terraform Associate\"},{\"value\":\"CERT-0158\",\"labelAr\":\"Red Hat Certified System Administrator (RHCSA)\",\"labelEn\":\"Red Hat Certified System Administrator (RHCSA)\"},{\"value\":\"CERT-0159\",\"labelAr\":\"Linux Professional Institute Certification Level 1 (LPIC-1)\",\"labelEn\":\"Linux Professional Institute Certification Level 1 (LPIC-1)\"},{\"value\":\"CERT-0160\",\"labelAr\":\"Salesforce Certified Administrator\",\"labelEn\":\"Salesforce Certified Administrator\"},{\"value\":\"CERT-0161\",\"labelAr\":\"United States Medical Licensing Examination (USMLE)\",\"labelEn\":\"United States Medical Licensing Examination (USMLE)\"},{\"value\":\"CERT-0162\",\"labelAr\":\"ECFMG Certification\",\"labelEn\":\"ECFMG Certification\"},{\"value\":\"CERT-0163\",\"labelAr\":\"American Board of Medical Specialties (ABMS) Board Certification\",\"labelEn\":\"American Board of Medical Specialties (ABMS) Board Certification\"},{\"value\":\"CERT-0164\",\"labelAr\":\"National Council Licensure Examination for Registered Nurses (NCLEX-RN)\",\"labelEn\":\"National Council Licensure Examination for Registered Nurses (NCLEX-RN)\"},{\"value\":\"CERT-0165\",\"labelAr\":\"North American Pharmacist Licensure Examination (NAPLEX)\",\"labelEn\":\"North American Pharmacist Licensure Examination (NAPLEX)\"},{\"value\":\"CERT-0166\",\"labelAr\":\"Medical Registration with a Licence to Practise (UK General Medical Council)\",\"labelEn\":\"Medical Registration with a Licence to Practise (UK General Medical Council)\"},{\"value\":\"CERT-0167\",\"labelAr\":\"ASCP Board of Certification (BOC) Credentials\",\"labelEn\":\"ASCP Board of Certification (BOC) Credentials\"},{\"value\":\"CERT-0168\",\"labelAr\":\"Professional Engineer (PE) License\",\"labelEn\":\"Professional Engineer (PE) License\"},{\"value\":\"CERT-0169\",\"labelAr\":\"Fundamentals of Engineering (FE) Examination / Engineer Intern Certification\",\"labelEn\":\"Fundamentals of Engineering (FE) Examination / Engineer Intern Certification\"},{\"value\":\"CERT-0170\",\"labelAr\":\"Chartered Engineer (CEng)\",\"labelEn\":\"Chartered Engineer (CEng)\"},{\"value\":\"CERT-0171\",\"labelAr\":\"Member of the Royal Institution of Chartered Surveyors (MRICS)\",\"labelEn\":\"Member of the Royal Institution of Chartered Surveyors (MRICS)\"},{\"value\":\"CERT-0172\",\"labelAr\":\"LEED Accredited Professional (LEED AP)\",\"labelEn\":\"LEED Accredited Professional (LEED AP)\"},{\"value\":\"CERT-0173\",\"labelAr\":\"Certified Safety Professional (CSP)\",\"labelEn\":\"Certified Safety Professional (CSP)\"},{\"value\":\"CERT-0174\",\"labelAr\":\"NEBOSH Qualifications in Occupational Health and Safety\",\"labelEn\":\"NEBOSH Qualifications in Occupational Health and Safety\"},{\"value\":\"CERT-0175\",\"labelAr\":\"Airline Transport Pilot (ATP) Certificate (FAA)\",\"labelEn\":\"Airline Transport Pilot (ATP) Certificate (FAA)\"},{\"value\":\"CERT-0176\",\"labelAr\":\"Certificate in Teaching English to Speakers of Other Languages (CELTA)\",\"labelEn\":\"Certificate in Teaching English to Speakers of Other Languages (CELTA)\"},{\"value\":\"CERT-0177\",\"labelAr\":\"Certified Strength and Conditioning Specialist (CSCS)\",\"labelEn\":\"Certified Strength and Conditioning Specialist (CSCS)\"},{\"value\":\"CERT-0178\",\"labelAr\":\"PRINCE2 Foundation\",\"labelEn\":\"PRINCE2 Foundation\"},{\"value\":\"CERT-0179\",\"labelAr\":\"PRINCE2 Practitioner\",\"labelEn\":\"PRINCE2 Practitioner\"},{\"value\":\"CERT-0180\",\"labelAr\":\"Certified Risk Management Specialist (CRMS)\",\"labelEn\":\"Certified Risk Management Specialist (CRMS)\"},{\"value\":\"CERT-0181\",\"labelAr\":\"Certified Credit Specialist (CCS)\",\"labelEn\":\"Certified Credit Specialist (CCS)\"},{\"value\":\"CERT-0182\",\"labelAr\":\"Certified Internal Audit Specialist (CIAS)\",\"labelEn\":\"Certified Internal Audit Specialist (CIAS)\"},{\"value\":\"CERT-0183\",\"labelAr\":\"Certified Anti-Fraud Practitioner (CAFP)\",\"labelEn\":\"Certified Anti-Fraud Practitioner (CAFP)\"},{\"value\":\"CERT-0184\",\"labelAr\":\"Foundation Risk Management Qualification in Financial Services (RMFS)\",\"labelEn\":\"Foundation Risk Management Qualification in Financial Services (RMFS)\"},{\"value\":\"CERT-0185\",\"labelAr\":\"Foreign Exchange Professional Exam (SAMA-mandated)\",\"labelEn\":\"Foreign Exchange Professional Exam (SAMA-mandated)\"},{\"value\":\"CERT-0186\",\"labelAr\":\"Retail Banking Foundations Exam (SAMA-mandated)\",\"labelEn\":\"Retail Banking Foundations Exam (SAMA-mandated)\"},{\"value\":\"CERT-0187\",\"labelAr\":\"Individuals Financing Fundamentals Professional Exam (IFFE)\",\"labelEn\":\"Individuals Financing Fundamentals Professional Exam (IFFE)\"},{\"value\":\"CERT-0188\",\"labelAr\":\"Fundamentals of Islamic Banking Professional Exam\",\"labelEn\":\"Fundamentals of Islamic Banking Professional Exam\"},{\"value\":\"CERT-0189\",\"labelAr\":\"Professional Exam for Compliance Officer in the Insurance Sector (SAMA-mandated)\",\"labelEn\":\"Professional Exam for Compliance Officer in the Insurance Sector (SAMA-mandated)\"},{\"value\":\"CERT-0190\",\"labelAr\":\"Certified Investor Relations Officer (CIRO) Certificate\",\"labelEn\":\"Certified Investor Relations Officer (CIRO) Certificate\"},{\"value\":\"CERT-0191\",\"labelAr\":\"CII Award in General Insurance (Non-UK) (W01/W02)\",\"labelEn\":\"CII Award in General Insurance (Non-UK) (W01/W02)\"},{\"value\":\"CERT-0192\",\"labelAr\":\"CII Award in Customer Service in Insurance (Non-UK) (W04)\",\"labelEn\":\"CII Award in Customer Service in Insurance (Non-UK) (W04)\"},{\"value\":\"CERT-0193\",\"labelAr\":\"CII General Insurance Business (IF2)\",\"labelEn\":\"CII General Insurance Business (IF2)\"},{\"value\":\"CERT-0194\",\"labelAr\":\"CII Insurance Business and Finance (M92)\",\"labelEn\":\"CII Insurance Business and Finance (M92)\"},{\"value\":\"CERT-0195\",\"labelAr\":\"CII Insurance Law (M05)\",\"labelEn\":\"CII Insurance Law (M05)\"},{\"value\":\"CERT-0196\",\"labelAr\":\"CII Insurance Broking Practice (M81)\",\"labelEn\":\"CII Insurance Broking Practice (M81)\"},{\"value\":\"CERT-0197\",\"labelAr\":\"CII Claims Practice (M85)\",\"labelEn\":\"CII Claims Practice (M85)\"},{\"value\":\"CERT-0198\",\"labelAr\":\"CII Insurance Underwriting Practice (M80)\",\"labelEn\":\"CII Insurance Underwriting Practice (M80)\"},{\"value\":\"CERT-0199\",\"labelAr\":\"CII Insurance Underwriting (Non-UK) (WUE/WUA)\",\"labelEn\":\"CII Insurance Underwriting (Non-UK) (WUE/WUA)\"},{\"value\":\"CERT-0200\",\"labelAr\":\"CII Reinsurance (M97)\",\"labelEn\":\"CII Reinsurance (M97)\"},{\"value\":\"CERT-0201\",\"labelAr\":\"SME Financing Expert Certificate\",\"labelEn\":\"SME Financing Expert Certificate\"},{\"value\":\"CERT-0202\",\"labelAr\":\"SME Financing Specialist Certificate\",\"labelEn\":\"SME Financing Specialist Certificate\"},{\"value\":\"CERT-0203\",\"labelAr\":\"Financial Awareness Expert Certificate\",\"labelEn\":\"Financial Awareness Expert Certificate\"},{\"value\":\"CERT-0204\",\"labelAr\":\"Certified Debt Collection Professional (CDCP)\",\"labelEn\":\"Certified Debt Collection Professional (CDCP)\"},{\"value\":\"CERT-0205\",\"labelAr\":\"Certified Export Credit Finance and Insurance Professional (CEFIP)\",\"labelEn\":\"Certified Export Credit Finance and Insurance Professional (CEFIP)\"},{\"value\":\"CERT-0206\",\"labelAr\":\"Certified Compliance Officer (CCO) Professional Exam\",\"labelEn\":\"Certified Compliance Officer (CCO) Professional Exam\"},{\"value\":\"CERT-0207\",\"labelAr\":\"Advanced Compliance Professional Certificate\",\"labelEn\":\"Advanced Compliance Professional Certificate\"},{\"value\":\"CERT-0208\",\"labelAr\":\"Professional Exam of Compliance in the Banks Sector\",\"labelEn\":\"Professional Exam of Compliance in the Banks Sector\"},{\"value\":\"CERT-0209\",\"labelAr\":\"Compliance and Sharia Audit Professional Exam (CSAP)\",\"labelEn\":\"Compliance and Sharia Audit Professional Exam (CSAP)\"},{\"value\":\"CERT-0210\",\"labelAr\":\"Insurance Claims Officer Professional Exam\",\"labelEn\":\"Insurance Claims Officer Professional Exam\"},{\"value\":\"CERT-0211\",\"labelAr\":\"Insurance Underwriting Officer Professional Exam\",\"labelEn\":\"Insurance Underwriting Officer Professional Exam\"},{\"value\":\"CERT-0212\",\"labelAr\":\"Insurance Underwriting Assistant Officer Professional Exam\",\"labelEn\":\"Insurance Underwriting Assistant Officer Professional Exam\"},{\"value\":\"CERT-0213\",\"labelAr\":\"Insurance Sales Officer Certificate\",\"labelEn\":\"Insurance Sales Officer Certificate\"},{\"value\":\"CERT-0214\",\"labelAr\":\"Insurance Claims Processing Officer Certificate\",\"labelEn\":\"Insurance Claims Processing Officer Certificate\"},{\"value\":\"CERT-0215\",\"labelAr\":\"Health Insurance Exam\",\"labelEn\":\"Health Insurance Exam\"},{\"value\":\"CERT-0216\",\"labelAr\":\"Motor Insurance Exam\",\"labelEn\":\"Motor Insurance Exam\"},{\"value\":\"CERT-0217\",\"labelAr\":\"Accident Inspector Certificate\",\"labelEn\":\"Accident Inspector Certificate\"},{\"value\":\"CERT-0218\",\"labelAr\":\"Credit Adviser Professional Certificate - Level 1\",\"labelEn\":\"Credit Adviser Professional Certificate - Level 1\"},{\"value\":\"CERT-0219\",\"labelAr\":\"Customer Service Employee Professional Certificate - Level 1\",\"labelEn\":\"Customer Service Employee Professional Certificate - Level 1\"},{\"value\":\"CERT-0220\",\"labelAr\":\"Foreign Exchange Employee Professional Certificate - Level 1\",\"labelEn\":\"Foreign Exchange Employee Professional Certificate - Level 1\"},{\"value\":\"CERT-0221\",\"labelAr\":\"Tadawul Saudi Exchange Broker (Registered Trader) Professional Exam (BPE)\",\"labelEn\":\"Tadawul Saudi Exchange Broker (Registered Trader) Professional Exam (BPE)\"},{\"value\":\"CERT-0222\",\"labelAr\":\"Tadawul Saudi Exchange Disclosure Professional Exam (IPE)\",\"labelEn\":\"Tadawul Saudi Exchange Disclosure Professional Exam (IPE)\"},{\"value\":\"CERT-0223\",\"labelAr\":\"Certified Anti-Money Laundering Specialist (CMAS)\",\"labelEn\":\"Certified Anti-Money Laundering Specialist (CMAS)\"},{\"value\":\"CERT-0224\",\"labelAr\":\"General Securities Qualification Examination (CME-1) - Legacy Series\",\"labelEn\":\"General Securities Qualification Examination (CME-1) - Legacy Series\"},{\"value\":\"CERT-0225\",\"labelAr\":\"Compliance, Anti-Money Laundering and Counter-Terrorist Financing Certificate Examination (CME-2) - Legacy Series\",\"labelEn\":\"Compliance, Anti-Money Laundering and Counter-Terrorist Financing Certificate Examination (CME-2) - Legacy Series\"},{\"value\":\"CERT-0226\",\"labelAr\":\"Securities Brokers Certificate Examination (CME-3) - Legacy Series\",\"labelEn\":\"Securities Brokers Certificate Examination (CME-3) - Legacy Series\"},{\"value\":\"CERT-0227\",\"labelAr\":\"CII Insurance Claims Handling (Non-UK) (WCE/WCA)\",\"labelEn\":\"CII Insurance Claims Handling (Non-UK) (WCE/WCA)\"},{\"value\":\"CERT-0228\",\"labelAr\":\"CII Commercial Property and Business Interruption Insurances (M93)\",\"labelEn\":\"CII Commercial Property and Business Interruption Insurances (M93)\"}],\"ownership\":\"expert-hub\",\"order\":1}",
        },
        new
        {
            FieldId = new Guid("ff000000-0000-0000-0007-000000000024"),
            SchemaVersion = Version,
            FieldCode = "issuingInstitution",
            SectionCode = "certifications",
            LabelAr = "الجهة المانحة",
            LabelEn = "Issuing institution",
            InputType = "text",
            OrderIndex = 24,
            Definition = "{\"id\":\"issuingInstitution\",\"type\":\"text\",\"sectionId\":\"certifications\",\"labelAr\":\"الجهة المانحة\",\"labelEn\":\"Issuing institution\",\"requiredFor\":[],\"ownership\":\"expert-hub\",\"order\":2}",
        },
        new
        {
            FieldId = new Guid("ff000000-0000-0000-0007-000000000025"),
            SchemaVersion = Version,
            FieldCode = "certificateDate",
            SectionCode = "certifications",
            LabelAr = "تاريخ الحصول",
            LabelEn = "Date obtained",
            InputType = "date",
            OrderIndex = 25,
            Definition = "{\"id\":\"certificateDate\",\"type\":\"date\",\"sectionId\":\"certifications\",\"labelAr\":\"تاريخ الحصول\",\"labelEn\":\"Date obtained\",\"requiredFor\":[],\"ownership\":\"expert-hub\",\"order\":3}",
        },
        new
        {
            FieldId = new Guid("ff000000-0000-0000-0007-000000000026"),
            SchemaVersion = Version,
            FieldCode = "certificateAttachmentName",
            SectionCode = "certifications",
            LabelAr = "اسم المرفق",
            LabelEn = "Attachment name",
            InputType = "text",
            OrderIndex = 26,
            Definition = "{\"id\":\"certificateAttachmentName\",\"type\":\"text\",\"sectionId\":\"certifications\",\"labelAr\":\"اسم المرفق\",\"labelEn\":\"Attachment name\",\"requiredFor\":[],\"ownership\":\"expert-hub\",\"order\":4}",
        },
        new
        {
            FieldId = new Guid("ff000000-0000-0000-0007-000000000027"),
            SchemaVersion = Version,
            FieldCode = "jobTitle",
            SectionCode = "experience",
            LabelAr = "المسمى الوظيفي",
            LabelEn = "Job title",
            InputType = "text",
            OrderIndex = 27,
            Definition = "{\"id\":\"jobTitle\",\"type\":\"text\",\"sectionId\":\"experience\",\"labelAr\":\"المسمى الوظيفي\",\"labelEn\":\"Job title\",\"requiredFor\":[\"trainer\",\"consultant\",\"content-developer\",\"question-writer\"],\"ownership\":\"expert-hub\",\"order\":1}",
        },
        new
        {
            FieldId = new Guid("ff000000-0000-0000-0007-000000000028"),
            SchemaVersion = Version,
            FieldCode = "organization",
            SectionCode = "experience",
            LabelAr = "جهة العمل",
            LabelEn = "Organization name",
            InputType = "text",
            OrderIndex = 28,
            Definition = "{\"id\":\"organization\",\"type\":\"text\",\"sectionId\":\"experience\",\"labelAr\":\"جهة العمل\",\"labelEn\":\"Organization name\",\"requiredFor\":[\"trainer\",\"consultant\",\"content-developer\",\"question-writer\"],\"ownership\":\"expert-hub\",\"order\":2}",
        },
        new
        {
            FieldId = new Guid("ff000000-0000-0000-0007-000000000029"),
            SchemaVersion = Version,
            FieldCode = "currentlyEmployed",
            SectionCode = "experience",
            LabelAr = "أنا أعمل حاليًا في هذا المنصب",
            LabelEn = "I currently work in this position",
            InputType = "checkbox",
            OrderIndex = 29,
            Definition = "{\"id\":\"currentlyEmployed\",\"type\":\"checkbox\",\"sectionId\":\"experience\",\"labelAr\":\"أنا أعمل حاليًا في هذا المنصب\",\"labelEn\":\"I currently work in this position\",\"requiredFor\":[],\"ownership\":\"expert-hub\",\"order\":3}",
        },
        new
        {
            FieldId = new Guid("ff000000-0000-0000-0007-000000000030"),
            SchemaVersion = Version,
            FieldCode = "partTimeRole",
            SectionCode = "experience",
            LabelAr = "هل العمل بدوام جزئي؟",
            LabelEn = "Is this a part-time role?",
            InputType = "checkbox",
            OrderIndex = 30,
            Definition = "{\"id\":\"partTimeRole\",\"type\":\"checkbox\",\"sectionId\":\"experience\",\"labelAr\":\"هل العمل بدوام جزئي؟\",\"labelEn\":\"Is this a part-time role?\",\"requiredFor\":[],\"ownership\":\"expert-hub\",\"order\":4}",
        },
        new
        {
            FieldId = new Guid("ff000000-0000-0000-0007-000000000031"),
            SchemaVersion = Version,
            FieldCode = "experienceStartDate",
            SectionCode = "experience",
            LabelAr = "تاريخ البدء",
            LabelEn = "Start date",
            InputType = "date",
            OrderIndex = 31,
            Definition = "{\"id\":\"experienceStartDate\",\"type\":\"date\",\"sectionId\":\"experience\",\"labelAr\":\"تاريخ البدء\",\"labelEn\":\"Start date\",\"requiredFor\":[\"trainer\",\"consultant\",\"content-developer\",\"question-writer\"],\"ownership\":\"expert-hub\",\"order\":5}",
        },
        new
        {
            FieldId = new Guid("ff000000-0000-0000-0007-000000000032"),
            SchemaVersion = Version,
            FieldCode = "responsibilities",
            SectionCode = "experience",
            LabelAr = "المسؤوليات",
            LabelEn = "Responsibilities",
            InputType = "textarea",
            OrderIndex = 32,
            Definition = "{\"id\":\"responsibilities\",\"type\":\"textarea\",\"sectionId\":\"experience\",\"labelAr\":\"المسؤوليات\",\"labelEn\":\"Responsibilities\",\"helpAr\":\"أدخل كل مسؤولية في سطر مستقل.\",\"helpEn\":\"Enter each item on a new line.\",\"requiredFor\":[\"trainer\",\"consultant\",\"content-developer\",\"question-writer\"],\"ownership\":\"expert-hub\",\"order\":6}",
        },
        new
        {
            FieldId = new Guid("ff000000-0000-0000-0007-000000000033"),
            SchemaVersion = Version,
            FieldCode = "experienceEndDate",
            SectionCode = "experience",
            LabelAr = "تاريخ الانتهاء",
            LabelEn = "End date",
            InputType = "date",
            OrderIndex = 33,
            Definition = "{\"id\":\"experienceEndDate\",\"type\":\"date\",\"sectionId\":\"experience\",\"labelAr\":\"تاريخ الانتهاء\",\"labelEn\":\"End date\",\"requiredFor\":[],\"dependsOn\":{\"fieldId\":\"currentlyEmployed\",\"notEquals\":true},\"ownership\":\"expert-hub\",\"order\":7}",
        },
        new
        {
            FieldId = new Guid("ff000000-0000-0000-0007-000000000034"),
            SchemaVersion = Version,
            FieldCode = "yearsOfExperience",
            SectionCode = "experience",
            LabelAr = "عدد سنوات الخبرة",
            LabelEn = "Years of experience",
            InputType = "select",
            OrderIndex = 34,
            Definition = "{\"id\":\"yearsOfExperience\",\"type\":\"select\",\"sectionId\":\"experience\",\"labelAr\":\"عدد سنوات الخبرة\",\"labelEn\":\"Years of experience\",\"requiredFor\":[],\"options\":[{\"value\":\"1-5\",\"labelAr\":\"من 1 إلى 5 سنوات\",\"labelEn\":\"1 to 5 years\"},{\"value\":\"5-10\",\"labelAr\":\"من 5 إلى 10 سنوات\",\"labelEn\":\"5 to 10 years\"},{\"value\":\"11-15\",\"labelAr\":\"من 11 إلى 15 سنة\",\"labelEn\":\"11 to 15 years\"},{\"value\":\"16-plus\",\"labelAr\":\"16 سنة فأكثر\",\"labelEn\":\"16+ years\"}],\"ownership\":\"expert-hub\",\"order\":8}",
        },
        new
        {
            FieldId = new Guid("ff000000-0000-0000-0007-000000000035"),
            SchemaVersion = Version,
            FieldCode = "participationTypes",
            SectionCode = "training-content",
            LabelAr = "أنواع المشاركات السابقة",
            LabelEn = "Previous participation types",
            InputType = "multi-select",
            OrderIndex = 35,
            Definition = "{\"id\":\"participationTypes\",\"type\":\"multi-select\",\"sectionId\":\"training-content\",\"labelAr\":\"أنواع المشاركات السابقة\",\"labelEn\":\"Previous participation types\",\"helpAr\":\"اختر كل ما ينطبق.\",\"helpEn\":\"Select all that apply.\",\"requiredFor\":[\"trainer\",\"consultant\",\"content-developer\",\"question-writer\"],\"options\":[{\"value\":\"official-programs\",\"labelAr\":\"برامج تدريبية رسمية\",\"labelEn\":\"Official training programs\"},{\"value\":\"workshops\",\"labelAr\":\"ورش عمل متخصصة\",\"labelEn\":\"Specialized workshops\"},{\"value\":\"academic-lectures\",\"labelAr\":\"محاضرات أكاديمية\",\"labelEn\":\"Academic lectures\"},{\"value\":\"conferences\",\"labelAr\":\"مؤتمرات وملتقيات مهنية\",\"labelEn\":\"Conferences & professional forums\"},{\"value\":\"panels\",\"labelAr\":\"حلقات نقاش\",\"labelEn\":\"Panel discussions\"},{\"value\":\"mentoring\",\"labelAr\":\"إرشاد وتوجيه فردي\",\"labelEn\":\"Individual mentoring/coaching\"},{\"value\":\"writing-research\",\"labelAr\":\"كتابة متخصصة ونشر أوراق بحثية\",\"labelEn\":\"Specialized writing & research paper publishing\"},{\"value\":\"digital-content\",\"labelAr\":\"محتوى رقمي / بودكاست / يوتيوب\",\"labelEn\":\"Digital content / podcast / YouTube\"}],\"ownership\":\"expert-hub\",\"order\":1}",
        },
        new
        {
            FieldId = new Guid("ff000000-0000-0000-0007-000000000036"),
            SchemaVersion = Version,
            FieldCode = "audiences",
            SectionCode = "training-content",
            LabelAr = "الفئات التي يمكنك مخاطبتها بفعالية",
            LabelEn = "Audiences you can effectively address",
            InputType = "multi-select",
            OrderIndex = 36,
            Definition = "{\"id\":\"audiences\",\"type\":\"multi-select\",\"sectionId\":\"training-content\",\"labelAr\":\"الفئات التي يمكنك مخاطبتها بفعالية\",\"labelEn\":\"Audiences you can effectively address\",\"helpAr\":\"اختر كل ما ينطبق.\",\"helpEn\":\"Select all that apply.\",\"requiredFor\":[\"trainer\",\"consultant\",\"content-developer\",\"question-writer\"],\"options\":[{\"value\":\"university-students\",\"labelAr\":\"طلاب الجامعات\",\"labelEn\":\"University students\"},{\"value\":\"new-graduates\",\"labelAr\":\"الخريجون الجدد\",\"labelEn\":\"New graduates\"},{\"value\":\"mid-career\",\"labelAr\":\"المهنيون في منتصف المسار\",\"labelEn\":\"Mid-career professionals\"},{\"value\":\"executives\",\"labelAr\":\"القيادات التنفيذية والعليا\",\"labelEn\":\"Executive & senior leadership\"},{\"value\":\"general-public\",\"labelAr\":\"عموم الجمهور\",\"labelEn\":\"General public\"}],\"ownership\":\"expert-hub\",\"order\":2}",
        },
        new
        {
            FieldId = new Guid("ff000000-0000-0000-0007-000000000037"),
            SchemaVersion = Version,
            FieldCode = "trainingLanguages",
            SectionCode = "training-content",
            LabelAr = "اللغة",
            LabelEn = "Language",
            InputType = "select",
            OrderIndex = 37,
            Definition = "{\"id\":\"trainingLanguages\",\"type\":\"select\",\"sectionId\":\"training-content\",\"labelAr\":\"اللغة\",\"labelEn\":\"Language\",\"requiredFor\":[],\"options\":[{\"value\":\"ar\",\"labelAr\":\"عربي\",\"labelEn\":\"Arabic\"},{\"value\":\"en\",\"labelAr\":\"إنجليزي\",\"labelEn\":\"English\"},{\"value\":\"bilingual\",\"labelAr\":\"ثنائي اللغة\",\"labelEn\":\"Bilingual\"}],\"ownership\":\"expert-hub\",\"order\":3}",
        },
        new
        {
            FieldId = new Guid("ff000000-0000-0000-0007-000000000038"),
            SchemaVersion = Version,
            FieldCode = "hasTrainedBefore",
            SectionCode = "training-content",
            LabelAr = "هل سبق لك التدريب أو التحدث في فعاليات؟",
            LabelEn = "Have you previously trained or spoken at events?",
            InputType = "select",
            OrderIndex = 38,
            Definition = "{\"id\":\"hasTrainedBefore\",\"type\":\"select\",\"sectionId\":\"training-content\",\"labelAr\":\"هل سبق لك التدريب أو التحدث في فعاليات؟\",\"labelEn\":\"Have you previously trained or spoken at events?\",\"requiredFor\":[\"trainer\"],\"options\":[{\"value\":\"yes\",\"labelAr\":\"نعم\",\"labelEn\":\"Yes\"},{\"value\":\"no\",\"labelAr\":\"لا\",\"labelEn\":\"No\"}],\"ownership\":\"expert-hub\",\"order\":4}",
        },
        new
        {
            FieldId = new Guid("ff000000-0000-0000-0007-000000000039"),
            SchemaVersion = Version,
            FieldCode = "trainedBeforeDetails",
            SectionCode = "training-content",
            LabelAr = "تفاصيل الخبرات السابقة في التدريب أو التحدث في الفعاليات",
            LabelEn = "Previous training or speaking experience details",
            InputType = "textarea",
            OrderIndex = 39,
            Definition = "{\"id\":\"trainedBeforeDetails\",\"type\":\"textarea\",\"sectionId\":\"training-content\",\"labelAr\":\"تفاصيل الخبرات السابقة في التدريب أو التحدث في الفعاليات\",\"labelEn\":\"Previous training or speaking experience details\",\"helpAr\":\"أدخل كل تجربة في سطر مستقل.\",\"helpEn\":\"Enter each item on a new line.\",\"requiredFor\":[],\"dependsOn\":{\"fieldId\":\"hasTrainedBefore\",\"equals\":\"yes\"},\"ownership\":\"expert-hub\",\"order\":5}",
        },
        new
        {
            FieldId = new Guid("ff000000-0000-0000-0007-000000000040"),
            SchemaVersion = Version,
            FieldCode = "hasReadyMaterials",
            SectionCode = "training-content",
            LabelAr = "هل لديك مواد أو حقائب تدريبية جاهزة؟",
            LabelEn = "Do you have ready-made training materials or kits?",
            InputType = "select",
            OrderIndex = 40,
            Definition = "{\"id\":\"hasReadyMaterials\",\"type\":\"select\",\"sectionId\":\"training-content\",\"labelAr\":\"هل لديك مواد أو حقائب تدريبية جاهزة؟\",\"labelEn\":\"Do you have ready-made training materials or kits?\",\"requiredFor\":[\"trainer\",\"consultant\",\"content-developer\",\"question-writer\"],\"visibleFor\":[\"trainer\",\"content-developer\",\"question-writer\"],\"options\":[{\"value\":\"yes\",\"labelAr\":\"نعم\",\"labelEn\":\"Yes\"},{\"value\":\"no\",\"labelAr\":\"لا\",\"labelEn\":\"No\"}],\"ownership\":\"expert-hub\",\"order\":6}",
        },
        new
        {
            FieldId = new Guid("ff000000-0000-0000-0007-000000000041"),
            SchemaVersion = Version,
            FieldCode = "preferredDeliveryMode",
            SectionCode = "training-content",
            LabelAr = "نمط التقديم المفضل لديك",
            LabelEn = "Your preferred delivery mode",
            InputType = "select",
            OrderIndex = 41,
            Definition = "{\"id\":\"preferredDeliveryMode\",\"type\":\"select\",\"sectionId\":\"training-content\",\"labelAr\":\"نمط التقديم المفضل لديك\",\"labelEn\":\"Your preferred delivery mode\",\"requiredFor\":[\"trainer\"],\"options\":[{\"value\":\"online\",\"labelAr\":\"عن بعد\",\"labelEn\":\"Online\"},{\"value\":\"onsite\",\"labelAr\":\"حضوري\",\"labelEn\":\"On-site\"},{\"value\":\"blended\",\"labelAr\":\"حضوري وعن بعد\",\"labelEn\":\"On-site and online\"}],\"visibleFor\":[\"trainer\"],\"ownership\":\"expert-hub\",\"order\":7}",
        },
        new
        {
            FieldId = new Guid("ff000000-0000-0000-0007-000000000042"),
            SchemaVersion = Version,
            FieldCode = "portfolioLinks",
            SectionCode = "training-content",
            LabelAr = "روابط نماذج الأعمال أو مقاطع تقديمية",
            LabelEn = "Portfolio / sample work links",
            InputType = "text",
            OrderIndex = 42,
            Definition = "{\"id\":\"portfolioLinks\",\"type\":\"text\",\"sectionId\":\"training-content\",\"labelAr\":\"روابط نماذج الأعمال أو مقاطع تقديمية\",\"labelEn\":\"Portfolio / sample work links\",\"helpAr\":\"رابط لفيديو تعريفي أو ملف عرض أو حلقة بودكاست أو أي نموذج من أعمالك.\",\"helpEn\":\"A link to an intro video, presentation, podcast episode, or any sample of your work.\",\"requiredFor\":[],\"validation\":{\"pattern\":\"^https?://\\\\S+$\",\"patternMessageAr\":\"أدخل رابطًا صحيحًا يبدأ بـ http:// أو https://\",\"patternMessageEn\":\"Enter a valid link starting with http:// or https://\"},\"ownership\":\"expert-hub\",\"order\":8}",
        },
        new
        {
            FieldId = new Guid("ff000000-0000-0000-0007-000000000043"),
            SchemaVersion = Version,
            FieldCode = "trainingExperienceYears",
            SectionCode = "training-content",
            LabelAr = "سنوات الخبرة التدريبية",
            LabelEn = "Years of training experience",
            InputType = "select",
            OrderIndex = 43,
            Definition = "{\"id\":\"trainingExperienceYears\",\"type\":\"select\",\"sectionId\":\"training-content\",\"labelAr\":\"سنوات الخبرة التدريبية\",\"labelEn\":\"Years of training experience\",\"requiredFor\":[\"trainer\"],\"visibleFor\":[\"trainer\"],\"options\":[{\"value\":\"less-than-2\",\"labelAr\":\"أقل من سنتين\",\"labelEn\":\"Less than 2 years\"},{\"value\":\"3-5\",\"labelAr\":\"3–5 سنوات\",\"labelEn\":\"3–5 years\"},{\"value\":\"6-10\",\"labelAr\":\"6–10 سنوات\",\"labelEn\":\"6–10 years\"},{\"value\":\"more-than-10\",\"labelAr\":\"أكثر من 10 سنوات\",\"labelEn\":\"More than 10 years\"}],\"ownership\":\"expert-hub\",\"order\":9}",
        },
        new
        {
            FieldId = new Guid("ff000000-0000-0000-0007-000000000044"),
            SchemaVersion = Version,
            FieldCode = "consultingExperienceYears",
            SectionCode = "training-content",
            LabelAr = "سنوات خبرة استشارات",
            LabelEn = "Years of consulting experience",
            InputType = "select",
            OrderIndex = 44,
            Definition = "{\"id\":\"consultingExperienceYears\",\"type\":\"select\",\"sectionId\":\"training-content\",\"labelAr\":\"سنوات خبرة استشارات\",\"labelEn\":\"Years of consulting experience\",\"requiredFor\":[\"consultant\"],\"visibleFor\":[\"consultant\"],\"options\":[{\"value\":\"less-than-2\",\"labelAr\":\"أقل من سنتين\",\"labelEn\":\"Less than 2 years\"},{\"value\":\"3-5\",\"labelAr\":\"3–5 سنوات\",\"labelEn\":\"3–5 years\"},{\"value\":\"6-10\",\"labelAr\":\"6–10 سنوات\",\"labelEn\":\"6–10 years\"},{\"value\":\"more-than-10\",\"labelAr\":\"أكثر من 10 سنوات\",\"labelEn\":\"More than 10 years\"}],\"ownership\":\"expert-hub\",\"order\":9.1}",
        },
        new
        {
            FieldId = new Guid("ff000000-0000-0000-0007-000000000045"),
            SchemaVersion = Version,
            FieldCode = "readyConsultingMaterials",
            SectionCode = "training-content",
            LabelAr = "هل لديك مواد أو استشارات جاهزة؟",
            LabelEn = "Do you have ready consulting materials?",
            InputType = "select",
            OrderIndex = 45,
            Definition = "{\"id\":\"readyConsultingMaterials\",\"type\":\"select\",\"sectionId\":\"training-content\",\"labelAr\":\"هل لديك مواد أو استشارات جاهزة؟\",\"labelEn\":\"Do you have ready consulting materials?\",\"requiredFor\":[\"consultant\"],\"visibleFor\":[\"consultant\"],\"options\":[{\"value\":\"yes\",\"labelAr\":\"نعم\",\"labelEn\":\"Yes\"},{\"value\":\"no\",\"labelAr\":\"لا\",\"labelEn\":\"No\"}],\"ownership\":\"expert-hub\",\"order\":9.2}",
        },
        new
        {
            FieldId = new Guid("ff000000-0000-0000-0007-000000000046"),
            SchemaVersion = Version,
            FieldCode = "contentQuestionExperienceYears",
            SectionCode = "training-content",
            LabelAr = "الخبرة في تطوير المحتوى أو كتابة الأسئلة بالسنوات",
            LabelEn = "Years of experience — content development / question writing",
            InputType = "select",
            OrderIndex = 46,
            Definition = "{\"id\":\"contentQuestionExperienceYears\",\"type\":\"select\",\"sectionId\":\"training-content\",\"labelAr\":\"الخبرة في تطوير المحتوى أو كتابة الأسئلة بالسنوات\",\"labelEn\":\"Years of experience — content development / question writing\",\"requiredFor\":[\"content-developer\",\"question-writer\"],\"visibleFor\":[\"content-developer\",\"question-writer\"],\"options\":[{\"value\":\"less-than-2\",\"labelAr\":\"أقل من سنتين\",\"labelEn\":\"Less than 2 years\"},{\"value\":\"3-5\",\"labelAr\":\"3–5 سنوات\",\"labelEn\":\"3–5 years\"},{\"value\":\"6-10\",\"labelAr\":\"6–10 سنوات\",\"labelEn\":\"6–10 years\"},{\"value\":\"more-than-10\",\"labelAr\":\"أكثر من 10 سنوات\",\"labelEn\":\"More than 10 years\"}],\"ownership\":\"expert-hub\",\"order\":9.3}",
        },
        new
        {
            FieldId = new Guid("ff000000-0000-0000-0007-000000000047"),
            SchemaVersion = Version,
            FieldCode = "trainingDaysFinancialSector",
            SectionCode = "training-content",
            LabelAr = "عدد أيام تدريب البنوك والخدمات المالية والتأمين خلال آخر 12 شهرًا",
            LabelEn = "Training days (financial sector) — last 12 months",
            InputType = "select",
            OrderIndex = 47,
            Definition = "{\"id\":\"trainingDaysFinancialSector\",\"type\":\"select\",\"sectionId\":\"training-content\",\"labelAr\":\"عدد أيام تدريب البنوك والخدمات المالية والتأمين خلال آخر 12 شهرًا\",\"labelEn\":\"Training days (financial sector) — last 12 months\",\"requiredFor\":[],\"options\":[{\"value\":\"10-20\",\"labelAr\":\"10–20 يومًا\",\"labelEn\":\"10–20 days\"},{\"value\":\"21-45\",\"labelAr\":\"21–45 يومًا\",\"labelEn\":\"21–45 days\"},{\"value\":\"46-75\",\"labelAr\":\"46–75 يومًا\",\"labelEn\":\"46–75 days\"},{\"value\":\"76+\",\"labelAr\":\"76 يومًا فأكثر\",\"labelEn\":\"76+ days\"}],\"ownership\":\"expert-hub\",\"order\":10}",
        },
        new
        {
            FieldId = new Guid("ff000000-0000-0000-0007-000000000048"),
            SchemaVersion = Version,
            FieldCode = "preferredPrograms",
            SectionCode = "training-content",
            LabelAr = "بناءً على اطلاعكم على موقع الأكاديمية المالية، ما هي أبرز البرامج التدريبية أو الورش أو الفعاليات التي ترغبون في تقديمها؟",
            LabelEn = "Preferred programs/workshops to deliver",
            InputType = "select",
            OrderIndex = 48,
            Definition = "{\"id\":\"preferredPrograms\",\"type\":\"select\",\"sectionId\":\"training-content\",\"labelAr\":\"بناءً على اطلاعكم على موقع الأكاديمية المالية، ما هي أبرز البرامج التدريبية أو الورش أو الفعاليات التي ترغبون في تقديمها؟\",\"labelEn\":\"Preferred programs/workshops to deliver\",\"requiredFor\":[],\"options\":[{\"value\":\"fa-programs\",\"labelAr\":\"برامج الأكاديمية المالية\",\"labelEn\":\"FA Programs\"},{\"value\":\"events\",\"labelAr\":\"الفعاليات\",\"labelEn\":\"Events\"}],\"ownership\":\"expert-hub\",\"order\":11}",
        },
        new
        {
            FieldId = new Guid("ff000000-0000-0000-0007-000000000049"),
            SchemaVersion = Version,
            FieldCode = "trainingDaysSameTopics",
            SectionCode = "training-content",
            LabelAr = "عدد أيام التدريب لذات المواضيع خلال آخر 12 شهرًا",
            LabelEn = "Training days (same topics) — last 12 months",
            InputType = "select",
            OrderIndex = 49,
            Definition = "{\"id\":\"trainingDaysSameTopics\",\"type\":\"select\",\"sectionId\":\"training-content\",\"labelAr\":\"عدد أيام التدريب لذات المواضيع خلال آخر 12 شهرًا\",\"labelEn\":\"Training days (same topics) — last 12 months\",\"requiredFor\":[],\"options\":[{\"value\":\"less-than-10\",\"labelAr\":\"أقل من 10 أيام\",\"labelEn\":\"Less than 10 days\"},{\"value\":\"11-20\",\"labelAr\":\"11–20 يومًا\",\"labelEn\":\"11–20 days\"},{\"value\":\"21-45\",\"labelAr\":\"21–45 يومًا\",\"labelEn\":\"21–45 days\"},{\"value\":\"45+\",\"labelAr\":\"أكثر من 45 يومًا\",\"labelEn\":\"45+ days\"}],\"ownership\":\"expert-hub\",\"order\":12}",
        },
        new
        {
            FieldId = new Guid("ff000000-0000-0000-0007-000000000050"),
            SchemaVersion = Version,
            FieldCode = "engagementMode",
            SectionCode = "availability",
            LabelAr = "نمط التعامل",
            LabelEn = "Engagement mode",
            InputType = "select",
            OrderIndex = 50,
            Definition = "{\"id\":\"engagementMode\",\"type\":\"select\",\"sectionId\":\"availability\",\"labelAr\":\"نمط التعامل\",\"labelEn\":\"Engagement mode\",\"requiredFor\":[\"trainer\",\"consultant\",\"content-developer\",\"question-writer\"],\"options\":[{\"value\":\"full-time\",\"labelAr\":\"تفرغ كامل\",\"labelEn\":\"Full-time\"},{\"value\":\"part-time\",\"labelAr\":\"تفرغ جزئي\",\"labelEn\":\"Part-time\"}],\"ownership\":\"expert-hub\",\"order\":0}",
        },
        new
        {
            FieldId = new Guid("ff000000-0000-0000-0007-000000000051"),
            SchemaVersion = Version,
            FieldCode = "annualAvailability",
            SectionCode = "availability",
            LabelAr = "مدى التوفر خلال العام",
            LabelEn = "Availability throughout the year",
            InputType = "select",
            OrderIndex = 51,
            Definition = "{\"id\":\"annualAvailability\",\"type\":\"select\",\"sectionId\":\"availability\",\"labelAr\":\"مدى التوفر خلال العام\",\"labelEn\":\"Availability throughout the year\",\"requiredFor\":[\"trainer\",\"consultant\",\"content-developer\",\"question-writer\"],\"options\":[{\"value\":\"throughout-year\",\"labelAr\":\"طوال العام\",\"labelEn\":\"Throughout the year\"},{\"value\":\"specific-months\",\"labelAr\":\"أشهر محددة\",\"labelEn\":\"Specific months\"},{\"value\":\"specific-periods\",\"labelAr\":\"فترات محددة\",\"labelEn\":\"Specific periods\"},{\"value\":\"upon-request\",\"labelAr\":\"حسب الطلب\",\"labelEn\":\"Upon request\"}],\"ownership\":\"expert-hub\",\"order\":1}",
        },
        new
        {
            FieldId = new Guid("ff000000-0000-0000-0007-000000000052"),
            SchemaVersion = Version,
            FieldCode = "estimatedAnnualEngagements",
            SectionCode = "availability",
            LabelAr = "عدد المشاركات الممكنة سنويًا (تقريبًا)",
            LabelEn = "Estimated number of engagements per year",
            InputType = "select",
            OrderIndex = 52,
            Definition = "{\"id\":\"estimatedAnnualEngagements\",\"type\":\"select\",\"sectionId\":\"availability\",\"labelAr\":\"عدد المشاركات الممكنة سنويًا (تقريبًا)\",\"labelEn\":\"Estimated number of engagements per year\",\"requiredFor\":[\"trainer\",\"consultant\",\"content-developer\",\"question-writer\"],\"options\":[{\"value\":\"1-3\",\"labelAr\":\"1–3 مشاركات\",\"labelEn\":\"1–3 engagements\"},{\"value\":\"4-6\",\"labelAr\":\"4–6 مشاركات\",\"labelEn\":\"4–6 engagements\"},{\"value\":\"7+\",\"labelAr\":\"أكثر من 6 مشاركات\",\"labelEn\":\"More than 6 engagements\"}],\"ownership\":\"expert-hub\",\"order\":2}",
        },
        new
        {
            FieldId = new Guid("ff000000-0000-0000-0007-000000000053"),
            SchemaVersion = Version,
            FieldCode = "inPersonCities",
            SectionCode = "availability",
            LabelAr = "المدن المتاح فيها الحضور الشخصي",
            LabelEn = "Cities available for in-person attendance",
            InputType = "text",
            OrderIndex = 53,
            Definition = "{\"id\":\"inPersonCities\",\"type\":\"text\",\"sectionId\":\"availability\",\"labelAr\":\"المدن المتاح فيها الحضور الشخصي\",\"labelEn\":\"Cities available for in-person attendance\",\"helpAr\":\"مثال: الرياض، جدة، الدمام، أبوظبي.\",\"helpEn\":\"Example: Riyadh, Jeddah, Dammam, Abu Dhabi.\",\"requiredFor\":[\"trainer\",\"consultant\",\"content-developer\",\"question-writer\"],\"ownership\":\"expert-hub\",\"order\":3}",
        },
        new
        {
            FieldId = new Guid("ff000000-0000-0000-0007-000000000054"),
            SchemaVersion = Version,
            FieldCode = "preferredEngagementTypes",
            SectionCode = "availability",
            LabelAr = "أنواع المشاركات التي تفضلها",
            LabelEn = "Preferred engagement types",
            InputType = "multi-select",
            OrderIndex = 54,
            Definition = "{\"id\":\"preferredEngagementTypes\",\"type\":\"multi-select\",\"sectionId\":\"availability\",\"labelAr\":\"أنواع المشاركات التي تفضلها\",\"labelEn\":\"Preferred engagement types\",\"helpAr\":\"اختر كل ما ينطبق.\",\"helpEn\":\"Select all that apply.\",\"requiredFor\":[\"trainer\",\"consultant\",\"content-developer\",\"question-writer\"],\"options\":[{\"value\":\"short-training\",\"labelAr\":\"تدريب قصير (يوم أو أيام)\",\"labelEn\":\"Short-term training (day(s))\"},{\"value\":\"long-training\",\"labelAr\":\"تدريب طويل (أسابيع)\",\"labelEn\":\"Long-term training (weeks)\"},{\"value\":\"intensive-workshops\",\"labelAr\":\"ورش عمل مكثفة\",\"labelEn\":\"Intensive workshops\"},{\"value\":\"panels-hosting\",\"labelAr\":\"حلقات نقاش واستضافات\",\"labelEn\":\"Panel discussions & hosting\"},{\"value\":\"remote-training\",\"labelAr\":\"تدريب عن بُعد\",\"labelEn\":\"Remote/virtual training\"},{\"value\":\"community-initiatives\",\"labelAr\":\"مبادرات مجتمعية وتوعوية\",\"labelEn\":\"Community & awareness initiatives\"},{\"value\":\"student-programs\",\"labelAr\":\"برامج طلابية وجامعية\",\"labelEn\":\"Student & university programs\"},{\"value\":\"ongoing-mentoring\",\"labelAr\":\"إرشاد فردي مستمر\",\"labelEn\":\"Ongoing individual mentoring\"}],\"ownership\":\"expert-hub\",\"order\":4}",
        },
        new
        {
            FieldId = new Guid("ff000000-0000-0000-0007-000000000055"),
            SchemaVersion = Version,
            FieldCode = "weekdayAvailability",
            SectionCode = "availability",
            LabelAr = "متاح للتدريب أو الاستشارات خلال أيام الأسبوع",
            LabelEn = "Available during weekdays",
            InputType = "multi-select",
            OrderIndex = 55,
            Definition = "{\"id\":\"weekdayAvailability\",\"type\":\"multi-select\",\"sectionId\":\"availability\",\"labelAr\":\"متاح للتدريب أو الاستشارات خلال أيام الأسبوع\",\"labelEn\":\"Available during weekdays\",\"helpAr\":\"اختر كل ما ينطبق.\",\"helpEn\":\"Select all that apply.\",\"requiredFor\":[],\"options\":[{\"value\":\"sunday\",\"labelAr\":\"الأحد\",\"labelEn\":\"Sunday\"},{\"value\":\"monday\",\"labelAr\":\"الاثنين\",\"labelEn\":\"Monday\"},{\"value\":\"tuesday\",\"labelAr\":\"الثلاثاء\",\"labelEn\":\"Tuesday\"},{\"value\":\"wednesday\",\"labelAr\":\"الأربعاء\",\"labelEn\":\"Wednesday\"},{\"value\":\"thursday\",\"labelAr\":\"الخميس\",\"labelEn\":\"Thursday\"},{\"value\":\"friday\",\"labelAr\":\"الجمعة\",\"labelEn\":\"Friday\"},{\"value\":\"saturday\",\"labelAr\":\"السبت\",\"labelEn\":\"Saturday\"}],\"ownership\":\"expert-hub\",\"order\":5}",
        },
        new
        {
            FieldId = new Guid("ff000000-0000-0000-0007-000000000056"),
            SchemaVersion = Version,
            FieldCode = "dailyTrainingHours",
            SectionCode = "availability",
            LabelAr = "متاح لعدد من ساعات التدريب أو الاستشارات في اليوم",
            LabelEn = "Available hours per day",
            InputType = "number",
            OrderIndex = 56,
            Definition = "{\"id\":\"dailyTrainingHours\",\"type\":\"number\",\"sectionId\":\"availability\",\"labelAr\":\"متاح لعدد من ساعات التدريب أو الاستشارات في اليوم\",\"labelEn\":\"Available hours per day\",\"requiredFor\":[],\"validation\":{\"pattern\":\"^[0-9]+$\",\"min\":1,\"max\":24,\"patternMessageAr\":\"أدخل عددًا صحيحًا من 1 إلى 24.\",\"patternMessageEn\":\"Enter a whole number from 1 to 24.\"},\"ownership\":\"expert-hub\",\"order\":6}",
        },
        new
        {
            FieldId = new Guid("ff000000-0000-0000-0007-000000000057"),
            SchemaVersion = Version,
            FieldCode = "preferredPeriods",
            SectionCode = "availability",
            LabelAr = "الفترات المفضلة",
            LabelEn = "Preferred periods",
            InputType = "select",
            OrderIndex = 57,
            Definition = "{\"id\":\"preferredPeriods\",\"type\":\"select\",\"sectionId\":\"availability\",\"labelAr\":\"الفترات المفضلة\",\"labelEn\":\"Preferred periods\",\"requiredFor\":[],\"options\":[{\"value\":\"morning\",\"labelAr\":\"صباحًا\",\"labelEn\":\"Morning\"},{\"value\":\"noon\",\"labelAr\":\"ظهرًا\",\"labelEn\":\"Noon\"},{\"value\":\"evening\",\"labelAr\":\"مساءً\",\"labelEn\":\"Evening\"},{\"value\":\"weekend\",\"labelAr\":\"نهاية الأسبوع\",\"labelEn\":\"Weekend\"}],\"ownership\":\"expert-hub\",\"order\":7}",
        },
    ];

    internal static readonly object[] Attachments =
    [
        new
        {
            RuleId = new Guid("fa000000-0000-0000-0007-000000000001"),
            SchemaVersion = Version,
            RuleCode = "photo",
            LabelAr = "الصورة الشخصية",
            LabelEn = "Profile picture",
            AcceptedFormats = "[\"jpg\",\"jpeg\",\"png\"]",
            MaxSizeMb = 1,
            MaxCount = 1,
            RequiredFor = "[]",
            PerEntryOf = (string?)null,
        },
        new
        {
            RuleId = new Guid("fa000000-0000-0000-0007-000000000002"),
            SchemaVersion = Version,
            RuleCode = "cv",
            LabelAr = "السيرة الذاتية",
            LabelEn = "CV / résumé",
            AcceptedFormats = "[\"pdf\",\"doc\",\"docx\"]",
            MaxSizeMb = 1,
            MaxCount = 1,
            RequiredFor = "[\"trainer\",\"consultant\",\"content-developer\",\"question-writer\"]",
            PerEntryOf = (string?)null,
        },
        new
        {
            RuleId = new Guid("fa000000-0000-0000-0007-000000000003"),
            SchemaVersion = Version,
            RuleCode = "qualification-certificate",
            LabelAr = "شهادة التأهيل العلمي",
            LabelEn = "Qualification certificate",
            AcceptedFormats = "[\"pdf\",\"doc\",\"docx\"]",
            MaxSizeMb = 1,
            MaxCount = 1,
            RequiredFor = "[\"trainer\",\"consultant\",\"content-developer\",\"question-writer\"]",
            PerEntryOf = "education",
        },
        new
        {
            RuleId = new Guid("fa000000-0000-0000-0007-000000000004"),
            SchemaVersion = Version,
            RuleCode = "professional-certificate",
            LabelAr = "الشهادة المهنية",
            LabelEn = "Professional certificate",
            AcceptedFormats = "[\"pdf\",\"doc\",\"docx\"]",
            MaxSizeMb = 1,
            MaxCount = 1,
            RequiredFor = "[\"trainer\",\"consultant\",\"content-developer\",\"question-writer\"]",
            PerEntryOf = "certifications",
        },
        new
        {
            RuleId = new Guid("fa000000-0000-0000-0007-000000000005"),
            SchemaVersion = Version,
            RuleCode = "client-referrals",
            LabelAr = "إحالات العملاء / شهادات المشاركين",
            LabelEn = "Client referrals / testimonials",
            AcceptedFormats = "[\"pdf\",\"doc\",\"docx\"]",
            MaxSizeMb = 1,
            MaxCount = 20,
            RequiredFor = "[]",
            PerEntryOf = (string?)null,
        },
    ];
}
