namespace ExpertHub.Infrastructure.Persistence;

/// <summary>
/// The option→percentage-point tables for the three Evaluation-Matrix criteria
/// that look an answer up in a CLASSIFIED reference list.
/// </summary>
/// <remarks>
/// ⚠️ GENERATED — do not edit by hand. Produced by
/// `tools/data/extract-reference-lists.py` from the same two workbooks
/// that generate the frontend's dropdowns
/// (`shared/content/academicSpecializations.ts`,
/// `shared/content/professionalCertifications.ts`), so the list the applicant
/// picks from and the table their pick is scored against cannot drift apart.
///
/// Values are the matrix's own fractions, verbatim, so this file diffs against
/// Notion «Evaluation Matrix - By Services» directly.
///
/// Every table is <b>strict</b>: a value the table does not carry resolves to
/// nothing and is reported UNRESOLVED, never scored 0. A specialization whose
/// source row has no relevance value is therefore left OUT rather than written
/// as «not related» (`EVAL-GAP-11`, decided 2026-09-29), and a certificate code
/// that is not in the master list at all is a configuration fault rather than a
/// free zero. This is the same closed-table rule criterion #3 already uses.
/// </remarks>
internal static class EvaluationLookupTables
{
    /// <summary>Criterion #2 «التخصص العام» — 0.1 when related to the Financial Academy, 0 when ruled unrelated; an unclassified value is omitted and resolves UNRESOLVED. Max 10%.</summary>
    internal const string SpecializationRelevance =
        "{\"kind\":\"option\",\"strict\":true,\"points\":{"
        + "\"spec-001\":0.1,\"spec-002\":0.1,\"spec-003\":0.1,\"spec-004\":0.1,\"spec-005\":0.1,\"spec-006\":0.1,"
        + "\"spec-007\":0.1,\"spec-008\":0.1,\"spec-009\":0.1,\"spec-010\":0.1,\"spec-011\":0.1,\"spec-012\":0.1,"
        + "\"spec-013\":0.1,\"spec-014\":0.1,\"spec-015\":0.1,\"spec-016\":0,\"spec-017\":0.1,\"spec-018\":0,"
        + "\"spec-019\":0,\"spec-020\":0,\"spec-021\":0,\"spec-022\":0,\"spec-023\":0.1,\"spec-024\":0"
        + "}}";

