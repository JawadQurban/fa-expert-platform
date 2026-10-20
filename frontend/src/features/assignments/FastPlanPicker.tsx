import { useEffect, useState } from 'react';
import { Alert } from '@ds/composite';
import { Button, SearchBox, Select, Typography } from '@ds/primitives';
import type { AssignmentsContent } from './assignments.content';
import {
  getAssignmentService,
  type FastLinkDto,
  type FastPlanOptionDto,
  type FastProgramOptionDto,
} from './assignmentService';
import styles from './NewAssignmentRequestPage.module.css';

/**
 * RUN-030 / BUG-004 — linking a centre request to FAST.
 *
 * - **`plan` mode (forms 1–2):** one of the Academy's approved programmes with
 *   an upcoming plan, then one of its open plans; the plan's data is pulled.
 *   A closed or ended plan is refused here and again by the server. Once the
 *   Training API is configured the plan is mandatory (`P-362`).
 * - **`programme` mode (form 4):** a programme only — no plan — and its name,
 *   trainee level and prospectus are pulled (`P-363`). Optional.
 *
 * When FAST is not configured the section says so and the form stays manual.
 * The picker never writes to FAST.
 */
export function FastPlanPicker({
  copy,
  locale,
  mode,
  linked,
  onLinked,
  onConfigured,
  errorText,
}: {
  readonly copy: AssignmentsContent['form']['fast'];
  readonly locale: 'ar' | 'en';
  readonly mode: 'plan' | 'programme';
  /** What the request is linked to, or `null` for manual entry. */
  readonly linked: FastLinkDto | null;
  readonly onLinked: (link: FastLinkDto | null) => void;
  /** Whether the Training API is configured here (the plan is then mandatory). */
  readonly onConfigured?: (configured: boolean) => void;
  /** The plan field's error (`fast-plan-required`). */
  readonly errorText?: string;
}) {
  const service = getAssignmentService();
  const [query, setQuery] = useState('');
  const [available, setAvailable] = useState(true);
  const [configured, setConfigured] = useState(false);
  const [programmes, setProgrammes] = useState<readonly FastProgramOptionDto[] | null>(null);
  const [programmeId, setProgrammeId] = useState('');
  const [plans, setPlans] = useState<readonly FastPlanOptionDto[] | null>(null);
  const [planId, setPlanId] = useState('');
  const [issue, setIssue] = useState<'closed' | 'failed' | null>(null);
  const planMode = mode === 'plan';

  useEffect(() => {
    let active = true;
    setProgrammes(null);
    void service.listFastProgrammes(query, planMode).then((result) => {
      if (!active) {
        return;
      }
      const value = result.ok ? result.value : { available: false, configured: false, items: [] };
      setAvailable(value.available);
      setConfigured(value.configured);
      onConfigured?.(value.configured);
      setProgrammes(value.items);
    });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, planMode]);

  const chooseProgramme = (next: string) => {
    setProgrammeId(next);
    setPlanId('');
    setPlans(null);
    setIssue(null);
    onLinked(null);
    if (planMode) {
      void service.listFastPlans(next).then((result) => {
        setPlans(result.ok ? result.value : []);
      });
      return;
    }
    void service.getFastProgramme(next).then((result) => {
      if (!result.ok) {
        setIssue('failed');
        return;
      }
      onLinked({
        planId: null,
        programId: result.value.programId,
        label: result.value.code ?? result.value.fields.programName ?? result.value.programId,
        hasProspectus: result.value.hasProspectus,
        fields: result.value.fields,
      });
    });
  };

  const choosePlan = (next: string) => {
    setPlanId(next);
    setIssue(null);
    onLinked(null);
    void service.getFastPlan(next).then((result) => {
      if (!result.ok) {
        setIssue('failed');
      } else if (!result.value.assignable) {
        setIssue('closed');
      } else {
        onLinked({
          planId: result.value.planId,
          programId: result.value.programId ?? programmeId,
          label: result.value.planCode ?? result.value.planId,
          hasProspectus: result.value.hasProspectus,
          fields: result.value.fields,
        });
      }
    });
  };

  const clear = () => {
    setProgrammeId('');
    setPlanId('');
    setPlans(null);
    setIssue(null);
    onLinked(null);
  };

  if (!available && !configured) {
    return (
      <Alert tone="info" surface="tinted" role="note">
        {copy.unavailable}
      </Alert>
    );
  }

  const label = (ar: string, en: string) => (locale === 'en' ? en : ar);

  return (
    <section className={styles.nominees} aria-labelledby="eh-new-assignment-fast">
      <Typography as="h3" id="eh-new-assignment-fast" variant="text-md" weight="bold">
        {planMode ? copy.heading : copy.programmeHeading}
      </Typography>
      <Typography as="p" variant="text-xs" color="muted">
        {planMode ? copy.intro : copy.programmeIntro}
      </Typography>
      {!available && (
        <Alert tone="error" surface="tinted" role="alert">
          {copy.failed}
        </Alert>
      )}
      <div className={styles.fieldGrid}>
        <SearchBox
          label={copy.searchLabel}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <Select
          label={copy.programmeLabel}
          options={(programmes ?? []).map((programme) => ({
            value: programme.programId,
            label:
              programme.code == null
                ? label(programme.nameAr, programme.nameEn)
                : `${programme.code} — ${label(programme.nameAr, programme.nameEn)}`,
          }))}
          value={programmeId === '' ? undefined : programmeId}
          onValueChange={chooseProgramme}
          loading={programmes == null}
          loadingText={copy.loading}
          noOptionsText={copy.noProgrammes}
          requiredField={planMode && configured}
          errorText={programmeId === '' ? errorText : undefined}
        />
        {planMode && programmeId !== '' && (
          <Select
            label={copy.planLabel}
            options={(plans ?? []).map((plan) => ({
              value: plan.planId,
              label: copy.planOption(
                plan.planCode ?? plan.planId,
                plan.startDate ?? '',
                plan.endDate ?? '',
                plan.city == null ? '' : label(plan.city.ar, plan.city.en)
              ),
            }))}
            value={planId === '' ? undefined : planId}
            onValueChange={choosePlan}
            loading={plans == null}
            loadingText={copy.loading}
            noOptionsText={copy.noPlans}
            requiredField={configured}
            errorText={errorText}
          />
        )}
      </div>
      {linked != null && (
        <Alert tone="success" surface="tinted" role="status">
          {planMode ? copy.pulled(linked.label) : copy.programmePulled(linked.label)}
        </Alert>
      )}
      {issue != null && (
        <Alert tone="error" surface="tinted" role="alert">
          {issue === 'closed' ? copy.closed : copy.failed}
        </Alert>
      )}
      {programmeId !== '' && (
        <div className={styles.actions}>
          <Button variant="secondary" size="sm" onClick={clear}>
            {copy.clear}
          </Button>
        </div>
      )}
    </section>
  );
}
