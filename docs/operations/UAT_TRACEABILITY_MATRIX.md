# Expert Hub — UAT Traceability Matrix

*Prepared 2026-09-29 against commits `ca846fd` and `630c02e`; **revised after
Remediation Sprint 1**. Maps each business requirement or recorded decision to
the journey it lands in, the UAT test that accepts it, the automated test that
already proves it, and its status.*

## 0. Remediation Sprint 1 — DEF-01 … DEF-06

Every row below was written **test-first**: the test was added, shown to fail for
the defect's own reason, and only then was the fix made.

| Defect | Journey | Reproducing test | Status |
|---|---|---|---|
| **DEF-01** | J-05, J-08 | `Cap02Tests.Screening_reads_an_application_that_carries_several_qualifications` | **FIXED · VERIFIED** |
| **DEF-02** | J-16, J-17, J-18 | `Cap05Tests.Two_slots_of_one_request_never_offer_the_same_person_at_once` · `Cap05Tests.A_refused_offer_frees_the_person_to_be_offered_another_slot` | **FIXED · VERIFIED** |
| **DEF-03** | J-16, J-17 | `Cap05Tests.Naming_one_expert_of_three_leaves_two_slots_for_matching` · `Cap05Tests.Naming_every_expert_leaves_nothing_for_matching` | **FIXED · VERIFIED** |
| **DEF-04** | J-05, J-09, J-10, J-17 | `EmployeeReconciliationTests` — 7 tests incl. `An_external_user_granted_an_internal_role_is_reconciled_at_the_next_sign_in`, `A_user_who_loses_every_internal_role_stops_being_an_employee`, `Another_applicant_is_still_refused_the_same_document` | **FIXED · VERIFIED** |
| **DEF-05** | J-09, J-10 | `ApproverEligibilityTests` — 4 tests incl. `A_committee_cannot_seat_somebody_who_could_never_decide`, `An_authorized_member_forms_the_committee_and_can_then_decide` | **FIXED · VERIFIED** |
| **DEF-06** | J-11, J-12, J-13, J-14 | `Cap03Tests.Signing_the_agreement_makes_the_trainer_role_usable_in_the_same_session` | **FIXED · VERIFIED** |
| **cross-defect** | J-01, J-05, J-09 | `Cap02Tests.Two_qualifications_a_reconciled_reader_and_an_eligible_committee` | **VERIFIED** |

⚠️ **Not fixed in this sprint, by instruction:** every MEDIUM and LOW finding
(DEF-07 … DEF-30) stands exactly as the audit recorded it.

---

**Status values** — `AUTOMATED` (an automated test proves it; UAT confirms it end
to end) · `UAT_ONLY` (no automated test; UAT is the evidence) ·
`BLOCKED_EXTERNAL` · `BLOCKED_BUSINESS` · `NOT_TESTABLE_IN_UAT`.

UAT test IDs refer to [`UAT_ACCEPTANCE_PLAN.md`](UAT_ACCEPTANCE_PLAN.md).
Automated test names are real methods — every one listed was seen in the
2026-09-29 run (backend 347/347, frontend 838/838).

---

## 1. Recent decisions — P-309 … P-321

These are the decisions the current baseline turns on. Each is traced to the
journey it changes and the test that holds it.

