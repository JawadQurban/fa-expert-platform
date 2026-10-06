using System.Globalization;
using ExpertHub.Core.Domain;
using ExpertHub.Infrastructure.Fast;

namespace ExpertHub.Api.Applications;

/// <summary>
/// The Academy's qualification record, expressed in the platform's OWN field
/// codes.
/// </summary>
/// <remarks>
/// <para>
/// Owner ruling, 2026-09-10: «it shouldn't do this at all, it should save in
/// the same qualification in the platform». An earlier build rendered FAST's
/// record as a separate read-only panel beside the form's own «المؤهل العلمي»
/// and «الشهادات المهنية» sections — the same facts, twice, in two shapes,
/// with the platform's own version sitting empty next to a filled copy of it.
/// </para>
/// <para>
/// Expert Hub already asks for every one of these. `qualificationType` ←
/// `qualificationsType`, `universityName` ← `donor`, and so on down: the two
/// models were built from the same BRD and they line up almost exactly. So
/// the record goes into those fields and there is one place a qualification
/// appears.
/// </para>
/// <para>
/// ⚠️ <b>FAST holds a LIST and the form has ONE of each.</b> Somebody with a
/// bachelor's and a master's has two rows there and five fields here.
/// `FastQualificationItems` orders newest first and this takes the first, so
/// the highest recent qualification is the one that shows. The rest are not
/// lost — they stay in the replica — but they are not displayed, and that is
/// a real limitation of the form's shape, not of the import. Repeating groups
/// are `DM-GAP-11`.
/// </para>
/// <para>
/// ⚠️ <b>Nothing is invented for a `select`.</b> Two of these fields take a
/// value from a fixed list and FAST sends free text. A degree name maps only
/// through <see cref="Degrees"/>, on an exact match; a general specialization
/// does not map at all, because FAST's list is open and the form's is five
/// options — «الهندسة الكيميائية» is not «أخرى» just because nothing else
/// fits. An unmapped select is left EMPTY so the page marks it missing, which
/// is true, rather than filled with a value the person never chose.
/// </para>
/// </remarks>
/// <summary>
/// Whether the newest education / professional entry ended up in the form's
/// own fields — and is therefore already on screen.
/// </summary>
/// <remarks>
/// ⚠️ The profile lists what the single set of fields could not hold. Without
/// this the newest degree would appear twice: once in «نوع المؤهل» and again
/// at the top of the list beneath it.
/// </remarks>
internal readonly record struct FastRecordsUsed(bool Education, bool Professional);

internal static class FastQualificationFields
{
    /// <summary>
    /// FAST's degree names, mapped onto `qualificationType`'s option list.
    /// </summary>
    /// <remarks>
    /// ⚠️ Written from the values a real payload carried (2026-09-10) plus the
    /// obvious variants of each. Matching is exact after trimming: a degree
    /// this does not know stays empty rather than guessing between «دبلوم
    /// عالي» and «بكالوريوس».
    /// </remarks>
    private static readonly Dictionary<string, string> Degrees =
        new(StringComparer.OrdinalIgnoreCase)
        {
            ["دكتوراه"] = "doctorate",
            ["الدكتوراه"] = "doctorate",
            ["doctorate"] = "doctorate",
            ["phd"] = "doctorate",
            ["ماجستير"] = "master",
            ["الماجستير"] = "master",
            ["master"] = "master",
            ["master's"] = "master",
            ["masters"] = "master",
            ["بكالوريوس"] = "bachelor",
            ["البكالوريوس"] = "bachelor",
            ["bachelor"] = "bachelor",
            ["bachelor's"] = "bachelor",
            ["bachelors"] = "bachelor",
            ["دبلوم"] = "diploma",
            ["الدبلوم"] = "diploma",
            ["diploma"] = "diploma",
        };

    /// <summary>
    /// Adds what the Academy holds to <paramref name="into"/>, under the
    /// platform's field codes.
    /// </summary>
    /// <remarks>
    /// ⚠️ <b>Never overwrites.</b> Anything already in the map was put there by
    /// the person themselves; the Academy's copy fills gaps and does not
    /// correct answers.
    /// </remarks>
    internal static FastRecordsUsed Add(
        FastProfileReplica? replica, Dictionary<string, string> into)
    {
        ArgumentNullException.ThrowIfNull(into);
        if (replica?.QualificationsSyncedAt is null)
        {
            return default;
        }

        var usedEducation = false;
        var usedProfessional = false;

        // Newest first, so the most recent degree is the one the single set of
        // fields describes.
        // ⚠️ Indexed, not `FirstOrDefault` — CA1826, and these are lists.
        var education = FastQualificationItems.Education(replica.QualificationsEducation);
        if (education.Count > 0)
        {
            var newest = education[0];
            /*
             * ⚠️ «Used» means this entry is now VISIBLE in the form's fields,
             * so the profile must not list it a second time underneath. It is
             * false when the person's own answers already filled those fields
             * — then no FAST entry is on display and every one of them belongs
             * in the list below (`P-265`).
             */
            usedEducation = !into.ContainsKey("universityName")
                && !into.ContainsKey("specializationDetail");
            Add("qualificationType", Degree(newest.QualificationsType));
            // The specific specialization when there is one, the general one
            // otherwise — two fields there, one here, and the narrower answer
            // is the more useful.
            Add("specializationDetail",
                string.IsNullOrWhiteSpace(newest.Specialization)
                    ? newest.GeneralSpecialization
                    : newest.Specialization);
            Add("universityName", newest.Donor);
            Add("qualificationDate", Date(newest.DateObtained));
        }

        var professional = FastQualificationItems.Professional(replica.QualificationsProfessional);
        if (professional.Count > 0)
        {
            var certificate = professional[0];
            usedProfessional = !into.ContainsKey("certificateName");
            Add("certificateName", certificate.CertificateName);
            Add("issuingInstitution", certificate.Donor);
            Add("certificateDate", Date(certificate.DateObtained));
            // The document's name, not a link to it: FAST's URL points at the
            // Academy portal and nobody has confirmed it opens for an Expert
            // Hub session. A name tells the reader which document is on file.
            Add("certificateAttachmentName", certificate.AttachmentName);
        }

        return new FastRecordsUsed(usedEducation, usedProfessional);

        void Add(string field, string? value)
        {
            if (!string.IsNullOrWhiteSpace(value) && !into.ContainsKey(field))
            {
                into[field] = value.Trim();
            }
        }
    }

    /// <summary>The option value for a degree name, or null when unknown.</summary>
    private static string? Degree(string? fastValue) =>
        !string.IsNullOrWhiteSpace(fastValue)
            && Degrees.TryGetValue(fastValue.Trim(), out var option)
            ? option
            : null;

    /// <summary>
    /// `yyyy-MM-dd` — what a date field reads. The form renders it in the
    /// reader's own calendar; the wire stays unambiguous.
    /// </summary>
    private static string? Date(DateTime? value) =>
        value?.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);
}
