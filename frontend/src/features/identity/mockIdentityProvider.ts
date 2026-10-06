import type { ExpertHubApiError } from '../../shared/services/apiClient';
import type { IdentityService } from './identityService';
import {
  usesYaqeen,
  type AccountResolutionDto,
  type AccountResolutionOutcome,
  type ManualIdentityInput,
  type YaqeenVerificationInput,
  type ResolvedIdentityDto,
} from './identity.types';
import type {
  ActivateAccountInput,
  ActivationContextDto,
  ActivationResultDto,
  ActivationVerification,
} from './activation.types';

/**
 * Versioned **mock** provider for J-01's identity layer. It stands in for the
 * server's two responsibilities, both of which are the server's precisely
 * because the frontend must not hold the credentials:
 *
 * - brokering **Yaqeen** verification (citizens/residents), and
 * - matching against **FA.Auth** to produce one of J-01 §5's five outcomes.
 *
 * ⚠️ MOCK DATA (clearly labelled). The national IDs below are **not real** — the
 * last digit selects which edge case to demonstrate, so every row of the
 * decision table is reachable in development without a Yaqeen connection.
 *
 * | last digit | outcome |
 * |---|---|
 * | `0` | Yaqeen **fails** — blocked with a clear error |
 * | `1` | `blocked-trainer` — active Trainer role → J-03 |
 * | `2` | `blocked-open-application` — an application is already open |
 * | `3` | `matched-eligible` — previous application closed; prefill and proceed |
 * | any other | `no-match` — guest through the form, provisioned at submission |
 */

const OUTCOME_BY_LAST_DIGIT: Readonly<Record<string, AccountResolutionOutcome>> = {
  '1': 'blocked-trainer',
  '2': 'blocked-open-application',
  '3': 'matched-eligible',
};

/** ⚠️ MOCK — Yaqeen's trusted fields on success (J-01 §3A). */
const MOCK_TRUSTED_FIELDS: Readonly<Record<string, string>> = {
  fullName: 'عبدالله بن محمد العتيبي',
};

/** ⚠️ MOCK — the basic data J-01 §5 auto-fills for a matched, eligible account. */
const MOCK_PREFILL: Readonly<Record<string, string>> = {
  fullName: 'عبدالله بن محمد العتيبي',
  email: 'abdullah@example.sa',
  phone: '+966500000001',
};

/**
 * ⚠️ MOCK activation tokens (J-02/F4). The token's **suffix** selects the route,
 * so all three of AC-1/AC-3 plus every failure are reachable in development
 * without a real invitation email:
 *
 * | token suffix | route |
 * |---|---|
 * | `-yaqeen`   | AC-1 — no matched account, citizen/resident → Yaqeen |
 * | `-email`    | AC-1 — no matched account, foreigner/GCC → the link is the proof |
 * | `-account`  | AC-3 — a matched account exists → sign in, do not re-verify |
 * | `-expired`  | the token has lapsed |
 * | `-used`     | the token was already spent |
 * | anything else | invalid |
 */
const ACTIVATION_ROUTES: Readonly<Record<string, ActivationVerification>> = {
  '-yaqeen': 'yaqeen',
  '-email': 'email',
  '-account': 'existing-account',
};

export interface MockIdentityProviderOptions {
  readonly latencyMs?: number;
  readonly failWith?: ExpertHubApiError;
  /** Force one outcome regardless of the id, for tests that need a fixed path. */
  readonly forceOutcome?: AccountResolutionOutcome;
  /** Force Yaqeen to fail, for the §5 "verification fails" row. */
  readonly forceYaqeenFailure?: boolean;
}

function delay(ms: number): Promise<void> {
  return ms <= 0 ? Promise.resolve() : new Promise((resolve) => setTimeout(resolve, ms));
}