| Decision | What it decided | Journey | UAT test | Automated test | Status |
|---|---|---|---|---|---|
| **P-309** | Criterion #3 is «المجال» — the Section 1 field the form already had. No new field, and `dm-gap-01.2026-09-22` deleted rather than published | J-01, J-05 | EV-03, EV-04 | `Criterion_3_reads_the_controlled_field_with_a_closed_table` · `Criterion_3_scores_the_applicants_domain` | AUTOMATED |
| **P-310** | The lesson: match a criterion's SOURCE COLUMN to an existing field before concluding no field exists | — (process) | — | — | NOT_TESTABLE_IN_UAT |
| **P-311** | An unclassified domain is UNRESOLVED, never a silent zero. `"strict":true` | J-05 | EV-05, EV-06 | `A_master_data_value_is_unresolved_never_scored_zero` · `A_resolved_score_never_reports_an_unresolved_criterion` | AUTOMATED |
| **P-312** | Relevance approved: 134 RELATED · 0 NOT_RELATED · 13 MASTER_DATA_REVIEW_REQUIRED · 0 unclassified | J-01, J-05 | EV-03, EV-05, AP-08 | `Criterion_3_scores_the_applicants_domain` · `The_engine_still_supports_a_NOT_RELATED_domain` | AUTOMATED |
| **P-313** | A value that is not a domain is a master-data fault, never «not related» | J-05 | EV-05 | `A_master_data_value_is_unresolved_never_scored_zero` (7 codes) | AUTOMATED |
| **P-314** | New applications stop offering the 13; every earlier version still offers all 147 | J-01 | AP-08, AP-09 | `A_historical_version_still_offers_every_legacy_domain` | AUTOMATED |
| **P-315** | Duplicates recorded, not merged → `EXPERT-HUB-DOMAIN-MASTER-CLEANUP` | J-01, J-05 | — | — | BLOCKED_BUSINESS |
| **P-316** | Filling a model version that has never shipped is not a new version | J-05 | — | — | NOT_TESTABLE_IN_UAT |
| **P-317** | `EVAL-GAP-11` — a blank classification is UNRESOLVED, never a scored zero. All three look-up tables closed | J-05 | EV-07, EV-08, EV-09, EV-10 | `An_explicitly_related_specialization_pays_its_configured_points` · `An_explicitly_unrelated_specialization_is_a_RESOLVED_zero` · `A_specialization_with_no_business_decision_is_unresolved` · `Leaving_the_specialization_blank_stays_the_applicants_own_zero` · `Every_classified_lookup_criterion_carries_a_closed_table` | AUTOMATED |
| **P-318** | Closing a table changes what a criterion pays → new model version `dm-gap-02.2026-09-29`; superseded versions keep their own tables | J-05 | EV-11 | `The_superseded_versions_keep_the_OPEN_tables_they_were_decided_with` · `Every_service_carries_the_approved_model_at_threshold_50` | AUTOMATED |
| **P-319** | Referral buckets are 0 · 1–3 · 4–7 · 8+, contiguous; the arithmetic already was | J-05 | EV-12 | `Client_referral_file_buckets_at_their_boundaries` · `Client_referral_buckets_are_contiguous_with_no_gap_and_no_overlap` | AUTOMATED |
| **P-320** | `preferredDeliveryMode` is Trainer-only; `requiredFor` matches `visibleFor`. New schema `dm-gap-01.2026-09-29` | J-01 | AP-10, AP-11 | `preferredDeliveryMode_is_required_by_exactly_the_services_that_see_it` (backend, 4 cases) · `The_superseded_version_keeps_the_declaration_it_published_with` · frontend `preferredDeliveryMode is required by exactly the services that see it` (4 cases) | AUTOMATED |
| **P-321** | «Published» is decided by the tooling, not the deployment state | J-01, J-05 | — | — | NOT_TESTABLE_IN_UAT |

---

## 2. Evaluation model `dm-gap-02.2026-09-29`

