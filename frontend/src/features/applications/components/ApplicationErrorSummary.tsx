import { Alert } from '@ds/composite';
import { focusFieldTarget } from '../focusField';
import styles from './ApplicationErrorSummary.module.css';

export interface ErrorSummaryItem {
  /** DOM id of the `eh-field-*` wrapper to focus. */
  readonly targetId: string;
  readonly message: string;
}

/**
 * Accessible validation summary (`05` EH-TP-05 §18 — "errors summarized and
 * linked to fields"): an error `Alert` announced via `role="alert"`, each item
 * an in-page link that moves focus to its invalid field. The page also focuses
 * the first invalid field directly after a failed step/submit.
 */
export function ApplicationErrorSummary({
  title,
  items,
}: {
  readonly title: string;
  readonly items: readonly ErrorSummaryItem[];
}) {
  if (items.length === 0) {
    return null;
  }
  return (
    <Alert tone="error" role="alert" title={title} id="eh-application-error-summary">
      <ul className={styles.list}>
        {items.map((item) => (
          <li key={`${item.targetId}-${item.message}`}>
            <a
              className={styles.link}
              href={`#${item.targetId}`}
              onClick={(event) => {
                event.preventDefault();
                focusFieldTarget(item.targetId);
              }}
            >
              {item.message}
            </a>
          </li>
        ))}
      </ul>
    </Alert>
  );
}
