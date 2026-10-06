# Session — 18 to 26 August 2026

**Journeys J-18→J-22 · FAST data dictionary · navigation repair · CAP-06 entitlements**

---

## Resume here

| | |
|---|---|
| **Branch** | `expert-hub/journeys-j05-j09` |
| **Head** | `5e1b39a` |
| **Released tag** | `expert-hub-v1.3.0` (this is what is deployed) |
| **Deployed image** | `expert-hub-frontend:1.3.0` on `127.0.0.1:8085` |
| **Tests** | 562 green · `validate:expert-hub` + `build:expert-hub` clean |
| **Journey score** | **22 of 24 documented journeys complete** |
| **Phase** | Frontend journey programme closed → **backend design started** |

**Everything runs on mock providers.** No real call to FAST, MTM, ERP or SSO
exists anywhere in the frontend, by design (`02C` §5).

**Read first, in this order:** [`12_JOURNEY_CONFORMANCE_AUDIT.md`](../12_JOURNEY_CONFORMANCE_AUDIT.md)
(current state) → [`14_INTERNAL_DASHBOARD_BRD_REVIEW.md`](../14_INTERNAL_DASHBOARD_BRD_REVIEW.md)
(what is left and how buildable it is) → [`TODO.md`](../TODO.md) (the questions).

**The next thing to do:** confirm the two ownership calls in
[`10_DATABASE_DESIGN.md`](../10_DATABASE_DESIGN.md) §1.2 and §4 — they change the
schema materially — then settle `DM-GAP-07` (roles/permissions), which gates both
CAP-08 and the *منسق مركز* scoping. See *Where it stopped* below.

---

## What was asked, in order

1. Finish the J-24 public-profile privacy fix (carried in from the prior session).
2. «كمل» — continue the conformance programme, repeatedly.
3. A full conformance analysis of everything built against every journey.
4. Publish to GitHub + server deploy instructions (Docker commands, not scripts).
5. «let's start with the partial to complete the gap» — finish the partial
   journeys, then the blocked ones, then the new ones.
6. Two FAST field files supplied — absorb them.
7. «فيه نقص في الهيدر… لانها موجودة في اللاندنق بيج» — navigation is broken.
8. «فيه نقص في الهيدر الداخلي للموظف الداخلي» → review against the full BRD.
9. Build CAP-06 entitlements.
10. Push a release and give the deploy commands.

---

## What shipped

Twenty-eight commits. The substance, grouped:

### The journey programme, finished

`506f0a5` J-18 offer handling · `27d9121` J-19 re-routing · `0f55573` J-20
material submission · `beb78ff` J-21 execution follow-up · `8375bd4` J-22
withdrawal/cancellation.

That closed **J-22, the last documented journey**. Decisions `P-84`→`P-113`.

The recurring technique across all five: **encode the rule so the wrong state
cannot be built**, rather than guarding it. J-18 has no send operation because
sending is automatic. J-19's operations all take a slot number because a
request-wide re-match is forbidden. J-20's content path has no `fastSync` field
at all. J-22's withdrawal record is discriminated by *who* ended it, so a staff
reason on a trainer's withdrawal does not compile.

### FAST data dictionary

`445df57` analysed the two supplied files (15 tables, 406 columns) into
[`13_FAST_DATA_DICTIONARY_MAP.md`](../13_FAST_DATA_DICTIONARY_MAP.md).
`822c2b1` aligned the contracts.

The durable output is `shared/fast/` — a **generated** snapshot of what FAST
supplied, a map of each FAST-sourced field to its `Table.Column`, and a test
asserting the second against the first. **A FAST column nobody supplied cannot
be claimed without failing the build.** The map is also the shopping list for the
Academy's own database: FAST supplied 406 columns, the frontend consumes ~50.

Two pre-existing defects surfaced: the identity brief was a single string where
FAST has `BriefAr`/`BriefEn`, and an MTM evaluation carried `scale: number` where
`SurveyResponse` has `ScaleLow` **and** `ScaleHigh`.

