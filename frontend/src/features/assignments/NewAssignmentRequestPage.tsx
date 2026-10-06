import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Card, DatePicker, FileUploader } from '@ds/composite';
import type { UploadedFile } from '@ds/composite';
import { Button, NumberInput, Select, TextInput, Textarea, Typography } from '@ds/primitives';
import { Breadcrumbs } from '@ds/shell';
import { useLocale } from '@i18n/LocaleProvider';
import { expertHubPaths } from '../../app/router/paths';
import type { ExpertHubApiError } from '../../shared/services/apiClient';
import { SPECIALIZATION_DOMAIN_OPTIONS } from '../../shared/content/specializationDomains';
import type { AssignmentRequestSummaryDto } from './assignment.types';
import {
  BROCHURE_FORMATS,
  CENTRE_REQUEST_TYPES,
  CONSULTATION_TYPES,
  LANGUAGES,
  MAX_LISTED_DAYS,
  PERIODS,
  TRAINEE_LEVELS,
  brochureFileIssue,
  clientRequired,
  deliveryModesFor,
  formFor,
  hasClientField,
  isProgramLike,
  nomineesOf,
  serviceTypeFor,
  validateCentreRequest,
  type CentreRequestType,
  type CentreRequestValidationCode,
  type CreateCentreRequestInput,
} from './centreRequestForm.types';
import {
  getAssignmentService,
  type RequestLookupOptionDto,
  type UploadedAttachmentDto,
} from './assignmentService';
import { getAssignmentsContent } from './assignments.content';
import { WorkspacePage } from '../../shared/workspace/WorkspacePage';
import { PageHead } from '../../shared/workspace/PageHead';
import { Panel } from '../../shared/workspace/Panel';
import styles from './NewAssignmentRequestPage.module.css';
import { numberFormatter } from '../../shared/formatting';

/**
 * EH-INT-09 — the centre request form, per Notion «Assignment Matrix»:
 *
 * - **الخيارات الرئيسية first**: centre, request type, requester.
 * - **The request type opens its form** — ten types, six forms, each with its
 *   own fields, labels, order, mandatory fields and option lists
 *   (`centreRequestForm.types.ts`, mirrored from the API's matrix).
 * - **The centre enters the data by hand** — the matrix's FAST auto-fill needs
 *   a FAST read that does not exist. Nothing here creates a programme or plan
 *   in FAST (J-16/F2/AC-3), and the page says so.
 *
 * - **The headcount is real** — the request says how many experts it needs, and
 *   the centre may name up to that many (one card per named expert). Each named
 *   expert fills one slot; the rest go to J-17 matching. Naming nobody is still
 *   valid and still goes to matching, exactly as before.
 *
 * The served lookups (centre / requester / named person) come from the API.
 *
 * The brochure is **uploaded when chosen** (`POST internal/attachments`) and the
 * request carries the stored document's id — never a file name on its own.
 */

type Phase = 'form' | 'submitted';

/** «عدد الأيام» — 1…8 and «أخرى». */
const DAYS_OTHER = 'other';

function toIsoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function parseIsoDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return match == null ? null : new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

