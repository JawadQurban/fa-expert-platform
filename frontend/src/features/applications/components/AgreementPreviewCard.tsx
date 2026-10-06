import { Alert, Card, ItemIcon } from '@ds/composite';
import { Button, Icon, Typography } from '@ds/primitives';
import { useLocale } from '@i18n/LocaleProvider';
import { AgreementDocumentView } from '../../agreements/components/AgreementDocumentView';
import type { ApplicantAgreementDto } from '../applicationDetail.types';
import type { ApplicationDetailContent } from '../applicationDetail.content';
import { apiUrl } from '../../../shared/services/apiClient';
import styles from './AgreementPreviewCard.module.css';

/**
 * J-11/F1/AC-2 — the applicant "can preview or fully download it before
 * deciding — **showing all agreement data without exception**".
 *
 * No PDF is generated, so there is nothing to download. Rather than ship a dead
 * button, the card renders the **complete agreement document** in-page — the
 * legal text, the terms the creator entered and the merged data — and says the
 * PDF is not available. The applicant reads everything they are being asked to
 * accept, which is what AC-2 protects.
 *
 * It is the same frozen version (`AgreementDocumentView`) the internal signers
 * read, and the version the applicant's decision is recorded against.
 */
export function AgreementPreviewCard({
  agreement,
  content,
  formatDate,
}: {
  readonly agreement: ApplicantAgreementDto;
  readonly content: ApplicationDetailContent;
  readonly formatDate: (iso: string) => string;
}) {
  const { locale } = useLocale();
  const copy = content.agreementPreview;

  return (
    <Card effect="stroke" className={styles.card}>
      <div className={styles.head}>
        <ItemIcon contained icon={<Icon name="note-01" size="md" tone="primary" decorative />} />
        <div className={styles.headings}>
          <Typography as="h2" id="eh-agreement-heading" variant="text-lg" weight="bold">
            {copy.heading}
          </Typography>
          <Typography as="p" variant="text-sm" color="muted">
            {copy.sentAt(formatDate(agreement.sentAt))}
          </Typography>
        </div>
      </div>

      {agreement.documentUrl != null ? (
        <div>
          <Button
            variant="secondary"
            size="md"
            href={apiUrl(agreement.documentUrl)}
            iconStart={<Icon name="download-01" size="sm" decorative />}
          >
            {copy.download}
          </Button>
        </div>
      ) : (
        /* No PDF exists — no fabricated link. The document below IS the full agreement. */
        <Alert tone="info" role="note">
          {copy.downloadUnavailable}
        </Alert>
      )}

      <AgreementDocumentView document={agreement.document} locale={locale} fileLink={false} />
    </Card>
  );
}
