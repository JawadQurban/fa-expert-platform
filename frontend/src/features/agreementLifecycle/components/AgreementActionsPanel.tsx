import { useState } from 'react';
import { Alert, Modal } from '@ds/composite';
import { Button, Checkbox, Textarea, Typography } from '@ds/primitives';
import type { AgreementDetailDto, AgreementLifecycleInput } from '../agreementLifecycle.types';
import type { AgreementLifecycleContent } from '../agreementLifecycle.content';
import { Panel } from '../../../shared/workspace/Panel';
import styles from './AgreementActionsPanel.module.css';

/**
 * **J-12/F2 + F3** — the lifecycle actions on one agreement.
 *
 * What the journey makes visible here:
 *
 * - **F2/AC-1 — renewal is direct.** The absence of a "send back to screening"
 *   step is *stated*, not left as a gap, for the same reason as J-03/F3/AC-1: a
 *   missing stage reads as a bug unless something explains it.
 * - **F2/AC-2 — the term is announced, never asked for.** The dialog names the
 *   term `BR-0302` produced and the date it yields, and says the length is set
 *   by rule. There is no duration field, because the rule is the server's.
 * - **F3 — ending is terminal, suspending is not.** Ending takes an explicit
 *   acknowledgement and points at suspension as the reversible alternative; the
 *   J-11/AC-4 precedent, applied to the other irreversible act in the product.
 *
 * Which actions exist at all is decided by the agreement's status
 * (`allowedActions`) and the viewer's rights (`viewer`, P-J9) — never inferred
 * here from a role string, since J-26 has no document yet.
 */
type DialogKind = AgreementLifecycleInput['kind'] | null;

export function AgreementActionsPanel({
  agreement,
  content,
  busy,
  formatDate,
  onAct,
}: {
  readonly agreement: AgreementDetailDto;
  readonly content: AgreementLifecycleContent;
  readonly busy: boolean;
  readonly formatDate: (iso: string) => string;
  readonly onAct: (input: AgreementLifecycleInput) => void;
}) {
  const copy = content.actions;
  const [open, setOpen] = useState<DialogKind>(null);
  const [note, setNote] = useState('');
  const [acknowledged, setAcknowledged] = useState(false);

  const { viewer } = agreement;
  const available: AgreementLifecycleInput['kind'][] = [
    ...(viewer.canRenew ? (['renew'] as const) : []),
    ...(viewer.canReactivate ? (['reactivate'] as const) : []),
    ...(viewer.canSuspend ? (['suspend'] as const) : []),
    ...(viewer.canEnd ? (['end'] as const) : []),
  ];

  const close = () => {
    setOpen(null);
    setNote('');
    setAcknowledged(false);
  };

  const submit = (kind: AgreementLifecycleInput['kind']) => {
    close();
    onAct({ kind, note });
  };

  const dialogFooter = (
    kind: AgreementLifecycleInput['kind'],
    confirmLabel: string,
    disabled = false
  ) => (
    <div className={styles.dialogActions}>
      <Button variant="primary" size="md" disabled={disabled} onClick={() => submit(kind)}>
        {confirmLabel}
      </Button>
      <Button variant="tertiary" size="md" onClick={close}>
        {copy.cancel}
      </Button>
    </div>
  );

  const noteField = (
    <div className={styles.dialogField}>
      <Textarea
        label={copy.noteLabel}
        value={note}
        onChange={(event) => setNote(event.target.value)}
        rows={3}
      />
    </div>
  );

  return (
    <Panel shape="inline" title={copy.heading} titleId="eh-actions-heading" focusableTitle>
      {/* F2/AC-1 — the direct route is stated, so its directness is a rule. */}
      {viewer.canRenew && (
        <Alert tone="info" surface="tinted" role="status">
          {copy.directRenewalNote}
        </Alert>
      )}

      {available.length === 0 ? (
        <Typography as="p" variant="text-sm" color="muted">
          {copy.noneAvailable}
        </Typography>
      ) : (
        <div className={styles.actions}>
          {available.map((kind) => (
            <Button
              key={kind}
              variant={kind === 'renew' || kind === 'reactivate' ? 'primary' : 'secondary'}
              size="md"
              disabled={busy}
              onClick={() => setOpen(kind)}
            >
              {copy.labels[kind]}
            </Button>
          ))}
        </div>
      )}

      {/* F2 — the term is announced. */}
      <Modal
        open={open === 'renew'}
        onClose={close}
        title={copy.renewDialog.title}
        dismissLabel={copy.dismiss}
        footer={dialogFooter('renew', copy.renewDialog.confirm)}
      >
        <Typography as="p" variant="text-md">
          {copy.renewDialog.body(agreement.nextTermYears, formatDate(agreement.renewedEndsAt))}
        </Typography>
        {/* `BR-0302` — say that the length is not a choice anyone made here. */}
        <Alert tone="info" role="note">
          {copy.renewDialog.termNote(agreement.nextTermYears)}
        </Alert>
        {noteField}
      </Modal>

      <Modal
        open={open === 'suspend'}
        onClose={close}
        title={copy.suspendDialog.title}
        dismissLabel={copy.dismiss}
        footer={dialogFooter('suspend', copy.suspendDialog.confirm)}
      >
        <Typography as="p" variant="text-md">
          {copy.suspendDialog.body}
        </Typography>
        {noteField}
      </Modal>

      <Modal
        open={open === 'reactivate'}
        onClose={close}
        title={copy.reactivateDialog.title}
        dismissLabel={copy.dismiss}
        footer={dialogFooter('reactivate', copy.reactivateDialog.confirm)}
      >
        <Typography as="p" variant="text-md">
          {copy.reactivateDialog.body}
        </Typography>
        {noteField}
      </Modal>

      {/* F3 — terminal, and said so before it happens. */}
      <Modal
        open={open === 'end'}
        onClose={close}
        title={copy.endDialog.title}
        dismissLabel={copy.dismiss}
        footer={dialogFooter('end', copy.endDialog.confirm, !acknowledged)}
      >
        <Alert tone="warning" role="note">
          {copy.endDialog.warning}
        </Alert>
        <Typography as="p" variant="text-md">
          {copy.endDialog.body}
        </Typography>
        {noteField}
        <div className={styles.dialogField}>
          <Checkbox
            label={copy.endDialog.acknowledgeLabel}
            checked={acknowledged}
            onChange={(event) => setAcknowledged(event.target.checked)}
          />
        </div>
      </Modal>
    </Panel>
  );
}
