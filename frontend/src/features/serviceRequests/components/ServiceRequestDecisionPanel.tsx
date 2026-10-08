import { useRef, useState } from 'react';
import { Alert, FileUploader, Modal } from '@ds/composite';
import type { UploadedFile } from '@ds/composite';
import { Button, Select, Textarea, Typography } from '@ds/primitives';
import { useLocale } from '@i18n/LocaleProvider';
import { localized } from '../../../shared/types/localizedText';
import { expertHubPaths } from '../../../app/router/paths';
import {
  ADDENDUM_FORMATS,
  addendumFileIssue,
  NO_ACTIVE_AGREEMENT_REASON,
  validateServiceRequestDecision,
} from '../serviceRequest.types';
import type {
  AddendumUploadInput,
  RejectionReasonOptionDto,
  ServiceRequestDecisionInput,
  ServiceRequestViewerDto,
} from '../serviceRequest.types';
import type { ServiceRequestsContent } from '../serviceRequests.content';
import { getServiceRequestService } from '../serviceRequestService';
import { Panel } from '../../../shared/workspace/Panel';
import styles from './ServiceRequestDecisionPanel.module.css';

/**
 * **J-03/F3** — the single administrative decision on a service-addition
 * request.
 *
 * Three journey rules are visible here rather than implied:
 *
 * - **AC-1 — no screening, no interview.** The absence of a "route to screening"
 *   control is *stated*, not left as a gap. A missing step reads as a bug unless
 *   the page says why it is missing.
 * - **AC-4 — approval is not finalizable without the addendum.** The file is
 *   uploaded the moment it is chosen, the confirm button stays disabled until
 *   the server has STORED it, and the approval carries its id. The input type
 *   makes an approval without one unconstructible in the first place. The dialog
 *   also says what `BR-0305` guarantees: no new agreement, no extra signature.
 * - **AC-3 — rejection always carries a reason**, from the served list, with
 *   free text required for the "Other" entry.
 *
 * **AC-7** is why the reject dialog says the trainer will be told the outcome
 * *without* the reason: the person choosing it should know it is an internal
 * record, not a message.
 *
 * Authority is server-decided (`viewer.canDecide`, P-J9) — J-03 leaves the
 * decision-maker role open, so nothing here reads a role. A viewer who cannot
 * decide sees the reason why, not a vanished panel.
 */
