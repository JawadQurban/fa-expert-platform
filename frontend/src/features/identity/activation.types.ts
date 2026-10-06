import type { ApplicationPresentationStatus } from '../applications/application.types';
import type { IdType, YaqeenVerificationInput } from './identity.types';

/**
 * **J-02/F4 — Nominee Account Activation & Portal Access.**
 *
 * When staff nominate someone (J-02/F1), an application exists in that person's
 * name before they have ever signed in. F4 is how they take ownership of it:
 * they open the activation link, prove who they are, and gain **full Trainer
 * Portal access** to track and act on it.
 *
 * The journey routes them one of three ways, and the choice is the **server's**
 * (P-J9) — it depends on facts the browser does not have (whether FA.Auth holds
 * a matched account, and which ID type staff recorded):
 *
 * - **AC-3 — `existing-account`.** A matched account already exists, so they
 *   "log into that existing account instead of re-verifying". Nothing is
 *   verified twice.
 * - **AC-1 — `yaqeen`.** No matched account, citizen/resident: they verify their
 *   own data through Yaqeen. This is the *same* `identityService.verifyWithYaqeen`
 *   J-01 uses, which is what makes **AC-2** ("the same Yaqeen-failure handling
 *   from J-01 applies") a fact about the code rather than a claim in a comment.
 * - **AC-1 — `email`.** No matched account, foreigner/GCC: verification is "via
 *   email", and the link they opened is that proof. Note this differs from
 *   J-01's manual path for the same ID type — J-01 has them type their document
 *   details because no email round-trip has happened yet; here one has.
 *
 * **AC-4 is encoded by omission.** "Full Trainer Portal access… **regardless of
 * the application's current screening stage**" means activation must not consult
 * the stage. `applicationStatus` therefore exists only so the nominee can *see*
 * where their application stands — no capability anywhere is keyed to it, and
 * `ActivationResultDto` carries no per-stage permissions to key one to.
 *
 * ⚠️ **`G4`** — the activation token's issuance, lifetime and single-use
 * semantics belong to the SSO/identity integration, still open. The frontend
 * contract is deliberately minimal: present a token, receive a context or an
 * error.
 *
 * ⚠️ The **invitation email itself** is J-02/F3, i.e. the missing **J-25**. What
 * is built here is what happens once the nominee follows the link.
 */

/** Which route this nominee takes. Server-decided; see the file header. */
export type ActivationVerification = 'existing-account' | 'yaqeen' | 'email';

/** Why a token cannot be used. Kept coarse on purpose — see below. */
export type ActivationTokenProblem = 'invalid' | 'expired' | 'already-used';

export interface ActivationContextDto {
  /** Who staff nominated, so the nominee can confirm the link is meant for them. */
  readonly nomineeName: string;
  /** The reference J-02/F1/AC-2 issued at staff submission. */
  readonly applicationReference: string;
  /**
   * ⚠️ **Display only.** AC-4 makes portal access independent of the screening
   * stage, so nothing gates on this. It is here because a nominee who has just
   * discovered an application exists in their name should be able to see where
   * it stands.
   */
  readonly applicationStatus: ApplicationPresentationStatus;
  readonly verification: ActivationVerification;
  /** The ID type staff recorded; `null` when a matched account makes it moot. */
  readonly idType: IdType | null;
}

/**
 * AC-1 · AC-3 — what the nominee submits.
 *
 * The Yaqeen variant carries `YaqeenVerificationInput` **unchanged**, so the
 * activation path and the application path cannot diverge in what they ask for
 * or how they validate it.
 */
export interface ActivateWithYaqeenInput extends YaqeenVerificationInput {
  readonly kind: 'yaqeen';
}

/** AC-1 — the emailed link is the proof; there is nothing further to supply. */
export interface ActivateWithEmailInput {
  readonly kind: 'email';
}

/** AC-3 — they sign in to the account that already exists. */
export interface ActivateWithExistingAccountInput {
  readonly kind: 'existing-account';
}

export type ActivateAccountInput =
  ActivateWithYaqeenInput | ActivateWithEmailInput | ActivateWithExistingAccountInput;

/**
 * AC-4 — the outcome. Deliberately **not** a permission set: activation either
 * happened or it did not, and access does not vary by screening stage. Adding a
 * capability field here would be the first step toward gating what the journey
 * says must not be gated.
 */
export interface ActivationResultDto {
  readonly activated: true;
  /** Where to send them: their own application, which they may now act on. */
  readonly applicationId: string;
}
