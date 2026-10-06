import { useId, useRef, useState } from 'react';
import type { DragEvent, ReactNode } from 'react';
import { cn } from '@utils/cn';
import { Button } from '@ds/primitives';
import styles from './FileUploader.module.css';

/**
 * FileUploader (FADS composite — DGA CMP-20).
 *
 * Verified live against the official Platforms Code Figma **File Upload / Single**
 * (file `J0xq7JG3JKshRDzrgAM7E0`, node `30146:37020`) and **File Upload / Multiple**
 * (node `30146:37007`) component sets via the Figma MCP — see
 * `docs/FIGMA_FILE_UPLOAD_SPECIFICATION.md` and
 * `reports/VISUAL_COMPLIANCE/FileUploader/VISUAL_COMPLIANCE_FILEUPLOADER.md`.
 *
 * The two official variants have genuinely different chrome, not just a `multiple`
 * boolean on the same box: **Single** is a label + helper text + a solid dark
 * `Button` with **no drop-zone box at all**; **Multiple** is the drop-zone
 * (icon + heading + caption + a secondary-styled `Button`) with a file list below.
 * `variant` switches between them; both keep the same underlying interaction model
 * — a hidden, fully accessible click/keyboard alternative (WCAG 2.5.7): a hidden
 * native `<input type="file">` triggered by the visible `Browse` button, so the
 * whole flow works without ever dragging anything, plus drag-and-drop as a
 * progressive enhancement in both variants (spec §1 — Single shows no drop-zone
 * chrome in Figma, which is not proof drag-and-drop is functionally disabled).
 *
 * This component is presentation/selection only — it does not perform uploads
 * itself; the caller owns the actual transfer and passes the resulting `files`
 * list back in (status/progress/errors), matching `STATE_MANAGEMENT.md`'s
 * server-state ownership model. The file list is an `aria-live="polite"` region —
 * it stays a real `<ul>` (no role override) while still announcing status changes
 * (WCAG 4.1.3).
 */
export type FileUploadStatus = 'idle' | 'uploading' | 'success' | 'error';
export type FileUploaderVariant = 'single' | 'multiple';

export interface UploadedFile {
  readonly id: string;
  readonly name: string;
  readonly status: FileUploadStatus;
  /** 0-100, shown while `status === 'uploading'`. */
  readonly progress?: number;
  readonly errorMessage?: string;
}

export interface FileUploaderProps {
  /** Instruction text — the Single variant's field label, or the Multiple drop-zone heading. */
  readonly label: string;
  readonly hint?: ReactNode;
  readonly accept?: string;
  readonly multiple?: boolean;
  /** Maps to the official Single/Multiple component split (spec §1). */
  readonly variant?: FileUploaderVariant;
  /** Single variant only — matches the shared `Label` sub-component's required asterisk. */
  readonly requiredField?: boolean;
  readonly disabled?: boolean;
  readonly files?: UploadedFile[];
  readonly onFilesSelected: (files: File[]) => void;
  readonly onRemove?: (id: string) => void;
  readonly browseLabel?: string;
  readonly removeLabel?: string;
  readonly className?: string;
}

export function FileUploader({
  label,
  hint,
  accept,
  multiple = false,
  variant = 'multiple',
  requiredField = false,
  disabled = false,
  files = [],
  onFilesSelected,
  onRemove,
  browseLabel = 'Browse files',
  removeLabel = 'Remove',
  className,
}: FileUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const [dragActive, setDragActive] = useState(false);

  const handleFiles = (fileList: FileList | null) => {
    if (disabled || !fileList || fileList.length === 0) {
      return;
    }
    onFilesSelected(Array.from(fileList));
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    if (disabled) return;
    event.preventDefault();
    setDragActive(true);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    if (disabled) return;
    event.preventDefault();
    setDragActive(false);
    handleFiles(event.dataTransfer.files);
  };

  const hiddenInput = (
    <input
      ref={inputRef}
      id={inputId}
      type="file"
      className={styles.hiddenInput}
      tabIndex={-1}
      aria-hidden="true"
      accept={accept}
      multiple={multiple}
      disabled={disabled}
      onChange={(event) => {
        handleFiles(event.target.files);
        event.target.value = '';
      }}
    />
  );

  const browseButton = (
    <Button
      type="button"
      variant={variant === 'single' ? 'neutral' : 'secondarySolid'}
      size="sm"
      disabled={disabled}
      onClick={() => inputRef.current?.click()}
    >
      {browseLabel}
    </Button>
  );

  return (
    <div className={cn(styles.uploader, className)}>
      {variant === 'single' ? (
        <div
          className={styles.single}
          data-disabled={disabled || undefined}
          onDragOver={handleDragOver}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
        >
          {hiddenInput}
          <div className={styles.header}>
            <p className={styles.label} data-disabled={disabled || undefined}>
              {requiredField && (
                <span className={styles.required} aria-hidden="true">
                  *
                </span>
              )}
              {label}
            </p>
            {hint != null && (
              <p className={styles.helperText} data-disabled={disabled || undefined}>
                {hint}
              </p>
            )}
          </div>
          {browseButton}
        </div>
      ) : (
        <div
          className={styles.dropzone}
          data-drag-active={dragActive || undefined}
          data-disabled={disabled || undefined}
          onDragOver={handleDragOver}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
        >
          {hiddenInput}
          <span
            className={styles.dropzoneIcon}
            aria-hidden="true"
            data-disabled={disabled || undefined}
          >
            ⇪
          </span>
          <div className={styles.header}>
            <p className={styles.heading} data-disabled={disabled || undefined}>
              {label}
            </p>
            {hint != null && (
              <p className={styles.caption} data-disabled={disabled || undefined}>
                {hint}
              </p>
            )}
          </div>
          {browseButton}
        </div>
      )}

      {files.length > 0 && (
        <ul className={styles.fileList} aria-live="polite">
          {files.map((file) => (
            <li key={file.id} className={styles.fileItem} data-status={file.status}>
              <div className={styles.fileRow}>
                <span className={styles.statusIcon} aria-hidden="true" data-status={file.status}>
                  {file.status === 'uploading' && '↻'}
                  {file.status === 'success' && '✓'}
                  {file.status === 'error' && '!'}
                </span>
                <span className={styles.fileName}>{file.name}</span>
                {file.status === 'uploading' && (
                  <span className={styles.progress}>
                    {file.progress != null ? `${file.progress}%` : '…'}
                  </span>
                )}
                {onRemove != null && (
                  <button
                    type="button"
                    className={styles.remove}
                    onClick={() => onRemove(file.id)}
                    aria-label={`${removeLabel} ${file.name}`}
                  >
                    ×
                  </button>
                )}
              </div>
              {file.status === 'error' && (
                <p role="alert" className={styles.errorMessage}>
                  {file.errorMessage ?? 'Upload failed'}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
