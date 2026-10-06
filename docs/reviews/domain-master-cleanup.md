# EXPERT-HUB-DOMAIN-MASTER-CLEANUP

**Backlog item — master data, not scoring.** Raised 2026-09-28 by the approved relevance policy for Evaluation-Matrix criterion #3 «المجال».

## Why this exists

The «مجال التخصص» master list has 147 values. Classifying them for criterion #3 forced a reading of every one, and that reading found that **13 of them are not professional domains at all** and that **3 more duplicate another value**. Those are data faults in a list that predates Expert Hub; they are not relevance decisions, and the policy is explicit that they must not be recorded as one.

What was done instead, and what is deliberately left undone:

| | |
|---|---|
| Done — scoring | The 13 are **omitted** from criterion #3's look-up table. The rule is `strict`, so an application carrying one is reported **UNRESOLVED**, never silently scored 0. |
| Done — new applications | `INACTIVE_DOMAIN_CODES` removes the 13 from the dropdown of form schema `dm-gap-01.2026-09-28`. A new applicant cannot pick one. |
| **Not** done — and out of scope here | No value is renamed, merged, re-pointed or deleted. Every one of the 147 codes still exists, and every historical application still resolves its own label. |

This document is the backlog for the part that was **not** done. It needs a data owner, not a developer.

## 1 — Values that are not professional domains (13)

All 13 are classified `MASTER_DATA_REVIEW_REQUIRED` in `practical-experience-relevance.xlsx`. None is classified `NOT_RELATED`: the business never ruled them irrelevant, only unscoreable.

### Tools

The value names a software product. A tool belongs in a skills list, not in a domain list.

| Code | المجال | Working translation | Recommended home |
|---|---|---|---|
| `dom-032` | اكسل | Excel | A skills / tools master list |
| `dom-076` | مايكروسوفت Power BI | Microsoft Power BI | A skills / tools master list |

### Certifications / exams

The value names a credential. The matrix already scores certificates under criteria #4–#6; scoring one again as a «domain» would pay for it twice.

