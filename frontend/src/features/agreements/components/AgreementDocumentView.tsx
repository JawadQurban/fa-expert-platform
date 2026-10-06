import { useId } from 'react';
import { Alert } from '@ds/composite';
import { Typography } from '@ds/primitives';
import type { Locale } from '@/types';
import { localized } from '../../../shared/types/localizedText';
import { getAgreementsContent } from '../agreements.content';
import type { AgreementDocumentDto } from '../agreement.types';
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
 */
export function AgreementDocumentView({
  document,
  locale,
}: {
  readonly document: AgreementDocumentDto;
  readonly locale: Locale;
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
        <Typography as="p" variant="text-sm" color="muted">
          {copy.template(document.templateName, document.templateVersion)}
        </Typography>
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

      <section className={styles.section} aria-labelledby={`${id}-body`}>
        <Typography as="h3" id={`${id}-body`} variant="text-md" weight="bold">
          {copy.bodyHeading}
        </Typography>
        <Typography as="p" variant="text-md" className={styles.body}>
          {document.bodyText}
        </Typography>
      </section>

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

      {document.contentHash != null && (
        <Typography as="p" variant="text-xs" color="muted" className={styles.hash}>
          {copy.hashLabel}: <bdi>{document.contentHash}</bdi>
        </Typography>
      )}
    </div>
  );
}
