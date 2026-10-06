import { Alert, Card } from '@ds/composite';
import { Button, Tag, Typography } from '@ds/primitives';
import type { Locale } from '@/types';
import type { ApplicationService } from '../application.types';
import type {
  ApplicationEntryDto,
  ApplicationFieldSchema,
  ApplicationFieldValue,
  ApplicationFormSchemaDto,
  DraftAttachmentDto,
} from '../applicationForm.types';
import {
  entryAttachmentRules,
  entryAttachments,
  entryTitle,
  fieldLabel,
  orderedSections,
  ruleLabel,
  sectionTitle,
  splitEntryKey,
  visibleAttachmentRules,
  visibleSectionFields,
  type CompletenessResult,
} from '../applicationValidation';
import type { NewApplicationContent } from '../newApplication.content';
import styles from './ApplicationReview.module.css';

function displayValue(
  field: ApplicationFieldSchema,
  value: ApplicationFieldValue | undefined,
  locale: Locale,
  content: NewApplicationContent
): string {
  if (field.type === 'checkbox') {
    return value === true ? content.review.yes : content.review.no;
  }
  if (field.type === 'multi-select') {
    // The chosen option labels, in the schema's own option order.
    const selected = Array.isArray(value) ? value : [];
    const labels = (field.options ?? [])
      .filter((option) => selected.includes(option.value))
      .map((option) => (locale === 'en' ? option.labelEn : option.labelAr));
    return labels.length === 0
      ? content.review.notProvided
      : labels.join(locale === 'ar' ? '، ' : ', ');
  }
  const text = typeof value === 'string' ? value.trim() : '';
  if (text === '') {
    return content.review.notProvided;
  }
  if (field.type === 'select') {
    const option = field.options?.find((candidate) => candidate.value === text);
    if (option != null) {
      return locale === 'en' ? option.labelEn : option.labelAr;
    }
  }
  return text;
}

/**
 * EH-TP-05 step 4 — read-only review grouped by section, with an Edit action
 * per group and an explicit missing-items panel when the `BR-0105`
 * completeness gate is not yet satisfied (submission stays blocked until it
 * is). Renders only applicant-facing schema labels/values — never schema
 * metadata or internal fields.
 */
