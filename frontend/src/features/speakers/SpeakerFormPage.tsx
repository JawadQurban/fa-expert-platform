import { useEffect, useMemo, useRef, useState } from 'react';
import { useBlocker, useNavigate, useParams } from 'react-router-dom';
import { Alert, FileUploader, Loading, Modal } from '@ds/composite';
import type { UploadedFile } from '@ds/composite';
import { Avatar, Button, TextInput, Textarea, Typography } from '@ds/primitives';
import { Breadcrumbs } from '@ds/shell';
import { useLocale } from '@i18n/LocaleProvider';
import { expertHubPaths } from '../../app/router/paths';
import { apiUrl } from '../../shared/services/apiClient';
import type { ExpertHubApiError } from '../../shared/services/apiClient';
import { describeLoadFailure } from '../../shared/errors/loadFailure';
import { formatNumber } from '../../shared/formatting';
import { PageLoadError } from '../../shared/components/PageLoadError';
import { WorkspacePage } from '../../shared/workspace/WorkspacePage';
import { PageHead } from '../../shared/workspace/PageHead';
import { Panel } from '../../shared/workspace/Panel';
import {
  ApplicationErrorSummary,
  type ErrorSummaryItem,
} from '../applications/components/ApplicationErrorSummary';
import { focusFieldTarget } from '../applications/focusField';
import {
  EMPTY_SPEAKER_FORM,
  REQUIRED_SPEAKER_FIELDS,
  SPEAKER_PHOTO_FORMATS,
  parseSpeakerProblem,
  speakerFieldMaxLength,
  speakerNameAr,
  speakerNameEn,
  speakerPhotoIssue,
  toSpeakerFormValues,
  toSpeakerInput,
  validateSpeakerInput,
  type SpeakerField,
  type SpeakerFieldIssue,
  type SpeakerFormValues,
  type SpeakerTextField,
} from './speaker.types';
import { getSpeakerService } from './speakerService';
import { getSpeakersContent } from './speakers.content';
import type { SpeakerSavedState } from './SpeakerDetailPage';
import styles from './SpeakerFormPage.module.css';

/**
 * EH-INT-11 — create (`internal/speakers/new`, `F-0105`) and edit
 * (`internal/speakers/:speakerId/edit`, `F-0413`) a speaker record — **J-04/F1**.
 * One form for both: the matrix is the same eleven fields either way, and an
 * edit is the same form prefilled.
 *
 * The fields are the owner's "Speaker Record" matrix, in its order: the photo,
 * the title, four Arabic name parts, four English name parts, the bio. There is
 * **no email field** — the owner ruled (2026-10-13) that it is read from the
 * speaker's FAST profile — and so the creation email (AC-4) cannot be sent yet.
 * The create screen says that once, as information, not as an error.
 *
 * The client applies the server's rules (`validateSpeakerInput`) and maps the
 * server's `"<field>-<reason>"` answer back to the field it names, so either
 * side's refusal lands in the same place.
 */

type Phase = 'loading' | 'error' | 'not-found' | 'ready';

/** The photo the record will be saved with, and how to show it. */
interface PhotoState {
  readonly attachmentId: string;
  readonly url: string | null;
}

const ARABIC_NAME_FIELDS: readonly SpeakerTextField[] = [
  'firstNameAr',
  'middleNameAr',
  'thirdNameAr',
  'lastNameAr',
];
const ENGLISH_NAME_FIELDS: readonly SpeakerTextField[] = [
  'firstNameEn',
  'middleNameEn',
  'thirdNameEn',
  'lastNameEn',
];

/** The wrapper id the error summary links to, and focus lands in. */
function fieldTargetId(field: SpeakerField): string {
  return field === 'photoAttachmentId' ? 'eh-field-speaker-photo' : `eh-field-speaker-${field}`;
}

