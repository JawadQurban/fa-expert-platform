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
    bool? ReadOnly,
    FieldDependency? RequiredWhen = null,
    string? OptionsSource = null);

/// <summary>`dependsOn` — `equals` / `notEquals` are `string | boolean` on the
/// wire, each optional (an absent one is <see cref="JsonValueKind.Undefined"/>);
/// the property cannot be named `Equals` in C#, so the JSON names are mapped.</summary>
public sealed record FieldDependency(
    string FieldId,
    [property: System.Text.Json.Serialization.JsonPropertyName("equals")] JsonElement EqualsValue,
    [property: System.Text.Json.Serialization.JsonPropertyName("notEquals")] JsonElement NotEqualsValue = default);

/// <summary>`Min`/`Max` bound a `number` field (inclusive, whole numbers).
/// `MinDate`/`MaxDate` bound a `date` field (`today` or an ISO date);
/// `NotBefore` names the date field in the same values it may not precede.</summary>
public sealed record FieldValidation(
    int? MaxLength,
    string? Pattern,
    int? Min = null,
    int? Max = null,
    string? MinDate = null,
    string? MaxDate = null,
    string? NotBefore = null);

/// <summary>One option. The labels travel too, so a reader can show the name
/// a stored code stands for (BUG-004/BUG-005).</summary>
public sealed record FieldOption(string Value, string? LabelAr = null, string? LabelEn = null);

/// <summary>One entry of a repeatable section, as submitted —
/// `ApplicationEntryDto`. A missing id is filled the way the form fills it.</summary>
public sealed record FormEntry(string? EntryId, IReadOnlyDictionary<string, JsonElement> Values);

/// <summary>An attachment rule as the completeness gate reads it.
/// <paramref name="PerEntryOf"/> names the repeatable section whose entries
/// carry the file, NULL for an application-level rule.</summary>
public sealed record AttachmentRequirement(
    string RuleCode, IReadOnlyList<string> RequiredFor, string? PerEntryOf);