| Requirement | Journey | UAT test | Automated test | Status |
|---|---|---|---|---|
| RELATED → configured points | J-05 | EV-01 | `An_explicitly_related_specialization_pays_its_configured_points` | AUTOMATED |
| NOT_RELATED → **resolved** zero | J-05 | EV-02 | `An_explicitly_unrelated_specialization_is_a_RESOLVED_zero` · `The_engine_still_supports_a_NOT_RELATED_domain` | AUTOMATED |
| UNCLASSIFIED → unresolved | J-05 | EV-07 | `A_specialization_with_no_business_decision_is_unresolved` | AUTOMATED |
| Blank applicant answer → the applicant's own legitimate zero | J-05 | EV-08 | `Leaving_the_specialization_blank_stays_the_applicants_own_zero` · `An_application_that_never_answered_the_field_scores_a_clean_zero` | AUTOMATED |
| Unknown lookup → unresolved | J-05 | EV-09 | `A_specialization_with_no_business_decision_is_unresolved` (`spec-999`, `not-a-specialization`) | AUTOMATED |
| Criterion #3 «المجال» RELATED → 10.00 | J-05 | EV-03 | `Criterion_3_scores_the_applicants_domain` | AUTOMATED |
| Criterion #3 MASTER_DATA_REVIEW_REQUIRED → unresolved | J-05 | EV-05 | `A_master_data_value_is_unresolved_never_scored_zero` | AUTOMATED |
| Criterion #3 is COMMON — identical for all four services | J-05 | EV-04 | `Criterion_3_is_common_so_one_field_scores_the_same_for_every_service` | AUTOMATED |
| Common maximum = 70 | J-05 | EV-13 | `Every_service_carries_the_approved_model_at_threshold_50` (`Take(10).Sum == 70m`) | AUTOMATED |
| Service-specific maximum = 30, total 100 | J-05 | EV-13 | `Every_service_carries_the_approved_model_at_threshold_50` (`Sum == 100m`) | AUTOMATED |
| Trainer total reaches exactly 100 on the real seeded classification | J-05 | EV-14 | `A_perfect_applicant_scores_exactly_100_on_the_seeded_classification` | AUTOMATED |
| Consultant track reaches 100 | J-05 | EV-15 | `The_consultant_track_reaches_100_on_its_own_two_criteria` | AUTOMATED |
| Content Developer = Question Writer, one track | J-05 | EV-16 | `Content_developer_and_question_writer_share_one_track_exactly` | AUTOMATED |
| Services never blend | J-05 | EV-17 | `The_same_answers_score_differently_per_service_and_never_blend` | AUTOMATED |
| Referral boundaries 0, 1, 3, 4, 7, 8 | J-05 | EV-12 | `Client_referral_file_buckets_at_their_boundaries` · `Client_referral_buckets_are_contiguous_with_no_gap_and_no_overlap` | AUTOMATED |
| Threshold 50 is display-only | J-05 | EV-18 | `A_score_can_land_exactly_on_the_50_threshold` · `Immediately_below_the_threshold_is_a_half_point_under` · `Immediately_above_the_threshold_is_a_half_point_over` | AUTOMATED |
| Best-of (MAX) across repeatable entries; an added entry never lowers a score | J-01, J-05 | EV-19 | `Years_of_experience_takes_the_best_entry_not_the_first_or_the_average` · `The_highest_qualification_scores_across_several_qualifications` · `An_added_entry_can_never_lower_the_score` | AUTOMATED |
| A result decided under an older model keeps its score | J-05 | EV-11, EV-20 | `A_result_recorded_under_the_draft_model_still_computes_the_old_way` · `The_superseded_matrix_keeps_criterion_3_unscored_forever` · `The_draft_model_survives_inactive_so_old_results_still_resolve` | AUTOMATED |

---

## 3. Application schema `dm-gap-01.2026-09-29`

| Requirement | Journey | UAT test | Automated test | Status |
|---|---|---|---|---|
| Six J-01 sections in the workbook's order | J-01 | AP-01 | frontend `the served schema is the supplied field map, not the retired mock` | AUTOMATED |
| Step per section, derived from the schema (`P-297`) | J-01 | AP-02 | — (UI) | UAT_ONLY |
| Union-of-services mandatory logic (`BR-0104`) | J-01 | AP-03 | frontend `BR-0104: a field is required when ≥1 selected service requires it (union)` | AUTOMATED |
| Completeness gate (`BR-0105`) | J-01 | AP-04 | frontend `BR-0105: completeness reports missing required fields and attachments` | AUTOMATED |
| Attachment rules 1 MB, approved formats (`BR-0106`) | J-01 | AP-05 | frontend `BR-0106: rejects wrong format, oversized files, and over-count uploads` | AUTOMATED |
| Multiple qualifications survive save and reload | J-01, J-13, J-14 | AP-06 | `Several_qualifications_survive_a_save_and_a_reload` · `Editing_one_qualification_leaves_the_others_alone` · `Removing_the_middle_qualification_keeps_the_survivors_and_their_ids` | AUTOMATED |
| A non-repeatable section refuses entries | J-01 | AP-07 | `A_section_the_schema_does_not_repeat_refuses_entries` | AUTOMATED |
| Pre-entries applications read as exactly one entry | J-01 | AP-09 | `An_application_written_before_entries_reads_as_exactly_one` | AUTOMATED |
| Domain dropdown offers 134 to new applicants | J-01 | AP-08 | `A_historical_version_still_offers_every_legacy_domain` · frontend schema test (134 / 147 / 13) | AUTOMATED |
| Historical schema still offers 147 | J-01 | AP-09 | `A_historical_version_still_offers_every_legacy_domain` | AUTOMATED |
| `preferredDeliveryMode` Trainer-only, both validators agree | J-01 | AP-10, AP-11 | backend + frontend `preferredDeliveryMode_is_required_by_exactly_the_services_that_see_it` | AUTOMATED |
| Arabic RTL default | J-01, all | AP-12 | — (`index.html` sets `lang="ar" dir="rtl"`) | UAT_ONLY |
| No horizontal overflow, mobile and desktop | all | AP-13 | — | UAT_ONLY |
| English UI | all | AP-14 | — | **NOT_TESTABLE_IN_UAT** — see DEF-02: no locale control exists in Expert Hub |

