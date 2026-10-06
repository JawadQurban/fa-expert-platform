import { useId, useMemo, useRef, useState } from 'react';
import { Button, Checkbox, Radio, RadioGroup, Select, TextInput, Typography } from '@ds/primitives';
import type { SelectOption } from '@ds/primitives';
import type { Locale } from '@/types';
import { localized } from '../types/localizedText';
import { validateSequenceFormation } from '../types/sequence';
import type {
  ApproverDto,
  ApproverObligation,
  FormationValidationCode,
  SequenceFormationInput,
  SequenceMemberInput,
  SequenceTemplateDto,
} from '../types/sequence';
import { Panel } from '../workspace/Panel';
import styles from './SequenceFormation.module.css';

/**
 * **P-J1 Sequence formation** — the shared mechanism behind J-09/F2 (approval
 * committee) and J-10/F2 (internal signing sequence).
 *
 * J-10/F2/AC-2 requires the mechanics to apply "exactly" as in J-09, while AC-3
 * insists the two remain distinct entities. One component with **injected copy**
 * satisfies both: the signing sequence speaks in its own terms without forking a
 * second implementation that would drift.
 *
 * Two rules are load-bearing and visible rather than implied:
 * - Selecting a template **copies** its members into the draft (J-09/F2/AC-5);
 *   the saved template is never mutated by edits made for this application, and
 *   the UI says so next to the field.
 * - The formation gate refuses a sequence that could never complete — no
 *   mandatory member (J-09), or no designated e-signer (J-10). Failing here
 *   beats stalling silently three approvals later.
 */
export interface SequenceFormationCopy {
  readonly heading: string;
  readonly description: string;
  readonly templateLabel: string;
  readonly templatePlaceholder: string;
  readonly templateNone: string;
  readonly templateCopyNote: string;
  readonly membersHeading: string;
  readonly membersHint: string;
  readonly rulesNote: string;
  readonly obligations: Readonly<Record<ApproverObligation, string>>;
  readonly obligationLegend: (name: string) => string;
  readonly moveUp: string;
  readonly moveDown: string;
  readonly remove: string;
  readonly addHeading: string;
  readonly addPlaceholder: string;
  readonly add: string;
  readonly positionLabel: (position: number) => string;
  readonly saveTemplateLabel: string;
  readonly saveTemplateNameLabel: string;
  readonly submit: string;
  readonly errorsHeading: string;
  /**
   * Only the rules this feature enables need a message — a code that cannot be
   * emitted here needs no unreachable copy.
   */
  readonly errors: Readonly<Partial<Record<FormationValidationCode, string>>>;
  /** Present only when e-signer designation is enabled (J-10/F2/AC-4). */
  readonly signerLabel?: string;
  readonly signerHint?: string;
}