| Code | المجال | Working translation | Recommended home |
|---|---|---|---|
| `dom-011` | CME1 | CME1 (CMA qualification examination) | The certificates master list (criteria #4–#6) |
| `dom-039` | مسؤول الالتزام المعتمد | Certified Compliance Officer | The certificates master list (criteria #4–#6) |
| `dom-139` | إدارة مشاريع (PMP) | Project management (PMP) | The certificates master list (criteria #4–#6) |

### Methodologies

The value names a technique or a delivery method, not a subject area.

| Code | المجال | Working translation | Recommended home |
|---|---|---|---|
| `dom-037` | طرق كشف تزوير المستندات والتواقيع | Methods of detecting document and signature forgery | A training-methods list, or delete |
| `dom-075` | تدريب المدربين(TOT) | Train the trainer (TOT) | A training-methods list, or delete |

### Programme names and programme types

The value names an Academy offering, not the applicant's own field.

| Code | المجال | Working translation | Recommended home |
|---|---|---|---|
| `dom-029` | اجادة - لمدراء العمليات | Ijadah — for operations managers | The programme catalogue |
| `dom-035` | البرامج القيادية | Leadership programmes | The programme catalogue |
| `dom-042` | البرامج الخاصة | Special programmes | The programme catalogue |

### Service types

The value repeats what the applicant is applying to DO (the service selection), not what they know.

| Code | المجال | Working translation | Recommended home |
|---|---|---|---|
| `dom-016` | تقديم خدمات خبير | Providing expert services | Already covered by the service selection — delete |
| `dom-096` | تقديم خدمات استشارية | Providing consulting services | Already covered by the service selection — delete |

### Catch-alls

The value carries no information at all.

| Code | المجال | Working translation | Recommended home |
|---|---|---|---|
| `dom-122` | الجميع | All / everyone | Delete; it can never carry meaning |

## 2 — Near-duplicates (3 pairs)

Both sides of every pair are real domains and both are classified `RELATED`, so **nothing about scoring changes if these are never merged**. They are listed because a list that offers the same concept twice splits the applicant population across two codes and makes every later report wrong by construction.

| Canonical (keep) | Duplicate candidate (retire) | Note |
|---|---|---|
| `dom-125` الوعي المالي | `dom-141` وعي مالي | Same concept, two spellings. dom-125 is the fuller Arabic form. |
| `dom-111` التقنية المالية | `dom-144` الفنتك | Same concept; dom-111 is the full Arabic term, dom-144 the English loanword. |
| `dom-145` إدارة المشاريع | `dom-139` إدارة مشاريع (PMP) | Same discipline; dom-139 additionally names a certification (PMP), which is why it is ALSO in the not-a-domain list above. dom-145 is the clean one. |

⚠️ The *canonical* direction above is a **recommendation, not a decision**. Which spelling survives is the data owner's call, and nothing in the code assumes an answer.

## 3 — Usage count

**In this repository: zero recorded selections.** Every occurrence of a `dom-###` code in the codebase is a *catalogue* row (a form-schema option list or an EF migration that seeds one), not an applicant's answer. No seeded or demo application selects any of the 16 values above.

The production count is the one that matters, and it can only be taken from the live database. It is a single query:

```sql
-- How many real applications selected a value this backlog would touch?
SELECT v.value_text AS domain_code, COUNT(*) AS applications
FROM   APPLICATION_FIELD_VALUE v
WHERE  v.field_code = 'domain'
  AND  v.value_text IN (
         -- not a domain at all
         'dom-032', 'dom-076', 'dom-011', 'dom-039', 'dom-139', 'dom-037', 'dom-075'
       , 'dom-029', 'dom-035', 'dom-042', 'dom-016', 'dom-096', 'dom-122'
         -- duplicate candidates
       , 'dom-141', 'dom-144', 'dom-139'
       )
GROUP  BY v.value_text
ORDER  BY applications DESC;
```

Run it before scheduling any of the work below. A value with zero production selections is a documentation change; a value with hundreds is a migration with a communications plan attached.

## 4 — Historical references that must keep working

Three places hold a `dom-###` code, and they behave differently. The distinction is the whole reason the cleanup is safe to defer.

| Where | Holds | Must survive a cleanup? |
|---|---|---|
| `APPLICATION_FIELD_VALUE.value_text` | the applicant's own answer | **Yes — forever.** This is the record of what a person actually submitted. |
| `ApplicationSchemaSeed.dmgap01<version>.cs` → `FORM_FIELD.definition` | a **frozen per-version copy** of the option list | **Yes.** Each schema version carries its own copy, so version `2026-09-21` still serves all 147 and renders every historical answer's label. |
| `PracticalExperienceRelevance.ScoreRule` (model `dm-gap-02.…`) | the option→points table | **Yes.** Each evaluation-model version keeps its own rule, and `SCREENING_RESULT.model_id` pins a decided result to the model that produced it. |

Because the option list is copied per schema version rather than referenced, **removing a value from the current version cannot reach backwards.** That is already proven by a test: `A_historical_version_still_offers_every_legacy_domain` asserts that `dm-gap-01.2026-09-21` still offers 147 (including `dom-122`, `dom-032` and `dom-076`) while `dm-gap-01.2026-09-28` offers 134 and offers none of the three.

## 5 — Safe migration approach

In the order that keeps every step individually revertible.

1. **Measure.** Run the query in §3. Nothing below is schedulable without it.
2. **Decide, per value, in the workbook — not in code.** For each of the 13: which master list is its real home (skills, certificates, programmes), or is it simply deleted? For each of the 3 pairs: which spelling is canonical? Record the decision in `practical-experience-relevance.xlsx`; it is the only place a business ruling belongs.
3. **Never rewrite an applicant's answer in place.** If a duplicate is merged, migrate with a mapping table (`retired_code → canonical_code`) and write a **new** value while keeping the original in an audit column. An applicant's submission is evidence; overwriting it destroys the audit trail that `SCREENING_RESULT` depends on.
4. **Never re-score a decided application.** A migrated value does not entitle anyone to a recalculation. Already-decided results stay pinned to their own model version — this is a standing constraint, not a preference.
5. **Publish the change as a NEW form-schema version**, exactly as `dm-gap-01.2026-09-28` did. Add the version, regenerate the seed, add the migration. Do not edit an existing version's frozen copy and do not modify an old migration.
6. **Regenerate, never hand-edit.** `python tools/data/practical-experience-relevance.py extract` rewrites both `PracticalExperienceRelevance.cs` and `domainCatalogueStatus.ts` from the workbook. Both files say «GENERATED — do not edit by hand» and mean it.
7. **Keep the unresolved path.** While any value remains unclassified or invalid, criterion #3 must keep reporting UNRESOLVED rather than 0. A cleanup that ends with an unknown value quietly scoring zero has made things worse, not better.

## 6 — What would tell us this is done

- `MasterDataReviewCount` in `PracticalExperienceRelevance.cs` is `0`.
- `INACTIVE_DOMAIN_CODES` is empty, and `activeDomains()` becomes a no-op worth deleting.
- No two values in the master list name the same concept.
- Every historical application still renders its original label, and every decided screening result still shows the score it was decided with.

---

Related: `DECISIONS.md` (P-312 … P-316), `docs/inputs/practical-experience-relevance.xlsx` (authoritative classification), `docs/inputs/practical-experience-relevance-review.xlsx` (the business review this came out of).
