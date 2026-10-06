# Expert Hub — UAT Acceptance Plan

*Version 1.1 · 2026-09-29 · baseline `ca846fd` + `630c02e` + Remediation Sprint 1*

> **What changed in v1.1.** Six blocking defects were fixed and each has a test
> that failed before the fix and passes after. The rows below that used to say
> «expected to FAIL today» now expect the correct behaviour — if one of them
> fails in UAT, it is a **regression** and should be raised immediately.

**For business testers. No source code needed.** Every step is something you do
on screen. Where a result depends on a decision that has not been made yet, the
row says so rather than asking you to guess.

---

## How to use this pack

1. Read **Before you start** and confirm every line. If any fails, stop and tell
   the Expert Hub team — the rest of the pack will not be meaningful.
2. Work through the scenarios in order inside each section. Later steps in a
   scenario usually depend on earlier ones.
3. Fill in **Actual Result**, **PASS/FAIL**, **Tester**, **Date** and
   **Comments** for every row you run.
4. If a row cannot be run, write `BLOCKED` in PASS/FAIL and say what blocked it.

**Recording a failure well:** write what you saw, not what you think went wrong.
"The page showed a red error box saying 'Something went wrong'" is more useful
than "the API broke".

---

## Before you start

| # | Check | Expected | OK? |
|---|---|---|---|
| PRE-1 | Open the Expert Hub address in a browser | The Arabic landing page loads. **No** configuration-error screen | |
| PRE-2 | Sign in with a test account | You reach a home page, not an error | |
| PRE-3 | Ask the team for the readiness snapshot | You have been given the output of the internal readiness check, attached to this run | |
| PRE-4 | Confirm the environment label | The team confirms this is a **UAT** environment, not a development one | |

> ⚠️ **Known at the time of writing:** sign-in depends on an identity
> registration that was still outstanding (EXT-01). If PRE-2 fails with
> "SSO is not configured", UAT cannot start — this is expected until the
> identity team completes registration.

---

## Test data you will need

Ask the Expert Hub team to prepare these before the session. **Do not use real
people's data.**

| Persona | What it is | Minimum state needed |
|---|---|---|
| **Applicant A — Trainer** | A person applying to be a Trainer | A sign-in account with no existing application |
| **Applicant B — Consultant** | A person applying to be a Consultant | A sign-in account with no existing application |
| **Applicant C — Multi-service** | Applies for Trainer **and** Content Developer together | A sign-in account with no existing application |
| **Applicant D — unresolved specialization** | Same as A, but picks the specialization that has no classification (the footnote row at the bottom of the list, beginning with `*`) | A sign-in account with no existing application |
| **Applicant E — domain edge case** | An application submitted **before** 28 Sep 2026 that selected one of the 13 retired domain values | Must be prepared by the team; it cannot be created through the form today |
| **Applicant F — two qualifications** | Same as A, but enters **two** academic qualifications | A sign-in account with no existing application |
| **Internal Staff** | Screens applications | Internal account holding the screening permission |
| **Committee Member** | Sits on an approval committee | Internal account holding the **committee decision** permission — see the warning below |
| **Agreement Signer** | Signs the agreement internally | Internal account holding the **agreement** permission |
| **Centre Coordinator** | Raises assignment requests | Internal account holding the assignment-request permission |
| **System Administrator** | Manages roles and permissions | Internal account with the administrator role |

> ℹ️ **Committee and signing pickers now list only people who can actually act**
> (DEF-05 fixed). If somebody you expect is missing, they lack the permission —
> ask an administrator to grant it rather than working around it.

---

## Section EV — Evaluation scoring

*Evaluation model `dm-gap-02.2026-09-29`. Run these on the screening screen of a
submitted application. Scores are now **approved**, not placeholders — judge
them.*

