import { Card, FileUploader } from '@ds/composite';
import type { UploadedFile } from '@ds/composite';
import { Button, Tag, Typography } from '@ds/primitives';
import type { Locale } from '@/types';
import type { ApplicationService } from '../application.types';
import type {
  ApplicationAttachmentRule,
  ApplicationEntryDto,
  ApplicationFieldValue,
  ApplicationFormSchemaDto,
  ApplicationSectionSchema,
} from '../applicationForm.types';
import {
  addEntryLabel,
  entryAttachmentRules,
  entryFieldKey,
  entryTitle,
  isRuleRequired,
  ruleLabel,
  visibleSectionFields,
} from '../applicationValidation';
import type { NewApplicationContent } from '../newApplication.content';
import { DynamicFieldRenderer } from './DynamicFieldRenderer';
import styles from './RepeatableSection.module.css';

/**
 * A **repeatable** schema section (`dm-gap-01.2026-09-21`): the applicant's
 * qualifications, certificates or past roles, one approved `Card` each, edited
 * in place — no modal, because an entry is a handful of fields and a dialog
 * would only add a trip.
 *
 * This is a page-level component, not a Design-System one: it composes the
 * approved `Card`, `Button`, `Tag` and `FileUploader` exactly as
 * `ApplicationFormSection` and `AttachmentSection` already do.
 *
 * Accessibility:
 * - each entry is a labelled `group` whose accessible name is its own heading
 *   («المؤهل 2»), so a screen reader announces which entry a field belongs to;
 * - Remove disappears at `minEntries` — the floor is a rule, not a trap;
 * - add/remove buttons name the entry they act on, never a bare «إزالة»;
 * - focus moves into the new entry's first field on add, and to the add
 *   control on remove, so the keyboard never lands nowhere;
 * - the count change is announced by the page's polite live region.
 *
 * Per-entry files (`perEntryOf` rules) render inside the entry that owns them,
 * because «the certificate» means *this* qualification's certificate.
 */
export function RepeatableSection({
  schema,
  section,
  services,
  entries,
  errors,
  files,
  locale,
  content,
  onChange,
  onAdd,
  onRemove,
  onSelectFiles,
  onRemoveFile,
}: {
  readonly schema: ApplicationFormSchemaDto;
  readonly section: ApplicationSectionSchema;
  readonly services: readonly ApplicationService[];
  readonly entries: readonly ApplicationEntryDto[];
  /** Keyed `entryId::fieldId` / `ruleId::entryId` — see `entryFieldKey`. */
  readonly errors: Readonly<Record<string, string>>;
  /** Keyed `ruleId::entryId`. */
  readonly files: Readonly<Record<string, readonly UploadedFile[]>>;
  readonly locale: Locale;
  readonly content: NewApplicationContent;
  readonly onChange: (entryId: string, fieldId: string, value: ApplicationFieldValue) => void;
  readonly onAdd: () => void;
  readonly onRemove: (entryId: string) => void;
  readonly onSelectFiles: (
    rule: ApplicationAttachmentRule,
    entryId: string,
    selected: File[]
  ) => void;
  readonly onRemoveFile: (ruleId: string, entryId: string, fileId: string) => void;
}) {
  const minEntries = section.repeatable?.minEntries ?? 0;
  const entryRules = entryAttachmentRules(schema, section.id, services);

  return (
    <div className={styles.group}>
      {entries.length === 0 && (
        <Typography as="p" variant="text-md" color="muted">
          {content.repeatable.empty}
        </Typography>
      )}

      {entries.map((entry, index) => {
        const title = entryTitle(section, locale, index);
        const headingId = `eh-entry-title-${entry.entryId}`;
        return (
          <Card
            key={entry.entryId}
            // `as="div"`, not the Card's default `<article>`: ARIA-in-HTML does
            // not allow `role="group"` on an article, and axe is right to say
            // so. The card styling is unchanged.
            as="div"
            effect="stroke"
            role="group"
            aria-labelledby={headingId}
            className={styles.entry}
          >
            <div className={styles.entryHeader}>
              <Typography as="h3" id={headingId} variant="text-md" weight="bold">
                {title}
              </Typography>
              {entries.length > minEntries && (
                <Button
                  variant="tertiary"
                  size="sm"
                  onClick={() => onRemove(entry.entryId)}
                  aria-label={content.repeatable.removeLabel(title)}
                >
                  {content.repeatable.remove}
                </Button>
              )}
            </div>

            <div id={`eh-entry-fields-${entry.entryId}`} className={styles.fields}>
              {visibleSectionFields(schema, section.id, services, entry.values).map((field) => (
                <DynamicFieldRenderer
                  key={field.id}
                  field={field}
                  domId={`eh-field-${entryFieldKey(entry.entryId, field.id)}`}
                  value={entry.values[field.id]}
                  error={errors[entryFieldKey(entry.entryId, field.id)]}
                  services={services}
                  locale={locale}
                  content={content}
                  onChange={(fieldId, value) => onChange(entry.entryId, fieldId, value)}
                />
              ))}

              {entryRules.map((rule) => {
                const required = isRuleRequired(rule, services);
                const key = `${rule.id}::${entry.entryId}`;
                return (
                  <div key={rule.id} id={`eh-field-attachment-${key}`} className={styles.rule}>
                    <div className={styles.ruleHeader}>
                      <Typography as="h4" variant="text-sm" weight="bold">
                        {`${ruleLabel(rule, locale)} — ${title}`}
                      </Typography>
                      <Tag variant={required ? 'information' : 'neutral'} size="xs">
                        {required
                          ? content.attachmentsStep.requiredTag
                          : content.attachmentsStep.optionalTag}
                      </Tag>
                    </div>
                    <FileUploader
                      label={`${ruleLabel(rule, locale)} — ${title}`}
                      hint={content.attachmentsStep.hint(
                        rule.acceptedFormats.join(locale === 'ar' ? '، ' : ', '),
                        rule.maxSizeMb,
                        rule.maxCount
                      )}
                      accept={rule.acceptedFormats.map((format) => `.${format}`).join(',')}
                      multiple={rule.maxCount > 1}
                      variant={rule.maxCount > 1 ? 'multiple' : 'single'}
                      requiredField={required}
                      files={[...(files[key] ?? [])]}
                      onFilesSelected={(selected) => onSelectFiles(rule, entry.entryId, selected)}
                      onRemove={(fileId) => onRemoveFile(rule.id, entry.entryId, fileId)}
                      browseLabel={content.attachmentsStep.browseLabel}
                      removeLabel={content.attachmentsStep.removeLabel}
                    />
                  </div>
                );
              })}
            </div>
          </Card>
        );
      })}

      <div id={`eh-add-${section.id}`} className={styles.add}>
        <Button variant="secondary" size="md" onClick={onAdd}>
          {addEntryLabel(section, locale)}
        </Button>
      </div>
    </div>
  );
}
