using System.Globalization;

namespace ExpertHub.Infrastructure.Notifications;

/// <summary>
/// How an email states a moment — `{{date}}` and `{{time}}` (`P-372`) — in
/// Riyadh time, the one zone every recipient is scheduled in.
/// </summary>
public static class NotificationValues
{
    private static readonly TimeSpan RiyadhOffset = TimeSpan.FromHours(3);

    public static string Date(DateTime utc) =>
        utc.Add(RiyadhOffset).ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);

    public static string Time(DateTime utc) =>
        utc.Add(RiyadhOffset).ToString("HH:mm", CultureInfo.InvariantCulture);
}