| Test ID | Journey | Role | Preconditions | Steps | Expected Result | Actual | PASS/FAIL | Tester | Date | Comments |
|---|---|---|---|---|---|---|---|---|---|---|
| EV-01 | J-05 | Internal Staff | Applicant A submitted, specialization = a finance/economics/management one | Open the application → read the criteria breakdown | «التخصص العام» shows **10.00** | | | | | |
| EV-02 | J-05 | Internal Staff | An applicant whose specialization is explicitly marked not related (e.g. Law) | Open → read the breakdown | «التخصص العام» shows **0.00** and is **not** flagged as needing attention | | | | | |
| EV-03 | J-05 | Internal Staff | Applicant A, «المجال» = any of the 134 selectable values | Open → read the breakdown | «المجال» shows **10.00** | | | | | |
| EV-04 | J-05 | Internal Staff | Applicant C (two services) | Open → compare «المجال» on both services | The **same** value on both — it is a shared criterion | | | | | |
| EV-05 | J-05 | Internal Staff | Applicant E (a retired domain value) | Open → read the breakdown | «المجال» shows **0.00** **and** is flagged «غير مصنّف — يحتاج ضبط الإعدادات». It must **not** look like a normal zero | | | | | |
| EV-06 | J-05 | Internal Staff | Applicant E | Read the total | The total is visibly incomplete/flagged, not presented as a final score | | | | | |
| EV-07 | J-05 | Internal Staff | Applicant D (the `*` footnote specialization) | Open → read the breakdown | «التخصص العام» shows **0.00** **and** is flagged as unclassified | | | | | |
| EV-08 | J-05 | Internal Staff | An applicant who left the specialization empty | Open → read the breakdown | «التخصص العام» shows **0.00** and is **not** flagged. An unanswered question is the applicant's own zero | | | | | |
| EV-09 | J-05 | Internal Staff | Ask the team to prepare an application carrying an unknown specialization code | Open → read the breakdown | Flagged as unclassified, not silently zero | | | | | |
| EV-12 | J-05 | Internal Staff | Applicant A, vary the number of client-referral files | Submit with 0, then 1, 3, 4, 7, 8 files | 0 → 0.00 · 1 and 3 → 1.71 · 4 and 7 → 3.43 · 8 → 6.00. **7 pays the middle band, 8 opens the top band** | | | | | |
| EV-13 | J-05 | Internal Staff | Any submitted application | Add up the criteria weights shown | Shared criteria total **70**, the service's own total **30**, overall **100** | | | | | |
| EV-14 | J-05 | Internal Staff | Applicant A with the best answer to every question | Open → read the total | Exactly **100.00** | | | | | |
| EV-15 | J-05 | Internal Staff | Applicant B with the best answer to every question | Open → read the total | Exactly **100.00** | | | | | |
| EV-16 | J-05 | Internal Staff | A Content Developer and a Question Writer with identical answers | Compare the two breakdowns | Identical, line for line | | | | | |
| EV-17 | J-05 | Internal Staff | Applicant C | Compare the two services' totals | They differ, and neither borrows from the other | | | | | |
| EV-18 | J-05 | Internal Staff | Applications scoring just under, exactly on and just over 50 | Read each result | The 50 mark is shown for information only. It never decides anything by itself | | | | | |
| EV-19 | J-05 | Internal Staff | Applicant F (two qualifications, one higher) | Open → read «المؤهل» | Scored on the **better** qualification. Adding a qualification never lowers a score | | | | | |
| EV-20 | J-05 | Internal Staff | An application already decided before this release | Re-open it | The score is **unchanged** from the day it was decided | | | | | |

---

## Section AP — Application form

*Form version `dm-gap-01.2026-09-29`.*