---

## 4. Business decisions BD-UAT-01 … 07

| Decision | Question | Journey | UAT test | Status |
|---|---|---|---|---|
| BD-UAT-01 | How a nominee record links to an SSO identity | J-02 | — | **BLOCKED_BUSINESS** — J-02 not runnable |
| BD-UAT-02 | Approve a service request with no active agreement? | J-03 | SC-D-06 | DECIDED — rejected automatically, not overridable (`P-345`); `ApplicationTests.With_no_active_agreement_a_service_request_is_rejected_automatically_and_cannot_be_approved` |
| BD-UAT-03 | Is internal acceptance legally sufficient? | J-10, J-11 | SC-D-04, SC-D-05 | BLOCKED_BUSINESS for production; UAT proceeds on `internal-acceptance` |
| BD-UAT-04 | Which date starts an agreement's term? | J-11, J-12 | SC-D-07 | BLOCKED_BUSINESS — testers must know it is the signature timestamp today |
| BD-UAT-05 | Must the pool sender differ from the approver? | J-17 | SC-F-05 | BLOCKED_BUSINESS — nothing enforces segregation today |
| BD-UAT-06 | Who receives each event, on which channel? | J-25 | SC-K-01, SC-K-02 | BLOCKED_BUSINESS — events stay `unrouted`; nothing is invented |
| BD-UAT-07 | The approved legal text | J-10, J-11 | SC-D-01 | BLOCKED_BUSINESS — UAT agreements are test records |

---

## 5. Release blockers RB-01 … RB-13

Full evidence in the UAT Readiness Report. Summary trace:

Test classes below were mapped by reading each file's own `J-xx` references,
not inferred from its name.

| RB | Journey | UAT test | Automated test class(es) | Status |
|---|---|---|---|---|
| RB-01 | all signed-in | SEC-01 | `OidcFlowTests`, `AuthEndpointsTests`, `ConfigurationSafetyTests` | BLOCKED_EXTERNAL (EXT-01) |
| RB-02 | J-02 | — | **none — no test file references J-02** | BLOCKED_BUSINESS (BD-UAT-01) |
| RB-03 | J-03 | SC-D-06 | `ApplicationTests`, `Cap03Tests`, `Cap04Tests` | BLOCKED_BUSINESS (BD-UAT-02) |
| RB-04 | J-06 | SC-C-01 … SC-C-05 | `Cap02Tests`, `MeetingProviderTests` | AUTOMATED |
| RB-05 | J-10 | SC-D-01 … SC-D-03 | `Cap03Tests` | BLOCKED_BUSINESS (BD-UAT-03/07) |
| RB-06 | J-11 | SC-D-04, SC-D-05 | `Cap03Tests` | BLOCKED_BUSINESS (BD-UAT-03/07) |
| RB-07 | J-16 | SC-F-01 | `Cap05Tests` | AUTOMATED |
| RB-08 | J-18 | SC-G-01 … SC-G-04 | `Cap05Tests`, `ContractFixtures` | AUTOMATED |
| RB-09 | J-19 | SC-G-05 | `Cap05Tests` | AUTOMATED |
| RB-10 | J-20 | SC-H-01 … SC-H-03 | `Cap05Tests` | AUTOMATED |
| RB-11 | J-21 | SC-I-01 … SC-I-03 | `Cap05Tests`, `Cap04Tests` | AUTOMATED |
| RB-12 | J-22 | SC-I-04, SC-I-05 | `Cap05Tests`, `ContractFixtures` | AUTOMATED |
| RB-13 | J-25 | SC-K-01, SC-K-02 | `NotificationFoundationTests`, `NotificationTests` | BLOCKED_EXTERNAL (EXT-05) + BLOCKED_BUSINESS (BD-UAT-06) |

