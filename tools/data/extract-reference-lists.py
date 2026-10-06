"""
Extracts the three approved reference lists into the frontend's shared content
modules — by script, never retyped, the same rule `specializationDomains.ts`
already follows.

Sources (delivered 2026-09-21, attached to the Notion «Application Form Matrix»):

  specializations-and-universities.xlsx
      sheet «جميع التخصصات»  -> academicSpecializations.ts   (25 rows)
      sheet «جميع الجامعات»  -> universities.ts              (517 rows)
  certification-master-list.xlsx
      sheet «Certification Master List» -> professionalCertifications.ts (228 rows)

The relevance / geography columns are what makes the 2026-09-21 Evaluation
Matrix computable: criteria #2 (التخصص العام), #7 (مجال الشهادة المهنية) and
#8 (مصدر الشهادة) are direct look-ups on them.

Run from the repository root:
    python tools/data/extract-reference-lists.py
"""

from __future__ import annotations

import io
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

M = "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}"
R = "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}"

ROOT = Path(__file__).resolve().parents[2]
DOCS = ROOT / "docs" / "inputs"
OUT = ROOT / "frontend" / "src" / "shared" / "content"

LISTS_WORKBOOK = DOCS / "specializations-and-universities.xlsx"
CERTS_WORKBOOK = DOCS / "certification-master-list.xlsx"

# The exact source strings — matched verbatim, never normalised, so a change
# in the workbook surfaces as a failure here instead of a silent mis-scoring.
RELEVANT_SPECIALIZATION = "ذو صلة مباشرة بالأكاديمية المالية"
IRRELEVANT_SPECIALIZATION = "غير ذي صلة مباشرة"
RELEVANT_CERTIFICATE = "Relevant"
IRRELEVANT_CERTIFICATE = "Not Relevant"
GLOBAL_CERTIFICATE = "Global"
LOCAL_CERTIFICATE = "Saudi / Local"


def read_sheets(path: Path) -> dict[str, list[dict[str, str]]]:
    """Every sheet as a list of {column-letter: cell-text} rows."""
    archive = zipfile.ZipFile(path)
    try:
        shared_root = ET.fromstring(archive.read("xl/sharedStrings.xml"))
        shared = [
            "".join(t.text or "" for t in si.iter(M + "t"))
            for si in shared_root.findall(M + "si")
        ]
    except KeyError:
        shared = []

    workbook = ET.fromstring(archive.read("xl/workbook.xml"))
    relationships = ET.fromstring(archive.read("xl/_rels/workbook.xml.rels"))
    targets = {rel.get("Id"): rel.get("Target") for rel in relationships}

    sheets: dict[str, list[dict[str, str]]] = {}
    for sheet in workbook.find(M + "sheets"):
        target = targets[sheet.get(R + "id")].lstrip("/")
        if not target.startswith("xl/"):
            target = "xl/" + target
        rows: list[dict[str, str]] = []
        for row in ET.fromstring(archive.read(target)).iter(M + "row"):
            cells: dict[str, str] = {}
            for cell in row.findall(M + "c"):
                if cell.get("t") == "inlineStr":
                    inline = cell.find(M + "is")
                    text = (
                        "".join(t.text or "" for t in inline.iter(M + "t"))
                        if inline is not None
                        else ""
                    )
                else:
                    value = cell.find(M + "v")
                    if value is None:
                        continue
                    text = (
                        shared[int(value.text)]
                        if cell.get("t") == "s"
                        else (value.text or "")
                    )
                if text.strip():
                    column = "".join(ch for ch in cell.get("r") if ch.isalpha())
                    cells[column] = text.strip()
            if cells:
                rows.append(cells)
        sheets[sheet.get("name")] = rows
    return sheets


def ts_string(value: str) -> str:
    return "'" + value.replace("\\", "\\\\").replace("'", "\\'") + "'"


def write(path: Path, body: str) -> None:
    with io.open(path, "w", encoding="utf8", newline="\n") as handle:
        handle.write(body)
    print(f"wrote {path.relative_to(ROOT)}")


