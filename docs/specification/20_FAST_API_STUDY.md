# 20 — The Academy's API, read properly

**Status:** 🟢 Live — written 2026-09-08 against
[`fa-portal-api-register.md`](../integrations/fast-portal-api-register.md): 325 operations, 44
controllers, 226 schemas, **and 136 of them actually called** against the
testing portal with a real token.
**Audience:** whoever builds INT-05, and the FAST/IMS team.

> ⚠️ **This supersedes [`19_FAST_API_ASSESSMENT.md`](19_FAST_API_ASSESSMENT.md)**,
> which was written from a schema-only reference. Two of its conclusions were
> wrong, one of its "blocking questions" is answered, and it left the product
> carrying a defect that could not be seen from a schema. **The register earns
> its place by containing live responses**: everything below that says «works»
> says it because somebody called it.

---

## 1. What changed, in one table

| | `19` said (2026-09-08, morning) | The register shows | Consequence |
|---|---|---|---|
| **Can we authenticate at all?** | «The blocking question. Two shapes of answer, neither confirmed.» | **90 of 136 GETs returned `200`** with a bearer token, `Users/Info` among them | The question is answered for reads. What is left is *whose* token |
| **Can staff read another person?** | «Every profile read is the current user. Staff cannot read another person's record **at all**.» | **`GET /api/v1/Users/{userId}/Info`** exists, plus `GetOrganizationUsers` (paged, searchable) | ⚠️ **The internal trainer base has a source.** This was the single largest gap |
| **Is there a service credential?** | «`G28`, undocumented.» | `TrainerContracts/.../backfill/generate` takes **`X-Backfill-ApiKey`, no JWT** | A non-user credential exists and someone can issue one |
| **The response envelope** | `succeeded`/`isSuccess`, payload at `data` | **`success`** (ApiResponse) / **`isValid`** (ReturnResult), payload at **`value`** | ⚠️ Our client could not read a single enveloped response — see §5 |
| **The plan chain** | Absent | Present, but **learner-side**: catalogue, cart, reservation, reschedule | Still no trainer-to-plan link. `Q20` narrows but stands |
| **Trainee evaluation of a trainer** | Absent | Absent — no `Survey`, no instructor rating, in 325 operations | `Q23` stands, unchanged |

---

## 2. What we can take, in the order it is worth taking

### 2.1 🥇 The internal trainer base gets a source — `Users/{userId}/Info`

`19` §3 recorded, as the flat conclusion, that staff could not read anyone
else's record and the trainer base therefore had no source at all. That was
wrong: the operation is `GET /api/v1/Users/{userId}/Info`, and beside it
`GET /api/v1/Users/GetOrganizationUsers` (`term`, `page`, `organizationId`) —
a paged, searchable directory.

It changes what CAP-10 can be. Today Expert Hub's trainer base holds only what
a person typed into their own application. With this, a member of staff opening
a trainer can see what the Academy holds — the same fields `P-227` already maps
for the signed-in person.

⚠️ **One thing to settle before building it.** These are still user-scoped
calls: the register's four `401`s are described as *«token valid — the account
lacks the role»*. So reading another person's record needs an account that is
allowed to, and Expert Hub discards the user's token at sign-in (`P-215`). That
makes this the **first concrete case for the service credential** in §2.5 —
not a reason to keep tokens.

### 2.2 🥇 A real vocabulary for `Q16` / `D-13` / `D-14`

`FinancialSkills` carries a **coded** taxonomy, which is what was missing:

```
CompetencyDetailsDto { id, code, name, typeId, typeName, description, levels[] }
JobFamilyDetailsResponseDto { jobFamily, jobRoles[] }
```

`Q16` has been open since August because no domain vocabulary exists anywhere in
the BRD, and QA found the same hole from the other end: 147 unnormalised Arabic
domains against eight fixed English directory categories that cannot match them
(`D-13`, `D-14`). **Job family ≈ domain, competency ≈ specialization** is now a
proposal that can be put to the Business Analyst with real data behind it,
rather than a guess.

⚠️ `GetFrameworkStructure` is a **POST** taking `FrameworkStructureRequestDto`,
despite reading like a lookup. Our code had it as a GET; it would have answered
`405` the first time anything called it (fixed, §5).

### 2.3 🥈 The nationality list, and the identifier bridge

`GetCountries` returns `CountryRegistrationLookupDto`:

```
{ id, nameAr, nameEn, nationalityAr, nationalityEn, countryCode,
  nafathMappingCode, isRestricted }
```

That is `D-36` closed — QA found the nationality field reduced to three options
— and it arrives with both the country *and* the nationality in both languages,
which is exactly the shape the application form needs.

`nafathMappingCode` and `GetCountryByNafathMappingId/{id}` are the identifier
bridge between the identity provider's country ids and the Academy's. Every
integration otherwise guesses at that mapping.

