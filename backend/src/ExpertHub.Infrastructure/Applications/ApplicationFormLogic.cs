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

/// <summary>One entry of a repeatable section, as submitted —
/// `ApplicationEntryDto`. A missing id is filled the way the form fills it.</summary>
public sealed record FormEntry(string? EntryId, IReadOnlyDictionary<string, JsonElement> Values);

/// <summary>An attachment rule as the completeness gate reads it.
/// <paramref name="PerEntryOf"/> names the repeatable section whose entries
/// carry the file, NULL for an application-level rule.</summary>
public sealed record AttachmentRequirement(
    string RuleCode, IReadOnlyList<string> RequiredFor, string? PerEntryOf);

/// <summary>
/// The server half of `applicationValidation.ts` — the same visibility,
/// required-by-union (`BR-0104`) and completeness (`BR-0105`) rules, run
/// against the stored schema at save and submit. The frontend validates for
/// UX; this is the enforcement, and the two read the same schema rows so
/// they cannot drift.
/// </summary>
public static partial class ApplicationFormLogic
{
    /// <summary>`ENTRY_KEY_SEPARATOR` — joins an entry id to a field id.</summary>
    public const string EntryKeySeparator = "::";

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

    /// <summary>
    /// The whole-form gate: `validateCompleteness`. A field in a REPEATABLE
    /// section is judged once per entry, against that entry's own values, and
    /// fails as <c>entryId::fieldId</c>; every other field is judged against
    /// the flat <paramref name="values"/>.
    /// </summary>
    /// <remarks>
    /// ⚠️ The form sends a repeatable section's answers in
    /// `entries` only. Judging them against the flat map
    /// (which never holds them) failed every live submission with
    /// "Application is incomplete.", whatever the applicant had filled in.
    /// </remarks>
    public static IReadOnlyList<string> MissingOrInvalidFields(
        IReadOnlyList<FieldDefinition> fields,
        IReadOnlyList<string> services,
        IReadOnlyDictionary<string, JsonElement> values,
        IReadOnlyDictionary<string, IReadOnlyList<FormEntry>> normalizedEntries)
    {
        var flatFields = fields
            .Where(f => !normalizedEntries.ContainsKey(f.SectionId))
            .ToList();
        var failed = MissingOrInvalidFields(flatFields, services, values).ToList();
        foreach (var (sectionId, sectionEntries) in normalizedEntries)
        {
            var sectionFields = fields.Where(f => f.SectionId == sectionId).ToList();
            foreach (var entry in sectionEntries)
            {
                failed.AddRange(MissingOrInvalidFields(sectionFields, services, entry.Values)
                    .Select(fieldId => $"{entry.EntryId}{EntryKeySeparator}{fieldId}"));
            }
        }
        return failed;
    }

    /// <summary>
    /// `normalizeEntries`: every repeatable section's entries, whatever shape
    /// they arrived in. Supplied entries are used as-is (an empty list is an
    /// answer); an absent section becomes one entry built from the flat values
    /// when any of them is filled (every draft saved before
    /// `dm-gap-01.2026-09-21`); then blank entries pad it to its minimum.
    /// <paramref name="minEntriesBySection"/> maps each repeatable section
    /// code to its `minEntries`.
    /// </summary>
    public static IReadOnlyDictionary<string, IReadOnlyList<FormEntry>> NormalizeEntries(
        IReadOnlyList<FieldDefinition> fields,
        IReadOnlyDictionary<string, int> minEntriesBySection,
        IReadOnlyDictionary<string, JsonElement> values,
        IReadOnlyDictionary<string, IReadOnlyList<FormEntry>>? entries)
    {
        var normalized = new Dictionary<string, IReadOnlyList<FormEntry>>(StringComparer.Ordinal);
        foreach (var (sectionId, minEntries) in minEntriesBySection)
        {
            var list = entries is not null && entries.TryGetValue(sectionId, out var supplied)
                ? supplied
                    .Select((entry, index) => entry with
                    {
                        EntryId = string.IsNullOrEmpty(entry.EntryId)
                            ? $"{sectionId}-{index + 1}"
                            : entry.EntryId,
                    })
                    .ToList()
                : LegacyEntries(fields, sectionId, values);
            while (list.Count < minEntries)
            {
                list.Add(new FormEntry(
                    $"{sectionId}-{list.Count + 1}", new Dictionary<string, JsonElement>()));
            }
            normalized[sectionId] = list;
        }
        return normalized;
    }

    private static List<FormEntry> LegacyEntries(
        IReadOnlyList<FieldDefinition> fields,
        string sectionId,
        IReadOnlyDictionary<string, JsonElement> values)
    {
        var entryValues = fields
            .Where(f => f.SectionId == sectionId && values.ContainsKey(f.Id))
            .ToDictionary(f => f.Id, f => values[f.Id], StringComparer.Ordinal);
        var filled = entryValues.Values.Any(value => value.ValueKind switch
        {
            JsonValueKind.String => value.GetString() != string.Empty,
            JsonValueKind.False or JsonValueKind.Null or JsonValueKind.Undefined => false,
            JsonValueKind.Array => value.GetArrayLength() > 0,
            _ => true,
        });
        return filled ? [new FormEntry($"{sectionId}-1", entryValues)] : [];
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

    /// <summary>
    /// The file half with per-entry rules: a rule that attaches to a
    /// repeatable section's entries is required only when that section HAS an
    /// entry — an applicant who lists no professional certificate owes no
    /// certificate file.
    /// </summary>
    /// <remarks>
    /// ⚠️ `APPLICATION_ATTACHMENT` does not record which entry a file belongs
    /// to, so a per-entry rule is satisfied by any stored file for it — the
    /// one-file-per-entry check stays with the form until it does.
    /// </remarks>
    public static IReadOnlyList<string> MissingAttachmentRules(
        IEnumerable<AttachmentRequirement> rules,
        IReadOnlyList<string> services,
        IReadOnlyCollection<string> presentRuleCodes,
        IReadOnlyDictionary<string, IReadOnlyList<FormEntry>> normalizedEntries) =>
        MissingAttachmentRules(
            rules
                .Where(rule => rule.PerEntryOf is null
                    || (normalizedEntries.TryGetValue(rule.PerEntryOf, out var sectionEntries)
                        && sectionEntries.Count > 0))
                .Select(rule => (rule.RuleCode, rule.RequiredFor)),
            services,
            presentRuleCodes);

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
