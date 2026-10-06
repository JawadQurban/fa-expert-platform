import type { ReactNode } from 'react';
import { Card } from '@ds/composite';
import type { IconName } from '@ds/primitives';
import { IconTile, type IconTileTone } from './IconTile';
import styles from './Panel.module.css';

/**
 * A staff workspace card (Option B prototype `.cd`), in the prototype's two
 * shapes:
 *
 * - **bar** (default) — a header row with an optional icon tile, the title and
 *   a quiet meta note at the end, ruled off from the body. Evidence and
 *   supporting panels.
 * - **inline** — the title opens the padded body with no rule under it. The
 *   decision cards, where the heading and the controls read as one block.
 *
 * `toolbar` sits between the header and the body (a list's filter bar),
 * `footer` under the body (a list's paging row). `flush` removes the body
 * padding so a table or a row list meets the card edges.
 */
export function Panel({
  title,
  titleId,
  headingLevel = 2,
  icon,
  tone = 'primary',
  meta,
  actions,
  description,
  toolbar,
  footer,
  shape = 'bar',
  flush = false,
  focusableTitle = false,
  label,
  className,
  children,
}: {
  readonly title?: ReactNode;
  readonly titleId?: string;
  readonly headingLevel?: 2 | 3;
  readonly icon?: IconName;
  readonly tone?: IconTileTone;
  readonly meta?: ReactNode;
  /** Controls that belong in the header row, after the meta note. */
  readonly actions?: ReactNode;
  /** One muted sentence under an inline title. */
  readonly description?: ReactNode;
  readonly toolbar?: ReactNode;
  readonly footer?: ReactNode;
  readonly shape?: 'bar' | 'inline';
  readonly flush?: boolean;
  /** The heading is a programmatic focus target — it announces an outcome. */
  readonly focusableTitle?: boolean;
  /** Names the region when it has no visible title. */
  readonly label?: string;
  readonly className?: string;
  readonly children?: ReactNode;
}) {
  const Heading = headingLevel === 3 ? 'h3' : 'h2';
  const hasTitle = title != null;

  const heading = hasTitle && (
    <Heading id={titleId} className={styles.title} tabIndex={focusableTitle ? -1 : undefined}>
      {title}
    </Heading>
  );

  return (
    <Card
      as="section"
      effect="shadow"
      className={[styles.panel, className].filter(Boolean).join(' ')}
      aria-labelledby={hasTitle && titleId != null ? titleId : undefined}
      aria-label={!hasTitle || titleId == null ? label : undefined}
    >
      {hasTitle && shape === 'bar' && (
        <div className={styles.bar}>
          {icon != null && <IconTile icon={icon} tone={tone} />}
          {heading}
          {meta != null && <span className={styles.meta}>{meta}</span>}
          {actions != null && <div className={styles.actions}>{actions}</div>}
        </div>
      )}
      {toolbar != null && <div className={styles.toolbar}>{toolbar}</div>}
      {(children != null || (hasTitle && shape === 'inline')) && (
        <div className={styles.body} data-flush={flush || undefined}>
          {hasTitle && shape === 'inline' && (
            <div className={styles.inlineHead}>
              <div className={styles.inlineTitle}>
                {icon != null && <IconTile icon={icon} tone={tone} />}
                {heading}
                {actions != null && <div className={styles.actions}>{actions}</div>}
              </div>
              {description != null && <p className={styles.description}>{description}</p>}
            </div>
          )}
          {children}
        </div>
      )}
      {footer != null && <div className={styles.footer}>{footer}</div>}
    </Card>
  );
}
