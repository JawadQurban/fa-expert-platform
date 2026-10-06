import { Card } from '@ds/composite';
import type { Locale } from '@/types';
import type { ApplicationService } from '../application.types';
import type {
  ApplicationFieldValue,
  ApplicationFormSchemaDto,
  ApplicationSectionSchema,
} from '../applicationForm.types';
import { visibleSectionFields } from '../applicationValidation';
import type { NewApplicationContent } from '../newApplication.content';
import { DynamicFieldRenderer } from './DynamicFieldRenderer';
import styles from './ApplicationFormSection.module.css';

/**
 * One NON-repeatable schema section of the dynamic form: its visible fields in
 * display order, inside the approved Card. Since `dm-gap-01.2026-09-21` every
 * section is its own wizard step, so the step's own `h2` carries the section
 * title and this does not repeat it. Renders nothing when the selection leaves
 * the section empty — fields appear/disappear with the service selection
 * (`BR-0104`), announced by the page's live region.
 *
 * A **repeatable** section renders through `RepeatableSection` instead.
 */
export function ApplicationFormSection({
  schema,
  section,
  services,
  values,
  errors,
  locale,
  content,
  onChange,
}: {
  readonly schema: ApplicationFormSchemaDto;
  readonly section: ApplicationSectionSchema;
  readonly services: readonly ApplicationService[];
  readonly values: Readonly<Record<string, ApplicationFieldValue>>;
  readonly errors: Readonly<Record<string, string>>;
  readonly locale: Locale;
  readonly content: NewApplicationContent;
  readonly onChange: (fieldId: string, value: ApplicationFieldValue) => void;
}) {
  const fields = visibleSectionFields(schema, section.id, services, values);
  if (fields.length === 0) {
    return null;
  }

  return (
    <Card effect="stroke" className={styles.section}>
      <div className={styles.fields}>
        {fields.map((field) => (
          <DynamicFieldRenderer
            key={field.id}
            field={field}
            value={values[field.id]}
            error={errors[field.id]}
            services={services}
            locale={locale}
            content={content}
            onChange={onChange}
          />
        ))}
      </div>
    </Card>
  );
}
