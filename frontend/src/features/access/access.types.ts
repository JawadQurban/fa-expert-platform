/**
 * Access control contracts — **CAP-08** (`BRD-TRN-001` §8.8), catalogued as
 * journey **J-26**.
 *
 * ⚠️ **Built from the BRD, not from a journey** (`Q17`) — §8.8 supplies the
 * entities, the authorization strategy, the three-layer model, the six roles and
 * four business rules. Where §8.8 is silent nothing is invented; `DM-GAP-07`
 * covers the one thing it does not give, which is the matrix *contents*.
 *
 * The capability's governing rule is a prohibition, and it is the reason this
 * file is shaped the way it is:
 *
 * > `BR-0801` — «لا تُمنح أي صلاحية مباشرة لمستخدم؛ تُمنح حصرًا عبر دور واحد
 * > أو أكثر من الأدوار الستة المعتمدة.»
 *
 * *No permission is granted directly to a user; exclusively through one or more
 * of the six approved roles.* **There is therefore no type in this file that
 * links a user to a permission**, and no operation on the service that could
 * create one. The rule is not enforced — it is unrepresentable.
 *
 * Three more rules are structural:
 *
 * - **`BR-0808` / `P-133`** — login, authentication and SSO are **not managed by
 *   this capability or by the platform at all**. Nothing here reads, stores or
 *   validates a credential; identity arrives from INT-01 and this capability
 *   only decides what the identified person may do.
 * - **§8.8.5 fixes six roles.** `RoleCode` is a closed union and the service has
 *   no create-role or delete-role operation — a seventh role is an amendment to
 *   the BRD, not a UI action.
 * - **`BR-0807`** — the matrix is **configuration, not code**: every grant is a
 *   row a System Administrator edits, and a permission change must never require
 *   a release.
 *
 * `BR-0806` requires every change here to be written to an immutable audit
 * trail, which is why each mutation returns the trail alongside the new state.
 */

/* ------------------------------------------------------------------ *
 * §8.8.5 — the six roles
 * ------------------------------------------------------------------ */

/**
 * The roles the platform recognises — the six §8.8.5 approves, in the order the
 * BRD lists them, plus the baseline `individual`.
 *
 * **Closed on purpose**: `BR-0801` grants permissions "exclusively through one
 * or more of the approved roles", so a new one cannot be added from a screen.
 *
 * ⚠️ `individual` is an **amendment to §8.8.5**, ruled by the owner on
 * 2026-09-08: everybody who signs in holds it. It is in the union rather than
 * outside it because a role the matrix cannot govern is exactly what `BR-0801`
 * forbids — and because the access screen has to be able to show what a person
 * holds, including this.
 */
export const ROLE_CODES = [
  'trainer',
  'staff',
  'manager',
  'centre_coordinator',
  'system_administrator',
  'executive',
  // Last, because it is an appended amendment rather than one of the six — and
  // because that is the order the platform serves them in (`ROLE.role_id`).
  'individual',
] as const;

export type RoleCode = (typeof ROLE_CODES)[number];

/**
 * The role whose access is **scoped to one centre** — §8.8.5: «ينشئ طلبات إسناد
 * المدربين ويتابعها **لمركزه**، ويراجع حالة الطلبات والتعيينات **ضمن نطاق طلبه
 * فقط**». It is the only role with a scope narrower than the platform, which is
 * why the assignment type below treats it separately.
 */
export const SCOPED_ROLE = 'centre_coordinator' satisfies RoleCode;

export interface RoleDto {
  readonly roleCode: RoleCode;
  readonly nameAr: string;
  readonly nameEn: string;
  /** §8.8.5's own description of the role's operational responsibility. */
  readonly descriptionAr: string;
  readonly descriptionEn: string;
  /** Always `true` for the six. There is no path that creates a role. */
  readonly isSystem: true;
}

/* ------------------------------------------------------------------ *
 * §8.8.4 — the permission layer
 * ------------------------------------------------------------------ */

