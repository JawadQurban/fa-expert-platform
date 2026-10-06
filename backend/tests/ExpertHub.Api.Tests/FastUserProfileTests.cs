using ExpertHub.Api.Applications;
using ExpertHub.Api.Auth;
using ExpertHub.Core.Domain;
using ExpertHub.Infrastructure.Fast;
using ExpertHub.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace ExpertHub.Api.Tests;

/// <summary>
/// `Users/Info` — read at sign-in and reflected into Expert Hub. The payload
/// below is the real response from the testing portal, trimmed of the fields
/// the product does not use.
/// </summary>
public sealed class FastUserProfileTests : IAsyncLifetime
{
    private readonly LocalDbFixture _database = new();

    public Task InitializeAsync() => _database.InitializeAsync();

    public Task DisposeAsync() => _database.DisposeAsync();

    private const string RealPayload = """
    {
      "email": "fast173768@fa.org.sa",
      "firstNameAr": "جواد", "firstNameEn": "JAWAD",
      "fullName": "جواد عبدالقادر قربان",
      "fullNameAr": "جواد عبدالقادر قربان",
      "fullNameEn": "JAWAD ABDULQADER QURBAN",
      "id": "15f9e3b7-2e91-4987-8c8d-b09100c5ba73",
      "idNumber": "1105419996",
      "dateOfBirth": "1999-10-22T00:00:00",
      "isEmployee": false,
      "nationalityCountryId": 1,
      "phoneNumber": "+966560349990",
      "preferredUiLanguage": "ar",
      "preferredCommunicationLanguage": "ar",
      "userName": "JawadQurban",
      "userOrganization": "الأكاديمية المالية ",
      "canChangeProfile": false,
      "socialMediaUrl": "",
      "jobTitle": "",
      "isOrganizationAdmin": false,
      "isOrganizationCoordinator": false,
      "bankAccount": "214242353", "bankName": "الاهلي",
      "bankBranch": "الاهلي كافد", "bankSwiftCode": "sa34567",
      "bankIBAN": "sa123456", "bankCountry": "السعودية",
      "bankCity": "الرياض", "nameInBankCard": "Jawad Qurban",
      "userRoles": ["مستخدم مسجل تابع لجهة"],
      "roles": [{ "displayName": "مستخدم مسجل", "code": 4, "systemName": "Individual" }],
      "userProfile": {
        "expertCorrector": false, "expertReviewer": false, "expertQuestionAuthor": false,
        "jobTitleAr": "", "jobTitleEn": ""
      }
    }
    """;

    [Fact]
    public void The_real_payload_parses_into_the_fields_the_product_uses()
    {
        var result = FastUserReader.Parse(RealPayload);
        Assert.True(result.Ok);
        var profile = result.Value!;

        // `D-15` — the name the inbox, the directory and search all lacked.
        Assert.Equal("جواد عبدالقادر قربان", profile.FullNameAr);
        Assert.Equal("JAWAD ABDULQADER QURBAN", profile.FullNameEn);
        Assert.Equal("1105419996", profile.IdNumber);
        Assert.Equal("+966560349990", profile.PhoneNumber);
        // ⚠️ `bankIBAN` is not camelCase — it needs its own mapping, and a
        // silent null here would look like "the applicant has no IBAN".
        Assert.Equal("sa123456", profile.BankIban);
        // FAST's roles arrive, and are informative only (`P-181`).
        Assert.Equal("Individual", Assert.Single(profile.Roles).SystemName);
    }

    [Fact]
    public void Only_the_bank_fields_FAST_actually_sent_are_carried()
    {
        var profile = FastUserReader.Parse(RealPayload).Value!;
        var bank = profile.BankFields();

        // Named as Expert Hub's own bank form names them, so the prefill lands
        // in the right boxes.
        Assert.Equal("sa123456", bank["iban"]);
        Assert.Equal("الاهلي", bank["bankName"]);
        Assert.Equal("Jawad Qurban", bank["accountHolderName"]);
        // `bankCurrency` was null in the real response and is simply absent —
        // an empty string is not data, and a half-filled prefill that claims
        // to be complete is worse than a blank form.
        Assert.False(bank.ContainsKey("bankCurrency"));
        Assert.Equal(8, bank.Count);
    }

