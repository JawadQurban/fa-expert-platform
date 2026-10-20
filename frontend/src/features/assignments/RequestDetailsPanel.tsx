import type { Locale } from '@/types';
import { SPECIALIZATION_DOMAIN_OPTIONS } from '../../shared/content/specializationDomains';
import { dateFormatter, numberFormatter } from '../../shared/formatting';
import { localized } from '../../shared/types/localizedText';
import { Panel } from '../../shared/workspace/Panel';
import { DetailRows } from '../engagements/components/PlanDetailsList';
import type { AssignmentRequestDetailDto } from './assignment.types';
import type { AssignmentsContent } from './assignments.content';

/**
 * UAT `BUG-040` — the assignment request in full, on the page where its
 * candidates are matched and decided. The people deciding see what the
 * candidates are for, not only a reference. Labels are the request form's own,
 * so a field reads the same where it was entered and where it is reviewed.
 */
export function RequestDetailsPanel({
  request,
  content,
  locale,
}: {
  readonly request: AssignmentRequestDetailDto;
  readonly content: AssignmentsContent;
  readonly locale: Locale;
}) {
  const form = request.form ?? {};
  const copy = content.form;
  const fields = copy.fields;
  const numbers = numberFormatter(locale);
  const dates = dateFormatter(locale, { dateStyle: 'medium' });
  const option = (labels: Readonly<Record<string, string>>, value: string | undefined) =>
    value == null ? null : (labels[value] ?? value);
  const date = (value: string | undefined) =>
    value == null || value === '' ? null : dates.format(new Date(value));
  const domain = SPECIALIZATION_DOMAIN_OPTIONS.find(
    (candidate) => candidate.value === form.specializationDomain
  );

  const rows: ReadonlyArray<{ readonly term: string; readonly value: string | null }> = [
    { term: content.matching.requestFields.reference, value: request.reference },
    {
      term: copy.centreLabel,
      value: request.centreName == null ? null : localized(request.centreName, locale),
    },
    {
      term: copy.requestTypeLabel,
      value: option(copy.requestTypes, form.requestType),
    },
    { term: copy.serviceTypeLabel, value: copy.services[request.serviceType] },
    { term: copy.responsibleLabel, value: request.responsibleEmployeeName ?? null },
    { term: content.matching.requestFields.createdBy, value: request.createdByName },
    { term: fields.programName, value: form.programName ?? null },
    { term: fields.requiredHeadcount, value: numbers.format(request.requiredHeadcount) },
    {
      term: fields.daysCount,
      value: form.daysCountOther
        ? copy.options.daysOther
        : form.daysCount == null
          ? null
          : numbers.format(form.daysCount),
    },
    { term: fields.dateFrom, value: date(form.dateFrom) },
    { term: fields.dateTo, value: date(form.dateTo) },
    { term: fields.period, value: option(copy.options.periods, form.period) },
    {
      term: fields.deliveryMechanism,
      value: option(copy.options.deliveryModes, form.deliveryMechanism),
    },
    { term: fields.city, value: form.city ?? null },
    { term: fields.trainingLanguage, value: option(copy.options.languages, form.language) },
    { term: fields.traineeLevel, value: option(copy.options.traineeLevels, form.traineeLevel) },
    { term: fields.clientName, value: form.clientName ?? null },
    { term: fields.consultationTopic, value: form.consultationTopic ?? null },
    {
      term: fields.expectedHours,
      value: form.expectedHours == null ? null : numbers.format(form.expectedHours),
    },
    {
      term: fields.consultationType,
      value: option(copy.options.consultationTypes, form.consultationType),
    },
    { term: fields.beneficiary, value: form.beneficiary ?? null },
    {
      term: fields.specializationDomain,
      value:
        domain == null
          ? (form.specializationDomain ?? null)
          : locale === 'en'
            ? domain.labelEn
            : domain.labelAr,
    },
    { term: fields.brochure, value: form.attachmentName ?? null },
    { term: fields.notes, value: form.notes ?? null },
  ];

  return (
    <Panel title={content.matching.requestDetailsHeading} titleId="eh-matching-request">
      <DetailRows rows={rows} />
    </Panel>
  );
}