### Navigation repair

`6aad9f0` · `00ccb36` · `87dd02a`. Three of five public header tabs resolved to
NotFound, and had since the header was built. Four built internal screens had no
tab at all.

The guard that matters: `navigationTargets.test.ts` checks every header and
footer `href` **against the registered route table**. The bug had survived a
546-test suite because the existing tests asserted each link matched its content
entry — which it did. The entry and the link were wrong together.

### CAP-06 entitlements

`5e1b39a`. The first capability built from the **BRD** rather than a journey.
Decisions `P-124`→`P-128`.

### Backend design started

[`10_DATABASE_DESIGN.md`](../10_DATABASE_DESIGN.md) — eight ERDs by capability,
the source-of-truth matrix, and the six integration crossings. Grounded in BRD §9
(the preliminary data model), §8.12 (integrations), the two FAST field files, and
`02D` for rating ownership.

Two ownership calls came out of it that were not obvious before:

- **§8.12.4 says Expert Hub owns the trainer data FAST displays.** INT-05 is
  bidirectional because Expert Hub *publishes* accredited trainers into FAST for
  scheduling; J-18/F4's `PlanTrainer.TrainerId` write is one instance of it.
  Everything else FAST holds — plans, enrolment, scheduling — is FAST's.
- **"Consumed" is three different things**, not one: FAST plan data is
  *referenced*, MTM ratings are a *permanent integrated business record* (`02D`),
  ERP entitlements are *mirrored for tracking*. They need different storage.

---

## Owner rulings given in conversation

These shaped the code and exist nowhere else in writing.

| Ruling | Effect |
|---|---|
| «احذفه — الرحلة تحكم» (delete the public ratings) | J-24's field list is exhaustive; ratings left the public DTOs |
| «احذفها — التعداد حصري» | classification / yearsExperience / traineesTrained deleted too |
| «Deploy from the feature branch» | `main` untouched; releases are tagged off `expert-hub/journeys-j05-j09` |
| «it's docker i don't want to build from script give me the command» | Raw `docker build` / `docker run`, never `deploy/expert-hub/scripts/*` |
| «give me the summery on english not arabic and this should be always» | Standing rule — summaries in English (saved to memory) |
| «ما احتاج عن المنصة و الخدمات لانها موجودة في اللاندنق بيج» | About + Services **dropped** from header and footer, not anchored (`P-123`) |
| «الخدمات الى موجود عن الموظف الداخلي مو موجودة في الهيدر» | Triggered the full BRD review that produced doc 14 |

---

## Corrections — things I said that were wrong

Recorded so a future session does not re-derive them.

**1. "J-25→J-28 are blocked."** Said repeatedly. **Wrong.** True of the
*journeys*, misleading about the *work*: the BRD specifies all four at capability
level (CAP-06, CAP-07, CAP-08, CAP-09) with entities, features, user stories and
in two cases business rules. CAP-06 was fully buildable and has now been built
from the BRD directly (`P-124`). `Q17` carries the correction.

**2. J-02 has four features, not three.** F4 (nominee activation) had been
omitted from every earlier tracking pass. Built as `805d834`.

**3. J-01's identity layer was never blocked on `G4`.** `G4` covers only the
Nafath/SSO *integration contract*; the product rules were buildable throughout.
Built as `08835b9` (`P-60`).

**4. Anchoring About/Services into the landing page was one step too clever.**
The diagnosis (three dead tabs) was right; the owner's remedy — drop them — was
better, because `home` already reaches that page from every screen (`P-123`).

**5. "Expert Hub owns the trainer record."** Recorded as `P-130` on 26 Aug from
§8.12.4, and **corrected by the owner the next day**: FAST masters the *base*
profile — it already exists there, which the supplied schema showed all along —
and Expert Hub masters only the *accreditation layer*. §8.12.4 says «بيانات ملف
المدرب **المعروضة بـفاست**», and the emphasis is on *displayed in FAST*, not on
the whole record. `P-134` carries the correction; `P-135` covers how "dual
change" is delivered without two masters.

