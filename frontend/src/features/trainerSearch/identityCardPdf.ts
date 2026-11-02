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
 * 2. `jspdf` (MIT) places that image on **A4** pages at its natural scale (owner
 *    ruling 2026-11-01, `P-387`). The card's height follows its content, so a
 *    long one continues on another page, breaking between rows, never through one.
 *
 * ⚠️ The sheet is a temporary template built from the design system; the owner
 * will supply a branded one (`IdentityCardPanel`).
 *
 * Both libraries are imported on demand, so neither reaches the main bundle
 * or the profile page's chunk until somebody actually exports a card.
 *
 * ⚠️ The PDF holds a picture of the card, not selectable text.
 */

/** CSS pixels → PDF points (96 px = 72 pt). */
const POINTS_PER_PIXEL = 0.75;
/** ISO 216 A4, in points. */
const A4_WIDTH_PT = 595.28;
const A4_HEIGHT_PT = 841.89;
/** The page margin, in points (10 mm). */
const PAGE_MARGIN_PT = 28.35;
/** The width the sheet is laid out at, so one CSS pixel prints at its natural size. */
export const A4_SHEET_WIDTH_PX = (A4_WIDTH_PT - PAGE_MARGIN_PT * 2) / POINTS_PER_PIXEL;
const A4_SHEET_HEIGHT_PX = (A4_HEIGHT_PT - PAGE_MARGIN_PT * 2) / POINTS_PER_PIXEL;
/** Marks an element a page may break after. */
export const PDF_BLOCK_ATTRIBUTE = 'data-pdf-block';
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

export interface PageSlice {
  readonly start: number;
  readonly end: number;
}

/**
 * Where each page starts and ends, in sheet pixels: as far as a block's end that
 * still fits. A single block taller than a page is the one thing cut through.
 */
export function pageSlices(
  blockEnds: readonly number[],
  totalHeight: number,
  pageHeight: number
): readonly PageSlice[] {
  const slices: PageSlice[] = [];
  let start = 0;
  while (totalHeight - start > pageHeight) {
    const limit = start + pageHeight;
    const end = blockEnds.filter((block) => block > start && block <= limit).at(-1) ?? limit;
    slices.push({ start, end });
    start = end;
  }
  slices.push({ start, end: totalHeight });
  return slices;
}

/** One page's strip of the captured sheet, as a PNG `data:` URL. */
async function cropSlice(image: string, slice: PageSlice, width: number): Promise<string> {
  const source = new Image();
  source.src = image;
  await source.decode();
  const canvas = document.createElement('canvas');
  canvas.width = width * PIXEL_RATIO;
  canvas.height = (slice.end - slice.start) * PIXEL_RATIO;
  const context = canvas.getContext('2d');
  if (context == null) {
    throw new Error('canvas');
  }
  context.drawImage(source, 0, -slice.start * PIXEL_RATIO);
  return canvas.toDataURL('image/png');
}

/** Draws `sheet` and saves it as `fileName`. Rejects if either step fails. */
export async function exportIdentityCardPdf(sheet: HTMLElement, fileName: string): Promise<void> {
  const [{ toPng }, { jsPDF }] = await Promise.all([import('html-to-image'), import('jspdf')]);

  const { width, height, top } = sheet.getBoundingClientRect();
  const image = await toPng(sheet, { pixelRatio: PIXEL_RATIO, width, height });

  const blockEnds = Array.from(sheet.querySelectorAll(`[${PDF_BLOCK_ATTRIBUTE}]`))
    .map((block) => block.getBoundingClientRect().bottom - top)
    .sort((a, b) => a - b);
  const slices = pageSlices(blockEnds, height, A4_SHEET_HEIGHT_PX);

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4', compress: true });
  for (const [index, slice] of slices.entries()) {
    if (index > 0) {
      pdf.addPage();
    }
    pdf.addImage(
      slices.length === 1 ? image : await cropSlice(image, slice, width),
      'PNG',
      PAGE_MARGIN_PT,
      PAGE_MARGIN_PT,
      width * POINTS_PER_PIXEL,
      (slice.end - slice.start) * POINTS_PER_PIXEL,
      undefined,
      'FAST'
    );
  }
  pdf.save(fileName);
}
