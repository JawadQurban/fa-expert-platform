import { FileUploader } from '@ds/composite';
import type { UploadedFile } from '@ds/composite';
import { Tag, Typography } from '@ds/primitives';
import type { Locale } from '@/types';
import type { ApplicationService } from '../application.types';
import type { ApplicationAttachmentRule, ApplicationFormSchemaDto } from '../applicationForm.types';
import { isRuleRequired, ruleLabel, visibleAttachmentRules } from '../applicationValidation';
import type { NewApplicationContent } from '../newApplication.content';
import styles from './AttachmentSection.module.css';

/**
 * EH-TP-05 step 3 — one approved `FileUploader` per attachment rule relevant to
 * the selected services. Rules and their format/size/count constraints are
 * configuration (`BR-0106` — validated immediately on selection; invalid files
 * surface inline via the uploader's per-file error state). Required-ness
 * follows the `BR-0104` union, shown as a Tag beside each rule.
 *
 * Upload/remove side effects belong to the page (which owns the service —
 * production storage + AV remain blocked by `G26`/`G27`).
 */
export function AttachmentSection({
  schema,
  services,
  files,
  locale,
  content,
  onSelect,
  onRemove,
}: {
  readonly schema: ApplicationFormSchemaDto;
  readonly services: readonly ApplicationService[];
  readonly files: Readonly<Record<string, readonly UploadedFile[]>>;
  readonly locale: Locale;
  readonly content: NewApplicationContent;
  readonly onSelect: (rule: ApplicationAttachmentRule, selected: File[]) => void;
  readonly onRemove: (ruleId: string, fileId: string) => void;
}) {
  const rules = visibleAttachmentRules(schema, services);

  return (
    <div className={styles.rules}>
      <Typography as="p" variant="text-md" color="muted">
        {content.attachmentsStep.intro}
      </Typography>
      {rules.map((rule) => {
        const required = isRuleRequired(rule, services);
        return (
          <div key={rule.id} id={`eh-field-attachment-${rule.id}`} className={styles.rule}>
            <div className={styles.ruleHeader}>
              <Typography as="h3" variant="text-md" weight="bold">
                {ruleLabel(rule, locale)}
              </Typography>
              <Tag variant={required ? 'information' : 'neutral'} size="xs">
                {required
                  ? content.attachmentsStep.requiredTag
                  : content.attachmentsStep.optionalTag}
              </Tag>
            </div>
            <FileUploader
              label={ruleLabel(rule, locale)}
              hint={content.attachmentsStep.hint(
                rule.acceptedFormats.join(locale === 'ar' ? '، ' : ', '),
                rule.maxSizeMb,
                rule.maxCount
              )}
              accept={rule.acceptedFormats.map((format) => `.${format}`).join(',')}
              multiple={rule.maxCount > 1}
              variant={rule.maxCount > 1 ? 'multiple' : 'single'}
              requiredField={required}
              files={[...(files[rule.id] ?? [])]}
              onFilesSelected={(selected) => onSelect(rule, selected)}
              onRemove={(fileId) => onRemove(rule.id, fileId)}
              browseLabel={content.attachmentsStep.browseLabel}
              removeLabel={content.attachmentsStep.removeLabel}
            />
          </div>
        );
      })}
    </div>
  );
}