/**
 * §8.8.4: a permission «تمثّل كل خاصية داخل قدرة من القدرات الاثنتي عشرة كوحدة
 * يمكن ضبط الوصول إليها» — **one permission per capability feature**. So the
 * permission list is the BRD's feature list, and nothing else.
 */
export interface PermissionDto {
  readonly permissionId: string;
  /** `CAP-01` … `CAP-12`. */
  readonly capabilityCode: string;
  /** The BRD's own feature code, e.g. `F-0801`. */
  readonly featureCode: string;
  readonly nameAr: string;
  readonly nameEn: string;
  /**
   * ⚠️ `true` where the label was extracted from the BRD PDF and may be
   * truncated by its table layout. The **code** is verified; the wording is not.
   * Part of `DM-GAP-07`.
   */
  readonly labelNeedsVerification: boolean;
}

/* ------------------------------------------------------------------ *
 * §8.8.3 — "access is governed for functions and data together"
 * ------------------------------------------------------------------ */

/**
 * §8.8.3: «يُضبط الوصول للوظائف **والبيانات معًا**، وفق مسؤولية المستخدم ونطاق
 * عمله» — a grant carries not just *whether* but *over what*.
 *
 * ⚠️ Which scope each role gets on each permission is `DM-GAP-07`. The three
 * values come from §8.8.5's own descriptions: platform-wide, the user's own
 * records, or a single centre.
 */
export const DATA_SCOPES = ['all', 'own', 'centre'] as const;

export type DataScope = (typeof DATA_SCOPES)[number];

/**
 * One cell of the matrix `F-0801` manages. **This is the only grant type in the
 * product** — see `BR-0801` in the module note.
 */
export interface RolePermissionDto {
  readonly roleCode: RoleCode;
  readonly permissionId: string;
  readonly granted: boolean;
  /** Meaningful only when `granted`; `null` otherwise. */
  readonly dataScope: DataScope | null;
}

/* ------------------------------------------------------------------ *
 * §8.8.6 / `F-0802` — users and their roles
 * ------------------------------------------------------------------ */

/**
 * One role held by one user.
 *
 * A **discriminated union on the role**, so the centre-coordinator scope cannot
 * be forgotten and cannot be set on a role that has no centre: `scopeRef` is
 * **required** on the scoped member and **absent** from every other. A
 * coordinator with no centre is unrepresentable rather than merely invalid.
 */
export type AssignedRoleDto =
  | {
      readonly roleCode: 'centre_coordinator';
      /** The centre whose requests this coordinator may see (§8.8.5). */
      readonly scopeRef: string;
      readonly scopeName: string;
      readonly assignedByName: string;
      readonly assignedAt: string;
    }
  | {
      readonly roleCode: Exclude<RoleCode, 'centre_coordinator'>;
      readonly assignedByName: string;
      readonly assignedAt: string;
    };

/**
 * FAST's three "Expert" flags, as codes.
 *
 * ⚠️ They do **not** line up with Expert Hub's four services — only the question
 * author has an obvious counterpart (`Q22`). Carried as codes so the screen
 * names them in the reader's language, rather than the API settling wording for
 * a mapping nobody has ruled on.
 */
export const FAST_EXPERT_POWERS = ['corrector', 'reviewer', 'question_author'] as const;

export type FastExpertPower = (typeof FAST_EXPERT_POWERS)[number];

/**
 * Who a person is **in FAST** — read at sign-in from `Users/Info` (`P-227`).
 *
 * ⚠️ **This grants nothing.** `BR-0801` and `P-181` fix that access comes from
 * Expert Hub's own roles; what FAST calls someone is context for the
 * administrator making that decision, and the type says so by having no field a
 * grant could be derived from. It carries `lastSyncedAt` because the replica is
 * only ever as fresh as that person's last sign-in, and a stale fact presented
 * as current is worse than one presented with its date.
 */
