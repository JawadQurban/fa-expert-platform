/**
 * **BUG-051 / `P-387` — the identity card as a PDF.**
 *
 * The owner's ruling (2026-10-28): «use a open source pdf generater». The card
 * is exported from its own DOM, as the screen shows it (the `P-343` layout):
 *
 * 1. `html-to-image` (MIT) draws the card through an SVG `foreignObject`, so
 *    the **browser itself** lays the text out — Arabic letters joined, RTL
 *    order, mixed Arabic/Latin digits, and the same font the screen uses. A
 *    PDF library that sets text itself (jsPDF's `text()`, pdfmake, PDFKit
 *    without a shaper, html2canvas's own text painter) breaks Arabic shaping.
 * 2. `jspdf` (MIT) wraps that image in a one-page PDF **the card's own size**:
 *    the card's height follows its content, so an A4 page would either shrink
 *    it or split it across pages. Printing still fits it to the paper.
 *
 * Both libraries are imported on demand, so neither reaches the main bundle
 * or the profile page's chunk until somebody actually exports a card.
 *
 * ⚠️ The PDF holds a picture of the card, not selectable text.
 */

/** CSS pixels → PDF points (96 px = 72 pt). */
const POINTS_PER_PIXEL = 0.75;
/** A quiet margin round the card on the page, in points. */
const PAGE_MARGIN_PT = 18;
/** Drawn at twice the CSS resolution, so the text stays sharp when printed. */
const PIXEL_RATIO = 2;

/** `trainer-card-<name>.pdf` — the name with the characters no file system takes removed. */
export function identityCardFileName(name: string, fallback: string): string {
  const stem = name
    .trim()
    .replace(/[\\/:*?"<>|.]+/g, '')
    .replace(/\s+/g, '-');
  return `trainer-card-${stem === '' ? fallback : stem}.pdf`;
}

/**
 * The trainer's photo as a `data:` URL the capture can embed, or `null` when it
 * cannot be had — the card then shows the initials, never a broken image.
 *
 * The photo is the staff attachment route (`/v1/attachments/{id}`), which
 * answers only a signed-in viewer allowed to see it: the request carries the
 * session cookie (`credentials: 'include'`, which the API's CORS policy allows
 * for the SPA's origin). It is a binary read, so it goes through `fetch`
 * rather than the JSON `apiClient`; no new endpoint is involved.
 */
export async function loadPhotoForExport(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, { credentials: 'include' });
    if (!response.ok) {
      return null;
    }
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () =>
        typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('read'));
      reader.onerror = () => reject(reader.error ?? new Error('read'));
      response.blob().then((blob) => reader.readAsDataURL(blob), reject);
    });
    // Only an image the browser can actually decode is used.
    const probe = new Image();
    probe.src = dataUrl;
    await probe.decode();
    return dataUrl;
  } catch {
    // Any failure (network, CORS, not an image) means "no photo": the card
    // falls back to the initials, exactly as it does on screen.
    return null;
  }
}

/** Draws `node` and saves it as `fileName`. Rejects if either step fails. */
export async function exportIdentityCardPdf(node: HTMLElement, fileName: string): Promise<void> {
  const [{ toPng }, { jsPDF }] = await Promise.all([import('html-to-image'), import('jspdf')]);

  const { width, height } = node.getBoundingClientRect();
  const image = await toPng(node, { pixelRatio: PIXEL_RATIO, width, height });

  const cardWidth = width * POINTS_PER_PIXEL;
  const cardHeight = height * POINTS_PER_PIXEL;
  const pageWidth = cardWidth + PAGE_MARGIN_PT * 2;
  const pageHeight = cardHeight + PAGE_MARGIN_PT * 2;
  const pdf = new jsPDF({
    orientation: pageWidth > pageHeight ? 'landscape' : 'portrait',
    unit: 'pt',
    format: [pageWidth, pageHeight],
    compress: true,
  });
  pdf.addImage(
    image,
    'PNG',
    PAGE_MARGIN_PT,
    PAGE_MARGIN_PT,
    cardWidth,
    cardHeight,
    undefined,
    'FAST'
  );
  pdf.save(fileName);
}