    [Fact]
    public async Task Importing_replaces_the_placeholder_name_and_keeps_a_dated_replica()
    {
        var subject = "fast-" + Guid.NewGuid().ToString("N");
        await using (var db = _database.CreateContext())
        {
            // How a user looks today: the token carries only sub and email, so
            // the display name falls back to the username.
            db.Users.Add(new AppUser
            {
                UserId = Guid.NewGuid(),
                ExternalIdentityId = subject,
                Email = "fast173768@fa.org.sa",
                FullNameAr = "JawadQurban",
                FullNameEn = "JawadQurban",
                PreferredCommunicationLanguage = "ar",
                PreferredUiLanguage = "ar",
                CreatedAt = DateTime.UtcNow,
            });
            await db.SaveChangesAsync();
        }

        await using (var db = _database.CreateContext())
        {
            var profile = FastUserReader.Parse(RealPayload).Value!;
            await FastProfileImport.ApplyAsync(db, subject, profile, CancellationToken.None);
            await db.SaveChangesAsync();
        }

        await using (var db = _database.CreateContext())
        {
            var user = await db.Users.SingleAsync(u => u.ExternalIdentityId == subject);
            Assert.Equal("جواد عبدالقادر قربان", user.FullNameAr);
            Assert.Equal("+966560349990", user.Phone);

            var replica = await db.FastProfiles.SingleAsync(p => p.UserId == user.UserId);
            Assert.Equal("1105419996", replica.IdNumber);
            Assert.False(replica.CanChangeProfile);
            Assert.Contains("Individual", replica.FastRoles, StringComparison.Ordinal);
            // `BR-1203` — the last known state, visibly dated.
            Assert.NotEqual(default, replica.LastSyncedAt);
        }
    }

    [Fact]
    public async Task The_bank_form_is_offered_what_the_Academy_holds_but_nothing_is_confirmed()
    {
        // `J-09/F6` — the applicant was stuck with no way to supply an IBAN,
        // and the Academy had all eight fields on file the whole time.
        var subject = "fast-" + Guid.NewGuid().ToString("N");
        Guid userId;
        await using (var db = _database.CreateContext())
        {
            var user = new AppUser
            {
                UserId = Guid.NewGuid(),
                ExternalIdentityId = subject,
                Email = "bank@fa.org.sa",
                FullNameAr = "مقدم طلب",
                FullNameEn = "Applicant",
                PreferredCommunicationLanguage = "ar",
                PreferredUiLanguage = "ar",
                CreatedAt = DateTime.UtcNow,
            };
            userId = user.UserId;
            db.Users.Add(user);
            await db.SaveChangesAsync();

            await FastProfileImport.ApplyAsync(
                db, subject, FastUserReader.Parse(RealPayload).Value!, CancellationToken.None);
            await db.SaveChangesAsync();
        }

        await using (var db = _database.CreateContext())
        {
            var suggestion = await BankPrefill.ForUserAsync(db, userId, CancellationToken.None);
            Assert.NotNull(suggestion);
            Assert.Equal("sa123456", suggestion!["iban"]);
            Assert.Equal("Jawad Qurban", suggestion["accountHolderName"]);

            /*
             * ⚠️ The rule the whole design turns on: offering is not
             * submitting. `AC-4` makes the applicant's own confirmation what
             * unblocks agreement preparation, so a suggestion must leave
             * BANK_DATA untouched — no row, and certainly no completed_at.
             */
            Assert.False(await db.BankData.AnyAsync(b => b.UserId == userId));
        }
    }

