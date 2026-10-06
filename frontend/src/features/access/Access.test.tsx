import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  clearExpertHubSession,
  expectNoA11yViolations,
  fireEvent,
  renderExpertHubAt,
  screen,
  within,
  seedExpertHubSession,
} from '../../test/renderExpertHub';
import { expertHubPaths } from '../../app/router/paths';
import { getHeaderContent } from '../../shared/content/header.content';
import { setAccessServiceForTesting } from './accessService';
import { createMockAccessProvider, MOCK_PERMISSIONS, MOCK_ROLES } from './mockAccessProvider';
import type { MockAccessProviderOptions } from './mockAccessProvider';
import { getAccessContent } from './access.content';
import { ROLE_CODES, validateAssignRole, type AssignedRoleDto } from './access.types';

/**
 * CAP-08 — roles & permissions administration (`BRD-TRN-001` §8.8), EH-INT-14.
 *
 * Most of §8.8 is a set of prohibitions, so most of these tests assert that
 * something **cannot happen** rather than that something does: `BR-0801` (no
 * direct grant to a user), §8.8.5 (no seventh role), `BR-0806` (no way to edit
 * the trail), `BR-0808` (no authentication anywhere in the capability).
 *
 * `DM-GAP-07` — the approved matrix *contents* do not exist. The tests pin the
 * grid to *empty and marked unapproved*, so a future seed of plausible defaults
 * fails here rather than shipping as policy.
 */

const content = getAccessContent('ar');

function injectProvider(options: MockAccessProviderOptions = {}) {
  setAccessServiceForTesting(createMockAccessProvider({ latencyMs: 0, ...options }));
}

async function renderMatrix() {
  seedExpertHubSession(['internal']);
  const result = renderExpertHubAt(expertHubPaths.internalAccessPermissions);
  await screen.findByRole('heading', { level: 1, name: content.matrix.title });
  return result;
}

async function renderUsers() {
  seedExpertHubSession(['internal']);
  const result = renderExpertHubAt(expertHubPaths.internalAccessUsers);
  await screen.findByRole('heading', { level: 1, name: content.users.title });
  return result;
}

/**
 * Narrow the 58 × 6 grid to one row, so a test names one cell unambiguously.
 *
 * `fireEvent.change` rather than `user.type`: a keystroke-by-keystroke type
 * re-renders 348 live cells six times over, which jsdom takes ~34s to do. The
 * assertion is about the filter's result, not about typing, so the query is set
 * in one change. (A browser renders the same grid in a frame — this is a jsdom
 * cost, not a screen that is slow for the administrator.)
 */
async function filterTo(code: string) {
  fireEvent.change(screen.getByLabelText(content.matrix.searchLabel), {
    target: { value: code },
  });
  return screen.findByRole('checkbox', {
    name: content.matrix.grantedLabel(content.roles.staff, code),
  });
}

/** The one cell every grid test drives: `F-0801` × موظف إدارة المدربين. */
function staffCell(code: string) {
  return screen.getByRole('checkbox', {
    name: content.matrix.grantedLabel(content.roles.staff, code),
  });
}