export function ServiceRequestDecisionPanel({
  viewer,
  reasons,
  content,
  busy,
  onDecide,
}: {
  readonly viewer: ServiceRequestViewerDto;
  readonly reasons: readonly RejectionReasonOptionDto[];
  readonly content: ServiceRequestsContent;
  readonly busy: boolean;
  readonly onDecide: (input: ServiceRequestDecisionInput) => void;
}) {
  const { locale } = useLocale();
  const copy = content.decision;

  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  /** The STORED addendum — set only once the upload succeeded. */
  const [addendum, setAddendum] = useState<AddendumUploadInput | null>(null);
  const [uploadFiles, setUploadFiles] = useState<UploadedFile[]>([]);
  const [note, setNote] = useState('');
  const [reasonId, setReasonId] = useState('');
  const [reasonText, setReasonText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const fileCounter = useRef(0);

  const selectedReason = reasons.find((reason) => reason.id === reasonId) ?? null;

  const handleFiles = (selected: File[]) => {
    const chosen = selected[0];
    if (chosen == null) {
      return;
    }
    fileCounter.current += 1;
    const attempt = fileCounter.current;
    const id = `addendum-${attempt}`;
    setAddendum(null);
    const issue = addendumFileIssue(chosen);
    if (issue != null) {
      setUploadFiles([
        {
          id,
          name: chosen.name,
          status: 'error',
          errorMessage:
            issue === 'format' ? copy.approveDialog.formatError : copy.approveDialog.sizeError,
        },
      ]);
      return;
    }
    setUploadFiles([{ id, name: chosen.name, status: 'uploading' }]);
    void getServiceRequestService()
      .uploadAddendum(chosen)
      .then((result) => {
        // A newer choice (or a removal) supersedes this upload.
        if (attempt !== fileCounter.current) {
          return;
        }
        if (result.ok) {
          const { attachmentId, fileName, sizeBytes } = result.value;
          setAddendum({ attachmentId, fileName, sizeBytes });
          setUploadFiles([{ id, name: fileName, status: 'success' }]);
          return;
        }
        const { status } = result.error;
        setUploadFiles([
          {
            id,
            name: chosen.name,
            status: 'error',
            errorMessage:
              status === 422
                ? copy.approveDialog.uploadRefused
                : status === 403
                  ? copy.approveDialog.uploadForbidden
                  : status === 400
                    ? copy.approveDialog.uploadEmpty
                    : copy.approveDialog.uploadFailed,
          },
        ]);
      });
  };

  const submit = (input: ServiceRequestDecisionInput, close: () => void) => {
    const issues = validateServiceRequestDecision(input, reasons);
    if (issues.length > 0) {
      setError(copy.errors[issues[0]]);
      return;
    }
    setError(null);
    close();
    onDecide(input);
  };

  return (
    <Panel shape="inline" title={copy.heading} titleId="eh-decision-heading" focusableTitle>
      {/* AC-1 — the absence of screening/interview is explained, not left blank. */}
      <Alert tone="info" surface="tinted" role="status">
        {copy.directRouteNote}
      </Alert>

      {viewer.canDecide ? (
        <div className={styles.actions}>
          <Button variant="primary" size="md" disabled={busy} onClick={() => setApproveOpen(true)}>
            {copy.approve}
          </Button>
          <Button variant="secondary" size="md" disabled={busy} onClick={() => setRejectOpen(true)}>
            {copy.reject}
          </Button>
        </div>
      ) : viewer.blockedReason === 'no-active-agreement' ? (
        // RB-03 — nothing to decide: renew first (J-12); the rejection is automatic.
        <Alert tone="warning" surface="tinted" role="status" title={copy.noAgreementTitle}>
          <Typography as="p" variant="text-md">
            {copy.blocked['no-active-agreement']}
          </Typography>
          <div className={styles.actions}>
            <Button
              variant="primary"
              size="md"
              disabled={busy}
              onClick={() =>
                onDecide({ kind: 'reject', reasonId: NO_ACTIVE_AGREEMENT_REASON, reasonText: '' })
              }
            >
              {copy.recordAutoRejection}
            </Button>
            <Button variant="secondary" size="md" href={expertHubPaths.internalAgreements}>
              {copy.openAgreements}
            </Button>
          </div>
        </Alert>
      ) : (
        viewer.blockedReason != null && (
          <Typography as="p" variant="text-md" color="muted">
            {copy.blocked[viewer.blockedReason]}
          </Typography>
        )
      )}

      {/* AC-4 — the addendum is what finalizes the approval. */}
      <Modal
        open={approveOpen}
        onClose={() => setApproveOpen(false)}
        title={copy.approveDialog.title}
        dismissLabel={copy.approveDialog.dismiss}
        footer={
          <div className={styles.dialogActions}>
            <Button
              variant="primary"
              size="md"
              disabled={addendum == null}
              onClick={() =>
                addendum != null &&
                submit({ kind: 'approve', addendum, note }, () => setApproveOpen(false))
              }
            >
              {copy.approveDialog.confirm}
            </Button>
            <Button variant="tertiary" size="md" onClick={() => setApproveOpen(false)}>
              {copy.approveDialog.cancel}
            </Button>
          </div>
        }
      >
        <Typography as="p" variant="text-md">
          {copy.approveDialog.body}
        </Typography>
        <div className={styles.dialogField}>
          <FileUploader
            label={copy.approveDialog.addendumLabel}
            hint={copy.approveDialog.addendumHint}
            accept={ADDENDUM_FORMATS.map((format) => `.${format}`).join(',')}
            requiredField
            files={uploadFiles}
            onFilesSelected={handleFiles}
            onRemove={() => {
              fileCounter.current += 1;
              setAddendum(null);
              setUploadFiles([]);
            }}
            browseLabel={copy.approveDialog.browseLabel}
            removeLabel={copy.approveDialog.removeLabel}
          />
        </div>
        <div className={styles.dialogField}>
          <Textarea
            label={copy.approveDialog.noteLabel}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={3}
          />
        </div>
        {/* `BR-0305` — say what does NOT happen, since it is easy to assume. */}
        <Alert tone="info" role="note">
          {copy.approveDialog.noSignatureNote}
        </Alert>
      </Modal>

      {/* AC-3 — a reason is required; AC-7 — it stays internal. */}
      <Modal
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        title={copy.rejectDialog.title}
        dismissLabel={copy.rejectDialog.dismiss}
        footer={
          <div className={styles.dialogActions}>
            <Button
              variant="primary"
              size="md"
              onClick={() =>
                submit({ kind: 'reject', reasonId, reasonText }, () => setRejectOpen(false))
              }
            >
              {copy.rejectDialog.confirm}
            </Button>
            <Button variant="tertiary" size="md" onClick={() => setRejectOpen(false)}>
              {copy.rejectDialog.cancel}
            </Button>
          </div>
        }
      >
        <Typography as="p" variant="text-md">
          {copy.rejectDialog.body}
        </Typography>
        <div className={styles.dialogField}>
          <Select
            label={copy.rejectDialog.reasonLabel}
            placeholder={copy.rejectDialog.reasonPlaceholder}
            value={reasonId}
            onValueChange={(value) => {
              setReasonId(value);
              setError(null);
            }}
            options={reasons
              .filter((reason) => reason.system !== true)
              .map((reason) => ({
                value: reason.id,
                label: localized(reason.label, locale),
              }))}
            requiredField
            errorText={error ?? undefined}
          />
        </div>
        {selectedReason?.requiresText === true && (
          <div className={styles.dialogField}>
            <Textarea
              label={copy.rejectDialog.otherLabel}
              value={reasonText}
              onChange={(event) => {
                setReasonText(event.target.value);
                setError(null);
              }}
              requiredField
              rows={3}
            />
          </div>
        )}
        <Alert tone="info" role="note">
          {copy.rejectDialog.reasonPrivacyNote}
        </Alert>
      </Modal>
    </Panel>
  );
}
