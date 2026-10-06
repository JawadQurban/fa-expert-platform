import type { ApplicationService } from './application.types';
import type {
  ApplicationAttachmentRule,
  ApplicationFieldSchema,
  ApplicationFieldValue,
  ApplicationFormSchemaDto,
} from './applicationForm.types';

/**
 * EH-TP-06 (Add Service) contracts — CAP-01, flow J3. An **approved** trainer
 * widens their scope with minimal friction: request a new service without a full
 * re-application. Consumed **only** through `applicationsService` (mock now, the
 * Expert Hub API later).
 *
 * The request **bypasses screening/interview** and routes straight to an admin
 * decision (`BR-0112`); on approval it becomes an **annex** to the existing
 * agreement, not a new one (`BR-0305`). Only the **delta** fields — those not
 * already on file for the current services (`BR-0111`) — are collected, and a
 * service that is already approved cannot be requested again (`BR-0110`).
 */

/** Read to open the page: the current approved scope + eligibility (`§5`). */
export interface AddServiceContextDto {
  readonly applicationId: string;
  /** The approved application's reference (issued at original submission). */
  readonly reference: string;
  /** Currently approved services — **FAST-sourced**, read-only (duplicate guard). */
  readonly currentServices: readonly ApplicationService[];
  /**
   * `false` ⇒ FAST could not be read, so current services can't be verified;
   * the page blocks with a reason rather than risk a duplicate (`§9`/P-17).
   */
  readonly fastAvailable: boolean;
  /** `true` only for an approved trainer with an active agreement (entry cond.). */
  readonly eligible: boolean;
}

export interface AddServiceRequestInput {
  readonly service: ApplicationService;
  /** Only the delta field values (`BR-0111`). */
  readonly values: Readonly<Record<string, ApplicationFieldValue>>;
  /** Delta attachment references (`BR-0106` validated on select). */
  readonly attachments: readonly {
    readonly ruleId: string;
    readonly fileName: string;
    readonly sizeBytes: number;
  }[];
}

/** Successful add-service submission (routed to the admin decision path, `BR-0112`). */
export interface AddServiceRequestDto {
  readonly requestId: string;
  readonly submittedAt: string;
}

/* ------------------------------------------------------------------ *
 * The delta rules — J-03/F1/AC-1 · AC-2
 * ------------------------------------------------------------------ */

/**
 * **F1/AC-1** — the services a trainer may actually request: everything
 * selectable, minus what they already hold. Previously approved services are
 * *excluded* from the list, not offered-and-disabled (`BR-0110`).
 */
export function availableServicesFor(
  schema: ApplicationFormSchemaDto,
  currentServices: readonly ApplicationService[]
): readonly ApplicationService[] {
  return schema.selectableServices.filter((service) => !currentServices.includes(service));
}

/**
 * **F1/AC-2** — "only the **mandatory** fields specific to that service, missing
 * from the trainer's existing profile, are requested — no re-entry of already-held
 * data". Three conditions, one per clause of the AC:
 *
 * 1. `visibleFor` includes the new service → *specific to that service*;
 * 2. `requiredFor` includes the new service → **mandatory**;
 * 3. no already-approved service shows it → *missing from the existing profile*.
 *
 * The mandatory clause was added on 2026-08-19. It is a no-op against today's
 * mock schema (both service-specific fields there are required), and that is the
 * point: it stops an optional field added later from quietly re-creating the
 * onboarding friction this journey exists to remove.
 */
export function deltaFieldsFor(
  schema: ApplicationFormSchemaDto,
  service: ApplicationService,
  currentServices: readonly ApplicationService[]
): readonly ApplicationFieldSchema[] {
  return schema.fields
    .filter(
      (field) =>
        field.visibleFor?.includes(service) === true &&
        field.requiredFor.includes(service) &&
        !currentServices.some((held) => field.visibleFor?.includes(held) === true)
    )
    .slice()
    .sort((a, b) => a.order - b.order);
}

/**
 * **F1/AC-2** for files. Attachment rules are keyed by `requiredFor` only, so
 * they are mandatory by construction — the filter is the delta half of the rule.
 */
export function deltaAttachmentsFor(
  schema: ApplicationFormSchemaDto,
  service: ApplicationService,
  currentServices: readonly ApplicationService[]
): readonly ApplicationAttachmentRule[] {
  return schema.attachments.filter(
    (rule) =>
      rule.requiredFor.includes(service) &&
      !currentServices.some((held) => rule.requiredFor.includes(held))
  );
}
