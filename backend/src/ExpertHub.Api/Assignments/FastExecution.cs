using System.Globalization;
using ExpertHub.Api.Applications;
using ExpertHub.Infrastructure.Fast;
using ExpertHub.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace ExpertHub.Api.Assignments;

/// <summary>
/// J-21's FAST-sourced sections of the trainer's engagement view, read live
/// from the Training API when the request is linked to a FAST plan:
/// <list type="bullet">
/// <item><b>B-10</b> — the enrolled trainees, names only (F3/AC-2), and the
/// attendance per programme day as counts (F4).</item>
/// <item><b>B-11</b> — the Teams link of an online plan (F2).</item>
/// <item><b>B-12</b> — the trainee evaluations from MTM (F6), raw values on
/// their own scale, and MTM's rating of the trainer on the plan.</item>
/// </list>
/// A request with no FAST plan, FAST off or FAST failing leaves each section
/// <c>available: false</c> with its reason — named, never zeroed.
/// </summary>
/// <remarks>
/// ⚠️ FAST does not record which trainer a survey answer is about, so on a plan
/// with several trainers the answers are the plan's, shared by all of them
/// (the Training API says so). Needs Confirmation whether such answers should
/// be shown to each trainer.
/// </remarks>
internal static class FastExecution
{
    internal sealed record Sections(string? MeetingUrl, object Enrolment, object Attendance, object Evaluations);

    internal static async Task<Sections> ReadAsync(
        FastTrainingApi fast, ExpertHubDbContext db, string? planId, Guid trainerId,
        string trainerName, string? programName, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(planId) || !fast.IsConfigured)
        {
            var reason = string.IsNullOrWhiteSpace(planId) ? "not-linked" : "fast-unavailable";
            return new Sections(null, Missing(reason, "takers"), Missing(reason, "days"), Missing(reason, "items"));
        }
        var fastUserId = await (
            from profile in db.TrainerProfiles
            join replica in db.FastProfiles on profile.UserId equals replica.UserId
            where profile.TrainerId == trainerId
            select replica.FastUserId).FirstOrDefaultAsync(ct);

        var statusTask = fast.PlanStatusAsync(planId, ct);
        var takersTask = fast.PlanTakersAsync(planId, ct);
        var evaluationTask = fastUserId is null
            ? Task.FromResult(FastResult.Failure<FastTrainerEvaluation>("no-fast-user"))
            : fast.TrainerEvaluationsAsync(planId, fastUserId, ct);
        await Task.WhenAll(statusTask, takersTask, evaluationTask);
        var status = await statusTask;
        var takers = await takersTask;
        var evaluation = await evaluationTask;

        object enrolment = takers.Ok && takers.Value is not null
            ? new
            {
                available = true,
                reason = (string?)null,
                // F3/AC-2 — names only; nothing else about a trainee is carried.
                takers = takers.Value.Select(t => new { nameAr = t.NameAr ?? t.NameEn ?? "", nameEn = t.NameEn ?? t.NameAr ?? "" }),
            }
            : Missing("fast-unavailable", "takers");
        object attendance = takers.Ok && takers.Value is not null
            ? new
            {
                available = true,
                reason = (string?)null,
                days = takers.Value
                    .SelectMany(t => t.Attendance ?? [])
                    .GroupBy(a => a.Date.Date)
                    .OrderBy(g => g.Key)
                    .Select(g => new
                    {
                        date = g.Key.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
                        present = g.Count(a => a.Status == "present"),
                        absent = g.Count(a => a.Status == "absent"),
                    }),
            }
            : Missing("fast-unavailable", "days");
        object evaluations = evaluation.Ok && evaluation.Value is not null
            ? new
            {
                available = true,
                reason = (string?)null,
                rating = evaluation.Value.Rating is { } rating
                    ? new { overall = rating.OverallRating, responseCount = rating.ResponseCount }
                    : null,
                items = (evaluation.Value.PlanSurveyResponses ?? [])
                    // An absent trainee's answer carries no value — not a zero.
                    .Where(r => r.Value is not null)
                    .Select((r, index) => new
                    {
                        evaluationId = $"{r.EvaluationId}:{r.QuestionId}:{index}",
                        trainerName,
                        programName = programName ?? "",
                        rawValue = r.Value!.Value,
                        scaleLow = r.ScaleLow,
                        scaleHigh = r.ScaleHigh,
                        receivedAt = ApplicationEndpoints.Iso(r.ReceivedAt),
                        comment = Join(r.QuestionTextAr ?? r.QuestionTextEn, r.AnswerTextAr ?? r.AnswerTextEn),
                    }),
            }
            : Missing(fastUserId is null ? "no-fast-user" : "fast-unavailable", "items");

        return new Sections(status.Ok ? status.Value?.TeamsUrl : null, enrolment, attendance, evaluations);
    }

    private static object Missing(string reason, string list) => list switch
    {
        "takers" => new { available = false, reason, takers = Array.Empty<object>() },
        "days" => new { available = false, reason, days = Array.Empty<object>() },
        _ => new { available = false, reason, items = Array.Empty<object>() },
    };

    private static string? Join(string? question, string? answer) =>
        string.IsNullOrWhiteSpace(answer) ? question
            : string.IsNullOrWhiteSpace(question) ? answer
            : $"{question} — {answer}";
}