def build_specializations(rows: list[dict[str, str]]) -> str:
    """Sheet «جميع التخصصات» — 3 banner/header rows, then the list."""
    entries = []
    for index, row in enumerate(rows[3:], start=1):
        label_ar = row.get("A", "").strip()
        if not label_ar:
            continue
        relevance = row.get("C", "").strip()
        if relevance not in (RELEVANT_SPECIALIZATION, IRRELEVANT_SPECIALIZATION, ""):
            raise SystemExit(f"unrecognised specialization relevance: {relevance!r}")
        entries.append(
            {
                "value": f"spec-{index:03d}",
                "labelAr": label_ar,
                # One row ships without an English name; mirroring the Arabic
                # beats inventing a translation (the `specializationDomains`
                # rule).
                "labelEn": row.get("B", "").strip() or label_ar,
                # `EVAL-GAP-11`, decided 2026-09-29: a blank cell is NOT a
                # classification. `None` is a third state — no business
                # decision exists — and it is what keeps the scoring table
                # able to report UNRESOLVED instead of a silent zero.
                "relevant": None if relevance == "" else
                relevance == RELEVANT_SPECIALIZATION,
            }
        )

    lines = "\n".join(
        f"  {{ value: {ts_string(e['value'])}, labelAr: {ts_string(e['labelAr'])}, "
        f"labelEn: {ts_string(e['labelEn'])}, "
        f"relevant: {'null' if e['relevant'] is None else str(e['relevant']).lower()} }},"
        for e in entries
    )
    relevant = sum(1 for e in entries if e["relevant"] is True)
    unclassified = sum(1 for e in entries if e["relevant"] is None)
    return f'''/**
 * التخصص — the academic-specialization list delivered 2026-09-21, extracted
 * verbatim (by script — `tools/data/extract-reference-lists.py`) from the
 * «جميع التخصصات» sheet of `docs/inputs/specializations-and-universities.xlsx`.
 *
 * `relevant` is the workbook's own «مدى الصلة بالأكاديمية المالية» column, and
 * it is what makes Evaluation-Matrix criterion #2 («التخصص العام», max 10%)
 * computable at all — the matrix looks the applicant's selected specialization
 * up here and pays 0.1 for a related one, 0 for one ruled unrelated.
 * {relevant} of {len(entries)} are related.
 *
 * ⚠️ `relevant: null` means the source row carries NO relevance value, so no
 * business decision exists — {unclassified} of {len(entries)}. It is neither
 * related nor unrelated: such a value is OMITTED from criterion #2's scoring
 * table, the table is `strict`, and the answer is reported UNRESOLVED rather
 * than scored zero (`EVAL-GAP-11`, decided 2026-09-29). Writing it as «not
 * related» would state a decision nobody made.
 *
 * ⚠️ Codes (`spec-NNN`) are positional and stable — this module's own, pending
 * a real `profile.Education.Specialization` lookup id.
 */

export interface AcademicSpecializationOption {{
  readonly value: string;
  readonly labelAr: string;
  readonly labelEn: string;
  /**
   * «ذو صلة مباشرة بالأكاديمية المالية» — Evaluation Matrix criterion #2.
   * `null` = the source carries no classification, so no decision exists.
   */
  readonly relevant: boolean | null;
}}

export const ACADEMIC_SPECIALIZATION_OPTIONS: readonly AcademicSpecializationOption[] = [
{lines}
];
'''


def build_universities(rows: list[dict[str, str]]) -> str:
    """Sheet «جميع الجامعات» — 3 banner/header rows, then the list."""
    entries = []
    for index, row in enumerate(rows[3:], start=1):
        label_ar = row.get("B", "").strip()
        if not label_ar:
            continue
        entries.append(
            {
                "value": f"uni-{index:03d}",
                "labelAr": label_ar,
                "labelEn": row.get("C", "").strip() or label_ar,
            }
        )
    lines = "\n".join(
        f"  {{ value: {ts_string(e['value'])}, labelAr: {ts_string(e['labelAr'])}, "
        f"labelEn: {ts_string(e['labelEn'])} }},"
        for e in entries
    )
    return f'''/**
 * اسم الجامعة — the university list delivered 2026-09-21, extracted verbatim
 * (by script — `tools/data/extract-reference-lists.py`) from the
 * «جميع الجامعات» sheet of `docs/inputs/specializations-and-universities.xlsx`.
 *
 * Closes the Application Form Matrix's Form 2 #4 open item — the field was
 * free text because «the list sits in a file not readable here». {len(entries)}
 * institutions, inside and outside the Kingdom.
 *
 * The workbook's «الدولة / المدينة» column is deliberately NOT carried: no
 * approved field consumes it, and no criterion scores it.
 *
 * ⚠️ Codes (`uni-NNN`) are positional and stable — this module's own, pending
 * a real `profile.Education.Donor` lookup id.
 */

export interface UniversityOption {{
  readonly value: string;
  readonly labelAr: string;
  readonly labelEn: string;
}}

export const UNIVERSITY_OPTIONS: readonly UniversityOption[] = [
{lines}
];
'''


