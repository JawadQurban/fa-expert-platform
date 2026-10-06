namespace ExpertHub.Infrastructure.Persistence;

/// <summary>
/// The central agreement template, seeded — the frontend's own `DM-GAP-16`
/// draft (`mockAgreementTemplate.ts`): only start and end date are CONFIRMED
/// fields, marked required; the third is a labelled placeholder exercising
/// the type. The body text is a labelled draft — `BR-0306`'s fixed legal text
/// is the Academy's to write, in the J-12/F4 template screen this seed makes
/// editable.
/// </summary>
internal static class AgreementSeedData
{
    internal const string TemplateVersion = "mock-dm-gap-16-draft.1";

    internal static readonly Guid TemplateId = new("a9000000-0000-0000-0000-000000000001");

    internal static readonly object[] Templates =
    [
        new
        {
            TemplateId,
            Name = "الاتفاقية الموحدة",
            Version = TemplateVersion,
            BodyText =
                "⚠️ نص تجريبي — بانتظار النص القانوني المعتمد (DM-GAP-16). " +
                "تُبرم هذه الاتفاقية بين الأكاديمية المالية والخبير المعتمد لتقديم " +
                "الخدمات الموضحة في ملحق الخدمات، وفق الشروط والأحكام المعتمدة.",
            FieldMap =
                """[{"id":"startDate","label":{"ar":"تاريخ بداية الاتفاقية","en":"Agreement start date"},"type":"date","required":true,"help":{"ar":"محدَّد ومعتمد في الرحلة.","en":"Confirmed by the journey."}},{"id":"endDate","label":{"ar":"تاريخ نهاية الاتفاقية","en":"Agreement end date"},"type":"date","required":true,"help":{"ar":"سنة للاعتماد الأول، وثلاث سنوات لكل تجديد (BR-0302).","en":"One year on first accreditation, three years on each renewal (BR-0302)."}},{"id":"referenceNote","label":{"ar":"ملاحظة مرجعية","en":"Reference note"},"type":"text","required":false,"help":{"ar":"حقل تجريبي — بانتظار مصفوفة الحقول المعتمدة (DM-GAP-16).","en":"Placeholder field — pending the approved field matrix (DM-GAP-16)."}}]""",
            Services = """["trainer","consultant","content-developer","question-writer"]""",
            IsActive = true,
            UpdatedAt = new DateTime(2026, 8, 31, 0, 0, 0, DateTimeKind.Utc),
            UpdatedBy = (Guid?)null,
        },
    ];
}