export interface FastProfileDto {
  readonly idNumber: string | null;
  readonly organization: string | null;
  readonly jobTitle: string | null;
  /** FAST's own answer to "does this person work for the Academy?" */
  readonly isEmployee: boolean;
  /** FAST's role labels, in FAST's own wording. */
  readonly fastRoles: readonly string[];
  readonly expertPowers: readonly FastExpertPower[];
  readonly lastSyncedAt: string;
}

export interface UserAccessDto {
  readonly userId: string;
  readonly displayName: string;
  readonly email: string;
  /** `US-0802` — "one or more roles". A user with none simply has no access. */
  readonly roles: readonly AssignedRoleDto[];
  readonly isActive: boolean;
  /**
   * **Absent, not empty**, for anyone whose profile has never been read — which
   * is everyone who has not signed in since the import shipped. An empty panel
   * would say "FAST knows nothing about them"; absence says "we have not asked
   * yet", and those are different facts.
   */
  readonly fastProfile?: FastProfileDto;
}

/**
 * A centre the coordinator role can be scoped to (§8.8.5).
 *
 * **Served, never held locally.** Centres are an organizational list that CAP-05
 * already owns; CAP-08 only needs to name one. Hard-coding them in the screen
 * would have put a business list in the presentation layer, where nothing keeps
 * it in step with the organization.
 */
export interface CentreDto {
  readonly centreId: string;
  readonly nameAr: string;
  readonly nameEn: string;
}

/** The input mirrors the union, so the same rule holds on the way in. */
export type AssignRoleInput =
  | { readonly roleCode: 'centre_coordinator'; readonly scopeRef: string }
  | { readonly roleCode: Exclude<RoleCode, 'centre_coordinator'> };

export type AccessValidationCode = 'scope-required' | 'already-assigned';

/** `BR-0801` again, on the way in: a coordinator must name a centre. */
export function validateAssignRole(
  input: AssignRoleInput,
  existing: readonly AssignedRoleDto[]
): readonly AccessValidationCode[] {
  const issues: AccessValidationCode[] = [];
  if (input.roleCode === 'centre_coordinator' && input.scopeRef.trim() === '') {
    issues.push('scope-required');
  }
  if (existing.some((role) => role.roleCode === input.roleCode)) {
    issues.push('already-assigned');
  }
  return issues;
}

/* ------------------------------------------------------------------ *
 * `BR-0806` — the audit trail
 * ------------------------------------------------------------------ */

/**
 * `BR-0806`: «كل تغيير على الصلاحيات أو الأدوار يُسجَّل بسجل التدقيق، **غير
 * قابل للتعديل أو الحذف**» — so the trail is append-only and this contract has
 * no operation that edits or removes an entry.
 */
export interface AccessAuditEntryDto {
  readonly entryId: string;
  readonly kind: 'grant-changed' | 'role-assigned' | 'role-revoked';
  readonly actorName: string;
  readonly summaryAr: string;
  readonly summaryEn: string;
  readonly occurredAt: string;
}

/* ------------------------------------------------------------------ *
 * The matrix as served
 * ------------------------------------------------------------------ */

export interface PermissionMatrixDto {
  readonly roles: readonly RoleDto[];
  readonly permissions: readonly PermissionDto[];
  readonly grants: readonly RolePermissionDto[];
  /**
   * ⚠️ `DM-GAP-07` — the approved contents do not exist. `unapproved` means the
   * grid is a working draft, and the page says so rather than presenting an
   * invented matrix as policy (the same handling as `DM-GAP-02`/`DM-GAP-05`).
   */
  readonly modelStatus: 'unapproved' | 'approved';
  /** How many of the 58 feature codes carry a label still to be verified. */
  readonly unverifiedLabelCount: number;
}

/** Convenience for the grid — grants keyed for O(1) lookup. */
export function grantKey(roleCode: RoleCode, permissionId: string): string {
  return `${roleCode}::${permissionId}`;
}
