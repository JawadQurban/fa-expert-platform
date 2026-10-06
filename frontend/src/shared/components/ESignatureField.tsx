import { TextInput } from '@ds/primitives';
import type { ESignatureInput } from '../types/eSignature';

/**
 * **P-J10 — the in-platform e-signature capture**, shared by J-10/F3/AC-4
 * (internal signer) and J-11/F1/AC-3 (applicant), which requires "the same
 * e-signature mechanism built in J-10".
 *
 * Deliberately thin: it is the *mechanism*, not a layout. Copy is injected so
 * each journey speaks in its own terms — the internal signer signs on behalf of
 * the Academy, the applicant signs for themselves — while the captured artefact,
 * its validation, and its accessibility behaviour stay identical.
 *
 * ⚠️ `G26` — the artefact is the typed full name; see `types/eSignature.ts`.
 */
export interface ESignatureFieldCopy {
  readonly label: string;
  readonly hint: string;
}

export function ESignatureField({
  value,
  copy,
  error,
  onChange,
}: {
  readonly value: ESignatureInput['signatureName'];
  readonly copy: ESignatureFieldCopy;
  /** Already-localized message, or `null`. Codes are translated by the feature. */
  readonly error: string | null;
  readonly onChange: (signatureName: string) => void;
}) {
  return (
    <TextInput
      label={copy.label}
      helperText={copy.hint}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      requiredField
      errorText={error ?? undefined}
      autoComplete="name"
    />
  );
}
