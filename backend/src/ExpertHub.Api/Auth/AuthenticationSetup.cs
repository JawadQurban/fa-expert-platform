using System.Security.Claims;
using System.Text.Json;
using ExpertHub.Api.Configuration;
using ExpertHub.Core.Domain;
using ExpertHub.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.OpenIdConnect;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Protocols.OpenIdConnect;

namespace ExpertHub.Api.Auth;

/// <summary>
/// INT-01 — the OIDC flow lives in the API (`P-163`), Authorization Code +
/// PKCE, with the browser holding only an HttpOnly session cookie.
/// </summary>
/// <remarks>
/// <para>
/// The framework's OpenID Connect handler performs the flow rather than
/// hand-rolled requests, because the playbook's non-negotiables — <c>iss</c>,
/// <c>aud</c>, <c>exp</c>, <c>nbf</c>, signature against JWKS, <c>nonce</c>,
/// server-side <c>state</c>, PKCE — are exactly the things a hand-rolled
/// implementation gets subtly wrong and the handler validates by default. A
/// token that merely parses is not a token that is valid.
/// </para>
/// <para>
/// <b>No credential is ever stored</b> (`BR-1205`, `BR-0808`): the API holds a
/// session, never a password, and there is no user table with a hash anywhere
/// in the schema (BE-01 made that structural).
/// </para>
/// </remarks>
public static partial class AuthenticationSetup
{
    /// <summary>The cookie the session lives in.</summary>
    public const string SessionCookieScheme = CookieAuthenticationDefaults.AuthenticationScheme;

    /// <summary>
    /// The coarse gate for `v1/internal/*` — the session must carry the
    /// <c>internal</c> role, the same boundary the frontend's
    /// <c>RequireRole("internal")</c> guards draw. <b>Fail closed</b>: while
    /// the `Q37` claim mapping is unconfigured nobody holds the claim, and
    /// internal endpoints deny. Fine-grained per-feature checks arrive when
    /// the matrix has approved contents to read (`DM-GAP-07`).
    /// </summary>
    public const string InternalPolicy = "expert-hub-internal";

