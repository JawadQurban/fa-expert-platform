import { useId, useMemo, useRef, useState } from 'react';
import { Alert, Modal } from '@ds/composite';
import { Button, Select, Textarea, Typography } from '@ds/primitives';
import type { SelectOption } from '@ds/primitives';
import type { Locale } from '@/types';
import { localized } from '../../../shared/types/localizedText';
import type { ApplicationService } from '../../applications/application.types';
import type { InterviewsContent } from '../interviews.content';
import {
  INTERVIEW_RECOMMENDATIONS,
  createServiceEvaluation,
  validateEvaluation,
} from '../interview.types';
import type {
  EvaluationValidationIssue,
  InterviewEvaluationInput,
  InterviewModelDto,
  InterviewRecommendation,
  ServiceEvaluationInput,
} from '../interview.types';
import { Panel } from '../../../shared/workspace/Panel';
import styles from './InterviewEvaluationForm.module.css';
import { numberFormatter } from '../../../shared/formatting';

/**
 * J-07/F1 — one committee member's **independent** evaluation. Three journey
 * rules shape this component:
 *
 * - **Per service, scored independently** (AC-2): one block per accepted
 *   service, each with its own axis scores, recommendation and notes. There is
 *   no combined field anywhere in the form.
 * - **Axes come from the model, not from code** (`BR-0203`, `DM-GAP-03` open):
 *   the form renders whatever `model.axes` it is handed — adding or reweighting
 *   an axis is a configuration change, not a code change.
 * - **"Did not attend" is a first-class alternative** (AC-3), not an empty
 *   submission: it is a separate confirmed action that records non-attendance,
 *   and the confirmation states plainly that the entry is excluded from the
 *   average rather than counted as zero.
 *
 * Evaluations are independent — submitting creates no per-member approval
 * workflow (AC-4); the page simply re-reads the refreshed committee state.
 */
function issueMessage(
  issue: EvaluationValidationIssue,
  model: InterviewModelDto,
  content: InterviewsContent,
  locale: Locale
): string {
  const axis = model.axes.find((candidate) => candidate.id === issue.axisId);
  const axisLabel = axis == null ? '' : localized(axis.label, locale);
  return content.evaluation.errors['axis-score-missing'](axisLabel);
}

