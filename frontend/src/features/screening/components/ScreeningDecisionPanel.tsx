import { useId, useMemo, useRef, useState } from 'react';
import { Alert, Modal } from '@ds/composite';
import { Button, Checkbox, RadioGroup, Radio, Select, Textarea, Typography } from '@ds/primitives';
import type { SelectOption } from '@ds/primitives';
import type { Locale } from '@/types';
import type { ApplicationService } from '../../applications/application.types';
import { InterviewSlotsField } from '../../interviews/components/InterviewSlotsField';
import type { ScreeningContent } from '../screening.content';
import {
  EXEMPTION_REASONS,
  REJECTION_REASONS,
  createServiceDecision,
  validateAcceptDecision,
  validateRejectDecision,
} from '../screening.types';
import type {
  AcceptDecisionInput,
  AcceptValidationIssue,
  AcceptedServiceDecision,
  CommitteeMemberDto,
  ExemptionReasonId,
  RejectionReasonId,
  ScreeningDecisionInput,
} from '../screening.types';
import { Panel } from '../../../shared/workspace/Panel';
import styles from './ScreeningDecisionPanel.module.css';

/**
 * J-05/F5 + J-08/F1 — the screening decision, taken directly from the insight
 * page (F2/AC-7). The panel encodes the journey's decision *shape*:
 *
 * - **Acceptance is per service** (AC-1): several services can be accepted in
 *   one decision, and every service left unselected is auto-rejected (AC-2) —
 *   surfaced as a standing warning before the manager confirms, never as a
 *   surprise afterwards.
 * - **Each accepted service must carry a complete path** (AC-3): interview slots
 *   **and** committee members together, *or* an exemption with a reason (J-08).
 *   `validateAcceptDecision` is the only gate (AC-4); the confirm dialog does
 *   not open while any issue remains.
 * - **Rejection is whole-application** (AC-7): a distinct destructive flow with
 *   an explicit warning, confirmation, and a mandatory reason (AC-8, `BR-0219`).
 *
 * The panel owns only its draft; the page owns submission and its result.
 */
type Draft = Readonly<Record<string, AcceptedServiceDecision>>;

function formatServiceList(
  services: readonly ApplicationService[],
  content: ScreeningContent,
  locale: Locale
): string {
  return services.map((service) => content.services[service]).join(locale === 'ar' ? '، ' : ', ');
}

function issueMessage(issue: AcceptValidationIssue, content: ScreeningContent): string {
  const service = issue.service == null ? '' : content.services[issue.service];
  return content.decision.errors[issue.code](service);
}

