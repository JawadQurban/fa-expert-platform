import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Loading } from '@ds/composite';
import { Button, Checkbox, Select, Switch, Tag, Typography } from '@ds/primitives';
import { useLocale } from '@i18n/LocaleProvider';
import { getNotificationService } from './notificationService';
import { getNotificationsContent } from './notifications.content';
import { NotificationsAreaNav } from './NotificationsAreaNav';
import {
  AUDIENCE_CODES,
  rowFor,
  validateRouting,
  type AudienceCode,
  type NotificationMatrixDto,
  type RoutingValidationCode,
} from './notification.types';
import type { ExpertHubApiError } from '../../shared/services/apiClient';
import { describeLoadFailure } from '../../shared/errors/loadFailure';
import { PageLoadError } from '../../shared/components/PageLoadError';
import { WorkspacePage } from '../../shared/workspace/WorkspacePage';
import { PageHead } from '../../shared/workspace/PageHead';
import { Panel } from '../../shared/workspace/Panel';
import styles from './NotificationsPage.module.css';

/**
 * EH-INT-12 — the central notification matrix (**CAP-07 / `F-0702`**), at
 * `/expert-hub/internal/notifications/matrix`.
 *
 * `US-0702`: "manage a matrix binding every event from any capability to its
 * template and its target audience, so who is notified of what is set centrally."
 *
 * Four things the page states rather than leaves to be inferred:
 *
 * - **The routing is a draft.** `DM-GAP-08` has not arrived, so every event
 *   starts unrouted *deliberately*.
 * - **There is no channel choice**, because `BR-0702` fires email and
 *   in-platform together. An administrator hunting for the toggle is told why.
 * - **The event list is not editable here.** `BR-0703` — capabilities raise
 *   their own events; this screen decides recipient and template.
 * - **A draft template cannot be routed to** (`BR-0701`), which is why the
 *   template picker offers approved templates only.
 *
 * Beside each event sits the **journey's own wording** about who is notified.
 * That is evidence, not routing: it is why the event exists, and it lets the
 * System Administrator route it without opening ten journey documents.
 */

type Phase = 'loading' | 'error' | 'ready';

interface RoutingDraft {
  readonly templateId: string;
  readonly audience: readonly AudienceCode[];
}

