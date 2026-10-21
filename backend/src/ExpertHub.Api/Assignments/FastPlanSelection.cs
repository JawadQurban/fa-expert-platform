using System.Globalization;
using ExpertHub.Api.Auth;
using ExpertHub.Api.ServiceRequests;
using ExpertHub.Infrastructure.Fast;

namespace ExpertHub.Api.Assignments;

/// <summary>A FAST programme offered for selection (B-03).</summary>
internal sealed record FastProgramOptionWire(
    string ProgramId, string? Code, string NameAr, string NameEn, bool IsCustom);

/// <summary>
/// The programme dropdown. <c>Available</c> false means the Training API is off
/// or unreachable — the form then falls back to manual entry, as before.
/// </summary>
/// <remarks><c>Configured</c> — the Training API is set up here, so forms 1–2
/// MUST link a plan (`P-362`), even while FAST is briefly unreachable.</remarks>
internal sealed record FastProgrammesWire(
    bool Available, IReadOnlyList<FastProgramOptionWire> Items, bool Configured = false);

/// <summary>Form 4 — one programme, pulled (no plan): what it fills (`P-363`).</summary>
internal sealed record FastProgrammePrefillWire(
    string ProgramId, string? Code, FastPulledFieldsWire Fields, bool HasProspectus);

/// <summary>An open plan of a programme (B-05).</summary>
internal sealed record FastPlanOptionWire(
    string PlanId, string? PlanCode, string? StartDate, string? EndDate,
    LocalizedTextWire? City, string? DeliveryMode, bool HasTrainer);

/// <summary>
/// The request fields a FAST plan fills (B-06 + B-04). A null field is one FAST
/// could not answer in Expert Hub's vocabulary; the centre enters it by hand.
/// </summary>
internal sealed record FastPulledFieldsWire(
    string? ProgramName, int? DaysCount, bool? DaysCountOther, string? DateFrom, string? DateTo,
    string? Period, string? DeliveryMechanism, string? City, string? Language,
    string? TraineeLevel, string? ClientName);

/// <summary>One plan, pulled: whether it may be assigned, and the fields it fills.</summary>
/// <remarks><c>HasProspectus</c> — FAST holds the programme's prospectus, so
/// «النشرة التعريفية» need not be uploaded: the server attaches FAST's file.</remarks>
internal sealed record FastPlanPrefillWire(
    string PlanId, string? ProgramId, string? PlanCode, string? Status, bool Assignable,
    FastPulledFieldsWire Fields, bool HasProspectus = false);

/// <summary>
/// RUN-030 / BUG-004 — J-16/F2–F3 against the FAST Training API: the centre
/// picks a FAST programme, then one of its open plans, and the request takes
/// the plan's operational data from FAST rather than from the keyboard. A
/// closed, final-closed, cancelled or already-ended plan is refused, both when
/// it is pulled and when the request is submitted.
/// </summary>
/// <remarks>
/// <para>
/// Forms 1 and 2 (general and private programmes) only. Form 3 (events) and
/// form 5 (exams) are FAST-driven in the matrix too, but the Training API
/// exposes no event or exam operation — still blocked. Whether form 4
/// (content development) should pick a plan is Needs Confirmation.
/// </para>
/// <para>
/// ⚠️ Needs Confirmation — two mappings are not FAST's own codes: the
/// training language (FAST's <c>Languages</c> lookup carries no code, so
/// Arabic/English are recognised by name) and the trainee level (matched to
/// مبتدئ/متوسط/متقدم by its English name). Anything else is left for the
/// centre to choose. «مجال التخصص» stays Expert Hub's own list: FAST's sector
/// and job-family taxonomy needs an approved business mapping first.
/// </para>
/// </remarks>
internal static class FastPlanSelection
{
    /// <summary>The request types whose form selects a FAST plan.</summary>
    internal static readonly string[] PlanDrivenTypes = ["general-program", "private-program"];

