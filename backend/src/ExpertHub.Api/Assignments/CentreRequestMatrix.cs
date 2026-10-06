using ExpertHub.Core.Domain;

namespace ExpertHub.Api.Assignments;

/// <summary>
/// Notion «Assignment Matrix» (J-16/J-17) — the approved request types, the
/// form each one opens, the service it is matched against, and each form's
/// required fields and allowed values. This is the authority a submitted
/// request is checked against; the frontend's `centreRequestForm.types.ts`
/// mirrors it only to render and pre-validate the form.
/// </summary>
/// <remarks>
/// <para>
/// Requests saved before this matrix keep their stored `request_type`
/// (<c>workshop</c>, <c>content-development</c>, <c>consultation</c> — the
/// earlier merged types) and their stored service; they are never re-read
/// against these rules. Those keys are simply not selectable for a NEW request.
/// </para>
/// <para>
/// ⚠️ REQUIRES REVIEW — Notion routes «ورشة عمل / لقاء / ندوة» to the Speaker
/// talent category (J-04), which is not built. They keep the routing they had
/// (trainer) until that decision is made.
/// </para>
/// </remarks>
internal static class CentreRequestMatrix
{
    /// <summary>The six forms of the matrix.</summary>
    internal enum RequestForm
    {
        /// <summary>نموذج 1 — برنامج تدريبي عام.</summary>
        GeneralProgram,

        /// <summary>نموذج 2 — برنامج تدريبي خاص.</summary>
        PrivateProgram,

        /// <summary>نموذج 3 — ورشة عمل / لقاء / ندوة.</summary>
        Event,

        /// <summary>نموذج 4 — تطوير محتوى / عروض فنية / محاور برنامج.</summary>
        ContentDevelopment,

        /// <summary>نموذج 5 — كتابة الأسئلة.</summary>
        QuestionWriting,

        /// <summary>نموذج 6 — استشارات / أخرى.</summary>
        Consultation,
    }

    internal sealed record RequestTypeRule(string Key, RequestForm Form, string ServiceType);

    /// <summary>«نوع الطلب», in the matrix's dropdown order.</summary>
    internal static readonly RequestTypeRule[] RequestTypes =
    [
        new("general-program", RequestForm.GeneralProgram, ApplicationServices.Trainer),
        new("private-program", RequestForm.PrivateProgram, ApplicationServices.Trainer),
        new("training-workshop", RequestForm.Event, ApplicationServices.Trainer),
        new("meeting", RequestForm.Event, ApplicationServices.Trainer),
        new("seminar", RequestForm.Event, ApplicationServices.Trainer),
        new("content-development-request", RequestForm.ContentDevelopment, ApplicationServices.ContentDeveloper),
        new("question-writing", RequestForm.QuestionWriting, ApplicationServices.QuestionWriter),
        new("technical-presentations", RequestForm.ContentDevelopment, ApplicationServices.ContentDeveloper),
        new("consultations", RequestForm.Consultation, ApplicationServices.Consultant),
        new("other", RequestForm.Consultation, ApplicationServices.Consultant),
    ];

    /// <summary>«الفترة» — صباحية، مسائية.</summary>
    internal static readonly string[] Periods = ["morning", "evening"];

    /// <summary>«الية التنفيذ» — حضوري، عن بُعد.</summary>
    internal static readonly string[] DeliveryModes = ["onsite", "online"];

    /// <summary>Form 3 only adds «بث مباشر».</summary>
    internal const string LiveStream = "live-stream";

    /// <summary>«لغة التدريب/المحتوى/الاستشارة» — عربي، إنجليزي.</summary>
    internal static readonly string[] Languages = ["ar", "en"];

    /// <summary>«مستوى المتدربين» — مبتدئ، متوسط، متقدم.</summary>
    internal static readonly string[] TraineeLevels = ["beginner", "intermediate", "advanced"];

    /// <summary>«نوع الاستشارة» — استشارة فردية، استشارة مؤسسية، دراسة حالة، تقييم / تدقيق، أخرى.</summary>
    internal static readonly string[] ConsultationTypes =
        ["individual", "institutional", "case-study", "assessment-audit", "other"];

    /// <summary>«عدد الأيام» — 1 to 8, or «أخرى» (<c>daysCountOther</c>).</summary>
    internal const int MaxListedDays = 8;

    private static DateOnly? DateOnlyOf(string? value) =>
        DateTime.TryParse(value, System.Globalization.CultureInfo.InvariantCulture,
            System.Globalization.DateTimeStyles.AdjustToUniversal | System.Globalization.DateTimeStyles.AssumeUniversal,
            out var parsed)
            ? DateOnly.FromDateTime(parsed)
            : null;

    internal static RequestTypeRule? RuleFor(string? requestType) =>
        RequestTypes.FirstOrDefault(r => r.Key == requestType);

    /// <summary>
    /// The matrix's required fields and allowed values for the request's form.
    /// Returns the wire field names that are missing, and those whose value is
    /// not one the matrix allows.
    /// </summary>
    internal static (List<string> Missing, List<string> Invalid) Check(
        RequestTypeRule rule, CreateRequestInputWire input)
    {
        var missing = new List<string>();
        var invalid = new List<string>();

        void Required(string field, string? value)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                missing.Add(field);
            }
        }

        void OneOf(string field, string? value, IEnumerable<string> allowed)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                missing.Add(field);
            }
            else if (!allowed.Contains(value))
            {
                invalid.Add(field);
            }
        }

        var consultation = rule.Form == RequestForm.Consultation;
        if (consultation)
        {
            Required("consultationTopic", input.ConsultationTopic);
            // «عدد الساعات المتوقعة» is optional; a value given must be a count.
            if (input.ExpectedHours is < 1)
            {
                invalid.Add("expectedHours");
            }
            OneOf("consultationType", input.ConsultationType, ConsultationTypes);
        }
        else
        {
            Required("programName", input.ProgramName);
            if (input.DaysCountOther != true)
            {
                if (input.DaysCount is null)
                {
                    missing.Add("daysCount");
                }
                else if (input.DaysCount is < 1 or > MaxListedDays)
                {
                    invalid.Add("daysCount");
                }
            }
            OneOf("period", input.Period, Periods);
            OneOf("traineeLevel", input.TraineeLevel, TraineeLevels);
            if (rule.Form == RequestForm.PrivateProgram)
            {
                Required("clientName", input.ClientName);
            }
        }

        Required("dateFrom", input.DateFrom);
        Required("dateTo", input.DateTo);
        // «التاريخ المقرر (من–إلى)» — the end may be the same day, never before
        // it. Dates are compared as DATES, so a time of day cannot tip it.
        if (DateOnlyOf(input.DateFrom) is { } from && DateOnlyOf(input.DateTo) is { } to && to < from)
        {
            invalid.Add("dateTo");
        }
        OneOf("deliveryMechanism", input.DeliveryMechanism,
            rule.Form == RequestForm.Event ? [.. DeliveryModes, LiveStream] : DeliveryModes);
        Required("city", input.City);
        OneOf("language", input.Language, Languages);
        // «النشرة التعريفية» (forms 1–5) / «المرفقات» (form 6) — both mandatory.
        Required("attachmentName", input.AttachmentName);
        Required("specializationDomain", input.SpecializationDomain);

        return (missing, invalid);
    }
}
