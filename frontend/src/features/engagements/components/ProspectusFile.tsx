import { ItemIcon } from '@ds/composite';
import { Button, Icon, Typography } from '@ds/primitives';
import { apiUrl } from '../../../shared/services/apiClient';
import type { EngagementsContent } from '../engagements.content';
import type { ProspectusDto } from '../offer.types';
import styles from './ProspectusFile.module.css';

/**
 * **J-18/F1/AC-3 (`BUG-042`)** — «النشرة التعريفية»: the document the centre
 * attached to the assignment request, shown on the offer (and later on the
 * engagement) with a preview and a download.
 *
 * Both are plain links to the API's attachment route — the session cookie
 * goes with them, and the API decides access (only the trainer the offer is
 * addressed to, for exactly this file). The route already opens a PDF inline
 * (`AttachmentUploads.Serve`), so preview is the plain link in a new tab;
 * download asks for `disposition=attachment` so the file is saved instead.
 */
export function ProspectusFile({
  prospectus,
  content,
}: {
  readonly prospectus: ProspectusDto;
  readonly content: EngagementsContent;
}) {
  const copy = content.prospectus;
  const href = apiUrl(prospectus.url);
  const name = prospectus.fileName === '' ? copy.heading : prospectus.fileName;

  return (
    <section className={styles.file} aria-label={copy.heading}>
      <ItemIcon contained icon={<Icon name="note-01" size="md" tone="primary" decorative />} />
      <span className={styles.body}>
        <Typography as="span" variant="text-md" weight="bold">
          {copy.heading}
        </Typography>
        <Typography as="span" variant="text-sm" color="muted">
          <bdi>{name}</bdi>
        </Typography>
        <Typography as="span" variant="text-xs" color="muted">
          {copy.description}
        </Typography>
      </span>
      <span className={styles.actions}>
        <Button
          variant="secondary"
          size="sm"
          href={href}
          target="_blank"
          rel="noreferrer"
          aria-label={copy.previewLabel(name)}
        >
          {copy.preview}
        </Button>
        <Button
          variant="tertiary"
          size="sm"
          href={`${href}?disposition=attachment`}
          aria-label={copy.downloadLabel(name)}
          iconStart={<Icon name="download-01" size="sm" decorative />}
        >
          {copy.download}
        </Button>
      </span>
    </section>
  );
}
