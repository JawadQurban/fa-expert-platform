import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Card, Loading, Modal, Tabs } from '@ds/composite';
import type { TabItem } from '@ds/composite';
import { Button, Tag, TextInput, Typography } from '@ds/primitives';
import { Container, Section } from '@ds/layout';
import { useLocale } from '@i18n/LocaleProvider';
import type { Result } from '@/types';
import { expertHubPaths } from '../../app/router/paths';
import type { ExpertHubApiError } from '../../shared/services/apiClient';
import type { MyProfileDto } from './profile.types';
import { BIO_MAX_LENGTH } from './profile.types';
import { getProfileService } from './profileService';
import { fieldLabel } from '../applications/applicationValidation';
import { getProfileContent } from './profile.content';
import { ProfileHeader } from './components/ProfileHeader';
import { ProfileSection } from './components/ProfileSection';
import { ProfileFieldsForm } from './components/ProfileFieldsForm';
import { BankDataSection } from './components/BankDataSection';
import { LockedFactsSection } from './components/LockedFactsSection';
import { AcademyContracts } from './components/AcademyContracts';
import { CertificatesSection } from './components/CertificatesSection';
import { RatingsSection } from './components/RatingsSection';
import { VisibilityConsent } from './components/VisibilityConsent';
import { BioSection } from './components/BioSection';
import styles from './MyProfilePage.module.css';
import { PageLoadError } from '../../shared/components/PageLoadError';

/**
 * EH-TP-04 — My Profile (`/expert-hub/profile`, trainer). The authoritative
 * trainer record: view everything, edit only what's owned.
 *
 * **Conformed to journey J-14 on 2026-08-19** (`DECISIONS.md` P-52/P-53). AC-1
 * (`BR-0404`) requires self-service editing to use "the exact same
 * fields/sections as the original application form — no separate update form is
 * created". The page previously carried a bespoke three-field form; it now
 * renders `profile.formSchema` — the *same* schema EH-TP-05 renders — through
 * the same `DynamicFieldRenderer` and the same validation.
 *
 * **Editability is per field and server-decided** (P-16, P-J9): editable fields
 * save directly and reflect immediately (AC-4); FAST-owned fields are
 * request-change only and show the confirmed value with a "change pending"
 * marker beside it until FAST confirms (`BR-0404`); locked fields are visible,
 * never editable, and always state why (F2, `BR-0411`).
 *
 * The three **Locked Fields matrix** rows — classification, evaluation, and the
 * **agreement status**, which was previously not shown at all — render together
 * in `LockedFactsSection`. Ratings remain the calculated indicator only (`02D`,
 * P-06). The visibility consent toggle publishes/hides the trainer in the public
 * directory (`BR-1002/1007`, J-23).
 *
 * Consumes **only** `profileService` (mock now, Expert Hub API later); no direct
 * FAST/MTM/SSO calls. The page owns the confirmation dialogs (§0.5) + the service
 * calls; success is announced via a `role="status"` live region. No breadcrumb:
 * profile is a top-level trainer route (`05` §0.3).
 */

type Phase = 'loading' | 'error' | 'session' | 'ready';

