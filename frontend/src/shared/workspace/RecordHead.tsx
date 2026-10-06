import { Fragment } from 'react';
import type { ReactNode } from 'react';
import { Card } from '@ds/composite';
import { Avatar, Typography } from '@ds/primitives';
import type { IconName } from '@ds/primitives';
import { IconTile } from './IconTile';
import styles from './RecordHead.module.css';

/**
 * The identity head of a staff record page (Option B prototype `.idh`): who or
 * what this record is, one line of facts, its status, and the actions that
 * belong to the record as a whole.
 *
 * A person is shown by their initials; a record with no person behind it (a
 * service request, a file under review) leads with an icon tile instead.
 *
 * ⚠️ The name is the page's `<h1>` even though it is set at the size of a card
 * title — the prototype makes the record, not a page banner, the focal point,
 * and the heading outline still has to start at level one.
 */
export function RecordHead({
  titleId,
  title,
  person,
  personImage,
  icon,
  meta,
  tags,
  actions,
  children,
}: {
  readonly titleId: string;
  readonly title: ReactNode;
  /** The person's name, for the initials badge. */
  readonly person?: string;
  /** Their photograph, when one exists; initials otherwise. */
  readonly personImage?: string;
  /** Used when there is no person. */
  readonly icon?: IconName;
  /** Facts about the record, shown on one line separated by «·». */
  readonly meta?: readonly ReactNode[];
  /** Status tags. */
  readonly tags?: ReactNode;
  readonly actions?: ReactNode;
  /** Anything the record needs under its head (e.g. a link onward). */
  readonly children?: ReactNode;
}) {
  const facts = (meta ?? []).filter((fact) => fact != null && fact !== '');

  return (
    <Card effect="shadow" className={styles.card}>
      <div className={styles.row}>
        {person != null ? (
          <Avatar name={person} src={personImage} size="lg" decorative className={styles.avatar} />
        ) : icon != null ? (
          <IconTile icon={icon} size="lg" />
        ) : null}
        <div className={styles.text}>
          <Typography
            as="h1"
            id={titleId}
            variant="text-lg"
            weight="bold"
            tabIndex={-1}
            className={styles.title}
          >
            {title}
          </Typography>
          {facts.length > 0 && (
            <p className={styles.meta}>
              {/* Each fact is its own element: it is read, found and matched as
                  one statement, not as a fragment of a run-on line. */}
              {facts.map((fact, index) => (
                <Fragment key={index}>
                  {index > 0 && <span aria-hidden="true"> · </span>}
                  <span>{fact}</span>
                </Fragment>
              ))}
            </p>
          )}
          {tags != null && <div className={styles.tags}>{tags}</div>}
        </div>
        {actions != null && <div className={styles.actions}>{actions}</div>}
      </div>
      {children}
    </Card>
  );
}
