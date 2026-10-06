import { Checkbox, Typography } from '@ds/primitives';
import type { ApplicationService } from '../application.types';
import type { ApplicationFormSchemaDto } from '../applicationForm.types';
import type { NewApplicationContent } from '../newApplication.content';
import styles from './ServiceSelection.module.css';

/**
 * EH-TP-05 step 1 — multi-select of the **4 contractual services** rendered
 * from the schema's `selectableServices` catalogue. Speaker is intentionally
 * absent (`BR-0113`: internal-only simplified record, never public
 * self-service) — the note below the group explains that to applicants.
 *
 * A `fieldset`/`legend` group of approved `Checkbox`es; the group-level
 * "select at least one" error is announced via `role="alert"` and referenced
 * from the error summary.
 */
export function ServiceSelection({
  schema,
  selected,
  onToggle,
  content,
  error,
}: {
  readonly schema: ApplicationFormSchemaDto;
  readonly selected: readonly ApplicationService[];
  readonly onToggle: (service: ApplicationService) => void;
  readonly content: NewApplicationContent;
  readonly error: string | null;
}) {
  return (
    <fieldset
      id="eh-field-services"
      className={styles.group}
      aria-describedby={error != null ? 'eh-services-error' : undefined}
    >
      <legend className={styles.legend}>{content.serviceStep.legend}</legend>
      <Typography as="p" variant="text-sm" color="muted">
        {content.serviceStep.hint}
      </Typography>
      {error != null && (
        <Typography as="p" id="eh-services-error" variant="text-sm" role="alert">
          {error}
        </Typography>
      )}
      {/*
        Cards rather than a plain checkbox list (FADS Expert Hub kit, EH-TP-05).
        Choosing what to apply for is the decision the whole form hangs on, and
        a stack of small checkboxes gives it the weight of a preferences panel.

        ⚠️ The card is a plain container, NOT a label and NOT clickable. Two
        reasons. `Checkbox` renders its own `<label>`, so wrapping it in another
        one nests labels — invalid HTML that double-fires the toggle in some
        browsers. And the kit makes the card itself clickable *as well as* the
        checkbox inside it, which is the same fault by a different route: two
        activation targets for one choice. The checkbox and its own label stay
        the only control, and the fieldset keeps its legend.

        ⚠️ No per-service description. The kit writes one for each — «استشارات
        تخصصية للقطاع المالي» and so on — and we do not have them: `content
        .services` carries labels only. Inventing a sentence that defines what a
        government service covers is a claim about its scope, not a styling
        choice.
      */}
      <div className={styles.options}>
        {schema.selectableServices.map((service) => (
          <div
            key={service}
            className={styles.option}
            data-selected={selected.includes(service) || undefined}
          >
            <Checkbox
              label={content.services[service]}
              checked={selected.includes(service)}
              onChange={() => onToggle(service)}
            />
          </div>
        ))}
      </div>
      {/* `BR-0113` — documented Speaker exclusion. */}
      <Typography as="p" variant="text-sm" color="muted">
        {content.serviceStep.speakerNote}
      </Typography>
    </fieldset>
  );
}