    /// <summary>Criterion #7 «مجال الشهادة المهنية» — 0.05 when financial-sector relevant, else 0. Best-of across entries. Max 5%.</summary>
    internal const string CertificateRelevance =
        "{\"kind\":\"option\",\"strict\":true,\"points\":{"
        + "\"CERT-0001\":0,\"CERT-0002\":0,\"CERT-0003\":0.05,\"CERT-0004\":0.05,\"CERT-0005\":0.05,\"CERT-0006\":0.05,"
        + "\"CERT-0007\":0.05,\"CERT-0008\":0.05,\"CERT-0009\":0.05,\"CERT-0010\":0.05,\"CERT-0011\":0.05,\"CERT-0012\":0.05,"
        + "\"CERT-0013\":0.05,\"CERT-0014\":0.05,\"CERT-0015\":0.05,\"CERT-0016\":0.05,\"CERT-0017\":0.05,\"CERT-0018\":0.05,"
        + "\"CERT-0019\":0.05,\"CERT-0020\":0.05,\"CERT-0021\":0.05,\"CERT-0022\":0.05,\"CERT-0023\":0.05,\"CERT-0024\":0.05,"
        + "\"CERT-0025\":0.05,\"CERT-0026\":0.05,\"CERT-0027\":0.05,\"CERT-0028\":0.05,\"CERT-0029\":0,\"CERT-0030\":0.05,"
        + "\"CERT-0031\":0,\"CERT-0032\":0,\"CERT-0033\":0,\"CERT-0034\":0,\"CERT-0035\":0,\"CERT-0036\":0.05,"
        + "\"CERT-0037\":0.05,\"CERT-0038\":0.05,\"CERT-0039\":0.05,\"CERT-0040\":0.05,\"CERT-0041\":0.05,\"CERT-0042\":0.05,"
        + "\"CERT-0043\":0.05,\"CERT-0044\":0,\"CERT-0045\":0.05,\"CERT-0046\":0.05,\"CERT-0047\":0.05,\"CERT-0048\":0.05,"
        + "\"CERT-0049\":0.05,\"CERT-0050\":0.05,\"CERT-0051\":0.05,\"CERT-0052\":0.05,\"CERT-0053\":0,\"CERT-0054\":0,"
        + "\"CERT-0055\":0.05,\"CERT-0056\":0.05,\"CERT-0057\":0,\"CERT-0058\":0.05,\"CERT-0059\":0.05,\"CERT-0060\":0,"
        + "\"CERT-0061\":0,\"CERT-0062\":0,\"CERT-0063\":0.05,\"CERT-0064\":0.05,\"CERT-0065\":0.05,\"CERT-0066\":0.05,"
        + "\"CERT-0067\":0.05,\"CERT-0068\":0.05,\"CERT-0069\":0.05,\"CERT-0070\":0.05,\"CERT-0071\":0.05,\"CERT-0072\":0,"
        + "\"CERT-0073\":0,\"CERT-0074\":0,\"CERT-0075\":0.05,\"CERT-0076\":0.05,\"CERT-0077\":0.05,\"CERT-0078\":0.05,"
        + "\"CERT-0079\":0.05,\"CERT-0080\":0.05,\"CERT-0081\":0.05,\"CERT-0082\":0.05,\"CERT-0083\":0.05,\"CERT-0084\":0.05,"
        + "\"CERT-0085\":0.05,\"CERT-0086\":0.05,\"CERT-0087\":0.05,\"CERT-0088\":0.05,\"CERT-0089\":0.05,\"CERT-0090\":0.05,"
        + "\"CERT-0091\":0.05,\"CERT-0092\":0.05,\"CERT-0093\":0.05,\"CERT-0094\":0.05,\"CERT-0095\":0.05,\"CERT-0096\":0.05,"
        + "\"CERT-0097\":0.05,\"CERT-0098\":0,\"CERT-0099\":0.05,\"CERT-0100\":0.05,\"CERT-0101\":0.05,\"CERT-0102\":0,"
        + "\"CERT-0103\":0,\"CERT-0104\":0,\"CERT-0105\":0,\"CERT-0106\":0.05,\"CERT-0107\":0,\"CERT-0108\":0,"
        + "\"CERT-0109\":0,\"CERT-0110\":0,\"CERT-0111\":0,\"CERT-0112\":0,\"CERT-0113\":0,\"CERT-0114\":0.05,"
        + "\"CERT-0115\":0,\"CERT-0116\":0,\"CERT-0117\":0,\"CERT-0118\":0,\"CERT-0119\":0,\"CERT-0120\":0,"
        + "\"CERT-0121\":0,\"CERT-0122\":0,\"CERT-0123\":0,\"CERT-0124\":0.05,\"CERT-0125\":0.05,\"CERT-0126\":0.05,"
        + "\"CERT-0127\":0,\"CERT-0128\":0,\"CERT-0129\":0,\"CERT-0130\":0,\"CERT-0131\":0,\"CERT-0132\":0,"
        + "\"CERT-0133\":0,\"CERT-0134\":0,\"CERT-0135\":0,\"CERT-0136\":0,\"CERT-0137\":0,\"CERT-0138\":0,"
        + "\"CERT-0139\":0,\"CERT-0140\":0,\"CERT-0141\":0,\"CERT-0142\":0,\"CERT-0143\":0,\"CERT-0144\":0,"
        + "\"CERT-0145\":0,\"CERT-0146\":0,\"CERT-0147\":0,\"CERT-0148\":0,\"CERT-0149\":0,\"CERT-0150\":0,"
        + "\"CERT-0151\":0,\"CERT-0152\":0,\"CERT-0153\":0,\"CERT-0154\":0,\"CERT-0155\":0,\"CERT-0156\":0,"
        + "\"CERT-0157\":0,\"CERT-0158\":0,\"CERT-0159\":0,\"CERT-0160\":0,\"CERT-0161\":0,\"CERT-0162\":0,"
        + "\"CERT-0163\":0,\"CERT-0164\":0,\"CERT-0165\":0,\"CERT-0166\":0,\"CERT-0167\":0,\"CERT-0168\":0,"
        + "\"CERT-0169\":0,\"CERT-0170\":0,\"CERT-0171\":0,\"CERT-0172\":0,\"CERT-0173\":0,\"CERT-0174\":0,"
        + "\"CERT-0175\":0,\"CERT-0176\":0,\"CERT-0177\":0,\"CERT-0178\":0.05,\"CERT-0179\":0.05,\"CERT-0180\":0.05,"
        + "\"CERT-0181\":0.05,\"CERT-0182\":0.05,\"CERT-0183\":0.05,\"CERT-0184\":0.05,\"CERT-0185\":0.05,\"CERT-0186\":0.05,"
        + "\"CERT-0187\":0.05,\"CERT-0188\":0.05,\"CERT-0189\":0.05,\"CERT-0190\":0.05,\"CERT-0191\":0.05,\"CERT-0192\":0.05,"
        + "\"CERT-0193\":0.05,\"CERT-0194\":0.05,\"CERT-0195\":0.05,\"CERT-0196\":0.05,\"CERT-0197\":0.05,\"CERT-0198\":0.05,"
        + "\"CERT-0199\":0.05,\"CERT-0200\":0.05,\"CERT-0201\":0.05,\"CERT-0202\":0.05,\"CERT-0203\":0.05,\"CERT-0204\":0.05,"
        + "\"CERT-0205\":0.05,\"CERT-0206\":0.05,\"CERT-0207\":0.05,\"CERT-0208\":0.05,\"CERT-0209\":0.05,\"CERT-0210\":0.05,"
        + "\"CERT-0211\":0.05,\"CERT-0212\":0.05,\"CERT-0213\":0.05,\"CERT-0214\":0.05,\"CERT-0215\":0.05,\"CERT-0216\":0.05,"
        + "\"CERT-0217\":0.05,\"CERT-0218\":0.05,\"CERT-0219\":0.05,\"CERT-0220\":0.05,\"CERT-0221\":0.05,\"CERT-0222\":0.05,"
        + "\"CERT-0223\":0.05,\"CERT-0224\":0.05,\"CERT-0225\":0.05,\"CERT-0226\":0.05,\"CERT-0227\":0.05,\"CERT-0228\":0.05"
        + "}}";

