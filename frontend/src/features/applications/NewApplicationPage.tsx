import { useEffect, useMemo, useRef, useState } from 'react';
import { useBlocker } from 'react-router-dom';
import { Alert, Loading, Modal, Steps } from '@ds/composite';
import type { UploadedFile } from '@ds/composite';
import { Button, Typography } from '@ds/primitives';
import { Breadcrumbs } from '@ds/shell';
import { Container, Section } from '@ds/layout';
import { useMediaQuery } from '@hooks/useMediaQuery';
import { useLocale } from '@i18n/LocaleProvider';
import type { Locale } from '@/types';
import { expertHubPaths } from '../../app/router/paths';
import type { ExpertHubApiError } from '../../shared/services/apiClient';
import type { ApplicationService } from './application.types';
import type {
  ApplicationAttachmentRule,
  ApplicationEntryDto,
  ApplicationFieldValue,
  ApplicationFormSchemaDto,
  ApplicationSectionSchema,
  DraftAttachmentDto,
  NewApplicationBlockReason,
  SubmitApplicationDto,
} from './applicationForm.types';
import {
  attachmentEntryId,
  entryAttachmentRules,
  entryAttachments,
  entryFieldKey,
  entryTitle,
  fieldLabel,
  isRuleRequired,
  normalizeEntries,
  orderedSections,
  ruleLabel,
  sectionTitle,
  validateAttachmentFile,
  validateCompleteness,
  validateFieldValue,
  visibleAttachmentRules,
  visibleSectionFields,
} from './applicationValidation';
import { useExpertHubAuth } from '../../app/auth/AuthProvider';
import { IdentityGate } from '../identity/IdentityGate';
import { getIdentityContent } from '../identity/identity.content';
import type { IdentitySessionDto } from '../identity/identity.types';
import { getApplicationsService } from './applicationsService';
import { getMyApplicationsContent } from './myApplications.content';
import { getNewApplicationContent, type NewApplicationContent } from './newApplication.content';
import { focusFieldTarget } from './focusField';
import { ApplicationErrorSummary } from './components/ApplicationErrorSummary';
import type { ErrorSummaryItem } from './components/ApplicationErrorSummary';
import { ApplicationFormSection } from './components/ApplicationFormSection';
import { RepeatableSection } from './components/RepeatableSection';
import { ApplicationReview } from './components/ApplicationReview';
import { AttachmentSection } from './components/AttachmentSection';
import { ServiceSelection } from './components/ServiceSelection';
import styles from './NewApplicationPage.module.css';
import { PageLoadError } from '../../shared/components/PageLoadError';
import { formatDate } from '../../shared/formatting';

/**
 * EH-TP-05 — New Application (`/expert-hub/applications/new`). A dynamic,
 * schema-driven, multi-step application form (P-20 Stepper Form):
 * Service Selection → **one step per schema section** → Attachments →
 * Review & Submit.
 *
 * The middle steps are DERIVED FROM THE SCHEMA, never listed here: a section
 * that the served map adds becomes a step on its own, and a section with no
 * visible field for the selected services is skipped entirely. Splitting the
 * old single "details" panel matters because that panel had grown to six
 * sections and 40+ fields — one scroll nobody finished.
 *
 * The form is **configuration, not code** (`BR-0103`): sections, fields,
 * required-by-service maps, and attachment rules all come from the versioned
 * form schema served by `applicationsService` — currently the clearly-marked
 * `G5` mock (`mockApplicationSchema.ts`), later the approved field map from the
 * Expert Hub API, with no page change. Rules honored here:
 * `BR-0101` (blocked when another application is un-decided; drafts resume),
 * `BR-0102` (basic profile reused/prefilled), `BR-0104` (required = union over
 * selected services, one unified form), `BR-0105` (step gates + review gate +
 * server re-check block incomplete submission), `BR-0106` (immediate attachment
 * validation), `BR-0107` (reference issued by the service at submit only —
 * drafts never have one), `BR-0113` (Speaker not self-service selectable).
 *
 * Draft saving is **explicit** (the docs specify save-draft-at-any-point and do
 * not document autosave — autosave is deferred). Unsaved changes warn before
 * navigation. No FAST/MTM/ERP/SSO calls; uploads flow through the service seam
 * (production storage/AV blocked by `G26`/`G27`).
 */

type PagePhase = 'loading' | 'error' | 'schema-unavailable' | 'blocked' | 'ready' | 'submitted';

/**
 * A step id: the three fixed ones, or `section:<sectionId>` for a schema
 * section. Ids rather than indices, because the list's length depends on the
 * service selection and an index would silently point at a different step.
 */
type StepId = string;

const SECTION_STEP_PREFIX = 'section:';

/** The upload map's key: application-level rules by id, per-entry by both. */
function attachmentKey(ruleId: string, entryId?: string): string {
  return entryId == null ? ruleId : `${ruleId}::${entryId}`;
}