    public static IServiceCollection AddExpertHubAuthentication(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        ArgumentNullException.ThrowIfNull(configuration);

        var oidc = configuration.GetSection(OidcOptions.Section).Get<OidcOptions>() ?? new OidcOptions();
        var access = configuration.GetSection(AccessOptions.Section).Get<AccessOptions>() ?? new AccessOptions();

        /*
         * ⚠️ The session ticket lives in the DATABASE, not in the cookie.
         *
         * Cookie authentication otherwise serialises every claim and every
         * saved token into the cookie itself, chunking it across
         * `ExpertHub.SessionC1`, `C2`… The browser sends all of it on every
         * request, and a reverse proxy answers `400 Request Header Or Cookie
         * Too Large` — which is what happened on the testing server
         * (2026-09-06). With a store the cookie is one GUID.
         *
         * Two things follow that are worth having on their own: logging out
         * DESTROYS the session rather than asking the browser to forget it,
         * and `Oidc:SessionMinutes` becomes a rule the server enforces.
         */
        // ⚠️ Only when there IS a database. Sign-in must keep working without
        // one — that is how a bootstrap administrator reaches a fresh
        // deployment, and there is a test for it. With no store the cookie
        // carries the ticket as before, which is correct: a deployment with no
        // database has no session table to put it in.
        if (!string.IsNullOrWhiteSpace(configuration.GetConnectionString("ExpertHub")))
        {
            services.AddSingleton<ITicketStore, DatabaseTicketStore>();
            services.AddHostedService<ExpiredTicketSweeper>();
            services.AddOptions<CookieAuthenticationOptions>(SessionCookieScheme)
                .Configure<ITicketStore>((options, store) => options.SessionStore = store);
        }

        var builder = services.AddAuthentication(options =>
        {
            options.DefaultScheme = SessionCookieScheme;
            // The cookie scheme handles the default challenge too — its events
            // turn challenges into 401/403. An API must never answer a data
            // request with a redirect to the identity provider; only
            // /api/auth/login challenges the OIDC scheme, and it names it
            // explicitly.
            options.DefaultChallengeScheme = SessionCookieScheme;
        });

        builder.AddCookie(options =>
        {
            options.Cookie.Name = "ExpertHub.Session";
            options.Cookie.HttpOnly = true;
            options.Cookie.SameSite = SameSiteMode.Lax;
            // Secure on every https request — which every real environment is
            // (the config layer refuses plain http outside localhost, P-160).
            // `SameAsRequest` rather than `Always` keeps localhost usable.
            options.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
            options.ExpireTimeSpan = TimeSpan.FromMinutes(Math.Max(1, oidc.SessionMinutes));
            // No sliding renewal: session lifetime semantics belong to the Q37
            // contract — inventing renewal behaviour would bake in an answer.
            options.SlidingExpiration = false;

            // This is an API consumed by a SPA, not a server-rendered site: an
            // unauthenticated request gets a status code, never a redirect.
            options.Events = new CookieAuthenticationEvents
            {
                OnRedirectToLogin = context =>
                {
                    context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                    return Task.CompletedTask;
                },
                OnRedirectToAccessDenied = context =>
                {
                    context.Response.StatusCode = StatusCodes.Status403Forbidden;
                    return Task.CompletedTask;
                },
            };
        });

        if (oidc.IsConfigured)
        {
            builder.AddOpenIdConnect(options =>
            {
                options.Authority = oidc.Authority;
                options.ClientId = oidc.ClientId;
                // Empty ⇒ a public client. Either client type works (P-163);
                // PKCE protects the exchange in both.
                options.ClientSecret = oidc.ClientSecret;
                options.ResponseType = OpenIdConnectResponseType.Code;
                options.UsePkce = true; // the default, stated on purpose — P-160
                // PAR keeps the request parameters off the front channel, but
                // hides provider-side rejections behind our API. Configurable
                // so the testing environment can show FAST's own screen.
                options.PushedAuthorizationBehavior = oidc.UsePushedAuthorization
                    ? PushedAuthorizationBehavior.UseIfAvailable
                    : PushedAuthorizationBehavior.Disable;
                options.CallbackPath = oidc.CallbackPath;
                options.SignInScheme = SessionCookieScheme;

                // Raw claim names (`sub`, `name`, whatever FAST answers for
                // Q37) — the legacy SOAP-era remapping would rename the very
                // claims the configuration points at.
                options.MapInboundClaims = false;
                options.TokenValidationParameters.NameClaimType =
                    string.IsNullOrWhiteSpace(oidc.NameClaim) ? "name" : oidc.NameClaim;

                // Kept so logout can pass `id_token_hint` to the provider —
                // never exposed to a browser. ⚠️ The access and refresh tokens
                // are DROPPED at `OnTicketReceived` below: nothing in the
                // product calls the provider's APIs on the user's behalf, and
                // a credential kept for no reason is a credential that can
                // leak for no reason.
                options.SaveTokens = true;

                // Q37 question 5: is the role claim in the ID token or only at
                // the userinfo endpoint? Configuration, so the answer is an edit.
                options.GetClaimsFromUserInfoEndpoint = oidc.UseUserInfo;

                options.Scope.Clear();
                foreach (var scope in oidc.Scopes.Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
                {
                    options.Scope.Add(scope);
                }

                options.Events = new OpenIdConnectEvents
                {
                    // Drop the credentials the product never uses. `SaveTokens`
                    // keeps the access and refresh tokens as well as the id
                    // token, and only `id_token` is read (for `id_token_hint`
                    // at logout). Storing the other two buys nothing and puts
                    // provider credentials at rest in our session table.
                    OnTicketReceived = async context =>
                    {
                        /*
                         * ⚠️ The ONE moment Expert Hub holds a FAST access
                         * token. `Users/Info` is scoped to the caller's own
                         * token, so the base profile is read HERE — and the
                         * token is still discarded immediately afterwards
                         * (`P-215`), so no live credential is kept for the
                         * life of the session.
                         *
                         * The cost of that choice, recorded honestly: the
                         * replica is only ever as fresh as the last sign-in,
                         * and staff still cannot read anyone else's profile.
                         */
                        string? accessToken = null;
                        context.Properties?.Items.TryGetValue(
                            ".Token.access_token", out accessToken);
                        if (!string.IsNullOrWhiteSpace(accessToken))
                        {
                            await FastProfileImport
                                .ImportAsync(context.HttpContext, context.Principal, accessToken)
                                .ConfigureAwait(false);
                        }
                        context.Properties?.Items.Remove(".Token.access_token");
                        context.Properties?.Items.Remove(".Token.refresh_token");
                    },
                    OnTokenValidated = async context =>
                    {
                        if (context.Principal?.Identity is ClaimsIdentity identity)
                        {
                            // Claim mapping stays honoured when configured, but
                            // P-181 rules the real source: FAST's token carries
                            // only the identity (sub + email) — roles are
                            // user-management data, resolved from Expert Hub's
                            // own USER_ROLE table (plus the bootstrap list).
                            MapRoles(identity, oidc);
                            await ResolvePlatformRolesAsync(context.HttpContext, identity, access)
                                .ConfigureAwait(false);
                        }
                    },
                    // A failed handshake — state mismatch, provider error, an
                    // invalid token — lands the user somewhere sane, with no
                    // session issued and no stack trace leaked.
                    OnRemoteFailure = context =>
                    {
                        context.Response.Redirect($"{oidc.FrontendReturnPath}?error=sso_failed");
                        context.HandleResponse();
                        return Task.CompletedTask;
                    },
                };
            });
        }

        services.AddAuthorization(options =>
            options.AddPolicy(InternalPolicy, policy =>
                policy.RequireClaim(ExpertHubClaims.Role, ExpertHubClaims.InternalRole)));

        return services;
    }

    /// <summary>
    /// P-181 — the platform's own role resolution, run at sign-in.
    /// </summary>
    /// <remarks>
    /// <para>
    /// (1) The user's <c>APP_USER</c> row is resolved (created on first login —
    /// `BR-1205`: a reference to the FAST identity, never a credential; the
    /// token carries only <c>sub</c> and <c>email</c>, so both name columns
    /// hold the best available display value until the profile supplies real
    /// names). (2) Their <c>USER_ROLE</c> rows map onto the two coarse session
    /// roles — <c>trainer</c> for the trainer role, <c>internal</c> for any of
    /// the five staff roles (§8.8.5 collapsed per `02_IA` §7). (3) A bootstrap
    /// administrator (matched by <c>sub</c> or email against configuration) is
    /// granted — and persisted with an audit entry when the database is up —
    /// the system-administrator role, because an empty USER_ROLE table can
    /// authorize nobody to fill it.
    /// </para>
    /// <para>
    /// The roles are a snapshot in the session cookie: an assignment made
    /// while someone is signed in reaches them on their next sign-in.
    /// Database unavailable (the testing server today) ⇒ the DB steps are
    /// skipped and only the bootstrap grant applies — fail closed for
    /// everyone else.
    /// </para>
    /// </remarks>
    /// <summary>
    /// `DEF-06` — re-issue the CURRENT session with a role that was granted
    /// during it.
    ///
    /// <para>
    /// Roles are a snapshot in the session cookie, recomputed at sign-in. That
    /// is the right design for a role an administrator grants — the holder
    /// learns of it next time they arrive — but wrong for one the holder earns
    /// by an action they just completed: an applicant who signed their
    /// agreement became a trainer and was then refused every trainer surface
    /// until they signed out and in again.
    /// </para>
    /// <para>
    /// This adds the SAME claim <see cref="ResolvePlatformRolesAsync"/> would
    /// add at the next sign-in, to the SAME cookie scheme, through the
    /// framework's own sign-in. It is not a second authorization source and it
    /// cannot widen anything: the caller passes a role the database has
    /// already been told to grant, and every downstream check is unchanged.
    /// </para>
    /// </summary>
    public static async Task AddSessionRoleAsync(HttpContext http, string role)
    {
        ArgumentNullException.ThrowIfNull(http);

        if (http.User.Identity is not ClaimsIdentity identity
            || identity.IsAuthenticated is false
            || identity.HasClaim(ExpertHubClaims.Role, role))
        {
            return;
        }
        identity.AddClaim(new Claim(ExpertHubClaims.Role, role));
        // Re-signing in replaces the stored ticket; the browser keeps the same
        // cookie, so nothing about the session's identity or lifetime changes.
        await http.SignInAsync(
            SessionCookieScheme, new ClaimsPrincipal(identity)).ConfigureAwait(false);
    }

    private static async Task ResolvePlatformRolesAsync(
        HttpContext http,
        ClaimsIdentity identity,
        AccessOptions access)
    {
        var subject = identity.FindFirst(ExpertHubClaims.Subject)?.Value;
        if (string.IsNullOrWhiteSpace(subject))
        {
            return;
        }
        var email = identity.FindFirst("email")?.Value ?? string.Empty;

        var bootstrapIds = Csv(access.BootstrapAdministrators);
        var isBootstrap =
            bootstrapIds.Contains(subject, StringComparer.Ordinal)
            || (email.Length > 0 && bootstrapIds.Contains(email, StringComparer.OrdinalIgnoreCase));

        /*
         * Internal status has THREE sources, and they are OR-ed: the bootstrap
         * list, the identity provider's own role mapping, and the roles held in
         * Expert Hub's access matrix (added below, once the database is read).
         * `DEF-04` — the provider's answer belongs here rather than only at row
         * creation, so the stored `IsEmployee` flag and the session's internal
         * claim are decided by ONE rule instead of two that can disagree.
         */
        var isInternal = isBootstrap
            || identity.HasClaim(ExpertHubClaims.Role, ExpertHubClaims.InternalRole);
        var isTrainer = false;

        try
        {
            var db = http.RequestServices.GetRequiredService<ExpertHubDbContext>();

            var user = await db.Users
                .SingleOrDefaultAsync(u => u.ExternalIdentityId == subject)
                .ConfigureAwait(false);
            if (user is null)
            {
                var displayName = identity.Name ?? (email.Length > 0 ? email : subject);
                user = new AppUser
                {
                    UserId = Guid.NewGuid(),
                    ExternalIdentityId = subject,
                    Email = email,
                    FullNameAr = displayName,
                    FullNameEn = displayName,
                    PreferredCommunicationLanguage = "ar",
                    PreferredUiLanguage = "ar",
                    IsActive = true,
                    // Staff by the provider's own role mapping (or bootstrap):
                    // the flag that marks them selectable for committees.
                    IsEmployee = isBootstrap
                        || identity.HasClaim(ExpertHubClaims.Role, ExpertHubClaims.InternalRole),
                    CreatedAt = DateTime.UtcNow,
                };
                db.Users.Add(user);
            }
            else
            {
                user.LastLoginAt = DateTime.UtcNow;
            }

            var heldCodes = await (
                    from userRole in db.UserRoles
                    join role in db.Roles on userRole.RoleId equals role.RoleId
                    where userRole.UserId == user.UserId
                    select role.Code)
                .ToListAsync()
                .ConfigureAwait(false);

            /*
             * Owner ruling, 2026-09-08: «a role called individual, and this
             * role should be given for anyone [who] enters the platform».
             *
             * Granted the same way every other role is — a real `USER_ROLE`
             * row with a real audit entry — rather than as a claim the screens
             * cannot see. The alternative, a role that exists only in the
             * session, is a permission the matrix cannot govern, and that is
             * precisely what `BR-0801` forbids.
             *
             * ⚠️ Once per person, not once per sign-in: the row is what makes
             * it durable, and re-granting would fill `BR-0806`'s trail with an
             * entry every time somebody logged in.
             */
            if (!heldCodes.Contains(RoleCode.Individual))
            {
                var baseline = await db.Roles
                    .SingleAsync(role => role.Code == RoleCode.Individual)
                    .ConfigureAwait(false);
                db.UserRoles.Add(new UserRole
                {
                    UserRoleId = Guid.NewGuid(),
                    UserId = user.UserId,
                    RoleId = baseline.RoleId,
                    ScopeRef = null,
                    AssignedBy = user.UserId,
                    AssignedAt = DateTime.UtcNow,
                });
                db.AppendAudit(new AuditLogEntry
                {
                    AuditId = Guid.NewGuid(),
                    UserId = user.UserId,
                    Action = "role-assigned",
                    EntityType = "USER_ROLE",
                    EntityId = user.UserId,
                    AfterState = JsonSerializer.Serialize(new
                    {
                        roleCode = RoleCodes.ToWire(RoleCode.Individual),
                        userName = user.FullNameAr,
                        baseline = true,
                    }),
                    OccurredAt = DateTime.UtcNow,
                });
                heldCodes.Add(RoleCode.Individual);
            }

            if (isBootstrap && !heldCodes.Contains(RoleCode.SystemAdministrator))
            {
                // Persist the bootstrap grant through the normal shape — a row
                // plus its audit entry in the same transaction (`BR-0806`) —
                // so the DB, not the config file, is what the screens show.
                var adminRole = await db.Roles
                    .SingleAsync(role => role.Code == RoleCode.SystemAdministrator)
                    .ConfigureAwait(false);
                db.UserRoles.Add(new UserRole
                {
                    UserRoleId = Guid.NewGuid(),
                    UserId = user.UserId,
                    RoleId = adminRole.RoleId,
                    ScopeRef = null,
                    AssignedBy = user.UserId, // self — the bootstrap's nature, audited as such
                    AssignedAt = DateTime.UtcNow,
                });
                db.AppendAudit(new AuditLogEntry
                {
                    AuditId = Guid.NewGuid(),
                    UserId = user.UserId,
                    Action = "role-assigned",
                    EntityType = "USER_ROLE",
                    EntityId = user.UserId,
                    AfterState = JsonSerializer.Serialize(new
                    {
                        roleCode = RoleCodes.ToWire(RoleCode.SystemAdministrator),
                        userName = user.FullNameAr,
                        bootstrap = true,
                    }),
                    OccurredAt = DateTime.UtcNow,
                });
                heldCodes.Add(RoleCode.SystemAdministrator);
            }

            isTrainer = heldCodes.Contains(RoleCode.Trainer);
            // ⚠️ `Individual` is NOT an internal role. Everybody holds it, so
            // treating it as staff would hand the operations area to every
            // person who ever signed in.
            isInternal |= heldCodes.Any(code =>
                code is not RoleCode.Trainer and not RoleCode.Individual);

            /*
             * `DEF-04` — reconcile the STORED flag to the roles this person
             * actually holds, every time they sign in.
             *
             * It used to be written once, at row creation, from the identity
             * provider's optional role claim. `Oidc__RoleClaim` is empty in a
             * UAT deployment, so everybody was created `false` and the only
             * way roles are ever granted — Expert Hub's own access matrix
             * (`P-181`) — never reached it. Staff could not open an
             * applicant's CV (`GET /v1/attachments/{id}` refuses a non-owner
             * who is not an employee) and every committee, interview-panel and
             * signatory picker reads `Where(u => u.IsEmployee && u.IsActive)`
             * and listed nobody.
             *
             * This is the SAME rule that decides the session's internal claim,
             * two lines above — not a second source of truth. It follows the
             * roles in both directions: somebody who loses every internal role
             * stops being an employee, because a reconciliation that only ever
             * adds is a privilege nobody can withdraw.
             */
            if (user.IsEmployee != isInternal)
            {
                user.IsEmployee = isInternal;
            }

            await db.SaveChangesAsync().ConfigureAwait(false);
        }
        catch (Exception exception) when (exception is not OperationCanceledException
            || !http.RequestAborted.IsCancellationRequested)
        {
            // No database yet (the testing server), or it is unreachable: the
            // bootstrap grant above still applies; everyone else stays
            // role-less — fail closed, never open.
            //
            // ⚠️ Logged, not silent. "Everyone signed in without their roles"
            // and "nobody has been given a role yet" look identical on the
            // screens, and only this line tells them apart.
            LogRoleResolutionFailed(
                http.RequestServices.GetRequiredService<ILoggerFactory>()
                    .CreateLogger("ExpertHub.Auth"),
                exception);
        }

        // Everybody who reaches here is signed in, so everybody carries it.
        if (!identity.HasClaim(ExpertHubClaims.Role, ExpertHubClaims.IndividualRole))
        {
            identity.AddClaim(
                new Claim(ExpertHubClaims.Role, ExpertHubClaims.IndividualRole));
        }
        if (isInternal && !identity.HasClaim(ExpertHubClaims.Role, ExpertHubClaims.InternalRole))
        {
            identity.AddClaim(new Claim(ExpertHubClaims.Role, ExpertHubClaims.InternalRole));
        }
        if (isTrainer && !identity.HasClaim(ExpertHubClaims.Role, ExpertHubClaims.TrainerRole))
        {
            identity.AddClaim(new Claim(ExpertHubClaims.Role, ExpertHubClaims.TrainerRole));
        }
    }

    /// <summary>
    /// Maps the provider's role claim onto Expert Hub's two coarse roles.
    /// <b>Fail closed</b>: an unmapped value — including every value while the
    /// `Q37` mapping is unconfigured — grants no role, never a default one.
    /// </summary>
    private static void MapRoles(ClaimsIdentity identity, OidcOptions oidc)
    {
        if (string.IsNullOrWhiteSpace(oidc.RoleClaim))
        {
            return;
        }

        var values = identity.FindAll(oidc.RoleClaim).Select(claim => claim.Value).ToHashSet(StringComparer.Ordinal);

        if (Csv(oidc.InternalRoleValues).Any(values.Contains))
        {
            identity.AddClaim(new Claim(ExpertHubClaims.Role, ExpertHubClaims.InternalRole));
        }
        if (Csv(oidc.TrainerRoleValues).Any(values.Contains))
        {
            identity.AddClaim(new Claim(ExpertHubClaims.Role, ExpertHubClaims.TrainerRole));
        }
    }

    private static string[] Csv(string values) =>
        values.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

    [LoggerMessage(
        EventId = 5103,
        Level = LogLevel.Error,
        Message = "Resolving platform roles at sign-in failed; the session carries only the bootstrap grant. Everyone else signs in role-less until the database answers.")]
    private static partial void LogRoleResolutionFailed(ILogger logger, Exception exception);
}