export function SequenceFormation({
  approverPool,
  templates,
  copy,
  locale,
  submitting,
  requireMandatory = true,
  designateSigners = false,
  onSubmit,
}: {
  readonly approverPool: readonly ApproverDto[];
  readonly templates: readonly SequenceTemplateDto[];
  readonly copy: SequenceFormationCopy;
  readonly locale: Locale;
  readonly submitting: boolean;
  /** J-09 requires one; a feature can opt out. */
  readonly requireMandatory?: boolean;
  /** J-10/F2/AC-4 — show the e-signer checkbox and require at least one. */
  readonly designateSigners?: boolean;
  readonly onSubmit: (input: SequenceFormationInput) => void;
}) {
  const formId = useId();
  const errorsRef = useRef<HTMLDivElement>(null);

  const [members, setMembers] = useState<readonly SequenceMemberInput[]>([]);
  const [templateId, setTemplateId] = useState('');
  const [pendingApproverId, setPendingApproverId] = useState('');
  const [saveTemplate, setSaveTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [issues, setIssues] = useState<readonly FormationValidationCode[]>([]);

  const approverById = useMemo(
    () => new Map(approverPool.map((approver) => [approver.id, approver])),
    [approverPool]
  );

  const templateOptions: SelectOption[] = [
    { value: '', label: copy.templateNone },
    ...templates.map((template) => ({ value: template.id, label: template.name })),
  ];

  const availableApprovers = approverPool.filter(
    (approver) => !members.some((member) => member.approverId === approver.id)
  );

  const approverOptions: SelectOption[] = availableApprovers.map((approver) => ({
    value: approver.id,
    label: `${approver.name} — ${localized(approver.roleTitle, locale)}`,
  }));

  /** Reuse copies the template's members into the local draft (J-09/F2/AC-5). */
  const applyTemplate = (id: string) => {
    setTemplateId(id);
    setIssues([]);
    const template = templates.find((candidate) => candidate.id === id);
    setMembers(template == null ? [] : template.members.map((member) => ({ ...member })));
  };

  const patchMember = (approverId: string, patch: Partial<SequenceMemberInput>) => {
    setMembers((current) =>
      current.map((member) => (member.approverId === approverId ? { ...member, ...patch } : member))
    );
    setIssues([]);
  };

  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= members.length) {
      return;
    }
    setMembers((current) => {
      const next = [...current];
      const [moved] = next.splice(index, 1);
      next.splice(target, 0, moved);
      return next;
    });
  };

  const handleSubmit = () => {
    const input: SequenceFormationInput = {
      members,
      saveAsTemplateName: saveTemplate ? templateName : '',
    };
    const found = validateSequenceFormation(input, {
      requireMandatory,
      requireSigner: designateSigners,
      savingTemplate: saveTemplate,
    });
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
      {templates.length > 0 && (
        <div className={styles.templateRow}>
          <Select
            label={copy.templateLabel}
            placeholder={copy.templatePlaceholder}
            options={templateOptions}
            value={templateId}
            onValueChange={applyTemplate}
            helperText={copy.templateCopyNote}
          />
        </div>
      )}

      <section aria-labelledby={`${formId}-members`} className={styles.members}>
        <Typography as="h3" id={`${formId}-members`} variant="text-sm" weight="bold">
          {copy.membersHeading}
        </Typography>
        <Typography as="p" variant="text-sm" color="muted">
          {copy.membersHint}
        </Typography>
        <Typography as="p" variant="text-sm" color="muted">
          {copy.rulesNote}
        </Typography>

        <ol className={styles.list}>
          {members.map((member, index) => {
            const approver = approverById.get(member.approverId);
            const name = approver?.name ?? member.approverId;
            return (
              <li key={member.approverId} className={styles.member}>
                <div className={styles.memberHead}>
                  <div>
                    <Typography as="p" variant="text-sm" color="muted">
                      {copy.positionLabel(index + 1)}
                    </Typography>
                    <Typography as="p" variant="text-md" weight="bold">
                      {name}
                    </Typography>
                    <Typography as="p" variant="text-sm" color="muted">
                      {approver == null ? '' : localized(approver.roleTitle, locale)}
                    </Typography>
                  </div>
                  <div className={styles.memberActions}>
                    <Button
                      variant="tertiary"
                      size="sm"
                      onClick={() => move(index, -1)}
                      disabled={index === 0}
                    >
                      {copy.moveUp}
                    </Button>
                    <Button
                      variant="tertiary"
                      size="sm"
                      onClick={() => move(index, 1)}
                      disabled={index === members.length - 1}
                    >
                      {copy.moveDown}
                    </Button>
                    <Button
                      variant="tertiary"
                      size="sm"
                      onClick={() =>
                        setMembers((current) =>
                          current.filter((entry) => entry.approverId !== member.approverId)
                        )
                      }
                    >
                      {copy.remove}
                    </Button>
                  </div>
                </div>

                <RadioGroup
                  legend={copy.obligationLegend(name)}
                  name={`${formId}-obligation-${member.approverId}`}
                  value={member.obligation}
                  onValueChange={(value) =>
                    patchMember(member.approverId, {
                      obligation: value === 'optional' ? 'optional' : 'mandatory',
                    })
                  }
                >
                  <Radio value="mandatory" label={copy.obligations.mandatory} />
                  <Radio value="optional" label={copy.obligations.optional} />
                </RadioGroup>

                {/* J-10/F2/AC-4 — the e-signer is chosen at formation time, and
                    is not necessarily the last person in the sequence. */}
                {designateSigners && copy.signerLabel != null && (
                  <div className={styles.signerRow}>
                    <Checkbox
                      label={copy.signerLabel}
                      description={copy.signerHint}
                      checked={member.isSigner === true}
                      onChange={(event) =>
                        patchMember(member.approverId, { isSigner: event.target.checked })
                      }
                    />
                  </div>
                )}
              </li>
            );
          })}
        </ol>

        {availableApprovers.length > 0 && (
          <div className={styles.addRow}>
            <Select
              label={copy.addHeading}
              placeholder={copy.addPlaceholder}
              options={approverOptions}
              value={pendingApproverId}
              onValueChange={setPendingApproverId}
              fieldClassName={styles.addField}
            />
            <Button
              variant="secondary"
              size="md"
              onClick={() => {
                if (pendingApproverId === '') {
                  return;
                }
                setMembers((current) => [
                  ...current,
                  { approverId: pendingApproverId, obligation: 'mandatory' },
                ]);
                setPendingApproverId('');
                setIssues([]);
              }}
              disabled={pendingApproverId === ''}
            >
              {copy.add}
            </Button>
          </div>
        )}
      </section>

      <div className={styles.templateSave}>
        <Checkbox
          label={copy.saveTemplateLabel}
          checked={saveTemplate}
          onChange={(event) => {
            setSaveTemplate(event.target.checked);
            setIssues([]);
          }}
        />
        {saveTemplate && (
          <TextInput
            label={copy.saveTemplateNameLabel}
            value={templateName}
            onChange={(event) => {
              setTemplateName(event.target.value);
              setIssues([]);
            }}
            requiredField
          />
        )}
      </div>

      {issues.length > 0 && (
        <div
          ref={errorsRef}
          className={styles.errors}
          role="alert"
          tabIndex={-1}
          aria-labelledby={`${formId}-errors`}
        >
          <Typography as="h3" id={`${formId}-errors`} variant="text-md" weight="bold">
            {copy.errorsHeading}
          </Typography>
          <ul className={styles.errorList}>
            {issues.map((issue) => {
              const message = copy.errors[issue];
              return message == null ? null : <li key={issue}>{message}</li>;
            })}
          </ul>
        </div>
      )}

      <div>
        <Button variant="primary" size="md" onClick={handleSubmit} disabled={submitting}>
          {copy.submit}
        </Button>
      </div>
    </Panel>
  );
}
