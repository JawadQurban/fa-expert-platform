# 14 — The internal dashboard, reviewed against the BRD

**Trigger:** «الخدمات الى موجود عن الموظف الداخلي مو موجودة في الهيدر».
**Source:** `BRD-TRN-001-expert-hub-v1.0.pdf` (BRD-TRN-001 v1.0, 30 pages) — §8, the
twelve capabilities, read in full. Every row below cites the BRD feature id.

---

## 0. The correction this review forces

`TODO.md` `Q17` records that **J-25, J-26, J-27 and J-28 have no journey
document**, and I have repeatedly described the work behind them as *blocked*.

That is true of the **journeys** and misleading about the **work**. The BRD
specifies all four at capability level — scope, entities, features, user stories,
and in two cases business rules. What is missing is the journey/AC layer, not the
requirement. Several of these are buildable today against the BRD, which is the
same authority the journeys were derived from.

**This is why the internal header looks thin: it reflects the journeys, and the
journeys only cover eight of the twelve capabilities.**

---

## 1. What the BRD gives the internal employee

The BRD's own interface column (`الواجهة`) marks each feature *بوابة المدرب*,
*اللوحة الداخلية*, *الواجهة العامة*, or *الواجهتان*. Filtering for
**اللوحة الداخلية** across §8 gives the internal employee's complete service
list.

| # | Service | BRD | Journey | In the header? |
|---|---|---|---|---|
| 1 | صندوق طلبات الانضمام | CAP-01 | J-01/J-02/J-05 | ✅ |
| 2 | طلبات إضافة خدمة | CAP-01 | J-03 | ✅ |
| 3 | الفرز والتقييم واللجنة | CAP-02 | J-05→J-10 | ✅ *(inside the application)* |
| 4 | إدارة الاتفاقيات والملاحق | CAP-03 | J-12 | ✅ |
| 5 | قاعدة المدربين والملف الموحد | CAP-04 | J-15 | ✅ |
| 6 | الإسناد والمطابقة | CAP-05 | J-16/J-17/J-19 | ✅ |
| 7 | المواد والمحتوى | — | J-20 | ✅ |
| 8 | **سجل المتحدث** | CAP-01 | J-04 | ❌ **blocked** — Speaker Fields matrix |
| 9 | المستحقات المالية للإدارة | `F-0602` | J-28 | ✅ **Built 2026-08-26** — EH-INT-17 |
| 10 | مصفوفة الإشعارات | `F-0702` | J-25 | ✅ **Built 2026-08-27** — EH-INT-12 |
| 11 | قوالب الرسائل ثنائية اللغة | `F-0703` | J-25 | ✅ **Built 2026-08-27** — EH-INT-12 |
| 12 | شاشة إدارة المهل | `F-0704` | J-25 | ✅ **Built 2026-08-27** — EH-INT-13 |
| 13 | سجل الإشعارات | `F-0705` | J-25 | ✅ **Built 2026-08-27** — EH-INT-12 |
| 14 | مصفوفة الصلاحيات | `F-0801` | J-26 | ✅ **Built 2026-08-27** — EH-INT-14 |
| 15 | إسناد الأدوار للمستخدمين | `F-0802` | J-26 | ✅ **Built 2026-08-27** — EH-INT-14 |
| 16 | **لوحات المؤشرات حسب الدور** | **F-0901→F-0904** | J-27 | 🟡 **one generic dashboard, not four role-scoped ones** |
| 17 | **التقارير القابلة للتصدير** | CAP-09 | J-27 | ❌ **missing** |
| 18 | **سجل الأنظمة المتكاملة وحالة المزامنة** | CAP-12 | — | ❌ **missing** |

**Thirteen of the eighteen internal services are in the header. Four are
absent and one is partial.** (CAP-08's two screens and CAP-07's four each share
one entry — P-141.)

---

## 2. How buildable each absent service actually is

Ordered by how much the BRD already settles.

### 2.1 المستحقات المالية (CAP-06) — ✅ **BUILT 2026-08-26**

§8.6 gives everything an increment needs:

- **Entity** — «المستحق»: one record per purchase order linked to a trainer;
  carries صرف status, amount, date. **Consumed whole from ERP.**
- **Features** — `F-0601` the trainer's own view (بوابة المدرب), `F-0602` the
  staff view of any trainer's record (اللوحة الداخلية), `F-0603` the automatic
  link to PO → agreement → programme.
- **Business rules** — `BR-0601` nothing may be entered or edited by hand, ever;
  `BR-0602` every entitlement links through the PO to the active agreement
  (CAP-03) and the specific engagement (CAP-05); `BR-0603` **an entitlement with
  an incomplete link stays hidden from the trainer**; `BR-0605` there is no
  dispute path in this release.

**Built exactly that way** (P-124–P-128): the service has two operations and
both are reads (`BR-0601`, `BR-0605`); `TrainerEntitlementDto` has no shape for
an incomplete link, so the hidden record cannot be constructed in the trainer's
view (`BR-0603`); the staff union names which hop is missing, which is the answer
to the support call `US-0602` describes; the ERP status is rendered as sent
(`Q27`); and **no total is displayed**, because §8.6 says this capability
calculates no amount.

Both interfaces got it — «مستحقاتي» in the trainer portal and «المستحقات
المالية» in the internal header. `F-0601` was missing from the trainer portal
too, not just the internal one.

### 2.2 الإشعارات (CAP-07) — ✅ **BUILT 2026-08-27**

§8.7 names four internal screens (`F-0702` matrix · `F-0703` templates ·
`F-0704` the central SLA console · `F-0705` the log) and their entities, plus
`BR-0701` (approved bilingual templates only — no free-form text in any system
notification) and `BR-0702` (every matrix event fires email **and** in-platform
together).