`isRestricted` is worth a question of its own: some countries are flagged, and
nothing tells us what the Academy does with the flag.

### 2.4 🥈 Qualifications — read **and write**, for four collections

Four modules, full CRUD, all scoped to the signed-in person:

| Module | Path |
|---|---|
| Education | `/api/qualifications-education` (POST supports file upload) |
| Practical experience | `/api/qualifications-practical-experience` |
| Professional certifications | `/api/qualifications-professional` |
| Training courses | `/api/qualifications-training-courses` |

This is the one place `Q30` — «does the Academy expose a write API?» — is
answered **yes**, so the dual-change design in `P-135` is buildable for these
four. It is not the base profile: names, contact and bank data are still
read-only to us.

### 2.5 🥉 The first evidence of a service credential

`POST /api/v1/TrainerContracts/trainer-contracts/backfill/generate` takes
`X-Backfill-ApiKey` in a header and **no JWT**. One operation, for the vendor's
own backfill — but it proves the platform can issue a non-user credential and
that at least one endpoint accepts one. `G28` stops being «is this possible?»
and becomes «can we have one, and for which operations?».

### 2.6 What is worth knowing but not taking

- **`TrainerContracts`** — read, download-as-PDF (stored on a CDN), approve,
  refuse. ⚠️ Still the open question from `19` §2.4, unchanged: **if a FAST
  trainer contract is the same artefact as an Expert Hub agreement, two systems
  master one contract and `BR-1201` breaks the first time either writes.** We
  declare the paths and call none of them.
- **`ProgramTrainerDto` / `ProgramExpertDto`** — the Academy publishes trainers
  on programme pages as marketing cards (`name`, `description`, photo,
  LinkedIn). Read-only, and unconnected to any user id. It shows there is a
  **destination** for an accredited trainer's public profile, with no API to
  write to it.
- **`TrackingRequest`** — the learner's own request tracker (search, lookups,
  details). Structurally the same idea as «طلباتي», for a different domain.
- **`Certificate` / `UserCertificate`** — generate and download certificates,
  with CDN URLs. Relevant to `G26` as evidence the Academy already runs a
  document store with PDF generation.
- **`Notification/org/{orgId}`** — preferences only, not a send API.
- **`Reports` (27), `WorkSpace` (27), `LearningPath` (29), `Player` (12)** —
  learner analytics and an LMS bridge. Nothing for Expert Hub.

---

## 3. What is still missing

Confirmed by searching all 325 operations, not inferred:

| Needed for | Still absent |
|---|---|
| **CAP-05, the operational half** | No trainer-to-plan link, no schedule days, no attendance. `Program/GetPlansByProgramId` and `GetProgramPlanTakers` are the **learner's** catalogue and enrolment, not the assignment model |
| **INT-02** | No `Survey`, no instructor evaluation, no trainer rating anywhere. `Q23` stands |
| **Accreditation write-back** | Nothing writes a trainer's accreditation, or attaches a trainer to a plan |
| **The base profile, writable** | Qualifications are writable; names, contact and bank data are not |

**On Nafath vs Yaqeen** (`19` §2.5 called this a contradiction with the owner's
`P-201` ruling): the register describes `IdentityNafath` as *«the current Mobile
compatibility flow»* — Nafath as a **login method for the Academy's own mobile
app**, not a verification service for a third party. That is a weaker conflict
than reported. Still worth one sentence of confirmation, but it is no longer
evidence that the owner's ruling is out of date. ⚠️ I overstated it.

---

## 4. What to ask the FAST team

Reordered, because the register answered two of the six in `19` §5.

1. **A service credential.** `X-Backfill-ApiKey` proves one can exist. Can
   Expert Hub have one, and which operations accept it? Specifically
   `Users/{userId}/Info` and the lookups (`G28`).
2. **Which account may read another user's profile?** The operation exists; the
   `401`s say it is role-gated. Naming the role turns §2.1 into work.
3. **Is a FAST «trainer contract» the same artefact as an Expert Hub
   agreement?** Unchanged, and still the one that risks `BR-1201`.
4. **The plan chain and evaluations** — is there a second API over the
   operational plan model and trainee surveys, or is a database read intended?
   (`Q20`, `Q23`.)
5. **`isRestricted` on a country** — what does the Academy do with it, and
   should Expert Hub honour it?
6. **Is `Session`/`SessionExpert` a live model, and is it the same thing as an
   Expert Hub assignment?** No endpoint exposes it, so this is a question about
   the system rather than the API — and the answer decides whether two systems
   are about to master the same expert's work (§5b).
7. **The 11 `500`s** the register found, `Exam/GetExamProfiles` among them.
   Unhandled exceptions, not validation — a defect list, and a fair thing to
   hand back given they let us run the calls.

---

## 5. What this changed in our code, today

