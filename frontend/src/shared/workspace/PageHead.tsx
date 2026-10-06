import type { ReactNode } from 'react';
import { Typography } from '@ds/primitives';
import styles from './PageHead.module.css';

/**
 * The head of a staff list/console page (Option B prototype `.ph`): the title,
 * one line saying what the page is for, the live count, and the page's own
 * actions pinned to the end and aligned to the bottom of the text.
 *
 * The `<h1>` is the page's programmatic focus target (`tabIndex={-1}`), so its
 * id is required — every page focuses it on arrival.
 */
export function PageHead({
  titleId,
  title,
  lead,
  summary,
  actions,
  breadcrumbs,
}: {
  readonly titleId: string;
  readonly title: ReactNode;
  /** What the page is for — one sentence. */
  readonly lead?: ReactNode;
  /** The count line. Announced politely: it changes as filters change. */
  readonly summary?: ReactNode;
  readonly actions?: ReactNode;
  /** A DS `Breadcrumbs`, rendered above the title. */
  readonly breadcrumbs?: ReactNode;
}) {
  return (
    <div className={styles.head}>
      {breadcrumbs}
      <div className={styles.row}>
        <div className={styles.text}>
          <Typography
            as="h1"
            id={titleId}
            variant="display-lg"
            tabIndex={-1}
            className={styles.title}
          >
            {title}
          </Typography>
          {lead != null && (
            <Typography as="p" variant="text-sm" color="muted">
              {lead}
            </Typography>
          )}
          {summary != null && (
            <Typography
              as="p"
              variant="text-sm"
              weight="semibold"
              role="status"
              className={styles.summary}
            >
              {summary}
            </Typography>
          )}
        </div>
        {actions != null && <div className={styles.actions}>{actions}</div>}
      </div>
    </div>
  );
}