| Test ID | Journey | Role | Preconditions | Steps | Expected Result | Actual | PASS/FAIL | Tester | Date | Comments |
|---|---|---|---|---|---|---|---|---|---|---|
| AP-01 | J-01 | Applicant A | Signed in | Start a new application | Six sections in order: personal, education, certifications, experience, training content, availability | | | | | |
| AP-02 | J-01 | Applicant A | As above | Move through the wizard | One step per section. Continue is blocked until the current step is complete | | | | | |
| AP-03 | J-01 | Applicant C | As above | Select two services | Fields required by **either** service are required | | | | | |
| AP-04 | J-01 | Applicant A | As above | Try to submit an incomplete form | Refused, and every missing field and attachment is named | | | | | |
| AP-05 | J-01 | Applicant A | As above | Upload a `.exe`, then a file over 1 MB, then a valid PDF | First two refused with a clear reason; the third accepted | | | | | |
| AP-06 | J-01 | Applicant F | As above | Add two qualifications, save, leave the page, return | **Both** are still there, in order, complete | | | | | |
| AP-07 | J-01 | Applicant F | As above | Edit the second qualification, then delete the first | The survivor keeps its own values — no shuffling | | | | | |
| AP-08 | J-01 | Applicant A | As above | Open the «المجال» dropdown and count | **134** values. «الجميع», «اكسل» and «Power BI» are **not** offered | | | | | |
| AP-09 | J-01 | Internal Staff | Applicant E's historical application | Open it | It still displays its original domain value correctly | | | | | |
| AP-10 | J-01 | Applicant A (Trainer) | As above | Reach the training-content step | «نمط التقديم المفضل لديك» is shown **and required** | | | | | |
| AP-11 | J-01 | Applicant B (Consultant) | As above | Reach the same step | The field is **not shown** and is **not** required to submit | | | | | |
| AP-12 | J-01 | Applicant A | As above | Look at the whole form | Arabic throughout, right-to-left, correct alignment | | | | | |
| AP-13 | J-01 | Applicant A | Use a phone or a narrow browser window | Move through every step | No sideways scrolling anywhere. The step indicator stacks vertically | | | | | |
| AP-15 | J-01 | Applicant A | As above | Fill two steps, close the browser, sign in again, reopen | The draft resumes where you left it | | | | | |
| AP-16 | J-01 | Applicant A | Has an open application | Try to start a second one | Refused, and the existing application is named | | | | | |

> **AP-14 (English UI) cannot be run.** Expert Hub has no language control today,
> so the interface is Arabic only (DEF-29). Mark it `BLOCKED`.

---

## Section SC — End-to-end business scenarios

### A — New expert application

| Test ID | Role | Steps | Expected Result | Actual | PASS/FAIL | Tester | Date | Comments |
|---|---|---|---|---|---|---|---|---|
| SC-A-01 | Applicant F | Sign in → start an application → pick Trainer | The form opens with Trainer's fields | | | | | |
| SC-A-02 | Applicant F | Add **two** qualifications and **two** past roles | Both of each are accepted and listed | | | | | |
| SC-A-03 | Applicant F | Complete every step → open the review step | The review lists **every** qualification and role in full, not just the first | | | | | |
| SC-A-04 | Applicant F | Submit | A reference number `EH-YYYY-NNNNN` is shown | | | | | |
| SC-A-05 | Internal Staff | Open the application in the screening screen | The page opens and shows **both** qualifications and both past roles, each in full *(DEF-01 fixed)* | | | | | |

### B — Multi-service expert

| Test ID | Role | Steps | Expected Result | Actual | PASS/FAIL | Tester | Date | Comments |
|---|---|---|---|---|---|---|---|---|
| SC-B-01 | Applicant C | Apply for Trainer **and** Content Developer in one application | Both accepted on one form | | | | | |
| SC-B-02 | Internal Staff | Open the screening screen | Each service has its **own** score and breakdown | | | | | |
| SC-B-03 | Internal Staff | Compare the shared criteria across the two services | Identical values | | | | | |
| SC-B-04 | Internal Staff | Accept one service and send the other to interview | Each service follows its own path independently | | | | | |

### C — Interview

| Test ID | Role | Steps | Expected Result | Actual | PASS/FAIL | Tester | Date | Comments |
|---|---|---|---|---|---|---|---|---|
| SC-C-01 | Internal Staff | Accept a service with interview → propose slots and name the panel | An interview is created with a ticket number `INT-YYYY-NNNN` | | | | | |
| SC-C-02 | Applicant | Open the application → choose a slot | The interview is confirmed. The ticket number is shown | | | | | |
| SC-C-03 | Applicant | Ask for different times, with a note | The request is accepted and confirmed on screen | | | | | |
| SC-C-04 | Internal Staff | Open the interview page | The applicant's request **and note** are visible. Propose new slots → **the ticket number does not change** | | | | | |
| SC-C-05 | Committee Member | Score every axis for every accepted service | The result stays hidden until **every** member has responded | | | | | |
| SC-C-06 | Internal Staff | After all responses, read the result | Pass/fail per service against the 70% mark | | | | | |
| SC-C-07 | Internal Staff | Forward the passing services to the committee | Only passing (and exempted) services move on | | | | | |

