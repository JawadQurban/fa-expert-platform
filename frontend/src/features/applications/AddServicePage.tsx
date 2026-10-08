import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Alert, Card, FileUploader, ItemIcon, Loading, Modal } from '@ds/composite';
import type { UploadedFile } from '@ds/composite';
import { Button, Icon, Radio, RadioGroup, Tag, Typography } from '@ds/primitives';
import { Breadcrumbs } from '@ds/shell';
import { Container, Section } from '@ds/layout';
import { useLocale } from '@i18n/LocaleProvider';
import { expertHubPaths } from '../../app/router/paths';
import type { ApplicationService } from './application.types';
import type { ApplicationFieldValue, ApplicationFormSchemaDto } from './applicationForm.types';
import { availableServicesFor, deltaAttachmentsFor, deltaFieldsFor } from './addService.types';
import type { AddServiceContextDto, AddServiceRequestInput } from './addService.types';
import { getApplicationsService } from './applicationsService';
import { getAddServiceContent } from './addService.content';
import { getNewApplicationContent } from './newApplication.content';
import {
  isRuleRequired,
  ruleLabel,
  validateAttachmentFile,
  validateFieldValue,
} from './applicationValidation';
import { DynamicFieldRenderer } from './components/DynamicFieldRenderer';
import styles from './AddServicePage.module.css';
import { PageLoadError } from '../../shared/components/PageLoadError';

/**
 * EH-TP-06 — Add Service (`/expert-hub/applications/:applicationId/add-service`,
 * trainer). An approved trainer widens scope with minimal friction: current
 * approved services (read-only, P-16), pick a **new** service, fill the **delta**
 * fields only, and submit — the request routes straight to an admin decision,
 * bypassing screening (`BR-0112`, J-03/F3/AC-1). Consumes **only**
 * `applicationsService`; reuses the EH-TP-05 schema engine
 * (`DynamicFieldRenderer` + validation).
 *
 * **Conformed to journey J-03 on 2026-08-19** (`DECISIONS.md` P-46/P-47):
 * - **F1/AC-1** — the selection list shows *only* services not already approved;
 *   previously approved ones are **excluded**, not rendered disabled. They still
 *   appear, in the read-only "current services" section above, which is where
 *   they belong: that section answers "what do I hold", the selection control
 *   answers "what can I add".
 * - **F1/AC-2** — only the **mandatory** fields specific to the new service and
 *   missing from the existing profile are requested. Optional service-specific
 *   fields are not asked for; the journey's whole point is not repeating the
 *   onboarding application.
 */
type Phase = 'loading' | 'error' | 'not-eligible' | 'fast-unavailable' | 'ready' | 'submitted';