def build_certifications(rows: list[dict[str, str]]) -> str:
    """Sheet «Certification Master List» — one header row, then the list."""
    entries = []
    for row in rows[1:]:
        code = row.get("A", "").strip()
        name = row.get("B", "").strip()
        if not code or not name:
            continue
        geography = row.get("C", "").strip()
        relevance = row.get("F", "").strip()
        if geography not in (GLOBAL_CERTIFICATE, LOCAL_CERTIFICATE):
            raise SystemExit(f"unrecognised geographic recognition: {geography!r}")
        if relevance not in (RELEVANT_CERTIFICATE, IRRELEVANT_CERTIFICATE):
            raise SystemExit(f"unrecognised financial-sector relevance: {relevance!r}")
        entries.append(
            {
                "value": code,
                # English-only at source. Mirroring beats inventing an Arabic
                # name for a certification that is trademarked in English.
                "labelAr": name,
                "labelEn": name,
                "relevant": relevance == RELEVANT_CERTIFICATE,
                "global": geography == GLOBAL_CERTIFICATE,
            }
        )
    lines = "\n".join(
        f"  {{ value: {ts_string(e['value'])}, labelAr: {ts_string(e['labelAr'])}, "
        f"labelEn: {ts_string(e['labelEn'])}, relevant: {str(e['relevant']).lower()}, "
        f"isGlobal: {str(e['global']).lower()} }},"
        for e in entries
    )
    relevant = sum(1 for e in entries if e["relevant"])
    worldwide = sum(1 for e in entries if e["global"])
    return f'''/**
 * اسم الشهادة — the classified professional-certification master list
 * delivered 2026-09-21, extracted verbatim (by script —
 * `tools/data/extract-reference-lists.py`) from
 * `docs/inputs/certification-master-list.xlsx`.
 *
 * Two of its columns are what make Evaluation-Matrix criteria #7 and #8
 * computable — both were «No source field exists» (`EVAL-GAP-04`/`EVAL-GAP-05`)
 * until this file arrived:
 *
 * - `relevant` — the workbook's «Financial Sector Relevance». Criterion #7
 *   («مجال الشهادة المهنية», max 5%) pays 0.05 when ANY entered certificate is
 *   relevant. {relevant} of {len(entries)} are.
 * - `isGlobal` — the workbook's «Geographic Recognition» («Global» vs
 *   «Saudi / Local»). Criterion #8 («مصدر الشهادة», max 4%) pays 0.04 when ANY
 *   entered certificate is global, else 0.02 when any is local.
 *   {worldwide} of {len(entries)} are global.
 *
 * Both are best-of (MAX) across the applicant's certificate entries, per the
 * matrix's «Certificate Multi-Entry Scoring Policy» — «Do No Harm»: an added
 * entry can only help, never hurt.
 *
 * ⚠️ English-only at source. `labelAr` mirrors `labelEn` rather than inventing
 * an Arabic name for a certification trademarked in English.
 *
 * The workbook's `Credential Type`, `Official Certification URL`, `Topic` and
 * `Other Specialty` columns are deliberately NOT carried: no approved field
 * consumes them, and no criterion scores them.
 */

export interface ProfessionalCertificationOption {{
  readonly value: string;
  readonly labelAr: string;
  readonly labelEn: string;
  /** «Financial Sector Relevance» — Evaluation Matrix criterion #7. */
  readonly relevant: boolean;
  /** «Geographic Recognition» = Global — Evaluation Matrix criterion #8. */
  readonly isGlobal: boolean;
}}

export const PROFESSIONAL_CERTIFICATION_OPTIONS: readonly ProfessionalCertificationOption[] = [
{lines}
];
'''