    [Theory]
    // The country name, as `GetCountries` sends it.
    [InlineData("Saudi Arabia", "المملكة العربية السعودية", null, null, "sa")]
    // ⚠️ The NATIONALITY fields, which is what left `nationality_code` null on
    // the server: the row resolved, both name fields were empty, and `Resolve`
    // returned null without anybody being able to see why.
    [InlineData(null, null, "Saudi", "سعودي", "sa")]
    [InlineData("Kuwait", "الكويت", null, null, "gcc")]
    [InlineData("United Arab Emirates", "الإمارات", null, null, "gcc")]
    [InlineData("Egypt", "مصر", null, null, "other")]
    public void A_country_resolves_to_the_forms_own_nationality_value(
        string? nameEn, string? nameAr, string? nationalityEn, string? nationalityAr,
        string expected)
    {
        var resolved = FastNationality.Resolve(new FastCountryItem
        {
            Id = 1,
            NameEn = nameEn,
            NameAr = nameAr,
            NationalityEn = nationalityEn,
            NationalityAr = nationalityAr,
        });

        Assert.Equal(expected, resolved);
    }

    [Fact]
    public void A_country_with_no_name_at_all_resolves_to_nothing()
    {
        // ⚠️ NOT «other». A row that carries no name is a row this did not
        // understand, and «other» is an answer — it would put a value in a
        // government form's nationality field on the strength of an empty
        // record.
        Assert.Null(FastNationality.Resolve(new FastCountryItem { Id = 1 }));
        Assert.Null(FastNationality.Resolve(null));
    }

    /* ── the identity FAST verified, in the form's own boxes ──────────────── */

    [Theory]
    // The real payload: given name, father, family. The form's THIRD-name box
    // stays empty, which is correct — there is no third name here.
    [InlineData("جواد عبدالقادر قربان", "جواد", "جواد", "عبدالقادر", null, "قربان")]
    // The four-part shape.
    [InlineData("سارة محمد علي الشمري", "سارة", "سارة", "محمد", "علي", "الشمري")]
    // Two parts.
    [InlineData("نورة القحطاني", "نورة", "نورة", null, null, "القحطاني")]
    // English, from the same record.
    [InlineData("JAWAD ABDULQADER QURBAN", "JAWAD", "JAWAD", "ABDULQADER", null, "QURBAN")]
    public void A_full_name_splits_into_the_forms_four_boxes(
        string full, string first,
        string? expectFirst, string? expectMiddle, string? expectThird, string? expectFamily)
    {
        var (parts, confident) = FastNameSplit.Split(full, first);

        Assert.True(confident);
        Assert.Equal(expectFirst, parts.First);
        Assert.Equal(expectMiddle, parts.Middle);
        Assert.Equal(expectThird, parts.Third);
        Assert.Equal(expectFamily, parts.Family);
    }

    [Fact]
    public void A_name_with_more_tokens_than_parts_keeps_the_first_and_splits_nothing()
    {
        /*
         * ⚠️ «عبد الرحمن» is ONE name written as two tokens, so this name has
         * five tokens and four parts. There is no rule that recovers the
         * intended split, and putting «الرحمن» in the father's box is a wrong
         * answer in a field on a government form.
         *
         * So the given name — which FAST sent explicitly and is therefore not
         * a guess — is kept, and the rest is left for the person to fill in.
         * `Confident` is false so the caller can tell the difference.
         */
        var (parts, confident) = FastNameSplit.Split(
            "محمد عبد الرحمن بن علي الغامدي", "محمد");

        Assert.False(confident);
        Assert.Equal("محمد", parts.First);
        Assert.Null(parts.Middle);
        Assert.Null(parts.Third);
        Assert.Null(parts.Family);
    }

