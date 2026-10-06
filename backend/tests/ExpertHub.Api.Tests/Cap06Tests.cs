using System.Net;
using System.Text.Json;
using ExpertHub.Core.Domain;
using ExpertHub.Infrastructure.Entitlements;
using ExpertHub.Infrastructure.Integration;
using ExpertHub.Infrastructure.Persistence;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;

namespace ExpertHub.Api.Tests;

/// <summary>
/// BE-11 — CAP-06. The capability is two reads, and every rule in §8.6 is a
/// property of the shapes rather than a check: no write route exists
/// (`BR-0601`), the trainer's DTO cannot express an incomplete link
/// (`BR-0603`), the link resolves itself (`F-0603`), and no total is
/// computed anywhere (`P-125`).
/// </summary>
public sealed class Cap06Tests
    : IClassFixture<WebApplicationFactory<Program>>, IAsyncLifetime, IDisposable
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly LocalDbFixture _database = new();
    private readonly TestOidc.FakeTokenEndpoint _tokenEndpoint = new();

    private WebApplicationFactory<Program>? _configured;

    public Cap06Tests(WebApplicationFactory<Program> factory) => _factory = factory;

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

    /* ── `BR-0601` / `BR-0605` — the absence of a door (`P-127`) ───────────── */

    [Fact]
    public async Task Nothing_can_be_entered_or_edited_or_disputed()
    {
        using var staff = await SignInAsync("cap06-staff-w", "موظف", RoleCode.Manager);

        // Every verb but GET, on both surfaces, plus the two shapes a dispute
        // path would take. None of them is routed, because none was built.
        foreach (var path in new[]
        {
            "/api/v1/me/entitlements",
            "/api/v1/internal/entitlements",
            "/api/v1/internal/entitlements/link",
            "/api/v1/me/entitlements/dispute",
        })
        {
            foreach (var method in new[] { HttpMethod.Post, HttpMethod.Put, HttpMethod.Delete })
            {
                using var request = new HttpRequestMessage(method, path);
                using var response = await staff.SendAsync(request);
                Assert.True(
                    response.StatusCode is HttpStatusCode.NotFound
                        or HttpStatusCode.MethodNotAllowed,
                    $"{method} {path} answered {(int)response.StatusCode} — CAP-06 has "
                        + "two operations and both are reads (BR-0601, BR-0605).");
            }
        }
    }

    /* ── `BR-0603` — hidden from the trainer, named for staff (`P-126`) ────── */

    [Fact]
    public async Task An_incomplete_link_is_hidden_from_the_trainer_and_named_for_staff()
    {
        using var staff = await SignInAsync("cap06-staff", "موظف المستحقات", RoleCode.Manager);
        var trainer = await SeedTrainerAsync("cap06-trn-1", "د. سارة العتيبي");
        await SeedActiveAgreementAsync(trainer, "AGR-2026-00042");
        var engagementId = await SeedEngagementAsync(trainer, "برنامج القيادة التنفيذية");

        // Two orders for the same person: one ERP could tie to a programme,
        // one it could not.
        await ImportAsync(Order("PO-2026-004512", trainer, 9000m, engagementId));
        await ImportAsync(Order("PO-2026-005130", trainer, 6200m, engagementId: null));

        // The trainer sees ONE — the incomplete record cannot be built in
        // their DTO's shape, so it is not filtered out, it never exists.
        var mine = await GetAsync(trainer.Client, "/api/v1/me/entitlements");
        var visible = mine.EnumerateArray().Single();
        Assert.Equal("PO-2026-004512", visible.GetProperty("purchaseOrderNumber").GetString());
        Assert.Equal("AGR-2026-00042", visible.GetProperty("agreementReference").GetString());
        Assert.Equal("برنامج القيادة التنفيذية",
            visible.GetProperty("programName").GetProperty("ar").GetString());
        // A record in this shape has no way to say it is unlinked.
        Assert.False(visible.TryGetProperty("missingLinks", out _));
        Assert.False(visible.TryGetProperty("linkage", out _));

        // Staff see BOTH, and the incomplete one names the hop — «why can't I
        // see my payment?» is answered, which is what `US-0602` is for.
        var all = await GetAsync(staff, "/api/v1/internal/entitlements");
        Assert.Equal(2, all.GetArrayLength());
        var incomplete = all.EnumerateArray().Single(
            e => e.GetProperty("linkage").GetString() == "incomplete");
        Assert.Equal("PO-2026-005130",
            incomplete.GetProperty("purchaseOrderNumber").GetString());
        Assert.Equal(
            new[] { "programme" },
            incomplete.GetProperty("missingLinks").EnumerateArray()
                .Select(l => l.GetString()!).ToArray());
        // The complete member carries no `missingLinks` at all — the union is
        // two shapes, not one shape with a flag.
        var complete = all.EnumerateArray().Single(
            e => e.GetProperty("linkage").GetString() == "complete");
        Assert.False(complete.TryGetProperty("missingLinks", out _));
        Assert.Equal("د. سارة العتيبي", complete.GetProperty("trainerName").GetString());
    }

    [Fact]
    public async Task A_record_with_no_agreement_names_both_missing_hops()
    {
        using var staff = await SignInAsync("cap06-staff-2", "موظف", RoleCode.Manager);
        var trainer = await SeedTrainerAsync("cap06-trn-2", "أ. خالد المطيري");
        // No agreement, no engagement: hops 2 and 3 both fail, and hop 1 does
        // not — the purchase order is exactly what DID arrive.
        await ImportAsync(Order("PO-2026-005204", trainer, 5400m, engagementId: null));

        var all = await GetAsync(staff, "/api/v1/internal/entitlements");
        var row = all.EnumerateArray().Single();
        Assert.Equal(
            new[] { "agreement", "programme" },
            row.GetProperty("missingLinks").EnumerateArray()
                .Select(l => l.GetString()!).ToArray());
        Assert.Equal("PO-2026-005204", row.GetProperty("purchaseOrderNumber").GetString());
        Assert.Null(row.GetProperty("agreementReference").GetString());

        Assert.Empty((await GetAsync(trainer.Client, "/api/v1/me/entitlements")).EnumerateArray());
    }

    /* ── `F-0603` — the link is automatic, and therefore derived ───────────── */

    [Fact]
    public async Task The_chain_completes_itself_when_the_agreement_becomes_active()
    {
        using var staff = await SignInAsync("cap06-staff-3", "موظف", RoleCode.Manager);
        var trainer = await SeedTrainerAsync("cap06-trn-3", "د. ريم القحطاني");
        var engagementId = await SeedEngagementAsync(trainer, "التخطيط المالي المؤسسي");
        var message = Order("PO-2026-004610", trainer, 8000m, engagementId);

        // ERP sends the order first — the agreement is not active yet.
        await ImportAsync(message);
        Assert.Empty((await GetAsync(trainer.Client, "/api/v1/me/entitlements")).EnumerateArray());

        // The agreement is signed. The SAME order, re-sent, now resolves —
        // nobody linked anything, because `F-0603` is not something anybody
        // does. A stored `linkage_complete` would still read false here.
        await SeedActiveAgreementAsync(trainer, "AGR-2026-00201");
        await ImportAsync(message);

        var mine = await GetAsync(trainer.Client, "/api/v1/me/entitlements");
        Assert.Equal("AGR-2026-00201",
            mine.EnumerateArray().Single().GetProperty("agreementReference").GetString());

        // And it is still ONE record — a re-send updates the order in place,
        // because ERP is the master and the last thing it said is the state.
        var all = await GetAsync(staff, "/api/v1/internal/entitlements");
        Assert.Equal(1, all.GetArrayLength());
    }

    [Fact]
    public async Task An_engagement_that_belongs_to_someone_else_is_not_a_link()
    {
        using var staff = await SignInAsync("cap06-staff-4", "موظف", RoleCode.Manager);
        var mine = await SeedTrainerAsync("cap06-trn-4a", "مدرب أ");
        var theirs = await SeedTrainerAsync("cap06-trn-4b", "مدرب ب");
        await SeedActiveAgreementAsync(mine, "AGR-2026-00300");
        var theirEngagement = await SeedEngagementAsync(theirs, "برنامج آخر");

        // The mirror is ERP's, but the chain is the platform's to verify.
        await ImportAsync(Order("PO-2026-006000", mine, 4000m, theirEngagement));

        var all = await GetAsync(staff, "/api/v1/internal/entitlements");
        var row = all.EnumerateArray().Single(
            e => e.GetProperty("trainerName").GetString() == "مدرب أ");
        Assert.Equal("incomplete", row.GetProperty("linkage").GetString());
        Assert.Contains("programme",
            row.GetProperty("missingLinks").EnumerateArray().Select(l => l.GetString()));
    }

    /* ── `P-128` / `P-125` — consumed whole, computed never ────────────────── */

    [Fact]
    public async Task The_status_is_rendered_as_ERP_sent_it_and_no_total_is_returned()
    {
        using var staff = await SignInAsync("cap06-staff-5", "موظف", RoleCode.Manager);
        var trainer = await SeedTrainerAsync("cap06-trn-5", "مدرب الحالة");

        // A status the platform has never heard of — `Q27` leaves the value
        // set undefined, so recognising none of them is the design.
        await ImportAsync(new ErpPurchaseOrderMessage(
            "PO-2026-007000", trainer.TrainerId.ToString(), 1234.50m, "SAR",
            "ERP-SOMETHING-NEW", "حالة جديدة", "A new status", null));

        var all = await GetAsync(staff, "/api/v1/internal/entitlements");
        var row = all.EnumerateArray().Single();
        var status = row.GetProperty("status");
        Assert.Equal("ERP-SOMETHING-NEW", status.GetProperty("code").GetString());
        Assert.Equal("حالة جديدة", status.GetProperty("label").GetProperty("ar").GetString());
        Assert.Equal(1234.50m, row.GetProperty("amount").GetProperty("value").GetDecimal());
        Assert.Equal("SAR", row.GetProperty("amount").GetProperty("currency").GetString());
        // Pending — ERP issued no date, and none is invented.
        Assert.Equal(JsonValueKind.Null, row.GetProperty("disbursementDate").ValueKind);

        // §8.6.1 — «لا تحتسب هذه القدرة أي مبلغ». The payload is an array of
        // records and nothing else: there is no envelope to hold a sum.
        Assert.Equal(JsonValueKind.Array, all.ValueKind);
    }

    [Fact]
    public async Task An_unlabelled_status_falls_back_to_the_code_rather_than_to_invented_Arabic()
    {
        using var staff = await SignInAsync("cap06-staff-6", "موظف", RoleCode.Manager);
        var trainer = await SeedTrainerAsync("cap06-trn-6", "مدرب بلا وسم");
        await ImportAsync(new ErpPurchaseOrderMessage(
            "PO-2026-007100", trainer.TrainerId.ToString(), 100m, "SAR",
            "ERP-RAW", StatusLabelAr: null, StatusLabelEn: null, null));

        var row = (await GetAsync(staff, "/api/v1/internal/entitlements"))
            .EnumerateArray().Single();
        Assert.Equal("ERP-RAW",
            row.GetProperty("status").GetProperty("label").GetProperty("ar").GetString());
    }

    /* ── who sees what ─────────────────────────────────────────────────────── */

    [Fact]
    public async Task A_trainer_sees_their_own_records_and_no_one_elses()
    {
        var first = await SeedTrainerAsync("cap06-trn-7a", "مدرب واحد");
        var second = await SeedTrainerAsync("cap06-trn-7b", "مدرب اثنان");
        await SeedActiveAgreementAsync(first, "AGR-2026-00401");
        await SeedActiveAgreementAsync(second, "AGR-2026-00402");
        await ImportAsync(Order("PO-A", first, 1m,
            await SeedEngagementAsync(first, "برنامج الأول")));
        await ImportAsync(Order("PO-B", second, 2m,
            await SeedEngagementAsync(second, "برنامج الثاني")));

        var mine = await GetAsync(first.Client, "/api/v1/me/entitlements");
        Assert.Equal("PO-A",
            mine.EnumerateArray().Single().GetProperty("purchaseOrderNumber").GetString());
    }

    [Fact]
    public async Task The_staff_view_is_gated_on_F_0602_and_filters_by_trainer_and_linkage()
    {
        using var staff = await SignInAsync("cap06-staff-8", "موظف", RoleCode.Manager);
        var withLink = await SeedTrainerAsync("cap06-trn-8a", "سارة");
        var withoutLink = await SeedTrainerAsync("cap06-trn-8b", "خالد");
        await SeedActiveAgreementAsync(withLink, "AGR-2026-00501");
        await ImportAsync(Order("PO-C", withLink, 3m,
            await SeedEngagementAsync(withLink, "برنامج مكتمل")));
        await ImportAsync(Order("PO-D", withoutLink, 4m, engagementId: null));

        // `BR-0603` — staff isolate exactly the records their trainer cannot see.
        var incomplete = await GetAsync(staff, "/api/v1/internal/entitlements?linkage=incomplete");
        Assert.Equal("PO-D",
            incomplete.EnumerateArray().Single().GetProperty("purchaseOrderNumber").GetString());

        // `US-0602` is per trainer — staff look someone up to answer their call.
        var byName = await GetAsync(staff, "/api/v1/internal/entitlements?trainer=سارة");
        Assert.Equal("PO-C",
            byName.EnumerateArray().Single().GetProperty("purchaseOrderNumber").GetString());

        // A trainer holds `F-0601`, never `F-0602`: the staff view is not
        // theirs, and the gate says so rather than serving an empty list.
        using var response = await withLink.Client.GetAsync("/api/v1/internal/entitlements");
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    /* ── the importer ──────────────────────────────────────────────────────── */

    [Fact]
    public async Task A_purchase_order_for_an_unknown_person_is_mirrored_but_not_projected()
    {
        using var staff = await SignInAsync("cap06-staff-9", "موظف", RoleCode.Manager);

        await using (var db = _database.CreateContext())
        {
            var hub = new IntegrationHub(db);
            var importer = new ErpEntitlementImporter(db, hub);
            var projected = await importer.ApplyAsync(new ErpPurchaseOrderMessage(
                "PO-2026-009999", "nobody@example.invalid", 500m, "SAR",
                "ERP-PAID", "مصروف", "Disbursed", DateTime.UtcNow));
            // Unattributed, not incompletely linked — `BR-0603` names three
            // hops and the trainer is not one of them.
            Assert.Null(projected);
            await db.SaveChangesAsync();
        }

        await using (var db = _database.CreateContext())
        {
            // What ERP sent is kept — losing it because we could not attribute
            // it would help nobody.
            Assert.True(await db.ErpPurchaseOrders
                .AnyAsync(p => p.PurchaseOrderNumber == "PO-2026-009999"));
            Assert.False(await db.Entitlements
                .AnyAsync(e => e.PurchaseOrderNumber == "PO-2026-009999"));
        }

        Assert.Empty((await GetAsync(staff, "/api/v1/internal/entitlements")).EnumerateArray());
    }

    [Fact]
    public async Task The_import_records_the_crossing_and_the_replication_state()
    {
        var trainer = await SeedTrainerAsync("cap06-trn-10", "مدرب التتبع");
        await ImportAsync(Order("PO-2026-010000", trainer, 10m, engagementId: null));

        await using var db = _database.CreateContext();
        var entitlement = await db.Entitlements
            .SingleAsync(e => e.PurchaseOrderNumber == "PO-2026-010000");
        // `BR-1203` — the last known state, visibly dated.
        Assert.Equal(DriftStatuses.InSync, entitlement.SyncStatus);
        Assert.NotEqual(default, entitlement.LastSyncedAt);
        var state = await db.ReplicationStates.SingleAsync(
            s => s.LocalEntityId == entitlement.EntitlementId);
        Assert.Equal(IntegrationSystems.Erp, state.SystemCode);
        Assert.Equal(MasterSides.Remote, state.MasterSide);
        // `BR-1204` — the crossing is in the log.
        Assert.True(await db.IntegrationLog.AnyAsync(
            l => l.EntityId == entitlement.EntitlementId && l.Operation == "consume"));
    }

    /* ── helpers ───────────────────────────────────────────────────────────── */

    private sealed record SeededTrainer(Guid TrainerId, Guid UserId, HttpClient Client);

    private static ErpPurchaseOrderMessage Order(
        string poNumber, SeededTrainer trainer, decimal amount, Guid? engagementId) =>
        new(poNumber, trainer.TrainerId.ToString(), amount, "SAR",
            "ERP-PAID", "مصروف", "Disbursed", new DateTime(2026, 7, 2, 0, 0, 0, DateTimeKind.Utc),
            engagementId);

    private async Task ImportAsync(ErpPurchaseOrderMessage message)
    {
        await using var db = _database.CreateContext();
        var importer = new ErpEntitlementImporter(db, new IntegrationHub(db));
        await importer.ApplyAsync(message);
        await db.SaveChangesAsync();
    }

    private async Task<SeededTrainer> SeedTrainerAsync(string subject, string displayName)
    {
        var client = await SignInAsync(subject, displayName, RoleCode.Trainer);
        await using var db = _database.CreateContext();
        var user = await db.Users.SingleAsync(u => u.ExternalIdentityId == subject);
        var application = new Application
        {
            ApplicationId = Guid.NewGuid(),
            ApplicantUserId = user.UserId,
            SchemaVersion = FormSchemaVersions.Current,
            Reference = $"EH-2026-{Random.Shared.Next(10000, 99999)}",
            Status = ApplicationStatuses.Active,
            Origin = ApplicationOrigins.SelfService,
            CreatedAt = DateTime.UtcNow,
            SubmittedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };
        db.Applications.Add(application);
        var profile = new TrainerProfile
        {
            TrainerId = Guid.NewGuid(),
            UserId = user.UserId,
            ApplicationId = application.ApplicationId,
            FileStatus = TrainerFileStatuses.Active,
            VisibilityConsent = false,
            CreatedAt = DateTime.UtcNow,
        };
        db.TrainerProfiles.Add(profile);
        await db.SaveChangesAsync();
        return new SeededTrainer(profile.TrainerId, user.UserId, client);
    }

    private async Task SeedActiveAgreementAsync(SeededTrainer trainer, string reference)
    {
        await using var db = _database.CreateContext();
        var applicationId = await db.TrainerProfiles
            .Where(p => p.TrainerId == trainer.TrainerId)
            .Select(p => p.ApplicationId).SingleAsync();
        db.Agreements.Add(new Agreement
        {
            AgreementId = Guid.NewGuid(),
            TrainerUserId = trainer.UserId,
            ApplicationId = applicationId,
            Reference = reference,
            Status = AgreementStatuses.Active,
            FieldValues = "{}",
            CreatedBy = trainer.UserId,
            CreatedAt = DateTime.UtcNow,
        });
        await db.SaveChangesAsync();
    }

    /// <summary>
    /// The programme end of `BR-0602`'s third hop: an engagement whose slot's
    /// request carries the centre's entered programme name (`DM-GAP-06`).
    /// </summary>
    private async Task<Guid> SeedEngagementAsync(SeededTrainer trainer, string programName)
    {
        await using var db = _database.CreateContext();
        var request = new AssignmentRequest
        {
            RequestId = Guid.NewGuid(),
            Reference = $"ASR-2026-{Random.Shared.Next(1000, 9999)}",
            ServiceType = "training",
            RequestType = "تنفيذ برنامج تدريبي",
            CentreId = "centre-1",
            ResponsibleEmployee = "موظف المركز",
            RequiredHeadcount = 1,
            Status = "matching",
            FormValues = JsonSerializer.Serialize(new { programName }),
            CreatedBy = trainer.UserId,
            CreatedAt = DateTime.UtcNow,
        };
        db.AssignmentRequests.Add(request);
        var slot = new AssignmentSlot
        {
            SlotId = Guid.NewGuid(),
            RequestId = request.RequestId,
            SlotNumber = 1,
            FastSyncState = "none",
        };
        db.AssignmentSlots.Add(slot);
        var offer = new AssignmentOffer
        {
            OfferId = Guid.NewGuid(),
            SlotId = slot.SlotId,
            TrainerId = trainer.TrainerId,
            Status = OfferStatuses.Accepted,
            Currency = "SAR",
            SentAt = DateTime.UtcNow,
        };
        db.AssignmentOffers.Add(offer);
        var engagement = new Engagement
        {
            EngagementId = Guid.NewGuid(),
            OfferId = offer.OfferId,
            TrainerId = trainer.TrainerId,
            SlotId = slot.SlotId,
            Status = EngagementStatuses.Completed,
            ConfirmedAt = DateTime.UtcNow,
        };
        db.Engagements.Add(engagement);
        await db.SaveChangesAsync();
        return engagement.EngagementId;
    }

    private async Task<HttpClient> SignInAsync(string subject, string name, RoleCode? platformRole)
    {
        var client = TestOidc.CreateClient(_configured!);
        await TestOidc.SignInAsync(
            client, _tokenEndpoint,
            platformRole is null or RoleCode.Trainer ? "unmapped" : "fa-staff",
            subject: subject, displayName: name);
        if (platformRole is { } granted)
        {
            await using var db = _database.CreateContext();
            var user = await db.Users.SingleAsync(u => u.ExternalIdentityId == subject);
            var roleRow = await db.Roles.SingleAsync(r => r.Code == granted);
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
        return client;
    }

    private static async Task<JsonElement> GetAsync(HttpClient client, string path)
    {
        var response = await client.GetAsync(path);
        var payload = await response.Content.ReadAsStringAsync();
        Assert.True(response.StatusCode == HttpStatusCode.OK,
            $"Expected 200 from {path}, got {(int)response.StatusCode}: {payload}");
        return JsonSerializer.Deserialize<JsonElement>(payload);
    }
}
