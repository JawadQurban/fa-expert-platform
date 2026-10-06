import { useEffect, useMemo, useState } from 'react';
import { Alert, Loading } from '@ds/composite';
import { Button, Checkbox, Select, Tag, Textarea, TextInput, Typography } from '@ds/primitives';
import { Breadcrumbs } from '@ds/shell';
import { useLocale } from '@i18n/LocaleProvider';
import type { Locale } from '@/types';
import { expertHubPaths } from '../../app/router/paths';
import { localized } from '../../shared/types/localizedText';
import {
  validateTemplate,
  type AgreementTemplateDto,
  type TemplateFieldDefinitionDto,
  type TemplateValidationCode,
} from './agreementLifecycle.types';
import { getAgreementLifecycleService } from './agreementLifecycleService';
import { getAgreementLifecycleContent } from './agreementLifecycle.content';
import type { ExpertHubApiError } from '../../shared/services/apiClient';
import { describeLoadFailure } from '../../shared/errors/loadFailure';
import { PageLoadError } from '../../shared/components/PageLoadError';
import { WorkspacePage } from '../../shared/workspace/WorkspacePage';
import { PageHead } from '../../shared/workspace/PageHead';
import { Panel } from '../../shared/workspace/Panel';
import styles from './AgreementTemplatePage.module.css';
import { formatDate as formatLocaleDate } from '../../shared/formatting';

/**
 * **J-12/F4** — Agreement Template management. The System Administrator edits
 * the fixed legal text and the structural merge-field definitions used across
 * *all* agreement generation (`BR-0306`).
 *
 * This is the screen that would settle **`DM-GAP-16`** — the open question of
 * which template fields exist. J-10 renders whatever list this defines, which is
 * why that gap never blocked J-10: the field list was always meant to be
 * configuration, and this is where it is configured.
 *
 * **F4/AC-2** — the template carries its linked services even though one
 * template currently serves all four. The journey asks explicitly for a
 * structure that supports several, so the link is plural from the start; it
 * costs nothing today and avoids a migration later.
 *
 * ⚠️ The seeded body text is clearly-labelled placeholder copy, **not** an
 * approved contract.
 */

type Phase = 'loading' | 'error' | 'ready';

const FIELD_TYPES = ['date', 'text', 'number'] as const;