    [Fact]
    public void Everything_the_Academy_holds_lands_in_the_forms_own_fields()
    {
        /*
         * Owner ruling, 2026-09-10: «work on all the data from FAST … all this
         * information on the API, also for the approved one».
         */
        var replica = new FastProfileReplica
        {
            UserId = Guid.NewGuid(),
            FirstNameAr = "جواد",
            FirstNameEn = "JAWAD",
            IdNumber = "1105419996",
            DateOfBirth = new DateTime(1999, 10, 22, 0, 0, 0, DateTimeKind.Utc),
            NationalityCode = "sa",
            JobTitle = "محلل مالي",
            Organization = "الأكاديمية المالية",
            SocialMediaUrl = "https://www.linkedin.com/in/jawad",
        };

        var fields = new Dictionary<string, string>(StringComparer.Ordinal);
        var filled = FastFieldMap.Add(
            replica, "جواد عبدالقادر قربان", "JAWAD ABDULQADER QURBAN", fields);

        Assert.Equal("جواد", fields["firstNameAr"]);
        Assert.Equal("عبدالقادر", fields["middleNameAr"]);
        Assert.Equal("قربان", fields["lastNameAr"]);
        Assert.Equal("JAWAD", fields["firstNameEn"]);
        Assert.Equal("QURBAN", fields["lastNameEn"]);
        Assert.Equal("1105419996", fields["idNumber"]);
        Assert.Equal("1999-10-22", fields["dateOfBirth"]);
        Assert.Equal("sa", fields["nationality"]);
        Assert.Equal("محلل مالي", fields["jobTitle"]);

        // ⚠️ ONE `socialMediaUrl` and TWO fields. A linkedin.com address is a
        // LinkedIn account; anything else is a personal site. The one thing
        // never done is filling both with the same value.
        Assert.Equal("https://www.linkedin.com/in/jawad", fields["linkedin"]);
        Assert.False(fields.ContainsKey("personalWebsite"));

        /*
         * ⚠️ `gender` is absent, and stays absent until FAST sends it.
         * `Users/Info` has no gender property at all — not an empty one, none
         * — and it cannot be derived from a name or an ID number.
         */
        Assert.False(fields.ContainsKey("gender"));

        // Provenance is reported, because a value the Academy verified must
        // not be labelled as something this platform is waiting for.
        Assert.Contains("idNumber", filled.Filled);
        Assert.Contains("firstNameAr", filled.Filled);
    }

    [Fact]
    public void A_personal_site_goes_in_the_personal_site_box()
    {
        var fields = new Dictionary<string, string>(StringComparer.Ordinal);
        FastFieldMap.Add(
            new FastProfileReplica
            {
                UserId = Guid.NewGuid(),
                SocialMediaUrl = "https://jawad.example.sa",
            },
            null, null, fields);

        Assert.Equal("https://jawad.example.sa", fields["personalWebsite"]);
        Assert.False(fields.ContainsKey("linkedin"));
    }

    [Fact]
    public void The_FAST_owned_list_matches_what_the_schema_declares()
    {
        /*
         * ⚠️ Two lists that must not drift. The seeded schema marks a field
         * `"ownership":"sso-profile"` and `FastFieldMap.FastOwnedFields`
         * mirrors it; if they diverge, a value gets labelled as coming from
         * the Academy when it did not, or the other way round — and the label
         * is what tells a person whether a field still needs their attention.
         */
        var declared = ApplicationSeedData.Fields
            .Select(field => (dynamic)field)
            .Where(field => ((string)field.Definition)
                .Contains("\"ownership\":\"sso-profile\"", StringComparison.Ordinal))
            .Select(field => (string)field.FieldCode)
            .ToHashSet(StringComparer.Ordinal);

        Assert.Equal(declared, FastFieldMap.FastOwnedFields.ToHashSet(StringComparer.Ordinal));
    }

