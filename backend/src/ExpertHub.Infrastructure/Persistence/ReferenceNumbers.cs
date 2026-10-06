using System.Globalization;
using Microsoft.EntityFrameworkCore;

namespace ExpertHub.Infrastructure.Persistence;

/// <summary>
/// Issues the next human-readable reference under a prefix — `EH-2026-00042`.
/// </summary>
/// <remarks>
/// <c>max + 1</c> read then written later hands two simultaneous submissions
/// the same number; the unique index then refused one of them with a 409 that
/// told an applicant their copy was stale when it was not. The counter row is
/// advanced by ONE statement under <c>HOLDLOCK</c>, so a second caller waits for
/// the first and gets the next number.
///
/// <paramref name="lastIssued"/> is the highest reference already stored under
/// the prefix. It seeds a prefix's first use (every reference issued before the
/// counter existed) and keeps the counter from ever falling behind the table.
/// A rolled-back caller leaves a gap in the series; a gap is harmless, a
/// duplicate is not.
/// </remarks>
public static class ReferenceNumbers
{
    public static async Task<string> NextAsync(
        ExpertHubDbContext db, string prefix, string? lastIssued, int digits, CancellationToken ct)
    {
        var seed = lastIssued is null
            ? 0
            : int.Parse(lastIssued[prefix.Length..], CultureInfo.InvariantCulture);
        var issued = await db.Database.SqlQuery<int>($"""
            MERGE REFERENCE_COUNTER WITH (HOLDLOCK) AS t
            USING (SELECT {prefix} AS prefix) AS s ON t.prefix = s.prefix
            WHEN MATCHED THEN UPDATE SET last_value =
                CASE WHEN t.last_value < {seed} THEN {seed} ELSE t.last_value END + 1
            WHEN NOT MATCHED THEN INSERT (prefix, last_value) VALUES (s.prefix, {seed} + 1)
            OUTPUT inserted.last_value AS [Value];
            """).ToListAsync(ct);
        return prefix + issued[0].ToString("D" + digits.ToString(CultureInfo.InvariantCulture), CultureInfo.InvariantCulture);
    }
}