Three defects, all found by reading the register against what we shipped.

**The envelope names were wrong, and failed silently.** Our client looked for
`succeeded`/`isSuccess` and a payload at `data`. The real names are
`success`/`isValid` and `value`. There was no exception and no error: the
**envelope itself** was deserialized as the payload, so a typed read returned an
object with every field null and reported success. It went unnoticed because the
one endpoint we consume — `Users/Info` — returns a bare object with no envelope
at all. Fixed, with a test that unwraps a typed payload and one that refuses to
unwrap a bare payload carrying its own `value` field.

**`GetFrameworkStructure` is a POST.** Ours called it as a GET. It would have
returned `405` the first time anything used it.

**`GetJobFamilyDetails` takes `familyId`, not `jobFamilyId`.** Ours would have
been ignored, returning the unfiltered response.

⚠️ **Nothing was added for `Users/{userId}/Info`.** It is the most valuable
operation in the register and it stays uncoded until question 1 is answered,
because it cannot be called without a credential we do not have — and `P-223`
was written after the third time an endpoint shipped here with no caller.

---

## 5b. Is there a trainer profile in the Academy's system?

Asked directly, because the platform this replaces was built on FAST. **The
answer is no — and what is there instead is more interesting.**

**There is no trainer profile.** No `TrainerProfile` schema among the 226, no
endpoint that reads or writes one, and nothing that lists trainers as people.

⚠️ **One phrase looks like a contradiction and is not.** The register documents
`trainer-contracts` as *«filtered by the current user's profile identifier»*.
Every `profileId` in the schema dictionary belongs to the **exam** domain —
`ExamReservation`, `Attempt`, `ProfileFolder`, `Exam/ChangeProfile`,
`GetExamProfiles`. So "profile" there is an exam-candidate profile, not a
trainer file. It is worth one sentence of confirmation from the FAST team,
because if it *is* a trainer file then something exposes one and the register
does not show it.

**What the Academy does hold about a trainer, in three unconnected places:**

| Where | What | Reachable? |
|---|---|---|
| `Users/Info` → `userProfile` | The three flags: `expertCorrector`, `expertReviewer`, `expertQuestionAuthor` | ✅ Yes — we already read it (`P-227`) |
| `ProgramTrainerDto` / `ProgramExpertDto` / `HomeExpertDto` | A **marketing card**: name, photo, description, LinkedIn, X. Its `id` is not a user id | ✅ Read-only, on programme pages |
| `Session` · `SessionExpert` · `Meeting` · `MeetingExpert` | ⚠️ **A full expert-panel model** — see below | ❌ **No operation returns any of them** |

### The expert-panel model nobody can call

Sitting in the schema dictionary, referenced by nothing:

```
Session       { titleAr/En, startDate, sessionManagerUserId, competencyLevelId,
                noOfTargetQuestions, noOfSelectedExperts, sessionStatusId, … }
SessionExpert { sessionId, expertUserId, jobFamilyId, isSpecializedExpert }
Meeting       { … }   MeetingExpert { sessionExpertId, expertUserId, meetingId }
MeetingExpertQuestion, MeetingExpertRange, SessionQuestion, SessionSector
```

**`SessionExpert.expertUserId` is the link this whole integration has been
looking for** — an expert, identified by *user id*, attached to a working
session, with a job family and a specialization flag. It is the operational
model behind the three flags on `Users/Info`: the Academy convenes panels of
experts to author, review and correct exam questions.

⚠️ **And not one endpoint returns it.** These schemas reached the OpenAPI
dictionary as entity-graph references — navigation properties pulled in from
some DTO — not because anything publishes them. So the model exists in the
Academy's database and is invisible to any caller.

**Why this matters more than a missing endpoint.** It is the closest thing FAST
has to Expert Hub's own domain: a person with a specialization, selected onto a
piece of work, with a status. If that model is live, then Expert Hub and FAST
are about to hold two overlapping records of the same expert doing the same
kind of work — which is `BR-1201`'s failure case, arriving from a direction
nobody was watching. **This belongs in the same question as the trainer
contract**: not «can we read it», but «whose record is it».

---

## 6. The honest summary

The register moved this integration from «we think these endpoints exist» to
«these 90 returned data». Two things came out of it that change plans rather
than details: **the internal trainer base has a source**, and **a non-user
credential demonstrably exists**. One thing came out of it that should not have
needed a register to find: our client could not read the Academy's responses,
and nothing in our tests said so, because the tests asserted the same wrong
names the code did.

*Maintained beside [`fa-portal-api-register.md`](../integrations/fast-portal-api-register.md) (the
register), [`18_SSO_INTEGRATION.md`](18_SSO_INTEGRATION.md) (INT-01) and
[`15_INPUTS_REGISTER.md`](15_INPUTS_REGISTER.md) (every ask, by party).*