    [Fact]
    public void The_Academy_record_fills_the_platforms_own_qualification_fields()
    {
        /*
         * Owner ruling, 2026-09-10: «it shouldn't do this at all, it should
         * save in the same qualification in the platform». Not a second panel
         * beside «المؤهل العلمي» — the same fields the form already has.
         */
        var replica = new FastProfileReplica
        {
            UserId = Guid.NewGuid(),
            QualificationsSyncedAt = DateTime.UtcNow,
            QualificationsEducation = """
                [
                  {"qualificationsType":"بكالوريوس","specialization":"محاسبة",
                   "donor":"جامعة الملك سعود","dateObtained":"2012-06-01T00:00:00"},
                  {"qualificationsType":"ماجستير","generalSpecialization":"المالية",
                   "specialization":"تمويل","donor":"جامعة الملك فهد",
                   "dateObtained":"2018-05-14T00:00:00"}
                ]
                """,
            QualificationsProfessional = """
                [{"certificateName":"CFA Level I","donor":"CFA Institute",
                  "dateObtained":"2020-02-03T00:00:00","attachmentName":"cfa.pdf",
                  "attachmentDownloadUrl":"https://fast.example/doc/1"}]
                """,
        };

        var fields = new Dictionary<string, string>(StringComparer.Ordinal);
        FastQualificationFields.Add(replica, fields);

        // ⚠️ The MASTER'S, not the bachelor's: FAST holds a list, the form has
        // one of each, and newest-first decides which one shows.
        Assert.Equal("master", fields["qualificationType"]);
        Assert.Equal("تمويل", fields["specializationDetail"]);
        Assert.Equal("جامعة الملك فهد", fields["universityName"]);
        Assert.Equal("2018-05-14", fields["qualificationDate"]);

        Assert.Equal("CFA Level I", fields["certificateName"]);
        Assert.Equal("CFA Institute", fields["issuingInstitution"]);
        Assert.Equal("2020-02-03", fields["certificateDate"]);
        Assert.Equal("cfa.pdf", fields["certificateAttachmentName"]);

        /*
         * ⚠️ `generalSpecialization` is a SELECT over five options and FAST's
         * «المالية» is free text from an open list. It is left empty so the
         * page marks it missing — true — rather than filled with a value the
         * person never chose. The same rule leaves an unrecognised degree
         * empty; see the case below.
         */
        Assert.False(fields.ContainsKey("generalSpecialization"));
    }

    [Fact]
    public void The_entry_shown_in_the_fields_is_reported_so_it_is_not_listed_twice()
    {
        /*
         * Owner ruling, 2026-09-10: «the user can add multiple experience
         * roles … I think it's in FAST». It is: FAST holds a list, the form
         * holds one of each, and the rest are listed read-only beneath.
         *
         * ⚠️ Which makes double-rendering the real risk. `P-258` removed a
         * panel that duplicated «المؤهل العلمي» beside itself; the list must
         * not put it back. So the mapping reports whether its newest entry
         * reached the fields, and the profile skips exactly that one.
         */
        var replica = new FastProfileReplica
        {
            UserId = Guid.NewGuid(),
            QualificationsSyncedAt = DateTime.UtcNow,
            QualificationsEducation = """
                [{"qualificationsType":"ماجستير","donor":"جامعة الملك فهد",
                  "dateObtained":"2018-05-14T00:00:00"},
                 {"qualificationsType":"بكالوريوس","donor":"جامعة الملك سعود",
                  "dateObtained":"2012-06-01T00:00:00"}]
                """,
        };

        var fields = new Dictionary<string, string>(StringComparer.Ordinal);
        var used = FastQualificationFields.Add(replica, fields);

        Assert.True(used.Education);
        Assert.Equal("جامعة الملك فهد", fields["universityName"]);
        // No professional record at all — nothing was consumed, and nothing
        // must be skipped when the list is built.
        Assert.False(used.Professional);
    }

    [Fact]
    public void An_answer_the_person_wrote_themselves_leaves_every_Academy_record_to_the_list()
    {
        /*
         * ⚠️ The case that makes `Skip(1)` wrong if applied blindly. The
         * trainer's own answer filled the fields, so NO FAST entry is on
         * screen — and skipping one would silently hide a qualification.
         */
        var replica = new FastProfileReplica
        {
            UserId = Guid.NewGuid(),
            QualificationsSyncedAt = DateTime.UtcNow,
            QualificationsEducation = """
                [{"qualificationsType":"ماجستير","donor":"جامعة من فاست",
                  "dateObtained":"2018-05-14T00:00:00"}]
                """,
        };

        var fields = new Dictionary<string, string>(StringComparer.Ordinal)
        {
            ["universityName"] = "ما كتبه المتقدم بنفسه",
            ["specializationDetail"] = "تخصص كتبه بنفسه",
        };
        var used = FastQualificationFields.Add(replica, fields);

        Assert.False(used.Education);
        Assert.Equal("ما كتبه المتقدم بنفسه", fields["universityName"]);
    }

