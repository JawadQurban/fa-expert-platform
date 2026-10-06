import { useRef, useState } from 'react';
import { FileUploader } from '@ds/composite';
import type { UploadedFile } from '@ds/composite';
import { Button, Icon, Typography } from '@ds/primitives';
import type { ApplicationAttachmentRule } from '../../applications/applicationForm.types';
import type { ProfileContent } from '../profile.content';
import type { CertificateDto } from '../profile.types';
import styles from './CertificatesSection.module.css';

/**
 * P-15 Certificates — the trainer's own certificate attachments: a view list with
 * remove, plus an uploader (J-14/F1/AC-2). The file is checked against the
 * **served** `professional-certificate` rule of the trainer's application
 * schema — the same row the server stores it under — then stored by the page
 * (`POST me/profile/certificates`). The row shows "uploading" until the server
 * answers, and the server's refusal when it refuses; nothing claims a file was
 * scanned, because it was not (`G27`).
 */
function validate(
  file: File,
  rule: ApplicationAttachmentRule | null,
  content: ProfileContent
): string | null {
  // No rule in the served schema: the server answers `certificate-rule-unavailable`.
  if (rule == null) {
    return null;
  }
  const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
  if (!rule.acceptedFormats.includes(extension)) {
    return content.certificates.formatError(rule.acceptedFormats.join(', '));
  }
  if (file.size > rule.maxSizeMb * 1024 * 1024) {
    return content.certificates.sizeError(rule.maxSizeMb);
  }
  return null;
}

export function CertificatesSection({
  certificates,
  rule,
  content,
  busy,
  onUpload,
  onRemove,
}: {
  readonly certificates: readonly CertificateDto[];
  /** The served `professional-certificate` rule, or `null` when the schema has none. */
  readonly rule: ApplicationAttachmentRule | null;
  readonly content: ProfileContent;
  readonly busy: boolean;
  /** Stores the file; resolves to the refusal to show, or `null` once stored. */
  readonly onUpload: (file: File) => Promise<string | null>;
  readonly onRemove: (id: string) => void;
}) {
  const [uploadFiles, setUploadFiles] = useState<UploadedFile[]>([]);
  const counter = useRef(0);

  const handleFilesSelected = (selected: File[]) => {
    const chosen = selected[0];
    if (chosen == null) {
      return;
    }
    counter.current += 1;
    const attempt = counter.current;
    const id = `cert-upload-${attempt}`;
    const invalid = validate(chosen, rule, content);
    if (invalid != null) {
      setUploadFiles([{ id, name: chosen.name, status: 'error', errorMessage: invalid }]);
      return;
    }
    setUploadFiles([{ id, name: chosen.name, status: 'uploading' }]);
    void onUpload(chosen).then((refusal) => {
      // A newer choice (or a removal) supersedes this upload.
      if (attempt !== counter.current) {
        return;
      }
      // Stored → the list below now shows it, so the uploader row clears.
      setUploadFiles(
        refusal == null ? [] : [{ id, name: chosen.name, status: 'error', errorMessage: refusal }]
      );
    });
  };

  return (
    <div className={styles.wrap}>
      {certificates.length === 0 ? (
        <Typography as="p" variant="text-md" color="muted">
          {content.certificates.empty}
        </Typography>
      ) : (
        <ul className={styles.list}>
          {certificates.map((cert) => (
            <li key={cert.id} className={styles.row}>
              <span className={styles.name}>
                <Icon name="note-01" size="sm" tone="primary" decorative />
                <bdi>{cert.name}</bdi>
              </span>
              <Button
                variant="tertiary"
                size="sm"
                disabled={busy}
                onClick={() => onRemove(cert.id)}
              >
                {content.certificates.removeLabel}
              </Button>
            </li>
          ))}
        </ul>
      )}

      <FileUploader
        label={content.certificates.uploadLabel}
        hint={
          rule == null
            ? undefined
            : content.certificates.uploadHint(rule.acceptedFormats.join(', '), rule.maxSizeMb)
        }
        accept={rule?.acceptedFormats.map((format) => `.${format}`).join(',')}
        disabled={busy}
        files={uploadFiles}
        onFilesSelected={handleFilesSelected}
        onRemove={() => {
          counter.current += 1;
          setUploadFiles([]);
        }}
        browseLabel={content.certificates.browseLabel}
        removeLabel={content.certificates.removeLabel}
      />
    </div>
  );
}
