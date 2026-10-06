using System.Net;
using System.Net.Http.Json;
using ExpertHub.Core.Domain;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;

namespace ExpertHub.Api.Tests;

/// <summary>
/// `DEF-04` — `APP_USER.IsEmployee` must follow the roles a person actually
/// holds, at every sign-in.
///
/// <para>
/// It used to be written ONCE, when the row was created, from the identity
/// provider's own role claim. That claim is optional: `Oidc__RoleClaim` is
/// empty in a UAT deployment, so every non-bootstrap user was created
/// `IsEmployee = false` and the existing-user branch only touched
/// `LastLoginAt`. Granting somebody an internal role afterwards — which is the
/// only way roles are granted (`P-181`) — never reached the flag.
/// </para>
/// <para>
/// The consequences were not subtle: `/v1/attachments/{id}` refuses a
/// non-owner who is not an employee, so no staff member could open an
/// applicant's CV, and every committee, interview-panel and signatory picker
/// reads `Where(u =&gt; u.IsEmployee &amp;&amp; u.IsActive)` and listed nobody.
/// </para>
/// <para>
/// The authoritative answer already existed three lines away: sign-in computes
/// `isInternal` from the roles read out of `USER_ROLE`. This reconciles the
/// stored flag to it — the same rule, no second source of truth, and no
/// widening: `Individual` is still not an internal role, so an ordinary
/// applicant never becomes an employee.
/// </para>
/// </summary>
public sealed class EmployeeReconciliationTests
    : IClassFixture<WebApplicationFactory<Program>>, IAsyncLifetime, IDisposable
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly LocalDbFixture _database = new();
    private readonly TestOidc.FakeTokenEndpoint _tokenEndpoint = new();

    private WebApplicationFactory<Program>? _configured;

    public EmployeeReconciliationTests(WebApplicationFactory<Program> factory) =>
        _factory = factory;

    public async Task InitializeAsync()
    {
        await _database.InitializeAsync();
        _configured = TestOidc.Configure(
            _factory,
            _tokenEndpoint,
            ("ConnectionStrings:ExpertHub", _database.ConnectionString));
    }

    public async Task DisposeAsync()
    {
        _configured?.Dispose();
        await _database.DisposeAsync();
    }

    public void Dispose() => _tokenEndpoint.Dispose();

    /* ── the flag follows the roles ────────────────────────────────────────── */

    [Fact]
    public async Task An_external_expert_is_never_an_employee()
    {
        using var applicant = await SignInAsync("recon-external", "مقدم خارجي");

        Assert.False(await IsEmployeeAsync("recon-external"));
    }

    [Fact]
    public async Task An_internal_employee_is_an_employee_from_their_first_sign_in()
    {
        // The identity provider mapped them, which is the one case that already
        // worked. It must keep working.
        using var staff = await SignInAsync("recon-mapped", "موظفة", role: "fa-staff");

        Assert.True(await IsEmployeeAsync("recon-mapped"));
    }

    [Fact]
    public async Task An_external_user_granted_an_internal_role_is_reconciled_at_the_next_sign_in()
    {
        /*
         * THE DEFECT. The identity provider says nothing about roles — the UAT
         * configuration, where `Oidc__RoleClaim` is empty — so this person was
         * created as an ordinary applicant. Expert Hub then grants them Staff
         * in its own access matrix, which is how every internal role is
         * granted. Before the fix the flag stayed false forever.
         */
        using (var first = await SignInAsync("recon-promoted", "موظف جديد"))
        {
            Assert.False(await IsEmployeeAsync("recon-promoted"));
        }

        await GrantAsync("recon-promoted", RoleCode.Staff);

        using var second = await SignInAsync("recon-promoted", "موظف جديد");

        Assert.True(await IsEmployeeAsync("recon-promoted"));
    }

    [Fact]
    public async Task A_user_who_loses_every_internal_role_stops_being_an_employee()
    {
        // The same rule in the other direction — a reconciliation that only
        // ever adds is a privilege that can never be withdrawn.
        (await SignInAsync("recon-demoted", "موظف سابق")).Dispose();
        await GrantAsync("recon-demoted", RoleCode.Staff);
        using (var promoted = await SignInAsync("recon-demoted", "موظف سابق"))
        {
            Assert.True(await IsEmployeeAsync("recon-demoted"));
        }

        await RevokeAllAsync("recon-demoted");

        using var demoted = await SignInAsync("recon-demoted", "موظف سابق");

        Assert.False(await IsEmployeeAsync("recon-demoted"));
    }

    [Fact]
    public async Task The_trainer_and_individual_roles_never_make_somebody_an_employee()
    {
        // `Individual` is granted to everyone who signs in, and `Trainer` to
        // everyone who is accredited. If either counted, the operations area
        // would belong to the whole world.
        (await SignInAsync("recon-trainer", "مدرب")).Dispose();
        await GrantAsync("recon-trainer", RoleCode.Trainer);

        using var trainer = await SignInAsync("recon-trainer", "مدرب");

        Assert.False(await IsEmployeeAsync("recon-trainer"));
    }

    /* ── what the flag actually governs ────────────────────────────────────── */

    [Fact]
    public async Task A_reconciled_employee_can_open_an_applicants_document()
    {
        using var applicant = await SignInAsync("recon-owner", "صاحب الطلب");
        var attachmentId = await AttachmentOfAsync(applicant, "recon-owner");

        // Signed in BEFORE the grant, exactly as a real staff member would have
        // been: this is the sequence that used to leave them refused forever.
        (await SignInAsync("recon-reader", "قارئ داخلي")).Dispose();
        await GrantAsync("recon-reader", RoleCode.Staff);
        using var reader = await SignInAsync("recon-reader", "قارئ داخلي");

        var response = await reader.GetAsync($"/api/v1/attachments/{attachmentId}");

        /*
         * The gate is what this test owns: before the fix a reconciled employee
         * was refused outright. `Forbidden` is the defect; anything past it
         * means authorization let them through. The seeded `StorageRef` points
         * at no real blob, so the request then 404s in the document store —
         * that is `EXT-08`/`G26` territory and deliberately not asserted here.
         */
        Assert.NotEqual(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Another_applicant_is_still_refused_the_same_document()
    {
        // The reconciliation must not widen anything. A second applicant holds
        // only `Individual`, and `Individual` is not internal.
        using var owner = await SignInAsync("recon-owner-2", "صاحب الطلب");
        var attachmentId = await AttachmentOfAsync(owner, "recon-owner-2");

        using var stranger = await SignInAsync("recon-stranger", "مقدم آخر");

        var response = await stranger.GetAsync($"/api/v1/attachments/{attachmentId}");

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    /* ── helpers ───────────────────────────────────────────────────────────── */

    private async Task<HttpClient> SignInAsync(
        string subject, string name, string role = "unmapped")
    {
        var client = TestOidc.CreateClient(_configured!);
        await TestOidc.SignInAsync(
            client, _tokenEndpoint, role, subject: subject, displayName: name);
        return client;
    }

    private async Task<bool> IsEmployeeAsync(string subject)
    {
        await using var db = _database.CreateContext();
        return (await db.Users.SingleAsync(u => u.ExternalIdentityId == subject)).IsEmployee;
    }

    private async Task GrantAsync(string subject, RoleCode role)
    {
        await using var db = _database.CreateContext();
        var user = await db.Users.SingleAsync(u => u.ExternalIdentityId == subject);
        var roleRow = await db.Roles.SingleAsync(r => r.Code == role);
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

    private async Task RevokeAllAsync(string subject)
    {
        await using var db = _database.CreateContext();
        var user = await db.Users.SingleAsync(u => u.ExternalIdentityId == subject);
        var internalRoles = await db.Roles
            .Where(r => r.Code != RoleCode.Trainer && r.Code != RoleCode.Individual)
            .Select(r => r.RoleId)
            .ToListAsync();
        var held = await db.UserRoles
            .Where(ur => ur.UserId == user.UserId && internalRoles.Contains(ur.RoleId))
            .ToListAsync();
        db.UserRoles.RemoveRange(held);
        await db.SaveChangesAsync();
    }

    /// <summary>A stored document the applicant owns — the thing the screening
    /// page links to, read through `GET /v1/attachments/{id}`.</summary>
    private async Task<Guid> AttachmentOfAsync(HttpClient applicant, string subject)
    {
        var started = await applicant.PostAsJsonAsync(
            "/api/v1/me/applications/draft/start", new { });
        started.EnsureSuccessStatusCode();

        await using var db = _database.CreateContext();
        var user = await db.Users.SingleAsync(u => u.ExternalIdentityId == subject);
        var attachment = new Attachment
        {
            AttachmentId = Guid.NewGuid(),
            FileName = "cv.pdf",
            MimeType = "application/pdf",
            SizeBytes = 1024,
            StorageRef = "db:cv",
            UploadedBy = user.UserId,
            UploadedAt = DateTime.UtcNow,
        };
        db.Attachments.Add(attachment);
        await db.SaveChangesAsync();
        return attachment.AttachmentId;
    }
}