    [Fact]
    public void An_unrecognised_degree_leaves_the_select_empty_rather_than_guessing()
    {
        var replica = new FastProfileReplica
        {
            UserId = Guid.NewGuid(),
            QualificationsSyncedAt = DateTime.UtcNow,
            QualificationsEducation = """
                [{"qualificationsType":"زمالة مهنية","specialization":"مراجعة",
                  "donor":"الهيئة السعودية للمراجعين","dateObtained":"2015-01-01T00:00:00"}]
                """,
        };

        var fields = new Dictionary<string, string>(StringComparer.Ordinal);
        FastQualificationFields.Add(replica, fields);

        // The degree does not map; everything around it still does. A field
        // that cannot be answered honestly is worth less than the four that
        // can — it is not worth dropping them for.
        Assert.False(fields.ContainsKey("qualificationType"));
        Assert.Equal("مراجعة", fields["specializationDetail"]);
        Assert.Equal("الهيئة السعودية للمراجعين", fields["universityName"]);
    }

    [Fact]
    public void A_deleted_qualification_is_never_offered()
    {
        // ⚠️ FAST keeps removed rows in the payload and flags them. Somebody
        // who deleted a qualification there deleted it.
        var replica = new FastProfileReplica
        {
            UserId = Guid.NewGuid(),
            QualificationsSyncedAt = DateTime.UtcNow,
            QualificationsEducation = """
                [{"qualificationsType":"دكتوراه","donor":"جهة محذوفة",
                  "dateObtained":"2024-01-01T00:00:00","isDeleted":true},
                 {"qualificationsType":"بكالوريوس","donor":"جامعة قائمة",
                  "dateObtained":"2010-01-01T00:00:00"}]
                """,
        };

        var fields = new Dictionary<string, string>(StringComparer.Ordinal);
        FastQualificationFields.Add(replica, fields);

        Assert.Equal("bachelor", fields["qualificationType"]);
        Assert.Equal("جامعة قائمة", fields["universityName"]);
    }

    [Fact]
    public void The_persons_own_answer_is_never_overwritten_by_the_Academys_copy()
    {
        /*
         * ⚠️ The trainer's file holds what they wrote on an application the
         * Academy accredited; the replica holds what FAST had at their last
         * sign-in. Where both have a field, the answer stands.
         */
        var replica = new FastProfileReplica
        {
            UserId = Guid.NewGuid(),
            QualificationsSyncedAt = DateTime.UtcNow,
            QualificationsEducation = """
                [{"qualificationsType":"ماجستير","donor":"جامعة من فاست",
                  "dateObtained":"2018-05-14T00:00:00"}]
                """,
        };

        var fields = new Dictionary<string, string>(StringComparer.Ordinal)
        {
            ["universityName"] = "ما كتبه المتقدم بنفسه",
        };
        FastQualificationFields.Add(replica, fields);

        Assert.Equal("ما كتبه المتقدم بنفسه", fields["universityName"]);
        Assert.Equal("master", fields["qualificationType"]);
    }

    [Fact]
    public void A_record_that_was_never_read_fills_nothing()
    {
        // ⚠️ `QualificationsSyncedAt` null means «never read», which is not
        // the same as «the Academy holds none» — and neither is a reason to
        // invent a value.
        var fields = new Dictionary<string, string>(StringComparer.Ordinal);
        FastQualificationFields.Add(
            new FastProfileReplica { UserId = Guid.NewGuid() }, fields);
        FastQualificationFields.Add(null, fields);

        Assert.Empty(fields);
    }