> Teams meeting links are not configured (EXT-04). The interview will show the
> meeting as **pending** with no link. That is expected, not a failure.

### D — Committee & agreement

| Test ID | Role | Steps | Expected Result | Actual | PASS/FAIL | Tester | Date | Comments |
|---|---|---|---|---|---|---|---|---|
| SC-D-01 | Internal Staff | Form an approval committee. **Check first that every member holds the committee permission** | The sequence is created in the order you set | | | | | |
| SC-D-02 | Committee Member | Approve in turn | The sequence advances one member at a time | | | | | |
| SC-D-03 | Internal Staff | After approval, open agreement preparation | It is blocked until the trainer's bank data is complete, and says so | | | | | |
| SC-D-04 | Agreement Signer | Complete preparation → form a signing sequence → sign | A **designated signer cannot merely approve** — a signature is required | | | | | |
| SC-D-05 | Applicant | Open the application → read the agreement | The **complete** document is shown, with the terms that were entered | | | | | |
| SC-D-06 | Applicant | Accept and sign with your typed full name | Recorded as **internal acceptance**. It is **never** called a certified signature and no PDF is offered | | | | | |
| SC-D-07 | Internal Staff | Re-prepare an agreement that already had signatures | Earlier signatures are **voided and kept**, never deleted | | | | | |
| SC-D-08 | Applicant | After signing, **without signing out**, open "My profile" | The trainer profile opens immediately *(DEF-06 fixed)* | | | | | |

> **Legal status:** the agreement wording is **not legally approved** (BD-UAT-07)
> and internal acceptance has not been ruled legally sufficient (BD-UAT-03).
> Every agreement signed in UAT is a **test record**. The term currently starts
> at the moment of signature, not at the start date entered in preparation
> (BD-UAT-04) — this is undecided, so do not raise it as a defect.

### E — Expert profile

| Test ID | Role | Steps | Expected Result | Actual | PASS/FAIL | Tester | Date | Comments |
|---|---|---|---|---|---|---|---|---|
| SC-E-01 | Applicant F (now a trainer) | Sign out and in, then open "My profile" | The profile exists | | | | | |
| SC-E-02 | Applicant F | Look at the education section | **Both** qualifications are listed | | | | | |
| SC-E-03 | Internal Staff | Open the trainer in the trainer database | The unified profile opens | | | | | |
| SC-E-04 | Internal Staff | Read the Identity Card | It shows the **highest** qualification only | | | | | |
| SC-E-05 | Internal Staff | Read the detailed profile below the card | ⚠️ **Still expected to show only the highest qualification — DEF-12**, which is MEDIUM and was deliberately NOT in Sprint 1. Record what you see | | | | | |

### F — Assignment

| Test ID | Role | Steps | Expected Result | Actual | PASS/FAIL | Tester | Date | Comments |
|---|---|---|---|---|---|---|---|---|
| SC-F-01 | Centre Coordinator | Create a request: pick a centre, a request type, fill the fields, upload a brochure, headcount **1** | A reference `ASR-YYYY-NNNN` is created | | | | | |
| SC-F-02 | Centre Coordinator | Try dates that run backwards | Refused, naming the date field | | | | | |
| SC-F-03 | Centre Coordinator | Name one expert who is not eligible | The whole request is refused and the reasons are shown | | | | | |
| SC-F-04 | Centre Coordinator | Name the same expert twice | Refused as a duplicate | | | | | |
| SC-F-05 | Centre Coordinator | Create a request with headcount **2** and name **1** expert | The named expert takes one slot; the **other slot goes to matching**. The named expert does **not** receive a second offer *(DEF-02, DEF-03 fixed)* | | | | | |
| SC-F-06 | Internal Staff | Run matching on a headcount-1 request | A ranked shortlist of exactly 3 candidates | | | | | |
| SC-F-08 | Centre Coordinator | Create a request with headcount **2**, name nobody, and take it through matching to offers | The two slots open offers to **two different** people. Nobody holds two live offers on the same request *(DEF-02)* | | | | | |
| SC-D-09 | Internal Staff | Try to add somebody without the committee permission to a committee | Refused, and the application can still be given a correct committee — **no 409 deadlock** *(DEF-05)* | | | | | |
| SC-F-07 | Centre Coordinator | Approve candidates and set a preference order | The pool is decided and the first offer opens | | | | | |