describe('CAP-08 — roles & permissions administration', () => {
  beforeEach(() => {
    clearExpertHubSession();
    injectProvider();
  });

  afterEach(() => {
    setAccessServiceForTesting(null);
  });

  /* ── BR-0801 — grants happen through roles, and only through roles ─────── */

  it('BR-0801: no operation names a user and a permission together', () => {
    const service = createMockAccessProvider({ latencyMs: 0 });
    // The rule is not enforced by a guard — there is no door to guard.
    expect(Object.keys(service).sort()).toEqual([
      'assignRole',
      'getPermissionMatrix',
      'listAuditTrail',
      'listCentres',
      'listUsers',
      'revokeRole',
      'setGrant',
    ]);
    for (const forbidden of [
      'grantPermissionToUser',
      'setUserPermission',
      'listUserPermissions',
      'overridePermission',
    ]) {
      expect(Object.keys(service)).not.toContain(forbidden);
    }
  });

  it('BR-0801: the matrix screen says the absence of a per-user grant is the rule', async () => {
    await renderMatrix();
    expect(screen.getByText(content.matrix.noDirectGrantNote)).toBeInTheDocument();
  });

  /* ── §8.8.5 — six roles, fixed ─────────────────────────────────────────── */

  it('§8.8.5: a closed set of roles, and no operation creates or deletes one', () => {
    /*
     * §8.8.5 approved six. `individual` is the seventh — the baseline role the
     * owner added on 2026-09-08 — and it is counted here rather than excused,
     * so the number stays something a reader can check against the BRD plus
     * its one recorded amendment.
     */
    expect(ROLE_CODES).toHaveLength(7);
    expect(ROLE_CODES).toContain('individual');
    expect(MOCK_ROLES.map((role) => role.roleCode)).toEqual([...ROLE_CODES]);
    expect(MOCK_ROLES.every((role) => role.isSystem)).toBe(true);
    const service = createMockAccessProvider({ latencyMs: 0 });
    for (const forbidden of ['createRole', 'deleteRole', 'renameRole']) {
      expect(Object.keys(service)).not.toContain(forbidden);
    }
  });

  it('§8.8.5: the screen has no add-role control, and says why', async () => {
    await renderMatrix();
    expect(screen.getByText(content.matrix.rolesFixedNote)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /إضافة دور|دور جديد/ })).not.toBeInTheDocument();
  });

  /* ── §8.8.4 — one permission per capability feature ────────────────────── */

  it('§8.8.4: the permission list is the BRD’s feature list, with no invented entries', () => {
    expect(MOCK_PERMISSIONS.length).toBeGreaterThan(0);
    const codes = MOCK_PERMISSIONS.map((permission) => permission.featureCode);
    expect(new Set(codes).size).toBe(codes.length);
    for (const permission of MOCK_PERMISSIONS) {
      expect(permission.featureCode).toMatch(/^F-\d{4}$/);
      // A feature code carries its own capability: F-08xx belongs to CAP-08.
      expect(permission.capabilityCode).toBe(`CAP-${permission.featureCode.slice(2, 4)}`);
    }
  });

  it('§8.8.4: the grid is configured one capability at a time, and search escapes it', async () => {
    await renderMatrix();
    // A permission is one feature *within a capability*, so a capability is the
    // unit an administrator configures — and 58 × 6 is 348 live controls.
    const first = MOCK_PERMISSIONS[0]?.capabilityCode;
    const inFirst = MOCK_PERMISSIONS.filter(
      (permission) => permission.capabilityCode === first
    ).length;
    expect(screen.getAllByRole('checkbox')).toHaveLength(inFirst * ROLE_CODES.length);

    // `F-0801` belongs to another capability, and the search still reaches it.
    await filterTo('F-0801');
    expect(screen.getByText(content.matrix.searchScopeNote)).toBeInTheDocument();
    expect(screen.getAllByRole('checkbox')).toHaveLength(ROLE_CODES.length);
  });

  /* ── DM-GAP-07 — the contents are missing, and the screen says so ──────── */

  it('DM-GAP-07: the grid ships empty and is labelled unapproved', async () => {
    await renderMatrix();
    expect(screen.getByText(content.matrix.unapprovedTitle)).toBeInTheDocument();
    expect(
      screen.getByText(content.matrix.grantedCount(0, MOCK_PERMISSIONS.length * ROLE_CODES.length))
    ).toBeInTheDocument();
    expect(screen.getAllByRole('checkbox').every((box) => !(box as HTMLInputElement).checked)).toBe(
      true
    );
  });

  it('DM-GAP-07: labels extracted from the PDF are flagged, not presented as final', async () => {
    await renderMatrix();
    const unverified = MOCK_PERMISSIONS.filter(
      (permission) => permission.labelNeedsVerification
    ).length;
    expect(unverified).toBeGreaterThan(0);
    expect(screen.getByText(content.matrix.labelsNote(unverified))).toBeInTheDocument();
  });

  /* ── §8.8.3 — functions AND data ───────────────────────────────────────── */

  it('§8.8.3: a granted cell carries a data scope; an ungranted one has none', async () => {
    const { user } = await renderMatrix();
    const cell = await filterTo('F-0801');
    const scopeLabel = content.matrix.scopeLabel(content.roles.staff, 'F-0801');

    expect(screen.queryByRole('combobox', { name: scopeLabel })).not.toBeInTheDocument();
    await user.click(cell);
    expect(await screen.findByRole('combobox', { name: scopeLabel })).toBeInTheDocument();

    // Revoking takes the scope with it — an ungranted permission has no scope
    // to hold, which is why `dataScope` is nullable on the grant and not on
    // some separate record that could outlive it.
    await user.click(staffCell('F-0801'));
    await screen.findByRole('checkbox', {
      name: content.matrix.grantedLabel(content.roles.staff, 'F-0801'),
      checked: false,
    });
    expect(screen.queryByRole('combobox', { name: scopeLabel })).not.toBeInTheDocument();
  });

  it('§8.8.3: the scope of a grant can be narrowed to the user’s own records', async () => {
    const { user } = await renderMatrix();
    await user.click(await filterTo('F-0801'));
    const scope = await screen.findByRole('combobox', {
      name: content.matrix.scopeLabel(content.roles.staff, 'F-0801'),
    });
    await user.click(scope);
    await user.click(await screen.findByRole('option', { name: content.scopes.own }));
    expect(
      await screen.findByRole('combobox', {
        name: content.matrix.scopeLabel(content.roles.staff, 'F-0801'),
      })
    ).toHaveTextContent(content.scopes.own);
  });

  /* ── BR-0806 — the immutable audit trail ───────────────────────────────── */

  it('BR-0806: a grant change writes an audit entry, and nothing can remove it', async () => {
    const service = createMockAccessProvider({ latencyMs: 0 });
    for (const forbidden of ['deleteAuditEntry', 'editAuditEntry', 'clearAuditTrail']) {
      expect(Object.keys(service)).not.toContain(forbidden);
    }

    const { user } = await renderMatrix();
    expect(screen.getByText(content.audit.empty)).toBeInTheDocument();
    await user.click(await filterTo('F-0801'));
    const trail = await screen.findByRole('list', { name: content.audit.heading });
    expect(within(trail).getByText(/F-0801/)).toBeInTheDocument();
    expect(screen.getByText(content.audit.immutableNote)).toBeInTheDocument();
  });

  it('BR-0806: assigning and revoking a role both land in the trail', async () => {
    const { user } = await renderUsers();
    const row = screen.getByText('فيصل الدوسري').closest('li');
    expect(row).not.toBeNull();

    await user.click(
      within(row as HTMLElement).getByRole('combobox', {
        name: content.users.roleLegend,
      })
    );
    await user.click(await screen.findByRole('option', { name: content.roles.staff }));
    await user.click(
      within(row as HTMLElement).getByRole('button', { name: content.users.assign })
    );

    const trail = await screen.findByText(new RegExp(`staff.*فيصل الدوسري`));
    expect(trail).toBeInTheDocument();
  });

  /* ── BR-0808 / P-133 — authentication is not this capability's business ── */

  it('BR-0808: nothing in the capability reads, stores or validates a credential', () => {
    const service = createMockAccessProvider({ latencyMs: 0 });
    const surface = Object.keys(service).join(' ').toLowerCase();
    for (const forbidden of ['login', 'signin', 'password', 'credential', 'sso', 'token']) {
      expect(surface).not.toContain(forbidden);
    }
  });

  /* ── F-0802 — assigning roles, and the one role that carries a scope ───── */

  it('§8.8.5: choosing the centre coordinator reveals a required centre; others do not', async () => {
    const { user } = await renderUsers();
    const row = screen.getByText('فيصل الدوسري').closest('li') as HTMLElement;

    await user.click(within(row).getByRole('combobox', { name: content.users.roleLegend }));
    await user.click(await screen.findByRole('option', { name: content.roles.manager }));
    expect(
      within(row).queryByRole('combobox', { name: content.users.centreLabel })
    ).not.toBeInTheDocument();

    await user.click(within(row).getByRole('combobox', { name: content.users.roleLegend }));
    await user.click(await screen.findByRole('option', { name: content.roles.centre_coordinator }));
    expect(
      await within(row).findByRole('combobox', { name: content.users.centreLabel })
    ).toBeInTheDocument();
  });

  it('§8.8.5: a coordinator with no centre is refused before it reaches the service', async () => {
    const { user } = await renderUsers();
    const row = screen.getByText('فيصل الدوسري').closest('li') as HTMLElement;

    await user.click(within(row).getByRole('combobox', { name: content.users.roleLegend }));
    await user.click(await screen.findByRole('option', { name: content.roles.centre_coordinator }));
    await user.click(within(row).getByRole('button', { name: content.users.assign }));

    expect(await within(row).findByText(content.errors.scopeRequired)).toBeInTheDocument();
    // Nothing was assigned: the row still reports no roles at all.
    expect(within(row).getByText(content.users.noRoles)).toBeInTheDocument();
  });

  it('F-0802: a held role cannot be assigned twice, and the screen says so', async () => {
    const { user } = await renderUsers();
    const row = screen.getByText('منى الشهراني').closest('li') as HTMLElement;

    await user.click(within(row).getByRole('combobox', { name: content.users.roleLegend }));
    await user.click(await screen.findByRole('option', { name: content.roles.staff }));
    await user.click(within(row).getByRole('button', { name: content.users.assign }));

    expect(await within(row).findByText(content.errors.alreadyAssigned)).toBeInTheDocument();
  });

  it('F-0802: the coordinator’s centre is shown with the role, never on its own', async () => {
    await renderUsers();
    const row = screen.getByText('لطيفة العمار').closest('li') as HTMLElement;
    expect(
      within(row).getByText(new RegExp(content.users.scopedTo('مركز الرياض')))
    ).toBeInTheDocument();
  });

  it('F-0802: a revoked role disappears from the user', async () => {
    const { user } = await renderUsers();
    const row = screen.getByText('عبدالعزيز التميمي').closest('li') as HTMLElement;
    await user.click(
      within(row).getByRole('button', { name: content.users.revoke(content.roles.manager) })
    );
    expect(await within(row).findByText(content.users.noRoles)).toBeInTheDocument();
  });

  it('F-0802: a user with no roles is stated as having no access, not left blank', async () => {
    await renderUsers();
    const row = screen.getByText('فيصل الدوسري').closest('li') as HTMLElement;
    expect(within(row).getByText(content.users.noRoles)).toBeInTheDocument();
  });

  /* ── What the Academy already knows ─ beside the roles, never instead ── */

  it('shows what the Academy holds about a person beside the roles granted here', async () => {
    injectProvider();
    await renderUsers();

    // منى holds `staff` here; the Academy separately calls her a registered
    // user of an organization. Both are on screen, and neither is the other.
    // Two of the four seeded people have a record, so this is deliberately
    // `getAllByText`: one panel per person, not one panel on the page.
    expect((await screen.findAllByText(content.users.fastHeading)).length).toBe(2);
    expect(screen.getAllByText('مستخدم مسجل تابع لجهة').length).toBeGreaterThan(0);
    expect(screen.getAllByText('1105419996').length).toBeGreaterThan(0);
    expect(screen.getAllByText(content.users.fastPowerNames.reviewer).length).toBeGreaterThan(0);
  });

  it('says a record has not been read yet rather than showing an empty one', async () => {
    // فيصل has never signed in, so nothing has been read about him.
    // «not asked yet» and «the Academy has nothing» are different facts, and
    // the screen must not blur them (`P-227` — the record is read at sign-in).
    injectProvider();
    await renderUsers();
    expect(screen.getAllByText(content.users.fastNever).length).toBeGreaterThan(0);
  });

  it('offers no control that could turn an Academy role into a grant', async () => {
    // `BR-0801` / `P-181` — what the Academy calls someone is context for the
    // administrator, never a permission. The panel is plain text; the only
    // controls in a user row remain the six-role picker and revoke.
    injectProvider();
    await renderUsers();

    const panel = (await screen.findAllByText(content.users.fastHeading))[0].closest('div');
    expect(panel).toBeTruthy();
    expect(within(panel as HTMLElement).queryAllByRole('button')).toHaveLength(0);
    expect(within(panel as HTMLElement).queryAllByRole('checkbox')).toHaveLength(0);
    expect(within(panel as HTMLElement).queryAllByRole('combobox')).toHaveLength(0);
  });

  it('dates the record, because it is only as fresh as the last sign-in', async () => {
    injectProvider();
    await renderUsers();
    const dated = screen.getAllByText((text) => text.startsWith('آخر تحديث للبيانات'));
    expect(dated.length).toBeGreaterThan(0);
  });

  /* ── validateAssignRole — the same rule on the way in ──────────────────── */

  it('validateAssignRole: a coordinator must name a centre; a duplicate is refused', () => {
    const held: readonly AssignedRoleDto[] = [
      { roleCode: 'staff', assignedByName: 'x', assignedAt: '2026-08-27T09:00:00Z' },
    ];
    expect(validateAssignRole({ roleCode: 'centre_coordinator', scopeRef: '  ' }, [])).toEqual([
      'scope-required',
    ]);
    expect(
      validateAssignRole({ roleCode: 'centre_coordinator', scopeRef: 'ctr-riyadh' }, [])
    ).toEqual([]);
    expect(validateAssignRole({ roleCode: 'staff' }, held)).toEqual(['already-assigned']);
    expect(validateAssignRole({ roleCode: 'manager' }, held)).toEqual([]);
  });

  /* ── Navigation — the header must reach a real page, not NotFound ──────── */

  it('the internal header’s access entry resolves to the matrix, not a 404', async () => {
    const header = getHeaderContent('ar');
    const entry = header.internalNav.find((link) => link.id === 'access');
    expect(entry).toBeDefined();
    seedExpertHubSession(['internal']);
    // Rendered at the href the header actually carries — copy checked against
    // the router, not against more copy.
    renderExpertHubAt(entry?.href ?? '');
    expect(
      await screen.findByRole('heading', { level: 1, name: content.matrix.title })
    ).toBeInTheDocument();
  });

  it('the two screens cross-link, and each marks itself as the current page', async () => {
    await renderMatrix();
    const nav = screen.getByRole('navigation', { name: content.nav.label });
    expect(within(nav).getByRole('link', { name: content.nav.permissions })).toHaveAttribute(
      'aria-current',
      'page'
    );
    expect(within(nav).getByRole('link', { name: content.nav.users })).toHaveAttribute(
      'href',
      expertHubPaths.internalAccessUsers
    );
  });

  /* ── Failure and accessibility ─────────────────────────────────────────── */

  it('a failing service offers a retry rather than an empty matrix', async () => {
    injectProvider({ failWith: { status: 500, message: 'boom' } });
    seedExpertHubSession(['internal']);
    renderExpertHubAt(expertHubPaths.internalAccessPermissions);
    expect(await screen.findByText(content.errors.loadTitle)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: content.errors.retry })).toBeInTheDocument();
  });

  it('the matrix has no accessibility violations', async () => {
    const { container } = await renderMatrix();
    // Narrowed first: axe over 348 live cells is the same assertion, slower.
    await filterTo('F-0801');
    await expectNoA11yViolations(container);
  });

  it('the user–role screen has no accessibility violations', async () => {
    const { container } = await renderUsers();
    await expectNoA11yViolations(container);
  });
});
