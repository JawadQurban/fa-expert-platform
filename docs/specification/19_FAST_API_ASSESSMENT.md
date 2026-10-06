# 19 — What the FAST API gives us, and what is still missing

**Status:** 🟢 Live — written 2026-09-08 against
[`FA-API-Reference.md`](../integrations/fast-api-reference.md) (324 operations, 44 modules,
generated from the live Swagger on the same day).
**Audience:** the FAST / IMS team, and whoever builds INT-05 here.

> ⚠️ **This supersedes the 2026-09-06 assessment** (`P-200`-era), which read
> only `/swagger/v1` — 11 controllers, all learner-facing — and concluded that
> FAST exposed nothing Expert Hub could use. That was true of what was visible
> and wrong as a conclusion. The v2 contract carries the trainer's
> qualifications, their contracts, the reference lists and the identity flow.
> **The correction matters more than the original judgement: check the whole
> contract, not the first document that loads.**

---

## 1. The headline

| | |
|---|---|
| **Now usable** | Trainer qualifications (read **and write**), reference lists, the competency framework, trainer contracts, the identity flow |
| **Still absent** | The entire CAP-05 plan chain, MTM evaluations, accreditation write-back, the trainer base profile as a whole |
| **The one blocking question** | **Every endpoint is scoped to «the currently authenticated user».** How Expert Hub authenticates decides whether any of this is reachable |

---

## 2. What we can use today

### 2.1 Trainer qualifications — and the first real answer to `Q30`

Four modules, full CRUD, 20 operations, all typed:

| Module | Path | What it is |
|---|---|---|
| Education | `/api/qualifications-education` | Qualifications — `GET` list, `GET {id}`, `POST` save, `GET delete/{id}` |
| Practical experience | `/api/qualifications-practical-experience` | Employment history, same four |
| Professional | `/api/qualifications-professional` | Certifications, same four |
| Training courses | `/api/qualifications-training-courses` | Courses attended, plus four dropdown reads |

**Why this matters.** `Q30` — «does FAST expose a write API?» — has blocked the
dual-change design since August. For these four collections the answer is
**yes**, so the write-through `P-135` describes is buildable rather than
hypothetical. Education even accepts `multipart/form-data`, so a certificate
document goes with the record.

⚠️ It does **not** cover the whole base profile — names, contact, bank data,
the `profile.UserProfile` fields — so `Q30` is narrowed, not closed.

### 2.2 Reference lists — `Q21` and `D-36`, partly answered

`Lookup` exposes countries and nationalities, education types, sectors,
topics, competency levels and cancellation reasons.

The immediate win is **`D-36`**: QA found the nationality field reduced to
three options, and FAST has the authoritative list. `GetCountryByNafathMappingId`
is more valuable still — it maps the identity provider's country ids to FAST's,
which is the identifier bridge every integration otherwise has to guess.

⚠️ These are **not** the nineteen `lookup.*` tables of `Q21` — no
`TrainingMaterialStatus`, `PlanLocation`, `PlanCancelReason` or `TrainingType`.
Those belong to the plan model, which this API does not expose.

### 2.3 The competency framework — a candidate for `Q16`

`FinancialSkills` gives a framework structure, job families with their job
roles, and competencies. `Q16` has been open since August because no domain
vocabulary exists anywhere in the BRD, and QA independently found the same hole
from the other end (`D-13`, `D-14`: 147 unnormalised Arabic domains against
eight fixed English directory categories that cannot match them).

**Job family ≈ domain, competency ≈ specialization** is a plausible fit. It is
a proposal for the Business Analyst, not a decision to take in code.

### 2.4 Trainer contracts — and a question we must ask before using them

`GET trainer-contracts`, `GET Download` (generates the PDF **and stores it on a
CDN**), `POST Approve`, `POST Refuse`.

⚠️ **Do not wire this without a ruling.** If a FAST trainer contract is the
same artefact as an Expert Hub agreement, then two systems are about to master
one contract and `BR-1201` is violated the first time either writes. If they
are different documents, they merely share a name. The operations are declared
in our code and **nothing calls them**, so the question can be asked precisely.

Worth noting separately: FAST already has a document store with CDN-backed PDF
generation, which is directly relevant to `G26`.

### 2.5 Identity

`IdentityNafath` exposes create-request, check-status, get-person-data, token
and is-nafath-login — the challenge/poll/person-data shape our identity gate
was built against.