export function createMockIdentityProvider(
  options: MockIdentityProviderOptions = {}
): IdentityService {
  const { latencyMs = 300, failWith, forceOutcome, forceYaqeenFailure } = options;

  /** Remembers which id was verified, so resolution can key off the same digit. */
  let lastNationalId = '';

  return {
    async verifyWithYaqeen(input: YaqeenVerificationInput) {
      await delay(latencyMs);
      if (failWith != null) {
        return { ok: false, error: failWith };
      }
      const nationalId = input.nationalId.trim();
      // J-01 §5 row 1 — "Yaqeen verification fails (ID/DOB mismatch): block
      // progress; show clear error until corrected". A failure is an error, not
      // a half-resolved identity, so nothing downstream can proceed on one.
      if (forceYaqeenFailure === true || nationalId.endsWith('0')) {
        return {
          ok: false,
          error: { status: 422, message: 'Yaqeen verification failed.' },
        };
      }
      lastNationalId = nationalId;
      return {
        ok: true,
        value: {
          idType: 'citizen-resident',
          verified: true,
          trustedFields: MOCK_TRUSTED_FIELDS,
          fullName: MOCK_TRUSTED_FIELDS.fullName,
        },
      };
    },

    async recordManualIdentity(input: ManualIdentityInput) {
      await delay(latencyMs);
      if (failWith != null) {
        return { ok: false, error: failWith };
      }
      lastNationalId = input.documentNumber.trim();
      // J-01 §3A — no verification service exists for this category, so the
      // identity is recorded **unverified**. Nothing is "trusted", so nothing is
      // returned as trusted.
      return {
        ok: true,
        value: {
          idType: 'foreigner-gcc',
          verified: false,
          trustedFields: {},
          fullName: input.fullName.trim(),
        },
      };
    },

    async resolveAccount(identity: ResolvedIdentityDto) {
      await delay(latencyMs);
      if (failWith != null) {
        return { ok: false, error: failWith };
      }
      // J-01 §3B — foreigners/GCC cannot be matched live; the journey postpones
      // it to submission, by email. Returning `deferred` keeps one code path in
      // the UI instead of two, while still doing nothing early.
      if (!usesYaqeen(identity.idType)) {
        return {
          ok: true,
          value: { outcome: 'deferred', prefill: {}, existingApplicationId: null },
        };
      }

      const outcome: AccountResolutionOutcome =
        forceOutcome ?? OUTCOME_BY_LAST_DIGIT[lastNationalId.slice(-1)] ?? 'no-match';

      const value: AccountResolutionDto = {
        outcome,
        // J-01 §5 — basic data is auto-filled only for the matched-eligible row.
        prefill: outcome === 'matched-eligible' ? MOCK_PREFILL : {},
        existingApplicationId: outcome === 'blocked-open-application' ? 'app-011' : null,
      };
      return { ok: true, value };
    },

    /* ── J-02/F4 ─────────────────────────────────────────────────────────── */

    async getActivationContext(token: string) {
      await delay(latencyMs);
      if (failWith != null) {
        return { ok: false, error: failWith };
      }
      if (token.endsWith('-expired')) {
        return { ok: false, error: { status: 410, message: 'Activation token expired.' } };
      }
      if (token.endsWith('-used')) {
        return { ok: false, error: { status: 409, message: 'Activation token already used.' } };
      }
      const suffix = Object.keys(ACTIVATION_ROUTES).find((key) => token.endsWith(key));
      if (suffix == null) {
        return { ok: false, error: { status: 404, message: 'Activation token not found.' } };
      }
      const verification = ACTIVATION_ROUTES[suffix];
      const value: ActivationContextDto = {
        nomineeName: 'عبدالله بن محمد العتيبي',
        applicationReference: 'EH-2026-00214',
        // ⚠️ Deliberately a LATE stage. AC-4 makes access independent of it, so
        // the mock demonstrates activation succeeding well into screening rather
        // than only for a freshly-submitted application.
        applicationStatus: 'approval-in-progress',
        verification,
        idType:
          verification === 'yaqeen'
            ? 'citizen-resident'
            : verification === 'email'
              ? 'foreigner-gcc'
              : null,
      };
      return { ok: true, value };
    },

    // `token` is unused here: the mock re-derives nothing from it because the
    // route was already settled by `getActivationContext`. The real endpoint
    // consumes it (single-use semantics belong to `G4`).
    async activateAccount(_token: string, input: ActivateAccountInput) {
      await delay(latencyMs);
      if (failWith != null) {
        return { ok: false, error: failWith };
      }
      // AC-2 — the Yaqeen route reuses J-01's verification wholesale, so a
      // failure here fails for exactly the same reason and in the same shape.
      if (input.kind === 'yaqeen') {
        const verified = await this.verifyWithYaqeen({
          nationalId: input.nationalId,
          dateOfBirth: input.dateOfBirth,
        });
        if (!verified.ok) {
          return { ok: false, error: verified.error };
        }
      }
      // AC-4 — activation consults the application's stage nowhere. There is no
      // branch on it here, and no capability in the result to branch on later.
      const value: ActivationResultDto = { activated: true, applicationId: 'app-011' };
      return { ok: true, value };
    },
  };
}
