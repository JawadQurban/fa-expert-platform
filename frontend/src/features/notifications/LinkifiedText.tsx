import { Fragment } from 'react';
import { Link } from '@ds/primitives';
import { linkify } from './linkify';

/**
 * BUG-054 — notification text with its links clickable: plain runs as text
 * nodes, `http(s)` URLs as the design-system `Link` (inline, so underlined in
 * the sentence, WCAG 1.4.1). A link to another site opens in a new tab with
 * `noopener noreferrer` (the `Link`'s `external` behaviour); a link back into
 * this platform stays in the tab. No markup is ever interpreted — see `linkify`.
 */
export function LinkifiedText({ text }: { readonly text: string }) {
  return (
    <>
      {linkify(text).map((segment, index) =>
        segment.kind === 'text' ? (
          <Fragment key={index}>{segment.value}</Fragment>
        ) : (
          <Link
            key={index}
            href={segment.href}
            inline
            external={new URL(segment.href).origin !== window.location.origin}
          >
            {segment.value}
          </Link>
        )
      )}
    </>
  );
}