export function InterviewEvaluationForm({
  services,
  model,
  content,
  locale,
  submitting,
  onSubmit,
}: {
  readonly services: readonly ApplicationService[];
  readonly model: InterviewModelDto;
  readonly content: InterviewsContent;
  readonly locale: Locale;
  readonly submitting: boolean;
  readonly onSubmit: (input: InterviewEvaluationInput) => void;
}) {
  const copy = content.evaluation;
  const formId = useId();
  const errorsRef = useRef<HTMLDivElement>(null);

  const [draft, setDraft] = useState<readonly ServiceEvaluationInput[]>(() =>
    services.map((service) => createServiceEvaluation(service, model))
  );
  const [issues, setIssues] = useState<readonly EvaluationValidationIssue[]>([]);
  const [absenceOpen, setAbsenceOpen] = useState(false);

  const recommendationOptions: SelectOption[] = useMemo(
    () =>
      INTERVIEW_RECOMMENDATIONS.map((recommendation) => ({
        value: recommendation,
        label: copy.recommendations[recommendation],
      })),
    [copy.recommendations]
  );

  const updateService = (service: ApplicationService, patch: Partial<ServiceEvaluationInput>) => {
    setDraft((current) =>
      current.map((entry) => (entry.service === service ? { ...entry, ...patch } : entry))
    );
  };

  const setAxisScore = (service: ApplicationService, axisId: string, value: string) => {
    setDraft((current) =>
      current.map((entry) =>
        entry.service !== service
          ? entry
          : {
              ...entry,
              axisScores: entry.axisScores.map((score) =>
                score.axisId === axisId
                  ? { ...score, score: value === '' ? null : Number(value) }
                  : score
              ),
            }
      )
    );
  };

  const handleSubmit = () => {
    const input: InterviewEvaluationInput = { kind: 'evaluation', services: draft };
    const found = validateEvaluation(input, model);
    setIssues(found);
    if (found.length > 0) {
      errorsRef.current?.focus();
      return;
    }
    onSubmit(input);
  };

  return (
    <Panel
      shape="inline"
      title={copy.heading}
      titleId={`${formId}-heading`}
      description={copy.description}
    >
      <Typography as="p" variant="text-xs" color="muted">
        {copy.perServiceNote}
      </Typography>

      {draft.map((entry) => (
        <section
          key={entry.service}
          className={styles.service}
          aria-label={copy.serviceHeading(content.services[entry.service])}
        >
          <Typography as="h3" variant="text-sm" weight="bold">
            {copy.serviceHeading(content.services[entry.service])}
          </Typography>

          <div className={styles.axes}>
            {model.axes.map((axis) => {
              const current = entry.axisScores.find((score) => score.axisId === axis.id);
              const digits = numberFormatter(locale);
              // The model's named levels when it defines them (approved model:
              // 1 Very Poor … 5 Excellent); plain 1…max digits otherwise.
              const options: SelectOption[] =
                model.ratingScale != null && model.ratingScale.length > 0
                  ? model.ratingScale.map((level) => ({
                      value: String(level.score),
                      label: copy.ratingOption(
                        digits.format(level.score),
                        localized(level.label, locale)
                      ),
                    }))
                  : Array.from({ length: axis.maxScore }, (_value, index) => ({
                      value: String(index + 1),
                      label: digits.format(index + 1),
                    }));
              return (
                <div key={axis.id} className={styles.axis}>
                  <Select
                    label={copy.axisScoreLabel(localized(axis.label, locale))}
                    placeholder={copy.scorePlaceholder}
                    helperText={
                      axis.description == null
                        ? copy.weightLabel(String(axis.weight))
                        : `${localized(axis.description, locale)} · ${copy.weightLabel(String(axis.weight))}`
                    }
                    options={options}
                    value={current?.score == null ? '' : String(current.score)}
                    onValueChange={(value) => setAxisScore(entry.service, axis.id, value)}
                    requiredField
                  />
                </div>
              );
            })}
          </div>

          <Select
            label={copy.recommendationLabel}
            placeholder={copy.recommendationPlaceholder}
            options={recommendationOptions}
            value={entry.recommendation ?? ''}
            onValueChange={(value) =>
              updateService(entry.service, {
                recommendation: value as InterviewRecommendation,
              })
            }
            helperText={copy.recommendationHint}
          />

          <Textarea
            label={copy.notesLabel}
            helperText={copy.notesHint}
            value={entry.notes}
            onChange={(event) => updateService(entry.service, { notes: event.target.value })}
            rows={3}
          />
        </section>
      ))}

      {issues.length > 0 && (
        <div
          ref={errorsRef}
          className={styles.errors}
          role="alert"
          tabIndex={-1}
          aria-labelledby={`${formId}-errors-heading`}
        >
          <Typography as="h3" id={`${formId}-errors-heading`} variant="text-md" weight="bold">
            {copy.errorsHeading}
          </Typography>
          <ul className={styles.errorList}>
            {issues.map((issue) => (
              <li key={`${issue.service}-${issue.code}-${issue.axisId ?? 'none'}`}>
                {issueMessage(issue, model, content, locale)}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className={styles.actions}>
        <Button variant="primary" size="md" onClick={handleSubmit} disabled={submitting}>
          {copy.submit}
        </Button>
        {/* AC-3 — a real alternative to scoring, not an empty submission. */}
        <Button
          variant="secondary"
          size="md"
          onClick={() => setAbsenceOpen(true)}
          disabled={submitting}
        >
          {copy.didNotAttend}
        </Button>
      </div>
      <Typography as="p" variant="text-sm" color="muted">
        {copy.didNotAttendHint}
      </Typography>

      <Typography as="p" variant="text-xs" color="muted">
        {copy.modelVersion(model.version)}
      </Typography>

      <Modal
        open={absenceOpen}
        onClose={() => setAbsenceOpen(false)}
        title={content.didNotAttendDialog.title}
        dismissLabel={content.didNotAttendDialog.cancel}
        footer={
          <>
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                setAbsenceOpen(false);
                onSubmit({ kind: 'did-not-attend' });
              }}
            >
              {content.didNotAttendDialog.confirm}
            </Button>
            <Button variant="tertiary" size="md" onClick={() => setAbsenceOpen(false)}>
              {content.didNotAttendDialog.cancel}
            </Button>
          </>
        }
      >
        <Alert tone="info" role="status">
          {content.didNotAttendDialog.body}
        </Alert>
      </Modal>
    </Panel>
  );
}