function loadErrorCopy(error: ExpertHubApiError, locale: Locale, content: NewApplicationContent) {
  const shared = getMyApplicationsContent(locale).errors;
  if (error.status === 401) {
    return { title: shared.sessionExpiredTitle, body: shared.sessionExpiredBody };
  }
  if (error.status === 403) {
    return { title: shared.unauthorizedTitle, body: shared.unauthorizedBody };
  }
  return { title: content.errors.loadFailedTitle, body: content.errors.loadFailedBody };
}

export default function NewApplicationPage() {
  const { locale } = useLocale();
  const content = useMemo(() => getNewApplicationContent(locale), [locale]);
  const service = getApplicationsService();

  /**
   * **J-01 Identity Linking** — the prerequisite layer. An authenticated
   * applicant skips it entirely (§3B row 1: "basic info auto-fills from the
   * authenticated account directly — no matching needed"); a guest must pass
   * through it before the form renders at all.
   */
  const { isAuthenticated } = useExpertHubAuth();
  const identityContent = useMemo(() => getIdentityContent(locale), [locale]);
  const [identitySession, setIdentitySession] = useState<IdentitySessionDto | null>(null);
  /** Governing rule 2 — a guest may fill the form but may not save a draft. */
  const canSaveDraft = isAuthenticated || identitySession?.canSaveDraft === true;
  const [draftBlocked, setDraftBlocked] = useState(false);

  const [phase, setPhase] = useState<PagePhase>('loading');
  const [loadError, setLoadError] = useState<ExpertHubApiError | null>(null);
  const [schema, setSchema] = useState<ApplicationFormSchemaDto | null>(null);
  /** Which fields the Academy filled in, so the form can say so. */
  const [prefilledFields, setPrefilledFields] = useState<readonly string[]>([]);
  const [blockedBy, setBlockedBy] = useState<string | null>(null);
  const [blockReason, setBlockReason] = useState<NewApplicationBlockReason | null>(null);
  const [resumed, setResumed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const [services, setServices] = useState<readonly ApplicationService[]>([]);
  const [values, setValues] = useState<Record<string, ApplicationFieldValue>>({});
  /** Repeatable sections, keyed by section id (`normalizeEntries`). */
  const [entries, setEntries] = useState<Record<string, readonly ApplicationEntryDto[]>>({});
  const entryCounter = useRef(0);
  const [attachments, setAttachments] = useState<readonly DraftAttachmentDto[]>([]);
  const [uploadFiles, setUploadFiles] = useState<Record<string, readonly UploadedFile[]>>({});

  const [stepId, setStepId] = useState<StepId>('services');
  const [visited, setVisited] = useState<ReadonlySet<StepId>>(new Set(['services']));
  /** A container id to move focus into once React has rendered the change. */
  const [pendingFocus, setPendingFocus] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [servicesError, setServicesError] = useState<string | null>(null);
  const [summaryItems, setSummaryItems] = useState<readonly ErrorSummaryItem[]>([]);

  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [saveFailed, setSaveFailed] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitFailed, setSubmitFailed] = useState(false);
  const [submitResult, setSubmitResult] = useState<SubmitApplicationDto | null>(null);

  const [liveMessage, setLiveMessage] = useState('');
  const localFileCounter = useRef(0);

  useEffect(() => {
    document.title = content.documentTitle;
  }, [content.documentTitle]);

  /* ── load: schema + start/resume draft ─────────────────────────────────── */
  useEffect(() => {
    let cancelled = false;
    setPhase('loading');
    setLoadError(null);
    void Promise.all([
      service.getApplicationFormSchema(),
      service.startOrResumeDraft(),
      service.getApplicationPrefill(),
    ]).then(async ([publishedResult, startResult, prefillResult]) => {
      // A draft keeps the form version it was started on, even after a newer
      // version is published — its saved answers belong to that version.
      const pinnedVersion = startResult.ok ? startResult.value.draft?.schemaVersion : undefined;
      const schemaResult =
        publishedResult.ok &&
        pinnedVersion != null &&
        pinnedVersion !== publishedResult.value.version
          ? await service.getApplicationFormSchema(pinnedVersion)
          : publishedResult;
      if (cancelled) {
        return;
      }
      if (!schemaResult.ok) {
        // `04` §11: Field-map-unavailable is an explicit blocked state (`G5`).
        if (schemaResult.error.status === 404) {
          setPhase('schema-unavailable');
        } else {
          setLoadError(schemaResult.error);
          setPhase('error');
        }
        return;
      }
      if (!startResult.ok) {
        setLoadError(startResult.error);
        setPhase('error');
        return;
      }
      setSchema(schemaResult.value);
      const {
        draft,
        resumed: wasResumed,
        blockReason: reason,
        blockedByApplicationId,
      } = startResult.value;
      if (draft == null) {
        setBlockedBy(blockedByApplicationId);
        setBlockReason(reason);
        setPhase('blocked');
        return;
      }
      setServices(draft.services);
      /*
       * The draft first, then the Academy's suggestions UNDER it.
       *
       * ⚠️ Order matters and this is the whole rule: a value the applicant
       * typed and saved must never be replaced by one we suggested. Spreading
       * the prefill first and the draft second means a suggestion only ever
       * lands in a field the draft left empty.
       *
       * A failed prefill is not an error either — the form simply opens
       * blank, exactly as it did before, so the Academy's API being down
       * cannot stop somebody applying.
       */
      const suggested = prefillResult.ok ? prefillResult.value : {};
      const filled = Object.fromEntries(
        Object.entries(suggested).filter(([field]) => {
          const existing = draft.values[field];
          return existing == null || existing === '';
        })
      );
      const merged = { ...filled, ...draft.values };
      setValues(merged);
      // A draft saved before `dm-gap-01.2026-09-21` carries no `entries`; the
      // adapter reads its flat values as exactly one entry per repeatable
      // section, so historical work opens intact and is never rewritten.
      const normalized = normalizeEntries(schemaResult.value, {
        values: merged,
        entries: draft.entries,
      });
      setEntries(normalized);
      setPrefilledFields(Object.keys(filled));
      setAttachments(draft.attachments);
      // Keyed the same way uploads are, so a per-entry file reopens inside the
      // entry that owns it — and a pre-`entryId` file keeps its old flat key.
      setUploadFiles(
        draft.attachments.reduce<Record<string, readonly UploadedFile[]>>((map, attachment) => {
          const key = attachmentKey(
            attachment.ruleId,
            attachmentEntryId(schemaResult.value, attachment, normalized)
          );
          return {
            ...map,
            [key]: [
              ...(map[key] ?? []),
              { id: attachment.id, name: attachment.fileName, status: 'success' as const },
            ],
          };
        }, {})
      );
      setResumed(wasResumed);
      setLastSavedAt(wasResumed ? draft.updatedAt : null);
      setPhase('ready');
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadKey]);

  /* ── focus management ──────────────────────────────────────────────────── */
  const readyOnce = useRef(false);
  useEffect(() => {
    if (phase === 'ready' && !readyOnce.current) {
      readyOnce.current = true;
      document.getElementById('eh-new-application-title')?.focus();
    }
  }, [phase]);

  const stepChanged = useRef(false);
  useEffect(() => {
    if (stepChanged.current) {
      document.getElementById('eh-step-heading')?.focus();
    }
    stepChanged.current = true;
  }, [stepId]);

  /**
   * Adding or removing a repeatable entry moves focus deliberately: into the
   * new entry's first field, or onto the add control when an entry is gone.
   * Deferred through state so the node exists by the time it is focused.
   */
  useEffect(() => {
    if (pendingFocus == null) {
      return;
    }
    focusFieldTarget(pendingFocus);
    setPendingFocus(null);
  }, [pendingFocus]);

  /** The stepper stacks below the tablet breakpoint — 9 steps never fit a phone. */
  const compactStepper = useMediaQuery('(max-width: 47.98rem)');

  /* ── unsaved-changes guard ─────────────────────────────────────────────── */
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      dirty && phase === 'ready' && currentLocation.pathname !== nextLocation.pathname
  );

  useEffect(() => {
    if (!dirty || phase !== 'ready') {
      return;
    }
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty, phase]);

  /**
   * **J-01 Identity Linking — the prerequisite layer.** The journey is explicit
   * that it "applies as a prerequisite layer **before form completion begins**",
   * so it renders instead of the form, not beside it.
   *
   * An authenticated applicant never sees it: §3B row 1 resolves them directly
   * from their account, with no matching needed.
   */
  if (!isAuthenticated && identitySession == null) {
    return (
      <Section aria-labelledby="eh-identity-heading">
        <Container size="prose">
          <Breadcrumbs
            items={[
              { label: content.breadcrumbApplications, href: expertHubPaths.applications },
              { label: content.title },
            ]}
            label={content.breadcrumbLabel}
          />
          {/* The page keeps its own H1 while the gate runs: the applicant is on
              "New application", and identity linking is its first step — not a
              separate page with a dangling H2. */}
          <div className={styles.header}>
            <Typography as="h1" id="eh-new-application-title" variant="display-md" tabIndex={-1}>
              {content.title}
            </Typography>
            <Typography as="p" variant="text-md" color="muted" className={styles.intro}>
              {content.intro}
            </Typography>
          </div>

          <IdentityGate onResolved={setIdentitySession} />
        </Container>
      </Section>
    );
  }

  if (phase === 'loading') {
    return (
      <Section aria-label={content.title}>
        <Container size="prose">
          <Loading variant="skeleton" lines={6} label={content.title} />
        </Container>
      </Section>
    );
  }

  if (phase === 'schema-unavailable') {
    // TODO(G5/DM-GAP-01): remove once the approved field map ships.
    return (
      <PageLoadError
        title={content.schemaUnavailable.title}
        body={content.schemaUnavailable.body}
        onRetry={() => setReloadKey((key) => key + 1)}
        retryLabel={content.actions.retry}
        size="prose"
      />
    );
  }

  if (phase === 'error') {
    const copy = loadErrorCopy(loadError ?? { status: 0, message: '' }, locale, content);
    return (
      <PageLoadError
        title={copy.title}
        body={copy.body}
        onRetry={() => setReloadKey((key) => key + 1)}
        retryLabel={content.actions.retry}
        size="prose"
      />
    );
  }

  if (phase === 'blocked') {
    // J-01 blocks for two reasons with two different exits: an open application
    // is *tracked*, whereas an already-accredited trainer is sent to add a
    // service (J-03) — a different journey entirely. One generic "blocked"
    // screen would send an accredited trainer to the wrong place.
    const approvedTrainer = blockReason === 'approved-trainer';
    const copy = approvedTrainer ? content.blockedTrainer : content.blocked;
    return (
      <Section aria-labelledby="eh-new-application-blocked-title">
        <Container size="prose">
          <div className={styles.blocked}>
            <Typography as="h1" id="eh-new-application-blocked-title" variant="display-md">
              {copy.title}
            </Typography>
            <Alert tone="info" role="note">
              {copy.body}
            </Alert>
            <div className={styles.blockedActions}>
              {approvedTrainer ? (
                <Button variant="primary" size="md" href={expertHubPaths.profile}>
                  {content.blockedTrainer.addService}
                </Button>
              ) : (
                blockedBy != null && (
                  <Button
                    variant="primary"
                    size="md"
                    href={expertHubPaths.applicationDetail(blockedBy)}
                  >
                    {content.blocked.viewCurrent}
                  </Button>
                )
              )}
              <Button variant="secondary" size="md" href={expertHubPaths.applications}>
                {content.actions.goToApplications}
              </Button>
            </div>
          </div>
        </Container>
      </Section>
    );
  }

  if (phase === 'submitted' && submitResult != null) {
    return (
      <Section aria-labelledby="eh-new-application-success-title">
        <Container size="prose">
          <div className={styles.success}>
            <Typography as="h1" id="eh-new-application-success-title" variant="display-md">
              {content.success.title}
            </Typography>
            <Typography as="p" variant="text-lg" color="muted">
              {content.success.body}
            </Typography>
            <div className={styles.reference}>
              <Typography as="p" variant="text-sm" color="muted">
                {content.success.referenceLabel}
              </Typography>
              <Typography as="p" variant="display-md" weight="bold" color="primary">
                <bdi>{submitResult.reference}</bdi>
              </Typography>
            </div>
            <div className={styles.successActions}>
              <Button variant="primary" size="md" href={expertHubPaths.applications}>
                {content.actions.goToApplications}
              </Button>
              <Button
                variant="secondary"
                size="md"
                href={expertHubPaths.applicationDetail(submitResult.applicationId)}
              >
                {content.actions.viewDetails}
              </Button>
            </div>
          </div>
        </Container>
      </Section>
    );
  }

  if (schema == null) {
    return null;
  }

  /* ── ready: derived state ──────────────────────────────────────────────── */
  const messages = content.validation;
  const completeness = validateCompleteness(
    schema,
    { services, values, entries, attachments },
    locale,
    messages
  );

  /*
   * THE STEP LIST — derived, never declared. `visibleSectionFields` decides
   * which sections exist for this selection, so a section the schema adds
   * appears on its own and one the selection empties disappears.
   */
  const sectionSteps = orderedSections(schema).filter(
    (section) => visibleSectionFields(schema, section.id, services, values).length > 0
  );
  const stepDefs: readonly { id: StepId; title: string; description?: string }[] = [
    {
      id: 'services',
      title: content.steps.services,
      description: content.stepDescriptions.services,
    },
    ...sectionSteps.map((section) => ({
      id: `${SECTION_STEP_PREFIX}${section.id}`,
      title: sectionTitle(section, locale),
    })),
    {
      id: 'attachments',
      title: content.steps.attachments,
      description: content.stepDescriptions.attachments,
    },
    { id: 'review', title: content.steps.review, description: content.stepDescriptions.review },
  ];
  // Clamped: a selection change can retire the step the applicant is standing on.
  const stepIndex = Math.max(
    0,
    stepDefs.findIndex((candidate) => candidate.id === stepId)
  );
  const currentStep = stepDefs[stepIndex];
  const currentSection = sectionSteps.find(
    (section) => `${SECTION_STEP_PREFIX}${section.id}` === currentStep.id
  );

  const markDirty = () => {
    setDirty(true);
    setSaveFailed(false);
  };

  const handleToggleService = (toggled: ApplicationService) => {
    // Values are preserved when a service is deselected (nothing documents a
    // required removal); requiredness/visibility re-derive automatically.
    setServices((current) =>
      current.includes(toggled)
        ? current.filter((candidate) => candidate !== toggled)
        : [...current, toggled]
    );
    setServicesError(null);
    setSummaryItems([]);
    setLiveMessage(content.serviceStep.fieldsUpdated);
    markDirty();
  };

  const clearError = (key: string) =>
    setFieldErrors((current) => {
      if (current[key] == null) {
        return current;
      }
      const next = { ...current };
      delete next[key];
      return next;
    });

  const handleFieldChange = (fieldId: string, value: ApplicationFieldValue) => {
    setValues((current) => ({ ...current, [fieldId]: value }));
    clearError(fieldId);
    markDirty();
  };

  /* ── repeatable entries ────────────────────────────────────────────────── */

  const handleEntryFieldChange = (
    sectionId: string,
    entryId: string,
    fieldId: string,
    value: ApplicationFieldValue
  ) => {
    setEntries((current) => ({
      ...current,
      [sectionId]: (current[sectionId] ?? []).map((entry) =>
        entry.entryId === entryId
          ? { entryId, values: { ...entry.values, [fieldId]: value } }
          : entry
      ),
    }));
    clearError(entryFieldKey(entryId, fieldId));
    markDirty();
  };

  const handleAddEntry = (section: ApplicationSectionSchema) => {
    entryCounter.current += 1;
    // `-n` keeps generated ids clear of the adapter's `<section>-1`, which a
    // historical draft's single entry already owns.
    const entryId = `${section.id}-n${entryCounter.current}`;
    const index = (entries[section.id] ?? []).length;
    setEntries((current) => ({
      ...current,
      [section.id]: [...(current[section.id] ?? []), { entryId, values: {} }],
    }));
    setLiveMessage(content.repeatable.added(entryTitle(section, locale, index)));
    setPendingFocus(`eh-entry-fields-${entryId}`);
    markDirty();
  };

  const handleRemoveEntry = (section: ApplicationSectionSchema, entryId: string) => {
    const index = (entries[section.id] ?? []).findIndex((entry) => entry.entryId === entryId);
    const ruleIds = new Set(entryAttachmentRules(schema, section.id, services).map((r) => r.id));
    // The entry's own files go with it — including a pre-`entryId` file, which
    // belongs to the first entry and would otherwise be inherited by the next.
    const doomed = attachments.filter(
      (attachment) =>
        attachment.entryId === entryId ||
        (attachment.entryId == null && index === 0 && ruleIds.has(attachment.ruleId))
    );
    setEntries((current) => ({
      ...current,
      [section.id]: (current[section.id] ?? []).filter((entry) => entry.entryId !== entryId),
    }));
    setAttachments((current) => current.filter((item) => !doomed.includes(item)));
    setUploadFiles((current) =>
      Object.fromEntries(Object.entries(current).filter(([key]) => !key.endsWith(`::${entryId}`)))
    );
    for (const attachment of doomed) {
      void service.removeAttachment(attachment.id);
    }
    setLiveMessage(content.repeatable.removed(entryTitle(section, locale, Math.max(index, 0))));
    setPendingFocus(`eh-add-${section.id}`);
    markDirty();
  };

  /* ── step gates (`BR-0105` progressively) ──────────────────────────────── */
  const validateServicesStep = (): boolean => {
    if (services.length === 0) {
      setServicesError(content.serviceStep.noneSelectedError);
      setSummaryItems([
        { targetId: 'eh-field-services', message: content.serviceStep.noneSelectedError },
      ]);
      focusFieldTarget('eh-field-services');
      return false;
    }
    setServicesError(null);
    return true;
  };

  /**
   * One section = one step, so the gate runs over THAT section only: the
   * summary must never list a field the applicant cannot see from here.
   */
  const validateSectionStep = (section: ApplicationSectionSchema): boolean => {
    const errors: Record<string, string> = {};
    const items: ErrorSummaryItem[] = [];

    if (section.repeatable != null) {
      const rules = entryAttachmentRules(schema, section.id, services);
      (entries[section.id] ?? []).forEach((entry, index) => {
        const title = entryTitle(section, locale, index);
        for (const field of visibleSectionFields(schema, section.id, services, entry.values)) {
          const message = validateFieldValue(
            field,
            entry.values[field.id],
            services,
            locale,
            messages
          );
          if (message != null) {
            const key = entryFieldKey(entry.entryId, field.id);
            errors[key] = message;
            items.push({
              targetId: `eh-field-${key}`,
              message: `${title} — ${fieldLabel(field, locale)}: ${message}`,
            });
          }
        }
        for (const rule of rules) {
          if (
            isRuleRequired(rule, services) &&
            entryAttachments(attachments, rule.id, entry.entryId, index).length === 0
          ) {
            items.push({
              targetId: `eh-field-attachment-${attachmentKey(rule.id, entry.entryId)}`,
              message: `${title} — ${messages.missingAttachment(ruleLabel(rule, locale))}`,
            });
          }
        }
      });
    } else {
      for (const field of visibleSectionFields(schema, section.id, services, values)) {
        const message = validateFieldValue(field, values[field.id], services, locale, messages);
        if (message != null) {
          errors[field.id] = message;
          items.push({
            targetId: `eh-field-${field.id}`,
            message: `${fieldLabel(field, locale)}: ${message}`,
          });
        }
      }
    }

    setFieldErrors(errors);
    setSummaryItems(items);
    if (items.length > 0) {
      focusFieldTarget(items[0].targetId);
      return false;
    }
    return true;
  };

  const validateAttachmentsStep = (): boolean => {
    const items: ErrorSummaryItem[] = visibleAttachmentRules(schema, services)
      .filter(
        (rule) =>
          isRuleRequired(rule, services) &&
          !attachments.some((attachment) => attachment.ruleId === rule.id)
      )
      .map((rule) => ({
        targetId: `eh-field-attachment-${rule.id}`,
        message: messages.missingAttachment(ruleLabel(rule, locale)),
      }));
    setSummaryItems(items);
    if (items.length > 0) {
      focusFieldTarget(items[0].targetId);
      return false;
    }
    return true;
  };

  const goToStep = (next: StepId) => {
    setSummaryItems([]);
    setStepId(next);
    setVisited((current) => new Set([...current, next]));
  };

  const handleNext = () => {
    const passed =
      currentStep.id === 'services'
        ? validateServicesStep()
        : currentStep.id === 'attachments'
          ? validateAttachmentsStep()
          : currentSection == null || validateSectionStep(currentSection);
    if (!passed) {
      return;
    }
    goToStep(stepDefs[Math.min(stepIndex + 1, stepDefs.length - 1)].id);
  };

  /**
   * What to tell someone whose upload was refused.
   *
   * The server answers a rule breach with a sentence that names it — the
   * format, the size cap, the count. That sentence is the useful one, so it
   * is shown as-is; the page's own "try again" is kept for the cases where
   * there is nothing to say (a network drop, a 500), because retrying is
   * genuinely the right advice then and only then.
   */
  const uploadFailureMessage = (error: { status: number; message: string }) => {
    // The server explained itself: show the explanation, whatever the status.
    // ⚠️ This used to be limited to 422, which hid a 400 that said "Unknown
    // attachment rule" — the one sentence that would have found the bug
    // immediately. A refusal the server can describe is never shown as
    // "try again".
    if (error.status >= 400 && error.status < 500 && error.message.trim() !== '') {
      return error.message;
    }
    // 413 never reaches the API — a reverse proxy refused the body first. The
    // person cannot act on "try again", but they can act on "it is too big",
    // and support can act on knowing it was the proxy.
    if (error.status === 413) {
      return content.attachmentsStep.uploadTooLargeForServer;
    }
    // Anything else carries its status, so a screenshot is a diagnosis rather
    // than the start of one.
    return error.status > 0
      ? `${content.attachmentsStep.uploadFailed}${content.attachmentsStep.uploadFailureCode(error.status)}`
      : content.attachmentsStep.uploadFailed;
  };

  /* ── attachments (`BR-0106` immediate validation; `G26`/`G27` seam) ────── */
  const handleSelectFiles = (
    rule: ApplicationAttachmentRule,
    selected: File[],
    entryId?: string
  ) => {
    const key = attachmentKey(rule.id, entryId);
    for (const file of selected) {
      const existingCount = (uploadFiles[key] ?? []).filter(
        (entry) => entry.status !== 'error'
      ).length;
      const invalid = validateAttachmentFile(rule, file, existingCount, messages);
      localFileCounter.current += 1;
      const localId = `local-${localFileCounter.current}`;
      if (invalid != null) {
        setUploadFiles((current) => ({
          ...current,
          [key]: [
            ...(current[key] ?? []),
            { id: localId, name: file.name, status: 'error', errorMessage: invalid },
          ],
        }));
        setLiveMessage(invalid);
        continue;
      }
      setUploadFiles((current) => ({
        ...current,
        [key]: [...(current[key] ?? []), { id: localId, name: file.name, status: 'uploading' }],
      }));
      markDirty();
      void service.uploadAttachment(rule.id, file, entryId).then((result) => {
        setUploadFiles((current) => ({
          ...current,
          [key]: (current[key] ?? []).map((entry) =>
            entry.id !== localId
              ? entry
              : result.ok
                ? { id: result.value.id, name: entry.name, status: 'success' as const }
                : {
                    ...entry,
                    status: 'error' as const,
                    // The server explains a refusal — wrong format, too large,
                    // too many. Replacing that with "try again" hides the one
                    // thing the person needs in order to succeed.
                    errorMessage: uploadFailureMessage(result.error),
                  }
          ),
        }));
        if (result.ok) {
          setAttachments((current) => [...current, result.value]);
        } else {
          setLiveMessage(uploadFailureMessage(result.error));
        }
      });
    }
  };

  const handleRemoveFile = (ruleId: string, fileId: string, entryId?: string) => {
    const key = attachmentKey(ruleId, entryId);
    setUploadFiles((current) => ({
      ...current,
      [key]: (current[key] ?? []).filter((entry) => entry.id !== fileId),
    }));
    if (attachments.some((attachment) => attachment.id === fileId)) {
      setAttachments((current) => current.filter((attachment) => attachment.id !== fileId));
      void service.removeAttachment(fileId);
      markDirty();
    }
  };

  /* ── draft save (explicit — autosave not documented, deferred) ─────────── */
  const handleSaveDraft = () => {
    // J-01 governing rule 2 + §5's last-but-one row: "Save Draft attempted (any
    // identity type, not logged in) → always redirected to login/account
    // creation first". The guest is told why rather than watching a button do
    // nothing, and their entered data stays on screen.
    if (!canSaveDraft) {
      setDraftBlocked(true);
      return;
    }
    setSaving(true);
    setSaveFailed(false);
    void service.saveDraft({ services, values, entries }).then((result) => {
      setSaving(false);
      if (result.ok) {
        setLastSavedAt(result.value.updatedAt);
        setDirty(false);
      } else {
        setSaveFailed(true);
      }
    });
  };

  /* ── submit (`BR-0105` gate + confirm + `BR-0107` reference) ───────────── */
  const handleConfirmSubmit = () => {
    setSubmitting(true);
    setSubmitFailed(false);
    void service.submitApplication({ services, values, entries }).then((result) => {
      setSubmitting(false);
      setConfirmOpen(false);
      if (result.ok) {
        setDirty(false);
        setSubmitResult(result.value);
        setPhase('submitted');
      } else {
        setSubmitFailed(true);
      }
    });
  };

  const savedTime =
    lastSavedAt == null
      ? null
      : formatDate(new Date(lastSavedAt), locale, {
          timeStyle: 'short',
        });

  return (
    <Section aria-labelledby="eh-new-application-title">
      <Container>
        <Breadcrumbs
          items={[
            { label: content.breadcrumbApplications, href: expertHubPaths.applications },
            { label: content.title },
          ]}
          label={content.breadcrumbLabel}
        />

        <div className={styles.header}>
          <Typography as="h1" id="eh-new-application-title" variant="display-md" tabIndex={-1}>
            {content.title}
          </Typography>
          <Typography as="p" variant="text-md" color="muted" className={styles.intro}>
            {content.intro}
          </Typography>
          {resumed && (
            <Alert tone="info" role="note">
              {content.draft.resumedNotice}
            </Alert>
          )}

          {/* J-01 governing rule 2 — a guest can fill the whole form, and is
              told up front what they cannot do, rather than discovering it when
              a button refuses. */}
          {!canSaveDraft && (
            <Alert
              tone="info"
              surface="tinted"
              role="note"
              title={identityContent.guest.bannerTitle}
            >
              {identityContent.guest.bannerBody}
            </Alert>
          )}

          {/* §5 — "Save Draft attempted, not logged in → always redirected to
              login/account creation first". The entered data stays on screen. */}
          {draftBlocked && (
            <Alert tone="warning" role="alert" title={identityContent.guest.saveDraftBlockedTitle}>
              {identityContent.guest.saveDraftBlockedBody}
              <div className={styles.guestSignIn}>
                <Button variant="primary" size="sm" href={expertHubPaths.login}>
                  {identityContent.guest.signInAction}
                </Button>
              </div>
            </Alert>
          )}
        </div>

        <div className={styles.stepper}>
          <Steps
            steps={stepDefs.map(({ id, title, description }) => ({
              id,
              label: title,
              description,
            }))}
            currentId={currentStep.id}
            orientation={compactStepper ? 'vertical' : 'horizontal'}
            completedIds={[...visited].filter((id) => id !== currentStep.id)}
            onStepClick={(id) => {
              if (visited.has(id)) {
                goToStep(id);
              }
            }}
            label={content.stepperLabel}
          />
        </div>

        {/* Announces dynamic field/upload changes to assistive tech. */}
        <div className={styles.visuallyHidden} aria-live="polite">
          {liveMessage}
        </div>

        <ApplicationErrorSummary title={messages.summaryTitle} items={summaryItems} />

        <div className={styles.stepPanel}>
          <Typography as="h2" id="eh-step-heading" variant="text-lg" weight="bold" tabIndex={-1}>
            {currentStep.title}
          </Typography>

          {currentStep.id === 'services' && (
            <ServiceSelection
              schema={schema}
              selected={services}
              onToggle={handleToggleService}
              content={content}
              error={servicesError}
            />
          )}

          {currentSection != null && (
            <div className={styles.sections}>
              {/*
                Said out loud when the Academy filled anything in — on the step
                that holds those fields, not on all of them. Silence would
                present its record as the applicant's own entry, and these are
                fields they are about to put their name to.
              */}
              {prefilledFields.some(
                (id) =>
                  schema.fields.find((field) => field.id === id)?.sectionId === currentSection.id
              ) && (
                <Alert tone="info" title={content.prefill.title} role="status">
                  {content.prefill.body}
                </Alert>
              )}
              {currentSection.repeatable != null ? (
                <RepeatableSection
                  schema={schema}
                  section={currentSection}
                  services={services}
                  entries={entries[currentSection.id] ?? []}
                  errors={fieldErrors}
                  files={uploadFiles}
                  locale={locale}
                  content={content}
                  onChange={(entryId, fieldId, value) =>
                    handleEntryFieldChange(currentSection.id, entryId, fieldId, value)
                  }
                  onAdd={() => handleAddEntry(currentSection)}
                  onRemove={(entryId) => handleRemoveEntry(currentSection, entryId)}
                  onSelectFiles={(rule, entryId, selected) =>
                    handleSelectFiles(rule, selected, entryId)
                  }
                  onRemoveFile={(ruleId, entryId, fileId) =>
                    handleRemoveFile(ruleId, fileId, entryId)
                  }
                />
              ) : (
                <ApplicationFormSection
                  schema={schema}
                  section={currentSection}
                  services={services}
                  values={values}
                  errors={fieldErrors}
                  locale={locale}
                  content={content}
                  onChange={handleFieldChange}
                />
              )}
            </div>
          )}

          {currentStep.id === 'attachments' && (
            <AttachmentSection
              schema={schema}
              services={services}
              files={uploadFiles}
              locale={locale}
              content={content}
              onSelect={handleSelectFiles}
              onRemove={handleRemoveFile}
            />
          )}

          {currentStep.id === 'review' && (
            <>
              {submitFailed && (
                <Alert tone="error" title={content.errors.submitFailedTitle}>
                  {content.errors.submitFailedBody}
                </Alert>
              )}
              <ApplicationReview
                schema={schema}
                services={services}
                values={values}
                attachments={attachments}
                entries={entries}
                completeness={completeness}
                locale={locale}
                content={content}
                onEditStep={goToStep}
              />
            </>
          )}
        </div>

        <div className={styles.actionsBar}>
          <div className={styles.actionsStart}>
            {stepIndex > 0 && (
              <Button
                variant="secondary"
                size="md"
                onClick={() => goToStep(stepDefs[stepIndex - 1].id)}
              >
                {content.actions.back}
              </Button>
            )}
            <Button variant="tertiary" size="md" onClick={handleSaveDraft} disabled={saving}>
              {content.actions.saveDraft}
            </Button>
            <Typography as="p" variant="text-sm" color="muted" aria-live="polite">
              {saving
                ? content.draft.saving
                : saveFailed
                  ? content.draft.saveFailed
                  : savedTime != null
                    ? `${content.draft.savedPrefix} ${savedTime}`
                    : ''}
            </Typography>
          </div>
          {currentStep.id !== 'review' ? (
            <Button variant="primary" size="md" onClick={handleNext}>
              {content.actions.next}
            </Button>
          ) : (
            <Button
              variant="primary"
              size="md"
              onClick={() => setConfirmOpen(true)}
              disabled={!completeness.valid || submitting}
            >
              {content.actions.submit}
            </Button>
          )}
        </div>

        {/* `05` §0.5: submitting is state-changing → explicit confirmation. */}
        <Modal
          open={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          title={content.confirm.title}
          dismissLabel={content.confirm.dismissLabel}
          footer={
            <div className={styles.modalActions}>
              <Button variant="secondary" size="md" onClick={() => setConfirmOpen(false)}>
                {content.confirm.cancelLabel}
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleConfirmSubmit}
                disabled={submitting}
              >
                {content.confirm.confirmLabel}
              </Button>
            </div>
          }
        >
          <Typography as="p" variant="text-md">
            {content.confirm.body}
          </Typography>
        </Modal>

        {/* Unsaved-changes warning before navigating away. */}
        <Modal
          open={blocker.state === 'blocked'}
          onClose={() => blocker.reset?.()}
          title={content.unsaved.title}
          dismissLabel={content.unsaved.dismissLabel}
          footer={
            <div className={styles.modalActions}>
              <Button variant="secondary" size="md" onClick={() => blocker.proceed?.()}>
                {content.unsaved.leaveLabel}
              </Button>
              <Button variant="primary" size="md" onClick={() => blocker.reset?.()}>
                {content.unsaved.stayLabel}
              </Button>
            </div>
          }
        >
          <Typography as="p" variant="text-md">
            {content.unsaved.body}
          </Typography>
        </Modal>
      </Container>
    </Section>
  );
}