export function ApplicationReview({
  schema,
  services,
  values,
  attachments,
  entries,
  completeness,
  locale,
  content,
  onEditStep,
}: {
  readonly schema: ApplicationFormSchemaDto;
  readonly services: readonly ApplicationService[];
  readonly values: Readonly<Record<string, ApplicationFieldValue>>;
  readonly attachments: readonly DraftAttachmentDto[];
  /** Repeatable sections, already normalized by `normalizeEntries`. */
  readonly entries: Readonly<Record<string, readonly ApplicationEntryDto[]>>;
  readonly completeness: CompletenessResult;
  readonly locale: Locale;
  readonly content: NewApplicationContent;
  /** Jumps back to a wizard step by its id (`services`, `section:<id>`, ...). */
  readonly onEditStep: (stepId: string) => void;
}) {
  // A repeatable entry keys its errors `entryId::fieldId`. The label shown
  // names the entry too: a required field on the third qualification is not
  // the same missing item as the one on the first.
  const entryPrefix = (entryId: string | null): string => {
    if (entryId == null) {
      return '';
    }
    for (const section of schema.sections) {
      const index = (entries[section.id] ?? []).findIndex(
        (candidate) => candidate.entryId === entryId
      );
      if (index >= 0) {
        return `${entryTitle(section, locale, index)} — `;
      }
    }
    return '';
  };

  const missingLabels = [
    ...Object.keys(completeness.fieldErrors).map((key) => {
      const { entryId, fieldId } = splitEntryKey(key);
      const field = schema.fields.find((candidate) => candidate.id === fieldId);
      return field == null ? fieldId : `${entryPrefix(entryId)}${fieldLabel(field, locale)}`;
    }),
    // A per-entry attachment keys `ruleId::entryId` — rule first, entry second.
    ...completeness.missingAttachmentRuleIds.map((key) => {
      const { entryId: head, fieldId: tail } = splitEntryKey(key);
      const rule = schema.attachments.find((candidate) => candidate.id === (head ?? tail));
      return rule == null
        ? key
        : `${entryPrefix(head == null ? null : tail)}${content.validation.missingAttachment(
            ruleLabel(rule, locale)
          )}`;
    }),
  ];

  const editButton = (step: string, describes: string) => (
    <Button
      variant="tertiary"
      size="sm"
      onClick={() => onEditStep(step)}
      aria-label={`${content.review.editSection} — ${describes}`}
    >
      {content.review.editSection}
    </Button>
  );

  return (
    <div className={styles.review}>
      <Typography as="p" variant="text-md" color="muted">
        {content.review.intro}
      </Typography>

      {!completeness.valid && (
        <Alert tone="warning" title={content.review.missingTitle}>
          <ul className={styles.missingList}>
            {missingLabels.map((label) => (
              <li key={label}>{label}</li>
            ))}
          </ul>
        </Alert>
      )}

      <Card effect="stroke" className={styles.group}>
        <div className={styles.groupHeader}>
          <Typography as="h3" variant="text-lg" weight="bold">
            {content.review.servicesTitle}
          </Typography>
          {editButton('services', content.review.servicesTitle)}
        </div>
        <div className={styles.serviceTags}>
          {services.map((service) => (
            <Tag key={service} variant="information" size="sm">
              {content.services[service]}
            </Tag>
          ))}
        </div>
      </Card>

      {orderedSections(schema).map((section) => {
        const title = sectionTitle(section, locale);
        const header = (
          <div className={styles.groupHeader}>
            <Typography as="h3" variant="text-lg" weight="bold">
              {title}
            </Typography>
            {editButton(`section:${section.id}`, title)}
          </div>
        );

        // A repeatable section lists EVERY entry in full. A summary that
        // showed only the first would hide exactly what the applicant added.
        if (section.repeatable != null) {
          const sectionEntries = entries[section.id] ?? [];
          const rules = entryAttachmentRules(schema, section.id, services);
          return (
            <Card key={section.id} effect="stroke" className={styles.group}>
              {header}
              {sectionEntries.length === 0 ? (
                <Typography as="p" variant="text-md" color="muted">
                  {content.repeatable.empty}
                </Typography>
              ) : (
                sectionEntries.map((entry, index) => (
                  <div key={entry.entryId} className={styles.entry}>
                    <Typography as="h4" variant="text-md" weight="bold">
                      {entryTitle(section, locale, index)}
                    </Typography>
                    <dl className={styles.rows}>
                      {visibleSectionFields(schema, section.id, services, entry.values).map(
                        (field) => (
                          <div key={field.id} className={styles.row}>
                            <dt>{fieldLabel(field, locale)}</dt>
                            <dd>{displayValue(field, entry.values[field.id], locale, content)}</dd>
                          </div>
                        )
                      )}
                      {rules.map((rule) => {
                        const ruleFiles = entryAttachments(
                          attachments,
                          rule.id,
                          entry.entryId,
                          index
                        );
                        return (
                          <div key={rule.id} className={styles.row}>
                            <dt>{ruleLabel(rule, locale)}</dt>
                            <dd>
                              {ruleFiles.length === 0 ? (
                                content.review.notProvided
                              ) : (
                                <ul className={styles.fileList}>
                                  {ruleFiles.map((file) => (
                                    <li key={file.id}>
                                      <bdi>{file.fileName}</bdi>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </dd>
                          </div>
                        );
                      })}
                    </dl>
                  </div>
                ))
              )}
            </Card>
          );
        }

        const fields = visibleSectionFields(schema, section.id, services, values);
        if (fields.length === 0) {
          return null;
        }
        return (
          <Card key={section.id} effect="stroke" className={styles.group}>
            {header}
            <dl className={styles.rows}>
              {fields.map((field) => (
                <div key={field.id} className={styles.row}>
                  <dt>{fieldLabel(field, locale)}</dt>
                  <dd>{displayValue(field, values[field.id], locale, content)}</dd>
                </div>
              ))}
            </dl>
          </Card>
        );
      })}

      <Card effect="stroke" className={styles.group}>
        <div className={styles.groupHeader}>
          <Typography as="h3" variant="text-lg" weight="bold">
            {content.review.attachmentsTitle}
          </Typography>
          {editButton('attachments', content.review.attachmentsTitle)}
        </div>
        <dl className={styles.rows}>
          {visibleAttachmentRules(schema, services).map((rule) => {
            const ruleFiles = attachments.filter((attachment) => attachment.ruleId === rule.id);
            return (
              <div key={rule.id} className={styles.row}>
                <dt>{ruleLabel(rule, locale)}</dt>
                <dd>
                  {ruleFiles.length === 0 ? (
                    content.review.notProvided
                  ) : (
                    <ul className={styles.fileList}>
                      {ruleFiles.map((file) => (
                        <li key={file.id}>
                          <bdi>{file.fileName}</bdi>
                        </li>
                      ))}
                    </ul>
                  )}
                </dd>
              </div>
            );
          })}
        </dl>
      </Card>
    </div>
  );
}
