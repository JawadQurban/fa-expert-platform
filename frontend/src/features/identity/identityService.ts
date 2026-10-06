import type { Result } from '@/types';
import { expertHubConfig, isModuleLive } from '../../app/config/expertHubConfig';
import { createExpertHubApiClient } from '../../shared/services/apiClient';
import type { ExpertHubApiClient, ExpertHubApiError } from '../../shared/services/apiClient';
import { createMockIdentityProvider } from './mockIdentityProvider';
import type {
  AccountResolutionDto,
  ManualIdentityInput,
  YaqeenVerificationInput,
  ResolvedIdentityDto,
} from './identity.types';
import type {
  ActivateAccountInput,
  ActivationContextDto,
  ActivationResultDto,
} from './activation.types';

/**
 * Identity Linking service — J-01's prerequisite layer.
 *
 * **The frontend never calls Yaqeen or FA.Auth.** Both sit behind the Expert Hub
 * API (`02C` §5), exactly like FAST/MTM/ERP: the browser has no business holding
 * a government-service credential, and the account-matching decision is the
 * server's to make. This service is the seam, and it is the only thing the
 * identity UI knows about.
 *
 * ⚠️ **The verification contract is open** — Yaqeen is reached through FAST
 * *rules* above it are not: J-01 §3 fixes the two paths and §5 fixes the five
 * and its wire is unsettled. Both are implemented against a labelled mock; closing it
 * replaces the provider and nothing else.
 */

export const IDENTITY_API_VERSION = 'v1';

export interface IdentityService {
  /**
   * J-01 §3A — Yaqeen, for citizens and residents only. Success returns the
   * trusted fields to auto-fill; failure "blocks progress with a clear error",
   * which is why this resolves to a typed error rather than a partial identity.
   */
  verifyWithYaqeen(
    input: YaqeenVerificationInput
  ): Promise<Result<ResolvedIdentityDto, ExpertHubApiError>>;
  /**
   * J-01 §3A — the manual path. No verification service exists for foreigners
   * and GCC nationals, so this records the declared identity and returns it
   * **unverified**. That is the journey's rule, not a shortcut.
   */
  recordManualIdentity(
    input: ManualIdentityInput
  ): Promise<Result<ResolvedIdentityDto, ExpertHubApiError>>;
  /**
   * J-01 §3B + §5 — account resolution against FA.Auth, returning one of the
   * five decision-table outcomes.
   *
   * For citizens/residents this runs the moment Yaqeen succeeds ("early enough
   * to block duplicates before effort is wasted", governing rule 4). For
   * foreigners/GCC it returns `deferred`, because the journey postpones their
   * matching to submission — the call is still made so the UI has one code path
   * and one answer shape either way.
   */
  resolveAccount(
    identity: ResolvedIdentityDto
  ): Promise<Result<AccountResolutionDto, ExpertHubApiError>>;

  /* ── J-02/F4 — nominee account activation ───────────────────────────── */

  /**
   * What the activation link resolves to: who was nominated, which application,
   * and **which of the three verification routes** applies (AC-1/AC-3). A token
   * that is invalid, expired or spent resolves to an error, never to a partial
   * context — there is no half-activated state to render.
   */
  getActivationContext(token: string): Promise<Result<ActivationContextDto, ExpertHubApiError>>;
  /**
   * Complete activation. On the Yaqeen route this delegates to the same
   * verification J-01 uses, so AC-2's "the same Yaqeen-failure handling from
   * J-01 applies" holds by construction.
   */
  activateAccount(
    token: string,
    input: ActivateAccountInput
  ): Promise<Result<ActivationResultDto, ExpertHubApiError>>;
}

/** Future-API provider — already wired to the versioned endpoint shape. */
export function createHttpIdentityProvider(
  client: ExpertHubApiClient = createExpertHubApiClient()
): IdentityService {
  const base = `${IDENTITY_API_VERSION}/identity`;
  return {
    verifyWithYaqeen(input) {
      // TODO: the real exchange is a Yaqeen request→poll→callback flow,
      // brokered server-side. The frontend contract is deliberately the simple
      // one — submit, await a resolved identity — so the polling lives where the
      // credential does.
      return client.post<ResolvedIdentityDto>(`${base}/yaqeen`, input);
    },
    recordManualIdentity(input) {
      return client.post<ResolvedIdentityDto>(`${base}/manual`, input);
    },
    resolveAccount(identity) {
      return client.post<AccountResolutionDto>(`${base}/account-resolution`, identity);
    },
    getActivationContext(token) {
      return client.get<ActivationContextDto>(`${base}/activation/${encodeURIComponent(token)}`);
    },
    activateAccount(token, input) {
      return client.post<ActivationResultDto>(
        `${base}/activation/${encodeURIComponent(token)}`,
        input
      );
    },
  };
}

/** What the fail-closed provider answers: nothing was, or can be, verified. */
export const IDENTITY_PROVIDER_NOT_CONFIGURED = 'identity-provider-not-configured';

export function isIdentityProviderNotConfigured(error: ExpertHubApiError): boolean {
  return error.message === IDENTITY_PROVIDER_NOT_CONFIGURED;
}

/**
 * **RB-01 — which identity provider this build may use.**
 *
 * The mock "verifies" any ID and returns fabricated trusted fields, so it is
 * allowed ONLY when the whole app is explicitly on demo data:
 *
 * - `apiBaseUrl` is empty — no backend at all (local dev, tests, a static demo
 *   build), so every module is already on its mock; or
 * - `expertHubConfig.dataMode === 'mock'` — no module is live
 *   (`EXPERT_HUB_DATA_MODE=mock`), the explicit all-demo switch.
 *
 * Anything else is a deployment with real modules and real sign-in. There, an
 * identity module with no live backend FAILS CLOSED rather than quietly falling
 * back to the mock, as it used to under `api:<list without identity>`.
 *
 * ⚠️ The runtime `environment` label is deliberately NOT a signal:
 * `deploy/env/local.env` labels a real host `development`.
 */
export function identityProviderKind(signals: {
  readonly identityLive: boolean;
  readonly apiBaseUrl: string;
  readonly dataMode: string;
}): 'http' | 'mock' | 'fail-closed' {
  if (signals.identityLive) {
    return 'http';
  }
  return signals.apiBaseUrl === '' || signals.dataMode === 'mock' ? 'mock' : 'fail-closed';
}

/** RB-01 — every call refuses; no identity, account match or activation is ever made up. */
export function createFailClosedIdentityProvider(): IdentityService {
  const refuse = () =>
    Promise.resolve({
      ok: false as const,
      error: { status: 503, message: IDENTITY_PROVIDER_NOT_CONFIGURED },
    });
  return {
    verifyWithYaqeen: refuse,
    recordManualIdentity: refuse,
    resolveAccount: refuse,
    getActivationContext: refuse,
    activateAccount: refuse,
  };
}

function createDefaultService(): IdentityService {
  const kind = identityProviderKind({
    identityLive: isModuleLive('identity'),
    apiBaseUrl: expertHubConfig.apiBaseUrl,
    dataMode: expertHubConfig.dataMode,
  });
  if (kind === 'http') {
    return createHttpIdentityProvider();
  }
  return kind === 'mock' ? createMockIdentityProvider() : createFailClosedIdentityProvider();
}

let serviceInstance: IdentityService | null = null;

export function getIdentityService(): IdentityService {
  serviceInstance ??= createDefaultService();
  return serviceInstance;
}

/** Test seam: inject a seeded/failing provider (`null` restores the default). */
export function setIdentityServiceForTesting(service: IdentityService | null): void {
  serviceInstance = service;
}