    /// <summary>Form 4 (content development) picks a FAST programme, no plan (`P-363`).</summary>
    internal static bool IsProgrammeDriven(string? requestType) =>
        CentreRequestMatrix.RuleFor(requestType)?.Form == CentreRequestMatrix.RequestForm.ContentDevelopment;

    internal static void MapFastPlanLookups(RouteGroupBuilder requests)
    {
        // «اسم البرنامج» — the Academy's approved programmes (BUG-004), searched
        // by name or code, only those with an upcoming plan to assign to. The
        // picker loads FAST's maximum page (200) once and filters it as you type.
        // `upcomingPlansOnly=false` — form 4 picks a programme, not a plan.
        requests.MapGet("/lookups/fast-programmes", async (
            string? q, bool? upcomingPlansOnly, FastTrainingApi fast, CancellationToken ct) =>
        {
            if (!fast.IsConfigured)
            {
                return Results.Ok(new FastProgrammesWire(false, []));
            }
            var result = await fast.SearchProgramsAsync(
                new FastProgramSearch(1, 200, string.IsNullOrWhiteSpace(q) ? null : q.Trim(), "active",
                    upcomingPlansOnly != false), ct);
            if (!result.Ok || result.Value is null)
            {
                return Results.Ok(new FastProgrammesWire(false, [], Configured: true));
            }
            return Results.Ok(new FastProgrammesWire(true, Configured: true, Items: [.. result.Value.Items
                .Where(p => !string.IsNullOrWhiteSpace(p.ProgramId))
                .Select(p => new FastProgramOptionWire(
                    p.ProgramId!, p.ProgramCode, p.NameAr ?? p.NameEn ?? p.ProgramId!,
                    p.NameEn ?? p.NameAr ?? p.ProgramId!, p.IsCustom))]));
        })
            .WithName("FastProgrammeLookup")
            .RequireAnyFeature("F-0501", "F-0503");

        // The programme's plans that are still open and not yet started.
        requests.MapGet("/lookups/fast-programmes/{programId}/plans", async (
            string programId, FastTrainingApi fast, CancellationToken ct) =>
        {
            var result = await fast.PlansAsync(programId, "open", DateTime.UtcNow.Date, ct);
            if (!result.Ok || result.Value is null)
            {
                return Unavailable(result.StatusCode);
            }
            var today = DateTime.UtcNow.Date;
            return Results.Ok(result.Value
                .Where(p => !string.IsNullOrWhiteSpace(p.PlanId)
                    && FastPlanStatuses.IsAssignable(p.Status, null, p.EndDate, today))
                .Select(p => new FastPlanOptionWire(
                    p.PlanId!, p.PlanCode, Day(p.StartDate), Day(p.EndDate),
                    p.City is null ? null : new LocalizedTextWire(p.City.NameAr ?? "", p.City.NameEn ?? ""),
                    p.DeliveryMode, p.HasTrainer)));
        })
            .WithName("FastProgrammePlans")
            .RequireAnyFeature("F-0501", "F-0503");

        // Form 4 — the programme, pulled: what the form fills and locks.
        requests.MapGet("/lookups/fast-programmes/{programId}", async (
            string programId, FastTrainingApi fast, CancellationToken ct) =>
        {
            var (prefill, problem) = await PullProgrammeAsync(fast, programId, ct);
            return problem ?? Results.Ok(prefill);
        })
            .WithName("FastProgrammePrefill")
            .RequireAnyFeature("F-0501", "F-0503");

        // The plan, pulled — what the form fills and locks.
        requests.MapGet("/lookups/fast-plans/{planId}", async (
            string planId, FastTrainingApi fast, CancellationToken ct) =>
        {
            var (prefill, problem) = await PullAsync(fast, planId, ct);
            return problem ?? Results.Ok(prefill);
        })
            .WithName("FastPlanPrefill")
            .RequireAnyFeature("F-0501", "F-0503");
    }