export default function NewAssignmentRequestPage() {
  const { locale } = useLocale();
  const content = useMemo(() => getAssignmentsContent(locale), [locale]);
  const copy = content.form;
  const service = getAssignmentService();

  const [phase, setPhase] = useState<Phase>('form');
  const [centres, setCentres] = useState<readonly RequestLookupOptionDto[]>([]);
  const [employees, setEmployees] = useState<readonly RequestLookupOptionDto[]>([]);
  const [nominees, setNominees] = useState<readonly RequestLookupOptionDto[]>([]);

  const [centreId, setCentreId] = useState('');
  const [requestType, setRequestType] = useState<CentreRequestType | ''>('');
  const [responsible, setResponsible] = useState('');
  const [values, setValues] = useState<Record<string, string>>({});
  /** «العدد المطلوب» — 1 when the field is cleared (the model's default). */
  const [headcount, setHeadcount] = useState<number | undefined>(1);
  /**
   * One picker row per named expert. `''` is a row opened but not yet chosen,
   * so the card count and the list of named ids are not the same thing.
   */
  const [nomineeRows, setNomineeRows] = useState<readonly string[]>([]);
  /** What the uploader shows, and — once stored — what the server returned. */
  const [brochureFile, setBrochureFile] = useState<UploadedFile | null>(null);
  const [brochure, setBrochure] = useState<UploadedAttachmentDto | null>(null);
  /** Each choice supersedes the last; a late answer for an older one is dropped. */
  const uploadAttempt = useRef(0);
  const [issues, setIssues] = useState<readonly CentreRequestValidationCode[]>([]);
  const [busy, setBusy] = useState(false);
  const [submitFailed, setSubmitFailed] = useState(false);
  /** The server's own verdict on the named experts — the authoritative backstop. */
  const [nomineeRefusal, setNomineeRefusal] = useState<string | null>(null);
  const [created, setCreated] = useState<AssignmentRequestSummaryDto | null>(null);

  /* Focus follows the row that was added, or what is left after a removal. */
  const nomineeRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const addNomineeRef = useRef<HTMLButtonElement>(null);
  const nomineeFocus = useRef<number | 'add' | null>(null);

  useEffect(() => {
    document.title = copy.documentTitle;
  }, [copy.documentTitle]);

  useEffect(() => {
    document.getElementById('eh-new-assignment-title')?.focus();
  }, []);

  useEffect(() => {
    const target = nomineeFocus.current;
    if (target == null) {
      return;
    }
    nomineeFocus.current = null;
    (target === 'add' ? addNomineeRef.current : nomineeRefs.current[target])?.focus();
  }, [nomineeRows]);

  useEffect(() => {
    let active = true;
    void Promise.all([service.listCentres(), service.listResponsibleEmployees()]).then(
      ([centreResult, employeeResult]) => {
        if (!active) {
          return;
        }
        if (centreResult.ok) {
          setCentres(centreResult.value);
        }
        if (employeeResult.ok) {
          setEmployees(employeeResult.value);
        }
      }
    );
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = (key: string, value: string) =>
    setValues((current) => ({ ...current, [key]: value }));

  const lookupLabel = (option: RequestLookupOptionDto) =>
    locale === 'en' ? option.labelEn : option.labelAr;

  const form = requestType === '' ? null : formFor(requestType);
  const requestService = requestType === '' ? null : serviceTypeFor(requestType);

  // J-16/F5/AC-1 — the named-person list is the people approved for THIS
  // request's service, so it follows the request type.
  useEffect(() => {
    if (requestService == null) {
      setNominees([]);
      return undefined;
    }
    let active = true;
    void service.listNomineeOptions(requestService).then((result) => {
      if (active) {
        const options = result.ok ? result.value : [];
        setNominees(options);
        // A name that is not approved for the new service is no longer a
        // choice; the row it sat in stays, empty, for another pick.
        setNomineeRows((rows) =>
          rows.map((id) => (options.some((option) => option.value === id) ? id : ''))
        );
      }
    });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestService]);
  /* The named experts, ignoring rows still waiting for a pick. */
  const namedNominees = nomineesOf({ specificNominees: nomineeRows });
  const requiredHeadcount = headcount ?? 1;
  const atNomineeLimit = nomineeRows.length >= requiredHeadcount;

  const setNominee = (index: number, value: string) => {
    setNomineeRows((rows) => rows.map((id, position) => (position === index ? value : id)));
    setNomineeRefusal(null);
  };

  const addNominee = () => {
    nomineeFocus.current = nomineeRows.length;
    setNomineeRows((rows) => [...rows, '']);
  };

  const removeNominee = (index: number) => {
    // Land on the row that takes this one's place, or on «+ إضافة خبير» when
    // the list empties — never on nothing.
    nomineeFocus.current = nomineeRows.length > 1 ? Math.max(0, index - 1) : 'add';
    setNomineeRows((rows) => rows.filter((_id, position) => position !== index));
    setNomineeRefusal(null);
  };

  const programLike = requestType !== '' && isProgramLike(requestType);
  const consultation = form === 'consultation';
  const withClient = requestType !== '' && hasClientField(requestType);
  const digits = numberFormatter(locale);

  /* Each form's own wording (Notion «Assignment Matrix»). */
  const contentForm = form === 'content-development' || form === 'question-writing';
  const nameLabel =
    form === 'event'
      ? copy.fields.eventName
      : form === 'content-development'
        ? copy.fields.contentTitle
        : form === 'question-writing'
          ? copy.fields.testName
          : copy.fields.programName;
  const [dateFromLabel, dateToLabel] = consultation
    ? [copy.fields.consultationDateFrom, copy.fields.consultationDateTo]
    : contentForm
      ? [copy.fields.requiredDateFrom, copy.fields.requiredDateTo]
      : [copy.fields.dateFrom, copy.fields.dateTo];
  const languageLabel = consultation
    ? copy.fields.consultationLanguage
    : contentForm
      ? copy.fields.contentLanguage
      : copy.fields.trainingLanguage;
  const nomineeLabel = consultation
    ? copy.fields.specificConsultant
    : contentForm
      ? copy.fields.specificPerson
      : copy.fields.specificNominee;
  const attachmentLabel = consultation
    ? copy.fields.attachments
    : contentForm
      ? copy.fields.briefBrochure
      : copy.fields.brochure;

  const buildInput = (): Partial<CreateCentreRequestInput> => ({
    centreId,
    requestType: requestType === '' ? undefined : requestType,
    responsibleEmployee: responsible,
    programName: values.programName,
    daysCount:
      values.daysCount == null || values.daysCount === '' || values.daysCount === DAYS_OTHER
        ? undefined
        : Number(values.daysCount),
    daysCountOther: values.daysCount === DAYS_OTHER ? true : undefined,
    dateFrom: values.dateFrom,
    dateTo: values.dateTo,
    period: values.period,
    deliveryMechanism: values.deliveryMechanism,
    city: values.city,
    language: values.language,
    traineeLevel: values.traineeLevel,
    clientName: values.clientName,
    requiredHeadcount: headcount ?? 1,
    specificNominees: namedNominees,
    consultationTopic: values.consultationTopic,
    expectedHours:
      values.expectedHours == null || values.expectedHours === ''
        ? undefined
        : Number(values.expectedHours),
    consultationType: values.consultationType,
    beneficiary: values.beneficiary,
    specializationDomain: values.specializationDomain,
    attachmentId: brochure?.attachmentId ?? null,
    attachmentName: brochure?.fileName ?? null,
    notes: values.notes,
  });

  const uploadErrorFor = (error: ExpertHubApiError) =>
    error.status === 422
      ? copy.upload.refused
      : error.status === 403
        ? copy.upload.forbidden
        : error.status === 400
          ? copy.upload.empty
          : copy.upload.failed;

  const selectBrochure = (files: File[]) => {
    const file = files[0];
    if (file == null) {
      return;
    }
    uploadAttempt.current += 1;
    const attempt = uploadAttempt.current;
    const id = `brochure-${attempt}`;
    setBrochure(null);
    const issue = brochureFileIssue(file);
    if (issue != null) {
      setBrochureFile({
        id,
        name: file.name,
        status: 'error',
        errorMessage: issue === 'format' ? copy.upload.formatError : copy.upload.sizeError,
      });
      return;
    }
    setBrochureFile({ id, name: file.name, status: 'uploading' });
    void service.uploadBrochure(file).then((result) => {
      if (attempt !== uploadAttempt.current) {
        return;
      }
      if (result.ok) {
        setBrochure(result.value);
        setBrochureFile({ id, name: result.value.fileName, status: 'success' });
      } else {
        setBrochureFile({
          id,
          name: file.name,
          status: 'error',
          errorMessage: uploadErrorFor(result.error),
        });
      }
    });
  };

  const removeBrochure = () => {
    uploadAttempt.current += 1;
    setBrochure(null);
    setBrochureFile(null);
  };

  /**
   * The RFC7807 `detail` codes the API answers with about the named experts.
   * `extensions.fields` / `extensions.trainerId` are not reachable here — the
   * shared api client keeps only `detail` — so the message is shown against
   * the expert block as a whole, not against one card.
   */
  const nomineeRefusalFor = (detail: string): string | undefined =>
    detail === 'nominee-not-eligible'
      ? copy.nomineeNotEligible
      : detail === 'duplicate-nominee'
        ? copy.errors['duplicate-nominee']
        : detail === 'nominees-exceed-headcount'
          ? copy.errors['nominees-exceed-headcount']
          : undefined;

  const submit = () => {
    const input = buildInput();
    const found = validateCentreRequest(input);
    setIssues(found);
    if (found.length > 0) {
      return;
    }
    setBusy(true);
    setSubmitFailed(false);
    setNomineeRefusal(null);
    void service.createRequest(input as CreateCentreRequestInput).then((result) => {
      setBusy(false);
      if (result.ok) {
        setCreated(result.value);
        setPhase('submitted');
      } else if (nomineeRefusalFor(result.error.message) != null) {
        // The server is the authority on the named experts, even where the
        // page already refuses the same thing.
        setNomineeRefusal(result.error.message);
      } else {
        setSubmitFailed(true);
      }
    });
  };

  const errorFor = (code: CentreRequestValidationCode) =>
    issues.includes(code) ? copy.errors[code] : undefined;

  const dateField = (key: 'dateFrom' | 'dateTo', label: string) => (
    <DatePicker
      label={label}
      value={values[key] == null || values[key] === '' ? null : parseIsoDate(values[key])}
      onChange={(date) => set(key, toIsoDate(date))}
      locale={locale}
      requiredField
      errorText={errorFor('dates-required')}
      placeholder={locale === 'en' ? 'Select a date' : 'اختر تاريخًا'}
      todayLabel={locale === 'en' ? 'Today' : 'اليوم'}
      previousMonthLabel={locale === 'en' ? 'Previous month' : 'الشهر السابق'}
      nextMonthLabel={locale === 'en' ? 'Next month' : 'الشهر التالي'}
      yearDropdownLabel={locale === 'en' ? 'Select year' : 'اختر السنة'}
    />
  );

  const selectField = (
    key: string,
    label: string,
    options: readonly { readonly value: string; readonly label: string }[],
    code: CentreRequestValidationCode
  ) => (
    <Select
      label={label}
      options={[...options]}
      value={values[key] == null || values[key] === '' ? undefined : values[key]}
      onValueChange={(next) => set(key, next)}
      requiredField
      errorText={errorFor(code)}
    />
  );

  const optionsOf = <T extends string>(
    keys: readonly T[],
    labels: Readonly<Record<T, string>>
  ): readonly { readonly value: string; readonly label: string }[] =>
    keys.map((key) => ({ value: key, label: labels[key] }));

  const deliveryModeOptions =
    requestType === '' ? [] : optionsOf(deliveryModesFor(requestType), copy.options.deliveryModes);
  const languageField = selectField(
    'language',
    languageLabel,
    optionsOf(LANGUAGES, copy.options.languages),
    'language-required'
  );
  const locationField = (
    <TextInput
      label={copy.fields.city}
      helperText={copy.cityHint}
      value={values.city ?? ''}
      onChange={(event) => set('city', event.target.value)}
      requiredField
      errorText={errorFor('city-required')}
    />
  );

  /* ── submitted ─────────────────────────────────────────────────────────── */
  if (phase === 'submitted' && created != null) {
    return (
      <WorkspacePage labelledBy="eh-new-assignment-title">
        <PageHead titleId="eh-new-assignment-title" title={copy.successTitle} />
        <Panel>
          <Alert tone="success" surface="tinted" role="status">
            {copy.successBody(created.reference)}
          </Alert>
          <Typography as="p" variant="text-md">
            {copy.successNext}
          </Typography>
          <div className={styles.actions}>
            <Button variant="primary" size="md" href={expertHubPaths.internalAssignments}>
              {copy.backToList}
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={() => {
                setPhase('form');
                setCentreId('');
                setRequestType('');
                setResponsible('');
                setValues({});
                setHeadcount(1);
                setNomineeRows([]);
                setNomineeRefusal(null);
                removeBrochure();
                setCreated(null);
                setIssues([]);
              }}
            >
              {copy.createAnother}
            </Button>
          </div>
        </Panel>
      </WorkspacePage>
    );
  }

  return (
    <WorkspacePage labelledBy="eh-new-assignment-title">
      <Breadcrumbs
        items={[
          { label: copy.breadcrumbList, href: expertHubPaths.internalAssignments },
          { label: copy.title },
        ]}
        label={copy.breadcrumbLabel}
      />

      <PageHead titleId="eh-new-assignment-title" title={copy.title} lead={copy.intro} />

      {/* — الخيارات الرئيسية — */}
      <Panel shape="inline" title={copy.mainHeading} titleId="eh-new-assignment-main">
        <div className={styles.fieldGrid}>
          <Select
            label={copy.centreLabel}
            options={centres.map((option) => ({ value: option.value, label: lookupLabel(option) }))}
            value={centreId === '' ? undefined : centreId}
            onValueChange={setCentreId}
            requiredField
            errorText={errorFor('centre-required')}
          />
          <Select
            label={copy.requestTypeLabel}
            options={CENTRE_REQUEST_TYPES.map((type) => ({
              value: type,
              label: copy.requestTypes[type],
            }))}
            value={requestType === '' ? undefined : requestType}
            onValueChange={(next) => {
              setRequestType(next as CentreRequestType);
              setIssues([]);
            }}
            requiredField
            errorText={errorFor('request-type-required')}
          />
          <Select
            label={copy.responsibleLabel}
            helperText={copy.responsibleHint}
            options={employees.map((option) => ({
              value: option.value,
              label: lookupLabel(option),
            }))}
            value={responsible === '' ? undefined : responsible}
            onValueChange={setResponsible}
            requiredField
            errorText={errorFor('responsible-required')}
          />
        </div>
      </Panel>

      {requestType !== '' && (
        <>
          {/* — بيانات البرنامج التدريبي — the type's own field set. */}
          <Panel shape="inline" title={copy.detailsHeading} titleId="eh-new-assignment-details">
            {/* F2/AC-3 survives the redesign, and the page still says so. */}
            <Alert tone="info" surface="tinted" role="note">
              {copy.noCreateNote}
            </Alert>

            {/* The form's fields, in the matrix's order, up to the attachment. */}
            <div className={styles.fieldGrid}>
              {programLike && (
                <>
                  <TextInput
                    label={nameLabel}
                    value={values.programName ?? ''}
                    onChange={(event) => set('programName', event.target.value)}
                    requiredField
                    errorText={errorFor('program-name-required')}
                  />
                  {selectField(
                    'daysCount',
                    copy.fields.daysCount,
                    [
                      ...Array.from({ length: MAX_LISTED_DAYS }, (_value, index) => ({
                        value: String(index + 1),
                        label: digits.format(index + 1),
                      })),
                      { value: DAYS_OTHER, label: copy.options.daysOther },
                    ],
                    'days-invalid'
                  )}
                  {dateField('dateFrom', dateFromLabel)}
                  {dateField('dateTo', dateToLabel)}
                  {selectField(
                    'period',
                    copy.fields.period,
                    optionsOf(PERIODS, copy.options.periods),
                    'period-required'
                  )}
                  {selectField(
                    'deliveryMechanism',
                    copy.fields.deliveryMechanism,
                    deliveryModeOptions,
                    'mechanism-required'
                  )}
                  {locationField}
                  {languageField}
                  {selectField(
                    'traineeLevel',
                    copy.fields.traineeLevel,
                    optionsOf(TRAINEE_LEVELS, copy.options.traineeLevels),
                    'trainee-level-required'
                  )}
                  {withClient && (
                    <TextInput
                      label={contentForm ? copy.fields.clientNameShort : copy.fields.clientName}
                      helperText={clientRequired(requestType) ? undefined : copy.optionalHint}
                      value={values.clientName ?? ''}
                      onChange={(event) => set('clientName', event.target.value)}
                      requiredField={clientRequired(requestType)}
                      errorText={errorFor('client-required')}
                    />
                  )}
                </>
              )}

              {consultation && (
                <>
                  <TextInput
                    label={copy.fields.consultationTopic}
                    value={values.consultationTopic ?? ''}
                    onChange={(event) => set('consultationTopic', event.target.value)}
                    requiredField
                    errorText={errorFor('topic-required')}
                  />
                  <NumberInput
                    label={copy.fields.expectedHours}
                    helperText={`${copy.optionalHint} ${copy.hoursHint}`}
                    value={
                      values.expectedHours === '' || values.expectedHours == null
                        ? undefined
                        : Number(values.expectedHours)
                    }
                    onValueChange={(next) => set('expectedHours', next == null ? '' : String(next))}
                    min={1}
                    errorText={errorFor('hours-invalid')}
                  />
                  {dateField('dateFrom', dateFromLabel)}
                  {dateField('dateTo', dateToLabel)}
                  {selectField(
                    'deliveryMechanism',
                    copy.fields.deliveryMechanism,
                    deliveryModeOptions,
                    'mechanism-required'
                  )}
                  {locationField}
                  {languageField}
                  {selectField(
                    'consultationType',
                    copy.fields.consultationType,
                    optionsOf(CONSULTATION_TYPES, copy.options.consultationTypes),
                    'consultation-type-required'
                  )}
                  <TextInput
                    label={copy.fields.beneficiary}
                    helperText={copy.optionalHint}
                    value={values.beneficiary ?? ''}
                    onChange={(event) => set('beneficiary', event.target.value)}
                  />
                </>
              )}
            </div>

            {/* «النشرة التعريفية» (forms 1–5) / «المرفقات» (form 6) — mandatory. */}
            <FileUploader
              label={attachmentLabel}
              hint={copy.upload.hint}
              accept={BROCHURE_FORMATS.map((format) => `.${format}`).join(',')}
              requiredField
              files={brochureFile == null ? [] : [brochureFile]}
              onFilesSelected={selectBrochure}
              onRemove={removeBrochure}
              browseLabel={copy.upload.browseLabel}
              removeLabel={copy.upload.removeLabel}
            />
            {errorFor('attachment-required') != null && (
              <Alert tone="error" surface="tinted" role="alert">
                {errorFor('attachment-required')}
              </Alert>
            )}

            <div className={styles.fieldGrid}>
              {/* «مجال التخصص» — the existing 147-value list (Notion's
                    Sector → Job Family cascade needs the FAST lookup). */}
              <Select
                label={copy.fields.specializationDomain}
                options={SPECIALIZATION_DOMAIN_OPTIONS.map((option) => ({
                  value: option.value,
                  label: locale === 'en' ? option.labelEn : option.labelAr,
                }))}
                value={
                  values.specializationDomain == null || values.specializationDomain === ''
                    ? undefined
                    : values.specializationDomain
                }
                onValueChange={(next) => set('specializationDomain', next)}
                requiredField
                errorText={errorFor('domain-required')}
              />

              {/* J-16/F4 — the request's real headcount. No approved maximum. */}
              <NumberInput
                label={copy.fields.requiredHeadcount}
                helperText={copy.headcountHint}
                value={headcount}
                onValueChange={setHeadcount}
                min={1}
                requiredField
                errorText={errorFor('headcount-invalid')}
                incrementLabel={locale === 'en' ? 'Increase' : 'زيادة'}
                decrementLabel={locale === 'en' ? 'Decrease' : 'إنقاص'}
              />
            </div>

            {/* «إضافة خبراء محددين» — optional, up to the headcount. Each named
                  expert takes one slot; the rest go to J-17 matching. */}
            <section className={styles.nominees} aria-labelledby="eh-new-assignment-nominees">
              <Typography as="h3" id="eh-new-assignment-nominees" variant="text-md" weight="bold">
                {nomineeLabel}
              </Typography>
              <Typography as="p" variant="text-xs" color="muted">
                {`${copy.optionalHint} ${copy.nomineeHint}`}
              </Typography>
              <Typography as="p" role="status" variant="text-xs" color="muted">
                {copy.nomineeCount(namedNominees.length, requiredHeadcount)}
              </Typography>

              {nomineeRows.length > 0 && (
                <ul className={styles.nomineeList}>
                  {nomineeRows.map((id, index) => {
                    const chosen = nominees.find((option) => option.value === id);
                    return (
                      <li key={index}>
                        <Card
                          as="div"
                          effect="stroke"
                          role="group"
                          aria-label={copy.nomineeSlot(index + 1)}
                          className={styles.nomineeCard}
                          title={chosen == null ? undefined : lookupLabel(chosen)}
                          description={
                            chosen == null ? undefined : copy.nomineeReference(chosen.value)
                          }
                        >
                          <Select
                            label={copy.nomineeSlot(index + 1)}
                            /* Duplicate prevention: a name taken by another
                                 row is not offered again here. */
                            options={nominees
                              .filter(
                                (option) =>
                                  option.value === id || !nomineeRows.includes(option.value)
                              )
                              .map((option) => ({
                                value: option.value,
                                label: lookupLabel(option),
                              }))}
                            value={id === '' ? undefined : id}
                            onValueChange={(next) => setNominee(index, next)}
                            ref={(node) => {
                              nomineeRefs.current[index] = node;
                            }}
                          />
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => removeNominee(index)}
                          >
                            {copy.nomineeRemove(index + 1)}
                          </Button>
                        </Card>
                      </li>
                    );
                  })}
                </ul>
              )}

              <div className={styles.actions}>
                <Button
                  variant="secondary"
                  size="md"
                  ref={addNomineeRef}
                  disabled={atNomineeLimit}
                  onClick={addNominee}
                >
                  {copy.addNominee}
                </Button>
              </div>
              {atNomineeLimit && (
                <Typography as="p" variant="text-xs" color="muted">
                  {copy.nomineeLimit(requiredHeadcount)}
                </Typography>
              )}
              {(errorFor('nominees-exceed-headcount') != null ||
                errorFor('duplicate-nominee') != null ||
                nomineeRefusal != null) && (
                <Alert tone="error" surface="tinted" role="alert">
                  {nomineeRefusal != null
                    ? nomineeRefusalFor(nomineeRefusal)
                    : (errorFor('duplicate-nominee') ?? errorFor('nominees-exceed-headcount'))}
                </Alert>
              )}
            </section>

            {/* «ملاحظات» */}
            <Textarea
              label={copy.fields.notes}
              placeholder={copy.notesPlaceholder}
              value={values.notes ?? ''}
              onChange={(event) => set('notes', event.target.value)}
            />
          </Panel>

          {submitFailed && (
            <Alert tone="error" surface="tinted" role="alert">
              {content.errors.submitFailed}
            </Alert>
          )}

          <div className={styles.actions}>
            <Button
              variant="primary"
              size="md"
              disabled={busy || brochureFile?.status === 'uploading'}
              onClick={submit}
            >
              {copy.submit}
            </Button>
          </div>
        </>
      )}
    </WorkspacePage>
  );
}
