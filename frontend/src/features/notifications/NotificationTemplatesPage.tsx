import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, EmptyState, Loading } from '@ds/composite';
import { Button, Icon, Tag, TextInput, Textarea, Typography } from '@ds/primitives';
import { useLocale } from '@i18n/LocaleProvider';
import { getNotificationService } from './notificationService';
import { getNotificationsContent } from './notifications.content';
import { NotificationsAreaNav } from './NotificationsAreaNav';
import {
  validateTemplate,
  type NotificationMatrixDto,
  type TemplateInput,
  type TemplateValidationCode,
} from './notification.types';
import type { ExpertHubApiError } from '../../shared/services/apiClient';
import { describeLoadFailure } from '../../shared/errors/loadFailure';
import { PageLoadError } from '../../shared/components/PageLoadError';
import { WorkspacePage } from '../../shared/workspace/WorkspacePage';
import { PageHead } from '../../shared/workspace/PageHead';
import { Panel } from '../../shared/workspace/Panel';
import styles from './NotificationsPage.module.css';
import { dateFormatter } from '../../shared/formatting';

/**
 * EH-INT-12 — bilingual message templates (**CAP-07 / `F-0703`**), at
 * `/expert-hub/internal/notifications/templates`.
 *
 * `US-0703`: "create and edit the approved message templates in Arabic and
 * English **together**, so the Academy's official wording is unified in both."
 *
 * The word «معًا» is the design. The editor puts the two languages side by side
 * and **approval requires both** — a template with one language filled in is a
 * draft, and `BR-0701` forbids routing an unapproved template, so a
 * half-translated message can never reach a recipient.
 *
 * `BR-0704` restricts creating and editing to the System Administrator. That is
 * **server-decided** (`canManageTemplates`, P-J9): this page renders the answer
 * and never works it out from a role string.
 *
 * Editing an approved template returns it to draft, and any event routed to it
 * becomes unrouted. The approval was of *the wording*, and the wording changed.
 */

type Phase = 'loading' | 'error' | 'ready';

const EMPTY_INPUT: TemplateInput = {
  code: '',
  subjectAr: '',
  subjectEn: '',
  bodyAr: '',
  bodyEn: '',
};

