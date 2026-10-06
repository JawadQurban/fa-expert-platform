import type { ReactNode } from 'react';
import styles from './WorkspacePage.module.css';

/**
 * The staff workspace page frame — the approved Option B prototype's page
 * column: one centred column on the subtle ground, with every card stacked at
 * a single rhythm.
 *
 * ⚠️ Replaces `Section` + `Container` on the internal screens. `Section` carries
 * the marketing `section-gap` (64px) above and below its content, which is why
 * every staff page used to open on a band of empty ground the prototype does
 * not have. The spacing between blocks lives here, once — pages stop giving
 * their blocks their own margins.
 */
export function WorkspacePage({
  labelledBy,
  label,
  children,
}: {
  /** Id of the page's `<h1>`; preferred over `label`. */
  readonly labelledBy?: string;
  /** Used where the page has no heading yet (loading / error branches). */
  readonly label?: string;
  readonly children: ReactNode;
}) {
  return (
    <section className={styles.page} aria-labelledby={labelledBy} aria-label={label}>
      {children}
    </section>
  );
}