export default function AddServicePage() {
  const { locale } = useLocale();
  const content = useMemo(() => getAddServiceContent(locale), [locale]);
  const formContent = useMemo(() => getNewApplicationContent(locale), [locale]);
  const messages = formContent.validation;
  const { applicationId } = useParams();
  const service = getApplicationsService();

  const [phase, setPhase] = useState<Phase>('loading');
  const [context, setContext] = useState<AddServiceContextDto | null>(null);
  const [schema, setSchema] = useState<ApplicationFormSchemaDto | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [selectedService, setSelectedService] = useState<ApplicationService | ''>('');
  const [values, setValues] = useState<Record<string, ApplicationFieldValue>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [uploads, setUploads] = useState<Record<string, UploadedFile[]>>({});
  const [files, setFiles] = useState<Record<string, File[]>>({});
  const fileCounters = useRef<Record<string, number>>({});

  const [pending, setPending] = useState(false);
  const [busy, setBusy] = useState(false);
  const [actionFailed, setActionFailed] = useState<string | null>(null);
  const [result, setResult] = useState<{
    readonly requestId: string;
    readonly rejected: boolean;
  } | null>(null);
  const loadedOnce = useRef(false);

  useEffect(() => {
    document.title = content.documentTitle;
  }, [content.documentTitle]);

  useEffect(() => {
    let cancelled = false;
    setPhase('loading');
    if (applicationId == null) {
      setPhase('error');
      return;
    }
    void Promise.all([
      service.getAddServiceContext(applicationId),
      service.getApplicationFormSchema(),
    ]).then(([ctxRes, schemaRes]) => {
      if (cancelled) {
        return;
      }
      if (!ctxRes.ok) {
        setPhase('error');
        return;
      }
      setContext(ctxRes.value);
      if (!ctxRes.value.fastAvailable) {
        setPhase('fast-unavailable');
        return;
      }
      if (!ctxRes.value.eligible) {
        setPhase('not-eligible');
        return;
      }
      if (!schemaRes.ok) {
        setPhase('error');
        return;
      }
      setSchema(schemaRes.value);
      setPhase('ready');
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicationId, reloadKey]);

  useEffect(() => {
    if ((phase === 'ready' || phase === 'submitted') && !loadedOnce.current) {
      loadedOnce.current = true;
      document.getElementById('eh-addservice-title')?.focus();
    }
  }, [phase]);

  // Reset the delta form whenever the chosen service changes.
  useEffect(() => {
    setValues({});
    setFieldErrors({});
    setUploads({});
    setFiles({});
  }, [selectedService]);

  const deltaFields = useMemo(
    () =>
      schema != null && context != null && selectedService !== ''
        ? deltaFieldsFor(schema, selectedService, context.currentServices)
        : [],
    [schema, context, selectedService]
  );
  const deltaAttachments = useMemo(
    () =>
      schema != null && context != null && selectedService !== ''
        ? deltaAttachmentsFor(schema, selectedService, context.currentServices)
        : [],
    [schema, context, selectedService]
  );

  const handleFiles = (ruleId: string, maxCount: number, selected: File[]) => {
    const rule = schema?.attachments.find((r) => r.id === ruleId);
    if (rule == null) {
      return;
    }
    const kept = files[ruleId] ?? [];
    const acceptedNow: File[] = [];
    const display: UploadedFile[] = (uploads[ruleId] ?? []).filter((u) => u.status === 'success');
    for (const file of selected) {
      fileCounters.current[ruleId] = (fileCounters.current[ruleId] ?? 0) + 1;
      const uid = `${ruleId}-${fileCounters.current[ruleId]}`;
      const invalid = validateAttachmentFile(
        rule,
        file,
        kept.length + acceptedNow.length,
        messages
      );
      if (invalid != null) {
        display.push({ id: uid, name: file.name, status: 'error', errorMessage: invalid });
        continue;
      }
      acceptedNow.push(file);
      display.push({ id: uid, name: file.name, status: 'success' });
    }
    setFiles((prev) => ({ ...prev, [ruleId]: [...kept, ...acceptedNow].slice(0, maxCount) }));
    setUploads((prev) => ({ ...prev, [ruleId]: display }));
  };

  const validate = (): boolean => {
    if (selectedService === '') {
      return false;
    }
    const errs: Record<string, string> = {};
    for (const field of deltaFields) {
      const msg = validateFieldValue(field, values[field.id], [selectedService], locale, messages);
      if (msg != null) {
        errs[field.id] = msg;
      }
    }
    for (const rule of deltaAttachments) {
      if (isRuleRequired(rule, [selectedService]) && (files[rule.id]?.length ?? 0) === 0) {
        errs[`att-${rule.id}`] = messages.missingAttachment(ruleLabel(rule, locale));
      }
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const runSubmit = () => {
    if (selectedService === '' || applicationId == null) {
      return;
    }
    setPending(false);
    setBusy(true);
    setActionFailed(null);
    const input: AddServiceRequestInput = {
      service: selectedService,
      values: Object.fromEntries(
        deltaFields.map((f) => [f.id, values[f.id]] as const).filter(([, v]) => v !== undefined)
      ),
      attachments: deltaAttachments.flatMap((rule) =>
        (files[rule.id] ?? []).map((file) => ({
          ruleId: rule.id,
          fileName: file.name,
          sizeBytes: file.size,
        }))
      ),
    };
    void service.submitAddServiceRequest(applicationId, input).then((res) => {
      setBusy(false);
      if (res.ok) {
        // RB-03 — with no active agreement the request comes back rejected.
        setResult({ requestId: res.value.requestId, rejected: res.value.status === 'rejected' });
        setPhase('submitted');
      } else {
        setActionFailed(
          res.error.status === 409 ? content.errors.duplicate : content.errors.submitFailed
        );
      }
    });
  };

  /* ── non-ready states ──────────────────────────────────────────────────── */
  /*
    ⚠️ No h1 in the loading state on purpose: it would carry the same text as
    the loaded page, so anything waiting for the heading (tests, and a screen
    reader announcing arrival) would fire on the skeleton. `Loading` is
    labelled instead.
  */
  if (phase === 'loading') {
    return (
      <Section aria-label={content.title}>
        <Container>
          <Loading variant="skeleton" lines={6} label={content.title} />
        </Container>
      </Section>
    );
  }

  if (phase === 'error') {
    return (
      <PageLoadError
        title={content.errors.loadTitle}
        body={content.errors.loadBody}
        onRetry={() => setReloadKey((k) => k + 1)}
        retryLabel={content.errors.retry}
        size="prose"
        action={
          <Button variant="secondary" size="md" href={expertHubPaths.applications}>
            {content.errors.homeLabel}
          </Button>
        }
      />
    );
  }

  if (phase === 'not-eligible' || phase === 'fast-unavailable') {
    const copy =
      phase === 'fast-unavailable'
        ? { title: content.errors.fastUnavailableTitle, body: content.errors.fastUnavailableBody }
        : { title: content.errors.notEligibleTitle, body: content.errors.notEligibleBody };
    return (
      <Section aria-labelledby="eh-addservice-title">
        <Container size="prose">
          {/*
            ⚠️ This state used to render an Alert and nothing else, so the page
            had no heading at all — a screen reader landed on a page that never
            said what it was, and the heading order started at the Alert's own
            title. Every state of a page carries the page's own h1.
          */}
          <Typography as="h1" id="eh-addservice-title" variant="display-md" tabIndex={-1}>
            {copy.title}
          </Typography>
          <Alert tone="warning" role="status">
            {copy.body}
          </Alert>
          <div className={styles.centerRow}>
            <Button
              variant="secondary"
              size="md"
              href={
                applicationId != null
                  ? expertHubPaths.applicationDetail(applicationId)
                  : expertHubPaths.applications
              }
            >
              {content.errors.homeLabel}
            </Button>
          </div>
        </Container>
      </Section>
    );
  }

  const detailHref =
    applicationId != null
      ? expertHubPaths.applicationDetail(applicationId)
      : expertHubPaths.applications;

  if (phase === 'submitted' && result != null) {
    return (
      <Section aria-labelledby="eh-addservice-title">
        <Container size="prose">
          {result.rejected ? (
            <Alert tone="warning" role="status" title={content.noAgreement.title}>
              {content.noAgreement.body(result.requestId)}
            </Alert>
          ) : (
            <Alert tone="success" role="status" title={content.success.title}>
              {content.success.body(result.requestId)}
            </Alert>
          )}
          <Typography as="h1" id="eh-addservice-title" variant="display-md" tabIndex={-1}>
            {result.rejected ? content.noAgreement.title : content.success.title}
          </Typography>
          {!result.rejected && (
            <Typography as="p" variant="text-md" color="muted" className={styles.successNote}>
              {content.success.note}
            </Typography>
          )}
          <div className={styles.successActions}>
            <Button variant="primary" size="md" href={detailHref}>
              {content.success.backToApplication}
            </Button>
            <Button variant="secondary" size="md" href={expertHubPaths.applications}>
              {content.success.myApplications}
            </Button>
          </div>
        </Container>
      </Section>
    );
  }

  /* ── ready ─────────────────────────────────────────────────────────────── */
  const ctx = context!;
  const sch = schema!;
  // J-03/F1/AC-1 — the list IS the available services; approved ones never enter it.
  const availableServices = availableServicesFor(sch, ctx.currentServices);
  const hasDelta = deltaFields.length > 0 || deltaAttachments.length > 0;

  return (
    <Section aria-labelledby="eh-addservice-title">
      <Container>
        <Breadcrumbs
          items={[
            { label: content.breadcrumbApplications, href: expertHubPaths.applications },
            { label: ctx.reference, href: detailHref },
            { label: content.breadcrumbCurrent },
          ]}
          label={content.breadcrumbLabel}
        />

        <div className={styles.titleBlock}>
          <Typography as="h1" id="eh-addservice-title" variant="display-md" tabIndex={-1}>
            {content.title}
          </Typography>
          <Typography as="p" variant="text-md" color="muted">
            {content.subtitle}
          </Typography>
        </div>

        {actionFailed != null && (
          <Alert tone="error" role="alert" className={styles.feedback}>
            {actionFailed}
          </Alert>
        )}

        {/* Current approved services — FAST-owned, read-only (P-16). */}
        <Card effect="stroke" className={styles.card}>
          <div className={styles.sectionHead}>
            <ItemIcon
              contained
              icon={<Icon name="task-done-01" size="md" tone="primary" decorative />}
            />
            <Typography as="h2" variant="text-lg" weight="bold">
              {content.current.heading}
            </Typography>
          </div>
          <Typography as="p" variant="text-sm" color="muted">
            {content.current.description}
          </Typography>
          <ul className={styles.tags}>
            {ctx.currentServices.map((s) => (
              <li key={s}>
                <Tag variant="success" size="sm">
                  {content.services[s]}
                </Tag>
              </li>
            ))}
          </ul>
          <Typography as="p" variant="text-xs" color="muted">
            {content.current.sourceLabel}
          </Typography>
        </Card>

        {/* New-service selection — already-approved services are EXCLUDED
            (J-03/F1/AC-1, `BR-0110`); they are shown in the section above. */}
        <Card effect="stroke" className={styles.card}>
          <div className={styles.sectionHead}>
            <ItemIcon
              contained
              icon={<Icon name="add-circle" size="md" tone="primary" decorative />}
            />
            <Typography as="h2" variant="text-lg" weight="bold">
              {content.selection.heading}
            </Typography>
          </div>
          {availableServices.length > 0 ? (
            <>
              <Typography as="p" variant="text-sm" color="muted">
                {content.selection.description}
              </Typography>
              <RadioGroup
                legend={content.selection.legend}
                value={selectedService}
                onValueChange={(value) => setSelectedService(value as ApplicationService)}
              >
                {availableServices.map((s) => (
                  <Radio key={s} value={s} label={content.services[s]} />
                ))}
              </RadioGroup>
            </>
          ) : (
            <Typography as="p" variant="text-md" color="muted">
              {content.selection.noneAvailable}
            </Typography>
          )}
        </Card>

        {/* Delta fields (BR-0111) — only when a service is chosen. */}
        {selectedService !== '' && (
          <Card effect="stroke" className={styles.card}>
            <div className={styles.sectionHead}>
              <ItemIcon
                contained
                icon={<Icon name="note-edit" size="md" tone="primary" decorative />}
              />
              <Typography as="h2" variant="text-lg" weight="bold">
                {content.delta.heading}
              </Typography>
            </div>
            {hasDelta ? (
              <>
                <Typography as="p" variant="text-sm" color="muted">
                  {content.delta.description}
                </Typography>
                <div className={styles.fields}>
                  {deltaFields.map((field) => (
                    <DynamicFieldRenderer
                      key={field.id}
                      field={field}
                      value={values[field.id]}
                      error={fieldErrors[field.id]}
                      services={[selectedService]}
                      locale={locale}
                      content={formContent}
                      onChange={(id, value) => setValues((prev) => ({ ...prev, [id]: value }))}
                    />
                  ))}
                  {deltaAttachments.map((rule) => {
                    const attError = fieldErrors[`att-${rule.id}`];
                    return (
                      <div key={rule.id} className={styles.attachment}>
                        <FileUploader
                          label={ruleLabel(rule, locale)}
                          hint={rule.acceptedFormats.join('، ').toUpperCase()}
                          accept={rule.acceptedFormats.map((f) => `.${f}`).join(',')}
                          requiredField={isRuleRequired(rule, [selectedService])}
                          files={uploads[rule.id] ?? []}
                          onFilesSelected={(selected) =>
                            handleFiles(rule.id, rule.maxCount, selected)
                          }
                          onRemove={() => {
                            setFiles((prev) => ({ ...prev, [rule.id]: [] }));
                            setUploads((prev) => ({ ...prev, [rule.id]: [] }));
                          }}
                          browseLabel={content.attachments.browseLabel}
                          removeLabel={content.attachments.removeLabel}
                        />
                        {attError != null && (
                          <Typography
                            as="p"
                            variant="text-sm"
                            role="alert"
                            className={styles.attError}
                          >
                            {attError}
                          </Typography>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <Typography as="p" variant="text-md" color="muted">
                {content.delta.none}
              </Typography>
            )}
          </Card>
        )}

        {availableServices.length > 0 && (
          <div className={styles.submitRow}>
            <Button
              variant="primary"
              size="md"
              disabled={selectedService === '' || busy}
              onClick={() => {
                if (validate()) {
                  setPending(true);
                }
              }}
            >
              {content.submit}
            </Button>
          </div>
        )}

        {/* Confirmation dialog (§0.5). */}
        <Modal
          open={pending}
          onClose={() => setPending(false)}
          title={content.confirm.title}
          dismissLabel={content.confirm.dismiss}
          footer={
            <div className={styles.modalActions}>
              <Button variant="secondary" size="md" onClick={() => setPending(false)}>
                {content.confirm.cancel}
              </Button>
              <Button variant="primary" size="md" onClick={runSubmit} disabled={busy}>
                {content.confirm.confirm}
              </Button>
            </div>
          }
        >
          <Typography as="p" variant="text-md">
            {selectedService !== '' ? content.confirm.body(content.services[selectedService]) : ''}
          </Typography>
        </Modal>
      </Container>
    </Section>
  );
}