### G — Matching / offer

| Test ID | Role | Steps | Expected Result | Actual | PASS/FAIL | Tester | Date | Comments |
|---|---|---|---|---|---|---|---|---|
| SC-G-01 | Trainer | Open "My engagements" | The offer is listed with the plan detail, the price reference and a countdown | | | | | |
| SC-G-02 | Trainer | Accept | An engagement is created and the slot is confirmed | | | | | |
| SC-G-03 | Trainer (2nd) | On another slot, refuse | The offer passes to the next approved candidate | | | | | |
| SC-G-04 | Internal Staff | Let an offer's window pass, then have the trainer try to accept | Refused — the window has closed | | | | | |
| SC-G-05 | Internal Staff | On a slot where everyone refused, open re-routing and run a new cycle | A new cycle opens. An earlier refuser may be included again | | | | | |

### H — Materials

| Test ID | Role | Steps | Expected Result | Actual | PASS/FAIL | Tester | Date | Comments |
|---|---|---|---|---|---|---|---|---|
| SC-H-01 | Trainer | Open "Materials and content" | A submission is waiting for upload | | | | | |
| SC-H-02 | Trainer | Upload | The status becomes "pending approval" | | | | | |
| SC-H-03 | Internal Staff | Request changes **without** a note | Refused — a note is required | | | | | |
| SC-H-04 | Internal Staff | Request changes **with** a note | The trainer can upload again; a new round is recorded | | | | | |
| SC-H-05 | Internal Staff | Approve | The submission is approved | | | | | |

> ⚠️ Only the **file name** is kept — no file is stored (DEF-11). You cannot open
> what the trainer submitted. Treat the review step as a workflow test only.

### I — Engagement

| Test ID | Role | Steps | Expected Result | Actual | PASS/FAIL | Tester | Date | Comments |
|---|---|---|---|---|---|---|---|---|
| SC-I-01 | Trainer | Open an engagement | The request detail and the current status are shown | | | | | |
| SC-I-02 | Trainer | Look for attendance and evaluation figures | They say **"unavailable"** with a reason. No invented numbers | | | | | |
| SC-I-03 | Trainer | Withdraw from an **upcoming** engagement inside the notice window, with a reason | Accepted; the slot re-opens to the next candidate | | | | | |
| SC-I-04 | Trainer | Try to withdraw from an engagement that has **started** | Refused, and the reason is shown | | | | | |
| SC-I-05 | Trainer | Try to withdraw inside 4 days of the start | Refused, and the deadline is shown | | | | | |
| SC-I-06 | Internal Staff | De-link an engagement inside 24 hours of the start | Refused, and the deadline is shown | | | | | |

### J — Public profile

| Test ID | Role | Steps | Expected Result | Actual | PASS/FAIL | Tester | Date | Comments |
|---|---|---|---|---|---|---|---|---|
| SC-J-01 | Trainer | In "My profile" → Visibility, turn consent **on** (confirm the dialog) | Consent is recorded | | | | | |
| SC-J-02 | Anonymous | Open the public directory **without signing in** | The trainer appears | | | | | |
| SC-J-03 | Anonymous | Open their public profile | Only name, specialties, delivered programmes, city, classification. **No** email, file status, evaluation or agreement | | | | | |
| SC-J-04 | Internal Staff | Suspend that trainer's agreement | — | | | | | |
| SC-J-05 | Anonymous | Reload the directory and the profile URL | They are **gone** from the list, and the profile URL returns "not found" | | | | | |
| SC-J-06 | Internal Staff | End (expire) another consenting trainer's agreement | — | | | | | |
| SC-J-07 | Anonymous | Reload | That trainer is also gone | | | | | |
| SC-J-08 | Trainer | Turn consent **off** | They disappear from the directory immediately | | | | | |

