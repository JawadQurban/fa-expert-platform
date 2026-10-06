import type { ReactNode } from 'react';
import { ErrorState } from '@ds/composite';
import { Typography } from '@ds/primitives';
import { Container, Section } from '@ds/layout';
import styles from './PageLoadError.module.css';

/**
 * The whole page, when the record behind it could not be loaded — not found,
 * not yours, no session, or the transport failed.
 *
 * **Why this exists.** Every page had hand-rolled this block as
 * `<Section aria-label>` → `<Container>` → `<ErrorState>` → a way back. That
 * shape has no heading element in it at all: `ErrorState` composes `Alert`,
 * and `Alert` renders its title as text, not as a heading. So a reader
 * navigating by heading found **nothing** on these screens — not merely no
 * `<h1>`, but no headings whatsoever, with the region's `aria-label` the only
 * thing naming the page.
 *
 * So the title is promoted to a real `<h1>` here and `ErrorState`'s own
 * `title` is left off (it is optional in the DS API). The page says what it
 * is; the alert says what went wrong. The string is not printed twice.
 *
 * ⚠️ The `<h1>` carries `tabIndex={-1}` so it *can* be focused, but this
 * component never focuses it. Pages own their focus effects, and those are
 * gated on a ready phase — moving focus from here would fight them.
 */

/** Shared by every page, and safe as a constant: only one page renders at a time. */
const TITLE_ID = 'eh-page-error-title';

export interface PageLoadErrorProps {
  /** What the page is — becomes the `<h1>`. */
  readonly title: string;
  /** What went wrong, and what to do about it. */
  readonly body: ReactNode;
  /** Omitted for a denial: retrying a 403 produces the same 403. */
  readonly onRetry?: () => void;
  readonly retryLabel: string;
  /** A way out — typically a button back to the list this record came from. */
  readonly action?: ReactNode;
  /** `'prose'` narrows the column, as several of these pages already did. */
  readonly size?: 'prose';
}

export function PageLoadError({
  title,
  body,
  onRetry,
  retryLabel,
  action,
  size,
}: PageLoadErrorProps) {
  return (
    <Section aria-labelledby={TITLE_ID}>
      <Container size={size}>
        <div className={styles.head}>
          <Typography as="h1" id={TITLE_ID} variant="display-md" tabIndex={-1}>
            {title}
          </Typography>
        </div>
        <ErrorState description={body} onRetry={onRetry} retryLabel={retryLabel} />
        {action != null && <div className={styles.action}>{action}</div>}
      </Container>
    </Section>
  );
}