    [Fact]
    public async Task The_application_form_is_offered_what_the_Academy_already_knows()
    {
        /*
         * Owner ruling, 2026-09-09: «the main data if he is logged in it should
         * appear directly, no need to write it again».
         */
        var subject = "fast-" + Guid.NewGuid().ToString("N");
        Guid userId;
        await using (var db = _database.CreateContext())
        {
            var user = new AppUser
            {
                UserId = Guid.NewGuid(),
                ExternalIdentityId = subject,
                Email = "applicant@fa.org.sa",
                FullNameAr = "مقدم طلب",
                FullNameEn = "Applicant",
                PreferredCommunicationLanguage = "ar",
                PreferredUiLanguage = "ar",
                CreatedAt = DateTime.UtcNow,
            };
            userId = user.UserId;
            db.Users.Add(user);
            await db.SaveChangesAsync();

            await FastProfileImport.ApplyAsync(
                db, subject, FastUserReader.Parse(RealPayload).Value!, CancellationToken.None);
            await db.SaveChangesAsync();
        }

        await using (var db = _database.CreateContext())
        {
            var suggestions = await ApplicationPrefill.ForUserAsync(
                db, userId, CancellationToken.None);

            // Keyed by the form's OWN field codes, so the page needs no mapping.
            Assert.Equal("1105419996", suggestions["idNumber"]);
            Assert.Equal("1999-10-22", suggestions["dateOfBirth"]);

            /*
             * ⚠️ The real payload carries no qualifications — `Users/Info` and
             * `qualifications-education` are different endpoints — so these
             * are absent here, and the cases above cover the mapping itself.
             */
            Assert.False(suggestions.ContainsKey("qualificationType"));

            /*
             * ⚠️ **This assertion used to say the opposite**, and it was
             * wrong. It listed the name fields as «deliberately absent,
             * because each would be a guess», on the stated basis that FAST
             * «sends one full name per script». It sends `firstNameAr` and
             * `firstNameEn` as their own fields and always has — the test
             * enshrined a claim nobody had checked against the payload sitting
             * a few lines above it.
             */
            Assert.Equal("جواد", suggestions["firstNameAr"]);
            Assert.Equal("عبدالقادر", suggestions["middleNameAr"]);
            Assert.Equal("قربان", suggestions["lastNameAr"]);
            Assert.Equal("JAWAD", suggestions["firstNameEn"]);
            Assert.Equal("QURBAN", suggestions["lastNameEn"]);

            /*
             * ⚠️ What IS still absent, and why each one stays that way:
             * `nationality` needs FAST's country lookup to run at sign-in and
             * this test never signed in; `gender` has no source at all —
             * `Users/Info` carries no such property; the two URL fields are
             * empty in the real payload, and an empty string is not an answer.
             */
            foreach (var absent in new[]
            {
                "nationality", "gender", "linkedin", "personalWebsite",
            })
            {
                Assert.False(suggestions.ContainsKey(absent), absent);
            }
        }
    }

    [Fact]
    public async Task Qualifications_are_stored_as_received_and_counted_without_a_schema()
    {
        /*
         * Owner ruling, 2026-09-09: the qualifications and professional
         * certifications should come from the Academy for an approved trainer.
         *
         * ⚠️ Stored as RAW JSON. All four endpoints return an undeclared
         * payload — the register names a request DTO for one of them and
         * defines none — so there are no field names to build columns from. A
         * count survives not knowing the shape, and is all this claims.
         */
        var subject = "fast-" + Guid.NewGuid().ToString("N");
        Guid userId;
        await using (var db = _database.CreateContext())
        {
            var user = new AppUser
            {
                UserId = Guid.NewGuid(),
                ExternalIdentityId = subject,
                Email = "trainer@fa.org.sa",
                FullNameAr = "مدرب",
                FullNameEn = "Trainer",
                PreferredCommunicationLanguage = "ar",
                PreferredUiLanguage = "ar",
                CreatedAt = DateTime.UtcNow,
            };
            userId = user.UserId;
            db.Users.Add(user);
            await db.SaveChangesAsync();
            await FastProfileImport.ApplyAsync(
                db, subject, FastUserReader.Parse(RealPayload).Value!, CancellationToken.None);
            await db.SaveChangesAsync();
        }

        var set = new FastQualificationSet(
            Education: """[{"anything":"at all"},{"shape":"unknown"}]""",
            PracticalExperience: """[{"x":1}]""",
            Professional: """[{"y":2},{"y":3},{"y":4}]""",
            TrainingCourses: null);

        Assert.Equal(2, set.Counts().Education);
        Assert.Equal(3, set.Counts().Professional);
        Assert.Equal(6, set.Counts().Total);

        await using (var db = _database.CreateContext())
        {
            await FastProfileImport.ApplyQualificationsAsync(
                db, userId, set, CancellationToken.None);
            await db.SaveChangesAsync();
        }

        await using (var db = _database.CreateContext())
        {
            var replica = await db.FastProfiles.SingleAsync(p => p.UserId == userId);
            // Verbatim, so the field names can be read off a real response.
            Assert.Contains("\"shape\":\"unknown\"", replica.QualificationsEducation);
            Assert.NotNull(replica.QualificationsSyncedAt);
        }
    }

