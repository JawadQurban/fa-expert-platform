using System.IO.Compression;
using System.Text;
using System.Xml.Linq;
using ExpertHub.Infrastructure.Documents;
using UglyToad.PdfPig;

namespace ExpertHub.Infrastructure.Profiles;

/// <summary>
/// The text of an uploaded CV, for the bio draft (`P-331`).
/// </summary>
/// <remarks>
/// <para>
/// PDF through PdfPig, Word (.docx) through the zip and XML it already is, and
/// plain text as is — recognised by the file's own bytes, not its declared type. Anything else (a scanned image, a legacy .doc) returns
/// null: the trainer writes the bio themselves. There is no OCR, and no guess.
/// </para>
/// <para>
/// ⚠️ Arabic PDFs can come out with words in visual rather than logical order —
/// a property of how the PDF stores them, not of this code. The model reading
/// it copes with that well enough for a draft the trainer then edits; it is
/// not good enough to publish unread, which is why nothing here publishes.
/// </para>
/// </remarks>
public static class CvText
{
    /// <summary>Enough for a bio; a CV beyond this is not read further.</summary>
    public const int MaxCharacters = 20_000;

    public static string? Extract(DocumentContent document)
    {
        ArgumentNullException.ThrowIfNull(document);
        var bytes = document.Bytes;
        string? text;
        try
        {
            // By CONTENT first: a browser often uploads a CV as
            // `application/octet-stream`, and the declared type is a claim
            // while the first bytes are a fact. A PDF opens with `%PDF`; a .docx
            // is a zip, opening with `PK`. Only plain text relies on the type.
            text = StartsWith(bytes, "%PDF"u8) ? Pdf(bytes)
                : StartsWith(bytes, "PK"u8) ? Docx(bytes)
                : document.MimeType == "text/plain" ? Encoding.UTF8.GetString(bytes)
                : null;
        }
        // A corrupt or encrypted file is a CV we cannot read, not a crash.
        catch (Exception exception) when (exception is not OutOfMemoryException)
        {
            return null;
        }
        if (string.IsNullOrWhiteSpace(text))
        {
            return null;
        }
        text = text.Trim();
        return text.Length <= MaxCharacters ? text : text[..MaxCharacters];
    }

    private static bool StartsWith(byte[] bytes, ReadOnlySpan<byte> signature) =>
        bytes.AsSpan().StartsWith(signature);

    private static string Pdf(byte[] bytes)
    {
        using var pdf = PdfDocument.Open(bytes);
        var text = new StringBuilder();
        foreach (var page in pdf.GetPages())
        {
            text.AppendLine(page.Text);
            if (text.Length > MaxCharacters)
            {
                break;
            }
        }
        return text.ToString();
    }

    private static string? Docx(byte[] bytes)
    {
        using var zip = new ZipArchive(new MemoryStream(bytes), ZipArchiveMode.Read);
        var body = zip.GetEntry("word/document.xml");
        if (body is null)
        {
            return null;
        }
        using var stream = body.Open();
        XNamespace w = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
        // One line per paragraph, the runs inside it joined.
        return string.Join('\n', XDocument.Load(stream)
            .Descendants(w + "p")
            .Select(p => string.Concat(p.Descendants(w + "t").Select(t => t.Value))));
    }
}
