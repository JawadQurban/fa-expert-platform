import { useId } from 'react';
import { Alert } from '@ds/composite';
import { Button, Icon, Typography } from '@ds/primitives';
import type { Locale } from '@/types';
import { localized } from '../../../shared/types/localizedText';
import { getAgreementsContent } from '../agreements.content';
import type { AgreementDocumentDto, ApplicantAgreementDocumentDto } from '../agreement.types';
import { apiUrl } from '../../../shared/services/apiClient';
import styles from './AgreementDocumentView.module.css';
import { formatDate } from '../../../shared/formatting';

/**
 * The complete agreement, read-only — J-10/F3/AC-2 for every internal reader
 * (creator, reviewers, signers) and J-11/F1/AC-2 for the applicant: «all
 * agreement data without exception», as the exact version a decision is
 * recorded against.
 *
 * Renders content only, no card: the host supplies the surface and the `h2`, so
 * the sections here are `h3`. Copy comes from the J-10 content file on both
 * sides, so the internal signers and the applicant read the same words.
 *
 * `P-333` — the document is the uploaded file, offered first. `P-334` — the
 * template version and the content hash render only when the wire carries them,
 * which is the staff wire alone.
 */
export function AgreementDocumentView({
  document,
  locale,
  fileLink = true,
}: {
  readonly document: AgreementDocumentDto | ApplicantAgreementDocumentDto;
  readonly locale: Locale;
  /** Off where the host already offers the file (the applicant's card). */
  readonly fileLink?: boolean;
}) {
  const copy = getAgreementsContent(locale).document;
  const id = useId();
  const date = (iso: string) =>
    formatDate(new Date(iso), locale, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

  return (
    <div className={styles.document}>
      <div className={styles.meta}>
        {'templateVersion' in document && document.documentUrl == null && (
          <Typography as="p" variant="text-sm" color="muted">
            {copy.template(document.templateName, document.templateVersion)}
          </Typography>
        )}
        {document.snapshot && document.createdAt != null && (
          <Typography as="p" variant="text-sm" color="muted">
            {copy.version(document.versionNumber, date(document.createdAt))}
          </Typography>
        )}
      </div>

      {/* A legacy agreement is rendered live — never passed off as a frozen record. */}
      {!document.snapshot && (
        <Alert tone="warning" surface="tinted" title={copy.liveTitle} role="note">
          {copy.liveBody}
        </Alert>
      )}

      {fileLink && document.documentUrl != null && (
        <section className={styles.section} aria-labelledby={`${id}-file`}>
          <Typography as="h3" id={`${id}-file`} variant="text-md" weight="bold">
            {copy.fileHeading}
          </Typography>
          <div>
            <Button
              variant="secondary"
              size="md"
              href={apiUrl(document.documentUrl)}
              iconStart={<Icon name="download-01" size="md" decorative />}
            >
              {copy.openFile(document.documentFileName ?? copy.fileHeading)}
            </Button>
          </div>
        </section>
      )}

      {document.bodyText != null && document.bodyText !== '' && (
        <section className={styles.section} aria-labelledby={`${id}-body`}>
          <Typography as="h3" id={`${id}-body`} variant="text-md" weight="bold">
            {copy.bodyHeading}
          </Typography>
          <Typography as="p" variant="text-md" className={styles.body}>
            {document.bodyText}
          </Typography>
        </section>
      )}

      {/* The creator-entered terms first, then the merged data — the F1/AC-2 order. */}
      {[
        { id: 'fields', title: copy.fieldsHeading, entries: document.fields },
        ...document.mergedData.map((group) => ({
          id: group.id,
          title: localized(group.title, locale),
          entries: group.entries,
        })),
      ].map((group) => (
        <section key={group.id} className={styles.section} aria-labelledby={`${id}-${group.id}`}>
          <Typography as="h3" id={`${id}-${group.id}`} variant="text-md" weight="bold">
            {group.title}
          </Typography>
          <dl className={styles.entries}>
            {group.entries.map((entry) => (
              <div key={localized(entry.label, locale)} className={styles.entry}>
                <dt>
                  <Typography as="span" variant="text-sm" color="muted">
                    {localized(entry.label, locale)}
                  </Typography>
                </dt>
                <dd>
                  <Typography as="span" variant="text-md">
                    <bdi>{entry.value === '' ? '—' : entry.value}</bdi>
                  </Typography>
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ))}

      {/* No e-signature provider exists — say how acceptance is actually recorded. */}
      <Alert tone="info" surface="tinted" title={copy.signatureMethodTitle} role="note">
        {copy.signatureMethods[document.signatureMethod]}
      </Alert>

      {'contentHash' in document && document.contentHash != null && (
        <Typography as="p" variant="text-xs" color="muted" className={styles.hash}>
          {copy.hashLabel}: <bdi>{document.contentHash}</bdi>
        </Typography>
      )}
    </div>
  );
}