/// <summary>A stored file as the completeness gate reads it: its rule, and
/// for a per-entry rule the entry it belongs to (`P-394`).</summary>
public sealed record StoredAttachment(string RuleCode, string? EntryId);

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

    /// <summary>
    /// A multi-select's choice of an option fetched at runtime
    /// (<c>optionsSource</c>) carries its own names — <c>&lt;source&gt;:&lt;id&gt;|&lt;Arabic&gt;|&lt;English&gt;</c>
    /// — so the answer reads the same after the source changes (BUG-004,
    /// `P-386`). The form's `RUNTIME_CHOICE_PATTERN`, verbatim.
    /// </summary>
    public const string RuntimeChoicePattern = @"^[a-z]+:[A-Za-z0-9-]{1,64}\|[^|]{1,300}\|[^|]{1,300}$";

    private const char ChoiceSeparator = '|';

    /// <summary>The option value a stored choice stands for: a snapshot's head,
    /// or the stored text itself.</summary>
    public static string ChoiceValue(string stored)
    {
        ArgumentNullException.ThrowIfNull(stored);
        var cut = stored.IndexOf(ChoiceSeparator, StringComparison.Ordinal);
        return cut < 0 ? stored : stored[..cut];
    }

    /// <summary>
    /// A stored answer as a person reads it, in Arabic: an option's label (a
    /// FAST programme by the name stored with it), «نعم»/«لا» for a tick, and
    /// anything else as stored. A code is never shown where a name exists.
    /// </summary>
    public static string DisplayText(FieldDefinition field, JsonElement value)
    {
        ArgumentNullException.ThrowIfNull(field);
        string Label(string stored)
        {
            var code = ChoiceValue(stored);
            if (field.Options?.FirstOrDefault(o => o.Value == code) is { LabelAr: { Length: > 0 } label })
            {
                return label;
            }
            var parts = stored.Split(ChoiceSeparator);
            return parts.Length == 3 && parts[1].Length > 0 ? parts[1] : stored;
        }
        return value.ValueKind switch
        {
            JsonValueKind.String => Label(value.GetString() ?? string.Empty),
            JsonValueKind.True => "نعم",
            JsonValueKind.False => "لا",
            JsonValueKind.Array => string.Join("، ", value.EnumerateArray()
                .Where(item => item.ValueKind == JsonValueKind.String)
                .Select(item => Label(item.GetString()!))),
            JsonValueKind.Undefined or JsonValueKind.Null => string.Empty,
            _ => value.GetRawText(),
        };
    }

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
        return Holds(field.DependsOn, values);
    }

    /// <summary>A `dependsOn` / `requiredWhen` condition; none always holds.</summary>
    private static bool Holds(FieldDependency? dependency, IReadOnlyDictionary<string, JsonElement> values)
    {
        if (dependency is null)
        {
            return true;
        }
        // A missing value is Undefined: never equal to anything, so it fails an
        // `equals` condition and meets a `notEquals` one.
        values.TryGetValue(dependency.FieldId, out var actual);
        if (dependency.EqualsValue.ValueKind is not JsonValueKind.Undefined
            && !ConditionMatches(actual, dependency.EqualsValue))
        {
            return false;
        }
        return dependency.NotEqualsValue.ValueKind is JsonValueKind.Undefined
            || !ConditionMatches(actual, dependency.NotEqualsValue);
    }

    /// <summary>
    /// One value against a condition's operand. A multi-select «equals» an
    /// option when it INCLUDES it — «أخرى» among the chosen programmes
    /// (BUG-004). Mirrors `conditionMatches`.
    /// </summary>
    private static bool ConditionMatches(JsonElement actual, JsonElement expected) =>
        actual.ValueKind is JsonValueKind.Array
            ? expected.ValueKind is JsonValueKind.String
                && actual.EnumerateArray().Any(item => item.ValueKind is JsonValueKind.String
                    && ChoiceValue(item.GetString()!) == expected.GetString())
            : JsonValueEquals(actual, expected);

    /// <summary>
    /// BUG-006 — whether <paramref name="field"/> is the text box that names a
    /// select's «أخرى»: a `text` field shown only while another field's select
    /// holds one of its own options («التخصص (أخرى)», «اسم الشهادة (أخرى)»,
    /// «المجال (أخرى)»). A reader sees it folded into its select, so the
    /// answer reads as what the applicant wrote. Mirrors `isOtherTextField`.
    /// </summary>
    public static bool IsOtherNaming(FieldDefinition field, IReadOnlyList<FieldDefinition> fields)
    {
        ArgumentNullException.ThrowIfNull(field);
        ArgumentNullException.ThrowIfNull(fields);
        if (field.Type != "text"
            || field.DependsOn is not { } dependency
            || dependency.EqualsValue.ValueKind is not JsonValueKind.String)
        {
            return false;
        }
        var option = dependency.EqualsValue.GetString();
        return fields.FirstOrDefault(f => f.Id == dependency.FieldId) is { Type: "select" or "multi-select", Options: { } options }
            && options.Any(o => o.Value == option);
    }

    /// <summary>
    /// BUG-006 — what the applicant wrote for a select answered «أخرى», or
    /// null when the select holds a listed value or nothing was written.
    /// Mirrors `otherAnswerText`.
    /// </summary>
    public static string? OtherAnswerText(
        FieldDefinition select,
        IReadOnlyList<FieldDefinition> fields,
        IReadOnlyDictionary<string, JsonElement> values)
    {
        ArgumentNullException.ThrowIfNull(select);
        ArgumentNullException.ThrowIfNull(fields);
        ArgumentNullException.ThrowIfNull(values);
        if (!values.TryGetValue(select.Id, out var chosen))
        {
            return null;
        }
        string? TypedFor(string option)
        {
            var naming = fields.FirstOrDefault(f =>
                f.DependsOn is { EqualsValue.ValueKind: JsonValueKind.String } dependency
                && dependency.FieldId == select.Id
                && dependency.EqualsValue.GetString() == option
                && IsOtherNaming(f, fields));
            return naming is not null
                && values.TryGetValue(naming.Id, out var typed)
                && typed.ValueKind is JsonValueKind.String
                && !string.IsNullOrWhiteSpace(typed.GetString())
                    ? typed.GetString()!.Trim()
                    : null;
        }
        if (select.Type == "select" && chosen.ValueKind is JsonValueKind.String)
        {
            return TypedFor(chosen.GetString()!);
        }
        if (select.Type != "multi-select" || chosen.ValueKind is not JsonValueKind.Array)
        {
            return null;
        }
        // BUG-004 — «أخرى» among the chosen programmes reads as what was
        // written, in its place in the list. Mirrors `otherAnswerText`.
        var items = chosen.EnumerateArray()
            .Where(item => item.ValueKind is JsonValueKind.String)
            .Select(item => item.GetString()!)
            .ToList();
        if (!items.Any(item => TypedFor(ChoiceValue(item)) is not null))
        {
            return null;
        }
        return string.Join("، ", items.Select(item =>
            TypedFor(ChoiceValue(item))
                ?? DisplayText(select, JsonSerializer.SerializeToElement(item))));
    }

    /// <summary>`BR-0104`: required when required by ≥1 selected service — and,
    /// with `requiredWhen`, only while that condition holds (RUN-019).</summary>
    public static bool IsRequired(
        FieldDefinition field, IReadOnlyList<string> services, IReadOnlyDictionary<string, JsonElement> values) =>
        field.RequiredFor.Any(services.Contains) && Holds(field.RequiredWhen, values);

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
                if (IsRequired(field, services, values))
                {
                    failed.Add(field.Id);
                }
                continue;
            }
            if (!ShapeIsValid(field, value) || PrecedesItsStart(field, value, values))
            {
                failed.Add(field.Id);
            }
        }
        return failed;
    }

    /// <summary>
    /// `notBefore` — an end date before its start (BUG-014/BUG-015). Judged
    /// only when both are well-formed dates: a malformed start is the start
    /// field's own failure.
    /// </summary>
    private static bool PrecedesItsStart(
        FieldDefinition field, JsonElement value, IReadOnlyDictionary<string, JsonElement> values) =>
        field.Validation?.NotBefore is { } startId
        && values.TryGetValue(startId, out var start)
        && TryParseDate(start.ValueKind is JsonValueKind.String ? start.GetString() : null, out var from)
        && TryParseDate(value.GetString(), out var to)
        && to < from;

    private static bool TryParseDate(string? text, out DateOnly date) =>
        DateOnly.TryParseExact(text, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out date);

    /// <summary>A `date` field's own shape: an ISO date inside its bounds.</summary>
    private static bool DateIsValid(FieldDefinition field, string text)
    {
        if (!TryParseDate(text, out var date))
        {
            return false;
        }
        // `today` is the applicant's today, which the form resolves in their
        // browser: the server accepts it in ANY time zone (UTC+14 for a
        // ceiling, UTC-12 for a floor) rather than refuse a date the form
        // allowed.
        var now = DateTime.UtcNow;
        DateOnly? Resolve(string? bound, int offsetHours) =>
            bound == "today"
                ? DateOnly.FromDateTime(now.AddHours(offsetHours))
                : TryParseDate(bound, out var fixedDate) ? fixedDate : null;
        return !(Resolve(field.Validation?.MaxDate, 14) is { } max && date > max)
            && !(Resolve(field.Validation?.MinDate, -12) is { } min && date < min);
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

    /// <summary>
    /// Required attachment rules with no stored file (`BR-0105`'s file half).
    /// An application-level rule is reported by its code; a per-entry rule is
    /// judged entry by entry and reported as <c>ruleCode::entryId</c> — the
    /// form's `entryAttachmentKey` — for each entry with no file of its own.
    /// A section with no entries owes no file: an applicant who lists no
    /// professional certificate owes no certificate.
    /// </summary>
    /// <remarks>
    /// ⚠️ A per-entry file with no entry id is historical (`P-394`) and
    /// satisfies the FIRST entry only, as the form's `entryAttachments` reads it.
    /// </remarks>
    public static IReadOnlyList<string> MissingAttachmentRules(
        IEnumerable<AttachmentRequirement> rules,
        IReadOnlyList<string> services,
        IReadOnlyCollection<StoredAttachment> present,
        IReadOnlyDictionary<string, IReadOnlyList<FormEntry>> normalizedEntries)
    {
        ArgumentNullException.ThrowIfNull(rules);
        ArgumentNullException.ThrowIfNull(present);
        ArgumentNullException.ThrowIfNull(normalizedEntries);
        var missing = new List<string>();
        foreach (var rule in rules.Where(r => r.RequiredFor.Any(services.Contains)))
        {
            if (rule.PerEntryOf is null)
            {
                if (!present.Any(a => a.RuleCode == rule.RuleCode))
                {
                    missing.Add(rule.RuleCode);
                }
                continue;
            }
            var sectionEntries = normalizedEntries.GetValueOrDefault(rule.PerEntryOf) ?? [];
            missing.AddRange(sectionEntries
                .Select((entry, index) => (entry.EntryId, index))
                .Where(e => !present.Any(a => a.RuleCode == rule.RuleCode
                    && (a.EntryId == e.EntryId || (a.EntryId is null && e.index == 0))))
                .Select(e => $"{rule.RuleCode}{EntryKeySeparator}{e.EntryId}"));
        }
        return missing;
    }

    private static bool IsEmpty(FieldDefinition field, JsonElement value) =>
        field.Type switch
        {
            // A required checkbox means "must be ticked".
            "checkbox" => value.ValueKind is not JsonValueKind.True,
            "multi-select" => value.ValueKind is not JsonValueKind.Array || value.GetArrayLength() == 0,
            _ => value.ValueKind is not JsonValueKind.String
                || string.IsNullOrWhiteSpace(value.GetString()),
        };

    /// <summary>
    /// One answer's own shape — options, snapshots, dates, length, pattern,
    /// bounds — as the submit gate judges it; an empty answer is valid here
    /// (requiredness is the gate's). For a write that is not a submission:
    /// the trainer's own profile edit (J-14).
    /// </summary>
    public static bool IsShapeValid(FieldDefinition field, JsonElement value)
    {
        ArgumentNullException.ThrowIfNull(field);
        if (IsEmpty(field, value))
        {
            // A multi-select stored as anything but a list is a malformed answer, not an empty one.
            return field.Type != "multi-select" || value.ValueKind is JsonValueKind.Array
                or JsonValueKind.Null or JsonValueKind.Undefined;
        }
        return ShapeIsValid(field, value);
    }

    private static bool ShapeIsValid(FieldDefinition field, JsonElement value)
    {
        if (field.Type is "select" && field.Options is { Count: > 0 })
        {
            var chosen = value.GetString();
            return field.Options.Any(option => option.Value == chosen);
        }
        if (field.Type is "multi-select" && field.Options is { Count: > 0 })
        {
            // A static option — or, for a list fetched at runtime, a
            // well-formed snapshot of one (BUG-004).
            return value.EnumerateArray().All(item =>
                item.ValueKind is JsonValueKind.String
                && (field.Options.Any(option => option.Value == item.GetString())
                    || (field.OptionsSource is not null && Matches(item.GetString()!, RuntimeChoicePattern))));
        }
        if (field.Type is "date")
        {
            // BUG-014/BUG-015 — a date is a date: `yyyy-MM-dd`, within its
            // bounds, whatever a client sent.
            return value.ValueKind is JsonValueKind.String && DateIsValid(field, value.GetString()!);
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
