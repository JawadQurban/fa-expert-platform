/**
 * BUG-054 — a notification body is plain template text with its placeholders
 * filled, and some placeholders are links (`{{actionUrl}}` — the Teams meeting
 * in «تأكيد موعد المقابلة», the page an action waits on). Rendered as text, the
 * link could only be copied by hand.
 *
 * This splits the text into plain runs and `http(s)` links, and nothing else.
 * It never produces markup: the caller renders each run as a React text node
 * and each link as a design-system `Link`, so a body can carry no HTML into
 * the page however it was written. Only `http:` and `https:` become links — a
 * `javascript:` or `data:` URL stays inert text.
 */
export type TextSegment =
  | { readonly kind: 'text'; readonly value: string }
  | { readonly kind: 'link'; readonly href: string; readonly value: string };

// Stops at whitespace, quotes, angle brackets and the Arabic/guillemet
// punctuation the templates wrap text in, so «…» and «،» never join a link.
const URL_PATTERN = /https?:\/\/[^\s<>"'«»،؛]+/giu;

// Sentence punctuation after a link belongs to the sentence: the E-015 body
// ends «الرابط: {{actionUrl}}.» — that full stop is not part of the URL.
const TRAILING_PUNCTUATION = /[.,;:!?)\]}…]+$/u;

function asHttpUrl(candidate: string): string | null {
  try {
    const url = new URL(candidate);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null;
  } catch {
    return null;
  }
}

/** The text as plain runs and links, in order; joining every `value` gives the text back. */
export function linkify(text: string): readonly TextSegment[] {
  const segments: TextSegment[] = [];
  let cursor = 0;
  for (const match of text.matchAll(URL_PATTERN)) {
    const start = match.index;
    const raw = match[0].replace(TRAILING_PUNCTUATION, '');
    const href = raw === '' ? null : asHttpUrl(raw);
    if (href == null) {
      continue;
    }
    if (start > cursor) {
      segments.push({ kind: 'text', value: text.slice(cursor, start) });
    }
    segments.push({ kind: 'link', href, value: raw });
    cursor = start + raw.length;
  }
  if (cursor < text.length) {
    segments.push({ kind: 'text', value: text.slice(cursor) });
  }
  return segments;
}
