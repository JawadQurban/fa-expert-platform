import type { SequenceFormationCopy } from '../../shared/components/SequenceFormation';
import type { CommitteeContent } from './committee.content';

/**
 * Adapts J-09's own copy onto the shared P-J1 formation component.
 *
 * The adapter exists so the shared component never imports feature content —
 * J-10 supplies its own object in exactly the same shape, which is how one
 * mechanism serves two journeys that must stay distinct (J-10/F2/AC-3).
 *
 * Note the `errors` map lists only the codes J-09 can actually emit: it never
 * designates e-signers, so `no-signer-designated` needs no copy here.
 */
export function buildCommitteeFormationCopy(content: CommitteeContent): SequenceFormationCopy {
  const copy = content.formation;
  return {
    heading: copy.heading,
    description: copy.description,
    templateLabel: copy.templateLabel,
    templatePlaceholder: copy.templatePlaceholder,
    templateNone: copy.templateNone,
    templateCopyNote: copy.templateCopyNote,
    membersHeading: copy.membersHeading,
    membersHint: copy.membersHint,
    rulesNote: copy.mandatoryNote,
    obligations: copy.obligations,
    obligationLegend: copy.obligationLegend,
    moveUp: copy.moveUp,
    moveDown: copy.moveDown,
    remove: copy.remove,
    addHeading: copy.addHeading,
    addPlaceholder: copy.addPlaceholder,
    add: copy.add,
    positionLabel: copy.positionLabel,
    saveTemplateLabel: copy.saveTemplateLabel,
    saveTemplateNameLabel: copy.saveTemplateNameLabel,
    submit: copy.submit,
    errorsHeading: copy.errorsHeading,
    errors: {
      'no-members': copy.errors['no-members'],
      'no-mandatory-member': copy.errors['no-mandatory-member'],
      'duplicate-member': copy.errors['duplicate-member'],
      'template-name-missing': copy.errors['template-name-missing'],
    },
  };
}