The **screens** are buildable. What is still missing is the matrix **rows** —
which event notifies whom — and that is the `Q17` gap that the built journeys
already point at. Building the management screens without the rows gives staff a
place to define them, which may be exactly the right order.

**Built as EH-INT-12** — the matrix at `/internal/notifications/matrix`,
templates at `…/templates` and the log at `…/log` — plus **EH-INT-13**, the
deadline console at `/internal/sla`. All four sit behind one header entry.

The **event catalogue is real**: twenty events taken from ten approved journeys,
each carrying its citation and the journey's own words about who is notified
(P-146). This review said *eight* journeys name notification points — it is ten;
J-01's submission confirmation and J-02/F3's activation invitation were missed.

⚠️ What is still missing is the **routing** (`DM-GAP-08`): every event ships
unrouted and the matrix is marked unapproved on screen. No template is seeded
either — `BR-0701` allows only approved bilingual templates, and writing message
bodies would have put words in the Academy's mouth. → `Q34`.

### 2.3 الأدوار والصلاحيات (CAP-08) — ✅ **BUILT 2026-08-27**

§8.8.5 names them, and they are not what this codebase assumes:

| Role | Scope per the BRD |
|---|---|
| مدرب | own profile, applications, engagements, entitlements |
| موظف إدارة المدربين | daily operations across the lifecycle |
| مدير إدارة المدربين | all of the above **plus** supervisory approvals |
| منسق مركز | **their own centre's assignment requests only** |
| مشرف النظام | settings, roles, permissions, routing lists |
| الإدارة العليا | **read and export only**, platform-wide |

Today the app has two personas, `trainer` and `internal`. **Four distinct
internal roles are collapsed into one.** P-J9 (server-decided capabilities) means
no page reads a role directly, so this is additive rather than a refactor — but
*منسق مركز* in particular is a real scoping rule we do not honour: J-17 already
has a "requesting party" actor who should only see their own centre's requests.

**Built as EH-INT-14** at `/expert-hub/internal/access/permissions` (the
58 × 6 matrix, `F-0801`) and `/internal/access/users` (assignment, `F-0802`),
behind one header entry (P-141). The six roles are seeded with §8.8.5's own
descriptions, the 58 permissions are the BRD's own feature codes (P-139), and
the *منسق مركز* scope is a union member rather than an optional field (P-140)
— so the data model now carries the scoping rule even though no page enforces
it yet.

⚠️ **What is still missing is the matrix's contents** (`DM-GAP-07`): the grid
ships empty, marked unapproved on screen (P-138). Building the screen first is
deliberate — there was nowhere to *enter* the approved model, so asking for it
meant asking for a spreadsheet nobody could apply. `Q25` is unchanged: which
roles are in scope for this release is still a product decision.

### 2.4 التقارير (CAP-09) — ✅ **BUILT 2026-09-02** (dashboards; export still open)

`F-0901`–`F-0904` name a dashboard per role, and `F-0902` even lists the
employee's tiles — «طلبات قيد الفرز، مقابلات مجدولة، مواد بانتظار الاعتماد».

**Built exactly that way** (`P-198`, `P-199`): the dashboard is now
**role-scoped** — the caller's role resolves to their `DASHBOARD` row and the
tiles are its placements, so the coordinator and the executive get their own
dashboards rather than the employee's. All three of `F-0902`'s tiles ship;
«مواد بانتظار الاعتماد» was the missing one and BE-10 had built the queue it
counts. The coordinator's and executive's dashboards are **named and empty**,
because `Q26` defines no metrics for them and filling them would invent the
answer.

**Still open:** the **export** half (`F-0905`) — no service contract, no
screen, no report definitions — and `Q26` itself, which is why every
`METRIC_DEFINITION.formula` is null.

### 2.5 سجل التكاملات (CAP-12) — **specified, low value today**

§8.12 defines an integration registry, a source-of-truth matrix per data element,
and a sync log. Useful once FAST/MTM/ERP are live; nothing to show while every
provider is a mock.

### 2.6 سجل المتحدث (CAP-01 / J-04) — **still genuinely blocked**

The Speaker Fields matrix is marked *pending upload* in J-04 itself. Unchanged.

---

## 3. What this means for the header

The header is not wrong — it is a faithful reflection of what is built. The gap
is upstream: **the journeys cover eight capabilities and the BRD defines
twelve.**

Adding tabs for unbuilt screens would recreate exactly the defect just fixed
(P-119): a tab is a promise. So the header stays as it is until the screens
behind the tabs exist.

**Recommended order**, by ratio of specified-ness to value:

1. ~~**CAP-06 المستحقات**~~ — ✅ **done 2026-08-26**.
2. ~~**CAP-08 الأدوار**~~ — ✅ **done 2026-08-27**. The screens exist; the
   approved contents (`DM-GAP-07`) are now an input with somewhere to go.
3. ~~**CAP-07 الإشعارات**~~ — ✅ **done 2026-08-27**. The four screens exist; the
   routing (`DM-GAP-08`) and the message wording are now inputs with somewhere
   to go.
4. **CAP-09 التقارير** — needs the metric definitions first.
5. **CAP-12 التكاملات** — after the integrations are real.

---

## 4. Open questions this review raises

- ~~**`Q24`**~~ — answered by building it from the BRD (P-124).
- **`Q27`** — the ERP disbursement status values are not defined, so every status
  badge is toned identically. Also: `BR-0604` does not exist in §8.6.5.
- **`Q25`** — CAP-08 names six roles; the app has two personas. Which internal
  roles are in scope for this release, and is *منسق مركز* scoping required now?
- **`Q26`** — CAP-09's metrics have no definitions. `F-0902` lists three employee
  tiles by name; are those the approved set?
