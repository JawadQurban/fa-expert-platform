import { useId, useRef, useState } from 'react';
import { Alert } from '@ds/composite';
import { Button, TextInput, Typography } from '@ds/primitives';
import type { Locale } from '@/types';
import { localized } from '../../../shared/types/localizedText';
import type { ApplicationService } from '../../applications/application.types';
import type { AgreementsContent } from '../agreements.content';
import { validateAgreementFields } from '../agreement.types';
import type { AgreementFieldSchema, AgreementFieldValues } from '../agreement.types';
import { Panel } from '../../../shared/workspace/Panel';
import styles from './AgreementPreparationForm.module.css';

/**
 * J-10/F1 — the creator fills the editable template fields; the trainer and bank
 * data are merged in **afterwards** (AC-2, `BR-0212`).
 *
 * The ordering is the point: the merged data appears only once the fields are
 * saved, and only read-only — in the frozen `AgreementDocumentView` the page
 * renders below this form. There is no input anywhere on this page that would
 * let the creator re-key a trainer or bank value, which is what "no manual
 * re-entry" means in practice.
 *
 * The field list itself is configuration (`DM-GAP-16` is still open), so the
 * form renders whatever schema it receives and states that openly.
 */
export function AgreementPreparationForm({
  schema,
  initialValues,
  approvedServices,
  saved,
  content,
  locale,
  submitting,
  onSave,
}: {
  readonly schema: readonly AgreementFieldSchema[];
  readonly initialValues: AgreementFieldValues;
  readonly approvedServices: readonly ApplicationService[];
  readonly saved: boolean;
  readonly content: AgreementsContent;
  readonly locale: Locale;
  readonly submitting: boolean;
  readonly onSave: (values: AgreementFieldValues) => void;
}) {
  const copy = content.preparation;
  const formId = useId();
  const errorsRef = useRef<HTMLDivElement>(null);

  const [values, setValues] = useState<AgreementFieldValues>(initialValues);
  const [missing, setMissing] = useState<readonly string[]>([]);
  const [editing, setEditing] = useState(!saved);

  const serviceList = approvedServices
    .map((service) => content.services[service])
    .join(locale === 'ar' ? '، ' : ', ');

  const handleSave = () => {
    const issues = validateAgreementFields(schema, values);
    setMissing(issues.map((issue) => issue.fieldId));
    if (issues.length > 0) {
      errorsRef.current?.focus();
      return;
    }
    setEditing(false);
    onSave(values);
  };

  return (
    <Panel
      shape="inline"
      title={copy.heading}
      titleId={`${formId}-heading`}
      description={copy.description}
    >
      {/* F1/AC-3 — the agreement reflects exactly the approved services. */}
      <Typography as="p" variant="text-xs" color="muted">
        {copy.servicesNote(serviceList)}
      </Typography>
      <Typography as="p" variant="text-xs" color="muted">
        {copy.historyNote}
      </Typography>

      {saved && !editing ? (
        <>
          <Alert tone="success" surface="tinted" title={copy.savedTitle} role="status">
            {copy.savedBody}
          </Alert>
          <dl className={styles.summary}>
            {schema.map((field) => (
              <div key={field.id} className={styles.summaryRow}>
                <dt>
                  <Typography as="span" variant="text-sm" color="muted">
                    {localized(field.label, locale)}
                  </Typography>
                </dt>
                <dd>
                  <Typography as="span" variant="text-md">
                    <bdi>{values[field.id] === '' ? '—' : (values[field.id] ?? '—')}</bdi>
                  </Typography>
                </dd>
              </div>
            ))}
          </dl>
          <div>
            <Button variant="tertiary" size="md" onClick={() => setEditing(true)}>
              {copy.edit}
            </Button>
          </div>
        </>
      ) : (
        <>
          {/* `DM-GAP-16` is open — say so rather than implying the list is final. */}
          <Alert tone="warning" surface="tinted" role="status">
            {copy.templateNote}
          </Alert>

          <div className={styles.grid}>
            {schema.map((field) => (
              <TextInput
                key={field.id}
                type={field.type === 'date' ? 'date' : field.type === 'number' ? 'number' : 'text'}
                label={localized(field.label, locale)}
                helperText={field.help == null ? undefined : localized(field.help, locale)}
                value={values[field.id] ?? ''}
                onChange={(event) => {
                  setValues((current) => ({ ...current, [field.id]: event.target.value }));
                  setMissing((current) => current.filter((id) => id !== field.id));
                }}
                requiredField={field.required}
                errorText={missing.includes(field.id) ? copy.requiredError : undefined}
              />
            ))}
          </div>

          {missing.length > 0 && (
            <div
              ref={errorsRef}
              className={styles.errors}
              role="alert"
              tabIndex={-1}
              aria-labelledby={`${formId}-errors`}
            >
              <Typography as="h3" id={`${formId}-errors`} variant="text-md" weight="bold">
                {copy.errorsHeading}
              </Typography>
              <ul className={styles.errorList}>
                {missing.map((fieldId) => {
                  const field = schema.find((entry) => entry.id === fieldId);
                  return (
                    <li key={fieldId}>
                      {field == null ? fieldId : localized(field.label, locale)}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          <div>
            <Button variant="primary" size="md" onClick={handleSave} disabled={submitting}>
              {copy.save}
            </Button>
          </div>
        </>
      )}
    </Panel>
  );
}
