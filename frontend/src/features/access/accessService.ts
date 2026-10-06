import type { Result } from '@/types';
import { isModuleLive } from '../../app/config/expertHubConfig';
import { createExpertHubApiClient } from '../../shared/services/apiClient';
import type { ExpertHubApiClient, ExpertHubApiError } from '../../shared/services/apiClient';
import { createMockAccessProvider } from './mockAccessProvider';
import type {
  AccessAuditEntryDto,
  AssignRoleInput,
  CentreDto,
  DataScope,
  PermissionMatrixDto,
  RoleCode,
  UserAccessDto,
} from './access.types';

/**
 * Expert Hub access-control service — **CAP-08** (`BRD-TRN-001` §8.8), the
 * System Administrator's half.
 *
 * **What this interface cannot do is the specification.**
 *
 * - **It cannot grant a permission to a user.** `BR-0801` grants exclusively
 *   through roles, so there is no operation and no input type that names a user
 *   and a permission together.
 * - **It cannot create or delete a role.** §8.8.5 fixes six; a seventh is a BRD
 *   amendment, not an administrative action.
 * - **It cannot touch authentication.** `BR-0808`: login, authentication and SSO
 *   are not managed by this capability *or by the platform*. Nothing here reads
 *   or writes a credential.
 * - **It cannot edit or delete an audit entry.** `BR-0806` makes the trail
 *   immutable, so the only audit operation is a read.
 *
 * Each mutation returns the **whole refreshed matrix or user** plus the trail,
 * because a grant change and its audit entry are one act (`BR-0806`) and the
 * client has no business reconstructing either.
 */

export const ACCESS_API_VERSION = 'v1';

export interface AccessService {
  /** `F-0801` — the matrix: roles × permissions, with each grant's data scope. */
  getPermissionMatrix(): Promise<Result<PermissionMatrixDto, ExpertHubApiError>>;
  /**
   * `F-0801` — set one cell. `dataScope` is `null` when revoking, because §8.8.3
   * scopes a *grant*; an ungranted permission has no scope to carry.
   */
  setGrant(
    roleCode: RoleCode,
    permissionId: string,
    granted: boolean,
    dataScope: DataScope | null
  ): Promise<Result<PermissionMatrixDto, ExpertHubApiError>>;

  /** `F-0802` — users and the roles they hold, searchable by name or email. */
  listUsers(query: string): Promise<Result<readonly UserAccessDto[], ExpertHubApiError>>;
  /**
   * The centres a coordinator can be scoped to (§8.8.5). Reference data owned
   * elsewhere and read here — the screen never carries the list itself.
   */
  listCentres(): Promise<Result<readonly CentreDto[], ExpertHubApiError>>;
  /** `F-0802` — assign one of the six. A coordinator must name its centre. */
  assignRole(
    userId: string,
    input: AssignRoleInput
  ): Promise<Result<UserAccessDto, ExpertHubApiError>>;
  revokeRole(userId: string, roleCode: RoleCode): Promise<Result<UserAccessDto, ExpertHubApiError>>;

  /** `BR-0806` — read-only, always. */
  listAuditTrail(): Promise<Result<readonly AccessAuditEntryDto[], ExpertHubApiError>>;
}

/** Future-API provider — already wired to the versioned endpoint shape. */
export function createHttpAccessProvider(
  client: ExpertHubApiClient = createExpertHubApiClient()
): AccessService {
  const base = `${ACCESS_API_VERSION}/internal/access`;
  return {
    getPermissionMatrix() {
      return client.get<PermissionMatrixDto>(`${base}/matrix`);
    },
    setGrant(roleCode, permissionId, granted, dataScope) {
      return client.post<PermissionMatrixDto>(`${base}/matrix/grants`, {
        roleCode,
        permissionId,
        granted,
        dataScope,
      });
    },
    listUsers(query) {
      const suffix = query.trim() === '' ? '' : `?q=${encodeURIComponent(query.trim())}`;
      return client.get<readonly UserAccessDto[]>(`${base}/users${suffix}`);
    },
    listCentres() {
      // Not under `/access`: the centre list is organizational reference data,
      // not part of the access model.
      return client.get<readonly CentreDto[]>(`${ACCESS_API_VERSION}/internal/centres`);
    },
    assignRole(userId, input) {
      return client.post<UserAccessDto>(`${base}/users/${encodeURIComponent(userId)}/roles`, input);
    },
    revokeRole(userId, roleCode) {
      return client.post<UserAccessDto>(
        `${base}/users/${encodeURIComponent(userId)}/roles/${roleCode}/revoke`
      );
    },
    listAuditTrail() {
      return client.get<readonly AccessAuditEntryDto[]>(`${base}/audit`);
    },
  };
}

function createDefaultService(): AccessService {
  return isModuleLive('access') ? createHttpAccessProvider() : createMockAccessProvider();
}

let serviceInstance: AccessService | null = null;

export function getAccessService(): AccessService {
  serviceInstance ??= createDefaultService();
  return serviceInstance;
}

/** Test seam: inject a seeded/failing provider (`null` restores the default). */
export function setAccessServiceForTesting(service: AccessService | null): void {
  serviceInstance = service;
}
