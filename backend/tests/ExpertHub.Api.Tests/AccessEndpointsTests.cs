using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using ExpertHub.Api.Auth;
using ExpertHub.Core.Domain;
using ExpertHub.Infrastructure.Fast;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Mvc.Testing;

namespace ExpertHub.Api.Tests;

/// <summary>
/// CAP-08's endpoints, full stack: a real OIDC sign-in (fake IdP), the session
/// cookie, the authorization gate, and a real SQL Server underneath — the
/// closest executable statement of BE-03's definition of done, which is the
/// frontend contract (`accessService.ts` / `access.types.ts`) served for real.
/// </summary>
/// <remarks>
/// A fresh database per test (xunit constructs the class per test, and
/// `InitializeAsync` migrates a throwaway LocalDB database each time): the
/// contract's pristine-state assertions — an EMPTY grants list, exactly 58
/// permissions — are the `DM-GAP-07` statement itself, and any shared state
/// would blur them.
/// </remarks>
public sealed class AccessEndpointsTests
    : IClassFixture<WebApplicationFactory<Program>>, IAsyncLifetime, IDisposable
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly LocalDbFixture _database = new();
    private readonly TestOidc.FakeTokenEndpoint _tokenEndpoint = new();

    private WebApplicationFactory<Program>? _configured;
    private HttpClient _client = null!;

    public AccessEndpointsTests(WebApplicationFactory<Program> factory) => _factory = factory;

    public async Task InitializeAsync()
    {
        await _database.InitializeAsync();
        _configured = TestOidc.Configure(
            _factory,
            _tokenEndpoint,
            ("ConnectionStrings:ExpertHub", _database.ConnectionString));
        _client = TestOidc.CreateClient(_configured);
    }

    public async Task DisposeAsync()
    {
        _configured?.Dispose();
        await _database.DisposeAsync();
    }

    public void Dispose() => _tokenEndpoint.Dispose();

    /// <summary>
    /// Signs in and grants the System Administrator role — CAP-08's screens
    /// are gated on `F-0801`/`F-0802`/`F-0805`, which only that role holds
    /// in the default matrix (P-190). Internal-by-claim is no longer enough.
    /// </summary>
    private async Task<JsonElement> SignInInternalAsync()
    {
        var session = await TestOidc.SignInAsync(_client, _tokenEndpoint, "fa-staff");
        await GrantAsync(TestOidc.Subject, RoleCode.SystemAdministrator);
        return session;
    }

    /// <summary>
    /// Grants a platform role, the way the CAP-08 screen does. Feature
    /// permissions are read from `USER_ROLE` per request (not from the
    /// session snapshot), so granting after sign-in is enough — and it is
    /// how a real administrator hands out access mid-session.
    /// </summary>
    private async Task GrantAsync(string externalId, RoleCode role)
    {
        await using var db = _database.CreateContext();
        var user = await db.Users.SingleAsync(u => u.ExternalIdentityId == externalId);
        var roleRow = await db.Roles.SingleAsync(r => r.Code == role);
        if (await db.UserRoles.AnyAsync(ur => ur.UserId == user.UserId && ur.RoleId == roleRow.RoleId))
        {
            return;
        }
        db.UserRoles.Add(new UserRole
        {
            UserRoleId = Guid.NewGuid(),
            UserId = user.UserId,
            RoleId = roleRow.RoleId,
            AssignedBy = user.UserId,
            AssignedAt = DateTime.UtcNow,
        });
        await db.SaveChangesAsync();
    }


    /* ── what the Academy knows, beside what we grant ──────────────────── */

    [Fact]
    public async Task The_user_list_carries_what_FAST_knows_without_granting_anything()
    {
        await SignInInternalAsync();

        // The record as the sign-in import would have written it (`P-227`).
        await using (var db = _database.CreateContext())
        {
            var profile = FastUserReader.Parse("""
            {
              "id": "15f9e3b7-2e91-4987-8c8d-b09100c5ba73",
              "idNumber": "1105419996",
              "userOrganization": "الأكاديمية المالية",
              "isEmployee": true,
              "roles": [{ "displayName": "مستخدم مسجل", "code": 4, "systemName": "Individual" }],
              "userProfile": { "expertReviewer": true, "expertQuestionAuthor": true },
              "bankIBAN": "sa123456", "bankName": "الاهلي"
            }
            """).Value!;
            await FastProfileImport.ApplyAsync(db, TestOidc.Subject, profile, CancellationToken.None);
            await db.SaveChangesAsync();
        }

        var users = await GetJsonAsync("/api/v1/internal/access/users");
        var me = users.EnumerateArray().Single(u =>
            u.GetProperty("email").GetString() == TestOidc.Email);

        var fast = me.GetProperty("fastProfile");
        Assert.Equal("1105419996", fast.GetProperty("idNumber").GetString());
        Assert.True(fast.GetProperty("isEmployee").GetBoolean());
        // FAST's own Arabic label, not its English system name.
        Assert.Equal("مستخدم مسجل", fast.GetProperty("fastRoles")[0].GetString());
        // Codes, because the mapping to Expert Hub's four services is `Q22`,
        // unruled — so the screen names them, not the API.
        var powers = fast.GetProperty("expertPowers").EnumerateArray()
            .Select(p => p.GetString() ?? string.Empty).ToArray();
        Assert.Equal(["reviewer", "question_author"], powers);

        /*
         * ⚠️ The point of the whole panel: it changed no permission. `BR-0801`
         * grants exclusively through Expert Hub's own roles, and FAST calling
         * someone a reviewer must never quietly become a grant here (`P-181`).
         */
        var held = me.GetProperty("roles").EnumerateArray()
            .Select(r => r.GetProperty("roleCode").GetString() ?? string.Empty)
            .Order(StringComparer.Ordinal)
            .ToArray();
        // `individual` because they signed in; `system_administrator` because
        // somebody granted it. Nothing from FAST's own roles.
        Assert.Equal(["individual", "system_administrator"], held);
    }

    [Fact]
    public async Task A_user_whose_record_was_never_read_carries_no_FAST_block()
    {
        // Absent, not empty — «not asked yet» and «FAST has nothing» are
        // different facts, and the wire keeps them apart.
        await SignInInternalAsync();

        var users = await GetJsonAsync("/api/v1/internal/access/users");
        var me = users.EnumerateArray().Single(u =>
            u.GetProperty("email").GetString() == TestOidc.Email);

        Assert.False(me.TryGetProperty("fastProfile", out _));
    }

    /* ── the gate — fail closed ────────────────────────────────────────────── */

    [Fact]
    public async Task The_access_surface_denies_anonymous_callers()
    {
        foreach (var path in new[]
        {
            "/api/v1/internal/access/matrix",
            "/api/v1/internal/access/users",
            "/api/v1/internal/access/audit",
            "/api/v1/internal/centres",
        })
        {
            var response = await _client.GetAsync(path);
            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }
    }

    [Fact]
    public async Task A_trainer_session_is_authenticated_but_not_internal()
    {
        // The same boundary the frontend's RequireRole("internal") draws —
        // decided by the API, which is the authority (P-J9).
        await TestOidc.SignInAsync(_client, _tokenEndpoint, "fa-trainer");

        var response = await _client.GetAsync("/api/v1/internal/access/matrix");

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    /* ── P-181 — roles come from the platform's USER_ROLE table ───────────── */

    [Fact]
    public async Task A_database_role_reaches_the_session_without_any_role_claim()
    {
        // Seed the user + the trainer role directly in the database, then sign
        // in with an UNMAPPED claim value: the session's role must come from
        // USER_ROLE, because FAST's token carries no role claim (P-181).
        await using (var db = _database.CreateContext())
        {
            var trainerRole = await db.Roles.SingleAsync(r => r.Code == RoleCode.Trainer);
            var user = new AppUser
            {
                UserId = Guid.NewGuid(),
                ExternalIdentityId = TestOidc.Subject,
                Email = TestOidc.Email,
                FullNameAr = TestOidc.DisplayName,
                FullNameEn = TestOidc.DisplayName,
                PreferredCommunicationLanguage = "ar",
                PreferredUiLanguage = "ar",
                IsActive = true,
                IsEmployee = false,
                CreatedAt = DateTime.UtcNow,
            };
            db.Users.Add(user);
            db.UserRoles.Add(new UserRole
            {
                UserRoleId = Guid.NewGuid(),
                UserId = user.UserId,
                RoleId = trainerRole.RoleId,
                ScopeRef = null,
                AssignedBy = user.UserId,
                AssignedAt = DateTime.UtcNow,
            });
            await db.SaveChangesAsync();
        }

        var session = await TestOidc.SignInAsync(_client, _tokenEndpoint, "unmapped-value");

        var roles = session.GetProperty("roles").EnumerateArray()
            .Select(r => r.GetString()!)
            .Order(StringComparer.Ordinal)
            .ToArray();
        // `trainer` from `USER_ROLE`, `individual` because they signed in.
        Assert.Equal(["individual", "trainer"], roles);
    }

    [Fact]
    public async Task Everybody_who_signs_in_holds_the_baseline_role_as_a_real_row()
    {
        /*
         * Owner ruling, 2026-09-08: «a role called individual … given for
         * anyone [who] enters the platform».
         *
         * ⚠️ It is a real `USER_ROLE` row with a real audit entry, not a claim
         * the screens cannot see. A role that exists only in the session is a
         * permission the matrix cannot govern, which is what `BR-0801` forbids.
         */
        await TestOidc.SignInAsync(_client, _tokenEndpoint, "unmapped-value");

        await using var db = _database.CreateContext();
        var user = await db.Users.SingleAsync(u => u.ExternalIdentityId == TestOidc.Subject);
        var baseline = await db.Roles.SingleAsync(r => r.Code == RoleCode.Individual);
        Assert.True(await db.UserRoles.AnyAsync(
            ur => ur.UserId == user.UserId && ur.RoleId == baseline.RoleId));

        var entry = await db.AuditEntries.SingleAsync(a =>
            a.Action == "role-assigned" && a.EntityId == user.UserId);
        using var payload = JsonDocument.Parse(entry.AfterState!);
        Assert.Equal("individual", payload.RootElement.GetProperty("roleCode").GetString());
    }

    [Fact]
    public async Task The_baseline_role_is_granted_once_not_on_every_sign_in()
    {
        // The row is what makes it durable; re-granting would fill `BR-0806`'s
        // trail with an entry every time somebody logged in.
        await TestOidc.SignInAsync(_client, _tokenEndpoint, "unmapped-value");
        await TestOidc.SignInAsync(_client, _tokenEndpoint, "unmapped-value");

        await using var db = _database.CreateContext();
        var user = await db.Users.SingleAsync(u => u.ExternalIdentityId == TestOidc.Subject);
        var baseline = await db.Roles.SingleAsync(r => r.Code == RoleCode.Individual);
        Assert.Equal(1, await db.UserRoles.CountAsync(
            ur => ur.UserId == user.UserId && ur.RoleId == baseline.RoleId));
        Assert.Equal(1, await db.AuditEntries.CountAsync(a =>
            a.Action == "role-assigned" && a.EntityId == user.UserId));
    }

    [Fact]
    public async Task A_bootstrap_administrator_is_persisted_with_an_audit_entry()
    {
        // P-181's bootstrap, with the database up: the grant lands as a real
        // USER_ROLE row plus its audit entry — the DB, not the config file, is
        // what the access screens show afterwards.
        using var configured = TestOidc.Configure(
            _factory,
            _tokenEndpoint,
            ("ConnectionStrings:ExpertHub", _database.ConnectionString),
            ("Access:BootstrapAdministrators", TestOidc.Subject));
        var client = TestOidc.CreateClient(configured);

        var session = await TestOidc.SignInAsync(client, _tokenEndpoint, "unmapped-value");
        var roles = session.GetProperty("roles").EnumerateArray().Select(r => r.GetString()!).ToArray();
        Assert.Contains("internal", roles);

        await using var db = _database.CreateContext();
        var user = await db.Users.SingleAsync(u => u.ExternalIdentityId == TestOidc.Subject);
        var adminRole = await db.Roles.SingleAsync(r => r.Code == RoleCode.SystemAdministrator);
        Assert.True(await db.UserRoles.AnyAsync(
            ur => ur.UserId == user.UserId && ur.RoleId == adminRole.RoleId));
        Assert.True(await db.AuditEntries.AnyAsync(
            a => a.UserId == user.UserId && a.Action == "role-assigned"));
    }

    /* ── the matrix, as the BRD fixes it and DM-GAP-07 leaves it ──────────── */

    [Fact]
    public async Task The_matrix_serves_every_role_58_permissions_and_no_grants()
    {
        await SignInInternalAsync();

        var matrix = await GetJsonAsync("/api/v1/internal/access/matrix");

        var roleCodes = matrix.GetProperty("roles").EnumerateArray()
            .Select(r => r.GetProperty("roleCode").GetString()!).ToArray();
        // `ROLE_CODES` in access.types.ts, in the BRD's own order — including
        // `system_administrator`, the contract's spelling (not `sysadmin`).
        // §8.8.5's six in the BRD's own order, then `individual` — the
        // baseline role the owner added on 2026-09-08, appended rather than
        // woven in, because it is an amendment and the order says so.
        Assert.Equal(
            ["trainer", "staff", "manager", "centre_coordinator", "system_administrator",
             "executive", "individual"],
            roleCodes);
        Assert.All(matrix.GetProperty("roles").EnumerateArray(), role =>
        {
            Assert.True(role.GetProperty("isSystem").GetBoolean());
            Assert.False(string.IsNullOrEmpty(role.GetProperty("descriptionAr").GetString()));
        });

        var permissions = matrix.GetProperty("permissions").EnumerateArray().ToArray();
        Assert.Equal(58, permissions.Length); // §8.8.4 — the BRD's feature list
        Assert.All(permissions, p =>
        {
            // The wire id IS the feature code — `mockAccessProvider.ts` set
            // the convention and the pages key grants by it.
            Assert.Equal(p.GetProperty("featureCode").GetString(), p.GetProperty("permissionId").GetString());
        });

        // P-190 — the DRAFT default matrix is seeded and enforced, so the
        // grid is no longer empty. `DM-GAP-07` is still open, so the payload
        // still says `unapproved`: what changed is that an unapproved matrix
        // now has rows to correct rather than a blank grid nobody can use.
        var grants = matrix.GetProperty("grants").EnumerateArray().ToArray();
        Assert.NotEmpty(grants);
        Assert.All(grants, grant => Assert.True(grant.GetProperty("granted").GetBoolean()));
        // Every grant names a real role and a real feature code.
        Assert.All(grants, grant =>
        {
            Assert.Contains(grant.GetProperty("roleCode").GetString(), roleCodes);
            Assert.Contains(
                permissions,
                p => p.GetProperty("permissionId").GetString()
                    == grant.GetProperty("permissionId").GetString());
        });
        Assert.Equal("unapproved", matrix.GetProperty("modelStatus").GetString());
        Assert.Equal(58, matrix.GetProperty("unverifiedLabelCount").GetInt32());
    }

    /* ── grants — §8.8.3, and the audit that rides the same transaction ───── */

    [Fact]
    public async Task Granting_rescoping_and_revoking_a_cell_round_trips_with_audit()
    {
        await SignInInternalAsync();

        // `staff` × `F-0801` is deliberately a cell the default matrix (P-190)
        // leaves ungranted — the access matrix is the System Administrator's —
        // so this exercises a genuinely new grant against a seeded grid.
        static JsonElement? Cell(JsonElement matrix) =>
            matrix.GetProperty("grants").EnumerateArray()
                .Where(g => g.GetProperty("roleCode").GetString() == "staff"
                    && g.GetProperty("permissionId").GetString() == "F-0801")
                .Cast<JsonElement?>()
                .SingleOrDefault();

        // Grant with no explicit scope — defaults to `all`, like the mock.
        var granted = await PostJsonAsync("/api/v1/internal/access/matrix/grants",
            new { roleCode = "staff", permissionId = "F-0801", granted = true, dataScope = (string?)null });
        var grant = Assert.NotNull(Cell(granted));
        Assert.True(grant.GetProperty("granted").GetBoolean());
        Assert.Equal("all", grant.GetProperty("dataScope").GetString());

        // Re-grant narrows the scope in place — one cell, one row.
        var rescoped = await PostJsonAsync("/api/v1/internal/access/matrix/grants",
            new { roleCode = "staff", permissionId = "F-0801", granted = true, dataScope = "own" });
        var narrowed = Assert.NotNull(Cell(rescoped));
        Assert.Equal("own", narrowed.GetProperty("dataScope").GetString());

        // Revoke — the row goes; only the trail remembers (`BR-0806`).
        var revoked = await PostJsonAsync("/api/v1/internal/access/matrix/grants",
            new { roleCode = "staff", permissionId = "F-0801", granted = false, dataScope = (string?)null });
        Assert.Null(Cell(revoked));

        var audit = await GetJsonAsync("/api/v1/internal/access/audit");
        var entries = audit.EnumerateArray().ToArray();
        Assert.True(entries.Length >= 3);
        // Newest first, wording verbatim from the contract's own provider.
        Assert.Equal("سُحبت صلاحية F-0801 للدور staff", entries[0].GetProperty("summaryAr").GetString());
        Assert.Equal("Revoked F-0801 for staff", entries[0].GetProperty("summaryEn").GetString());
        Assert.Equal("مُنحت صلاحية F-0801 للدور staff", entries[1].GetProperty("summaryAr").GetString());
        Assert.All(entries.Take(3), e => Assert.Equal("grant-changed", e.GetProperty("kind").GetString()));
        Assert.All(entries.Take(3), e => Assert.Equal(TestOidc.DisplayName, e.GetProperty("actorName").GetString()));
    }

    [Fact]
    public async Task Unknown_role_permission_or_scope_are_refused()
    {
        await SignInInternalAsync();

        var badRole = await _client.PostAsJsonAsync("/api/v1/internal/access/matrix/grants",
            new { roleCode = "superadmin", permissionId = "F-0801", granted = true, dataScope = (string?)null });
        Assert.Equal(HttpStatusCode.BadRequest, badRole.StatusCode);

        var badPermission = await _client.PostAsJsonAsync("/api/v1/internal/access/matrix/grants",
            new { roleCode = "staff", permissionId = "F-9999", granted = true, dataScope = (string?)null });
        Assert.Equal(HttpStatusCode.NotFound, badPermission.StatusCode);

        var badScope = await _client.PostAsJsonAsync("/api/v1/internal/access/matrix/grants",
            new { roleCode = "staff", permissionId = "F-0801", granted = true, dataScope = "everything" });
        Assert.Equal(HttpStatusCode.BadRequest, badScope.StatusCode);
    }

    /* ── users and roles — F-0802 ─────────────────────────────────────────── */

    [Fact]
    public async Task Assigning_and_revoking_roles_enforces_the_contract_rules()
    {
        await SignInInternalAsync();

        // The signed-in actor is provisioned on first mutation; make one.
        await PostJsonAsync("/api/v1/internal/access/matrix/grants",
            new { roleCode = "executive", permissionId = "F-0904", granted = true, dataScope = (string?)null });

        var users = await GetJsonAsync("/api/v1/internal/access/users");
        var me = users.EnumerateArray()
            .Single(u => u.GetProperty("displayName").GetString() == TestOidc.DisplayName);
        var myId = me.GetProperty("userId").GetString()!;

        // Assign a plain role — no scope keys on the wire at all, because the
        // frontend type is a discriminated union and only the coordinator
        // member carries them.
        var assigned = await PostJsonAsync($"/api/v1/internal/access/users/{myId}/roles",
            new { roleCode = "staff" });
        // The actor already holds System Administrator — it is what opens
        // these screens at all (P-190) — so the new grant is looked up by
        // name rather than by being the only one.
        var staffRole = assigned.GetProperty("roles").EnumerateArray()
            .Single(r => r.GetProperty("roleCode").GetString() == "staff");
        Assert.False(staffRole.TryGetProperty("scopeRef", out _));
        Assert.False(staffRole.TryGetProperty("scopeName", out _));
        Assert.Equal(TestOidc.DisplayName, staffRole.GetProperty("assignedByName").GetString());

        // The same role twice is refused (`validateAssignRole`, server-side).
        var duplicate = await _client.PostAsJsonAsync($"/api/v1/internal/access/users/{myId}/roles",
            new { roleCode = "staff" });
        Assert.Equal(HttpStatusCode.BadRequest, duplicate.StatusCode);

        // A coordinator with no centre is refused (P-140)…
        var noScope = await _client.PostAsJsonAsync($"/api/v1/internal/access/users/{myId}/roles",
            new { roleCode = "centre_coordinator" });
        Assert.Equal(HttpStatusCode.BadRequest, noScope.StatusCode);

        // …and no other role may carry one — the union, enforced on the way in.
        var strayScope = await _client.PostAsJsonAsync($"/api/v1/internal/access/users/{myId}/roles",
            new { roleCode = "manager", scopeRef = Guid.NewGuid().ToString() });
        Assert.Equal(HttpStatusCode.BadRequest, strayScope.StatusCode);

        // With a real centre, the coordinator lands with its bilingual name.
        var centreId = await InsertCentreAsync("مركز الرياض", "Riyadh centre");
        var coordinator = await PostJsonAsync($"/api/v1/internal/access/users/{myId}/roles",
            new { roleCode = "centre_coordinator", scopeRef = centreId });
        var coordinatorRole = coordinator.GetProperty("roles").EnumerateArray()
            .Single(r => r.GetProperty("roleCode").GetString() == "centre_coordinator");
        Assert.Equal(centreId, coordinatorRole.GetProperty("scopeRef").GetString());
        Assert.Equal("مركز الرياض", coordinatorRole.GetProperty("scopeName").GetString());

        // Revoke takes the role away; the trail keeps the story.
        var revoked = await PostJsonAsync($"/api/v1/internal/access/users/{myId}/roles/staff/revoke", new { });
        Assert.DoesNotContain(revoked.GetProperty("roles").EnumerateArray(),
            r => r.GetProperty("roleCode").GetString() == "staff");

        var audit = await GetJsonAsync("/api/v1/internal/access/audit");
        var kinds = audit.EnumerateArray().Select(e => e.GetProperty("kind").GetString()).ToArray();
        Assert.Contains("role-assigned", kinds);
        Assert.Contains("role-revoked", kinds);
        Assert.Contains(audit.EnumerateArray(),
            e => e.GetProperty("summaryAr").GetString() == $"سُحب الدور staff من {TestOidc.DisplayName}");
    }

    [Fact]
    public async Task Centres_are_served_from_the_reference_list()
    {
        await SignInInternalAsync();
        var centreId = await InsertCentreAsync("مركز جدة", "Jeddah centre");

        var centres = await GetJsonAsync("/api/v1/internal/centres");

        Assert.Contains(centres.EnumerateArray(), c =>
            c.GetProperty("centreId").GetString() == centreId
            && c.GetProperty("nameAr").GetString() == "مركز جدة"
            && c.GetProperty("nameEn").GetString() == "Jeddah centre");
    }

    /* ── helpers ──────────────────────────────────────────────────────────── */

    private async Task<JsonElement> GetJsonAsync(string path)
    {
        var response = await _client.GetAsync(path);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        return await response.Content.ReadFromJsonAsync<JsonElement>();
    }

    private async Task<JsonElement> PostJsonAsync(string path, object body)
    {
        var response = await _client.PostAsJsonAsync(path, body);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        return await response.Content.ReadFromJsonAsync<JsonElement>();
    }

    private async Task<string> InsertCentreAsync(string nameAr, string nameEn)
    {
        await using var context = _database.CreateContext();
        var value = new ReferenceValue
        {
            ValueId = Guid.NewGuid(),
            ListCode = "centre", // the list itself is seeded, its values are not
            Code = $"ctr-{Guid.NewGuid():N}",
            LabelAr = nameAr,
            LabelEn = nameEn,
            SortOrder = 1,
        };
        context.ReferenceValues.Add(value);
        await context.SaveChangesAsync();
        return value.ValueId.ToString();
    }
}
