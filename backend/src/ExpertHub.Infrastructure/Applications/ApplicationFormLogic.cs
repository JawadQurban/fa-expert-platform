using System.Globalization;
using System.Text.Json;
using System.Text.RegularExpressions;
using ExpertHub.Core.Domain;

namespace ExpertHub.Infrastructure.Applications;

/// <summary>
/// A form field's definition, as the rules engine reads it — deserialized
/// from `FORM_FIELD.definition`, which carries the frontend's
/// `ApplicationFieldSchema` verbatim.
/// </summary>
public sealed record FieldDefinition(
    string Id,
    string Type,
    string SectionId,
    IReadOnlyList<string> RequiredFor,
    IReadOnlyList<string>? VisibleFor,
    FieldDependency? DependsOn,
    FieldValidation? Validation,
    IReadOnlyList<FieldOption>? Options,
    bool? ReadOnly);

/// <summary>`dependsOn` — `equals` / `notEquals` are `string | boolean` on the
/// wire, each optional (an absent one is <see cref="JsonValueKind.Undefined"/>);
/// the property cannot be named `Equals` in C#, so the JSON names are mapped.</summary>
public sealed record FieldDependency(
    string FieldId,
    [property: System.Text.Json.Serialization.JsonPropertyName("equals")] JsonElement EqualsValue,
    [property: System.Text.Json.Serialization.JsonPropertyName("notEquals")] JsonElement NotEqualsValue = default);

/// <summary>`Min`/`Max` bound a `number` field (inclusive, whole numbers).</summary>
public sealed record FieldValidation(int? MaxLength, string? Pattern, int? Min = null, int? Max = null);

public sealed record FieldOption(string Value);

/// <summary>
/// The server half of `applicationValidation.ts` — the same visibility,
/// required-by-union (`BR-0104`) and completeness (`BR-0105`) rules, run
/// against the stored schema at save and submit. The frontend validates for
/// UX; this is the enforcement, and the two read the same schema rows so
/// they cannot drift.
/// </summary>
public static partial class ApplicationFormLogic
{
    public static readonly JsonSerializerOptions WireJson = new(JsonSerializerDefaults.Web);

    public static FieldDefinition Parse(string definitionJson) =>
        JsonSerializer.Deserialize<FieldDefinition>(definitionJson, WireJson)
            ?? throw new InvalidOperationException("FORM_FIELD.definition is unreadable.");

    /// <summary>`isFieldVisible`: service intersection, then the dependency.</summary>
    public static bool IsVisible(
        FieldDefinition field,
        IReadOnlyList<string> services,
        IReadOnlyDictionary<string, JsonElement> values)
    {
        if (field.VisibleFor is not null && !field.VisibleFor.Any(services.Contains))
        {
            return false;
        }
        if (field.DependsOn is not { } dependency)
        {
            return true;
        }
        // A missing value is Undefined: never equal to anything, so it hides an
        // `equals` field and shows a `notEquals` one.
        values.TryGetValue(dependency.FieldId, out var actual);
        if (dependency.EqualsValue.ValueKind is not JsonValueKind.Undefined
            && !JsonValueEquals(actual, dependency.EqualsValue))
        {
            return false;
        }
        return dependency.NotEqualsValue.ValueKind is JsonValueKind.Undefined
            || !JsonValueEquals(actual, dependency.NotEqualsValue);
    }

    /// <summary>`BR-0104`: required when required by ≥1 selected service.</summary>
    public static bool IsRequired(FieldDefinition field, IReadOnlyList<string> services) =>
        field.RequiredFor.Any(services.Contains);

    /// <summary>
    /// The completeness gate (`BR-0105`) — field codes that fail, in schema
    /// order. Mirrors `validateCompleteness`: only visible fields are judged,
    /// required means non-empty, and the shape rules (max length, pattern,
    /// option membership) apply to whatever was provided.
    /// </summary>
    public static IReadOnlyList<string> MissingOrInvalidFields(
        IReadOnlyList<FieldDefinition> fields,
        IReadOnlyList<string> services,
        IReadOnlyDictionary<string, JsonElement> values)
    {
        var failed = new List<string>();
        foreach (var field in fields)
        {
            if (!IsVisible(field, services, values))
            {
                continue;
            }
            values.TryGetValue(field.Id, out var value);
            var isEmpty = IsEmpty(field, value);
            if (isEmpty)
            {
                if (IsRequired(field, services))
                {
                    failed.Add(field.Id);
                }
                continue;
            }
            if (!ShapeIsValid(field, value))
            {
                failed.Add(field.Id);
            }
        }
        return failed;
    }

    /// <summary>Required attachment rules with no stored file (`BR-0105`'s file half).</summary>
    public static IReadOnlyList<string> MissingAttachmentRules(
        IEnumerable<(string RuleCode, IReadOnlyList<string> RequiredFor)> rules,
        IReadOnlyList<string> services,
        IReadOnlyCollection<string> presentRuleCodes) =>
        rules
            .Where(rule => rule.RequiredFor.Any(services.Contains)
                && !presentRuleCodes.Contains(rule.RuleCode))
            .Select(rule => rule.RuleCode)
            .ToList();

    private static bool IsEmpty(FieldDefinition field, JsonElement value) =>
        field.Type switch
        {
            // A required checkbox means "must be ticked".
            "checkbox" => value.ValueKind is not JsonValueKind.True,
            "multi-select" => value.ValueKind is not JsonValueKind.Array || value.GetArrayLength() == 0,
            _ => value.ValueKind is not JsonValueKind.String
                || string.IsNullOrWhiteSpace(value.GetString()),
        };

    private static bool ShapeIsValid(FieldDefinition field, JsonElement value)
    {
        if (field.Type is "select" && field.Options is { Count: > 0 })
        {
            var chosen = value.GetString();
            return field.Options.Any(option => option.Value == chosen);
        }
        if (field.Type is "multi-select" && field.Options is { Count: > 0 })
        {
            return value.EnumerateArray().All(item =>
                item.ValueKind is JsonValueKind.String
                && field.Options.Any(option => option.Value == item.GetString()));
        }
        if (value.ValueKind is JsonValueKind.String)
        {
            var text = value.GetString() ?? string.Empty;
            if (field.Validation?.MaxLength is { } maxLength && text.Length > maxLength)
            {
                return false;
            }
            if (field.Validation?.Pattern is { } pattern && !Matches(text, pattern))
            {
                return false;
            }
            // Whole-number bounds — a `number` field's value is its digits.
            if (field.Validation is { Min: not null } or { Max: not null })
            {
                return int.TryParse(text, NumberStyles.None, CultureInfo.InvariantCulture, out var number)
                    && (field.Validation.Min is not { } min || number >= min)
                    && (field.Validation.Max is not { } max || number <= max);
            }
        }
        return true;
    }

    private static bool Matches(string text, string pattern)
    {
        try
        {
            return Regex.IsMatch(text, pattern, RegexOptions.None, TimeSpan.FromSeconds(1));
        }
        catch (RegexMatchTimeoutException)
        {
            return false;
        }
    }

    private static bool JsonValueEquals(JsonElement actual, JsonElement expected) =>
        (actual.ValueKind, expected.ValueKind) switch
        {
            (JsonValueKind.String, JsonValueKind.String) => actual.GetString() == expected.GetString(),
            (JsonValueKind.True, JsonValueKind.True) => true,
            (JsonValueKind.False, JsonValueKind.False) => true,
            _ => false,
        };
}