export default function NotificationMatrixPage() {
  const { locale } = useLocale();
  const content = useMemo(() => getNotificationsContent(locale), [locale]);
  const copy = content.matrix;
  const service = getNotificationService();

  const [phase, setPhase] = useState<Phase>('loading');
  const [loadError, setLoadError] = useState<ExpertHubApiError | null>(null);
  const [matrix, setMatrix] = useState<NotificationMatrixDto | null>(null);
  const [capability, setCapability] = useState('');
  const [drafts, setDrafts] = useState<Readonly<Record<string, RoutingDraft>>>({});
  const [issues, setIssues] = useState<Readonly<Record<string, readonly RoutingValidationCode[]>>>(
    {}
  );
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
      document.getElementById('eh-notification-matrix-title')?.focus();
    }
  }, [phase]);

  if (phase === 'loading') {
    return (
      <WorkspacePage label={copy.title}>
        <Loading variant="skeleton" lines={6} label={copy.title} />
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
  const approvedTemplates = served.templates.filter((template) => template.status === 'approved');
  const capabilities = [...new Set(served.events.map((event) => event.capabilityCode))];
  const activeCapability = capabilities.includes(capability) ? capability : (capabilities[0] ?? '');
  const visible = served.events.filter((event) => event.capabilityCode === activeCapability);
  const routedCount = served.rows.filter((row) => row.status === 'routed').length;

  const draftFor = (eventCode: string): RoutingDraft => {
    const existing = drafts[eventCode];
    if (existing != null) {
      return existing;
    }
    const row = rowFor(served.rows, eventCode);
    return row.status === 'routed'
      ? { templateId: row.templateId, audience: row.audience }
      : { templateId: '', audience: [] };
  };

  const setDraft = (eventCode: string, next: RoutingDraft) => {
    setDrafts((current) => ({ ...current, [eventCode]: next }));
  };

  const save = (eventCode: string) => {
    const draft = draftFor(eventCode);
    const found = validateRouting(draft, served.templates);
    setIssues((current) => ({ ...current, [eventCode]: found }));
    if (found.length > 0) {
      return;
    }
    setFailed(false);
    void service.routeEvent(eventCode, draft).then((result) => {
      if (result.ok) {
        setMatrix(result.value);
      } else {
        setFailed(true);
      }
    });
  };

  const toggleActive = (eventCode: string, isActive: boolean) => {
    setFailed(false);
    void service.setRowActive(eventCode, isActive).then((result) => {
      if (result.ok) {
        setMatrix(result.value);
      } else {
        setFailed(true);
      }
    });
  };

  return (
    <WorkspacePage labelledBy="eh-notification-matrix-title">
      <NotificationsAreaNav content={content} current="matrix" />

      <PageHead
        titleId="eh-notification-matrix-title"
        title={copy.title}
        lead={copy.intro}
        summary={copy.routedCount(routedCount, served.events.length)}
      />

      {/* `DM-GAP-08` — say it is a draft first, before anything else. */}
      {served.modelStatus === 'unapproved' && (
        <Alert tone="warning" surface="tinted" role="note" title={copy.unapprovedTitle}>
          {copy.unapprovedBody}
        </Alert>
      )}
      {/* `BR-0701` — with no approved template, nothing here can be routed. */}
      {approvedTemplates.length === 0 && (
        <Alert tone="info" surface="tinted" role="note" title={copy.noTemplatesTitle}>
          {copy.noTemplatesBody}
        </Alert>
      )}
      {failed && (
        <Alert tone="error" surface="tinted" role="alert">
          {content.errors.actionFailed}
        </Alert>
      )}

      <Panel
        flush
        toolbar={
          <>
            {/* `BR-0702` and `BR-0703` — why two things a reader might look for
                are absent: a channel choice, and a way to add an event. */}
            <Typography as="p" variant="text-xs" color="muted">
              {copy.bothChannelsNote}
            </Typography>
            <Typography as="p" variant="text-xs" color="muted">
              {copy.catalogueNote}
            </Typography>
            <div className={styles.filters}>
              <Select
                label={copy.capabilityLabel}
                value={activeCapability}
                onValueChange={setCapability}
                options={capabilities.map((code) => ({
                  value: code,
                  label: copy.capabilityOption(
                    code,
                    served.events.filter((event) => event.capabilityCode === code).length
                  ),
                }))}
              />
            </div>
          </>
        }
      >
        <ul className={styles.consoleRows}>
          {visible.map((event) => {
            const row = rowFor(served.rows, event.eventCode);
            const draft = draftFor(event.eventCode);
            const found = issues[event.eventCode] ?? [];
            const routedTemplate =
              row.status === 'routed'
                ? served.templates.find((template) => template.templateId === row.templateId)
                : undefined;
            return (
              <li key={event.eventCode} className={styles.consoleRow}>
                <div className={styles.rowHead}>
                  <Typography as="h2" variant="text-sm" weight="bold">
                    {locale === 'ar' ? event.nameAr : event.nameEn}
                  </Typography>
                  <span className={styles.rowStatus}>
                    {row.status === 'routed' ? (
                      <Tag variant={row.isActive ? 'success' : 'warning'} size="sm">
                        {copy.routedTo(routedTemplate?.code ?? row.templateId)}
                      </Tag>
                    ) : (
                      <Tag variant="warning" size="sm">
                        {copy.unrouted}
                      </Tag>
                    )}
                  </span>
                </div>

                {/* Evidence, deliberately separated from the decision. */}
                <div className={styles.evidence}>
                  <Typography as="span" variant="text-xs" color="muted">
                    {copy.evidenceLabel} — {event.source}
                  </Typography>
                  <Typography as="span" variant="text-sm">
                    <bdi>{locale === 'ar' ? event.journeyAudienceAr : event.journeyAudienceEn}</bdi>
                  </Typography>
                </div>

                <div className={styles.routing}>
                  <Select
                    label={copy.templateLabel(event.eventCode)}
                    // `BR-0701` — approved templates only, so a draft is not
                    // merely rejected on save; it is never offered.
                    options={approvedTemplates.map((template) => ({
                      value: template.templateId,
                      label: template.code,
                    }))}
                    value={draft.templateId}
                    onValueChange={(value) =>
                      setDraft(event.eventCode, { ...draft, templateId: value })
                    }
                    disabled={approvedTemplates.length === 0}
                    errorText={
                      found.includes('template-required')
                        ? content.errors.templateRequired
                        : found.includes('template-not-approved')
                          ? content.errors.templateNotApproved
                          : undefined
                    }
                  />

                  <fieldset
                    className={styles.audienceGrid}
                    aria-describedby={
                      found.includes('audience-required')
                        ? `${event.eventCode}-audience-error`
                        : undefined
                    }
                  >
                    <legend className="fads-visually-hidden">
                      {copy.audienceLegend(event.eventCode)}
                    </legend>
                    {AUDIENCE_CODES.map((code) => (
                      <Checkbox
                        key={code}
                        label={content.audiences[code]}
                        checked={draft.audience.includes(code)}
                        onChange={(changeEvent) =>
                          setDraft(event.eventCode, {
                            ...draft,
                            audience: changeEvent.target.checked
                              ? [...draft.audience, code]
                              : draft.audience.filter((entry) => entry !== code),
                          })
                        }
                      />
                    ))}
                  </fieldset>
                  {found.includes('audience-required') && (
                    <p
                      id={`${event.eventCode}-audience-error`}
                      className={styles.groupError}
                      role="alert"
                    >
                      {content.errors.audienceRequired}
                    </p>
                  )}

                  <div className={styles.actions}>
                    <Button variant="primary" size="sm" onClick={() => save(event.eventCode)}>
                      {copy.save}
                    </Button>
                    {/* Only a routed row can be paused — an unrouted one has
                        nothing to pause, which is what the union says. */}
                    {row.status === 'routed' && (
                      <Switch
                        label={copy.activeLabel(event.eventCode)}
                        checked={row.isActive}
                        onCheckedChange={(checked) => toggleActive(event.eventCode, checked)}
                      />
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </Panel>
    </WorkspacePage>
  );
}