export default function SpeakerFormPage() {
  const { locale } = useLocale();
  const content = useMemo(() => getSpeakersContent(locale), [locale]);
  const copy = content.form;
  const { speakerId } = useParams();
  const isEdit = speakerId != null;
  const navigate = useNavigate();
  const service = getSpeakerService();

  const [phase, setPhase] = useState<Phase>(isEdit ? 'loading' : 'ready');
  const [loadError, setLoadError] = useState<ExpertHubApiError | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [initial, setInitial] = useState<SpeakerFormValues>(EMPTY_SPEAKER_FORM);
  const [initialPhotoId, setInitialPhotoId] = useState<string | null>(null);
  const [editedName, setEditedName] = useState('');
  const [values, setValues] = useState<SpeakerFormValues>(EMPTY_SPEAKER_FORM);
  const [photo, setPhoto] = useState<PhotoState | null>(null);
  const [photoFile, setPhotoFile] = useState<UploadedFile | null>(null);
  const [issues, setIssues] = useState<readonly SpeakerFieldIssue[]>([]);
  const [pendingFocus, setPendingFocus] = useState<SpeakerField | null>(null);
  const [busy, setBusy] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const [duplicate, setDuplicate] = useState(false);

  const uploadAttempt = useRef(0);
  /** Set once a save succeeds, so leaving for the detail page is not "unsaved". */
  const leaving = useRef(false);
  const focusedOnce = useRef(false);

  /* ── load (edit only) ──────────────────────────────────────────────────── */
  useEffect(() => {
    if (speakerId == null) {
      return;
    }
    let cancelled = false;
    setPhase('loading');
    void service.getSpeaker(speakerId).then((result) => {
      if (cancelled) {
        return;
      }
      if (result.ok) {
        const detail = result.value;
        const prefilled = toSpeakerFormValues(detail);
        setInitial(prefilled);
        setValues(prefilled);
        setInitialPhotoId(detail.photoAttachmentId);
        setPhoto(
          detail.photoAttachmentId == null
            ? null
            : {
                attachmentId: detail.photoAttachmentId,
                url: detail.photoUrl == null ? null : apiUrl(detail.photoUrl),
              }
        );
        setPhotoFile(
          detail.photoAttachmentId == null
            ? null
            : { id: 'current', name: copy.photo.current, status: 'success' }
        );
        setEditedName(
          locale === 'en' ? (speakerNameEn(detail) ?? speakerNameAr(detail)) : speakerNameAr(detail)
        );
        setPhase('ready');
      } else if (result.error.status === 404) {
        setPhase('not-found');
      } else {
        setLoadError(result.error);
        setPhase('error');
      }
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speakerId, reloadKey]);

  useEffect(() => {
    document.title = isEdit ? copy.editDocumentTitle(editedName) : copy.createDocumentTitle;
  }, [isEdit, copy, editedName]);

  useEffect(() => {
    if (phase === 'ready' && !focusedOnce.current) {
      focusedOnce.current = true;
      document.getElementById('eh-speaker-form-title')?.focus();
    }
  }, [phase]);

  /** Focus moves to the first invalid field after a refused save. */
  useEffect(() => {
    if (pendingFocus == null) {
      return;
    }
    focusFieldTarget(fieldTargetId(pendingFocus));
    setPendingFocus(null);
  }, [pendingFocus]);

  /* ── unsaved-changes guard (the `NewApplicationPage` pattern) ──────────── */
  const dirty =
    phase === 'ready' &&
    ((Object.keys(values) as SpeakerTextField[]).some((key) => values[key] !== initial[key]) ||
      (photo?.attachmentId ?? null) !== initialPhotoId);

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      dirty && !leaving.current && currentLocation.pathname !== nextLocation.pathname
  );

  useEffect(() => {
    if (!dirty) {
      return;
    }
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  /* ── the photo ─────────────────────────────────────────────────────────── */
  const uploadErrorFor = (error: ExpertHubApiError) =>
    error.status === 422
      ? copy.photo.refused
      : error.status === 403
        ? copy.photo.forbidden
        : copy.photo.failed;

  const selectPhoto = (files: File[]) => {
    const file = files[0];
    if (file == null) {
      return;
    }
    uploadAttempt.current += 1;
    const attempt = uploadAttempt.current;
    const id = `speaker-photo-${attempt}`;
    setPhoto(null);
    setIssues((current) => current.filter((issue) => issue.field !== 'photoAttachmentId'));
    // J-01's photo rule, checked before the round trip; the server re-checks.
    const issue = speakerPhotoIssue(file);
    if (issue != null) {
      setPhotoFile({
        id,
        name: file.name,
        status: 'error',
        errorMessage: issue === 'format' ? copy.photo.formatError : copy.photo.sizeError,
      });
      return;
    }
    setPhotoFile({ id, name: file.name, status: 'uploading' });
    void service.uploadPhoto(file).then((result) => {
      if (attempt !== uploadAttempt.current) {
        return;
      }
      if (result.ok) {
        setPhoto({
          attachmentId: result.value.attachmentId,
          url: apiUrl(result.value.downloadUrl),
        });
        setPhotoFile({ id, name: result.value.fileName, status: 'success' });
      } else {
        setPhotoFile({
          id,
          name: file.name,
          status: 'error',
          errorMessage: uploadErrorFor(result.error),
        });
      }
    });
  };

  const removePhoto = () => {
    uploadAttempt.current += 1;
    setPhoto(null);
    setPhotoFile(null);
  };

  /* ── validation and save ───────────────────────────────────────────────── */
  const labelFor = (field: SpeakerField) =>
    field === 'photoAttachmentId' ? copy.photoLabel : copy.fields[field];

  const messageFor = (issue: SpeakerFieldIssue): string =>
    issue.field === 'photoAttachmentId'
      ? copy.photo.invalid
      : issue.reason === 'too-long'
        ? copy.errors.tooLong(
            labelFor(issue.field),
            formatNumber(speakerFieldMaxLength(issue.field), locale)
          )
        : copy.errors.required(labelFor(issue.field));

  const errorFor = (field: SpeakerField): string | undefined => {
    const issue = issues.find((candidate) => candidate.field === field);
    return issue == null ? undefined : messageFor(issue);
  };

  const set = (field: SpeakerTextField, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    // An edited field's old complaint no longer describes it.
    setIssues((current) => current.filter((issue) => issue.field !== field));
  };

  const submit = (confirmDuplicate = false) => {
    if (busy || photoFile?.status === 'uploading') {
      return;
    }
    const input = {
      ...toSpeakerInput(values, photo?.attachmentId ?? null),
      ...(confirmDuplicate ? { confirmDuplicate: true } : {}),
    };
    const found = validateSpeakerInput(input);
    setIssues(found);
    setSaveFailed(false);
    setDuplicate(false);
    if (found.length > 0) {
      setPendingFocus(found[0].field);
      return;
    }
    setBusy(true);
    const request =
      speakerId == null ? service.createSpeaker(input) : service.updateSpeaker(speakerId, input);
    void request.then((result) => {
      setBusy(false);
      if (result.ok) {
        leaving.current = true;
        const state: SpeakerSavedState = { speakerSaved: isEdit ? 'updated' : 'created' };
        void navigate(expertHubPaths.internalSpeaker(result.value.speakerId), { state });
        return;
      }
      if (result.error.status === 409 && result.error.message === 'duplicate-name') {
        setDuplicate(true);
        return;
      }
      // The server is the authority: a field it names is shown on that field.
      const issue = result.error.status === 400 ? parseSpeakerProblem(result.error.message) : null;
      if (issue != null) {
        setIssues([issue]);
        setPendingFocus(issue.field);
      } else {
        setSaveFailed(true);
      }
    });
  };

  /* ── states ────────────────────────────────────────────────────────────── */
  if (phase === 'loading') {
    return (
      <WorkspacePage label={copy.editTitle}>
        <Loading variant="skeleton" lines={6} label={copy.editTitle} />
      </WorkspacePage>
    );
  }

  if (phase !== 'ready') {
    const failure =
      phase === 'not-found'
        ? {
            title: content.errors.notFoundTitle,
            body: content.errors.notFoundBody,
            canRetry: false,
          }
        : describeLoadFailure(loadError, locale, {
            title: content.errors.detailLoadTitle,
            body: content.errors.detailLoadBody,
          });
    return (
      <PageLoadError
        title={failure.title}
        body={failure.body}
        onRetry={failure.canRetry ? () => setReloadKey((key) => key + 1) : undefined}
        retryLabel={content.errors.retry}
        size="prose"
        action={
          <Button variant="secondary" size="md" href={expertHubPaths.internalSpeakers}>
            {content.errors.backToList}
          </Button>
        }
      />
    );
  }

  const textField = (field: SpeakerTextField, options: { readonly ltr?: boolean } = {}) => (
    <div key={field} id={fieldTargetId(field)}>
      <TextInput
        label={copy.fields[field]}
        value={values[field]}
        onChange={(event) => set(field, event.target.value)}
        maxLength={speakerFieldMaxLength(field)}
        requiredField={REQUIRED_SPEAKER_FIELDS.includes(field)}
        errorText={errorFor(field)}
        dir={options.ltr === true ? 'ltr' : undefined}
        autoComplete="off"
      />
    </div>
  );

  const summaryItems: ErrorSummaryItem[] = issues.map((issue) => ({
    targetId: fieldTargetId(issue.field),
    message: messageFor(issue),
  }));

  const cancelHref =
    speakerId == null ? expertHubPaths.internalSpeakers : expertHubPaths.internalSpeaker(speakerId);

  return (
    <WorkspacePage labelledBy="eh-speaker-form-title">
      <PageHead
        titleId="eh-speaker-form-title"
        title={isEdit ? copy.editTitle : copy.createTitle}
        lead={isEdit ? copy.editLead(editedName) : copy.createLead}
        breadcrumbs={
          <Breadcrumbs
            items={[
              { label: content.detail.breadcrumbList, href: expertHubPaths.internalSpeakers },
              ...(speakerId == null
                ? []
                : [{ label: editedName, href: expertHubPaths.internalSpeaker(speakerId) }]),
              { label: isEdit ? copy.editTitle : copy.createTitle },
            ]}
            label={content.detail.breadcrumbLabel}
          />
        }
      />

      {/* AC-4 — said once, as information: FAST does not serve the email yet. */}
      {!isEdit && (
        <Alert tone="info" surface="tinted" role="note">
          {copy.emailNotice}
        </Alert>
      )}

      <ApplicationErrorSummary title={copy.errors.summaryTitle} items={summaryItems} />

      <form
        className={styles.form}
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        {/* Matrix rows 1–2 — the photo and the title. */}
        <Panel title={copy.sections.identity} titleId="eh-speaker-form-identity">
          <div className={styles.stack}>
            <div id={fieldTargetId('photoAttachmentId')} className={styles.photoRow}>
              {photo?.url != null && (
                <Avatar name={copy.photo.current} src={photo.url} size="xl" decorative />
              )}
              <div className={styles.photoField}>
                <FileUploader
                  label={copy.photoLabel}
                  hint={copy.photo.hint}
                  accept={SPEAKER_PHOTO_FORMATS.map((format) => `.${format}`).join(',')}
                  files={photoFile == null ? [] : [photoFile]}
                  onFilesSelected={selectPhoto}
                  onRemove={removePhoto}
                  browseLabel={copy.photo.browseLabel}
                  removeLabel={copy.photo.removeLabel}
                />
                {errorFor('photoAttachmentId') != null && (
                  <Alert tone="error" surface="tinted" role="alert">
                    {errorFor('photoAttachmentId')}
                  </Alert>
                )}
              </div>
            </div>
            {textField('title')}
          </div>
        </Panel>

        {/* Matrix rows 3–6. */}
        <Panel title={copy.sections.arabicName} titleId="eh-speaker-form-ar">
          <div className={styles.fieldGrid}>
            {ARABIC_NAME_FIELDS.map((field) => textField(field))}
          </div>
        </Panel>

        {/* Matrix rows 7–10. */}
        <Panel title={copy.sections.englishName} titleId="eh-speaker-form-en">
          <div className={styles.fieldGrid} lang="en">
            {ENGLISH_NAME_FIELDS.map((field) => textField(field, { ltr: true }))}
          </div>
        </Panel>

        {/* Matrix row 11 — multi-line. */}
        <Panel title={copy.sections.bio} titleId="eh-speaker-form-bio">
          <div id={fieldTargetId('bio')}>
            <Textarea
              label={copy.fields.bio}
              helperText={copy.bioHint(formatNumber(speakerFieldMaxLength('bio'), locale))}
              value={values.bio}
              onChange={(event) => set('bio', event.target.value)}
              maxLength={speakerFieldMaxLength('bio')}
              errorText={errorFor('bio')}
              rows={6}
              showCharacterCount
            />
          </div>
        </Panel>

        {duplicate && (
          <Alert tone="warning" surface="tinted" role="alert">
            {copy.errors.duplicate}{' '}
            <Button variant="secondary" size="sm" onClick={() => submit(true)} loading={busy}>
              {copy.errors.saveAnyway}
            </Button>
          </Alert>
        )}

        {saveFailed && (
          <Alert tone="error" surface="tinted" role="alert">
            {copy.errors.saveFailed}
          </Alert>
        )}

        <div className={styles.actions}>
          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={busy}
            disabled={photoFile?.status === 'uploading'}
          >
            {isEdit ? copy.save : copy.create}
          </Button>
          <Button variant="secondary" size="md" href={cancelHref}>
            {copy.cancel}
          </Button>
        </div>
      </form>

      {/* Unsaved-changes warning before navigating away. */}
      <Modal
        open={blocker.state === 'blocked'}
        onClose={() => blocker.reset?.()}
        title={copy.unsaved.title}
        dismissLabel={copy.unsaved.dismissLabel}
        footer={
          <div className={styles.modalActions}>
            <Button variant="secondary" size="md" onClick={() => blocker.proceed?.()}>
              {copy.unsaved.leaveLabel}
            </Button>
            <Button variant="primary" size="md" onClick={() => blocker.reset?.()}>
              {copy.unsaved.stayLabel}
            </Button>
          </div>
        }
      >
        <Typography as="p" variant="text-md">
          {copy.unsaved.body}
        </Typography>
      </Modal>
    </WorkspacePage>
  );
}