    /// <summary>
    /// On submission: re-read the plan (never trust the page's copy), refuse a
    /// plan that can no longer be assigned, and lay FAST's values over the
    /// entered ones.
    /// </summary>
    internal static async Task<(CreateRequestInputWire Input, IResult? Problem)> ApplyAsync(
        CreateRequestInputWire input, FastTrainingApi fast, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(input.FastPlanId))
        {
            // P-362 — with the Training API configured, forms 1–2 must link a
            // FAST plan. Without it, they stay manual, so an environment with
            // no FAST still works.
            if (fast.IsConfigured && PlanDrivenTypes.Contains(input.RequestType))
            {
                return (input, Results.Problem(statusCode: 400, detail: "fast-plan-required",
                    extensions: new Dictionary<string, object?> { ["fields"] = PlanField }));
            }
            if (string.IsNullOrWhiteSpace(input.FastProgramId))
            {
                return (input, null);
            }
            // P-363 — form 4 may link a programme (optional); no other form does.
            return IsProgrammeDriven(input.RequestType)
                ? await ApplyProgrammeAsync(input, fast, ct)
                : (input, InvalidProgramme());
        }
        if (!PlanDrivenTypes.Contains(input.RequestType))
        {
            return (input, Invalid());
        }
        var (prefill, problem) = await PullAsync(fast, input.FastPlanId, ct);
        if (problem is not null)
        {
            return (input, problem);
        }
        if (!prefill!.Assignable)
        {
            return (input, Results.Problem(statusCode: 400, detail: "fast-plan-closed",
                extensions: new Dictionary<string, object?> { ["fields"] = PlanField }));
        }
        var pulled = prefill.Fields;
        return (input with
        {
            FastProgramId = prefill.ProgramId,
            ProgramName = pulled.ProgramName ?? input.ProgramName,
            DaysCount = pulled.DaysCount ?? input.DaysCount,
            DaysCountOther = pulled.DaysCountOther ?? input.DaysCountOther,
            DateFrom = pulled.DateFrom ?? input.DateFrom,
            DateTo = pulled.DateTo ?? input.DateTo,
            Period = pulled.Period ?? input.Period,
            DeliveryMechanism = pulled.DeliveryMechanism ?? input.DeliveryMechanism,
            City = pulled.City ?? input.City,
            Language = pulled.Language ?? input.Language,
            TraineeLevel = pulled.TraineeLevel ?? input.TraineeLevel,
            ClientName = pulled.ClientName ?? input.ClientName,
            // FAST's prospectus stands in for an un-uploaded brochure; the
            // file itself is fetched when the brochure is resolved.
            AttachmentName = input.AttachmentName
                ?? (prefill.HasProspectus && string.IsNullOrWhiteSpace(input.AttachmentId) ? "prospectus" : null),
        }, null);
    }

    private static readonly string[] PlanField = ["fastPlanId"];

    private static readonly string[] ProgrammeField = ["fastProgramId"];

    private static IResult InvalidProgramme() =>
        Results.Problem(statusCode: 400, detail: "invalid-field-value",
            extensions: new Dictionary<string, object?> { ["fields"] = ProgrammeField });

    /// <summary>Form 4 — re-read the programme and lay its values over the entered ones.</summary>
    private static async Task<(CreateRequestInputWire Input, IResult? Problem)> ApplyProgrammeAsync(
        CreateRequestInputWire input, FastTrainingApi fast, CancellationToken ct)
    {
        var (prefill, problem) = await PullProgrammeAsync(fast, input.FastProgramId!, ct);
        if (problem is not null)
        {
            return (input, problem);
        }
        var pulled = prefill!.Fields;
        return (input with
        {
            ProgramName = pulled.ProgramName ?? input.ProgramName,
            TraineeLevel = pulled.TraineeLevel ?? input.TraineeLevel,
            AttachmentName = input.AttachmentName
                ?? (prefill.HasProspectus && string.IsNullOrWhiteSpace(input.AttachmentId) ? "prospectus" : null),
        }, null);
    }

    private static async Task<(FastProgrammePrefillWire? Prefill, IResult? Problem)> PullProgrammeAsync(
        FastTrainingApi fast, string programId, CancellationToken ct)
    {
        if (!Guid.TryParse(programId, out _))
        {
            return (null, InvalidProgramme());
        }
        var program = await fast.ProgramDetailsAsync(programId, ct);
        if (!program.Ok || program.Value is null)
        {
            return (null, program.StatusCode == 404
                ? InvalidProgramme()
                : Results.Problem(statusCode: 503, detail: "fast-unavailable"));
        }
        return (ProgrammePrefill(programId, program.Value), null);
    }

    /// <summary>Form 4's mapping — the programme's name and trainee level only.</summary>
    internal static FastProgrammePrefillWire ProgrammePrefill(string programId, FastProgramDetails program) =>
        new(
            programId,
            program.ProgramCode,
            new FastPulledFieldsWire(
                ProgramName: program.NameAr ?? program.NameEn,
                DaysCount: null, DaysCountOther: null, DateFrom: null, DateTo: null, Period: null,
                DeliveryMechanism: null, City: null, Language: null,
                TraineeLevel: TraineeLevelOf(program.TraineeLevel),
                ClientName: null),
            HasProspectus(program));

    private static bool HasProspectus(FastProgramDetails? program) =>
        program?.Prospectus is { } prospectus
            && (prospectus.FileName is not null || prospectus.DownloadUrl is not null);

    private static IResult Invalid() =>
        Results.Problem(statusCode: 400, detail: "invalid-field-value",
            extensions: new Dictionary<string, object?> { ["fields"] = PlanField });

    /// <summary>FAST off or unreachable is a 503 with a code, never a 500.</summary>
    private static IResult Unavailable(int? status) =>
        status == 404
            ? Results.Problem(statusCode: 404, detail: "fast-plan-not-found")
            : Results.Problem(statusCode: 503, detail: "fast-unavailable");

    private static async Task<(FastPlanPrefillWire? Prefill, IResult? Problem)> PullAsync(
        FastTrainingApi fast, string planId, CancellationToken ct)
    {
        if (!Guid.TryParse(planId, out _))
        {
            return (null, Invalid());
        }
        var plan = await fast.PlanDetailsAsync(planId, ct);
        if (!plan.Ok || plan.Value is null)
        {
            return (null, plan.StatusCode == 404 ? Invalid() : Unavailable(plan.StatusCode));
        }
        // The programme carries the name and the trainee level; a failure here
        // only leaves those two for the centre to enter.
        var program = string.IsNullOrWhiteSpace(plan.Value.ProgramId)
            ? null
            : (await fast.ProgramDetailsAsync(plan.Value.ProgramId, ct)).Value;
        return (Prefill(plan.Value, program, DateTime.UtcNow.Date), null);
    }

    /// <summary>The mapping itself — pure, so the tests drive it directly.</summary>
    internal static FastPlanPrefillWire Prefill(FastPlanDetails plan, FastProgramDetails? program, DateTime today)
    {
        var days = (plan.ScheduleDays ?? []).ToList();
        // When FAST marks a rescheduled timetable, the latest one is the plan.
        if (days.Any(d => d.IsLatestSchedule))
        {
            days = [.. days.Where(d => d.IsLatestSchedule)];
        }
        DateTime? first = days.Count == 0 ? null : days.Min(d => d.Date);
        DateTime? last = days.Count == 0 ? null : days.Max(d => d.Date);
        var clients = (plan.ClientOrganizations ?? [])
            .Select(c => c.NameAr ?? c.NameEn)
            .Where(name => !string.IsNullOrWhiteSpace(name))
            .ToList();

        var fields = new FastPulledFieldsWire(
            ProgramName: program?.NameAr ?? program?.NameEn,
            DaysCount: plan.NumberOfDays > 0 ? plan.NumberOfDays : null,
            DaysCountOther: plan.NumberOfDays > CentreRequestMatrix.MaxListedDays ? true : null,
            DateFrom: Day(first),
            DateTo: Day(last),
            Period: plan.Period is "morning" or "evening" ? plan.Period : null,
            DeliveryMechanism: plan.DeliveryMode?.Code switch
            {
                "in-class" => "onsite",
                "online" => "online",
                _ => null,
            },
            City: plan.City?.NameAr ?? plan.City?.NameEn,
            Language: LanguageOf(plan.Language),
            TraineeLevel: TraineeLevelOf(program?.TraineeLevel),
            ClientName: clients.Count == 0 ? null : string.Join("، ", clients));

        return new FastPlanPrefillWire(
            plan.PlanId ?? string.Empty,
            plan.ProgramId,
            plan.PlanCode,
            plan.Status?.Code,
            FastPlanStatuses.IsAssignable(plan.Status, plan.FinalClosedOn, last, today),
            fields,
            HasProspectus: HasProspectus(program));
    }

    /// <summary>The largest prospectus Expert Hub copies from FAST (FAST's own limit).</summary>
    private const int ProspectusMaxSizeMb = 50;

    /// <summary>
    /// «النشرة التعريفية» from FAST — the programme's prospectus, stored as the
    /// request's brochure when the centre uploaded none. It goes through the
    /// same format and content checks as an upload; only the size limit is
    /// FAST's, because the file is the Academy's own, not a user's. Null when
    /// FAST has none or cannot serve it — the brochure is then still required.
    /// </summary>
    internal static async Task<ExpertHub.Core.Domain.Attachment?> ProspectusAsync(
        FastTrainingApi fast, string? programId, Guid uploadedBy,
        ExpertHub.Infrastructure.Persistence.ExpertHubDbContext db,
        ExpertHub.Infrastructure.Documents.IDocumentStore store,
        ExpertHub.Infrastructure.Documents.IUploadScanner scanner,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(programId))
        {
            return null;
        }
        var file = await fast.ProspectusAsync(programId, "ar", ct);
        if (!file.Ok || file.Value is null || file.Value.Bytes.Length == 0)
        {
            return null;
        }
        var name = file.Value.FileName is { Length: > 0 } given ? given : "prospectus.pdf";
        using var stream = new MemoryStream(file.Value.Bytes);
        var form = new FormFile(stream, 0, file.Value.Bytes.Length, "file", name)
        {
            Headers = new HeaderDictionary(),
            ContentType = file.Value.ContentType,
        };
        var (attachment, _) = await Documents.AttachmentUploads.StoreAsync(
            form, Documents.AttachmentUploads.DocumentFormats, ProspectusMaxSizeMb, uploadedBy, db, store, scanner, ct);
        return attachment;
    }

    /// <summary>⚠️ Needs Confirmation — by FAST's code if it has one, else by name.</summary>
    private static string? LanguageOf(FastNamedRef? language)
    {
        var code = language?.Code?.Trim().ToLowerInvariant();
        if (code is "ar" or "en")
        {
            return code;
        }
        var name = $"{language?.NameEn} {language?.NameAr}";
        return name.Contains("Arabic", StringComparison.OrdinalIgnoreCase) || name.Contains("العربية", StringComparison.Ordinal)
            ? "ar"
            : name.Contains("English", StringComparison.OrdinalIgnoreCase) || name.Contains("الإنجليزية", StringComparison.Ordinal)
                ? "en"
                : null;
    }

    /// <summary>⚠️ Needs Confirmation — only an exact beginner/intermediate/advanced match.</summary>
    private static string? TraineeLevelOf(FastNamedRef? level)
    {
        foreach (var candidate in new[] { level?.Code, level?.NameEn })
        {
            var value = candidate?.Trim().ToLowerInvariant();
            if (value is not null && CentreRequestMatrix.TraineeLevels.Contains(value))
            {
                return value;
            }
        }
        return null;
    }

    private static string? Day(DateTime? value) =>
        value?.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);
}
