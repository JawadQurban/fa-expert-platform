import { Card } from '@ds/composite';
import { Typography } from '@ds/primitives';
import type { Locale } from '@/types';
import type { ApplicationService } from '../../applications/application.types';
import type {
  ApplicationEntryDto,
  ApplicationFormSchemaDto,
  ApplicationSectionSchema,
} from '../../applications/applicationForm.types';
import {
  entryTitle,
  fieldLabel,
  visibleSectionFields,
} from '../../applications/applicationValidation';
import { displayValue } from './fieldDisplay';
import styles from './ReadOnlyEntries.module.css';

/**
 * The **reading** half of a repeatable section (`dm-gap-01.2026-09-21`): one
 * approved `Card` per entry, exactly the treatment the application form's own
 * `RepeatableSection` gives an entry being edited — same `as="div"` +
 * `role="group"` + heading-labelled card, so «المؤهل 2» reads the same whether
 * the trainer is filling it in or looking at it afterwards.
 *
 * Page-level composition, not a Design-System component: it composes the
 * approved `Card` and `Typography` and owns nothing but layout.
 *
 * It renders **labels, never codes** — the field's own display label, and for a
 * select/multi-select the chosen option's label («دكتوراه», not `doctorate`).
 * `entryId` / `entryIndex` are internal wire identity and never reach the DOM
 * as text; an entry is named by its schema noun and its 1-based position.
 *
 * Lives under `profile/` because EH-TP-04 is its first consumer;
 * `ApplicationDetailPage` imports it the same way it already imports this
 * folder's `BankDataSection`.
 */
export function ReadOnlyEntries({
  schema,
  section,
  services,
  entries,
  locale,
  firstIndex = 0,
}: {
  readonly schema: ApplicationFormSchemaDto;
  readonly section: ApplicationSectionSchema;
  readonly services: readonly ApplicationService[];
  readonly entries: readonly ApplicationEntryDto[];
  readonly locale: Locale;
  /** Position of `entries[0]` within the whole section — numbering only. */
  readonly firstIndex?: number;
}) {
  return (
    <>
      {entries.map((entry, offset) => {
        const index = firstIndex + offset;
        // Position-based, so no wire id ever lands in the markup.
        const headingId = `eh-entry-read-${section.id}-${index}`;
        return (
          <Card
            key={entry.entryId}
            // `as="div"`, not the Card's default `<article>`: ARIA-in-HTML does
            // not allow `role="group"` on an article (the `RepeatableSection`
            // lesson, and axe is right to say so).
            as="div"
            effect="stroke"
            role="group"
            aria-labelledby={headingId}
            className={styles.entry}
          >
            <Typography as="h3" id={headingId} variant="text-md" weight="bold">
              {entryTitle(section, locale, index)}
            </Typography>
            <dl className={styles.rows}>
              {visibleSectionFields(schema, section.id, services, entry.values).map((field) => (
                <div key={field.id} className={styles.row}>
                  <dt className={styles.term}>
                    <Typography as="span" variant="text-sm" color="muted">
                      {fieldLabel(field, locale)}
                    </Typography>
                  </dt>
                  <dd className={styles.value}>
                    <bdi>{displayValue(field, entry.values[field.id], locale) || '—'}</bdi>
                  </dd>
                </div>
              ))}
            </dl>
          </Card>
        );
      })}
    </>
  );
}
