import { useEffect, useState } from 'react';
import { Alert } from '@ds/composite';
import { Button, SearchBox, Select, Typography } from '@ds/primitives';
import type { AssignmentsContent } from './assignments.content';
import {
  getAssignmentService,
  type FastPlanOptionDto,
  type FastPlanPrefillDto,
  type FastProgramOptionDto,
} from './assignmentService';
import styles from './NewAssignmentRequestPage.module.css';

/**
 * RUN-030 / BUG-004 — «الربط بخطة في فاست», on forms 1–2. The centre picks one
 * of the Academy's approved programmes (only those with an upcoming plan),
 * then one of its open plans, and the plan's data is pulled from FAST. A
 * closed or ended plan is refused here and again by the server.
 *
 * When FAST is not available the section says so and the form stays manual,
 * exactly as before. The picker never writes to FAST.
 */
export function FastPlanPicker({
  copy,
  locale,
  linked,
  onLinked,
}: {
  readonly copy: AssignmentsContent['form']['fast'];
  readonly locale: 'ar' | 'en';
  /** The plan the request is linked to, or `null` for manual entry. */
  readonly linked: FastPlanPrefillDto | null;
  readonly onLinked: (prefill: FastPlanPrefillDto | null) => void;
}) {
  const service = getAssignmentService();
  const [query, setQuery] = useState('');
  const [available, setAvailable] = useState(true);
  const [programmes, setProgrammes] = useState<readonly FastProgramOptionDto[] | null>(null);
  const [programmeId, setProgrammeId] = useState('');
  const [plans, setPlans] = useState<readonly FastPlanOptionDto[] | null>(null);
  const [planId, setPlanId] = useState('');
  const [issue, setIssue] = useState<'closed' | 'failed' | null>(null);

  useEffect(() => {
    let active = true;
    setProgrammes(null);
    void service.listFastProgrammes(query).then((result) => {
      if (!active) {
        return;
      }
      const value = result.ok ? result.value : { available: false, items: [] };
      setAvailable(value.available);
      setProgrammes(value.items);
    });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const chooseProgramme = (next: string) => {
    setProgrammeId(next);
    setPlanId('');
    setPlans(null);
    setIssue(null);
    onLinked(null);
    void service.listFastPlans(next).then((result) => {
      setPlans(result.ok ? result.value : []);
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
        onLinked(result.value);
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

  if (!available) {
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
        {copy.heading}
      </Typography>
      <Typography as="p" variant="text-xs" color="muted">
        {copy.intro}
      </Typography>
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
        />
        {programmeId !== '' && (
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
          />
        )}
      </div>
      {linked != null && (
        <Alert tone="success" surface="tinted" role="status">
          {copy.pulled(linked.planCode ?? linked.planId)}
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
