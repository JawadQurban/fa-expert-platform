import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Alert, Loading } from '@ds/composite';
import { Button } from '@ds/primitives';
import { Breadcrumbs } from '@ds/shell';
import { useLocale } from '@i18n/LocaleProvider';
import type { Result } from '@/types';
import type { ExpertHubApiError } from '../../shared/services/apiClient';
import { SequenceFormation } from '../../shared/components/SequenceFormation';
import { expertHubPaths } from '../../app/router/paths';
import { getAgreementsContent } from './agreements.content';
import { getAgreementService } from './agreementService';
import { buildAgreementFormationCopy } from './agreementFormationCopy';
import { canEditAgreement, currentSigningMember } from './agreement.types';
import type {
  AgreementDetailDto,
  AgreementFieldValues,
  FormSigningSequenceInput,
  SigningDecisionInput,
} from './agreement.types';
import { AgreementDocumentView } from './components/AgreementDocumentView';
import { AgreementGateCard } from './components/AgreementGateCard';
import { AgreementPreparationForm } from './components/AgreementPreparationForm';
import { SendStatusCard } from './components/SendStatusCard';
import { SigningDecisionPanel } from './components/SigningDecisionPanel';
import { SigningSequenceTimeline } from './components/SigningSequenceTimeline';
import { PageLoadError } from '../../shared/components/PageLoadError';
import { WorkspacePage } from '../../shared/workspace/WorkspacePage';
import { RecordHead } from '../../shared/workspace/RecordHead';
import { Panel } from '../../shared/workspace/Panel';

/**
 * EH-INT-06a — **Agreement Preparation & Internal Approval**
 * (`/expert-hub/internal/applications/:id/agreement`, staff). Journey **J-10**.
 *
 * The page is a single surface that changes shape with the server's `stage`,
 * rather than a wizard holding its own step counter: blocked → preparation →
 * formation → in-progress → sent. That matters because the stage can advance
 * from someone else's action in another browser, and a local step index would
 * quietly disagree with reality.
 *
 * Laid out as the approved Option B record screen: the applicant's head, then
 * whatever action this stage asks of the reader (sign/approve, form the
 * sequence, or fill the fields), then the signing sequence and the send gate —
 * which is the only thing anyone actually wants to know at a glance.
 *
 * Consumes only `agreementService` (mock now, Expert Hub API later).
 */

type Phase = 'loading' | 'error' | 'not-found' | 'unauthorized' | 'session' | 'ready';

