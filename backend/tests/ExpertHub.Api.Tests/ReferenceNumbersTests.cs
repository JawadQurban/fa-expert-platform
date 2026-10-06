using ExpertHub.Infrastructure.Persistence;

namespace ExpertHub.Api.Tests;

/// <summary>
/// M38 — references come from one atomic counter per prefix, not <c>max + 1</c>.
/// </summary>
[Collection(LocalDbCollection.Name)]
public sealed class ReferenceNumbersTests
{
    private readonly LocalDbFixture _fixture;

    public ReferenceNumbersTests(LocalDbFixture fixture) => _fixture = fixture;

    /// <summary>A prefix of its own, so the shared database never interferes.</summary>
    private static string FreshPrefix() => $"T{Guid.NewGuid():N}"[..12] + "-";

    [Fact]
    public async Task Simultaneous_callers_reading_the_same_last_reference_get_distinct_numbers()
    {
        // The failure being pinned: every caller reads the same "last issued"
        // and, under max + 1, every caller would issue the same next number.
        var prefix = FreshPrefix();
        var issued = await Task.WhenAll(Enumerable.Range(0, 20).Select(async _ =>
        {
            await using var context = _fixture.CreateContext();
            return await ReferenceNumbers.NextAsync(context, prefix, lastIssued: null, digits: 4, default);
        }));

        Assert.Equal(20, issued.Distinct().Count());
        Assert.Equal(
            Enumerable.Range(1, 20).Select(n => $"{prefix}{n:D4}").Order(),
            issued.Order());
    }

    [Fact]
    public async Task The_first_use_of_a_prefix_continues_after_the_references_already_stored()
    {
        // References issued before the counter existed: the series continues
        // after them instead of restarting at 1 and colliding.
        var prefix = FreshPrefix();
        await using var context = _fixture.CreateContext();

        Assert.Equal($"{prefix}00042",
            await ReferenceNumbers.NextAsync(context, prefix, $"{prefix}00041", digits: 5, default));
        Assert.Equal($"{prefix}00043",
            await ReferenceNumbers.NextAsync(context, prefix, $"{prefix}00041", digits: 5, default));
    }

    [Fact]
    public async Task A_counter_behind_the_table_catches_up_rather_than_reissuing()
    {
        // A row written by something other than this helper (a data fix, an
        // import) must never be handed out a second time.
        var prefix = FreshPrefix();
        await using var context = _fixture.CreateContext();

        await ReferenceNumbers.NextAsync(context, prefix, lastIssued: null, digits: 4, default); // counter at 1
        Assert.Equal($"{prefix}0011",
            await ReferenceNumbers.NextAsync(context, prefix, $"{prefix}0010", digits: 4, default));
    }
}