export function ScreeningDecisionPanel({
  services,
  committeePool,
  content,
  locale,
  submitting,
  onSubmit,
}: {
  readonly services: readonly ApplicationService[];
  readonly committeePool: readonly CommitteeMemberDto[];
  readonly content: ScreeningContent;
  readonly locale: Locale;
  readonly submitting: boolean;
  readonly onSubmit: (decision: ScreeningDecisionInput) => void;
}) {
  const copy = content.decision;
  const panelId = useId();
  const errorsRef = useRef<HTMLDivElement>(null);

  const [draft, setDraft] = useState<Draft>({});
  const [issues, setIssues] = useState<readonly AcceptValidationIssue[]>([]);
  const [acceptOpen, setAcceptOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState<RejectionReasonId | ''>('');
  const [rejectOther, setRejectOther] = useState('');
  const [rejectError, setRejectError] = useState<string | null>(null);

  const acceptedServices = useMemo(
    () => services.filter((service) => draft[service] != null),
    [services, draft]
  );
  const unselectedServices = useMemo(
    () => services.filter((service) => draft[service] == null),
    [services, draft]
  );
  const exemptedServices = acceptedServices.filter(
    (service) => draft[service]?.path === 'exemption'
  );

  const acceptInput: AcceptDecisionInput = {
    kind: 'accept',
    services: acceptedServices.map((service) => draft[service]),
  };

  const updateDecision = (service: ApplicationService, patch: Partial<AcceptedServiceDecision>) => {
    setDraft((current) => {
      const existing = current[service];
      if (existing == null) {
        return current;
      }
      return { ...current, [service]: { ...existing, ...patch } };
    });
  };

  const toggleService = (service: ApplicationService, checked: boolean) => {
    setDraft((current) => {
      if (!checked) {
        const { [service]: _removed, ...rest } = current;
        return rest;
      }
      return { ...current, [service]: createServiceDecision(service) };
    });
    setIssues([]);
  };

  const toggleCommitteeMember = (
    service: ApplicationService,
    memberId: string,
    checked: boolean
  ) => {
    const existing = draft[service];
    if (existing == null) {
      return;
    }
    const next = checked
      ? [...existing.committeeMemberIds, memberId]
      : existing.committeeMemberIds.filter((id) => id !== memberId);
    updateDecision(service, { committeeMemberIds: next });
  };

  /** AC-4 — the single gate. Empty slot rows count as "not provided". */
  const handleAcceptClick = () => {
    const normalized: AcceptDecisionInput = {
      kind: 'accept',
      services: acceptInput.services.map((decision) => ({
        ...decision,
        slots: decision.slots.filter((slot) => slot.trim() !== ''),
      })),
    };
    const found = validateAcceptDecision(normalized);
    setIssues(found);
    if (found.length > 0) {
      errorsRef.current?.focus();
      return;
    }
    setAcceptOpen(true);
  };

  const confirmAccept = () => {
    setAcceptOpen(false);
    onSubmit({
      kind: 'accept',
      services: acceptInput.services.map((decision) => ({
        ...decision,
        slots: decision.slots.filter((slot) => slot.trim() !== ''),
      })),
    });
  };

  const handleRejectConfirm = () => {
    if (rejectReason === '') {
      setRejectError(copy.rejectReasonRequired);
      return;
    }
    const input = { kind: 'reject' as const, reason: rejectReason, reasonOther: rejectOther };
    const found = validateRejectDecision(input);
    if (found.length > 0) {
      setRejectError(copy.rejectReasonOtherError);
      return;
    }
    setRejectError(null);
    setRejectOpen(false);
    onSubmit(input);
  };

  const rejectionOptions: SelectOption[] = REJECTION_REASONS.map((reason) => ({
    value: reason,
    label: content.rejectionReasons[reason],
  }));

  const exemptionOptions: SelectOption[] = EXEMPTION_REASONS.map((reason) => ({
    value: reason,
    label: content.exemptionReasons[reason],
  }));

  return (
    <Panel
      shape="inline"
      title={copy.heading}
      titleId={`${panelId}-heading`}
      description={copy.description}
    >
      {/* AC-1 — the accepted subset. */}
      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>
          <Typography as="span" variant="text-sm" weight="bold">
            {copy.selectServicesHeading}
          </Typography>
        </legend>
        <Typography as="p" variant="text-sm" color="muted" className={styles.hint}>
          {copy.selectServicesHint}
        </Typography>
        <div className={styles.serviceChoices}>
          {services.map((service) => (
            <Checkbox
              key={service}
              label={content.services[service]}
              checked={draft[service] != null}
              onChange={(event) => toggleService(service, event.target.checked)}
            />
          ))}
        </div>
      </fieldset>

      {/* AC-2 — auto-rejection is disclosed before confirming, not after. */}
      {unselectedServices.length > 0 && acceptedServices.length > 0 && (
        <Alert tone="warning" role="status">
          {copy.autoRejectWarning(formatServiceList(unselectedServices, content, locale))}
        </Alert>
      )}

      {/* AC-3 — one complete path per accepted service. */}
      {acceptedServices.map((service) => {
        const decision = draft[service];
        return (
          <section
            key={service}
            className={styles.servicePath}
            aria-label={copy.pathHeading(content.services[service])}
          >
            <Typography as="h3" variant="text-sm" weight="bold">
              {copy.pathHeading(content.services[service])}
            </Typography>

            <RadioGroup
              legend={copy.pathLegend}
              name={`${panelId}-path-${service}`}
              value={decision.path}
              onValueChange={(value) =>
                updateDecision(service, { path: value === 'exemption' ? 'exemption' : 'interview' })
              }
            >
              <Radio value="interview" label={copy.pathInterview} />
              <Radio value="exemption" label={copy.pathExemption} />
            </RadioGroup>

            {decision.path === 'interview' ? (
              <div className={styles.pathBody}>
                {/* Shared with the J-06 staff reschedule — one slots editor. */}
                <InterviewSlotsField
                  slots={decision.slots}
                  idPrefix={`${panelId}-${service}`}
                  copy={{
                    heading: copy.slotsHeading,
                    hint: copy.slotsHint,
                    slotLabel: copy.slotLabel,
                    add: copy.addSlot,
                    remove: copy.removeSlot,
                  }}
                  onChange={(slots) => updateDecision(service, { slots })}
                />

                <fieldset className={styles.fieldset}>
                  <legend className={styles.legend}>
                    <Typography as="span" variant="text-md" weight="bold">
                      {copy.committeeHeading}
                    </Typography>
                  </legend>
                  <Typography as="p" variant="text-sm" color="muted" className={styles.hint}>
                    {copy.committeeHint}
                  </Typography>
                  <div className={styles.committee}>
                    {committeePool.map((member) => (
                      <Checkbox
                        key={member.id}
                        label={member.name}
                        description={member.roleTitle[locale] ?? member.roleTitle.ar}
                        checked={decision.committeeMemberIds.includes(member.id)}
                        onChange={(event) =>
                          toggleCommitteeMember(service, member.id, event.target.checked)
                        }
                      />
                    ))}
                  </div>
                </fieldset>
              </div>
            ) : (
              <div className={styles.pathBody}>
                <Select
                  label={copy.exemptionReasonLabel}
                  placeholder={copy.exemptionReasonPlaceholder}
                  options={exemptionOptions}
                  value={decision.exemptionReason ?? ''}
                  onValueChange={(value) =>
                    updateDecision(service, { exemptionReason: value as ExemptionReasonId })
                  }
                  requiredField
                />
                {decision.exemptionReason === 'other' && (
                  <Textarea
                    label={copy.exemptionOtherLabel}
                    value={decision.exemptionReasonOther}
                    onChange={(event) =>
                      updateDecision(service, { exemptionReasonOther: event.target.value })
                    }
                    requiredField
                    rows={3}
                  />
                )}
              </div>
            )}
          </section>
        );
      })}

      {issues.length > 0 && (
        <div
          ref={errorsRef}
          className={styles.errors}
          role="alert"
          tabIndex={-1}
          aria-labelledby={`${panelId}-errors-heading`}
        >
          <Typography as="h3" id={`${panelId}-errors-heading`} variant="text-md" weight="bold">
            {copy.errorsHeading}
          </Typography>
          <ul className={styles.errorList}>
            {issues.map((issue) => (
              <li key={`${issue.code}-${issue.service ?? 'all'}`}>
                {issueMessage(issue, content)}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className={styles.actions}>
        <Button variant="primary" size="md" onClick={handleAcceptClick} disabled={submitting}>
          {copy.accept}
        </Button>
        <Button
          variant="secondary"
          size="md"
          onClick={() => setRejectOpen(true)}
          disabled={submitting}
        >
          {copy.reject}
        </Button>
      </div>

      {/* Accept confirmation — restates exactly what will happen (AC-2, AC-6). */}
      <Modal
        open={acceptOpen}
        onClose={() => setAcceptOpen(false)}
        title={content.acceptDialog.title}
        dismissLabel={content.acceptDialog.cancel}
        footer={
          <>
            <Button variant="primary" size="md" onClick={confirmAccept}>
              {content.acceptDialog.confirm}
            </Button>
            <Button variant="tertiary" size="md" onClick={() => setAcceptOpen(false)}>
              {content.acceptDialog.cancel}
            </Button>
          </>
        }
      >
        <Typography as="p" variant="text-md">
          {content.acceptDialog.body(formatServiceList(acceptedServices, content, locale))}
        </Typography>
        {unselectedServices.length > 0 && (
          <Typography as="p" variant="text-md">
            {content.acceptDialog.autoRejected(
              formatServiceList(unselectedServices, content, locale)
            )}
          </Typography>
        )}
        {exemptedServices.length > 0 && (
          <Typography as="p" variant="text-md">
            {content.acceptDialog.exempted(formatServiceList(exemptedServices, content, locale))}
          </Typography>
        )}
      </Modal>

      {/* AC-7/AC-8 — whole-application rejection: warning + confirmation + reason. */}
      <Modal
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        title={content.rejectDialog.title}
        dismissLabel={content.rejectDialog.cancel}
        footer={
          <>
            <Button variant="primary" size="md" onClick={handleRejectConfirm}>
              {content.rejectDialog.confirm}
            </Button>
            <Button variant="tertiary" size="md" onClick={() => setRejectOpen(false)}>
              {content.rejectDialog.cancel}
            </Button>
          </>
        }
      >
        <Alert tone="error" role="alert">
          {content.rejectDialog.warning}
        </Alert>
        <div className={styles.dialogField}>
          <Select
            label={content.rejectDialog.reasonLabel}
            placeholder={content.rejectDialog.reasonPlaceholder}
            options={rejectionOptions}
            value={rejectReason}
            onValueChange={(value) => {
              setRejectReason(value as RejectionReasonId);
              setRejectError(null);
            }}
            requiredField
            errorText={rejectReason === '' ? (rejectError ?? undefined) : undefined}
          />
        </div>
        {rejectReason === 'other' && (
          <div className={styles.dialogField}>
            <Textarea
              label={content.rejectDialog.otherLabel}
              value={rejectOther}
              onChange={(event) => {
                setRejectOther(event.target.value);
                setRejectError(null);
              }}
              requiredField
              rows={3}
              errorText={rejectError ?? undefined}
            />
          </div>
        )}
      </Modal>
    </Panel>
  );
}
