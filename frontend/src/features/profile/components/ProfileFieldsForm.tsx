import { useEffect, useMemo, useState } from 'react';
import { Card } from '@ds/composite';
import { Button, Icon, Tag, Typography } from '@ds/primitives';
import type { Locale } from '@/types';
import type {
  ApplicationFieldSchema,
  ApplicationFieldValue,
} from '../../applications/applicationForm.types';
import {
  entryTitle,
  fieldLabel,
  orderedSections,
  sectionTitle,
  validateFieldValue,
  visibleSectionFields,
  isFieldVisible,
} from '../../applications/applicationValidation';
import { DynamicFieldRenderer } from '../../applications/components/DynamicFieldRenderer';
import { getNewApplicationContent } from '../../applications/newApplication.content';
import { profileEntries } from '../profile.types';
import type { MyProfileDto, ProfileFieldStateDto, ProfileFieldValues } from '../profile.types';
import type { ProfileContent } from '../profile.content';
import { AcademyRecordList } from './AcademyRecordList';
import { displayValue } from './fieldDisplay';
import { ReadOnlyEntries } from './ReadOnlyEntries';
import styles from './ProfileFieldsForm.module.css';
import { formatDate as formatLocaleDate } from '../../../shared/formatting';

/**
 * **J-14/F1** — self-service profile editing, rendered from the *same*
 * application-form schema and the *same* six sections the applicant filled in
 * J-01. AC-1 (`BR-0404`) is explicit that "no separate update form is created",
 * so this component owns no field list of its own: it walks
 * `profile.formSchema`, exactly as EH-TP-05 does, using the same renderer and
 * the same validation.
 *
 * Editability is **per field and server-decided** (P-J9), never inferred here:
 *
 * - `editable` — rendered as a live input; saving reflects immediately, with no
 *   resubmission or approval cycle (AC-4).
 * - `request-change` — FAST-owned. Shown read-only with its provenance and a
 *   *Request a change* action; a submitted change is displayed as **pending
 *   beside the still-current value**, never replacing it (`BR-0404`, `03` J5).
 * - `locked` — **F2**: visible but not editable, always with a stated reason.
 *   A disabled control with no explanation reads as a bug, not as a rule.
 *
 * Only fields relevant to the trainer's approved services are shown, using the
 * schema's own visibility rules — the profile does not invent a second answer to
 * "does this field apply to me".
 *
 * **Repeatable sections** (`dm-gap-01.2026-09-21`) render as a *list of
 * entries*, not as one flattened set of fields — driven by the served schema's
 * own `repeatable` marker, so education, certifications and experience all
 * travel the same path and nothing here knows the word "qualification".
 *
 * The first entry **is** the flat `fieldValues` map, which is what
 * `saveProfileFields` writes, so it keeps the live inputs it has always had.
 * Every further entry is shown read-only: the save endpoint takes a flat
 * `Record<fieldId, value>` and has no way to address a second entry, and a
 * control that cannot save is worse than no control. Editing them is a
 * contract change, not a UI one.
 */
