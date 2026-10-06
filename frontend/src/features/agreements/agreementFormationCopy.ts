import type { SequenceFormationCopy } from '../../shared/components/SequenceFormation';
import type { AgreementsContent } from './agreements.content';

/**
 * Adapts J-10's copy onto the shared P-J1 formation component.
 *
 * Same shape as J-09's adapter, different words — which is exactly the point of
 * J-10/F2/AC-3: identical mechanism, distinct entity. This one additionally
 * supplies the e-signer labels and the `no-signer-designated` message, because
 * J-10 is the journey that enables that rule.
 */
export function buildAgreementFormationCopy(content: AgreementsContent): SequenceFormationCopy {
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
    rulesNote: copy.rulesNote,
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
    errors: copy.errors,
    signerLabel: copy.signerLabel,
    signerHint: copy.signerHint,
  };
}