export default function NotificationTemplatesPage() {
  const { locale } = useLocale();
  const content = useMemo(() => getNotificationsContent(locale), [locale]);
  const copy = content.templates;
  const service = getNotificationService();

  const [phase, setPhase] = useState<Phase>('loading');
  const [loadError, setLoadError] = useState<ExpertHubApiError | null>(null);
  const [matrix, setMatrix] = useState<NotificationMatrixDto | null>(null);
  const [editing, setEditing] = useState<{ id: string | null } | null>(null);
  const [input, setInput] = useState<TemplateInput>(EMPTY_INPUT);
  const [issues, setIssues] = useState<readonly TemplateValidationCode[]>([]);
  const [failed, setFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const loadedOnce = useRef(false);

  useEffect(() => {
    document.title = copy.documentTitle;
  }, [copy.documentTitle]);

  useEffect(() => {
    let cancelled = false;
    setPhase('loading');
    void service.getMatrix().then((result) => {
      if (cancelled) {
        return;
      }
      if (!result.ok) {
        setLoadError(result.error);
        setPhase('error');
        return;
      }
      setMatrix(result.value);
      setPhase('ready');
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadKey]);

  useEffect(() => {
    if (phase === 'ready' && !loadedOnce.current) {
      loadedOnce.current = true;
      document.getElementById('eh-templates-title')?.focus();
    }
  }, [phase]);

  if (phase === 'loading') {
    return (
      <WorkspacePage label={copy.title}>
        <Loading variant="skeleton" lines={5} label={copy.title} />
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

  if (phase === 'error' || matrix == null) {
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

  const served = matrix;
  const dates = dateFormatter(locale, {
    dateStyle: 'medium',
  });

  const openEditor = (templateId: string | null) => {
    const existing = served.templates.find((template) => template.templateId === templateId);
    setIssues([]);
    setEditing({ id: templateId });
    setInput(
      existing == null
        ? EMPTY_INPUT
        : {
            code: existing.code,
            subjectAr: existing.subjectAr,
            subjectEn: existing.subjectEn,
            bodyAr: existing.bodyAr,
            bodyEn: existing.bodyEn,
          }
    );
  };

  const save = () => {
    // `BR-0701` on the way in — both languages, complete.
    const found = validateTemplate(input, matrix.knownPlaceholders);
    setIssues(found);
    if (found.length > 0) {
      return;
    }
    setFailed(false);
    void service.saveTemplate(editing?.id ?? null, input).then((result) => {
      if (!result.ok) {
        setFailed(true);
        return;
      }
      setMatrix(result.value);
      setEditing(null);
      setInput(EMPTY_INPUT);
    });
  };

  const approve = (templateId: string) => {
    setFailed(false);
    void service.approveTemplate(templateId).then((result) => {
      if (result.ok) {
        setMatrix(result.value);
      } else {
        setFailed(true);
      }
    });
  };

  const errorFor = (code: TemplateValidationCode, message: string) =>
    issues.includes(code) ? message : undefined;

  return (
    <WorkspacePage labelledBy="eh-templates-title">
      <NotificationsAreaNav content={content} current="templates" />

      <PageHead
        titleId="eh-templates-title"
        title={copy.title}
        lead={copy.intro}
        actions={
          served.canManageTemplates && editing == null ? (
            <Button variant="primary" size="md" onClick={() => openEditor(null)}>
              {copy.newTemplate}
            </Button>
          ) : undefined
        }
      />

      {failed && (
        <Alert tone="error" surface="tinted" role="alert">
          {content.errors.actionFailed}
        </Alert>
      )}
      {/* `BR-0704` — server-decided, and stated rather than silently disabling. */}
      {!served.canManageTemplates && (
        <Alert tone="info" surface="tinted" role="note">
          {copy.readOnlyNotice}
        </Alert>
      )}

      {editing != null && (
        <Panel shape="inline" title={copy.editorHeading} titleId="eh-template-editor">
          <div className={styles.editor}>
            <TextInput
              label={copy.codeLabel}
              value={input.code}
              onChange={(event) => setInput({ ...input, code: event.target.value })}
              errorText={errorFor('code-required', content.errors.codeRequired)}
            />
            {/* Side by side, because `BR-0701` approves them together. */}
            <div className={styles.bilingual}>
              <TextInput
                label={copy.subjectArLabel}
                value={input.subjectAr}
                onChange={(event) => setInput({ ...input, subjectAr: event.target.value })}
                errorText={errorFor('subject-ar-required', content.errors.subjectArRequired)}
              />
              <TextInput
                label={copy.subjectEnLabel}
                value={input.subjectEn}
                onChange={(event) => setInput({ ...input, subjectEn: event.target.value })}
                errorText={errorFor('subject-en-required', content.errors.subjectEnRequired)}
              />
            </div>
            <div className={styles.bilingual}>
              <Textarea
                label={copy.bodyArLabel}
                rows={6}
                value={input.bodyAr}
                onChange={(event) => setInput({ ...input, bodyAr: event.target.value })}
                helperText={copy.placeholderHelp(
                  served.knownPlaceholders.join(locale === 'ar' ? '، ' : ', ')
                )}
                errorText={
                  errorFor('body-ar-required', content.errors.bodyArRequired) ??
                  errorFor('unknown-placeholder', content.errors.unknownPlaceholder)
                }
              />
              <Textarea
                label={copy.bodyEnLabel}
                rows={6}
                value={input.bodyEn}
                onChange={(event) => setInput({ ...input, bodyEn: event.target.value })}
                errorText={errorFor('body-en-required', content.errors.bodyEnRequired)}
              />
            </div>
            <div className={styles.actions}>
              <Button variant="primary" size="md" onClick={save}>
                {copy.save}
              </Button>
              <Button variant="tertiary" size="md" onClick={() => setEditing(null)}>
                {copy.cancel}
              </Button>
            </div>
          </div>
        </Panel>
      )}

      <Panel
        flush={served.templates.length > 0}
        toolbar={
          <>
            <Typography as="p" variant="text-xs" color="muted">
              {copy.adminOnlyNote}
            </Typography>
            <Typography as="p" variant="text-xs" color="muted">
              {copy.bilingualNote}
            </Typography>
          </>
        }
      >
        {served.templates.length === 0 ? (
          <EmptyState
            icon={<Icon name="note-01" size="featured" tone="neutral" />}
            title={copy.empty}
          />
        ) : (
          <ul className={styles.consoleRows}>
            {served.templates.map((template) => (
              <li key={template.templateId} className={styles.consoleRow}>
                <div className={styles.rowHead}>
                  <Typography as="h2" variant="text-sm" weight="bold">
                    <bdi>{template.code}</bdi>
                  </Typography>
                  <span className={styles.rowStatus}>
                    <Tag variant={template.status === 'approved' ? 'success' : 'warning'} size="sm">
                      {copy.statuses[template.status]}
                    </Tag>
                  </span>
                </div>
                <div className={styles.bilingual}>
                  <Typography as="p" variant="text-sm">
                    <bdi>{template.subjectAr}</bdi>
                  </Typography>
                  <Typography as="p" variant="text-sm">
                    <bdi>{template.subjectEn}</bdi>
                  </Typography>
                </div>
                <Typography as="p" variant="text-xs" color="muted">
                  {copy.versionLine(
                    template.version,
                    template.updatedByName,
                    dates.format(new Date(template.updatedAt))
                  )}
                </Typography>
                {served.canManageTemplates && (
                  <div className={styles.actions}>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => openEditor(template.templateId)}
                    >
                      {copy.edit(template.code)}
                    </Button>
                    {template.status === 'draft' && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => approve(template.templateId)}
                      >
                        {copy.approve(template.code)}
                      </Button>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </WorkspacePage>
  );
}