function formatDate(iso: string, locale: Locale): string {
  return formatLocaleDate(new Date(iso), locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function AgreementTemplatePage() {
  const { locale } = useLocale();
  const content = useMemo(() => getAgreementLifecycleContent(locale), [locale]);
  const service = getAgreementLifecycleService();

  const [phase, setPhase] = useState<Phase>('loading');
  const [loadError, setLoadError] = useState<ExpertHubApiError | null>(null);
  const [template, setTemplate] = useState<AgreementTemplateDto | null>(null);
  const [bodyText, setBodyText] = useState('');
  const [fields, setFields] = useState<TemplateFieldDefinitionDto[]>([]);
  const [issues, setIssues] = useState<readonly TemplateValidationCode[]>([]);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const copy = content.template;

  useEffect(() => {
    document.title = copy.documentTitle;
  }, [copy.documentTitle]);

  useEffect(() => {
    let cancelled = false;
    setPhase('loading');
    void service.getTemplate().then((result) => {
      if (cancelled) {
        return;
      }
      if (result.ok) {
        setTemplate(result.value);
        setBodyText(result.value.bodyText);
        setFields(result.value.fields.map((field) => ({ ...field })));
        setPhase('ready');
      } else {
        setLoadError(result.error);
        setPhase('error');
      }
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadKey]);

  useEffect(() => {
    if (phase === 'ready') {
      document.getElementById('eh-template-title')?.focus();
    }
  }, [phase]);

  const save = () => {
    const input = { bodyText, fields };
    const found = validateTemplate(input);
    setIssues(found);
    if (found.length > 0) {
      return;
    }
    setBusy(true);
    setSaved(false);
    void service.saveTemplate(input).then((result) => {
      setBusy(false);
      if (result.ok) {
        setTemplate(result.value);
        setSaved(true);
      }
    });
  };

  if (phase === 'loading') {
    return (
      <WorkspacePage label={copy.heading}>
        <Loading variant="skeleton" lines={6} label={copy.heading} />
      </WorkspacePage>
    );
  }

  // A denial is not a load failure: `P-190`'s gate answers 403 with the
  // feature it wanted, and telling someone their system broke sends them
  // to the wrong person for help.
  const failure = describeLoadFailure(loadError, locale, {
    title: content.errors.loadTitle,
    body: content.errors.loadBody,
  });

  if (phase === 'error' || template == null) {
    return (
      <PageLoadError
        title={failure.title}
        body={failure.body}
        onRetry={failure.canRetry ? () => setReloadKey((key) => key + 1) : undefined}
        retryLabel={content.errors.retry}
        size="prose"
      />
    );
  }

  return (
    <WorkspacePage labelledBy="eh-template-title">
      <PageHead
        titleId="eh-template-title"
        title={copy.heading}
        lead={copy.description}
        summary={copy.lastUpdated(template.updatedByName, formatDate(template.updatedAt, locale))}
        breadcrumbs={
          <Breadcrumbs
            items={[
              { label: content.detail.breadcrumbList, href: expertHubPaths.internalAgreements },
              { label: copy.heading },
            ]}
            label={content.detail.breadcrumbLabel}
          />
        }
      />

      {/* F4/AC-2 — the linked services, and why the link is plural. */}
      <Panel title={copy.servicesLabel} titleId="eh-template-services">
        <ul className={styles.services}>
          {template.services.map((serviceId) => (
            <li key={serviceId}>
              <Tag variant="information" size="sm">
                {content.services[serviceId]}
              </Tag>
            </li>
          ))}
        </ul>
        <Alert tone="info" surface="tinted" role="note">
          {copy.multiTemplateNote}
        </Alert>
      </Panel>

      {saved && (
        <Alert tone="success" surface="tinted" role="status">
          {copy.saved}
        </Alert>
      )}

      {/* F4/AC-1 — the fixed legal text. */}
      <Panel>
        <Textarea
          label={copy.bodyLabel}
          helperText={copy.bodyHint}
          value={bodyText}
          onChange={(event) => {
            setBodyText(event.target.value);
            setSaved(false);
          }}
          rows={12}
          requiredField
          errorText={issues.includes('body-required') ? copy.errors['body-required'] : undefined}
        />
      </Panel>

      {/* F4/AC-1 — the structural merge fields (`DM-GAP-16` lives here). */}
      <Panel title={copy.fieldsHeading} titleId="eh-template-fields">
        <Typography as="p" variant="text-xs" color="muted">
          {copy.fieldsDescription}
        </Typography>
        {issues.includes('field-label-required') && (
          <Alert tone="error" surface="tinted" role="alert">
            {copy.errors['field-label-required']}
          </Alert>
        )}

        <ul className={styles.fields}>
          {fields.map((field, index) => (
            <li key={field.id} className={styles.fieldRow}>
              <TextInput
                label={copy.fieldLabelLabel}
                value={localized(field.label, locale)}
                onChange={(event) => {
                  const next = [...fields];
                  next[index] = {
                    ...field,
                    label: { ...field.label, [locale]: event.target.value },
                  };
                  setFields(next);
                  setSaved(false);
                }}
                requiredField
              />
              <Select
                label={copy.fieldTypeLabel}
                value={field.type}
                onValueChange={(value) => {
                  const next = [...fields];
                  next[index] = { ...field, type: value as TemplateFieldDefinitionDto['type'] };
                  setFields(next);
                  setSaved(false);
                }}
                options={FIELD_TYPES.map((type) => ({
                  value: type,
                  label: copy.types[type],
                }))}
              />
              <Checkbox
                label={copy.fieldRequiredLabel}
                checked={field.required}
                onChange={(event) => {
                  const next = [...fields];
                  next[index] = { ...field, required: event.target.checked };
                  setFields(next);
                  setSaved(false);
                }}
              />
            </li>
          ))}
        </ul>
      </Panel>

      <div className={styles.actions}>
        <Button variant="primary" size="md" disabled={busy} onClick={save}>
          {copy.save}
        </Button>
        <Button variant="secondary" size="md" href={expertHubPaths.internalAgreements}>
          {copy.backToList}
        </Button>
      </div>
    </WorkspacePage>
  );
}