def build_score_rules(
    specializations: list[dict[str, str]], certifications: list[dict[str, str]]
) -> str:
    """
    The three option→percentage-point tables the Evaluation Matrix's criteria
    #2, #7 and #8 look answers up in — emitted as C# so the backend's seed is
    generated from the same workbook rows as the frontend's dropdowns, never
    retyped beside them.

    Values are the matrix's own fractions ("ذو صلة مباشرة 0.1"), stored exactly
    as Notion writes them so a reviewer can diff the two.
    """
    spec_points: list[str] = []
    for index, row in enumerate(specializations[3:], start=1):
        if not row.get("A", "").strip():
            continue
        relevance = row.get("C", "").strip()
        if relevance == "":
            # `EVAL-GAP-11` — OMITTED on purpose. With `strict` below, the
            # look-up resolves to nothing AND says so, so a missing business
            # decision cannot masquerade as a made one.
            continue
        relevant = relevance == RELEVANT_SPECIALIZATION
        spec_points.append(f'\\"spec-{index:03d}\\":{"0.1" if relevant else "0"}')

    relevance_points: list[str] = []
    source_points: list[str] = []
    for row in certifications[1:]:
        code = row.get("A", "").strip()
        if not code or not row.get("B", "").strip():
            continue
        relevant = row.get("F", "").strip() == RELEVANT_CERTIFICATE
        worldwide = row.get("C", "").strip() == GLOBAL_CERTIFICATE
        relevance_points.append(f'\\"{code}\\":{"0.05" if relevant else "0"}')
        source_points.append(f'\\"{code}\\":{"0.04" if worldwide else "0.02"}')

    def csharp_literal(name: str, pairs: list[str], summary: str) -> str:
        """
        Every table is `strict`: a key it does not carry resolves to NOTHING
        and is reported UNRESOLVED, never scored 0. An unclassified value and
        a value ruled irrelevant are different statements, and a code that is
        not in the list at all is a configuration fault rather than either.
        """
        # Chunked on whole key:value pairs — never mid-escape — so the
        # generated file stays diffable AND stays a valid C# literal.
        per_line = 6
        lines = [
            ",".join(pairs[i : i + per_line]) + ("," if i + per_line < len(pairs) else "")
            for i in range(0, len(pairs), per_line)
        ]
        joined = "\n        + ".join(f'"{line}"' for line in lines)
        return (
            f"    /// <summary>{summary}</summary>\n"
            f"    internal const string {name} =\n"
            f'        "{{\\"kind\\":\\"option\\",\\"strict\\":true,\\"points\\":{{"\n'
            f"        + {joined}\n"
            f'        + "}}}}";\n'
        )

    return f'''namespace ExpertHub.Infrastructure.Persistence;

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
{{
{csharp_literal("SpecializationRelevance", spec_points, "Criterion #2 «التخصص العام» — 0.1 when related to the Financial Academy, 0 when ruled unrelated; an unclassified value is omitted and resolves UNRESOLVED. Max 10%.")}
{csharp_literal("CertificateRelevance", relevance_points, "Criterion #7 «مجال الشهادة المهنية» — 0.05 when financial-sector relevant, else 0. Best-of across entries. Max 5%.")}
{csharp_literal("CertificateSource", source_points, "Criterion #8 «مصدر الشهادة» — 0.04 global, 0.02 Saudi/local. Best-of across entries, so a global certificate wins. Max 4%.")}}}
'''


def main() -> None:
    lists = read_sheets(LISTS_WORKBOOK)
    certs = read_sheets(CERTS_WORKBOOK)
    specializations = lists["جميع التخصصات"]
    certifications = certs["Certification Master List"]
    write(OUT / "academicSpecializations.ts", build_specializations(specializations))
    write(OUT / "universities.ts", build_universities(lists["جميع الجامعات"]))
    write(OUT / "professionalCertifications.ts", build_certifications(certifications))
    write(
        ROOT
        / "backend"
        / "src"
        / "ExpertHub.Infrastructure"
        / "Persistence"
        / "EvaluationLookupTables.cs",
        build_score_rules(specializations, certifications),
    )


if __name__ == "__main__":
    main()
