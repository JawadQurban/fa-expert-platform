import { Button, Icon, Typography } from '@ds/primitives';
import { ItemIcon } from '@ds/composite';
import type { Locale } from '@/types';
import type { ScreeningContent } from '../screening.content';
import type { ScreeningAttachmentDto } from '../screening.types';
import { apiUrl } from '../../../shared/services/apiClient';
import styles from './ScreeningAttachments.module.css';
import { formatNumber } from '../../../shared/formatting';

/**
 * J-05/F2/AC-8 — the screening manager browses/previews every attachment
 * uploaded with the application (CV, certificates) from this page.
 *
 * `previewUrl === null` is an honest, explicit state, not a broken link:
 * document storage is unresolved (`G26`), so the control is disabled with a
 * visible explanation rather than pointing at a URL that does not exist.
 */
function formatSize(kb: number, locale: Locale): string {
  return formatNumber(kb, locale);
}

export function ScreeningAttachments({
  attachments,
  content,
  locale,
}: {
  readonly attachments: readonly ScreeningAttachmentDto[];
  readonly content: ScreeningContent;
  readonly locale: Locale;
}) {
  if (attachments.length === 0) {
    return (
      <Typography as="p" variant="text-md" color="muted">
        {content.attachments.empty}
      </Typography>
    );
  }

  return (
    <ul className={styles.list} aria-label={content.attachments.heading}>
      {attachments.map((attachment) => (
        <li key={attachment.id} className={styles.item}>
          {/* The same tinted badge every other file row in the product uses
              — a document should look like a document wherever staff meet it. */}
          <ItemIcon contained icon={<Icon name="note-01" size="md" tone="primary" decorative />} />
          <span className={styles.body}>
            <Typography as="span" variant="text-md" weight="medium">
              {attachment.type[locale] ?? attachment.type.ar}
            </Typography>
            <Typography as="span" variant="text-sm" color="muted">
              <bdi>{attachment.name}</bdi> · {attachment.format.toUpperCase()} ·{' '}
              {content.attachments.sizeLabel(formatSize(attachment.sizeKb, locale))}
            </Typography>
          </span>
          <span className={styles.action}>
            {attachment.previewUrl == null ? (
              <Typography as="span" variant="text-sm" color="muted">
                {content.attachments.unavailable}
              </Typography>
            ) : (
              <Button variant="tertiary" size="sm" href={apiUrl(attachment.previewUrl)}>
                {content.attachments.preview}
              </Button>
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}