**6. The `11_` coverage map was five journeys stale** and its own §1 contradicted
the `12_` audit's score. Fixed in `38b9626`; the two are now kept in step.

---

## Where it stands

**22 of 24 documented journeys complete.** The two that are not are waiting on
inputs, not work:

- **J-02/F3** — the activation invitation email needs `J-25`'s Notification Matrix
- **J-04** — the Speaker Fields matrix is *pending upload* in the journey itself

**The internal employee has 18 services in the BRD; 8 are in the header.** Doc 14
has the full table. Absent: notifications (4 screens), roles & permissions,
role-scoped dashboards, exportable reports, the integration registry, and the
speaker record.

---

## Open questions, by who can answer them

**Product Owner rulings needed:** `Q16` domain taxonomy · `Q18` suspend
reversibility · `Q19` Identity Card fields · `Q25` which of CAP-08's six roles
are in scope · `Q26` CAP-09's metric definitions.

**Documents needed:** `Q17` J-25→J-28 journeys (or accept the BRD as the source)
· J-04 Speaker Fields matrix · J-16's three non-Trainer service matrices ·
`DM-GAP-01` Application Fields matrix.

**Data needed:** `Q20` `plan.PlanTaker` — closes J-21's enrolment source *and*
its attendance field in one table, the highest-value single ask · `Q21` the 19
`lookup.*` tables, four of them load-bearing · `Q27` the ERP disbursement status
list · `Q22` how the four services map to FAST's three `Expert*` flags · `Q23`
which of the three MTM rating levels is the source of record.

**Technical/infra:** `G26`/`G27` document storage + antivirus (blocks every
preview, download and PDF export) · Teams API for J-06 · `G4` SSO contract.

---

## Where it stopped

**Backend design has begun.** The ERD pass is committed; nothing is implemented.
The three next steps are listed in `10_DATABASE_DESIGN.md` §8, and the first is a
question only the owner can answer: **are the two ownership calls right?**

The earlier open question is still open and now sits behind `DM-GAP-07`:

> **CAP-08 الأدوار** — الأدوار الستة معتمدة في §8.8.5، وتفتح تقييد **منسق مركز**
> اللي J-17 أصلاً يلمّح له. أبدأ فيها؟

The case for it: BRD §8.8.5 names six approved roles — مدرب · موظف إدارة
المدربين · مدير إدارة المدربين · **منسق مركز** · مشرف النظام · الإدارة العليا —
where the app has two personas, `trainer` and `internal`. Four distinct internal
roles are collapsed into one.

`P-J9` (server-decided capabilities, no page reads a role) means this is
**additive, not a refactor**. But *منسق مركز* is a real scoping rule not
honoured today: J-17 already has a "requesting party" actor who should see only
their own centre's requests.

`Q25` is the blocking question — which roles are in scope for this release.

---

## Resuming

```bash
git fetch origin --tags
git checkout expert-hub/journeys-j05-j09
git pull

cd frontend
npm run validate:expert-hub     # typecheck + lint + lint:css + test
npm run build:expert-hub
```

⚠️ **Tests are flaky under full parallel load** on this machine — 1 to 6 files
intermittently time out on `findByRole`. Machine load, not a regression. Verify
with:

```bash
npx vitest run src/apps/expert-hub --no-file-parallelism
```

⚠️ **Bash heredocs fail intermittently** on large or Arabic content in this
environment ("unexpected EOF"). The reliable pattern is to write a Python patch
script to the scratchpad with the Write tool and run `python <path>`.

Deploy commands: [`DEPLOYMENT.md`](../DEPLOYMENT.md), or the raw
`docker build` / `docker run` pair the owner prefers — build context is the
**repository root**, image tag `expert-hub-frontend:<version>`, bound to
`127.0.0.1:8085:8080`. Never `docker system prune` (it deletes the rollback
image) and never a repo-wide `docker compose down`.
