namespace ExpertHub.Api.Tests;

/// <summary>
/// A value that satisfies a patterned form field's OWN rule — the identity
/// field's (`D-01`) is not the social link's, and since `dm-gap-01.2026-10-28`
/// (J-01/F1 AC-6, BUG-015) an Arabic name, an English name, a LinkedIn link
/// and a free-text field each have one of their own.
/// </summary>
internal static class TestFormValues
{
    internal static string Patterned(string fieldId) => fieldId switch
    {
        "idNumber" => "1012345678",
        "linkedin" => "https://www.linkedin.com/in/profile",
        "personalWebsite" or "portfolioLinks" => "https://example.com/profile",
        _ when fieldId.EndsWith("NameEn", StringComparison.Ordinal) => "Test",
        _ when fieldId.EndsWith("NameAr", StringComparison.Ordinal) => "تجربة",
        // Free text that must contain letters, and the list of cities.
        _ => "قيمة تجريبية",
    };
}
