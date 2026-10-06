using System.IO.Compression;
using System.Text;
using ExpertHub.Infrastructure.Documents;
using ExpertHub.Infrastructure.Profiles;
using UglyToad.PdfPig.Fonts.Standard14Fonts;
using UglyToad.PdfPig.Writer;

namespace ExpertHub.Api.Tests;

/// <summary>`P-331` — reading a CV's text for the bio draft.</summary>
public sealed class CvTextTests
{
    [Fact]
    public void A_pdf_cv_is_read()
    {
        var builder = new PdfDocumentBuilder();
        var page = builder.AddPage(UglyToad.PdfPig.Content.PageSize.A4);
        var font = builder.AddStandard14Font(Standard14Font.Helvetica);
        page.AddText("Financial compliance trainer", 12, new UglyToad.PdfPig.Core.PdfPoint(50, 700), font);

        var text = CvText.Extract(new DocumentContent(builder.Build(), "application/pdf", "cv.pdf"));

        Assert.Contains("Financial compliance trainer", text, StringComparison.Ordinal);
    }

    [Fact]
    public void A_word_cv_is_read_one_line_per_paragraph()
    {
        var text = CvText.Extract(new DocumentContent(
            Docx("مدربة في الامتثال", "ماجستير إدارة مالية"),
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "cv.docx"));

        Assert.Equal("مدربة في الامتثال\nماجستير إدارة مالية", text);
    }

    [Fact]
    public void A_cv_uploaded_as_octet_stream_is_recognised_by_its_content()
    {
        // Found on the testing server: the browser sent the CV as
        // `application/octet-stream`, and trusting that read nothing.
        var builder = new PdfDocumentBuilder();
        var page = builder.AddPage(UglyToad.PdfPig.Content.PageSize.A4);
        page.AddText("Trainer", 12, new UglyToad.PdfPig.Core.PdfPoint(50, 700),
            builder.AddStandard14Font(Standard14Font.Helvetica));

        Assert.Contains("Trainer", CvText.Extract(new DocumentContent(
            builder.Build(), "application/octet-stream", "upload")), StringComparison.Ordinal);
        Assert.Equal("سطر", CvText.Extract(new DocumentContent(
            Docx("سطر"), "application/octet-stream", "upload")));
    }

    [Theory]
    [InlineData("image/jpeg", "cv.jpg")]
    [InlineData("application/msword", "cv.doc")]
    public void A_format_it_cannot_read_returns_nothing_rather_than_a_guess(string mime, string name) =>
        Assert.Null(CvText.Extract(new DocumentContent([1, 2, 3], mime, name)));

    [Fact]
    public void A_corrupt_file_returns_nothing_instead_of_throwing() =>
        Assert.Null(CvText.Extract(new DocumentContent(
            Encoding.UTF8.GetBytes("not a pdf"), "application/pdf", "cv.pdf")));

    /// <summary>The smallest .docx Word would open: one part, the body.</summary>
    private static byte[] Docx(params string[] paragraphs)
    {
        using var buffer = new MemoryStream();
        using (var zip = new ZipArchive(buffer, ZipArchiveMode.Create, leaveOpen: true))
        {
            using var writer = new StreamWriter(zip.CreateEntry("word/document.xml").Open());
            writer.Write(
                "<w:document xmlns:w=\"http://schemas.openxmlformats.org/wordprocessingml/2006/main\"><w:body>"
                + string.Concat(paragraphs.Select(p => $"<w:p><w:r><w:t>{p}</w:t></w:r></w:p>"))
                + "</w:body></w:document>");
        }
        return buffer.ToArray();
    }
}