    [Fact]
    public async Task A_collection_that_failed_to_read_does_not_erase_the_last_good_one()
    {
        /*
         * ⚠️ One endpoint being down must not wipe what a previous sign-in
         * stored. The replica is a record of the best answer we have had, not
         * of the most recent attempt.
         */
        var subject = "fast-" + Guid.NewGuid().ToString("N");
        Guid userId;
        await using (var db = _database.CreateContext())
        {
            var user = new AppUser
            {
                UserId = Guid.NewGuid(),
                ExternalIdentityId = subject,
                Email = "t2@fa.org.sa",
                FullNameAr = "مدرب",
                FullNameEn = "Trainer",
                PreferredCommunicationLanguage = "ar",
                PreferredUiLanguage = "ar",
                CreatedAt = DateTime.UtcNow,
            };
            userId = user.UserId;
            db.Users.Add(user);
            await db.SaveChangesAsync();
            await FastProfileImport.ApplyAsync(
                db, subject, FastUserReader.Parse(RealPayload).Value!, CancellationToken.None);
            await FastProfileImport.ApplyQualificationsAsync(
                db,
                userId,
                new FastQualificationSet("""[{"a":1}]""", null, null, null),
                CancellationToken.None);
            await db.SaveChangesAsync();
        }

        // A later sign-in where education could not be read at all.
        await using (var db = _database.CreateContext())
        {
            await FastProfileImport.ApplyQualificationsAsync(
                db, userId, new FastQualificationSet(null, null, null, null), CancellationToken.None);
            await db.SaveChangesAsync();
        }

        await using (var db = _database.CreateContext())
        {
            var replica = await db.FastProfiles.SingleAsync(p => p.UserId == userId);
            Assert.Contains("\"a\":1", replica.QualificationsEducation);
        }
    }

    [Fact]
    public async Task Nothing_is_suggested_for_someone_whose_record_was_never_read()
    {
        // A form pre-filled with blanks it presents as known is worse than an
        // empty one, so «no record» yields no suggestion at all.
        await using var db = _database.CreateContext();
        var suggestion = await BankPrefill.ForUserAsync(db, Guid.NewGuid(), CancellationToken.None);
        Assert.Null(suggestion);
    }

    [Fact]
    public async Task An_empty_remote_value_never_erases_a_name_we_already_show()
    {
        // `08` §1.1 inbound: a partially-filled remote profile must not blank
        // a field the platform is displaying.
        var subject = "fast-" + Guid.NewGuid().ToString("N");
        await using (var db = _database.CreateContext())
        {
            db.Users.Add(new AppUser
            {
                UserId = Guid.NewGuid(),
                ExternalIdentityId = subject,
                Email = "someone@fa.org.sa",
                FullNameAr = "اسم قائم",
                FullNameEn = "Existing Name",
                PreferredCommunicationLanguage = "ar",
                PreferredUiLanguage = "ar",
                CreatedAt = DateTime.UtcNow,
            });
            await db.SaveChangesAsync();
        }

        await using (var db = _database.CreateContext())
        {
            var sparse = FastUserReader.Parse("""{"fullNameAr":"","fullNameEn":null}""").Value!;
            await FastProfileImport.ApplyAsync(db, subject, sparse, CancellationToken.None);
            await db.SaveChangesAsync();
        }

        await using (var db = _database.CreateContext())
        {
            var user = await db.Users.SingleAsync(u => u.ExternalIdentityId == subject);
            Assert.Equal("اسم قائم", user.FullNameAr);
            Assert.Equal("Existing Name", user.FullNameEn);
        }
    }
}