export default function AgreementPreparationPage() {
  const { locale } = useLocale();
  const content = useMemo(() => getAgreementsContent(locale), [locale]);
  const { id = '' } = useParams<{ id: string }>();

  const [phase, setPhase] = useState<Phase>('loading');
  const [detail, setDetail] = useState<AgreementDetailDto | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setPhase('loading');
    void getAgreementService()
      .getAgreementDetail(id)
      .then((response) => {
        if (cancelled) {
          return;
        }
        if (response.ok) {
          setDetail(response.value);
          setPhase('ready');
          return;
        }
        const status = response.error.status;
        setPhase(
          status === 404
            ? 'not-found'
            : status === 401
              ? 'session'
              : status === 403
                ? 'unauthorized'
                : 'error'
        );
      });
    return () => {
      cancelled = true;
    };
  }, [id, reloadKey]);

  useEffect(() => {
    if (detail != null) {
      document.title = content.documentTitle(detail.reference);
    }
  }, [content, detail]);

  useEffect(() => {
    document.getElementById('eh-agreement-title')?.focus();
  }, [detail?.applicationId]);

  const run = (action: Promise<Result<AgreementDetailDto, ExpertHubApiError>>) => {
    setSubmitting(true);
    setSubmitError(false);
    void action.then((response) => {
      setSubmitting(false);
      if (!response.ok) {
        setSubmitError(true);
        return;
      }
      setDetail(response.value);
    });
  };

  const handlePrepare = (values: AgreementFieldValues) => {
    run(getAgreementService().prepareAgreement(id, { values }));
  };

  const handleFormation = (input: FormSigningSequenceInput) => {
    run(getAgreementService().formSigningSequence(id, input));
  };

  const handleDecision = (input: SigningDecisionInput) => {
    run(getAgreementService().submitSigningDecision(id, input));
  };

  const handleResubmit = () => {
    run(getAgreementService().resubmitAgreement(id));
  };

  if (phase === 'loading') {
    return (
      <WorkspacePage label={content.eyebrow}>
        <Loading variant="skeleton" lines={8} label={content.eyebrow} />
      </WorkspacePage>
    );
  }

  if (phase !== 'ready' || detail == null) {
    const copy =
      phase === 'not-found'
        ? { title: content.errors.notFoundTitle, body: content.errors.notFoundBody }
        : phase === 'unauthorized'
          ? { title: content.errors.unauthorizedTitle, body: content.errors.unauthorizedBody }
          : phase === 'session'
            ? { title: content.errors.sessionTitle, body: content.errors.sessionBody }
            : { title: content.errors.loadTitle, body: content.errors.loadBody };
    return (
      <PageLoadError
        title={copy.title}
        body={copy.body}
        onRetry={phase === 'error' ? () => setReloadKey((key) => key + 1) : undefined}
        retryLabel={content.errors.retry}
        action={
          <Button variant="secondary" size="md" href={expertHubPaths.internalApplications}>
            {content.backToInbox}
          </Button>
        }
      />
    );
  }

  const { viewer, stage, sequence } = detail;
  const active = currentSigningMember(sequence);
  const modificationMember = sequence.find((member) => member.state === 'modification-requested');
  const blocked = stage === 'blocked';
  const prepared = detail.mergedData.length > 0;

  return (
    <WorkspacePage labelledBy="eh-agreement-title">
      <Breadcrumbs
        items={[
          { label: content.inboxCrumb, href: expertHubPaths.internalApplications },
          {
            label: detail.reference,
            href: expertHubPaths.internalApplicationDetail(detail.applicationId),
          },
          { label: content.eyebrow },
        ]}
        label={content.backToInbox}
      />

      <RecordHead
        titleId="eh-agreement-title"
        title={detail.applicantName}
        person={detail.applicantName}
        meta={[<bdi>{detail.reference}</bdi>, content.eyebrow]}
      />

      {submitError && (
        <Alert tone="error" surface="tinted" title={content.errors.submitTitle} role="alert">
          {content.errors.submitBody}
        </Alert>
      )}

      {/* F4 — a live modification request pauses the sequence for everyone. */}
      {stage === 'modification-requested' && modificationMember != null && (
        <Alert
          tone="warning"
          surface="tinted"
          title={content.modificationBanner.title}
          role="status"
          action={
            viewer.canResubmit ? (
              <Button variant="primary" size="md" onClick={handleResubmit} disabled={submitting}>
                {content.modificationBanner.resubmit}
              </Button>
            ) : undefined
          }
        >
          {content.modificationBanner.body(modificationMember.name)}
          {modificationMember.note != null && ` — «${modificationMember.note}»`}{' '}
          {content.modificationBanner.resumeNote}
          {viewer.isCreator && ` ${content.modificationBanner.correctNote}`}
        </Alert>
      )}

      {/* F1/AC-1 — nothing else on the page matters while the gate is closed. */}
      {blocked ? (
        <AgreementGateCard gate={detail.gate} content={content} />
      ) : (
        <>
          {/*
            F3/AC-3+AC-4 — reviewer approves, designated signer signs.

            ⚠️ Action first: this sits ABOVE the data, the sequence and the send
            gate (owner ruling — a detail page's action belongs at the top). The
            sequence below is the context for the decision.
          */}
          {stage === 'in-progress' &&
            (viewer.canDecide && active != null ? (
              <SigningDecisionPanel
                isSigner={active.isSigner}
                content={content}
                submitting={submitting}
                onSubmit={handleDecision}
              />
            ) : (
              <Panel shape="inline" title={content.decision.heading} titleId="eh-agreement-turn">
                <Alert
                  tone="info"
                  surface="tinted"
                  title={content.decision.notYourTurnTitle}
                  role="status"
                >
                  {content.decision.notYourTurnBody}
                </Alert>
              </Panel>
            ))}

          {/* F2 — form the signing sequence once the data is saved. */}
          {prepared && sequence.length === 0 && viewer.isCreator && (
            <SequenceFormation
              approverPool={detail.approverPool}
              templates={detail.templates}
              copy={buildAgreementFormationCopy(content)}
              locale={locale}
              submitting={submitting}
              designateSigners
              onSubmit={handleFormation}
            />
          )}

          {/*
            F1 — editable fields first, merged data after. Editable only where
            the server accepts a preparation — including while an internal
            modification request is pending (F4), before re-submitting.
          */}
          {viewer.isCreator && canEditAgreement(stage) && (
            <AgreementPreparationForm
              schema={detail.fieldSchema}
              initialValues={detail.fieldValues}
              approvedServices={detail.approvedServices}
              saved={prepared}
              content={content}
              locale={locale}
              submitting={submitting}
              onSave={handlePrepare}
            />
          )}

          {/*
            F3/AC-2 — the complete frozen document, for EVERY reader: the
            creator, and each reviewer and signer before they decide.
          */}
          {detail.document != null ? (
            <Panel
              shape="inline"
              title={content.document.heading}
              titleId="eh-agreement-document"
              description={content.document.description}
            >
              <AgreementDocumentView document={detail.document} locale={locale} />
            </Panel>
          ) : (
            !viewer.isCreator && (
              <Panel
                shape="inline"
                title={content.document.heading}
                titleId="eh-agreement-document"
              >
                <Alert tone="info" surface="tinted" role="status">
                  {content.document.notPrepared}
                </Alert>
              </Panel>
            )
          )}

          {/* F3 — the running sequence, visible to everyone involved. */}
          {sequence.length > 0 && (
            <Panel
              title={content.sequence.heading}
              titleId="eh-agreement-sequence"
              icon="task-done-01"
            >
              <SigningSequenceTimeline
                sequence={sequence}
                viewerApproverId={viewer.approverId}
                content={content}
                locale={locale}
              />
            </Panel>
          )}

          {/* F3/AC-5 — the send gate: sequence complete AND signature attached. */}
          {sequence.length > 0 && (
            <SendStatusCard
              sequenceComplete={detail.sequenceComplete}
              signaturesAttached={detail.signaturesAttached}
              sentAt={detail.sentToApplicantAt}
              content={content}
              locale={locale}
            />
          )}
        </>
      )}
    </WorkspacePage>
  );
}