export function ProfileFieldsForm({
  profile,
  content,
  locale,
  busy,
  onSave,
  onRequestChange,
}: {
  readonly profile: MyProfileDto;
  readonly content: ProfileContent;
  readonly locale: Locale;
  readonly busy: boolean;
  readonly onSave: (values: ProfileFieldValues) => void;
  readonly onRequestChange: (fieldId: string) => void;
}) {
  const formContent = useMemo(() => getNewApplicationContent(locale), [locale]);
  const services = profile.services;
  // The one call site that asks what entries this profile holds.
  const entriesBySection = useMemo(() => profileEntries(profile), [profile]);

  const [values, setValues] = useState<Record<string, ApplicationFieldValue>>({
    ...profile.fieldValues,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Re-seed whenever the server sends a new profile (a save, or a reload).
  useEffect(() => {
    setValues({ ...profile.fieldValues });
    setErrors({});
  }, [profile.fieldValues]);

  const stateFor = (fieldId: string): ProfileFieldStateDto | undefined =>
    profile.fieldStates.find((state) => state.fieldId === fieldId);

  const editableFields = profile.formSchema.fields.filter(
    (field) => stateFor(field.id)?.editability === 'editable'
  );

  const dirty = editableFields.some((field) => values[field.id] !== profile.fieldValues[field.id]);

  const save = () => {
    const nextErrors: Record<string, string> = {};
    for (const field of editableFields) {
      // A field the trainer cannot see (another service's, or a `dependsOn`
      // whose condition is unmet) is never required of them — the same rule
      // the rendered form already follows.
      if (!isFieldVisible(field, services, values)) {
        continue;
      }
      const message = validateFieldValue(
        field,
        values[field.id],
        services,
        locale,
        formContent.validation
      );
      if (message != null) {
        nextErrors[field.id] = message;
      }
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }
    onSave(
      Object.fromEntries(
        editableFields
          .filter((field) => values[field.id] !== profile.fieldValues[field.id])
          .map((field) => [field.id, values[field.id]])
      )
    );
  };

  /** A field the trainer may look at but not type into (FAST-owned or locked). */
  const readOnlyField = (field: ApplicationFieldSchema, state: ProfileFieldStateDto) => (
    <div key={field.id} className={styles.readOnlyField}>
      <div className={styles.readOnlyHead}>
        <Typography as="span" variant="text-sm" weight="bold">
          {fieldLabel(field, locale)}
        </Typography>
        {state.editability === 'locked' && state.lockReason != null && (
          /* ⚠️ A value the Academy verified reads as verified, not as
             something still owed — «if it comes from FAST it should be
             already approved» (`P-263`). Everything else stays neutral. */
          <Tag variant={state.lockReason === 'from-academy' ? 'success' : 'neutral'} size="xs">
            {content.fields.lockReasons[state.lockReason]}
          </Tag>
        )}
      </div>

      <span className={styles.readOnlyValue}>
        <bdi>{displayValue(field, profile.fieldValues[field.id], locale) || '—'}</bdi>
      </span>

      {state.editability === 'request-change' && (
        <>
          {state.lastSyncAt != null && (
            <Typography as="span" variant="text-xs" color="muted">
              {content.fields.lastSync(formatDate(state.lastSyncAt, locale))}
            </Typography>
          )}
          {/* The pending value sits BESIDE the current one — `03` J5. */}
          {state.pendingValue != null ? (
            <span className={styles.pending}>
              <Icon name="dashboard-circle" size="sm" tone="primary" decorative />
              <Typography as="span" variant="text-sm">
                {content.fields.pendingChange(state.pendingValue)}
              </Typography>
            </span>
          ) : (
            <div>
              <Button
                variant="tertiary"
                size="sm"
                disabled={busy}
                onClick={() => onRequestChange(field.id)}
              >
                {content.fields.requestChange}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );

  return (
    <div className={styles.form}>
      {orderedSections(profile.formSchema).map((section) => {
        const fields = visibleSectionFields(profile.formSchema, section.id, services, values);
        if (fields.length === 0) {
          return null;
        }
        // Entry 0 is the flat `values` map; everything after it is read-only.
        const furtherEntries =
          section.repeatable == null ? [] : (entriesBySection[section.id] ?? []).slice(1);
        const firstEntryHeadingId = `eh-entry-edit-${section.id}`;
        const sectionFields = (
          <div className={styles.fields}>
            {fields.map((field) => {
              const state = stateFor(field.id);
              if (state == null || state.editability !== 'editable') {
                return state == null ? null : readOnlyField(field, state);
              }
              return (
                <DynamicFieldRenderer
                  key={field.id}
                  field={field}
                  value={values[field.id]}
                  error={errors[field.id]}
                  services={services}
                  locale={locale}
                  content={formContent}
                  onChange={(fieldId, value) =>
                    setValues((current) => ({ ...current, [fieldId]: value }))
                  }
                />
              );
            })}
          </div>
        );
        return (
          <fieldset key={section.id} className={styles.section}>
            <legend className={styles.legend}>{sectionTitle(section, locale)}</legend>
            {section.repeatable == null ? (
              sectionFields
            ) : (
              <div className={styles.entries}>
                {/* Same Card treatment as the application form's own entry. */}
                <Card
                  as="div"
                  effect="stroke"
                  role="group"
                  aria-labelledby={firstEntryHeadingId}
                  className={styles.entry}
                >
                  <Typography as="h3" id={firstEntryHeadingId} variant="text-md" weight="bold">
                    {entryTitle(section, locale, 0)}
                  </Typography>
                  {sectionFields}
                </Card>
                <ReadOnlyEntries
                  schema={profile.formSchema}
                  section={section}
                  services={services}
                  entries={furtherEntries}
                  locale={locale}
                  firstIndex={1}
                />
              </div>
            )}
            {/*
              ⚠️ The Academy's FURTHER records, inside the section they belong
              to — «المؤهلات العلمية» carries the extra degrees, «الشهادات
              المهنية» the extra certificates. Not a panel of its own: `P-258`
              removed one of those, and putting them here keeps one place per
              topic while still showing everything FAST holds (`P-265`).
            */}
            {profile.academyRecords != null && section.id === 'education' && (
              <AcademyRecordList
                education={profile.academyRecords.education}
                certifications={[]}
                syncedAt={profile.academyRecords.syncedAt}
                content={content}
                locale={locale}
              />
            )}
            {profile.academyRecords != null && section.id === 'certifications' && (
              <AcademyRecordList
                education={[]}
                certifications={profile.academyRecords.certifications}
                syncedAt={profile.academyRecords.syncedAt}
                content={content}
                locale={locale}
              />
            )}
          </fieldset>
        );
      })}

      <div className={styles.actions}>
        <Button variant="primary" size="md" disabled={!dirty || busy} onClick={save}>
          {content.fields.save}
        </Button>
      </div>
    </div>
  );
}

function formatDate(iso: string, locale: Locale): string {
  return formatLocaleDate(new Date(iso), locale, {
    dateStyle: 'medium',
  });
}
