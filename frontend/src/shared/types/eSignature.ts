/**
 * **P-J10 — the in-platform e-signature.**
 *
 * Shared because J-11 says so, literally: J-11/F1/AC-3 requires the applicant to
 * e-sign "within the platform — using **the same e-signature mechanism built in
 * J-10**". Two implementations of "the same mechanism" would drift the moment
 * either side changed, so the mechanism lives here and both journeys consume it:
 *
 * - **J-10/F3/AC-4** — a designated internal signer signs the prepared agreement.
 * - **J-11/F1/AC-3** — the applicant signs the fully internally-signed agreement,
 *   which activates it and generates the final PDF (F2/AC-1).
 *
 * ⚠️ **`G26` is open.** No cryptographic signing, certificate authority, or
 * document-storage integration is settled yet, so the captured artefact is the
 * signer's **typed full name** plus the server's timestamp — the same stand-in
 * J-10 already ships. It is deliberately modelled as its own input type rather
 * than a bare string, so replacing it with a real signature payload is a change
 * to one contract instead of a hunt through two features.
 */

/** What the signer supplies. One field today; a real payload later (`G26`). */
export interface ESignatureInput {
  /** The signer's typed full name (stand-in for the signature artefact). */
  readonly signatureName: string;
}

/** The single way an e-signature can be refused today. */
export type ESignatureValidationCode = 'signature-missing';

/**
 * A signature must actually be given. Returned as a code, never a message —
 * copy belongs to the consuming feature's content file.
 */
export function validateESignature(input: ESignatureInput): ESignatureValidationCode | null {
  return input.signatureName.trim() === '' ? 'signature-missing' : null;
}