⚠️ **The contract says Nafath; the owner's ruling of 2026-09-02 (`P-201`) says
verification is Yaqeen, through FAST.** One of the two is out of date and it is
not safe to guess which. This needs a sentence from the FAST team before the
identity module is wired.

---

## 3. What is still missing

Unchanged from the earlier assessment, and confirmed by searching the full
324-operation contract:

| Needed for | Missing |
|---|---|
| **CAP-05, entirely** | `plan.Plan`, `PlanScheduleDay`, `PlanTrainer`, `PlanTaker`. No plan, no schedule, no trainer-to-plan link, no enrolment. `Q20` stands |
| **INT-02** | `Survey.Instructor`, `Survey.SurveyResponse`. No trainee evaluation of a trainer anywhere. `Q23` stands |
| **Accreditation** | No way to write a trainer's accreditation, `PlanTrainer.TrainerId`, or approved material back to FAST |
| **The internal trainer base** | Every profile read is «the current user». Staff cannot read another person's record through this API at all |

The `assign` operations that appear in a keyword search belong to
`LearningPath` — assigning *learners* to a path, not trainers to plans.

---

## 4. ⚠️ The blocking question: how do we authenticate?

**Every endpoint takes `Authorization: Bearer <JWT>` and is scoped to the
currently authenticated user.** That single fact decides whether anything above
is reachable, and there are only two shapes of answer:

| | Approach | What it needs | What it costs |
|---|---|---|---|
| **A** | **Act as the user** — forward their FAST access token | Expert Hub must keep the access token from sign-in. ⚠️ We deliberately **discard** it today (`P-215`), because nothing called FAST on a user's behalf | Reversing that is a security decision, not a config change: it means holding a live provider credential for every session |
| **B** | **Act as a service** — client credentials | A service principal, and endpoints that accept one. Neither is documented — this is `G28`, still open | Needs FAST to expose service-scoped variants of user-scoped endpoints |

**Neither works for the internal trainer base**, where staff must read someone
else's record. That needs B *plus* endpoints that take a user id.

This is the first question to put to the FAST team, because the answer decides
the shape of everything else.

---

## 5. What we need from the FAST team

In the order that unblocks the most:

1. **How does Expert Hub authenticate?** Option A or B in §4 — and if B, how a
   service principal is issued and rotated (`G28`).
2. **Can staff read another user's profile and qualifications?** Everything is
   self-scoped today, which leaves the internal trainer base with no source.
3. **Nafath or Yaqeen?** The contract and the owner's ruling disagree (§2.5).
4. **Is a FAST «trainer contract» the same artefact as an Expert Hub
   agreement?** Two masters for one contract is the failure `BR-1201` exists to
   prevent (§2.4).
5. **The plan chain** — is there a second API over `plan.*` and `Survey.*`, or
   is a database read the intended path? `Q20`, `Q23` (§3).
6. **Response schemas.** 76% of operations declare none, and most declare no
   error shape. We can consume them, but every field name is confirmed by
   looking at a live response rather than by a contract.

---

## 6. What is built here

`ExpertHub.Infrastructure/Fast/` — the REST client, registered and **off**.

- **`FastApiClient`** — GET and POST, Bearer auth, `Accept-Language` from the
  caller's locale, and **both response envelopes absorbed in one place**. The
  reference itself calls the `ApiResponse`/`ReturnResult` split a defect;
  unwrapping it once stops it spreading through our code.
- **`IFastTokenProvider`** — §4's question as a seam, with a null default.
  Answering §5.1 means replacing one registration.
- **`FastOperations`** — every usable path named once, so no capability builds
  a URL. What FAST does not expose is listed there as absent, not invented.
- **`FastReferenceReader`** — the first consumer: countries, education types,
  sectors, and the competency framework.

Reads return `JsonElement` where the contract declares no schema. That is
deliberate: a DTO written for an undeclared payload is a guess that compiles.

**Configured by `Fast:BaseUrl`.** Empty means every call fails closed with a
reason, so the product behaves exactly as it does today until a deployment
turns it on — the same arrangement as the AI provider and the email gateway
(`18` §7.3).

---

*Maintained beside [`FA-API-Reference.md`](../integrations/fast-api-reference.md) (the generated
contract), [`18_SSO_INTEGRATION.md`](18_SSO_INTEGRATION.md) (INT-01) and
[`15_INPUTS_REGISTER.md`](15_INPUTS_REGISTER.md) (every ask, by party).*