> The specialties list on every card is empty and the "specialties represented"
> count is always 0 (DEF-25) — the taxonomy has not been supplied. Expected.

### K — Notifications

| Test ID | Role | Steps | Expected Result | Actual | PASS/FAIL | Tester | Date | Comments |
|---|---|---|---|---|---|---|---|---|
| SC-K-01 | Internal Staff | Do something that should notify someone (submit an application, send an offer) | The **event is recorded**. Ask the team to show you the occurrence record | | | | | |
| SC-K-02 | Internal Staff | Check whether anyone was routed | **Nobody is routed.** No recipient is invented. This is expected — routing has not been approved (BD-UAT-06) | | | | | |
| SC-K-03 | Any | Check for an email | ⚠️ **No email will arrive.** There is no email gateway (EXT-05). Mark `BLOCKED` | | | | | |
| SC-K-04 | Any | Look for an in-platform inbox | ⚠️ **No inbox page exists** (DEF-11). Mark `BLOCKED` | | | | | |
| SC-K-05 | Internal Staff | Let an offer's response window expire | The offer expires **on time**, with no email involved | | | | | |

**Separate the two questions.** *Did the system record that something should be
communicated?* — yes, and that is testable. *Did a message reach a person?* — no,
and that is an external dependency, not a defect in this release.

---

## Section SEC — Security & authorization

*Acceptance coverage only. Do not attempt to break anything, and do not use
tools beyond the browser.*

| Test ID | Role | Steps | Expected Result | Actual | PASS/FAIL | Tester | Date | Comments |
|---|---|---|---|---|---|---|---|---|
| SEC-01 | Anonymous | While signed out, paste an internal page address into the browser | You are sent to sign in, never shown the page | | | | | |
| SEC-02 | Trainer | While signed in as a trainer, paste an internal page address | You are sent to an "unauthorized" page | | | | | |
| SEC-03 | Internal Staff | Open a page your role should not manage (e.g. roles and permissions) | ⚠️ The menu will offer it and the page will fail to load its data (DEF-26). Record what you see | | | | | |
| SEC-04 | Applicant B | Ask the team for Applicant A's application address, then open it | "Not found" — never someone else's data | | | | | |
| SEC-05 | Applicant B | Ask the team for a document link from Applicant A's application, then open it | Refused | | | | | |
| SEC-06 | Internal Staff | Open an applicant's uploaded CV from the screening screen | The document opens (or downloads). Staff are **not** refused *(DEF-04 fixed)* | | | | | |
| SEC-07 | Trainer | Open another trainer's profile address | Refused or not found | | | | | |
| SEC-08 | Anonymous | Open a non-consenting trainer's public profile address | "Not found" — the same answer as for a trainer who does not exist | | | | | |
| SEC-09 | System Administrator | Try to revoke the **last** administrator role | Refused | | | | | |
| SEC-10 | Any | Sign out, then press Back | You cannot reach a signed-in page | | | | | |

---

## Sign-off

| | Name | Role | Date | Signature |
|---|---|---|---|---|
| UAT lead | | | | |
| Business owner | | | | |
| Expert Hub lead | | | | |

**Summary**

| | Count |
|---|---|
| Tests run | |
| PASS | |
| FAIL | |
| BLOCKED | |

**Recommendation** ☐ Accept ☐ Accept with conditions ☐ Reject

---

Related: [`UAT_JOURNEY_MATRIX.md`](UAT_JOURNEY_MATRIX.md) ·
[`UAT_EXTERNAL_DEPENDENCIES.md`](UAT_EXTERNAL_DEPENDENCIES.md) ·
[`UAT_TRACEABILITY_MATRIX.md`](UAT_TRACEABILITY_MATRIX.md)