⚠️ **No test file references J-02, J-23 or J-26 by name.** J-02 is removed by
design. J-23 consent and J-24 projection are exercised inside `Cap04Tests` and
`TrainerFileStatusTests`; J-26 permissions are exercised by
`FeaturePermissionTests` and `AccessEndpointsTests`. Those three journeys
therefore lean harder on UAT than the rest.

---

## 6. Security and authorization

| Requirement | UAT test | Automated test | Status |
|---|---|---|---|
| Unauthenticated access is refused | SEC-01 | `AuthEndpointsTests`, `AccessEndpointsTests` | AUTOMATED |
| Wrong-role access is refused (trainer → internal) | SEC-02 | frontend `blocks a trainer from an internal route (RequireRole → unauthorized)` · `FeaturePermissionTests` | AUTOMATED |
| Direct URL access to an internal page | SEC-03 | frontend router guard tests | AUTOMATED |
| API authorization per endpoint | SEC-04 | `FeaturePermissionTests`, `AccessEndpointsTests` | AUTOMATED |
| IDOR — another applicant's application | SEC-05 | `ApplicationTests`, `AccessEndpointsTests` | AUTOMATED |
| Document/attachment download authorization | SEC-06 | `DocumentStoreTests` | AUTOMATED |
| Agreement document version access | SEC-07 | `Cap03Tests` | AUTOMATED |
| Public vs private profile separation | SEC-08 | `TrainerFileStatusTests`, `Cap04Tests` | AUTOMATED |
| No secret in `appsettings.json` | SEC-09 | `ConfigurationSafetyTests` | AUTOMATED |
| No silent mocks outside development/test | SEC-10 | `ProviderReadinessTests`, `ReadinessTests` | AUTOMATED |

---

## 7. Coverage gaps — requirements with no automated test

These are the rows UAT is the **only** evidence for. They are not defects; they
are where a tester's judgement is load-bearing.

| Requirement | Journey | Why no automated test | UAT test |
|---|---|---|---|
| Step-per-section wizard navigation and per-step gating | J-01 | UI flow; the schema derivation is tested, the interaction is not | AP-02 |
| Arabic RTL rendering quality | all | Visual | AP-12 |
| No horizontal overflow at mobile width | all | Visual / layout | AP-13 |
| Draft persistence across a browser session | J-01 | Needs a real browser session | AP-15 |
| Teams join link appears for applicant and panel | J-06 | Needs EXT-04 | SC-C-04 |
| An email actually arrives | J-25 | Needs EXT-05 | SC-K-03 |
| The agreement document reads correctly to a human | J-10, J-11 | Legal text, not logic | SC-D-01 |
| Identity Card visual layout | J-15 | Visual; the highest-qualification rule is tested | SC-E-04 |

---

Related: [`UAT_JOURNEY_MATRIX.md`](UAT_JOURNEY_MATRIX.md) ·
[`UAT_ACCEPTANCE_PLAN.md`](UAT_ACCEPTANCE_PLAN.md) ·
[`UAT_EXTERNAL_DEPENDENCIES.md`](UAT_EXTERNAL_DEPENDENCIES.md) ·
[`DECISIONS.md`](../DECISIONS.md) · [`24_RELEASE_READINESS.md`](../specification/24_RELEASE_READINESS.md)
