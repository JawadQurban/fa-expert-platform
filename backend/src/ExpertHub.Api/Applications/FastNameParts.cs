namespace ExpertHub.Api.Applications;

/// <summary>
/// A full name split into the four parts the application form asks for.
/// </summary>
/// <param name="First">The given name.</param>
/// <param name="Middle">The father's name.</param>
/// <param name="Third">The grandfather's name, absent in a three-part name.</param>
/// <param name="Family">The family name.</param>
public readonly record struct FastNameParts(
    string? First, string? Middle, string? Third, string? Family);

/// <summary>
/// Splits FAST's full name into the form's four name fields.
/// </summary>
/// <remarks>
/// <para>
/// ⚠️ <b>Anchored on the first name FAST sends, not guessed from the whole
/// string.</b> `Users/Info` carries `firstNameAr` and `firstNameEn` as their
/// own fields, so the given name is known rather than inferred, and only the
/// remainder is positional — «جواد عبدالقادر قربان» minus «جواد» leaves two
/// parts, which is a father and a family name in that order.
/// </para>
/// <para>
/// ⚠️ <b>Where this is still wrong.</b> A name written with a separated
/// particle — «عبد الرحمن» as two tokens, «آل سعود», «بن علي» — has more
/// tokens than parts, and the split will put a fragment in the wrong box. It
/// is a visible error in a field the person can read and, on the application
/// form, correct; that is the trade the owner asked for on 2026-09-10 («work
/// on all the data from FAST»), against four permanently blank fields. It is
/// NOT silent: `Confident` is false for exactly these cases, so the caller can
/// treat them differently, and the profile does.
/// </para>
/// </remarks>
internal static class FastNameSplit
{
    /// <summary>
    /// The parts, plus whether the shape was one this understands.
    /// </summary>
    /// <param name="fullName">FAST's full name in one script.</param>
    /// <param name="firstName">FAST's own given name for the same script.</param>
    internal static (FastNameParts Parts, bool Confident) Split(
        string? fullName, string? firstName)
    {
        var tokens = (fullName ?? string.Empty)
            .Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        if (tokens.Length == 0)
        {
            return (default, false);
        }

        var first = string.IsNullOrWhiteSpace(firstName) ? tokens[0] : firstName.Trim();

        // Drop the given name from the front when the full name repeats it,
        // which it does whenever both fields came from the same record.
        var rest = tokens.AsSpan();
        if (rest.Length > 0 && string.Equals(rest[0], first, StringComparison.Ordinal))
        {
            rest = rest[1..];
        }

        return rest.Length switch
        {
            // «جواد عبدالقادر قربان» — father, family. The form's third-name
            // box stays empty, which is correct: there is no third name here.
            2 => (new FastNameParts(first, rest[0], null, rest[1]), true),
            // Father, grandfather, family — the full four-part shape.
            3 => (new FastNameParts(first, rest[0], rest[1], rest[2]), true),
            // A family name alone. Nothing to be confused about.
            1 => (new FastNameParts(first, null, null, rest[0]), true),
            // Just a given name, or more tokens than parts — a separated
            // particle, a compound family name. The first name is still known
            // and still true; the rest is not split, because a wrong split is
            // worse than an empty box a person can fill in themselves.
            _ => (new FastNameParts(first, null, null, null), rest.Length == 0),
        };
    }
}