    /// <summary>Criterion #8 «مصدر الشهادة» — 0.04 global, 0.02 Saudi/local. Best-of across entries, so a global certificate wins. Max 4%.</summary>
    internal const string CertificateSource =
        "{\"kind\":\"option\",\"strict\":true,\"points\":{"
        + "\"CERT-0001\":0.02,\"CERT-0002\":0.02,\"CERT-0003\":0.02,\"CERT-0004\":0.02,\"CERT-0005\":0.02,\"CERT-0006\":0.02,"
        + "\"CERT-0007\":0.02,\"CERT-0008\":0.02,\"CERT-0009\":0.02,\"CERT-0010\":0.02,\"CERT-0011\":0.02,\"CERT-0012\":0.02,"
        + "\"CERT-0013\":0.02,\"CERT-0014\":0.02,\"CERT-0015\":0.02,\"CERT-0016\":0.02,\"CERT-0017\":0.02,\"CERT-0018\":0.02,"
        + "\"CERT-0019\":0.02,\"CERT-0020\":0.02,\"CERT-0021\":0.02,\"CERT-0022\":0.02,\"CERT-0023\":0.02,\"CERT-0024\":0.02,"
        + "\"CERT-0025\":0.02,\"CERT-0026\":0.02,\"CERT-0027\":0.02,\"CERT-0028\":0.02,\"CERT-0029\":0.02,\"CERT-0030\":0.02,"
        + "\"CERT-0031\":0.02,\"CERT-0032\":0.02,\"CERT-0033\":0.02,\"CERT-0034\":0.02,\"CERT-0035\":0.02,\"CERT-0036\":0.04,"
        + "\"CERT-0037\":0.04,\"CERT-0038\":0.04,\"CERT-0039\":0.04,\"CERT-0040\":0.04,\"CERT-0041\":0.04,\"CERT-0042\":0.04,"
        + "\"CERT-0043\":0.04,\"CERT-0044\":0.04,\"CERT-0045\":0.04,\"CERT-0046\":0.04,\"CERT-0047\":0.04,\"CERT-0048\":0.04,"
        + "\"CERT-0049\":0.04,\"CERT-0050\":0.04,\"CERT-0051\":0.04,\"CERT-0052\":0.04,\"CERT-0053\":0.04,\"CERT-0054\":0.04,"
        + "\"CERT-0055\":0.04,\"CERT-0056\":0.04,\"CERT-0057\":0.04,\"CERT-0058\":0.04,\"CERT-0059\":0.04,\"CERT-0060\":0.04,"
        + "\"CERT-0061\":0.04,\"CERT-0062\":0.04,\"CERT-0063\":0.04,\"CERT-0064\":0.04,\"CERT-0065\":0.04,\"CERT-0066\":0.04,"
        + "\"CERT-0067\":0.04,\"CERT-0068\":0.04,\"CERT-0069\":0.04,\"CERT-0070\":0.04,\"CERT-0071\":0.04,\"CERT-0072\":0.04,"
        + "\"CERT-0073\":0.04,\"CERT-0074\":0.04,\"CERT-0075\":0.04,\"CERT-0076\":0.04,\"CERT-0077\":0.04,\"CERT-0078\":0.04,"
        + "\"CERT-0079\":0.04,\"CERT-0080\":0.04,\"CERT-0081\":0.04,\"CERT-0082\":0.04,\"CERT-0083\":0.04,\"CERT-0084\":0.04,"
        + "\"CERT-0085\":0.04,\"CERT-0086\":0.04,\"CERT-0087\":0.04,\"CERT-0088\":0.04,\"CERT-0089\":0.04,\"CERT-0090\":0.04,"
        + "\"CERT-0091\":0.04,\"CERT-0092\":0.04,\"CERT-0093\":0.04,\"CERT-0094\":0.04,\"CERT-0095\":0.04,\"CERT-0096\":0.04,"
        + "\"CERT-0097\":0.04,\"CERT-0098\":0.04,\"CERT-0099\":0.04,\"CERT-0100\":0.04,\"CERT-0101\":0.04,\"CERT-0102\":0.04,"
        + "\"CERT-0103\":0.04,\"CERT-0104\":0.04,\"CERT-0105\":0.04,\"CERT-0106\":0.04,\"CERT-0107\":0.04,\"CERT-0108\":0.04,"
        + "\"CERT-0109\":0.04,\"CERT-0110\":0.04,\"CERT-0111\":0.04,\"CERT-0112\":0.04,\"CERT-0113\":0.04,\"CERT-0114\":0.04,"
        + "\"CERT-0115\":0.04,\"CERT-0116\":0.04,\"CERT-0117\":0.04,\"CERT-0118\":0.04,\"CERT-0119\":0.04,\"CERT-0120\":0.04,"
        + "\"CERT-0121\":0.04,\"CERT-0122\":0.04,\"CERT-0123\":0.04,\"CERT-0124\":0.04,\"CERT-0125\":0.04,\"CERT-0126\":0.04,"
        + "\"CERT-0127\":0.04,\"CERT-0128\":0.04,\"CERT-0129\":0.04,\"CERT-0130\":0.04,\"CERT-0131\":0.04,\"CERT-0132\":0.04,"
        + "\"CERT-0133\":0.04,\"CERT-0134\":0.04,\"CERT-0135\":0.04,\"CERT-0136\":0.04,\"CERT-0137\":0.04,\"CERT-0138\":0.04,"
        + "\"CERT-0139\":0.04,\"CERT-0140\":0.04,\"CERT-0141\":0.04,\"CERT-0142\":0.04,\"CERT-0143\":0.04,\"CERT-0144\":0.04,"
        + "\"CERT-0145\":0.04,\"CERT-0146\":0.04,\"CERT-0147\":0.04,\"CERT-0148\":0.04,\"CERT-0149\":0.04,\"CERT-0150\":0.04,"
        + "\"CERT-0151\":0.04,\"CERT-0152\":0.04,\"CERT-0153\":0.04,\"CERT-0154\":0.04,\"CERT-0155\":0.04,\"CERT-0156\":0.04,"
        + "\"CERT-0157\":0.04,\"CERT-0158\":0.04,\"CERT-0159\":0.04,\"CERT-0160\":0.04,\"CERT-0161\":0.04,\"CERT-0162\":0.04,"
        + "\"CERT-0163\":0.04,\"CERT-0164\":0.04,\"CERT-0165\":0.04,\"CERT-0166\":0.04,\"CERT-0167\":0.04,\"CERT-0168\":0.04,"
        + "\"CERT-0169\":0.04,\"CERT-0170\":0.04,\"CERT-0171\":0.04,\"CERT-0172\":0.04,\"CERT-0173\":0.04,\"CERT-0174\":0.04,"
        + "\"CERT-0175\":0.04,\"CERT-0176\":0.04,\"CERT-0177\":0.04,\"CERT-0178\":0.04,\"CERT-0179\":0.04,\"CERT-0180\":0.02,"
        + "\"CERT-0181\":0.02,\"CERT-0182\":0.02,\"CERT-0183\":0.02,\"CERT-0184\":0.02,\"CERT-0185\":0.02,\"CERT-0186\":0.02,"
        + "\"CERT-0187\":0.02,\"CERT-0188\":0.02,\"CERT-0189\":0.02,\"CERT-0190\":0.04,\"CERT-0191\":0.04,\"CERT-0192\":0.04,"
        + "\"CERT-0193\":0.04,\"CERT-0194\":0.04,\"CERT-0195\":0.04,\"CERT-0196\":0.04,\"CERT-0197\":0.04,\"CERT-0198\":0.04,"
        + "\"CERT-0199\":0.04,\"CERT-0200\":0.04,\"CERT-0201\":0.02,\"CERT-0202\":0.02,\"CERT-0203\":0.02,\"CERT-0204\":0.02,"
        + "\"CERT-0205\":0.02,\"CERT-0206\":0.02,\"CERT-0207\":0.02,\"CERT-0208\":0.02,\"CERT-0209\":0.02,\"CERT-0210\":0.02,"
        + "\"CERT-0211\":0.02,\"CERT-0212\":0.02,\"CERT-0213\":0.02,\"CERT-0214\":0.02,\"CERT-0215\":0.02,\"CERT-0216\":0.02,"
        + "\"CERT-0217\":0.02,\"CERT-0218\":0.02,\"CERT-0219\":0.02,\"CERT-0220\":0.02,\"CERT-0221\":0.02,\"CERT-0222\":0.02,"
        + "\"CERT-0223\":0.02,\"CERT-0224\":0.02,\"CERT-0225\":0.02,\"CERT-0226\":0.02,\"CERT-0227\":0.04,\"CERT-0228\":0.04"
        + "}}";
}
