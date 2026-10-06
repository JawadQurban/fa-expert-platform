import { useId, useRef, useState } from 'react';
import { Alert, FileUploader } from '@ds/composite';
import type { UploadedFile } from '@ds/composite';
import { Button, TextInput, Typography } from '@ds/primitives';
import type { Locale } from '@/types';
import { localized } from '../../../shared/types/localizedText';
import type { ApplicationService } from '../../applications/application.types';
import type { AgreementsContent } from '../agreements.content';
import { validateAgreementFields } from '../agreement.types';
import { getAgreementService } from '../agreementService';
import { ADDENDUM_FORMATS, addendumFileIssue } from '../../serviceRequests/serviceRequest.types';
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
 *
 * `P-333` — the creator also uploads this trainer's agreement FILE. It is what
 * the signers and the applicant read and sign, so saving without it is refused
 * here exactly as the server refuses it. J-01's document rule applies
 * (PDF/DOC/DOCX, 1 MB), the same one the addendum upload uses.
 */

/** Pseudo field id for the file in the error summary. */
const DOCUMENT_FIELD = '__agreement-document';

export interface AgreementFileRef {
  readonly attachmentId: string;
  readonly fileName: string;
}
export function AgreementPreparationForm({
  schema,
  initialValues,
  initialDocument,
  approvedServices,
  saved,
  content,
  locale,
  submitting,
  onSave,
}: {
  readonly schema: readonly AgreementFieldSchema[];
  readonly initialValues: AgreementFieldValues;
  readonly initialDocument: AgreementFileRef | null;
  readonly approvedServices: readonly ApplicationService[];
  readonly saved: boolean;
  readonly content: AgreementsContent;
  readonly locale: Locale;
  readonly submitting: boolean;
  readonly onSave: (values: AgreementFieldValues, documentAttachmentId: string) => void;
}) {
  const copy = content.preparation;
  const formId = useId();
  const errorsRef = useRef<HTMLDivElement>(null);

  const [values, setValues] = useState<AgreementFieldValues>(initialValues);
  const [missing, setMissing] = useState<readonly string[]>([]);
  const [editing, setEditing] = useState(!saved);
  /** The STORED file — set only once its upload succeeded. */
  const [agreementFile, setAgreementFile] = useState<AgreementFileRef | null>(initialDocument);
  const [uploadFiles, setUploadFiles] = useState<UploadedFile[]>(
    initialDocument == null
      ? []
      : [{ id: initialDocument.attachmentId, name: initialDocument.fileName, status: 'success' }]
  );
  const attempts = useRef(0);

  const handleFiles = (selected: File[]) => {
    const chosen = selected[0];
    if (chosen == null) {
      return;
    }
    attempts.current += 1;
    const attempt = attempts.current;
    const id = `agreement-file-${attempt}`;
    setAgreementFile(null);
    const issue = addendumFileIssue(chosen);
    if (issue != null) {
      setUploadFiles([
        {
          id,
          name: chosen.name,
          status: 'error',
          errorMessage: issue === 'format' ? copy.documentFormatError : copy.documentSizeError,
        },
      ]);
      return;
    }
    setUploadFiles([{ id, name: chosen.name, status: 'uploading' }]);
    void getAgreementService()
      .uploadAgreementDocument(chosen)
      .then((result) => {
        // A newer choice (or a removal) supersedes this upload.
        if (attempt !== attempts.current) {
          return;
        }
        if (result.ok) {
          const { attachmentId, fileName } = result.value;
          setAgreementFile({ attachmentId, fileName });
          setUploadFiles([{ id, name: fileName, status: 'success' }]);
          setMissing((current) => current.filter((entry) => entry !== DOCUMENT_FIELD));
          return;
        }
        setUploadFiles([
          { id, name: chosen.name, status: 'error', errorMessage: copy.documentUploadFailed },
        ]);
      });
  };

  const serviceList = approvedServices
    .map((service) => content.services[service])
    .join(locale === 'ar' ? '، ' : ', ');

  const handleSave = () => {
    const issues = validateAgreementFields(schema, values).map((issue) => issue.fieldId);
    const missingNow = agreementFile == null ? [...issues, DOCUMENT_FIELD] : issues;
    setMissing(missingNow);
    if (missingNow.length > 0 || agreementFile == null) {
      errorsRef.current?.focus();
      return;
    }
    setEditing(false);
    onSave(values, agreementFile.attachmentId);
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
            {agreementFile != null && (
              <div className={styles.summaryRow}>
                <dt>
                  <Typography as="span" variant="text-sm" color="muted">
                    {copy.documentLabel}
                  </Typography>
                </dt>
                <dd>
                  <Typography as="span" variant="text-md">
                    <bdi>{agreementFile.fileName}</bdi>
                  </Typography>
                </dd>
              </div>
            )}
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

          <FileUploader
            label={copy.documentLabel}
            hint={copy.documentHint}
            accept={ADDENDUM_FORMATS.map((format) => `.${format}`).join(',')}
            requiredField
            files={uploadFiles}
            onFilesSelected={handleFiles}
            onRemove={() => {
              attempts.current += 1;
              setAgreementFile(null);
              setUploadFiles([]);
            }}
            browseLabel={copy.documentBrowse}
            removeLabel={copy.documentRemove}
          />

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
                  if (fieldId === DOCUMENT_FIELD) {
                    return <li key={fieldId}>{copy.documentRequired}</li>;
                  }
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