export default function MyProfilePage() {
  const { locale } = useLocale();
  const content = useMemo(() => getProfileContent(locale), [locale]);
  const service = getProfileService();

  const [phase, setPhase] = useState<Phase>('loading');
  const [profile, setProfile] = useState<MyProfileDto | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [actionFailed, setActionFailed] = useState(false);

  const [pendingRequest, setPendingRequest] = useState<{ readonly fieldId: string } | null>(null);
  const [requestValue, setRequestValue] = useState('');
  const [pendingConsent, setPendingConsent] = useState<{ readonly next: boolean } | null>(null);

  const loadedOnce = useRef(false);

  useEffect(() => {
    let cancelled = false;
    setPhase('loading');
    void service.getMyProfile().then((result) => {
      if (cancelled) {
        return;
      }
      if (result.ok) {
        setProfile(result.value);
        setPhase('ready');
      } else if (result.error.status === 401) {
        setPhase('session');
      } else {
        setPhase('error');
      }
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadKey]);

  useEffect(() => {
    document.title = content.documentTitle;
  }, [content.documentTitle]);

  useEffect(() => {
    if (phase === 'ready' && !loadedOnce.current) {
      loadedOnce.current = true;
      document.getElementById('eh-profile-title')?.focus();
    }
  }, [phase]);

  const retry = () => setReloadKey((key) => key + 1);

  /** Run a service mutation, reflect the result, announce success/failure. */
  const run = (op: Promise<Result<MyProfileDto, ExpertHubApiError>>, successMessage: string) => {
    setBusy(true);
    setActionFailed(false);
    setFeedback('');
    void op.then((result) => {
      setBusy(false);
      if (result.ok) {
        setProfile(result.value);
        setFeedback(successMessage);
      } else {
        setActionFailed(true);
      }
    });
  };

  /**
   * J-14/F1/AC-2 — store a certificate. The refusal is shown on the file row
   * itself, so this answers the copy for it (or `null` once stored) instead of
   * raising the page-level failure.
   */
  const uploadCertificate = async (file: File): Promise<string | null> => {
    setBusy(true);
    setActionFailed(false);
    setFeedback('');
    const result = await service.uploadCertificate(file);
    setBusy(false);
    if (result.ok) {
      setProfile(result.value);
      setFeedback(content.certificates.uploaded);
      return null;
    }
    const { status } = result.error;
    return status === 422
      ? content.certificates.refused
      : status === 409
        ? content.certificates.ruleUnavailable
        : status === 404
          ? content.certificates.noProfile
          : status === 400
            ? content.certificates.emptyFile
            : content.certificates.failed;
  };

  /**
   * `P-331` — a bio action. Its refusal is shown under the bio field, so this
   * answers the copy for it (or `null` once saved), as the upload does.
   */
  const bioAction = async (
    op: Promise<Result<MyProfileDto, ExpertHubApiError>>,
    successMessage: string
  ): Promise<string | null> => {
    setBusy(true);
    setActionFailed(false);
    setFeedback('');
    const result = await op;
    setBusy(false);
    if (result.ok) {
      setProfile(result.value);
      setFeedback(successMessage);
      return null;
    }
    const { status, message } = result.error;
    if (status === 409) {
      return message === 'ai-unavailable'
        ? content.bio.aiOff
        : message === 'no-cv'
          ? content.bio.noCv
          : content.bio.conflict;
    }
    return status === 400 ? content.bio.lengthError(BIO_MAX_LENGTH) : content.bio.failed;
  };

  const submitRequest = () => {
    if (pendingRequest == null) {
      return;
    }
    const { fieldId } = pendingRequest;
    const value = requestValue.trim();
    if (value === '') {
      return;
    }
    setPendingRequest(null);
    run(service.requestFastFieldChange(fieldId, value), content.requestModal.submitted);
  };

  const confirmConsent = () => {
    if (pendingConsent == null) {
      return;
    }
    const { next } = pendingConsent;
    setPendingConsent(null);
    run(
      service.setVisibilityConsent(next),
      next ? content.consentModal.enabled : content.consentModal.disabled
    );
  };

  /* ── non-ready states ──────────────────────────────────────────────────── */
  if (phase === 'loading') {
    return (
      <Section aria-label={content.title}>
        <Container>
          <Loading variant="skeleton" lines={8} label={content.title} />
        </Container>
      </Section>
    );
  }

  if (phase !== 'ready' || profile == null) {
    const copy =
      phase === 'session'
        ? { title: content.errors.sessionTitle, body: content.errors.sessionBody }
        : { title: content.errors.loadTitle, body: content.errors.loadBody };
    return (
      <PageLoadError
        title={copy.title}
        body={copy.body}
        onRetry={phase === 'error' ? retry : undefined}
        retryLabel={content.errors.retry}
        size="prose"
        action={
          <Button variant="secondary" size="md" href={expertHubPaths.applications}>
            {content.errors.homeLabel}
          </Button>
        }
      />
    );
  }

  // The label comes from the shared schema, not from a profile-specific list —
  // J-14/F1/AC-1 means the same field carries the same words on both pages.
  const requestFieldLabel =
    pendingRequest == null
      ? ''
      : (() => {
          const field = profile.formSchema.fields.find((f) => f.id === pendingRequest.fieldId);
          return field == null ? pendingRequest.fieldId : fieldLabel(field, locale);
        })();

  const tabItems: TabItem[] = [
    {
      id: 'overview',
      label: content.tabs.overview,
      content: (
        <div className={styles.stack}>
          {/* J-09/F6 — appears only once preliminary approval requested it, and
              leads the tab because it is the one thing blocking the agreement. */}
          {profile.bankData.state !== 'not-requested' && (
            <Card effect="stroke" className={styles.card}>
              <ProfileSection
                id="eh-bank-data"
                icon="task-done-01"
                title={content.bankData.heading}
              >
                <BankDataSection
                  bankData={profile.bankData}
                  content={content}
                  locale={locale}
                  saving={busy}
                  onSave={(fields) =>
                    run(service.saveBankData(fields), content.bankData.savedToast)
                  }
                />
              </ProfileSection>
            </Card>
          )}

          {/* J-14/F2 — the Locked Fields matrix: visible, never editable. */}
          <Card effect="stroke" className={styles.card}>
            <ProfileSection
              id="eh-locked"
              icon="dashboard-circle"
              title={content.lockedFacts.heading}
            >
              <LockedFactsSection facts={profile.lockedFacts} content={content} locale={locale} />

              {/*
                The Academy's own trainer contracts, beside «حالة الاتفاقية»
                because that is where a reader looks for a contract — and
                labelled as the Academy's, because they are not the Expert Hub
                agreement (`P-266`).
              */}
              {profile.academyRecords != null && (
                <AcademyContracts
                  contracts={profile.academyRecords.contracts}
                  content={content}
                  locale={locale}
                />
              )}
            </ProfileSection>
          </Card>

          {/* J-14/F1 — the SAME fields and sections as the application form. */}
          <Card effect="stroke" className={styles.card}>
            <ProfileSection
              id="eh-fields"
              icon="note-edit"
              title={content.fields.heading}
              description={content.fields.description}
            >
              {/*
               * ⚠️ Somebody with the trainer role but no Expert Hub trainer
               * file. The page renders either way — the Academy's record
               * fills what it can and the rest shows empty, which is what
               * «highlight the information missing» means here.
               */}
              {!profile.establishedInExpertHub && (
                <Alert
                  tone="info"
                  surface="tinted"
                  role="note"
                  title={content.header.notAccreditedTitle}
                >
                  {content.header.notAccreditedBody}
                </Alert>
              )}

              {!profile.fastAvailable && (
                <Alert
                  tone="warning"
                  surface="tinted"
                  role="note"
                  title={content.fields.unavailableTitle}
                >
                  {content.fields.unavailableBody}
                </Alert>
              )}
              <ProfileFieldsForm
                profile={profile}
                content={content}
                locale={locale}
                busy={busy}
                onSave={(values) => run(service.saveProfileFields(values), content.fields.saved)}
                onRequestChange={(fieldId) => {
                  setRequestValue('');
                  setPendingRequest({ fieldId });
                }}
              />
            </ProfileSection>
          </Card>

          {profile.bio != null && (
            <Card effect="stroke" className={styles.card}>
              <ProfileSection
                id="eh-bio"
                icon="note-edit"
                title={content.bio.heading}
                description={content.bio.description}
              >
                <BioSection
                  bio={profile.bio}
                  content={content}
                  busy={busy}
                  onDraft={() =>
                    bioAction(
                      service.requestBioDraft(profile.bio?.revision ?? 0),
                      content.bio.draftRequested
                    )
                  }
                  onSubmit={(text) =>
                    bioAction(
                      service.submitBio(text, profile.bio?.revision ?? 0),
                      content.bio.submitted
                    )
                  }
                  onRefresh={retry}
                />
              </ProfileSection>
            </Card>
          )}

          <Card effect="stroke" className={styles.card}>
            <ProfileSection
              id="eh-certs"
              icon="note-01"
              title={content.certificates.heading}
              description={content.certificates.description}
            >
              <CertificatesSection
                certificates={profile.certificates}
                rule={
                  profile.formSchema.attachments.find(
                    (rule) => rule.id === 'professional-certificate'
                  ) ?? null
                }
                content={content}
                busy={busy}
                onUpload={uploadCertificate}
                onRemove={(id) => run(service.removeCertificate(id), content.certificates.removed)}
              />
            </ProfileSection>
          </Card>
        </div>
      ),
    },
    {
      id: 'services',
      label: content.tabs.services,
      content: (
        <Card effect="stroke" className={styles.card}>
          <ProfileSection id="eh-scope" icon="co-present" title={content.scope.heading}>
            <div className={styles.scope}>
              <div className={styles.scopeGroup}>
                <Typography as="h3" variant="text-md" weight="bold">
                  {content.scope.servicesHeading}
                </Typography>
                <ul className={styles.tags}>
                  {profile.services.map((serviceKey) => (
                    <li key={serviceKey}>
                      <Tag variant="information" size="sm">
                        {content.services[serviceKey]}
                      </Tag>
                    </li>
                  ))}
                </ul>
              </div>
              <div className={styles.scopeGroup}>
                <Typography as="h3" variant="text-md" weight="bold">
                  {content.scope.specialtiesHeading}
                </Typography>
                <ul className={styles.tags}>
                  {profile.specialties.map((specialty) => (
                    <li key={specialty}>
                      <Tag variant="neutral" size="sm">
                        {content.specialties[specialty]}
                      </Tag>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </ProfileSection>
        </Card>
      ),
    },
    {
      id: 'programs',
      label: content.tabs.programs,
      content: (
        <Card effect="stroke" className={styles.card}>
          <ProfileSection id="eh-programs" icon="task-done-01" title={content.programs.heading}>
            {profile.programs.length === 0 ? (
              <Typography as="p" variant="text-md" color="muted">
                {content.programs.empty}
              </Typography>
            ) : (
              <ul className={styles.programs}>
                {profile.programs.map((program) => (
                  <li key={program.id} className={styles.programRow}>
                    <span className={styles.programName}>{program.name}</span>
                    <span className={styles.programMeta}>
                      {program.role} · {program.year}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </ProfileSection>
        </Card>
      ),
    },
    {
      id: 'ratings',
      label: content.tabs.ratings,
      content: (
        <Card effect="stroke" className={styles.card}>
          <ProfileSection id="eh-ratings" icon="task-done-01" title={content.ratings.heading}>
            <RatingsSection ratings={profile.ratings} content={content} locale={locale} />
          </ProfileSection>
        </Card>
      ),
    },
    {
      id: 'visibility',
      label: content.tabs.visibility,
      content: (
        <Card effect="stroke" className={styles.card}>
          <ProfileSection
            id="eh-visibility"
            icon="co-present"
            title={content.visibility.heading}
            description={content.visibility.description}
          >
            <VisibilityConsent
              consent={profile.visibilityConsent}
              content={content}
              busy={busy}
              onRequestToggle={(next) => setPendingConsent({ next })}
            />
          </ProfileSection>
        </Card>
      ),
    },
  ];

  return (
    <Section aria-labelledby="eh-profile-title">
      <Container>
        <ProfileHeader profile={profile} content={content} locale={locale} />

        <Typography as="p" variant="text-md" color="muted" className={styles.subtitle}>
          {content.subtitle}
        </Typography>

        {feedback !== '' && (
          <Alert tone="success" role="status" className={styles.feedback}>
            {feedback}
          </Alert>
        )}
        {actionFailed && (
          <Alert tone="error" role="alert" className={styles.feedback}>
            {content.errors.actionFailed}
          </Alert>
        )}

        <Tabs items={tabItems} defaultActiveId="overview" label={content.title} />

        {/* FAST change-request dialog (§0.5) — clarifies it's pending, not official. */}
        <Modal
          open={pendingRequest != null}
          onClose={() => setPendingRequest(null)}
          title={content.requestModal.title(requestFieldLabel)}
          dismissLabel={content.requestModal.dismiss}
          footer={
            <div className={styles.modalActions}>
              <Button variant="secondary" size="md" onClick={() => setPendingRequest(null)}>
                {content.requestModal.cancel}
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={submitRequest}
                disabled={busy || requestValue.trim() === ''}
              >
                {content.requestModal.submit}
              </Button>
            </div>
          }
        >
          <div className={styles.modalBody}>
            <TextInput
              label={content.requestModal.inputLabel(requestFieldLabel)}
              value={requestValue}
              onChange={(event) => setRequestValue(event.target.value)}
            />
            <Typography as="p" variant="text-sm" color="muted">
              {content.requestModal.hint}
            </Typography>
          </div>
        </Modal>

        {/* Consent confirm (§0.5) — clarifies the immediate public effect. */}
        <Modal
          open={pendingConsent != null}
          onClose={() => setPendingConsent(null)}
          title={content.consentModal.title}
          dismissLabel={content.consentModal.dismiss}
          footer={
            <div className={styles.modalActions}>
              <Button variant="secondary" size="md" onClick={() => setPendingConsent(null)}>
                {content.consentModal.cancel}
              </Button>
              <Button variant="primary" size="md" onClick={confirmConsent} disabled={busy}>
                {content.consentModal.confirm}
              </Button>
            </div>
          }
        >
          <Typography as="p" variant="text-md">
            {pendingConsent?.next === true
              ? content.consentModal.enableBody
              : content.consentModal.disableBody}
          </Typography>
        </Modal>
      </Container>
    </Section>
  );
}
